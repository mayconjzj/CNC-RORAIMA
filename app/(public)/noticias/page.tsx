import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { shouldOptimizeImage } from "@/lib/media";
import { Clock3, Search } from "lucide-react";
import { getDb } from "@/lib/db";
import { NewsSearch } from "@/components/news-search";


export const metadata: Metadata = { title: "Todas as notícias", description: "Pesquise e filtre as notícias publicadas pela CNC Roraima.", alternates: { canonical: "/noticias" }, openGraph: { type: "website", siteName: "CNC Roraima", locale: "pt_BR", url: "/noticias", title: "Todas as notícias | CNC Roraima", description: "Pesquise e filtre as notícias publicadas pela CNC Roraima." }, twitter: { card: "summary", title: "Todas as notícias | CNC Roraima", description: "Pesquise e filtre as notícias publicadas pela CNC Roraima." } };

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
    sql`SELECT COUNT(*)::int AS total FROM articles a LEFT JOIN categories c ON c.id=a.category_id WHERE a.status='published' AND a.published_at <= NOW() AND (${q}='' OR a.title ILIKE '%' || ${q} || '%' OR COALESCE(a.excerpt,'') ILIKE '%' || ${q} || '%' OR a.slug ILIKE '%' || ${q} || '%') AND (${category}='' OR c.slug=${category}) AND (${author}='' OR a.author_id::text=${author}) AND (${fromDate}::date IS NULL OR a.published_at >= ${fromDate}::date) AND (${toDate}::date IS NULL OR a.published_at < (${toDate}::date + INTERVAL '1 day'))` as unknown as Promise<{ total: number }[]>
  ]);
  const total = countRows[0]?.total ?? articles.length;
  const values = { q, category, author, from, to, sort };
  return <main className="all-news-page">
    
    <section className="all-news-content">
      <span className="all-news-eyebrow">CNC RORAIMA / ARQUIVO</span>
      <h1>Todas as notícias<span>.</span></h1>
      <p className="all-news-intro">Encontre matérias por assunto, editoria, autor ou período de publicação.</p>
      <NewsSearch categories={categories} authors={authors} values={values} />
      <div className="all-news-heading"><h2>{q ? <>Resultados para “{q}”</> : "Arquivo de notícias"}</h2><span>{total} {total === 1 ? "notícia encontrada" : "notícias encontradas"}{total > 100 ? " · exibindo as 100 mais relevantes" : ""}</span></div>
      {articles.length ? <div className="all-news-grid">{articles.map((article) => <article className="all-news-card" key={article.id}>
        <Link className="all-news-image" href={`/noticias/${article.slug}`}>{article.featured_image_url ? <Image src={article.featured_image_url} alt="" width={800} height={450} sizes="(max-width: 520px) 38vw, (max-width: 760px) 50vw, 33vw" unoptimized={!shouldOptimizeImage(article.featured_image_url)} /> : <span className="all-news-placeholder" />}</Link>
        <div className="all-news-card-copy"><Link className="all-news-category" href={article.category_slug ? `/editorias/${article.category_slug}` : "/noticias"}>{article.category_name ?? "Notícias"}</Link><h3><Link href={`/noticias/${article.slug}`}>{article.title}</Link></h3>{article.excerpt && <p>{article.excerpt}</p>}<div className="all-news-meta">{article.author_name && <span>Por {article.author_name}</span>}<span><Clock3 size={13}/>{dateLabel(article.published_at)}</span></div></div>
      </article>)}</div> : <div className="all-news-empty"><Search size={24}/><h2>Nenhuma notícia encontrada</h2><p>Tente mudar as palavras-chave ou remover algum filtro.</p><Link href="/noticias">Limpar busca e filtros</Link></div>}
    </section>
    <footer className="all-news-footer">© {new Date().getFullYear()} CNC Roraima — Informação de credibilidade.</footer>
    
  </main>;
}
