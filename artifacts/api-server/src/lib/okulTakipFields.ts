import { findLocalUserById } from "./localUserLookup";
import { mintikaCompareKey as reportMintikaKey } from "./reportAccess";
import { normalizeDistrictName } from "./trackedDistricts";

export type OwnerContext = { viewerId?: string; admin: boolean };

export function normalizeInstitutionName(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  return raw.trim().replace(/\s+/g, " ");
}

export function institutionCompareKey(name: string): string {
  return normalizeInstitutionName(name).toLocaleLowerCase("tr-TR");
}

export function mintikaCompareKey(name: string): string {
  return reportMintikaKey(name);
}

const ATTENDANCE_COMPLETE = new Set([
  "present",
  "absent",
  "excused",
  "late",
  "var",
  "yok",
  "mazeretli",
  "gec",
]);

const HOMEWORK_COMPLETE = new Set([
  "completed",
  "incomplete",
  "not_done",
  "no_homework",
  "tamam",
  "eksik",
  "yapmadi",
  "odev_yok",
]);

export function isAttendanceComplete(status: unknown): boolean {
  if (status == null || status === "") return false;
  return ATTENDANCE_COMPLETE.has(String(status).toLowerCase());
}

export function isHomeworkRequired(attendanceStatus: unknown): boolean {
  const s = String(attendanceStatus ?? "").toLowerCase();
  return s !== "absent" && s !== "yok";
}

export function isHomeworkComplete(homeworkStatus: unknown, attendanceStatus?: unknown): boolean {
  if (!isHomeworkRequired(attendanceStatus)) return true;
  if (homeworkStatus == null || homeworkStatus === "") return false;
  const s = String(homeworkStatus).toLowerCase();
  if (s === "not_checked" || s === "kontrol_edilmedi") return false;
  return HOMEWORK_COMPLETE.has(s);
}

export function isReportCardReady(attendanceStatus: unknown, homeworkStatus: unknown): boolean {
  return isAttendanceComplete(attendanceStatus) && isHomeworkComplete(homeworkStatus, attendanceStatus);
}

export async function resolveOwnerLocation(
  ctx: OwnerContext,
  formInstitution?: string,
): Promise<{ mintikaName: string; institutionName: string }> {
  const fromForm = normalizeInstitutionName(formInstitution);
  if (!ctx.viewerId) {
    return { mintikaName: "", institutionName: fromForm };
  }

  const user = await findLocalUserById(ctx.viewerId);
  const mintikaName =
    normalizeDistrictName(user?.district) ?? normalizeInstitutionName(user?.district);
  const fromUser = normalizeInstitutionName(user?.institutionName);
  return {
    mintikaName,
    institutionName: fromUser || fromForm,
  };
}
