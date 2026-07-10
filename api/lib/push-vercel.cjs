/**
 * Vercel serverless — Web Push API (VPS push route yokken same-origin fallback).
 * Gerekli env: DATABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
const { Pool } = require("pg");
const webpush = require("web-push");

const REMINDER_TZ = process.env.PUSH_REMINDER_TIMEZONE || "Europe/Istanbul";
const DAILY_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Bugünkü yoklama ve ödev takibini doldurmayı unutmayınız.",
  url: "/davet/okul-takip",
};
const ATTENDANCE_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Bugünkü yoklama bilgilerini kontrol etmeyi unutmayınız.",
  url: "/davet/okul-takip",
};
const HOMEWORK_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Bugünkü ödev takiplerini tamamlamayı unutmayınız.",
  url: "/davet/okul-takip",
};
const TEST_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Test bildirimi — bildirimler bu cihazda çalışıyor.",
  url: "/davet/okul-takip",
};

const REMINDER_JOBS = [
  { type: "dailyReminder", field: "daily_reminder_enabled", payload: DAILY_PAYLOAD },
  { type: "attendanceReminder", field: "attendance_reminder_enabled", payload: ATTENDANCE_PAYLOAD },
  { type: "homeworkReminder", field: "homework_reminder_enabled", payload: HOMEWORK_PAYLOAD },
];

let pool;
let vapidReady = false;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing");
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

function configureVapid() {
  if (vapidReady) return true;
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:admin@nehariplatform.com.tr").trim();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

function normalizeTime(raw) {
  const value = String(raw ?? "17:00").trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "17:00";
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseBody(req) {
  if (req.body == null || req.body === "") return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

function bearerToken(req) {
  const raw = req.headers.authorization || req.headers.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !String(value).startsWith("Bearer ")) return null;
  return String(value).slice(7).trim() || null;
}

function cookieSessionId(req) {
  const raw = req.headers.cookie;
  if (!raw || typeof raw !== "string") return null;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("sid=")) continue;
    const value = trimmed.slice(4);
    try {
      return decodeURIComponent(value).trim() || null;
    } catch {
      return value.trim() || null;
    }
  }
  return null;
}

function sessionTokenFromRequest(req) {
  return bearerToken(req) || cookieSessionId(req);
}

function pushUserAgent(req) {
  const raw = req.headers["user-agent"];
  return typeof raw === "string" ? raw.slice(0, 512) : null;
}

function anonymousDeviceId(req) {
  const raw =
    req.headers["x-push-device-id"] ||
    req.headers["X-Push-Device-Id"] ||
    parseBody(req).deviceId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120);
  return cleaned ? `anon:${cleaned}` : null;
}

function isPgMissingColumnError(err) {
  if (!err || typeof err !== "object") return false;
  return err.code === "42703";
}

function json(res, status, body) {
  res.status(status).json(body);
}

async function ensurePushSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id varchar PRIMARY KEY,
      user_id varchar NOT NULL,
      endpoint text NOT NULL UNIQUE,
      p256dh text,
      auth text,
      subscription jsonb NOT NULL,
      user_agent text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS p256dh text`);
  await client.query(`ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS auth text`);
  await client.query(`ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_agent text`);
  await client.query(`ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS vapid_public_key text`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_notification_settings (
      user_id varchar PRIMARY KEY,
      daily_reminder_enabled boolean NOT NULL DEFAULT true,
      daily_reminder_time varchar NOT NULL DEFAULT '17:00',
      attendance_reminder_enabled boolean NOT NULL DEFAULT true,
      homework_reminder_enabled boolean NOT NULL DEFAULT true,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    ALTER TABLE push_notification_settings
      ADD COLUMN IF NOT EXISTS attendance_reminder_enabled boolean DEFAULT true
  `);
  await client.query(`
    ALTER TABLE push_notification_settings
      ADD COLUMN IF NOT EXISTS homework_reminder_enabled boolean DEFAULT true
  `);
  await client.query(`
    UPDATE push_notification_settings
    SET attendance_reminder_enabled = true
    WHERE attendance_reminder_enabled IS NULL
  `);
  await client.query(`
    UPDATE push_notification_settings
    SET homework_reminder_enabled = true
    WHERE homework_reminder_enabled IS NULL
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_notification_log (
      id varchar PRIMARY KEY,
      user_id varchar NOT NULL,
      notification_type varchar NOT NULL,
      date_key varchar NOT NULL,
      sent_at timestamptz NOT NULL DEFAULT now(),
      payload jsonb,
      UNIQUE (user_id, notification_type, date_key)
    )
  `);
  await client.query(`
    ALTER TABLE push_notification_log ADD COLUMN IF NOT EXISTS payload jsonb
  `);
}

async function resolveUserIdViaVps(req) {
  const token = bearerToken(req);
  if (!token) return null;

  const base = String(
    process.env.VPS_API_BASE_URL || process.env.VITE_API_BASE_URL || "https://api.antalyanehari.xyz/api",
  )
    .trim()
    .replace(/\/+$/, "");
  if (!base) return null;

  try {
    const res = await fetch(`${base}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const userId = data?.user?.id;
    return typeof userId === "string" && userId ? userId : null;
  } catch {
    return null;
  }
}

async function resolveUserIdFromDb(req) {
  const sid = sessionTokenFromRequest(req);
  if (!sid) return null;

  const db = getPool();
  const client = await db.connect();
  try {
    const result = await client.query(
      `SELECT sess FROM sessions WHERE sid = $1 AND expire > now() LIMIT 1`,
      [sid],
    );
    const sess = result.rows[0]?.sess;
    if (!sess) return null;

    const data = typeof sess === "string" ? JSON.parse(sess) : sess;
    const userId = data?.localUser?.id;
    if (!userId || typeof userId !== "string") return null;

    const userCheck = await client.query(
      `SELECT id FROM local_users WHERE id = $1 AND (deleted_at IS NULL) LIMIT 1`,
      [userId],
    );
    if (userCheck.rows.length === 0) return null;

    return userId;
  } finally {
    client.release();
  }
}

async function resolveUserId(req) {
  try {
    const fromDb = await resolveUserIdFromDb(req);
    if (fromDb) return fromDb;
  } catch {
    /* DATABASE_URL yok veya oturum tablosu erişilemedi — VPS fallback */
  }
  return resolveUserIdViaVps(req);
}

