"use client";

import { X } from "lucide-react";
import { ArticleBody } from "@/components/news/article-body";
import { normalizeArticleSections } from "@/lib/article-content";
import type { EditorSection } from "@/lib/article-editor";
import styles from "../editor.module.css";

type ArticlePreviewPanelProps = {
  title: string;
  excerpt: string;
  categoryName: string;
  authorName: string;
  image: string;
  sections: EditorSection[];
  onClose: () => void;
};

export function ArticlePreviewPanel({
  title,
  excerpt,
  categoryName,
  authorName,
  image,
  sections,
  onClose,
}: ArticlePreviewPanelProps) {
  return (
    <section className={styles.previewPanel}>
      <div className={styles.previewHeading}>
        <div>
          <span>PRÉ-VISUALIZAÇÃO</span>
          <h2>Assim a matéria pode aparecer no portal</h2>
        </div>
        <button type="button" className={styles.outlineButton} onClick={onClose}>
          <X size={15} /> Fechar
        </button>
      </div>
      <article className={styles.previewArticle}>
        <p className={styles.previewCategory}>{categoryName}</p>
        <h1>{title || "Título da notícia"}</h1>
        {excerpt && <p className={styles.previewExcerpt}>{excerpt}</p>}
        <p className={styles.previewByline}>Por {authorName} · Prévia</p>
        {image && <img className={styles.previewCover} src={image} alt={title || "Imagem de capa"} />}
        <ArticleBody sections={normalizeArticleSections(sections)} />
      </article>
    </section>
  );
}
