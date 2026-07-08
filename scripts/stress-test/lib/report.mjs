/**
 * @typedef {Object} StressRecord
 * @property {string} endpoint
 * @property {string} method
 * @property {string} path
 * @property {number} durationMs
 * @property {number} status
 * @property {boolean} ok
 * @property {'setup' | 'load' | 'auth' | 'admin'} phase
 * @property {boolean} expectedPermissionDenied
 * @property {string} [error]
 */

/**
 * @typedef {Object} ServerTimingSample
 * @property {string} endpoint
 * @property {string} phase
 * @property {number} clientDurationMs
 * @property {string} [route]
 * @property {number} [totalMs]
 * @property {Record<string, number>} [steps]
 * @property {number} [bcryptRounds]
 */

const LOGIN_ENDPOINTS = new Set(["auth_login", "auth_me"]);
const REGISTER_ENDPOINTS = new Set(["auth_register", "setup_auth_register"]);
const ADMIN_ENDPOINT_PREFIX = "admin_";

export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function aggregateEndpointStats(list) {
  /** @type {Map<string, { total: number; ok: number; expected403: number; durations: number[] }>} */
  const byEndpoint = new Map();
  for (const r of list) {
    const bucket = byEndpoint.get(r.endpoint) || { total: 0, ok: 0, expected403: 0, durations: [] };
    bucket.total += 1;
    if (r.ok) bucket.ok += 1;
    if (r.expectedPermissionDenied) bucket.expected403 += 1;
    bucket.durations.push(r.durationMs);
    byEndpoint.set(r.endpoint, bucket);
  }

  return [...byEndpoint.entries()]
    .map(([endpoint, stat]) => ({
      endpoint,
      total: stat.total,
      successRate: stat.total ? stat.ok / stat.total : 0,
      expected403: stat.expected403,
      avgMs: stat.durations.length ? stat.durations.reduce((s, v) => s + v, 0) / stat.durations.length : 0,
      p95Ms: percentile([...stat.durations].sort((a, b) => a - b), 95),
      maxMs: stat.durations.length ? Math.max(...stat.durations) : 0,
    }))
    .sort((a, b) => b.p95Ms - a.p95Ms);
}

function summarizeRecords(list) {
  const total = list.length;
  const successful = list.filter((r) => r.ok).length;
  const failed = total - successful;
  const unexpectedFailed = list.filter((r) => !r.ok && !r.expectedPermissionDenied).length;
  const durations = list.map((r) => r.durationMs).sort((a, b) => a - b);
  const avgMs = durations.length ? durations.reduce((s, v) => s + v, 0) / durations.length : 0;
  const p95Ms = percentile(durations, 95);
  const endpointStats = aggregateEndpointStats(list);
  const slowest = endpointStats[0] || null;

  return {
    totalRequests: total,
    successfulRequests: successful,
    failedRequests: failed,
    unexpectedFailedRequests: unexpectedFailed,
    successRate: total ? successful / total : 0,
    avgResponseMs: Math.round(avgMs * 100) / 100,
    p95ResponseMs: Math.round(p95Ms * 100) / 100,
    slowestEndpoint: slowest
      ? { name: slowest.endpoint, p95Ms: Math.round(slowest.p95Ms * 100) / 100, avgMs: Math.round(slowest.avgMs * 100) / 100 }
      : null,
    errors: {
      status500: list.filter((r) => r.status >= 500).length,
      status404: list.filter((r) => r.status === 404).length,
      status401: list.filter((r) => r.status === 401).length,
      status403: list.filter((r) => r.status === 403).length,
      expected403: list.filter((r) => r.expectedPermissionDenied).length,
      unexpected403: list.filter((r) => r.status === 403 && !r.expectedPermissionDenied).length,
      timeouts: list.filter((r) => r.error === "timeout").length,
    },
    endpointStats,
  };
}

function aggregateServerTimings(samples, endpointFilter) {
  const filtered = endpointFilter ? samples.filter((s) => endpointFilter(s.endpoint)) : samples;
  if (!filtered.length) return null;

  const bcryptRounds = filtered.find((s) => s.bcryptRounds != null)?.bcryptRounds ?? null;
  const stepKeys = new Set();
  for (const s of filtered) {
    if (s.steps) Object.keys(s.steps).forEach((k) => stepKeys.add(k));
  }

  /** @type {Record<string, { avgMs: number; p95Ms: number; maxMs: number; count: number }>} */
  const steps = {};
  for (const key of stepKeys) {
    const values = filtered
      .map((s) => s.steps?.[key])
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b);
    if (!values.length) continue;
    steps[key] = {
      count: values.length,
      avgMs: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
      p95Ms: Math.round(percentile(values, 95) * 100) / 100,
      maxMs: Math.max(...values),
    };
  }

  const totalMs = filtered.map((s) => s.totalMs ?? s.clientDurationMs).filter(Boolean).sort((a, b) => a - b);

  return {
    bcryptRounds,
    sampleCount: filtered.length,
    serverTotalMs: {
      avg: totalMs.length ? Math.round((totalMs.reduce((a, b) => a + b, 0) / totalMs.length) * 100) / 100 : 0,
      p95: totalMs.length ? Math.round(percentile(totalMs, 95) * 100) / 100 : 0,
      max: totalMs.length ? Math.max(...totalMs) : 0,
    },
    steps,
  };
}

