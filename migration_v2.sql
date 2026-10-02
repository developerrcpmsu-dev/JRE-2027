-- Migration V2: Add special care, health, and announcement media attachments
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS special_notes TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_special_care BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS medical_history TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS food_allergy TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS previous_training TEXT DEFAULT '';

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT '';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS pdf_name TEXT DEFAULT '';
