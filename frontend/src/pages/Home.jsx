import React, { useEffect, useState, useMemo, useRef } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";
import { ArrowUpRight } from "lucide-react";
import Txt from "../components/Txt";

export default function Home() {
  const { t, lang, pick, isHidden } = useLang();
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [settings, setSettings] = useState({ featured_seconds: 5, recent_works_count: 4 });
  const [slideIdx, setSlideIdx] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    api.get("/artworks").then((r) => setArtworks(r.data)).catch(() => {});
    api.get("/exhibitions").then((r) => setExhibitions(r.data)).catch(() => {});
    api.get("/settings").then((r) => setSettings({
      featured_seconds: r.data?.featured_seconds || 5,
      recent_works_count: r.data?.recent_works_count || 4,
    })).catch(() => {});
  }, []);

  // Build slider: featured first (up to 4), fill with rest
  const slides = useMemo(() => {
    const featured = artworks.filter((a) => a.featured).slice(0, 4);
    const used = new Set(featured.map((a) => a.id));
    const fillers = artworks.filter((a) => !used.has(a.id));
    while (featured.length < 4 && fillers.length > 0) {
      featured.push(fillers.shift());
    }
    return featured.slice(0, Math.min(4, artworks.length));
  }, [artworks]);

  // Auto-rotate
  useEffect(() => {
    if (slides.length < 2) return;
    const ms = Math.max(1, settings.featured_seconds) * 1000;
    intervalRef.current = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, ms);
    return () => clearInterval(intervalRef.current);
  }, [slides.length, settings.featured_seconds]);

  const goToSlide = (i) => {
    setSlideIdx(i);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length < 2) return;
    const ms = Math.max(1, settings.featured_seconds) * 1000;
    intervalRef.current = setInterval(() => {
      setSlideIdx((idx) => (idx + 1) % slides.length);
    }, ms);
  };

  const current = slides[slideIdx];

  const recentCount = settings.recent_works_count || 4;
  const recent = artworks.slice(0, recentCount);

  const formatDate = (iso) => {
    if (!iso) return lang === "es" ? "A confirmar" : "TBC";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <>
    <SEO url="/" />
        <div data-testid="home-page">
      {/* HERO SLIDER */}
      <section className="relative w-full min-h-[88vh] md:min-h-[92vh] overflow-hidden flex items-center">
        {/* Stacked slides */}
        {slides.map((s, i) => (
          <Link
            key={s.id}
            to={`/works/${s.id}`}
            data-testid={`hero-slide-${i}`}
            aria-hidden={i !== slideIdx}
            className="absolute inset-0 z-0 block"
            style={{
              opacity: i === slideIdx ? 1 : 0,
              transition: "opacity 3500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              pointerEvents: i === slideIdx ? "auto" : "none",
            }}
          >
            <img
              src={s.image_url}
              alt={pick(s, "title")}
              className="w-full h-full object-cover scale-105"
              style={{ filter: "brightness(0.78) saturate(1)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45" />
          </Link>
        ))}

        {/* Content overlay */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 py-20 pointer-events-none">
          <div className="fade-up max-w-5xl pointer-events-auto">
            <Txt
              path="home.eyebrow"
              as="p"
              className="text-xs tracking-[0.3em] uppercase text-white/75 mb-8 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
            >
              {t.home.eyebrow}
            </Txt>
            <h1 className="font-display font-black tracking-tighter leading-[0.85] text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
              <Txt path="home.hero1" as="span" className="font-display font-black">
                {t.home.hero1}
              </Txt>
              <br />
              <Txt path="home.hero2" as="span" className="italic font-bold font-display">
                {t.home.hero2}
              </Txt>
              <br />
              <Txt path="home.hero3" as="span" className="font-display font-black">
                {t.home.hero3}
              </Txt>
            </h1>
            <Txt
              path="home.lead"
              as="p"
              className="mt-8 max-w-lg text-base md:text-lg leading-relaxed text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]"
            >
              {t.home.lead}
            </Txt>

            {!isHidden("home.explore") && (
              <Link
                to="/works"
                data-testid="home-explore-btn"
                className="inline-flex items-center gap-3 mt-10 px-7 py-4 text-sm tracking-[0.2em] uppercase font-bold transition-all duration-200 hover:scale-[1.03] shadow-[0_0_14px_rgba(240,180,0,0.55)] hover:shadow-[0_0_22px_rgba(240,180,0,0.85)]"
                style={{ backgroundColor: "var(--app-gold)", color: "#0a0a0a" }}
              >
                <Txt path="home.explore" as="span">
                  {t.home.explore}
                </Txt>
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Featured caption bottom-right */}
        {current && (
          <div className="absolute bottom-20 md:bottom-24 right-6 md:right-12 z-10 text-right pointer-events-none">
            <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-white/65 mb-1 font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              {t.home.featured}
            </p>
            <p className="font-display font-bold text-sm md:text-base text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {pick(current, "title")} · {current.year}
            </p>
          </div>
        )}

        {/* Slider dots */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4"
            data-testid="hero-dots"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                data-testid={`hero-dot-${i}`}
                aria-label={`Slide ${i + 1}`}
                className="group p-2 -m-2"
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: i === slideIdx ? 14 : 12,
                    height: i === slideIdx ? 14 : 12,
                    backgroundColor: i === slideIdx ? "#ffffff" : "rgba(255,255,255,0.4)",
                    boxShadow: i === slideIdx
                      ? "0 0 12px rgba(255,255,255,0.5)"
                      : "none",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* RECENT WORKS - mosaic */}
      <section
        className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 border-t"
        style={{ borderColor: "var(--app-border)" }}
      >
        <div className="flex flex-col mb-12">
          <Txt
            path="home.latestWorks"
            as="h2"
            className="font-display font-bold tracking-tighter text-4xl md:text-5xl whitespace-nowrap"
            style={{ color: "var(--app-text)" }}
          >
            {t.home.latestWorks}
          </Txt>
          {!isHidden("home.seeAll") && (
            <Link
              to="/works"
              data-testid="home-see-all-works"
              className="text-xs tracking-[0.2em] uppercase font-medium border-b pb-1 mt-3 self-start hover:!text-[var(--app-text)]"
              style={{ color: "var(--app-text-soft)", borderColor: "var(--app-border-bold)" }}
            >
              <Txt path="home.seeAll" as="span">{t.home.seeAll}</Txt>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[200px] sm:auto-rows-[260px] md:auto-rows-[320px] gap-4 md:gap-6">
          {recent.map((a, i) => (
            <Link
              key={a.id}
              to={`/works/${a.id}`}
              data-testid={`home-artwork-${i}`}
              className={`group block fade-up overflow-hidden relative ${
                i === 0 ? "col-span-2 row-span-2 lg:col-span-2 lg:row-span-2" : "col-span-1 row-span-1"
              }`}
              style={{ animationDelay: `${i * 70}ms`, backgroundColor: "var(--app-overlay)" }}
            >
              <img
                src={a.image_url}
                alt={pick(a, "title")}
                className="w-full h-full object-cover scale-110 group-hover:scale-[1.18] transition-transform duration-700"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="font-display font-bold text-white text-base md:text-lg">
                  {pick(a, "title")}
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  {a.year}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* UPCOMING EXHIBITIONS */}
      <section
        className="max-w-[1400px] mx-auto px-6 md:px-12 py-24 border-t"
        style={{ borderColor: "var(--app-border)" }}
      >
        <div className="flex flex-col mb-12">
          <Txt
            path="home.upcoming"
            as="h2"
            className="font-display font-bold tracking-tighter text-4xl md:text-5xl whitespace-nowrap"
            style={{ color: "var(--app-text)" }}
          >
            {t.home.upcoming}
          </Txt>
          {!isHidden("home.seeAllExh") && (
            <Link
              to="/exhibitions"
              data-testid="home-see-all-exh"
              className="text-xs tracking-[0.2em] uppercase font-medium border-b pb-1 mt-3 self-start hover:!text-[var(--app-text)]"
              style={{ color: "var(--app-text-soft)", borderColor: "var(--app-border-bold)" }}
            >
              <Txt path="home.seeAllExh" as="span">{t.home.seeAllExh}</Txt>
            </Link>
          )}
        </div>
        <div className="border-t" style={{ borderColor: "var(--app-border)" }}>
          {exhibitions.slice(0, 3).map((e) => (
            <div
              key={e.id}
              data-testid={`home-exh-${e.id}`}
              className="border-b py-8 grid grid-cols-12 gap-4 items-baseline"
              style={{ borderColor: "var(--app-border)" }}
            >
              <div
                className="col-span-12 md:col-span-2 text-xs tracking-[0.2em] uppercase font-medium"
                style={{ color: "var(--app-text-dim)" }}
              >
                {formatDate(e.start_date)}
              </div>
              <div
                className="col-span-12 md:col-span-6 font-display font-bold text-2xl md:text-3xl tracking-tight"
                style={{ color: "var(--app-text)" }}
              >
                {pick(e, "title")}
              </div>
              <div
                className="col-span-6 md:col-span-3 text-sm font-medium"
                style={{ color: "var(--app-text-soft)" }}
              >
                {e.venue}, {e.city}
              </div>
              <div
                className="col-span-6 md:col-span-1 text-xs tracking-[0.2em] uppercase font-medium text-right"
                style={{ color: "var(--app-text-muted)" }}
              >
                {e.country}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
    </>
  );
}