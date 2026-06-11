import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAdmin";
import { getVapidPublicKey, isPushEndpointGoneError, sendWebPush } from "../lib/push/pushSender";
import {
  DAILY_REMINDER_PAYLOAD,
  TEST_PUSH_PAYLOAD,
  isValidSubscription,
  normalizeReminderTime,
} from "../lib/push/pushTypes";
import {
  deactivatePushSubscriptions,
  getPushSettings,
  listActiveSubscriptions,
  upsertPushSettings,
  upsertPushSubscription,
} from "../lib/push/pushStore";

const router: IRouter = Router();

router.get("/push/vapid-public-key", (_req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    res.status(503).json({ error: "Push bildirimleri yapılandırılmamış." });
    return;
  }
  res.json({ publicKey });
});

router.get("/push/settings", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }

  const settings = await getPushSettings(userId);
  const subscriptions = await listActiveSubscriptions(userId);
  res.json({
    settings,
    hasActiveSubscription: subscriptions.length > 0,
    vapidPublicKey: getVapidPublicKey(),
  });
});

router.post("/push/subscribe", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }

  const subscription = req.body?.subscription ?? req.body;
  if (!isValidSubscription(subscription)) {
    res.status(400).json({ error: "Geçersiz push subscription." });
    return;
  }

  await upsertPushSubscription(userId, subscription);

  const settingsPatch = {
    dailyReminderEnabled:
      typeof req.body?.dailyReminderEnabled === "boolean"
        ? req.body.dailyReminderEnabled
        : undefined,
    dailyReminderTime:
      req.body?.dailyReminderTime != null
        ? normalizeReminderTime(req.body.dailyReminderTime)
        : undefined,
  };

  const settings = await upsertPushSettings(userId, settingsPatch);

  res.json({ ok: true, settings });
});

router.post("/push/unsubscribe", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }

  const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : undefined;
  await deactivatePushSubscriptions(userId, endpoint);
  res.json({ ok: true });
});

router.post("/push/settings", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }

  const settings = await upsertPushSettings(userId, {
    dailyReminderEnabled:
      typeof req.body?.dailyReminderEnabled === "boolean"
        ? req.body.dailyReminderEnabled
        : undefined,
    dailyReminderTime:
      req.body?.dailyReminderTime != null
        ? normalizeReminderTime(req.body.dailyReminderTime)
        : undefined,
  });

  res.json({ ok: true, settings });
});

router.post("/push/test", requireAuth, async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }

  const subscriptions = await listActiveSubscriptions(userId);
  if (subscriptions.length === 0) {
    res.status(400).json({ error: "Aktif push aboneliği bulunamadı. Önce bildirimleri açın." });
    return;
  }

  let sent = 0;
  const errors: string[] = [];

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
    res.status(502).json({ error: errors[0] ?? "Test bildirimi gönderilemedi." });
    return;
  }

  res.json({ ok: true, sent, errors: errors.length ? errors : undefined });
});

export default router;
