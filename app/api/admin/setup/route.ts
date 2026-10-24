import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { assertNeonAuthConfigured, neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : "";
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }

    assertNeonAuthConfigured();
    const { data, error } = await neonAuth.getSession();
    const user = data?.user;
    if (error || !user || typeof user.id !== "string" || typeof user.email !== "string") {
      return NextResponse.json({ error: "Crie ou acesse sua conta Neon Auth antes de continuar." }, { status: 401 });
    }

    const sql = getDb();
    const rows = await sql`
      WITH linked AS (
        UPDATE admin_users
        SET auth_user_id = ${user.id},
            password_hash = NULL,
            display_name = ${name}
        WHERE lower(email) = lower(${user.email})
          AND (auth_user_id IS NULL OR auth_user_id = ${user.id})
          AND NOT EXISTS (
            SELECT 1
            FROM admin_users AS other
            WHERE other.auth_user_id = ${user.id}
              AND lower(other.email) <> lower(${user.email})
          )
        RETURNING id
      ),
      permissions AS (
        INSERT INTO admin_user_permissions (user_id, permission)
        SELECT linked.id, granted.permission
        FROM linked
        CROSS JOIN unnest(ARRAY[
          'manage_news', 'manage_categories', 'manage_authors',
          'manage_media', 'manage_users'
        ]::varchar[]) AS granted(permission)
        ON CONFLICT (user_id, permission) DO NOTHING
        RETURNING user_id
      )
      SELECT id FROM linked
    `;

    if (!rows.length) {
      return NextResponse.json({
        error: "Este e-mail não está autorizado como administrador ou já está vinculado a outra identidade. Nenhuma conta administrativa foi criada.",
      }, { status: 403 });
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha na configuração inicial do administrador", error);
    return NextResponse.json({ error: "Não foi possível concluir a configuração. Verifique a migração de identidade e permissões no banco." }, { status: 500 });
  }
}
