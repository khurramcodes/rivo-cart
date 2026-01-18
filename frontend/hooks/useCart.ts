import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, fetchCart, removeItem, updateQuantity } from "@/store/cartThunks";
import type { Product, ProductVariant } from "@/types";

export function useCart() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart.cart);
  const status = useAppSelector((s) => s.cart.status);
  const error = useAppSelector((s) => s.cart.error);

  const refresh = useCallback(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const add = useCallback(
    (product: Product, variant: ProductVariant, quantity?: number) =>
      dispatch(addToCart({ product, variant, quantity })),
    [dispatch],
  );

  const update = useCallback(
    (itemId: string, quantity: number) => dispatch(updateQuantity({ itemId, quantity })),
    [dispatch],
  );

  const remove = useCallback((itemId: string) => dispatch(removeItem({ itemId })), [dispatch]);

  return {
    cart,
    items: cart?.items ?? [],
    status,
    error,
    refresh,
    add,
    update,
    remove,
  };
}
