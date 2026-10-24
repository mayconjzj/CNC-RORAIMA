import styles from "../editor.module.css";

export function ArticleEditorLoadingSkeleton() {
  return (
    <div className={styles.editorSkeletonGrid} aria-label="Carregando dados da notícia" aria-busy="true">
      <div className={styles.contentColumn}>
        {[0, 1, 2].map((item) => (
          <section className={styles.card} key={item}>
            <div className={styles.skeletonHeading} />
            <div className={styles.skeletonField} />
            <div className={styles.skeletonField} />
            <div className={styles.skeletonFieldShort} />
          </section>
        ))}
      </div>
      <aside className={styles.sideColumn}>
        <section className={styles.card}>
          <div className={styles.skeletonHeading} />
          <div className={styles.skeletonField} />
          <div className={styles.skeletonField} />
          <div className={styles.skeletonField} />
        </section>
        <section className={styles.stickyActions}>
          <div className={styles.skeletonField} />
          <div className={styles.skeletonField} />
        </section>
      </aside>
    </div>
  );
}
