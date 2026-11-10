import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Check, 
  Shirt, 
  Building, 
  Users, 
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { 
  resolveUniversityInfo, 
  resolveGender, 
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing,
  normalizeShirtSize
} from '../data/defaultData';
import { 
  exportAttendanceRosterToExcel,
  exportShirtRosterToExcel,
  exportDormitoryRosterToExcel,
  exportAllRostersToMasterExcel,
  downloadCsv,
  exportElementToPng
} from '../utils/documentExporters';

export default function AdminDocumentsView({
  registrations = [],
  merchandiseOrders = [],
  triggerToast
}) {
  const [activeDoc, setActiveDoc] = useState('attendance'); // 'attendance' | 'shirts' | 'rooms'
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // 1. Prepare Attendance Data (36 Persons)
  const attendanceData = useMemo(() => {
    const list = (registrations || []).map(reg => {
      const nameData = resolvePersonFullNameWithTitle(reg);
      const uniInfo = resolveUniversityInfo(reg);
      const gender = resolveGender(reg);

      let extra = {};
      if (reg.special_notes) {
        if (typeof reg.special_notes === 'string' && reg.special_notes.trim().startsWith('{')) {
          try { extra = JSON.parse(reg.special_notes); } catch (e) {}
        } else if (typeof reg.special_notes === 'object') {
          extra = reg.special_notes;
        }
      }

      const nickname = extra.nickname || reg.nickname || '-';
      const rawCallsign = extra.callsign || reg.callsign || '-';
      const callsign = normalizeCallsignSpacing(rawCallsign);
      const isStaff = Boolean(extra.is_staff || reg.is_staff || rawCallsign.includes('STAFF'));
      const isCommittee = Boolean(extra.staff_role_type === 'committee' || isStaff);

      let role = 'ผู้เข้าร่วมการฝึกอบรม (Trainee)';
      if (extra.staff_role_type === 'committee') role = 'คณะกรรมการดำเนินงาน';
      else if (isStaff) role = 'Staff คณะทำงาน';

      const isMsu = Boolean(uniInfo?.isMsu);
      const notes = isMsu ? 'มมส (ไป-กลับเอง)' : (reg.room_assigned ? `พักหอกุดรัง (${reg.room_assigned.match(/\d{3}/)?.[1] || '-'})` : 'พักหอกุดรัง');

      return {
        id: reg.id || reg.user_id,
        name: nameData.fullName,
        nickname,
        callsign,
        institution: uniInfo.shortTag,
        fullUni: uniInfo.fullName,
        isMsu,
        isCommittee,
        isStaff,
        role,
        gender,
        phone: reg.phone || extra.phone || '-',
        notes
      };
    });

    // Sort order: Committee MSU (1..8) -> MSU others -> KKU Male -> KKU Female
    return list.sort((a, b) => {
      if (a.isCommittee && !b.isCommittee) return -1;
      if (!a.isCommittee && b.isCommittee) return 1;
      if (a.isMsu && !b.isMsu) return -1;
      if (!a.isMsu && b.isMsu) return 1;
      if (a.gender !== b.gender) return a.gender === 'ชาย' ? -1 : 1;
      return a.name.localeCompare(b.name, 'th');
    });
  }, [registrations]);

  // 2. Prepare Production Shirts Data (32 Production Shirts)
  const shirtData = useMemo(() => {
    const rows = [];

    // Process from registrations (Trainees and Staff with shirts)
    (registrations || []).forEach(reg => {
      let extra = {};
      if (reg.special_notes) {
        if (typeof reg.special_notes === 'string' && reg.special_notes.trim().startsWith('{')) {
          try { extra = JSON.parse(reg.special_notes); } catch (e) {}
        } else if (typeof reg.special_notes === 'object') {
          extra = reg.special_notes;
        }
      }

      // Skip staff who only get ID card (0 THB, no shirt)
      if (extra.staff_id_card_only) return;

      const rawSize = extra.shirt_size || reg.shirt_size;
      if (!rawSize || rawSize === '-' || rawSize === 'none' || rawSize === 'ไม่มี') return;

      const nameData = resolvePersonFullNameWithTitle(reg);
      const uniInfo = resolveUniversityInfo(reg);
      const normSize = normalizeShirtSize(rawSize);
      const isKku = !uniInfo.isMsu;
      const chest = isKku ? 'TSIKKU' : 'RCPMSU';
      const callsign = normalizeCallsignSpacing(extra.callsign || reg.callsign || '-');

      let payment = 'รวมในค่าธรรมเนียม';
      if (extra.is_staff || reg.is_staff) {
        payment = 'Staff (280 บ.) ชำระแล้ว';
      }

      rows.push({
        id: reg.id || reg.user_id,
        name: nameData.fullName,
        nickname: extra.nickname || reg.nickname || '-',
        callsign,
        uni: uniInfo.shortTag,
        chest,
        size: normSize,
        qty: 1,
        payment,
        isKku
      });
    });

    // Also include Newton (นายจินณวัตร ทิพย์รักษ์ RCP 16-02) and store extra orders
    (merchandiseOrders || []).forEach(ord => {
      const isNewton = ord.order_number === 'JRE27-NEWTON-SHIRT-32' || (ord.customer_name || '').includes('จินณวัตร');
      const isSpare = ord.order_number === 'JRE27-SPARE-SHIRT-CENTRAL';

      (ord.items || []).forEach((it, idx) => {
        const chest = ord.institution?.includes('ขอนแก่น') ? 'TSIKKU' : 'RCPMSU';
        rows.push({
          id: `${ord.order_number}-${idx}`,
          name: ord.customer_name || 'ลูกค้าสั่งเพิ่ม',
          nickname: ord.nickname || (isNewton ? 'นิวตั้น' : '-'),
          callsign: ord.callsign || (isNewton ? 'RCP 16-02' : '(กองกลาง)'),
          uni: ord.affiliation || (chest === 'TSIKKU' ? 'มข' : 'มมส'),
          chest,
          size: normalizeShirtSize(it.size || 'XL'),
          qty: 1,
          payment: 'ชำระแล้ว (280 บ.)',
          isKku: chest === 'TSIKKU'
        });
      });
    });

    // Sort order: KKU TSIKKU (19 shirts) first, then MSU RCPMSU (13 shirts)
    return rows.sort((a, b) => {
      if (a.chest !== b.chest) return a.chest === 'TSIKKU' ? -1 : 1;
      return a.name.localeCompare(b.name, 'th');
    });
  }, [registrations, merchandiseOrders]);

  // 3. Prepare Dormitory Rooms Data (Rooms 101 - 110)
  const roomData = useMemo(() => {
    const ROOM_CONFIGS = [
      { room: '101', roomLabel: 'ห้อง 101', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '102', roomLabel: 'ห้อง 102', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '103', roomLabel: 'ห้อง 103', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '104', roomLabel: 'ห้อง 104', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '105', roomLabel: 'ห้อง 105', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '106', roomLabel: 'ห้อง 106', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '107', roomLabel: 'ห้อง 107', gender: 'ชาย', floor: 1, capacity: 2 },
      { room: '108', roomLabel: 'ห้อง 108', gender: 'หญิง', floor: 1, capacity: 2 },
      { room: '109', roomLabel: 'ห้อง 109', gender: 'หญิง', floor: 1, capacity: 2 },
      { room: '110', roomLabel: 'ห้อง 110', gender: 'หญิง', floor: 1, capacity: 2 }
    ];

    const map = {};
    ROOM_CONFIGS.forEach(c => {
      map[c.room] = { ...c, occupants: [] };
    });

    const msuList = [];

    (registrations || []).forEach(reg => {
      const uniInfo = resolveUniversityInfo(reg);
      const isMsu = Boolean(uniInfo?.isMsu);
      const nameData = resolvePersonFullNameWithTitle(reg);
      const rawRoom = String(reg.room_assigned || '').trim();

      let extra = {};
      try { if (reg.special_notes && reg.special_notes.startsWith('{')) extra = JSON.parse(reg.special_notes); } catch (e) {}

      const med = reg.medical_history || extra.medical_history || '-';
      const alg = reg.food_allergy || extra.food_allergy || '-';
      const bloodGroup = reg.blood_group || extra.blood_group || '-';
      const hasMed = med && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(med.toLowerCase().trim());
      const hasAlg = alg && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(alg.toLowerCase().trim());

      const person = {
        name: nameData.fullName,
        nickname: extra.nickname || reg.nickname || '-',
        callsign: normalizeCallsignSpacing(extra.callsign || reg.callsign || '-'),
        phone: reg.phone || extra.phone || '-',
        uni: uniInfo.shortTag,
        bloodGroup,
        medical: med,
        allergy: alg,
        hasMed,
        hasAlg
      };

      if (isMsu) {
        msuList.push(person);
        return;
      }

      const match = rawRoom.match(/(\d{3})/);
      if (match && map[match[1]]) {
        map[match[1]].occupants.push(person);
      }
    });

    const rooms = Object.values(map);
    return {
      rooms,
      maleRooms: rooms.filter(r => r.gender === 'ชาย'),
      femaleRooms: rooms.filter(r => r.gender === 'หญิง'),
      msuList
    };
  }, [registrations]);

  // Handler: Print Current Document Cleanly
  const handlePrintDocument = () => {
    document.body.classList.add('document-print-active');
    const cleanup = () => {
      document.body.classList.remove('document-print-active');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // Safe fallback timeout (45s) in case afterprint does not fire
    setTimeout(cleanup, 45000);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handler: Export PNG
  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const filename = `ใบเซ็นชื่อ_${activeDoc === 'attendance' ? 'การเข้าร่วมอบรม' : activeDoc === 'shirts' ? 'รับมอบเสื้อ32ตัว' : 'เข้าห้องพักกุดรัง'}_JRE2027.png`;
      await exportElementToPng('printable-document-sheet', filename);
      if (triggerToast) triggerToast('🖼️ บันทึกเป็นรูปภาพ PNG ความละเอียดสูงเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกภาพ: ' + err.message);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Handler: Export Single Excel
  const handleExportSingleExcel = async () => {
    setIsExportingExcel(true);
    try {
      if (activeDoc === 'attendance') {
        await exportAttendanceRosterToExcel(attendanceData);
      } else if (activeDoc === 'shirts') {
        await exportShirtRosterToExcel(shirtData);
      } else {
        await exportDormitoryRosterToExcel(roomData.rooms, roomData.msuList);
      }
      if (triggerToast) triggerToast('📊 บันทึกไฟล์ Excel (.xlsx) เรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handler: Export Master 3-in-1 Excel
  const handleExportMasterExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportAllRostersToMasterExcel({
        attendanceRecords: attendanceData,
        shirtRecords: shirtData,
        roomList: roomData.rooms,
        msuList: roomData.msuList
      });
      if (triggerToast) triggerToast('⚡ ดาวน์โหลดชุดเอกสารครบทั้ง 3 ใบ (Master 3-in-1 Excel) สำเร็จ');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    let csv = '';
    let filename = '';

    if (activeDoc === 'attendance') {
      csv = 'ลำดับ,ชื่อ - นามสกุล,ชื่อเล่น,นามเรียกขาน,มหาวิทยาลัย/สังกัด,บทบาท,เบอร์โทรศัพท์,ลายมือชื่อ,หมายเหตุ\n';
      attendanceData.forEach((r, idx) => {
        csv += `"${idx + 1}","${r.name}","${r.nickname}","${r.callsign}","${r.institution}","${r.role}","${r.phone}","","${r.notes}"\n`;
      });
      filename = '1_ใบรายชื่อการเข้าร่วมการฝึกอบรม_JRE2027.csv';
    } else if (activeDoc === 'shirts') {
      csv = 'ลำดับ,ชื่อ - สกุล ผู้รับมอบ,นามเรียกขาน,สังกัด,ข้อความอกขวา,ขนาดไซส์,จำนวน,สถานะชำระเงิน,ลายมือชื่อผู้รับมอบ,วันที่รับมอบ\n';
      shirtData.forEach((r, idx) => {
        csv += `"${idx + 1}","${r.name}","${r.callsign}","${r.uni}","${r.chest}","${r.size}","1","${r.payment}","","13 ก.พ. 70"\n`;
      });
      filename = '2_ใบรายชื่อรับมอบเสื้อฝึก_JRE2027.csv';
    } else {
      csv = 'เลขห้อง,โซน/เพศ,เตียง,ชื่อ - นามสกุล ผู้เข้าพัก,ชื่อเล่น,นามเรียกขาน,เบอร์โทร,ลายมือชื่อรับกุญแจ,ลายมือชื่อคืนกุญแจ\n';
      roomData.rooms.forEach(rm => {
        const isMale = rm.gender === 'ชาย';
        for (let b = 0; b < 2; b++) {
          const p = rm.occupants[b];
          csv += `"${rm.room}","${isMale ? 'ชาย' : 'หญิง'}","${b + 1}","${p ? p.name : '(ว่าง)'}","${p ? p.nickname : '-'}","${p ? p.callsign : '-'}","${p ? p.phone : '-'}","",""\n`;
        }
      });
      filename = '3_ใบรายชื่อเข้าห้องพัก_หอพักกุดรัง_JRE2027.csv';
    }

    downloadCsv(csv, filename);
    if (triggerToast) triggerToast('📁 ดาวน์โหลดไฟล์ CSV (UTF-8 BOM) เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/30 p-6 sm:p-8 shadow-2xl no-print">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5 shadow-sm">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>ศูนย์รวมใบรายชื่อและเอกสารลงลายมือชื่อ</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                URL: /admin/documents
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>📄 ศูนย์จัดทำเอกสารทางการ JRE 2027 (ใบเซ็นชื่อรวม 3 ใบ)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              จัดทำแบบฟอร์มเอกสารลงลายมือชื่อทางการสำหรับจุดลงทะเบียนหน้างาน รองรับการส่งออก <strong>Excel (.xlsx)</strong>, <strong>CSV</strong>, <strong>พิมพ์/PDF (ไร้ปัญหาหน้าขาว)</strong> และ <strong>รูปภาพ PNG คมชัดสูง</strong> ครบถ้วนในที่เดียว
            </p>
          </div>

          {/* Master 3-in-1 Quick Export Action */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportMasterExcel}
              disabled={isExportingExcel}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>⚡ ดาวน์โหลดครบชุด (Master 3-in-1 Excel)</span>
            </button>
          </div>
        </div>

        {/* 3 DOCUMENT SELECTOR TABS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveDoc('attendance')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDoc === 'attendance'
                ? 'bg-teal-950/80 border-teal-400 text-white ring-2 ring-teal-400/30 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>1. ใบรายชื่อการเข้าร่วม</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-sm font-black text-white">ลงทะเบียนอบรม (36 คน)</div>
            <span className="text-[10px] text-teal-300">มมส 16 ท่าน • มข 20 ท่าน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('shirts')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDoc === 'shirts'
                ? 'bg-purple-950/80 border-purple-400 text-white ring-2 ring-purple-400/30 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>2. ใบรายชื่อรับเสื้อ</span>
              <Shirt className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-black text-white">รับมอบเสื้อฝึก (32 ตัว)</div>
            <span className="text-[10px] text-purple-300">TSIKKU: 19 • RCPMSU: 13</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('rooms')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDoc === 'rooms'
                ? 'bg-sky-950/80 border-sky-400 text-white ring-2 ring-sky-400/30 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>3. ใบรายชื่อเข้าห้องพัก</span>
              <Building className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-sm font-black text-white">หอพักกุดรัง (10 ห้อง / 20 คน)</div>
            <span className="text-[10px] text-sky-300">ชาย 101-107 • หญิง 108-110</span>
          </button>
        </div>
      </div>

      {/* EXPORT CONTROL TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            ส่งออกเอกสารที่เลือก:
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-teal-300 font-mono text-xs font-bold border border-slate-700">
            {activeDoc === 'attendance' ? '1. ใบรายชื่อการเข้าร่วม' : activeDoc === 'shirts' ? '2. ใบรับมอบเสื้อ 32 ตัว' : '3. ใบเข้าห้องพัก 101-110'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Export */}
          <button
            type="button"
            onClick={handleExportSingleExcel}
            disabled={isExportingExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV (UTF-8 BOM)</span>
          </button>

          {/* PDF / Print */}
          <button
            type="button"
            onClick={handlePrintDocument}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>พิมพ์ / PDF (หน้ากระดาษ A4)</span>
          </button>

          {/* PNG Image */}
          <button
            type="button"
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isExportingPng ? 'กำลังสร้างรูป...' : 'รูปภาพ PNG'}</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (PRINTABLE SHEET) */}
      <div className="overflow-x-auto pb-4">
        <div 
          id="printable-document-sheet"
          className="mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-300 min-w-[850px] max-w-[1000px] text-xs font-sans print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none"
        >
          {/* OFFICIAL HEADER SECTION */}
          <div className="text-center pb-5 border-b-2 border-slate-900 mb-6 space-y-1">
            <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] mb-1 uppercase tracking-wider border border-slate-300">
              Joint Response Exercise (JRE 2027) • Official Document
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {activeDoc === 'attendance' && 'บัญชีลงเวลาและลงลายมือชื่อเข้าร่วมการฝึกอบรม'}
              {activeDoc === 'shirts' && 'บัญชีลงลายมือชื่อรับมอบเสื้อฝึกปฏิบัติการ JRE 2027'}
              {activeDoc === 'rooms' && 'บัญชีลงทะเบียนเข้าห้องพักและรับกุญแจ หอพักกุดรัง'}
            </h2>

            <p className="text-sm font-bold text-slate-700">
              โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027) ระหว่าง มข. และ มมส.
            </p>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 pt-1">
              <span>📅 วันที่ 13 - 15 กุมภาพันธ์ 2570</span>
              <span>•</span>
              <span>📍 ณ ศูนย์ฝึกอบรมและปฏิบัติการกู้ภัย มหาวิทยาลัยมหาสารคาม</span>
              <span>•</span>
              <span className="font-bold text-slate-800">
                {activeDoc === 'attendance' && 'ยอดรวม 36 คน'}
                {activeDoc === 'shirts' && 'ยอดผลิตรวม 32 ตัว (TSIKKU: 19 / RCPMSU: 13)'}
                {activeDoc === 'rooms' && 'ชั้น 1 ห้อง 101 - 110 (10 ห้อง / 20 คน)'}
              </span>
            </div>
          </div>

          {/* TABLE CONTENT 1: ATTENDANCE ROSTER */}
          {activeDoc === 'attendance' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 text-center">
                    <th className="py-2.5 px-2 border-r border-slate-900 w-10">ลำดับ</th>
                    <th className="py-2.5 px-3 border-r border-slate-900 text-left">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-20">ชื่อเล่น</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-28">นามเรียกขาน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-16">สถาบัน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-36">ประเภท / บทบาท</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-24">เบอร์โทร</th>
                    <th className="py-2.5 px-4 border-r border-slate-900 w-36">ลายมือชื่อผู้เข้าร่วม</th>
                    <th className="py-2.5 px-2 w-28">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {attendanceData.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950">{p.name}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center">{p.nickname}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-semibold">{p.callsign}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-bold">{p.institution}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[11px]">{p.role}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono">{p.phone}</td>
                      <td className="py-2 px-4 border-r border-slate-400 text-center">
                        <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                      </td>
                      <td className="py-2 px-2 text-[10px] text-slate-600">{p.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE CONTENT 2: SHIRT DISTRIBUTION ROSTER (32 PRODUCTION SHIRTS) */}
          {activeDoc === 'shirts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                <span>🏛️ มข (อกขวา TSIKKU): 19 ตัว (S:3, M:4, L:4, XL:2, 2XL:2, 4XL:3, 5XL:1)</span>
                <span>🏛️ มมส (อกขวา RCPMSU): 13 ตัว (S:2, M:1, L:1, XL:6, 2XL:1, 4XL:1, 6XL:1)</span>
                <span className="font-black text-slate-950">รวมผลิต: 32 ตัว</span>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 text-center">
                    <th className="py-2.5 px-2 border-r border-slate-900 w-10">ลำดับ</th>
                    <th className="py-2.5 px-3 border-r border-slate-900 text-left">ชื่อ - นามสกุล ผู้รับมอบ</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-28">นามเรียกขาน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-16">สังกัด</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-24">อกขวา</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-20">ไซส์เสื้อ</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-14">จำนวน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-32">สถานะค่าเสื้อ</th>
                    <th className="py-2.5 px-4 border-r border-slate-900 w-36">ลายมือชื่อผู้รับมอบ</th>
                    <th className="py-2.5 px-2 w-20">วันที่รับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {shirtData.map((s, idx) => (
                    <tr key={s.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950">{s.name}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-semibold">{s.callsign}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-bold">{s.uni}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-black">{s.chest}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-black text-sm bg-purple-50">{s.size}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono">1</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[11px] text-center">{s.payment}</td>
                      <td className="py-2 px-4 border-r border-slate-400 text-center">
                        <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">13 ก.พ. 70</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 text-[11px] text-slate-600">
                * บุคลากร/Staff มมส ที่ถือบัตร Staff อย่างเดียว (0 บาท ไม่รับเสื้อ เช่น นายณัฐพล เชื้อคนแข็ง) จะไม่ปรากฏในยอดผลิต 32 ตัวข้างต้น
              </div>
            </div>
          )}

          {/* TABLE CONTENT 3: DORMITORY ROOMS ROSTER (ROOMS 101-110) */}
          {activeDoc === 'rooms' && (
            <div className="space-y-6">
              {/* Male Section */}
              <div>
                <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center justify-between">
                  <span>🚪 1. ห้องพักชาย (7 ห้อง / 14 คน — หอพักกุดรัง ชั้น 1 ห้อง 101 ถึง 107)</span>
                  <span className="text-xs font-normal text-slate-600">ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น</span>
                </h3>

                <table className="w-full text-left text-xs border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 text-center">
                      <th className="py-2.5 px-2 border-r border-slate-900 w-20">ห้อง</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-14">เตียง</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left">ชื่อ - นามสกุล ผู้เข้าพัก</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-20">ชื่อเล่น</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-28">นามเรียกขาน</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-24">เบอร์โทร</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-20">กุญแจ #</th>
                      <th className="py-2.5 px-4 border-r border-slate-900 w-36">ลายมือชื่อรับกุญแจ</th>
                      <th className="py-2.5 px-4 w-36">ลายมือชื่อคืนกุญแจ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {roomData.maleRooms.map((rm) => (
                      <React.Fragment key={rm.room}>
                        {[0, 1].map((b) => {
                          const p = rm.occupants[b];
                          return (
                            <tr key={`${rm.room}-${b}`} className={b === 1 ? 'border-b-2 border-slate-900 bg-blue-50/40' : 'bg-white'}>
                              {b === 0 && (
                                <td rowSpan={2} className="py-2 px-2 border-r border-slate-900 text-center font-mono font-black text-sm bg-slate-100 align-middle">
                                  {rm.roomLabel}
                                  <span className="block text-[10px] font-normal text-slate-500">ชั้น 1 (ชาย)</span>
                                </td>
                              )}
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono text-[11px]">เตียง {b + 1}</td>
                              <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950">
                                <div>{p ? p.name : '(ว่าง)'}</div>
                                {p && (p.hasMed || p.hasAlg) && (
                                  <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                                    {p.hasMed && <span>🩺 โรค: {p.medical} </span>}
                                    {p.hasAlg && <span>⚠️ แพ้: {p.allergy} </span>}
                                    <span className="font-mono">(เลือด: {p.bloodGroup})</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center">{p ? p.nickname : '-'}</td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono">{p ? p.callsign : '-'}</td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono">{p ? p.phone : '-'}</td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono text-[10px] text-slate-500">K-{rm.room}</td>
                              <td className="py-2 px-4 border-r border-slate-400 text-center">
                                <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Female Section */}
              <div className="pt-2">
                <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center justify-between">
                  <span>🚪 2. ห้องพักหญิง (3 ห้อง / 6 คน — หอพักกุดรัง ชั้น 1 ห้อง 108 ถึง 110)</span>
                  <span className="text-xs font-normal text-slate-600">ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น</span>
                </h3>

                <table className="w-full text-left text-xs border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 text-center">
                      <th className="py-2.5 px-2 border-r border-slate-900 w-20">ห้อง</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-14">เตียง</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left">ชื่อ - นามสกุล ผู้เข้าพัก</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-20">ชื่อเล่น</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-28">นามเรียกขาน</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-24">เบอร์โทร</th>
                      <th className="py-2.5 px-2 border-r border-slate-900 w-20">กุญแจ #</th>
                      <th className="py-2.5 px-4 border-r border-slate-900 w-36">ลายมือชื่อรับกุญแจ</th>
                      <th className="py-2.5 px-4 w-36">ลายมือชื่อคืนกุญแจ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {roomData.femaleRooms.map((rm) => (
                      <React.Fragment key={rm.room}>
                        {[0, 1].map((b) => {
                          const p = rm.occupants[b];
                          return (
                            <tr key={`${rm.room}-${b}`} className={b === 1 ? 'border-b-2 border-slate-900 bg-pink-50/40' : 'bg-white'}>
                              {b === 0 && (
                                <td rowSpan={2} className="py-2 px-2 border-r border-slate-900 text-center font-mono font-black text-sm bg-slate-100 align-middle">
                                  {rm.roomLabel}
                                  <span className="block text-[10px] font-normal text-slate-500">ชั้น 1 (หญิง)</span>
                                </td>
                              )}
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono text-[11px]">เตียง {b + 1}</td>
                              <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950">
                                <div>{p ? p.name : '(ว่าง)'}</div>
                                {p && (p.hasMed || p.hasAlg) && (
                                  <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                                    {p.hasMed && <span>🩺 โรค: {p.medical} </span>}
                                    {p.hasAlg && <span>⚠️ แพ้: {p.allergy} </span>}
                                    <span className="font-mono">(เลือด: {p.bloodGroup})</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center">{p ? p.nickname : '-'}</td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono">{p ? p.callsign : '-'}</td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono">{p ? p.phone : '-'}</td>
                              <td className="py-2 px-2 border-r border-slate-400 text-center font-mono text-[10px] text-slate-500">K-{rm.room}</td>
                              <td className="py-2 px-4 border-r border-slate-400 text-center">
                                <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Appendix: MSU Local List */}
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-[11px] text-slate-700">
                <span className="font-bold">🏠 นิสิต / คณะกรรมการ มมส (16 ท่าน) — ไม่พักหอพัก (ไป-กลับเอง):</span>{' '}
                {roomData.msuList.map(m => m.name).join(', ')}
              </div>
            </div>
          )}

          {/* OFFICIAL SIGNATURE FOOTER */}
          <div className="pt-10 mt-8 border-t border-slate-400 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <p className="text-slate-600 mb-8">ลงชื่อ ..................................................................... ผู้ตรวจสอบ / เจ้าหน้าที่ทะเบียน</p>
              <p className="font-bold text-slate-900">( ..................................................................... )</p>
              <p className="text-[11px] text-slate-500">ตำแหน่ง เจ้าหน้าที่ฝ่ายทะเบียนและประเมินผล JRE 2027</p>
            </div>

            <div className="space-y-1">
              <p className="text-slate-600 mb-8">ลงชื่อ ..................................................................... ประธาน / ผู้รับผิดชอบโครงการ</p>
              <p className="font-bold text-slate-900">( ..................................................................... )</p>
              <p className="text-[11px] text-slate-500">ประธานคณะกรรมการดำเนินงาน JRE 2027</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
