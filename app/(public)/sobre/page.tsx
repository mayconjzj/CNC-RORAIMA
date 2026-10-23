import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre a CNC Roraima",
  description: "Conheça a proposta editorial e os princípios do portal CNC Roraima — Cristhian Cruz News.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return <main className="institutional-page"><article className="institutional-content">
    <span className="institutional-eyebrow">CNC RORAIMA / INSTITUCIONAL</span>
    <h1>Sobre <span>a CNC Roraima.</span></h1>
    <p className="institutional-lead">Informação local, contexto e compromisso com os fatos.</p>
    <div className="institutional-rule" />
    <section><h2>Quem somos</h2><p>A CNC Roraima — Cristhian Cruz News — é um portal digital dedicado à cobertura de notícias, acontecimentos e assuntos de interesse público em Roraima.</p><p>Nosso objetivo é facilitar o acesso à informação, apresentar os fatos com clareza e ajudar o público a compreender os acontecimentos que impactam a comunidade.</p></section>
    <section><h2>Nosso compromisso</h2><p>Buscamos publicar conteúdo claro, responsável e contextualizado. Informações devem ser verificadas antes da publicação, e eventuais erros relevantes devem ser corrigidos com transparência.</p><ul><li>Clareza na apresentação dos fatos.</li><li>Responsabilidade no tratamento de informações.</li><li>Respeito às pessoas e à diversidade de opiniões.</li><li>Distinção entre informação, análise e opinião.</li></ul></section>
    <section><h2>Correções e sugestões</h2><p>Leitores que identificarem possível erro ou desejarem sugerir uma pauta podem consultar nossa página de contato. Ao enviar uma solicitação, indique a notícia relacionada e, sempre que possível, a informação que precisa ser verificada.</p><Link className="institutional-button" href="/contato">Acessar contato</Link></section>
  </article><footer className="institutional-footer">© {new Date().getFullYear()} CNC Roraima — Cristhian Cruz News.</footer></main>;
}
