import { repairEnvStatus } from "../_server/tedris-repair/env";

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

function parseBody(req: Req): Record<string, unknown> | undefined {
  if (req.body == null || req.body === "") return undefined;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`REPAIR_INVALID_JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (typeof req.body === "object") return req.body as Record<string, unknown>;
  return undefined;
}

function repairErrorResponse(
  status: number,
  message: string,
  details?: string,
  extra?: Record<string, unknown>,
) {
  return {
    ok: false,
    error: "REPAIR_DRY_RUN_FAILED",
    message,
    details: details ?? message,
    envStatus: repairEnvStatus(),
    ...extra,
  };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.status(405).json(repairErrorResponse(405, "Method not allowed"));
    return;
  }

  try {
    const envStatus = repairEnvStatus();
    if (!envStatus.hasVpsApiBaseUrl || !envStatus.hasProjectApiKey) {
      res.status(503).json(
        repairErrorResponse(
          503,
          "VPS_API_BASE_URL ve VPS_PROJECT_API_KEY Vercel ortamında tanımlı değil.",
          "FUNCTION_INVOCATION_FAILED genelde eksik env veya modül yüklenememesinden kaynaklanır.",
        ),
      );
      return;
    }

    const token = bearerFromReq(req);
    if (!token) {
      res.status(401).json(repairErrorResponse(401, "Authorization Bearer token gerekli."));
      return;
    }

    let repairModule: typeof import("../_server/tedris-repair/repairAppUserAuthLinks");
    try {
      repairModule = await import("../_server/tedris-repair/repairAppUserAuthLinks");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      res.status(500).json(
        repairErrorResponse(500, "Repair modülü yüklenemedi.", msg, {
          phase: "module_import",
          stack: stack?.split("\n").slice(0, 8).join("\n"),
        }),
      );
      return;
    }

    const { assertAdminCaller, createVpsClientFromEnv, parseDryRunFlag, runRepairAppUserAuthLinks } =
      repairModule;

    const body = parseBody(req);
    const dryRun = parseDryRunFlag(req.query ?? {}, body);

    if (!dryRun) {
      res.status(400).json(
        repairErrorResponse(
          400,
          "Bu endpoint yalnızca dry-run teşhis içindir. dryRun=true veya diagnoseEmails gönderin.",
          "dryRun=false ile çağrı 852 kayıtta gerçek onarım döngüsünü tetikleyebilir ve FUNCTION_INVOCATION_FAILED üretebilir.",
          { dryRun: false, repairBlocked: true },
        ),
      );
      return;
    }

    const client = createVpsClientFromEnv(token);

    try {
      await assertAdminCaller(client);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.startsWith("401")) {
        res.status(401).json(repairErrorResponse(401, msg, "Admin JWT geçersiz veya süresi dolmuş."));
        return;
      }
      if (msg.startsWith("403")) {
        res.status(403).json(
          repairErrorResponse(403, msg, `ADMIN_EMAIL=${process.env.ADMIN_EMAIL ? "set" : "missing"}`),
        );
        return;
      }
      throw error;
    }

    const diagnoseEmails = Array.isArray(body?.diagnoseEmails)
      ? (body.diagnoseEmails as string[])
      : dryRun
        ? ["burdurbaglarbasi@gmail.com"]
        : undefined;

    const userIds = Array.isArray(body?.userIds) ? (body.userIds as string[]) : undefined;

    const report = await runRepairAppUserAuthLinks(client, {
      userIds,
      dryRun: true,
      diagnoseEmails,
    });

    res.status(200).json({
      ...report,
      ok: report.ok,
      dryRun: true,
      dataChanged: false,
      envStatus,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    res.status(500).json(
      repairErrorResponse(500, msg || "Dry-run tamamlanamadı.", stack?.split("\n").slice(0, 12).join("\n"), {
        phase: "handler",
        name: error instanceof Error ? error.name : "unknown_error",
      }),
    );
  }
}
