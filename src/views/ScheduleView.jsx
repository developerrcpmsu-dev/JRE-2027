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
  AlertTriangle 
} from 'lucide-react';
import { SCHEDULE_DAYS } from '../data/defaultData';

export default function ScheduleView() {
  const [selectedDay, setSelectedDay] = useState(1);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          กำหนดการฝึกอบรม 2 วัน 1 คืน
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          ตารางกิจกรรมโครงการ JRE 2027
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          วันที่ 14 - 15 พฤศจิกายน 2569 ณ มหาวิทยาลัยมหาสารคาม (มมส) 
          พร้อมระบุห้องบรรยายและสนามฝึกปฏิบัติการอย่างละเอียด
        </p>
      </div>

      {/* Day Selector Buttons */}
      <div className="flex justify-center">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex gap-2 shadow-lg">
          <button
            onClick={() => setSelectedDay(1)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              selectedDay === 1
                ? 'bg-rescue-600 text-white shadow-lg shadow-rescue-600/30 ring-2 ring-rescue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span>วันที่ 1 : 7 พ.ย. 2569</span>
          </button>

          <button
            onClick={() => setSelectedDay(2)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              selectedDay === 2
                ? 'bg-rescue-600 text-white shadow-lg shadow-rescue-600/30 ring-2 ring-rescue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 text-blue-300" />
            <span>วันที่ 2 : 8 พ.ย. 2569</span>
          </button>
        </div>
      </div>

      {/* Schedule Timeline */}
      {SCHEDULE_DAYS.filter(d => d.dayNumber === selectedDay).map((day) => (
        <div key={day.dayNumber} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          
          <div className="border-b border-slate-800 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rescue-400 uppercase tracking-wider block">
                JRE 2027 Timeline
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {day.dateThai}
              </h2>
            </div>
            <span className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700">
              {day.theme}
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-8">
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
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {event.category === 'night-drill' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : event.category === 'drill' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : event.category === 'ceremony' ? (
                    <Award className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                </div>

                {/* Event Card */}
                <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all hover:shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-rescue-400 rounded-lg text-xs font-mono font-bold border border-slate-700">
                      <Clock className="w-3 h-3" />
                      {event.time} น.
                    </span>

                    {event.category === 'night-drill' && (
                      <span className="px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold rounded-full">
                        ⭐ ซ้อมสถานการณ์กลางคืน (Night Drill)
                      </span>
                    )}
                    {event.category === 'drill' && (
                      <span className="px-2.5 py-0.5 bg-orange-950 text-orange-300 border border-orange-800 text-[10px] font-bold rounded-full">
                        🚒 ภาคปฏิบัติการเข้มข้น
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">
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
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rescue-500" />
          สรุปพิกัดและจุดรวมพลสำคัญ ณ มหาวิทยาลัยมหาสารคาม
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <p className="font-bold text-white mb-1">🏢 อาคารบรมราชกุมารี</p>
            <p className="text-slate-400">ห้องประชุมใหญ่ ชั้น 2 (จุดเปิดโครงการ, บรรยายรวม และ AAR มอบวุฒิบัตร)</p>
          </div>
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <p className="font-bold text-white mb-1">🌿 สนามหญ้าส่วนกลาง & ลานฝึก</p>
            <p className="text-slate-400">สนามฝึก 4 ฐานปฏิบัติการกู้ชีพ และพื้นที่จำลองเหตุการณ์ฉุกเฉิน</p>
          </div>
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <p className="font-bold text-white mb-1">🛏️ เรือนนอน 1-2 หอพักนิสิต มมส</p>
            <p className="text-slate-400">ที่พักค้างแรม 1 คืน สำหรับผู้เข้าร่วมที่ได้รับการจัดสรรห้องพัก</p>
          </div>
        </div>
      </div>

    </div>
  );
}
