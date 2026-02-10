import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { Address } from "@/types";
import { addressApi } from "@/services/addressApi";

type AddressState = {
  items: Address[];
  status: "idle" | "loading" | "succeeded" | "error";
  error?: string;
};

const initialState: AddressState = {
  items: [],
  status: "idle",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error.message as string;
  }
  return fallback;
}

export const fetchAddresses = createAsyncThunk("addresses/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await addressApi.list();
    return data.addresses;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Failed to load addresses."));
  }
});

export const addAddress = createAsyncThunk(
  "addresses/add",
  async (
    payload: {
      fullName: string;
      phone: string;
      country: string;
      state: string;
      city: string;
      streetAddress: string;
      postalCode?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await addressApi.create(payload);
      return data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to add address."));
    }
  }
);

export const updateAddress = createAsyncThunk(
  "addresses/update",
  async (
    payload: {
      id: string;
      updates: Partial<{
        fullName: string;
        phone: string;
        country: string;
        state: string;
        city: string;
        streetAddress: string;
        postalCode?: string | null;
        isDefault?: boolean;
      }>;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await addressApi.update(payload.id, payload.updates);
      return data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update address."));
    }
  }
);

export const deleteAddress = createAsyncThunk(
  "addresses/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await addressApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete address."));
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  "addresses/setDefault",
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await addressApi.setDefault(id);
      return data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to set default address."));
    }
  }
);

const addressSlice = createSlice({
  name: "addresses",
  initialState,
  reducers: {
    clearAddresses(state) {
      state.items = [];
      state.status = "idle";
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchAddresses.fulfilled, (state, action: PayloadAction<Address[]>) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = "error";
        state.error = (action.payload as string) ?? "Failed to load addresses.";
      })
      .addCase(addAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        const address = action.payload;
        if (address.isDefault) {
          state.items = state.items.map((item) => ({ ...item, isDefault: false }));
        }
        state.items.unshift(address);
      })
      .addCase(updateAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        const updated = action.payload;
        if (updated.isDefault) {
          state.items = state.items.map((item) =>
            item.id === updated.id ? updated : { ...item, isDefault: false }
          );
        } else {
          state.items = state.items.map((item) => (item.id === updated.id ? updated : item));
        }
      })
      .addCase(deleteAddress.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(setDefaultAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        const updated = action.payload;
        state.items = state.items.map((item) => ({
          ...item,
          isDefault: item.id === updated.id,
        }));
      });
  },
});

export const { clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;
