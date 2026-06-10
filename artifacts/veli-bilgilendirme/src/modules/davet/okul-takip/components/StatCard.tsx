import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "default" | "green" | "red" | "amber" | "blue" | "indigo";
  className?: string;
};

const toneStyles = {
  default: "border-slate-200 bg-white text-slate-900",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  red: "border-red-200 bg-red-50 text-red-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

export function StatCard({ label, value, sub, tone = "default", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
        toneStyles[tone],
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs opacity-60">{sub}</p> : null}
    </div>
  );
}
