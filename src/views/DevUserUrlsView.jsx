import React, { useMemo, useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Search,
  Building,
  UserCheck,
  IdCard,
  Shirt,
  LayoutDashboard,
  Stethoscope,
  User,
  Eye,
  ShieldCheck,
  Layers,
  BedDouble,
  Filter,
  HeartPulse,
  ClipboardList,
  CreditCard
} from 'lucide-react';
import {
  resolveUniversityInfo,
  resolveGender,
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing,
  isRegistrationWithoutAccount,
  getParticipantPhoto
} from '../data/defaultData';
import {
  buildDormitoryRoomData,
  parseSpecialNotesExtra,
  parseRoomInfo
} from '../utils/roomUtils';
import { buildUserPageUrl } from '../utils/router';

const USER_PAGE_SPECS = [
  { key: 'dashboard', label: 'แดชบอร์ด', pathPrefix: '/dashboard', icon: LayoutDashboard, color: 'emerald' },
  { key: 'my-room', label: 'ห้องพัก', pathPrefix: '/my-room', icon: Building, color: 'sky' },
  { key: 'medical-support', label: 'เตรียมยา', pathPrefix: '/medical-support', icon: HeartPulse, color: 'teal' },
  { key: 'my-emr', label: 'EMR ส่วนตัว', pathPrefix: '/my-emr', icon: ClipboardList, color: 'indigo' },
  { key: 'my-payment', label: 'ชำระเงิน', pathPrefix: '/my-payment', icon: CreditCard, color: 'violet' },
  { key: 'id-card', label: 'บัตร ID', pathPrefix: '/id-card', icon: IdCard, color: 'orange' },
  { key: 'merchandise', label: 'สั่งเสื้อ', pathPrefix: '/merchandise', icon: Shirt, color: 'amber' },
  { key: 'profile', label: 'โปรไฟล์', pathPrefix: '/users', icon: User, color: 'cyan' },
  { key: 'medical', label: 'เวชระเบียนรวม', pathPrefix: '/admin/medical', icon: Stethoscope, color: 'rose' }
];

const BUTTON_COLOR_CLASSES = {
  emerald: 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border-emerald-500/40',
  sky: 'bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 border-sky-500/40',
  teal: 'bg-teal-950/70 hover:bg-teal-900/80 text-teal-200 border-teal-500/40',
  indigo: 'bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border-indigo-500/40',
  violet: 'bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 border-violet-500/40',
  orange: 'bg-orange-950/70 hover:bg-orange-900/80 text-orange-200 border-orange-500/40',
  amber: 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border-amber-500/40',
  cyan: 'bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border-cyan-500/40',
  rose: 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border-rose-500/40'
};

