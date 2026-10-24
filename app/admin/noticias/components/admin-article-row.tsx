import Link from "next/link";
import { ExternalLink, LoaderCircle, Newspaper, Pencil, Trash2 } from "lucide-react";
import styles from "../noticias.module.css";

type ArticleRowData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  status: string;
  is_featured: boolean;
  category_name: string | null;
  author_name?: string | null;
  updated_at: string | null;
};

type AdminArticleRowProps = {
  article: ArticleRowData;
  authorName: string;
  busy: boolean;
  onDelete: (article: ArticleRowData) => void;
};

export function AdminArticleRow({ article, authorName, busy, onDelete }: AdminArticleRowProps) {
  const isPublished = article.status === "published";
  const updatedAt = article.updated_at
    ? new Date(article.updated_at).toLocaleDateString("pt-BR")
    : "—";

  return (
    <article className={styles.articleRow}>
      <div className={styles.articleImage}>
        {article.featured_image_url
          ? <img src={article.featured_image_url} alt="" loading="lazy" />
          : <Newspaper size={22} />}
      </div>
      <div className={styles.articleInfo}>
        <div className={styles.articleTags}>
          <span className={isPublished ? styles.published : styles.draft}>
            <i />{isPublished ? "Publicada" : "Rascunho"}
          </span>
          {article.is_featured && <span className={styles.featured}>Destaque</span>}
          <span>{article.category_name ?? "Sem editoria"}</span>
        </div>
        <h3>{article.title}</h3>
        <p>{article.excerpt || "Sem resumo cadastrado."}</p>
        <small>{authorName} · Atualizada em {updatedAt}</small>
      </div>
      <div className={styles.actions}>
        {isPublished && (
          <a href={`/noticias/${article.slug}`} target="_blank" rel="noreferrer"
            aria-label={`Ver ${article.title}`} title="Ver notícia">
            <ExternalLink size={16} />
          </a>
        )}
        <Link href={`/admin/noticias/editor?edit=${encodeURIComponent(article.id)}`}
          aria-label={`Editar ${article.title}`} title="Editar notícia">
          <Pencil size={16} />
        </Link>
        <button disabled={busy} onClick={() => onDelete(article)}
          aria-label={`Excluir ${article.title}`} title="Excluir notícia">
          {busy ? <LoaderCircle size={16} className={styles.spin} /> : <Trash2 size={16} />}
        </button>
      </div>
    </article>
  );
}
