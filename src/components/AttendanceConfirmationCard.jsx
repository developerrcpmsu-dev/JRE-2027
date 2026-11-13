import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  BedDouble,
  UtensilsCrossed,
  Calendar,
  Save,
  Sparkles,
  Loader2,
  Edit3,
  ArrowRight,
  Building,
  Layers,
  Key
} from 'lucide-react';
import {
  getAttendanceConfirmationInfo
} from '../supabase';
import {
  resolveUniversityInfo
} from '../data/defaultData';

export function resolveDormitoryDetails(reg, uniInfo) {
  if (!reg) return null;
  const isMsu = Boolean(uniInfo?.isMsu);
  if (isMsu) {
    return {
      isMsu: true,
      dormName: 'มหาวิทยาลัยมหาสารคาม (มมส)',
      roomNumber: 'ไป-กลับเอง',
      floorText: 'ไม่เข้าพักหอพัก',
      isAssigned: true,
      note: 'นิสิตและบุคลากร มมส เดินทางไป-กลับเอง'
    };
  }

  const rawRoom = String(reg.room_assigned || '').trim();
  const rawDorm = String(reg.dormitory || '').trim();

  // Dormitory Name
  let dormName = rawDorm || 'หอพักกุดรัง มหาวิทยาลัยมหาสารคาม';
  if (rawRoom.includes('หอกุดรัง') || rawRoom.includes('กุดรัง')) {
    dormName = 'หอพักกุดรัง มหาวิทยาลัยมหาสารคาม';
  } else if (rawRoom.includes('หอพัก')) {
    const match = rawRoom.match(/(หอพัก[^\s\d]+|หอ[^\s\d]+)/);
    if (match) dormName = match[1];
  }

  // Room number and floor resolution
  const matchNum = rawRoom.match(/(\d{3,4})/);
  let roomNumber = '';
  let floorText = '';
  let isAssigned = false;

  if (matchNum) {
    const num = matchNum[1];
    roomNumber = `ห้อง ${num}`;
    const floorDigit = num.length === 3 ? num[0] : num.slice(0, 2);
    floorText = `ชั้น ${floorDigit}`;
    isAssigned = true;
  } else if (rawRoom && !['-', 'รอจัดห้อง', 'ยังไม่จัดห้อง', 'รอจัดสรร', ''].includes(rawRoom)) {
    roomNumber = rawRoom.startsWith('ห้อง') ? rawRoom : `ห้อง ${rawRoom}`;
    floorText = 'ตามที่ระบุ';
    isAssigned = true;
  } else {
    roomNumber = 'รอเจ้าหน้าที่แจ้งเลขห้อง (เช็คอินหน้างาน)';
    floorText = 'รอระบบจัดสรร';
    isAssigned = false;
  }

  return {
    isMsu: false,
    dormName,
    roomNumber,
    floorText,
    isAssigned,
    rawRoom,
    note: 'ห้องแอร์ พร้อมเครื่องทำน้ำอุ่น หมอน ผ้าห่ม โต๊ะเขียนงาน และตู้เสื้อผ้า'
  };
}

