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
  Scissors
} from 'lucide-react';
import { getIdCardQrPayload, getRegistrationCardData } from '../utils/idCard';

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

/**
 * Universal Native ID Card Canvas Generator (FRONT SIDE)
 * Supports:
 * - 'portrait'  -> Exactly 1200 x 1500 PX (CR100 Portrait Standard)
 * - 'landscape' -> 2040 x 1284 PX (CR80 Landscape Standard)
 */
export async function renderNativeIdCardCanvas({ photo, cardData, qrDataUrl, orientation = 'portrait' }) {
  const isPortrait = orientation === 'portrait';
  const W = isPortrait ? PORTRAIT_BASE_WIDTH : LANDSCAPE_BASE_WIDTH;
  const H = isPortrait ? PORTRAIT_BASE_HEIGHT : LANDSCAPE_BASE_HEIGHT;
  const scale = isPortrait ? 2.5 : 3; // 480*2.5 = 1200, 600*2.5 = 1500

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
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

  if (isPortrait) {
    // ==========================================
    // PORTRAIT: 1200 x 1500 PX (BASE 480 x 600)
    // ==========================================
    ctx.save();
    drawRoundedRectPath(ctx, 0, 0, W, H, 22);
    ctx.clip();

    // Background Navy
    ctx.fillStyle = '#07172f';
    ctx.fillRect(0, 0, W, H);

    // Glows
    const topGlow = ctx.createRadialGradient(W - 40, 40, 10, W - 40, 40, 220);
    topGlow.addColorStop(0, 'rgba(249, 115, 22, 0.16)');
    topGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H);

    const bottomGlow = ctx.createRadialGradient(40, H - 40, 10, 40, H - 40, 220);
    bottomGlow.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
    bottomGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, W, H);

    // 1. Top White Header Banner (Height 58px)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, 58);
    if (bannerImg) {
      drawImageContain(ctx, bannerImg, 18, 6, W - 36, 46);
    }
    const headerLineGrad = ctx.createLinearGradient(0, 55, W, 55);
    headerLineGrad.addColorStop(0, '#f97316');
    headerLineGrad.addColorStop(0.5, '#fbbf24');
    headerLineGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = headerLineGrad;
    ctx.fillRect(0, 54.5, W, 3.5);

    // 2. Subheader Bar (y=66)
    ctx.save();
    drawRoundedRectPath(ctx, 22, 66, 28, 28, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (logoImg) {
      drawImageContain(ctx, logoImg, 24, 68, 24, 24);
    }
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fdba74';
    ctx.font = `900 9.5px ${fontStack}`;
    ctx.fillText('USIVN • JRE 2027', 58, 74);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 7.5px ${fontStack}`;
    ctx.fillText('JOINT RESPONSE EXERCISE', 58, 86);

    // Right: OFFICIAL Pill
    const offW = 62;
    const offH = 22;
    const offX = W - 22 - offW;
    const offY = 68;
    ctx.save();
    drawRoundedRectPath(ctx, offX, offY, offW, offH, 11);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fdba74';
    ctx.font = `900 8.5px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OFFICIAL', offX + offW / 2, offY + offH / 2);
    ctx.restore();

    // 3. Centered Participant Photo (pw=132, ph=162)
    const pw = 132;
    const ph = 162;
    const px = Math.round((W - pw) / 2);
    const py = 104;

    ctx.save();
    drawRoundedRectPath(ctx, px, py, pw, ph, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.clip();
    if (portraitImg) {
      drawImageCover(ctx, portraitImg, px, py, pw, ph);
    }
    // Bottom role label bar inside photo
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(px, py + ph - 22, pw, 22);
    ctx.fillStyle = cardData.isStaff ? '#fde047' : '#fdba74';
    ctx.font = `900 8.5px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.roleBadge || 'PARTICIPANT', px + pw / 2, py + ph - 11);
    ctx.restore();

    ctx.save();
    drawRoundedRectPath(ctx, px, py, pw, ph, 14);
    ctx.strokeStyle = cardData.isStaff ? 'rgba(250, 204, 21, 0.9)' : 'rgba(251, 146, 60, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 4. Centered Names & Identity
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 8px ${fontStack}`;
    ctx.fillText('ชื่อ–สกุล / FULL NAME', W / 2, 280);

    let thaiFontSize = 20;
    ctx.font = `900 ${thaiFontSize}px ${fontStack}`;
    while (thaiFontSize > 13 && ctx.measureText(cardData.thaiName || '').width > (W - 48)) {
      thaiFontSize -= 1;
      ctx.font = `900 ${thaiFontSize}px ${fontStack}`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.thaiName, W - 48), W / 2, 300);

    let enFontSize = 12.5;
    ctx.font = `600 ${enFontSize}px ${fontStack}`;
    while (enFontSize > 10 && ctx.measureText(cardData.englishName || '').width > (W - 48)) {
      enFontSize -= 0.5;
      ctx.font = `600 ${enFontSize}px ${fontStack}`;
    }
    ctx.fillStyle = '#fdba74';
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.englishName, W - 48), W / 2, 320);

    // Badges Row
    const hasCallsign = cardData.callsign && cardData.callsign !== '-';
    const hasNickname = cardData.nickname && cardData.nickname !== '-';

    if (hasCallsign || hasNickname) {
      const pills = [];
      if (hasCallsign) pills.push({ text: `📡 ${cardData.callsign}`, type: 'callsign' });
      if (hasNickname) pills.push({ text: `Nickname: ${cardData.nickname}`, type: 'nickname' });

      ctx.font = `800 9px ${fontStack}`;
      const pillGap = 8;
      const pillH = 22;
      let totalPillW = 0;
      const measuredPills = pills.map((p) => {
        const tw = Math.min(180, Math.ceil(ctx.measureText(p.text).width));
        const pwLocal = tw + 16;
        totalPillW += pwLocal;
        return { ...p, width: pwLocal, textWidth: tw };
      });
      totalPillW += (pills.length - 1) * pillGap;

      let startX = Math.round((W - totalPillW) / 2);
      measuredPills.forEach((p) => {
        ctx.save();
        drawRoundedRectPath(ctx, startX, 332, p.width, pillH, 6);
        if (p.type === 'callsign') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#bae6fd';
          ctx.font = `900 9px ${monoStack}`;
        } else {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#fde68a';
          ctx.font = `700 9px ${fontStack}`;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fitTextWithEllipsis(ctx, p.text, p.width - 10), startX + p.width / 2, 332 + pillH / 2);
        ctx.restore();
        startX += p.width + pillGap;
      });
    }

    // 5. Organizational Credentials
    const affX = 24;
    const affY = 362;
    const affW = W - 48;
    const affH = 40;

    ctx.save();
    drawRoundedRectPath(ctx, affX, affY, affW, affH, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 8px ${fontStack}`;
    ctx.fillText('สังกัด / AFFILIATION', affX + 10, affY + 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 12px ${fontStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.affiliation, affW - 20), affX + 10, affY + 28);
    ctx.restore();

    const row2Y = 408;
    const colGap = 8;
    const colW = (affW - colGap) / 2;

    ctx.save();
    drawRoundedRectPath(ctx, affX, row2Y, colW, 40, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 8px ${fontStack}`;
    ctx.fillText('หน่วย / UNIT', affX + 10, row2Y + 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 11.5px ${fontStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.unit, colW - 20), affX + 10, row2Y + 28);
    ctx.restore();

    const idX = affX + colW + colGap;
    ctx.save();
    drawRoundedRectPath(ctx, idX, row2Y, colW, 40, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 8px ${fontStack}`;
    ctx.fillText('รหัสบัตร / BADGE ID', idX + 10, row2Y + 12);

    ctx.fillStyle = '#fdba74';
    ctx.font = `900 11px ${monoStack}`;
    ctx.fillText(fitTextWithEllipsis(ctx, cardData.cardCode, colW - 20), idX + 10, row2Y + 28);
    ctx.restore();

    // 6. Bottom Section: QR Code, Blood Group & Verified Bar
    const botY = 456;
    const botH = 110;

    const qx = 24;
    const qw = 108;
    ctx.save();
    drawRoundedRectPath(ctx, qx, botY, qw, botH, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    if (qrImg) {
      drawImageContain(ctx, qrImg, qx + 8, botY + 8, qw - 16, qw - 16);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ea580c';
    ctx.font = `900 7.5px ${fontStack}`;
    ctx.fillText('ADMIN QR SCAN', qx + qw / 2, botY + botH - 10);
    ctx.restore();

    const bx = 140;
    const bw = 104;
    ctx.save();
    drawRoundedRectPath(ctx, bx, botY, bw, botH, 12);
    ctx.fillStyle = 'rgba(251, 113, 133, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fecdd3';
    ctx.font = `700 8px ${fontStack}`;
    ctx.fillText('BLOOD', bx + bw / 2, botY + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 32px ${fontStack}`;
    ctx.fillText(cardData.bloodGroup || '-', bx + bw / 2, botY + 54);

    ctx.fillStyle = '#fb7185';
    ctx.font = `700 7.5px ${fontStack}`;
    ctx.fillText('TYPE', bx + bw / 2, botY + 92);
    ctx.restore();

    const vx = 252;
    const vw = affW - qw - bw - colGap * 2;
    ctx.save();
    drawRoundedRectPath(ctx, vx, botY, vw, botH, 12);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6ee7b7';
    ctx.font = `900 13px ${fontStack}`;
    ctx.fillText('✓ VERIFIED', vx + vw / 2, botY + 28);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = `700 8px ${fontStack}`;
    ctx.fillText('UNIVERSAL SCANNER READY', vx + vw / 2, botY + 52);

    ctx.fillStyle = '#fdba74';
    ctx.font = `800 8px ${monoStack}`;
    ctx.fillText('1200 × 1500 PX STANDARD', vx + vw / 2, botY + 76);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 7.5px ${fontStack}`;
    ctx.fillText('CR100 VERTICAL BADGE', vx + vw / 2, botY + 94);
    ctx.restore();

    // 7. Bottom Gradient Line & Border
    const bottomLineGrad = ctx.createLinearGradient(0, H - 4, W, H - 4);
    bottomLineGrad.addColorStop(0, '#f97316');
    bottomLineGrad.addColorStop(0.5, '#fbbf24');
    bottomLineGrad.addColorStop(1, '#ea580c');
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

  const backImg = await loadCanvasImage(BADGE_BACK_IMAGE);

  ctx.save();
  drawRoundedRectPath(ctx, 0, 0, W, H, 22);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  if (backImg) {
    drawImageContain(ctx, backImg, 12, 12, W - 24, H - 24);
  }
  ctx.restore();

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
 * Official JRE 2027 Website QR Card
 */
export function CardInnerContentBack() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white p-4 overflow-hidden rounded-[22px] select-none shadow-2xl">
      <img
        src={BADGE_BACK_IMAGE}
        alt="เว็บไซต์ JRE2027 QR Code"
        className="h-full w-full object-contain"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PHOTO;
        }}
      />
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
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[9px] font-bold font-mono">
                {isPortrait ? 'แนวตั้ง 1200×1500 PX' : 'แนวนอน CR80'}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {isPortrait
                ? 'บัตรจริงเชื่อมกับข้อมูลใบสมัครของบุคคลนี้โดยตรง (แนวตั้ง 1200 × 1500 PX / CR100 Standard)'
                : 'บัตรจริงเชื่อมกับข้อมูลใบสมัครของบุคคลนี้โดยตรง (CR80 Standard แนวนอน)'}
            </p>
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
                <CardInnerContentBack />
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
                  <CardInnerContentBack />
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
 */
export function CardInnerContentPortrait({
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
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-sky-500/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Top Header Banner */}
        <div className="relative h-[58px] shrink-0 overflow-hidden bg-white px-4 py-2">
          <img
            src="/images/logo/jre_header_banner.png"
            alt="Joint Response Exercise JRE 2027"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between px-5 pb-3 pt-2.5">
          {/* Subheader: Event Branding & Roles */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src="/images/logo/jre_logo_square.png"
                alt="USIVN"
                className="h-7 w-7 shrink-0 rounded-lg border border-orange-400/40 bg-white object-contain p-0.5"
              />
              <div className="min-w-0">
                <p className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.16em] text-orange-300 leading-tight">
                  USIVN • JRE 2027
                </p>
                <p className="whitespace-nowrap text-[7.5px] font-medium text-slate-400 leading-tight">
                  JOINT RESPONSE EXERCISE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                cardData.isStaff 
                  ? 'border-yellow-400/60 bg-yellow-500/15 text-yellow-300' 
                  : 'border-orange-400/50 bg-orange-500/15 text-orange-300'
              }`}>
                {cardData.roleBadge || 'PARTICIPANT'}
              </span>
              <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-orange-300">
                OFFICIAL
              </span>
            </div>
          </div>

          {/* Centered Photo Section */}
          <div className="flex flex-col items-center justify-center my-0.5">
            <div className={`relative h-[162px] w-[132px] shrink-0 overflow-hidden rounded-2xl border-2 shadow-xl shadow-black/40 ${
              cardData.isStaff ? 'border-yellow-400/90' : 'border-orange-400/90'
            }`}>
              <img
                src={photo}
                alt={`รูปประจำตัว ${cardData.thaiName}`}
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_PHOTO;
                }}
              />
              <div className={`absolute inset-x-0 bottom-0 bg-slate-950/90 px-1 py-1 text-center text-[8.5px] font-black tracking-[0.1em] ${
                cardData.isStaff ? 'text-yellow-300' : 'text-orange-300'
              }`}>
                {cardData.roleBadge || 'PARTICIPANT'}
              </div>
            </div>
          </div>

          {/* Centered Names & Badges */}
          <div className="flex flex-col items-center text-center px-1">
            <p className="text-[7.5px] font-bold uppercase tracking-[0.18em] text-slate-400 leading-none">
              ชื่อ–สกุล / Full name
            </p>
            <h2
              className={`mt-1 font-black leading-tight text-white whitespace-nowrap max-w-full truncate ${thaiNameClass}`}
              title={cardData.thaiName}
            >
              {cardData.thaiName}
            </h2>
            <p
              className={`mt-0.5 font-semibold leading-tight text-orange-300 whitespace-nowrap max-w-full truncate ${enNameClass}`}
              title={cardData.englishName}
            >
              {cardData.englishName}
            </p>

            {/* Callsign & Nickname Badges Row */}
            {(hasCallsign || hasNickname) && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5">
                {hasCallsign && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/35 bg-sky-400/15 px-2 py-0.5 text-[9px] font-black font-mono text-sky-200">
                    📡 {cardData.callsign}
                  </span>
                )}
                {hasNickname && (
                  <span className="inline-flex items-center rounded-md border border-amber-400/35 bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-200" title={cardData.nickname}>
                    Nickname: {cardData.nickname}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Organizational Credentials */}
          <div className="space-y-1.5 pt-1">
            <div className="rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5">
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
                สังกัด / Affiliation
              </span>
              <span className="mt-1 block text-[12px] font-bold text-white truncate" title={cardData.affiliation}>
                {cardData.affiliation || '-'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5">
                <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
                  หน่วย / Unit
                </span>
                <span className="mt-1 block text-[11px] font-bold text-white truncate" title={cardData.unit}>
                  {cardData.unit || '-'}
                </span>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5">
                <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
                  รหัสบัตร / Badge ID
                </span>
                <span className="mt-1 block text-[11px] font-black font-mono text-orange-300 truncate tracking-wide" title={cardData.cardCode}>
                  {cardData.cardCode || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Verification Section: QR + Blood Type + Verified Box */}
          <div className="flex items-stretch gap-2 pt-1 border-t border-white/10">
            {/* QR Code */}
            <div className="flex w-[104px] shrink-0 flex-col items-center justify-between rounded-xl bg-white p-1.5 shadow-md">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code สำหรับ Admin สแกน"
                  className="aspect-square w-full object-contain"
                />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded bg-slate-200" />
              )}
              <span className="text-[7.5px] font-black text-orange-600 tracking-wider uppercase leading-none mt-0.5">
                ADMIN QR SCAN
              </span>
            </div>

            {/* Blood Type Box */}
            <div className="flex w-[100px] shrink-0 flex-col justify-between rounded-xl border border-rose-400/40 bg-rose-400/10 p-1.5 text-center">
              <span className="block text-[7.5px] font-bold uppercase tracking-wider text-rose-200 leading-none">
                Blood
              </span>
              <strong className="block text-[28px] font-black leading-none text-white my-auto">
                {cardData.bloodGroup || '-'}
              </strong>
              <span className="block text-[7.5px] font-bold text-rose-300 uppercase leading-none">
                Type
              </span>
            </div>

            {/* Verified Box */}
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-2 text-center">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <strong className="mt-1 block text-[11px] font-black tracking-wider text-emerald-300 leading-none">
                ✓ VERIFIED
              </strong>
              <span className="mt-1 block text-[7.5px] font-bold text-emerald-200/90 leading-tight">
                Universal Scan Ready
              </span>
              <span className="mt-0.5 block text-[7.5px] font-mono text-orange-300 leading-tight">
                1200×1500 PX
              </span>
            </div>
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
              <div className={`absolute inset-x-0 bottom-0 bg-slate-950/90 px-1 py-1 text-center text-[8px] font-black tracking-[0.1em] ${cardData.isStaff ? 'text-yellow-300' : 'text-orange-300'}`}>
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
 * PERSON FOLD BADGE PAIR (FRONT + CENTER FOLD + BACK)
 * For 2-person A4 Print Sheet with Clear Outer Cut Line and Center Fold Line
 * Designed for Laminating (พับประกบหน้า-หลังแล้วเคลือบ)
 */
