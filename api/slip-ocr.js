/**
 * Vercel Serverless Function: Slip OCR Endpoint
 * Integrates Google Cloud Vision API (DOCUMENT_TEXT_DETECTION) and AI For Thai OCR
 * with intelligent parsing for Thai bank transfer slips.
 */

const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_VISION_API_KEY || '';
const AIFORTHAI_API_KEY = process.env.AIFORTHAI_API_KEY || 'KwzRcBBoJ4KK7GfXIdUCYCChMkMulloN';

// Known Thai Bank Code Mapping
const THAI_BANK_PATTERNS = [
  { match: /krungthai|กรุงไทย|ktb|next/i, name: 'ธนาคารกรุงไทย (Krungthai NEXT)' },
  { match: /kbank|กสิกร|k plus|kasikorn/i, name: 'ธนาคารกสิกรไทย (K PLUS)' },
  { match: /scb|ไทยพาณิชย์|easy/i, name: 'ธนาคารไทยพาณิชย์ (SCB EASY)' },
  { match: /bangkok\s*bank|กรุงเทพ|bbl|bualuang/i, name: 'ธนาคารกรุงเทพ (BBL)' },
  { match: /ttb|ทหารไทยธนชาต|thanachart/i, name: 'ธนาคารทหารไทยธนชาต (ttb)' },
  { match: /gsb|ออมสิน|mymo/i, name: 'ธนาคารออมสิน (MyMo)' },
  { match: /bay|krungsri|กรุงศรี/i, name: 'ธนาคารกรุงศรีอยุธยา (KMA)' },
  { match: /baac|ธ\.ก\.ส\.|ธกส/i, name: 'ธ.ก.ส. (BAAC)' },
  { match: /truemoney|wallet|ทรูมันนี่|วอลเล็ท/i, name: 'ทรูมันนี่ วอลเล็ท (TrueMoney Wallet)' },
  { match: /promptpay|พร้อมเพย์/i, name: 'พร้อมเพย์ (PromptPay)' }
];

function extractDate(str) {
  if (!str) return null;
  // Thai date: e.g. 19มี.ค.2569 or 23 มี.ค. 2569 or 23 มี.ค..69
  const mThai = str.match(/([0-3]?\d\s*(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\.?\s*(?:25)?\d{2})/i);
  if (mThai) {
    let d = mThai[1].trim();
    d = d.replace(/\.\./g, '.').replace(/\s+/g, ' ');
    return d;
  }
  // English date: e.g. 07 Oct 2026
  const mEng = str.match(/([0-3]?\d\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:20)?\d{2})/i);
  if (mEng) return mEng[1].trim();
  // Numeric date: e.g. 23/03/2569
  const mNum = str.match(/\b([0-3]?\d[\/\-][01]?\d[\/\-](?:25\d{2}|20\d{2}|\d{2}))\b/);
  if (mNum) return mNum[1].trim();
  return null;
}

function extractTime(str) {
  if (!str) return null;
  // Colon separated: 00:13, 03:20, 18:24, 15:11:00
  const m1 = str.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?:\s*(?:น\.|น|am|pm))?/i);
  if (m1) return m1[0].trim();
  // Dot separated: 14.35 น.
  const m2 = str.match(/\b([01]?\d|2[0-3])\.([0-5]\d)\s*(?:น\.|น|am|pm)/i);
  if (m2) return m2[0].trim();
  return null;
}

function extractAmount(text, expectedAmount = null) {
  if (!text) return null;
  let cleaned = text.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/(\d+)\s*[\.]\s*(\d{2})/g, '$1.$2');

  // 1. Keyword-anchored amount with 2 decimals: "จำนวนเงิน\n10.00", "จำนวน: 50.00 บาท", "ยอดเงิน 650.00"
  const labelAmountMatch = cleaned.match(/(?:จำนวนเงิน|จำนวน|ยอดเงิน|ยอดโอน|โอนสำเร็จ|amount|transferred)[\s\S]{0,30}?([1-9][0-9]{0,4}(?:,[0-9]{3})*\.[0-9]{2})/i);
  if (labelAmountMatch) {
    const num = parseFloat(labelAmountMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 0 && num <= 100000) return num;
  }

  // 2. Amount followed by currency: "50.00 บาท", "10.00 บาท", "650.00฿"
  const currMatch = cleaned.match(/([1-9][0-9]{0,4}(?:,[0-9]{3})*\.[0-9]{2})\s*(?:บาท|thb|baht|฿|un|uin|8)/i);
  if (currMatch) {
    const num = parseFloat(currMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 0 && num <= 100000) return num;
  }

  // 3. Fallback: Search all lines for decimal number (must have .XX, excluding fees and date months)
  const lines = cleaned.split('\n');
  for (const line of lines) {
    if (/ค่าธรรมเนียม|fee|ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\./i.test(line)) continue;

    const lineMatches = [...line.matchAll(/([1-9][0-9]{0,4}(?:,[0-9]{3})*\.[0-9]{2})/g)];
    for (const lm of lineMatches) {
      const val = parseFloat(lm[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val <= 100000) {
        if (expectedAmount && Math.abs(val - Number(expectedAmount)) < 0.01) return val;
        return val;
      }
    }
  }

  return null;
}

function detectBank(text) {
  if (!text) return null;
  for (const item of THAI_BANK_PATTERNS) {
    if (item.match.test(text)) return item.name;
  }
  return null;
}

function extractTransRef(text) {
  if (!text) return null;
  // Match "รหัสอ้างอิง: ...", "เลขที่รายการ: ...", "TransRef: ..."
  const m = text.match(/(?:รหัสอ้างอิง|เลขที่รายการ|เลขที่อ้างอิง|transref|ref)[\s:]*([A-Za-z0-9_-]{10,35})/i);
  if (m) return m[1].trim();
  return null;
}

async function callGoogleVision(base64Image) {
  if (!GOOGLE_VISION_KEY) return null;

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn('Google Cloud Vision error:', response.status, errText);
    return null;
  }

  const data = await response.json();
  const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
  return text;
}

export default async function handler(req, res) {
  // CORS Security: Allow app domain and local dev
  const reqOrigin = req.headers.origin || '';
  const isAllowedOrigin =
    reqOrigin === 'https://jre-2027.vercel.app' ||
    /^http:\/\/localhost:\d+$/.test(reqOrigin);

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jre-2027.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, expectedAmount } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    // Strip data URL header if present (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // 1. Try Google Cloud Vision API if key configured
    let ocrText = null;
    let provider = null;

    if (GOOGLE_VISION_KEY) {
      try {
        ocrText = await callGoogleVision(cleanBase64);
        if (ocrText) provider = 'google_vision';
      } catch (err) {
        console.warn('Google Vision call failed:', err);
      }
    }

    // Parse extracted text if available
    if (ocrText) {
      const amount = extractAmount(ocrText, expectedAmount);
      const date = extractDate(ocrText);
      const time = extractTime(ocrText);
      const bank = detectBank(ocrText);
      const transRef = extractTransRef(ocrText);

      return res.status(200).json({
        success: true,
        provider,
        rawText: ocrText,
        amount,
        transferDate: date,
        transferTime: time,
        bankDetected: bank,
        transRef
      });
    }

    // Return status that serverless completed without external vision key
    return res.status(200).json({
      success: false,
      message: 'No external Vision API configured or available; client-side OCR fallback should proceed.'
    });

  } catch (error) {
    console.error('Slip OCR handler error:', error);
    return res.status(500).json({ error: 'Internal OCR Processing Error' });
  }
}
