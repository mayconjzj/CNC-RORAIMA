const ADMIN_SESSION_KEY = "cnc-admin-session";
const ACTIVE_SESSION_VALUE = "active";

/**
 * The marker is only a UI hint. Every protected API still validates the
 * server-side session, so storage failures must never grant access or crash
 * a page render.
 */
export function hasAdminSessionMarker(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === ACTIVE_SESSION_VALUE;
  } catch {
    return false;
  }
}

export function markAdminSessionActive(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, ACTIVE_SESSION_VALUE);
  } catch {
    // The server-side session remains authoritative if storage is unavailable.
  }
}

export function clearAdminSessionMarker(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore unavailable storage; protected APIs will continue to enforce auth.
  }
}
