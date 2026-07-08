import {
  ATTENDANCE_POINTS,
  GENERAL_STATUS_LABELS,
  HOMEWORK_POINTS,
  WEEKDAY_LABELS,
} from "@/modules/davet/okul-takip/constants";
import type {
  AttendanceStatus,
  DailyCell,
  DailyRecord,
  GeneralStatus,
  HomeworkStatus,
  KarneAnalysis,
  RiskReason,
  RiskStudent,
  Student,
  WeeklyStats,
} from "@/modules/davet/okul-takip/types";

export function getWeekRange(refDate: string): { start: string; end: string; dates: string[] } {
  const d = new Date(refDate + "T12:00:00");
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const wd = new Date(monday);
    wd.setDate(monday.getDate() + i);
    dates.push(wd.toISOString().slice(0, 10));
  }

  return { start: dates[0], end: dates[4], dates };
}

export function formatWeekRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function formatDateTr(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function computeAttendanceRate(records: DailyRecord[]): number {
  let total = 0;
  let count = 0;
  for (const r of records) {
    if (!r.attendanceStatus) continue;
    const pts = ATTENDANCE_POINTS[r.attendanceStatus];
    if (pts === null) continue;
    total += pts;
    count++;
  }
  return count === 0 ? 0 : Math.round(total / count);
}

export function computeHomeworkRate(records: DailyRecord[]): number {
  let total = 0;
  let count = 0;
  for (const r of records) {
    if (!r.homeworkStatus) continue;
    const pts = HOMEWORK_POINTS[r.homeworkStatus];
    if (pts === null) continue;
    total += pts;
    count++;
  }
  return count === 0 ? 0 : Math.round(total / count);
}

export function computeGeneralScore(attendanceRate: number, homeworkRate: number): number {
  return Math.round(attendanceRate * 0.4 + homeworkRate * 0.6);
}

export function getGeneralStatus(score: number): GeneralStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "needs_followup";
  return "at_risk";
}

function cellColor(
  att: AttendanceStatus | null,
  hw: HomeworkStatus | null,
): DailyCell["color"] {
  if (att === "absent") return "red";
  if (att === "excused") return "blue";
  if (att === "present" || att === "late") {
    if (hw === "completed") return "green";
    if (hw === "incomplete") return "yellow";
    if (hw === "not_done") return "red";
    if (hw === "no_homework") return "gray";
    if (hw === "not_checked") return "light-gray";
  }
  return "light-gray";
}

export function computeWeeklyStats(
  studentId: string,
  records: DailyRecord[],
  weekDates: string[],
): WeeklyStats {
  const weekRecords = records.filter(
    (r) => r.studentId === studentId && weekDates.includes(r.date),
  );

  const attendanceRate = computeAttendanceRate(weekRecords);
  const homeworkRate = computeHomeworkRate(weekRecords);
  const generalScore = computeGeneralScore(attendanceRate, homeworkRate);

  const countBy = <T extends string>(
    field: "attendanceStatus" | "homeworkStatus",
    value: T,
  ) => weekRecords.filter((r) => r[field] === value).length;

  const dailyCells: DailyCell[] = weekDates.map((date, i) => {
    const rec = weekRecords.find((r) => r.date === date);
    return {
      date,
      dayLabel: WEEKDAY_LABELS[i] ?? date,
      attendanceStatus: rec?.attendanceStatus ?? null,
      homeworkStatus: rec?.homeworkStatus ?? null,
      color: cellColor(rec?.attendanceStatus ?? null, rec?.homeworkStatus ?? null),
    };
  });

  return {
    attendanceRate,
    homeworkRate,
    generalScore,
    generalStatus: getGeneralStatus(generalScore),
    attendanceDays: weekRecords.filter(
      (r) => r.attendanceStatus && ATTENDANCE_POINTS[r.attendanceStatus] !== null,
    ).length,
    homeworkDays: weekRecords.filter(
      (r) => r.homeworkStatus && HOMEWORK_POINTS[r.homeworkStatus] !== null,
    ).length,
    presentCount: countBy("attendanceStatus", "present"),
    absentCount: countBy("attendanceStatus", "absent"),
    excusedCount: countBy("attendanceStatus", "excused"),
    lateCount: countBy("attendanceStatus", "late"),
    completedCount: countBy("homeworkStatus", "completed"),
    incompleteCount: countBy("homeworkStatus", "incomplete"),
    notDoneCount: countBy("homeworkStatus", "not_done"),
    noHomeworkCount: countBy("homeworkStatus", "no_homework"),
    notCheckedCount: countBy("homeworkStatus", "not_checked"),
    dailyCells,
  };
}

