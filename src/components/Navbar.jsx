import React, { useState } from 'react';
import { 
  Shield, 
  Flame, 
  Menu, 
  X, 
  Calendar, 
  Home, 
  FileText, 
  Bell, 
  Lock, 
  LogOut, 
  UserCheck, 
  Award, 
  ExternalLink 
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  isAdmin, 
  onOpenGoogleLogin, 
  onOpenAdminLogin, 
  onLogout,
  myRegistration,
  formsConfig
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if any Google Form is active
  const hasActiveForms = formsConfig && Object.values(formsConfig).some(f => f.enabled);

  const handleNav = (tab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rescue-600 via-orange-500 to-emergency-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform duration-300">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-slate-950 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-amber-200">
                  JRE <span className="text-rescue-500">2027</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-md">
                  มมส
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'home'
                  ? 'bg-slate-800 text-rescue-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              หน้าแรก
            </button>

            <button
              onClick={() => handleNav('schedule')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                currentTab === 'schedule'
                  ? 'bg-slate-800 text-rescue-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              กำหนดการ (7-8 พ.ย.)
            </button>

            <button
              onClick={() => handleNav('announcements')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 relative ${
                currentTab === 'announcements'
                  ? 'bg-slate-800 text-rescue-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              ประกาศข่าวสาร
              <span className="w-2 h-2 rounded-full bg-emergency-500 animate-pulse"></span>
            </button>

            {/* Applicant Dashboard / Register Link */}
            <button
              onClick={() => handleNav('register')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${
                currentTab === 'register'
                  ? 'bg-rescue-600 text-white shadow-lg shadow-rescue-600/30 ring-2 ring-rescue-400'
                  : myRegistration
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:bg-slate-700'
                  : 'bg-gradient-to-r from-rescue-600 to-orange-500 text-white hover:from-rescue-500 hover:to-orange-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              {myRegistration ? 'แดชบอร์ดของฉัน' : 'สมัครเข้าร่วมโครงการ'}
            </button>

            {/* Admin Panel Tab if logged in as Admin */}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400'
                    : 'bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/80'
                }`}
              >
                <Award className="w-4 h-4" />
                ระบบจัดการ Admin
              </button>
            )}
          </nav>

          {/* Desktop Right Action Area: Auth & Status */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-inner">
                <img 
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                  alt={user.name || 'User'} 
                  className="w-8 h-8 rounded-full border border-rescue-500/50 object-cover"
                />
                <div className="text-left text-xs leading-tight">
                  <p className="font-semibold text-white truncate max-w-[120px]">{user.name || user.email?.split('@')[0]}</p>
                  <p className="text-slate-400 text-[10px] flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    Google Login
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-3 bg-purple-950/60 border border-purple-800/80 px-3 py-1.5 rounded-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-purple-200">Admin Mode</span>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบแอดมิน"
                  className="p-1.5 text-purple-300 hover:text-red-400 hover:bg-purple-900/50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenGoogleLogin}
                  className="flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-100 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  เข้าสู่ระบบ Google
                </button>

                <button
                  onClick={onOpenAdminLogin}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center gap-1 transition-all"
                  title="เข้าสู่ระบบผู้ดูแลระบบ (Admin)"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!user && !isAdmin && (
              <button
                onClick={onOpenGoogleLogin}
                className="flex items-center gap-1.5 bg-white text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                เข้าสู่ระบบ
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl mb-2">
              <img 
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                alt={user.name || 'User'} 
                className="w-9 h-9 rounded-full object-cover border border-rescue-500"
              />
              <div className="flex-1 truncate">
                <p className="font-bold text-white text-sm">{user.name}</p>
                <p className="text-slate-400 text-xs truncate">{user.email}</p>
              </div>
              <button onClick={onLogout} className="p-2 text-red-400 hover:bg-slate-700 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
              currentTab === 'home' ? 'bg-rescue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            หน้าแรก
          </button>

          <button
            onClick={() => handleNav('schedule')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
              currentTab === 'schedule' ? 'bg-rescue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            กำหนดการ 2 วัน 1 คืน
          </button>

          <button
            onClick={() => handleNav('announcements')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
              currentTab === 'announcements' ? 'bg-rescue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            ประกาศข่าวสาร
          </button>

          <button
            onClick={() => handleNav('register')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${
              currentTab === 'register' 
                ? 'bg-orange-500 text-white' 
                : myRegistration
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'bg-rescue-600 text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            {myRegistration ? 'แดชบอร์ดผู้สมัครของฉัน' : 'สมัครเข้าร่วมโครงการ JRE 2027'}
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${
                currentTab === 'admin' ? 'bg-purple-600 text-white' : 'bg-purple-950/80 text-purple-300'
              }`}
            >
              <Award className="w-5 h-5" />
              ระบบจัดการ Admin
            </button>
          )}

          {!user && !isAdmin && (
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenGoogleLogin(); }}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3 rounded-xl shadow"
              >
                เข้าสู่ระบบด้วย Google
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAdminLogin(); }}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-2 rounded-xl text-sm"
              >
                <Lock className="w-4 h-4" /> เข้าสู่ระบบผู้ดูแลระบบ (Admin)
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
