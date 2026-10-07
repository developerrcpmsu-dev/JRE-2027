-- JRE 2027 - staging-only RLS hardening
-- Target: the Supabase project named "developer... Project" (staging)
-- This file intentionally does not target the JRE-2027 production project.
-- It changes policies only; it does not delete rows.
-- Run after reviewing the live policy inventory and verify with anon/authenticated tests.

BEGIN;

-- These are the tables that actually exist in the staging project.
ALTER TABLE IF EXISTS public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

-- Remove the permissive policies created by the original JRE schema.
DROP POLICY IF EXISTS "Allow all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Owner Read" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Applicant Insert" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Owner Update" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Owner Delete" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Admin Delete" ON public.registrations;

DROP POLICY IF EXISTS "Allow public read settings" ON public.project_settings;
DROP POLICY IF EXISTS "Allow all actions for settings with anon/admin" ON public.project_settings;
DROP POLICY IF EXISTS "Project Settings Public Read" ON public.project_settings;
DROP POLICY IF EXISTS "Project Settings Admin Write" ON public.project_settings;

DROP POLICY IF EXISTS "Allow public read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow all actions for announcements with anon/admin" ON public.announcements;
DROP POLICY IF EXISTS "Announcements Public Read" ON public.announcements;
DROP POLICY IF EXISTS "Announcements Admin Manage" ON public.announcements;

-- Re-running this migration is safe for the policy names introduced below.
DROP POLICY IF EXISTS "jre_staging_registrations_owner_select" ON public.registrations;
DROP POLICY IF EXISTS "jre_staging_registrations_owner_insert" ON public.registrations;
DROP POLICY IF EXISTS "jre_staging_registrations_owner_update" ON public.registrations;
DROP POLICY IF EXISTS "jre_staging_registrations_owner_delete" ON public.registrations;
DROP POLICY IF EXISTS "jre_staging_project_settings_public_select" ON public.project_settings;
DROP POLICY IF EXISTS "jre_staging_project_settings_admin_write" ON public.project_settings;
DROP POLICY IF EXISTS "jre_staging_announcements_public_select" ON public.announcements;
DROP POLICY IF EXISTS "jre_staging_announcements_admin_write" ON public.announcements;

-- Registrations: authenticated owner/email or admin claim only.
CREATE POLICY "jre_staging_registrations_owner_select"
  ON public.registrations FOR SELECT TO authenticated
  USING (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "jre_staging_registrations_owner_insert"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "jre_staging_registrations_owner_update"
  ON public.registrations FOR UPDATE TO authenticated
  USING (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "jre_staging_registrations_owner_delete"
  ON public.registrations FOR DELETE TO authenticated
  USING (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only the known public form configuration remains readable anonymously.
CREATE POLICY "jre_staging_project_settings_public_select"
  ON public.project_settings FOR SELECT TO anon, authenticated
  USING (key IN ('forms_config'));

CREATE POLICY "jre_staging_project_settings_admin_write"
  ON public.project_settings FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Announcements are public content; only admins may mutate them.
CREATE POLICY "jre_staging_announcements_public_select"
  ON public.announcements FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "jre_staging_announcements_admin_write"
  ON public.announcements FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMIT;

-- Verification (run after COMMIT):
-- SELECT tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public'
--   AND tablename IN ('registrations', 'project_settings', 'announcements')
-- ORDER BY tablename, policyname;
-- As anon, registrations must return 401/403 or zero rows; project_settings
-- must expose only forms_config; announcements must remain readable.
