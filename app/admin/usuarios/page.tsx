"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBreadcrumb, AdminNotice, AdminPageFooter, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { clearAdminSessionMarker, hasAdminSessionMarker, markAdminSessionActive } from "@/lib/admin-session";
import { ArrowDownUp, Plus, Search, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import styles from "./users.module.css";

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_login_at: string | null;
};

type ApiResponse = { users?: AdminUser[]; user?: AdminUser; error?: string };

function formatDate(value: string | null) {
  if (!value) return "Nunca acessou";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json() as ApiResponse;
      if (response.status === 401) {
        clearAdminSessionMarker();
        setLoggedIn(false);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os usuários.");
      setUsers(data.users ?? []);
      setLoggedIn(true);
      markAdminSessionActive();
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return users;
    return users.filter((user) =>
      [user.display_name ?? "", user.email].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized)),
    );
  }, [query, users]);

  function resetForm() {
    setDisplayName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFormOpen(false);
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password }),
      });
      const data = await response.json() as ApiResponse;
      if (!response.ok) throw new Error(data.error ?? "Não foi possível criar o usuário.");
      if (data.user) setUsers((current) => [data.user!, ...current]);
      resetForm();
      setMessage("Usuário administrativo criado com sucesso.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao criar o usuário.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    clearAdminSessionMarker();
    setLoggedIn(false);
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch { /* A interface continua protegida pelo servidor. */ }
  }

  if (loading && !hasAdminSessionMarker()) {
    return <main className={styles.statePage}><span className={styles.loader} /><p>Verificando acesso administrativo…</p></main>;
  }

  if (!loading && !loggedIn && !error) {
    return <main className={styles.statePage}><ShieldCheck size={34} /><h1>Acesso restrito</h1><p>Entre no painel administrativo para gerenciar usuários.</p><a href="/admin">Ir para o painel</a></main>;
  }

  return (
    <main className={styles.shell}>
      <AdminSidebar onLogout={() => void logout()} />
      <div className={styles.main}>
        <AdminBreadcrumb items={[{ label: "Painel", href: "/admin" }, { label: "Usuários" }]} className={styles.breadcrumb} linkClassName={styles.breadcrumbLink} currentClassName={styles.breadcrumbCurrent} />
        <AdminPageHeader
          className={styles.header}
          contentClassName={styles.headerContent}
          eyebrowClassName={styles.eyebrow}
          titleClassName={styles.title}
          descriptionClassName={styles.subtitle}
          eyebrow="GESTÃO DE ACESSO"
          title="Usuários"
          description="Gerencie as contas que podem acessar o painel administrativo."
          actions={<button className={styles.primaryButton} type="button" onClick={() => { setFormOpen((open) => !open); setError(""); setMessage(""); }}><Plus size={16} />{formOpen ? "Fechar formulário" : "Adicionar usuário"}</button>}
        />

        {error && <AdminNotice type="error" message={error} onDismiss={() => setError("")} className={styles.noticeError} />}
        {message && <AdminNotice type="success" message={message} onDismiss={() => setMessage("")} className={styles.noticeSuccess} />}

        <section className={styles.metrics} aria-label="Resumo de usuários">
          <AdminStatCard className={styles.metricCard} iconClassName={styles.metricIcon} icon={UsersRound} label="Contas cadastradas" value={users.length} note="Acesso administrativo" />
          <AdminStatCard className={styles.metricCard} iconClassName={styles.metricIconGold} icon={UserRound} label="Acessos recentes" value={users.filter((user) => user.last_login_at && Date.now() - new Date(user.last_login_at).getTime() < 30 * 24 * 60 * 60 * 1000).length} note="Login nos últimos 30 dias" />
        </section>

        {formOpen && (
          <section className={styles.formPanel} aria-labelledby="create-user-title">
            <div className={styles.panelHeading}>
              <div><span className={styles.panelEyebrow}>NOVA CONTA</span><h2 id="create-user-title">Adicionar usuário</h2><p>Defina os dados de acesso da pessoa.</p></div>
              <button type="button" className={styles.iconButton} onClick={resetForm} aria-label="Fechar formulário"><X size={18} /></button>
            </div>
            <form onSubmit={createUser} className={styles.form}>
              <label>Nome completo<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required disabled={busy} placeholder="Ex.: Maria da Silva" /></label>
              <label>E-mail de acesso<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" required disabled={busy} placeholder="nome@exemplo.com" /></label>
              <div className={styles.formGrid}>
                <label>Senha inicial<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={200} autoComplete="new-password" required disabled={busy} placeholder="Mínimo de 12 caracteres" /><small>Use pelo menos 12 caracteres.</small></label>
                <label>Confirmar senha<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={200} autoComplete="new-password" required disabled={busy} placeholder="Repita a senha" /></label>
              </div>
              <div className={styles.securityNote}><ShieldCheck size={17} /><p>Por segurança, a senha é armazenada somente como hash. A conta criada terá acesso administrativo ao painel.</p></div>
              <div className={styles.formActions}><button className={styles.secondaryButton} type="button" onClick={resetForm} disabled={busy}>Cancelar</button><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Criando conta…" : "Criar usuário"}</button></div>
            </form>
          </section>
        )}

        <section className={styles.directory} aria-labelledby="users-list-title">
          <div className={styles.directoryHeader}>
            <div><h2 id="users-list-title">Contas administrativas</h2><p>{filteredUsers.length} {filteredUsers.length === 1 ? "usuário encontrado" : "usuários encontrados"}</p></div>
            <div className={styles.searchBox}><Search size={16} /><input aria-label="Buscar usuários" placeholder="Buscar por nome ou e-mail" value={query} onChange={(event) => setQuery(event.target.value)} /><ArrowDownUp size={14} aria-hidden="true" /></div>
          </div>
          {loading ? <div className={styles.emptyState}>Carregando usuários…</div> : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}><UsersRound size={28} /><h3>{query ? "Nenhum resultado" : "Nenhum usuário cadastrado"}</h3><p>{query ? "Tente outro nome ou endereço de e-mail." : "Adicione uma conta para permitir que outra pessoa acesse o painel."}</p>{!query && <button className={styles.secondaryButton} type="button" onClick={() => setFormOpen(true)}>Adicionar primeiro usuário</button>}</div>
          ) : (
            <div className={styles.tableWrap}><table><thead><tr><th>Usuário</th><th>Tipo de acesso</th><th>Último acesso</th><th>Cadastro</th></tr></thead><tbody>
              {filteredUsers.map((user) => <tr key={user.id}><td><div className={styles.userCell}><span className={styles.avatar}>{(user.display_name || user.email).trim().charAt(0).toLocaleUpperCase("pt-BR")}</span><span><strong>{user.display_name || "Sem nome"}</strong><small>{user.email}</small></span></div></td><td><span className={styles.roleBadge}><ShieldCheck size={13} />Administrador</span></td><td>{formatDate(user.last_login_at)}</td><td>{formatDate(user.created_at)}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
        <div className={styles.accessWarning}><ShieldCheck size={18} /><p><strong>Importante:</strong> todas as contas cadastradas nesta versão têm acesso administrativo completo. Permissões por função serão implementadas separadamente, antes de oferecer acessos limitados a editores ou colaboradores.</p></div>
        <AdminPageFooter className={styles.footer} />
      </div>
    </main>
  );
}
