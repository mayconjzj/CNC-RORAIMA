"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, CSSProperties, ReactNode } from "react";
import { LogOut, Newspaper, PlusCircle, RefreshCw, Pencil, Trash2, X, Bold, Italic, Underline, Link2, ImagePlus, Video, Music, Heading2, Quote, Minus, Eye, Upload, UserRoundPlus } from "lucide-react";

type ArticleBlock = { id: string; type: "paragraph" | "heading" | "quote" | "image" | "video" | "audio" | "link" | "divider"; text?: string; title?: string; url?: string; alt?: string; caption?: string };
type Article = { id: string; title: string; slug: string; excerpt: string | null; content: unknown; featured_image_url: string | null; status: string; is_featured: boolean; category_id: string | null; author_id: string | null; category_name: string | null; updated_at: string };
type Option = { id: string; name: string };
type Author = { id: string; name: string; bio: string | null; avatar_url: string | null };

const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random());
const blankBlock = (type: ArticleBlock["type"] = "paragraph"): ArticleBlock => ({ id: uid(), type, text: "", title: "", url: "", alt: "", caption: "" });

function toBlocks(content: unknown): ArticleBlock[] {
  let value = content;
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { return [{ ...blankBlock(), text: value }]; } }
  if (!Array.isArray(value)) return [blankBlock()];
  const blocks = value.map((item: Record<string, unknown>) => ({ ...blankBlock((item.type as ArticleBlock["type"]) || "paragraph"), ...item, id: uid() })) as ArticleBlock[];
  return blocks.length ? blocks : [blankBlock()];
}

