-- Private account requests. Apply migration 003 (or its guard from 004) first.
-- This migration does not change either members.email or auth.users.email.
-- Activate bde_before_user_created_google_guard in Auth > Hooks separately.
begin;

do $$
begin
  if pg_catalog.to_regprocedure('public.bde_admin_can_manage_poles()') is null
     or not exists (
       select 1 from pg_catalog.pg_trigger as guard
       where guard.tgrelid = 'public.members'::regclass
         and guard.tgname = 'bde_members_protect_authorization'
         and not guard.tgisinternal
     ) then
    raise exception 'Apply 202610090003_pole_management.sql before 202610090005_account_settings.sql.';
  end if;
end;
$$;

create table if not exists public.member_email_change_requests (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  current_email text not null,
  requested_email text not null,
  reason text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default pg_catalog.now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_response text,
  constraint member_email_requests_status check (status in ('pending', 'resolved', 'rejected')),
  constraint member_email_requests_email_length check (
    pg_catalog.char_length(current_email) between 1 and 254
    and pg_catalog.char_length(requested_email) between 3 and 254
  ),
  constraint member_email_requests_text_length check (
    pg_catalog.char_length(reason) <= 2000
    and (review_response is null or pg_catalog.char_length(review_response) <= 2000)
  ),
  constraint member_email_requests_review_date check (
    (status = 'pending' and reviewed_at is null)
    or (status in ('resolved', 'rejected') and reviewed_at is not null)
  )
);
alter table public.member_email_change_requests owner to postgres;
create unique index if not exists member_email_requests_one_pending
  on public.member_email_change_requests(member_id) where status = 'pending';
create index if not exists member_email_requests_requester_created
  on public.member_email_change_requests(requested_by, created_at desc);
create index if not exists member_email_requests_status_created
  on public.member_email_change_requests(status, created_at desc);

alter table public.member_email_change_requests enable row level security;
drop policy if exists "Member or board reads email requests" on public.member_email_change_requests;
create policy "Member or board reads email requests"
  on public.member_email_change_requests for select to authenticated
  using (requested_by = auth.uid() or public.bde_admin_can_manage_poles());
-- Neither public visitors nor clients can insert, edit, or delete requests directly.
revoke all on table public.member_email_change_requests from public, anon, authenticated;
grant select on table public.member_email_change_requests to authenticated;

