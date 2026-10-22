"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, email, displayName, password }) });
    const data = await response.json(); setBusy(false); setMessage(data.message || data.error || "Erro inesperado.");
    if (response.ok) { setDone(true); setToken(""); setPassword(""); }
  }

  const input: React.CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: 12, border: "1px solid #ddd", borderRadius: 8, font: "inherit" };
  const label: React.CSSProperties = { display: "block", marginBottom: 16, fontSize: 13, fontWeight: 700 };
  return <main style={{ minHeight: "100vh", background: "#f5f5f6", display: "grid", placeItems: "center", padding: 20 }}>
    <form onSubmit={submit} style={{ width: "min(460px, 100%)", background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 12px 40px #00000012" }}>
      <a href="/" style={{ color: "#b90018", fontWeight: 800, letterSpacing: 2 }}>CNC RORAIMA</a>
      <h1 style={{ margin: "18px 0 8px", fontSize: 27 }}>Configuração inicial</h1>
      <p style={{ color: "#666", lineHeight: 1.6 }}>Crie a conta privada do administrador. Este formulário só funciona enquanto não existir nenhum usuário administrador.</p>
      {done ? <><p role="status" style={{ color: "#187448" }}>{message}</p><a href="/admin" style={{ display: "inline-block", marginTop: 12, background: "#b90018", color: "#fff", borderRadius: 8, padding: "12px 18px" }}>Ir para o login</a></> : <>
        <label style={label}>Token de configuração<input style={input} required value={token} onChange={e => setToken(e.target.value)} autoComplete="off" /></label>
        <label style={label}>Nome de exibição<input style={input} required maxLength={100} value={displayName} onChange={e => setDisplayName(e.target.value)} /></label>
        <label style={label}>E-mail administrativo<input style={input} type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
        <label style={label}>Senha (mínimo 12 caracteres)<input style={input} type="password" required minLength={12} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></label>
        {message && <p role="alert" style={{ color: "#b90018", fontSize: 14 }}>{message}</p>}
        <button disabled={busy} style={{ width: "100%", background: "#b90018", color: "#fff", border: 0, borderRadius: 8, padding: 13, fontWeight: 800 }}>{busy ? "Configurando..." : "Criar administrador"}</button>
      </>}
    </form>
  </main>;
}
