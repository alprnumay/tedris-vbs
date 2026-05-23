-- Admin raporları: kurum envanteri ve kullanıcı bağlantısı
-- Çalıştırma: psql $DATABASE_URL -f lib/db/migrations/0001_admin_institutions.sql
-- veya: pnpm --filter @workspace/db push

CREATE TABLE IF NOT EXISTS institutions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name varchar NOT NULL,
  institution_code varchar NOT NULL UNIQUE,
  district_name varchar NOT NULL,
  province varchar,
  expected_user_count integer,
  status varchar NOT NULL DEFAULT 'aktif',
  notes varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_settings (
  key varchar PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar,
  institution_id varchar,
  institution_code varchar,
  province varchar,
  district varchar,
  action varchar NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE local_users ADD COLUMN IF NOT EXISTS institution_id varchar;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS institution_id varchar;
