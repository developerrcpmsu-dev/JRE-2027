import React, { useEffect, useMemo, useState } from 'react';
import AcademicPresentationSection from '../components/AcademicPresentationSection';
import {
  AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Code2, Copy,
  Database, Filter, Globe2, LockKeyhole, Printer, Search, ShieldCheck,
  Terminal, Wrench
} from 'lucide-react';

const findings = [
  {
    id: 'F-01', severity: 'critical', severityLabel: 'วิกฤต', cwe: 'CWE-200 / CWE-284', status: 'open',
    title: 'Anon อ่าน JSON user_accounts ที่เก็บ password_hash และ salt ได้',
    evidence: 'ตรวจแบบ read-only: Supabase REST project_settings?key=user_accounts',
    observed: 'HTTP 200; พบ 4 account records และฟิลด์ password_hash, salt อยู่ใน payload (รายงานนี้ไม่แสดงค่าบัญชีหรือค่า hash จริง)',
    impact: 'ผู้โจมตีที่มี public anon key สามารถเก็บ hash ไปทำ offline password guessing และเห็นข้อมูลบัญชีผู้ใช้ได้',
    fix: [
      'ย้ายการสมัคร/เข้าสู่ระบบไปใช้ Supabase Auth (bcrypt/หรือ Argon2 ฝั่งบริการ) และหยุดเก็บ password_hash/salt ใน JSON public',
      'ลบและหมุนเวียนบัญชี/รหัสผ่านที่อาจถูกเปิดเผย พร้อมตรวจสอบ audit log',
      'ลบ policy สาธารณะของ project_settings หรือแยก public settings กับ private account data เป็นคนละตาราง',
      'ทดสอบด้วย anon key อีกครั้ง: endpoint ต้องไม่คืน user_accounts หรือ password metadata'
    ],
    files: 'supabase_schema.sql, migration_v4.sql, src/supabase.js, Supabase policy state',
    test: 'GET project_settings?select=key,value&key=eq.user_accounts ด้วย anon key แล้วตรวจว่าไม่สามารถอ่านข้อมูลได้'
  },
  {
    id: 'F-02', severity: 'critical', severityLabel: 'วิกฤต', cwe: 'CWE-284: Improper Access Control', status: 'open',
    title: 'Schema/migrations สร้าง RLS policy แบบ public USING (true)',
    evidence: 'supabase_schema.sql:76-83, migration_v4.sql:37-47, migration_v5_merchandise.sql:31-38',
    observed: 'สคริปต์ hardening ลบชื่อ policy บางชื่อไม่ตรงกับ policy ที่ migration สร้าง จึงยังมีโอกาสเหลือ policy แบบ public หลังรันสคริปต์',
    impact: 'หาก policy เหล่านี้ถูกใช้งานจริง anon อาจอ่าน/เขียนข้อมูลผู้สมัคร การตั้งค่า และออเดอร์ได้เกินสิทธิ์',
    fix: [
      'ทำ inventory policy จริงจาก Supabase Dashboard/pg_policies ก่อนแก้ ไม่ใช้ชื่อ policy ที่คาดเดา',
      'DROP policy สาธารณะทุกชื่อที่มาจาก schema/migration และสร้าง policy owner/admin ใหม่แบบ allow-list',
      'ห้ามใช้ WITH CHECK (true) กับข้อมูลส่วนบุคคลหรือธุรกรรม',
      'ทำ regression test ด้วย anon, applicant และ admin role แยกกัน แล้วเก็บผล 401/403/allowed เป็นหลักฐาน'
    ],
    files: 'supabase_schema.sql, migration_v4.sql, migration_v5_merchandise.sql, supabase_security_hardening.sql',
    test: 'ตรวจ pg_policies และยิง REST read/write แบบไม่แก้ข้อมูล เพื่อยืนยัน policy ที่ใช้จริง'
  },
  {
    id: 'F-03', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-359: Exposure of Private Personal Information', status: 'open',
    title: 'Client เรียก registrations ทั้งตารางก่อนรู้ว่าเป็น Admin หรือไม่',
    evidence: "baseline: src/App.jsx:124-134 และ src/supabase.js:353-370 ใช้ unscoped .from('registrations').select('*'); working tree เปลี่ยนเป็น admin หรือ user_id/email scoped query",
    observed: 'ตอนตรวจ live database พบ registrations 0 แถว จึงยังไม่เห็น PII จาก endpoint ในช่วงเวลาตรวจ; local patch หยุด unscoped public fetch แล้ว แต่ RLS/server-side admin authorization ยังต้องยืนยันใน staging',
    impact: 'เมื่อมีผู้สมัครจริง ข้อมูลชื่อ โทรศัพท์ สุขภาพ และการชำระเงินอาจเข้า React state ของผู้ใช้ทั่วไป หาก RLS พลาด',
    fix: [
      'ผู้ใช้ทั่วไปต้องเรียก query ที่ filter user_id/email ฝั่งฐานข้อมูลเท่านั้น',
      'โหลดรายการทั้งหมดเฉพาะหลัง server-side admin session ผ่าน และแยกฟังก์ชัน getAdminRegistrations()',
      'ล้าง registrations state เมื่อ logout และห้ามใช้ localStorage เป็นแหล่งข้อมูลสิทธิ์',
      'ทดสอบด้วยข้อมูลจำลอง 2 บัญชีและยืนยันว่าแต่ละบัญชีเห็นได้เฉพาะแถวของตัวเอง'
    ],
    files: 'src/App.jsx, src/supabase.js',
    test: 'สร้าง test accounts แบบข้อมูลจำลอง แล้วตรวจ Network response ของผู้ใช้ทั่วไปว่าไม่มีแถวของคนอื่น'
  },
  {
    id: 'F-04', severity: 'critical', severityLabel: 'วิกฤต', cwe: 'CWE-798 / CWE-640', status: 'open',
    title: 'มี magic OTP 123456 และ 999999 ในโค้ดตรวจยืนยัน/รีเซ็ตรหัสผ่าน',
    evidence: 'baseline ก่อนแก้พบใน src/supabase.js และ GoogleLoginModal.jsx; หลัง deploy bundle scan ไม่พบ fallback path แต่ยังไม่มี functional OTP test กับบัญชี staging',
    observed: 'หลักฐานเดิมเป็น static analysis เท่านั้น; production ใช้ source ที่ลบ fallback แล้ว แต่ยังไม่ได้ส่งคำขอ reset หรือใช้กับบัญชีจริง จึงยังไม่ปิด finding อย่างเป็นทางการ',
    impact: 'ผู้ที่รู้ email อาจข้ามการยืนยันหรือรีเซ็ตรหัสผ่านโดยไม่ต้องครอบครอง OTP จริง',
    fix: [
      'ลบค่าคงที่ bypass ออกจาก production code ทันที',
      'กำหนด OTP expiry, one-time use, attempt limit และส่ง OTP ผ่าน provider ฝั่ง server',
      'ผูก reset flow กับ Supabase Auth recovery token แทนการตรวจใน browser',
      'เพิ่ม automated test ว่า OTP ปลอม/หมดอายุ/ใช้ซ้ำต้องถูกปฏิเสธ'
    ],
    files: 'src/supabase.js, src/components/GoogleLoginModal.jsx',
    test: 'ทดสอบเฉพาะใน staging ด้วย OTP ผิดและ OTP หมดอายุ ห้ามทดสอบบนบัญชี production'
  },
  {
    id: 'F-05', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-916: Insufficient Password Hashing Cost', status: 'open',
    title: 'รหัสผ่านผู้ใช้ถูก hash ด้วย SHA-256 รอบเดียวในฝั่ง Client',
    evidence: "src/utils/cryptoUtils.js:24-47 ใช้ crypto.subtle.digest('SHA-256') แล้วเก็บค่าไว้ใน client data",
    observed: 'เป็น fast hash ไม่ใช่ password KDF; salt ช่วยลด rainbow table แต่ไม่เพิ่ม cost ต่อการเดามากพอ',
    impact: 'หากฐานข้อมูล/JSON ถูกอ่าน ผู้โจมตีสามารถเดารหัสผ่านแบบ offline ได้เร็ว และ hash/salt ถูกส่งผ่านระบบ client-side',
    fix: [
      'ย้าย password verification ไป Supabase Auth หรือ backend KDF ที่มี cost control',
      'บังคับ password reset สำหรับบัญชีเดิมหลัง migration',
      'ไม่ส่ง password_hash/salt ใน public query หรือ profile payload',
      'อัปเดตเอกสารไม่เรียก SHA-256 แบบเดิมว่า OWASP-compliant password storage'
    ],
    files: 'src/utils/cryptoUtils.js, src/supabase.js, migration_v4.sql',
    test: 'ตรวจ production bundle/REST payload ต้องไม่มี password hash ของผู้ใช้และไม่มี client-side password verifier'
  },
  {
    id: 'F-06', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-798 / CWE-321', status: 'open',
    title: 'Serverless admin auth มี deterministic fallback salt/hash ใน source',
    evidence: 'baseline ก่อนแก้พบ deterministic fallback ใน api/admin-auth.js; หลัง deploy production ตอบ 503 เมื่อ server env ไม่ครบ ซึ่งยืนยัน fail-closed แต่ต้องตั้งค่าและทดสอบ login ใน staging',
    observed: 'baseline ก่อนแก้ตอบ 405/400; หลัง deploy production ตอบ 503 เมื่อยังไม่ยืนยัน server env ครบ ซึ่งเป็น fail-closed แต่ทำให้ Admin login ใช้งานไม่ได้จนกว่าจะตั้งค่า',
    impact: 'ถ้า production env ผิดหรือหาย ระบบอาจกลับไปใช้ credential fallback ที่เดา/แตกได้ และ session secret ผูกกับค่าเดิม',
    fix: [
      'ลบ fallback credential/hash/salt ออกจาก source และ fail closed ด้วย 503 เมื่อ ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET ไม่ครบ',
      'เปรียบเทียบ credential ที่มาจาก env ด้วย hash digest + timingSafeEqual โดยไม่ pad string แบบคาดเดา',
      'หมุนเวียน admin credential และ SESSION_SECRET หลัง deploy',
      'ใช้ durable rate limit store แทน in-memory Map ที่ไม่คงอยู่ข้าม serverless instance'
    ],
    files: 'api/admin-auth.js, .env.example, Vercel Environment Variables',
    test: 'ตรวจ bundle ไม่ควรมีค่า server secret; staging ที่ถอด env ต้องตอบ 503 ไม่ใช่ใช้ fallback'
  },
  {
    id: 'F-07', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-200 / CWE-798', status: 'open',
    title: 'Public bundle มีรหัสผ่านตัวอย่างจาก code diff ในหน้า presentation',
    evidence: 'production JS scan รอบ baseline พบ credential-like string จาก code example; bundle หลัง deploy สแกนซ้ำแล้วไม่พบ literal เดิม แต่ historical deployment/Git history ยังต้องจัดการตามนโยบาย retention',
    observed: 'นี่เป็นข้อความตัวอย่างในหน้า presentation ไม่ใช่เส้นทาง login ปัจจุบัน; current bundle ไม่พบ literal เดิม แต่ finding ยังติดตามเพื่อยืนยัน cache/history cleanup',
    impact: 'สร้างความสับสนว่าเป็น credential จริง และทำให้ secret-like value ถูกเก็บถาวรใน CDN/cache หรือ search index',
    fix: [
      'แทนค่า credential ในตัวอย่างด้วย <REDACTED> และระบุว่าเป็น pseudocode',
      'เพิ่ม CI secret scan ที่ตรวจทั้ง source และ dist ก่อน deploy',
      'ลบ/rotate ค่าเดิมจากประวัติ Git และ Vercel deployment หากเป็น credential ที่เคยใช้งานจริง'
    ],
    files: 'src/components/AcademicPresentationSection.jsx, dist/assets/index-*.js',
    test: 'หลัง build ให้ค้นหา credential-like literals, VITE_*_PASSWORD และ secret patterns แล้วต้องไม่พบค่าจริง'
  },
  {
    id: 'F-08', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-1321 / CWE-1333 / CWE-674', status: 'open',
    title: 'npm audit พบ dependency vulnerabilities 10 รายการ',
    evidence: 'npm audit --json ณ 7–8 ตุลาคม 2569: high 6, moderate 4, critical 0',
    observed: 'พบ xlsx direct dependency (Prototype Pollution/ReDoS), tailwindcss dependency chain (braces/micromatch/fast-glob) และ exceljs/uuid',
    impact: 'ความเสี่ยงขึ้นกับ data flow; xlsx ใช้ export-only ในโค้ดปัจจุบัน จึงลดโอกาส exploit แต่ยังไม่ใช่การแก้ dependency',
    fix: [
      'อัปเดต/เปลี่ยน SheetJS xlsx เป็นเวอร์ชันที่มี fix หรือใช้ exporter ที่ไม่ parse workbook จากผู้ใช้',
      'อัปเดต Tailwind/PostCSS ตาม compatibility plan และทดสอบ build',
      'ตั้ง npm audit ใน CI เป็น gate พร้อมบันทึก exception ที่มี owner/วันหมดอายุ',
      'จำกัดการ parse ไฟล์ที่ผู้ใช้อัปโหลดด้วย sandbox, size/type limits และ fixture tests'
    ],
    files: 'package.json, package-lock.json, src/utils/excelExporter.js',
    test: 'npm audit --audit-level=high และ npm run build หลังอัปเดต dependency'
  },
  {
    id: 'F-09', severity: 'medium', severityLabel: 'ปานกลาง', cwe: 'CWE-602 / CWE-307', status: 'open',
    title: 'การควบคุมสิทธิ์และ rate limit หลายส่วนยังพึ่ง Client-side guard',
    evidence: 'src/App.jsx มี guard isAdmin; data mutations อยู่ใน Supabase client; debounce ไม่ใช่ server-side rate limit',
    observed: 'ยังไม่พบหลักฐานว่าทุก mutation มี server-side authorization/rate limit ที่ผูกกับ identity จริง',
    impact: 'ผู้โจมตีสามารถข้าม UI แล้วสร้างคำขอโดยตรงได้ หาก RLS/endpoint ไม่ได้บังคับซ้ำ',
    fix: [
      'บังคับ authorization ที่ database policy หรือ server endpoint ทุก mutation',
      'เพิ่ม per-user/IP rate limit ฝั่ง server และ audit log สำหรับ login, upload, register, reset',
      'ใช้ idempotency key กับการสมัคร/ชำระเงิน และไม่พึ่งปุ่ม disabled อย่างเดียว',
      'ทำ abuse test ใน staging เท่านั้น'
    ],
    files: 'src/App.jsx, src/supabase.js, Supabase RLS, api/*',
    test: 'ส่ง request ตรงจาก test client โดยไม่ผ่าน UI แล้วต้องถูกปฏิเสธเมื่อไม่มี owner/admin claim'
  },
  {
    id: 'F-10', severity: 'low', severityLabel: 'ต่ำ', cwe: 'CWE-942: Overly Permissive CORS', status: 'open',
    title: 'CORS ตรวจ origin ด้วย startsWith ใน serverless handlers',
    evidence: 'baseline ก่อนแก้พบ startsWith ใน api/file.js และ api/admin-auth.js; หลัง deploy OPTIONS จาก evil.example และ prefix-confusion origin ไม่ถูกสะท้อน และคืน official origin แทน',
    observed: 'source baseline มีความเสี่ยง prefix-confusion; production patch ผ่าน safe preflight check แล้ว แต่ยังควรเก็บ regression test เป็น CI evidence ก่อนปิด finding',
    impact: 'ลดความแม่นยำของ origin policy และทำให้การ review/incident response ยากขึ้น',
    fix: [
      'ใช้ allowedOrigins.includes(origin) และ normalize origin ด้วย URL parser',
      'ไม่ตั้ง Access-Control-Allow-Origin เป็น * สำหรับ endpoint ที่เกี่ยวกับข้อมูลผู้ใช้',
      'เพิ่ม preflight tests สำหรับ evil.example และโดเมนที่มี prefix คล้ายกัน'
    ],
    files: 'api/file.js, api/admin-auth.js, vercel.json',
    test: 'OPTIONS จาก origin ที่ไม่อยู่ใน allow-list ต้องไม่คืน origin ของผู้โจมตี'
  }
];

