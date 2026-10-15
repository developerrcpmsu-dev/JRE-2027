import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  Copy,
  Printer,
  Search,
  CheckCircle2,
  Users,
  Filter,
  Phone,
  Building,
  Tag,
  Download,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Check,
  ShieldCheck
} from 'lucide-react';
import ExcelJS from 'exceljs';
import {
  getApplicantMedical,
  getApplicantAllergy,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  getCateringCategory
} from '../data/defaultData';
import { getRegistrationCardData } from '../utils/idCard';

export default function CateringHealthView({
  registrations = [],
  onSelectApplicant,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all_restrictions'); // 'all_restrictions', 'allergy_only', 'medical_only', 'special_only', 'all_participants'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'seafood', 'vegetarian', 'halal', 'nutsOrDairy', 'drug'
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Grouped datasets
  const metrics = useMemo(() => {
    const all = registrations || [];
    const withAllergy = all.filter(r => hasFoodOrDrugAllergy(r));
    const withMedical = all.filter(r => hasMedicalCondition(r));
    const withSpecial = all.filter(r => Boolean(r.is_special_care || (r.special_notes && r.special_notes.trim() !== '')));
    const withAnyRestriction = all.filter(r => 
      hasFoodOrDrugAllergy(r) || hasMedicalCondition(r) || Boolean(r.is_special_care || (r.special_notes && r.special_notes.trim() !== ''))
    );

    // Dietary category breakdown
    const categories = {
      seafood: all.filter(r => {
        const a = getApplicantAllergy(r).toLowerCase();
        return a.includes('กุ้ง') || a.includes('ปู') || a.includes('ทะเล') || a.includes('seafood') || a.includes('หอย') || a.includes('หมึก');
      }),
      vegetarian: all.filter(r => {
        const a = getApplicantAllergy(r).toLowerCase();
        return a.includes('มังสวิรัติ') || a.includes('เจ') || a.includes('vegan') || a.includes('vegetarian');
      }),
      halal: all.filter(r => {
        const a = getApplicantAllergy(r).toLowerCase();
        return a.includes('ฮาลาล') || a.includes('อิสลาม') || a.includes('halal') || a.includes('มุสลิม');
      }),
      nutsOrDairy: all.filter(r => {
        const a = getApplicantAllergy(r).toLowerCase();
        return a.includes('ถั่ว') || a.includes('นม') || a.includes('ไข่') || a.includes('peanut') || a.includes('dairy');
      }),
      drug: all.filter(r => {
        const a = getApplicantAllergy(r).toLowerCase();
        return a.includes('ยา') || a.includes('penicillin') || a.includes('เพนนิซิลิน') || a.includes('พารา');
      })
    };

    return {
      total: all.length,
      withAllergy,
      withMedical,
      withSpecial,
      withAnyRestriction,
      categories
    };
  }, [registrations]);

  // Filtered list
  const filteredList = useMemo(() => {
    let base = [];
    if (activeFilter === 'allergy_only') {
      base = metrics.withAllergy;
    } else if (activeFilter === 'medical_only') {
      base = metrics.withMedical;
    } else if (activeFilter === 'special_only') {
      base = metrics.withSpecial;
    } else if (activeFilter === 'all_participants') {
      base = registrations || [];
    } else {
      // all_restrictions
      base = metrics.withAnyRestriction;
    }

    // Apply category sub-filter if selected
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'seafood') base = base.filter(r => metrics.categories.seafood.includes(r));
      else if (categoryFilter === 'vegetarian') base = base.filter(r => metrics.categories.vegetarian.includes(r));
      else if (categoryFilter === 'halal') base = base.filter(r => metrics.categories.halal.includes(r));
      else if (categoryFilter === 'nutsOrDairy') base = base.filter(r => metrics.categories.nutsOrDairy.includes(r));
      else if (categoryFilter === 'drug') base = base.filter(r => metrics.categories.drug.includes(r));
    }

    if (!searchTerm.trim()) return base;
    const q = searchTerm.toLowerCase().trim();

    return base.filter(r => {
      const name = `${r.first_name || ''} ${r.last_name || ''} ${r.nickname || ''} ${r.callsign || ''}`.toLowerCase();
      const inst = (r.institution || '').toLowerCase();
      const med = getApplicantMedical(r).toLowerCase();
      const allergy = getApplicantAllergy(r).toLowerCase();
      const notes = (r.special_notes || '').toLowerCase();
      const group = (r.group_assigned || '').toLowerCase();
      const room = (r.room_assigned || '').toLowerCase();

      return (
        name.includes(q) ||
        inst.includes(q) ||
        med.includes(q) ||
        allergy.includes(q) ||
        notes.includes(q) ||
        group.includes(q) ||
        room.includes(q)
      );
    });
  }, [registrations, activeFilter, categoryFilter, searchTerm, metrics]);

  // Copy structured LINE report for catering & welfare teams
  const handleCopyLineReport = () => {
    const now = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
    let text = `📋 [สรุปข้อมูลจัดเตรียมอาหารและสุขภาวะ JRE 2027]\n`;
    text += `📅 ข้อมูลอัปเดต ณ วันที่ ${now}\n`;
    text += `----------------------------------------\n`;
    text += `👥 ผู้สมัครทั้งหมด: ${metrics.total} คน\n`;
    text += `🍽️ ผู้มีประวัติแพ้อาหาร/ยา/ข้อจำกัดอาหาร: ${metrics.withAllergy.length} คน\n`;
    text += `🩺 ผู้มีโรคประจำตัว/ข้อจำกัดทางกาย: ${metrics.withMedical.length} คน\n`;
    text += `⭐ ผู้ที่ต้องดูแลพิเศษ: ${metrics.withSpecial.length} คน\n\n`;

    if (metrics.categories.seafood.length > 0) text += `🦐 แพ้อาหารทะเล/กุ้ง/ปู: ${metrics.categories.seafood.length} คน\n`;
    if (metrics.categories.vegetarian.length > 0) text += `🥗 มังสวิรัติ/เจ: ${metrics.categories.vegetarian.length} คน\n`;
    if (metrics.categories.halal.length > 0) text += `☪️ อาหารฮาลาล (อิสลาม): ${metrics.categories.halal.length} คน\n`;
    if (metrics.categories.nutsOrDairy.length > 0) text += `🥜 แพ้ถั่ว/ไข่/นม: ${metrics.categories.nutsOrDairy.length} คน\n`;
    if (metrics.categories.drug.length > 0) text += `💊 แพ้ยา: ${metrics.categories.drug.length} คน\n`;

    text += `\n========================================\n`;
    text += `🍽️ 1. รายชื่อผู้มีข้อจำกัดด้านอาหาร & แพ้ยา (${metrics.withAllergy.length} คน):\n`;
    if (metrics.withAllergy.length === 0) {
      text += `(ไม่มีผู้แจ้งประวัติแพ้อาหารหรือยา)\n`;
    } else {
      metrics.withAllergy.forEach((r, idx) => {
        const nick = r.nickname ? ` (${r.nickname})` : '';
        text += `${idx + 1}. ${r.first_name || ''} ${r.last_name || ''}${nick} [${r.institution || '-'}]\n`;
        text += `   - 🍽️ แพ้/ข้อจำกัด: ${getApplicantAllergy(r)}\n`;
        text += `   - 📞 โทร: ${r.phone || '-'} | กลุ่ม: ${r.group_assigned || 'ยังไม่จัด'} | ห้อง: ${r.room_assigned || 'ยังไม่จัด'}\n`;
      });
    }

    text += `\n========================================\n`;
    text += `🩺 2. รายชื่อผู้มีโรคประจำตัว & ข้อจำกัดทางกาย (${metrics.withMedical.length} คน):\n`;
    if (metrics.withMedical.length === 0) {
      text += `(ไม่มีผู้แจ้งโรคประจำตัว)\n`;
    } else {
      metrics.withMedical.forEach((r, idx) => {
        const nick = r.nickname ? ` (${r.nickname})` : '';
        text += `${idx + 1}. ${r.first_name || ''} ${r.last_name || ''}${nick} [${r.institution || '-'}]\n`;
        text += `   - 🩺 โรคประจำตัว: ${getApplicantMedical(r)}\n`;
        text += `   - 📞 โทร: ${r.phone || '-'} | กลุ่ม: ${r.group_assigned || 'ยังไม่จัด'} | ห้อง: ${r.room_assigned || 'ยังไม่จัด'}\n`;
      });
    }

    if (metrics.withSpecial.length > 0) {
      text += `\n========================================\n`;
      text += `⭐ 3. ผู้ที่ต้องได้รับการดูแลเป็นพิเศษ (${metrics.withSpecial.length} คน):\n`;
      metrics.withSpecial.forEach((r, idx) => {
        text += `${idx + 1}. ${r.first_name || ''} ${r.last_name || ''} [${r.institution || '-'}]\n`;
        text += `   - ⚠️ หมายเหตุพิเศษ: ${r.special_notes || 'ดูแลพิเศษ'}\n`;
      });
    }

    text += `\n----------------------------------------\n`;
    text += `ระบบบริหารจัดการโครงการ Joint Response Exercise (JRE 2027)\n`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Export dedicated Catering & Medical Excel sheet
  const handleExportCateringExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'JRE 2027 Catering & Safety Hub';
      workbook.lastModifiedBy = 'JRE 2027 Admin';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('รายการอาหารและสุขภาวะ', {
        views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
      });

      worksheet.columns = [
        { header: 'ลำดับ', key: 'index', width: 8 },
        { header: 'ชื่อ-สกุล', key: 'name', width: 26 },
        { header: 'ชื่อเล่น', key: 'nickname', width: 14 },
        { header: 'นามเรียกขาน', key: 'callsign', width: 16 },
        { header: 'สังกัด / หน่วยงาน', key: 'institution', width: 28 },
        { header: 'เบอร์โทรศัพท์', key: 'phone', width: 16 },
        { header: 'กลุ่มฝึกที่จัดสรร', key: 'group_assigned', width: 18 },
        { header: 'ห้องนอนที่จัดสรร', key: 'room_assigned', width: 18 },
        { header: 'ประวัติแพ้อาหาร / ยา / มังสวิรัติ', key: 'food_allergy', width: 32 },
        { header: 'โรคประจำตัว / ข้อจำกัดทางกาย', key: 'medical_history', width: 32 },
        { header: 'การดูแลพิเศษ', key: 'special_care', width: 16 },
        { header: 'หมายเหตุพิเศษ', key: 'special_notes', width: 30 }
      ];

      // Header style
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF92400E' } // deep amber-800
        };
        cell.font = { name: 'Sarabun', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Rows
      filteredList.forEach((r, idx) => {
        const med = getApplicantMedical(r) || 'ไม่มี';
        const allergy = getApplicantAllergy(r) || 'ไม่มี';
        const hasMed = hasMedicalCondition(r);
        const hasAllergy = hasFoodOrDrugAllergy(r);

        const row = worksheet.addRow({
          index: idx + 1,
          name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || '-',
          nickname: r.nickname || '-',
          callsign: r.callsign || '-',
          institution: r.institution || '-',
          phone: r.phone || '-',
          group_assigned: r.group_assigned || 'ยังไม่จัดกลุ่ม',
          room_assigned: r.room_assigned || 'ยังไม่จัดห้อง',
          food_allergy: allergy,
          medical_history: med,
          special_care: r.is_special_care ? 'ใช่ (ดูแลพิเศษ)' : 'ปกติ',
          special_notes: r.special_notes || '-'
        });

        row.height = 24;

        // Highlight cells
        const foodCell = row.getCell('food_allergy');
        if (hasAllergy) {
          foodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          foodCell.font = { name: 'Sarabun', size: 10, bold: true, color: { argb: 'FF92400E' } };
        }

        const medCell = row.getCell('medical_history');
        if (hasMed) {
          medCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
          medCell.font = { name: 'Sarabun', size: 10, bold: true, color: { argb: 'FF9F1239' } };
        }

        const specialCell = row.getCell('special_care');
        if (r.is_special_care) {
          specialCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
          specialCell.font = { name: 'Sarabun', size: 10, bold: true, color: { argb: 'FF6B21A8' } };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JRE2027_ข้อมูลจัดเตรียมอาหารและสุขภาวะ_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          header, nav, footer, .no-print { display: none !important; }
          .print-clean { background: white !important; color: black !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          .print-header { display: block !important; margin-bottom: 20px; text-align: center; }
          .print-table { width: 100% !important; border-collapse: collapse !important; color: black !important; }
          .print-table th, .print-table td { border: 1px solid #333 !important; padding: 6px !important; font-size: 11px !important; }
        }
      `}</style>

      {/* Page Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/40 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/50">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                ศูนย์ข้อมูลจัดเตรียมอาหาร & สุขภาวะ (Catering & Health Hub)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                JRE 2027 Welfare & Safety
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                URL: /admin/catering
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              ตรวจสอบข้อจำกัดอาหาร แพ้ยา โรคประจำตัว เพื่อจัดเตรียมอาหารว่าง ข้าวกล่อง และดูแลความปลอดภัยได้อย่างถูกต้อง 100%
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto no-print">
          <button
            type="button"
            onClick={handleCopyLineReport}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="คัดลอกสรุปรายการอาหารสำหรับส่ง LINE ฝ่ายสวัสดิการและจัดเลี้ยง"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
            <span>{copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกส่ง LINE'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCateringExcel}
            disabled={isExporting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="ส่งออกตาราง Excel ข้อมูลอาหารและสุขภาพ (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'กำลังส่งออก...' : 'ส่งออก Excel'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="พิมพ์รายการสำหรับฝ่ายครัว / ปฐมพยาบาล"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์เอกสาร</span>
          </button>

          {typeof onRefresh === 'function' && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="รีเฟรชดึงข้อมูลล่าสุด"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">ผู้สมัครทั้งหมด</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">
            {metrics.total} <span className="text-xs font-normal text-slate-400">คน</span>
          </p>
          <div className="text-[10px] text-slate-500 mt-0.5">ผู้สมัครโครงการ JRE 2027</div>
        </div>

        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">แพ้อาหาร / แพ้ยา</span>
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1.5">
            {metrics.withAllergy.length} <span className="text-xs font-normal text-amber-200">คน</span>
          </p>
          <div className="text-[10px] text-amber-300/80 mt-0.5">ต้องจัดเตรียมอาหารเฉพาะ</div>
        </div>

        <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300">มีโรคประจำตัว</span>
            <Stethoscope className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1.5">
            {metrics.withMedical.length} <span className="text-xs font-normal text-rose-200">คน</span>
          </p>
          <div className="text-[10px] text-rose-300/80 mt-0.5">สำหรับทีมแพทย์และฝึกซ้อม</div>
        </div>

        <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300">ดูแลเป็นพิเศษ</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-1.5">
            {metrics.withSpecial.length} <span className="text-xs font-normal text-purple-200">คน</span>
          </p>
          <div className="text-[10px] text-purple-300/80 mt-0.5">ระบุหมายเหตุพิเศษ</div>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            จำแนกกลุ่มอาหาร:
          </span>

          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ทุกกลุ่ม
          </button>

          {metrics.categories.seafood.length > 0 && (
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'seafood' ? 'all' : 'seafood')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                categoryFilter === 'seafood'
                  ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-400'
                  : 'bg-orange-950/40 text-orange-300 border border-orange-500/30 hover:border-orange-500/60'
              }`}
            >
              🦐 แพ้อาหารทะเล / กุ้ง ({metrics.categories.seafood.length})
            </button>
          )}

          {metrics.categories.vegetarian.length > 0 && (
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'vegetarian' ? 'all' : 'vegetarian')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                categoryFilter === 'vegetarian'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60'
              }`}
            >
              🥗 มังสวิรัติ / เจ ({metrics.categories.vegetarian.length})
            </button>
          )}

          {metrics.categories.halal.length > 0 && (
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'halal' ? 'all' : 'halal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                categoryFilter === 'halal'
                  ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-400'
                  : 'bg-teal-950/40 text-teal-300 border border-teal-500/30 hover:border-teal-500/60'
              }`}
            >
              ☪️ ฮาลาล (อิสลาม) ({metrics.categories.halal.length})
            </button>
          )}

          {metrics.categories.nutsOrDairy.length > 0 && (
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'nutsOrDairy' ? 'all' : 'nutsOrDairy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                categoryFilter === 'nutsOrDairy'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:border-amber-500/60'
              }`}
            >
              🥜 แพ้ถั่ว / ไข่ / นม ({metrics.categories.nutsOrDairy.length})
            </button>
          )}

          {metrics.categories.drug.length > 0 && (
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'drug' ? 'all' : 'drug')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                categoryFilter === 'drug'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:border-rose-500/60'
              }`}
            >
              💊 แพ้ยา ({metrics.categories.drug.length})
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          แสดงผล {filteredList.length} จากทั้งหมด {metrics.total} คน
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all_restrictions')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all_restrictions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            มีข้อจำกัดทั้งหมด ({metrics.withAnyRestriction.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('allergy_only')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'allergy_only'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-amber-400/80 hover:text-amber-300 border border-slate-800'
            }`}
          >
            🍽️ แพ้อาหาร/ยา ({metrics.withAllergy.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('medical_only')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'medical_only'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-950 text-rose-400/80 hover:text-rose-300 border border-slate-800'
            }`}
          >
            🩺 โรคประจำตัว ({metrics.withMedical.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('special_only')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'special_only'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-indigo-400/80 hover:text-indigo-300 border border-slate-800'
            }`}
          >
            ⭐ ดูแลพิเศษ ({metrics.withSpecial.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('all_participants')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all_participants'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
            }`}
          >
            ผู้สมัครทุกคน ({metrics.total})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, สังกัด, กลุ่ม, อาหารที่แพ้..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Table / Cards List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl print-clean">
        
        {/* Printable Header (Visible only on print) */}
        <div className="hidden print-header">
          <h2 className="text-xl font-bold">โครงการ Joint Response Exercise (JRE 2027)</h2>
          <h3 className="text-base font-semibold">สรุปข้อมูลจัดเตรียมอาหาร & สุขภาวะ (Catering & Welfare List)</h3>
          <p className="text-xs text-gray-600">
            พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')} • จำนวนผู้มีข้อจำกัด: {filteredList.length} คน
          </p>
          <hr className="my-3" />
        </div>

        {filteredList.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-300">
              {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ไม่มีรายการผู้สมัครในหมวดหมู่นี้'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              ผู้สมัครทุกคนในหมวดนี้มีสุขภาพร่างกายปกติ และไม่มีการแจ้งประวัติการแพ้อาหารหรือยา
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((reg, index) => {
              const cardData = getRegistrationCardData(reg);
              const medText = getApplicantMedical(reg);
              const allergyText = getApplicantAllergy(reg);
              const hasMed = hasMedicalCondition(reg);
              const hasAllergy = hasFoodOrDrugAllergy(reg);
              const hasSpecial = Boolean(reg.is_special_care || reg.special_notes);

              return (
                <div
                  key={reg.id || reg.user_id || index}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    hasAllergy && hasMed
                      ? 'bg-gradient-to-r from-amber-950/20 via-slate-950 to-rose-950/20 border-amber-500/40 shadow-md'
                      : hasAllergy
                      ? 'bg-amber-950/15 border-amber-500/30'
                      : hasMed
                      ? 'bg-rose-950/15 border-rose-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Trainee Identity */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="text-xs font-mono font-bold text-slate-500 pt-1 w-6 text-center shrink-0">
                        #{index + 1}
                      </div>

                      {reg.id_card_photo ? (
                        <img
                          src={reg.id_card_photo}
                          alt="ID"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 shadow"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
                          {reg.first_name ? reg.first_name[0] : 'U'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm sm:text-base">
                            {reg.first_name} {reg.last_name}
                          </span>
                          {reg.nickname && (
                            <span className="text-amber-300 font-bold text-xs sm:text-sm">
                              ({reg.nickname})
                            </span>
                          )}
                          {reg.callsign && (
                            <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-mono font-bold">
                              📡 {reg.callsign}
                            </span>
                          )}
                          {reg.is_special_care && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-black animate-pulse">
                              ⭐ ดูแลพิเศษ
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          {cardData.affiliation} • {cardData.unit}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
                          {reg.phone && (
                            <a
                              href={`tel:${reg.phone}`}
                              className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" /> {reg.phone}
                            </a>
                          )}
                          <span className="text-indigo-300 font-semibold flex items-center gap-1">
                            กลุ่มฝึก: <span className="text-white font-bold">{reg.group_assigned || 'ยังไม่จัดกลุ่ม'}</span>
                          </span>
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-amber-400" />
                            ห้องนอน: <span className="text-white font-bold">{reg.room_assigned || 'ยังไม่จัดห้อง'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Manage Button */}
                    {typeof onSelectApplicant === 'function' && (
                      <button
                        type="button"
                        onClick={() => onSelectApplicant(reg)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all self-end md:self-start flex items-center gap-1.5 shrink-0 cursor-pointer no-print"
                      >
                        <span>จัดการ / แก้ไขข้อมูล</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Health & Food Restrictions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    {/* Food Allergy & Diet */}
                    <div className={`p-3 rounded-xl border ${
                      hasAllergy 
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-sm' 
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <UtensilsCrossed className={`w-4 h-4 ${hasAllergy ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className={hasAllergy ? 'text-amber-300' : 'text-slate-400'}>
                          ประวัติแพ้อาหาร / แพ้ยา / มังสวิรัติ:
                        </span>
                      </div>
                      <p className={`font-semibold text-xs sm:text-sm pl-5 ${hasAllergy ? 'text-amber-100' : 'text-slate-500'}`}>
                        {hasAllergy ? allergyText : 'ไม่มีประวัติแพ้ยาหรืออาหาร (รับประทานอาหารได้ทั่วไป)'}
                      </p>
                    </div>

                    {/* Medical Condition */}
                    <div className={`p-3 rounded-xl border ${
                      hasMed 
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-sm' 
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Stethoscope className={`w-4 h-4 ${hasMed ? 'text-rose-400' : 'text-slate-500'}`} />
                        <span className={hasMed ? 'text-rose-300' : 'text-slate-400'}>
                          โรคประจำตัว / ข้อจำกัดทางกาย:
                        </span>
                      </div>
                      <p className={`font-semibold text-xs sm:text-sm pl-5 ${hasMed ? 'text-rose-100' : 'text-slate-500'}`}>
                        {hasMed ? medText : 'ไม่มีโรคประจำตัวหรือข้อจำกัดทางกาย (ร่างกายปกติ)'}
                      </p>
                    </div>
                  </div>

                  {/* Special Care Notes (if any) */}
                  {hasSpecial && reg.special_notes && (
                    <div className="mt-2.5 p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-300">หมายเหตุการดูแลพิเศษ:</span> {reg.special_notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
