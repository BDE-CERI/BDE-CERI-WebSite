-- Paid registrations use an event price and an existing HelloAsso checkout.
-- Apply migrations 003 and 006 first. No payment is confirmed by this migration:
-- opening the checkout, or returning from it, is NOT proof of a completed payment.
begin;

do $$
begin
  if pg_catalog.to_regclass('public.event_registrations') is null
     or pg_catalog.to_regprocedure('public.bde_event_registration_status(uuid)') is null
     or pg_catalog.to_regprocedure('public.bde_register_for_event(uuid)') is null
     or pg_catalog.to_regprocedure('public.bde_cancel_event_registration(uuid)') is null
     or pg_catalog.to_regprocedure('public.bde_admin_can_manage_poles()') is null then
    raise exception 'Apply 202610090003_pole_management.sql and 202610090006_event_registrations.sql before 202610090007_paid_event_registrations.sql.';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_trigger as guard
    where guard.tgrelid = 'public.members'::regclass
      and guard.tgname = 'bde_members_protect_authorization'
      and not guard.tgisinternal
  ) then
    raise exception 'The member authorization guard from migration 003 is required.';
  end if;
end;
$$;

alter table public.events
  add column if not exists registration_is_paid boolean not null default false,
  add column if not exists registration_price_cents integer,
  add column if not exists helloasso_checkout_url text;
alter table public.events
  alter column registration_is_paid set default false,
  alter column registration_is_paid set not null;

alter table public.events drop constraint if exists events_registration_payment_configuration;
alter table public.events add constraint events_registration_payment_configuration check (
  (
    not registration_is_paid
    and registration_price_cents is null
    and helloasso_checkout_url is null
  )
  or (
    registration_is_paid
    and registration_price_cents is not null
    and registration_price_cents > 0
    and helloasso_checkout_url is not null
    and pg_catalog.char_length(helloasso_checkout_url) <= 2048
    -- Exact HTTPS authorities, no credentials, subdomains or non-443 ports.
    -- Require a non-root path and printable ASCII; non-ASCII must be encoded.
    and helloasso_checkout_url ~* '^https://(www[.])?helloasso[.]com(:443)?/[^?#][!-~]*$'
    and helloasso_checkout_url ~ '^[!-~]+$'
    and pg_catalog.strpos(helloasso_checkout_url, pg_catalog.chr(92)) = 0
    -- Reject URL dot-segment normalization, including encoded dot segments.
    and helloasso_checkout_url !~* '(^|/)([.]|%2e){1,2}(/|[?#]|$)'
  )
);

-- Existing registrations remain free. Later edits to an event never rewrite
-- its attendee snapshots. These amounts record what was due when registering,
-- and must not be displayed as a verified receipt.
alter table public.event_registrations
  add column if not exists payment_required boolean not null default false,
  add column if not exists payment_amount_cents integer;
alter table public.event_registrations
  alter column payment_required set default false,
  alter column payment_required set not null;
alter table public.event_registrations drop constraint if exists event_registrations_payment_snapshot;
alter table public.event_registrations add constraint event_registrations_payment_snapshot check (
  (not payment_required and payment_amount_cents is null)
  or (payment_required and payment_amount_cents is not null and payment_amount_cents > 0)
);

