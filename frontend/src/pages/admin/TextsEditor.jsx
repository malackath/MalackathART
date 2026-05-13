import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { translations } from "../../lib/translations";
import { useLang } from "../../contexts/LanguageContext";
import { toast } from "sonner";
import { Save, RotateCcw, Eye, EyeOff } from "lucide-react";

const SECTIONS = [
  { id: "nav", label: "Navegación", keys: ["nav.works", "nav.exhibitions", "nav.about", "nav.contact"] },
  {
    id: "home",
    label: "Home",
    keys: [
      "home.eyebrow", "home.hero1", "home.hero2", "home.hero3", "home.lead", "home.explore",
      "home.featured", "home.latestWorks", "home.seeAll", "home.upcoming", "home.seeAllExh",
    ],
  },
  { id: "works", label: "Catálogo", keys: ["works.title", "works.subtitle", "works.sold", "works.available"] },
  {
    id: "detail",
    label: "Ficha de obra",
    keys: [
      "detail.year", "detail.technique", "detail.dimensions", "detail.price", "detail.buy",
      "detail.sold", "detail.back", "detail.description", "detail.certificate",
    ],
  },
  { id: "exhibitions", label: "Exposiciones", keys: ["exhibitions.title", "exhibitions.subtitle", "exhibitions.none"] },
  { id: "about", label: "Sobre la artista", keys: ["about.title", "about.contact_label"] },
  { id: "contact", label: "Contacto", keys: ["contact.title", "contact.subtitle", "contact.email", "contact.instagram"] },
  { id: "success", label: "Página de compra", keys: ["success.title", "success.sub", "success.back", "success.processing", "success.failed"] },
  { id: "footer", label: "Pie de página", keys: ["footer.rights"] },
];

const FONT_OPTIONS = [
  { value: "", label: "Predeterminada" },
  { value: "display", label: "Display (Cabinet Grotesk)" },
  { value: "body", label: "Body (Satoshi)" },
  { value: "serif", label: "Serif (Georgia)" },
];

const WEIGHT_OPTIONS = [
  { value: "", label: "Predeterminado" },
  { value: 300, label: "Light · 300" },
  { value: 400, label: "Regular · 400" },
  { value: 500, label: "Medium · 500" },
  { value: 700, label: "Bold · 700" },
  { value: 900, label: "Black · 900" },
];

