"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { authApi } from "@/services/authApi";
import { fetchCart } from "@/store/cartThunks";

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
        await dispatch(fetchCart());
      } catch {
        if (mounted) dispatch(setUser(null));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);
}
