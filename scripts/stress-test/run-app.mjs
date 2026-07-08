import fs from "node:fs";
import path from "node:path";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_BASE,
  INSTITUTION_NAME,
  RUN_ID,
  parseUsersArg,
  resultsDir,
  studentNameForUser,
  todayIso,
} from "./lib/config.mjs";
import { apiRequest, records, resetMetrics, serverTimings } from "./lib/http.mjs";
import {
  buildReport,
  exitCodeForReport,
  reportBasename,
  writeRegisterReport,
  writeTextReport,
} from "./lib/report.mjs";
import {
  adminLogin,
  ensureLoadTestUserPool,
  loginUser,
  setupAdminInstitution,
} from "./lib/users.mjs";

function posterDraftPayload(userId) {
  return {
    record_type: "poster_draft",
    data: {
      source: "veli_bilgilendirme",
      app: "nehari_veli_bilgilendirme",
      seciliSablon: "kurumsal",
      metinDuzenlendi: true,
      savedAt: new Date().toISOString(),
      form: {
        kurumAdi: INSTITUTION_NAME,
        isim: `LOAD_TEST_Hoca_${userId}`,
        rol: "Hoca",
        posterMetni: "LOAD_TEST otomatik stres testi kaydı.",
        faaliyetSayisi: 1,
        ekNot: "LOAD_TEST",
        metinUzunlugu: "detayli",
        gorseller: [],
        faaliyetler: [{ tur: "LOAD_TEST", alan: "Test", ozelNot: "" }],
      },
    },
  };
}

/**
 * Gerçek kullanım testi: önceden oluşturulmuş LOAD_TEST_ kullanıcılarıyla login + uygulama.
 * Register yalnızca havuz yoksa setup'ta bir kez çalışır; load fazına dahil edilmez.
 */
export async function runAppTest(users) {
  console.log(`\nTedris VBS Gerçek Kullanım (APP FLOW) testi — ${users} eşzamanlı kullanıcı`);
  console.log(`API_BASE: ${API_BASE}`);

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("\n⚠ LOAD_TEST_ADMIN_EMAIL / LOAD_TEST_ADMIN_PASSWORD tanımlı değil.");
    console.warn("  Admin endpoint performans bölümü boş kalabilir.\n");
  }

  const adminToken = await adminLogin();
  if (adminToken) {
    await setupAdminInstitution(adminToken);
  }

  const setupStarted = performance.now();
  const userPool = await ensureLoadTestUserPool(users, adminToken);
  const setupElapsedSec = Number(((performance.now() - setupStarted) / 1000).toFixed(1));

  if (userPool.alreadyReady) {
    console.log("Kullanıcı havuzu hazır — register/setup atlandı.\n");
  } else {
    console.log(
      `Kullanıcı havuzu oluşturuldu (${setupElapsedSec}s): ${userPool.created} yeni, ${userPool.skipped} zaten vardı` +
        (userPool.registerUsed ? " [register fallback kullanıldı]" : " [admin API]") +
        "\n",
    );
  }

  // Setup metrikleri ana rapora karışmasın
  resetMetrics();

  const started = performance.now();
  await Promise.all(Array.from({ length: users }, (_, i) => runAppUser(i + 1, adminToken)));
  const elapsedSeconds = Number(((performance.now() - started) / 1000).toFixed(1));

  const setupNote = userPool.alreadyReady
    ? "Havuz hazırdı; setup/register çalışmadı."
    : `Setup ${setupElapsedSec}s — load fazına dahil değil.${userPool.registerUsed ? " Register yalnızca havuz oluşturmak için kullanıldı." : ""}`;

  const report = buildReport({
    mode: "app",
    records,
    serverTimings,
    meta: {
      runId: RUN_ID,
      apiBase: API_BASE,
      virtualUsers: users,
      elapsedSeconds,
      adminEmail: ADMIN_EMAIL,
      adminPassword: ADMIN_PASSWORD,
      userPool,
      setupNote,
    },
  });

  writeReports(report);
  printSummary(report, elapsedSeconds);
  return report;
}