async function withDb(fn) {
  const db = getPool();
  const client = await db.connect();
  try {
    await ensurePushSchema(client);
    return await fn(client);
  } finally {
    client.release();
  }
}

function rowToSettings(row) {
  return {
    dailyReminderEnabled: Boolean(row.daily_reminder_enabled),
    dailyReminderTime: normalizeTime(row.daily_reminder_time),
    attendanceReminderEnabled: Boolean(row.attendance_reminder_enabled ?? true),
    homeworkReminderEnabled: Boolean(row.homework_reminder_enabled ?? true),
  };
}

function parseSettingsBody(body) {
  const nested = body.settings && typeof body.settings === "object" ? body.settings : body;
  return {
    dailyReminderEnabled:
      typeof nested.dailyReminderEnabled === "boolean" ? nested.dailyReminderEnabled : undefined,
    dailyReminderTime:
      nested.dailyReminderTime != null ? normalizeTime(nested.dailyReminderTime) : undefined,
    attendanceReminderEnabled:
      typeof nested.attendanceReminderEnabled === "boolean" ? nested.attendanceReminderEnabled : undefined,
    homeworkReminderEnabled:
      typeof nested.homeworkReminderEnabled === "boolean" ? nested.homeworkReminderEnabled : undefined,
  };
}

function isValidSubscription(sub) {
  return Boolean(
    sub &&
      typeof sub.endpoint === "string" &&
      sub.endpoint.length > 8 &&
      sub.keys &&
      typeof sub.keys.p256dh === "string" &&
      typeof sub.keys.auth === "string",
  );
}

