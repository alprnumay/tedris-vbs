import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentStyles, type ModuleAccent } from "@/modules/davet/layout/moduleAccents";

export type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  accent?: ModuleAccent;
  backHref?: string;
  backLabel?: string;
  variant?: "home" | "page";
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  accent,
  backHref = "/",
  backLabel = "Ana menü",
  variant = "page",
  className,
}: PageHeaderProps) {
  const isHome = variant === "home";
  const bar = accent ? accentStyles[accent].headerBar : "from-slate-600/80 to-slate-700/60";

  return (
    <header className={cn(isHome ? "space-y-1.5 pb-1" : "space-y-3", className)}>
      {!isHome && backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card",
          isHome ? "px-4 py-3.5" : "px-4 py-4 md:px-5 md:py-5",
        )}
      >
        <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", bar)} aria-hidden />
        <div className="pl-3">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h1
            className={cn(
              "font-bold tracking-tight text-foreground",
              isHome ? "text-xl sm:text-2xl" : "text-lg sm:text-xl md:text-2xl",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={cn("text-muted-foreground", isHome ? "mt-1 text-sm" : "mt-1.5 text-sm md:text-base")}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
