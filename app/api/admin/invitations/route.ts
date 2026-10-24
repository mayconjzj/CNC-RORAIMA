import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";
import { getAdminOrganizationId } from "@/lib/admin-organization";
import { neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";

type InvitationPayload = { id?: string; invitation?: { id?: string } };

/** Sends invitations using Neon Auth's managed email delivery. */
export async function POST(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;

  try {
    const body: unknown = await request.json();
    const email = typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Informe um endereço de e-mail válido." }, { status: 400 });
    }

    const sql = getDb();
    const existingUser = await sql`SELECT id FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`;
    if (existingUser.length) {
      return NextResponse.json({ error: "Esse e-mail já possui uma conta administrativa." }, { status: 409 });
    }

    const organizationId = await getAdminOrganizationId();
    const result = await neonAuth.organization.inviteMember({
      organizationId,
      email,
      role: "admin",
      resend: true,
    });

    if (result.error) {
      console.error("Neon Auth não conseguiu enviar o convite", result.error);
      return NextResponse.json(
        { error: "O Neon Auth não conseguiu enviar o convite. Confirme que o plugin Organization, o envio de convites e a verificação de e-mail estão habilitados." },
        { status: 502 },
      );
    }

    const data = result.data as InvitationPayload | null;
    const invitationId = data?.id ?? data?.invitation?.id ?? null;
    return NextResponse.json(
      { ok: true, invitationId, message: "Convite enviado pelo Neon Auth." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Falha ao enviar convite pelo Neon Auth", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message.includes("organization") || message.includes("Organization")
          ? "Não foi possível preparar a organização de convites do Neon Auth. Verifique se o plugin Organization está ativo."
          : "Não foi possível enviar o convite. Confira a configuração de e-mail do Neon Auth e tente novamente." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;

  try {
    const body: unknown = await request.json();
    const id = typeof body === "object" && body !== null && "invitationId" in body && typeof body.invitationId === "string"
      ? body.invitationId
      : "";
    if (!id) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });

    const organizationId = await getAdminOrganizationId();
    await neonAuth.organization.setActive({ organizationId });
    const result = await neonAuth.organization.cancelInvitation({ invitationId: id });
    if (result.error) {
      console.error("Neon Auth não conseguiu cancelar o convite", result.error);
      return NextResponse.json({ error: "Não foi possível cancelar o convite. Ele pode já ter sido aceito ou expirado." }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Falha ao cancelar convite do Neon Auth", error);
    return NextResponse.json({ error: "Não foi possível cancelar o convite." }, { status: 500 });
  }
}
