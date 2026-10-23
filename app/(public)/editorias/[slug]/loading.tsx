export default function EditorialLoading() {
  return (
    <main className="page-loading" role="status" aria-label="Carregando editoria">
      <span className="sr-only">Carregando editoria…</span>
      <div className="editoria-content">
        <div className="loading-bar loading-bar-short" />
        <div className="loading-title" />
        <div className="loading-description" />
        <div className="loading-bar" style={{ width: "100%", height: 1, marginTop: 28 }} />
        <div className="loading-feature-grid" style={{ gridTemplateColumns: "1fr", marginTop: 24 }}>
          <div className="loading-card-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="loading-card" key={index}>
                <div className="loading-card-image" />
                <div className="loading-bar" />
                <div className="loading-bar loading-bar-short" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
