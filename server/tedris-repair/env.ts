export function repairEnvStatus() {
  const base = process.env.VPS_API_BASE_URL ?? "";
  const key = process.env.VPS_PROJECT_API_KEY ?? "";
  const admin = process.env.ADMIN_EMAIL ?? "";
  return {
    hasVpsApiBaseUrl: Boolean(base.trim()),
    hasProjectApiKey: Boolean(key.trim()),
    hasAdminEmail: Boolean(admin.trim()),
  };
}

export function assertRepairEnvConfigured(): void {
  const status = repairEnvStatus();
  if (!status.hasVpsApiBaseUrl || !status.hasProjectApiKey) {
    throw new Error("REPAIR_ENV_MISSING: VPS_API_BASE_URL ve VPS_PROJECT_API_KEY tanımlı olmalı.");
  }
}
