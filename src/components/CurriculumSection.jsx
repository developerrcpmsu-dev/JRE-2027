import React from 'react';
import { 
  ShieldCheck, 
  Flame, 
  Compass, 
  Layers, 
  Users, 
  Sparkles, 
  Radio, 
  Wind, 
  LifeBuoy, 
  Building2, 
  GraduationCap,
  Award,
  Zap
} from 'lucide-react';

export default function CurriculumSection() {
  return (
    <section className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/40 border border-orange-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
            <Flame className="w-4 h-4 animate-pulse text-orange-500" />
            <span>หลักสูตรฝึกอบรมเชิงปฏิบัติการ JRE 2027</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            🚨 หัวข้อการเรียนรู้และการฝึกอบรม
          </h2>

          <p className="text-sm sm:text-base text-orange-300 font-bold">
            “เรียนรู้จริง ฝึกจริง จำลองสถานการณ์จริง”
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl font-normal">
            การฝึก <strong>Joint Response Exercise (JRE 2027)</strong> ออกแบบหลักสูตรให้ผู้เข้าร่วมได้พัฒนาทักษะทั้ง <strong>ภาคทฤษฎีและภาคปฏิบัติ</strong> โดยได้รับการถ่ายทอดความรู้จาก <strong>อาจารย์ประจำหลักสูตรอาชีวอนามัยและความปลอดภัย คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม</strong> ร่วมกับ <strong>เจ้าหน้าที่งานป้องกันและบรรเทาสาธารณภัยจากกระทรวงมหาดไทย</strong> และ <strong>งานป้องกันและบรรเทาสาธารณภัย มหาวิทยาลัยมหาสารคาม</strong>
          </p>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            เนื้อหาการฝึกครอบคลุมตั้งแต่พื้นฐานการทำงานอย่างปลอดภัย ไปจนถึงการปฏิบัติการในสถานการณ์ฉุกเฉินที่ต้องอาศัย 
            <span className="text-white font-semibold"> การตัดสินใจ • การสื่อสาร • การทำงานเป็นทีม • และการบัญชาการเหตุการณ์ (ICS)</span>
          </div>
        </div>
      </div>

      {/* Part 1: Theory & Learning */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              📚 ภาคทฤษฎีและการเรียนรู้ (Theory & Core Knowledge)
            </h3>
            <p className="text-xs text-slate-400">
              ปูพื้นฐานความปลอดภัยและระบบบัญชาการสากลก่อนลงสู่สนามฝึก
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Safety */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/40 transition-all shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                MODULE 1
              </span>
              <span className="text-xl">🦺</span>
            </div>
            <h4 className="text-base font-black text-white">
              1. ความปลอดภัยในการปฏิบัติงาน
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              เรียนรู้หลักความปลอดภัยในการเข้าปฏิบัติงาน การประเมินความเสี่ยง การใช้อุปกรณ์ป้องกันส่วนบุคคล (PPE) และการทำงานในพื้นที่เกิดเหตุอย่างเป็นระบบตามมาตรฐานสากล
            </p>
          </div>

          {/* Card 2: Incident Command System */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MODULE 2
              </span>
              <span className="text-xl">🎯</span>
            </div>
            <h4 className="text-base font-black text-white">
              2. ระบบบัญชาการเหตุการณ์และการจัดการสถานการณ์
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              เรียนรู้หลักการ Incident Command System (ICS) การแบ่งหน้าที่ ความรับผิดชอบ การสื่อสารข่ายวิทยุ การประสานงาน การวางแผนยุทธวิธี และการตัดสินใจภายใต้สถานการณ์ฉุกเฉิน
            </p>
          </div>

        </div>

        {/* 3 Skill Stations */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🧰</span>
            <h4 className="text-sm sm:text-base font-black text-white">
              3. ฐานเรียนรู้ทักษะเฉพาะด้าน (Skill Stations)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Station 1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ฐานที่ 1
                </span>
                <Compass className="w-4 h-4 text-amber-400" />
              </div>
              <h5 className="text-sm font-bold text-white leading-snug">
                ระบบเชือกและการลำเลียงผู้บาดเจ็บทางสูง
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                เรียนรู้พื้นฐานระบบเชือก การผูกเงื่อน การจัดระบบลำเลียง Mechanical Advantage และการใช้อุปกรณ์สำหรับช่วยเหลือผู้ประสบภัยในพื้นที่สูง
              </p>
            </div>

            {/* Station 2 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/30">
                  ฐานที่ 2
                </span>
                <Flame className="w-4 h-4 text-red-400" />
              </div>
              <h5 className="text-sm font-bold text-white leading-snug">
                อุปกรณ์ดับเพลิงและอุปกรณ์ประจำรถดับเพลิง
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                ทำความรู้จักอุปกรณ์ดับเพลิง เครื่องมือกู้ภัย หัวฉีด สายส่งน้ำ และอุปกรณ์ประจำรถดับเพลิง พร้อมเรียนรู้หลักการเลือกใช้อุปกรณ์ให้เหมาะสมกับสถานการณ์
              </p>
            </div>

            {/* Station 3 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ฐานที่ 3
                </span>
                <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <h5 className="text-sm font-bold text-white leading-snug">
                การติดตั้งและสวมใส่ SCBA
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                เรียนรู้ส่วนประกอบ การตรวจสอบความปลอดภัย การติดตั้ง และการสวมใส่ชุดช่วยหายใจ SCBA (Self-Contained Breathing Apparatus) เพื่อเตรียมพร้อมปฏิบัติการในพื้นที่ควันและก๊าซพิษ
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Part 2: Practical Drills */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              🔥 ภาคปฏิบัติ — จากห้องเรียนสู่สถานการณ์จำลอง (Simulated Exercises)
            </h3>
            <p className="text-xs text-slate-400">
              นำความรู้จากภาคทฤษฎีมาประยุกต์ใช้ผ่านสถานการณ์จำลองเหตุฉุกเฉิน แบ่งบทบาทและปฏิบัติการร่วมกันเป็นทีม
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          ผู้เข้าร่วมจะได้ฝึกปฏิบัติตั้งแต่ <strong>การรับแจ้งเหตุ • การประเมินสถานการณ์เบื้องต้น • การจัดตั้งระบบบัญชาการเหตุการณ์ (ICS) • ไปจนถึงการเข้าช่วยเหลือผู้ประสบภัย</strong>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Drill 1 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-orange-500/50 transition-all space-y-2.5 shadow-lg group">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl border border-red-500/30 group-hover:scale-105 transition-transform">
              🚒
            </div>
            <h4 className="text-sm font-black text-white leading-snug">
              จำลองเหตุเพลิงไหม้และการค้นหาภายในอาคาร
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ฝึกการเข้าค้นหาและช่วยเหลือผู้ประสบภัยในพื้นที่อาคารที่เกิดเหตุ โดยคำนึงถึงความปลอดภัยของผู้ปฏิบัติงานเป็นสำคัญ
            </p>
          </div>

          {/* Drill 2 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all space-y-2.5 shadow-lg group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl border border-amber-500/30 group-hover:scale-105 transition-transform">
              🧗
            </div>
            <h4 className="text-sm font-black text-white leading-snug">
              การโรยตัวและอพยพออกจากอาคาร
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ฝึกทักษะการเคลื่อนย้ายและอพยพออกจากพื้นที่สูงด้วยระบบเชือกอย่างปลอดภัยภายใต้สถานการณ์จำลอง
            </p>
          </div>

          {/* Drill 3 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2.5 shadow-lg group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/30 group-hover:scale-105 transition-transform">
              🛟
            </div>
            <h4 className="text-sm font-black text-white leading-snug">
              การลำเลียงผู้บาดเจ็บทางสูง
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ประยุกต์ใช้ระบบเชือกและ <strong>เปลม้วน (Roll-up Stretcher)</strong> ในการลำเลียงผู้บาดเจ็บจากพื้นที่สูงอย่างเป็นระบบ
            </p>
          </div>

          {/* Drill 4 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-red-500/50 transition-all space-y-2.5 shadow-lg group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl border border-rose-500/30 group-hover:scale-105 transition-transform">
              🔥
            </div>
            <h4 className="text-sm font-black text-white leading-snug">
              การระงับเหตุอัคคีภัย
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ฝึกการใช้อุปกรณ์และเครื่องมือดับเพลิง รวมถึงการประยุกต์ใช้อุปกรณ์ขั้นสูงในการควบคุมและระงับเหตุเพลิงไหม้
            </p>
          </div>

        </div>
      </div>

      {/* Part 3: Highlights Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-rescue-600 to-amber-600 p-6 sm:p-8 text-center shadow-2xl">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black text-white tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ ไฮไลต์ของการฝึก JRE 2027</span>
          </div>
          <blockquote className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md">
            “ไม่ใช่เพียงเรียนรู้ว่าต้องทำอะไร แต่ได้ฝึกว่าต้องทำอย่างไรเมื่อเกิดเหตุจริง”
          </blockquote>
        </div>
      </div>

    </section>
  );
}
