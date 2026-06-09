import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
};

export function SectionCard({ title, children, className, bodyClassName, noPadding }: SectionCardProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}>
      {title ? (
        <div className="border-b border-border bg-muted/30 px-4 py-2.5 md:px-5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
      ) : null}
      <div className={cn(!noPadding && "p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
