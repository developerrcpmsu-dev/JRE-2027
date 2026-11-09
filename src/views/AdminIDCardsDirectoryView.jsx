import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Download,
  Search,
  Building,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Users,
  Award,
  Layers,
  CreditCard,
  Check,
  Scissors,
  RotateCw,
  FileText,
  Edit3,
  Sliders
} from 'lucide-react';
import IDCardPreview, {
  renderNativeIdCardCanvas,
  renderNativeIdCardBackCanvas,
  A4FourQuadrantGridSheet,
  PersonFoldBadgePair,
  PORTRAIT_BASE_WIDTH,
  PORTRAIT_BASE_HEIGHT,
  BADGE_BACK_IMAGE
} from '../components/IDCardPreview';
import BadgePhotoCropperModal from '../components/BadgePhotoCropperModal';
import BadgeInspectEditModal from '../components/BadgeInspectEditModal';
import MasterCardLayoutStudioModal from '../components/MasterCardLayoutStudioModal';
import {
  isStaffRegistration,
  resolveUniversityInfo,
  OFFICIAL_NETWORK_INSTITUTIONS
} from '../data/defaultData';
import { getRegistrationCardData } from '../utils/idCard';
import QRCode from 'qrcode';

export default function AdminIDCardsDirectoryView({
  registrations = [],
  user = null,
  isAdmin = true,
  onNavigateBack = null,
  onOpenScanner = null,
  onUpdateRegistration = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'staff', 'university', 'general'
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [viewLayout, setViewLayout] = useState('a4_fold'); // 'a4_fold' (Default: 2 people per A4, front & back) or 'grid' (Interactive Cards)
  const [cardOrientation, setCardOrientation] = useState('portrait');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  // Admin Inspection, Cropping & Master Layout Studio Modals
  const [inspectingPerson, setInspectingPerson] = useState(null);
  const [croppingPerson, setCroppingPerson] = useState(null);
  const [isLayoutStudioOpen, setIsLayoutStudioOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('studio') === '1' || params.get('layout') === '1';
    }
    return false;
  });

  const handleSaveCroppedPhoto = async (croppedDataUrl) => {
    if (!croppingPerson) return;
    const targetId = croppingPerson.user_id || croppingPerson.id;
    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { id_card_photo: croppedDataUrl });
    }
    setCroppingPerson(null);
    if (inspectingPerson) {
      setInspectingPerson(prev => prev ? { ...prev, id_card_photo: croppedDataUrl } : null);
    }
  };

  const handleSaveBadgeEdits = async (userId, updates) => {
    if (onUpdateRegistration) {
      await onUpdateRegistration(userId, updates);
    }
    setInspectingPerson(null);
  };

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/admin/id-cards`
    : '/admin/id-cards';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2200);
    } catch (err) {
      console.warn('Copy URL failed:', err);
    }
  };

  // Add body class for print styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('directory-print-active');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('directory-print-active');
      }
    };
  }, []);

  // Group raw registrations into Staff, University, and General (Classic 2-tier classification)
  const categorizedData = useMemo(() => {
    const staffList = [];
    const universityMap = {};
    const generalList = [];

    OFFICIAL_NETWORK_INSTITUTIONS.forEach((inst) => {
      universityMap[inst.shortTag] = {
        meta: inst,
        items: []
      };
    });

    (registrations || []).forEach((reg) => {
      const cardData = getRegistrationCardData(reg);
      const isStaff = isStaffRegistration(reg) || reg.is_staff || cardData.isStaff || cardData.badgeRole === 'STAFF' || cardData.badgeRole === 'DEV';

      // 1. STAFF (Organizing Staff / Committee / Dev)
      if (isStaff) {
        staffList.push({ reg, cardData });
        return;
      }

      // 2. Participants (Group by University or General)
      const uniInfo = resolveUniversityInfo(reg);
      const shortTag = uniInfo.shortTag;

      if (uniInfo.id !== 'other' && shortTag && universityMap[shortTag]) {
        universityMap[shortTag].items.push({ reg, cardData, uniInfo });
      } else if (uniInfo.id !== 'other' && shortTag) {
        if (!universityMap[shortTag]) {
          universityMap[shortTag] = { meta: uniInfo, items: [] };
        }
        universityMap[shortTag].items.push({ reg, cardData, uniInfo });
      } else {
        generalList.push({ reg, cardData, uniInfo });
      }
    });

    const universityGroups = Object.keys(universityMap)
      .map((tag) => ({
        tag,
        meta: universityMap[tag].meta,
        items: universityMap[tag].items
      }))
      .filter((g) => g.items.length > 0)
      .sort((a, b) => a.meta.fullName.localeCompare(b.meta.fullName, 'th'));

    return {
      staffList,
      universityGroups,
      generalList,
      totalCount: (registrations || []).length
    };
  }, [registrations]);

  // Filtered dataset based on search query, category, and selected university
  const filteredDataset = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matchesQuery = ({ reg, cardData }) => {
      if (!q) return true;
      const searchable = [
        cardData.cardCode,
        cardData.thaiName,
        cardData.englishName,
        cardData.callsign,
        cardData.nickname,
        cardData.unit,
        cardData.affiliation,
        cardData.bloodGroup,
        reg.phone,
        reg.user_email,
        reg.email,
        reg.national_id,
        reg.room_assigned
      ]
        .filter(Boolean)
        .map((val) => String(val).toLowerCase());

      return searchable.some((val) => val.includes(q));
    };

    let matchedStaff = categorizedData.staffList.filter(matchesQuery);
    if (activeCategory === 'university' || activeCategory === 'general') {
      matchedStaff = [];
    }

    let matchedUniversities = categorizedData.universityGroups
      .map((group) => {
        if (selectedUniversity !== 'all' && group.tag !== selectedUniversity) {
          return null;
        }
        const filteredItems = group.items.filter(matchesQuery);
        if (filteredItems.length === 0) return null;
        return {
          ...group,
          items: filteredItems
        };
      })
      .filter(Boolean);

    if (activeCategory === 'staff' || activeCategory === 'general') {
      matchedUniversities = [];
    }

    let matchedGeneral = categorizedData.generalList.filter(matchesQuery);
    if (activeCategory === 'staff' || activeCategory === 'university') {
      matchedGeneral = [];
    }

    const totalVisible =
      matchedStaff.length +
      matchedUniversities.reduce((acc, g) => acc + g.items.length, 0) +
      matchedGeneral.length;

    return {
      staff: matchedStaff,
      universities: matchedUniversities,
      general: matchedGeneral,
      totalVisible
    };
  }, [categorizedData, searchQuery, activeCategory, selectedUniversity]);

  // Flatten currently visible items for A4 pagination (2 people per sheet)
  const visibleCardList = useMemo(() => {
    const list = [];
    filteredDataset.staff.forEach((item) => list.push({ ...item, groupType: 'staff', groupLabel: '⭐ Staff คณะทำงาน' }));
    filteredDataset.universities.forEach((g) => {
      g.items.forEach((item) => list.push({ ...item, groupType: 'university', groupLabel: `🏫 ${g.meta.fullName}`, uniTag: g.tag }));
    });
    filteredDataset.general.forEach((item) => list.push({ ...item, groupType: 'general', groupLabel: '👥 ผู้เข้าร่วมทั่วไป' }));
    return list;
  }, [filteredDataset]);

  // Chunk visible cards into 2 people per A4 page
  const a4Pages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < visibleCardList.length; i += 2) {
      pages.push({
        pageNumber: Math.floor(i / 2) + 1,
        person1: visibleCardList[i],
        person2: visibleCardList[i + 1] || null
      });
    }
    return pages;
  }, [visibleCardList]);

  // Print Handler
  const handlePrint = () => {
    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  // Batch Export Handler (1200 x 1500 px PNG)
  const handleBatchExportPng = async () => {
    if (isBatchExporting || visibleCardList.length === 0) return;

    const confirmExport = window.confirm(
      `ระบบกำลังจะส่งออกภาพบัตรแนวตั้ง 1200 × 1500 PX จำนวน ${visibleCardList.length} ใบ\nคลิก "ตกลง" เพื่อเริ่มการบันทึกภาพ`
    );
    if (!confirmExport) return;

    setIsBatchExporting(true);
    setExportProgress({ current: 0, total: visibleCardList.length });

    try {
      const { getIdCardQrPayload } = await import('../utils/idCard');

      for (let i = 0; i < visibleCardList.length; i++) {
        const item = visibleCardList[i];
        const cardData = item.cardData;
        const photo = cardData.photo || user?.avatar || '';

        const qrDataUrl = await QRCode.toDataURL(getIdCardQrPayload(item.reg), {
          width: 360,
          margin: 1,
          errorCorrectionLevel: 'M'
        });

        const canvas = await renderNativeIdCardCanvas({
          photo,
          cardData,
          qrDataUrl,
          orientation: cardOrientation
        });

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${cardData.cardCode}-${cardData.thaiName.replace(/\s+/g, '_')}-1200x1500.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        }

        setExportProgress({ current: i + 1, total: visibleCardList.length });
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error('Batch ID card export failed:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกภาพบัตรบางรายการ');
    } finally {
      setIsBatchExporting(false);
    }
  };

  // Download Back Image
  const handleDownloadBackImage = async () => {
    try {
      const canvas = await renderNativeIdCardBackCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `JRE2027-badge-back-1200x1500.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error('Download back image failed:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      {/* High-Precision Print Stylesheet for A4 2-Person Fold Sheets */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          body > *:not(#root) {
            display: none !important;
          }
          .no-print,
          nav,
          header,
          footer,
          aside,
          button:not(.print-include) {
            display: none !important;
          }
          #root,
          #root > div,
          main,
          main > div,
          .animate-in {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 210mm !important;
            overflow: visible !important;
          }
          #printable-id-cards-directory {
            display: block !important;
            visibility: visible !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-id-cards-directory * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-print-sheet {
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
            overflow: hidden !important;
          }
          .a4-print-sheet:first-child {
            page-break-before: auto !important;
            break-before: auto !important;
          }
          .a4-grid-4cell {
            width: 210mm !important;
            height: 296mm !important;
            max-height: 296mm !important;
            display: grid !important;
            grid-template-columns: 105mm 105mm !important;
            grid-template-rows: 148mm 148mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            position: relative !important;
            background: #ffffff !important;
            border: none !important;
          }
          .a6-quadrant {
            width: 105mm !important;
            height: 148mm !important;
            max-height: 148mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
            position: relative !important;
            border: none !important;
          }
          .a6-card-wrapper {
            width: 96mm !important;
            height: 120mm !important;
            max-height: 120mm !important;
            box-sizing: border-box !important;
            border-radius: 4.5mm !important;
            overflow: hidden !important;
            box-shadow: none !important;
            border: 1px solid #334155 !important;
            margin: 0 auto !important;
          }
          .a6-card-wrapper > div {
            width: 480px !important;
            height: 600px !important;
            transform: scale(0.7559) !important;
            transform-origin: top left !important;
          }
          .print-center-fold-line {
            display: block !important;
            position: absolute !important;
            left: 105mm !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 0 !important;
            border-left: 1.5px dashed #f97316 !important;
            z-index: 30 !important;
          }
          .print-center-cut-line {
            display: block !important;
            position: absolute !important;
            top: 148mm !important;
            left: 0 !important;
            right: 0 !important;
            height: 0 !important;
            border-top: 1.5px dashed #64748b !important;
            z-index: 30 !important;
          }
        }
            left: 0 !important;
            right: 0 !important;
            height: 0 !important;
            border-top: 1px dashed #64748b !important;
            z-index: 30 !important;
          }
        }
      `}</style>

      {/* Top Navigation & Shareable URL Banner */}
      <div className="no-print mb-6 space-y-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-300">
                JRE 2027 • Official ID Cards Directory
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> ข้อมูลผู้สมัครจริง (Real-Time Sync)
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 font-mono">
                1 A4 มี 2 คน (หน้า-หลังพับประกบ)
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              หน้ารวมบัตรประจำตัว JRE 2027 (ID Cards Directory)
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
              จัดกลุ่มเรียงตาม <strong>Staff คณะทำงาน</strong>, <strong>มหาวิทยาลัย/สถาบัน</strong>, และ <strong>ผู้เข้าร่วมทั่วไป</strong> • รูปแบบ <strong>1 แผ่น A4 มี 2 คน (ด้านหน้า และด้านหลัง QR เว็บไซต์ JRE2027)</strong> พร้อมเส้นตัดขอบนอกและเส้นพับกึ่งกลางสำหรับนำไปเคลือบพลาสติก
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLayoutStudioOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/50 bg-gradient-to-r from-purple-600/90 to-cyan-600/90 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/25 transition-all hover:brightness-110 cursor-pointer"
              title="เปิดสตูดิโอปรับแต่งรูปแบบบัตรกลาง (ขยับตำแหน่ง ย่อ-ขยายขนาด ทุกจุดแบบ Real-Time)"
            >
              <Sliders className="h-4 w-4" />
              🎨 ปรับแต่งรูปแบบบัตรกลาง (Dev Studio)
            </button>

            {onNavigateBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:border-orange-400/50 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับแดชบอร์ด
              </button>
            )}

            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="inline-flex items-center gap-2 rounded-2xl border border-orange-300/60 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-orange-500/25 transition-all hover:brightness-110 cursor-pointer"
                title="เปิดระบบสแกน QR อเนกประสงค์ (เช็คชื่อมาเข้าร่วมฝึก • ยืนยันรับบัตร ID Card • รับเสื้อฝึก)"
              >
                <QrCode className="h-4 w-4" />
                📷 สแกน QR อเนกประสงค์ (เช็คชื่อ • รับบัตร ID Card)
              </button>
            )}
          </div>
        </div>

        {/* Shareable URL Copy Card */}
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-500/[0.08] via-slate-900 to-slate-900 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/40 bg-orange-500/20 text-orange-300">
              🪪
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-400">
                Official Directory URL
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-xs font-bold text-amber-200">
                  {pageUrl}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-500/15 px-3.5 py-2 text-xs font-bold text-orange-200 transition-colors hover:bg-orange-500/25 cursor-pointer"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUrl ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ URL หน้ารวม'}
            </button>

            <a
              href="/admin/id-cards"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:text-white cursor-pointer"
              title="เปิดหน้ารวม ID Cards นี้แยกออกมาในแท็บใหม่"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              เปิดแท็บใหม่
            </a>
          </div>
        </div>

        {/* Statistical Summary Counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">บัตรทั้งหมด</span>
            <p className="mt-1 text-2xl font-black text-white">{categorizedData.totalCount}</p>
            <span className="text-[11px] text-slate-500">
              = {Math.ceil(categorizedData.totalCount / 2)} แผ่น A4
            </span>
          </div>

          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/[0.06] p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">⭐ Staff คณะทำงาน</span>
            <p className="mt-1 text-2xl font-black text-yellow-300">{categorizedData.staffList.length}</p>
            <span className="text-[11px] text-yellow-500/80">
              = {Math.ceil(categorizedData.staffList.length / 2)} แผ่น A4
            </span>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.06] p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">🏫 มหาวิทยาลัย</span>
            <p className="mt-1 text-2xl font-black text-sky-300">
              {categorizedData.universityGroups.reduce((acc, g) => acc + g.items.length, 0)}
            </p>
            <span className="text-[11px] text-sky-400/80">{categorizedData.universityGroups.length} สถาบันเครือข่าย</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">👥 ผู้เข้าร่วมทั่วไป</span>
            <p className="mt-1 text-2xl font-black text-emerald-300">{categorizedData.generalList.length}</p>
            <span className="text-[11px] text-emerald-400/80">กู้ภัยและบุคคลทั่วไป</span>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-orange-500/30 bg-orange-500/[0.06] p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">📄 หน้าพิมพ์ A4 รวม</span>
            <p className="mt-1 text-2xl font-black text-orange-300">{a4Pages.length}</p>
            <span className="text-[11px] text-orange-400/80">แผ่น A4 (2 คน/แผ่น)</span>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Actions */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, สกุล, นามเรียกขาน, ชื่อเล่น, มหาวิทยาลัย, รหัสบัตร..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Layout Switcher */}
            <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setViewLayout('a4_fold')}
                className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewLayout === 'a4_fold'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="รูปแบบ 1 แผ่น A4 มี 2 คน หน้า-หลังพร้อมเส้นพับประกบสำหรับเคลือบ"
              >
                <Scissors className="h-3.5 w-3.5" />
                <span>แผ่น A4 พับประกบ (2คน/แผ่น)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-slate-800 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="มุมมองการ์ดเดี่ยวแบบโต้ตอบ"
              >
                <span>มุมมองการ์ด</span>
              </button>
            </div>

            {/* Download Back Image Standalone */}
            <button
              type="button"
              onClick={handleDownloadBackImage}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200 transition-colors hover:bg-sky-500/20 cursor-pointer"
              title="ดาวน์โหลดไฟล์ภาพบัตรด้านหลัง PNG 1200 x 1500 px"
            >
              <Download className="h-4 w-4" />
              <span>ภาพหลังบัตร PNG</span>
            </button>

            {/* Batch PNG Export */}
            <button
              type="button"
              onClick={handleBatchExportPng}
              disabled={isBatchExporting || visibleCardList.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-orange-200 transition-colors hover:bg-orange-500/20 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
              title="บันทึกไฟล์ภาพ .png ขนาด 1200 x 1500 px ของบัตรทั้งหมด"
            >
              <Download className="h-4 w-4" />
              {isBatchExporting
                ? `ส่งออก ${exportProgress.current}/${exportProgress.total}…`
                : `บันทึก PNG ทั้งหมด (${visibleCardList.length})`}
            </button>

            {/* Batch Print A4 Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-orange-500/20 transition-transform hover:from-orange-400 hover:to-amber-400 active:scale-95 cursor-pointer"
              title="พิมพ์แผ่น A4 ทุกหน้า (1 แผ่น มี 2 คน หน้า-หลังประกบกัน)"
            >
              <Printer className="h-4 w-4" />
              <span>พิมพ์ A4 ทั้งหมด ({a4Pages.length} แผ่น)</span>
            </button>
          </div>
        </div>

        {/* Quick Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setSelectedUniversity('all');
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
            }`}
          >
            ทั้งหมด ({categorizedData.totalCount} คน • {Math.ceil(categorizedData.totalCount / 2)} แผ่น)
          </button>


          <button
            type="button"
            onClick={() => {
              setActiveCategory('staff');
              setSelectedUniversity('all');
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'staff'
                ? 'bg-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/20'
                : 'border border-slate-800 bg-slate-900 text-yellow-300 hover:border-yellow-400/40'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            ⭐ Staff คณะทำงาน ({categorizedData.staffList.length} คน)
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('university')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'university'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                : 'border border-slate-800 bg-slate-900 text-sky-300 hover:border-sky-400/40'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            🏫 แยกตามมหาวิทยาลัย ({categorizedData.universityGroups.reduce((acc, g) => acc + g.items.length, 0)} คน)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('general');
              setSelectedUniversity('all');
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'general'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'border border-slate-800 bg-slate-900 text-emerald-300 hover:border-emerald-400/40'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            👥 ผู้เข้าร่วมทั่วไป ({categorizedData.generalList.length} คน)
          </button>

          {/* University Dropdown Selector */}
          {(activeCategory === 'all' || activeCategory === 'university') && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">เลือกสถาบัน:</span>
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  if (e.target.value !== 'all') setActiveCategory('university');
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกสถาบัน / มหาวิทยาลัย</option>
                {categorizedData.universityGroups.map((g) => (
                  <option key={g.tag} value={g.tag}>
                    {g.meta.fullName} ({g.items.length} คน)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Print / Display Container */}
      <div id="printable-id-cards-directory">
        {/* ========================================================
            VIEW MODE 1: A4 4-CELL GRID SHEETS (2 PEOPLE PER SHEET)
            2 Columns x 2 Rows = 4 Quadrants A6 (105 x 148.5 mm)
            Row 1 (Person 1): Front (Left) & Back (Right)
            Row 2 (Person 2): Front (Left) & Back (Right)
            Folds down the vertical center line with 100% exact alignment
            ======================================================== */}
        {viewLayout === 'a4_fold' && (
          <div className="space-y-8">
            {a4Pages.map(({ pageNumber, person1, person2 }) => (
              <A4FourQuadrantGridSheet
                key={`a4-page-${pageNumber}`}
                pageNumber={pageNumber}
                totalPages={a4Pages.length}
                person1={person1}
                person2={person2}
                user={user}
                onPrintSingle={handlePrint}
                onInspect={setInspectingPerson}
                onCrop={setCroppingPerson}
              />
            ))}
          </div>
        )}

        {/* ========================================================
            VIEW MODE 2: INTERACTIVE GRID VIEW
            ======================================================== */}
        {viewLayout === 'grid' && (
          <div className="space-y-10">

            {/* GROUP 1: ⭐ STAFF */}
            {filteredDataset.staff.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-yellow-500/30 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-400/40">
                      ⭐
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-white sm:text-xl">
                        คณะทำงาน & คณะผู้จัดโครงการ (Organizing Staff)
                      </h2>
                      <p className="text-xs text-yellow-300/80">
                        รวม {filteredDataset.staff.length} ท่าน • {Math.ceil(filteredDataset.staff.length / 2)} แผ่น A4
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDataset.staff.map(({ reg, cardData }) => (
                    <div key={cardData.cardCode} className="flex flex-col items-center gap-2 w-full max-w-sm mx-auto">
                      <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm">
                        <span className="text-[11px] font-mono font-bold text-amber-300">
                          {cardData.cardCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingPerson(reg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10.5px] font-bold text-slate-200 hover:text-white hover:border-orange-400/50 cursor-pointer"
                            title="ตรวจสอบข้อมูลและแก้ไขบัตร"
                          >
                            <Edit3 className="h-3 w-3 text-orange-400" />
                            <span>ตรวจ / แก้</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCroppingPerson(reg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-[10.5px] font-bold text-orange-200 hover:bg-orange-500/20 cursor-pointer"
                            title="ครอปรูปถ่ายประจำตัว"
                          >
                            <Scissors className="h-3 w-3" />
                            <span>ครอปรูป</span>
                          </button>
                        </div>
                      </div>
                      <IDCardPreview
                        registration={reg}
                        user={user}
                        defaultOrientation={cardOrientation}
                        allowOrientationToggle={false}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GROUP 2: 🏫 UNIVERSITIES */}
            {filteredDataset.universities.length > 0 && (
              <section className="space-y-8">
                {filteredDataset.universities.map((group) => (
                  <div
                    key={group.tag}
                    className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl sm:p-7 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl border border-sky-400/40 bg-sky-500/15 px-3 py-1 font-mono text-xs font-black text-sky-300">
                          {group.tag}
                        </span>
                        <div>
                          <h3 className="text-base font-black text-white sm:text-lg">
                            {group.meta.fullName}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {group.meta.club || 'ผู้แทนสถาบัน'} • ผู้เข้าร่วม {group.items.length} คน
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map(({ reg, cardData }) => (
                        <div key={cardData.cardCode} className="flex flex-col items-center gap-2 w-full max-w-sm mx-auto">
                          <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm">
                            <span className="text-[11px] font-mono font-bold text-sky-300">
                              {cardData.cardCode}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingPerson(reg)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10.5px] font-bold text-slate-200 hover:text-white hover:border-orange-400/50 cursor-pointer"
                                title="ตรวจสอบข้อมูลและแก้ไขบัตร"
                              >
                                <Edit3 className="h-3 w-3 text-orange-400" />
                                <span>ตรวจ / แก้</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCroppingPerson(reg)}
                                className="inline-flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-[10.5px] font-bold text-orange-200 hover:bg-orange-500/20 cursor-pointer"
                                title="ครอปรูปถ่ายประจำตัว"
                              >
                                <Scissors className="h-3 w-3" />
                                <span>ครอปรูป</span>
                              </button>
                            </div>
                          </div>
                          <IDCardPreview
                            registration={reg}
                            user={user}
                            defaultOrientation={cardOrientation}
                            allowOrientationToggle={false}
                            showActions={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* GROUP 3: 👥 GENERAL PARTICIPANTS */}
            {filteredDataset.general.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-emerald-500/30 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      👥
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-white sm:text-xl">
                        ผู้เข้าร่วมทั่วไป & หน่วยงานกู้ภัยภาคี (General Participants)
                      </h2>
                      <p className="text-xs text-emerald-300/80">
                        รวม {filteredDataset.general.length} ท่าน
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDataset.general.map(({ reg, cardData }) => (
                    <div key={cardData.cardCode} className="flex flex-col items-center gap-2 w-full max-w-sm mx-auto">
                      <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm">
                        <span className="text-[11px] font-mono font-bold text-emerald-300">
                          {cardData.cardCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingPerson(reg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10.5px] font-bold text-slate-200 hover:text-white hover:border-orange-400/50 cursor-pointer"
                            title="ตรวจสอบข้อมูลและแก้ไขบัตร"
                          >
                            <Edit3 className="h-3 w-3 text-orange-400" />
                            <span>ตรวจ / แก้</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCroppingPerson(reg)}
                            className="inline-flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-[10.5px] font-bold text-orange-200 hover:bg-orange-500/20 cursor-pointer"
                            title="ครอปรูปถ่ายประจำตัว"
                          >
                            <Scissors className="h-3 w-3" />
                            <span>ครอปรูป</span>
                          </button>
                        </div>
                      </div>
                      <IDCardPreview
                        registration={reg}
                        user={user}
                        defaultOrientation={cardOrientation}
                        allowOrientationToggle={false}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Empty Result */}
        {filteredDataset.totalVisible === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-2xl">
              🔍
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">ไม่พบข้อมูลบัตรที่ตรงกับเงื่อนไข</h3>
            <p className="mt-1 text-xs text-slate-400">
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "ทั้งหมด" เพื่อดูบัตรทั้งหมดในระบบ
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setSelectedUniversity('all');
              }}
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Admin Live Badge Inspector & Editor Modal */}
      {inspectingPerson && (
        <BadgeInspectEditModal
          isOpen={Boolean(inspectingPerson)}
          person={inspectingPerson}
          onClose={() => setInspectingPerson(null)}
          onSave={handleSaveBadgeEdits}
          onOpenCropper={(p) => setCroppingPerson(p)}
        />
      )}

      {/* Admin ID Photo 4:5 Cropper Modal */}
      {croppingPerson && (
        <BadgePhotoCropperModal
          isOpen={Boolean(croppingPerson)}
          person={croppingPerson}
          onClose={() => setCroppingPerson(null)}
          onSave={handleSaveCroppedPhoto}
        />
      )}

      {/* Dev Master ID Card Layout Studio Modal */}
      {isLayoutStudioOpen && (
        <MasterCardLayoutStudioModal
          isOpen={isLayoutStudioOpen}
          onClose={() => setIsLayoutStudioOpen(false)}
          registrations={registrations}
        />
      )}
    </div>
  );
}
