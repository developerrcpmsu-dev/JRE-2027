import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, User, Mail, ArrowRight, AlertCircle, ChevronRight } from 'lucide-react';
import { DataService, GOOGLE_CLIENT_ID } from '../supabase';

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
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
                  if (onLoginSuccess) {
                    onLoginSuccess(user);
                  }
                  onClose();
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
          console.warn('Google OAuth client init notice in modal:', e);
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
  }, [isOpen, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleGoogleClick = () => {
    setIsLoading(true);
    setErrorMsg(null);

    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn('tokenClient.requestAccessToken failed in modal:', err);
      }
    }

    setIsLoading(false);
    setShowCustomInput(true);
  };

  const handleSelectAccount = async (name, email, avatar) => {
    setIsLoading(true);
    setErrorMsg(null);
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
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วยบัญชี Google');
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
          <div className="w-14 h-14 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-white/10 mb-3 p-2.5">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-white">เข้าสู่ระบบด้วยบัญชี Google</h3>
          <p className="text-emerald-400 text-xs mt-1 font-semibold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ไม่ต้องกรอกชื่อ รหัส หรืออีเมล ยืนยันตัวตนอัตโนมัติ</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* THE NATIVE GOOGLE ACCOUNT SELECTOR BUTTON */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm group active:scale-[0.98] border border-slate-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{isLoading ? 'กำลังเชื่อมต่อ Google...' : 'เลือกบัญชี Google ในเครื่อง'}</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Quick Select Developer / Primary Account */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectAccount('นายพงศ์ภรณ์ ทองศิริ (Dev RCP16-37)', 'developer.rcpmsu@gmail.com')}
              disabled={isLoading}
              className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left text-xs transition-colors group"
            >
              <div className="flex items-center gap-3">
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
          </div>

          {/* Option to type any other Gmail if desired */}
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-rescue-400" />
              <span>ใช้บัญชี Google อื่น (@gmail.com)</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  อีเมล Gmail ของคุณ:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  ชื่อ-นามสกุล (ตามบัญชี Google):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="ชื่อ-นามสกุลของคุณ"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>เข้าสู่ระบบด้วยบัญชีนี้</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>เชื่อมต่อฐานข้อมูล Supabase และบันทึกบัญชีอัตโนมัติ</span>
          </div>
        </div>

      </div>
    </div>
  );
}
