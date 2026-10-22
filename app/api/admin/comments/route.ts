import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const comments = await sql`
      SELECT c.id, c.author_name, c.author_email, c.body, c.status, c.created_at, a.title AS article_title
      FROM comments c JOIN articles a ON a.id = c.article_id
      ORDER BY CASE WHEN c.status = 'pending' THEN 0 ELSE 1 END, c.created_at DESC LIMIT 200
    `;
    return NextResponse.json({ comments });
  } catch { return NextResponse.json({ error: "Falha ao carregar comentários." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = body.status === "approved" || body.status === "rejected" ? body.status : "";
    if (!id || !status) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`UPDATE comments SET status = ${status} WHERE id = ${id} RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Falha ao moderar comentário." }, { status: 500 }); }
}
