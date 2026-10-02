-- Migration V3: Payment, Slip Verification, Document Requests, and Admin Messages
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 350;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_bank_info TEXT DEFAULT 'ธนาคารกรุงไทย เลขที่ 984-0-XXXXX-X ชื่อบัญชี ชมรมกู้ภัยราชพฤกษ์ มมส';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_slip_url TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_slip_date TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_notes TEXT DEFAULT '';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS admin_messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS requested_docs JSONB DEFAULT '[]'::jsonb;
