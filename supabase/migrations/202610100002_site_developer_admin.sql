begin;

alter table public.members
  add column if not exists is_dev boolean not null default false;

alter table public.members
  drop constraint if exists members_is_dev_not_restricted_board;
alter table public.members
  add constraint members_is_dev_not_restricted_board
  check (not is_dev or category::text is distinct from 'bureau_restreint');

comment on column public.members.is_dev is
  'Grants site administration to a developer who is not a member of the restricted board. Manage this flag directly in the database.';

-- Keep the database authorization check in sync with the application. Existing
-- database policies and admin RPCs that call this function then also recognize
-- the dedicated developer account.
create or replace function public.bde_admin_can_manage_poles()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and auth.jwt() ->> 'aal' = 'aal2'
    and exists (
    select 1
    from public.members as member
    where member.auth_user_id = auth.uid()
      and (
        member.is_dev is true
        or member.category::text = 'bureau_restreint'
        or member.role::text = any (array[
          'president',
          'premier_vice_president',
          'vice_president_general',
          'tresorier',
          'secretaire',
          'vp_general'
        ])
      )
  );
$function$;

revoke all on function public.bde_admin_can_manage_poles() from public, anon;
grant execute on function public.bde_admin_can_manage_poles() to authenticated;

-- The is_dev flag is intentionally database-managed. Members, including site
-- admins, cannot grant themselves this access through the application API.
create or replace function public.bde_members_protect_is_dev()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user not in ('postgres', 'supabase_admin') then
    if tg_op = 'INSERT' then
      if new.is_dev is true then
        raise exception using
          errcode = '42501',
          message = 'The is_dev flag can only be changed directly by a database administrator.';
      end if;
    elsif new.is_dev is distinct from old.is_dev then
      raise exception using
        errcode = '42501',
        message = 'The is_dev flag can only be changed directly by a database administrator.';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists bde_members_protect_is_dev on public.members;
create trigger bde_members_protect_is_dev
  before insert or update on public.members
  for each row execute function public.bde_members_protect_is_dev();

commit;
