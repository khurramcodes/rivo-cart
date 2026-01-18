import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Product, ProductVariant } from "@/types";

export type CartItem = {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  imageUrl: string;
  price: number; // cents
  quantity: number;
  stock: number;
  variantDetails?: string; // e.g., "Weight: 500g, Color: Red"
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

function getVariantDetails(variant: ProductVariant): string {
  if (!variant.attributes || variant.attributes.length === 0) return "";
  return variant.attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
}

function upsertItem(items: CartItem[], item: CartItem) {
  // Match by both productId AND variantId
  const idx = items.findIndex((i) => i.productId === item.productId && i.variantId === item.variantId);
  if (idx >= 0) {
    const nextQty = items[idx].quantity + item.quantity;
    items[idx] = {
      ...items[idx],
      stock: item.stock,
      quantity: Math.max(1, Math.min(item.stock, nextQty)),
    };
  } else {
    items.push({
      ...item,
      quantity: Math.max(1, Math.min(item.stock, item.quantity)),
    });
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<{ product: Product; variant: ProductVariant; quantity?: number }>) {
      const { product, variant, quantity } = action.payload;
      upsertItem(state.items, {
        productId: product.id,
        variantId: variant.id,
        sku: variant.sku,
        name: product.name,
        imageUrl: product.imageUrl,
        price: variant.price,
        stock: variant.stock,
        quantity: quantity ?? 1,
        variantDetails: getVariantDetails(variant),
      });
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; variantId: string }>) {
      state.items = state.items.filter(
        (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId),
      );
    },
    setQuantity(state, action: PayloadAction<{ productId: string; variantId: string; quantity: number }>) {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId,
      );
      if (!item) return;
      item.quantity = Math.max(1, Math.min(item.stock, action.payload.quantity));
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, setQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;


