import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  Printer,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { getIdCardQrPayload, getRegistrationCardData } from '../utils/idCard';

const FALLBACK_PHOTO = '/images/logo/jre_logo_square.png';

function CardField({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 rounded-lg border border-white/10 bg-white/[0.055] px-2 py-1.5 ${className}`}>
      <span className="block text-[8px] font-semibold uppercase tracking-wide text-slate-400 leading-tight">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-[10px] font-bold leading-tight text-white" title={value}>
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
  const cardRef = useRef(null);
  const cardData = useMemo(() => getRegistrationCardData(registration), [registration]);

  useEffect(() => {
    if (!registration) return undefined;
    let cancelled = false;

    QRCode.toDataURL(getIdCardQrPayload(registration), {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0b1f3a',
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
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false
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

  return (
    <div className="jre-id-card-print-root w-full">
      {showActions && (
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">Digital ID Card</p>
            <p className="mt-0.5 text-[11px] text-slate-400">บัตรจริงเชื่อมกับข้อมูลใบสมัครของบุคคลนี้โดยตรง</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-200 transition-colors hover:border-orange-400/60 hover:text-orange-300"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'คัดลอกแล้ว' : cardData.cardCode}
            </button>
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isDownloadingCard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-[11px] font-bold text-orange-200 transition-colors hover:bg-orange-500/20 disabled:cursor-wait disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloadingCard ? 'กำลังสร้าง PNG…' : 'บัตร PNG'}
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-200 transition-colors hover:bg-sky-500/20 disabled:cursor-wait disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              QR
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-[11px] font-black text-slate-950 shadow-lg shadow-orange-500/20 transition-transform hover:from-orange-400 hover:to-amber-400 active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์ / PDF
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div
          ref={cardRef}
          className={`jre-id-card relative aspect-[1.585/1] w-full min-w-[520px] overflow-hidden rounded-[22px] border border-slate-600/80 bg-[#07172f] shadow-2xl shadow-black/40 ${compact ? 'max-w-[650px]' : 'max-w-[760px]'}`}
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

          <div className="relative z-10 flex h-full flex-col">
            <div className="relative h-[18%] shrink-0 overflow-hidden bg-white px-[3%] py-[1.3%]">
              <img
                src="/images/logo/jre_header_banner.png"
                alt="Joint Response Exercise JRE 2027"
                className="h-full w-full object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-[4%] pb-[4%] pt-[3%]">
              <div className="flex min-h-0 h-[46%] items-start gap-[3%]">
                <div className="relative aspect-[4/5] h-full shrink-0 overflow-hidden rounded-xl border-2 border-orange-400/80 bg-slate-900 shadow-xl shadow-black/30">
                  <img
                    src={photo}
                    alt={`รูปประจำตัว ${cardData.thaiName}`}
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_PHOTO;
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-1 py-1 text-center text-[8px] font-black tracking-[0.14em] text-orange-300">
                    PARTICIPANT
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <img
                      src="/images/logo/jre_logo_square.png"
                      alt="USIVN"
                      className="h-9 w-9 shrink-0 rounded-lg border border-orange-400/40 bg-white object-contain p-0.5"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-orange-300">USIVN • JRE 2027</p>
                      <p className="truncate text-[8px] font-medium text-slate-400">JOINT RESPONSE EXERCISE</p>
                    </div>
                  </div>

                  <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">ชื่อ–สกุล / Full name</p>
                  <h2 className="mt-0.5 truncate text-[clamp(16px,2.6vw,28px)] font-black leading-tight text-white" title={cardData.thaiName}>
                    {cardData.thaiName}
                  </h2>
                  <p className="mt-1 truncate text-[clamp(9px,1.25vw,14px)] font-semibold leading-tight text-orange-300" title={cardData.englishName}>
                    {cardData.englishName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[9px] font-black font-mono text-sky-200">
                      📡 {cardData.callsign}
                    </span>
                    <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[9px] font-bold text-amber-200">
                      Nickname: {cardData.nickname}
                    </span>
                  </div>
                </div>

                <div className="flex h-full w-[19%] shrink-0 flex-col items-end justify-between text-right">
                  <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-2 py-1 text-[8px] font-black tracking-[0.16em] text-orange-300">
                    OFFICIAL
                  </span>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Badge ID</p>
                    <p className="mt-0.5 break-all text-[9px] font-black font-mono text-white">{cardData.cardCode}</p>
                  </div>
                </div>
              </div>

              <div className="mt-[3%] flex min-h-0 flex-1 gap-[3%] border-t border-white/10 pt-[3%]">
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
                  <CardField label="คำนำหน้า / Prefix" value={cardData.prefix} />
                  <CardField label="ชื่อ / First name" value={cardData.firstName} />
                  <CardField label="สกุล / Last name" value={cardData.lastName} />
                  <CardField label="หน่วย / Unit" value={cardData.unit} />
                  <CardField label="สังกัด / Affiliation" value={cardData.affiliation} className="col-span-2" />
                </div>

                <div className="flex w-[18%] shrink-0 flex-col items-center justify-end gap-1">
                  <div className="relative w-full rounded-lg bg-white p-1 shadow-lg">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Barcode สำหรับ Admin สแกน" className="aspect-square w-full" />
                    ) : (
                      <div className="aspect-square w-full animate-pulse rounded bg-slate-200" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black tracking-[0.12em] text-orange-300">
                    <QrCode className="h-2.5 w-2.5" />
                    ADMIN SCAN
                  </div>
                </div>

                <div className="flex w-[13%] shrink-0 flex-col justify-end gap-1.5">
                  <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-2 py-1.5 text-center">
                    <span className="block text-[8px] font-bold uppercase tracking-wide text-rose-200">Blood type</span>
                    <strong className="mt-0.5 block text-[clamp(16px,2.4vw,26px)] font-black leading-none text-white">{cardData.bloodGroup}</strong>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    VERIFIED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="no-print mt-2 flex items-center gap-2 text-[10px] text-slate-500">
          <QrCode className="h-3 w-3 text-orange-400" />
          QR/Barcode นี้เก็บเฉพาะรหัสอ้างอิง และต้องสแกนจากหน้าผู้ดูแลระบบเพื่อดูข้อมูลละเอียด
        </div>
      )}
    </div>
  );
}
