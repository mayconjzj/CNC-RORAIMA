import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const contentText = typeof body.content === "string" ? body.content.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;
    const authorId = typeof body.authorId === "string" && body.authorId ? body.authorId : null;
    const status = body.status === "published" ? "published" : "draft";
    const isFeatured = body.isFeatured === true;
    if (title.length < 5 || title.length > 180) return NextResponse.json({ error: "O título deve ter entre 5 e 180 caracteres." }, { status: 400 });
    if (contentText.length < 20 || contentText.length > 100000) return NextResponse.json({ error: "O texto deve ter entre 20 e 100.000 caracteres." }, { status: 400 });
    if (image && !/^https?:\/\//i.test(image)) return NextResponse.json({ error: "A imagem deve usar uma URL http ou https válida." }, { status: 400 });
    const sql = getDb();
    const current = await sql`SELECT id FROM articles WHERE id = ${id} LIMIT 1`;
    if (!current.length) return NextResponse.json({ error: "Notícia não encontrada." }, { status: 404 });
    const blocks = [{ type: "paragraph", text: contentText }];
    const rows = await sql`
      UPDATE articles SET title = ${title}, excerpt = ${excerpt || null},
        content = ${JSON.stringify(blocks)}::jsonb, featured_image_url = ${image || null},
        image_alt = ${image ? title : null},
        status = ${status}, is_featured = ${isFeatured}, category_id = ${categoryId}, author_id = ${authorId},
        published_at = CASE WHEN ${status} = 'published' THEN COALESCE(published_at, NOW()) ELSE NULL END,
        seo_title = ${title}, seo_description = ${excerpt || title}, updated_at = NOW()
      WHERE id = ${id} RETURNING id, title, slug, status
    `;
    return NextResponse.json({ article: rows[0] });
  } catch (error) {
    console.error("Falha ao editar notícia", error);
    return NextResponse.json({ error: "Não foi possível atualizar a notícia." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await context.params;
    const sql = getDb();
    const rows = await sql`DELETE FROM articles WHERE id = ${id} RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Notícia não encontrada." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Falha ao excluir notícia", error);
    return NextResponse.json({ error: "Não foi possível excluir a notícia. Verifique se há comentários vinculados." }, { status: 500 });
  }
}
