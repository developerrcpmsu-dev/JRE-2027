import React, { useState, useMemo } from 'react';
import {
  X,
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
  ChevronRight
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import {
  getApplicantMedical,
  getApplicantAllergy,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  getCateringCategory
} from '../data/defaultData';
import { getRegistrationCardData } from '../utils/idCard';

export default function CateringHealthModal({
  isOpen,
  onClose,
  registrations = [],
  onSelectApplicant
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all_restrictions'); // 'all_restrictions', 'allergy_only', 'medical_only', 'special_only', 'all_participants'
  const [copied, setCopied] = useState(false);

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
  }, [registrations, activeFilter, searchTerm, metrics]);

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

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    ศูนย์ข้อมูลจัดเตรียมอาหาร & สุขภาวะ (Catering & Health Hub)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    JRE 2027 Welfare & Safety
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ตรวจสอบข้อจำกัดอาหาร แพ้ยา โรคประจำตัว เพื่อจัดเตรียมอาหารว่าง ข้าวกล่อง และดูแลความปลอดภัยได้อย่างถูกต้อง 100%
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 shrink-0 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
                <span className="text-[11px] text-slate-400 block font-medium">ผู้สมัครทั้งหมด</span>
                <span className="text-xl font-black text-white">{metrics.total} <span className="text-xs font-normal text-slate-400">คน</span></span>
              </div>
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                <span className="text-[11px] text-amber-300 block font-bold flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                  แพ้อาหาร / ยา
                </span>
                <span className="text-xl font-black text-amber-400">{metrics.withAllergy.length} <span className="text-xs font-normal text-amber-200">คน</span></span>
              </div>
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl">
                <span className="text-[11px] text-rose-300 block font-bold flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                  มีโรคประจำตัว
                </span>
                <span className="text-xl font-black text-rose-400">{metrics.withMedical.length} <span className="text-xs font-normal text-rose-200">คน</span></span>
              </div>
              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl">
                <span className="text-[11px] text-purple-300 block font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                  ดูแลเป็นพิเศษ
                </span>
                <span className="text-xl font-black text-purple-400">{metrics.withSpecial.length} <span className="text-xs font-normal text-purple-200">คน</span></span>
              </div>
            </div>

            {/* Sub Dietary Categories Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] text-slate-400 font-bold mr-1">จำแนกตามประเภท:</span>
              {metrics.categories.seafood.length > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold flex items-center gap-1">
                  🦐 แพ้อาหารทะเล/กุ้ง ({metrics.categories.seafood.length})
                </span>
              )}
              {metrics.categories.vegetarian.length > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  🥗 มังสวิรัติ/เจ ({metrics.categories.vegetarian.length})
                </span>
              )}
              {metrics.categories.halal.length > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold flex items-center gap-1">
                  ☪️ ฮาลาล (อิสลาม) ({metrics.categories.halal.length})
                </span>
              )}
              {metrics.categories.nutsOrDairy.length > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                  🥜 แพ้ถั่ว/นม/ไข่ ({metrics.categories.nutsOrDairy.length})
                </span>
              )}
              {metrics.categories.drug.length > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                  💊 แพ้ยา ({metrics.categories.drug.length})
                </span>
              )}
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all_restrictions')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'all_participants'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                ทุกคน ({metrics.total})
              </button>
            </div>

            {/* Search & Export Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, สังกัด, ข้อจำกัด..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLineReport}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow cursor-pointer active:scale-95"
                title="คัดลอกสรุปรายการอาหารสำหรับส่ง LINE ฝ่ายสวัสดิการและจัดเลี้ยง"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกส่ง LINE'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition-all shrink-0 cursor-pointer"
                title="พิมพ์รายการสำหรับฝ่ายครัว / ปฐมพยาบาล"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table List View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {filteredList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                  <UtensilsCrossed className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-300">
                  {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ไม่มีรายการผู้สมัครในหมวดหมู่นี้'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  ผู้สมัครทุกคนในกลุ่มนี้มีสุขภาพร่างกายปกติ และไม่มีการแจ้งประวัติการแพ้อาหารหรือยา
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
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
                      className={`p-4 rounded-2xl border transition-all ${
                        hasAllergy && hasMed
                          ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-rose-950/20 border-amber-500/30 hover:border-amber-500/50'
                          : hasAllergy
                          ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                          : hasMed
                          ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Profile Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          {reg.id_card_photo ? (
                            <img
                              src={reg.id_card_photo}
                              alt="ID"
                              className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0 shadow"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
                              {reg.first_name ? reg.first_name[0] : 'U'}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">
                                {reg.first_name} {reg.last_name}
                              </span>
                              {reg.nickname && (
                                <span className="text-amber-300 font-bold text-xs">
                                  ({reg.nickname})
                                </span>
                              )}
                              {reg.callsign && (
                                <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-mono font-bold">
                                  📡 {reg.callsign}
                                </span>
                              )}
                              {reg.is_special_care && (
                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-black">
                                  ⭐ ดูแลพิเศษ
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {cardData.affiliation} • {cardData.unit}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                              {reg.phone && (
                                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {reg.phone}
                                </span>
                              )}
                              <span className="text-indigo-300 font-semibold">
                                กลุ่ม: <span className="text-white font-bold">{reg.group_assigned || 'ยังไม่จัดกลุ่ม'}</span>
                              </span>
                              <span className="text-amber-300 font-semibold">
                                ห้องนอน: <span className="text-white font-bold">{reg.room_assigned || 'ยังไม่จัดห้อง'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Button open full profile */}
                        {onSelectApplicant && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectApplicant(reg);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all self-end sm:self-start flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>จัดการข้อมูล</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Detailed Health & Allergy Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        {/* Food / Drug Allergy */}
                        <div className={`p-2.5 rounded-xl border ${
                          hasAllergy 
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            <UtensilsCrossed className={`w-3.5 h-3.5 ${hasAllergy ? 'text-amber-400' : 'text-slate-500'}`} />
                            <span className={hasAllergy ? 'text-amber-300' : 'text-slate-400'}>
                              ประวัติแพ้อาหาร / แพ้ยา / มังสวิรัติ:
                            </span>
                          </div>
                          <p className="font-semibold text-xs pl-5">
                            {hasAllergy ? allergyText : 'ไม่มีประวัติแพ้ยาหรืออาหาร (รับประทานได้ทั่วไป)'}
                          </p>
                        </div>

                        {/* Medical Conditions */}
                        <div className={`p-2.5 rounded-xl border ${
                          hasMed 
                            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            <Stethoscope className={`w-3.5 h-3.5 ${hasMed ? 'text-rose-400' : 'text-slate-500'}`} />
                            <span className={hasMed ? 'text-rose-300' : 'text-slate-400'}>
                              โรคประจำตัว / ข้อจำกัดทางกาย:
                            </span>
                          </div>
                          <p className="font-semibold text-xs pl-5">
                            {hasMed ? medText : 'ไม่มีโรคประจำตัวหรือข้อจำกัดทางกาย'}
                          </p>
                        </div>
                      </div>

                      {/* Special Care Notes (if any) */}
                      {hasSpecial && reg.special_notes && (
                        <div className="mt-2 p-2 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
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

          {/* Footer Note */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>ข้อมูลเชื่อมต่อเรียลไทม์กับฐานข้อมูลผู้สมัคร JRE 2027</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
