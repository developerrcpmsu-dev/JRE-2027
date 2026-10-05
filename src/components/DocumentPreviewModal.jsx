import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, Maximize2, RotateCcw } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function DocumentPreviewModal({ isOpen, onClose, doc }) {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    // Reset zoom when doc changes or modal opens
    setZoomLevel(1);
  }, [isOpen, doc]);

  const fileUrl = doc?.fileUrl || doc?.file_url;
  const fileName = doc?.fileName || doc?.file_name || 'document';
  const title = doc?.title || doc?.name || 'เอกสารแนบ';

  if (!isOpen || !doc || !fileUrl) return null;

  const isPdf = fileUrl.startsWith('data:application/pdf') || 
                (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
                fileUrl.toLowerCase().includes('.pdf');

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
    <ModalPortal isOpen={Boolean(isOpen && doc && fileUrl)} onClose={onClose}>
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
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
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
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="ซูมเข้า"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="รีเซ็ตขนาด"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="ดาวน์โหลดไฟล์"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-rose-600/80 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/60 min-h-[350px]">
          {isPdf ? (
            <iframe
              src={fileUrl}
              title={fileName}
              className="w-full h-[65vh] rounded-2xl border border-slate-800 shadow-inner bg-slate-900"
            />
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

        {/* Footer / Helper Note */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>กด <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">ESC</kbd> หรือคลิกปุ่มปิดเพื่อกลับสู่หน้าเดิม</span>
          <span className="text-emerald-400 font-medium">✓ แสดงตัวอย่างเอกสารในระบบ</span>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
