import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!(await getAdminSession())) throw new Error("Não autorizado.");
        let requestedType = "";
        if (typeof clientPayload === "string") {
          try { requestedType = (JSON.parse(clientPayload) as { type?: string }).type ?? ""; } catch { requestedType = ""; }
        }
        if (!ALLOWED_TYPES.includes(requestedType)) throw new Error("Formato de arquivo não permitido.");
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({ requestedType }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        const sql = getDb();
        await sql`INSERT INTO media (url, alt_text, mime_type) VALUES (${blob.url}, ${blob.pathname}, ${blob.contentType ?? null})`;
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Falha no fluxo de upload de mídia", error);
    const message = error instanceof Error ? error.message : "Falha ao enviar arquivo.";
    const status = message === "Não autorizado." ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
