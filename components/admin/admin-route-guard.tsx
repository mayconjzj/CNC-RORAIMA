"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCachedAdminPermissions, loadAdminPermissions, clearAdminPermissionsCache } from "@/lib/admin-permissions-client";

const routePermissions: Array<{ matches: (pathname: string) => boolean; permission: string; area: string }> = [
  { matches: (path) => path === "/admin/noticias" || path.startsWith("/admin/noticias/"), permission: "manage_news", area: "Notícias" },
  { matches: (path) => path === "/admin/editorias" || path.startsWith("/admin/editorias/"), permission: "manage_categories", area: "Editorias" },
  { matches: (path) => path === "/admin/autores" || path.startsWith("/admin/autores/"), permission: "manage_authors", area: "Autores" },
  { matches: (path) => path === "/admin/usuarios" || path.startsWith("/admin/usuarios/"), permission: "manage_users", area: "Usuários" },
];

type AccessState = "not-required" | "checking" | "allowed" | "denied" | "error" | "unauthenticated";

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const route = routePermissions.find((item) => item.matches(pathname));
  const [state, setState] = useState<AccessState>(() => {
    if (!route) return "not-required";
    const cached = getCachedAdminPermissions();
    return cached === null ? "checking" : cached.includes(route.permission) ? "allowed" : "denied";
  });
  const [checkedPath, setCheckedPath] = useState<string | null>(() => getCachedAdminPermissions() !== null || !route ? pathname : null);

  useEffect(() => {
    if (!route) {
      setState("not-required");
      setCheckedPath(pathname);
      return;
    }

    const cached = getCachedAdminPermissions();
    if (cached !== null) {
      setState(cached.includes(route.permission) ? "allowed" : "denied");
      setCheckedPath(pathname);
      return;
    }

    let active = true;
    setState("checking");
    loadAdminPermissions()
      .then((permissions) => {
        if (!active) return;
        setState(permissions.includes(route.permission) ? "allowed" : "denied");
        setCheckedPath(pathname);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && error.message.includes("Sessão administrativa expirada")) {
          clearAdminPermissionsCache();
          setState("unauthenticated");
        } else {
          setState("error");
        }
        setCheckedPath(pathname);
      });

    return () => { active = false; };
  }, [pathname, route?.permission]);

  const cached = getCachedAdminPermissions();
  const visibleState = route && checkedPath !== pathname && cached !== null
    ? (cached.includes(route.permission) ? "allowed" : "denied")
    : state;

  if (route && checkedPath !== pathname && cached === null) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fa", color: "#20252d" }}>
        <p>Verificando suas permissões…</p>
      </main>
    );
  }

  if (!route || visibleState === "not-required" || visibleState === "allowed" || visibleState === "unauthenticated") {
    return <>{children}</>;
  }

  const message = visibleState === "checking"
    ? "Verificando suas permissões…"
    : visibleState === "error"
      ? "Não foi possível verificar suas permissões. Atualize a página e tente novamente."
      : `Sua conta não tem permissão para acessar a área de ${route.area}.`;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fa", color: "#20252d" }}>
      <section style={{ width: "100%", maxWidth: 440, padding: 32, border: "1px solid #e1e5ea", borderRadius: 16, background: "#fff", textAlign: "center" }}>
        <ShieldAlert size={34} aria-hidden="true" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ margin: "0 0 10px", fontSize: 22 }}>{visibleState === "checking" ? "Validando acesso" : visibleState === "error" ? "Falha na verificação" : "Acesso restrito"}</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
        {visibleState === "denied" && <a href="/admin" style={{ display: "inline-block", marginTop: 20, color: "#8a5b00", fontWeight: 600 }}>Voltar ao painel</a>}
      </section>
    </main>
  );
}
