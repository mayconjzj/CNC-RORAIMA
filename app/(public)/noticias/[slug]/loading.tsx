export default function ArticleLoading() {
  return (
    <main className="article-loading" role="status" aria-label="Carregando notícia" aria-busy="true">
      <span className="sr-only">Carregando notícia…</span>
      <article className="article-loading-inner" aria-hidden="true">
        <div className="sk-back" />
        <div className="sk-category" />
        <div className="sk-title">
          <span className="sk-shimmer sk-title-line sk-title-line-long" />
          <span className="sk-shimmer sk-title-line sk-title-line-medium" />
        </div>
        <div className="sk-excerpt">
          <span className="sk-shimmer sk-line sk-excerpt-line-long" />
          <span className="sk-shimmer sk-line sk-excerpt-line-short" />
        </div>
        <div className="sk-article-meta">
          <span className="sk-shimmer sk-avatar" />
          <div className="sk-meta-copy">
            <span className="sk-shimmer sk-line sk-meta-name" />
            <span className="sk-shimmer sk-line sk-meta-date" />
          </div>
          <div className="sk-share">
            <span className="sk-shimmer sk-share-button" />
            <span className="sk-shimmer sk-share-button" />
            <span className="sk-shimmer sk-share-button" />
          </div>
        </div>
        <div className="sk-article-hero sk-shimmer" />
        <div className="sk-article-body">
          <span className="sk-shimmer sk-line sk-body-line-full" />
          <span className="sk-shimmer sk-line sk-body-line-full" />
          <span className="sk-shimmer sk-line sk-body-line-wide" />
          <span className="sk-shimmer sk-line sk-body-line-full" />
          <span className="sk-shimmer sk-line sk-body-line-medium" />
          <span className="sk-shimmer sk-body-heading" />
          <span className="sk-shimmer sk-line sk-body-line-full" />
          <span className="sk-shimmer sk-line sk-body-line-wide" />
          <span className="sk-shimmer sk-line sk-body-line-full" />
          <span className="sk-shimmer sk-line sk-body-line-short" />
        </div>
      </article>
    </main>
  );
}
