import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { ensureDbSchema } from "./lib/ensureDbSchema";
import { configureWebPush } from "./lib/push/pushSender";
import { startDailyReminderCron } from "./lib/push/dailyReminderCron";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await ensureDbSchema();
  configureWebPush();
  startDailyReminderCron();

  app.listen(port, (err?: unknown) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

start().catch((err) => {
  logger.error({ err }, "Sunucu başlatılamadı");
  process.exit(1);
});