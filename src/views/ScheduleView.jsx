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
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Layers,
  BookOpen,
  Shield,
  Flame,
  Users
} from 'lucide-react';
import { SCHEDULE_DAYS } from '../data/defaultData';
import CurriculumSection from '../components/CurriculumSection';
import AccommodationSection from '../components/AccommodationSection';
import ModalPortal from '../components/ModalPortal';

const SCHEDULE_DOC_PAGES = [
  {
    page: 1,
    src: '/documents/schedule/schedule_page_1.png',
    label: 'หน้าที่ 1 / 3 • วันเสาร์ที่ 14 พ.ย. 2569 (ภาคเช้า)'
  },
  {
    page: 2,
    src: '/documents/schedule/schedule_page_2.png',
    label: 'หน้าที่ 2 / 3 • วันเสาร์ที่ 14 พ.ย. 2569 (ภาคบ่ายและภาคค่ำ)'
  },
  {
    page: 3,
    src: '/documents/schedule/schedule_page_3.png',
    label: 'หน้าที่ 3 / 3 • วันอาทิตย์ที่ 15 พ.ย. 2569 (ภาคเช้าและพิธีปิด)'
  }
];

export default function ScheduleView() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showPdfViewer, setShowPdfViewer] = useState(true);
  const [viewerMode, setViewerMode] = useState('web'); // 'web' | 'pdf'
  const [pageLayout, setPageLayout] = useState('all'); // 'all' | 'single'
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);

  const visiblePages = pageLayout === 'all'
    ? SCHEDULE_DOC_PAGES
    : SCHEDULE_DOC_PAGES.filter(p => p.page === currentPage);

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

      {/* Official PDF Document Card & Built-In Web Reader */}
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ เปิดอ่านบนหน้าเว็บได้ทันที ไม่ต้องโหลดไฟล์
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
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold rounded-2xl text-xs sm:text-sm border border-amber-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Maximize2 className="w-4 h-4 text-amber-400" />
              <span>อ่านแบบเต็มจอ</span>
            </button>

            <a
              href="/documents/schedule_jre2027.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>เปิดอ่านในแท็บใหม่</span>
            </a>

            <a
              href="/documents/schedule_jre2027.pdf"
              download="กำหนดการ_JRE2027.pdf"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-rescue-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด PDF</span>
            </a>

            <button
              type="button"
              onClick={() => setShowPdfViewer(!showPdfViewer)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4 text-orange-400" />
              <span>{showPdfViewer ? 'ซ่อนตัวอย่างเอกสาร' : 'แสดงตัวอย่างเอกสาร'}</span>
              {showPdfViewer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Embedded Web Document & PDF Viewer */}
        {showPdfViewer && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 animate-in fade-in duration-300 space-y-3">
            {/* Control Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 border border-slate-800 rounded-2xl px-3.5 py-2.5">
              {/* Left: Title & Viewer Mode Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mr-1">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>แสดงตัวอย่างเอกสาร (กำหนดการ 3 หน้า)</span>
                </span>

                <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewerMode('web')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewerMode === 'web'
                        ? 'bg-orange-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>โหมดอ่านบนหน้าเว็บ (คมชัดทุกอุปกรณ์)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerMode('pdf')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewerMode === 'pdf'
                        ? 'bg-orange-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>โหมด PDF Viewer</span>
                  </button>
                </div>
              </div>

              {/* Right: Page Layout, Zoom & Fullscreen Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {viewerMode === 'web' && (
                  <>
                    {/* All Pages vs Single Page */}
                    <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPageLayout('all')}
                        className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                          pageLayout === 'all'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>เรียง 3 หน้า</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageLayout('single')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          pageLayout === 'single'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>ทีละหน้า</span>
                      </button>
                    </div>

                    {/* Page Stepper when in Single Page mode */}
                    {pageLayout === 'single' && (
                      <div className="inline-flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="p-1 hover:bg-slate-800 rounded disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-1.5 font-mono text-[11px]">
                          หน้า {currentPage} / 3
                        </span>
                        <button
                          type="button"
                          disabled={currentPage >= 3}
                          onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
                          className="p-1 hover:bg-slate-800 rounded disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Zoom Controls */}
                    <div className="hidden sm:inline-flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <button
                        type="button"
                        onClick={() => setZoomPercent(z => Math.max(75, z - 25))}
                        className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                        title="ย่อขนาด"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px] px-1">{zoomPercent}%</span>
                      <button
                        type="button"
                        onClick={() => setZoomPercent(z => Math.min(175, z + 25))}
                        className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                        title="ขยายขนาด"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      {zoomPercent !== 100 && (
                        <button
                          type="button"
                          onClick={() => setZoomPercent(100)}
                          className="p-1 text-amber-400 hover:bg-slate-800 rounded cursor-pointer"
                          title="ขนาดมาตรฐาน 100%"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsFullscreenModalOpen(true)}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ขยายเต็มจอ</span>
                </button>
              </div>
            </div>

            {/* Document Viewport */}
            {viewerMode === 'web' ? (
              <div className="w-full bg-slate-950/95 rounded-2xl border border-slate-800 p-3 sm:p-6 max-h-[820px] overflow-y-auto overflow-x-auto space-y-6 shadow-inner">
                {visiblePages.map((docPage) => (
                  <div
                    key={docPage.page}
                    className="mx-auto flex flex-col items-center space-y-2"
                    style={{
                      width: zoomPercent === 100 ? '100%' : `${zoomPercent}%`,
                      maxWidth: zoomPercent <= 100 ? '820px' : 'none'
                    }}
                  >
                    <div className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] text-slate-300">
                      <span className="font-bold text-orange-300">{docPage.label}</span>
                      <button
                        type="button"
                        onClick={() => setIsFullscreenModalOpen(true)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>ดูเต็มจอ</span>
                      </button>
                    </div>
                    <div className="w-full bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700/80">
                      <img
                        src={docPage.src}
                        alt={docPage.label}
                        loading="lazy"
                        onClick={() => setIsFullscreenModalOpen(true)}
                        className="w-full h-auto block object-contain cursor-zoom-in select-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                <object
                  data="/documents/schedule_jre2027.pdf#toolbar=1&navpanes=0&view=FitH"
                  type="application/pdf"
                  className="w-full h-[680px] sm:h-[820px]"
                >
                  <iframe
                    src="/documents/schedule_jre2027.pdf#toolbar=1"
                    className="w-full h-[680px] sm:h-[820px] border-0"
                    title="JRE 2027 Schedule Official PDF"
                  />
                </object>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fullscreen Document Reader Modal */}
      {isFullscreenModalOpen && (
        <ModalPortal isOpen={isFullscreenModalOpen} onClose={() => setIsFullscreenModalOpen(false)}>
          <div
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
            onClick={() => setIsFullscreenModalOpen(false)}
          >
            {/* Modal Top Bar */}
            <div
              className="px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    เอกสารกำหนดการฉบับทางการ โครงการ JRE 2027 (ครบทั้ง 3 หน้า)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    โหมดอ่านเต็มหน้าจอ • เลื่อนลงเพื่ออ่านต่อเนื่องทั้ง 3 หน้า หรือกดดาวน์โหลดเก็บไว้ได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/documents/schedule_jre2027.pdf"
                  download="กำหนดการ_JRE2027.pdf"
                  className="px-3.5 py-2 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsFullscreenModalOpen(false)}
                  className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="ปิดหน้าต่างเต็มจอ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Pages Body */}
            <div
              className="flex-1 overflow-y-auto p-3 sm:p-8 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {SCHEDULE_DOC_PAGES.map((docPage) => (
                <div key={docPage.page} className="max-w-4xl mx-auto space-y-2">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-orange-300 font-bold">
                    <span>{docPage.label}</span>
                    <span className="text-slate-400 font-mono">หน้า {docPage.page} / 3</span>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                    <img
                      src={docPage.src}
                      alt={docPage.label}
                      className="w-full h-auto block object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalPortal>
      )}

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

      {/* Curriculum & Training Stations Section */}
      <CurriculumSection />

      {/* Accommodation & Dormitory Section */}
      <AccommodationSection />

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
              ที่พักค้างแรม 1 คืน สำหรับผู้เข้าร่วมโครงการและเครือข่ายนักศึกษาอาสาสมัคร (ห้องปรับอากาศ/แอร์, เครื่องทำน้ำอุ่น, โต๊ะเขียนงาน, ตู้เสื้อผ้า, พร้อมหมอนและผ้าห่มจัดเตรียมไว้ให้)
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
