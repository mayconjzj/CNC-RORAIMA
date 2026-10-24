"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBreadcrumb, AdminNotice, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import styles from "./autores.module.css";
import { ArrowUpRight, Check, CircleUserRound, ImagePlus, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, UsersRound, X } from "lucide-react";

type Author = { id: string; name: string; bio: string | null; avatar_url: string | null; created_at?: string };

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
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAuthors = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/authors", { cache: "no-store" });
      if (response.status === 401) { setLoggedIn(false); window.sessionStorage.removeItem("cnc-admin-session"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os autores.");
      setAuthors(data.authors ?? []); setLoggedIn(true); window.sessionStorage.setItem("cnc-admin-session", "active");
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
    if (fileRef.current) fileRef.current.value = "";
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

  if (loading && typeof window !== "undefined" && window.sessionStorage.getItem("cnc-admin-session") !== "active") return <main className={styles.unauthorized}><ShieldCheck size={34} /><h1>Verificando acesso</h1><p>Aguarde enquanto validamos sua sessão administrativa.</p></main>;
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
      {formOpen && <section className={styles.formCard} id="author-form">
        <div className={styles.formHeader}><div className={styles.formTitleIcon}><UserRound size={20} /></div><div><h2>{editingId ? "Editar autor" : "Cadastrar novo autor"}</h2><p>Essas informações podem aparecer junto às notícias publicadas.</p></div><button type="button" className={styles.closeButton} onClick={resetForm} aria-label="Fechar formulário"><X size={19} /></button></div>
        <form onSubmit={saveAuthor}>
          <div className={styles.formGrid}>
            <div className={styles.avatarColumn}>
              <span className={styles.fieldLabel}>Foto do autor</span>
              <button type="button" className={styles.avatarPicker} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {avatarUrl ? <img src={avatarUrl} alt="Prévia da foto do autor" /> : <span className={styles.avatarPlaceholder}><ImagePlus size={25} /><small>Adicionar foto</small></span>}
                <span className={styles.avatarEdit}><ImagePlus size={14} /></span>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => void handleAvatar(event.target.files?.[0])} />
              <small className={styles.helper}>JPG, PNG, WebP ou AVIF. Até 8 MB.</small>
              {uploading && <small className={styles.uploadStatus}><LoaderCircle size={13} className={styles.spin} /> Enviando imagem…</small>}
              <label className={styles.fieldLabel} htmlFor="avatar-url">Ou URL da foto</label>
              <input id="avatar-url" className={styles.input} type="url" placeholder="https://…" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
            </div>
            <div className={styles.fieldsColumn}>
              <label className={styles.fieldLabel} htmlFor="author-name">Nome completo <span>*</span></label>
              <input id="author-name" className={styles.input} autoFocus required minLength={2} maxLength={120} placeholder="Ex.: Maria Oliveira" value={name} onChange={(event) => setName(event.target.value)} />
              <div className={styles.fieldMeta}><span>Nome que será exibido como assinatura</span><span>{name.length}/120</span></div>
              <label className={styles.fieldLabel} htmlFor="author-bio">Biografia profissional</label>
              <textarea id="author-bio" className={styles.textarea} rows={6} maxLength={1200} placeholder="Apresente a trajetória, a área de atuação e as principais credenciais do autor…" value={bio} onChange={(event) => setBio(event.target.value)} />
              <div className={styles.fieldMeta}><span>Prefira uma apresentação objetiva e informativa.</span><span>{bio.length}/1200</span></div>
            </div>
          </div>
          <div className={styles.formFooter}><span><ShieldCheck size={15} /> Cadastro disponível apenas à administração.</span><div><button type="button" className={styles.secondaryButton} onClick={resetForm} disabled={busy}>Cancelar</button><button type="submit" className={styles.primaryButton} disabled={busy || uploading}>{busy ? <LoaderCircle size={17} className={styles.spin} /> : <Check size={17} />}{busy ? "Salvando…" : editingId ? "Salvar alterações" : "Cadastrar autor"}</button></div></div>
        </form>
      </section>}
      <section className={styles.directory}>
        <div className={styles.directoryHeader}><div><h2>Diretório de autores</h2><p>Consulte e mantenha os perfis da equipe editorial.</p></div><div className={styles.searchBox}><Search size={17} /><input aria-label="Buscar autores" placeholder="Buscar por nome ou biografia…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="Limpar busca"><X size={15} /></button>}</div></div>
        <div className={styles.directoryMeta}><span>{filteredAuthors.length} {filteredAuthors.length === 1 ? "autor encontrado" : "autores encontrados"}</span><span>ORDENADOS POR NOME</span></div>
        {loading && authors.length === 0 ? <div className={styles.authorList} aria-label="Carregando autores">{[0,1,2].map((item) => <div className={styles.authorRow} key={item}><div className={styles.skeletonAvatar} /><div className={styles.skeletonAuthorInfo}><span className={styles.skeletonLine} style={{width:"48%",height:14}}/><span className={styles.skeletonLine} style={{width:"78%",height:10}}/></div></div>)}</div> : filteredAuthors.length === 0 ? <div className={styles.emptyState}><span><UsersRound size={25} /></span><h3>{query ? "Nenhum resultado encontrado" : "Seu diretório começa aqui"}</h3><p>{query ? "Tente buscar por outro nome ou termo." : "Cadastre o primeiro autor para organizar as assinaturas das notícias."}</p>{!query && <button className={styles.primaryButton} onClick={openCreate}><Plus size={17} /> Cadastrar primeiro autor</button>}</div> :
          <div className={styles.authorList}>{filteredAuthors.map((author) => <article className={styles.authorRow} key={author.id}>
            <div className={styles.authorAvatar}>{author.avatar_url ? <img src={author.avatar_url} alt="" loading="lazy" /> : <span>{author.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>}</div>
            <div className={styles.authorInfo}><h3>{author.name}</h3><p>{author.bio?.trim() || "Nenhuma biografia cadastrada."}</p><div className={styles.authorBadges}><span className={author.avatar_url ? styles.badgeComplete : styles.badgeMissing}><span />{author.avatar_url ? "Foto cadastrada" : "Sem fotografia"}</span><span className={author.bio?.trim() ? styles.badgeComplete : styles.badgeMissing}><span />{author.bio?.trim() ? "Biografia preenchida" : "Sem biografia"}</span></div></div>
            <div className={styles.authorActions}><button type="button" onClick={() => openEdit(author)} disabled={busy} aria-label={`Editar ${author.name}`}><Pencil size={16} /><span>Editar</span></button><button type="button" className={styles.deleteButton} onClick={() => void deleteAuthor(author)} disabled={busy} aria-label={`Excluir ${author.name}`}><Trash2 size={16} /><span>Excluir</span></button></div>
          </article>)}</div>}
      </section>
      <footer className={styles.pageFooter}><span>C N C <b>RORAIMA</b> · PAINEL EDITORIAL</span><a href="/admin">Voltar ao painel <ArrowUpRight size={14} /></a></footer>
    </div>
  </main>;
}
