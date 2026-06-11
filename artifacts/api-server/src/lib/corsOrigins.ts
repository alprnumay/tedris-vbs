import cors from "cors";

const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const PRODUCTION_ORIGINS = [
  "https://nehariplatform.com.tr",
  "https://www.nehariplatform.com.tr",
];

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function collectAllowedOrigins(): Set<string> {
  const set = new Set([...LOCAL_ORIGINS, ...PRODUCTION_ORIGINS]);
  for (const raw of [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS?.split(",") ?? []),
  ]) {
    const origin = raw?.trim().replace(/\/$/, "");
    if (origin) set.add(origin);
  }
  return set;
}

export function corsMiddleware() {
  const allowed = collectAllowedOrigins();

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      /** Yerel Vite (3000, 3001, 5173 …) — canlı API’ye karşı `pnpm dev` için. */
      if (LOCALHOST_ORIGIN_RE.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
}
