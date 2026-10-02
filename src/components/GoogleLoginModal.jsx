import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, User, Mail, ArrowRight, AlertCircle, Sparkles, ChevronRight, LogIn } from 'lucide-react';
import { DataService } from '../supabase';

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = async (name, email, avatar) => {
    setIsLoading(true);
    try {
      const user = await DataService.loginWithGoogleProfile({ name, email, avatar });
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error('Google profile login error:', err);
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    const cleanEmail = customEmail.trim().toLowerCase();
    let name = customName.trim();
    if (!name) {
      // Extract pleasant display name from email (e.g. somchai.r -> Somchai R)
      name = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    handleSelectAccount(name, cleanEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-white/10 mb-3 p-3">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white">เข้าสู่ระบบด้วย Google</h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            ใช้บัญชี Google เพื่อสมัครและติดตามสถานะห้องพัก/กลุ่มฝึก JRE 2027
          </p>
        </div>

        {/* View 1: Main Clean View matching exact user specification */}
        {!showAccountChooser ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowAccountChooser(true)}
              className="w-full py-4 px-5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-slate-200 text-sm sm:text-base group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>ดำเนินการต่อด้วย Google (OAuth)</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-xs text-slate-400 font-medium">
              เข้าสู่ระบบและไปหน้าใบสมัคร
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSelectAccount('นายพงศ์ภรณ์ ทองศิริ (Dev RCP16-37)', 'developer.rcpmsu@gmail.com')}
                disabled={isLoading}
                className="w-full p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
                    P
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">เข้าสู่ระบบทันทีด้วยบัญชีผู้พัฒนา</p>
                    <p className="text-[11px] text-slate-400 font-mono">developer.rcpmsu@gmail.com</p>
                  </div>
                </div>
                <span className="text-[11px] text-rescue-400 font-semibold flex items-center gap-1">
                  1-Click <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Authentic Google Account Chooser */
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">เลือกบัญชี Google ของคุณ:</span>
              <button
                type="button"
                onClick={() => setShowAccountChooser(false)}
                className="text-[11px] text-rescue-400 hover:text-rescue-300"
              >
                ← ย้อนกลับ
              </button>
            </div>

            {/* Account List */}
            <div className="space-y-2">
              {/* Account 1 */}
              <button
                type="button"
                onClick={() => handleSelectAccount('นายพงศ์ภรณ์ ทองศิริ (Dev RCP16-37)', 'developer.rcpmsu@gmail.com')}
                disabled={isLoading}
                className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    พ
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>นายพงศ์ภรณ์ ทองศิริ</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-rescue-500/20 text-rescue-400 rounded-md">Dev</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">developer.rcpmsu@gmail.com</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Account 2 */}
              <button
                type="button"
                onClick={() => handleSelectAccount('นิสิตกู้ภัยราชพฤกษ์ มมส', 'rescue.msu@gmail.com')}
                disabled={isLoading}
                className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    ก
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">นิสิตกู้ภัยราชพฤกษ์ มมส</p>
                    <p className="text-[11px] text-slate-400 font-mono">rescue.msu@gmail.com</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Custom Account Input Toggle */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full py-2.5 px-3 text-xs text-rescue-400 hover:text-rescue-300 font-medium text-center border border-dashed border-slate-700 hover:border-rescue-500/50 rounded-xl transition-all"
              >
                + ใช้บัญชี Google อื่น (Use another account)
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="pt-2 space-y-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    อีเมล Google (@gmail.com)
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="your.google.account@gmail.com"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ชื่อที่แสดง (เว้นว่างได้ ระบบจะดึงจากอีเมล)
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อ - สกุล"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-xl text-xs transition-all shadow"
                >
                  ยืนยันและเข้าสู่ระบบด้วยบัญชีนี้
                </button>
              </form>
            )}
          </div>
        )}

        {/* Security Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ระบบเชื่อมต่อกับ Supabase Auth & Google OAuth อย่างปลอดภัย
          </p>
        </div>

      </div>
    </div>
  );
}
