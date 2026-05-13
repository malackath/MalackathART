import React, { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Upload, Download, X, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SettingsEditor() {
  const fileRef = useRef(null);
  const [settings, setSettings] = useState({ catalog_pdf_url: null, catalog_pdf_filename: null });
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.get("/settings").then((r) => setSettings(r.data || {}));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Solo se aceptan archivos PDF");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("PDF demasiado grande (máx 30 MB)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/uploads/pdf", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fullUrl = res.data.url.startsWith("http")
        ? res.data.url
        : `${BACKEND_URL}${res.data.url}`;
      await api.put("/settings", {
        catalog_pdf_url: fullUrl,
        catalog_pdf_filename: file.name,
      });
      toast.success("Catálogo PDF subido");
      load();
    } catch (e) {
      toast.error("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const removeCatalog = async () => {
    if (!window.confirm("¿Quitar el catálogo PDF actual?")) return;
    await api.put("/settings", { catalog_pdf_url: null, catalog_pdf_filename: null });
    toast.success("Catálogo eliminado");
    load();
  };

  return (
    <div data-testid="settings-editor" className="max-w-3xl">
      <h3 className="font-display font-bold text-2xl tracking-tight mb-2">Catálogo PDF</h3>
      <p className="text-sm text-white/60 mb-8 leading-relaxed">
        Sube un PDF de tu catálogo. Aparecerá como botón de descarga (amarillo, abajo a la derecha) en todas las páginas del sitio.
      </p>

      {settings.catalog_pdf_url ? (
        <div className="border border-white/10 p-6 bg-white/[0.02]">
          <div className="flex items-start gap-4">
            <FileText size={32} className="text-[#B8860B] flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg text-white truncate">
                {settings.catalog_pdf_filename || "catalogo.pdf"}
              </div>
              <a
                href={settings.catalog_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/50 hover:text-white underline break-all"
              >
                {settings.catalog_pdf_url}
              </a>
              <div className="mt-4 flex gap-3">
                <a
                  href={settings.catalog_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="settings-pdf-view"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-colors"
                >
                  <Download size={14} /> Ver
                </a>
                <button
                  onClick={() => fileRef.current?.click()}
                  data-testid="settings-pdf-replace"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-colors"
                >
                  <Upload size={14} /> Reemplazar
                </button>
                <button
                  onClick={removeCatalog}
                  data-testid="settings-pdf-remove"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-900/40 text-red-400 text-xs tracking-[0.2em] uppercase font-medium hover:bg-red-900/20 transition-colors"
                >
                  <X size={14} /> Quitar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-white/20 p-12 text-center">
          <FileText size={36} className="mx-auto text-white/30 mb-4" />
          <p className="text-white/50 text-sm mb-6">Aún no has subido un catálogo PDF.</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="settings-pdf-upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#B8860B] hover:bg-[#D4A017] text-black font-bold tracking-[0.15em] uppercase text-xs disabled:opacity-50 transition-colors"
          >
            <Upload size={14} />
            {uploading ? "Subiendo..." : "Subir catálogo PDF"}
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleUpload(e.target.files?.[0])}
        className="hidden"
        data-testid="settings-pdf-input"
      />
    </div>
  );
}
