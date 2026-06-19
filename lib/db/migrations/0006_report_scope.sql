-- Rapor yetki kapsamı — geriye uyumlu alanlar
ALTER TABLE local_users
ADD COLUMN IF NOT EXISTS report_scope_type TEXT NOT NULL DEFAULT 'own';

ALTER TABLE local_users
ADD COLUMN IF NOT EXISTS report_scope_mintikas JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Mevcut genel yöneticileri bozma
UPDATE local_users
SET report_scope_type = 'all'
WHERE report_scope_type = 'own'
  AND (
    is_admin = true
    OR lower(coalesce(role, '')) IN ('admin', 'super_admin', 'yonetici')
  );
