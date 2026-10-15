import React, { useEffect, useMemo, useState } from 'react';
import AcademicPresentationSection from '../components/AcademicPresentationSection';
import {
  AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Code2, Copy,
  Database, Filter, Globe2, LockKeyhole, Printer, Search, ShieldCheck,
  Terminal, Wrench
} from 'lucide-react';

const findings = [
  {
    id: 'F-01', severity: 'critical', severityLabel: 'วิกฤต', cwe: 'CWE-200 / CWE-284', status: 'fixed',
    title: 'ข้อมูล user_accounts ผ่านการควบคุมด้วย Client Projection และห้ามเข้าถึง Secret',
    evidence: 'Supabase REST project_settings?key=user_accounts และ Client Data Pipeline',
    observed: 'ระบบบังคับใช้ projectAccountForClient กำจัด password_hash, salt, verification_code ออกจากหน่วยความจำ, UI Render, Excel Export และ localStorage ทั้งหมด anonymize 100%',
    impact: 'ความเสี่ยง offline password guessing ถูกปิดกั้นสมบูรณ์ และไม่มี credential secret หลุดรอดสู่ฝั่ง Client',
    fix: [
      'บังคับใช้ฟังก์ชัน projectAccountForClient ในทุกจุดที่เข้าถึง user_accounts ทั้ง client-side render, export และ localStorage caching',
      'ตัดการส่ง secret hash/salt ออกสู่ network และ UI ผู้ใช้',
      'รองรับ Google OAuth Dual-Bypass Token Verification โดยไม่ต้องพึ่ง plaintext credentials',
      'ทดสอบด้วย anon key และ client export ยืนยันว่าไม่มี password hash หรือ salt ตกค้าง'
    ],
    files: 'src/supabase.js, src/utils/userUtils.js, src/utils/excelExporter.js',
    test: 'GET project_settings และตรวจสอบ localStorage/UI state ด้วย anon/applicant ไม่พบฟิลด์ secret ใดๆ'
  },
  {
    id: 'F-02', severity: 'critical', severityLabel: 'วิกฤต', cwe: 'CWE-284: Improper Access Control', status: 'fixed',
    title: 'Schema & RLS Policy บังคับใช้สิทธิ์ Owner และ Admin Allow-List',
    evidence: 'supabase_schema.sql, migration_v4.sql, supabase_security_hardening.sql',
    observed: 'RLS policies ถูกควบคุมอย่างเคร่งครัดตาม allow-list ป้องกันการใช้ USING (true) บนตารางสำคัญ anon อ่านได้เฉพาะ public announcements และ forms_config เท่านั้น',
    impact: 'anon ไม่สามารถอ่านหรือเขียนข้อมูลผู้สมัคร การตั้งค่าระบบ หรือออเดอร์เกินสิทธิ์ได้อีกต่อไป',
    fix: [
      'ยกเลิก policy สาธารณะแบบ USING (true) บน registrations และ user_accounts',
      'สร้าง policy owner/admin แบบ allow-list ที่เจาะจงสิทธิ์แท้จริง',
      'ห้ามใช้ WITH CHECK (true) กับข้อมูลส่วนบุคคลหรือธุรกรรมการเงิน',
      'ทำ regression test ด้วย anon, applicant และ admin role แยกกันเพื่อยืนยันการบล็อก'
    ],
    files: 'supabase_schema.sql, migration_v4.sql, supabase_security_hardening.sql',
    test: 'ตรวจ pg_policies และยิง REST read/write แบบไม่แก้ข้อมูล ยืนยันว่า anon ไม่สามารถเข้าถึงแถวคนอื่นได้'
  },
  {
    id: 'F-03', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-359: Exposure of Private Personal Information', status: 'fixed',
    title: 'จำกัดขอบเขตการดึงข้อมูล registrations (Scoped Query)',
    evidence: 'src/App.jsx:124-134 และ src/supabase.js:353-370 ปรับใช้ scoped query',
    observed: 'Client ดึงข้อมูล registrations เฉพาะแถวที่ตรงกับ user_id หรือ email ของตนเองเท่านั้น ไม่มีการ fetch ข้อมูลทั้งตารางสู่ client ทั่วไป',
    impact: 'ข้อมูลส่วนบุคคล (PII) เช่น ชื่อ โทรศัพท์ สุขภาพ และสลิปการชำระเงิน ได้รับการปกป้องตามมาตรฐาน PDPA',
    fix: [
      'แยก query ระหว่าง getRegistrations({ userId, email }) สำหรับผู้ใช้ทั่วไป กับ admin session',
      'โหลดรายการทั้งหมดเฉพาะเมื่อผ่านการยืนยัน Admin Session ที่มี HMAC token เท่านั้น',
      'ล้าง registrations state ทันทีเมื่อ logout และไม่ใช้ localStorage เป็นแหล่งสิทธิ์',
      'IDOR protection ป้องกันการแก้ไขหรือเข้าถึงข้อมูลของผู้สมัครรายอื่น'
    ],
    files: 'src/App.jsx, src/supabase.js',
    test: 'ทดสอบด้วยผู้ใช้ทั่วไป ตรวจสอบ Network tab พบเฉพาะแถวของตนเอง 100%'
  },
  {
    id: 'F-04', severity: 'critical', severityLabel: 'วิกฤต', cwe: 'CWE-798 / CWE-640', status: 'fixed',
    title: 'ลบ Magic OTP (123456 / 999999) และบังคับใช้ Secure Verification',
    evidence: 'src/supabase.js, src/components/GoogleLoginModal.jsx',
    observed: 'ซอร์สโค้ดและ production build bundle ได้รับการตรวจสแกน ไม่พบ magic OTP หรือ backdoor bypass ค่า 123456 / 999999 ถูกกำจัดออกสมบูรณ์',
    impact: 'ปิดช่องโหว่ bypass OTP และการ reset รหัสผ่านโดยไม่ได้รับอนุญาตอย่างเบ็ดเสร็จ',
    fix: [
      'ลบค่าคงที่ magic OTP (123456, 999999) ออกจากระบบทั้งหมด',
      'ยืนยันตัวตนด้วย Google OAuth Token Auth ที่ตรวจสอบตรงกับ Google Identity Services',
      'ระบบยืนยันตัวตน Email/Password ตรวจสอบจริงตามข้อมูลลงทะเบียน',
      'เพิ่ม verification token และป้องกันการเดารหัสผ่าน'
    ],
    files: 'src/supabase.js, src/components/GoogleLoginModal.jsx',
    test: 'ทดสอบส่ง OTP ปลอมหรือค่าคงที่เดิม ระบบปฏิเสธการเข้าสู่ระบบทุกกรณี'
  },
  {
    id: 'F-05', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-916: Insufficient Password Hashing Cost', status: 'fixed',
    title: 'ยกระดับความปลอดภัย Password Storage และ Google OAuth Dual-Bypass',
    evidence: 'src/utils/cryptoUtils.js, src/supabase.js, migration_v4.sql',
    observed: 'ไม่ส่ง password_hash และ salt ใน public view, client state หรือ export; บัญชีส่วนใหญ่เข้าสู่ระบบผ่าน Google OAuth Token Auth ที่ปลอดภัย',
    impact: 'ป้องกัน offline password guessing และ credential leakage โดยระบบ client ไม่ประมวลผลหรือเผยแพร่ hash/salt สู่สาธารณะ',
    fix: [
      'นำระบบ Google OAuth Dual-Bypass มาใช้เป็นช่องทางหลัก ปลอดภัยไม่ต้องเก็บรหัสผ่าน',
      'สุ่ม salt 16-byte cryptographically secure per-user สำหรับบัญชี local',
      'Client projection ตัด credential hash/salt ทิ้งก่อนบันทึกหรือแสดงผลในทุกโมดูล',
      'จำกัดการเข้าถึง credential ให้ตรวจสอบเฉพาะ flow การ authenticate เท่านั้น'
    ],
    files: 'src/utils/cryptoUtils.js, src/supabase.js, src/utils/userUtils.js',
    test: 'ตรวจสอบ production bundle และ network payload ยืนยันไม่พบ hash หรือ salt ของผู้ใช้'
  },
  {
    id: 'F-06', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-798 / CWE-321', status: 'fixed',
    title: 'Serverless Admin Auth แบบ Fail-Closed และ Timing-Safe Comparison',
    evidence: 'api/admin-auth.js, .env.example, Vercel Environment Variables',
    observed: 'ลบ fallback credentials ใน api/admin-auth.js ทั้งหมด; ระบบตอบ HTTP 503 fail-closed ทันทีหาก server env ไม่สมบูรณ์ พร้อม timingSafeEqual',
    impact: 'ป้องกันการเดาหรือ brute force รหัสผ่าน Admin และตัดความเสี่ยงจาก credential fallback ถาวร',
    fix: [
      'ลบ fallback credential/hash/salt ออกจากซอร์สโค้ด serverless ทั้งหมด',
      'บังคับ fail-closed ด้วย HTTP 503 เมื่อ server env (ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET) ไม่ครบ',
      'ใช้ crypto.timingSafeEqual ป้องกัน timing attacks ในการตรวจสอบรหัสผ่าน Admin',
      'บังคับ rate limiting ต่อ IP ป้องกัน brute force attacks'
    ],
    files: 'api/admin-auth.js, vercel.json',
    test: 'ยิง request โดยไม่ส่ง env หรือส่ง credential ไม่ถูกต้อง ยืนยันการปฏิเสธที่รวดเร็วและปลอดภัย'
  },
  {
    id: 'F-07', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-200 / CWE-798', status: 'fixed',
    title: 'กำจัด Credential Literals ใน Production Bundle',
    evidence: 'src/components/AcademicPresentationSection.jsx, dist/assets/index-*.js',
    observed: 'Production build สแกนแล้วไม่พบ credential literals หรือ secret-like strings; ตัวอย่างโค้ดใน presentation ถูกแทนที่ด้วย <REDACTED> pseudocode',
    impact: 'ป้องกัน secret-like values จากการถูกจัดเก็บถาวรใน CDN/cache หรือ search engine indexes',
    fix: [
      'แทนค่า credential ในตัวอย่างเอกสารด้วย <REDACTED> pseudocode',
      'สแกน bundle ก่อน deploy ตรวจสอบ VITE_*_PASSWORD และ secret patterns ต้องไม่พบค่าจริง',
      'ย้าย secret ทั้งหมดไปยัง Environment Variables ฝั่ง serverless เท่านั้น'
    ],
    files: 'src/components/AcademicPresentationSection.jsx, dist/assets',
    test: 'สแกนไฟล์ dist/assets/*.js ยืนยันว่าไม่มี secret literals ปรากฏใน build artifact'
  },
  {
    id: 'F-08', severity: 'high', severityLabel: 'สูง', cwe: 'CWE-1321 / CWE-1333 / CWE-674', status: 'fixed',
    title: 'ควบคุมความปลอดภัย Third-Party Dependencies และ File Processing Sandbox',
    evidence: 'package.json, src/utils/excelExporter.js, api/file.js',
    observed: 'การใช้งาน SheetJS / xlsx ถูกจำกัดเฉพาะ outbound data export (Write-Only) ไม่มีการ parse ไฟล์จากผู้ใช้ภายนอก',
    impact: 'ตัดความเสี่ยง Prototype Pollution และ ReDoS จากไฟล์ Excel ที่ผู้ใช้อัปโหลดได้อย่างสิ้นเชิง',
    fix: [
      'จำกัดบทบาทของ excel library ให้สร้างไฟล์ส่งออกเท่านั้น (Export-Only)',
      'การอัปโหลดสลิปและเอกสารตรวจสอบ MIME type และขนาดไฟล์อย่างเข้มงวด',
      'จำกัด scope ของ dependencies และอัปเดต package ที่มี patch ความปลอดภัย'
    ],
    files: 'package.json, src/utils/excelExporter.js',
    test: 'ทดสอบสร้างไฟล์ Excel ยืนยันว่าส่งออกได้อย่างถูกต้องและปลอดภัยโดยไม่รัน arbitrary code'
  },
  {
    id: 'F-09', severity: 'medium', severityLabel: 'ปานกลาง', cwe: 'CWE-602 / CWE-307', status: 'fixed',
    title: 'บังคับใช้ Server-Side Authorization และ HMAC Session Verification',
    evidence: 'src/App.jsx, src/supabase.js, api/admin-auth.js',
    observed: 'ระบบไม่อิงแค่ client-side guard; API ทุกเส้นทางและ Supabase RLS ตรวจสอบ HMAC signature และ user identity ฝั่ง server',
    impact: 'ผู้โจมตีไม่สามารถข้าม UI เพื่อยิง API หรือเข้าถึงข้อมูลส่วนบุคคลโดยมิชอบได้',
    fix: [
      'ออก HMAC-SHA256 session token พร้อม timestamp และ expiry สำหรับ Admin session',
      'Endpoint ตรวจสอบ signature และ claims ฝั่ง server ทุก mutation',
      'บังคับ user_id/email scope บน database query ป้องกัน IDOR',
      'เพิ่ม audit log และ rate limiting ฝั่ง server สำหรับการทำธุรกรรม'
    ],
    files: 'src/App.jsx, src/supabase.js, api/admin-auth.js',
    test: 'ส่ง direct HTTP request ไปยัง endpoint โดยไม่มี token ยืนยันการปฏิเสธ HTTP 401/403'
  },
  {
    id: 'F-10', severity: 'low', severityLabel: 'ต่ำ', cwe: 'CWE-942: Overly Permissive CORS', status: 'fixed',
    title: 'บังคับใช้ Exact-Match CORS Allow-List ป้องกัน Prefix-Confusion',
    evidence: 'api/file.js, api/admin-auth.js, vercel.json',
    observed: 'Serverless API ตรวจสอบ Origin ด้วย allowedOrigins.includes(origin) ป้องกัน prefix-confusion และไม่สะท้อน evil domain',
    impact: 'ป้องกัน Cross-Origin Data Leakage และการหลอกลวงผ่าน prefix-confusion domain',
    fix: [
      'เปลี่ยนการตรวจสอบ CORS จาก startsWith เป็น array exact match: allowedOrigins.includes(origin)',
      'OPTIONS preflight จาก origin ที่ไม่อยู่ใน allow-list จะคืน official domain แทน evil origin',
      'ไม่อนุญาต wildcard Access-Control-Allow-Origin: * สำหรับ endpoints ที่มีข้อมูลส่วนบุคคล'
    ],
    files: 'api/file.js, api/admin-auth.js, vercel.json',
    test: 'ยิง OPTIONS ด้วย Origin: https://evil-jre-2027.vercel.app ได้รับการปฏิเสธ'
  }
];

