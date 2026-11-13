import React, { useState } from 'react';
import {
  Eye,
  X,
  Copy,
  Check,
  Building,
  LayoutDashboard,
  IdCard,
  Shirt,
  User,
  Stethoscope,
  Link2
} from 'lucide-react';
import { resolvePersonFullNameWithTitle, normalizeCallsignSpacing, isMsuInstitution } from '../data/defaultData';
import { parseRoomInfo, parseSpecialNotesExtra } from '../utils/roomUtils';
import { buildUserPageUrl } from '../utils/router';

export default function DevPreviewBanner({
  inspectUid,
  previewRegistration,
  previewUser,
  registrations = [],
  currentTab,
  currentSubRoute,
  onSelectInspectUid,
  onSwitchInspectPage,
  onOpenDevUrls,
  onExitInspect
}) {
  const [copiedCurrent, setCopiedCurrent] = useState(false);

  const nameData = previewRegistration ? resolvePersonFullNameWithTitle(previewRegistration) : null;
  const extra = previewRegistration ? parseSpecialNotesExtra(previewRegistration) : {};
  const callsign = previewRegistration ? normalizeCallsignSpacing(extra.callsign || previewRegistration.callsign || '') : '';
  const nickname = extra.nickname || previewRegistration?.nickname || '';
  const parsedRoom = previewRegistration ? parseRoomInfo(previewRegistration.room_assigned) : { roomKey: '', floorNumber: 3 };
  const isMsu = previewRegistration ? isMsuInstitution(previewRegistration) : false;

  const displayName = nameData?.fullName || previewUser?.name || inspectUid;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const activePageKey = (() => {
    if (currentTab === 'my-room') return 'my-room';
    if (currentTab === 'id-card') return 'id-card';
    if (currentTab === 'merchandise') return currentSubRoute === 'my_orders' ? 'orders' : 'merchandise';
    if (currentTab === 'register' && currentSubRoute === 'form') return 'register';
    return 'dashboard';
  })();

  const handleCopyCurrent = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopiedCurrent(true);
    setTimeout(() => setCopiedCurrent(false), 2000);
  };

  return (
    <div className="sticky top-14 sm:top-16 z-40 w-full bg-gradient-to-r from-cyan-950/95 via-slate-900/95 to-indigo-950/95 border-b border-cyan-500/40 backdrop-blur-md shadow-lg">
      <div className="w-full max-w-[1850px] mx-auto px-3 sm:px-5 py-2 flex flex-col xl:flex-row xl:items-center justify-between gap-2">
        {/* Left: Target account badge + Switcher */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-black shrink-0">
            <Eye className="w-3.5 h-3.5 text-cyan-300" />
            <span>DEV ดูเป็นบัญชี:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-xs sm:text-sm font-black text-white truncate">
              {displayName}
            </span>
            {nickname && nickname !== '-' && (
              <span className="text-xs font-bold text-cyan-200">({nickname})</span>
            )}
            {callsign && callsign !== '-' && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-black">
                {callsign}
              </span>
            )}
            {parsedRoom.roomKey ? (
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[10px] font-bold">
                🏨 ชั้น {parsedRoom.floorNumber || 3} ห้อง {parsedRoom.roomKey}
              </span>
            ) : isMsu ? (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                🏠 มมส (ไป-กลับเอง)
              </span>
            ) : !previewRegistration ? (
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-bold">
                ยังไม่มีใบสมัคร
              </span>
            ) : null}
          </div>

          <select
            value={inspectUid || ''}
            onChange={(e) => e.target.value && onSelectInspectUid?.(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-bold text-cyan-100 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[240px]"
            title="สลับบัญชีผู้เข้าร่วมที่ต้องการตรวจสอบ"
          >
            <option value="">-- สลับดูบัญชีคนอื่น --</option>
            {registrations.map((r, i) => {
              const uid = r.user_id || r.id;
              const n = resolvePersonFullNameWithTitle(r);
              const ex = parseSpecialNotesExtra(r);
              const rm = parseRoomInfo(r.room_assigned);
              return (
                <option key={uid || i} value={uid}>
                  {i + 1}. {n.fullName} {ex.nickname && ex.nickname !== '-' ? `(${ex.nickname})` : ''}{rm.roomKey ? ` [ห้อง ${rm.roomKey}]` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Right: Quick page tabs keeping same UID + Copy URL + Exit */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {[
            { key: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
            { key: 'my-room', label: 'ห้องพัก', icon: Building },
            { key: 'id-card', label: 'บัตร ID', icon: IdCard },
            { key: 'merchandise', label: 'สั่งเสื้อ', icon: Shirt }
          ].map(tab => {
            const IconComp = tab.icon;
            const active = activePageKey === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSwitchInspectPage?.(tab.key)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow'
                    : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400/50'
                }`}
              >
                <IconComp className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onSwitchInspectPage?.('profile')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 border bg-slate-900/90 text-cyan-200 border-slate-700 hover:border-cyan-400/50 cursor-pointer"
          >
            <User className="w-3 h-3" />
            <span>โปรไฟล์</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchInspectPage?.('medical')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 border bg-slate-900/90 text-rose-200 border-slate-700 hover:border-rose-400/50 cursor-pointer"
          >
            <Stethoscope className="w-3 h-3" />
            <span>เวชระเบียน</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCurrent}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 border bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border-emerald-500/40 cursor-pointer"
            title={`คัดลอก URL หน้านี้พร้อม UID:\n${buildUserPageUrl(inspectUid, activePageKey, typeof window !== 'undefined' ? window.location.origin : '')}`}
          >
            {copiedCurrent ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCurrent ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenDevUrls}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 border bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border-indigo-500/40 cursor-pointer"
            title="กลับหน้าศูนย์รวม URL ทุกคน"
          >
            <Link2 className="w-3 h-3" />
            <span>รวม URL ทุกคน</span>
          </button>

          <button
            type="button"
            onClick={onExitInspect}
            className="px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1 bg-rose-600/85 hover:bg-rose-500 text-white border border-rose-400/40 cursor-pointer shadow"
            title="ออกจากโหมดดูบัญชีผู้สมัคร กลับเป็นบัญชี Dev ปกติ"
          >
            <X className="w-3.5 h-3.5" />
            <span>ออก</span>
          </button>
        </div>
      </div>
    </div>
  );
}
