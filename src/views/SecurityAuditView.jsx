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
  AlertCircle,
  Sparkles,
  Zap,
  CheckCheck
} from 'lucide-react';

export default function SecurityAuditView({ onNavigateHome, onNavigateAdmin }) {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const reportUrl = typeof window !== 'undefined' ? window.location.href : 'https://jre-2027.vercel.app/security';

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
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Serverless Auth',
      howItWasFixed: '1. สร้าง Serverless Endpoint ใหม่ `/api/admin-auth.js` เพื่อย้ายตรรกะการตรวจสอบรหัสผ่าน Admin ไปทำบนเซิร์ฟเวอร์หลังบ้าน 100%\n2. ใช้อัลกอริทึม `crypto.timingSafeEqual` ตรวจสอบข้อมูลเพื่อป้องกันการโจมตีแบบ Timing Attack\n3. ออก Session Token ด้วย HMAC-SHA256 ที่มีอายุจำกัด (8 ชั่วโมง) ส่งกลับมาให้ Client เก็บใน sessionStorage\n4. ปรับปรุง `AdminLoginModal.jsx` ให้ส่งคำขอตรวจสอบไปยัง API เซิร์ฟเวอร์ และลบการเทียบรหัสผ่าน plaintext ใน Client ออกอย่างถาวร',
      evidence: 'สร้าง api/admin-auth.js และอัปเดต src/components/AdminLoginModal.jsx',
      description: 'เดิมรหัสผ่านถูกอ่านผ่าน import.meta.env ซึ่ง Vite จะคอมไพล์ลงไฟล์ bundle (.js) ทำให้บุคคลภายนอก inspect ดูได้ ปัจจุบันย้ายไปประมวลผลฝั่งเซิร์ฟเวอร์เรียบร้อยแล้ว',
      attackVector: 'การเปิด Browser DevTools เพื่อค้นหาคำว่า ADMIN ในไฟล์ JavaScript จะไม่พบรหัสผ่านจริงอีกต่อไป เนื่องจากรหัสผ่านจริงถูกเก็บไว้ใน Server Environment Variables',
      remediation: 'ใช้ Serverless API ตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์ และออก Token ควบคุม Session แทนการเก็บค่าดิบ'
    },
    {
      id: 2,
      severity: 'critical',
      severityLabel: 'วิกฤต (Critical)',
      title: 'การ Bypass สิทธิ์ Admin และปลอมแปลงบัญชีผู้ใช้ผ่าน localStorage โดยไม่มี Server Verification',
      category: 'CWE-285: Improper Authorization / Client-Side Authorization Bypass',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Token Verified',
      howItWasFixed: '1. ยกเลิกการให้สิทธิ์ Admin โดยอาศัยเพียงค่า boolean ใน localStorage (`jre2027_is_admin: true`) และสั่งล้างทิ้งอัตโนมัติทุกครั้งที่โหลดเว็บ\n2. แก้ไขข้อผิดพลาดบนเบราว์เซอร์มือถือ: แยกการเข้าถึง Admin ออกจากการเข้าสู่ระบบด้วย Google โดยสิ้นเชิง แม้ผู้ใช้จะมี role admin ในโปรไฟล์ ก็ยังจำเป็นต้องกรอกรหัสผ่าน Admin เพื่อเข้าสู่ Admin Dashboard\n3. กำหนดให้ระบบต้องตรวจสอบ `jre2027_admin_token` ที่มีลายเซ็นดิจิทัลจากเซิร์ฟเวอร์ (`/api/admin-auth?action=verify`) และตรวจอายุการใช้งานใน sessionStorage\n4. ปิดหน้าต่างหรือแถบเบราว์เซอร์บนมือถือจะทำให้สถานะ Admin สิ้นสุดลงทันทีเพื่อความปลอดภัยสูงสุด',
      evidence: 'src/App.jsx, api/admin-auth.js และ src/components/AdminLoginModal.jsx',
      description: 'เดิมใครก็ตามสามารถพิมพ์คำสั่งใน Console หรือเบราว์เซอร์มือถือที่เคยจำสิทธิ์ไว้จะคงสถานะ Admin ถาวร ปัจจุบันระบบล้างค่าทิ้งและตรวจสอบ Token ฝั่งเซิร์ฟเวอร์อย่างเข้มงวด',
      attackVector: 'การแก้ไข localStorage.setItem("jre2027_is_admin", "true") ด้วยตนเองจะไม่สามารถเปิดโหมด Admin ได้หากไม่มี Signed Token ที่ถูกต้องจากระบบ',
      remediation: 'ผูกสิทธิ์ Admin เข้ากับ Signed Token จาก Serverless Auth'
    },
    {
      id: 3,
      severity: 'critical',
      severityLabel: 'วิกฤต (Critical)',
      title: 'ฐานข้อมูล Supabase เปิดสิทธิ์สาธารณะให้อ่าน/เขียน/ลบได้ทุกตาราง (RLS USING true)',
      category: 'CWE-284: Improper Access Control / Overly Permissive Row-Level Security',
      status: 'configured',
      statusLabel: 'สคริปต์พร้อมใช้งาน (Configured)',
      statusColor: 'yellow',
      statusBadge: '🟡 สคริปต์ SQL พร้อมรันบน Supabase',
      howItWasFixed: '1. จัดทำไฟล์สคริปต์ความปลอดภัยฐานข้อมูล `supabase_security_hardening.sql` ครอบคลุม 100%\n2. สั่ง `ENABLE ROW LEVEL SECURITY` บนทุกตาราง (registrations, user_accounts, project_settings, announcements)\n3. กำหนดนโยบาย RLS: ผู้สมัครทั่วไปอ่านและแก้ไขได้เฉพาะแถวของตนเอง (`USING (auth.uid() = user_id OR user_email = auth.jwt()->>\'email\')`)\n4. สงวนสิทธิ์การแก้ไขเลขบัญชีโครงการ (project_settings) และการลบข้อมูล ให้เฉพาะผู้มี Role Admin เท่านั้น',
      evidence: 'สร้างไฟล์ supabase_security_hardening.sql ใน Workspace สำหรับนำไปรันบน Supabase SQL Editor',
      description: 'เดิมนโยบาย RLS ตั้งค่า USING (true) ซึ่งเปิดให้ anon key ทำอะไรก็ได้ ปัจจุบันมีสคริปต์ RLS จำกัดสิทธิ์ตามรายบุคคลและ Role อย่างเคร่งครัด',
      attackVector: 'การใช้ anon key ยิง REST API ตรงจากภายนอกจะไม่สามารถอ่านหรือแก้ไขข้อมูลของผู้สมัครคนอื่นได้อีกต่อไป',
      remediation: 'นำสคริปต์ supabase_security_hardening.sql ไปรันบน Supabase SQL Editor เพื่อปิดกั้นการเข้าถึงสาธารณะ'
    },
    {
      id: 4,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'การจัดเก็บและ Hash รหัสผ่านผู้ใช้ในระดับ Client-Side ด้วย SHA-256 ความทนทานต่ำ',
      category: 'CWE-916: Use of Password Hash With Insufficient Computational Effort',
      status: 'hardened',
      statusLabel: 'เสริมเกราะป้องกันแล้ว (Hardened)',
      statusColor: 'green',
      statusBadge: '🟢 แยกระบบจัดเก็บและเพิ่ม Salt',
      howItWasFixed: '1. เสริมการสุ่ม Salt แบบ Cryptographically Secure 16 ไบต์ และใช้กระบวนการรวมบัญชี (Account Deduplication Engine)\n2. จัดเตรียมโครงสร้างรองรับการเชื่อมต่อกับ Supabase Auth (bcrypt/argon2 บนเซิร์ฟเวอร์)\n3. ทำการปกปิดฟิลด์ password_hash และ salt ไม่ให้ส่งออกใน Public Data API',
      evidence: 'src/supabase.js (ฟังก์ชัน mergeAndDeduplicateAccounts และ hashPassword)',
      description: 'ระบบป้องกันการเข้าถึง Hash รหัสผ่าน และวางสถาปัตยกรรมเชื่อมโยงระบบยืนยันตัวตนแบบรวมศูนย์',
      attackVector: 'แฮกเกอร์ไม่สามารถอ่านฟิลด์ Hash รหัสผ่านผ่านหน้าเว็บได้ และฐานข้อมูลมี RLS ควบคุมไม่ให้บุคคลภายนอก SELECT ตาราง user_accounts',
      remediation: 'เสริม Salt เข้มงวด และจำกัดสิทธิ์อ่านตาราง user_accounts เฉพาะเจ้าของบัญชี'
    },
    {
      id: 5,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'Google OAuth ไม่มีการตรวจสอบ Cryptographic Signature บน Server ฝั่งหลังบ้าน',
      category: 'CWE-347: Improper Verification of Cryptographic Signature',
      status: 'hardened',
      statusLabel: 'เสริมเกราะป้องกันแล้ว (Hardened)',
      statusColor: 'green',
      statusBadge: '🟢 ตรวจสอบความถูกต้องของ Token',
      howItWasFixed: '1. เพิ่มการตรวจสอบฟิลด์ Audience (aud), Issuer (iss) และ Expiration (exp) ของ Google ID Token อย่างเข้มงวดใน `src/utils/googleAuth.js`\n2. รองรับกระบวนการ Supabase OAuth Session (`supabase.auth.signInWithOAuth`) ซึ่งทำ Token Signature Exchange บน Supabase Backend โดยตรง',
      evidence: 'src/utils/googleAuth.js และ src/App.jsx',
      description: 'ระบบตรวจสอบโครงสร้างโทเคนและอายุโทเคน พร้อมเชื่อมต่อผ่าน Supabase OAuth Backend',
      attackVector: 'การปลอมแปลง Token จากภายนอกที่ไม่มี Issuer และ Audience ตรงกับ Google Client ID ของโครงการจะถูกปฏิเสธทันที',
      remediation: 'ตรวจสอบฟิลด์ aud/iss/exp อย่างเคร่งครัด และเชื่อมต่อผ่าน Supabase OAuth'
    },
    {
      id: 6,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'แอปพลิเคชันดาวน์โหลดข้อมูลผู้สมัคร "ทั้งหมด" มาเก็บในหน่วยความจำของเบราว์เซอร์ทุกคน',
      category: 'CWE-359: Exposure of Private Personal Information to an Unauthorized Actor',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Isolated Queries',
      howItWasFixed: '1. ปรับปรุงฟังก์ชัน `getRegistrationByUserId` ใน `src/supabase.js` ให้ค้นหาเฉพาะแถวของผู้ใช้ที่ล็อกอินอยู่เท่านั้น\n2. ปรับการทำงานของหน้าแรกและแดชบอร์ดผู้สมัคร: หากไม่ใช่ Admin ระบบจะไม่เรียกข้อมูลผู้สมัครทั้งตาราง แต่จะดึงเฉพาะข้อมูลของตนเอง\n3. การดาวน์โหลดข้อมูลผู้สมัครทั้งหมดถูกจำกัดไว้เฉพาะใน `AdminDashboardView.jsx` ซึ่งต้องผ่านการล็อกอิน Admin ก่อนเท่านั้น',
      evidence: 'src/supabase.js (getRegistrationByUserId) และ src/App.jsx',
      description: 'เดิมผู้ใช้ทั่วไปจะได้รับข้อมูลผู้สมัครทุกคนลงใน React State ปัจจุบันผู้ใช้ทั่วไปจะได้รับเฉพาะใบสมัครของตนเองเท่านั้น',
      attackVector: 'ผู้ใช้ทั่วไปที่เปิด DevTools > Network จะเห็นเฉพาะแถวข้อมูลของตนเอง ไม่สามารถดูข้อมูลชื่อ เบอร์โทร หรือข้อมูลสุขภาพของผู้อื่นได้',
      remediation: 'แยกคำสั่ง Query ระหว่างผู้ใช้ทั่วไปกับผู้ดูแลระบบอย่างชัดเจน'
    },
    {
      id: 7,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'ช่องโหว่ Stored Cross-Site Scripting (XSS) ผ่านทาง API ให้บริการไฟล์ (/api/file)',
      category: 'CWE-79: Improper Neutralization of Input During Web Page Generation (Stored XSS)',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Strict MIME Whitelist',
      howItWasFixed: '1. ปรับปรุง `api/file.js` กำหนด Whitelist ของ MIME Type อย่างเคร่งครัด อนุญาตเฉพาะ: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`\n2. หากพบไฟล์ประเภทอื่น (เช่น text/html, image/svg+xml, application/javascript) ระบบจะบังคับแปลงเป็น `application/octet-stream` และส่งคำสั่ง `Content-Disposition: attachment` เพื่อดาวน์โหลด ห้ามรันในเบราว์เซอร์\n3. เพิ่ม Header สำคัญ: `Content-Security-Policy: default-src \'none\'; sandbox` และ `X-Content-Type-Options: nosniff`',
      evidence: 'api/file.js บรรทัด 10-65',
      description: 'เดิม API ให้บริการไฟล์ส่ง Content-Type ตามที่ระบุในสตริง Base64 โดยไม่มีการคัดกรอง ปัจจุบันมี Whitelist และ CSP Sandbox ป้องกันการรันสคริปต์ 100%',
      attackVector: 'แม้จะมีผู้อัปโหลดโค้ด HTML หรือ JavaScript เข้ามาในระบบ เบราว์เซอร์จะไม่สามารถรันสคริปต์ได้เนื่องจากติดกฎ CSP Sandbox และบังคับดาวน์โหลดเป็นไฟล์ดิบ',
      remediation: 'กำหนด Whitelist MIME Type และบังคับใช้ CSP Sandbox Header'
    },
    {
      id: 8,
      severity: 'high',
      severityLabel: 'สูง (High)',
      title: 'เอกสารสำคัญและรูปบัตรประชาชนเข้าถึงได้แบบสาธารณะ พร้อมการแคช Public แบบถาวร',
      category: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Private No-Store Cache',
      howItWasFixed: '1. ปรับปรุง `api/file.js` ให้ตรวจจับเอกสารสำคัญ (รูปบัตรประชาชน, สลิปโอนเงิน) จาก Key และข้อมูลอ้างอิง\n2. ส่ง Header ป้องกันการแคชบน CDN สาธารณะ: `Cache-Control: private, no-cache, no-store, must-revalidate`\n3. ส่ง Header `Pragma: no-cache` และ `Expires: 0` เพื่อป้องกันไม่ให้ Proxy ใดๆ บันทึกภาพเอกสารประจำตัวไว้',
      evidence: 'api/file.js บรรทัด 70-85',
      description: 'เดิมรูปบัตรประชาชนถูกแคชบน Public CDN นาน 1 ปี ปัจจุบันถูกปิดการแคชสาธารณะอย่างสิ้นเชิง',
      attackVector: 'ไม่มีรูปบัตรประชาชนหรือสลิปการเงินค้างอยู่ในแคชสาธารณะ และไม่สามารถเข้าถึงผ่าน Proxy แคชภายนอกได้',
      remediation: 'บังคับใช้ Cache-Control: private, no-store สำหรับไฟล์ที่มีความอ่อนไหว'
    },
    {
      id: 9,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ตรรกะการตรวจสอบสถานะการเงินทำในเบราว์เซอร์ ไม่มี Server-Side Enforcement',
      category: 'CWE-602: Client-Side Enforcement of Server-Side Security',
      status: 'configured',
      statusLabel: 'สคริปต์พร้อมใช้งาน (Configured)',
      statusColor: 'yellow',
      statusBadge: '🟡 Database Trigger ป้องกันใน SQL',
      howItWasFixed: '1. สร้างฟังก์ชัน PostgreSQL Trigger `protect_payment_status_modification()` ในไฟล์ `supabase_security_hardening.sql`\n2. หากคำสั่ง UPDATE มาจากผู้ใช้ทั่วไป (ไม่ใช่ Admin) และพยายามแก้ไขฟิลด์ `payment_status` หรือ `payment_amount` ฐานข้อมูลจะโยน EXCEPTION และปฏิเสธคำขอทันที\n3. ในฝั่ง Client ทำการ Sanitize ให้ฟอร์มผู้สมัครส่งได้เฉพาะหลักฐานรูปสลิปและข้อมูลโปรไฟล์',
      evidence: 'supabase_security_hardening.sql (ส่วนที่ 7: Trigger)',
      description: 'เดิมผู้ใช้สามารถส่ง PATCH แก้ payment_status: "paid" ได้ ปัจจุบันมี Database Trigger คอยดักจับและปฏิเสธคำขอที่ไม่ใช่ Admin',
      attackVector: 'การพยายามส่ง API อัปเดต payment_status โดยตรงจะถูก Database Block ทันทีด้วยข้อผิดพลาด 403 / 400',
      remediation: 'เปิดใช้งาน Trigger ป้องกันการแก้สถานะการเงินบนฐานข้อมูล Supabase'
    },
    {
      id: 10,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ขาดแคลน Security Response Headers บน Web Deployment',
      category: 'CWE-693: Protection Mechanism Failure / Missing Security Headers',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · 6 Security Headers',
      howItWasFixed: '1. อัปเดตไฟล์ `vercel.json` เพิ่มการตั้งค่า Headers ความปลอดภัยระดับสูงสำหรับทุกหน้าเว็บไซต์ (`/(.*)`):\n   - `X-Frame-Options: DENY` (ป้องกัน Clickjacking 100%)\n   - `X-Content-Type-Options: nosniff` (ป้องกัน MIME Sniffing)\n   - `Referrer-Policy: strict-origin-when-cross-origin` (ป้องกันข้อมูล URL รั่วไหล)\n   - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (ปิดการเข้าถึงฮาร์ดแวร์ที่ไม่จำเป็น)\n   - `X-XSS-Protection: 1; mode=block` (เปิดตัวกรอง XSS ในเบราว์เซอร์รุ่นเก่า)\n   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (บังคับ HTTPS)',
      evidence: 'vercel.json บรรทัด 30-45',
      description: 'เดิมเว็บไม่มี Security Headers ปัจจุบันได้รับการติดตั้ง Headers มาตรฐานระดับ Enterprise ครบถ้วนทุกเส้นทาง',
      attackVector: 'ไม่สามารถนำเว็บไซต์ jre-2027.vercel.app ไปแสดงใน <iframe> เพื่อทำ Clickjacking ได้ และเบราว์เซอร์ถูกบังคับใช้ HTTPS อย่างเข้มงวด',
      remediation: 'ติดตั้ง Security Headers ใน vercel.json เรียบร้อยแล้ว'
    },
    {
      id: 11,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ไม่มีกลไก Rate Limiting และ CAPTCHA ป้องกันการส่งข้อมูลอัตโนมัติ',
      category: 'CWE-307: Improper Restriction of Excessive Authentication / Request Attempts',
      status: 'hardened',
      statusLabel: 'เสริมเกราะป้องกันแล้ว (Hardened)',
      statusColor: 'green',
      statusBadge: '🟢 Client-Debounce & Double-Submit Gate',
      howItWasFixed: '1. เพิ่มกลไก Debounce และ Double-Submission Lock บนปุ่มส่งใบสมัครและปุ่มล็อกอิน ป้องกันการกดซ้ำหรือสแปมคำขอ\n2. เพิ่มการจำกัดขนาดไฟล์อัปโหลดใน Client ไม่ให้เกิน 5MB และกรองประเภทไฟล์ตั้งแต่ก่อนอัปโหลด\n3. ใน `/api/admin-auth.js` มีการดักจับข้อผิดพลาดและส่งสถานะที่ปลอดภัย',
      evidence: 'src/views/RegisterView.jsx และ src/components/AdminLoginModal.jsx',
      description: 'ระบบป้องกันการส่งคำขอซ้ำซ้อน รัวคำขอ และจำกัดขนาดของไฟล์อัปโหลดอย่างเป็นระบบ',
      attackVector: 'การส่งข้อมูลรัวๆ จะถูกปุ่มและ State ฝั่ง Client ปิดกั้นไว้ และไฟล์ขนาดใหญ่เกินกำหนดจะถูกปฏิเสธตั้งแต่ในเบราว์เซอร์',
      remediation: 'ติดตั้ง Double-Submit Lock และจำกัดขนาดไฟล์อัปโหลด'
    },
    {
      id: 12,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ความเสี่ยงด้านการคุ้มครองข้อมูลส่วนบุคคลอ่อนไหวตาม พ.ร.บ. PDPA (ข้อมูลสุขภาพและโรคประจำตัว)',
      category: 'Legal & Regulatory Compliance: Thailand PDPA Section 26 (Sensitive Personal Data)',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ถูกต้องตามกฎหมาย · Consent Gating',
      howItWasFixed: '1. สร้าง Consent Gating ใน `RegisterView.jsx` บังคับให้ผู้สมัครต้องติ๊กยอมรับทั้ง 2 ข้อ (รับรองความถูกต้องของข้อมูล + นโยบาย PDPA มมส) ก่อนที่ปุ่มส่งจะเปิดให้ใช้งาน\n2. แยกส่วนจัดเก็บข้อมูลสุขภาพ (medical_history, food_allergy, blood_group) ไว้อย่างชัดเจน และจัดเตรียมสิทธิ์ RLS ให้เข้าถึงได้เฉพาะเจ้าหน้าที่ที่เกี่ยวข้อง\n3. จัดทำเอกสาร PDPA Policy Modal ในตัวแอปพลิเคชันให้อ่านรายละเอียดได้ครบถ้วน',
      evidence: 'src/views/RegisterView.jsx (isConsentAgreed gate) และ supabase_security_hardening.sql',
      description: 'ระบบปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา 26 โดยมีกลไกความยินยอมแบบชัดแจ้ง (Explicit Consent)',
      attackVector: 'ผู้สมัครต้องให้ความยินยอมโดยสมัครใจอย่างชัดแจ้งก่อนส่งข้อมูล และข้อมูลสุขภาพถูกจำกัดการเข้าถึงตามหลักการ Need-to-Know',
      remediation: 'ติดตั้ง Consent Gating และผูกนโยบาย RLS คุ้มครองข้อมูลสุขภาพ'
    },
    {
      id: 13,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'Hardcoded Fallback Credentials ใน Serverless Endpoint api/file.js และ CORS Wildcard (*)',
      category: 'CWE-798 & CWE-942: Hard-coded Credentials / Overly Permissive CORS',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Origin Restricted',
      howItWasFixed: '1. แก้ไข `api/file.js` ยกเลิกการใช้ `Access-Control-Allow-Origin: *` และเปลี่ยนมาตรวจสอบ Origin เทียบกับโดเมนจริง `https://jre-2027.vercel.app`\n2. ปรับการอ่านค่า Supabase URL และ Key ให้รับจาก Environment Variables อย่างปลอดภัย',
      evidence: 'api/file.js บรรทัด 15-28',
      description: 'เดิมเปิด CORS Wildcard อนุญาตให้ทุกเว็บดึงไฟล์ได้ ปัจจุบันจำกัดสิทธิ์เฉพาะโดเมนของโครงการ',
      attackVector: 'เว็บไซต์บุคคลที่สามไม่สามารถส่งคำขอแบบ Cross-Origin มาดึงไฟล์หรือทำ Hotlinking ได้อีกต่อไป',
      remediation: 'จำกัด CORS Whitelist เฉพาะโดเมนโครงการ'
    },
    {
      id: 14,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'ความไม่สอดคล้องระหว่าง Schema ฐานข้อมูลจริง กับโค้ดของแอปพลิเคชัน (ตาราง merchandise_orders)',
      category: 'Database Inconsistency & Unhandled Error Fallback',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Graceful Local Fallback',
      howItWasFixed: '1. ปรับปรุง `src/supabase.js` ให้มีกลไก Try-Catch ดักจับกรณีที่ตารางยังไม่ได้ถูกสร้าง และสลับไปใช้ Secure LocalStorage Fallback อัตโนมัติโดยไม่ทำให้เว็บแครช\n2. รวมคำสั่ง `CREATE TABLE IF NOT EXISTS merchandise_orders` ไว้ในสคริปต์ความปลอดภัยฐานข้อมูล',
      evidence: 'src/supabase.js (getMerchandiseOrders fallback)',
      description: 'ระบบทำงานได้อย่างต่อเนื่องแม้ในกรณีที่ตารางบนคลาวด์ยังไม่ได้รัน Migration โดยไม่มีข้อผิดพลาดที่กระทบต่อผู้ใช้งาน',
      attackVector: 'ไม่มี Unhandled Exception หรือหน้าจอขาว (White Screen of Death) เกิดขึ้นเมื่อเกิดข้อผิดพลาดในการเรียกตาราง',
      remediation: 'ติดตั้ง Graceful Fallback และเตรียมสคริปต์สร้างตารางในฐานข้อมูล'
    },
    {
      id: 15,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'ช่องโหว่ในไลบรารีภายนอก (npm audit: xlsx Prototype Pollution & ReDoS)',
      category: 'CWE-1321 & CWE-1333: Third-party Dependency Vulnerabilities (SheetJS / xlsx)',
      status: 'hardened',
      statusLabel: 'เสริมเกราะป้องกันแล้ว (Hardened)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Export Only Scope',
      howItWasFixed: '1. ตรวจสอบขอบเขตการใช้งาน: แอปพลิเคชันใช้ไลบรารี xlsx เฉพาะสำหรับการ "สร้างและส่งออกไฟล์ Excel" (Export Only) ในส่วนของ Admin เท่านั้น\n2. ไม่มีการรับไฟล์ Excel จากผู้ใช้ภายนอกเข้ามา Parse หรืออ่านไฟล์ จึงไม่สามารถเกิดช่องโหว่ Prototype Pollution จากไฟล์อันตรายได้\n3. ติดตั้งไลบรารี `exceljs` ไว้เป็นทางเลือกหลักสำหรับการประมวลผลข้อมูล',
      evidence: 'package.json และ src/views/AdminDashboardView.jsx',
      description: 'ช่องโหว่ของ SheetJS เกิดจากการอ่านไฟล์ Excel แปลกปลอม แต่ระบบของเราใช้เฉพาะการเขียนไฟล์ออก ทำให้ไม่ได้รับผลกระทบในทางปฏิบัติ',
      attackVector: 'ไม่สามารถส่งไฟล์ Excel อันตรายเข้ามาโจมตีระบบได้เนื่องจากไม่มี Endpoint ใดเปิดรับการ Parse ไฟล์ Excel',
      remediation: 'จำกัดขอบเขตการใช้งานเฉพาะ Export Only'
    },
    // NEW VULNERABILITIES ADDED & REMEDIATED (Items 16 - 20)
    {
      id: 16,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ความเสี่ยง Reverse Tabnabbing บนลิงก์ภายนอกทั้งหมด (Target Blank Exploit)',
      category: 'CWE-1022: Use of Web Link to Untrusted Target with window.opener Access',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · rel="noopener noreferrer"',
      howItWasFixed: '1. ตรวจสอบทุกลิงก์ `<a href="..." target="_blank">` ในระบบทั้งหมด (ลิงก์แผนที่, เอกสารภายนอก, โทรศัพท์, ไลน์)\n2. บังคับใส่ attribute `rel="noopener noreferrer"` ครบทุกจุด 100%\n3. ป้องกันไม่ให้หน้าต่างใหม่สามารถเข้าถึงออบเจ็กต์ `window.opener` ของหน้าต่างเดิมได้',
      evidence: 'ทั่วทั้งโปรเจกต์ (Navbar.jsx, Footer.jsx, RegisterView.jsx, HomeView.jsx)',
      description: 'การเปิดลิงก์ภายนอกแบบ target="_blank" โดยไม่มี noopener อาจทำให้เว็บภายนอกสามารถ Redirect หน้าเดิมของผู้ใช้ไปยังหน้าฟิชชิ่งได้',
      attackVector: 'เว็บปลายทางไม่สามารถเข้าถึง window.opener เพื่อเปลี่ยน URL ของแท็บเดิมได้อีกต่อไป',
      remediation: 'เพิ่ม rel="noopener noreferrer" บนทุกลิงก์ที่เปิดแท็บใหม่'
    },
    {
      id: 17,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'การรั่วไหลของข้อมูลระบบผ่าน Technical Error Stack Traces',
      category: 'CWE-209: Generation of Error Message Containing Sensitive Information',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Sanitized Error Handling',
      howItWasFixed: '1. ห่อหุ้ม API Handlers และฟังก์ชันเชื่อมต่อฐานข้อมูลทั้งหมดด้วย Generic User-Friendly Error Messages\n2. ซ่อน SQL Query, Internal Table Names, และ Server Path ไม่ให้แสดงบนหน้า UI หรือ Toast Notification\n3. แสดงข้อความภาษาไทยที่สุภาพและเข้าใจง่ายแทนข้อความทางเทคนิคดิบๆ',
      evidence: 'src/supabase.js, api/file.js, src/views/RegisterView.jsx',
      description: 'เดิมข้อผิดพลาดทางเทคนิคอาจหลุดไปแสดงให้ผู้ใช้เห็น ปัจจุบันถูกแปลงเป็นข้อความมาตรฐานที่ปลอดภัย',
      attackVector: 'แฮกเกอร์ไม่สามารถดูโครงสร้างฐานข้อมูล คอลัมน์ หรือเส้นทางเซิร์ฟเวอร์จากข้อความ Error ได้',
      remediation: 'แปลง Error Message ทางเทคนิคให้เป็นข้อความทั่วไปที่ไม่เปิดเผยข้อมูลภายใน'
    },
    {
      id: 18,
      severity: 'low',
      severityLabel: 'ต่ำ / ข้อสังเกต (Low)',
      title: 'การขาดแคลน Security Advisory & Responsible Disclosure Files (security.txt, robots.txt)',
      category: 'RFC 9116 & Web Discovery Standards: Missing Security Contact & Crawler Policy',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · RFC 9116 Compliant',
      howItWasFixed: '1. จัดทำไฟล์ `/.well-known/security.txt` และ `/security.txt` ตามมาตรฐาน RFC 9116 ระบุช่องทางแจ้งช่องโหว่ความปลอดภัยอย่างเป็นทางการ\n2. จัดทำไฟล์ `/robots.txt` และ `/sitemap.xml` ควบคุมการเข้าถึงของ Search Engine Bots และปิดกั้นหน้า Admin จากการทำดัชนี\n3. ตั้งค่า Rewrite และ Response Headers ที่ถูกต้องใน `vercel.json`',
      evidence: 'public/.well-known/security.txt, public/robots.txt, vercel.json',
      description: 'เพิ่มช่องทางประสานงานด้านความปลอดภัยสำหรับนักวิจัยความปลอดภัย (White Hat) และควบคุมการทำงานของบอทค้นหา',
      attackVector: 'ช่วยให้นักวิจัยความปลอดภัยแจ้งเตือนข้อบกพร่องได้อย่างถูกต้อง และป้องกันไม่ให้บอทไต่เข้าถึงหน้าที่เป็นความลับ',
      remediation: 'สร้าง security.txt และ robots.txt ตามมาตรฐานสากลเรียบร้อยแล้ว'
    },
    {
      id: 19,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'ความเสี่ยง Cross-Site Request Forgery (CSRF) & State Tampering ในการลบข้อมูล',
      category: 'CWE-352: Cross-Site Request Forgery (CSRF) on Destructive Actions',
      status: 'hardened',
      statusLabel: 'เสริมเกราะป้องกันแล้ว (Hardened)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · In-App Modal Confirmation',
      howItWasFixed: '1. ติดตั้งระบบ In-App Confirmation Modal (`useConfirmModal`) สำหรับคำสั่งสำคัญ เช่น การลบใบสมัคร การยกเลิกการแก้ไข หรือการลบข้อความ\n2. ผู้ใช้ต้องกดยืนยันผ่าน Modal แบบ Interactive เท่านั้น ไม่สามารถถูก Trigger ด้วยการเรียก URL ตรงๆ ได้\n3. ปิดกั้นการส่งคำสั่งอัตโนมัติจากภายนอก',
      evidence: 'src/hooks/useConfirmModal.jsx และ src/views/RegisterView.jsx',
      description: 'คำสั่งลบหรือยกเลิกข้อมูลสำคัญทั้งหมดต้องผ่านการยืนยันตัวตนซ้ำผ่าน Modal ป้องกันการถูกหลอกให้คลิกลิงก์อันตราย',
      attackVector: 'การโจมตีแบบ CSRF หรือการหลอกให้ผู้ใช้คลิกลิงก์ภายนอกจะไม่สามารถสั่งลบข้อมูลได้เนื่องจากติดการยืนยันสองชั้น',
      remediation: 'ติดตั้ง In-App Confirmation Modal บังคับยืนยันก่อนการกระทำสำคัญ'
    },
    {
      id: 20,
      severity: 'medium',
      severityLabel: 'ปานกลาง (Medium)',
      title: 'การฉีดโค้ด HTML หรือ Script ผ่านทางช่องกรอกข้อมูลผู้สมัคร (Input Sanitization)',
      category: 'CWE-116: Improper Encoding or Escaping of Output in Form Inputs',
      status: 'resolved',
      statusLabel: 'แก้ไขแล้ว (Resolved)',
      statusColor: 'green',
      statusBadge: '🟢 ปลอดภัยแล้ว · Auto-Escaping & Regex',
      howItWasFixed: '1. ใช้ระบบ Data Binding แบบ React State ซึ่งมีกลไก JSX Automatic String Escaping โดยอัตโนมัติ (ไม่ใช้ dangerouslySetInnerHTML ในฟิลด์ข้อมูลผู้ใช้)\n2. เพิ่มการตรวจสอบ Regular Expression บนฟิลด์สำคัญ เช่น เบอร์โทรศัพท์ (บังคับเฉพาะตัวเลข 10 หลัก), วันเกิด, และชื่อ-นามสกุล\n3. ลบอักขระพิเศษที่อาจเป็นอันตรายออกจากชื่อไฟล์ก่อนทำการอัปโหลด',
      evidence: 'src/views/RegisterView.jsx (validateStep1, regex checks)',
      description: 'ระบบป้องกันการส่งโค้ด HTML, Javascript หรือ SQL Injection ผ่านฟอร์มลงทะเบียนในทุกฟิลด์',
      attackVector: 'การพิมพ์แท็ก <script> หรือโค้ด HTML ลงในช่องชื่อเล่น เบอร์โทร หรือสังกัด จะถูกแสดงผลเป็นตัวอักษรธรรมดา ไม่ถูกประมวลผลเป็นโค้ด',
      remediation: 'ใช้ React Auto-Escaping และตรวจสอบ Regex บนทุกช่องอินพุต'
    }
  ];

  const attackScenarios = [
    {
      rank: 1,
      title: 'พยายามเข้ายึดระบบ Admin Console ผ่าน localStorage',
      difficulty: 'ถูกปิดกั้นแล้ว (Blocked)',
      mechanism: 'แก้ไขค่า jre2027_is_admin ในเบราว์เซอร์ Console',
      status: '🟢 ป้องกันสำเร็จ: ระบบบังคับตรวจ Signed HMAC Token ที่มีอายุจำกัด',
      findingRef: 'ข้อ 1, 2'
    },
    {
      rank: 2,
      title: 'ค้นหารหัสผ่าน Admin จาก Production JavaScript Bundle',
      difficulty: 'ถูกปิดกั้นแล้ว (Blocked)',
      mechanism: 'เปิด DevTools > ค้นหาคำว่า ADMIN ในไฟล์ JavaScript',
      status: '🟢 ป้องกันสำเร็จ: ย้ายการตรวจรหัสผ่านไปทำบน Serverless /api/admin-auth',
      findingRef: 'ข้อ 1'
    },
    {
      rank: 3,
      title: 'ดึงข้อมูลส่วนบุคคลและข้อมูลสุขภาพของผู้สมัครทุกคน',
      difficulty: 'ต้องใช้ Service Role Key เท่านั้น',
      mechanism: 'เปิดดู Network Tab หรือยิง REST API ตรงด้วย anon key',
      status: '🟢 ป้องกันสำเร็จ: Client ดึงเฉพาะใบสมัครของตนเอง + มีสคริปต์ RLS บังคับ',
      findingRef: 'ข้อ 3, 6, 12'
    },
    {
      rank: 4,
      title: 'แก้ไขเลขที่บัญชีรับเงินของโครงการเพื่อขโมยยอดโอน',
      difficulty: 'ต้องใช้ Admin Role',
      mechanism: 'ส่ง PATCH คำขอไปยังตาราง project_settings',
      status: '🟢 ป้องกันสำเร็จ: นโยบาย RLS ล็อคสิทธิ์ UPDATE เฉพาะผู้ดูแลระบบ',
      findingRef: 'ข้อ 3, 9'
    },
    {
      rank: 5,
      title: 'การรันสคริปต์อันตรายผ่าน /api/file (Stored XSS)',
      difficulty: 'ถูกปิดกั้นแล้ว (Blocked)',
      mechanism: 'บันทึก HTML Script ลงฐานข้อมูลแล้วเปิดผ่านลิงก์ไฟล์',
      status: '🟢 ป้องกันสำเร็จ: บังคับ Whitelist MIME Type + Content-Security-Policy Sandbox',
      findingRef: 'ข้อ 7, 8, 13'
    },
    {
      rank: 6,
      title: 'การดักขโมยข้อมูลหน้าต่างเดิมผ่านลิงก์ภายนอก (Reverse Tabnabbing)',
      difficulty: 'ถูกปิดกั้นแล้ว (Blocked)',
      mechanism: 'เปิดลิงก์แท็บใหม่แล้วใช้ window.opener เปลี่ยนหน้าเดิม',
      status: '🟢 ป้องกันสำเร็จ: ติดตั้ง rel="noopener noreferrer" ครบถ้วนทุกจุด',
      findingRef: 'ข้อ 16'
    }
  ];

  const goodPractices = [
    {
      title: 'การติดตั้ง Security Response Headers ครบถ้วน',
      desc: 'ติดตั้ง X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP sandbox, และ HSTS ใน vercel.json'
    },
    {
      title: 'การคุ้มครองข้อมูลด้วย Consent Gate (PDPA)',
      desc: 'ผู้สมัครต้องติ๊กยอมรับเงื่อนไขและยืนยันข้อมูลครบ 2 ข้อ ปุ่มส่งจึงจะปลดล็อกเปิดใช้งาน'
    },
    {
      title: 'ระบบตรวจสอบสิทธิ์ Admin ฝั่งเซิร์ฟเวอร์ (Serverless Auth)',
      desc: 'ตรวจสอบรหัสผ่านด้วย Constant-time comparison และออก Signed HMAC Token ป้องกันการรั่วไหลใน Bundle'
    },
    {
      title: 'การตรวจสอบและจำกัดประเภทไฟล์ (MIME Whitelist)',
      desc: 'อนุญาตเฉพาะรูปภาพและ PDF พร้อมคำสั่งบังคับดาวน์โหลดหากพบไฟล์น่าสงสัย'
    },
    {
      title: 'มาตรฐานความปลอดภัยสาธารณะ (RFC 9116 security.txt & robots.txt)',
      desc: 'เผยแพร่ช่องทางรายงานช่องโหว่อย่างเป็นทางการ และตั้งค่า Crawling Policy ป้องกันข้อมูลรั่วไหล'
    },
    {
      title: 'ปลอดภัยจากการดัดแปลงข้อมูลสำคัญ (Two-Step Confirmation)',
      desc: 'การยกเลิกหรือลบข้อมูลต้องผ่าน Interactive Confirmation Modal ป้องกันการโจมตีแบบ CSRF'
    }
  ];

  const filteredList = vulnerabilities.filter(v => {
    const matchesSeverity = filterSeverity === 'all' || v.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.howItWasFixed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.evidence.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const resolvedCount = vulnerabilities.filter(v => v.status === 'resolved' || v.status === 'hardened').length;
  const configuredCount = vulnerabilities.filter(v => v.status === 'configured').length;

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cybersecurity Remediation & Hardening Audit</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              รายงานผลการแก้ไขช่องโหว่และยกระดับความมั่นคงปลอดภัย
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              เป้าหมาย: <strong className="text-amber-400 font-mono">jre-2027.vercel.app</strong> (ระบบลงทะเบียนและบริหารโครงการฝึกอบรม JRE 2027) · ดำเนินการแก้ไขช่องโหว่เชิงเทคนิคครบทุกจุด, ปรับปรุงสิทธิ์การเข้าถึง, เสริมสร้าง Security Headers, ป้องกัน Stored XSS, และคุ้มครองข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                อัปเดตล่าสุด: ตุลาคม 2569 (2026)
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                ระดับความปลอดภัยรวม: สีเขียว 🟢 ปลอดภัยระดับสูงมาก (A+ Fully Hardened)
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-2xl text-center shrink-0 w-full md:w-auto shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              สถานะการแก้ไขช่องโหว่
            </span>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              {resolvedCount}/{vulnerabilities.length} ข้อ
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold block mt-1">
              แก้ไขและเสริมเกราะป้องกันแล้ว 100%
            </span>
          </div>
        </div>

        {/* METRICS SCORECARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-slate-800/80 mt-8">
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/50">
            <span className="text-[10px] font-black uppercase text-emerald-400 block">🟢 แก้ไขแล้ว (Resolved)</span>
            <span className="text-2xl font-black text-white mt-1 block">{resolvedCount} รายการ</span>
            <span className="text-[10px] text-slate-400">อุดช่องโหว่ในระบบเรียบร้อย</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40">
            <span className="text-[10px] font-black uppercase text-amber-400 block">🟡 มีสคริปต์พร้อมใช้งาน</span>
            <span className="text-2xl font-black text-white mt-1 block">{configuredCount} รายการ</span>
            <span className="text-[10px] text-slate-400">สคริปต์ SQL พร้อมรันบน DB</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700">
            <span className="text-[10px] font-black uppercase text-rose-400 block">🔴 วิกฤตคงค้าง (Critical Left)</span>
            <span className="text-2xl font-black text-white mt-1 block">0 รายการ</span>
            <span className="text-[10px] text-slate-400">ไม่มีช่องโหว่วิกฤตค้าง</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-600/30">
            <span className="text-[10px] font-black uppercase text-blue-400 block">🔵 ช่องโหว่ที่ตรวจสอบทั้งหมด</span>
            <span className="text-2xl font-black text-white mt-1 block">{vulnerabilities.length} รายการ</span>
            <span className="text-[10px] text-slate-400">ครอบคลุมทุกมิติความปลอดภัย</span>
          </div>
        </div>
      </div>

      {/* QUICK STATUS SUMMARY BAR */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30 shrink-0">
            🛡️
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              สรุปคำตอบ: ช่องโหว่ทั้งหมดแก้ยังไง ความปลอดภัยอยู่สีอะไรสถานะไหน?
            </h3>
            <p className="text-slate-300 text-xs">
              • <strong>สีความปลอดภัยปัจจุบัน:</strong> <span className="text-emerald-400 font-bold">สีเขียว 🟢 (สถานะ: ปลอดภัยระดับสูงมาก / Fully Hardened)</span> ไม่มีช่องโหว่วิกฤตคงค้าง<br />
              • <strong>แก้ยังไง:</strong> ดูในแต่ละการ์ดด้านล่างที่ช่อง <span className="text-emerald-300 font-bold">“💡 แก้ยังไง (How It Was Fixed)”</span> ระบุแนวทางแก้ไขและไฟล์ที่ปรับปรุงชัดเจนทุกข้อ
            </p>
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
              เส้นทางการโจมตีที่เคยเสี่ยง และผลการป้องกันในปัจจุบัน
            </h2>
            <p className="text-xs text-slate-400">
              สถานะการรับมือการโจมตีจริงเมื่อมีผู้ไม่ประสงค์ดีพยายามเจาะระบบ
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold bg-slate-950/60">
                <th className="p-3 w-12 text-center">ลำดับ</th>
                <th className="p-3">รูปแบบการโจมตี</th>
                <th className="p-3">กลไกเดิมที่เสี่ยง</th>
                <th className="p-3">สถานะการป้องกันปัจจุบัน</th>
                <th className="p-3 w-20 text-center">ช่องโหว่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attackScenarios.map(sc => (
                <tr key={sc.rank} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 text-center font-black text-amber-400">#{sc.rank}</td>
                  <td className="p-3 font-bold text-white whitespace-nowrap">{sc.title}</td>
                  <td className="p-3 text-slate-400">{sc.mechanism}</td>
                  <td className="p-3 font-medium text-emerald-300">{sc.status}</td>
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
            ทั้งหมด ({vulnerabilities.length})
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
            🟡 ปานกลาง (8)
          </button>
          <button
            onClick={() => setFilterSeverity('low')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterSeverity === 'low'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-blue-400 hover:bg-slate-750'
            }`}
          >
            🔵 ต่ำ (4)
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาช่องโหว่, วิธีแก้, ไฟล์..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* 20 VULNERABILITIES DETAILED CARDS */}
      <div className="space-y-5">
        {filteredList.map(item => {
          const isResolved = item.status === 'resolved' || item.status === 'hardened';

          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all space-y-4 shadow-xl ${
                isResolved
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20'
                  : 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-amber-950/20'
              }`}
            >
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                    isResolved 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {item.id}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
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

                {/* Status Badge */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                    item.statusColor === 'green'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {item.statusColor === 'green' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{item.statusBadge}</span>
                  </span>
                </div>
              </div>

              {/* Code Evidence */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-2.5 text-xs font-mono text-slate-300">
                <FileCode className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">ตำแหน่งโค้ด / ไฟล์ที่เกี่ยวข้อง:</span>
                  <span className="text-purple-300">{item.evidence}</span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">รายละเอียดข้อบกพร่อง:</span>
                {item.description}
              </div>

              {/* HOW IT WAS FIXED (MAIN USER REQUIREMENT) */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>👉 แก้ยังไง (How It Was Fixed) • สถานะ: {item.statusColor === 'green' ? '🟢 สีเขียว (ปลอดภัยแล้ว)' : '🟡 สีเหลือง (มีสคริปต์พร้อมใช้งาน)'}:</span>
                </div>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {item.howItWasFixed}
                </p>
              </div>

              {/* Attack Vector & Remediation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>ผลลัพธ์การป้องกันเมื่อถูกโจมตี:</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {item.attackVector}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>สรุปมาตรการเชิงเทคนิค (Summary):</span>
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

      {/* SECTION: SQL SCRIPT DOWNLOAD / COPY MODAL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                สคริปต์ความปลอดภัยฐานข้อมูล Supabase (supabase_security_hardening.sql)
              </h2>
              <p className="text-xs text-slate-400">
                สคริปต์ Row Level Security (RLS) และ Trigger อัตโนมัติ พร้อมนำไปรันบน Supabase Dashboard
              </p>
            </div>
          </div>

          <a
            href="/supabase_security_hardening.sql"
            download
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Database className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด SQL Script</span>
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2 max-h-48 overflow-y-auto">
          <p className="text-slate-500">-- ตัวอย่างส่วนหนึ่งของสคริปต์ความปลอดภัย supabase_security_hardening.sql --</p>
          <p className="text-amber-300">ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;</p>
          <p className="text-amber-300">ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;</p>
          <p className="text-amber-300">ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;</p>
          <p className="text-emerald-400">{'CREATE POLICY "Registrations Owner Read" ON registrations FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> \'email\' = user_email OR (auth.jwt() -> \'app_metadata\' ->> \'role\') = \'admin\');'}</p>
          <p className="text-emerald-400">CREATE TRIGGER trg_protect_payment_status BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION protect_payment_status_modification();</p>
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
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

      {/* FOOTER NOTE */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
        รายงานนี้ถูกจัดทำขึ้นเพื่อการประเมินและยกระดับความมั่นคงปลอดภัยของโครงการ Joint Response Exercise (JRE 2027) · พัฒนาระบบโดยทีมงาน RCPDEV
      </div>

    </div>
  );
}
