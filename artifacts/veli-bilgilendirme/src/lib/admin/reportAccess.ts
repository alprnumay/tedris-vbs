import { TRACKED_DISTRICTS } from "./trackedDistricts";

export type ReportScopeType = "own" | "mintika" | "all";

export interface ReportAccess {
  type: ReportScopeType;
  mintikas: string[];
}

export interface ReportScopeUser {
  isAdmin?: boolean;
  role?: string | null;
  email?: string | null;
  reportScopeType?: string | null;
  reportScopeMintikas?: string[] | null;
}

const PRIMARY_ADMIN_EMAIL = "alprn0604@gmail.com";

function normalizeMintikaName(raw: string): string {
  const trimmed = raw.trim();
  const exact = TRACKED_DISTRICTS.find(
    (d) => d.toLocaleLowerCase("tr-TR") === trimmed.toLocaleLowerCase("tr-TR"),
  );
  return exact ?? trimmed;
}

function mintikaCompareKey(name: string): string {
  return normalizeMintikaName(name).toLocaleLowerCase("tr-TR");
}

function parseMintikas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const canonical = normalizeMintikaName(String(item));
    if (!canonical) continue;
    const key = mintikaCompareKey(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canonical);
  }
  return out;
}

function isLegacyFullAdmin(user: ReportScopeUser | null | undefined): boolean {
  if (!user) return false;
  if (user.email?.trim().toLocaleLowerCase("tr-TR") === PRIMARY_ADMIN_EMAIL) return true;
  const role = String(user.role ?? "").trim().toLowerCase();
  return Boolean(user.isAdmin) || role === "admin" || role === "super_admin";
}

export function getReportAccessForUser(user: ReportScopeUser | null | undefined): ReportAccess {
  if (!user) return { type: "own", mintikas: [] };
  if (isLegacyFullAdmin(user)) return { type: "all", mintikas: [] };

  const scopeType = String(user.reportScopeType ?? "own").trim().toLowerCase();
  if (scopeType === "all") return { type: "all", mintikas: [] };
  if (scopeType === "mintika") {
    return { type: "mintika", mintikas: parseMintikas(user.reportScopeMintikas) };
  }
  return { type: "own", mintikas: [] };
}

export function kullaniciRaporGorebilirMi(user: ReportScopeUser | null | undefined): boolean {
  const access = getReportAccessForUser(user);
  return access.type === "all" || access.type === "mintika";
}

export function kullaniciTamRaporYetkiliMi(user: ReportScopeUser | null | undefined): boolean {
  return getReportAccessForUser(user).type === "all";
}

export function isDistrictAllowedByReportAccess(
  access: ReportAccess,
  districtRaw: string | null | undefined,
): boolean {
  if (access.type === "all") return true;
  if (access.type !== "mintika" || !districtRaw?.trim()) return false;
  const key = mintikaCompareKey(districtRaw);
  return access.mintikas.some((m) => mintikaCompareKey(m) === key);
}

export function reportScopeLabel(access: ReportAccess): string | null {
  if (access.type !== "mintika" || !access.mintikas.length) return null;
  if (access.mintikas.length === 1) return `${access.mintikas[0]} Mıntıkası`;
  return access.mintikas.join(", ");
}

export type ReportYetkiSecim = "own" | "mintika" | "all";

export function reportYetkiFromScope(
  reportScopeType?: string | null,
  isAdmin?: boolean,
): ReportYetkiSecim {
  if (isAdmin) return "all";
  const scope = String(reportScopeType ?? "own").trim().toLowerCase();
  if (scope === "all") return "all";
  if (scope === "mintika") return "mintika";
  return "own";
}
