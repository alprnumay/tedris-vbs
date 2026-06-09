import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentStyles, type ModuleAccent } from "@/modules/davet/layout/moduleAccents";
import type { LucideIcon } from "lucide-react";

export type ModuleCardProps = {
  title: string;
  shortDescription?: string;
  description?: string;
  ctaLabel?: string;
  badge?: string;
  icon: LucideIcon;
  accent: ModuleAccent;
  href: string;
  variant?: "compact" | "featured";
};

export function ModuleCard({
  title,
  shortDescription,
  description,
  ctaLabel = "Aç",
  badge,
  icon: Icon,
  accent,
  href,
  variant = "featured",
}: ModuleCardProps) {
  const styles = accentStyles[accent];
  const body = description ?? shortDescription;
  const isFeatured = variant === "featured";

  return (
    <Link href={href} className="group block h-full min-w-0 focus:outline-none">
      <article
        data-accent={accent}
        style={styles.cardStyle}
        className={cn(
          "nehari-module-card relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300",
          "focus-within:ring-2 focus-within:ring-[var(--nm-accent)] focus-within:ring-offset-2",
          "active:scale-[0.985]",
          styles.cardHover,
          isFeatured ? "min-h-[13.5rem] p-5 sm:min-h-[14.5rem] sm:p-6" : "min-h-[7.5rem] p-3",
        )}
      >
        <div className="nehari-module-card__watermark" aria-hidden>
          <Icon strokeWidth={1.25} />
        </div>
        <div className="nehari-module-card__orb" aria-hidden />

        <div className="relative z-[1] flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", styles.iconBox)}>
              <Icon size={22} strokeWidth={2} aria-hidden />
            </div>
            {badge || styles.badge ? (
              <span className={cn("nehari-module-card__badge ring-1", styles.badgeClass)}>
                {badge ?? styles.badge}
              </span>
            ) : null}
          </div>

          <h2
            className={cn(
              "mt-4 font-bold leading-snug tracking-tight text-slate-900",
              isFeatured ? "text-base sm:text-lg" : "line-clamp-2 text-sm",
            )}
          >
            {title}
          </h2>

          {body ? (
            <p
              className={cn(
                "mt-2 text-slate-600",
                isFeatured ? "line-clamp-3 flex-1 text-sm leading-relaxed" : "line-clamp-1 text-xs",
              )}
            >
              {body}
            </p>
          ) : null}

          {isFeatured ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className={cn("nehari-module-card__cta inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm transition-colors", styles.ctaClass)}>
                {ctaLabel}
                <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </span>
              <span className={cn("hidden text-xs font-semibold sm:inline", styles.chevron)}>
                Modüle git →
              </span>
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
