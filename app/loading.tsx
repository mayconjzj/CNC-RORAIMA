export default function Loading() {
  return (
    <main className="page-loading" role="status" aria-label="Carregando notícias">
      <span className="sr-only">Carregando conteúdo…</span>
      <div className="wrap">
        <div className="loading-bar loading-bar-short" />
        <div className="loading-title" />
        <div className="loading-description" />
        <div className="loading-feature-grid">
          <div className="loading-feature" />
          <div className="loading-side">
            <div className="loading-story" />
            <div className="loading-story" />
          </div>
        </div>
        <div className="loading-card-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="loading-card" key={index}>
              <div className="loading-card-image" />
              <div className="loading-bar" />
              <div className="loading-bar loading-bar-short" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
