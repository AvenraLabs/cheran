import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://cheranplast.avenra.org/api");

const rawAxios = axios.create({
  baseURL,
  timeout: 120000, // 2 minutes default timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Bearer token to every request automatically
rawAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("cheran_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Exempt large file uploads and imports from client-side timeout limits
  if (
    config.data instanceof FormData ||
    config.url?.includes("/imports") ||
    config.url?.includes("/upload") ||
    config.headers?.["Content-Type"] === "multipart/form-data"
  ) {
    config.timeout = 0; // Unlimited timeout for Excel bulk processing
  }

  return config;
});

// Global response error handler
rawAxios.interceptors.response.use(
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

// --- In-Flight GET Request Deduplicator & Master Data Cache ---
const inFlightRequests = new Map();
const masterDataCache = new Map();
const MASTER_ENDPOINTS = [
  "/government/statuses",
  "/dealers/options",
  "/proceedings/fund-percentages",
  "/settings/tax-slabs",
  "/units",
  "/items/options",
  "/suppliers/options",
];
const MASTER_TTL_MS = 60 * 1000; // 1 minute in-memory cache for master options

function getRequestKey(url, params) {
  const queryStr = params ? JSON.stringify(params) : "";
  return `${url}?${queryStr}`;
}

export const api = {
  ...rawAxios,
  get: (url, config = {}) => {
    const key = getRequestKey(url, config.params);

    // 1. Check Master Data Cache
    const isMasterEndpoint = MASTER_ENDPOINTS.some((ep) => url.startsWith(ep));
    if (isMasterEndpoint && !config.bypassCache) {
      const cached = masterDataCache.get(key);
      if (cached && Date.now() - cached.timestamp < MASTER_TTL_MS) {
        return Promise.resolve(cached.data);
      }
    }

    // 2. In-Flight Request Deduplication (merges concurrent identical GET requests)
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const promise = rawAxios.get(url, config)
      .then((data) => {
        if (isMasterEndpoint) {
          masterDataCache.set(key, { data, timestamp: Date.now() });
        }
        return data;
      })
      .finally(() => {
        inFlightRequests.delete(key);
      });

    inFlightRequests.set(key, promise);
    return promise;
  },
  post: (url, data, config) => {
    // Invalidate master caches on writes
    masterDataCache.clear();
    return rawAxios.post(url, data, config);
  },
  put: (url, data, config) => {
    masterDataCache.clear();
    return rawAxios.put(url, data, config);
  },
  patch: (url, data, config) => {
    masterDataCache.clear();
    return rawAxios.patch(url, data, config);
  },
  delete: (url, config) => {
    masterDataCache.clear();
    return rawAxios.delete(url, config);
  },
};

export default api;
