import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com a equipe da CNC Roraima para sugestões, correções e assuntos institucionais.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const placeholderEmail = "contato@cnc-roraima.com.br";
  return <main className="institutional-page"><article className="institutional-content">
    <span className="institutional-eyebrow">CNC RORAIMA / FALE CONOSCO</span>
    <h1>Entre em <span>contato.</span></h1>
    <p className="institutional-lead">Sugestões de pauta, correções e assuntos institucionais.</p>
    <div className="institutional-rule" />
    <section><h2>Redação e sugestões</h2><p>Tem uma sugestão de pauta, informação de interesse público ou deseja apontar uma possível correção? Entre em contato pelo canal abaixo.</p>
      {email ? <p className="institutional-contact"><strong>E-mail:</strong> <a href={`mailto:${email}`}>{email}</a></p> : <div className="institutional-notice"><strong>E-mail provisório</strong><p><strong>{placeholderEmail}</strong></p><p>Este é apenas um endereço de exemplo e ainda não está confirmado para receber mensagens. Quando o e-mail oficial estiver pronto, configure a variável <code>NEXT_PUBLIC_CONTACT_EMAIL</code> na hospedagem.</p></div>}
    </section>
    <section><h2>Pedido de correção</h2><p>Ao solicitar uma correção, informe o título ou endereço da notícia e descreva objetivamente o trecho que precisa ser verificado. A equipe poderá solicitar informações adicionais para avaliar o pedido.</p></section>
    <section><h2>Outros assuntos</h2><p>Para questões de privacidade ou uso de dados, consulte a <Link href="/privacidade">Política de Privacidade</Link>.</p></section>
  </article></main>;
}
