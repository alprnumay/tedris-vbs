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
};

function StatusButton<T extends string>({
  value,
  current,
  label,
  icon,
  onSelect,
  disabled,
  variant = "attendance",
}: StatusButtonProps<T>) {
  const active = current === value;
  const variantActive =
    variant === "attendance"
      ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/30"
      : "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-500/30";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={cn(
        "min-h-11 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all sm:px-3 sm:text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        disabled && "cursor-not-allowed opacity-40",
        active
          ? variantActive
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {icon ? <span className="mr-1">{icon}</span> : null}
      {label}
    </button>
  );
}

type AttendanceGroupProps = {
  value: AttendanceStatus | null;
  onChange: (v: AttendanceStatus) => void;
};

export function AttendanceButtonGroup({ value, onChange }: AttendanceGroupProps) {
  const statuses: AttendanceStatus[] = ["present", "absent", "excused", "late"];
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {statuses.map((s) => (
        <StatusButton
          key={s}
          value={s}
          current={value}
          label={ATTENDANCE_LABELS[s]}
          icon={ATTENDANCE_ICONS[s]}
          onSelect={onChange}
          variant="attendance"
        />
      ))}
    </div>
  );
}

type HomeworkGroupProps = {
  value: HomeworkStatus | null;
  onChange: (v: HomeworkStatus) => void;
  disabled?: boolean;
};

export function HomeworkButtonGroup({ value, onChange, disabled }: HomeworkGroupProps) {
  const statuses: HomeworkStatus[] = [
    "completed",
    "incomplete",
    "not_done",
    "no_homework",
    "not_checked",
  ];
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {statuses.map((s) => (
        <StatusButton
          key={s}
          value={s}
          current={value}
          label={HOMEWORK_LABELS[s]}
          icon={HOMEWORK_ICONS[s]}
          onSelect={onChange}
          disabled={disabled}
          variant="homework"
        />
      ))}
    </div>
  );
}
