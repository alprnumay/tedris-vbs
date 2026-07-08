import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

const apiBase = (process.env.API_BASE || "http://localhost:3001/api").replace(/\/$/, "");
const pngSelector = process.env.LOAD_TEST_PNG_SELECTOR || "text=/PNG|Afişi İndir|İndir/i";
const waSelector = process.env.LOAD_TEST_WHATSAPP_SELECTOR || "text=/WA|WhatsApp ile Gönder|WhatsApp/i";
const browserUsers = Number(process.env.LOAD_TEST_BROWSER_USERS || 20);
const runId = process.env.LOAD_TEST_RUN_ID || `${Date.now()}`;
const metricsPath = process.env.PLAYWRIGHT_METRICS_PATH || `load-tests/results/browser-metrics-${runId}.jsonl`;
const emailPrefix = process.env.LOAD_TEST_EMAIL_PREFIX || "loadtest";
const emailDomain = process.env.LOAD_TEST_EMAIL_DOMAIN || "example.test";
const userPassword = process.env.LOAD_TEST_PASSWORD || "LoadTest123!";
const adminEmail = process.env.LOAD_TEST_ADMIN_EMAIL || "";
const adminPassword = process.env.LOAD_TEST_ADMIN_PASSWORD || "";
const district = process.env.LOAD_TEST_DISTRICT || "Alanya";
const institutionName = process.env.LOAD_TEST_INSTITUTION_NAME || "Tedris Load Test Yurdu";
const institutionCode = process.env.LOAD_TEST_INSTITUTION_CODE || `LT-${runId}`;

type BrowserMetric = {
  user: number;
  success: boolean;
  errors: string[];
  consoleErrors: string[];
  networkErrors: string[];
  pageErrors: string[];
  timings: Record<string, number>;
  browser: {
    jsHeapUsed?: number;
    jsHeapTotal?: number;
    nodes?: number;
    documents?: number;
    layoutCount?: number;
    recalcStyleCount?: number;
    scriptDuration?: number;
    taskDuration?: number;
  };
};

fs.mkdirSync("load-tests/results", { recursive: true });

function emailForUser(index: number) {
  return `${emailPrefix}+browser-${runId}-${index}@${emailDomain}`.toLowerCase();
}

