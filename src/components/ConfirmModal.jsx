import React, { useState, useCallback } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  X, 
  Trash2, 
  HelpCircle 
} from 'lucide-react';
import ModalPortal from './ModalPortal';

/**
 * ConfirmModal
 * In-app beautiful, accessible popup modal for user confirmation & alerts,
 * replacing native browser window.confirm() and window.alert().
 */
export default function ConfirmModal({
  isOpen = false,
  title = 'ยืนยันการดำเนินการ',
  message = '',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  showCancel = true,
  onConfirm,
  onCancel,
  icon
}) {
  if (!isOpen) return null;

  const handleCancelClick = (e) => {
    e?.stopPropagation?.();
    if (onCancel) onCancel();
  };

  const handleConfirmClick = (e) => {
    e?.stopPropagation?.();
    if (onConfirm) onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          glow: 'bg-rose-500/15',
          border: 'border-rose-500/40',
          badgeBg: 'bg-rose-500/20',
          badgeBorder: 'border-rose-500/40',
          badgeText: 'text-rose-400',
          btnConfirm: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
          defaultIcon: <Trash2 className="w-6 h-6 text-rose-400" />
        };
      case 'info':
        return {
          glow: 'bg-sky-500/15',
          border: 'border-sky-500/40',
          badgeBg: 'bg-sky-500/20',
          badgeBorder: 'border-sky-500/40',
          badgeText: 'text-sky-400',
          btnConfirm: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/30',
          defaultIcon: <Info className="w-6 h-6 text-sky-400" />
        };
      case 'success':
        return {
          glow: 'bg-emerald-500/15',
          border: 'border-emerald-500/40',
          badgeBg: 'bg-emerald-500/20',
          badgeBorder: 'border-emerald-500/40',
          badgeText: 'text-emerald-400',
          btnConfirm: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30',
          defaultIcon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        };
      case 'warning':
      default:
        return {
          glow: 'bg-amber-500/15',
          border: 'border-amber-500/40',
          badgeBg: 'bg-amber-500/20',
          badgeBorder: 'border-amber-500/40',
          badgeText: 'text-amber-400',
          btnConfirm: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/30',
          defaultIcon: <AlertTriangle className="w-6 h-6 text-amber-400" />
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <ModalPortal isOpen={isOpen} onClose={handleCancelClick}>
      <div 
        className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        onClick={handleCancelClick}
      >
        <div 
          className={`relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border ${currentStyles.border} rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 select-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 ${currentStyles.glow} rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 ${currentStyles.glow} rounded-full blur-3xl pointer-events-none -ml-16 -mb-16`} />

          <div className="relative z-10 space-y-4">
            {/* Header: Icon Badge & Close Button */}
            <div className="flex items-start justify-between gap-3">
              <div className={`w-12 h-12 rounded-2xl ${currentStyles.badgeBg} border ${currentStyles.badgeBorder} flex items-center justify-center shadow-lg shrink-0`}>
                {icon || currentStyles.defaultIcon}
              </div>
              <button
                type="button"
                onClick={handleCancelClick}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 border border-slate-700/60"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Buttons Row */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              {showCancel && (
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl border border-slate-700 text-sm transition-all cursor-pointer active:scale-95 text-center"
                >
                  {cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirmClick}
                className={`w-full sm:w-auto px-6 py-3 font-bold rounded-2xl text-sm shadow-xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2 ${currentStyles.btnConfirm}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

/**
 * useConfirmModal Hook
 * Provides an easy promise- and callback-based API to trigger custom confirmation & alert popups.
 * 
 * Usage:
 * const { confirmModalProps, askConfirm, askAlert } = useConfirmModal();
 * 
 * const handleAction = async () => {
 *   const ok = await askConfirm({
 *     title: 'ยืนยันการลบ',
 *     message: 'ต้องการลบข้อมูลนี้หรือไม่?',
 *     variant: 'danger',
 *     confirmText: 'ลบข้อมูล'
 *   });
 *   if (!ok) return;
 *   // perform action
 * };
 * 
 * return (
 *   <>
 *     ...
 *     <ConfirmModal {...confirmModalProps} />
 *   </>
 * );
 */
export function useConfirmModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    variant: 'warning',
    showCancel: true,
    icon: null,
    onConfirm: null,
    onCancel: null
  });

  const close = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const askConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'ยืนยันการดำเนินการ',
        message: options.message || '',
        confirmText: options.confirmText || 'ยืนยัน',
        cancelText: options.cancelText || 'ยกเลิก',
        variant: options.variant || 'warning',
        showCancel: options.showCancel !== false,
        icon: options.icon || null,
        onConfirm: () => {
          close();
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          close();
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      });
    });
  }, [close]);

  const askAlert = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'แจ้งเตือน',
        message: typeof options === 'string' ? options : (options.message || ''),
        confirmText: options.confirmText || 'ตกลง',
        cancelText: '',
        variant: options.variant || 'info',
        showCancel: false,
        icon: options.icon || null,
        onConfirm: () => {
          close();
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          close();
          if (options.onCancel) options.onCancel();
          resolve(true);
        }
      });
    });
  }, [close]);

  return {
    confirmModalProps: modalState,
    askConfirm,
    askAlert,
    closeConfirmModal: close
  };
}
