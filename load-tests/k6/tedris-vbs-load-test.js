import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import exec from "k6/execution";

const API_BASE = (__ENV.API_BASE || "http://localhost:3001/api").replace(/\/$/, "");
const FRONTEND_BASE = (__ENV.FRONTEND_BASE || "http://localhost:3000").replace(/\/$/, "");
const RUN_ID = __ENV.LOAD_TEST_RUN_ID || `${Date.now()}`;
const EMAIL_PREFIX = __ENV.LOAD_TEST_EMAIL_PREFIX || "loadtest";
const EMAIL_DOMAIN = __ENV.LOAD_TEST_EMAIL_DOMAIN || "example.test";
const PASSWORD = __ENV.LOAD_TEST_PASSWORD || "LoadTest123!";
const PROFILE = String(__ENV.LOAD_TEST_PROFILE || "100");
const PROFILE_USERS = { "50": 50, "100": 100, "250": 250, "500": 500 };
const USERS = Number(__ENV.LOAD_TEST_USERS || PROFILE_USERS[PROFILE] || 100);
const HALF_USERS = Number(__ENV.LOAD_TEST_HALF_USERS || Math.max(1, Math.round(USERS / 2)));
const UPLOAD_USERS = Number(__ENV.LOAD_TEST_UPLOAD_USERS || Math.max(1, Math.round(USERS / 5)));
const DURATION = __ENV.LOAD_TEST_SCENARIO_MAX_DURATION || "5m";
const THINK_TIME = Number(__ENV.LOAD_TEST_THINK_TIME_SECONDS || 0.25);

const ADMIN_EMAIL = __ENV.LOAD_TEST_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = __ENV.LOAD_TEST_ADMIN_PASSWORD || "";
const DISTRICT = __ENV.LOAD_TEST_DISTRICT || "Alanya";
const INSTITUTION_NAME = __ENV.LOAD_TEST_INSTITUTION_NAME || "Tedris Load Test Yurdu";
const INSTITUTION_CODE = __ENV.LOAD_TEST_INSTITUTION_CODE || `LT-${RUN_ID}`;

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409));

const status401 = new Counter("status_401");
const status403 = new Counter("status_403");
const status404 = new Counter("status_404");
const status500 = new Counter("status_500");
const timeoutCount = new Counter("timeout_count");
const requestFailure = new Rate("request_failure_rate");
const epAuthLogin = new Trend("ep_auth_login", true);
const epAuthRegister = new Trend("ep_auth_register", true);
const epAuthMe = new Trend("ep_auth_me", true);
const epHome = new Trend("ep_home", true);
const epPosterDraftCreate = new Trend("ep_poster_draft_create", true);
const epPosterDraftList = new Trend("ep_poster_draft_list", true);
const epPreviewOpen = new Trend("ep_preview_open", true);
const epPngActivity = new Trend("ep_png_activity", true);
const epWhatsappActivity = new Trend("ep_whatsapp_activity", true);
const epAdminDashboard = new Trend("ep_admin_dashboard", true);
const epReportSummary = new Trend("ep_report_summary", true);
const epStudentCreate = new Trend("ep_student_create", true);
const epStudentList = new Trend("ep_student_list", true);
const epDailyRecordUpsert = new Trend("ep_daily_record_upsert", true);
const epDailyRecordList = new Trend("ep_daily_record_list", true);
const epHomeworkTracking = new Trend("ep_homework_tracking", true);
const epFileUpload = new Trend("ep_file_upload", true);
const epReportRecords = new Trend("ep_report_records", true);
const epProfiles = new Trend("ep_profiles", true);
const epInstitutions = new Trend("ep_institutions", true);
const epShowcase = new Trend("ep_showcase", true);
const epPush = new Trend("ep_push", true);
const epSupport = new Trend("ep_support", true);
const epHealth = new Trend("ep_health", true);

const endpointTrends = {
  auth_register: epAuthRegister,
  auth_login: epAuthLogin,
  auth_me: epAuthMe,
  home: epHome,
  poster_draft_create: epPosterDraftCreate,
  poster_draft_list: epPosterDraftList,
  preview_open: epPreviewOpen,
  png_activity: epPngActivity,
  whatsapp_activity: epWhatsappActivity,
  admin_dashboard: epAdminDashboard,
  report_summary: epReportSummary,
  student_create: epStudentCreate,
  student_list: epStudentList,
  daily_record_upsert: epDailyRecordUpsert,
  daily_record_list: epDailyRecordList,
  homework_tracking: epHomeworkTracking,
  file_upload: epFileUpload,
  report_records: epReportRecords,
  profiles: epProfiles,
  institutions: epInstitutions,
  showcase: epShowcase,
  push: epPush,
  support: epSupport,
  health: epHealth,
};

