"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./setup.module.css";

type SetupResponse = {
  message?: string;
  error?: string;
};

export default function AdminSetupPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, displayName, password }),
      });
      const data = await response.json().catch(() => ({})) as SetupResponse;

      if (!response.ok) {
        setMessage(data.error || "Não foi possível configurar o administrador.");
        return;
      }

      setMessage(data.message || "Administrador criado com sucesso.");
      setDone(true);
      setToken("");
      setPassword("");
    } catch {
      setMessage("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <form className={styles.card} onSubmit={submit}>
        <Link href="/" className={styles.brand}>CNC RORAIMA</Link>
        <h1 className={styles.title}>Configuração inicial</h1>
        <p className={styles.description}>
          Crie a conta privada do administrador. Este formulário só funciona
          enquanto não existir nenhum usuário administrador.
        </p>

        {done ? (
          <>
            <p className={styles.success} role="status">{message}</p>
            <Link href="/admin" className={styles.secondaryLink}>Ir para o login</Link>
          </>
        ) : (
          <>
            <label className={styles.field}>
              Token de configuração
              <input
                className={styles.input}
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                autoComplete="off"
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              Nome de exibição
              <input
                className={styles.input}
                required
                maxLength={100}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              E-mail administrativo
              <input
                className={styles.input}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              Senha (mínimo 12 caracteres)
              <input
                className={styles.input}
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={busy}
              />
            </label>
            {message && <p className={styles.message} role="alert">{message}</p>}
            <button className={styles.primaryButton} type="submit" disabled={busy}>
              {busy ? "Configurando..." : "Criar administrador"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
