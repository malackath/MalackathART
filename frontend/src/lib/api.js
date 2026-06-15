import axios from "axios";

// In production (Cloud Run), backend and frontend are on the same domain
// In development, use REACT_APP_BACKEND_URL env var
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gallery_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
