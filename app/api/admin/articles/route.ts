import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const articles = await sql`
      SELECT a.id, a.title, a.slug, a.status, a.is_featured, a.published_at, a.updated_at,
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
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;
    const authorId = typeof body.authorId === "string" && body.authorId ? body.authorId : null;
    const status = body.status === "published" ? "published" : "draft";
    const isFeatured = body.isFeatured === true;
    const contentText = typeof body.content === "string" ? body.content.trim() : "";
    if (title.length < 5 || title.length > 180) return NextResponse.json({ error: "O título deve ter entre 5 e 180 caracteres." }, { status: 400 });
    if (contentText.length < 20 || contentText.length > 100000) return NextResponse.json({ error: "O texto deve ter entre 20 e 100.000 caracteres." }, { status: 400 });
    const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160) + "-" + crypto.randomUUID().slice(0, 6);
    const blocks = [{ type: "paragraph", text: contentText }];
    const sql = getDb();
    const rows = await sql`
      INSERT INTO articles (title, slug, excerpt, content, featured_image_url, image_alt, status, is_featured, category_id, author_id, published_at, seo_title, seo_description)
      VALUES (${title}, ${slug}, ${excerpt || null}, ${JSON.stringify(blocks)}::jsonb, ${image || null}, ${title}, ${status}, ${isFeatured}, ${categoryId}, ${authorId}, CASE WHEN ${status} = 'published' THEN NOW() ELSE NULL END, ${title}, ${excerpt || title})
      RETURNING id, title, slug, status
    `;
    return NextResponse.json({ article: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar artigo", error);
    return NextResponse.json({ error: "Não foi possível salvar. Confira categoria, autor e conexão com o banco." }, { status: 500 });
  }
}
