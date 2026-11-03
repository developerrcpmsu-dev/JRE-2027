-- JRE 2027 group chat for registered participants.
-- Apply through the Supabase SQL Editor before deploying the chat UI.

BEGIN;

CREATE OR REPLACE FUNCTION public.jre_chat_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'developer.rcpmsu@gmail.com'
      OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.jre_chat_is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
  SELECT public.jre_chat_is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.registrations r
        WHERE r.user_id = auth.uid()::text
           OR lower(coalesce(r.user_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      );
$$;

REVOKE ALL ON FUNCTION public.jre_chat_is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.jre_chat_is_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.jre_chat_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jre_chat_is_member() TO authenticated;

CREATE OR REPLACE FUNCTION public.jre_chat_member_display_name()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
DECLARE
  display_name text;
BEGIN
  SELECT coalesce(
    nullif(btrim(concat_ws(' ', r.first_name, r.last_name)), ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''),
    'สมาชิก JRE'
  )
  INTO display_name
  FROM public.registrations r
  WHERE r.user_id = auth.uid()::text
     OR lower(coalesce(r.user_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ORDER BY (r.user_id = auth.uid()::text) DESC
  LIMIT 1;

  RETURN coalesce(
    display_name,
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''),
    'สมาชิก JRE'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.jre_chat_member_display_name() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.jre_chat_member_display_name() TO authenticated;

CREATE TABLE IF NOT EXISTS public.group_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 120),
  author_avatar text,
  message_text text NOT NULL DEFAULT '' CHECK (char_length(message_text) <= 4000),
  image_path text,
  reply_to_id uuid REFERENCES public.group_chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT group_chat_message_has_content CHECK (
    char_length(btrim(message_text)) > 0 OR image_path IS NOT NULL OR deleted_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS group_chat_messages_created_at_idx
  ON public.group_chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS group_chat_messages_author_idx
  ON public.group_chat_messages (author_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS group_chat_messages_reply_idx
  ON public.group_chat_messages (reply_to_id);

CREATE TABLE IF NOT EXISTS public.group_chat_read_receipts (
  message_id uuid NOT NULL REFERENCES public.group_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reader_name text NOT NULL CHECK (char_length(reader_name) BETWEEN 1 AND 120),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_chat_read_receipts_user_idx
  ON public.group_chat_read_receipts (user_id, read_at DESC);

CREATE OR REPLACE FUNCTION public.jre_chat_normalize_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
BEGIN
  IF NEW.author_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'ผู้ส่งข้อความต้องตรงกับบัญชีที่เข้าสู่ระบบ';
  END IF;
  NEW.author_name := public.jre_chat_member_display_name();
  NEW.author_avatar := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'avatar_url', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'picture', '')
  );
  NEW.created_at := now();
  NEW.edited_at := NULL;
  NEW.deleted_at := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.jre_chat_normalize_read_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
BEGIN
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'อ่านแทนบัญชีอื่นไม่ได้';
  END IF;
  NEW.reader_name := public.jre_chat_member_display_name();
  NEW.read_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS group_chat_message_insert_normalize ON public.group_chat_messages;
CREATE TRIGGER group_chat_message_insert_normalize
  BEFORE INSERT ON public.group_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.jre_chat_normalize_new_message();

DROP TRIGGER IF EXISTS group_chat_receipt_normalize ON public.group_chat_read_receipts;
CREATE TRIGGER group_chat_receipt_normalize
  BEFORE INSERT OR UPDATE ON public.group_chat_read_receipts
  FOR EACH ROW EXECUTE FUNCTION public.jre_chat_normalize_read_receipt();

CREATE OR REPLACE FUNCTION public.jre_chat_guard_message_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
BEGIN
  IF public.jre_chat_is_admin() THEN
    RETURN NEW;
  END IF;
  IF OLD.author_user_id <> auth.uid()
     OR NEW.author_user_id <> OLD.author_user_id
     OR NEW.author_name <> OLD.author_name
     OR NEW.author_avatar IS DISTINCT FROM OLD.author_avatar
     OR NEW.created_at <> OLD.created_at
     OR NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id
     OR OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'ผู้ใช้แก้ไขได้เฉพาะข้อความของตนเอง';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS group_chat_message_update_guard ON public.group_chat_messages;
CREATE TRIGGER group_chat_message_update_guard
  BEFORE UPDATE ON public.group_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.jre_chat_guard_message_update();

ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_read_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.group_chat_messages, public.group_chat_read_receipts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_chat_messages, public.group_chat_read_receipts TO authenticated;

DROP POLICY IF EXISTS "group_chat_messages_member_read" ON public.group_chat_messages;
CREATE POLICY "group_chat_messages_member_read"
  ON public.group_chat_messages FOR SELECT TO authenticated
  USING (public.jre_chat_is_member());

DROP POLICY IF EXISTS "group_chat_messages_member_insert" ON public.group_chat_messages;
CREATE POLICY "group_chat_messages_member_insert"
  ON public.group_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.jre_chat_is_member()
    AND author_user_id = auth.uid()
    AND deleted_at IS NULL
    AND edited_at IS NULL
  );

DROP POLICY IF EXISTS "group_chat_messages_author_admin_update" ON public.group_chat_messages;
CREATE POLICY "group_chat_messages_author_admin_update"
  ON public.group_chat_messages FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid() OR public.jre_chat_is_admin())
  WITH CHECK (public.jre_chat_is_member());

DROP POLICY IF EXISTS "group_chat_messages_author_admin_delete" ON public.group_chat_messages;
CREATE POLICY "group_chat_messages_author_admin_delete"
  ON public.group_chat_messages FOR DELETE TO authenticated
  USING (author_user_id = auth.uid() OR public.jre_chat_is_admin());

DROP POLICY IF EXISTS "group_chat_receipts_member_read" ON public.group_chat_read_receipts;
CREATE POLICY "group_chat_receipts_member_read"
  ON public.group_chat_read_receipts FOR SELECT TO authenticated
  USING (public.jre_chat_is_member());

DROP POLICY IF EXISTS "group_chat_receipts_self_insert" ON public.group_chat_read_receipts;
CREATE POLICY "group_chat_receipts_self_insert"
  ON public.group_chat_read_receipts FOR INSERT TO authenticated
  WITH CHECK (public.jre_chat_is_member() AND user_id = auth.uid());

DROP POLICY IF EXISTS "group_chat_receipts_self_admin_update" ON public.group_chat_read_receipts;
CREATE POLICY "group_chat_receipts_self_admin_update"
  ON public.group_chat_read_receipts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.jre_chat_is_admin())
  WITH CHECK (public.jre_chat_is_member());

