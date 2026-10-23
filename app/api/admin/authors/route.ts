import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { revalidatePublishedContent } from "@/lib/revalidation";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const authors = await sql`SELECT id, name, bio, avatar_url, created_at FROM authors ORDER BY name`;
    return NextResponse.json({ authors });
  } catch (error) {
    console.error("Falha ao listar autores", error);
    return NextResponse.json({ error: "Não foi possível carregar os autores." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "O nome deve ter entre 2 e 120 caracteres." }, { status: 400 });
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) return NextResponse.json({ error: "A foto deve usar uma URL http ou https." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`INSERT INTO authors (name, bio, avatar_url) VALUES (${name}, ${bio || null}, ${avatarUrl || null}) RETURNING id, name, bio, avatar_url, created_at`;
    revalidatePublishedContent();
    return NextResponse.json({ author: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar autor", error);
    return NextResponse.json({ error: "Não foi possível cadastrar o autor." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
    if (!id) return NextResponse.json({ error: "Autor inválido." }, { status: 400 });
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "O nome deve ter entre 2 e 120 caracteres." }, { status: 400 });
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) return NextResponse.json({ error: "A foto deve usar uma URL http ou https." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`UPDATE authors SET name = ${name}, bio = ${bio || null}, avatar_url = ${avatarUrl || null} WHERE id = ${id} RETURNING id, name, bio, avatar_url, created_at`;
    if (!rows.length) return NextResponse.json({ error: "Autor não encontrado." }, { status: 404 });
    revalidatePublishedContent();
    return NextResponse.json({ author: rows[0] });
  } catch (error) {
    console.error("Falha ao editar autor", error);
    return NextResponse.json({ error: "Não foi possível atualizar o autor." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Autor inválido." }, { status: 400 });
    const sql = getDb();
    const existing = await sql`SELECT id, name FROM authors WHERE id = ${id} LIMIT 1`;
    if (!existing.length) return NextResponse.json({ error: "Autor não encontrado." }, { status: 404 });
    await sql`UPDATE articles SET author_id = NULL WHERE author_id = ${id}`;
    const rows = await sql`DELETE FROM authors WHERE id = ${id} RETURNING id, name`;
    revalidatePublishedContent();
    return NextResponse.json({ success: true, author: rows[0] });
  } catch (error) {
    console.error("Falha ao excluir autor", error);
    return NextResponse.json({ error: "Não foi possível excluir o autor." }, { status: 500 });
  }
}
