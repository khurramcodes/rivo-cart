"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { fetchCart } from "@/store/cartThunks";

export function CartInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  return null;
}
