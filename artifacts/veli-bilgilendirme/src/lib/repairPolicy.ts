export const REPAIR_MAINTENANCE_MESSAGE =
  "Bu işlem geçici olarak kapatıldı. Backend veri onarım endpointi hazırlanmalıdır.";

export function isRepairEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_REPAIR === "true";
}

export function assertRepairEnabled(): void {
  if (!isRepairEnabled()) {
    throw new Error(REPAIR_MAINTENANCE_MESSAGE);
  }
}

export function repairApiUrl(): string {
  const repairBase = (import.meta.env.VITE_REPAIR_API_BASE_URL || "").replace(/\/+$/, "");
  if (repairBase) return `${repairBase}/admin/repair-app-user-auth-links`;
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";
  if (origin) return `${origin}/api/admin/repair-app-user-auth-links`;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  return `${apiBase}/admin/repair-app-user-auth-links`;
}
