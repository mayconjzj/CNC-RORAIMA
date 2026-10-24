import { createNeonAuth } from "@neondatabase/auth/next/server";

export const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? "",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? "local-development-only-change-me-please",
  },
});
