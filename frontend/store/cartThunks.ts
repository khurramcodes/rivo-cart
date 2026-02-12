import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Cart, Product, ProductVariant } from "@/types";
import { cartApi } from "@/services/cartApi";
import {
  clearCart,
  optimisticAddItem,
  optimisticRemoveItem,
  optimisticUpdateItem,
  setCart,
  setError,
  setStatus,
} from "./slices/cartSlice";
import type { AppDispatch, RootState } from "./store";

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Cart request failed";
}

const quantityDebounceTimers: Record<
  string,
  ReturnType<typeof setTimeout>
> = {};

export const fetchCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  "cart/fetch",
  async (_arg, { dispatch, rejectWithValue }) => {
    dispatch(setStatus("loading"));
    try {
      const data = await cartApi.getCart();
      dispatch(setCart(data.cart));
      return data.cart;
    } catch (err) {
      dispatch(setError(errorMessage(err)));
      return rejectWithValue(errorMessage(err));
    } finally {
      dispatch(setStatus("idle"));
    }
  },
);

export const addToCart = createAsyncThunk<
  Cart,
  { product: Product; variant: ProductVariant; quantity?: number },
  { state: RootState; rejectValue: string }
>("cart/add", async (payload, { dispatch, getState, rejectWithValue }) => {
  const { product, variant, quantity = 1 } = payload;
  const rollback = getState().cart.lastSyncedCart;
  dispatch(optimisticAddItem({ product, variant, quantity }));
  dispatch(setStatus("syncing"));

  try {
    const data = await cartApi.addItem({
      productId: product.id,
      variantId: variant.id,
      quantity,
    });
    dispatch(setCart(data.cart));
    return data.cart;
  } catch (err) {
    dispatch(setCart(rollback ?? null));
    dispatch(setError(errorMessage(err)));
    return rejectWithValue(errorMessage(err));
  } finally {
    dispatch(setStatus("idle"));
  }
});

export const removeItem = createAsyncThunk<
  Cart,
  { itemId: string },
  { state: RootState; rejectValue: string }
>(
  "cart/remove",
  async ({ itemId }, { dispatch, getState, rejectWithValue }) => {
    const rollback = getState().cart.lastSyncedCart;
    dispatch(optimisticRemoveItem({ itemId }));
    dispatch(setStatus("syncing"));

    try {
      const data = await cartApi.removeItem(itemId);
      dispatch(setCart(data.cart));
      return data.cart;
    } catch (err) {
      dispatch(setCart(rollback ?? null));
      dispatch(setError(errorMessage(err)));
      return rejectWithValue(errorMessage(err));
    } finally {
      dispatch(setStatus("idle"));
    }
  },
);

export const updateQuantity =
  (payload: { itemId: string; quantity: number }) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(optimisticUpdateItem(payload));
    dispatch(setStatus("syncing"));

    if (quantityDebounceTimers[payload.itemId]) {
      clearTimeout(quantityDebounceTimers[payload.itemId]);
    }

    quantityDebounceTimers[payload.itemId] = setTimeout(async () => {
      const rollback = getState().cart.lastSyncedCart;
      try {
        const data = await cartApi.updateItem(payload.itemId, payload.quantity);
        dispatch(setCart(data.cart));
      } catch (err) {
        dispatch(setCart(rollback ?? null));
        dispatch(setError(errorMessage(err)));
      } finally {
        dispatch(setStatus("idle"));
      }
    }, 500);
  };

/**
 * Clears the cart by fetching the latest cart state from the server.
 * Note: After placing an order, the backend already clears the cart,
 * so this just syncs the frontend state with the server.
 */
export const clearCartServer = () => async (dispatch: AppDispatch) => {
  dispatch(setStatus("syncing"));
  try {
    const data = await cartApi.getCart();
    dispatch(setCart(data.cart));
  } catch (err) {
    // If fetching fails, clear local cart state
    dispatch(clearCart());
    dispatch(setError(errorMessage(err)));
  } finally {
    dispatch(setStatus("idle"));
  }
};
