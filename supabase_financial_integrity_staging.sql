-- JRE 2027 - staging-only financial and applicant integrity hardening
-- Target: developer... Project (staging) only.
-- This migration does not run against the production Supabase project.
-- It blocks client-side/Burp tampering of payment and admin-controlled fields
-- while keeping owner access to ordinary applicant fields under RLS.

BEGIN;

CREATE OR REPLACE FUNCTION public.jre_protect_registration_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  is_admin boolean := COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
  old_row jsonb;
  new_row jsonb;
  patch jsonb;
  field_name text;
  protected_fields text[] := ARRAY[
    'payment_status', 'payment_amount', 'payment_bank_info', 'payment_notes',
    'installment_1_status', 'installment_2_status',
    'installment_1_amount', 'installment_2_amount',
    'admin_messages', 'requested_docs', 'group_assigned', 'room_assigned', 'status'
  ];
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Applicants may submit a slip, but cannot self-approve or set an amount.
    patch := jsonb_build_object(
      'payment_status', 'unpaid'::text,
      'payment_amount', NULL::numeric,
      'payment_bank_info', NULL::text,
      'payment_notes', NULL::text,
      'installment_1_status', 'unpaid'::text,
      'installment_2_status', 'unpaid'::text,
      'installment_1_amount', NULL::numeric,
      'installment_2_amount', NULL::numeric,
      'admin_messages', '[]'::jsonb,
      'requested_docs', '[]'::jsonb,
      'group_assigned', ''::text,
      'room_assigned', ''::text,
      'status', 'confirmed'::text
    );
    NEW := jsonb_populate_record(NEW, patch);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_row := to_jsonb(OLD);
    new_row := to_jsonb(NEW);
    FOREACH field_name IN ARRAY protected_fields LOOP
      IF new_row ? field_name AND old_row ? field_name
         AND (new_row -> field_name) IS DISTINCT FROM (old_row -> field_name) THEN
        new_row := jsonb_set(new_row, ARRAY[field_name], old_row -> field_name, true);
      END IF;
    END LOOP;
    NEW := jsonb_populate_record(NEW, new_row);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.registrations') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS jre_protect_registration_integrity ON public.registrations;
    CREATE TRIGGER jre_protect_registration_integrity
      BEFORE INSERT OR UPDATE ON public.registrations
      FOR EACH ROW
      EXECUTE FUNCTION public.jre_protect_registration_integrity();
  END IF;
END;
$$;

COMMIT;

-- Verification (staging only):
-- 1) inspect pg_trigger/pg_proc for jre_protect_registration_integrity;
-- 2) as anon, GET/PATCH registrations must return 401/403 or zero rows;
-- 3) as an authenticated owner, changing payment_status/payment_amount must
--    leave those fields unchanged; admin JWT may change them.