function isAdminEndpoint(endpoint) {
  return endpoint.startsWith(ADMIN_ENDPOINT_PREFIX);
}

function isAppEndpoint(endpoint) {
  return !LOGIN_ENDPOINTS.has(endpoint) && !REGISTER_ENDPOINTS.has(endpoint) && !isAdminEndpoint(endpoint);
}

/**
 * @param {Object} params
 * @param {'auth' | 'app'} params.mode
 * @param {StressRecord[]} params.records
 * @param {ServerTimingSample[]} params.serverTimings
 * @param {Object} params.meta
 */
export function buildReport({ mode, records, serverTimings, meta }) {
  const adminConfigured = Boolean(meta.adminEmail && meta.adminPassword);
  const adminNote = adminConfigured
    ? null
    : "LOAD_TEST_ADMIN_EMAIL / LOAD_TEST_ADMIN_PASSWORD tanımlı değil. Admin endpoint performans bölümü boş kalabilir.";

  if (mode === "app") {
    const loadRecords = records.filter((r) => r.phase === "load" || r.phase === "admin");
    const loginRecords = loadRecords.filter((r) => LOGIN_ENDPOINTS.has(r.endpoint));
    const appRecords = loadRecords.filter((r) => isAppEndpoint(r.endpoint));
    const adminRecords = loadRecords.filter((r) => isAdminEndpoint(r.endpoint));

    return {
      mode: "app",
      testType: "real_world_usage",
      description: "Gerçek kullanım testi — önceden oluşturulmuş LOAD_TEST_ kullanıcılarıyla login ve uygulama akışı.",
      runId: meta.runId,
      generatedAt: new Date().toISOString(),
      apiBase: meta.apiBase,
      virtualUsers: meta.virtualUsers,
      elapsedSeconds: meta.elapsedSeconds,
      adminConfigured,
      adminNote,
      userPool: meta.userPool ?? null,
      setupNote: meta.setupNote ?? null,
      sections: {
        loginPerformance: summarizeRecords(loginRecords),
        appPerformance: summarizeRecords(appRecords),
        adminPerformance: summarizeRecords(adminRecords),
      },
      serverTiming: {
        login: aggregateServerTimings(serverTimings, (ep) => LOGIN_ENDPOINTS.has(ep)),
      },
      samples: loadRecords.slice(0, 80),
    };
  }

  // AUTH modu — gerçek kullanım dışı
  const loadRecords = records.filter((r) => r.phase === "auth");
  const registerRecords = loadRecords.filter((r) => REGISTER_ENDPOINTS.has(r.endpoint));
  const loginRecords = loadRecords.filter((r) => LOGIN_ENDPOINTS.has(r.endpoint));

  return {
    mode: "auth",
    testType: "not_real_world_usage",
    usageNote:
      "Gerçek kullanım dışı — production'da kullanıcılar self-register olmaz; bu test bcrypt/register darboğazını ölçer.",
    runId: meta.runId,
    generatedAt: new Date().toISOString(),
    apiBase: meta.apiBase,
    virtualUsers: meta.virtualUsers,
    elapsedSeconds: meta.elapsedSeconds,
    adminConfigured,
    sections: {
      registerPerformance: {
        ...summarizeRecords(registerRecords),
        realWorldUsage: false,
        note: "Self-register production akışında yok — ana değerlendirmeye dahil edilmez.",
      },
      loginPerformance: summarizeRecords(loginRecords),
    },
    serverTiming: {
      register: aggregateServerTimings(serverTimings, (ep) => REGISTER_ENDPOINTS.has(ep)),
      login: aggregateServerTimings(serverTimings, (ep) => LOGIN_ENDPOINTS.has(ep)),
    },
    samples: loadRecords.slice(0, 80),
  };
}

function formatSection(title, section) {
  const lines = [];
  lines.push(title);
  lines.push(`- Toplam istek: ${section.totalRequests}`);
  lines.push(`- Başarılı: ${section.successfulRequests}`);
  lines.push(`- Beklenmeyen hata: ${section.unexpectedFailedRequests}`);
  lines.push(`- Ortalama: ${section.avgResponseMs} ms | p95: ${section.p95ResponseMs} ms`);
  lines.push(
    `- En yavaş: ${section.slowestEndpoint ? `${section.slowestEndpoint.name} (p95 ${section.slowestEndpoint.p95Ms} ms)` : "N/A"}`,
  );
  lines.push(`- Beklenen 403: ${section.errors.expected403} | Beklenmeyen 403: ${section.errors.unexpected403}`);
  for (const row of section.endpointStats) {
    lines.push(`  · ${row.endpoint}: avg ${Math.round(row.avgMs)} ms, p95 ${Math.round(row.p95Ms)} ms`);
  }
  return lines;
}

