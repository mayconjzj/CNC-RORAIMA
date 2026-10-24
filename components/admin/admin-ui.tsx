"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check, ChevronLeft, X } from "lucide-react";

type BreadcrumbItem = { label: string; href?: string };
type AdminBreadcrumbProps = {
  items: BreadcrumbItem[];
  className: string;
  linkClassName?: string;
  currentClassName?: string;
};

export function AdminBreadcrumb({ items, className, linkClassName, currentClassName }: AdminBreadcrumbProps) {
  return (
    <nav className={className} aria-label="Trilha de navegação">
      {items.map((item, index) => (
        <span key={item.href ?? item.label} className="admin-breadcrumb-item">
          {index > 0 && <ChevronLeft size={14} aria-hidden="true" />}
          {item.href ? (
            <Link className={linkClassName} href={item.href}>{item.label}</Link>
          ) : (
            <span className={currentClassName} aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

type AdminNoticeProps = {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
  className: string;
};

export function AdminNotice({ type, message, onDismiss, className }: AdminNoticeProps) {
  return (
    <div className={className} role={type === "error" ? "alert" : "status"}>
      {type === "success" && <Check size={17} aria-hidden="true" />}
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Fechar aviso">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

type AdminPageFooterProps = {
  className: string;
  linkClassName?: string;
  href?: string;
  linkLabel?: string;
  children?: ReactNode;
};

export function AdminPageFooter({
  className,
  linkClassName,
  href = "/admin",
  linkLabel = "Voltar ao painel",
  children,
}: AdminPageFooterProps) {
  return (
    <footer className={className}>
      <span>C N C <b>RORAIMA</b> · PAINEL EDITORIAL</span>
      {children}
      <Link className={linkClassName} href={href}>{linkLabel} <ChevronLeft size={14} aria-hidden="true" /></Link>
    </footer>
  );
}
