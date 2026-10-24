import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Invitations must be sent by Neon Auth itself. Do not add an application
 * email provider here. The Neon Auth organization plugin and its managed
 * invitation email setting must be enabled before this endpoint can create
 * native invitations.
 */
export async function POST() {
  const auth = await requireAdminPermission("manage_users");
  if (auth.response) return auth.response;

  return NextResponse.json(
    {
      error:
        "Os convites por e-mail do Neon Auth ainda não estão habilitados neste projeto. Ative o plugin de organizações e o envio de convites no Neon Auth; nenhum e-mail foi enviado.",
      code: "NEON_AUTH_INVITATIONS_NOT_CONFIGURED",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
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
