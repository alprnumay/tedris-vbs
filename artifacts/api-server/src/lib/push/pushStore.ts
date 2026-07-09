import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { sqlRows } from "../sqlRows";
import {
  DEFAULT_PUSH_SETTINGS,
  normalizeReminderTime,
  type PushSettings,
  type PushSubscriptionJson,
} from "./pushTypes";

type SettingsRow = {
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  attendance_reminder_enabled: boolean;
  homework_reminder_enabled: boolean;
};

function rowToSettings(row: SettingsRow): PushSettings {
  return {
    dailyReminderEnabled: Boolean(row.daily_reminder_enabled),
    dailyReminderTime: normalizeReminderTime(row.daily_reminder_time),
    attendanceReminderEnabled: Boolean(row.attendance_reminder_enabled),
    homeworkReminderEnabled: Boolean(row.homework_reminder_enabled),
  };
}

export async function getPushSettings(userId: string): Promise<PushSettings> {
  const result = await db.execute(sql`
    SELECT
      daily_reminder_enabled,
      daily_reminder_time,
      attendance_reminder_enabled,
      homework_reminder_enabled
    FROM push_notification_settings
    WHERE user_id = ${userId}
    LIMIT 1
  `);

  const row = sqlRows<SettingsRow>(result)[0] ?? null;
  if (!row) return { ...DEFAULT_PUSH_SETTINGS };

  return rowToSettings(row);
}

export async function upsertPushSettings(userId: string, settings: Partial<PushSettings>): Promise<PushSettings> {
  const current = await getPushSettings(userId);
  const next: PushSettings = {
    dailyReminderEnabled:
      settings.dailyReminderEnabled ?? current.dailyReminderEnabled,
    dailyReminderTime: normalizeReminderTime(
      settings.dailyReminderTime ?? current.dailyReminderTime,
    ),
    attendanceReminderEnabled:
      settings.attendanceReminderEnabled ?? current.attendanceReminderEnabled,
    homeworkReminderEnabled:
      settings.homeworkReminderEnabled ?? current.homeworkReminderEnabled,
  };

  await db.execute(sql`
    INSERT INTO push_notification_settings (
      user_id,
      daily_reminder_enabled,
      daily_reminder_time,
      attendance_reminder_enabled,
      homework_reminder_enabled,
      updated_at
    )
    VALUES (
      ${userId},
      ${next.dailyReminderEnabled},
      ${next.dailyReminderTime},
      ${next.attendanceReminderEnabled},
      ${next.homeworkReminderEnabled},
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      daily_reminder_enabled = EXCLUDED.daily_reminder_enabled,
      daily_reminder_time = EXCLUDED.daily_reminder_time,
      attendance_reminder_enabled = EXCLUDED.attendance_reminder_enabled,
      homework_reminder_enabled = EXCLUDED.homework_reminder_enabled,
      updated_at = now()
  `);

  return next;
}

export async function upsertPushSubscription(
  userId: string,
  subscription: PushSubscriptionJson,
  userAgent?: string | null,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO push_subscriptions (
      user_id,
      endpoint,
      p256dh,
      auth,
      subscription,
      user_agent,
      is_active,
      updated_at
    )
    VALUES (
      ${userId},
      ${subscription.endpoint},
      ${subscription.keys.p256dh},
      ${subscription.keys.auth},
      ${JSON.stringify(subscription)}::jsonb,
      ${userAgent ?? null},
      true,
      now()
    )
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      subscription = EXCLUDED.subscription,
      user_agent = COALESCE(EXCLUDED.user_agent, push_subscriptions.user_agent),
      is_active = true,
      updated_at = now()
  `);
}

export async function deactivatePushSubscriptions(userId: string, endpoint?: string): Promise<void> {
  if (endpoint) {
    await db.execute(sql`
      UPDATE push_subscriptions
      SET is_active = false, updated_at = now()
      WHERE user_id = ${userId} AND endpoint = ${endpoint}
    `);
    return;
  }

  await db.execute(sql`
    UPDATE push_subscriptions
    SET is_active = false, updated_at = now()
    WHERE user_id = ${userId}
  `);
}

export async function deactivatePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await db.execute(sql`
    UPDATE push_subscriptions
    SET is_active = false, updated_at = now()
    WHERE endpoint = ${endpoint}
  `);
}

export async function listActiveSubscriptions(userId: string): Promise<PushSubscriptionJson[]> {
  const result = await db.execute(sql`
    SELECT subscription
    FROM push_subscriptions
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY updated_at DESC
  `);

  return sqlRows<{ subscription: PushSubscriptionJson }>(result)
    .map((row) => row.subscription)
    .filter(Boolean);
}

export async function hasSentNotificationToday(
  userId: string,
  notificationType: string,
  dateKey: string,
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1
    FROM push_notification_log
    WHERE user_id = ${userId}
      AND notification_type = ${notificationType}
      AND date_key = ${dateKey}
    LIMIT 1
  `);
  return sqlRows(result).length > 0;
}

export async function logNotificationSent(
  userId: string,
  notificationType: string,
  dateKey: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO push_notification_log (user_id, notification_type, date_key, payload, sent_at)
    VALUES (
      ${userId},
      ${notificationType},
      ${dateKey},
      ${payload ? JSON.stringify(payload) : null}::jsonb,
      now()
    )
    ON CONFLICT (user_id, notification_type, date_key) DO NOTHING
  `);
}

export type ReminderCandidate = {
  userId: string;
  subscription: PushSubscriptionJson;
  settings: PushSettings;
};

export async function listReminderCandidates(timeHHMM: string): Promise<ReminderCandidate[]> {
  const result = await db.execute(sql`
    SELECT
      s.user_id,
      s.subscription,
      p.daily_reminder_enabled,
      p.daily_reminder_time,
      p.attendance_reminder_enabled,
      p.homework_reminder_enabled
    FROM push_notification_settings p
    INNER JOIN push_subscriptions s ON s.user_id = p.user_id AND s.is_active = true
    WHERE p.daily_reminder_time = ${timeHHMM}
      AND (
        p.daily_reminder_enabled = true
        OR p.attendance_reminder_enabled = true
        OR p.homework_reminder_enabled = true
      )
  `);

  return sqlRows<SettingsRow & { user_id: string; subscription: PushSubscriptionJson }>(result).map(
    (row) => ({
      userId: String(row.user_id),
      subscription: row.subscription,
      settings: rowToSettings(row),
    }),
  );
}

export function getDateKeyInTimezone(timeZone = "Europe/Istanbul"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getCurrentHHMMInTimezone(timeZone = "Europe/Istanbul"): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
