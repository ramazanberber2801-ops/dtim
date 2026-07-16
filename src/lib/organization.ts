import { supabase } from './supabase';

export const SELECTED_ORGANIZATION_KEY = 'yasaflow_selected_organization_id';
export const ADMIN_SESSION_KEY = 'yasaflow_admin';
export const LEGACY_ADMIN_SESSION_KEY = 'dtim_admin';

function readInitialOrganizationId() {
  const fallback = import.meta.env.VITE_ORGANIZATION_ID || 'org-1783753789529';
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('org');
    if (fromQuery) {
      localStorage.setItem(SELECTED_ORGANIZATION_KEY, fromQuery);
      return fromQuery;
    }
    return localStorage.getItem(SELECTED_ORGANIZATION_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export let DEFAULT_ORGANIZATION_ID = readInitialOrganizationId();

export function getYasaflowSubdomain(hostname = window.location.hostname) {
  const host = hostname.toLowerCase().split(':')[0];
  if (host === 'localhost' || host.endsWith('.vercel.app')) return '';
  if (!host.endsWith('.yasaflow.com')) return '';
  const slug = host.slice(0, -'.yasaflow.com'.length);
  if (!slug || ['www','app','test'].includes(slug)) return '';
  return slug;
}

export async function resolveOrganizationFromHostname() {
  const slug = getYasaflowSubdomain();
  const client = supabase;
  if (!slug || !client) return DEFAULT_ORGANIZATION_ID;

  const { data, error } = await client.rpc('get_organization_by_slug', { p_slug: slug });
  const organizationId = Array.isArray(data) ? data[0]?.id : data?.id;
  if (error || !organizationId) {
    console.warn('Fant ingen organisasjon for subdomenet:', slug, error?.message || '');
    return DEFAULT_ORGANIZATION_ID;
  }

  DEFAULT_ORGANIZATION_ID = organizationId;
  localStorage.setItem(SELECTED_ORGANIZATION_KEY, organizationId);
  return organizationId;
}

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

export function readSelectedOrganizationId() {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('org');
    if (fromQuery) {
      localStorage.setItem(SELECTED_ORGANIZATION_KEY, fromQuery);
      return fromQuery;
    }
    return localStorage.getItem(SELECTED_ORGANIZATION_KEY) || '';
  } catch {
    return '';
  }
}

export function selectOrganization(organizationId: string) {
  DEFAULT_ORGANIZATION_ID = organizationId;
  localStorage.setItem(SELECTED_ORGANIZATION_KEY, organizationId);
  window.dispatchEvent(new CustomEvent('yasaflow-organization-changed', { detail: { organizationId } }));
}

export function getCurrentOrganizationId() {
  const subdomain = getYasaflowSubdomain();
  if (subdomain) return DEFAULT_ORGANIZATION_ID;
  const selected = readSelectedOrganizationId();
  if (selected) return selected;
  const admin = readStoredAdminSession<{ organization_id?: string }>();
  return admin?.organization_id || DEFAULT_ORGANIZATION_ID;
}
