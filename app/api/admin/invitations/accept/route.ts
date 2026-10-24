import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
export const runtime = "nodejs";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (token.length < 32 || token.length > 200) return NextResponse.json({ valid: false }, { status: 400 });
  try {
    const sql = getDb();
    const rows = await sql`SELECT email FROM admin_invitations WHERE token_hash = ${hash(token)} AND status = 'pending' AND expires_at > NOW() LIMIT 1`;
    return rows.length ? NextResponse.json({ valid: true, email: rows[0].email }) : NextResponse.json({ valid: false, error: "Convite inválido, expirado ou já utilizado." }, { status: 410 });
  } catch { return NextResponse.json({ error: "Não foi possível validar o convite." }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const name = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (token.length < 32 || token.length > 200) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
    if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    if (password.length < 12 || password.length > 200) return NextResponse.json({ error: "A senha deve ter entre 12 e 200 caracteres." }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 12);
    const sql = getDb();
    const rows = await sql`WITH invite AS (
      UPDATE admin_invitations SET status = 'accepted', accepted_at = NOW()
      WHERE token_hash = ${hash(token)} AND status = 'pending' AND expires_at > NOW()
      RETURNING email
    ) INSERT INTO admin_users(email, password_hash, display_name)
      SELECT email, ${passwordHash}, ${name} FROM invite RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Convite inválido, expirado ou já utilizado." }, { status: 410 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Falha ao aceitar convite", error);
    return NextResponse.json({ error: "Não foi possível criar a conta. Talvez este e-mail já esteja cadastrado." }, { status: 500 });
  }
}
