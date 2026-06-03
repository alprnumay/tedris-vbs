/**
 * Yedek health probe — tek dosya, sıfır import.
 * GET /api/repair-health
 */
export const config = { maxDuration: 10 };

type Res = { status: (code: number) => { json: (body: unknown) => void } };

export default function handler(_req: unknown, res: Res) {
  res.status(200).json({
    ok: true,
    route: "repair-health",
    phase: "health",
    deploymentSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    envStatus: {
      hasVpsApiBaseUrl: Boolean(String(process.env.VPS_API_BASE_URL ?? "").trim()),
      hasProjectApiKey: Boolean(String(process.env.VPS_PROJECT_API_KEY ?? "").trim()),
      hasAdminEmail: Boolean(String(process.env.ADMIN_EMAIL ?? "").trim()),
    },
  });
}