-- Public totals plus the caller's own status only; no attendee identities.
create or replace function public.bde_event_registration_status(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_user_id uuid := auth.uid();
  v_member_id uuid;
  v_member_eligible boolean := false;
  v_registered_at timestamptz;
  v_payment_required boolean;
  v_payment_amount_cents integer;
  v_count bigint;
begin
  select event.* into v_event
  from public.events as event where event.id = p_event_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND';
  end if;

  v_payment_required := v_event.registration_is_paid;
  v_payment_amount_cents := v_event.registration_price_cents;

  if auth.role() = 'authenticated' and v_user_id is not null then
    begin
      select member.id into strict v_member_id
      from public.members as member where member.auth_user_id = v_user_id;
      v_member_eligible := true;
    exception
      when no_data_found or too_many_rows then
        v_member_eligible := false;
    end;
    if v_member_eligible then
      select registration.registered_at, registration.payment_required,
             registration.payment_amount_cents
      into v_registered_at, v_payment_required, v_payment_amount_cents
      from public.event_registrations as registration
      where registration.event_id = p_event_id
        and registration.auth_user_id = v_user_id
        and registration.member_id = v_member_id;
      if not found then
        v_payment_required := v_event.registration_is_paid;
        v_payment_amount_cents := v_event.registration_price_cents;
      end if;
    end if;
  end if;

  select pg_catalog.count(*) into v_count
  from public.event_registrations as registration
  where registration.event_id = p_event_id;

  return pg_catalog.jsonb_build_object(
    'event_id', v_event.id,
    'registered', v_registered_at is not null,
    'registered_at', v_registered_at,
    'registrations_count', v_count,
    'max_capacity', case when v_event.max_capacity > 0 then v_event.max_capacity else null end,
    'registration_open', v_event.status::text = 'upcoming' and v_event.date_start > pg_catalog.clock_timestamp(),
    'member_eligible', v_member_eligible,
    'payment_required', v_payment_required,
    'payment_amount_cents', v_payment_amount_cents,
    -- If an administrator removes the checkout, retain the original amount
    -- and let the UI direct this member to the board rather than mark it free.
    'checkout_url', case when v_payment_required then v_event.helloasso_checkout_url else null end
  );
end;
$$;
alter function public.bde_event_registration_status(uuid) owner to postgres;

create or replace function public.bde_register_for_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_member_id uuid;
  v_event public.events%rowtype;
  v_count bigint;
begin
  if auth.role() is distinct from 'authenticated' or v_user_id is null then
    raise exception using errcode = '42501', message = 'ER_AUTH_REQUIRED';
  end if;

  begin
    -- Keep the authenticated member link unchanged until this transaction ends.
    select member.id into strict v_member_id
    from public.members as member where member.auth_user_id = v_user_id for share;
  exception
    when no_data_found or too_many_rows then
      raise exception using errcode = '42501', message = 'ER_MEMBER_REQUIRED';
  end;

  -- Register and cancel lock the SAME event row. This serializes capacity
  -- checks, including concurrent clicks from different accounts, with inserts.
  select event.* into v_event
  from public.events as event where event.id = p_event_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.event_registrations as registration
    where registration.event_id = p_event_id
      and registration.member_id = v_member_id
      and registration.auth_user_id = v_user_id
  ) then
    return public.bde_event_registration_status(p_event_id);
  end if;

  -- A later administrative reassignment of an Auth link cannot transfer an
  -- existing registration to a different person or create duplicate attendees.
  if exists (
    select 1 from public.event_registrations as registration
    where registration.event_id = p_event_id
      and (registration.member_id = v_member_id or registration.auth_user_id = v_user_id)
  ) then
    raise exception using errcode = '42501', message = 'ER_MEMBER_REQUIRED';
  end if;

  if v_event.status::text is distinct from 'upcoming'
     or v_event.date_start <= pg_catalog.clock_timestamp() then
    raise exception using errcode = 'P0001', message = 'ER_CLOSED';
  end if;
  if v_event.max_capacity > 0 then
    select pg_catalog.count(*) into v_count
    from public.event_registrations as registration
    where registration.event_id = p_event_id;
    if v_count >= v_event.max_capacity then
      raise exception using errcode = 'P0001', message = 'ER_FULL';
    end if;
  end if;

  -- Both unique constraints are also enforced by PostgreSQL, independently of
  -- the button state or client-provided values. Identity is derived above.
  -- Snapshot the configuration from the locked event row. Existing (including
  -- repeated) registrations preserve their original price. This is not a
  -- confirmation of payment; HelloAsso settlement must be reconciled separately.
  insert into public.event_registrations(
    event_id, member_id, auth_user_id, payment_required, payment_amount_cents
  ) values (
    p_event_id, v_member_id, v_user_id,
    v_event.registration_is_paid, v_event.registration_price_cents
  );
  return public.bde_event_registration_status(p_event_id);
end;
$$;
alter function public.bde_register_for_event(uuid) owner to postgres;

create or replace function public.bde_admin_list_event_registrations(
  p_event_id uuid,
  p_offset integer default 0,
  p_limit integer default 50,
  p_query text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_query text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_query, '')));
  v_result jsonb;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null
     or not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'ER_FORBIDDEN';
  end if;
  if pg_catalog.char_length(v_query) > 200 then
    raise exception using errcode = '22023', message = 'ER_INVALID_QUERY';
  end if;
  if not exists (select 1 from public.events as event where event.id = p_event_id) then
    raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND';
  end if;

  -- Count and page share a statement snapshot. Literal substring matching
  -- avoids treating "%" and "_" in search input as SQL wildcard operators.
  with matched as materialized (
    select registration.id, registration.member_id,
           member.first_name, member.last_name, member.photo_url,
           coalesce(member.is_visible, false) as is_visible,
           registration.registered_at,
           registration.payment_required, registration.payment_amount_cents
    from public.event_registrations as registration
    join public.members as member on member.id = registration.member_id
    where registration.event_id = p_event_id
      and (
        v_query = ''
        or pg_catalog.strpos(pg_catalog.lower(member.first_name || ' ' || member.last_name), v_query) > 0
        or pg_catalog.strpos(pg_catalog.lower(member.last_name || ' ' || member.first_name), v_query) > 0
      )
  ), page as (
    select * from matched
    order by registered_at asc, id asc
    offset v_offset limit v_limit
  )
  select pg_catalog.jsonb_build_object(
    'total', (select pg_catalog.count(*) from matched),
    'registrations', coalesce(
      (select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(page) order by page.registered_at asc, page.id asc) from page),
      '[]'::jsonb
    )
  ) into v_result;
  return v_result;
end;
$$;
alter function public.bde_admin_list_event_registrations(uuid, integer, integer, text) owner to postgres;


-- Keep registration data private and inaccessible to direct client mutations.
alter table public.event_registrations owner to postgres;
alter table public.event_registrations enable row level security;
revoke all on table public.event_registrations from public, anon, authenticated;
grant select on table public.event_registrations to authenticated;

revoke all on function public.bde_event_registration_status(uuid) from public, anon, authenticated;
revoke all on function public.bde_register_for_event(uuid) from public, anon, authenticated;
revoke all on function public.bde_cancel_event_registration(uuid) from public, anon, authenticated;
revoke all on function public.bde_admin_list_event_registrations(uuid, integer, integer, text) from public, anon, authenticated;
grant execute on function public.bde_event_registration_status(uuid) to anon, authenticated;
grant execute on function public.bde_register_for_event(uuid) to authenticated;
grant execute on function public.bde_cancel_event_registration(uuid) to authenticated;
grant execute on function public.bde_admin_list_event_registrations(uuid, integer, integer, text) to authenticated;

notify pgrst, 'reload schema';
commit;
