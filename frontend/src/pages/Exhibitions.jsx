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
        <p className="text-xs tracking-[0.3em] uppercase font-medium text-white/50 mb-6">2026 — 2027</p>
        <h1 className="font-display font-black tracking-tighter text-5xl md:text-7xl leading-none">{t.exhibitions.title}</h1>
        <p className="mt-6 max-w-xl text-white/60">{t.exhibitions.subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-white/50">{t.exhibitions.none}</p>
      ) : (
        <div className="border-t border-white/10">
          {items.map((e) => (
            <article
              key={e.id}
              data-testid={`exh-row-${e.id}`}
              className="border-b border-white/10 py-12 grid grid-cols-12 gap-6 items-start"
            >
              <div className="col-span-12 md:col-span-2">
                <div className="text-xs tracking-[0.2em] uppercase text-white/50">{formatDate(e.start_date)}</div>
                <div className="text-xs tracking-[0.2em] uppercase text-white/30 mt-1">→ {formatDate(e.end_date)}</div>
              </div>
              <div className="col-span-12 md:col-span-7">
                <h2 className="font-display font-black tracking-tighter text-3xl md:text-4xl leading-none">{pick(e, "title")}</h2>
                {pick(e, "description") && (
                  <p className="mt-4 text-sm text-white/60 max-w-xl">{pick(e, "description")}</p>
                )}
              </div>
              <div className="col-span-12 md:col-span-3 text-right">
                <div className="text-sm text-white/80">{e.venue}</div>
                <div className="text-xs text-white/50 tracking-wide mt-1">{e.city}, {e.country}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