export function writeTextReport(report) {
  const lines = [];

  if (report.mode === "app") {
    lines.push("Tedris VBS — Gerçek Kullanım (APP FLOW) Stres Testi");
    lines.push("=".repeat(48));
    lines.push(`Run ID: ${report.runId}`);
    lines.push(`Tarih: ${report.generatedAt}`);
    lines.push(`API: ${report.apiBase}`);
    lines.push(`Sanal kullanıcı: ${report.virtualUsers}`);
    if (report.userPool) {
      lines.push(
        `Kullanıcı havuzu: ${report.userPool.alreadyReady ? "hazır (register çalışmadı)" : `${report.userPool.created} yeni, ${report.userPool.skipped} mevcut`}`,
      );
    }
    if (report.setupNote) lines.push(`Setup: ${report.setupNote}`);
    lines.push("");
    if (report.adminNote) {
      lines.push(`NOT: ${report.adminNote}`);
      lines.push("");
    }
    lines.push(...formatSection("1. LOGIN PERFORMANSI (auth_login + auth_me)", report.sections.loginPerformance));
    if (report.serverTiming?.login?.steps) {
      lines.push("  Sunucu adım dağılımı:");
      for (const [step, stat] of Object.entries(report.serverTiming.login.steps)) {
        lines.push(`    · ${step}: avg ${stat.avgMs} ms, p95 ${stat.p95Ms} ms`);
      }
    }
    lines.push("");
    lines.push(...formatSection("2. UYGULAMA İÇİ PERFORMANS", report.sections.appPerformance));
    lines.push("");
    if (report.sections.adminPerformance.totalRequests > 0) {
      lines.push(...formatSection("3. ADMIN ENDPOINT PERFORMANSI", report.sections.adminPerformance));
    } else {
      lines.push("3. ADMIN ENDPOINT PERFORMANSI");
      lines.push("- Bu koşuda admin endpoint isteği yok veya yetki tanımlı değil.");
    }
  } else {
    lines.push("Tedris VBS — AUTH Stres Testi (Gerçek Kullanım Dışı)");
    lines.push("=".repeat(48));
    lines.push(`⚠ ${report.usageNote}`);
    lines.push("");
    lines.push(`Run ID: ${report.runId}`);
    lines.push(`Tarih: ${report.generatedAt}`);
    lines.push(`API: ${report.apiBase}`);
    lines.push(`Sanal kullanıcı: ${report.virtualUsers}`);
    lines.push("");
    lines.push("REGISTER (gerçek kullanım dışı — ayrı değerlendirilir)");
    const reg = report.sections.registerPerformance;
    lines.push(`- Toplam istek: ${reg.totalRequests}`);
    lines.push(`- Ortalama: ${reg.avgResponseMs} ms | p95: ${reg.p95ResponseMs} ms`);
    lines.push(`- NOT: ${reg.note}`);
    lines.push("");
    lines.push(...formatSection("LOGIN PERFORMANSI (auth_login + auth_me)", report.sections.loginPerformance));
    if (report.serverTiming?.register) {
      lines.push("");
      lines.push("REGISTER sunucu adımları:");
      lines.push(`- bcrypt rounds: ${report.serverTiming.register.bcryptRounds ?? "N/A"}`);
      for (const [step, stat] of Object.entries(report.serverTiming.register.steps)) {
        lines.push(`  · ${step}: avg ${stat.avgMs} ms, p95 ${stat.p95Ms} ms`);
      }
    }
    if (report.serverTiming?.login?.steps) {
      lines.push("");
      lines.push("LOGIN sunucu adımları:");
      for (const [step, stat] of Object.entries(report.serverTiming.login.steps)) {
        lines.push(`  · ${step}: avg ${stat.avgMs} ms, p95 ${stat.p95Ms} ms`);
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function writeRegisterReport(report) {
  if (report.mode !== "auth") return null;
  const reg = report.sections.registerPerformance;
  return {
    testType: "not_real_world_usage",
    usageNote: report.usageNote,
    runId: report.runId,
    generatedAt: report.generatedAt,
    note: "Self-register production'da kullanılmaz. Bu dosya ana başarı değerlendirmesine dahil edilmez.",
    registerPerformance: reg,
    serverTiming: report.serverTiming?.register ?? null,
  };
}

export function reportBasename(mode) {
  return mode === "auth" ? "stress-auth-report" : "stress-app-report";
}

export function exitCodeForReport(report) {
  if (report.mode === "app") {
    const loginFail = report.sections.loginPerformance.unexpectedFailedRequests;
    const appFail = report.sections.appPerformance.unexpectedFailedRequests;
    const adminFail = report.sections.adminPerformance.unexpectedFailedRequests;
    return loginFail + appFail + adminFail > 0 ? 1 : 0;
  }
  // AUTH: sadece login/me başarısızlığı exit code'u etkiler; register ayrı
  return report.sections.loginPerformance.unexpectedFailedRequests > 0 ? 1 : 0;
}
