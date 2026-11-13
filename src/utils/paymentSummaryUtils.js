import {
  DEFAULT_PAYMENT_CONFIG,
  STAFF_SHIRT_FEE,
  getRegistrationFeeDetails,
  getStaffPaymentSummary,
  isStaffRegistration
} from '../data/defaultData';

/**
 * Compute unified payment breakdown, plan status, paid/remaining totals,
 * and display config for a single registration record.
 */
export function computeRegistrationPaymentOverview(reg, paymentConfig = null) {
  const effectivePaymentConfig = paymentConfig || DEFAULT_PAYMENT_CONFIG;
  if (!reg) {
    return {
      isStaffReg: false,
      staffSummary: null,
      participantFee: null,
      isMsu: false,
      totalFee: effectivePaymentConfig.fee_total,
      round1Amount: effectivePaymentConfig.installment_round1_amount,
      round2Amount: effectivePaymentConfig.installment_round2_amount,
      isSinglePaid: false,
      isRound2Paid: false,
      isInstallmentsBothPaid: false,
      isFullyPaid: false,
      paidAmount: 0,
      remainingAmount: effectivePaymentConfig.fee_total,
      isInstallmentPlan: false,
      hasTransferredOrPaid: false,
      dashboardPaymentConfig: effectivePaymentConfig
    };
  }

  const isStaffReg = isStaffRegistration(reg);
  const staffSummary = getStaffPaymentSummary(reg);
  const participantFee = getRegistrationFeeDetails(reg, isStaffReg);
  const isMsu = participantFee.isMsu;

  const totalFee = isStaffReg ? staffSummary.totalStaffFee : participantFee.totalFee;
  const round1Amount = isStaffReg ? staffSummary.shirtFee : participantFee.round1Amount;
  const round2Amount = isStaffReg
    ? (isMsu ? 0 : staffSummary.accommodationNetRequiredAfterOffset)
    : participantFee.round2Amount;

  const isSinglePaid = isStaffReg
    ? (isMsu
        ? (reg.payment_status === 'paid' || reg.installment_1_status === 'paid' || staffSummary.r1SlipAmount >= STAFF_SHIRT_FEE)
        : staffSummary.isAccommodationPaid)
    : (reg.payment_plan !== 'installment' && (reg.payment_status === 'paid' || reg.payment_status === 'verified'));

  const isRound2Paid = isStaffReg
    ? staffSummary.isAccommodationPaid
    : (reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url));

  const isInstallmentsBothPaid = isStaffReg
    ? (!isMsu && staffSummary.isAccommodationPaid)
    : (reg.installment_1_status === 'paid' && isRound2Paid);

  const isFullyPaid = isSinglePaid || isInstallmentsBothPaid;

  let paidAmount = 0;
  if (isFullyPaid) {
    paidAmount = totalFee;
  } else if (isStaffReg) {
    if (isMsu) {
      paidAmount = (reg.payment_status === 'paid' || reg.installment_1_status === 'paid' || staffSummary.r1SlipAmount >= STAFF_SHIRT_FEE)
        ? STAFF_SHIRT_FEE
        : 0;
    } else {
      const shirtPaidPart = (reg.installment_1_status === 'paid' || staffSummary.r1SlipAmount >= STAFF_SHIRT_FEE)
        ? STAFF_SHIRT_FEE
        : 0;
      paidAmount = Math.min(totalFee, shirtPaidPart + staffSummary.accommodationPaidTotal);
    }
  } else if (reg.payment_plan === 'installment') {
    if (reg.installment_1_status === 'paid') paidAmount += round1Amount;
    if (isRound2Paid) paidAmount += round2Amount;
  } else if (isSinglePaid) {
    paidAmount = totalFee;
  }

  const remainingAmount = Math.max(0, totalFee - paidAmount);
  const isInstallmentPlan = isStaffReg
    ? !isMsu
    : (reg.payment_plan
        ? reg.payment_plan === 'installment'
        : Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url));

  const hasTransferredOrPaid = Boolean(
    reg.payment_status === 'paid' ||
    reg.payment_status === 'verified' ||
    reg.payment_status === 'partial_paid' ||
    reg.payment_status === 'pending_review' ||
    reg.installment_1_status === 'paid' ||
    reg.installment_1_status === 'pending_review' ||
    reg.installment_2_status === 'paid' ||
    reg.installment_2_status === 'pending_review' ||
    reg.payment_slip_url ||
    reg.slip_url ||
    reg.installment_1_slip_url ||
    reg.installment_2_slip_url
  );

  const dashboardPaymentConfig = {
    ...effectivePaymentConfig,
    fee_total: totalFee,
    installment_round1_amount: round1Amount,
    installment_round1_due: participantFee.round1Due,
    installment_round2_amount: round2Amount,
    installment_round2_due: participantFee.round2Due,
    notes: participantFee.feeNote
  };

  return {
    isStaffReg,
    staffSummary,
    participantFee,
    isMsu,
    totalFee,
    round1Amount,
    round2Amount,
    isSinglePaid,
    isRound2Paid,
    isInstallmentsBothPaid,
    isFullyPaid,
    paidAmount,
    remainingAmount,
    isInstallmentPlan,
    hasTransferredOrPaid,
    dashboardPaymentConfig
  };
}
