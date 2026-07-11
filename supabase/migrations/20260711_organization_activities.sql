-- Yasaflow organization-scoped Activities foundation

create extension if not exists pgcrypto;

create table if not exists public.organization_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  activity_date date not null,
  start_time time,
  end_time time,
  location text,
  capacity integer check (capacity is null or capacity >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_activities_org_date_idx
  on public.organization_activities (organization_id, activity_date, start_time);

create index if not exists organization_activities_org_status_idx
  on public.organization_activities (organization_id, status);

alter table public.organization_activities enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_activities'
      and policyname = 'Organization admins manage own activities'
  ) then
    create policy "Organization admins manage own activities"
      on public.organization_activities
      for all
      to authenticated
      using (
        exists (
          select 1 from public.organization_admins oa
          where oa.organization_id = organization_activities.organization_id
            and oa.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.organization_admins oa
          where oa.organization_id = organization_activities.organization_id
            and oa.user_id = auth.uid()
        )
      );
  end if;
end $$;

comment on table public.organization_activities is
  'Organization-owned activities. Separate from the legacy global sohbet table.';
