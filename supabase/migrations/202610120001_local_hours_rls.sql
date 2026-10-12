begin;

-- Keep database authorization in sync with the checks performed by
-- src/app/profil/local-actions.ts. SECURITY DEFINER is required so the policy
-- can identify the signed-in member without depending on the members table's
-- own RLS policies.
create or replace function public.bde_can_manage_local_hours()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and exists (
      select 1
      from public.members as member
      where member.auth_user_id = auth.uid()
        and (
          (
            auth.jwt() ->> 'aal' = 'aal2'
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
          )
          or (
            member.category::text = 'bureau'
            and member.is_keyholder is true
            and (
              (
                member.role::text = 'vice_president_pole'
                and member.pole_id is not null
              )
              or exists (
                select 1
                from public.member_assignments as assignment
                where assignment.member_id = member.id
                  and assignment.is_vp is true
              )
            )
          )
        )
    );
$function$;

revoke all on function public.bde_can_manage_local_hours() from public, anon;
grant execute on function public.bde_can_manage_local_hours() to authenticated;

alter table public.local_hours_settings enable row level security;
alter table public.local_opening_shifts enable row level security;

-- These values are displayed on the public Contact page, in the floating
-- status panel and over the HelloAsso shop.
drop policy if exists "bde_local_hours_public_read" on public.local_hours_settings;
create policy "bde_local_hours_public_read"
  on public.local_hours_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "bde_local_shifts_public_read" on public.local_opening_shifts;
create policy "bde_local_shifts_public_read"
  on public.local_opening_shifts
  for select
  to anon, authenticated
  using (true);

-- A permissive policy is intentional: it adds the current application access
-- model even when an older permissive policy from the initial local-hours
-- migration is still present.
drop policy if exists "bde_local_hours_authorized_write" on public.local_hours_settings;
create policy "bde_local_hours_authorized_write"
  on public.local_hours_settings
  as permissive
  for all
  to authenticated
  using (public.bde_can_manage_local_hours())
  with check (public.bde_can_manage_local_hours());

drop policy if exists "bde_local_shifts_authorized_write" on public.local_opening_shifts;
create policy "bde_local_shifts_authorized_write"
  on public.local_opening_shifts
  as permissive
  for all
  to authenticated
  using (public.bde_can_manage_local_hours())
  with check (public.bde_can_manage_local_hours());

grant select on public.local_hours_settings, public.local_opening_shifts to anon, authenticated;
grant insert, update, delete on public.local_hours_settings, public.local_opening_shifts to authenticated;

commit;
