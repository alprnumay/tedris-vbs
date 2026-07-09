import {
  ATTENDANCE_POINTS,
  HOMEWORK_POINTS,
} from "@/modules/davet/okul-takip/constants";
import type {
  AttendanceStatus,
  DailyRecord,
  GeneralStatus,
  HomeworkStatus,
  WeeklyStats,
} from "@/modules/davet/okul-takip/types";

export const KARNE_STATUS_LABELS: Record<GeneralStatus, string> = {
  excellent: "Çok iyi",
  good: "İyi",
  needs_followup: "Orta",
  at_risk: "Geliştirilmeli",
};

export function scoreOutOfTen(generalScore: number): string {
  return `${(generalScore / 10).toFixed(1)} / 10`;
}

export function computeDailyPerformanceScore(
  attendance: AttendanceStatus | null,
  homework: HomeworkStatus | null,
): number | null {
  if (!attendance && !homework) return null;

  const attPts =
    attendance && ATTENDANCE_POINTS[attendance] !== null
      ? ATTENDANCE_POINTS[attendance]!
      : null;
  const hwPts =
    homework && HOMEWORK_POINTS[homework] !== null ? HOMEWORK_POINTS[homework]! : null;

  if (attPts === null && hwPts === null) return null;
  if (attendance === "excused") return hwPts;

  const att = attPts ?? 0;
  const hw = hwPts ?? 0;
  return Math.round(att * 0.4 + hw * 0.6);
}

export function computeDailyPerformanceScores(stats: WeeklyStats): Array<number | null> {
  return stats.dailyCells.map((cell) =>
    computeDailyPerformanceScore(cell.attendanceStatus, cell.homeworkStatus),
  );
}

export function hasWeeklyTrackingData(stats: WeeklyStats): boolean {
  return stats.dailyCells.some(
    (cell) => cell.attendanceStatus !== null || cell.homeworkStatus !== null,
  );
}

export function buildSubjectAreaText(
  studentId: string,
  records: DailyRecord[],
  weekDates: string[],
  fallbackText: string,
): string {
  const notes = records
    .filter(
      (record) =>
        record.studentId === studentId &&
        weekDates.includes(record.date) &&
        record.note?.trim(),
    )
    .map((record) => record.note.trim());

  const uniqueNotes = [...new Set(notes)];
  if (uniqueNotes.length > 0) {
    return uniqueNotes.join(" ");
  }
  if (fallbackText.trim()) return fallbackText.trim();
  return "Bu hafta için ders / alan bilgisi girilmemiştir.";
}

export function buildStrengthTags(stats: WeeklyStats): string[] {
  const tags: string[] = [];
  if (stats.attendanceRate >= 70 || stats.presentCount + stats.lateCount >= 3) {
    tags.push("Derse Katılım");
  }
  if (stats.homeworkRate >= 70 || stats.completedCount >= 2) {
    tags.push("Sorumluluk");
  }
  if (stats.generalScore >= 70) tags.push("Düzen");
  if (stats.generalScore >= 80) tags.push("Gayret");
  if (stats.attendanceDays >= 3) tags.push("Devamlılık");

  if (tags.length === 0) {
    return hasWeeklyTrackingData(stats) ? ["Takip Ediliyor"] : ["Veri Bekleniyor"];
  }

  return [...new Set(tags)].slice(0, 4);
}

export type AttendanceDisplay = { symbol: string; color: string; label: string };
export type HomeworkDisplay = { symbol: string; color: string; label: string };

export function attendanceDisplay(status: AttendanceStatus | null): AttendanceDisplay {
  switch (status) {
    case "present":
      return { symbol: "✓", color: "#059669", label: "Geldi" };
    case "late":
      return { symbol: "✓", color: "#d97706", label: "Geç" };
    case "absent":
      return { symbol: "✕", color: "#dc2626", label: "Yok" };
    case "excused":
      return { symbol: "○", color: "#2563eb", label: "Mazeret" };
    default:
      return { symbol: "—", color: "#94a3b8", label: "Veri yok" };
  }
}

export function homeworkDisplay(status: HomeworkStatus | null): HomeworkDisplay {
  switch (status) {
    case "completed":
      return { symbol: "✓", color: "#059669", label: "Tamam" };
    case "incomplete":
      return { symbol: "−", color: "#d97706", label: "Eksik" };
    case "not_done":
      return { symbol: "✕", color: "#dc2626", label: "Yapmadı" };
    case "no_homework":
      return { symbol: "·", color: "#64748b", label: "Ödev yok" };
    case "not_checked":
      return { symbol: "?", color: "#94a3b8", label: "Kontrol yok" };
    default:
      return { symbol: "—", color: "#94a3b8", label: "Veri yok" };
  }
}

export const KARNE_CANVAS = {
  width: 1080,
  height: 1350,
} as const;
