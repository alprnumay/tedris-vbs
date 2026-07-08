import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { GENERAL_STATUS_COLORS, GENERAL_STATUS_LABELS } from "@/modules/davet/okul-takip/constants";
import {
  buildKarneAnalysis,
  buildTeacherCommentSuggestion,
  computeWeeklyStats,
  formatWeekRange,
  getWeekRange,
} from "@/modules/davet/okul-takip/calculations";
import type { DailyRecord, Student, WeeklyStats } from "@/modules/davet/okul-takip/types";

const CELL_COLORS = {
  green: "linear-gradient(135deg,#10b981,#059669)",
  yellow: "linear-gradient(135deg,#fbbf24,#f59e0b)",
  red: "linear-gradient(135deg,#f87171,#dc2626)",
  blue: "linear-gradient(135deg,#60a5fa,#2563eb)",
  gray: "linear-gradient(135deg,#94a3b8,#64748b)",
  "light-gray": "linear-gradient(135deg,#e2e8f0,#cbd5e1)",
};

type Props = {
  student: Student;
  stats: WeeklyStats;
  weekStart: string;
  weekEnd: string;
  records: DailyRecord[];
  teacherComment?: string;
  periodName?: string;
  teacherName?: string;
  className?: string;
};

export const KarnePoster = forwardRef<HTMLDivElement, Props>(function KarnePoster(
  { student, stats, weekStart, weekEnd, records, teacherComment, periodName, teacherName, className },
  ref,
) {
  const weekNote = records
    .filter((r) => r.studentId === student.id && r.note)
    .map((r) => r.note)
    .join(" ");
  const resolvedTeacherComment =
    teacherComment?.trim() || buildTeacherCommentSuggestion(student, stats, weekNote);
  const analysis = buildKarneAnalysis(student, stats, resolvedTeacherComment);
  const statusStyle = GENERAL_STATUS_COLORS[stats.generalStatus];
  const institutionName = student.institutionName || student.institution;
  const groupLine = [student.grade, student.group].filter(Boolean).join(" · ");
  const range = periodName || formatWeekRange(weekStart, weekEnd);
  const teacher = teacherName?.trim() ?? "";

  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full max-w-[560px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl",
        className,
      )}
      style={{
        aspectRatio: "1080 / 1350",
        fontFamily: "Inter, system-ui, sans-serif",
        background: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)",
      }}
    >
      <div className="flex h-full flex-col p-[5%]">
        <div className="rounded-[24px] bg-gradient-to-br from-indigo-800 via-violet-800 to-blue-800 p-[5%] text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {institutionName ? (
                <p className="truncate text-[0.78rem] font-black uppercase tracking-[0.18em] text-blue-100">
                  {institutionName}
                </p>
              ) : null}
              <h1 className="mt-2 text-[1.55rem] font-black leading-tight tracking-[-0.03em]">
                Öğrenci Gelişim Karnesi
              </h1>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/12 px-3 py-2 text-right text-[0.7rem] font-bold text-blue-50">
              {range}
            </div>
          </div>

          <div className="mt-[6%] rounded-[22px] border border-white/15 bg-white/12 p-[5%] backdrop-blur">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-blue-100">
              Öğrenci
            </p>
            <p className="mt-1 break-words text-[2.05rem] font-black leading-[1.05] tracking-[-0.04em]">
              {student.name}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[0.78rem]">
              {groupLine ? (
                <InfoPill label="Sınıf / Grup" value={groupLine} dark />
              ) : null}
              {teacher ? <InfoPill label="Öğretmen" value={teacher} dark /> : null}
            </div>
          </div>
        </div>

        <div className="mt-[4%] grid grid-cols-3 gap-3">
          <MetricCard title="Katılım" percent={stats.attendanceRate} detail={`${stats.presentCount + stats.lateCount} geldi · ${stats.absentCount} yok`} color="blue" />
          <MetricCard title="Ödev" percent={stats.homeworkRate} detail={`${stats.completedCount} tamam · ${stats.incompleteCount + stats.notDoneCount} eksik`} color="violet" />
          <MetricCard title="Genel" percent={stats.generalScore} detail={GENERAL_STATUS_LABELS[stats.generalStatus]} color="emerald" />
        </div>

        <div className="mt-[4%] grid grid-cols-[1.05fr_.95fr] gap-3">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
              Haftalık takip
            </p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {stats.dailyCells.map((cell) => (
                <div key={cell.date} className="text-center">
                  <p className="mb-1 text-[0.58rem] font-bold text-slate-500">{cell.dayLabel.slice(0, 3)}</p>
                  <div
                    className="mx-auto h-10 rounded-xl shadow-inner"
                    style={{ background: CELL_COLORS[cell.color] }}
                    title={`${cell.dayLabel}: ${cell.attendanceStatus ?? "-"} / ${cell.homeworkStatus ?? "-"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">
              Genel durum
            </p>
            <div className={cn("mt-3 rounded-2xl border px-3 py-2 text-center text-[0.82rem] font-black", statusStyle.bg, statusStyle.text, statusStyle.border)}>
              {GENERAL_STATUS_LABELS[stats.generalStatus]}
            </div>
            <p className="mt-3 text-[0.68rem] leading-relaxed text-slate-600">
              {analysis.strength}
            </p>
          </div>
        </div>

        <div className="mt-[4%] grid grid-cols-2 gap-3">
          <AnalysisBlock title="Ders / Alan Bilgisi" text={analysis.generalEvaluation} tone="blue" />
          <AnalysisBlock title="Gelişim Notu" text={analysis.developmentArea} tone="amber" />
        </div>

        <div className="mt-[4%] rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.15em] text-violet-700">
            Hoca görüşü
          </p>
          <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-700 line-clamp-6">
            {resolvedTeacherComment}
          </p>
        </div>

        <div className="mt-auto pt-[4%]">
          <div className="rounded-[20px] bg-slate-900 px-5 py-4 text-white">
            <p className="text-[0.76rem] leading-relaxed text-slate-200">
              Gayret ve devamlılıkla daha güzel neticeler temenni ederiz.
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              {teacher ? (
                <div className="min-w-0">
                  <p className="truncate text-[0.84rem] font-black">{teacher}</p>
                  <p className="text-[0.64rem] text-slate-400">Öğretmen / Hoca</p>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="truncate text-[0.84rem] font-black">{institutionName || "Nehari Takip"}</p>
                  <p className="text-[0.64rem] text-slate-400">Kurum</p>
                </div>
              )}
              {institutionName ? (
                <p className="max-w-[52%] text-right text-[0.72rem] font-bold text-blue-200">{institutionName}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function InfoPill({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={cn("rounded-xl px-3 py-2", dark ? "bg-white/10" : "bg-slate-50")}>
      <p className={cn("text-[0.56rem] font-black uppercase tracking-[0.12em]", dark ? "text-blue-100" : "text-slate-500")}>{label}</p>
      <p className={cn("mt-1 truncate text-[0.76rem] font-bold", dark ? "text-white" : "text-slate-800")}>{value}</p>
    </div>
  );
}

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
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-[0.64rem] font-black uppercase tracking-wide text-slate-500">{title}</p>
      <p className={cn("mt-1 text-[1.55rem] font-black tabular-nums", ring)}>%{percent}</p>
      <p className="mt-1 text-[0.58rem] leading-snug text-slate-500">{detail}</p>
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
    <div className={cn("rounded-[18px] border p-4", bg)}>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-2 text-[0.72rem] leading-relaxed text-slate-700 line-clamp-5">{text}</p>
    </div>
  );
}

export function getKarneData(student: Student, records: DailyRecord[], refDate: string) {
  const { start, end, dates } = getWeekRange(refDate);
  const stats = computeWeeklyStats(student.id, records, dates);
  return { start, end, dates, stats };
}
