/**
 * Vercel serverless — yalnızca health (sıfır import, CommonJS).
 * GET /api/admin/repair-app-user-auth-links?health=1
 */

function readEnvStatus() {
  return {
    hasVpsApiBaseUrl: Boolean(String(process.env.VPS_API_BASE_URL || "").trim()),
    hasProjectApiKey: Boolean(String(process.env.VPS_PROJECT_API_KEY || "").trim()),
    hasAdminEmail: Boolean(String(process.env.ADMIN_EMAIL || "").trim()),
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

    if (req.method === "POST") {
      res.status(503).json({
        ok: false,
        error: "REPAIR_DISABLED",
        message: "Dry-run bu deployda kapalı. Önce GET ?health=1 çalışmalı.",
        phase: "dry_run_disabled",
        deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        envStatus: readEnvStatus(),
      });
      return;
    }

    res.status(405).json({
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "GET /api/admin/repair-app-user-auth-links?health=1",
      deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "HEALTH_HANDLER_ERROR",
      message: error instanceof Error ? error.message : String(error),
      phase: "catch",
      deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    });
  }
};
