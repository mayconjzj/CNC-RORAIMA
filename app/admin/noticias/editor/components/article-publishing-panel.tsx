"use client";

import type { CSSProperties } from "react";
import { Check, FileText } from "lucide-react";
import type { AdminAuthor, AdminOption } from "@/lib/admin-types";
import styles from "../editor.module.css";

type ArticlePublishingPanelProps = {
  status: string;
  categoryId: string;
  authorId: string;
  featured: boolean;
  categories: AdminOption[];
  authors: AdminAuthor[];
  inputStyle: CSSProperties;
  labelStyle: CSSProperties;
  onCategoryChange: (id: string) => void;
  onAuthorChange: (id: string) => void;
  onFeaturedChange: (featured: boolean) => void;
};

export function ArticlePublishingPanel({
  status, categoryId, authorId, featured, categories, authors,
  inputStyle, labelStyle, onCategoryChange, onAuthorChange, onFeaturedChange,
}: ArticlePublishingPanelProps) {
  const isPublished = status === "published";

  return (
    <section className={styles.card}>
      <div className={styles.cardTitle}>
        <FileText size={18} />
        <div><h2>Publicação</h2><p>Defina como a notícia será disponibilizada.</p></div>
      </div>
      <div className={styles.currentStatus}>
        <span>Status atual</span>
        <strong className={isPublished ? styles.statusPublished : styles.statusDraft}>
          {isPublished ? "Publicada" : "Rascunho"}
        </strong>
      </div>
      <label style={labelStyle}>
        Editoria
        <select style={inputStyle} value={categoryId} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">Sem editoria</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        Autor principal
        <select style={inputStyle} value={authorId} onChange={(event) => onAuthorChange(event.target.value)}>
          <option value="">Autor não definido</option>
          {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
        </select>
      </label>
      <label className={styles.featured}>
        <input type="checkbox" checked={featured} onChange={(event) => onFeaturedChange(event.target.checked)} />
        <span><strong>Destacar na página inicial</strong><small>A notícia receberá destaque no portal.</small></span>
      </label>
      <div className={styles.publishHint}><Check size={15} /> Escolha uma ação abaixo: salvar sem publicar ou publicar agora.</div>
    </section>
  );
}
