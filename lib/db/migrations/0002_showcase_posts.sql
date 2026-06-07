-- Nehari davet: faydalı çalışma paylaşımı
-- psql $DATABASE_URL -f lib/db/migrations/0002_showcase_posts.sql

CREATE TABLE IF NOT EXISTS showcase_posts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id varchar REFERENCES institutions(id) ON DELETE SET NULL,
  institution_name text NOT NULL,
  district_name text,
  category text NOT NULL,
  title text NOT NULL,
  image_url text,
  purpose text,
  student_activity text,
  target_gain text,
  teacher_method text,
  how_to_apply text,
  result_note text,
  generated_text text,
  tags jsonb,
  teacher_name text,
  status text NOT NULL DEFAULT 'pending',
  revision_note text,
  created_by_user_id varchar,
  approved_by_user_id varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE INDEX IF NOT EXISTS showcase_posts_status_idx ON showcase_posts (status);
CREATE INDEX IF NOT EXISTS showcase_posts_created_at_idx ON showcase_posts (created_at DESC);
