import { neonAuth } from "@/lib/neon-auth-server";

export const runtime = "nodejs";
export const { GET, POST, PUT, DELETE, PATCH } = neonAuth.handler();
