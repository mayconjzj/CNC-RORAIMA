import type { ArticleBlock as ContentBlock, ArticleSection as ContentSection } from "@/lib/article-content";

export type EditorBlock = Omit<ContentBlock, "id" | "items"> & {
  id: string;
  items?: { id: string; url: string; alt?: string; caption?: string }[];
};

export type EditorSection = Omit<ContentSection, "id" | "blocks"> & {
  id: string;
  blocks: EditorBlock[];
};

export const createEditorId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

export function createBlankBlock(type: EditorBlock["type"] = "paragraph"): EditorBlock {
  return {
    id: createEditorId(),
    type,
    text: "",
    title: "",
    url: "",
    alt: "",
    caption: "",
    items: [],
    columns: 3,
    layout: "grid",
  };
}

export function createBlankSection(): EditorSection {
  return { id: createEditorId(), title: "", blocks: [createBlankBlock()] };
}

export function toEditorSections(content: unknown): EditorSection[] {
  let value = content;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [{ ...createBlankSection(), blocks: [{ ...createBlankBlock(), text: value }] }];
    }
  }

  if (!Array.isArray(value) || value.length === 0) return [createBlankSection()];

  if (value.some((item) => item && typeof item === "object" && Array.isArray(item.blocks))) {
    return value.map((item) => {
      const section = item as Record<string, unknown>;
      const blocks = Array.isArray(section.blocks) ? section.blocks : [];
      return {
        id: createEditorId(),
        title: typeof section.title === "string" ? section.title : "",
        blocks: blocks.map((block) => {
          const source = block && typeof block === "object" ? block as Partial<EditorBlock> : {};
          return { ...createBlankBlock(source.type), ...source, id: createEditorId() } as EditorBlock;
        }),
      };
    });
  }

  return [{
    ...createBlankSection(),
    blocks: value.map((block) => {
      const source = block && typeof block === "object" ? block as Partial<EditorBlock> : {};
      return { ...createBlankBlock(source.type), ...source, id: createEditorId() } as EditorBlock;
    }),
  }];
}
