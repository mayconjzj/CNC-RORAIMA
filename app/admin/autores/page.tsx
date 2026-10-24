"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { clearAdminSessionMarker, hasAdminSessionMarker, markAdminSessionActive } from "@/lib/admin-session";
import { AdminBreadcrumb, AdminNotice, AdminPageHeader, AdminPageFooter, AdminStatCard } from "@/components/admin/admin-ui";
import styles from "./autores.module.css";
import { AuthorDirectory, type Author } from "./components/author-directory";
import { AuthorForm } from "./components/author-form";
import { CircleUserRound, Plus, ShieldCheck, UsersRound } from "lucide-react";

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAuthors = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/authors", { cache: "no-store" });
      if (response.status === 401) { setLoggedIn(false); clearAdminSessionMarker(); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os autores.");
      setAuthors(data.authors ?? []); setLoggedIn(true); markAdminSessionActive();
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao carregar autores."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadAuthors(); }, [loadAuthors]);

  const filteredAuthors = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return authors;
    return authors.filter((author) => [author.name, author.bio ?? ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized)));
  }, [authors, query]);

  function resetForm() {
    setEditingId(null); setName(""); setBio(""); setAvatarUrl(""); setMessage(""); setError(""); setFormOpen(false);
  }
  function openCreate() {
    setEditingId(null); setName(""); setBio(""); setAvatarUrl(""); setMessage(""); setError(""); setFormOpen(true);
  }
  function openEdit(author: Author) {
    setEditingId(author.id); setName(author.name); setBio(author.bio ?? ""); setAvatarUrl(author.avatar_url ?? "");
    setMessage(""); setError(""); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function handleAvatar(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) { setError("Use uma imagem JPG, PNG, WebP ou AVIF."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("A imagem deve ter no máximo 8 MB."); return; }
    setUploading(true); setError("");
    try {
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-") || "avatar";
      const result = await upload(`authors/${crypto.randomUUID()}-${safeName}`, file, {
        access: "public", contentType: file.type, handleUploadUrl: "/api/admin/media",
        clientPayload: JSON.stringify({ type: file.type }),
      });
      setAvatarUrl(result.url); setMessage("Foto carregada. Salve o cadastro para aplicar a alteração.");
    } catch { setError("Não foi possível enviar a foto. Verifique a configuração de mídia e tente novamente."); }
    finally { setUploading(false); }
  }
  async function saveAuthor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/authors", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, bio, avatarUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar o autor.");
      setAuthors((current) => (editingId ? current.map((author) => author.id === data.author.id ? data.author : author) : [...current, data.author]).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      resetForm(); setMessage(editingId ? "Cadastro do autor atualizado." : "Autor cadastrado com sucesso.");
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar o autor."); }
    finally { setBusy(false); }
  }
  async function deleteAuthor(author: Author) {
    if (!window.confirm(`Excluir o cadastro de “${author.name}”? As notícias existentes serão mantidas, mas ficarão sem autor associado.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/authors", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: author.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir o autor.");
      setAuthors((current) => current.filter((item) => item.id !== author.id));
      if (editingId === author.id) resetForm();
      setMessage("Autor excluído. As notícias foram preservadas.");
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao excluir o autor."); }
    finally { setBusy(false); }
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setLoggedIn(false); window.sessionStorage.removeItem("cnc-admin-session"); }

  if (loading && !hasAdminSessionMarker()) return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Verificando acesso</h1><p>Aguarde enquanto validamos sua sessão administrativa.</p></main>;
  if (!loading && !loggedIn) return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Acesso restrito</h1><p>Entre no painel administrativo para gerenciar os autores.</p><a href="/admin">Ir para o painel</a></main>;

  return <main className={styles.shell}>
    <AdminSidebar onLogout={() => void logout()} />
    <div className={styles.main}>
      <AdminBreadcrumb className={styles.breadcrumb} linkClassName={styles.breadcrumbLink} currentClassName={styles.breadcrumbCurrent} items={[{ label: "Painel administrativo", href: "/admin" }, { label: "Autores" }]} />
      <AdminPageHeader className={styles.pageHeader} contentClassName={styles.pageHeaderContent} eyebrowClassName={styles.eyebrow} titleClassName={styles.pageTitle} descriptionClassName={styles.pageDescription} eyebrow={<><span /> GESTÃO EDITORIAL</>} title="Autores" description="Gerencie os perfis, biografias e fotografias que assinam as notícias da CNC Roraima." actions={<button className={styles.primaryButton} onClick={openCreate}><Plus size={18} /> Novo autor</button>} />
      <section className={styles.stats} aria-label="Resumo de autores">
        <AdminStatCard className={styles.statCard} iconClassName={styles.statIcon} icon={UsersRound} label="Total de autores" value={authors.length} note="Cadastros editoriais" />
        <AdminStatCard className={styles.statCard} iconClassName={styles.statIconGold} icon={CircleUserRound} label="Com fotografia" value={authors.filter((author) => author.avatar_url).length} note="Perfis com imagem" />
        <AdminStatCard className={styles.statCard} iconClassName={styles.statIconDark} icon={ShieldCheck} label="Biografias" value={authors.filter((author) => author.bio?.trim()).length} note="Perfis contextualizados" />
      </section>
      {message && <AdminNotice type="success" message={message} onDismiss={() => setMessage("")} className={styles.successNotice} />}
      {error && <AdminNotice type="error" message={error} onDismiss={() => setError("")} className={styles.errorNotice} />}
      {formOpen && <AuthorForm
        editing={Boolean(editingId)}
        name={name}
        bio={bio}
        avatarUrl={avatarUrl}
        busy={busy}
        uploading={uploading}
        onNameChange={setName}
        onBioChange={setBio}
        onAvatarUrlChange={setAvatarUrl}
        onAvatarFile={(file) => void handleAvatar(file)}
        onCancel={resetForm}
        onSubmit={(event) => void saveAuthor(event)}
      />}
      <AuthorDirectory authors={authors} filteredAuthors={filteredAuthors} loading={loading} query={query} busy={busy} onQueryChange={setQuery} onCreate={openCreate} onEdit={openEdit} onDelete={(author) => void deleteAuthor(author)} />
      <AdminPageFooter className={styles.pageFooter} />
    </div>
  </main>;
}
