-- Hide family names on public member pages by default, while keeping the
-- complete name in the private BDE account. Apply the entire migration.
begin;

alter table public.members
  add column if not exists hide_last_name boolean not null default true;
alter table public.members alter column hide_last_name set default true;
update public.members set hide_last_name = true where hide_last_name is null;
alter table public.members alter column hide_last_name set not null;
comment on column public.members.hide_last_name is
  'True hides the family name on public pages; the full name remains stored for private BDE administration.';

-- Reinstall the exact board check and member guard so this SQL is also usable
-- from the dashboard without assuming migration 003 was already applied.
-- Only hide_last_name is added to the ordinary personal-profile allowlist.
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

-- Member authorization is a trust boundary for administrative actions. Existing
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

revoke all on function public.bde_admin_can_manage_poles() from public, anon, authenticated;
grant execute on function public.bde_admin_can_manage_poles() to authenticated;

notify pgrst, 'reload schema';
commit;
