import type { Metadata } from "next";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { NewsSearch } from "@/components/news-search";
import { NewsList } from "@/components/news-list";

type Filters = { q?: string; author?: string; from?: string; to?: string; sort?: string };
type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<Filters> };
type Category = { id: string; name: string; slug: string };
type Article = { id: string; title: string; slug: string; excerpt: string | null; featured_image_url: string | null; published_at: string | null; category_name: string; category_slug: string; author_name: string | null };
type Author = { id: string; name: string };

const getCategory = cache(unstable_cache(async function getCategory(slug: string) {
  const sql = getDb();
  const rows = await sql`SELECT c.id,c.name,c.slug FROM categories c WHERE c.slug=${slug} AND EXISTS (SELECT 1 FROM articles a WHERE a.category_id=c.id AND a.status='published' AND a.published_at<=NOW()) LIMIT 1`;
  return rows[0] as Category | undefined;
}, ["published-category-by-slug"], { revalidate: 60, tags: ["published-categories", "published-articles"] }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return category ? { title: category.name, description: `Últimas notícias de ${category.name} em Roraima.`, alternates: { canonical: `/editorias/${category.slug}` }, openGraph: { type: "website", siteName: "CNC Roraima", locale: "pt_BR", url: `/editorias/${category.slug}`, title: `${category.name} | CNC Roraima`, description: `Últimas notícias de ${category.name} em Roraima.` }, twitter: { card: "summary", title: `${category.name} | CNC Roraima`, description: `Últimas notícias de ${category.name} em Roraima.` } } : { title: "Editoria não encontrada", robots: { index: false, follow: false } };
}



export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const p = searchParams ? await searchParams : {};
  const q = (p.q ?? "").trim().slice(0, 120);
  const author = p.author ?? "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(p.from ?? "") ? p.from! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(p.to ?? "") ? p.to! : "";
  const fromDate = from || null;
  const toDate = to || null;
  const sort = ["oldest", "title"].includes(p.sort ?? "") ? p.sort! : "newest";
  const category = await getCategory(slug);
  if (!category) notFound();
  const sql = getDb();
  const [authors, articles] = await Promise.all([
    sql`SELECT au.id,au.name FROM authors au WHERE EXISTS (SELECT 1 FROM articles a WHERE a.author_id=au.id AND a.category_id=${category.id} AND a.status='published' AND a.published_at<=NOW()) ORDER BY au.name` as unknown as Promise<Author[]>,
    sql`
      SELECT a.id,a.title,a.slug,a.excerpt,a.featured_image_url,a.published_at,c.name AS category_name,c.slug AS category_slug,au.name AS author_name
      FROM articles a INNER JOIN categories c ON c.id=a.category_id LEFT JOIN authors au ON au.id=a.author_id
      WHERE c.id=${category.id} AND a.status='published' AND a.published_at<=NOW()
        AND (${q}='' OR a.title ILIKE '%' || ${q} || '%' OR COALESCE(a.excerpt,'') ILIKE '%' || ${q} || '%')
        AND (${author}='' OR a.author_id::text=${author})
        AND (${fromDate}::date IS NULL OR a.published_at>=${fromDate}::date)
        AND (${toDate}::date IS NULL OR a.published_at<(${toDate}::date + INTERVAL '1 day'))
      ORDER BY CASE WHEN ${sort}='title' THEN a.title END ASC,
        CASE WHEN ${sort}='oldest' THEN a.published_at END ASC NULLS LAST,
        CASE WHEN ${sort}='newest' THEN a.published_at END DESC NULLS LAST
      LIMIT 100
    ` as unknown as Promise<Article[]>
  ]);
  const values = { q, author, from, to, sort };
  return <main className="editoria-page">
    <section className="editoria-content">
      <div className="editoria-intro"><span className="editoria-eyebrow">CNC RORAIMA / EDITORIAS</span><h1>{category.name}</h1><p>{`Acompanhe as notícias e atualizações de ${category.name} em Roraima.`}</p><div className="editoria-rule"><span /></div></div>
      <NewsSearch action={`/editorias/${slug}`} authors={authors} values={values} showCategory={false} compact />
      <div className="editoria-section-heading"><h2>{q ? `Resultados para “${q}”` : "Últimas notícias"}</h2><span>{articles.length} {articles.length === 1 ? "notícia encontrada" : "notícias encontradas"}{articles.length === 100 ? " · limite de 100" : ""}</span></div>
      <NewsList articles={articles} emptyTitle="Nenhuma notícia encontrada" emptyDescription="Tente alterar os termos da busca ou remover algum filtro." emptyHref={`/editorias/${slug}`} emptyLinkLabel="Limpar filtros" />
    </section>
  </main>;
}
