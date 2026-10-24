import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
    if (!siteUrl) return NextResponse.json({ error: "Configure NEXT_PUBLIC_SITE_URL na Vercel." }, { status: 503 });
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !fromEmail) return NextResponse.json({ error: "Configure RESEND_API_KEY e RESEND_FROM_EMAIL na Vercel para enviar convites por e-mail." }, { status: 503 });

    const sql = getDb();
    const active = await sql`SELECT id FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
    if (active.length) return NextResponse.json({ error: "Este e-mail já possui uma conta ativa." }, { status: 409 });

    const token = randomBytes(32).toString("base64url");
    await sql`INSERT INTO admin_invitations(email, token_hash, invited_by, expires_at, status)
      VALUES (${email}, ${hash(token)}, ${auth.session!.id}::uuid, NOW() + INTERVAL '48 hours', 'pending')
      ON CONFLICT (lower(email)) WHERE status = 'pending'
      DO UPDATE SET token_hash = EXCLUDED.token_hash, invited_by = EXCLUDED.invited_by, expires_at = EXCLUDED.expires_at, created_at = NOW()`;
    const inviteUrl = `${siteUrl.replace(/\/$/, "")}/admin/aceitar-convite?token=${encodeURIComponent(token)}`;
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Convite para o painel administrativo do CNC-RORAIMA",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#202020"><h2>Você foi convidado para o CNC-RORAIMA</h2><p>Foi enviado um convite para acessar o painel administrativo do portal.</p><p>O link é válido por 48 horas e só pode ser usado com este endereço de e-mail.</p><p style="margin:28px 0"><a href="${inviteUrl}" style="background:#a51d24;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Aceitar convite</a></p><p>Se você não esperava este convite, ignore esta mensagem.</p></div>`
      }),
    });
    if (!mail.ok) {
      await sql`UPDATE admin_invitations SET status = 'revoked' WHERE token_hash = ${hash(token)} AND status = 'pending'`;
      console.error("Falha no envio do convite Resend", mail.status, await mail.text());
      return NextResponse.json({ error: "O convite não foi enviado. Verifique o domínio e as configurações do Resend." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, email }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar convite", error);
    return NextResponse.json({ error: "Não foi possível criar o convite." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const id = typeof body.invitationId === "string" ? body.invitationId : "";
    if (!id) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
    const sql = getDb();
    const rows = await sql`UPDATE admin_invitations SET status = 'revoked' WHERE id = ${id}::uuid AND status = 'pending' RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível cancelar o convite." }, { status: 500 });
  }
}
