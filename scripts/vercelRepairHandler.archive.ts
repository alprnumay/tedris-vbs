/**
 * Vercel serverless — sıfır üst-seviye import (module load crash önlemi).
 * Health: GET ?health=1 — repair kodu yüklenmez.
 * Dry-run: POST ?dryRun=true — dynamic import ile _server yüklenir.
 */

export const config = {
  maxDuration: 60,
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

function readEnvStatus() {
  return {
    hasVpsApiBaseUrl: Boolean(String(process.env.VPS_API_BASE_URL ?? "").trim()),
    hasProjectApiKey: Boolean(String(process.env.VPS_PROJECT_API_KEY ?? "").trim()),
    hasAdminEmail: Boolean(String(process.env.ADMIN_EMAIL ?? "").trim()),
  };
}

function queryParam(req: Req, key: string): string | undefined {
  const raw = req.query?.[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function isHealthRequest(req: Req): boolean {
  const val = queryParam(req, "health");
  return val === "1" || val === "true";
}

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

function failJson(
  message: string,
  phase: string,
  details?: string,
  extra?: Record<string, unknown>,
) {
  return {
    ok: false,
    error: "REPAIR_DRY_RUN_FAILED",
    message,
    phase,
    details: details ?? message,
    envStatus: readEnvStatus(),
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    ...extra,
  };
}

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method === "GET" && isHealthRequest(req)) {
      res.status(200).json({
        ok: true,
        route: "repair-app-user-auth-links",
        phase: "health",
        dryRunOnly: true,
        deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        envStatus: readEnvStatus(),
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json(failJson("Method not allowed. Use GET ?health=1 or POST dry-run.", "method"));
      return;
    }

    const envStatus = readEnvStatus();
    if (!envStatus.hasVpsApiBaseUrl || !envStatus.hasProjectApiKey) {
      res.status(503).json(
        failJson(
          "VPS_API_BASE_URL ve VPS_PROJECT_API_KEY Vercel Production env'de tanımlı olmalı.",
          "env_missing",
          "Handler çalışıyor; VPS env eksik.",
        ),
      );
      return;
    }

    const token = bearerFromReq(req);
    if (!token) {
      res.status(401).json(failJson("Authorization Bearer token gerekli.", "auth"));
      return;
    }

    let repairModule: typeof import("../_server/tedris-repair/repairAppUserAuthLinks");
    try {
      repairModule = await import("../_server/tedris-repair/repairAppUserAuthLinks");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      res.status(500).json(
        failJson("Repair modülü yüklenemedi (dynamic import).", "module_import", msg, {
          stack: stack?.split("\n").slice(0, 10).join("\n"),
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
        failJson(
          "Yalnızca dry-run kabul edilir. ?dryRun=true veya body.diagnoseEmails gönderin.",
          "dry_run_required",
          "dryRun=false veya eksik query ile gerçek onarım döngüsü başlatılmaz.",
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
        res.status(401).json(failJson(msg, "admin_auth"));
        return;
      }
      if (msg.startsWith("403")) {
        res.status(403).json(failJson(msg, "admin_forbidden", `ADMIN_EMAIL=${envStatus.hasAdminEmail ? "set" : "missing"}`));
        return;
      }
      throw error;
    }

    const diagnoseEmails = Array.isArray(body?.diagnoseEmails)
      ? (body.diagnoseEmails as string[])
      : ["burdurbaglarbasi@gmail.com"];

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
      phase: "dry_run_ok",
      envStatus,
      deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    try {
      res.status(500).json(
        failJson(msg || "Dry-run tamamlanamadı.", "handler", stack?.split("\n").slice(0, 12).join("\n"), {
          name: error instanceof Error ? error.name : "unknown_error",
        }),
      );
    } catch {
      /* response already sent */
    }
  }
}
