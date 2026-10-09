-- Keep the selected author for internal attribution; this flag hides the public signature.
-- Apply this migration to Supabase before saving the anonymity setting from the site.
begin;

alter table public.news
  add column if not exists is_anonymous boolean not null default false;

-- Also make an already-created nullable boolean column follow the same contract.
alter table public.news
  alter column is_anonymous set default false;
update public.news set is_anonymous = false where is_anonymous is null;
alter table public.news
  alter column is_anonymous set not null;

comment on column public.news.is_anonymous is
  'Whether the public author signature is hidden. author_id remains the internal attribution.';

-- PostgREST receives this notification when the transaction commits.
notify pgrst, 'reload schema';

commit;
