revoke execute on function public.create_organization_onboarding(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_organization_onboarding(text,text,text,text,text,text) to service_role;

revoke execute on function public.prepare_membership_email(uuid,text) from public, anon, authenticated;
grant execute on function public.prepare_membership_email(uuid,text) to service_role;

create or replace function public.can_view_organization_content(
  p_organization_id text,
  p_visibility text,
  p_allowed_group_ids uuid[] default '{}'::uuid[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when coalesce(p_visibility, 'public') = 'public' then true
    when auth.uid() is null then false
    when exists (
      select 1 from public.organization_admins oa
      where oa.organization_id = p_organization_id
        and oa.user_id = auth.uid()
        and oa.invitation_status = 'accepted'
        and oa.role in ('owner','admin')
    ) then true
    when coalesce(p_visibility, 'public') = 'authenticated' then true
    when exists (
      select 1 from public.organization_user_memberships m
      where m.organization_id = p_organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and (
          p_visibility = 'members'
          or (p_visibility = 'staff' and m.role in ('staff','board','admin','owner'))
          or (p_visibility = 'admins' and m.role in ('admin','owner'))
          or (
            p_visibility = 'groups'
            and exists (
              select 1 from public.organization_group_members gm
              where gm.membership_id = m.id
                and gm.group_id = any(coalesce(p_allowed_group_ids, '{}'))
            )
          )
        )
    ) then true
    else false
  end;
$$;

create or replace function public.review_membership_request(p_request_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.organization_membership_requests%rowtype;
  v_person_id uuid;
begin
  if p_decision not in ('approved','rejected') then raise exception 'invalid_decision'; end if;
  select * into r from public.organization_membership_requests where id=p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'request_not_pending'; end if;
  if not exists (
    select 1 from public.organization_admins a
    where a.organization_id=r.organization_id
      and a.user_id=auth.uid()
      and a.invitation_status='accepted'
      and a.role in ('owner','admin')
  ) and not exists (
    select 1 from public.admins a
    where a.auth_user_id=auth.uid()
      and a.role in ('owner','super_admin','superadmin')
  ) then raise exception 'not_authorized'; end if;
  if p_decision='approved' then
    insert into public.people(full_name,primary_email,primary_phone,updated_at)
    values(trim(r.first_name||' '||r.last_name),r.email,r.phone,now()) returning id into v_person_id;
    insert into public.organization_memberships(organization_id,person_id,email,phone,address,join_date,status,internal_notes,updated_at)
    values(r.organization_id,v_person_id,r.email,r.phone,r.address,current_date,'active',r.comment,now());
  end if;
  update public.organization_membership_requests
  set status=p_decision,reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now()
  where id=p_request_id;
  insert into public.membership_email_jobs(request_id,event_type)
  values(p_request_id,p_decision) on conflict do nothing;
end;
$$;