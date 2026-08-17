import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while communicating with the server";
    
    // Display error toast if not handled manually
    console.error("[API Error]", error.response?.data || error);
    return Promise.reject(error.response?.data || { message });
  }
);

export default api;
