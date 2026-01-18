"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { store } from "./store";
import { useAppDispatch } from "./hooks";
import { fetchCart } from "./cartThunks";
import { cartApi } from "@/services/cartApi";
type LegacyCartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

function parseLegacyCartItems(): { productId: string; variantId: string; quantity: number }[] {
  if (typeof window === "undefined") return [];
  const rawPersist = window.localStorage.getItem("persist:rivo_v1");
  const rawCart = window.localStorage.getItem("persist:cart");

  let items: LegacyCartItem[] = [];

  if (rawPersist) {
    try {
      const root = JSON.parse(rawPersist);
      if (root?.cart) {
        const cartSlice = JSON.parse(root.cart);
        items = Array.isArray(cartSlice?.items) ? cartSlice.items : [];
      }
    } catch {
      // ignore malformed legacy cache
    }
  }

  if (!items.length && rawCart) {
    try {
      const cartSlice = JSON.parse(rawCart);
      items = Array.isArray(cartSlice?.items) ? cartSlice.items : [];
    } catch {
      // ignore malformed legacy cache
    }
  }

  return items
    .filter((item) => item?.productId && item?.variantId && item?.quantity)
    .map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: Number(item.quantity) || 1,
    }));
}

function CartBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (typeof window !== "undefined") {
        const migrated = window.localStorage.getItem("cart_migrated_v1");
        if (!migrated) {
          const legacyItems = parseLegacyCartItems();
          if (legacyItems.length > 0) {
            try {
              await cartApi.migrate(legacyItems);
              window.localStorage.setItem("cart_migrated_v1", "true");
              window.localStorage.removeItem("persist:rivo_v1");
              window.localStorage.removeItem("persist:cart");
            } catch {
              // keep legacy cache so we can retry later
            }
          } else {
            window.localStorage.setItem("cart_migrated_v1", "true");
            window.localStorage.removeItem("persist:rivo_v1");
            window.localStorage.removeItem("persist:cart");
          }
        }
      }
      if (mounted) dispatch(fetchCart());
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CartBootstrap>{children}</CartBootstrap>
    </Provider>
  );
}


