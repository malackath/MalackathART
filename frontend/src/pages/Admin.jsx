import React, { useEffect, useState, useRef } from "react";
import RichTextEditor from "../components/RichTextEditor";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, Upload, GripVertical } from "lucide-react";
import TextsEditor from "./admin/TextsEditor";
import SettingsEditor from "./admin/SettingsEditor";
import ArtistEditor from "./admin/ArtistEditor";
import UsersPanel from "./admin/UsersPanel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ImageField = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 10 MB)");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Backend returns /api/files/{id}; build full URL for public use
      const fullUrl = res.data.url.startsWith("http")
        ? res.data.url
        : `${BACKEND_URL}${res.data.url}`;
      onChange(fullUrl);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error("Error al subir: " + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const fullPreview = value
    ? value.startsWith("http") || value.startsWith("/")
      ? value.startsWith("/api")
        ? `${BACKEND_URL}${value}`
        : value
      : value
    : "";

  return (
    <div data-testid="image-field">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
          {fullPreview ? (
            <img src={fullPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/30 text-xs">sin imagen</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="URL o sube un archivo"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white text-sm"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
            data-testid="image-upload-input"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            data-testid="image-upload-btn"
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>
        </div>
      </div>
    </div>
  );
};

const resolveUrl = (v) =>
  v && (v.startsWith("/api") ? `${BACKEND_URL}${v}` : v);

const MultiImageField = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const list = Array.isArray(value) ? value : [];

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: demasiado grande`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await api.post("/uploads/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const fullUrl = res.data.url.startsWith("http")
          ? res.data.url
          : `${BACKEND_URL}${res.data.url}`;
        uploaded.push(fullUrl);
      } catch (e) {
        toast.error(`Error: ${file.name}`);
      }
    }
    if (uploaded.length) {
      onChange([...list, ...uploaded]);
      toast.success(`${uploaded.length} imagen(es) subida(s)`);
    }
    setUploading(false);
  };

  const removeAt = (i) => {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next);
  };

  return (
    <div data-testid="multi-image-field">
      <div className="flex flex-wrap gap-3 mb-3">
        {list.map((url, i) => (
          <div key={i} className="relative w-20 h-20 bg-white/5">
            <img src={resolveUrl(url)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-black border border-white/40 rounded-full flex items-center justify-center text-white hover:bg-red-600"
              data-testid={`gallery-remove-${i}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        data-testid="gallery-upload-btn"
        className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
      >
        <Upload size={14} />
        {uploading ? "Subiendo..." : "Añadir imágenes"}
      </button>
    </div>
  );
};

const emptyArtwork = {
  title: "", title_en: "", year: new Date().getFullYear(),
  technique: "", technique_en: "", description: "", description_en: "",
  image_url: "", images: [], price: 0, currency: "usd", dimensions: "",
  available: true, featured: false, order: 0,
};
const emptyExh = {
  title: "", title_en: "", venue: "", city: "", country: "",
  start_date: "", end_date: "", description: "", description_en: "", image_url: "",
};

export default function Admin() {
  const { user, logout, loading } = useAuth();
  const { t, siteName } = useLang();
  const [tab, setTab] = useState("artworks");
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  // Drag and drop reordering for artworks (must be declared before any early return)
  const [dragIdx, setDragIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [availableSeries, setAvailableSeries] = useState([]);
  const [bulkSerie, setBulkSerie] = useState("");
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const sendReply = async (m) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/contact/messages/${m.id}/reply`, { body: replyText });
      toast.success(`Respuesta enviada a ${m.email}`);
      setReplyingTo(null);
      setReplyText("");
      load();
    } catch (e) {
      toast.error("Error al enviar: " + (e.response?.data?.detail || e.message));
    } finally {
      setSendingReply(false);
    }
  };

  const load = () => {
    api.get("/artworks").then((r) => setArtworks(r.data));
    api.get("/exhibitions").then((r) => setExhibitions(r.data));
    api.get("/settings").then((r) => setAvailableSeries(r.data?.series || []));
    api.get("/contact/messages").then((r) => {
      setMessages(r.data);
      setUnreadCount(r.data.filter(m => !m.read).length);
    }).catch(() => {});
  };

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div className="p-12 text-white/50">···</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const applyBulkSerie = async () => {
    if (!bulkSerie || selectedIds.length === 0) return;
    setApplyingBulk(true);
    try {
      await api.post("/artworks/bulk-series", { artwork_ids: selectedIds, series: bulkSerie });
      toast.success(`Serie "${bulkSerie}" aplicada a ${selectedIds.length} obras`);
      setSelectedIds([]);
      setBulkSerie("");
      load();
    } catch (e) {
      toast.error("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setApplyingBulk(false);
    }
  };

  const startNew = () => {
    setEditing("new");
    setForm(tab === "artworks" ? { ...emptyArtwork } : { ...emptyExh });
  };
  const startEdit = (item) => {
    setEditing(item.id);
    const copy = { ...item };
    delete copy.id;
    delete copy.created_at;
    delete copy.is_seed;
    if (tab === "artworks" && !Array.isArray(copy.images)) copy.images = [];
    setForm(copy);
  };
  const closeForm = () => { setEditing(null); setForm(null); };

  const save = async () => {
    try {
      const endpoint = tab === "artworks" ? "/artworks" : "/exhibitions";
      if (editing === "new") {
        await api.post(endpoint, form);
        toast.success("Created");
      } else {
        await api.put(`${endpoint}/${editing}`, form);
        toast.success("Updated");
      }
      closeForm();
      load();
    } catch (e) {
      toast.error("Save failed: " + (e.response?.data?.detail || e.message));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    const endpoint = tab === "artworks" ? "/artworks" : "/exhibitions";
    await api.delete(`${endpoint}/${id}`);
    toast.success("Deleted");
    load();
  };

  // Drag and drop reordering for artworks
  const handleDrop = async () => {
    if (dragIdx === null || hoverIdx === null || dragIdx === hoverIdx) {
      setDragIdx(null);
      setHoverIdx(null);
      return;
    }
    const next = [...artworks];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(hoverIdx, 0, moved);
    const reordered = next.map((a, i) => ({ ...a, order: i }));
    setArtworks(reordered);
    setDragIdx(null);
    setHoverIdx(null);
    try {
      await api.put(
        "/artworks/reorder",
        reordered.map((a) => ({ id: a.id, order: a.order }))
      );
      toast.success("Orden actualizado");
    } catch (e) {
      toast.error("Error reordenando");
      load();
    }
  };

  return (
    <div data-testid="admin-page" className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display font-black tracking-tighter text-lg uppercase">{siteName || "·"}</Link>
          <span className="text-xs tracking-[0.2em] uppercase text-white/40">{t.admin.dashboard}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-white/50">{user.email}</span>
          <button
            data-testid="admin-logout"
            onClick={logout}
            className="text-xs tracking-[0.2em] uppercase text-white/70 hover:text-white border border-white/20 px-3 py-1.5"
          >
            {t.admin.logout}
          </button>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="flex items-center gap-6 mb-8 border-b border-white/10 overflow-x-auto">
          {[
            ...(["admin","editor"].includes(user?.role) ? [
              { id: "artworks", label: t.admin.artworks },
              { id: "exhibitions", label: t.admin.exhibitions },
              { id: "artist", label: "Artista" },
              { id: "texts", label: "Textos" },
              { id: "settings", label: "Ajustes" },
            ] : []),
            ...(["admin","mensajes"].includes(user?.role) ? [
              { id: "messages", label: unreadCount > 0 ? `Mensajes (${unreadCount})` : "Mensajes" },
            ] : []),
            ...(user?.role === "admin" ? [
              { id: "users", label: "Usuarios" },
            ] : []),
          ].map((tk) => (
            <button
              key={tk.id}
              data-testid={`admin-tab-${tk.id}`}
              onClick={() => { setTab(tk.id); closeForm(); }}
              className={`pb-3 text-sm tracking-[0.2em] uppercase whitespace-nowrap ${
                tab === tk.id ? "text-white border-b-2 border-white -mb-px" : "text-white/40 hover:text-white/70"
              }`}
            >
              {tk.label}
            </button>
          ))}
          {(tab === "artworks" || tab === "exhibitions") && (
            <button
              data-testid="admin-add"
              onClick={startNew}
              className="ml-auto inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase border border-white/30 px-3 py-2 hover:bg-white hover:text-black transition-colors mb-2"
            >
              <Plus size={14} /> {t.admin.add}
            </button>
          )}
        </div>

        {tab === "texts" ? (
          <TextsEditor />
        ) : tab === "settings" ? (
          <SettingsEditor />
        ) : tab === "artist" ? (
          <ArtistEditor />
        ) : tab === "users" ? (
          <UsersPanel />
        ) : tab === "messages" ? (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-white/40 text-sm">No hay mensajes aún.</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`border p-5 transition-colors ${m.read ? "border-white/10 bg-white/[0.02]" : "border-[#B8860B]/40 bg-[#B8860B]/5"}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        {!m.read && <span className="w-2 h-2 rounded-full bg-[#B8860B] flex-shrink-0" />}
                        <span className="font-bold text-white">{m.name}</span>
                        <span className="text-white/50 text-sm">{m.email}</span>
                      </div>
                      {m.subject && (
                        <div className="text-xs tracking-[0.15em] uppercase text-[#B8860B] mt-1">{m.subject}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-white/40">
                        {new Date(m.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!m.read && (
                        <button
                          onClick={async () => {
                            await api.put(`/contact/messages/${m.id}/read`);
                            load();
                          }}
                          className="text-xs text-white/40 hover:text-white border border-white/20 px-2 py-1 transition-colors"
                        >
                          Marcar leído
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === m.id ? null : m.id);
                          setReplyText("");
                        }}
                        className="text-xs bg-[#B8860B] text-black font-bold px-3 py-1 hover:bg-[#D4A017] transition-colors"
                      >
                        {replyingTo === m.id ? "Cancelar" : "Responder"}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  {replyingTo === m.id && (
                    <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                      <div className="text-xs text-white/40 tracking-[0.15em] uppercase">
                        Respondiendo a {m.email}
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribí tu respuesta..."
                        rows={5}
                        className="w-full bg-black border border-white/20 focus:border-white/60 outline-none p-3 text-white text-sm resize-none"
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="text-xs text-white/40 hover:text-white px-4 py-2 border border-white/20 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => sendReply(m)}
                          disabled={sendingReply || !replyText.trim()}
                          className="text-xs bg-white text-black font-bold px-4 py-2 hover:bg-white/80 transition-colors disabled:opacity-40"
                        >
                          {sendingReply ? "Enviando..." : "Enviar respuesta"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : tab === "artworks" ? (
          <div>
            {/* Bulk series toolbar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 border border-[#B8860B]/40 bg-[#B8860B]/10">
                <span className="text-xs text-white/70">{selectedIds.length} obras seleccionadas</span>
                <select
                  value={bulkSerie}
                  onChange={(e) => setBulkSerie(e.target.value)}
                  className="bg-black border border-white/20 text-white text-xs px-3 py-2 outline-none flex-1 max-w-xs"
                >
                  <option value="">— Asignar serie —</option>
                  <option value="">Sin serie</option>
                  {availableSeries.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={applyBulkSerie}
                  disabled={!bulkSerie && bulkSerie !== "" || applyingBulk}
                  className="px-4 py-2 bg-[#B8860B] text-black text-xs font-bold tracking-[0.15em] uppercase disabled:opacity-40"
                >
                  {applyingBulk ? "Aplicando..." : "Aplicar"}
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>
            )}
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-[0.2em] uppercase text-white/40 border-b border-white/10">
              <tr>
                <th className="py-3 w-8">
                  <input type="checkbox"
                    checked={selectedIds.length === artworks.length && artworks.length > 0}
                    onChange={(e) => setSelectedIds(e.target.checked ? artworks.map(a => a.id) : [])}
                    className="accent-[#B8860B]"
                  />
                </th>
                <th className="w-20">Img</th>
                <th>Title</th>
                <th>Year</th>
                <th>Technique</th>
                <th>Price</th>
                <th>Status</th>
                <th>Serie</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {artworks.map((a, idx) => (
                <tr
                  key={a.id}
                  data-testid={`admin-artwork-${a.id}`}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setHoverIdx(idx); }}
                  onDragEnd={handleDrop}
                  onDrop={handleDrop}
                  className={`border-b border-white/5 transition-colors ${
                    hoverIdx === idx && dragIdx !== null && dragIdx !== idx ? "bg-white/10" : ""
                  } ${dragIdx === idx ? "opacity-40" : ""} ${selectedIds.includes(a.id) ? "bg-[#B8860B]/10" : ""}`}
                >
                  <td className="py-2 w-8">
                    <input type="checkbox"
                      checked={selectedIds.includes(a.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, a.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== a.id));
                      }}
                      className="accent-[#B8860B] w-4 h-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="py-3 cursor-grab text-white/30 hover:text-white/70" data-testid={`drag-handle-${a.id}`}>
                    <GripVertical size={16} />
                  </td>
                  <td><img src={resolveUrl(a.image_url)} alt="" className="w-12 h-12 object-cover" /></td>
                  <td>{a.title}</td>
                  <td className="text-white/60">{a.year}</td>
                  <td className="text-white/60">{a.technique}</td>
                  <td className="text-white/60">${a.price}</td>
                  <td>{a.available ? <span className="text-green-400">●</span> : <span className="text-white/30">sold</span>}</td>
                  <td className="text-white/50 text-xs">{a.series || "—"}</td>
                  <td className="text-right">
                    <button onClick={() => startEdit(a)} className="p-2 text-white/60 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={() => remove(a.id)} className="p-2 text-white/60 hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-[0.2em] uppercase text-white/40 border-b border-white/10">
              <tr>
                <th className="py-3">Title</th>
                <th>Venue</th>
                <th>City</th>
                <th>Start</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {exhibitions.map((e) => (
                <tr key={e.id} data-testid={`admin-exh-${e.id}`} className="border-b border-white/5">
                  <td className="py-3">{e.title}</td>
                  <td className="text-white/60">{e.venue}</td>
                  <td className="text-white/60">{e.city}</td>
                  <td className="text-white/60">{e.start_date}</td>
                  <td className="text-white/60">{e.end_date}</td>
                  <td className="text-right">
                    <button onClick={() => startEdit(e)} className="p-2 text-white/60 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={() => remove(e.id)} className="p-2 text-white/60 hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div data-testid="admin-form-modal" className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto p-6">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl my-12 p-8 relative">
            <button onClick={closeForm} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
            <h2 className="font-display text-2xl mb-8">{editing === "new" ? t.admin.add : t.admin.edit}</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(form).map(([key, val]) => {
                const isArray = Array.isArray(val);
                const isBool = typeof val === "boolean";
                const isNum = typeof val === "number";
                const isLong = key.startsWith("description");
                const isImage = key === "image_url";
                const isGallery = key === "images";
                if (isBool) {
                  return (
                    <label key={key} className="flex items-center gap-3 text-sm text-white/70 col-span-2 md:col-span-1">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      />
                      <span className="tracking-[0.1em] uppercase text-xs">{key}</span>
                    </label>
                  );
                }
                return (
                  <div key={key} className={isLong || isImage || isGallery ? "col-span-2" : "col-span-2 md:col-span-1"}>
                    <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-2">
                      {isGallery ? "images (galería adicional)" : key}
                    </label>
                    {isLong ? (
                      <RichTextEditor
                        value={val || ""}
                        onChange={(html) => setForm({ ...form, [key]: html })}
                      />
                    ) : isImage ? (
                      <ImageField
                        value={val || ""}
                        onChange={(url) => setForm({ ...form, [key]: url })}
                      />
                    ) : isGallery ? (
                      <MultiImageField
                        value={isArray ? val : []}
                        onChange={(arr) => setForm({ ...form, [key]: arr })}
                      />
                    ) : (
                      <input
                        type={isNum ? "number" : "text"}
                        step={key === "price" ? "0.01" : "1"}
                        value={val ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [key]: isNum ? Number(e.target.value) : e.target.value,
                          })
                        }
                        className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex gap-4 justify-end">
              <button onClick={closeForm} className="px-6 py-3 border border-white/20 text-xs tracking-[0.2em] uppercase">
                {t.admin.cancel}
              </button>
              <button
                data-testid="admin-form-save"
                onClick={save}
                className="px-6 py-3 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/80"
              >
                {t.admin.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
