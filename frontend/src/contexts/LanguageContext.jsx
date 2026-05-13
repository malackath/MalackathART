import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../lib/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("gallery_lang") || "es");

  useEffect(() => {
    localStorage.setItem("gallery_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang((prev) => (prev === "es" ? "en" : "es"));
  const t = translations[lang];

  // Helper to pick localized fields from objects with _en suffix
  const pick = (obj, field) => {
    if (!obj) return "";
    if (lang === "en") return obj[`${field}_en`] || obj[field] || "";
    return obj[field] || "";
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, pick }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
