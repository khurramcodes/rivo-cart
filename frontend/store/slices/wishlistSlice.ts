import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { WishlistItem } from "@/types";
import { wishlistApi } from "@/services/wishlistApi";

type WishlistState = {
  productIds: string[];
  items: WishlistItem[];
  loading: boolean;
  idsLoaded: boolean;
};

const initialState: WishlistState = {
  productIds: [],
  items: [],
  loading: false,
  idsLoaded: false,
};

export const fetchWishlistIds = createAsyncThunk(
  "wishlist/fetchIds",
  async (_, { rejectWithValue }) => {
    try {
      const data = await wishlistApi.getIds();
      return data.productIds;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return rejectWithValue(null);
      }
      return rejectWithValue("Failed to load wishlist");
    }
  }
);

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const data = await wishlistApi.list();
      return data.items;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return rejectWithValue(null);
      }
      return rejectWithValue("Failed to load wishlist");
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await wishlistApi.toggle(productId);
      return { productId, added: data.added };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return rejectWithValue(error.response.data.error.message);
      }
      return rejectWithValue("Failed to update wishlist");
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlist(state) {
      state.productIds = [];
      state.items = [];
      state.idsLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistIds.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.productIds = action.payload;
        state.idsLoaded = true;
      })
      .addCase(fetchWishlistIds.rejected, (state) => {
        state.idsLoaded = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action: PayloadAction<WishlistItem[]>) => {
        state.items = action.payload;
        state.productIds = action.payload.map((i) => i.productId);
        state.loading = false;
      })
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.loading = false;
      })
      .addCase(
        toggleWishlist.fulfilled,
        (state, action: PayloadAction<{ productId: string; added: boolean }>) => {
          const { productId, added } = action.payload;
          if (added) {
            if (!state.productIds.includes(productId)) {
              state.productIds.push(productId);
            }
          } else {
            state.productIds = state.productIds.filter((id) => id !== productId);
            state.items = state.items.filter((i) => i.productId !== productId);
          }
        }
      );
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
