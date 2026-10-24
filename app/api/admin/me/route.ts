import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
 const session = await getAdminSession();
 if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
 try {
  const sql = getDb();
  const rows = await sql`SELECT permission FROM admin_user_permissions WHERE user_id = ${session.id}::uuid ORDER BY permission`;
  return NextResponse.json({ permissions: rows.map((row) => row.permission) });
 } catch (error) {
  console.error("Falha ao consultar permissões do usuário", error);
  return NextResponse.json({ error: "Não foi possível consultar permissões." }, { status: 500 });
 }
}
