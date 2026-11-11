import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function UniversalImageModal({ isOpen, onClose, imageSrc, title = 'รูปภาพ' }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, imageSrc]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.3, 3.5));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.3, 0.5));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `jre2027_image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <ModalPortal isOpen={Boolean(isOpen && imageSrc)} onClose={onClose}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
        onClick={onClose}
      >
        <div
          className="relative max-w-5xl w-full max-h-[95vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                {title || 'ดูรูปภาพ'}
              </h3>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="ซูมเข้า (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="ซูมออก (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl transition-colors cursor-pointer"
                  title="รีเซ็ตขนาด"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="หมุนรูป 90°"
              >
                <Maximize2 className="w-4 h-4 rotate-45" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="ดาวน์โหลดรูปภาพ"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer ml-1"
                title="ปิดหน้าต่าง (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Canvas Container */}
          <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-slate-950/60 min-h-[300px]">
            <img
              src={imageSrc}
              alt={title || 'Preview'}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-xl transition-transform"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=preview_error';
              }}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
