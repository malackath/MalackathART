import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { translations } from "../../lib/translations";
import { useLang } from "../../contexts/LanguageContext";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

// Group structure of editable text keys. Each entry is a dotted path.
const SECTIONS = [
  {
    id: "nav",
    label: "Navegación",
    keys: ["nav.works", "nav.exhibitions", "nav.about", "nav.contact"],
  },
  {
    id: "home",
    label: "Home",
    keys: [
      "home.eyebrow",
      "home.hero1",
      "home.hero2",
      "home.hero3",
      "home.lead",
      "home.explore",
      "home.featured",
      "home.latestWorks",
      "home.seeAll",
      "home.upcoming",
      "home.seeAllExh",
    ],
  },
  {
    id: "works",
    label: "Catálogo",
    keys: ["works.title", "works.subtitle", "works.sold", "works.available"],
  },
  {
    id: "detail",
    label: "Ficha de obra",
    keys: [
      "detail.year",
      "detail.technique",
      "detail.dimensions",
      "detail.price",
      "detail.buy",
      "detail.sold",
      "detail.back",
      "detail.description",
      "detail.certificate",
    ],
  },
  {
    id: "exhibitions",
    label: "Exposiciones",
    keys: ["exhibitions.title", "exhibitions.subtitle", "exhibitions.none"],
  },
  {
    id: "about",
    label: "Sobre la artista",
    keys: ["about.title", "about.contact_label"],
  },
  {
    id: "contact",
    label: "Contacto",
    keys: ["contact.title", "contact.subtitle", "contact.email", "contact.instagram"],
  },
  {
    id: "success",
    label: "Página de compra exitosa",
    keys: ["success.title", "success.sub", "success.back", "success.processing", "success.failed"],
  },
  {
    id: "footer",
    label: "Pie de página",
    keys: ["footer.rights"],
  },
];

const getByPath = (obj, path) => {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
};

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
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get("/site-texts").then((r) => {
      setOverrides(r.data || { es: {}, en: {} });
    });
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

  const handleChange = (lng, path, value) => {
    const defaultVal = getByPath(translations[lng], path) || "";
    const next = { ...overrides };
    // If value equals default, remove override
    if (value === defaultVal || value === "") {
      next[lng] = setByPath(overrides[lng] || {}, path, "");
    } else {
      next[lng] = setByPath(overrides[lng] || {}, path, value);
    }
    setOverrides(next);
    setDirty(true);
  };

  const resetField = (path) => {
    const next = {
      es: setByPath(overrides.es || {}, path, ""),
      en: setByPath(overrides.en || {}, path, ""),
    };
    setOverrides(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/site-texts", overrides);
      toast.success("Textos guardados");
      setDirty(false);
      reloadTexts();
    } catch (e) {
      toast.error("Error al guardar: " + (e.response?.data?.detail || e.message));
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

        <div className="space-y-6">
          {current.keys.map((path) => {
            const esOver = isOverridden("es", path);
            const enOver = isOverridden("en", path);
            const isLong = path.includes("lead") || path.includes("subtitle") || path.includes("certificate") || path.includes(".sub") || path === "success.title";
            return (
              <div key={path} className="border-b border-white/10 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <code className="text-[10px] tracking-[0.15em] uppercase text-white/40">
                    {path}
                  </code>
                  {(esOver || enOver) && (
                    <button
                      onClick={() => resetField(path)}
                      data-testid={`texts-reset-${path}`}
                      className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["es", "en"].map((lng) => (
                    <div key={lng}>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 block mb-2">
                        {lng.toUpperCase()}{" "}
                        {isOverridden(lng, path) && (
                          <span className="text-[#B8860B] ml-1">●</span>
                        )}
                      </label>
                      {isLong ? (
                        <textarea
                          rows={3}
                          value={getValue(lng, path)}
                          onChange={(e) => handleChange(lng, path, e.target.value)}
                          data-testid={`texts-input-${path}-${lng}`}
                          className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getValue(lng, path)}
                          onChange={(e) => handleChange(lng, path, e.target.value)}
                          data-testid={`texts-input-${path}-${lng}`}
                          className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
