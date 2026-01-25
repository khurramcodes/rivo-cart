import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type LoadingState = {
  activeCount: number;
  keys: Record<string, number>;
};

type LoadingPayload = {
  key?: string;
};

const initialState: LoadingState = {
  activeCount: 0,
  keys: {},
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    startLoading(state, action: PayloadAction<LoadingPayload | undefined>) {
      state.activeCount += 1;
      const key = action.payload?.key;
      if (key) {
        state.keys[key] = (state.keys[key] ?? 0) + 1;
      }
    },
    stopLoading(state, action: PayloadAction<LoadingPayload | undefined>) {
      state.activeCount = Math.max(0, state.activeCount - 1);
      const key = action.payload?.key;
      if (key && state.keys[key]) {
        const next = state.keys[key] - 1;
        if (next <= 0) {
          delete state.keys[key];
        } else {
          state.keys[key] = next;
        }
      }
    },
  },
});

export const { startLoading, stopLoading } = loadingSlice.actions;
export default loadingSlice.reducer;

export const selectIsGlobalLoading = (state: { loading: LoadingState }) =>
  state.loading.activeCount > 0;

export const selectIsLoadingByKey =
  (key: string) => (state: { loading: LoadingState }) =>
    (state.loading.keys[key] ?? 0) > 0;
