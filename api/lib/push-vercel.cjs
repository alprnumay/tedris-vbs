/**
 * Vercel serverless — Web Push API (VPS push route yokken same-origin fallback).
 * Gerekli env: DATABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
const { Pool } = require("pg");
const webpush = require("web-push");

const REMINDER_TZ = process.env.PUSH_REMINDER_TIMEZONE || "Europe/Istanbul";
const DAILY_PAYLOAD = {
  title: "Günlük takip hatırlatması",
  body: "Bugünkü işler tamamlandı mı? Yoklama, okul ödevi takibi ve veli bilgilendirme durumunu kontrol etmeyi unutmayın.",
  url: "/davet/okul-takip",
};
const TEST_PAYLOAD = {
  title: "Test bildirimi",
  body: "Tedris VBS bildirimleri bu cihazda çalışıyor.",
  url: "/davet/okul-takip",
};

let pool;
let vapidReady = false;
let schemaReady = false;

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

function json(res, status, body) {
  res.status(status).json(body);
}

async function ensurePushSchema(client) {
  if (schemaReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      endpoint text NOT NULL UNIQUE,
      subscription jsonb NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_notification_settings (
      user_id varchar PRIMARY KEY,
      daily_reminder_enabled boolean NOT NULL DEFAULT true,
      daily_reminder_time varchar NOT NULL DEFAULT '17:00',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_notification_log (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
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
  schemaReady = true;
}

async function resolveUserId(req) {
  const sid = bearerToken(req);
  const fallback = anonymousDeviceId(req);
  if (!sid) return fallback;
  const db = getPool();
  const client = await db.connect();
  try {
    const result = await client.query(
      `SELECT sess FROM sessions WHERE sid = $1 AND expire > now() LIMIT 1`,
      [sid],
    );
    const sess = result.rows[0]?.sess;
    if (!sess) return fallback;
    const data = typeof sess === "string" ? JSON.parse(sess) : sess;
    return data?.localUser?.id || fallback;
  } finally {
    client.release();
  }
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

function parseSettingsBody(body) {
  const nested = body.settings && typeof body.settings === "object" ? body.settings : body;
  return {
    dailyReminderEnabled:
      typeof nested.dailyReminderEnabled === "boolean" ? nested.dailyReminderEnabled : undefined,
    dailyReminderTime:
      nested.dailyReminderTime != null ? normalizeTime(nested.dailyReminderTime) : undefined,
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

async function sendPush(subscription, payload) {
  if (!configureVapid()) throw new Error("VAPID keys missing");
  await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 86400 });
}

async function handleVapidPublicKey(_req, res) {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  if (!publicKey) {
    json(res, 200, { ok: false, error: "VAPID_PUBLIC_KEY missing" });
    return;
  }
  json(res, 200, { ok: true, publicKey });
}

async function handleGetSettings(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 400, { ok: false, error: "Cihaz kimliği alınamadı. Sayfayı yenileyip tekrar deneyin." });
    return;
  }
  const settings = await withDb(async (client) => {
    const r = await client.query(
      `SELECT daily_reminder_enabled, daily_reminder_time FROM push_notification_settings WHERE user_id = $1`,
      [userId],
    );
    if (!r.rows[0]) {
      return { dailyReminderEnabled: true, dailyReminderTime: "17:00" };
    }
    return {
      dailyReminderEnabled: Boolean(r.rows[0].daily_reminder_enabled),
      dailyReminderTime: normalizeTime(r.rows[0].daily_reminder_time),
    };
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
    json(res, 400, { ok: false, error: "Cihaz kimliği alınamadı. Sayfayı yenileyip tekrar deneyin." });
    return;
  }
  if (!configureVapid()) {
    json(res, 503, { ok: false, error: "VAPID_PUBLIC_KEY missing" });
    return;
  }
  const body = parseBody(req);
  const subscription = body.subscription || body;
  if (!isValidSubscription(subscription)) {
    json(res, 400, { ok: false, error: "Geçersiz push subscription." });
    return;
  }
  const patch = parseSettingsBody(body);
  const settings = await withDb(async (client) => {
    await client.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription, is_active, updated_at)
       VALUES ($1, $2, $3::jsonb, true, now())
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, subscription = EXCLUDED.subscription, is_active = true, updated_at = now()`,
      [userId, subscription.endpoint, JSON.stringify(subscription)],
    );
    const cur = await client.query(
      `SELECT daily_reminder_enabled, daily_reminder_time FROM push_notification_settings WHERE user_id = $1`,
      [userId],
    );
    const current = cur.rows[0]
      ? {
          dailyReminderEnabled: Boolean(cur.rows[0].daily_reminder_enabled),
          dailyReminderTime: normalizeTime(cur.rows[0].daily_reminder_time),
        }
      : { dailyReminderEnabled: true, dailyReminderTime: "17:00" };
    const next = {
      dailyReminderEnabled: patch.dailyReminderEnabled ?? current.dailyReminderEnabled,
      dailyReminderTime: patch.dailyReminderTime ?? current.dailyReminderTime,
    };
    await client.query(
      `INSERT INTO push_notification_settings (user_id, daily_reminder_enabled, daily_reminder_time, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET daily_reminder_enabled = EXCLUDED.daily_reminder_enabled, daily_reminder_time = EXCLUDED.daily_reminder_time, updated_at = now()`,
      [userId, next.dailyReminderEnabled, next.dailyReminderTime],
    );
    return next;
  });
  json(res, 200, { ok: true, settings });
}

async function handleUnsubscribe(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 400, { ok: false, error: "Cihaz kimliği alınamadı. Sayfayı yenileyip tekrar deneyin." });
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
    json(res, 400, { ok: false, error: "Cihaz kimliği alınamadı. Sayfayı yenileyip tekrar deneyin." });
    return;
  }
  const patch = parseSettingsBody(parseBody(req));
  const settings = await withDb(async (client) => {
    const cur = await client.query(
      `SELECT daily_reminder_enabled, daily_reminder_time FROM push_notification_settings WHERE user_id = $1`,
      [userId],
    );
    const current = cur.rows[0]
      ? {
          dailyReminderEnabled: Boolean(cur.rows[0].daily_reminder_enabled),
          dailyReminderTime: normalizeTime(cur.rows[0].daily_reminder_time),
        }
      : { dailyReminderEnabled: true, dailyReminderTime: "17:00" };
    const next = {
      dailyReminderEnabled: patch.dailyReminderEnabled ?? current.dailyReminderEnabled,
      dailyReminderTime: patch.dailyReminderTime ?? current.dailyReminderTime,
    };
    await client.query(
      `INSERT INTO push_notification_settings (user_id, daily_reminder_enabled, daily_reminder_time, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET daily_reminder_enabled = EXCLUDED.daily_reminder_enabled, daily_reminder_time = EXCLUDED.daily_reminder_time, updated_at = now()`,
      [userId, next.dailyReminderEnabled, next.dailyReminderTime],
    );
    return next;
  });
  json(res, 200, { ok: true, settings });
}

async function handleTest(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 400, { ok: false, error: "Cihaz kimliği alınamadı. Sayfayı yenileyip tekrar deneyin." });
    return;
  }
  if (!configureVapid()) {
    json(res, 503, { ok: false, error: "VAPID_PUBLIC_KEY missing" });
    return;
  }
  const subs = await withDb(async (client) => {
    const r = await client.query(
      `SELECT subscription FROM push_subscriptions WHERE user_id = $1 AND is_active = true`,
      [userId],
    );
    return r.rows.map((row) => row.subscription);
  });
  if (subs.length === 0) {
    json(res, 400, { ok: false, error: "Aktif push aboneliği bulunamadı. Önce bildirimleri açın." });
    return;
  }
  let sent = 0;
  for (const subscription of subs) {
    try {
      await sendPush(subscription, TEST_PAYLOAD);
      sent += 1;
    } catch (err) {
      if (isGoneError(err) && subscription?.endpoint) {
        await withDb(async (client) => {
          await client.query(
            `UPDATE push_subscriptions SET is_active = false WHERE endpoint = $1`,
            [subscription.endpoint],
          );
        });
      }
    }
  }
  if (sent === 0) {
    json(res, 502, { ok: false, error: "Test bildirimi gönderilemedi." });
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
  const candidates = await withDb(async (client) => {
    const r = await client.query(
      `SELECT s.user_id, s.subscription
       FROM push_notification_settings p
       INNER JOIN push_subscriptions s ON s.user_id = p.user_id AND s.is_active = true
       WHERE p.daily_reminder_enabled = true AND p.daily_reminder_time = $1`,
      [timeHHMM],
    );
    return r.rows;
  });
  let sent = 0;
  for (const row of candidates) {
    const userId = row.user_id;
    const already = await withDb(async (client) => {
      const r = await client.query(
        `SELECT 1 FROM push_notification_log WHERE user_id = $1 AND notification_type = 'dailyReminder' AND date_key = $2`,
        [userId, dateKey],
      );
      return r.rows.length > 0;
    });
    if (already) continue;
    try {
      await sendPush(row.subscription, DAILY_PAYLOAD);
      await withDb(async (client) => {
        await client.query(
          `INSERT INTO push_notification_log (user_id, notification_type, date_key, payload, sent_at)
           VALUES ($1, 'dailyReminder', $2, $3::jsonb, now()) ON CONFLICT DO NOTHING`,
          [userId, dateKey, JSON.stringify(DAILY_PAYLOAD)],
        );
      });
      sent += 1;
    } catch (err) {
      if (isGoneError(err) && row.subscription?.endpoint) {
        await withDb(async (client) => {
          await client.query(`UPDATE push_subscriptions SET is_active = false WHERE endpoint = $1`, [
            row.subscription.endpoint,
          ]);
        });
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
      if (message.includes("DATABASE_URL")) {
        json(res, 503, { ok: false, error: "Push altyapısı yapılandırılmamış (DATABASE_URL eksik)." });
        return;
      }
      console.error("[push-vercel]", err);
      json(res, 500, { ok: false, error: "Sunucu hatası" });
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
