/**
 * Tedris VBS stres testi giriş noktası.
 *
 * Modlar:
 *   --mode=app   (varsayılan) — login + uygulama akışı, register yok
 *   --mode=auth  — register/login/auth_me performans testi
 *
 * Komutlar:
 *   pnpm stress:25        → app flow, 25 kullanıcı
 *   pnpm stress:app:25    → app flow
 *   pnpm stress:auth:25   → auth test
 */

import { parseModeArg, parseUsersArg } from "./lib/config.mjs";
import { runAppTest } from "./run-app.mjs";
import { runAuthTest } from "./run-auth.mjs";
import { exitCodeForReport } from "./lib/report.mjs";

async function main() {
  const users = parseUsersArg();
  const mode = parseModeArg();

  if (!Number.isFinite(users) || users < 1) {
    console.error("Geçersiz kullanıcı sayısı. --users=25|50|100 kullanın.");
    process.exitCode = 1;
    return;
  }

  const report = mode === "auth" ? await runAuthTest(users) : await runAppTest(users);
  process.exitCode = exitCodeForReport(report);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
