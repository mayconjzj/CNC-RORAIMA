const ADMIN_PERMISSIONS = [
  "manage_news",
  "manage_categories",
  "manage_authors",
  "manage_media",
  "manage_users",
] as const;

type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

let cachedPermissions: AdminPermission[] | null = null;
let permissionsRequest: { generation: number; promise: Promise<AdminPermission[]> } | null = null;
let generation = 0;

function normalizePermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (permission): permission is AdminPermission =>
      typeof permission === "string" &&
      ADMIN_PERMISSIONS.includes(permission as AdminPermission),
  );
}

export function getCachedAdminPermissions(): AdminPermission[] | null {
  return cachedPermissions === null ? null : [...cachedPermissions];
}

export function setCachedAdminPermissions(permissions: string[]): void {
  generation += 1;
  cachedPermissions = normalizePermissions(permissions);
  permissionsRequest = null;
}

export function clearAdminPermissionsCache(): void {
  generation += 1;
  cachedPermissions = null;
  permissionsRequest = null;
}

export async function loadAdminPermissions(): Promise<AdminPermission[]> {
  if (cachedPermissions !== null) return [...cachedPermissions];

  if (permissionsRequest?.generation === generation) {
    return permissionsRequest.promise;
  }

  const requestGeneration = generation;
  const promise = fetch("/api/admin/me", { cache: "no-store" })
    .then(async (response) => {
      if (response.status === 401) {
        if (generation === requestGeneration) clearAdminPermissionsCache();
        throw new Error("Sessão administrativa expirada.");
      }

      if (!response.ok) {
        throw new Error("Não foi possível verificar suas permissões.");
      }

      const data: unknown = await response.json();
      const permissions =
        typeof data === "object" && data !== null && "permissions" in data
          ? normalizePermissions(data.permissions)
          : [];

      // A resposta de uma requisição iniciada antes do logout/login não pode
      // sobrescrever as permissões da sessão atual.
      if (generation !== requestGeneration) {
        throw new Error("A verificação de permissões foi invalidada.");
      }

      cachedPermissions = permissions;
      return [...permissions];
    })
    .finally(() => {
      if (permissionsRequest?.promise === promise) {
        permissionsRequest = null;
      }
    });

  permissionsRequest = { generation: requestGeneration, promise };
  return promise;
}
