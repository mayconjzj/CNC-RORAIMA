import "server-only";

type InvitationEmailInput = {
  email: string;
  inviteUrl: string;
  expiresAt: Date;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function sendAdminInvitationEmail({ email, inviteUrl, expiresAt }: InvitationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Configure RESEND_API_KEY e RESEND_FROM_EMAIL na Vercel para enviar convites.");
  }

  const expiration = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Boa_Vista",
  }).format(expiresAt);
  const safeUrl = escapeHtml(inviteUrl);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:auto">
      <p style="font-size:13px;letter-spacing:2px;font-weight:bold;color:#9b1c1c">CNC RORAIMA</p>
      <h1 style="font-size:24px">Você foi convidado para o painel</h1>
      <p>Um administrador convidou este endereço para acessar o painel administrativo do CNC-RORAIMA.</p>
      <p>Para aceitar o convite e criar sua conta, use o botão abaixo. Você definirá sua própria senha.</p>
      <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#9b1c1c;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Aceitar convite e criar senha</a></p>
      <p>Este link expira em ${escapeHtml(expiration)} (horário de Boa Vista) e só pode ser usado uma vez.</p>
      <p style="font-size:12px;color:#666">Se você não esperava este convite, ignore esta mensagem.</p>
    </div>`;
  const text = [
    "CNC-RORAIMA — Convite para o painel administrativo",
    "",
    "Você foi convidado para acessar o painel administrativo do CNC-RORAIMA.",
    "Abra o link abaixo para aceitar o convite e criar sua senha:",
    inviteUrl,
    "",
    `O link expira em ${expiration} (horário de Boa Vista) e só pode ser usado uma vez.`,
    "Se você não esperava este convite, ignore esta mensagem.",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Convite para o painel administrativo — CNC-RORAIMA",
      html,
      text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Falha no provedor de e-mail do convite", response.status, detail.slice(0, 500));
    throw new Error("O provedor de e-mail recusou o envio do convite.");
  }
}
