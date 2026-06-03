/**
 * Salt okunur tek e-posta dry-run (admin JWT + VPS katalog).
 * npx tsx scripts/admin-email-dry-run.ts burdurbaglarbasi@gmail.com
 */
import { readFileSync } from "fs";
import { join } from "path";
import { diagnoseRepairEmail } from "../server/tedris-repair/diagnoseDryRun";
import type { AppUserRecordData, BackendRecord, BackendUser } from "../server/tedris-repair/types";
import { VpsApiClient } from "../server/tedris-repair/vpsClient";

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
  const email = (process.argv[2] || "burdurbaglarbasi@gmail.com").trim();
  const baseUrl = (process.env.VPS_API_BASE_URL || process.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  const projectKey = process.env.VPS_PROJECT_API_KEY || process.env.VITE_PROJECT_API_KEY || "";
  const bearer = process.env.ADMIN_BEARER || process.env.ADMIN_JWT || "";

  if (!bearer) {
    console.error("ADMIN_BEARER gerekli (admin panel JWT).");
    process.exit(1);
  }
  if (!baseUrl || !projectKey) {
    console.error("VPS_API_BASE_URL ve VPS_PROJECT_API_KEY gerekli.");
    process.exit(1);
  }

  const client = new VpsApiClient(baseUrl, projectKey, bearer);
  const me = await client.me();
  const [records, authUsers] = await Promise.all([
    client.loadAllAppUsers(),
    client.listAuthUsers().catch(() => [] as BackendUser[]),
  ]);

  const row = diagnoseRepairEmail(email, records as BackendRecord<AppUserRecordData>[], authUsers);
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        dataChanged: false,
        adminCaller: me.user?.email ?? null,
        catalogSize: records.length,
        emailDiagnosis: row,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
