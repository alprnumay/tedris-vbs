import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  institutionCompareKey,
  isAttendanceComplete,
  isHomeworkComplete,
  isReportCardReady,
  mintikaCompareKey,
  normalizeInstitutionName,
} from "./okulTakipFields";
import {
  isDistrictAllowed,
  mintikaCompareKey as reportMintikaKey,
  type ReportAccess,
} from "./reportAccess";
import { normalizeDistrictName } from "./trackedDistricts";
import { UNMAPPED_INSTITUTION_LABEL } from "./okulTakipInstitutionResolver";

export type InstitutionTrackingStatus = "completed" | "incomplete" | "not_started";

export interface InstitutionReportRow {
  institutionId: string | null;
  institutionName: string;
  mintikaName: string;
  needsInstitutionMapping?: boolean;
  activeStudents: number;
  attendanceCompleted: number;
  attendanceMissing: number;
  homeworkCompleted: number;
  homeworkMissing: number;
  lastUpdateAt: string | null;
  status: InstitutionTrackingStatus;
}

export interface OkulTakipSummaryReport {
  date: string;
  scope: {
    type: ReportAccess["type"];
    mintikas: string[];
  };
  totals: {
    institutions: number;
    activeStudents: number;
    attendanceCompleted: number;
    attendanceMissing: number;
    homeworkCompleted: number;
    homeworkMissing: number;
    reportCardsGenerated: number;
  };
  institutions: InstitutionReportRow[];
}

export interface OkulTakipMissingReport {
  date: string;
  missingInstitutions: Array<{
    institutionName: string;
    mintikaName: string;
    activeStudents: number;
    attendanceMissing: number;
    homeworkMissing: number;
    lastUpdateAt: string | null;
    status: InstitutionTrackingStatus;
  }>;
}

export interface OkulTakipInstitutionDetail {
  date: string;
  institutionName: string;
  mintikaName: string;
  totals: InstitutionReportRow;
  students: Array<{
    studentId: string;
    name: string;
    group: string;
    grade: string;
    attendanceStatus: unknown;
    homeworkStatus: unknown;
    ownerUserId: string | null;
    lastUpdateAt: string | null;
  }>;
}

type RawStudentRow = {
  id: string;
  user_id: string | null;
  name: string | null;
  grade: string | null;
  group_name: string | null;
  institution: string | null;
  institution_id: string | null;
  mintika_name: string | null;
  needs_mapping: string | null;
  is_active: string | null;
  owner_institution: string | null;
  owner_district: string | null;
  registry_institution: string | null;
  registry_mintika: string | null;
};

type RawDailyRow = {
  student_id: string | null;
  attendance_status: string | null;
  homework_status: string | null;
  updated_at: Date | string | null;
};

function str(v: unknown): string {
  return v != null ? String(v).trim() : "";
}

function isActiveStudent(raw: string | null): boolean {
  return raw !== "false" && raw !== "f";
}

function resolveStudentMintika(row: RawStudentRow): string {
  const fromRegistry = normalizeDistrictName(row.registry_mintika) ?? str(row.registry_mintika);
  if (fromRegistry) return fromRegistry;
  const fromData = normalizeDistrictName(row.mintika_name) ?? str(row.mintika_name);
  if (fromData) return fromData;
  return normalizeDistrictName(row.owner_district) ?? str(row.owner_district);
}

function resolveStudentInstitution(row: RawStudentRow): { name: string; id: string | null; unmapped: boolean } {
  if (row.registry_institution) {
    return {
      name: normalizeInstitutionName(row.registry_institution),
      id: str(row.institution_id) || null,
      unmapped: false,
    };
  }
  if (row.needs_mapping === "true" || (!str(row.institution_id) && !str(row.institution))) {
    const legacy = normalizeInstitutionName(row.institution) || normalizeInstitutionName(row.owner_institution);
    if (!legacy) {
      return { name: UNMAPPED_INSTITUTION_LABEL, id: null, unmapped: true };
    }
    return { name: legacy, id: null, unmapped: true };
  }
  const fromData = normalizeInstitutionName(row.institution);
  if (fromData) return { name: fromData, id: str(row.institution_id) || null, unmapped: !str(row.institution_id) };
  const fromOwner = normalizeInstitutionName(row.owner_institution);
  if (fromOwner) return { name: fromOwner, id: null, unmapped: true };
  return { name: UNMAPPED_INSTITUTION_LABEL, id: null, unmapped: true };
}

function institutionGroupKey(
  institutionId: string | null,
  institutionName: string,
  mintikaName: string,
): string {
  if (institutionId) return `id:${institutionId}`;
  return `${institutionCompareKey(institutionName)}|${mintikaCompareKey(mintikaName)}`;
}

