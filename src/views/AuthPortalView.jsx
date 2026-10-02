import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Mail, 
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { DataService, GOOGLE_CLIENT_ID } from '../supabase';
import PDPAModal from '../components/PDPAModal';

export default function AuthPortalView({ onLoginSuccess, onOpenAdminLogin }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const [showPdpaModal, setShowPdpaModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // 1. Initialize Google Identity Services OAuth 2.0 Token Client (Official Google Account Chooser)
  useEffect(() => {
    let initialized = false;

    const initOAuthClient = () => {
      if (initialized) return;
      if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            prompt: 'select_account',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                console.warn('Google OAuth token error:', tokenResponse);
                setErrorMsg('การเข้าสู่ระบบถูกยกเลิก หรือเกิดข้อผิดพลาดจาก Google');
                setIsLoading(false);
                return;
              }

              setIsLoading(true);
              setErrorMsg(null);

              try {
                // Fetch user profile from official Google userinfo endpoint
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profile = await res.json();

                if (profile?.email) {
                  const cleanEmail = profile.email.trim().toLowerCase();
                  const cleanName = profile.name || cleanEmail.split('@')[0];
                  const avatar = profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
                  
                  const user = await DataService.loginWithGoogleProfile({
                    name: cleanName,
                    email: cleanEmail,
                    avatar: avatar
                  });

                  localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
                  onLoginSuccess(user);
                } else {
                  throw new Error('ไม่สามารถอ่านข้อมูลอีเมลจากบัญชี Google ได้');
                }
              } catch (err) {
                console.error('Google profile sync error:', err);
                setErrorMsg('เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี Google');
              } finally {
                setIsLoading(false);
              }
            }
          });

          setTokenClient(client);
          initialized = true;
        } catch (e) {
          console.warn('Google OAuth client init notice:', e);
        }
      }
    };

    initOAuthClient();
    const interval = setInterval(() => {
      if (!initialized && window.google?.accounts?.oauth2) {
        initOAuthClient();
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [onLoginSuccess]);

  // Handle click on the single Google Login Button
  const handleGoogleClick = () => {
    setIsLoading(true);
    setErrorMsg(null);

    // If official Google OAuth Token Client is ready, trigger official Google Account Selector
    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        // The popup opened directly by user click
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn('tokenClient.requestAccessToken failed:', err);
      }
    }

    // Fallback: If script failed to load or popup blocked, open fallback
    setIsLoading(false);
    setShowFallback(true);
  };

  // Direct login with developer profile or email
  const handleDirectAuth = async (name, email) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await DataService.loginWithGoogleProfile({ name, email });
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (e) {
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    const cleanEmail = customEmail.trim().toLowerCase();
    let name = customName.trim();
    if (!name) {
      name = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    handleDirectAuth(name, cleanEmail);
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

      {/* Main Card: ONLY 1 BUTTON, NO PASSWORD/EMAIL FIELDS */}
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
              <span>{errorMsg}</span>
            </div>
          )}

          {/* THE SINGLE OFFICIAL GOOGLE BUTTON */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-3 text-base group active:scale-[0.98] border border-slate-200"
            >
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วยบัญชี Google'}</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ดึงชื่อ อีเมล และรูปโปรไฟล์จาก Google อัตโนมัติ 100%</span>
            </div>
          </div>

          {/* Quick Fallback if popup blocked by user's browser settings */}
          {showFallback && (
            <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">เลือกบัญชีของคุณ:</span>
                <button
                  type="button"
                  onClick={() => setShowFallback(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleDirectAuth('นายพงศ์ภรณ์ ทองศิริ (Dev RCP16-37)', 'developer.rcpmsu@gmail.com')}
                disabled={isLoading}
                className="w-full p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-between text-left text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    พ
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-rescue-400 transition-colors">
                      นายพงศ์ภรณ์ ทองศิริ
                    </p>
                    <p className="text-[11px] text-slate-400">developer.rcpmsu@gmail.com</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="ใส่อีเมล Gmail อื่นของคุณ (@gmail.com)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-rescue-600 hover:bg-rescue-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  เข้าสู่ระบบด้วยอีเมลนี้
                </button>
              </form>
            </div>
          )}

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
                <ShieldCheck className="w-3.5 h-3.5 text-rescue-500" />
                <span>นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA มมส)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Copyright */}
      <footer className="max-w-md w-full mx-auto text-center pt-2 pb-4 text-[11px] text-slate-400 space-y-1">
        <p>
          © 2569 - {currentBE} JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม สงวนลิขสิทธิ์
        </p>
        <p className="text-[10px] text-slate-400">
          พัฒนาระบบโดย <span className="text-slate-300 font-medium">Dev RCP16-37 นายพงศ์ภรณ์ ทองศิริ</span>
        </p>
      </footer>

      {/* MSU PDPA Policy Modal */}
      <PDPAModal
        isOpen={showPdpaModal}
        onClose={() => setShowPdpaModal(false)}
      />

    </div>
  );
}
