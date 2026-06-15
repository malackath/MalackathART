import React, { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export default function About() {
  const { t, lang } = useLang();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    api.get("/artist").then((r) => setArtist(r.data)).catch(() => {});
  }, []);

  if (!artist) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-32 text-white/50">
        ···
      </div>
    );
  }

  const bio = lang === "es" ? artist.bio_es : artist.bio_en;

  return (
    <div data-testid="about-page" className="relative w-full min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Full-bleed portrait background */}
      <div className="absolute inset-0 z-0">
        <img
          src={artist.portrait_url}
          alt={artist.name}
          data-testid="about-portrait"
          className="w-full h-full object-cover scale-105" style={{ objectPosition: "20% center" }}
        />
        {/* Dark gradient overlay for text legibility (heavier on right where text sits) */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Top-left label */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-10 md:pt-16">
        <p
          data-testid="about-eyebrow"
          className="text-xs tracking-[0.3em] uppercase font-medium text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          {t.about.title}
        </p>
      </div>

      {/* Bottom-right text block */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pb-16 md:pb-24 min-h-[calc(100vh-12rem)] flex flex-col justify-end">
        <div className="ml-auto max-w-2xl text-right fade-up-d1">
          <h1
            data-testid="about-name"
            className="font-display font-black tracking-tighter text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]"
          >
            {artist.name}
          </h1>

          <p
            data-testid="about-bio"
            className="mt-8 text-base md:text-lg leading-relaxed text-white whitespace-pre-line drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] [text-shadow:0_1px_5px_rgba(0,0,0,0.85)]"
          >
            {bio}
          </p>

          <div className="mt-10 flex flex-col items-end gap-3 text-sm">
            <a
              href={`mailto:${artist.email}`}
              data-testid="about-email"
              className="text-white hover:text-[#B8860B] transition-colors font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
            >
              {artist.email}
            </a>
            {artist.instagram && (
              <span
                data-testid="about-instagram"
                className="text-white/80 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
              >
                {artist.instagram}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
