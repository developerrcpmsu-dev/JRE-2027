-- ==============================================================================
-- JRE 2027 - COMPREHENSIVE SUPABASE DATABASE SECURITY HARDENING SCRIPT
-- ==============================================================================
-- นโยบาย Row-Level Security (RLS) และ Database Constraints เพื่อยกระดับความปลอดภัย
-- คุ้มครองข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) มาตรา 26
-- ==============================================================================

-- 1. เปิดใช้งาน Row Level Security (RLS) บนทุกตารางอย่างเคร่งครัด
ALTER TABLE IF EXISTS registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS merchandise_orders ENABLE ROW LEVEL SECURITY;

-- 2. ลบนโยบายเดิมที่เปิดสิทธิ์สาธารณะเกินความจำเป็น (Revoke Overly Permissive Policies)
DROP POLICY IF EXISTS "Allow all for registrations" ON registrations;
DROP POLICY IF EXISTS "Public access registrations" ON registrations;
DROP POLICY IF EXISTS "Allow all user_accounts" ON user_accounts;
DROP POLICY IF EXISTS "Public project_settings" ON project_settings;

-- ==============================================================================
-- 3. ตาราง registrations: คุ้มครองข้อมูลส่วนบุคคลและข้อมูลสุขภาพ
-- ==============================================================================
-- ผู้ใช้ทั่วไป (Authenticated/Owner): อ่านและแก้ไขได้เฉพาะข้อมูลของตนเองเท่านั้น
CREATE POLICY "Registrations Owner Read"
  ON registrations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = user_email
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- อนุญาตให้ลงทะเบียนใหม่ (INSERT) ได้
CREATE POLICY "Registrations Applicant Insert"
  ON registrations
  FOR INSERT
  WITH CHECK (true);

-- อนุญาตให้อัปเดตได้เฉพาะแถวของตนเอง
CREATE POLICY "Registrations Owner Update"
  ON registrations
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = user_email
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' = user_email
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบข้อมูลผู้สมัครได้
CREATE POLICY "Registrations Admin Delete"
  ON registrations
  FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ==============================================================================
-- 4. ตาราง user_accounts: ป้องกันการรั่วไหลของรหัสผ่าน
-- ==============================================================================
-- บัญชีผู้ใช้: อ่านและแก้ไขได้เฉพาะตนเอง ไม่อนุญาตให้บุคคลภายนอก SELECT บัญชีคนอื่น
CREATE POLICY "User Accounts Owner Access"
  ON user_accounts
  FOR ALL
  USING (
    auth.uid()::text = id 
    OR auth.jwt() ->> 'email' = email
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ==============================================================================
-- 5. ตาราง project_settings: ป้องกันการดัดแปลงเลขบัญชีรับเงิน
-- ==============================================================================
-- ทุกคนสามารถอ่านการตั้งค่าทั่วไปและเลขบัญชีได้ (SELECT)
CREATE POLICY "Project Settings Public Read"
  ON project_settings
  FOR SELECT
  USING (true);

-- เฉพาะ Admin เท่านั้นที่สามารถแก้ไขหรือลบการตั้งค่าโครงการได้ (UPDATE / INSERT / DELETE)
CREATE POLICY "Project Settings Admin Write"
  ON project_settings
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ==============================================================================
-- 6. ตาราง announcements: ประชาสัมพันธ์โครงการ
-- ==============================================================================
-- ข่าวสารที่เผยแพร่แล้ว (is_published = true) ให้ทุกคนอ่านได้
CREATE POLICY "Announcements Public Read"
  ON announcements
  FOR SELECT
  USING (is_published = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- เฉพาะ Admin เท่านั้นที่สามารถสร้าง/แก้ไข/ลบข่าวสารได้
CREATE POLICY "Announcements Admin Manage"
  ON announcements
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ==============================================================================
-- 7. Trigger ป้องกันผู้ใช้ทั่วไปแก้ไขสถานะการเงิน (Prevent Payment Status Tampering)
-- ==============================================================================
CREATE OR REPLACE FUNCTION protect_payment_status_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- ถ้าไม่ใช่ Admin และพยายามแก้ไขฟิลด์ payment_status หรือ payment_amount
  IF ((auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin') THEN
    IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR OLD.payment_amount IS DISTINCT FROM NEW.payment_amount) THEN
      RAISE EXCEPTION 'ไม่อนุญาตให้แก้ไขสถานะการเงินด้วยตนเอง กรุณาติดต่อผู้ดูแลระบบ';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_payment_status ON registrations;
CREATE TRIGGER trg_protect_payment_status
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION protect_payment_status_modification();
