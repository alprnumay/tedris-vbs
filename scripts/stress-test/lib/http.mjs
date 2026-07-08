import { API_BASE, TIMEOUT_MS } from "./config.mjs";

/** @type {import('./report.mjs').StressRecord[]} */
export const records = [];

/** @type {import('./report.mjs').ServerTimingSample[]} */
export const serverTimings = [];

/**
 * @param {string} method
 * @param {string} urlPath
 * @param {{
 *   body?: unknown;
 *   token?: string;
 *   endpoint: string;
 *   expected?: number[];
 *   phase?: 'setup' | 'load' | 'auth' | 'admin';
 *   includeServerTiming?: boolean;
 * }} opts
 */
export async function apiRequest(method, urlPath, opts = {}) {
  const {
    body,
    token,
    endpoint,
    expected = [200, 201],
    phase = "load",
    includeServerTiming = false,
  } = opts;

  const url = urlPath.startsWith("http") ? urlPath : `${API_BASE}${urlPath}`;
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (includeServerTiming) headers["X-Load-Test-Timing"] = "1";

  const clientStarted = performance.now();
  let status = 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    status = res.status;
    const durationMs = performance.now() - clientStarted;

    let json = null;
    try {
      json = await res.json();
    } catch {
      /* non-json */
    }

    const expectedPermissionDenied = status === 403 && expected.includes(403);
    const ok = expected.includes(status);

    /** @type {import('./report.mjs').StressRecord} */
    const record = {
      endpoint,
      method,
      path: urlPath,
      durationMs,
      status,
      ok,
      phase,
      expectedPermissionDenied,
      error: ok ? undefined : `unexpected status ${status}`,
    };
    records.push(record);

    if (json?._timing) {
      const t = json._timing;
      const steps =
        t.steps ??
        (t.dbLookupMs != null || t.lookupMs != null
          ? {
              dbLookupMs: t.dbLookupMs ?? t.lookupMs,
              passwordCompareMs: t.passwordCompareMs,
              profileLoadMs: t.profileLoadMs ?? t.profileMs,
              institutionLoadMs: t.institutionLoadMs ?? 0,
              reportScopeLoadMs: t.reportScopeLoadMs ?? 0,
              tokenMs: t.tokenMs,
              activityLogMs: t.activityLogMs ?? 0,
              responseMs: t.responseMs,
              totalMs: t.totalMs,
            }
          : undefined);
      serverTimings.push({
        endpoint,
        phase,
        clientDurationMs: durationMs,
        lookupMs: t.lookupMs,
        passwordCompareMs: t.passwordCompareMs,
        profileMs: t.profileMs,
        tokenMs: t.tokenMs,
        totalMs: t.totalMs ?? durationMs,
        bcryptRounds: t.bcryptRounds ?? t.hashRoundsInDb,
        hashEngine: t.hashEngine,
        steps,
        ...t,
      });
    }

    return { status, json, ok, durationMs, expectedPermissionDenied };
  } catch (err) {
    const durationMs = performance.now() - clientStarted;
    const error = err instanceof Error ? err.message : String(err);
    const isTimeout = /abort|timeout/i.test(error);
    records.push({
      endpoint,
      method,
      path: urlPath,
      durationMs,
      status: isTimeout ? 0 : status,
      ok: false,
      phase,
      expectedPermissionDenied: false,
      error: isTimeout ? "timeout" : error,
    });
    return { status, json: null, ok: false, durationMs, error, expectedPermissionDenied: false };
  }
}

export function resetMetrics() {
  records.length = 0;
  serverTimings.length = 0;
}
