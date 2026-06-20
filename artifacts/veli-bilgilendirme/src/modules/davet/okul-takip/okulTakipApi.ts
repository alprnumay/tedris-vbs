import { resolveApiBaseUrl } from "@/lib/apiBase";
import { getBackendToken, type BackendRecord } from "@/lib/backendApi";
import type { DailyRecord, OkulTakipStore, Student } from "@/modules/davet/okul-takip/types";

const OKUL_STUDENT = "okul_student";
const OKUL_DAILY = "okul_daily_record";
const API_BASE = resolveApiBaseUrl();
const REQUEST_TIMEOUT_MS = 15_000;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function headers(json = true): Headers {
  const h = new Headers();
  if (json) h.set("Content-Type", "application/json");
  const token = getBackendToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

function normalizeRecords<T>(payload: unknown): BackendRecord<T>[] {
  const p = payload as { records?: unknown; data?: unknown; items?: unknown; record?: unknown };
  const d = p.data as { records?: unknown; items?: unknown } | undefined;
  if (Array.isArray(p.records)) return p.records as BackendRecord<T>[];
  if (Array.isArray(p.items)) return p.items as BackendRecord<T>[];
  if (d && Array.isArray(d.records)) return d.records as BackendRecord<T>[];
  if (d && Array.isArray(d.items)) return d.items as BackendRecord<T>[];
  if (p.record && typeof p.record === "object") return [p.record as BackendRecord<T>];
  return [];
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (!API_BASE) throw new Error("Sunucu bağlantı ayarları eksik.");

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: headers(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);

  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error || `İstek başarısız (${res.status})`);
  }

  return data;
}

async function listRecords<T>(recordType: string): Promise<BackendRecord<T>[]> {
  const all: BackendRecord<T>[] = [];
  const limit = 100;
  let offset = 0;

  for (let page = 0; page < 50; page += 1) {
    const params = new URLSearchParams({
      record_type: recordType,
      limit: String(limit),
      offset: String(offset),
      page: String(page + 1),
    });
    const payload = await request<unknown>("GET", `/records?${params.toString()}`);
    const batch = normalizeRecords<T>(payload);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return all;
}

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

export async function fetchOkulTakipStore(): Promise<OkulTakipStore> {
  const [studentRecords, dailyRecordsRaw] = await Promise.all([
    listRecords(OKUL_STUDENT),
    listRecords(OKUL_DAILY),
  ]);

  return {
    students: studentRecords.map(mapStudent),
    dailyRecords: dailyRecordsRaw.map(mapDailyRecord),
  };
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

  const isExistingUuid = /^[0-9a-f-]{36}$/i.test(student.id);
  const record = isExistingUuid
    ? await request<{ record?: BackendRecord }>("PUT", `/records/${encodeURIComponent(student.id)}`, {
        record_type: OKUL_STUDENT,
        data: payload,
      })
    : await request<{ record?: BackendRecord }>("POST", "/records", {
        record_type: OKUL_STUDENT,
        data: payload,
      });

  const saved = record.record ?? (record as unknown as BackendRecord);
  return mapStudent(saved);
}

export async function removeStudent(id: string): Promise<void> {
  await request("DELETE", `/records/${encodeURIComponent(id)}?record_type=${OKUL_STUDENT}`);
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

  const isExistingUuid = /^[0-9a-f-]{36}$/i.test(record.id);
  const saved = isExistingUuid
    ? await request<{ record?: BackendRecord }>("PUT", `/records/${encodeURIComponent(record.id)}`, {
        record_type: OKUL_DAILY,
        data: payload,
      })
    : await request<{ record?: BackendRecord }>("POST", "/records", {
        record_type: OKUL_DAILY,
        data: payload,
      });

  const rec = saved.record ?? (saved as unknown as BackendRecord);
  return mapDailyRecord(rec);
}

export async function saveDailyRecords(records: DailyRecord[]): Promise<DailyRecord[]> {
  return Promise.all(records.map((r) => saveDailyRecord(r)));
}
