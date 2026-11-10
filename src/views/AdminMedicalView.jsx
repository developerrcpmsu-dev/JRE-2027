import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Stethoscope, 
  Search, 
  QrCode, 
  Camera, 
  Check, 
  AlertTriangle, 
  HeartPulse, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  Clock, 
  User, 
  Building, 
  Phone, 
  ShieldCheck, 
  Activity, 
  X, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Save,
  RotateCcw
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  getParticipantPhoto, 
  resolvePersonFullNameWithTitle, 
  normalizeCallsignSpacing, 
  resolveUniversityInfo, 
  getApplicantMedical, 
  getApplicantAllergy,
  getMedicalEquipmentNeeded,
  hasMedicalCondition,
  hasFoodOrDrugAllergy
} from '../data/defaultData';
import { DataService } from '../supabase';
import { downloadCsv } from '../utils/documentExporters';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

const PRESET_SYMPTOMS = [
  'ปวดศีรษะ / ไมเกรน',
  'มีไข้ / ตัวร้อน / หนาวสั่น',
  'ปวดท้อง / จุกแน่น / ท้องอืด',
  'ท้องเสีย / ถ่ายเหลว',
  'บาดแผลถลอก / แผลสด',
  'แมลงสัตว์กัดต่อย / ผื่นคัน',
  'ปวดเมื่อยกล้ามเนื้อ / เคล็ดขัดยอก',
  'วิงเวียนศีรษะ / หน้ามืด / เป็นลม',
  'อาการภูมิแพ้ / คัดจมูก / จาม',
  'เจ็บคอ / ไอ / มีเสมหะ'
];

const PRESET_MEDICINES = [
  { name: 'พาราเซตามอล (Paracetamol 500 mg)', defaultDose: '2 เม็ด หลังอาหารทันที (ทุก 4-6 ชม. เมื่อมีอาการ)' },
  { name: 'คลอร์เฟนิรามีน (CPM 4 mg)', defaultDose: '1 เม็ด หลังอาหาร เช้า-เย็น (ทำให้ง่วงนอน)' },
  { name: 'ผงเกลือแร่ (ORS)', defaultDose: '1 ซอง ละลายน้ำสะอาด 250 มล. จิบเมื่อกระหายหรืออ่อนเพลีย' },
  { name: 'ยาธาตุน้ำขาว (Salol et Menthol)', defaultDose: '1 ช้อนโต๊ะ ก่อนหรือหลังอาหาร เมื่อมีอาการจุกเสียด' },
  { name: 'บัสโคพาน (Buscopan 10 mg)', defaultDose: '1 เม็ด หลังอาหาร บรรเทาปวดเกร็งช่องท้อง' },
  { name: 'เซทิริซีน (Cetirizine 10 mg)', defaultDose: '1 เม็ด วันละครั้งก่อนนอน (แก้แพ้ไม่ง่วง)' },
  { name: 'คาลาไมน์โลชั่น (Calamine Lotion)', defaultDose: 'ทาบริเวณที่มีอาการคันหรือผื่น วันละ 3-4 ครั้ง' },
  { name: 'ชุดทำแผลสด (เบตาดีน + สำลี + ก๊อซ)', defaultDose: 'ล้างทำความสะอาดแผล ใส่ยาโพวิโดนไอโอดีนและปิดแผล' },
  { name: 'เจลประคบเย็น (Cold Pack)', defaultDose: 'ประคบบริเวณที่ปวดบวมหรือเคล็ดขัดยอก ครั้งละ 15-20 นาที' }
];

