"use client";

import { Pencil, Plus, Search, Trash2, UsersRound, X } from "lucide-react";
import styles from "../autores.module.css";

export type Author = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at?: string;
};

type AuthorDirectoryProps = {
  authors: Author[];
  filteredAuthors: Author[];
  loading: boolean;
  query: string;
  busy: boolean;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
};

export function AuthorDirectory({
  authors,
  filteredAuthors,
  loading,
  query,
  busy,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: AuthorDirectoryProps) {
  return (
    <section className={styles.directory}>
      <div className={styles.directoryHeader}>
        <div>
          <h2>Diretório de autores</h2>
          <p>Consulte e mantenha os perfis da equipe editorial.</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={17} />
          <input
            aria-label="Buscar autores"
            placeholder="Buscar por nome ou biografia…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {query && (
            <button onClick={() => onQueryChange("")} aria-label="Limpar busca">
              <X size={15} />
            </button>
          )}
        </div>
      </div>
      <div className={styles.directoryMeta}>
        <span>
          {filteredAuthors.length} {filteredAuthors.length === 1 ? "autor encontrado" : "autores encontrados"}
        </span>
        <span>ORDENADOS POR NOME</span>
      </div>
      {loading && authors.length === 0 ? (
        <div className={styles.authorList} aria-label="Carregando autores">
          {[0, 1, 2].map((item) => (
            <div className={styles.authorRow} key={item}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonAuthorInfo}>
                <span className={styles.skeletonLine} style={{ width: "48%", height: 14 }} />
                <span className={styles.skeletonLine} style={{ width: "78%", height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAuthors.length === 0 ? (
        <div className={styles.emptyState}>
          <span><UsersRound size={25} /></span>
          <h3>{query ? "Nenhum resultado encontrado" : "Seu diretório começa aqui"}</h3>
          <p>
            {query
              ? "Tente buscar por outro nome ou termo."
              : "Cadastre o primeiro autor para organizar as assinaturas das notícias."}
          </p>
          {!query && (
            <button className={styles.primaryButton} onClick={onCreate}>
              <Plus size={17} /> Cadastrar primeiro autor
            </button>
          )}
        </div>
      ) : (
        <div className={styles.authorList}>
          {filteredAuthors.map((author) => (
            <article className={styles.authorRow} key={author.id}>
              <div className={styles.authorAvatar}>
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt="" loading="lazy" />
                ) : (
                  <span>{author.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                )}
              </div>
              <div className={styles.authorInfo}>
                <h3>{author.name}</h3>
                <p>{author.bio?.trim() || "Nenhuma biografia cadastrada."}</p>
                <div className={styles.authorBadges}>
                  <span className={author.avatar_url ? styles.badgeComplete : styles.badgeMissing}>
                    <span />{author.avatar_url ? "Foto cadastrada" : "Sem fotografia"}
                  </span>
                  <span className={author.bio?.trim() ? styles.badgeComplete : styles.badgeMissing}>
                    <span />{author.bio?.trim() ? "Biografia preenchida" : "Sem biografia"}
                  </span>
                </div>
              </div>
              <div className={styles.authorActions}>
                <button type="button" onClick={() => onEdit(author)} disabled={busy} aria-label={`Editar ${author.name}`}>
                  <Pencil size={16} /><span>Editar</span>
                </button>
                <button type="button" className={styles.deleteButton} onClick={() => onDelete(author)} disabled={busy} aria-label={`Excluir ${author.name}`}>
                  <Trash2 size={16} /><span>Excluir</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
