import { DataService } from '../supabase';
import { scanSlipImage } from './slipOcr';
import {
  getStaffPaymentSummary,
  isStaffRegistration,
  isMsuInstitution,
  STAFF_SHIRT_FEE
} from '../data/defaultData';
import {
  resolveSlipActorMeta,
  buildSlipUploaderFields,
  stampOcrWithUploader
} from './slipUploader';

/**
 * Determine whether a registration still owes any fee and which slip target field applies.
 * Works uniformly for MSU Staff, External Staff (accommodation balance), 2-installment, and full-plan applicants.
 */
export function getUnpaidSlipTarget(reg) {
  if (!reg) return null;
  if (reg.round2_cancelled_absent) {
    return {
      isPaid: true,
      isCancelledAbsent: true,
      isInstallmentRound2: false,
      installmentRound: null,
      isStaff: isStaffRegistration(reg),
      isMsu: isMsuInstitution(reg.institution),
      expectedAmount: 0,
      isPendingReview: false,
      label: 'ยกเลิกการจ่ายรอบที่ 2 แล้ว (ไม่เข้าร่วมอบรม)'
    };
  }

  const isStaff = isStaffRegistration(reg);
  const isMsu = isMsuInstitution(reg.institution);

  if (isStaff) {
    const staffSum = getStaffPaymentSummary(reg);
    if (!staffSum.isMsu && staffSum.accommodationRemaining > 0) {
      return {
        isPaid: false,
        isCancelledAbsent: false,
        isInstallmentRound2: true,
        installmentRound: 2,
        isStaff: true,
        isMsu: false,
        expectedAmount: staffSum.accommodationRemaining,
        isPendingReview: Boolean(staffSum.isAccommodationPendingReview || reg.installment_2_status === 'pending_review'),
        label: `ค่าที่พัก Staff ต่างมหาลัย (${staffSum.accommodationRemaining} บ.)`
      };
    }

    const r1Paid = reg.installment_1_status === 'paid' || reg.payment_status === 'paid';
    if (staffSum.totalStaffFee > 0 && !r1Paid) {
      const rem = Number(reg.payment_amount) > 0 ? Number(reg.payment_amount) : STAFF_SHIRT_FEE;
      return {
        isPaid: false,
        isCancelledAbsent: false,
        isInstallmentRound2: false,
        installmentRound: 1,
        isStaff: true,
        isMsu: staffSum.isMsu,
        expectedAmount: rem,
        isPendingReview: reg.payment_status === 'pending_review' || reg.installment_1_status === 'pending_review',
        label: `ค่าเสื้อ Staff (${rem} บ.)`
      };
    }

    return {
      isPaid: true,
      isCancelledAbsent: false,
      isInstallmentRound2: false,
      installmentRound: null,
      isStaff: true,
      isMsu: staffSum.isMsu,
      expectedAmount: 0,
      isPendingReview: false,
      label: 'ชำระครบถ้วนแล้ว'
    };
  }

  const isInstallment =
    reg.payment_plan === 'installment' ||
    Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url);

  if (isInstallment) {
    const isR1Paid = reg.installment_1_status === 'paid';
    const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url || reg.admin_manual_override);
    if (isR1Paid && !isR2Paid) {
      const amt = Number(reg.installment_2_amount) > 0 ? Number(reg.installment_2_amount) : (isMsu ? 250 : 450);
      return {
        isPaid: false,
        isCancelledAbsent: false,
        isInstallmentRound2: true,
        installmentRound: 2,
        isStaff: false,
        isMsu,
        expectedAmount: amt,
        isPendingReview: reg.installment_2_status === 'pending_review',
        label: `งวดที่ 2 (${amt} บ.)`
      };
    }
    if (!isR1Paid && reg.payment_status !== 'paid') {
      const amt = Number(reg.installment_1_amount) > 0 ? Number(reg.installment_1_amount) : 400;
      return {
        isPaid: false,
        isCancelledAbsent: false,
        isInstallmentRound2: false,
        installmentRound: 1,
        isStaff: false,
        isMsu,
        expectedAmount: amt,
        isPendingReview: reg.installment_1_status === 'pending_review' || reg.payment_status === 'pending_review',
        label: `งวดที่ 1 (${amt} บ.)`
      };
    }
    return {
      isPaid: true,
      isCancelledAbsent: false,
      isInstallmentRound2: false,
      installmentRound: null,
      isStaff: false,
      isMsu,
      expectedAmount: 0,
      isPendingReview: false,
      label: 'ชำระครบถ้วนแล้ว'
    };
  }

  if (reg.payment_status !== 'paid') {
    const amt = Number(reg.payment_amount) > 0 ? Number(reg.payment_amount) : (isMsu ? 650 : 850);
    return {
      isPaid: false,
      isCancelledAbsent: false,
      isInstallmentRound2: false,
      installmentRound: null,
      isStaff: false,
      isMsu,
      expectedAmount: amt,
      isPendingReview: reg.payment_status === 'pending_review',
      label: `ยอดค้างชำระ (${amt} บ.)`
    };
  }

  return {
    isPaid: true,
    isCancelledAbsent: false,
    isInstallmentRound2: false,
    installmentRound: null,
    isStaff: false,
    isMsu,
    expectedAmount: 0,
    isPendingReview: false,
    label: 'ชำระครบถ้วนแล้ว'
  };
}

/**
 * Upload a payment slip, run SlipOCR + duplicate check, and persist the update to Supabase.
 */
