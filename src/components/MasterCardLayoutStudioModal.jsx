import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Move,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff,
  AlignCenterHorizontal,
  Download,
  Sparkles,
  Layers,
  Maximize2,
  Grid,
  Image as ImageIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  PORTRAIT_BASE_WIDTH,
  PORTRAIT_BASE_HEIGHT,
  CardInnerContentPortrait,
  renderNativeIdCardCanvas,
  FALLBACK_PHOTO
} from './IDCardPreview';
import {
  DEFAULT_MASTER_CARD_LAYOUT,
  getMasterCardLayout,
  saveMasterCardLayout,
  resetMasterCardLayout,
  mergeMasterCardLayout
} from '../utils/idCardLayoutConfig';
import { getIdCardQrPayload, getRegistrationCardData } from '../utils/idCard';

const ZONES = [
  { key: 'headerBanner', label: '1. แถบหัวบัตร (Header Banner)', icon: '🏷️' },
  { key: 'photoFrame', label: '2. กรอบรูปถ่าย (Photo Frame)', icon: '🖼️' },
  { key: 'callsignPill', label: '3. ป้ายนามเรียกขาน (Callsign)', icon: '📡' },
  { key: 'heroBox', label: '4. กล่องชื่อหลัก (Hero Name Box)', icon: '👤' },
  { key: 'affiliationBox', label: '5. กล่องสังกัดสถาบัน (Affiliation)', icon: '🏛️' },
  { key: 'unitBadgeRow', label: '6. แถวหน่วย & รหัสบัตร (Unit / ID)', icon: '🪪' },
  { key: 'bottomRow', label: '7. แถวล่าง QR / เลือด / Verified', icon: '🏁' },
  { key: 'rolePill', label: '8. ป้าย Role เสริม (Floating Pill)', icon: '⭐' }
];

const SAMPLE_PROFILES = {
  dev: {
    id: 'sample-dev',
    prefix: 'นาย',
    first_name: 'พงศ์ภรณ์',
    last_name: 'ทองศิริ',
    english_name: 'MR. PONGPORN THONGSIRI (MSU)',
    nickname: 'เบส / Best',
    callsign: 'RCP 16-37',
    organization: 'มหาวิทยาลัยมหาสารคาม (มมส)',
    unit: 'ชมรมกู้ภัยราชพฤกษ์',
    blood_group: 'B',
    is_staff: true,
    role: 'dev',
    cardData: {
      thaiName: 'นายพงศ์ภรณ์ ทองศิริ (มมส)',
      englishName: 'MR. PONGPORN THONGSIRI (MSU)',
      nickname: 'เบส / Best',
      callsign: 'RCP 16-37',
      affiliation: 'มหาวิทยาลัยมหาสารคาม (มมส)',
      unit: 'ชมรมกู้ภัยราชพฤกษ์',
      cardCode: 'JRE27-6E26829B0E',
      bloodGroup: 'B',
      isDev: true,
      isStaff: false,
      badgeRole: 'DEV'
    }
  },
  staff: {
    id: 'sample-staff',
    prefix: 'นาย',
    first_name: 'เศรษฐบุตร',
    last_name: 'อากานิส',
    english_name: 'MR. SADTABOOT ARKANIS (MSU)',
    nickname: 'โฟกัส / FOCUS',
    callsign: 'RCP15-05',
    organization: 'มหาวิทยาลัยมหาสารคาม (มมส)',
    unit: 'ชมรมกู้ภัยราชพฤกษ์',
    blood_group: 'O',
    is_staff: true,
    cardData: {
      thaiName: 'นายเศรษฐบุตร อากานิส (มมส)',
      englishName: 'MR. SADTABOOT ARKANIS (MSU)',
      nickname: 'โฟกัส / FOCUS',
      callsign: 'RCP15-05',
      affiliation: 'มหาวิทยาลัยมหาสารคาม (มมส)',
      unit: 'ชมรมกู้ภัยราชพฤกษ์',
      cardCode: 'JRE27-63DC21E01F',
      bloodGroup: 'O',
      isDev: false,
      isStaff: true,
      badgeRole: 'STAFF'
    }
  },
  participant: {
    id: 'sample-participant',
    prefix: 'นางสาว',
    first_name: 'ชากริยา',
    last_name: 'ตุริสุต',
    english_name: 'MISS CHAKRIYA TURISUT (KKU)',
    nickname: 'ข้าวหอม / Khavor',
    callsign: 'อาสาข้าวหอม',
    organization: 'มหาวิทยาลัยขอนแก่น (มข)',
    unit: 'อาสาสมัคร (นิสิต/นักศึกษาทั่วไป มข)',
    blood_group: 'B',
    is_staff: false,
    cardData: {
      thaiName: 'นางสาวชากริยา ตุริสุต (มข)',
      englishName: 'MISS CHAKRIYA TURISUT (KKU)',
      nickname: 'ข้าวหอม / Khavor',
      callsign: 'อาสาข้าวหอม',
      affiliation: 'มหาวิทยาลัยขอนแก่น (มข)',
      unit: 'อาสาสมัคร (นิสิต/นักศึกษาทั่วไป มข)',
      cardCode: 'JRE27-E0FC431926',
      bloodGroup: 'B',
      isDev: false,
      isStaff: false,
      badgeRole: 'PARTICIPANT'
    }
  }
};

