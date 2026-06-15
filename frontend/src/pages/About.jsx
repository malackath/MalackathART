import React, { useEffect, useState } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

const FIRMA = "https://storage.googleapis.com/malackath-art-images/contact/firma.png";

const STATS = [
  { num: "29", label: { es: "obras", en: "artworks" } },
  { num: "3",  label: { es: "exposiciones", en: "exhibitions" } },
  { num: "UY", label: { es: "Montevideo", en: "Montevideo" } },
];

export default function About() {
  const { t, lang } = useLang();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    api.get("/artist").then((r) => setArtist(r.data)).catch(() => {});
  }, []);

  if (!artist) {
    return <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-32" style={{ color: "var(--app-text-dim)" }}>···</div>;
  }

  const bio = lang === "es" ? artist.bio_es : artist.bio_en;
  const heroText = lang === "es" ? (artist.bio_hero_es || "") : (artist.bio_hero_en || "");
  const bodyText = bio || "";

  return (
    <>
    <SEO title="El artista" description="Bernardo Arnelli, pintor uruguayo. Obras expresionistas y surrealistas que traducen lo invisible en imágenes." url="/about" />
        <div data-testid="about-page" className="relative w-full">

      {/* ── HERO — foto full bleed ── */}
      <div className="relative w-full min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={artist.portrait_url}
            alt={artist.name}
            data-testid="about-portrait"
            className="w-full h-full object-cover"
            style={{ objectPosition: "35% center" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to left, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%)" }} />
        </div>

        {/* Eyebrow */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-10 md:pt-16">
          <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
            {t.about.title}
          </p>
        </div>

        {/* Nombre + intro + stats */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pb-16 md:pb-24 min-h-[calc(100svh-6rem)] flex flex-col justify-end">
          <div className="ml-auto max-w-xl text-right fade-up-d1">
            <h1
              data-testid="about-name"
              className="font-display font-black tracking-tighter text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-white"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}
            >
              {artist.name}
            </h1>

            {/* Primera parte de la bio */}
            <div className="mt-6 text-base md:text-lg leading-relaxed text-white/90 prose-art"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
              dangerouslySetInnerHTML={{ __html: heroText }}
            />

            {/* Stats */}
            <div className="mt-8 flex items-center justify-end gap-8 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              {STATS.map((s) => (
                <div key={s.num} className="text-right">
                  <div className="font-display font-black text-3xl text-white leading-none" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                    {s.num}
                  </div>
                  <div className="text-xs tracking-[0.15em] uppercase mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {s.label[lang] || s.label.es}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY — bio completa ── */}
      <div style={{ backgroundColor: "var(--app-bg)" }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20">

          {/* Columna izquierda — decorativa */}
          <div className="md:col-span-4 flex flex-col justify-between gap-8">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "var(--app-text-dim)" }}>
                {lang === "es" ? "El artista" : "The artist"}
              </p>
              <div className="h-px w-12 mb-8" style={{ background: "var(--app-gold)" }} />
              <div className="flex flex-col gap-6">
                {artist.email && (
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "var(--app-text-dim)" }}>Email</p>
                    <a href={`mailto:${artist.email}`} className="text-sm font-medium hover:!text-[var(--app-gold)] transition-colors" style={{ color: "var(--app-text)" }}>
                      {artist.email}
                    </a>
                  </div>
                )}
                {artist.instagram && (
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "var(--app-text-dim)" }}>Instagram</p>
                    <a href={`https://instagram.com/${artist.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium hover:!text-[var(--app-gold)] transition-colors" style={{ color: "var(--app-text)" }}>
                      {artist.instagram}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "var(--app-text-dim)" }}>
                    {lang === "es" ? "Ubicación" : "Location"}
                  </p>
                  <p className="text-sm" style={{ color: "var(--app-text-soft)" }}>Montevideo, Uruguay</p>
                </div>
              </div>
            </div>

            {/* Firma */}
            <img
              src={FIRMA}
              alt="Firma Arnelli"
              className="w-40 opacity-50"
              style={{ filter: "var(--app-signature-filter, invert(1))" }}
            />
          </div>

          {/* Columna derecha — bio completa */}
          <div className="md:col-span-8">
            <div className="text-base md:text-lg leading-relaxed prose-art" style={{ color: "var(--app-text-soft)" }}
              dangerouslySetInnerHTML={{ __html: bodyText || bio }}
            />

            {/* CTA */}
            <div className="mt-14 flex flex-col sm:flex-row gap-4">
              <Link
                to="/works"
                className="inline-flex items-center gap-3 text-xs tracking-[0.25em] uppercase font-medium px-8 py-4 transition-all"
                style={{ backgroundColor: "var(--app-gold)", color: "#0a0a0a" }}
              >
                {lang === "es" ? "Ver catálogo de obras ↗" : "View artwork catalogue ↗"}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 text-xs tracking-[0.25em] uppercase font-medium px-8 py-4 border transition-all hover:!bg-[var(--app-text)] hover:!text-[var(--app-bg)]"
                style={{ borderColor: "var(--app-border-strong)", color: "var(--app-text-soft)" }}
              >
                {lang === "es" ? "Contactar ↗" : "Get in touch ↗"}
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
}