export default function DevUserUrlsView({
  registrations = [],
  userAccounts = [],
  onOpenUserPage,
  onNavigateAdminTab,
  triggerToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'dorm' | 'msu' | 'no-account' | 'unreg-accounts'
  const [roomFilter, setRoomFilter] = useState('all');
  const [copiedKey, setCopiedKey] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const roomData = useMemo(() => buildDormitoryRoomData(registrations), [registrations]);

  const roommatesByPersonId = useMemo(() => {
    const map = new Map();
    (roomData.rooms || []).forEach(rm => {
      (rm.occupants || []).forEach(occ => {
        const mates = (rm.occupants || [])
          .filter(m => m.id !== occ.id)
          .map(m => `${m.nickname && m.nickname !== '-' ? m.nickname : m.firstName} (${m.callsign})`);
        map.set(occ.id, {
          room: rm.room,
          floor: rm.floor || 3,
          mates
        });
      });
    });
    return map;
  }, [roomData.rooms]);

  const regEntries = useMemo(() => {
    return (registrations || []).map((reg, index) => {
      const uid = String(reg.user_id || reg.id || '').trim();
      const nameData = resolvePersonFullNameWithTitle(reg);
      const uniInfo = resolveUniversityInfo(reg);
      const gender = resolveGender(reg);
      const extra = parseSpecialNotesExtra(reg);
      const callsign = normalizeCallsignSpacing(extra.callsign || reg.callsign || '-');
      const nickname = extra.nickname || reg.nickname || '-';
      const parsedRoom = parseRoomInfo(reg.room_assigned);
      const roomMeta = roommatesByPersonId.get(reg.id || reg.user_id);
      const roomNumber = parsedRoom.roomKey || roomMeta?.room || '';
      const roomFloor = parsedRoom.floorNumber || roomMeta?.floor || 3;
      const isDormOptOut = Boolean(extra.dorm_opt_out || reg.dorm_opt_out);
      const isNoAccount = isRegistrationWithoutAccount(reg, userAccounts);
      const photo = getParticipantPhoto(reg) || '';

      return {
        kind: 'registration',
        index: index + 1,
        uid,
        regId: reg.id,
        email: reg.user_email || '',
        fullName: nameData.fullName,
        nickname,
        callsign,
        uniShort: uniInfo.shortTag,
        isMsu: uniInfo.isMsu,
        gender,
        roomNumber,
        roomFloor,
        isDormOptOut,
        mates: roomMeta?.mates || [],
        isNoAccount,
        photo,
        reg
      };
    });
  }, [registrations, userAccounts, roommatesByPersonId]);

  const unregisteredAccountEntries = useMemo(() => {
    const seenIds = new Set(regEntries.map(e => e.uid.toLowerCase()));
    const seenEmails = new Set(regEntries.map(e => e.email.trim().toLowerCase()).filter(Boolean));
    return (userAccounts || [])
      .filter(acc => {
        const aid = String(acc.id || '').trim().toLowerCase();
        const aemail = String(acc.email || '').trim().toLowerCase();
        if (aid && seenIds.has(aid)) return false;
        if (aemail && seenEmails.has(aemail)) return false;
        return Boolean(acc.id);
      })
      .map((acc, idx) => ({
        kind: 'account_only',
        index: idx + 1,
        uid: String(acc.id || '').trim(),
        regId: null,
        email: acc.email || '',
        fullName: acc.name || acc.email || acc.id,
        nickname: '-',
        callsign: acc.role === 'admin' || acc.role === 'dev' ? String(acc.role).toUpperCase() : '-',
        uniShort: '-',
        isMsu: false,
        gender: '-',
        roomNumber: '',
        roomFloor: 3,
        isDormOptOut: false,
        mates: [],
        isNoAccount: false,
        photo: acc.avatar || '',
        account: acc
      }));
  }, [userAccounts, regEntries]);

  const filteredEntries = useMemo(() => {
    const source = scopeFilter === 'unreg-accounts' ? unregisteredAccountEntries : regEntries;
    const q = searchQuery.trim().toLowerCase();

    return source
      .filter(item => {
        if (scopeFilter === 'dorm' && (item.isMsu || !item.roomNumber)) return false;
        if (scopeFilter === 'msu' && !item.isMsu) return false;
        if (scopeFilter === 'no-account' && !item.isNoAccount) return false;
        if (roomFilter !== 'all' && item.roomNumber !== roomFilter) return false;
        if (!q) return true;
        return (
          item.fullName.toLowerCase().includes(q) ||
          item.nickname.toLowerCase().includes(q) ||
          item.callsign.toLowerCase().includes(q) ||
          item.uid.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.roomNumber.toLowerCase().includes(q) ||
          item.uniShort.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (scopeFilter === 'dorm' || roomFilter !== 'all') {
          return Number(a.roomNumber || 999) - Number(b.roomNumber || 999);
        }
        return a.index - b.index;
      });
  }, [scopeFilter, roomFilter, searchQuery, regEntries, unregisteredAccountEntries]);

  const copyText = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(prev => (prev === key ? '' : prev)), 2000);
    if (triggerToast) triggerToast(`คัดลอก ${label} เรียบร้อยแล้ว:\n${text}`, 'success');
  };

  const handleCopyAllUrlsForPerson = (item) => {
    const lines = [
      `👤 ${item.fullName} (${item.nickname} • ${item.callsign})`,
      `🆔 UID: ${item.uid}`,
      `🏨 ห้องพัก: ${item.roomNumber ? `หอพักกุดรัง ชั้น ${item.roomFloor} ห้อง ${item.roomNumber}` : (item.isMsu ? 'มมส (ไป-กลับเอง)' : 'รอจัดห้อง')}`,
      ...USER_PAGE_SPECS.map(spec => `• ${spec.label}: ${buildUserPageUrl(item.uid, spec.key, origin)}`)
    ];
    copyText(lines.join('\n'), `all-${item.uid}`, `ลิงก์ทุกหน้าของ ${item.fullName}`);
  };

  const dormCount = regEntries.filter(e => !e.isMsu && e.roomNumber).length;
  const msuCount = regEntries.filter(e => e.isMsu).length;
  const noAccountCount = regEntries.filter(e => e.isNoAccount).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Dev Room-Check & URL Architecture Header */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
              <span>DEV ACCOUNT INSPECTOR • UID URL SYSTEM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Link2 className="w-6 h-6 text-cyan-400 shrink-0" />
              <span>ศูนย์รวม URL ตรวจสอบห้องพัก &amp; เปิดดูหน้าทุกหน้าเป็นบัญชีรายบุคคล (ตาม UID)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              สิทธิ์ Dev / Admin สามารถกดเปิดดูหรือคัดลอก URL ที่มี <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">?uid=&lt;UID&gt;</code> เพื่อจำลองมุมมองเว็บเป็นบัญชีของสมาชิกแต่ละคนได้ทุกหน้า (แดชบอร์ด, ห้องพัก, บัตร ID, สั่งเสื้อ, โปรไฟล์, เวชระเบียน)
            </p>
          </div>
        </div>

        {/* Where to check rooms quick cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onNavigateAdminTab?.('rooms')}
            className="p-3.5 rounded-2xl bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sky-300 text-xs font-black mb-1">
              <span>1. ผังห้องพัก Admin (ชั้น 3)</span>
              <Building className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-200 font-bold">ตรวจ/ย้ายห้อง/กุญแจ ครบ 10 ห้อง</div>
            <div className="text-[10px] font-mono text-sky-400 mt-1">/admin/rooms</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateAdminTab?.('documents')}
            className="p-3.5 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-indigo-300 text-xs font-black mb-1">
              <span>2. ใบเซ็นชื่อ &amp; ใบตรวจห้อง Staff</span>
              <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-200 font-bold">พิมพ์เอกสาร PDPA &amp; ตรวจโรค/ยา</div>
            <div className="text-[10px] font-mono text-indigo-400 mt-1">/admin/documents</div>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('dorm')}
            className="p-3.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-300 text-xs font-black mb-1">
              <span>3. หน้าห้องพักรายคน (ผู้เข้าพัก)</span>
              <BedDouble className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-200 font-bold">เลือกกดปุ่ม &ldquo;ห้องพัก&rdquo; ด้านล่าง ({dormCount} คน)</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1">/my-room?uid=&lt;UID&gt;</div>
          </button>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
            <div className="flex items-center justify-between text-amber-300 text-xs font-black mb-1">
              <span>4. รูปแบบ URL ลัดตาม UID</span>
              <Link2 className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-mono text-slate-300 space-y-0.5 leading-relaxed">
              <div>/u/&lt;UID&gt;/dashboard • /u/&lt;UID&gt;/my-room</div>
              <div>/u/&lt;UID&gt;/medical-support • /u/&lt;UID&gt;/my-emr</div>
              <div>/u/&lt;UID&gt;/my-payment • /u/&lt;UID&gt;/id-card • /merchandise</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วย ชื่อ-นามสกุล, ชื่อเล่น, นามเรียกขาน (เช่น TSI 2002, ว่านหอม), เลขห้อง (307-333), อีเมล หรือ UID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roomFilter}
              onChange={(e) => {
                setRoomFilter(e.target.value);
                if (e.target.value !== 'all' && scopeFilter === 'unreg-accounts') setScopeFilter('all');
              }}
              className="px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">ทุกห้อง / ทุกสถานะ</option>
              <optgroup label="ห้องพักหญิง (ชั้น 3)">
                <option value="307">ห้อง 307 (หญิง)</option>
                <option value="309">ห้อง 309 (หญิง)</option>
                <option value="315">ห้อง 315 (หญิง)</option>
              </optgroup>
              <optgroup label="ห้องพักชาย (ชั้น 3)">
                <option value="319">ห้อง 319 (ชาย)</option>
                <option value="320">ห้อง 320 (ชาย)</option>
                <option value="322">ห้อง 322 (ชาย)</option>
                <option value="323">ห้อง 323 (ชาย)</option>
                <option value="324">ห้อง 324 (ชาย)</option>
                <option value="331">ห้อง 331 (ชาย)</option>
                <option value="333">ห้อง 333 (ชาย)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Scope filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `ผู้สมัครทั้งหมด (${regEntries.length})` },
            { id: 'dorm', label: `🛏️ พักหอพักชั้น 3 (${dormCount})` },
            { id: 'msu', label: `🏠 มมส ไป-กลับเอง (${msuCount})` },
            { id: 'no-account', label: `⚠️ ไม่มีบัญชี / Admin เพิ่ม (${noAccountCount})` },
            { id: 'unreg-accounts', label: `👤 บัญชีที่ยังไม่กรอกใบสมัคร (${unregisteredAccountEntries.length})` }
          ].map(pill => (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                setScopeFilter(pill.id);
                if (pill.id === 'unreg-accounts') setRoomFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                scopeFilter === pill.id
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Person List */}
        <div className="space-y-3 pt-2">
          {filteredEntries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-sm text-slate-400">
              ไม่พบรายชื่อที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredEntries.map((item) => {
              const roomPageUrl = buildUserPageUrl(item.uid, 'my-room', origin);
              const dashPageUrl = buildUserPageUrl(item.uid, 'dashboard', origin);

              return (
                <div
                  key={`${item.kind}-${item.uid}`}
                  className="p-4 rounded-2xl bg-slate-950/85 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left identity */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-black text-slate-300 flex items-center justify-center shrink-0">
                        {item.index}
                      </span>
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.fullName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white truncate">
                            {item.fullName}
                          </h3>
                          {item.nickname && item.nickname !== '-' && (
                            <span className="text-xs font-bold text-slate-300">
                              ({item.nickname})
                            </span>
                          )}
                          {item.callsign && item.callsign !== '-' && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black">
                              {item.callsign}
                            </span>
                          )}
                          {item.uniShort && item.uniShort !== '-' && (
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                              item.isMsu
                                ? 'bg-amber-950/60 text-amber-200 border-amber-500/30'
                                : 'bg-indigo-950/60 text-indigo-200 border-indigo-500/30'
                            }`}>
                              {item.uniShort}
                            </span>
                          )}
                          {item.isNoAccount && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                              ไม่มีบัญชี (Admin เพิ่ม)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => copyText(item.uid, `uid-${item.uid}`, `UID ของ ${item.fullName}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 font-mono font-bold cursor-pointer"
                            title="คลิกเพื่อคัดลอก UID"
                          >
                            <span>UID: {item.uid}</span>
                            {copiedKey === `uid-${item.uid}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>

                          {item.roomNumber ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-200 font-bold">
                              <Building className="w-3 h-3 text-sky-400" />
                              <span>
                                ชั้น {item.roomFloor} ห้อง {item.roomNumber} ({item.gender})
                                {item.mates.length > 0 ? ` • เมท: ${item.mates.join(', ')}` : ''}
                              </span>
                            </span>
                          ) : item.isMsu ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                              🏠 มมส (ไป-กลับเอง)
                            </span>
                          ) : item.kind === 'registration' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-500/30 text-amber-300 font-semibold">
                              {item.isDormOptOut ? '🚫 ไม่ประสงค์พักหอ' : '⏳ รอจัดห้องพัก'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-semibold">
                              บัญชีผู้ใช้ (ยังไม่มีใบสมัคร)
                            </span>
                          )}

                          {item.email && (
                            <span className="text-slate-400 font-mono text-[10px]">{item.email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Copy All URLs */}
                    <button
                      type="button"
                      onClick={() => handleCopyAllUrlsForPerson(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 shrink-0 cursor-pointer self-start md:self-center"
                    >
                      {copiedKey === `all-${item.uid}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>คัดลอกครบทุก URL</span>
                    </button>
                  </div>

                  {/* Per-page URL action buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2 pt-2 border-t border-slate-800/80">
                    {USER_PAGE_SPECS.map(spec => {
                      const IconComp = spec.icon;
                      const fullUrl = buildUserPageUrl(item.uid, spec.key, origin);
                      const cKey = `${spec.key}-${item.uid}`;
                      return (
                        <div
                          key={spec.key}
                          className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 gap-1 ${BUTTON_COLOR_CLASSES[spec.color]}`}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenUserPage?.(item.uid, spec.key)}
                            className="flex items-center gap-1.5 text-xs font-bold truncate flex-1 text-left cursor-pointer"
                            title={`เปิดดูหน้า${spec.label}ในมุมมองของ ${item.fullName}\n${fullUrl}`}
                          >
                            <IconComp className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{spec.label}</span>
                          </button>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyText(fullUrl, cKey, `URL หน้า${spec.label} (${item.fullName})`)}
                              className="p-1 rounded-lg hover:bg-black/30 cursor-pointer"
                              title={`คัดลอก URL: ${fullUrl}`}
                            >
                              {copiedKey === cKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg hover:bg-black/30"
                              title={`เปิดแท็บใหม่: ${fullUrl}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Copyable Direct Room & Dashboard URL preview */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-800/70">
                    <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      แดชบอร์ด: <span className="text-emerald-300">{dashPageUrl}</span>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="truncate">
                      ห้องพัก: <span className="text-sky-300">{roomPageUrl}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
