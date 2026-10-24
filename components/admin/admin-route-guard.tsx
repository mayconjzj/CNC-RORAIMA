"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

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
  const [state, setState] = useState<AccessState>("not-required");

  useEffect(() => {
    if (!route) {
      setState("not-required");
      return;
    }

    let active = true;
    setState("checking");
    fetch("/api/admin/me", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          setState("unauthenticated");
          return;
        }
        if (!response.ok) {
          setState("error");
          return;
        }
        const data = await response.json() as { permissions?: string[] };
        if (active) setState((data.permissions ?? []).includes(route.permission) ? "allowed" : "denied");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => { active = false; };
  }, [pathname, route?.permission]);

  if (!route || state === "not-required" || state === "allowed" || state === "unauthenticated") {
    return <>{children}</>;
  }

  const message = state === "checking"
    ? "Verificando suas permissões…"
    : state === "error"
      ? "Não foi possível verificar suas permissões. Atualize a página e tente novamente."
      : `Sua conta não tem permissão para acessar a área de ${route.area}.`;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fa", color: "#20252d" }}>
      <section style={{ width: "100%", maxWidth: 440, padding: 32, border: "1px solid #e1e5ea", borderRadius: 16, background: "#fff", textAlign: "center" }}>
        <ShieldAlert size={34} aria-hidden="true" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ margin: "0 0 10px", fontSize: 22 }}>{state === "checking" ? "Validando acesso" : state === "error" ? "Falha na verificação" : "Acesso restrito"}</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
        {state === "denied" && <a href="/admin" style={{ display: "inline-block", marginTop: 20, color: "#8a5b00", fontWeight: 600 }}>Voltar ao painel</a>}
      </section>
    </main>
  );
}
