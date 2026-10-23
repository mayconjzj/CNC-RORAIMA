import Link from "next/link";
import { Brand } from "@/components/site-header";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="wrap site-footer-grid">
          <div className="site-footer-brand">
            <Brand />
            <p>Notícias, informação e os acontecimentos que impactam Roraima. Um espaço dedicado a informar com responsabilidade e contexto.</p>
            <span className="site-footer-location"><span className="site-footer-status" /> Informação de Roraima para Roraima</span>
          </div>
          <div className="site-footer-column">
            <h2>Explore</h2>
            <Link href="/noticias">Todas as notícias</Link>
            <Link href="/#ultimas">Últimas notícias</Link>
            <Link href="/#cnc">A CNC</Link>
            <Link href="/sobre">Sobre o portal</Link>
          </div>
          <div className="site-footer-column">
            <h2>Institucional</h2>
            <Link href="/contato">Fale conosco</Link>
            <Link href="/politica-editorial">Política editorial</Link>
            <Link href="/privacidade">Política de privacidade</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="wrap">
          <span>© {new Date().getFullYear()} CNC Roraima — Cristhian Cruz News. Todos os direitos reservados.</span>
          <span>Jornalismo local com responsabilidade.</span>
        </div>
      </div>
    </footer>
  );
}
