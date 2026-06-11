import webpush from "web-push";
import { logger } from "../logger";
import type { PushSubscriptionJson } from "./pushTypes";

let configured = false;

export function getVapidPublicKey(): string | null {
  const key = (process.env.VAPID_PUBLIC_KEY || "").trim();
  return key || null;
}

export function configureWebPush(): boolean {
  if (configured) return true;

  const publicKey = getVapidPublicKey();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:admin@nehariplatform.com.tr").trim();

  if (!publicKey || !privateKey) {
    logger.warn("VAPID anahtarları eksik — push bildirimleri devre dışı");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return configureWebPush();
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendWebPush(
  subscription: PushSubscriptionJson,
  payload: PushPayload,
): Promise<void> {
  if (!configureWebPush()) {
    throw new Error("Push bildirimleri yapılandırılmamış (VAPID anahtarları eksik).");
  }

  await webpush.sendNotification(
    subscription as webpush.PushSubscription,
    JSON.stringify(payload),
    { TTL: 60 * 60 * 24 },
  );
}

export function isPushEndpointGoneError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { statusCode?: number }).statusCode;
  return status === 404 || status === 410;
}

/** @alias sendWebPush */
export const sendPushToSubscription = sendWebPush;
