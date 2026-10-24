import Image from "next/image";
import type { ArticleSection, ArticleBlock } from "@/lib/article-content";
import { shouldOptimizeImage } from "@/lib/media";

type Props = { sections: ArticleSection[] };

export function ArticleBody({ sections }: Props) {
  return (
    <div className="article-body" style={{ fontSize: 18, lineHeight: 1.85, overflowWrap: "anywhere" }}>
      {sections.map((section, si) => (
        <section key={section.id ?? si} style={{ marginBottom: 34 }}>
          {section.title && <h2 style={{ fontSize: 30, lineHeight: 1.2, margin: "30px 0 18px" }}>{section.title}</h2>}
          {section.blocks.map((block: ArticleBlock, i) => {
            const richText = block.text ? { __html: block.text } : null;
            if (block.type === "heading") return <h3 key={block.id ?? i} style={{ fontSize: 25, lineHeight: 1.25, margin: "30px 0 12px" }}>{block.title || <span dangerouslySetInnerHTML={richText!} />}</h3>;
            if (block.type === "quote") return <blockquote key={block.id ?? i} style={{ borderLeft: "4px solid #c9a044", margin: "28px 0", padding: "8px 22px", color: "#555", fontSize: 21, fontStyle: "italic" }}><span dangerouslySetInnerHTML={richText!} /></blockquote>;
            if (block.type === "image") return <figure key={block.id ?? i} style={{ margin: "30px 0" }}><Image src={block.url!} alt={block.alt || block.title || ""} width={1200} height={800} sizes="(max-width: 900px) 100vw, 900px" loading="lazy" unoptimized={!shouldOptimizeImage(block.url!)} style={{ display: "block", width: "100%", height: "auto", borderRadius: 10, maxHeight: 680, objectFit: "contain" }} />{block.caption && <figcaption style={{ color: "#777", fontSize: 14, marginTop: 8, textAlign: "center" }}>{block.caption}</figcaption>}</figure>;
            if (block.type === "gallery") return <div key={block.id ?? i} className={block.layout === "feature" ? "article-gallery article-gallery-feature" : "article-gallery"} style={{ display: "grid", gridTemplateColumns: `repeat(${block.columns || 3},minmax(0,1fr))`, gap: 10, margin: "28px 0" }}>{(block.items || []).filter(image => image.url).map((image, j) => <figure key={(image.id ?? image.url) + j} style={{ margin: 0, minWidth: 0 }}><Image src={image.url} alt={image.alt || ""} width={800} height={600} sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 300px" loading="lazy" unoptimized={!shouldOptimizeImage(image.url)} style={{ display: "block", width: "100%", height: "100%", minHeight: 150, maxHeight: 360, objectFit: "cover", borderRadius: 9 }} />{image.caption && <figcaption style={{ fontSize: 13, color: "#777", lineHeight: 1.4, marginTop: 5 }}>{image.caption}</figcaption>}</figure>)}</div>;
            if (block.type === "list") return <ul key={block.id ?? i} style={{ paddingLeft: 28, margin: "18px 0" }}>{(block.text || "").split("\n").filter(item => item.trim()).map((item, j) => <li key={j} style={{ paddingLeft: 4, marginBottom: 6 }}>{item}</li>)}</ul>;
            if (block.type === "video") return <figure key={block.id ?? i} style={{ margin: "30px 0" }}><video controls preload="metadata" src={block.url} style={{ width: "100%", borderRadius: 10, background: "#111" }}>Seu navegador não suporta vídeo.</video>{block.caption && <figcaption style={{ color: "#777", fontSize: 14, marginTop: 8 }}>{block.caption}</figcaption>}</figure>;
            if (block.type === "audio") return <figure key={block.id ?? i} style={{ margin: "26px 0" }}><figcaption style={{ fontWeight: 700, marginBottom: 8 }}>{block.title || "Áudio"}</figcaption><audio controls preload="metadata" src={block.url} style={{ width: "100%" }} />{block.caption && <p style={{ color: "#777", fontSize: 14 }}>{block.caption}</p>}</figure>;
            if (block.type === "link") return <p key={block.id ?? i} style={{ margin: "20px 0" }}><a href={block.url} target="_blank" rel="noopener noreferrer" style={{ color: "#b90018", textDecoration: "underline", fontWeight: 700 }}>{block.title || block.url}</a></p>;
            if (block.type === "divider") return <hr key={block.id ?? i} style={{ border: 0, borderTop: "1px solid #ddd", margin: "32px 0" }} />;
            return <div key={block.id ?? i} style={{ marginBottom: 22 }} dangerouslySetInnerHTML={richText ?? { __html: "" }} />;
          })}
        </section>
      ))}
    </div>
  );
}
