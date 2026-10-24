"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { createEditorId } from "@/lib/article-editor";
import type { EditorBlock, EditorSection } from "@/lib/article-editor";

type PreviewType = "image" | "video" | "audio";

type MediaPreviewProps = {
  type: PreviewType;
  url: string;
  alt?: string;
  compact?: boolean;
};

function MediaPreview({ type, url, alt, compact = false }: MediaPreviewProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!url) return null;

  if (failed) {
    return (
      <p role="alert" style={{ color: "#b90018", fontSize: 12, margin: "8px 0" }}>
        Não foi possível carregar esta prévia. Confira a URL ou envie o arquivo novamente.
      </p>
    );
  }

  if (type === "image") {
    return (
      <img
        src={url}
        alt={alt || "Prévia da imagem"}
        onError={() => setFailed(true)}
        style={
          compact
            ? {
                width: 58,
                height: 58,
                objectFit: "cover",
                borderRadius: 6,
                flexShrink: 0,
              }
            : {
                display: "block",
                maxWidth: "100%",
                maxHeight: 220,
                objectFit: "contain",
                margin: "8px 0",
                borderRadius: 8,
              }
        }
      />
    );
  }

  if (type === "video") {
    return (
      <video
        controls
        preload="metadata"
        src={url}
        onError={() => setFailed(true)}
        style={{
          display: "block",
          width: "100%",
          maxHeight: 240,
          margin: "8px 0",
          background: "#111",
          borderRadius: 8,
        }}
      />
    );
  }

  return (
    <audio
      controls
      preload="metadata"
      src={url}
      onError={() => setFailed(true)}
      style={{ display: "block", width: "100%", margin: "8px 0" }}
    />
  );
}

type Props = {
  sections: EditorSection[];
  setSections: Dispatch<SetStateAction<EditorSection[]>>;
  inputStyle: CSSProperties;
  labelStyle: CSSProperties;
  buttonStyle: CSSProperties;
  uploading: string | null;
  addSection: () => void;
  moveSection: (index: number, direction: -1 | 1) => void;
  removeSection: (index: number) => void;
  addBlock: (sectionIndex: number, type: EditorBlock["type"]) => void;
  moveBlock: (sectionIndex: number, blockIndex: number, direction: -1 | 1) => void;
  removeBlock: (sectionIndex: number, blockIndex: number) => void;
  updateBlock: (
    sectionIndex: number,
    blockIndex: number,
    changes: Partial<EditorBlock>,
  ) => void;
  appendGalleryImage: (sectionIndex: number, blockIndex: number, url: string) => void;
  uploadFile: (file: File, onSuccess: (url: string) => void, key: string) => Promise<void>;
};

const BLOCK_TYPES: EditorBlock["type"][] = [
  "paragraph",
  "heading",
  "quote",
  "image",
  "gallery",
  "list",
  "video",
  "audio",
  "link",
  "divider",
];

const BLOCK_LABELS: Record<EditorBlock["type"], string> = {
  paragraph: "Texto",
  heading: "Título",
  quote: "Citação",
  image: "Foto",
  gallery: "Grade de fotos",
  list: "Lista",
  video: "Vídeo",
  audio: "Áudio",
  link: "Link",
  divider: "Separador",
};

