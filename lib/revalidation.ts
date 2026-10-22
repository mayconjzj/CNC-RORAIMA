import { revalidatePath, revalidateTag } from "next/cache";

export function revalidatePublishedContent() {
  revalidateTag("published-articles");
  revalidateTag("published-categories");
  revalidatePath("/");
  revalidatePath("/noticias");
  revalidatePath("/noticias/[slug]", "page");
  revalidatePath("/editorias/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