export async function uploadRemainingSlipFile({
  file,
  regTarget,
  expectedAmount,
  isInstallmentRound2 = true,
  installmentRound = null,
  onUpdateRegistration,
  operatorUser = null,
  isAdmin = false,
  isDevOperator = false,
  forceOperatorContext = false
}) {
  if (!file || !regTarget) {
    throw new Error('ไม่พบไฟล์สลิปหรือข้อมูลผู้สมัคร');
  }

  const uploadResult = await DataService.uploadFile(file, 'slips');
  if (!uploadResult?.url) {
    throw new Error('อัปโหลดสลิปไม่สำเร็จ');
  }

  const staffSum = getStaffPaymentSummary(regTarget);
  const rawOcr = await scanSlipImage(file, expectedAmount).catch(() => null);
  const evaluated = rawOcr ? { ...rawOcr } : null;
  if (evaluated) {
    const numExpected = Number(expectedAmount);
    evaluated.expectedAmount = numExpected;
    if (evaluated.amount && numExpected) {
      evaluated.matchExpected = Math.abs(Number(evaluated.amount) - numExpected) < 1;
    }
    const otherRef = isInstallmentRound2
      ? (regTarget.slip_ocr_round1?.transRef || regTarget.slip_ocr_full?.transRef || null)
      : null;
    if (evaluated.transRef && otherRef && evaluated.transRef.toLowerCase() === otherRef.toLowerCase()) {
      evaluated.isDuplicate = true;
      evaluated.duplicateMessage = 'รหัสอ้างอิงตรงกับสลิปรอบก่อนหน้า (ไม่สามารถใช้สลิปซ้ำได้)';
      evaluated.status = 'duplicate';
    } else if (evaluated.transRef) {
      const dupCheck = await DataService.checkSlipDuplicate(evaluated.transRef, regTarget.user_id);
      if (dupCheck.isDuplicate) {
        evaluated.isDuplicate = true;
        evaluated.duplicateMessage = dupCheck.message;
        evaluated.status = 'duplicate';
      }
    }
    evaluated.isFullyVerified = Boolean(evaluated.isDetected && evaluated.matchExpected === true && !evaluated.isDuplicate);
  }

  const actorMeta = resolveSlipActorMeta({
    operatorUser,
    isAdmin,
    isDevOperator,
    targetReg: regTarget,
    forceOperatorContext
  });
  const nowIso = new Date().toISOString();
  const stampedOcr = stampOcrWithUploader(evaluated, actorMeta, nowIso);
  const verified = Boolean(stampedOcr?.isFullyVerified);
  const newStatus = verified ? 'paid' : 'pending_review';
  const markMessagesPaid = verified && Array.isArray(regTarget.admin_messages)
    ? {
        admin_messages: regTarget.admin_messages.map(m =>
          (m?.request_payment || ['staff_accommodation', 'round_2_payment', 'urgent_round2_deadline'].includes(m?.msg_type))
            ? { ...m, payment_status: 'paid', read: true }
            : m
        )
      }
    : {};

  let updatePayload;
  if (isInstallmentRound2) {
    updatePayload = {
      payment_plan: (staffSum.isStaff && verified) ? 'full' : 'installment',
      installment_2_slip_url: uploadResult.url,
      installment_2_slip_date: nowIso,
      installment_2_status: newStatus,
      installment_2_amount: expectedAmount,
      slip_ocr_round2: stampedOcr,
      ...buildSlipUploaderFields('installment_2_slip', actorMeta, nowIso),
      ...(verified
        ? {
            payment_status: 'paid',
            payment_amount: 0,
            ...(staffSum.isStaff ? { staff_accommodation_paid: true } : {}),
            ...markMessagesPaid
          }
        : { payment_status: 'pending_review' })
    };
  } else if (installmentRound === 1) {
    const isR2Paid = regTarget.installment_2_status === 'paid';
    updatePayload = {
      payment_plan: (staffSum.isStaff && staffSum.isMsu) ? 'full' : 'installment',
      installment_1_slip_url: uploadResult.url,
      installment_1_slip_date: nowIso,
      installment_1_status: newStatus,
      installment_1_amount: expectedAmount,
      slip_ocr_round1: stampedOcr,
      ...buildSlipUploaderFields('installment_1_slip', actorMeta, nowIso),
      ...(verified && (isR2Paid || (staffSum.isStaff && staffSum.isMsu))
        ? { payment_status: 'paid', payment_amount: 0, ...markMessagesPaid }
        : { payment_status: verified ? 'partial_paid' : 'pending_review' })
    };
  } else {
    updatePayload = {
      payment_plan: 'full',
      payment_slip_url: uploadResult.url,
      payment_slip_date: nowIso,
      payment_status: newStatus,
      payment_amount: verified ? 0 : expectedAmount,
      slip_ocr_full: stampedOcr,
      ...buildSlipUploaderFields('payment_slip', actorMeta, nowIso),
      ...(verified ? markMessagesPaid : {})
    };
  }

  const targetKey = regTarget.user_id || regTarget.id;
  if (onUpdateRegistration) {
    await onUpdateRegistration(targetKey, updatePayload);
  } else {
    await DataService.updateRegistrationDetails(targetKey, updatePayload);
  }

  if (evaluated?.transRef) {
    DataService.recordSubmittedSlip({
      transRef: evaluated.transRef,
      userId: regTarget.user_id,
      userName: regTarget.full_name_affiliation || `${regTarget.first_name} ${regTarget.last_name}`,
      amount: evaluated.amount,
      bank: evaluated.bankDetected,
      date: evaluated.transferDate,
      time: evaluated.transferTime
    });
  }

  return { updatePayload, ocrInfo: evaluated, verified };
}
