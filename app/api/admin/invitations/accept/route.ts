import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAdminOrganizationId } from "@/lib/admin-organization";
import { neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";

type NeonUser = { id?: string; email?: string; name?: string | null };
type NeonMember = { userId?: string; email?: string; user?: NeonUser };

export async function POST() {
  const sessionResult = await neonAuth.getSession();
  const user = sessionResult.data?.user as NeonUser | undefined;
  if (sessionResult.error || !user || typeof user.id !== "string" || typeof user.email !== "string") {
    return NextResponse.json({ error: "Entre na conta Neon Auth que recebeu o convite." }, { status: 401 });
  }

  try {
    const organizationId = await getAdminOrganizationId();
    const membershipResult = await neonAuth.organization.listMembers({
      query: {
        organizationId,
        limit: 100,
        filterField: "userId",
        filterOperator: "eq",
        filterValue: user.id,
      },
    });
    if (membershipResult.error) {
      console.error("Falha ao verificar associação ao convite", membershipResult.error);
      return NextResponse.json({ error: "Não foi possível confirmar o convite no Neon Auth." }, { status: 502 });
    }

    const raw = membershipResult.data as unknown;
    const members = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && "members" in raw && Array.isArray(raw.members)
        ? raw.members
        : [];
    const isMember = members.some((item) => {
      if (!item || typeof item !== "object") return false;
      const member = item as NeonMember;
      const memberId = member.userId ?? member.user?.id;
      const memberEmail = member.email ?? member.user?.email;
      return memberId === user.id && typeof memberEmail === "string" && memberEmail.toLowerCase() === user.email!.toLowerCase();
    });
    if (!isMember) {
      return NextResponse.json({ error: "O convite ainda não foi aceito por esta conta. Abra o link recebido por e-mail e tente novamente." }, { status: 403 });
    }

    const sql = getDb();
    const existing = await sql`SELECT id FROM admin_users WHERE auth_user_id = ${user.id} OR lower(email) = lower(${user.email}) LIMIT 1`;
    if (existing.length) {
      const current = await sql`SELECT id, auth_user_id FROM admin_users WHERE id = ${existing[0].id}::uuid LIMIT 1`;
      if (current[0]?.auth_user_id && current[0].auth_user_id !== user.id) {
        return NextResponse.json({ error: "Este e-mail já está vinculado a outra identidade." }, { status: 409 });
      }
      await sql`UPDATE admin_users SET auth_user_id = ${user.id}, password_hash = NULL WHERE id = ${existing[0].id}::uuid`;
      return NextResponse.json({ ok: true, message: "A conta administrativa foi vinculada. O administrador responsável precisa conceder as permissões." });
    }

    const displayName = typeof user.name === "string" && user.name.trim()
      ? user.name.trim().slice(0, 120)
      : user.email.split("@")[0].slice(0, 120);
    await sql`INSERT INTO admin_users (email, display_name, auth_user_id, password_hash)
      VALUES (${user.email.toLowerCase()}, ${displayName}, ${user.id}, NULL)`;
    return NextResponse.json(
      { ok: true, message: "Conta criada. Um administrador precisa conceder as permissões antes do acesso ao painel." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Falha ao vincular conta convidada", error);
    return NextResponse.json({ error: "Não foi possível concluir o cadastro administrativo." }, { status: 500 });
  }
}