async function runAppUser(userId, adminToken) {
  const token = await loginUser(userId, { phase: "load", includeServerTiming: true });
  if (!token) return;

  await apiRequest("GET", "/auth/me", {
    token,
    endpoint: "auth_me",
    expected: [200],
    phase: "load",
    includeServerTiming: true,
  });

  await apiRequest("GET", "/okul-takip/health", {
    endpoint: "okul_takip_health",
    expected: [200],
    phase: "load",
  });

  await apiRequest("POST", "/activity/log", {
    token,
    endpoint: "activity_log",
    expected: [200, 401],
    phase: "load",
    body: { action: "open_veli_module" },
  });

  await apiRequest("POST", "/records", {
    token,
    endpoint: "poster_draft_create",
    expected: [200, 201, 401, 403],
    phase: "load",
    body: posterDraftPayload(userId),
  });

  await apiRequest("GET", "/records?record_type=poster_draft&limit=10", {
    token,
    endpoint: "poster_draft_list",
    expected: [200, 401, 403],
    phase: "load",
  });

  const listRes = await apiRequest("GET", "/okul-takip/students", {
    token,
    endpoint: "student_list",
    expected: [200, 401, 403],
    phase: "load",
  });

  const targetName = studentNameForUser(userId);
  let studentId = listRes.json?.students?.find((s) => s?.name === targetName)?.id;

  if (!studentId) {
    const studentRes = await apiRequest("POST", "/okul-takip/students", {
      token,
      endpoint: "student_create",
      expected: [201, 401, 403, 409],
      phase: "load",
      body: {
        name: targetName,
        grade: "7",
        institutionName: INSTITUTION_NAME,
        institution: INSTITUTION_NAME,
        group: "A",
        parentPhone: "5550000000",
        isActive: true,
      },
    });
    studentId = studentRes.json?.student?.id;
  }

  if (studentId) {
    await apiRequest("PUT", "/okul-takip/daily-records", {
      token,
      endpoint: "daily_record_upsert",
      expected: [200, 201, 403],
      phase: "load",
      body: {
        records: [
          {
            studentId,
            date: todayIso(),
            institution: INSTITUTION_NAME,
            group: "A",
            attendanceStatus: "present",
            homeworkStatus: "done",
            note: "LOAD_TEST",
          },
        ],
      },
    });
  }

  await apiRequest("GET", "/okul-takip/daily-records", {
    token,
    endpoint: "daily_record_list",
    expected: [200, 401, 403],
    phase: "load",
  });

  await apiRequest("GET", `/okul-takip/reports/summary?date=${todayIso()}`, {
    token,
    endpoint: "report_summary",
    expected: [200, 403],
    phase: "load",
  });

  await apiRequest("GET", `/okul-takip/reports/missing?date=${todayIso()}`, {
    token,
    endpoint: "report_missing",
    expected: [200, 403],
    phase: "load",
  });

  if (adminToken) {
    await apiRequest("GET", "/admin/dashboard?range=7d", {
      token: adminToken,
      endpoint: "admin_dashboard",
      expected: [200, 403],
      phase: "admin",
    });
    await apiRequest("GET", "/admin/activity-logs?range=7d", {
      token: adminToken,
      endpoint: "admin_activity_logs",
      expected: [200, 403],
      phase: "admin",
    });
  }
}

function writeReports(report) {
  fs.mkdirSync(resultsDir, { recursive: true });
  const base = reportBasename("app");
  const jsonPath = path.join(resultsDir, `${base}.json`);
  const txtPath = path.join(resultsDir, `${base}.txt`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(txtPath, writeTextReport(report), "utf8");
  fs.writeFileSync(path.join(resultsDir, "stress-report.json"), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(resultsDir, "stress-report.txt"), writeTextReport(report), "utf8");
  console.log(`Rapor: ${txtPath}`);
  console.log(`JSON:  ${jsonPath}\n`);
}

function printSummary(report, elapsedSeconds) {
  const login = report.sections.loginPerformance;
  const app = report.sections.appPerformance;
  console.log(`Gerçek kullanım testi tamamlandı (${elapsedSeconds}s)`);
  console.log(`LOGIN  — avg ${login.avgResponseMs} ms | p95 ${login.p95ResponseMs} ms`);
  console.log(`UYGULAMA — avg ${app.avgResponseMs} ms | p95 ${app.p95ResponseMs} ms`);
  console.log(`Beklenmeyen hata — login: ${login.unexpectedFailedRequests}, app: ${app.unexpectedFailedRequests}`);
  if (app.slowestEndpoint) {
    console.log(`En yavaş app endpoint: ${app.slowestEndpoint.name} (p95 ${app.slowestEndpoint.p95Ms} ms)`);
  }
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "__none__")) {
  const users = parseUsersArg();
  runAppTest(users)
    .then((report) => {
      process.exitCode = exitCodeForReport(report);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    });
}
