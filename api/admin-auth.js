// Server-Side Admin Authentication Endpoint (Hardened against CWE-798 & CWE-285)
import crypto from 'crypto';

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
  if (allowedOrigins.some(o => origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jre-2027.vercel.app');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณากรอก Username และ Password ผู้ดูแลระบบ' 
    });
  }

  const expectedUser = process.env.ADMIN_USERNAME || process.env.VITE_ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server environment credentials not configured' 
    });
  }

  // Constant-time string comparison to prevent Timing Side-Channel Attacks
  const userBuf = Buffer.from(String(username).padEnd(64, ' '));
  const expUserBuf = Buffer.from(String(expectedUser).padEnd(64, ' '));
  const passBuf = Buffer.from(String(password).padEnd(64, ' '));
  const expPassBuf = Buffer.from(String(expectedPass).padEnd(64, ' '));

  const userMatch = crypto.timingSafeEqual(userBuf, expUserBuf) && username.trim() === expectedUser.trim();
  const passMatch = crypto.timingSafeEqual(passBuf, expPassBuf) && password === expectedPass;

  if (userMatch && passMatch) {
    // Generate secure HMAC-SHA256 session token valid for 8 hours
    const expiresAt = Date.now() + 8 * 3600 * 1000;
    const sessionSecret = process.env.SESSION_SECRET || expectedPass;
    const payload = `${expectedUser}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
    const adminToken = `${Buffer.from(payload).toString('base64')}.${signature}`;

    return res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบผู้ดูแลระบบสำเร็จ',
      token: adminToken,
      expiresAt
    });
  }

  return res.status(401).json({
    success: false,
    message: 'ชื่อผู้ใช้หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง'
  });
}
