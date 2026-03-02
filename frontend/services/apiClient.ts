import axios from "axios";
import { getCookie } from "@/utils/cookies";

// Fallback to "/api" only if you have Next rewrites/proxy set up.
const baseURL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  const isUnsafe = !["get", "head", "options"].includes(method);
  if (isUnsafe) {
    const csrf = getCookie("XSRF-TOKEN");
    if (csrf) {
      config.headers = config.headers ?? {};
      config.headers["X-XSRF-TOKEN"] = csrf;
    }
  }
  // For FormData, let the browser set Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});