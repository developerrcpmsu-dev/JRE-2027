import { resolvePersonFullNameWithTitle } from '../data/defaultData';

export const STRICT_DEV_EMAILS = [
  'developer.rcpmsu@gmail.com',
  'bestasic22@gmail.com',
  '68011211206@msu.ac.th'
];

export const SLIP_UPLOADER_PREFIXES = [
  'payment_slip',
  'installment_1_slip',
  'installment_2_slip',
  'refund_slip'
];

/**
 * ตรวจสอบว่าบัญชีผู้ปฏิบัติงานเป็น Dev (Developer) หรือไม่
 */
export function isDevActorIdentity(actor, isDevFlag = false) {
  if (isDevFlag === true) return true;
  if (!actor || actor._isDevPreview === true) return false;
  const email = String(actor.email || '').trim().toLowerCase();
  const role = String(actor.role || '').trim().toLowerCase();
  return role === 'dev' || role === 'developer' || STRICT_DEV_EMAILS.includes(email);
}

function getApplicantName(reg) {
  if (!reg) return '';
  try {
    const resolved = resolvePersonFullNameWithTitle(reg);
    if (resolved?.fullName) return resolved.fullName;
  } catch (e) {}
  return `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || reg.user_email || '';
}

/**
 * ระบุตัวตนผู้ที่กำลังอัปโหลดสลิป (Dev / Admin / เจ้าตัว)
 * รองรับกรณี Dev เข้าดูผ่าน ?uid= หรือ /u/:uid (isDevPreview) ให้บันทึกเป็น Dev จริง ไม่ใช่ชื่อเจ้าตัวที่ถูกจำลอง
 */
export function resolveSlipActorMeta({
  operatorUser = null,
  isAdmin = false,
  isDevOperator = false,
  targetReg = null,
  forceOperatorContext = false
} = {}) {
  const realActor = operatorUser && operatorUser._isDevPreview !== true ? operatorUser : null;
  const actorEmail = String(realActor?.email || '').trim().toLowerCase();
  const actorRole = String(realActor?.role || '').trim().toLowerCase();

  const actorIsDev = isDevActorIdentity(realActor, isDevOperator);
  const actorIsAdmin = !actorIsDev && Boolean(
    isAdmin ||
    actorRole === 'admin' ||
    actorRole === 'staff'
  );

  const targetUserId = String(targetReg?.user_id || '').trim();
  const targetEmail = String(targetReg?.user_email || '').trim().toLowerCase();
  const actorId = String(realActor?.id || '').trim();

  const actorMatchesOwner = Boolean(
    realActor &&
    targetReg &&
    ((targetUserId && actorId && actorId === targetUserId) || (targetEmail && actorEmail && actorEmail === targetEmail))
  );

  const isPreviewMode = Boolean(operatorUser && operatorUser._isDevPreview === true);
  const actAsStaff = Boolean(forceOperatorContext || isPreviewMode || !actorMatchesOwner);

  if (actAsStaff) {
    if (actorIsDev) {
      return {
        type: 'dev',
        role: 'dev',
        name: realActor?.name || realActor?.full_name || 'Developer (Dev)',
        email: realActor?.email || ''
      };
    }
    if (actorIsAdmin) {
      return {
        type: 'admin',
        role: actorRole || 'admin',
        name: realActor?.name || realActor?.full_name || 'Admin / Staff',
        email: realActor?.email || ''
      };
    }
  }

  return {
    type: 'user',
    role: 'user',
    name: realActor?.name || realActor?.full_name || getApplicantName(targetReg) || 'เจ้าตัว',
    email: realActor?.email || targetReg?.user_email || ''
  };
}

/**
 * สร้างฟิลด์บันทึกผู้อัปโหลดสำหรับช่องสลิป (payment_slip, installment_1_slip, installment_2_slip, refund_slip)
 */
export function buildSlipUploaderFields(prefix, actorMeta, timestampIso = new Date().toISOString()) {
  if (!prefix || !actorMeta) return {};
  return {
    [`${prefix}_uploaded_by`]: actorMeta.type || 'user',
    [`${prefix}_uploaded_by_role`]: actorMeta.role || actorMeta.type || 'user',
    [`${prefix}_uploaded_by_name`]: actorMeta.name || '',
    [`${prefix}_uploaded_by_email`]: actorMeta.email || '',
    [`${prefix}_uploaded_at`]: timestampIso
  };
}

/**
 * ดึงฟิลด์ผู้อัปโหลดเดิมของช่องสลิปจากอ็อบเจ็กต์ registration เพื่อคงค่าเดิมเมื่อไม่ได้เปลี่ยนรูปสลิป
 */
export function extractSlipUploaderFields(reg, prefix) {
  if (!reg || !prefix) return {};
  return {
    [`${prefix}_uploaded_by`]: reg[`${prefix}_uploaded_by`] || '',
    [`${prefix}_uploaded_by_role`]: reg[`${prefix}_uploaded_by_role`] || '',
    [`${prefix}_uploaded_by_name`]: reg[`${prefix}_uploaded_by_name`] || '',
    [`${prefix}_uploaded_by_email`]: reg[`${prefix}_uploaded_by_email`] || '',
    [`${prefix}_uploaded_at`]: reg[`${prefix}_uploaded_at`] || null
  };
}

/**
 * ล้างข้อมูลผู้อัปโหลดเมื่อลบสลิปออกจากระบบ
 */
export function clearSlipUploaderFields(prefix) {
  if (!prefix) return {};
  return {
    [`${prefix}_uploaded_by`]: '',
    [`${prefix}_uploaded_by_role`]: '',
    [`${prefix}_uploaded_by_name`]: '',
    [`${prefix}_uploaded_by_email`]: '',
    [`${prefix}_uploaded_at`]: null
  };
}

/**
 * ประทับตราข้อมูลผู้อัปโหลดลงในอ็อบเจ็กต์ OCR ของสลิปด้วย
 */
export function stampOcrWithUploader(ocrObj, actorMeta, timestampIso = new Date().toISOString()) {
  if (!actorMeta) return ocrObj || null;
  const base = ocrObj && typeof ocrObj === 'object' ? ocrObj : null;
  if (!base) return null;
  return {
    ...base,
    uploadedByType: actorMeta.type || 'user',
    uploadedByRole: actorMeta.role || actorMeta.type || 'user',
    uploadedByName: actorMeta.name || '',
    uploadedByEmail: actorMeta.email || '',
    uploadedByAt: timestampIso
  };
}

function normalizeUploaderMeta(type, name, email, at, isRecorded = true) {
  const cleanType = String(type || '').trim().toLowerCase();
  if (cleanType === 'dev') {
    return {
      type: 'dev',
      label: '💻 Dev อัปโหลดให้',
      shortLabel: 'Dev อัปโหลด',
      tone: 'cyan',
      actorName: name || '',
      actorEmail: email || '',
      uploadedAt: at || null,
      isRecorded
    };
  }
  if (cleanType === 'admin' || cleanType === 'staff') {
    return {
      type: 'admin',
      label: '🛡️ Admin อัปโหลดให้',
      shortLabel: 'Admin อัปโหลด',
      tone: 'indigo',
      actorName: name || '',
      actorEmail: email || '',
      uploadedAt: at || null,
      isRecorded
    };
  }
  if (cleanType === 'user' || cleanType === 'owner' || cleanType === 'applicant') {
    return {
      type: 'user',
      label: '👤 เจ้าตัวอัปโหลดเอง',
      shortLabel: 'เจ้าตัวอัปโหลดเอง',
      tone: 'emerald',
      actorName: name || '',
      actorEmail: email || '',
      uploadedAt: at || null,
      isRecorded
    };
  }
  return null;
}

/**
 * แปลงข้อมูลผู้อัปโหลดสลิปเพื่อแสดงผลบน UI (รองรับทั้งสลิปใหม่ที่บันทึกผู้ส่ง และสลิปเดิมในระบบ)
 */
export function resolveSlipUploaderDisplay(reg, slotKey = 'full', ocrOverride = null) {
  if (!reg) return null;

  let prefixes = ['payment_slip', 'installment_1_slip'];
  let ocr = ocrOverride || reg.slip_ocr_full || reg.slip_ocr_round1;

  if (slotKey === 'round1') {
    prefixes = ['installment_1_slip', 'payment_slip'];
    ocr = ocrOverride || reg.slip_ocr_round1 || reg.slip_ocr_full;
  } else if (slotKey === 'round2') {
    prefixes = ['installment_2_slip'];
    ocr = ocrOverride || reg.slip_ocr_round2;
  } else if (slotKey === 'refund') {
    prefixes = ['refund_slip'];
    ocr = ocrOverride || null;
  } else if (slotKey === 'legacy') {
    prefixes = ['payment_slip'];
    ocr = ocrOverride || null;
  }

  for (const prefix of prefixes) {
    const type = reg[`${prefix}_uploaded_by`];
    if (type) {
      const normalized = normalizeUploaderMeta(
        type,
        reg[`${prefix}_uploaded_by_name`],
        reg[`${prefix}_uploaded_by_email`],
        reg[`${prefix}_uploaded_at`]
      );
      if (normalized) return normalized;
    }
  }

  if (ocr && ocr.uploadedByType) {
    const normalized = normalizeUploaderMeta(
      ocr.uploadedByType,
      ocr.uploadedByName,
      ocr.uploadedByEmail,
      ocr.uploadedByAt
    );
    if (normalized) return normalized;
  }

  // Fallback ที่ซื่อสัตย์สำหรับสลิปเดิมที่อัปโหลดไว้ก่อนเริ่มระบบบันทึกผู้ส่ง
  return {
    type: 'legacy',
    label: '🕒 สลิปเดิม (ก่อนระบบระบุผู้ส่ง)',
    shortLabel: 'สลิปเดิม (ไม่ได้ระบุ)',
    tone: 'slate',
    actorName: '',
    actorEmail: '',
    uploadedAt: null,
    isRecorded: false
  };
}
