"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Bold, Italic, Underline, Link2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) {
      editor.current.innerHTML = value || "";
    }
  }, [value]);

  function command(name: string, argument?: string) {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editor.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt("Cole o endereço do link (https://...)");
    if (url && /^https?:\/\//i.test(url)) command("createLink", url);
  }

  const tool = (label: string, icon: ReactNode, action: () => void) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={action}
      style={{ padding: 8, border: "1px solid #e3e3e3", borderRadius: 6, background: "#fff", cursor: "pointer", display: "inline-flex" }}
    >
      {icon}
    </button>
  );

  return (
    <div style={{ marginTop: 8, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 8, background: "#f8f8f8", borderBottom: "1px solid #e5e5e5" }}>
        {tool("Negrito", <Bold size={16} />, () => command("bold"))}
        {tool("Itálico", <Italic size={16} />, () => command("italic"))}
        {tool("Sublinhado", <Underline size={16} />, () => command("underline"))}
        {tool("Adicionar link", <Link2 size={16} />, addLink)}
        <span style={{ alignSelf: "center", fontSize: 12, color: "#777", marginLeft: 4 }}>Selecione o texto para formatar</span>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        style={{ minHeight: 130, padding: 14, outline: "none", lineHeight: 1.7, overflowWrap: "anywhere" }}
      />
      <style>{'[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#999;pointer-events:none}'}</style>
    </div>
  );
}
