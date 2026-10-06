import { Html5Qrcode } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';

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
 * Parse EMVCo / PromptPay QR Payload (Tag 54 is Amount in Baht)
 * or SlipVerify Mini QR codes
 */
function parsePromptPayQr(qrText) {
  if (!qrText || typeof qrText !== 'string') return null;
  const result = { isPromptPay: false, isSlipVerify: false, amount: null, ref: null };

  if (qrText.startsWith('000201')) {
    result.isPromptPay = true;
    // Search for Tag 54 (Transaction Amount: 54LL<amount>)
    const tag54Match = qrText.match(/54(\d{2})(\d+(\.\d{2})?)/);
    if (tag54Match) {
      const len = parseInt(tag54Match[1], 10);
      const val = tag54Match[2].slice(0, len);
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        result.amount = num;
      }
    }
  } else if (/^(?:0046|0049|0054)/.test(qrText) || qrText.includes('promptpay') || qrText.includes('scb') || qrText.includes('kbank') || qrText.includes('ktb') || qrText.includes('bbl')) {
    result.isSlipVerify = true;
    result.ref = qrText;
  }

  return result;
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
  // 1. Thai date: e.g. 07 ต.ค. 2569 or 7 ต.ค. 69
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

  const cleaned = text.replace(/\r\n/g, '\n').trim();

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

  // General transfer indicators in Thai bank slips
  const hasTransferKeyword = /โอนเงิน|โอนสำเร็จ|สำเร็จ|รายการสำเร็จ|ผู้รับเงิน|ผู้โอน|ยอดโอน|จำนวนเงิน|ยอดเงิน|รหัสอ้างอิง|เลขที่รายการ|transfer|transferred|successful|success|payment|paid|bscan|slip/i.test(cleaned);

  const isBankSlip = Boolean(bankDetected || hasTransferKeyword);

  if (isBankSlip && !bankDetected) {
    bankDetected = 'สลิปการโอนเงินธนาคาร';
  }

  // 2. Detect Amount (ONLY IF this has bank/transfer context or clear amount indicators)
  let detectedAmount = null;

  if (isBankSlip) {
    // A. Explicit amount keywords: "จำนวนเงิน 400.00", "Amount 400.00 THB", "400.00 บาท"
    const explicitAmountPatterns = [
      /(?:จำนวนเงิน|จำนวน|ยอดเงิน|ยอดโอน|โอนสำเร็จ|ยอดชำระ|amount|transferred|paid)\s*[:\s-]*\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i,
      /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\s*(?:บาท|thb|baht)\b/i
    ];

    for (const regex of explicitAmountPatterns) {
      const match = cleaned.match(regex);
      if (match && match[1]) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(num) && num >= 50 && num <= 50000) {
          detectedAmount = num;
          break;
        }
      }
    }

    // B. Check if expectedAmount matches numbers in text
    if (!detectedAmount && expectedAmount) {
      const numExpected = Number(expectedAmount);
      const expectedRegex = new RegExp(`(?:^|\\D)${numExpected}(?:\\.00)?(?:$|\\D)`);
      if (expectedRegex.test(cleaned)) {
        detectedAmount = numExpected;
      }
    }

    // C. Decimal currency amount: e.g. 400.00, 650.00
    if (!detectedAmount) {
      const decimalMatch = cleaned.match(/\b([1-9][0-9]{1,4}\.[0-9]{2})\b/);
      if (decimalMatch && decimalMatch[1]) {
        const num = parseFloat(decimalMatch[1]);
        if (!isNaN(num) && num >= 50 && num <= 50000) {
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
 * Scan slip image using combined QR code detection and OCR without fake hallucinated values
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
    rawText: '',
    matchExpected: null,
    message: ''
  };

  if (!file) return result;

  // 1. Try QR Code scan first
  try {
    const sandboxId = getOrCreateQrSandbox();
    if (sandboxId) {
      const html5QrCode = new Html5Qrcode(sandboxId, { verbose: false });
      const qrResult = await html5QrCode.scanFile(file, false);
      if (qrResult) {
        result.qrDetected = true;
        result.isBankSlip = true;
        const parsed = parsePromptPayQr(qrResult);
        if (parsed?.amount) {
          result.amount = parsed.amount;
        }
        if (parsed?.isPromptPay) {
          result.bankDetected = 'สลิปพร้อมเพย์ / PromptPay QR';
        } else if (parsed?.isSlipVerify) {
          result.bankDetected = 'สลิปธนาคาร (SlipVerify QR)';
        }
      }
      try { await html5QrCode.clear(); } catch (e) {}
    }
  } catch (qrErr) {
    // Normal if image is not a QR code or doesn't have decodable QR
  }

  // 2. Try OCR using Tesseract (with timeout so UI is never blocked)
  try {
    const ocrPromise = (async () => {
      const worker = await getSharedWorker();
      if (!worker) return '';
      const ret = await worker.recognize(file);
      return ret?.data?.text || '';
    })();

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(''), 5500));
    const ocrText = await Promise.race([ocrPromise, timeoutPromise]);

    if (ocrText) {
      result.rawText = ocrText;
      const parsed = parseSlipText(ocrText, expectedAmount);
      
      if (parsed.isBankSlip) {
        result.isBankSlip = true;
        if (parsed.bankDetected && (!result.bankDetected || result.bankDetected.includes('SlipVerify'))) {
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

  // 3. Format Date/Time (Truthful, DO NOT hallucinate current time!)
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
    // No amount detected: HONEST result, no fake fallback
    result.isDetected = false;
    result.status = 'unverified';
    result.amountFormatted = 'ไม่พบตัวเลขยอดเงินในรูปภาพ';
    result.matchExpected = null;
    result.message = result.isBankSlip
      ? 'ตรวจพบสลิปการโอนเงิน แต่ไม่สามารถอ่านตัวเลขยอดเงินได้ชัดเจน (รอเจ้าหน้าที่ตรวจสอบสลิปด้วยตนเอง)'
      : 'ไม่พบข้อมูลสลิปโอนเงินหรือตัวเลขยอดเงินในรูปภาพที่แนบ (รอเจ้าหน้าที่ตรวจสอบสลิปด้วยตนเอง)';
  }

  return result;
}
