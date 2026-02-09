"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import type { User } from "@/types";
import { setUser } from "./slices/authSlice";

interface ProvidersProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export function Providers({ children, initialUser=null }: ProvidersProps) {
  if(initialUser){
    store.dispatch(setUser(initialUser));
  }
  return <Provider store={store}>{children}</Provider>;
}
