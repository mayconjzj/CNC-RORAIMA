import { NextResponse } from "next/server";
import { getAdminSession, getLegacyAdminSession } from "@/lib/auth";
import { neonAuth } from "@/lib/neon-auth-server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const legacy = await getLegacyAdminSession();
    const { data, error } = await neonAuth.getSession();
    const authUser = data?.user;
    if (error || !authUser || typeof authUser.id !== "string" || typeof authUser.email !== "string") {
      return NextResponse.json({ error: "Entre na conta Neon Auth antes de vincular o usuário." }, { status: 401 });
    }

    if (!legacy || legacy.email.toLowerCase() !== authUser.email.toLowerCase()) {
      if (await getAdminSession()) return NextResponse.json({ ok: true });
      return NextResponse.json({ error: "Não foi possível confirmar a conta administrativa antiga. Entre com a senha anterior para concluir a migração." }, { status: 403 });
    }

    const sql = getDb();
    const rows = await sql`
      UPDATE admin_users
      SET auth_user_id = ${authUser.id}
      WHERE id = ${legacy.id}::uuid
        AND lower(email) = lower(${authUser.email})
        AND (auth_user_id IS NULL OR auth_user_id = ${authUser.id})
      RETURNING id
    `;
    if (!rows.length) {
      const current = await sql`SELECT auth_user_id FROM admin_users WHERE id = ${legacy.id}::uuid LIMIT 1`;
      if (current.length && current[0].auth_user_id === authUser.id) return NextResponse.json({ ok: true });
      return NextResponse.json({ error: "Esta conta já está vinculada a outra identidade. Contate o administrador do sistema." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Falha ao vincular identidade Neon Auth", error);
    return NextResponse.json({ error: "Não foi possível vincular a conta ao Neon Auth." }, { status: 500 });
  }
}
