"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="cnc-site-footer">
      <div className="cnc-site-footer-inner">
        <Link href="/" className="cnc-site-footer-brand" aria-label="CNC Roraima — página inicial">
          CNC <span>RORAIMA</span>
        </Link>
        <p>Informação de credibilidade para Roraima.</p>
        <nav aria-label="Links institucionais">
          <Link href="/">Início</Link>
          <Link href="/noticias">Todas as notícias</Link>
        </nav>
        <small>© {new Date().getFullYear()} CNC Roraima. Todos os direitos reservados.</small>
      </div>
      <style>{`
        .cnc-site-footer{margin-top:64px;background:#202126;color:#fff;padding:32px 24px 24px}
        .cnc-site-footer-inner{max-width:1180px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:18px 28px}
        .cnc-site-footer-brand{font-size:19px;font-weight:850;letter-spacing:.04em;color:#fff;text-decoration:none}
        .cnc-site-footer-brand span{color:#d7ad54;font-size:12px;letter-spacing:.12em;margin-left:5px}
        .cnc-site-footer p{margin:0;color:#d0d0d3;font-size:13px;flex:1}
        .cnc-site-footer nav{display:flex;flex-wrap:wrap;gap:10px 18px}
        .cnc-site-footer nav a{color:#eee;font-size:12px;text-decoration:none}
        .cnc-site-footer nav a:hover{color:#e2bd69}
        .cnc-site-footer small{width:100%;border-top:1px solid #414147;padding-top:18px;color:#aaa;font-size:11px}
        @media(max-width:600px){.cnc-site-footer{padding:28px 18px 22px}.cnc-site-footer-inner{align-items:flex-start;gap:14px}.cnc-site-footer p{flex-basis:100%}.cnc-site-footer nav{gap:12px 15px}}
      `}</style>
    </footer>
  );
}
