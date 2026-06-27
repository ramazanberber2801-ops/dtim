/**
 * Session storage helpers.
 *
 * Data persistence (news, staff, settings, etc.) has been migrated to Supabase.
 * These helpers remain ONLY for admin session management ("Beni Hatırla").
 */

const STORAGE_KEYS = {
  SESSION: 'dtim_admin_session',
} as const;

export { STORAGE_KEYS };

// ===== localStorage (persistent — "Beni Hatırla" checked) =====

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) as T : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove from localStorage:', e);
  }
}

// ===== sessionStorage (non-persistent — "Beni Hatırla" unchecked) =====

export function loadFromSessionStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) as T : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToSessionStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to sessionStorage:', e);
  }
}

export function removeFromSessionStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove from sessionStorage:', e);
  }
}
