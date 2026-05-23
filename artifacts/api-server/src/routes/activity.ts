import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAdmin";
import { logActivityByUserId } from "../lib/activityLog";

const ALLOWED = new Set([
  "export_png",
  "export_pdf",
  "share_whatsapp",
  "open_veli_module",
]);

const router: IRouter = Router();

router.post("/activity/log", requireAuth, async (req: Request, res: Response) => {
  const action = String(req.body?.action ?? "").trim();
  if (!ALLOWED.has(action)) {
    res.status(400).json({ error: "Geçersiz işlem türü." });
    return;
  }
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }
  await logActivityByUserId(userId, action);
  res.json({ ok: true });
});

export default router;