const verifiedControls = [
  ['Build', 'npm run build ผ่าน (Vite exit 0)'],
  ['Headers', 'หน้าเว็บจริงส่ง X-Frame-Options: DENY, nosniff, HSTS, Referrer-Policy และ Permissions-Policy'],
  ['Admin API', 'baseline GET/POST ว่างได้ 405/400; หลัง deployตอบ 503 เมื่อ env ไม่ครบ ซึ่งเป็น fail-closed และยังไม่ได้ลอง credential จริง'],
  ['CORS preflight', 'Origin ภายนอกไม่ถูกสะท้อนกลับเป็น allow-origin ของผู้โจมตี'],
  ['File API', 'GET /api/file ที่ไม่มี id ได้ 400'],
  ['Discovery', '/.well-known/security.txt และ /robots.txt เปิดอ่านได้จริง'],
  ['Burp passive proxy', 'listener 127.0.0.1:8080 รับ safe GET/OPTIONS 11 requests; ไม่มี active scan หรือ credential test']
];

const severityMeta = {
  critical: { label: 'วิกฤต', badge: '🔴' },
  high: { label: 'สูง', badge: '🟠' },
  medium: { label: 'ปานกลาง', badge: '🟡' },
  low: { label: 'ต่ำ', badge: '🔵' }
};

