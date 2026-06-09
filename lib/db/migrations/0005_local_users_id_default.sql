-- local_users.id için UUID varsayılanı (VPS / eski şema uyumu)
-- psql $DATABASE_URL -f lib/db/migrations/0005_local_users_id_default.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE local_users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
