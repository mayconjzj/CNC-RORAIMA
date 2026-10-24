export default function CategoryLoading() {
  return (
    <main className="editoria-page editoria-loading" role="status" aria-label="Carregando editoria" aria-busy="true">
      <span className="sr-only">Carregando editoria…</span>
      <section className="editoria-content" aria-hidden="true">
        <div className="sk-category-intro">
          <span className="sk-shimmer sk-eyebrow" />
          <span className="sk-shimmer sk-category-title" />
          <span className="sk-shimmer sk-category-description" />
          <span className="sk-category-rule"><i /></span>
        </div>
        <div className="sk-search-panel">
          <span className="sk-shimmer sk-search-input" />
          <span className="sk-shimmer sk-search-filter" />
          <span className="sk-shimmer sk-search-filter" />
          <span className="sk-shimmer sk-search-button" />
        </div>
        <div className="sk-editoria-heading">
          <span className="sk-shimmer sk-section-title" />
          <span className="sk-shimmer sk-results-count" />
        </div>
        <div className="sk-editoria-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <article className="sk-editoria-card" key={index}>
              <div className="sk-editoria-image sk-shimmer" />
              <div className="sk-editoria-copy">
                <span className="sk-shimmer sk-line sk-card-category" />
                <span className="sk-shimmer sk-line sk-card-title" />
                <span className="sk-shimmer sk-line sk-card-title sk-card-title-short" />
                <span className="sk-shimmer sk-line sk-card-excerpt" />
                <span className="sk-shimmer sk-line sk-card-excerpt sk-card-excerpt-short" />
                <span className="sk-shimmer sk-line sk-card-date" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
