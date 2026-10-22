"use client";

import { useEffect, useState } from "react";
import { LogOut, Newspaper, PlusCircle, RefreshCw } from "lucide-react";

type Article = { id: string; title: string; slug: string; status: string; category_name: string | null; updated_at: string };
type Option = { id: string; name: string };

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Option[]>([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
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

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, excerpt, content, image, categoryId, authorId, status, isFeatured: featured }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Falha ao salvar."); return; }
    setMessage("Artigo salvo com sucesso."); setTitle(""); setExcerpt(""); setContent(""); setImage(""); setFeatured(false); await load();
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
        <h1 style={{ fontSize: 24, margin: "0 0 6px" }}><PlusCircle size={22} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }}/>Nova notícia</h1>
        <p style={{ color: "#777", marginBottom: 22 }}>Crie um rascunho ou publique no portal.</p>
        <form onSubmit={save}>
          <label style={labelStyle}>Título<input style={inputStyle} minLength={5} maxLength={180} required value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label style={labelStyle}>Resumo<input style={inputStyle} maxLength={500} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></label>
          <label style={labelStyle}>Texto da notícia<textarea style={{ ...inputStyle, minHeight: 180, resize: "vertical" }} minLength={20} required value={content} onChange={e => setContent(e.target.value)} /></label>
          <label style={labelStyle}>URL da imagem<input style={inputStyle} type="url" placeholder="https://..." value={image} onChange={e => setImage(e.target.value)} /></label>
          <label style={labelStyle}>Editoria<select style={inputStyle} value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Sem editoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label style={labelStyle}>Autor<select style={inputStyle} value={authorId} onChange={e => setAuthorId(e.target.value)}><option value="">Autor não definido</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label style={labelStyle}>Estado<select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}><option value="draft">Salvar como rascunho</option><option value="published">Publicar agora</option></select></label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}/> Destacar na página inicial</label>
          {message && <p role="status" style={{ color: "#b90018", fontSize: 14 }}>{message}</p>}
          <button disabled={busy} style={{ width: "100%", padding: 13, border: 0, borderRadius: 8, background: "#b90018", color: "#fff", fontWeight: 800 }}>{busy ? "Salvando..." : "Salvar notícia"}</button>
        </form>
      </section>
      <section style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #eee", alignSelf: "start" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ fontSize: 22, margin: 0 }}><Newspaper size={21} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }}/>Artigos recentes</h2><button aria-label="Atualizar lista" onClick={() => void load()} style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: 8 }}><RefreshCw size={16}/></button></div>
        <div style={{ marginTop: 18 }}>{articles.length === 0 ? <p style={{ color: "#777" }}>Nenhuma notícia cadastrada ainda.</p> : articles.map(a => <article key={a.id} style={{ padding: "14px 0", borderBottom: "1px solid #eee" }}><strong>{a.title}</strong><p style={{ color: "#777", fontSize: 12, margin: "6px 0" }}>{a.category_name ?? "Sem editoria"} · {a.status === "published" ? "Publicado" : "Rascunho"}</p><a href={a.status === "published" ? "/noticias/" + a.slug : "#"} style={{ color: "#b90018", fontSize: 13 }}>{a.status === "published" ? "Ver notícia ↗" : "Ainda não publicado"}</a></article>)}</div>
      </section>
    </div>
  </main>;
}
