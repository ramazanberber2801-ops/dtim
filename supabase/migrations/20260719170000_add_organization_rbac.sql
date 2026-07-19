-- Central role helpers for organization-scoped authorization.
create or replace function public.yasaflow_is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('owner', 'superadmin', 'platform_owner'),
    false
  );
$$;

create or replace function public.yasaflow_organization_role(target_organization_id text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when public.yasaflow_is_platform_owner() then 'owner'
    else (
      select oa.role
      from public.organization_admins oa
      where oa.organization_id = target_organization_id
        and lower(oa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and coalesce(oa.invitation_status, 'active') in ('accepted', 'active')
      limit 1
    )
  end;
$$;

create or replace function public.yasaflow_has_organization_role(
  target_organization_id text,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.yasaflow_organization_role(target_organization_id) = any(allowed_roles), false);
$$;

grant execute on function public.yasaflow_is_platform_owner() to authenticated;
grant execute on function public.yasaflow_organization_role(text) to authenticated;
grant execute on function public.yasaflow_has_organization_role(text, text[]) to authenticated;

-- Members: organization members may read. Owners and platform owners may change roles.
alter table public.organization_admins enable row level security;

drop policy if exists "Organization members can read organization admins" on public.organization_admins;
drop policy if exists "Organization owners can insert organization admins" on public.organization_admins;
drop policy if exists "Organization owners can update organization admins" on public.organization_admins;
drop policy if exists "Organization owners can delete organization admins" on public.organization_admins;

create policy "Organization members can read organization admins"
on public.organization_admins
for select
to authenticated
using (
  public.yasaflow_has_organization_role(organization_id, array['owner','admin','staff'])
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Organization owners can insert organization admins"
on public.organization_admins
for insert
to authenticated
with check (public.yasaflow_has_organization_role(organization_id, array['owner']));

create policy "Organization owners can update organization admins"
on public.organization_admins
for update
to authenticated
using (public.yasaflow_has_organization_role(organization_id, array['owner']))
with check (public.yasaflow_has_organization_role(organization_id, array['owner']));

create policy "Organization owners can delete organization admins"
on public.organization_admins
for delete
to authenticated
using (public.yasaflow_has_organization_role(organization_id, array['owner']));

-- Invitations: owner and admin can inspect and manage invitations for their own organization.
alter table public.organization_invitations enable row level security;
drop policy if exists "Authenticated users can read organization invitations" on public.organization_invitations;
drop policy if exists "Organization managers can read invitations" on public.organization_invitations;
drop policy if exists "Organization managers can create invitations" on public.organization_invitations;
drop policy if exists "Organization managers can update invitations" on public.organization_invitations;
drop policy if exists "Organization owners can delete invitations" on public.organization_invitations;

create policy "Organization managers can read invitations"
on public.organization_invitations
for select
to authenticated
using (public.yasaflow_has_organization_role(organization_id, array['owner','admin']));

create policy "Organization managers can create invitations"
on public.organization_invitations
for insert
to authenticated
with check (
  public.yasaflow_has_organization_role(organization_id, array['owner','admin'])
  and role <> 'owner'
);

create policy "Organization managers can update invitations"
on public.organization_invitations
for update
to authenticated
using (public.yasaflow_has_organization_role(organization_id, array['owner','admin']))
with check (
  public.yasaflow_has_organization_role(organization_id, array['owner','admin'])
  and role <> 'owner'
);

create policy "Organization owners can delete invitations"
on public.organization_invitations
for delete
to authenticated
using (public.yasaflow_has_organization_role(organization_id, array['owner']));

comment on function public.yasaflow_organization_role(text) is
  'Returns owner, admin or staff for the signed-in user in one organization. Platform owners resolve as owner.';