function deriveInstitutionStatus(row: InstitutionReportRow): InstitutionTrackingStatus {
  const anyProgress =
    row.attendanceCompleted > 0 ||
    row.homeworkCompleted > 0 ||
    row.attendanceMissing < row.activeStudents ||
    row.homeworkMissing < row.activeStudents;

  if (!anyProgress) return "not_started";
  if (row.attendanceMissing === 0 && row.homeworkMissing === 0) return "completed";
  return "incomplete";
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function studentAllowedByAccess(access: ReportAccess, mintikaName: string): boolean {
  if (access.type === "all") return true;
  if (access.type !== "mintika") return false;
  return isDistrictAllowed(access, mintikaName);
}

function filterMintikaName(access: ReportAccess, mintikaFilter: string | null | undefined): boolean {
  if (!mintikaFilter) return true;
  return isDistrictAllowed(access, mintikaFilter);
}

async function loadStudents(): Promise<RawStudentRow[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        s.id,
        s.user_id,
        s.data->>'name' AS name,
        s.data->>'grade' AS grade,
        s.data->>'group' AS group_name,
        COALESCE(s.data->>'institutionName', s.data->>'institution') AS institution,
        s.data->>'institutionId' AS institution_id,
        s.data->>'mintikaName' AS mintika_name,
        s.data->>'needsInstitutionMapping' AS needs_mapping,
        s.data->>'isActive' AS is_active,
        u.institution_name AS owner_institution,
        u.district_name AS owner_district,
        i.institution_name AS registry_institution,
        i.district_name AS registry_mintika
      FROM compat_records s
      LEFT JOIN local_users u ON u.id = s.user_id AND u.deleted_at IS NULL
      LEFT JOIN institutions i ON i.id = NULLIF(trim(s.data->>'institutionId'), '')
      WHERE s.record_type = 'okul_student'
    `);
    return (result.rows ?? []) as RawStudentRow[];
  } catch (err) {
    console.error("[okul-takip reports] students query failed", err);
    return [];
  }
}

async function loadDailyRecords(date: string): Promise<Map<string, RawDailyRow>> {
  const map = new Map<string, RawDailyRow>();
  try {
    const result = await db.execute(sql`
      SELECT
        d.data->>'studentId' AS student_id,
        d.data->>'attendanceStatus' AS attendance_status,
        d.data->>'homeworkStatus' AS homework_status,
        d.updated_at
      FROM compat_records d
      WHERE d.record_type = 'okul_daily_record'
        AND d.data->>'date' = ${date}
    `);

    for (const row of (result.rows ?? []) as RawDailyRow[]) {
      const studentId = str(row.student_id);
      if (!studentId) continue;
      const existing = map.get(studentId);
      if (!existing) {
        map.set(studentId, row);
        continue;
      }
      const existingTs = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
      const rowTs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      if (rowTs >= existingTs) map.set(studentId, row);
    }
  } catch (err) {
    console.error("[okul-takip reports] daily records query failed", err);
  }
  return map;
}

function buildInstitutionRows(
  students: RawStudentRow[],
  dailyByStudent: Map<string, RawDailyRow>,
  access: ReportAccess,
  mintikaFilter: string | null | undefined,
): InstitutionReportRow[] {
  const groups = new Map<string, InstitutionReportRow>();

  for (const student of students) {
    if (!isActiveStudent(student.is_active)) continue;

    const mintikaName = resolveStudentMintika(student);
    if (!studentAllowedByAccess(access, mintikaName)) continue;
    if (!filterMintikaName(access, mintikaFilter)) continue;
    if (mintikaFilter && reportMintikaKey(mintikaName) !== reportMintikaKey(mintikaFilter)) continue;

    const institution = resolveStudentInstitution(student);
    const institutionName = institution.unmapped ? UNMAPPED_INSTITUTION_LABEL : institution.name;
    const key = institutionGroupKey(institution.id, institutionName, mintikaName);
    let row = groups.get(key);
    if (!row) {
      row = {
        institutionId: institution.id,
        institutionName,
        mintikaName,
        needsInstitutionMapping: institution.unmapped,
        activeStudents: 0,
        attendanceCompleted: 0,
        attendanceMissing: 0,
        homeworkCompleted: 0,
        homeworkMissing: 0,
        lastUpdateAt: null,
        status: "not_started",
      };
      groups.set(key, row);
    }

    row.activeStudents += 1;

    const daily = dailyByStudent.get(String(student.id));
    const attendanceStatus = daily?.attendance_status ?? null;
    const homeworkStatus = daily?.homework_status ?? null;
    const updatedAt = toIso(daily?.updated_at ?? null);
    row.lastUpdateAt = maxIso(row.lastUpdateAt, updatedAt);

    if (isAttendanceComplete(attendanceStatus)) {
      row.attendanceCompleted += 1;
    } else {
      row.attendanceMissing += 1;
    }

    if (isHomeworkComplete(homeworkStatus, attendanceStatus)) {
      row.homeworkCompleted += 1;
    } else {
      row.homeworkMissing += 1;
    }
  }

  const institutions = Array.from(groups.values());
  for (const row of institutions) {
    row.status = deriveInstitutionStatus(row);
  }

  institutions.sort((a, b) => {
    const mintikaCmp = a.mintikaName.localeCompare(b.mintikaName, "tr");
    if (mintikaCmp !== 0) return mintikaCmp;
    return a.institutionName.localeCompare(b.institutionName, "tr");
  });

  return institutions;
}

function buildTotals(institutions: InstitutionReportRow[], dailyByStudent: Map<string, RawDailyRow>, students: RawStudentRow[], access: ReportAccess, mintikaFilter: string | null | undefined) {
  let reportCardsGenerated = 0;

  for (const student of students) {
    if (!isActiveStudent(student.is_active)) continue;
    const mintikaName = resolveStudentMintika(student);
    if (!studentAllowedByAccess(access, mintikaName)) continue;
    if (!filterMintikaName(access, mintikaFilter)) continue;
    if (mintikaFilter && reportMintikaKey(mintikaName) !== reportMintikaKey(mintikaFilter)) continue;

    const daily = dailyByStudent.get(String(student.id));
    if (isReportCardReady(daily?.attendance_status ?? null, daily?.homework_status ?? null)) {
      reportCardsGenerated += 1;
    }
  }

  return {
    institutions: institutions.length,
    activeStudents: institutions.reduce((sum, row) => sum + row.activeStudents, 0),
    attendanceCompleted: institutions.reduce((sum, row) => sum + row.attendanceCompleted, 0),
    attendanceMissing: institutions.reduce((sum, row) => sum + row.attendanceMissing, 0),
    homeworkCompleted: institutions.reduce((sum, row) => sum + row.homeworkCompleted, 0),
    homeworkMissing: institutions.reduce((sum, row) => sum + row.homeworkMissing, 0),
    reportCardsGenerated,
  };
}

export async function buildOkulTakipSummaryReport(
  date: string,
  access: ReportAccess,
  mintikaFilter?: string | null,
): Promise<OkulTakipSummaryReport> {
  const [students, dailyByStudent] = await Promise.all([loadStudents(), loadDailyRecords(date)]);
  const institutions = buildInstitutionRows(students, dailyByStudent, access, mintikaFilter ?? null);

  return {
    date,
    scope: {
      type: access.type,
      mintikas: access.type === "mintika" ? access.mintikas : [],
    },
    totals: buildTotals(institutions, dailyByStudent, students, access, mintikaFilter ?? null),
    institutions,
  };
}

export async function buildOkulTakipMissingReport(
  date: string,
  access: ReportAccess,
  mintikaFilter?: string | null,
): Promise<OkulTakipMissingReport> {
  const summary = await buildOkulTakipSummaryReport(date, access, mintikaFilter);
  const missingInstitutions = summary.institutions
    .filter((row) => row.status !== "completed")
    .map((row) => ({
      institutionName: row.institutionName,
      mintikaName: row.mintikaName,
      activeStudents: row.activeStudents,
      attendanceMissing: row.attendanceMissing,
      homeworkMissing: row.homeworkMissing,
      lastUpdateAt: row.lastUpdateAt,
      status: row.status,
    }));

  return { date, missingInstitutions };
}

export async function buildOkulTakipInstitutionDetail(
  date: string,
  institutionNameRaw: string,
  access: ReportAccess,
  mintikaFilter?: string | null,
): Promise<OkulTakipInstitutionDetail | null> {
  const institutionName = normalizeInstitutionName(decodeURIComponent(institutionNameRaw));
  if (!institutionName) return null;

  const [students, dailyByStudent] = await Promise.all([loadStudents(), loadDailyRecords(date)]);
  const institutions = buildInstitutionRows(students, dailyByStudent, access, mintikaFilter ?? null);
  const targetKey = institutions.find(
    (row) => institutionCompareKey(row.institutionName) === institutionCompareKey(institutionName),
  );
  if (!targetKey) return null;

  const detailStudents: OkulTakipInstitutionDetail["students"] = [];
  for (const student of students) {
    if (!isActiveStudent(student.is_active)) continue;
    const mintikaName = resolveStudentMintika(student);
    const institution = resolveStudentInstitution(student);
    const resolvedInstitution = institution.unmapped ? UNMAPPED_INSTITUTION_LABEL : institution.name;
    if (institutionCompareKey(resolvedInstitution) !== institutionCompareKey(institutionName)) continue;
    if (mintikaCompareKey(mintikaName) !== mintikaCompareKey(targetKey.mintikaName)) continue;
    if (!studentAllowedByAccess(access, mintikaName)) continue;

    const daily = dailyByStudent.get(String(student.id));
    detailStudents.push({
      studentId: String(student.id),
      name: str(student.name) || "—",
      group: str(student.group_name),
      grade: str(student.grade),
      attendanceStatus: daily?.attendance_status ?? null,
      homeworkStatus: daily?.homework_status ?? null,
      ownerUserId: student.user_id != null ? String(student.user_id) : null,
      lastUpdateAt: toIso(daily?.updated_at ?? null),
    });
  }

  detailStudents.sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return {
    date,
    institutionName: targetKey.institutionName,
    mintikaName: targetKey.mintikaName,
    totals: targetKey,
    students: detailStudents,
  };
}

export function validateReportDate(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return null;
  return raw.trim();
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
