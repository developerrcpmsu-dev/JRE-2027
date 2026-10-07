import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://clgavdzozfsmohdcetue.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZ2F2ZHpvemZzbW9oZGNldHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjEwNTYsImV4cCI6MjEwNjUzNzA1Nn0.YgmNzkGjrrHTIfcdxkUvuRk6Ksa9CMGLYkkSMRn1lM8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Strict Whitelist of Safe Delivery MIME Types (Prevents Stored XSS - CWE-79)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]);

export default async function handler(req, res) {
  // CORS Security: Restrict origins to official project domain and local dev
  const reqOrigin = req.headers.origin || '';
  const isAllowedOrigin = 
    reqOrigin.startsWith('https://jre-2027.vercel.app') || 
    reqOrigin.startsWith('http://localhost:');

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://jre-2027.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Hardened Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).send('Missing file id');
  }

  try {
    const cleanId = String(id).trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const key = cleanId.startsWith('file_') ? cleanId : `file_${cleanId}`;

    const { data, error } = await supabase
      .from('project_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data?.value) {
      return res.status(404).send('File not found');
    }

    const fileObj = data.value;
    const base64Str = fileObj.data || '';
    if (!base64Str) {
      return res.status(404).send('Empty file payload');
    }

    const matches = base64Str.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    let mimeType = matches ? matches[1].toLowerCase() : (fileObj.type || 'application/octet-stream').toLowerCase();
    const rawData = matches ? matches[2] : base64Str;
    const buffer = Buffer.from(rawData, 'base64');

    // MIME Validation Gate: If not in safe whitelist, force octet-stream download
    let isForcedDownload = false;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      mimeType = 'application/octet-stream';
      isForcedDownload = true;
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);

    // Private Cache-Control for Sensitive Identifications (ID cards / payment slips)
    const isSensitive = key.includes('id_card') || key.includes('slip') || key.includes('payment');
    if (isSensitive) {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }

    const fileName = fileObj.name ? encodeURIComponent(fileObj.name) : 'download';
    const dispositionType = isForcedDownload ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${fileName}"`);

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('File delivery handler error:', err);
    return res.status(500).send('Error loading requested file');
  }
}
