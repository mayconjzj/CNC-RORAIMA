import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const ADMIN_PERMISSIONS = [
  "manage_news",
  "manage_categories",
  "manage_authors",
  "manage_media",
  "manage_users",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export async function hasAdminPermission(userId: string, permission: AdminPermission): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    SELECT 1 FROM admin_user_permissions
    WHERE user_id = ${userId}::uuid AND permission = ${permission}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) };
  }
  try {
    if (!(await hasAdminPermission(session.id, permission))) {
      return { session: null, response: NextResponse.json({ error: "Você não tem permissão para acessar este recurso." }, { status: 403 }) };
    }
    return { session, response: null };
  } catch (error) {
    console.error("Falha ao verificar permissão administrativa", error);
    return { session: null, response: NextResponse.json({ error: "Não foi possível verificar suas permissões." }, { status: 500 }) };
  }
}

export async function requireAnyAdminPermission(permissions: readonly AdminPermission[]) {
  const session = await getAdminSession();
  if (!session) return { session: null, response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) };
  try {
    for (const permission of permissions) {
      if (await hasAdminPermission(session.id, permission)) return { session, response: null };
    }
    return { session: null, response: NextResponse.json({ error: "Você não tem permissão para acessar este recurso." }, { status: 403 }) };
  } catch (error) {
    console.error("Falha ao verificar permissões administrativas", error);
    return { session: null, response: NextResponse.json({ error: "Não foi possível verificar suas permissões." }, { status: 500 }) };
  }
}
