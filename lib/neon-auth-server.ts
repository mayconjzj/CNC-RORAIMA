import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (process.env.NODE_ENV === "production") {
  if (!baseUrl) {
    throw new Error("Configure NEON_AUTH_BASE_URL no ambiente antes de iniciar o Neon Auth.");
  }
  if (!cookieSecret || cookieSecret.length < 32) {
    throw new Error("Configure NEON_AUTH_COOKIE_SECRET com pelo menos 32 caracteres.");
  }

  try {
    const parsedBaseUrl = new URL(baseUrl);
    if (parsedBaseUrl.protocol !== "https:") {
      throw new Error("NEON_AUTH_BASE_URL precisa usar HTTPS em produção.");
    }
  } catch {
    throw new Error("Configure NEON_AUTH_BASE_URL com uma URL HTTPS válida.");
  }
}

export const neonAuth = createNeonAuth({
  baseUrl: baseUrl ?? "http://localhost:3000",
  cookies: {
    // O segredo fixo existe apenas para desenvolvimento local; produção falha
    // de forma segura se a variável dedicada não estiver configurada.
    secret: cookieSecret ?? "local-development-only-change-me-please",
  },
});
