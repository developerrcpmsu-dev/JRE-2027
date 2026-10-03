import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { DataService, GOOGLE_CLIENT_ID } from '../supabase';
import PDPAModal from '../components/PDPAModal';

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

export default function AuthPortalView({ onLoginSuccess, onOpenAdminLogin }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showPdpaModal, setShowPdpaModal] = useState(false);
  const googleBtnContainerRef = useRef(null);

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
    } catch (err) {
      console.error('Google profile sync error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูลบัญชี กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const setupGoogleAuth = () => {
      if (!window.google?.accounts) return false;

      // 1. Official Google Identity Services (GIS) Sign-In Button (Uses JWT)
      if (window.google.accounts.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
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
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin'
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 300,
              locale: 'th'
            });
          }

          // Button rendered cleanly without unprompted background popup
          if (!isCancelled) setIsGsiLoaded(true);
        } catch (e) {
          console.warn('GIS initialize notice in AuthPortal:', e);
        }
      }

      // 2. Google OAuth2 Token Client (Popup flow)
      if (window.google.accounts.oauth2 && GOOGLE_CLIENT_ID) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            prompt: 'select_account',
            error_callback: (err) => {
              console.warn('OAuth popup error:', err);
              if (err?.type === 'popup_failed_to_open') {
                setErrorMsg('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณากดปุ่ม "ดำเนินการต่อด้วย Google" ด้านบน หรือกดอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้');
              } else if (err?.type !== 'popup_closed') {
                setErrorMsg('หน้าต่างเลือกบัญชี Google ถูกปิด หรือเกิดข้อผิดพลาด');
              }
              setIsLoading(false);
            },
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                setErrorMsg('การเข้าสู่ระบบถูกยกเลิก หรือเกิดข้อผิดพลาดจาก Google');
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
                  throw new Error('ไม่สามารถอ่านข้อมูลอีเมลจาก Google ได้');
                }
              } catch (e) {
                console.error('Fetch userinfo error:', e);
                setErrorMsg('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี Google');
                setIsLoading(false);
              }
            }
          });

          if (!isCancelled) setTokenClient(client);
        } catch (e) {
          console.warn('OAuth2 client init notice:', e);
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
      const timer = setTimeout(() => clearInterval(interval), 6000);
      return () => {
        isCancelled = true;
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleCustomPopupClick = () => {
    setIsLoading(true);
    setErrorMsg(null);

    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('tokenClient.requestAccessToken error:', e);
      }
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setErrorMsg('กรุณาคลิกที่ปุ่ม "ดำเนินการต่อด้วย Google" ด้านบน เพื่อเข้าสู่ระบบ');
            setIsLoading(false);
          }
        });
        return;
      } catch (e) {}
    }

    setErrorMsg('ระบบ Google กำลังเชื่อมต่อ กรุณารอสักครู่แล้วลองกดใหม่อีกครั้ง');
    setIsLoading(false);
  };

  const currentBE = new Date().getFullYear() + 543;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-white">
      
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto text-center pt-4 pb-2">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rescue-600 via-orange-500 to-emergency-600 flex items-center justify-center shadow-xl shadow-orange-500/30">
            <Flame className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-amber-200">
            JRE <span className="text-rescue-500">2027</span>
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-md">
            มมส
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
        </p>
      </div>

      {/* Main Card: ONLY OFFICIAL GOOGLE AUTHENTICATION */}
      <div className="max-w-md w-full mx-auto my-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          
          {/* Prominent Instruction Notice */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl mb-6 text-center shadow-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold mb-2 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ไม่ต้องกรอกชื่อ รหัส หรืออีเมล</span>
            </div>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              โครงการ JRE 2027 ใช้ระบบ <strong className="text-white">เข้าสู่ระบบด้วยบัญชี Google เท่านั้น</strong> เพื่อยืนยันตัวตนอัตโนมัติ สะดวก ปลอดภัย ไม่ต้องจำรหัสผ่าน
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Official Google Identity Button (GIS Iframe) */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <p className="text-[11px] text-slate-400 mb-2 font-medium">
                คลิกปุ่มของ Google เพื่อเข้าสู่ระบบทันที:
              </p>
              <div className="min-h-[46px] flex items-center justify-center">
                <div ref={googleBtnContainerRef} id="google-official-btn-portal" className="flex justify-center" />
              </div>
              {!isGsiLoaded && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rescue-500" />
                  <span>กำลังโหลดระบบ Google Sign-In...</span>
                </div>
              )}
            </div>

            {/* 2. Direct Popup Account Chooser Button */}
            <button
              type="button"
              onClick={handleCustomPopupClick}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-3 text-sm group active:scale-[0.98] border border-slate-200"
            >
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isLoading ? 'กำลังเชื่อมต่อ Google...' : 'เปิดหน้าต่างเลือกบัญชี Google (Popup)'}</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ดึงชื่อ อีเมล และรูปโปรไฟล์จาก Google อัตโนมัติ 100%</span>
            </div>
          </div>

          {/* Admin Login Link at Bottom */}
          <div className="mt-8 pt-5 border-t border-slate-800 text-center space-y-2">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-xs text-slate-400 hover:text-rescue-400 flex items-center justify-center gap-1.5 mx-auto transition-colors group"
            >
              <Lock className="w-3.5 h-3.5 group-hover:text-rescue-400" />
              <span>สำหรับผู้ดูแลระบบ: เข้าสู่ระบบ Admin (Admin Login)</span>
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPdpaModal(true)}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors"
              >
                <span>นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA มมส)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center py-4 text-xs text-slate-500 space-y-1">
        <p>
          © 2569 - {currentBE} โครงการ JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
        </p>
        <p className="text-[11px] text-slate-600">
          ระบบสารสนเทศและการรับสมัครออนไลน์เพื่อความปลอดภัยและมาตรฐานกู้ภัยสากล
        </p>
      </footer>

      <PDPAModal 
        isOpen={showPdpaModal} 
        onClose={() => setShowPdpaModal(false)} 
      />
    </div>
  );
}
