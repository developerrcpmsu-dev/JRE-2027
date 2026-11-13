import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Building,
  Check,
  CheckCircle,
  Clock,
  Key,
  Lock,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
  Users,
  UtensilsCrossed,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import Toast from '../components/Toast';
import { DataService } from '../supabase';
import {
  isHealthSharedWithRoommate,
  getHealthConsentInfo
} from '../data/defaultData';
import { normalizeDormPerson } from '../utils/roomUtils';
import { formatThaiDateTime } from '../utils/registrationSchedule';

export default function MyRoomView({
  user,
  myRegistration,
  allRegistrations = [],
  onUpdateRegistration,
  onOpenGoogleLogin,
  onNavigateDashboard,
  onNavigateRegister
}) {
  const [consentHealthShare, setConsentHealthShare] = useState(
    isHealthSharedWithRoommate(myRegistration)
  );
  const [isSavingHealthConsent, setIsSavingHealthConsent] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setConsentHealthShare(isHealthSharedWithRoommate(myRegistration));
  }, [
    myRegistration?.id,
    myRegistration?.share_health_with_roommate,
    myRegistration?.health_consent_by
  ]);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const me = useMemo(
    () => (myRegistration ? normalizeDormPerson(myRegistration) : null),
    [myRegistration]
  );

  const roommates = useMemo(() => {
    if (!me || !me.roomNumber) return [];
    const selfKey = myRegistration.id || myRegistration.user_id;
    return (allRegistrations || [])
      .map(normalizeDormPerson)
      .filter(other => {
        const otherKey = other.id || other.user_id;
        if (otherKey && selfKey && otherKey === selfKey) return false;
        if (
          myRegistration.user_id &&
          other.user_id &&
          other.user_id === myRegistration.user_id
        ) {
          return false;
        }
        return other.roomNumber && other.roomNumber === me.roomNumber;
      });
  }, [me, myRegistration, allRegistrations]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            เข้าสู่ระบบเพื่อตรวจสอบห้องพัก & กลุ่มฝึกปฏิบัติการ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ใช้สมัครโครงการ JRE 2027 เพื่อดูข้อมูลห้องนอน กุญแจห้อง เพื่อนร่วมห้อง และกลุ่มฝึกปฏิบัติการของท่าน
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenGoogleLogin && (
              <button
                type="button"
                onClick={onOpenGoogleLogin}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-sm shadow-lg transition-all cursor-pointer"
              >
                เข้าสู่ระบบด้วย Google
              </button>
            )}
            {onNavigateDashboard && (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm border border-slate-700 transition-all cursor-pointer"
              >
                กลับหน้าหลัก
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!myRegistration || !me) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            ยังไม่มีข้อมูลการลงทะเบียนในโครงการ JRE 2027
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            เมื่อท่านส่งใบสมัครเข้าร่วมโครงการเรียบร้อยแล้ว ระบบจะแสดงข้อมูลการจัดสรรกลุ่มฝึก ห้องนอน กุญแจห้อง และเพื่อนร่วมห้องที่หน้านี้ครับ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigateRegister && (
              <button
                type="button"
                onClick={onNavigateRegister}
                className="px-6 py-3 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-black rounded-xl text-sm shadow-lg transition-all cursor-pointer"
              >
                ไปหน้าลงทะเบียนเข้าร่วมโครงการ
              </button>
            )}
            {onNavigateDashboard && (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm border border-slate-700 transition-all cursor-pointer"
              >
                กลับหน้าแดชบอร์ด
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const healthConsentInfo = getHealthConsentInfo(myRegistration);
  const hasSavedConsentChanged =
    consentHealthShare !== isHealthSharedWithRoommate(myRegistration);
  const hasRoom = Boolean(me.roomNumber);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/35 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/35 flex items-center justify-center shrink-0 text-indigo-300">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                สถานะห้องนอน & กลุ่มฝึกของฉัน (JRE 2027)
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-emerald-500/35 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                อัปเดตเรียลไทม์จาก Admin Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {me.name} {me.nickname && me.nickname !== '-' ? `(${me.nickname})` : ''} • {me.uniName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าแดชบอร์ดของฉัน</span>
          </button>
        </div>
      </div>

      {/* Main Group & Room Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card A: Assigned Training Group */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-indigo-500/40 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1.5">
                <span>🎯</span> กลุ่มฝึกปฏิบัติการที่สังกัด (Assigned Group)
              </p>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  myRegistration.group_assigned
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {myRegistration.group_assigned ? 'จัดสรรแล้ว' : 'รอจัดสรร'}
              </span>
            </div>

            {myRegistration.group_assigned ? (
              <div className="p-5 rounded-2xl bg-indigo-950/45 border border-indigo-500/35 space-y-2">
                <p className="text-2xl sm:text-4xl font-black text-indigo-200 tracking-tight">
                  {myRegistration.group_assigned}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>เข้ารายงานตัว ณ จุดรวมพลของกลุ่มตามเวลากำหนดการ</span>
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950/75 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-bold">
                    กำลังรอ Admin จัดสรรกลุ่มฝึกปฏิบัติการ...
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  เมื่อฝ่ายอำนวยการฝึกจัดแบ่งกลุ่มฐานฝึก (Station / Team) เรียบร้อยแล้ว ชื่อกลุ่มและจุดรวมพลจะปรากฏที่นี่โดยอัตโนมัติ
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>📋 ตรวจสอบกำหนดการฐานฝึกได้ที่เมนู &ldquo;กำหนดการ&rdquo;</span>
            {myRegistration.group_assigned && (
              <span className="font-mono text-indigo-300 font-bold">GROUP ACTIVE</span>
            )}
          </div>
        </div>

        {/* Card B: Accommodation & Key Status */}
        <div className="lg:col-span-7 flex flex-col">
          {!hasRoom ? (
            <div className="flex-1 bg-slate-900/95 border border-slate-700/60 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                    <span>🏠</span> ข้อมูลที่พักค้างแรม (Accommodation Status)
                  </p>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                      me.isMsu
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : me.dormOptOut
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    }`}
                  >
                    {me.isMsu
                      ? 'มมส (ไป-กลับเอง)'
                      : me.dormOptOut
                        ? 'ไม่พักหอ (Admin บันทึกให้)'
                        : 'เข้าพักหอพัก (รอระบุเลขห้อง)'}
                  </span>
                </div>

                {me.isMsu ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                    <div className="text-amber-300 font-bold text-sm sm:text-base">
                      🏠 ไม่ได้พักหอพัก (เดินทางไป-กลับเอง)
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                      ท่านสังกัดมหาวิทยาลัยมหาสารคาม (มมส) พักอาศัยในพื้นที่ จึงไม่ได้จัดสรรห้องพักหอพักกุดรัง โดยท่านสามารถเดินทางมาเข้าร่วมการฝึกตามกำหนดการในแต่ละวันได้ตามปกติครับ
                    </p>
                  </div>
                ) : me.dormOptOut ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/35 border border-amber-500/40 space-y-2">
                    <div className="text-amber-300 font-bold text-sm sm:text-base">
                      🚫 สถานะห้องพัก: ไม่พักหอพัก (Admin บันทึกให้)
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed">
                      Admin ฝ่ายสถานที่ได้บันทึกยกเว้นการเข้าพักหอพักของท่านในระบบแล้ว
                      {me.dormOptOutNote ? ` (${me.dormOptOutNote})` : ''} หากมีการเปลี่ยนแปลงกรุณาติดต่อ Admin
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/65 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-sky-300 font-bold text-sm sm:text-base">
                      <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>กำลังรอ Admin ฝ่ายสถานที่จัดสรรเลขห้องพัก...</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      ผู้เข้าร่วมจากต่างมหาวิทยาลัยทุกคนเข้าพัก ณ หอพักกุดรัง มมส (ห้องแอร์ พร้อมเครื่องทำน้ำอุ่น หมอน ผ้าห่ม เตียงเดี่ยวคู่ ห้องละ 2 คน • หากมีเหตุสุดวิสัยโปรดติดต่อ Admin)
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>📍 สถานที่ฝึก: ศูนย์ฝึกอบรมและปฏิบัติการกู้ภัย มมส</span>
                <span className="font-mono text-slate-500">ACCOMMODATION INFO</span>
              </div>
            </div>
          ) : (
            <div
              className={`flex-1 bg-gradient-to-br from-slate-900 via-slate-900 ${
                me.dormOptOut
                  ? 'to-amber-950/35 border-amber-500/50'
                  : 'to-sky-950/40 border-sky-500/40'
              } border p-5 sm:p-6 rounded-3xl shadow-xl space-y-4`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[11px] uppercase font-black text-sky-400 tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (มมส)
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 flex flex-wrap items-center gap-2.5">
                    <span>{me.roomLabel}</span>
                    <span className="text-xs sm:text-sm font-bold text-sky-300 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30">
                      {me.roomFloorLabel} • ห้องละ 2 คน
                    </span>
                  </h2>
                </div>

                <div>
                  {me.dormOptOut ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5">
                      <span>🚫 ไม่พักหอพัก (Admin บันทึกให้)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>เข้าพักหอพัก ✓</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Previous Room Change History Notice if changed by Admin */}
              {me.previousRoom && me.previousRoom !== me.roomNumber && (
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/35 text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30">
                      🔄 ประวัติการย้ายห้อง
                    </span>
                    <span>
                      ห้องเดิม: <strong className="line-through text-slate-400">{me.previousRoom}</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      ห้องปัจจุบัน: <strong className="text-white">{me.roomLabel} ({me.roomFloorLabel})</strong>
                    </span>
                  </div>
                  {me.roomChangedAt && (
                    <span className="text-[11px] text-slate-400">
                      อัปเดตเมื่อ {formatThaiDateTime(me.roomChangedAt)}
                    </span>
                  )}
                </div>
              )}

              {/* Key Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Key className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-bold text-slate-300">สถานะกุญแจห้องพัก:</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[11px] font-black border ${
                      me.roomKeyReturned
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : me.roomKeyHeld
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : me.dormOptOut
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {me.roomKeyReturned
                      ? '✅ คืนกุญแจห้องแล้ว'
                      : me.roomKeyHeld
                        ? '🔑 ได้รับกุญแจห้องแล้ว (อยู่ที่คุณ)'
                        : me.dormOptOut
                          ? 'ไม่ต้องรับกุญแจ (ไม่พักหอ)'
                          : '⏳ ยังไม่ได้รับกุญแจ'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {me.roomKeyNote
                    ? `หมายเหตุ: ${me.roomKeyNote}`
                    : me.dormOptOut
                      ? '* Admin บันทึกไม่พักหอให้แล้ว หากเปลี่ยนแปลงโปรดแจ้ง Admin'
                      : '* ติดต่อรับ-คืนกุญแจห้องพักได้ที่ฝ่ายสถานที่'}
                </span>
              </div>

              {/* Room Facilities */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-sky-300 font-semibold">❄️ ห้องปรับอากาศ (แอร์)</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-semibold">🚿 เครื่องทำน้ำอุ่น</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-300 font-semibold">🛏️ เตียงเดี่ยวคู่ (2 เตียง)</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">หมอนและผ้าห่มพร้อม</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roommate Section (When room assigned) */}
      {hasRoom && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>เพื่อนร่วมห้องของคุณ ({me.roomLabel})</span>
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-300">
              พบผู้พักร่วมห้อง {roommates.length} คน
            </span>
          </div>

          {roommates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {roommates.map((mate, idx) => (
                <div
                  key={mate.id || idx}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-4"
                >
                  {/* Roommate Identity & Key Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-white text-base">
                          {mate.name}
                        </span>
                        {mate.nickname && mate.nickname !== '-' && (
                          <span className="text-amber-300 font-bold text-sm">
                            ({mate.nickname})
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-semibold">
                          {mate.uniShort || mate.uniName}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-sky-300 font-mono">
                          📡 นามเรียกขาน: <strong>{mate.callsign || '-'}</strong>
                        </span>
                        {mate.dormOptOut ? (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/40">
                            🚫 เมทแจ้งไม่ประสงค์พักหอพัก
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                            เข้าพักห้องเดียวกัน ✓
                          </span>
                        )}
                        {mate.roomKeyHeld && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              mate.roomKeyReturned
                                ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
                                : 'text-sky-300 bg-sky-950/40 border-sky-500/30'
                            }`}
                          >
                            {mate.roomKeyReturned
                              ? '✅ เมทคืนกุญแจแล้ว'
                              : '🔑 เมทถือกุญแจอยู่'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {mate.phone && mate.phone !== '-' ? (
                        <a
                          href={`tel:${mate.phone}`}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>โทรหาเมท: {mate.phone}</span>
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                          ไม่มีเบอร์โทรเมทในระบบ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Strict Health Privacy Gate for Roommate */}
                  {!mate.isHealthShared ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>🔒 เมทเลือกไม่ประสงค์เปิดเผยข้อมูลสุขภาพส่วนบุคคล</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        เพื่อนร่วมห้องของท่านขอสงวนสิทธิ์ไม่เปิดเผยรายละเอียดโรคประจำตัวหรืออาการแพ้ในระบบ
                        {mate.emergencyPhone && mate.emergencyPhone !== '-'
                          ? ` หากเพื่อนร่วมห้องมีอาการผิดปกติ สามารถโทรติดต่อผู้ติดต่อฉุกเฉินของเมท (${mate.emergencyPhone}) หรือแจ้ง Staff / ทีมแพทย์สนามได้ทันทีครับ`
                          : ' หากเพื่อนร่วมห้องมีอาการผิดปกติ สามารถแจ้ง Staff หรือทีมแพทย์สนามได้ทันทีครับ'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div
                        className={`p-3 rounded-xl border ${
                          mate.hasAlg
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <UtensilsCrossed
                            className={`w-4 h-4 ${
                              mate.hasAlg ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          />
                          <span>ประวัติแพ้อาหาร / แพ้ยาของเมท:</span>
                        </div>
                        <div className={mate.hasAlg ? 'font-black text-amber-300' : 'text-slate-400'}>
                          {mate.hasAlg ? `⚠️ ${mate.allergy}` : 'ปกติ (ไม่มีประวัติแพ้อาหาร/ยา)'}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          mate.hasMed
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Stethoscope
                            className={`w-4 h-4 ${
                              mate.hasMed ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          />
                          <span>โรคประจำตัว / ข้อจำกัดของเมท:</span>
                        </div>
                        <div className={mate.hasMed ? 'font-black text-rose-300' : 'text-slate-400'}>
                          {mate.hasMed ? `🩺 ${mate.medical}` : 'ปกติ (ไม่มีโรคประจำตัว)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blood Group & Emergency Contact */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">🩸 กรุ๊ปเลือดเมท:</span>
                      <strong className="text-rose-300 font-mono text-sm">
                        {mate.bloodGroup || '-'}
                      </strong>
                    </div>

                    {mate.emergencyName !== '-' && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-400">🚨 ผู้ติดต่อฉุกเฉินของเมท:</span>
                        <span className="text-white font-bold">{mate.emergencyName}</span>
                        {mate.emergencyPhone && mate.emergencyPhone !== '-' && (
                          <a
                            href={`tel:${mate.emergencyPhone}`}
                            className="text-sky-300 underline font-mono"
                          >
                            ({mate.emergencyPhone})
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-xs sm:text-sm text-slate-400 italic">
              เตียงเดี่ยวคู่ (ยังไม่พบรายชื่อเพื่อนร่วมห้องในระบบ หรือ Admin กำลังจัดสรรผู้พักร่วมห้อง)
            </div>
          )}
        </div>
      )}

      {/* Roommate Health Privacy Control Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/95 border border-indigo-500/35 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                🛡️ สิทธิ์ความเป็นส่วนตัวข้อมูลสุขภาพ (Roommate Health Privacy)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                ควบคุมการแสดงข้อมูลโรคประจำตัวและประวัติการแพ้ของท่านให้เพื่อนร่วมห้องทราบ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black border ${
                consentHealthShare
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {consentHealthShare
                ? '👁️ ยินยอมเปิดเผยให้เมททราบ'
                : '🔒 ปิดเป็นความลับ (ซ่อนจากเมท)'}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-slate-300 border border-slate-700">
              {healthConsentInfo.fullLabel}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
          <p className="font-semibold text-sky-200">
            (ข้อมูลด้านสุขภาพเบื้องต้น เช่น อาการแพ้ต่างๆ โรคประจำตัว)
          </p>
          <p>
            ทางเราขออนุญาตให้เมทของท่านทราบในกรณีที่ท่านมีอาการอะไร เมทของท่านจะได้ช่วยเหลือท่านได้อย่างถูกต้องเพื่อความปลอดภัยของตัวท่าน ทางเราไม่ได้มีเจตนาที่จะเปิดเผยประวัติสุขภาพของท่านไปในทางที่ไม่ดีหรือสู่สาธารณะแต่อย่างใด หากท่านไม่ยินยอม สามารถตั้งค่าปิดได้ตลอดเวลา หรือแจ้ง Staff ทุกคนให้ปิดข้อมูลของท่านได้ทุกเมื่อครับ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConsentHealthShare(true)}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
              consentHealthShare
                ? 'bg-emerald-500/15 border-emerald-500 text-white ring-2 ring-emerald-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                consentHealthShare
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                  : 'border-slate-600 bg-slate-800'
              }`}
            >
              {consentHealthShare && <Check className="w-3.5 h-3.5 font-black stroke-[3]" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold block text-emerald-300">
                ✅ ยินยอม / ตกลงเปิดเผยข้อมูลสุขภาพ
              </span>
              <span className="text-[11px] text-slate-300 block leading-snug">
                ยินยอมให้เพื่อนร่วมห้องและทีมงานทราบข้อมูลโรคประจำตัว/การแพ้ เพื่อความปลอดภัยและการปฐมพยาบาล
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConsentHealthShare(false)}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
              !consentHealthShare
                ? 'bg-amber-500/15 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                !consentHealthShare
                  ? 'bg-amber-500 border-amber-400 text-slate-950'
                  : 'border-slate-600 bg-slate-800'
              }`}
            >
              {!consentHealthShare && <Check className="w-3.5 h-3.5 font-black stroke-[3]" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold block text-amber-300">
                ❌ ปฏิเสธ / ไม่ยินยอมเปิดเผยข้อมูลสุขภาพ
              </span>
              <span className="text-[11px] text-slate-300 block leading-snug">
                ปิดเป็นความลับ ซ่อนจากเพื่อนร่วมห้อง • แสดงเฉพาะฝ่ายพยาบาลสนามเมื่อจำเป็นเท่านั้น
              </span>
            </div>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">
            {hasSavedConsentChanged
              ? '⚡ มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก: กรุณากดปุ่มบันทึกด้านขวา'
              : '✓ บันทึกการตั้งค่าเป็นปัจจุบันแล้ว'}
          </span>

          <button
            type="button"
            disabled={isSavingHealthConsent || !hasSavedConsentChanged}
            onClick={async () => {
              setIsSavingHealthConsent(true);
              try {
                const targetId = myRegistration.id || myRegistration.user_id;
                const healthPayload = {
                  share_health_with_roommate: consentHealthShare,
                  health_consent_by: 'user',
                  health_consent_at: new Date().toISOString()
                };
                if (onUpdateRegistration) {
                  await onUpdateRegistration(targetId, healthPayload);
                } else {
                  await DataService.updateRegistrationDetails(targetId, healthPayload);
                }
                triggerToast(
                  consentHealthShare
                    ? '✓ บันทึกสำเร็จ: ยินยอมเปิดเผยข้อมูลสุขภาพให้เพื่อนร่วมห้องทราบเพื่อความปลอดภัยแล้ว'
                    : '✓ บันทึกสำเร็จ: ตั้งค่าไม่เปิดเผยข้อมูลสุขภาพให้เมททราบเรียบร้อย (เฉพาะทีมแพทย์สนามและ Staff ที่มองเห็นได้)',
                  'success'
                );
              } catch (err) {
                console.error(err);
                triggerToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่าความเป็นส่วนตัว', 'error');
              } finally {
                setIsSavingHealthConsent(false);
              }
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer ${
              hasSavedConsentChanged
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSavingHealthConsent ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>

      {me.dormOptOut && (
        <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            หมายเหตุ: ผู้เข้าร่วมทุกคนจากต่างมหาวิทยาลัยได้รับการจัดสรรหอพักโดยโครงการ ยกเว้นกรณีที่ Admin บันทึกสถานะไม่พักหอให้แล้วเท่านั้น หากต้องการปรับแก้สถานะการพักหอหรือแจ้งย้ายห้อง กรุณาติดต่อ Admin ฝ่ายสถานที่ครับ
          </span>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
