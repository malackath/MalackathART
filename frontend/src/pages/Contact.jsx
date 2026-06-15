import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../components/SEO";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";

const SUBJECTS = [
  { es: "Consulta sobre una obra", en: "Artwork inquiry" },
  { es: "Encargo / obra a pedido", en: "Commission / custom work" },
  { es: "Exposición o muestra", en: "Exhibition" },
  { es: "Prensa y medios", en: "Press & media" },
  { es: "Otro", en: "Other" },
];

export default function Contact() {
  const { t, lang } = useLang();
  const location = useLocation();
  const [artist, setArtist] = useState(null);
  const obraParam = new URLSearchParams(location.search).get("obra") || "";
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: obraParam ? "Consulta sobre una obra" : "",
    message: obraParam ? `Hola, estoy interesado/a en la obra "${obraParam}". ` : "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  useEffect(() => {
    api.get("/artist").then((r) => setArtist(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/contact", form);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const BG = "https://storage.googleapis.com/malackath-art-images/contact/bg.png";

  return (
    <>
    <SEO title="Contacto" description="Consultá sobre obras, encargos o exposiciones de Bernardo Arnelli." url="/contact" />
        <div data-testid="contact-page" className="relative min-h-screen">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src={BG} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.78) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)" }} />
      </div>
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24">

      {/* Header */}
      <header className="mb-16 md:mb-20 fade-up">
        <p className="text-xs tracking-[0.3em] uppercase font-medium mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Estudio · 2026
        </p>
        <h1 className="font-display font-black tracking-tighter text-5xl md:text-7xl leading-none" style={{ color: "#f5f5f5" }}>
          {t.contact.title}
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          {t.contact.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">

        {/* Formulario */}
        <div className="md:col-span-7 fade-up">
          {status === "success" ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-4" style={{ color: "var(--app-gold)" }}>✓</div>
              <p className="font-display font-bold text-2xl mb-2" style={{ color: "#f5f5f5" }}>
                {lang === "es" ? "Mensaje enviado" : "Message sent"}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                {lang === "es" ? "Bernardo se pondrá en contacto a la brevedad." : "Bernardo will get back to you shortly."}
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-8 text-xs tracking-[0.2em] uppercase border-b pb-0.5 transition-colors hover:!text-[var(--app-text)]"
                style={{ color: "var(--app-text-soft)", borderColor: "var(--app-border-bold)" }}
              >
                {lang === "es" ? "Enviar otro mensaje" : "Send another message"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Nombre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {lang === "es" ? "Nombre" : "Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set("name")}
                    placeholder={lang === "es" ? "Tu nombre" : "Your name"}
                    className="bg-transparent border-b py-3 text-base outline-none transition-colors placeholder:opacity-30 focus:border-white"
                    style={{ color: "#f5f5f5", borderColor: "rgba(255,255,255,0.3)" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    placeholder={lang === "es" ? "tu@email.com" : "your@email.com"}
                    className="bg-transparent border-b py-3 text-base outline-none transition-colors placeholder:opacity-30 focus:border-white"
                    style={{ color: "#f5f5f5", borderColor: "rgba(255,255,255,0.3)" }}
                  />
                </div>
              </div>

              {/* Asunto */}
              <div className="flex flex-col gap-2">
                <label className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {lang === "es" ? "Motivo de contacto" : "Subject"}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.es}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, subject: s.es }))}
                      className="text-xs tracking-[0.12em] uppercase px-3 py-1.5 border transition-all"
                      style={{
                        borderColor: form.subject === s.es ? "var(--app-text)" : "var(--app-border-strong)",
                        color: form.subject === s.es ? "var(--app-text)" : "var(--app-text-soft)",
                        backgroundColor: form.subject === s.es ? "var(--app-text)" : "transparent",
                        color: form.subject === s.es ? "var(--app-bg)" : "var(--app-text-soft)",
                      }}
                    >
                      {lang === "es" ? s.es : s.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensaje */}
              <div className="flex flex-col gap-2">
                <label className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {lang === "es" ? "Mensaje" : "Message"} *
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  placeholder={lang === "es" ? "Escribí tu consulta..." : "Write your message..."}
                  className="bg-transparent border-b py-3 text-base outline-none transition-colors placeholder:opacity-30 resize-none focus:border-white"
                  style={{ color: "#f5f5f5", borderColor: "rgba(255,255,255,0.3)" }}
                />
              </div>

              {status === "error" && (
                <p className="text-sm" style={{ color: "#ff6b6b" }}>
                  {lang === "es" ? "Hubo un error. Intentá de nuevo o escribí directamente al email." : "Something went wrong. Try again or email directly."}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="flex items-center gap-3 text-xs tracking-[0.25em] uppercase font-medium px-8 py-4 transition-all disabled:opacity-50"
                style={{ backgroundColor: "var(--app-gold)", color: "#0a0a0a" }}
              >
                {status === "sending"
                  ? (lang === "es" ? "Enviando..." : "Sending...")
                  : (lang === "es" ? "Enviar mensaje ↗" : "Send message ↗")}
              </button>
            </form>
          )}
        </div>

        {/* Info lateral */}
        <div className="md:col-span-5 fade-up-d1 flex flex-col gap-10 md:pt-2">
          <div className="h-px w-full md:hidden" style={{ background: "var(--app-border)" }} />

          {artist && (
            <>
              <div>
                <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Email
                </p>
                <a
                  href={`mailto:${artist.email}`}
                  className="text-lg font-medium hover:!text-[var(--app-gold)] transition-colors"
                  style={{ color: "#f5f5f5" }}
                >
                  {artist.email}
                </a>
              </div>

              {artist.instagram && (
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Instagram
                  </p>
                  <a
                    href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium hover:!text-[var(--app-gold)] transition-colors"
                    style={{ color: "#f5f5f5" }}
                  >
                    {artist.instagram}
                  </a>
                </div>
              )}
            </>
          )}

          <div className="h-px w-full" style={{ background: "var(--app-border)" }} />

          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              {lang === "es" ? "Tiempo de respuesta" : "Response time"}
            </p>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.75)" }}>
              {lang === "es" ? "Generalmente dentro de las 48 horas." : "Usually within 48 hours."}
            </p>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              {lang === "es" ? "Encargos" : "Commissions"}
            </p>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.75)" }}>
              {lang === "es"
                ? "Bernardo acepta obras a pedido. Consultá por disponibilidad y tiempos."
                : "Bernardo accepts commissions. Ask about availability and timeframes."}
            </p>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              {lang === "es" ? "Ubicación" : "Location"}
            </p>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.75)" }}>
              Montevideo, Uruguay
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
    </>
  );
}