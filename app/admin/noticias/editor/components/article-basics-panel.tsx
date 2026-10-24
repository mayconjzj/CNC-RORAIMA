"use client";

import { useRef, type CSSProperties } from "react";
import { ImagePlus, X } from "lucide-react";
import styles from "../editor.module.css";

type ArticleBasicsPanelProps = {
  title: string;
  excerpt: string;
  image: string;
  uploading: string | null;
  inputStyle: CSSProperties;
  labelStyle: CSSProperties;
  onTitleChange: (value: string) => void;
  onExcerptChange: (value: string) => void;
  onImageChange: (value: string) => void;
  onUploadFile: (file: File, onSuccess: (url: string) => void, key: string) => Promise<void>;
};

export function ArticleBasicsPanel({
  title, excerpt, image, uploading, inputStyle, labelStyle,
  onTitleChange, onExcerptChange, onImageChange, onUploadFile,
}: ArticleBasicsPanelProps) {
  const coverInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.step}>01</span>
          <div><h2>Conteúdo principal</h2><p>O título e o resumo que apresentam a matéria ao leitor.</p></div>
        </div>
        <label style={labelStyle}>
          Título da notícia <span className={styles.required}>*</span>
          <input style={inputStyle} required minLength={5} maxLength={180} value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Escreva um título claro e informativo" />
        </label>
        <div className={styles.counterRow}>
          <span>Use uma manchete objetiva, com a informação mais importante.</span><span>{title.length}/180</span>
        </div>
        <label style={labelStyle}>
          Resumo / linha fina
          <textarea style={{ ...inputStyle, minHeight: 104, resize: "vertical" }} maxLength={500}
            value={excerpt} onChange={(event) => onExcerptChange(event.target.value)}
            placeholder="Contextualize a notícia em uma ou duas frases." />
        </label>
        <div className={styles.counterRow}>
          <span>Este texto pode aparecer nos cards e nos mecanismos de busca.</span><span>{excerpt.length}/500</span>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.step}>02</span>
          <div><h2>Imagem de capa</h2><p>Escolha a imagem que representa a matéria no portal.</p></div>
        </div>
        {image ? (
          <div className={styles.coverPreview}>
            <img src={image} alt={title ? `Capa: ${title}` : "Prévia da capa"} />
            <button type="button" onClick={() => onImageChange("")} aria-label="Remover imagem de capa"><X size={16} /></button>
          </div>
        ) : (
          <button type="button" className={styles.uploadCover} onClick={() => coverInput.current?.click()} disabled={uploading !== null}>
            <ImagePlus size={24} /><strong>Adicionar imagem de capa</strong><span>JPG, PNG, WebP, GIF ou AVIF · até 25 MB</span>
          </button>
        )}
        <input ref={coverInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          disabled={uploading !== null}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void onUploadFile(file, onImageChange, "cover");
            event.currentTarget.value = "";
          }} />
        <label style={labelStyle}>
          URL da imagem
          <input style={inputStyle} type="url" placeholder="https://…" value={image}
            onChange={(event) => onImageChange(event.target.value)} />
        </label>
      </section>
    </>
  );
}
