import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "home";
};

export function ModuleGrid({ children, className, variant = "default" }: Props) {
  return (
    <div
      className={cn(
        variant === "home"
          ? "grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2"
          : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
