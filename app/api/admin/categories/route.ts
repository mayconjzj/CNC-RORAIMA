import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const [categories, authors] = await Promise.all([
      sql`SELECT id, name FROM categories ORDER BY name`,
      sql`SELECT id, name FROM authors ORDER BY name`,
    ]);
    return NextResponse.json({ categories, authors });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar editorias e autores." }, { status: 500 });
  }
}


export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().replace(/\\s+/g, " ") : "";
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "O nome da editoria deve ter entre 2 e 60 caracteres." }, { status: 400 });
    }
    const baseSlug = name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    if (!baseSlug) return NextResponse.json({ error: "Informe um nome válido para a editoria." }, { status: 400 });
    const sql = getDb();
    const existing = await sql`SELECT id, name, slug FROM categories WHERE LOWER(name) = LOWER(${name}) LIMIT 1`;
    if (existing[0]) return NextResponse.json({ category: existing[0], existing: true });
    const slug = baseSlug + "-" + crypto.randomUUID().slice(0, 6);
    const rows = await sql`
      INSERT INTO categories (name, slug)
      VALUES (${name}, ${slug})
      RETURNING id, name, slug
    `;
    return NextResponse.json({ category: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar editoria", error);
    return NextResponse.json({ error: "Não foi possível criar a editoria." }, { status: 500 });
  }
}
