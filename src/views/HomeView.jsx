import React from 'react';
import { 
  Flame, 
  Shield, 
  Users, 
  Award, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Activity, 
  FileCheck2,
  HeartHandshake
} from 'lucide-react';

export default function HomeView({ 
  teamMembers, 
  speakers, 
  onNavigateRegister, 
  onNavigateSchedule,
  myRegistration,
  onOpenGoogleLogin
}) {
  const msuTeam = teamMembers.filter(m => m.tag?.includes('มมส') || m.institution?.includes('มมส'));
  const kkuTeam = teamMembers.filter(m => m.tag?.includes('มข') || m.institution?.includes('มข'));

  return (
    <div className="space-y-16 animate-in fade-in duration-300">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 md:p-16">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rescue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emergency-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-emergency-500/20 text-emergency-400 border border-emergency-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              การฝึกซ้อมร่วมประจำปี 2570
            </span>
            <span className="px-3 py-1 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              มหาวิทยาลัยมหาสารคาม (มมส)
            </span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rescue-400" />
              7 - 8 พฤศจิกายน 2569 (2 วัน 1 คืน)
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            มมส จัด <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rescue-500 to-amber-300">JRE 2027</span><br />
            ติวเข้มเครือข่ายกู้ภัยนักศึกษาทั่วประเทศ
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-3xl">
            ยกระดับทักษะรับมือเหตุฉุกเฉินระดับประเทศ สานต่อความสำเร็จจากการฝึกซ้อม JRE 2026 โดย 
            <span className="font-semibold text-white"> ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม </span>
            ร่วมกับมหาวิทยาลัยและเครือข่ายกู้ภัยนักศึกษาทั่วประเทศทุกภูมิภาค (ภาคอีสาน, ภาคกลาง, ภาคเหนือ, ภาคใต้, ภาคตะวันออก)
            ได้รับเกียรติจาก <span className="text-amber-300 font-semibold">รองศาสตราจารย์ ดร.นิตยา วรรณกิตร์</span> รองอธิการบดีฝ่ายพัฒนานิสิตและภาพลักษณ์องค์กร มหาวิทยาลัยมหาสารคาม เป็นประธานเปิดโครงการ
          </p>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-200">การรวมพลังเครือข่ายกู้ชีพกู้ภัยระดับอุดมศึกษาทั่วประเทศ (ทุกภูมิภาค)</p>
                <p className="text-slate-400">
                  ชมรมกู้ภัยราชพฤกษ์ มมส • อาสาสมัครกู้ภัย มข. • ชุดเคลื่อนที่เร็ว มก. • และสถาบันอุดมศึกษาทั่วประเทศ
                </p>
              </div>
            </div>
            <div className="text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 shrink-0">
              📍 มหาวิทยาลัยมหาสารคาม
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {myRegistration ? (
              <button
                onClick={onNavigateRegister}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 text-sm transition-all transform active:scale-95"
              >
                <FileCheck2 className="w-4 h-4" />
                ดูสถานะห้องนอน & กลุ่มฝึกของฉัน
              </button>
            ) : (
              <button
                onClick={onNavigateRegister}
                className="px-7 py-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl shadow-xl shadow-rescue-600/30 flex items-center gap-2 text-base transition-all transform active:scale-95 group"
              >
                <span>สมัครเข้าร่วมโครงการ JRE 2027</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              onClick={onNavigateSchedule}
              className="px-6 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-2xl border border-slate-700 flex items-center gap-2 text-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-rescue-400" />
              ดูกำหนดการ 2 วัน 1 คืน
            </button>
          </div>

        </div>
      </section>

      {/* JRE 2026 Video Spotlight & Philosophy Card */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/30 border border-orange-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          
          {/* Left: Real Facebook Video Iframe */}
          <div className="w-full lg:w-5/12 relative rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-2xl shrink-0 bg-slate-950 flex items-center justify-center">
            <div className="w-full overflow-hidden flex justify-center items-center">
              <iframe 
                src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F3124397917947926%2F&show_text=true&width=560&t=0" 
                width="100%" 
                height="429" 
                style={{ border: 'none', overflow: 'hidden', minHeight: '380px' }} 
                scrolling="no" 
                frameBorder="0" 
                allowFullScreen={true} 
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="JRE 2026 การเข้าระงับเหตุเพลิงไหม้นอกอาคาร"
              ></iframe>
            </div>
          </div>

          {/* Right: Message & Philosophy */}
          <div className="w-full lg:w-7/12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emergency-500/20 text-emergency-400 border border-emergency-500/30 rounded-full text-xs font-bold">
              🔥 มากกว่าการฝึก คือการเตรียมความพร้อมสู่สถานการณ์จริง
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
              "เราไม่ได้ฝึกให้เก่งแค่ในสนามฝึก<br />
              แต่เราฝึกเพื่อให้ทุกคนสามารถกลับออกมาได้อย่างปลอดภัย"
            </h3>

            <div className="text-xs sm:text-sm text-slate-300 space-y-2.5 leading-relaxed bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <p>
                ในมุมมองของวิทยากร การฝึกครั้งนี้ไม่ใช่เพียงการถ่ายทอดความรู้ แต่คือการปลูกฝัง 
                <span className="text-amber-400 font-bold"> “วิธีคิด” </span> และ 
                <span className="text-emerald-400 font-bold"> “ความปลอดภัย” </span> ให้กับผู้ปฏิบัติ
              </p>
              <p>
                ผู้เข้าร่วมได้เรียนรู้ตั้งแต่การประเมินสถานการณ์อย่างเป็นระบบ การเลือกใช้อุปกรณ์ให้เหมาะสมกับเหตุการณ์ 
                การเข้าพื้นที่อย่างปลอดภัย และการทำงานเป็นทีมภายใต้ข้อจำกัดและแรงกดดันจริง
              </p>
              <p className="text-orange-300 font-semibold italic border-l-2 border-orange-500 pl-3">
                ทุกขั้นตอนคือสิ่งที่ต้อง “เข้าใจและปฏิบัติได้จริง” เพราะในสถานการณ์จริง ความผิดพลาดเพียงเล็กน้อย อาจหมายถึงความสูญเสียที่ยิ่งใหญ่
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="hover:text-rescue-400">#JRE2026</span>
                <span className="hover:text-rescue-400">#กู้ภัยราชพฤกษ์</span>
                <span className="hover:text-rescue-400">#ฝึกกู้ภัย</span>
                <span className="hover:text-rescue-400">#ดับเพลิง</span>
                <span className="hover:text-rescue-400">#EmergencyResponse</span>
                <span className="hover:text-rescue-400">#MSU</span>
              </div>

              <a
                href="https://www.facebook.com/share/v/18cdZwKepQ/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-rescue-400 hover:text-rescue-300 bg-rescue-500/10 hover:bg-rescue-500/20 px-3.5 py-2 rounded-xl border border-rescue-500/30 transition-all"
              >
                <span>เปิดดูวิดีโอบน Facebook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* Team Section: 1 MSU, 2 MSU, 3 MSU & 4 KKU, 5 KKU, 6 KKU, 7 KKU */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-rescue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              Organizing Committee
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ทีมงานผู้ดำเนินการฝึกอบรม
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              ทีมประสานงานและคณะผู้รับผิดชอบการฝึกซ้อมภาคปฏิบัติการจาก มมส และ มข.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-yellow-400 font-semibold bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/30">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span> 3 มมส
            </span>
            <span className="flex items-center gap-1.5 text-orange-400 font-semibold bg-orange-400/10 px-3 py-1.5 rounded-lg border border-orange-400/30">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> 4 มข
            </span>
          </div>
        </div>

        {/* MSU Group (1, 2, 3) */}
        <div>
          <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🏛️ ทีมผู้ดำเนินการ มหาวิทยาลัยมหาสารคาม (1 - 3 มมส)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {msuTeam.map((member) => (
              <div 
                key={member.id}
                className="bg-slate-900 border border-slate-800 hover:border-yellow-500/50 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={member.photo} 
                      alt={member.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-yellow-500/40 group-hover:border-yellow-400 transition-colors shadow-md" 
                    />
                    <span className="absolute -top-2 -left-2 px-2 py-0.5 bg-yellow-500 text-slate-950 text-[10px] font-black rounded-full shadow">
                      {member.tag || 'มมส'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base truncate group-hover:text-yellow-300 transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-xs font-semibold text-rescue-400 mt-0.5 line-clamp-1">
                      {member.role}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {member.institution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KKU Group (4, 5, 6, 7) */}
        <div className="pt-4">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🚒 ทีมผู้ดำเนินการ มหาวิทยาลัยขอนแก่น (4 - 7 มข)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kkuTeam.map((member) => (
              <div 
                key={member.id}
                className="bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="text-center">
                  <div className="relative inline-block mx-auto mb-3">
                    <img 
                      src={member.photo} 
                      alt={member.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500/40 group-hover:border-orange-400 transition-colors shadow-md mx-auto" 
                    />
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-full shadow">
                      {member.tag || 'มข'}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm truncate group-hover:text-orange-300 transition-colors">
                    {member.name}
                  </h4>
                  <p className="text-xs font-medium text-orange-400 mt-0.5 truncate">
                    {member.role}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    {member.institution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Speakers Section: 1, 2, 3, 4, 5, 6 */}
      <section className="space-y-8 pt-4">
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-emergency-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            Distinguished Instructors & Doctors
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            ข้อมูลวิทยากรประจำโครงการ (1 - 6)
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            ผู้เชี่ยวชาญด้านเวชศาสตร์ฉุกเฉิน การกู้ภัยทางน้ำ การใช้เชือกกู้ภัยในที่สูง และการตัดถ่างยานพาหนะ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((spk) => (
            <div 
              key={spk.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-emergency-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative shrink-0">
                    <img 
                      src={spk.photo} 
                      alt={spk.name}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emergency-500/40 group-hover:border-emergency-400 transition-colors shadow-lg" 
                    />
                    <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-emergency-600 text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-slate-900 shadow">
                      {spk.num}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emergency-400 bg-emergency-500/10 px-2 py-0.5 rounded border border-emergency-500/20">
                      วิทยากรท่านที่ {spk.num}
                    </span>
                    <h3 className="font-bold text-white text-base mt-1.5 leading-snug">
                      {spk.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      {spk.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[11px]">สังกัด / หน่วยงาน:</span>
                    <span className="text-slate-200 font-medium">{spk.org}</span>
                  </div>
                  <div className="text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-amber-400 font-semibold block text-[11px] mb-0.5">หัวข้อฝึกอบรม:</span>
                    <span className="text-slate-300">{spk.topic}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
