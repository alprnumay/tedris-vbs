import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent?: string;
};

export function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  accent = "from-violet-500 to-indigo-600",
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all",
        "hover:border-violet-300 hover:shadow-lg active:scale-[0.99]",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
          accent,
        )}
      >
        <Icon size={22} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-600">{description}</p>
      </div>
      <ChevronRight
        size={20}
        className="mt-1 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600"
        aria-hidden
      />
    </Link>
  );
}
