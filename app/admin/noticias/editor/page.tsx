"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ArticleStructureEditor } from "@/components/admin/article-structure-editor";
import { ArticleBody } from "@/components/news/article-body";
import { normalizeArticleSections } from "@/lib/article-content";
import { createEditorId as uid, createBlankBlock as blankBlock, createBlankSection as blankSection, toEditorSections as toSections } from "@/lib/article-editor";
import type { EditorBlock, EditorSection } from "@/lib/article-editor";
import type { AdminArticle, AdminOption, AdminAuthor } from "@/lib/admin-types";
import { ArrowLeft, Check, Eye, FileText, ImagePlus, Save, Send, X } from "lucide-react";
import styles from "./editor.module.css";

function ArticleEditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(editId));
  const [categories, setCategories] = useState<AdminOption[]>([]);
  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(editId);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [sections, setSections] = useState<EditorSection[]>([blankSection()]);
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("success");
  const coverInput = useRef<HTMLInputElement>(null);

  const input: CSSProperties = { width: "100%", padding: "12px 13px", border: "1px solid #dedfe4", borderRadius: 9, font: "inherit", fontSize: 14, marginTop: 7, background: "#fff", color: "#24252b" };
  const label: CSSProperties = { display: "block", fontSize: 12, fontWeight: 750, marginBottom: 17, color: "#484952" };
  const button: CSSProperties = { border: "1px solid #dedfe4", background: "#fff", color: "#34353c", borderRadius: 8, padding: "9px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, fontWeight: 700 };

  const loadOptions = useCallback(async () => {
    const [a, c, u] = await Promise.all([
      fetch("/api/admin/articles?limit=1", { cache: "no-store" }),
      fetch("/api/admin/categories", { cache: "no-store" }),
      fetch("/api/admin/authors", { cache: "no-store" }),
    ]);
    if (a.status === 401 || c.status === 401 || u.status === 401) { setAuthorized(false); setChecking(false); return false; }
    const [ad, cd, ud] = await Promise.all([a.json(), c.json(), u.json()]);
    if (!a.ok || !c.ok || !u.ok) throw new Error(ad.error || cd.error || ud.error || "Não foi possível carregar o editor.");
    setCategories(cd.categories ?? []); setAuthors(ud.authors ?? []); setAuthorized(true); setChecking(false);
    return true;
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const ok = await loadOptions();
        if (!alive || !ok || !editId) { if (alive) setLoadingArticle(false); return; }
        const response = await fetch(`/api/admin/articles/${encodeURIComponent(editId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Não foi possível abrir esta notícia.");
        const article: AdminArticle & { author_name?: string | null; published_at?: string | null } = data.article;
        if (!alive) return;
        setEditingId(article.id); setTitle(article.title ?? ""); setExcerpt(article.excerpt ?? "");
        setSections(toSections(article.content)); setImage(article.featured_image_url ?? "");
        setCategoryId(article.category_id ?? ""); setAuthorId(article.author_id ?? "");
        setStatus(article.status === "published" ? "published" : "draft"); setFeatured(Boolean(article.is_featured));
      } catch (e) { if (alive) { setChecking(false); setMessage(e instanceof Error ? e.message : "Falha ao carregar a notícia."); setMessageType("error"); } }
      finally { if (alive) setLoadingArticle(false); }
    })();
    return () => { alive = false; };
  }, [editId, loadOptions]);

  function resetMessage() { setMessage(""); }
  function updateBlock(si: number, bi: number, changes: Partial<EditorBlock>) { setSections(cur => cur.map((sec, i) => i === si ? { ...sec, blocks: sec.blocks.map((b, j) => j === bi ? { ...b, ...changes } : b) } : sec)); }
  function addSection() { setSections(cur => [...cur, blankSection()]); }
  function moveSection(si: number, d: -1 | 1) { setSections(cur => { const next = [...cur], to = si + d; if (to < 0 || to >= next.length) return cur; [next[si], next[to]] = [next[to], next[si]]; return next; }); }
  function removeSection(si: number) { setSections(cur => cur.length === 1 ? cur : cur.filter((_, i) => i !== si)); }
  function addBlock(si: number, type: EditorBlock["type"]) { setSections(cur => cur.map((sec, i) => i === si ? { ...sec, blocks: [...sec.blocks, blankBlock(type)] } : sec)); }
  function moveBlock(si: number, bi: number, d: -1 | 1) { setSections(cur => cur.map((sec, i) => { if (i !== si) return sec; const blocks = [...sec.blocks], to = bi + d; if (to < 0 || to >= blocks.length) return sec; [blocks[bi], blocks[to]] = [blocks[to], blocks[bi]]; return { ...sec, blocks }; })); }
  function removeBlock(si: number, bi: number) { setSections(cur => cur.map((sec, i) => i === si ? { ...sec, blocks: sec.blocks.filter((_, j) => j !== bi) } : sec)); }
  function appendGalleryImage(si: number, bi: number, url: string) { setSections(cur => cur.map((sec, i) => i === si ? { ...sec, blocks: sec.blocks.map((b, j) => j === bi ? { ...b, items: [...(b.items || []), { id: uid(), url }] } : b) } : sec)); }

  async function uploadFile(file: File, onSuccess: (url: string) => void, key: string) {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","image/avif","video/mp4","video/webm","audio/mpeg","audio/mp4","audio/ogg","audio/wav","audio/webm"];
    if (!allowed.includes(file.type)) { setMessage("Formato não suportado. Use imagem JPG/PNG/WebP/GIF/AVIF, vídeo MP4/WebM ou áudio MP3/MP4/OGG/WAV/WebM."); setMessageType("error"); return; }
    if (file.size > 25 * 1024 * 1024) { setMessage("O arquivo ultrapassa o limite de 25 MB."); setMessageType("error"); return; }
    setUploading(key); resetMessage();
    try {
      const name = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-");
      const blob = await upload(`${uid()}-${name || "arquivo"}`, file, { access: "public", contentType: file.type, handleUploadUrl: "/api/admin/media", clientPayload: JSON.stringify({ type: file.type }) });
      onSuccess(blob.url); setMessage("Arquivo enviado com sucesso."); setMessageType("success");
    } catch (e) { setMessage(e instanceof Error ? `Falha no envio: ${e.message}` : "Não foi possível enviar o arquivo."); setMessageType("error"); }
    finally { setUploading(null); }
  }

  async function save(event: FormEvent, publish?: boolean) {
    event.preventDefault(); setBusy(true); resetMessage();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const nextStatus = (publish || submitter?.value === "publish") ? "published" : "draft";
    try {
      const response = await fetch(editingId ? `/api/admin/articles/${editingId}` : "/api/admin/articles", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content: sections, image, categoryId, authorId, status: nextStatus, isFeatured: featured, seoTitle: title, seoDescription: excerpt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar a notícia.");
      setMessage(nextStatus === "published" ? "Notícia publicada com sucesso." : editingId ? "Alterações salvas com sucesso." : "Rascunho salvo com sucesso.");
      setMessageType("success"); setStatus(nextStatus); setEditingId(data.article?.id ?? editingId);
      if (!editingId && data.article?.id) router.replace(`/admin/noticias/editor?edit=${encodeURIComponent(data.article.id)}`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Falha ao salvar a notícia."); setMessageType("error"); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthorized(false); router.replace("/admin"); }
  const previewAuthor = authors.find(a => a.id === authorId);

  if (!checking && !authorized) return <main className={styles.unauthorized}><h1>Acesso restrito</h1><p>Sua sessão administrativa não está ativa.</p><Link href="/admin">Entrar no painel</Link></main>;

  return <main className={styles.shell}>
    <AdminSidebar onLogout={() => void logout()}/>
    <div className={styles.main}>
      <div className={styles.topbar}><Link href="/admin/noticias" className={styles.back}><ArrowLeft size={16}/> Voltar às notícias</Link><span className={styles.secure}><span/> {checking ? "Verificando sessão…" : "Sessão administrativa ativa"}</span></div>
      <header className={styles.header}><div><div className={styles.eyebrow}>CNC RORAIMA · ESTÚDIO EDITORIAL</div><h1>{editingId ? "Editar notícia" : "Criar notícia"}</h1><p>Prepare a matéria, organize os elementos e revise a publicação em um só lugar.</p></div><div className={styles.headerActions}><button type="button" className={styles.outlineButton} onClick={() => setShowPreview(v => !v)}><Eye size={16}/>{showPreview ? "Ocultar prévia" : "Pré-visualizar"}</button></div></header>
      {message && <div role={messageType === "error" ? "alert" : "status"} className={messageType === "error" ? styles.error : styles.success}>{messageType === "error" ? <X size={17}/> : <Check size={17}/>}<span>{message}</span><button type="button" onClick={resetMessage} aria-label="Fechar aviso"><X size={15}/></button></div>}
      {(checking || loadingArticle) ? <div className={styles.editorSkeletonGrid} aria-label={loadingArticle ? "Carregando dados da notícia" : "Carregando editor"}>
        <div className={styles.contentColumn}>{[0,1,2].map((item) => <section className={styles.card} key={item}><div className={styles.skeletonHeading}/><div className={styles.skeletonField}/><div className={styles.skeletonField}/><div className={styles.skeletonFieldShort}/></section>)}</div>
        <aside className={styles.sideColumn}><section className={styles.card}><div className={styles.skeletonHeading}/><div className={styles.skeletonField}/><div className={styles.skeletonField}/><div className={styles.skeletonField}/></section><section className={styles.stickyActions}><div className={styles.skeletonField}/><div className={styles.skeletonField}/></section></aside>
      </div> : <form id="article-editor-form" onSubmit={e => void save(e)} className={styles.editorGrid}>
        <div className={styles.contentColumn}>
          <section className={styles.card}><div className={styles.cardTitle}><span className={styles.step}>01</span><div><h2>Conteúdo principal</h2><p>O título e o resumo que apresentam a matéria ao leitor.</p></div></div>
            <label style={label}>Título da notícia <span className={styles.required}>*</span><input style={input} required minLength={5} maxLength={180} value={title} onChange={e => setTitle(e.target.value)} placeholder="Escreva um título claro e informativo"/></label>
            <div className={styles.counterRow}><span>Use uma manchete objetiva, com a informação mais importante.</span><span>{title.length}/180</span></div>
            <label style={label}>Resumo / linha fina<textarea style={{...input,minHeight:104,resize:"vertical"}} maxLength={500} value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Contextualize a notícia em uma ou duas frases."/></label>
            <div className={styles.counterRow}><span>Este texto pode aparecer nos cards e nos mecanismos de busca.</span><span>{excerpt.length}/500</span></div>
          </section>
          <section className={styles.card}><div className={styles.cardTitle}><span className={styles.step}>02</span><div><h2>Imagem de capa</h2><p>Escolha a imagem que representa a matéria no portal.</p></div></div>
            {image ? <div className={styles.coverPreview}><img src={image} alt={title ? `Capa: ${title}` : "Prévia da capa"}/><button type="button" onClick={() => setImage("")} aria-label="Remover imagem de capa"><X size={16}/></button></div> : <button type="button" className={styles.uploadCover} onClick={() => coverInput.current?.click()}><ImagePlus size={24}/><strong>Adicionar imagem de capa</strong><span>JPG, PNG, WebP, GIF ou AVIF · até 25 MB</span></button>}
            <input ref={coverInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={uploading !== null} onChange={e => { const file=e.target.files?.[0]; if(file) void uploadFile(file,setImage,"cover"); e.currentTarget.value=""; }}/>
            <label style={label}>URL da imagem<input style={input} type="url" placeholder="https://..." value={image} onChange={e => setImage(e.target.value)}/></label>
          </section>
          <section className={styles.card}><div className={styles.cardTitle}><span className={styles.step}>03</span><div><h2>Corpo da notícia</h2><p>Monte a matéria com texto, títulos, citações, listas e elementos multimídia.</p></div></div>
            <ArticleStructureEditor sections={sections} setSections={setSections} inputStyle={input} labelStyle={label} buttonStyle={button} uploading={uploading} addSection={addSection} moveSection={moveSection} removeSection={removeSection} addBlock={addBlock} moveBlock={moveBlock} removeBlock={removeBlock} updateBlock={updateBlock} appendGalleryImage={appendGalleryImage} uploadFile={uploadFile}/>
          </section>

        </div>
        <aside className={styles.sideColumn}>
          <section className={styles.card}><div className={styles.cardTitle}><FileText size={18}/><div><h2>Publicação</h2><p>Defina como a notícia será disponibilizada.</p></div></div>
            <div className={styles.currentStatus}><span>Status atual</span><strong className={status === "published" ? styles.statusPublished : styles.statusDraft}>{status === "published" ? "Publicada" : "Rascunho"}</strong></div>
            <label style={label}>Editoria<select style={input} value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Sem editoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label style={label}>Autor principal<select style={input} value={authorId} onChange={e => setAuthorId(e.target.value)}><option value="">Autor não definido</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label className={styles.featured}><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}/><span><strong>Destacar na página inicial</strong><small>A notícia receberá destaque no portal.</small></span></label>
            <div className={styles.publishHint}><Check size={15}/> Escolha uma ação abaixo: salvar sem publicar ou publicar agora.</div>
          </section>
          <section className={styles.stickyActions}><button className={styles.saveButton} type="submit" name="intent" value="draft" disabled={busy || uploading !== null}><Save size={16}/>{busy ? "Salvando…" : "Salvar rascunho"}</button><button className={styles.publishButton} type="submit" name="intent" value="publish" disabled={busy || uploading !== null}><Send size={15}/>{busy ? "Processando…" : status === "published" ? "Salvar e publicar" : "Publicar notícia"}</button><button type="button" className={styles.outlineButton} disabled={busy || uploading !== null} onClick={() => router.push("/admin/noticias")}><X size={15}/> Cancelar</button></section>
          <div className={styles.sideNote}>As alterações só ficam públicas depois de salvar a notícia com status “Publicada”.</div>
        </aside>
      </form>}
      {showPreview && <section className={styles.previewPanel}><div className={styles.previewHeading}><div><span>PRÉ-VISUALIZAÇÃO</span><h2>Assim a matéria pode aparecer no portal</h2></div><button className={styles.outlineButton} onClick={() => setShowPreview(false)}><X size={15}/> Fechar</button></div><article className={styles.previewArticle}><p className={styles.previewCategory}>{categories.find(c=>c.id===categoryId)?.name ?? "Notícias de Roraima"}</p><h1>{title || "Título da notícia"}</h1>{excerpt && <p className={styles.previewExcerpt}>{excerpt}</p>}<p className={styles.previewByline}>Por {authors.find(a=>a.id===authorId)?.name ?? "Redação CNC Roraima"} · Prévia</p>{image && <img className={styles.previewCover} src={image} alt={title || "Imagem de capa"}/>}<ArticleBody sections={normalizeArticleSections(sections)}/></article></section>}
      <footer className={styles.footer}>CNC RORAIMA · ESTÚDIO EDITORIAL <Link href="/admin/noticias">Voltar ao diretório</Link></footer>
    </div>
  </main>;
}


export default function ArticleEditorPage() {
  return <Suspense fallback={<main className={styles.shell}><AdminSidebar onLogout={() => {}}/><div className={styles.main}><div className={styles.editorSkeletonGrid}><section className={styles.card}><div className={styles.skeletonHeading}/><div className={styles.skeletonField}/><div className={styles.skeletonField}/></section><section className={styles.card}><div className={styles.skeletonHeading}/><div className={styles.skeletonField}/></section></div></div></main>}><ArticleEditorContent /></Suspense>;
}
