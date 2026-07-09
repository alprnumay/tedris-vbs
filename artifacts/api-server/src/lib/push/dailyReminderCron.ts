import cron from "node-cron";
import { logger } from "../logger";
import {
  ATTENDANCE_REMINDER_PAYLOAD,
  DAILY_REMINDER_PAYLOAD,
  HOMEWORK_REMINDER_PAYLOAD,
  type PushSettings,
} from "./pushTypes";
import { isPushEndpointGoneError, sendWebPush, type PushPayload } from "./pushSender";
import {
  deactivatePushSubscriptionByEndpoint,
  getCurrentHHMMInTimezone,
  getDateKeyInTimezone,
  hasSentNotificationToday,
  listReminderCandidates,
  logNotificationSent,
} from "./pushStore";

const REMINDER_TIMEZONE = process.env.PUSH_REMINDER_TIMEZONE || "Europe/Istanbul";

type ReminderJob = {
  type: string;
  enabled: (settings: PushSettings) => boolean;
  payload: PushPayload;
};

const REMINDER_JOBS: ReminderJob[] = [
  {
    type: "dailyReminder",
    enabled: (s) => s.dailyReminderEnabled,
    payload: DAILY_REMINDER_PAYLOAD,
  },
  {
    type: "attendanceReminder",
    enabled: (s) => s.attendanceReminderEnabled,
    payload: ATTENDANCE_REMINDER_PAYLOAD,
  },
  {
    type: "homeworkReminder",
    enabled: (s) => s.homeworkReminderEnabled,
    payload: HOMEWORK_REMINDER_PAYLOAD,
  },
];

export async function runDailyReminderTick(): Promise<void> {
  const timeHHMM = getCurrentHHMMInTimezone(REMINDER_TIMEZONE);
  const dateKey = getDateKeyInTimezone(REMINDER_TIMEZONE);
  const candidates = await listReminderCandidates(timeHHMM);

  if (candidates.length === 0) return;

  logger.info({ timeHHMM, count: candidates.length }, "Günlük hatırlatma adayı bulundu");

  for (const candidate of candidates) {
    for (const job of REMINDER_JOBS) {
      if (!job.enabled(candidate.settings)) continue;

      try {
        const alreadySent = await hasSentNotificationToday(
          candidate.userId,
          job.type,
          dateKey,
        );
        if (alreadySent) continue;

        await sendWebPush(candidate.subscription, job.payload);
        await logNotificationSent(candidate.userId, job.type, dateKey, job.payload);
      } catch (err) {
        if (isPushEndpointGoneError(err)) {
          await deactivatePushSubscriptionByEndpoint(candidate.subscription.endpoint).catch(() => {});
          logger.warn({ userId: candidate.userId }, "Geçersiz push subscription pasifleştirildi");
          break;
        }
        logger.error({ err, userId: candidate.userId, type: job.type }, "Hatırlatma gönderilemedi");
      }
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
