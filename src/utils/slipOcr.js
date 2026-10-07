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
 * Known Thai Bank Name Patterns for Text Detection
 */
export const THAI_BANK_NAME_PATTERNS = [
  { match: /krungthai|กรุงไทย|ktb|next/i, name: 'ธนาคารกรุงไทย (Krungthai NEXT)' },
  { match: /kbank|กสิกร|k plus|kasikorn|i<\+|a\.nans/i, name: 'ธนาคารกสิกรไทย (K PLUS)' },
  { match: /scb|ไทยพาณิชย์|easy/i, name: 'ธนาคารไทยพาณิชย์ (SCB EASY)' },
  { match: /bangkok\s*bank|กรุงเทพ|bbl|bualuang/i, name: 'ธนาคารกรุงเทพ (BBL)' },
  { match: /ttb|ทหารไทยธนชาต|thanachart/i, name: 'ธนาคารทหารไทยธนชาต (ttb)' },
  { match: /gsb|ออมสิน|mymo/i, name: 'ธนาคารออมสิน (MyMo)' },
  { match: /bay|krungsri|กรุงศรี/i, name: 'ธนาคารกรุงศรีอยุธยา (KMA)' },
  { match: /baac|ธ\.ก\.ส\.|ธกส/i, name: 'ธ.ก.ส. (BAAC)' },
  { match: /truemoney|true\s*money|wallet|ทรูมันนี่|วอลเล็ท|ooal/i, name: 'ทรูมันนี่ วอลเล็ท (TrueMoney Wallet)' },
  { match: /promptpay|พร้อมเพย์|wdouwe/i, name: 'พร้อมเพย์ (PromptPay)' }
];

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
  // Format standard: starts with 0038, 0041, 0045, 0046, 0049, 0051, 0054, 0055
  if (/^(?:0038|0041|0045|0046|0049|0051|0054|0055)/.test(raw)) {
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

      // Pass 3: Bottom Half (Standard location for GSB MyMo, SCB, KBank, PromptPay slips)
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
 * Extract time from slip text safely
 */
export function extractTime(str) {
  if (!str) return null;
  // 1. Colon separated: 00:13, 03:20, 14:35:20, 18:24
  const m1 = str.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?:\s*(?:น\.|น|am|pm))?/i);
  if (m1) return m1[0].trim();

  // 2. Dot separated only if followed by น. or am/pm
  const m2 = str.match(/\b([01]?\d|2[0-3])\.([0-5]\d)\s*(?:น\.|น|am|pm)/i);
  if (m2) return m2[0].trim();

  return null;
}

/**
 * Extract date from slip text (Thai and International formats)
 */
