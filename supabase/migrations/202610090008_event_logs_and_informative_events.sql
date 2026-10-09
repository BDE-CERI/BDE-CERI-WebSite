-- Informational events and an append-only board audit trail for signup changes.
begin;

do $$ begin
  if pg_catalog.to_regclass('public.event_registrations') is null
     or pg_catalog.to_regprocedure('public.bde_event_registration_status(uuid)') is null
     or pg_catalog.to_regprocedure('public.bde_register_for_event(uuid)') is null
     or pg_catalog.to_regprocedure('public.bde_cancel_event_registration(uuid)') is null
     or pg_catalog.to_regprocedure('public.bde_admin_can_manage_poles()') is null then
    raise exception 'Apply migrations 003, 006 and 007 before 202610090008_event_logs_and_informative_events.sql.';
  end if;
end $$;

alter table public.events add column if not exists registration_enabled boolean not null default true;
alter table public.events alter column registration_enabled set default true;
alter table public.events alter column registration_enabled set not null;

-- Event/member names are snapshots so a deleted event/member does not erase its audit trail.
create table if not exists public.event_registration_logs (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  event_title text not null,
  member_id uuid references public.members(id) on delete set null,
  action text not null check (action in ('registered', 'unregistered')),
  payment_required boolean not null,
  payment_amount_cents integer,
  logged_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint event_registration_logs_payment_snapshot check (
    (not payment_required and payment_amount_cents is null)
    or (payment_required and payment_amount_cents is not null and payment_amount_cents > 0)
  )
);
alter table public.event_registration_logs owner to postgres;
create index if not exists event_registration_logs_event_time
  on public.event_registration_logs(event_id, logged_at desc, id desc);
create index if not exists event_registration_logs_time
  on public.event_registration_logs(logged_at desc, id desc);
alter table public.event_registration_logs enable row level security;
revoke all on table public.event_registration_logs from public, anon, authenticated;
grant select on table public.event_registration_logs to authenticated;

