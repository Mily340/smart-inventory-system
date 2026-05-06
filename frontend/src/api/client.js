// frontend/src/api/client.js
import axios from "axios";

const INACTIVE_BRANCH_MESSAGE =
  "Your branch is inactive or deactivated for now. Please contact the respective authority.";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
});

const isPublicUrl = (url = "") =>
  url.startsWith("/public") ||
  url.startsWith("/branches/public") ||
  url.startsWith("/register-request") ||
  url.startsWith("/auth/login");

const clearAuthStorage = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("fullName");
  sessionStorage.removeItem("branchId");
  sessionStorage.removeItem("branchName");
  sessionStorage.removeItem("branchIsActive");

  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("fullName");
  localStorage.removeItem("branchId");
  localStorage.removeItem("branchName");
  localStorage.removeItem("branchIsActive");
};

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

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
    const message = err?.response?.data?.message || "";

    if (status === 403 && message === INACTIVE_BRANCH_MESSAGE) {
      sessionStorage.setItem("branchIsActive", "false");

      if (window.location.pathname !== "/branch-inactive") {
        window.location.href = "/branch-inactive";
      }
    }

    if (status === 401 && !isPublicUrl(url)) {
      clearAuthStorage();
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default client;