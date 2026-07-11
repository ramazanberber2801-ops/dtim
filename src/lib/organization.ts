export const DEFAULT_ORGANIZATION_ID =
  import.meta.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

export function getCurrentOrganizationId() {
  try {
    const saved = localStorage.getItem('dtim_admin');
    const admin = saved ? JSON.parse(saved) : null;
    return admin?.organization_id || DEFAULT_ORGANIZATION_ID;
  } catch {
    return DEFAULT_ORGANIZATION_ID;
  }
}