export default function AttendanceConfirmationCard({
  myRegistration,
  onUpdateRegistration,
  onNavigateDashboard,
  onOpenGoogleLogin,
  onToast
}) {
  const confirmInfo = getAttendanceConfirmationInfo(myRegistration);
  const uniInfo = myRegistration ? resolveUniversityInfo(myRegistration) : null;
  const isMsu = Boolean(uniInfo?.isMsu);
  const dormInfo = resolveDormitoryDetails(myRegistration, uniInfo);

  const [statusChoice, setStatusChoice] = useState(
    confirmInfo.status === 'pending' ? 'confirmed' : confirmInfo.status
  );
  const [dormOptOutChoice, setDormOptOutChoice] = useState(Boolean(myRegistration?.dorm_opt_out));
  const [arrivalDate, setArrivalDate] = useState(
    confirmInfo.arrivalDate || (isMsu ? 'นิสิต/บุคลากร มมส (อยู่ในพื้นที่)' : 'เช้าวันที่ 14 พ.ย. 2569 (ทันลงทะเบียนหน้างาน)')
  );
  const [confirmNote, setConfirmNote] = useState(confirmInfo.note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDormOptOut, setIsSavingDormOptOut] = useState(false);
  const [isExpandedForm, setIsExpandedForm] = useState(!confirmInfo.isConfirmed && !confirmInfo.isDeclined);

  useEffect(() => {
    if (!myRegistration) return;
    const info = getAttendanceConfirmationInfo(myRegistration);
    const uInfo = resolveUniversityInfo(myRegistration);
    const msuFlag = Boolean(uInfo?.isMsu);

    setStatusChoice(info.status === 'pending' ? 'confirmed' : info.status);
    setDormOptOutChoice(Boolean(myRegistration?.dorm_opt_out));
    setArrivalDate(info.arrivalDate || (msuFlag ? 'นิสิต/บุคลากร มมส (อยู่ในพื้นที่)' : 'เช้าวันที่ 14 พ.ย. 2569 (ทันลงทะเบียนหน้างาน)'));
    setConfirmNote(info.note || '');
    setIsExpandedForm(info.isPending);
  }, [
    myRegistration?.id,
    myRegistration?.attendance_confirmed_status,
    myRegistration?.attendance_need_accommodation,
    myRegistration?.attendance_meal_confirmed,
    myRegistration?.dorm_opt_out
  ]);

  if (!myRegistration) {
    return (
      <section className="rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/85 p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                📋 ระบบสำรวจผู้เข้าร่วมจริง JRE 2027
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 text-[10px] font-bold">
                จัดเตรียมอาหาร & ห้องพักพอดีจำนวนคน
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              ✅ เปิดระบบยืนยันการเข้าร่วมกิจกรรมจริง (14 - 15 พ.ย. 2569)
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              ขอให้ผู้สมัครและคณะทำงาน (Staff) ทุกคนเข้าสู่ระบบเพื่อกดยืนยันว่า <strong>&ldquo;เดินทางมาเข้าร่วมแน่นอน&rdquo;</strong> พร้อมระบุความต้องการเข้าพักหอพักและตรวจสอบข้อมูลอาหาร เพื่อให้ฝ่ายสวัสดิการจัดเตรียมอาหารและห้องพักไว้พอดีกับจำนวนผู้มาจริง
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenGoogleLogin || onNavigateDashboard}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer transition-all active:scale-95"
        >
          <span>เข้าสู่ระบบเพื่อยืนยันการเข้าร่วม</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  const handleSaveConfirmation = async (overrideStatus = null) => {
    if (!onUpdateRegistration) return;
    const finalStatus = overrideStatus || statusChoice || 'confirmed';
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const targetId = myRegistration.user_id || myRegistration.id;
      const isOptedOut = !isMsu && Boolean(dormOptOutChoice);
      // มมส ไป-กลับเองอยู่แล้ว (false) / มออื่นๆ จัดหาหอพักให้อยู่แล้ว เว้นแต่แจ้งไม่ประสงค์พัก (dorm_opt_out)
      const finalAccom = finalStatus === 'declined' || isMsu || isOptedOut ? false : true;
      const finalMeals = finalStatus === 'declined' ? false : true;

      const updates = {
        attendance_confirmed_status: finalStatus,
        attendance_confirmed_at: now,
        attendance_confirmed_by: 'self',
        attendance_need_accommodation: finalAccom,
        attendance_meal_confirmed: finalMeals,
        attendance_arrival_date: arrivalDate.trim(),
        attendance_confirm_note: confirmNote.trim(),
        dorm_opt_out: isOptedOut,
        dorm_opt_out_by: isOptedOut ? (myRegistration.dorm_opt_out_by || 'user') : '',
        dorm_opt_out_at: isOptedOut ? (myRegistration.dorm_opt_out_at || now) : ''
      };

      await onUpdateRegistration(targetId, updates);
      setIsExpandedForm(false);

      if (onToast) {
        onToast(
          finalStatus === 'confirmed'
            ? '✅ บันทึกการยืนยันเข้าร่วมกิจกรรมจริงเรียบร้อยแล้ว!'
            : 'บันทึกแจ้งไม่สะดวกเข้าร่วมกิจกรรมเรียบร้อยแล้ว',
          finalStatus === 'confirmed' ? 'success' : 'info'
        );
      }
    } catch (err) {
      if (onToast) {
        onToast('เกิดข้อผิดพลาดในการบันทึกการยืนยัน กรุณาลองใหม่อีกครั้ง', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDormOptOut = async (nextOptOut) => {
    if (!onUpdateRegistration || isSavingDormOptOut) return;
    setIsSavingDormOptOut(true);
    try {
      const now = new Date().toISOString();
      const targetId = myRegistration.user_id || myRegistration.id;
      await onUpdateRegistration(targetId, {
        dorm_opt_out: nextOptOut,
        dorm_opt_out_by: 'user',
        dorm_opt_out_at: now,
        attendance_need_accommodation: !nextOptOut && !isMsu
      });
      setDormOptOutChoice(nextOptOut);
      if (onToast) {
        onToast(
          nextOptOut
            ? 'บันทึกแจ้ง "ไม่ประสงค์เข้าพักหอพักที่มหาลัยจัดเตรียมให้" เรียบร้อยแล้ว'
            : 'เปลี่ยนสถานะกลับมา "ประสงค์เข้าพักหอพักที่โครงการจัดเตรียม" เรียบร้อยแล้ว',
          nextOptOut ? 'info' : 'success'
        );
      }
    } catch (err) {
      if (onToast) {
        onToast('ไม่สามารถอัปเดตสถานะการเข้าพักหอพักได้ กรุณาลองใหม่อีกครั้ง', 'error');
      }
    } finally {
      setIsSavingDormOptOut(false);
    }
  };

  return (
    <section
      className={`rounded-3xl border-2 p-5 sm:p-6 shadow-2xl space-y-4 transition-all ${
        confirmInfo.isConfirmed
          ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/75 border-emerald-500/70 shadow-emerald-950/30'
          : confirmInfo.isDeclined
          ? 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border-rose-500/60'
          : 'bg-gradient-to-br from-amber-950/85 via-slate-900 to-emerald-950/70 border-amber-400/80 ring-2 ring-amber-400/30'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              confirmInfo.isConfirmed
                ? 'bg-emerald-500 text-slate-950'
                : confirmInfo.isDeclined
                ? 'bg-rose-600 text-white'
                : 'bg-amber-400 text-slate-950 animate-bounce'
            }`}
          >
            {confirmInfo.isConfirmed ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : confirmInfo.isDeclined ? (
              <XCircle className="w-7 h-7" />
            ) : (
              <Clock className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {confirmInfo.isConfirmed ? (
                <span className="px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
                  ✅ ยืนยันเข้าร่วมกิจกรรมแน่นอนแล้ว (มาชัวร์ 100%)
                </span>
              ) : confirmInfo.isDeclined ? (
                <span className="px-3 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow">
                  ❌ แจ้งไม่สะดวกเข้าร่วมกิจกรรม
                </span>
              ) : (
                <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider animate-pulse shadow">
                  ⏳ ด่วน! กรุณากดยืนยันการเข้าร่วมกิจกรรมจริง
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700 text-[11px] font-bold">
                🏛️ {uniInfo?.shortTag || myRegistration.institution}
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-black text-white">
              📋 ระบบยืนยันการเข้าร่วมกิจกรรมจริง (เพื่อจัดเตรียมอาหารและห้องพักให้พอดีกับจำนวนคน)
            </h2>
            <p className="text-xs text-slate-200/90 leading-relaxed">
              {confirmInfo.isConfirmed ? (
                <>
                  ระบบได้บันทึกสิทธิ์ของท่านในยอดจัดเตรียมอาหาร ({confirmInfo.needMeals ? 'รับประทานอาหารครบมื้อ' : 'ไม่รับอาหาร'}) และการจัดห้องพัก ({confirmInfo.needAccommodation ? '🏨 เข้าพักหอพักที่โครงการจัดเตรียม' : '🏠 ไม่เข้าพักหอพัก / ไป-กลับเอง'}) เรียบร้อยแล้ว
                  {confirmInfo.confirmedAt && (
                    <span className="text-emerald-300 font-mono ml-1.5">
                      • ยืนยันเมื่อ {new Date(confirmInfo.confirmedAt).toLocaleString('th-TH')}
                    </span>
                  )}
                </>
              ) : (
                <>
                  ขอความร่วมมือผู้สมัครและ Staff ทุกคนกดยืนยันว่า <strong>&ldquo;เดินทางมาเข้าร่วมแน่นอน&rdquo;</strong> พร้อมระบุว่าต้องการเข้าพักหอพักหรือไม่ เพื่อให้ฝ่ายสวัสดิการสั่งทำอาหารและจัดห้องพักหอพักได้ตรงตามจำนวนผู้เดินทางมาจริง
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quick 1-Click Action Buttons when collapsed or pending */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!confirmInfo.isConfirmed && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveConfirmation('confirmed')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>✅ กดยืนยัน &ldquo;มาแน่นอน&rdquo; ทันที</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpandedForm(!isExpandedForm)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isExpandedForm ? 'ซ่อนรายละเอียด' : 'แก้ไขข้อมูล / เปลี่ยนสถานะ'}</span>
          </button>
        </div>
      </div>

      {/* Summary Pills when already confirmed and form collapsed */}
      {!isExpandedForm && (
        <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Detailed Dormitory Accommodation Box for External Universities */}
          {!isMsu && confirmInfo.isConfirmed && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border-2 border-sky-500/50 space-y-2 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-500/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/40">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>🏨 ข้อมูลห้องพักหอพัก มมส ({uniInfo?.shortTag || 'มหาวิทยาลัยเครือข่าย'})</span>
                    </h4>
                    <p className="text-[11px] text-sky-200">
                      {dormInfo.dormName} (โครงการจัดเตรียมรองรับผู้เข้าร่วมจากต่างมหาวิทยาลัย)
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {myRegistration?.dorm_opt_out ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                      🚫 ไม่ประสงค์พักหอพัก มมส
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                      ✓ ยืนยันสิทธิ์ห้องพักเรียบร้อย
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isSavingDormOptOut}
                    onClick={() => handleToggleDormOptOut(!myRegistration?.dorm_opt_out)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                      myRegistration?.dorm_opt_out
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/50'
                    }`}
                  >
                    {isSavingDormOptOut
                      ? 'กำลังบันทึก...'
                      : myRegistration?.dorm_opt_out
                        ? '🛏️ เปลี่ยนกลับมาขอเข้าพักหอพัก'
                        : '🚫 แจ้งไม่ประสงค์พักหอพักที่มหาลัยจัดเตรียมให้'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-sky-400" /> อาคารหอพัก
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white block">
                    {dormInfo.dormName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> ชั้นที่พัก
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 block">
                    {dormInfo.floorText}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-400" /> เลขห้องพัก & สถานะกุญแจ
                  </span>
                  <span className="text-xs sm:text-sm font-black text-sky-300 block">
                    {dormInfo.roomNumber}
                  </span>
                  <span className="text-[10px] font-bold block text-slate-300">
                    {myRegistration?.room_key_returned
                      ? '✅ คืนกุญแจห้องแล้ว'
                      : myRegistration?.room_key_held
                        ? '🔑 ได้รับกุญแจห้องพักแล้ว (อยู่ที่ตัว)'
                        : myRegistration?.dorm_opt_out
                          ? 'ไม่ต้องรับกุญแจ (ไม่พักหอ)'
                          : '⏳ ยังไม่ได้รับกุญแจ (ติดต่อจุดลงทะเบียน)'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                <span className="flex items-center gap-2 text-slate-300">
                  <span>❄️ แอร์</span>
                  <span>•</span>
                  <span>🚿 เครื่องทำน้ำอุ่น</span>
                  <span>•</span>
                  <span>🛏️ เตียง/หมอน/ผ้าห่มพร้อม</span>
                </span>
                <span className="text-amber-300 font-mono text-[10px]">
                  🔑 เช็คอินรับกุญแจห้องพัก ณ จุดลงทะเบียนหน้างาน JRE 2027
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
              <BedDouble className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">การจัดเตรียมที่พัก & อาหาร</span>
                <span className="font-bold text-white">
                  {isMsu
                    ? '🏠 มมส: เดินทางไป-กลับเอง'
                    : myRegistration?.dorm_opt_out
                      ? '🚫 ไม่ประสงค์เข้าพักหอพักที่มหาลัยจัดเตรียมให้'
                      : `🏨 ${dormInfo.dormName} (${dormInfo.roomNumber})`} • {confirmInfo.needMeals ? '🍱 อาหารครบมื้อ' : 'ไม่รับอาหาร'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">ช่วงเวลาเดินทางมาถึง / หมายเหตุ</span>
                <span className="font-bold text-white">
                  {confirmInfo.arrivalDate || 'เช้าวันที่ 14 พ.ย. 2569'}
                  {confirmInfo.note ? ` • ${confirmInfo.note}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Interactive Form */}
      {isExpandedForm && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
          {/* 1. ยืนยันการเดินทางมาเข้าร่วมโครงการ (14 - 15 พ.ย. 2569) * */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-emerald-300">
              1. ยืนยันการเดินทางมาเข้าร่วมโครงการ (14 - 15 พ.ย. 2569) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStatusChoice('confirmed')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  statusChoice === 'confirmed'
                    ? 'bg-emerald-500/25 border-emerald-400 text-white ring-2 ring-emerald-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-black text-sm text-emerald-300">✅ ยืนยันมาแน่นอน</div>
                <div className="text-xs text-slate-300 mt-0.5">เข้าร่วมการฝึกซ้อมจริง 100%</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusChoice('declined')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  statusChoice === 'declined'
                    ? 'bg-rose-500/25 border-rose-400 text-white ring-2 ring-rose-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-black text-sm text-rose-300">❌ ไม่สะดวกเข้าร่วม</div>
                <div className="text-xs text-slate-300 mt-0.5">แจ้งสละสิทธิ์ล่วงหน้า</div>
              </button>
            </div>
          </div>

          {statusChoice !== 'declined' && (
            <div className="space-y-3 pt-1">
              {/* For External Universities: Show Accommodation Preview (หอไหน ชั้นไหน ห้องไหน) */}
              {!isMsu ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border-2 border-sky-500/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-sky-400" />
                      <span>🏨 ข้อมูลที่พักหอพักสำหรับสังกัด {uniInfo?.shortTag || 'มหาวิทยาลัยเครือข่าย'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                      โครงการจัดเตรียมให้
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-sky-400" /> อาคารหอพัก
                      </span>
                      <span className="font-black text-white text-xs mt-0.5 block">{dormInfo.dormName}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-400" /> ชั้นที่พัก
                      </span>
                      <span className="font-black text-amber-300 text-xs mt-0.5 block">{dormInfo.floorText}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-emerald-400" /> เลขห้องพัก
                      </span>
                      <span className="font-black text-sky-300 text-xs mt-0.5 block">{dormInfo.roomNumber}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 flex items-center gap-2 pt-0.5">
                    <span>❄️ ห้องแอร์</span>
                    <span>•</span>
                    <span>🚿 เครื่องทำน้ำอุ่น</span>
                    <span>•</span>
                    <span>🛏️ เตียงและเครื่องนอนพร้อม</span>
                  </p>

                  <div className="pt-2 border-t border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-200">
                      ความประสงค์เข้าพักหอพัก (สำหรับผู้มีสิทธิ์ห้องพัก):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDormOptOutChoice(false)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                          !dormOptOutChoice
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        🛏️ ประสงค์เข้าพักหอพัก
                      </button>
                      <button
                        type="button"
                        onClick={() => setDormOptOutChoice(true)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                          dormOptOutChoice
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                            : 'bg-slate-900 text-amber-200 border-amber-500/40 hover:bg-amber-500/15'
                        }`}
                      >
                        🚫 ไม่ประสงค์พักหอพักที่มหาลัยจัดเตรียมให้
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    🏠 สังกัด มมส: เดินทางไป-กลับเอง
                  </span>
                  <span className="text-slate-400 text-[11px]">(ไม่มีค่าใช้จ่ายและไม่ต้องเข้าพักหอพัก)</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* ช่วงเวลาเดินทางมาถึง มมส */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    ช่วงเวลาเดินทางมาถึง มมส
                  </label>
                  <select
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="เช้าวันที่ 14 พ.ย. 2569 (ทันลงทะเบียนหน้างาน)">
                      เช้าวันที่ 14 พ.ย. 2569 (ทันลงทะเบียนหน้างาน)
                    </option>
                    <option value="เดินทางมาถึงล่วงหน้า คืนวันที่ 13 พ.ย. 2569">
                      เดินทางมาถึงล่วงหน้า คืนวันที่ 13 พ.ย. 2569
                    </option>
                    <option value="เดินทางมาพร้อมขบวนรถของมหาวิทยาลัย">
                      เดินทางมาพร้อมขบวนรถของมหาวิทยาลัย
                    </option>
                    <option value="นิสิต/บุคลากร มมส (อยู่ในพื้นที่)">
                      นิสิต/บุคลากร มมส (อยู่ในพื้นที่)
                    </option>
                  </select>
                </div>

                {/* หมายเหตุเพิ่มเติม (ถ้ามี) */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    หมายเหตุเพิ่มเติม (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={confirmNote}
                    onChange={(e) => setConfirmNote(e.target.value)}
                    placeholder="เช่น ขอพักห้องเดียวกับเพื่อนชื่อ..., ถึงเวลา 07:30 น."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveConfirmation()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>
                {statusChoice === 'confirmed'
                  ? '💾 บันทึกยืนยันการเข้าร่วมกิจกรรม'
                  : 'บันทึกแจ้งไม่สะดวกเข้าร่วมกิจกรรม'}
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
