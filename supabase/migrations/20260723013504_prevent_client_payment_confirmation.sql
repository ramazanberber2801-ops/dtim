create or replace function public.register_for_activity(
  p_activity_id uuid,
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_attendees integer default 1,
  p_payment_confirmed boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_activity public.organization_activities%rowtype;
  v_registered integer;
  v_status text := 'confirmed';
  v_registration public.activity_registrations%rowtype;
  v_email text := lower(trim(coalesce(p_email,'')));
begin
  if length(trim(coalesce(p_full_name,''))) < 2 then raise exception 'Name is required'; end if;
  if length(trim(p_full_name)) > 200 then raise exception 'name_too_long'; end if;
  if length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Valid email is required'; end if;
  if p_phone is not null and length(trim(p_phone)) > 40 then raise exception 'phone_too_long'; end if;
  if p_attendees < 1 or p_attendees > 20 then raise exception 'Invalid attendee count'; end if;

  select * into v_activity
  from public.organization_activities
  where id=p_activity_id and status='published' and visibility='public';
  if not found then raise exception 'Activity not found'; end if;

  perform public.enforce_public_rate_limit('activity_registration', v_activity.organization_id, v_email, interval '10 minutes', 5);

  if not v_activity.registration_enabled then raise exception 'Registration is not enabled'; end if;
  if v_activity.registration_deadline is not null and now()>v_activity.registration_deadline then raise exception 'Registration deadline has passed'; end if;

  select coalesce(sum(attendees),0) into v_registered
  from public.activity_registrations
  where activity_id=p_activity_id and status='confirmed';

  if v_activity.capacity is not null and v_registered+p_attendees>v_activity.capacity then
    v_status:='waitlist';
  end if;

  insert into public.activity_registrations(
    organization_id,activity_id,full_name,email,phone,attendees,status,payment_confirmed,payment_confirmed_at
  ) values(
    v_activity.organization_id,p_activity_id,trim(p_full_name),v_email,nullif(trim(p_phone),''),p_attendees,v_status,false,null
  )
  on conflict(activity_id,email) do update set
    full_name=excluded.full_name,
    phone=excluded.phone,
    attendees=excluded.attendees,
    status=excluded.status,
    payment_confirmed=public.activity_registrations.payment_confirmed,
    payment_confirmed_at=public.activity_registrations.payment_confirmed_at,
    updated_at=now()
  returning * into v_registration;

  return jsonb_build_object(
    'registration_id',v_registration.id,
    'status',v_status,
    'ticket_token',v_registration.ticket_token,
    'payment_confirmed',v_registration.payment_confirmed
  );
end;
$$;

revoke all on function public.register_for_activity(uuid,text,text,text,integer,boolean) from public;
grant execute on function public.register_for_activity(uuid,text,text,text,integer,boolean) to anon, authenticated, service_role;

comment on function public.register_for_activity(uuid,text,text,text,integer,boolean) is
'Public activity registration. The legacy p_payment_confirmed argument is ignored; payment may only be confirmed by an authorized server/admin flow.';
