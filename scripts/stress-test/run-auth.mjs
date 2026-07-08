import fs from "node:fs";
import path from "node:path";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_BASE,
  PASSWORD,
  RUN_ID,
  parseUsersArg,
  resultsDir,
  userDisplayName,
} from "./lib/config.mjs";
import { apiRequest, records, resetMetrics, serverTimings } from "./lib/http.mjs";
import {
  buildReport,
  exitCodeForReport,
  reportBasename,
  writeRegisterReport,
  writeTextReport,
} from "./lib/report.mjs";
import { authTestEmailForUser } from "./lib/users.mjs";

/**
 * AUTH testi (gerçek kullanım dışı): register + login + auth/me.
 * Register sonuçları ayrı dosyada; ana değerlendirme login/me üzerinden.
 */
export async function runAuthTest(users) {
  resetMetrics();

  console.log(`\nTedris VBS AUTH testi (gerçek kullanım dışı) — ${users} eşzamanlı kullanıcı`);
  console.log(`API_BASE: ${API_BASE}`);
  console.log("NOT: Production'da self-register yok; register metrikleri ayrı raporlanır.\n");

  const started = performance.now();
  await Promise.all(Array.from({ length: users }, (_, i) => runAuthUser(i + 1)));
  const elapsedSeconds = Number(((performance.now() - started) / 1000).toFixed(1));

  const report = buildReport({
    mode: "auth",
    records,
    serverTimings,
    meta: {
      runId: RUN_ID,
      apiBase: API_BASE,
      virtualUsers: users,
      elapsedSeconds,
      adminEmail: ADMIN_EMAIL,
      adminPassword: ADMIN_PASSWORD,
    },
  });

  writeReports(report);
  printSummary(report, elapsedSeconds);
  return report;
}

async function runAuthUser(userId) {
  const email = authTestEmailForUser(userId);

  await apiRequest("POST", "/auth/register", {
    endpoint: "auth_register",
    expected: [200, 201, 409],
    phase: "auth",
    includeServerTiming: true,
    body: { email, password: PASSWORD, name: userDisplayName(userId) },
  });

  const login = await apiRequest("POST", "/auth/login", {
    endpoint: "auth_login",
    expected: [200],
    phase: "auth",
    includeServerTiming: true,
    body: { email, password: PASSWORD },
  });

  const token = login.json?.sessionToken;
  if (!token) return;

  await apiRequest("GET", "/auth/me", {
    token,
    endpoint: "auth_me",
    expected: [200],
    phase: "auth",
    includeServerTiming: true,
  });
}

function writeReports(report) {
  fs.mkdirSync(resultsDir, { recursive: true });
  const base = reportBasename("auth");
  const jsonPath = path.join(resultsDir, `${base}.json`);
  const txtPath = path.join(resultsDir, `${base}.txt`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(txtPath, writeTextReport(report), "utf8");

  const registerReport = writeRegisterReport(report);
  if (registerReport) {
    fs.writeFileSync(path.join(resultsDir, "stress-register-report.json"), JSON.stringify(registerReport, null, 2), "utf8");
    fs.writeFileSync(
      path.join(resultsDir, "stress-register-report.txt"),
      [
        "Tedris VBS — REGISTER Performans (Gerçek Kullanım Dışı)",
        "=".repeat(48),
        registerReport.usageNote,
        "",
        `Ortalama: ${registerReport.registerPerformance.avgResponseMs} ms`,
        `p95: ${registerReport.registerPerformance.p95ResponseMs} ms`,
        "",
        registerReport.note,
      ].join("\n"),
      "utf8",
    );
    console.log(`Register raporu: load-test-results/stress-register-report.txt`);
  }

  console.log(`Auth raporu: ${txtPath}`);
  console.log(`JSON:         ${jsonPath}\n`);
}

function printSummary(report, elapsedSeconds) {
  const login = report.sections.loginPerformance;
  const reg = report.sections.registerPerformance;
  console.log(`AUTH testi tamamlandı (${elapsedSeconds}s)`);
  console.log(`LOGIN (değerlendirilen) — avg ${login.avgResponseMs} ms | p95 ${login.p95ResponseMs} ms`);
  console.log(`REGISTER (ayrı, gerçek kullanım dışı) — avg ${reg.avgResponseMs} ms | p95 ${reg.p95ResponseMs} ms`);
  if (report.serverTiming?.login) {
    const cmp = report.serverTiming.login.steps?.passwordCompareMs;
    if (cmp) console.log(`passwordCompare avg: ${cmp.avgMs} ms (p95 ${cmp.p95Ms} ms)`);
  }
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "__none__")) {
  const users = parseUsersArg();
  runAuthTest(users)
    .then((report) => {
      process.exitCode = exitCodeForReport(report);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    });
}
