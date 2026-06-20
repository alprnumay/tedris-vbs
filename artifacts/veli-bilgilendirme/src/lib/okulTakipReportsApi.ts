import { resolveApiBaseUrl } from "@/lib/apiBase";
import { getBackendToken } from "@/lib/backendApi";

const PROJECT_API_KEY = import.meta.env.VITE_PROJECT_API_KEY || "";
const REQUEST_TIMEOUT_MS = 20_000;

export type InstitutionTrackingStatus = "completed" | "incomplete" | "not_started";

export interface OkulTakipInstitutionRow {
  institutionName: string;
  mintikaName: string;
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
    type: "all" | "mintika" | "own";
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
  institutions: OkulTakipInstitutionRow[];
}

export interface OkulTakipMissingReport {
  date: string;
  missingInstitutions: Array<
    Pick<
      OkulTakipInstitutionRow,
      | "institutionName"
      | "mintikaName"
      | "activeStudents"
      | "attendanceMissing"
      | "homeworkMissing"
      | "lastUpdateAt"
      | "status"
    >
  >;
}

export interface OkulTakipInstitutionDetail {
  date: string;
  institutionName: string;
  mintikaName: string;
  totals: OkulTakipInstitutionRow;
  students: Array<{
    studentId: string;
    name: string;
    group: string;
    grade: string;
    attendanceStatus: string | null;
    homeworkStatus: string | null;
    ownerUserId: string | null;
    lastUpdateAt: string | null;
  }>;
}

function headers(): Headers {
  const h = new Headers({ "Content-Type": "application/json" });
  if (PROJECT_API_KEY) h.set("X-Project-Key", PROJECT_API_KEY);
  const token = getBackendToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

async function reportRequest<T>(path: string): Promise<T> {
  const base = resolveApiBaseUrl();
  if (!base) throw new Error("API adresi bulunamadı.");

  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: headers(),
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
        : typeof (payload as { message?: unknown }).message === "string"
          ? String((payload as { message?: string }).message)
          : `${res.status}`;
    if (res.status === 404) {
      throw new Error(
        "Okul takip rapor endpointleri bulunamadı. API sunucusunu yeniden başlatın (pnpm dev).",
      );
    }
    throw new Error(detail);
  }

  return payload as T;
}

function query(date: string, mintika?: string) {
  const params = new URLSearchParams({ date });
  if (mintika) params.set("mintika", mintika);
  return params.toString();
}

export async function fetchOkulTakipSummaryReport(
  date: string,
  mintika?: string,
): Promise<OkulTakipSummaryReport> {
  return reportRequest(`/okul-takip/reports/summary?${query(date, mintika)}`);
}

export async function fetchOkulTakipMissingReport(
  date: string,
  mintika?: string,
): Promise<OkulTakipMissingReport> {
  return reportRequest(`/okul-takip/reports/missing?${query(date, mintika)}`);
}

export async function fetchOkulTakipInstitutionDetail(
  institutionName: string,
  date: string,
  mintika?: string,
): Promise<OkulTakipInstitutionDetail> {
  const q = query(date, mintika);
  return reportRequest(
    `/okul-takip/reports/institution/${encodeURIComponent(institutionName)}?${q}`,
  );
}

export function pct(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function statusLabel(status: InstitutionTrackingStatus): string {
  if (status === "completed") return "Tamamlandı";
  if (status === "not_started") return "Hiç yapılmadı";
  return "Eksik";
}

export function statusColors(status: InstitutionTrackingStatus): { bg: string; color: string } {
  if (status === "completed") return { bg: "#dcfce7", color: "#166534" };
  if (status === "not_started") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "#fef9c3", color: "#854d0e" };
}

export function buildOkulTakipWhatsappMessage(
  mintikaName: string,
  date: string,
  rows: OkulTakipMissingReport["missingInstitutions"],
): string {
  const lines = rows.map((row) => {
    if (row.status === "not_started") {
      return `- ${row.institutionName}: Takip yapılmadı`;
    }
    const attDone = row.activeStudents - row.attendanceMissing;
    const hwDone = row.activeStudents - row.homeworkMissing;
    return `- ${row.institutionName}: Yoklama ${attDone}/${row.activeStudents}, Ödev ${hwDone}/${row.activeStudents}`;
  });

  return `${mintikaName} mıntıkasında ${date} tarihinde okul takip işlemini tamamlamayan yurtlarımız:\n${lines.join("\n")}\n\nGünlük yoklama ve okul ödevi takibinin tamamlanmasını rica ederiz.`;
}

export function resolveOkulTakipReportDate(
  preset: "today" | "yesterday" | "this_week" | "this_month" | "custom",
  customDate?: string,
): string {
  if (preset === "custom" && customDate) return customDate;
  const now = new Date();
  if (preset === "today") return now.toISOString().slice(0, 10);
  if (preset === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}