export function ArticleStructureEditor({
  sections,
  setSections,
  inputStyle,
  labelStyle,
  buttonStyle,
  uploading,
  addSection,
  moveSection,
  removeSection,
  addBlock,
  moveBlock,
  removeBlock,
  updateBlock,
  appendGalleryImage,
  uploadFile,
}: Props) {
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  function toggleSection(id: string) {
    setCollapsedSections((current) =>
      current.includes(id)
        ? current.filter((sectionId) => sectionId !== id)
        : [...current, id],
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "12px 0",
        }}
      >
        <strong>Estrutura da matéria</strong>
        <button type="button" style={buttonStyle} onClick={addSection}>
          ＋ Nova seção
        </button>
      </div>

      {sections.map((section, sectionIndex) => {
        const collapsed = collapsedSections.includes(section.id);

        return (
          <section
            key={section.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                marginBottom: collapsed ? 0 : 8,
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <strong>Seção {sectionIndex + 1}</strong>
                {collapsed && (
                  <span
                    style={{
                      color: "#666",
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {section.title.trim() || "Sem título"} · {section.blocks.length}{" "}
                    {section.blocks.length === 1 ? "bloco" : "blocos"}
                  </span>
                )}
              </div>

              <span
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="admin-section-toggle"
                  aria-expanded={!collapsed}
                  aria-label={
                    collapsed
                      ? `Expandir seção ${sectionIndex + 1}`
                      : `Minimizar seção ${sectionIndex + 1}`
                  }
                  title={collapsed ? "Expandir seção" : "Minimizar seção"}
                  style={buttonStyle}
                  onClick={() => toggleSection(section.id)}
                >
                  {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <span className="admin-section-toggle-label">
                    {collapsed ? "Expandir" : "Minimizar"}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Mover seção ${sectionIndex + 1} para cima`}
                  title="Mover para cima"
                  style={buttonStyle}
                  disabled={sectionIndex === 0}
                  onClick={() => moveSection(sectionIndex, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Mover seção ${sectionIndex + 1} para baixo`}
                  title="Mover para baixo"
                  style={buttonStyle}
                  disabled={sectionIndex === sections.length - 1}
                  onClick={() => moveSection(sectionIndex, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="admin-section-remove"
                  aria-label={`Remover seção ${sectionIndex + 1}`}
                  title="Remover seção"
                  style={{
                    ...buttonStyle,
                    color: "#b90018",
                    borderColor: "#f0c7cb",
                    background: "#fff5f5",
                  }}
                  disabled={sections.length === 1}
                  onClick={() => removeSection(sectionIndex)}
                >
                  <span className="admin-section-remove-label">Remover</span>
                  <span className="admin-section-remove-icon" aria-hidden="true">
                    <Trash2 size={14} />
                  </span>
                </button>
              </span>
            </div>

            {!collapsed && (
              <>
                <label style={labelStyle}>
                  Título da seção
                  <input
                    style={inputStyle}
                    value={section.title}
                    onChange={(event) =>
                      setSections((current) =>
                        current.map((item, index) =>
                          index === sectionIndex
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="Título opcional"
                  />
                </label>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {BLOCK_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      style={buttonStyle}
                      onClick={() => addBlock(sectionIndex, type)}
                    >
                      {BLOCK_LABELS[type]}
                    </button>
                  ))}
                </div>

                {section.blocks.map((block, blockIndex) => (
                  <div
                    key={block.id}
                    style={{ borderTop: "1px solid #eee", padding: "12px 0" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <b>
                        {block.type === "gallery"
                          ? "Grade de fotos"
                          : block.type === "list"
                            ? "Lista"
                            : block.type}
                      </b>
                      <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          aria-label={`Mover bloco ${blockIndex + 1} para cima`}
                          style={buttonStyle}
                          disabled={blockIndex === 0}
                          onClick={() => moveBlock(sectionIndex, blockIndex, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Mover bloco ${blockIndex + 1} para baixo`}
                          style={buttonStyle}
                          disabled={blockIndex === section.blocks.length - 1}
                          onClick={() => moveBlock(sectionIndex, blockIndex, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="admin-block-delete"
                          aria-label={`Excluir bloco ${blockIndex + 1}`}
                          title="Excluir bloco"
                          style={{
                            ...buttonStyle,
                            color: "#b90018",
                            borderColor: "#f0c7cb",
                          }}
                          onClick={() => removeBlock(sectionIndex, blockIndex)}
                        >
                          <Trash2 size={14} />
                          <span className="admin-block-delete-text"> Excluir bloco</span>
                        </button>
                      </span>
                    </div>

                    {block.type === "heading" && (
                      <input
                        style={inputStyle}
                        value={block.title || ""}
                        placeholder="Título"
                        onChange={(event) =>
                          updateBlock(sectionIndex, blockIndex, {
                            title: event.target.value,
                          })
                        }
                      />
                    )}

                    {(block.type === "paragraph" || block.type === "quote") && (
                      <RichTextEditor
                        value={block.text || ""}
                        onChange={(text) =>
                          updateBlock(sectionIndex, blockIndex, { text })
                        }
                        placeholder="Digite o conteúdo..."
                      />
                    )}

                    {block.type === "list" && (
                      <textarea
                        style={{ ...inputStyle, minHeight: 90 }}
                        value={block.text || ""}
                        placeholder="Um item por linha"
                        onChange={(event) =>
                          updateBlock(sectionIndex, blockIndex, {
                            text: event.target.value,
                          })
                        }
                      />
                    )}

                    {(["image", "video", "audio"] as const).includes(
                      block.type as "image" | "video" | "audio",
                    ) && (
                      <>
                        <input
                          style={inputStyle}
                          type="url"
                          placeholder="URL do arquivo"
                          value={block.url || ""}
                          onChange={(event) =>
                            updateBlock(sectionIndex, blockIndex, {
                              url: event.target.value,
                            })
                          }
                        />
                        <label style={labelStyle}>
                          <span style={{ ...buttonStyle, position: "relative" }}>
                            Enviar arquivo
                            <input
                              type="file"
                              accept={
                                block.type === "image"
                                  ? "image/jpeg,image/png,image/webp,image/gif,image/avif"
                                  : block.type === "video"
                                    ? "video/mp4,video/webm"
                                    : "audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"
                              }
                              disabled={uploading !== null}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void uploadFile(
                                    file,
                                    (url) =>
                                      updateBlock(sectionIndex, blockIndex, { url }),
                                    block.id,
                                  );
                                }
                                event.currentTarget.value = "";
                              }}
                              style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0,
                              }}
                            />
                          </span>
                          {uploading === block.id && (
                            <span
                              role="status"
                              style={{ fontSize: 12, color: "#777", marginLeft: 8 }}
                            >
                              Enviando arquivo…
                            </span>
                          )}
                        </label>
                        {block.url && (
                          <MediaPreview
                            type={block.type as PreviewType}
                            url={block.url}
                            alt={block.alt || block.caption || "Prévia da imagem"}
                          />
                        )}
                        <input
                          style={inputStyle}
                          placeholder="Legenda / texto alternativo"
                          value={block.caption || ""}
                          onChange={(event) =>
                            updateBlock(sectionIndex, blockIndex, {
                              caption: event.target.value,
                              alt: event.target.value,
                            })
                          }
                        />
                      </>
                    )}

                    {block.type === "gallery" && (
                      <>
                        <div style={{ display: "flex", gap: 8 }}>
                          <label>
                            Colunas
                            <select
                              style={inputStyle}
                              value={block.columns || 3}
                              onChange={(event) =>
                                updateBlock(sectionIndex, blockIndex, {
                                  columns: Number(event.target.value) as 2 | 3 | 4,
                                })
                              }
                            >
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                            </select>
                          </label>
                          <label>
                            Layout
                            <select
                              style={inputStyle}
                              value={block.layout || "grid"}
                              onChange={(event) =>
                                updateBlock(sectionIndex, blockIndex, {
                                  layout: event.target.value as "grid" | "feature",
                                })
                              }
                            >
                              <option value="grid">Grade uniforme</option>
                              <option value="feature">Colagem</option>
                            </select>
                          </label>
                        </div>
                        <label style={labelStyle}>
                          <span style={{ ...buttonStyle, position: "relative" }}>
                            Enviar várias imagens
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                              disabled={uploading !== null}
                              onChange={(event) => {
                                const files = Array.from(event.target.files || []);
                                event.currentTarget.value = "";
                                void (async () => {
                                  for (const file of files) {
                                    await uploadFile(
                                      file,
                                      (url) => appendGalleryImage(sectionIndex, blockIndex, url),
                                      block.id,
                                    );
                                  }
                                })();
                              }}
                              style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0,
                              }}
                            />
                          </span>
                        </label>
                        {(block.items || []).map((item, itemIndex) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            {item.url && (
                              <MediaPreview
                                type="image"
                                url={item.url}
                                alt={item.alt || "Prévia da imagem da galeria"}
                                compact
                              />
                            )}
                            <input
                              style={inputStyle}
                              type="url"
                              placeholder="URL da imagem"
                              value={item.url}
                              onChange={(event) =>
                                updateBlock(sectionIndex, blockIndex, {
                                  items: (block.items || []).map((currentItem, index) =>
                                    index === itemIndex
                                      ? { ...currentItem, url: event.target.value }
                                      : currentItem,
                                  ),
                                })
                              }
                            />
                            <button
                              type="button"
                              style={buttonStyle}
                              onClick={() =>
                                updateBlock(sectionIndex, blockIndex, {
                                  items: (block.items || []).filter(
                                    (_, index) => index !== itemIndex,
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          style={buttonStyle}
                          onClick={() =>
                            updateBlock(sectionIndex, blockIndex, {
                              items: [
                                ...(block.items || []),
                                { id: createEditorId(), url: "" },
                              ],
                            })
                          }
                        >
                          ＋ URL de imagem
                        </button>
                      </>
                    )}

                    {block.type === "link" && (
                      <>
                        <input
                          style={inputStyle}
                          placeholder="Texto do link"
                          value={block.title || ""}
                          onChange={(event) =>
                            updateBlock(sectionIndex, blockIndex, {
                              title: event.target.value,
                            })
                          }
                        />
                        <input
                          style={inputStyle}
                          type="url"
                          placeholder="URL"
                          value={block.url || ""}
                          onChange={(event) =>
                            updateBlock(sectionIndex, blockIndex, {
                              url: event.target.value,
                            })
                          }
                        />
                      </>
                    )}

                    {block.type === "divider" && <hr />}
                  </div>
                ))}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
