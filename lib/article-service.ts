import { normalizeArticleSections } from "@/lib/article-content";
import type { ArticleSection } from "@/lib/article-content";

export type ArticleInput = {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  image: string;
  categoryId: string | null;
  authorId: string | null;
  status: "draft" | "published";
  isFeatured: boolean;
  sections: ArticleSection[];
};

type ArticleInputResult = { data: ArticleInput } | { error: string };

export function parseArticleInput(value: unknown): ArticleInputResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Os dados enviados são inválidos." };
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 500) : "";
  const seoTitle = typeof body.seoTitle === "string" ? body.seoTitle.trim().slice(0, 70) : "";
  const seoDescription = typeof body.seoDescription === "string" ? body.seoDescription.trim().slice(0, 160) : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const categoryId = typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null;
  const authorId = typeof body.authorId === "string" && body.authorId ? body.authorId : null;
  const status = body.status === "published" ? "published" : "draft";
  const isFeatured = body.isFeatured === true;
  const sections = normalizeArticleSections(body.content);
  const blocks = sections.flatMap((section) => section.blocks);
  const plainText = sections
    .map((section) => [
      section.title,
      ...section.blocks.flatMap((block) => [
        block.title,
        block.text?.replace(/<[^>]*>/g, " "),
        block.caption,
        ...(block.items || []).map((item) => item.caption),
      ]),
    ].filter(Boolean).join(" "))
    .join(" ")
    .trim();

  if (title.length < 5 || title.length > 180) {
    return { error: "O título deve ter entre 5 e 180 caracteres." };
  }

  if (!blocks.length || plainText.length < 20 || plainText.length > 150000) {
    return { error: "Adicione conteúdo à notícia (pelo menos 20 caracteres e no máximo 150.000)." };
  }

  if (image) {
    try {
      const parsedImageUrl = new URL(image);
      if (parsedImageUrl.protocol !== "http:" && parsedImageUrl.protocol !== "https:") {
        return { error: "A imagem de capa deve usar uma URL http ou https válida." };
      }
    } catch {
      return { error: "A imagem de capa deve usar uma URL http ou https válida." };
    }
  }

  return {
    data: {
      title,
      excerpt,
      seoTitle,
      seoDescription,
      image,
      categoryId,
      authorId,
      status,
      isFeatured,
      sections,
    },
  };
}
