import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const url = readFileSync(resolve(root, "artifacts/api-server/.env"), "utf8").match(/^DATABASE_URL=(.+)$/m)[1].trim();
const pool = new pg.Pool({ connectionString: url });

const { rows: tables } = await pool.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`,
);
console.log("LOCAL_TABLES", tables.map((t) => t.table_name).join(", "));

const { rows: userCols } = await pool.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY 1`,
);
console.log("LOCAL_users_columns", userCols.map((c) => c.column_name).join(", "));

const { rows: lu } = await pool.query(
  `SELECT id, email, role, is_admin, name FROM local_users
   WHERE lower(email) IN ('alprn0604@gmail.com', 'burdurbaglarbasi@gmail.com')`,
);
console.log("LOCAL_local_users", JSON.stringify(lu, null, 2));

await pool.end();
