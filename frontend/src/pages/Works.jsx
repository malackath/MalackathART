import React, { useEffect, useState } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export default function Works() {
  const { t, pick } = useLang();
  const [artworks, setArtworks] = useState([]);
  const [seriesOrder, setSeriesOrder] = useState([]);

  useEffect(() => {
    api.get("/artworks").then((r) => setArtworks(r.data)).catch(() => {});
    api.get("/settings").then((r) => {
      // series is now [{name, order}] sorted by order
      const sorted = (r.data.series || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => s.name);
      setSeriesOrder(sorted);
    }).catch(() => {});
  }, []);

  // Group artworks by series
  const grouped = artworks.reduce((acc, a) => {
    const key = a.series || "";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  // Build display order: series from settings first (in order), then any
  // series found in artworks but not in settings, then ungrouped last
  const knownSeries = seriesOrder.filter((name) => grouped[name]);
  const extraSeries = Object.keys(grouped).filter(
    (key) => key !== "" && !seriesOrder.includes(key)
  );
  const orderedSeries = [
    ...knownSeries,
    ...extraSeries,
    ...(grouped[""] ? [""] : []),
  ];

  return (
    <>
    <SEO title="Obras" description="Catálogo completo de obras de Bernardo Arnelli. Acrílico, óleo y técnica mixta sobre lienzo y papel." url="/works" />
        <div data-testid="works-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <header className="mb-16 md:mb-24 fade-up">
        <p
          className="text-xs tracking-[0.3em] uppercase font-medium mb-6"
          style={{ color: "var(--app-text-dim)" }}
        >
          2026
        </p>
        <h1
          className="font-display font-black tracking-tighter text-5xl md:text-7xl leading-none"
          style={{ color: "var(--app-text)" }}
        >
          {t.works.title}
        </h1>
        <p
          className="mt-6 max-w-xl"
          style={{ color: "var(--app-text-soft)" }}
        >
          {t.works.subtitle}
        </p>
      </header>

      <div className="flex flex-col gap-20">
        {orderedSeries.map((serie) => (
          <div key={serie || "__ungrouped__"}>
            {/* Serie header */}
            {serie && (
              <div className="flex items-center gap-6 mb-10">
                <div className="h-px flex-1" style={{ background: "var(--app-border)" }} />
                <span
                  className="text-xs tracking-[0.3em] uppercase font-medium flex-shrink-0"
                  style={{ color: "var(--app-gold)" }}
                >
                  {serie}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--app-border)" }} />
              </div>
            )}

            {/* Grid de obras de esta serie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {grouped[serie].map((a, i) => (
                <Link
                  key={a.id}
                  to={`/works/${a.id}`}
                  data-testid={`works-card-${a.id}`}
                  className="group block fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className="overflow-hidden aspect-[4/5]"
                    style={{ backgroundColor: "var(--app-overlay)" }}
                  >
                    <img
                      src={a.image_url}
                      alt={pick(a, "title")}
                      className="w-full h-full object-cover scale-110 group-hover:scale-[1.18] transition-transform duration-700"
                    />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <div
                        className="font-display font-bold text-xl tracking-tight"
                        style={{ color: "var(--app-text)" }}
                      >
                        {pick(a, "title")}
                      </div>
                      <div
                        className="text-sm mt-1 font-medium"
                        style={{ color: "var(--app-text-soft)" }}
                      >
                        {a.year} · {pick(a, "technique")}
                      </div>
                    </div>
                    <div
                      className="text-[10px] tracking-[0.2em] uppercase font-bold px-2 py-1 border whitespace-nowrap"
                      style={{
                        color: a.available ? "var(--app-text-soft)" : "var(--app-text-muted)",
                        borderColor: a.available ? "var(--app-border-strong)" : "var(--app-border)",
                      }}
                    >
                      {a.available ? t.works.available : t.works.sold}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}