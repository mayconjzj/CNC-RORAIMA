"use client";

import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { upload } from "@vercel/blob/client";
import { LogOut, PlusCircle, Pencil, Trash2, X, Eye, Upload, UserRoundPlus } from "lucide-react";
import { ArticleList } from "@/components/admin/article-list";
import { ArticleStructureEditor } from "@/components/admin/article-structure-editor";

import { createEditorId as uid, createBlankBlock as blankBlock, createBlankSection as blankSection, toEditorSections as toSections } from "@/lib/article-editor";
import type { EditorBlock as ArticleBlock, EditorSection as ArticleSection } from "@/lib/article-editor";
import type { AdminArticle as Article, AdminOption as Option, AdminAuthor as Author } from "@/lib/admin-types";

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
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [sections, setSections] = useState<ArticleSection[]>([blankSection()]);
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
    setEditingId(null); setTitle(""); setExcerpt(""); setSeoTitle(""); setSeoDescription(""); setSections([blankSection()]); setImage("");
    setCategoryId(""); setAuthorId(""); setStatus("draft"); setFeatured(false); setShowPreview(false);
  }
  function editArticle(article: Article) {
    setEditingId(article.id); setTitle(article.title); setExcerpt(article.excerpt ?? ""); setSeoTitle(article.seo_title ?? ""); setSeoDescription(article.seo_description ?? "");
    setSections(toSections(article.content)); setImage(article.featured_image_url ?? "");
    setCategoryId(article.category_id ?? ""); setAuthorId(article.author_id ?? "");
    setStatus(article.status === "published" ? "published" : "draft"); setFeatured(article.is_featured);
    setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateBlock(si:number,bi:number,changes:Partial<ArticleBlock>){setSections(cur=>cur.map((sec,i)=>i===si?{...sec,blocks:sec.blocks.map((b,j)=>j===bi?{...b,...changes}:b)}:sec));}
  function addSection(){setSections(cur=>[...cur,blankSection()]);}
  function moveSection(si:number,d:-1|1){setSections(cur=>{const next=[...cur],to=si+d;if(to<0||to>=next.length)return cur;[next[si],next[to]]=[next[to],next[si]];return next;});}
  function removeSection(si:number){setSections(cur=>cur.length===1?cur:cur.filter((_,i)=>i!==si));}
  function appendGalleryImage(si:number,bi:number,url:string){setSections(cur=>cur.map((sec,i)=>i===si?{...sec,blocks:sec.blocks.map((block,j)=>j===bi?{...block,items:[...(block.items||[]),{id:uid(),url}]}:block)}:sec));}
  function addBlock(si:number,type:ArticleBlock["type"]){setSections(cur=>cur.map((sec,i)=>i===si?{...sec,blocks:[...sec.blocks,blankBlock(type)]}:sec));}
  function moveBlock(si:number,bi:number,d:-1|1){setSections(cur=>cur.map((sec,i)=>{if(i!==si)return sec;const bs=[...sec.blocks],to=bi+d;if(to<0||to>=bs.length)return sec;[bs[bi],bs[to]]=[bs[to],bs[bi]];return {...sec,blocks:bs}}));}
  function removeBlock(si:number,bi:number){setSections(cur=>cur.map((sec,i)=>i===si?{...sec,blocks:sec.blocks.filter((_,j)=>j!==bi)}:sec));}
  async function uploadFile(file: File, onSuccess: (url: string) => void, key: string) {
    setUploading(key); setMessage("");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media",
        clientPayload: JSON.stringify({ type: file.type }),
      });
      onSuccess(blob.url); setMessage("Arquivo enviado com sucesso.");
    } catch { setMessage("Falha de conexão ao enviar o arquivo."); }
    finally { setUploading(null); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(editingId ? `/api/admin/articles/${editingId}` : "/api/admin/articles", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, seoTitle, seoDescription, content: sections, image, categoryId, authorId, status, isFeatured: featured }),
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
          <label style={label}>Título para mecanismos de busca (SEO)<input style={input} maxLength={70} placeholder="Se vazio, será usado o título da notícia" value={seoTitle} onChange={e=>setSeoTitle(e.target.value)}/><span style={{display:"block",fontWeight:400,color:"#777",fontSize:11,marginTop:5}}>{seoTitle.length}/70 caracteres recomendados</span></label>
          <label style={label}>Descrição para mecanismos de busca (SEO)<textarea style={{...input,minHeight:72}} maxLength={160} placeholder="Descrição curta para os resultados de busca" value={seoDescription} onChange={e=>setSeoDescription(e.target.value)}/><span style={{display:"block",fontWeight:400,color:"#777",fontSize:11,marginTop:5}}>{seoDescription.length}/160 caracteres recomendados</span></label>
          <label style={label}>Imagem de capa<input style={input} type="url" placeholder="https://..." value={image} onChange={e=>setImage(e.target.value)}/></label>
          <label style={{...label, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}><span style={{...btn,position:"relative",overflow:"hidden"}}><Upload size={15}/> Enviar capa<input aria-label="Enviar imagem de capa" type="file" accept="image/*" disabled={uploading==="cover"} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadFile(file,setImage,"cover");e.currentTarget.value="";}} style={{position:"absolute",inset:0,opacity:0,width:"100%",cursor:"pointer"}}/></span><span style={{fontWeight:400,color:"#777"}}>{uploading==="cover"?"Enviando...":"Também é possível colar uma URL."}</span></label>
          <ArticleStructureEditor sections={sections} setSections={setSections} inputStyle={input} labelStyle={label} buttonStyle={btn} uploading={uploading} addSection={addSection} moveSection={moveSection} removeSection={removeSection} addBlock={addBlock} moveBlock={moveBlock} removeBlock={removeBlock} updateBlock={updateBlock} appendGalleryImage={appendGalleryImage} uploadFile={uploadFile} />
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:20}}>
            <label style={label}>Editoria<select style={input} value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Sem editoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label style={label}>Autor principal<select style={input} value={authorId} onChange={e=>setAuthorId(e.target.value)}><option value="">Autor não definido</option>{authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label style={label}>Publicação<select style={input} value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Salvar como rascunho</option><option value="published">Publicar agora</option></select></label>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:18,flexWrap:"wrap"}}><label style={{display:"flex",gap:8,alignItems:"center",fontSize:14}}><input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)}/> Destacar na página inicial</label><button type="button" style={{...btn,marginLeft:"auto"}} onClick={()=>setShowPreview(v=>!v)}><Eye size={15}/>{showPreview?"Ocultar prévia":"Pré-visualizar"}</button></div>
          {showPreview&&<div style={{border:"1px dashed #c9a044",borderRadius:10,padding:18,marginBottom:18}}><h2>{title||"Título da notícia"}</h2>{sections.map((sec,i)=><section key={sec.id}><h3>{sec.title}</h3>{sec.blocks.map((b,j)=><div key={b.id||j} style={{margin:"12px 0"}}>{b.type==="gallery"?<div style={{display:"grid",gridTemplateColumns:`repeat(${b.columns||3},minmax(0,1fr))`,gap:8}}>{(b.items||[]).filter(x=>x.url).map((x,k)=><img key={x.id||k} src={x.url} alt={x.alt||""} style={{width:"100%",height:130,objectFit:"cover"}}/>)}</div>:b.type==="list"?<ul>{(b.text||"").split("\n").filter(Boolean).map((x,k)=><li key={k}>{x}</li>)}</ul>:b.type==="image"&&b.url?<img src={b.url} alt={b.alt||""} style={{maxWidth:"100%"}}/>:b.type==="video"&&b.url?<video controls src={b.url} style={{maxWidth:"100%"}}/>:b.type==="audio"&&b.url?<audio controls src={b.url}/>:b.type==="link"&&b.url?<a href={b.url}>{b.title||b.url}</a>:b.type==="heading"?<h3>{b.title}</h3>:b.type==="divider"?<hr/>:<div dangerouslySetInnerHTML={{__html:b.text||""}}/>}</div>)}</section>)}</div>}
          {message&&<p role="status" style={{color:"#b90018",fontSize:14}}>{message}</p>}
          <div style={{display:"flex",gap:10}}><button disabled={busy||uploading!==null} style={{flex:1,padding:13,border:0,borderRadius:8,background:"#b90018",color:"#fff",fontWeight:800,cursor:"pointer"}}>{busy?"Salvando...":editingId?"Salvar alterações":"Salvar notícia"}</button>{editingId&&<button type="button" onClick={resetForm} style={btn}><X size={16}/> Cancelar</button>}</div>
        </form>
      </section>
      <aside style={{display:"grid",gap:18,alignSelf:"start"}}>
        <ArticleList articles={articles} authors={authors} busy={busy} onRefresh={()=>void load()} onEdit={editArticle} onDelete={(article)=>void deleteArticle(article)} />
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
