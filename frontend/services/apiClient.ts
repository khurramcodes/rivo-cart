import axios from "axios";
import { getCookie } from "@/utils/cookies";
import { beginLoading, endLoading } from "@/store/loadingManager";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (!config.skipLoading) {
    const key = config.loadingKey ?? "global";
    config.__loadingKey = key;
    beginLoading(key);
  }
  const method = (config.method ?? "get").toLowerCase();
  const isUnsafe = !["get", "head", "options"].includes(method);
  if (isUnsafe) {
    const csrf = getCookie("XSRF-TOKEN");
    if (csrf) {
      config.headers = config.headers ?? {};
      config.headers["x-csrf-token"] = csrf;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (!response.config.skipLoading) {
      endLoading(response.config.__loadingKey ?? response.config.loadingKey ?? "global");
    }
    return response;
  },
  (error) => {
    const config = error?.config;
    if (config && !config.skipLoading) {
      endLoading(config.__loadingKey ?? config.loadingKey ?? "global");
    }
    return Promise.reject(error);
  }
);


