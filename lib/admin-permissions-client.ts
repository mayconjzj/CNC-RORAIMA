let cachedPermissions: string[] | null = null;
let permissionsRequest: Promise<string[]> | null = null;

export function getCachedAdminPermissions(): string[] | null {
  return cachedPermissions;
}

export function setCachedAdminPermissions(permissions: string[]) {
  cachedPermissions = permissions;
}

export function clearAdminPermissionsCache() {
  cachedPermissions = null;
  permissionsRequest = null;
}

export async function loadAdminPermissions(): Promise<string[]> {
  if (cachedPermissions !== null) return cachedPermissions;
  if (permissionsRequest) return permissionsRequest;

  permissionsRequest = fetch("/api/admin/me", { cache: "no-store" })
    .then(async (response) => {
      if (response.status === 401) {
        clearAdminPermissionsCache();
        throw new Error("Sessão administrativa expirada.");
      }
      if (!response.ok) {
        throw new Error("Não foi possível verificar suas permissões.");
      }
      const data = await response.json() as { permissions?: string[] };
      cachedPermissions = data.permissions ?? [];
      return cachedPermissions;
    })
    .finally(() => {
      permissionsRequest = null;
    });

  return permissionsRequest;
}
