"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { clearAdminSessionMarker, hasAdminSessionMarker, markAdminSessionActive } from "@/lib/admin-session";
import { AdminNotice } from "@/components/admin/admin-ui";
import { ArrowUpRight, FilePlus2, FolderKanban, Newspaper, RefreshCw, UsersRound, CheckCircle2, FilePenLine } from "lucide-react";
import styles from "./dashboard.module.css";

type Article = {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  category_name: string | null;
  author_name?: string | null;
  updated_at: string | null;
  published_at: string | null;
};

type DashboardData = {
  recent: Article[];
  total: number;
  published: number;
  drafts: number;
  categories: number;
  authors: number;
};

const emptyData: DashboardData = { recent: [], total: 0, published: 0, drafts: 0, categories: 0, authors: 0 };

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData>(emptyData);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const responses = await Promise.all([
        fetch("/api/admin/articles?limit=5&offset=0&sort=updated_desc", { cache: "no-store" }),
        fetch("/api/admin/articles?status=published&limit=1&offset=0", { cache: "no-store" }),
        fetch("/api/admin/articles?status=draft&limit=1&offset=0", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }),
        fetch("/api/admin/authors", { cache: "no-store" }),
      ]);
      if (responses.some((response) => response.status === 401)) {
        clearAdminSessionMarker();
        setLoggedIn(false);
        return;
      }
      const parsed = await Promise.all(responses.map((response) => response.json()));
      const failed = responses.find((response) => !response.ok && response.status !== 403);
      if (failed) throw new Error("Não foi possível carregar os dados do painel. Tente atualizar.");
      const [recentData, publishedData, draftData, categoryData, authorData] = parsed;
      const noPermissions = responses.every((response) => response.status === 403);
      const recent: Article[] = recentData.articles ?? [];
      setData({
        recent,
        total: Number(recentData.total ?? 0),
        published: Number(publishedData.total ?? 0),
        drafts: Number(draftData.total ?? 0),
        categories: (categoryData.categories ?? []).length,
        authors: (authorData.authors ?? []).length,
      });
      setLoggedIn(true);
      markAdminSessionActive();
      setError(noPermissions ? "Sua conta ainda não tem permissões concedidas. Peça ao administrador do portal para liberar as áreas necessárias." : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar o painel geral.");
    } finally {
      setRefreshing(false);
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Não foi possível entrar.");
        return;
      }
      setPassword("");
      window.sessionStorage.setItem("cnc-admin-session", "active");
      await loadDashboard();
    } catch {
      setMessage("Falha de conexão ao entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    clearAdminSessionMarker();
    setLoggedIn(false);
    setData(emptyData);
    await fetch("/api/admin/logout", { method: "POST" });
  }

  const hasSessionMarker = hasAdminSessionMarker();

  if (checkingSession && !hasSessionMarker) {
    return <main className={styles.authLoading}><span className={styles.loader} /><p>Verificando sessão administrativa…</p></main>;
  }


  if (!loggedIn && !hasSessionMarker) {
    return (
      <main className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={login}>
          <Link href="/" className={styles.loginBrand}><span>CNC</span> RORAIMA</Link>
          <p className={styles.eyebrow}>ÁREA RESTRITA</p>
          <h1>Painel administrativo</h1>
          <p className={styles.loginIntro}>Entre para administrar o portal de notícias da CNC Roraima.</p>
          <label htmlFor="admin-email">E-mail</label>
          <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="admin-password">Senha</label>
          <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {message && <p className={styles.loginMessage} role="alert">{message}</p>}
          <button type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar no painel"}</button>
        </form>
      </main>
    );
  }

  const cards = [
    { label: "Total de notícias", value: data.total, note: "Publicações e rascunhos", icon: Newspaper, tone: "red" },
    { label: "Publicadas", value: data.published, note: "Visíveis no portal", icon: CheckCircle2, tone: "gold" },
    { label: "Rascunhos", value: data.drafts, note: "Ainda não publicadas", icon: FilePenLine, tone: "dark" },
    { label: "Editorias", value: data.categories, note: "Temas cadastrados", icon: FolderKanban, tone: "gold" },
    { label: "Autores", value: data.authors, note: "Perfis editoriais", icon: UsersRound, tone: "dark" },
  ];

  return (
    <main className={styles.shell}>
      <AdminSidebar onLogout={() => void logout()} />
      <div className={styles.main}>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>CENTRAL DE CONTROLE</p><h1>Painel geral</h1><p className={styles.subtitle}>Acompanhe o conteúdo e acesse rapidamente as ferramentas editoriais.</p></div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => void loadDashboard()} disabled={refreshing}><RefreshCw size={15} className={refreshing ? styles.spin : ""} /> Atualizar</button>
            <Link className={styles.primaryButton} href="/admin/noticias/editor"><FilePlus2 size={17} /> Nova notícia</Link>
          </div>
        </header>

        {error && <AdminNotice type="error" message={error} onDismiss={() => setError("")} className={styles.errorNotice} />}

        <section className={styles.metrics} aria-label="Indicadores editoriais" aria-busy={checkingSession || refreshing}>
          {checkingSession || refreshing
            ? [0, 1, 2, 3, 4].map((item) => <article className={styles.metricCard} key={item}><span className={styles.skeletonIcon} /><div className={styles.skeletonMetricText}><span className={styles.skeletonLine} /><span className={styles.skeletonNumber} /><span className={styles.skeletonLine} /></div></article>)
            : cards.map(({ label, value, note, icon: Icon, tone }) => (
              <article className={styles.metricCard} key={label}>
                <span className={styles[`metricIcon_${tone}`]}><Icon size={19} /></span>
                <div><span className={styles.metricLabel}>{label}</span><strong>{value}</strong><small>{note}</small></div>
              </article>
            ))}
        </section>

        <section className={styles.quickSection}>
          <div className={styles.sectionHeading}><div><h2>Acesso rápido</h2><p>Atalhos para as tarefas mais comuns.</p></div></div>
          <div className={styles.quickGrid}>
            <Link href="/admin/noticias" className={styles.quickCard}><span className={styles.quickIcon}><Newspaper size={20}/></span><span><strong>Gerenciar notícias</strong><small>Buscar, filtrar, editar e excluir publicações.</small></span><ArrowUpRight size={17}/></Link>
            <Link href="/admin/editorias" className={styles.quickCard}><span className={styles.quickIconGold}><FolderKanban size={20}/></span><span><strong>Organizar editorias</strong><small>Manter os assuntos do portal organizados.</small></span><ArrowUpRight size={17}/></Link>
            <Link href="/admin/autores" className={styles.quickCard}><span className={styles.quickIconDark}><UsersRound size={20}/></span><span><strong>Gerenciar autores</strong><small>Editar perfis, biografias e fotografias.</small></span><ArrowUpRight size={17}/></Link>
          </div>
        </section>

        <section className={styles.recentSection}>
          <div className={styles.sectionHeading}><div><h2>Atualizadas recentemente</h2><p>As últimas notícias modificadas no sistema.</p></div><Link href="/admin/noticias">Ver todas <ArrowUpRight size={15}/></Link></div>
          {checkingSession || refreshing
            ? <div className={styles.recentList} aria-busy="true">{[0, 1, 2, 3, 4].map((item) => <div className={styles.skeletonRecentRow} key={item}><span className={styles.skeletonStatus} /><div className={styles.skeletonMetricText}><span className={styles.skeletonLine} /><span className={styles.skeletonLine} /></div><span className={styles.skeletonDate} /></div>)}</div>
            : data.recent.length === 0 ? <div className={styles.emptyState}><Newspaper size={25}/><h3>Nenhuma notícia cadastrada</h3><p>Crie a primeira publicação para começar a preencher o portal.</p><Link href="/admin/noticias/editor" className={styles.primaryButton}><FilePlus2 size={16}/> Criar notícia</Link></div> :
              <div className={styles.recentList}>{data.recent.map((article) => <article className={styles.recentRow} key={article.id}>
                <span className={article.status === "published" ? styles.statusPublished : styles.statusDraft}>{article.status === "published" ? "Publicada" : "Rascunho"}</span>
                <div className={styles.recentInfo}><strong>{article.title}</strong><small>{article.category_name ?? "Sem editoria"} · {article.author_name ?? "Autor não definido"}</small></div>
                <span className={styles.updatedDate}>{article.updated_at ? new Date(article.updated_at).toLocaleDateString("pt-BR") : "—"}</span>
                <Link href={`/admin/noticias/editor?edit=${encodeURIComponent(article.id)}`} aria-label={`Editar ${article.title}`}><ArrowUpRight size={17}/></Link>
              </article>)}</div>}
        </section>
        <footer className={styles.footer}>CNC RORAIMA <span>·</span> PAINEL ADMINISTRATIVO</footer>
      </div>
    </main>
  );
}
