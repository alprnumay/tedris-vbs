import {
  assertAdminCaller,
  createVpsClientFromEnv,
  parseDryRunFlag,
  runRepairAppUserAuthLinks,
} from "../../lib/tedris-repair/repairAppUserAuthLinks";

export const config = {
  maxDuration: 300,
};

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => { json: (body: unknown) => void };
};

function bearerFromReq(req: Req): string | undefined {
  const raw = req.headers.authorization ?? req.headers.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.startsWith("Bearer ")) return undefined;
  return value.slice(7).trim();
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const token = bearerFromReq(req);
    if (!token) {
      res.status(401).json({ error: "Authorization Bearer token gerekli." });
      return;
    }

    const client = createVpsClientFromEnv(token);
    await assertAdminCaller(client);

    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as { userIds?: string[]; dryRun?: boolean } | undefined;
    const dryRun = parseDryRunFlag(req.query ?? {}, body);
    const report = await runRepairAppUserAuthLinks(client, { userIds: body?.userIds, dryRun });
    res.status(200).json(report);
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
    console.error("[repair-app-user-auth-links]", error);
    res.status(500).json({ error: msg || "Onarım tamamlanamadı." });
  }
}
