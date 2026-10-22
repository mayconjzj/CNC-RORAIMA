import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { shouldOptimizeImage } from "@/lib/media";
import { Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { NewsSearch } from "@/components/news-search";

type Filters = { q?: string; author?: string; from?: string; to?: string; sort?: string };
type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<Filters> };
type Category = { id: string; name: string; slug: string; description: string | null };
type Article = { id: string; title: string; slug: string; excerpt: string | null; featured_image_url: string | null; published_at: string | null; category_name: string };
type Author = { id: string; name: string };

const getCategory = cache(unstable_cache(async function getCategory(slug: string) {
  const sql = getDb();
  const rows = await sql`SELECT c.id,c.name,c.slug,c.description FROM categories c WHERE c.slug=${slug} AND EXISTS (SELECT 1 FROM articles a WHERE a.category_id=c.id AND a.status='published' AND a.published_at<=NOW()) LIMIT 1`;
  return rows[0] as Category | undefined;
}, ["published-category-by-slug"], { revalidate: 60, tags: ["published-categories", "published-articles"] }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return category ? { title: category.name, description: category.description || `Últimas notícias de ${category.name} em Roraima.`, alternates: { canonical: `/editorias/${category.slug}` }, openGraph: { type: "website", url: `/editorias/${category.slug}`, title: `${category.name} | CNC Roraima`, description: category.description || `Últimas notícias de ${category.name} em Roraima.` }, twitter: { card: "summary", title: `${category.name} | CNC Roraima`, description: category.description || `Últimas notícias de ${category.name} em Roraima.` } } : { title: "Editoria não encontrada", robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Data não informada";
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const p = searchParams ? await searchParams : {};
  const q = (p.q ?? "").trim().slice(0, 120);
  const author = p.author ?? "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(p.from ?? "") ? p.from! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(p.to ?? "") ? p.to! : "";
  const sort = ["oldest", "title"].includes(p.sort ?? "") ? p.sort! : "newest";
  const category = await getCategory(slug);
  if (!category) notFound();
  const sql = getDb();
  const [authors, articles] = await Promise.all([
    sql`SELECT au.id,au.name FROM authors au WHERE EXISTS (SELECT 1 FROM articles a WHERE a.author_id=au.id AND a.category_id=${category.id} AND a.status='published' AND a.published_at<=NOW()) ORDER BY au.name` as unknown as Promise<Author[]>,
    sql`
      SELECT a.id,a.title,a.slug,a.excerpt,a.featured_image_url,a.published_at,c.name AS category_name
      FROM articles a INNER JOIN categories c ON c.id=a.category_id
      WHERE c.id=${category.id} AND a.status='published' AND a.published_at<=NOW()
        AND (${q}='' OR a.title ILIKE '%' || ${q} || '%' OR COALESCE(a.excerpt,'') ILIKE '%' || ${q} || '%')
        AND (${author}='' OR a.author_id::text=${author})
        AND (${from}='' OR a.published_at>=${from}::date)
        AND (${to}='' OR a.published_at<(${to}::date + INTERVAL '1 day'))
      ORDER BY CASE WHEN ${sort}='title' THEN a.title END ASC,
        CASE WHEN ${sort}='oldest' THEN a.published_at END ASC NULLS LAST,
        CASE WHEN ${sort}='newest' THEN a.published_at END DESC NULLS LAST
      LIMIT 100
    ` as unknown as Promise<Article[]>
  ]);
  const values = { q, author, from, to, sort };
  return <main className="editoria-page"><SiteHeader />
    <section className="editoria-content">
      <div className="editoria-intro"><span className="editoria-eyebrow">CNC RORAIMA / EDITORIAS</span><h1>{category.name}</h1><p>{category.description || `Acompanhe as notícias e atualizações de ${category.name} em Roraima.`}</p><div className="editoria-rule"><span /></div></div>
      <NewsSearch action={`/editorias/${slug}`} authors={authors} values={values} showCategory={false} compact />
      <div className="editoria-section-heading"><h2>{q ? `Resultados para “${q}”` : "Últimas notícias"}</h2><span>{articles.length} {articles.length === 1 ? "notícia encontrada" : "notícias encontradas"}{articles.length === 100 ? " · limite de 100" : ""}</span></div>
      {articles.length ? <div className="editoria-grid">{articles.map((article, index) => <article key={article.id} className={`editoria-card ${index === 0 && !q && !author && !from && !to ? "editoria-card-featured" : ""}`}>
        <a href={`/noticias/${article.slug}`} className="editoria-card-link"><div className="editoria-card-media">{article.featured_image_url ? <Image src={article.featured_image_url} alt="" width={900} height={506} sizes="(max-width: 520px) 38vw, (max-width: 760px) 50vw, 33vw" priority={index === 0} unoptimized={!shouldOptimizeImage(article.featured_image_url)} /> : <div className="editoria-image-placeholder" />}</div>
        <div className="editoria-card-copy"><span className="editoria-category-label">{article.category_name}</span><h3>{article.title}</h3>{article.excerpt && <p>{article.excerpt}</p>}<span className="editoria-date"><Clock3 size={14} aria-hidden="true" />{dateLabel(article.published_at)}</span></div></a>
      </article>)}</div> : <div className="editoria-empty"><h2>Nenhuma notícia encontrada</h2><p>Tente alterar os termos da busca ou remover algum filtro.</p><a href={`/editorias/${slug}`}>Limpar filtros</a></div>}
    </section>
    <footer className="editoria-footer"><span>© {new Date().getFullYear()} CNC Roraima</span><span>Informação de credibilidade.</span></footer>
    <style>{`
      .editoria-page{min-height:100vh;background:#fff;color:#202126}.editoria-content{width:min(1120px,calc(100% - 40px));margin:0 auto;padding:42px 0 76px}.editoria-intro{max-width:760px;margin-bottom:24px}.editoria-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#b90018}.editoria-intro h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,58px);letter-spacing:-.04em;line-height:1.05;margin:12px 0}.editoria-intro p{font-size:15px;line-height:1.7;color:#696a71;margin:0}.editoria-rule{height:1px;background:#e8e8eb;margin-top:24px;position:relative}.editoria-rule span{position:absolute;top:0;left:0;height:3px;width:74px;background:#b90018}.editoria-section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-bottom:1px solid #e8e8eb;padding-bottom:14px;margin:24px 0 22px}.editoria-section-heading h2{font-family:Georgia,'Times New Roman',serif;font-size:26px;margin:0}.editoria-section-heading>span{font-size:11px;color:#777982}.editoria-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.editoria-card{min-width:0;border:1px solid #e8e8eb;border-radius:7px;overflow:hidden;transition:border-color .2s,box-shadow .2s}.editoria-card:hover{border-color:#d7c28d;box-shadow:0 10px 30px #2021260d}.editoria-card-link{height:100%;display:flex;flex-direction:column;color:inherit}.editoria-card-media{aspect-ratio:16/9;overflow:hidden;background:#f1f1f3}.editoria-card-media img{width:100%;height:100%;object-fit:cover;display:block}.editoria-image-placeholder{width:100%;height:100%;min-height:140px;background:linear-gradient(135deg,#202126,#b90018 70%,#c9a044)}.editoria-card-copy{padding:16px;display:flex;flex:1;flex-direction:column;align-items:flex-start}.editoria-category-label{color:#b90018;font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:800}.editoria-card-copy h3{font-size:18px;line-height:1.4;margin:9px 0}.editoria-card-copy>p{font-size:13px;line-height:1.65;color:#696a71;margin:0 0 12px}.editoria-date{display:flex;align-items:center;gap:7px;color:#777982;font-size:11px;margin-top:auto;padding-top:14px}.editoria-empty{padding:42px 20px;text-align:center;background:#fafafa;border:1px solid #eee;border-radius:8px;color:#666}.editoria-empty h2{color:#202126}.editoria-empty a{color:#b90018;font-weight:800;font-size:13px}.editoria-footer{min-height:68px;padding:18px max(20px,calc((100% - 1120px)/2));background:#202126;color:#c4c4c8;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:11px}@media(max-width:760px){.editoria-content{width:calc(100% - 32px);padding-top:30px}.editoria-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.editoria-card-copy{padding:13px}.editoria-card-copy h3{font-size:16px}.editoria-section-heading{align-items:flex-start;flex-direction:column;gap:6px}}@media(max-width:520px){.editoria-grid{grid-template-columns:1fr;gap:14px}.editoria-card{display:grid;grid-template-columns:38% minmax(0,1fr)}.editoria-card-link{display:grid;grid-template-columns:38% minmax(0,1fr)}.editoria-card-media{height:100%;min-height:145px;aspect-ratio:auto}.editoria-card-copy{padding:12px}.editoria-card-copy h3{font-size:15px;line-height:1.35;margin:7px 0}.editoria-card-copy>p{font-size:12px;line-height:1.5}.editoria-date{font-size:10px;padding-top:9px}.editoria-footer{align-items:flex-start;flex-direction:column;gap:6px}}
    `}</style>
  </main>;
}
