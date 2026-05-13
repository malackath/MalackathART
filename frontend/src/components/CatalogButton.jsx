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
      className={
        compact
          ? "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0B400] hover:bg-[#FFC83D] text-black font-bold tracking-[0.15em] uppercase text-[10px] md:text-xs transition-all duration-200 hover:scale-[1.03] shadow-[0_0_12px_rgba(240,180,0,0.45)] hover:shadow-[0_0_20px_rgba(240,180,0,0.7)]"
          : "inline-flex items-center gap-2 px-4 py-2 bg-[#F0B400] hover:bg-[#FFC83D] text-black font-bold tracking-[0.15em] uppercase text-xs transition-all duration-200 hover:scale-[1.03] shadow-[0_0_14px_rgba(240,180,0,0.5)] hover:shadow-[0_0_22px_rgba(240,180,0,0.75)]"
      }
    >
      <Download size={compact ? 12 : 14} />
      <span>{label}</span>
    </a>
  );
};

export default CatalogButton;
