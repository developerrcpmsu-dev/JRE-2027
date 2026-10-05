import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const contentText = toast.text || toast.message || (typeof toast === 'string' ? toast : '');
  if (!contentText || !contentText.trim()) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
        isError 
          ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/50' 
          : isInfo 
          ? 'bg-blue-950/95 border-blue-500/60 text-blue-100 shadow-blue-950/50' 
          : 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50'
      }`}>
        <div className="shrink-0 mt-0.5">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : isInfo ? (
            <Info className="w-5 h-5 text-blue-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 text-xs leading-relaxed font-medium">
          {contentText}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
