import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const resultsDir = path.join(root, "load-tests", "results");
const runId = process.env.LOAD_TEST_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const summaryPath = path.join(resultsDir, `k6-summary-${runId}.json`);
const reportPath = path.join(resultsDir, `load-test-report-${runId}.md`);
const browserMetricsPath = path.join(resultsDir, `browser-metrics-${runId}.jsonl`);
const apiOnly = process.argv.includes("--api-only");
const browserOnly = process.argv.includes("--browser-only");

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--profile=")) {
    process.env.LOAD_TEST_PROFILE = arg.split("=")[1] || process.env.LOAD_TEST_PROFILE;
  }
}

process.env.LOAD_TEST_RUN_ID = runId;
process.env.PLAYWRIGHT_METRICS_PATH = browserMetricsPath;

fs.mkdirSync(resultsDir, { recursive: true });

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: options.stdio ?? "pipe",
    encoding: "utf8",
    shell: false,
  });
}

function commandExists(command, args = ["--version"]) {
  const result = run(command, args);
  return result.status === 0;
}

function runPlaywright() {
  return run("pnpm", ["dlx", "playwright", "test", "load-tests/playwright/png-whatsapp-export.spec.ts", "--config", "load-tests/playwright/playwright.config.ts"], {
    stdio: "inherit",
  });
}

function collectDockerStats() {
  if (!commandExists("docker", ["version", "--format", "{{.Server.Version}}"])) {
    return { available: false, containers: [], note: "Docker CLI bulunamadı veya Docker daemon çalışmıyor." };
  }

  const result = run("docker", ["stats", "--no-stream", "--format", "{{json .}}"]);
  if (result.status !== 0) {
    return { available: true, containers: [], note: result.stderr || "docker stats okunamadı." };
  }

  const containers = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return { available: true, containers };
}

