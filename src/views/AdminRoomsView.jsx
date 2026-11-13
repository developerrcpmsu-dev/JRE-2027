import React, { useState, useMemo } from 'react';
import { 
  Building, 
  DoorClosed, 
  Users, 
  Search, 
  RotateCcw, 
  Copy, 
  Check, 
  Printer, 
  BedDouble, 
  Phone, 
  Layers, 
  Shield, 
  Sparkles,
  ArrowRight,
  HeartPulse,
  UtensilsCrossed,
  AlertTriangle,
  Stethoscope,
  Shirt,
  X,
  LayoutGrid,
  Table as TableIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import {
  DORMITORY_ROOM_CONFIGS,
  buildDormitoryRoomData,
  computeSmartRoomPlan
} from '../utils/roomUtils';
import {
  exportDormitoryRosterToExcel,
  exportDormitoryStaffMedicalExcel,
  exportElementToPng,
  downloadCsv
} from '../utils/documentExporters';

function RoomOccupantCell({ person, slotIndex, room, accentColor, onSelectPerson, onPreviewAvatar }) {
  if (!person) {
    return <span className="text-slate-500 italic text-xs">- ห้องว่าง -</span>;
  }

  const isBlue = accentColor === 'blue';
  const hoverBorder = isBlue ? 'hover:border-sky-400/60' : 'hover:border-pink-400/60';
  const hoverText = isBlue ? 'group-hover:text-sky-300' : 'group-hover:text-pink-300';
  const subText = isBlue ? 'text-sky-200/80' : 'text-pink-200/80';
  const avatarBorder = isBlue ? 'border-sky-400/50' : 'border-pink-400/50';
  const badgeHover = isBlue ? 'group-hover:bg-sky-900/40 group-hover:text-sky-200' : 'group-hover:bg-pink-900/40 group-hover:text-pink-200';
  const hasAlert = person.hasMedicalHistory || person.hasFoodAllergy || person.isSpecialCare;

  return (
    <div
      onClick={() => onSelectPerson(person, room)}
      className={`group p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
        hasAlert
          ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-400'
          : `bg-slate-900/80 border-slate-800 ${hoverBorder}`
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-5 h-5 rounded-full text-[10px] font-mono font-black flex items-center justify-center shrink-0 border ${
              hasAlert
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
            title={hasAlert ? 'ลำดับที่ 1: ผู้มีโรคประจำตัว/แพ้อาหาร-ยา' : `ลำดับที่ ${slotIndex + 1}: ปกติ`}
          >
            {slotIndex + 1}
          </span>

          {person.avatar ? (
            <img
              src={person.avatar}
              alt={person.name}
              onClick={(e) => {
                e.stopPropagation();
                onPreviewAvatar({
                  title: `ภาพประจำตัว: ${person.name}`,
                  fileUrl: person.avatar,
                  file_type: 'image'
                });
              }}
              className={`w-8 h-8 rounded-full object-cover border ${avatarBorder} hover:scale-110 transition-transform cursor-pointer shadow-sm shrink-0`}
              title="คลิกเพื่อขยายดูรูปภาพ (Lightbox Popup)"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
              {person.firstName?.charAt(0) || '👤'}
            </div>
          )}

          <div className="min-w-0">
            <div className={`font-bold text-white text-xs ${hoverText} transition-colors flex items-center gap-1.5 truncate`}>
              <span>{person.name}</span>
              {person.nickname !== '-' && (
                <span className="text-amber-300 font-normal">({person.nickname})</span>
              )}
            </div>
            <div className={`text-[11px] ${subText} font-mono mt-0.5 truncate`}>
              {person.callsign} • โทร: {person.phone}
            </div>
          </div>
        </div>

        <span className={`text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 ${badgeHover} no-print`}>
          🔍 ดูโปรไฟล์
        </span>
      </div>

      {person.medicalEquipmentNeeded && (
        <div className="mt-1.5 text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
          <Stethoscope className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>เตรียมยา:</span>
          <span className="font-normal text-emerald-200 truncate">{person.medicalEquipmentNeeded}</span>
        </div>
      )}

      {person.specialItemsNeeded && (
        <div className="mt-1 text-[10px] text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 border border-indigo-500/40 px-2 py-0.5 rounded-md">
          <PackageCheck className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>ของที่ต้องใช้:</span>
          <span className="font-normal text-indigo-200 truncate">{person.specialItemsNeeded}</span>
        </div>
      )}

      {hasAlert && (
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
          {person.hasMedicalHistory && (
            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[10px] font-black flex items-center gap-1">
              <Stethoscope className="w-2.5 h-2.5 text-rose-400 shrink-0" />
              <span>โรค: {person.medicalHistory}</span>
            </span>
          )}
          {person.hasFoodAllergy && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50 text-[10px] font-black flex items-center gap-1">
              <UtensilsCrossed className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span>แพ้: {person.foodAllergy}</span>
            </span>
          )}
          <span className="text-[10px] text-rose-400 font-mono font-bold">
            🩸 {person.bloodGroup}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${
              person.isHealthShared
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
            title={person.isHealthShared ? 'เปิดเผยให้เพื่อนร่วมห้องเห็น' : 'เมทมองไม่เห็น (ผู้พักขอซ่อนข้อมูลสุขภาพ)'}
          >
            {person.isHealthShared ? '👁️ เมทเห็น' : '🔒 เมทไม่เห็น'}
          </span>
        </div>
      )}
    </div>
  );
}

function RoomZoneTable({
  title,
  subtitle,
  rooms,
  occupiedCount,
  targetCount,
  accentColor,
  onSelectPerson,
  onPreviewAvatar
}) {
  const isBlue = accentColor === 'blue';
  return (
    <div className={`rounded-3xl bg-slate-950/80 border ${isBlue ? 'border-blue-500/40' : 'border-pink-500/40'} overflow-hidden shadow-2xl`}>
      <div
        className={`p-4 sm:p-5 bg-gradient-to-r ${
          isBlue ? 'from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-500/30' : 'from-pink-950/80 via-slate-900 to-rose-950/80 border-b border-pink-500/30'
        } flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${isBlue ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-pink-500/20 text-pink-300 border-pink-400/30'}`}>
            <DoorClosed className={`w-5 h-5 ${isBlue ? 'text-blue-400' : 'text-pink-400'}`} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <p className={`text-xs ${isBlue ? 'text-blue-200' : 'text-pink-200'}`}>
              {subtitle}
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full border font-mono font-black text-xs ${isBlue ? 'bg-blue-500/20 text-blue-200 border-blue-400/40' : 'bg-pink-500/20 text-pink-200 border-pink-400/40'}`}>
          {occupiedCount >= targetCount ? `ครบ ${occupiedCount} คน (100%)` : `${occupiedCount}/${targetCount} คน (${Math.round((occupiedCount / (targetCount || 1)) * 100)}%)`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-36 text-center">ห้อง</th>
              <th className="py-3 px-4 w-5/12">ผู้เข้าพักคนที่ 1 (มีโรคประจำตัว/แพ้)</th>
              <th className="py-3 px-4 w-5/12">ผู้เข้าพักคนที่ 2 (ปกติ / ช่วยดูแล)</th>
              <th className="py-3 px-4 w-28 text-center">สถานะห้อง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rooms.map(room => {
              const p1 = room.occupants[0];
              const p2 = room.occupants[1];
              const hasRoomMedicalAlert = room.occupants.some(p => p.hasMedicalHistory || p.hasFoodAllergy || p.isSpecialCare);
              const hasBothMedical = room.occupants.filter(p => p.needsBuddyCare).length >= 2;

              return (
                <tr
                  key={room.room}
                  className={`transition-colors ${
                    hasRoomMedicalAlert
                      ? 'bg-rose-950/15 hover:bg-rose-950/25'
                      : isBlue
                        ? 'hover:bg-blue-950/20'
                        : 'hover:bg-pink-950/20'
                  }`}
                >
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`font-mono font-black text-sm px-3 py-1 rounded-xl border shadow-sm ${
                          isBlue ? 'text-sky-300 bg-sky-950/60 border-sky-500/40' : 'text-pink-300 bg-pink-950/60 border-pink-500/40'
                        }`}
                      >
                        {room.roomLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">ชั้น 1</span>
                      {hasRoomMedicalAlert && (
                        <span className="mt-1 px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[9px] font-black flex items-center gap-0.5">
                          🚨 เฝ้าระวังสุขภาพ
                        </span>
                      )}
                      {hasBothMedical && (
                        <span className="mt-1 px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/50 text-[9px] font-bold">
                          ⚠️ มีผู้ป่วย/แพ้ 2 คน
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <RoomOccupantCell
                      person={p1}
                      slotIndex={0}
                      room={room}
                      accentColor={accentColor}
                      onSelectPerson={onSelectPerson}
                      onPreviewAvatar={onPreviewAvatar}
                    />
                  </td>

                  <td className="py-3.5 px-4">
                    <RoomOccupantCell
                      person={p2}
                      slotIndex={1}
                      room={room}
                      accentColor={accentColor}
                      onSelectPerson={onSelectPerson}
                      onPreviewAvatar={onPreviewAvatar}
                    />
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black border inline-block ${
                        room.occupants.length >= (room.capacity || 2)
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : room.occupants.length > 0
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {room.occupants.length >= (room.capacity || 2)
                        ? `ครบ ${room.occupants.length}/${room.capacity || 2} คน ✓`
                        : `${room.occupants.length}/${room.capacity || 2} คน`}
                    </span>
                    {hasRoomMedicalAlert && (
                      <span className="block mt-1 text-[9px] font-bold text-rose-300/90">
                        🩺 เตรียมยา/อุปกรณ์
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminRoomsView({
  registrations = [],
  onUpdateAllocation,
  onOpenProfileModal,
  triggerToast
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'ชาย', 'หญิง'
  const [roomFilter, setRoomFilter] = useState('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [previewDocModal, setPreviewDocModal] = useState(null);
  const [smartPlanModal, setSmartPlanModal] = useState(null);
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);
  const [isMovingSingle, setIsMovingSingle] = useState(false);

  const roomData = useMemo(() => buildDormitoryRoomData(registrations), [registrations]);

  const totalOccupants = useMemo(() => {
    return roomData.rooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.rooms]);

  const totalMaleOccupants = useMemo(() => {
    return roomData.maleRooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.maleRooms]);

  const totalFemaleOccupants = useMemo(() => {
    return roomData.femaleRooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.femaleRooms]);

  const totalExternalNeedRoom = totalOccupants + roomData.unassignedExternal.length;
  const occupancyPct = totalExternalNeedRoom > 0 ? Math.min(100, Math.round((totalOccupants / totalExternalNeedRoom) * 100)) : 100;
  const maleTargetCount = roomData.maleRooms.reduce((s, r) => s + (r.capacity || 2), 0);
  const femaleTargetCount = roomData.femaleRooms.reduce((s, r) => s + (r.capacity || 2), 0);

  const matchesSearch = (room) => {
    if (genderFilter !== 'all' && room.gender !== genderFilter) return false;
    if (roomFilter !== 'all' && room.room !== roomFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (room.room.includes(q) || room.roomLabel.toLowerCase().includes(q)) return true;
    return room.occupants.some(p =>
      p.name.toLowerCase().includes(q) ||
      p.nickname.toLowerCase().includes(q) ||
      p.callsign.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.institution.toLowerCase().includes(q) ||
      p.uniShort.toLowerCase().includes(q)
    );
  };

  const filteredRooms = useMemo(() => roomData.rooms.filter(matchesSearch), [roomData.rooms, genderFilter, roomFilter, searchQuery]);
  const filteredMaleRooms = useMemo(() => roomData.maleRooms.filter(matchesSearch), [roomData.maleRooms, genderFilter, roomFilter, searchQuery]);
  const filteredFemaleRooms = useMemo(() => roomData.femaleRooms.filter(matchesSearch), [roomData.femaleRooms, genderFilter, roomFilter, searchQuery]);

  // Open Smart Room Plan Preview Modal
  const handleOpenSmartPlan = () => {
    const plan = computeSmartRoomPlan(registrations);
    setSmartPlanModal(plan);
  };

  // Apply Smart Room Plan to database
  const handleApplySmartPlan = async () => {
    if (!smartPlanModal || !onUpdateAllocation) return;
    if (smartPlanModal.changes.length === 0) {
      setSmartPlanModal(null);
      if (triggerToast) triggerToast('✓ ผังห้องพักจัดเรียงเหมาะสมอยู่แล้ว ไม่มีรายการที่ต้องย้าย');
      return;
    }

    setIsApplyingPlan(true);
    try {
      for (const ch of smartPlanModal.changes) {
        await onUpdateAllocation(ch.person.targetUpdateId, { room_assigned: ch.newRoomValue });
      }
      setSmartPlanModal(null);
      if (triggerToast) {
        triggerToast(`✓ จัดห้องอัตโนมัติเรียบร้อย (${smartPlanModal.changes.length} รายการ) — คนปกติคู่คนมีโรค & ห้องมีโรคอยู่ต้นๆ แล้ว`, 'success');
      }
    } catch (err) {
      console.error('Failed to apply smart room plan:', err);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการบันทึกผังห้องพัก', 'error');
    } finally {
      setIsApplyingPlan(false);
    }
  };

  // Copy full room assignment roster to clipboard
  const handleCopyRoster = () => {
    let text = `🏨 ผังการจัดห้องพัก หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (ชั้น 1 ห้อง 101 - 110)\n`;
    text += `โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)\n`;
    text += `------------------------------------------------------------\n\n`;

    text += `🚪 ห้องพักชาย (7 ห้อง / 14 คน — ชั้น 1):\n`;
    roomData.maleRooms.forEach(r => {
      text += `  • ห้อง ${r.room}: `;
      if (r.occupants.length === 0) {
        text += `(ว่าง)\n`;
      } else {
        const names = r.occupants.map((p, idx) => `${idx + 1}. ${p.name} (${p.nickname} / ${p.callsign})`).join('  |  ');
        text += `${names}\n`;
      }
    });

    text += `\n🚪 ห้องพักหญิง (3 ห้อง / 6 คน — ชั้น 1):\n`;
    roomData.femaleRooms.forEach(r => {
      text += `  • ห้อง ${r.room}: `;
      if (r.occupants.length === 0) {
        text += `(ว่าง)\n`;
      } else {
        const names = r.occupants.map((p, idx) => `${idx + 1}. ${p.name} (${p.nickname} / ${p.callsign})`).join('  |  ');
        text += `${names}\n`;
      }
    });

    text += `\n🏠 สังกัด มมส (เดินทางไป-กลับเอง ไม่พักหอ): ${roomData.localMsu.length} คน\n`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
    if (triggerToast) triggerToast('📋 คัดลอกผังห้องพัก 101-110 ลงคลิปบอร์ดเรียบร้อยแล้ว');
  };

  const [isExporting, setIsExporting] = useState(false);

  // Export Staff Medical & Supplies Excel
  const handleExportStaffExcel = async () => {
    try {
      setIsExporting(true);
      await exportDormitoryStaffMedicalExcel(roomData.rooms, roomData.localMsu, '4_ใบเตรียมยา_ของใช้_โรคประจำตัวตามห้อง_Staff_JRE2027.xlsx');
      if (triggerToast) triggerToast('✓ ดาวน์โหลด Excel ใบตรวจห้อง/โรค/ยา/ของใช้ (Staff) เรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Clean Sign-In Excel (No Health Data)
  const handleExportSignInExcel = async () => {
    try {
      setIsExporting(true);
      await exportDormitoryRosterToExcel(roomData.rooms, roomData.localMsu, '3_ใบเซ็นชื่อเข้าห้องพัก_ปิดข้อมูลสุขภาพ_JRE2027.xlsx');
      if (triggerToast) triggerToast('✓ ดาวน์โหลด Excel ใบเซ็นชื่อเข้าห้องพัก (ปิดข้อมูลสุขภาพ) เรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to CSV (Staff Room + Health + Medicines + Items)
  const handleExportCsv = () => {
    try {
      let csv = 'ห้อง,เพศ,ลำดับ/เตียง,ชื่อ - นามสกุล,ชื่อเล่น,นามเรียกขาน,เบอร์โทร,โรคประจำตัว,แพ้อาหาร/ยา,หมู่เลือด,ยาที่ต้องการ,ของที่ต้องใช้/ดูแลพิเศษ\n';
      roomData.rooms.forEach(r => {
        for (let i = 0; i < 2; i++) {
          const p = r.occupants[i];
          csv += `"${r.roomLabel}","${r.gender}","${i + 1}","${p ? p.name : '(ว่าง)'}","${p ? p.nickname : '-'}","${p ? p.callsign : '-'}","${p ? p.phone : '-'}","${p ? p.medicalHistory : '-'}","${p ? p.foodAllergy : '-'}","${p ? p.bloodGroup : '-'}","${p?.medicalEquipmentNeeded || '-'}","${p?.specialItemsNeeded || '-'}"\n`;
        }
      });
      downloadCsv(csv, '4_ใบเตรียมยา_ของใช้_โรคประจำตัวตามห้อง_Staff_JRE2027.csv');
      if (triggerToast) triggerToast('✓ ดาวน์โหลดไฟล์ CSV รายการเตรียมยา/ของใช้ตามห้องเรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการส่งออก CSV', 'error');
    }
  };

  // Export to PNG Image
  const handleExportPng = async () => {
    try {
      setIsExporting(true);
      await exportElementToPng('printable-rooms-roster', 'ผังจัดสรรห้องพัก_หอพักกุดรัง_JRE2027.png');
      if (triggerToast) triggerToast('✓ บันทึกภาพ PNG ผังห้องพักเรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการบันทึกภาพ PNG', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setViewMode('table');
    document.body.classList.add('rooms-print-active');
    const cleanup = () => {
      document.body.classList.remove('rooms-print-active');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 45000);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleOpenPersonProfile = (person, room = null) => {
    const roommate = room ? room.occupants.find(p => p.id !== person.id) : null;
    setSelectedPerson({
      ...person,
      assignedRoom: room ? room.roomLabel : person.rawRoom,
      roommate
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 p-6 sm:p-8 shadow-2xl no-print">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-5">
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5 shadow-sm">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span>หอพักกุดรัง มหาวิทยาลัยมหาสารคาม</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5 shadow-sm">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>ชั้น 1 • ห้อง 101 - 110 (ห้องละ 2 คน)</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                URL: /admin/rooms
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              🏨 ตารางจัดสรรห้องพัก &amp; ระบบโปรไฟล์ผู้เข้าพัก
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ผังเข้าพักหอพักกุดรัง ชั้น 1 ชาย (101-107) และหญิง (108-110) <strong>จัดลำดับในห้อง: 1. คนมีโรคประจำตัว/แพ้ • 2. คนปกติช่วยดูแล</strong> จัดห้องแล้ว {totalOccupants}/{totalExternalNeedRoom || 20} คน
            </p>
          </div>

          {/* Primary Top-Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-700 shadow-md">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>ตารางแยกห้อง</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>การ์ดผังห้อง</span>
              </button>
            </div>

            {/* Smart Auto-Arrange Button */}
            {onUpdateAllocation && (
              <button
                type="button"
                onClick={handleOpenSmartPlan}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="จัดคนมีโรคประจำตัวไว้ห้องต้นๆ คู่กับคนปกติที่ไม่มีโรค และเรียงคนที่ 1 = มีโรค, คนที่ 2 = ไม่มี"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ จัดห้องอัตโนมัติ (โรคไว้ต้นๆ คู่คนปกติ)</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Grouped Action Bar */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-4 mt-5 border-t border-slate-800/80">
          {/* Group 1: Split Document Links (PDPA vs Staff) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 mr-1">เอกสารแยกชุด:</span>
            <a
              href="/admin/documents?tab=rooms"
              className="px-3.5 py-2 rounded-xl bg-sky-700/90 hover:bg-sky-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-sky-400/30"
              title="ใบเซ็นชื่อเข้าห้องพัก (ปิดข้อมูลสุขภาพ เพื่อ PDPA)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>📑 ใบเซ็นชื่อ (ปิดสุขภาพ)</span>
            </a>

            <a
              href="/admin/documents?tab=rooms-staff"
              className="px-3.5 py-2 rounded-xl bg-rose-700/90 hover:bg-rose-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-rose-400/30"
              title="ใบตรวจสอบห้อง โรคประจำตัว ยาที่ต้องการ ของที่ต้องใช้ สำหรับ Staff (ไม่ต้องเซ็น)"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>🩺 ใบตรวจโรค/ยา/ของใช้ (Staff)</span>
            </a>
          </div>

          {/* Group 2: Export & Print */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportStaffExcel}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="ส่งออก Excel ใบตรวจห้อง/โรค/ยา/ของใช้ (Staff)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Staff (.xlsx)</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportSignInExcel}
              className="px-3 py-2 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="ส่งออก Excel ใบเซ็นชื่อเข้าห้องพัก (ปิดข้อมูลสุขภาพ)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel ใบเซ็นชื่อ</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="ส่งออก CSV ใบตรวจห้องและรายการเตรียมยา/ของใช้"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPng}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="บันทึกภาพผังห้องพัก PNG"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>PNG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyRoster}
              className="px-3.5 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="คัดลอกรายชื่อแยกตามห้อง 101-110"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'คัดลอกแล้ว ✓' : 'คัดลอกผัง'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="พิมพ์ผังห้องพักบนกระดาษ A4 หรือบันทึกเป็น PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>🖨️ พิมพ์ / PDF</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ห้องพักทั้งหมด</span>
              <DoorClosed className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">10 ห้อง</div>
            <span className="text-[10px] text-slate-400">ห้อง 101 ถึง 110 (ชั้น 1)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้เข้าพักหอพัก</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono">
              {totalOccupants} <span className="text-xs text-slate-400">/ {totalExternalNeedRoom || 20} คน</span>
            </div>
            <span className={`text-[10px] font-bold ${roomData.unassignedExternal.length === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
              {roomData.unassignedExternal.length === 0
                ? `✓ จัดห้องครบ ${totalOccupants}/${totalExternalNeedRoom || 20} คน (${occupancyPct}%)`
                : `⏳ จัดแล้ว ${totalOccupants}/${totalExternalNeedRoom} คน (${occupancyPct}%) • รอจัด ${roomData.unassignedExternal.length} คน`}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ห้องพักชาย (👨)</span>
              <BedDouble className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-300 font-mono">
              7 ห้อง <span className="text-xs text-slate-400 font-sans">({totalMaleOccupants} คน)</span>
            </div>
            <span className="text-[10px] text-sky-400">ห้อง 101 - 107 (ห้องละ 2 คน)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ห้องพักหญิง (👩)</span>
              <BedDouble className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-xl font-black text-pink-300 font-mono">
              3 ห้อง <span className="text-xs text-slate-400 font-sans">({totalFemaleOccupants} คน)</span>
            </div>
            <span className="text-[10px] text-pink-400">ห้อง 108 - 110 (ห้องละ 2 คน)</span>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC ALERT BANNER WHEN REBALANCE IS NEEDED */}
      {roomData.diagnostics.needsRebalance && onUpdateAllocation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-rose-950/60 to-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg no-print">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-black text-amber-200 text-sm">
                พบห้องที่ควรจัดเรียงใหม่เพื่อให้คนปกติช่วยดูแลคนมีโรคประจำตัว และนำห้องที่มีโรคไว้ห้องต้นๆ
              </div>
              <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                {roomData.diagnostics.doubleCareRooms.length > 0 && (
                  <span>• ห้องที่มีผู้มีโรค/แพ้พักอยู่ด้วยกัน 2 คน: <strong className="text-rose-300">ห้อง {roomData.diagnostics.doubleCareRooms.join(', ')}</strong></span>
                )}
                {roomData.diagnostics.misplacedCareRooms.length > 0 && (
                  <span>• ห้องที่มีผู้มีโรค/แพ้ยังไม่อยู่ห้องต้นๆ: <strong className="text-amber-300">ห้อง {roomData.diagnostics.misplacedCareRooms.join(', ')}</strong></span>
                )}
                {roomData.unassignedExternal.length > 0 && (
                  <span>• ยังไม่ได้จัดห้อง: <strong className="text-sky-300">{roomData.unassignedExternal.length} คน</strong></span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenSmartPlan}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shrink-0 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>ดูตัวอย่าง & จัดห้องใหม่อัตโนมัติ</span>
          </button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-lg no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขห้อง (101-110), ชื่อ-สกุล, ชื่อเล่น, นามเรียกขาน (TSI/RCP), เบอร์โทร..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold focus:outline-none focus:border-sky-400"
            >
              <option value="all">ทุกห้อง (101-110)</option>
              {DORMITORY_ROOM_CONFIGS.map(c => (
                <option key={c.room} value={c.room}>ห้อง {c.room} ({c.gender})</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  genderFilter === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด (10 ห้อง)
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('ชาย')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  genderFilter === 'ชาย' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                👨 ชาย (7 ห้อง)
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('หญิง')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  genderFilter === 'หญิง' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                👩 หญิง (3 ห้อง)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: FORMAL TABLE VIEW */}
      {viewMode === 'table' && (
        <div id="printable-rooms-roster" className="space-y-8 print:p-4 print:bg-white print:text-slate-900">
          <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-slate-900">
            <h1 className="text-xl font-black text-slate-950">หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (ชั้น 1 ห้อง 101 - 110)</h1>
            <p className="text-xs font-bold text-slate-700">โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027) • ผังจัดสรรห้องพัก 10 ห้อง (20 คน)</p>
          </div>

          {(genderFilter === 'all' || genderFilter === 'ชาย') && filteredMaleRooms.length > 0 && (
            <RoomZoneTable
              title="🚪 ห้องพักชาย (7 ห้อง / 14 คน — ชั้น 1)"
              subtitle="หอพักกุดรัง มมส • ห้อง 101 ถึง 107 (ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น)"
              rooms={filteredMaleRooms}
              occupiedCount={totalMaleOccupants}
              targetCount={maleTargetCount}
              accentColor="blue"
              onSelectPerson={handleOpenPersonProfile}
              onPreviewAvatar={setPreviewDocModal}
            />
          )}

          {(genderFilter === 'all' || genderFilter === 'หญิง') && filteredFemaleRooms.length > 0 && (
            <RoomZoneTable
              title="🚪 ห้องพักหญิง (3 ห้อง / 6 คน — ชั้น 1)"
              subtitle="หอพักกุดรัง มมส • ห้อง 108 ถึง 110 (ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น)"
              rooms={filteredFemaleRooms}
              occupiedCount={totalFemaleOccupants}
              targetCount={femaleTargetCount}
              accentColor="pink"
              onSelectPerson={handleOpenPersonProfile}
              onPreviewAvatar={setPreviewDocModal}
            />
          )}
        </div>
      )}

      {/* VIEW MODE 2: CARD GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRooms.map(room => {
            const isMale = room.gender === 'ชาย';
            const isFull = room.occupants.length >= room.capacity;

            return (
              <div
                key={room.room}
                className={`rounded-3xl border p-5 space-y-4 transition-all shadow-xl ${
                  isMale
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border-sky-500/30 hover:border-sky-500/60'
                    : 'bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950/40 border-pink-500/30 hover:border-pink-500/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl font-mono font-black text-lg border shadow-md ${
                        isMale ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' : 'bg-pink-500/20 text-pink-300 border-pink-400/40'
                      }`}
                    >
                      {room.room}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base flex items-center gap-2">
                        <span>{room.roomLabel}</span>
                        <span className="text-xs font-normal text-slate-400">• ชั้น {room.floor} หอพักกุดรัง</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isMale ? 'bg-sky-500/15 text-sky-300 border-sky-400/30' : 'bg-pink-500/15 text-pink-300 border-pink-400/30'
                          }`}
                        >
                          {isMale ? '👨 ห้องพักชาย' : '👩 ห้องพักหญิง'}
                        </span>
                        <span className="text-[11px] text-slate-400">❄️ ห้องแอร์ • 🚿 น้ำอุ่น • เตียงเดี่ยว 2 เตียง</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-black border ${
                        isFull ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      🛏️ {room.occupants.length} / {room.capacity} เตียง
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {room.occupants.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      ยังไม่มีผู้เข้าพักในห้องนี้
                    </div>
                  ) : (
                    room.occupants.map((person, idx) => {
                      const roommate = room.occupants.find((_, i) => i !== idx);
                      return (
                        <div
                          key={person.id}
                          onClick={() => handleOpenPersonProfile(person, room)}
                          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2 cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-700">
                                #{idx + 1}
                              </span>
                              <div>
                                <div className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                                  <span>{person.name}</span>
                                  {person.nickname !== '-' && (
                                    <span className="text-amber-300 font-normal">({person.nickname})</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  📡 {person.callsign} • สังกัด: <strong className="text-slate-200">{person.uniShort}</strong>
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                              📞 {person.phone}
                            </span>
                          </div>

                          {(person.hasMedicalHistory || person.hasFoodAllergy || person.medicalEquipmentNeeded || person.specialItemsNeeded) && (
                            <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                              {person.hasMedicalHistory && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[10px] font-black flex items-center gap-1">
                                  <Stethoscope className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                  <span>โรค: {person.medicalHistory}</span>
                                </span>
                              )}
                              {person.hasFoodAllergy && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50 text-[10px] font-black flex items-center gap-1">
                                  <UtensilsCrossed className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                  <span>แพ้: {person.foodAllergy}</span>
                                </span>
                              )}
                              {person.medicalEquipmentNeeded && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold">
                                  💊 ยา: {person.medicalEquipmentNeeded}
                                </span>
                              )}
                              {person.specialItemsNeeded && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 text-[10px] font-bold">
                                  📦 ของใช้: {person.specialItemsNeeded}
                                </span>
                              )}
                              <span className="text-[10px] text-rose-400 font-mono font-bold">
                                🩸 {person.bloodGroup}
                              </span>
                            </div>
                          )}

                          {roommate && (
                            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <span>🤝 เพื่อนร่วมห้อง:</span>
                                <strong className="text-sky-300">{roommate.name}</strong>
                                <span className="text-slate-500">({roommate.nickname})</span>
                              </span>
                              <span className="text-emerald-400 font-mono text-[10px]">เตียงคู่ ✓</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MSU PARTICIPANTS SUMMARY (GOING HOME / NO DORM) */}
      <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg no-print">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              🏠
            </span>
            <div>
              <h3 className="text-sm font-black text-white">
                นิสิต / คณะกรรมการ มมส (เดินทางไป-กลับเอง ไม่พักหอพัก)
              </h3>
              <p className="text-[11px] text-slate-400">
                กลุ่มผู้เข้าร่วมและ Staff ของมหาวิทยาลัยมหาสารคามที่อยู่ในพื้นที่ ไม่ต้องจัดสรรห้องพักหอพักกุดรัง
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-black text-xs">
            {roomData.localMsu.length} คน
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 text-xs">
          {roomData.localMsu.map(p => (
            <div
              key={p.id}
              onClick={() => handleOpenPersonProfile(p, null)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
            >
              <div className="font-bold text-white text-[11px] truncate">{p.name}</div>
              <div className="text-[10px] text-amber-300 font-mono mt-0.5 truncate">{p.callsign}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SMART ROOM AUTO-ARRANGE PREVIEW MODAL */}
      {smartPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={() => !isApplyingPlan && setSmartPlanModal(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={isApplyingPlan}
              onClick={() => setSmartPlanModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pr-8">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>แผนจัดสรรห้องพักอัตโนมัติ (คนปกติคู่คนมีโรค • โรคไว้ห้องต้นๆ)</span>
              </h3>
              <p className="text-xs text-slate-300">
                1) จับคู่คนมีโรคประจำตัว/แพ้ อยู่กับคนปกติ (1:1) เพื่อช่วยดูแลกัน • 2) นำห้องที่มีผู้เฝ้าระวังไว้ห้องต้นๆ (ชายเริ่ม 101, หญิงเริ่ม 108) • 3) เรียงชื่อในห้อง: 1. คนมีโรค/แพ้ 2. คนปกติ
              </p>
            </div>

            {smartPlanModal.changes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 font-bold">
                ✓ ผังห้องพักปัจจุบันจัดเรียงตามเงื่อนไขครบถ้วนแล้ว ไม่มีรายการที่ต้องย้ายห้อง
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="text-xs font-black text-amber-300">
                  รายการย้ายห้องที่จะบันทึก ({smartPlanModal.changes.length} คน):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {smartPlanModal.changes.map(ch => (
                    <div key={ch.person.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {ch.person.name} {ch.person.nickname !== '-' ? `(${ch.person.nickname})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ch.person.needsBuddyCare ? '🩺 มีโรคประจำตัว/แพ้' : '💚 ปกติ (ช่วยดูแล)'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{ch.oldRoom}</span>
                        <ArrowRight className="w-3 h-3 text-amber-400" />
                        <span className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-black">
                          {ch.newRoom} (#{ch.bedNumber})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Planned Rooms Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {smartPlanModal.plannedRooms.map(rm => (
                <div key={rm.room} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className={rm.gender === 'ชาย' ? 'text-sky-300' : 'text-pink-300'}>
                      {rm.roomLabel} ({rm.gender})
                    </span>
                    {rm.occupants.some(o => o.needsBuddyCare) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        🚨 เฝ้าระวังสุขภาพ
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        ปกติ
                      </span>
                    )}
                  </div>
                  {rm.occupants.map((o, idx) => (
                    <div key={o.id} className="flex items-center justify-between gap-2 text-[11px] py-1 border-t border-slate-800/60">
                      <span className="truncate text-slate-200">
                        <strong className="font-mono text-slate-400 mr-1">{idx + 1}.</strong>
                        {o.name} ({o.nickname})
                      </span>
                      <span className={`shrink-0 text-[10px] font-bold ${o.needsBuddyCare ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {o.hasMedicalHistory
                          ? `โรค: ${o.medicalHistory}`
                          : o.hasFoodAllergy
                            ? `แพ้: ${o.foodAllergy}`
                            : 'ปกติ'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isApplyingPlan}
                onClick={() => setSmartPlanModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

              {smartPlanModal.changes.length > 0 && (
                <button
                  type="button"
                  disabled={isApplyingPlan}
                  onClick={handleApplySmartPlan}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isApplyingPlan ? 'กำลังบันทึกลงฐานข้อมูล...' : `ยืนยันบันทึกผังห้องใหม่ (${smartPlanModal.changes.length} คน)`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE PROFILE POPUP MODAL */}
      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPerson(null)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-sky-500/40 p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPerson(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0 overflow-hidden border-2 border-sky-400/40">
                {selectedPerson.avatar ? (
                  <img
                    src={selectedPerson.avatar}
                    alt={selectedPerson.name}
                    onClick={() => setPreviewDocModal({ title: `ภาพประจำตัว: ${selectedPerson.name}`, fileUrl: selectedPerson.avatar, file_type: 'image' })}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    title="คลิกดูภาพขยาย (Lightbox)"
                  />
                ) : (
                  <span>{selectedPerson.firstName?.charAt(0) || 'U'}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      selectedPerson.gender === 'ชาย'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                        : 'bg-pink-500/20 text-pink-300 border-pink-400/40'
                    }`}
                  >
                    {selectedPerson.gender === 'ชาย' ? '👨 ชาย' : '👩 หญิง'}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40">
                    {selectedPerson.uniShort}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-tight">
                  {selectedPerson.name}
                  {selectedPerson.nickname !== '-' && (
                    <span className="text-amber-300 font-bold ml-1.5">({selectedPerson.nickname})</span>
                  )}
                </h3>

                <p className="text-xs text-sky-300 font-mono font-semibold">
                  📡 นามเรียกขาน: {selectedPerson.callsign}
                </p>
              </div>
            </div>

            {/* Accommodation & Roommate Card + Quick Room Move */}
            <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <DoorClosed className="w-4 h-4 text-sky-400" />
                  <span>การจัดสรรห้องพัก:</span>
                </span>
                {onUpdateAllocation && !selectedPerson.isMsu ? (
                  <select
                    disabled={isMovingSingle}
                    value={selectedPerson.roomNumber || ''}
                    onChange={async (e) => {
                      const nextRoom = e.target.value;
                      if (!nextRoom) return;
                      setIsMovingSingle(true);
                      try {
                        const roomVal = `ห้อง ${nextRoom}`;
                        await onUpdateAllocation(selectedPerson.targetUpdateId, { room_assigned: roomVal });
                        setSelectedPerson(prev => ({
                          ...prev,
                          roomNumber: nextRoom,
                          rawRoom: roomVal,
                          assignedRoom: roomVal
                        }));
                        if (triggerToast) triggerToast(`✓ ย้าย ${selectedPerson.name} ไปยัง${roomVal} เรียบร้อยแล้ว`, 'success');
                      } finally {
                        setIsMovingSingle(false);
                      }
                    }}
                    className="font-mono font-black text-sky-300 px-2.5 py-1 rounded-lg bg-sky-900/60 border border-sky-500/40 text-xs cursor-pointer"
                  >
                    <option value="">ยังไม่ระบุห้อง</option>
                    {DORMITORY_ROOM_CONFIGS.filter(c => c.gender === selectedPerson.gender).map(c => (
                      <option key={c.room} value={c.room}>ห้อง {c.room} ({c.gender})</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono font-black text-sky-300 px-2.5 py-0.5 rounded-lg bg-sky-900/60 border border-sky-500/40">
                    {selectedPerson.assignedRoom || selectedPerson.rawRoom || 'ไม่ระบุห้อง'}
                  </span>
                )}
              </div>

              {selectedPerson.roommate ? (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">🤝 เพื่อนร่วมห้อง (Roommate):</div>
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>
                      {selectedPerson.roommate.name} ({selectedPerson.roommate.nickname})
                    </span>
                    <span className="font-mono text-sky-300 text-[11px]">
                      {selectedPerson.roommate.callsign}
                    </span>
                  </div>
                  {selectedPerson.roommate.phone !== '-' && (
                    <div className="text-[11px] text-slate-400">
                      📞 โทรเพื่อนร่วมห้อง:{' '}
                      <a href={`tel:${selectedPerson.roommate.phone}`} className="text-sky-300 underline font-mono">
                        {selectedPerson.roommate.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : selectedPerson.isMsu ? (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200">
                  🏠 นิสิต/บุคลากร มมส พักอาศัยในพื้นที่ เดินทางไป-กลับเอง
                </div>
              ) : null}
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>เบอร์โทรศัพท์</span>
                </div>
                <div className="font-bold text-white font-mono">
                  <a href={`tel:${selectedPerson.phone}`} className="hover:text-emerald-300">
                    {selectedPerson.phone}
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Shirt className="w-3 h-3 text-purple-400" />
                  <span>ไซส์เสื้อฝึก JRE</span>
                </div>
                <div className="font-black text-purple-300 font-mono text-sm">
                  ไซส์ {selectedPerson.shirtSize}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-rose-400" />
                  <span>หมู่โลหิต (Blood)</span>
                </div>
                <div className="font-bold text-rose-300 font-mono">
                  {selectedPerson.bloodGroup || '-'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Building className="w-3 h-3 text-amber-400" />
                  <span>สถาบัน / สังกัด</span>
                </div>
                <div className="font-bold text-slate-200 truncate" title={selectedPerson.institution}>
                  {selectedPerson.uniShort}
                </div>
              </div>
            </div>

            {/* Health, Medicines & Items Needed */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">ประวัติแพ้อาหาร/ยา/มังสวิรัติ:</span>{' '}
                  <span className={selectedPerson.hasFoodAllergy ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                    {selectedPerson.foodAllergy}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">โรคประจำตัว / ข้อจำกัดทางกาย:</span>{' '}
                  <span className={selectedPerson.hasMedicalHistory ? 'text-rose-300 font-semibold' : 'text-slate-400'}>
                    {selectedPerson.medicalHistory}
                  </span>
                </div>
              </div>

              {selectedPerson.medicalEquipmentNeeded && (
                <div className="flex items-start gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-300">ยาที่ต้องการ / เวชภัณฑ์:</span>{' '}
                    <span className="text-emerald-300 font-semibold">{selectedPerson.medicalEquipmentNeeded}</span>
                  </div>
                </div>
              )}

              {selectedPerson.specialItemsNeeded && (
                <div className="flex items-start gap-2">
                  <PackageCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-300">ของที่ต้องใช้ / การดูแลพิเศษ:</span>{' '}
                    <span className="text-indigo-300 font-semibold">{selectedPerson.specialItemsNeeded}</span>
                  </div>
                </div>
              )}

              {selectedPerson.emergencyName !== '-' && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>🚨 ติดต่อฉุกเฉิน: <strong>{selectedPerson.emergencyName}</strong></span>
                  <a href={`tel:${selectedPerson.emergencyPhone}`} className="text-sky-300 font-mono">
                    {selectedPerson.emergencyPhone}
                  </a>
                </div>
              )}
            </div>

            {/* Roommate Health Privacy Setting */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>การเปิดเผยข้อมูลสุขภาพให้เพื่อนร่วมห้อง:</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    selectedPerson.isHealthShared
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {selectedPerson.isHealthShared ? '👁️ เปิดเผยให้เมททราบ' : '🔒 ซ่อนจากเมท (ปิดเป็นความลับ)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedPerson.isHealthShared
                  ? 'ผู้เข้าพักยินยอมให้เพื่อนร่วมห้องเห็นข้อมูลโรคประจำตัวและอาการแพ้ เพื่อความปลอดภัยในการปฐมพยาบาล'
                  : 'ผู้เข้าพักเลือกไม่เปิดเผยข้อมูลสุขภาพให้เมททราบ (เฉพาะ Admin และทีมแพทย์สนามเท่านั้นที่มองเห็น)'}
              </p>
              {onUpdateAllocation && (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !selectedPerson.isHealthShared;
                      const targetId = selectedPerson.targetUpdateId;
                      await onUpdateAllocation(targetId, { share_health_with_roommate: nextVal });
                      setSelectedPerson(prev => ({
                        ...prev,
                        isHealthShared: nextVal,
                        raw: { ...(prev.raw || {}), share_health_with_roommate: nextVal }
                      }));
                      if (triggerToast) {
                        triggerToast(nextVal ? '✓ บันทึก: เปิดเผยข้อมูลสุขภาพให้เพื่อนร่วมห้องทราบแล้ว' : '✓ บันทึก: ตั้งค่าไม่เปิดเผยข้อมูลสุขภาพให้เมททราบเรียบร้อย (เฉพาะแพทย์/Admin มองเห็น)', 'info');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1.5 shadow"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>สลับเป็น: {selectedPerson.isHealthShared ? '🔒 ซ่อนจากเมท' : '👁️ เปิดเผยให้เมททราบ'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={() => {
                    const raw = selectedPerson.raw;
                    setSelectedPerson(null);
                    onOpenProfileModal(raw);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>เปิดโหมดแก้ไข Admin เต็มรูปแบบ</span>
                  <ArrowRight className="w-3 h-3 text-sky-400" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-lg transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDocModal && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocModal)}
          onClose={() => setPreviewDocModal(null)}
          doc={previewDocModal}
        />
      )}
    </div>
  );
}
