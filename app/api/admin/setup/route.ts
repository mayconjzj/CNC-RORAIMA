import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const configuredToken = process.env.ADMIN_SETUP_TOKEN;
    if (!configuredToken || typeof body.token !== "string" || body.token.length < 32 || body.token !== configuredToken) {
      return NextResponse.json({ error: "Token de configuração inválido." }, { status: 403 });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 100) : "Administrador";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 200) {
      return NextResponse.json({ error: "Informe um e-mail válido e uma senha com pelo menos 12 caracteres." }, { status: 400 });
    }
    const sql = getDb();
    const existing = await sql`SELECT id FROM admin_users LIMIT 1`;
    if (existing.length) return NextResponse.json({ error: "Já existe um administrador. A configuração inicial está bloqueada." }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    await sql`INSERT INTO admin_users (email, password_hash, display_name) VALUES (${email}, ${passwordHash}, ${displayName}) RETURNING id`;
    return NextResponse.json({ ok: true, message: "Administrador criado. Remova ADMIN_SETUP_TOKEN das variáveis da Vercel após o primeiro acesso." }, { status: 201 });
  } catch (error) {
    console.error("Falha na configuração inicial do administrador", error);
    return NextResponse.json({ error: "Não foi possível configurar o administrador." }, { status: 500 });
  }
}
