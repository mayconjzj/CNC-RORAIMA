import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createAdminSession } from "@/lib/auth";
import { isAdminLoginBlocked, recordAdminLoginFailure } from "@/lib/admin-login-rate-limit";

export const runtime = "nodejs";

function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Muitas tentativas de acesso. Aguarde 15 minutos antes de tentar novamente." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  try {
    const rateLimit = await isAdminLoginBlocked(request);
    if (rateLimit.blocked) return rateLimitResponse(rateLimit.retryAfter);

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || password.length > 200) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT id, email, password_hash, display_name FROM admin_users WHERE lower(email) = ${email} LIMIT 1`;
    const user = rows[0] as { id: string; email: string; password_hash: string | null; display_name: string | null } | undefined;
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      await recordAdminLoginFailure(request);
      const updatedLimit = await isAdminLoginBlocked(request);
      if (updatedLimit.blocked) return rateLimitResponse(updatedLimit.retryAfter);
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    await createAdminSession({ id: user.id, email: user.email, displayName: user.display_name });
    await sql`UPDATE admin_users SET last_login_at = NOW() WHERE id = ${user.id}`;
    return NextResponse.json({ ok: true, displayName: user.display_name });
  } catch (error) {
    console.error("Falha no login administrativo", error);
    return NextResponse.json({ error: "Não foi possível entrar. Verifique a configuração do servidor." }, { status: 500 });
  }
}
