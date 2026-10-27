"use client";

export default function NewsArchiveLoading() {
  return (
    <main className="all-news-page archive-loading" role="status" aria-label="Carregando notícias">
      <span className="archive-loading-sr-only">Carregando notícias…</span>
      <section className="all-news-content">
        <span className="all-news-eyebrow archive-loading-line archive-loading-eyebrow" />
        <div className="archive-loading-line archive-loading-title" />
        <div className="archive-loading-line archive-loading-intro" />

        <div className="archive-loading-search">
          <div className="archive-loading-search-row">
            <span className="archive-loading-line archive-loading-input" />
            <span className="archive-loading-line archive-loading-button" />
          </div>
          <span className="archive-loading-line archive-loading-filter" />
        </div>

        <div className="all-news-heading archive-loading-heading">
          <span className="archive-loading-line archive-loading-subtitle" />
          <span className="archive-loading-line archive-loading-count" />
        </div>

        <div className="all-news-grid archive-loading-grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <article className="all-news-card archive-loading-card" key={index}>
              <div className="all-news-image archive-loading-image" />
              <div className="all-news-card-copy archive-loading-copy">
                <span className="archive-loading-line archive-loading-category" />
                <span className="archive-loading-line archive-loading-card-title" />
                <span className="archive-loading-line archive-loading-card-title archive-loading-card-title-short" />
                <span className="archive-loading-line archive-loading-excerpt" />
                <span className="archive-loading-line archive-loading-excerpt archive-loading-excerpt-short" />
                <div className="archive-loading-meta">
                  <span className="archive-loading-line" />
                  <span className="archive-loading-line" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        .archive-loading-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .archive-loading-line{display:block;background:linear-gradient(100deg,#eeeeef 25%,#f8f8f9 40%,#eeeeef 65%);background-size:300% 100%;animation:archive-loading-shimmer 1.35s ease-in-out infinite;border-radius:4px}
        .archive-loading-eyebrow{width:150px;height:10px}
        .archive-loading-title{height:54px;width:min(440px,75%);margin-top:12px}
        .archive-loading-intro{height:15px;width:min(570px,95%);margin-top:14px}
        .archive-loading-search{margin:26px 0 32px;padding:18px;background:#fafafa;border:1px solid #e7e7ea;border-radius:10px}
        .archive-loading-search-row{display:flex;align-items:center;gap:12px;min-height:46px;padding:5px 6px 5px 13px;background:#fff;border:1px solid #dcdce1;border-radius:7px}
        .archive-loading-input{height:14px;flex:1}
        .archive-loading-button{height:36px;width:76px;background:#e7e7e9}
        .archive-loading-filter{height:12px;width:125px;margin-top:17px}
        .archive-loading-heading{align-items:center}
        .archive-loading-subtitle{height:25px;width:220px}
        .archive-loading-count{height:11px;width:125px}
        .archive-loading-grid{align-items:stretch}
        .archive-loading-card{min-height:100%;overflow:hidden}
        .archive-loading-image{aspect-ratio:16/9;background:#f0f0f2;border-radius:0}
        .archive-loading-copy{align-items:stretch}
        .archive-loading-category{height:10px;width:38%;margin-bottom:9px}
        .archive-loading-card-title{height:16px;width:100%;margin-bottom:8px}
        .archive-loading-card-title-short{width:72%}
        .archive-loading-excerpt{height:11px;width:100%;margin-top:5px}
        .archive-loading-excerpt-short{width:80%}
        .archive-loading-meta{display:flex;justify-content:space-between;gap:10px;margin-top:auto;padding-top:18px}
        .archive-loading-meta .archive-loading-line{height:10px;width:38%}
        @keyframes archive-loading-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
        @media(max-width:760px){
          .archive-loading-title{height:43px;width:80%}
          .archive-loading-search{padding:13px;margin:22px 0}
          .archive-loading-heading{align-items:flex-start}
          .archive-loading-subtitle{width:44%;height:22px}
          .archive-loading-count{width:31%;margin-top:5px}
          .archive-loading-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
          .archive-loading-copy{padding:12px}
          .archive-loading-card-title{height:14px}
          .archive-loading-excerpt{height:9px}
          .archive-loading-meta{flex-direction:column;gap:7px;padding-top:13px}
          .archive-loading-meta .archive-loading-line{width:62%}
        }
        @media(max-width:420px){
          .archive-loading-title{height:38px;width:90%}
          .archive-loading-intro{height:12px;width:100%}
          .archive-loading-search-row{gap:8px;padding-left:9px}
          .archive-loading-button{width:55px;height:32px}
          .archive-loading-grid{grid-template-columns:1fr;gap:14px}
          .archive-loading-card{display:grid;grid-template-columns:38% minmax(0,1fr)}
          .archive-loading-image{height:100%;min-height:150px;aspect-ratio:auto}
          .archive-loading-copy{padding:12px}
          .archive-loading-card-title{height:12px}
          .archive-loading-excerpt{height:9px;display:block}
          .archive-loading-meta{padding-top:9px;gap:5px 8px;flex-direction:row;flex-wrap:wrap}
          .archive-loading-meta .archive-loading-line{width:42%}
        }
        @media(prefers-reduced-motion:reduce){.archive-loading-line{animation:none}}
      `}</style>
    </main>
  );
}
