"use client";

import { useEffect, useState } from "react";

type Comment = { id: string; author_name: string; body: string; created_at: string };

export default function ArticleComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
    const data = await response.json();
    setComments(data.comments ?? []);
  }
  useEffect(() => { void refresh(); }, [slug]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name, email, body }) });
    const data = await response.json(); setBusy(false); setMessage(data.message || data.error || "Não foi possível enviar.");
    if (response.ok) { setName(""); setEmail(""); setBody(""); }
  }

  const field: React.CSSProperties = { width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: 12, font: "inherit", marginTop: 6 };
  const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 14 };
  return <section style={{ marginTop: 56, borderTop: "1px solid #eee", paddingTop: 30 }}>
    <h2 style={{ fontSize: 26 }}>Comentários</h2>
    <p style={{ color: "#777" }}>Os comentários são publicados após moderação da redação.</p>
    <form onSubmit={submit} style={{ background: "#f7f7f8", padding: 20, borderRadius: 12, margin: "22px 0" }}>
      <label style={label}>Seu nome<input style={field} required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>
      <label style={label}>E-mail (opcional)<input style={field} type="email" maxLength={200} value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label style={label}>Comentário<textarea style={{ ...field, minHeight: 110, resize: "vertical" }} required minLength={5} maxLength={2000} value={body} onChange={e => setBody(e.target.value)} /></label>
      {message && <p role="status" style={{ fontSize: 14, color: "#b90018" }}>{message}</p>}
      <button disabled={busy} style={{ background: "#b90018", color: "#fff", border: 0, borderRadius: 8, padding: "12px 18px", fontWeight: 800 }}>{busy ? "Enviando..." : "Enviar comentário"}</button>
    </form>
    {comments.length ? comments.map(comment => <article key={comment.id} style={{ padding: "16px 0", borderBottom: "1px solid #eee" }}><strong>{comment.author_name}</strong><p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{comment.body}</p><small style={{ color: "#777" }}>{new Date(comment.created_at).toLocaleDateString("pt-BR")}</small></article>) : <p style={{ color: "#777" }}>Ainda não há comentários aprovados.</p>}
  </section>;
}
