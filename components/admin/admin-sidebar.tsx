"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard, Newspaper, FolderKanban, UsersRound, Image,
  FileText, ChartNoAxesColumn, Settings, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import styles from "./admin-sidebar.module.css";

type AdminSidebarProps = { onLogout: () => void };

const navigation = [
  { label: "Visão geral", href: "#admin-overview", icon: LayoutDashboard },
  { label: "Notícias", href: "#admin-news", icon: Newspaper },
  { label: "Editorias", href: "/admin/editorias", icon: FolderKanban },
  { label: "Autores", href: "/admin/autores", icon: UsersRound },
];

const comingSoon = [
  { label: "Biblioteca de mídia", icon: Image },
  { label: "Páginas", icon: FileText },
  { label: "Estatísticas", icon: ChartNoAxesColumn },
  { label: "Usuários e permissões", icon: UsersRound },
  { label: "Configurações", icon: Settings },
];

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        <span>Menu administrativo</span>
      </button>
      {mobileOpen && <button type="button" className={styles.backdrop} aria-label="Fechar menu" onClick={closeMobile} />}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`} aria-label="Navegação administrativa">
        <Link href="/" className={styles.brand} onClick={closeMobile}>
          <span className={styles.brandMark}>C<span>N</span>C</span>
          <span className={styles.brandText}>
            <strong>RORAIMA</strong>
            <small>PAINEL EDITORIAL</small>
          </span>
        </Link>

        <div className={styles.sectionLabel}>WORKSPACE</div>
        <nav className={styles.nav}>
          {navigation.map(({ label, href, icon: Icon }) => (
            <a key={href} href={href} className={styles.navLink} onClick={closeMobile}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              <ChevronRight className={styles.chevron} size={15} />
            </a>
          ))}
        </nav>

        <div className={styles.sectionLabel}>EM DESENVOLVIMENTO</div>
        <div className={styles.futureNav}>
          {comingSoon.map(({ label, icon: Icon }) => (
            <div key={label} className={styles.disabledLink} title="Seção ainda não implementada">
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              <span className={styles.soon}>BREVE</span>
            </div>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.account}>
            <span className={styles.avatar}>A</span>
            <span className={styles.accountText}>
              <strong>Administrador</strong>
              <small>Acesso autorizado</small>
            </span>
          </div>
          <button type="button" className={styles.logout} onClick={onLogout}>
            <LogOut size={17} />
            <span>Sair do painel</span>
          </button>
        </div>
      </aside>
    </>
  );
}
