"use client";

import { useState, type FormEvent } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import { useRouter } from "next/navigation";

const authClient = createAuthClient();

export default function AcceptInvitationClient({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || email.split("@")[0],
        });
        if (result.error) throw new Error(result.error.message || "Não foi possível criar sua conta Neon Auth.");
        setPassword("");
        setMode("signin");
        setMessage("Conta criada. Confirme o e-mail enviado pelo Neon Auth e depois entre aqui para aceitar o convite.");
        return;
      }

      const signedIn = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signedIn.error) throw new Error(signedIn.error.message || "Não foi possível entrar. Confirme o e-mail e a senha.");

      if (!invitationId) throw new Error("O link não contém um identificador de convite válido.");
      const accepted = await authClient.organization.acceptInvitation({ invitationId });
      if (accepted.error) {
        // If the invitation was already accepted, the server still verifies membership
        // before linking the portal account below.
        const linkAfterExistingMembership = await fetch("/api/admin/invitations/accept", { method: "POST" });
        if (!linkAfterExistingMembership.ok) {
          const details = await linkAfterExistingMembership.json().catch(() => ({})) as { error?: string };
          throw new Error(details.error || accepted.error.message || "Não foi possível aceitar o convite.");
        }
      } else {
        const linked = await fetch("/api/admin/invitations/accept", { method: "POST" });
        const details = await linked.json().catch(() => ({})) as { error?: string; message?: string };
        if (!linked.ok) throw new Error(details.error || "Convite aceito, mas não foi possível vincular a conta ao portal.");
        setMessage(details.message || "Convite aceito.");
      }

      setPassword("");
      router.push("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir o convite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f6f8" }}>
      <section style={{ width: "100%", maxWidth: 440, padding: 32, borderRadius: 18, background: "#fff", boxShadow: "0 12px 40px rgba(20,25,35,.08)" }}>
        <p style={{ color: "#b31d2b", fontSize: 12, fontWeight: 800, letterSpacing: ".12em" }}>CNC RORAIMA</p>
        <h1 style={{ margin: "8px 0 10px", fontSize: 28 }}>Aceitar convite administrativo</h1>
        <p style={{ color: "#5e6570", lineHeight: 1.55 }}>Entre com o e-mail que recebeu o convite. A conta só terá acesso ao painel depois que um administrador conceder permissões.</p>
        {!invitationId && <p role="alert" style={{ color: "#a51d2d" }}>O identificador do convite não foi encontrado no link. Abra novamente o e-mail enviado pelo Neon Auth.</p>}
        <div style={{ display: "flex", gap: 8, margin: "22px 0 18px" }}>
          <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }} disabled={busy} style={{ flex: 1, padding: 10, borderRadius: 9, border: "1px solid #d8dce2", background: mode === "signin" ? "#20242b" : "#fff", color: mode === "signin" ? "#fff" : "#20242b" }}>Já tenho conta</button>
          <button type="button" onClick={() => { setMode("signup"); setError(""); setMessage(""); }} disabled={busy} style={{ flex: 1, padding: 10, borderRadius: 9, border: "1px solid #d8dce2", background: mode === "signup" ? "#20242b" : "#fff", color: mode === "signup" ? "#fff" : "#20242b" }}>Criar conta</button>
        </div>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          {mode === "signup" && <label style={{ display: "grid", gap: 6, fontSize: 14 }}>Nome<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={120} style={fieldStyle} /></label>}
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} style={fieldStyle} /></label>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>Senha<input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} style={fieldStyle} /></label>
          {error && <p role="alert" style={{ color: "#a51d2d", fontSize: 14 }}>{error}</p>}
          {message && <p role="status" style={{ color: "#24623b", fontSize: 14 }}>{message}</p>}
          <button type="submit" disabled={busy || !invitationId} style={{ marginTop: 8, padding: 13, border: 0, borderRadius: 9, background: "#b31d2b", color: "#fff", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>{busy ? "Processando…" : mode === "signin" ? "Entrar e aceitar convite" : "Criar conta"}</button>
        </form>
      </section>
    </main>
  );
}

const fieldStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #d8dce2",
  borderRadius: 8,
  background: "#fff",
  color: "#20242b",
  boxSizing: "border-box" as const,
};
