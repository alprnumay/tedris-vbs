import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAdmin";
import {
  getVapidPublicKey,
  isPushConfigured,
  classifyPushSendError,
  shouldDeactivateSubscriptionOnPushError,
  sendWebPush,
} from "../lib/push/pushSender";
import {
  TEST_PUSH_PAYLOAD,
  isValidSubscription,
  parsePushSettingsBody,
} from "../lib/push/pushTypes";
import {
  deactivatePushSubscriptions,
  deactivateStaleVapidSubscriptions,
  getDateKeyInTimezone,
  getPushSettings,
  listActiveSubscriptions,
  logNotificationSent,
  upsertPushSettings,
  upsertPushSubscription,
} from "../lib/push/pushStore";

const router: IRouter = Router();
const REMINDER_TIMEZONE = process.env.PUSH_REMINDER_TIMEZONE || "Europe/Istanbul";

function pushUserAgent(req: Request): string | null {
  const raw = req.headers["user-agent"];
  return typeof raw === "string" ? raw.slice(0, 512) : null;
}

router.get("/push/vapid-public-key", (_req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    res.status(503).json({
      ok: false,
      error: "Bildirim altyapısı henüz yapılandırılmamış. VAPID anahtarları eksik.",
    });
    return;
  }
  res.json({ ok: true, publicKey });
});

router.get("/push/settings", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Oturum gerekli." });
    return;
  }

  try {
    const currentVapid = getVapidPublicKey();
    await deactivateStaleVapidSubscriptions(userId, currentVapid);
    const subscriptions = await listActiveSubscriptions(userId, { vapidPublicKey: currentVapid });
    const settings = await getPushSettings(userId);
    res.json({
      ok: true,
      settings,
      hasActiveSubscription: subscriptions.length > 0,
      vapidPublicKey: getVapidPublicKey(),
      pushConfigured: isPushConfigured(),
    });
  } catch (err) {
    console.error("[push/settings GET]", err);
    res.status(500).json({ ok: false, error: "Bildirim ayarları alınamadı." });
  }
});

router.post("/push/subscribe", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Oturum gerekli." });
    return;
  }

  const subscription = req.body?.subscription ?? req.body;
  if (!isValidSubscription(subscription)) {
    res.status(400).json({ ok: false, error: "Geçersiz push subscription." });
    return;
  }

  try {
    const currentVapid = getVapidPublicKey();
    const replaceAll = req.body?.replaceAll === true;

    if (replaceAll) {
      await deactivatePushSubscriptions(userId);
    } else {
      await deactivateStaleVapidSubscriptions(userId, currentVapid);
    }

    await upsertPushSubscription(userId, subscription, pushUserAgent(req), currentVapid);
    const settings = await upsertPushSettings(userId, parsePushSettingsBody(req.body ?? {}));
    res.json({ ok: true, settings });
  } catch (err) {
    console.error("[push/subscribe]", err);
    res.status(500).json({ ok: false, error: "Push aboneliği kaydedilemedi." });
  }
});

router.post("/push/unsubscribe", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Oturum gerekli." });
    return;
  }

  const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : undefined;
  await deactivatePushSubscriptions(userId, endpoint);
  res.json({ ok: true });
});

router.post("/push/settings", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Oturum gerekli." });
    return;
  }

  try {
    const settings = await upsertPushSettings(userId, parsePushSettingsBody(req.body ?? {}));
    res.json({ ok: true, settings });
  } catch (err) {
    console.error("[push/settings POST]", err);
    res.status(500).json({ ok: false, error: "Bildirim ayarları kaydedilemedi." });
  }
});

router.post("/push/test", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Oturum gerekli." });
    return;
  }

  if (!isPushConfigured()) {
    res.status(503).json({ ok: false, error: "Push bildirim altyapısı yapılandırılmamış." });
    return;
  }

  const currentVapid = getVapidPublicKey();
  await deactivateStaleVapidSubscriptions(userId, currentVapid);

  const subscriptions = await listActiveSubscriptions(userId, { vapidPublicKey: currentVapid });
  if (subscriptions.length === 0) {
    res.status(400).json({ ok: false, error: "Önce bildirimleri açmanız gerekiyor." });
    return;
  }

  let sent = 0;
  const failures: Array<{ kind: string; message: string }> = [];
  const dateKey = getDateKeyInTimezone(REMINDER_TIMEZONE);

  for (const subscription of subscriptions) {
    try {
      await sendWebPush(subscription, TEST_PUSH_PAYLOAD);
      sent += 1;
    } catch (err) {
      const classified = classifyPushSendError(err);
      if (shouldDeactivateSubscriptionOnPushError(classified.kind)) {
        await deactivatePushSubscriptions(userId, subscription.endpoint).catch(() => {});
      }
      failures.push(classified);
    }
  }

  if (sent === 0) {
    const primary = failures[0];
    if (primary?.kind === "vapid_mismatch") {
      res.status(409).json({
        ok: false,
        error: primary.message,
        code: "VAPID_MISMATCH",
      });
      return;
    }
    if (primary?.kind === "expired") {
      res.status(400).json({
        ok: false,
        error: primary.message,
        code: "SUBSCRIPTION_EXPIRED",
      });
      return;
    }
    res.status(400).json({
      ok: false,
      error: primary?.message ?? "Test bildirimi gönderilemedi.",
    });
    return;
  }

  await logNotificationSent(userId, "test", dateKey, TEST_PUSH_PAYLOAD).catch(() => {});

  res.json({ ok: true, sent, errors: failures.length ? failures.map((f) => f.message) : undefined });
});

export default router;
