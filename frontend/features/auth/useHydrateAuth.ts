"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { authApi } from "@/services/authApi";
import { fetchCart } from "@/store/cartThunks";
import { fetchWishlistIds } from "@/store/slices/wishlistSlice";

let didHydrate = false;

export function useHydrateAuth() {
  const dispatch = useAppDispatch();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || didHydrate) return;
    hydratedRef.current = true;
    didHydrate = true;

    let mounted = true;

    (async () => {
      try {
        const me = await authApi.me();
        if (!mounted) return;
        dispatch(setUser(me.user));
        await Promise.all([
          dispatch(fetchCart()),
          dispatch(fetchWishlistIds()),
        ]);
      } catch {
        if (mounted) {
          dispatch(setUser(null));
          // Guest users: still fetch cart so session_id cookie restores their cart
          await dispatch(fetchCart());
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);
}
