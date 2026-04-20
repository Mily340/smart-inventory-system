import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// ✅ do not send token for public endpoints
const isPublicUrl = (url = "") =>
  url.startsWith("/public") ||
  url.startsWith("/branches/public") ||
  url.startsWith("/register-request") ||
  url.startsWith("/auth/login");

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.url && !isPublicUrl(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";

    // ✅ only force logout for protected endpoints
    if (status === 401 && !isPublicUrl(url)) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;