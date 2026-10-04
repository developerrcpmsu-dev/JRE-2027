import React, { useState } from 'react';
import { Flame, Shield, MapPin, Phone, Mail, Heart, ShieldCheck } from 'lucide-react';
import PDPAModal from './PDPAModal';

export default function Footer({ onOpenAdminLogin }) {
  const [showPdpaModal, setShowPdpaModal] = useState(false);
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-4">
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
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              โครงการฝึกอบรมเชิงปฏิบัติการ "JRE 2027" (Joint Response Exercise 2027) 
              จัดโดย ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม 
              เพื่อเสริมสร้างทักษะการกู้ภัยเบื้องต้นและสร้างเครือข่ายความร่วมมือในการรับมือเหตุฉุกเฉินระหว่างสถาบันอุดมศึกษาทั่วประเทศ (ทุกภูมิภาค)
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>• ร่วมกับ อาสาสมัครปฏิบัติการและสืบสวนพิเศษ มหาวิทยาลัยขอนแก่น (มข.)</p>
              <p>• ร่วมกับ ชมรมอาสาสมัครกู้ชีพ ชุดเคลื่อนที่เร็ว มหาวิทยาลัยเกษตรศาสตร์ (มก.)</p>
              <p>• และเครือข่ายชมรมกู้ชีพกู้ภัยมหาวิทยาลัยทั่วประเทศ ทุกภูมิภาค</p>
            </div>
          </div>

          {/* Col 2: Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              สถานที่จัดโครงการ & ติดต่อ
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rescue-500 shrink-0 mt-0.5" />
                <span>กองกิจการนิสิต / อาคารบรมราชกุมารี มหาวิทยาลัยมหาสารคาม (มมส)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rescue-500 shrink-0" />
                <span>เบอร์ฉุกเฉินชมรม: 043-754-321 ต่อ 1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rescue-500 shrink-0" />
                <span>rescue.rajapruek@msu.ac.th</span>
              </div>
            </div>
          </div>

          {/* Col 3: Links & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              ข้อมูลระบบ & ลิงก์
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://github.com/developerrcpmsu-dev/JRE-2027" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub Repository (JRE-2027)
                </a>
              </li>
              <li>
                <a 
                  href="https://vercel.com/new?teamSlug=rcp-msu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>▲</span> Vercel Deployment (rcp-msu)
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => setShowPdpaModal(true)}
                  className="text-slate-400 hover:text-rescue-400 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rescue-500" />
                  นโยบายข้อมูลส่วนบุคคล (PDPA มมส)
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenAdminLogin}
                  className="text-slate-500 hover:text-purple-400 text-xs flex items-center gap-1 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  เข้าสู่ระบบผู้ดูแลระบบ (Admin)
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="text-center md:text-left leading-relaxed space-y-1.5">
            <p>
              © 2569 - {new Date().getFullYear() + 543} JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม สงวนลิขสิทธิ์
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-0.5">
              <span className="text-slate-400">พัฒนาระบบโดย:</span>
              <a
                href="tel:0889463459"
                title="คลิกเพื่อโทรติดต่อผู้พัฒนาระบบเมื่อพบปัญหา"
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 font-semibold transition-all duration-300 hover:border-rescue-500 hover:bg-gradient-to-r hover:from-rescue-950/80 hover:via-slate-900 hover:to-orange-950/80 hover:text-rescue-400 hover:shadow-xl hover:shadow-rescue-500/25 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-rescue-400 font-black group-hover:text-amber-300 transition-colors">
                  Dev RCP16-37 นายพงศ์ภรณ์ ทองศิริ
                </span>
                <span className="text-[11px] text-slate-400 group-hover:text-orange-200 transition-colors border-l border-slate-700 pl-2">
                  ระบบมีปัญหา กรุณาติดต่อ Dev: <span className="font-mono text-emerald-400 font-bold group-hover:underline">088-9463459</span>
                </span>
              </a>
            </div>
          </div>
          <p className="flex items-center gap-1 shrink-0 text-slate-400">
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
