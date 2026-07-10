# Yasaflow – Members Database Foundation

## Status

The database migration is available at:

`supabase/migrations/20260710_members_foundation.sql`

The migration must be run in Supabase before the Members UI can read or write member data.

## Data model

### `people`

Stores person-level identity and contact data:

- `id`
- `full_name`
- `primary_email`
- `primary_phone`
- `profile_image_url`
- timestamps

This table contains no organization-specific membership status or internal role.

### `organization_memberships`

Stores one independent membership relationship between one person and one organization:

- `organization_id`
- `person_id`
- `member_number`
- organization-specific email and phone
- address
- join date
- active/inactive status
- future group reference
- internal member role
- internal notes
- timestamps

## Separation rules

- A Member is not automatically an Administrator.
- An Administrator is not automatically a Member.
- Internal member roles do not grant administrative access.
- One person can have independent memberships in several organizations.
- Member numbers are unique within one organization when provided.

## Security

Row-level security is enabled for both tables.

Organization administrators can manage only memberships belonging to organizations where `organization_admins.user_id = auth.uid()`.

Person records are visible and editable only when connected to a membership in an organization administered by the authenticated user.

## Deferred items

Not included in this foundation:

- Member UI
- Groups table
- Family relationships
- QR cards
- Attendance
- Membership fees
- Tags and skills
- Import/export
