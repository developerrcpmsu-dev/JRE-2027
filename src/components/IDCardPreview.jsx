import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  ZoomIn
} from 'lucide-react';
import { getIdCardQrPayload, getRegistrationCardData } from '../utils/idCard';

const FALLBACK_PHOTO = '/images/logo/jre_logo_square.png';
const BASE_WIDTH = 680;
const BASE_HEIGHT = 428;

function CardField({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5 flex flex-col justify-center ${className}`}>
      <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-tight truncate">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-[11.5px] font-bold leading-tight text-white" title={value}>
        {value || '-'}
      </span>
    </div>
  );
}

export default function IDCardPreview({
  registration,
  compact = false,
  showActions = true,
  user = null,
  onPrint
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' or 'actual'
  const [containerWidth, setContainerWidth] = useState(BASE_WIDTH);

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const cardData = useMemo(() => getRegistrationCardData(registration), [registration]);

  // Responsive container observer for pixel-perfect E2E scaling
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };

    updateWidth();

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect && entry.contentRect.width > 0) {
            setContainerWidth(entry.contentRect.width);
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateWidth);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Generate Admin Universal Scanner QR Code
  useEffect(() => {
    if (!registration) return undefined;
    let cancelled = false;

    QRCode.toDataURL(getIdCardQrPayload(registration), {
      width: 360,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((error) => console.error('JRE ID card QR generation error:', error));

    return () => {
      cancelled = true;
    };
  }, [registration]);

  if (!registration) return null;

  const photo = cardData.photo || user?.avatar || FALLBACK_PHOTO;

  // Proportional scale calculation
  const effectiveBaseWidth = compact ? Math.min(BASE_WIDTH, 620) : BASE_WIDTH;
  const effectiveBaseHeight = Math.round(effectiveBaseWidth / 1.5857);
  const scale = Math.min(1, Math.max(0.3, containerWidth / effectiveBaseWidth));
  const scaledWidth = Math.round(effectiveBaseWidth * scale);
  const scaledHeight = Math.round(effectiveBaseHeight * scale);

  const thaiNameLen = (cardData.thaiName || '').length;
  const thaiNameClass = thaiNameLen > 38 
    ? 'text-[14px]' 
    : thaiNameLen > 28 
    ? 'text-[16px]' 
    : thaiNameLen > 20 
    ? 'text-[18px]' 
    : 'text-[20px]';

  const enNameLen = (cardData.englishName || '').length;
  const enNameClass = enNameLen > 40
    ? 'text-[11px]'
    : enNameLen > 28
    ? 'text-[12px]'
    : 'text-[13px]';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cardData.cardCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.warn('Copy ID card code failed:', error);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${cardData.cardCode}-admin-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current || isDownloadingCard) return;

    setIsDownloadingCard(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#07172f',
        scale: 3, // Ultra HD 3x resolution for crisp physical badge printing
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        onclone: (clonedDoc, clonedElement) => {
          // Reset transform in the cloned DOM snapshot so it renders at pristine 680x428
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'static';
          clonedElement.style.width = `${effectiveBaseWidth}px`;
          clonedElement.style.height = `${effectiveBaseHeight}px`;
          clonedElement.style.margin = '0';
        }
      });

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Unable to create PNG blob'));
        }, 'image/png');
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${cardData.cardCode}-id-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('JRE full ID card PNG export failed:', error);
      window.alert('บันทึกภาพบัตรไม่สำเร็จ กรุณารอให้รูปและ QR โหลดเสร็จ แล้วลองใหม่อีกครั้ง');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const hasCallsign = cardData.callsign && cardData.callsign !== '-';
  const hasNickname = cardData.nickname && cardData.nickname !== '-';

  return (
    <div className="jre-id-card-print-root w-full min-w-0">
      {/* High-Fidelity Print Stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .jre-id-card-scale-wrapper {
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          .jre-id-card {
            position: static !important;
            transform: none !important;
            width: ${effectiveBaseWidth}px !important;
            height: ${effectiveBaseHeight}px !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Action Toolbar */}
      {showActions && (
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">Digital ID Card</p>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                Online Sync
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">บัตรจริงเชื่อมกับข้อมูลใบสมัครของบุคคลนี้โดยตรง (CR80 Standard)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile Zoom Mode Toggle (shown when screen width < effectiveBaseWidth) */}
            {scale < 0.98 && (
              <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/90 p-0.5 text-[11px] font-bold shadow-sm">
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    zoomMode === 'fit'
                      ? 'bg-orange-500 text-slate-950 font-black shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="ย่อให้พอดีหน้าจอโทรศัพท์"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>พอดีจอ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('actual')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    zoomMode === 'actual'
                      ? 'bg-orange-500 text-slate-950 font-black shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="ดูขนาดจริง 100% (สามารถเลื่อนแนวนอนเพื่อตรวจดูรายละเอียด)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>100%</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-200 transition-colors hover:border-orange-400/60 hover:text-orange-300 cursor-pointer"
              title="คัดลอกรหัสประจำตัว"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'คัดลอกแล้ว' : cardData.cardCode}
            </button>

            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isDownloadingCard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-[11px] font-bold text-orange-200 transition-colors hover:bg-orange-500/20 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
              title="ดาวน์โหลดบัตรเป็นรูปภาพความละเอียดสูง (.png)"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloadingCard ? 'กำลังสร้าง PNG…' : 'บัตร PNG'}
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-200 transition-colors hover:bg-sky-500/20 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
              title="ดาวน์โหลด QR Code สำหรับ Admin สแกน"
            >
              <Download className="h-3.5 w-3.5" />
              QR
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-[11px] font-black text-slate-950 shadow-lg shadow-orange-500/20 transition-transform hover:from-orange-400 hover:to-amber-400 active:scale-95 cursor-pointer"
              title="สั่งพิมพ์หรือบันทึกเป็น PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์ / PDF
            </button>
          </div>
        </div>
      )}

      {/* Main Card Viewport */}
      <div ref={containerRef} className="w-full min-w-0 pb-1">
        {zoomMode === 'fit' ? (
          <div
            className="jre-id-card-scale-wrapper relative mx-auto overflow-hidden flex items-center justify-center"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              maxWidth: '100%'
            }}
          >
            <div
              ref={cardRef}
              style={{
                width: `${effectiveBaseWidth}px`,
                height: `${effectiveBaseHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              className="jre-id-card relative shrink-0 overflow-hidden rounded-[20px] border border-slate-600/80 bg-[#07172f] shadow-2xl shadow-black/40 select-none"
            >
              <CardInnerContent
                photo={photo}
                cardData={cardData}
                qrDataUrl={qrDataUrl}
                thaiNameClass={thaiNameClass}
                enNameClass={enNameClass}
                hasCallsign={hasCallsign}
                hasNickname={hasNickname}
              />
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-3 pt-1 scrollbar-thin">
            <div className="flex justify-start sm:justify-center min-w-fit px-1">
              <div
                ref={cardRef}
                style={{
                  width: `${effectiveBaseWidth}px`,
                  height: `${effectiveBaseHeight}px`
                }}
                className="jre-id-card relative shrink-0 overflow-hidden rounded-[20px] border border-slate-600/80 bg-[#07172f] shadow-2xl shadow-black/40 select-none"
              >
                <CardInnerContent
                  photo={photo}
                  cardData={cardData}
                  qrDataUrl={qrDataUrl}
                  thaiNameClass={thaiNameClass}
                  enNameClass={enNameClass}
                  hasCallsign={hasCallsign}
                  hasNickname={hasNickname}
                />
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              💡 เลื่อนซ้าย-ขวาเพื่อตรวจสอบรายละเอียดขนาดเต็ม 100% หรือกดปุ่ม <strong>"พอดีจอ"</strong> ด้านบนเพื่อย่อให้พอดีกับโทรศัพท์
            </p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="no-print mt-2 flex items-center gap-2 text-[10.5px] text-slate-400">
          <QrCode className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          <span>QR Code นี้เป็นมาตรฐานสำหรับระบบสแกนผู้ดูแลระบบ (Universal Scanner) เพื่อเช็คชื่อ ตรวจบัตร และส่งมอบเสื้อฝึก</span>
        </div>
      )}
    </div>
  );
}