export default function MasterCardLayoutStudioModal({
  isOpen,
  onClose,
  registrations = []
}) {
  const [layout, setLayout] = useState(() => getMasterCardLayout());
  const [selectedZone, setSelectedZone] = useState('headerBanner');
  const [previewRole, setPreviewRole] = useState('staff'); // 'dev' | 'staff' | 'participant' | 'real'
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [previewMode, setPreviewMode] = useState('interactive'); // 'interactive' | 'png'
  const [showGuides, setShowGuides] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [pngPreviewUrl, setPngPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const dragStateRef = useRef(null);

  const activeSample = useMemo(() => {
    if (previewRole === 'real' && selectedPersonId && registrations.length > 0) {
      const found = registrations.find(
        (r) => String(r.user_id || r.id) === String(selectedPersonId)
      );
      if (found) {
        return {
          reg: found,
          cardData: getRegistrationCardData(found),
          photo: found.id_card_photo || found.profile_image || FALLBACK_PHOTO
        };
      }
    }
    const preset = SAMPLE_PROFILES[previewRole] || SAMPLE_PROFILES.staff;
    return {
      reg: preset,
      cardData: preset.cardData,
      photo: FALLBACK_PHOTO
    };
  }, [previewRole, selectedPersonId, registrations]);

  // Generate QR code for preview
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(getIdCardQrPayload(activeSample.reg), {
      width: 360,
      margin: 1,
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [activeSample]);

  // Render live Canvas PNG when in 'png' mode
  useEffect(() => {
    if (!isOpen || previewMode !== 'png' || !qrDataUrl) return;
    let cancelled = false;
    renderNativeIdCardCanvas({
      photo: activeSample.photo,
      cardData: activeSample.cardData,
      qrDataUrl,
      orientation: 'portrait',
      layoutConfig: layout
    })
      .then((canvas) => {
        if (!cancelled && canvas) {
          setPngPreviewUrl(canvas.toDataURL('image/png'));
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [isOpen, previewMode, layout, activeSample, qrDataUrl]);

  // Mouse drag handler for direct manipulation on the card
  useEffect(() => {
    const handleMouseMove = (e) => {
      const st = dragStateRef.current;
      if (!st) return;
      const dx = Math.round(e.clientX - st.startMouseX);
      const dy = Math.round(e.clientY - st.startMouseY);

      setLayout((prev) => {
        const next = mergeMasterCardLayout(prev);
        const z = next[st.zoneKey];
        if (!z) return prev;

        if (st.zoneKey === 'callsignPill') {
          z.offsetX = Math.max(-180, Math.min(180, (st.initialZone.offsetX || 0) + dx));
          z.y = Math.max(0, Math.min(570, st.initialZone.y + dy));
        } else if (st.zoneKey === 'photoFrame') {
          z.centerHorizontally = false;
          z.x = Math.max(0, Math.min(480 - z.width, st.initialZone.x + dx));
          z.y = Math.max(0, Math.min(580 - z.height, st.initialZone.y + dy));
        } else {
          if (typeof z.x === 'number') {
            z.x = Math.max(0, Math.min(480 - (z.width || 40), st.initialZone.x + dx));
          }
          if (typeof z.y === 'number') {
            z.y = Math.max(0, Math.min(590 - (z.height || 20), st.initialZone.y + dy));
          }
        }
        return next;
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  const handleStartDrag = (zoneKey, event) => {
    const currentZone = layout[zoneKey] || {};
    const startX =
      zoneKey === 'photoFrame' && currentZone.centerHorizontally
        ? Math.round((480 - currentZone.width) / 2)
        : currentZone.x || 0;
    dragStateRef.current = {
      zoneKey,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      initialZone: { ...currentZone, x: startX }
    };
  };

  const updateZoneField = (zoneKey, field, value) => {
    setLayout((prev) => {
      const next = mergeMasterCardLayout(prev);
      next[zoneKey] = {
        ...next[zoneKey],
        [field]: value
      };
      if (zoneKey === 'photoFrame' && field === 'x') {
        next.photoFrame.centerHorizontally = false;
      }
      return next;
    });
  };

  const handleCenterHorizontally = (zoneKey) => {
    setLayout((prev) => {
      const next = mergeMasterCardLayout(prev);
      const z = next[zoneKey];
      if (!z) return prev;
      if (zoneKey === 'photoFrame') {
        z.centerHorizontally = true;
        z.x = Math.round((480 - z.width) / 2);
      } else if (zoneKey === 'callsignPill') {
        z.offsetX = 0;
      } else if (typeof z.width === 'number') {
        z.x = Math.round((480 - z.width) / 2);
      }
      return next;
    });
  };

  const handleAutoDistributeVertical = () => {
    setLayout((prev) => {
      const next = mergeMasterCardLayout(prev);
      next.headerBanner.x = 0;
      next.headerBanner.y = 0;
      next.headerBanner.width = 480;
      next.photoFrame.centerHorizontally = true;
      next.photoFrame.x = Math.round((480 - next.photoFrame.width) / 2);
      next.photoFrame.y = next.headerBanner.height + 10;
      next.callsignPill.offsetX = 0;
      next.callsignPill.y = next.photoFrame.y + next.photoFrame.height + 8;
      next.heroBox.x = Math.round((480 - next.heroBox.width) / 2);
      next.heroBox.y = next.callsignPill.y + next.callsignPill.height + 8;
      next.affiliationBox.x = Math.round((480 - next.affiliationBox.width) / 2);
      next.affiliationBox.y = next.heroBox.y + next.heroBox.heightWithNick + 8;
      next.unitBadgeRow.x = Math.round((480 - next.unitBadgeRow.width) / 2);
      next.unitBadgeRow.y = next.affiliationBox.y + next.affiliationBox.height + 6;
      next.bottomRow.x = Math.round((480 - next.bottomRow.width) / 2);
      next.bottomRow.y = next.unitBadgeRow.y + next.unitBadgeRow.height + 8;
      return next;
    });
  };

  const handleSaveMaster = async () => {
    setIsSaving(true);
    try {
      await saveMasterCardLayout(layout, true);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    const def = await resetMasterCardLayout();
    setLayout(def);
  };

  const handleDownloadSamplePng = async () => {
    const canvas = await renderNativeIdCardCanvas({
      photo: activeSample.photo,
      cardData: activeSample.cardData,
      qrDataUrl,
      orientation: 'portrait',
      layoutConfig: layout
    });
    const link = document.createElement('a');
    link.download = `JRE2027-Master-Test-${previewRole}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const currentZoneObj = layout[selectedZone] || {};

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative flex w-full max-w-6xl flex-col rounded-3xl border border-cyan-500/40 bg-slate-900 text-white shadow-2xl overflow-hidden max-h-[95vh]">
        {/* Studio Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/25">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Master ID Card Layout Studio
                </h2>
                <span className="rounded-full border border-cyan-400/50 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-black text-cyan-300">
                  DEVRCPMSU CONTROL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                คลิกลากขยับตำแหน่ง ย่อ-ขยายขนาด ปรับฟอนต์ และจัดกึ่งกลางแม่แบบบัตรกลาง (มีผลกับบัตรทุกใบทั้งเว็บ พิมพ์ A4 และ PNG)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoDistributeVertical}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25 cursor-pointer transition-all"
              title="จัดกึ่งกลางและเรียงระยะห่างแนวตั้งให้อัตโนมัติ"
            >
              <AlignCenterHorizontal className="h-3.5 w-3.5" />
              จัดกึ่งกลาง & เรียงอัตโนมัติ
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ค่าเริ่มต้นมาตรฐาน
            </button>

            <button
              type="button"
              onClick={handleSaveMaster}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 cursor-pointer transition-all"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  บันทึกแม่แบบกลางแล้ว!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกเป็นรูปแบบบัตรกลาง'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Studio Body */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* LEFT: Live Interactive Canvas & Card Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-between bg-slate-950/60 p-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Top Preview Toolbar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800/80">
              {/* Role Theme Switcher */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewRole('staff')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer ${
                    previewRole === 'staff'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⭐ STAFF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRole('participant')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer ${
                    previewRole === 'participant'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎓 PARTICIPANT
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRole('dev')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer ${
                    previewRole === 'dev'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💻 DEVRCPMSU
                </button>
              </div>

              {/* Mode Switcher: Interactive Drag vs Live PNG */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowGuides((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                    showGuides
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" />
                  เส้นกึ่งกลาง
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewMode((m) => (m === 'interactive' ? 'png' : 'interactive'))
                  }
                  className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[11px] font-bold cursor-pointer ${
                    previewMode === 'png'
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {previewMode === 'png' ? 'ดูภาพ PNG จริง (1200×1500)' : 'โหมดคลิกลากปรับแต่ง'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSamplePng}
                  className="inline-flex items-center gap-1 rounded-xl border border-orange-400/40 bg-orange-500/15 px-2.5 py-1.5 text-[11px] font-bold text-orange-200 hover:bg-orange-500/25 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  ทดสอบโหลด PNG
                </button>
              </div>
            </div>

            {/* Optional Real Person Selector */}
            {registrations.length > 0 && (
              <div className="w-full flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  จำลองข้อมูลผู้สมัครจริง:
                </span>
                <select
                  value={previewRole === 'real' ? selectedPersonId : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedPersonId(e.target.value);
                      setPreviewRole('real');
                    } else {
                      setPreviewRole('staff');
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">-- ใช้ข้อมูลตัวอย่างมาตรฐาน (Staff / Participant / Dev) --</option>
                  {registrations.map((r) => {
                    const id = r.user_id || r.id;
                    const name = `${r.prefix || ''}${r.first_name || ''} ${r.last_name || ''}`.trim();
                    return (
                      <option key={id} value={id}>
                        {name} ({r.callsign || '-'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Card Canvas Stage */}
            <div className="my-auto flex items-center justify-center py-2 overflow-auto max-w-full">
              {previewMode === 'png' && pngPreviewUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={pngPreviewUrl}
                    alt="PNG Output Preview"
                    style={{ width: `${PORTRAIT_BASE_WIDTH}px`, height: `${PORTRAIT_BASE_HEIGHT}px` }}
                    className="rounded-[22px] shadow-2xl border border-emerald-500/40 select-none"
                  />
                  <span className="mt-2 text-[11px] font-bold text-emerald-300">
                    ✓ ภาพผลลัพธ์ PNG จริง 100% (1200 × 1500 PX)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    style={{
                      width: `${PORTRAIT_BASE_WIDTH}px`,
                      height: `${PORTRAIT_BASE_HEIGHT}px`
                    }}
                    className="relative shrink-0 overflow-hidden rounded-[22px] border border-slate-600/80 bg-[#07172f] shadow-2xl select-none"
                  >
                    <CardInnerContentPortrait
                      photo={activeSample.photo}
                      cardData={activeSample.cardData}
                      qrDataUrl={qrDataUrl}
                      layoutConfig={layout}
                      studioInteractive={{
                        selectedZone,
                        onSelectZone: setSelectedZone,
                        onStartDrag: handleStartDrag,
                        showGuides
                      }}
                    />
                  </div>
                  <span className="mt-2 text-[11px] text-cyan-300 font-semibold">
                    💡 คลิกที่ส่วนใดก็ได้บนบัตรแล้วลากเมาส์เพื่อขยับตำแหน่งได้ทันที!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Precision Controls & Sliders Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 p-4 sm:p-5 overflow-y-auto">
            <div className="space-y-4">
              {/* Zone Selector Pills */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  เลือกชิ้นส่วนบนบัตรที่ต้องการปรับแต่ง
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ZONES.map((z) => (
                    <button
                      key={z.key}
                      type="button"
                      onClick={() => setSelectedZone(z.key)}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-[11px] font-bold transition-all cursor-pointer ${
                        selectedZone === z.key
                          ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span>{z.icon}</span>
                      <span className="truncate">{z.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Zone Precision Controls */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-black text-cyan-300">
                    {ZONES.find((z) => z.key === selectedZone)?.icon}{' '}
                    {ZONES.find((z) => z.key === selectedZone)?.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCenterHorizontally(selectedZone)}
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[10.5px] font-bold text-cyan-200 hover:bg-cyan-500/25 cursor-pointer"
                  >
                    <AlignCenterHorizontal className="h-3 w-3" />
                    จัดกึ่งกลางแนวนอน
                  </button>
                </div>

                {/* Role Pill Visibility Toggle */}
                {selectedZone === 'rolePill' && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <div>
                      <p className="text-xs font-bold text-white">แสดงป้าย Role ลอย (Floating Role Pill)</p>
                      <p className="text-[10.5px] text-slate-400">
                        แนะนำให้ปิดไว้หากไม่ต้องการให้ทับตรา 4 มหาวิทยาลัยบนแถบหัวบัตร
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateZoneField('rolePill', 'visible', !currentZoneObj.visible)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black cursor-pointer ${
                        currentZoneObj.visible
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentZoneObj.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {currentZoneObj.visible ? 'แสดงอยู่' : 'ซ่อนอยู่'}
                    </button>
                  </div>
                )}

                {/* Header Banner Fit Mode */}
                {selectedZone === 'headerBanner' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      การแสดงผลภาพหัวบัตร (Image Fit)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'fill', label: 'เต็มกรอบพอดี (Fill)' },
                        { id: 'cover', label: 'ขยายเต็ม (Cover)' },
                        { id: 'contain', label: 'คงสัดส่วน (Contain)' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateZoneField('headerBanner', 'fit', opt.id)}
                          className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold cursor-pointer ${
                            (currentZoneObj.fit || 'fill') === opt.id
                              ? 'border-cyan-400 bg-cyan-500/20 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Position X / OffsetX & Y Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedZone === 'callsignPill' ? (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                        <span>ขยับซ้าย-ขวา (Offset X)</span>
                        <span className="font-mono text-cyan-300">{currentZoneObj.offsetX || 0} px</span>
                      </div>
                      <input
                        type="range"
                        min="-160"
                        max="160"
                        value={currentZoneObj.offsetX || 0}
                        onChange={(e) => updateZoneField('callsignPill', 'offsetX', Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  ) : (
                    typeof currentZoneObj.x === 'number' && (
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                          <span>แนวนอน (X)</span>
                          <span className="font-mono text-cyan-300">{currentZoneObj.x} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="400"
                          value={currentZoneObj.x}
                          onChange={(e) => updateZoneField(selectedZone, 'x', Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    )
                  )}

                  {typeof currentZoneObj.y === 'number' && (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                        <span>แนวตั้ง (Y)</span>
                        <span className="font-mono text-cyan-300">{currentZoneObj.y} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="560"
                        value={currentZoneObj.y}
                        onChange={(e) => updateZoneField(selectedZone, 'y', Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {/* Width & Height Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  {typeof currentZoneObj.width === 'number' && (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                        <span>ความกว้าง (Width)</span>
                        <span className="font-mono text-amber-300">{currentZoneObj.width} px</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="480"
                        value={currentZoneObj.width}
                        onChange={(e) => updateZoneField(selectedZone, 'width', Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}

                  {typeof currentZoneObj.minWidth === 'number' && (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                        <span>ความกว้างขั้นต่ำ (Min W)</span>
                        <span className="font-mono text-amber-300">{currentZoneObj.minWidth} px</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="420"
                        value={currentZoneObj.minWidth}
                        onChange={(e) => updateZoneField(selectedZone, 'minWidth', Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}

                  {typeof currentZoneObj.height === 'number' && (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                        <span>ความสูง (Height)</span>
                        <span className="font-mono text-amber-300">{currentZoneObj.height} px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="260"
                        value={currentZoneObj.height}
                        onChange={(e) => updateZoneField(selectedZone, 'height', Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}

                  {selectedZone === 'heroBox' && (
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                        <span>ความสูงกล่องชื่อ (Height)</span>
                        <span className="font-mono text-amber-300">{currentZoneObj.heightWithNick} px</span>
                      </div>
                      <input
                        type="range"
                        min="48"
                        max="120"
                        value={currentZoneObj.heightWithNick}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateZoneField('heroBox', 'heightWithNick', val);
                          updateZoneField('heroBox', 'heightNoNick', Math.max(44, val - 16));
                        }}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}
                </div>

                {/* Zone-specific typography & QR controls */}
                {selectedZone === 'callsignPill' && (
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                      <span>ขนาดตัวอักษรนามเรียกขาน (Font Size)</span>
                      <span className="font-mono text-emerald-300">{currentZoneObj.fontSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="9"
                      max="20"
                      step="0.5"
                      value={currentZoneObj.fontSize}
                      onChange={(e) => updateZoneField('callsignPill', 'fontSize', Number(e.target.value))}
                      className="w-full accent-emerald-400"
                    />
                  </div>
                )}

                {selectedZone === 'heroBox' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                        <span>ชื่อ EN</span>
                        <span className="font-mono text-emerald-300">{currentZoneObj.enFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="11"
                        max="22"
                        step="0.5"
                        value={currentZoneObj.enFontSize}
                        onChange={(e) => updateZoneField('heroBox', 'enFontSize', Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                        <span>ชื่อ TH</span>
                        <span className="font-mono text-emerald-300">{currentZoneObj.thFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="18"
                        step="0.5"
                        value={currentZoneObj.thFontSize}
                        onChange={(e) => updateZoneField('heroBox', 'thFontSize', Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                        <span>ชื่อเล่น</span>
                        <span className="font-mono text-emerald-300">{currentZoneObj.nickFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="9"
                        max="16"
                        step="0.5"
                        value={currentZoneObj.nickFontSize}
                        onChange={(e) => updateZoneField('heroBox', 'nickFontSize', Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {selectedZone === 'bottomRow' && (
                  <div className="space-y-3 pt-1 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                          <span>ขนาดรูป QR Code</span>
                          <span className="font-mono text-emerald-300">{currentZoneObj.qrSize} px</span>
                        </div>
                        <input
                          type="range"
                          min="54"
                          max="90"
                          value={currentZoneObj.qrSize}
                          onChange={(e) => updateZoneField('bottomRow', 'qrSize', Number(e.target.value))}
                          className="w-full accent-emerald-400"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                          <span>ขนาดตัวเลขหมู่เลือด</span>
                          <span className="font-mono text-emerald-300">{currentZoneObj.bloodValueFontSize} px</span>
                        </div>
                        <input
                          type="range"
                          min="22"
                          max="46"
                          value={currentZoneObj.bloodValueFontSize}
                          onChange={(e) => updateZoneField('bottomRow', 'bloodValueFontSize', Number(e.target.value))}
                          className="w-full accent-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                          <span>ความกว้างกล่อง QR</span>
                          <span className="font-mono text-cyan-300">{currentZoneObj.qrBoxWidth} px</span>
                        </div>
                        <input
                          type="range"
                          min="84"
                          max="140"
                          value={currentZoneObj.qrBoxWidth}
                          onChange={(e) => updateZoneField('bottomRow', 'qrBoxWidth', Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                          <span>ความกว้างกล่องหมู่เลือด</span>
                          <span className="font-mono text-cyan-300">{currentZoneObj.bloodBoxWidth} px</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="140"
                          value={currentZoneObj.bloodBoxWidth}
                          onChange={(e) => updateZoneField('bottomRow', 'bloodBoxWidth', Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Help Note */}
            <div className="mt-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-3 text-[11px] text-cyan-200 leading-relaxed">
              <strong>📌 ระบบแม่แบบบัตรกลาง (Global Master Template):</strong> เมื่อกดปุ่ม{' '}
              <span className="text-emerald-300 font-bold">"บันทึกเป็นรูปแบบบัตรกลาง"</span> ค่าพิกัดและขนาดทั้งหมดจะถูกนำไปใช้กับบัตรของทุกคนในระบบทันที ทั้งหน้าเว็บ พิมพ์ A4 และการส่งออกไฟล์ PNG 1200×1500 PX
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