export function PersonFoldBadgePair({
  person,
  user = null,
  onPrintSingle = null
}) {
  const reg = person?.reg || person;
  const cardData = person?.cardData || getRegistrationCardData(reg);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!reg) return undefined;
    let cancelled = false;

    QRCode.toDataURL(getIdCardQrPayload(reg), {
      width: 360,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [reg]);

  if (!reg) return null;

  const photo = cardData.photo || user?.avatar || FALLBACK_PHOTO;
  const thaiNameLen = (cardData.thaiName || '').length;
  const thaiNameClass = thaiNameLen > 38 ? 'text-[12px]' : thaiNameLen > 24 ? 'text-[14px]' : 'text-[16px]';
  const enNameLen = (cardData.englishName || '').length;
  const enNameClass = enNameLen > 32 ? 'text-[10px]' : 'text-[11.5px]';
  const hasCallsign = cardData.callsign && cardData.callsign !== '-';
  const hasNickname = cardData.nickname && cardData.nickname !== '-';

  return (
    <div className="person-fold-box relative w-full rounded-2xl border-2 border-dashed border-slate-500 bg-slate-950/70 p-2.5 sm:p-3 my-1">
      {/* Corner Crop Marks for Cutter */}
      <span className="absolute -top-1.5 -left-1.5 text-slate-400 font-mono text-xs select-none">⌜</span>
      <span className="absolute -top-1.5 -right-1.5 text-slate-400 font-mono text-xs select-none">⌝</span>
      <span className="absolute -bottom-1.5 -left-1.5 text-slate-400 font-mono text-xs select-none">⌞</span>
      <span className="absolute -bottom-1.5 -right-1.5 text-slate-400 font-mono text-xs select-none">⌟</span>

      {/* Top Outer Cut Line Indicator */}
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pb-1.5 border-b border-dashed border-slate-700 select-none">
        <span className="flex items-center gap-1 text-orange-400">
          <Scissors className="h-3 w-3" />
          เส้นตัดขอบนอกสำหรับเคลือบ (Outer Cut Line)
        </span>
        <span className="font-mono text-white text-[9.5px]">
          {cardData.cardCode} • {cardData.thaiName}
        </span>
        <span className="text-amber-400 font-mono">
          1200 × 1500 PX
        </span>
      </div>

      {/* Side-by-Side: Front + Center Fold + Back */}
      <div className="flex items-center justify-center gap-3 py-2">
        {/* FRONT CARD */}
        <div className="flex flex-col items-center">
          <span className="mb-1 text-[8.5px] font-black uppercase tracking-wider text-orange-400">
            [ ด้านหน้า (FRONT) ]
          </span>
          <div
            style={{ width: '220px', height: '275px' }}
            className="relative shrink-0 overflow-hidden rounded-[14px] border border-slate-600 bg-[#07172f] shadow-md text-white select-none"
          >
            <div style={{ transform: 'scale(0.4583)', transformOrigin: 'top left', width: '480px', height: '600px' }}>
              <CardInnerContentPortrait
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
        </div>

        {/* CENTER FOLD LINE WITH FOLD ARROWS */}
        <div className="flex flex-col items-center justify-center h-full px-1 border-l-2 border-dashed border-orange-500/90 select-none">
          <div className="text-[8.5px] font-black text-orange-400 bg-orange-500/10 px-1 py-3 rounded-md border border-orange-400/40 text-center uppercase tracking-widest whitespace-nowrap">
            ⤸ พับประกบกึ่งกลาง (FOLD HERE) ⤸
          </div>
        </div>

        {/* BACK CARD */}
        <div className="flex flex-col items-center">
          <span className="mb-1 text-[8.5px] font-black uppercase tracking-wider text-sky-400">
            [ ด้านหลัง (BACK) ]
          </span>
          <div
            style={{ width: '220px', height: '275px' }}
            className="relative shrink-0 overflow-hidden rounded-[14px] border border-slate-600 bg-white shadow-md p-1.5 flex items-center justify-center select-none"
          >
            <img
              src={BADGE_BACK_IMAGE}
              alt="JRE 2027 Website QR"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_PHOTO;
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Laminating Instruction */}
      <div className="flex items-center justify-between text-[8.5px] text-slate-400 pt-1.5 border-t border-dashed border-slate-700">
        <span className="text-emerald-300 font-semibold">
          ✂ ตัดตามรอยประรอบนอก ⤸ พับประกบกึ่งกลาง แล้วเคลือบพลาสติก (Laminate) ขนาดพอดีกัน 100%
        </span>
        {onPrintSingle && (
          <button
            type="button"
            onClick={onPrintSingle}
            className="no-print inline-flex items-center gap-1 rounded-md border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-300 hover:bg-orange-500/20 cursor-pointer"
          >
            <Printer className="h-3 w-3" />
            พิมพ์คู่นี้
          </button>
        )}
      </div>
    </div>
  );
}
