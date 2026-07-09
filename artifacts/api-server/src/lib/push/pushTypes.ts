export type PushSubscriptionJson = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushSettings = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  attendanceReminderEnabled: boolean;
  homeworkReminderEnabled: boolean;
};

export const DEFAULT_PUSH_SETTINGS: PushSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: "17:00",
  attendanceReminderEnabled: true,
  homeworkReminderEnabled: true,
};

export const DAILY_REMINDER_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Bugünkü yoklama ve ödev takibini doldurmayı unutmayınız.",
  url: "/davet/okul-takip",
};

export const ATTENDANCE_REMINDER_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Bugünkü yoklama bilgilerini kontrol etmeyi unutmayınız.",
  url: "/davet/okul-takip",
};

export const HOMEWORK_REMINDER_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Bugünkü ödev takiplerini tamamlamayı unutmayınız.",
  url: "/davet/okul-takip",
};

export const TEST_PUSH_PAYLOAD = {
  title: "Nehari Platformu Hatırlatma",
  body: "Test bildirimi — bildirimler bu cihazda çalışıyor.",
  url: "/davet/okul-takip",
};

export function normalizeReminderTime(raw: unknown): string {
  const value = String(raw ?? "17:00").trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "17:00";
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isValidSubscription(body: unknown): body is PushSubscriptionJson {
  const sub = body as Partial<PushSubscriptionJson>;
  return Boolean(
    sub &&
      typeof sub.endpoint === "string" &&
      sub.endpoint.length > 8 &&
      sub.keys &&
      typeof sub.keys.p256dh === "string" &&
      typeof sub.keys.auth === "string",
  );
}

export function parsePushSettingsBody(body: Record<string, unknown>): Partial<PushSettings> {
  const nested =
    body.settings && typeof body.settings === "object"
      ? (body.settings as Record<string, unknown>)
      : body;

  return {
    dailyReminderEnabled:
      typeof nested.dailyReminderEnabled === "boolean"
        ? nested.dailyReminderEnabled
        : undefined,
    dailyReminderTime:
      nested.dailyReminderTime != null
        ? normalizeReminderTime(nested.dailyReminderTime)
        : undefined,
    attendanceReminderEnabled:
      typeof nested.attendanceReminderEnabled === "boolean"
        ? nested.attendanceReminderEnabled
        : undefined,
    homeworkReminderEnabled:
      typeof nested.homeworkReminderEnabled === "boolean"
        ? nested.homeworkReminderEnabled
        : undefined,
  };
}
