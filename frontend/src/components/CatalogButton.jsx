import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "../lib/api";
import { useLang } from "../contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const CatalogButton = () => {
  const { lang } = useLang();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [filename, setFilename] = useState("catalogo.pdf");

  useEffect(() => {
    api
      .get("/settings")
      .then((r) => {
        if (r.data?.catalog_pdf_url) {
          const url = r.data.catalog_pdf_url.startsWith("http")
            ? r.data.catalog_pdf_url
            : `${BACKEND_URL}${r.data.catalog_pdf_url}`;
          setPdfUrl(url);
          if (r.data.catalog_pdf_filename) setFilename(r.data.catalog_pdf_filename);
        }
      })
      .catch(() => {});
  }, []);

  if (!pdfUrl) return null;

  const label = lang === "es" ? "Catálogo PDF" : "PDF Catalogue";

  return (
    <a
      href={pdfUrl}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="catalog-pdf-btn"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 group"
      aria-label={label}
    >
      <div className="flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 bg-[#B8860B] hover:bg-[#D4A017] text-black font-bold tracking-[0.15em] uppercase text-xs md:text-sm shadow-2xl shadow-black/50 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 border border-[#8B6508]">
        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">PDF</span>
      </div>
    </a>
  );
};

export default CatalogButton;
