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
    const targetId = typeof elementOrId === 'string' ? elementOrId : el.id;
    const canvas = await html2canvas(el, {
      scale: 2, // High-DPI 2x
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(1320, el.scrollWidth + 40),
      onclone: (clonedDoc) => {
        const clonedEl = targetId ? clonedDoc.getElementById(targetId) : null;
        if (!clonedEl) return;

        // Hide interactive web controls inside exported official PNGs
        clonedEl.querySelectorAll('.no-print, .print\\:hidden, button:not(.print-include)').forEach((node) => {
          node.style.display = 'none';
        });

        // Show official print-only headers inside PNG exports
        clonedEl.querySelectorAll('.hidden.print\\:block').forEach((node) => {
          node.style.display = 'block';
        });

        // Convert dark-themed containers (e.g., AdminRoomsView) to crisp white official form paper
        clonedEl.style.background = '#ffffff';
        clonedEl.style.color = '#000000';
        clonedEl.style.padding = '24px';
        clonedEl.style.fontFamily = "'Sarabun', 'TH Sarabun New', sans-serif";

        if (targetId === 'printable-rooms-roster') {
          clonedEl.querySelectorAll('div, span, p, h1, h2, h3').forEach((node) => {
            node.style.color = '#000000';
            node.style.textShadow = 'none';
            if (node.className && typeof node.className === 'string' && /bg-(slate|blue|pink|sky|indigo|rose|emerald)-9/.test(node.className)) {
              node.style.background = '#ffffff';
            }
          });
        }

        // Enforce sharp official grid borders on all tables inside PNG
        clonedEl.querySelectorAll('table').forEach((tbl) => {
          tbl.style.borderCollapse = 'collapse';
          tbl.style.border = '2px solid #0f172a';
          tbl.style.background = '#ffffff';
        });
        clonedEl.querySelectorAll('th').forEach((th) => {
          th.style.border = '1.5px solid #0f172a';
          th.style.backgroundColor = '#e2e8f0';
          th.style.color = '#000000';
        });
        clonedEl.querySelectorAll('td').forEach((td) => {
          td.style.border = '1px solid #334155';
          td.style.color = '#000000';
        });
      }
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
        ? `${emerTxt}\n${hasCare ? 'มีต้องเตรียม • ☐ เตรียมแล้ว' : 'ไม่มีต้องเตรียม'}`
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
      row.getCell(10).value = `${emerTxt}\nมีต้องเตรียม • ☐ เตรียมแล้ว (นอกหอ)`;

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
 * 7. Shared worksheet populator: Master All-Participants QR Code Sheet (PDPA-Safe)
 */
async function populateAllQrMasterSheet(wb, ws, records = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'เอกสารรวม QR Code ประจำตัวผู้เข้าร่วมทุกคนในใบเดียว (All-Participants QR Master Roster)',
    'ใช้สแกนจุดเช็คชื่อ • รับบัตร ID Card • รับเสื้อ • เปิดเวชระเบียน EMR (PDPA-Safe: ปิดข้อมูลสุขภาพ)',
    'J'
  );

  const headers = [
    { header: 'ลำดับ', width: 7, align: 'center' },
    { header: 'รหัสบัตร ID', width: 16, align: 'center' },
    { header: 'ชื่อ - นามสกุล', width: 32, align: 'left' },
    { header: 'ชื่อเล่น', width: 13, align: 'center' },
    { header: 'นามเรียกขาน', width: 17, align: 'center' },
    { header: 'สังกัด', width: 12, align: 'center' },
    { header: 'บทบาท', width: 22, align: 'center' },
    { header: 'กลุ่มฝึก / ห้องพัก', width: 20, align: 'center' },
    { header: 'QR Code (สแกนทุกจุด)', width: 15, align: 'center' },
    { header: 'ลายมือชื่อ / หมายเหตุ', width: 24, align: 'center' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  for (let idx = 0; idx < records.length; idx++) {
    const r = records[idx];
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const bg = idx % 2 === 1 ? 'FFF0F9FF' : 'FFFFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.cardCode || '-';
    row.getCell(3).value = r.name || '-';
    row.getCell(4).value = r.nickname || '-';
    row.getCell(5).value = r.callsign || '-';
    row.getCell(6).value = r.institution || '-';
    row.getCell(7).value = r.role || '-';
    row.getCell(8).value = `${r.groupAssigned || 'รอจัดกลุ่ม'}\n${r.roomNote || '-'}`;
    row.getCell(9).value = '';
    row.getCell(10).value = '';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 1 || i === 2 || i === 4 };
      cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });

    if (wb && r.qrPayload) {
      try {
        const dataUrl = await QRCode.toDataURL(r.qrPayload, {
          width: 140,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' }
        });
        const imgId = wb.addImage({ base64: dataUrl, extension: 'png' });
        ws.addImage(imgId, {
          tl: { col: 8.18, row: rowNum - 1 + 0.08 },
          ext: { width: 54, height: 54 }
        });
      } catch (err) {
        row.getCell(9).value = r.cardCode || r.qrPayload;
      }
    }

    row.height = 50;
  }
}

