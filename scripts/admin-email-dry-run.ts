/**
 * Salt okunur tek e-posta dry-run (admin JWT + VPS katalog).
 * npx tsx scripts/admin-email-dry-run.ts burdurbaglarbasi@gmail.com
 */
import { readFileSync } from "fs";
import { join } from "path";
import { normalizeEmail } from "../server/tedris-repair/email";
import { runDiagnoseEmailsOnly, createVpsClientFromEnv } from "../server/tedris-repair/repairAppUserAuthLinks";

function loadLocalEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const k = m[1].trim();
      const v = m[2].trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

async function main() {
  loadLocalEnv();
  const email = normalizeEmail(process.argv[2] || "burdurbaglarbasi@gmail.com");
  const bearer = process.env.ADMIN_BEARER || process.env.ADMIN_JWT || "";

  if (!bearer) {
    console.error("ADMIN_BEARER gerekli (admin panel JWT).");
    process.exit(1);
  }

  const client = createVpsClientFromEnv(bearer);
  const report = await runDiagnoseEmailsOnly(client, [email]);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
