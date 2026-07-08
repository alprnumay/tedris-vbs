import { BCRYPT_ROUNDS } from "./bcryptConfig";
import { getPasswordHashRounds, passwordHashEngine, passwordPoolSize } from "./passwordHash";

export type AuthLoginTimingMetrics = {
  dbLookupMs: number;
  passwordCompareMs: number;
  profileLoadMs: number;
  institutionLoadMs: number;
  reportScopeLoadMs: number;
  tokenMs: number;
  activityLogMs: number;
  responseMs: number;
  totalMs: number;
  hashRoundsInDb: number;
  bcryptTargetRounds: number;
  hashEngine: "bcrypt-native" | "bcryptjs";
  workerPoolSize: number;
  sideEffectsDeferred: boolean;
  status: number;
  email?: string;
};

export function logAuthLoginTiming(metrics: AuthLoginTimingMetrics): void {
  const user = metrics.email ? maskEmail(metrics.email) : "unknown";
  console.log(
    `[auth-login-timing] user=${user} status=${metrics.status} totalMs=${metrics.totalMs} ` +
      `dbLookupMs=${metrics.dbLookupMs} passwordCompareMs=${metrics.passwordCompareMs} ` +
      `profileLoadMs=${metrics.profileLoadMs} institutionLoadMs=${metrics.institutionLoadMs} ` +
      `reportScopeLoadMs=${metrics.reportScopeLoadMs} tokenMs=${metrics.tokenMs} ` +
      `activityLogMs=${metrics.activityLogMs} responseMs=${metrics.responseMs} ` +
      `hashRounds=${metrics.hashRoundsInDb} targetRounds=${metrics.bcryptTargetRounds} ` +
      `engine=${metrics.hashEngine} workerPool=${metrics.workerPoolSize}`,
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email.slice(0, 3) + "***";
  const head = local.slice(0, Math.min(3, local.length));
  return `${head}***@${domain}`;
}

export function buildAuthLoginTimingPayload(
  metrics: Omit<
    AuthLoginTimingMetrics,
    | "hashRoundsInDb"
    | "bcryptTargetRounds"
    | "hashEngine"
    | "workerPoolSize"
    | "sideEffectsDeferred"
    | "institutionLoadMs"
    | "reportScopeLoadMs"
    | "activityLogMs"
  > & {
    hashRoundsInDb?: number;
    institutionLoadMs?: number;
    reportScopeLoadMs?: number;
    activityLogMs?: number;
  },
): AuthLoginTimingMetrics {
  return {
    dbLookupMs: metrics.dbLookupMs,
    passwordCompareMs: metrics.passwordCompareMs,
    profileLoadMs: metrics.profileLoadMs,
    institutionLoadMs: metrics.institutionLoadMs ?? 0,
    reportScopeLoadMs: metrics.reportScopeLoadMs ?? 0,
    tokenMs: metrics.tokenMs,
    activityLogMs: metrics.activityLogMs ?? 0,
    responseMs: metrics.responseMs,
    totalMs: metrics.totalMs,
    hashRoundsInDb: metrics.hashRoundsInDb ?? BCRYPT_ROUNDS,
    bcryptTargetRounds: BCRYPT_ROUNDS,
    hashEngine: passwordHashEngine(),
    workerPoolSize: passwordPoolSize(),
    sideEffectsDeferred: true,
    status: metrics.status,
    email: metrics.email,
  };
}
