-- Yasaflow owner onboarding foundation
-- Creates the first multi-tenant tables needed for managed SaaS onboarding.

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  organization_type text not null default 'Forening',
  country text not null default 'Norge',
  language text not null default 'Norsk',
  status text not null default 'Prøve',
  hosting_mode text not null default 'Managed',
  domain text,
  live_url text,
  logo_url text,
  theme_id text not null default 'modern-community',
  onboarding_step text not null default 'Bestilling',
  admin_name text,
  admin_email text,
  member_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  module_id text not null,
  enabled boolean not null default false,
  status text not null default 'Av',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, module_id)
);

create table if not exists public.organization_admins (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  email text not null,
  role text not null default 'admin',
  invitation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.organization_provisioning_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, step_key)
);

create index if not exists organizations_status_idx on public.organizations(status);
create index if not exists organizations_domain_idx on public.organizations(domain);
create index if not exists organization_modules_org_idx on public.organization_modules(organization_id);
create index if not exists organization_admins_org_idx on public.organization_admins(organization_id);
create index if not exists organization_admins_email_idx on public.organization_admins(email);
create index if not exists organization_provisioning_org_idx on public.organization_provisioning_steps(organization_id);

alter table public.organizations enable row level security;
alter table public.organization_modules enable row level security;
alter table public.organization_admins enable row level security;
alter table public.organization_provisioning_steps enable row level security;

-- Temporary owner-safe policies for the MVP phase.
-- These keep reads available to authenticated admins while we wire organization-scoped policies next.
drop policy if exists "authenticated read organizations" on public.organizations;
create policy "authenticated read organizations"
  on public.organizations for select
  to authenticated
  using (true);

drop policy if exists "authenticated read organization modules" on public.organization_modules;
create policy "authenticated read organization modules"
  on public.organization_modules for select
  to authenticated
  using (true);

drop policy if exists "authenticated read organization admins" on public.organization_admins;
create policy "authenticated read organization admins"
  on public.organization_admins for select
  to authenticated
  using (true);

drop policy if exists "authenticated read organization provisioning" on public.organization_provisioning_steps;
create policy "authenticated read organization provisioning"
  on public.organization_provisioning_steps for select
  to authenticated
  using (true);

insert into public.organizations (
  id,
  name,
  organization_type,
  country,
  language,
  status,
  hosting_mode,
  domain,
  live_url,
  theme_id,
  onboarding_step,
  admin_name,
  admin_email
) values (
  'yasaflow',
  'Yasaflow Demo',
  'Moské',
  'Norge',
  'Tyrkisk',
  'Aktiv',
  'Managed',
  'yasaflow.vercel.app',
  '/',
  'classic-mosque',
  'Testing',
  'Owner Admin',
  ''
) on conflict (id) do nothing;

insert into public.organization_modules (organization_id, module_id, enabled, status) values
  ('yasaflow', 'news', true, 'Inkludert'),
  ('yasaflow', 'activities', true, 'Inkludert'),
  ('yasaflow', 'contact', true, 'Inkludert'),
  ('yasaflow', 'push', true, 'Aktiv'),
  ('yasaflow', 'donation', true, 'Aktiv'),
  ('yasaflow', 'prayer', true, 'Aktiv'),
  ('yasaflow', 'ayet-hadis', true, 'Aktiv')
on conflict (organization_id, module_id) do nothing;

insert into public.organization_provisioning_steps (organization_id, step_key, label, status) values
  ('yasaflow', 'order_received', 'Bestilling mottatt', 'done'),
  ('yasaflow', 'organization_created', 'Organisasjon opprettet', 'done'),
  ('yasaflow', 'admin_ready', 'Admin klar', 'pending'),
  ('yasaflow', 'theme_selected', 'Tema valgt', 'done'),
  ('yasaflow', 'published', 'Publisering', 'pending')
on conflict (organization_id, step_key) do nothing;
