import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return jsonNoStore({ error: "Não autorizado." }, 401);

    const sql = getDb();
    const rows = await sql`
      SELECT permission
      FROM admin_user_permissions
      WHERE user_id = ${session.id}::uuid
      ORDER BY permission
    `;

    const permissions = rows
      .map((row) => row.permission)
      .filter(
        (permission): permission is AdminPermission =>
          typeof permission === "string" &&
          ADMIN_PERMISSIONS.includes(permission as AdminPermission),
      );

    return jsonNoStore({ permissions });
  } catch (error) {
    console.error("Falha ao consultar permissões do usuário", error);
    return jsonNoStore({ error: "Não foi possível consultar permissões." }, 500);
  }
}
