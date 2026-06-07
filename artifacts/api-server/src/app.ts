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
      columns: result,
      databaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 80),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: String(err),
    });
  }
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
