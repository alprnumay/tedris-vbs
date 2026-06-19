import { isLoginUserAdmin, type LoginUserRow } from "./localUserLookup";
import { normalizeDistrictName } from "./trackedDistricts";

export type ReportAccessType = "all" | "mintika" | "own";

export interface ReportAccess {
  type: ReportAccessType;
  mintikas: string[];
}

export type ReportScopeUser = Pick<LoginUserRow, "email" | "role" | "isAdmin"> & {
  reportScopeType?: string | null;
  reportScopeMintikas?: unknown;
};

function parseMintikas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const canonical = normalizeDistrictName(String(item)) ?? String(item).trim();
    if (!canonical) continue;
    const key = mintikaCompareKey(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canonical);
  }
  return out;
}

export function mintikaCompareKey(name: string): string {
  const canonical = normalizeDistrictName(name) ?? name.trim();
  return canonical.toLocaleLowerCase("tr-TR");
}

export function getReportAccessForUser(user: ReportScopeUser | null | undefined): ReportAccess {
  if (!user) return { type: "own", mintikas: [] };

  if (isLoginUserAdmin(user)) {
    return { type: "all", mintikas: [] };
  }

  const scopeType = String(user.reportScopeType ?? "own").trim().toLowerCase();
  if (scopeType === "all") {
    return { type: "all", mintikas: [] };
  }
  if (scopeType === "mintika") {
    return { type: "mintika", mintikas: parseMintikas(user.reportScopeMintikas) };
  }
  return { type: "own", mintikas: [] };
}

export function canAccessReports(access: ReportAccess): boolean {
  return access.type === "all" || access.type === "mintika";
}

export function isDistrictAllowed(access: ReportAccess, districtRaw: string | null | undefined): boolean {
  if (access.type === "all") return true;
  if (access.type !== "mintika" || !districtRaw?.trim()) return false;
  const key = mintikaCompareKey(districtRaw);
  return access.mintikas.some((m) => mintikaCompareKey(m) === key);
}

/** İstek parametresindeki mıntıkayı yetkiye göre doğrula; yetkisiz istek undefined döner. */
export function resolveDistrictFilter(
  access: ReportAccess,
  requestedRaw: string | null | undefined,
): string | null | undefined {
  if (access.type === "all") {
    return requestedRaw ? normalizeDistrictName(requestedRaw) ?? requestedRaw.trim() : null;
  }
  if (access.type !== "mintika") return undefined;
  if (!requestedRaw) return null;
  const normalized = normalizeDistrictName(requestedRaw) ?? requestedRaw.trim();
  return isDistrictAllowed(access, normalized) ? normalized : undefined;
}

export function filterMintikaMetrics<T extends { districtName: string }>(
  access: ReportAccess,
  rows: T[],
): T[] {
  if (access.type === "all") return rows;
  if (access.type !== "mintika") return [];
  return rows.filter((row) => isDistrictAllowed(access, row.districtName));
}

export function filterYurtsByAccess<T extends { districtName: string }>(
  access: ReportAccess,
  rows: T[],
  requestedDistrict?: string | null,
): T[] {
  if (access.type === "own") return [];
  let list = access.type === "mintika" ? filterMintikaMetrics(access, rows) : rows;
  const district = resolveDistrictFilter(access, requestedDistrict ?? null);
  if (district === undefined) return [];
  if (district) {
    list = list.filter(
      (row) => mintikaCompareKey(row.districtName) === mintikaCompareKey(district),
    );
  }
  return list;
}

export function resolveReportScopeFields(body: Record<string, unknown>): {
  reportScopeType: "own" | "mintika" | "all";
  reportScopeMintikas: string[];
} {
  const rawType = String(body.reportScopeType ?? body.report_scope_type ?? "own").trim().toLowerCase();
  const mintikasRaw = body.reportScopeMintikas ?? body.report_scope_mintikas;
  const mintikas = parseMintikas(mintikasRaw);

  if (rawType === "all") {
    return { reportScopeType: "all", reportScopeMintikas: [] };
  }
  if (rawType === "mintika") {
    if (!mintikas.length) {
      throw new Error("Mıntıka yöneticisi için en az bir mıntıka seçilmelidir.");
    }
    return { reportScopeType: "mintika", reportScopeMintikas: mintikas };
  }
  return { reportScopeType: "own", reportScopeMintikas: [] };
}
