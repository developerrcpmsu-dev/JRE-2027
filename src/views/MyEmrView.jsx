import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  HeartPulse,
  Loader2,
  Search,
  Stethoscope,
  UserPlus,
  X
} from 'lucide-react';
import Toast from '../components/Toast';
import { DataService } from '../supabase';
import {
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing
} from '../data/defaultData';
import { matchEmrLogToPerson } from '../utils/emrUtils';
import { buildUserPageUrl } from '../utils/router';

export default function MyEmrView({
  user,
  myRegistration,
  isAdmin = false,
  isDevOperator = false,
  onOpenGoogleLogin,
  onNavigateDashboard,
  onNavigateRegister,
  onNavigateMedicalSupport,
  onNavigateAdminMedical
}) {
  const [medDispenseLogs, setMedDispenseLogs] = useState([]);
  const [isLoadingMedLogs, setIsLoadingMedLogs] = useState(false);
  const [emrSearchQuery, setEmrSearchQuery] = useState('');
  const [emrFilterType, setEmrFilterType] = useState('all'); // 'all' | 'with_meds' | 'with_notes'
  const [emrPage, setEmrPage] = useState(1);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    setEmrPage(1);
  }, [emrSearchQuery, emrFilterType, medDispenseLogs.length]);

  useEffect(() => {
    if (!myRegistration) return;
    let isCancelled = false;
    const fetchLogs = async () => {
      setIsLoadingMedLogs(true);
      try {
        const logs = await DataService.getMedicalDispenseLogs();
        if (!isCancelled) {
          const myCallsign = myRegistration.callsign;
          const myName = myRegistration.first_name;
          const filtered = (logs || []).filter((l) =>
            matchEmrLogToPerson(l, myRegistration) ||
            (myName && l.recipient_name && l.recipient_name.includes(myName)) ||
            (myCallsign && l.recipient_callsign && l.recipient_callsign === myCallsign)
          );
          setMedDispenseLogs(filtered);
        }
      } catch (err) {
        console.error('Error fetching medical dispense logs:', err);
      } finally {
        if (!isCancelled) setIsLoadingMedLogs(false);
      }
    };
    fetchLogs();
    return () => {
      isCancelled = true;
    };
  }, [myRegistration]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            เข้าสู่ระบบเพื่อดูประวัติการรับยาและเวชระเบียนสนาม (EMR)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            ข้อมูลการรักษาและการจ่ายยาถือเป็นข้อมูลส่วนบุคคลด้านสุขภาพ กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ใช้สมัครโครงการ JRE 2027
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenGoogleLogin && (
              <button
                type="button"
                onClick={onOpenGoogleLogin}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-sm shadow-lg transition-all cursor-pointer"
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

  if (!myRegistration) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            ยังไม่มีข้อมูลใบสมัครในบัญชีนี้
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            กรุณาลงทะเบียนเข้าร่วมโครงการ JRE 2027 เพื่อใช้งานระบบประวัติรับยาและเวชระเบียนสนาม
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigateRegister && (
              <button
                type="button"
                onClick={onNavigateRegister}
                className="px-6 py-3 bg-rescue-600 hover:bg-rescue-500 text-white font-black rounded-xl text-sm shadow-lg transition-all cursor-pointer"
              >
                ไปหน้าลงทะเบียน
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const nameData = resolvePersonFullNameWithTitle(myRegistration);
  const callsign = normalizeCallsignSpacing(myRegistration.callsign || '');
  const uid = myRegistration.user_id || myRegistration.id || user.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const directUrl = buildUserPageUrl(uid, 'my-emr', origin);

  const EMR_PAGE_SIZE = 6;
  const q = emrSearchQuery.trim().toLowerCase();
  const filteredLogs = (medDispenseLogs || []).filter((log) => {
    const medsText = String(log.medicines_dispensed || log.medications_dispensed || '').trim();
    const notesText = String(log.medical_notes || '').trim();
    if (emrFilterType === 'with_meds' && (!medsText || medsText === '-')) return false;
    if (emrFilterType === 'with_notes' && !notesText) return false;
    if (!q) return true;
    return [
      log.symptoms,
      log.chief_complaint,
      medsText,
      log.dosage_instruction,
      log.instructions,
      log.dispenser_name,
      log.dispenser_callsign,
      notesText
    ].some((val) => String(val || '').toLowerCase().includes(q));
  });

  const totalFiltered = filteredLogs.length;
  const totalPages = totalFiltered === 0 ? 0 : Math.ceil(totalFiltered / EMR_PAGE_SIZE);
  const currentPage = totalPages === 0 ? 0 : Math.min(Math.max(1, emrPage), totalPages);
  const startIdx = totalPages === 0 ? 0 : (currentPage - 1) * EMR_PAGE_SIZE;
  const pagedLogs = totalPages === 0 ? [] : filteredLogs.slice(startIdx, startIdx + EMR_PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับแดชบอร์ด</span>
            </button>
          )}
          {onNavigateMedicalSupport && (
            <button
              type="button"
              onClick={onNavigateMedicalSupport}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-xs font-bold text-emerald-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>คำขอเตรียมยาภาคสนาม</span>
            </button>
          )}
          {(isAdmin || isDevOperator) && onNavigateAdminMedical && (
            <button
              type="button"
              onClick={() => onNavigateAdminMedical(uid)}
              className="px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-xs font-bold text-purple-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>บันทึก/จ่ายยาให้คนนี้ (Staff/Admin)</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(directUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
            triggerToast(`คัดลอกลิงก์เวชระเบียนส่วนตัวแล้ว:\n${directUrl}`, 'success');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-rose-300 inline-flex items-center gap-1.5 cursor-pointer"
          title={directUrl}
        >
          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedUrl ? 'คัดลอก URL แล้ว' : 'คัดลอก URL หน้านี้'}</span>
        </button>
      </div>

      {/* Main EMR Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-slate-950/95 border border-rose-500/35 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
                <span>📋 ประวัติการรับยาและเวชระเบียนสนามของคุณ (Field EMR Records)</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {nameData.fullName}
                {myRegistration.nickname && myRegistration.nickname !== '-' ? ` (${myRegistration.nickname})` : ''}
                {callsign && callsign !== '-' ? ` • ${callsign}` : ''} — บันทึกอาการ การจ่ายยา และคำแนะนำจากทีมแพทย์/พยาบาลสนามแบบเรียลไทม์
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-slate-900 text-slate-200 border border-slate-700 shrink-0 self-start sm:self-center">
            {totalFiltered === medDispenseLogs.length
              ? `ทั้งหมด ${medDispenseLogs.length} รายการ`
              : `พบ ${totalFiltered} / ${medDispenseLogs.length} รายการ`}
          </span>
        </div>

        {/* Search + Filter + < 0 > Pagination Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/75 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={emrSearchQuery}
                onChange={(e) => setEmrSearchQuery(e.target.value)}
                placeholder="ค้นหาอาการ, ยาที่ได้รับ, ผู้จ่ายยา, หมายเหตุ..."
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
              {emrSearchQuery && (
                <button
                  type="button"
                  onClick={() => setEmrSearchQuery('')}
                  aria-label="ล้างคำค้นหาเวชระเบียน"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">กรอง:</span>
              </span>
              <select
                value={emrFilterType}
                onChange={(e) => setEmrFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-rose-400 cursor-pointer"
              >
                <option value="all">ทั้งหมด ({medDispenseLogs.length})</option>
                <option value="with_meds">เฉพาะที่มีรายการเบิกจ่ายยา</option>
                <option value="with_notes">เฉพาะที่มีหมายเหตุ/เฝ้าระวัง</option>
              </select>
              {(emrSearchQuery || emrFilterType !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setEmrSearchQuery('');
                    setEmrFilterType('all');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono">หน้า:</span>
            <div className="inline-flex items-center rounded-xl bg-slate-950 border border-slate-700 p-0.5 shadow-inner">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setEmrPage((p) => Math.max(1, p - 1))}
                aria-label="หน้าเวชระเบียนก่อนหน้า"
                className="w-8 h-7 rounded-lg flex items-center justify-center text-slate-200 hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-mono font-black text-white min-w-[48px] text-center select-none">
                {totalPages === 0 ? '0' : `${currentPage} / ${totalPages}`}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setEmrPage((p) => Math.min(totalPages, p + 1))}
                aria-label="หน้าเวชระเบียนถัดไป"
                className="w-8 h-7 rounded-lg flex items-center justify-center text-slate-200 hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* EMR List Content */}
        {isLoadingMedLogs ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            <span>กำลังโหลดข้อมูลเวชระเบียน...</span>
          </div>
        ) : medDispenseLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-300 text-sm">ยังไม่มีประวัติการเบิกรับยา ณ จุดปฐมพยาบาลสนาม JRE 2027</p>
            <p className="text-xs text-slate-500">หากท่านมารับยาหรือตรวจอาการ ระบบจะบันทึกและแสดงที่นี่แบบเรียลไทม์</p>
          </div>
        ) : pagedLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 space-y-2.5">
            <p className="font-semibold text-slate-300">ไม่พบประวัติเวชระเบียนที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก</p>
            <button
              type="button"
              onClick={() => {
                setEmrSearchQuery('');
                setEmrFilterType('all');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              แสดงทั้งหมด ({medDispenseLogs.length} รายการ)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
            {pagedLogs.map((log, idx) => {
              const medsDispensed = log.medicines_dispensed || log.medications_dispensed || '-';
              const dosageText = log.dosage_instruction || log.instructions || 'ตามแพทย์/พยาบาลสั่ง';
              const rawTime = log.dispensed_at || log.created_at;
              const formattedTime = rawTime
                ? new Date(rawTime).toLocaleString('th-TH', {
                    year: '2-digit',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'เมื่อเร็วๆ นี้';

              return (
                <div
                  key={log.id || `${startIdx}-${idx}`}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition-colors space-y-2.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                          จ่ายยาแล้ว ✓
                        </span>
                        <span className="font-bold text-white">
                          อาการ: <span className="text-amber-300">{log.symptoms || log.chief_complaint || 'ไม่ระบุ'}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        📅 {formattedTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px] mb-0.5">💊 ยาและเวชภัณฑ์ที่ได้รับ:</span>
                        <span className="font-bold text-emerald-300 break-words">{medsDispensed}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px] mb-0.5">🩺 คำแนะนำในการใช้ยา:</span>
                        <span className="text-slate-200 break-words">{dosageText}</span>
                      </div>
                    </div>

                    {log.first_aid_done && (
                      <div className="p-2 rounded-xl bg-sky-950/30 border border-sky-500/25 text-[11px] text-sky-200">
                        <span className="font-bold">🩹 การปฐมพยาบาล:</span> {log.first_aid_done}
                      </div>
                    )}

                    {log.medical_notes && (
                      <div className="p-2 rounded-xl bg-amber-950/25 border border-amber-500/25 text-[11px] text-amber-200">
                        <span className="font-bold">📝 บันทึกเพิ่มเติม:</span> {log.medical_notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>
                      👨‍⚕️ ผู้จ่ายยา: <strong className="text-purple-300">{log.dispenser_name || 'เจ้าหน้าที่พยาบาล'}</strong>
                      {log.dispenser_callsign && <span className="font-mono text-slate-400"> ({log.dispenser_callsign})</span>}
                    </span>
                    <span className="font-mono text-slate-500">
                      ID: {log.id ? String(log.id).slice(0, 8) : `#${startIdx + idx + 1}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
