import { resolveApiBaseUrl } from "@/lib/apiBase";
import { getBackendToken } from "@/lib/backendApi";
import type {
  DailyRecord,
  OkulTakipStore,
  Student,
  ViewerInstitutionsResponse,
} from "@/modules/davet/okul-takip/types";

const API_OUTDATED_MESSAGE =
  "Okul takip sunucusu güncelleniyor. Lütfen birkaç dakika sonra tekrar deneyin.";

const USER_SAVE_ERROR = "Öğrenci kaydedilemedi. Lütfen bilgileri kontrol edin.";
const USER_DELETE_ERROR = "Öğrenci silinemedi. Lütfen tekrar deneyin.";
const USER_DAILY_ERROR = "Günlük kayıt kaydedilemedi. Lütfen tekrar deneyin.";

const PROJECT_API_KEY = import.meta.env.VITE_PROJECT_API_KEY || "";
const REQUEST_TIMEOUT_MS = 15_000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class OkulTakipApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    userMessage: string,
  ) {
    super(userMessage);
    this.name = "OkulTakipApiError";
  }
}

function headers(json = true): Headers {
  const h = new Headers();
  if (json) h.set("Content-Type", "application/json");
  if (PROJECT_API_KEY) h.set("X-Project-Key", PROJECT_API_KEY);
  const token = getBackendToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

async function okulRequest<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const base = resolveApiBaseUrl();
  if (!base) {
    throw new OkulTakipApiError(0, "API base URL missing", USER_SAVE_ERROR);
  }

  const res = await fetch(`${base}${path}`, {
    method,
    headers: headers(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }

  if (!res.ok) {
    const detail =
      typeof (payload as { error?: unknown }).error === "string"
        ? String((payload as { error?: string }).error)
        : `${res.status} ${res.statusText}`;
    console.error("[okul-takip] API error", { method, path, status: res.status, detail, body });
    const userMessage =
      res.status === 404
        ? API_OUTDATED_MESSAGE
        : method === "GET"
          ? "Veriler yüklenemedi."
          : path.includes("daily-records")
            ? USER_DAILY_ERROR
            : method === "DELETE"
              ? USER_DELETE_ERROR
              : USER_SAVE_ERROR;
    throw new OkulTakipApiError(res.status, detail, userMessage);
  }

  return payload as T;
}

type ApiStudent = {
  id: string;
  name: string;
  grade: string;
  institution: string;
  institutionName?: string;
  institutionId?: string | null;
  mintikaName?: string;
  needsInstitutionMapping?: boolean;
  group: string;
  parentPhone: string;
  isActive: boolean;
};

type ApiDailyRecord = {
  id: string;
  studentId: string;
  date: string;
  institution: string;
  group: string;
  attendanceStatus: DailyRecord["attendanceStatus"];
  homeworkStatus: DailyRecord["homeworkStatus"];
  note: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapStudent(api: ApiStudent): Student {
  const institutionName = api.institutionName ?? api.institution;
  return {
    id: api.id,
    name: api.name,
    grade: api.grade,
    institution: institutionName,
    institutionName,
    institutionId: api.institutionId ?? null,
    mintikaName: api.mintikaName ?? "",
    needsInstitutionMapping: api.needsInstitutionMapping === true,
    group: api.group,
    parentPhone: api.parentPhone,
    isActive: api.isActive !== false,
  };
}

function mapDailyRecord(api: ApiDailyRecord): DailyRecord {
  const createdAt = api.createdAt ?? new Date().toISOString();
  return {
    id: api.id,
    studentId: api.studentId,
    date: api.date,
    institution: api.institution,
    group: api.group,
    attendanceStatus: api.attendanceStatus ?? null,
    homeworkStatus: api.homeworkStatus ?? null,
    note: api.note ?? "",
    createdAt,
    updatedAt: api.updatedAt ?? createdAt,
  };
}

function studentPayload(student: Student, institutionId?: string | null) {
  return {
    name: student.name.trim(),
    grade: student.grade.trim(),
    institutionId: institutionId ?? student.institutionId ?? undefined,
    group: student.group.trim(),
    parentPhone: student.parentPhone.trim(),
    isActive: student.isActive,
  };
}

export async function fetchMyInstitutions(): Promise<ViewerInstitutionsResponse> {
  const res = await okulRequest<Partial<ViewerInstitutionsResponse>>(
    "GET",
    "/okul-takip/my-institutions",
  );
  const institutions = res.institutions ?? [];
  return {
    institutions,
    defaultInstitutionId:
      res.defaultInstitutionId ?? institutions.find((item) => item.isDefault)?.id ?? institutions[0]?.id ?? null,
    needsInstitutionMapping: res.needsInstitutionMapping ?? (institutions.length === 0),
    message: res.message,
  };
}

export async function checkOkulTakipApiReady(): Promise<{ ok: boolean; message?: string }> {
  try {
    const base = resolveApiBaseUrl();
    if (!base) return { ok: false, message: API_OUTDATED_MESSAGE };

    const res = await fetch(`${base}/okul-takip/health`, {
      credentials: "include",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      return { ok: false, message: res.status === 404 ? API_OUTDATED_MESSAGE : undefined };
    }

    const data = (await res.json()) as { ok?: boolean; feature?: string };
    if (data.ok && data.feature === "okul_takip") {
      return { ok: true };
    }
    return { ok: false, message: API_OUTDATED_MESSAGE };
  } catch {
    return { ok: false };
  }
}

export async function fetchOkulTakipStore(): Promise<OkulTakipStore> {
  const [studentsRes, dailyRes] = await Promise.all([
    okulRequest<{ students?: ApiStudent[] }>("GET", "/okul-takip/students"),
    okulRequest<{ records?: ApiDailyRecord[] }>("GET", "/okul-takip/daily-records"),
  ]);

  return {
    students: (studentsRes.students ?? []).map(mapStudent),
    dailyRecords: (dailyRes.records ?? []).map(mapDailyRecord),
  };
}

export async function saveStudent(
  student: Student,
  institutionId?: string | null,
): Promise<Student> {
  const payload = studentPayload(student, institutionId);
  const isExistingUuid = /^[0-9a-f-]{36}$/i.test(student.id);

  const res = isExistingUuid
    ? await okulRequest<{ student?: ApiStudent }>("PATCH", `/okul-takip/students/${encodeURIComponent(student.id)}`, payload)
    : await okulRequest<{ student?: ApiStudent }>("POST", "/okul-takip/students", payload);

  if (!res.student) {
    throw new OkulTakipApiError(500, "empty student response", USER_SAVE_ERROR);
  }
  return mapStudent(res.student);
}

export async function removeStudent(id: string): Promise<void> {
  await okulRequest("DELETE", `/okul-takip/students/${encodeURIComponent(id)}`);
}

export async function saveDailyRecords(records: DailyRecord[]): Promise<DailyRecord[]> {
  const payload = {
    records: records.map((record) => ({
      id: /^[0-9a-f-]{36}$/i.test(record.id) ? record.id : undefined,
      studentId: record.studentId,
      date: record.date,
      institution: record.institution,
      group: record.group,
      attendanceStatus: record.attendanceStatus,
      homeworkStatus: record.homeworkStatus,
      note: record.note,
    })),
  };

  const res = await okulRequest<{ records?: ApiDailyRecord[] }>("PUT", "/okul-takip/daily-records", payload);
  return (res.records ?? []).map(mapDailyRecord);
}

export function getOkulTakipUserMessage(
  err: unknown,
  fallback = USER_SAVE_ERROR,
): string {
  if (err instanceof OkulTakipApiError) return err.message;
  return fallback;
}
