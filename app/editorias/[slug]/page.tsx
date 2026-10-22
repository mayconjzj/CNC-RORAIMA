import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock3 } from "lucide-react";
import { getDb } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };
type Category = { id: string; name: string; slug: string; description: string | null };
type Article = { id: string; title: string; slug: string; excerpt: string | null; featured_image_url: string | null; published_at: string | null; category_name: string };

async function getCategoryPage(slug: string): Promise<{ category: Category; articles: Article[] } | null> {
  const sql = getDb();
  const categories = await sql`
    SELECT c.id, c.name, c.slug, c.description
    FROM categories c
    WHERE c.slug = ${slug}
      AND EXISTS (
        SELECT 1 FROM articles a
        WHERE a.category_id = c.id AND a.status = 'published' AND a.published_at <= NOW()
      )
    LIMIT 1
  `;
  const category = categories[0] as Category | undefined;
  if (!category) return null;
  const articles = await sql`
    SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.published_at, c.name AS category_name
    FROM articles a
    INNER JOIN categories c ON c.id = a.category_id
    WHERE c.id = ${category.id} AND a.status = 'published' AND a.published_at <= NOW()
    ORDER BY a.published_at DESC NULLS LAST
  ` as unknown as Article[];
  return { category, articles };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCategoryPage(slug);
  return page
    ? { title: `${page.category.name} | CNC Roraima`, description: page.category.description || `Últimas notícias de ${page.category.name} em Roraima.` }
    : { title: "Editoria não encontrada | CNC Roraima" };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const page = await getCategoryPage(slug);
  if (!page) notFound();

  return <main style={{ minHeight: "100vh", background: "#fff", color: "#202126" }}>
    <header style={{ background: "#202126", color: "#fff", padding: "18px max(20px, calc((100% - 1120px)/2))" }}>
      <a href="/" style={{ color: "#e0bd6b", fontWeight: 800, letterSpacing: 1 }}>CNC RORAIMA <span style={{ color: "#fff", fontWeight: 400 }}>/ EDITORIAS</span></a>
    </header>
    <section style={{ width: "min(1120px, calc(100% - 32px))", margin: "38px auto 72px" }}>
      <a href="/" style={{ color: "#b90018", fontWeight: 700, fontSize: 13 }}>← Página inicial</a>
      <p style={{ color: "#b90018", textTransform: "uppercase", letterSpacing: 2, fontSize: 12, fontWeight: 800, margin: "28px 0 8px" }}>EDITORIA</p>
      <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.1, margin: "0 0 12px" }}>{page.category.name}</h1>
      <p style={{ color: "#666", fontSize: 17, margin: "0 0 30px" }}>{page.category.description || `Acompanhe as notícias e atualizações de ${page.category.name} em Roraima.`}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 22 }}>
        {page.articles.map(article => <article key={article.id} style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          <a href={`/noticias/${article.slug}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
            {article.featured_image_url ? <img src={article.featured_image_url} alt="" style={{ width: "100%", height: 210, objectFit: "cover" }} /> : <div style={{ height: 210, background: "linear-gradient(135deg,#202126,#b90018)" }} />}
            <div style={{ padding: 18 }}>
              <span style={{ color: "#b90018", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{article.category_name}</span>
              <h2 style={{ fontSize: 21, lineHeight: 1.3, margin: "9px 0 10px" }}>{article.title}</h2>
              {article.excerpt && <p style={{ color: "#666", lineHeight: 1.6, margin: "0 0 14px" }}>{article.excerpt}</p>}
              <span style={{ color: "#777", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}><Clock3 size={13}/>{article.published_at ? new Date(article.published_at).toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Notícia"}</span>
            </div>
          </a>
        </article>)}
      </div>
    </section>
    <footer style={{ background: "#202126", color: "#ddd", padding: "22px max(20px, calc((100% - 1120px)/2))", fontSize: 13 }}>© {new Date().getFullYear()} CNC — Cristhian Cruz News</footer>
  </main>;
}