export const options = {
  setupTimeout: "10m",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
    request_failure_rate: ["rate<0.05"],
  },
  scenarios: Object.fromEntries(
    [
      ["login", USERS, "loginScenario"],
      ["token_verify", USERS, "tokenVerifyScenario"],
      ["profile", USERS, "profileScenario"],
      ["institutions", USERS, "institutionsScenario"],
      ["home", USERS, "homeScenario"],
      ["veli_create", USERS, "veliDraftScenario"],
      ["preview", USERS, "previewScenario"],
      ["png", USERS, "pngScenario"],
      ["activity", USERS, "activityScenario"],
      ["reports", HALF_USERS, "reportsScenario"],
      ["attendance", USERS, "attendanceScenario"],
      ["boarding_homework", USERS, "homeworkScenario"],
      ["student_add", HALF_USERS, "studentAddScenario"],
      ["report_records", HALF_USERS, "reportRecordsScenario"],
      ["upload", UPLOAD_USERS, "uploadScenario"],
      ["other_api", HALF_USERS, "otherApiScenario"],
      ["whatsapp", HALF_USERS, "whatsappScenario"],
    ].map(([name, vus, execName]) => [
      `${name}_${vus}`,
      { executor: "per-vu-iterations", vus, iterations: 1, maxDuration: DURATION, exec: execName },
    ]),
  ),
};

function emailForVu() {
  return `${EMAIL_PREFIX}+${RUN_ID}-${exec.vu.idInTest}@${EMAIL_DOMAIN}`.toLowerCase();
}

function jsonHeaders(extra = {}) {
  return {
    headers: {
      "Content-Type": "application/json",
      ...extra,
    },
    timeout: "30s",
  };
}

function recordStatus(res) {
  if (res.status === 401) status401.add(1);
  if (res.status === 403) status403.add(1);
  if (res.status === 404) status404.add(1);
  if (res.status >= 500) status500.add(1);
  if (String(res.error || "").toLowerCase().includes("timeout")) timeoutCount.add(1);
}

function apiRequest(method, path, body, endpoint, expectedStatuses = [200, 201]) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const params = body instanceof ArrayBuffer || typeof body !== "object" || body === null
    ? { timeout: "30s" }
    : jsonHeaders();
  const payload = body === undefined ? undefined : typeof body === "string" || body instanceof ArrayBuffer ? body : JSON.stringify(body);
  const res = method === "GET"
    ? http.get(url, params)
    : method === "POST"
      ? http.post(url, payload, params)
      : method === "PUT"
        ? http.put(url, payload, params)
        : method === "PATCH"
          ? http.patch(url, payload, params)
          : http.del(url, payload, params);

  endpointTrends[endpoint]?.add(res.timings.duration);
  recordStatus(res);

  const ok = expectedStatuses.includes(res.status);
  requestFailure.add(!ok);
  check(res, {
    [`${endpoint} status ${expectedStatuses.join("/")}`]: () => ok,
  });
  return res;
}

function safeJson(res) {
  try {
    return res.json();
  } catch {
    return {};
  }
}

