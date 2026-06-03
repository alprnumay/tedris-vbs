export const CLIENT_SIDE_REPAIR_DISABLED_MESSAGE =
  "Client-side repair kapalı. Bu işlem yalnızca backend repair endpointi üzerinden yapılabilir.";

export const REPAIR_MAINTENANCE_MESSAGE =
  "Backend onarım endpointi hazır olmadan bu işlem kapalıdır.";

/** @deprecated Use REPAIR_MAINTENANCE_MESSAGE */
export const REPAIR_UI_DISABLED_MESSAGE = REPAIR_MAINTENANCE_MESSAGE;

export function logRepairDisabled(caller?: string): void {
  console.log("[TEDRIS_REPAIR_DISABLED]", {
    reason: "client-side repair disabled",
    caller: caller ?? "unknown",
  });
}

/** Client-side repair/register/admin-PUT döngüsü — API çağrısı yapılmadan reddedilir. */
export function rejectClientSideRepair(caller?: string): never {
  logRepairDisabled(caller);
  throw new Error(CLIENT_SIDE_REPAIR_DISABLED_MESSAGE);
}

/** Eski bayrak: yalnızca UI ipucu; client repair asla açılmaz. */
export function isRepairEnabled(): boolean {
  return false;
}

export function assertRepairEnabled(): void {
  rejectClientSideRepair("assertRepairEnabled");
}

/** Vercel `POST /api/admin/repair-app-user-auth-links` — dry-run + env doğrulaması sonrası açılır. */
export function isBackendRepairEndpointAllowed(): boolean {
  return (
    import.meta.env.VITE_ENABLE_REPAIR === "true" &&
    import.meta.env.VITE_ALLOW_BACKEND_REPAIR === "true"
  );
}

export function assertBackendRepairEndpointAllowed(caller?: string): void {
  if (!isBackendRepairEndpointAllowed()) {
    logRepairDisabled(caller ?? "backend-repair-endpoint");
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

export const REPAIR_BACKUP_REQUIRED_MESSAGE =
  "Gerçek onarım öncesi VPS/PostgreSQL tam yedeği alınmalıdır. İlk çalıştırma dryRun=true ile yapılmalıdır.";
