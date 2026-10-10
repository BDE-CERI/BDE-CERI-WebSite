-- Marks events that should also appear in the eSports area and archive.
alter table public.events
  add column if not exists is_esport boolean not null default false;

create index if not exists events_is_esport_date_start_idx
  on public.events (date_start)
  where is_esport = true;

comment on column public.events.is_esport is
  'When true, the event is listed in the public eSports section and eSports archive.';
