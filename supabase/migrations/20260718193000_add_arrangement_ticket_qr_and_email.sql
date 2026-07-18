alter table public.activity_registrations add column if not exists ticket_token uuid not null default gen_random_uuid();
alter table public.activity_registrations add column if not exists confirmation_email_sent_at timestamptz;
create unique index if not exists activity_registrations_ticket_token_key on public.activity_registrations(ticket_token);

alter table public.activity_checkins alter column membership_id drop not null;
create unique index if not exists activity_checkins_activity_registration_key on public.activity_checkins(activity_id,registration_id) where registration_id is not null;

drop function if exists public.register_for_activity(uuid,text,text,text,integer);
create or replace function public.register_for_activity(p_activity_id uuid,p_full_name text,p_email text,p_phone text default null,p_attendees integer default 1,p_payment_confirmed boolean default false)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_activity public.organization_activities%rowtype;v_registered integer;v_status text:='confirmed';v_registration public.activity_registrations%rowtype;
begin
 if length(trim(coalesce(p_full_name,'')))<2 then raise exception 'Name is required';end if;
 if position('@' in trim(coalesce(p_email,'')))<2 then raise exception 'Valid email is required';end if;
 if p_attendees<1 or p_attendees>20 then raise exception 'Invalid attendee count';end if;
 select * into v_activity from public.organization_activities where id=p_activity_id and status='published' and visibility='public';
 if not found then raise exception 'Activity not found';end if;
 if not v_activity.registration_enabled then raise exception 'Registration is not enabled';end if;
 if v_activity.registration_deadline is not null and now()>v_activity.registration_deadline then raise exception 'Registration deadline has passed';end if;
 if coalesce(v_activity.payment_required,false) and coalesce(v_activity.payment_confirmation_required,true) and not p_payment_confirmed then raise exception 'Payment confirmation is required';end if;
 select coalesce(sum(attendees),0) into v_registered from public.activity_registrations where activity_id=p_activity_id and status='confirmed';
 if v_activity.capacity is not null and v_registered+p_attendees>v_activity.capacity then v_status:='waitlist';end if;
 insert into public.activity_registrations(organization_id,activity_id,full_name,email,phone,attendees,status,payment_confirmed)
 values(v_activity.organization_id,p_activity_id,trim(p_full_name),lower(trim(p_email)),nullif(trim(p_phone),''),p_attendees,v_status,coalesce(p_payment_confirmed,false))
 on conflict(activity_id,email) do update set full_name=excluded.full_name,phone=excluded.phone,attendees=excluded.attendees,status=excluded.status,payment_confirmed=excluded.payment_confirmed,updated_at=now()
 returning * into v_registration;
 return jsonb_build_object('registration_id',v_registration.id,'status',v_status,'ticket_token',v_registration.ticket_token);
end;$$;

grant execute on function public.register_for_activity(uuid,text,text,text,integer,boolean) to anon,authenticated;

create or replace function public.check_in_registration_by_ticket(p_organization_id text,p_activity_id uuid,p_ticket_token uuid)
returns jsonb language plpgsql set search_path='public' as $$
declare v_registration public.activity_registrations%rowtype;v_checkin public.activity_checkins%rowtype;
begin
 if not exists(select 1 from public.organization_admins where organization_id=p_organization_id and user_id=auth.uid() and invitation_status='accepted') then raise exception 'not_authorized';end if;
 select * into v_registration from public.activity_registrations where organization_id=p_organization_id and activity_id=p_activity_id and ticket_token=p_ticket_token and status='confirmed';
 if v_registration.id is null then raise exception 'ticket_not_found';end if;
 insert into public.activity_checkins(organization_id,activity_id,membership_id,registration_id,checked_in_by,source)
 values(p_organization_id,p_activity_id,null,v_registration.id,auth.uid(),'ticket_qr')
 on conflict(activity_id,registration_id) where registration_id is not null do nothing returning * into v_checkin;
 if v_checkin.id is null then return jsonb_build_object('status','already_checked_in','registration_id',v_registration.id,'full_name',v_registration.full_name);end if;
 return jsonb_build_object('status','checked_in','checkin_id',v_checkin.id,'registration_id',v_registration.id,'full_name',v_registration.full_name,'checked_in_at',v_checkin.checked_in_at);
end;$$;

grant execute on function public.check_in_registration_by_ticket(text,uuid,uuid) to authenticated;

create or replace function public.get_activity_attendance(p_activity_id uuid)
returns table(checkin_id uuid,membership_id uuid,member_number text,full_name text,email text,checked_in_at timestamptz,source text)
language sql set search_path='public' as $$
 select c.id,m.id,m.member_number,coalesce(p.full_name,ar.full_name),coalesce(m.email,p.primary_email,ar.email),c.checked_in_at,c.source
 from public.activity_checkins c left join public.organization_memberships m on m.id=c.membership_id left join public.people p on p.id=m.person_id left join public.activity_registrations ar on ar.id=c.registration_id
 where c.activity_id=p_activity_id and exists(select 1 from public.organization_admins oa where oa.organization_id=c.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted') order by c.checked_in_at desc;
$$;

drop function if exists public.get_activity_registration_overview(uuid);
create function public.get_activity_registration_overview(p_activity_id uuid)
returns table(registration_id uuid,full_name text,email text,phone text,attendees integer,status text,created_at timestamptz,membership_id uuid,member_number text,checked_in boolean,checked_in_at timestamptz,payment_confirmed boolean,confirmation_email_sent_at timestamptz)
language sql set search_path='public' as $$
 select ar.id,ar.full_name,ar.email,ar.phone,ar.attendees,ar.status,ar.created_at,m.id,m.member_number,c.id is not null,c.checked_in_at,coalesce(ar.payment_confirmed,false),ar.confirmation_email_sent_at
 from public.activity_registrations ar left join public.organization_memberships m on m.organization_id=ar.organization_id and lower(coalesce(m.email,''))=lower(ar.email)
 left join public.activity_checkins c on c.activity_id=ar.activity_id and(c.registration_id=ar.id or(c.membership_id=m.id and c.registration_id is null))
 where ar.activity_id=p_activity_id and exists(select 1 from public.organization_admins oa where oa.organization_id=ar.organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted')
 order by case ar.status when 'confirmed' then 0 when 'waitlist' then 1 when 'cancelled' then 2 else 3 end,ar.created_at;
$$;

create extension if not exists pg_net with schema extensions;
create or replace function public.queue_activity_ticket_email() returns trigger language plpgsql security definer set search_path='public','extensions' as $$
begin
 if new.email is not null and(tg_op='INSERT' or new.ticket_token is distinct from old.ticket_token or new.status is distinct from old.status) then
  perform net.http_post(url:='https://dtim-ramazanberber2801-ops-projects.vercel.app/api/send-activity-ticket',headers:=jsonb_build_object('Content-Type','application/json'),body:=jsonb_build_object('registrationId',new.id,'ticketToken',new.ticket_token));
 end if;
 return new;
end;$$;

drop trigger if exists activity_registration_ticket_email on public.activity_registrations;
create trigger activity_registration_ticket_email after insert or update of status,ticket_token on public.activity_registrations for each row execute function public.queue_activity_ticket_email();
