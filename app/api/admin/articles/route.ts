import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { normalizeArticleSections } from "@/lib/article-content";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const articles = await sql`
      SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image_url, a.status, a.is_featured, a.category_id, a.author_id, a.published_at, a.updated_at, a.seo_title, a.seo_description,
        c.name AS category_name
      FROM articles a LEFT JOIN categories c ON c.id = a.category_id
      ORDER BY a.updated_at DESC LIMIT 100
    `;
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Falha ao listar artigos", error);
    return NextResponse.json({ error: "Erro ao consultar artigos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
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
    const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160) + "-" + crypto.randomUUID().slice(0, 6);
    const sql = getDb();
    const rows = await sql`
      INSERT INTO articles (title, slug, excerpt, content, featured_image_url, image_alt, status, is_featured, category_id, author_id, published_at, seo_title, seo_description)
      VALUES (${title}, ${slug}, ${excerpt || null}, ${JSON.stringify(sections)}::jsonb, ${image || null}, ${image ? title : null}, ${status}, ${isFeatured}, ${categoryId}, ${authorId}, CASE WHEN ${status} = 'published' THEN NOW() ELSE NULL END, ${seoTitle || title}, ${seoDescription || excerpt || title})
      RETURNING id, title, slug, status
    `;
    return NextResponse.json({ article: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar artigo", error);
    return NextResponse.json({ error: "Não foi possível salvar. Confira categoria, autor e conexão com o banco." }, { status: 500 });
  }
}
