"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { authApi } from "@/services/authApi";

export function useHydrateAuth() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status !== "idle") return;
    let mounted = true;
    (async () => {
      try {
        const me = await authApi.me();
        if (mounted) dispatch(setUser(me.user));
      } catch {
        // not logged in
        if (mounted) dispatch(setUser(null));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch, status]);
}


