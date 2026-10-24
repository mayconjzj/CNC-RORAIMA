"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { clearAdminSessionMarker, hasAdminSessionMarker, markAdminSessionActive } from "@/lib/admin-session";
import { AdminBreadcrumb, AdminNotice, AdminStatCard, AdminPageHeader, AdminPageFooter } from "@/components/admin/admin-ui";
import styles from "./editorias.module.css";
import { CategoryForm } from "./components/category-form";
import { CategoryDirectory, type CategoryDirectoryItem } from "./components/category-directory";
import { FolderKanban, Plus, ShieldCheck, Newspaper, Hash } from "lucide-react";

type Category = CategoryDirectoryItem;

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
      if (response.status === 401) { setAuthorized(false); clearAdminSessionMarker(); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as editorias.");
      setCategories(data.categories ?? []);
      setAuthorized(true); markAdminSessionActive();
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
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthorized(false); window.sessionStorage.removeItem("cnc-admin-session"); }

  if (loading && !hasAdminSessionMarker()) return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Verificando acesso</h1><p>Aguarde enquanto validamos sua sessão administrativa.</p></main>;
  if (!loading && !authorized) return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Acesso restrito</h1><p>Entre no painel administrativo para gerenciar as editorias.</p><a href="/admin">Ir para o painel</a></main>;

  return <main className={styles.shell}>
    <AdminSidebar onLogout={() => void logout()} />
    <div className={styles.main}>
      <AdminBreadcrumb className={styles.breadcrumb} linkClassName={styles.breadcrumbLink} currentClassName={styles.breadcrumbCurrent} items={[{ label: "Painel administrativo", href: "/admin" }, { label: "Editorias" }]} />
      <AdminPageHeader className={styles.pageHeader} contentClassName={styles.pageHeaderContent} eyebrowClassName={styles.eyebrow} titleClassName={styles.pageTitle} descriptionClassName={styles.pageDescription} eyebrow={<><span /> ORGANIZAÇÃO EDITORIAL</>} title="Editorias" description="Organize as notícias por assunto e mantenha a navegação do portal clara para os leitores." actions={<button className={styles.primaryButton} onClick={openCreate}><Plus size={18} /> Nova editoria</button>} />
      <section className={styles.stats}>
        <AdminStatCard className={styles.statCard} iconClassName={styles.statIcon} icon={FolderKanban} label="Total de editorias" value={categories.length} note="Seções editoriais cadastradas" />
        <AdminStatCard className={styles.statCard} iconClassName={styles.statIconGold} icon={Hash} label="Com endereço próprio" value={categories.filter((item) => !!item.slug).length} note="Identificadores para navegação" />
        <AdminStatCard className={styles.statCard} iconClassName={styles.statIconDark} icon={Newspaper} label="Resultados da busca" value={filtered.length} note="Editorias na visualização atual" />
      </section>
      {message && <AdminNotice type="success" message={message} onDismiss={() => setMessage("")} className={styles.successNotice} />}
      {error && <AdminNotice type="error" message={error} onDismiss={() => setError("")} className={styles.errorNotice} />}
      {formOpen && <CategoryForm editingId={editingId} name={name} busy={busy} onNameChange={setName} onClose={closeForm} onSubmit={(event) => void save(event)} />}
      <CategoryDirectory categories={categories} filtered={filtered} loading={loading} query={query} busy={busy} onQueryChange={setQuery} onCreate={openCreate} onEdit={openEdit} onDelete={(item) => void remove(item)} />
      <AdminPageFooter className={styles.pageFooter} />
    </div>
  </main>;
}
