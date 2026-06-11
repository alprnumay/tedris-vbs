import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./lib/corsOrigins";
import { useCrossSiteSessionCookie } from "./lib/sessionCookie";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { db } from "@workspace/db";
import { ensureDbSchema } from "./lib/ensureDbSchema";
import { isPushConfigured } from "./lib/push/pushSender";

const app: Express = express();

if (useCrossSiteSessionCookie()) {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(corsMiddleware());

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "7d",
    fallthrough: true,
  }),
);

app.get("/", (_req: Request, res: Response) => {
  const frontend =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : null);
  res.status(200).json({
    ok: true,
    message: "Nehari Veli Bilgilendirme API sunucusu. Arayüz bu adreste değil.",
    hint: frontend
      ? `Uygulamayı tarayıcıda açın: ${frontend}`
      : "Frontend adresi için FRONTEND_URL ortam değişkenini ayarlayın.",
    apiHealth: "/api/health",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: "API çalışıyor",
    adminRoutes: true,
    recordsCrud: true,
    pushRoutes: true,
    pushConfigured: isPushConfigured(),
    commit: process.env.DEPLOY_COMMIT || process.env.GIT_SHA || null,
    schemaVersion: 4,
  });
});

app.get("/api/db-check", async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'local_users'
      ORDER BY ordinal_position
    `);

    res.json({
      ok: true,
      columns: (result as { rows?: { column_name: string }[] }).rows?.map((r) => r.column_name) ?? result,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: String(err),
    });
  }
});

/** VPS deploy sonrası şema onarımı — SETUP_SECRET header veya ?token= ile */
app.post("/api/setup-schema", async (req: Request, res: Response) => {
  const secret = process.env.SETUP_SECRET?.trim();
  const token =
    (typeof req.headers["x-setup-token"] === "string" ? req.headers["x-setup-token"] : "") ||
    (typeof req.query.token === "string" ? req.query.token : "") ||
    (typeof req.body?.token === "string" ? req.body.token : "");

  if (secret && token !== secret) {
    res.status(403).json({ ok: false, error: "Geçersiz setup token." });
    return;
  }

  const result = await ensureDbSchema();
  const columns = await db.execute(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'local_users' ORDER BY ordinal_position
  `);

  res.status(result.ok ? 200 : 500).json({
    ...result,
    localUserColumns: (columns as { rows?: { column_name: string }[] }).rows?.map((r) => r.column_name) ?? [],
  });
});

app.use(authMiddleware);
app.use("/api", router);

app.use((req: Request, res: Response) => {
  const isApi = req.path.startsWith("/api");
  res.status(404).json({
    ok: false,
    message: isApi ? "API route bulunamadı" : "Route bulunamadı",
    ...(isApi
      ? {}
      : {
          hint:
            "Bu port yalnızca API içindir. Nehari Veli Bilgilendirme arayüzü için geliştirmede http://localhost:3000 adresini kullanın (npm run dev).",
        }),
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e?.status ?? e?.statusCode;

  if (status && status >= 400 && status < 500) {
    res.status(status).json({
      error: e?.message || "İstek hatası",
    });
    return;
  }

  logger.error({ err }, "Beklenmeyen sunucu hatası");

  res.status(500).json({
    ok: false,
    message: "Sunucu hatası oluştu",
  });
});

export default app;
