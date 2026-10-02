import React, { useState } from 'react';
import { 
  Bell, 
  Pin, 
  CreditCard, 
  MessageCircle, 
  AlertCircle, 
  Calendar, 
  ExternalLink, 
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function AnnouncementsView({ announcements, onNavigateRegister }) {
  const [copiedId, setCopiedId] = useState(null);
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState(null); // Array of images
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // PDF Preview Modal State
  const [previewPdf, setPreviewPdf] = useState(null); // { url, name }

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'pr', label: '📢 ประชาสัมพันธ์' },
    { id: 'payment', label: '💰 ชำระค่าสมัคร' },
    { id: 'line_group', label: '💬 เข้ากลุ่มไลน์' },
    { id: 'order', label: '📋 คำสั่งโครงการ' },
    { id: 'change', label: '⚡ การเปลี่ยนแปลง' },
    { id: 'general', label: '📌 ทั่วไป' },
  ];

  const filtered = announcements.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'pr':
        return <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-bold">📢 ประชาสัมพันธ์</span>;
      case 'payment':
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">ค่าลงทะเบียน</span>;
      case 'line_group':
        return <span className="px-2.5 py-0.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-[10px] font-bold">กลุ่ม Line</span>;
      case 'order':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">คำสั่ง / ข้อปฏิบัติ</span>;
      case 'change':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold">แจ้งเปลี่ยนแปลง</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">ประกาศทั่วไป</span>;
    }
  };

  const handleOpenLightbox = (images, index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const handleNextPhoto = () => {
    if (!lightboxImages) return;
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const handlePrevPhoto = () => {
    if (!lightboxImages) return;
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <Bell className="w-4 h-4 animate-bounce" />
          กระดานข่าวสารทางการ
        </div>
        <h1 className="text-3xl font-black text-white">
          ประกาศข่าวสารโครงการ JRE 2027
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          ติดตามประกาศคำสั่ง กำหนดการชำระเงิน เอกสารแนบ PDF ลิงก์เข้ากลุ่ม และภาพกิจกรรมจากคณะกรรมการฝึกอบรม
        </p>
      </div>

      {/* Official PR Share Banner with 1-Click Copy */}
      <div className="bg-gradient-to-r from-orange-950/50 via-slate-900 to-amber-950/40 border border-orange-500/40 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-lg">
            <Megaphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">ลิงก์ URL หน้าประชาสัมพันธ์ทางการ (JRE 2027)</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">Official</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5 break-all select-all">
              https://jre-2027.vercel.app/?tab=announcements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText('https://jre-2027.vercel.app/?tab=announcements');
            setCopiedPageUrl(true);
            setTimeout(() => setCopiedPageUrl(false), 2500);
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-600 via-rescue-600 to-amber-600 hover:from-orange-500 hover:to-rescue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all active:scale-95 shrink-0"
        >
          {copiedPageUrl ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copiedPageUrl ? 'คัดลอก URL สำเร็จ!' : 'คัดลอกลิงก์ประชาสัมพันธ์'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาข้อความประกาศ หรือเอกสาร..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'bg-rescue-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ไม่พบประกาศในหมวดหมู่ที่เลือก</p>
          </div>
        ) : (
          filtered.map(item => {
            const images = Array.isArray(item.images) ? item.images : [];
            const hasPdf = Boolean(item.pdf_url);

            return (
              <article
                key={item.id}
                className={`bg-slate-900 border rounded-3xl p-6 sm:p-7 transition-all shadow-xl ${
                  item.pinned 
                    ? 'border-rescue-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {item.pinned && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full shadow">
                        <Pin className="w-3 h-3 fill-slate-950" /> ปักหมุด
                      </span>
                    )}
                    {getCategoryBadge(item.category)}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const url = `https://jre-2027.vercel.app/?tab=announcements&annId=${item.id}`;
                        navigator.clipboard.writeText(url);
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-rescue-400" />}
                      <span>{copiedId === item.id ? 'คัดลอกแล้ว' : 'แชร์โพสต์นี้'}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'เพิ่งประกาศ'}
                    </span>
                  </div>
                </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug">
                  {item.title}
                </h2>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 whitespace-pre-line">
                  {item.content}
                </p>

                {/* Attached Images Grid (Up to 10 photos) */}
                {images.length > 0 && (
                  <div className="mb-5 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2.5">
                      <ImageIcon className="w-3.5 h-3.5 text-rescue-400" />
                      <span>รูปภาพประกอบ ({images.length} รูป - คลิกเพื่อดูภาพขนาดเต็ม)</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleOpenLightbox(images, idx)}
                          className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-rescue-500 transition-all bg-slate-900"
                        >
                          <img
                            src={imgUrl}
                            alt={`ประกาศรูปที่ ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached PDF Document Card */}
                {hasPdf && (
                  <div className="mb-5 p-4 bg-gradient-to-r from-red-950/30 via-slate-950/80 to-slate-950/40 border border-red-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-900/80 text-red-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            PDF DOCUMENT
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[240px] sm:max-w-md">
                            {item.pdf_name || 'เอกสารทางการแนบประกาศ JRE 2027.pdf'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          เอกสารคำสั่ง / ตารางการฝึก / รายละเอียดทางการ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setPreviewPdf({ url: item.pdf_url, name: item.pdf_name })}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>เปิดดูเอกสาร</span>
                      </button>
                      <a
                        href={item.pdf_url}
                        download={item.pdf_name || 'jre2027_announcement_doc.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* External Action Button */}
                {item.action_url && (
                  <div className="pt-2">
                    <a
                      href={item.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rescue-600 hover:bg-rescue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <span>{item.action_label || 'เปิดดูรายละเอียด'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {lightboxImages && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between py-3 text-white">
            <span className="text-xs font-bold text-slate-300">
              รูปภาพที่ {lightboxIndex + 1} จาก {lightboxImages.length}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={lightboxImages[lightboxIndex]}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors"
                title="เปิดรูปภาพแท็บใหม่"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLightboxImages(null)}
                className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Container with Prev/Next Controls */}
          <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden">
            {lightboxImages.length > 1 && (
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:left-4 z-10 p-3 bg-slate-900/80 hover:bg-rescue-600 text-white rounded-full transition-all backdrop-blur shadow-xl border border-slate-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={lightboxImages[lightboxIndex]}
              alt={`รูปภาพประกอบที่ ${lightboxIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            />

            {lightboxImages.length > 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 sm:right-4 z-10 p-3 bg-slate-900/80 hover:bg-rescue-600 text-white rounded-full transition-all backdrop-blur shadow-xl border border-slate-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {lightboxImages.length > 1 && (
            <div className="w-full max-w-2xl flex items-center justify-center gap-2 py-3 overflow-x-auto">
              {lightboxImages.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    lightboxIndex === idx ? 'border-rescue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={thumb} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-sm truncate max-w-md">
                  {previewPdf.name || 'เอกสารแนบ PDF'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdf.url}
                  download={previewPdf.name || 'document.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer Iframe */}
            <div className="flex-1 w-full bg-slate-950">
              <iframe
                src={previewPdf.url}
                title="PDF Preview"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
