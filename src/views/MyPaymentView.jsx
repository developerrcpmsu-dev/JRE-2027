import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Edit,
  Loader2,
  Lock,
  Maximize2,
  Phone,
  Upload,
  UserPlus,
  X
} from 'lucide-react';
import Toast from '../components/Toast';
import SlipUploaderBadge from '../components/SlipUploaderBadge';
import { resolvePersonFullNameWithTitle, normalizeCallsignSpacing } from '../data/defaultData';
import { computeRegistrationPaymentOverview } from '../utils/paymentSummaryUtils';
import { getUnpaidSlipTarget, uploadRemainingSlipFile } from '../utils/slipUploadHelper';
import { resolveSlipUploaderDisplay } from '../utils/slipUploader';
import { getRegistrationScheduleStatus } from '../utils/registrationSchedule';
import { buildUserPageUrl } from '../utils/router';

export default function MyPaymentView({
  user,
  operatorUser = null,
  isDevOperator = false,
  isAdmin = false,
  myRegistration,
  paymentConfig,
  onUpdateRegistration,
  onOpenGoogleLogin,
  onNavigateDashboard,
  onNavigateRegister
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [previewSlipModal, setPreviewSlipModal] = useState(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [isUploadingRound1, setIsUploadingRound1] = useState(false);
  const [isUploadingRound2, setIsUploadingRound2] = useState(false);
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCopyText = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    triggerToast(`คัดลอก${label}เรียบร้อย: ${text}`, 'success');
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            เข้าสู่ระบบเพื่อตรวจสอบค่าสมัคร & สถานะการชำระเงิน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ใช้สมัครโครงการ JRE 2027 เพื่อดูข้อมูลยอดชำระ เลขบัญชีธนาคาร และแนบหรือตรวจสอบสลิปโอนเงิน
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenGoogleLogin && (
              <button
                type="button"
                onClick={onOpenGoogleLogin}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-sm shadow-lg transition-all cursor-pointer"
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
            กรุณาลงทะเบียนเข้าร่วมโครงการ JRE 2027 ก่อนจึงจะดูข้อมูลค่าสมัครและสถานะการชำระเงินได้
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

  const overview = computeRegistrationPaymentOverview(myRegistration, paymentConfig);
  const {
    isStaffReg,
    staffSummary,
    isMsu,
    totalFee,
    paidAmount,
    remainingAmount,
    isInstallmentPlan,
    hasTransferredOrPaid,
    dashboardPaymentConfig
  } = overview;

  const isStaffCardOnlyNoFee = Boolean(
    (myRegistration.staff_id_card_only ||
      ((!myRegistration.shirt_size || myRegistration.shirt_size === '-') &&
        Number(myRegistration.payment_amount || 0) === 0 &&
        !myRegistration.payment_slip_url &&
        !myRegistration.installment_1_slip_url)) &&
    !((getUnpaidSlipTarget(myRegistration)?.expectedAmount || 0) > 0)
  );

  const isRegistrationClosed = Boolean(getRegistrationScheduleStatus(paymentConfig)?.isClosed);
  const nameData = resolvePersonFullNameWithTitle(myRegistration);
  const callsign = normalizeCallsignSpacing(myRegistration.callsign || '');
  const uid = myRegistration.user_id || myRegistration.id || user.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const directUrl = buildUserPageUrl(uid, 'my-payment', origin);

  const handleUploadSlip = async (e, { isInstallmentRound2 = false, installmentRound = null, expectedAmount }) => {
    const file = e.target.files?.[0];
    if (!file || !myRegistration) return;

    if (installmentRound === 1) setIsUploadingRound1(true);
    else if (isInstallmentRound2) setIsUploadingRound2(true);
    else setIsUploadingSlip(true);

    try {
      const { ocrInfo } = await uploadRemainingSlipFile({
        file,
        regTarget: myRegistration,
        expectedAmount,
        isInstallmentRound2,
        installmentRound,
        onUpdateRegistration,
        operatorUser: operatorUser || user,
        isAdmin,
        isDevOperator
      });

      const labelText = isInstallmentRound2
        ? (isStaffReg ? `ค่าที่พัก Staff (${expectedAmount} บ.)` : 'งวดที่ 2')
        : (installmentRound === 1 ? 'งวดที่ 1' : 'ชำระเต็มจำนวน');

      if (ocrInfo?.isFullyVerified) {
        triggerToast(`✓ สลิป${labelText} ถูกต้องสมบูรณ์ (${ocrInfo.amountFormatted}) ยืนยันสิทธิ์เรียบร้อย!`, 'success');
      } else if (ocrInfo?.isDuplicate) {
        triggerToast(`🚨 ${ocrInfo.duplicateMessage} (รอเจ้าหน้าที่ตรวจสอบ)`, 'error');
      } else if (ocrInfo?.isDetected) {
        triggerToast(`อัปโหลดและสแกนสลิป${labelText} เรียบร้อย (${ocrInfo.amountFormatted}) เจ้าหน้าที่จะทำการตรวจสอบ`, 'warning');
      } else {
        triggerToast(`อัปโหลดหลักฐาน${labelText} เรียบร้อย (รอเจ้าหน้าที่ตรวจสลิป)`, 'info');
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดสลิป', 'error');
    } finally {
      setIsUploadingSlip(false);
      setIsUploadingRound1(false);
      setIsUploadingRound2(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
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
        </div>

        <button
          type="button"
          onClick={() => handleCopyText(directUrl, 'page_url', ' URL หน้าการชำระเงิน')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-300 inline-flex items-center gap-1.5 cursor-pointer"
          title={directUrl}
        >
          {copiedKey === 'page_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey === 'page_url' ? 'คัดลอก URL แล้ว' : 'คัดลอก URL หน้านี้'}</span>
        </button>
      </div>

      {/* Participant Summary Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-400">บัญชีผู้สมัคร / ข้อมูลการชำระเงิน</div>
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
        </div>

        {!isStaffCardOnlyNoFee && (
          <div className="flex items-center gap-3 bg-slate-950/90 p-3 px-4 rounded-2xl border border-slate-800 text-xs shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block">ยอดรวม: <strong className="text-white">{totalFee} บ.</strong></span>
              <span className="text-[10px] text-emerald-400 block">ชำระแล้ว: <strong>{paidAmount} บ.</strong></span>
            </div>
            <div className="pl-3 border-l border-slate-800">
              <span className="text-[10px] text-rose-400 block font-semibold">ค้างชำระ:</span>
              <span className="text-base font-black text-rose-400">{remainingAmount} บ.</span>
            </div>
          </div>
        )}
      </div>

      {isStaffCardOnlyNoFee ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/50 border border-amber-400/50 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-black">
            <CheckCircle className="w-4 h-4" />
            <span>Staff ออกบัตรประจำตัว (ไม่มีค่าลงทะเบียน / ไม่มีรายการสั่งเสื้อ)</span>
          </div>
          <h2 className="text-lg font-black text-white">ข้อมูลและบัตรประจำตัว Staff พร้อมใช้งานแล้ว</h2>
          <p className="text-xs text-slate-300">
            รายการนี้ไม่มีค่าสมัครหรือยอดค้างชำระในระบบ
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-3xl border bg-slate-950/85 border-slate-800 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base sm:text-lg flex flex-wrap items-center gap-2">
                  <span>ข้อมูลค่าสมัคร & สถานะการชำระเงิน</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    ({isInstallmentPlan ? 'แผนแบ่งจ่าย 2 งวด' : 'แผนชำระเต็มจำนวน (จ่ายครบ 1 รอบ)'})
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isMsu ? '🎓 สังกัดนิสิต มมส (ยอดรวม 650 บ. • ไม่มีค่าที่พัก)' : '🏨 สังกัดต่างมหาวิทยาลัย (ยอดรวม 850 บ. • รวมที่พักหอกุดรัง มมส)'} • {dashboardPaymentConfig.notes || 'รองรับการชำระเต็มจำนวนหรือแบ่งจ่าย 2 งวด'}
                </p>
              </div>
            </div>

            {myRegistration.payment_status === 'paid' ? (
              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4" /> ชำระค่าสมัครครบถ้วนแล้ว
              </span>
            ) : myRegistration.payment_status === 'pending_review' ? (
              <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-sm">
                <Clock className="w-4 h-4" /> ส่งสลิปแล้ว กำลังรอผู้ดูแลตรวจสอบ
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <AlertCircle className="w-4 h-4" /> ค้างชำระค่าลงทะเบียน ({dashboardPaymentConfig.fee_total} บ.)
              </span>
            )}
          </div>

          {/* Bank Account Info Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                🏦 ข้อมูลบัญชีธนาคารสำหรับโอนเงิน
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                ✓ คลิกปุ่มเพื่อคัดลอกได้ทันที
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">{dashboardPaymentConfig.bank_name}</span>
                  <span className="font-mono font-bold text-amber-300 text-sm truncate block">
                    {dashboardPaymentConfig.bank_account_number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(dashboardPaymentConfig.bank_account_number, 'bank_acc', 'เลขบัญชี')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px] cursor-pointer"
                  title="คัดลอกเลขบัญชี"
                >
                  {copiedKey === 'bank_acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'bank_acc' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">ชื่อบัญชี</span>
                  <span className="font-semibold text-white text-xs truncate block" title={dashboardPaymentConfig.bank_account_name}>
                    {dashboardPaymentConfig.bank_account_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(dashboardPaymentConfig.bank_account_name, 'bank_name', 'ชื่อบัญชี')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px] cursor-pointer"
                  title="คัดลอกชื่อบัญชี"
                >
                  {copiedKey === 'bank_name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'bank_name' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-amber-300 block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-400" />
                    ☎️ สอบถามเพิ่มเติม (ไม่มีพร้อมเพย์)
                  </span>
                  <span className="font-mono font-bold text-white text-sm truncate block mt-0.5">
                    {dashboardPaymentConfig.contact_phone || '098-329-6762'}
                  </span>
                </div>
                <a
                  href={`tel:${(dashboardPaymentConfig.contact_phone || '098-329-6762').replace(/[^0-9]/g, '')}`}
                  className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                  title="โทรสอบถาม"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>โทรติดต่อ</span>
                </a>
              </div>
            </div>

            <div className="mt-3 text-[11px] bg-rose-950/40 border border-rose-500/40 text-rose-200 p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>ข้อควรระวัง:</strong> รับโอนเงินเฉพาะบัญชี <strong>ธนาคารไทยพาณิชย์ 594-264865-5 (นางสาวมัญชุพร ยังเหล็ก)</strong> เท่านั้น • <u>ไม่มีระบบพร้อมเพย์ (PromptPay)</u> (เบอร์ 098-329-6762 มีไว้สำหรับสอบถามข้อมูลเท่านั้น ห้ามโอนเงินผ่านเบอร์โทร)
              </span>
            </div>

            {myRegistration.payment_notes && (
              <div className="text-[11px] text-amber-200/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                <span className="font-bold">หมายเหตุจากฝ่ายการเงิน: </span>
                {myRegistration.payment_notes}
              </div>
            )}
          </div>

          {/* Payment Plan Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-base shrink-0">📌</span>
              <div>
                <span className="text-xs text-slate-400 font-medium">รูปแบบการชำระเงินที่เลือกไว้:</span>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm ${
                    isInstallmentPlan
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isInstallmentPlan ? (
                      <>💳 แบ่งจ่าย 2 งวด ({dashboardPaymentConfig.installment_round1_amount} + {dashboardPaymentConfig.installment_round2_amount} บาท)</>
                    ) : (
                      <>🌟 ชำระเต็มจำนวน ({dashboardPaymentConfig.fee_total} บาท)</>
                    )}
                  </span>
                  {hasTransferredOrPaid ? (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" /> ล็อกตามประวัติการชำระ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[10px] font-semibold">
                      เลือกไว้ในแบบฟอร์ม
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!hasTransferredOrPaid && !overview.isFullyPaid && !isRegistrationClosed && onNavigateRegister && (
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold py-1.5 px-3 rounded-xl bg-sky-950/30 border border-sky-800/40 transition-colors shrink-0"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>ต้องการเปลี่ยนรูปแบบ? (ไปแบบฟอร์มแก้ไข)</span>
              </button>
            )}
          </div>

          {/* VIEW A: 2-ROUND INSTALLMENT VIEW OR VIEW B: FULL PAYMENT */}
          {isInstallmentPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Round 1 Box */}
              <div className="bg-slate-900/90 border border-purple-500/40 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                      {isStaffReg ? 'ส่วนที่ 1: ค่าเสื้อ Staff โครงการ' : 'งวดที่ 1 (รอบแรก - วันเปิดรับสมัคร)'}
                    </span>
                    <p className="text-xl font-black text-white mt-0.5">
                      {dashboardPaymentConfig.installment_round1_amount} <span className="text-sm font-normal text-slate-400">บาท</span>
                      {isStaffReg && staffSummary.isOffsetApplied && (
                        <span className="ml-2 text-xs font-bold text-purple-300">
                          (โอนมา {staffSummary.r1SlipAmount} บ. • หักลบค่าที่พัก +{staffSummary.offsetToAccommodation} บ.)
                        </span>
                      )}
                    </p>
                  </div>

                  {myRegistration.installment_1_status === 'paid' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> ชำระแล้ว
                    </span>
                  ) : myRegistration.installment_1_status === 'pending_review' ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> รอตรวจสอบ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[11px] font-bold">
                      ค้างชำระงวด 1
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
                    <span>รายละเอียด: <strong className="text-white">{dashboardPaymentConfig.installment_round1_due}</strong></span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  {myRegistration.installment_1_slip_url ? (
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setPreviewSlipModal(myRegistration.installment_1_slip_url)}
                        className="cursor-pointer group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0"
                      >
                        <img src={myRegistration.installment_1_slip_url} alt="สลิปงวด 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[11px] text-emerald-400 font-semibold block">✓ อัปโหลดสลิปงวดที่ 1 แล้ว</span>
                        <SlipUploaderBadge uploader={resolveSlipUploaderDisplay(myRegistration, 'round1')} size="xs" />
                        <span className="text-[10px] text-slate-500 block truncate">
                          {myRegistration.installment_1_slip_date ? new Date(myRegistration.installment_1_slip_date).toLocaleString('th-TH') : '-'}
                        </span>
                        {myRegistration.installment_1_status === 'paid' ? (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> อนุมัติงวดที่ 1 แล้ว (ล็อคสลิป)
                          </span>
                        ) : (
                          <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-flex items-center gap-1">
                            <span>{myRegistration.installment_1_status === 'unpaid' ? 'อัปโหลดสลิปงวด 1 ใหม่' : 'ส่งสลิปงวด 1 ใหม่ทดแทน (กรณีแนบผิด)'}</span>
                            <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(e, { installmentRound: 1, expectedAmount: dashboardPaymentConfig.installment_round1_amount })} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingRound1 ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingRound1 ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งสลิปงวด 1...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>แนบสลิปงวดที่ 1 ({dashboardPaymentConfig.installment_round1_amount} บ.)</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(e, { installmentRound: 1, expectedAmount: dashboardPaymentConfig.installment_round1_amount })} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Round 2 Box */}
              <div className="bg-slate-900/90 border border-indigo-500/40 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                      {isStaffReg ? 'ส่วนที่ 2: ค่าที่พักหอพักกุดรังสำหรับ Staff ต่างมหาลัย (200 บ.)' : 'งวดที่ 2 (รอบที่ 2)'}
                    </span>
                    <p className="text-xl font-black text-white mt-0.5">
                      {dashboardPaymentConfig.installment_round2_amount} <span className="text-sm font-normal text-slate-400">บาท</span>
                      {isStaffReg && staffSummary.isOffsetApplied && (
                        <span className="ml-2 text-xs font-bold text-amber-300">
                          (จากค่าที่พัก 200 บ. หักส่วนเกิน -{staffSummary.offsetToAccommodation} บ.)
                        </span>
                      )}
                    </p>
                  </div>

                  {myRegistration.round2_cancelled_absent ? (
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-600 rounded-full text-[11px] font-bold">
                      🚫 ยกเลิกรอบ 2 (ตัดจบ 0 บ.)
                    </span>
                  ) : myRegistration.payment_deferred_post_project && myRegistration.installment_2_status !== 'paid' ? (
                    <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full text-[11px] font-bold">
                      🕒 จ่ายย้อนหลังหลังจบโครงการ
                    </span>
                  ) : myRegistration.installment_2_status === 'paid' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> ชำระแล้ว
                    </span>
                  ) : myRegistration.installment_2_status === 'pending_review' ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> รอตรวจสอบ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[11px] font-bold">
                      {isStaffReg ? `ค้างค่าที่พัก (${dashboardPaymentConfig.installment_round2_amount} บ.)` : 'ค้างชำระงวด 2'}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>กำหนดชำระ: <strong className="text-white">{dashboardPaymentConfig.installment_round2_due}</strong></span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  {myRegistration.installment_2_slip_url ? (
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setPreviewSlipModal(myRegistration.installment_2_slip_url)}
                        className="cursor-pointer group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0"
                      >
                        <img src={myRegistration.installment_2_slip_url} alt="สลิปงวด 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[11px] text-emerald-400 font-semibold block">✓ อัปโหลดสลิปแล้ว</span>
                        <SlipUploaderBadge uploader={resolveSlipUploaderDisplay(myRegistration, 'round2')} size="xs" />
                        <span className="text-[10px] text-slate-500 block truncate">
                          {myRegistration.installment_2_slip_date ? new Date(myRegistration.installment_2_slip_date).toLocaleString('th-TH') : '-'}
                        </span>
                        {myRegistration.installment_2_status === 'paid' ? (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> อนุมัติแล้ว (ล็อคสลิป)
                          </span>
                        ) : myRegistration.round2_cancelled_absent ? (
                          <span className="text-[10px] text-slate-400 font-bold block mt-1.5">🚫 ยกเลิกการจ่ายรอบที่ 2 แล้ว</span>
                        ) : (
                          <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-flex items-center gap-1">
                            <span>{myRegistration.installment_2_status === 'unpaid' ? 'อัปโหลดสลิปใหม่' : 'ส่งสลิปใหม่ทดแทน (กรณีแนบผิด)'}</span>
                            <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(e, { isInstallmentRound2: true, installmentRound: 2, expectedAmount: dashboardPaymentConfig.installment_round2_amount })} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingRound2 ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingRound2 ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งสลิป...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{isStaffReg ? `แนบสลิปค่าที่พัก Staff (${dashboardPaymentConfig.installment_round2_amount} บ.)` : `แนบสลิปงวดที่ 2 (${dashboardPaymentConfig.installment_round2_amount} บ.)`}</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(e, { isInstallmentRound2: true, installmentRound: 2, expectedAmount: dashboardPaymentConfig.installment_round2_amount })} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1.5">
                <p className="text-slate-400">
                  ยอดค่าลงทะเบียนเต็มจำนวน: <span className="font-bold text-white text-base">{dashboardPaymentConfig.fee_total} บาท</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  ครอบคลุมค่าประกันอุบัติเหตุ อาหารทุกมื้อ ที่พักค้างแรม อุปกรณ์การฝึก และวุฒิบัตรรับรอง
                </p>
              </div>

              <div className="flex flex-col justify-center items-start sm:items-end gap-2">
                {myRegistration.payment_slip_url ? (
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setPreviewSlipModal(myRegistration.payment_slip_url)}
                      className="cursor-pointer group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900"
                    >
                      <img src={myRegistration.payment_slip_url} alt="สลิปโอนเงิน" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-emerald-400 font-semibold block">✓ อัปโหลดสลิปเต็มจำนวนแล้ว</span>
                      <SlipUploaderBadge uploader={resolveSlipUploaderDisplay(myRegistration, 'full')} size="xs" />
                      <span className="text-[10px] text-slate-500 block">
                        ส่งเมื่อ: {myRegistration.payment_slip_date ? new Date(myRegistration.payment_slip_date).toLocaleString('th-TH') : '-'}
                      </span>
                      {myRegistration.slip_ocr_full && (
                        <span className="text-[10px] text-amber-300 font-mono block">
                          {myRegistration.slip_ocr_full.isDetected
                            ? `โอน: ${myRegistration.slip_ocr_full.transferDateTimeStr || myRegistration.slip_ocr_full.uploadTimeStr} (${myRegistration.slip_ocr_full.amountFormatted})`
                            : `อัปโหลด: ${myRegistration.slip_ocr_full.uploadTimeStr} (รอตรวจยอด)`}
                        </span>
                      )}
                      {myRegistration.payment_status === 'paid' ? (
                        <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> ตรวจสอบและอนุมัติยอดเงินแล้ว (ล็อคสลิป)
                        </span>
                      ) : (
                        <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-flex items-center gap-1">
                          <span>{myRegistration.payment_status === 'unpaid' ? 'อัปโหลดสลิปใหม่ (ส่งใหม่)' : 'ส่งสลิปใหม่ทดแทน (กรณีแนบผิด)'}</span>
                          <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(e, { isInstallmentRound2: false, installmentRound: null, expectedAmount: dashboardPaymentConfig.fee_total })} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingSlip ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploadingSlip ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังส่งสลิป...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>อัปโหลดสลิปโอนเงินเต็มจำนวน ({dashboardPaymentConfig.fee_total} บ.)</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleUploadSlip(e, { isInstallmentRound2: false, installmentRound: null, expectedAmount: dashboardPaymentConfig.fee_total })} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slip Image Lightbox Modal */}
      {previewSlipModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewSlipModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewSlipModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-white border border-slate-700 cursor-pointer"
              aria-label="ปิดรูปสลิป"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewSlipModal} alt="สลิปโอนเงิน" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
