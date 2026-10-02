-- ====================================================
-- JRE-2027 Supabase Database Schema
-- Run this script in your Supabase SQL Editor
-- ====================================================

-- 1. Table: registrations (ข้อมูลการสมัครและจัดสรรกลุ่ม/ห้องพัก)
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    user_email TEXT,
    user_avatar TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob TEXT NOT NULL,
    age_years INTEGER DEFAULT 0,
    age_months INTEGER DEFAULT 0,
    age_days INTEGER DEFAULT 0,
    blood_group TEXT NOT NULL,
    phone TEXT NOT NULL,
    institution TEXT DEFAULT 'มมส',
    emergency_name TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    group_assigned TEXT DEFAULT '',
    room_assigned TEXT DEFAULT '',
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: announcements (ระบบประกาศข่าวสาร คำสั่ง ค่าสมัคร เข้ากลุ่ม)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'general', 'urgent', 'payment', 'line_group', 'order'
    action_url TEXT,
    action_label TEXT,
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table: project_settings (การตั้งค่า Google Form แบบทดสอบ ก่อน-หลัง และแบบประเมิน)
CREATE TABLE IF NOT EXISTS public.project_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ค่าเริ่มต้นสำหรับการตั้งค่าแบบทดสอบและประเมิน
INSERT INTO public.project_settings (key, value)
VALUES 
  ('forms_config', '{
    "pretest": {
      "url": "https://forms.google.com",
      "enabled": false,
      "title": "แบบทดสอบก่อนการฝึกอบรม (Pre-Test)"
    },
    "posttest": {
      "url": "https://forms.google.com",
      "enabled": false,
      "title": "แบบทดสอบหลังการฝึกอบรม (Post-Test)"
    },
    "evaluation": {
      "url": "https://forms.google.com",
      "enabled": false,
      "title": "แบบประเมินความพึงพอใจโครงการ (Evaluation)"
    }
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read for announcements and settings
CREATE POLICY "Allow public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow all actions for announcements with anon/admin" ON public.announcements FOR ALL USING (true);

CREATE POLICY "Allow public read settings" ON public.project_settings FOR SELECT USING (true);
CREATE POLICY "Allow all actions for settings with anon/admin" ON public.project_settings FOR ALL USING (true);

-- Allow public select/insert/update for registrations
CREATE POLICY "Allow all registrations" ON public.registrations FOR ALL USING (true);
