import ExcelJS from 'exceljs';
import {
  isMsuInstitution,
  isStaffRegistration,
  STAFF_SHIRT_FEE,
  getStaffPaymentSummary,
  getRegistrationPaymentResolution,
  computeStaffAndRefundMetrics,
  resolveGender,
  resolveUniversityInfo,
  resolveApplicantMemberType,
  normalizeShirtSize,
  getApplicantMedical,
  getApplicantAllergy,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  resolvePersonFullNameWithTitle,
  resolveStaffRoleType
} from '../data/defaultData';
import { DataService, ensureHostedUrl } from '../supabase';
import { resolveFullAgeDetail } from './ageCalculator';

const FONT_NAME = 'Sarabun';

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

const HEADER_BORDER = {
  top: { style: 'thin', color: { argb: 'FF334155' } },
  left: { style: 'thin', color: { argb: 'FF334155' } },
  bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
  right: { style: 'thin', color: { argb: 'FF334155' } }
};

const TOTAL_BORDER = {
  top: { style: 'medium', color: { argb: 'FF334155' } },
  left: { style: 'thin', color: { argb: 'FF94A3B8' } },
  bottom: { style: 'double', color: { argb: 'FF0F172A' } },
  right: { style: 'thin', color: { argb: 'FF94A3B8' } }
};

/**
 * Resolves first and last name from registration/order records
 */
export function resolveFirstAndLastName(item) {
  if (!item) return { title: '', firstName: '', lastName: '', fullName: '-' };
  const res = resolvePersonFullNameWithTitle(item);
  return {
    title: res.title,
    firstName: res.firstName,
    lastName: res.lastName,
    fullName: res.fullName
  };
}

function resolveGenderRank(gender) {
  if (gender === 'ชาย') return 1;
  if (gender === 'หญิง') return 2;
  return 3;
}

/**
 * Resolves gender consistently for roster/certificate export:
 * prioritizes unambiguous legal Thai honorific titles (นาย / นางสาว / นาง) if stored gender conflicts.
 */
function resolveRosterGender(reg) {
  const { title } = resolveFirstAndLastName(reg);
  const cleanTitle = String(title || reg?.title_th || reg?.title || '').trim();
  if (cleanTitle === 'นางสาว' || cleanTitle === 'นาง' || cleanTitle === 'ว่าที่ร้อยตรีหญิง' || cleanTitle === 'ด.ญ.') {
    return 'หญิง';
  }
  if (cleanTitle === 'นาย' || cleanTitle === 'ว่าที่ร้อยตรี' || cleanTitle === 'ด.ช.') {
    return 'ชาย';
  }
  return resolveGender(reg);
}

/**
 * Deterministic comparator:
 * Optional Role (Participant -> Staff) -> University (มมส -> มข -> อื่นๆ) -> Gender (ชาย -> หญิง) -> ชื่อ -> สกุล
 */
export function compareRegistrationsForRoster(a, b, { separateByRole = false } = {}) {
  if (separateByRole) {
    const roleA = isStaffRegistration(a) ? 2 : 1;
    const roleB = isStaffRegistration(b) ? 2 : 1;
    if (roleA !== roleB) return roleA - roleB;
  }

  const uA = resolveUniversityInfo(a);
  const uB = resolveUniversityInfo(b);
  const oA = uA.orderIndex ?? 99;
  const oB = uB.orderIndex ?? 99;
  if (oA !== oB) return oA - oB;
  if (uA.shortTag !== uB.shortTag) return uA.shortTag.localeCompare(uB.shortTag, 'th');

  const gA = resolveGenderRank(resolveRosterGender(a));
  const gB = resolveGenderRank(resolveRosterGender(b));
  if (gA !== gB) return gA - gB;

  const nA = resolveFirstAndLastName(a);
  const nB = resolveFirstAndLastName(b);
  const fnCmp = (nA.firstName || '').localeCompare(nB.firstName || '', 'th');
  if (fnCmp !== 0) return fnCmp;
  return (nA.lastName || '').localeCompare(nB.lastName || '', 'th');
}

function getColumnLetter(colNumber) {
  let num = colNumber;
  let letters = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters || 'A';
}

function resolveStaffRoleLabel(reg) {
  if (!isStaffRegistration(reg)) return 'ผู้เข้าร่วมอบรม';
  const roleType = resolveStaffRoleType(reg);
  if (roleType === 'dev') return 'Staff (ผู้พัฒนาระบบ / DEV)';
  if (roleType === 'mc') return 'Staff (พิธีกร / MC)';
  if (roleType === 'photographer') return 'Staff (ช่างภาพ)';
  if (roleType === 'committee') return 'Staff (คณะกรรมการดำเนินงาน)';
  return 'Staff (คณะทำงาน)';
}

function resolveAttendanceStatusInfo(reg, payRes) {
  if (payRes?.isRound2CancelledAbsent || reg?.round2_cancelled_absent) {
    return { text: 'ไม่เข้าร่วม (ยกเลิกรอบ 2)', tone: 'absent' };
  }
  if (reg?.attendance_confirmed_status === 'declined' || reg?.status === 'cancelled') {
    return { text: 'แจ้งไม่เข้าร่วม', tone: 'absent' };
  }
  if (reg?.attendance_checked_in) {
    return { text: 'เช็คชื่อเข้าร่วมแล้ว', tone: 'confirmed' };
  }
  if (reg?.attendance_confirmed_status === 'confirmed') {
    return { text: 'ยืนยันเข้าร่วม', tone: 'confirmed' };
  }
  return { text: 'ปกติ (รอเช็คชื่อ)', tone: 'normal' };
}

function resolveNickname(r) {
  if (r.nickname && String(r.nickname).trim()) return String(r.nickname).trim();
  if (r.nickname_th && r.nickname_en) return `${r.nickname_th} / ${r.nickname_en}`;
  return r.nickname_th || r.nickname_en || '-';
}

function setupSheetLayout(sheet, { title, subtitle, columns, bannerColor = 'FF1E293B', headerColor = 'FF0F172A', freezeX = 0 }) {
  const lastCol = getColumnLetter(columns.length);
  const headerRowNum = 4;

  sheet.views = [{
    state: 'frozen',
    ySplit: headerRowNum,
    xSplit: freezeX,
    showGridLines: true
  }];
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));

  // Row 1: Title banner
  sheet.mergeCells(`A1:${lastCol}1`);
  const r1 = sheet.getCell('A1');
  r1.value = title;
  r1.font = { name: FONT_NAME, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  r1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bannerColor } };
  sheet.getRow(1).height = 30;

  // Row 2: Subtitle / stats banner
  sheet.mergeCells(`A2:${lastCol}2`);
  const r2 = sheet.getCell('A2');
  r2.value = subtitle;
  r2.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF1E293B' } };
  r2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sheet.getRow(2).height = 24;

  // Row 3: Clean spacer
  sheet.getRow(3).height = 8;

  // Row 4: Column headers
  const headerRow = sheet.getRow(headerRowNum);
  headerRow.height = 32;
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
    cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = HEADER_BORDER;
  });

  sheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: columns.length }
  };

  return headerRowNum;
}

function estimateRowHeight(row, columns, { minHeight = 25, hasImage = false } = {}) {
  let maxLines = 1;
  columns.forEach((col, idx) => {
    const val = row.getCell(idx + 1).value;
    const text = val && typeof val === 'object' && val.text ? String(val.text) : String(val ?? '');
    if (!text || text === '-') return;
    const usableChars = Math.max(8, Math.floor((col.width || 14) * 0.88));
    const lines = text.split('\n').reduce((sum, segment) => {
      return sum + Math.max(1, Math.ceil(segment.length / usableChars));
    }, 0);
    if (lines > maxLines) maxLines = lines;
  });
  const textHeight = Math.max(minHeight, maxLines * 17 + 8);
  return hasImage ? Math.max(84, textHeight) : textHeight;
}

