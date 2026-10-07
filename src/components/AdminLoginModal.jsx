import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, X, Lock, AlertCircle } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-dismiss error message after 5 seconds
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(''), 5000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Server-Side Verification ONLY (Guarantees zero credentials leaked into client bundle)
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok && resData.success && resData.token) {
        sessionStorage.setItem('jre2027_admin_token', resData.token);
        sessionStorage.setItem('jre2027_admin_expires', String(resData.expiresAt));
        localStorage.removeItem('jre2027_is_admin');
        onLoginSuccess();
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setErrorMsg(resData.message || 'ชื่อผู้ใช้หรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
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
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
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
          <h3 className="text-2xl font-black text-white">เข้าสู่ระบบผู้ดูแลระบบ</h3>
          <p className="text-slate-400 text-xs mt-1">
            JRE 2027 Admin Control Center
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-red-200 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ชื่อผู้ดูแลระบบ (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ดูแลระบบ"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน Admin"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pr-11"
              />
              {/* Eye toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 p-1 rounded-md transition-colors"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              การเข้าถึงจะถูกตรวจสอบผ่านระบบตัวแปรความปลอดภัย (Environment Variable)
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                เข้าสู่ระบบ Admin
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  </ModalPortal>
);
}
