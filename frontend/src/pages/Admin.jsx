import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const emptyArtwork = {
  title: "", title_en: "", year: new Date().getFullYear(),
  technique: "", technique_en: "", description: "", description_en: "",
  image_url: "", price: 0, currency: "usd", dimensions: "",
  available: true, featured: false, order: 0,
};
const emptyExh = {
  title: "", title_en: "", venue: "", city: "", country: "",
  start_date: "", end_date: "", description: "", description_en: "", image_url: "",
};

export default function Admin() {
  const { user, logout, loading } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState("artworks");
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);

  const load = () => {
    api.get("/artworks").then((r) => setArtworks(r.data));
    api.get("/exhibitions").then((r) => setExhibitions(r.data));
  };

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div className="p-12 text-white/50">···</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const startNew = () => {
    setEditing("new");
    setForm(tab === "artworks" ? { ...emptyArtwork } : { ...emptyExh });
  };
  const startEdit = (item) => {
    setEditing(item.id);
    const copy = { ...item };
    delete copy.id;
    delete copy.created_at;
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

  return (
    <div data-testid="admin-page" className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display tracking-tighter text-lg">ELENA CRUZ</Link>
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
        <div className="flex items-center gap-6 mb-8 border-b border-white/10">
          {["artworks", "exhibitions"].map((tk) => (
            <button
              key={tk}
              data-testid={`admin-tab-${tk}`}
              onClick={() => { setTab(tk); closeForm(); }}
              className={`pb-3 text-sm tracking-[0.2em] uppercase ${
                tab === tk ? "text-white border-b-2 border-white -mb-px" : "text-white/40"
              }`}
            >
              {t.admin[tk]}
            </button>
          ))}
          <button
            data-testid="admin-add"
            onClick={startNew}
            className="ml-auto inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase border border-white/30 px-3 py-2 hover:bg-white hover:text-black transition-colors mb-2"
          >
            <Plus size={14} /> {t.admin.add}
          </button>
        </div>

        {tab === "artworks" ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-[0.2em] uppercase text-white/40 border-b border-white/10">
              <tr>
                <th className="py-3 w-20">Img</th>
                <th>Title</th>
                <th>Year</th>
                <th>Technique</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {artworks.map((a) => (
                <tr key={a.id} data-testid={`admin-artwork-${a.id}`} className="border-b border-white/5">
                  <td className="py-3"><img src={a.image_url} alt="" className="w-12 h-12 object-cover" /></td>
                  <td>{a.title}</td>
                  <td className="text-white/60">{a.year}</td>
                  <td className="text-white/60">{a.technique}</td>
                  <td className="text-white/60">${a.price}</td>
                  <td>{a.available ? <span className="text-green-400">●</span> : <span className="text-white/30">sold</span>}</td>
                  <td className="text-right">
                    <button onClick={() => startEdit(a)} className="p-2 text-white/60 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={() => remove(a.id)} className="p-2 text-white/60 hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                const isBool = typeof val === "boolean";
                const isNum = typeof val === "number";
                const isLong = key.startsWith("description");
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
                  <div key={key} className={isLong ? "col-span-2" : "col-span-2 md:col-span-1"}>
                    <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-2">{key}</label>
                    {isLong ? (
                      <textarea
                        rows={3}
                        value={val || ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full bg-transparent border border-white/20 focus:border-white outline-none p-3 text-white"
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
