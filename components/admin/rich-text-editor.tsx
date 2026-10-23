"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bold, Italic, Underline, Link2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

type FormattingState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

const INACTIVE_STYLE = {
  padding: 8,
  border: "1px solid #e3e3e3",
  borderRadius: 6,
  background: "#fff",
  color: "#353535",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
} as const;

const ACTIVE_STYLE = {
  ...INACTIVE_STYLE,
  background: "#202126",
  color: "#fff",
  border: "1px solid #202126",
  boxShadow: "0 0 0 2px rgba(185, 0, 24, 0.16)",
} as const;

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const [formatting, setFormatting] = useState<FormattingState>({
    bold: false,
    italic: false,
    underline: false,
  });

  const syncFormatting = useCallback(() => {
    const element = editor.current;
    if (!element) return;

    const selection = window.getSelection();
    if (selection?.anchorNode && !element.contains(selection.anchorNode)) return;

    setFormatting({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) {
      editor.current.innerHTML = value || "";
    }
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", syncFormatting);
    return () => document.removeEventListener("selectionchange", syncFormatting);
  }, [syncFormatting]);

  function command(name: string, argument?: string) {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    onChange(editor.current?.innerHTML ?? "");
    syncFormatting();
  }

  function addLink() {
    const url = window.prompt("Cole o endereço do link (https://...)");
    if (url && /^https?:\/\//i.test(url)) command("createLink", url);
  }

  const tool = (
    label: string,
    icon: ReactNode,
    action: () => void,
    active = false,
  ) => (
    <button
      type="button"
      title={active ? `${label} ativado` : label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={action}
      style={active ? ACTIVE_STYLE : INACTIVE_STYLE}
    >
      {icon}
    </button>
  );

  return (
    <div style={{ marginTop: 8, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 8, background: "#f8f8f8", borderBottom: "1px solid #e5e5e5" }}>
        {tool("Negrito", <Bold size={16} />, () => command("bold"), formatting.bold)}
        {tool("Itálico", <Italic size={16} />, () => command("italic"), formatting.italic)}
        {tool("Sublinhado", <Underline size={16} />, () => command("underline"), formatting.underline)}
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
        onInput={(event) => {
          onChange(event.currentTarget.innerHTML);
          syncFormatting();
        }}
        onKeyUp={syncFormatting}
        onMouseUp={syncFormatting}
        style={{ minHeight: 130, padding: 14, outline: "none", lineHeight: 1.7, overflowWrap: "anywhere" }}
      />
      <style>{'[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#999;pointer-events:none}'}</style>
    </div>
  );
}
