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
};

export const DEFAULT_PUSH_SETTINGS: PushSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: "17:00",
};

export const DAILY_REMINDER_PAYLOAD = {
  title: "Günlük takip hatırlatması",
  body: "Bugünkü işler tamamlandı mı? Yoklama, okul ödevi takibi ve veli bilgilendirme durumunu kontrol etmeyi unutmayın.",
  url: "/davet/okul-takip",
};

export const TEST_PUSH_PAYLOAD = {
  title: "Test bildirimi",
  body: "Tedris VBS bildirimleri bu cihazda çalışıyor.",
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
