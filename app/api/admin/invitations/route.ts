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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_INVITE_FROM;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
    if (!apiKey || !from || !siteUrl) return NextResponse.json({ error: "Configure RESEND_API_KEY, ADMIN_INVITE_FROM e NEXT_PUBLIC_SITE_URL na Vercel." }, { status: 503 });
    const sql = getDb();
    const active = await sql`SELECT id FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
    if (active.length) return NextResponse.json({ error: "Este e-mail já possui uma conta ativa." }, { status: 409 });
    const token = randomBytes(32).toString("base64url");
    const rows = await sql`INSERT INTO admin_invitations(email, token_hash, invited_by, expires_at, status)
      VALUES (${email}, ${hash(token)}, ${auth.session!.id}::uuid, NOW() + INTERVAL '48 hours', 'pending')
      ON CONFLICT (lower(email)) WHERE status = 'pending'
      DO UPDATE SET token_hash = EXCLUDED.token_hash, invited_by = EXCLUDED.invited_by, expires_at = EXCLUDED.expires_at, created_at = NOW()
      RETURNING id`;
    const url = `${siteUrl.replace(/\/$/, "")}/admin/aceitar-convite?token=${encodeURIComponent(token)}`;
    const sent = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: "Convite para o painel CNC Roraima", html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202126"><h1>Você foi convidado</h1><p>Crie sua senha para aceitar o convite ao painel administrativo CNC Roraima. O link expira em 48 horas.</p><p><a href="${url}" style="background:#bd0017;color:#fff;text-decoration:none;padding:13px 18px;border-radius:8px">Aceitar convite e criar senha</a></p><p>Após criar a conta, o administrador precisará conceder suas permissões.</p></div>` }) });
    if (!sent.ok) {
      await sql`UPDATE admin_invitations SET status = 'revoked' WHERE id = ${rows[0].id}`;
      console.error("Falha ao enviar convite por Resend", sent.status, (await sent.text()).slice(0, 300));
      return NextResponse.json({ error: "O convite não foi enviado. Confira o remetente verificado e as configurações do Resend." }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Falha ao convidar usuário", error);
    return NextResponse.json({ error: "Não foi possível enviar o convite." }, { status: 500 });
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
  } catch { return NextResponse.json({ error: "Não foi possível cancelar o convite." }, { status: 500 }); }
}
