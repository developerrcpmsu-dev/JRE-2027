import { isStaffRegistration, isMsuInstitution } from '../data/defaultData';

/**
 * แปลงสถานะการชำระเงินในฐานข้อมูลเป็นป้ายกำกับภาษาไทยสำหรับแสดงในแกลเลอรีสลิป
 */
export const resolveSlipStatusMeta = (status) => {
  const s = String(status || '').toLowerCase();
  if (['paid', 'verified', 'paid_verified', 'approved'].includes(s)) {
    return { label: 'อนุมัติแล้ว', tone: 'emerald' };
  }
  if (['pending_review', 'pending_verification', 'pending'].includes(s)) {
    return { label: 'รอตรวจสอบ', tone: 'amber' };
  }
  if (s === 'rejected') {
    return { label: 'ถูกปฏิเสธ', tone: 'rose' };
  }
  if (s === 'partial_paid') {
    return { label: 'ชำระบางส่วน', tone: 'sky' };
  }
  return null;
};

const readOcrAmount = (ocr) => {
  if (!ocr || typeof ocr !== 'object') return 0;
  const n = Number(ocr.amount || ocr.amountDetected || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const normalizeUrl = (url) => (typeof url === 'string' ? url.trim() : '');

/**
 * รวบรวมสลิปทุกใบของผู้สมัคร 1 คน (ชำระเต็ม / งวด 1 / งวด 2 / สลิประบบเดิม / สลิปโอนคืน)
 * - ตัด URL ซ้ำออก (เช่น payment_slip_url กับ installment_1_slip_url ที่เป็นไฟล์เดียวกัน) และรวมป้ายกำกับเข้าด้วยกัน
 * - คืนค่าเป็นอาร์เรย์เรียงตามลำดับรอบการชำระ เพื่อแสดงสลิปได้ครบทั้ง 1, 2 หรือ 3 รูปขึ้นไป
 */
export const collectRegistrationSlips = (reg) => {
  if (!reg) return [];

  const isStaff = isStaffRegistration(reg);
  const isNonMsuStaff = isStaff && !isMsuInstitution(reg);
  const isInstallment = !isStaff && (reg.payment_plan === 'installment' || Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url));

  // กำหนดลำดับ candidate ตามแผนการชำระเงินจริง
  const candidates = [];

  if (isStaff) {
    candidates.push(
      {
        key: 'round1',
        url: reg.installment_1_slip_url || reg.payment_slip_url,
        label: 'รอบที่ 1 • ค่าเสื้อ Staff (280 บ.)',
        date: reg.installment_1_slip_date || reg.payment_slip_date,
        amount: readOcrAmount(reg.slip_ocr_round1) || readOcrAmount(reg.slip_ocr_full),
        status: reg.installment_1_status || reg.payment_status,
        kind: 'payment'
      },
      {
        key: 'round2',
        url: reg.installment_2_slip_url,
        label: isNonMsuStaff ? 'รอบที่ 2 • ค่าที่พัก Staff (200 บ.)' : 'รอบที่ 2 • สลิปเพิ่มเติม',
        date: reg.installment_2_slip_date,
        amount: readOcrAmount(reg.slip_ocr_round2),
        status: reg.installment_2_status,
        kind: 'payment'
      },
      {
        key: 'full',
        url: reg.payment_slip_url,
        label: 'สลิปค่าเสื้อหลัก',
        date: reg.payment_slip_date,
        amount: readOcrAmount(reg.slip_ocr_full),
        status: reg.payment_status,
        kind: 'payment'
      }
    );
  } else if (isInstallment) {
    candidates.push(
      {
        key: 'round1',
        url: reg.installment_1_slip_url || reg.payment_slip_url,
        label: 'งวดที่ 1 (มัดจำเสื้อ 400 บ.)',
        date: reg.installment_1_slip_date || reg.payment_slip_date,
        amount: readOcrAmount(reg.slip_ocr_round1) || readOcrAmount(reg.slip_ocr_full),
        status: reg.installment_1_status || reg.payment_status,
        kind: 'payment'
      },
      {
        key: 'round2',
        url: reg.installment_2_slip_url,
        label: 'งวดที่ 2 (ส่วนที่เหลือ)',
        date: reg.installment_2_slip_date,
        amount: readOcrAmount(reg.slip_ocr_round2),
        status: reg.installment_2_status,
        kind: 'payment'
      },
      {
        key: 'full',
        url: reg.payment_slip_url,
        label: 'สลิปการโอนเงินเพิ่มเติม',
        date: reg.payment_slip_date,
        amount: readOcrAmount(reg.slip_ocr_full),
        status: reg.payment_status,
        kind: 'payment'
      }
    );
  } else {
    // จ่ายครบ 1 รอบ
    candidates.push(
      {
        key: 'full',
        url: reg.payment_slip_url || reg.installment_1_slip_url,
        label: 'ชำระเต็มจำนวน (รอบเดียว)',
        date: reg.payment_slip_date || reg.installment_1_slip_date,
        amount: readOcrAmount(reg.slip_ocr_full) || readOcrAmount(reg.slip_ocr_round1),
        status: reg.payment_status || reg.installment_1_status,
        kind: 'payment'
      },
      {
        key: 'round2',
        url: reg.installment_2_slip_url,
        label: 'สลิปเพิ่มเติม / รอบที่ 2',
        date: reg.installment_2_slip_date,
        amount: readOcrAmount(reg.slip_ocr_round2),
        status: reg.installment_2_status,
        kind: 'payment'
      }
    );
  }

  // เพิ่มช่องสลิปโอนคืนส่วนเกิน (Refund)
  candidates.push({
    key: 'refund',
    url: reg.refund_slip_url,
    label: 'สลิปโอนเงินคืนส่วนเกิน (โครงการโอนให้)',
    date: reg.refund_at || reg.refund_date || null,
    amount: Number(reg.refund_amount || 0) || 0,
    status: null,
    kind: 'refund'
  });

  // เพิ่มช่องสลิปแบบ legacy (ถ้ามี)
  candidates.push({
    key: 'legacy',
    url: reg.slip_url,
    label: 'สลิปเพิ่มเติม (ระบบเดิม)',
    date: null,
    amount: 0,
    status: null,
    kind: 'payment'
  });

  const byUrl = new Map();
  candidates.forEach((c) => {
    const url = normalizeUrl(c.url);
    if (!url) return;
    const existing = byUrl.get(url);
    if (existing) {
      // ไฟล์เดียวกันถูกบันทึกไว้หลายช่อง -> ไม่แสดงซ้ำ แต่เก็บคีย์ไว้
      existing.keys.push(c.key);
      if (!existing.date && c.date) existing.date = c.date;
      if (!existing.amount && c.amount) existing.amount = c.amount;
      if (!existing.statusMeta) existing.statusMeta = resolveSlipStatusMeta(c.status);
      return;
    }
    byUrl.set(url, {
      key: c.key,
      keys: [c.key],
      url,
      label: c.label,
      date: c.date || null,
      amount: c.amount || 0,
      statusMeta: resolveSlipStatusMeta(c.status),
      kind: c.kind
    });
  });

  return Array.from(byUrl.values());
};
