import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const root = process.cwd();
const runIdArg = process.argv.find((arg) => arg.startsWith("--run-id="));
const runId = process.env.LOAD_TEST_RUN_ID || runIdArg?.split("=")[1] || "";
const emailPrefix = process.env.LOAD_TEST_EMAIL_PREFIX || "loadtest";
const emailDomain = process.env.LOAD_TEST_EMAIL_DOMAIN || "example.test";
const dryRun = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL gerekli. Temizlik doğrudan PostgreSQL üzerinde çalışır.");
  process.exit(1);
}

const emailLike = runId
  ? `${emailPrefix}+%${runId}%@${emailDomain}`
  : `${emailPrefix}+%@${emailDomain}`;
const textLike = runId ? `%${runId}%` : `%load test%`;

const statements = [
  {
    label: "sessions",
    sql: `
      DELETE FROM sessions
      WHERE sess::text ILIKE $1
         OR sid IN (
           SELECT sid FROM sessions WHERE sess::text ILIKE $2
         )
    `,
    params: [textLike, emailLike],
  },
  {
    label: "compat_records",
    sql: `
      DELETE FROM compat_records
      WHERE data::text ILIKE $1
         OR user_id IN (SELECT id FROM local_users WHERE email ILIKE $2)
    `,
    params: [textLike, emailLike],
  },
  {
    label: "saved_profiles",
    sql: `
      DELETE FROM saved_profiles
      WHERE user_id IN (SELECT id FROM local_users WHERE email ILIKE $1)
    `,
    params: [emailLike],
  },
  {
    label: "activity_logs",
    sql: `
      DELETE FROM activity_logs
      WHERE metadata::text ILIKE $1
         OR user_id IN (SELECT id FROM local_users WHERE email ILIKE $2)
    `,
    params: [textLike, emailLike],
  },
  {
    label: "support_requests",
    sql: `
      DELETE FROM support_requests
      WHERE message ILIKE $1
         OR user_id IN (SELECT id FROM local_users WHERE email ILIKE $2)
    `,
    params: [textLike, emailLike],
  },
  {
    label: "showcase_posts",
    sql: `
      DELETE FROM showcase_posts
      WHERE title ILIKE $1
         OR created_by_user_id IN (SELECT id FROM local_users WHERE email ILIKE $2)
    `,
    params: [textLike, emailLike],
  },
  {
    label: "local_users",
    sql: "DELETE FROM local_users WHERE email ILIKE $1",
    params: [emailLike],
  },
  {
    label: "institutions",
    sql: `
      DELETE FROM institutions
      WHERE institution_code ILIKE $1
         OR notes ILIKE $2
    `,
    params: [runId ? `%${runId}%` : "LT-%", textLike],
  },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const results = [];

  try {
    await client.query("BEGIN");
    for (const item of statements) {
      const result = await client.query(item.sql, item.params);
      results.push({ table: item.label, affected: result.rowCount ?? 0 });
    }
    if (dryRun) {
      await client.query("ROLLBACK");
    } else {
      await client.query("COMMIT");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }

  const uploadDir = path.join(root, "uploads", "davet", "showcase");
  let removedFiles = 0;
  if (!dryRun && fs.existsSync(uploadDir)) {
    for (const name of fs.readdirSync(uploadDir)) {
      if (name.includes("load-test") || (runId && name.includes(runId))) {
        fs.rmSync(path.join(uploadDir, name), { force: true });
        removedFiles += 1;
      }
    }
  }

  console.log(JSON.stringify({
    ok: true,
    dryRun,
    runId: runId || null,
    emailLike,
    results,
    removedFiles,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
