import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://clgavdzozfsmohdcetue.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZ2F2ZHpvemZzbW9oZGNldHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjEwNTYsImV4cCI6MjEwNjUzNzA1Nn0.YgmNzkGjrrHTIfcdxkUvuRk6Ksa9CMGLYkkSMRn1lM8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // CORS Support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).send('Missing file id');
  }

  try {
    const cleanId = String(id).trim();
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

    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : (fileObj.type || 'image/jpeg');
    const rawData = matches ? matches[2] : base64Str;
    const buffer = Buffer.from(rawData, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (fileObj.name) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileObj.name)}"`);
    }

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('File delivery handler error:', err);
    return res.status(500).send('Error loading requested file');
  }
}
