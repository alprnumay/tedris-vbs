export function resolveApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

  if (import.meta.env.DEV && import.meta.env.VITE_FORCE_REMOTE_API !== "true") {
    if (typeof window !== "undefined") {
      return "/api";
    }
    if (configured.includes("localhost") || configured.includes("127.0.0.1")) {
      return configured;
    }
    return "/api";
  }

  return configured;
}

/** Tüm push API istekleri — VPS api-server (VITE_API_BASE_URL). */
export function resolvePushApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

/** Yerel Vite proxy → api-server (3001); VPS /records yok. */
export function isLocalDevApi(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_FORCE_REMOTE_API !== "true";
}

/** Yerel api-server üzerinden desteklenen okul takip kayıt türleri */
export const OKUL_TAKIP_RECORD_TYPES = new Set(["okul_student", "okul_daily_record"]);

export function isOkulTakipRecordType(recordType: string): boolean {
  return OKUL_TAKIP_RECORD_TYPES.has(recordType);
}

export function resolveApiOrigin(apiBase = resolveApiBaseUrl()): string {
  if (!apiBase || apiBase.startsWith("/")) {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }
  return apiBase.replace(/\/api\/?$/i, "") || apiBase;
}
