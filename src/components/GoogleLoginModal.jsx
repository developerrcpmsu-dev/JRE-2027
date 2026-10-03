import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles } from 'lucide-react';
import { DataService, GOOGLE_CLIENT_ID } from '../supabase';

// Helper to decode Google JWT Identity Credential Token client-side safely
function decodeJwtResponse(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode Google JWT token:', e);
    return null;
  }
}

// Module-level singletons to prevent duplicate initialize() calls
let isGsiInitialized = false;
let activeLoginCallback = null;

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const googleBtnContainerRef = useRef(null);

  // Sync logged-in user profile with Supabase and localStorage
  const handleUserLoginSuccess = async (cleanName, cleanEmail, avatar) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await DataService.loginWithGoogleProfile({
        name: cleanName,
        email: cleanEmail,
        avatar: avatar
      });

      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      onClose();
    } catch (err) {
      console.error('Google profile sync error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูลบัญชี กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // Always keep the active callback pointing to current props
  useEffect(() => {
    activeLoginCallback = handleUserLoginSuccess;
  });

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    let isCancelled = false;

    const setupGoogleAuth = () => {
      if (!window.google?.accounts?.id || !GOOGLE_CLIENT_ID) return false;

      // 1. Initialize Google Identity Services ONCE only
      if (!isGsiInitialized) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response?.credential && activeLoginCallback) {
                const payload = decodeJwtResponse(response.credential);
                if (payload?.email) {
                  const cleanEmail = payload.email.trim().toLowerCase();
                  const cleanName = payload.name || cleanEmail.split('@')[0];
                  const avatar = payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
                  await activeLoginCallback(cleanName, cleanEmail, avatar);
                } else {
                  setErrorMsg('ไม่สามารถอ่านข้อมูลอีเมลจากบัญชี Google ได้');
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin'
          });
          isGsiInitialized = true;
        } catch (e) {
          console.warn('GIS initialize error:', e);
        }
      }

      // 2. Render the official Google Sign-In button
      if (googleBtnContainerRef.current) {
        try {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320,
            locale: 'th'
          });
          if (!isCancelled) setIsGsiLoaded(true);
        } catch (e) {
          console.warn('GIS renderButton error:', e);
        }
      }

      return true;
    };

    if (!setupGoogleAuth()) {
      const interval = setInterval(() => {
        if (setupGoogleAuth()) {
          clearInterval(interval);
        }
      }, 150);
      const timer = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        isCancelled = true;
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-500/10 relative overflow-hidden">
        
        {/* Glow Ambient Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors z-10"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/10 mb-4 p-3.5 border border-slate-200/50">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            เข้าสู่ระบบด้วยบัญชี Google
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            โครงการ JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ยืนยันตัวตนอัตโนมัติ ไม่ต้องตั้งหรือจำรหัสผ่าน</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* The Star of the Modal: The Official Google Button Container */}
        <div className="relative z-10 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-slate-300 font-medium text-center">
              คลิกปุ่มทางการของ Google ด้านล่าง เพื่อยืนยันตัวตน:
            </p>

            <div className="min-h-[46px] w-full flex justify-center items-center py-1">
              <div 
                ref={googleBtnContainerRef} 
                id="google-official-btn" 
                className="flex justify-center transition-all duration-300 hover:scale-[1.02]" 
              />
            </div>

            {!isGsiLoaded && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-rescue-500" />
                <span>กำลังเชื่อมต่อความปลอดภัย Google...</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-xs pt-1">
              ระบบจะดึงชื่อ-นามสกุล อีเมล และรูปโปรไฟล์จาก Google มาสร้างบัญชีผู้เข้าร่วมโครงการให้อัตโนมัติ 100%
            </p>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>ความปลอดภัยมาตรฐาน Google Identity Services • เข้ารหัสข้อมูลสากล</span>
          </div>
        </div>

      </div>
    </div>
  );
}
