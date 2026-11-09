import React, { useEffect, useState } from 'react';
import { XCircle, ChevronLeft, ChevronRight, ExternalLink, Download, Maximize2, Image as ImageIcon, FileText } from 'lucide-react';
import ModalPortal from './ModalPortal';

const TONE_CLASSES = {
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  sky: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
};

const isPdfUrl = (url = '') => /^data:application\/pdf/i.test(url) || /\.pdf(\?|#|$)/i.test(url);
const isHttpUrl = (url = '') => /^https?:\/\//i.test(url);

const formatSlipDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

function SlipMedia({ url, alt, className, onClick }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => { setFailed(false); }, [url]);

  if (isPdfUrl(url)) {
    return (
      <iframe
        src={url}
        title={alt}
        className={`${className} bg-white`}
      />
    );
  }

  if (failed) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-2 text-slate-400 text-xs bg-slate-950`}>
        <ImageIcon className="w-8 h-8 text-slate-600" />
        <span>ไม่สามารถแสดงรูปสลิปนี้ได้</span>
        {isHttpUrl(url) && (
          <a href={url} target="_blank" rel="noreferrer" className="text-purple-300 underline font-bold">
            เปิดไฟล์ในแท็บใหม่
          </a>
        )}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      onClick={onClick}
      className={`${className} ${onClick ? 'cursor-zoom-in' : ''}`}
    />
  );
}

/**
 * แกลเลอรีแสดงสลิปทั้งหมดของผู้สมัคร (รองรับ 1, 2, 3 รูปขึ้นไป)
 * props.gallery = { title, subtitle, slips: collectRegistrationSlips(reg) }
 */
export default function SlipGalleryModal({ gallery, onClose }) {
  const [zoomIndex, setZoomIndex] = useState(null);
  const slips = gallery?.slips || [];
  const count = slips.length;

  useEffect(() => { setZoomIndex(null); }, [gallery]);

  useEffect(() => {
    if (zoomIndex === null || count < 2) return undefined;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') setZoomIndex(i => (i + 1) % count);
      if (e.key === 'ArrowLeft') setZoomIndex(i => (i - 1 + count) % count);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomIndex, count]);

  if (!gallery) return null;

  const handleClose = () => {
    if (zoomIndex !== null) {
      setZoomIndex(null);
      return;
    }
    onClose?.();
  };

  const widthClass = count >= 3 ? 'max-w-7xl' : count === 2 ? 'max-w-5xl' : 'max-w-2xl';
  const gridClass = count >= 3 ? 'md:grid-cols-2 xl:grid-cols-3' : count === 2 ? 'md:grid-cols-2' : '';
  const zoomSlip = zoomIndex !== null ? slips[zoomIndex] : null;

  return (
    <ModalPortal isOpen={Boolean(gallery)} onClose={handleClose}>
      <div
        className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className={`bg-slate-900 border border-slate-700 ${widthClass} w-full max-h-[94vh] overflow-y-auto rounded-3xl p-4 sm:p-6 shadow-2xl relative`}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full cursor-pointer"
            aria-label="ปิด"
          >
            <XCircle className="w-5 h-5" />
          </button>

          <div className="pr-10 mb-4">
            <h4 className="font-black text-white text-sm sm:text-base">
              ภาพสลิปการโอนเงิน{gallery.title ? ` • ${gallery.title}` : ''}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {gallery.subtitle ? `${gallery.subtitle} • ` : ''}
              พบสลิปทั้งหมด <strong className="text-purple-300">{count} รูป</strong>
              {count > 1 && ' (กรุณาตรวจสอบให้ครบทุกรูป)'}
            </p>
          </div>

          {count === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-bold">ไม่พบสลิปของผู้สมัครรายนี้</div>
          ) : (
            <div className={`grid grid-cols-1 ${gridClass} gap-4`}>
              {slips.map((slip, idx) => (
                <div key={slip.url} className={`flex flex-col rounded-2xl border bg-slate-950/80 overflow-hidden ${
                  slip.kind === 'refund' ? 'border-sky-500/40' : 'border-slate-800'
                }`}>
                  <div className="p-3 border-b border-slate-800 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-black text-white leading-snug">
                        <span className="inline-flex items-center justify-center w-5 h-5 mr-1.5 rounded-full bg-purple-600 text-[10px] text-white align-middle">
                          {idx + 1}
                        </span>
                        {slip.label}
                      </div>
                      {slip.statusMeta && (
                        <span className={`shrink-0 px-2 py-0.5 rounded border text-[10px] font-bold ${TONE_CLASSES[slip.statusMeta.tone]}`}>
                          {slip.statusMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
                      {formatSlipDate(slip.date) && <span>🕒 {formatSlipDate(slip.date)}</span>}
                      {slip.amount > 0 && (
                        <span>
                          {slip.kind === 'refund' ? 'ยอดโอนคืน' : 'ยอดจาก OCR'}:{' '}
                          <strong className="text-emerald-300 font-mono">{slip.amount.toLocaleString()} บ.</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-2 bg-slate-950">
                    <SlipMedia
                      url={slip.url}
                      alt={`สลิป ${idx + 1} - ${slip.label}`}
                      onClick={() => setZoomIndex(idx)}
                      className={`w-full ${count === 1 ? 'h-[65vh]' : 'h-[50vh]'} object-contain rounded-xl`}
                    />
                  </div>

                  <div className="p-2 flex items-center justify-end gap-1.5 border-t border-slate-800">
                    {!isPdfUrl(slip.url) && (
                      <button
                        type="button"
                        onClick={() => setZoomIndex(idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        ขยาย
                      </button>
                    )}
                    {isHttpUrl(slip.url) ? (
                      <a
                        href={slip.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        เปิดแท็บใหม่
                      </a>
                    ) : (
                      <a
                        href={slip.url}
                        download={`slip-${idx + 1}-${slip.key}${isPdfUrl(slip.url) ? '.pdf' : '.jpg'}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-bold flex items-center gap-1"
                      >
                        {isPdfUrl(slip.url) ? <FileText className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                        ดาวน์โหลด
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen zoom view with prev / next */}
        {zoomSlip && (
          <div
            className="fixed inset-0 z-[130] bg-black/95 flex flex-col items-center justify-center p-3 sm:p-6"
            onClick={(e) => { e.stopPropagation(); setZoomIndex(null); }}
          >
            <div className="absolute top-3 left-3 right-14 text-xs sm:text-sm text-white font-bold truncate">
              สลิป {zoomIndex + 1}/{count} • {zoomSlip.label}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomIndex(null); }}
              className="absolute top-3 right-3 p-1.5 bg-slate-800 text-slate-200 hover:text-white rounded-full cursor-pointer"
              aria-label="ย่อกลับ"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <img
              src={zoomSlip.url}
              alt={zoomSlip.label}
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-[88vh] object-contain rounded-xl"
            />

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setZoomIndex(i => (i - 1 + count) % count); }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white cursor-pointer"
                  aria-label="สลิปก่อนหน้า"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setZoomIndex(i => (i + 1) % count); }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white cursor-pointer"
                  aria-label="สลิปถัดไป"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
