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
  Key, 
  Layers, 
  Shield, 
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { resolveUniversityInfo, resolveGender, resolvePersonFullNameWithTitle } from '../data/defaultData';

export default function AdminRoomsView({
  registrations = [],
  onUpdateAllocation,
  onOpenProfileModal,
  triggerToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'ชาย', 'หญิง'
  const [roomFilter, setRoomFilter] = useState('all'); // 'all' or '101'..'110'
  const [copiedAll, setCopiedAll] = useState(false);

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

      const person = {
        raw: reg,
        id: reg.id || reg.user_id,
        user_id: reg.user_id,
        name: nameData.fullName,
        title: nameData.title,
        firstName: nameData.firstName,
        lastName: nameData.lastName,
        nickname: reg.nickname || '-',
        callsign: reg.callsign || '-',
        gender,
        phone: reg.phone || '-',
        email: reg.user_email || '',
        institution: reg.institution || '-',
        uniShort: uniInfo.shortTag,
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
      unassignedExternal,
      localMsu
    };
  }, [registrations, ROOM_CONFIGS]);

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

  // Overall counts
  const totalOccupants = useMemo(() => {
    return roomData.rooms.reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.rooms]);

  const totalMaleOccupants = useMemo(() => {
    return roomData.rooms.filter(r => r.gender === 'ชาย').reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.rooms]);

  const totalFemaleOccupants = useMemo(() => {
    return roomData.rooms.filter(r => r.gender === 'หญิง').reduce((sum, r) => sum + r.occupants.length, 0);
  }, [roomData.rooms]);

  // Copy full room assignment roster to clipboard
  const handleCopyRoster = () => {
    let text = `🏨 ผังการจัดห้องพัก หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (ชั้น 1 ห้อง 101 - 110)\n`;
    text += `โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027)\n`;
    text += `------------------------------------------------------------\n\n`;

    roomData.rooms.forEach(r => {
      text += `🚪 ห้อง ${r.room} (ชั้น 1 • ห้องพัก${r.gender === 'ชาย' ? 'ชาย 👨' : 'หญิง 👩'} • ${r.occupants.length}/${r.capacity} คน):\n`;
      if (r.occupants.length === 0) {
        text += `   - (ยังไม่มีผู้เข้าพัก)\n`;
      } else {
        r.occupants.forEach((p, idx) => {
          text += `   ${idx + 1}. ${p.name} (${p.nickname}) [${p.callsign}] สังกัด: ${p.uniShort} | โทร: ${p.phone}\n`;
        });
      }
      text += `\n`;
    });

    text += `🏠 สังกัด มมส (เดินทางไป-กลับเอง): ${roomData.localMsu.length} คน\n`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
    if (triggerToast) triggerToast('📋 คัดลอกผังห้องพัก 101-110 ลงคลิปบอร์ดเรียบร้อยแล้ว');
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
                <span>ชั้น 1 • ห้อง 101 - 110</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                URL: /admin/rooms
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🏨 จัดสรรห้องพัก & ระบบค้นหาเพื่อนร่วมห้อง</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ผังการเข้าพักหอพักกุดรัง ชั้น 1 แยกสัดส่วนห้องพักชาย-หญิงชัดเจน (ห้องละ 2 คน) พร้อมระบบค้นหารวดเร็วสำหรับ Dev และฝ่ายทะเบียนหน้างาน JRE 2027
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyRoster}
              className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'คัดลอกเรียบร้อย ✓' : '📋 คัดลอกผังห้องทั้งหมด'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>พิมพ์ใบรายชื่อจุดลงทะเบียน</span>
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
            <span className="text-[10px] text-slate-400">ห้อง 101 ถึง 110</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้เข้าพักหอพัก</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono">
              {totalOccupants} <span className="text-xs text-slate-400">/ 20 คน</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">✓ จัดสรรครบ 100%</span>
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

      {/* SEARCH & FILTERS BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Search */}
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

          {/* Gender Filter Tabs */}
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
              👨 ห้องชาย (7 ห้อง)
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
              👩 ห้องหญิง (3 ห้อง)
            </button>
          </div>
        </div>

        {/* Quick Room Number Jump Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">เลือกห้องทันที:</span>
          <button
            type="button"
            onClick={() => setRoomFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-mono font-bold shrink-0 transition-all cursor-pointer ${
              roomFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            ดูทั้งหมด
          </button>
          {ROOM_CONFIGS.map(c => {
            const isSelected = roomFilter === c.room;
            const isMale = c.gender === 'ชาย';
            return (
              <button
                key={c.room}
                type="button"
                onClick={() => setRoomFilter(isSelected ? 'all' : c.room)}
                className={`px-2.5 py-1 rounded-lg font-mono font-black shrink-0 border transition-all cursor-pointer ${
                  isSelected
                    ? isMale ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-pink-500 text-slate-950 border-pink-400'
                    : isMale ? 'bg-slate-900 text-sky-300 border-sky-500/30 hover:border-sky-400' : 'bg-slate-900 text-pink-300 border-pink-500/30 hover:border-pink-400'
                }`}
              >
                {c.room} ({c.gender === 'ชาย' ? 'ชาย' : 'หญิง'})
              </button>
            );
          })}
        </div>
      </div>

      {/* ROOMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
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

                {/* Capacity Badge */}
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

              {/* Occupants List (2 Beds) */}
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
                        onClick={() => onOpenProfileModal && onOpenProfileModal(person.raw, 'info')}
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

                        {/* Roommate Reference */}
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

      {/* MSU PARTICIPANTS SUMMARY (GOING HOME / NO DORM) */}
      <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              🏠
            </span>
            <div>
              <h3 className="text-sm font-black text-white">
                นิสิต / บุคลากร มมส (เดินทางไป-กลับเอง ไม่พักหอพัก)
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
              onClick={() => onOpenProfileModal && onOpenProfileModal(p.raw, 'info')}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
            >
              <div className="font-bold text-white text-[11px] truncate">{p.name}</div>
              <div className="text-[10px] text-amber-300 font-mono mt-0.5 truncate">{p.callsign}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
