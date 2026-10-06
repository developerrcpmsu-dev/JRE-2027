import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Pin, 
  Calendar, 
  ExternalLink, 
  Search,
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Check,
  Copy,
  Share2,
  Lock,
  User,
  Megaphone,
  ArrowLeft,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import ModalPortal from '../components/ModalPortal';

export default function AnnouncementsView({ 
  announcements = [], 
  user,
  myRegistration,
  onOpenGoogleLogin,
  onNavigateRegister, 
  initialScope = 'all',
  initialPostId = null,
  onScopeChange
}) {
  const getInitialScope = () => {
    try {
      const url = new URL(window.location.href);
      const path = url.pathname.toLowerCase();
      if (path.includes('/announcements/pr') || path.endsWith('/pr')) return 'public';
      if (path.includes('/announcements/orders') || path.endsWith('/orders')) return 'members';

      const tabParam = url.searchParams.get('tab');
      const typeParam = url.searchParams.get('type') || url.searchParams.get('view');
      if (tabParam === 'pr' || typeParam === 'public') return 'public';
      if (tabParam === 'orders' || typeParam === 'members') return 'members';
      if (initialScope === 'public' || initialScope === 'members') return initialScope;
    } catch (e) {}
    return initialScope || 'all';
  };

  const getInitialPostId = () => {
    if (initialPostId) return initialPostId;
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('id') || url.searchParams.get('annId') || null;
    } catch (e) {
      return null;
    }
  };

  const [activeScope, setActiveScope] = useState(getInitialScope);
  const [selectedPostId, setSelectedPostId] = useState(getInitialPostId);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedPostUrl, setCopiedPostUrl] = useState(false);
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // PDF Preview Modal State
  const [previewPdf, setPreviewPdf] = useState(null);

  // Sync active scope when initialScope changes from route navigation
  useEffect(() => {
    if (initialScope) {
      setActiveScope(initialScope);
    }
  }, [initialScope]);

  // Sync selectedPostId when initialPostId prop changes
  useEffect(() => {
    if (initialPostId) {
      setSelectedPostId(initialPostId);
    } else {
      try {
        const url = new URL(window.location.href);
        const pId = url.searchParams.get('id') || url.searchParams.get('annId');
        setSelectedPostId(pId || null);
      } catch (e) {
        setSelectedPostId(null);
      }
    }
  }, [initialPostId]);

  // Listen to popstate (browser Back/Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const url = new URL(window.location.href);
        const pId = url.searchParams.get('id') || url.searchParams.get('annId');
        setSelectedPostId(pId || null);

        const path = url.pathname.toLowerCase();
        if (path.includes('/announcements/pr') || path.endsWith('/pr')) {
          setActiveScope('public');
        } else if (path.includes('/announcements/orders') || path.endsWith('/orders')) {
          setActiveScope('members');
        } else if (path.includes('/announcements')) {
          setActiveScope('all');
        }
      } catch (e) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://jre-2027.vercel.app';

  // Find currently selected single post if selectedPostId is set
  const currentPost = selectedPostId 
    ? announcements.find(a => String(a.id) === String(selectedPostId))
    : null;

  // Dynamic Browser Title
  useEffect(() => {
    if (selectedPostId && currentPost) {
      document.title = `${currentPost.title} | JRE 2027`;
    } else if (activeScope === 'public') {
      document.title = 'ประชาสัมพันธ์รับสมัคร JRE 2027';
    } else if (activeScope === 'members') {
      document.title = 'ประกาศคำสั่งสำหรับสมาชิก | JRE 2027';
    } else {
      document.title = 'ประกาศข่าวสาร | JRE 2027';
    }
    return () => {
      document.title = 'JRE 2027 - กู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม';
    };
  }, [selectedPostId, currentPost, activeScope]);

  // Handle switching to a single post view
  const handleSelectPost = (item) => {
    setSelectedPostId(item.id);
    const scopePath = item.category === 'pr' 
      ? '/announcements/pr' 
      : (activeScope === 'members' || item.category === 'order' || item.category === 'payment') 
      ? '/announcements/orders' 
      : '/announcements';
    const targetUrl = `${scopePath}?id=${item.id}`;
    window.history.pushState({ postId: item.id }, '', targetUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle returning to the full announcements list
  const handleClearSelectedPost = () => {
    setSelectedPostId(null);
    const cleanPath = activeScope === 'public' 
      ? '/announcements/pr' 
      : activeScope === 'members' 
      ? '/announcements/orders' 
      : '/announcements';
    window.history.pushState({}, '', cleanPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScopeChange = (newScope) => {
    setSelectedPostId(null);
    setActiveScope(newScope);
    if (onScopeChange) {
      onScopeChange(newScope);
    } else {
      const cleanPath = newScope === 'public' ? '/announcements/pr' : newScope === 'members' ? '/announcements/orders' : '/announcements';
      window.history.pushState({}, '', cleanPath);
    }
  };

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'pr', label: 'ประชาสัมพันธ์' },
    { id: 'payment', label: 'ชำระค่าสมัคร' },
    { id: 'line_group', label: 'เข้ากลุ่มไลน์' },
    { id: 'order', label: 'คำสั่งโครงการ' },
    { id: 'training', label: 'หลักสูตรการฝึก' },
    { id: 'activity', label: 'ที่พัก & กิจกรรม' },
    { id: 'change', label: 'การเปลี่ยนแปลง' },
    { id: 'general', label: 'ทั่วไป' },
  ];

  const filtered = announcements.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchScope = true;
    if (activeScope === 'public') {
      matchScope = item.category === 'pr';
    } else if (activeScope === 'members') {
      matchScope = item.category !== 'pr';
    } else if (!user && activeScope === 'all') {
      matchScope = item.category === 'pr' || item.category === 'general';
    }

    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchScope && matchCat;
  });

  const currentShareUrl = activeScope === 'public'
    ? `${currentOrigin}/announcements/pr`
    : activeScope === 'members'
    ? `${currentOrigin}/announcements/orders`
    : `${currentOrigin}/announcements`;

  const shareTitle = activeScope === 'public'
    ? 'ลิงก์ URL หน้าประชาสัมพันธ์รับสมัครทางการ (Public PR)'
    : activeScope === 'members'
    ? 'ลิงก์ URL ประกาศคำสั่ง & ข่าวสารสำหรับสมาชิก (เฉพาะผู้เข้าร่วม)'
    : 'ลิงก์ URL กระดานประกาศข่าวสารทั้งหมด (JRE 2027)';

  const shareButtonText = activeScope === 'public'
    ? 'คัดลอกลิงก์ประชาสัมพันธ์รับสมัคร'
    : activeScope === 'members'
    ? 'คัดลอกลิงก์ประกาศคำสั่งสมาชิก'
    : 'คัดลอกลิงก์ประกาศทั้งหมด';

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'pr':
        return <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-bold">ประชาสัมพันธ์</span>;
      case 'payment':
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">ค่าลงทะเบียน</span>;
      case 'line_group':
        return <span className="px-2.5 py-0.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-[10px] font-bold">กลุ่ม Line</span>;
      case 'order':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">คำสั่ง / ข้อปฏิบัติ</span>;
      case 'training':
        return <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold">หลักสูตรการฝึก</span>;
      case 'activity':
        return <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-[10px] font-bold">ที่พัก & กิจกรรม</span>;
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

  // -------------------------------------------------------------
  // VIEW MODE 1: SINGLE POST VIEW (หน้าเฉพาะโพสต์เดี่ยว)
  // -------------------------------------------------------------
  if (selectedPostId) {
    // If announcements are still loading asynchronously
    if (announcements.length === 0) {
      return (
        <div className="max-w-4xl mx-auto py-24 text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-rescue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-medium">กำลังโหลดข้อมูลประกาศ...</p>
        </div>
      );
    }

    // If announcement was not found by ID
    if (!currentPost) {
      return (
        <div className="max-w-xl mx-auto py-16 px-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">ไม่พบประกาศนี้ในระบบ</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              ลิงก์ประกาศที่คุณเปิด (ID: <span className="font-mono text-slate-300">{selectedPostId}</span>) อาจไม่ถูกต้อง หรือประกาศนี้อาจถูกย้าย/นำออกจากระบบแล้ว
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearSelectedPost}
            className="px-6 py-3 bg-gradient-to-r from-rescue-600 to-amber-600 hover:from-rescue-500 hover:to-amber-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xl active:scale-95 inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปยังกระดานข่าวทั้งหมด</span>
          </button>
        </div>
      );
    }

    const currentPostImages = Array.isArray(currentPost.images) ? currentPost.images : [];
    const singlePostUrl = `${currentOrigin}${currentPost.category === 'pr' ? '/announcements/pr' : '/announcements/orders'}?id=${currentPost.id}`;
    
    // Other announcements to display at the bottom (excluding current post)
    const otherAnnouncements = announcements
      .filter(a => String(a.id) !== String(currentPost.id))
      .slice(0, 3);

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Breadcrumb Navigation & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2">
          <button
            type="button"
            onClick={handleClearSelectedPost}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs sm:text-sm font-bold border border-slate-700 shadow-md transition-all cursor-pointer group active:scale-95 w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-rescue-400 group-hover:-translate-x-1 transition-transform" />
            <span>← ดูประกาศทั้งหมด / ข่าวสารอื่นๆ</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden">
            <span 
              onClick={handleClearSelectedPost}
              className="cursor-pointer hover:text-rescue-400 transition-colors shrink-0 font-medium"
            >
              กระดานข่าว JRE 2027
            </span>
            <span>/</span>
            <span className="text-slate-300 font-medium shrink-0">
              {currentPost.category === 'pr' ? 'ประชาสัมพันธ์' : 'คำสั่งโครงการ'}
            </span>
            <span>/</span>
            <span className="text-rescue-400 font-semibold truncate max-w-[180px] sm:max-w-xs">
              {currentPost.title}
            </span>
          </div>
        </div>

        {/* Dedicated Post Share Bar with 1-Click Copy & Social Buttons */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-rescue-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rescue-500/20 text-rescue-400 border border-rescue-500/40 flex items-center justify-center shrink-0 shadow-lg">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white">ลิงก์ URL เฉพาะของโพสต์นี้ (Direct Post Link)</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    หน้าเดี่ยว
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5 break-all select-all">
                  {singlePostUrl}
                </p>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(singlePostUrl);
                  setCopiedPostUrl(true);
                  setTimeout(() => setCopiedPostUrl(false), 2500);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-rescue-600 to-amber-600 hover:from-rescue-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {copiedPostUrl ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPostUrl ? 'คัดลอก URL สำเร็จ!' : 'คัดลอกลิงก์โพสต์'}</span>
              </button>

              {/* Share to LINE */}
              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(currentPost.title + '\n' + singlePostUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                title="แชร์ไปยัง LINE"
              >
                <span className="font-extrabold text-[11px]">LINE</span>
              </a>

              {/* Share to Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(singlePostUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                title="แชร์ไปยัง Facebook"
              >
                <span className="font-extrabold text-[11px]">Facebook</span>
              </a>

              {/* Web Share API on mobile devices */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.share({
                      title: currentPost.title,
                      text: currentPost.content?.slice(0, 100),
                      url: singlePostUrl
                    }).catch(() => {});
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700 cursor-pointer"
                  title="แชร์ผ่านอุปกรณ์"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Single Announcement Card */}
        <article className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur">
          {/* Top orange glowing accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-rescue-500 to-amber-500" />

          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {currentPost.pinned && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full shadow">
                  <Pin className="w-3.5 h-3.5 fill-slate-950" /> ปักหมุดประกาศสำคัญ
                </span>
              )}
              {getCategoryBadge(currentPost.category)}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Calendar className="w-4 h-4 text-rescue-400" />
              <span>
                {currentPost.created_at ? new Date(currentPost.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'เพิ่งประกาศ'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-6 leading-snug">
            {currentPost.title}
          </h1>

          {/* Body Content */}
          <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8 font-normal space-y-4">
            {currentPost.content}
          </div>

          {/* Attached Image Gallery */}
          {currentPostImages.length > 0 && (
            <div className="mb-8 p-4 sm:p-5 bg-slate-950/70 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3.5">
                <ImageIcon className="w-4 h-4 text-rescue-400" />
                <span>รูปภาพประกอบ ({currentPostImages.length} รูป - คลิกเพื่อดูภาพขนาดเต็ม)</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {currentPostImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenLightbox(currentPostImages, idx)}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-rescue-500 transition-all bg-slate-900"
                  >
                    <img
                      src={imgUrl}
                      alt={`ประกาศรูปที่ ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-white drop-shadow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached PDF Document Card */}
          {Boolean(currentPost.pdf_url) && (
            <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-red-950/40 via-slate-950 to-slate-950 border border-red-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 shadow-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-900/80 text-red-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      PDF DOCUMENT
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                      {currentPost.pdf_name || 'เอกสารแนบประกาศทางการ JRE 2027.pdf'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    เอกสารคำสั่ง / ตารางการฝึก / รายละเอียดทางการ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPreviewPdf({ url: currentPost.pdf_url, name: currentPost.pdf_name })}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>เปิดดูเอกสาร</span>
                </button>
                <a
                  href={currentPost.pdf_url}
                  download={currentPost.pdf_name || 'jre2027_announcement_doc.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด</span>
                </a>
              </div>
            </div>
          )}

          {/* Action CTA Link */}
          {currentPost.action_url && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                มีลิงก์ดำเนินการที่เกี่ยวข้องกับประกาศนี้:
              </span>
              <a
                href={currentPost.action_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rescue-600 to-amber-600 hover:from-rescue-500 hover:to-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <span>{currentPost.action_label || 'เปิดดูรายละเอียดเพิ่มเติม'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </article>

        {/* Member login reminder notice if current post is in member space and user not logged in */}
        {currentPost.category !== 'pr' && !user && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-slate-300">
                ต้องการเข้าถึงเอกสารคำสั่งเพิ่มเติม ลิงก์กลุ่มประสานงาน และข้อมูลที่พักสมาชิก?
              </p>
            </div>
            {onOpenGoogleLogin && (
              <button
                type="button"
                onClick={onOpenGoogleLogin}
                className="px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                เข้าสู่ระบบสมาชิก
              </button>
            )}
          </div>
        )}

        {/* "ข่าวสารและประกาศอื่นๆ ในโครงการ" (Other Announcements Section) */}
        {otherAnnouncements.length > 0 && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rescue-400" />
                <h3 className="text-base font-bold text-white">ข่าวสารและประกาศอื่นๆ ในโครงการ JRE 2027</h3>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedPost}
                className="text-xs text-rescue-400 hover:text-rescue-300 font-semibold cursor-pointer"
              >
                ดูทั้งหมด ({announcements.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {otherAnnouncements.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectPost(item)}
                  className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-rescue-500/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      {getCategoryBadge(item.category)}
                      <span className="text-[10px] text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-rescue-400 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-rescue-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>อ่านประกาศนี้</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Big Return Button to Full Board */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearSelectedPost}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-bold rounded-2xl border border-slate-700 shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-98"
              >
                <Layers className="w-4 h-4 text-rescue-400 group-hover:scale-110 transition-transform" />
                <span>กลับสู่กระดานประกาศข่าวสารทั้งหมด (ดูรายการทั้งหมด {announcements.length} รายการ)</span>
              </button>
            </div>
          </div>
        )}

        {/* LIGHTBOX MODAL FOR IMAGES */}
        {lightboxImages && (
          <ModalPortal isOpen={Boolean(lightboxImages)} onClose={() => setLightboxImages(null)}>
            <div 
              className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => setLightboxImages(null)}
            >
              <div className="w-full max-w-4xl flex items-center justify-between py-3 text-white" onClick={e => e.stopPropagation()}>
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
                    type="button"
                    onClick={() => setLightboxImages(null)}
                    className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
                {lightboxImages.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2 sm:left-4 z-10 p-3 bg-slate-900/80 hover:bg-rescue-600 text-white rounded-full transition-all backdrop-blur shadow-xl border border-slate-700 cursor-pointer"
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
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2 sm:right-4 z-10 p-3 bg-slate-900/80 hover:bg-rescue-600 text-white rounded-full transition-all backdrop-blur shadow-xl border border-slate-700 cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {lightboxImages.length > 1 && (
                <div className="w-full max-w-2xl flex items-center justify-center gap-2 py-3 overflow-x-auto" onClick={e => e.stopPropagation()}>
                  {lightboxImages.map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        lightboxIndex === idx ? 'border-rescue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={thumb} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ModalPortal>
        )}

        {/* PDF PREVIEW MODAL */}
        {previewPdf && (
          <ModalPortal isOpen={Boolean(previewPdf)} onClose={() => setPreviewPdf(null)}>
            <div 
              className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
              onClick={() => setPreviewPdf(null)}
            >
              <div 
                className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
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
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewPdf(null)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full bg-slate-950">
                  <iframe
                    src={previewPdf.url}
                    title="PDF Preview"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW MODE 2: ALL ANNOUNCEMENTS LIST VIEW (กระดานรวมประกาศ)
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <Bell className="w-4 h-4" />
          กระดานข่าวสารทางการ
        </div>
        <h1 className="text-3xl font-black text-white">
          {activeScope === 'public'
            ? 'ประชาสัมพันธ์รับสมัคร JRE 2027'
            : activeScope === 'members'
            ? 'ประกาศคำสั่ง & ข่าวสารสำหรับสมาชิก'
            : 'ประกาศข่าวสารโครงการ JRE 2027'}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          {activeScope === 'public'
            ? 'ข้อมูลประชาสัมพันธ์อย่างเป็นทางการ กำหนดการ วันเปิดรับสมัคร ค่าลงทะเบียน และการรับรองการฝึก'
            : activeScope === 'members'
            ? 'ประกาศคำสั่งโครงการ ข้อปฏิบัติ รายการอุปกรณ์ประจำกาย และลิงก์กลุ่มประสานงานสำหรับผู้เข้าร่วม'
            : 'ติดตามประกาศคำสั่ง กำหนดการชำระเงิน เอกสารแนบ PDF ลิงก์เข้ากลุ่ม และภาพกิจกรรมจากคณะกรรมการฝึกอบรม'}
        </p>
      </div>

      {/* Dual Scope Switcher: Public PR vs Member Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <button
          type="button"
          onClick={() => handleScopeChange('public')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeScope === 'public'
              ? 'bg-gradient-to-r from-orange-600 via-rescue-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-400/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Megaphone className="w-4 h-4 shrink-0" />
          <span>ประชาสัมพันธ์รับสมัคร (สาธารณะ)</span>
        </button>

        <button
          type="button"
          onClick={() => handleScopeChange('members')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeScope === 'members'
              ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>ประกาศคำสั่งสำหรับสมาชิก</span>
        </button>

        <button
          type="button"
          onClick={() => handleScopeChange('all')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeScope === 'all'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <span>ดูประกาศทั้งหมด</span>
        </button>
      </div>

      {/* Dynamic PR vs Member Share Banner with 1-Click Copy */}
      <div className={`p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border ${
        activeScope === 'public'
          ? 'bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/40 border-orange-500/50'
          : activeScope === 'members'
          ? 'bg-gradient-to-r from-indigo-950/60 via-slate-900 to-blue-950/40 border-indigo-500/50'
          : 'bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
            activeScope === 'public'
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
              : activeScope === 'members'
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {activeScope === 'public' ? (
              <Megaphone className="w-6 h-6 animate-pulse" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">{shareTitle}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                activeScope === 'public'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                {activeScope === 'public' ? 'Public PR' : activeScope === 'members' ? 'Members Only' : 'All'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5 break-all select-all">
              {currentShareUrl}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(currentShareUrl);
            setCopiedPageUrl(true);
            setTimeout(() => setCopiedPageUrl(false), 2500);
          }}
          className={`w-full sm:w-auto px-5 py-2.5 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer ${
            activeScope === 'public'
              ? 'bg-gradient-to-r from-orange-600 via-rescue-600 to-amber-600 hover:from-orange-500 hover:to-rescue-500 shadow-orange-600/30'
              : activeScope === 'members'
              ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/30'
              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {copiedPageUrl ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copiedPageUrl ? 'คัดลอก URL สำเร็จ!' : shareButtonText}</span>
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
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
        {activeScope === 'members' && !user ? (
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-2xl backdrop-blur">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">ประกาศคำสั่งเฉพาะสมาชิกโครงการ</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              ส่วนนี้สงวนสิทธิ์เฉพาะผู้เข้าร่วมโครงการ JRE 2027 ที่ลงทะเบียนแล้ว กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อเปิดดูคำสั่งโครงการ, การจัดสรรกลุ่ม/ห้องนอน และลิงก์กลุ่มไลน์ประสานงาน
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {onOpenGoogleLogin && (
                <button
                  type="button"
                  onClick={onOpenGoogleLogin}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rescue-600 to-amber-600 hover:from-rescue-500 hover:to-amber-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  เข้าสู่ระบบด้วยบัญชี Google
                </button>
              )}
              {onNavigateRegister && (
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 transition-all text-xs sm:text-sm cursor-pointer active:scale-95"
                >
                  {myRegistration ? 'ไปยังแดชบอร์ดผู้สมัครของฉัน' : 'สมัครเข้าร่วมโครงการ JRE 2027'}
                </button>
              )}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ไม่พบประกาศในหมวดหมู่ที่เลือก</p>
          </div>
        ) : (
          filtered.map(item => {
            const images = Array.isArray(item.images) ? item.images : [];
            const hasPdf = Boolean(item.pdf_url);
            const scopePath = item.category === 'pr' ? '/announcements/pr' : '/announcements/orders';
            const itemDirectUrl = `${currentOrigin}${scopePath}?id=${item.id}`;

            return (
              <article
                key={item.id}
                id={`ann-${item.id}`}
                className={`bg-slate-900 border rounded-3xl p-6 sm:p-7 transition-all duration-300 shadow-xl scroll-mt-28 ${
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

                  <div className="flex items-center gap-2">
                    {/* View Single Post Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectPost(item)}
                      className="px-3 py-1 bg-rescue-500/10 hover:bg-rescue-500/20 text-rescue-400 hover:text-rescue-300 border border-rescue-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="เปิดดูหน้าเฉพาะของโพสต์นี้"
                    >
                      <Eye className="w-3 h-3" />
                      <span>เปิดดูหน้านี้</span>
                    </button>

                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(itemDirectUrl);
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer active:scale-95"
                      title="คัดลอกลิงก์เฉพาะโพสต์นี้"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-rescue-400" />}
                      <span>{copiedId === item.id ? 'คัดลอกแล้ว' : 'แชร์โพสต์นี้'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] ml-1">
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

                {/* Clickable Title that navigates to dedicated view */}
                <h2 
                  onClick={() => handleSelectPost(item)}
                  className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug hover:text-rescue-400 transition-colors cursor-pointer"
                  title="คลิกเพื่อเปิดหน้าเฉพาะของประกาศนี้"
                >
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
                        type="button"
                        onClick={() => setPreviewPdf({ url: item.pdf_url, name: item.pdf_name })}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>เปิดดูเอกสาร</span>
                      </button>
                      <a
                        href={item.pdf_url}
                        download={item.pdf_name || 'jre2027_announcement_doc.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Footer Actions: External Action Button + Dedicated View Shortcut */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  {item.action_url ? (
                    <a
                      href={item.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rescue-600 hover:bg-rescue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>{item.action_label || 'เปิดดูรายละเอียด'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={() => handleSelectPost(item)}
                    className="text-xs text-rescue-400 hover:text-rescue-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>อ่านฉบับเต็มและแชร์เฉพาะหน้านี้</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {lightboxImages && (
        <ModalPortal isOpen={Boolean(lightboxImages)} onClose={() => setLightboxImages(null)}>
          <div 
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxImages(null)}
          >
            {/* Top Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between py-3 text-white" onClick={e => e.stopPropagation()}>
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
                  type="button"
                  onClick={() => setLightboxImages(null)}
                  className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Container with Prev/Next Controls */}
            <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
              {lightboxImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 sm:left-4 z-10 p-3 bg-slate-900/80 hover:bg-rescue-600 text-white rounded-full transition-all backdrop-blur shadow-xl border border-slate-700 cursor-pointer"
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
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 sm:right-4 z-10 p-3 bg-slate-900/80 hover:bg-rescue-600 text-white rounded-full transition-all backdrop-blur shadow-xl border border-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails */}
            {lightboxImages.length > 1 && (
              <div className="w-full max-w-2xl flex items-center justify-center gap-2 py-3 overflow-x-auto" onClick={e => e.stopPropagation()}>
                {lightboxImages.map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      lightboxIndex === idx ? 'border-rescue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumb} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ModalPortal>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewPdf && (
        <ModalPortal isOpen={Boolean(previewPdf)} onClose={() => setPreviewPdf(null)}>
          <div 
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setPreviewPdf(null)}
          >
            <div 
              className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
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
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewPdf(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
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
        </ModalPortal>
      )}

    </div>
  );
}
