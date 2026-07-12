export const DEFAULT_ORGANIZATION_ID =
  import.meta.env.VITE_ORGANIZATION_ID || 'org-1783753789529';

export const ADMIN_SESSION_KEY = 'yasaflow_admin';
export const LEGACY_ADMIN_SESSION_KEY = 'dtim_admin';

export function readStoredAdminSession<T = Record<string, unknown>>(): T | null {
  try {
    const current = localStorage.getItem(ADMIN_SESSION_KEY);
    if (current) return JSON.parse(current) as T;

    const legacy = localStorage.getItem(LEGACY_ADMIN_SESSION_KEY);
    if (!legacy) return null;

    const parsed = JSON.parse(legacy) as T;
    localStorage.setItem(ADMIN_SESSION_KEY, legacy);
    localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredAdminSession(admin: unknown) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
  localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}

export function clearStoredAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
}

export function getCurrentOrganizationId() {
  const admin = readStoredAdminSession<{ organization_id?: string }>();
  return admin?.organization_id || DEFAULT_ORGANIZATION_ID;
}
