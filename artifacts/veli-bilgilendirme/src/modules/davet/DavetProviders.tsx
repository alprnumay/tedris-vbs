import type { ReactNode } from "react";
import { Toaster } from "@/components/davet-ui/toaster";

export function DavetProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
