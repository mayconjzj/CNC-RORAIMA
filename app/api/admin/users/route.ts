import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 200;

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_login_at: string | null;
};

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const sql = getDb();
    const users = await sql`
      SELECT id, email, display_name, created_at, last_login_at
      FROM admin_users
      ORDER BY created_at DESC
    ` as unknown as AdminUser[];

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Falha ao listar usuários administrativos", error);
    return NextResponse.json({ error: "Não foi possível carregar os usuários." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const displayName = typeof body.displayName === "string"
      ? body.displayName.trim().replace(/\s+/g, " ")
      : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Informe um endereço de e-mail válido." }, { status: 400 });
    }
    if (displayName.length < 2 || displayName.length > 100) {
      return NextResponse.json({ error: "O nome deve ter entre 2 e 100 caracteres." }, { status: 400 });
    }
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      return NextResponse.json({ error: "A senha deve ter entre 12 e 200 caracteres." }, { status: 400 });
    }

    const sql = getDb();
    const existing = await sql`
      SELECT id FROM admin_users WHERE lower(email) = ${email} LIMIT 1
    `;
    if (existing.length) {
      return NextResponse.json({ error: "Já existe um usuário cadastrado com esse e-mail." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO admin_users (email, password_hash, display_name)
      VALUES (${email}, ${passwordHash}, ${displayName})
      RETURNING id, email, display_name, created_at, last_login_at
    ` as unknown as AdminUser[];

    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar usuário administrativo", error);
    return NextResponse.json({ error: "Não foi possível criar o usuário." }, { status: 500 });
  }
}
