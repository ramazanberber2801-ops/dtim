# Yasaflow – Project Status

Last updated: July 10, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is complete. The active development phase is the customer Administrator Portal. The review of the existing implementation is complete and confirms that an organization-scoped Administrator Portal shell must be built before the Members module.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Build the organization Administrator Portal shell.
2. Resolve the authenticated administrator to one organization.
3. Complete the Members module foundation.
4. Complete organization-scoped News.
5. Complete organization-scoped Activities.

## Completed phase: Owner Dashboard V2

Owner Dashboard V2 is considered complete for the current product phase.

Completed capabilities:

- Owner-only access.
- Organization search and selection.
- Create organization flow with cancel behavior.
- Existing organization editing.
- First administrator invitation flow.
- Live App, Vercel and Supabase links.
- Hosting mode and organization status.
- Categorized and collapsible module library.
- Locked core modules.
- Organization-specific module persistence.
- Provisioning Timeline.
- Owner Overview cards.

The existing Owner Dashboard V2 should now receive only focused bug fixes or clearly justified improvements.

## User and role architecture

Yasaflow has three separate user types. They must never be mixed.

### Owner

- Belongs to Yasaflow.
- Manages the platform and all organizations.
- Is not part of any customer organization.

### Administrator

- Belongs to one organization.
- Manages that organization's content, members, activities, notifications and settings.
- Is not automatically a Member.

### Member

- Represents a person connected to an organization.
- Is not automatically an Administrator or Yasaflow user.
- May have independent memberships in several organizations.

Each organization owns its own membership data.

## Core modules

The following modules are always enabled and locked:

- News
- Activities
- Members
- Administration
- Settings

The Members module is organization-scoped and cannot be disabled.

## Administrator Portal review findings

The review is documented in `ADMIN_PORTAL_REVIEW.md`.

Key findings:

- `AdminPanelV2` currently provides Owner Dashboard V2 only.
- Non-Owner administrators do not currently have an operational portal.
- Legacy CRUD methods exist in `AppContext` for news, staff, activities, settings, administrators and push notifications.
- Legacy data queries are not scoped by `organization_id`.
- Authentication currently loads from the legacy `admins` table, while Owner onboarding uses `organization_admins`.
- DTIM-specific assumptions remain and must be migrated gradually.
- The Members database and UI do not exist yet.

## Active implementation target

The next feature is an organization Administrator Portal shell for non-Owner administrators.

It must:

- Remain separate from Owner Dashboard V2.
- Show organization-scoped navigation.
- Provide entries for the five core modules.
- Avoid implementing Members, News or Activities logic in the shell commit.
- Preserve current authentication and invitation behavior until organization resolution is handled in the following task.

## Database status

Current onboarding tables:

- `organizations`
- `organization_admins`
- `organization_modules`
- `organization_provisioning_steps`

Legacy app tables include shared content tables that are not yet organization-scoped.

Membership data must be modeled as organization-owned memberships, not as one global Members table tied directly to Yasaflow users.

## Admin invitation flow

The working flow must not be broken:

1. Owner creates or edits an organization.
2. Owner enters admin name and admin email.
3. Owner clicks `Inviter administrator`.
4. Edge Function `invite-organization-admin` sends the invitation.
5. Administrator receives the email and sets a password.
6. Administrator logs in.
7. Future work must resolve that authenticated user to the correct `organization_admins` record and organization.

## Later phases

After the Administrator Portal and core modules are mature:

- yasaflow.com public website.
- Public self-service onboarding.
- Payments and packages.
- Automated provisioning.
- Broader integrations and premium modules.

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. Future work must follow `DEVELOPMENT_RULES.md`, `DATABASE_GUIDE.md`, `UI_COMPONENTS.md` and `ADMIN_PORTAL_REVIEW.md`.
