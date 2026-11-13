import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { formatMedicalLabel, formatAllergyLabel } from '../data/defaultData';

/**
 * Triggers a download of a Blob as a file
 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads plain text as a file (e.g. CSV with UTF-8 BOM)
 */
export function downloadCsv(csvContent, filename) {
  // UTF-8 BOM ensures Thai characters display correctly in Microsoft Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export any HTML element to a high-DPI PNG image using html2canvas
 */
export async function exportElementToPng(elementOrId, filename = 'document.png') {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) throw new Error('ไม่พบองค์ประกอบสำหรับสร้างรูปภาพ (Element not found)');

  const originalOverflow = el.style.overflow;
  el.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(el, {
      scale: 2, // High-DPI 2x
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(1320, el.scrollWidth + 40)
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } finally {
    el.style.overflow = originalOverflow;
  }
}

/**
 * Helper to style an ExcelJS worksheet with standard formal header and borders
 */
function setupWorksheetHeader(sheet, mainTitle, subTitle, dateVenue, lastColLetter = 'I') {
  sheet.views = [{ showGridLines: true }];

  // Row 1: Main Title
  sheet.mergeCells(`A1:${lastColLetter}1`);
  const r1 = sheet.getCell('A1');
  r1.value = mainTitle;
  r1.font = { name: 'TH Sarabun New', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
  sheet.getRow(1).height = 32;

  // Row 2: Subtitle
  sheet.mergeCells(`A2:${lastColLetter}2`);
  const r2 = sheet.getCell('A2');
  r2.value = subTitle;
  r2.font = { name: 'TH Sarabun New', size: 13, bold: true, color: { argb: 'FF0F172A' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sheet.getRow(2).height = 24;

  // Row 3: Date & Venue
  sheet.mergeCells(`A3:${lastColLetter}3`);
  const r3 = sheet.getCell('A3');
  r3.value = dateVenue;
  r3.font = { name: 'TH Sarabun New', size: 11, italic: true, color: { argb: 'FF475569' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  sheet.getRow(3).height = 20;

  // Empty row 4
  sheet.getRow(4).height = 10;
}

const thinBorder = {
  top: { style: 'thin', color: { argb: 'FF94A3B8' } },
  left: { style: 'thin', color: { argb: 'FF94A3B8' } },
  bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
  right: { style: 'thin', color: { argb: 'FF94A3B8' } }
};

/**
 * Shared worksheet populator: 1. Attendance & Training Sign-in Roster
 */
function populateAttendanceSheet(ws, records = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงเวลาและลงลายมือชื่อเข้าร่วมการฝึกอบรม (Attendance & Sign-in Roster)',
    'วันที่ 13 - 15 กุมภาพันธ์ 2570 • ณ ศูนย์ฝึกอบรมและปฏิบัติการกู้ภัย มหาวิทยาลัยมหาสารคาม (มมส)',
    'I'
  );

  const headers = [
    { header: 'ลำดับ', key: 'no', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 32, align: 'left' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 14, align: 'center' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 18, align: 'center' },
    { header: 'มหาวิทยาลัย/สังกัด', key: 'institution', width: 22, align: 'left' },
    { header: 'ประเภท/บทบาท', key: 'role', width: 20, align: 'center' },
    { header: 'เบอร์โทรศัพท์', key: 'phone', width: 16, align: 'center' },
    { header: 'ลายมือชื่อผู้เข้าร่วม (Signature)', key: 'signature', width: 26, align: 'center' },
    { header: 'หมายเหตุ', key: 'notes', width: 20, align: 'left' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  records.forEach((r, idx) => {
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const isEven = idx % 2 === 1;
    const bg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.name || '-';
    row.getCell(3).value = r.nickname || '-';
    row.getCell(4).value = r.callsign || '-';
    row.getCell(5).value = r.institution || '-';
    row.getCell(6).value = r.role || '-';
    row.getCell(7).value = r.phone || '-';
    row.getCell(8).value = '';
    row.getCell(9).value = r.notes || '';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 11 };
      cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: i !== 1 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });

    row.height = 24;
  });
}

/**
 * 1. Export Attendance & Training Sign-in Roster to Excel
 */
export async function exportAttendanceRosterToExcel(records, filename = '1_ใบรายชื่อการเข้าร่วมการฝึกอบรม_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ใบลงทะเบียนเข้าร่วมอบรม', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateAttendanceSheet(ws, records);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Shared worksheet populator: 2. ID Card Pickup Sign-in Roster (PDPA-Safe)
 */
function populateIdCardSheet(ws, records = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงลายมือชื่อรับบัตรประจำตัวผู้เข้าร่วม / Staff (ID Card Sign-in Roster)',
    'บัตรประจำตัวโครงการ JRE 2027 • ตรวจสอบรายชื่อ นามเรียกขาน และลงลายมือชื่อเมื่อรับบัตร (คุ้มครองข้อมูลสุขภาพ PDPA)',
    'I'
  );

  const headers = [
    { header: 'ลำดับ', key: 'no', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 32, align: 'left' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 13, align: 'center' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 18, align: 'center' },
    { header: 'สังกัด', key: 'institution', width: 14, align: 'center' },
    { header: 'ประเภทบัตร / บทบาท', key: 'role', width: 22, align: 'center' },
    { header: 'สถานะบัตรในระบบ', key: 'idCardStatus', width: 18, align: 'center' },
    { header: 'ลายมือชื่อผู้รับบัตร (Signature)', key: 'signature', width: 26, align: 'center' },
    { header: 'วันที่รับบัตร', key: 'pickupDate', width: 14, align: 'center' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  records.forEach((r, idx) => {
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const isEven = idx % 2 === 1;
    const bg = isEven ? 'FFEEF2FF' : 'FFFFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.name || '-';
    row.getCell(3).value = r.nickname || '-';
    row.getCell(4).value = r.callsign || '-';
    row.getCell(5).value = r.institution || '-';
    row.getCell(6).value = r.role || '-';
    row.getCell(7).value = r.idCardStatus || 'รอรับบัตร';
    row.getCell(8).value = '';
    row.getCell(9).value = r.idCardReceivedAt || '13 ก.พ. 70';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 3 };
      cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: i !== 1 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });

    row.height = 24;
  });
}

/**
 * 2. Export ID Card Receipt Roster to Excel
 */
export async function exportIdCardRosterToExcel(records, filename = '2_ใบรายชื่อรับบัตรประจำตัว_ID_Card_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ใบเซ็นชื่อรับบัตร ID Card', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateIdCardSheet(ws, records);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Shared worksheet populator: 3. Shirt Receipt Roster
 */
async function populateShirtSheet(wb, ws, records = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงลายมือชื่อรับมอบเสื้อฝึกปฏิบัติการ JRE 2027 (ยอดผลิตรวม 32 ตัว)',
    'เสื้อพิมพ์ลาย สีเทาดำ คอปกซิปแขนสั้น • มข (TSIKKU: 19 ตัว) / มมส (RCPMSU: 13 ตัว) • สแกน QR ท้ายรายชื่อเพื่อรับเสื้อทันที',
    'K'
  );

  const headers = [
    { header: 'ลำดับ', key: 'no', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล ผู้รับมอบ', key: 'name', width: 32, align: 'left' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 18, align: 'center' },
    { header: 'สังกัด', key: 'uni', width: 13, align: 'center' },
    { header: 'ข้อความอกขวา', key: 'chest', width: 16, align: 'center' },
    { header: 'ขนาดไซส์', key: 'size', width: 12, align: 'center' },
    { header: 'จำนวน', key: 'qty', width: 10, align: 'center' },
    { header: 'สถานะค่าเสื้อ / รับเสื้อ', key: 'payment', width: 24, align: 'center' },
    { header: 'QR สแกนรับเสื้อ (Admin)', key: 'qr', width: 13, align: 'center' },
    { header: 'ลายมือชื่อผู้รับมอบเสื้อ (Signature)', key: 'signature', width: 24, align: 'center' },
    { header: 'วันที่รับมอบ', key: 'date', width: 14, align: 'center' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9333EA' } };
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  for (let idx = 0; idx < records.length; idx++) {
    const r = records[idx];
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const isEven = idx % 2 === 1;
    const bg = r.isShirtReceived ? 'FFECFDF5' : (isEven ? 'FFFDF4FF' : 'FFFFFFFF');

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.name || '-';
    row.getCell(3).value = r.callsign || '-';
    row.getCell(4).value = r.uni || '-';
    row.getCell(5).value = r.chest || '-';
    row.getCell(6).value = r.size || '-';
    row.getCell(7).value = 1;
    row.getCell(8).value = r.pickupStatusLabel ? `${r.payment || 'ชำระแล้ว'}\n${r.pickupStatusLabel}` : (r.payment || 'ชำระแล้ว');
    row.getCell(9).value = '';
    row.getCell(10).value = '';
    row.getCell(11).value = '13 ก.พ. 70';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 1 || i === 5 };
      cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: i !== 1 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });

    if (wb && r.qrPayload) {
      try {
        const dataUrl = await QRCode.toDataURL(r.qrPayload, {
          width: 120,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' }
        });
        const imgId = wb.addImage({ base64: dataUrl, extension: 'png' });
        ws.addImage(imgId, {
          tl: { col: 8.15, row: rowNum - 1 + 0.08 },
          ext: { width: 52, height: 52 }
        });
      } catch (err) {
        row.getCell(9).value = r.qrPayload;
      }
    }

    row.height = 48;
  }
}

/**
 * 3. Export Shirt Receipt Roster to Excel (32 Production Shirts)
 */
export async function exportShirtRosterToExcel(records, filename = '3_ใบรายชื่อรับมอบเสื้อฝึก_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ใบรับมอบเสื้อฝึก 32 ตัว', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  await populateShirtSheet(wb, ws, records);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Format person health summary text for Staff-only sheets.
 */
function formatPersonMedicalSummary(p) {
  if (!p) return '-';
  const parts = [];
  const hasMed = Boolean(p.hasMedicalHistory || p.hasMed);
  const hasAlg = Boolean(p.hasFoodAllergy || p.hasAlg);
  const medText = p.medicalHistory || p.medical;
  const algText = p.foodAllergy || p.allergy;

  if (hasMed && medText && medText !== 'ไม่มี') {
    parts.push(formatMedicalLabel(medText));
  }
  if (hasAlg && algText && algText !== 'ไม่มี') {
    parts.push(formatAllergyLabel(algText));
  }
  if (p.bloodGroup && p.bloodGroup !== '-') {
    parts.push(`หมู่เลือด: ${p.bloodGroup}`);
  }
  return parts.length > 0 ? parts.join(' | ') : 'ปกติ (ไม่มีโรคประจำตัว / ไม่แพ้)';
}

/**
 * Populate Worksheet: 3. Dormitory Sign-In Sheet (PDPA-Safe: NO health/medical data)
 */
function populateDormitorySignInSheet(ws, roomList, msuList = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงลายมือชื่อเข้าห้องพักและรับกุญแจ หอพักกุดรัง มมส (ฉบับปิดข้อมูลสุขภาพ PDPA)',
    'หอพักกุดรัง มมส • แยกห้องชาย/หญิง ตามผังห้องและชั้นล่าสุด • เอกสารสำหรับจุดลงทะเบียนรับ/คืนกุญแจ',
    'J'
  );

  const headers = [
    { header: 'เลขห้อง', width: 12, align: 'center' },
    { header: 'โซน/เพศ', width: 11, align: 'center' },
    { header: 'ลำดับ / เตียง', width: 12, align: 'center' },
    { header: 'ชื่อ - นามสกุล ผู้เข้าพัก', width: 32, align: 'left' },
    { header: 'ชื่อเล่น', width: 12, align: 'center' },
    { header: 'นามเรียกขาน', width: 15, align: 'center' },
    { header: 'เบอร์โทร', width: 14, align: 'center' },
    { header: 'สถานะเข้าพัก & กุญแจ', width: 22, align: 'center' },
    { header: 'ลายมือชื่อรับกุญแจ (Check-in)', width: 22, align: 'center' },
    { header: 'ลายมือชื่อคืนกุญแจ (Check-out)', width: 22, align: 'center' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Sky 600
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  let currentRow = 6;
  const optedOutList = [];
  roomList.forEach((rm) => {
    const isMale = rm.gender === 'ชาย';
    const occupants = rm.occupants || [];

    for (let b = 0; b < 2; b++) {
      const p = occupants[b];
      if (p?.dormOptOut) optedOutList.push(`${p.name} (ห้อง ${rm.room})`);
      const row = ws.getRow(currentRow);
      const isOptOut = Boolean(p?.dormOptOut);
      const bg = isOptOut ? 'FFFEF3C7' : (isMale ? (currentRow % 2 === 0 ? 'FFF0F9FF' : 'FFFFFFFF') : (currentRow % 2 === 0 ? 'FFFDF2F8' : 'FFFFFFFF'));

      row.getCell(1).value = rm.roomLabel || `ห้อง ${rm.room}`;
      row.getCell(2).value = `${rm.floorLabel || `ชั้น ${rm.floor || 1}`} ${isMale ? 'ชาย 👨' : 'หญิง 👩'}`;
      row.getCell(3).value = `คนที่ ${b + 1} (เตียง ${b + 1})`;
      row.getCell(4).value = p ? `${p.name}${isOptOut ? ' [ไม่พักหอ]' : ''}` : '(ว่าง)';
      row.getCell(5).value = p ? p.nickname : '-';
      row.getCell(6).value = p ? p.callsign : '-';
      row.getCell(7).value = p ? p.phone : '-';
      row.getCell(8).value = p ? `${p.stayStatusLabel} | ${p.keyStatusLabel}` : '-';
      row.getCell(9).value = isOptOut ? '(ไม่เข้าพัก)' : '';
      row.getCell(10).value = isOptOut ? '(ไม่เข้าพัก)' : '';

      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1);
        cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 0 || isOptOut };
        cell.alignment = { horizontal: h.align, vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = thinBorder;
      });

      row.height = 24;
      currentRow++;
    }
  });

  if (optedOutList.length > 0) {
    currentRow++;
    ws.mergeCells(`A${currentRow}:J${currentRow}`);
    const optCell = ws.getCell(`A${currentRow}`);
    optCell.value = `🚫 รายชื่อผู้แจ้งไม่ประสงค์เข้าพักหอพักที่มหาลัยจัดเตรียมให้ (${optedOutList.length} คน): ${optedOutList.join(', ')}`;
    optCell.font = { name: 'TH Sarabun New', size: 11, bold: true, color: { argb: 'FF92400E' } };
    optCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  }

  if (msuList.length > 0) {
    currentRow++;
    ws.mergeCells(`A${currentRow}:J${currentRow}`);
    const noteCell = ws.getCell(`A${currentRow}`);
    noteCell.value = `🏠 รายชื่อนิสิต / คณะกรรมการ มมส (${msuList.length} คน) — เดินทางไป-กลับเอง ไม่พักหอพัก: ${msuList.map(m => m.name).join(', ')}`;
    noteCell.font = { name: 'TH Sarabun New', size: 11, italic: true, color: { argb: 'FF64748B' } };
    noteCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  }
}

/**
 * Populate Worksheet: 4. Staff Room Health, Medicine & Equipment Checklist (NO signature column)
 */
function populateDormitoryStaffMedicalSheet(ws, roomList, msuList = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027) — เอกสารเฉพาะ Staff',
    'ใบตรวจสอบห้องพัก เข้าพัก/ไม่พัก กุญแจ โรคประจำตัว ยาที่ต้องการ และของที่ต้องใช้ (สำหรับ Staff)',
    'เรียงตามเลขห้องและชั้นจริง (ไฮไลต์สีชมพู = ผู้เฝ้าระวังสุขภาพ) • แสดงสถานะกุญแจ ผู้ติดต่อฉุกเฉิน และความยินยอมเปิดเผยสุขภาพ (เจ้าตัว vs Admin) • (ไม่ต้องลงลายมือชื่อ)',
    'J'
  );

  const headers = [
    { header: 'เลขห้อง', width: 11, align: 'center' },
    { header: 'โซน/เพศ', width: 10, align: 'center' },
    { header: 'ลำดับ', width: 10, align: 'center' },
    { header: 'ชื่อ - นามสกุล (ชื่อเล่น / นามเรียกขาน / โทร)', width: 36, align: 'left' },
    { header: 'สถานะเข้าพัก & กุญแจห้อง', width: 22, align: 'left' },
    { header: 'โรคประจำตัว / อาการแพ้ / หมู่เลือด', width: 26, align: 'left' },
    { header: 'ยาที่ต้องการ / เวชภัณฑ์', width: 22, align: 'left' },
    { header: 'ของที่ต้องใช้ / การดูแลพิเศษ', width: 22, align: 'left' },
    { header: 'เปิดเผยสุขภาพ (ผู้กด)', width: 22, align: 'center' },
    { header: 'ติดต่อฉุกเฉิน / เช็คเตรียม (Staff)', width: 26, align: 'left' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } }; // Rose 700
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 30;

  let currentRow = 6;
  roomList.forEach((rm) => {
    const isMale = rm.gender === 'ชาย';
    const occupants = rm.occupants || [];
    const isCarePerson = (occ) => Boolean(occ && (occ.needsBuddyCare || occ.hasMedicalHistory || occ.hasFoodAllergy || occ.hasMed || occ.hasAlg || occ.medicalEquipmentNeeded || occ.specialItemsNeeded || occ.isSpecialCare));
    const roomHasCare = occupants.some(isCarePerson);

    for (let b = 0; b < 2; b++) {
      const p = occupants[b];
      const row = ws.getRow(currentRow);
      const hasCare = isCarePerson(p);
      const bg = p?.dormOptOut ? 'FFFEF3C7' : (hasCare ? 'FFFFF1F2' : (isMale ? 'FFF8FAFC' : 'FFFDF2F8'));
      const consentTxt = p
        ? `${p.healthConsent?.statusLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')} (${p.healthConsent?.actorLabel || '-'})`
        : '-';
      const emerTxt = p && p.emergencyName && p.emergencyName !== '-'
        ? `ฉุกเฉิน: ${p.emergencyName} (${p.emergencyPhone})`
        : 'ฉุกเฉิน: -';

      row.getCell(1).value = `ห้อง ${rm.room}`;
      row.getCell(2).value = isMale ? 'ชาย' : 'หญิง';
      row.getCell(3).value = b === 0 ? '1 (เตียง 1)' : '2 (เตียง 2)';
      row.getCell(4).value = p
        ? `${p.name}${p.nickname && p.nickname !== '-' ? ` (${p.nickname})` : ''}\n${p.callsign} • โทร: ${p.phone}`
        : '(ว่าง)';
      row.getCell(5).value = p ? `${p.stayStatusLabel}\n🔑 ${p.keyStatusLabel}` : '-';
      row.getCell(6).value = p ? formatPersonMedicalSummary(p) : '-';
      row.getCell(7).value = p?.medicalEquipmentNeeded || '-';
      row.getCell(8).value = p?.specialItemsNeeded || (p?.isSpecialCare ? 'ต้องดูแลเป็นพิเศษ' : '-');
      row.getCell(9).value = consentTxt;
      row.getCell(10).value = p
        ? `${emerTxt}\n${hasCare ? '☐ เตรียมยา/ของใช้แล้ว' : (roomHasCare ? '✓ ปกติ (ช่วยดูแล)' : '✓ ปกติ')}`
        : '-';

      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1);
        cell.font = {
          name: 'TH Sarabun New',
          size: 11,
          bold: i === 0 || (hasCare && (i === 5 || i === 6 || i === 7)),
          color: { argb: hasCare && i === 5 ? 'FF9F1239' : 'FF0F172A' }
        };
        cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = thinBorder;
      });

      row.height = 34;
      currentRow++;
    }
  });

  // Appendix: MSU participants who have health/medicine/item requirements
  const msuNeedsCare = (msuList || []).filter(
    p => p.hasMedicalHistory || p.hasFoodAllergy || p.hasMed || p.hasAlg || p.medicalEquipmentNeeded || p.specialItemsNeeded || p.isSpecialCare
  );
  if (msuNeedsCare.length > 0) {
    currentRow++;
    ws.mergeCells(`A${currentRow}:J${currentRow}`);
    const titleCell = ws.getCell(`A${currentRow}`);
    titleCell.value = `🏠 ข้อมูลโรคประจำตัว / ยา / ของที่ต้องใช้ ของผู้เข้าร่วม มมส (ไป-กลับ ไม่พักหอพัก — ${msuNeedsCare.length} ท่าน)`;
    titleCell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FF92400E' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(currentRow).height = 24;
    currentRow++;

    msuNeedsCare.forEach((p, idx) => {
      const row = ws.getRow(currentRow);
      const consentTxt = `${p.healthConsent?.statusLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')} (${p.healthConsent?.actorLabel || '-'})`;
      const emerTxt = p.emergencyName && p.emergencyName !== '-'
        ? `ฉุกเฉิน: ${p.emergencyName} (${p.emergencyPhone})`
        : 'ฉุกเฉิน: -';

      row.getCell(1).value = 'ไป-กลับ (มมส)';
      row.getCell(2).value = p.gender || '-';
      row.getCell(3).value = `มมส #${idx + 1}`;
      row.getCell(4).value = `${p.name}${p.nickname && p.nickname !== '-' ? ` (${p.nickname})` : ''}\n${p.callsign} • โทร: ${p.phone}`;
      row.getCell(5).value = 'ไป-กลับเอง (ไม่พักหอ)';
      row.getCell(6).value = formatPersonMedicalSummary(p);
      row.getCell(7).value = p.medicalEquipmentNeeded || '-';
      row.getCell(8).value = p.specialItemsNeeded || (p.isSpecialCare ? 'ต้องดูแลเป็นพิเศษ' : '-');
      row.getCell(9).value = consentTxt;
      row.getCell(10).value = `${emerTxt}\n☐ เตรียมแล้ว (นอกหอ)`;

      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1);
        cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 0 };
        cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        cell.border = thinBorder;
      });
      row.height = 34;
      currentRow++;
    });
  }
}

