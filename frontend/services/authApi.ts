import { apiClient } from "./apiClient";
import type { User } from "@/types";

type AuthResponse = { user: User; csrfToken?: string };

export const authApi = {
  async register(payload: { name: string; email: string; password: string }) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/register", payload);
    return data;
  },
  async login(payload: { email: string; password: string }) {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/login", payload);
    return data;
  },
  async refresh() {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/refresh", {});
    return data;
  },
  async logout() {
    await apiClient.post("/api/auth/logout", {});
  },
  async me() {
    const { data } = await apiClient.get<{ user: User }>("/api/auth/me");
    return data;
  },
};


