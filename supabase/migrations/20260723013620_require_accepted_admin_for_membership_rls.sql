drop policy if exists membership_invitation_codes_admin_all on public.organization_membership_invitation_codes;
create policy membership_invitation_codes_admin_all
on public.organization_membership_invitation_codes
for all
to authenticated
using (
  exists (
    select 1 from public.organization_admins a
    where a.organization_id = organization_membership_invitation_codes.organization_id
      and a.user_id = (select auth.uid())
      and a.invitation_status = 'accepted'
      and a.role in ('owner','admin')
  )
  or private.is_platform_admin()
)
with check (
  exists (
    select 1 from public.organization_admins a
    where a.organization_id = organization_membership_invitation_codes.organization_id
      and a.user_id = (select auth.uid())
      and a.invitation_status = 'accepted'
      and a.role in ('owner','admin')
  )
  or private.is_platform_admin()
);

drop policy if exists "organization admins can read membership requests" on public.organization_membership_requests;
create policy "organization admins can read membership requests"
on public.organization_membership_requests
for select
to authenticated
using (
  exists (
    select 1 from public.organization_admins a
    where a.organization_id = organization_membership_requests.organization_id
      and a.user_id = (select auth.uid())
      and a.invitation_status = 'accepted'
      and a.role in ('owner','admin')
  )
  or private.is_platform_admin()
);