const getByPath = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
const setByPath = (obj, path, value) => {
  const parts = path.split(".");
  const result = { ...obj };
  let cursor = result;
  for (let i = 0; i < parts.length - 1; i++) {
    cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  return result;
};

export default function TextsEditor() {
  const { reloadTexts } = useLang();
  const [overrides, setOverrides] = useState({ es: {}, en: {} });
  const [styles, setStyles] = useState({});
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get("/site-texts").then((r) => setOverrides(r.data || { es: {}, en: {} }));
    api.get("/text-styles").then((r) => setStyles(r.data?.styles || {}));
  }, []);

  const getValue = (lng, path) => {
    const override = getByPath(overrides[lng] || {}, path);
    if (override !== undefined && override !== null && override !== "") return override;
    return getByPath(translations[lng], path) || "";
  };

  const isOverridden = (lng, path) => {
    const v = getByPath(overrides[lng] || {}, path);
    return v !== undefined && v !== null && v !== "";
  };

  const handleTextChange = (lng, path, value) => {
    const defaultVal = getByPath(translations[lng], path) || "";
    const next = { ...overrides };
    if (value === defaultVal || value === "") {
      next[lng] = setByPath(overrides[lng] || {}, path, "");
    } else {
      next[lng] = setByPath(overrides[lng] || {}, path, value);
    }
    setOverrides(next);
    setDirty(true);
  };

  const handleStyleChange = (path, key, value) => {
    const current = styles[path] || {};
    const updated = { ...current };
    if (value === "" || value === null || value === undefined) {
      delete updated[key];
    } else {
      updated[key] = value;
    }
    const nextStyles = { ...styles };
    if (Object.keys(updated).length === 0) {
      delete nextStyles[path];
    } else {
      nextStyles[path] = updated;
    }
    setStyles(nextStyles);
    setDirty(true);
  };

  const resetField = (path) => {
    const next = {
      es: setByPath(overrides.es || {}, path, ""),
      en: setByPath(overrides.en || {}, path, ""),
    };
    setOverrides(next);
    const ns = { ...styles };
    delete ns[path];
    setStyles(ns);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.put("/site-texts", overrides),
        api.put("/text-styles", { styles }),
      ]);
      toast.success("Textos y estilos guardados");
      setDirty(false);
      reloadTexts();
    } catch (e) {
      toast.error("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const current = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div data-testid="texts-editor" className="grid grid-cols-12 gap-8">
      <aside className="col-span-12 md:col-span-3">
        <div className="text-xs tracking-[0.2em] uppercase text-white/40 mb-4">Secciones</div>
        <div className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              data-testid={`texts-section-${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`text-left px-3 py-2 text-sm transition-colors ${
                activeSection === s.id
                  ? "bg-white text-black font-bold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="col-span-12 md:col-span-9">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-2xl tracking-tight">{current.label}</h3>
          <button
            onClick={save}
            disabled={saving || !dirty}
            data-testid="texts-save"
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#B8860B] hover:bg-[#D4A017] text-black font-bold tracking-[0.15em] uppercase text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        <div className="space-y-8">
          {current.keys.map((path) => {
            const esOver = isOverridden("es", path);
            const enOver = isOverridden("en", path);
            const s = styles[path] || {};
            const hidden = s.hidden === true;
            const styleOverridden = Object.keys(s).length > 0;
            const isLong = path.includes("lead") || path.includes("subtitle") || path.includes("certificate") || path.includes(".sub");

            return (
              <div
                key={path}
                className={`border-b border-white/10 pb-6 ${hidden ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer" data-testid={`texts-visible-${path}`}>
                      <input
                        type="checkbox"
                        checked={!hidden}
                        onChange={(e) => handleStyleChange(path, "hidden", e.target.checked ? "" : true)}
                        className="accent-[#B8860B]"
                      />
                      {hidden ? (
                        <EyeOff size={14} className="text-white/40" />
                      ) : (
                        <Eye size={14} className="text-white/60" />
                      )}
                      <span className="text-[10px] tracking-[0.2em] uppercase text-white/50">
                        {hidden ? "Oculto" : "Visible"}
                      </span>
                    </label>
                    <code className="text-[10px] tracking-[0.15em] uppercase text-white/40">
                      {path}
                    </code>
                  </div>
                  {(esOver || enOver || styleOverridden) && (
                    <button
                      onClick={() => resetField(path)}
                      data-testid={`texts-reset-${path}`}
                      className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  )}
                </div>

                {/* Text inputs ES / EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["es", "en"].map((lng) => (
                    <div key={lng}>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 block mb-2">
                        {lng.toUpperCase()}{" "}
                        {isOverridden(lng, path) && <span className="text-[#B8860B] ml-1">●</span>}
                      </label>
                      {isLong ? (
                        <textarea
                          rows={3}
                          value={getValue(lng, path)}
                          onChange={(e) => handleTextChange(lng, path, e.target.value)}
                          data-testid={`texts-input-${path}-${lng}`}
                          className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getValue(lng, path)}
                          onChange={(e) => handleTextChange(lng, path, e.target.value)}
                          data-testid={`texts-input-${path}-${lng}`}
                          className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Style controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 block mb-1.5">
                      Fuente
                    </label>
                    <select
                      value={s.font || ""}
                      onChange={(e) => handleStyleChange(path, "font", e.target.value)}
                      data-testid={`texts-font-${path}`}
                      className="w-full bg-[#0a0a0a] border border-white/20 focus:border-white outline-none p-2 text-white text-xs"
                    >
                      {FONT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 block mb-1.5">
                      Peso
                    </label>
                    <select
                      value={s.weight || ""}
                      onChange={(e) =>
                        handleStyleChange(path, "weight", e.target.value === "" ? "" : Number(e.target.value))
                      }
                      data-testid={`texts-weight-${path}`}
                      className="w-full bg-[#0a0a0a] border border-white/20 focus:border-white outline-none p-2 text-white text-xs"
                    >
                      {WEIGHT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 block mb-1.5">
                      Tamaño
                    </label>
                    <input
                      type="text"
                      placeholder="ej. 5rem · 80px"
                      value={s.size || ""}
                      onChange={(e) => handleStyleChange(path, "size", e.target.value)}
                      data-testid={`texts-size-${path}`}
                      className="w-full bg-[#0a0a0a] border border-white/20 focus:border-white outline-none p-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 block mb-1.5">
                      Itálica
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer h-[34px]">
                      <input
                        type="checkbox"
                        checked={s.italic === true}
                        onChange={(e) => handleStyleChange(path, "italic", e.target.checked ? true : "")}
                        data-testid={`texts-italic-${path}`}
                        className="accent-[#B8860B]"
                      />
                      <span className="text-xs text-white/70">
                        {s.italic ? "Sí" : "No"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
