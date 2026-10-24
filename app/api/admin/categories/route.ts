import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { revalidatePublishedContent } from "@/lib/revalidation";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const [categories, authors] = await Promise.all([
      sql`SELECT c.id, c.name, c.slug FROM categories c ORDER BY c.name`,
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
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "O nome da editoria deve ter entre 2 e 60 caracteres." }, { status: 400 });
    }
    const baseSlug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
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
    revalidatePublishedContent();
    return NextResponse.json({ category: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar editoria", error);
    return NextResponse.json({ error: "Não foi possível criar a editoria." }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim().replace(/\\s+/g, " ") : "";
    if (!id) return NextResponse.json({ error: "Informe a editoria que deseja editar." }, { status: 400 });
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "O nome da editoria deve ter entre 2 e 60 caracteres." }, { status: 400 });
    }
    const baseSlug = name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    if (!baseSlug) return NextResponse.json({ error: "Informe um nome válido para a editoria." }, { status: 400 });
    const sql = getDb();
    const existing = await sql`SELECT id, name, slug FROM categories WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: "Editoria não encontrada." }, { status: 404 });
    const duplicate = await sql`SELECT id, name, slug FROM categories WHERE LOWER(name) = LOWER(${name}) AND id <> ${id} LIMIT 1`;
    if (duplicate[0]) return NextResponse.json({ error: "Já existe outra editoria com esse nome." }, { status: 409 });
    if (existing[0].name === name) return NextResponse.json({ category: existing[0], unchanged: true });
    const slug = baseSlug + "-" + crypto.randomUUID().slice(0, 6);
    const rows = await sql`UPDATE categories SET name = ${name}, slug = ${slug} WHERE id = ${id} RETURNING id, name, slug`;
    revalidatePublishedContent();
    return NextResponse.json({ category: rows[0] });
  } catch (error) {
    console.error("Falha ao atualizar editoria", error);
    return NextResponse.json({ error: "Não foi possível atualizar a editoria." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Informe a editoria que deseja excluir." }, { status: 400 });
    const sql = getDb();
    const existing = await sql`SELECT id, name FROM categories WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: "Editoria não encontrada." }, { status: 404 });
    await sql`UPDATE articles SET category_id = NULL WHERE category_id = ${id}`;
    await sql`DELETE FROM categories WHERE id = ${id}`;
    revalidatePublishedContent();
    return NextResponse.json({ success: true, name: existing[0].name });
  } catch (error) {
    console.error("Falha ao excluir editoria", error);
    return NextResponse.json({ error: "Não foi possível excluir a editoria." }, { status: 500 });
  }
}