function dateKeyInTz() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REMINDER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function hhmmInTz() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: REMINDER_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const min = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${min}`;
}

function isGoneError(err) {
  return err && (err.statusCode === 404 || err.statusCode === 410);
}

function isVapidMismatchError(err) {
  if (!err || typeof err !== "object") return false;
  if (err.statusCode === 403) return true;
  const body = String(err.body || "").toLowerCase();
  return body.includes("vapid credentials") || body.includes("vapid key");
}

function classifyPushError(err) {
  if (isVapidMismatchError(err)) {
    return {
      kind: "vapid_mismatch",
      message: "Bildirim aboneliği eski anahtarla oluşturulmuş. Lütfen aboneliği yeniden oluşturun.",
    };
  }
  if (isGoneError(err)) {
    return {
      kind: "expired",
      message: "Bildirim aboneliği geçersiz. Lütfen yeniden oluşturun.",
    };
  }
  return {
    kind: "other",
    message: err instanceof Error ? err.message : "Gönderim hatası",
  };
}

async function deactivateStaleVapidSubscriptions(client, userId, currentVapid) {
  if (!currentVapid) return;
  await client.query(
    `UPDATE push_subscriptions SET is_active = false, updated_at = now()
     WHERE user_id = $1 AND is_active = true
       AND (vapid_public_key IS NULL OR vapid_public_key <> $2)`,
    [userId, currentVapid],
  );
}

async function sendPush(subscription, payload) {
  if (!configureVapid()) throw new Error("VAPID keys missing");
  await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 86400 });
}

async function upsertSettingsForUser(client, userId, patch) {
  const cur = await loadSettingsRow(client, userId);
  const current = cur.rows[0]
    ? rowToSettings(cur.rows[0])
    : {
        dailyReminderEnabled: true,
        dailyReminderTime: "17:00",
        attendanceReminderEnabled: true,
        homeworkReminderEnabled: true,
      };
  const next = {
    dailyReminderEnabled: patch.dailyReminderEnabled ?? current.dailyReminderEnabled,
    dailyReminderTime: patch.dailyReminderTime ?? current.dailyReminderTime,
    attendanceReminderEnabled: patch.attendanceReminderEnabled ?? current.attendanceReminderEnabled,
    homeworkReminderEnabled: patch.homeworkReminderEnabled ?? current.homeworkReminderEnabled,
  };
  await client.query(
    `INSERT INTO push_notification_settings (
       user_id, daily_reminder_enabled, daily_reminder_time,
       attendance_reminder_enabled, homework_reminder_enabled, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE SET
       daily_reminder_enabled = EXCLUDED.daily_reminder_enabled,
       daily_reminder_time = EXCLUDED.daily_reminder_time,
       attendance_reminder_enabled = EXCLUDED.attendance_reminder_enabled,
       homework_reminder_enabled = EXCLUDED.homework_reminder_enabled,
       updated_at = now()`,
    [
      userId,
      next.dailyReminderEnabled,
      next.dailyReminderTime,
      next.attendanceReminderEnabled,
      next.homeworkReminderEnabled,
    ],
  );
  return next;
}

async function handleVapidPublicKey(_req, res) {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  if (!publicKey) {
    json(res, 200, { ok: false, error: "VAPID_PUBLIC_KEY missing" });
    return;
  }
  json(res, 200, { ok: true, publicKey });
}

async function loadSettingsRow(client, userId) {
  try {
    return await client.query(
      `SELECT daily_reminder_enabled, daily_reminder_time, attendance_reminder_enabled, homework_reminder_enabled
       FROM push_notification_settings WHERE user_id = $1`,
      [userId],
    );
  } catch (err) {
    if (!isPgMissingColumnError(err)) throw err;
    await ensurePushSchema(client);
    return client.query(
      `SELECT daily_reminder_enabled, daily_reminder_time, attendance_reminder_enabled, homework_reminder_enabled
       FROM push_notification_settings WHERE user_id = $1`,
      [userId],
    );
  }
}

async function handleGetSettings(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { ok: false, error: "Oturum gerekli. Lütfen çıkış yapıp tekrar giriş yapın." });
    return;
  }
  const settings = await withDb(async (client) => {
    const r = await loadSettingsRow(client, userId);
    if (!r.rows[0]) {
      return {
        dailyReminderEnabled: true,
        dailyReminderTime: "17:00",
        attendanceReminderEnabled: true,
        homeworkReminderEnabled: true,
      };
    }
    return rowToSettings(r.rows[0]);
  });
  const subs = await withDb(async (client) => {
    const r = await client.query(
      `SELECT 1 FROM push_subscriptions WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return r.rows.length > 0;
  });
  json(res, 200, {
    ok: true,
    settings,
    hasActiveSubscription: subs,
    vapidPublicKey: (process.env.VAPID_PUBLIC_KEY || "").trim() || null,
  });
}

