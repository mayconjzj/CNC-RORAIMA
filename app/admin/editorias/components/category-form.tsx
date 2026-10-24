"use client";

import type { FormEvent } from "react";
import { Check, FolderKanban, Hash, LoaderCircle, ShieldCheck, X } from "lucide-react";
import styles from "../editorias.module.css";

type CategoryFormProps = {
  editingId: string | null;
  name: string;
  busy: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function slugPreview(value: string) {
  return value.trim()
    ? value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "nome-da-editoria";
}

export function CategoryForm({ editingId, name, busy, onNameChange, onClose, onSubmit }: CategoryFormProps) {
  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <span className={styles.formIcon}><FolderKanban size={20} /></span>
        <div>
          <h2>{editingId ? "Editar editoria" : "Criar nova editoria"}</h2>
          <p>Escolha um nome simples e fácil de entender para os leitores.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar formulário">
          <X size={19} />
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <div className={styles.formBody}>
          <label className={styles.fieldLabel} htmlFor="category-name">Nome da editoria <span>*</span></label>
          <input id="category-name" className={styles.input} autoFocus required minLength={2} maxLength={60}
            placeholder="Ex.: Economia, Política, Cultura…" value={name} onChange={(event) => onNameChange(event.target.value)} />
          <div className={styles.fieldMeta}>
            <span>Use um nome curto e reconhecível.</span><span>{name.length}/60</span>
          </div>
          <div className={styles.slugPreview}>
            <span className={styles.slugIcon}><Hash size={16} /></span>
            <div>
              <small>IDENTIFICADOR DA EDITORIA</small><strong>{slugPreview(name)}</strong>
              <p>O endereço público é gerado automaticamente pelo sistema.</p>
            </div>
          </div>
        </div>
        <div className={styles.formFooter}>
          <span><ShieldCheck size={15} /> Somente administradores podem alterar editorias.</span>
          <div>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>Cancelar</button>
            <button type="submit" className={styles.primaryButton} disabled={busy}>
              {busy ? <LoaderCircle size={17} className={styles.spin} /> : <Check size={17} />}
              {busy ? "Salvando…" : editingId ? "Salvar alterações" : "Criar editoria"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
