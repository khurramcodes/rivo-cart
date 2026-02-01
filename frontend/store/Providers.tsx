"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { store } from "./store";
import { useAppDispatch } from "./hooks";
import { fetchCart } from "./cartThunks";

function CartBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCart());
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
