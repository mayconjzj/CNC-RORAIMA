import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export function assertNeonAuthConfigured(): void {
  if (process.env.NODE_ENV !== "production") return;

  if (!baseUrl) {
    throw new Error("Configure NEON_AUTH_BASE_URL no ambiente antes de iniciar o Neon Auth.");
  }
  if (!cookieSecret || cookieSecret.length < 32) {
    throw new Error("Configure NEON_AUTH_COOKIE_SECRET com pelo menos 32 caracteres.");
  }

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error("Configure NEON_AUTH_BASE_URL com uma URL HTTPS válida.");
  }

  if (parsedBaseUrl.protocol !== "https:") {
    throw new Error("NEON_AUTH_BASE_URL precisa usar HTTPS em produção.");
  }
}

export const neonAuth = createNeonAuth({
  // Fallbacks permitem que o Next.js compile em CI sem segredos de produção.
  // Toda rota que usa Neon Auth deve chamar assertNeonAuthConfigured primeiro.
  baseUrl: baseUrl ?? "http://localhost:3000",
  cookies: {
    secret: cookieSecret ?? "local-development-only-change-me-please",
  },
});
