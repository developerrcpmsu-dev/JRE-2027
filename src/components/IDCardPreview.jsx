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
  ZoomIn,
  CreditCard,
  Layers,
  RotateCw,
  Scissors,
  Droplet,
  Sparkles,
  Radio,
  Edit3
} from 'lucide-react';
import { printWithDocumentTitle } from '../utils/documentExporters';
import { getIdCardQrPayload, getRegistrationCardData } from '../utils/idCard';
import {
  getMasterCardLayout,
  mergeMasterCardLayout,
  MASTER_LAYOUT_EVENT
} from '../utils/idCardLayoutConfig';

export function useMasterCardLayout(overrideConfig = null) {
  const [savedLayout, setSavedLayout] = useState(() => getMasterCardLayout());

  useEffect(() => {
    const handleUpdate = (event) => {
      setSavedLayout(mergeMasterCardLayout(event?.detail || getMasterCardLayout()));
    };
    window.addEventListener(MASTER_LAYOUT_EVENT, handleUpdate);
    return () => window.removeEventListener(MASTER_LAYOUT_EVENT, handleUpdate);
  }, []);

  return useMemo(
    () => (overrideConfig ? mergeMasterCardLayout(overrideConfig) : savedLayout),
    [overrideConfig, savedLayout]
  );
}

export const FALLBACK_PHOTO = '/images/logo/jre_logo_square.png';
export const BADGE_BACK_IMAGE = '/images/logo/jre_badge_back.png';

// Coordinate dimensions:
// 1. Portrait (1200 x 1500 px standard, base 480 x 600 px with 2.5x canvas scale)
export const PORTRAIT_BASE_WIDTH = 480;
export const PORTRAIT_BASE_HEIGHT = 600;

// 2. Landscape (CR80 standard, base 680 x 428 px with 3x canvas scale)
export const LANDSCAPE_BASE_WIDTH = 680;
export const LANDSCAPE_BASE_HEIGHT = 428;

