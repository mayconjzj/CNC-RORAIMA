import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { assertNeonAuthConfigured, neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";

function sameSecret(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.ADMIN_SETUP_SECRET;
    if (!expectedSecret || expectedSecret.length < 32) {
      return NextResponse.json({ error: "A configuração inicial do administrador não está habilitada." }, { status: 503 });
    }

    const body = await request.json();
    const secret = typeof body.secret === "string" ? body.secret : "";
    const name = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : "";
    if (!sameSecret(secret, expectedSecret)) {
      return NextResponse.json({ error: "Código de configuração inválido." }, { status: 403 });
    }
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
      WITH state AS (
        SELECT count(*)::int AS total
        FROM admin_users
      ),
      existing AS (
        SELECT id
        FROM admin_users
        WHERE lower(email) = lower(${user.email})
        LIMIT 1
      ),
      linked AS (
        UPDATE admin_users
        SET auth_user_id = ${user.id},
            password_hash = NULL,
            display_name = ${name}
        WHERE id = (SELECT id FROM existing)
          AND (auth_user_id IS NULL OR auth_user_id <> ${user.id})
          AND NOT EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = ${user.id})
        RETURNING id
      ),
      created AS (
        INSERT INTO admin_users (email, password_hash, display_name, auth_user_id)
        SELECT ${user.email}, NULL, ${name}, ${user.id}
        WHERE (SELECT total = 0 FROM state)
        RETURNING id
      ),
      administrator AS (
        SELECT id FROM linked
        UNION ALL
        SELECT id FROM created
      ),
      permissions AS (
        INSERT INTO admin_user_permissions (user_id, permission)
        SELECT administrator.id, granted.permission
        FROM administrator
        CROSS JOIN unnest(ARRAY[
          'manage_news', 'manage_categories', 'manage_authors',
          'manage_media', 'manage_users'
        ]::varchar[]) AS granted(permission)
        ON CONFLICT (user_id, permission) DO NOTHING
        RETURNING user_id
      )
      SELECT id FROM administrator
    `;

    if (!rows.length) {
      return NextResponse.json({
        error: "A configuração inicial já foi usada ou não existe um registro administrativo com este e-mail. Não foi criada nenhuma conta administrativa.",
      }, { status: 409 });
    }

    return NextResponse.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha na configuração inicial do administrador", error);
    return NextResponse.json({ error: "Não foi possível concluir a configuração. Verifique a migração de identidade e permissões no banco." }, { status: 500 });
  }
}
