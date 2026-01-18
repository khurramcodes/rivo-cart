import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Cart, CartItem, Product, ProductVariant } from "@/types";

type CartState = {
  cart: Cart | null;
  lastSyncedCart: Cart | null;
  status: "idle" | "loading" | "syncing" | "error";
  error?: string;
};

const initialState: CartState = {
  cart: null,
  lastSyncedCart: null,
  status: "idle",
};

function buildOptimisticItem(cartId: string, product: Product, variant: ProductVariant, quantity: number): CartItem {
  const now = new Date().toISOString();
  return {
    id: `temp-${variant.id}`,
    cartId,
    productId: product.id,
    variantId: variant.id,
    quantity,
    priceSnapshot: variant.price,
    createdAt: now,
    updatedAt: now,
    product: { id: product.id, name: product.name, imageUrl: product.imageUrl },
    variant: {
      ...variant,
      attributes: variant.attributes ?? [],
    },
  };
}

function ensureCart(state: CartState) {
  if (state.cart) return state.cart;
  const now = new Date().toISOString();
  state.cart = {
    id: "temp-cart",
    createdAt: now,
    updatedAt: now,
    items: [],
  };
  return state.cart;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<Cart | null>) {
      state.cart = action.payload;
      state.lastSyncedCart = action.payload;
      state.status = "idle";
      state.error = undefined;
    },
    setStatus(state, action: PayloadAction<CartState["status"]>) {
      state.status = action.payload;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
      if (action.payload) state.status = "error";
    },
    optimisticAddItem(
      state,
      action: PayloadAction<{ product: Product; variant: ProductVariant; quantity?: number }>,
    ) {
      const { product, variant, quantity = 1 } = action.payload;
      const cart = ensureCart(state);
      const existing = cart.items.find((i) => i.variantId === variant.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        existing.quantity = Math.max(1, Math.min(variant.stock, nextQty));
        existing.priceSnapshot = variant.price;
      } else {
        cart.items.push(
          buildOptimisticItem(cart.id, product, variant, Math.max(1, Math.min(variant.stock, quantity))),
        );
      }
    },
    optimisticUpdateItem(state, action: PayloadAction<{ itemId: string; quantity: number }>) {
      if (!state.cart) return;
      const item = state.cart.items.find((i) => i.id === action.payload.itemId);
      if (!item) return;
      const stock = item.variant?.stock ?? action.payload.quantity;
      item.quantity = Math.max(1, Math.min(stock, action.payload.quantity));
    },
    optimisticRemoveItem(state, action: PayloadAction<{ itemId: string }>) {
      if (!state.cart) return;
      state.cart.items = state.cart.items.filter((i) => i.id !== action.payload.itemId);
    },
    clearCart(state) {
      state.cart = state.cart
        ? { ...state.cart, items: [] }
        : { id: "temp-cart", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: [] };
      state.lastSyncedCart = state.cart;
      state.status = "idle";
      state.error = undefined;
    },
  },
});

export const { setCart, setStatus, setError, optimisticAddItem, optimisticUpdateItem, optimisticRemoveItem, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;


