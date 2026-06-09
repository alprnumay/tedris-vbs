import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentStyles, type ModuleAccent } from "@/modules/davet/layout/moduleAccents";
import { goToAppHome } from "@/modules/davet/layout/navRoutes";

export type BackButtonProps = {
  label: string;
  href?: string;
  /** Ana uygulama köküne tam sayfa geçişi */
  external?: boolean;
  onClick?: () => void;
  className?: string;
};

export function BackButton({
  label,
  href = "/",
  external = false,
  onClick,
  className,
}: BackButtonProps) {
  const classes = cn(
    "nehari-back-button inline-flex min-h-11 min-w-[2.75rem] items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors",
    "hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    className,
  );

  const content = (
    <>
      <ArrowLeft size={18} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </>
  );

  if (external || onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick ?? goToAppHome}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

export type BreadcrumbItem = {
  label: string;
  href?: string;
  external?: boolean;
};

export function BreadcrumbHeader({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Konum" className={cn("nehari-breadcrumb hidden md:flex", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex min-w-0 items-center gap-1.5">
              {idx > 0 ? <span className="text-slate-300" aria-hidden>/</span> : null}
              {isLast || !item.href ? (
                <span className={cn("truncate", isLast ? "font-semibold text-slate-700" : "")}>{item.label}</span>
              ) : item.external ? (
                <a
                  href={item.href}
                  className="truncate transition-colors hover:text-slate-800"
                >
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className="truncate transition-colors hover:text-slate-800">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type ModulePageHeaderProps = {
  variant?: "platform-home" | "module";
  title?: string;
  subtitle?: string;
  description?: string;
  accent?: ModuleAccent;
  backLabel?: string;
  backHref?: string;
  externalBack?: boolean;
  rightActions?: ReactNode;
  className?: string;
};

export function ModulePageHeader({
  variant = "module",
  title,
  subtitle,
  description,
  accent,
  backLabel,
  backHref,
  externalBack = false,
  rightActions,
  className,
}: ModulePageHeaderProps) {
  const body = subtitle ?? description;

  if (variant === "platform-home") {
    return (
      <div className={cn("nehari-module-page-header nehari-module-page-header--platform-home", className)}>
        <BackButton label={backLabel ?? "Ana sayfaya dön"} external />
      </div>
    );
  }

  const bar = accent ? accentStyles[accent].headerBar : "from-slate-600/90 to-slate-700/70";

  const breadcrumb: BreadcrumbItem[] = [
    { label: "Ana Sayfa", href: "/", external: true },
    { label: "Nehari Platformu", href: "/" },
    ...(title ? [{ label: title }] : []),
  ];

  return (
    <header className={cn("nehari-module-page-header space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton
          label={backLabel ?? "Nehari Platformu"}
          href={backHref ?? "/"}
          external={externalBack}
        />
        {rightActions ? <div className="flex shrink-0 items-center gap-2">{rightActions}</div> : null}
      </div>

      <BreadcrumbHeader items={breadcrumb} />

      {title ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card px-4 py-4 md:px-5 md:py-5">
          <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", bar)} aria-hidden />
          <div className="min-w-0 pl-3">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
              {title}
            </h1>
            {body ? (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground md:text-base">{body}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
