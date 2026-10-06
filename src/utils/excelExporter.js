import ExcelJS from 'exceljs';
import { isMsuInstitution } from '../data/defaultData';
import { DataService, ensureHostedUrl } from '../supabase';

const THAI_HONORIFIC_TITLES = [
  'นาย', 'นางสาว', 'นาง', 'ด.ช.', 'ด.ญ.', 'ว่าที่ ร.ต.', 'ว่าที่ร้อยตรี',
  'นพ.', 'พญ.', 'ทพ.', 'ภก.', 'ส.ต.ต.', 'ส.ต.ท.', 'ส.ต.อ.', 'ร.ต.ต.',
  'ร.ต.ท.', 'ร.ต.อ.', 'พ.ต.ต.', 'พ.ต.ท.', 'พ.ต.อ.', 'พล.ต.ต.',
  'Mr.', 'Ms.', 'Mrs.', 'Dr.'
];

/**
 * Resolves first and last name from registration/order records
 */
export function resolveFirstAndLastName(item) {
  if (!item) return { firstName: '', lastName: '' };
  let firstName = (item.first_name || item.first_name_th || item.rawRegistration?.first_name || item.rawRegistration?.first_name_th || '').trim();
  let lastName = (item.last_name || item.last_name_th || item.rawRegistration?.last_name || item.rawRegistration?.last_name_th || '').trim();
  if (firstName || lastName) return { firstName, lastName };

  let raw = (item.customer_name || item.full_name_affiliation || item.rawRegistration?.full_name_affiliation || '').trim();
  if (!raw) return { firstName: '', lastName: '' };

  let clean = raw.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
  for (const t of THAI_HONORIFIC_TITLES) {
    if (clean.startsWith(t)) {
      clean = clean.slice(t.length).trim();
      break;
    }
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  } else if (parts.length === 1) {
    firstName = parts[0];
    lastName = '';
  }
  return { firstName, lastName };
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

/**
 * Exports all registrations to Excel (.xlsx) with embedded visible images and hyperlinks
 */
export async function exportRegistrationsToExcel(registrations, paymentConfig, onProgress) {
  if (!registrations || registrations.length === 0) {
    throw new Error('ไม่พบข้อมูลผู้สมัครในระบบสำหรับส่งออก');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JRE 2027 Admin Console • BestCyniX Dev';
  workbook.lastModifiedBy = 'JRE 2027 Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('ผู้สมัคร JRE 2027', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }]
  });

  const columns = [
    { header: 'ลำดับ', key: 'index', width: 8 },
    { header: 'ชื่อ', key: 'first_name', width: 18 },
    { header: 'สกุล', key: 'last_name', width: 18 },
    { header: 'หน่วยงาน', key: 'institution', width: 28 },
    { header: 'รหัสนามเรียกขาน', key: 'callsign', width: 16 },
    { header: 'เบอร์โทร', key: 'phone', width: 16 },
    { header: 'ชื่อสกุลผู้ที่ติดต่อได้', key: 'emergency_name', width: 22 },
    { header: 'เบอร์โทรผู้ที่ติดต่อได้', key: 'emergency_phone', width: 18 },
    { header: 'โรคประจำตัว / ข้อจำกัดทางกาย', key: 'medical_history', width: 26 },
    { header: 'ประวัติการแพ้ยา / แพ้อาหาร', key: 'food_allergy', width: 26 },
    { header: 'ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา', key: 'previous_training', width: 32 },
    { header: 'สถานะการชำระเงิน', key: 'payment_status_desc', width: 24 },
    { header: 'จ่ายครั้งแรกวันที่', key: 'paid_round1_date', width: 22 },
    { header: 'จำนวนเงินงวดที่ 1', key: 'paid_round1_amount', width: 22 },
    { header: 'ครั้งที่ 2 วันที่', key: 'paid_round2_date', width: 22 },
    { header: 'จำนวนเงินงวดที่ 2', key: 'paid_round2_amount', width: 22 },
    { header: 'มียอดค้างชำระไหม', key: 'remaining_balance_status', width: 26 },
    { header: 'รูปทำบัตร ID Card (รูปภาพจริง)', key: 'id_card_photo', width: 22 },
    { header: 'ไซส์เสื้อฝึก JRE 2027', key: 'shirt_size', width: 18 },
    { header: 'กลุ่มฝึกที่จัดสรร', key: 'group_assigned', width: 18 },
    { header: 'ห้องนอนที่จัดสรร', key: 'room_assigned', width: 18 },
    { header: 'ชื่อเล่น', key: 'nickname', width: 14 },
    { header: 'อีเมล Google', key: 'email', width: 28 },
    { header: 'วันเกิด', key: 'dob', width: 14 },
    { header: 'อายุ', key: 'age_full', width: 18 },
    { header: 'กรุ๊ปเลือด', key: 'blood_group', width: 12 },
    { header: 'ความสัมพันธ์ผู้ติดต่อฉุกเฉิน', key: 'emergency_relation', width: 18 },
    { header: 'ประเภทสถาบัน', key: 'institution_tier', width: 24 },
    { header: 'ยอดค่าสมัครรวม (บาท)', key: 'total_fee', width: 18 },
    { header: 'ยอดที่ชำระแล้ว (บาท)', key: 'paid_amount', width: 18 },
    { header: 'ยอดค้างชำระ (บาท)', key: 'remaining_amount', width: 18 },
    { header: 'งวด 1: สถานะ', key: 'round1_status', width: 16 },
    { header: 'งวด 1: รูปสลิปโอนเงิน (รูปภาพจริง)', key: 'round1_slip', width: 22 },
    { header: 'งวด 1: หมายเหตุ', key: 'round1_notes', width: 24 },
    { header: 'งวด 2: สถานะ', key: 'round2_status', width: 16 },
    { header: 'งวด 2: รูปสลิปโอนเงิน (รูปภาพจริง)', key: 'round2_slip', width: 22 },
    { header: 'งวด 2: หมายเหตุ', key: 'round2_notes', width: 24 },
    { header: 'ชำระเต็ม: วันที่ส่งสลิป', key: 'full_slip_date', width: 20 },
    { header: 'ชำระเต็ม: รูปสลิปโอนเงิน (รูปภาพจริง)', key: 'full_slip', width: 22 },
    { header: 'รายการเอกสารแนบ', key: 'submitted_docs', width: 30 },
    { header: 'ดูแลพิเศษ', key: 'special_care', width: 16 },
    { header: 'หมายเหตุพิเศษ', key: 'special_notes', width: 26 },
    { header: 'วันเวลาที่สมัคร', key: 'created_at', width: 20 }
  ];

  worksheet.columns = columns;

  // Header Styling (Professional Deep Navy Blue with White Bold Text)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    cell.font = {
      name: 'Sarabun',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
      right: { style: 'thin', color: { argb: 'FF475569' } }
    };
  });

  // Identify 1-indexed column positions for media insertion
  const idCardColIdx = columns.findIndex(c => c.key === 'id_card_photo') + 1;
  const round1ColIdx = columns.findIndex(c => c.key === 'round1_slip') + 1;
  const round2ColIdx = columns.findIndex(c => c.key === 'round2_slip') + 1;
  const fullSlipColIdx = columns.findIndex(c => c.key === 'full_slip') + 1;

  for (let i = 0; i < registrations.length; i++) {
    const r = registrations[i];
    if (onProgress) {
      onProgress(i + 1, registrations.length);
    }

    const { firstName, lastName } = resolveFirstAndLastName(r);
    const isMsu = isMsuInstitution(r.institution);
    const totalFee = isMsu ? 650 : 850;
    const round1Amount = 400;
    const round2Amount = isMsu ? 250 : 450;

    let paidAmount = 0;
    if (r.payment_plan === 'installment') {
      if (r.installment_1_status === 'paid') paidAmount += round1Amount;
      if (r.installment_2_status === 'paid') paidAmount += round2Amount;
    } else {
      if (r.payment_status === 'paid') paidAmount = totalFee;
    }
    const remainingAmount = Math.max(0, totalFee - paidAmount);

    let paymentStatusDesc = '';
    if (r.payment_plan === 'installment') {
      if (r.installment_1_status === 'paid' && r.installment_2_status === 'paid') {
        paymentStatusDesc = 'ผ่อนชำระ (จ่ายครบแล้ว)';
      } else if (r.installment_1_status === 'paid') {
        paymentStatusDesc = 'ผ่อนชำระ (ชำระงวดที่ 1 แล้ว)';
      } else if (r.installment_1_status === 'pending_review' || r.installment_2_status === 'pending_review') {
        paymentStatusDesc = 'ผ่อนชำระ (รอตรวจสอบสลิป)';
      } else {
        paymentStatusDesc = 'ผ่อนชำระ (ยังไม่ชำระ)';
      }
    } else {
      if (r.payment_status === 'paid') {
        paymentStatusDesc = 'จ่ายครบ (ชำระเต็มจำนวน)';
      } else if (r.payment_status === 'pending_review') {
        paymentStatusDesc = 'จ่ายครบ (รอตรวจสอบสลิป)';
      } else {
        paymentStatusDesc = 'ชำระเต็มจำนวน (ยังไม่ชำระ)';
      }
    }

    let paidRound1Date = '-';
    if (r.payment_plan === 'installment') {
      if (r.installment_1_slip_date) {
        paidRound1Date = new Date(r.installment_1_slip_date).toLocaleString('th-TH');
      } else if (r.installment_1_status === 'paid') {
        paidRound1Date = 'ชำระแล้ว';
      } else {
        paidRound1Date = 'ยังไม่ชำระ';
      }
    } else {
      if (r.payment_slip_date) {
        paidRound1Date = new Date(r.payment_slip_date).toLocaleString('th-TH');
      } else if (r.payment_status === 'paid') {
        paidRound1Date = 'ชำระแล้ว';
      } else {
        paidRound1Date = 'ยังไม่ชำระ';
      }
    }

    let paidRound1Amount = '';
    if (r.payment_plan === 'installment') {
      if (r.installment_1_status === 'paid') {
        paidRound1Amount = '400 บาท';
      } else if (r.installment_1_status === 'pending_review') {
        paidRound1Amount = '400 บาท (รอตรวจสอบ)';
      } else {
        paidRound1Amount = '400 บาท (ยังไม่ชำระ)';
      }
    } else {
      if (r.payment_status === 'paid') {
        paidRound1Amount = `${totalFee} บาท (จ่ายครบเต็มจำนวน)`;
      } else if (r.payment_status === 'pending_review') {
        paidRound1Amount = `${totalFee} บาท (รอตรวจสอบ)`;
      } else {
        paidRound1Amount = `${totalFee} บาท (ยังไม่ชำระ)`;
      }
    }

    let paidRound2Date = '-';
    if (r.payment_plan === 'installment') {
      if (r.installment_2_slip_date) {
        paidRound2Date = new Date(r.installment_2_slip_date).toLocaleString('th-TH');
      } else if (r.installment_2_status === 'paid') {
        paidRound2Date = 'ชำระแล้ว';
      } else {
        paidRound2Date = 'ยังไม่ชำระ';
      }
    } else {
      paidRound2Date = '-';
    }

    let paidRound2Amount = '-';
    if (r.payment_plan === 'installment') {
      if (r.installment_2_status === 'paid') {
        paidRound2Amount = `${round2Amount} บาท`;
      } else if (r.installment_2_status === 'pending_review') {
        paidRound2Amount = `${round2Amount} บาท (รอตรวจสอบ)`;
      } else {
        paidRound2Amount = `${round2Amount} บาท (ยังไม่ชำระ)`;
      }
    } else {
      paidRound2Amount = '-';
    }

    const remainingBalanceStatus = remainingAmount === 0 
      ? 'ไม่มี (ชำระครบถ้วนแล้ว)' 
      : `มียอดค้างชำระ ${remainingAmount} บาท`;

    const docsSummary = Array.isArray(r.requested_docs) && r.requested_docs.length > 0
      ? r.requested_docs.map(d => `${d.title}: [${d.status}] ${d.file_url ? 'มีไฟล์แนบ' : 'ยังไม่แนบ'}`).join(' | ')
      : 'ไม่มีคำขอเอกสารเพิ่มเติม';

    const rowData = {
      index: i + 1,
      first_name: firstName || '-',
      last_name: lastName || '-',
      institution: r.institution || '-',
      callsign: r.callsign || '-',
      phone: r.phone || '-',
      emergency_name: r.emergency_name || '-',
      emergency_phone: r.emergency_phone || '-',
      medical_history: (r.medical_history && r.medical_history.trim() !== '') ? r.medical_history.trim() : 'ไม่มี',
      food_allergy: (r.food_allergy && r.food_allergy.trim() !== '') ? r.food_allergy.trim() : 'ไม่มี',
      previous_training: (r.previous_training && r.previous_training.trim() !== '') ? r.previous_training.trim() : 'ไม่มี',
      payment_status_desc: paymentStatusDesc,
      paid_round1_date: paidRound1Date,
      paid_round1_amount: paidRound1Amount,
      paid_round2_date: paidRound2Date,
      paid_round2_amount: paidRound2Amount,
      remaining_balance_status: remainingBalanceStatus,
      id_card_photo: '',
      shirt_size: r.shirt_size || 'L',
      group_assigned: r.group_assigned || 'ยังไม่จัดสรร',
      room_assigned: r.room_assigned || 'ยังไม่จัดสรร',
      nickname: r.nickname || '-',
      email: r.user_email || '-',
      dob: r.dob || '-',
      age_full: `${r.age_years || 0} ปี ${r.age_months || 0} เดือน ${r.age_days || 0} วัน`,
      blood_group: r.blood_group || '-',
      emergency_relation: r.emergency_relation || '-',
      institution_tier: isMsu ? 'นิสิต มมส (650 บาท)' : 'สถาบันภายนอก (850 บาท)',
      total_fee: totalFee,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      round1_status: r.installment_1_status === 'paid' ? 'ชำระแล้ว' : r.installment_1_status === 'pending_review' ? 'รอตรวจสอบสลิป' : 'ค้างชำระ',
      round1_slip: '',
      round1_notes: r.installment_1_notes || '',
      round2_status: r.installment_2_status === 'paid' ? 'ชำระแล้ว' : r.installment_2_status === 'pending_review' ? 'รอตรวจสอบสลิป' : 'ค้างชำระ',
      round2_slip: '',
      round2_notes: r.installment_2_notes || '',
      full_slip_date: r.payment_slip_date ? new Date(r.payment_slip_date).toLocaleString('th-TH') : '-',
      full_slip: '',
      submitted_docs: docsSummary,
      special_care: r.is_special_care ? 'ใช่ (ดูแลพิเศษ)' : 'ปกติ',
      special_notes: r.special_notes || '',
      created_at: r.created_at ? new Date(r.created_at).toLocaleString('th-TH') : '-'
    };

    const addedRow = worksheet.addRow(rowData);
    const currentRowIdx = addedRow.number; // 1-indexed row number in sheet

    // Track if any real image is embedded for this row to expand row height
    let hasEmbeddedImage = false;

    // Helper to embed media into cell
    const embedImageCell = async (rawUrl, colIdx, label) => {
      if (!rawUrl) {
        const cell = addedRow.getCell(colIdx);
        cell.value = 'ยังไม่ได้แนบ';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        return;
      }

      // Ensure we have a hosted public URL
      const hostedUrl = await ensureHostedUrl(rawUrl, `${label}.jpg`);
      const cell = addedRow.getCell(colIdx);

      // Fetch base64 data to embed into Excel
      const base64Data = await DataService.getFileBase64(rawUrl);
      const pureBase64 = extractPureBase64(base64Data);

      if (pureBase64) {
        try {
          const extension = getImageExtension(base64Data);
          const imageId = workbook.addImage({
            base64: pureBase64,
            extension: extension
          });

          // 0-indexed column and row coordinates in ExcelJS
          worksheet.addImage(imageId, {
            tl: { col: colIdx - 1 + 0.1, row: currentRowIdx - 1 + 0.08 },
            ext: { width: 88, height: 88 },
            editAs: 'oneCell'
          });

          hasEmbeddedImage = true;
        } catch (e) {
          console.warn('Excel image embedding notice:', e);
        }
      }

      // Add clickable hyperlink so user can click to open or view full image online
      cell.value = {
        text: '🖼️ ดูรูปสลิป/รูปถ่าย',
        hyperlink: hostedUrl,
        tooltip: `คลิกเพื่อเปิดดู ${label} ขนาดเต็มในเบราว์เซอร์`
      };
      cell.font = { color: { argb: 'FF0284C7' }, underline: true, size: 9 };
      cell.alignment = { vertical: 'bottom', horizontal: 'center' };
    };

    // Embed all media columns asynchronously
    await embedImageCell(r.id_card_photo, idCardColIdx, 'รูปถ่าย ID Card');
    await embedImageCell(r.installment_1_slip_url, round1ColIdx, 'สลิปงวด 1');
    await embedImageCell(r.installment_2_slip_url, round2ColIdx, 'สลิปงวด 2');
    await embedImageCell(r.payment_slip_url, fullSlipColIdx, 'สลิปเต็มจำนวน');

    // Adjust row height
    if (hasEmbeddedImage) {
      addedRow.height = 75;
    } else {
      addedRow.height = 24;
    }

    // Zebra striping for data rows
    if (i % 2 === 1) {
      addedRow.eachCell((cell) => {
        if (!cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
    }
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `JRE2027_รายชื่อผู้สมัครทุกคน_พร้อมรูปสลิปและรูปถ่าย_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  return fileName;
}

/**
 * Exports merchandise & trainee shirt orders to Excel (.xlsx) with embedded slip images
 */
export async function exportMerchandiseOrdersToExcel(items, onProgress) {
  if (!items || items.length === 0) {
    throw new Error('ไม่พบข้อมูลรายการเสื้อหรือคำสั่งซื้อสำหรับส่งออก');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JRE 2027 Admin Console • BestCyniX Dev';
  workbook.lastModifiedBy = 'JRE 2027 Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('รายการส่งมอบเสื้อ JRE 2027', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }]
  });

  const columns = [
    { header: 'ลำดับ', key: 'index', width: 8 },
    { header: 'ชื่อ', key: 'first_name', width: 18 },
    { header: 'สกุล', key: 'last_name', width: 18 },
    { header: 'เบอร์โทร', key: 'phone', width: 16 },
    { header: 'หน่วยงาน', key: 'institution', width: 28 },
    { header: 'ไซต์เสื้อ', key: 'shirt_size', width: 14 },
    { header: 'รหัสนามเรียกขาน', key: 'callsign', width: 16 },
    { header: 'ชื่อเล่น', key: 'nickname', width: 14 },
    { header: 'ประเภทรายการ', key: 'source_label', width: 20 },
    { header: 'รหัสออเดอร์', key: 'order_number', width: 22 },
    { header: 'รายละเอียดสินค้า', key: 'items_summary', width: 32 },
    { header: 'ยอดรวม (บาท)', key: 'total_amount', width: 16 },
    { header: 'สถานะชำระเงิน', key: 'payment_status', width: 18 },
    { header: 'รูปสลิปโอนเงิน (รูปภาพจริง)', key: 'slip_image', width: 22 },
    { header: 'สถานะส่งมอบเสื้อ', key: 'delivery_status', width: 18 },
    { header: 'วันเวลาที่ส่งมอบ', key: 'pickup_at', width: 22 },
    { header: 'กลุ่มฝึกที่จัดสรร', key: 'group_assigned', width: 16 },
    { header: 'ห้องนอนที่จัดสรร', key: 'room_assigned', width: 16 },
    { header: 'อีเมล', key: 'email', width: 28 }
  ];

  worksheet.columns = columns;

  // Header Styling (Rich Deep Purple)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF581C87' }
    };
    cell.font = {
      name: 'Sarabun',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF7E22CE' } },
      left: { style: 'thin', color: { argb: 'FF7E22CE' } },
      bottom: { style: 'medium', color: { argb: 'FFA855F7' } },
      right: { style: 'thin', color: { argb: 'FF7E22CE' } }
    };
  });

  const slipColIdx = columns.findIndex(c => c.key === 'slip_image') + 1;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length);
    }

    const { firstName, lastName } = resolveFirstAndLastName(it);
    const isReg = it.source === 'registration' || it.itemType === 'registration';
    const isReceived = it.pickup_status === 'received';
    const isPaid = it.payment_status === 'paid_verified' || it.payment_status === 'paid';

    const itemsSummary = Array.isArray(it.items) && it.items.length > 0
      ? it.items.map(p => `${p.product_name || 'เสื้อ'} (ไซส์ ${p.size || it.shirt_size || it.size}) x${p.quantity || 1}`).join(', ')
      : `เสื้อปฏิบัติการกู้ภัย JRE 2027 (ไซส์ ${it.shirt_size || it.size || 'L'}) x1`;

    const rowData = {
      index: i + 1,
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
      total_amount: it.total_amount || 0,
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
    let hasEmbeddedImage = false;

    if (it.slip_url) {
      const hostedUrl = await ensureHostedUrl(it.slip_url, `slip-${it.order_number || 'shirt'}.jpg`);
      const cell = addedRow.getCell(slipColIdx);

      const base64Data = await DataService.getFileBase64(it.slip_url);
      const pureBase64 = extractPureBase64(base64Data);

      if (pureBase64) {
        try {
          const extension = getImageExtension(base64Data);
          const imageId = workbook.addImage({
            base64: pureBase64,
            extension: extension
          });

          worksheet.addImage(imageId, {
            tl: { col: slipColIdx - 1 + 0.1, row: currentRowIdx - 1 + 0.08 },
            ext: { width: 88, height: 88 },
            editAs: 'oneCell'
          });

          hasEmbeddedImage = true;
        } catch (e) {
          console.warn('Shirt order slip image embedding notice:', e);
        }
      }

      cell.value = {
        text: '🖼️ ดูรูปสลิป',
        hyperlink: hostedUrl,
        tooltip: `คลิกเพื่อเปิดดูรูปสลิปขนาดเต็มในเบราว์เซอร์`
      };
      cell.font = { color: { argb: 'FF0284C7' }, underline: true, size: 9 };
      cell.alignment = { vertical: 'bottom', horizontal: 'center' };
    } else {
      const cell = addedRow.getCell(slipColIdx);
      cell.value = 'ไม่มีสลิป';
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    if (hasEmbeddedImage) {
      addedRow.height = 75;
    } else {
      addedRow.height = 24;
    }

    if (i % 2 === 1) {
      addedRow.eachCell((cell) => {
        if (!cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `JRE2027_รายการส่งมอบเสื้อทุกคน_พร้อมรูปสลิป_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  return fileName;
}
