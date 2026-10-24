"use client";

import { useRef, type FormEvent } from "react";
import { Check, ImagePlus, LoaderCircle, ShieldCheck, UserRound, X } from "lucide-react";
import styles from "../autores.module.css";

type AuthorFormProps = {
  editing: boolean;
  name: string;
  bio: string;
  avatarUrl: string;
  busy: boolean;
  uploading: boolean;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarUrlChange: (value: string) => void;
  onAvatarFile: (file?: File) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthorForm({
  editing, name, bio, avatarUrl, busy, uploading, onNameChange, onBioChange,
  onAvatarUrlChange, onAvatarFile, onCancel, onSubmit,
}: AuthorFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className={styles.formCard} id="author-form">
      <div className={styles.formHeader}>
        <div className={styles.formTitleIcon}><UserRound size={20} /></div>
        <div><h2>{editing ? "Editar autor" : "Cadastrar novo autor"}</h2><p>Essas informações podem aparecer junto às notícias publicadas.</p></div>
        <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="Fechar formulário"><X size={19} /></button>
      </div>
      <form onSubmit={onSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.avatarColumn}>
            <span className={styles.fieldLabel}>Foto do autor</span>
            <button type="button" className={styles.avatarPicker} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {avatarUrl ? <img src={avatarUrl} alt="Prévia da foto do autor" /> : <span className={styles.avatarPlaceholder}><ImagePlus size={25} /><small>Adicionar foto</small></span>}
              <span className={styles.avatarEdit}><ImagePlus size={14} /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => { onAvatarFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
            <small className={styles.helper}>JPG, PNG, WebP ou AVIF. Até 8 MB.</small>
            {uploading && <small className={styles.uploadStatus}><LoaderCircle size={13} className={styles.spin} /> Enviando imagem…</small>}
            <label className={styles.fieldLabel} htmlFor="avatar-url">Ou URL da foto</label>
            <input id="avatar-url" className={styles.input} type="url" placeholder="https://…" value={avatarUrl} onChange={(event) => onAvatarUrlChange(event.target.value)} />
          </div>
          <div className={styles.fieldsColumn}>
            <label className={styles.fieldLabel} htmlFor="author-name">Nome completo <span>*</span></label>
            <input id="author-name" className={styles.input} autoFocus required minLength={2} maxLength={120} placeholder="Ex.: Maria Oliveira" value={name} onChange={(event) => onNameChange(event.target.value)} />
            <div className={styles.fieldMeta}><span>Nome que será exibido como assinatura</span><span>{name.length}/120</span></div>
            <label className={styles.fieldLabel} htmlFor="author-bio">Biografia profissional</label>
            <textarea id="author-bio" className={styles.textarea} rows={6} maxLength={1200} placeholder="Apresente a trajetória, a área de atuação e as principais credenciais do autor…" value={bio} onChange={(event) => onBioChange(event.target.value)} />
            <div className={styles.fieldMeta}><span>Prefira uma apresentação objetiva e informativa.</span><span>{bio.length}/1200</span></div>
          </div>
        </div>
        <div className={styles.formFooter}>
          <span><ShieldCheck size={15} /> Cadastro disponível apenas à administração.</span>
          <div>
            <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={busy}>Cancelar</button>
            <button type="submit" className={styles.primaryButton} disabled={busy || uploading}>
              {busy ? <LoaderCircle size={17} className={styles.spin} /> : <Check size={17} />}
              {busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar autor"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