function applyRowCellStyles(row, columns, rowIdx, customAligns = {}) {
  const zebraBg = rowIdx % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF';
  columns.forEach((col, idx) => {
    const cell = row.getCell(idx + 1);
    const align = customAligns[col.key] || col.align || 'left';
    cell.alignment = {
      vertical: 'middle',
      horizontal: align,
      wrapText: true
    };
    if (!cell.font) {
      cell.font = { name: FONT_NAME, size: 10.5, color: { argb: 'FF0F172A' } };
    }
    if (!cell.fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
    }
    if (col.numFmt) {
      cell.numFmt = col.numFmt;
    }
    cell.border = THIN_BORDER;
  });
}

function styleUniAndGenderBadges(row, uniShort, gender, attendanceTone) {
  const getSafeCell = (key) => (row.worksheet?.getColumnKey?.(key) ? row.getCell(key) : null);

  const uniCell = getSafeCell('uni_short');
  if (uniCell) {
    if (uniShort === 'มมส') {
      uniCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      uniCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: 'FF0369A1' } };
    } else if (uniShort === 'มข') {
      uniCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
      uniCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: 'FF5B21B6' } };
    }
  }

  const genderCell = getSafeCell('gender');
  if (genderCell) {
    if (gender === 'ชาย') {
      genderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      genderCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: 'FF1D4ED8' } };
    } else if (gender === 'หญิง') {
      genderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE7F3' } };
      genderCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: 'FFBE185D' } };
    }
  }

  const attCell = getSafeCell('attendance_status');
  if (attCell) {
    if (attendanceTone === 'absent') {
      attCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
      attCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FFBE123C' } };
    } else if (attendanceTone === 'confirmed') {
      attCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      attCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF047857' } };
    }
  }
}

/**
 * Cleanly extracts base64 string from data URL or raw string
 */
function extractPureBase64(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const base64Index = dataUrl.indexOf(';base64,');
  if (base64Index !== -1) {
    const raw = dataUrl.slice(base64Index + 8).replace(/\s+/g, '');
    return raw || null;
  }
  if (!dataUrl.startsWith('http') && dataUrl.length > 50) {
    return dataUrl.replace(/\s+/g, '');
  }
  return null;
}

/**
 * Determines image format extension for ExcelJS
 */
function getImageExtension(dataUrl, defaultExt = 'jpeg') {
  if (!dataUrl || typeof dataUrl !== 'string') return defaultExt;
  if (dataUrl.includes('image/png') || dataUrl.toLowerCase().endsWith('.png')) return 'png';
  if (dataUrl.includes('image/webp') || dataUrl.toLowerCase().endsWith('.webp')) return 'png';
  if (dataUrl.includes('image/gif') || dataUrl.toLowerCase().endsWith('.gif')) return 'gif';
  return 'jpeg';
}

function buildGroupStatsText(list) {
  const msuMale = list.filter((r) => resolveUniversityInfo(r).shortTag === 'มมส' && resolveRosterGender(r) === 'ชาย').length;
  const msuFemale = list.filter((r) => resolveUniversityInfo(r).shortTag === 'มมส' && resolveRosterGender(r) === 'หญิง').length;
  const kkuMale = list.filter((r) => resolveUniversityInfo(r).shortTag === 'มข' && resolveRosterGender(r) === 'ชาย').length;
  const kkuFemale = list.filter((r) => resolveUniversityInfo(r).shortTag === 'มข' && resolveRosterGender(r) === 'หญิง').length;
  const otherCount = list.length - (msuMale + msuFemale + kkuMale + kkuFemale);
  return `รวม ${list.length} คน | มมส: ชาย ${msuMale} / หญิง ${msuFemale} | มข: ชาย ${kkuMale} / หญิง ${kkuFemale}${otherCount > 0 ? ` | สถาบันอื่น: ${otherCount}` : ''}`;
}

/**
 * Populate Certificate Sheet (สำหรับทำเกียรติบัตร)
 */
function populateCertificateSheet(workbook, sheetName, list, { isStaffSheet = false } = {}) {
  const sheet = workbook.addWorksheet(sheetName);
  const columns = [
    { header: 'ลำดับ', key: 'index', width: 8, align: 'center' },
    { header: 'สังกัด', key: 'uni_short', width: 12, align: 'center' },
    { header: 'เพศ', key: 'gender', width: 10, align: 'center' },
    { header: 'คำนำหน้า', key: 'title', width: 14, align: 'center' },
    { header: 'ชื่อ', key: 'first_name', width: 20, align: 'left' },
    { header: 'สกุล', key: 'last_name', width: 22, align: 'left' },
    { header: 'ชื่อ - สกุล (สำหรับเกียรติบัตร)', key: 'full_name', width: 32, align: 'left' },
    { header: isStaffSheet ? 'บทบาท / ตำแหน่ง Staff' : 'ประเภทผู้รับเกียรติบัตร', key: 'role_label', width: 28, align: 'center' },
    { header: 'นามเรียกขาน / สังกัดหน่วย', key: 'callsign', width: 22, align: 'center' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 14, align: 'center' },
    { header: 'มหาวิทยาลัย / สถาบันเต็ม', key: 'institution', width: 38, align: 'left' },
    { header: 'สถานะเข้าร่วม', key: 'attendance_status', width: 22, align: 'center' }
  ];

  const statsText = buildGroupStatsText(list);
  setupSheetLayout(sheet, {
    title: isStaffSheet
      ? 'รายชื่อ Staff โครงการ JRE 2027 (สำหรับจัดทำเกียรติบัตร)'
      : 'รายชื่อผู้เข้าร่วมอบรม โครงการ JRE 2027 (สำหรับจัดทำเกียรติบัตร)',
    subtitle: `เรียงลำดับ: มมส ➔ มข ➔ สถาบันอื่น | ชาย ➔ หญิง | ชื่อ ➔ สกุล  •  ${statsText}`,
    columns,
    bannerColor: isStaffSheet ? 'FF4C1D95' : 'FF0F766E',
    headerColor: isStaffSheet ? 'FF5B21B6' : 'FF115E59',
    freezeX: 0
  });

  list.forEach((r, idx) => {
    const { title, firstName, lastName, fullName } = resolveFirstAndLastName(r);
    const uniInfo = resolveUniversityInfo(r);
    const gender = resolveRosterGender(r);
    const attInfo = resolveAttendanceStatusInfo(r);

    const row = sheet.addRow({
      index: idx + 1,
      uni_short: uniInfo.shortTag,
      gender,
      title: title || '-',
      first_name: firstName || '-',
      last_name: lastName || '-',
      full_name: fullName || '-',
      role_label: isStaffSheet ? resolveStaffRoleLabel(r) : 'ผู้เข้าร่วมการฝึกอบรม',
      callsign: r.callsign || resolveApplicantMemberType(r).shortLabel || '-',
      nickname: resolveNickname(r),
      institution: uniInfo.university || r.institution || '-',
      attendance_status: attInfo.text
    });

    applyRowCellStyles(row, columns, idx);
    row.getCell('full_name').font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    styleUniAndGenderBadges(row, uniInfo.shortTag, gender, attInfo.tone);
    row.height = estimateRowHeight(row, columns, { minHeight: 25 });
  });

  // Footer total row
  const lastCol = getColumnLetter(columns.length);
  const totalRow = sheet.addRow({ index: `รวมทั้งสิ้น ${list.length} คน (${statsText})` });
  sheet.mergeCells(`A${totalRow.number}:${lastCol}${totalRow.number}`);
  const tCell = totalRow.getCell(1);
  tCell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0F172A' } };
  tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  tCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  for (let c = 1; c <= columns.length; c++) {
    totalRow.getCell(c).border = TOTAL_BORDER;
  }
  totalRow.height = 26;
}

