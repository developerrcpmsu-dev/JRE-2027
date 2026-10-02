import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

export default function GoogleLoginModal({ isOpen, onClose }) {
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
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Google: ' + err.message);
      }
    } else {
      alert('กำลังเตรียมระบบ Supabase Credentials...');
    }
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-white/10 mb-4 p-3">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white">เข้าสู่ระบบด้วย Google</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-xs mx-auto">
            ใช้บัญชี Google เพื่อสมัครและติดตามสถานะห้องพัก/กลุ่มฝึก JRE 2027
          </p>
        </div>

        {/* Primary Single Action: Direct Google OAuth */}
        <div className="space-y-4">
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
            <span>ดำเนินการต่อด้วย Google (OAuth)</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ระบบเชื่อมต่อกับ Supabase Auth & Google OAuth อย่างปลอดภัย
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            ข้อมูลชื่อ-นามสกุล, อีเมล, และรูปภาพโปรไฟล์จะถูกดึงจาก Google อัตโนมัติ
          </p>
        </div>

      </div>
    </div>
  );
}
