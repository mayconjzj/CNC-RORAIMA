import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";
import { sendAdminInvitationEmail } from "@/lib/admin-invitation-email";

export const runtime = "nodejs";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
    if (!siteUrl) return NextResponse.json({ error: "Configure NEXT_PUBLIC_SITE_URL na Vercel." }, { status: 503 });

    const sql = getDb();
    const active = await sql`SELECT id FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
    if (active.length) return NextResponse.json({ error: "Este e-mail já possui uma conta ativa." }, { status: 409 });

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    const invitations = await sql`INSERT INTO admin_invitations(email, token_hash, invited_by, expires_at, status)
      VALUES (${email}, ${tokenHash}, ${auth.session!.id}::uuid, NOW() + INTERVAL '48 hours', 'pending')
      ON CONFLICT (lower(email)) WHERE status = 'pending'
      DO UPDATE SET token_hash = EXCLUDED.token_hash, invited_by = EXCLUDED.invited_by, expires_at = EXCLUDED.expires_at, created_at = NOW()
      RETURNING expires_at`;

    const inviteUrl = `${siteUrl.replace(/\\/$/, "")}/admin/aceitar-convite?token=${encodeURIComponent(token)}`;
    try {
      await sendAdminInvitationEmail({
        email,
        inviteUrl,
        expiresAt: new Date(String(invitations[0].expires_at)),
      });
    } catch (error) {
      await sql`UPDATE admin_invitations SET status = 'revoked' WHERE token_hash = ${tokenHash} AND status = 'pending'`;
      console.error("Falha ao enviar convite administrativo", error);
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("Configure RESEND_API_KEY")) {
        return NextResponse.json({
          error: "O convite não foi enviado. Configure RESEND_API_KEY e RESEND_FROM_EMAIL nas variáveis de ambiente da Vercel.",
        }, { status: 503 });
      }
      return NextResponse.json({ error: "O e-mail não foi enviado. Verifique a configuração do provedor e tente novamente." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, email }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar convite", error);
    return NextResponse.json({ error: "Não foi possível criar ou enviar o convite." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const id = typeof body.invitationId === "string" ? body.invitationId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`UPDATE admin_invitations SET status = 'revoked' WHERE id = ${id}::uuid AND status = 'pending' RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível cancelar o convite." }, { status: 500 });
  }
}
