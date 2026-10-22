import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { getDb } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";

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

function formatDate(value: string | null) {
  if (!value) return "Notícia";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function ArticleDate({ value }: { value: string | null }) {
  return <span className="editoria-date"><Clock3 size={14} aria-hidden="true" />{formatDate(value)}</span>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const page = await getCategoryPage(slug);
  if (!page) notFound();

  const [featured, ...rest] = page.articles;

  return <main className="editoria-page">
    <SiteHeader />

    <section className="editoria-content">
      <div className="editoria-intro">
        <span className="editoria-eyebrow">CNC RORAIMA / EDITORIAS</span>
        <h1>{page.category.name}</h1>
        <p>{page.category.description || `Acompanhe as notícias e atualizações de ${page.category.name} em Roraima.`}</p>
        <div className="editoria-rule"><span /></div>
      </div>

      {featured && <>
        <a className="editoria-featured" href={`/noticias/${featured.slug}`}>
          <div className="editoria-featured-media">
            {featured.featured_image_url
              ? <img src={featured.featured_image_url} alt="" fetchPriority="high" />
              : <div className="editoria-image-placeholder" />}
            <span className="editoria-image-label">DESTAQUE</span>
          </div>
          <div className="editoria-featured-copy">
            <span className="editoria-category-label">{featured.category_name}</span>
            <h2>{featured.title}</h2>
            {featured.excerpt && <p>{featured.excerpt}</p>}
            <ArticleDate value={featured.published_at} />
            <span className="editoria-read-more">Ler notícia <ArrowUpRight size={16} /></span>
          </div>
        </a>
      </>}

      {rest.length > 0 && <section className="editoria-latest">
        <div className="editoria-section-heading"><h2>Últimas notícias</h2><span>{rest.length} {rest.length === 1 ? "matéria" : "matérias"}</span></div>
        <div className="editoria-grid">
          {rest.map(article => <article key={article.id} className="editoria-card">
            <a href={`/noticias/${article.slug}`} className="editoria-card-link">
              <div className="editoria-card-media">
                {article.featured_image_url
                  ? <img src={article.featured_image_url} alt="" loading="lazy" />
                  : <div className="editoria-image-placeholder" />}
              </div>
              <div className="editoria-card-copy">
                <span className="editoria-category-label">{article.category_name}</span>
                <h3>{article.title}</h3>
                {article.excerpt && <p>{article.excerpt}</p>}
                <ArticleDate value={article.published_at} />
              </div>
            </a>
          </article>)}
        </div>
      </section>}

      {page.articles.length === 1 && <p className="editoria-end-note">Você está vendo a notícia mais recente desta editoria. Novas matérias aparecerão aqui quando forem publicadas.</p>}
    </section>

    <footer className="editoria-footer"><span>© {new Date().getFullYear()} CNC Roraima</span><span>Informação de credibilidade.</span></footer>

    <style>{`
      .editoria-page{min-height:100vh;background:#fff;color:#202126}
      .editoria-header{background:#202126;color:#fff;border-bottom:3px solid #c9a044}
      .editoria-header-inner{width:min(1180px,calc(100% - 40px));min-height:82px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}
      .editoria-brand{display:flex;align-items:center;gap:12px}
      .editoria-brand-mark{font-size:39px;line-height:1;font-weight:900;letter-spacing:-.12em;color:#e11a2b}
      .editoria-brand-mark span{color:#c9a044}
      .editoria-brand-copy{display:flex;flex-direction:column;gap:4px}
      .editoria-brand-copy strong{font-size:14px;letter-spacing:.12em;color:#fff}
      .editoria-brand-copy small{font-size:8px;letter-spacing:.12em;color:#c4c4c8}
      .editoria-back{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#e3c36f}
      .editoria-content{width:min(1120px,calc(100% - 40px));margin:0 auto;padding:44px 0 76px}
      .editoria-intro{max-width:760px;margin-bottom:28px}
      .editoria-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#b90018}
      .editoria-intro h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,58px);letter-spacing:-.04em;line-height:1.05;margin:12px 0}
      .editoria-intro p{font-size:16px;line-height:1.7;color:#696a71;margin:0;max-width:680px}
      .editoria-rule{height:1px;background:#e8e8eb;margin-top:26px;position:relative}
      .editoria-rule span{position:absolute;top:0;left:0;height:3px;width:74px;background:#b90018}
      .editoria-featured{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:32px;align-items:center;padding:22px;border:1px solid #e8e8eb;border-radius:8px;color:inherit;transition:border-color .2s,box-shadow .2s}
      .editoria-featured:hover,.editoria-card:hover{border-color:#d7c28d;box-shadow:0 10px 30px #2021260d}
      .editoria-featured-media,.editoria-card-media{position:relative;overflow:hidden;background:#f1f1f3;display:flex;align-items:center;justify-content:center}
      .editoria-featured-media{aspect-ratio:16/10;border-radius:5px}
      .editoria-featured-media img,.editoria-card-media img{width:100%;height:100%;object-fit:contain;display:block}
      .editoria-image-label{position:absolute;top:12px;left:12px;background:#b90018;color:#fff;padding:7px 10px;border-radius:2px;font-size:9px;letter-spacing:.12em;font-weight:800}
      .editoria-image-placeholder{width:100%;height:100%;min-height:160px;background:linear-gradient(135deg,#202126,#b90018 70%,#c9a044)}
      .editoria-featured-copy{padding:10px 10px 10px 0}
      .editoria-category-label{color:#b90018;font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:800}
      .editoria-featured-copy h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(25px,3vw,36px);line-height:1.18;letter-spacing:-.025em;margin:13px 0}
      .editoria-featured-copy>p,.editoria-card-copy>p{font-size:14px;line-height:1.7;color:#696a71;margin:0 0 17px}
      .editoria-date{display:flex;align-items:center;gap:7px;color:#777982;font-size:11px;margin-top:16px}
      .editoria-read-more{display:inline-flex;align-items:center;gap:7px;margin-top:24px;color:#b90018;font-size:12px;font-weight:800}
      .editoria-latest{margin-top:48px}
      .editoria-section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-bottom:1px solid #e8e8eb;padding-bottom:14px;margin-bottom:22px}
      .editoria-section-heading h2{font-family:Georgia,'Times New Roman',serif;font-size:28px;margin:0;letter-spacing:-.025em}
      .editoria-section-heading>span{font-size:11px;color:#777982}
      .editoria-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
      .editoria-card{min-width:0;border:1px solid #e8e8eb;border-radius:7px;overflow:hidden;transition:border-color .2s,box-shadow .2s}
      .editoria-card-link{height:100%;display:flex;flex-direction:column;color:inherit}
      .editoria-card-media{aspect-ratio:16/10;border-bottom:1px solid #e8e8eb}
      .editoria-card-copy{padding:18px;display:flex;flex:1;flex-direction:column;align-items:flex-start}
      .editoria-card-copy h3{font-size:18px;line-height:1.4;letter-spacing:-.02em;margin:9px 0 10px}
      .editoria-card-copy>p{font-size:13px;margin-bottom:0}
      .editoria-card-copy .editoria-date{margin-top:auto;padding-top:18px}
      .editoria-end-note{margin-top:30px;color:#777982;font-size:13px;line-height:1.7}
      .editoria-footer{min-height:68px;padding:18px max(20px,calc((100% - 1120px)/2));background:#202126;color:#c4c4c8;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:11px}
      @media(max-width:760px){.editoria-content{padding-top:32px}.editoria-featured{grid-template-columns:1fr;gap:18px;padding:14px}.editoria-featured-media{aspect-ratio:16/9}.editoria-featured-copy{padding:0 4px 6px}.editoria-featured-copy h2{font-size:29px}.editoria-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.editoria-card-copy{padding:14px}.editoria-card-copy h3{font-size:16px}}
      @media(max-width:480px){.editoria-header-inner{width:calc(100% - 28px);min-height:70px}.editoria-brand-mark{font-size:33px}.editoria-brand-copy strong{font-size:12px}.editoria-brand-copy small{font-size:6px;letter-spacing:.07em}.editoria-back{font-size:0;gap:0}.editoria-back svg{width:20px;height:20px}.editoria-content{width:calc(100% - 28px);padding-bottom:48px}.editoria-intro h1{font-size:39px}.editoria-intro p{font-size:14px}.editoria-featured-copy h2{font-size:25px}.editoria-grid{grid-template-columns:1fr;gap:16px}.editoria-card{display:grid;grid-template-columns:38% minmax(0,1fr)}.editoria-card-link{display:grid;grid-template-columns:38% minmax(0,1fr)}.editoria-card-media{aspect-ratio:auto;height:100%;min-height:145px;border-bottom:0;border-right:1px solid #e8e8eb}.editoria-card-copy{padding:13px}.editoria-card-copy h3{font-size:15px;line-height:1.35;margin:7px 0}.editoria-card-copy>p{font-size:12px;line-height:1.5}.editoria-card-copy .editoria-date{font-size:10px;padding-top:10px}.editoria-footer{align-items:flex-start;flex-direction:column;gap:6px}}
    `}</style>
  </main>;
}
