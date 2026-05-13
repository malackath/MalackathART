import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "../lib/api";
import { useLang } from "../contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const CatalogButton = ({ compact = false }) => {
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

  const label = lang === "es" ? "Catálogo" : "Catalogue";

  return (
    <a
      href={pdfUrl}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="catalog-pdf-btn"
      aria-label={label}
      style={{
        backgroundColor: "var(--app-gold)",
        color: "#0a0a0a",
        boxShadow: "0 0 12px rgba(240, 180, 0, 0.4)",
      }}
      className={
        compact
          ? "inline-flex items-center gap-1.5 px-3 py-1.5 font-bold tracking-[0.15em] uppercase text-[10px] md:text-xs transition-all duration-200 hover:scale-[1.03] hover:!bg-[var(--app-gold-hover)]"
          : "inline-flex items-center gap-2 px-4 py-2 font-bold tracking-[0.15em] uppercase text-xs transition-all duration-200 hover:scale-[1.03] hover:!bg-[var(--app-gold-hover)]"
      }
    >
      <Download size={compact ? 12 : 14} />
      <span>{label}</span>
    </a>
  );
};

export default CatalogButton;
