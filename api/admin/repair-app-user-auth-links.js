/**
 * Vercel serverless — health (sıfır import) + güvenli diagnoseEmails dry-run (bundle).
 */

function readEnvStatus() {
  return {
    hasVpsApiBaseUrl: Boolean(String(process.env.VPS_API_BASE_URL || "").trim()),
    hasProjectApiKey: Boolean(String(process.env.VPS_PROJECT_API_KEY || "").trim()),
    hasAdminEmail: Boolean(String(process.env.ADMIN_EMAIL || "").trim()),
  };
}

function failJson(message, phase, details, extra) {
  return {
    ok: false,
    error: "REPAIR_DRY_RUN_FAILED",
    message,
    phase,
    details: details || message,
    envStatus: readEnvStatus(),
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    ...extra,
  };
}

function healthQuery(req) {
  const q = req.query || {};
  const raw = q.health;
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (val === "1" || val === "true") return true;
  const url = typeof req.url === "string" ? req.url : "";
  return url.includes("health=1") || url.includes("health=true");
}

function queryDryRun(req) {
  const q = req.query || {};
  const raw = q.dryRun ?? q.dryrun;
  const val = Array.isArray(raw) ? raw[0] : raw;
  return val === "1" || val === "true";
}

function parseBody(req) {
  if (req.body == null || req.body === "") return null;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw new Error(`REPAIR_INVALID_JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (typeof req.body === "object") return req.body;
  return null;
}

function bearerFromReq(req) {
  const raw = req.headers.authorization || req.headers.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !String(value).startsWith("Bearer ")) return undefined;
  return String(value).slice(7).trim();
}

function normalizeEmailsInput(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e) => (typeof e === "string" ? e.trim().toLocaleLowerCase("tr-TR") : ""))
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET" && healthQuery(req)) {
      res.status(200).json({
        ok: true,
        route: "repair-app-user-auth-links",
        phase: "health",
        deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        envStatus: readEnvStatus(),
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json(failJson("GET ?health=1 veya POST dry-run kullanın.", "method"));
      return;
    }

    const envStatus = readEnvStatus();
    if (!envStatus.hasVpsApiBaseUrl || !envStatus.hasProjectApiKey) {
      res.status(503).json(failJson("VPS_API_BASE_URL ve VPS_PROJECT_API_KEY eksik.", "env_missing"));
      return;
    }

    let body;
    try {
      body = parseBody(req);
    } catch (error) {
      res.status(400).json(failJson(error instanceof Error ? error.message : String(error), "invalid_json"));
      return;
    }

    const dryRunBody = body && body.dryRun === true;
    const dryRunQuery = queryDryRun(req);
    if (!dryRunBody && !dryRunQuery) {
      res.status(400).json(
        failJson("dryRun=true zorunlu (query veya body).", "dry_run_required", undefined, { repairBlocked: true }),
      );
      return;
    }

    if (body && body.dryRun === false) {
      res.status(400).json(failJson("dryRun=false kabul edilmez.", "dry_run_false_blocked", undefined, { repairBlocked: true }));
      return;
    }

    const diagnoseEmails = normalizeEmailsInput(body?.diagnoseEmails);
    if (!diagnoseEmails.length) {
      res.status(400).json(failJson("diagnoseEmails dizisi zorunlu (1–5 e-posta).", "diagnose_emails_required"));
      return;
    }
    if (diagnoseEmails.length > 5) {
      res.status(400).json(failJson("En fazla 5 e-posta teşhis edilebilir.", "diagnose_emails_limit"));
      return;
    }

    if (body?.userIds) {
      res.status(400).json(failJson("userIds bu endpointte kabul edilmez.", "extra_fields_rejected"));
      return;
    }

    const token = bearerFromReq(req);
    if (!token) {
      res.status(401).json(failJson("Authorization Bearer token gerekli.", "auth"));
      return;
    }

    let lib;
    try {
      lib = require("../lib/repair-dry-run.cjs");
    } catch (error) {
      res.status(500).json(
        failJson(
          "repair-dry-run bundle yüklenemedi (build adımı çalışmamış olabilir).",
          "bundle_missing",
          error instanceof Error ? error.message : String(error),
        ),
      );
      return;
    }

    const client = lib.createVpsClientFromEnv(token);
    try {
      await lib.assertAdminCaller(client);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.startsWith("401")) {
        res.status(401).json(failJson(msg, "admin_auth"));
        return;
      }
      if (msg.startsWith("403")) {
        res.status(403).json(failJson(msg, "admin_forbidden"));
        return;
      }
      throw error;
    }

    const report = await lib.runDiagnoseEmailsOnly(client, diagnoseEmails);
    res.status(200).json({
      ...report,
      envStatus,
      deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    res.status(500).json(failJson(msg || "Dry-run başarısız.", "handler", stack?.split("\n").slice(0, 10).join("\n")));
  }
};
