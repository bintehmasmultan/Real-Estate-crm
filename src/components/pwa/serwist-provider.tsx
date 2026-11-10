"use client";

import { useSyncExternalStore } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";

const emptySubscribe = () => () => {};

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      reloadOnOnline
    >
      {children}
    </SerwistProvider>
  );
}