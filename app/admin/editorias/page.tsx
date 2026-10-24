"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import styles from "./editorias.module.css";
import { Check, ChevronLeft, FolderKanban, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, X, Newspaper, Hash } from "lucide-react";

type Category = { id: string; name: string; slug: string; article_count?: number };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories", { cache: "no-store" });
      if (response.status === 401) { setAuthorized(false); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as editorias.");
      setCategories(data.categories ?? []);
      setAuthorized(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao carregar editorias."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadCategories(); }, [loadCategories]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return categories.filter((category) => !term || category.name.toLocaleLowerCase("pt-BR").includes(term) || category.slug.toLocaleLowerCase("pt-BR").includes(term));
  }, [categories, query]);

  function openCreate() { setEditingId(null); setName(""); setError(""); setMessage(""); setFormOpen(true); }
  function openEdit(category: Category) { setEditingId(category.id); setName(category.name); setError(""); setMessage(""); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditingId(null); setName(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar a editoria.");
      const category = data.category as Category;
      setCategories((current) => (editingId ? current.map((item) => item.id === category.id ? category : item) : [...current.filter((item) => item.id !== category.id), category]).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      closeForm();
      setMessage(data.existing ? "Essa editoria já estava cadastrada." : editingId ? "Editoria atualizada com sucesso." : "Editoria criada com sucesso.");
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar a editoria."); }
    finally { setBusy(false); }
  }
  async function remove(category: Category) {
    if (!window.confirm(`Excluir a editoria “${category.name}”? As notícias serão mantidas, mas ficarão sem editoria associada.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: category.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir a editoria.");
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingId === category.id) closeForm();
      setMessage("Editoria excluída. As notícias foram preservadas.");
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao excluir a editoria."); }
    finally { setBusy(false); }
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthorized(false); }

  if (loading) return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Verificando acesso</h1><p>Aguarde enquanto validamos sua sessão administrativa.</p></main>;
  if (!authorized) return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Acesso restrito</h1><p>Entre no painel administrativo para gerenciar as editorias.</p><a href="/admin">Ir para o painel</a></main>;

  return <main className={styles.shell}>
    <AdminSidebar onLogout={() => void logout()} />
    <div className={styles.main}>
      <div className={styles.breadcrumb}><a href="/admin">Painel administrativo</a><ChevronLeft size={14} /><span>Editorias</span></div>
      <header className={styles.pageHeader}>
        <div><div className={styles.eyebrow}><span /> ORGANIZAÇÃO EDITORIAL</div><h1>Editorias</h1><p>Organize as notícias por assunto e mantenha a navegação do portal clara para os leitores.</p></div>
        <button className={styles.primaryButton} onClick={openCreate}><Plus size={18} /> Nova editoria</button>
      </header>
      <section className={styles.stats}>
        <div className={styles.statCard}><span className={styles.statIcon}><FolderKanban size={19} /></span><div><span>Total de editorias</span><strong>{categories.length}</strong><small>Seções editoriais cadastradas</small></div></div>
        <div className={styles.statCard}><span className={styles.statIconGold}><Hash size={19} /></span><div><span>Com endereço próprio</span><strong>{categories.filter((item) => !!item.slug).length}</strong><small>Identificadores para navegação</small></div></div>
        <div className={styles.statCard}><span className={styles.statIconDark}><Newspaper size={19} /></span><div><span>Resultados da busca</span><strong>{filtered.length}</strong><small>Editorias na visualização atual</small></div></div>
      </section>
      {message && <div className={styles.successNotice} role="status"><Check size={17} />{message}<button onClick={() => setMessage("")} aria-label="Fechar aviso"><X size={16} /></button></div>}
      {error && <div className={styles.errorNotice} role="alert">{error}<button onClick={() => setError("")} aria-label="Fechar erro"><X size={16} /></button></div>}
      {formOpen && <section className={styles.formCard}>
        <div className={styles.formHeader}><span className={styles.formIcon}><FolderKanban size={20} /></span><div><h2>{editingId ? "Editar editoria" : "Criar nova editoria"}</h2><p>Escolha um nome simples e fácil de entender para os leitores.</p></div><button type="button" className={styles.closeButton} onClick={closeForm} aria-label="Fechar formulário"><X size={19} /></button></div>
        <form onSubmit={save}><div className={styles.formBody}>
          <label className={styles.fieldLabel} htmlFor="category-name">Nome da editoria <span>*</span></label>
          <input id="category-name" className={styles.input} autoFocus required minLength={2} maxLength={60} placeholder="Ex.: Economia, Política, Cultura…" value={name} onChange={(event) => setName(event.target.value)} />
          <div className={styles.fieldMeta}><span>Use um nome curto e reconhecível.</span><span>{name.length}/60</span></div>
          <div className={styles.slugPreview}><span className={styles.slugIcon}><Hash size={16} /></span><div><small>IDENTIFICADOR DA EDITORIA</small><strong>{name.trim() ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "nome-da-editoria"}</strong><p>O endereço público é gerado automaticamente pelo sistema.</p></div></div>
        </div><div className={styles.formFooter}><span><ShieldCheck size={15} /> Somente administradores podem alterar editorias.</span><div><button type="button" className={styles.secondaryButton} onClick={closeForm} disabled={busy}>Cancelar</button><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? <LoaderCircle size={17} className={styles.spin} /> : <Check size={17} />}{busy ? "Salvando…" : editingId ? "Salvar alterações" : "Criar editoria"}</button></div></div></form>
      </section>}
      <section className={styles.directory}>
        <div className={styles.directoryHeader}><div><h2>Diretório de editorias</h2><p>Gerencie os temas disponíveis para categorizar as notícias.</p></div><div className={styles.searchBox}><Search size={17} /><input aria-label="Buscar editorias" placeholder="Buscar editoria…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="Limpar busca"><X size={15} /></button>}</div></div>
        <div className={styles.directoryMeta}><span>{filtered.length} {filtered.length === 1 ? "editoria encontrada" : "editorias encontradas"}</span><span>ORDEM ALFABÉTICA</span></div>
        {loading && categories.length === 0 ? <div className={styles.categoryList} aria-label="Carregando editorias">{[0,1,2].map(i=><div className={styles.skeletonCategoryRow} key={i}><span className={styles.skeletonNumber}/><span className={styles.skeletonIcon}/><div className={styles.skeletonStatText}><span className={styles.skeletonLine} style={{width:"45%"}}/><span className={styles.skeletonLine} style={{width:"65%"}}/></div></div>)}</div> : filtered.length === 0 ? <div className={styles.emptyState}><span><FolderKanban size={25} /></span><h3>{query ? "Nenhuma editoria encontrada" : "Comece organizando o portal"}</h3><p>{query ? "Experimente buscar por outro nome ou termo." : "Crie editorias como Política, Economia, Cultura e Esportes para organizar as notícias."}</p>{!query && <button className={styles.primaryButton} onClick={openCreate}><Plus size={17} /> Criar primeira editoria</button>}</div> :
          <div className={styles.categoryList}>{filtered.map((category, index) => <article className={styles.categoryRow} key={category.id}>
            <span className={styles.categoryNumber}>{String(index + 1).padStart(2, "0")}</span><span className={styles.categorySymbol}><FolderKanban size={19} /></span>
            <div className={styles.categoryInfo}><h3>{category.name}</h3><p><Hash size={13} />{category.slug}</p></div>
            <span className={styles.categoryStatus}><span /> Ativa</span>
            <div className={styles.actions}><button onClick={() => openEdit(category)} disabled={busy} aria-label={`Editar ${category.name}`}><Pencil size={16} /><span>Editar</span></button><button className={styles.deleteButton} onClick={() => void remove(category)} disabled={busy} aria-label={`Excluir ${category.name}`}><Trash2 size={16} /><span>Excluir</span></button></div>
          </article>)}</div>}
      </section>
      <footer className={styles.pageFooter}><span>C N C <b>RORAIMA</b> · PAINEL EDITORIAL</span><a href="/admin">Voltar ao painel <ChevronLeft size={14} /></a></footer>
    </div>
  </main>;
}
