create or replace function public.get_activity_registration_overview(p_activity_id uuid)
returns table(
  registration_id uuid,
  full_name text,
  email text,
  phone text,
  attendees integer,
  status text,
  created_at timestamptz,
  membership_id uuid,
  member_number text,
  checked_in boolean,
  checked_in_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select ar.id, ar.full_name, ar.email, ar.phone, ar.attendees, ar.status, ar.created_at,
    m.id, m.member_number, c.id is not null, c.checked_in_at
  from public.activity_registrations ar
  join public.organization_activities a on a.id = ar.activity_id
  left join public.organization_memberships m
    on m.organization_id = ar.organization_id and lower(coalesce(m.email,'')) = lower(ar.email)
  left join public.activity_checkins c on c.activity_id = ar.activity_id and c.membership_id = m.id
  where ar.activity_id = p_activity_id
    and exists (
      select 1 from public.organization_admins oa
      where oa.organization_id = ar.organization_id
        and oa.user_id = auth.uid()
        and oa.invitation_status = 'accepted'
    )
  order by case ar.status when 'confirmed' then 0 when 'waitlist' then 1 when 'cancelled' then 2 else 3 end, ar.created_at;
$$;

revoke all on function public.get_activity_registration_overview(uuid) from public, anon;
grant execute on function public.get_activity_registration_overview(uuid) to authenticated;

create or replace function public.search_activity_checkin_members(p_organization_id text,p_activity_id uuid,p_query text default '')
returns table(membership_id uuid,full_name text,member_number text,email text,status text,already_checked_in boolean)
language sql
security invoker
set search_path = public
as $$
  select m.id,p.full_name,m.member_number,coalesce(m.email,p.primary_email),m.status,
    exists(select 1 from public.activity_checkins c where c.activity_id=p_activity_id and c.membership_id=m.id)
  from public.organization_memberships m
  join public.people p on p.id=m.person_id
  where m.organization_id=p_organization_id
    and exists (
      select 1 from public.organization_admins oa
      where oa.organization_id=p_organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted'
    )
    and (
      trim(coalesce(p_query,''))='' or p.full_name ilike '%'||trim(p_query)||'%' or
      coalesce(m.member_number,'') ilike '%'||trim(p_query)||'%' or
      coalesce(m.email,p.primary_email,'') ilike '%'||trim(p_query)||'%'
    )
  order by p.full_name limit 30;
$$;

revoke all on function public.search_activity_checkin_members(text,uuid,text) from public, anon;
grant execute on function public.search_activity_checkin_members(text,uuid,text) to authenticated;

create or replace function public.check_in_member_manually(p_organization_id text,p_activity_id uuid,p_membership_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_membership public.organization_memberships%rowtype;
  v_registration_id uuid;
  v_checkin public.activity_checkins%rowtype;
begin
  if not exists (
    select 1 from public.organization_admins oa
    where oa.organization_id=p_organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted'
  ) then raise exception 'not_authorized'; end if;

  select * into v_membership from public.organization_memberships
  where id=p_membership_id and organization_id=p_organization_id;
  if v_membership.id is null then raise exception 'member_not_found'; end if;
  if v_membership.status <> 'active' then raise exception 'member_not_active'; end if;
  if not exists(select 1 from public.organization_activities where id=p_activity_id and organization_id=p_organization_id)
    then raise exception 'activity_not_found'; end if;

  select ar.id into v_registration_id from public.activity_registrations ar
  where ar.activity_id=p_activity_id and ar.organization_id=p_organization_id
    and lower(ar.email)=lower(coalesce(v_membership.email,'')) and ar.status<>'cancelled'
  order by ar.created_at desc limit 1;

  insert into public.activity_checkins(organization_id,activity_id,membership_id,registration_id,checked_in_by,source)
  values(p_organization_id,p_activity_id,v_membership.id,v_registration_id,auth.uid(),'manual')
  on conflict(activity_id,membership_id) do nothing returning * into v_checkin;

  if v_checkin.id is null then
    return jsonb_build_object('status','already_checked_in','membership_id',v_membership.id,'member_number',v_membership.member_number);
  end if;
  return jsonb_build_object('status','checked_in','checkin_id',v_checkin.id,'membership_id',v_membership.id,'member_number',v_membership.member_number,'checked_in_at',v_checkin.checked_in_at);
end;
$$;

revoke all on function public.check_in_member_manually(text,uuid,uuid) from public, anon;
grant execute on function public.check_in_member_manually(text,uuid,uuid) to authenticated;
