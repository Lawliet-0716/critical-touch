import axios from "axios";

const api = axios.create({
  baseURL: "https://critical-touch.onrender.com/api", // ✅ production API
});

// 🔐 Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
