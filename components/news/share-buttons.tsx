"use client";

import { FacebookIcon, LinkedinIcon, TelegramIcon, WhatsappIcon } from "react-share";

type ShareButtonsProps = { title: string; url: string };

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

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
    <div aria-label="Compartilhar notícia" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
        href={`https://www.threads.net/intent/post?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Threads"
        title="Threads"
        style={iconButtonStyle}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M12.02 2C6.12 2 2.5 5.92 2.5 12.12c0 6.14 3.47 9.88 9.16 9.88 5.35 0 8.34-3.12 8.34-7.02 0-2.75-1.56-4.72-4.17-5.28-.4-2.35-1.7-3.62-3.87-3.62-2.3 0-3.9 1.5-4.1 3.83h2.2c.16-1.12.8-1.7 1.88-1.7 1.03 0 1.57.54 1.78 1.38-.35-.03-.7-.05-1.06-.05-3.6 0-5.72 1.74-5.72 4.45 0 2.37 1.74 4.03 4.22 4.03 2.38 0 4.06-1.38 4.64-3.68 1.15.42 1.8 1.38 1.8 2.72 0 2.64-2.18 4.55-5.74 4.55-4.34 0-6.96-2.97-6.96-7.86 0-4.93 2.7-7.73 7.12-7.73 3.2 0 5.22 1.52 6.02 4.53h2.27C19.38 4.35 16.5 2 12.02 2Zm-.55 13.9c-1.25 0-2.03-.68-2.03-1.78 0-1.38 1.13-2.23 3.45-2.23.43 0 .85.03 1.25.1-.1 2.4-1.05 3.91-2.67 3.91Z" />
        </svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Twitter"
        title="Twitter"
        style={iconButtonStyle}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.1L5.7 22H2.5l7.3-8.4L1.8 2h6.5l4.5 6.5L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" /></svg>
      </a>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Telegram"
        title="Telegram"
        style={iconButtonStyle}
      >
        <TelegramIcon size={28} aria-hidden="true" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no LinkedIn"
        title="LinkedIn"
        style={iconButtonStyle}
      >
        <LinkedinIcon size={28} aria-hidden="true" />
      </a>
    </div>
  );
}
