import { supabase } from './supabase';

export type OrganizationAdminSession = {
  organizationId: string;
  organizationName: string;
  organizationLogoUrl: string;
  organizationStatus: string;
  adminDisplayName: string;
  adminEmail: string;
  adminRole: string;
  invitationStatus: string;
};

function organizationFromRelation(value: unknown) {
  if (Array.isArray(value)) return value[0] || null;
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return null;
}

export async function resolveOrganizationAdminSession(): Promise<OrganizationAdminSession> {
  if (!supabase) throw new Error('Supabase er ikke konfigurert.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    throw new Error('Fant ingen aktiv innlogging. Logg inn på nytt.');
  }

  const columns = 'organization_id, display_name, email, role, invitation_status, organizations(id, name, logo_url, status)';

  let { data: adminRow, error: adminError } = await supabase
    .from('organization_admins')
    .select(columns)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow && user.email) {
    const fallback = await supabase
      .from('organization_admins')
      .select(columns)
      .eq('email', user.email.trim().toLowerCase())
      .maybeSingle();

    adminRow = fallback.data;
    adminError = fallback.error;
  }

  if (adminError) {
    throw new Error(`Kunne ikke hente organisasjonstilknytning: ${adminError.message}`);
  }

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
    adminDisplayName: String(adminRow.display_name || user.email || 'Administrator'),
    adminEmail: String(adminRow.email || user.email || ''),
    adminRole: String(adminRow.role || 'admin'),
    invitationStatus: String(adminRow.invitation_status || ''),
  };
}
