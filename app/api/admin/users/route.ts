import { NextResponse } from "next/server";
import { requireAdminPermission, ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
 const auth = await requireAdminPermission("manage_users"); if (auth.response) return auth.response;
 try {
  const sql = getDb();
  const users = await sql`SELECT u.id, u.email, u.display_name, u.created_at, u.last_login_at,
    COALESCE(array_agg(DISTINCT p.permission) FILTER (WHERE p.permission IS NOT NULL), ARRAY[]::varchar[]) AS permissions,
    'active'::text AS status, NULL::uuid AS invitation_id, NULL::timestamptz AS invitation_expires_at
    FROM admin_users u LEFT JOIN admin_user_permissions p ON p.user_id = u.id GROUP BY u.id
    UNION ALL
    SELECT NULL::uuid, i.email, NULL::varchar, i.created_at, NULL::timestamptz, ARRAY[]::varchar[],
      'pending'::text, i.id, i.expires_at FROM admin_invitations i
    WHERE i.status = 'pending' AND i.expires_at > NOW()
      AND NOT EXISTS (SELECT 1 FROM admin_users u WHERE lower(u.email) = lower(i.email))
    ORDER BY created_at DESC`;
  return NextResponse.json({ users });
 } catch (error) { console.error("Falha ao listar usuários", error); return NextResponse.json({ error: "Não foi possível carregar os usuários." }, { status: 500 }); }
}
export async function PATCH(request: Request) {
 const auth = await requireAdminPermission("manage_users"); if (auth.response) return auth.response;
 try {
  const body = await request.json();
  const userId = typeof body.userId === "string" ? body.userId : "";
  const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions)] : null;
  if (!userId || !permissions || permissions.some((p: unknown) => typeof p !== "string" || !(ADMIN_PERMISSIONS as readonly string[]).includes(p))) return NextResponse.json({ error: "Usuário ou permissões inválidas." }, { status: 400 });
  if (userId === auth.session!.id) return NextResponse.json({ error: "Não é possível alterar as próprias permissões." }, { status: 400 });
  const sql = getDb();
  const target = await sql`SELECT id FROM admin_users WHERE id = ${userId}::uuid LIMIT 1`;
  if (!target.length) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  await sql`WITH removed AS (
    DELETE FROM admin_user_permissions WHERE user_id = ${userId}::uuid
  )
  INSERT INTO admin_user_permissions(user_id, permission, granted_by)
  SELECT ${userId}::uuid, permission, ${auth.session!.id}::uuid
  FROM unnest(${permissions}::varchar[]) AS permission
  ON CONFLICT (user_id, permission) DO NOTHING`;
  return NextResponse.json({ ok: true, permissions });
 } catch (error) { console.error("Falha ao salvar permissões", error); return NextResponse.json({ error: "Não foi possível salvar as permissões." }, { status: 500 }); }
}
export async function POST() { return NextResponse.json({ error: "Use o fluxo de convite por e-mail." }, { status: 405 }); }
