import axios from "axios";
import { getCookie } from "@/utils/cookies";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
      config.headers["x-csrf-token"] = csrf;
    }
  }
  return config;
});