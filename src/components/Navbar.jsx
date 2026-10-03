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
  ExternalLink,
  Megaphone,
  Shirt
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  currentSubRoute,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-18 lg:h-20 gap-2">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNav('home')} 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rescue-600 via-orange-500 to-emergency-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform duration-300">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 border-2 border-slate-950 rounded-full flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-amber-200 whitespace-nowrap">
                  JRE <span className="text-rescue-500">2027</span>
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-md whitespace-nowrap">
                  มมส
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden xl:block whitespace-nowrap">
                ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
              </p>
              <p className="text-[10px] text-slate-400 font-medium block xl:hidden whitespace-nowrap">
                ชมรมกู้ภัยราชพฤกษ์ มมส
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
            <button
              onClick={() => handleNav('home')}
              className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-slate-800 text-rescue-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
              <span>หน้าแรก</span>
            </button>

            <button
              onClick={() => handleNav('schedule')}
              className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'schedule'
                  ? 'bg-slate-800 text-rescue-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
              <span>กำหนดการ</span>
            </button>

            {/* ข่าวประชาสัมพันธ์โครงการ (สำหรับผู้ที่ยังไม่ได้สมัคร) */}
            {!myRegistration ? (
              <button
                onClick={() => handleNav('pr')}
                className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'pr' || (currentTab === 'announcements' && currentSubRoute === 'public')
                    ? 'bg-orange-600/30 text-orange-400 shadow-sm border border-orange-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="ประชาสัมพันธ์ข้อมูลและเงื่อนไขการรับสมัคร"
              >
                <Megaphone className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-orange-400 shrink-0" />
                <span>ข่าวประชาสัมพันธ์</span>
              </button>
            ) : (
              /* คำสั่งและประกาศสำหรับสมาชิก (แสดงเมื่อสมัครแล้ว) */
              <button
                onClick={() => handleNav('orders')}
                className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer relative ${
                  currentTab === 'orders' || (currentTab === 'announcements' && currentSubRoute === 'members')
                    ? 'bg-indigo-600/30 text-indigo-300 shadow-sm border border-indigo-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="คำสั่งและประกาศสำหรับสมาชิกผู้เข้าร่วม"
              >
                <Bell className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-indigo-400 shrink-0" />
                <span>คำสั่งสมาชิก</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
              </button>
            )}

            <button
              onClick={() => handleNav('merchandise')}
              className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'merchandise' || currentTab === 'shop'
                  ? 'bg-orange-600/30 text-orange-400 shadow-sm border border-orange-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
              title="สั่งซื้อเสื้อ & กางเกงกู้ภัยโครงการ JRE 2027"
            >
              <Shirt className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-orange-400 shrink-0" />
              <span>สั่งเสื้อ/กางเกง</span>
            </button>

            {/* Applicant Registration CTA or Dashboard Button */}
            {!myRegistration ? (
              <button
                onClick={() => handleNav('register')}
                className={`px-3.5 xl:px-4 py-1.5 xl:py-2.5 rounded-2xl text-xs xl:text-sm font-black transition-all duration-200 flex items-center gap-1.5 xl:gap-2 shadow-lg shadow-orange-500/30 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'register'
                    ? 'bg-gradient-to-r from-rescue-600 via-orange-600 to-amber-600 text-white shadow-xl shadow-orange-500/40 ring-2 ring-orange-400/80 -translate-y-0.5'
                    : 'bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white hover:shadow-orange-500/50 hover:-translate-y-0.5'
                }`}
              >
                <FileText className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                <span>สมัครเข้าร่วมโครงการ</span>
              </button>
            ) : (
              <button
                onClick={() => handleNav('dashboard')}
                className={`px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-2xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 xl:gap-2 shadow-sm active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'dashboard' || currentTab === 'register'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-slate-900 text-emerald-400 border border-emerald-500/40 hover:bg-slate-850 hover:border-emerald-300'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                <span>แดชบอร์ดของฉัน</span>
              </button>
            )}

            {/* Admin Panel Tab if logged in as Admin */}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-2xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400'
                    : 'bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/80'
                }`}
              >
                <Award className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                <span>ระบบ Admin</span>
              </button>
            )}
          </nav>

          {/* Desktop Right Action Area: Auth & Status */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-850/90 border border-slate-700/80 hover:border-slate-600 p-1.5 pl-2 rounded-2xl shadow-xl shadow-black/30 backdrop-blur-md transition-all shrink-0">
                <button
                  type="button"
                  onClick={() => handleNav(myRegistration ? 'dashboard' : 'register')}
                  title="ดูประวัติบัญชี / ผลการจัดสรรกลุ่มและห้องนอน"
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity text-left cursor-pointer shrink-0"
                >
                  <div className="relative shrink-0">
                    <img 
                      src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                      alt={user.name || 'User'} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-orange-500/60 object-cover ring-2 ring-emerald-500/30 shadow-sm shrink-0"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                  </div>
                  <div className="text-left text-xs leading-tight shrink-0">
                    <p className="font-bold text-white truncate max-w-[80px] xl:max-w-[120px] whitespace-nowrap">{user.name || user.email?.split('@')[0]}</p>
                    <p className="text-slate-400 text-[10px] flex items-center gap-1 font-medium mt-0.5 whitespace-nowrap">
                      <span className="text-emerald-400 font-semibold">{myRegistration ? (myRegistration.group_assigned ? `กลุ่ม ${myRegistration.group_assigned}` : 'ลงทะเบียนแล้ว') : 'Google Login'}</span>
                    </p>
                  </div>
                </button>
                <div className="w-[1px] h-6 bg-slate-800 mx-0.5 shrink-0" />
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </button>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-2.5 bg-purple-950/60 border border-purple-800/80 px-2.5 py-1.5 rounded-2xl shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-purple-200 whitespace-nowrap">Admin Mode</span>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบแอดมิน"
                  className="p-1 text-purple-300 hover:text-red-400 hover:bg-purple-900/50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onOpenGoogleLogin}
                  className="group flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-extrabold px-3 xl:px-4 py-2 rounded-2xl text-xs xl:text-sm transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-white/10 active:scale-95 border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>เข้าสู่ระบบ Google</span>
                </button>

                <button
                  onClick={onOpenAdminLogin}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-2xl text-xs flex items-center justify-center transition-all hover:border-slate-700 active:scale-95 shrink-0 cursor-pointer"
                  title="เข้าสู่ระบบผู้ดูแลระบบ (Admin)"
                >
                  <Lock className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {!user && !isAdmin && (
              <button
                onClick={onOpenGoogleLogin}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl mb-2">
              <button
                type="button"
                onClick={() => handleNav(myRegistration ? 'dashboard' : 'register')}
                className="flex items-center gap-3 flex-1 text-left truncate cursor-pointer"
              >
                <img 
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                  alt={user.name || 'User'} 
                  className="w-9 h-9 rounded-full object-cover border border-rescue-500 shrink-0"
                />
                <div className="flex-1 truncate">
                  <p className="font-bold text-white text-sm truncate">{user.name}</p>
                  <p className="text-slate-400 text-xs truncate">
                    {myRegistration ? (myRegistration.group_assigned ? `กลุ่ม: ${myRegistration.group_assigned}` : 'ลงทะเบียนแล้ว') : user.email}
                  </p>
                </div>
              </button>
              <button onClick={onLogout} title="ออกจากระบบ" className="p-2 text-red-400 hover:bg-slate-700 rounded-lg cursor-pointer shrink-0">
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
            <span>หน้าแรก</span>
          </button>

          <button
            onClick={() => handleNav('schedule')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
              currentTab === 'schedule' ? 'bg-rescue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>กำหนดการ 2 วัน 1 คืน</span>
          </button>

          {/* ข่าวประชาสัมพันธ์ / คำสั่งสมาชิก */}
          {!myRegistration ? (
            <button
              onClick={() => handleNav('pr')}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
                currentTab === 'pr' || (currentTab === 'announcements' && currentSubRoute === 'public')
                  ? 'bg-orange-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Megaphone className="w-5 h-5 text-orange-400" />
              <span>ข่าวประชาสัมพันธ์โครงการ (สาธารณะ)</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('orders')}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
                currentTab === 'orders' || (currentTab === 'announcements' && currentSubRoute === 'members')
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bell className="w-5 h-5 text-indigo-400" />
              <span>ประกาศคำสั่งสมาชิก (เฉพาะผู้เข้าร่วม)</span>
            </button>
          )}

          <button
            onClick={() => handleNav('merchandise')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium flex items-center gap-3 ${
              currentTab === 'merchandise' || currentTab === 'shop' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shirt className="w-5 h-5 text-orange-400" />
            <span>สั่งซื้อเสื้อ/กางเกง & บัตรรับของ</span>
          </button>

          {!myRegistration ? (
            <button
              onClick={() => handleNav('register')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${
                currentTab === 'register'
                  ? 'bg-orange-500 text-white' 
                  : 'bg-rescue-600 text-white shadow-lg shadow-rescue-600/30'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>สมัครเข้าร่วมโครงการ JRE 2027</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 ${
                currentTab === 'dashboard' || currentTab === 'register'
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span>แดชบอร์ดผู้สมัครของฉัน</span>
            </button>
          )}

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
