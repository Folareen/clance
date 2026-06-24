"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/store";
import { loadUser, markUnauthenticated } from "@/lib/store/auth-slice";
import { hasSessionHint } from "@/lib/api";

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    if (hasSessionHint()) {
      storeRef.current?.dispatch(loadUser());
    } else {
      storeRef.current?.dispatch(markUnauthenticated());
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
