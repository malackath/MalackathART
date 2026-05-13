import React, { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export default function About() {
  const { t, lang } = useLang();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    api.get("/artist").then((r) => setArtist(r.data)).catch(() => {});
  }, []);

  if (!artist) return <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-32 text-white/50">···</div>;

  const bio = lang === "es" ? artist.bio_es : artist.bio_en;

  return (
    <div data-testid="about-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <header className="mb-16 md:mb-20 fade-up">
        <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-6">{t.about.title}</p>
        <h1 className="font-display tracking-tighter text-5xl md:text-7xl leading-none">{artist.name}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-5 fade-up-d1">
          <div className="overflow-hidden bg-white/5">
            <img
              src={artist.portrait_url}
              alt={artist.name}
              data-testid="about-portrait"
              className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 fade-up-d2">
          <div className="text-lg md:text-xl leading-relaxed text-white/80 font-light whitespace-pre-line">
            {bio}
          </div>
          <div className="mt-12 border-t border-white/10 pt-8 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40 tracking-[0.2em] uppercase text-xs">Email</span>
              <a href={`mailto:${artist.email}`} className="text-white hover:text-white/70">{artist.email}</a>
            </div>
            {artist.instagram && (
              <div className="flex justify-between">
                <span className="text-white/40 tracking-[0.2em] uppercase text-xs">Instagram</span>
                <span className="text-white">{artist.instagram}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
