import React, { useState } from 'react';
import { 
  Shield, 
  MapPin, 
  Phone, 
  Mail, 
  Heart, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink,
  Code2,
  Database,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import PDPAModal from './PDPAModal';

export default function Footer({ onOpenAdminLogin }) {
  const [showPdpaModal, setShowPdpaModal] = useState(false);

  // Auto-updating Buddhist Era Year (e.g. 2569 onwards)
  const currentYearBE = new Date().getFullYear() + 543;
  const copyrightYearText = currentYearBE > 2569 ? `2569 - ${currentYearBE}` : '2569';

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: About JRE 2027 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo/jre_logo.png" 
                alt="ตราสัญลักษณ์ JRE 2027" 
                className="w-9 h-11 object-contain drop-shadow" 
              />
              <span className="text-xl font-black text-white tracking-wide">
                JRE <span className="text-rescue-500">2027</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              โครงการฝึกอบรมเชิงปฏิบัติการ "JRE 2027" (Joint Response Exercise 2027) 
              จัดโดย ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม 
              เพื่อเสริมสร้างทักษะการกู้ภัยเบื้องต้นและสร้างเครือข่ายความร่วมมือในการรับมือเหตุฉุกเฉินระหว่างสถาบันอุดมศึกษาทั่วประเทศ (ทุกภูมิภาค)
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>• ภาคีเครือข่ายกู้ภัยนิสิตนักศึกษา 8 สถาบันหลักทั่วประเทศ</p>
              <p>• อาสาสมัครกู้ชีพ กู้ภัย และบรรเทาสาธารณภัยทุกภูมิภาค</p>
            </div>
          </div>

          {/* Col 2: Contact Organizer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              ติดต่อ
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rescue-500 shrink-0 mt-0.5" />
                <span>อาคารกองกิจการนิสิต ชั้น 2 มหาวิทยาลัยมหาสารคาม (มมส)</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-rescue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">เบอร์ติดต่อสอบถามผู้จัดโครงการ:</span>
                  <a 
                    href="tel:0983296762" 
                    className="font-mono text-slate-200 hover:text-rescue-400 font-bold transition-colors cursor-pointer"
                    title="คลิกเพื่อโทรออก"
                  >
                    098-329-6762
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rescue-500 shrink-0" />
                <a 
                  href="mailto:rescue.rajapruek@msu.ac.th" 
                  className="text-slate-200 hover:text-rescue-400 font-medium transition-colors break-all cursor-pointer"
                  title="คลิกเพื่อส่งอีเมล"
                >
                  rescue.rajapruek@msu.ac.th
                </a>
              </div>
            </div>
          </div>

          {/* Col 3: Developer & Web Admin Team (JRE DEV) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>ทีมพัฒนาและเทคโนโลยีระบบ JRE DEV</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 leading-snug">
                <div className="flex items-center gap-1 font-bold mb-0.5 text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>คำเตือนช่องทางติดต่อ:</span>
                </div>
                <span>ใช้สำหรับปัญหาบัญชี เว็บไซต์ ความปลอดภัย หรือข้อมูลระบบ <strong>ไม่ใช่ช่องทางขอรถพยาบาล</strong></span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">ผู้ดูแลระบบเว็บไซต์:</span>
                <span className="font-bold text-white">นายพงศ์ภรณ์ ทองศิริ · JRE DEV (BestCyniX)</span>
              </div>

              <p className="text-[11px] text-slate-400">
                รายงานปัญหาเว็บไซต์ ความปลอดภัย บัญชี หรือข้อมูลระบบ
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>โทร:</span>
                  <a 
                    href="tel:0889463459" 
                    className="font-mono text-emerald-400 font-bold hover:underline cursor-pointer"
                    title="คลิกเพื่อโทรติดต่อผู้ดูแลระบบ"
                  >
                    088-946-3459
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <a 
                    href="mailto:bestcynix@gmail.com" 
                    className="text-sky-300 hover:text-sky-200 font-mono hover:underline break-all cursor-pointer"
                    title="คลิกเพื่อส่งอีเมลติดต่อผู้ดูแลระบบ"
                  >
                    bestcynix@gmail.com
                  </a>
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-semibold shrink-0">
                    กรณีระบบเร่งด่วน
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * กรณีทั่วไปให้ส่งรายงานผ่านหน้าแจ้งปัญหาเว็บก่อน
              </p>
            </div>
          </div>

          {/* Col 4: Links & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              ข้อมูลระบบ & ลิงก์
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://github.com/bestcynix/JRE-2027" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors group cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current group-hover:text-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub Repository (JRE-2027)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white" />
                </a>
              </li>
              <li>
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1.5 transition-colors group cursor-pointer"
                  title="Supabase Database, Auth & Storage Console"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>supperbase</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://jre-2027.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors group cursor-pointer"
                >
                  <span className="text-white font-bold">▲</span>
                  <span>Vercel Production (jre-2027)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white" />
                </a>
              </li>
              <li>
                <a 
                  href="https://pdpa.msu.ac.th/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-rescue-400 flex items-center gap-1.5 transition-colors group cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rescue-500" />
                  <span>นโยบายข้อมูลส่วนบุคคล (PDPA มมส)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-rescue-400" />
                </a>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="text-slate-400 hover:text-purple-300 text-xs flex items-center gap-1.5 transition-colors px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin)</span>
                </button>
              </li>
              <li className="pt-1">
                <a
                  href="/presentation"
                  className="text-indigo-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-500/40 hover:border-indigo-400 rounded-xl cursor-pointer inline-flex font-bold shadow-sm"
                  title="ดูหน้าสไลด์และผลการวิจัย AI & MCP สำหรับนำเสนออาจารย์"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>🎓 นำเสนอวิจัย AI & MCP (Presentation)</span>
                </a>
              </li>
              <li className="pt-0.5">
                <a
                  href="/security"
                  className="text-slate-300 hover:text-emerald-300 text-xs flex items-center gap-1.5 transition-colors px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl cursor-pointer inline-flex font-semibold"
                  title="ดูรายงานความมั่นคงปลอดภัยและการแก้ไขช่องโหว่ (Security Center)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>รายงานความมั่นคงปลอดภัย (Security) 🟢</span>
                </a>
              </li>
              <li className="pt-2 border-t border-slate-900 mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 hover:underline">robots.txt</a>
                <span>•</span>
                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 hover:underline">sitemap.xml</a>
                <span>•</span>
                <a href="/.well-known/security.txt" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 hover:underline">security.txt</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Developer Full Credit */}
        <div className="mt-10 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-6">
          <div className="text-center md:text-left leading-relaxed space-y-3 w-full md:w-auto">
            {/* Auto-updating Copyright line */}
            <p className="text-slate-400 font-medium">
              © {copyrightYearText} JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม สงวนลิขสิทธิ์
            </p>

            {/* Developer Card with full details and interactive buttons */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-2 pt-1">
              <span className="text-slate-400 shrink-0 font-semibold">พัฒนาระบบโดย:</span>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-rescue-400 font-black">
                    Dev JRE-2027 นายพงศ์ภรณ์ ทองศิริ (BestCyniX)
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-slate-300 font-semibold">68011211206</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">สาขาวิทยาการสารสนเทศ</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">เทคโนโลยีสารสนเทศ</span>
                </div>
              </div>
            </div>
          </div>

          <p className="flex items-center gap-1 shrink-0 text-slate-400 text-xs">
            ร่วมใจเพื่อความปลอดภัยของสังคม <Heart className="w-3.5 h-3.5 text-emergency-500 fill-emergency-500" />
          </p>
        </div>
      </div>

      <PDPAModal
        isOpen={showPdpaModal}
        onClose={() => setShowPdpaModal(false)}
      />
    </footer>
  );
}
