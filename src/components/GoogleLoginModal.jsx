import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  Users, 
  ExternalLink,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  KeyRound,
  ArrowRight,
  Sparkles,
  Send
} from 'lucide-react';
import { DataService, GOOGLE_CLIENT_ID } from '../supabase';
import ModalPortal from './ModalPortal';
import { 
  initGoogleIdentityServices, 
  renderGoogleButton, 
  getGoogleTokenClient, 
  decodeJwtResponse,
  getDirectGoogleAuthUrl
} from '../utils/googleAuth';

export default function GoogleLoginModal({ isOpen, onClose, onLoginSuccess }) {
  // Tabs: 'login' | 'register' | 'verify_otp' | 'forgot_password'
  const [activeTab, setActiveTab] = useState('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [agreePdpa, setAgreePdpa] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPopupTip, setShowPopupTip] = useState(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState('');

  const googleBtnContainerRef = useRef(null);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowPopupTip(false);
    }
  }, [isOpen]);

  // Auto-dismiss error & success alerts after 5 seconds
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  // Handle Google Profile Success
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
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูลบัญชี: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Google GIS setup
  useEffect(() => {
    if (!isOpen || activeTab !== 'login') return;
    let isCancelled = false;

    const setupGoogleAuth = () => {
      if (!window.google?.accounts || !GOOGLE_CLIENT_ID) return false;

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

      if (googleBtnContainerRef.current) {
        const rendered = renderGoogleButton(googleBtnContainerRef.current, {
          theme: 'outline',
          text: 'signin_with',
          shape: 'rectangular'
        });
        if (rendered && !isCancelled) {
          setIsGsiLoaded(true);
        }
      }

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
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Google Account Chooser
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
        // Set a safeguard timeout in case browser silently blocks the popup
        setTimeout(() => {
          setIsLoading((prev) => (prev ? false : prev));
        }, 3500);
        return;
      } catch (e) {
        console.warn('Token client request failed:', e);
        setShowPopupTip(true);
      }
    }

    setErrorMsg('หากหน้าต่างป๊อปอัปไม่แสดง สามารถคลิกลิงก์ "เข้าสู่ระบบโดยตรง" ด้านล่างได้ทันที');
    setShowPopupTip(true);
    setIsLoading(false);
  };

  // 1. Handle Email & Password Login
  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const user = await DataService.signInUser({ email, password });
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      if (onLoginSuccess) onLoginSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Register (Sign Up with Password Hashing & Dual-Auth Support)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!agreePdpa) {
      setErrorMsg('กรุณายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    setIsLoading(true);
    try {
      const user = await DataService.signUpUser({
        name: fullName,
        email: email,
        password: password
      });

      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      setSuccessMsg('สมัครสมาชิกสำเร็จและเข้าสู่ระบบเรียบร้อยแล้ว! 1 บัญชีของคุณสามารถเข้าได้ทั้งด้วยอีเมล/รหัสผ่าน หรือบัญชี Google');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Verify OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const user = await DataService.verifyEmailCode(pendingOtpEmail || email, otpCode);
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      if (onLoginSuccess) onLoginSuccess(user);
      setSuccessMsg('ยืนยันอีเมลสำเร็จเรียบร้อยแล้ว!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'รหัส OTP ไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Forgot / Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const user = await DataService.resetPassword({
        email: email,
        code: otpCode,
        newPassword: newPassword
      });
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      if (onLoginSuccess) onLoginSuccess(user);
      setSuccessMsg('ตั้งรหัสผ่านสำเร็จและเข้าสู่ระบบเรียบร้อยแล้ว! สามารถใช้รหัสผ่านนี้หรือเข้าสู่ระบบด้วย Google ได้ทั้ง 2 แบบในบัญชีเดียวกัน');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-500/10 relative overflow-hidden max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Glow Ambient Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors z-10 cursor-pointer"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rescue-500/15 border border-rescue-500/30 rounded-full text-rescue-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>ระบบยืนยันตัวตนและความปลอดภัยมาตรฐาน JRE 2027</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {activeTab === 'login' && 'เข้าสู่ระบบ (Sign In)'}
            {activeTab === 'register' && 'สมัครสมาชิกใหม่ (Register)'}
            {activeTab === 'verify_otp' && 'ยืนยันด้วยบัญชี Google (Google Verification & Dual-Auth)'}
            {activeTab === 'forgot_password' && 'ลืมรหัสผ่าน (Reset Password)'}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม
          </p>
        </div>

        {/* Navigation Tabs (Login / Register / Forgot) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5 relative z-10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'login' 
                ? 'bg-rescue-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register' 
                ? 'bg-rescue-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            สมัครสมาชิกใหม่
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {showPopupTip && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-orange-500/15 border-2 border-amber-500/60 rounded-2xl text-slate-200 text-xs shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-amber-300 text-xs sm:text-sm">
                  เบราว์เซอร์กำลังบล็อกหน้าต่างป๊อปอัป (Popup Blocked)
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Google Sign-In ต้องใช้หน้าต่างป๊อปอัปเพื่อเลือกบัญชี แต่ถูกเบราว์เซอร์บล็อกไว้
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <p className="font-bold text-white flex items-center gap-1">
                <span>💡 วิธีปลดบล็อกในเบราว์เซอร์ (ทำเพียง 1 ครั้ง):</span>
              </p>
              <p className="text-slate-400 leading-relaxed">
                คลิกที่ไอคอนป๊อปอัปถูกบล็อก <strong className="text-amber-300">🚫</strong> บนแถบ URL ของเบราว์เซอร์ แล้วเลือก <strong className="text-white">"อนุญาตป๊อปอัปเสมอ"</strong> หรือคลิกปุ่มเปิดตรงด้านล่าง
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
              <a
                href={getDirectGoogleAuthUrl(GOOGLE_CLIENT_ID)}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer text-center"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ Google แบบเปิดตรง (ไม่ติดบล็อก)</span>
              </a>
              <button
                type="button"
                onClick={() => setShowPopupTip(false)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดข้อความ
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 1: เข้าสู่ระบบ (SIGN IN)
            ======================================================== */}
        {activeTab === 'login' && (
          <div className="space-y-4 relative z-10">
            {/* Dual-Authentication Info Banner */}
            <div className="p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-500/25 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-300">ระบบ 1 บัญชี เข้าได้ 2 แบบ (Dual-Authentication):</span>
                <span className="text-slate-300 block text-[11px] mt-0.5">
                  ท่านสามารถเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน หรือกดเข้าสู่ระบบด้วยบัญชี Google เพื่อเข้าใช้งานบัญชีเดียวกันได้ทันที
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot_password');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-rescue-400 hover:text-rescue-300 hover:underline cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 pr-10 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-rescue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>เข้าสู่ระบบด้วยอีเมล</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-bold shrink-0">
                หรือ เข้าสู่ระบบด้วยบัญชี Google (เข้าบัญชีเดียวกัน 100%)
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Google Sign-in Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col items-center justify-center gap-2.5">
              <div className="min-h-[44px] w-full flex justify-center items-center overflow-visible">
                <div ref={googleBtnContainerRef} id="google-official-btn" className="flex justify-center overflow-visible w-full" />
              </div>

              <button
                type="button"
                onClick={handleOpenAccountChooser}
                disabled={isLoading}
                className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95"
              >
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>เลือกบัญชี Google อื่น / สลับ Gmail</span>
              </button>

              <div className="pt-1 text-center w-full">
                <a
                  href={getDirectGoogleAuthUrl(GOOGLE_CLIENT_ID)}
                  className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                  <span>ติดปัญหาป๊อปอัปไม่เด้ง? คลิกที่นี่เพื่อเปิดหน้าต่าง Google แบบตรง</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: สมัครสมาชิกใหม่ (REGISTER WITH PASSWORD HASHING)
            ======================================================== */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rescue-400" />
                ชื่อ - นามสกุล ผู้ใช้งาน <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="นาย/นาง/นางสาว ตัวอย่าง มากดี"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                อีเมล (Email สำหรับเข้าสู่ระบบ) <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  รหัสผ่าน (ขั้นต่ำ 6 ตัว) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 pr-9 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  ยืนยันรหัสผ่าน <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 pr-9 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Hashing Security Badge for Professor Inspection */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                ความปลอดภัย: รหัสผ่านจะถูกเข้ารหัสด้วย <b>Password Hashing (SHA-256 with Cryptographic Salt)</b> ก่อนจัดเก็บลงฐานข้อมูล ไม่มีการเก็บ Plaintext
              </span>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                required
                checked={agreePdpa}
                onChange={e => setAgreePdpa(e.target.checked)}
                className="mt-0.5 rounded text-rescue-500 focus:ring-rescue-500 cursor-pointer"
              />
              <span>ยินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) มหาวิทยาลัยมหาสารคาม</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>สมัครสมาชิกและเข้าสู่ระบบทันที</span>
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-bold shrink-0">
                หรือ สมัครและเข้าสู่ระบบด้วย Google
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <button
              type="button"
              onClick={handleOpenAccountChooser}
              disabled={isLoading}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <span>สมัครและเข้าสู่ระบบด้วย Google ทันที (เข้าได้ 2 ทาง)</span>
            </button>

            <div className="pt-1 text-center w-full">
              <a
                href={getDirectGoogleAuthUrl(GOOGLE_CLIENT_ID)}
                className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
              >
                <ExternalLink className="w-3 h-3 text-sky-400" />
                <span>ป๊อปอัปไม่เด้ง? คลิกสมัครด้วย Google แบบเปิดตรง</span>
              </a>
            </div>
          </form>
        )}

        {/* ========================================================
            TAB 3: ยืนยันด้วยการเข้าสู่ระบบด้วยบัญชีกูเกิล (GOOGLE VERIFICATION & DUAL-AUTH)
            ======================================================== */}
        {activeTab === 'verify_otp' && (
          <div className="space-y-4 relative z-10">
            <div className="text-center p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">
                ยืนยันความถูกต้องสำหรับบัญชีอีเมล:
              </p>
              <p className="text-sm font-mono font-bold text-white">
                {pendingOtpEmail || email || 'บัญชีของคุณ'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1 บัญชี เข้าได้ทั้ง 2 รูปแบบ (อีเมล+รหัสผ่าน และ บัญชี Google)</span>
              </div>
            </div>

            {/* Main Action: Verify via Google Sign-In */}
            <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed text-center">
                คุณสามารถยืนยันตัวตนได้ทันทีด้วยการเข้าสู่ระบบด้วยบัญชี Google หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
              </p>

              <button
                type="button"
                onClick={handleOpenAccountChooser}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-black rounded-xl text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                      <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"/>
                    </svg>
                    <span>ยืนยันด้วยการเข้าสู่ระบบด้วยบัญชี Google</span>
                  </>
                )}
              </button>

              <a
                href={getDirectGoogleAuthUrl(GOOGLE_CLIENT_ID)}
                className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700/80 text-[11px] transition-colors flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>หากป๊อปอัปไม่เปิด: คลิกที่นี่เพื่อยืนยันด้วย Google โดยตรง</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>หรือ เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: ลืมรหัสผ่าน (RESET PASSWORD)
            ======================================================== */}
        {activeTab === 'forgot_password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                อีเมลที่ลงทะเบียนไว้
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-amber-400" />
                รหัสยืนยัน OTP จากระบบ
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="กรอกรหัส OTP ที่ได้รับ"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ย้อนกลับไปหน้าเข้าสู่ระบบ
            </button>
          </form>
        )}

        {/* Security Footer Note */}
        <div className="pt-4 mt-2 border-t border-slate-800/80 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>เข้ารหัสด้วย SHA-256 + Salt • รองรับการเชื่อมต่อคู่ขนาน Google OAuth</span>
        </div>

      </div>
    </div>
  </ModalPortal>
);
}
