import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { db } from "@workspace/db";

const app: Express = express();

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
app.get("/api/db-check", async (_req, res) => {
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
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: "API çalışıyor",
  });
});

app.use(authMiddleware);
app.use("/api", router);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    message: "Route bulunamadı",
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Beklenmeyen sunucu hatası");

  res.status(500).json({
    ok: false,
    message: "Sunucu hatası oluştu",
  });
});

export default app;