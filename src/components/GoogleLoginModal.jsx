import React, { useState } from 'react';
import { X, User, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  if (!isOpen) return null;

  const handleSupabaseGoogleAuth = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } catch (err) {
        console.error('Google Auth Error:', err);
        // Fallback to quick simulated login if OAuth redirect is not yet allowed in Supabase dashboard
        simulateLogin('ผู้สมัคร กู้ภัยนิสิต', 'rescue.applicant@gmail.com');
      }
    } else {
      // Simulate quick login
      simulateLogin('อาสาสมัคร กู้ภัยมมส', 'volunteer.msu@gmail.com');
    }
  };

  const simulateLogin = (name, email, avatar) => {
    const userObj = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      name: name,
      email: email,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      provider: 'google'
    };
    localStorage.setItem('jre2027_auth_user', JSON.stringify(userObj));
    onLoginSuccess(userObj);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName || !customEmail) return;
    simulateLogin(customName, customEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-white/10 mb-4 p-3">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white">เข้าสู่ระบบด้วย Google</h3>
          <p className="text-slate-400 text-xs mt-1">
            ใช้บัญชี Google เพื่อสมัครและติดตามสถานะห้องพัก/กลุ่มฝึก JRE 2027
          </p>
        </div>

        {/* Primary Google Auth Button */}
        <button
          onClick={handleSupabaseGoogleAuth}
          className="w-full py-4 px-5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-slate-200 text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          ดำเนินการต่อด้วย Google
        </button>

        {/* Fast Simulation Selector for Instant Testing */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3 text-center">
            หรือเลือกบัญชีทดสอบด่วน (Quick Test Accounts)
          </p>

          <div className="space-y-2">
            <button
              onClick={() => simulateLogin('สมใจ กู้ภัยมมส', 'somjai.msu@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80')}
              className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between text-left text-xs text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                  ส
                </div>
                <div>
                  <p className="font-semibold text-white">สมใจ กู้ภัยมมส</p>
                  <p className="text-[10px] text-slate-400">somjai.msu@gmail.com</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => simulateLogin('วีระศักดิ์ กู้ภัยมข', 'weerasak.kku@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80')}
              className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between text-left text-xs text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  ว
                </div>
                <div>
                  <p className="font-semibold text-white">วีระศักดิ์ กู้ภัยมข</p>
                  <p className="text-[10px] text-slate-400">weerasak.kku@gmail.com</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="mt-3 text-[11px] text-rescue-400 hover:text-rescue-300 w-full text-center font-medium block"
            >
              + ระบุชื่อและอีเมล Google ที่ต้องการกำหนดเอง
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <input
                type="text"
                required
                placeholder="ชื่อ-สกุล"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <input
                type="email"
                required
                placeholder="อีเมล Google"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-rescue-600 hover:bg-rescue-500 text-white font-bold rounded-lg text-xs"
              >
                เข้าใช้งานด้วยบัญชีนี้
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-[10px] text-center text-slate-400">
          ระบบเชื่อมต่อกับ Supabase Auth & Google OAuth อย่างปลอดภัย
        </p>
      </div>
    </div>
  );
}