async function collectPostgresStats() {
  if (!process.env.DATABASE_URL) {
    return { available: false, note: "DATABASE_URL verilmediği için PostgreSQL metrikleri toplanmadı." };
  }

  try {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const [dbStats, locks, activity] = await Promise.all([
      client.query(`
        SELECT datname, numbackends, xact_commit, xact_rollback, blks_read, blks_hit,
               tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
               deadlocks, temp_files, temp_bytes
        FROM pg_stat_database
        WHERE datname = current_database()
      `),
      client.query(`
        SELECT mode, granted, COUNT(*)::int AS count
        FROM pg_locks
        GROUP BY mode, granted
        ORDER BY count DESC
      `),
      client.query(`
        SELECT state, wait_event_type, COUNT(*)::int AS count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state, wait_event_type
        ORDER BY count DESC
      `),
    ]);
    await client.end();
    return {
      available: true,
      database: dbStats.rows[0] ?? null,
      locks: locks.rows,
      activity: activity.rows,
    };
  } catch (error) {
    return {
      available: false,
      note: `PostgreSQL metrikleri okunamadı: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function runK6() {
  const script = path.join("load-tests", "k6", "tedris-vbs-load-test.js");
  const env = {
    ...process.env,
    LOAD_TEST_RUN_ID: runId,
    K6_SUMMARY_PATH: path.relative(root, summaryPath).replace(/\\/g, "/"),
  };

  const localK6 = commandExists("k6", ["version"]);
  if (localK6) {
    return spawnSync("k6", ["run", script], {
      cwd: root,
      env,
      stdio: "inherit",
      shell: false,
    });
  }

  const dockerAvailable = commandExists("docker", ["version", "--format", "{{.Server.Version}}"]);
  if (!dockerAvailable) {
    throw new Error("k6 bulunamadı. k6 kurun veya Docker daemon'u çalıştırın. Docker varsa script grafana/k6 imajıyla çalışır.");
  }

  const envNames = [
    "API_BASE",
    "FRONTEND_BASE",
    "LOAD_TEST_RUN_ID",
    "LOAD_TEST_PROFILE",
    "LOAD_TEST_USERS",
    "LOAD_TEST_HALF_USERS",
    "LOAD_TEST_UPLOAD_USERS",
    "LOAD_TEST_PASSWORD",
    "LOAD_TEST_EMAIL_PREFIX",
    "LOAD_TEST_EMAIL_DOMAIN",
    "LOAD_TEST_ADMIN_EMAIL",
    "LOAD_TEST_ADMIN_PASSWORD",
    "LOAD_TEST_DISTRICT",
    "LOAD_TEST_INSTITUTION_NAME",
    "LOAD_TEST_INSTITUTION_CODE",
    "LOAD_TEST_THINK_TIME_SECONDS",
    "LOAD_TEST_SCENARIO_MAX_DURATION",
    "K6_SUMMARY_PATH",
  ];

  const dockerArgs = [
    "run",
    "--rm",
    "-v",
    `${root.replace(/\\/g, "/")}:/work`,
    "-w",
    "/work",
    ...envNames.flatMap((name) => ["-e", name]),
    "grafana/k6:latest",
    "run",
    script.replace(/\\/g, "/"),
  ];

  return spawnSync("docker", dockerArgs, {
    cwd: root,
    env,
    stdio: "inherit",
    shell: false,
  });
}

function metricValue(metric, key) {
  return metric?.values?.[key] ?? null;
}

function pct(n, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return "N/A";
  return `${(Number(n) * 100).toFixed(digits)}%`;
}

function ms(n) {
  if (n == null || Number.isNaN(Number(n))) return "N/A";
  return `${Number(n).toFixed(2)} ms`;
}

function count(summary, name) {
  return summary.metrics?.[name]?.values?.count ?? 0;
}

function endpointRows(summary) {
  return Object.entries(summary.metrics ?? {})
    .filter(([name]) => name.startsWith("ep_"))
    .map(([name, metric]) => ({
      name: name.replace(/^ep_/, ""),
      avg: metricValue(metric, "avg"),
      p95: metricValue(metric, "p(95)"),
      max: metricValue(metric, "max"),
      count: metricValue(metric, "count"),
    }))
    .sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0));
}

function readBrowserMetrics() {
  if (!fs.existsSync(browserMetricsPath)) {
    return { available: false, rows: [], note: "Browser metriği bulunamadı." };
  }
  const rows = fs.readFileSync(browserMetricsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return { available: true, rows };
}

function avgRows(rows, selector) {
  const values = rows.map(selector).filter((v) => Number.isFinite(Number(v))).map(Number);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxRows(rows, selector) {
  const values = rows.map(selector).filter((v) => Number.isFinite(Number(v))).map(Number);
  if (!values.length) return null;
  return Math.max(...values);
}

function browserSummary(browserMetrics) {
  const rows = browserMetrics.rows ?? [];
  const failed = rows.filter((row) => row.success === false).length;
  const pageTimings = ["page_open", "first_render", "png_export", "whatsapp_share", "login", "attendance_page", "api_attendance_homework", "api_report"];
  const slowestPage = pageTimings
    .map((name) => ({ name, avg: avgRows(rows, (row) => row.timings?.[name]), max: maxRows(rows, (row) => row.timings?.[name]) }))
    .filter((row) => row.avg != null)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))[0] ?? null;
  return {
    total: rows.length,
    success: rows.length - failed,
    failed,
    slowestPage,
    avgLogin: avgRows(rows, (row) => row.timings?.login),
    avgRender: avgRows(rows, (row) => row.timings?.first_render || row.timings?.firstContentfulPaint),
    avgPng: avgRows(rows, (row) => row.timings?.png_export),
    avgWhatsapp: avgRows(rows, (row) => row.timings?.whatsapp_share),
    avgHeap: avgRows(rows, (row) => row.browser?.jsHeapUsed),
    maxHeap: maxRows(rows, (row) => row.browser?.jsHeapUsed),
    avgCpuTask: avgRows(rows, (row) => row.browser?.taskDuration),
    consoleErrors: rows.reduce((sum, row) => sum + (row.consoleErrors?.length ?? 0), 0),
    networkErrors: rows.reduce((sum, row) => sum + (row.networkErrors?.length ?? 0), 0),
    pageErrors: rows.reduce((sum, row) => sum + (row.pageErrors?.length ?? 0), 0),
  };
}

function buildBottleneckAnalysis(summary, pgStats, dockerStats) {
  const endpoints = endpointRows(summary);
  const slowest = endpoints[0];
  const failedRate = metricValue(summary.metrics?.http_req_failed, "rate") ?? 0;
  const p95 = metricValue(summary.metrics?.http_req_duration, "p(95)") ?? 0;
  const status500Count = count(summary, "status_500");
  const status401Count = count(summary, "status_401");
  const status404Count = count(summary, "status_404");
  const timeoutTotal = count(summary, "timeout_count");
  const deadlocks = Number(pgStats?.database?.deadlocks ?? 0);
  const lockWaits = Array.isArray(pgStats?.locks)
    ? pgStats.locks.filter((lock) => lock.granted === false || lock.granted === "f").reduce((sum, lock) => sum + Number(lock.count || 0), 0)
    : 0;

  const notes = [];
  notes.push(slowest ? `En çok zorlanan endpoint p95 değerine göre "${slowest.name}" görünüyor.` : "Endpoint bazlı metrik bulunamadı.");
  notes.push(p95 > 3000 ? "Genel p95 yanıt süresi 3 saniyenin üzerinde; kullanıcı deneyimi tarafında darboğaz riski var." : "Genel p95 yanıt süresi kabul edilebilir eşikte.");
  notes.push(failedRate > 0.05 ? "Başarısız istek oranı %5 üzerinde; hata analizi öncelikli incelenmeli." : "Başarısız istek oranı hedef eşik altında.");
  notes.push(status500Count > 0 ? `${status500Count} adet 500 hatası var; uygulama loglarıyla eşleştirilmeli.` : "500 hatası gözlenmedi.");
  notes.push(status401Count > 0 ? `${status401Count} adet 401 var; auth/session veya test credential yapılandırması kontrol edilmeli.` : "401 hatası gözlenmedi.");
  notes.push(status404Count > 0 ? `${status404Count} adet 404 var; endpoint yolu veya deploy sürümü kontrol edilmeli.` : "404 hatası gözlenmedi.");
  notes.push(timeoutTotal > 0 ? `${timeoutTotal} timeout var; network, API veya DB beklemeleri incelenmeli.` : "Timeout gözlenmedi.");
  notes.push(deadlocks > 0 ? `PostgreSQL deadlock sayacı ${deadlocks}; eşzamanlı yazma akışları incelenmeli.` : "PostgreSQL deadlock sinyali yok.");
  notes.push(lockWaits > 0 ? `PostgreSQL'de ${lockWaits} bekleyen lock görünüyor.` : "PostgreSQL lock bekleme sinyali yok veya metrik alınamadı.");

  if (dockerStats.available && dockerStats.containers.length) {
    const hot = dockerStats.containers
      .map((c) => `${c.Name || c.Container}: CPU ${c.CPUPerc}, RAM ${c.MemUsage}`)
      .slice(0, 5)
      .join("; ");
    notes.push(`Docker anlık kullanım: ${hot}`);
  } else {
    notes.push(dockerStats.note || "Docker kullanım metriği alınamadı.");
  }

  return notes;
}

function writeReport(summary, dockerBefore, dockerAfter, pgStats, browserMetrics) {
  const endpoints = endpointRows(summary);
  const browser = browserSummary(browserMetrics);
  const slowest = endpoints[0];
  const totalRequests = metricValue(summary.metrics?.http_reqs, "count") ?? 0;
  const failedRate = metricValue(summary.metrics?.http_req_failed, "rate") ?? 0;
  const successRate = 1 - failedRate;
  const avg = metricValue(summary.metrics?.http_req_duration, "avg");
  const p95 = metricValue(summary.metrics?.http_req_duration, "p(95)");
  const max = metricValue(summary.metrics?.http_req_duration, "max");
  const vusMax = metricValue(summary.metrics?.vus_max, "max");
  const checksRate = metricValue(summary.metrics?.checks, "rate");
  const lines = [];

  lines.push(`# Tedris VBS Yük Testi Raporu`);
  lines.push("");
  lines.push(`Run ID: \`${runId}\``);
  lines.push(`Tarih: ${new Date().toISOString()}`);
  lines.push(`API_BASE: \`${process.env.API_BASE || "http://localhost:3001/api"}\``);
  lines.push(`FRONTEND_BASE: \`${process.env.FRONTEND_BASE || "http://localhost:3000"}\``);
  lines.push("");
  lines.push(`## Özet`);
  lines.push(`- Toplam Sanal Kullanıcı: ${vusMax ?? process.env.LOAD_TEST_USERS ?? 100}`);
  lines.push(`- Toplam İstek: ${totalRequests}`);
  lines.push(`- Başarılı İstek: ${pct(successRate)}`);
  lines.push(`- Başarısız İstek: ${pct(failedRate)}`);
  lines.push(`- Check Başarı Oranı: ${pct(checksRate)}`);
  lines.push(`- Ortalama Yanıt Süresi: ${ms(avg)}`);
  lines.push(`- p95 Yanıt Süresi: ${ms(p95)}`);
  lines.push(`- En Yavaş İstek: ${ms(max)}`);
  lines.push(`- En Yavaş Endpoint: ${slowest ? `${slowest.name} (p95 ${ms(slowest.p95)}, max ${ms(slowest.max)})` : "N/A"}`);
  lines.push(`- En Yavaş Sayfa/Akış: ${browser.slowestPage ? `${browser.slowestPage.name} (avg ${ms(browser.slowestPage.avg)}, max ${ms(browser.slowestPage.max)})` : "N/A"}`);
  lines.push(`- PNG Ortalama Üretim Süresi: ${ms(browser.avgPng)}`);
  lines.push(`- Login Ortalaması: ${ms(browser.avgLogin ?? avg)}`);
  lines.push(`- Render Süresi: ${ms(browser.avgRender)}`);
  lines.push("");
  lines.push(`## Hata Sayıları`);
  lines.push(`- Timeout Sayısı: ${count(summary, "timeout_count")}`);
  lines.push(`- 500 Hatası: ${count(summary, "status_500")}`);
  lines.push(`- 404 Hatası: ${count(summary, "status_404")}`);
  lines.push(`- 401 Hatası: ${count(summary, "status_401")}`);
  lines.push(`- 403 Hatası: ${count(summary, "status_403")}`);
  lines.push("");
  lines.push(`## Endpoint Performansı`);
  for (const row of endpoints.slice(0, 20)) {
    lines.push(`- ${row.name}: count ${row.count ?? 0}, avg ${ms(row.avg)}, p95 ${ms(row.p95)}, max ${ms(row.max)}`);
  }
  lines.push("");
  lines.push(`## Sistem Kullanımı`);
  lines.push(`- CPU Kullanımı: ${dockerAfter.available && dockerAfter.containers.length ? "Docker container CPU yüzdeleri aşağıda." : "Otomatik toplanamadı; local process metriği için OS/VPS izleme ekleyin."}`);
  lines.push(`- RAM Kullanımı: ${dockerAfter.available && dockerAfter.containers.length ? "Docker container RAM değerleri aşağıda." : "Otomatik toplanamadı; local process metriği için OS/VPS izleme ekleyin."}`);
  lines.push(`- Docker Kullanımı Öncesi: ${dockerBefore.available ? JSON.stringify(dockerBefore.containers.slice(0, 5)) : dockerBefore.note}`);
  lines.push(`- Docker Kullanımı Sonrası: ${dockerAfter.available ? JSON.stringify(dockerAfter.containers.slice(0, 5)) : dockerAfter.note}`);
  lines.push(`- PostgreSQL Kullanımı: ${pgStats.available ? JSON.stringify(pgStats.database) : pgStats.note}`);
  lines.push(`- PostgreSQL Lock Durumu: ${pgStats.available ? JSON.stringify(pgStats.locks) : "N/A"}`);
  lines.push(`- Browser Memory Ortalama: ${browser.avgHeap != null ? `${Math.round(browser.avgHeap / 1024 / 1024)} MB` : "N/A"}`);
  lines.push(`- Browser Memory Maksimum: ${browser.maxHeap != null ? `${Math.round(browser.maxHeap / 1024 / 1024)} MB` : "N/A"}`);
  lines.push(`- Browser CPU/Task Ortalama: ${browser.avgCpuTask != null ? browser.avgCpuTask.toFixed(4) : "N/A"}`);
  lines.push("");
  lines.push(`## Gerçek Tarayıcı Kullanıcı Deneyimi`);
  lines.push(`- Browser Kullanıcı Sayısı: ${browser.total}`);
  lines.push(`- Browser Başarılı: ${browser.success}`);
  lines.push(`- Browser Başarısız: ${browser.failed}`);
  lines.push(`- Console Error/Warning: ${browser.consoleErrors}`);
  lines.push(`- Network Error: ${browser.networkErrors}`);
  lines.push(`- Page/Unhandled Promise/React Error: ${browser.pageErrors}`);
  lines.push(`- PNG Ortalama: ${ms(browser.avgPng)}`);
  lines.push(`- WhatsApp Başlatma Ortalama: ${ms(browser.avgWhatsapp)}`);
  lines.push(`- İlk Render Ortalama: ${ms(browser.avgRender)}`);
  lines.push(`- En Yavaş Sayfa/Akış: ${browser.slowestPage ? `${browser.slowestPage.name} (${ms(browser.slowestPage.avg)})` : "N/A"}`);
  lines.push("");
  lines.push(`## Bottleneck Analizi`);
  for (const note of buildBottleneckAnalysis(summary, pgStats, dockerAfter)) {
    lines.push(`- ${note}`);
  }
  lines.push("");
  lines.push(`## Profesyonel Kontrol Listesi`);
  const byName = new Map(endpoints.map((row) => [row.name, row]));
  const studentCreate = byName.get("student_create");
  const dailyUpsert = byName.get("daily_record_upsert");
  const homework = byName.get("homework_tracking");
  const upload = byName.get("file_upload");
  const png = byName.get("png_activity");
  const whatsapp = byName.get("whatsapp_activity");
  const lockWaits = Array.isArray(pgStats?.locks)
    ? pgStats.locks.filter((lock) => lock.granted === false || lock.granted === "f").reduce((sum, lock) => sum + Number(lock.count || 0), 0)
    : 0;
  lines.push(`- En çok zorlanan API: ${slowest ? `${slowest.name} (p95 ${ms(slowest.p95)})` : "N/A"}`);
  lines.push(`- Darboğaz nerede: ${slowest && (slowest.p95 ?? 0) > 3000 ? `${slowest.name} endpoint'i p95 eşiğini aşıyor.` : "Bu koşuda belirgin API darboğazı görünmüyor."}`);
  lines.push(`- Bellek kaçağı var mı: ${dockerBefore.available && dockerAfter.available ? "Tek koşuda kesin kanıtlanamaz; Docker öncesi/sonrası RAM değerleri rapora eklendi. Artan trend için testi ardışık çalıştırın." : "RAM metriği alınamadığı için yorumlanamadı."}`);
  lines.push(`- Aynı anda veri eklenince çakışma oluyor mu: ${studentCreate && (studentCreate.count ?? 0) > 0 ? `öğrenci ekleme p95 ${ms(studentCreate.p95)}; 409/500 sayıları hata bölümünde izlenmeli.` : "öğrenci ekleme metriği yok veya yetki/kurum eşleşmesi nedeniyle çalışmadı."}`);
  lines.push(`- Database lock oluşuyor mu: ${lockWaits > 0 ? `${lockWaits} bekleyen lock tespit edildi.` : "Bekleyen PostgreSQL lock sinyali yok veya metrik alınamadı."}`);
  lines.push(`- Upload sistemi sorun çıkarıyor mu: ${upload ? `upload p95 ${ms(upload.p95)}, max ${ms(upload.max)}.` : "upload metriği yok."}`);
  lines.push(`- PNG oluştururken darboğaz oluşuyor mu: ${png ? `backend activity p95 ${ms(png.p95)}. Gerçek html2canvas CPU süresi için Playwright browser testi kullanılır.` : "PNG backend metriği yok."}`);
  lines.push(`- WhatsApp paylaşımı sistemi etkiliyor mu: ${whatsapp ? `backend activity p95 ${ms(whatsapp.p95)}. Web Share popup etkisi tarayıcı/cihaz bağımlıdır.` : "WhatsApp backend metriği yok."}`);
  lines.push(`- Gerçek kullanıcı deneyiminde en zorlanan modül: ${browser.slowestPage ? browser.slowestPage.name : slowest?.name ?? "N/A"}`);
  lines.push(`- Yoklama kayıtları: ${dailyUpsert ? `daily upsert p95 ${ms(dailyUpsert.p95)}.` : "daily upsert metriği yok."}`);
  lines.push(`- Yurt ödev takibi: ${homework ? `homework p95 ${ms(homework.p95)}.` : "homework metriği yok."}`);
  lines.push("");
  lines.push(`## Senaryo Notları`);
  lines.push(`- PNG oluşturma ve WhatsApp paylaşımı tarayıcı tarafında çalışır; k6 senaryosu bu işlemlerin backend activity/usage etkisini ölçer.`);
  lines.push(`- Gerçek html2canvas/Web Share süresi için \`pnpm load-test:browser\` komutu eklendi.`);
  lines.push(`- Öğrenci/yoklama/yurt ödev senaryolarının başarılı olması için test kullanıcılarının kurum eşleşmesi gerekir. \`LOAD_TEST_ADMIN_EMAIL\` ve \`LOAD_TEST_ADMIN_PASSWORD\` verilirse kurumsal veri hazırlığı yapılabilir.`);
  lines.push(`- Test production hedefinde çalıştırılırsa benzersiz load-test kullanıcıları ve kayıtları oluşturur.`);
  lines.push("");
  lines.push(`## Ham Dosyalar`);
  lines.push(`- k6 JSON: \`${path.relative(root, summaryPath)}\``);
  lines.push(`- Browser JSONL: \`${path.relative(root, browserMetricsPath)}\``);
  lines.push(`- Rapor: \`${path.relative(root, reportPath)}\``);
  lines.push("");

  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
}

async function main() {
  const dockerBefore = collectDockerStats();
  let k6Result = { status: 0 };
  let summary = { metrics: {} };

  if (!browserOnly) {
    k6Result = runK6();

    if (!fs.existsSync(summaryPath)) {
      throw new Error(`k6 summary dosyası bulunamadı: ${summaryPath}`);
    }

    summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  }

  if (!apiOnly) {
    const browserResult = runPlaywright();
    if (browserResult.status !== 0) {
      console.warn("Playwright gerçek kullanıcı testi başarısız oldu. Rapor mevcut metriklerle üretilecek.");
    }
  }

  const dockerAfter = collectDockerStats();
  const pgStats = await collectPostgresStats();
  const browserMetrics = readBrowserMetrics();
  writeReport(summary, dockerBefore, dockerAfter, pgStats, browserMetrics);

  console.log(`\nLoad test raporu hazır: ${reportPath}`);
  process.exitCode = k6Result.status ?? 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
