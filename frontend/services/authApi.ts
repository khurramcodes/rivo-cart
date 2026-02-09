import { apiClient } from "./apiClient";
import type { User } from "@/types";

type AuthResponse = { user: User; csrfToken?: string };
type RegisterResponse = { message: string };
type VerifyResponse = { message: string };

export const authApi = {
  async register(payload: {
    firstName: string;
    lastName?: string | null;
    email: string;
    password: string;
  }) {
    const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return data;
  },
  async login(payload: { email: string; password: string }) {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    return data;
  },
  async refresh() {
    const { data } = await apiClient.post<AuthResponse>("/auth/refresh", {});
    return data;
  },
  async logout() {
    await apiClient.post("/auth/logout", {});
  },
  async me() {
    const { data } = await apiClient.get<{ user: User }>("/auth/me");
    return data;
  },
  async verifyEmail(payload: { email: string; otp: string }) {
    const { data } = await apiClient.post<VerifyResponse>("/auth/verify-email", payload);
    return data;
  },
  async resendOtp(payload: { email: string }) {
    const { data } = await apiClient.post<VerifyResponse>("/auth/resend-otp", payload);
    return data;
  },
};


