"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBreadcrumb, AdminNotice, AdminPageHeader } from "@/components/admin/admin-ui";
import { Check, ExternalLink, FilePlus2, Filter, LoaderCircle, Newspaper, Pencil, RefreshCw, Search, Trash2, X } from "lucide-react";
import styles from "./noticias.module.css";

type Article = {
  id: string; title: string; slug: string; excerpt: string | null; featured_image_url: string | null;
  status: string; is_featured: boolean; category_id: string | null; author_id: string | null;
  category_name: string | null; author_name?: string | null; published_at: string | null; updated_at: string | null;
};
type Option = { id: string; name: string };
const PAGE_SIZE = 20;

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Option[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [author, setAuthor] = useState("all");
  const [sort, setSort] = useState("updated_desc");
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ q: query.trim(), status, category, author, sort, limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      const [articleResponse, categoryResponse, authorResponse] = await Promise.all([
        fetch(`/api/admin/articles?${params}`, { cache: "no-store", signal }),
        fetch("/api/admin/categories", { cache: "no-store", signal }),
        fetch("/api/admin/authors", { cache: "no-store", signal }),
      ]);
      if (articleResponse.status === 401 || categoryResponse.status === 401 || authorResponse.status === 401) { setAuthorized(false); window.sessionStorage.removeItem("cnc-admin-session"); return; }
      const [articleData, categoryData, authorData] = await Promise.all([articleResponse.json(), categoryResponse.json(), authorResponse.json()]);
      if (!articleResponse.ok) throw new Error(articleData.error ?? "Não foi possível carregar as notícias.");
      if (!categoryResponse.ok) throw new Error(categoryData.error ?? "Não foi possível carregar as editorias.");
      if (!authorResponse.ok) throw new Error(authorData.error ?? "Não foi possível carregar os autores.");
      setArticles(articleData.articles ?? []); setTotal(Number(articleData.total ?? 0));
      setCategories(categoryData.categories ?? []); setAuthors(authorData.authors ?? []); setAuthorized(true); window.sessionStorage.setItem("cnc-admin-session", "active");
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : "Falha ao carregar o painel de notícias.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [query, status, category, author, sort, page, refresh]);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const stats = useMemo(() => ({
    published: articles.filter((item) => item.status === "published").length,
    drafts: articles.filter((item) => item.status !== "published").length,
    featured: articles.filter((item) => item.is_featured).length,
  }), [articles]);

  function changeFilter(setter: (value: string) => void, value: string) { setter(value); setPage(0); }
  function clearFilters() { setQuery(""); setStatus("all"); setCategory("all"); setAuthor("all"); setSort("updated_desc"); setPage(0); }
  async function remove(article: Article) {
    if (!window.confirm(`Excluir definitivamente a notícia “${article.title}”? Esta ação não pode ser desfeita.`)) return;
    setBusyId(article.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir a notícia.");
      setNotice("Notícia excluída."); setRefresh((value) => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao excluir a notícia."); }
    finally { setBusyId(null); }
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthorized(false); window.sessionStorage.removeItem("cnc-admin-session"); }

  if (loading && typeof window !== "undefined" && window.sessionStorage.getItem("cnc-admin-session") !== "active") return <main className={styles.unauthorized}><Newspaper size={34}/><h1>Verificando acesso</h1><p>Aguarde enquanto validamos sua sessão administrativa.</p></main>;
  if (!loading && !authorized) return <main className={styles.unauthorized}><Newspaper size={34}/><h1>Acesso restrito</h1><p>Entre no painel administrativo para gerenciar as notícias.</p><a href="/admin">Ir para o painel</a></main>;

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  return <main className={styles.shell}>
    <AdminSidebar onLogout={() => void logout()} />
    <div className={styles.main}>
      <AdminBreadcrumb className={styles.breadcrumb} linkClassName={styles.breadcrumbLink} currentClassName={styles.breadcrumbCurrent} items={[{ label: "Painel administrativo", href: "/admin" }, { label: "Notícias" }]} />
      <AdminPageHeader className={styles.pageHeader} contentClassName={styles.pageHeaderContent} eyebrowClassName={styles.eyebrow} titleClassName={styles.pageTitle} descriptionClassName={styles.pageDescription} eyebrow={<><span /> GESTÃO DE CONTEÚDO</>} title="Notícias" description="Pesquise, filtre, edite e acompanhe as publicações do portal CNC Roraima." actions={<Link className={styles.primaryButton} href="/admin/noticias/editor"><FilePlus2 size={17}/> Adicionar notícia</Link>} />
      <section className={styles.stats} aria-label="Resumo da página atual">
        <div className={styles.statCard}><span className={styles.statIcon}><Newspaper size={19}/></span><div><span>Resultados nesta página</span><strong>{loading ? "—" : articles.length}</strong><small>{total} notícias no filtro atual</small></div></div>
        <div className={styles.statCard}><span className={styles.statIconGold}><Check size={19}/></span><div><span>Publicadas nesta página</span><strong>{loading ? "—" : stats.published}</strong><small>Visíveis ao público</small></div></div>
        <div className={styles.statCard}><span className={styles.statIconDark}><Pencil size={19}/></span><div><span>Rascunhos nesta página</span><strong>{loading ? "—" : stats.drafts}</strong><small>Conteúdo não publicado</small></div></div>
      </section>
      {notice && <AdminNotice type="success" message={notice} onDismiss={() => setNotice("")} className={styles.successNotice} />}
      {error && <AdminNotice type="error" message={error} onDismiss={() => setError("")} className={styles.errorNotice} />}
      <section className={styles.directory}>
        <div className={styles.directoryHeader}><div><h2>Diretório de notícias</h2><p>Use os filtros para localizar publicações com precisão.</p></div><button className={styles.secondaryButton} onClick={()=>setRefresh(v=>v+1)} disabled={loading}><RefreshCw size={15} className={loading?styles.spin:""}/> Atualizar</button></div>
        <div className={styles.filters}>
          <label className={styles.searchBox}><Search size={17}/><input aria-label="Buscar notícias" type="search" placeholder="Buscar título, conteúdo, editoria ou autor…" value={query} onChange={e=>changeFilter(setQuery,e.target.value)}/>{query&&<button type="button" aria-label="Limpar busca" onClick={()=>changeFilter(setQuery,"")}><X size={15}/></button>}</label>
          <label className={styles.filterField}><span>Status</span><select value={status} onChange={e=>changeFilter(setStatus,e.target.value)}><option value="all">Todos os status</option><option value="published">Publicadas</option><option value="draft">Rascunhos</option></select></label>
          <label className={styles.filterField}><span>Editoria</span><select value={category} onChange={e=>changeFilter(setCategory,e.target.value)}><option value="all">Todas as editorias</option><option value="none">Sem editoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className={styles.filterField}><span>Autor</span><select value={author} onChange={e=>changeFilter(setAuthor,e.target.value)}><option value="all">Todos os autores</option><option value="none">Sem autor</option>{authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className={styles.filterField}><span>Ordenação</span><select value={sort} onChange={e=>changeFilter(setSort,e.target.value)}><option value="updated_desc">Última edição</option><option value="published_desc">Publicação recente</option><option value="published_asc">Publicação antiga</option><option value="title_asc">Título A–Z</option><option value="title_desc">Título Z–A</option></select></label>
        </div>
        <div className={styles.listMeta}><span><Filter size={14}/> {loading?"Atualizando resultados…":`Exibindo ${start}–${end} de ${total} notícias`}</span><button onClick={clearFilters} className={styles.clearButton} disabled={!query&&status==="all"&&category==="all"&&author==="all"&&sort==="updated_desc"}>Limpar filtros</button></div>
        {loading && articles.length===0 ? <div className={styles.loadingRows}>{[0,1,2,3].map(i=><div className={styles.skeletonRow} key={i}><span className={styles.skeletonThumb}/><div className={styles.skeletonText}><span className={styles.skeletonLine} style={{width:"65%"}}/><span className={styles.skeletonLine} style={{width:"88%"}}/><span className={styles.skeletonLine} style={{width:"35%"}}/></div></div>)}</div>
        : articles.length===0 ? <div className={styles.emptyState}><span><Newspaper size={25}/></span><h3>Nenhuma notícia encontrada</h3><p>{query||status!=="all"||category!=="all"||author!=="all"?"Altere ou limpe os filtros para ver outros resultados.":"Cadastre a primeira notícia para começar a publicar no portal."}</p><Link className={styles.primaryButton} href="/admin/noticias/editor"><FilePlus2 size={16}/> Adicionar notícia</Link></div>
        : <div className={styles.articleList}>{articles.map(article=><article className={styles.articleRow} key={article.id}>
          <div className={styles.articleImage}>{article.featured_image_url?<img src={article.featured_image_url} alt="" loading="lazy"/>:<Newspaper size={22}/>}</div>
          <div className={styles.articleInfo}><div className={styles.articleTags}><span className={article.status==="published"?styles.published:styles.draft}><i/>{article.status==="published"?"Publicada":"Rascunho"}</span>{article.is_featured&&<span className={styles.featured}>Destaque</span>}<span>{article.category_name??"Sem editoria"}</span></div><h3>{article.title}</h3><p>{article.excerpt||"Sem resumo cadastrado."}</p><small>{article.author_name??authors.find(a=>a.id===article.author_id)?.name??"Autor não definido"} · Atualizada em {article.updated_at?new Date(article.updated_at).toLocaleDateString("pt-BR"):"—"}</small></div>
          <div className={styles.actions}>{article.status==="published"&&<a href={`/noticias/${article.slug}`} target="_blank" rel="noreferrer" aria-label={`Ver ${article.title}`} title="Ver notícia"><ExternalLink size={16}/></a>}<Link href={`/admin/noticias/editor?edit=${encodeURIComponent(article.id)}`} aria-label={`Editar ${article.title}`} title="Editar notícia"><Pencil size={16}/></Link><button disabled={busyId===article.id} onClick={()=>void remove(article)} aria-label={`Excluir ${article.title}`} title="Excluir notícia">{busyId===article.id?<LoaderCircle size={16} className={styles.spin}/>:<Trash2 size={16}/>}</button></div>
        </article>)}</div>}
        <div className={styles.pagination}><span>Página {Math.min(page+1,Math.max(1,Math.ceil(total/PAGE_SIZE)))} de {Math.max(1,Math.ceil(total/PAGE_SIZE))}</span><div><button className={styles.secondaryButton} disabled={page===0||loading} onClick={()=>setPage(p=>Math.max(0,p-1))}>Anterior</button><button className={styles.secondaryButton} disabled={(page+1)*PAGE_SIZE>=total||loading} onClick={()=>setPage(p=>p+1)}>Próxima</button></div></div>
      </section>
      <footer className={styles.pageFooter}><span>C N C <b>RORAIMA</b> · PAINEL EDITORIAL</span><Link href="/admin">Voltar ao painel <ExternalLink size={13}/></Link></footer>
    </div>
  </main>;
}