DROP POLICY IF EXISTS "group_chat_receipts_self_admin_delete" ON public.group_chat_read_receipts;
CREATE POLICY "group_chat_receipts_self_admin_delete"
  ON public.group_chat_read_receipts FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.jre_chat_is_admin());

-- Private chat media. A path starts with the uploader's authenticated UID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('jre-group-chat', 'jre-group-chat', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

DROP POLICY IF EXISTS "jre_chat_media_member_read" ON storage.objects;
CREATE POLICY "jre_chat_media_member_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'jre-group-chat' AND public.jre_chat_is_member());

DROP POLICY IF EXISTS "jre_chat_media_member_upload" ON storage.objects;
CREATE POLICY "jre_chat_media_member_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'jre-group-chat'
    AND public.jre_chat_is_member()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "jre_chat_media_owner_admin_update" ON storage.objects;
CREATE POLICY "jre_chat_media_owner_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'jre-group-chat'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.jre_chat_is_admin())
  )
  WITH CHECK (
    bucket_id = 'jre-group-chat'
    AND public.jre_chat_is_member()
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.jre_chat_is_admin())
  );

DROP POLICY IF EXISTS "jre_chat_media_owner_admin_delete" ON storage.objects;
CREATE POLICY "jre_chat_media_owner_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'jre-group-chat'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.jre_chat_is_admin())
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_chat_read_receipts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_read_receipts;
  END IF;
END $$;

COMMIT;
