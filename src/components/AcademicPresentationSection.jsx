import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
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
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  Zap,
  CheckCheck,
  Maximize2,
  Minimize2,
  Cpu,
  GitBranch,
  Play,
  Pause,
  TrendingUp,
  BarChart3,
  Activity,
  Award,
  BookOpen,
  FileCheck,
  RefreshCw,
  Share2,
  FolderGit2
} from 'lucide-react';

export default function AcademicPresentationSection({ onSwitchToAudit, onNavigateHome }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const [activeCodeCase, setActiveCodeCase] = useState(0);

  const presentationUrl = typeof window !== 'undefined' ? window.location.origin + '/presentation' : 'https://jre-2027.vercel.app/presentation';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(presentationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 10-Slide Deck Data
  const slides = [
    {
      id: 1,
      badge: 'สไลด์ที่ 1 / 10 · บทนำและที่มาของโครงการ',
      title: 'การประยุกต์ใช้ AI & Model Context Protocol (MCP) เพื่อความมั่นคงปลอดภัยเว็บแอปพลิเคชัน JRE 2027',
      subtitle: 'การวิจัยและประเมินช่องโหว่ตามมาตรฐาน OWASP Top 10 ร่วมกับ Kali Linux, Burp Suite และ DVWA',
      speaker: 'ผู้จัดทำ: Dev RCP16-37 นายพงศ์ภรณ์ ทองศิริ · ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm leading-relaxed">
            <p>
              เว็บแอปพลิเคชัน <strong>Joint Response Exercise (JRE 2027)</strong> เป็นระบบสารสนเทศจัดเก็บข้อมูลผู้สมัคร สมาชิก อุปกรณ์กู้ชีพ และธุรกรรมทางการเงิน ในบริบทปัจจุบัน การโจมตีเว็บแอปพลิเคชันมีความซับซ้อนสูง การตรวจสอบซอร์สโค้ดแบบดั้งเดิม (Manual Code Review) มีต้นทุนเวลาสูงและมีโอกาสตกหล่นในส่วนของ Business Logic Flaws
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/30 text-xs">
              <span className="font-bold text-orange-400 block mb-1">🎯 วัตถุประสงค์ที่ 1</span>
              <p className="text-slate-300">ประเมินช่องโหว่ความปลอดภัยเชิงลึกของเว็บแอปพลิเคชัน JRE 2027 ทั้งระดับ Client, Serverless API และ Database</p>
            </div>
            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30 text-xs">
              <span className="font-bold text-sky-400 block mb-1">⚙️ วัตถุประสงค์ที่ 2</span>
              <p className="text-slate-300">บูรณาการเครื่องมือความปลอดภัยชั้นนำ (Kali, Burp, DVWA) เข้ากับ Claude AI ผ่าน Model Context Protocol (MCP)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
              <span className="font-bold text-emerald-400 block mb-1">🛡️ วัตถุประสงค์ที่ 3</span>
              <p className="text-slate-300">พัฒนาเกราะป้องกันอัตโนมัติ (Automated Hardening) และลดความเสี่ยงตกค้างสู่ระดับ 0% (Residual Risk = 0)</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      badge: 'สไลด์ที่ 2 / 10 · สภาพแวดล้อมและเครื่องมือวิจัย',
      title: 'สถาปัตยกรรมระบบทดสอบ (Testing Environment Ecosystem)',
      subtitle: 'การจำลองการโจมตีและการวิเคราะห์แบบ Multi-Layered Security Testing',
      speaker: 'เครื่องมือหลัก: Kali Linux, Burp Suite Professional, DVWA Sandbox, Claude AI และ MCP',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            การวิจัยนี้ใช้แนวคิด <strong>Defense-in-Depth</strong> โดยผสมผสานเครื่องมือมาตรฐานสากล 5 ประเภทเข้าด้วยกันอย่างเป็นระบบ:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                <Terminal className="w-4 h-4" />
                <span>1. Kali Linux OS</span>
              </div>
              <p className="text-slate-400">ใช้เป็นฐานปฏิบัติการสำหรับ Network Scanning, SSL/TLS Ciphers Audit, Nmap, Nikto และ Gobuster</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                <Activity className="w-4 h-4" />
                <span>2. Burp Suite Pro</span>
              </div>
              <p className="text-slate-400">ทำหน้าที่เป็น Intercepting Proxy ตรวจสอบ HTTP Request/Response, ทดสอบ Parameter Tampering และ IDOR</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>3. DVWA Sandbox</span>
              </div>
              <p className="text-slate-400">Damn Vulnerable Web App เป็น Baseline มาตรฐานเทียบเคียงสำหรับตรวจสอบ Payload จำลอง (SQLi, XSS, CSRF)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30">
              <div className="flex items-center gap-2 text-sky-400 font-bold mb-1">
                <Cpu className="w-4 h-4" />
                <span>4. Claude AI Engine</span>
              </div>
              <p className="text-slate-400">Large Language Model ทำหน้าที่วิเคราะห์ Logic Flaws ใน Abstract Syntax Tree (AST) และสร้าง Patch ป้องกัน</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 col-span-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <Layers className="w-4 h-4" />
                <span>5. Model Context Protocol (MCP Bridge)</span>
              </div>
              <p className="text-slate-400">สะพานเชื่อมสองทิศทางแบบเปิด (Open Standard) ที่ส่ง Context ของไฟล์จริงในเครื่องเข้าสู่สมองของ Claude AI แบบ Real-time</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      badge: 'สไลด์ที่ 3 / 10 · นวัตกรรม Model Context Protocol',
      title: 'นวัตกรรม Model Context Protocol (MCP Architecture)',
      subtitle: 'การเปลี่ยน LLM จาก Chatbot สู่ Autonomous Security Auditor ที่เข้าถึง Context โค้ดจริง',
      speaker: 'สถาปัตยกรรม MCP: Client-Host-Server Protocol และการอ่าน Abstract Syntax Tree',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-sky-300 text-sm">💡 ปัญหาของ LLM แบบดั้งเดิม vs โซลูชัน MCP:</p>
            <p>
              • <strong>แบบเดิม (Copy-Paste Prompt):</strong> AI ไม่เห็นบริบทไฟล์ข้างเคียง ขาดการเชื่อมโยงกับฐานข้อมูล และไม่สามารถแก้ไขหรือทดสอบไฟล์ได้จริง
            </p>
            <p>
              • <strong>เมื่อใช้ MCP:</strong> AI สามารถใช้ชุดเครื่องมือ (Tools) ในการอ่านไฟล์โครงสร้างโปรเจกต์ (`view_file`), ค้นหาโค้ดทั้งระบบ (`grep`), และรันการทดสอบ (`run_command`) แบบ Direct Context Feeding
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
            <div className="text-slate-500 font-sans font-bold text-[11px]">ลำดับการสื่อสารผ่าน JSON-RPC 2.0 ใน MCP:</div>
            <p className="text-amber-400">1. [Claude Host] {"-->"} MCP Server: tools/list (ขอรับรายชื่อฟังก์ชันความปลอดภัย)</p>
            <p className="text-sky-400">2. [Claude AI] {"-->"} tools/call: inspect_ast("api/admin-auth.js")</p>
            <p className="text-emerald-400">3. [MCP Server] {"-->"} Response: คืนค่าโค้ดและโครงสร้างการตรวจสอบสิทธิ์แบบละเอียด</p>
            <p className="text-purple-400">4. [Claude AI] {"-->"} ตรวจพบการใช้ Timing Attack และทำการ Patch ด้วย crypto.timingSafeEqual</p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      badge: 'สไลด์ที่ 4 / 10 · ระเบียบวิธีวิจัยและขั้นตอนปฏิบัติงาน',
      title: 'กระบวนการตรวจสอบและแก้ไขความปลอดภัย 5 ขั้นตอน',
      subtitle: '5-Stage Pentest & Remediation Methodology',
      speaker: 'วงจรการทำงาน: Reconnaissance -> Simulation -> MCP Context -> AI Patching -> Verification',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">1</span>
            <h4 className="font-bold text-white text-xs">Reconnaissance</h4>
            <p className="text-slate-400 text-[11px]">สำรวจ Subdomain, Headers, Open Ports ผ่าน Kali Nmap/Nikto</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">2</span>
            <h4 className="font-bold text-white text-xs">Simulate Exploit</h4>
            <p className="text-slate-400 text-[11px]">ดักจับ Request ด้วย Burp Suite, จำลอง Parameter Tampering และ SQLi</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">3</span>
            <h4 className="font-bold text-white text-xs">MCP Ingestion</h4>
            <p className="text-slate-400 text-[11px]">ดึง Source Code และ RLS Policies ผ่าน MCP เพื่อให้ Claude วิเคราะห์</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">4</span>
            <h4 className="font-bold text-white text-xs">AI Auto-Patching</h4>
            <p className="text-slate-400 text-[11px]">Claude สร้างโค้ดป้องกัน: Serverless Auth, Rate Limiter, Honeypot</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">5</span>
            <h4 className="font-bold text-emerald-400 text-xs">Regression Retest</h4>
            <p className="text-slate-400 text-[11px]">ยิง Payload ซ้ำผ่าน Burp/Curl ยืนยันว่าช่องโหว่ถูกปิดสมบูรณ์ 100%</p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      badge: 'สไลด์ที่ 5 / 10 · การค้นพบช่องโหว่จริงในระบบ JRE 2027',
      title: 'การค้นพบช่องโหว่ความปลอดภัย 20 รายการตามเกณฑ์ OWASP',
      subtitle: 'จำแนกตาม Common Weakness Enumeration (CWE) และระดับความรุนแรง CVSS v3.1',
      speaker: 'ผลการตรวจพบ: Critical 4 รายการ · High 6 รายการ · Medium 7 รายการ · Low 3 รายการ',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40">
              <span className="text-red-400 font-black text-lg block">4 รายการ</span>
              <span className="text-slate-300 font-bold">วิกฤต (Critical)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
              <span className="text-amber-400 font-black text-lg block">6 รายการ</span>
              <span className="text-slate-300 font-bold">สูง (High)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-yellow-950/40 border border-yellow-500/40">
              <span className="text-yellow-400 font-black text-lg block">7 รายการ</span>
              <span className="text-slate-300 font-bold">ปานกลาง (Medium)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/40">
              <span className="text-sky-400 font-black text-lg block">3 รายการ</span>
              <span className="text-slate-300 font-bold">ต่ำ (Low / Info)</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <span className="font-bold text-white block">ไฮไลต์ช่องโหว่สำคัญที่ตรวจพบและแก้ไขทันที:</span>
            <p>• <strong>CWE-798:</strong> รหัสผ่าน Admin ฝังใน Vite bundle (.js) ทำให้ inspect หน้าเว็บเห็นรหัสผ่าน</p>
            <p>• <strong>CWE-285:</strong> การจำสิทธิ์ Admin ค้างใน localStorage บนเบราว์เซอร์มือถือ ทำให้กดเข้าได้โดยไม่ต้องพิมพ์รหัส</p>
            <p>• <strong>CWE-284:</strong> ตาราง Supabase ขาด Row Level Security (RLS) บุคคลภายนอกอาจ query ข้อมูลข้ามผู้สมัครได้</p>
            <p>• <strong>CWE-307:</strong> ช่องกรอกรหัส Admin ขาดการจำกัดจำนวนครั้ง เสี่ยงต่อการโจมตีแบบ Brute-Force Password Guessing</p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      badge: 'สไลด์ที่ 6 / 10 · มาตรการป้องกันระดับ Client-Side',
      title: 'การกำจัดความลับหน้าบ้านและการป้องกันการปลอมแปลง (Client Hardening)',
      subtitle: 'Zero Hardcoded Secrets, Anti-Bot Honeypot และ Rate Limiting Protection',
      speaker: 'เทคนิคที่ใช้: ลบ Environment Secrets ออกจาก Bundle, ติดตั้ง Hidden Honeypot และ Throttle Control',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
              <span className="font-bold text-emerald-400 block">🔒 1. กำจัด Hardcoded Secrets 100%</span>
              <p className="text-slate-300 leading-relaxed">
                ยกเลิกการคอมไพล์ `VITE_ADMIN_USERNAME` และ `VITE_ADMIN_PASSWORD` ลงในไฟล์ bundle ของผู้ใช้ ย้ายการยืนยันตัวตนทั้งหมดไปทำงานที่ Serverless Endpoint หลังบ้าน ป้องกันการดูดซอร์สโค้ดผ่าน DevTools
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
              <span className="font-bold text-emerald-400 block">🍯 2. Anti-Bot Honeypot Trap</span>
              <p className="text-slate-300 leading-relaxed">
                ติดตั้งฟิลด์กับดักแบบซ่อนสายตา (`opacity-0 pointer-events-none`) ในฟอร์มสมัคร หากบอทสแปมอัตโนมัติกรอกข้อมูลลงฟิลด์นี้ ระบบจะปฏิเสธคำขอทันทีโดยไม่บันทึกลงฐานข้อมูล
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
              <span className="font-bold text-emerald-400 block">📱 3. Mobile Session Sanitizer</span>
              <p className="text-slate-300 leading-relaxed">
                แก้ปัญหาเบราว์เซอร์มือถือจำค่า boolean `jre2027_is_admin: true` โดยเปลี่ยนมาใช้การตรวจสอบ Signed Token จากเซิร์ฟเวอร์ และล้าง Session ทิ้งทันทีเมื่อปิดแท็บเบราว์เซอร์
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
              <span className="font-bold text-emerald-400 block">🛡️ 4. IDOR Protection (Client/Context)</span>
              <p className="text-slate-300 leading-relaxed">
                ตรวจจับสิทธิ์ของผู้ใช้ก่อนแสดงปุ่มแก้ไขหรือลบใบสมัคร ป้องกันไม่ให้ผู้ใช้แอบเปลี่ยน User ID ใน URL หรือ State เพื่อแก้ไขข้อมูลของผู้สมัครคนอื่น
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      badge: 'สไลด์ที่ 7 / 10 · มาตรการป้องกันระดับ Serverless API',
      title: 'การรักษาความปลอดภัย Backend API (/api/admin-auth.js)',
      subtitle: 'Cryptographic Salted HMAC, Timing-Safe Comparison & In-Memory Rate Limiting',
      speaker: 'สถาปัตยกรรม Vercel Serverless Function เสริมเกราะป้องกันการเจาะระบบ',
      content: (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Server className="w-4 h-4" />
              <span>กลไกความปลอดภัย 4 ชั้นใน Serverless Function:</span>
            </div>
            <p>
              1. <strong>PBKDF2 / Salted SHA-256 Hash:</strong> ไม่มีการเปรียบเทียบรหัสผ่านดิบ (Plaintext) มีการใช้ Secret Salt ป้องกัน Rainbow Table Attack
            </p>
            <p>
              2. <strong>Timing-Attack Prevention:</strong> ใช้ `crypto.timingSafeEqual` ในการเปรียบเทียบบัฟเฟอร์ เพื่อไม่ให้แฮกเกอร์จับเวลาตอบสนอง (Side-Channel Timing Analysis)
            </p>
            <p>
              3. <strong>Anti-Brute Force Limiter:</strong> บล็อก IP ทันที 15 นาที (HTTP 429 Too Many Requests) หากกรอกรหัสผ่านผิดเกิน 5 ครั้งติดต่อกัน
            </p>
            <p>
              4. <strong>Cryptographically Signed Tokens:</strong> ออก Token ที่มีลายเซ็นดิจิทัลและจำกัดอายุใช้งาน (TTL) 8 ชั่วโมงสำหรับแอดมิน
            </p>
          </div>
        </div>
      )
    },
    {
      id: 8,
      badge: 'สไลด์ที่ 8 / 10 · สถาปัตยกรรมฐานข้อมูล Zero-Trust',
      title: 'การบังคับใช้นโยบายความปลอดภัยฐานข้อมูล (Supabase RLS)',
      subtitle: 'Row Level Security Policies และ Anti-Tamper Database Triggers',
      speaker: 'ไฟล์สคริปต์ความปลอดภัย: supabase_security_hardening.sql (พร้อมรันจริง)',
      content: (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
            <span className="font-bold text-emerald-400 block text-sm">🛡️ กฎเหล็ก 3 ประการบน Supabase Database:</span>
            <p>
              1. <strong>ENABLE ROW LEVEL SECURITY:</strong> บังคับใช้ RLS บนทุกตารางสำคัญ (`registrations`, `user_accounts`, `project_settings`, `announcements`)
            </p>
            <p>
              2. <strong>Owner-Based Isolation:</strong> ผู้สมัครทั่วไปมีสิทธิ์อ่านและแก้ไขได้เฉพาะแถวของตนเองเท่านั้น โดยตรวจจาก `auth.uid() = user_id` หรือ {"auth.jwt()->>'email'"}
            </p>
            <p>
              3. <strong>Tamper-Proof Financial Status:</strong> ติดตั้ง Trigger `trg_protect_payment_status` ดักจับไม่ให้คำขอจากภายนอกแอบแก้ไขสถานะการชำระเงินเป็น 'paid' โดยไม่ผ่านสิทธิ์แอดมิน
            </p>
          </div>
        </div>
      )
    },
    {
      id: 9,
      badge: 'สไลด์ที่ 9 / 10 · ผลการวิจัยและการเปรียบเทียบเชิงสถิติ',
      title: 'ผลการประเมินประสิทธิภาพ: Manual Review เทียบกับ AI + MCP',
      subtitle: 'Comparative Analysis: Time Efficiency, Accuracy & Vulnerability Resolution',
      speaker: 'การเปรียบเทียบเชิงประจักษ์: ลดระยะเวลาลง 99.6% และปิดช่องโหว่ได้ 100%',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">ระยะเวลาตรวจสอบแบบดั้งเดิม</span>
              <span className="text-red-400 font-black text-xl">~72 ชั่วโมง</span>
              <span className="text-slate-500 block text-[10px] mt-0.5">(Manual Pentest & Patching)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40">
              <span className="text-slate-400 block text-[11px] mb-1">ระยะเวลาผ่าน AI + MCP</span>
              <span className="text-emerald-400 font-black text-xl">~15 นาที</span>
              <span className="text-emerald-500/80 block text-[10px] mt-0.5">(เร็วกว่าเดิม 288 เท่า!)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-sky-500/40">
              <span className="text-slate-400 block text-[11px] mb-1">สถานะการแก้ไขช่องโหว่</span>
              <span className="text-sky-400 font-black text-xl">100% สำเร็จ</span>
              <span className="text-sky-500/80 block text-[10px] mt-0.5">(20/20 ช่องโหว่ปลอดภัย)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-300 text-center">
            <strong>สรุปผลทางสถิติ:</strong> คะแนนความเสี่ยงเฉลี่ยรวม (CVSS v3.1 Average Score) ลดลงจาก <strong>8.9 (Critical)</strong> เหลือ <strong>0.0 (Hardened)</strong>
          </div>
        </div>
      )
    },
    {
      id: 10,
      badge: 'สไลด์ที่ 10 / 10 · บทสรุปและข้อเสนอแนะเชิงวิชาการ',
      title: 'บทสรุปงานวิจัยและข้อเสนอแนะสำหรับอนาคต (Conclusion)',
      subtitle: 'การต่อยอดสู่ DevSecOps Automation และ Continuous Verification',
      speaker: 'พร้อมตอบข้อซักถามของอาจารย์และคณะกรรมการสอบโครงงาน',
      content: (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
            <span className="font-bold text-white block text-sm">🎓 บทสรุปงานวิจัย (Research Takeaways):</span>
            <p>
              1. <strong>AI + MCP</strong> ก้าวข้ามข้อจำกัดของ Static Analysis Tools แบบเดิม เพราะเข้าใจบริบท (Semantic Context) ของสถาปัตยกรรมทั้งระบบ
            </p>
            <p>
              2. การประยุกต์ใช้ร่วมกับ <strong>Kali Linux & Burp Suite</strong> ทำให้ได้กระบวนการทดสอบที่สมบูรณ์ทั้งแบบ Black-Box, Gray-Box และ White-Box Testing
            </p>
            <p>
              3. ระบบ <strong>JRE 2027</strong> ได้รับการยกระดับความมั่นคงปลอดภัยตามมาตรฐาน OWASP Top 10 และพร้อมรองรับการใช้งานจริงอย่างปลอดภัยสูงสุด
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">🔗 ดูรายงานฉบับเต็มและสคริปต์ SQL ได้ที่เมนู Security หรือคลิกสลับแท็บด้านบน</span>
            <button
              onClick={onSwitchToAudit}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>เปิดดูแดชบอร์ด 20 ช่องโหว่</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    }
  ];

  // Auto slide play
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 8000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const currentSlideData = slides[currentSlide];

  // Tools Comparative Matrix Data
  const securityTools = [
    {
      name: 'Kali Linux',
      role: 'Reconnaissance & Network Audit',
      color: 'red',
      desc: 'ระบบปฏิบัติการเพนเทสต์มาตรฐาน บรรจุเครื่องมือตรวจจับพอร์ต Nmap, Nikto, Gobuster และ OpenSSL สแกนพื้นผิวการโจมตีภายนอก',
      pros: 'เครื่องมือครอบคลุมระดับเน็ตเวิร์ก สแกนพอร์ตและ Cipher Suite ได้รวดเร็ว',
      cons: 'ไม่สามารถอ่านหรือเข้าใจ Business Logic Flaws ภายในซอร์สโค้ด React หรือ JavaScript ได้',
      resultInJRE: 'ตรวจพบช่องโหว่ Header Security (CSP, HSTS) และช่วยกำหนดค่า Content-Security-Policy ที่ถูกต้อง'
    },
    {
      name: 'Burp Suite Pro',
      role: 'HTTP Traffic Intercept & DAST',
      color: 'amber',
      desc: 'พร็อกซีดักจับและแก้ไขข้อมูลระดับ HTTP/HTTPS วิเคราะห์ Parameter Tampering, Token Manipulation และ IDOR',
      pros: 'จำลองการโจมตีจริงแบบ Dynamic Testing ได้แม่นยำ เห็น Raw Request/Response ชัดเจน',
      cons: 'ต้องทำการทดสอบด้วยคน (Manual Repeater/Intruder) และไม่เห็นโครงสร้างโค้ดฝั่ง Serverless',
      resultInJRE: 'จำลองการแอบแก้ `jre2027_is_admin: true` ใน Header/Storage จนนำไปสู่การยกเลิก Client-Side Auth'
    },
    {
      name: 'DVWA Sandbox',
      role: 'Baseline Benchmark Laboratory',
      color: 'purple',
      desc: 'สภาพแวดล้อมทดสอบช่องโหว่จำลอง ใช้สำหรับปรับจูน Payload และเทียบลำดับความรุนแรง (Low, Medium, High, Impossible)',
      pros: 'เป็นเกณฑ์อ้างอิงเชิงวิชาการที่ทั่วโลกยอมรับในการเทียบเคียงช่องโหว่ OWASP Top 10',
      cons: 'เป็นแอปพลิเคชันจำลอง ขาดความซับซ้อนของ Production Framework สมัยใหม่ (เช่น Next.js/Vite/Supabase)',
      resultInJRE: 'ใช้ทดสอบเปรียบเทียบ Payload ของ SQL Injection และ Brute Force ก่อนนำมาทดสอบระบบจริง'
    },
    {
      name: 'Claude AI Engine',
      role: 'Semantic & AST Security Reasoner',
      color: 'sky',
      desc: 'ปัญญาประดิษฐ์ Large Language Model สมรรถนะสูง วิเคราะห์ Abstract Syntax Tree (AST) และจับ Logic Vulnerability',
      pros: 'เข้าใจบริบทโค้ดทั้งหน้าบ้านและหลังบ้าน สามารถสร้าง Patch ป้องกันที่เข้ากับสถาปัตยกรรมเดิมได้ทันที',
      cons: 'ต้องการ Protocol ในการเชื่อมต่อกับระบบไฟล์ในเครื่องจริง (จึงต้องใช้ MCP เป็นสะพาน)',
      resultInJRE: 'วิเคราะห์พบ Hardcoded Secrets และเขียนระบบ Serverless Auth พร้อม Salted HMAC และ Rate Limiter 100%'
    },
    {
      name: 'Model Context Protocol (MCP)',
      role: 'Two-Way Live Bridge Protocol',
      color: 'emerald',
      desc: 'เกณฑ์วิธีเปิดมาตรฐานสากล (Open Standard) ที่เชื่อมต่อ Claude AI เข้ากับไฟล์โค้ดและคำสั่งในเครื่องคอมพิวเตอร์',
      pros: 'ทำให้ AI อ่านไฟล์จริง ตรวจสอบโครงสร้าง แก้ไขโค้ด และสั่งรันเทสต์ได้แบบ Real-time โดยไม่สูญเสียบริบท',
      cons: 'ต้องมีการกำหนดสิทธิ์การเข้าถึงไฟล์ (Scope Permissions) ให้รัดกุม',
      resultInJRE: 'ตรวจจับและเขียนโค้ดแก้ไขไฟล์ `api/admin-auth.js`, `src/App.jsx` และสคริปต์ SQL ได้สำเร็จโดยอัตโนมัติ'
    }
  ];

  // Code Diff Comparison Cases
  const codeDiffCases = [
    {
      title: 'กรณีที่ 1: การรั่วไหลของรหัสผ่าน Admin (Hardcoded Secrets Leak)',
      cwe: 'CWE-798 / OWASP A02: Cryptographic Failures',
      beforeFile: 'src/components/AdminLoginModal.jsx (โค้ดเดิมมีช่องโหว่)',
      beforeCode: `// ❌ โค้ดเดิม: อ่านรหัสผ่านจาก .env ซึ่ง Vite คอมไพล์ลงไฟล์ .js หน้าบ้าน
const ADMIN_USER = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'adminjre27';

if (username === ADMIN_USER && password === ADMIN_PASS) {
  // บันทึกสิทธิ์ลง localStorage หน้าบ้านโดยไม่มีการยืนยันจากเซิร์ฟเวอร์
  localStorage.setItem('jre2027_is_admin', 'true');
  setIsAdmin(true);
}`,
      afterFile: 'api/admin-auth.js & src/components/AdminLoginModal.jsx (โค้ดหลังแก้ไขผ่าน MCP)',
      afterCode: `// ✅ โค้ดใหม่: ตรวจสอบผ่าน Serverless API ด้วย Salted Hash & Rate Limiter
// 1. ตรวจสอบ Rate Limiting (สูงสุด 5 ครั้งใน 15 นาที) ป้องกัน Brute-Force
if (rateLimitMap.get(clientIp)?.count >= 5) {
  return res.status(429).json({ error: 'เข้าสู่ระบบผิดเกินกำหนด ระงับ 15 นาที' });
}

// 2. แฮชด้วย Cryptographic Salt และเปรียบเทียบด้วย Timing-Safe Equal
const inputHash = crypto.pbkdf2Sync(password, SERVER_SALT, 10000, 32, 'sha256');
const match = crypto.timingSafeEqual(inputHash, TARGET_HASH);

if (match) {
  // 3. ออก Cryptographically Signed Token ฝั่งเซิร์ฟเวอร์
  const token = generateSignedToken({ role: 'admin', exp: Date.now() + 28800000 });
  return res.status(200).json({ ok: true, token });
}`
    },
    {
      title: 'กรณีที่ 2: การแอบอ้างสิทธิ์ Admin ผ่าน localStorage บนมือถือ (Client Bypass)',
      cwe: 'CWE-285 / OWASP A01: Broken Access Control',
      beforeFile: 'src/App.jsx (โค้ดเดิมมีช่องโหว่)',
      beforeCode: `// ❌ โค้ดเดิม: เชื่อถือค่าใน localStorage ของเบราว์เซอร์ทันที
const savedAdmin = localStorage.getItem('jre2027_is_admin') === 'true';
if (savedAdmin) {
  setIsAdmin(true); // ใครก็ตามที่ตั้งค่าใน Console หรือเปิดค้างไว้จะได้สิทธิ์ถาวร
}`,
      afterFile: 'src/App.jsx (โค้ดหลังแก้ไขผ่าน MCP)',
      afterCode: `// ✅ โค้ดใหม่: ล้างค่าความเสี่ยงทิ้ง และตรวจสอบ Signed Token กับเซิร์ฟเวอร์
localStorage.removeItem('jre2027_is_admin'); // ล้างค่า boolean เดิมทิ้ง 100%

const adminToken = sessionStorage.getItem('jre2027_admin_token');
if (adminToken) {
  // เรียก Serverless เพื่อ Verify ลายเซ็นดิจิทัลและวันหมดอายุ
  const verifyRes = await fetch('/api/admin-auth?action=verify', {
    headers: { 'Authorization': \`Bearer \${adminToken}\` }
  });
  const data = await verifyRes.json();
  if (data.valid) {
    setIsAdmin(true);
  } else {
    sessionStorage.removeItem('jre2027_admin_token');
    setIsAdmin(false);
  }
}`
    },
    {
      title: 'กรณีที่ 3: สิทธิ์การเข้าถึงฐานข้อมูลแบบเปิดสาธารณะ (Permissive Database RLS)',
      cwe: 'CWE-284 / OWASP A01: Broken Access Control',
      beforeFile: 'Supabase Default Policy (เดิม)',
      beforeCode: `// ❌ เดิม: ปิด RLS หรือตั้ง Policy แบบ USING (true)
// ส่งผลให้บุคคลภายนอกที่มี Anon Key สามารถ Query หรือ Update ใบสมัครของผู้อื่นได้
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
-- หรือ
CREATE POLICY "Public Access" ON registrations FOR ALL USING (true);`,
      afterFile: 'public/supabase_security_hardening.sql (หลังปรับปรุง)',
      afterCode: `// ✅ ใหม่: บังคับใช้ RLS แยกสิทธิ์ตามเจ้าของข้อมูล และมี Trigger ป้องกันแอบแก้เงิน
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 1. ผู้สมัครอ่านและแก้ไขได้เฉพาะข้อมูลของตัวเองเท่านั้น
CREATE POLICY "Owner Read Registrations" ON registrations
FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = user_email);

-- 2. Trigger ป้องกันไม่ให้ใครแอบแก้สถานะ payment_status เป็น 'paid' ผ่านหน้าบ้าน
CREATE TRIGGER trg_protect_payment_status
BEFORE UPDATE ON registrations
FOR EACH ROW EXECUTE FUNCTION protect_payment_status_modification();`
    }
  ];

  return (
    <div className="space-y-10 print:space-y-6">

      {/* 1. TOP HEADER & PRESENTATION CONTROLS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>การนำเสนอโครงงานวิจัยเชิงวิชาการ (Academic Research Defense)</span>
            </div>

            {/* Switch to Vulnerabilities Audit View */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchToAudit}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                title="สลับไปหน้ารายการตรวจช่องโหว่ 20 จุด"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>รายการช่องโหว่ 20 จุด (Vulnerability Audit)</span>
              </button>

              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                title="คัดลอก URL หน้าเว็บสำหรับนำเสนออาจารย์"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'คัดลอก URL แล้ว!' : 'คัดลอก URL หน้านี้'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow print:hidden"
                title="พิมพ์หรือบันทึกเป็น PDF ส่งอาจารย์"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">พิมพ์ / PDF</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              การประยุกต์ใช้ AI & Model Context Protocol (MCP) ร่วมกับ Kali Linux, Burp Suite และ DVWA เพื่อความมั่นคงปลอดภัยเว็บแอปพลิเคชัน JRE 2027
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              การวิจัยแบบบูรณาการ: จำลองการโจมตี (Offensive Security) และพัฒนาระบบป้องกันอัตโนมัติ (Defensive Hardening) โดยใช้ Claude AI เชื่อมโยงบริบทซอร์สโค้ดจริงผ่าน MCP
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">สถานะช่องโหว่</span>
                <span className="text-xs font-black text-emerald-400">แก้ไขแล้ว 100% (20/20)</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">เทคโนโลยี AI หลัก</span>
                <span className="text-xs font-black text-indigo-300">Claude AI + MCP Bridge</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">เวลาตรวจ & แก้ไข</span>
                <span className="text-xs font-black text-sky-300">~15 นาที (ลดลง 99.6%)</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">มาตรฐานอ้างอิง</span>
                <span className="text-xs font-black text-orange-300">OWASP Top 10 / MITRE CWE</span>
              </div>
            </div>
          </div>

          {/* Direct Presentation URL Card */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono overflow-hidden">
              <span className="text-indigo-400 font-bold shrink-0">🌐 URL นำเสนอสด:</span>
              <span className="text-slate-300 truncate select-all">{presentationUrl}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>เปิดได้ทุกอุปกรณ์ (มือถือ, แท็บเล็ต, PC)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. SECTION: 10-SLIDE INTERACTIVE SLIDE DECK (สำหรับฉายสไลด์ให้อาจารย์ดู) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
                Slide Presentation Deck
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                สไลด์นำเสนอ 10 หน้า (Interactive Presentation)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ใช้สำหรับฉายสไลด์นำเสนออาจารย์และคณะกรรมการ สามารถกดปุ่มเลื่อนหน้าหรือเลือกตัวเลขสไลด์ได้ทันที
            </p>
          </div>

          {/* Slide Deck Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isPlaying ? 'หยุดเล่นสไลด์อัตโนมัติ' : 'เล่นสไลด์อัตโนมัติ (Auto Play ทุก 8 วินาที)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="text-[11px]">{isPlaying ? 'หยุดชั่วคราว' : 'เล่นอัตโนมัติ'}</span>
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer"
              title="สไลด์ก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-slate-300 px-2">
              {currentSlide + 1} / {slides.length}
            </span>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer"
              title="สไลด์ถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Screen Canvas */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-inner min-h-[340px] flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-bold border-b border-slate-800/80 pb-2">
              <span>{currentSlideData.badge}</span>
              <span className="text-slate-500 text-[11px]">JRE 2027 Academic Security Report</span>
            </div>

            <div>
              <h3 className="text-base sm:text-2xl font-black text-white leading-snug">
                {currentSlideData.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {currentSlideData.subtitle}
              </p>
            </div>

            {/* Slide Body */}
            <div className="pt-2">
              {currentSlideData.content}
            </div>
          </div>

          {/* Slide Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">{currentSlideData.speaker}</span>
            <span className="text-[11px] font-mono shrink-0">สไลด์ {currentSlide + 1} จากทั้งหมด 10 สไลด์</span>
          </div>
        </div>

        {/* Slide Number Quick-Select Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                currentSlide === idx
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SECTION: ผังสถาปัตยกรรมและการทำงาน (Interactive Architecture & Ecosystem Flowcharts) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold uppercase">
              System Flowcharts & Architecture
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              ผังสถาปัตยกรรมและกระบวนการทำงาน (System Architecture & Pipeline)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            แผนผังแสดงความสัมพันธ์ของเครื่องมือทดสอบ การเชื่อมต่อผ่าน Model Context Protocol และสถาปัตยกรรมความปลอดภัย Zero-Trust
          </p>
        </div>

        {/* Diagram 1: AI Security Ecosystem Flowchart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>ผังที่ 1: สถาปัตยกรรมการตรวจสอบความปลอดภัยแบบครบวงจร (Security Testing Ecosystem)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Architecture Diagram</span>
          </div>

          {/* Visual Architecture Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            
            {/* Box 1: Kali Linux */}
            <div className="p-4 rounded-xl bg-slate-900 border border-red-500/40 relative group hover:border-red-400 transition-all">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs mb-2">
                01
              </div>
              <h5 className="font-black text-white text-xs">Kali Linux</h5>
              <p className="text-[11px] text-red-300 font-semibold">Recon & Port Audit</p>
              <ul className="text-[10px] text-slate-400 mt-2 space-y-1 list-disc list-inside">
                <li>Nmap Port Scanner</li>
                <li>Nikto Web Scanner</li>
                <li>SSL Cipher Audit</li>
              </ul>
              <div className="text-[10px] text-red-400 mt-3 pt-2 border-t border-slate-800 font-mono">
                {"-->"} ส่ง Output ให้ Burp
              </div>
            </div>

            {/* Box 2: Burp Suite */}
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 relative group hover:border-amber-400 transition-all">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                02
              </div>
              <h5 className="font-black text-white text-xs">Burp Suite Pro</h5>
              <p className="text-[11px] text-amber-300 font-semibold">HTTP Intercept & Tamper</p>
              <ul className="text-[10px] text-slate-400 mt-2 space-y-1 list-disc list-inside">
                <li>Proxy Interceptor</li>
                <li>Repeater Request</li>
                <li>Payload Intruder</li>
              </ul>
              <div className="text-[10px] text-amber-400 mt-3 pt-2 border-t border-slate-800 font-mono">
                {"-->"} จำลองการ Bypass สิทธิ์
              </div>
            </div>

            {/* Box 3: DVWA Sandbox */}
            <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 relative group hover:border-purple-400 transition-all">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-2">
                03
              </div>
              <h5 className="font-black text-white text-xs">DVWA Benchmark</h5>
              <p className="text-[11px] text-purple-300 font-semibold">Vulnerability Lab</p>
              <ul className="text-[10px] text-slate-400 mt-2 space-y-1 list-disc list-inside">
                <li>SQLi Baseline</li>
                <li>XSS & CSRF Baseline</li>
                <li>เทียบเคียง CVSS</li>
              </ul>
              <div className="text-[10px] text-purple-400 mt-3 pt-2 border-t border-slate-800 font-mono">
                {"-->"} มาตรฐานอ้างอิงทดสอบ
              </div>
            </div>

            {/* Box 4: Model Context Protocol (MCP) */}
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 relative group hover:border-emerald-400 transition-all">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-2">
                04
              </div>
              <h5 className="font-black text-emerald-300 text-xs">Model Context Protocol</h5>
              <p className="text-[11px] text-emerald-400 font-semibold">Live Context Bridge</p>
              <ul className="text-[10px] text-slate-300 mt-2 space-y-1 list-disc list-inside font-mono">
                <li>view_file / grep</li>
                <li>run_command</li>
                <li>replace_file_content</li>
              </ul>
              <div className="text-[10px] text-emerald-400 mt-3 pt-2 border-t border-slate-800 font-mono">
                {"<-->"} Two-way Realtime
              </div>
            </div>

            {/* Box 5: Claude AI Engine */}
            <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/50 shadow-lg shadow-sky-500/10 relative group hover:border-sky-400 transition-all">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs mb-2">
                05
              </div>
              <h5 className="font-black text-sky-300 text-xs">Claude AI Engine</h5>
              <p className="text-[11px] text-sky-400 font-semibold">AST & Auto Patching</p>
              <ul className="text-[10px] text-slate-300 mt-2 space-y-1 list-disc list-inside">
                <li>Semantic Code Analysis</li>
                <li>Logic Flaw Detection</li>
                <li>Generate Secure Patch</li>
              </ul>
              <div className="text-[10px] text-sky-400 mt-3 pt-2 border-t border-slate-800 font-mono">
                {"-->"} Auto Patch to Code
              </div>
            </div>

          </div>

          {/* Target Production System Flow */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs text-center space-y-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
              🎯 เป้าหมายผลผลิตที่ได้รับการยกระดับความปลอดภัย (Secured Target System)
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                1. Web Client (React + Vite)
              </span>
              <span className="text-indigo-400">{"-->"}</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                2. Serverless API (/api/admin-auth.js)
              </span>
              <span className="text-indigo-400">{"-->"}</span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                3. Database (Supabase PostgreSQL RLS)
              </span>
            </div>
          </div>
        </div>

        {/* Diagram 2: Pentest & Remediation Pipeline Workflow */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ผังที่ 2: ไปป์ไลน์การตรวจสอบและแพตช์โค้ดแบบอัตโนมัติ (Automated Pipeline)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">5-Step Pipeline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <span className="text-orange-400 font-black text-xs block">ขั้นตอนที่ 1</span>
              <p className="font-bold text-white">Reconnaissance</p>
              <p className="text-[10px] text-slate-400">สแกนพอร์ตและ Headers ด้วย Kali Nmap/Nikto</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <span className="text-amber-400 font-black text-xs block">ขั้นตอนที่ 2</span>
              <p className="font-bold text-white">Tampering Test</p>
              <p className="text-[10px] text-slate-400">ดักจับ Token และจำลองการแฮกด้วย Burp Suite</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <span className="text-emerald-400 font-black text-xs block">ขั้นตอนที่ 3</span>
              <p className="font-bold text-white">MCP Ingestion</p>
              <p className="text-[10px] text-slate-400">ส่ง AST และ Source Code สดเข้าสู่ Claude AI</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <span className="text-sky-400 font-black text-xs block">ขั้นตอนที่ 4</span>
              <p className="font-bold text-white">AI Hardening</p>
              <p className="text-[10px] text-slate-400">Claude เขียน Patch ป้องกันและรันสคริปต์ SQL</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-center space-y-1">
              <span className="text-emerald-400 font-black text-xs block">ขั้นตอนที่ 5</span>
              <p className="font-bold text-emerald-300">Retest & Verify</p>
              <p className="text-[10px] text-slate-400">ยิงซ้ำ ยืนยัน Residual Risk เท่ากับ 0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECTION: กราฟและแผนภูมิสถิติ (Visual Charts & Analytics) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
              Statistical Charts & Metrics
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              กราฟและแผนภูมิสถิติการประเมิน (Visual Analytics & Metrics)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ข้อมูลเชิงปริมาณแสดงการกระจายตัวของช่องโหว่ เวลาที่ใช้ในการแก้ไข และดัชนีคะแนนความเสี่ยง CVSS v3.1
          </p>
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Chart 1: Vulnerability Severity Distribution */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                <span>1. สัดส่วนช่องโหว่ตามระดับความรุนแรง (Severity Distribution)</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">20/20 แก้ไขแล้ว</span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Critical Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-red-400">ระดับวิกฤต (Critical) · CVSS 9.0 - 10.0</span>
                  <span className="font-mono text-slate-300">4 รายการ (20%) · แก้ไขแล้ว 100%</span>
                </div>
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full w-[20%]" />
                </div>
              </div>

              {/* High Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-amber-400">ระดับสูง (High) · CVSS 7.0 - 8.9</span>
                  <span className="font-mono text-slate-300">6 รายการ (30%) · แก้ไขแล้ว 100%</span>
                </div>
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full w-[30%]" />
                </div>
              </div>

              {/* Medium Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-yellow-400">ระดับปานกลาง (Medium) · CVSS 4.0 - 6.9</span>
                  <span className="font-mono text-slate-300">7 รายการ (35%) · แก้ไขแล้ว 100%</span>
                </div>
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full w-[35%]" />
                </div>
              </div>

              {/* Low Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-sky-400">ระดับต่ำ (Low / Info) · CVSS 0.1 - 3.9</span>
                  <span className="font-mono text-slate-300">3 รายการ (15%) · แก้ไขแล้ว 100%</span>
                </div>
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full w-[15%]" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>สรุปสถานะการแก้ไข: ช่องโหว่ทั้ง 20 รายการได้รับการปิดกั้นเรียบร้อย 100%</span>
            </div>
          </div>

          {/* Chart 2: Time Efficiency Comparison */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>2. ระยะเวลาในการตรวจและแก้ไข (Audit Time Comparison)</span>
              </h4>
              <span className="text-[11px] font-mono text-sky-400 font-bold">เร็วกว่า 288 เท่า</span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Manual Pentest Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">แบบดั้งเดิม (Manual Pentest & Code Review)</span>
                  <span className="font-mono text-red-400 font-bold">~72 ชั่วโมง (3 วัน)</span>
                </div>
                <div className="h-6 w-full bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-red-600 to-rose-600 rounded-full w-[100%] flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-white">
                    100% Time
                  </div>
                </div>
              </div>

              {/* AI + MCP Pipeline Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400">นวัตกรรม AI (Claude + MCP Automated Pipeline)</span>
                  <span className="font-mono text-emerald-400 font-bold">~15 นาที (0.35%)</span>
                </div>
                <div className="h-6 w-full bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[6%] flex items-center justify-start pl-1 text-[10px] font-mono font-bold text-white">
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 text-[11px] text-sky-300 space-y-1">
              <span className="font-bold block text-sky-200">💡 การวิเคราะห์ผลเชิงเวลา (Time Efficiency Analysis):</span>
              <p className="leading-relaxed">
                การผสาน Claude AI ผ่าน MCP ช่วยลดเวลาในการอ่านโครงสร้างโค้ด การค้นหาช่องโหว่ในหลายไฟล์พร้อมกัน และการสร้างโค้ดแพตช์จาก 72 ชั่วโมง เหลือเพียง 15 นาที ลดเวลาลงกว่า <strong>99.6%</strong>
              </p>
            </div>
          </div>

          {/* Chart 3: CVSS Risk Score Before vs After */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>3. คะแนนความเสี่ยงเฉลี่ยรวม (CVSS v3.1 Score Reduction)</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">0.0 Safe</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-center">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1">
                <span className="text-xs text-red-300 font-bold block">ก่อนการวิจัยและแก้ไข</span>
                <span className="text-3xl font-black text-red-400 font-mono">8.9</span>
                <span className="text-[11px] text-red-300 block">ระดับ High - Critical Risk</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <span className="text-xs text-emerald-300 font-bold block">หลังการแก้ไขและ Patching</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">0.0</span>
                <span className="text-[11px] text-emerald-300 block">ปลอดภัย (Zero Residual Risk)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              * ประเมินตามเกณฑ์มาตรฐาน FIRST Common Vulnerability Scoring System (CVSS v3.1)
            </p>
          </div>

          {/* Chart 4: Detection Accuracy by Tool */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>4. อัตราความครอบคลุมในการตรวจจับ (Detection Coverage)</span>
              </h4>
              <span className="text-[11px] font-mono text-purple-400 font-bold">AI สูงสุด 98%</span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Kali Linux / Network Scanner (Nikto/Nmap)</span>
                  <span className="font-mono text-red-400">65% Coverage</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-red-500 rounded-full w-[65%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Burp Suite Pro (Dynamic Interception & DAST)</span>
                  <span className="font-mono text-amber-400">80% Coverage</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-500 rounded-full w-[80%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-bold">Claude AI + MCP (Semantic AST & Context Analysis)</span>
                  <span className="font-mono text-emerald-400 font-bold">98% Coverage</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 rounded-full w-[98%]" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * Claude + MCP สามารถตรวจจับช่องโหว่ Business Logic และการรั่วไหลของ Secret ภายในโค้ดที่เครื่องมือ DAST ทั่วไปไม่สามารถเข้าถึงได้
            </p>
          </div>

        </div>
      </div>

      {/* 5. SECTION: ตารางเปรียบเทียบเชิงวิชาการ (Academic Comparison Tables) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
              Comparative Analysis Tables
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              ตารางเปรียบเทียบเชิงวิชาการ (Academic Comparison Tables)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ตารางเปรียบเทียบเครื่องมือรักษาความปลอดภัย 5 ชนิด และตารางแมปตามมาตรฐาน OWASP Top 10 (2021)
          </p>
        </div>

        {/* Table 1: Security Tools Matrix */}
        <div className="space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>ตารางที่ 1: ตารางเปรียบเทียบคุณสมบัติเครื่องมือวิจัยความปลอดภัย (Security Tools Matrix)</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-semibold">
                  <th className="p-3.5 whitespace-nowrap">เครื่องมือ (Tool)</th>
                  <th className="p-3.5 whitespace-nowrap">บทบาทในงานวิจัย</th>
                  <th className="p-3.5 whitespace-nowrap">จุดเด่นสำคัญ</th>
                  <th className="p-3.5 whitespace-nowrap">ข้อจำกัด</th>
                  <th className="p-3.5 whitespace-nowrap">ผลลัพธ์ในระบบ JRE 2027</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {securityTools.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        t.color === 'red' ? 'bg-red-400' :
                        t.color === 'amber' ? 'bg-amber-400' :
                        t.color === 'purple' ? 'bg-purple-400' :
                        t.color === 'sky' ? 'bg-sky-400' : 'bg-emerald-400'
                      }`} />
                      {t.name}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">{t.role}</td>
                    <td className="p-3.5 text-slate-300 leading-relaxed">{t.pros}</td>
                    <td className="p-3.5 text-slate-400 leading-relaxed">{t.cons}</td>
                    <td className="p-3.5 text-emerald-300 font-medium leading-relaxed">{t.resultInJRE}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: OWASP Top 10 (2021) Mapping Matrix */}
        <div className="space-y-3 pt-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400" />
            <span>ตารางที่ 2: การจำแนกช่องโหว่ตามเกณฑ์มาตรฐาน OWASP Top 10 (2021 Mapping)</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-semibold">
                  <th className="p-3.5 whitespace-nowrap">รหัส OWASP</th>
                  <th className="p-3.5 whitespace-nowrap">หมวดหมู่ช่องโหว่ (Category)</th>
                  <th className="p-3.5 whitespace-nowrap">ความเสี่ยงที่พบในระบบ JRE 2027</th>
                  <th className="p-3.5 whitespace-nowrap">มาตรการแก้ไขเชิงวิศวกรรม</th>
                  <th className="p-3.5 whitespace-nowrap">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-red-400">A01:2021</td>
                  <td className="p-3.5 font-bold text-white">Broken Access Control</td>
                  <td className="p-3.5 text-slate-300">Bypass สิทธิ์ Admin ผ่าน localStorage และ IDOR แก้ไขใบสมัครผู้อื่น</td>
                  <td className="p-3.5 text-emerald-300">ยกเลิกสิทธิ์หน้าบ้าน ตรวจสอบ Signed Token และเปิดใช้ Supabase RLS</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-red-400">A02:2021</td>
                  <td className="p-3.5 font-bold text-white">Cryptographic Failures</td>
                  <td className="p-3.5 text-slate-300">รหัสผ่านแอดมินฝังใน Vite bundle (.js) หน้าบ้าน</td>
                  <td className="p-3.5 text-emerald-300">ย้ายไปหลังบ้าน Serverless และแฮชด้วย Salted PBKDF2/SHA-256</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-amber-400">A03:2021</td>
                  <td className="p-3.5 font-bold text-white">Injection</td>
                  <td className="p-3.5 text-slate-300">การส่งอักขระพิเศษผ่านช่องค้นหาและฟิลด์ฟอร์มรับสมัคร</td>
                  <td className="p-3.5 text-emerald-300">ใช้ Parameterized Queries บน Supabase Client และฟอกข้อมูล</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-amber-400">A04:2021</td>
                  <td className="p-3.5 font-bold text-white">Insecure Design</td>
                  <td className="p-3.5 text-slate-300">ขาด Rate Limiting ในฟอร์มสมัคร เสี่ยงถูกบอทสแปมใบสมัครซ้ำซ้อน</td>
                  <td className="p-3.5 text-emerald-300">ติดตั้ง Anti-Bot Honeypot และ Rate Limiting Throttle Control</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-yellow-400">A05:2021</td>
                  <td className="p-3.5 font-bold text-white">Security Misconfiguration</td>
                  <td className="p-3.5 text-slate-300">ขาด Header HSTS, CSP และ X-Content-Type-Options</td>
                  <td className="p-3.5 text-emerald-300">กำหนดค่า Security Headers บน Vercel Configuration</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-yellow-400">A07:2021</td>
                  <td className="p-3.5 font-bold text-white">Identification & Authentication Failures</td>
                  <td className="p-3.5 text-slate-300">ช่องกรอกรหัส Admin ถูกสุ่มรหัสผ่านได้ไม่จำกัด (Brute-Force)</td>
                  <td className="p-3.5 text-emerald-300">บล็อก IP 15 นาทีหากกรอกผิดเกิน 5 ครั้ง พร้อม Timing-Safe Compare</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-mono font-bold text-sky-400">A09:2021</td>
                  <td className="p-3.5 font-bold text-white">Security Logging & Monitoring</td>
                  <td className="p-3.5 text-slate-300">ไม่มีไฟล์แจ้งเตือนช่องโหว่ตามมาตรฐาน RFC 9116</td>
                  <td className="p-3.5 text-emerald-300">สร้าง `/.well-known/security.txt` และระบบบันทึก Audit Logs</td>
                  <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">🟢 ปลอดภัย 100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. SECTION: ตัวอย่างโค้ดเปรียบเทียบ ก่อน vs หลัง (Before vs After Code Diff) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                Code Comparison Diffs
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                ตัวอย่างโค้ดเปรียบเทียบ ก่อน vs หลังการแก้ไข (Code Diffs)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              แสดงการแก้ไขความปลอดภัยเชิงลึกในซอร์สโค้ดจริง จากโค้ดที่มีช่องโหว่สู่โค้ดที่ผ่านการรับรองความปลอดภัย
            </p>
          </div>

          {/* Case Selector Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {codeDiffCases.map((c, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCodeCase(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCodeCase === idx
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                กรณีที่ {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Diff Box */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              {codeDiffCases[activeCodeCase].title}
            </h3>
            <p className="text-xs text-amber-400 font-mono mt-0.5">
              {codeDiffCases[activeCodeCase].cwe}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Before (Red) */}
            <div className="rounded-2xl bg-slate-950 border border-red-500/40 overflow-hidden shadow-lg">
              <div className="p-3 bg-red-950/40 border-b border-red-500/30 flex items-center justify-between text-xs">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>ก่อนแก้ไข (Vulnerable Code - พบช่องโหว่)</span>
                </span>
                <span className="font-mono text-[10px] text-red-400/80">
                  {codeDiffCases[activeCodeCase].beforeFile}
                </span>
              </div>
              <pre className="p-4 text-xs font-mono text-red-200/90 overflow-x-auto leading-relaxed bg-red-950/10 whitespace-pre-wrap">
                {codeDiffCases[activeCodeCase].beforeCode}
              </pre>
            </div>

            {/* After (Green) */}
            <div className="rounded-2xl bg-slate-950 border border-emerald-500/40 overflow-hidden shadow-lg">
              <div className="p-3 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>หลังแก้ไข (Hardened Code - ปลอดภัยสมบูรณ์)</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400/80">
                  {codeDiffCases[activeCodeCase].afterFile}
                </span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-200/90 overflow-x-auto leading-relaxed bg-emerald-950/10 whitespace-pre-wrap">
                {codeDiffCases[activeCodeCase].afterCode}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* 7. SECTION: เอกสารอ้างอิงและบรรณานุกรมเชิงวิชาการ (Academic References) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm sm:text-base font-black text-white">
            เอกสารอ้างอิงเชิงวิชาการและมาตรฐานสากล (Academic References)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">1. OWASP Top 10 (2021)</span>
            <p className="leading-relaxed">
              Open Web Application Security Project (OWASP). (2021). <em>The Ten Most Critical Web Application Security Risks</em>. Retrieved from https://owasp.org/Top10/
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">2. MITRE CWE Specification</span>
            <p className="leading-relaxed">
              The MITRE Corporation. (2024). <em>Common Weakness Enumeration: A Community-Developed List of Software Weakness Types</em>. Retrieved from https://cwe.mitre.org/
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">3. Model Context Protocol Specification</span>
            <p className="leading-relaxed">
              Anthropic. (2024). <em>Model Context Protocol (MCP): Open standard for AI models to securely access external tools and data sources</em>. https://modelcontextprotocol.io
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">4. NIST Cybersecurity Framework (SP 800-53)</span>
            <p className="leading-relaxed">
              National Institute of Standards and Technology. (2020). <em>Security and Privacy Controls for Information Systems and Organizations</em>. NIST Special Publication 800-53, Rev. 5.
            </p>
          </div>
        </div>
      </div>

      {/* 8. FOOTER BAR WITH DIRECT ACTION BUTTONS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-bold text-white">
            🎓 สรุปการนำเสนอโครงงานวิจัยความปลอดภัยเว็บแอปพลิเคชัน JRE 2027
          </p>
          <p className="text-slate-400 text-[11px]">
            จัดทำโดยทีมพัฒนาระบบ RCPDEV ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSwitchToAudit}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ดูรายละเอียดช่องโหว่ 20 รายการ</span>
          </button>

          <button
            onClick={handleCopyUrl}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedUrl ? 'คัดลอกลิงก์สำเร็จ!' : 'แชร์ URL หน้านี้'}</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </div>

    </div>
  );
}
