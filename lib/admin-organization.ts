import "server-only";

import { getDb } from "@/lib/db";
import { neonAuth } from "@/lib/neon-auth-server";

type NeonOrganization = { id?: string; organizationId?: string; name?: string; slug?: string };

function organizationId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const item = value as NeonOrganization;
  return typeof item.id === "string" ? item.id
    : typeof item.organizationId === "string" ? item.organizationId : null;
}

async function persistOrganizationId(id: string): Promise<string> {
  const sql = getDb();
  await sql`INSERT INTO admin_auth_organization (singleton, organization_id)
    VALUES (true, ${id})
    ON CONFLICT (singleton) DO NOTHING`;
  const rows = await sql`SELECT organization_id FROM admin_auth_organization WHERE singleton = true LIMIT 1`;
  if (!rows[0] || typeof rows[0].organization_id !== "string") {
    throw new Error("Não foi possível salvar a organização de convites do Neon Auth.");
  }
  return rows[0].organization_id as string;
}

/**
 * Resolve the one Neon Auth organization used for portal invitations.
 * The first authorized administrator creates it; subsequent requests reuse
 * the persisted ID. Portal permissions remain in admin_user_permissions.
 */
export async function getAdminOrganizationId(): Promise<string> {
  const sql = getDb();
  const stored = await sql`SELECT organization_id FROM admin_auth_organization WHERE singleton = true LIMIT 1`;
  if (typeof stored[0]?.organization_id === "string") return stored[0].organization_id;

  const listed = await neonAuth.organization.list();
  if (!listed.error && Array.isArray(listed.data)) {
    const existing = (listed.data as NeonOrganization[]).find((item) => item.slug === "cnc-roraima-admin");
    const id = organizationId(existing);
    if (id) return persistOrganizationId(id);
  }

  const created = await neonAuth.organization.create({
    name: "CNC Roraima",
    slug: "cnc-roraima-admin",
  });
  if (created.error) {
    // A previous concurrent request may have created the organization first.
    const retry = await neonAuth.organization.list();
    if (!retry.error && Array.isArray(retry.data)) {
      const existing = (retry.data as NeonOrganization[]).find((item) => item.slug === "cnc-roraima-admin");
      const id = organizationId(existing);
      if (id) return persistOrganizationId(id);
    }
    console.error("Falha ao criar organização do Neon Auth", created.error);
    throw new Error("Não foi possível preparar a organização de convites do Neon Auth.");
  }

  const id = organizationId(created.data);
  if (!id) throw new Error("O Neon Auth não retornou o identificador da organização criada.");
  return persistOrganizationId(id);
}
