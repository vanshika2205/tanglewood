"use client";
import { SessionProvider } from "next-auth/react";
import { UIProvider } from "@/lib/UIContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </SessionProvider>
  );
}