/**
 * Populate Full Detailed Sheet (จัดตารางอ่านง่าย แก้บักเส้นขอบ/ตัดคำ/ความสูงแถว)
 */
async function populateDetailedRosterSheet(
  workbook,
  sheetName,
  list,
  paymentConfig,
  {
    title,
    bannerColor = 'FF1E293B',
    headerColor = 'FF1E293B',
    includeRoleCol = false,
    embedImages = true,
    mediaCache = new Map(),
    onProgress = null,
    progressOffset = 0,
    progressTotal = 0
  } = {}
) {
  const sheet = workbook.addWorksheet(sheetName);
  const columns = [
    { header: 'ลำดับ', key: 'index', width: 7, align: 'center' },
    { header: 'สังกัด', key: 'uni_short', width: 11, align: 'center' },
    { header: 'เพศ', key: 'gender', width: 9, align: 'center' },
    ...(includeRoleCol ? [{ header: 'กลุ่มหลัก', key: 'main_group', width: 14, align: 'center' }] : []),
    { header: 'ประเภท / บทบาท', key: 'role_label', width: 25, align: 'center' },
    { header: 'คำนำหน้า', key: 'title', width: 12, align: 'center' },
    { header: 'ชื่อ', key: 'first_name', width: 18, align: 'left' },
    { header: 'สกุล', key: 'last_name', width: 20, align: 'left' },
    { header: 'ชื่อ - สกุลเต็ม', key: 'full_name', width: 28, align: 'left' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 13, align: 'center' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 19, align: 'center' },
    { header: 'เบอร์โทร', key: 'phone', width: 15, align: 'center' },
    { header: 'สถานะเข้าร่วม', key: 'attendance_status', width: 20, align: 'center' },
    { header: 'ไซส์เสื้อ', key: 'shirt_size', width: 10, align: 'center' },
    { header: 'กลุ่มฝึก', key: 'group_assigned', width: 14, align: 'center' },
    { header: 'ห้องนอน', key: 'room_assigned', width: 15, align: 'center' },
    { header: 'สถานะการชำระเงิน', key: 'payment_status_desc', width: 28, align: 'left' },
    { header: 'ยอดต้องชำระ (บ.)', key: 'total_fee', width: 15, align: 'right', numFmt: '#,##0' },
    { header: 'ชำระแล้ว (บ.)', key: 'paid_amount', width: 14, align: 'right', numFmt: '#,##0' },
    { header: 'ค้างชำระ (บ.)', key: 'remaining_amount', width: 14, align: 'right', numFmt: '#,##0' },
    { header: 'งวด 1 / เต็ม (วันที่-ยอด)', key: 'round1_summary', width: 26, align: 'left' },
    { header: 'งวด 2 / ที่พัก Staff (วันที่-ยอด)', key: 'round2_summary', width: 26, align: 'left' },
    { header: 'โรคประจำตัว / ข้อจำกัด', key: 'medical_history', width: 24, align: 'left' },
    { header: 'แพ้ยา / แพ้อาหาร', key: 'food_allergy', width: 24, align: 'left' },
    { header: 'ดูแลพิเศษ', key: 'special_care', width: 14, align: 'center' },
    { header: 'กรุ๊ปเลือด', key: 'blood_group', width: 11, align: 'center' },
    { header: 'ผู้ติดต่อฉุกเฉิน & เบอร์', key: 'emergency_contact', width: 28, align: 'left' },
    { header: 'รูปบัตร ID Card', key: 'id_card_photo', width: 18, align: 'center' },
    { header: 'สลิปงวด 1', key: 'round1_slip', width: 18, align: 'center' },
    { header: 'สลิปงวด 2', key: 'round2_slip', width: 18, align: 'center' },
    { header: 'สลิปเต็มจำนวน', key: 'full_slip', width: 18, align: 'center' },
    { header: 'สถาบัน / สังกัดหน่วยเต็ม', key: 'institution_unit', width: 34, align: 'left' },
    { header: 'วันเกิด / อายุ', key: 'dob_age', width: 24, align: 'center' },
    { header: 'ประสบการณ์ฝึกอบรม', key: 'previous_training', width: 28, align: 'left' },
    { header: 'อีเมล & หมายเหตุ / เอกสาร', key: 'notes_email', width: 36, align: 'left' }
  ];

  const statsText = buildGroupStatsText(list);
  setupSheetLayout(sheet, {
    title,
    subtitle: `เรียงลำดับ: ${includeRoleCol ? 'ผู้เข้าร่วม ➔ Staff | ' : ''}มมส ➔ มข ➔ สถาบันอื่น | ชาย ➔ หญิง | ชื่อ ➔ สกุล  •  ${statsText}`,
    columns,
    bannerColor,
    headerColor,
    freezeX: 0
  });

  const idCardColIdx = columns.findIndex((c) => c.key === 'id_card_photo') + 1;
  const round1ColIdx = columns.findIndex((c) => c.key === 'round1_slip') + 1;
  const round2ColIdx = columns.findIndex((c) => c.key === 'round2_slip') + 1;
  const fullSlipColIdx = columns.findIndex((c) => c.key === 'full_slip') + 1;

  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (onProgress && progressTotal > 0) {
      onProgress(Math.min(progressTotal, progressOffset + i + 1), progressTotal);
    }

    const { title: personTitle, firstName, lastName, fullName } = resolveFirstAndLastName(r);
    const isStaff = isStaffRegistration(r);
    const staffSum = isStaff ? getStaffPaymentSummary(r) : null;
    const payRes = getRegistrationPaymentResolution(r, paymentConfig);
    const gender = resolveRosterGender(r);
    const uniInfo = resolveUniversityInfo(r);
    const memberType = resolveApplicantMemberType(r);
    const attInfo = resolveAttendanceStatusInfo(r, payRes);

    let paymentStatusDesc = '';
    if (payRes.isRound2CancelledAbsent) {
      paymentStatusDesc = `ไม่เข้าร่วม • ยกเลิกรอบ 2 (${payRes.cancelledNote || '-'})`;
    } else if (payRes.isDeferredPostProject && !payRes.isFullyPaid) {
      paymentStatusDesc = `จ่ายหลังจบโครงการ ฿${payRes.deferredPostProjectAmount}`;
    } else if (isStaff) {
      paymentStatusDesc = staffSum.summaryNote;
    } else if (r.payment_plan === 'installment') {
      if (payRes.isR1Paid && payRes.isR2Paid) paymentStatusDesc = 'ผ่อนชำระ (จ่ายครบแล้ว)';
      else if (payRes.isR1Paid) paymentStatusDesc = 'ผ่อนชำระ (ชำระงวด 1 แล้ว)';
      else if (r.installment_1_status === 'pending_review' || r.installment_2_status === 'pending_review') paymentStatusDesc = 'ผ่อนชำระ (รอตรวจสลิป)';
      else paymentStatusDesc = 'ผ่อนชำระ (ยังไม่ชำระ)';
    } else {
      if (r.payment_status === 'paid') paymentStatusDesc = 'จ่ายครบ (ชำระเต็มจำนวน)';
      else if (r.payment_status === 'pending_review') paymentStatusDesc = 'ชำระเต็ม (รอตรวจสลิป)';
      else paymentStatusDesc = 'ชำระเต็ม (ยังไม่ชำระ)';
    }

    const r1Date = (!isStaff && r.payment_plan === 'installment')
      ? (r.installment_1_slip_date ? new Date(r.installment_1_slip_date).toLocaleDateString('th-TH') : (r.installment_1_status === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'))
      : (r.payment_slip_date ? new Date(r.payment_slip_date).toLocaleDateString('th-TH') : ((r.payment_status === 'paid' || (isStaff && payRes.isR1Paid)) ? 'ชำระแล้ว' : 'ยังไม่ชำระ'));
    const r1Summary = isStaff
      ? `${payRes.isR1Paid ? `โอนจริง ${staffSum.r1SlipAmount || STAFF_SHIRT_FEE} บ.` : 'ค้าง 280 บ.'} (${r1Date})`
      : (r.payment_plan === 'installment' ? `${payRes.round1Fee} บ. (${r1Date})` : `${payRes.effectiveTotalFee} บ. (${r1Date})`);

    let r2Summary = '-';
    if (payRes.isRound2CancelledAbsent) {
      r2Summary = `ยกเลิกรอบ 2 (ตัดจบ ${payRes.waivedRound2Amount} บ.)`;
    } else if (payRes.isDeferredPostProject && !payRes.isFullyPaid) {
      r2Summary = `จ่ายหลังจบโครงการ ${payRes.deferredPostProjectAmount} บ.`;
    } else if (isStaff) {
      if (staffSum.isMsu) r2Summary = 'ไม่มีค่าที่พัก (มมส)';
      else if (staffSum.isAccommodationPaid) r2Summary = `ชำระครบ 200 บ.${r.installment_2_slip_date ? ` (${new Date(r.installment_2_slip_date).toLocaleDateString('th-TH')})` : ''}`;
      else if (staffSum.isOffsetApplied) r2Summary = `หักส่วนเกิน -${staffSum.offsetToAccommodation} บ. (ค้าง ${staffSum.accommodationRemaining} บ.)`;
      else r2Summary = 'ค้างค่าที่พัก 200 บ.';
    } else if (r.payment_plan === 'installment') {
      const r2Date = r.installment_2_slip_date
        ? new Date(r.installment_2_slip_date).toLocaleDateString('th-TH')
        : (payRes.isR2Paid ? 'ชำระแล้ว' : (r.installment_2_status === 'pending_review' ? 'รอตรวจสลิป' : 'ยังไม่ชำระ'));
      r2Summary = `${payRes.round2Fee} บ. (${r2Date})`;
    }

    const emergencyParts = [
      r.emergency_name || '-',
      r.emergency_relation ? `(${r.emergency_relation})` : '',
      r.emergency_phone ? `โทร ${r.emergency_phone}` : ''
    ].filter(Boolean).join(' ');

    const docsText = Array.isArray(r.requested_docs) && r.requested_docs.length > 0
      ? r.requested_docs.map((d) => `${d.title || d.doc_type}: ${d.file_url ? 'แนบแล้ว' : 'รอแนบ'}`).join(', ')
      : '';

    const notesEmail = [
      r.user_email ? `อีเมล: ${r.user_email}` : '',
      r.special_notes && !String(r.special_notes).startsWith('{') && !String(r.special_notes).startsWith('__JSON__:') ? r.special_notes : '',
      r.payment_notes || '',
      docsText ? `เอกสาร: ${docsText}` : ''
    ].filter(Boolean).join(' | ') || '-';

    const rowData = {
      index: i + 1,
      uni_short: uniInfo.shortTag,
      gender,
      ...(includeRoleCol ? { main_group: isStaff ? 'Staff' : 'ผู้เข้าร่วม' } : {}),
      role_label: isStaff ? resolveStaffRoleLabel(r) : `ผู้เข้าอบรม (${memberType.shortLabel})`,
      title: personTitle || '-',
      first_name: firstName || '-',
      last_name: lastName || '-',
      full_name: fullName || '-',
      nickname: resolveNickname(r),
      callsign: r.callsign || '-',
      phone: r.phone || '-',
      attendance_status: attInfo.text,
      shirt_size: normalizeShirtSize(r.shirt_size || 'L'),
      group_assigned: r.group_assigned || 'รอจัดกลุ่ม',
      room_assigned: r.room_assigned || (uniInfo.isMsu && !isStaff ? 'ไป-กลับ (มมส)' : 'รอจัดห้อง'),
      payment_status_desc: paymentStatusDesc,
      total_fee: payRes.effectiveTotalFee,
      paid_amount: payRes.collectedAmount,
      remaining_amount: payRes.remainingAmount,
      round1_summary: r1Summary,
      round2_summary: r2Summary,
      medical_history: getApplicantMedical(r) || 'ไม่มี',
      food_allergy: getApplicantAllergy(r) || 'ไม่มี',
      special_care: r.is_special_care ? 'ดูแลพิเศษ' : 'ปกติ',
      blood_group: r.blood_group || '-',
      emergency_contact: emergencyParts,
      id_card_photo: '',
      round1_slip: '',
      round2_slip: '',
      full_slip: '',
      institution_unit: `${uniInfo.university || r.institution || '-'}${memberType.unitDisplay && memberType.unitDisplay !== '-' ? ` (${memberType.unitDisplay})` : ''}`,
      dob_age: `${r.dob || '-'}\n(${resolveFullAgeDetail(r).formatted})`,
      previous_training: (r.previous_training && r.previous_training.trim() !== '') ? r.previous_training.trim() : 'ไม่มี',
      notes_email: notesEmail
    };

    const addedRow = sheet.addRow(rowData);
    const currentRowIdx = addedRow.number;

    applyRowCellStyles(addedRow, columns, i);
    addedRow.getCell('full_name').font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    styleUniAndGenderBadges(addedRow, uniInfo.shortTag, gender, attInfo.tone);

    if (includeRoleCol) {
      const mgCell = addedRow.getCell('main_group');
      if (isStaff) {
        mgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
        mgCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF6B21A8' } };
      } else {
        mgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
        mgCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF0F766E' } };
      }
    }

    if (payRes.remainingAmount > 0) {
      const remCell = addedRow.getCell('remaining_amount');
      remCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      remCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: 'FF92400E' } };
    }

    if (hasFoodOrDrugAllergy(r)) {
      const foodCell = addedRow.getCell('food_allergy');
      foodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      foodCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF92400E' } };
    }
    if (hasMedicalCondition(r)) {
      const medCell = addedRow.getCell('medical_history');
      medCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
      medCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF9F1239' } };
    }
    if (r.is_special_care) {
      const spCell = addedRow.getCell('special_care');
      spCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
      spCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF6B21A8' } };
    }

    let hasEmbeddedImage = false;
    const attachMediaCell = async (rawUrl, colIdx, label) => {
      const cell = addedRow.getCell(colIdx);
      if (!rawUrl) {
        cell.value = '-';
        return;
      }

      let cached = mediaCache.get(rawUrl);
      if (!cached) {
        const hostedUrl = await ensureHostedUrl(rawUrl, `${label}.jpg`);
        let imageId = null;
        if (embedImages) {
          try {
            const base64Data = await DataService.getFileBase64(rawUrl);
            const pureBase64 = extractPureBase64(base64Data);
            if (pureBase64) {
              const extension = getImageExtension(base64Data);
              imageId = workbook.addImage({ base64: pureBase64, extension });
            }
          } catch (e) {
            console.warn('Excel image embedding notice:', e);
          }
        }
        cached = { hostedUrl, imageId };
        mediaCache.set(rawUrl, cached);
      }

      if (cached.imageId !== null && cached.imageId !== undefined) {
        sheet.addImage(cached.imageId, {
          tl: { col: colIdx - 1 + 0.16, row: currentRowIdx - 1 + 0.06 },
          ext: { width: 74, height: 74 },
          editAs: 'oneCell'
        });
        hasEmbeddedImage = true;
      }

      if (cached.hostedUrl && cached.hostedUrl.startsWith('http')) {
        cell.value = {
          text: 'ดูรูป',
          hyperlink: cached.hostedUrl,
          tooltip: `คลิกเพื่อเปิดดู ${label} ขนาดเต็ม`
        };
        cell.font = { name: FONT_NAME, size: 9, color: { argb: 'FF0284C7' }, underline: true };
        cell.alignment = { vertical: 'bottom', horizontal: 'center' };
      } else {
        cell.value = 'มีไฟล์';
      }
    };

    await attachMediaCell(r.id_card_photo, idCardColIdx, 'รูปถ่าย ID Card');
    await attachMediaCell(r.installment_1_slip_url, round1ColIdx, 'สลิปงวด 1');
    await attachMediaCell(r.installment_2_slip_url, round2ColIdx, 'สลิปงวด 2');
    await attachMediaCell(r.payment_slip_url, fullSlipColIdx, 'สลิปเต็มจำนวน');

    addedRow.height = estimateRowHeight(addedRow, columns, { minHeight: 26, hasImage: hasEmbeddedImage });
  }
}

