-- Harden DTIM admin authentication and RLS after moving admin login to Supabase Auth.
-- Run this after verifying that every active admin row has auth_user_id linked to a Supabase Auth user.

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

-- Public read tables.
drop policy if exists "Public can read news" on public.news;
create policy "Public can read news"
on public.news
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read settings" on public.settings;
create policy "Public can read settings"
on public.settings
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read staff" on public.staff;
create policy "Public can read staff"
on public.staff
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read sohbet" on public.sohbet;
create policy "Public can read sohbet"
on public.sohbet
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read inspiration" on public.inspiration;
create policy "Public can read inspiration"
on public.inspiration
for select
to anon, authenticated
using (true);

-- Admin write policies for public content tables.
drop policy if exists "Admins can insert news" on public.news;
create policy "Admins can insert news"
on public.news
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update news" on public.news;
create policy "Admins can update news"
on public.news
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete news" on public.news;
create policy "Admins can delete news"
on public.news
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert staff" on public.staff;
create policy "Admins can insert staff"
on public.staff
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update staff" on public.staff;
create policy "Admins can update staff"
on public.staff
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete staff" on public.staff;
create policy "Admins can delete staff"
on public.staff
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert sohbet" on public.sohbet;
create policy "Admins can insert sohbet"
on public.sohbet
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update sohbet" on public.sohbet;
create policy "Admins can update sohbet"
on public.sohbet
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete sohbet" on public.sohbet;
create policy "Admins can delete sohbet"
on public.sohbet
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update settings" on public.settings;
create policy "Admins can update settings"
on public.settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can update inspiration" on public.inspiration;
create policy "Admins can update inspiration"
on public.inspiration
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Analytics: public can insert app usage events, admins can read them.
drop policy if exists "Public can insert analytics events" on public.analytics_events;
create policy "Public can insert analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_admin());

-- Push messages: app can read valid message links, only admins can manage.
drop policy if exists "Public can read push messages" on public.push_messages;
create policy "Public can read push messages"
on public.push_messages
for select
to anon, authenticated
using (expires_at > now());

drop policy if exists "Admins can manage push messages" on public.push_messages;
create policy "Admins can manage push messages"
on public.push_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin table: never public. Admins can read safe profile rows; super admins can manage rows.
drop policy if exists "Admins can read admins" on public.admins;
create policy "Admins can read admins"
on public.admins
for select
to authenticated
using (public.is_admin());

drop policy if exists "Super admins can insert admins" on public.admins;
create policy "Super admins can insert admins"
on public.admins
for insert
to authenticated
with check (public.is_super_admin());

drop policy if exists "Super admins can update admins" on public.admins;
create policy "Super admins can update admins"
on public.admins
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admins can delete admins" on public.admins;
create policy "Super admins can delete admins"
on public.admins
for delete
to authenticated
using (public.is_super_admin());

-- Do this only after manual testing confirms the frontend no longer uses these columns.
-- alter table public.admins drop column if exists password;
-- alter table public.admins drop column if exists security_question;
-- alter table public.admins drop column if exists security_answer;
