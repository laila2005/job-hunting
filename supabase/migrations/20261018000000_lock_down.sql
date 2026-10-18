-- LOCK DOWN: only Laila's own account can read or change anything.
-- Run this ONCE in the Supabase SQL editor, AFTER you have (1) created your user under Authentication > Users
-- and (2) turned OFF "Allow new users to sign up" under Authentication > Providers > Email.
--
-- Before this, anyone holding the public (anon) key that ships inside the website could read, change or delete
-- every row, including the chat table that the local daemon listens to. After this, the anon key can do nothing.
-- Your local scripts then need the service_role key (kept in local .env files only, never in git).

DO $$
DECLARE
  t record;
  me text := 'laila.mohamed.fikry@gmail.com';  -- the only account allowed in
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "owner only" ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY "owner only" ON public.%I FOR ALL TO authenticated USING ((auth.jwt() ->> %L) = %L) WITH CHECK ((auth.jwt() ->> %L) = %L)',
      t.tablename, 'email', me, 'email', me);
  END LOOP;
END $$;

-- Remove every other policy on public tables (for example old "allow anon" ones), keeping only "owner only".
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
           WHERE schemaname = 'public' AND policyname <> 'owner only' LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- The anon role gets no table privileges at all.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- Private storage bucket for your tailored CVs and cover letters (PDF only, 3 MB max).
-- Files are opened through short-lived signed links after you sign in; there is no public link.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kit', 'kit', false, 3145728, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 3145728, allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "kit owner read" ON storage.objects;
CREATE POLICY "kit owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kit' AND (auth.jwt() ->> 'email') = 'laila.mohamed.fikry@gmail.com');
