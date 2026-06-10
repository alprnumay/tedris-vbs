import type { DailyDraft } from "@/modules/davet/okul-takip/types";

export type ViewMode = "list" | "cards" | "sequential";

export type StatusFilter =
  | "all"
  | "unmarked"
  | "present"
  | "absent"
  | "hw_incomplete"
  | "hw_not_done"
  | "hw_not_checked";

export type TabFilter =
  | { type: "all" }
  | { type: "group"; value: string }
  | { type: "grade"; value: string };

export function isStudentMarked(draft: DailyDraft | undefined): boolean {
  if (!draft?.attendanceStatus) return false;
  if (draft.attendanceStatus === "absent") return true;
  return draft.homeworkStatus !== null;
}

export function matchesStatusFilter(
  draft: DailyDraft | undefined,
  filter: StatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "unmarked") return !isStudentMarked(draft);
  if (filter === "present") return draft?.attendanceStatus === "present";
  if (filter === "absent") return draft?.attendanceStatus === "absent";
  if (filter === "hw_incomplete") return draft?.homeworkStatus === "incomplete";
  if (filter === "hw_not_done") return draft?.homeworkStatus === "not_done";
  if (filter === "hw_not_checked") return draft?.homeworkStatus === "not_checked";
  return true;
}

export function tabKey(tab: TabFilter): string {
  if (tab.type === "all") return "all";
  return `${tab.type}:${tab.value}`;
}

export function parseTabKey(key: string): TabFilter {
  if (key === "all") return { type: "all" };
  const [type, ...rest] = key.split(":");
  const value = rest.join(":");
  if (type === "group") return { type: "group", value };
  if (type === "grade") return { type: "grade", value };
  return { type: "all" };
}

export function matchesTabFilter(
  student: { group: string; grade: string },
  tab: TabFilter,
): boolean {
  if (tab.type === "all") return true;
  if (tab.type === "group") return student.group === tab.value;
  return student.grade === tab.value;
}

export function buildTabOptions(students: { group: string; grade: string }[]): {
  key: string;
  label: string;
}[] {
  const groups = [...new Set(students.map((s) => s.group))].sort();
  const grades = [...new Set(students.map((s) => s.grade))].sort();
  return [
    { key: "all", label: "Tümü" },
    ...groups.map((g) => ({ key: `group:${g}`, label: g })),
    ...grades.map((g) => ({ key: `grade:${g}`, label: g })),
  ];
}

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "unmarked", label: "İşaretlenmemiş" },
  { value: "present", label: "Var" },
  { value: "absent", label: "Yok" },
  { value: "hw_incomplete", label: "Eksik ödev" },
  { value: "hw_not_done", label: "Yapmamış" },
  { value: "hw_not_checked", label: "Kontrol edilmedi" },
];

export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "list", label: "Hızlı Liste" },
  { value: "cards", label: "Kartlı Görünüm" },
  { value: "sequential", label: "Sıra ile İşaretleme" },
];
