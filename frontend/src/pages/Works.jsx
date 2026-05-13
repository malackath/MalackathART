import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export default function Works() {
  const { t, pick } = useLang();
  const [artworks, setArtworks] = useState([]);

  useEffect(() => {
    api.get("/artworks").then((r) => setArtworks(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="works-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <header className="mb-16 md:mb-24 fade-up">
        <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6">2026</p>
        <h1 className="font-display tracking-tighter text-5xl md:text-7xl leading-none">
          {t.works.title}
        </h1>
        <p className="mt-6 max-w-xl text-white/60">{t.works.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {artworks.map((a, i) => (
          <Link
            key={a.id}
            to={`/works/${a.id}`}
            data-testid={`works-card-${a.id}`}
            className="group block fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="overflow-hidden aspect-[4/5] bg-white/5">
              <img
                src={a.image_url}
                alt={pick(a, "title")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="mt-4 flex items-start justify-between">
              <div>
                <div className="font-display text-xl tracking-tight">{pick(a, "title")}</div>
                <div className="text-sm text-white/50 mt-1">
                  {a.year} · {pick(a, "technique")}
                </div>
              </div>
              <div
                className={`text-[10px] tracking-[0.2em] uppercase px-2 py-1 ${
                  a.available ? "text-white/70 border border-white/20" : "text-white/40 border border-white/10"
                }`}
              >
                {a.available ? t.works.available : t.works.sold}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
