import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Props = {
  total: number;
  marked: number;
  className?: string;
};

export function DailyTrackingProgress({ total, marked, className }: Props) {
  const remaining = Math.max(0, total - marked);
  const percent = total === 0 ? 0 : Math.round((marked / total) * 100);

  return (
    <div className={cn("rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold text-slate-800">
          {total} öğrenciden {marked}&apos;si işaretlendi · Kalan {remaining}
        </p>
        <span className="text-xs font-bold tabular-nums text-violet-700">%{percent}</span>
      </div>
      <Progress value={percent} className="mt-2 h-2 bg-violet-100" />
    </div>
  );
}
