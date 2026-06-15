import React, { useEffect, useRef, useState } from "react";
import RichTextEditor from "../../components/RichTextEditor";
import { api } from "../../lib/api";
import { useLang } from "../../contexts/LanguageContext";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const empty = {
  name: "",
  bio_hero_es: "",
  bio_hero_en: "",
  bio_es: "",
  bio_en: "",
  portrait_url: "",
  email: "",
  instagram: "",
};

export default function ArtistEditor() {
  const { reloadTexts } = useLang();
  const fileRef = useRef(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .get("/artist")
      .then((r) => setForm({ ...empty, ...r.data }))
      .catch(() => {});
  }, []);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/artist", form);
      toast.success("Información del artista actualizada");
      reloadTexts();
    } catch (e) {
      toast.error("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 25 MB)");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fullUrl = res.data.url.startsWith("http")
        ? res.data.url
        : `${BACKEND_URL}${res.data.url}`;
      setForm({ ...form, portrait_url: fullUrl });
      toast.success("Foto subida");
    } catch (e) {
      toast.error("Error al subir: " + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = form.portrait_url?.startsWith("/api")
    ? `${BACKEND_URL}${form.portrait_url}`
    : form.portrait_url;

  return (
    <div data-testid="artist-editor" className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display font-bold text-2xl tracking-tight">Información del artista</h3>
        <button
          onClick={save}
          disabled={saving}
          data-testid="artist-save"
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#B8860B] hover:bg-[#D4A017] text-black font-bold tracking-[0.15em] uppercase text-xs disabled:opacity-40 transition-colors"
        >
          <Save size={14} />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Portrait column */}
        <div className="md:col-span-5">
          <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-3">
            Retrato
          </label>
          <div className="aspect-[4/5] bg-white/5 overflow-hidden mb-4 border border-white/10">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="portrait"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                Sin foto
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
            data-testid="artist-image-input"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="artist-image-upload"
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? "Subiendo..." : "Subir foto"}
          </button>
          <input
            type="text"
            placeholder="O pega una URL"
            value={form.portrait_url || ""}
            onChange={(e) => update("portrait_url", e.target.value)}
            className="w-full mt-3 bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white text-xs"
          />
        </div>

        {/* Text fields */}
        <div className="md:col-span-7 space-y-5">
          <Field label="Nombre" testid="artist-name">
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => update("name", e.target.value)}
              data-testid="artist-input-name"
              className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) => update("email", e.target.value)}
              data-testid="artist-input-email"
              className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white"
            />
          </Field>
          <Field label="Instagram">
            <input
              type="text"
              placeholder="@usuario"
              value={form.instagram || ""}
              onChange={(e) => update("instagram", e.target.value)}
              data-testid="artist-input-instagram"
              className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white"
            />
          </Field>
          <Field label="Texto hero — sobre la foto (Español)">
            <RichTextEditor
              value={form.bio_hero_es || ""}
              onChange={(html) => update("bio_hero_es", html)}
            />
          </Field>
          <Field label="Texto hero — sobre la foto (English)">
            <RichTextEditor
              value={form.bio_hero_en || ""}
              onChange={(html) => update("bio_hero_en", html)}
            />
          </Field>
          <Field label="Biografía completa (Español)">
            <RichTextEditor
              value={form.bio_es || ""}
              onChange={(html) => update("bio_es", html)}
            />
          </Field>
          <Field label="Biografía completa (English)">
            <RichTextEditor
              value={form.bio_en || ""}
              onChange={(html) => update("bio_en", html)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-2">
      {label}
    </label>
    {children}
  </div>
);
