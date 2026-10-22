"use client";

import { useEffect, useState } from "react";
import { LogOut, Newspaper, PlusCircle, RefreshCw, Pencil, Trash2, X } from "lucide-react";

type Article = { id: string; title: string; slug: string; excerpt: string | null; content: unknown; featured_image_url: string | null; status: string; is_featured: boolean; category_id: string | null; author_id: string | null; category_name: string | null; updated_at: string };
type Option = { id: string; name: string };

function contentToText(content: unknown): string {
  if (typeof content === "string") { try { content = JSON.parse(content); } catch { return String(content); } }
  if (Array.isArray(content)) return content.map((block) => typeof block?.text === "string" ? block.text : typeof block?.title === "string" ? block.title : "").filter(Boolean).join("\n\n");
  return "";
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Option[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [authorId, setAuthorId] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [a, c] = await Promise.all([fetch("/api/admin/articles"), fetch("/api/admin/categories")]);
    if (a.status === 401) { setLoggedIn(false); return; }
    const articleData = await a.json();
    const categoryData = await c.json();
    setArticles(articleData.articles ?? []);
    setCategories(categoryData.categories ?? []);
    setAuthors(categoryData.authors ?? []);
    setLoggedIn(true);
  }

  useEffect(() => { void load(); }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Falha ao entrar."); return; }
    setPassword(""); await load();
  }

  function resetForm() {
    setEditingId(null); setTitle(""); setExcerpt(""); setContent(""); setImage("");
    setCategoryId(""); setAuthorId(""); setStatus("draft"); setFeatured(false); setCategoryName("");
  }

  function editArticle(article: Article) {
    setEditingId(article.id); setTitle(article.title); setExcerpt(article.excerpt ?? "");
    setContent(contentToText(article.content)); setImage(article.featured_image_url ?? "");
    setCategoryId(article.category_id ?? ""); setAuthorId(article.author_id ?? "");
    setStatus(article.status === "published" ? "published" : "draft"); setFeatured(article.is_featured);
    setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(editingId ? `/api/admin/articles/${editingId}` : "/api/admin/articles", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content, image, categoryId, authorId, status, isFeatured: featured }),
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
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Não foi possível excluir."); return; }
      if (editingId === article.id) resetForm();
      setMessage("Notícia excluída."); await load();
    } catch { setMessage("Falha de conexão ao excluir a notícia."); }
    finally { setBusy(false); }
  }

  async function createCategory() {
    const name = categoryName.trim();
    if (name.length < 2) { setMessage("Digite um nome de editoria com pelo menos 2 caracteres."); return; }
    setCreatingCategory(true); setMessage("");
    try {
      const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Não foi possível criar a editoria."); return; }
      const category = data.category as Option;
      setCategories(current => current.some(item => item.id === category.id) ? current : [...current, category].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setCategoryId(category.id);
      setCategoryName("");
      setMessage(data.existing ? "Essa editoria já existia e foi selecionada." : "Editoria criada e selecionada.");
    } catch {
      setMessage("Falha de conexão ao criar editoria.");
    } finally { setCreatingCategory(false); }
  }


  async function deleteCategory(category: Option) {
    if (!window.confirm(`Excluir a editoria “${category.name}”? As notícias serão preservadas, mas ficarão sem editoria.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Não foi possível excluir a editoria."); return; }
      setCategories(current => current.filter(item => item.id !== category.id));
      if (categoryId === category.id) setCategoryId("");
      setArticles(current => current.map(article => article.category_id === category.id
        ? { ...article, category_id: null, category_name: null }
        : article));
      setMessage(`Editoria “${category.name}” excluída. As notícias foram preservadas.`);
    } catch {
      setMessage("Falha de conexão ao excluir a editoria.");
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }); setLoggedIn(false); setMessage("Sessão encerrada.");
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, font: "inherit", marginTop: 6 };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 14 };

  if (!loggedIn) return <main style={{ minHeight: "100vh", background: "#f5f5f6", display: "grid", placeItems: "center", padding: 20 }}>
    <form onSubmit={login} style={{ width: "min(420px, 100%)", background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 12px 40px #00000012" }}>
      <a href="/" style={{ color: "#b90018", fontWeight: 800, letterSpacing: 2 }}>CNC RORAIMA</a>
      <h1 style={{ margin: "18px 0 6px", fontSize: 28 }}>Painel editorial</h1><p style={{ color: "#666", marginBottom: 24 }}>Acesso restrito à administração do portal.</p>
      <label style={labelStyle}>E-mail<input style={inputStyle} type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label style={labelStyle}>Senha<input style={inputStyle} type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {message && <p role="alert" style={{ color: "#b90018", fontSize: 14 }}>{message}</p>}
      <button disabled={busy} style={{ width: "100%", padding: 13, background: "#b90018", color: "#fff", border: 0, borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>{busy ? "Entrando..." : "Entrar"}</button>
      <p style={{ marginTop: 18, fontSize: 12, color: "#777" }}>O administrador precisa estar previamente cadastrado na tabela admin_users.</p>
    </form>
  </main>;

  return <main style={{ minHeight: "100vh", background: "#f7f7f8" }}>
    <header style={{ background: "#202126", color: "#fff", padding: "18px max(20px, calc((100% - 1120px)/2))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <a href="/" style={{ color: "#e0bd6b", fontWeight: 800, letterSpacing: 1 }}>CNC RORAIMA <span style={{ color: "#fff", fontWeight: 400 }}> / Administração</span></a>
      <button onClick={logout} style={{ background: "transparent", border: "1px solid #777", color: "#fff", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}><LogOut size={16}/> Sair</button>
    </header>
    <div style={{ width: "min(1120px, calc(100% - 32px))", margin: "28px auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: 22 }}>
      <section style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee" }}>
        <h1 style={{ fontSize: 24, margin: "0 0 6px" }}><PlusCircle size={22} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }}/>{editingId ? "Editar notícia" : "Nova notícia"}</h1>
        <p style={{ color: "#777", marginBottom: 22 }}>{editingId ? "Altere os dados e salve as mudanças." : "Crie um rascunho ou publique no portal."}</p>
        <form onSubmit={save}>
          <label style={labelStyle}>Título<input style={inputStyle} minLength={5} maxLength={180} required value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label style={labelStyle}>Resumo<input style={inputStyle} maxLength={500} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></label>
          <label style={labelStyle}>Texto da notícia<textarea style={{ ...inputStyle, minHeight: 180, resize: "vertical" }} minLength={20} required value={content} onChange={e => setContent(e.target.value)} /></label>
          <label style={labelStyle}>URL da imagem (opcional)<input style={inputStyle} type="url" placeholder="Deixe vazio para não exibir imagem" value={image} onChange={e => setImage(e.target.value)} /></label>
          <label style={labelStyle}>Editoria<select style={inputStyle} value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Sem editoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "end", margin: "-4px 0 18px" }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Criar editoria<input style={inputStyle} minLength={2} maxLength={60} placeholder="Digite o nome que você quer" value={categoryName} onChange={e => setCategoryName(e.target.value)} /></label>
            <button type="button" disabled={creatingCategory || categoryName.trim().length < 2} onClick={() => void createCategory()} style={{ padding: "12px 14px", border: "1px solid #b90018", borderRadius: 8, background: "#fff", color: "#b90018", fontWeight: 800, cursor: "pointer", marginBottom: 0 }}>{creatingCategory ? "Criando..." : "Adicionar"}</button>
          </div>
          <label style={labelStyle}>Autor<select style={inputStyle} value={authorId} onChange={e => setAuthorId(e.target.value)}><option value="">Autor não definido</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label style={labelStyle}>Estado<select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}><option value="draft">Salvar como rascunho</option><option value="published">Publicar agora</option></select></label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}/> Destacar na página inicial</label>
          {message && <p role="status" style={{ color: "#b90018", fontSize: 14 }}>{message}</p>}
          <div style={{ display: "flex", gap: 10 }}><button disabled={busy} style={{ flex: 1, padding: 13, border: 0, borderRadius: 8, background: "#b90018", color: "#fff", fontWeight: 800 }}>{busy ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar notícia"}</button>{editingId && <button type="button" onClick={resetForm} style={{ padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#333", display: "flex", gap: 6, alignItems: "center" }}><X size={16}/> Cancelar</button>}</div>
        </form>
      </section>
      <section style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee", alignSelf: "start" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ fontSize: 22, margin: 0 }}><Newspaper size={21} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }}/>Artigos recentes</h2><button aria-label="Atualizar lista" onClick={() => void load()} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: 8 }}><RefreshCw size={16}/></button></div>
        <div style={{ marginTop: 18 }}>{articles.length === 0 ? <p style={{ color: "#777" }}>Nenhuma notícia cadastrada ainda.</p> : articles.map(a => <article key={a.id} style={{ padding: "14px 0", borderBottom: "1px solid #eee" }}><strong>{a.title}</strong><p style={{ color: "#777", fontSize: 12, margin: "6px 0" }}>{a.category_name ?? "Sem editoria"} · {a.status === "published" ? "Publicado" : "Rascunho"}</p><div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>{a.status === "published" && <a href={"/noticias/" + a.slug} target="_blank" rel="noreferrer" style={{ color: "#b90018", fontSize: 13 }}>Ver notícia ↗</a>}<button type="button" onClick={() => editArticle(a)} style={{ border: 0, background: "transparent", color: "#333", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}><Pencil size={14}/> Editar</button><button type="button" disabled={busy} onClick={() => void deleteArticle(a)} style={{ border: 0, background: "transparent", color: "#b90018", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}><Trash2 size={14}/> Excluir</button></div></article>)}</div>
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "2px solid #eee" }}>
          <h2 style={{ fontSize: 20, margin: "0 0 6px" }}>Editorias</h2>
          <p style={{ color: "#777", fontSize: 13, marginBottom: 12 }}>Exclua as editorias que não deseja mais usar. As notícias serão mantidas.</p>
          {categories.length === 0 ? <p style={{ color: "#777", fontSize: 14 }}>Nenhuma editoria criada.</p> : categories.map(category => <div key={category.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <span>{category.name}</span>
            <button type="button" disabled={busy} onClick={() => void deleteCategory(category)} aria-label={`Excluir editoria ${category.name}`} style={{ border: 0, background: "transparent", color: "#b90018", padding: 4, cursor: busy ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}><Trash2 size={14}/> Excluir</button>
          </div>)}
        </div>
      </section>
    </div>
  </main>;
}
