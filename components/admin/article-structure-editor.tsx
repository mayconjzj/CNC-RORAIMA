"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { createEditorId } from "@/lib/article-editor";
import type { EditorBlock, EditorSection } from "@/lib/article-editor";
import { useState } from "react";

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
  updateBlock: (sectionIndex: number, blockIndex: number, changes: Partial<EditorBlock>) => void;
  appendGalleryImage: (sectionIndex: number, blockIndex: number, url: string) => void;
  uploadFile: (file: File, onSuccess: (url: string) => void, key: string) => Promise<void>;
};

export function ArticleStructureEditor({
  sections, setSections, inputStyle, labelStyle, buttonStyle, uploading,
  addSection, moveSection, removeSection, addBlock, moveBlock, removeBlock,
  updateBlock, appendGalleryImage, uploadFile,
}: Props) {
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const toggleSection = (id: string) => setCollapsedSections(current => current.includes(id) ? current.filter(sectionId => sectionId !== id) : [...current, id]);

  return (
    <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0"}}><strong>Estrutura da matéria</strong><button type="button" style={buttonStyle} onClick={addSection}>＋ Nova seção</button></div>
          {sections.map((sec,si)=><section key={sec.id} style={{border:"1px solid #ddd",borderRadius:10,padding:12,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:collapsedSections.includes(sec.id)?0:8}}><div style={{minWidth:0,display:"flex",alignItems:"center",gap:8}}><strong>Seção {si+1}</strong>{collapsedSections.includes(sec.id)&&<span style={{color:"#666",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sec.title.trim()||"Sem título"} · {sec.blocks.length} {sec.blocks.length===1?"bloco":"blocos"}</span>}</div><span style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}><button type="button" className="admin-section-toggle" aria-expanded={!collapsedSections.includes(sec.id)} aria-label={collapsedSections.includes(sec.id)?`Expandir seção ${si+1}`:`Minimizar seção ${si+1}`} title={collapsedSections.includes(sec.id)?"Expandir seção":"Minimizar seção"} style={buttonStyle} onClick={()=>toggleSection(sec.id)}>{collapsedSections.includes(sec.id)?<ChevronRight size={16}/>:<ChevronDown size={16}/>}<span className="admin-section-toggle-label">{collapsedSections.includes(sec.id)?"Expandir":"Minimizar"}</span></button><button type="button" aria-label={`Mover seção ${si+1} para cima`} title="Mover para cima" style={buttonStyle} disabled={si===0} onClick={()=>moveSection(si,-1)}>↑</button> <button type="button" aria-label={`Mover seção ${si+1} para baixo`} title="Mover para baixo" style={buttonStyle} disabled={si===sections.length-1} onClick={()=>moveSection(si,1)}>↓</button> <button type="button" className="admin-section-remove" aria-label={`Remover seção ${si+1}`} title="Remover seção" style={{...buttonStyle,color:"#b90018",borderColor:"#f0c7cb",background:"#fff5f5"}} disabled={sections.length===1} onClick={()=>removeSection(si)}><span className="admin-section-remove-label">Remover</span><span className="admin-section-remove-icon" aria-hidden="true">🗑️</span></button></span></div>{!collapsedSections.includes(sec.id)&&<><label style={labelStyle}>Título da seção<input style={inputStyle} value={sec.title} onChange={e=>setSections(cur=>cur.map((x,i)=>i===si?{...x,title:e.target.value}:x))} placeholder="Título opcional"/></label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{(["paragraph","heading","quote","image","gallery","list","video","audio","link","divider"] as EditorBlock["type"][]).map(t=><button key={t} type="button" style={buttonStyle} onClick={()=>addBlock(si,t)}>{({paragraph:"＋ Texto",heading:"Título",quote:"Citação",image:"Foto",gallery:"Grade de fotos",list:"Lista",video:"Vídeo",audio:"Áudio",link:"Link",divider:"Separador"} satisfies Record<EditorBlock["type"], string>)[t]}</button>)}</div>
          {sec.blocks.map((b,bi)=><div key={b.id} style={{borderTop:"1px solid #eee",padding:"12px 0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><b>{b.type==="gallery"?"Grade de fotos":b.type==="list"?"Lista":b.type}</b><span style={{display:"flex",gap:6,flexWrap:"wrap"}}><button type="button" aria-label={`Mover bloco ${bi+1} para cima`} style={buttonStyle} disabled={bi===0} onClick={()=>moveBlock(si,bi,-1)}>↑</button> <button type="button" aria-label={`Mover bloco ${bi+1} para baixo`} style={buttonStyle} disabled={bi===sec.blocks.length-1} onClick={()=>moveBlock(si,bi,1)}>↓</button> <button type="button" className="admin-block-delete" aria-label={`Excluir bloco ${bi+1}`} title="Excluir bloco" style={{...buttonStyle,color:"#b90018",borderColor:"#f0c7cb"}} onClick={()=>removeBlock(si,bi)}><Trash2 size={14}/><span className="admin-block-delete-text"> Excluir bloco</span></button></span></div>
          {b.type==="heading"&&<input style={inputStyle} value={b.title||""} placeholder="Título" onChange={e=>updateBlock(si,bi,{title:e.target.value})}/>}
          {(b.type==="paragraph"||b.type==="quote")&&<RichTextEditor value={b.text||""} onChange={text=>updateBlock(si,bi,{text})} placeholder="Digite o conteúdo..."/>}
          {b.type==="list"&&<textarea style={{...inputStyle,minHeight:90}} value={b.text||""} placeholder="Um item por linha" onChange={e=>updateBlock(si,bi,{text:e.target.value})}/>}
          {["image","video","audio"].includes(b.type)&&<><input style={inputStyle} type="url" placeholder="URL do arquivo" value={b.url||""} onChange={e=>updateBlock(si,bi,{url:e.target.value})}/><label style={labelStyle}><span style={{...buttonStyle,position:"relative"}}>Enviar arquivo<input type="file" accept={b.type==="image"?"image/*":b.type==="video"?"video/*":"audio/*"} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadFile(file,url=>updateBlock(si,bi,{url}),b.id);e.currentTarget.value=""}} style={{position:"absolute",inset:0,opacity:0}}/></span></label><input style={inputStyle} placeholder="Legenda / texto alternativo" value={b.caption||""} onChange={e=>updateBlock(si,bi,{caption:e.target.value,alt:e.target.value})}/></>}
          {b.type==="gallery"&&<><div style={{display:"flex",gap:8}}><label>Colunas<select style={inputStyle} value={b.columns||3} onChange={e=>updateBlock(si,bi,{columns:Number(e.target.value) as 2|3|4})}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label><label>Layout<select style={inputStyle} value={b.layout||"grid"} onChange={e=>updateBlock(si,bi,{layout:e.target.value as "grid"|"feature"})}><option value="grid">Grade uniforme</option><option value="feature">Colagem</option></select></label></div><label style={labelStyle}><span style={{...buttonStyle,position:"relative"}}>Enviar várias imagens<input type="file" multiple accept="image/*" onChange={e=>{Array.from(e.target.files||[]).forEach(file=>void uploadFile(file,url=>appendGalleryImage(si,bi,url),b.id));e.currentTarget.value=""}} style={{position:"absolute",inset:0,opacity:0}}/></span></label>{(b.items||[]).map((im,ii)=><div key={im.id} style={{display:"flex",gap:6,alignItems:"center"}}><input style={inputStyle} type="url" placeholder="URL da imagem" value={im.url} onChange={e=>updateBlock(si,bi,{items:(b.items||[]).map((x,j)=>j===ii?{...x,url:e.target.value}:x)})}/><button type="button" style={buttonStyle} onClick={()=>updateBlock(si,bi,{items:(b.items||[]).filter((_,j)=>j!==ii)})}>×</button></div>)}<button type="button" style={buttonStyle} onClick={()=>updateBlock(si,bi,{items:[...(b.items||[]),{id:createEditorId(),url:""}]})}>＋ URL de imagem</button></>}
          {b.type==="link"&&<><input style={inputStyle} placeholder="Texto do link" value={b.title||""} onChange={e=>updateBlock(si,bi,{title:e.target.value})}/><input style={inputStyle} type="url" placeholder="URL" value={b.url||""} onChange={e=>updateBlock(si,bi,{url:e.target.value})}/></>}
          {b.type==="divider"&&<hr/>}</div>)}</>}</section>)}
          
    </>
  );
}
