/**
 * API kök yolu: yerel Vite geliştirmede proxy (/api → 127.0.0.1:3001),
 * production'da VITE_API_BASE_URL.
 */
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

/** Yerel Vite proxy → api-server (3001); VPS /records yok. */
export function isLocalDevApi(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_FORCE_REMOTE_API !== "true";
}

export function resolveApiOrigin(apiBase = resolveApiBaseUrl()): string {
  if (!apiBase || apiBase.startsWith("/")) {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }
  return apiBase.replace(/\/api\/?$/i, "") || apiBase;
}
