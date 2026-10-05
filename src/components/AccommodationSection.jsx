import React, { useState } from 'react';
import { 
  Building, 
  Wind, 
  ShowerHead, 
  Layers, 
  BedDouble, 
  DoorClosed, 
  BookOpen, 
  CheckCircle2, 
  Maximize2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Info,
  MapPin
} from 'lucide-react';
import { ACCOMMODATION_DETAILS } from '../data/defaultData';
import ModalPortal from './ModalPortal';

export default function AccommodationSection() {
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const data = ACCOMMODATION_DETAILS;

  // Icon mapping
  const getAmenityIcon = (id) => {
    switch (id) {
      case 'water_heater':
        return <ShowerHead className="w-5 h-5 text-amber-400" />;
      case 'air_conditioner':
        return <Wind className="w-5 h-5 text-sky-400" />;
      case 'work_desk':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'wardrobe':
        return <DoorClosed className="w-5 h-5 text-purple-400" />;
      case 'pillow':
        return <BedDouble className="w-5 h-5 text-rose-400" />;
      case 'blanket':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rescue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building className="w-4 h-4" />
            Official Accommodation
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>หอพักและสิ่งอำนวยความสะดวก</span>
            <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full">
              หอพักกุดรัง มมส
            </span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rescue-500 shrink-0" />
            <span>กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม • ที่พักค้างแรม 1 คืน สำหรับผู้เข้าร่วมโครงการ JRE 2027</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Photo + Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Photo Card (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="relative group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex-1 flex flex-col justify-between">
            {/* Image Container */}
            <div 
              className="relative aspect-4/3 sm:aspect-16/10 lg:aspect-auto lg:h-72 w-full overflow-hidden bg-slate-950 cursor-pointer"
              onClick={() => setIsPhotoOpen(true)}
              title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
            >
              <img 
                src={data.image} 
                alt="ตัวอย่างห้องพักจริง หอพักกุดรัง มมส" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Badge Top Left */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-amber-300 text-xs font-bold rounded-xl shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ตัวอย่างรูปห้องพักจริง</span>
              </div>

              {/* Zoom Button Top Right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPhotoOpen(true);
                }}
                className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-rescue-600 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700/80 hover:border-rescue-500 rounded-xl transition-all shadow-lg cursor-pointer"
                title="ขยายรูปภาพ"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Overlay Bottom Description */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-sm font-bold drop-shadow-md">หอพักกุดรัง มหาวิทยาลัยมหาสารคาม</p>
                <p className="text-[11px] text-slate-300 drop-shadow">ห้องพักมาตรฐาน สะอาด ปลอดภัย พร้อมเตียงและเครื่องนอน</p>
              </div>
            </div>

            {/* Photo Footer Summary */}
            <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">ประเภทที่พัก:</span>
                <span className="font-bold text-slate-200">ห้องพักปรับอากาศ (แอร์)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">หน่วยงานดูแล:</span>
                <span className="font-bold text-amber-300">กองอาคารสถานที่ มมส</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">คลิกที่รูปเพื่อเปิดดูภาพขนาดเต็ม</span>
                <button
                  type="button"
                  onClick={() => setIsPhotoOpen(true)}
                  className="text-xs font-bold text-rescue-400 hover:text-rescue-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูภาพขยาย</span>
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Amenities Cards (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              สิ่งอำนวยความสะดวกภายในห้องพัก
            </h3>

            {/* 6 Amenities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.amenities.map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex items-start gap-3 transition-colors shadow-sm"
                >
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                    {getAmenityIcon(item.id)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-sm font-bold text-white truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full font-medium shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Notice Box: หมอนและผ้าห่มมีให้พร้อม */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border border-amber-500/30 rounded-2xl space-y-2">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  เครื่องนอนเตรียมพร้อม ไม่ต้องพกพามาเอง
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  ภายในห้องพักของ <span className="text-white font-semibold">หอพักกุดรัง มมส</span> ได้จัดเตรียม <span className="text-amber-300 font-bold">หมอน</span> และ <span className="text-amber-300 font-bold">ผ้าห่ม</span> ประจำเตียงไว้ให้ผู้เข้าร่วมโครงการทุกคนเรียบร้อยแล้ว ผู้เข้าร่วมโครงการโปรดเตรียมเพียงของใช้ส่วนตัวที่จำเป็น (เช่น ผ้าเช็ดตัว แปรงสีฟัน สบู่/ยาสระผม)
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Lightbox Modal */}
      {isPhotoOpen && (
        <ModalPortal isOpen={isPhotoOpen} onClose={() => setIsPhotoOpen(false)}>
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsPhotoOpen(false)}
          >
            <div 
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-rescue-400" />
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    ตัวอย่างห้องพักจริง — หอพักกุดรัง มมส
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Image */}
              <div className="p-3 sm:p-5 bg-slate-950 flex items-center justify-center">
                <img 
                  src={data.image} 
                  alt="ตัวอย่างห้องพักจริง หอพักกุดรัง มหาวิทยาลัยมหาสารคาม" 
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-800 rounded-lg font-bold">
                    ❄️ ห้องปรับอากาศ (แอร์)
                  </span>
                  <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg font-bold">
                    🚿 เครื่องทำน้ำอุ่น
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg font-bold">
                    🛏️ มีหมอน & ผ้าห่มพร้อม
                  </span>
                </div>
                <p className="text-slate-400">กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม</p>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