export default function SecurityAuditView({ onNavigateHome, onNavigateAdmin, subRoute, onSwitchSubRoute }) {
  const [activeTab, setActiveTab] = useState(subRoute === 'audit' ? 'audit' : 'presentation');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => setActiveTab(subRoute === 'audit' ? 'audit' : 'presentation'), [subRoute]);
  const setTab = (tab) => { setActiveTab(tab); onSwitchSubRoute?.(tab); };
  const reportUrl = typeof window === 'undefined' ? 'https://jre-2027.vercel.app/security' : `${window.location.origin}/${activeTab === 'audit' ? 'security' : 'presentation'}`;
  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return findings.filter((item) => {
      const severityOk = filterSeverity === 'all' || item.severity === filterSeverity;
      const searchOk = !q || [item.id, item.title, item.cwe, item.evidence, item.files, item.impact].join(' ').toLowerCase().includes(q);
      return severityOk && searchOk;
    });
  }, [filterSeverity, searchQuery]);
  const copyUrl = async () => { try { await navigator.clipboard?.writeText(reportUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 1800); } catch { setCopiedUrl(false); } };

  return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 flex-wrap">{onNavigateHome && <button onClick={onNavigateHome} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> หน้าแรก</button>}{onNavigateAdmin && <button onClick={onNavigateAdmin} className="px-3 py-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5"><LockKeyhole className="w-3.5 h-3.5" /> ระบบ Admin</button>}</div>
      <div className="flex items-center gap-2 flex-wrap"><button onClick={copyUrl} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> {copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</button><button onClick={() => window.print()} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> พิมพ์ / PDF</button></div>
    </div>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl"><div className="grid grid-cols-2 gap-2"><button onClick={() => setTab('presentation')} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 ${activeTab === 'presentation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Code2 className="w-4 h-4" /> นำเสนอ AI & MCP</button><button onClick={() => setTab('audit')} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 ${activeTab === 'audit' ? 'bg-rose-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><ShieldCheck className="w-4 h-4" /> รายงานหลักฐาน</button></div><span className="text-xs font-mono text-slate-500 px-3">{reportUrl}</span></div>
    {activeTab === 'presentation' ? <AcademicPresentationSection onSwitchToAudit={() => setTab('audit')} onNavigateHome={onNavigateHome} /> : <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 border-2 border-rose-500/40 p-6 sm:p-10 shadow-2xl"><div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"><div className="space-y-3"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider"><AlertTriangle className="w-4 h-4" /> Evidence-based security audit</div><h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">รายงานตรวจสอบความปลอดภัยเว็บ JRE 2027</h1><p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">เป้าหมาย: <a className="text-amber-300 underline" href="https://jre-2027.vercel.app" target="_blank" rel="noopener noreferrer">https://jre-2027.vercel.app</a> · ตรวจซอร์สในเครื่อง, production HTTP surface และ Supabase policy แบบ read-only</p><div className="flex flex-wrap gap-3 text-[11px] text-slate-400"><span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5 text-amber-400" /> ตรวจเมื่อ 7–8 ตุลาคม 2569 (2026)</span><span>•</span><span className="text-rose-300 font-bold">สถานะ: ยังไม่ผ่านการรับรอง / มีประเด็นเปิดอยู่</span></div></div><div className="p-5 bg-slate-950/90 border border-rose-500/40 rounded-2xl text-center shrink-0 w-full lg:w-56 shadow-xl"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">ประเด็นที่ต้องแก้</span><div className="text-5xl font-black text-rose-300 mt-1">{findings.length}</div><span className="text-[11px] text-rose-200 font-semibold block mt-1">ยังเปิดอยู่จาก static/live evidence</span></div></div></section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Critical" value={findings.filter((f) => f.severity === 'critical').length} color="rose" note="ต้องหยุดก่อน deploy" /><Metric label="High" value={findings.filter((f) => f.severity === 'high').length} color="orange" note="แก้ในรอบ hardening" /><Metric label="Medium/Low" value={findings.filter((f) => f.severity === 'medium' || f.severity === 'low').length} color="amber" note="ปรับปรุงตามลำดับ" /><Metric label="Verified controls" value={verifiedControls.length} color="emerald" note="ไม่ใช่การปิดช่องโหว่ทั้งหมด" /></section>
      <section className="p-5 sm:p-7 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-3"><div className="flex items-center gap-2 text-amber-300 font-black"><AlertCircle className="w-5 h-5" /> อ่านสรุปนี้ก่อนนำเสนอ</div><p className="text-sm text-slate-200 leading-relaxed">ผลตรวจนี้ไม่ใช่ penetration-test certification และไม่ได้ลองรหัสผ่านจริง ไม่ได้แก้/ลบข้อมูล production และยังไม่ได้ยืนยันว่า RLS hardening ถูกนำไปรันบน Supabase แล้ว จึงใช้คำว่า “พบจากหลักฐาน” และ “ต้องแก้” แทนการอ้างว่าแก้ครบทุกประเด็นหรือไม่มีความเสี่ยงเหลือ</p></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"><SectionTitle title="ขอบเขตและวิธีตรวจที่ทำจริง" subtitle="คำสั่ง read-only และการตรวจซอร์สที่ทำซ้ำได้" /><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"><EvidenceRow title="SAST / source review" text="rg ตรวจ auth, RLS, OTP, secrets, client data flow และ code snippets" /><EvidenceRow title="Build / dependency" text="npm run build ผ่าน; npm audit พบ high 6 และ moderate 4" /><EvidenceRow title="Production HTTP" text="GET หน้าเว็บ, API method checks, headers, security.txt และ robots.txt" /><EvidenceRow title="Burp passive proxy" text="listener 127.0.0.1:8080 รับ safe GET/OPTIONS 11 requests; ไม่ทำ active scan และไม่ส่ง credential" /><EvidenceRow title="Supabase metadata" text="อ่าน count/field names แบบไม่แสดง PII และไม่แก้ไขข้อมูล" /></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-3">หลักฐาน</th><th className="p-3">ผลที่ยืนยันได้</th></tr></thead><tbody className="divide-y divide-slate-800">{verifiedControls.map(([name, text]) => <tr key={name}><td className="p-3 font-bold text-emerald-300 whitespace-nowrap">{name}</td><td className="p-3 text-slate-300">{text}</td></tr>)}</tbody></table></div></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"><SectionTitle title="ภาพประกอบและแผนภาพระบบ" subtitle="ใช้ภาพแนบเป็น diagram และหลักฐาน Burp แบบ passive; สถานะจริงอยู่ในตาราง findings" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Figure src="/images/security/security-architecture.svg" alt="Security architecture diagram" caption="ภาพที่ 1: เครื่องมือทดสอบ, MCP, source และ production" /><Figure src="/images/security/mcp-audit-sequence.svg" alt="MCP audit sequence diagram" caption="ภาพที่ 2: ลำดับงาน audit/patch ตาม diagram ที่แนบ" /><Figure src="/images/security/burp-passive-crawl-before.png" alt="Burp Suite passive crawl before traffic" caption="ภาพที่ 3: Burp ก่อนส่ง traffic — passive crawl ยังมี 0 items" /></div><p className="text-xs text-slate-400">หลังจากนั้นใช้ Burp listener 127.0.0.1:8080 รับ safe GET/OPTIONS จำนวน 11 requests; ไม่ทำ active scan, ไม่ส่ง credential และไม่ใช้ destructive payload</p></section>
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800"><div className="flex items-center gap-2 flex-wrap"><Filter className="w-4 h-4 text-slate-400" />{['all', 'critical', 'high', 'medium', 'low'].map((value) => <button key={value} onClick={() => setFilterSeverity(value)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filterSeverity === value ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{value === 'all' ? `ทั้งหมด (${findings.length})` : `${severityMeta[value].badge} ${severityMeta[value].label} (${findings.filter((f) => f.severity === value).length})`}</button>)}</div><div className="relative min-w-[220px]"><Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหา ID, CWE, ไฟล์..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-rose-500" /></div></section>
      <section className="space-y-5">{filteredFindings.map((item) => <FindingCard key={item.id} item={item} />)}{filteredFindings.length === 0 && <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">ไม่พบรายการที่ตรงกับตัวกรอง</div>}</section>
      <section className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-4"><SectionTitle title="ลำดับการแก้ไขที่แนะนำ" subtitle="ทำตามลำดับนี้ใน staging ก่อน deploy production" /><ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200 list-decimal list-inside"><li>หยุด public exposure ของ user_accounts และหมุน credential ที่อาจรั่ว</li><li>แก้/รัน RLS migration พร้อมตรวจ pg_policies จริง</li><li>ลบ magic OTP และ default auth fallback; ตั้ง server env ให้ครบ</li><li>แยก query owner/admin และเพิ่ม server-side rate limit</li><li>อัปเดต dependencies และเพิ่ม secret scan ใน CI</li><li>รัน regression test แบบ anon/applicant/admin แล้วบันทึก response</li></ol></section>
      <section className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 leading-relaxed"><p><strong className="text-white">ไฟล์รายงานสำหรับส่งอาจารย์:</strong> มีฉบับ Markdown ใน workspace และลิงก์ดาวน์โหลดจากหน้าเว็บหลัง deploy: <code className="text-amber-300">/SECURITY_AUDIT_REPORT.md</code></p><p className="mt-2">เครื่องมือที่สถานะยืนยัน: Burp Suite Community ติดตั้งแล้วและรับ safe traffic ผ่าน listener 127.0.0.1:8080 จำนวน 11 requests, Claude Desktop มีอยู่และเพิ่ม MCP filesystem เฉพาะโฟลเดอร์โปรเจกต์, Kali/WSL ยังต้องใช้สิทธิ์ Administrator, DVWA ยังไม่ได้ติดตั้งใน lab แยก</p></section>
    </>}
  </div>;
}

function Metric({ label, value, color, note }) { const colors = { rose: 'border-rose-500/40 text-rose-300', orange: 'border-orange-500/40 text-orange-300', amber: 'border-amber-500/40 text-amber-300', emerald: 'border-emerald-500/40 text-emerald-300' }; return <div className={`p-4 rounded-2xl bg-slate-900 border ${colors[color]}`}><span className="text-[10px] uppercase font-black block">{label}</span><span className="text-3xl font-black text-white block mt-1">{value}</span><span className="text-[10px] text-slate-500">{note}</span></div>; }
function SectionTitle({ title, subtitle }) { return <div><h2 className="text-base sm:text-lg font-black text-white">{title}</h2><p className="text-xs text-slate-400 mt-0.5">{subtitle}</p></div>; }
function EvidenceRow({ title, text }) { return <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800"><p className="font-bold text-white">{title}</p><p className="text-slate-400 mt-1 leading-relaxed">{text}</p></div>; }
function Figure({ src, alt, caption }) { return <figure className="rounded-2xl bg-slate-950 border border-slate-800 p-3"><img src={src} alt={alt} className="w-full h-auto rounded-xl bg-slate-950" loading="lazy" /><figcaption className="text-[11px] text-slate-400 mt-2 text-center">{caption}</figcaption></figure>; }
function FindingCard({ item }) { const meta = severityMeta[item.severity]; return <article className="p-6 rounded-3xl border shadow-xl space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/20 border-rose-500/35"><div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-800 pb-3"><div><div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-black">{item.id}</span><span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-black">{meta.badge} {item.severityLabel}</span><span className="text-[11px] font-mono text-slate-500">{item.cwe}</span></div><h3 className="text-base sm:text-lg font-black text-white mt-2">{item.title}</h3></div><span className="px-3 py-1 rounded-xl text-xs font-bold border whitespace-nowrap bg-rose-500/15 text-rose-300 border-rose-500/40">🔴 เปิดอยู่ / ต้องแก้</span></div><div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">หลักฐาน / ไฟล์</span><span className="text-sky-300 break-words">{item.evidence}</span><span className="text-slate-500 block mt-1 break-words">{item.files}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"><div><p className="font-bold text-white mb-1">สิ่งที่สังเกตได้</p><p className="text-slate-300 leading-relaxed">{item.observed}</p></div><div><p className="font-bold text-rose-300 mb-1">ผลกระทบ</p><p className="text-slate-300 leading-relaxed">{item.impact}</p></div></div><div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30"><p className="font-black text-emerald-300 text-sm mb-2">🛠️ วิธีแก้และขั้นตอนยืนยันผล</p><ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200">{item.fix.map((step, index) => <li key={index}>{step}</li>)}</ol></div><div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs"><span className="font-bold text-amber-300">การทดสอบที่ปลอดภัย: </span><span className="text-slate-300">{item.test}</span></div></article>; }