function consecutiveCount(
  records: DailyRecord[],
  check: (r: DailyRecord) => boolean,
): number {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const r of sorted) {
    if (check(r)) streak++;
    else break;
  }
  return streak;
}

export function detectRiskStudent(
  student: Student,
  records: DailyRecord[],
  last7Dates: string[],
): RiskStudent | null {
  const studentRecords = records.filter((r) => r.studentId === student.id);
  const weekDates = getWeekRange(last7Dates[0] ?? new Date().toISOString().slice(0, 10)).dates;
  const stats = computeWeeklyStats(student.id, records, weekDates);

  const reasons: RiskReason[] = [];
  if (stats.generalScore < 50) reasons.push("low_general");
  if (stats.attendanceRate < 50) reasons.push("low_attendance");
  if (stats.homeworkRate < 50) reasons.push("low_homework");

  const recentRecords = studentRecords.filter((r) => last7Dates.includes(r.date));
  if (
    consecutiveCount(recentRecords, (r) => r.attendanceStatus === "absent") >= 2
  ) {
    reasons.push("consecutive_absent");
  }
  if (
    consecutiveCount(
      recentRecords,
      (r) => r.homeworkStatus === "not_done" || r.homeworkStatus === "incomplete",
    ) >= 2
  ) {
    reasons.push("consecutive_homework");
  }
  if (recentRecords.length === 0 && student.isActive) {
    reasons.push("no_records");
  }

  if (reasons.length === 0) return null;

  const primary = reasons[0];
  const actionMap: Record<RiskReason, string> = {
    low_general: "Hoca efendi birebir ilgilenecek",
    low_attendance: "Veli aranacak",
    low_homework: "Okul ödevi kontrolü için veli desteği istenecek",
    consecutive_absent: "Ev ziyareti planlanacak",
    consecutive_homework: "Etüt/ödev saati desteği verilecek",
    no_records: "Hoca efendi birebir ilgilenecek",
  };

  return {
    student,
    reasons: [...new Set(reasons)],
    attendanceRate: stats.attendanceRate,
    homeworkRate: stats.homeworkRate,
    generalScore: stats.generalScore,
    suggestedAction: actionMap[primary],
  };
}

export function getLast7Dates(refDate: string): string[] {
  const dates: string[] = [];
  const d = new Date(refDate + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const wd = new Date(d);
    wd.setDate(d.getDate() - i);
    dates.push(wd.toISOString().slice(0, 10));
  }
  return dates;
}

const EVAL_TEXT: Record<GeneralStatus, string> = {
  excellent:
    "Bu hafta öğrencimizin katılımı ve okul ödevi takibi genel olarak çok güzel ilerlemiştir. Sorumluluk bilinci ve düzenli takip açısından olumlu bir tablo görülmektedir.",
  good: "Bu hafta öğrencimizin genel durumu olumludur. Katılım ve okul ödevi takibinde düzen büyük ölçüde korunmuştur. Küçük hatırlatmalarla bu düzenin devamı desteklenebilir.",
  needs_followup:
    "Bu hafta öğrencimizin takip durumunda bazı eksikler görülmüştür. Özellikle okul ödevlerinin düzenli tamamlanması ve programa devam konusunda kısa hatırlatmalar faydalı olacaktır.",
  at_risk:
    "Bu hafta öğrencimizin katılım ve okul ödevi takibinde belirgin aksaklıklar görülmektedir. Daha düzenli ilerleyebilmesi için veli desteği ve yakın takip önerilir.",
};

