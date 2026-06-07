-- VPS backend_platform uyumu: local_users + oturum tablosu
-- psql $DATABASE_URL -f lib/db/migrations/0003_local_users_vps_align.sql

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

ALTER TABLE local_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE local_users ADD COLUMN IF NOT EXISTS province varchar;
ALTER TABLE local_users ADD COLUMN IF NOT EXISTS district_name varchar;
ALTER TABLE local_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE local_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE local_users ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'hoca';
ALTER TABLE local_users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
