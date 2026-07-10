# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is complete. The organization Administrator Portal now resolves an authenticated Supabase user to `organization_admins` and the correct organization before displaying organization data. The invitation Edge Function deployment remains deferred until after July 29, 2026.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Add the Members database foundation.
2. Build the first Members list and create/edit flow.
3. Complete organization-scoped News.
4. Complete organization-scoped Activities.
5. After July 29, deploy and verify the administrator invitation Edge Function.

## Completed phase: Owner Dashboard V2

Owner Dashboard V2 is complete for the current product phase and should receive only focused bug fixes.

## User and role architecture

- Owner belongs to Yasaflow and manages all organizations.
- Administrator belongs to one organization and is not automatically a Member.
- Member represents an organization-owned membership and may exist independently in several organizations.

## Administrator Portal status

Completed:

- Separate non-Owner Administrator Portal shell.
- Responsive dashboard and core module navigation.
- Supabase authenticated user lookup.
- Resolution by `organization_admins.user_id`.
- Temporary fallback resolution by normalized administrator email.
- Organization identity, logo and status loaded from `organizations`.
- Organization access is refused when no valid organization administrator record is found.
- Owner Dashboard V2 remains separate.

Current limitations:

- `AppContext.login` still begins with the legacy `admins` profile lookup. Full login migration is postponed to a separate focused task.
- The email fallback should be removed after all invitation records reliably receive `user_id`.
- No Members, News or Activities data is loaded by the new portal yet.
- `invite-organization-admin` exists in GitHub but is not deployed in Supabase.

## Deferred task — after July 29, 2026

- Deploy `invite-organization-admin` to Supabase.
- Verify invitation email, redirect and password setup.
- Verify `organization_admins.user_id` and invitation status.
- Remove the temporary email fallback after verified migration.

## Active implementation target

Add the organization-owned Members database foundation with migration and RLS. Members must remain separate from Administrators and all records must include `organization_id`.

## Database status

Current onboarding tables:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

The next migration adds the Members foundation.

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future work must follow `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md`, `UI_COMPONENTS.md` and `ADMIN_PORTAL_REVIEW.md`.
