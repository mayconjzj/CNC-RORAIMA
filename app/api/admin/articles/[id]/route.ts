import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseArticleInput } from "@/lib/article-service";
import { revalidatePublishedContent } from "@/lib/revalidation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await context.params;
    const parsed = parseArticleInput(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { title, excerpt, seoTitle, seoDescription, image, categoryId, authorId, status, isFeatured, sections } = parsed.data;
    const sql = getDb();
    const current = await sql`SELECT id FROM articles WHERE id = ${id} LIMIT 1`;
    if (!current.length) return NextResponse.json({ error: "Notícia não encontrada." }, { status: 404 });
    const rows = await sql`
      UPDATE articles SET title = ${title}, excerpt = ${excerpt || null},
        content = ${JSON.stringify(sections)}::jsonb, featured_image_url = ${image || null},
        image_alt = ${image ? title : null},
        status = ${status}, is_featured = ${isFeatured}, category_id = ${categoryId}, author_id = ${authorId},
        published_at = CASE WHEN ${status} = 'published' THEN COALESCE(published_at, NOW()) ELSE NULL END,
        seo_title = ${seoTitle || title}, seo_description = ${seoDescription || excerpt || title}, updated_at = NOW()
      WHERE id = ${id} RETURNING id, title, slug, status
    `;
    revalidatePublishedContent();
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
    revalidatePublishedContent();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Falha ao excluir notícia", error);
    return NextResponse.json({ error: "Não foi possível excluir a notícia." }, { status: 500 });
  }
}
