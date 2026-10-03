import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Info, Users, ExternalLink } from 'lucide-react';
import { DataService, GOOGLE_CLIENT_ID } from '../supabase';
import { 
  initGoogleIdentityServices, 
  renderGoogleButton, 
  getGoogleTokenClient, 
  decodeJwtResponse 
} from '../utils/googleAuth';

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showPopupTip, setShowPopupTip] = useState(false);
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

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setShowPopupTip(false);
    let isCancelled = false;

    const setupGoogleAuth = () => {
      if (!window.google?.accounts || !GOOGLE_CLIENT_ID) return false;

      // 1. Initialize Google Identity Services (GIS) safely with singleton protection
      initGoogleIdentityServices(GOOGLE_CLIENT_ID, async (response) => {
        if (response?.credential) {
          const payload = decodeJwtResponse(response.credential);
          if (payload?.email) {
            const cleanEmail = payload.email.trim().toLowerCase();
            const cleanName = payload.name || cleanEmail.split('@')[0];
            const avatar = payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
            await handleUserLoginSuccess(cleanName, cleanEmail, avatar);
          } else {
            setErrorMsg('ไม่สามารถอ่านข้อมูลอีเมลจากบัญชี Google ได้');
          }
        }
      });

      // 2. Render Google Sign-In Button with 'signin_with' to allow selecting ANY account
      if (googleBtnContainerRef.current) {
        const rendered = renderGoogleButton(googleBtnContainerRef.current, {
          width: 320,
          theme: 'outline',
          text: 'signin_with'
        });
        if (rendered && !isCancelled) {
          setIsGsiLoaded(true);
        }
      }

      // 3. Pre-initialize OAuth token client for manual account switcher
      getGoogleTokenClient(
        GOOGLE_CLIENT_ID,
        async (tokenResponse) => {
          if (tokenResponse?.error) {
            setErrorMsg('การเลือกบัญชีถูกยกเลิก หรือเกิดข้อผิดพลาด');
            setIsLoading(false);
            return;
          }
          setIsLoading(true);
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const profile = await res.json();
            if (profile?.email) {
              const cleanEmail = profile.email.trim().toLowerCase();
              const cleanName = profile.name || cleanEmail.split('@')[0];
              const avatar = profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
              await handleUserLoginSuccess(cleanName, cleanEmail, avatar);
            } else {
              throw new Error('ไม่พบข้อมูลอีเมล');
            }
          } catch (e) {
            console.error('Fetch userinfo error:', e);
            setErrorMsg('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี Google');
            setIsLoading(false);
          }
        },
        (err) => {
          console.warn('OAuth popup error:', err);
          if (err?.type === 'popup_failed_to_open') {
            setShowPopupTip(true);
          }
          setIsLoading(false);
        }
      );

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

  const handleOpenAccountChooser = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setShowPopupTip(false);

    const tokenClient = getGoogleTokenClient(
      GOOGLE_CLIENT_ID,
      async (tokenResponse) => {
        if (tokenResponse?.error) {
          setErrorMsg('การเลือกบัญชีถูกยกเลิก');
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          const profile = await res.json();
          if (profile?.email) {
            const cleanEmail = profile.email.trim().toLowerCase();
            const cleanName = profile.name || cleanEmail.split('@')[0];
            const avatar = profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
            await handleUserLoginSuccess(cleanName, cleanEmail, avatar);
          } else {
            throw new Error('ไม่พบข้อมูลอีเมล');
          }
        } catch (e) {
          setErrorMsg('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี Google');
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('OAuth popup error:', err);
        if (err?.type === 'popup_failed_to_open') {
          setShowPopupTip(true);
        }
        setIsLoading(false);
      }
    );

    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('Token client request failed:', e);
      }
    }

    setErrorMsg('ระบบกำลังเตรียมพร้อม กรุณากดปุ่ม "ลงชื่อเข้าใช้ด้วย Google" ด้านบน');
    setIsLoading(false);
  };

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
            <span>เลือกบัญชี Gmail ใดก็ได้ ระบบบันทึกอัตโนมัติ</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Popup Blocked Warning Box with Clear Actionable Steps */}
        {showPopupTip && (
          <div className="mb-4 p-4 bg-amber-950/70 border border-amber-500/60 rounded-2xl text-amber-200 text-xs space-y-2.5 animate-in fade-in shadow-lg">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Info className="w-5 h-5 text-amber-400 shrink-0" />
              <span>เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป (Pop-up Blocked)</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-amber-200/95 leading-relaxed pl-1 sm:pl-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>มองที่<b>มุมขวาสุดของช่องใส่ URL (Address Bar)</b> ด้านบนของเบราว์เซอร์</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>คลิกไอคอนป๊อปอัปสีแดง แล้วเลือก <b>"อนุญาตป๊อปอัปและการเปลี่ยนเส้นทางเสมอ"</b></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>กดปุ่ม <b>"ลงชื่อเข้าใช้ด้วย Google"</b> ในกล่องด้านล่างได้ทันที</span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-500/30 flex justify-between items-center">
              <a
                href="https://accounts.google.com/AccountChooser"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white underline font-medium"
              >
                <span>เปิดหน้าสลับบัญชี Google ในแท็บใหม่</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        <div className="relative z-10 space-y-3.5">
          {/* Main Official Google Button Container */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-slate-300 font-medium text-center">
              คลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบ (สามารถเลือกบัญชี Gmail ได้):
            </p>

            <div className="min-h-[46px] w-full flex justify-center items-center py-1">
              <div 
                ref={googleBtnContainerRef} 
                id="google-official-btn" 
                className="flex justify-center transition-all duration-300 hover:scale-[1.02]" 
              />
            </div>

            {!isGsiLoaded && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rescue-500" />
                <span>กำลังโหลดระบบ Google Sign-In...</span>
              </div>
            )}
          </div>

          {/* Account Chooser Switcher Button (Allows picking ANY account explicitly) */}
          <button
            type="button"
            onClick={handleOpenAccountChooser}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-2xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2.5 text-xs active:scale-[0.98] shadow-md cursor-pointer"
          >
            <Users className="w-4 h-4 text-orange-400" />
            <span>{isLoading ? 'กำลังเปิดหน้าต่างเลือกบัญชี...' : 'เลือกบัญชี Google อื่น / สลับบัญชี Gmail'}</span>
          </button>

          <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>ความปลอดภัยมาตรฐาน Google Identity Services • ไม่ล็อกบัญชี</span>
          </div>
        </div>

      </div>
    </div>
  );
}
