const ADMIN_SESSION_KEY = "cnc-admin-session";
const ACTIVE_SESSION_VALUE = "active";

export function hasAdminSessionMarker(): boolean {
  return typeof window !== "undefined" &&
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === ACTIVE_SESSION_VALUE;
}

export function markAdminSessionActive(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, ACTIVE_SESSION_VALUE);
  }
}

export function clearAdminSessionMarker(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}
