-- Pole administration: authenticated board RPCs are the only ordinary write path.
-- Apply this entire migration in Supabase before using the pole management buttons.
begin;

-- Reconcile the two pole schemas documented in this repository.
alter table public.poles
  add column if not exists full_name text,
  add column if not exists full_content text default '',
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists order_index integer default 0;

update public.poles set full_name = name where full_name is null or btrim(full_name) = '';
alter table public.poles alter column full_name set not null;
alter table public.poles alter column order_index set default 0;

create or replace function public.bde_admin_can_manage_poles()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.members as member
    where member.auth_user_id = auth.uid()
      and (
        member.category::text = 'bureau_restreint'
        or member.role::text in ('president', 'tresorier', 'secretaire', 'vp_general')
      )
  );
$$;

-- Member authorization is a trust boundary for the RPCs below. Existing
-- permissive member policies must not allow a client to promote its own account.
-- This trigger supplements RLS; it does not grant access where RLS denies it.
create or replace function public.bde_protect_member_authorization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := nullif(auth.role(), '');
  v_user_id uuid := auth.uid();
  v_email text;
begin
  -- Keep trusted server administration and SQL maintenance usable. A client
  -- running as anon/authenticated cannot bypass this guard with an empty JWT.
  if v_jwt_role = 'service_role'
     or (v_jwt_role is null and coalesce(pg_catalog.current_setting('role', true), 'none') not in ('anon', 'authenticated')) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if v_jwt_role is distinct from 'authenticated' or v_user_id is null then
    raise exception using errcode = '42501', message = 'Member changes require an authenticated account.';
  end if;

  -- A BEFORE trigger and the stable helper see the actor's stored authorization
  -- before this row is changed; NEW role/category cannot grant board access.
  if public.bde_admin_can_manage_poles() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op <> 'UPDATE' then
    raise exception using errcode = '42501', message = 'Only the board may create or delete members.';
  end if;

  if old.auth_user_id = v_user_id then
    -- Match updateProfile's ordinary fields exactly. Everything else, including
    -- pole_id, rank, email, visibility, identifiers, and permissions is protected.
    if (pg_catalog.to_jsonb(new) - array[
          'first_name', 'last_name', 'bio', 'study_level', 'responsibilities',
          'academic_journey', 'discord', 'instagram', 'photo_url', 'hide_last_name', 'updated_at'
        ]::text[])
       is distinct from (pg_catalog.to_jsonb(old) - array[
          'first_name', 'last_name', 'bio', 'study_level', 'responsibilities',
          'academic_journey', 'discord', 'instagram', 'photo_url', 'hide_last_name', 'updated_at'
        ]::text[]) then
      raise exception using errcode = '42501', message = 'Members may change only their own personal profile fields.';
    end if;
    return new;
  end if;

  -- First sign-in may claim a pre-created member with the authenticated JWT's
  -- email. No simultaneous profile, email, role, or category changes are allowed.
  v_email := nullif(pg_catalog.btrim(auth.jwt() ->> 'email'), '');
  if old.auth_user_id is null and new.auth_user_id = v_user_id
     and v_email is not null
     and pg_catalog.lower(pg_catalog.btrim(old.email)) = pg_catalog.lower(v_email)
     and (pg_catalog.to_jsonb(new) - 'auth_user_id' - 'updated_at')
         is not distinct from (pg_catalog.to_jsonb(old) - 'auth_user_id' - 'updated_at') then
    return new;
  end if;
  raise exception using errcode = '42501', message = 'Members can update only their own profile or claim their matching email.';
end;
$$;

drop trigger if exists bde_members_protect_authorization on public.members;
create trigger bde_members_protect_authorization
before insert or update or delete on public.members
for each row execute function public.bde_protect_member_authorization();
revoke all on function public.bde_protect_member_authorization() from public, anon, authenticated;

