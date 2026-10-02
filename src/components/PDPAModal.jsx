import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2, Lock, AlertTriangle, Building, HeartPulse } from 'lucide-react';

export default function PDPAModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </h3>
              <p className="text-xs text-slate-400">
                โครงการ JRE 2027 • ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          
          <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex items-start gap-3 text-blue-200">
            <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">
                ประกาศการปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (มมส)
              </p>
              <p className="text-[11px] text-blue-200/90 leading-normal">
                ชมรมกู้ภัยราชพฤกษ์ องค์การนิสิต มหาวิทยาลัยมหาสารคาม ให้ความสำคัญสูงสุดในการคุ้มครองข้อมูลส่วนบุคคลของผู้สมัครและผู้เข้าร่วมโครงการ Joint Response Exercise (JRE 2027) ตามกฎหมายและประกาศมหาวิทยาลัยมหาสารคาม
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-rescue-400 flex items-center justify-center text-xs">1</span>
              ข้อมูลส่วนบุคคลที่มีการเก็บรวบรวม
            </h4>
            <p className="text-slate-400 pl-7">
              ระบบโครงการ JRE 2027 มีการจัดเก็บข้อมูลเท่าที่จำเป็นสำหรับการฝึกอบรม ได้แก่:
            </p>
            <ul className="list-disc pl-11 space-y-1 text-slate-300">
              <li><strong>ข้อมูลระบุตัวตน:</strong> ชื่อ-นามสกุล, สถาบันการศึกษา/สังกัด, วันเดือนปีเกิด/อายุ, ภาพถ่ายโปรไฟล์</li>
              <li><strong>ข้อมูลการติดต่อ:</strong> หมายเลขโทรศัพท์มือถือ, บัญชีอีเมล (Google Account), ข้อมูลผู้ติดต่อฉุกเฉิน</li>
              <li><strong>ข้อมูลสุขภาพและเวชศาสตร์ฉุกเฉิน:</strong> กรุ๊ปเลือด, โรคประจำตัว, ประวัติการแพ้ยา/อาหาร</li>
              <li><strong>ข้อมูลการเข้าร่วมและเอกสาร:</strong> หลักฐานการโอนค่าสมัคร (สลิป), เอกสารยินยอมผู้ปกครอง (หากอายุต่ำกว่า 18 ปี)</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-rescue-400 flex items-center justify-center text-xs">2</span>
              วัตถุประสงค์ในการนำข้อมูลไปใช้
            </h4>
            <ul className="list-disc pl-11 space-y-1 text-slate-300">
              <li>ยืนยันตัวตน ตรวจสอบสิทธิ์การสมัคร และจัดทำบัตรประจำตัวผู้เข้าฝึกอบรม (Badge)</li>
              <li>จัดสรรกลุ่มฝึกปฏิบัติการ (Command Sector) และห้องพักค้างแรม (Accommodations)</li>
              <li>เตรียมการด้านความปลอดภัย การแพทย์สนาม และการทำประกันอุบัติเหตุกลุ่มระหว่างฝึกซ้อม</li>
              <li>ออกเกียรติบัตรรับรองการฝึกอบรมร่วมกับ สนง. ปภ. จังหวัดมหาสารคาม</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-rescue-400 flex items-center justify-center text-xs">3</span>
              การรักษาความปลอดภัยและการไม่เปิดเผยข้อมูล
            </h4>
            <p className="text-slate-400 pl-7">
              ข้อมูลของคุณได้รับการจัดเก็บเข้ารหัสในฐานข้อมูล Supabase และจะถูกใช้เฉพาะคณะกรรมการจัดโครงการ JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มมส เท่านั้น จะไม่มีการจำหน่าย ให้เช่า หรือเผยแพร่แก่บุคคลภายนอกโดยไม่ได้รับความยินยอม
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-rescue-400 flex items-center justify-center text-xs">4</span>
              สิทธิของเจ้าของข้อมูลส่วนบุคคล
            </h4>
            <p className="text-slate-400 pl-7">
              คุณมีสิทธิในการขอเข้าถึง ตรวจสอบ แก้ไขข้อมูลส่วนบุคคลให้ถูกต้องเป็นปัจจุบัน หรือขอลบข้อมูลของตนเองได้ตลอดเวลาผ่านหน้า "แดชบอร์ด/บัญชีของฉัน" หรือติดต่อฝ่ายเทคโนโลยีโครงการ (<span className="text-white">developer.rcpmsu@gmail.com</span>)
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-rescue-600 hover:bg-rescue-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            รับทราบและปิดหน้านี้
          </button>
        </div>

      </div>
    </div>
  );
}
