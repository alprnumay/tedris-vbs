import cors from "cors";

const LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function collectAllowedOrigins(): Set<string> {
  const set = new Set(LOCAL_ORIGINS);
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
  const isProd = process.env.NODE_ENV === "production";

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
      if (!isProd && LOCALHOST_ORIGIN_RE.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  });
}
