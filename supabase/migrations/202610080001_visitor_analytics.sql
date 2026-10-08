-- Opt-in visitor metrics: no raw IP or user-agent is persisted.
create table if not exists public.visitor_daily_visits (
  visit_date date not null,
  visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
  device_type text not null check (device_type in ('mobile', 'tablet', 'desktop')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (visit_date, visitor_hash)
);

create table if not exists public.visitor_stats_totals (
  id smallint primary key check (id = 1),
  total_visits bigint not null default 0
);
insert into public.visitor_stats_totals (id, total_visits) values (1, 0) on conflict (id) do nothing;

create table if not exists public.visitor_daily_totals (
  visit_date date primary key,
  unique_visits bigint not null default 0
);

create table if not exists public.visitor_device_totals (
  device_type text primary key check (device_type in ('mobile', 'tablet', 'desktop')),
  visit_count bigint not null default 0
);

alter table public.visitor_daily_visits enable row level security;
alter table public.visitor_stats_totals enable row level security;
alter table public.visitor_daily_totals enable row level security;
alter table public.visitor_device_totals enable row level security;

revoke all on public.visitor_daily_visits, public.visitor_stats_totals, public.visitor_daily_totals, public.visitor_device_totals from anon, authenticated;
grant all on public.visitor_daily_visits, public.visitor_stats_totals, public.visitor_daily_totals, public.visitor_device_totals to service_role;

create or replace function public.record_visitor_visit(p_visit_date date, p_visitor_hash text, p_device_type text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  if p_visit_date is null or p_visitor_hash is null or p_device_type is null
     or p_visit_date <> (now() at time zone 'utc')::date
     or p_visitor_hash !~ '^[a-f0-9]{64}$'
     or p_device_type not in ('mobile', 'tablet', 'desktop') then
    raise exception 'Invalid visitor metric input';
  end if;

  -- Keep pseudonymous deduplication keys only for dates with current activity.
  delete from public.visitor_daily_visits where visit_date < p_visit_date;

  insert into public.visitor_daily_visits (visit_date, visitor_hash, device_type)
  values (p_visit_date, p_visitor_hash, p_device_type)
  on conflict (visit_date, visitor_hash) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    update public.visitor_daily_visits
      set last_seen = now()
      where visit_date = p_visit_date and visitor_hash = p_visitor_hash;
    return false;
  end if;

  insert into public.visitor_daily_totals (visit_date, unique_visits)
    values (p_visit_date, 1)
    on conflict (visit_date) do update
      set unique_visits = public.visitor_daily_totals.unique_visits + 1;
  update public.visitor_stats_totals set total_visits = total_visits + 1 where id = 1;
  insert into public.visitor_device_totals (device_type, visit_count)
    values (p_device_type, 1)
    on conflict (device_type) do update
      set visit_count = public.visitor_device_totals.visit_count + 1;
  return true;
end;
$$;

revoke all on function public.record_visitor_visit(date, text, text) from public, anon, authenticated;
grant execute on function public.record_visitor_visit(date, text, text) to service_role;
