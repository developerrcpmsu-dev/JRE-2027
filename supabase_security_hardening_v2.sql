-- JRE 2027 - RLS hardening v2 (review and run in staging first)
--
-- This migration removes the public USING (true) policies created by the
-- original schema/migrations. It does not delete rows. Before applying it to
-- production, migrate password login to Supabase Auth (or a server endpoint)
-- because the current browser-only user_accounts JSON flow cannot safely read
-- credentials after the public policy is removed.
--
-- Run as a database owner in Supabase SQL Editor, then verify pg_policies and
-- repeat the REST tests as anon/authenticated/admin. Do not paste secrets in
-- the SQL editor or in the audit report.

BEGIN;

-- 1) Enable RLS on tables that contain participant, account, or order data.
ALTER TABLE IF EXISTS public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.merchandise_orders ENABLE ROW LEVEL SECURITY;

-- 2) Remove policy names from the original schema and previous hardening file.
DROP POLICY IF EXISTS "Allow all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow all for registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public access registrations" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Owner Read" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Applicant Insert" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Owner Update" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Owner Delete" ON public.registrations;
DROP POLICY IF EXISTS "Registrations Admin Delete" ON public.registrations;

DROP POLICY IF EXISTS "Public can view user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Public can insert user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Public can update user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Public can delete user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Allow all user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "User Accounts Owner Access" ON public.user_accounts;

DROP POLICY IF EXISTS "Allow public read settings" ON public.project_settings;
DROP POLICY IF EXISTS "Allow all actions for settings with anon/admin" ON public.project_settings;
DROP POLICY IF EXISTS "Public project_settings" ON public.project_settings;
DROP POLICY IF EXISTS "Project Settings Public Read" ON public.project_settings;
DROP POLICY IF EXISTS "Project Settings Admin Write" ON public.project_settings;

DROP POLICY IF EXISTS "Allow public read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow all actions for announcements with anon/admin" ON public.announcements;
DROP POLICY IF EXISTS "Announcements Public Read" ON public.announcements;
DROP POLICY IF EXISTS "Announcements Admin Manage" ON public.announcements;

DROP POLICY IF EXISTS "Public full access to merchandise_orders" ON public.merchandise_orders;

-- 3) registrations: only the owner (email/UUID claim) or an admin claim may
-- read/update a row. New applicants must be authenticated before insert.
CREATE POLICY "registrations_owner_select"
  ON public.registrations FOR SELECT TO authenticated
  USING (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "registrations_owner_insert"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "registrations_owner_update"
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

CREATE POLICY "registrations_owner_delete"
  ON public.registrations FOR DELETE TO authenticated
  USING (
    auth.uid()::text = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(user_email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4) The legacy public.user_accounts table has no reason to be public. It is
-- retained for migration compatibility, but credentials must be managed by
-- Supabase Auth/server code and never by an anon browser query.
CREATE POLICY "user_accounts_owner_select"
  ON public.user_accounts FOR SELECT TO authenticated
  USING (
    auth.uid()::text = id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "user_accounts_owner_insert"
  ON public.user_accounts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "user_accounts_owner_update"
  ON public.user_accounts FOR UPDATE TO authenticated
  USING (
    auth.uid()::text = id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid()::text = id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(email, ''))
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "user_accounts_admin_delete"
  ON public.user_accounts FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 5) Only an allow-list of genuinely public configuration keys is readable
-- through the anon client. This deliberately excludes user_accounts,
-- merchandise_orders, file_* keys, and any future key by default.
CREATE POLICY "project_settings_public_allowlist"
  ON public.project_settings FOR SELECT TO anon, authenticated
  USING (key IN (
    'forms_config',
    'payment_config',
    'merchandise_config',
    'team_members',
    'speakers_config'
  ));

CREATE POLICY "project_settings_admin_write"
  ON public.project_settings FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 6) Announcements are public content; only an admin claim may mutate them.
CREATE POLICY "announcements_public_select"
  ON public.announcements FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "announcements_admin_write"
  ON public.announcements FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 7) If the dedicated merchandise_orders table exists, protect it by owner
-- or admin. The app must migrate away from the legacy JSON key first.
DO $$
BEGIN
  IF to_regclass('public.merchandise_orders') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "merchandise_orders_owner_select" ON public.merchandise_orders';
    EXECUTE 'DROP POLICY IF EXISTS "merchandise_orders_owner_insert" ON public.merchandise_orders';
    EXECUTE 'DROP POLICY IF EXISTS "merchandise_orders_owner_update" ON public.merchandise_orders';
    EXECUTE 'DROP POLICY IF EXISTS "merchandise_orders_admin_delete" ON public.merchandise_orders';
    EXECUTE $sql$
      CREATE POLICY "merchandise_orders_owner_select"
        ON public.merchandise_orders FOR SELECT TO authenticated
        USING (
          auth.uid()::text = user_id
          OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(customer_email, ''))
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    $sql$;
    EXECUTE $sql$
      CREATE POLICY "merchandise_orders_owner_insert"
        ON public.merchandise_orders FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid()::text = user_id
          OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(customer_email, ''))
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    $sql$;
    EXECUTE $sql$
      CREATE POLICY "merchandise_orders_owner_update"
        ON public.merchandise_orders FOR UPDATE TO authenticated
        USING (
          auth.uid()::text = user_id
          OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(customer_email, ''))
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
        WITH CHECK (
          auth.uid()::text = user_id
          OR lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(customer_email, ''))
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    $sql$;
    EXECUTE $sql$
      CREATE POLICY "merchandise_orders_admin_delete"
        ON public.merchandise_orders FOR DELETE TO authenticated
        USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    $sql$;
  END IF;
END $$;

COMMIT;

-- Verification queries (run after COMMIT):
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- GET project_settings?key=eq.user_accounts as anon must return 0 rows/403.
-- GET registrations as anon must return 401/403 (or 0 rows), never participant PII.
