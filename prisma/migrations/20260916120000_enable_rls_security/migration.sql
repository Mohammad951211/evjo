-- Security hardening: enable Row-Level Security on every public table and strip
-- the standing full-access grants held by the Supabase Data API roles.
--
-- WHY THIS SHAPE (important):
--   This app reaches Postgres ONLY through Prisma, connecting as the `postgres`
--   role, which has the BYPASSRLS attribute. Enabling RLS therefore does NOT
--   affect the application at all.
--   The app does NOT use Supabase Auth or the auto-generated Data API (no
--   @supabase/supabase-js, no anon key, no auth.uid()). All per-user / admin
--   authorization is enforced in the Next.js API layer (currentUserId /
--   currentAdminId). So no auth.uid()-based policies are added here — with RLS
--   enabled and no policies, the `anon` and `authenticated` roles (the Data API)
--   are denied entirely, which is the correct least-privilege state for them.
--
--   The real exposure being closed: with RLS off, anyone holding the project's
--   (public) anon key could read/write every table via https://<ref>.supabase.co
--   /rest/v1/... — including User.passwordHash and PII. This migration removes
--   that path two ways: (1) RLS enabled, (2) grants revoked from those roles.

-- 1) Enable RLS on all public tables (clears Supabase "rls_disabled_in_public").
ALTER TABLE public."User"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserVehicle"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Vehicle"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Station"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StationReport"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Favorite"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChargingSession"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OtpCode"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PasswordResetRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations"   ENABLE ROW LEVEL SECURITY;

-- 2) Defense in depth: revoke the Data API roles' privileges so they have no
--    access even independently of RLS, and stop future tables from re-granting.
--    Guarded so this migration also runs on non-Supabase envs (local dev), where
--    the `anon` / `authenticated` roles do not exist.
DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I', role_name);
      EXECUTE format('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I', role_name);
      EXECUTE format('REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM %I', role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
