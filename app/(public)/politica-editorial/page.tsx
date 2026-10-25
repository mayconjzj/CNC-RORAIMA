import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política Editorial",
  description: "Conheça os princípios de apuração, correção e transparência editorial da CNC Roraima.",
  alternates: { canonical: "/politica-editorial" },
};

export default function PoliticaEditorialPage() {
  return <main className="institutional-page"><article className="institutional-content">
    <span className="institutional-eyebrow">CNC RORAIMA / REDAÇÃO</span>
    <h1>Princípios <span>editoriais.</span></h1>
    <p className="institutional-lead">Critérios para produzir e apresentar informação com responsabilidade.</p>
    <div className="institutional-rule" />
    <section><h2>Apuração e verificação</h2><p>Informações devem ser avaliadas antes da publicação, com preferência por documentos, registros e fontes identificáveis. Alegações relevantes devem ser atribuídas às suas fontes, e conteúdos ainda não confirmados precisam ser tratados com cautela.</p></section>
    <section><h2>Independência e conflitos de interesse</h2><p>Interesses pessoais, comerciais ou institucionais não devem ser apresentados como fatos jornalísticos. Situações de conflito de interesse devem ser identificadas e tratadas com transparência.</p></section>
    <section><h2>Correções e atualizações</h2><p>Quando um erro relevante for identificado, a matéria deve ser revista e corrigida de forma proporcional. Atualizações que alterem significativamente o entendimento da notícia devem ser esclarecidas ao leitor sempre que possível. Solicitações podem ser enviadas pela página de <Link href="/contato">contato</Link>.</p></section>
    <section><h2>Opinião, publicidade e conteúdo patrocinado</h2><p>Conteúdo opinativo, publicidade e material patrocinado devem ser distinguidos do conteúdo informativo quando esses formatos forem publicados. A apresentação não deve induzir o leitor a confundir anúncio com reportagem.</p></section>
    <section><h2>Respeito e responsabilidade</h2><p>O conteúdo deve evitar exposição desnecessária de dados pessoais, linguagem discriminatória e afirmações não sustentadas por evidências. O interesse público deve ser considerado na abordagem de temas sensíveis.</p></section>
    <section><h2>Transparência</h2><p>O portal busca identificar a origem das informações e corrigir imprecisões quando detectadas. Estes princípios podem ser atualizados conforme os processos editoriais evoluam.</p></section>
  </article></main>;
}
