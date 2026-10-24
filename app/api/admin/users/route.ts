import { NextResponse } from "next/server";
import { requireAdminPermission, ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;

  try {
    const sql = getDb();
    const users = await sql`
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.created_at,
        u.last_login_at,
        COALESCE(
          array_agg(DISTINCT p.permission) FILTER (WHERE p.permission IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS permissions,
        'active'::text AS status,
        NULL::uuid AS invitation_id,
        NULL::timestamptz AS invitation_expires_at
      FROM admin_users u
      LEFT JOIN admin_user_permissions p ON p.user_id = u.id
      GROUP BY u.id
      UNION ALL
      SELECT
        NULL::uuid,
        i.email,
        NULL::varchar,
        i.created_at,
        NULL::timestamptz,
        ARRAY[]::varchar[],
        'pending'::text,
        i.id,
        i.expires_at
      FROM admin_invitations i
      WHERE i.status = 'pending'
        AND i.expires_at > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM admin_users u WHERE lower(u.email) = lower(i.email)
        )
      ORDER BY created_at DESC
    `;

    return NextResponse.json(
      { users },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha ao listar usuários", error);
    return NextResponse.json({ error: "Não foi possível carregar os usuários." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Informe usuário e permissões válidos." }, { status: 400 });
    }

    const payload = body as { userId?: unknown; permissions?: unknown };
    const userId = typeof payload.userId === "string" ? payload.userId : "";
    const rawPermissions = payload.permissions;
    const validPermissions = Array.isArray(rawPermissions) &&
      rawPermissions.every(
        (permission: unknown) =>
          typeof permission === "string" &&
          (ADMIN_PERMISSIONS as readonly string[]).includes(permission),
      );

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) || !validPermissions) {
      return NextResponse.json({ error: "Usuário ou permissões inválidas." }, { status: 400 });
    }

    const permissions = [...new Set(rawPermissions as string[])];
    const primary = await getDb()`SELECT id FROM admin_users ORDER BY created_at ASC, id ASC LIMIT 1`;
    if (primary[0]?.id === userId) return NextResponse.json({ error: "A conta do administrador principal não pode ser alterada por este painel." }, { status: 403 });
    if (userId === auth.session!.id) {
      return NextResponse.json({ error: "Não é possível alterar as próprias permissões." }, { status: 400 });
    }

    const sql = getDb();
    const target = await sql`SELECT id FROM admin_users WHERE id = ${userId}::uuid LIMIT 1`;
    if (!target.length) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Todas as alterações são confirmadas juntas; uma falha não deixa o usuário
    // com permissões parcialmente apagadas ou aplicadas.
    const queries = [
      sql`DELETE FROM admin_user_permissions WHERE user_id = ${userId}::uuid`,
      ...permissions.map((permission) =>
        sql`
          INSERT INTO admin_user_permissions (user_id, permission, granted_by)
          VALUES (${userId}::uuid, ${permission}, ${auth.session!.id}::uuid)
          ON CONFLICT DO NOTHING
        `,
      ),
    ];
    await sql.transaction(queries);

    return NextResponse.json(
      { ok: true, permissions },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha ao salvar permissões", error);
    return NextResponse.json({ error: "Não foi possível salvar as permissões." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    if (userId === auth.session!.id) return NextResponse.json({ error: "Você não pode excluir sua própria conta." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`SELECT id FROM admin_users WHERE id = ${userId}::uuid LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const primary = await sql`SELECT id FROM admin_users ORDER BY created_at ASC, id ASC LIMIT 1`;
    if (primary[0]?.id === userId) return NextResponse.json({ error: "A conta do administrador principal não pode ser excluída." }, { status: 403 });
    await sql`DELETE FROM admin_users WHERE id = ${userId}::uuid`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Falha ao excluir usuário", error);
    return NextResponse.json({ error: "Não foi possível excluir o usuário." }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Use o fluxo de convite por e-mail." }, { status: 405 });
}