export async function exportAllQrMasterToExcel(records = [], filename = '5_เอกสารรวม_QRCode_ทุกคน_ใบเดียว_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();
  const ws = wb.addWorksheet('รวม_QR_ทุกคนในใบเดียว', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  await populateAllQrMasterSheet(wb, ws, records);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 8. Shared worksheet populator: Medicine & Field Medical Supplies Preparation Sheet
 */
function populateMedicalSuppliesPrepSheet(ws, prepRows = [], summaryItems = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'เอกสารขอยา จัดเตรียมยา & ขอเวชภัณฑ์ภาคสนาม (Medical Support & Supplies Preparation)',
    'สรุปยอดรวมยา/เวชภัณฑ์/ของใช้พิเศษที่ผู้เข้าร่วมแจ้งขอ และรายชื่อผู้มีโรคประจำตัว/แพ้ยาสำหรับฝ่ายพยาบาลและสวัสดิการ',
    'I'
  );

  let currentRow = 5;

  // Part 1 Header: Aggregated Summary
  ws.mergeCells(`A${currentRow}:I${currentRow}`);
  const sBanner = ws.getCell(`A${currentRow}`);
  sBanner.value = `ส่วนที่ 1: สรุปรายการยา / เวชภัณฑ์ / ของใช้ที่ต้องจัดเตรียมทั้งหมด (${summaryItems.length} รายการหลัก)`;
  sBanner.font = { name: 'TH Sarabun New', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
  sBanner.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(currentRow).height = 24;
  currentRow++;

  const sumHeaders = ['ลำดับ', 'รายการยา / เวชภัณฑ์ / อุปกรณ์ที่ต้องเตรียม', 'จำนวนผู้ขอ', 'รายชื่อ / นามเรียกขานผู้ขอ', 'เช็คจัดเตรียมครบ', '', '', '', ''];
  ws.mergeCells(`B${currentRow}:C${currentRow}`);
  ws.mergeCells(`E${currentRow}:G${currentRow}`);
  ws.mergeCells(`H${currentRow}:I${currentRow}`);
  const sumHdrRow = ws.getRow(currentRow);
  sumHdrRow.getCell(1).value = 'ลำดับ';
  sumHdrRow.getCell(2).value = 'รายการยา / เวชภัณฑ์ที่ขอเตรียม';
  sumHdrRow.getCell(4).value = 'จำนวน (คน)';
  sumHdrRow.getCell(5).value = 'รายชื่อผู้ขอเตรียม';
  sumHdrRow.getCell(8).value = 'เช็คจัดเตรียม (Staff)';
  for (let c = 1; c <= 9; c++) {
    const cell = sumHdrRow.getCell(c);
    cell.font = { name: 'TH Sarabun New', size: 11, bold: true, color: { argb: 'FF064E3B' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }
  sumHdrRow.height = 24;
  currentRow++;

  if (summaryItems.length === 0) {
    ws.mergeCells(`A${currentRow}:I${currentRow}`);
    ws.getCell(`A${currentRow}`).value = 'ยังไม่มีผู้กรอกคำขอเตรียมยา/เวชภัณฑ์เพิ่มเติม';
    ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(currentRow).height = 22;
    currentRow++;
  } else {
    summaryItems.forEach((it, idx) => {
      ws.mergeCells(`B${currentRow}:C${currentRow}`);
      ws.mergeCells(`E${currentRow}:G${currentRow}`);
      ws.mergeCells(`H${currentRow}:I${currentRow}`);
      const r = ws.getRow(currentRow);
      r.getCell(1).value = idx + 1;
      r.getCell(2).value = it.item;
      r.getCell(4).value = it.count;
      r.getCell(5).value = it.requesters.join(', ');
      r.getCell(8).value = 'มีต้องเตรียม • ☐ เตรียมแล้ว';
      for (let c = 1; c <= 9; c++) {
        const cell = r.getCell(c);
        cell.font = { name: 'TH Sarabun New', size: 11, bold: c === 2 || c === 4 };
        cell.alignment = { horizontal: c === 1 || c === 4 || c >= 8 ? 'center' : 'left', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? 'FFF0FDF4' : 'FFFFFFFF' } };
        cell.border = thinBorder;
      }
      r.height = Math.max(24, Math.ceil(it.requesters.join(', ').length / 45) * 16);
      currentRow++;
    });
  }

  currentRow++;

  // Part 2: Individual Person Table
  ws.mergeCells(`A${currentRow}:I${currentRow}`);
  const pBanner = ws.getCell(`A${currentRow}`);
  pBanner.value = `ส่วนที่ 2: รายชื่อผู้ขอยา / เวชภัณฑ์ & ผู้มีโรคประจำตัว/แพ้ยา (จำนวน ${prepRows.length} ท่าน)`;
  pBanner.font = { name: 'TH Sarabun New', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  pBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  pBanner.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(currentRow).height = 24;
  currentRow++;

  const headers = [
    { header: 'ลำดับ', width: 7, align: 'center' },
    { header: 'ชื่อ - สกุล / นามเรียกขาน', width: 30, align: 'left' },
    { header: 'สังกัด / ห้องพัก', width: 18, align: 'center' },
    { header: 'เบอร์โทร / ติดต่อฉุกเฉิน', width: 24, align: 'left' },
    { header: 'โรคประจำตัว / อาการแพ้ / หมู่เลือด', width: 26, align: 'left' },
    { header: 'ยาที่ขอ / เวชภัณฑ์ที่ขอเตรียม', width: 28, align: 'left' },
    { header: 'ของที่ต้องใช้ / ดูแลพิเศษ', width: 22, align: 'left' },
    { header: 'ความยินยอมสุขภาพ', width: 18, align: 'center' },
    { header: 'เช็คเตรียม & ลงชื่อผู้เตรียม', width: 20, align: 'center' }
  ];

  const hdrRow = ws.getRow(currentRow);
  headers.forEach((h, i) => {
    const c = hdrRow.getCell(i + 1);
    c.value = h.header;
    c.font = { name: 'TH Sarabun New', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } };
    c.border = thinBorder;
    ws.getColumn(i + 1).width = h.width;
  });
  hdrRow.height = 28;
  currentRow++;

  prepRows.forEach((r, idx) => {
    const row = ws.getRow(currentRow);
    const bg = r.hasCare ? 'FFFFF1F2' : (idx % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF');
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = `${r.name}\n(${r.nickname}) • ${r.callsign}`;
    row.getCell(3).value = `${r.institution}\n${r.roomLabel}`;
    row.getCell(4).value = `โทร: ${r.phone}\nฉุกเฉิน: ${r.emergencyContact}`;
    row.getCell(5).value = r.medicalSummary;
    row.getCell(6).value = r.medEquipment || '-';
    row.getCell(7).value = r.specialItems || (r.isSpecialCare ? 'ต้องดูแลเป็นพิเศษ' : '-');
    row.getCell(8).value = r.consentLabel || '-';
    row.getCell(9).value = (r.hasCare || r.medEquipment || r.specialItems)
      ? 'มีต้องเตรียม\n☐ เตรียมแล้ว\nผู้เตรียม: ..............'
      : 'ไม่มีต้องเตรียม';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 10.5, bold: i === 1 || (i === 5 && Boolean(r.medEquipment)) };
      cell.alignment = { horizontal: h.align, vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });
    row.height = 38;
    currentRow++;
  });
}

export async function exportMedicalSuppliesPrepToExcel(prepRows = [], summaryItems = [], filename = '8_เอกสารขอยา_จัดเตรียมยา_เวชภัณฑ์_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Medical & Welfare Team';
  wb.created = new Date();
  const ws = wb.addWorksheet('ขอยา_จัดเตรียมยา_เวชภัณฑ์', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateMedicalSuppliesPrepSheet(ws, prepRows, summaryItems);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 9. Shared worksheet populator: Comprehensive Per-Person & Per-Case EMR Medical Log Sheet with Direct URLs
 */
function populateEmrRecordsSheet(ws, caseRows = [], personRows = []) {
  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'ทะเบียนเอกสารเวชระเบียนรายคน / รายเคส (EMR Medical Records & Direct Case URLs)',
    'บันทึกอาการ เหตุการณ์ สัญญาณชีพ การปฐมพยาบาล ยาที่กิน/จ่าย ผู้กรอก ผู้จ่าย และ URL แยกรายคน / รายเคส',
    'V'
  );

  let currentRow = 5;

  if (personRows.length > 0) {
    ws.mergeCells(`A${currentRow}:V${currentRow}`);
    const pBanner = ws.getCell(`A${currentRow}`);
    pBanner.value = `ส่วนที่ 1: สรุปเวชระเบียนรายคน พร้อม URL แยกทุกท่าน (${personRows.length} ท่าน)`;
    pBanner.font = { name: 'TH Sarabun New', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    pBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    pBanner.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(currentRow).height = 24;
    currentRow++;

    const pHdrRow = ws.getRow(currentRow);
    const pCols = ['ที่', 'ชื่อ - สกุล (ชื่อเล่น)', 'นามเรียกขาน', 'สังกัด / ห้อง', 'โรคประจำตัว / แพ้ยา-อาหาร / หมู่เลือด', 'ยา/เวชภัณฑ์ที่ขอเตรียม', 'จำนวนเคส', 'เคสล่าสุด', 'URL รายคน (Admin)', 'URL หน้าเวชระเบียนเจ้าตัว'];
    pCols.forEach((txt, i) => {
      const c = pHdrRow.getCell(i + 1);
      c.value = txt;
      c.font = { name: 'TH Sarabun New', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.border = thinBorder;
    });
    pHdrRow.height = 26;
    currentRow++;

    personRows.forEach((p, idx) => {
      const row = ws.getRow(currentRow);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = `${p.name}${p.nickname && p.nickname !== '-' ? ` (${p.nickname})` : ''}`;
      row.getCell(3).value = p.callsign || '-';
      row.getCell(4).value = `${p.institution || '-'} • ${p.room || '-'}`;
      row.getCell(5).value = `โรค: ${p.medical || 'ไม่มี'}\nแพ้: ${p.allergy || 'ไม่มี'}\nเลือด: ${p.blood || '-'}`;
      row.getCell(6).value = p.requestedEquipment || '-';
      row.getCell(7).value = p.caseCount || 0;
      row.getCell(8).value = p.lastCase ? `${p.lastCase.timeLabel} • ${p.lastCase.symptoms || '-'} (${p.lastCase.medicines || '-'})` : 'ยังไม่มีเคส';
      row.getCell(9).value = p.personUrl || '-';
      row.getCell(10).value = p.myEmrUrl || '-';
      for (let i = 1; i <= 10; i++) {
        const c = row.getCell(i);
        c.font = { name: 'TH Sarabun New', size: 10.5, bold: i === 2 || i === 7 };
        c.alignment = { horizontal: i === 1 || i === 7 ? 'center' : 'left', vertical: 'middle', wrapText: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: p.caseCount > 0 ? 'FFFFF1F2' : (idx % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF') } };
        c.border = thinBorder;
      }
      row.height = 34;
      currentRow++;
    });

    currentRow++;
    ws.mergeCells(`A${currentRow}:V${currentRow}`);
    const cBanner = ws.getCell(`A${currentRow}`);
    cBanner.value = `ส่วนที่ 2: บันทึกเวชระเบียนรายเคส พร้อม URL แยกรายเคส (${caseRows.length} เคส)`;
    cBanner.font = { name: 'TH Sarabun New', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    cBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF881337' } };
    cBanner.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(currentRow).height = 24;
    currentRow++;
  }

  const headers = [
    { header: 'ที่', width: 6, align: 'center' },
    { header: 'รหัสเคส (Case ID)', width: 18, align: 'center' },
    { header: 'วันเวลาเกิดเหตุ/จ่ายยา', width: 20, align: 'center' },
    { header: 'ชื่อ - นามสกุล (ชื่อเล่น)', width: 28, align: 'left' },
    { header: 'นามเรียกขาน', width: 16, align: 'center' },
    { header: 'สังกัด / กลุ่ม', width: 16, align: 'center' },
    { header: 'ห้องพัก', width: 14, align: 'center' },
    { header: 'หมู่เลือด', width: 10, align: 'center' },
    { header: 'โรคประจำตัว / แพ้ยา-อาหาร', width: 26, align: 'left' },
    { header: 'สัญญาณชีพ (V/S)', width: 18, align: 'center' },
    { header: 'อาการสำคัญ / เป็นอะไร', width: 26, align: 'left' },
    { header: 'เหตุการณ์ / เป็นเมื่อไหร่อย่างไร', width: 28, align: 'left' },
    { header: 'การปฐมพยาบาล / หัตถการ', width: 28, align: 'left' },
    { header: 'ยาที่กิน / จ่าย', width: 26, align: 'left' },
    { header: 'ขนาดและเวลาที่รับประทาน', width: 26, align: 'left' },
    { header: 'ผู้กรอกข้อมูล', width: 20, align: 'left' },
    { header: 'ผู้จ่ายยา / ดูแล', width: 20, align: 'left' },
    { header: 'หมายเหตุ / ติดตามอาการ', width: 24, align: 'left' },
    { header: 'URL รายคน (Admin)', width: 34, align: 'left' },
    { header: 'URL รายเคส (Admin)', width: 38, align: 'left' },
    { header: 'URL เวชระเบียนของเจ้าตัว', width: 34, align: 'left' },
    { header: 'URL เคสในหน้าเจ้าตัว', width: 38, align: 'left' }
  ];

  const headerRow = ws.getRow(currentRow);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9F1239' } };
    cell.border = thinBorder;
    ws.getColumn(i + 1).width = h.width;
  });
  headerRow.height = 28;
  currentRow++;

  caseRows.forEach((r, idx) => {
    const row = ws.getRow(currentRow + idx);
    const bg = idx % 2 === 1 ? 'FFFFF1F2' : 'FFFFFFFF';
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.caseId || '-';
    row.getCell(3).value = r.timeLabel || '-';
    row.getCell(4).value = `${r.personName}${r.nickname && r.nickname !== '-' ? ` (${r.nickname})` : ''}`;
    row.getCell(5).value = r.callsign || '-';
    row.getCell(6).value = `${r.institution || '-'} • ${r.group || '-'}`;
    row.getCell(7).value = r.room || '-';
    row.getCell(8).value = r.blood || '-';
    row.getCell(9).value = `โรค: ${r.chronic || 'ไม่มี'}\nแพ้: ${r.allergy || 'ไม่มี'}`;
    row.getCell(10).value = r.vitalSigns || '-';
    row.getCell(11).value = r.symptoms || '-';
    row.getCell(12).value = r.incidentDetail || '-';
    row.getCell(13).value = r.firstAid || '-';
    row.getCell(14).value = r.medicines || '-';
    row.getCell(15).value = r.dosage || '-';
    row.getCell(16).value = r.recorder || '-';
    row.getCell(17).value = r.dispenser || '-';
    row.getCell(18).value = r.notes || '-';
    row.getCell(19).value = r.personUrl || '-';
    row.getCell(20).value = r.caseUrl || '-';
    row.getCell(21).value = r.myEmrUrl || '-';
    row.getCell(22).value = r.myCaseUrl || '-';

    headers.forEach((h, i) => {
      const c = row.getCell(i + 1);
      c.font = { name: 'TH Sarabun New', size: 10.5, bold: i === 3 || i === 10 || i === 13 };
      c.alignment = { horizontal: h.align, vertical: 'middle', wrapText: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      c.border = thinBorder;
    });
    row.height = 36;
  });
}

export async function exportEmrRecordsToExcel(caseRows = [], personRows = [], filename = '9_เอกสารเวชระเบียน_รายคน_รายเคส_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Field Medical Unit';
  wb.created = new Date();
  const ws = wb.addWorksheet('เวชระเบียนรายคน_รายเคส', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateEmrRecordsSheet(ws, caseRows, personRows);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 10. Master 9-in-1 Excel Workbook (All Signing Sheets [PDPA-Safe] + Admin/Staff & Medical Prep/EMR Sheets)
 */
export async function exportAllRostersToMasterExcel({
  attendanceRecords = [],
  idCardRecords = [],
  shirtRecords = [],
  roomList = [],
  msuList = [],
  adminMasterRecords = [],
  qrMasterRecords = [],
  medicalPrepRows = [],
  medicalSupplySummary = [],
  emrCaseRecords = [],
  emrPersonRecords = []
}, filename = 'JRE2027_ชุดเอกสารครบชุด_Master_All_in_One.xlsx') {
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

  const ws5 = wb.addWorksheet('5_รวม_QRCode_ทุกคนใบเดียว', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  await populateAllQrMasterSheet(wb, ws5, qrMasterRecords);

  const ws6 = wb.addWorksheet('6_ตรวจห้อง_โรค_ยา_ของใช้_Staff', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateDormitoryStaffMedicalSheet(ws6, roomList, msuList);

  const ws7 = wb.addWorksheet('7_ทะเบียนข้อมูลละเอียด_Admin', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateAdminMasterSheet(ws7, adminMasterRecords);

  const ws8 = wb.addWorksheet('8_ขอยา_จัดเตรียมยา_เวชภัณฑ์', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateMedicalSuppliesPrepSheet(ws8, medicalPrepRows, medicalSupplySummary);

  const ws9 = wb.addWorksheet('9_เวชระเบียนรายคน_รายเคส', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  populateEmrRecordsSheet(ws9, emrCaseRecords, emrPersonRecords);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}
