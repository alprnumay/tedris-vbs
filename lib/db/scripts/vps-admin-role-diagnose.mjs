/**
 * Salt okunur admin rol teşhisi — SELECT only.
 * pnpm --filter @workspace/db exec node scripts/vps-admin-role-diagnose.mjs
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = resolve(root, "artifacts/api-server/.env");
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.+)$/m);
    if (line) return line[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("DATABASE_URL bulunamadı");
}

const pool = new pg.Pool({ connectionString: loadDatabaseUrl() });

async function section(label, sql) {
  console.log(`\n=== ${label} ===`);
  try {
    const { rows } = await pool.query(sql);
    console.log(JSON.stringify(rows, null, 2));
    return rows;
  } catch (err) {
    console.log(JSON.stringify({ error: err.message }, null, 2));
    return [];
  }
}

try {
  await section(
    "1_role_email_columns",
    `SELECT table_name, column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND (
         column_name ILIKE '%role%'
         OR column_name ILIKE '%email%'
         OR column_name IN ('project_id', 'is_admin', 'last_login_at', 'user_id')
       )
     ORDER BY table_name, ordinal_position`,
  );

  await section(
    "1_tables_with_email_and_role",
    `SELECT DISTINCT table_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND column_name IN ('email', 'role')
     ORDER BY 1`,
  );

  await section(
    "2_alprn_users_id16",
    `SELECT id, project_id, email, role, is_admin, name, created_at, last_login_at
     FROM users
     WHERE id = 16 AND lower(email) = 'alprn0604@gmail.com'`,
  );

  await section(
    "3_records_1163",
    `SELECT id, project_id, user_id, record_type,
            (data->>'email') AS data_email,
            (data->>'institutionCode') AS institution_code,
            (data->>'authUserId') AS auth_user_id
     FROM records
     WHERE id = 1163`,
  );

  await section(
    "4_burdur_users",
    `SELECT id, project_id, email, role, is_admin, name
     FROM users
     WHERE lower(email) = 'burdurbaglarbasi@gmail.com'`,
  );
} finally {
  await pool.end();
}
