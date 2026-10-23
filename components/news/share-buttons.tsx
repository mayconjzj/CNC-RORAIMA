"use client";

import { useState } from "react";
import { FacebookIcon, WhatsappIcon, XIcon } from "react-share";
import { Link2, Share2 } from "lucide-react";

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
        // The visitor may close the native share sheet.
      }
      return;
    }
    await copyLink();
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

  const iconButtonStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    padding: 3,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e5e5e8",
    borderRadius: "50%",
    background: "#fff",
    cursor: "pointer",
    transition: "transform .15s ease, box-shadow .15s ease",
    flexShrink: 0,
  };

  return (
    <div aria-label="Compartilhar notícia" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no WhatsApp"
        title="WhatsApp"
        style={iconButtonStyle}
      >
        <WhatsappIcon size={28} aria-hidden="true" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Facebook"
        title="Facebook"
        style={iconButtonStyle}
      >
        <FacebookIcon size={28} aria-hidden="true" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no X"
        title="X"
        style={iconButtonStyle}
      >
        <XIcon size={28} aria-hidden="true" />
      </a>
      <button
        type="button"
        onClick={shareMore}
        aria-label="Mais opções de compartilhamento"
        title="Mais opções"
        style={iconButtonStyle}
      >
        <Share2 size={18} color="#202126" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link copiado" : "Copiar link da notícia"}
        title={copied ? "Link copiado" : "Copiar link"}
        style={{ ...iconButtonStyle, background: copied ? "#f2e6e7" : "#fff", borderColor: copied ? "#b90018" : "#e5e5e8" }}
      >
        <Link2 size={18} color={copied ? "#b90018" : "#202126"} aria-hidden="true" />
      </button>
    </div>
  );
}
