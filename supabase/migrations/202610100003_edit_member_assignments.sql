begin;

do $migration$
begin
  if pg_catalog.to_regprocedure('public.bde_admin_add_member_assignment(uuid,uuid,text,boolean,text,text)') is null
     or pg_catalog.to_regprocedure('public.bde_admin_delete_member_assignment(uuid)') is null then
    raise exception 'Install the existing multi-role assignment add/delete functions before this migration.';
  end if;
end;
$migration$;

-- Reuse the existing atomic add/delete routines so editing an assignment also
-- recomputes members.category, members.role, members.role_label and pole_id.
create or replace function public.bde_admin_update_member_assignment(
  p_id uuid,
  p_role text,
  p_is_vp boolean,
  p_role_label text,
  p_role_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_member_id uuid;
  v_pole_id uuid;
  v_deleted_member_id uuid;
  v_new_assignment_id uuid;
begin
  if auth.role() is distinct from 'authenticated'
     or auth.uid() is null
     or not public.bde_admin_can_manage_poles() then
    raise exception using errcode = '42501', message = 'Site administrator access is required.';
  end if;

  select assignment.member_id, assignment.pole_id
    into v_member_id, v_pole_id
  from public.member_assignments as assignment
  where assignment.id = p_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ASSIGNMENT_NOT_FOUND';
  end if;

  v_deleted_member_id := public.bde_admin_delete_member_assignment(p_id);
  if v_deleted_member_id is distinct from v_member_id then
    raise exception using errcode = 'P0001', message = 'ASSIGNMENT_DELETE_NOT_CONFIRMED';
  end if;

  v_new_assignment_id := public.bde_admin_add_member_assignment(
    v_member_id,
    v_pole_id,
    p_role,
    p_is_vp,
    p_role_label,
    p_role_description
  );

  return v_new_assignment_id;
end;
$function$;

revoke all on function public.bde_admin_update_member_assignment(uuid,text,boolean,text,text) from public, anon;
grant execute on function public.bde_admin_update_member_assignment(uuid,text,boolean,text,text) to authenticated;

commit;
