import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;

let tableReady: Promise<void> | null = null;

async function ensureTable() {
  if (!tableReady) {
    tableReady = (async () => {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS admin_login_rate_limits (
          key_hash TEXT PRIMARY KEY,
          window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          attempts INTEGER NOT NULL DEFAULT 0,
          blocked_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export async function isAdminLoginBlocked(request: Request) {
  await ensureTable();
  const sql = getDb();
  const keyHash = getClientKey(request);
  const rows = await sql`
    SELECT blocked_until
    FROM admin_login_rate_limits
    WHERE key_hash = ${keyHash}
      AND blocked_until > NOW()
    LIMIT 1
  `;
  const blockedUntil = rows[0]?.blocked_until as string | Date | undefined;
  if (!blockedUntil) return { blocked: false, retryAfter: 0 };
  const milliseconds = new Date(blockedUntil).getTime() - Date.now();
  return { blocked: milliseconds > 0, retryAfter: Math.max(1, Math.ceil(milliseconds / 1000)) };
}

export async function recordAdminLoginFailure(request: Request) {
  await ensureTable();
  const sql = getDb();
  const keyHash = getClientKey(request);
  await sql`
    INSERT INTO admin_login_rate_limits (key_hash, window_started_at, attempts, blocked_until, updated_at)
    VALUES (${keyHash}, NOW(), 1, NULL, NOW())
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN admin_login_rate_limits.window_started_at <= NOW() - INTERVAL '15 minutes' THEN 1
        ELSE admin_login_rate_limits.attempts + 1
      END,
      window_started_at = CASE
        WHEN admin_login_rate_limits.window_started_at <= NOW() - INTERVAL '15 minutes' THEN NOW()
        ELSE admin_login_rate_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN admin_login_rate_limits.window_started_at <= NOW() - INTERVAL '15 minutes' THEN NULL
        WHEN admin_login_rate_limits.attempts + 1 >= ${MAX_ATTEMPTS} THEN NOW() + INTERVAL '15 minutes'
        ELSE admin_login_rate_limits.blocked_until
      END,
      updated_at = NOW()
  `;
}
