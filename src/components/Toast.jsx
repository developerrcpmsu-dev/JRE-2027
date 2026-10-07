import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const [progress, setProgress] = useState(100);

  const duration = toast?.duration || 4000;

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const contentText = toast.text || toast.message || (typeof toast === 'string' ? toast : '');
  if (!contentText || !contentText.trim()) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-3rem)] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
      <div className={`p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex flex-col gap-2.5 backdrop-blur-md overflow-hidden relative ${
        isError 
          ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/50' 
          : isInfo 
          ? 'bg-blue-950/95 border-blue-500/60 text-blue-100 shadow-blue-950/50' 
          : 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {isError ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : isInfo ? (
              <Info className="w-5 h-5 text-blue-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="flex-1 text-xs leading-relaxed font-semibold break-words">
            {contentText}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer shrink-0"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Progress Bar Timer Indicator */}
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              isError ? 'bg-rose-400' : isInfo ? 'bg-blue-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
