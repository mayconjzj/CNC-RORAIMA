import Image from "next/image";
import Link from "next/link";
import { Clock3, Search } from "lucide-react";
import { shouldOptimizeImage } from "@/lib/media";
import { formatNewsDate } from "@/lib/news-date";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  category_name: string | null;
  category_slug?: string | null;
  author_name?: string | null;
};

type Props = {
  articles: Article[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
};

export function NewsList({
  articles,
  emptyTitle = "Nenhuma notícia encontrada",
  emptyDescription = "Tente mudar as palavras-chave ou remover algum filtro.",
  emptyHref = "/noticias",
  emptyLinkLabel = "Limpar busca e filtros",
}: Props) {
  if (!articles.length) {
    return (
      <div className="all-news-empty">
        <Search size={24} />
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
        <Link href={emptyHref}>{emptyLinkLabel}</Link>
      </div>
    );
  }

  return (
    <div className="all-news-grid">
      {articles.map((article) => (
        <article className="all-news-card" key={article.id}>
          <Link className="all-news-image" href={`/noticias/${article.slug}`}>
            {article.featured_image_url ? (
              <Image
                src={article.featured_image_url}
                alt=""
                width={800}
                height={450}
                sizes="(max-width: 520px) 38vw, (max-width: 760px) 50vw, 33vw"
                loading="lazy"
                unoptimized={!shouldOptimizeImage(article.featured_image_url)}
              />
            ) : (
              <span className="all-news-placeholder" />
            )}
          </Link>
          <div className="all-news-card-copy">
            <Link
              className="all-news-category"
              href={
                article.category_slug
                  ? `/editorias/${article.category_slug}`
                  : "/noticias"
              }
            >
              {article.category_name ?? "Notícias"}
            </Link>
            <h3>
              <Link href={`/noticias/${article.slug}`}>{article.title}</Link>
            </h3>
            {article.excerpt && <p>{article.excerpt}</p>}
            <div className="all-news-meta">
              {article.author_name && <span>Por {article.author_name}</span>}
              <span>
                <Clock3 size={13} />
                {formatNewsDate(article.published_at)}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
