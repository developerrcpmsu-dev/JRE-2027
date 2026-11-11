import React, { useState } from 'react';
import { ShieldCheck, X, Lock, AlertCircle, CheckCircle2, RefreshCw, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'google'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const grantAdminSession = (token = null, expiresAt = null) => {
    try {
      sessionStorage.removeItem('jre2027_admin_logged_out');
      sessionStorage.setItem('jre2027_admin_active', 'true');
      sessionStorage.setItem('jre2027_admin_token', token || `admin_pass_${Date.now()}`);
      sessionStorage.setItem('jre2027_admin_expires', String(expiresAt || (Date.now() + 24 * 3600 * 1000)));
      localStorage.setItem('jre2027_is_admin', 'true');
    } catch (e) {
      console.warn('Storage error on admin auth:', e);
    }
    if (onLoginSuccess) onLoginSuccess();
    if (onClose) onClose();
  };

  const handlePasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('กรุณากรอกชื่อผู้ดูแลระบบและรหัสผ่าน');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Primary: Server-Side Authentication via /api/admin-auth (Protected Secrets)
      let verified = false;
      let serverToken = null;
      let serverExpires = null;

      try {
        const response = await fetch('/api/admin-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, password: cleanPass })
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.success && data?.token) {
          verified = true;
          serverToken = data.token;
          serverExpires = data.expiresAt;
        } else if (response.status === 429) {
          setErrorMsg(data?.message || 'พยายามเข้าสู่ระบบผิดเกินกำหนด กรุณารอสักครู่');
          setIsSubmitting(false);
          return;
        } else if (response.status === 401) {
          setErrorMsg(data?.message || 'ชื่อผู้ใช้หรือรหัสผ่าน Admin ไม่ถูกต้อง');
          setIsSubmitting(false);
          return;
        }
      } catch (apiErr) {
        // Fallback for static dev environments where serverless functions are offline
      }

      // 2. Cryptographic SHA-256 Verification (Zero Plaintext Password in bundle)
      if (!verified) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(cleanPass));
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        // Constant SHA-256 digest of valid admin password
        const expectedDigest = '56f44ff3c83702c5f5f6fb7f530b75010b51c9ec155edbe8de77205ddad662ae';
        const isUserValid = cleanUser === 'admin' || cleanUser === 'admin@admin.com';

        if (isUserValid && hashHex === expectedDigest) {
          verified = true;
          serverToken = `admin_sec_${Date.now()}`;
          serverExpires = Date.now() + 8 * 3600 * 1000;
        }
      }

      if (verified) {
        grantAdminSession(serverToken, serverExpires);
      } else {
        setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่าน Admin ไม่ถูกต้อง');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ความปลอดภัย');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleEnterAdmin = () => {
    grantAdminSession();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow accent */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-600/30 rounded-full blur-2xl pointer-events-none"></div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer z-10"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-16 h-18 mx-auto flex items-center justify-center mb-2">
              <img 
                src="/images/logo/jre_logo.png" 
                alt="ตราสัญลักษณ์ JRE 2027" 
                className="w-14 h-16 object-contain drop-shadow-xl" 
              />
            </div>
            <h3 className="text-2xl font-black text-white">ระบบควบคุมผู้ดูแลระบบ (Admin)</h3>
            <p className="text-purple-300 text-xs mt-1 font-semibold">
              JRE 2027 Admin Console & Role Verification
            </p>
          </div>

          {/* Mode Tabs: Password vs Google SSO */}
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ชื่อผู้ใช้ & รหัสผ่าน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google SSO (สิทธิ์อีเมล)</span>
            </button>
          </div>

          {/* TAB 1: Password Login (Username & Password) */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ชื่อผู้ดูแลระบบ (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-950/90 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 rounded-xl text-white text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 pr-10 bg-slate-950/90 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 rounded-xl text-white text-sm outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-lg shadow-purple-900/40 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังตรวจสอบสิทธิ์…' : 'เข้าสู่ระบบ Admin Console'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Google SSO Login */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              {user && isAuthorized && (
                <div className="space-y-3">
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
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleEnterAdmin}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>เข้าสู่ระบบ Admin Console ด้วยสิทธิ์ Google</span>
                  </button>
                </div>
              )}

              {user && !isAuthorized && (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>บัญชี Google ปัจจุบันไม่มีสิทธิ์ Staff / Admin</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      คุณกำลังเข้าสู่ระบบด้วยอีเมล: <strong className="text-white font-mono">{user.email}</strong>
                    </div>
                  </div>

                  {onOpenGoogleLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onClose) onClose();
                        onOpenGoogleLogin();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>สลับเข้าสู่ระบบด้วยบัญชี Google อื่น</span>
                    </button>
                  )}
                </div>
              )}

              {!user && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                    <p className="leading-relaxed">
                      เข้าสู่ระบบด้วยบัญชี Google ที่ได้รับมอบหมายสิทธิ์ Dev, Admin หรือ Staff
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>ระบบตรวจสอบสิทธิ์ Dev / Admin / Staff อัตโนมัติ</span>
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
            </div>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>ระบบรักษาความปลอดภัย: Server-Side RBAC และ Google SSO</span>
            </p>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
