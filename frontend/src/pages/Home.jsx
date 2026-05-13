import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  const { t, lang, pick } = useLang();
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  useEffect(() => {
    api.get("/artworks").then((r) => setArtworks(r.data)).catch(() => {});
    api.get("/exhibitions").then((r) => setExhibitions(r.data)).catch(() => {});
  }, []);

  const featured = artworks.find((a) => a.featured) || artworks[0];
  const recent = artworks.slice(0, 4);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <div className="lg:col-span-7 fade-up">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-8">
              {t.home.eyebrow}
            </p>
            <h1 className="font-display font-light tracking-tighter leading-[0.9] text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
              {t.home.hero1}<br />
              <span className="italic font-light">{t.home.hero2}</span><br />
              {t.home.hero3}
            </h1>
            <p className="mt-10 max-w-lg text-base md:text-lg leading-relaxed text-white/60">
              {t.home.lead}
            </p>
            <Link
              to="/works"
              data-testid="home-explore-btn"
              className="inline-flex items-center gap-3 mt-12 px-7 py-4 border border-white/30 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
            >
              {t.home.explore}
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {featured && (
            <Link
              to={`/works/${featured.id}`}
              data-testid="home-featured-link"
              className="lg:col-span-5 group fade-up-d2 block"
            >
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">
                {t.home.featured}
              </p>
              <div className="overflow-hidden">
                <img
                  src={featured.image_url}
                  alt={pick(featured, "title")}
                  className="w-full h-[420px] md:h-[520px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <div className="font-display text-xl tracking-tight">{pick(featured, "title")}</div>
                  <div className="text-sm text-white/50">{featured.year} · {pick(featured, "technique")}</div>
                </div>
                <ArrowUpRight size={18} className="opacity-60 group-hover:opacity-100 transition" />
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* RECENT WORKS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 border-t border-white/10">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display tracking-tighter text-3xl md:text-5xl">{t.home.latestWorks}</h2>
          <Link
            to="/works"
            data-testid="home-see-all-works"
            className="text-xs tracking-[0.2em] uppercase text-white/70 hover:text-white border-b border-white/30 pb-1"
          >
            {t.home.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {recent.map((a, i) => (
            <Link
              key={a.id}
              to={`/works/${a.id}`}
              data-testid={`home-artwork-${i}`}
              className="group block fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="overflow-hidden aspect-[4/5] bg-white/5">
                <img
                  src={a.image_url}
                  alt={pick(a, "title")}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="mt-3">
                <div className="text-base font-display tracking-tight">{pick(a, "title")}</div>
                <div className="text-xs text-white/40 mt-1">{a.year}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* UPCOMING EXHIBITIONS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 border-t border-white/10">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display tracking-tighter text-3xl md:text-5xl">{t.home.upcoming}</h2>
          <Link
            to="/exhibitions"
            data-testid="home-see-all-exh"
            className="text-xs tracking-[0.2em] uppercase text-white/70 hover:text-white border-b border-white/30 pb-1"
          >
            {t.home.seeAllExh}
          </Link>
        </div>
        <div className="border-t border-white/10">
          {exhibitions.slice(0, 3).map((e) => (
            <div
              key={e.id}
              data-testid={`home-exh-${e.id}`}
              className="border-b border-white/10 py-8 grid grid-cols-12 gap-4 items-baseline group hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-12 md:col-span-2 text-xs tracking-[0.2em] uppercase text-white/50">
                {formatDate(e.start_date)}
              </div>
              <div className="col-span-12 md:col-span-6 font-display text-2xl md:text-3xl tracking-tight">
                {pick(e, "title")}
              </div>
              <div className="col-span-6 md:col-span-3 text-sm text-white/60">
                {e.venue}, {e.city}
              </div>
              <div className="col-span-6 md:col-span-1 text-xs tracking-[0.2em] uppercase text-white/40 text-right">
                {e.country}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