/**
 * Populate Summary Sheet (สรุปแยกมหาลัย-ชายหญิง-เสื้อ)
 */
function populateSummarySheet(workbook, sortedAll) {
  const SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'];
  const columns = [
    { header: 'มหาวิทยาลัย / สถาบัน', key: 'uni_label', width: 34, align: 'left' },
    { header: 'ตัวย่อ', key: 'uni_short', width: 12, align: 'center' },
    { header: 'รวมคน', key: 'total_people', width: 10, align: 'right', numFmt: '#,##0' },
    { header: 'ชมรม (นามเรียกขาน)', key: 'club_members', width: 16, align: 'right', numFmt: '#,##0' },
    { header: 'อาสา (นิสิตทั่วไป)', key: 'volunteers', width: 16, align: 'right', numFmt: '#,##0' },
    { header: 'ชาย', key: 'male', width: 10, align: 'right', numFmt: '#,##0' },
    { header: 'หญิง', key: 'female', width: 10, align: 'right', numFmt: '#,##0' },
    { header: 'ไม่ระบุเพศ', key: 'unknown_gender', width: 12, align: 'right', numFmt: '#,##0' },
    { header: 'ผู้เข้าร่วม', key: 'regular', width: 12, align: 'right', numFmt: '#,##0' },
    { header: 'Staff', key: 'staff', width: 10, align: 'right', numFmt: '#,##0' },
    { header: 'รวมเสื้อ', key: 'total_shirts', width: 11, align: 'right', numFmt: '#,##0' },
    ...SIZES.map((sz) => ({ header: sz, key: `sz_${sz}`, width: 8, align: 'right', numFmt: '#,##0' }))
  ];

  const sheet = workbook.addWorksheet('สรุปแยกมหาลัย-ชายหญิง-เสื้อ');
  setupSheetLayout(sheet, {
    title: 'ตารางสรุปจำนวนผู้เข้าร่วมและ Staff โครงการ JRE 2027 แยกตามสถาบัน เพศ และไซส์เสื้อ',
    subtitle: `เรียงลำดับสถาบันตามมาตรฐานโครงการ (มมส ➔ มข ➔ สถาบันอื่น)  •  รวมทั้งหมด ${sortedAll.length} คน`,
    columns,
    bannerColor: 'FF1E1B4B',
    headerColor: 'FF312E81',
    freezeX: 0
  });

  const uniMap = {};
  sortedAll.forEach((r) => {
    const u = resolveUniversityInfo(r);
    if (!uniMap[u.key]) {
      uniMap[u.key] = {
        orderIndex: u.orderIndex ?? 99,
        uni_label: u.label,
        uni_short: u.shortTag,
        total_people: 0,
        club_members: 0,
        volunteers: 0,
        male: 0,
        female: 0,
        unknown_gender: 0,
        regular: 0,
        staff: 0,
        total_shirts: 0,
        sizes: SIZES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {})
      };
    }
    const entry = uniMap[u.key];
    entry.total_people += 1;
    if (resolveApplicantMemberType(r).isClubMember) entry.club_members += 1;
    else entry.volunteers += 1;

    const g = resolveRosterGender(r);
    if (g === 'ชาย') entry.male += 1;
    else if (g === 'หญิง') entry.female += 1;
    else entry.unknown_gender += 1;

    if (isStaffRegistration(r)) entry.staff += 1;
    else entry.regular += 1;

    const rawSz = normalizeShirtSize(r.shirt_size || 'L');
    const bucket = SIZES.includes(rawSz) ? rawSz : 'อื่นๆ';
    entry.sizes[bucket] = (entry.sizes[bucket] || 0) + 1;
    entry.total_shirts += 1;
  });

  const uniList = Object.values(uniMap).sort((a, b) => a.orderIndex - b.orderIndex || a.uni_short.localeCompare(b.uni_short, 'th'));

  const totals = {
    uni_label: 'รวมทั้งหมดทุกสถาบัน',
    uni_short: 'รวม',
    total_people: 0,
    club_members: 0,
    volunteers: 0,
    male: 0,
    female: 0,
    unknown_gender: 0,
    regular: 0,
    staff: 0,
    total_shirts: 0
  };
  SIZES.forEach((sz) => { totals[`sz_${sz}`] = 0; });

  uniList.forEach((u, idx) => {
    const rowObj = {
      uni_label: u.uni_label,
      uni_short: u.uni_short,
      total_people: u.total_people,
      club_members: u.club_members,
      volunteers: u.volunteers,
      male: u.male,
      female: u.female,
      unknown_gender: u.unknown_gender,
      regular: u.regular,
      staff: u.staff,
      total_shirts: u.total_shirts
    };
    totals.total_people += u.total_people;
    totals.club_members += u.club_members;
    totals.volunteers += u.volunteers;
    totals.male += u.male;
    totals.female += u.female;
    totals.unknown_gender += u.unknown_gender;
    totals.regular += u.regular;
    totals.staff += u.staff;
    totals.total_shirts += u.total_shirts;

    SIZES.forEach((sz) => {
      const cnt = u.sizes[sz] || 0;
      rowObj[`sz_${sz}`] = cnt;
      totals[`sz_${sz}`] += cnt;
    });

    const row = sheet.addRow(rowObj);
    applyRowCellStyles(row, columns, idx);
    row.getCell('uni_short').font = { name: FONT_NAME, size: 10.5, bold: true };
    row.getCell('total_people').font = { name: FONT_NAME, size: 10.5, bold: true };
    row.height = 25;
  });

  const totalRow = sheet.addRow(totals);
  columns.forEach((col, idx) => {
    const cell = totalRow.getCell(idx + 1);
    cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { vertical: 'middle', horizontal: col.align || 'left' };
    if (col.numFmt) cell.numFmt = col.numFmt;
    cell.border = TOTAL_BORDER;
  });
  totalRow.height = 28;
}

