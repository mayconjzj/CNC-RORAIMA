"use client";

import { useState } from "react";

type ShareButtonsProps = { title: string; url: string };

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  async function shareMore() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        // The visitor may close the native share sheet; that is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link da notícia:", url);
    }
  }

  return (
    <section aria-label="Compartilhar notícia" style={{ margin: "26px 0 30px", padding: "18px 0", borderTop: "1px solid #e9e9eb", borderBottom: "1px solid #e9e9eb" }}>
      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#555660" }}>Compartilhe esta notícia</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" style={buttonStyle("#168447")}>💬 WhatsApp</a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" style={buttonStyle("#1877f2")}>f Facebook</a>
        <a href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" style={buttonStyle("#202126")}>𝕏 X</a>
        <button type="button" onClick={shareMore} style={buttonStyle("#b90018")}>↗ Instagram / mais opções</button>
        <button type="button" onClick={copyLink} style={buttonStyle("#f4f4f5", "#202126", "#dedee2")}>🔗 {copied ? "Link copiado!" : "Copiar link"}</button>
      </div>
      <p style={{ margin: "10px 0 0", color: "#777982", fontSize: 11, lineHeight: 1.5 }}>No celular, “Instagram / mais opções” abre o menu de compartilhamento do aparelho, quando disponível.</p>
    </section>
  );
}

function buttonStyle(background: string, color = "#fff", borderColor = background): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 13px", border: `1px solid ${borderColor}`, borderRadius: 6, background, color, fontSize: 12, fontWeight: 750, cursor: "pointer" };
}
