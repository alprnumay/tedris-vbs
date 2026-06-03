import { Router, type IRouter, type Request, type Response } from "express";
import {
  assertAdminCaller,
  createVpsClientFromEnv,
  parseDryRunFlag,
  runRepairAppUserAuthLinks,
} from "../../../../lib/tedris-repair/repairAppUserAuthLinks";

const router: IRouter = Router();

function bearerFromReq(req: Request): string | undefined {
  const raw = req.headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.startsWith("Bearer ")) return undefined;
  return value.slice(7).trim();
}

router.post("/admin/repair-app-user-auth-links", async (req: Request, res: Response) => {
  try {
    const token = bearerFromReq(req);
    if (!token) {
      res.status(401).json({ error: "Authorization Bearer token gerekli." });
      return;
    }
    const client = createVpsClientFromEnv(token);
    await assertAdminCaller(client);
    const userIds = Array.isArray((req.body as { userIds?: unknown })?.userIds)
      ? (req.body as { userIds: string[] }).userIds
      : undefined;
    const dryRun = parseDryRunFlag(req.query as Record<string, string | string[] | undefined>, req.body);
    const report = await runRepairAppUserAuthLinks(client, { userIds, dryRun });
    res.json(report);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.startsWith("401")) {
      res.status(401).json({ error: msg });
      return;
    }
    if (msg.startsWith("403")) {
      res.status(403).json({ error: msg });
      return;
    }
    console.error("[admin/repair-app-user-auth-links]", error);
    res.status(500).json({ error: msg || "Onarım tamamlanamadı." });
  }
});

export default router;
