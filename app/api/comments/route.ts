import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() ?? "";
    if (!slug || slug.length > 180) return NextResponse.json({ error: "Informe a notícia." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      SELECT c.id, c.author_name, c.body, c.created_at
      FROM comments c JOIN articles a ON a.id = c.article_id
      WHERE a.slug = ${slug} AND a.status = 'published' AND c.status = 'approved'
      ORDER BY c.created_at DESC LIMIT 100
    `;
    return NextResponse.json({ comments: rows });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os comentários." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const authorName = typeof body.name === "string" ? body.name.trim() : "";
    const authorEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const comment = typeof body.body === "string" ? body.body.trim() : "";
    if (!slug || authorName.length < 2 || authorName.length > 80 || comment.length < 5 || comment.length > 2000) {
      return NextResponse.json({ error: "Informe nome e comentário válido (5 a 2.000 caracteres)." }, { status: 400 });
    }
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`SELECT id FROM articles WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Notícia não encontrada." }, { status: 404 });
    await sql`INSERT INTO comments (article_id, author_name, author_email, body, status) VALUES (${rows[0].id}, ${authorName}, ${authorEmail || null}, ${comment}, 'pending')`;
    return NextResponse.json({ ok: true, message: "Comentário enviado para moderação." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar o comentário." }, { status: 500 });
  }
}