// Dedicated Subcomponent with Guaranteed Absolute Spatial Integrity
function CardInnerContent({
  photo,
  cardData,
  qrDataUrl,
  thaiNameClass,
  enNameClass,
  hasCallsign,
  hasNickname
}) {
  return (
    <>
      {/* Background Decorative Ambient Lighting */}
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header Banner (Exact Official JRE Banner) */}
        <div className="relative h-[68px] shrink-0 overflow-hidden bg-white px-4 py-2">
          <img
            src="/images/logo/jre_header_banner.png"
            alt="Joint Response Exercise JRE 2027"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        </div>

        {/* Card Body Container */}
        <div className="flex flex-1 flex-col justify-between px-6 pb-4 pt-3.5">
          {/* Section 1: Upper Profile & Identification Area */}
          <div className="flex h-[142px] items-start gap-4">
            {/* Participant Photo */}
            <div className="relative h-[138px] w-[110px] shrink-0 overflow-hidden rounded-xl border-2 border-orange-400/80 bg-slate-900 shadow-xl shadow-black/30">
              <img
                src={photo}
                alt={`รูปประจำตัว ${cardData.thaiName}`}
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_PHOTO;
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1 py-1 text-center text-[8.5px] font-black tracking-[0.14em] text-orange-300">
                PARTICIPANT
              </div>
            </div>

            {/* Profile Info & Names */}
            <div className="min-w-0 flex-1 flex flex-col justify-between h-[138px]">
              <div>
                {/* Organization & Project Header */}
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo/jre_logo_square.png"
                    alt="USIVN"
                    className="h-8 w-8 shrink-0 rounded-lg border border-orange-400/40 bg-white object-contain p-0.5"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-orange-300">
                      USIVN • JRE 2027
                    </p>
                    <p className="truncate text-[8px] font-medium text-slate-400">
                      JOINT RESPONSE EXERCISE
                    </p>
                  </div>
                </div>

                {/* Trainee Full Name Header */}
                <div className="mt-1.5 min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    ชื่อ–สกุล / Full name
                  </p>
                  <h2
                    className={`mt-0.5 font-black leading-tight text-white truncate ${thaiNameClass}`}
                    title={cardData.thaiName}
                  >
                    {cardData.thaiName}
                  </h2>
                  <p
                    className={`mt-0.5 font-semibold leading-tight text-orange-300 truncate ${enNameClass}`}
                    title={cardData.englishName}
                  >
                    {cardData.englishName}
                  </p>
                </div>
              </div>

              {/* Callsign & Nickname Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {hasCallsign && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[9.5px] font-black font-mono text-sky-200">
                    📡 {cardData.callsign}
                  </span>
                )}
                {hasNickname && (
                  <span className="inline-flex items-center rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-bold text-amber-200 truncate max-w-[200px]" title={cardData.nickname}>
                    Nickname: {cardData.nickname}
                  </span>
                )}
              </div>
            </div>

            {/* Official Badge & Badge ID (Right Column) */}
            <div className="flex h-[138px] w-[120px] shrink-0 flex-col items-end justify-between text-right">
              <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-[8.5px] font-black tracking-[0.16em] text-orange-300">
                OFFICIAL
              </span>
              <div className="w-full">
                <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Badge ID</p>
                <p className="mt-0.5 break-all text-[11px] font-black font-mono text-white tracking-wider">
                  {cardData.cardCode}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Lower Credential Grid, QR Code & Blood Group Area */}
          <div className="mt-2.5 flex items-stretch gap-3 border-t border-white/10 pt-2.5">
            {/* 5-Field Detail Grid */}
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
              <CardField label="คำนำหน้า / Prefix" value={cardData.prefix} />
              <CardField label="ชื่อ / First name" value={cardData.firstName} />
              <CardField label="สกุล / Last name" value={cardData.lastName} />
              <CardField label="หน่วย / Unit" value={cardData.unit} />
              <CardField label="สังกัด / Affiliation" value={cardData.affiliation} className="col-span-2" />
            </div>

            {/* QR Code for Admin Universal Scanner */}
            <div className="flex w-[88px] shrink-0 flex-col items-center justify-between">
              <div className="relative w-full rounded-xl bg-white p-1.5 shadow-lg flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code สำหรับ Admin สแกน"
                    className="aspect-square w-full object-contain"
                  />
                ) : (
                  <div className="aspect-square w-full animate-pulse rounded bg-slate-200" />
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[8px] font-black tracking-[0.12em] text-orange-300 whitespace-nowrap">
                <QrCode className="h-2.5 w-2.5 shrink-0" />
                ADMIN QR SCAN
              </div>
            </div>

            {/* Blood Type Badge & Verified Tag */}
            <div className="flex w-[74px] shrink-0 flex-col justify-between">
              <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-1.5 py-1.5 text-center flex-1 flex flex-col justify-center">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-rose-200">Blood type</span>
                <strong className="mt-0.5 block text-[24px] font-black leading-none text-white">
                  {cardData.bloodGroup}
                </strong>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-[8.5px] font-bold text-emerald-300 whitespace-nowrap">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                VERIFIED
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
