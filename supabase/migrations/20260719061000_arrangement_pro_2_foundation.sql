-- Applied to production on 2026-07-19.
-- Foundation for automatic waitlist offers, grouped QR check-in, badges, finance, dashboard and offline/PWA sync.

alter table public.organization_activities
  add column if not exists waitlist_offer_minutes integer not null default 1440 check (waitlist_offer_minutes between 60 and 10080),
  add column if not exists automatic_waitlist_promotion boolean not null default true,
  add column if not exists badge_template jsonb not null default '{}'::jsonb;

alter table public.activity_registrations
  add column if not exists waitlist_position integer,
  add column if not exists waitlist_offered_at timestamptz,
  add column if not exists waitlist_offer_expires_at timestamptz,
  add column if not exists waitlist_offer_token uuid default gen_random_uuid(),
  add column if not exists waitlist_offer_status text not null default 'none' check (waitlist_offer_status in ('none','offered','accepted','expired','declined')),
  add column if not exists badge_token uuid default gen_random_uuid(),
  add column if not exists badge_printed_at timestamptz;

create unique index if not exists activity_registrations_waitlist_offer_token_uidx on public.activity_registrations(waitlist_offer_token);
create unique index if not exists activity_registrations_badge_token_uidx on public.activity_registrations(badge_token);
create index if not exists activity_registrations_waitlist_queue_idx on public.activity_registrations(activity_id,status,created_at);

alter table public.activity_checkins
  add column if not exists attendee_count integer not null default 1 check (attendee_count between 1 and 20),
  add column if not exists offline_client_id text,
  add column if not exists synced_at timestamptz not null default now();

create unique index if not exists activity_checkins_registration_once_uidx on public.activity_checkins(activity_id,registration_id) where registration_id is not null;
create unique index if not exists activity_checkins_offline_client_uidx on public.activity_checkins(organization_id,offline_client_id) where offline_client_id is not null;

create table if not exists public.activity_finance_entries(
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  activity_id uuid not null references public.organization_activities(id) on delete cascade,
  registration_id uuid references public.activity_registrations(id) on delete set null,
  entry_type text not null check(entry_type in ('charge','payment','refund','fee','adjustment')),
  amount numeric(12,2) not null,
  currency text not null default 'NOK',
  status text not null default 'posted' check(status in ('pending','posted','void')),
  external_reference text,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.activity_finance_entries enable row level security;
create index if not exists activity_finance_entries_activity_idx on public.activity_finance_entries(activity_id,created_at desc);

drop policy if exists "Arrangement admins manage finance" on public.activity_finance_entries;
create policy "Arrangement admins manage finance" on public.activity_finance_entries for all to authenticated
using(
  exists(select 1 from public.organization_admins oa where oa.organization_id=activity_finance_entries.organization_id and oa.user_id=(select auth.uid()) and oa.invitation_status='accepted')
  or exists(select 1 from public.admins a where a.auth_user_id=(select auth.uid()) and a.role in('owner','super_admin','superadmin'))
)
with check(
  exists(select 1 from public.organization_admins oa where oa.organization_id=activity_finance_entries.organization_id and oa.user_id=(select auth.uid()) and oa.invitation_status='accepted')
  or exists(select 1 from public.admins a where a.auth_user_id=(select auth.uid()) and a.role in('owner','super_admin','superadmin'))
);

create table if not exists public.activity_offline_sync_events(
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  activity_id uuid references public.organization_activities(id) on delete cascade,
  client_event_id text not null,
  event_type text not null check(event_type in ('checkin','checkout','badge_print')),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organization_id,client_event_id)
);
alter table public.activity_offline_sync_events enable row level security;

drop policy if exists "Arrangement admins manage offline sync" on public.activity_offline_sync_events;
create policy "Arrangement admins manage offline sync" on public.activity_offline_sync_events for all to authenticated
using(
  exists(select 1 from public.organization_admins oa where oa.organization_id=activity_offline_sync_events.organization_id and oa.user_id=(select auth.uid()) and oa.invitation_status='accepted')
  or exists(select 1 from public.admins a where a.auth_user_id=(select auth.uid()) and a.role in('owner','super_admin','superadmin'))
)
with check(
  exists(select 1 from public.organization_admins oa where oa.organization_id=activity_offline_sync_events.organization_id and oa.user_id=(select auth.uid()) and oa.invitation_status='accepted')
  or exists(select 1 from public.admins a where a.auth_user_id=(select auth.uid()) and a.role in('owner','super_admin','superadmin'))
);

create or replace function public.get_arrangement_pro_dashboard(p_organization_id text)
returns table(total_activities bigint,upcoming_activities bigint,total_attendees bigint,checked_in bigint,waitlist_attendees bigint,gross_revenue numeric,refunds numeric,net_revenue numeric,average_rating numeric,nps numeric)
language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.organization_admins oa where oa.organization_id=p_organization_id and oa.user_id=auth.uid() and oa.invitation_status='accepted')
     and not exists(select 1 from public.admins x where x.auth_user_id=auth.uid() and x.role in('owner','super_admin','superadmin')) then raise exception 'not_authorized'; end if;
  return query
  select count(distinct a.id),
         count(distinct a.id) filter(where a.activity_date>=current_date and a.status='published'),
         coalesce(sum(r.attendees) filter(where r.status='confirmed'),0),
         count(distinct c.registration_id),
         coalesce(sum(r.attendees) filter(where r.status='waitlist'),0),
         coalesce(sum(f.amount) filter(where f.status='posted' and f.entry_type in('charge','payment')),0),
         coalesce(abs(sum(f.amount) filter(where f.status='posted' and f.entry_type='refund')),0),
         coalesce(sum(case when f.status='posted' then f.amount else 0 end),0),
         round(avg(e.rating)::numeric,2),
         round((100.0*(count(e.id) filter(where e.submitted_at is not null and e.nps>=9)-count(e.id) filter(where e.submitted_at is not null and e.nps<=6))/nullif(count(e.id) filter(where e.submitted_at is not null),0))::numeric,2)
  from public.organization_activities a
  left join public.activity_registrations r on r.activity_id=a.id
  left join public.activity_checkins c on c.activity_id=a.id and c.registration_id=r.id
  left join public.activity_evaluations e on e.activity_id=a.id and e.registration_id=r.id
  left join public.activity_finance_entries f on f.activity_id=a.id
  where a.organization_id=p_organization_id;
end$$;
revoke all on function public.get_arrangement_pro_dashboard(text) from public;
grant execute on function public.get_arrangement_pro_dashboard(text) to authenticated;
