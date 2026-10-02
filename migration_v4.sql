-- Migration V4: User Accounts, Auto-Confirm, and Profile Sync
-- 1. Auto-confirm any user signing up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auto_confirm_user();

-- Update any existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Table: user_accounts (Real User Account Profiles in PostgreSQL)
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT DEFAULT '',
    role TEXT DEFAULT 'applicant',
    provider TEXT DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and public access policies
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view user_accounts" ON public.user_accounts;
CREATE POLICY "Public can view user_accounts" ON public.user_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert user_accounts" ON public.user_accounts;
CREATE POLICY "Public can insert user_accounts" ON public.user_accounts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update user_accounts" ON public.user_accounts;
CREATE POLICY "Public can update user_accounts" ON public.user_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete user_accounts" ON public.user_accounts;
CREATE POLICY "Public can delete user_accounts" ON public.user_accounts FOR DELETE USING (true);
