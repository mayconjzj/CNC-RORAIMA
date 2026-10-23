"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

type Category = { id: string; slug: string; name: string };

export function SiteNavigation({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  return (
    <nav className="nav-bar" aria-label="Navegação principal">
      <div className="wrap nav-inner">
        <Link
          className={pathname === "/" ? "nav-home is-active" : "nav-home"}
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          INÍCIO
        </Link>
        {categories.map((category) => {
          const href = `/editorias/${category.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={category.id}
              href={href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {category.name.toLocaleUpperCase("pt-BR")}
            </Link>
          );
        })}
        <Link href="/#cnc">CNC</Link>
        <Link href="/sobre" className={pathname === "/sobre" ? "is-active" : undefined}>SOBRE</Link>
        <Link href="/contato" className={pathname === "/contato" ? "is-active" : undefined}>CONTATO</Link>
        <span className="nav-live"><span /> RORAIMA AGORA</span>
      </div>
    </nav>
  );
}
