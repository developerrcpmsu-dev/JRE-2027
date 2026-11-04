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
    <div className={`min-w-0 rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5 flex flex-col justify-center overflow-hidden ${className}`}>
      <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-normal whitespace-nowrap">
        {label}
      </span>
      <span className="mt-0.5 block text-[11.5px] font-bold leading-normal text-white whitespace-nowrap" title={value}>
        {value || '-'}
      </span>
    </div>
  );
}

function loadCanvasImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawImageContain(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;
  const scale = Math.min(w / img.width, h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function drawImageCover(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;
  const scale = Math.max(w / img.width, h / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function fitTextWithEllipsis(ctx, text, maxWidth) {
  const str = String(text || '-');
  if (ctx.measureText(str).width <= maxWidth) return str;
  let cut = str;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

async function renderNativeIdCardCanvas({ photo, cardData, qrDataUrl }) {
  const scale = 3;
  const W = BASE_WIDTH;
  const H = BASE_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const [bannerImg, logoImg, userImg, fallbackImg, qrImg] = await Promise.all([
    loadCanvasImage('/images/logo/jre_header_banner.png'),
    loadCanvasImage('/images/logo/jre_logo_square.png'),
    loadCanvasImage(photo),
    loadCanvasImage(FALLBACK_PHOTO),
    loadCanvasImage(qrDataUrl)
  ]);

  const portraitImg = userImg || fallbackImg || logoImg;
  const fontStack = '"Prompt", "Kanit", "Sarabun", "Noto Sans Thai", system-ui, -apple-system, sans-serif';
  const monoStack = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  // 1. Card Outer Clip & Navy Background
  ctx.save();
  drawRoundedRectPath(ctx, 0, 0, W, H, 20);
  ctx.clip();

  ctx.fillStyle = '#07172f';
  ctx.fillRect(0, 0, W, H);

  // Subtle Ambient Glows
  const topGlow = ctx.createRadialGradient(W - 40, 20, 10, W - 40, 20, 180);
  topGlow.addColorStop(0, 'rgba(249, 115, 22, 0.14)');
  topGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H);

  const bottomGlow = ctx.createRadialGradient(40, H - 20, 10, 40, H - 20, 180);
  bottomGlow.addColorStop(0, 'rgba(14, 165, 233, 0.14)');
  bottomGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, W, H);

  // 2. Top White Header Banner (Height 68px) with Aspect-Ratio Contain
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, 68);
  if (bannerImg) {
    drawImageContain(ctx, bannerImg, 16, 6, W - 32, 54);
  }
  const headerLineGrad = ctx.createLinearGradient(0, 64, W, 64);
  headerLineGrad.addColorStop(0, '#f97316');
  headerLineGrad.addColorStop(0.5, '#fbbf24');
  headerLineGrad.addColorStop(1, '#f97316');
  ctx.fillStyle = headerLineGrad;
  ctx.fillRect(0, 64, W, 4);

  // 3. Participant Portrait Photo (x=24, y=82, w=110, h=138)
  const px = 24;
  const py = 82;
  const pw = 110;
  const ph = 138;
  ctx.save();
  drawRoundedRectPath(ctx, px, py, pw, ph, 12);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.clip();
  if (portraitImg) {
    drawImageCover(ctx, portraitImg, px, py, pw, ph);
  }
  // Bottom Role Label Bar inside Photo
  ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
  ctx.fillRect(px, py + ph - 22, pw, 22);
  ctx.fillStyle = cardData.isStaff ? '#fde047' : '#fdba74';
  ctx.font = `900 8px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cardData.roleBadge || 'PARTICIPANT', px + pw / 2, py + ph - 11);
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, px, py, pw, ph, 12);
  ctx.strokeStyle = cardData.isStaff ? 'rgba(250, 204, 21, 0.85)' : 'rgba(251, 146, 60, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 4. Middle Profile Info & Names (x=150, y=82, maxW=375)
  const mx = 150;
  const maxMiddleW = 375;

  // Small USIVN Square Logo
  ctx.save();
  drawRoundedRectPath(ctx, mx, 82, 32, 32, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (logoImg) {
    drawImageContain(ctx, logoImg, mx + 2, 84, 28, 28);
  }
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fdba74';
  ctx.font = `900 9.5px ${fontStack}`;
  ctx.fillText('USIVN • JRE 2027', mx + 40, 92);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 8px ${fontStack}`;
  ctx.fillText('JOINT RESPONSE EXERCISE', mx + 40, 105);

  // Label: ชื่อ–สกุล / FULL NAME
  ctx.fillStyle = '#94a3b8';
  ctx.font = `700 8.5px ${fontStack}`;
  ctx.fillText('ชื่อ–สกุล / FULL NAME', mx, 127);

  // Thai Full Name (auto-fit font size)
  let thaiFontSize = 19;
  ctx.font = `900 ${thaiFontSize}px ${fontStack}`;
  while (thaiFontSize > 13 && ctx.measureText(cardData.thaiName || '').width > maxMiddleW) {
    thaiFontSize -= 1;
    ctx.font = `900 ${thaiFontSize}px ${fontStack}`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(fitTextWithEllipsis(ctx, cardData.thaiName, maxMiddleW), mx, 148);

  // English Full Name
  let enFontSize = 12.5;
  ctx.font = `600 ${enFontSize}px ${fontStack}`;
  while (enFontSize > 10 && ctx.measureText(cardData.englishName || '').width > maxMiddleW) {
    enFontSize -= 0.5;
    ctx.font = `600 ${enFontSize}px ${fontStack}`;
  }
  ctx.fillStyle = '#fdba74';
  ctx.fillText(fitTextWithEllipsis(ctx, cardData.englishName, maxMiddleW), mx, 170);

  // Callsign & Nickname Pills (y=194, height=24)
  let pillX = mx;
  const pillY = 194;
  const pillH = 24;
  if (cardData.callsign && cardData.callsign !== '-') {
    const csText = `📡 ${cardData.callsign}`;
    ctx.font = `900 9.5px ${monoStack}`;
    const csW = Math.ceil(ctx.measureText(csText).width) + 18;
    ctx.save();
    drawRoundedRectPath(ctx, pillX, pillY, csW, pillH, 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#bae6fd';
    ctx.textBaseline = 'middle';
    ctx.fillText(csText, pillX + 9, pillY + pillH / 2);
    ctx.restore();
    pillX += csW + 8;
  }

  if (cardData.nickname && cardData.nickname !== '-') {
    const nnText = `Nickname: ${cardData.nickname}`;
    ctx.font = `700 9.5px ${fontStack}`;
    const maxNnW = Math.max(90, maxMiddleW - (pillX - mx));
    const fittedNn = fitTextWithEllipsis(ctx, nnText, maxNnW - 18);
    const nnW = Math.ceil(ctx.measureText(fittedNn).width) + 18;
    ctx.save();
    drawRoundedRectPath(ctx, pillX, pillY, nnW, pillH, 6);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.textBaseline = 'middle';
    ctx.fillText(fittedNn, pillX + 9, pillY + pillH / 2);
    ctx.restore();
  }

  // 5. Right Column: OFFICIAL Badge & Badge ID
  const rx = W - 24;
  ctx.save();
  const offW = 72;
  const offH = 24;
  drawRoundedRectPath(ctx, rx - offW, 82, offW, offH, 12);
  ctx.fillStyle = 'rgba(251, 146, 60, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#fdba74';
  ctx.font = `900 8.5px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICIAL', rx - offW / 2, 82 + offH / 2);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `700 8px ${fontStack}`;
  ctx.fillText('BADGE ID', rx, 196);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 11px ${monoStack}`;
  ctx.fillText(cardData.cardCode || '-', rx, 212);

  // 6. Divider Line (y=234)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 234);
  ctx.lineTo(W - 24, 234);
  ctx.stroke();

  // 7. Lower 5-Field Grid (x=24, y=246, w=444, h=158)
  const gx = 24;
  const gy = 246;
  const colGap = 8;
  const rowGap = 8;
  const colW = (444 - colGap) / 2; // 218px
  const rowH = 47;

  const drawFieldBox = (bx, by, bw, bh, label, value) => {
    ctx.save();
    drawRoundedRectPath(ctx, bx, by, bw, bh, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 8.5px ${fontStack}`;
    ctx.fillText(label.toUpperCase(), bx + 10, by + 15);

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 11.5px ${fontStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, value || '-', bw - 20), bx + 10, by + 33);
    ctx.restore();
  };

  drawFieldBox(gx, gy, colW, rowH, 'คำนำหน้า / Prefix', cardData.prefix);
  drawFieldBox(gx + colW + colGap, gy, colW, rowH, 'ชื่อ / First name', cardData.firstName);
  drawFieldBox(gx, gy + rowH + rowGap, colW, rowH, 'สกุล / Last name', cardData.lastName);
  drawFieldBox(gx + colW + colGap, gy + rowH + rowGap, colW, rowH, 'หน่วย / Unit', cardData.unit);
  drawFieldBox(gx, gy + (rowH + rowGap) * 2, 444, rowH, 'สังกัด / Affiliation', cardData.affiliation);

  // 8. QR Code Column (x=480, y=246, w=88)
  const qx = 480;
  const qy = 246;
  const qw = 88;
  ctx.save();
  drawRoundedRectPath(ctx, qx, qy, qw, qw, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (qrImg) {
    drawImageContain(ctx, qrImg, qx + 5, qy + 5, qw - 10, qw - 10);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fdba74';
  ctx.font = `900 8px ${fontStack}`;
  ctx.fillText('ADMIN QR SCAN', qx + qw / 2, gy + 148);

  // 9. Blood Type & Verified Column (x=580, y=246, w=76)
  const bx = 580;
  const by = 246;
  const bw = 76;
  const bh = 132;
  ctx.save();
  drawRoundedRectPath(ctx, bx, by, bw, bh, 12);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fecdd3';
  ctx.font = `700 8px ${fontStack}`;
  ctx.fillText('BLOOD TYPE', bx + bw / 2, by + 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 24px ${fontStack}`;
  ctx.fillText(cardData.bloodGroup || '-', bx + bw / 2, by + 76);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6ee7b7';
  ctx.font = `700 8.5px ${fontStack}`;
  ctx.fillText('✓ VERIFIED', bx + bw / 2, gy + 148);

  // 10. Bottom Accent Gradient Line & Outer Border
  const bottomLineGrad = ctx.createLinearGradient(0, H - 4, W, H - 4);
  bottomLineGrad.addColorStop(0, '#f97316');
  bottomLineGrad.addColorStop(0.5, '#fbbf24');
  bottomLineGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = bottomLineGrad;
  ctx.fillRect(0, H - 4, W, 4);

  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, 0.5, 0.5, W - 1, H - 1, 20);
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  return canvas;
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
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.min(BASE_WIDTH, Math.max(260, window.innerWidth - 32));
    }
    return BASE_WIDTH;
  });

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
            setContainerWidth(Math.floor(entry.contentRect.width));
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
    if (isDownloadingCard) return;

    setIsDownloadingCard(true);
    try {
      const canvas = await renderNativeIdCardCanvas({
        photo,
        cardData,
        qrDataUrl
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
      window.alert('บันทึกภาพบัตรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const hasCallsign = cardData.callsign && cardData.callsign !== '-';
  const hasNickname = cardData.nickname && cardData.nickname !== '-';

  return (
    <div className="jre-id-card-print-root w-full min-w-0 overflow-hidden">
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
              <div className={`absolute inset-x-0 bottom-0 bg-slate-950/90 px-1 py-1 text-center text-[8px] font-black tracking-[0.1em] ${cardData.isStaff ? 'text-yellow-300' : 'text-orange-300'}`}>
                {cardData.roleBadge || 'PARTICIPANT'}
              </div>
            </div>

            {/* Profile Info & Names */}
            <div className="min-w-0 flex-1 flex flex-col justify-between h-[138px] overflow-hidden">
              <div>
                {/* Organization & Project Header */}
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo/jre_logo_square.png"
                    alt="USIVN"
                    className="h-8 w-8 shrink-0 rounded-lg border border-orange-400/40 bg-white object-contain p-0.5"
                  />
                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.2em] text-orange-300 leading-normal">
                      USIVN • JRE 2027
                    </p>
                    <p className="whitespace-nowrap text-[8px] font-medium text-slate-400 leading-normal">
                      JOINT RESPONSE EXERCISE
                    </p>
                  </div>
                </div>

                {/* Trainee Full Name Header */}
                <div className="mt-1 min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 leading-normal">
                    ชื่อ–สกุล / Full name
                  </p>
                  <h2
                    className={`mt-0.5 font-black leading-normal text-white whitespace-nowrap ${thaiNameClass}`}
                    title={cardData.thaiName}
                  >
                    {cardData.thaiName}
                  </h2>
                  <p
                    className={`mt-0.5 font-semibold leading-normal text-orange-300 whitespace-nowrap ${enNameClass}`}
                    title={cardData.englishName}
                  >
                    {cardData.englishName}
                  </p>
                </div>
              </div>

              {/* Callsign & Nickname Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {hasCallsign && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[9.5px] font-black font-mono text-sky-200 leading-normal">
                    📡 {cardData.callsign}
                  </span>
                )}
                {hasNickname && (
                  <span className="inline-flex items-center rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-bold text-amber-200 whitespace-nowrap leading-normal" title={cardData.nickname}>
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
