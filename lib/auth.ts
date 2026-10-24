import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { neonAuth } from "@/lib/neon-auth-server";

const COOKIE_NAME = "cnc_admin_session";
const SESSION_TTL = 60 * 60 * 8;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Configure SESSION_SECRET com pelo menos 32 caracteres.");
  return new TextEncoder().encode(secret);
}

// Legacy session is retained only to let the existing administrator securely link
// the old account to its new Neon Auth identity during the migration.
export async function createAdminSession(user: { id: string; email: string; displayName: string | null }) {
  const token = await new SignJWT({ email: user.email, name: user.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secretKey());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: SESSION_TTL,
  });
}

export async function getLegacyAdminSession() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.email !== "string") return null;
    const sql = getDb();
    const rows = await sql`SELECT id, email, display_name FROM admin_users WHERE id = ${payload.sub}::uuid AND lower(email) = lower(${payload.email}) LIMIT 1`;
    if (!rows.length) return null;
    return {
      id: rows[0].id as string,
      email: rows[0].email as string,
      name: (rows[0].display_name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  try {
    const { data, error } = await neonAuth.getSession();
    const user = data?.user;
    if (error || !user || typeof user.id !== "string" || typeof user.email !== "string") return null;
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, display_name
      FROM admin_users
      WHERE auth_user_id = ${user.id} AND lower(email) = lower(${user.email})
      LIMIT 1
    `;
    if (!rows.length) return null;
    return {
      id: rows[0].id as string,
      email: rows[0].email as string,
      name: (rows[0].display_name as string | null) ?? user.name ?? null,
      authUserId: user.id,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
