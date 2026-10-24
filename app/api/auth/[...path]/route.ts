import { NextResponse } from "next/server";
import { assertNeonAuthConfigured, neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";

const authHandlers = neonAuth.handler();

function unavailableResponse() {
  return NextResponse.json(
    { error: "A autenticação não está configurada corretamente no servidor." },
    {
      status: 503,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );
}

export async function GET(...args: Parameters<typeof authHandlers.GET>) {
  try {
    assertNeonAuthConfigured();
  } catch (error) {
    console.error("Neon Auth indisponível", error);
    return unavailableResponse();
  }
  return authHandlers.GET(...args);
}

export async function POST(...args: Parameters<typeof authHandlers.POST>) {
  try {
    assertNeonAuthConfigured();
  } catch (error) {
    console.error("Neon Auth indisponível", error);
    return unavailableResponse();
  }
  return authHandlers.POST(...args);
}
