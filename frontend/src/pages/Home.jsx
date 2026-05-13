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
      {/* HERO with featured artwork as background */}
      <section className="relative w-full min-h-[88vh] md:min-h-[92vh] overflow-hidden flex items-center group/hero">
        {featured && (
          <Link
            to={`/works/${featured.id}`}
            data-testid="home-featured-link"
            className="absolute inset-0 z-0 block"
            aria-label={pick(featured, "title")}
          >
            <img
              src={featured.image_url}
              alt={pick(featured, "title")}
              className="w-full h-full object-cover scale-105 group-hover/hero:scale-100 transition-all duration-[1500ms] ease-out filter brightness-[0.6] saturate-100 group-hover/hero:brightness-100"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/55 group-hover/hero:from-black/20 group-hover/hero:via-transparent group-hover/hero:to-black/30 transition-all duration-[1500ms]" />
          </Link>
        )}

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 py-20 pointer-events-none">
          <div className="fade-up max-w-5xl pointer-events-auto">
            <p className="text-xs tracking-[0.3em] uppercase text-white/70 mb-8 font-medium">
              {t.home.eyebrow}
            </p>
            <h1 className="font-display font-black tracking-tighter leading-[0.85] text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
              {t.home.hero1}<br />
              <span className="italic font-bold">{t.home.hero2}</span><br />
              {t.home.hero3}
            </h1>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <p className="max-w-lg text-base md:text-lg leading-relaxed text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
                {t.home.lead}
              </p>
              <div className="md:text-right">
                <Link
                  to="/works"
                  data-testid="home-explore-btn"
                  className="inline-flex items-center gap-3 px-7 py-4 bg-white text-black text-sm tracking-[0.2em] uppercase font-bold hover:bg-[#B8860B] hover:text-black transition-colors duration-300"
                >
                  {t.home.explore}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Featured artwork caption (bottom-right) */}
        {featured && (
          <div className="absolute bottom-6 md:bottom-10 right-6 md:right-12 z-10 text-right pointer-events-none">
            <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-white/60 mb-1 font-medium">
              {t.home.featured}
            </p>
            <p className="font-display font-bold text-sm md:text-base text-white">
              {pick(featured, "title")} · {featured.year}
            </p>
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-6 md:left-12 z-10 hidden sm:flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/60 font-medium animate-pulse">
          <span className="w-8 h-px bg-white/40" />
          {lang === "es" ? "Desliza" : "Scroll"}
        </div>
      </section>

      {/* RECENT WORKS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 border-t border-white/10">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display font-bold tracking-tighter text-3xl md:text-5xl">{t.home.latestWorks}</h2>
          <Link
            to="/works"
            data-testid="home-see-all-works"
            className="text-xs tracking-[0.2em] uppercase font-medium text-white/70 hover:text-white border-b border-white/30 pb-1"
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
                  className="w-full h-full object-cover scale-110 group-hover:scale-[1.18] transition-transform duration-700"
                />
              </div>
              <div className="mt-3">
                <div className="text-base font-display font-bold tracking-tight">{pick(a, "title")}</div>
                <div className="text-xs text-white/40 mt-1 font-medium">{a.year}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* UPCOMING EXHIBITIONS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 border-t border-white/10">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display font-bold tracking-tighter text-3xl md:text-5xl">{t.home.upcoming}</h2>
          <Link
            to="/exhibitions"
            data-testid="home-see-all-exh"
            className="text-xs tracking-[0.2em] uppercase font-medium text-white/70 hover:text-white border-b border-white/30 pb-1"
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
              <div className="col-span-12 md:col-span-2 text-xs tracking-[0.2em] uppercase font-medium text-white/50">
                {formatDate(e.start_date)}
              </div>
              <div className="col-span-12 md:col-span-6 font-display font-bold text-2xl md:text-3xl tracking-tight">
                {pick(e, "title")}
              </div>
              <div className="col-span-6 md:col-span-3 text-sm text-white/60 font-medium">
                {e.venue}, {e.city}
              </div>
              <div className="col-span-6 md:col-span-1 text-xs tracking-[0.2em] uppercase font-medium text-white/40 text-right">
                {e.country}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
