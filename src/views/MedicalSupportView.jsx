import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  HeartPulse,
  Save,
  Stethoscope,
  UserPlus
} from 'lucide-react';
import Toast from '../components/Toast';
import { DataService } from '../supabase';
import {
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing,
  getApplicantMedical,
  getApplicantAllergy,
  getMedicalEquipmentNeeded,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  formatMedicalLabel,
  formatAllergyLabel
} from '../data/defaultData';
import { buildUserPageUrl } from '../utils/router';

const QUICK_MED_TAGS = [
  'ยาพาราเซตามอล',
  'ยาแก้แพ้ / คัดจมูก',
  'ผงเกลือแร่ ORS',
  'ยาทากันยุง / คาลาไมน์',
  'พลาสเตอร์ยา / ทำแผล'
];

export default function MedicalSupportView({
  user,
  myRegistration,
  onUpdateRegistration,
  onOpenGoogleLogin,
  onNavigateDashboard,
  onNavigateRegister,
  onNavigateMyEmr
}) {
  const [userMedicalEquipment, setUserMedicalEquipment] = useState(
    () => getMedicalEquipmentNeeded(myRegistration) || ''
  );
  const [isSavingMedEquip, setIsSavingMedEquip] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setUserMedicalEquipment(getMedicalEquipmentNeeded(myRegistration) || '');
  }, [myRegistration]);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            เข้าสู่ระบบเพื่อแจ้งคำขอเตรียมยา / เวชภัณฑ์ภาคสนาม
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ใช้สมัครโครงการ JRE 2027 เพื่อแจ้งหรือแก้ไขรายการยาและเวชภัณฑ์สำรองสำหรับตัวท่าน
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenGoogleLogin && (
              <button
                type="button"
                onClick={onOpenGoogleLogin}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm shadow-lg transition-all cursor-pointer"
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
            กรุณาลงทะเบียนเข้าร่วมโครงการ JRE 2027 ก่อนจึงจะสามารถแจ้งคำขอเตรียมยา / เวชภัณฑ์ภาคสนามได้
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
  const directUrl = buildUserPageUrl(uid, 'medical-support', origin);

  const savedValue = getMedicalEquipmentNeeded(myRegistration) || '';
  const hasUnsavedChanges = userMedicalEquipment !== savedValue;

  const hasMed = hasMedicalCondition(myRegistration);
  const hasAlg = hasFoodOrDrugAllergy(myRegistration);
  const medText = getApplicantMedical(myRegistration);
  const algText = getApplicantAllergy(myRegistration);

  const handleSave = async () => {
    setIsSavingMedEquip(true);
    try {
      const targetId = myRegistration.id || myRegistration.user_id;
      const val = userMedicalEquipment.trim();
      if (onUpdateRegistration) {
        await onUpdateRegistration(targetId, { medical_equipment_needed: val });
      } else {
        await DataService.updateRegistrationDetails(targetId, { medical_equipment_needed: val });
      }
      triggerToast('✓ บันทึกคำขอเตรียมยาและเวชภัณฑ์เรียบร้อยแล้ว คณะทำงานและทีมแพทย์สนามจะจัดเตรียมไว้ให้ครับ', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกคำขอเตรียมยา', 'error');
    } finally {
      setIsSavingMedEquip(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Action Bar */}
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
          {onNavigateMyEmr && (
            <button
              type="button"
              onClick={onNavigateMyEmr}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-xs font-bold text-rose-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>ประวัติรับยา & เวชระเบียน (EMR)</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(directUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
            triggerToast(`คัดลอกลิงก์หน้าคำขอเตรียมยาแล้ว:\n${directUrl}`, 'success');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-emerald-300 inline-flex items-center gap-1.5 cursor-pointer"
          title={directUrl}
        >
          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedUrl ? 'คัดลอก URL แล้ว' : 'คัดลอก URL หน้านี้'}</span>
        </button>
      </div>

      {/* Identity & Declared Health Context Strip */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400">ข้อมูลผู้ยื่นคำขอเตรียมยาภาคสนาม</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base sm:text-lg font-black text-white">{nameData.fullName}</span>
            {myRegistration.nickname && myRegistration.nickname !== '-' && (
              <span className="text-xs font-bold text-slate-300">({myRegistration.nickname})</span>
            )}
            {callsign && callsign !== '-' && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black">
                {callsign}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            {myRegistration.blood_group && myRegistration.blood_group !== '-' && (
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono">
                🩸 หมู่เลือด: {myRegistration.blood_group}
              </span>
            )}
            {hasMed ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 font-bold">
                🩺 {formatMedicalLabel(medText)}
              </span>
            ) : null}
            {hasAlg ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-200 font-bold">
                ⚠️ {formatAllergyLabel(algText)}
              </span>
            ) : null}
            {!hasMed && !hasAlg && (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-semibold">
                ✓ ไม่มีโรคประจำตัว / ไม่แพ้ยา-อาหาร
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Medical Support Request Form */}
      <div className="p-5 sm:p-7 rounded-3xl bg-slate-950/95 border border-emerald-500/35 shadow-xl flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-white text-base sm:text-xl flex flex-wrap items-center gap-2">
                  <span>🩺 คำขอเตรียมยา / เวชภัณฑ์ภาคสนาม</span>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Medical Support
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  แจ้งรายการยาหรือเวชภัณฑ์ที่ต้องการให้ทีมแพทย์สนามและฝ่ายพยาบาลจัดเตรียมล่วงหน้า (ทั้งผู้มีโรคประจำตัวและคนปกติ)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              rows="5"
              value={userMedicalEquipment}
              onChange={(e) => setUserMedicalEquipment(e.target.value)}
              placeholder="เช่น ขอยาพาราเซตามอลสำรอง, ขอยาทากันยุง / คาลาไมน์แก้คัน, ยาแก้แพ้แก้คัดจมูก, ผงเกลือแร่ ORS, ผ้าพันแผล หรือระบุยาประจำตัวที่ต้องนำติดตัวมา"
              className="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />

            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <span>💡 คำแนะนำ:</span>
                <span className="text-slate-400 font-normal">กดปุ่มเพื่อเพิ่มรายการอัตโนมัติ</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_MED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const cur = userMedicalEquipment.trim();
                      if (!cur.includes(tag)) {
                        setUserMedicalEquipment(cur ? `${cur}, ${tag}` : tag);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">
            {hasUnsavedChanges
              ? '⚡ มีคำขอที่ยังไม่ได้บันทึก: กรุณากดปุ่มบันทึกด้านขวา'
              : '✓ ข้อมูลคำขอเตรียมยาเป็นปัจจุบันแล้ว'}
          </span>

          <button
            type="button"
            disabled={isSavingMedEquip || !hasUnsavedChanges}
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSavingMedEquip ? 'กำลังบันทึก...' : '💾 บันทึกคำขอเตรียมยา'}</span>
          </button>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
