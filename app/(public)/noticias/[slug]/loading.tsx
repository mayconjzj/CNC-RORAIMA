import styles from "./article-layout.module.css";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`sk-shimmer sk-line ${className}`} />;
}

function LatestNewsSkeleton() {
  return (
    <aside className={styles.latestSidebar} aria-hidden="true">
      <div className="sk-latest-heading">
        <span className="sk-shimmer sk-latest-title" />
        <span className="sk-shimmer sk-latest-rule" />
      </div>
      <div className="sk-latest-list">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="sk-latest-item" key={index}>
            <span className="sk-shimmer sk-latest-image" />
            <div className="sk-latest-copy">
              <SkeletonLine className="sk-latest-category" />
              <SkeletonLine className="sk-latest-title-line" />
              <SkeletonLine className="sk-latest-title-line sk-latest-title-line-short" />
              <SkeletonLine className="sk-latest-date" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function ArticleLoading() {
  return (
    <main className="article-loading" role="status" aria-label="Carregando notícia" aria-busy="true">
      <span className="sr-only">Carregando notícia…</span>
      <div className={`article-loading-layout ${styles.articleLayout}`} aria-hidden="true">
        <article className={`article-loading-inner ${styles.articleContent}`}>
          <div className="sk-back" />
          <div className="sk-category" />
          <div className="sk-title">
            <span className="sk-shimmer sk-title-line sk-title-line-long" />
            <span className="sk-shimmer sk-title-line sk-title-line-medium" />
          </div>
          <div className="sk-excerpt">
            <SkeletonLine className="sk-excerpt-line-long" />
            <SkeletonLine className="sk-excerpt-line-short" />
          </div>
          <div className="sk-article-meta">
            <span className="sk-shimmer sk-avatar" />
            <div className="sk-meta-copy">
              <SkeletonLine className="sk-meta-name" />
              <SkeletonLine className="sk-meta-date" />
            </div>
            <div className="sk-share">
              <span className="sk-shimmer sk-share-button" />
              <span className="sk-shimmer sk-share-button" />
              <span className="sk-shimmer sk-share-button" />
            </div>
          </div>
          <div className="sk-article-hero sk-shimmer" />
          <div className="sk-article-body">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonLine className={index === 2 ? "sk-body-line-wide" : "sk-body-line-full"} key={index} />
            ))}
            <span className="sk-shimmer sk-body-heading" />
            <SkeletonLine className="sk-body-line-full" />
            <SkeletonLine className="sk-body-line-wide" />
            <SkeletonLine className="sk-body-line-full" />
            <SkeletonLine className="sk-body-line-medium" />
            <span className="sk-shimmer sk-body-heading sk-body-heading-second" />
            <SkeletonLine className="sk-body-line-full" />
            <SkeletonLine className="sk-body-line-wide" />
            <SkeletonLine className="sk-body-line-full" />
            <SkeletonLine className="sk-body-line-short" />
          </div>
        </article>
        <LatestNewsSkeleton />
      </div>
    </main>
  );
}
