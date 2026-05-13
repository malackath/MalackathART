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
      {/* HERO TEXT */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="fade-up max-w-5xl">
          <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-8">
            {t.home.eyebrow}
          </p>
          <h1 className="font-display font-black tracking-tighter leading-[0.85] text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            {t.home.hero1}<br />
            <span className="italic font-bold">{t.home.hero2}</span><br />
            {t.home.hero3}
          </h1>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <p className="max-w-lg text-base md:text-lg leading-relaxed text-white/60">
              {t.home.lead}
            </p>
            <div className="md:text-right">
              <Link
                to="/works"
                data-testid="home-explore-btn"
                className="inline-flex items-center gap-3 px-7 py-4 border border-white/30 text-sm tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-colors"
              >
                {t.home.explore}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED — FULL WIDTH WITH HOVER REVEAL */}
      {featured && (
        <section className="w-full fade-up-d2">
          <Link
            to={`/works/${featured.id}`}
            data-testid="home-featured-link"
            className="block group relative w-full overflow-hidden"
          >
            <div className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden bg-black">
              <img
                src={featured.image_url}
                alt={pick(featured, "title")}
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-all duration-[1200ms] ease-out filter brightness-[0.4] saturate-[0.35] group-hover:brightness-100 group-hover:saturate-100"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30 group-hover:from-black/20 group-hover:to-transparent transition-all duration-[1200ms]" />

              <div className="absolute top-6 md:top-10 left-6 md:left-12 right-6 md:right-12 flex items-start justify-between">
                <p className="text-xs tracking-[0.3em] uppercase text-white/70 font-medium">
                  {t.home.featured}
                </p>
                <ArrowUpRight size={28} className="text-white opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-500" />
              </div>

              <div className="absolute bottom-8 md:bottom-12 left-6 md:left-12 right-6 md:right-12">
                <h2 className="font-display font-black tracking-tighter text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-white">
                  {pick(featured, "title")}
                </h2>
                <div className="mt-3 text-sm md:text-base text-white/70 font-medium tracking-wide">
                  {featured.year} · {pick(featured, "technique")}
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

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
