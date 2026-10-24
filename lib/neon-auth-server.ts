import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

// Neon integration variables use the configured NEONN_ prefix.
// Keep the legacy name as a fallback during migration.
const baseUrl =
  process.env.NEONN_NEON_AUTH_BASE_URL ?? process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export function assertNeonAuthConfigured(): void {
  if (process.env.NODE_ENV !== "production") return;

  if (!baseUrl) {
    throw new Error(
      "Configure NEONN_NEON_AUTH_BASE_URL (or legacy NEON_AUTH_BASE_URL) before starting Neon Auth.",
    );
  }
  if (!cookieSecret || cookieSecret.length < 32) {
    throw new Error("Configure NEON_AUTH_COOKIE_SECRET com pelo menos 32 caracteres.");
  }

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error("Configure a Neon Auth base URL com uma URL HTTPS válida.");
  }

  if (parsedBaseUrl.protocol !== "https:") {
    throw new Error("A URL do Neon Auth precisa usar HTTPS em produção.");
  }
}

export const neonAuth = createNeonAuth({
  // Fallbacks allow Next.js to compile in CI without production secrets.
  // Every route using Neon Auth must call assertNeonAuthConfigured first.
  baseUrl: baseUrl ?? "http://localhost:3000",
  cookies: {
    secret: cookieSecret ?? "local-development-only-change-me-please",
  },
});
