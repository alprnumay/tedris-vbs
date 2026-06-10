import { cn } from "@/lib/utils";
import {
  ATTENDANCE_ICONS,
  ATTENDANCE_LABELS,
  HOMEWORK_ICONS,
  HOMEWORK_LABELS,
} from "@/modules/davet/okul-takip/constants";
import type { AttendanceStatus, HomeworkStatus } from "@/modules/davet/okul-takip/types";

type StatusButtonProps<T extends string> = {
  value: T;
  current: T | null;
  label: string;
  icon?: string;
  onSelect: (v: T) => void;
  disabled?: boolean;
  variant?: "attendance" | "homework";
  compact?: boolean;
  showIcon?: boolean;
};

function StatusButton<T extends string>({
  value,
  current,
  label,
  icon,
  onSelect,
  disabled,
  variant = "attendance",
  compact = false,
  showIcon = true,
}: StatusButtonProps<T>) {
  const active = current === value;
  const variantActive =
    variant === "attendance"
      ? "border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500/40"
      : "border-violet-500 bg-violet-50 text-violet-800 ring-1 ring-violet-500/40";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={cn(
        "rounded-lg border font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        compact
          ? "min-h-9 px-2 py-1 text-[11px] sm:min-h-10 sm:px-2.5 sm:text-xs"
          : "min-h-11 rounded-xl px-2.5 py-2 text-xs sm:px-3 sm:text-sm",
        disabled && "cursor-not-allowed opacity-40",
        active
          ? variantActive
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {showIcon && icon ? <span className={compact ? "mr-0.5" : "mr-1"}>{icon}</span> : null}
      {label}
    </button>
  );
}

type GroupBaseProps = {
  compact?: boolean;
  showIcons?: boolean;
  className?: string;
};

type AttendanceGroupProps = GroupBaseProps & {
  value: AttendanceStatus | null;
  onChange: (v: AttendanceStatus) => void;
};

const COMPACT_ATT_LABELS: Record<AttendanceStatus, string> = {
  present: "Var",
  absent: "Yok",
  excused: "Maz.",
  late: "Geç",
};

export function AttendanceButtonGroup({
  value,
  onChange,
  compact,
  showIcons = true,
  className,
}: AttendanceGroupProps) {
  const statuses: AttendanceStatus[] = ["present", "absent", "excused", "late"];
  return (
    <div className={cn("flex flex-wrap gap-1", compact ? "gap-0.5 sm:gap-1" : "gap-1.5 sm:gap-2", className)}>
      {statuses.map((s) => (
        <StatusButton
          key={s}
          value={s}
          current={value}
          label={compact ? COMPACT_ATT_LABELS[s] : ATTENDANCE_LABELS[s]}
          icon={ATTENDANCE_ICONS[s]}
          onSelect={onChange}
          variant="attendance"
          compact={compact}
          showIcon={showIcons}
        />
      ))}
    </div>
  );
}

type HomeworkGroupProps = GroupBaseProps & {
  value: HomeworkStatus | null;
  onChange: (v: HomeworkStatus) => void;
  disabled?: boolean;
};

const COMPACT_HW_LABELS: Partial<Record<HomeworkStatus, string>> = {
  completed: "Tamam",
  incomplete: "Eksik",
  not_done: "Yok",
  no_homework: "Ö.Yok",
  not_checked: "K.E.",
};

export function HomeworkButtonGroup({
  value,
  onChange,
  disabled,
  compact,
  showIcons = true,
  className,
}: HomeworkGroupProps) {
  const statuses: HomeworkStatus[] = [
    "completed",
    "incomplete",
    "not_done",
    "no_homework",
    "not_checked",
  ];
  return (
    <div className={cn("flex flex-wrap gap-1", compact ? "gap-0.5 sm:gap-1" : "gap-1.5 sm:gap-2", className)}>
      {statuses.map((s) => (
        <StatusButton
          key={s}
          value={s}
          current={value}
          label={compact ? (COMPACT_HW_LABELS[s] ?? HOMEWORK_LABELS[s]) : HOMEWORK_LABELS[s]}
          icon={HOMEWORK_ICONS[s]}
          onSelect={onChange}
          disabled={disabled}
          variant="homework"
          compact={compact}
          showIcon={showIcons}
        />
      ))}
    </div>
  );
}
