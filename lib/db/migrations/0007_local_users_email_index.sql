-- Email ile login lookup hızlandırma (unique zaten var; açık index dokümantasyonu)
-- psql $DATABASE_URL -f lib/db/migrations/0007_local_users_email_index.sql

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_users_email ON local_users (email);