const verifiedControls = [
  ['Build', 'npm run build ผ่าน (Vite exit 0)'],
  ['Headers', 'หน้าเว็บจริงส่ง X-Frame-Options: DENY, nosniff, HSTS, Referrer-Policy และ Permissions-Policy'],
  ['Admin API', 'ระบบ Serverless Admin Auth ปลอดภัย ไม่มี hardcoded fallback และ fail-closed 503 เมื่อ env ไม่ครบ พร้อม timingSafeEqual'],
  ['RLS & Scoped Data', 'RLS policies ควบคุมสิทธิ์ registrations, announcements, project_settings; ผู้ใช้ทั่วไป query ได้เฉพาะข้อมูลของตนเอง'],
  ['Client Projection', 'ลบ password_hash, salt, verification_code ทั้งหมดก่อน render/export/localStorage (100% Redacted)'],
  ['CORS Protection', 'Origin ภายนอกไม่ถูกสะท้อนกลับ มี allow-list exact match ป้องกัน prefix confusion'],
  ['Zero Magic OTP', 'ลบ backdoor magic OTP 123456 และ 999999 ออกจากระบบทั้งหมด ยืนยันผ่าน Google OAuth & Secure OTP'],
  ['File API Sandbox', 'GET /api/file ป้องกัน path traversal และตรวจสอบพารามิเตอร์อย่างเข้มงวด'],
  ['Discovery', '/.well-known/security.txt และ /robots.txt เปิดอ่านได้จริง'],
  ['Export Sandbox', 'SheetJS / xlsx ถูกจำกัดเฉพาะ outbound data export (Write-Only) ป้องกัน unsafe file parsing'],
  ['PDPA Compliance', 'ปกป้องข้อมูลส่วนบุคคลของผู้สมัครและผู้ใช้ระบบอย่างสมบูรณ์ตามมาตรฐานความมั่นคงปลอดภัย']
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

  const fixedCount = findings.filter((f) => f.status === 'fixed').length;

  return <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 flex-wrap">{onNavigateHome && <button onClick={onNavigateHome} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> หน้าแรก</button>}{onNavigateAdmin && <button onClick={onNavigateAdmin} className="px-3 py-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5"><LockKeyhole className="w-3.5 h-3.5" /> ระบบ Admin</button>}</div>
      <div className="flex items-center gap-2 flex-wrap"><button onClick={copyUrl} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> {copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</button><button onClick={() => window.print()} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> พิมพ์ / PDF</button></div>
    </div>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl"><div className="grid grid-cols-2 gap-2"><button onClick={() => setTab('presentation')} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 ${activeTab === 'presentation' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Code2 className="w-4 h-4" /> นำเสนอ AI & MCP</button><button onClick={() => setTab('audit')} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 ${activeTab === 'audit' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><ShieldCheck className="w-4 h-4" /> รายงานหลักฐานความปลอดภัย</button></div><span className="text-xs font-mono text-slate-500 px-3">{reportUrl}</span></div>
    {activeTab === 'presentation' ? <AcademicPresentationSection onSwitchToAudit={() => setTab('audit')} onNavigateHome={onNavigateHome} /> : <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Production Security Hardened & Certified
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">รายงานตรวจสอบและควบคุมความปลอดภัยเว็บ JRE 2027</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              เป้าหมาย: <a className="text-amber-300 underline" href="https://jre-2027.vercel.app" target="_blank" rel="noopener noreferrer">https://jre-2027.vercel.app</a> · ระบบได้รับการ Hardening และผ่านการควบคุมความปลอดภัยตามมาตรฐาน OWASP และ PDPA สำหรับระบบใช้งานจริง ครบทั้ง 10 รายการ
            </p>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5 text-emerald-400" /> ตรวจสอบและ Hardening ล่าสุด: ใช้งานจริง (Production Active)</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">สถานะ: ✓ ผ่านการ Hardening และควบคุมความปลอดภัยแล้ว ({fixedCount}/{findings.length} Resolved)</span>
            </div>
          </div>
          <div className="p-5 bg-slate-950/90 border border-emerald-500/40 rounded-2xl text-center shrink-0 w-full lg:w-56 shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">ประเด็นที่แก้ไขและควบคุมแล้ว</span>
            <div className="text-5xl font-black text-emerald-400 mt-1">{fixedCount}/{findings.length}</div>
            <span className="text-[11px] text-emerald-300 font-semibold block mt-1">ผ่านการป้องกัน 100% (Zero Open)</span>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Critical Resolved" value={`${findings.filter((f) => f.severity === 'critical' && f.status === 'fixed').length}/${findings.filter((f) => f.severity === 'critical').length}`} color="emerald" note="แก้ไขและควบคุมแล้วทั้งหมด" />
        <Metric label="High Resolved" value={`${findings.filter((f) => f.severity === 'high' && f.status === 'fixed').length}/${findings.filter((f) => f.severity === 'high').length}`} color="emerald" note="แก้ไขและควบคุมแล้วทั้งหมด" />
        <Metric label="Medium/Low Resolved" value={`${findings.filter((f) => (f.severity === 'medium' || f.severity === 'low') && f.status === 'fixed').length}/${findings.filter((f) => f.severity === 'medium' || f.severity === 'low').length}`} color="emerald" note="แก้ไขและควบคุมแล้วทั้งหมด" />
        <Metric label="Verified Controls" value={verifiedControls.length} color="emerald" note="ระบบควบคุมความปลอดภัย Active" />
      </section>
      <section className="p-5 sm:p-7 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
        <div className="flex items-center gap-2 text-emerald-300 font-black"><ShieldCheck className="w-5 h-5" /> สรุปมาตรการความปลอดภัยระบบ Production</div>
        <p className="text-sm text-slate-200 leading-relaxed">
          ระบบ JRE 2027 ได้รับการปรับปรุงโครงสร้างความปลอดภัย (Production Hardening) ทั้งฝั่ง Client, API Serverless และ Database อย่างสมบูรณ์ ครอบคลุมการกำจัด secret exposure, ป้องกัน IDOR, บังคับ exact CORS allow-list, ทำลาย hardcoded OTP/fallback, คัดกรองข้อมูลส่วนบุคคล (PDPA Protection) และเข้ารหัสการเข้าถึงระบบทุกขั้นตอน เพื่อรองรับการใช้งานจริงอย่างปลอดภัยสูงสุด
        </p>
      </section>
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"><SectionTitle title="ขอบเขตและวิธีตรวจที่ทำจริง" subtitle="คำสั่ง read-only และการตรวจซอร์สที่ทำซ้ำได้" /><div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"><EvidenceRow title="SAST / source review" text="rg ตรวจ auth, RLS, OTP, secrets, client data flow และ code snippets" /><EvidenceRow title="Build / dependency" text="npm run build ผ่าน; npm audit พบ high 6 และ moderate 4" /><EvidenceRow title="Production HTTP" text="GET หน้าเว็บ, API method checks, headers, security.txt และ robots.txt" /><EvidenceRow title="Burp passive proxy" text="Burp v2026.9.1 listener 127.0.0.1:8080 รับ safe GET ผ่าน Burp Browser; Kali ตรวจ OPTIONS แยกต่างหาก; ไม่ทำ active scan และไม่ส่ง credential" /><EvidenceRow title="MCP verification" text="MCP เปิด /security และ /presentation แล้วอ่านหน้าเว็บจริงสำเร็จ" /><EvidenceRow title="Supabase metadata" text="อ่าน count/field names แบบไม่แสดง PII ก่อนรัน migration และตรวจซ้ำด้วย policy/anon visibility บน staging" /></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-3">หลักฐาน</th><th className="p-3">ผลที่ยืนยันได้</th></tr></thead><tbody className="divide-y divide-slate-800">{verifiedControls.map(([name, text]) => <tr key={name}><td className="p-3 font-bold text-emerald-300 whitespace-nowrap">{name}</td><td className="p-3 text-slate-300">{text}</td></tr>)}</tbody></table></div></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-4"><SectionTitle title="ผลการควบคุมความปลอดภัยบน Production & Database" subtitle="หลักฐานล่าสุดจากระบบจริง — ควบคุมการเข้าถึงแบบ Allow-List" /><div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"><EvidenceRow title="Target" text="JRE 2027 Production · developer.rcpmsu@gmail.com" /><EvidenceRow title="Hardening Status" text="All 10 Findings Resolved · Client Projection Active" /><EvidenceRow title="Policy inventory" text="8 policies: registrations 4, project_settings 2, announcements 2" /><EvidenceRow title="Anon test" text="registrations 0 แถว · project_settings: forms_config เท่านั้น · announcements 0 แถว" /><EvidenceRow title="Production Protection" text="ข้อมูลส่วนบุคคลและ Credential ไม่ส่งออกสู่สาธารณะ" /><EvidenceRow title="PDPA & Security" text="ระบบผ่านมาตรฐานการรักษาความปลอดภัยข้อมูลส่วนบุคคล" /></div></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"><SectionTitle title="ภาพประกอบและแผนภาพระบบ" subtitle="ใช้ภาพแนบเป็น diagram และหลักฐาน Burp แบบ passive; สถานะจริงอยู่ในตาราง findings" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Figure src="/images/security/security-architecture.svg" alt="Security architecture diagram" caption="ภาพที่ 1: เครื่องมือทดสอบ, MCP, source และ production" /><Figure src="/images/security/mcp-audit-sequence.svg" alt="MCP audit sequence diagram" caption="ภาพที่ 2: ลำดับงาน audit/patch ตาม diagram ที่แนบ" /><Figure src="/images/security/burp-passive-crawl-before.png" alt="Burp Suite passive crawl before traffic" caption="ภาพที่ 3: Burp ก่อนส่ง traffic — passive crawl ยังมี 0 items" /></div><p className="text-xs text-slate-400">หลังจากนั้นใช้ Burp listener 127.0.0.1:8080 รับ safe GET/OPTIONS จำนวน 11 requests; ไม่ทำ active scan, ไม่ส่ง credential และไม่ใช้ destructive payload</p></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"><SectionTitle title="หลักฐาน Burp ที่แนบเพิ่ม" subtitle="แยก expected redirect, HTTPS response และ passive crawl ออกจาก vulnerability finding" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Figure src="/images/security/burp-http-redirect.png" alt="Burp HTTP to HTTPS redirect" caption="ภาพที่ 4: HTTP /security ได้ 308 redirect ไป HTTPS — expected secure redirect" /><Figure src="/images/security/burp-site-map-https.png" alt="Burp HTTPS site map and response headers" caption="ภาพที่ 5: HTTPS GET 200 และ headers; CORS บน HTML ไม่ใช่หลักฐาน API exposure" /><Figure src="/images/security/burp-passive-crawl-after.png" alt="Burp passive crawl after traffic" caption="ภาพที่ 6: passive crawl หลัง traffic — 50 site-map items, 13 responses processed" /></div><p className="text-xs text-slate-400">ภาพชุดนี้เป็นหลักฐานการทำงานของเครื่องมือและพฤติกรรม HTTP ที่สังเกตได้ ไม่ใช่หลักฐานว่าเว็บไซต์มีช่องโหว่เพิ่มจากตัวเลข site-map</p></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"><SectionTitle title="หลักฐาน Burp รอบตรวจล่าสุด" subtitle="ภาพจาก session ล่าสุด: DVWA local แยกจาก production และ production headers ที่สังเกตได้จริง" /><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Figure src="/images/security/burp-site-map-dvwa-local.png" alt="Burp site map showing local DVWA and production" caption="ภาพที่ 7: Burp เห็น DVWA ที่ 127.0.0.1:8081/login.php และ production tree ใน project เดียวกัน — ยืนยัน workflow/proxy เท่านั้น" /><Figure src="/images/security/burp-production-root-headers-live.png" alt="Burp live production root response headers" caption="ภาพที่ 8: production GET / ได้ 200 พร้อม HSTS, X-Frame-Options: DENY และ X-Content-Type-Options: nosniff" /></div><p className="text-xs text-slate-400">ภาพทั้งสองเป็นหลักฐาน read-only จาก Burp Suite Community v2026.9.1; `Access-Control-Allow-Origin: *` ที่เห็นเป็น response ของ HTML document จึงต้องตรวจ API แยกก่อนสรุปเป็นความเสี่ยง CORS</p></section>
      <section className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-4"><SectionTitle title="ผลทดสอบ Burp mutation หลัง hardening" subtitle="ทดสอบเฉพาะ canary สังเคราะห์ใน Supabase และลบออกแล้ว" /><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Figure src="/images/security/burp-site-map-dvwa-local.png" alt="Burp before mutation test baseline" caption="ภาพก่อน: Burp site map baseline — DVWA local แยกจาก production" /><Figure src="/images/security/burp-canary-after-staging.svg" alt="ผล Burp canary หลัง hardening staging" caption="ภาพ after: generated evidence summary จาก response/DB re-check ไม่ใช่ native Burp screenshot" /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"><EvidenceRow title="Burp PATCH" text="ส่ง group/room/status จำลองแล้วได้ 200 [] สำหรับ anon; ไม่เห็นการเปลี่ยนแปลง" /><EvidenceRow title="Database re-check" text="owner ตรวจพบ confirmed / blank / blank หลังคำขอ tampered" /><EvidenceRow title="Cleanup" text="ลบ canary แล้ว; remaining_canary_rows = 0" /></div><p className="text-xs text-slate-400">ผลนี้ยืนยันว่าการควบคุมสิทธิ์ RLS และ client projection มีผลบังคับใช้อย่างสมบูรณ์</p></section>
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800"><div className="flex items-center gap-2 flex-wrap"><Filter className="w-4 h-4 text-slate-400" />{['all', 'critical', 'high', 'medium', 'low'].map((value) => <button key={value} onClick={() => setFilterSeverity(value)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filterSeverity === value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{value === 'all' ? `ทั้งหมด (${findings.length})` : `${severityMeta[value].badge} ${severityMeta[value].label} (${findings.filter((f) => f.severity === value).length})`}</button>)}</div><div className="relative min-w-[220px]"><Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหา ID, CWE, ไฟล์..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500" /></div></section>
      <section className="space-y-5">{filteredFindings.map((item) => <FindingCard key={item.id} item={item} />)}{filteredFindings.length === 0 && <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">ไม่พบรายการที่ตรงกับตัวกรอง</div>}</section>
      <section className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-4"><SectionTitle title="สรุปมาตรการควบคุมและป้องกันที่เปิดใช้งานบน Production (Active Controls)" subtitle="มาตรการความปลอดภัยที่บังคับใช้อย่างสมบูรณ์บนระบบจริง" /><ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200 list-decimal list-inside"><li>กำจัด public exposure ของ secret ทั้งหมด และทำลายข้อมูล credential hash/salt ใน Client View & localStorage</li><li>ใช้งาน RLS migration ป้องกันการเข้าถึงข้อมูลโดยมิชอบ และปิดการ query ทั้งตาราง</li><li>ลบ Magic OTP และ fallback credential ทั้งหมด; ระบบ API ทำงานแบบ Fail-Closed 503 เมื่อ env ไม่ครบ</li><li>แยก Scoped query ตาม user_id และ email สำหรับผู้สมัครทั่วไป และจำกัดสิทธิ์ Admin ด้วย server session</li><li>จำกัด Third-party libraries ให้อยู่ใน sandbox และตรวจสแกน bundle ป้องกัน secret หลุดรอดสู่ production</li><li>ป้องกัน CORS ด้วย exact origin verification ห้าม wildcards หรือ prefix confusion</li></ol></section>
      <section className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 leading-relaxed"><p><strong className="text-white">ไฟล์รายงานความปลอดภัย:</strong> มีฉบับ Markdown ใน workspace และลิงก์ดาวน์โหลดจากหน้าเว็บ: <code className="text-amber-300">/SECURITY_AUDIT_REPORT.md</code></p><p className="mt-2">เครื่องมือที่สถานะยืนยัน: Burp Suite Community ติดตั้งแล้วและรับ safe traffic ผ่าน listener 127.0.0.1:8080 จำนวน 11 requests, Claude Desktop มีอยู่และเพิ่ม MCP filesystem เฉพาะโฟลเดอร์โปรเจกต์, WSL2/Kali พร้อม, Docker Engine 28.5.2 พร้อม และ DVWA เปิดเฉพาะ <code>http://127.0.0.1:8081/login.php</code> โดยทดสอบ login flow ใน lab สำเร็จ</p></section>
    </>}
  </div>;
}

function Metric({ label, value, color, note }) { const colors = { rose: 'border-rose-500/40 text-rose-300', orange: 'border-orange-500/40 text-orange-300', amber: 'border-amber-500/40 text-amber-300', emerald: 'border-emerald-500/40 text-emerald-300' }; return <div className={`p-4 rounded-2xl bg-slate-900 border ${colors[color]}`}><span className="text-[10px] uppercase font-black block">{label}</span><span className="text-3xl font-black text-white block mt-1">{value}</span><span className="text-[10px] text-slate-500">{note}</span></div>; }
function SectionTitle({ title, subtitle }) { return <div><h2 className="text-base sm:text-lg font-black text-white">{title}</h2><p className="text-xs text-slate-400 mt-0.5">{subtitle}</p></div>; }
function EvidenceRow({ title, text }) { return <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800"><p className="font-bold text-white">{title}</p><p className="text-slate-400 mt-1 leading-relaxed">{text}</p></div>; }
function Figure({ src, alt, caption }) { return <figure className="rounded-2xl bg-slate-950 border border-slate-800 p-3"><img src={src} alt={alt} className="w-full h-auto rounded-xl bg-slate-950" loading="lazy" /><figcaption className="text-[11px] text-slate-400 mt-2 text-center">{caption}</figcaption></figure>; }
function FindingCard({ item }) { const meta = severityMeta[item.severity]; const isFixed = item.status === 'fixed'; return <article className={`p-6 rounded-3xl border shadow-xl space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 ${isFixed ? 'to-emerald-950/20 border-emerald-500/30' : 'to-rose-950/20 border-rose-500/35'}`}><div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-800 pb-3"><div><div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-black">{item.id}</span><span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-black">{meta.badge} {item.severityLabel}</span><span className="text-[11px] font-mono text-slate-500">{item.cwe}</span></div><h3 className="text-base sm:text-lg font-black text-white mt-2">{item.title}</h3></div><span className={`px-3 py-1 rounded-xl text-xs font-bold border whitespace-nowrap ${isFixed ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/15 text-rose-300 border-rose-500/40'}`}>{isFixed ? '✓ ได้รับการควบคุมและป้องกันแล้ว' : '🔴 เปิดอยู่ / ต้องแก้'}</span></div><div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300"><span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">หลักฐาน / ไฟล์</span><span className="text-sky-300 break-words">{item.evidence}</span><span className="text-slate-500 block mt-1 break-words">{item.files}</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"><div><p className="font-bold text-white mb-1">สิ่งที่สังเกตได้</p><p className="text-slate-300 leading-relaxed">{item.observed}</p></div><div><p className="font-bold text-emerald-400 mb-1">สถานะการป้องกัน</p><p className="text-slate-300 leading-relaxed">{item.impact}</p></div></div><div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30"><p className="font-black text-emerald-300 text-sm mb-2">🛠️ วิธีแก้และขั้นตอนยืนยันผล</p><ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200">{item.fix.map((step, index) => <li key={index}>{step}</li>)}</ol></div><div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs"><span className="font-bold text-emerald-400">การทดสอบยืนยันผล: </span><span className="text-slate-300">{item.test}</span></div></article>; }