async function handleSubscribe(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { ok: false, error: "Oturum gerekli. Lütfen çıkış yapıp tekrar giriş yapın." });
    return;
  }
  if (!configureVapid()) {
    json(res, 503, { ok: false, error: "Push bildirim altyapısı yapılandırılmamış." });
    return;
  }
  const body = parseBody(req);
  const subscription = body.subscription || body;
  if (!isValidSubscription(subscription)) {
    json(res, 400, { ok: false, error: "Geçersiz push subscription." });
    return;
  }
  const patch = parseSettingsBody(body);
  const ua = pushUserAgent(req);
  const currentVapid = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const replaceAll = body.replaceAll === true;
  const settings = await withDb(async (client) => {
    if (replaceAll) {
      await client.query(`UPDATE push_subscriptions SET is_active = false, updated_at = now() WHERE user_id = $1`, [
        userId,
      ]);
    } else {
      await deactivateStaleVapidSubscriptions(client, userId, currentVapid);
    }
    const subId = require("crypto").randomUUID();
    await client.query(
      `INSERT INTO push_subscriptions (
         id, user_id, endpoint, p256dh, auth, subscription, user_agent, vapid_public_key, is_active, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, true, now())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         subscription = EXCLUDED.subscription,
         user_agent = COALESCE(EXCLUDED.user_agent, push_subscriptions.user_agent),
         vapid_public_key = EXCLUDED.vapid_public_key,
         is_active = true,
         updated_at = now()`,
      [
        subId,
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        JSON.stringify(subscription),
        ua,
        currentVapid || null,
      ],
    );
    return upsertSettingsForUser(client, userId, patch);
  });
  json(res, 200, { ok: true, settings });
}

async function handleUnsubscribe(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { ok: false, error: "Oturum gerekli." });
    return;
  }
  const body = parseBody(req);
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;
  await withDb(async (client) => {
    if (endpoint) {
      await client.query(
        `UPDATE push_subscriptions SET is_active = false, updated_at = now() WHERE user_id = $1 AND endpoint = $2`,
        [userId, endpoint],
      );
    } else {
      await client.query(
        `UPDATE push_subscriptions SET is_active = false, updated_at = now() WHERE user_id = $1`,
        [userId],
      );
    }
  });
  json(res, 200, { ok: true });
}

async function handlePostSettings(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { ok: false, error: "Oturum gerekli." });
    return;
  }
  const patch = parseSettingsBody(parseBody(req));
  const settings = await withDb(async (client) => upsertSettingsForUser(client, userId, patch));
  json(res, 200, { ok: true, settings });
}

async function handleTest(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { ok: false, error: "Oturum gerekli." });
    return;
  }
  if (!configureVapid()) {
    json(res, 503, { ok: false, error: "Push bildirim altyapısı yapılandırılmamış." });
    return;
  }
  const currentVapid = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const subs = await withDb(async (client) => {
    await deactivateStaleVapidSubscriptions(client, userId, currentVapid);
    const r = await client.query(
      `SELECT subscription, endpoint FROM push_subscriptions
       WHERE user_id = $1 AND is_active = true
         AND ($2::text IS NULL OR vapid_public_key = $2)`,
      [userId, currentVapid || null],
    );
    return r.rows;
  });
  if (subs.length === 0) {
    json(res, 400, { ok: false, error: "Önce bildirimleri açmanız gerekiyor." });
    return;
  }
  let sent = 0;
  const failures = [];
  for (const row of subs) {
    const subscription = row.subscription;
    try {
      await sendPush(subscription, TEST_PAYLOAD);
      sent += 1;
    } catch (err) {
      const classified = classifyPushError(err);
      if (classified.kind === "vapid_mismatch" || classified.kind === "expired") {
        await withDb(async (client) => {
          await client.query(`UPDATE push_subscriptions SET is_active = false, updated_at = now() WHERE endpoint = $1`, [
            subscription?.endpoint || row.endpoint,
          ]);
        });
      }
      failures.push(classified);
    }
  }
  if (sent === 0) {
    const primary = failures[0];
    if (primary?.kind === "vapid_mismatch") {
      json(res, 409, { ok: false, error: primary.message, code: "VAPID_MISMATCH" });
      return;
    }
    if (primary?.kind === "expired") {
      json(res, 400, { ok: false, error: primary.message, code: "SUBSCRIPTION_EXPIRED" });
      return;
    }
    json(res, 400, { ok: false, error: primary?.message || "Test bildirimi gönderilemedi." });
    return;
  }
  const dateKey = dateKeyInTz();
  await withDb(async (client) => {
    await client.query(
      `INSERT INTO push_notification_log (user_id, notification_type, date_key, payload, sent_at)
       VALUES ($1, 'test', $2, $3::jsonb, now()) ON CONFLICT DO NOTHING`,
      [userId, dateKey, JSON.stringify(TEST_PAYLOAD)],
    );
  });
  json(res, 200, { ok: true, sent });
}

