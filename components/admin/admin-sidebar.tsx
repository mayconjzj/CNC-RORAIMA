"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Newspaper,
  FolderKanban,
  UsersRound,
  Image,
  FileText,
  ChartNoAxesColumn,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import styles from "./admin-sidebar.module.css";
import {
  clearAdminPermissionsCache,
  getCachedAdminPermissions,
  loadAdminPermissions,
} from "@/lib/admin-permissions-client";

type AdminSidebarProps = { onLogout: () => void };

const navigation = [
  { label: "Visão geral", href: "/admin", icon: LayoutDashboard, permission: null },
  { label: "Notícias", href: "/admin/noticias", icon: Newspaper, permission: "manage_news" },
  { label: "Editorias", href: "/admin/editorias", icon: FolderKanban, permission: "manage_categories" },
  { label: "Autores", href: "/admin/autores", icon: UsersRound, permission: "manage_authors" },
  { label: "Usuários", href: "/admin/usuarios", icon: UsersRound, permission: "manage_users" },
] as const;

const comingSoon = [
  { label: "Biblioteca de mídia", icon: Image },
  { label: "Páginas", icon: FileText },
  { label: "Estatísticas", icon: ChartNoAxesColumn },
  { label: "Configurações", icon: Settings },
];

const authClient = createAuthClient();

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(getCachedAdminPermissions() ?? []);

  useEffect(() => {
    let active = true;
    loadAdminPermissions()
      .then((granted) => {
        if (active) setPermissions(granted);
      })
      .catch(() => {
        if (active) setPermissions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar-navigation"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        <span>Menu administrativo</span>
      </button>

      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Fechar menu"
          onClick={closeMobile}
        />
      )}

      <aside
        id="admin-sidebar-navigation"
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
        aria-label="Navegação administrativa"
      >
        <Link href="/" className={styles.brand} onClick={closeMobile}>
          <span className={styles.brandMark}>C<span>N</span>C</span>
          <span className={styles.brandText}>
            <strong>RORAIMA</strong>
            <small>PAINEL EDITORIAL</small>
          </span>
        </Link>

        <div className={styles.sectionLabel}>WORKSPACE</div>
        <nav className={styles.nav}>
          {navigation
            .filter((item) => item.permission === null || permissions.includes(item.permission))
            .map(({ label, href, icon: Icon }) => {
              const isActive =
                href === "/admin"
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMobile}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                  <ChevronRight className={styles.chevron} size={15} />
                </Link>
              );
            })}
        </nav>

        <div className={styles.sectionLabel}>EM DESENVOLVIMENTO</div>
        <div className={styles.futureNav}>
          {comingSoon.map(({ label, icon: Icon }) => (
            <div key={label} className={styles.disabledLink} title="Seção ainda não implementada" aria-disabled="true">
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              <span className={styles.soon}>BREVE</span>
            </div>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">A</span>
            <span className={styles.accountText}>
              <strong>Administrador</strong>
              <small>Acesso autorizado</small>
            </span>
          </div>
          <button
            type="button"
            className={styles.logout}
            onClick={async () => {
              clearAdminPermissionsCache();
              try {
                await authClient.signOut();
              } finally {
                onLogout();
              }
            }}
          >
            <LogOut size={17} />
            <span>Sair do painel</span>
          </button>
        </div>
      </aside>
    </>
  );
}
