import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (token.length < 32 || token.length > 200) return NextResponse.json({ valid: false }, { status: 400 });
  try {
    const sql = getDb();
    const rows = await sql`SELECT email FROM admin_invitations WHERE token_hash = ${hash(token)} AND status = 'pending' AND expires_at > NOW() LIMIT 1`;
    return rows.length
      ? NextResponse.json(
          { valid: true, email: rows[0].email },
          { headers: { "Cache-Control": "private, no-store, max-age=0" } },
        )
      : NextResponse.json(
          { valid: false, error: "Convite inválido, expirado ou já utilizado." },
          { status: 410, headers: { "Cache-Control": "private, no-store, max-age=0" } },
        );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível validar o convite." },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const name = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : "";
    if (token.length < 32 || token.length > 200) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
    if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });

    const { data, error } = await neonAuth.getSession();
    const user = data?.user;
    if (error || !user || typeof user.id !== "string" || typeof user.email !== "string") {
      return NextResponse.json({ error: "Crie ou acesse sua conta Neon Auth antes de aceitar o convite." }, { status: 401 });
    }

    const sql = getDb();
    const rows = await sql`WITH invite AS (
      UPDATE admin_invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE token_hash = ${hash(token)}
        AND status = 'pending'
        AND expires_at > NOW()
        AND lower(email) = lower(${user.email})
      RETURNING email
    )
    INSERT INTO admin_users(email, password_hash, display_name, auth_user_id)
      SELECT email, NULL, ${name}, ${user.id} FROM invite
      RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Convite inválido, expirado, já utilizado ou pertencente a outro e-mail." }, { status: 410 });
    return NextResponse.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha ao aceitar convite Neon Auth", error);
    return NextResponse.json({ error: "Não foi possível concluir o convite. Verifique se esta conta já existe no painel." }, { status: 500 });
  }
}
