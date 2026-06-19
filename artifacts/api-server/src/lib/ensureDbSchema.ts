import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";
import { findLocalUserForLogin } from "./localUserLookup";

/** ADMIN_EMAIL + ADMIN_BOOTSTRAP_PASSWORD ile eksik admin hesabını oluşturur (şifreyi güncellemez). */
async function ensureAdminBootstrapUser(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    ""
  ).trim();
  if (!email || !password) return;

  const existing = await findLocalUserForLogin(email).catch(() => null);
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  const name = (process.env.ADMIN_NAME || "Yönetici").trim() || "Yönetici";

  await db.execute(sql`
    INSERT INTO local_users (email, password_hash, name, role, is_admin, is_active)
    VALUES (${email}, ${passwordHash}, ${name}, 'admin', true, true)
    ON CONFLICT (email) DO NOTHING
  `);

  logger.info({ email }, "Admin bootstrap kullanıcısı oluşturuldu (local_users)");
}

/**
 * Drizzle şeması ile gerçek PostgreSQL tablosunu uyumlu hale getirir.
 * Mevcut veriyi silmez; eksik tablo/kolonları idempotent ekler.
 */
export async function ensureDbSchema(): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await db.execute(sql`
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
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_settings (
        key varchar PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
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
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamptz NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS local_users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar UNIQUE NOT NULL,
        password_hash varchar NOT NULL,
        name varchar NOT NULL,
        is_admin boolean NOT NULL DEFAULT false,
        province varchar,
        district_name varchar,
        institution_id varchar,
        institution_name varchar,
        institution_code varchar,
        role varchar NOT NULL DEFAULT 'hoca',
        is_active boolean NOT NULL DEFAULT true,
        deleted_at timestamptz,
        last_login_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS institution_id varchar
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS deleted_at timestamptz
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS province varchar
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS district_name varchar
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'hoca'
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS report_scope_type TEXT NOT NULL DEFAULT 'own'
    `);

    await db.execute(sql`
      ALTER TABLE local_users ADD COLUMN IF NOT EXISTS report_scope_mintikas JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    await db.execute(sql`
      UPDATE local_users
      SET report_scope_type = 'all'
      WHERE report_scope_type = 'own'
        AND (
          is_admin = true
          OR lower(coalesce(role, '')) IN ('admin', 'super_admin', 'yonetici')
        )
    `);

    await db.execute(sql`
      ALTER TABLE local_users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text
    `);

    /* Eski drizzle push ile oluşmuş district sütununu district_name'e taşı */
    await db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'local_users' AND column_name = 'district'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'local_users' AND column_name = 'district_name'
        ) THEN
          UPDATE local_users
          SET district_name = district
          WHERE district_name IS NULL AND district IS NOT NULL;
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'local_users' AND column_name = 'district'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'local_users' AND column_name = 'district_name'
        ) THEN
          ALTER TABLE local_users RENAME COLUMN district TO district_name;
        END IF;
      END $$
    `);

    await db.execute(sql`
      ALTER TABLE activity_logs
      ADD COLUMN IF NOT EXISTS institution_id varchar
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE local_users
          ADD CONSTRAINT local_users_institution_id_fk
          FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE activity_logs
          ADD CONSTRAINT activity_logs_institution_id_fk
          FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS showcase_posts (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id varchar,
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
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS showcase_posts_status_idx ON showcase_posts (status)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS showcase_posts_created_at_idx ON showcase_posts (created_at DESC)
    `);

    await db.execute(sql`
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
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS support_requests_created_at_idx ON support_requests (created_at DESC)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS saved_profiles (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
        isim varchar NOT NULL DEFAULT '',
        kurum_adi varchar NOT NULL DEFAULT '',
        rol varchar NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS saved_profiles_user_id_idx ON saved_profiles (user_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS compat_records (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        record_type varchar NOT NULL,
        user_id varchar,
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS compat_records_type_user_idx ON compat_records (record_type, user_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
        endpoint text NOT NULL UNIQUE,
        subscription jsonb NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS push_subscriptions_user_active_idx
        ON push_subscriptions (user_id, is_active)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_notification_settings (
        user_id varchar PRIMARY KEY REFERENCES local_users(id) ON DELETE CASCADE,
        daily_reminder_enabled boolean NOT NULL DEFAULT true,
        daily_reminder_time varchar NOT NULL DEFAULT '17:00',
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_notification_log (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        notification_type varchar NOT NULL,
        date_key varchar NOT NULL,
        sent_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, notification_type, date_key)
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS push_notification_log_date_idx
        ON push_notification_log (date_key, notification_type)
    `);

    await db.execute(sql`
      ALTER TABLE push_notification_log
        ADD COLUMN IF NOT EXISTS payload jsonb
    `);

    await ensureAdminBootstrapUser();

    logger.info("Veritabanı şema kontrolü tamamlandı (institutions, activity_logs, showcase_posts, support_requests, compat_records)");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Veritabanı şema senkronizasyonu başarısız — admin raporları çalışmayabilir");
    return { ok: false, error: message };
  }
}
