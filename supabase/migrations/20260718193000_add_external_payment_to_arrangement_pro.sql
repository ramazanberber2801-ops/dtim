alter table public.organization_activities
  add column if not exists is_paid boolean not null default false,
  add column if not exists price_amount numeric(12,2),
  add column if not exists price_currency text,
  add column if not exists payment_url text,
  add column if not exists payment_confirmation_required boolean not null default true;

alter table public.activity_registrations
  add column if not exists payment_confirmed boolean not null default false,
  add column if not exists payment_confirmed_at timestamptz;

alter table public.organization_activities
  drop constraint if exists organization_activities_payment_fields_check;

alter table public.organization_activities
  add constraint organization_activities_payment_fields_check check (
    not is_paid or (
      registration_enabled = true
      and payment_url is not null
      and payment_url ~* '^https?://'
      and (price_amount is null or price_amount >= 0)
      and coalesce(length(trim(price_currency)), 0) between 3 and 3
    )
  );

drop function if exists public.register_for_activity(uuid,text,text,text,integer);

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
set search_path to 'public'
as $function$
declare
  v_activity public.organization_activities%rowtype;
  v_registered integer;
  v_status text := 'confirmed';
  v_registration_id uuid;
begin
  if length(trim(coalesce(p_full_name,''))) < 2 then raise exception 'Name is required'; end if;
  if position('@' in trim(coalesce(p_email,''))) < 2 then raise exception 'Valid email is required'; end if;
  if p_attendees < 1 or p_attendees > 20 then raise exception 'Invalid attendee count'; end if;

  select * into v_activity
  from public.organization_activities
  where id=p_activity_id and status='published' and visibility='public';

  if not found then raise exception 'Activity not found'; end if;
  if not v_activity.registration_enabled then raise exception 'Registration is not enabled'; end if;
  if v_activity.registration_deadline is not null and now() > v_activity.registration_deadline then raise exception 'Registration deadline has passed'; end if;
  if v_activity.is_paid and v_activity.payment_confirmation_required and not coalesce(p_payment_confirmed,false) then
    raise exception 'Payment confirmation is required';
  end if;

  select coalesce(sum(attendees),0) into v_registered
  from public.activity_registrations
  where activity_id=p_activity_id and status='confirmed';

  if v_activity.capacity is not null and v_registered + p_attendees > v_activity.capacity then
    v_status := 'waitlist';
  end if;

  insert into public.activity_registrations(organization_id,activity_id,full_name,email,phone,attendees,status,payment_confirmed,payment_confirmed_at)
  values(v_activity.organization_id,p_activity_id,trim(p_full_name),lower(trim(p_email)),nullif(trim(p_phone),''),p_attendees,v_status,v_activity.is_paid and coalesce(p_payment_confirmed,false),case when v_activity.is_paid and coalesce(p_payment_confirmed,false) then now() else null end)
  on conflict(activity_id,email) do update set
    full_name=excluded.full_name,
    phone=excluded.phone,
    attendees=excluded.attendees,
    status=excluded.status,
    payment_confirmed=excluded.payment_confirmed,
    payment_confirmed_at=excluded.payment_confirmed_at,
    updated_at=now()
  returning id into v_registration_id;

  return jsonb_build_object('registration_id',v_registration_id,'status',v_status,'payment_confirmed',v_activity.is_paid and coalesce(p_payment_confirmed,false));
end;
$function$;

grant execute on function public.register_for_activity(uuid,text,text,text,integer,boolean) to anon, authenticated;
