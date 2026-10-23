import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Saiba como o portal CNC Roraima trata dados de navegação e informações enviadas por seus visitantes.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return <main className="institutional-page"><article className="institutional-content">
    <span className="institutional-eyebrow">CNC RORAIMA / TRANSPARÊNCIA</span>
    <h1>Política de <span>Privacidade.</span></h1>
    <p className="institutional-lead">Como tratamos informações durante o uso deste portal.</p>
    <div className="institutional-rule" />
    <p className="institutional-updated">Última atualização: 22 de outubro de 2026.</p>
    <section><h2>1. Abrangência</h2><p>Esta política descreve, em termos gerais, o tratamento de informações associado ao acesso ao portal CNC Roraima. O tratamento concreto depende dos recursos habilitados e das configurações técnicas do site.</p></section>
    <section><h2>2. Dados técnicos de navegação</h2><p>Serviços de hospedagem e segurança podem processar dados técnicos necessários para entregar páginas, diagnosticar falhas, proteger o portal e prevenir abusos, como registros de requisições, endereço IP e informações do navegador.</p></section>
    <section><h2>3. Cookies e serviços de terceiros</h2><p>O portal pode utilizar cookies ou tecnologias semelhantes necessários ao funcionamento e, caso sejam habilitados, ferramentas de métricas ou publicidade de terceiros. Esses serviços podem tratar dados conforme suas próprias políticas e as configurações aplicadas ao site.</p></section>
    <section><h2>4. Finalidades e compartilhamento</h2><p>As informações são tratadas quando necessário para operar, manter e proteger o portal, responder a solicitações e cumprir obrigações legais. Dados podem ser processados por fornecedores técnicos que sustentam o serviço ou compartilhados quando exigido por lei. Não afirmamos que todos esses recursos estejam ativos em todos os momentos.</p></section>
    <section><h2>5. Segurança e retenção</h2><p>São adotadas medidas técnicas compatíveis com a operação do portal. Nenhum sistema conectado à internet pode garantir segurança absoluta. Os prazos de retenção dependem da finalidade, das necessidades operacionais e das obrigações legais aplicáveis.</p></section>
    <section><h2>6. Direitos dos titulares</h2><p>Nos termos da legislação aplicável, inclusive a Lei Geral de Proteção de Dados (LGPD), você pode solicitar informações sobre o tratamento de seus dados e exercer os direitos pertinentes. A solicitação deve ser encaminhada pelo canal indicado na página de contato.</p></section>
    <section><h2>7. Atualizações e contato</h2><p>Esta política poderá ser atualizada quando houver mudanças no portal ou nos requisitos legais. Para dúvidas ou solicitações, consulte a página de contato.</p></section>
  </article><footer className="institutional-footer">© {new Date().getFullYear()} CNC Roraima — Cristhian Cruz News.</footer></main>;
}
