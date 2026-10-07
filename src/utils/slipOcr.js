import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';

/**
 * Known Thai Bank Code Mapping (Bank of Thailand / ITMX Standards)
 */
export const THAI_BANK_CODES = {
  '002': 'ธนาคารกรุงเทพ (BBL)',
  '004': 'ธนาคารกสิกรไทย (K PLUS)',
  '006': 'ธนาคารกรุงไทย (Krungthai NEXT)',
  '011': 'ธนาคารทหารไทยธนชาต (ttb)',
  '014': 'ธนาคารไทยพาณิชย์ (SCB EASY)',
  '025': 'ธนาคารกรุงศรีอยุธยา (KMA)',
  '030': 'ธนาคารออมสิน (MyMo)',
  '034': 'ธ.ก.ส. (BAAC)',
  '069': 'ธนาคารเกียรตินาคินภัทร (KKP)',
  '073': 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)'
};

/**
 * Format current date-time in readable Thai
 */
export function formatThaiDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day} ${month} ${yearBE} เวลา ${hours}:${minutes}:${seconds} น.`;
}

/**
 * Parse TLV (Tag-Length-Value) blocks found in Thai QR standards & EMVCo
 */
export function parseTLV(payload) {
  if (!payload || typeof payload !== 'string') return {};
  const tags = {};
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.substr(i, 2);
    const len = parseInt(payload.substr(i + 2, 2), 10);
    if (isNaN(len) || i + 4 + len > payload.length) break;
    const val = payload.substr(i + 4, len);
    tags[tag] = val;
    i += 4 + len;
  }
  return tags;
}

/**
 * Parse Thai Bank Slip QR code data (ITMX Mini QR / PromptPay EMVCo / URL)
 */
export function parseSlipQrData(qrRaw) {
  if (!qrRaw || typeof qrRaw !== 'string') return null;
  const raw = qrRaw.trim();
  const info = {
    raw,
    type: 'generic',
    typeName: 'QR Code ทั่วไป',
    bank: null,
    bankCode: null,
    transRef: null,
    amount: null,
    date: null,
    country: null,
    summary: []
  };

  // Case 1: Thai Bank SlipVerify (ITMX Mini QR)
  // Format standard: starts with 0038, 0046, 0049, 0051, 0054, 0055
  if (/^(?:0038|0046|0049|0051|0054|0055)/.test(raw)) {
    info.type = 'slip_verify';
    info.typeName = 'สลิปมาตรฐาน Thai QR Payment (SlipVerify Mini QR)';

    const outerTags = parseTLV(raw);
    if (outerTags['51']) {
      info.country = outerTags['51'];
    }

    // Sub-tags inside outer Tag 00
    if (outerTags['00']) {
      const innerTags = parseTLV(outerTags['00']);
      if (innerTags['01'] && THAI_BANK_CODES[innerTags['01']]) {
        info.bankCode = innerTags['01'];
        info.bank = THAI_BANK_CODES[innerTags['01']];
        info.summary.push(`ธนาคาร: ${info.bank}`);
      }
      if (innerTags['02']) {
        info.transRef = innerTags['02'];
        info.summary.push(`รหัสอ้างอิงธุรกรรม (TransRef): ${info.transRef}`);
      }
    }

    // Fallback regex extraction if nested tags vary by bank implementation
    if (!info.transRef) {
      const refMatch = raw.match(/02([0-9]{2})([A-Za-z0-9_-]+)/);
      if (refMatch) {
        const len = parseInt(refMatch[1], 10);
        info.transRef = refMatch[2].slice(0, len);
        info.summary.push(`รหัสอ้างอิงธุรกรรม: ${info.transRef}`);
      }
    }
    if (!info.bank) {
      const bankMatch = raw.match(/01([0-9]{2})([0-9]{3})/);
      if (bankMatch && THAI_BANK_CODES[bankMatch[2]]) {
        info.bankCode = bankMatch[2];
        info.bank = THAI_BANK_CODES[bankMatch[2]];
        info.summary.push(`ธนาคาร: ${info.bank}`);
      }
    }
  }

  // Case 2: PromptPay EMVCo QR (000201...)
  else if (raw.startsWith('000201')) {
    info.type = 'promptpay';
    info.typeName = 'สลิปพร้อมเพย์ QR (PromptPay EMVCo)';
    const tags = parseTLV(raw);
    if (tags['54']) {
      const amt = parseFloat(tags['54']);
      if (!isNaN(amt) && amt > 0) {
        info.amount = amt;
        info.summary.push(`ยอดเงินใน QR: ${amt.toFixed(2)} บาท`);
      }
    }
    if (tags['58']) {
      info.country = tags['58'];
    }
    if (tags['62']) {
      const sub = parseTLV(tags['62']);
      info.transRef = sub['05'] || sub['01'] || tags['62'];
      info.summary.push(`รหัสอ้างอิง: ${info.transRef}`);
    }
  }

  // Case 3: Web Verification Link
  else if (raw.startsWith('http://') || raw.startsWith('https://')) {
    info.type = 'url';
    info.typeName = 'ลิงก์ตรวจสอบสลิปออนไลน์ (Verification URL)';
    try {
      const u = new URL(raw);
      if (/scb/i.test(u.hostname)) info.bank = 'ธนาคารไทยพาณิชย์ (SCB EASY)';
      else if (/ktb|krungthai/i.test(u.hostname)) info.bank = 'ธนาคารกรุงไทย (Krungthai NEXT)';
      else if (/kbank|kasikorn/i.test(u.hostname)) info.bank = 'ธนาคารกสิกรไทย (K PLUS)';
      
      const ref = u.searchParams.get('ref') || u.searchParams.get('transRef') || u.searchParams.get('id');
      if (ref) {
        info.transRef = ref;
        info.summary.push(`รหัสอ้างอิง: ${ref}`);
      }
    } catch (e) {}
    info.summary.push(`URL: ${raw}`);
  } else {
    info.summary.push(`ข้อมูลใน QR: ${raw}`);
  }

  return info;
}

/**
 * Ensure an offscreen DOM element exists so Html5Qrcode constructor doesn't throw
 */
function getOrCreateQrSandbox() {
  if (typeof document === 'undefined') return null;
  const id = 'qr-reader-hidden-scan-sandbox';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.left = '-9999px';
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
  }
  return id;
}

/**
 * Helper to render Blob/File to Canvas and extract ImageData
 */
async function getImageCanvas(blob) {
  if (typeof window === 'undefined' || !blob) return null;

  // Modern browsers: createImageBitmap is ultra-fast and handles EXIF orientation
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      return { canvas, ctx, width: bitmap.width, height: bitmap.height };
    } catch (e) {}
  }

  // Fallback: HTMLImageElement
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * High-res multi-pass QR Code scanner using jsQR with Html5Qrcode fallback
 */
export async function scanQrCodeFromImageBlob(blob) {
  if (!blob) return null;

  try {
    const canvasData = await getImageCanvas(blob);
    if (canvasData && canvasData.ctx) {
      const { canvas, ctx, width, height } = canvasData;

      // Pass 1: Full image scan with jsQR
      let fullImgData = ctx.getImageData(0, 0, width, height);
      let code = jsQR(fullImgData.data, width, height, { inversionAttempts: 'attemptBoth' });
      if (code?.data) return code.data;

      // Pass 2: Top-Right Quadrant (Standard location for Krungthai NEXT / KTB slips)
      const trW = Math.floor(width * 0.65);
      const trH = Math.floor(height * 0.55);
      const trX = width - trW;
      const trData = ctx.getImageData(trX, 0, trW, trH);
      code = jsQR(trData.data, trW, trH, { inversionAttempts: 'attemptBoth' });
      if (code?.data) return code.data;

      // Pass 3: Bottom Half (Standard location for SCB, KBank, PromptPay slips)
      const bH = Math.floor(height * 0.65);
      const bY = height - bH;
      const bData = ctx.getImageData(0, bY, width, bH);
      code = jsQR(bData.data, width, bH, { inversionAttempts: 'attemptBoth' });
      if (code?.data) return code.data;

      // Pass 4: Downscaled pass if image is very large (> 1600px)
      if (width > 1600 || height > 1600) {
        const scale = Math.min(1200 / width, 1200 / height);
        const sW = Math.floor(width * scale);
        const sH = Math.floor(height * scale);
        const sCanvas = document.createElement('canvas');
        sCanvas.width = sW;
        sCanvas.height = sH;
        const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });
        sCtx.drawImage(canvas, 0, 0, sW, sH);
        const sData = sCtx.getImageData(0, 0, sW, sH);
        code = jsQR(sData.data, sW, sH, { inversionAttempts: 'attemptBoth' });
        if (code?.data) return code.data;
      }
    }
  } catch (err) {
    console.warn('jsQR scan notice:', err);
  }

  // Pass 5: Fallback to Html5Qrcode
  try {
    const sandboxId = getOrCreateQrSandbox();
    if (sandboxId) {
      const html5QrCode = new Html5Qrcode(sandboxId, { verbose: false });
      const res = await html5QrCode.scanFile(blob, false);
      try { await html5QrCode.clear(); } catch (e) {}
      if (res) return res;
    }
  } catch (qrErr) {}

  return null;
}

/**
 * Extract time from slip text safely without matching decimal numbers (e.g. 650.00)
 */
function extractTime(str) {
  if (!str) return null;
  // 1. Colon separated: 00:13 or 14:35:20
  const m1 = str.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\s*(?:น\.|น|am|pm)?\b/i);
  if (m1) return m1[0].trim();

  // 2. Dot separated only if followed by น. or am/pm to avoid matching decimal amounts like 400.00
  const m2 = str.match(/\b([01]?\d|2[0-3])\.([0-5]\d)\s*(?:น\.|น|am|pm)\b/i);
  if (m2) return m2[0].trim();

  return null;
}

/**
 * Extract date from slip text (Thai and International formats)
 */
function extractDate(str) {
  if (!str) return null;
  // 1. Thai date: e.g. 23 มี.ค. 2569 or 07 ต.ค. 2569
  const mThai = str.match(/([0-3]?\d\s*(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(?:25)?\d{2})/);
  if (mThai) return mThai[1].trim();

  // 2. English date: e.g. 07 Oct 2026 or 7 October 2026
  const mEng = str.match(/([0-3]?\d\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:20)?\d{2})/i);
  if (mEng) return mEng[1].trim();

  // 3. Numeric date: e.g. 07/10/2026 or 07-10-2569
  const mNum = str.match(/\b([0-3]?\d[\/\-][01]?\d[\/\-](?:25\d{2}|20\d{2}|\d{2}))\b/);
  if (mNum) return mNum[1].trim();

  return null;
}

/**
 * Parse OCR raw text to find transfer amount, date, time and bank
 */
export function parseSlipText(text, expectedAmount = null) {
  if (!text || typeof text !== 'string') {
    return {
      isBankSlip: false,
      bankDetected: null,
      detectedAmount: null,
      transferDate: null,
      transferTime: null
    };
  }

  let cleaned = text.replace(/\r\n/g, '\n').trim();

  // Normalize spaces around dots and commas between numbers (e.g. "650 . 00" -> "650.00", "10 . 00" -> "10.00")
  cleaned = cleaned.replace(/(\d+)\s*[\.]\s*(\d{2})\b/g, '$1.$2');
  cleaned = cleaned.replace(/(\d+)\s*[,]\s*(\d{2})\b/g, '$1.$2');

  // 1. Detect Bank
  let bankDetected = null;
  if (/krungthai|กรุงไทย|ktb|next/i.test(cleaned)) bankDetected = 'ธนาคารกรุงไทย (Krungthai NEXT)';
  else if (/kbank|กสิกร|k plus|kasikorn/i.test(cleaned)) bankDetected = 'ธนาคารกสิกรไทย (K PLUS)';
  else if (/scb|ไทยพาณิชย์|easy/i.test(cleaned)) bankDetected = 'ธนาคารไทยพาณิชย์ (SCB EASY)';
  else if (/bangkok\s*bank|กรุงเทพ|bbl|bualuang/i.test(cleaned)) bankDetected = 'ธนาคารกรุงเทพ (BBL)';
  else if (/ttb|ทหารไทยธนชาต|thanachart/i.test(cleaned)) bankDetected = 'ธนาคารทหารไทยธนชาต (ttb)';
  else if (/gsb|ออมสิน|mymo/i.test(cleaned)) bankDetected = 'ธนาคารออมสิน (MyMo)';
  else if (/bay|krungsri|กรุงศรี/i.test(cleaned)) bankDetected = 'ธนาคารกรุงศรีอยุธยา (KMA)';
  else if (/promptpay|พร้อมเพย์/i.test(cleaned)) bankDetected = 'พร้อมเพย์ (PromptPay)';

  // General transfer indicators in Thai bank slips (including English OCR transcriptions like JuduLdU, a1sssu)
  const hasTransferKeyword = /โอนเงิน|โอนสำเร็จ|สำเร็จ|รายการสำเร็จ|ผู้รับเงิน|ผู้โอน|ยอดโอน|จำนวนเงิน|ยอดเงิน|รหัสอ้างอิง|เลขที่รายการ|transfer|transferred|successful|success|payment|paid|bscan|slip|juduldu|judul|juduan|tuau|a1sssu|ska3103/i.test(cleaned);

  const isBankSlip = Boolean(bankDetected || hasTransferKeyword);

  if (isBankSlip && !bankDetected) {
    bankDetected = 'สลิปการโอนเงินธนาคาร';
  }

  // 2. Detect Amount
  let detectedAmount = null;

  if (isBankSlip) {
    // A. Check if expectedAmount matches numbers in text first
    if (expectedAmount) {
      const numExpected = Number(expectedAmount);
      const expectedRegex = new RegExp(`(?:^|\\D)${numExpected}(?:\\.00)?(?:$|\\D)`);
      if (expectedRegex.test(cleaned)) {
        detectedAmount = numExpected;
      }
    }

    // B. Explicit amount keywords:
    // "จำนวนเงิน 10.00 บาท", "JuduLdU 10.00 un", "Amount 650.00 THB", "650.00 บาท"
    if (!detectedAmount) {
      const explicitAmountPatterns = [
        /(?:จำนวนเงิน|จำนวน|ยอดเงิน|ยอดโอน|โอนสำเร็จ|ยอดชำระ|amount|transferred|paid|juduldu|judul|juduan|tuau)\s*[:\s-]*\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i,
        /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\s*(?:บาท|thb|baht|un|uin|uln|th)\b/i
      ];

      for (const regex of explicitAmountPatterns) {
        const match = cleaned.match(regex);
        if (match && match[1]) {
          const num = parseFloat(match[1].replace(/,/g, ''));
          // Any positive non-zero transfer amount
          if (!isNaN(num) && num > 0 && num <= 100000) {
            detectedAmount = num;
            break;
          }
        }
      }
    }

    // C. Decimal currency amount: e.g. 10.00, 400.00, 650.00 (Excluding 0.00 fee)
    if (!detectedAmount) {
      const allDecimals = [...cleaned.matchAll(/\b([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})\b/g)];
      for (const m of allDecimals) {
        const num = parseFloat(m[1].replace(/,/g, ''));
        // Filter out 0.00 which is typically fee (ค่าธรรมเนียม 0.00 บาท)
        if (!isNaN(num) && num > 0 && num <= 100000) {
          if (expectedAmount && Math.abs(num - Number(expectedAmount)) < 0.01) {
            detectedAmount = num;
            break;
          }
          if (!detectedAmount) {
            detectedAmount = num;
          }
        }
      }
    }

    // D. Integer amount if followed by Thai or currency indicators
    if (!detectedAmount) {
      const intMatch = cleaned.match(/\b([1-9][0-9]{0,4})\s*(?:บาท|thb|baht|un|uin)\b/i);
      if (intMatch) {
        const num = parseFloat(intMatch[1]);
        if (!isNaN(num) && num > 0 && num <= 100000) {
          detectedAmount = num;
        }
      }
    }
  }

  // 3. Detect Transfer Date & Time
  let transferDate = null;
  let transferTime = null;

  if (isBankSlip) {
    transferTime = extractTime(cleaned);
    transferDate = extractDate(cleaned);
  }

  return {
    isBankSlip,
    bankDetected,
    detectedAmount,
    transferDate,
    transferTime
  };
}

/**
 * Reusable singleton Tesseract worker for high performance
 */
let sharedTesseractWorker = null;

async function getSharedWorker() {
  if (!sharedTesseractWorker) {
    try {
      const worker = await createWorker('eng');
      sharedTesseractWorker = worker;
    } catch (err) {
      console.warn('Worker initialization error:', err);
      sharedTesseractWorker = null;
    }
  }
  return sharedTesseractWorker;
}

/**
 * Scan slip image using combined high-accuracy QR code decoding and OCR
 * @param {File|Blob} file The uploaded image file
 * @param {number} expectedAmount Optional expected amount (e.g. 400 or 650 or 250)
 */
export async function scanSlipImage(file, expectedAmount = null) {
  const uploadTime = new Date();
  const uploadTimeStr = formatThaiDateTime(uploadTime);

  const result = {
    isScanned: true,
    isDetected: false,        // True ONLY if real amount or bank slip was verified
    isBankSlip: false,        // True if bank/transfer context found
    status: 'unverified',     // 'verified' | 'mismatch' | 'unverified'
    uploadedAt: uploadTime.toISOString(),
    uploadTimeStr,
    amount: null,
    amountFormatted: null,
    transferDate: null,
    transferTime: null,
    transferDateTimeStr: null,
    bankDetected: null,
    qrDetected: false,
    qrRaw: null,
    qrData: null,
    transRef: null,
    rawText: '',
    matchExpected: null,
    message: ''
  };

  if (!file) return result;

  // 1. Multi-pass QR Code Scan (jsQR + Html5Qrcode)
  try {
    const qrResult = await scanQrCodeFromImageBlob(file);
    if (qrResult) {
      result.qrDetected = true;
      result.qrRaw = qrResult;
      result.isBankSlip = true;

      const parsedQr = parseSlipQrData(qrResult);
      if (parsedQr) {
        result.qrData = parsedQr;
        if (parsedQr.transRef) {
          result.transRef = parsedQr.transRef;
        }
        if (parsedQr.bank) {
          result.bankDetected = parsedQr.bank;
        }
        if (parsedQr.amount) {
          result.amount = parsedQr.amount;
        }
      }
    }
  } catch (qrErr) {
    console.warn('QR scan processing notice:', qrErr);
  }

  // 2. Optical Character Recognition (Tesseract OCR)
  try {
    const ocrPromise = (async () => {
      const worker = await getSharedWorker();
      if (!worker) return '';
      const ret = await worker.recognize(file);
      return ret?.data?.text || '';
    })();

    // 12-second generous timeout for high-res mobile photos
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(''), 12000));
    const ocrText = await Promise.race([ocrPromise, timeoutPromise]);

    if (ocrText) {
      result.rawText = ocrText;
      const parsed = parseSlipText(ocrText, expectedAmount);
      
      if (parsed.isBankSlip) {
        result.isBankSlip = true;
        if (parsed.bankDetected && !result.bankDetected) {
          result.bankDetected = parsed.bankDetected;
        }
        if (!result.amount && parsed.detectedAmount) {
          result.amount = parsed.detectedAmount;
        }
        result.transferDate = parsed.transferDate;
        result.transferTime = parsed.transferTime;
      }
    }
  } catch (ocrErr) {
    console.warn('OCR processing notice:', ocrErr);
  }

  // 3. Format Date/Time
  if (result.transferDate && result.transferTime) {
    result.transferDateTimeStr = `${result.transferDate} เวลา ${result.transferTime}`;
  } else if (result.transferDate) {
    result.transferDateTimeStr = result.transferDate;
  } else if (result.transferTime) {
    result.transferDateTimeStr = result.transferTime;
  } else {
    result.transferDateTimeStr = null;
  }

  // 4. Evaluate Detection Status and Validation
  if (result.amount) {
    result.isDetected = true;
    result.isBankSlip = true;
    result.amountFormatted = `${Number(result.amount).toFixed(2)} บาท`;

    if (expectedAmount) {
      const numExpected = Number(expectedAmount);
      const isMatch = Math.abs(result.amount - numExpected) < 1;
      result.matchExpected = isMatch;
      if (isMatch) {
        result.status = 'verified';
        result.message = `สแกนพบยอดเงิน ${result.amountFormatted} ตรงตามที่กำหนดเรียบร้อย`;
      } else {
        result.status = 'mismatch';
        result.message = `ตรวจพบยอดเงิน ${result.amountFormatted} (ต่างจากยอดที่กำหนด ${numExpected.toFixed(2)} บาท) เจ้าหน้าที่จะตรวจสอบสลิป`;
      }
    } else {
      result.status = 'verified';
      result.matchExpected = true;
      result.message = `สแกนพบยอดเงิน ${result.amountFormatted} ในสลิปเรียบร้อย`;
    }
  } else {
    // If QR was detected with valid bank/reference, treat as bank slip confirmed
    if (result.qrDetected && result.isBankSlip) {
      result.isDetected = false;
      result.status = 'unverified';
      result.amountFormatted = 'ไม่พบตัวเลขยอดเงินในภาพ (รอเจ้าหน้าที่ตรวจ)';
      result.matchExpected = null;
      result.message = `ตรวจพบ QR Code สลิปธนาคาร (${result.qrData?.typeName || 'SlipVerify'}) รหัสอ้างอิง ${result.transRef || '-'} (รอเจ้าหน้าที่ยืนยันยอดเงิน)`;
    } else {
      result.isDetected = false;
      result.status = 'unverified';
      result.amountFormatted = 'ไม่พบตัวเลขยอดเงินในรูปภาพ';
      result.matchExpected = null;
      result.message = result.isBankSlip
        ? 'ตรวจพบสลิปการโอนเงิน แต่ไม่สามารถอ่านตัวเลขยอดเงินได้ชัดเจน (รอเจ้าหน้าที่ตรวจสอบสลิปด้วยตนเอง)'
        : 'ไม่พบข้อมูลสลิปโอนเงินหรือตัวเลขยอดเงินในรูปภาพที่แนบ (รอเจ้าหน้าที่ตรวจสอบสลิปด้วยตนเอง)';
    }
  }

  return result;
}
