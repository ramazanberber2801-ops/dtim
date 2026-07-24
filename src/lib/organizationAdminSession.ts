import { supabase } from './supabase';

export type OrganizationAdminSession = {
  organizationId: string;
  organizationName: string;
  organizationLogoUrl: string;
  organizationStatus: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  trialStartedAt: string;
  trialEndsAt: string;
  adminDisplayName: string;
  adminEmail: string;
  adminRole: string;
  invitationStatus: string;
};

type OrganizationAdminRow = {
  organization_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  role?: string | null;
  invitation_status?: string | null;
  organizations?: unknown;
};

function organizationFromRelation(value: unknown) {
  if (Array.isArray(value)) return value[0] || null;
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return null;
}

function chooseAdminRow(rows: OrganizationAdminRow[] | null | undefined) {
  if (!rows?.length) return null;

  // A user can be connected to more than one organization. Prefer an accepted/active
  // membership with a valid organization relation, then fall back to the first valid row.
  const validRows = rows.filter((row) => row.organization_id && organizationFromRelation(row.organizations)?.id);
  if (!validRows.length) return rows.find((row) => row.organization_id) || rows[0];

  return (
    validRows.find((row) => ['accepted', 'active'].includes(String(row.invitation_status || '').toLowerCase())) ||
    validRows[0]
  );
}

export async function resolveOrganizationAdminSession(): Promise<OrganizationAdminSession> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    throw new Error('Fant ingen aktiv innlogging. Logg inn på nytt.');
  }

  const columns = 'organization_id, display_name, email, role, invitation_status, organizations(id, name, logo_url, status, subscription_status, subscription_plan, trial_started_at, trial_ends_at)';

  const userMemberships = await supabase
    .from('organization_admins')
    .select(columns)
    .eq('user_id', user.id);

  let adminRows = userMemberships.data as OrganizationAdminRow[] | null;
  let adminError = userMemberships.error;

  if ((!adminRows || adminRows.length === 0) && user.email) {
    const fallback = await supabase
      .from('organization_admins')
      .select(columns)
      .ilike('email', user.email.trim());

    adminRows = fallback.data as OrganizationAdminRow[] | null;
    adminError = fallback.error;
  }

  if (adminError) {
    throw new Error(`Kunne ikke hente organisasjonstilknytning: ${adminError.message}`);
  }

  const adminRow = chooseAdminRow(adminRows);

  if (!adminRow?.organization_id) {
    throw new Error('Denne administratoren er ikke koblet til en organisasjon ennå.');
  }

  const organization = organizationFromRelation(adminRow.organizations);

  if (!organization?.id) {
    throw new Error('Organisasjonen til administratoren ble ikke funnet.');
  }

  return {
    organizationId: String(organization.id),
    organizationName: String(organization.name || 'Din organisasjon'),
    organizationLogoUrl: String(organization.logo_url || ''),
    organizationStatus: String(organization.status || ''),
    subscriptionStatus: String(organization.subscription_status || 'trial'),
    subscriptionPlan: String(organization.subscription_plan || 'core'),
    trialStartedAt: String(organization.trial_started_at || ''),
    trialEndsAt: String(organization.trial_ends_at || ''),
    adminDisplayName: String(adminRow.display_name || user.email || 'Administrator'),
    adminEmail: String(adminRow.email || user.email || ''),
    adminRole: String(adminRow.role || 'admin'),
    invitationStatus: String(adminRow.invitation_status || ''),
  };
}
