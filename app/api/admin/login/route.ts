import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || password.length > 200) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`SELECT id, email, password_hash, display_name FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
    const user = rows[0] as { id: string; email: string; password_hash: string; display_name: string | null } | undefined;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }
    await createAdminSession({ id: user.id, email: user.email, displayName: user.display_name });
    await sql`UPDATE admin_users SET last_login_at = NOW() WHERE id = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Falha no login administrativo", error);
    return NextResponse.json({ error: "Não foi possível entrar. Verifique a configuração do servidor." }, { status: 500 });
  }
}