/**
 * Populate Staff Accommodation & Refund Sheet (แก้บั๊ก freeze pane และข้อความล้นแบนเนอร์แล้ว)
 */
function populateStaffAccomRefundSheet(workbook, sortedStaff) {
  const staffMetrics = computeStaffAndRefundMetrics(sortedStaff);
  const columns = [
    { header: 'ลำดับ', key: 'idx', width: 8, align: 'center' },
    { header: 'สังกัด', key: 'uni_short', width: 12, align: 'center' },
    { header: 'เพศ', key: 'gender', width: 10, align: 'center' },
    { header: 'ชื่อ - สกุล Staff', key: 'full_name', width: 28, align: 'left' },
    { header: 'เกณฑ์ค่าใช้จ่าย Staff', key: 'staff_tier', width: 32, align: 'left' },
    { header: 'ค่าเสื้อ (บ.)', key: 'shirt_fee', width: 13, align: 'right', numFmt: '#,##0' },
    { header: 'ค่าที่พัก (บ.)', key: 'accom_fee', width: 13, align: 'right', numFmt: '#,##0' },
    { header: 'รวมต้องจ่าย (บ.)', key: 'total_fee', width: 15, align: 'right', numFmt: '#,##0' },
    { header: 'โอนมาจริง (บ.)', key: 'actual_paid', width: 15, align: 'right', numFmt: '#,##0' },
    { header: 'หักลบส่วนเกินเข้าที่พัก', key: 'offset_accom', width: 20, align: 'right', numFmt: '#,##0' },
    { header: 'ค้างค่าที่พัก (บ.)', key: 'accom_rem', width: 16, align: 'right', numFmt: '#,##0' },
    { header: 'ยอดต้องโอนคืน (บ.)', key: 'refund_amt', width: 18, align: 'right', numFmt: '#,##0' },
    { header: 'สถานะโอนคืน', key: 'refund_status', width: 18, align: 'center' },
    { header: 'หมายเหตุสรุปรายบุคคล', key: 'note', width: 46, align: 'left' }
  ];

  const sheet = workbook.addWorksheet('สรุปค่าที่พักStaffและโอนคืน');
  const summaryLine =
    `Staff ทั้งหมด ${staffMetrics.allStaff.length} คน (มมส ${staffMetrics.msuStaff.length} คน [280 บ.] • ต่างสถาบัน ${staffMetrics.externalStaff.length} คน [480 บ.])` +
    ` | หักลบส่วนเกินเข้าที่พักแล้ว ${staffMetrics.externalStaffOffsetList.length} คน (${staffMetrics.externalStaffTotalOffsetAmount} บ.)` +
    ` | ค้างค่าที่พัก ${staffMetrics.externalStaffUnpaidAccomList.length} คน (${staffMetrics.externalStaffUnpaidAccomAmount} บ.)` +
    ` | ต้องโอนคืนทั้งหมด ${staffMetrics.totalRefundPeopleCount} คน (${staffMetrics.totalRefundAmount} บ. • คืนแล้ว ${staffMetrics.refundedAmount} บ. / รอคืน ${staffMetrics.pendingRefundAmount} บ.)`;

  setupSheetLayout(sheet, {
    title: 'สรุปค่าเสื้อ ค่าที่พัก Staff และยอดโอนคืน (เรียง มมส ➔ มข | ชาย ➔ หญิง | ชื่อ ➔ สกุล)',
    subtitle: summaryLine,
    columns,
    bannerColor: 'FF4C1D95',
    headerColor: 'FF5B21B6',
    freezeX: 0
  });
  sheet.getRow(2).height = 34;

  const totals = {
    idx: '',
    uni_short: 'รวม',
    gender: '',
    full_name: `รวม Staff ทั้งหมด ${staffMetrics.allStaff.length} คน`,
    staff_tier: '',
    shirt_fee: 0,
    accom_fee: 0,
    total_fee: 0,
    actual_paid: 0,
    offset_accom: 0,
    accom_rem: 0,
    refund_amt: 0,
    refund_status: '',
    note: ''
  };

  staffMetrics.allStaff.forEach(({ reg: sr, summary: ss }, sIdx) => {
    const pName = resolvePersonFullNameWithTitle(sr).fullName;
    const uShort = resolveUniversityInfo(sr).shortTag;
    const gender = resolveRosterGender(sr);
    const actualPaid = (ss.r1SlipAmount || STAFF_SHIRT_FEE) + ss.r2SlipAmount;

    totals.shirt_fee += ss.shirtFee;
    totals.accom_fee += ss.accommodationFee;
    totals.total_fee += ss.totalStaffFee;
    totals.actual_paid += actualPaid;
    totals.offset_accom += ss.offsetToAccommodation;
    totals.accom_rem += ss.accommodationRemaining;
    totals.refund_amt += ss.overpaidAmount;

    const row = sheet.addRow({
      idx: sIdx + 1,
      uni_short: uShort,
      gender,
      full_name: pName,
      staff_tier: ss.isMsu ? 'Staff มมส (ค่าเสื้อ 280 บ.)' : 'Staff ต่างสถาบัน (เสื้อ 280 + ที่พัก 200 = 480 บ.)',
      shirt_fee: ss.shirtFee,
      accom_fee: ss.accommodationFee,
      total_fee: ss.totalStaffFee,
      actual_paid: actualPaid,
      offset_accom: ss.offsetToAccommodation,
      accom_rem: ss.accommodationRemaining,
      refund_amt: ss.overpaidAmount,
      refund_status: ss.overpaidAmount > 0 ? (ss.isRefunded ? 'โอนคืนแล้ว' : 'รอโอนคืน') : 'ไม่ต้องโอนคืน',
      note: ss.summaryNote
    });

    applyRowCellStyles(row, columns, sIdx);
    row.getCell('full_name').font = { name: FONT_NAME, size: 10.5, bold: true };
    styleUniAndGenderBadges(row, uShort, gender, 'normal');

    if (ss.overpaidAmount > 0 && !ss.isRefunded) {
      const refCell = row.getCell('refund_status');
      refCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      refCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF92400E' } };
    } else if (ss.overpaidAmount > 0 && ss.isRefunded) {
      const refCell = row.getCell('refund_status');
      refCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      refCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FF047857' } };
    }

    row.height = estimateRowHeight(row, columns, { minHeight: 25 });
  });

  const totalRow = sheet.addRow(totals);
  columns.forEach((col, idx) => {
    const cell = totalRow.getCell(idx + 1);
    cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { vertical: 'middle', horizontal: col.align || 'left' };
    if (col.numFmt) cell.numFmt = col.numFmt;
    cell.border = TOTAL_BORDER;
  });
  totalRow.height = 28;
}

