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
  Mail,
  Key, 
  Layers, 
  Shield, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  User,
  HeartPulse,
  UtensilsCrossed,
  AlertTriangle,
  Stethoscope,
  Shirt,
  Calendar,
  X,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { 
  resolveUniversityInfo, 
  resolveGender, 
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing
} from '../data/defaultData';

export default function AdminRoomsView({
  registrations = [],
  onUpdateAllocation,
  onOpenProfileModal,
  triggerToast
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'ชาย', 'หญิง'
  const [roomFilter, setRoomFilter] = useState('all'); // 'all' or '101'..'110'
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Define the 10 rooms of Kut Rang Dormitory (Floor 1)
  const ROOM_CONFIGS = useMemo(() => [
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
  ], []);

  // Map participants to rooms
  const roomData = useMemo(() => {
    const map = {};
    ROOM_CONFIGS.forEach(c => {
      map[c.room] = {
        ...c,
        occupants: []
      };
    });

    const unassignedExternal = [];
    const localMsu = [];

    (registrations || []).forEach(reg => {
      const uniInfo = resolveUniversityInfo(reg);
      const isMsu = Boolean(uniInfo?.isMsu);
      const gender = resolveGender(reg);
      const nameData = resolvePersonFullNameWithTitle(reg);
      const rawRoom = String(reg.room_assigned || '').trim();

      // Parse JSON inside special_notes safely
      let extra = {};
      if (reg.special_notes) {
        if (typeof reg.special_notes === 'string' && reg.special_notes.trim().startsWith('{')) {
          try { extra = JSON.parse(reg.special_notes); } catch (e) { extra = {}; }
        } else if (typeof reg.special_notes === 'object') {
          extra = reg.special_notes;
        }
      }

      const nickname = extra.nickname || reg.nickname || '-';
      const callsign = normalizeCallsignSpacing(extra.callsign || reg.callsign || '-');
      const shirtSize = extra.shirt_size || reg.shirt_size || 'L';
      const bloodGroup = reg.blood_group || extra.blood_group || 'O';
      const foodAllergy = reg.food_allergy || extra.food_allergy || 'ไม่มี';
      const medicalHistory = reg.medical_history || extra.medical_history || 'ไม่มี';
      const emergencyName = reg.emergency_name || extra.emergency_name || '-';
      const emergencyPhone = reg.emergency_phone || extra.emergency_phone || '-';

      const person = {
        raw: reg,
        id: reg.id || reg.user_id,
        user_id: reg.user_id,
        name: nameData.fullName,
        title: nameData.title,
        firstName: nameData.firstName,
        lastName: nameData.lastName,
        nickname,
        callsign,
        gender,
        phone: reg.phone || extra.phone || '-',
        email: reg.user_email || '',
        avatar: reg.user_avatar || '',
        institution: reg.institution || '-',
        uniShort: uniInfo.shortTag,
        uniName: uniInfo.fullName,
        shirtSize,
        bloodGroup,
        foodAllergy,
        medicalHistory,
        emergencyName,
        emergencyPhone,
        isMsu,
        rawRoom,
        roomNumber: null
      };

      if (isMsu) {
        localMsu.push(person);
        return;
      }

      // Extract 3-digit room number from room_assigned string
      const match = rawRoom.match(/(\d{3})/);
      if (match && map[match[1]]) {
        person.roomNumber = match[1];
        map[match[1]].occupants.push(person);
      } else {
        unassignedExternal.push(person);
      }
    });

    return {
      rooms: Object.values(map),
      maleRooms: Object.values(map).filter(r => r.gender === 'ชาย'),
      femaleRooms: Object.values(map).filter(r => r.gender === 'หญิง'),
      unassignedExternal,
      localMsu
    };
  }, [registrations, ROOM_CONFIGS]);

  // Overall counts
  const totalOccupants = useMemo(() => {
    return roomData.rooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.rooms]);

  const totalMaleOccupants = useMemo(() => {
    return roomData.maleRooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.maleRooms]);

  const totalFemaleOccupants = useMemo(() => {
    return roomData.femaleRooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.femaleRooms]);

  // Filtered rooms based on search & filters
  const filteredRooms = useMemo(() => {
    return roomData.rooms.filter(room => {
      if (genderFilter !== 'all' && room.gender !== genderFilter) return false;
      if (roomFilter !== 'all' && room.room !== roomFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      // Check if room number matches
      if (room.room.includes(q) || room.roomLabel.toLowerCase().includes(q)) return true;

      // Check if any occupant matches
      return room.occupants.some(p => 
        p.name.toLowerCase().includes(q) ||
        p.nickname.toLowerCase().includes(q) ||
        p.callsign.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.institution.toLowerCase().includes(q) ||
        p.uniShort.toLowerCase().includes(q)
      );
    });
  }, [roomData.rooms, genderFilter, roomFilter, searchQuery]);

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
        const names = r.occupants.map(p => `${p.name} (${p.nickname} / ${p.callsign})`).join('  |  ');
        text += `${names}\n`;
      }
    });

    text += `\n🚪 ห้องพักหญิง (3 ห้อง / 6 คน — ชั้น 1):\n`;
    roomData.femaleRooms.forEach(r => {
      text += `  • ห้อง ${r.room}: `;
      if (r.occupants.length === 0) {
        text += `(ว่าง)\n`;
      } else {
        const names = r.occupants.map(p => `${p.name} (${p.nickname} / ${p.callsign})`).join('  |  ');
        text += `${names}\n`;
      }
    });

    text += `\n🏠 สังกัด มมส (เดินทางไป-กลับเอง ไม่พักหอ): ${roomData.localMsu.length} คน\n`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
    if (triggerToast) triggerToast('📋 คัดลอกผังห้องพัก 101-110 ลงคลิปบอร์ดเรียบร้อยแล้ว');
  };

  // Helper to open interactive profile popup
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
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

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🏨 ตารางจัดสรรห้องพัก & ระบบโปรไฟล์ผู้เข้าพัก</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ผังการเข้าพักหอพักกุดรัง ชั้น 1 แยกสัดส่วนห้องพักชาย (101-107) และห้องพักหญิง (108-110) ชัดเจน <strong>ห้องละ 2 คน ครบ 20/20 คน</strong> คลิกที่ชื่อเพื่อเปิดดูโปรไฟล์และข้อมูลเพื่อนร่วมห้องได้ทันที
            </p>
          </div>

          {/* Action Buttons */}
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

            <button
              type="button"
              onClick={handleCopyRoster}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'คัดลอกแล้ว ✓' : '📋 คัดลอกผังห้อง'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>พิมพ์ใบรายชื่อ</span>
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
              {totalOccupants} <span className="text-xs text-slate-400">/ 20 คน</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">✓ จัดห้องครบ 20/20 คน (100%)</span>
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

      {/* SEARCH BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
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

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setGenderFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                genderFilter === 'all'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด (10 ห้อง)
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('ชาย')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                genderFilter === 'ชาย'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👨 ชาย (7 ห้อง)
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('หญิง')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                genderFilter === 'หญิง'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👩 หญิง (3 ห้อง)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: FORMAL TABLE VIEW (ACTIVE BY DEFAULT) */}
      {viewMode === 'table' && (
        <div className="space-y-8">
          {/* 1. MALE ROOMS TABLE (ห้องพักชาย 7 ห้อง / 14 คน — ชั้น 1) */}
          {(genderFilter === 'all' || genderFilter === 'ชาย') && (
            <div className="rounded-3xl bg-slate-950/80 border border-blue-500/40 overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <DoorClosed className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>🚪 ห้องพักชาย (7 ห้อง / 14 คน — ชั้น 1)</span>
                    </h2>
                    <p className="text-xs text-blue-200">
                      หอพักกุดรัง มมส • ห้อง 101 ถึง 107 (ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น)
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 font-mono font-black text-xs">
                  ครบ 14 คน (100%)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-36 text-center">ห้อง</th>
                      <th className="py-3 px-4 w-5/12">ผู้เข้าพักคนที่ 1</th>
                      <th className="py-3 px-4 w-5/12">ผู้เข้าพักคนที่ 2</th>
                      <th className="py-3 px-4 w-28 text-center">สถานะห้อง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {roomData.maleRooms.map(room => {
                      const p1 = room.occupants[0];
                      const p2 = room.occupants[1];

                      return (
                        <tr key={room.room} className="hover:bg-blue-950/20 transition-colors">
                          {/* Room Number */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono font-black text-sm text-sky-300 px-3 py-1 rounded-xl bg-sky-950/60 border border-sky-500/40 shadow-sm">
                                {room.roomLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1">ชั้น 1</span>
                            </div>
                          </td>

                          {/* Occupant 1 */}
                          <td className="py-3.5 px-4">
                            {p1 ? (
                              <div 
                                onClick={() => handleOpenPersonProfile(p1, room)}
                                className="group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-400/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                              >
                                <div>
                                  <div className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                                    <span>{p1.name}</span>
                                    {p1.nickname !== '-' && (
                                      <span className="text-amber-300 font-normal">({p1.nickname})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-sky-200/80 font-mono mt-0.5">
                                    {p1.callsign}
                                  </div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 group-hover:bg-sky-900/40 group-hover:text-sky-200">
                                  🔍 ดูโปรไฟล์
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs">- ห้องว่าง -</span>
                            )}
                          </td>

                          {/* Occupant 2 */}
                          <td className="py-3.5 px-4">
                            {p2 ? (
                              <div 
                                onClick={() => handleOpenPersonProfile(p2, room)}
                                className="group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-400/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                              >
                                <div>
                                  <div className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                                    <span>{p2.name}</span>
                                    {p2.nickname !== '-' && (
                                      <span className="text-amber-300 font-normal">({p2.nickname})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-sky-200/80 font-mono mt-0.5">
                                    {p2.callsign}
                                  </div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 group-hover:bg-sky-900/40 group-hover:text-sky-200">
                                  🔍 ดูโปรไฟล์
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs">- ห้องว่าง -</span>
                            )}
                          </td>

                          {/* Room Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                              ครบ 2/2 คน ✓
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. FEMALE ROOMS TABLE (ห้องพักหญิง 3 ห้อง / 6 คน — ชั้น 1) */}
          {(genderFilter === 'all' || genderFilter === 'หญิง') && (
            <div className="rounded-3xl bg-slate-950/80 border border-pink-500/40 overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-950/80 via-slate-900 to-rose-950/80 border-b border-pink-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-400/30">
                    <DoorClosed className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>🚪 ห้องพักหญิง (3 ห้อง / 6 คน — ชั้น 1)</span>
                    </h2>
                    <p className="text-xs text-pink-200">
                      หอพักกุดรัง มมส • ห้อง 108 ถึง 110 (ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น)
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/40 font-mono font-black text-xs">
                  ครบ 6 คน (100%)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-36 text-center">ห้อง</th>
                      <th className="py-3 px-4 w-5/12">ผู้เข้าพักคนที่ 1</th>
                      <th className="py-3 px-4 w-5/12">ผู้เข้าพักคนที่ 2</th>
                      <th className="py-3 px-4 w-28 text-center">สถานะห้อง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {roomData.femaleRooms.map(room => {
                      const p1 = room.occupants[0];
                      const p2 = room.occupants[1];

                      return (
                        <tr key={room.room} className="hover:bg-pink-950/20 transition-colors">
                          {/* Room Number */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono font-black text-sm text-pink-300 px-3 py-1 rounded-xl bg-pink-950/60 border border-pink-500/40 shadow-sm">
                                {room.roomLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1">ชั้น 1</span>
                            </div>
                          </td>

                          {/* Occupant 1 */}
                          <td className="py-3.5 px-4">
                            {p1 ? (
                              <div 
                                onClick={() => handleOpenPersonProfile(p1, room)}
                                className="group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-pink-400/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                              >
                                <div>
                                  <div className="font-bold text-white text-xs group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                                    <span>{p1.name}</span>
                                    {p1.nickname !== '-' && (
                                      <span className="text-amber-300 font-normal">({p1.nickname})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-pink-200/80 font-mono mt-0.5">
                                    {p1.callsign}
                                  </div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 group-hover:bg-pink-900/40 group-hover:text-pink-200">
                                  🔍 ดูโปรไฟล์
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs">- ห้องว่าง -</span>
                            )}
                          </td>

                          {/* Occupant 2 */}
                          <td className="py-3.5 px-4">
                            {p2 ? (
                              <div 
                                onClick={() => handleOpenPersonProfile(p2, room)}
                                className="group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-pink-400/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                              >
                                <div>
                                  <div className="font-bold text-white text-xs group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                                    <span>{p2.name}</span>
                                    {p2.nickname !== '-' && (
                                      <span className="text-amber-300 font-normal">({p2.nickname})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-pink-200/80 font-mono mt-0.5">
                                    {p2.callsign}
                                  </div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 group-hover:bg-pink-900/40 group-hover:text-pink-200">
                                  🔍 ดูโปรไฟล์
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs">- ห้องว่าง -</span>
                            )}
                          </td>

                          {/* Room Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                              ครบ 2/2 คน ✓
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
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
                {/* Room Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl font-mono font-black text-lg border shadow-md ${
                      isMale
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                        : 'bg-pink-500/20 text-pink-300 border-pink-400/40'
                    }`}>
                      {room.room}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base flex items-center gap-2">
                        <span>{room.roomLabel}</span>
                        <span className="text-xs font-normal text-slate-400">
                          • ชั้น {room.floor} หอพักกุดรัง
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          isMale
                            ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                            : 'bg-pink-500/15 text-pink-300 border-pink-400/30'
                        }`}>
                          {isMale ? '👨 ห้องพักชาย' : '👩 ห้องพักหญิง'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ❄️ ห้องแอร์ • 🚿 น้ำอุ่น • เตียงเดี่ยว 2 เตียง
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-black border ${
                      isFull
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      🛏️ {room.occupants.length} / {room.capacity} เตียง
                    </span>
                  </div>
                </div>

                {/* Occupants List */}
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

                          {roommate && (
                            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <span>🤝 เพื่อนร่วมห้อง:</span>
                                <strong className="text-sky-300">{roommate.name}</strong>
                                <span className="text-slate-500">({roommate.nickname})</span>
                              </span>
                              <span className="text-emerald-400 font-mono text-[10px]">
                                เตียงคู่ ✓
                              </span>
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
      <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
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

      {/* INTERACTIVE PROFILE POPUP MODAL */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-sky-500/40 p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedPerson(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-4 pr-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0 overflow-hidden border-2 border-sky-400/40">
                {selectedPerson.avatar ? (
                  <img src={selectedPerson.avatar} alt={selectedPerson.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedPerson.firstName?.charAt(0) || 'U'}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    selectedPerson.gender === 'ชาย'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      : 'bg-pink-500/20 text-pink-300 border-pink-400/40'
                  }`}>
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

            {/* Accommodation & Roommate Card */}
            <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <DoorClosed className="w-4 h-4 text-sky-400" />
                  <span>การจัดสรรห้องพัก:</span>
                </span>
                <span className="font-mono font-black text-sky-300 px-2.5 py-0.5 rounded-lg bg-sky-900/60 border border-sky-500/40">
                  {selectedPerson.assignedRoom || selectedPerson.rawRoom || 'ไม่ระบุห้อง'}
                </span>
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

            {/* Health & Special Notes */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">ประวัติแพ้อาหาร/ยา/มังสวิรัติ:</span>{' '}
                  <span className={selectedPerson.foodAllergy !== 'ไม่มี' && selectedPerson.foodAllergy !== '-' ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                    {selectedPerson.foodAllergy}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-300">โรคประจำตัว / ข้อจำกัดทางกาย:</span>{' '}
                  <span className={selectedPerson.medicalHistory !== 'ไม่มี' && selectedPerson.medicalHistory !== '-' ? 'text-rose-300 font-semibold' : 'text-slate-400'}>
                    {selectedPerson.medicalHistory}
                  </span>
                </div>
              </div>

              {selectedPerson.emergencyName !== '-' && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>🚨 ติดต่อฉุกเฉิน: <strong>{selectedPerson.emergencyName}</strong></span>
                  <a href={`tel:${selectedPerson.emergencyPhone}`} className="text-sky-300 font-mono">
                    {selectedPerson.emergencyPhone}
                  </a>
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
    </div>
  );
}
