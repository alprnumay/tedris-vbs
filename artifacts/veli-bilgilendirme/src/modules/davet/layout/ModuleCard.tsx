import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentStyles, type ModuleAccent } from "@/modules/davet/layout/moduleAccents";
import type { LucideIcon } from "lucide-react";

export type ModuleCardProps = {
  title: string;
  shortDescription?: string;
  icon: LucideIcon;
  accent: ModuleAccent;
  href: string;
};

export function ModuleCard({ title, shortDescription, icon: Icon, accent, href }: ModuleCardProps) {
  const styles = accentStyles[accent];

  return (
    <Link href={href} className="group block h-full min-w-0">
      <article
        className={cn(
          "relative flex h-full min-h-[7.5rem] flex-col rounded-xl border border-border bg-card p-3 shadow-sm transition-all",
          "active:scale-[0.98] active:bg-muted/30",
          styles.cardHover,
          "group-hover:shadow-md",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              styles.iconBox,
            )}
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
          </div>
          <ChevronRight
            size={16}
            className={cn("mt-0.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5", styles.chevron)}
            aria-hidden
          />
        </div>

        <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{title}</h2>

        {shortDescription ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{shortDescription}</p>
        ) : null}
      </article>
    </Link>
  );
}
