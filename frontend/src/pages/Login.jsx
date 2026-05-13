import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LanguageContext";

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(t.admin.invalidCreds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display tracking-tighter text-4xl mb-12 text-center">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs tracking-[0.2em] uppercase text-white/50">{t.admin.email}</label>
            <input
              data-testid="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 bg-transparent border-b border-white/30 focus:border-white outline-none py-3 text-white"
            />
          </div>
          <div>
            <label className="text-xs tracking-[0.2em] uppercase text-white/50">{t.admin.password}</label>
            <input
              data-testid="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 bg-transparent border-b border-white/30 focus:border-white outline-none py-3 text-white"
            />
          </div>
          {error && <div data-testid="login-error" className="text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full py-4 border border-white bg-white text-black tracking-[0.2em] uppercase text-sm hover:bg-transparent hover:text-white transition-colors disabled:opacity-50"
          >
            {t.admin.login}
          </button>
        </form>
      </div>
    </div>
  );
}
