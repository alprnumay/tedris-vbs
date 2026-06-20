import { cn } from "@/lib/utils";
import { StatCard } from "@/modules/davet/okul-takip/components/StatCard";

type Props = {
  total: number;
  marked: number;
  className?: string;
};

export function DailyTrackingProgress({ total, marked, className }: Props) {
  const remaining = Math.max(0, total - marked);

  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:gap-3", className)}>
      <StatCard label="Toplam öğrenci" value={total} />
      <StatCard label="İşaretlenen" value={marked} tone="green" />
      <StatCard label="Kalan" value={remaining} tone="amber" />
    </div>
  );
}
