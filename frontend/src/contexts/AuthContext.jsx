import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("gallery_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        const data = res.data;
        if (!data?.role) {
          // Token viejo sin role — limpiar y forzar re-login
          localStorage.removeItem("gallery_token");
          setUser(null);
        } else {
          setUser(data);
        }
      })
      .catch(() => {
        localStorage.removeItem("gallery_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("gallery_token", res.data.access_token);
    setUser({ email: res.data.email, role: res.data.role || "admin" });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("gallery_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