function CardField({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5 flex flex-col justify-center overflow-hidden ${className}`}>
      <span className="block text-[8.5px] font-semibold uppercase tracking-wider text-slate-400 leading-normal whitespace-nowrap">
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

export function formatSingleBadgeCallsign(rawCallsign, isDev, isStaff) {
  let str = String(rawCallsign || '').trim();
  if (!str || str === '-') {
    if (isDev) return 'DEVRCPMSU';
    if (isStaff) return 'ORGANIZING STAFF';
    return 'JRE 2027';
  }

  // Remove any pre-existing duplicate tags like (STAFF), (DEVRCPMSU), (DEV), etc.
  str = str.replace(/\s*\((?:staff|dev|devrcpmsu|คณะทำงาน)\)/gi, '').trim();

  if (isDev) {
    return `${str} (DEVRCPMSU)`;
  }
  if (isStaff) {
    return `${str} (STAFF)`;
  }
  return str;
}

/**
 * Universal Native ID Card Canvas Generator (FRONT SIDE)
 * Supports:
 * - 'portrait'  -> Exactly 1200 x 1500 PX (CR100 Portrait Standard)
 * - 'landscape' -> 2040 x 1284 PX (CR80 Landscape Standard)
 */
export async function renderNativeIdCardCanvas({
  photo,
  cardData,
  qrDataUrl,
  orientation = 'portrait',
  layoutConfig = null
}) {
  const isPortrait = orientation === 'portrait';
  const W = isPortrait ? PORTRAIT_BASE_WIDTH : LANDSCAPE_BASE_WIDTH;
  const H = isPortrait ? PORTRAIT_BASE_HEIGHT : LANDSCAPE_BASE_HEIGHT;
  const scale = isPortrait ? 2.5 : 3; // 480*2.5 = 1200, 600*2.5 = 1500
  const L = mergeMasterCardLayout(layoutConfig || getMasterCardLayout());

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);

  const [shieldImg, fourLogosImg, logoImg, userImg, fallbackImg, qrImg] = await Promise.all([
    loadCanvasImage('/images/logo/jre_shield_transparent.png'),
    loadCanvasImage('/images/logo/jre_four_logos_hd.png'),
    loadCanvasImage('/images/logo/jre_logo_square.png'),
    loadCanvasImage(photo),
    loadCanvasImage(FALLBACK_PHOTO),
    loadCanvasImage(qrDataUrl)
  ]);

  const portraitImg = userImg || fallbackImg || logoImg;
  const fontStack = '"Prompt", "Kanit", "Sarabun", "Noto Sans Thai", system-ui, -apple-system, sans-serif';
  const monoStack = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  if (isPortrait) {
    // ==========================================
    // PORTRAIT: 1200 x 1500 PX (BASE 480 x 600)
    // Driven by Master Card Layout Config (L)
    // ==========================================
    const isDev = Boolean(cardData?.isDev || cardData?.badgeRole === 'DEV');
    const isStaff = !isDev && Boolean(cardData?.isStaff || cardData?.badgeRole === 'STAFF');

    ctx.save();
    drawRoundedRectPath(ctx, 0, 0, W, H, 22);
    ctx.clip();

    // 1. Background Dark Navy
    ctx.fillStyle = '#07172f';
    ctx.fillRect(0, 0, W, H);

    // Dynamic Ambient Glows (Purple/Cyan for DEV, Amber for Staff, Blue for Participant)
    const topGlow = ctx.createRadialGradient(W - 40, 40, 10, W - 40, 40, 240);
    topGlow.addColorStop(0, isDev ? 'rgba(168, 85, 247, 0.22)' : isStaff ? 'rgba(245, 158, 11, 0.20)' : 'rgba(14, 165, 233, 0.18)');
    topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H);

    const bottomGlow = ctx.createRadialGradient(40, H - 40, 10, 40, H - 40, 240);
    bottomGlow.addColorStop(0, isDev ? 'rgba(6, 182, 212, 0.20)' : isStaff ? 'rgba(234, 88, 12, 0.18)' : 'rgba(29, 78, 216, 0.22)');
    bottomGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, W, H);

    // 3D Fluid Curved Graphic Elements (matching event Canva poster aesthetic)
    ctx.save();
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = isDev ? '#a855f7' : isStaff ? '#f59e0b' : '#f97316';
    ctx.beginPath();
    ctx.moveTo(-30, 90);
    ctx.quadraticCurveTo(80, 180, -20, 310);
    ctx.stroke();

    ctx.strokeStyle = isDev ? '#06b6d4' : isStaff ? '#ea580c' : '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(510, 110);
    ctx.quadraticCurveTo(400, 230, 490, 370);
    ctx.stroke();
    ctx.restore();

    // 2. Top Header Banner (Native Vector Text + High-Res Proportional Logos, zero squishing!)
    const hb = L.headerBanner;
    ctx.save();
    ctx.beginPath();
    ctx.rect(hb.x, hb.y, hb.width, hb.height);
    ctx.clip();

    const headerGrad = ctx.createLinearGradient(hb.x, hb.y, hb.x + hb.width, hb.y + hb.height);
    headerGrad.addColorStop(0, '#132a4f');
    headerGrad.addColorStop(0.55, '#0e3666');
    headerGrad.addColorStop(1, '#262b44');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(hb.x, hb.y, hb.width, hb.height);

    // Subtle warm ambient glow on right of header (matching Canva design)
    const hdrGlow = ctx.createRadialGradient(
      hb.x + hb.width - 90,
      hb.y + 18,
      6,
      hb.x + hb.width - 90,
      hb.y + 18,
      140
    );
    hdrGlow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
    hdrGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = hdrGlow;
    ctx.fillRect(hb.x, hb.y, hb.width, hb.height);

    // Left: High-Res USIVN Shield (proportional contain, never squished)
    const shieldH = Math.max(36, Math.round(hb.height * 0.78));
    const shieldW = Math.round(shieldH * (500 / 640));
    const shieldX = hb.x + 14;
    const shieldY = hb.y + Math.round((hb.height - shieldH) / 2);
    if (shieldImg || logoImg) {
      drawImageContain(ctx, shieldImg || logoImg, shieldX, shieldY, shieldW, shieldH);
    }

    // Left: Crisp Vector Event Title
    const titleX = shieldX + shieldW + 8;
    const centerY = hb.y + hb.height / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 13.5px ${fontStack}`;
    ctx.fillText('Joint Response', titleX, centerY - 8);
    ctx.fillText('Exercise (JRE 2027)', titleX, centerY + 9);

    // Right: 4 High-Res University/Agency Logos (1:1 aspect ratio preserved, never squished)
    const logosH = Math.max(24, Math.round(hb.height * 0.49));
    const logosW = Math.round(logosH * (783 / 180));
    const rightEdge = hb.x + hb.width - 14;
    const logosX = rightEdge - logosW;
    const logosY = hb.y + Math.max(5, Math.round(hb.height * 0.09));
    if (fourLogosImg) {
      drawImageContain(ctx, fourLogosImg, logosX, logosY, logosW, logosH);
    }

    // Right: Crisp Vector Date & Venue below the 4 logos
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `800 8px ${fontStack}`;
    ctx.fillText('14–15 November 2026', rightEdge, logosY + logosH + 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 7.5px ${fontStack}`;
    ctx.fillText('At Mahasarakham University', rightEdge, logosY + logosH + 18);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hb.x, hb.y + hb.height - 0.5);
    ctx.lineTo(hb.x + hb.width, hb.y + hb.height - 0.5);
    ctx.stroke();
    ctx.restore();

    // Optional Role Pill Badge (Only rendered if enabled in Master Layout Config)
    const rp = L.rolePill;
    if (rp && rp.visible) {
      ctx.save();
      drawRoundedRectPath(ctx, rp.x, rp.y, rp.width, rp.height, rp.height / 2);
      ctx.fillStyle = isDev ? '#7c3aed' : isStaff ? '#f59e0b' : '#0284c7';
      ctx.fill();
      ctx.strokeStyle = isDev ? '#22d3ee' : isStaff ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = isStaff ? '#020617' : '#ffffff';
      ctx.font = `900 ${rp.fontSize || 8.5}px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        isDev ? '💻 DEVRCPMSU' : isStaff ? '⭐ ORGANIZING STAFF' : '🎓 PARTICIPANT',
        rp.x + rp.width / 2,
        rp.y + rp.height / 2
      );
      ctx.restore();
    }

    // 3. Centered 4:5 Photo Frame
    const pf = L.photoFrame;
    const pw = pf.width;
    const ph = pf.height;
    const px = pf.centerHorizontally ? Math.round((W - pw) / 2) : pf.x;
    const py = pf.y;
    const pRadius = pf.borderRadius ?? 16;

    ctx.save();
    drawRoundedRectPath(ctx, px, py, pw, ph, pRadius);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.clip();
    if (portraitImg) {
      drawImageCover(ctx, portraitImg, px, py, pw, ph);
    }
    ctx.restore();

    ctx.save();
    drawRoundedRectPath(ctx, px, py, pw, ph, pRadius);
    ctx.strokeStyle = isDev
      ? 'rgba(6, 182, 212, 0.95)'
      : isStaff 
      ? 'rgba(250, 204, 21, 0.95)' 
      : 'rgba(56, 189, 248, 0.95)';
    ctx.lineWidth = pf.borderWidth ?? 3;
    ctx.stroke();
    ctx.restore();

    // 4. Role-Specific Callsign Banner - Centered Horizontally
    const cp = L.callsignPill;
    const rawCallsign = formatSingleBadgeCallsign(cardData.callsign, isDev, isStaff);
    const callFontSize = cp.fontSize || 13;

    ctx.save();
    ctx.font = `900 ${callFontSize}px ${monoStack}`;
    const callTextW = ctx.measureText(rawCallsign).width;
    const callW = Math.min(W - 48, Math.max(cp.minWidth || 152, callTextW + 36));
    const callX = Math.round((W - callW) / 2) + (cp.offsetX || 0);
    const callY = cp.y;
    const callH = cp.height || 28;

    drawRoundedRectPath(ctx, callX, callY, callW, callH, cp.borderRadius ?? 8);
    ctx.fillStyle = isDev ? '#06b6d4' : isStaff ? '#f59e0b' : '#d9f929';
    ctx.fill();
    ctx.strokeStyle = isDev ? '#22d3ee' : isStaff ? '#fbbf24' : '#c2e420';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#07172f';
    ctx.font = `900 ${callFontSize}px ${monoStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, rawCallsign, callW - 12), callX + callW / 2, callY + callH / 2 + 0.5);
    ctx.restore();

    // 5. Hero Name Block - distinct theme per role, dead-center text
    const hbName = L.heroBox;
    const heroX = hbName.x;
    const heroY = hbName.y;
    const heroW = hbName.width;
    const hasNickname = Boolean(cardData.nickname && cardData.nickname !== '-');
    const heroH = hasNickname ? hbName.heightWithNick : hbName.heightNoNick;
    const heroCenterX = heroX + heroW / 2;

    ctx.save();
    drawRoundedRectPath(ctx, heroX, heroY, heroW, heroH, hbName.borderRadius ?? 12);
    if (isDev) {
      const devGrad = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY + heroH);
      devGrad.addColorStop(0, '#3b0764');
      devGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = devGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 1.5;
    } else if (isStaff) {
      const staffGrad = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY + heroH);
      staffGrad.addColorStop(0, '#c2410c');
      staffGrad.addColorStop(0.5, '#b45309');
      staffGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = staffGrad;
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = '#1d4ed8';
      ctx.fill();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isStaff ? '#fef08a' : isDev ? '#67e8f9' : '#d9f929';
    let enNameFontSize = hbName.enFontSize || 16;
    ctx.font = `900 ${enNameFontSize}px ${fontStack}`;
    const displayEnName = (cardData.englishName && cardData.englishName !== '-')
      ? cardData.englishName
      : cardData.thaiName;
    while (enNameFontSize > 11 && ctx.measureText(displayEnName).width > (heroW - 24)) {
      enNameFontSize -= 0.5;
      ctx.font = `900 ${enNameFontSize}px ${fontStack}`;
    }
    ctx.fillText(
      fitTextWithEllipsis(ctx, displayEnName.toUpperCase(), heroW - 20),
      heroCenterX,
      heroY + Math.round(heroH * (hasNickname ? 0.26 : 0.34))
    );

    ctx.fillStyle = isStaff ? '#fef3c7' : '#ffffff';
    let thaiNameFontSize = hbName.thFontSize || 12.5;
    ctx.font = `700 ${thaiNameFontSize}px ${fontStack}`;
    while (thaiNameFontSize > 10 && ctx.measureText(cardData.thaiName || '').width > (heroW - 24)) {
      thaiNameFontSize -= 0.5;
      ctx.font = `700 ${thaiNameFontSize}px ${fontStack}`;
    }
    ctx.fillText(
      fitTextWithEllipsis(ctx, cardData.thaiName, heroW - 20),
      heroCenterX,
      heroY + Math.round(heroH * (hasNickname ? 0.53 : 0.70))
    );

    if (hasNickname) {
      ctx.fillStyle = isStaff ? '#fde047' : isDev ? '#a5f3fc' : '#fef08a';
      ctx.font = `900 ${hbName.nickFontSize || 12}px ${fontStack}`;
      ctx.fillText(`⭐ ชื่อเล่น: ${cardData.nickname}`, heroCenterX, heroY + Math.round(heroH * 0.79));
    }
    ctx.restore();

    // 6. Organizational Credentials (Affiliation + Unit & Badge ID)
    const aff = L.affiliationBox;
    const affX = aff.x;
    const affY = aff.y;
    const affW = aff.width;
    const affH = aff.height;

    ctx.save();
    drawRoundedRectPath(ctx, affX, affY, affW, affH, aff.borderRadius ?? 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 ${aff.labelFontSize || 8}px ${fontStack}`;
    ctx.fillText('สังกัดสถาบัน / AFFILIATION', affX + 12, affY + Math.round(affH * 0.30));

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${aff.valueFontSize || 13}px ${fontStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.affiliation, affW - 24), affX + 12, affY + Math.round(affH * 0.70));
    ctx.restore();

    const uRow = L.unitBadgeRow;
    const row2X = uRow.x;
    const row2Y = uRow.y;
    const row2W = uRow.width;
    const row2H = uRow.height;
    const colGap = uRow.gap ?? 8;
    const colW = (row2W - colGap) / 2;

    // Unit Box
    ctx.save();
    drawRoundedRectPath(ctx, row2X, row2Y, colW, row2H, uRow.borderRadius ?? 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 ${uRow.labelFontSize || 8}px ${fontStack}`;
    ctx.fillText('หน่วย / UNIT', row2X + 12, row2Y + Math.round(row2H * 0.30));

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${uRow.valueFontSize || 12}px ${fontStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.unit, colW - 24), row2X + 12, row2Y + Math.round(row2H * 0.70));
    ctx.restore();

    // Badge ID Box
    const idX = row2X + colW + colGap;
    ctx.save();
    drawRoundedRectPath(ctx, idX, row2Y, colW, row2H, uRow.borderRadius ?? 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 ${uRow.labelFontSize || 8}px ${fontStack}`;
    ctx.fillText('รหัสบัตร / BADGE ID', idX + 12, row2Y + Math.round(row2H * 0.30));

    ctx.fillStyle = '#fde047';
    ctx.font = `900 ${uRow.valueFontSize || 12}px ${monoStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.cardCode, colW - 24), idX + 12, row2Y + Math.round(row2H * 0.70));
    ctx.restore();

    // 7. Bottom Section: QR Code, Blood Group & Verified Bar
    const bot = L.bottomRow;
    const botX = bot.x;
    const botY = bot.y;
    const botW = bot.width;
    const botH = bot.height;
    const botGap = bot.gap ?? 8;
    const botRadius = bot.borderRadius ?? 12;

    // QR Code Box (Left) - Sized so QR never overlaps the scan label below it!
    const qx = botX;
    const qw = bot.qrBoxWidth || 104;
    ctx.save();
    drawRoundedRectPath(ctx, qx, botY, qw, botH, botRadius);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    const qrDrawSize = Math.min(bot.qrSize || 74, qw - 14, botH - 26);
    const qrDrawX = qx + Math.round((qw - qrDrawSize) / 2);
    const qrDrawY = botY + (bot.qrTopOffset ?? 6);
    if (qrImg) {
      drawImageContain(ctx, qrImg, qrDrawX, qrDrawY, qrDrawSize, qrDrawSize);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDev ? '#7e22ce' : isStaff ? '#d97706' : '#0284c7';
    ctx.font = `900 ${bot.qrLabelFontSize || 7.5}px ${fontStack}`;
    ctx.fillText(
      isDev ? 'DEVRCPMSU SCAN' : isStaff ? 'STAFF ID ACCESS' : 'PARTICIPANT SCAN',
      qx + qw / 2,
      botY + (bot.qrLabelOffset ?? (botH - 11))
    );
    ctx.restore();

    // Blood Group Box with Blood Droplet (Middle) - Dead-center alignment
    const bx = qx + qw + botGap;
    const bw = bot.bloodBoxWidth || 104;
    ctx.save();
    drawRoundedRectPath(ctx, bx, botY, bw, botH, botRadius);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fecdd3';
    ctx.font = `900 8.5px ${fontStack}`;
    ctx.fillText('🩸 หมู่เลือด', bx + bw / 2, botY + Math.round(botH * 0.18));

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${bot.bloodValueFontSize || 34}px ${monoStack}`;
    ctx.fillText(cardData.bloodGroup || '-', bx + bw / 2, botY + Math.round(botH * 0.54));

    ctx.fillStyle = '#fda4af';
    ctx.font = `800 7.5px ${fontStack}`;
    ctx.fillText('BLOOD TYPE', bx + bw / 2, botY + Math.round(botH * 0.86));
    ctx.restore();

    // Verified Official Badge Box (Right) - Explicitly centered textAlign!
    const vx = bx + bw + botGap;
    const vw = botW - qw - bw - botGap * 2;
    const vCenterX = vx + vw / 2;
    ctx.save();
    drawRoundedRectPath(ctx, vx, botY, vw, botH, botRadius);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isDev) {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#a855f7';
      ctx.font = `900 ${bot.verifiedIconSize || 22}px ${fontStack}`;
      ctx.fillText('🛡️', vCenterX, botY + Math.round(botH * 0.27));
      ctx.fillStyle = '#c084fc';
      ctx.font = `900 ${bot.verifiedTitleFontSize || 13}px ${fontStack}`;
      ctx.fillText('✓ VERIFIED', vCenterX, botY + Math.round(botH * 0.55));
      ctx.fillStyle = '#38bdf8';
      ctx.font = `800 ${bot.verifiedSubFontSize || 8.5}px ${fontStack}`;
      ctx.fillText('DEVRCPMSU', vCenterX, botY + Math.round(botH * 0.80));
    } else if (isStaff) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = `900 ${bot.verifiedIconSize || 22}px ${fontStack}`;
      ctx.fillText('⭐', vCenterX, botY + Math.round(botH * 0.27));
      ctx.fillStyle = '#fbbf24';
      ctx.font = `900 ${bot.verifiedTitleFontSize || 13}px ${fontStack}`;
      ctx.fillText('✓ VERIFIED', vCenterX, botY + Math.round(botH * 0.55));
      ctx.fillStyle = '#fde047';
      ctx.font = `800 ${bot.verifiedSubFontSize || 8.5}px ${fontStack}`;
      ctx.fillText('ORGANIZING STAFF', vCenterX, botY + Math.round(botH * 0.80));
    } else {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.font = `900 ${bot.verifiedIconSize || 22}px ${fontStack}`;
      ctx.fillText('🛡️', vCenterX, botY + Math.round(botH * 0.27));
      ctx.fillStyle = '#6ee7b7';
      ctx.font = `900 ${bot.verifiedTitleFontSize || 13}px ${fontStack}`;
      ctx.fillText('✓ VERIFIED', vCenterX, botY + Math.round(botH * 0.55));
      ctx.fillStyle = '#a7f3d0';
      ctx.font = `800 ${bot.verifiedSubFontSize || 8.5}px ${fontStack}`;
      ctx.fillText('PARTICIPANT', vCenterX, botY + Math.round(botH * 0.80));
    }
    ctx.restore();

    // 8. Bottom Accent Gradient Line & Outer Border
    const bottomLineGrad = ctx.createLinearGradient(0, H - 4, W, H - 4);
    if (isDev) {
      bottomLineGrad.addColorStop(0, '#a855f7');
      bottomLineGrad.addColorStop(0.5, '#06b6d4');
      bottomLineGrad.addColorStop(1, '#6366f1');
    } else if (isStaff) {
      bottomLineGrad.addColorStop(0, '#f59e0b');
      bottomLineGrad.addColorStop(0.5, '#fbbf24');
      bottomLineGrad.addColorStop(1, '#ea580c');
    } else {
      bottomLineGrad.addColorStop(0, '#0284c7');
      bottomLineGrad.addColorStop(0.5, '#38bdf8');
      bottomLineGrad.addColorStop(1, '#1d4ed8');
    }
    ctx.fillStyle = bottomLineGrad;
    ctx.fillRect(0, H - 4, W, 4);

    ctx.restore();

    ctx.save();
    drawRoundedRectPath(ctx, 0.5, 0.5, W - 1, H - 1, 22);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    return canvas;
  }

  // ==========================================
  // LANDSCAPE: CR80 STANDARD (BASE 680 x 428)
  // ==========================================
  ctx.save();
  drawRoundedRectPath(ctx, 0, 0, W, H, 20);
  ctx.clip();

  ctx.fillStyle = '#07172f';
  ctx.fillRect(0, 0, W, H);

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

  const mx = 150;
  const maxMiddleW = 375;

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

  ctx.fillStyle = '#94a3b8';
  ctx.font = `700 8.5px ${fontStack}`;
  ctx.fillText('ชื่อ–สกุล / FULL NAME', mx, 127);

  let thaiFontSize = 19;
  ctx.font = `900 ${thaiFontSize}px ${fontStack}`;
  while (thaiFontSize > 13 && ctx.measureText(cardData.thaiName || '').width > maxMiddleW) {
    thaiFontSize -= 1;
    ctx.font = `900 ${thaiFontSize}px ${fontStack}`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(fitTextWithEllipsis(ctx, cardData.thaiName, maxMiddleW), mx, 148);

  let enFontSize = 12.5;
  ctx.font = `600 ${enFontSize}px ${fontStack}`;
  while (enFontSize > 10 && ctx.measureText(cardData.englishName || '').width > maxMiddleW) {
    enFontSize -= 0.5;
    ctx.font = `600 ${enFontSize}px ${fontStack}`;
  }
  ctx.fillStyle = '#fdba74';
  ctx.fillText(fitTextWithEllipsis(ctx, cardData.englishName, maxMiddleW), mx, 170);

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

  const rx = W - 24;
  ctx.save();
  const offWLandscape = 72;
  const offHLandscape = 24;
  drawRoundedRectPath(ctx, rx - offWLandscape, 82, offWLandscape, offHLandscape, 12);
  ctx.fillStyle = 'rgba(251, 146, 60, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#fdba74';
  ctx.font = `900 8.5px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICIAL', rx - offWLandscape / 2, 82 + offHLandscape / 2);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `700 8px ${fontStack}`;
  ctx.fillText('BADGE ID', rx, 196);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 11px ${monoStack}`;
  ctx.fillText(cardData.cardCode || '-', rx, 212);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 234);
  ctx.lineTo(W - 24, 234);
  ctx.stroke();

  const gx = 24;
  const gy = 246;
  const colGapL = 8;
  const rowGapL = 8;
  const colWL = (444 - colGapL) / 2;
  const rowHL = 47;

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

  drawFieldBox(gx, gy, colWL, rowHL, 'คำนำหน้า / Prefix', cardData.prefix);
  drawFieldBox(gx + colWL + colGapL, gy, colWL, rowHL, 'ชื่อ / First name', cardData.firstName);
  drawFieldBox(gx, gy + rowHL + rowGapL, colWL, rowHL, 'สกุล / Last name', cardData.lastName);
  drawFieldBox(gx + colWL + colGapL, gy + rowHL + rowGapL, colWL, rowHL, 'หน่วย / Unit', cardData.unit);
  drawFieldBox(gx, gy + (rowHL + rowGapL) * 2, 444, rowHL, 'สังกัด / Affiliation', cardData.affiliation);

  const qxL = 480;
  const qyL = 246;
  const qwL = 88;
  ctx.save();
  drawRoundedRectPath(ctx, qxL, qyL, qwL, qwL, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (qrImg) {
    drawImageContain(ctx, qrImg, qxL + 5, qyL + 5, qwL - 10, qwL - 10);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fdba74';
  ctx.font = `900 8px ${fontStack}`;
  ctx.fillText('ADMIN QR SCAN', qxL + qwL / 2, gy + 148);

  const bxL = 580;
  const byL = 246;
  const bwL = 76;
  const bhL = 132;
  ctx.save();
  drawRoundedRectPath(ctx, bxL, byL, bwL, bhL, 12);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fecdd3';
  ctx.font = `700 8px ${fontStack}`;
  ctx.fillText('BLOOD TYPE', bxL + bwL / 2, byL + 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 24px ${fontStack}`;
  ctx.fillText(cardData.bloodGroup || '-', bxL + bwL / 2, byL + 76);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6ee7b7';
  ctx.font = `700 8.5px ${fontStack}`;
  ctx.fillText('✓ VERIFIED', bxL + bwL / 2, gy + 148);

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

/**
 * Universal Native ID Card Canvas Generator (BACK SIDE)
 * Outputs exact 1200 x 1500 PX PNG of the JRE 2027 Website QR Card
 */
export async function renderNativeIdCardBackCanvas() {
  const W = PORTRAIT_BASE_WIDTH;
  const H = PORTRAIT_BASE_HEIGHT;
  const scale = 2.5; // 480 * 2.5 = 1200, 600 * 2.5 = 1500

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const [bannerImg, backImg] = await Promise.all([
    loadCanvasImage('/images/logo/jre_header_banner.png'),
    loadCanvasImage(BADGE_BACK_IMAGE)
  ]);

  const fontStack = '"Prompt", "Kanit", "Sarabun", "Noto Sans Thai", system-ui, -apple-system, sans-serif';
  const monoStack = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  ctx.save();
  drawRoundedRectPath(ctx, 0, 0, W, H, 22);
  ctx.clip();

  // Dark Navy background
  ctx.fillStyle = '#07172f';
  ctx.fillRect(0, 0, W, H);

  // Top header banner
  ctx.save();
  drawRoundedRectPath(ctx, 16, 16, W - 32, 54, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  if (bannerImg) {
    drawImageContain(ctx, bannerImg, 24, 20, W - 48, 44);
  }
  ctx.restore();

  // Banner bottom accent line
  ctx.fillStyle = '#f97316';
  ctx.fillRect(16, 68, W - 32, 2.5);

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fb923c';
  ctx.font = `900 8.5px ${fontStack}`;
  ctx.fillText('JRE 2027 • EVENT BADGE GUIDE', W / 2, 86);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 13px ${fontStack}`;
  ctx.fillText('ข้อมูลและระเบียบประจำบัตรการฝึกซ้อมร่วม', W / 2, 102);

  // Center QR Card
  const qrCardW = 210;
  const qrCardH = 200;
  const qrCardX = (W - qrCardW) / 2;
  const qrCardY = 120;
  ctx.save();
  drawRoundedRectPath(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (backImg) {
    drawImageContain(ctx, backImg, qrCardX + 12, qrCardY + 8, qrCardW - 24, qrCardH - 45);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1e293b';
  ctx.font = `900 8px ${fontStack}`;
  ctx.fillText('สแกนเข้าเว็บไซต์ JRE 2027', W / 2, qrCardY + qrCardH - 24);

  ctx.fillStyle = '#475569';
  ctx.font = `700 7.5px ${monoStack}`;
  ctx.fillText('rcp-msu.web.app • rcp-msu.vercel.app', W / 2, qrCardY + qrCardH - 11);
  ctx.restore();

  // Regulations Box
  const regX = 24;
  const regY = 336;
  const regW = W - 48;
  const regH = 205;
  ctx.save();
  drawRoundedRectPath(ctx, regX, regY, regW, regH, 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const rules = [
    { num: '1.', title: 'การพกพาบัตร:', desc: 'ผู้เข้าร่วมและ Staff ต้องคล้องบัตรนี้ตลอดระยะเวลาโครงการ และห้ามโอนสิทธิ์ให้ผู้อื่น' },
    { num: '2.', title: 'จุดตรวจ & สวัสดิการ:', desc: 'ใช้ QR Code ด้านหน้าสำหรับจุดตรวจนับยอด รายงานตัว รับเสื้อฝึก และรับประทานอาหาร' },
    { num: '3.', title: 'เหตุฉุกเฉิน / กองอำนวยการ:', desc: 'กรณีมีเหตุฉุกเฉินหรือเจ็บป่วย โทร 098-329-6762 ได้ตลอด 24 ชั่วโมง' },
    { num: '4.', title: 'เกณฑ์วุฒิบัตร:', desc: 'ผู้เข้าร่วมต้องมีเวลาฝึกซ้อมไม่น้อยกว่า 80% ตามเกณฑ์ที่คณะกรรมการกำหนด' },
    { num: '5.', title: 'กรณีพบบัตรสูญหาย:', desc: 'โปรดนำส่งคืนที่กองอำนวยการกลาง JRE 2027 (ชมรมกู้ภัยราชพฤกษ์ มมส)' }
  ];

  let textY = regY + 12;
  rules.forEach((r) => {
    ctx.fillStyle = '#f97316';
    ctx.font = `900 9px ${fontStack}`;
    ctx.fillText(r.num, regX + 12, textY);

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 8.5px ${fontStack}`;
    ctx.fillText(r.title, regX + 26, textY);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `500 8px ${fontStack}`;
    const descWrapped = fitTextWithEllipsis(ctx, r.desc, regW - 40);
    ctx.fillText(descWrapped, regX + 26, textY + 14);

    textY += 36;
  });
  ctx.restore();

  // Footer bar
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(24, 555);
  ctx.lineTo(W - 24, 555);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fdba74';
  ctx.font = `700 8px ${fontStack}`;
  ctx.fillText('ชมรมกู้ภัยราชพฤกษ์ มมส', 24, 572);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 7.5px ${fontStack}`;
  ctx.fillText('USIVN NETWORK EXERCISE', W / 2, 572);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.font = `900 8px ${fontStack}`;
  ctx.fillText('✓ OFFICIAL', W - 24, 572);
  ctx.restore();

  ctx.restore();

  // Card Outer Border
  ctx.save();
  drawRoundedRectPath(ctx, 0.5, 0.5, W - 1, H - 1, 22);
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  return canvas;
}

/**
 * BACK SIDE COMPONENT (1200 x 1500 PX / 480 x 600 PX Base)
 * Official Convention Badge Back with JRE 2027 Website QR & Event Guidelines
 */
export function CardInnerContentBack({ cardData = null }) {
  const isStaff = Boolean(cardData?.isStaff);

  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-[#07172f] text-white p-4 overflow-hidden rounded-[22px] select-none shadow-2xl border border-slate-700">
      {/* Background Ambient Glow */}
      <div className={`pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl ${
        isStaff ? 'bg-amber-500/15' : 'bg-sky-500/15'
      }`} />
      <div className={`pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full blur-3xl ${
        isStaff ? 'bg-yellow-500/10' : 'bg-blue-600/15'
      }`} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[4px] ${
        isStaff 
          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600' 
          : 'bg-gradient-to-r from-sky-500 via-blue-400 to-cyan-500'
      }`} />

      {/* Top Header Banner */}
      <div className="relative h-[52px] shrink-0 overflow-hidden rounded-xl bg-white px-3 py-1.5 shadow-md">
        <img
          src="/images/logo/jre_header_banner.png"
          alt="Joint Response Exercise JRE 2027"
          className="h-full w-full object-contain"
        />
        <div className={`absolute inset-x-0 bottom-0 h-1 ${
          isStaff 
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500' 
            : 'bg-gradient-to-r from-sky-500 via-blue-400 to-cyan-500'
        }`} />
      </div>

      {/* Title */}
      <div className="text-center pt-1.5">
        <span className={`text-[8.5px] font-black uppercase tracking-[0.2em] ${
          isStaff ? 'text-amber-400' : 'text-sky-400'
        }`}>
          JRE 2027 • EVENT BADGE GUIDE
        </span>
        <h3 className="text-[13px] font-black text-white leading-tight">
          ข้อมูลและระเบียบประจำบัตรการฝึกซ้อมร่วม
        </h3>
      </div>

      {/* Center QR Card */}
      <div className="mx-auto flex flex-col items-center rounded-2xl border border-white/20 bg-white p-2 text-slate-900 shadow-xl max-w-[210px] w-full">
        <img
          src={BADGE_BACK_IMAGE}
          alt="QR เว็บไซต์ JRE2027"
          className="w-[145px] h-[145px] object-contain"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PHOTO;
          }}
        />
        <span className="mt-1 text-[8px] font-black text-slate-800 tracking-wider uppercase">
          สแกนเข้าเว็บไซต์ JRE 2027
        </span>
        <span className="text-[7.5px] font-mono text-slate-600 font-bold">
          rcp-msu.web.app • rcp-msu.vercel.app
        </span>
      </div>

      {/* Regulations / Safety Instructions Box */}
      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 space-y-1 text-[8.5px] leading-relaxed text-slate-300 shadow-inner">
        <div className="flex items-start gap-1.5">
          <span className="text-orange-400 font-bold">1.</span>
          <span><strong>การพกพา:</strong> ผู้เข้าร่วมและ Staff ต้องคล้องบัตรนี้ตลอดระยะเวลาโครงการ และห้ามโอนสิทธิ์</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-orange-400 font-bold">2.</span>
          <span><strong>จุดตรวจ & สวัสดิการ:</strong> ใช้ QR ด้านหน้าสำหรับเช็คชื่อ รับเสื้อฝึก และรับประทานอาหาร</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-orange-400 font-bold">3.</span>
          <span><strong>เหตุฉุกเฉิน / กองอำนวยการ:</strong> สายด่วน <strong className="text-amber-300">098-329-6762</strong> ได้ตลอด 24 ชั่วโมง</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-orange-400 font-bold">4.</span>
          <span><strong>เกณฑ์วุฒิบัตร:</strong> ต้องมีเวลาเข้าร่วมการฝึกไม่น้อยกว่า 80% ตามเกณฑ์ที่กำหนด</span>
        </div>
      </div>

      {/* Footer Credentials */}
      <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[7.5px] text-slate-400">
        <span className="font-bold text-orange-300">ชมรมกู้ภัยราชพฤกษ์ มมส</span>
        <span>USIVN NETWORK EXERCISE</span>
        <span className="text-emerald-400 font-bold">✓ OFFICIAL</span>
      </div>
    </div>
  );
}

export default function IDCardPreview({
  registration,
  compact = false,
  showActions = true,
  user = null,
  onPrint,
  defaultOrientation = 'portrait', // Default to Portrait (1200 x 1500 px)
  allowOrientationToggle = true
}) {
  const [orientation, setOrientation] = useState(defaultOrientation);
  const [cardSide, setCardSide] = useState('front'); // 'front' or 'back'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' or 'actual'

  const isPortrait = orientation === 'portrait';
  const effectiveBaseWidth = isPortrait
    ? PORTRAIT_BASE_WIDTH
    : (compact ? Math.min(LANDSCAPE_BASE_WIDTH, 620) : LANDSCAPE_BASE_WIDTH);
  const effectiveBaseHeight = isPortrait
    ? PORTRAIT_BASE_HEIGHT
    : Math.round(effectiveBaseWidth / 1.5857);

  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.min(effectiveBaseWidth, Math.max(260, window.innerWidth - 32));
    }
    return effectiveBaseWidth;
  });

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const cardData = useMemo(() => getRegistrationCardData(registration), [registration]);

  // Responsive container observer
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
    printWithDocumentTitle(`บัตรประจำตัว_ID_Card_${cardData?.cardCode || cardData?.fullName || 'JRE2027'}`);
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
      const canvas = cardSide === 'back'
        ? await renderNativeIdCardBackCanvas()
        : await renderNativeIdCardCanvas({
            photo,
            cardData,
            qrDataUrl,
            orientation
          });

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Unable to create PNG blob'));
        }, 'image/png');
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = cardSide === 'back'
        ? `JRE2027-badge-back-1200x1500.png`
        : isPortrait
        ? `${cardData.cardCode}-id-card-1200x1500.png`
        : `${cardData.cardCode}-id-card-cr80.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('JRE ID card PNG export failed:', error);
      window.alert('บันทึกภาพบัตรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const hasCallsign = cardData.callsign && cardData.callsign !== '-';
  const hasNickname = cardData.nickname && cardData.nickname !== '-';

  return (
    <div
      className="jre-id-card-print-root w-full min-w-0 overflow-hidden"
      data-orientation={orientation}
    >
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
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                Digital ID Card
              </p>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                Online Sync
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Front / Back Side Switcher */}
            <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/90 p-0.5 text-[11px] font-bold shadow-sm">
              <button
                type="button"
                onClick={() => setCardSide('front')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  cardSide === 'front'
                    ? 'bg-orange-500 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="ดูบัตรด้านหน้า (ข้อมูลผู้สมัครและรูปถ่าย)"
              >
                <span>ด้านหน้า</span>
              </button>
              <button
                type="button"
                onClick={() => setCardSide('back')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  cardSide === 'back'
                    ? 'bg-sky-500 text-slate-950 font-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="ดูบัตรด้านหลัง (QR เว็บไซต์ JRE2027)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>ด้านหลัง</span>
              </button>
            </div>

            {/* Orientation Toggle */}
            {allowOrientationToggle && (
              <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/90 p-0.5 text-[11px] font-bold shadow-sm">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isPortrait
                      ? 'bg-orange-500 text-slate-950 font-black shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="ขนาดแนวตั้ง 1200 x 1500 px (CR100 Standard สำหรับบัตรคล้องคอ)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>แนวตั้ง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    !isPortrait
                      ? 'bg-orange-500 text-slate-950 font-black shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="ขนาดแนวนอน CR80 Standard"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>แนวนอน</span>
                </button>
              </div>
            )}

            {/* Mobile Zoom Mode Toggle */}
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
                  title="ดูขนาดจริง 100%"
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
              title={cardSide === 'back' ? 'ดาวน์โหลดภาพด้านหลัง 1200 x 1500 px (.png)' : 'ดาวน์โหลดบัตรด้านหน้า 1200 x 1500 px (.png)'}
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloadingCard ? 'กำลังสร้าง PNG…' : cardSide === 'back' ? 'หลัง PNG (1200×1500)' : 'บัตร PNG (1200×1500)'}
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
              className="jre-id-card relative shrink-0 overflow-hidden rounded-[22px] border border-slate-600/80 bg-[#07172f] shadow-2xl shadow-black/40 select-none"
            >
              {cardSide === 'back' ? (
                <CardInnerContentBack cardData={cardData} />
              ) : isPortrait ? (
                <CardInnerContentPortrait
                  photo={photo}
                  cardData={cardData}
                  qrDataUrl={qrDataUrl}
                  thaiNameClass={thaiNameClass}
                  enNameClass={enNameClass}
                  hasCallsign={hasCallsign}
                  hasNickname={hasNickname}
                />
              ) : (
                <CardInnerContentLandscape
                  photo={photo}
                  cardData={cardData}
                  qrDataUrl={qrDataUrl}
                  thaiNameClass={thaiNameClass}
                  enNameClass={enNameClass}
                  hasCallsign={hasCallsign}
                  hasNickname={hasNickname}
                />
              )}
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
                className="jre-id-card relative shrink-0 overflow-hidden rounded-[22px] border border-slate-600/80 bg-[#07172f] shadow-2xl shadow-black/40 select-none"
              >
                {cardSide === 'back' ? (
                  <CardInnerContentBack cardData={cardData} />
                ) : isPortrait ? (
                  <CardInnerContentPortrait
                    photo={photo}
                    cardData={cardData}
                    qrDataUrl={qrDataUrl}
                    thaiNameClass={thaiNameClass}
                    enNameClass={enNameClass}
                    hasCallsign={hasCallsign}
                    hasNickname={hasNickname}
                  />
                ) : (
                  <CardInnerContentLandscape
                    photo={photo}
                    cardData={cardData}
                    qrDataUrl={qrDataUrl}
                    thaiNameClass={thaiNameClass}
                    enNameClass={enNameClass}
                    hasCallsign={hasCallsign}
                    hasNickname={hasNickname}
                  />
                )}
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

/**
 * PORTRAIT CARD LAYOUT (1200 x 1500 PX / Base 480 x 600 PX)
 * Standard Convention Badge / CR100 Vertical Format
 * Driven by Master Card Layout Config (L) for 100% parity between Web, Print, and PNG
 */
export function CardInnerContentPortrait({
  photo,
  cardData,
  qrDataUrl,
  layoutConfig = null,
  studioInteractive = null
}) {
  const L = useMasterCardLayout(layoutConfig);
  const isDev = Boolean(cardData?.isDev || cardData?.badgeRole === 'DEV');
  const isStaff = !isDev && Boolean(cardData?.isStaff || cardData?.badgeRole === 'STAFF');

  const hb = L.headerBanner;
  const rp = L.rolePill;
  const pf = L.photoFrame;
  const cp = L.callsignPill;
  const hbName = L.heroBox;
  const aff = L.affiliationBox;
  const uRow = L.unitBadgeRow;
  const bot = L.bottomRow;

  const photoX = pf.centerHorizontally ? Math.round((480 - pf.width) / 2) : pf.x;
  const hasNick = Boolean(cardData?.nickname && cardData.nickname !== '-');
  const heroH = hasNick ? hbName.heightWithNick : hbName.heightNoNick;

  const activeZone = studioInteractive?.selectedZone || null;
  const onSelectZone = studioInteractive?.onSelectZone || null;
  const onStartDrag = studioInteractive?.onStartDrag || null;
  const showGuides = Boolean(studioInteractive?.showGuides);

  const getZoneInteractiveProps = (zoneKey) => {
    if (!studioInteractive) return {};
    const isSelected = activeZone === zoneKey;
    return {
      onMouseDown: (e) => {
        e.stopPropagation();
        if (onSelectZone) onSelectZone(zoneKey);
        if (onStartDrag) onStartDrag(zoneKey, e);
      },
      className: `cursor-move transition-shadow ${
        isSelected
          ? 'ring-2 ring-cyan-400 shadow-[0_0_0_3px_rgba(34,211,238,0.35)] z-30'
          : 'hover:ring-1 hover:ring-orange-400/80'
      }`
    };
  };

  return (
    <>
      {/* Background Decorative Ambient Lighting */}
      <div className={`pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl ${
        isDev ? 'bg-purple-600/25' : isStaff ? 'bg-amber-500/20' : 'bg-sky-500/20'
      }`} />
      <div className={`pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full blur-3xl ${
        isDev ? 'bg-cyan-500/20' : isStaff ? 'bg-yellow-500/15' : 'bg-blue-600/20'
      }`} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[4px] z-20 ${
        isDev
          ? 'bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500'
          : isStaff 
          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600' 
          : 'bg-gradient-to-r from-sky-500 via-blue-400 to-cyan-500'
      }`} />

      {/* 3D Geometric Fluid Curved Graphic Elements */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-35" preserveAspectRatio="none" viewBox="0 0 480 600">
        <path d="M-40,80 Q60,180 -20,320 T-50,500" fill="none" stroke={isDev ? '#a855f7' : isStaff ? '#f59e0b' : '#f97316'} strokeWidth="48" strokeLinecap="round" opacity="0.6" />
        <path d="M520,120 Q420,240 500,380 T510,540" fill="none" stroke={isDev ? '#06b6d4' : isStaff ? '#ea580c' : '#1d4ed8'} strokeWidth="42" strokeLinecap="round" opacity="0.6" />
        <circle cx="410" cy="90" r="28" fill={isDev ? '#a855f7' : '#f59e0b'} opacity="0.25" />
        <circle cx="70" cy="530" r="34" fill={isDev ? '#06b6d4' : '#f97316'} opacity="0.25" />
      </svg>

      {/* Center Alignment Guides when in Studio Mode */}
      {showGuides && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 border-l border-dashed border-cyan-400/60" />
          <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 border-t border-dashed border-cyan-400/40" />
          <div className="absolute left-[24px] top-0 bottom-0 w-px border-l border-dotted border-amber-400/35" />
          <div className="absolute right-[24px] top-0 bottom-0 w-px border-l border-dotted border-amber-400/35" />
        </div>
      )}

      <div className="relative z-10 h-full w-full">
        {/* 1. Top Header Banner (Native Vector Text + High-Res Proportional Logos, zero squishing!) */}
        <div
          style={{
            position: 'absolute',
            left: `${hb.x}px`,
            top: `${hb.y}px`,
            width: `${hb.width}px`,
            height: `${hb.height}px`
          }}
          onMouseDown={getZoneInteractiveProps('headerBanner').onMouseDown}
          className={`overflow-hidden bg-gradient-to-r from-[#132a4f] via-[#0e3666] to-[#262b44] border-b border-white/15 shadow-md px-3.5 flex items-center justify-between ${getZoneInteractiveProps('headerBanner').className || ''}`}
        >
          {/* Ambient warm glow on right */}
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-44 rounded-full bg-amber-500/20 blur-2xl" />

          {/* Left: High-Res USIVN Shield + Vector Title */}
          <div className="relative z-10 flex items-center gap-2 pointer-events-none">
            <img
              src="/images/logo/jre_shield_transparent.png"
              alt="USIVN Shield"
              style={{ height: `${Math.max(36, Math.round(hb.height * 0.78))}px` }}
              className="w-auto object-contain shrink-0 drop-shadow"
            />
            <div className="leading-tight">
              <span className="block text-[13.5px] font-black tracking-tight text-white">
                Joint Response
              </span>
              <span className="block text-[13.5px] font-black tracking-tight text-white">
                Exercise (JRE 2027)
              </span>
            </div>
          </div>

          {/* Right: 4 High-Res University/Agency Seals + Vector Date & Venue */}
          <div className="relative z-10 flex flex-col items-end justify-center text-right pointer-events-none">
            <img
              src="/images/logo/jre_four_logos_hd.png"
              alt="Partner University Logos"
              style={{ height: `${Math.max(24, Math.round(hb.height * 0.49))}px` }}
              className="w-auto object-contain shrink-0 drop-shadow-sm"
            />
            <span className="mt-1 block text-[8px] font-extrabold text-slate-200 leading-none">
              14–15 November 2026
            </span>
            <span className="mt-0.5 block text-[7.5px] font-bold text-slate-400 leading-none">
              At Mahasarakham University
            </span>
          </div>
        </div>

        {/* 2. Optional Floating Role Pill Badge */}
        {rp && rp.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${rp.x}px`,
              top: `${rp.y}px`,
              width: `${rp.width}px`,
              height: `${rp.height}px`
            }}
            onMouseDown={getZoneInteractiveProps('rolePill').onMouseDown}
            className={`z-20 flex items-center justify-center rounded-full font-black shadow-md border ${
              isDev
                ? 'bg-purple-600 text-white border-cyan-400'
                : isStaff
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-sky-600 text-white border-sky-300'
            } ${getZoneInteractiveProps('rolePill').className || ''}`}
          >
            <span style={{ fontSize: `${rp.fontSize || 8.5}px` }} className="leading-none whitespace-nowrap">
              {isDev ? '💻 DEVRCPMSU' : isStaff ? '⭐ ORGANIZING STAFF' : '🎓 PARTICIPANT'}
            </span>
          </div>
        )}

        {/* 3. Centered 4:5 Portrait Photo Frame */}
        <div
          style={{
            position: 'absolute',
            left: `${photoX}px`,
            top: `${pf.y}px`,
            width: `${pf.width}px`,
            height: `${pf.height}px`,
            borderRadius: `${pf.borderRadius ?? 16}px`,
            borderWidth: `${pf.borderWidth ?? 3}px`
          }}
          onMouseDown={getZoneInteractiveProps('photoFrame').onMouseDown}
          className={`overflow-hidden bg-slate-900 shadow-2xl ${
            isDev
              ? 'border-cyan-400 ring-2 ring-purple-500/60 shadow-purple-500/30'
              : isStaff 
              ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-amber-500/30' 
              : 'border-sky-400 ring-2 ring-sky-400/60 shadow-sky-500/30'
          } ${getZoneInteractiveProps('photoFrame').className || ''}`}
        >
          <img
            src={photo}
            alt={`รูปประจำตัว ${cardData.thaiName}`}
            crossOrigin="anonymous"
            className="h-full w-full object-cover pointer-events-none"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_PHOTO;
            }}
          />
        </div>

        {/* 4. Role-Specific Callsign Banner (Centered Horizontally) */}
        <div
          style={{
            position: 'absolute',
            left: '0px',
            right: '0px',
            top: `${cp.y}px`,
            height: `${cp.height || 28}px`,
            transform: cp.offsetX ? `translateX(${cp.offsetX}px)` : undefined
          }}
          onMouseDown={getZoneInteractiveProps('callsignPill').onMouseDown}
          className={`z-10 flex items-center justify-center ${getZoneInteractiveProps('callsignPill').className || ''}`}
        >
          <div
            style={{
              minWidth: `${cp.minWidth || 152}px`,
              maxWidth: '432px',
              height: `${cp.height || 28}px`,
              borderRadius: `${cp.borderRadius ?? 8}px`
            }}
            className={`px-4 flex items-center justify-center shadow-xl border text-center ${
              isDev
                ? 'bg-cyan-400 border-cyan-300 text-slate-950'
                : isStaff
                ? 'bg-amber-400 border-amber-300 text-slate-950'
                : 'bg-[#d9f929] border-[#c2e420] text-[#07172f]'
            }`}
          >
            <span
              style={{ fontSize: `${cp.fontSize || 13}px` }}
              className="font-black tracking-widest font-mono leading-none truncate"
            >
              {formatSingleBadgeCallsign(cardData.callsign, isDev, isStaff)}
            </span>
          </div>
        </div>

        {/* 5. Hero Name Block with Distinct Role Theme & Centered Content */}
        <div
          style={{
            position: 'absolute',
            left: `${hbName.x}px`,
            top: `${hbName.y}px`,
            width: `${hbName.width}px`,
            height: `${heroH}px`,
            borderRadius: `${hbName.borderRadius ?? 12}px`
          }}
          onMouseDown={getZoneInteractiveProps('heroBox').onMouseDown}
          className={`px-3 flex flex-col items-center justify-center text-center shadow-xl border-2 overflow-hidden ${
            isDev
              ? 'bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 border-cyan-400/60 shadow-purple-950/50'
              : isStaff
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 border-yellow-300 shadow-amber-950/50'
              : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 border-blue-400/60 shadow-blue-950/50'
          } ${getZoneInteractiveProps('heroBox').className || ''}`}
        >
          <span
            style={{ fontSize: `${hbName.enFontSize || 16}px` }}
            className={`block w-full font-black tracking-tight leading-tight uppercase truncate ${
              isDev ? 'text-cyan-300' : isStaff ? 'text-yellow-100' : 'text-[#d9f929]'
            }`}
            title={cardData.englishName}
          >
            {cardData.englishName && cardData.englishName !== '-' ? cardData.englishName : cardData.thaiName}
          </span>
          <span
            style={{ fontSize: `${hbName.thFontSize || 12.5}px` }}
            className={`block w-full font-bold leading-tight mt-0.5 truncate ${
              isStaff ? 'text-amber-100' : 'text-white'
            }`}
            title={cardData.thaiName}
          >
            {cardData.thaiName}
          </span>
          {hasNick && (
            <div className="mt-0.5 flex items-center justify-center">
              <span
                style={{ fontSize: `${hbName.nickFontSize || 12}px` }}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-black leading-none border shadow-sm ${
                  isDev
                    ? 'bg-purple-500/30 border-purple-400/50 text-cyan-200'
                    : isStaff
                    ? 'bg-yellow-400/30 border-yellow-200 text-yellow-100'
                    : 'bg-sky-400/25 border-sky-300/50 text-sky-100'
                }`}
              >
                <span>⭐ ชื่อเล่น:</span>
                <span className="font-black">{cardData.nickname}</span>
              </span>
            </div>
          )}
        </div>

        {/* 6. Organizational Credentials: Affiliation Box */}
        <div
          style={{
            position: 'absolute',
            left: `${aff.x}px`,
            top: `${aff.y}px`,
            width: `${aff.width}px`,
            height: `${aff.height}px`,
            borderRadius: `${aff.borderRadius ?? 10}px`
          }}
          onMouseDown={getZoneInteractiveProps('affiliationBox').onMouseDown}
          className={`border border-white/15 bg-white/[0.08] px-3 flex flex-col justify-center shadow-inner overflow-hidden ${getZoneInteractiveProps('affiliationBox').className || ''}`}
        >
          <span
            style={{ fontSize: `${aff.labelFontSize || 8}px` }}
            className="block font-bold uppercase tracking-wider text-slate-300 leading-none"
          >
            สังกัดสถาบัน / Affiliation
          </span>
          <span
            style={{ fontSize: `${aff.valueFontSize || 13}px` }}
            className="mt-1 block font-black text-white leading-tight truncate"
            title={cardData.affiliation}
          >
            {cardData.affiliation || '-'}
          </span>
        </div>

        {/* 7. Unit & Badge ID Row */}
        <div
          style={{
            position: 'absolute',
            left: `${uRow.x}px`,
            top: `${uRow.y}px`,
            width: `${uRow.width}px`,
            height: `${uRow.height}px`,
            gap: `${uRow.gap ?? 8}px`
          }}
          onMouseDown={getZoneInteractiveProps('unitBadgeRow').onMouseDown}
          className={`grid grid-cols-2 ${getZoneInteractiveProps('unitBadgeRow').className || ''}`}
        >
          <div
            style={{ borderRadius: `${uRow.borderRadius ?? 10}px` }}
            className="border border-white/15 bg-white/[0.08] px-3 flex flex-col justify-center shadow-inner overflow-hidden"
          >
            <span
              style={{ fontSize: `${uRow.labelFontSize || 8}px` }}
              className="block font-bold uppercase tracking-wider text-slate-300 leading-none"
            >
              หน่วย / Unit
            </span>
            <span
              style={{ fontSize: `${uRow.valueFontSize || 12}px` }}
              className="mt-1 block font-bold text-white leading-tight truncate"
              title={cardData.unit}
            >
              {cardData.unit || '-'}
            </span>
          </div>

          <div
            style={{ borderRadius: `${uRow.borderRadius ?? 10}px` }}
            className="border border-white/15 bg-white/[0.08] px-3 flex flex-col justify-center shadow-inner overflow-hidden"
          >
            <span
              style={{ fontSize: `${uRow.labelFontSize || 8}px` }}
              className="block font-bold uppercase tracking-wider text-slate-300 leading-none"
            >
              รหัสบัตร / Badge ID
            </span>
            <span
              style={{ fontSize: `${uRow.valueFontSize || 12}px` }}
              className="mt-1 block font-black font-mono text-amber-300 leading-tight truncate tracking-wide"
              title={cardData.cardCode}
            >
              {cardData.cardCode || '-'}
            </span>
          </div>
        </div>

        {/* 8. Bottom Verification Section: QR + Blood Type + Verified Box */}
        <div
          style={{
            position: 'absolute',
            left: `${bot.x}px`,
            top: `${bot.y}px`,
            width: `${bot.width}px`,
            height: `${bot.height}px`,
            gap: `${bot.gap ?? 8}px`
          }}
          onMouseDown={getZoneInteractiveProps('bottomRow').onMouseDown}
          className={`flex items-stretch ${getZoneInteractiveProps('bottomRow').className || ''}`}
        >
          {/* QR Code Box (Left) - Explicit qrSize so QR NEVER overlaps bottom scan label */}
          <div
            style={{
              width: `${bot.qrBoxWidth || 104}px`,
              borderRadius: `${bot.borderRadius ?? 12}px`
            }}
            className="relative shrink-0 bg-white shadow-md overflow-hidden flex flex-col items-center justify-between pt-1.5 pb-1.5 px-1.5"
          >
            <div
              style={{
                width: `${Math.min(bot.qrSize || 74, (bot.qrBoxWidth || 104) - 14, bot.height - 26)}px`,
                height: `${Math.min(bot.qrSize || 74, (bot.qrBoxWidth || 104) - 14, bot.height - 26)}px`
              }}
              className="flex items-center justify-center shrink-0"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code สำหรับ Admin สแกน"
                  className="h-full w-full object-contain pointer-events-none"
                />
              ) : (
                <div className="h-full w-full animate-pulse rounded bg-slate-200" />
              )}
            </div>
            <span
              style={{ fontSize: `${bot.qrLabelFontSize || 7.5}px` }}
              className={`block w-full text-center font-black tracking-wider uppercase leading-none whitespace-nowrap ${
                isDev ? 'text-purple-700' : isStaff ? 'text-amber-600' : 'text-sky-700'
              }`}
            >
              {isDev ? 'DEVRCPMSU SCAN' : isStaff ? 'STAFF ID ACCESS' : 'PARTICIPANT SCAN'}
            </span>
          </div>

          {/* Blood Type Box with Blood Drop Icon (Middle) - Dead-center alignment */}
          <div
            style={{
              width: `${bot.bloodBoxWidth || 104}px`,
              borderRadius: `${bot.borderRadius ?? 12}px`
            }}
            className="shrink-0 flex flex-col items-center justify-between border border-rose-500/50 bg-rose-500/15 py-2 px-1.5 text-center shadow-sm"
          >
            <div className="flex items-center justify-center gap-1">
              <Droplet className="w-3.5 h-3.5 fill-rose-500 text-rose-400 shrink-0" />
              <span className="block text-[8.5px] font-black uppercase tracking-wider text-rose-200 leading-none">
                หมู่เลือด
              </span>
            </div>
            <strong
              style={{ fontSize: `${bot.bloodValueFontSize || 34}px` }}
              className="block font-black leading-none text-white my-auto font-mono"
            >
              {cardData.bloodGroup || '-'}
            </strong>
            <span className="block text-[7.5px] font-bold text-rose-300 uppercase leading-none">
              BLOOD TYPE
            </span>
          </div>

          {/* Clean Official Verified Box (Right) - Dead-center alignment */}
          <div
            style={{ borderRadius: `${bot.borderRadius ?? 12}px` }}
            className={`flex flex-1 flex-col items-center justify-center border p-2 text-center shadow-sm ${
              isDev
                ? 'border-purple-500/50 bg-purple-500/15'
                : isStaff
                ? 'border-amber-500/50 bg-amber-500/15'
                : 'border-emerald-500/40 bg-emerald-500/15'
            }`}
          >
            <ShieldCheck className={`h-6 w-6 shrink-0 mx-auto ${
              isDev ? 'text-purple-400' : isStaff ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <strong
              style={{ fontSize: `${bot.verifiedTitleFontSize || 13}px` }}
              className={`mt-1 block w-full text-center font-black tracking-wider leading-tight ${
                isDev ? 'text-purple-300' : isStaff ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              ✓ VERIFIED
            </strong>
            <span
              style={{ fontSize: `${bot.verifiedSubFontSize || 8.5}px` }}
              className={`mt-0.5 block w-full text-center font-bold uppercase tracking-wider leading-tight ${
                isDev ? 'text-cyan-300' : isStaff ? 'text-yellow-300' : 'text-emerald-200/90'
              }`}
            >
              {isDev ? 'DEVRCPMSU' : isStaff ? 'ORGANIZING STAFF' : 'PARTICIPANT'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * LANDSCAPE CARD LAYOUT (CR80 Standard / Base 680 x 428 PX)
 */
export function CardInnerContentLandscape({
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
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="relative h-[68px] shrink-0 overflow-hidden bg-white px-4 py-2">
          <img
            src="/images/logo/jre_header_banner.png"
            alt="Joint Response Exercise JRE 2027"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        </div>

        <div className="flex flex-1 flex-col justify-between px-6 pb-4 pt-3.5">
          <div className="flex h-[142px] items-start gap-4">
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
              <div className={`absolute inset-x-0 bottom-0 bg-slate-950/90 px-1 py-1 text-center text-[8px] font-black tracking-[0.1em] whitespace-nowrap truncate overflow-hidden ${cardData.isStaff ? 'text-yellow-300' : 'text-orange-300'}`}>
                {cardData.roleBadge || 'PARTICIPANT'}
              </div>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-between h-[138px] overflow-hidden">
              <div>
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

          <div className="mt-2.5 flex items-stretch gap-3 border-t border-white/10 pt-2.5">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
              <CardField label="คำนำหน้า / Prefix" value={cardData.prefix} />
              <CardField label="ชื่อ / First name" value={cardData.firstName} />
              <CardField label="สกุล / Last name" value={cardData.lastName} />
              <CardField label="หน่วย / Unit" value={cardData.unit} />
              <CardField label="สังกัด / Affiliation" value={cardData.affiliation} className="col-span-2" />
            </div>

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

/**
 * SINGLE A6 BADGE CARD ITEM (FRONT OR BACK)
 * Sized for A6 (105 x 148.5 mm standard quadrant of A4)
 */
export function A6BadgeCardItem({
  person,
  user = null,
  side = 'front',
  qrDataUrl = ''
}) {
  const reg = person?.reg || person;
  const cardData = person?.cardData || getRegistrationCardData(reg);
  if (!reg) return null;

  const photo = cardData.photo || user?.avatar || FALLBACK_PHOTO;
  const thaiNameLen = (cardData.thaiName || '').length;
  const thaiNameClass = thaiNameLen > 38 ? 'text-[12px]' : thaiNameLen > 24 ? 'text-[14px]' : 'text-[16px]';
  const enNameLen = (cardData.englishName || '').length;
  const enNameClass = enNameLen > 32 ? 'text-[10px]' : 'text-[11.5px]';
  const hasCallsign = cardData.callsign && cardData.callsign !== '-';
  const hasNickname = cardData.nickname && cardData.nickname !== '-';

  return (
    <div
      style={{ width: '230px', height: '287.5px' }}
      className="a6-card-wrapper relative shrink-0 overflow-hidden rounded-[14px] border border-slate-600 bg-[#07172f] shadow-md text-white select-none"
    >
      <div style={{ transform: 'scale(0.4791)', transformOrigin: 'top left', width: '480px', height: '600px' }}>
        {side === 'front' ? (
          <CardInnerContentPortrait
            photo={photo}
            cardData={cardData}
            qrDataUrl={qrDataUrl}
            thaiNameClass={thaiNameClass}
            enNameClass={enNameClass}
            hasCallsign={hasCallsign}
            hasNickname={hasNickname}
          />
        ) : (
          <CardInnerContentBack cardData={cardData} />
        )}
      </div>
    </div>
  );
}

/**
 * A4 4-CELL GRID SHEET (2 PEOPLE PER A4 SHEET)
 * Layout: 2 Columns x 2 Rows = 4 Quadrants of A6 size (105 x 148.5 mm)
 * Row 1 (Person 1 Top): Left = FRONT (A6) | Right = BACK (A6)
 * Row 2 (Person 2 Bottom): Left = FRONT (A6) | Right = BACK (A6)
 * Center Vertical Fold Line: Folds front & back back-to-back with 100% exact alignment
 * Center Horizontal Cut Line: Cuts between Person 1 and Person 2
 */
export function A4FourQuadrantGridSheet({
  pageNumber = 1,
  totalPages = 1,
  person1,
  person2 = null,
  user = null,
  onPrintSingle = null,
  onInspect = null,
  onCrop = null
}) {
  const [qr1, setQr1] = useState('');
  const [qr2, setQr2] = useState('');

  const reg1 = person1?.reg || person1;
  const cardData1 = person1?.cardData || getRegistrationCardData(reg1);

  const reg2 = person2?.reg || person2;
  const cardData2 = person2 ? (person2?.cardData || getRegistrationCardData(reg2)) : null;

  useEffect(() => {
    let cancelled = false;
    if (reg1) {
      QRCode.toDataURL(getIdCardQrPayload(reg1), {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M'
      })
        .then((url) => {
          if (!cancelled) setQr1(url);
        })
        .catch(console.error);
    }
    if (reg2) {
      QRCode.toDataURL(getIdCardQrPayload(reg2), {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M'
      })
        .then((url) => {
          if (!cancelled) setQr2(url);
        })
        .catch(console.error);
    }
    return () => {
      cancelled = true;
    };
  }, [reg1, reg2]);

  if (!reg1) return null;

  return (
    <div className="a4-print-sheet relative w-full rounded-3xl border border-slate-700 bg-slate-900/90 shadow-2xl overflow-hidden p-3 sm:p-5 select-none my-6">
      {/* Non-print Sheet Header */}
      <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300 font-black text-xs border border-orange-400/40 shadow-sm">
            A4
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>JRE 2027 • แผ่นที่ {pageNumber} / {totalPages}</span>
              <span className="rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold font-mono">
                ตาราง 4 ช่อง A6 (แนวตั้ง)
              </span>
            </h3>
            <p className="text-[10.5px] text-slate-400">
              1 แผ่น A4 มี 2 คน • ขนาดบัตร A6 (หน้า-หลัง) • หน้าซ้าย หลังขวา พับประกบกึ่งกลางพอดีเป๊ะ
            </p>
          </div>
        </div>

        {onPrintSingle && (
          <button
            type="button"
            onClick={onPrintSingle}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-200 hover:bg-orange-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>พิมพ์แผ่นนี้ (A4)</span>
          </button>
        )}
      </div>

      {/* Outer Cut Marks at the 4 Corners */}
      <span className="absolute top-2 left-2 text-slate-500 font-mono text-xs select-none">⌜</span>
      <span className="absolute top-2 right-2 text-slate-500 font-mono text-xs select-none">⌝</span>
      <span className="absolute bottom-2 left-2 text-slate-500 font-mono text-xs select-none">⌞</span>
      <span className="absolute bottom-2 right-2 text-slate-500 font-mono text-xs select-none">⌟</span>

      {/* =========================================================
          THE 4-CELL TABLE GRID (A4 PORTRAIT)
          Columns: Left (Front A6) | Right (Back A6)
          Rows: Row 1 (Person 1)   | Row 2 (Person 2)
          ========================================================= */}
      <div className="a4-grid-4cell relative w-full grid grid-cols-2 gap-0 border border-slate-700/80 rounded-2xl bg-slate-950/60 overflow-hidden">
        
        {/* Printable Center Vertical Fold Line (Left: 50%) */}
        <div className="print-center-fold-line pointer-events-none absolute inset-y-0 left-1/2 -ml-[1px] w-0 border-l-2 border-dashed border-orange-500/80 z-20 flex flex-col justify-around select-none">
          <div className="no-print -ml-16 bg-orange-500/90 text-slate-950 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider shadow whitespace-nowrap">
            ⤸ พับประกบกึ่งกลาง (Fold Line) ⤸
          </div>
          <div className="no-print -ml-16 bg-orange-500/90 text-slate-950 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider shadow whitespace-nowrap">
            ⤸ พับประกบกึ่งกลาง (Fold Line) ⤸
          </div>
        </div>

        {/* Printable Center Horizontal Cut Line (Top: 50%) */}
        <div className="print-center-cut-line pointer-events-none absolute inset-x-0 top-1/2 -mt-[1px] h-0 border-t-2 border-dashed border-slate-500 z-20 flex items-center justify-center select-none">
          <div className="no-print bg-slate-900 border border-slate-600 text-slate-300 px-3 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider shadow flex items-center gap-1">
            <Scissors className="h-3 w-3 text-orange-400" />
            <span>เส้นตัดแบ่งครึ่งแผ่น A4 (Cut Line) สำหรับ 2 คน</span>
          </div>
        </div>

        {/* -------------------------------------------------------
            ROW 1: PERSON 1 (คนบน)
            ------------------------------------------------------- */}
        {/* Quadrant 1 (Top-Left): Person 1 FRONT - A6 */}
        <div className="a6-quadrant flex flex-col items-center justify-center p-2 sm:p-4 border-r border-b border-dashed border-slate-800">
          {/* Person 1 Action Bar (Non-print) */}
          <div className="no-print w-full flex items-center justify-between pb-1.5 mb-1.5 text-[10px] text-slate-300 border-b border-slate-800/80">
            <div className="flex items-center gap-1 truncate max-w-[170px]">
              <span className="font-mono text-orange-400 font-bold">{cardData1.cardCode}</span>
              <span className="truncate">{cardData1.thaiName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onInspect && (
                <button
                  type="button"
                  onClick={() => onInspect(reg1)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[9.5px] font-bold text-slate-200 hover:text-white hover:border-orange-400 cursor-pointer"
                  title="ตรวจสอบ / แก้ไขบัตร"
                >
                  <Edit3 className="h-2.5 w-2.5 inline mr-0.5 text-orange-400" />
                  ตรวจ/แก้
                </button>
              )}
              {onCrop && (
                <button
                  type="button"
                  onClick={() => onCrop(reg1)}
                  className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-bold text-orange-200 hover:bg-orange-500/20 cursor-pointer"
                  title="ครอปรูปถ่าย"
                >
                  <Scissors className="h-2.5 w-2.5 inline mr-0.5" />
                  ครอปรูป
                </button>
              )}
            </div>
          </div>
          <span className="no-print mb-1 text-[8.5px] font-black uppercase tracking-wider text-orange-400">
            [ คนบน • ด้านหน้า (FRONT) - A6 ]
          </span>
          <A6BadgeCardItem person={person1} user={user} side="front" qrDataUrl={qr1} />
        </div>

        {/* Quadrant 2 (Top-Right): Person 1 BACK - A6 */}
        <div className="a6-quadrant flex flex-col items-center justify-center p-2 sm:p-4 border-b border-dashed border-slate-800">
          <div className="no-print w-full flex items-center justify-between pb-1.5 mb-1.5 text-[10px] text-slate-400 border-b border-slate-800/80">
            <span className="font-mono text-[9px] text-slate-500">BACK OF {cardData1.cardCode}</span>
            <span className="text-[9px] text-sky-400 font-bold">QR เว็บไซต์ JRE2027</span>
          </div>
          <span className="no-print mb-1 text-[8.5px] font-black uppercase tracking-wider text-sky-400">
            [ คนบน • ด้านหลัง (BACK) - A6 ]
          </span>
          <A6BadgeCardItem person={person1} user={user} side="back" />
        </div>

        {/* -------------------------------------------------------
            ROW 2: PERSON 2 (คนล่าง)
            ------------------------------------------------------- */}
        {/* Quadrant 3 (Bottom-Left): Person 2 FRONT - A6 */}
        <div className="a6-quadrant flex flex-col items-center justify-center p-2 sm:p-4 border-r border-dashed border-slate-800">
          {person2 ? (
            <>
              {/* Person 2 Action Bar (Non-print) */}
              <div className="no-print w-full flex items-center justify-between pb-1.5 mb-1.5 text-[10px] text-slate-300 border-b border-slate-800/80">
                <div className="flex items-center gap-1 truncate max-w-[170px]">
                  <span className="font-mono text-orange-400 font-bold">{cardData2.cardCode}</span>
                  <span className="truncate">{cardData2.thaiName}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onInspect && (
                    <button
                      type="button"
                      onClick={() => onInspect(reg2)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[9.5px] font-bold text-slate-200 hover:text-white hover:border-orange-400 cursor-pointer"
                      title="ตรวจสอบ / แก้ไขบัตร"
                    >
                      <Edit3 className="h-2.5 w-2.5 inline mr-0.5 text-orange-400" />
                      ตรวจ/แก้
                    </button>
                  )}
                  {onCrop && (
                    <button
                      type="button"
                      onClick={() => onCrop(reg2)}
                      className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-bold text-orange-200 hover:bg-orange-500/20 cursor-pointer"
                      title="ครอปรูปถ่าย"
                    >
                      <Scissors className="h-2.5 w-2.5 inline mr-0.5" />
                      ครอปรูป
                    </button>
                  )}
                </div>
              </div>
              <span className="no-print mb-1 text-[8.5px] font-black uppercase tracking-wider text-orange-400">
                [ คนล่าง • ด้านหน้า (FRONT) - A6 ]
              </span>
              <A6BadgeCardItem person={person2} user={user} side="front" qrDataUrl={qr2} />
            </>
          ) : (
            <div className="h-[287.5px] w-[230px] rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-600 text-xs">
              <span>(ตำแหน่งว่างสำหรับคนที่ 2)</span>
              <span className="text-[10px] text-slate-700 mt-1">แผ่นสุดท้ายมีจำนวนผู้เข้าร่วมเป็นเลขคี่</span>
            </div>
          )}
        </div>

        {/* Quadrant 4 (Bottom-Right): Person 2 BACK - A6 */}
        <div className="a6-quadrant flex flex-col items-center justify-center p-2 sm:p-4">
          {person2 ? (
            <>
              <div className="no-print w-full flex items-center justify-between pb-1.5 mb-1.5 text-[10px] text-slate-400 border-b border-slate-800/80">
                <span className="font-mono text-[9px] text-slate-500">BACK OF {cardData2.cardCode}</span>
                <span className="text-[9px] text-sky-400 font-bold">QR เว็บไซต์ JRE2027</span>
              </div>
              <span className="no-print mb-1 text-[8.5px] font-black uppercase tracking-wider text-sky-400">
                [ คนล่าง • ด้านหลัง (BACK) - A6 ]
              </span>
              <A6BadgeCardItem person={person2} user={user} side="back" />
            </>
          ) : (
            <div className="h-[287.5px] w-[230px] rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-600 text-xs">
              <span>(ตำแหน่งว่างด้านหลังคนที่ 2)</span>
            </div>
          )}
        </div>

      </div>

      {/* Non-print Footer Guide */}
      <div className="no-print mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
          <span>💡 <strong>วิธีตัด & พับประกบ:</strong> 1. ตัดตามเส้นประแนวนอนกึ่งกลางแบ่งเป็น 2 คน ✂ 2. พับครึ่งตามเส้นประแนวตั้งประกบหน้า-หลังพอดีเป๊ะ A6 ⤸ 3. นำไปเคลือบพลาสติกใส</span>
        </span>
        <span className="font-mono text-amber-300">A4 Portrait (4 Quadrants) • A6 ID Cards</span>
      </div>
    </div>
  );
}

// Backward compatibility alias
export const PersonFoldBadgePair = A4FourQuadrantGridSheet;
