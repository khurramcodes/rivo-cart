"use client";

import { useHydrateAuth } from "./useHydrateAuth";

export function AuthHydrator() {
  useHydrateAuth();
  return null;
}


