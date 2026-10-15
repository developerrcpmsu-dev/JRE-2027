import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft, 
  QrCode, 
  Lock, 
  Key, 
  Award, 
  Shirt, 
  Home, 
  Sparkles, 
  Building, 
  Phone, 
  Mail, 
  Calendar, 
  Droplet, 
  HeartPulse, 
  Clock, 
  AlertCircle,
  Shield,
  CreditCard,
  UserCheck,
  PackageCheck,
  Eye,
  GraduationCap,
  X
} from 'lucide-react';
import { DataService, subscribeToRealtimeChanges } from '../supabase';
import { resolveUserExtraDetails } from '../utils/userUtils';

export default function UserProfileView({
  userUid,
  currentUser,
  isAdmin,
  registrations = [],
  merchandiseOrders = [],
  userAccounts = [],
  onOpenAdminLogin,
  onNavigateHome,
  onNavigateAdmin,
  onNavigateRegister
}) {
  const [userAccount, setUserAccount] = useState(null);
  const [userReg, setUserReg] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    async function fetchAccount(silent = false) {
      if (!silent) setLoading(true);
      try {
        const targetId = (userUid || '').trim();
        const isEmailTarget = targetId.includes('@');

        let accounts = [];
        if (isAdmin) {
          // Admin has full access to inspect any user
          accounts = await DataService.getUserAccounts({ admin: true });
        } else if (targetId) {
          // Query specific account by ID or email
          accounts = await DataService.getUserAccounts({
            userId: !isEmailTarget ? targetId : null,
            email: isEmailTarget ? targetId : null
          });
          // Fallback if not found with scoped query
          if (!accounts || accounts.length === 0) {
            accounts = await DataService.getUserAccounts();
          }
        } else if (currentUser) {
          accounts = await DataService.getUserAccounts({ userId: currentUser.id, email: currentUser.email });
        } else {
          accounts = await DataService.getUserAccounts();
        }

        let found = null;
        if (targetId) {
          found = (accounts || []).find(a => 
            (a.id && a.id.toLowerCase() === targetId.toLowerCase()) ||
            (a.email && a.email.toLowerCase() === targetId.toLowerCase())
          );
          // If still not found, check if targetId matches student_id or phone
          if (!found) {
            found = (accounts || []).find(a => 
              (a.student_id && a.student_id === targetId) ||
              (a.phone && a.phone.replace(/\D/g, '') === targetId.replace(/\D/g, ''))
            );
          }
          // If still not found, check if targetId matches any registration user_id or id
          if (!found) {
            const matchedReg = (registrations || []).find(r => 
              (r.user_id && r.user_id.toLowerCase() === targetId.toLowerCase()) ||
              (r.id && r.id.toLowerCase() === targetId.toLowerCase())
            );
            if (matchedReg) {
              const matchedEmail = (matchedReg.user_email || '').toLowerCase().trim();
              found = (accounts || []).find(a => a.email && a.email.toLowerCase().trim() === matchedEmail);
            }
          }
        } else if (currentUser) {
          found = (accounts || []).find(a => 
            (a.id && a.id === currentUser.id) ||
            (a.email && a.email.toLowerCase() === (currentUser.email || '').toLowerCase())
          );
        }

        setUserAccount(found || null);

        // Fetch registration for this specific user directly from Supabase
        const targetEmail = found?.email?.toLowerCase().trim() || (isEmailTarget ? targetId.toLowerCase() : null);
        const resolvedUserId = found?.id || (!isEmailTarget ? targetId : null);
        
        let directReg = null;
        // Check registrations prop first
        if (registrations && registrations.length > 0) {
          directReg = registrations.find(r => 
            (resolvedUserId && (r.user_id === resolvedUserId || r.id === resolvedUserId)) ||
            (targetEmail && r.user_email && r.user_email.toLowerCase().trim() === targetEmail)
          );
        }
        // If not found in prop, query Supabase directly
        if (!directReg && (resolvedUserId || targetEmail)) {
          try {
            directReg = await DataService.getRegistrationByUserId(resolvedUserId, targetEmail);
          } catch (e) {
            console.warn('Failed to load direct registration:', e);
          }
        }
        setUserReg(directReg || null);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    }

    fetchAccount();

    const unsubscribe = subscribeToRealtimeChanges((payload) => {
      if (payload?.type === 'user_accounts' || payload?.type === 'registrations' || payload?.type === 'all') {
        fetchAccount(true);
      }
    });

    return () => unsubscribe();
  }, [userUid, currentUser?.id, currentUser?.email, isAdmin]);

  const targetEmail = userAccount?.email?.toLowerCase().trim();
  const regInfo = userReg || registrations.find(r => 
    (userAccount?.id && (r.user_id === userAccount.id || r.id === userAccount.id)) ||
    (targetEmail && r.user_email?.toLowerCase().trim() === targetEmail)
  );
  const extraDetails = resolveUserExtraDetails(userAccount, regInfo ? [regInfo] : registrations);

  const merchInfo = merchandiseOrders.find(o => 
    (targetEmail && o.user_email?.toLowerCase().trim() === targetEmail) ||
    (userAccount?.id && (o.id === userAccount.id || o.user_id === userAccount.id))
  );

  const profileUrl = typeof window !== 'undefined' && userAccount
    ? `${window.location.origin}/users/${userAccount.id}`
    : '';

  const handleCopyUrl = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    setCopiedUrl(true);
    showToast(`คัดลอก URL โปรไฟล์สำเร็จ: ${profileUrl}`);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyUid = () => {
    if (!userAccount?.id) return;
    navigator.clipboard.writeText(userAccount.id);
    setCopiedUid(true);
    showToast(`คัดลอก UID สำเร็จ: ${userAccount.id}`);
    setTimeout(() => setCopiedUid(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลโปรไฟล์ผู้ใช้งาน...</p>
        </div>
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/30 rounded-3xl mx-auto flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">ไม่พบบัญชีผู้ใช้งานในระบบ</h2>
          <p className="text-slate-400 text-sm">
            ไม่พบข้อมูลสำหรับรหัสผู้ใช้ <span className="font-mono text-purple-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{userUid || 'N/A'}</span> ในฐานข้อมูลโครงการ JRE 2027
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าแรก</span>
          </button>
          {isAdmin && (
            <button
              onClick={onNavigateAdmin}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>แดชบอร์ดจัดการผู้ใช้ (Admin)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-2xl shadow-2xl shadow-purple-900/30 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & URL Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button 
            onClick={onNavigateHome} 
            className="hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
          >
            <Home className="w-3.5 h-3.5" />
            <span>หน้าแรก</span>
          </button>
          <span>/</span>
          {isAdmin && (
            <>
              <button 
                onClick={onNavigateAdmin} 
                className="hover:text-purple-400 transition-colors cursor-pointer font-semibold"
              >
                จัดการบัญชีผู้ใช้
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-white font-bold truncate max-w-[200px]">{userAccount.name || userAccount.email}</span>
        </div>

        {/* Canonical User Profile Link with Copy Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-purple-300">
            <span className="text-slate-500">URL:</span>
            <span className="truncate max-w-[200px] sm:max-w-[260px]">{profileUrl}</span>
          </div>
          <button
            onClick={handleCopyUrl}
            className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="คัดลอก URL หน้าโปรไฟล์นี้"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Action Banner (Shown when Admin views profile) */}
      {isAdmin && (
        <div className="p-4 bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/40 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-xl shadow-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-lg">
              👑
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>โหมดผู้ดูแลระบบ (Admin Inspection Mode)</span>
                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded text-[10px] font-bold">Verified Admin</span>
              </div>
              <p className="text-[11px] text-purple-300/80 mt-0.5">
                กำลังดูข้อมูลผู้ใช้แบบเจาะจงรายบุคคล สามารถเปิดหน้า Admin Console เพื่อแก้ไขหรือจัดการได้ทันที
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateAdmin}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>เปิดแดชบอร์ด Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={userAccount.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userAccount.email || 'user')}`}
              alt={userAccount.name || 'User Avatar'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-purple-500/40 shadow-2xl shadow-purple-600/20"
            />
            {userAccount.role === 'admin' && (
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg border border-rose-400">
                ADMIN
              </span>
            )}
          </div>

          {/* User Meta */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{userAccount.name || 'ไม่ระบุชื่อ'}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  userAccount.role === 'admin' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                }`}>
                  {userAccount.role || 'applicant'}
                </span>
              </div>
              <p className="font-mono text-sm text-slate-400 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{userAccount.email}</span>
              </p>
            </div>

            {/* Unique UID pill with 1-click copy */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300">
                <span className="text-slate-500 font-bold">UID:</span>
                <span className="font-bold text-white selection:bg-purple-600">{userAccount.id}</span>
                <button
                  onClick={handleCopyUid}
                  className="text-slate-500 hover:text-purple-400 transition-colors p-0.5 cursor-pointer"
                  title="คัดลอก UID"
                >
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Status Badge */}
              {userAccount.provider === 'both' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ ยืนยันแล้ว (Google + รหัสผ่าน)</span>
                </span>
              ) : (userAccount.provider === 'google' || userAccount.id?.startsWith('google_') || (userAccount.email && userAccount.email.toLowerCase().endsWith('@gmail.com'))) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ ยืนยันด้วยการเข้าสู่ระบบด้วย Google</span>
                </span>
              ) : (userAccount.email_verified || userAccount.verified) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ ลงทะเบียนด้วยรหัสผ่านแล้ว</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>รอยืนยันบัญชี</span>
                </span>
              )}
            </div>

            {/* Auth Provider Tag */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-slate-400 pt-1">
              <span className="text-slate-500 font-semibold">ช่องทางยืนยันตัวตน:</span>
              {userAccount.provider === 'both' ? (
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold">
                  🌐 Google OAuth + 🔑 รหัสผ่าน
                </span>
              ) : userAccount.provider === 'email' ? (
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold">
                  🔑 Email & Password (credential metadata redacted)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-bold">
                  🌐 Google OAuth (Token Authentication)
                </span>
              )}

              {userAccount.created_at && (
                <span className="text-slate-500 text-[11px]">
                  • สมัครเมื่อ {new Date(userAccount.created_at).toLocaleDateString('th-TH')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trainee Card / Registration Badge */}
      {regInfo ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">บัตรประจำตัวผู้เข้าร่วมโครงการ (JRE 2027 Trainee Badge)</h3>
                <p className="text-xs text-orange-400 font-semibold">ข้อมูลการสมัคร & สังกัดภาคีเครือข่ายกู้ภัย</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ลงทะเบียนโครงการแล้ว</span>
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-full text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="เปิดดูและจัดการในระบบ Admin"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>จัดการใน Admin</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">ชื่อ-นามสกุล / ชื่อเล่น</span>
              <span className="font-bold text-white text-sm block">
                {regInfo.first_name || ''} {regInfo.last_name || ''}
                {regInfo.nickname && <span className="text-amber-300 ml-1.5">({regInfo.nickname})</span>}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">นามเรียกขาน (Callsign)</span>
              <span className="font-bold text-sky-400 text-sm font-mono flex items-center gap-1">
                <span>📡 {regInfo.callsign || regInfo.call_sign || extraDetails.callsign || 'N/A'}</span>
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">สังกัดสถาบัน / ชมรมกู้ภัย</span>
              <span className="font-bold text-white text-sm truncate block" title={regInfo.institution || extraDetails.affiliation || '-'}>
                {regInfo.institution || extraDetails.affiliation || 'ชมรมกู้ภัยราชพฤกษ์ มมส'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">เบอร์โทรศัพท์ติดต่อ</span>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-emerald-400">
                <span>{extraDetails.formattedPhone || regInfo.phone || '-'}</span>
                {(regInfo.phone || extraDetails.phone) && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(regInfo.phone || extraDetails.phone);
                      showToast('คัดลอกเบอร์โทรศัพท์สำเร็จ');
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="คัดลอกเบอร์โทร"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">กลุ่มฝึกปฏิบัติการ (Assigned Group)</span>
              <span className="font-bold text-purple-300 text-sm">{regInfo.group_assigned || 'รอประกาศกลุ่ม'}</span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">ห้องพักหอพักกุดรัง มมส</span>
              <span className="font-bold text-sky-300 text-sm">{regInfo.room_assigned || 'รอจัดห้องพัก'}</span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">ไซส์เสื้อฝึกโครงการ JRE 2027</span>
              <span className="font-bold text-amber-300 text-sm font-mono">
                {regInfo.shirt_size ? `👕 ไซส์ ${regInfo.shirt_size}` : 'ไม่ระบุ'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">กรุ๊ปเลือด / ข้อมูลสุขภาพ</span>
              <span className="font-bold text-rose-300 text-sm">
                🩸 กรุ๊ป {regInfo.blood_group || '-'} {regInfo.medical_history && regInfo.medical_history !== 'ไม่มี' ? `• ${regInfo.medical_history}` : ''}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block mb-1">ผู้ติดต่อฉุกเฉิน</span>
              <span className="font-bold text-white text-xs truncate block" title={`${regInfo.emergency_name || '-'} (${regInfo.emergency_phone || '-'})`}>
                {regInfo.emergency_name ? `${regInfo.emergency_name} (${regInfo.emergency_phone})` : '-'}
              </span>
            </div>
          </div>

          {/* Payment Plan & Installments Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">
                  แผนการชำระเงิน: {regInfo.payment_plan === 'installment' ? '📦 ขอแบ่งจ่าย 2 งวด' : '💳 ชำระเต็มจำนวน (1 รอบ)'}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                (regInfo.payment_plan === 'installment' && regInfo.installment_1_status === 'paid' && regInfo.installment_2_status === 'paid') || regInfo.payment_status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : (regInfo.payment_plan === 'installment' && regInfo.installment_1_status === 'paid')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {(regInfo.payment_plan === 'installment' && regInfo.installment_1_status === 'paid' && regInfo.installment_2_status === 'paid') || regInfo.payment_status === 'paid'
                  ? '✓ ชำระครบถ้วน 100%'
                  : (regInfo.payment_plan === 'installment' && regInfo.installment_1_status === 'paid')
                  ? 'ชำระงวด 1 แล้ว (ค้างงวด 2)'
                  : 'ค้างชำระ'}
              </span>
            </div>

            {regInfo.payment_plan === 'installment' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Round 1 */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-300">งวดที่ 1 (รอบแรก)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      regInfo.installment_1_status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {regInfo.installment_1_status === 'paid' ? '✓ ชำระแล้ว' : 'รอชำระ'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    ยอดเงิน: {regInfo.installment_1_amount || 400} บาท
                  </div>
                  {regInfo.installment_1_slip_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(regInfo.installment_1_slip_url)}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูรูปสลิปงวดที่ 1</span>
                    </button>
                  )}
                </div>

                {/* Round 2 */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-300">งวดที่ 2 (รอบปิดยอด)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      regInfo.installment_2_status === 'paid' && regInfo.installment_2_slip_url
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {regInfo.installment_2_status === 'paid' && regInfo.installment_2_slip_url ? '✓ ชำระแล้ว' : 'ยังไม่ส่งสลิป (ค้างชำระ)'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    ยอดเงิน: {regInfo.installment_2_amount || 250} บาท
                  </div>
                  {regInfo.installment_2_slip_url ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(regInfo.installment_2_slip_url)}
                      className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูรูปสลิปงวดที่ 2</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">กำหนดชำระช่วงวันที่ 1-5 พฤศจิกายน 2569</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">ยอดชำระเต็มจำนวน</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {regInfo.payment_amount !== undefined ? regInfo.payment_amount : 650} บาท
                  </div>
                </div>
                {regInfo.payment_slip_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(regInfo.payment_slip_url)}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูรูปสลิปโอนเงิน</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">ยังไม่มีข้อมูลการสมัครเข้าร่วมโครงการ</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              บัญชีนี้ได้รับการยืนยันตัวตนในระบบแล้ว แต่ยังไม่ได้กรอกใบสมัครเข้าร่วมโครงการฝึกอบรม JRE 2027
            </p>
          </div>
          {onNavigateRegister && (
            <button
              onClick={onNavigateRegister}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20"
            >
              👉 กรอกใบสมัครเข้าร่วมโครงการ JRE 2027
            </button>
          )}
        </div>
      )}

      {/* Slip Image Full-Screen Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>ภาพหลักฐานการชำระเงิน / สลิปโอนเงิน</span>
            </h4>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-black flex items-center justify-center p-2 border border-slate-800">
              <img src={previewImage} alt="Slip Preview" className="max-h-[70vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Security Details (OWASP / Professor Inspection) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">สถานะการปกป้องข้อมูลบัญชี</h3>
            <p className="text-xs text-emerald-400 font-semibold">ไม่แสดง credential material ในหน้าโปรไฟล์</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">รหัสผู้ใช้งานเฉพาะ (Unique System UID):</span>
            <div className="font-mono text-white font-bold bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>{userAccount.id}</span>
              <button
                onClick={handleCopyUid}
                className="text-slate-400 hover:text-purple-300 text-xs flex items-center gap-1 cursor-pointer font-sans"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUid ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/25 border border-emerald-500/30 rounded-xl">
            <p className="text-emerald-200 font-bold">Credential metadata ถูกจำกัดการแสดงผล</p>
            <p className="text-slate-400 mt-1 leading-relaxed">หน้าโปรไฟล์ไม่ render และไม่เปิดให้คัดลอก password hash, salt หรือ secret token ของบัญชี ข้อมูลความปลอดภัยถูกควบคุมตามมาตรฐาน</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้าแรก</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
          >
            {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>คัดลอกลิงก์โปรไฟล์ (Share URL)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