create or replace function public.bde_request_email_change(
  p_requested_email text,
  p_reason text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_member_id uuid;
  v_member_email text;
  v_current_email text;
  v_requested_email text := pg_catalog.btrim(p_requested_email);
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
  v_id uuid;
begin
  if auth.role() is distinct from 'authenticated' or v_user_id is null then
    raise exception using errcode = '42501', message = 'BDE_EMAIL_MEMBER_REQUIRED';
  end if;
  if p_requested_email is null
     or pg_catalog.char_length(v_requested_email) not between 3 and 254
     or v_requested_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or pg_catalog.char_length(v_reason) > 2000 then
    raise exception using errcode = '22023', message = 'BDE_EMAIL_INVALID_FIELDS';
  end if;

  -- The member lock serializes concurrent submissions before the pending check.
  -- Require exactly one linked profile; never choose an arbitrary duplicated link.
  begin
    select member.id, member.email into strict v_member_id, v_member_email
    from public.members as member where member.auth_user_id = v_user_id for update;
  exception
    when no_data_found or too_many_rows then
      raise exception using errcode = '42501', message = 'BDE_EMAIL_MEMBER_REQUIRED';
  end;
  select account.email into v_current_email from auth.users as account
  where account.id = v_user_id for share;
  v_current_email := pg_catalog.btrim(v_current_email);
  if not found or v_current_email is null or v_current_email = ''
     or pg_catalog.char_length(v_current_email) > 254 then
    raise exception using errcode = 'P0001', message = 'BDE_EMAIL_CURRENT_UNAVAILABLE';
  end if;
  if pg_catalog.lower(v_current_email) = pg_catalog.lower(v_requested_email)
     and pg_catalog.lower(pg_catalog.btrim(v_member_email)) = pg_catalog.lower(v_requested_email) then
    raise exception using errcode = 'P0001', message = 'BDE_EMAIL_ALREADY_CURRENT';
  end if;
  if exists (select 1 from public.member_email_change_requests as request
             where request.member_id = v_member_id and request.status = 'pending') then
    raise exception using errcode = '23505', message = 'BDE_EMAIL_PENDING_EXISTS';
  end if;

  insert into public.member_email_change_requests(member_id, requested_by, current_email, requested_email, reason)
  values (v_member_id, v_user_id, v_current_email, v_requested_email, v_reason)
  returning id into v_id;
  return v_id;
end;
$$;
alter function public.bde_request_email_change(text, text) owner to postgres;

create or replace function public.bde_review_email_change_request(
  p_request_id uuid,
  p_status text,
  p_response text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.member_email_change_requests%rowtype;
  v_member_email text;
  v_member_auth_id uuid;
  v_auth_email text;
  v_response text := pg_catalog.btrim(coalesce(p_response, ''));
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null
     or not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'BDE_EMAIL_BOARD_REQUIRED';
  end if;
  if p_request_id is null or p_status is null or p_status not in ('resolved', 'rejected')
     or pg_catalog.char_length(v_response) > 2000 then
    raise exception using errcode = '22023', message = 'BDE_EMAIL_INVALID_FIELDS';
  end if;

  select request.* into v_request from public.member_email_change_requests as request
  where request.id = p_request_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'BDE_EMAIL_REQUEST_UNAVAILABLE';
  end if;
  if v_request.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'BDE_EMAIL_ALREADY_REVIEWED';
  end if;

  if p_status = 'resolved' then
    -- Keep the actual emails stable until the request status commits.
    select member.email, member.auth_user_id into v_member_email, v_member_auth_id
    from public.members as member where member.id = v_request.member_id for share;
    if not found or v_member_auth_id is distinct from v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'BDE_EMAIL_LINK_CHANGED';
    end if;
    select account.email into v_auth_email from auth.users as account
    where account.id = v_request.requested_by for share;
    if not found or v_auth_email is null or v_member_email is null
       or pg_catalog.lower(pg_catalog.btrim(v_auth_email)) <> pg_catalog.lower(v_request.requested_email)
       or pg_catalog.lower(pg_catalog.btrim(v_member_email)) <> pg_catalog.lower(v_request.requested_email) then
      raise exception using errcode = 'P0001', message = 'BDE_EMAIL_NOT_UPDATED';
    end if;
  end if;

  -- This function only records the review; email changes happen outside the app.
  update public.member_email_change_requests
  set status = p_status, review_response = v_response,
      reviewed_at = pg_catalog.now(), reviewed_by = auth.uid()
  where id = p_request_id;
  return p_request_id;
end;
$$;
alter function public.bde_review_email_change_request(uuid, text, text) owner to postgres;

revoke all on function public.bde_request_email_change(text, text) from public, anon, authenticated;
revoke all on function public.bde_review_email_change_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.bde_request_email_change(text, text) to authenticated;
grant execute on function public.bde_review_email_change_request(uuid, text, text) to authenticated;

-- Before User Created is invoked only for a new Auth user. It does not run for
-- sign-in or explicit identity linking on an already existing account.
-- Configure this hook in Supabase Auth > Hooks after applying this migration.
create or replace function public.bde_before_user_created_google_guard(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_metadata jsonb := event -> 'user' -> 'app_metadata';
  v_identities jsonb := event -> 'user' -> 'identities';
begin
  if pg_catalog.lower(coalesce(v_metadata ->> 'provider', '')) = 'google'
     or exists (
       select 1 from pg_catalog.jsonb_array_elements_text(
         case when pg_catalog.jsonb_typeof(v_metadata -> 'providers') = 'array'
           then v_metadata -> 'providers' else '[]'::jsonb end
       ) as provider(name) where pg_catalog.lower(provider.name) = 'google'
     )
     or exists (
       select 1 from pg_catalog.jsonb_array_elements(
         case when pg_catalog.jsonb_typeof(v_identities) = 'array'
           then v_identities else '[]'::jsonb end
       ) as identity(value) where pg_catalog.lower(identity.value ->> 'provider') = 'google'
     ) then
    return pg_catalog.jsonb_build_object('error', pg_catalog.jsonb_build_object(
      'http_code', 403,
      'message', 'Google sign-in is restricted to existing BDE accounts. Link Google from your BDE account settings first.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;
alter function public.bde_before_user_created_google_guard(jsonb) owner to postgres;
revoke all on function public.bde_before_user_created_google_guard(jsonb) from public, anon, authenticated, service_role;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.bde_before_user_created_google_guard(jsonb) to supabase_auth_admin;

notify pgrst, 'reload schema';
commit;
