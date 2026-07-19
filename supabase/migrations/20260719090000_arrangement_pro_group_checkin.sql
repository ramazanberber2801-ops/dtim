-- Applied to production on 2026-07-19.
-- Grouped QR check-in with partial attendance and remaining-count tracking.

create or replace function public.get_registration_ticket_checkin_status(p_organization_id text,p_activity_id uuid,p_ticket_token uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_registration public.activity_registrations%rowtype; v_checked integer:=0;
begin
 if not exists(select 1 from public.organization_admins where organization_id=p_organization_id and user_id=auth.uid() and invitation_status='accepted') and not exists(select 1 from public.admins where auth_user_id=auth.uid() and role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
 select * into v_registration from public.activity_registrations where organization_id=p_organization_id and activity_id=p_activity_id and ticket_token=p_ticket_token and status='confirmed';
 if v_registration.id is null then raise exception 'ticket_not_found'; end if;
 select coalesce(sum(attendee_count),0)::integer into v_checked from public.activity_checkins where activity_id=p_activity_id and registration_id=v_registration.id;
 return jsonb_build_object('registration_id',v_registration.id,'full_name',v_registration.full_name,'total_attendees',v_registration.attendees,'checked_in_attendees',least(v_checked,v_registration.attendees),'remaining_attendees',greatest(v_registration.attendees-v_checked,0),'status',case when v_checked>=v_registration.attendees then 'complete' when v_checked>0 then 'partial' else 'not_checked_in' end);
end$$;

create or replace function public.check_in_registration_group_by_ticket(p_organization_id text,p_activity_id uuid,p_ticket_token uuid,p_attendee_count integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_registration public.activity_registrations%rowtype; v_checkin public.activity_checkins%rowtype; v_checked integer:=0; v_remaining integer:=0; v_add integer:=0;
begin
 if not exists(select 1 from public.organization_admins where organization_id=p_organization_id and user_id=auth.uid() and invitation_status='accepted') and not exists(select 1 from public.admins where auth_user_id=auth.uid() and role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
 if p_attendee_count is null or p_attendee_count<1 then raise exception 'invalid_attendee_count'; end if;
 select * into v_registration from public.activity_registrations where organization_id=p_organization_id and activity_id=p_activity_id and ticket_token=p_ticket_token and status='confirmed' for update;
 if v_registration.id is null then raise exception 'ticket_not_found'; end if;
 select * into v_checkin from public.activity_checkins where activity_id=p_activity_id and registration_id=v_registration.id for update;
 v_checked:=coalesce(v_checkin.attendee_count,0); v_remaining:=greatest(v_registration.attendees-v_checked,0);
 if v_remaining=0 then return jsonb_build_object('status','already_checked_in','registration_id',v_registration.id,'full_name',v_registration.full_name,'total_attendees',v_registration.attendees,'checked_in_attendees',v_checked,'remaining_attendees',0); end if;
 v_add:=least(p_attendee_count,v_remaining);
 if v_checkin.id is null then
  insert into public.activity_checkins(organization_id,activity_id,membership_id,registration_id,checked_in_by,source,attendee_count) values(p_organization_id,p_activity_id,null,v_registration.id,auth.uid(),'ticket_qr_group',v_add) returning * into v_checkin;
 else
  update public.activity_checkins set attendee_count=attendee_count+v_add,checked_in_at=now(),checked_in_by=auth.uid(),source='ticket_qr_group',synced_at=now() where id=v_checkin.id returning * into v_checkin;
 end if;
 v_checked:=v_checkin.attendee_count; v_remaining:=greatest(v_registration.attendees-v_checked,0);
 return jsonb_build_object('status',case when v_remaining=0 then 'checked_in_complete' else 'checked_in_partial' end,'registration_id',v_registration.id,'checkin_id',v_checkin.id,'full_name',v_registration.full_name,'added_attendees',v_add,'total_attendees',v_registration.attendees,'checked_in_attendees',v_checked,'remaining_attendees',v_remaining,'checked_in_at',v_checkin.checked_in_at);
end$$;

drop function if exists public.get_activity_attendance(uuid);
create function public.get_activity_attendance(p_activity_id uuid)
returns table(checkin_id uuid,membership_id uuid,member_number text,full_name text,email text,checked_in_at timestamptz,source text,attendee_count integer)
language sql security definer set search_path=public as $$
 select c.id,m.id,m.member_number,coalesce(p.full_name,ar.full_name),coalesce(m.email,p.primary_email,ar.email),c.checked_in_at,c.source,c.attendee_count
 from public.activity_checkins c left join public.organization_memberships m on m.id=c.membership_id left join public.people p on p.id=m.person_id left join public.activity_registrations ar on ar.id=c.registration_id
 where c.activity_id=p_activity_id and (exists(select 1 from public.organization_admins oa where oa.organization_id=c.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') or exists(select 1 from public.admins a where a.auth_user_id=auth.uid() and a.role in('owner','super_admin','superadmin'))) order by c.checked_in_at desc;
$$;

drop function if exists public.get_activity_registration_overview(uuid);
create function public.get_activity_registration_overview(p_activity_id uuid)
returns table(registration_id uuid,full_name text,email text,phone text,attendees integer,status text,created_at timestamptz,membership_id uuid,member_number text,checked_in boolean,checked_in_at timestamptz,payment_confirmed boolean,confirmation_email_sent_at timestamptz,ticket_token uuid,certificate_token uuid,wallet_token uuid,certificate_issued_at timestamptz,checked_in_attendees integer,remaining_attendees integer)
language sql security definer set search_path=public as $$
 select ar.id,ar.full_name,ar.email,ar.phone,ar.attendees,ar.status,ar.created_at,m.id,m.member_number,coalesce(c.attendee_count,0)>=ar.attendees,c.checked_in_at,coalesce(ar.payment_confirmed,false),ar.confirmation_email_sent_at,ar.ticket_token,ar.certificate_token,ar.wallet_token,ar.certificate_issued_at,least(coalesce(c.attendee_count,0),ar.attendees),greatest(ar.attendees-coalesce(c.attendee_count,0),0)
 from public.activity_registrations ar left join public.organization_memberships m on m.organization_id=ar.organization_id and lower(coalesce(m.email,''))=lower(ar.email) left join public.activity_checkins c on c.activity_id=ar.activity_id and (c.registration_id=ar.id or (c.membership_id=m.id and c.registration_id is null))
 where ar.activity_id=p_activity_id and (exists(select 1 from public.organization_admins oa where oa.organization_id=ar.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') or exists(select 1 from public.admins a where a.auth_user_id=auth.uid() and a.role in('owner','super_admin','superadmin'))) order by case ar.status when 'confirmed' then 0 when 'waitlist' then 1 when 'cancelled' then 2 else 3 end,ar.created_at;
$$;

revoke all on function public.get_registration_ticket_checkin_status(text,uuid,uuid) from public;
revoke all on function public.check_in_registration_group_by_ticket(text,uuid,uuid,integer) from public;
grant execute on function public.get_registration_ticket_checkin_status(text,uuid,uuid) to authenticated;
grant execute on function public.check_in_registration_group_by_ticket(text,uuid,uuid,integer) to authenticated;
grant execute on function public.get_activity_attendance(uuid) to authenticated;
grant execute on function public.get_activity_registration_overview(uuid) to authenticated;