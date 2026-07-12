drop policy if exists "Public can read published organization activities" on public.organization_activities;
create policy "Public can read published organization activities"
on public.organization_activities for select
to anon, authenticated
using (status = 'published');
create policy "Organization admins can read all activities"
on public.organization_activities for select
to authenticated
using (private.can_manage_organization(organization_id));

drop policy if exists "Public can read published organization news" on public.organization_news;
create policy "Public can read published organization news"
on public.organization_news for select
to anon, authenticated
using (status = 'published');
create policy "Organization admins can read all news"
on public.organization_news for select
to authenticated
using (private.can_manage_organization(organization_id));

drop policy if exists "Public reads active organization staff" on public.organization_staff;
create policy "Public reads active organization staff"
on public.organization_staff for select
to anon, authenticated
using (active = true);
create policy "Organization admins read all organization staff"
on public.organization_staff for select
to authenticated
using (private.can_manage_organization(organization_id) or private.is_platform_admin());

drop policy if exists "Public reads active push messages" on public.push_messages;
create policy "Public reads active push messages"
on public.push_messages for select
to anon, authenticated
using (expires_at > now());
create policy "Admins read all push messages"
on public.push_messages for select
to authenticated
using (private.is_admin());
