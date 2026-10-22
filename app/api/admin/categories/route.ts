import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const [categories, authors] = await Promise.all([
      sql`SELECT id, name FROM categories ORDER BY name`,
      sql`SELECT id, name FROM authors ORDER BY name`,
    ]);
    return NextResponse.json({ categories, authors });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar editorias e autores." }, { status: 500 });
  }
}
