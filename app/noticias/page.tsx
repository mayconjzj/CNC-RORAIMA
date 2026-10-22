import type { Metadata } from "next";
import Image from "next/image";
import { shouldOptimizeImage } from "@/lib/media";
import { Clock3, Search } from "lucide-react";
import { getDb } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { NewsSearch } from "@/components/news-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Todas as notícias", description: "Pesquise e filtre as notícias publicadas pela CNC Roraima.", alternates: { canonical: "/noticias" }, openGraph: { type: "website", url: "/noticias", title: "Todas as notícias | CNC Roraima", description: "Pesquise e filtre as notícias publicadas pela CNC Roraima." }, twitter: { card: "summary", title: "Todas as notícias | CNC Roraima", description: "Pesquise e filtre as notícias publicadas pela CNC Roraima." } };

type Params = Promise<{ q?: string; category?: string; author?: string; from?: string; to?: string; sort?: string }>;
type Article = { id: string; title: string; slug: string; excerpt: string | null; featured_image_url: string | null; published_at: string | null; category_name: string | null; category_slug: string | null; author_name: string | null };
type Option = { id: string; name: string; slug?: string };

function dateLabel(value: string | null) { return value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Data não informada"; }

export default async function AllNewsPage({ searchParams }: { searchParams: Params }) {
  const p = await searchParams;
  const q = (p.q ?? "").trim().slice(0, 120);
  const category = p.category ?? "";
  const author = p.author ?? "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(p.from ?? "") ? p.from! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(p.to ?? "") ? p.to! : "";
  const sort = ["oldest", "title"].includes(p.sort ?? "") ? p.sort! : "newest";
  const sql = getDb();
  const [categories, authors, articles, countRows] = await Promise.all([
    sql`SELECT c.id, c.name, c.slug FROM categories c WHERE EXISTS (SELECT 1 FROM articles a WHERE a.category_id=c.id AND a.status='published' AND a.published_at <= NOW()) ORDER BY c.name` as unknown as Promise<Option[]>,
    sql`SELECT au.id, au.name FROM authors au WHERE EXISTS (SELECT 1 FROM articles a WHERE a.author_id=au.id AND a.status='published' AND a.published_at <= NOW()) ORDER BY au.name` as unknown as Promise<Option[]>,
    sql`
      SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.published_at,
        c.name AS category_name, c.slug AS category_slug, au.name AS author_name
      FROM articles a LEFT JOIN categories c ON c.id=a.category_id LEFT JOIN authors au ON au.id=a.author_id
      WHERE a.status='published' AND a.published_at <= NOW()
        AND (${q} = '' OR a.title ILIKE '%' || ${q} || '%' OR COALESCE(a.excerpt,'') ILIKE '%' || ${q} || '%' OR a.slug ILIKE '%' || ${q} || '%')
        AND (${category} = '' OR c.slug = ${category})
        AND (${author} = '' OR a.author_id::text = ${author})
        AND (${from} = '' OR a.published_at >= ${from}::date)
        AND (${to} = '' OR a.published_at < (${to}::date + INTERVAL '1 day'))
      ORDER BY
        CASE WHEN ${sort} = 'title' THEN a.title END ASC,
        CASE WHEN ${sort} = 'oldest' THEN a.published_at END ASC NULLS LAST,
        CASE WHEN ${sort} = 'newest' THEN a.published_at END DESC NULLS LAST
      LIMIT 100
    ` as unknown as Promise<Article[]>,
    sql`SELECT COUNT(*)::int AS total FROM articles a LEFT JOIN categories c ON c.id=a.category_id WHERE a.status='published' AND a.published_at <= NOW() AND (${q}='' OR a.title ILIKE '%' || ${q} || '%' OR COALESCE(a.excerpt,'') ILIKE '%' || ${q} || '%' OR a.slug ILIKE '%' || ${q} || '%') AND (${category}='' OR c.slug=${category}) AND (${author}='' OR a.author_id::text=${author}) AND (${from}='' OR a.published_at >= ${from}::date) AND (${to}='' OR a.published_at < (${to}::date + INTERVAL '1 day'))` as unknown as Promise<{ total: number }[]>
  ]);
  const total = countRows[0]?.total ?? articles.length;
  const values = { q, category, author, from, to, sort };
  return <main className="all-news-page">
    <SiteHeader />
    <section className="all-news-content">
      <span className="all-news-eyebrow">CNC RORAIMA / ARQUIVO</span>
      <h1>Todas as notícias<span>.</span></h1>
      <p className="all-news-intro">Encontre matérias por assunto, editoria, autor ou período de publicação.</p>
      <NewsSearch categories={categories} authors={authors} values={values} />
      <div className="all-news-heading"><h2>{q ? <>Resultados para “{q}”</> : "Arquivo de notícias"}</h2><span>{total} {total === 1 ? "notícia encontrada" : "notícias encontradas"}{total > 100 ? " · exibindo as 100 mais relevantes" : ""}</span></div>
      {articles.length ? <div className="all-news-grid">{articles.map((article) => <article className="all-news-card" key={article.id}>
        <a className="all-news-image" href={`/noticias/${article.slug}`}>{article.featured_image_url ? <Image src={article.featured_image_url} alt="" width={800} height={450} sizes="(max-width: 520px) 38vw, (max-width: 760px) 50vw, 33vw" unoptimized={!shouldOptimizeImage(article.featured_image_url)} /> : <span className="all-news-placeholder" />}</a>
        <div className="all-news-card-copy"><a className="all-news-category" href={article.category_slug ? `/editorias/${article.category_slug}` : "/noticias"}>{article.category_name ?? "Notícias"}</a><h3><a href={`/noticias/${article.slug}`}>{article.title}</a></h3>{article.excerpt && <p>{article.excerpt}</p>}<div className="all-news-meta">{article.author_name && <span>Por {article.author_name}</span>}<span><Clock3 size={13}/>{dateLabel(article.published_at)}</span></div></div>
      </article>)}</div> : <div className="all-news-empty"><Search size={24}/><h2>Nenhuma notícia encontrada</h2><p>Tente mudar as palavras-chave ou remover algum filtro.</p><a href="/noticias">Limpar busca e filtros</a></div>}
    </section>
    <footer className="all-news-footer">© {new Date().getFullYear()} CNC Roraima — Informação de credibilidade.</footer>
    <style>{`
      .all-news-page{min-height:100vh;background:#fff;color:#202126}.all-news-content{width:min(1120px,calc(100% - 40px));margin:auto;padding:42px 0 76px}.all-news-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#b90018}.all-news-content>h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,56px);letter-spacing:-.04em;line-height:1.05;margin:12px 0}.all-news-content>h1 span{color:#b90018}.all-news-intro{color:#696a71;font-size:15px;line-height:1.7;margin:0}.all-news-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding-bottom:14px;margin-bottom:20px;border-bottom:1px solid #e8e8eb}.all-news-heading h2{font-family:Georgia,'Times New Roman',serif;font-size:25px;margin:0}.all-news-heading>span{color:#777;font-size:11px}.all-news-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.all-news-card{min-width:0;border:1px solid #e8e8eb;border-radius:8px;overflow:hidden;display:flex;flex-direction:column}.all-news-image{display:block;aspect-ratio:16/9;background:#f0f0f2;overflow:hidden}.all-news-image img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s}.all-news-card:hover .all-news-image img{transform:scale(1.025)}.all-news-placeholder{display:block;width:100%;height:100%;background:linear-gradient(135deg,#202126,#b90018 70%,#c9a044)}.all-news-card-copy{padding:16px;display:flex;flex:1;flex-direction:column;align-items:flex-start}.all-news-category{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:#b90018}.all-news-card h3{font-size:18px;line-height:1.4;margin:9px 0}.all-news-card h3 a{color:inherit}.all-news-card-copy>p{font-size:13px;line-height:1.65;color:#696a71;margin:0 0 14px}.all-news-meta{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:auto;padding-top:12px;color:#777;font-size:11px}.all-news-meta span{display:flex;align-items:center;gap:5px}.all-news-empty{text-align:center;padding:52px 20px;background:#fafafa;border:1px solid #eee;border-radius:8px;color:#666}.all-news-empty h2{color:#202126}.all-news-empty a{display:inline-block;margin-top:8px;color:#b90018;font-weight:750;font-size:13px}.all-news-footer{background:#202126;color:#ddd;text-align:center;padding:24px;font-size:11px}@media(max-width:760px){.all-news-content{width:calc(100% - 32px);padding-top:30px}.all-news-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.all-news-card-copy{padding:13px}.all-news-card h3{font-size:16px}.all-news-heading{align-items:flex-start;flex-direction:column;gap:5px}}@media(max-width:520px){.all-news-grid{grid-template-columns:1fr;gap:14px}.all-news-card{display:grid;grid-template-columns:38% minmax(0,1fr)}.all-news-image{height:100%;min-height:150px;aspect-ratio:auto}.all-news-card-copy{padding:12px}.all-news-card h3{font-size:15px;margin:7px 0}.all-news-card-copy>p{font-size:12px;line-height:1.5}.all-news-meta{font-size:10px;gap:5px 8px}.all-news-content>h1{font-size:40px}}
    `}</style>
  </main>;
}