/**
 * 3. Export Dormitory Sign-in Roster to Excel (PDPA-safe: NO health info)
 */
export async function exportDormitoryRosterToExcel(roomList, msuList = [], filename = '3_ใบเซ็นชื่อเข้าห้องพัก_ปิดข้อมูลสุขภาพ_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('เซ็นชื่อเข้าห้องพัก_ปิดสุขภาพ', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  populateDormitorySignInSheet(ws, roomList, msuList);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 4. Export Staff Room Medical & Supplies Checklist to Excel (NO signature column)
 */
export async function exportDormitoryStaffMedicalExcel(roomList, msuList = [], filename = '4_ใบเตรียมยา_ของใช้_โรคประจำตัวตามห้อง_Staff_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ใบตรวจโรค_ยา_ของใช้_Staff', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  populateDormitoryStaffMedicalSheet(ws, roomList, msuList);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Shared worksheet populator: 6. Comprehensive Admin Master Roster (All Details)
 */
function populateAdminMasterSheet(ws, records = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'ทะเบียนข้อมูลละเอียดครบทุกมิติสำหรับ Admin / คณะกรรมการ (Admin Master Roster)',
    'รวบรวมข้อมูลทะเบียน การยืนยันเข้าร่วม ห้องพัก-กุญแจ เสื้อ บัตร ID การเงิน สุขภาพ (รวมผู้กดยินยอม) และผู้ติดต่อฉุกเฉิน',
    'S'
  );

  const headers = [
    { header: 'ลำดับ', width: 7, align: 'center' },
    { header: 'รหัส / ชื่อ-สกุล (TH / EN)', width: 36, align: 'left' },
    { header: 'ชื่อเล่น / นามเรียกขาน', width: 20, align: 'center' },
    { header: 'สังกัด / สถานะสมาชิก', width: 20, align: 'left' },
    { header: 'บทบาท & ฝ่ายงาน', width: 22, align: 'left' },
    { header: 'เพศ / อายุ / หมู่เลือด', width: 18, align: 'center' },
    { header: 'เบอร์โทร / อีเมล', width: 24, align: 'left' },
    { header: 'ยืนยันเข้าร่วม (RSVP)', width: 20, align: 'center' },
    { header: 'กลุ่มฝึก', width: 12, align: 'center' },
    { header: 'ห้องพัก / สถานะพัก / กุญแจ', width: 24, align: 'left' },
    { header: 'เสื้อฝึก (ไซส์ / สถานะรับ)', width: 18, align: 'center' },
    { header: 'บัตร ID Card', width: 18, align: 'center' },
    { header: 'แผนชำระ & สถานะการเงิน', width: 24, align: 'left' },
    { header: 'ยอดกำหนด / จ่ายแล้ว / ค้างรับ', width: 24, align: 'center' },
    { header: 'หมายเหตุการเงิน (หลังงาน/ยกเลิก)', width: 24, align: 'left' },
    { header: 'โรคประจำตัว & อาการแพ้', width: 26, align: 'left' },
    { header: 'ยา / เวชภัณฑ์ / ของใช้ที่ต้องเตรียม', width: 24, align: 'left' },
    { header: 'เปิดเผยสุขภาพ (สถานะ / ผู้กด)', width: 22, align: 'center' },
    { header: 'ผู้ติดต่อฉุกเฉิน', width: 24, align: 'left' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.border = thinBorder;
    ws.getColumn(i + 1).width = h.width;
  });
  headerRow.height = 30;

  records.forEach((r, idx) => {
    const row = ws.getRow(6 + idx);
    const hasAlert = Boolean(r.hasHealthAlert);
    const bg = hasAlert ? 'FFFFF1F2' : (idx % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF');

    const personalMeta = [
      r.gender && r.gender !== '-' ? r.gender : null,
      r.ageLabel && r.ageLabel !== '-' ? r.ageLabel : null,
      r.bloodGroup && r.bloodGroup !== '-' ? `เลือด ${r.bloodGroup}` : null
    ].filter(Boolean).join(' • ') || '-';
    const contactLine = [
      r.phone && r.phone !== '-' ? r.phone : 'ไม่มีเบอร์โทร',
      r.email && r.email !== '-' ? r.email : (r.isNoAccount ? 'ไม่มีบัญชีในระบบ (Admin เพิ่ม)' : null)
    ].filter(Boolean).join('\n');

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.fullNameWithEn || r.name || '-';
    row.getCell(3).value = `${r.nickname || '-'} / ${r.callsign || '-'}`;
    row.getCell(4).value = `${r.institution || '-'} (${r.memberTypeLabel || '-'})${r.isNoAccount ? '\n[Admin เพิ่ม • ไม่มีบัญชี]' : ''}`;
    row.getCell(5).value = r.roleWithDuty || r.role || '-';
    row.getCell(6).value = personalMeta;
    row.getCell(7).value = contactLine;
    row.getCell(8).value = r.rsvpSummary || '-';
    row.getCell(9).value = r.groupAssigned || 'ยังไม่จัดกลุ่ม';
    row.getCell(10).value = r.dormAndKeySummary || '-';
    row.getCell(11).value = r.shirtSummary || '-';
    row.getCell(12).value = r.idCardSummary || '-';
    row.getCell(13).value = r.paymentStatusLabel || '-';
    row.getCell(14).value = r.paymentAmountsLabel || '-';
    row.getCell(15).value = r.paymentNotesLabel || '-';
    row.getCell(16).value = r.medicalSummary || 'ปกติ';
    row.getCell(17).value = r.suppliesSummary || '-';
    row.getCell(18).value = r.healthConsentSummary || '-';
    row.getCell(19).value = r.emergencyContact || '-';

    headers.forEach((h, i) => {
      const c = row.getCell(i + 1);
      c.font = {
        name: 'TH Sarabun New',
        size: 10,
        bold: i === 1 || (hasAlert && i === 15),
        color: { argb: hasAlert && i === 15 ? 'FFBE123C' : 'FF0F172A' }
      };
      c.alignment = { horizontal: h.align, vertical: 'middle', wrapText: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.border = thinBorder;
    });
    row.height = 36;
  });
}

/**
 * 6. Export Comprehensive Admin Master Roster to Excel
 */
export async function exportAdminMasterRosterExcel(records, filename = '6_ทะเบียนข้อมูลละเอียดครบทุกมิติ_Admin_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ทะเบียนข้อมูลละเอียด Admin', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateAdminMasterSheet(ws, records);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 7. Master 6-in-1 Excel Workbook (4 Signing Sheets [PDPA-Safe] + 2 Admin/Staff Detailed Sheets)
 */
export async function exportAllRostersToMasterExcel({
  attendanceRecords = [],
  idCardRecords = [],
  shirtRecords = [],
  roomList = [],
  msuList = [],
  adminMasterRecords = []
}, filename = 'JRE2027_ชุดเอกสารครบชุด_6in1_Master.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('1_เซ็นชื่อเข้าร่วมอบรม', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateAttendanceSheet(ws1, attendanceRecords);

  const ws2 = wb.addWorksheet('2_เซ็นชื่อรับบัตร_IDCard', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateIdCardSheet(ws2, idCardRecords.length > 0 ? idCardRecords : attendanceRecords);

  const ws3 = wb.addWorksheet('3_เซ็นชื่อรับเสื้อ_32ตัว', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  await populateShirtSheet(wb, ws3, shirtRecords);

  const ws4 = wb.addWorksheet('4_เซ็นชื่อเข้าห้องพัก_ปิดสุขภาพ', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateDormitorySignInSheet(ws4, roomList, msuList);

  const ws5 = wb.addWorksheet('5_ตรวจห้อง_โรค_ยา_ของใช้_Staff', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateDormitoryStaffMedicalSheet(ws5, roomList, msuList);

  const ws6 = wb.addWorksheet('6_ทะเบียนข้อมูลละเอียด_Admin', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateAdminMasterSheet(ws6, adminMasterRecords);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}
