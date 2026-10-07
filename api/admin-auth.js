// Server-Side Admin Authentication Endpoint (Zero Plaintext Secrets in Codebase)
// Hardened against CWE-798 (Hardcoded Credentials), CWE-307 (Brute Force), and CWE-285 (Improper Authorization)
import crypto from 'crypto';

// In-Memory Failure Rate-Limiting Map (IP -> { count, lastAttempt })
const FAILED_ATTEMPTS = global.__ADMIN_FAILED_ATTEMPTS || new Map();
global.__ADMIN_FAILED_ATTEMPTS = FAILED_ATTEMPTS;

const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export default async function handler(req, res) {
  // Hardened Security Response Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://jre-2027.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jre-2027.vercel.app');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!adminUsername || !adminPassword || !sessionSecret || sessionSecret.length < 32) {
    console.error('Admin authentication is not configured with server-only secrets');
    return res.status(503).json({ success: false, message: 'ระบบยืนยันตัวตนยังไม่พร้อมใช้งาน' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Rate Limiting & Anti-Brute-Force check by client IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.socket?.remoteAddress || 
                   'unknown';

  const failureRecord = FAILED_ATTEMPTS.get(clientIp);
  if (failureRecord && failureRecord.count >= MAX_FAILURES) {
    const elapsed = Date.now() - failureRecord.lastAttempt;
    if (elapsed < LOCKOUT_MS) {
      const waitMinutes = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
      return res.status(429).json({
        success: false,
        message: `คุณพยายามเข้าสู่ระบบผิดเกินกำหนด (${MAX_FAILURES} ครั้ง) ระบบได้ระงับการเข้าใช้งานชั่วคราวเป็นเวลา ${waitMinutes} นาทีเพื่อป้องกันการเจาะระบบ`
      });
    } else {
      FAILED_ATTEMPTS.delete(clientIp);
    }
  }

  const { action, token, username, password } = req.body || {};

  // 1. Verify Token Action (for ongoing session integrity verification)
  if (action === 'verify') {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return res.status(401).json({ success: false, valid: false, message: 'Invalid token format' });
    }
    const [b64Payload, signature] = token.split('.');
    try {
      const payload = Buffer.from(b64Payload, 'base64').toString('utf8');
      const expectedSig = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
      const signatureBuf = Buffer.from(signature, 'utf8');
      const expectedSigBuf = Buffer.from(expectedSig, 'utf8');
      if (signatureBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedSigBuf)) {
        return res.status(401).json({ success: false, valid: false, message: 'Token signature invalid' });
      }
      const [, tokenExpires] = payload.split(':');
      const expiresAt = Number(tokenExpires);
      if (!expiresAt || Date.now() > expiresAt) {
        return res.status(401).json({ success: false, valid: false, message: 'Token expired' });
      }
      return res.status(200).json({ success: true, valid: true, expiresAt });
    } catch (e) {
      return res.status(401).json({ success: false, valid: false, message: 'Token verification failed' });
    }
  }

  // 2. Admin Login Action
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณากรอก Username และ Password ผู้ดูแลระบบ' 
    });
  }

  let userMatch = false;
  let passMatch = false;

  // Compare fixed-length SHA-256 digests so timingSafeEqual never receives
  // attacker-controlled buffers of different lengths. Missing server secrets
  // fail closed above; there is no credential fallback in source code.
  const inputUserDigest = crypto.createHash('sha256').update(String(username).trim()).digest();
  const expectedUserDigest = crypto.createHash('sha256').update(String(adminUsername).trim()).digest();
  const inputPassDigest = crypto.createHash('sha256').update(String(password)).digest();
  const expectedPassDigest = crypto.createHash('sha256').update(String(adminPassword)).digest();
  userMatch = crypto.timingSafeEqual(inputUserDigest, expectedUserDigest) && String(username).trim() === String(adminUsername).trim();
  passMatch = crypto.timingSafeEqual(inputPassDigest, expectedPassDigest) && String(password) === String(adminPassword);

  if (userMatch && passMatch) {
    // Reset failure record upon successful authentication
    FAILED_ATTEMPTS.delete(clientIp);

    // Generate secure HMAC-SHA256 session token valid for 4 hours
    const expiresAt = Date.now() + 4 * 3600 * 1000;
    const tokenIdentifier = adminUsername;
    const payload = `${tokenIdentifier}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
    const adminToken = `${Buffer.from(payload).toString('base64')}.${signature}`;

    return res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบผู้ดูแลระบบสำเร็จ',
      token: adminToken,
      expiresAt
    });
  }

  // Record failed attempt for Anti-Brute-Force tracking
  const current = FAILED_ATTEMPTS.get(clientIp) || { count: 0, lastAttempt: 0 };
  current.count += 1;
  current.lastAttempt = Date.now();
  FAILED_ATTEMPTS.set(clientIp, current);

  const remaining = Math.max(0, MAX_FAILURES - current.count);
  return res.status(401).json({
    success: false,
    message: current.count >= MAX_FAILURES 
      ? `คุณพยายามเข้าสู่ระบบผิดเกิน ${MAX_FAILURES} ครั้ง ระบบระงับการเข้าสู่ระบบ 15 นาที` 
      : `ชื่อผู้ใช้หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (เหลือโอกาสอีก ${remaining} ครั้ง)`
  });
}
