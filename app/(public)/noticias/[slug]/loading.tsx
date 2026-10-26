import styles from "./article-layout.module.css";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`${styles.shimmer} ${styles.line} ${className}`} />;
}

function LatestNewsSkeleton() {
  return (
    <aside className={styles.latestSidebar} aria-hidden="true">
      <div className={styles.latestHeading}>
        <span className={styles.latestTitle} />
        <span className={styles.latestRule} />
      </div>
      <div className={styles.latestList}>
        {Array.from({ length: 5 }, (_, index) => (
          <div className={styles.latestItem} key={index}>
            <span className={styles.latestImage} />
            <div className={styles.latestCopy}>
              <SkeletonLine className={styles.latestCategory} />
              <SkeletonLine className={styles.latestTitleLine} />
              <SkeletonLine className={`${styles.latestTitleLine} ${styles.latestTitleLineShort}`} />
              <SkeletonLine className={styles.latestDate} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function ArticleLoading() {
  return (
    <main className={styles.articleLoading} role="status" aria-label="Carregando notícia" aria-busy="true">
      <span className={styles.srOnly}>Carregando notícia…</span>
      <div className={styles.articleLayout} aria-hidden="true">
        <article className={styles.articleContent}>
          <div className={styles.skeletonBack} />
          <div className={styles.skeletonCategory} />
          <div className={styles.skeletonTitle}>
            <span className={`${styles.shimmer} ${styles.titleLine} ${styles.titleLineLong}`} />
            <span className={`${styles.shimmer} ${styles.titleLine} ${styles.titleLineMedium}`} />
          </div>
          <div className={styles.skeletonExcerpt}>
            <SkeletonLine className={styles.excerptLineLong} />
            <SkeletonLine className={styles.excerptLineShort} />
          </div>
          <div className={styles.skeletonMeta}>
            <span className={styles.avatar} />
            <div className={styles.metaCopy}>
              <SkeletonLine className={styles.metaName} />
              <SkeletonLine className={styles.metaDate} />
            </div>
            <div className={styles.shareButtons}>
              <span className={styles.shareButton} />
              <span className={styles.shareButton} />
              <span className={styles.shareButton} />
            </div>
          </div>
          <div className={`${styles.shimmer} ${styles.skeletonHero}`} />
          <div className={styles.skeletonBody}>
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonLine
                className={index === 2 ? styles.bodyLineWide : styles.bodyLineFull}
                key={index}
              />
            ))}
            <span className={`${styles.shimmer} ${styles.bodyHeading}`} />
            <SkeletonLine className={styles.bodyLineFull} />
            <SkeletonLine className={styles.bodyLineWide} />
            <SkeletonLine className={styles.bodyLineFull} />
            <SkeletonLine className={styles.bodyLineMedium} />
            <span className={`${styles.shimmer} ${styles.bodyHeading} ${styles.bodyHeadingSecond}`} />
            <SkeletonLine className={styles.bodyLineFull} />
            <SkeletonLine className={styles.bodyLineWide} />
            <SkeletonLine className={styles.bodyLineFull} />
            <SkeletonLine className={styles.bodyLineShort} />
          </div>
        </article>
        <LatestNewsSkeleton />
      </div>
    </main>
  );
}
