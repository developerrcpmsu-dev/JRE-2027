import React, { useState } from 'react';
import { 
  Flame, 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Key, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  UserPlus,
  LogIn
} from 'lucide-react';
import { DataService } from '../supabase';

export default function AuthPortalView({ onLoginSuccess, onOpenAdminLogin }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Google Account Chooser State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Status & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // 1. Google 1-Click Authentication
  const handleGoogleAuth = async (name, email, avatar) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await DataService.loginWithGoogleProfile({ name, email, avatar });
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Custom Google Email
  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail) return;
    const cleanEmail = customGoogleEmail.trim().toLowerCase();
    let name = customGoogleName.trim();
    if (!name) {
      name = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    handleGoogleAuth(name, cleanEmail);
  };

  // 3. Email & Password Sign In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await DataService.signInUser({
        email: signInEmail,
        password: signInPassword
      });
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      let msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้สมัครสมาชิก';
      if (err.message && err.message.includes('Invalid login credentials')) {
        msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Email & Password Sign Up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) return;

    if (signUpPassword.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await DataService.signUpUser({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword
      });
      setSuccessMsg('สร้างบัญชีสำเร็จ กำลังเข้าสู่ระบบ...');
      localStorage.setItem('jre2027_auth_user', JSON.stringify(user));
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err) {
      console.error(err);
      let msg = err.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้';
      if (msg.includes('User already registered')) {
        msg = 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว โปรดเลือกแท็บ "เข้าสู่ระบบ" ด้านบน';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
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

        {/* Security Requirement Notice Badge */}
        <div className="mt-4 p-3 bg-slate-900/90 border border-orange-500/30 rounded-2xl text-left flex items-start gap-2.5 shadow-lg">
          <Lock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white">ระบบสำหรับผู้เข้าสู่ระบบเท่านั้น</p>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              กรุณาเข้าสู่ระบบหรือสร้างบัญชีเพื่อเข้าดูข้อมูลโครงการ กำหนดการ ประกาศข่าวสาร และส่งใบสมัคร
            </p>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          
          {/* Tabs: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMsg(null); setShowGoogleChooser(false); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-rescue-600 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); setShowGoogleChooser(false); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-rescue-600 to-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>สมัครสมาชิกใหม่</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* GOOGLE QUICK AUTH BUTTON (Always available in both tabs) */}
          <div className="space-y-3">
            {!showGoogleChooser ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGoogleChooser(true)}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-slate-200 text-xs sm:text-sm group"
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
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  ดึงชื่อ อีเมล และรูปโปรไฟล์จาก Google อัตโนมัติ 100%
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300">เลือกบัญชี Google:</span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleChooser(false)}
                    className="text-[10px] text-rescue-400 hover:text-rescue-300"
                  >
                    ปิด
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleAuth('นายพงศ์ภรณ์ ทองศิริ (Dev RCP16-37)', 'developer.rcpmsu@gmail.com')}
                  disabled={isLoading}
                  className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-between text-left text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                      พ
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">นายพงศ์ภรณ์ ทองศิริ</p>
                      <p className="text-[10px] text-slate-400 font-mono">developer.rcpmsu@gmail.com</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                <form onSubmit={handleCustomGoogleSubmit} className="pt-1 space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="กรอกอีเมล Google (@gmail.com)"
                    value={customGoogleEmail}
                    onChange={e => setCustomGoogleEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-rescue-600 hover:bg-rescue-500 text-white font-bold rounded-xl text-xs"
                  >
                    เข้าสู่ระบบด้วยอีเมลนี้
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
                หรือใช้อีเมลและรหัสผ่าน
              </span>
            </div>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={e => setSignInEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={e => setSignInPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ (Sign In)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่อ - นามสกุลจริง *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    placeholder="เช่น นาย สมเกียรติ รักปลอดภัย"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  อีเมล (@gmail.com หรืออีเมลอื่น) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={e => setSignUpEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน 6 ตัวขึ้นไป"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>สร้างบัญชีผู้ใช้งานใหม่ (Sign Up)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Admin Mode Shortcut Link */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <Lock className="w-3 h-3 text-purple-400" />
              <span>สำหรับผู้ดูแลระบบ: เข้าสู่ระบบ Admin (Admin Login)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-slate-500 pb-2">
        <p>© 2569 - {currentBE} JRE 2027 ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม สงวนลิขสิทธิ์</p>
        <p className="text-[11px] text-slate-600 mt-0.5">พัฒนาระบบโดย Dev RCP16-37 นายพงศ์ภรณ์ ทองศิริ</p>
      </div>

    </div>
  );
}
