import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, Maximize2, RotateCcw, Copy, Check, ExternalLink, Link } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { ensureHostedUrl } from '../supabase';

export default function DocumentPreviewModal({ isOpen, onClose, doc }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [shareableUrl, setShareableUrl] = useState('');
  const [blobPdfUrl, setBlobPdfUrl] = useState('');
  const [pdfViewMode, setPdfViewMode] = useState('web');

  const rawFileUrl = doc?.fileUrl || doc?.file_url;
  const fileName = doc?.fileName || doc?.file_name || 'document';
  const title = doc?.title || doc?.name || 'เอกสารแนบ';

  useEffect(() => {
    // Reset zoom when doc changes or modal opens
    setZoomLevel(1);
    setCopied(false);
    setPdfViewMode('web');
    let createdObjectUrl = null;

    if (rawFileUrl) {
      if (rawFileUrl.startsWith('data:application/pdf')) {
        try {
          const parts = rawFileUrl.split(',');
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'application/pdf' });
          createdObjectUrl = URL.createObjectURL(blob);
          setBlobPdfUrl(createdObjectUrl);
        } catch (e) {
          setBlobPdfUrl('');
        }
      } else {
        setBlobPdfUrl('');
      }

      if (rawFileUrl.startsWith('http://') || rawFileUrl.startsWith('https://') || rawFileUrl.startsWith('/')) {
        setShareableUrl(rawFileUrl.startsWith('/') ? `${window.location.origin}${rawFileUrl}` : rawFileUrl);
      } else {
        ensureHostedUrl(rawFileUrl, fileName).then(url => {
          setShareableUrl(url || rawFileUrl);
        });
      }
    } else {
      setShareableUrl('');
      setBlobPdfUrl('');
    }

    return () => {
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [isOpen, doc, rawFileUrl, fileName]);

  if (!isOpen || !doc || !rawFileUrl) return null;

  const fileUrl = blobPdfUrl || shareableUrl || rawFileUrl;
  const isPdf = rawFileUrl.startsWith('data:application/pdf') || 
                (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
                rawFileUrl.toLowerCase().includes('.pdf');
  const isOfficialSchedulePdf = rawFileUrl.includes('schedule_jre2027.pdf');

  const handleCopyLink = async () => {
    try {
      const targetUrl = shareableUrl || rawFileUrl;
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy link error:', err);
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <ModalPortal isOpen={Boolean(isOpen && doc && rawFileUrl)} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rescue-500/20 text-rescue-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls for Images */}
            {!isPdf && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 mr-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="ซูมออก"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-300 font-mono px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="ซูมเข้า"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 text-amber-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="รีเซ็ตขนาด"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Copy Direct URL Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
              title="คัดลอกลิงก์รูปภาพ/สลิป เพื่อส่งต่อให้ผู้อื่น"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว!' : 'ก๊อปลิ้งค์รูป'}</span>
            </button>

            {/* Open Raw in New Tab */}
            {shareableUrl && (
              <a
                href={shareableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="เปิดดูรูปเต็มในแท็บใหม่"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">เปิดดู</span>
              </a>
            )}

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="ดาวน์โหลดไฟล์"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-rose-600/80 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/60 min-h-[350px]">
          {isPdf ? (
            isOfficialSchedulePdf ? (
              <div className="w-full h-[68vh] flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                  <span className="text-xs font-bold text-emerald-400">
                    อ่านเอกสารบนหน้าเว็บได้ทันที (3 หน้าครบถ้วน ไม่ต้องดาวน์โหลด)
                  </span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPdfViewMode('web')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        pdfViewMode === 'web' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      โหมดอ่านบนเว็บ (3 หน้า)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfViewMode('pdf')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        pdfViewMode === 'pdf' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      PDF Viewer
                    </button>
                  </div>
                </div>

                {pdfViewMode === 'web' ? (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {[1, 2, 3].map(pageNum => (
                      <div key={pageNum} className="bg-white rounded-xl overflow-hidden shadow-xl border border-slate-700 max-w-3xl mx-auto">
                        <div className="bg-slate-900 px-4 py-1.5 text-[11px] font-bold text-slate-300 flex justify-between items-center border-b border-slate-800">
                          <span>หน้าที่ {pageNum} / 3 — กำหนดการฝึก JRE 2027</span>
                          <span className="text-emerald-400">เอกสารทางการ</span>
                        </div>
                        <img
                          src={`/documents/schedule/schedule_page_${pageNum}.png`}
                          alt={`กำหนดการฝึก JRE 2027 หน้าที่ ${pageNum}`}
                          className="w-full h-auto block select-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-700 bg-[#525659] shadow-2xl">
                    <div className="bg-[#323639] text-slate-100 px-4 py-2 flex items-center justify-between text-xs border-b border-black/40 shrink-0">
                      <span className="font-mono truncate">schedule_jre2027.pdf (1 - 3 / 3)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                          className="p-1 hover:bg-white/10 rounded cursor-pointer"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[11px] bg-[#171717] px-2 py-0.5 rounded border border-white/15">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(z => Math.min(2, z + 0.25))}
                          className="p-1 hover:bg-white/10 rounded cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                      <div className="hidden sm:flex w-36 bg-[#282b2e] border-r border-black/40 flex-col items-center py-3 px-2 gap-3 overflow-y-auto shrink-0">
                        {[1, 2, 3].map(p => (
                          <a
                            key={p}
                            href={`#doc-modal-page-${p}`}
                            className="flex flex-col items-center gap-1 w-full"
                          >
                            <div className="w-24 bg-white rounded overflow-hidden ring-1 ring-white/20 hover:ring-2 hover:ring-[#8ab4f8]">
                              <img src={`/documents/schedule/schedule_page_${p}.png`} alt={`Page ${p}`} className="w-full h-auto block" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-300">{p}</span>
                          </a>
                        ))}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#525659]">
                        {[1, 2, 3].map(pageNum => (
                          <div
                            key={pageNum}
                            id={`doc-modal-page-${pageNum}`}
                            className="mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] overflow-hidden"
                            style={{ width: `${Math.round(zoomLevel * 100)}%`, maxWidth: zoomLevel <= 1 ? '760px' : 'none' }}
                          >
                            <img
                              src={`/documents/schedule/schedule_page_${pageNum}.png`}
                              alt={`กำหนดการฝึก JRE 2027 หน้าที่ ${pageNum}`}
                              className="w-full h-auto block select-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <object
                data={`${fileUrl}#view=FitH`}
                type="application/pdf"
                className="w-full h-[65vh] rounded-2xl border border-slate-800 shadow-inner bg-slate-900"
              >
                <iframe
                  src={`${fileUrl}#view=FitH`}
                  title={fileName}
                  className="w-full h-[65vh] rounded-2xl border border-slate-800 shadow-inner bg-slate-900"
                />
              </object>
            )
          ) : (
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center w-full">
              <img
                src={fileUrl}
                alt={fileName}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150 border border-slate-800"
              />
            </div>
          )}
        </div>

        {/* Footer / Helper Note & Share URL Bar */}
        <div className="px-5 py-3 bg-slate-950/95 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <span className="text-slate-400 font-medium shrink-0">🔗 URL ลิงก์ตรง:</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 max-w-full sm:max-w-md truncate font-mono text-[10px] text-cyan-300">
              <span className="truncate">{shareableUrl || 'กำลังสร้างลิงก์...'}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-slate-400 hover:text-cyan-300 p-0.5 ml-1 shrink-0 cursor-pointer"
                title="คัดลอก URL"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <span className="text-emerald-400 font-medium shrink-0">✓ ส่งลิงก์นี้ให้ผู้อื่นเปิดดูภาพได้ทันที</span>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
