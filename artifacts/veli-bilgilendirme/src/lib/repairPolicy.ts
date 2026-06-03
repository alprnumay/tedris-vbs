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

export function repairApiUrl(opts?: { dryRun?: boolean }): string {
  const repairBase = (import.meta.env.VITE_REPAIR_API_BASE_URL || "").replace(/\/+$/, "");
  let base: string;
  if (repairBase) base = `${repairBase}/admin/repair-app-user-auth-links`;
  else if (typeof window !== "undefined" && window.location.origin) {
    base = `${window.location.origin.replace(/\/+$/, "")}/api/admin/repair-app-user-auth-links`;
  } else {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
    base = `${apiBase}/admin/repair-app-user-auth-links`;
  }
  if (opts?.dryRun) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}dryRun=true`;
  }
  return base;
}

/** Gerçek onarım öncesi VPS/PostgreSQL yedeği zorunludur. */
export const REPAIR_BACKUP_REQUIRED_MESSAGE =
  "Gerçek onarım öncesi VPS/PostgreSQL tam yedeği alınmalıdır. İlk çalıştırma dryRun=true ile yapılmalıdır.";
