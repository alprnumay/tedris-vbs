import cron from "node-cron";
import { logger } from "../logger";
import { DAILY_REMINDER_PAYLOAD } from "./pushTypes";
import { isPushEndpointGoneError, sendWebPush } from "./pushSender";
import {
  deactivatePushSubscriptionByEndpoint,
  getCurrentHHMMInTimezone,
  getDateKeyInTimezone,
  hasSentNotificationToday,
  listDailyReminderCandidates,
  logNotificationSent,
} from "./pushStore";

const REMINDER_TIMEZONE = process.env.PUSH_REMINDER_TIMEZONE || "Europe/Istanbul";
const NOTIFICATION_TYPE = "dailyReminder";

export async function runDailyReminderTick(): Promise<void> {
  const timeHHMM = getCurrentHHMMInTimezone(REMINDER_TIMEZONE);
  const dateKey = getDateKeyInTimezone(REMINDER_TIMEZONE);
  const candidates = await listDailyReminderCandidates(timeHHMM);

  if (candidates.length === 0) return;

  logger.info({ timeHHMM, count: candidates.length }, "Günlük hatırlatma adayı bulundu");

  for (const candidate of candidates) {
    try {
      const alreadySent = await hasSentNotificationToday(
        candidate.userId,
        NOTIFICATION_TYPE,
        dateKey,
      );
      if (alreadySent) continue;

      await sendWebPush(candidate.subscription, DAILY_REMINDER_PAYLOAD);
      await logNotificationSent(candidate.userId, NOTIFICATION_TYPE, dateKey, DAILY_REMINDER_PAYLOAD);
    } catch (err) {
      if (isPushEndpointGoneError(err)) {
        await deactivatePushSubscriptionByEndpoint(candidate.subscription.endpoint).catch(() => {});
        logger.warn({ userId: candidate.userId }, "Geçersiz push subscription pasifleştirildi");
        continue;
      }
      logger.error({ err, userId: candidate.userId }, "Günlük hatırlatma gönderilemedi");
    }
  }
}

export function startDailyReminderCron(): void {
  if (process.env.PUSH_CRON_ENABLED === "false") {
    logger.info("Push cron devre dışı (PUSH_CRON_ENABLED=false)");
    return;
  }

  cron.schedule(
    "* * * * *",
    () => {
      runDailyReminderTick().catch((err) => {
        logger.error({ err }, "Günlük hatırlatma cron hatası");
      });
    },
    { timezone: REMINDER_TIMEZONE },
  );

  logger.info({ timezone: REMINDER_TIMEZONE }, "Günlük hatırlatma cron başlatıldı (dakikalık)");
}
