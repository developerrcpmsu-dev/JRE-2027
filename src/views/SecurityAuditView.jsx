import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Printer,
  ArrowLeft,
  Server,
  Database,
  UserCheck,
  Eye,
  Code2,
  Terminal,
  Layers,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Shield,
  HelpCircle,
  FileCode,
  AlertCircle
} from 'lucide-react';

export default function SecurityAuditView({ onNavigateHome, onNavigateAdmin }) {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const reportUrl = typeof window !== 'undefined' ? window.location.href : 'https://jre-2027.vercel.app/security-audit';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(reportUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const vulnerabilities = [
    {
      id: 1,
      severity: 'critical',
      severityLabel: 'วิกฤต (Critical)',
      title: 'รหัสผ่าน Admin ฝังอยู่ในไฟล์ JavaScript ของ Production Bundle',
      category: 'CWE-798: Use of Hard-coded Credentials / Secret Exposure',
      evidence: 'src/components/AdminLoginModal.jsx บรรทัด 27-33 (ใช้ import.meta.env.VITE_ADMIN_USERNAME และ VITE_ADMIN_PASSWORD)',
      description: 'ตัวแปรที่นำหน้าด้วย "VITE_" จะถูก Vite คอมไพล์และนำค่าจริงฝังลงในไฟล์ bundle (.js) ส่งไปยังเบราว์เซอร์ของผู้ใช้ทุกคนโดยอัตโนมัติ ทำให้ใครก็ตามที่เปิดเว็บสามารถค้นพบรหัสผ่านจริงได้ทันทีผ่าน Browser DevTools',
      attackVector: '1. เปิดเว็บเบราว์เซอร์\n2. กด F12 เข้า Developer Tools > แท็บ Sources หรือ Console\n3. ค้นหาคำว่า "ADMIN" หรือ inspect โค้ดของโมดูลเข้าสู่ระบบ\n4. ได้ username และ password ผู้ดูแลระบบที่เป็น plaintext ไปล็อกอินหน้า Admin เต็มรูปแบบ',
      remediation: '1. เปลี่ยนรหัสผ่าน Admin ทันที (ถือว่ารหัสชุดปัจจุบันรั่วไหลแล้ว)\n2. ลบตัวแปร VITE_ADMIN_USERNAME และ VITE_ADMIN_PASSWORD ออกจาก .env และ Vercel Environment Variables\n3. ย้ายกระบวนการตรวจสอบสิทธิ์ Admin ไปทำบน Serverless Function หรือ Supabase Auth และกำหนด role: "admin" ผ่าน JWT Claim (ห้ามเปรียบเทียบรหัสผ่านในเบราว์เซอร์)',
      status: 'ต้องแก้ไขด่วนที่สุด'
    },
    {
      id: 2,
      severity: 'critical',
      severityLabel: 'วิกฤต (Critical)',
      title: 'การ Bypass สิทธิ์ Admin และปลอมแปลงบัญชีผู้ใช้ผ่าน localStorage โดยไม่มี Server Verification',
      category: 'CWE-285: Improper Authorization / Client-Side Authorization Bypass',
      evidence: 'src/App.jsx บรรทัด 187-202 (อ่าน jre2027_is_admin และ jre2027_auth_user จาก localStorage แล้ว set ให้เป็น Admin ทันที)',
      description: 'แอปพลิเคชันตัดสินว่าผู้ใช้เป็น Admin หรือไม่ โดยอ่านค่าจาก localStorage ฝั่ง client เท่านั้น ไม่มีการตรวจสอบ JWT Token ที่ลงลายมือชื่อจากเซิร์ฟเวอร์',
      attackVector: '1. เปิดเว็บ jre-2027.vercel.app\n2. เปิด Console แล้วรันคำสั่ง: localStorage.setItem("jre2027_is_admin", "true")\n3. รีเฟรชหน้าเว็บ -> เมนูและหน้าจอ "ระบบ Admin" จะแสดงขึ้นมาทันทีโดยไม่ต้องใส่รหัสผ่านใดๆ\n4. ในทำนองเดียวกัน สามารถเปลี่ยนอีเมลใน jre2027_auth_user เพื่อสวมรอยเป็นผู้สมัครคนอื่นและดู/แก้ข้อมูลของเขาได้',
      remediation: '1. ห้ามใช้ค่าใน localStorage หรือ React State ฝั่ง Client ในการอนุมัติสิทธิ์เข้าถึงฟังก์ชันสำคัญ\n2. ตรวจสอบสิทธิ์ผ่าน Supabase Auth Session (JWT) ทุกครั้ง โดยให้เซิร์ฟเวอร์ตรวจสอบ role ของผู้ใช้\n3. เมนูและข้อมูล Admin ต้องดึงผ่าน API ฝั่งเซิร์ฟเวอร์ที่ตรวจสิทธิ์ก่อนส่งข้อมูลกลับมาเท่านั้น',
      status: 'ต้องแก้ไขด่วนที่สุด'
    },
    {
      id: 3,
      severity: 'critical',
      severityLabel: 'วิกฤต (Critical)',
      title: 'ฐานข้อมูล Supabase เปิดสิทธิ์สาธารณะให้อ่าน/เขียน/ลบได้ทุกตาราง (RLS USING true)',
      category: 'CWE-284: Improper Access Control / Overly Permissive Row-Level Security',
      evidence: 'supabase_schema.sql บรรทัด 76-83 และ migration_v4.sql บรรทัด 37-47 (นโยบาย RLS ตั้งเป็น FOR ALL USING (true) หรือ FOR SELECT/UPDATE/DELETE WITH CHECK (true))',
      description: 'นโยบาย Row Level Security (RLS) ของตาราง registrations, user_accounts, announcements, project_settings อนุญาตให้สิทธิ์ anon key (ซึ่งเปิดเผยอยู่ในเว็บ) สามารถ SELECT, INSERT, UPDATE, DELETE ได้อย่างอิสระโดยไม่ต้องมี Auth',
      attackVector: '1. คัดลอก Supabase URL และ anon key จากหน้าเว็บ\n2. ใช้ Postman หรือ curl ยิง REST API ตรงไปยัง Supabase:\n   - GET /rest/v1/registrations -> ดึงข้อมูลผู้สมัครทุกคน (ชื่อ, เบอร์, เลขบัตร, โรคประจำตัว, ประวัติแพ้ยา)\n   - PATCH /rest/v1/project_settings -> เปลี่ยนเลขที่บัญชีรับโอนเงินของโครงการให้เป็นบัญชีของตนเอง ทำให้ผู้สมัครโอนเงินเข้าบัญชีมิจฉาชีพ\n   - PATCH /rest/v1/registrations -> แก้ payment_status ของตนเองเป็น "paid" โดยไม่ต้องชำระเงินจริง\n   - DELETE /rest/v1/registrations -> ลบข้อมูลผู้สมัครทุกคนออกจากฐานข้อมูล',
      remediation: '1. ปรับปรุงนโยบาย RLS ใหม่ทั้งหมด:\n   - registrations: ผู้ใช้ทั่วไป SELECT และ UPDATE ได้เฉพาะแถวของตนเอง: USING (auth.uid() = user_id)\n   - user_accounts: ยกเลิกการให้สาธารณะ SELECT คอลัมน์ password_hash/salt\n   - project_settings: อนุญาตให้อ่านเฉพาะการตั้งค่าทั่วไป ส่วนการแก้ไขต้องเป็น Admin เท่านั้น\n2. การอนุมัติการเงินหรือการแก้ไขข้อมูลส่วนรวม ให้ทำผ่าน Server-Side Function ที่ใช้ service_role key',
      status: 'ต้องแก้ไขด่วนที่สุด'
    },
    {
      id: 4,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'การจัดเก็บและ Hash รหัสผ่านผู้ใช้ในระดับ Client-Side ด้วย SHA-256 ความทนทานต่ำ',
      category: 'CWE-916: Use of Password Hash With Insufficient Computational Effort',
      evidence: 'src/supabase.js บรรทัด 1252-1296 (hashPassword คำนวณ SHA-256 + salt 16 ไบต์ในเบราว์เซอร์ แล้วบันทึกลง user_accounts)',
      description: 'อัลกอริทึม SHA-256 ถูกออกแบบมาเพื่อความเร็ว ไม่ใช่สำหรับ Password Hashing การคำนวณในเบราว์เซอร์ทำให้แฮกเกอร์สามารถ Brute-force ได้หลายพันล้านครั้งต่อวินาทีด้วย GPU ประกอบกับตาราง user_accounts เปิดให้อ่านได้สาธารณะ (ข้อ 3)',
      attackVector: '1. ดึงข้อมูลจากตาราง user_accounts ได้ฟิลด์ password_hash และ salt ทั้งหมด\n2. ใช้เครื่องมือเจาะรหัสผ่าน (เช่น Hashcat) ถอดรหัสผ่านของผู้ใช้ได้ในเวลาสั้นๆ โดยเฉพาะรหัสผ่านที่สั้นหรือใช้คำศัพท์ทั่วไป\n3. นอกจากนี้ เนื่องจากสิทธิ์ UPDATE เปิดสาธารณะ แฮกเกอร์สามารถส่ง PATCH เปลี่ยน password_hash ของเหยื่อเป็น hash ที่ตนเองทราบ แล้วเข้าควบคุมบัญชีได้ทันที',
      remediation: '1. เลิกใช้ระบบ Password Hashing ที่เขียนเองในเบราว์เซอร์\n2. เปลี่ยนมาใช้ระบบ Supabase Auth มาตรฐาน (supabase.auth.signUp / signInWithPassword) ซึ่งใช้ bcrypt / argon2 ฝั่งเซิร์ฟเวอร์อย่างปลอดภัย\n3. ลบคอลัมน์ password_hash และ salt ออกจากตาราง user_accounts',
      status: 'แนะนำปรับปรุง'
    },
    {
      id: 5,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'Google OAuth ไม่มีการตรวจสอบ Cryptographic Signature บน Server ฝั่งหลังบ้าน',
      category: 'CWE-347: Improper Verification of Cryptographic Signature',
      evidence: 'src/App.jsx บรรทัด 135-160 และ src/utils/googleAuth.js (ทำการ decodeJwtResponse อ่าน JSON payload จาก id_token ตรงๆ ในเบราว์เซอร์)',
      description: 'ระบบอ่านข้อมูลโปรไฟล์จาก id_token ใน Client โดยไม่ได้ส่ง Token ไปตรวจสอบลายเซ็นดิจิทัล (Signature Verification) กับ Google Auth Server หลังบ้าน',
      attackVector: 'ผู้ไม่ประสงค์ดีสามารถสร้าง JWT ปลอมที่มีโครงสร้างถูกต้อง แต่ลงลายมือชื่อเองหรือไม่มีลายมือชื่อ พร้อมใส่อีเมลของบุคคลอื่น แล้วส่งเข้ามาทาง URL Hash Callback เพื่อเข้าสู่ระบบในนามบุคคลนั้นได้',
      remediation: 'ใช้ supabase.auth.signInWithOAuth({ provider: "google" }) ซึ่งเซิร์ฟเวอร์ Supabase จะทำกระบวนการแลก Code และตรวจสอบ Signature กับ Google OAuth โดยตรงอย่างปลอดภัย',
      status: 'แนะนำปรับปรุง'
    },
    {
      id: 6,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'แอปพลิเคชันดาวน์โหลดข้อมูลผู้สมัคร "ทั้งหมด" มาเก็บในหน่วยความจำของเบราว์เซอร์ทุกคน',
      category: 'CWE-359: Exposure of Private Personal Information to an Unauthorized Actor',
      evidence: 'src/App.jsx บรรทัด 115-125 (เรียก DataService.getRegistrations() ทันทีที่เปิดหน้าแรก เพื่อนำมาจับคู่ myRegistration)',
      description: 'เมื่อใครก็ตามเปิดเว็บไซต์ หน้าแรกจะส่งคำขอไปดึงข้อมูลผู้สมัครทั้งหมดในโครงการมาเก็บไว้ใน React State และแคชลง localStorage ถึงแม้ผู้ใช้คนนั้นจะยังไม่ได้เข้าสู่ระบบก็ตาม',
      attackVector: 'ผู้ใช้ทั่วไปหรือผู้ไม่หวังดีเพียงเปิดเบราว์เซอร์ Inspect > Network หรือดูตัวแปร State ใน React DevTools ก็จะเห็นรายชื่อ, เบอร์โทรศัพท์, ข้อมูลส่วนบุคคล และประวัติสุขภาพของผู้สมัครทุกคนในโครงการ',
      remediation: '1. หน้าของผู้สมัครทั่วไป ให้ query เฉพาะแถวของตนเอง: .eq("user_id", currentUserId)\n2. การดึงข้อมูลผู้สมัครทั้งหมด ให้ทำเฉพาะเมื่อ Admin ที่ยืนยันตัวตนแล้วเข้าสู่แท็บ /admin เท่านั้น\n3. ลบการแคชข้อมูลผู้สมัครทั้งหมดใน localStorage ของเครื่องผู้ใช้',
      status: 'ต้องแก้ไขด่วน'
    },
    {
      id: 7,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'ช่องโหว่ Stored Cross-Site Scripting (XSS) ผ่านทาง API ให้บริการไฟล์ (/api/file)',
      category: 'CWE-79: Improper Neutralization of Input During Web Page Generation (Stored XSS)',
      evidence: 'api/file.js บรรทัด 38-48 (อ่าน data:mime;base64 จาก project_settings แล้วส่ง Content-Type ตามค่าที่กำหนดใน payload โดยไม่มี Whitelist)',
      description: 'Endpoint ให้บริการไฟล์ /api/file?id=... ใช้ Content-Type ตามที่ระบุในสตริง Base64 โดยไม่มีการจำกัด MIME Type และไม่มีการส่ง Header X-Content-Type-Options: nosniff หรือ Content-Security-Policy',
      attackVector: '1. แฮกเกอร์ใช้สิทธิ์ตามข้อ 3 บันทึกแถวลง project_settings โดยระบุ key เป็น file_xss และ payload เป็น data:text/html;base64,<สคริปต์อันตราย>\n2. ส่งลิงก์ https://jre-2027.vercel.app/api/file?id=xss ให้เหยื่อหรือ Admin เปิด\n3. เบราว์เซอร์จะรัน JavaScript ภายใต้ Context โดเมนของ jre-2027.vercel.app ทำให้สามารถขโมย Session หรือส่งคำสั่งแทน Admin ได้',
      remediation: '1. ตรวจสอบ Whitelist ของ MIME Type ใน api/file.js อนุญาตเฉพาะ: image/jpeg, image/png, image/webp, application/pdf\n2. กำหนด Header: Content-Disposition: inline หรือ attachment และส่ง X-Content-Type-Options: nosniff\n3. เพิ่ม Content-Security-Policy: sandbox ในการตอบกลับไฟล์อัปโหลด\n4. ในระยะยาว ให้ย้ายการเก็บไฟล์ไปยัง Supabase Storage Bucket ซึ่งแยกโดเมนและมีการควบคุมความปลอดภัยที่ดีกว่า',
      status: 'ต้องแก้ไขด่วน'
    },
    {
      id: 8,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'เอกสารสำคัญและรูปบัตรประชาชนเข้าถึงได้แบบสาธารณะ พร้อมการแคช Public แบบถาวร',
      category: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
      evidence: 'api/file.js บรรทัด 45 (Cache-Control: public, max-age=31536000, immutable) และ src/supabase.js (ไอดีไฟล์สุ่มเพียง 6 ตัวอักษร)',
      description: 'รูปบัตรประชาชนและหลักฐานการโอนเงินถูกแคชไว้บน Vercel Edge CDN แบบ Public นาน 1 ปีเต็ม และไอดีไฟล์สร้างจาก Timestamp + สุ่ม 6 ตัวอักษร ซึ่งสามารถคาดเดาหรือ Brute-force ได้',
      attackVector: 'รูปถ่ายบัตรประชาชนและเอกสารยืนยันตัวตนที่ถูกอัปโหลดจะค้างอยู่ใน Proxy/CDN Cache และสามารถเข้าถึงได้โดยไม่ต้องมีการยืนยันตัวตน เสี่ยงต่อการนำข้อมูลบัตรประชาชนไปสวมสิทธิ์หรือก่ออาชญากรรมทางการเงิน',
      remediation: '1. ตั้งค่า Cache-Control: private, no-cache, no-store สำหรับเอกสารระบุตัวตน\n2. จัดเก็บรูปบัตรประชาชนและเอกสารสำคัญใน Private Storage Bucket และเข้าถึงผ่าน Signed URL ที่มีอายุสั้น (เช่น 10-15 นาที) เท่านั้น',
      status: 'ต้องแก้ไขด่วน'
    },
    {
      id: 9,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ตรรกะการตรวจสอบสถานะการเงินทำในเบราว์เซอร์ ไม่มี Server-Side Enforcement',
      category: 'CWE-602: Client-Side Enforcement of Server-Side Security',
      evidence: 'src/supabase.js ฟังก์ชัน updateRegistrationDetails และ RegisterView.jsx (ส่งฟิลด์ payment_status, payment_amount ได้โดยตรง)',
      description: 'ไม่มีการแยกแยะฟิลด์ที่ผู้สมัครสามารถแก้ไขได้ กับฟิลด์ที่ต้องสงวนไว้สำหรับผู้ดูแลระบบหรือฝ่ายการเงินเท่านั้น ผู้สมัครสามารถส่งข้อมูลอัปเดต payment_status: "paid" ของตนเองได้โดยตรงผ่าน API',
      attackVector: 'ผู้สมัครที่รู้ขั้นตอนทางเทคนิคสามารถส่งคำขอแก้ไขสถานะการเงินของตนเองให้เป็น "ชำระเงินเรียบร้อยแล้ว" โดยไม่ต้องแนบสลิปหรือผ่านการตรวจสอบจาก Admin',
      remediation: 'สร้าง PostgreSQL Database Trigger หรือ Supabase RPC Function เพื่อจำกัดสิทธิ์:\n- ผู้ใช้ทั่วไปสามารถแก้ไขได้เฉพาะข้อมูลโปรไฟล์ส่วนตัว และฟิลด์ admin_messages[].read\n- ฟิลด์ payment_status, payment_amount, group_assigned, room_assigned ต้องแก้ไขได้เฉพาะผู้ใช้ที่มี role เป็น admin เท่านั้น',
      status: 'แนะนำปรับปรุง'
    },
    {
      id: 10,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ขาดแคลน Security Response Headers บน Web Deployment',
      category: 'CWE-693: Protection Mechanism Failure / Missing Security Headers',
      evidence: 'vercel.json (มีเฉพาะ rewrite rules ไม่มี headers config) และการตรวจสอบ Live HTTP Response Headers',
      description: 'เว็บขาด Headers สำคัญในการป้องกันการโจมตีระดับเบราว์เซอร์ เช่น Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, และ Permissions-Policy',
      attackVector: '1. Clickjacking: ผู้ไม่ประสงค์ดีสามารถนำเว็บไปใส่ใน <iframe> ซ้อนทับบนเว็บปลอมเพื่อหลอกให้ Admin กดปุ่มอนุมัติ\n2. MIME Sniffing: เบราว์เซอร์อาจตีความไฟล์ที่ดาวน์โหลดผิดพลาดและสั่งรันโค้ด\n3. Referrer Leaks: ข้อมูล URL อาจรั่วไหลไปยังบุคคลที่สามเมื่อกดลิงก์ภายนอก',
      remediation: 'เพิ่มการตั้งค่า headers ใน vercel.json:\n- X-Frame-Options: DENY\n- X-Content-Type-Options: nosniff\n- Referrer-Policy: strict-origin-when-cross-origin\n- Permissions-Policy: camera=(self), microphone=(), geolocation=()\n- กำหนด Content-Security-Policy (CSP) เริ่มจาก Report-Only ก่อนบังคับใช้จริง',
      status: 'แนะนำปรับปรุง'
    },
    {
      id: 11,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ไม่มีกลไก Rate Limiting และ CAPTCHA ป้องกันการส่งข้อมูลอัตโนมัติ',
      category: 'CWE-307: Improper Restriction of Excessive Authentication / Request Attempts',
      evidence: 'src/views/RegisterView.jsx และ src/components/GoogleLoginModal.jsx (ไม่มี rate limiting หรือ bot protection)',
      description: 'ระบบรับสมัคร ฟอร์มล็อกอิน และฟังก์ชันอัปโหลดไฟล์ไม่มีการจำกัดความถี่ในการส่งคำขอ (Rate Limit) และไม่มี CAPTCHA ป้องกัน Bot',
      attackVector: 'ผู้ไม่ประสงค์ดีสามารถเขียนบอทส่งใบสมัครปลอมจำนวนมาก (Spam Registration DoS), สุ่มเดารหัสผ่านในระบบล็อกอิน หรืออัปโหลดไฟล์ขนาดใหญ่ซ้ำๆ เพื่อทำให้โควตาฐานข้อมูลเต็มและเกิดค่าใช้จ่ายส่วนเกิน',
      remediation: '1. ติดตั้ง Cloudflare Turnstile หรือ hCaptcha บนฟอร์มลงทะเบียนและหน้าล็อกอิน\n2. เปิดใช้งาน Rate Limiting บน Supabase Auth และ Vercel API Endpoints\n3. จำกัดขนาดไฟล์อัปโหลดฝั่งเซิร์ฟเวอร์ (เช่น ไม่เกิน 5MB)',
      status: 'แนะนำปรับปรุง'
    },
    {
      id: 12,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ความเสี่ยงด้านการคุ้มครองข้อมูลส่วนบุคคลอ่อนไหวตาม พ.ร.บ. PDPA (ข้อมูลสุขภาพและโรคประจำตัว)',
      category: 'Legal & Regulatory Compliance: Thailand PDPA Section 26 (Sensitive Personal Data)',
      evidence: 'ตาราง registrations เก็บ medical_history, food_allergy, blood_group, id_card_photo ร่วมกับข้อมูลทั่วไป',
      description: 'ข้อมูลโรคประจำตัวและประวัติการแพ้ยาจัดเป็น "ข้อมูลส่วนบุคคลที่มีความอ่อนไหว" (Sensitive Personal Data) ตามมาตรา 26 แห่ง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ซึ่งกำหนดให้ต้องมีมาตรการรักษาความมั่นคงปลอดภัยขั้นสูง',
      attackVector: 'หากเกิดเหตุการณ์ข้อมูลรั่วไหลจากช่องโหว่ RLS (ข้อ 3) องค์กรผู้ควบคุมข้อมูลอาจมีความรับผิดทางกฎหมายและมีหน้าที่ต้องแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ภายใน 72 ชั่วโมง',
      remediation: '1. จัดทำนโยบายและมาตรการการเข้าถึงข้อมูลสุขภาพ โดยจำกัดเฉพาะทีมแพทย์/ฝ่ายปฐมพยาบาลที่มีหน้าที่เท่านั้น\n2. กำหนดระยะเวลาการจัดเก็บข้อมูล (Data Retention Policy) และลบข้อมูลสุขภาพทิ้งภายในระยะเวลาที่กำหนดหลังจบโครงการ\n3. ทำการเข้ารหัสข้อมูล (Encryption at Rest) และปิดกั้นสิทธิ์การอ่านแบบสาธารณะตามข้อ 3 ทันที',
      status: 'ข้อบังคับทางกฎหมาย'
    },
    {
      id: 13,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'Hardcoded Fallback Credentials ใน Serverless Endpoint api/file.js และ CORS Wildcard (*)',
      category: 'CWE-798 & CWE-942: Hard-coded Credentials / Overly Permissive CORS',
      evidence: 'api/file.js บรรทัด 3-5 (มี fallback string สำหรับ URL และ anon key) และบรรทัด 8 (Access-Control-Allow-Origin: *)',
      description: 'แม้ anon key จะถูกเปิดเผยในฝั่ง Client เป็นปกติ แต่ไม่ควร hardcode คีย์จริงไว้ในซอร์สโค้ดของ Serverless Function และการเปิด CORS เป็น * อนุญาตให้เว็บใดๆ ก็ตามส่งคำขอมาดึงไฟล์ได้',
      attackVector: 'เว็บไซต์บุคคลที่สามสามารถดึงไฟล์เอกสารของผู้สมัครไปแสดงบนเว็บไซต์อื่น หรือทำ Hotlinking ได้โดยอิสระ',
      remediation: '1. ลบ fallback key ออกจากโค้ด และอ่านค่าจาก Environment Variables เท่านั้น\n2. ปรับการตั้งค่า CORS ให้อนุญาตเฉพาะโดเมนของโครงการ เช่น https://jre-2027.vercel.app',
      status: 'ปรับปรุงความเรียบร้อย'
    },
    {
      id: 14,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'ความไม่สอดคล้องระหว่าง Schema ฐานข้อมูลจริง กับโค้ดของแอปพลิเคชัน (ตาราง merchandise_orders)',
      category: 'Database Inconsistency & Unhandled Error Fallback',
      evidence: 'Live API ตรวจพบตาราง merchandise_orders ตอบกลับ 404 (Not Found) ขณะที่โค้ดเรียกใช้งาน',
      description: 'ตาราง merchandise_orders ใน migration_v5 ยังไม่ได้ถูกสร้างบน Supabase จริง ทำให้โค้ด fallback ไปบันทึกลงใน localStorage ของเครื่องผู้ใช้แทน ส่งผลให้คำสั่งซื้อเสื้อไม่ถูกบันทึกขึ้นระบบส่วนกลาง',
      attackVector: 'เป็นข้อบกพร่องทางตรรกะที่ทำให้ข้อมูลคำสั่งซื้ออาจสูญหายเมื่อผู้ใช้เปลี่ยนเครื่องหรือล้างประวัติเบราว์เซอร์',
      remediation: 'รันคำสั่ง SQL จาก migration_v5_merchandise.sql บน Supabase Dashboard เพื่อสร้างตาราง merchandise_orders ให้ตรงตามการทำงานของระบบ',
      status: 'ต้องปรับปรุงโครงสร้าง'
    },
    {
      id: 15,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'ช่องโหว่ในไลบรารีภายนอก (npm audit: xlsx Prototype Pollution & ReDoS)',
      category: 'CWE-1321 & CWE-1333: Third-party Dependency Vulnerabilities (SheetJS / xlsx)',
      evidence: 'npm audit ตรวจพบช่องโหว่ High ในไลบรารี xlsx (GHSA-4r6h-8v6p-xvw6 และ GHSA-5pgg-2g8v-p4x9)',
      description: 'ไลบรารี SheetJS (xlsx) เวอร์ชันบน npm มีช่องโหว่ Prototype Pollution และ ReDoS เมื่อทำการอ่านหรือ Parse ไฟล์ Excel ที่ผู้ใช้อัปโหลด',
      attackVector: 'ความเสี่ยงจริงในแอปพลิเคชันนี้ต่ำมาก เนื่องจากระบบใช้ xlsx เฉพาะการ "ส่งออก" (Export) ไฟล์ Excel สำหรับ Admin เท่านั้น ไม่มีการเปิดรับไฟล์ Excel จากภายนอกเข้ามาอ่าน',
      remediation: '1. เปลี่ยนไปใช้ไลบรารี exceljs ซึ่งมีอยู่ใน package.json ของโปรเจกต์แล้ว ในการ Export ข้อมูลแทน\n2. หรืออัปเดต SheetJS เป็นเวอร์ชันล่าสุดจาก CDN ทางการของผู้พัฒนา',
      status: 'ความเสี่ยงต่ำ / เฝ้าระวัง'
    }
  ];

  const attackScenarios = [
    {
      rank: 1,
      title: 'เข้ายึดระบบ Admin Console ผ่าน localStorage',
      difficulty: 'ง่ายมาก (10 วินาที)',
      mechanism: 'แก้ไขค่า jre2027_is_admin ในเบราว์เซอร์ Console แล้วรีเฟรชหน้าเว็บ',
      impact: 'เข้าถึงเมนูจัดการผู้สมัคร, ข้อมูลการเงิน, และการตั้งค่าระบบได้ทันที',
      findingRef: 'ข้อ 2'
    },
    {
      rank: 2,
      title: 'ค้นหารหัสผ่าน Admin ตัวจริงจาก Source Bundle',
      difficulty: 'ง่ายมาก (ไม่ถึง 1 นาที)',
      mechanism: 'เปิด DevTools > ค้นหาคำว่า ADMIN ในไฟล์ JavaScript Production',
      impact: 'ได้ Username และ Password จริงไปล็อกอินผ่าน Modal อย่างเป็นทางการ',
      findingRef: 'ข้อ 1'
    },
    {
      rank: 3,
      title: 'ดึงข้อมูลส่วนบุคคลและข้อมูลสุขภาพของผู้สมัครทุกคน',
      difficulty: 'ง่าย',
      mechanism: 'เปิดดู Network Tab หรือยิง REST API ตรงไปยัง Supabase ด้วย anon key',
      impact: 'ข้อมูลชื่อ, เบอร์โทร, เลขบัตรประชาชน, โรคประจำตัว, ประวัติแพ้ยา รั่วไหลทั้งหมด (ละเมิด PDPA มาตรา 26)',
      findingRef: 'ข้อ 3, 6'
    },
    {
      rank: 4,
      title: 'แก้ไขเลขที่บัญชีรับเงินของโครงการเพื่อขโมยยอดโอน',
      difficulty: 'ปานกลาง',
      mechanism: 'ส่ง PATCH คำขอไปยังตาราง project_settings ผ่าน Supabase REST API',
      impact: 'ผู้สมัครที่เข้ามาลงทะเบียนจะเห็นเลขบัญชีของมิจฉาชีพและโอนเงินผิดบัญชี',
      findingRef: 'ข้อ 3, 9'
    },
    {
      rank: 5,
      title: 'ขโมยหรือเขียนทับรหัสผ่านของผู้ใช้ (Account Takeover)',
      difficulty: 'ปานกลาง',
      mechanism: 'ดึงค่า password_hash จากตาราง user_accounts ไปถอด หรือส่ง PATCH เขียนทับ hash ใหม่',
      impact: 'ยึดบัญชีผู้สมัคร และล่วงรู้รหัสผ่านที่ผู้ใช้อาจนำไปใช้ซ้ำกับบริการอื่น',
      findingRef: 'ข้อ 3, 4'
    },
    {
      rank: 6,
      title: 'รันสคริปต์อันตรายบนโดเมนระบบผ่าน /api/file (Stored XSS)',
      difficulty: 'ปานกลาง - ซับซ้อน',
      mechanism: 'บันทึก HTML/SVG Script ลง project_settings แล้วส่งลิงก์ให้ผู้ดูแลระบบเปิด',
      impact: 'สามารถสั่งงานเบราว์เซอร์ของผู้ดูแลระบบในบริบทของโดเมน jre-2027.vercel.app ได้อย่างสมบูรณ์',
      findingRef: 'ข้อ 7'
    }
  ];

  const goodPractices = [
    {
      title: 'ไม่มีการรั่วไหลของไฟล์ .env ใน Git History',
      desc: 'ตรวจสอบประวัติ commit ทั้งหมดแล้ว ไม่พบการนำไฟล์ .env หรือ .env.local ขึ้นไปยัง Git Repository'
    },
    {
      title: 'ไม่พบ Service Role Key บน Client-Side',
      desc: 'ใน Source Code ฝั่ง Client มีเพียง anon public key เท่านั้น ไม่พบคีย์ระดับ Master (service_role) รั่วไหล'
    },
    {
      title: 'ปลอดภัยจาก Basic Reflected XSS',
      desc: 'โค้ด React ส่วนใหญ่ไม่มีการใช้ dangerouslySetInnerHTML จึงมีการ Auto-escaping ข้อความที่แสดงผลเป็นค่าเริ่มต้น'
    },
    {
      title: 'การบังคับใช้โปรโตคอล HTTPS และ HSTS',
      desc: 'ระบบรันบน Vercel มีการบังคับใช้ HTTPS และส่ง Header Strict-Transport-Security อย่างถูกต้อง'
    }
  ];

  const filteredList = vulnerabilities.filter(v => {
    const matchesSeverity = filterSeverity === 'all' || v.severity === filterSeverity;
    const matchesSearch = searchQuery === '' || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.evidence.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* TOP NAVIGATION / ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </button>
          )}
          {onNavigateAdmin && (
            <button
              onClick={onNavigateAdmin}
              className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>ระบบ Admin</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={handleCopyUrl}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="คัดลอก URL หน้ารายงานนี้"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedUrl ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอก URL หน้านี้'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="พิมพ์รายงานหรือส่งออกเป็น PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>พิมพ์ / บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* HERO BANNER & EXECUTIVE SUMMARY */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40 border-2 border-red-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-black uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Cybersecurity & Vulnerability Audit Report</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              รายงานผลการตรวจสอบช่องโหว่และความมั่นคงปลอดภัยไซเบอร์
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              เป้าหมาย: <strong className="text-amber-400 font-mono">jre-2027.vercel.app</strong> (ระบบลงทะเบียนและบริหารโครงการฝึกอบรม JRE 2027) · ตรวจสอบซอร์สโค้ด, พฤติกรรมเซิร์ฟเวอร์จริง, นโยบายฐานข้อมูล RLS, ระบบยืนยันตัวตน และข้อกำหนดตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                วันเวลาตรวจสอบ: 7 ต.ค. 2569 (2026)
              </span>
              <span>•</span>
              <span className="text-rose-400 font-bold">
                ระดับความเสี่ยงโดยรวม: วิกฤต (Critical — ต้องปรับปรุงก่อนเปิดรับสมัครสาธารณะ)
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-red-500/30 rounded-2xl text-center shrink-0 w-full md:w-auto shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              ช่องโหว่ที่ตรวจพบทั้งหมด
            </span>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-300">
              15 รายการ
            </div>
            <span className="text-[11px] text-red-300 font-semibold block mt-1">
              พบช่องโหว่วิกฤต 3 รายการ
            </span>
          </div>
        </div>

        {/* METRICS SCORECARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-slate-800/80 mt-8">
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-600/50">
            <span className="text-[10px] font-black uppercase text-red-400 block">🔴 วิกฤต (Critical)</span>
            <span className="text-2xl font-black text-white mt-1 block">3 รายการ</span>
            <span className="text-[10px] text-slate-400">ข้อ 1, 2, 3</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40">
            <span className="text-[10px] font-black uppercase text-amber-400 block">🟠 สูง (High)</span>
            <span className="text-2xl font-black text-white mt-1 block">5 รายการ</span>
            <span className="text-[10px] text-slate-400">ข้อ 4, 5, 6, 7, 8</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-yellow-950/20 border border-yellow-600/30">
            <span className="text-[10px] font-black uppercase text-yellow-400 block">🟡 ปานกลาง (Medium)</span>
            <span className="text-2xl font-black text-white mt-1 block">4 รายการ</span>
            <span className="text-[10px] text-slate-400">ข้อ 9, 10, 11, 12</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-600/30">
            <span className="text-[10px] font-black uppercase text-blue-400 block">🔵 ต่ำ / ข้อสังเกต (Low)</span>
            <span className="text-2xl font-black text-white mt-1 block">3 รายการ</span>
            <span className="text-[10px] text-slate-400">ข้อ 13, 14, 15</span>
          </div>
        </div>
      </div>

      {/* REALISTIC ATTACK PATHWAYS TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              เส้นทางการโจมตีที่ผู้ไม่ประสงค์ดีจะใช้เจาะระบบ (เรียงลำดับจากง่ายที่สุด)
            </h2>
            <p className="text-xs text-slate-400">
              วิเคราะห์ขั้นตอนที่บุคคลภายนอกสามารถลงมือได้ทันทีหากระบบยังไม่ได้รับการแก้ไข
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold bg-slate-950/60">
                <th className="p-3 w-12 text-center">ลำดับ</th>
                <th className="p-3">รูปแบบการโจมตี</th>
                <th className="p-3">ระดับความยาก</th>
                <th className="p-3">กลไกและวิธีการ</th>
                <th className="p-3">ผลกระทบที่เกิดขึ้น</th>
                <th className="p-3 w-20 text-center">ช่องโหว่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attackScenarios.map(sc => (
                <tr key={sc.rank} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 text-center font-black text-amber-400">#{sc.rank}</td>
                  <td className="p-3 font-bold text-white whitespace-nowrap">{sc.title}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/80">
                      {sc.difficulty}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{sc.mechanism}</td>
                  <td className="p-3 text-slate-300 font-medium">{sc.impact}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      {sc.findingRef}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800">
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterSeverity === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ทั้งหมด (15)
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterSeverity === 'critical'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 text-red-400 hover:bg-slate-750'
            }`}
          >
            🔴 วิกฤต (3)
          </button>
          <button
            onClick={() => setFilterSeverity('high')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterSeverity === 'high'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-750'
            }`}
          >
            🟠 สูง (5)
          </button>
          <button
            onClick={() => setFilterSeverity('medium')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterSeverity === 'medium'
                ? 'bg-yellow-600 text-white shadow-md'
                : 'bg-slate-800 text-yellow-400 hover:bg-slate-750'
            }`}
          >
            🟡 ปานกลาง (4)
          </button>
          <button
            onClick={() => setFilterSeverity('low')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterSeverity === 'low'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-blue-400 hover:bg-slate-750'
            }`}
          >
            🔵 ต่ำ (3)
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาช่องโหว่, ไฟล์, หมวดหมู่..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* 15 VULNERABILITIES LIST */}
      <div className="space-y-5">
        {filteredList.map(item => {
          const isCrit = item.severity === 'critical';
          const isHigh = item.severity === 'high';
          const isMed = item.severity === 'medium';

          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all space-y-4 shadow-xl ${
                isCrit
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/20 border-red-500/50 shadow-red-950/20'
                  : isHigh
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-amber-950/20'
                  : isMed
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-yellow-950/10 border-yellow-500/30 shadow-yellow-950/20'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                    isCrit ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    isHigh ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    isMed ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {item.id}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCrit ? 'bg-red-500/25 text-red-300 border border-red-500/50' :
                        isHigh ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50' :
                        isMed ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {item.severityLabel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold shrink-0 self-end sm:self-auto">
                  {item.status}
                </span>
              </div>

              {/* Code Evidence */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-2.5 text-xs font-mono text-slate-300">
                <FileCode className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">ตำแหน่งโค้ดและหลักฐาน:</span>
                  <span className="text-purple-300">{item.evidence}</span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">รายละเอียดข้อบกพร่อง:</span>
                {item.description}
              </div>

              {/* Attack Vector & Remediation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>วิธีการโจมตีและผลกระทบ (Attack Scenario):</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {item.attackVector}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>แนวทางการแก้ไขเชิงเทคนิค (Technical Remediation):</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {item.remediation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION: EXISTING POSITIVE PRACTICES */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              จุดแข็งและส่วนที่ระบบทำได้อย่างถูกต้องแล้ว (Positive Controls)
            </h2>
            <p className="text-xs text-slate-400">
              ผลการตรวจส่วนที่ไม่พบช่องโหว่และเป็นไปตามหลักปฏิบัติที่ดี (Best Practices)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {goodPractices.map((gp, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">{gp.title}</h4>
                <p className="text-slate-400 mt-1 leading-relaxed">{gp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: STEP-BY-STEP REMEDIATION ROADMAP */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/30 shadow-2xl space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              แผนผังและลำดับขั้นตอนการแก้ไขอย่างปลอดภัย (Hardening Roadmap)
            </h2>
            <p className="text-xs text-slate-400">
              ข้อควรระวัง: การเปิดใช้ RLS จำเป็นต้องทำควบคู่กับการเปลี่ยนระบบยืนยันตัวตนไปสู่ Supabase Auth เสมอ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-red-500/40 space-y-2">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-black text-[10px]">
              ระยะที่ 0 · วันนี้
            </span>
            <h4 className="font-bold text-white text-sm">การระงับเหตุเร่งด่วน</h4>
            <ul className="text-slate-400 space-y-1.5 list-disc list-inside">
              <li>เปลี่ยนรหัสผ่าน Admin ทันที</li>
              <li>ลบ VITE_ADMIN_* จาก Vercel</li>
              <li>ตรวจเลขที่บัญชีใน project_settings</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px]">
              ระยะที่ 1 · สัปดาห์แรก
            </span>
            <h4 className="font-bold text-white text-sm">ระบบยืนยันตัวตนแท้จริง</h4>
            <ul className="text-slate-400 space-y-1.5 list-disc list-inside">
              <li>เปลี่ยนใช้ Supabase Auth เต็มรูปแบบ</li>
              <li>Google OAuth ผ่าน Server Callback</li>
              <li>ยกเลิกรหัสผ่าน SHA-256 ใน Browser</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/40 space-y-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-black text-[10px]">
              ระยะที่ 2 · สัปดาห์ถัดไป
            </span>
            <h4 className="font-bold text-white text-sm">ฐานข้อมูล & Storage</h4>
            <ul className="text-slate-400 space-y-1.5 list-disc list-inside">
              <li>เขียน RLS ผูกกับ auth.uid()</li>
              <li>จำกัดสิทธิ์แก้ไขฟิลด์การเงินให้ Admin</li>
              <li>ย้ายรูปบัตรประชาชนเข้า Private Bucket</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px]">
              ระยะที่ 3 · ก่อนรับสมัครจริง
            </span>
            <h4 className="font-bold text-white text-sm">การป้องกันรอบนอก</h4>
            <ul className="text-slate-400 space-y-1.5 list-disc list-inside">
              <li>ติดตั้ง Security Headers ใน vercel.json</li>
              <li>เปิดใช้ Rate Limiting & CAPTCHA</li>
              <li>จัดทำนโยบาย PDPA และ Retention</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
        รายงานนี้ถูกจัดทำขึ้นเพื่อการประเมินและยกระดับความมั่นคงปลอดภัยของโครงการ Joint Response Exercise (JRE 2027) · พัฒนาระบบโดยทีมงาน RCPDEV
      </div>

    </div>
  );
}