function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value || ""; }, [value]);
  function command(name: string, argument?: string) {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editor.current?.innerHTML ?? "");
  }
  function addLink() {
    const url = window.prompt("Cole o endereço do link (https://...)");
    if (url && /^https?:\/\//i.test(url)) command("createLink", url);
  }
  const tool = (label: string, icon: ReactNode, action: () => void) => <button type="button" title={label} aria-label={label} onClick={action} style={{ padding: 8, border: "1px solid #e3e3e3", borderRadius: 6, background: "#fff", cursor: "pointer", display: "inline-flex" }}>{icon}</button>;
  return <div style={{ marginTop: 8, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 8, background: "#f8f8f8", borderBottom: "1px solid #e5e5e5" }}>
      {tool("Negrito", <Bold size={16}/>, () => command("bold"))}
      {tool("Itálico", <Italic size={16}/>, () => command("italic"))}
      {tool("Sublinhado", <Underline size={16}/>, () => command("underline"))}
      {tool("Adicionar link", <Link2 size={16}/>, addLink)}
      <span style={{ alignSelf: "center", fontSize: 12, color: "#777", marginLeft: 4 }}>Selecione o texto para formatar</span>
    </div>
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={event => onChange(event.currentTarget.innerHTML)} style={{ minHeight: 130, padding: 14, outline: "none", lineHeight: 1.7, overflowWrap: "anywhere" }} />
    <style>{'[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#999;pointer-events:none}'}</style>
  </div>;
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [blocks, setBlocks] = useState<ArticleBlock[]>([blankBlock()]);
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [showAuthors, setShowAuthors] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function load() {
    const [a, c, au] = await Promise.all([fetch("/api/admin/articles"), fetch("/api/admin/categories"), fetch("/api/admin/authors")]);
    if (a.status === 401) { setLoggedIn(false); return; }
    const [articleData, categoryData, authorData] = await Promise.all([a.json(), c.json(), au.json()]);
    setArticles(articleData.articles ?? []);
    setCategories(categoryData.categories ?? []);
    setAuthors(authorData.authors ?? categoryData.authors ?? []);
    setLoggedIn(true);
  }
  useEffect(() => { void load().finally(() => setCheckingSession(false)); }, []);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Falha ao entrar."); return; }
      setPassword(""); await load();
    } catch { setMessage("Falha de conexão ao entrar."); }
    finally { setBusy(false); }
  }

  function resetForm() {
    setEditingId(null); setTitle(""); setExcerpt(""); setBlocks([blankBlock()]); setImage("");
    setCategoryId(""); setAuthorId(""); setStatus("draft"); setFeatured(false); setShowPreview(false);
  }
  function editArticle(article: Article) {
    setEditingId(article.id); setTitle(article.title); setExcerpt(article.excerpt ?? "");
    setBlocks(toBlocks(article.content)); setImage(article.featured_image_url ?? "");
    setCategoryId(article.category_id ?? ""); setAuthorId(article.author_id ?? "");
    setStatus(article.status === "published" ? "published" : "draft"); setFeatured(article.is_featured);
    setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateBlock(index: number, changes: Partial<ArticleBlock>) {
    setBlocks(current => current.map((block, i) => i === index ? { ...block, ...changes } : block));
  }
  function addBlock(type: ArticleBlock["type"]) { setBlocks(current => [...current, blankBlock(type)]); }
  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks(current => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  async function uploadFile(file: File, onSuccess: (url: string) => void, key: string) {
    setUploading(key); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Não foi possível enviar o arquivo."); return; }
      onSuccess(data.url); setMessage("Arquivo enviado com sucesso.");
    } catch { setMessage("Falha de conexão ao enviar o arquivo."); }
    finally { setUploading(null); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(editingId ? `/api/admin/articles/${editingId}` : "/api/admin/articles", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content: blocks, image, categoryId, authorId, status, isFeatured: featured }),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Falha ao salvar."); return; }
      setMessage(editingId ? "Notícia atualizada com sucesso." : "Notícia cadastrada com sucesso.");
      resetForm(); await load();
    } catch { setMessage("Falha de conexão ao salvar a notícia."); }
    finally { setBusy(false); }
  }
  async function deleteArticle(article: Article) {
    if (!window.confirm(`Excluir definitivamente a notícia “${article.title}”? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Não foi possível excluir."); return; }
      if (editingId === article.id) resetForm(); setMessage("Notícia excluída."); await load();
    } catch { setMessage("Falha de conexão ao excluir."); }
    finally { setBusy(false); }
  }
  async function createCategory() {
    if (categoryName.trim().length < 2) { setMessage("Digite uma editoria com pelo menos 2 caracteres."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: categoryName }) });
      const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Não foi possível criar a editoria."); return; }
      setCategories(current => current.some(c => c.id === data.category.id) ? current : [...current, data.category].sort((a,b) => a.name.localeCompare(b.name, "pt-BR")));
      setCategoryId(data.category.id); setCategoryName(""); setMessage("Editoria selecionada.");
    } catch { setMessage("Falha ao criar editoria."); }
    finally { setBusy(false); }
  }
  async function deleteCategory(category: Option) {
    if (!window.confirm(`Excluir a editoria “${category.name}”? As notícias serão preservadas.`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: category.id }) });
      const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Não foi possível excluir."); return; }
      setCategories(current => current.filter(c => c.id !== category.id)); if (categoryId === category.id) setCategoryId("");
      setArticles(current => current.map(a => a.category_id === category.id ? { ...a, category_id: null, category_name: null } : a));
      setMessage("Editoria excluída; notícias preservadas.");
    } catch { setMessage("Falha ao excluir editoria."); }
    finally { setBusy(false); }
  }
  function editAuthor(author: Author) { setEditingAuthorId(author.id); setAuthorName(author.name); setAuthorBio(author.bio ?? ""); setAuthorAvatar(author.avatar_url ?? ""); }
  function resetAuthor() { setEditingAuthorId(null); setAuthorName(""); setAuthorBio(""); setAuthorAvatar(""); }
  async function saveAuthor(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/authors", { method: editingAuthorId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingAuthorId, name: authorName, bio: authorBio, avatarUrl: authorAvatar }) });
      const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Não foi possível salvar autor."); return; }
      setAuthors(current => (editingAuthorId ? current.map(a => a.id === data.author.id ? data.author : a) : [...current, data.author]).sort((a,b) => a.name.localeCompare(b.name, "pt-BR")));
      resetAuthor(); setMessage("Autor salvo com sucesso.");
    } catch { setMessage("Falha ao salvar autor."); }
    finally { setBusy(false); }
  }
  async function deleteAuthor(author: Author) {
    if (!window.confirm(`Excluir o autor “${author.name}”? As notícias serão mantidas sem esse autor.`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/authors", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: author.id }) });
      const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Não foi possível excluir autor."); return; }
      setAuthors(current => current.filter(a => a.id !== author.id)); if (authorId === author.id) setAuthorId(""); if (editingAuthorId === author.id) resetAuthor();
      setArticles(current => current.map(a => a.author_id === author.id ? { ...a, author_id: null } : a)); setMessage("Autor excluído; notícias preservadas.");
    } catch { setMessage("Falha ao excluir autor."); }
    finally { setBusy(false); }
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setLoggedIn(false); setMessage("Sessão encerrada."); }

  const input: CSSProperties = { width: "100%", padding: "11px 12px", border: "1px solid #ddd", borderRadius: 8, font: "inherit", marginTop: 6, background: "#fff" };
  const label: CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 16 };
  const btn: CSSProperties = { border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: "9px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
  const panel: CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #eee", minWidth: 0 };

  if (checkingSession) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#555" }}>Verificando sessão...</main>;
  if (!loggedIn) return <main style={{ minHeight: "100vh", background: "#f5f5f6", display: "grid", placeItems: "center", padding: 20 }}><form onSubmit={login} style={{ width: "min(420px,100%)", background: "#fff", padding: 30, borderRadius: 16 }}><a href="/" style={{ color: "#b90018", fontWeight: 800 }}>CNC RORAIMA</a><h1 style={{ margin: "18px 0 6px", fontSize: 28 }}>Painel editorial</h1><p style={{ color: "#666", marginBottom: 24 }}>Acesso restrito à administração.</p><label style={label}>E-mail<input style={input} type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label style={label}>Senha<input style={input} type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{message && <p role="alert" style={{color:"#b90018"}}>{message}</p>}<button disabled={busy} style={{width:"100%",padding:13,background:"#b90018",color:"#fff",border:0,borderRadius:8,fontWeight:800}}>{busy?"Entrando...":"Entrar"}</button></form></main>;

  return <main style={{ minHeight: "100vh", background: "#f7f7f8" }}>
    <header style={{ background: "#202126", color: "#fff", padding: "18px max(20px, calc((100% - 1180px)/2))", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><a href="/" style={{ color: "#e0bd6b", fontWeight: 800, letterSpacing: 1 }}>CNC RORAIMA <span style={{ color: "#fff", fontWeight: 400 }}>/ Administração</span></a><button onClick={logout} style={{ ...btn, color: "#fff", background: "transparent", borderColor: "#777" }}><LogOut size={16}/> Sair</button></header>
    <div style={{ width: "min(1180px, calc(100% - 28px))", margin: "26px auto", display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(300px,.8fr)", gap: 20 }}>
      <section style={panel}>
        <h1 style={{ fontSize: 24, margin: "0 0 5px" }}><PlusCircle size={22} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }}/>{editingId ? "Editar notícia" : "Nova notícia"}</h1>
        <p style={{ color: "#777", marginBottom: 22 }}>Monte a matéria por blocos: texto, títulos, citações, imagens, vídeos, áudios e links.</p>
        <form onSubmit={save}>
          <label style={label}>Título da notícia<input style={input} minLength={5} maxLength={180} required value={title} onChange={e=>setTitle(e.target.value)}/></label>
          <label style={label}>Resumo / linha fina<textarea style={{...input,minHeight:72}} maxLength={500} value={excerpt} onChange={e=>setExcerpt(e.target.value)}/></label>
          <label style={label}>Imagem de capa<input style={input} type="url" placeholder="https://..." value={image} onChange={e=>setImage(e.target.value)}/></label>
          <label style={{...label, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}><span style={{...btn,position:"relative",overflow:"hidden"}}><Upload size={15}/> Enviar capa<input aria-label="Enviar imagem de capa" type="file" accept="image/*" disabled={uploading==="cover"} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadFile(file,setImage,"cover");e.currentTarget.value="";}} style={{position:"absolute",inset:0,opacity:0,width:"100%",cursor:"pointer"}}/></span><span style={{fontWeight:400,color:"#777"}}>{uploading==="cover"?"Enviando...":"Também é possível colar uma URL."}</span></label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, margin:"8px 0 16px" }}>
            <button type="button" style={btn} onClick={()=>addBlock("paragraph")}><PlusCircle size={15}/> Texto</button>
            <button type="button" style={btn} onClick={()=>addBlock("heading")}><Heading2 size={15}/> Título de seção</button>
            <button type="button" style={btn} onClick={()=>addBlock("quote")}><Quote size={15}/> Citação</button>
            <button type="button" style={btn} onClick={()=>addBlock("image")}><ImagePlus size={15}/> Foto</button>
            <button type="button" style={btn} onClick={()=>addBlock("video")}><Video size={15}/> Vídeo</button>
            <button type="button" style={btn} onClick={()=>addBlock("audio")}><Music size={15}/> Áudio</button>
            <button type="button" style={btn} onClick={()=>addBlock("link")}><Link2 size={15}/> Link</button>
            <button type="button" style={btn} onClick={()=>addBlock("divider")}><Minus size={15}/> Separador</button>
          </div>
          <div style={{display:"grid",gap:12}}>
            {blocks.map((block,index)=><section key={block.id} style={{border:"1px solid #e5e5e5",borderRadius:10,padding:14,background:"#fcfcfc"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}><strong style={{fontSize:14}}>Bloco {index+1}: {{paragraph:"Texto",heading:"Título de seção",quote:"Citação",image:"Imagem",video:"Vídeo",audio:"Áudio",link:"Link",divider:"Separador"}[block.type]}</strong><div style={{display:"flex",gap:5}}><button type="button" style={btn} aria-label="Mover bloco para cima" disabled={index===0} onClick={()=>moveBlock(index,-1)}>↑</button><button type="button" style={btn} aria-label="Mover bloco para baixo" disabled={index===blocks.length-1} onClick={()=>moveBlock(index,1)}>↓</button><button type="button" style={{...btn,color:"#b90018"}} aria-label="Excluir bloco" onClick={()=>setBlocks(current=>current.filter((_,i)=>i!==index))}><Trash2 size={15}/></button></div></div>
              {block.type==="heading" && <label style={label}>Título<input style={input} value={block.title||""} onChange={e=>updateBlock(index,{title:e.target.value})} placeholder="Título desta seção"/></label>}
              {(block.type==="paragraph"||block.type==="quote") && <RichTextEditor value={block.text||""} onChange={text=>updateBlock(index,{text})} placeholder={block.type==="quote"?"Digite a citação...":"Escreva o texto da notícia..."}/>}
              {["image","video","audio"].includes(block.type) && <><label style={label}>URL do arquivo<input style={input} type="url" placeholder="https://..." value={block.url||""} onChange={e=>updateBlock(index,{url:e.target.value})}/></label><label style={{...label,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{...btn,position:"relative",overflow:"hidden"}}><Upload size={15}/> Enviar {block.type==="image"?"foto":block.type==="video"?"vídeo":"áudio"}<input type="file" accept={block.type==="image"?"image/*":block.type==="video"?"video/mp4,video/webm": "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"} disabled={uploading===block.id} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadFile(file,url=>updateBlock(index,{url}),block.id);e.currentTarget.value="";}} style={{position:"absolute",inset:0,opacity:0,width:"100%",cursor:"pointer"}}/></span><span style={{fontWeight:400,color:"#777"}}>{uploading===block.id?"Enviando arquivo...":"Limite: 25 MB por arquivo"}</span></label>{block.type==="image"&&<label style={label}>Texto alternativo<input style={input} value={block.alt||""} onChange={e=>updateBlock(index,{alt:e.target.value})} placeholder="Descreva a imagem para acessibilidade"/></label>}<label style={label}>Legenda<input style={input} value={block.caption||""} onChange={e=>updateBlock(index,{caption:e.target.value})} placeholder="Legenda ou crédito (opcional)"/></label>{block.url&&block.type==="image"&&<img src={block.url} alt={block.alt||""} style={{maxWidth:"100%",maxHeight:220,borderRadius:8}}/>}</>}
              {block.type==="link" && <><label style={label}>Texto do link<input style={input} value={block.title||""} onChange={e=>updateBlock(index,{title:e.target.value})} placeholder="Ex.: Leia o documento completo"/></label><label style={label}>Endereço<input style={input} type="url" value={block.url||""} onChange={e=>updateBlock(index,{url:e.target.value})} placeholder="https://..."/></label></>}
              {block.type==="divider"&&<p style={{color:"#777",margin:0}}>Uma linha divisória será exibida no texto publicado.</p>}
            </section>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:20}}>
            <label style={label}>Editoria<select style={input} value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Sem editoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label style={label}>Autor principal<select style={input} value={authorId} onChange={e=>setAuthorId(e.target.value)}><option value="">Autor não definido</option>{authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label style={label}>Publicação<select style={input} value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Salvar como rascunho</option><option value="published">Publicar agora</option></select></label>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:18,flexWrap:"wrap"}}><label style={{display:"flex",gap:8,alignItems:"center",fontSize:14}}><input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)}/> Destacar na página inicial</label><button type="button" style={{...btn,marginLeft:"auto"}} onClick={()=>setShowPreview(v=>!v)}><Eye size={15}/>{showPreview?"Ocultar prévia":"Pré-visualizar"}</button></div>
          {showPreview&&<div style={{border:"1px dashed #c9a044",borderRadius:10,padding:18,marginBottom:18}}><p style={{color:"#b90018",fontWeight:800,fontSize:12}}>PRÉVIA DA NOTÍCIA</p><h2 style={{fontSize:28,lineHeight:1.2}}>{title||"Título da notícia"}</h2>{excerpt&&<p style={{color:"#666"}}>{excerpt}</p>}{image&&<img src={image} alt="" style={{width:"100%",maxHeight:300,objectFit:"cover",borderRadius:8}}/>}{blocks.map((b,i)=><div key={b.id||i} style={{margin:"14px 0"}}>{b.type==="heading"?<h3>{b.title}</h3>:b.type==="image"&&b.url?<img src={b.url} alt={b.alt||""} style={{maxWidth:"100%",maxHeight:300}}/>:b.type==="video"&&b.url?<video controls src={b.url} style={{maxWidth:"100%"}}/>:b.type==="audio"&&b.url?<audio controls src={b.url}/>:b.type==="link"&&b.url?<a href={b.url}>{b.title||b.url}</a>:b.type==="divider"?<hr/>:<div dangerouslySetInnerHTML={{__html:b.text||""}}/>}</div>)}</div>}
          {message&&<p role="status" style={{color:"#b90018",fontSize:14}}>{message}</p>}
          <div style={{display:"flex",gap:10}}><button disabled={busy||uploading!==null} style={{flex:1,padding:13,border:0,borderRadius:8,background:"#b90018",color:"#fff",fontWeight:800,cursor:"pointer"}}>{busy?"Salvando...":editingId?"Salvar alterações":"Salvar notícia"}</button>{editingId&&<button type="button" onClick={resetForm} style={btn}><X size={16}/> Cancelar</button>}</div>
        </form>
      </section>
      <aside style={{display:"grid",gap:18,alignSelf:"start"}}>
        <section style={panel}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><h2 style={{fontSize:20,margin:0}}><Newspaper size={19} style={{verticalAlign:"middle",marginRight:8,color:"#b90018"}}/>Notícias recentes</h2><button aria-label="Atualizar lista" onClick={()=>void load()} style={btn}><RefreshCw size={15}/></button></div>
          <div style={{marginTop:12}}>{articles.length===0?<p style={{color:"#777"}}>Nenhuma notícia cadastrada.</p>:articles.map(a=><article key={a.id} style={{padding:"13px 0",borderBottom:"1px solid #eee"}}><strong>{a.title}</strong><p style={{color:"#777",fontSize:12,margin:"5px 0"}}>{a.category_name??"Sem editoria"} · {a.status==="published"?"Publicado":"Rascunho"}</p><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{a.status==="published"&&<a href={"/noticias/"+a.slug} target="_blank" rel="noreferrer" style={{color:"#b90018",fontSize:13}}>Ver ↗</a>}<button type="button" onClick={()=>editArticle(a)} style={{border:0,background:"transparent",padding:0,cursor:"pointer",display:"inline-flex",gap:4,alignItems:"center",fontSize:13}}><Pencil size={13}/> Editar</button><button type="button" disabled={busy} onClick={()=>void deleteArticle(a)} style={{border:0,background:"transparent",color:"#b90018",padding:0,cursor:"pointer",display:"inline-flex",gap:4,alignItems:"center",fontSize:13}}><Trash2 size={13}/> Excluir</button></div></article>)}</div>
        </section>
        <section style={panel}><h2 style={{fontSize:20,margin:"0 0 12px"}}>Editorias</h2><div style={{display:"flex",gap:7,marginBottom:12}}><input style={{...input,marginTop:0}} placeholder="Nova editoria" value={categoryName} onChange={e=>setCategoryName(e.target.value)}/><button type="button" onClick={()=>void createCategory()} style={{...btn,color:"#b90018"}}>Adicionar</button></div>{categories.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #eee"}}><span>{c.name}</span><button type="button" style={{...btn,color:"#b90018",padding:6}} onClick={()=>void deleteCategory(c)} aria-label={"Excluir "+c.name}><Trash2 size={14}/></button></div>)}</section>
        <section style={panel}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:12}}><h2 style={{fontSize:20,margin:0}}>Autores</h2><button type="button" style={btn} onClick={()=>{setShowAuthors(v=>!v);resetAuthor();}}><UserRoundPlus size={15}/>{showAuthors?"Fechar":"Gerenciar"}</button></div>
          {showAuthors&&<form onSubmit={saveAuthor} style={{padding:12,background:"#fafafa",borderRadius:9,marginBottom:12}}><strong style={{display:"block",marginBottom:12}}>{editingAuthorId?"Editar autor":"Adicionar autor"}</strong><label style={label}>Nome<input required minLength={2} maxLength={120} style={input} value={authorName} onChange={e=>setAuthorName(e.target.value)}/></label><label style={label}>Biografia<textarea style={{...input,minHeight:70}} maxLength={2000} value={authorBio} onChange={e=>setAuthorBio(e.target.value)}/></label><label style={label}>URL da foto<input style={input} type="url" placeholder="https://..." value={authorAvatar} onChange={e=>setAuthorAvatar(e.target.value)}/></label><div style={{display:"flex",gap:8}}><button disabled={busy} style={{...btn,background:"#b90018",color:"#fff",border:0}}>{editingAuthorId?"Salvar autor":"Adicionar autor"}</button>{editingAuthorId&&<button type="button" style={btn} onClick={resetAuthor}>Cancelar</button>}</div></form>}
          {authors.length===0?<p style={{color:"#777",fontSize:14}}>Nenhum autor cadastrado.</p>:authors.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #eee"}}><div><strong>{a.name}</strong>{a.bio&&<p style={{color:"#777",fontSize:12,margin:"3px 0"}}>{a.bio}</p>}</div><div style={{display:"flex",gap:5}}><button type="button" style={btn} aria-label={"Editar "+a.name} onClick={()=>{setShowAuthors(true);editAuthor(a);}}><Pencil size={13}/></button><button type="button" style={{...btn,color:"#b90018"}} aria-label={"Excluir "+a.name} onClick={()=>void deleteAuthor(a)}><Trash2 size={13}/></button></div></div>)}
        </section>
      </aside>
    </div>
    <style>{'@media(max-width:850px){main>div{grid-template-columns:minmax(0,1fr)!important}}'}</style>
  </main>;
}
