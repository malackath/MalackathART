import React, { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Upload, Download, X, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SettingsEditor() {
  const fileRef = useRef(null);
  const [settings, setSettings] = useState({ catalog_pdf_url: null, catalog_pdf_filename: null });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = () => {
    api.get("/settings").then((r) => setSettings(r.data || {}));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(`Solo PDFs (recibido: ${file.type || "desconocido"})`);
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (file.size > 100 * 1024 * 1024) {
      toast.error(`PDF demasiado grande (${sizeMB.toFixed(1)} MB). Máximo 100 MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);

    try {
      toast.info(`Subiendo ${file.name} (${sizeMB.toFixed(1)} MB)...`);
      const res = await api.post("/uploads/pdf", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10 * 60 * 1000, // 10 minutes for large files
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setProgress(pct);
          }
        },
      });
      const fullUrl = res.data.url.startsWith("http")
        ? res.data.url
        : `${BACKEND_URL}${res.data.url}`;
      await api.put("/settings", {
        catalog_pdf_url: fullUrl,
        catalog_pdf_filename: file.name,
      });
      toast.success(`Catálogo "${file.name}" subido correctamente`);
      load();
    } catch (e) {
      console.error("PDF upload error:", e);
      const msg =
        e.response?.data?.detail ||
        e.message ||
        "Error desconocido al subir el PDF";
      toast.error(`Error: ${msg}`);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeCatalog = async () => {
    if (!window.confirm("¿Quitar el catálogo PDF actual?")) return;
    try {
      await api.put("/settings", { catalog_pdf_url: null, catalog_pdf_filename: null });
      toast.success("Catálogo eliminado");
      load();
    } catch (e) {
      toast.error("Error al eliminar: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div data-testid="settings-editor" className="max-w-3xl">
      <h3 className="font-display font-bold text-2xl tracking-tight mb-2">Catálogo PDF</h3>
      <p className="text-sm text-white/60 mb-8 leading-relaxed">
        Sube tu catálogo en PDF (máx 100 MB). Aparecerá como botón de descarga amarillo abajo a la derecha en todas las páginas del sitio.
      </p>

      {uploading && (
        <div data-testid="upload-progress" className="mb-6 border border-[#B8860B]/40 bg-[#B8860B]/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Upload size={18} className="text-[#B8860B] animate-pulse" />
              <span className="text-sm font-bold text-white">Subiendo PDF...</span>
            </div>
            <span className="font-display font-bold text-2xl text-[#B8860B] tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#B8860B] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-white/50">
            No cierres esta pestaña hasta que termine.
          </p>
        </div>
      )}

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
              <div className="mt-4 flex flex-wrap gap-3">
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
                  disabled={uploading}
                  data-testid="settings-pdf-replace"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  <Upload size={14} /> Reemplazar
                </button>
                <button
                  onClick={removeCatalog}
                  disabled={uploading}
                  data-testid="settings-pdf-remove"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-900/40 text-red-400 text-xs tracking-[0.2em] uppercase font-medium hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <X size={14} /> Quitar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !uploading && (
          <div className="border border-dashed border-white/20 p-12 text-center">
            <FileText size={36} className="mx-auto text-white/30 mb-4" />
            <p className="text-white/50 text-sm mb-6">Aún no has subido un catálogo PDF.</p>
            <button
              onClick={() => fileRef.current?.click()}
              data-testid="settings-pdf-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B8860B] hover:bg-[#D4A017] text-black font-bold tracking-[0.15em] uppercase text-xs transition-colors"
            >
              <Upload size={14} />
              Subir catálogo PDF
            </button>
          </div>
        )
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => handleUpload(e.target.files?.[0])}
        className="hidden"
        data-testid="settings-pdf-input"
      />
    </div>
  );
}
