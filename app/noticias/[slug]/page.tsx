import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };
type Article = { title: string; slug: string; excerpt: string | null; content: unknown; featured_image_url: string | null; image_alt: string | null; published_at: string | null; seo_title: string | null; seo_description: string | null; category_name: string | null; author_name: string | null };

async function findArticle(slug: string): Promise<Article | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT a.title, a.slug, a.excerpt, a.content, a.featured_image_url, a.image_alt, a.published_at, a.seo_title, a.seo_description,
      c.name AS category_name, au.name AS author_name
    FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN authors au ON au.id = a.author_id
    WHERE a.slug = ${slug} AND a.status = 'published' AND a.published_at <= NOW() LIMIT 1
  `;
  return (rows[0] as Article | undefined) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) return { title: "Notícia não encontrada | CNC Roraima" };
  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || article.title,
    openGraph: { title: article.seo_title || article.title, description: article.seo_description || article.excerpt || article.title, images: article.featured_image_url ? [article.featured_image_url] : [] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();
  const blocks = Array.isArray(article.content) ? article.content as Array<{ type?: string; text?: string; title?: string; url?: string; alt?: string }> : [];
  return <main style={{ minHeight: "100vh", color: "#202126" }}>
    <header style={{ background: "#202126", color: "#fff", padding: "18px max(20px, calc((100% - 900px)/2))" }}><a href="/" style={{ color: "#e0bd6b", fontWeight: 800, letterSpacing: 1 }}>CNC RORAIMA</a></header>
    <article style={{ width: "min(900px, calc(100% - 32px))", margin: "42px auto 80px" }}>
      <a href="/" style={{ color: "#b90018", fontWeight: 700, fontSize: 13 }}>← Voltar para a página inicial</a>
      <p style={{ color: "#b90018", textTransform: "uppercase", letterSpacing: 1.5, fontSize: 12, fontWeight: 800, marginTop: 28 }}>{article.category_name ?? "Notícias de Roraima"}</p>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 54px)", lineHeight: 1.08, margin: "12px 0 18px" }}>{article.title}</h1>
      {article.excerpt && <p style={{ fontSize: 21, lineHeight: 1.6, color: "#666" }}>{article.excerpt}</p>}
      <p style={{ color: "#777", fontSize: 13, margin: "20px 0 28px" }}>{article.author_name ? `Por ${article.author_name} · ` : ""}{article.published_at ? new Date(article.published_at).toLocaleDateString("pt-BR", { dateStyle: "long" }) : ""}</p>
      {article.featured_image_url && <img src={article.featured_image_url} alt={article.image_alt || article.title} style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 12, marginBottom: 30 }} />}
      <div style={{ fontSize: 18, lineHeight: 1.9 }}>{blocks.map((block, i) => <p key={i} style={{ marginBottom: 22 }}>{block.text || block.title || ""}{block.url && <a href={block.url} rel="noopener noreferrer" target="_blank"> {block.url}</a>}</p>)}</div>
    </article>
    <footer style={{ background: "#202126", color: "#ddd", padding: 24, textAlign: "center" }}>© {new Date().getFullYear()} CNC Roraima — Informação de credibilidade.</footer>
  </main>;
}