async function ensureBrowserUser(page: Page, index: number) {
  const email = process.env.LOAD_TEST_BROWSER_EMAIL || emailForUser(index);
  const password = process.env.LOAD_TEST_BROWSER_PASSWORD || userPassword;

  if (adminEmail && adminPassword && !process.env.LOAD_TEST_BROWSER_EMAIL) {
    const adminLogin = await page.request.post(`${apiBase}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
      timeout: 30_000,
    });
    if (adminLogin.ok()) {
      await page.request.post(`${apiBase}/admin/users`, {
        data: {
          email,
          password,
          name: `Browser Load Test Kullanıcı ${index}`,
          province: "Antalya",
          district,
          institutionName,
          institutionCode,
          role: "hoca",
          isActive: true,
        },
        timeout: 30_000,
      });
    }
  } else if (!process.env.LOAD_TEST_BROWSER_EMAIL) {
    await page.request.post(`${apiBase}/auth/register`, {
      data: { email, password, name: `Browser Load Test Kullanıcı ${index}` },
      timeout: 30_000,
    });
  }

  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: { email, password },
    timeout: 30_000,
  });
  expect(response.ok(), `API login failed: ${response.status()}`).toBeTruthy();
  const payload = await response.json();
  return { email, token: payload.sessionToken as string };
}

async function installObservers(page: Page, metric: BrowserMetric) {
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) metric.consoleErrors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => metric.pageErrors.push(err.message));
  page.on("requestfailed", (req) => metric.networkErrors.push(`${req.method()} ${req.url()} ${req.failure()?.errorText ?? ""}`));
  await page.addInitScript(() => {
    window.addEventListener("error", (event) => {
      const key = "loadTestErrors";
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      current.push({ type: "window.error", message: event.message, filename: event.filename });
      localStorage.setItem(key, JSON.stringify(current.slice(-50)));
    });
    window.addEventListener("unhandledrejection", (event) => {
      const key = "loadTestErrors";
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      current.push({ type: "unhandledrejection", message: String(event.reason?.message || event.reason) });
      localStorage.setItem(key, JSON.stringify(current.slice(-50)));
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => undefined,
    });
  });
}

async function time<T>(metric: BrowserMetric, name: string, fn: () => Promise<T>): Promise<T | null> {
  const started = Date.now();
  try {
    const result = await fn();
    metric.timings[name] = Date.now() - started;
    return result;
  } catch (error) {
    metric.timings[name] = Date.now() - started;
    metric.errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function clickFirst(page: Page, metric: BrowserMetric, name: string, selectors: string[]) {
  return time(metric, name, async () => {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if (await locator.count().catch(() => 0)) {
        await locator.click({ timeout: 10_000 });
        return true;
      }
    }
    throw new Error(`Selector bulunamadı: ${selectors.join(" | ")}`);
  });
}

async function fillByPlaceholder(page: Page, placeholder: RegExp, value: string) {
  const locator = page.getByPlaceholder(placeholder).first();
  if (await locator.count().catch(() => 0)) {
    await locator.fill(value, { timeout: 5_000 });
  }
}

async function collectBrowserStats(page: Page) {
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType("paint").map((entry) => ({ name: entry.name, startTime: entry.startTime }));
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    return {
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
      load: nav ? nav.loadEventEnd - nav.startTime : 0,
      firstPaint: paint.find((entry) => entry.name === "first-paint")?.startTime ?? 0,
      firstContentfulPaint: paint.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? 0,
      jsHeapUsed: memory?.usedJSHeapSize,
      jsHeapTotal: memory?.totalJSHeapSize,
      loadTestErrors: JSON.parse(localStorage.getItem("loadTestErrors") || "[]"),
    };
  });

  const cdp = await page.context().newCDPSession(page).catch(() => null);
  if (!cdp) return { perf };
  await cdp.send("Performance.enable").catch(() => undefined);
  const metrics = await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] as Array<{ name: string; value: number }> }));
  const map = new Map(metrics.metrics.map((item) => [item.name, item.value]));
  return {
    perf,
    cdp: {
      nodes: map.get("Nodes"),
      documents: map.get("Documents"),
      layoutCount: map.get("LayoutCount"),
      recalcStyleCount: map.get("RecalcStyleCount"),
      scriptDuration: map.get("ScriptDuration"),
      taskDuration: map.get("TaskDuration"),
    },
  };
}

async function apiUserActions(page: Page, metric: BrowserMetric) {
  await time(metric, "api_profile", () => page.request.get(`${apiBase}/profiles`, { timeout: 30_000 }));
  await time(metric, "api_create_student", () => page.request.post(`${apiBase}/okul-takip/students`, {
    data: {
      name: `Browser Ogrenci ${runId}`,
      grade: "7",
      institutionName,
      group: "A",
      parentPhone: "5550000000",
      isActive: true,
    },
    timeout: 30_000,
  }));
  await time(metric, "api_attendance_homework", () => page.request.get(`${apiBase}/okul-takip/daily-records`, { timeout: 30_000 }));
  await time(metric, "api_report", () => page.request.get(`${apiBase}/okul-takip/reports/summary?date=${new Date().toISOString().slice(0, 10)}`, { timeout: 30_000 }));
}

async function runVeliFlow(page: Page, metric: BrowserMetric, index: number) {
  await time(metric, "page_open", () => page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 }));
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);

  await time(metric, "first_render", async () => {
    await expect(page.locator("body")).toBeVisible();
    await page.locator("body").waitFor({ state: "visible", timeout: 30_000 });
  });

  await time(metric, "veli_fill_form", async () => {
    await fillByPlaceholder(page, /ad soyad|isim/i, `Browser Test Hoca ${index}`);
    await fillByPlaceholder(page, /kurum|yurt|okul/i, institutionName);
    await fillByPlaceholder(page, /rol|görev/i, "Hoca");
    await fillByPlaceholder(page, /alan|ders|faaliyet/i, "Matematik Etüdü");
    await fillByPlaceholder(page, /not|açıklama/i, `Browser yük testi ${runId}`);
  });

  await clickFirst(page, metric, "preview_open", [
    "text=/Afişe Geç|Önizleme|Devam|İleri/i",
    "button:has-text('Afişe Geç')",
  ]);

  await time(metric, "png_export", async () => {
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 }).catch(() => null);
    await page.locator(pngSelector).first().click({ timeout: 30_000 });
    await downloadPromise;
  });

  await clickFirst(page, metric, "whatsapp_share", [waSelector]);

  await clickFirst(page, metric, "poster_create", [
    "text=/Afiş Oluştur|Afişe Geç|PNG/i",
    "button:has-text('PNG')",
  ]);
}

async function runOkulTakipFlow(page: Page, metric: BrowserMetric) {
  await time(metric, "attendance_page", async () => {
    await page.goto("/davet/okul-takip", { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(async () => {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    });
  });
  await apiUserActions(page, metric);
  await clickFirst(page, metric, "attendance_ui", ["text=/Yoklama|Günlük Takip|Takip/i"]).catch(() => undefined);
  await clickFirst(page, metric, "homework_ui", ["text=/Ödev|Ödev Takibi|Yurt Ödev/i"]).catch(() => undefined);
  await clickFirst(page, metric, "karne_ui", ["text=/Karne|Karneler/i"]).catch(() => undefined);
}

function persistMetric(metric: BrowserMetric) {
  fs.appendFileSync(metricsPath, `${JSON.stringify(metric)}\n`, "utf8");
}

test.describe.configure({ mode: "parallel" });

for (let i = 0; i < browserUsers; i += 1) {
  test(`real browser user flow ${i + 1}`, async ({ page }) => {
    const metric: BrowserMetric = {
      user: i + 1,
      success: false,
      errors: [],
      consoleErrors: [],
      networkErrors: [],
      pageErrors: [],
      timings: {},
      browser: {},
    };

    await installObservers(page, metric);
    const loginResult = await time(metric, "login", () => ensureBrowserUser(page, i + 1));
    if (loginResult?.token) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate((token) => localStorage.setItem("tedris_backend_token", token), loginResult.token);
    }

    await runVeliFlow(page, metric, i + 1);
    await runOkulTakipFlow(page, metric);

    const stats = await collectBrowserStats(page);
    metric.timings.domContentLoaded = stats.perf.domContentLoaded;
    metric.timings.pageLoad = stats.perf.load;
    metric.timings.firstPaint = stats.perf.firstPaint;
    metric.timings.firstContentfulPaint = stats.perf.firstContentfulPaint;
    metric.browser = {
      jsHeapUsed: stats.perf.jsHeapUsed,
      jsHeapTotal: stats.perf.jsHeapTotal,
      ...stats.cdp,
    };
    for (const err of stats.perf.loadTestErrors ?? []) {
      metric.pageErrors.push(JSON.stringify(err));
    }
    metric.success = metric.errors.length === 0 && metric.pageErrors.length === 0 && metric.networkErrors.length === 0;
    persistMetric(metric);
    expect(metric.errors, "Browser flow action errors").toEqual([]);
  });
}
