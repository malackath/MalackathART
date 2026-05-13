import React, { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

export default function Contact() {
  const { t } = useLang();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    api.get("/artist").then((r) => setArtist(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="contact-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-32 min-h-[60vh]">
      <header className="mb-16 fade-up">
        <p
          className="text-xs tracking-[0.3em] uppercase font-medium mb-6"
          style={{ color: "var(--app-text-dim)" }}
        >
          2026
        </p>
        <h1
          className="font-display font-black tracking-tighter text-5xl md:text-7xl leading-none"
          style={{ color: "var(--app-text)" }}
        >
          {t.contact.title}
        </h1>
        <p className="mt-6 max-w-xl" style={{ color: "var(--app-text-soft)" }}>
          {t.contact.subtitle}
        </p>
      </header>
      {artist && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl fade-up-d1">
          <div>
            <div
              className="text-xs tracking-[0.2em] uppercase mb-3"
              style={{ color: "var(--app-text-muted)" }}
            >
              {t.contact.email}
            </div>
            <a
              href={`mailto:${artist.email}`}
              data-testid="contact-email"
              className="font-display text-2xl md:text-3xl tracking-tight hover:!text-[var(--app-gold)] transition-colors"
              style={{ color: "var(--app-text)" }}
            >
              {artist.email}
            </a>
          </div>
          {artist.instagram && (
            <div>
              <div
                className="text-xs tracking-[0.2em] uppercase mb-3"
                style={{ color: "var(--app-text-muted)" }}
              >
                {t.contact.instagram}
              </div>
              <div
                className="font-display text-2xl md:text-3xl tracking-tight"
                style={{ color: "var(--app-text)" }}
              >
                {artist.instagram}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
