import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';

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
      windowWidth: 1200
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
function setupWorksheetHeader(sheet, mainTitle, subTitle, dateVenue) {
  sheet.views = [{ showGridLines: true }];

  // Row 1: Main Title
  sheet.mergeCells('A1:I1');
  const r1 = sheet.getCell('A1');
  r1.value = mainTitle;
  r1.font = { name: 'TH Sarabun New', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
  sheet.getRow(1).height = 32;

  // Row 2: Subtitle
  sheet.mergeCells('A2:I2');
  const r2 = sheet.getCell('A2');
  r2.value = subTitle;
  r2.font = { name: 'TH Sarabun New', size: 13, bold: true, color: { argb: 'FF0F172A' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sheet.getRow(2).height = 24;

  // Row 3: Date & Venue
  sheet.mergeCells('A3:I3');
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
 * 1. Export Attendance & Training Sign-in Roster to Excel
 */
export async function exportAttendanceRosterToExcel(records, filename = '1_ใบรายชื่อการเข้าร่วมการฝึกอบรม_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ใบลงทะเบียนเข้าร่วมอบรม', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงเวลาและลงลายมือชื่อเข้าร่วมการฝึกอบรม (Attendance & Sign-in Roster)',
    'วันที่ 13 - 15 กุมภาพันธ์ 2570 • ณ ศูนย์ฝึกอบรมและปฏิบัติการกู้ภัย มหาวิทยาลัยมหาสารคาม (มมส)'
  );

  // Table Headers at Row 5
  const headers = [
    { header: 'ลำดับ', key: 'no', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 26, align: 'left' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 14, align: 'center' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 18, align: 'center' },
    { header: 'มหาวิทยาลัย/สังกัด', key: 'institution', width: 22, align: 'left' },
    { header: 'ประเภท/บทบาท', key: 'role', width: 20, align: 'center' },
    { header: 'เบอร์โทรศัพท์', key: 'phone', width: 16, align: 'center' },
    { header: 'ลายมือชื่อผู้เข้าร่วม (Signature)', key: 'signature', width: 26, align: 'center' },
    { header: 'หมายเหตุ', key: 'notes', width: 18, align: 'left' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Teal 700
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  // Add Data Rows
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
    row.getCell(8).value = ''; // Space for physical signature
    row.getCell(9).value = r.notes || '';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 11 };
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });

    row.height = 24;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 2. Export Shirt Receipt Roster to Excel (32 Production Shirts)
 */
export async function exportShirtRosterToExcel(records, filename = '2_ใบรายชื่อรับมอบเสื้อฝึก_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ใบรับมอบเสื้อฝึก 32 ตัว', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงลายมือชื่อรับมอบเสื้อฝึกปฏิบัติการ JRE 2027 (ยอดผลิตรวม 32 ตัว)',
    'เสื้อพิมพ์ลาย สีเทาดำ คอปกซิปแขนสั้น • มข (TSIKKU: 19 ตัว) / มมส (RCPMSU: 13 ตัว)'
  );

  const headers = [
    { header: 'ลำดับ', key: 'no', width: 8, align: 'center' },
    { header: 'ชื่อ - สกุล ผู้รับมอบ', key: 'name', width: 26, align: 'left' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 18, align: 'center' },
    { header: 'สังกัด', key: 'uni', width: 14, align: 'center' },
    { header: 'ข้อความอกขวา', key: 'chest', width: 18, align: 'center' },
    { header: 'ขนาดไซส์', key: 'size', width: 14, align: 'center' },
    { header: 'จำนวน', key: 'qty', width: 10, align: 'center' },
    { header: 'สถานะค่าเสื้อ', key: 'payment', width: 18, align: 'center' },
    { header: 'ลายมือชื่อผู้รับมอบเสื้อ (Signature)', key: 'signature', width: 26, align: 'center' },
    { header: 'วันที่รับมอบ', key: 'date', width: 14, align: 'center' }
  ];

  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const colNumber = i + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9333EA' } }; // Purple 600
    cell.border = thinBorder;
    ws.getColumn(colNumber).width = h.width;
  });
  headerRow.height = 28;

  records.forEach((r, idx) => {
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const isEven = idx % 2 === 1;
    const bg = isEven ? 'FFFDF4FF' : 'FFFFFFFF';

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.name || '-';
    row.getCell(3).value = r.callsign || '-';
    row.getCell(4).value = r.uni || '-';
    row.getCell(5).value = r.chest || '-';
    row.getCell(6).value = r.size || '-';
    row.getCell(7).value = 1;
    row.getCell(8).value = r.payment || 'ชำระแล้ว';
    row.getCell(9).value = '';
    row.getCell(10).value = '13 ก.พ. 70';

    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 5 }; // Bold size
      cell.alignment = { horizontal: h.align, vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    });

    row.height = 24;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 3. Export Dormitory Rooms Roster to Excel (Kut Rang Floor 1, Rooms 101-110)
 */
export async function exportDormitoryRosterToExcel(roomList, msuList = [], filename = '3_ใบรายชื่อเข้าห้องพัก_หอพักกุดรัง_JRE2027.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('ห้องพักกุดรัง 101-110', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  setupWorksheetHeader(
    ws,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงทะเบียนเข้าห้องพักและรับกุญแจ หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (ชั้น 1 ห้อง 101 - 110)',
    'ห้องพักชาย (101 - 107 • 14 คน) / ห้องพักหญิง (108 - 110 • 6 คน) • รวม 10 ห้อง 20 คน (ห้องละ 2 คน)'
  );

  const headers = [
    { header: 'เลขห้อง', key: 'room', width: 14, align: 'center' },
    { header: 'โซน/เพศ', key: 'gender', width: 12, align: 'center' },
    { header: 'เตียง', key: 'bed', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล ผู้เข้าพัก', key: 'name', width: 24, align: 'left' },
    { header: 'ชื่อเล่น', key: 'nickname', width: 12, align: 'center' },
    { header: 'นามเรียกขาน', key: 'callsign', width: 16, align: 'center' },
    { header: 'เบอร์โทร', key: 'phone', width: 15, align: 'center' },
    { header: 'ข้อมูลสุขภาพ / โรคประจำตัว / แพ้อาหาร', key: 'health', width: 32, align: 'left' },
    { header: 'ลายมือชื่อรับกุญแจ (Check-in)', key: 'checkin', width: 22, align: 'center' },
    { header: 'ลายมือชื่อคืนกุญแจ (Check-out)', key: 'checkout', width: 22, align: 'center' }
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
  roomList.forEach((rm) => {
    const isMale = rm.gender === 'ชาย';
    const occupants = rm.occupants || [];

    for (let b = 0; b < 2; b++) {
      const p = occupants[b];
      const row = ws.getRow(currentRow);
      const bg = isMale ? (currentRow % 2 === 0 ? 'FFF0F9FF' : 'FFFFFFFF') : (currentRow % 2 === 0 ? 'FFFDF2F8' : 'FFFFFFFF');

      row.getCell(1).value = `ห้อง ${rm.room}`;
      row.getCell(2).value = isMale ? 'ชาย 👨' : 'หญิง 👩';
      row.getCell(3).value = `เตียง ${b + 1}`;
      row.getCell(4).value = p ? p.name : '(ว่าง)';
      row.getCell(5).value = p ? p.nickname : '-';
      row.getCell(6).value = p ? p.callsign : '-';
      row.getCell(7).value = p ? p.phone : '-';

      let healthNote = 'ปกติ';
      if (p) {
        const parts = [];
        const med = p.medical || p.medicalHistory;
        const alg = p.allergy || p.foodAllergy;
        if (med && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(med.toLowerCase().trim())) {
          parts.push(`โรค: ${med}`);
        }
        if (alg && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(alg.toLowerCase().trim())) {
          parts.push(`แพ้: ${alg}`);
        }
        if (p.bloodGroup && p.bloodGroup !== '-') {
          parts.push(`(เลือด: ${p.bloodGroup})`);
        }
        if (parts.length > 0) healthNote = parts.join(' | ');
      }
      row.getCell(8).value = healthNote;
      row.getCell(9).value = '';
      row.getCell(10).value = '';

      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1);
        cell.font = { name: 'TH Sarabun New', size: 11, bold: i === 0 };
        cell.alignment = { horizontal: h.align, vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = thinBorder;
      });

      row.height = 24;
      currentRow++;
    }
  });

  // Appendix: MSU Going Home list
  if (msuList.length > 0) {
    currentRow++;
    ws.mergeCells(`A${currentRow}:I${currentRow}`);
    const noteCell = ws.getCell(`A${currentRow}`);
    noteCell.value = `🏠 รายชื่อนิสิต / คณะกรรมการ มมส (16 คน) — เดินทางไป-กลับเอง ไม่พักหอพัก: ${msuList.map(m => m.name).join(', ')}`;
    noteCell.font = { name: 'TH Sarabun New', size: 11, italic: true, color: { argb: 'FF64748B' } };
    noteCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * 4. Master 3-in-1 Excel Workbook (Contains all 3 official rosters in 1 file!)
 */
export async function exportAllRostersToMasterExcel({
  attendanceRecords = [],
  shirtRecords = [],
  roomList = [],
  msuList = []
}, filename = 'JRE2027_เอกสารใบเซ็นชื่อครบชุด_3in1_Master.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'JRE 2027 Admin Suite';
  wb.created = new Date();

  // Sheet 1: Attendance
  const ws1 = wb.addWorksheet('1_ลงทะเบียนเข้าร่วมอบรม');
  setupWorksheetHeader(
    ws1,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงเวลาและลงลายมือชื่อเข้าร่วมการฝึกอบรม (Attendance & Sign-in Roster)',
    'วันที่ 13 - 15 กุมภาพันธ์ 2570 • ณ ศูนย์ฝึกอบรมและปฏิบัติการกู้ภัย มหาวิทยาลัยมหาสารคาม (มมส)'
  );
  const h1 = [
    { header: 'ลำดับ', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล', width: 26, align: 'left' },
    { header: 'ชื่อเล่น', width: 14, align: 'center' },
    { header: 'นามเรียกขาน', width: 18, align: 'center' },
    { header: 'มหาวิทยาลัย/สังกัด', width: 22, align: 'left' },
    { header: 'ประเภท/บทบาท', width: 20, align: 'center' },
    { header: 'เบอร์โทรศัพท์', width: 16, align: 'center' },
    { header: 'ลายมือชื่อผู้เข้าร่วม', width: 26, align: 'center' },
    { header: 'หมายเหตุ', width: 18, align: 'left' }
  ];
  const r1Head = ws1.getRow(5);
  h1.forEach((h, i) => {
    const cell = r1Head.getCell(i + 1);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.border = thinBorder;
    ws1.getColumn(i + 1).width = h.width;
  });
  attendanceRecords.forEach((r, idx) => {
    const row = ws1.getRow(6 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.name || '-';
    row.getCell(3).value = r.nickname || '-';
    row.getCell(4).value = r.callsign || '-';
    row.getCell(5).value = r.institution || '-';
    row.getCell(6).value = r.role || '-';
    row.getCell(7).value = r.phone || '-';
    row.getCell(8).value = '';
    row.getCell(9).value = r.notes || '';
    h1.forEach((h, i) => {
      const c = row.getCell(i + 1);
      c.font = { name: 'TH Sarabun New', size: 11 };
      c.alignment = { horizontal: h.align, vertical: 'middle' };
      c.border = thinBorder;
    });
    row.height = 24;
  });

  // Sheet 2: Shirts
  const ws2 = wb.addWorksheet('2_รับมอบเสื้อฝึก_32ตัว');
  setupWorksheetHeader(
    ws2,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงลายมือชื่อรับมอบเสื้อฝึกปฏิบัติการ JRE 2027 (ยอดผลิตรวม 32 ตัว)',
    'เสื้อพิมพ์ลาย สีเทาดำ คอปกซิปแขนสั้น • มข (TSIKKU: 19 ตัว) / มมส (RCPMSU: 13 ตัว)'
  );
  const h2 = [
    { header: 'ลำดับ', width: 8, align: 'center' },
    { header: 'ชื่อ - สกุล ผู้รับมอบ', width: 26, align: 'left' },
    { header: 'นามเรียกขาน', width: 18, align: 'center' },
    { header: 'สังกัด', width: 14, align: 'center' },
    { header: 'ข้อความอกขวา', width: 18, align: 'center' },
    { header: 'ขนาดไซส์', width: 14, align: 'center' },
    { header: 'จำนวน', width: 10, align: 'center' },
    { header: 'สถานะค่าเสื้อ', width: 18, align: 'center' },
    { header: 'ลายมือชื่อผู้รับมอบเสื้อ', width: 26, align: 'center' },
    { header: 'วันที่รับมอบ', width: 14, align: 'center' }
  ];
  const r2Head = ws2.getRow(5);
  h2.forEach((h, i) => {
    const cell = r2Head.getCell(i + 1);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9333EA' } };
    cell.border = thinBorder;
    ws2.getColumn(i + 1).width = h.width;
  });
  shirtRecords.forEach((r, idx) => {
    const row = ws2.getRow(6 + idx);
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = r.name || '-';
    row.getCell(3).value = r.callsign || '-';
    row.getCell(4).value = r.uni || '-';
    row.getCell(5).value = r.chest || '-';
    row.getCell(6).value = r.size || '-';
    row.getCell(7).value = 1;
    row.getCell(8).value = r.payment || 'ชำระแล้ว';
    row.getCell(9).value = '';
    row.getCell(10).value = '13 ก.พ. 70';
    h2.forEach((h, i) => {
      const c = row.getCell(i + 1);
      c.font = { name: 'TH Sarabun New', size: 11, bold: i === 5 };
      c.alignment = { horizontal: h.align, vertical: 'middle' };
      c.border = thinBorder;
    });
    row.height = 24;
  });

  // Sheet 3: Dormitory
  const ws3 = wb.addWorksheet('3_เข้าห้องพักกุดรัง_10ห้อง');
  setupWorksheetHeader(
    ws3,
    'โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)',
    'บัญชีลงทะเบียนเข้าห้องพักและรับกุญแจ หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (ชั้น 1 ห้อง 101 - 110)',
    'ห้องพักชาย (101 - 107 • 14 คน) / ห้องพักหญิง (108 - 110 • 6 คน) • รวม 10 ห้อง 20 คน (ห้องละ 2 คน)'
  );
  const h3 = [
    { header: 'เลขห้อง', width: 14, align: 'center' },
    { header: 'โซน/เพศ', width: 12, align: 'center' },
    { header: 'เตียง', width: 8, align: 'center' },
    { header: 'ชื่อ - นามสกุล ผู้เข้าพัก', width: 24, align: 'left' },
    { header: 'ชื่อเล่น', width: 12, align: 'center' },
    { header: 'นามเรียกขาน', width: 16, align: 'center' },
    { header: 'เบอร์โทร', width: 15, align: 'center' },
    { header: 'ข้อมูลสุขภาพ / โรคประจำตัว / แพ้อาหาร', width: 32, align: 'left' },
    { header: 'ลายมือชื่อรับกุญแจ', width: 22, align: 'center' },
    { header: 'ลายมือชื่อคืนกุญแจ', width: 22, align: 'center' }
  ];
  const r3Head = ws3.getRow(5);
  h3.forEach((h, i) => {
    const cell = r3Head.getCell(i + 1);
    cell.value = h.header;
    cell.font = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.border = thinBorder;
    ws3.getColumn(i + 1).width = h.width;
  });
  let row3Index = 6;
  roomList.forEach(rm => {
    const isMale = rm.gender === 'ชาย';
    const occ = rm.occupants || [];
    for (let b = 0; b < 2; b++) {
      const p = occ[b];
      const row = ws3.getRow(row3Index);
      row.getCell(1).value = `ห้อง ${rm.room}`;
      row.getCell(2).value = isMale ? 'ชาย 👨' : 'หญิง 👩';
      row.getCell(3).value = `เตียง ${b + 1}`;
      row.getCell(4).value = p ? p.name : '(ว่าง)';
      row.getCell(5).value = p ? p.nickname : '-';
      row.getCell(6).value = p ? p.callsign : '-';
      row.getCell(7).value = p ? p.phone : '-';

      let healthNote = 'ปกติ';
      if (p) {
        const parts = [];
        const med = p.medical || p.medicalHistory;
        const alg = p.allergy || p.foodAllergy;
        if (med && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(med.toLowerCase().trim())) {
          parts.push(`โรค: ${med}`);
        }
        if (alg && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(alg.toLowerCase().trim())) {
          parts.push(`แพ้: ${alg}`);
        }
        if (p.bloodGroup && p.bloodGroup !== '-') {
          parts.push(`(เลือด: ${p.bloodGroup})`);
        }
        if (parts.length > 0) healthNote = parts.join(' | ');
      }
      row.getCell(8).value = healthNote;
      row.getCell(9).value = '';
      row.getCell(10).value = '';
      h3.forEach((h, i) => {
        const c = row.getCell(i + 1);
        c.font = { name: 'TH Sarabun New', size: 11, bold: i === 0 };
        c.alignment = { horizontal: h.align, vertical: 'middle' };
        c.border = thinBorder;
      });
      row.height = 24;
      row3Index++;
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}
