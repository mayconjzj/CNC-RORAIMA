"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  clearAdminPermissionsCache,
  getCachedAdminPermissions,
  loadAdminPermissions,
} from "@/lib/admin-permissions-client";
import { clearAdminSessionMarker } from "@/lib/admin-session";

const routePermissions = [
  { matches: (path: string) => path === "/admin/noticias" || path.startsWith("/admin/noticias/"), permission: "manage_news", area: "Notícias" },
  { matches: (path: string) => path === "/admin/editorias" || path.startsWith("/admin/editorias/"), permission: "manage_categories", area: "Editorias" },
  { matches: (path: string) => path === "/admin/autores" || path.startsWith("/admin/autores/"), permission: "manage_authors", area: "Autores" },
  { matches: (path: string) => path === "/admin/usuarios" || path.startsWith("/admin/usuarios/"), permission: "manage_users", area: "Usuários" },
] as const;

type AccessState = "not-required" | "checking" | "allowed" | "denied" | "error" | "unauthenticated";

function LoadingAccess({ message }: { message: string }) {
  return (
    <main
      role="status"
      aria-live="polite"
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fa", color: "#20252d" }}
    >
      <p>{message}</p>
    </main>
  );
}

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const route = routePermissions.find((item) => item.matches(pathname));
  const permission = route?.permission;
  const [state, setState] = useState<AccessState>(() => {
    if (!route) return "not-required";
    const cached = getCachedAdminPermissions();
    return cached === null ? "checking" : cached.includes(route.permission) ? "allowed" : "denied";
  });
  const [checkedPath, setCheckedPath] = useState<string | null>(() =>
    getCachedAdminPermissions() !== null || !route ? pathname : null,
  );

  useEffect(() => {
    if (!permission) {
      setState("not-required");
      setCheckedPath(pathname);
      return;
    }

    const cached = getCachedAdminPermissions();
    if (cached !== null) {
      setState(cached.includes(permission) ? "allowed" : "denied");
      setCheckedPath(pathname);
      return;
    }

    let active = true;
    setState("checking");

    loadAdminPermissions()
      .then((permissions) => {
        if (!active) return;
        setState(permissions.includes(permission) ? "allowed" : "denied");
        setCheckedPath(pathname);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && error.message.includes("Sessão administrativa expirada")) {
          clearAdminPermissionsCache();
          clearAdminSessionMarker();
          setState("unauthenticated");
        } else {
          setState("error");
        }
        setCheckedPath(pathname);
      });

    return () => {
      active = false;
    };
  }, [pathname, permission]);

  useEffect(() => {
    if (state === "unauthenticated") {
      clearAdminSessionMarker();
      router.replace("/admin");
    }
  }, [router, state]);

  const cached = getCachedAdminPermissions();
  const visibleState =
    route && checkedPath !== pathname && cached !== null
      ? cached.includes(route.permission)
        ? "allowed"
        : "denied"
      : state;

  if (route && checkedPath !== pathname && cached === null) {
    return <LoadingAccess message="Verificando suas permissões…" />;
  }

  if (!route || visibleState === "not-required" || visibleState === "allowed") {
    return <>{children}</>;
  }

  if (visibleState === "unauthenticated") {
    return <LoadingAccess message="Sessão expirada. Redirecionando para o login…" />;
  }

  if (visibleState === "checking") {
    return <LoadingAccess message="Verificando suas permissões…" />;
  }

  if (visibleState === "error") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fa", color: "#20252d" }}>
        <section style={{ width: "100%", maxWidth: 440, padding: 32, border: "1px solid #e1e5ea", borderRadius: 16, background: "#fff", textAlign: "center" }}>
          <ShieldAlert size={34} aria-hidden="true" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ margin: "0 0 10px", fontSize: 22 }}>Falha na verificação</h1>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Não foi possível verificar suas permissões. Atualize a página e tente novamente.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f8fa", color: "#20252d" }}>
      <section style={{ width: "100%", maxWidth: 440, padding: 32, border: "1px solid #e1e5ea", borderRadius: 16, background: "#fff", textAlign: "center" }}>
        <ShieldAlert size={34} aria-hidden="true" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ margin: "0 0 10px", fontSize: 22 }}>Acesso restrito</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>Sua conta não tem permissão para acessar a área de {route?.area}.</p>
        <Link href="/admin" style={{ display: "inline-block", marginTop: 20, color: "#8a5b00", fontWeight: 600 }}>Voltar ao painel</Link>
      </section>
    </main>
  );
}
