export type ArticleBlock = {
  id?: string;
  type: "paragraph" | "heading" | "quote" | "image" | "video" | "audio" | "link" | "divider" | "list" | "gallery";
  text?: string;
  title?: string;
  url?: string;
  alt?: string;
  caption?: string;
  items?: { id?: string; url: string; alt?: string; caption?: string }[];
  columns?: 2 | 3 | 4;
  layout?: "grid" | "feature";
};
export type ArticleSection = { id?: string; title: string; blocks: ArticleBlock[] };

export function sanitizeRichText(input: string): string {
  const withoutDangerousBlocks = input.replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\\s\\S]*?<\\/\\1\\s*>/gi, "");
  const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "h2", "h3", "h4", "a", "sub", "sup"]);
  return withoutDangerousBlocks.replace(/<\\/?([a-z][a-z0-9]*)\\b([^>]*)>/gi, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!allowedTags.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    if (tag === "br") return "<br>";
    if (tag !== "a") return `<${tag}>`;
    const match = rawAttrs.match(/href\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
    const href = (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
    if (!/^(https?:\\/\\/|mailto:|tel:|\\/)/i.test(href) || /^\\/\\//.test(href)) return "<a>";
    const escaped = href.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return `<a href="${escaped}" rel="noopener noreferrer" target="_blank">`;
  });
}

function normalizeBlock(item: unknown): ArticleBlock | null {
  if (!item || typeof item !== "object") return null;
  const block = item as Record<string, unknown>;
  const allowed = ["paragraph", "heading", "quote", "image", "video", "audio", "link", "divider", "list", "gallery"];
  const type = typeof block.type === "string" && allowed.includes(block.type) ? block.type as ArticleBlock["type"] : null;
  if (!type) return null;
  const text = typeof block.text === "string" ? sanitizeRichText(block.text.slice(0, 30000)) : "";
  const url = typeof block.url === "string" && /^https?:\\/\\//i.test(block.url.trim()) ? block.url.trim().slice(0, 2000) : "";
  const title = typeof block.title === "string" ? block.title.slice(0, 300) : "";
  const alt = typeof block.alt === "string" ? block.alt.slice(0, 500) : "";
  const caption = typeof block.caption === "string" ? block.caption.slice(0, 1000) : "";
  if (["image", "video", "audio", "link"].includes(type) && !url) return null;
  const result: ArticleBlock = { type, text, url, title, alt, caption };
  if (type === "list") result.items = (Array.isArray(block.items) ? block.items : []).slice(0, 100).map(String).map(x => ({ url: "", alt: "", caption: x.slice(0, 2000) }));
  if (type === "gallery") {
    result.columns = block.columns === 3 || block.columns === 4 ? block.columns : 2;
    result.layout = block.layout === "feature" ? "feature" : "grid";
    result.items = (Array.isArray(block.items) ? block.items : []).slice(0, 24).flatMap((entry): { url: string; alt?: string; caption?: string }[] => {
      if (!entry || typeof entry !== "object") return [];
      const image = entry as Record<string, unknown>;
      const imageUrl = typeof image.url === "string" && /^https?:\\/\\//i.test(image.url.trim()) ? image.url.trim().slice(0, 2000) : "";
      return imageUrl ? [{ url: imageUrl, alt: typeof image.alt === "string" ? image.alt.slice(0, 500) : "", caption: typeof image.caption === "string" ? image.caption.slice(0, 1000) : "" }] : [];
    });
    if (!result.items.length) return null;
  }
  return result;
}

export function normalizeArticleSections(value: unknown): ArticleSection[] {
  let source = value;
  if (typeof source === "string") { try { source = JSON.parse(source); } catch { source = [{ type: "paragraph", text: source }]; } }
  if (!Array.isArray(source)) return [];
  if (source.some((item) => item && typeof item === "object" && "blocks" in item)) {
    return source.slice(0, 40).flatMap((item): ArticleSection[] => {
      if (!item || typeof item !== "object") return [];
      const section = item as Record<string, unknown>;
      const blocks = (Array.isArray(section.blocks) ? section.blocks : []).slice(0, 150).flatMap((b) => { const normalized = normalizeBlock(b); return normalized ? [normalized] : []; });
      return [{ title: typeof section.title === "string" ? section.title.slice(0, 300) : "", blocks }];
    });
  }
  const blocks = source.slice(0, 150).flatMap((item) => { const normalized = normalizeBlock(item); return normalized ? [normalized] : []; });
  return blocks.length ? [{ title: "", blocks }] : [];
}

export function normalizeArticleBlocks(value: unknown): ArticleBlock[] {
  return normalizeArticleSections(value).flatMap(section => section.blocks);
}
