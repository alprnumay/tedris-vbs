/**
 * Salt okunur VPS/Neon admin rol teşhisi — SELECT only.
 * node scripts/vps-admin-role-diagnose.mjs
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadDatabaseUrl() {
  const paths = [
    resolve("artifacts/api-server/.env"),
    resolve(".env"),
    process.env.DATABASE_URL,
  ].filter(Boolean);
  for (const p of paths) {
    if (typeof p === "string" && p.startsWith("postgres")) return p;
    if (!existsSync(p)) continue;
    const line = readFileSync(p, "utf8").match(/^DATABASE_URL=(.+)$/m);
    if (line) return line[1].trim().replace(/^["']|["']$/g, "");
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error("DATABASE_URL bulunamadı");
}

const pool = new pg.Pool({ connectionString: loadDatabaseUrl() });

async function section(label, sql, params = []) {
  console.log(`\n=== ${label} ===`);
  try {
    const { rows } = await pool.query(sql, params);
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

  const tables = await section(
    "1_candidate_tables",
    `SELECT DISTINCT table_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND column_name IN ('email', 'role')
     ORDER BY table_name`,
  );

  for (const { table_name: table } of tables) {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    const names = cols.rows.map((r) => r.column_name);
    if (!names.includes("email") || !names.includes("role")) continue;
    const hasId = names.includes("id");
    if (!hasId) continue;
    await section(
      `2_alprn_in_${table}`,
      `SELECT * FROM ${table}
       WHERE id = 16 AND lower(email) = 'alprn0604@gmail.com'
       LIMIT 3`,
    );
  }

  await section(
    "3_records_1163",
    `SELECT id, project_id, user_id, record_type,
            left(data::text, 120) AS data_preview
     FROM records
     WHERE id = 1163`,
  );

  await section(
    "4_burdur_auth_users",
    `SELECT id, project_id, email, role, is_admin, name
     FROM users
     WHERE lower(email) = 'burdurbaglarbasi@gmail.com'`,
  );
} finally {
  await pool.end();
}
