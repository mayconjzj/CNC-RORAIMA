"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBreadcrumb, AdminNotice, AdminPageFooter, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { clearAdminSessionMarker, hasAdminSessionMarker, markAdminSessionActive } from "@/lib/admin-session";
import { ArrowDownUp, Plus, Search, ShieldCheck, UserRound, UsersRound, X, Settings2 } from "lucide-react";
import styles from "./users.module.css";

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_login_at: string | null;
  permissions: string[];
  status: "active" | "pending";
  invitation_id?: string;
  invitation_expires_at?: string;
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
  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
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

  function resetForm() { setEmail(""); setFormOpen(false); }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const response = await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json() as ApiResponse;
      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar o convite.");
      resetForm(); setMessage(`Convite enviado por e-mail para ${data.email ?? email.trim()}.`); await loadUsers();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao enviar convite."); }
    finally { setBusy(false); }
  }

  async function savePermissions() {
    if (!selectedUser?.id) return; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selectedUser.id, permissions }) });
      const data = await response.json() as ApiResponse;
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar as permissões.");
      setSelectedUser(null); setMessage("Permissões atualizadas."); await loadUsers();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao salvar permissões."); }
    finally { setBusy(false); }
  }

  async function cancelInvite(user: AdminUser) {
    if (!user.invitation_id) return; setBusy(true);
    try {
      const response = await fetch("/api/admin/invitations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId: user.invitation_id }) });
      const data = await response.json() as ApiResponse;
      if (!response.ok) throw new Error(data.error ?? "Não foi possível cancelar o convite.");
      setMessage("Convite cancelado."); await loadUsers();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao cancelar convite."); }
    finally { setBusy(false); }
  }

  async function removeUser(user: AdminUser) {
    if (!user.id || user.status !== "active") return;
    const confirmed = window.confirm(
      `Remover o acesso administrativo de ${user.display_name || user.email}? A pessoa perderá o acesso ao painel e essa ação não pode ser desfeita por aqui.`,
    );
    if (!confirmed) return;

    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json() as ApiResponse;
      if (!response.ok) throw new Error(data.error ?? "Não foi possível remover o acesso.");
      setMessage(`Acesso administrativo de ${user.email} removido.`);
      if (selectedUser?.id === user.id) setSelectedUser(null);
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao remover o acesso.");
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
          description="Envie convites por e-mail e controle as áreas que cada pessoa pode administrar."
          actions={<button className={styles.primaryButton} type="button" onClick={() => { setFormOpen((open) => !open); setError(""); setMessage(""); }}><Plus size={16} />{formOpen ? "Fechar formulário" : "Convidar usuário"}</button>}
        />

        {error && <AdminNotice type="error" message={error} onDismiss={() => setError("")} className={styles.noticeError} />}
        {message && <AdminNotice type="success" message={message} onDismiss={() => setMessage("")} className={styles.noticeSuccess} />}
        <section className={styles.metrics} aria-label="Resumo de usuários">
          <AdminStatCard className={styles.metricCard} iconClassName={styles.metricIcon} icon={UsersRound} label="Contas ativas" value={users.filter((user) => user.status === "active").length} note="Usuários cadastrados" />
          <AdminStatCard className={styles.metricCard} iconClassName={styles.metricIconGold} icon={UserRound} label="Convites pendentes" value={users.filter((user) => user.status === "pending").length} note="Aguardando criação de senha" />
        </section>

        {formOpen && (
          <section className={styles.formPanel} aria-labelledby="create-user-title">
            <div className={styles.panelHeading}><div><span className={styles.panelEyebrow}>NOVO CONVITE</span><h2 id="create-user-title">Convidar usuário</h2><p>O convidado receberá um e-mail com um link para criar a própria senha. O convite expira em 48 horas.</p></div>
              <button type="button" className={styles.iconButton} onClick={resetForm} aria-label="Fechar formulário"><X size={18} /></button></div>
            <form onSubmit={createUser} className={styles.form}>
              <label>E-mail do convidado<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" required disabled={busy} placeholder="nome@exemplo.com" /></label>
              <div className={styles.securityNote}><ShieldCheck size={17} /><p>A conta só será criada quando o convidado aceitar o convite e definir a própria senha. Nenhuma permissão é concedida automaticamente.</p></div>
              <div className={styles.formActions}><button className={styles.secondaryButton} type="button" onClick={resetForm} disabled={busy}>Cancelar</button><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Gerando link…" : "Enviar convite"}</button></div>
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
            <div className={styles.tableWrap}><table><thead><tr><th>Usuário</th><th>Status</th><th>Permissões</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>
              {filteredUsers.map((user) => <tr key={user.id ?? user.invitation_id ?? user.email}><td><div className={styles.userCell}><span className={styles.avatar}>{(user.display_name || user.email).trim().charAt(0).toLocaleUpperCase("pt-BR")}</span><span><strong>{user.display_name || user.email}</strong><small>{user.email}</small></span></div></td><td><span className={user.status === "active" ? styles.roleBadge : styles.pendingBadge}>{user.status === "active" ? "Ativo" : "Convite pendente"}</span></td><td>{user.status === "pending" ? "Nenhuma" : user.permissions.length === 0 ? "Sem permissões" : user.permissions.length === 5 ? "Acesso completo" : user.permissions.length + " área(s)"}</td><td>{user.status === "pending" ? "Expira em " + formatDate(user.invitation_expires_at ?? null) : formatDate(user.last_login_at)}</td><td>{user.status === "active" ? <div className={styles.formActions}><button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => { setSelectedUser(user); setPermissions(user.permissions); }}><Settings2 size={14}/> Gerenciar</button><button className={styles.secondaryButton} type="button" disabled={busy || user.id === undefined} onClick={() => void removeUser(user)} aria-label={`Remover acesso de ${user.email}`}>Remover acesso</button></div> : <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => void cancelInvite(user)}>Cancelar convite</button>}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
        <div className={styles.accessWarning}><ShieldCheck size={18} /><p><strong>Controle de acesso:</strong> cada permissão libera somente a área correspondente. As alterações são verificadas também no servidor; ocultar uma opção na interface não é a única barreira de segurança.</p></div>
        <AdminPageFooter className={styles.footer} />

        {selectedUser && <div className={styles.modalBackdrop}><section className={styles.permissionsModal} role="dialog" aria-modal="true" aria-labelledby="permissions-title"><div className={styles.panelHeading}><div><span className={styles.panelEyebrow}>CONTROLE DE ACESSO</span><h2 id="permissions-title">Gerenciar usuário</h2><p>{selectedUser.email}</p></div><button className={styles.iconButton} type="button" onClick={() => setSelectedUser(null)} aria-label="Fechar"><X size={18}/></button></div><div className={styles.permissionList}>{[{key:"manage_news",label:"Notícias",description:"Criar, editar, publicar e excluir notícias."},{key:"manage_categories",label:"Editorias",description:"Gerenciar editorias."},{key:"manage_authors",label:"Autores",description:"Gerenciar perfis de autores."},{key:"manage_media",label:"Biblioteca de mídia",description:"Enviar e gerenciar arquivos."},{key:"manage_users",label:"Usuários e permissões",description:"Convidar pessoas e conceder acessos."}].map(p => <label key={p.key} className={styles.permissionOption}><input type="checkbox" checked={permissions.includes(p.key)} onChange={e => setPermissions(current => e.target.checked ? [...current,p.key] : current.filter(v => v !== p.key))}/><span><strong>{p.label}</strong><small>{p.description}</small></span></label>)}</div><div className={styles.securityNote}><ShieldCheck size={17}/><p>Sem permissões, a pessoa não poderá acessar as áreas administrativas protegidas.</p></div><div className={styles.formActions}><button className={styles.secondaryButton} type="button" onClick={() => setSelectedUser(null)}>Cancelar</button><button className={styles.primaryButton} type="button" disabled={busy} onClick={() => void savePermissions()}>{busy ? "Salvando…" : "Salvar permissões"}</button></div></section></div>}
      </div>
    </main>
  );
}
