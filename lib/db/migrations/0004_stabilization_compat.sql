-- Stabilizasyon: destek, profil ve poster taslak uyumluluk tabloları
CREATE TABLE IF NOT EXISTS support_requests (
  id serial PRIMARY KEY,
  user_id varchar,
  user_email text,
  user_name text,
  message text NOT NULL,
  image_base64 text,
  status text NOT NULL DEFAULT 'yeni',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_requests_created_at_idx ON support_requests (created_at DESC);

CREATE TABLE IF NOT EXISTS saved_profiles (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  isim varchar NOT NULL DEFAULT '',
  kurum_adi varchar NOT NULL DEFAULT '',
  rol varchar NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_profiles_user_id_idx ON saved_profiles (user_id);

CREATE TABLE IF NOT EXISTS compat_records (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type varchar NOT NULL,
  user_id varchar,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compat_records_type_user_idx ON compat_records (record_type, user_id);
