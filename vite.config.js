import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sbUrl = 'https://clgavdzozfsmohdcetue.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZ2F2ZHpvemZzbW9oZGNldHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjEwNTYsImV4cCI6MjEwNjUzNzA1Nn0.YgmNzkGjrrHTIfcdxkUvuRk6Ksa9CMGLYkkSMRn1lM8';
const supabase = createClient(sbUrl, sbKey);

const serveApiFile = () => ({
  name: 'serve-api-file',
  configureServer(server) {
    server.middlewares.use('/api/file', async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3000');
      const id = url.searchParams.get('id');
      if (!id) {
        res.statusCode = 400;
        res.end('Missing file id');
        return;
      }
      try {
        const cleanId = String(id).trim();
        const key = cleanId.startsWith('file_') ? cleanId : `file_${cleanId}`;
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (error || !data?.value?.data) {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }

        const fileObj = data.value;
        const matches = fileObj.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : (fileObj.type || 'image/jpeg');
        const rawData = matches ? matches[2] : fileObj.data;
        const buffer = Buffer.from(rawData, 'base64');

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(buffer);
      } catch (e) {
        res.statusCode = 500;
        res.end('Error serving file');
      }
    });
  }
});

const ensureStaticSecurityFiles = () => ({
  name: 'ensure-static-security-files',
  closeBundle() {
    try {
      const distDir = path.resolve(__dirname, 'dist');
      const wellKnownDist = path.join(distDir, '.well-known');
      if (!fs.existsSync(wellKnownDist)) {
        fs.mkdirSync(wellKnownDist, { recursive: true });
      }
      const wellKnownSrc = path.resolve(__dirname, 'public/.well-known/security.txt');
      if (fs.existsSync(wellKnownSrc)) {
        fs.copyFileSync(wellKnownSrc, path.join(wellKnownDist, 'security.txt'));
      }
    } catch (e) {
      console.warn('Could not copy .well-known files:', e);
    }
  }
});

export default defineConfig({
  plugins: [react(), serveApiFile(), ensureStaticSecurityFiles()],
  server: {
    port: 3000,
    open: true
  }
});
