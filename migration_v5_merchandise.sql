-- ==============================================================================
-- JRE 2027: Merchandise Orders & Store Database Schema (Optional)
-- Run this in your Supabase SQL Editor if you prefer a dedicated table.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.merchandise_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending', -- pending, paid_verified, rejected
    payment_slip_url TEXT,
    payment_slip_name TEXT,
    payment_submitted_at TIMESTAMPTZ,
    slip_admin_notes TEXT,
    pickup_status TEXT DEFAULT 'pending', -- pending, ready, received
    pickup_at TIMESTAMPTZ,
    pickup_by_admin TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.merchandise_orders ENABLE ROW LEVEL SECURITY;

-- Allow public access
DROP POLICY IF EXISTS "Public full access to merchandise_orders" ON public.merchandise_orders;
CREATE POLICY "Public full access to merchandise_orders"
ON public.merchandise_orders
FOR ALL
TO public
USING (true)
WITH CHECK (true);
