import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Moon, 
  Sun, 
  CheckCircle, 
  Award, 
  AlertTriangle,
  FileText,
  Download,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Flame,
  Users
} from 'lucide-react';
import { SCHEDULE_DAYS } from '../data/defaultData';

export default function ScheduleView() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          กำหนดการฝึกอบรม 2 วัน 1 คืน
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          ตารางกิจกรรมโครงการ JRE 2027
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          วันที่ 14 - 15 พฤศจิกายน 2569 ณ อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม<br />
          จัดโดย <span className="text-slate-200 font-semibold">ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม</span>
        </p>
      </div>

      {/* Official PDF Document Card */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-orange-950/30 border border-orange-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20 shrink-0 border border-white/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
                  OFFICIAL PDF DOCUMENT
                </span>
                <span className="text-slate-400 text-xs font-medium">
                  ขนาดไฟล์ ~95 KB • เอกสารทางการ
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                เอกสารกำหนดการฉบับทางการ โครงการ JRE 2027
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                กำหนดการ 3 หน้า รายละเอียดกิจกรรม เวลา วิทยากรผู้รับผิดชอบ และสถานที่ฝึกอบรมทั้งหมด
              </p>
            </div>
          </div>

          {/* PDF Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <a
              href="/documents/schedule_jre2027.pdf"
              download="กำหนดการ_JRE2027.pdf"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-rescue-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด PDF</span>
            </a>

            <a
              href="/documents/schedule_jre2027.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>เปิดอ่านในแท็บใหม่</span>
            </a>

            <button
              type="button"
              onClick={() => setShowPdfViewer(!showPdfViewer)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white font-bold rounded-2xl text-xs sm:text-sm border border-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4" />
              <span>{showPdfViewer ? 'ซ่อนตัวอย่าง PDF' : 'ดูตัวอย่างเอกสาร'}</span>
              {showPdfViewer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Embedded PDF Viewer */}
        {showPdfViewer && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                แสดงตัวอย่างเอกสาร PDF (กำหนดการ 3 หน้า)
              </span>
              <a 
                href="/documents/schedule_jre2027.pdf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>ขยายเต็มจอ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              <iframe
                src="/documents/schedule_jre2027.pdf#toolbar=1"
                className="w-full h-[650px] sm:h-[800px] border-0"
                title="JRE 2027 Schedule Official PDF"
              ></iframe>
            </div>
          </div>
        )}
      </section>

      {/* Day Selector Buttons */}
      <div className="flex justify-center">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-2 shadow-lg max-w-full">
          <button
            onClick={() => setSelectedDay(1)}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              selectedDay === 1
                ? 'bg-rescue-600 text-white shadow-lg shadow-rescue-600/30 ring-2 ring-rescue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span>วันที่ 1 : วันเสาร์ที่ 14 พ.ย. 2569</span>
          </button>

          <button
            onClick={() => setSelectedDay(2)}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              selectedDay === 2
                ? 'bg-rescue-600 text-white shadow-lg shadow-rescue-600/30 ring-2 ring-rescue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 text-blue-300" />
            <span>วันที่ 2 : วันอาทิตย์ที่ 15 พ.ย. 2569</span>
          </button>
        </div>
      </div>

      {/* Schedule Timeline */}
      {SCHEDULE_DAYS.filter(d => d.dayNumber === selectedDay).map((day) => (
        <div key={day.dayNumber} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl">
          
          <div className="border-b border-slate-800 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rescue-400 uppercase tracking-wider block">
                JRE 2027 Timeline
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {day.dateThai}
              </h2>
            </div>
            <span className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700">
              {day.theme}
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-7">
            {day.events.map((event, idx) => (
              <div key={idx} className="relative group">
                
                {/* Timeline node icon */}
                <div className={`absolute -left-[31px] sm:-left-[39px] top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full border-4 border-slate-900 flex items-center justify-center shadow ${
                  event.category === 'night-drill' 
                    ? 'bg-purple-600 text-white animate-pulse'
                    : event.category === 'drill'
                    ? 'bg-rescue-500 text-white'
                    : event.category === 'ceremony'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : event.category === 'lecture'
                    ? 'bg-blue-600 text-white'
                    : event.category === 'aar' || event.category === 'network' || event.category === 'activity'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {event.category === 'night-drill' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : event.category === 'drill' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : event.category === 'ceremony' ? (
                    <Award className="w-3.5 h-3.5" />
                  ) : event.category === 'lecture' ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : event.category === 'aar' || event.category === 'network' ? (
                    <Users className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                </div>

                {/* Event Card */}
                <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition-all hover:shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-rescue-400 rounded-lg text-xs font-mono font-bold border border-slate-700">
                      <Clock className="w-3 h-3" />
                      {event.time} น.
                    </span>

                    {event.category === 'night-drill' && (
                      <span className="px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold rounded-full">
                        🚒 ซ้อมดับเพลิงภาคค่ำ
                      </span>
                    )}
                    {event.category === 'drill' && (
                      <span className="px-2.5 py-0.5 bg-orange-950 text-orange-300 border border-orange-800 text-[10px] font-bold rounded-full">
                        🚨 ฐานฝึกปฏิบัติการเข้มข้น
                      </span>
                    )}
                    {event.category === 'lecture' && (
                      <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold rounded-full">
                        📚 ภาคทฤษฎี & บัญชาการ ICS
                      </span>
                    )}
                    {event.category === 'ceremony' && (
                      <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold rounded-full">
                        🎓 พิธีการทางการ
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 mb-3 leading-relaxed">
                    {event.desc}
                  </p>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rescue-500 shrink-0" />
                    <span>สถานที่: {event.location}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      ))}

      {/* Location Details Summary Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rescue-500" />
          สรุปพิกัดและจุดรวมพลสำคัญ ณ มหาวิทยาลัยมหาสารคาม
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>🏢</span>
              <span>อาคารพัฒนานิสิต กองกิจการนิสิต มมส</span>
            </p>
            <p className="text-slate-400 leading-relaxed">
              จุดลงทะเบียน, ห้องบรรยายทฤษฎี ICS, การฝึกค้นหาในอาคารมีควัน (ชั้น 3), ดาดฟ้าโรยตัวด้วยระบบเชือก (ชั้น 4), และพิธีเปิด-ปิด
            </p>
          </div>
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>🚒</span>
              <span>ลานฝึกและพื้นที่ภายนอก อาคารพัฒนานิสิต</span>
            </p>
            <p className="text-slate-400 leading-relaxed">
              ฐานฝึกการติดตั้งและสวมใส่ SCBA, ฐานอุปกรณ์และรถดับเพลิง, ฐานกู้ภัยทางสูง, และลานฝึกปฏิบัติการดับเพลิงภาคค่ำ
            </p>
          </div>
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>🛏️</span>
              <span>หอใน กุดรัง กองอาคารสถานที่ มมส</span>
            </p>
            <p className="text-slate-400 leading-relaxed">
              ที่พักค้างแรม 1 คืน สำหรับผู้เข้าร่วมโครงการและเครือข่ายนักศึกษาอาสาสมัครทุกสถาบัน
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