create or replace function public.bde_admin_create_pole(
  p_name text,
  p_description text,
  p_full_content text default '',
  p_color text default '#7BD0FF',
  p_image_url text default null,
  p_order_index integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := pg_catalog.gen_random_uuid();
  v_name text := pg_catalog.btrim(p_name);
  v_description text := pg_catalog.btrim(p_description);
  v_slug text;
begin
  if not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'Pole administration is restricted to the board.';
  end if;
  if p_name is null or pg_catalog.char_length(v_name) not between 1 and 120
     or p_description is null or pg_catalog.char_length(v_description) not between 1 and 500
     or pg_catalog.char_length(coalesce(p_full_content, '')) > 100000
     or p_color is null or p_color !~ '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$'
     or p_order_index is null or p_order_index < 0 then
    raise exception using errcode = '22023', message = 'Invalid pole fields.';
  end if;

  -- A permanent UUID suffix avoids slug collisions without changing existing URLs.
  v_slug := pg_catalog.btrim(pg_catalog.regexp_replace(
    pg_catalog.translate(pg_catalog.lower(v_name), 'àâäçéèêëîïôöùûüÿ', 'aaaceeeeiioouuuy'),
    '[^a-z0-9]+', '-', 'g'
  ), '-');
  if v_slug = '' then v_slug := 'pole'; end if;
  v_slug := pg_catalog.left(v_slug, 80) || '-' || pg_catalog.replace(v_id::text, '-', '');

  insert into public.poles (id, name, slug, full_name, description, full_content, color, image_url, order_index, updated_at)
  values (v_id, v_name, v_slug, v_name, v_description, coalesce(p_full_content, ''), pg_catalog.upper(p_color), p_image_url, p_order_index, pg_catalog.now());
  return v_id;
end;
$$;

create or replace function public.bde_admin_update_pole(
  p_id uuid,
  p_name text,
  p_description text,
  p_full_content text default '',
  p_color text default '#7BD0FF',
  p_image_url text default null,
  p_order_index integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := pg_catalog.btrim(p_name);
  v_description text := pg_catalog.btrim(p_description);
begin
  if not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'Pole administration is restricted to the board.';
  end if;
  if p_id is null or p_name is null or pg_catalog.char_length(v_name) not between 1 and 120
     or p_description is null or pg_catalog.char_length(v_description) not between 1 and 500
     or pg_catalog.char_length(coalesce(p_full_content, '')) > 100000
     or p_color is null or p_color !~ '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$'
     or p_order_index is null or p_order_index < 0 then
    raise exception using errcode = '22023', message = 'Invalid pole fields.';
  end if;

  update public.poles as pole
  set name = v_name, full_name = v_name, description = v_description,
      full_content = coalesce(p_full_content, ''), color = pg_catalog.upper(p_color),
      image_url = p_image_url, order_index = p_order_index, updated_at = pg_catalog.now()
  where pole.id = p_id
  returning pole.id into v_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'The pole no longer exists.';
  end if;
  -- slug is intentionally preserved when the name changes.
  return v_id;
end;
$$;

create or replace function public.bde_admin_delete_pole(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'Pole administration is restricted to the board.';
  end if;
  if p_id is null then
    raise exception using errcode = '22023', message = 'Invalid pole identifier.';
  end if;

  -- Lock the referenced row while checking both assignment paths and deleting.
  -- FK inserts cannot attach another member between these checks and the delete.
  select pole.id into v_id from public.poles as pole where pole.id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'The pole no longer exists.';
  end if;
  if exists (select 1 from public.members as member where member.pole_id = p_id)
     or exists (select 1 from public.member_assignments as assignment where assignment.pole_id = p_id) then
    raise exception using errcode = '23503', message = 'Reassign the members and assignments before deleting this pole.';
  end if;

  delete from public.poles as pole where pole.id = p_id;
  return v_id;
end;
$$;

-- Legacy "Staff can manage poles" policies may remain, but cannot bypass grants.
-- Member writes retain their existing grants/RLS and are guarded by the trigger.
-- The service_role table grants are unaffected.
revoke insert, update, delete on table public.poles from public, anon, authenticated;
grant select on table public.poles to anon, authenticated;

revoke all on function public.bde_admin_can_manage_poles() from public, anon, authenticated;
revoke all on function public.bde_admin_create_pole(text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.bde_admin_update_pole(uuid, text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.bde_admin_delete_pole(uuid) from public, anon, authenticated;
grant execute on function public.bde_admin_can_manage_poles() to authenticated;
grant execute on function public.bde_admin_create_pole(text, text, text, text, text, integer) to authenticated;
grant execute on function public.bde_admin_update_pole(uuid, text, text, text, text, text, integer) to authenticated;
grant execute on function public.bde_admin_delete_pole(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
