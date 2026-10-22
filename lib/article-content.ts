export type ArticleBlock = {
  id?: string;
  type: "paragraph" | "heading" | "quote" | "image" | "video" | "audio" | "link" | "divider";
  text?: string;
  title?: string;
  url?: string;
  alt?: string;
  caption?: string;
};

export function sanitizeRichText(input: string): string {
  const withoutDangerousBlocks = input.replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "h2", "h3", "h4", "a", "sub", "sup"]);
  return withoutDangerousBlocks.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!allowedTags.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    if (tag === "br") return "<br>";
    if (tag !== "a") return `<${tag}>`;
    const match = rawAttrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(href) || /^\/\//.test(href)) return "<a>";
    const escaped = href.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return `<a href="${escaped}" rel="noopener noreferrer" target="_blank">`;
  });
}

export function normalizeArticleBlocks(value: unknown): ArticleBlock[] {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { source = [{ type: "paragraph", text: source }]; }
  }
  if (!Array.isArray(source)) return [];
  return source.slice(0, 150).flatMap((item): ArticleBlock[] => {
    if (!item || typeof item !== "object") return [];
    const block = item as Record<string, unknown>;
    const type = typeof block.type === "string" ? block.type : "paragraph";
    if (!["paragraph", "heading", "quote", "image", "video", "audio", "link", "divider"].includes(type)) return [];
    const text = typeof block.text === "string" ? sanitizeRichText(block.text.slice(0, 30000)) : "";
    const url = typeof block.url === "string" && /^https?:\/\//i.test(block.url.trim()) ? block.url.trim().slice(0, 2000) : "";
    const title = typeof block.title === "string" ? block.title.slice(0, 300) : "";
    const alt = typeof block.alt === "string" ? block.alt.slice(0, 500) : "";
    const caption = typeof block.caption === "string" ? block.caption.slice(0, 1000) : "";
    if (["image", "video", "audio", "link"].includes(type) && !url) return [];
    return [{ type: type as ArticleBlock["type"], text, url, title, alt, caption }];
  });
}
