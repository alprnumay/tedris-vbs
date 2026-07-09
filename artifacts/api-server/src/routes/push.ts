import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAdmin";
import {
  getVapidPublicKey,
  isPushConfigured,
  isPushEndpointGoneError,
  sendWebPush,
} from "../lib/push/pushSender";
import {
  TEST_PUSH_PAYLOAD,
  isValidSubscription,
  parsePushSettingsBody,
} from "../lib/push/pushTypes";
import {
  deactivatePushSubscriptions,
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
    res.json({ ok: false, error: "VAPID_PUBLIC_KEY missing" });
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
    const settings = await getPushSettings(userId);
    const subscriptions = await listActiveSubscriptions(userId);
    res.json({
      ok: true,
      settings,
      hasActiveSubscription: subscriptions.length > 0,
      vapidPublicKey: getVapidPublicKey(),
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

  if (!isPushConfigured()) {
    res.status(503).json({ ok: false, error: "Push bildirim altyapısı yapılandırılmamış." });
    return;
  }

  try {
    await upsertPushSubscription(userId, subscription, pushUserAgent(req));
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

  const subscriptions = await listActiveSubscriptions(userId);
  if (subscriptions.length === 0) {
    res.status(400).json({ ok: false, error: "Önce bildirimleri açmanız gerekiyor." });
    return;
  }

  let sent = 0;
  const errors: string[] = [];
  const dateKey = getDateKeyInTimezone(REMINDER_TIMEZONE);

  for (const subscription of subscriptions) {
    try {
      await sendWebPush(subscription, TEST_PUSH_PAYLOAD);
      sent += 1;
    } catch (err) {
      if (isPushEndpointGoneError(err)) {
        await deactivatePushSubscriptions(userId, subscription.endpoint).catch(() => {});
        errors.push("Abonelik süresi dolmuş — yeniden abone olun.");
        continue;
      }
      errors.push(err instanceof Error ? err.message : "Gönderim hatası");
    }
  }

  if (sent === 0) {
    res.status(502).json({ ok: false, error: errors[0] ?? "Test bildirimi gönderilemedi." });
    return;
  }

  await logNotificationSent(userId, "test", dateKey, TEST_PUSH_PAYLOAD).catch(() => {});

  res.json({ ok: true, sent, errors: errors.length ? errors : undefined });
});

export default router;