export default function AdminMedicalView({
  registrations = [],
  currentUser = null,
  onSelectApplicant,
  onUpdateAllocation,
  triggerToast
}) {
  // Medical dispense logs state
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Form states
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [medicineText, setMedicineText] = useState('');
  const [dosageText, setDosageText] = useState('');
  const [dispenserName, setDispenserName] = useState(() => {
    return currentUser?.name || currentUser?.display_name || currentUser?.nickname || 'อาสาพยาบาลสนาม (JRE 2027)';
  });
  const [medicalNotes, setMedicalNotes] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // QR Scanner mode
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const qrScannerRef = useRef(null);

  // Table filtering
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Image lightbox popup
  const [previewDoc, setPreviewDoc] = useState(null);

  // Load logs on mount
  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const data = await DataService.getMedicalDispenseLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching medical logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered participants list for search autocomplete
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return registrations.filter(r => {
      const name = `${r.first_name || ''} ${r.last_name || ''} ${r.nickname || ''} ${r.callsign || ''}`.toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const room = (r.room_assigned || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || room.includes(q);
    }).slice(0, 8);
  }, [registrations, searchQuery]);

  // Handle select recipient
  const handleSelectRecipient = (reg) => {
    const nameData = resolvePersonFullNameWithTitle(reg);
    const uni = resolveUniversityInfo(reg.institution);
    const photo = getParticipantPhoto(reg);
    const med = getApplicantMedical(reg);
    const alg = getApplicantAllergy(reg);
    const requestedEquipment = getMedicalEquipmentNeeded(reg);

    setSelectedRecipient({
      raw: reg,
      id: reg.id || reg.user_id,
      name: nameData.fullName,
      nickname: reg.nickname || '-',
      callsign: normalizeCallsignSpacing(reg.callsign || '-'),
      phone: reg.phone || '-',
      institution: uni.shortTag,
      room: reg.room_assigned || 'ไม่พักหอ (มมส)',
      blood: reg.blood_group || '-',
      medical: med || 'ไม่มี',
      hasMed: hasMedicalCondition(reg),
      allergy: alg || 'ไม่มี',
      hasAlg: hasFoodOrDrugAllergy(reg),
      requestedEquipment,
      photo
    });
    setSearchQuery('');
  };

  // QR Code Scanner Handlers
  const startScanner = async () => {
    setIsScanning(true);
    setScannerError('');
    setTimeout(async () => {
      try {
        const qr = new Html5Qrcode('medical-qr-reader-region');
        qrScannerRef.current = qr;
        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleQrSuccess(decodedText);
            stopScanner();
          },
          () => {}
        );
      } catch (err) {
        console.warn('QR scanner start error:', err);
        setScannerError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้องในเบราว์เซอร์');
        setIsScanning(false);
      }
    }, 200);
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(() => {}).finally(() => {
        qrScannerRef.current = null;
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  const handleQrSuccess = (text) => {
    // Attempt matching decoded QR code with registrations by ID, user_id, phone, or name
    const clean = text.trim();
    const matched = registrations.find(r => 
      r.id === clean || 
      r.user_id === clean || 
      (clean.includes(r.id) || clean.includes(r.user_id)) ||
      (r.phone && clean.includes(r.phone)) ||
      (r.callsign && clean.toLowerCase().includes(r.callsign.toLowerCase())) ||
      (r.first_name && clean.includes(r.first_name))
    );

    if (matched) {
      handleSelectRecipient(matched);
      if (triggerToast) triggerToast(`✓ สแกน QR สำเร็จ: พบข้อมูล ${matched.first_name} ${matched.last_name || ''}`, 'success');
    } else {
      if (triggerToast) triggerToast('⚠️ ไม่พบรายชื่อผู้เข้าร่วมที่ตรงกับ QR Code นี้ในฐานข้อมูล', 'warning');
    }
  };

  // Preset button clicks
  const handleAddSymptom = (sym) => {
    if (!symptomText) {
      setSymptomText(sym);
    } else if (!symptomText.includes(sym)) {
      setSymptomText(prev => `${prev}, ${sym}`);
    }
  };

  const handleAddMedicine = (medObj) => {
    if (!medicineText) {
      setMedicineText(medObj.name);
      setDosageText(medObj.defaultDose);
    } else if (!medicineText.includes(medObj.name)) {
      setMedicineText(prev => `${prev} + ${medObj.name}`);
      setDosageText(prev => `${prev} | ${medObj.defaultDose}`);
    }
  };

  // Submit Dispensing
  const handleSaveDispense = async (e) => {
    e?.preventDefault();
    if (!selectedRecipient) {
      if (triggerToast) triggerToast('กรุณาเลือกผู้รับยาก่อนทำการบันทึก', 'warning');
      return;
    }
    if (!symptomText.trim()) {
      if (triggerToast) triggerToast('กรุณาระบุอาการหรือเหตุผลในการขอยา', 'warning');
      return;
    }
    if (!medicineText.trim()) {
      if (triggerToast) triggerToast('กรุณาระบุรายการยาหรือเวชภัณฑ์ที่จ่าย', 'warning');
      return;
    }
    if (!dispenserName.trim()) {
      if (triggerToast) triggerToast('กรุณาระบุชื่อ-นามสกุล หรือ นามเรียกขาน ของผู้เบิกจ่ายยา', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const logEntry = {
        recipient_id: selectedRecipient.id,
        recipient_name: selectedRecipient.name,
        recipient_nickname: selectedRecipient.nickname,
        recipient_callsign: selectedRecipient.callsign,
        recipient_institution: selectedRecipient.institution,
        recipient_room: selectedRecipient.room,
        recipient_blood: selectedRecipient.blood,
        recipient_known_allergies: selectedRecipient.allergy,
        recipient_chronic_diseases: selectedRecipient.medical,
        recipient_photo: selectedRecipient.photo,
        symptoms: symptomText.trim(),
        medicines_dispensed: medicineText.trim(),
        dosage_instruction: dosageText.trim(),
        dispenser_name: dispenserName.trim(),
        medical_notes: medicalNotes.trim(),
        dispensed_at: customDateTime ? new Date(customDateTime).toISOString() : new Date().toISOString()
      };

      await DataService.saveMedicalDispenseLog(logEntry);
      await fetchLogs();

      // Reset form fields
      setSymptomText('');
      setMedicineText('');
      setDosageText('');
      setMedicalNotes('');
      setCustomDateTime('');
      setSelectedRecipient(null);

      if (triggerToast) {
        triggerToast(`✓ บันทึกการจ่ายยาให้ ${logEntry.recipient_name} เข้าเวชระเบียนเรียบร้อยแล้ว`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการบันทึกเวชระเบียน', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (id, name) => {
    if (!window.confirm(`ต้องการลบบันทึกเวชระเบียนของ "${name}" ใช่หรือไม่?`)) return;
    try {
      await DataService.deleteMedicalDispenseLog(id);
      await fetchLogs();
      if (triggerToast) triggerToast('ลบบันทึกเวชระเบียนเรียบร้อยแล้ว', 'info');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการลบบันทึก', 'error');
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!logSearchQuery.trim()) return logs;
    const q = logSearchQuery.toLowerCase().trim();
    return logs.filter(l => {
      const recipient = `${l.recipient_name || ''} ${l.recipient_nickname || ''} ${l.recipient_callsign || ''}`.toLowerCase();
      const sym = (l.symptoms || '').toLowerCase();
      const med = (l.medicines_dispensed || '').toLowerCase();
      const dispenser = (l.dispenser_name || '').toLowerCase();
      return recipient.includes(q) || sym.includes(q) || med.includes(q) || dispenser.includes(q);
    });
  }, [logs, logSearchQuery]);

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (logs.length === 0) {
      if (triggerToast) triggerToast('ยังไม่มีข้อมูลการเบิกจ่ายยาในระบบ', 'warning');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ฝ่ายพยาบาลและเวชระเบียน JRE 2027';
      const sheet = workbook.addWorksheet('บันทึกการเบิกจ่ายยา_JRE2027');

      sheet.addRow(['บัญชีบันทึกการเบิกจ่ายยาและเวชระเบียนสนาม โครงการ Joint Response Exercise (JRE 2027)']);
      sheet.addRow([`ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')} • รวมทั้งสิ้น ${logs.length} รายการ`]);
      sheet.addRow([]);

      sheet.addRow([
        'ลำดับ',
        'วันเวลาที่เบิกจ่าย',
        'ชื่อ - สกุล ผู้รับยา',
        'ชื่อเล่น',
        'นามเรียกขาน',
        'สถาบัน',
        'ห้องพัก',
        'กรุ๊ปเลือด',
        'โรคประจำตัว',
        'ประวัติแพ้ยา/อาหาร',
        'อาการ / ข้อบ่งใช้',
        'รายการยาและเวชภัณฑ์ที่จ่าย',
        'วิธีใช้ / ขนาดยา',
        'ชื่อผู้จ่ายยา (นามเรียกขาน)',
        'หมายเหตุ / คำแนะนำ'
      ]);

      logs.forEach((l, idx) => {
        sheet.addRow([
          idx + 1,
          new Date(l.dispensed_at || l.created_at).toLocaleString('th-TH'),
          l.recipient_name,
          l.recipient_nickname || '-',
          l.recipient_callsign || '-',
          l.recipient_institution || '-',
          l.recipient_room || '-',
          l.recipient_blood || '-',
          l.recipient_chronic_diseases || 'ไม่มี',
          l.recipient_known_allergies || 'ไม่มี',
          l.symptoms,
          l.medicines_dispensed,
          l.dosage_instruction || '-',
          l.dispenser_name,
          l.medical_notes || '-'
        ]);
      });

      // Style header
      sheet.getRow(4).font = { bold: true };
      sheet.columns.forEach(col => { col.width = 18; });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `บันทึกการเบิกจ่ายยา_เวชระเบียน_JRE2027_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      if (triggerToast) triggerToast('✓ ส่งออกไฟล์ Excel เวชระเบียนเรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (logs.length === 0) {
      if (triggerToast) triggerToast('ยังไม่มีข้อมูลการเบิกจ่ายยาในระบบ', 'warning');
      return;
    }

    let csv = '\uFEFFลำดับ,วันเวลา,ผู้รับยา,ชื่อเล่น,นามเรียกขาน,สถาบัน,ห้อง,กรุ๊ปเลือด,โรคประจำตัว,แพ้,อาการ,ยาที่จ่าย,วิธีใช้,ผู้จ่ายยา,หมายเหตุ\n';
    logs.forEach((l, idx) => {
      const dt = `"${new Date(l.dispensed_at || l.created_at).toLocaleString('th-TH')}"`;
      const name = `"${l.recipient_name || ''}"`;
      const nick = `"${l.recipient_nickname || ''}"`;
      const call = `"${l.recipient_callsign || ''}"`;
      const inst = `"${l.recipient_institution || ''}"`;
      const room = `"${l.recipient_room || ''}"`;
      const blood = `"${l.recipient_blood || ''}"`;
      const med = `"${l.recipient_chronic_diseases || 'ไม่มี'}"`;
      const alg = `"${l.recipient_known_allergies || 'ไม่มี'}"`;
      const sym = `"${(l.symptoms || '').replace(/"/g, '""')}"`;
      const meds = `"${(l.medicines_dispensed || '').replace(/"/g, '""')}"`;
      const dose = `"${(l.dosage_instruction || '').replace(/"/g, '""')}"`;
      const dispenser = `"${(l.dispenser_name || '').replace(/"/g, '""')}"`;
      const note = `"${(l.medical_notes || '').replace(/"/g, '""')}"`;
      csv += `${idx + 1},${dt},${name},${nick},${call},${inst},${room},${blood},${med},${alg},${sym},${meds},${dose},${dispenser},${note}\n`;
    });
    downloadCsv(csv, `บันทึกการเบิกจ่ายยา_JRE2027.csv`);
    if (triggerToast) triggerToast('✓ ส่งออกไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
                <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
                <span>หน่วยพยาบาลสนาม • JRE 2027</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                ระบบเวชระเบียน & เบิกจ่ายยา (EMR)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🩺 บันทึกการขอยา & การเบิกจ่ายยาประจำโครงการ</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              สแกน QR Code จากบัตรประจำตัวผู้เข้าอบรม หรือค้นหาชื่อเพื่อบันทึกประวัติการรับยา ตรวจสอบการแพ้ยาเพื่อความปลอดภัย และเก็บประวัติเวชระเบียนที่ทั้งเจ้าตัวและทีมแพทย์สนามตรวจสอบได้ตลอด 24 ชม.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>พิมพ์รายงาน</span>
            </button>

            <button
              type="button"
              onClick={fetchLogs}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ยอดจ่ายยารวม</span>
              <Activity className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">{logs.length} ครั้ง</div>
            <span className="text-[10px] text-slate-400">บันทึกเวชระเบียน</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้ขอรับยา (คน)</span>
              <User className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-300 font-mono">
              {new Set(logs.map(l => l.recipient_id || l.recipient_name)).size} คน
            </div>
            <span className="text-[10px] text-sky-400 font-bold">จากผู้เข้าอบรมทั้งหมด</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้มีประวัติแพ้ยา/อาหาร</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">
              {registrations.filter(r => hasFoodOrDrugAllergy(r)).length} คน
            </div>
            <span className="text-[10px] text-amber-400">ระวังการสั่งจ่ายยา</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้มีโรคประจำตัว</span>
              <Stethoscope className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono">
              {registrations.filter(r => hasMedicalCondition(r)).length} คน
            </div>
            <span className="text-[10px] text-emerald-400">เฝ้าระวังต่อเนื่อง</span>
          </div>
        </div>
      </div>

      {/* DISPENSING FORM SECTION */}
      <div className="rounded-3xl bg-slate-900 border border-rose-500/30 p-5 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Stethoscope className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                ฟอร์มการเบิกจ่ายยาและบันทึกเวชระเบียน (Medical Dispensing Form)
              </h2>
              <p className="text-xs text-slate-400">
                สแกนบัตรหรือค้นหาชื่อผู้รับยา ระบุอาการ ยา และผู้จ่ายยาเพื่อบันทึกลงฐานข้อมูล
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: SELECT RECIPIENT (BY SEARCH OR QR SCAN) */}
        {!selectedRecipient ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 พิมพ์ชื่อ, ชื่อเล่น, นามเรียกขาน (เช่น TSI 2114), หรือเบอร์โทรศัพท์..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>

              {/* QR Scanner Trigger */}
              <button
                type="button"
                onClick={isScanning ? stopScanner : startScanner}
                className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isScanning 
                    ? 'bg-rose-700 hover:bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{isScanning ? '⏹️ ปิดกล้องสแกน' : '📷 สแกน QR บัตร'}</span>
              </button>
            </div>

            {/* QR Scanner Camera Viewport */}
            {isScanning && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
                  <span>📸 นำบัตร ID Card ของผู้เข้าอบรมมาส่องที่หน้ากล้อง...</span>
                  <button type="button" onClick={stopScanner} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div id="medical-qr-reader-region" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-indigo-500/50 bg-black min-h-[250px]"></div>
                {scannerError && (
                  <p className="text-xs text-rose-400 text-center font-bold">{scannerError}</p>
                )}
              </div>
            )}

            {/* Autocomplete Dropdown List */}
            {filteredParticipants.length > 0 && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-2xl">
                <div className="px-4 py-2 bg-slate-900/80 text-[11px] font-bold text-slate-400">
                  พบรายชื่อผู้เข้าอบรม {filteredParticipants.length} ท่าน (คลิกเพื่อเลือกผู้รับยา):
                </div>
                {filteredParticipants.map(reg => {
                  const nameData = resolvePersonFullNameWithTitle(reg);
                  const photo = getParticipantPhoto(reg);
                  const med = getApplicantMedical(reg);
                  const alg = getApplicantAllergy(reg);
                  const hasM = hasMedicalCondition(reg);
                  const hasA = hasFoodOrDrugAllergy(reg);

                  return (
                    <div
                      key={reg.id || reg.user_id}
                      onClick={() => handleSelectRecipient(reg)}
                      className="p-3 hover:bg-rose-950/20 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={(e) => {
                            if (photo) {
                              e.stopPropagation();
                              setPreviewDoc({ fileUrl: photo, title: nameData.fullName });
                            }
                          }}
                          className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0"
                          title="คลิกเพื่อดูรูปภาพแบบขยาย (Popup)"
                        >
                          {photo ? (
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                              {reg.first_name ? reg.first_name[0] : 'U'}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{nameData.fullName}</span>
                            {reg.nickname && <span className="text-amber-300">({reg.nickname})</span>}
                          </div>
                          <div className="text-[11px] text-sky-300 font-mono">
                            {normalizeCallsignSpacing(reg.callsign || '-')} • ห้อง: {reg.room_assigned || 'ไม่พักหอ'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasA && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            แพ้: {alg}
                          </span>
                        )}
                        {hasM && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            โรค: {med}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: SELECTED PATIENT INFO CARD WITH CRITICAL SAFETY ALERTS */
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-sky-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div 
                  onClick={() => {
                    if (selectedRecipient.photo) {
                      setPreviewDoc({ fileUrl: selectedRecipient.photo, title: selectedRecipient.name });
                    }
                  }}
                  className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-400/50 shadow-md shrink-0 cursor-pointer group relative"
                  title="คลิกดูภาพขยายแบบ Popup"
                >
                  {selectedRecipient.photo ? (
                    <img src={selectedRecipient.photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-lg">
                      {selectedRecipient.name[0]}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedRecipient.institution}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-sky-300 bg-sky-950 border border-sky-500/30">
                      ห้อง: {selectedRecipient.room}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-rose-300 bg-rose-950 border border-rose-500/30">
                      🩸 กรุ๊ปเลือด: {selectedRecipient.blood}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    {selectedRecipient.name} {selectedRecipient.nickname !== '-' && <span className="text-amber-300">({selectedRecipient.nickname})</span>}
                  </h3>
                  <p className="text-xs text-sky-300 font-mono">
                    นามเรียกขาน: <strong>{selectedRecipient.callsign}</strong> • โทร: {selectedRecipient.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecipient(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 self-end sm:self-center transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>เปลี่ยนผู้รับยา</span>
              </button>
            </div>

            {/* CRITICAL MEDICAL SAFETY WARNING BANNER */}
            {(selectedRecipient.hasAlg || selectedRecipient.hasMed || selectedRecipient.requestedEquipment) && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border-2 border-rose-500/60 text-xs space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>⚠️ ข้อควรระวังทางการแพทย์ (Medical & Allergy Precaution):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rose-100">
                  {selectedRecipient.hasAlg && (
                    <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40">
                      <span className="font-bold text-amber-300">⚠️ ประวัติแพ้ยา / แพ้อาหาร:</span>{' '}
                      <strong>{selectedRecipient.allergy}</strong>
                    </div>
                  )}

                  {selectedRecipient.hasMed && (
                    <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40">
                      <span className="font-bold text-rose-300">🩺 โรคประจำตัว / ข้อจำกัด:</span>{' '}
                      <strong>{selectedRecipient.medical}</strong>
                    </div>
                  )}
                </div>

                {selectedRecipient.requestedEquipment && (
                  <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-200">
                    <span className="font-bold text-purple-300">💡 สิ่งที่เจ้าตัวระบุขอเตรียมไว้ล่วงหน้า:</span>{' '}
                    <span>{selectedRecipient.requestedEquipment}</span>
                  </div>
                )}
              </div>
            )}

            {/* DISPENSE ENTRY FORM */}
            <form onSubmit={handleSaveDispense} className="space-y-4 pt-2">
              {/* 1. Symptoms */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  1. อาการเจ็บป่วย / ข้อบ่งใช้ในการขอยา (Symptoms / Chief Complaint): <span className="text-rose-400">*</span>
                </label>
                
                {/* Pre-set symptom chips */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {PRESET_SYMPTOMS.map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleAddSymptom(sym)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      + {sym}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  placeholder="ระบุอาการ เช่น มีไข้ 38.2 C, ปวดศีรษะตื้อๆ, บาดแผลถลอกที่ข้อศอกขวา..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* 2. Medicines Dispensed */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  2. รายการยาและเวชภัณฑ์ที่เบิกจ่าย (Medicines & Medical Supplies): <span className="text-rose-400">*</span>
                </label>

                {/* Pre-set medicine chips */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {PRESET_MEDICINES.map(med => (
                    <button
                      key={med.name}
                      type="button"
                      onClick={() => handleAddMedicine(med)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 transition-colors cursor-pointer"
                    >
                      + {med.name.split(' (')[0]}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={medicineText}
                  onChange={(e) => setMedicineText(e.target.value)}
                  placeholder="ระบุชื่อยาและจำนวน เช่น พาราเซตามอล 500mg 2 เม็ด, ผงเกลือแร่ ORS 1 ซอง..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* 3. Dosage & Instructions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  3. ขนาดยาและคำแนะนำวิธีรับประทาน (Dosage & Instructions):
                </label>
                <input
                  type="text"
                  value={dosageText}
                  onChange={(e) => setDosageText(e.target.value)}
                  placeholder="เช่น รับประทานครั้งละ 1 เม็ด หลังอาหารทันที ทุก 4-6 ชั่วโมง..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* 4. Dispenser & Date/Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-200">
                    4. ผู้เบิกจ่ายยา (ชื่อ - สกุล หรือ นามเรียกขาน): <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dispenserName}
                    onChange={(e) => setDispenserName(e.target.value)}
                    placeholder="เช่น อาสาพยาบาล มานะ (TSI 2110) หรือ ณัฐพล (STAFF)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-200">
                    5. วันเวลาที่เบิกจ่าย (ว่างไว้จะใช้วันเวลาปัจจุบัน):
                  </label>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5. Additional Medical Advice */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  6. คำแนะนำเพิ่มเติม / บันทึกการติดตามอาการ:
                </label>
                <textarea
                  rows={2}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="เช่น นัดดูอาการซ้ำอีก 4 ชม., หากไข้ไม่ลดให้แจ้งฝ่ายพยาบาลนำส่ง รพ.สต., ดื่มน้ำมากๆ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecipient(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึกเวชระเบียน...' : '💾 บันทึกการเบิกจ่ายยา (Confirm Dispense)'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* DISPENSE HISTORY LOG SECTION (EMR ARCHIVE) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-sky-400" />
              <span>ประวัติเวชระเบียนและการเบิกจ่ายยาทั้งหมด ({filteredLogs.length} รายการ)</span>
            </h3>
            <p className="text-xs text-slate-400">
              บันทึกการรักษาพยาบาลย้อนหลัง ตรวจสอบได้ทั้งชื่อผู้รับยา อาการ ยาที่จ่าย และผู้รับผิดชอบการจ่ายยา
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="ค้นหาในเวชระเบียน..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>

        {isLoadingLogs ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
            <span>กำลังโหลดข้อมูลเวชระเบียน...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-2xl border border-slate-800/80">
            ยังไม่มีประวัติการเบิกจ่ายยาในระบบ หรือไม่พบข้อมูลตามคำค้นหา
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-36">วันเวลา</th>
                  <th className="py-3 px-3 w-48">ผู้รับยา</th>
                  <th className="py-3 px-3 w-44">อาการ / ข้อบ่งใช้</th>
                  <th className="py-3 px-3">รายการยา & วิธีใช้</th>
                  <th className="py-3 px-3 w-40">ผู้จ่ายยา</th>
                  <th className="py-3 px-2 w-16 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                      {new Date(log.dispensed_at || log.created_at).toLocaleString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {log.recipient_photo && (
                          <div 
                            onClick={() => setPreviewDoc({ fileUrl: log.recipient_photo, title: log.recipient_name })}
                            className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 cursor-pointer"
                            title="คลิกดูภาพขยาย"
                          >
                            <img src={log.recipient_photo} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-xs">
                            {log.recipient_name} {log.recipient_nickname && <span className="text-amber-300 font-normal">({log.recipient_nickname})</span>}
                          </div>
                          <div className="text-[10px] text-sky-300 font-mono">
                            {log.recipient_callsign || '-'} • ห้อง: {log.recipient_room || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-amber-200">
                        {log.symptoms}
                      </div>
                    </td>

                    <td className="py-3 px-3 space-y-0.5">
                      <div className="font-bold text-emerald-300 flex items-center gap-1">
                        <span>💊 {log.medicines_dispensed}</span>
                      </div>
                      {log.dosage_instruction && (
                        <div className="text-[11px] text-slate-300 italic">
                          วิธีใช้: {log.dosage_instruction}
                        </div>
                      )}
                      {log.medical_notes && (
                        <div className="text-[10px] text-slate-400">
                          หมายเหตุ: {log.medical_notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-purple-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{log.dispenser_name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id, log.recipient_name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="ลบบันทึกนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DOCUMENT & PHOTO LIGHTBOX POPUP MODAL (NO OPENING IN NEW TAB) */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          doc={previewDoc}
        />
      )}
    </div>
  );
}