function strengthText(att: number, hw: number): string {
  if (att >= 80 && hw >= 80)
    return "Hem katılım hem de okul ödevi takibinde dengeli ve olumlu bir hafta geçirmiştir.";
  if (att >= 80) return "Programa katılımı olumlu seviyededir.";
  if (hw >= 80) return "Okul ödevlerini takip etme konusunda güzel bir düzen görülmektedir.";
  return "Bu hafta bazı olumlu gelişmeler görülmüştür.";
}

function developmentText(att: number, hw: number): string {
  if (att < 70 && hw < 70)
    return "Hem katılım hem de ödev düzeni açısından yakın takip ihtiyacı bulunmaktadır.";
  if (att < 70) return "Programa devam konusunda daha düzenli takip faydalı olacaktır.";
  if (hw < 70)
    return "Okuldan verilen ödevlerin günlük kontrolü için evde kısa destek faydalı olacaktır.";
  return "Küçük iyileştirmelerle daha iyi bir düzen sağlanabilir.";
}

function parentSuggestion(status: GeneralStatus): string {
  if (status === "excellent" || status === "good") {
    return "Düzenin devamı için evde kısa hatırlatmalarla desteklenmesi faydalı olacaktır.";
  }
  if (status === "needs_followup") {
    return "Özellikle okuldan verilen ödevlerin günlük tamamlanması için evde kısa bir kontrol faydalı olacaktır.";
  }
  return "Önümüzdeki hafta daha düzenli ilerleyebilmesi için veli desteği ve yakın takip faydalı olacaktır.";
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

export function buildTeacherCommentSuggestion(
  student: Student,
  stats: WeeklyStats,
  teacherNote = "",
): string {
  const fn = firstName(student.name);
  const alan =
    stats.homeworkRate >= stats.attendanceRate
      ? "okul ödevi takibi"
      : "programa katılım";

  if (teacherNote.trim()) {
    return `${fn}, bu hafta yapılan takiplerde notlara konu olan çalışmalarda gayret göstermiştir. ${teacherNote.trim()} Evde kısa tekrarlarla bu kazanımların kalıcı hale gelmesi tavsiye edilir.`;
  }

  if (stats.generalStatus === "excellent") {
    return `${fn}, bu dönem derslere ve takip programına güzel bir gayretle katılım sağlamıştır. Özellikle ${alan} çalışmalarında istikrarlı bir gelişim görülmektedir. Bu düzenin kısa tekrarlarla korunması tavsiye edilir.`;
  }
  if (stats.generalStatus === "good") {
    return `${fn}, genel olarak olumlu bir hafta geçirmiştir. ${alan} alanındaki gayreti desteklenmeli, küçük hatırlatmalarla düzeninin devamı sağlanmalıdır.`;
  }
  if (stats.generalStatus === "needs_followup") {
    return `${fn}, bu hafta bazı alanlarda desteğe ihtiyaç duymuştur. Özellikle ${alan} konusunda evde kısa ve düzenli tekrar yapılması faydalı olacaktır.`;
  }
  return `${fn}, daha düzenli ilerleyebilmek için yakın takip ve veli desteğine ihtiyaç duymaktadır. Kısa tekrarlar, günlük kontrol ve devamlılıkla daha güzel neticeler alınması temenni edilir.`;
}

export function buildKarneAnalysis(
  student: Student,
  stats: WeeklyStats,
  teacherNote = "",
): KarneAnalysis {
  const status = stats.generalStatus;
  const fn = firstName(student.name);
  const statusLabel = GENERAL_STATUS_LABELS[status];

  let whatsAppMessage: string;
  if (status === "excellent" || status === "good") {
    whatsAppMessage = `Muhterem Velimiz,
${fn}'in bu haftaki Nehari takip özeti:
Katılım: %${stats.attendanceRate}
Okul ödevi düzeni: %${stats.homeworkRate}
Genel durum: ${statusLabel}

Bu hafta katılımı ve okul ödevi takibi genel olarak olumlu ilerlemiştir. Düzenin devamı için evde kısa hatırlatmalarla desteklenmesi faydalı olacaktır.`;
  } else if (status === "needs_followup") {
    whatsAppMessage = `Muhterem Velimiz,
${fn}'in bu haftaki takip durumunda bazı eksikler görülmüştür.
Katılım: %${stats.attendanceRate}
Okul ödevi düzeni: %${stats.homeworkRate}

Özellikle okuldan verilen ödevlerin günlük tamamlanması için evde kısa bir kontrol faydalı olacaktır.`;
  } else {
    whatsAppMessage = `Muhterem Velimiz,
${fn}'in bu haftaki katılım ve okul ödevi takibinde düzen desteğine ihtiyaç olduğu görülmektedir.
Katılım: %${stats.attendanceRate}
Okul ödevi düzeni: %${stats.homeworkRate}

Önümüzdeki hafta daha düzenli ilerleyebilmesi için veli desteği ve yakın takip faydalı olacaktır.`;
  }

  return {
    generalEvaluation: EVAL_TEXT[status],
    strength: strengthText(stats.attendanceRate, stats.homeworkRate),
    developmentArea: developmentText(stats.attendanceRate, stats.homeworkRate),
    parentSuggestion: parentSuggestion(status),
    teacherNote: teacherNote || buildTeacherCommentSuggestion(student, stats),
    whatsAppMessage,
  };
}

export type DailySummary = {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  hwCompleted: number;
  hwIncomplete: number;
  hwNotDone: number;
  hwNoHomework: number;
  hwNotChecked: number;
};

export function computeDailySummary(
  records: DailyRecord[],
  studentIds: string[],
): DailySummary {
  const filtered = records.filter((r) => studentIds.includes(r.studentId));
  return {
    total: studentIds.length,
    present: filtered.filter((r) => r.attendanceStatus === "present").length,
    absent: filtered.filter((r) => r.attendanceStatus === "absent").length,
    excused: filtered.filter((r) => r.attendanceStatus === "excused").length,
    late: filtered.filter((r) => r.attendanceStatus === "late").length,
    hwCompleted: filtered.filter((r) => r.homeworkStatus === "completed").length,
    hwIncomplete: filtered.filter((r) => r.homeworkStatus === "incomplete").length,
    hwNotDone: filtered.filter((r) => r.homeworkStatus === "not_done").length,
    hwNoHomework: filtered.filter((r) => r.homeworkStatus === "no_homework").length,
    hwNotChecked: filtered.filter((r) => r.homeworkStatus === "not_checked").length,
  };
}

export function buildDailyWhatsAppText(
  date: string,
  institution: string,
  group: string,
  summary: DailySummary,
): string {
  const dateStr = formatDateTr(date);
  return `Bugünkü Nehari takip özeti (${institution}${group ? ` / ${group}` : ""}):
Tarih: ${dateStr}
Toplam öğrenci: ${summary.total}
Var: ${summary.present}
Yok: ${summary.absent}
Mazeretli: ${summary.excused}
Geç gelen: ${summary.late}

Okul ödevi:
Tamam: ${summary.hwCompleted}
Eksik: ${summary.hwIncomplete}
Yapmamış: ${summary.hwNotDone}
Ödev yok: ${summary.hwNoHomework}
Kontrol edilmedi: ${summary.hwNotChecked}`;
}

export function applyHomeworkToAttendance(): AttendanceStatus {
  return "present";
}

export function applyAbsentHomework(): HomeworkStatus {
  return "not_checked";
}

export function isHomeworkDisabled(attendance: AttendanceStatus | null): boolean {
  return attendance === "absent";
}
