import { resolveApiBaseUrl } from "@/lib/apiBase";
import { backendApi, type BackendRecord } from "@/lib/backendApi";
import type { DailyRecord, OkulTakipStore, Student } from "@/modules/davet/okul-takip/types";

const OKUL_STUDENT = "okul_student";
const OKUL_DAILY = "okul_daily_record";

const API_OUTDATED_MESSAGE =
  "Okul takip API sunucusu henüz güncellenmemiş. Yönetici sunucuda scripts/vps-update-api.sh çalıştırmalı.";

function mapStudent(record: BackendRecord): Student {
  const data = (record.data ?? {}) as Record<string, unknown>;
  return {
    id: String(record.id),
    name: String(data.name ?? ""),
    grade: String(data.grade ?? ""),
    institution: String(data.institution ?? ""),
    group: String(data.group ?? ""),
    parentPhone: String(data.parentPhone ?? ""),
    isActive: data.isActive !== false,
  };
}

function mapDailyRecord(record: BackendRecord): DailyRecord {
  const data = (record.data ?? {}) as Record<string, unknown>;
  const createdAt = String(record.createdAt ?? record.created_at ?? new Date().toISOString());
  const updatedAt = String(record.updatedAt ?? record.updated_at ?? createdAt);
  return {
    id: String(record.id),
    studentId: String(data.studentId ?? ""),
    date: String(data.date ?? ""),
    institution: String(data.institution ?? ""),
    group: String(data.group ?? ""),
    attendanceStatus: (data.attendanceStatus as DailyRecord["attendanceStatus"]) ?? null,
    homeworkStatus: (data.homeworkStatus as DailyRecord["homeworkStatus"]) ?? null,
    note: String(data.note ?? ""),
    createdAt,
    updatedAt,
  };
}

function wrapApiError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.includes("Geçersiz record_type") ||
    message.includes("Desteklenmeyen kayıt") ||
    message.includes("güncellenmemiş")
  ) {
    return new Error(API_OUTDATED_MESSAGE);
  }
  return err instanceof Error ? err : new Error(message);
}

export async function checkOkulTakipApiReady(): Promise<{ ok: boolean; message?: string }> {
  try {
    const base = resolveApiBaseUrl();
    if (!base) return { ok: false, message: API_OUTDATED_MESSAGE };

    const res = await fetch(`${base}/health`, { credentials: "include" });
    if (!res.ok) return { ok: false, message: API_OUTDATED_MESSAGE };

    const data = (await res.json()) as { supportedRecordTypes?: string[] };
    const types = data.supportedRecordTypes ?? [];
    if (!types.includes(OKUL_STUDENT)) {
      return { ok: false, message: API_OUTDATED_MESSAGE };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Sunucuya bağlanılamadı." };
  }
}

export async function fetchOkulTakipStore(): Promise<OkulTakipStore> {
  try {
    const [studentRecords, dailyRecordsRaw] = await Promise.all([
      backendApi.fetchAllRecords(OKUL_STUDENT),
      backendApi.fetchAllRecords(OKUL_DAILY),
    ]);

    return {
      students: studentRecords.map(mapStudent),
      dailyRecords: dailyRecordsRaw.map(mapDailyRecord),
    };
  } catch (err) {
    throw wrapApiError(err);
  }
}

export async function saveStudent(student: Student): Promise<Student> {
  const payload = {
    name: student.name,
    grade: student.grade,
    institution: student.institution,
    group: student.group,
    parentPhone: student.parentPhone,
    isActive: student.isActive,
  };

  try {
    const isExistingUuid = /^[0-9a-f-]{36}$/i.test(student.id);
    const saved = isExistingUuid
      ? await backendApi.updateRecord(student.id, OKUL_STUDENT, payload)
      : await backendApi.createRecord(OKUL_STUDENT, payload);
    return mapStudent(saved);
  } catch (err) {
    throw wrapApiError(err);
  }
}

export async function removeStudent(id: string): Promise<void> {
  try {
    await backendApi.deleteRecord(id);
  } catch (err) {
    throw wrapApiError(err);
  }
}

export async function saveDailyRecord(record: DailyRecord): Promise<DailyRecord> {
  const payload = {
    studentId: record.studentId,
    date: record.date,
    institution: record.institution,
    group: record.group,
    attendanceStatus: record.attendanceStatus,
    homeworkStatus: record.homeworkStatus,
    note: record.note,
  };

  try {
    const isExistingUuid = /^[0-9a-f-]{36}$/i.test(record.id);
    const saved = isExistingUuid
      ? await backendApi.updateRecord(record.id, OKUL_DAILY, payload)
      : await backendApi.createRecord(OKUL_DAILY, payload);
    return mapDailyRecord(saved);
  } catch (err) {
    throw wrapApiError(err);
  }
}

export async function saveDailyRecords(records: DailyRecord[]): Promise<DailyRecord[]> {
  return Promise.all(records.map((r) => saveDailyRecord(r)));
}
