import { backendApi } from "./backendApi";

export type PushSettings = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  attendanceReminderEnabled: boolean;
  homeworkReminderEnabled: boolean;
};

export type PushPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

const SW_URL = "/sw.js";
export const DAILY_REMINDER_SETTINGS_KEY = "nehariDailyReminderSettings";
const LAST_VAPID_KEY = "nehariLastVapidPublicKey";

const DEFAULT_SETTINGS: PushSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: "17:00",
  attendanceReminderEnabled: true,
  homeworkReminderEnabled: true,
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function loadLocalReminderSettings(): PushSettings {
  try {
    const raw = localStorage.getItem(DAILY_REMINDER_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PushSettings>;
    return {
      dailyReminderEnabled:
        typeof parsed.dailyReminderEnabled === "boolean"
          ? parsed.dailyReminderEnabled
          : DEFAULT_SETTINGS.dailyReminderEnabled,
      dailyReminderTime:
        typeof parsed.dailyReminderTime === "string" && parsed.dailyReminderTime
          ? parsed.dailyReminderTime
          : DEFAULT_SETTINGS.dailyReminderTime,
      attendanceReminderEnabled:
        typeof parsed.attendanceReminderEnabled === "boolean"
          ? parsed.attendanceReminderEnabled
          : DEFAULT_SETTINGS.attendanceReminderEnabled,
      homeworkReminderEnabled:
        typeof parsed.homeworkReminderEnabled === "boolean"
          ? parsed.homeworkReminderEnabled
          : DEFAULT_SETTINGS.homeworkReminderEnabled,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveLocalReminderSettings(settings: PushSettings): void {
  try {
    localStorage.setItem(DAILY_REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function getPushSupportState(): PushPermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermissionState;
}

export function getPermissionLabel(state: PushPermissionState): string {
  switch (state) {
    case "granted":
      return "Bildirim izni verildi";
    case "denied":
      return "Bildirim izni engellenmiş";
    case "default":
      return "Bildirim izni henüz verilmedi";
    default:
      return "Bu cihaz veya tarayıcı web bildirimlerini desteklemiyor olabilir";
  }
}

export function isAndroidChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent) && /Chrome/i.test(navigator.userAgent);
}

export function isDesktopChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Chrome/i.test(ua) && !/Android|Mobile/i.test(ua);
}

export async function fetchVapidPublicKey(): Promise<string> {
  const data = await backendApi.getPushVapidPublicKey();
  if (!data.ok || !data.publicKey) {
    throw new Error(
      data.error || "Bildirim altyapısı henüz yapılandırılmamış. VAPID anahtarları eksik.",
    );
  }
  return data.publicKey;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  await navigator.serviceWorker.ready;
  return registration;
}

function rememberVapidPublicKey(publicKey: string): void {
  try {
    localStorage.setItem(LAST_VAPID_KEY, publicKey);
  } catch {
    /* ignore */
  }
}

function hasVapidKeyChanged(publicKey: string): boolean {
  try {
    const last = localStorage.getItem(LAST_VAPID_KEY);
    return Boolean(last && last !== publicKey);
  } catch {
    return false;
  }
}

async function unsubscribeBrowserPush(registration: ServiceWorkerRegistration): Promise<void> {
  const existing = await registration.pushManager.getSubscription();
  if (!existing) return;
  await existing.unsubscribe().catch(() => undefined);
}

async function subscribeWithVapid(
  registration: ServiceWorkerRegistration,
  forceNew = false,
): Promise<PushSubscription> {
  const publicKey = await fetchVapidPublicKey();
  const mustRenew = forceNew || hasVapidKeyChanged(publicKey);

  if (mustRenew) {
    await unsubscribeBrowserPush(registration);
  } else {
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      rememberVapidPublicKey(publicKey);
      return existing;
    }
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  rememberVapidPublicKey(publicKey);
  return subscription;
}

function subscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint!,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    },
  };
}

export async function syncPushSubscription(
  settings?: Partial<PushSettings>,
): Promise<PushSettings | null> {
  if (getPushSupportState() !== "granted") return null;

  const registration = await registerServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;

  const mergedSettings: PushSettings = {
    ...loadLocalReminderSettings(),
    ...settings,
  };

  const result = await backendApi.subscribePush({
    subscription: subscriptionPayload(subscription),
    settings: mergedSettings,
  });

  saveLocalReminderSettings(result.settings);
  return result.settings;
}

export async function enablePushNotifications(
  settings?: Partial<PushSettings>,
): Promise<PushSettings> {
  if (getPushSupportState() === "unsupported") {
    throw new Error("Bu cihaz veya tarayıcı web bildirimlerini desteklemiyor olabilir.");
  }

  if (getPushSupportState() === "denied") {
    throw new Error("Bildirim izni engellenmiş. Lütfen site ayarlarından izin verin.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Bildirim izni engellenmiş. Lütfen site ayarlarından izin verin."
        : "Bildirim izni verilmedi.",
    );
  }

  const registration = await registerServiceWorker();
  const subscription = await subscribeWithVapid(registration);
  const mergedSettings: PushSettings = {
    ...loadLocalReminderSettings(),
    ...settings,
  };

  const result = await backendApi.subscribePush({
    subscription: subscriptionPayload(subscription),
    settings: mergedSettings,
  });

  saveLocalReminderSettings(result.settings);
  return result.settings;
}

export async function resubscribePush(
  settings?: Partial<PushSettings>,
): Promise<PushSettings> {
  if (getPushSupportState() !== "granted") {
    throw new Error("Bildirim izni verilmedi. Önce bildirimleri açın.");
  }

  const registration = await registerServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  const oldEndpoint = existing?.endpoint;

  await backendApi.unsubscribePush(oldEndpoint ? { endpoint: oldEndpoint } : undefined);
  await unsubscribeBrowserPush(registration);

  const publicKey = await fetchVapidPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  rememberVapidPublicKey(publicKey);

  const mergedSettings: PushSettings = {
    ...loadLocalReminderSettings(),
    ...settings,
  };

  const result = await backendApi.subscribePush({
    subscription: subscriptionPayload(subscription),
    settings: mergedSettings,
    replaceAll: true,
  });

  saveLocalReminderSettings(result.settings);
  return result.settings;
}

export async function checkBrowserSubscription(): Promise<boolean> {
  if (getPushSupportState() !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

export async function unsubscribePush(endpoint?: string): Promise<void> {
  await backendApi.unsubscribePush(endpoint ? { endpoint } : undefined);

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe().catch(() => undefined);
    }
  }
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function buildPermissionHelpSteps(): string[] {
  if (isIosDevice()) {
    return [
      "Safari'de paylaş simgesine dokunun.",
      "\"Ana Ekrana Ekle\" seçeneğini seçin.",
      "Uygulamayı ana ekrandan açıp tekrar bildirimleri açın.",
    ];
  }
  if (isAndroidChrome()) {
    return [
      "Adres çubuğundaki kilit / ayar simgesine dokunun.",
      "Site ayarları bölümüne girin.",
      "Bildirimler iznini \"İzin ver\" yapın.",
    ];
  }
  return [
    "Adres çubuğundaki kilit / ayar simgesine tıklayın.",
    "Site ayarları bölümüne girin.",
    "Bildirimler iznini \"İzin ver\" yapın.",
  ];
}
