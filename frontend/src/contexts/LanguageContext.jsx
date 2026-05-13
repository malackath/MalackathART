import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../lib/translations";
import { api } from "../lib/api";

const LanguageContext = createContext();

// Deep merge override into base (only overrides non-empty string values)
const deepMerge = (base, override) => {
  if (!override || typeof override !== "object") return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const oVal = override[key];
    const bVal = base?.[key];
    if (oVal && typeof oVal === "object" && !Array.isArray(oVal)) {
      result[key] = deepMerge(bVal || {}, oVal);
    } else if (typeof oVal === "string" && oVal.trim() !== "") {
      result[key] = oVal;
    } else if (oVal !== undefined && oVal !== null && oVal !== "") {
      result[key] = oVal;
    }
  }
  return result;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("gallery_lang") || "es");
  const [overrides, setOverrides] = useState({ es: {}, en: {} });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    localStorage.setItem("gallery_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    api
      .get("/site-texts")
      .then((r) => setOverrides(r.data || { es: {}, en: {} }))
      .catch(() => {});
  }, [reloadKey]);

  const toggle = () => setLang((prev) => (prev === "es" ? "en" : "es"));
  const reloadTexts = () => setReloadKey((k) => k + 1);

  const t = deepMerge(translations[lang] || {}, overrides[lang] || {});

  const pick = (obj, field) => {
    if (!obj) return "";
    if (lang === "en") return obj[`${field}_en`] || obj[field] || "";
    return obj[field] || "";
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, pick, reloadTexts, overrides }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