async function handleDailyCron(req, res) {
  if (!configureVapid()) {
    json(res, 503, { ok: false, error: "VAPID keys missing" });
    return;
  }
  const timeHHMM = hhmmInTz();
  const dateKey = dateKeyInTz();
  const currentVapid = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const candidates = await withDb(async (client) => {
    const r = await client.query(
      `SELECT s.user_id, s.subscription, s.endpoint,
              p.daily_reminder_enabled, p.attendance_reminder_enabled, p.homework_reminder_enabled
       FROM push_notification_settings p
       INNER JOIN push_subscriptions s ON s.user_id = p.user_id AND s.is_active = true
       WHERE p.daily_reminder_time = $1
         AND ($2::text IS NULL OR s.vapid_public_key = $2)
         AND (
           p.daily_reminder_enabled = true
           OR p.attendance_reminder_enabled = true
           OR p.homework_reminder_enabled = true
         )`,
      [timeHHMM, currentVapid || null],
    );
    return r.rows;
  });
  let sent = 0;
  for (const row of candidates) {
    const userId = row.user_id;
    for (const job of REMINDER_JOBS) {
      if (!row[job.field]) continue;
      const already = await withDb(async (client) => {
        const r = await client.query(
          `SELECT 1 FROM push_notification_log WHERE user_id = $1 AND notification_type = $2 AND date_key = $3`,
          [userId, job.type, dateKey],
        );
        return r.rows.length > 0;
      });
      if (already) continue;
      try {
        await sendPush(row.subscription, job.payload);
        await withDb(async (client) => {
          await client.query(
            `INSERT INTO push_notification_log (user_id, notification_type, date_key, payload, sent_at)
             VALUES ($1, $2, $3, $4::jsonb, now()) ON CONFLICT DO NOTHING`,
            [userId, job.type, dateKey, JSON.stringify(job.payload)],
          );
        });
        sent += 1;
      } catch (err) {
        const classified = classifyPushError(err);
        if (classified.kind === "vapid_mismatch" || classified.kind === "expired") {
          await withDb(async (client) => {
            await client.query(`UPDATE push_subscriptions SET is_active = false, updated_at = now() WHERE endpoint = $1`, [
              row.subscription?.endpoint || row.endpoint,
            ]);
          });
        }
      }
    }
  }
  json(res, 200, { ok: true, timeHHMM, candidates: candidates.length, sent });
}

function wrap(handler) {
  return async function vercelHandler(req, res) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Push-Device-Id");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    const origin = req.headers.origin;
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    try {
      await handler(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const pgCode = err && typeof err === "object" ? err.code : undefined;
      if (message.includes("DATABASE_URL")) {
        json(res, 503, { ok: false, error: "Bildirim ayarları şu anda alınamadı. Lütfen tekrar deneyin." });
        return;
      }
      if (pgCode === "23503") {
        json(res, 401, { ok: false, error: "Oturum geçersiz. Lütfen çıkış yapıp tekrar giriş yapın." });
        return;
      }
      console.error("[push-vercel]", err);
      json(res, 500, { ok: false, error: "Bildirim ayarları şu anda alınamadı. Lütfen tekrar deneyin." });
    }
  };
}

module.exports = {
  vapidPublicKey: wrap(handleVapidPublicKey),
  getSettings: wrap(handleGetSettings),
  subscribe: wrap(handleSubscribe),
  unsubscribe: wrap(handleUnsubscribe),
  postSettings: wrap(handlePostSettings),
  test: wrap(handleTest),
  dailyCron: wrap(handleDailyCron),
};
