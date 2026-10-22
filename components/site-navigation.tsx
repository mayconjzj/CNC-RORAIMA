"use client";

import { usePathname } from "next/navigation";

type Category = { id: string; slug: string; name: string };

export function SiteNavigation({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  return (
    <nav className="nav-bar" aria-label="Navegação principal">
      <div className="wrap nav-inner">
        <a
          className={pathname === "/" ? "nav-home is-active" : "nav-home"}
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          INÍCIO
        </a>
        {categories.map((category) => {
          const href = `/editorias/${category.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <a
              key={category.id}
              href={href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {category.name.toLocaleUpperCase("pt-BR")}
            </a>
          );
        })}
        <a href="/#cnc">CNC</a>
        <span className="nav-live"><span /> RORAIMA AGORA</span>
      </div>
    </nav>
  );
}
