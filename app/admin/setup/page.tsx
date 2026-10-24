"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createAuthClient } from "@neondatabase/auth/next";
import styles from "../aceitar-convite/accept-invite.module.css";

const authClient = createAuthClient();

export default function AdminSetupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("A senha precisa ter pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    try {
      let authenticated = false;
      try {
        const signup = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
        });
        authenticated = !signup.error;
      } catch {
        authenticated = false;
      }

      if (!authenticated) {
        try {
          const signin = await authClient.signIn.email({
            email: email.trim().toLowerCase(),
            password,
          });
          if (signin.error) throw new Error("sign-in failed");
          authenticated = true;
        } catch {
          throw new Error("Não foi possível criar ou acessar essa conta Neon Auth. Confira o e-mail e a senha; se a conta já existir, use a senha correspondente.");
        }
      }

      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ displayName: name.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível configurar o administrador.");

      setPassword("");
      setConfirm("");
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao configurar a conta administrativa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}><span>CNC</span> RORAIMA</Link>
        <ShieldCheck size={34} className={styles.icon} />
        {done ? (
          <>
            <h1>Administrador configurado</h1>
            <p>A conta foi vinculada ao portal e recebeu as permissões administrativas. Agora, entre pelo painel.</p>
            <Link href="/admin" className={styles.button}>Ir para o painel</Link>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>CONFIGURAÇÃO INICIAL</p>
            <h1>Configurar administrador</h1>
            <p>Entre com uma conta Neon Auth cujo e-mail já esteja autorizado na tabela administrativa do portal. Por segurança, esta página não concede acesso administrativo a e-mails novos ou não autorizados.</p>
            <form onSubmit={submit} className={styles.form}>
              <label>Nome completo
                <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={event => setName(event.target.value)} disabled={busy} />
              </label>
              <label>E-mail administrativo autorizado
                <input required type="email" maxLength={254} autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
              </label>
              <label>Senha Neon Auth
                <input required type="password" minLength={12} maxLength={200} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
                <small>Use pelo menos 12 caracteres.</small>
              </label>
              <label>Confirmar senha
                <input required type="password" minLength={12} maxLength={200} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} disabled={busy} />
              </label>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.button} type="submit" disabled={busy}>{busy ? "Configurando…" : "Configurar administrador"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
