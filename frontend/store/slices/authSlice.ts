import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";
import { authApi } from "@/services/authApi";

type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error?: string;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
};

export const login = createAsyncThunk("auth/login", async (payload: { email: string; password: string }) => {
  const data = await authApi.login(payload);
  return data.user;
});

export const register = createAsyncThunk(
  "auth/register",
  async (payload: { name: string; email: string; password: string }) => {
    const data = await authApi.register(payload);
    return data.user;
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await authApi.logout();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.status = "loading";
        s.error = undefined;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "authenticated";
      })
      .addCase(login.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message ?? "Login failed";
      })
      .addCase(register.pending, (s) => {
        s.status = "loading";
        s.error = undefined;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "authenticated";
      })
      .addCase(register.rejected, (s, a) => {
        s.status = "error";
        s.error = a.error.message ?? "Register failed";
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.status = "idle";
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;


