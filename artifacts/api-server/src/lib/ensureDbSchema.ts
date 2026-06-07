import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

/**
 * Drizzle şeması ile gerçek PostgreSQL tablosunu uyumlu hale getirir.
 * Mevcut veriyi silmez; eksik tablo/kolonları idempotent ekler.
 */
export async function ensureDbSchema(): Promise<void> {
  try {
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
      ALTER TABLE local_users
      ADD COLUMN IF NOT EXISTS institution_id varchar
    `);

    await db.execute(sql`
      ALTER TABLE local_users
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz
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

    logger.info("Veritabanı şema kontrolü tamamlandı (institutions, activity_logs, showcase_posts)");
  } catch (err) {
    logger.error({ err }, "Veritabanı şema senkronizasyonu başarısız — admin raporları çalışmayabilir");
  }
}
