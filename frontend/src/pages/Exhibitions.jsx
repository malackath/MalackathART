import React, { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export default function Exhibitions() {
  const { t, pick, lang } = useLang();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/exhibitions").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div data-testid="exhibitions-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <header className="mb-16 md:mb-24 fade-up">
        <p
          className="text-xs tracking-[0.3em] uppercase font-medium mb-6"
          style={{ color: "var(--app-text-dim)" }}
        >
          2026 — 2027
        </p>
        <h1
          className="font-display font-black tracking-tighter text-5xl md:text-7xl leading-none"
          style={{ color: "var(--app-text)" }}
        >
          {t.exhibitions.title}
        </h1>
        <p className="mt-6 max-w-xl" style={{ color: "var(--app-text-soft)" }}>
          {t.exhibitions.subtitle}
        </p>
      </header>

      {items.length === 0 ? (
        <p style={{ color: "var(--app-text-muted)" }}>{t.exhibitions.none}</p>
      ) : (
        <div className="border-t" style={{ borderColor: "var(--app-border)" }}>
          {items.map((e) => (
            <article
              key={e.id}
              data-testid={`exh-row-${e.id}`}
              className="border-b py-12 grid grid-cols-12 gap-6 items-start"
              style={{ borderColor: "var(--app-border)" }}
            >
              <div className="col-span-12 md:col-span-2">
                <div
                  className="text-xs tracking-[0.2em] uppercase font-medium"
                  style={{ color: "var(--app-text-dim)" }}
                >
                  {formatDate(e.start_date)}
                </div>
                <div
                  className="text-xs tracking-[0.2em] uppercase mt-1"
                  style={{ color: "var(--app-text-faint)" }}
                >
                  → {formatDate(e.end_date)}
                </div>
              </div>
              <div className="col-span-12 md:col-span-7">
                <h2
                  className="font-display font-black tracking-tighter text-3xl md:text-4xl leading-none"
                  style={{ color: "var(--app-text)" }}
                >
                  {pick(e, "title")}
                </h2>
                {pick(e, "description") && (
                  <p
                    className="mt-4 text-sm max-w-xl"
                    style={{ color: "var(--app-text-soft)" }}
                  >
                    {pick(e, "description")}
                  </p>
                )}
              </div>
              <div className="col-span-12 md:col-span-3 text-right">
                <div className="text-sm" style={{ color: "var(--app-text)" }}>
                  {e.venue}
                </div>
                <div
                  className="text-xs tracking-wide mt-1"
                  style={{ color: "var(--app-text-dim)" }}
                >
                  {e.city}, {e.country}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
