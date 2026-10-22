import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { normalizeArticleSections } from "@/lib/article-content";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 500) : "";
    const seoTitle = typeof body.seoTitle === "string" ? body.seoTitle.trim().slice(0, 70) : "";
    const seoDescription = typeof body.seoDescription === "string" ? body.seoDescription.trim().slice(0, 160) : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;
    const authorId = typeof body.authorId === "string" && body.authorId ? body.authorId : null;
    const status = body.status === "published" ? "published" : "draft";
    const isFeatured = body.isFeatured === true;
    const sections = normalizeArticleSections(body.content);
    const blocks = sections.flatMap(section => section.blocks);
    const plainText = sections.map(section => [section.title, ...section.blocks.flatMap(block => [block.title, block.text?.replace(/<[^>]*>/g, " "), block.caption, ...(block.items||[]).map(item => item.caption)])].filter(Boolean).join(" ")).join(" ").trim();
    if (title.length < 5 || title.length > 180) return NextResponse.json({ error: "O título deve ter entre 5 e 180 caracteres." }, { status: 400 });
    if (!blocks.length || plainText.length < 20 || plainText.length > 150000) return NextResponse.json({ error: "Adicione conteúdo à notícia (pelo menos 20 caracteres e no máximo 150.000)." }, { status: 400 });
    if (image && !/^https?:\/\//i.test(image)) return NextResponse.json({ error: "A imagem de capa deve usar uma URL http ou https válida." }, { status: 400 });
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
