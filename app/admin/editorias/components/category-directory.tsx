"use client";

import { FolderKanban, Hash, Newspaper, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import styles from "../editorias.module.css";

export type CategoryDirectoryItem = { id: string; name: string; slug: string; article_count?: number };

type CategoryDirectoryProps = {
  categories: CategoryDirectoryItem[];
  filtered: CategoryDirectoryItem[];
  loading: boolean;
  query: string;
  busy: boolean;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
  onEdit: (category: CategoryDirectoryItem) => void;
  onDelete: (category: CategoryDirectoryItem) => void;
};

export function CategoryDirectory({
  categories, filtered, loading, query, busy, onQueryChange, onCreate, onEdit, onDelete,
}: CategoryDirectoryProps) {
  return (
    <section className={styles.directory}>
      <div className={styles.directoryHeader}>
        <div><h2>Diretório de editorias</h2><p>Gerencie os temas disponíveis para categorizar as notícias.</p></div>
        <div className={styles.searchBox}>
          <Search size={17} />
          <input aria-label="Buscar editorias" placeholder="Buscar editoria…" value={query} onChange={(event) => onQueryChange(event.target.value)} />
          {query && <button type="button" onClick={() => onQueryChange("")} aria-label="Limpar busca"><X size={15} /></button>}
        </div>
      </div>
      <div className={styles.directoryMeta}>
        <span>{filtered.length} {filtered.length === 1 ? "editoria encontrada" : "editorias encontradas"}</span>
        <span>ORDEM ALFABÉTICA</span>
      </div>
      {loading && categories.length === 0 ? (
        <div className={styles.categoryList} aria-label="Carregando editorias">
          {[0, 1, 2].map((item) => <div className={styles.skeletonCategoryRow} key={item}><span className={styles.skeletonNumber}/><span className={styles.skeletonIcon}/><div className={styles.skeletonStatText}><span className={styles.skeletonLine} style={{width:"45%"}}/><span className={styles.skeletonLine} style={{width:"65%"}}/></div></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span><FolderKanban size={25} /></span>
          <h3>{query ? "Nenhuma editoria encontrada" : "Comece organizando o portal"}</h3>
          <p>{query ? "Experimente buscar por outro nome ou termo." : "Crie editorias como Política, Economia, Cultura e Esportes para organizar as notícias."}</p>
          {!query && <button className={styles.primaryButton} onClick={onCreate}><Plus size={17} /> Criar primeira editoria</button>}
        </div>
      ) : (
        <div className={styles.categoryList}>
          {filtered.map((category, index) => (
            <article className={styles.categoryRow} key={category.id}>
              <span className={styles.categoryNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.categorySymbol}><FolderKanban size={19} /></span>
              <div className={styles.categoryInfo}><h3>{category.name}</h3><p><Hash size={13} />{category.slug}</p></div>
              <span className={styles.categoryStatus}><span /> Ativa</span>
              <div className={styles.actions}>
                <button type="button" onClick={() => onEdit(category)} disabled={busy} aria-label={`Editar ${category.name}`}><Pencil size={16} /><span>Editar</span></button>
                <button type="button" className={styles.deleteButton} onClick={() => onDelete(category)} disabled={busy} aria-label={`Excluir ${category.name}`}><Trash2 size={16} /><span>Excluir</span></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
