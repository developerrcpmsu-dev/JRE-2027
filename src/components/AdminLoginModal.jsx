import React from 'react';
import { ShieldCheck, X, Lock, AlertCircle, CheckCircle2, RefreshCw, UserCheck } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { isAuthorizedStaffOrAdminEmail } from '../data/defaultData';

export default function AdminLoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  user = null,
  staffAdminWhitelist = [],
  onOpenGoogleLogin = null
}) {
  if (!isOpen) return null;

  const authAccount = user ? isAuthorizedStaffOrAdminEmail(user.email, staffAdminWhitelist) : null;
  const isAuthorized = Boolean(
    authAccount || 
    ['dev', 'admin', 'staff'].includes(user?.role) ||
    ['dev', 'admin', 'staff'].includes(user?.user_metadata?.role)
  );

  const roleLabel = authAccount?.role === 'dev' 
    ? '💻 ผู้พัฒนาระบบ (Developer)'
    : authAccount?.role === 'admin'
    ? '🛡️ ผู้ดูแลระบบส่วนกลาง (Administrator)'
    : authAccount?.role === 'staff'
    ? '🎖️ เจ้าหน้าที่โครงการ (Staff)'
    : user?.role
    ? `🎖️ ${user.role}`
    : 'ผู้ใช้งานทั่วไป';

  const handleEnterAdmin = () => {
    sessionStorage.setItem('jre2027_admin_token', `sso_google_${Date.now()}`);
    sessionStorage.setItem('jre2027_admin_expires', String(Date.now() + 24 * 3600 * 1000));
    localStorage.setItem('jre2027_is_admin', 'true');
    if (onLoginSuccess) onLoginSuccess();
    if (onClose) onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow accent */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-600/30 rounded-full blur-2xl pointer-events-none"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-18 mx-auto flex items-center justify-center mb-3">
              <img 
                src="/images/logo/jre_logo.png" 
                alt="ตราสัญลักษณ์ JRE 2027" 
                className="w-14 h-16 object-contain drop-shadow-xl" 
              />
            </div>
            <h3 className="text-2xl font-black text-white">ระบบควบคุมผู้ดูแลระบบ (Admin)</h3>
            <p className="text-purple-300 text-xs mt-1 font-bold">
              Google Single Sign-On • Role-Based Access Control (RBAC)
            </p>
          </div>

          {/* Case 1: Signed in with an authorized Staff/Admin Google Account */}
          {user && isAuthorized && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>ตรวจสอบสิทธิ์ผ่านเรียบร้อย (Authorized)</span>
                </div>
                <div className="text-sm font-black text-white truncate">
                  {authAccount?.name || user.user_metadata?.full_name || user.email}
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  อีเมล: <span className="text-emerald-300">{user.email}</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold">
                  ระดับสิทธิ์: <span className="font-bold text-white">{roleLabel}</span>
                </div>
                {authAccount?.duty_note && (
                  <div className="text-[11px] text-slate-400 border-t border-emerald-900/50 pt-1.5 mt-1">
                    📌 {authAccount.duty_note}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleEnterAdmin}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>เข้าสู่ระบบ Admin Console ทันที</span>
              </button>
            </div>
          )}

          {/* Case 2: Signed in, but NOT on whitelist */}
          {user && !isAuthorized && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>บัญชี Google ปัจจุบันไม่มีสิทธิ์ Staff / Admin</span>
                </div>
                <div className="text-xs text-slate-300">
                  คุณกำลังเข้าสู่ระบบด้วยอีเมล: <strong className="text-white font-mono">{user.email}</strong>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  อีเมลนี้ไม่อยู่ในรายชื่อ Whitelist ของทีมงาน หากท่านเป็นกรรมการหรือสตาฟโครงการ กรุณากดสลับบัญชี Google เพื่อเข้าสู่ระบบด้วยอีเมลที่ได้รับมอบหมาย
                </p>
              </div>

              {onOpenGoogleLogin && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    onOpenGoogleLogin();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>สลับเข้าสู่ระบบด้วยบัญชี Google อื่น</span>
                </button>
              )}
            </div>
          )}

          {/* Case 3: Not signed in yet */}
          {!user && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <p className="leading-relaxed">
                  ระบบผู้ดูแลระบบ JRE 2027 ใช้ระบบยืนยันตัวตนแบบ <strong>Google Single Sign-On (SSO)</strong> เพื่อความปลอดภัยสูงสุด กรุณากดปุ่มด้านล่างเพื่อเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับมอบหมายสิทธิ์
                </p>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>ระบบตรวจสอบสิทธิ์ Dev / Admin / Staff อัตโนมัติใน 1 คลิก</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  if (onOpenGoogleLogin) onOpenGoogleLogin();
                }}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl shadow-xl transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.17 3.66-9.14z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.35 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.41l4.03-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Google (Google SSO)</span>
              </button>
            </div>
          )}

          {/* Footer note: Old username/password disabled notice */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>ปิดระบบ Username/Password แล้ว • ใช้สิทธิ์ Google Whitelist แทน</span>
            </p>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
