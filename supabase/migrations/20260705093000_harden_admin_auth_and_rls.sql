-- Harden DTIM admin authentication and RLS after moving admin login to Supabase Auth.
-- Run this after verifying that every active admin row has auth_user_id linked to a Supabase Auth user.
-- This migration intentionally removes existing policies on the listed tables first, so old public write policies cannot remain active.

-- Helper: current signed-in user must be an admin or super_admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.role in ('admin', 'super_admin', 'superadmin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
      and a.role in ('super_admin', 'superadmin')
  );
$$;

-- Enable RLS on content/admin tables.
alter table if exists public.news enable row level security;
alter table if exists public.settings enable row level security;
alter table if exists public.staff enable row level security;
alter table if exists public.sohbet enable row level security;
alter table if exists public.inspiration enable row level security;
alter table if exists public.analytics_events enable row level security;
alter table if exists public.push_messages enable row level security;
alter table if exists public.admins enable row level security;

-- Remove every old policy on these tables before adding the final policy set.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'news',
        'settings',
        'staff',
        'sohbet',
        'inspiration',
        'analytics_events',
        'push_messages',
        'admins'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

-- Public read tables.
create policy "Public can read news"
on public.news
for select
to anon, authenticated
using (true);

create policy "Public can read settings"
on public.settings
for select
to anon, authenticated
using (true);

create policy "Public can read staff"
on public.staff
for select
to anon, authenticated
using (true);

create policy "Public can read sohbet"
on public.sohbet
for select
to anon, authenticated
using (true);

create policy "Public can read inspiration"
on public.inspiration
for select
to anon, authenticated
using (true);

-- Admin write policies for public content tables.
create policy "Admins can insert news"
on public.news
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update news"
on public.news
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete news"
on public.news
for delete
to authenticated
using (public.is_admin());

create policy "Admins can insert staff"
on public.staff
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update staff"
on public.staff
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete staff"
on public.staff
for delete
to authenticated
using (public.is_admin());

create policy "Admins can insert sohbet"
on public.sohbet
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update sohbet"
on public.sohbet
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete sohbet"
on public.sohbet
for delete
to authenticated
using (public.is_admin());

create policy "Admins can update settings"
on public.settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can update inspiration"
on public.inspiration
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Analytics: public can insert app usage events, admins can read them.
create policy "Public can insert analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

create policy "Admins can read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_admin());

-- Push messages: app can read valid message links, only admins can manage.
create policy "Public can read push messages"
on public.push_messages
for select
to anon, authenticated
using (expires_at > now());

create policy "Admins can manage push messages"
on public.push_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin table: never public. Admins can read profile rows; super admins can manage rows.
-- Frontend only selects safe columns, but RLS protects table access generally.
create policy "Admins can read admins"
on public.admins
for select
to authenticated
using (public.is_admin());

create policy "Super admins can insert admins"
on public.admins
for insert
to authenticated
with check (public.is_super_admin());

create policy "Super admins can update admins"
on public.admins
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admins can delete admins"
on public.admins
for delete
to authenticated
using (public.is_super_admin());

-- Keep helper functions callable by authenticated users and policies.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- Do this only after manual testing confirms the frontend no longer uses these columns.
-- alter table public.admins drop column if exists password;
-- alter table public.admins drop column if exists security_question;
-- alter table public.admins drop column if exists security_answer;
