import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm"]);

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "O armazenamento de arquivos ainda não está configurado. Adicione BLOB_READ_WRITE_TOKEN na Vercel." }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Formato não permitido. Use imagens, vídeo MP4/WebM ou áudio MP3/MP4/OGG/WAV/WebM." }, { status: 415 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "O arquivo ultrapassa o limite de 25 MB." }, { status: 413 });
    const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "media";
    const pathname = `cnc-roraima/${crypto.randomUUID()}-${safeName}`;
    const upload = await fetch(`https://blob.vercel-storage.com/${pathname.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "x-content-type": file.type,
        "x-allow-overwrite": "false",
        "x-add-random-suffix": "false",
        "Content-Type": file.type,
      },
      body: await file.arrayBuffer(),
    });
    if (!upload.ok) {
      console.error("Falha no armazenamento de mídia", upload.status, await upload.text());
      return NextResponse.json({ error: "Não foi possível enviar o arquivo ao armazenamento." }, { status: 502 });
    }
    const result = await upload.json() as { url?: string; pathname?: string };
    if (!result.url) return NextResponse.json({ error: "O armazenamento não retornou a URL do arquivo." }, { status: 502 });
    const sql = getDb();
    await sql`INSERT INTO media (url, alt_text, caption, mime_type, file_size_bytes) VALUES (${result.url}, ${safeName}, NULL, ${file.type}, ${file.size})`;
    return NextResponse.json({ url: result.url, name: file.name, type: file.type, size: file.size }, { status: 201 });
  } catch (error) {
    console.error("Falha ao enviar mídia", error);
    return NextResponse.json({ error: "Falha ao enviar arquivo." }, { status: 500 });
  }
}