function ensureSession() {
  const email = emailForVu();
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminLogin = apiRequest("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, "auth_login", [200, 401, 403]);
    if (adminLogin.status === 200) {
      apiRequest(
        "POST",
        "/admin/users",
        {
          email,
          password: PASSWORD,
          name: `Load Test Kullanıcı ${exec.vu.idInTest}`,
          province: "Antalya",
          district: DISTRICT,
          institutionName: INSTITUTION_NAME,
          institutionCode: INSTITUTION_CODE,
          role: "hoca",
          isActive: true,
        },
        "auth_register",
        [200, 201, 409],
      );
    }
  } else {
    const register = apiRequest(
      "POST",
      "/auth/register",
      { email, password: PASSWORD, name: `Load Test Kullanıcı ${exec.vu.idInTest}` },
      "auth_register",
      [200, 409],
    );
    if (register.status !== 200 && register.status !== 409) {
      return { email, user: null };
    }
  }
  const login = apiRequest("POST", "/auth/login", { email, password: PASSWORD }, "auth_login");
  return { email, user: safeJson(login).user || null };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function posterDraftPayload() {
  const suffix = `${RUN_ID}-${exec.vu.idInTest}`;
  return {
    source: "veli_bilgilendirme",
    app: "nehari_veli_bilgilendirme",
    seciliSablon: "kurumsal",
    metinDuzenlendi: true,
    savedAt: new Date().toISOString(),
    form: {
      kurumAdi: INSTITUTION_NAME,
      isim: `Load Test Hoca ${exec.vu.idInTest}`,
      rol: "Hoca",
      baslik: `Yuk Testi Basligi ${suffix}`,
      altBaslik: "Tedris VBS es zamanli kullanim testi",
      posterMetni: "Bu kayıt otomatik yük testi sırasında oluşturuldu.",
      faaliyetSayisi: "3",
      ekNot: "Load test verisidir.",
      metinUzunlugu: "orta",
      gorseller: [],
      faaliyetler: [
        { baslik: "Yoklama", aciklama: "Yoklama kaydi olusturuldu." },
        { baslik: "Odev", aciklama: "Yurt odev takibi kontrol edildi." },
      ],
    },
  };
}

function createStudent(label = "student_create") {
  const suffix = `${RUN_ID}-${exec.vu.idInTest}-${exec.scenario.iterationInTest}`;
  const res = apiRequest(
    "POST",
    "/okul-takip/students",
    {
      name: `Load Test Ogrenci ${suffix}`,
      grade: "7",
      institutionName: INSTITUTION_NAME,
      institution: INSTITUTION_NAME,
      group: "A",
      parentPhone: "5550000000",
      isActive: true,
    },
    label,
    [201],
  );
  return safeJson(res).student || null;
}

function upsertDailyRecord(student, attendanceStatus, homeworkStatus, label) {
  if (!student?.id) return;
  apiRequest(
    "PUT",
    "/okul-takip/daily-records",
    {
      records: [
        {
          studentId: student.id,
          date: todayIso(),
          institution: student.institutionName || student.institution || INSTITUTION_NAME,
          group: student.group || "A",
          attendanceStatus,
          homeworkStatus,
          note: `Load test ${RUN_ID}`,
        },
      ],
    },
    label,
  );
}

export function setup() {
  apiRequest("GET", "/health", undefined, "home");

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminLogin = apiRequest("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, "auth_login", [200, 401, 403]);
    if (adminLogin.status === 200) {
      apiRequest(
        "POST",
        "/admin/institutions-registry",
        {
          institutionName: INSTITUTION_NAME,
          institutionCode: INSTITUTION_CODE,
          districtName: DISTRICT,
          province: "Antalya",
          status: "aktif",
          notes: `Load test ${RUN_ID}`,
        },
        "student_create",
        [200, 201, 400, 409],
      );
    }
  }

  return { runId: RUN_ID };
}

export function loginScenario() {
  group("100 kullanıcı giriş", () => {
    ensureSession();
    sleep(THINK_TIME);
  });
}

export function tokenVerifyScenario() {
  group("100 kullanıcı token doğrulama", () => {
    ensureSession();
    apiRequest("GET", "/auth/me", undefined, "auth_me");
    sleep(THINK_TIME);
  });
}

export function profileScenario() {
  group("profil ve kayıtlı hoca profilleri", () => {
    ensureSession();
    apiRequest("GET", "/profiles", undefined, "profiles", [200, 401]);
    apiRequest(
      "POST",
      "/profiles",
      { isim: `Load Test Profil ${exec.vu.idInTest}`, kurumAdi: INSTITUTION_NAME, rol: "Hoca" },
      "profiles",
      [200, 400, 401],
    );
    sleep(THINK_TIME);
  });
}

export function institutionsScenario() {
  group("kurumlar ve okul takip kurumları", () => {
    ensureSession();
    apiRequest("GET", "/records?record_type=institution&limit=20", undefined, "institutions", [200, 403]);
    apiRequest("GET", "/okul-takip/my-institutions", undefined, "institutions", [200, 401, 403]);
    sleep(THINK_TIME);
  });
}

export function homeScenario() {
  group("100 kullanıcı ana sayfa", () => {
    const res = http.get(FRONTEND_BASE, { timeout: "30s" });
    epHome.add(res.timings.duration);
    recordStatus(res);
    requestFailure.add(!(res.status >= 200 && res.status < 400));
    check(res, { "home page loaded": () => res.status >= 200 && res.status < 400 });
    sleep(THINK_TIME);
  });
}

export function veliDraftScenario() {
  group("100 kullanıcı veli bilgilendirme oluşturma", () => {
    ensureSession();
    apiRequest("POST", "/records", { record_type: "poster_draft", data: posterDraftPayload() }, "poster_draft_create");
    sleep(THINK_TIME);
  });
}

export function previewScenario() {
  group("100 kullanıcı önizleme açma", () => {
    ensureSession();
    apiRequest("GET", "/records?record_type=poster_draft&limit=20", undefined, "poster_draft_list");
    apiRequest("POST", "/usage/event", { event_type: "open_veli_module", metadata: { source: "load_test", runId: RUN_ID } }, "preview_open");
    sleep(THINK_TIME);
  });
}

export function pngScenario() {
  group("100 kullanıcı PNG oluşturma backend etkisi", () => {
    ensureSession();
    apiRequest("POST", "/activity/log", { action: "export_png" }, "png_activity");
    apiRequest("POST", "/usage/event", { event_type: "poster_downloaded", metadata: { format: "png", source: "load_test", runId: RUN_ID } }, "png_activity");
    sleep(THINK_TIME);
  });
}

export function whatsappScenario() {
  group("50 kullanıcı WhatsApp paylaşımı backend etkisi", () => {
    ensureSession();
    apiRequest("POST", "/activity/log", { action: "share_whatsapp" }, "whatsapp_activity");
    apiRequest("POST", "/usage/event", { event_type: "share_whatsapp", metadata: { source: "load_test", runId: RUN_ID } }, "whatsapp_activity");
    sleep(THINK_TIME);
  });
}

export function activityScenario() {
  group("aktivite kayıtları", () => {
    ensureSession();
    apiRequest("POST", "/activity/log", { action: "open_veli_module" }, "preview_open");
    apiRequest("POST", "/records", { record_type: "activity_log", data: { action: "load_test_activity", metadata: { runId: RUN_ID } } }, "preview_open");
    apiRequest("GET", "/records?record_type=activity_log&limit=20", undefined, "preview_open");
    sleep(THINK_TIME);
  });
}

export function reportsScenario() {
  group("50 kullanıcı rapor ekranı", () => {
    ensureSession();
    apiRequest("GET", "/admin/dashboard?range=7d", undefined, "admin_dashboard", [200, 403]);
    apiRequest("GET", `/okul-takip/reports/summary?date=${todayIso()}`, undefined, "report_summary", [200, 403]);
    sleep(THINK_TIME);
  });
}

export function attendanceScenario() {
  group("100 kullanıcı yoklama kaydı", () => {
    ensureSession();
    const student = createStudent("student_create");
    upsertDailyRecord(student, "present", "done", "daily_record_upsert");
    sleep(THINK_TIME);
  });
}

export function homeworkScenario() {
  group("100 kullanıcı yurt ödev takibi", () => {
    ensureSession();
    const student = createStudent("student_create");
    upsertDailyRecord(student, "present", "missing", "homework_tracking");
    apiRequest("GET", "/okul-takip/daily-records", undefined, "daily_record_list");
    sleep(THINK_TIME);
  });
}

export function studentAddScenario() {
  group("50 kullanıcı aynı anda öğrenci ekleme", () => {
    ensureSession();
    createStudent("student_create");
    apiRequest("GET", "/okul-takip/students", undefined, "student_list");
    sleep(THINK_TIME);
  });
}

export function reportRecordsScenario() {
  group("50 kullanıcı aynı anda rapor alma", () => {
    ensureSession();
    apiRequest("GET", "/admin/activity-logs?range=7d", undefined, "report_records", [200, 403]);
    apiRequest("GET", `/okul-takip/reports/missing?date=${todayIso()}`, undefined, "report_records", [200, 403]);
    sleep(THINK_TIME);
  });
}

export function uploadScenario() {
  group("20 kullanıcı fotoğraf yükleme", () => {
    ensureSession();
    const png = http.file(
      "load-test-png-placeholder",
      `load-test-${RUN_ID}-${exec.vu.idInTest}.png`,
      "image/png",
    );
    const res = http.post(`${API_BASE}/davet/upload`, { file: png }, { timeout: "30s" });
    epFileUpload.add(res.timings.duration);
    recordStatus(res);
    const ok = res.status === 200;
    requestFailure.add(!ok);
    check(res, { "file upload status 200": () => ok });
    sleep(THINK_TIME);
  });
}

export function otherApiScenario() {
  group("diğer API endpointleri", () => {
    ensureSession();
    apiRequest("GET", "/health", undefined, "health");
    apiRequest("GET", "/healthz", undefined, "health", [200, 404]);
    apiRequest("GET", "/push/vapid-public-key", undefined, "push", [200, 404, 500]);
    apiRequest("GET", "/push/settings", undefined, "push", [200, 401, 500]);
    apiRequest("GET", "/davet/showcase/published", undefined, "showcase", [200, 401]);
    apiRequest("POST", "/support", { message: `Load test destek ${RUN_ID}-${exec.vu.idInTest}` }, "support", [200, 400]);
    sleep(THINK_TIME);
  });
}

export function handleSummary(data) {
  const summaryPath = __ENV.K6_SUMMARY_PATH || "load-tests/results/k6-summary.json";
  return {
    stdout: `\nTedris VBS k6 load test completed. Summary: ${summaryPath}\n`,
    [summaryPath]: JSON.stringify(data, null, 2),
  };
}