create or replace function public.bde_event_registration_status(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_event public.events%rowtype;
  v_user_id uuid := auth.uid();
  v_member_id uuid;
  v_member_eligible boolean := false;
  v_registered_at timestamptz;
  v_payment_required boolean;
  v_payment_amount_cents integer;
  v_checkout_url text;
  v_count bigint;
begin
  select event.* into v_event from public.events as event where event.id = p_event_id;
  if not found then raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND'; end if;
  v_payment_required := v_event.registration_is_paid;
  v_payment_amount_cents := v_event.registration_price_cents;
  v_checkout_url := v_event.helloasso_checkout_url;
  if auth.role() = 'authenticated' and v_user_id is not null then
    begin
      select member.id into strict v_member_id from public.members as member where member.auth_user_id = v_user_id;
      v_member_eligible := true;
    exception when no_data_found or too_many_rows then v_member_eligible := false;
    end;
    if v_member_eligible then
      select registration.registered_at, registration.payment_required,
             registration.payment_amount_cents
        into v_registered_at, v_payment_required, v_payment_amount_cents
      from public.event_registrations as registration
      where registration.event_id = p_event_id and registration.auth_user_id = v_user_id
        and registration.member_id = v_member_id;
      if found then
        -- Never send a stale registration to a checkout at a changed amount.
        if not v_event.registration_is_paid
           or v_event.registration_price_cents is distinct from v_payment_amount_cents then
          v_checkout_url := null;
        end if;
      else
        v_payment_required := v_event.registration_is_paid;
        v_payment_amount_cents := v_event.registration_price_cents;
      end if;
    end if;
  end if;
  select pg_catalog.count(*) into v_count from public.event_registrations as registration where registration.event_id = p_event_id;
  return pg_catalog.jsonb_build_object(
    'event_id', v_event.id, 'registered', v_registered_at is not null,
    'registered_at', v_registered_at, 'registrations_count', v_count,
    'max_capacity', case when v_event.max_capacity > 0 then v_event.max_capacity else null end,
    'registration_open', v_event.status::text = 'upcoming' and v_event.date_start > pg_catalog.clock_timestamp(),
    'registration_enabled', v_event.registration_enabled,
    'member_eligible', v_member_eligible, 'payment_required', v_payment_required,
    'payment_amount_cents', v_payment_amount_cents,
    'checkout_url', case when v_payment_required then v_checkout_url else null end
  );
end;
$$;
alter function public.bde_event_registration_status(uuid) owner to postgres;

create or replace function public.bde_register_for_event(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid(); v_member_id uuid; v_event public.events%rowtype; v_count bigint; v_member public.members%rowtype;
begin
  if auth.role() is distinct from 'authenticated' or v_user_id is null then raise exception using errcode = '42501', message = 'ER_AUTH_REQUIRED'; end if;
  begin
    select member.* into strict v_member from public.members as member where member.auth_user_id = v_user_id for share;
    v_member_id := v_member.id;
  exception when no_data_found or too_many_rows then raise exception using errcode = '42501', message = 'ER_MEMBER_REQUIRED';
  end;
  select event.* into v_event from public.events as event where event.id = p_event_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND'; end if;
  if exists (select 1 from public.event_registrations as registration where registration.event_id = p_event_id and registration.member_id = v_member_id and registration.auth_user_id = v_user_id) then
    return public.bde_event_registration_status(p_event_id);
  end if;
  if exists (select 1 from public.event_registrations as registration where registration.event_id = p_event_id and (registration.member_id = v_member_id or registration.auth_user_id = v_user_id)) then
    raise exception using errcode = '42501', message = 'ER_MEMBER_REQUIRED';
  end if;
  if not v_event.registration_enabled or v_event.status::text is distinct from 'upcoming' or v_event.date_start <= pg_catalog.clock_timestamp() then
    raise exception using errcode = 'P0001', message = 'ER_CLOSED';
  end if;
  if v_event.max_capacity > 0 then
    select pg_catalog.count(*) into v_count from public.event_registrations as registration where registration.event_id = p_event_id;
    if v_count >= v_event.max_capacity then raise exception using errcode = 'P0001', message = 'ER_FULL'; end if;
  end if;
  insert into public.event_registrations(event_id, member_id, auth_user_id, payment_required, payment_amount_cents)
  values (p_event_id, v_member_id, v_user_id, v_event.registration_is_paid, v_event.registration_price_cents);
  insert into public.event_registration_logs(event_id, event_title, member_id, action, payment_required, payment_amount_cents)
  values (p_event_id, v_event.title, v_member_id, 'registered', v_event.registration_is_paid, v_event.registration_price_cents);
  return public.bde_event_registration_status(p_event_id);
end;
$$;
alter function public.bde_register_for_event(uuid) owner to postgres;

create or replace function public.bde_cancel_event_registration(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid(); v_member public.members%rowtype; v_event public.events%rowtype;
  v_registration public.event_registrations%rowtype;
begin
  if auth.role() is distinct from 'authenticated' or v_user_id is null then raise exception using errcode = '42501', message = 'ER_AUTH_REQUIRED'; end if;
  begin
    select member.* into strict v_member from public.members as member where member.auth_user_id = v_user_id for share;
  exception when no_data_found or too_many_rows then raise exception using errcode = '42501', message = 'ER_MEMBER_REQUIRED';
  end;
  select event.* into v_event from public.events as event where event.id = p_event_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND'; end if;
  select registration.* into v_registration from public.event_registrations as registration
    where registration.event_id = p_event_id and registration.member_id = v_member.id and registration.auth_user_id = v_user_id for update;
  if not found then return public.bde_event_registration_status(p_event_id); end if;
  if v_event.status::text is distinct from 'upcoming' or v_event.date_start <= pg_catalog.clock_timestamp() then
    raise exception using errcode = 'P0001', message = 'ER_CLOSED';
  end if;
  insert into public.event_registration_logs(event_id, event_title, member_id, action, payment_required, payment_amount_cents)
  values (p_event_id, v_event.title, v_member.id, 'unregistered', v_registration.payment_required, v_registration.payment_amount_cents);
  delete from public.event_registrations as registration where registration.id = v_registration.id;
  return public.bde_event_registration_status(p_event_id);
end;
$$;
alter function public.bde_cancel_event_registration(uuid) owner to postgres;

create or replace function public.bde_admin_list_event_registration_logs(
  p_event_id uuid default null, p_offset integer default 0, p_limit integer default 100
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 100);
  v_total bigint; v_rows jsonb;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null or not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'ER_FORBIDDEN';
  end if;
  if p_event_id is not null and not exists(select 1 from public.events where id = p_event_id) then
    raise exception using errcode = 'P0002', message = 'ER_EVENT_NOT_FOUND';
  end if;
  select pg_catalog.count(*) into v_total from public.event_registration_logs log
    where p_event_id is null or log.event_id = p_event_id;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', log.id, 'event_id', log.event_id, 'event_title', log.event_title,
    'member_id', log.member_id,
    'member_name', coalesce(nullif(pg_catalog.concat_ws(' ', member.first_name, member.last_name), ''), 'Profil supprimé'),
    'action', log.action, 'payment_required', log.payment_required,
    'payment_amount_cents', log.payment_amount_cents, 'logged_at', log.logged_at
  ) order by log.logged_at desc, log.id desc), '[]'::jsonb) into v_rows
  from (select * from public.event_registration_logs log
    where p_event_id is null or log.event_id = p_event_id
    order by log.logged_at desc, log.id desc offset v_offset limit v_limit) log
  left join public.members as member on member.id = log.member_id;
  return pg_catalog.jsonb_build_object('total', v_total, 'logs', v_rows);
end;
$$;
alter function public.bde_admin_list_event_registration_logs(uuid, integer, integer) owner to postgres;
revoke all on function public.bde_event_registration_status(uuid) from public, anon, authenticated;
revoke all on function public.bde_register_for_event(uuid) from public, anon, authenticated;
revoke all on function public.bde_cancel_event_registration(uuid) from public, anon, authenticated;
revoke all on function public.bde_admin_list_event_registration_logs(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.bde_event_registration_status(uuid) to anon, authenticated;
grant execute on function public.bde_register_for_event(uuid) to authenticated;
grant execute on function public.bde_cancel_event_registration(uuid) to authenticated;
grant execute on function public.bde_admin_list_event_registration_logs(uuid, integer, integer) to authenticated;
notify pgrst, 'reload schema';
commit;