/**
 * Builds the Certificate-only ExcelJS Workbook (แยก ผู้เข้าร่วม และ Staff เรียง มมส -> มข | ชาย -> หญิง | ชื่อ -> สกุล)
 */
export async function buildCertificateWorkbook(registrations) {
  if (!registrations || registrations.length === 0) {
    throw new Error('ไม่พบข้อมูลผู้สมัครในระบบสำหรับส่งออก');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JRE 2027 Admin Console • JRE DEV';
  workbook.lastModifiedBy = 'JRE 2027 Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sortedParticipants = registrations
    .filter((r) => !isStaffRegistration(r))
    .sort((a, b) => compareRegistrationsForRoster(a, b));

  const sortedStaff = registrations
    .filter((r) => isStaffRegistration(r))
    .sort((a, b) => compareRegistrationsForRoster(a, b));

  populateCertificateSheet(workbook, 'เกียรติบัตร_ผู้เข้าร่วม', sortedParticipants, { isStaffSheet: false });
  populateCertificateSheet(workbook, 'เกียรติบัตร_Staff', sortedStaff, { isStaffSheet: true });

  // Summary Breakdown Sheet
  const summarySheet = workbook.addWorksheet('สรุปจำนวนเกียรติบัตร');
  const sumCols = [
    { header: 'กลุ่มหลัก', key: 'group', width: 22, align: 'left' },
    { header: 'สังกัด', key: 'uni', width: 16, align: 'center' },
    { header: 'ชาย (คน)', key: 'male', width: 14, align: 'right', numFmt: '#,##0' },
    { header: 'หญิง (คน)', key: 'female', width: 14, align: 'right', numFmt: '#,##0' },
    { header: 'ไม่ระบุเพศ', key: 'unknown', width: 14, align: 'right', numFmt: '#,##0' },
    { header: 'รวมทั้งหมด (คน)', key: 'total', width: 18, align: 'right', numFmt: '#,##0' }
  ];
  setupSheetLayout(summarySheet, {
    title: 'สรุปจำนวนรายชื่อสำหรับจัดทำเกียรติบัตร โครงการ JRE 2027',
    subtitle: `ผู้เข้าร่วม ${sortedParticipants.length} คน • Staff ${sortedStaff.length} คน • รวมทั้งหมด ${registrations.length} คน`,
    columns: sumCols,
    bannerColor: 'FF1E293B',
    headerColor: 'FF334155',
    freezeX: 0
  });

  const buildBucketRows = (groupLabel, list) => {
    const map = {};
    list.forEach((r) => {
      const u = resolveUniversityInfo(r);
      if (!map[u.shortTag]) {
        map[u.shortTag] = { orderIndex: u.orderIndex ?? 99, group: groupLabel, uni: u.shortTag, male: 0, female: 0, unknown: 0, total: 0 };
      }
      const g = resolveRosterGender(r);
      if (g === 'ชาย') map[u.shortTag].male += 1;
      else if (g === 'หญิง') map[u.shortTag].female += 1;
      else map[u.shortTag].unknown += 1;
      map[u.shortTag].total += 1;
    });
    return Object.values(map).sort((a, b) => a.orderIndex - b.orderIndex || a.uni.localeCompare(b.uni, 'th'));
  };

  const sumRows = [
    ...buildBucketRows('ผู้เข้าร่วมอบรม', sortedParticipants),
    ...buildBucketRows('Staff คณะทำงาน', sortedStaff)
  ];

  const grand = { group: 'รวมทั้งหมด (ผู้เข้าร่วม + Staff)', uni: 'ทุกสถาบัน', male: 0, female: 0, unknown: 0, total: 0 };
  sumRows.forEach((item, idx) => {
    grand.male += item.male;
    grand.female += item.female;
    grand.unknown += item.unknown;
    grand.total += item.total;
    const r = summarySheet.addRow(item);
    applyRowCellStyles(r, sumCols, idx);
    r.height = 25;
  });

  const gRow = summarySheet.addRow(grand);
  sumCols.forEach((col, idx) => {
    const cell = gRow.getCell(idx + 1);
    cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { vertical: 'middle', horizontal: col.align || 'left' };
    if (col.numFmt) cell.numFmt = col.numFmt;
    cell.border = TOTAL_BORDER;
  });
  gRow.height = 28;

  return workbook;
}

/**
 * Exports clean Certificate Excel (.xlsx) separated into Participants and Staff
 */
export async function exportCertificateListToExcel(registrations) {
  const workbook = await buildCertificateWorkbook(registrations);
  const fileName = `JRE2027_รายชื่อเกียรติบัตร_ผู้เข้าร่วม_Staff_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await triggerWorkbookDownload(workbook, fileName);
  return fileName;
}

/**
 * Builds the complete, bug-free, readable multi-sheet Workbook for all registrations
 */
export async function buildRegistrationsWorkbook(registrations, paymentConfig, { onProgress = null, embedImages = true } = {}) {
  if (!registrations || registrations.length === 0) {
    throw new Error('ไม่พบข้อมูลผู้สมัครในระบบสำหรับส่งออก');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JRE 2027 Admin Console • JRE DEV';
  workbook.lastModifiedBy = 'JRE 2027 Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Strictly sorted lists: มมส -> มข -> อื่นๆ | ชาย -> หญิง | ชื่อ -> สกุล
  const sortedParticipants = registrations
    .filter((r) => !isStaffRegistration(r))
    .sort((a, b) => compareRegistrationsForRoster(a, b));

  const sortedStaff = registrations
    .filter((r) => isStaffRegistration(r))
    .sort((a, b) => compareRegistrationsForRoster(a, b));

  const sortedAll = [...sortedParticipants, ...sortedStaff];

  // Sheets 1 & 2: Clean Certificate Lists first for immediate access
  populateCertificateSheet(workbook, 'เกียรติบัตร_ผู้เข้าร่วม', sortedParticipants, { isStaffSheet: false });
  populateCertificateSheet(workbook, 'เกียรติบัตร_Staff', sortedStaff, { isStaffSheet: true });

  // Cache images across sheets so each URL is fetched/embedded at most once
  const mediaCache = new Map();
  const totalSteps = sortedParticipants.length + sortedStaff.length;

  // Sheet 3: Participants Full Details
  await populateDetailedRosterSheet(workbook, 'ผู้เข้าร่วม_ข้อมูลครบ', sortedParticipants, paymentConfig, {
    title: 'ทะเบียนข้อมูลผู้เข้าร่วมอบรมทั้งหมด — โครงการ JRE 2027',
    bannerColor: 'FF0F766E',
    headerColor: 'FF115E59',
    includeRoleCol: false,
    embedImages,
    mediaCache,
    onProgress,
    progressOffset: 0,
    progressTotal: totalSteps
  });

  // Sheet 4: Staff Full Details
  await populateDetailedRosterSheet(workbook, 'Staff_ข้อมูลครบ', sortedStaff, paymentConfig, {
    title: 'ทะเบียนข้อมูล Staff และคณะกรรมการดำเนินงานทั้งหมด — โครงการ JRE 2027',
    bannerColor: 'FF4C1D95',
    headerColor: 'FF5B21B6',
    includeRoleCol: false,
    embedImages,
    mediaCache,
    onProgress,
    progressOffset: sortedParticipants.length,
    progressTotal: totalSteps
  });

  // Sheet 5: Combined Everyone (Participants -> Staff, reusing mediaCache with zero extra fetches!)
  await populateDetailedRosterSheet(workbook, 'รวมทุกคน_จัดเรียงใหม่', sortedAll, paymentConfig, {
    title: 'ทะเบียนข้อมูลผู้สมัครทุกคน (รวมผู้เข้าร่วม + Staff) — โครงการ JRE 2027',
    bannerColor: 'FF1E293B',
    headerColor: 'FF0F172A',
    includeRoleCol: true,
    embedImages,
    mediaCache,
    onProgress: null
  });

  // Sheet 6: University × Gender × Shirt Summary
  populateSummarySheet(workbook, sortedAll);

  // Sheet 7: Staff Accommodation & Refund Summary
  populateStaffAccomRefundSheet(workbook, sortedStaff);

  return workbook;
}

async function triggerWorkbookDownload(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Exports all registrations to Excel (.xlsx) with clean tables, proper sorting, certificate tabs & embedded images
 */
export async function exportRegistrationsToExcel(registrations, paymentConfig, onProgress) {
  const workbook = await buildRegistrationsWorkbook(registrations, paymentConfig, {
    onProgress,
    embedImages: true
  });
  const fileName = `JRE2027_ข้อมูลผู้สมัครทุกคน_จัดตารางใหม่_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await triggerWorkbookDownload(workbook, fileName);
  return fileName;
}

/**
 * Exports merchandise & trainee shirt orders to Excel (.xlsx) with embedded slip images
 */
export async function exportMerchandiseOrdersToExcel(items, onProgress) {
  if (!items || items.length === 0) {
    throw new Error('ไม่พบข้อมูลรายการเสื้อหรือคำสั่งซื้อสำหรับส่งออก');
  }

  const sortedItems = [...items].sort((a, b) => compareRegistrationsForRoster(a.rawRegistration || a, b.rawRegistration || b, { separateByRole: true }));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JRE 2027 Admin Console • JRE DEV';
  workbook.lastModifiedBy = 'JRE 2027 Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('รายการส่งมอบเสื้อ JRE 2027');
  const columns = [
    { header: 'ลำดับ', key: 'index', width: 7, align: 'center' },
    { header: 'สังกัด', key: 'uni_short', width: 12, align: 'center' },
    { header: 'เพศ', key: 'gender', width: 10, align: 'center' },
    { header: 'ประเภทผู้รับ', key: 'role_label', width: 20, align: 'center' },
    { header: 'คำนำหน้า', key: 'title', width: 12, align: 'center' },
    { header: 'ชื่อ', key: 'first_name', width: 18, align: 'left' },
    { header: 'สกุล', key: 'last_name', width: 18, align: 'left' },
    { header: 'เบอร์โทร', key: 'phone', width: 15, align: 'center' },
    { header: 'หน่วยงาน / สถาบันเต็ม', key: 'institution', width: 30, align: 'left' },
    { header: 'ไซส์เสื้อ', key: 'shirt_size', width: 11, align: 'center' },
    { header: 'รหัสนามเรียกขาน', key: 'callsign', width: 17, align: 'center' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 13, align: 'center' },
    { header: 'ประเภทรายการ', key: 'source_label', width: 18, align: 'center' },
    { header: 'รหัสออเดอร์', key: 'order_number', width: 20, align: 'center' },
    { header: 'รายละเอียดสินค้า', key: 'items_summary', width: 32, align: 'left' },
    { header: 'ยอดรวม (บ.)', key: 'total_amount', width: 14, align: 'right', numFmt: '#,##0' },
    { header: 'สถานะชำระเงิน', key: 'payment_status', width: 18, align: 'center' },
    { header: 'รูปสลิปโอนเงิน', key: 'slip_image', width: 18, align: 'center' },
    { header: 'สถานะส่งมอบเสื้อ', key: 'delivery_status', width: 18, align: 'center' },
    { header: 'วันเวลาที่ส่งมอบ', key: 'pickup_at', width: 20, align: 'center' },
    { header: 'กลุ่มฝึก', key: 'group_assigned', width: 14, align: 'center' },
    { header: 'ห้องนอน', key: 'room_assigned', width: 15, align: 'center' },
    { header: 'อีเมล', key: 'email', width: 28, align: 'left' }
  ];

  setupSheetLayout(worksheet, {
    title: 'รายการส่งมอบเสื้อและคำสั่งซื้อสินค้า — โครงการ JRE 2027',
    subtitle: `เรียงลำดับ: ผู้เข้าร่วม ➔ Staff | มมส ➔ มข ➔ สถาบันอื่น | ชาย ➔ หญิง | ชื่อ ➔ สกุล  •  รวม ${sortedItems.length} รายการ`,
    columns,
    bannerColor: 'FF581C87',
    headerColor: 'FF6B21A8',
    freezeX: 0
  });

  const slipColIdx = columns.findIndex((c) => c.key === 'slip_image') + 1;

  for (let i = 0; i < sortedItems.length; i++) {
    const it = sortedItems[i];
    if (onProgress) {
      onProgress(i + 1, sortedItems.length);
    }

    const { title, firstName, lastName } = resolveFirstAndLastName(it);
    const isReg = it.source === 'registration' || it.itemType === 'registration';
    const isReceived = it.pickup_status === 'received';
    const isPaid = it.payment_status === 'paid_verified' || it.payment_status === 'paid';
    const uniInfo = resolveUniversityInfo(it.rawRegistration || it);
    const gender = resolveRosterGender(it.rawRegistration || it) || it.gender;
    const isStaff = it.is_staff !== undefined ? it.is_staff : isStaffRegistration(it.rawRegistration || it);

    const itemsSummary = Array.isArray(it.items) && it.items.length > 0
      ? it.items.map((p) => `${p.product_name || 'เสื้อ'} (ไซส์ ${p.size || it.shirt_size || it.size}) x${p.quantity || 1}`).join(', ')
      : `เสื้อปฏิบัติการกู้ภัย JRE 2027 (ไซส์ ${it.shirt_size || it.size || 'L'}) x1`;

    const rowData = {
      index: i + 1,
      uni_short: it.uni_short || uniInfo.shortTag,
      gender,
      role_label: isStaff ? 'Staff (ค่าเสื้อ 280 บ.)' : (isReg ? 'ผู้เข้าอบรมปกติ' : 'สั่งซื้อหน้าร้าน'),
      title: title || '-',
      first_name: firstName || '-',
      last_name: lastName || '-',
      phone: it.customer_phone || it.phone || '-',
      institution: it.institution || '-',
      shirt_size: it.shirt_size || it.size || 'L',
      callsign: it.callsign || '-',
      nickname: it.nickname || '-',
      source_label: isReg ? 'เสื้อฝึกในใบสมัคร' : 'สั่งซื้อหน้าร้าน',
      order_number: it.order_number || `ORD-${(it.id || '').slice(0, 8)}`,
      items_summary: itemsSummary,
      total_amount: Number(it.total_amount || 0),
      payment_status: isPaid ? 'ชำระแล้ว (อนุมัติ)' : (it.payment_status === 'pending_verification' ? 'รอตรวจสลิป' : 'ค้างชำระ'),
      slip_image: '',
      delivery_status: isReceived ? 'ส่งมอบแล้ว' : 'รอส่งมอบ (รอรับ)',
      pickup_at: it.pickup_at ? new Date(it.pickup_at).toLocaleString('th-TH') : '-',
      group_assigned: it.group_assigned || 'ยังไม่จัดสรร',
      room_assigned: it.room_assigned || 'ยังไม่จัดสรร',
      email: it.user_email || '-'
    };

    const addedRow = worksheet.addRow(rowData);
    const currentRowIdx = addedRow.number;
    applyRowCellStyles(addedRow, columns, i);
    styleUniAndGenderBadges(addedRow, rowData.uni_short, gender, 'normal');

    let hasEmbeddedImage = false;
    if (it.slip_url) {
      const hostedUrl = await ensureHostedUrl(it.slip_url, `slip-${it.order_number || 'shirt'}.jpg`);
      const cell = addedRow.getCell(slipColIdx);

      const base64Data = await DataService.getFileBase64(it.slip_url);
      const pureBase64 = extractPureBase64(base64Data);

      if (pureBase64) {
        try {
          const extension = getImageExtension(base64Data);
          const imageId = workbook.addImage({ base64: pureBase64, extension });

          worksheet.addImage(imageId, {
            tl: { col: slipColIdx - 1 + 0.16, row: currentRowIdx - 1 + 0.06 },
            ext: { width: 74, height: 74 },
            editAs: 'oneCell'
          });
          hasEmbeddedImage = true;
        } catch (e) {
          console.warn('Shirt order slip image embedding notice:', e);
        }
      }

      cell.value = {
        text: 'ดูรูปสลิป',
        hyperlink: hostedUrl,
        tooltip: 'คลิกเพื่อเปิดดูรูปสลิปขนาดเต็มในเบราว์เซอร์'
      };
      cell.font = { name: FONT_NAME, color: { argb: 'FF0284C7' }, underline: true, size: 9 };
      cell.alignment = { vertical: 'bottom', horizontal: 'center' };
    } else {
      addedRow.getCell(slipColIdx).value = 'ไม่มีสลิป';
    }

    addedRow.height = estimateRowHeight(addedRow, columns, { minHeight: 25, hasImage: hasEmbeddedImage });
  }

  const fileName = `JRE2027_รายการส่งมอบเสื้อทุกคน_พร้อมรูปสลิป_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await triggerWorkbookDownload(workbook, fileName);
  return fileName;
}
