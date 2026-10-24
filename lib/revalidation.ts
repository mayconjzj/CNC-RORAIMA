import { revalidatePath, revalidateTag } from "next/cache";

export function revalidatePublishedContent() {
  // Next.js 16 requires a cache-life profile for tag revalidation.
  // "max" marks tagged data stale and refreshes it on the next request.
  revalidateTag("published-articles", "max");
  revalidateTag("published-categories", "max");
  revalidatePath("/");
  revalidatePath("/noticias");
  revalidatePath("/noticias/[slug]", "page");
  revalidatePath("/editorias/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
