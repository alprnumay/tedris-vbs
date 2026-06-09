import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  variant?: "default" | "home";
};

export function DavetLayout({ children, variant = "default" }: Props) {
  const isHome = variant === "home";

  return (
    <div className={cn("davet-module-root min-h-screen text-foreground", isHome ? "nehari-platform-home" : "bg-slate-50/90 dark:bg-background")}>
      <main className={cn("mx-auto w-full max-w-5xl", isHome ? "px-3 pb-6 pt-3 sm:px-5 sm:pt-4 md:px-6 md:pb-8" : "p-3 sm:p-4 md:p-6")}>
        {children}
      </main>
    </div>
  );
}

export default DavetLayout;
