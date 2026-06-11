import { backendApi } from "./backendApi";

export type PushSettings = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
};

export type PushPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

const SW_URL = "/sw.js";

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
      return "Bildirim engellendi";
    case "default":
      return "Bildirim izni verilmedi";
    default:
      return "Cihaz desteklemiyor";
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  await navigator.serviceWorker.ready;
  return registration;
}

export async function enablePushNotifications(
  settings?: Partial<PushSettings>,
): Promise<PushSettings> {
  if (getPushSupportState() === "unsupported") {
    throw new Error("Bu cihaz web push bildirimlerini desteklemiyor.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Bildirim izni verilmedi.");
  }

  const registration = await registerServiceWorker();
  const { publicKey } = await backendApi.getPushVapidPublicKey();
  if (!publicKey) {
    throw new Error("Sunucuda push yapılandırması eksik.");
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  const payload = {
    subscription: {
      endpoint: json.endpoint!,
      expirationTime: json.expirationTime ?? null,
      keys: {
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      },
    },
    dailyReminderEnabled: settings?.dailyReminderEnabled,
    dailyReminderTime: settings?.dailyReminderTime,
  };

  const result = await backendApi.subscribePush(payload);
  return result.settings;
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
