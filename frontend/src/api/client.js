import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://cheranplast.avenra.org/api");

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Bearer token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cheran_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("cheran_auth_token");
      localStorage.removeItem("cheran_auth_user");
      window.location.href = "/login";
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while communicating with the server";

    console.error("[API Error]", error.response?.data || error);
    return Promise.reject(error.response?.data || { message });
  }
);

export default api;
