import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin — acceso total" },
  { value: "editor", label: "Editor — obras, exposiciones, textos (sin mensajes)" },
  { value: "mensajes", label: "Mensajes — solo bandeja de entrada" },
];

const empty = { name: "", email: "", password: "", role: "editor" };

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/users").then((r) => setUsers(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Completá todos los campos");
      return;
    }
    setSaving(true);
    try {
      await api.post("/users", form);
      toast.success(`Usuario ${form.email} creado`);
      setForm(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`¿Eliminar usuario ${email}?`)) return;
    try {
      await api.delete(`/users/${email}`);
      toast.success("Usuario eliminado");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error");
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-2xl tracking-tight text-white">Usuarios</h3>
          <p className="text-sm text-white/50 mt-1">Gestioná quién tiene acceso al panel de administración.</p>
        </div>
        {!form && (
          <button
            onClick={() => setForm({ ...empty })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8860B] text-black text-xs font-bold tracking-[0.15em] uppercase"
          >
            <Plus size={14} /> Nuevo usuario
          </button>
        )}
      </div>

      {/* Create form */}
      {form && (
        <div className="border border-white/20 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white tracking-wide">Nuevo usuario</h4>
            <button onClick={() => setForm(null)}><X size={16} className="text-white/40 hover:text-white" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-1">Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border border-white/20 focus:border-white outline-none px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-transparent border border-white/20 focus:border-white outline-none px-3 py-2 text-white text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-1">Contraseña</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-transparent border border-white/20 focus:border-white outline-none px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs tracking-[0.2em] uppercase text-white/40 block mb-1">Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-black border border-white/20 focus:border-white outline-none px-3 py-2 text-white text-sm">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleCreate} disabled={saving}
            className="px-6 py-2 bg-[#B8860B] text-black text-xs font-bold tracking-[0.15em] uppercase disabled:opacity-40">
            {saving ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      )}

      {/* Users list */}
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs tracking-[0.2em] uppercase text-white/40">
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Rol</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-b border-white/5">
                <td className="py-3 px-4 text-white">{u.name || "—"}</td>
                <td className="py-3 px-4 text-white/60">{u.email}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 border ${
                    u.role === "admin" ? "border-[#B8860B] text-[#B8860B]" :
                    u.role === "editor" ? "border-blue-500/50 text-blue-400" :
                    "border-green-500/50 text-green-400"
                  }`}>
                    {u.role || "admin"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {u.role !== "admin" && (
                    <button onClick={() => handleDelete(u.email)}
                      className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
