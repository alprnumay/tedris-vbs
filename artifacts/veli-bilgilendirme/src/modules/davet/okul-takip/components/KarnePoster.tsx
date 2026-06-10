import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { GENERAL_STATUS_COLORS, GENERAL_STATUS_LABELS } from "@/modules/davet/okul-takip/constants";
import {
  buildKarneAnalysis,
  computeWeeklyStats,
  formatWeekRange,
  getWeekRange,
} from "@/modules/davet/okul-takip/calculations";
import type { DailyRecord, Student, WeeklyStats } from "@/modules/davet/okul-takip/types";

const CELL_COLORS = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
  blue: "bg-blue-400",
  gray: "bg-slate-400",
  "light-gray": "bg-slate-200",
};

type Props = {
  student: Student;
  stats: WeeklyStats;
  weekStart: string;
  weekEnd: string;
  records: DailyRecord[];
  className?: string;
};

export const KarnePoster = forwardRef<HTMLDivElement, Props>(function KarnePoster(
  { student, stats, weekStart, weekEnd, records, className },
  ref,
) {
  const weekNote = records
    .filter((r) => r.studentId === student.id && r.note)
    .map((r) => r.note)
    .join(" ");
  const analysis = buildKarneAnalysis(student, stats, weekNote);
  const statusStyle = GENERAL_STATUS_COLORS[stats.generalStatus];

  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full max-w-[640px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl",
        className,
      )}
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 px-6 py-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          {student.institution} · Nehari Takip
        </p>
        <h1 className="mt-2 text-2xl font-bold">{student.name}</h1>
        <p className="mt-1 text-sm opacity-90">
          {student.grade} · {student.group}
        </p>
        <p className="mt-3 text-xs opacity-75">{formatWeekRange(weekStart, weekEnd)}</p>
        <div
          className={cn(
            "mt-4 inline-flex rounded-full border px-4 py-1.5 text-sm font-bold",
            statusStyle.bg,
            statusStyle.text,
            statusStyle.border,
          )}
        >
          {GENERAL_STATUS_LABELS[stats.generalStatus]}
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-3">
        <MetricCard
          title="Katılım"
          percent={stats.attendanceRate}
          detail={`${stats.presentCount + stats.lateCount} geldi · ${stats.absentCount} yok · ${stats.excusedCount} mazeret · ${stats.lateCount} geç`}
          color="blue"
        />
        <MetricCard
          title="Okul Ödevi"
          percent={stats.homeworkRate}
          detail={`${stats.completedCount} tamam · ${stats.incompleteCount} eksik · ${stats.notDoneCount} yapmamış`}
          color="violet"
        />
        <MetricCard
          title="Genel Puan"
          percent={stats.generalScore}
          detail="Katılım %40 + Ödev %60"
          color="emerald"
        />
      </div>

      <div className="px-6 pb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Haftalık çizelge
        </p>
        <div className="grid grid-cols-5 gap-2">
          {stats.dailyCells.map((cell) => (
            <div key={cell.date} className="text-center">
              <p className="mb-1 text-[10px] font-semibold text-slate-500">{cell.dayLabel.slice(0, 3)}</p>
              <div
                className={cn(
                  "mx-auto h-10 w-full max-w-[48px] rounded-lg",
                  CELL_COLORS[cell.color],
                )}
                title={`${cell.dayLabel}: ${cell.attendanceStatus ?? "-"} / ${cell.homeworkStatus ?? "-"}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 bg-slate-50/80 px-6 py-6">
        <AnalysisBlock title="Genel değerlendirme" text={analysis.generalEvaluation} />
        <div className="grid gap-4 sm:grid-cols-2">
          <AnalysisBlock title="Güçlü yön" text={analysis.strength} tone="green" />
          <AnalysisBlock title="Gelişim alanı" text={analysis.developmentArea} tone="amber" />
        </div>
        <AnalysisBlock title="Veliye öneri" text={analysis.parentSuggestion} tone="blue" />
        {analysis.teacherNote !== "—" ? (
          <AnalysisBlock title="Hoca notu" text={analysis.teacherNote} />
        ) : null}
      </div>
    </div>
  );
});

function MetricCard({
  title,
  percent,
  detail,
  color,
}: {
  title: string;
  percent: number;
  detail: string;
  color: "blue" | "violet" | "emerald";
}) {
  const ring =
    color === "blue"
      ? "text-blue-600"
      : color === "violet"
        ? "text-violet-600"
        : "text-emerald-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className={cn("mt-1 text-3xl font-bold tabular-nums", ring)}>%{percent}</p>
      <p className="mt-2 text-[10px] leading-snug text-slate-500">{detail}</p>
    </div>
  );
}

function AnalysisBlock({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone?: "green" | "amber" | "blue";
}) {
  const bg =
    tone === "green"
      ? "bg-emerald-50 border-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 border-amber-100"
        : tone === "blue"
          ? "bg-blue-50 border-blue-100"
          : "bg-white border-slate-200";

  return (
    <div className={cn("rounded-xl border p-4", bg)}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

export function getKarneData(student: Student, records: DailyRecord[], refDate: string) {
  const { start, end, dates } = getWeekRange(refDate);
  const stats = computeWeeklyStats(student.id, records, dates);
  return { start, end, dates, stats };
}