export function extractDate(str) {
  if (!str) return null;

  // 1. Thai date: e.g. 19มี.ค.2569 or 23 มี.ค. 2569 or 23 มี.ค..69 or 23 มี.ค. 69
  const mThai = str.match(/([0-3]?\d\s*(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\.?\s*(?:25)?\d{2})/i);
  if (mThai) {
    let d = mThai[1].trim();
    d = d.replace(/\.\./g, '.').replace(/\s+/g, ' ');
    return d;
  }

  // 2. English date: e.g. 07 Oct 2026 or 7 October 2026
  const mEng = str.match(/([0-3]?\d\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:20)?\d{2})/i);
  if (mEng) return mEng[1].trim();

  // 3. Numeric date: e.g. 23/03/2569 or 07/10/2026
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
      transferTime: null,
      transRef: null
    };
  }

  let cleaned = text.replace(/\r\n/g, '\n').trim();

  // Normalize spaces around dots and commas between numbers (e.g. "650 . 00" -> "650.00", "10 . 00" -> "10.00")
  cleaned = cleaned.replace(/(\d+)\s*[\.]\s*(\d{2})/g, '$1.$2');
  cleaned = cleaned.replace(/(\d+)\s*[,]\s*(\d{2})/g, '$1.$2');

  // 1. Detect Bank
  let bankDetected = null;
  for (const item of THAI_BANK_NAME_PATTERNS) {
    if (item.match.test(cleaned)) {
      bankDetected = item.name;
      break;
    }
  }

  // General transfer indicators in Thai bank slips
  const hasTransferKeyword = /โอนเงิน|โอนสำเร็จ|สำเร็จ|รายการสำเร็จ|ผู้รับเงิน|ผู้โอน|ยอดโอน|จำนวนเงิน|ยอดเงิน|ยอดเงินรวม|รหัสอ้างอิง|เลขที่รายการ|เลขที่อ้างอิง|transfer|transferred|successful|success|payment|paid|bscan|slip|juduldu|judul|juduan|tuau|fuudu|goqaldusou|j7uduru|a1sssu|ska3103|truemoney|wallet|mymo|toutsu/i.test(cleaned);

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

    // B. Keyword-anchored amount with 2 decimals:
    // "จำนวนเงิน\n10.00", "จำนวน: 50.00 บาท", "ยอดเงิน 650.00"
    if (!detectedAmount) {
      const labelAmountMatch = cleaned.match(/(?:จำนวนเงิน|จำนวน|ยอดเงิน|ยอดโอน|โอนสำเร็จ|amount|transferred)[\s\S]{0,35}?([1-9][0-9]{0,4}(?:,[0-9]{3})*\.[0-9]{2})/i);
      if (labelAmountMatch) {
        const num = parseFloat(labelAmountMatch[1].replace(/,/g, ''));
        if (!isNaN(num) && num > 0 && num <= 100000) {
          detectedAmount = num;
        }
      }
    }

    // C. Explicit currency patterns (NO \b after Thai word 'บาท'):
    // "50.00 บาท", "10.00 บาท", "650.00฿", "50.00 un"
    if (!detectedAmount) {
      const currMatch = cleaned.match(/([1-9][0-9]{0,4}(?:,[0-9]{3})*\.[0-9]{2})\s*(?:บาท|thb|baht|฿|un|uin|8)/i);
      if (currMatch) {
        const num = parseFloat(currMatch[1].replace(/,/g, ''));
        if (!isNaN(num) && num > 0 && num <= 100000) {
          detectedAmount = num;
        }
      }
    }

    // D. Decimal currency amount fallback (skip fee lines)
    if (!detectedAmount) {
      const lines = cleaned.split('\n');
      for (const line of lines) {
        // Skip lines mentioning fee or month abbreviations to prevent collision with dates
        if (/ค่าธรรมเนียม|fee|ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\./i.test(line)) continue;

        const lineMatches = [...line.matchAll(/([1-9][0-9]{0,4}(?:,[0-9]{3})*\.[0-9]{2})/g)];
        for (const lm of lineMatches) {
          const val = parseFloat(lm[1].replace(/,/g, ''));
          if (!isNaN(val) && val > 0 && val <= 100000) {
            if (expectedAmount && Math.abs(val - Number(expectedAmount)) < 0.01) {
              detectedAmount = val;
              break;
            }
            if (!detectedAmount) {
              detectedAmount = val;
            }
          }
        }
        if (detectedAmount) break;
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

  // 4. Extract TransRef from text if available
  let transRef = null;
  const refMatch = cleaned.match(/(?:รหัสอ้างอิง|เลขที่รายการ|เลขที่อ้างอิง|transref|ref)[\s:]*([A-Za-z0-9_-]{10,35})/i);
  if (refMatch) {
    transRef = refMatch[1].trim();
  }

  return {
    isBankSlip,
    bankDetected,
    detectedAmount,
    transferDate,
    transferTime,
    transRef
  };
}

/**
 * Reusable singleton Tesseract worker with Thai + English support
 */
let sharedTesseractWorker = null;

async function getSharedWorker() {
  if (!sharedTesseractWorker) {
    try {
      // Load both Thai and English models for high precision on Thai bank slips
      const worker = await createWorker(['tha', 'eng']);
      sharedTesseractWorker = worker;
    } catch (err) {
      console.warn('Worker initialization error:', err);
      // Fallback to English if Thai traineddata fails network load
      try {
        const fallbackWorker = await createWorker('eng');
        sharedTesseractWorker = fallbackWorker;
      } catch (fallbackErr) {
        sharedTesseractWorker = null;
      }
    }
  }
  return sharedTesseractWorker;
}

/**
 * Helper to create a cropped Canvas region focused on amount area
 * (Amounts in Thai bank slips consistently sit in the top 10% - 42% region)
 */
function cropAmountAreaCanvas(sourceCanvas) {
  if (!sourceCanvas) return null;
  try {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const cropY = Math.floor(h * 0.08);
    const cropH = Math.floor(h * 0.35);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(sourceCanvas, 0, cropY, w, cropH, 0, 0, w, cropH);

    return cropCanvas;
  } catch (e) {
    return null;
  }
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

  // 2. Attempt Vercel Serverless Function (/api/slip-ocr) for Google Vision / AI For Thai
  let serverOcrSuccess = false;
  try {
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });

      if (base64Data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch('/api/slip-ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, expectedAmount }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const apiJson = await res.json();
          if (apiJson?.success) {
            serverOcrSuccess = true;
            result.isBankSlip = true;
            if (apiJson.rawText) result.rawText = apiJson.rawText;
            if (apiJson.amount) result.amount = apiJson.amount;
            if (apiJson.transferDate) result.transferDate = apiJson.transferDate;
            if (apiJson.transferTime) result.transferTime = apiJson.transferTime;
            if (apiJson.bankDetected && !result.bankDetected) result.bankDetected = apiJson.bankDetected;
            if (apiJson.transRef && !result.transRef) result.transRef = apiJson.transRef;
          }
        }
      }
    }
  } catch (apiErr) {
    // Serverless endpoint offline or timed out; continue to client-side pipeline
  }

  // 3. Client-Side High-Accuracy Thai+Eng OCR Pipeline (if amount or date/time not yet found)
  if (!serverOcrSuccess || !result.amount || !result.transferDate) {
    try {
      const worker = await getSharedWorker();
      if (worker) {
        // Pass A: Full Image Recognition
        const ocrPromise = (async () => {
          const ret = await worker.recognize(file);
          return ret?.data?.text || '';
        })();

        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(''), 15000));
        let ocrText = await Promise.race([ocrPromise, timeoutPromise]);

        // Pass B: If amount not found, run focused crop on top 35% region
        let cropText = '';
        if (typeof window !== 'undefined') {
          const canvasData = await getImageCanvas(file);
          if (canvasData?.canvas) {
            const cropCanvas = cropAmountAreaCanvas(canvasData.canvas);
            if (cropCanvas) {
              try {
                const cropRet = await worker.recognize(cropCanvas);
                cropText = cropRet?.data?.text || '';
              } catch (cropErr) {}
            }
          }
        }

        const combinedText = `${ocrText}\n${cropText}`.trim();
        if (combinedText) {
          result.rawText = combinedText;
          const parsed = parseSlipText(combinedText, expectedAmount);

          if (parsed.isBankSlip) {
            result.isBankSlip = true;
            if (parsed.bankDetected && !result.bankDetected) {
              result.bankDetected = parsed.bankDetected;
            }
            if (!result.amount && parsed.detectedAmount) {
              result.amount = parsed.detectedAmount;
            }
            if (!result.transferDate && parsed.transferDate) {
              result.transferDate = parsed.transferDate;
            }
            if (!result.transferTime && parsed.transferTime) {
              result.transferTime = parsed.transferTime;
            }
            if (!result.transRef && parsed.transRef) {
              result.transRef = parsed.transRef;
            }
          }
        }
      }
    } catch (ocrErr) {
      console.warn('Client OCR processing notice:', ocrErr);
    }
  }

  // 4. Format Date/Time
  if (result.transferDate && result.transferTime) {
    result.transferDateTimeStr = `${result.transferDate} เวลา ${result.transferTime}`;
  } else if (result.transferDate) {
    result.transferDateTimeStr = result.transferDate;
  } else if (result.transferTime) {
    result.transferDateTimeStr = result.transferTime;
  } else {
    result.transferDateTimeStr = null;
  }

  // 5. Evaluate Detection Status and Validation
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
