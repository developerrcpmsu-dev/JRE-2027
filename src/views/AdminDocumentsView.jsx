import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  FileText, 
  Download, 
  Printer, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Shirt, 
  Users, 
  Stethoscope,
  ShieldCheck,
  CreditCard,
  ClipboardList,
  Search,
  QrCode,
  Pill,
  FileHeart
} from 'lucide-react';
import { 
  resolveUniversityInfo, 
  resolveGender, 
  resolvePersonFullNameWithTitle,
  resolveApplicantMemberType,
  normalizeCallsignSpacing,
  normalizeShirtSize,
  getRegistrationPaymentResolution,
  getApplicantMedical,
  getApplicantAllergy,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  formatMedicalLabel,
  formatAllergyLabel,
  hasSpecialCareCondition,
  getMedicalEquipmentNeeded,
  getHealthConsentInfo,
  isCommitteeDutyNote,
  isRegistrationWithoutAccount,
  isRealParticipantPhoto,
  resolveCommitteeDutyNote
} from '../data/defaultData';
import { 
  buildDormitoryRoomData,
  parseSpecialNotesExtra,
  getSpecialItemsNeeded,
  parseRoomInfo
} from '../utils/roomUtils';
import { getAttendanceConfirmationInfo, DataService } from '../supabase';
import { getIdCardCode, getIdCardQrPayload } from '../utils/idCard';
import { findPersonForEmrLog, formatPersonSummary, matchEmrLogToPerson } from '../utils/emrUtils';
import { buildEmrCaseUrl, buildEmrPersonUrl, buildMyEmrCaseUrl, buildUserPageUrl } from '../utils/router';
import { subscribeToRealtimeChanges } from '../utils/realtimeSync';
import { QrMasterSheet, MedicalSuppliesSheet, EmrRecordsSheet } from '../components/DocumentsExtraSheets';
import { 
  exportAttendanceRosterToExcel,
  exportIdCardRosterToExcel,
  exportShirtRosterToExcel,
  exportDormitoryRosterToExcel,
  exportAllQrMasterToExcel,
  exportDormitoryStaffMedicalExcel,
  exportAdminMasterRosterExcel,
  exportMedicalSuppliesPrepToExcel,
  exportEmrRecordsToExcel,
  exportAllRostersToMasterExcel,
  downloadCsv,
  exportElementToPng
} from '../utils/documentExporters';

const VALID_DOC_TABS = new Set([
  'attendance',
  'id-cards',
  'shirts',
  'rooms',
  'qr-master',
  'rooms-staff',
  'admin-master',
  'medical-supplies',
  'emr-records'
]);

function getInitialDocTab() {
  if (typeof window === 'undefined') return 'attendance';
  const params = new URLSearchParams(window.location.search);
  const param = (params.get('doc') || params.get('tab') || '').toLowerCase();
  if (param && VALID_DOC_TABS.has(param)) return param;
  return 'attendance';
}

/**
 * Classify a participant into roster tiers requested for official rosters:
 * 1: Staff -> 2: RCP -> 3: TSI -> 4: นิสิตอาสา
 */
function resolveRosterRoleGroup(item) {
  const callsignRaw = String(item?.callsign || '').trim();
  const callsignUpper = callsignRaw.toUpperCase();
  const roleStr = String(item?.role || '');
  const isStaffMember = Boolean(
    item?.isStaff ||
    item?.isCommittee ||
    callsignUpper.includes('STAFF') ||
    roleStr.includes('Staff') ||
    roleStr.includes('คณะกรรมการ')
  );
  if (isStaffMember) {
    return { rank: 1, label: 'Staff', subOrder: callsignUpper.includes('TSI') ? 2 : 1 };
  }
  if (/^อาสา/.test(callsignRaw)) {
    return { rank: 4, label: 'นิสิตอาสา', subOrder: 4 };
  }
  if (/^TSI\b/i.test(callsignUpper)) {
    return { rank: 3, label: 'TSI', subOrder: 3 };
  }
  if (/\bRCP\b/i.test(callsignUpper) || /^\d{2}-\d{2}/.test(callsignRaw) || item?.isMsu) {
    return { rank: 2, label: 'RCP', subOrder: 2 };
  }
  return { rank: 4, label: 'นิสิตอาสา', subOrder: 4 };
}

function getCallsignSortKey(item) {
  const raw = String(item?.callsign || '').trim();
  return raw.replace(/^RCP\s+/i, '').trim();
}

function compareOfficialRosterPerson(a, b) {
  const gRank = (g) => (g === 'ชาย' ? 1 : g === 'หญิง' ? 2 : 3);
  const gDiff = gRank(a.gender) - gRank(b.gender);
  if (gDiff !== 0) return gDiff;

  const grpA = resolveRosterRoleGroup(a);
  const grpB = resolveRosterRoleGroup(b);
  if (grpA.rank !== grpB.rank) return grpA.rank - grpB.rank;
  if (grpA.subOrder !== grpB.subOrder) return grpA.subOrder - grpB.subOrder;

  const csDiff = getCallsignSortKey(a).localeCompare(getCallsignSortKey(b), 'th', { numeric: true });
  if (csDiff !== 0) return csDiff;
  return String(a.name || '').localeCompare(String(b.name || ''), 'th');
}

function getRosterGroupBadgeClasses(label) {
  if (label === 'Staff') return 'bg-slate-200 text-slate-950 border-slate-900';
  if (label === 'RCP') return 'bg-sky-50 text-sky-950 border-sky-800';
  if (label === 'TSI') return 'bg-indigo-50 text-indigo-950 border-indigo-800';
  return 'bg-amber-50 text-amber-950 border-amber-800';
}

function AttendanceGenderTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-black text-slate-950 flex flex-wrap items-center justify-between gap-2">
        <span>{title} ({rows.length} คน)</span>
        <span className="text-[11px] font-semibold text-slate-700">เรียงตามลำดับ: Staff ➔ RCP ➔ TSI ➔ นิสิตอาสา</span>
      </h3>
      <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
        <thead>
          <tr className="bg-slate-200 text-slate-950 font-bold text-center">
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-10">ลำดับ</th>
            <th className="py-2.5 px-3 border-[1.5px] border-slate-950 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20 whitespace-nowrap">ชื่อเล่น</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-28 whitespace-nowrap">นามเรียกขาน</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-16 whitespace-nowrap">สถาบัน</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-36">ประเภท / บทบาท</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-24 whitespace-nowrap">เบอร์โทร</th>
            <th className="py-2.5 px-4 border-[1.5px] border-slate-950 w-36">ลายมือชื่อผู้เข้าร่วม</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-28">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, idx) => (
            <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
              <td className="py-2 px-2 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
              <td className="py-2 px-3 border border-slate-700 font-bold text-slate-950 whitespace-nowrap">{p.name}</td>
              <td className="py-2 px-2 border border-slate-700 text-center whitespace-nowrap">{p.nickname}</td>
              <td className="py-2 px-2 border border-slate-700 text-center font-mono font-semibold whitespace-nowrap">{p.callsign}</td>
              <td className="py-2 px-2 border border-slate-700 text-center font-bold whitespace-nowrap">{p.institution}</td>
              <td className="py-2 px-2 border border-slate-700 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 border text-[9.5px] font-black leading-none ${getRosterGroupBadgeClasses(p.rosterGroup)}`}>
                    {p.rosterGroup}
                  </span>
                  <span>{p.role}</span>
                </div>
                {p.isNoAccount && (
                  <span className="inline-flex items-center mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-700 text-[9px] font-bold leading-none">
                    Admin เพิ่ม • ไม่มีบัญชี
                  </span>
                )}
              </td>
              <td className="py-2 px-2 border border-slate-700 text-center font-mono whitespace-nowrap">
                {p.phone !== '-' ? p.phone : <span className="text-slate-500">ไม่มีข้อมูล</span>}
              </td>
              <td className="py-2 px-4 border border-slate-700 text-center">
                <span className="block border-b border-dotted border-slate-700 h-5 w-full"></span>
              </td>
              <td className="py-2 px-2 border border-slate-700 text-[10px] text-slate-800">{p.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IdCardGenderTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-black text-slate-950 flex flex-wrap items-center justify-between gap-2">
        <span>{title} ({rows.length} ใบ)</span>
        <span className="text-[11px] font-semibold text-slate-700">เรียงตามลำดับ: Staff ➔ RCP ➔ TSI ➔ นิสิตอาสา</span>
      </h3>
      <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
        <thead>
          <tr className="bg-slate-200 text-slate-950 font-bold text-center">
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-10">ลำดับ</th>
            <th className="py-2.5 px-3 border-[1.5px] border-slate-950 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20 whitespace-nowrap">ชื่อเล่น</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-28 whitespace-nowrap">นามเรียกขาน</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-14 whitespace-nowrap">สังกัด</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-36">ประเภทบัตร / บทบาท</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-32">สถานะบัตร</th>
            <th className="py-2.5 px-4 border-[1.5px] border-slate-950 w-36">ลายมือชื่อผู้รับบัตร</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20">วันที่รับ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, idx) => (
            <tr key={c.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
              <td className="py-2 px-2 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
              <td className="py-2 px-3 border border-slate-700 font-bold text-slate-950 whitespace-nowrap">{c.name}</td>
              <td className="py-2 px-2 border border-slate-700 text-center whitespace-nowrap">{c.nickname}</td>
              <td className="py-2 px-2 border border-slate-700 text-center font-mono font-semibold whitespace-nowrap">{c.callsign}</td>
              <td className="py-2 px-2 border border-slate-700 text-center font-bold whitespace-nowrap">{c.institution}</td>
              <td className="py-2 px-2 border border-slate-700 text-[11px]">
                <span className={`inline-flex items-center mr-1 px-1.5 py-0.5 border text-[9.5px] font-black leading-none ${getRosterGroupBadgeClasses(c.rosterGroup)}`}>
                  {c.rosterGroup}
                </span>
                {c.role}
              </td>
              <td className="py-2 px-2 border border-slate-700 text-center text-[10px] font-semibold">
                <span className={c.isReceived ? 'text-emerald-800 font-bold' : (c.hasPhoto ? 'text-slate-900' : 'text-amber-800')}>
                  {c.idCardStatus}
                </span>
              </td>
              <td className="py-2 px-4 border border-slate-700 text-center">
                <span className="block border-b border-dotted border-slate-700 h-5 w-full"></span>
              </td>
              <td className="py-2 px-2 border border-slate-700 text-center font-mono text-[11px]">{c.idCardReceivedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DormSignInZoneTable({ title, subtitle, rooms, altBgClass, zoneLabel }) {
  return (
    <div>
      <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-600">{subtitle}</span>
      </h3>

      <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
        <thead>
          <tr className="bg-slate-200 text-slate-950 font-bold text-center">
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20">ห้อง</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-16">เตียง</th>
            <th className="py-2.5 px-3 border-[1.5px] border-slate-950 text-left min-w-[200px] whitespace-nowrap">ชื่อ - นามสกุล ผู้เข้าพัก</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20 whitespace-nowrap">ชื่อเล่น</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-28 whitespace-nowrap">นามเรียกขาน</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-24 whitespace-nowrap">เบอร์โทร</th>
            <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-28">เข้าพัก &amp; กุญแจ</th>
            <th className="py-2.5 px-4 border-[1.5px] border-slate-950 w-28">ลายมือชื่อรับกุญแจ</th>
            <th className="py-2.5 px-4 border-[1.5px] border-slate-950 w-28">ลายมือชื่อคืนกุญแจ</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((rm) => (
            <React.Fragment key={rm.room}>
              {[0, 1].map((b) => {
                const p = rm.occupants[b];
                const isOptOut = Boolean(p?.dormOptOut);
                return (
                  <tr
                    key={`${rm.room}-${b}`}
                    className={`${b === 1 ? 'official-room-end ' : ''}${isOptOut ? 'bg-amber-50/70' : (b === 1 ? altBgClass : 'bg-white')}`}
                  >
                    {b === 0 && (
                      <td rowSpan={2} className="py-2 px-2 border border-slate-900 border-b-2 border-b-slate-950 text-center font-mono font-black text-sm bg-slate-100 align-middle">
                        {rm.roomLabel}
                        <span className="block text-[10px] font-normal text-slate-700">
                          {rm.floorLabel ? `${rm.floorLabel} (${zoneLabel.includes('ชาย') ? 'ชาย' : 'หญิง'})` : zoneLabel}
                        </span>
                        <span className="block text-[9px] font-sans font-bold text-slate-900 mt-0.5">
                          กุญแจ: {rm.keySummaryLabel}
                        </span>
                      </td>
                    )}
                    <td className="py-2 px-2 border border-slate-700 text-center font-mono text-[11px]">เตียง {b + 1}</td>
                    <td className="py-2 px-3 border border-slate-700 font-bold text-slate-950 whitespace-nowrap">
                      {p ? (
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="whitespace-nowrap">{p.name}</span>
                          {isOptOut && (
                            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 border border-amber-700 text-[9px] font-black whitespace-nowrap">
                              ไม่พักหอ
                            </span>
                          )}
                        </div>
                      ) : '(ว่าง)'}
                    </td>
                    <td className="py-2 px-2 border border-slate-700 text-center whitespace-nowrap">{p ? p.nickname : '-'}</td>
                    <td className="py-2 px-2 border border-slate-700 text-center font-mono whitespace-nowrap">{p ? p.callsign : '-'}</td>
                    <td className="py-2 px-2 border border-slate-700 text-center font-mono whitespace-nowrap">{p ? p.phone : '-'}</td>
                    <td className="py-2 px-2 border border-slate-700 text-center text-[10px]">
                      <div className="font-mono font-bold text-slate-800">K-{rm.room}</div>
                      {p ? (
                        isOptOut ? (
                          <span className="text-amber-900 font-bold">ไม่พักหอ</span>
                        ) : p.roomKeyReturned ? (
                          <span className="text-emerald-800 font-bold">คืนกุญแจแล้ว</span>
                        ) : p.roomKeyHeld ? (
                          <span className="text-sky-900 font-bold">ถือกุญแจ</span>
                        ) : (
                          <span className="text-slate-700">☐ รอรับกุญแจ</span>
                        )
                      ) : '-'}
                    </td>
                    <td className="py-2 px-4 border border-slate-700 text-center">
                      {isOptOut ? (
                        <span className="text-[10px] font-bold text-amber-900">(ไม่เข้าพัก)</span>
                      ) : (
                        <span className="block border-b border-dotted border-slate-700 h-5 w-full"></span>
                      )}
                    </td>
                    <td className="py-2 px-4 border border-slate-700 text-center">
                      {isOptOut ? (
                        <span className="text-[10px] font-bold text-amber-900">(ไม่เข้าพัก)</span>
                      ) : (
                        <span className="block border-b border-dotted border-slate-700 h-5 w-full"></span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffMedicalZoneTable({ title, rooms, zoneLabel }) {
  if (rooms.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-[11px] font-semibold text-slate-600">เรียงตามเลขห้องและชั้นจริง • แถบสีชมพู / ป้าย &quot;เฝ้าระวัง&quot; = มีโรคประจำตัว แพ้ ยา หรือของที่ต้องเตรียม</span>
      </h3>

      <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
        <thead>
          <tr className="bg-slate-200 text-slate-950 font-bold text-center">
            <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">ห้อง</th>
            <th className="py-2 px-1.5 border-[1.5px] border-slate-950 w-14">ลำดับ</th>
            <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล / ติดต่อ</th>
            <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left">โรคประจำตัว / อาการแพ้ / หมู่เลือด</th>
            <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left">ยาที่ต้องการ / เวชภัณฑ์</th>
            <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left">ของที่ต้องใช้ / ดูแลพิเศษ</th>
            <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">เช็คเตรียม (Staff)</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((rm) => {
            const roomHasAlert = rm.occupants.some(o => o.needsBuddyCare || o.medicalEquipmentNeeded || o.specialItemsNeeded);
            return (
              <React.Fragment key={rm.room}>
                {[0, 1].map((b) => {
                  const p = rm.occupants[b];
                  const hasCare = Boolean(p && (p.needsBuddyCare || p.medicalEquipmentNeeded || p.specialItemsNeeded || p.isSpecialCare));
                  const rowBg = hasCare ? 'bg-rose-50/70' : 'bg-white';
                  return (
                    <tr
                      key={`${rm.room}-${b}`}
                      className={b === 1 ? 'official-room-end' : ''}
                    >
                      <td
                        className={`px-2 text-center align-middle leading-tight border-l border-r border-slate-900 ${
                          b === 0 ? 'pt-2 pb-1 border-t border-b-0' : 'pt-0.5 pb-2 border-t-0 border-b-2 border-b-slate-950'
                        } ${roomHasAlert ? 'bg-rose-100 text-rose-950' : 'bg-slate-100 text-slate-900'}`}
                      >
                        {b === 0 ? (
                          <div className="font-mono font-black text-xs leading-tight">{rm.roomLabel}</div>
                        ) : (
                          <div className="text-[9.5px] font-sans font-bold text-slate-800 leading-snug">
                            {rm.allKeysReturned
                              ? 'คืนกุญแจครบ'
                              : rm.keysIssuedCount > 0
                                ? `จ่าย ${rm.keysIssuedCount} ดอก`
                                : 'ยังไม่จ่ายกุญแจ'}
                          </div>
                        )}
                      </td>
                      <td className={`py-2.5 px-1.5 border border-slate-700 text-center font-mono text-[11px] font-bold ${rowBg}`}>
                        {b + 1}
                        <span className="block text-[9px] font-normal text-slate-600">เตียง {b + 1}</span>
                        {hasCare && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 border border-rose-800 bg-rose-100 text-rose-950 text-[9px] font-sans font-bold">
                            เฝ้าระวัง
                          </span>
                        )}
                      </td>
                      <td className={`py-2 px-2.5 border border-slate-700 ${rowBg}`}>
                        {p ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-950 whitespace-nowrap">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-700">
                              {p.nickname !== '-' && <span className="font-semibold text-slate-800">({p.nickname}) • </span>}
                              <span className="font-mono">{p.callsign} • โทร: {p.phone}</span>
                            </div>
                            <div className="text-[9.5px] font-bold flex flex-wrap gap-1">
                              <span className={p.dormOptOut ? 'text-amber-900' : 'text-emerald-900'}>
                                {p.dormOptOut ? 'ไม่ประสงค์พักหอ' : 'พักหอ'}
                              </span>
                              <span>•</span>
                              <span className="text-slate-900">กุญแจ: {p.keyStatusLabel}</span>
                            </div>
                            {p.emergencyName && p.emergencyName !== '-' && (
                              <div className="text-[9.5px] text-rose-900 font-semibold">
                                ฉุกเฉิน: {p.emergencyName} ({p.emergencyPhone})
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">(ว่าง)</span>
                        )}
                      </td>
                      <td className={`py-2 px-2.5 border border-slate-700 ${rowBg}`}>
                        {p ? (
                          p.hasMedicalHistory || p.hasFoodAllergy ? (
                            <div className="space-y-0.5 text-[11px]">
                              {p.hasMedicalHistory && (
                                <div className="font-bold text-rose-900">โรค: {formatMedicalLabel(p.medicalHistory)}</div>
                              )}
                              {p.hasFoodAllergy && (
                                <div className="font-bold text-amber-900">แพ้: {formatAllergyLabel(p.foodAllergy)}</div>
                              )}
                              <div className="text-[10px] font-mono text-slate-800">
                                หมู่เลือด: {p.bloodGroup}
                              </div>
                              <div className={`text-[10px] font-bold ${p.isHealthShared ? 'text-emerald-900' : 'text-amber-900'}`}>
                                {p.healthConsent?.fullLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[11px] text-emerald-800 font-semibold block">
                                ปกติ (ไม่มีโรค/ไม่แพ้){p.bloodGroup && p.bloodGroup !== '-' ? ` • เลือด ${p.bloodGroup}` : ''}
                              </span>
                              <span className="text-[9.5px] text-slate-700 block">
                                {p.healthConsent?.fullLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')}
                              </span>
                            </div>
                          )
                        ) : '-'}
                      </td>
                      <td className={`py-2 px-2.5 border border-slate-700 text-[11px] ${rowBg}`}>
                        {p?.medicalEquipmentNeeded ? (
                          <span className="font-bold text-emerald-950">{p.medicalEquipmentNeeded}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className={`py-2 px-2.5 border border-slate-700 text-[11px] ${rowBg}`}>
                        {p?.specialItemsNeeded ? (
                          <span className="font-semibold text-indigo-950">{p.specialItemsNeeded}</span>
                        ) : p?.isSpecialCare ? (
                          <span className="font-semibold text-indigo-950">ต้องดูแลเป็นพิเศษ</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className={`py-2 px-2 border border-slate-700 text-center text-[11px] ${rowBg}`}>
                        {p ? (
                          hasCare ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-800 text-[9.5px] font-black">
                                มีต้องเตรียม
                              </span>
                              <span className="flex items-center justify-center gap-1 font-bold text-slate-900 text-[10.5px]">
                                <span className="inline-block w-3.5 h-3.5 border-[1.5px] border-slate-900 bg-white shrink-0"></span>
                                <span>เตรียมแล้ว</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-700">
                              ไม่มีต้องเตรียม
                            </span>
                          )
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDocumentsView({
  registrations = [],
  merchandiseOrders = [],
  paymentConfig = null,
  userAccounts = [],
  triggerToast,
  onOpenEmrPerson = null,
  onOpenEmrCase = null
}) {
  const [activeDoc, setActiveDocState] = useState(getInitialDocTab);
  // เปลี่ยนเอกสาร + อัปเดต URL (?doc=...) ให้แต่ละเอกสารมีลิงก์แยก
  const setActiveDoc = (doc) => {
    setActiveDocState(doc);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      if (doc === 'attendance') url.searchParams.delete('doc');
      else url.searchParams.set('doc', doc);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
    }
  };
  const [qrLayout, setQrLayout] = useState('grid'); // 'grid' | 'table'
  const [qrMasterMap, setQrMasterMap] = useState({});
  const [emrLogs, setEmrLogs] = useState([]);
  const [isLoadingEmr, setIsLoadingEmr] = useState(false);
  const [emrSearch, setEmrSearch] = useState('');
  const [emrReloadKey, setEmrReloadKey] = useState(0);
  const [staffOnlyAlerts, setStaffOnlyAlerts] = useState(false);
  const [adminMasterSearch, setAdminMasterSearch] = useState('');
  const [adminMasterFilter, setAdminMasterFilter] = useState('all'); // 'all' | 'alerts' | 'unpaid' | 'msu' | 'kku'
  const [printOrientation, setPrintOrientation] = useState('auto'); // 'auto' | 'portrait' | 'landscape'
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [shirtQrMap, setShirtQrMap] = useState({});

  const resolvedPrintOrientation = useMemo(() => {
    if (printOrientation === 'portrait' || printOrientation === 'landscape') return printOrientation;
    return ['shirts', 'rooms-staff', 'admin-master', 'medical-supplies', 'emr-records'].includes(activeDoc) ? 'landscape' : 'portrait';
  }, [printOrientation, activeDoc]);

  // 1. Prepare Attendance Data (36 Persons)
  const attendanceData = useMemo(() => {
    const list = (registrations || []).map(reg => {
      const nameData = resolvePersonFullNameWithTitle(reg);
      const uniInfo = resolveUniversityInfo(reg);
      const gender = resolveGender(reg);
      const extra = parseSpecialNotesExtra(reg);
      const attInfo = getAttendanceConfirmationInfo(reg);
      const isNoAccount = isRegistrationWithoutAccount(reg, userAccounts);

      const nickname = extra.nickname || reg.nickname || '-';
      const rawCallsign = extra.callsign || reg.callsign || '-';
      const callsign = normalizeCallsignSpacing(rawCallsign);
      const isStaff = Boolean(extra.is_staff || reg.is_staff || rawCallsign.includes('STAFF'));
      const isCommittee = Boolean(extra.staff_role_type === 'committee' || isStaff);

      let role = 'ผู้เข้าร่วมการฝึกอบรม (Trainee)';
      if (extra.staff_role_type === 'committee') role = 'คณะกรรมการดำเนินงาน';
      else if (isStaff) role = 'Staff คณะทำงาน';

      const isMsu = Boolean(uniInfo?.isMsu);
      const isDormOptOut = Boolean(extra.dorm_opt_out || reg.dorm_opt_out);
      const parsedRoom = parseRoomInfo(reg.room_assigned);
      const matchedRoom = parsedRoom.roomKey;
      const roomNote = isDormOptOut
        ? 'แจ้งไม่พักหอ'
        : (isMsu ? 'มมส (ไป-กลับเอง)' : (matchedRoom ? `พักหอกุดรัง (${parsedRoom.floorLabel} ${parsedRoom.roomLabel})` : 'พักหอกุดรัง'));
      const rsvpShort = attInfo.isDeclined ? ' [ไม่เข้าร่วม]' : (attInfo.isConfirmed ? ' [ยืนยันมา]' : '');
      const noAccShort = isNoAccount ? ' [Admin เพิ่ม • ไม่มีบัญชี]' : '';
      const notes = `${roomNote}${rsvpShort}${noAccShort}`;

      const baseItem = {
        id: reg.id || reg.user_id,
        name: nameData.fullName,
        nickname,
        callsign,
        institution: uniInfo.shortTag,
        fullUni: uniInfo.fullName,
        isMsu,
        isCommittee,
        isStaff,
        isNoAccount,
        role,
        gender,
        phone: reg.phone || extra.phone || '-',
        groupAssigned: reg.group_assigned || '',
        notes
      };
      return {
        ...baseItem,
        rosterGroup: resolveRosterRoleGroup(baseItem).label
      };
    });

    // Split by gender (ชาย -> หญิง) and sort by Staff -> RCP -> TSI -> นิสิตอาสา
    return list.sort(compareOfficialRosterPerson);
  }, [registrations, userAccounts]);

  // 2. Prepare ID Card Pickup Roster (36 Persons — PDPA-Safe)
  const idCardData = useMemo(() => {
    const byId = new Map((registrations || []).map(r => [r.id || r.user_id, r]));
    return attendanceData.map(item => {
      const reg = byId.get(item.id) || {};
      const extra = parseSpecialNotesExtra(reg);
      const isReceived = Boolean(reg.id_card_received || extra.id_card_received);
      const hasPhoto = isRealParticipantPhoto(reg.id_card_photo || extra.id_card_photo || reg.id_card_url);
      let idCardStatus = 'รอรับบัตร ID';
      if (isReceived) idCardStatus = '✓ รับบัตรแล้ว';
      else if (hasPhoto) idCardStatus = 'พร้อมจ่าย (มีรูปบัตร)';
      else idCardStatus = item.isNoAccount ? 'ไม่มีรูปบัตร (Admin เพิ่ม • ไม่มีบัญชี)' : 'ไม่มีรูปบัตร (ยังไม่อัปโหลด)';

      return {
        ...item,
        hasPhoto,
        isReceived,
        idCardStatus,
        idCardReceivedAt: isReceived && (reg.id_card_received_date || extra.id_card_received_date)
          ? String(reg.id_card_received_date || extra.id_card_received_date).slice(0, 10)
          : '13 ก.พ. 70'
      };
    });
  }, [attendanceData, registrations]);

  // 3. Prepare Production Shirts Data (32 Production Shirts)
  const shirtData = useMemo(() => {
    const rows = [];

    // Process from registrations (Trainees and Staff with shirts)
    (registrations || []).forEach(reg => {
      const extra = parseSpecialNotesExtra(reg);

      // Skip staff who only get ID card (0 THB, no shirt)
      if (extra.staff_id_card_only || reg.staff_id_card_only) return;

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
      const isShirtReceived = Boolean(
        reg.shirt_received || reg.shirt_pickup_status === 'received' ||
        extra.shirt_received || extra.shirt_pickup_status === 'received'
      );

      const rawQrId = String(reg.id || reg.user_id || '').trim();
      const qrPayload = `JRE27-SHIRT-${rawQrId.toUpperCase()}`;

      rows.push({
        id: rawQrId,
        qrPayload,
        name: nameData.fullName,
        nickname: extra.nickname || reg.nickname || '-',
        callsign,
        uni: uniInfo.shortTag,
        chest,
        size: normSize,
        qty: 1,
        payment,
        isShirtReceived,
        pickupStatusLabel: isShirtReceived ? 'รับเสื้อแล้ว' : 'รอรับเสื้อ',
        isKku
      });
    });

    // Also include Newton (นายจินณวัตร ทิพย์รักษ์ RCP 16-02) and store extra orders
    (merchandiseOrders || []).forEach(ord => {
      const isNewton = ord.order_number === 'JRE27-NEWTON-SHIRT-32' || (ord.customer_name || '').includes('จินณวัตร');

      (ord.items || []).forEach((it, idx) => {
        const chest = ord.institution?.includes('ขอนแก่น') ? 'TSIKKU' : 'RCPMSU';
        const isShirtReceived = Boolean(ord.shirt_received || ord.shirt_pickup_status === 'received');
        const qrPayload = String(ord.order_number || ord.id || idx).trim().toUpperCase();
        rows.push({
          id: `${ord.order_number}-${idx}`,
          qrPayload,
          name: ord.customer_name || 'ลูกค้าสั่งเพิ่ม',
          nickname: ord.nickname || (isNewton ? 'นิวตั้น' : '-'),
          callsign: ord.callsign || (isNewton ? 'RCP 16-02' : '(กองกลาง)'),
          uni: ord.affiliation || (chest === 'TSIKKU' ? 'มข' : 'มมส'),
          chest,
          size: normalizeShirtSize(it.size || 'XL'),
          qty: 1,
          payment: 'ชำระแล้ว (280 บ.)',
          isShirtReceived,
          pickupStatusLabel: isShirtReceived ? 'รับเสื้อแล้ว' : 'รอรับเสื้อ',
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

  // Generate QR codes per shirt recipient row so Admin can scan directly off the sheet/screen
  useEffect(() => {
    let cancelled = false;
    const generateShirtQrs = async () => {
      if (!shirtData || shirtData.length === 0) {
        if (!cancelled) setShirtQrMap({});
        return;
      }
      const nextMap = {};
      for (const s of shirtData) {
        if (!s.qrPayload) continue;
        try {
          nextMap[s.id] = await QRCode.toDataURL(s.qrPayload, {
            width: 120,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#0f172a', light: '#ffffff' }
          });
        } catch (err) {
          console.error('Shirt QR generation failed:', s.id, err);
        }
      }
      if (!cancelled) setShirtQrMap(nextMap);
    };
    generateShirtQrs();
    return () => {
      cancelled = true;
    };
  }, [shirtData]);

  const shirtStatsSummary = useMemo(() => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
    const formatMap = (countsMap) => {
      const entries = Object.entries(countsMap);
      entries.sort((a, b) => {
        const idxA = sizeOrder.indexOf(a[0]);
        const idxB = sizeOrder.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a[0].localeCompare(b[0]);
      });
      return entries.map(([sz, qty]) => `${sz}:${qty}`).join(', ');
    };
    const kkuCounts = {};
    const msuCounts = {};
    let kkuTotal = 0;
    let msuTotal = 0;
    shirtData.forEach(item => {
      const sz = item.size || 'L';
      const qty = Number(item.qty) || 1;
      if (item.chest === 'TSIKKU') {
        kkuCounts[sz] = (kkuCounts[sz] || 0) + qty;
        kkuTotal += qty;
      } else {
        msuCounts[sz] = (msuCounts[sz] || 0) + qty;
        msuTotal += qty;
      }
    });
    return {
      kkuTotal,
      msuTotal,
      kkuBreakdown: formatMap(kkuCounts) || '-',
      msuBreakdown: formatMap(msuCounts) || '-'
    };
  }, [shirtData]);

  // 4. Prepare Dormitory Rooms Data (Floor 3: 307-333, sorted #1 care, #2 healthy)
  const roomData = useMemo(() => {
    const parsed = buildDormitoryRoomData(registrations);
    const msuNeedsCare = parsed.localMsu.filter(
      p => p.hasMedicalHistory || p.hasFoodAllergy || p.medicalEquipmentNeeded || p.specialItemsNeeded || p.isSpecialCare
    );
    return {
      ...parsed,
      msuList: parsed.localMsu,
      msuNeedsCare
    };
  }, [registrations]);

  // 5. Prepare Comprehensive Admin Master Data (All 36 Persons with complete fields)
  const adminMasterData = useMemo(() => {
    const roomPersonById = new Map();
    [...(roomData.rooms || []).flatMap(rm => rm.occupants || []), ...(roomData.optedOutPeople || []), ...(roomData.msuList || [])].forEach(p => {
      if (p?.id) roomPersonById.set(p.id, p);
    });

    const list = (registrations || []).map(reg => {
      const id = reg.id || reg.user_id;
      const nameData = resolvePersonFullNameWithTitle(reg);
      const uniInfo = resolveUniversityInfo(reg);
      const gender = resolveGender(reg);
      const extra = parseSpecialNotesExtra(reg);
      const memberTypeInfo = resolveApplicantMemberType(reg);
      const attInfo = getAttendanceConfirmationInfo(reg);
      const payRes = getRegistrationPaymentResolution(reg, paymentConfig);
      const isNoAccount = isRegistrationWithoutAccount(reg, userAccounts);
      const consent = getHealthConsentInfo(reg, userAccounts);
      const roomPerson = roomPersonById.get(id);

      const nickname = extra.nickname || reg.nickname || '-';
      const rawCallsign = extra.callsign || reg.callsign || '-';
      const callsign = normalizeCallsignSpacing(rawCallsign);
      const isStaff = Boolean(extra.is_staff || reg.is_staff || rawCallsign.includes('STAFF'));
      const isCommittee = Boolean(extra.staff_role_type === 'committee' || isStaff);

      const resolvedDuty = resolveCommitteeDutyNote(reg);
      const dutyNote = resolvedDuty || extra.committee_duty_note || extra.committee_duty || (
        typeof reg.special_notes === 'string' && isCommitteeDutyNote(reg.special_notes)
          ? reg.special_notes.trim()
          : ''
      );
      let role = 'ผู้เข้าร่วมอบรม (Trainee)';
      if (extra.staff_role_type === 'committee') role = 'คณะกรรมการดำเนินงาน';
      else if (isStaff) role = 'Staff คณะทำงาน';
      const roleWithDuty = dutyNote ? `${role} • ${dutyNote}` : role;

      // Dorm & key status
      const parsedRoom = parseRoomInfo(reg.room_assigned);
      const matchedRoom = parsedRoom.roomKey || roomPerson?.roomNumber || '';
      const isDormOptOut = Boolean(extra.dorm_opt_out || reg.dorm_opt_out);
      const dormAndKeySummary = isDormOptOut
        ? 'แจ้งไม่พักหอพักมหาลัย'
        : uniInfo.isMsu
          ? 'มมส (ไป-กลับเอง)'
          : `${matchedRoom ? `${parsedRoom.floorLabel || roomPerson?.roomFloorLabel || 'ชั้น 3'} ห้อง ${matchedRoom}` : 'รอจัดห้อง'} • ${roomPerson?.keyStatusLabel || 'ยังไม่ได้จ่ายกุญแจ'}`;

      // Shirt & ID Card
      const isCardOnly = Boolean(extra.staff_id_card_only || reg.staff_id_card_only);
      const shirtSize = normalizeShirtSize(extra.shirt_size || reg.shirt_size || '-');
      const isShirtReceived = Boolean(reg.shirt_received || reg.shirt_pickup_status === 'received' || extra.shirt_received);
      const shirtSummary = isCardOnly || shirtSize === '-' || shirtSize === 'ไม่มี'
        ? 'ไม่รับเสื้อ (บัตร ID)'
        : `${shirtSize} • ${isShirtReceived ? '✓ รับแล้ว' : 'รอรับ'}`;

      const isIdCardReceived = Boolean(reg.id_card_received || extra.id_card_received);
      const hasIdPhoto = isRealParticipantPhoto(reg.id_card_photo || extra.id_card_photo || reg.id_card_url);
      const idCardSummary = isIdCardReceived
        ? '✓ รับบัตรแล้ว'
        : hasIdPhoto
          ? 'มีรูปบัตร • รอรับ'
          : 'ไม่มีรูปบัตร';

      // Payment
      let paymentStatusLabel = 'รอชำระเงิน';
      if (payRes.isRound2CancelledAbsent) paymentStatusLabel = 'ยกเลิกงวด 2 (ไม่มา)';
      else if (payRes.isDeferredPostProject && !payRes.isFullyPaid) paymentStatusLabel = 'ค้างจ่ายหลังงาน';
      else if (payRes.statusBucket === 'paid') paymentStatusLabel = 'ชำระครบแล้ว (100%)';
      else if (payRes.statusBucket === 'pending_review') paymentStatusLabel = 'รอตรวจสลิป';
      else if (payRes.statusBucket === 'partial_paid') paymentStatusLabel = 'ชำระงวด 1 (ค้างงวด 2)';
      const planLabel = payRes.isInstallment ? '2 งวด' : (isStaff ? (isCardOnly ? 'Staff 0 บ.' : 'Staff 280 บ.') : '1 งวด');
      const paymentAmountsLabel = `กำหนด ฿${payRes.effectiveTotalFee} | จ่าย ฿${payRes.collectedAmount} | ค้าง ฿${payRes.activeOutstandingAmount}`;
      const paymentNotesParts = [];
      if (payRes.isDeferredPostProject) paymentNotesParts.push(`จ่ายหลังจบโครงการ (฿${payRes.deferredPostProjectAmount})`);
      if (payRes.isRound2CancelledAbsent) paymentNotesParts.push(`ตัดจบ/ยกเลิกงวด 2 (฿${payRes.waivedRound2Amount})`);
      if (payRes.isVerifiedTransfer && payRes.isExternal) paymentNotesParts.push('มข จ่ายครบ 1 รอบ');
      const paymentNotesLabel = paymentNotesParts.length > 0 ? paymentNotesParts.join(' • ') : '-';

      // Health & Emergency
      const med = getApplicantMedical(reg);
      const alg = getApplicantAllergy(reg);
      const hasMed = hasMedicalCondition(reg);
      const hasAlg = hasFoodOrDrugAllergy(reg);
      const medParts = [];
      if (hasMed && med) medParts.push(formatMedicalLabel(med));
      if (hasAlg && alg) medParts.push(formatAllergyLabel(alg));
      const medicalSummary = medParts.length > 0 ? medParts.join(' | ') : 'ปกติ';
      const medEquip = getMedicalEquipmentNeeded(reg);
      const specialItems = getSpecialItemsNeeded(reg, extra);
      const suppliesParts = [];
      if (medEquip) suppliesParts.push(`ยา: ${medEquip}`);
      if (specialItems) suppliesParts.push(`ของใช้: ${specialItems}`);
      const suppliesSummary = suppliesParts.length > 0 ? suppliesParts.join(' | ') : (hasSpecialCareCondition(reg) ? 'ต้องดูแลเป็นพิเศษ' : '-');
      const hasHealthAlert = Boolean(hasMed || hasAlg || medEquip || specialItems || hasSpecialCareCondition(reg));

      const rawEName = String(reg.emergency_name || extra.emergency_name || '').replace(/^-\s*/, '').trim();
      const rawERel = String(reg.emergency_relation || extra.emergency_relation || '').trim();
      const rawEPhone = String(reg.emergency_phone || extra.emergency_phone || '').trim();
      const validEName = rawEName && rawEName !== '-' ? rawEName : '';
      const validERel = rawERel && rawERel !== '-' ? rawERel : '';
      const validEPhone = rawEPhone && rawEPhone !== '-' ? rawEPhone : '';
      const emergencyContact = validEName
        ? `${validEName}${validERel && !validEName.includes(validERel) ? ` (${validERel})` : ''}${validEPhone ? ` (${validEPhone})` : ''}`
        : (validEPhone ? `${validERel || 'ติดต่อฉุกเฉิน'} (${validEPhone})` : '-');

      const ageLabel = reg.age_years ? `${reg.age_years} ปี` : '-';
      const rsvpStatus = attInfo.statusLabel || '⏳ รอยืนยันเข้าร่วม';

      return {
        id,
        name: nameData.fullName,
        fullNameWithEn: nameData.englishFullName && nameData.englishFullName !== '-' ? `${nameData.fullName}\n(${nameData.englishFullName})` : nameData.fullName,
        nickname,
        callsign,
        institution: uniInfo.shortTag,
        isMsu: uniInfo.isMsu,
        isCommittee,
        isStaff,
        isNoAccount,
        memberTypeLabel: memberTypeInfo?.shortLabel || (memberTypeInfo?.isClubMember ? 'สมาชิกชมรม' : 'อาสา'),
        role,
        roleWithDuty,
        gender,
        ageLabel,
        bloodGroup: reg.blood_group || '-',
        phone: reg.phone || extra.phone || '-',
        email: reg.user_email || '-',
        rsvpSummary: `${rsvpStatus}${attInfo.reason ? ` (${attInfo.reason})` : ''}`,
        groupAssigned: reg.group_assigned || 'ยังไม่จัดกลุ่ม',
        dormAndKeySummary,
        shirtSummary,
        idCardSummary,
        paymentPlanLabel: `${planLabel} • ${paymentStatusLabel}`,
        paymentStatusLabel: `${planLabel}: ${paymentStatusLabel}`,
        paymentAmountsLabel,
        paymentNotesLabel,
        isUnpaidOrPartial: payRes.activeOutstandingAmount > 0 || payRes.statusBucket === 'pending_review',
        medicalSummary,
        suppliesSummary,
        hasHealthAlert,
        healthConsentSummary: consent.fullLabel,
        emergencyContact
      };
    });

    return list.sort(compareOfficialRosterPerson);
  }, [registrations, paymentConfig, roomData, userAccounts]);

  const displayedAdminMasterData = useMemo(() => {
    const q = adminMasterSearch.trim().toLowerCase();
    return adminMasterData.filter(item => {
      if (adminMasterFilter === 'alerts' && !item.hasHealthAlert) return false;
      if (adminMasterFilter === 'unpaid' && !item.isUnpaidOrPartial) return false;
      if (adminMasterFilter === 'msu' && !item.isMsu) return false;
      if (adminMasterFilter === 'kku' && item.isMsu) return false;
      if (!q) return true;
      return [
        item.name,
        item.nickname,
        item.callsign,
        item.institution,
        item.phone,
        item.medicalSummary,
        item.suppliesSummary,
        item.paymentStatusLabel,
        item.dormAndKeySummary
      ].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [adminMasterData, adminMasterSearch, adminMasterFilter]);

  const displayedStaffMaleRooms = useMemo(() => {
    if (!staffOnlyAlerts) return roomData.maleRooms;
    return roomData.maleRooms.filter(r => r.occupants.some(o => o.needsBuddyCare || o.medicalEquipmentNeeded || o.specialItemsNeeded));
  }, [roomData.maleRooms, staffOnlyAlerts]);

  const displayedStaffFemaleRooms = useMemo(() => {
    if (!staffOnlyAlerts) return roomData.femaleRooms;
    return roomData.femaleRooms.filter(r => r.occupants.some(o => o.needsBuddyCare || o.medicalEquipmentNeeded || o.specialItemsNeeded));
  }, [roomData.femaleRooms, staffOnlyAlerts]);

  // 7. Prepare All-Participants QR Master Data (Everyone in 1 sheet, PDPA-Safe)
  const qrMasterData = useMemo(() => {
    const byId = new Map((registrations || []).map(r => [r.id || r.user_id, r]));
    return attendanceData.map(item => {
      const reg = byId.get(item.id) || {};
      const parsedRoom = parseRoomInfo(reg.room_assigned);
      const extra = parseSpecialNotesExtra(reg);
      const isDormOptOut = Boolean(extra.dorm_opt_out || reg.dorm_opt_out);
      const roomNote = isDormOptOut
        ? 'ไม่พักหอ'
        : item.isMsu
          ? 'มมส (ไป-กลับ)'
          : (parsedRoom.roomKey ? `ห้อง ${parsedRoom.roomKey}` : 'รอจัดห้อง');
      return {
        ...item,
        cardCode: getIdCardCode(reg),
        qrPayload: getIdCardQrPayload(reg),
        roomNote
      };
    });
  }, [attendanceData, registrations]);

  useEffect(() => {
    let cancelled = false;
    const genAll = async () => {
      const next = {};
      for (const r of qrMasterData) {
        if (!r.qrPayload) continue;
        try {
          next[r.id] = await QRCode.toDataURL(r.qrPayload, {
            width: 140,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#0f172a', light: '#ffffff' }
          });
        } catch (err) {
          console.error('QR Master generation error:', r.id, err);
        }
      }
      if (!cancelled) setQrMasterMap(next);
    };
    genAll();
    return () => {
      cancelled = true;
    };
  }, [qrMasterData]);

  // 8. Prepare Medicine & Medical Supplies Preparation Data
  const medicalSuppliesPrep = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const regById = new Map((registrations || []).map(r => [r.id || r.user_id, r]));
    const summaryMap = new Map();
    const prepRows = [];

    const addSummaryItem = (rawItem, requesterLabel) => {
      const label = String(rawItem || '').replace(/^\+\s*/, '').trim();
      if (!label || label === '-' || label === 'ไม่มี') return;
      if (!summaryMap.has(label)) {
        summaryMap.set(label, { item: label, count: 0, requesters: [] });
      }
      const entry = summaryMap.get(label);
      if (!entry.requesters.includes(requesterLabel)) {
        entry.requesters.push(requesterLabel);
        entry.count = entry.requesters.length;
      }
    };

    adminMasterData.forEach(item => {
      const reg = regById.get(item.id) || {};
      const extra = parseSpecialNotesExtra(reg);
      const medEquip = getMedicalEquipmentNeeded(reg);
      const specialItems = getSpecialItemsNeeded(reg, extra);
      const hasMed = hasMedicalCondition(reg);
      const hasAlg = hasFoodOrDrugAllergy(reg);
      const isSpecialCare = hasSpecialCareCondition(reg);
      const hasCare = Boolean(medEquip || specialItems || hasMed || hasAlg || isSpecialCare);
      if (!hasCare) return;

      const uid = reg.user_id || reg.id || item.id;
      const parsedRoom = parseRoomInfo(reg.room_assigned);
      const isDormOptOut = Boolean(extra.dorm_opt_out || reg.dorm_opt_out);
      const roomLabel = isDormOptOut
        ? 'ไม่พักหอ'
        : item.isMsu
          ? 'ไป-กลับ มมส'
          : (parsedRoom.roomKey ? `ห้อง ${parsedRoom.roomKey}` : 'รอจัดห้อง');

      const requesterTag = `${item.nickname !== '-' ? item.nickname : item.name} (${item.callsign})`;
      if (medEquip) {
        medEquip.split(/[,;\n/|]+/).forEach(part => addSummaryItem(part, requesterTag));
      }
      if (specialItems) {
        specialItems.split(/[,;\n/|]+/).forEach(part => addSummaryItem(part, requesterTag));
      }

      prepRows.push({
        id: item.id,
        uid,
        name: item.name,
        nickname: item.nickname,
        callsign: item.callsign,
        institution: item.institution,
        roomLabel,
        phone: item.phone,
        emergencyContact: item.emergencyContact,
        bloodGroup: item.bloodGroup,
        medicalSummary: item.medicalSummary,
        medEquipment: medEquip,
        specialItems,
        isSpecialCare,
        hasCare,
        consentLabel: item.healthConsentSummary,
        requestUrl: buildUserPageUrl(uid, 'medical-support', origin)
      });
    });

    prepRows.sort((a, b) => {
      const aHasReq = a.medEquipment || a.specialItems ? 1 : 0;
      const bHasReq = b.medEquipment || b.specialItems ? 1 : 0;
      if (aHasReq !== bHasReq) return bHasReq - aHasReq;
      return a.name.localeCompare(b.name, 'th');
    });

    const summaryItems = Array.from(summaryMap.values()).sort((a, b) => b.count - a.count || a.item.localeCompare(b.item, 'th'));
    return { prepRows, summaryItems };
  }, [adminMasterData, registrations]);

  // 9. Fetch & Subscribe Field EMR Logs for Per-Person & Per-Case Document
  useEffect(() => {
    let cancelled = false;
    const loadEmr = async () => {
      setIsLoadingEmr(true);
      try {
        const logs = await DataService.getMedicalDispenseLogs();
        if (!cancelled) setEmrLogs(Array.isArray(logs) ? logs : []);
      } catch (err) {
        console.error('Failed to load EMR logs in documents view:', err);
      } finally {
        if (!cancelled) setIsLoadingEmr(false);
      }
    };
    loadEmr();
    const unsubscribe = subscribeToRealtimeChanges((payload) => {
      if (payload?.type === 'medical_dispense_logs') {
        loadEmr();
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [emrReloadKey]);

  const emrDocData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const q = emrSearch.trim().toLowerCase();

    const formatTime = (iso) => {
      if (!iso) return '-';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
    };

    const allCaseRows = (emrLogs || [])
      .map((log, idx) => {
        const matchedReg = findPersonForEmrLog(log, registrations);
        const summary = matchedReg ? formatPersonSummary(matchedReg) : null;
        const personId = summary?.id || log.recipient_id || log.recipient_user_id || '';
        const uid = summary?.userId || log.recipient_user_id || personId;
        const caseId = log.id || `CASE-${idx + 1}`;
        return {
          caseId,
          personId,
          uid,
          dispensedAtRaw: log.dispensed_at || log.created_at || '',
          timeLabel: formatTime(log.dispensed_at || log.created_at),
          personName: summary?.name || log.recipient_name || 'ไม่ระบุชื่อ',
          nickname: summary?.nickname || log.recipient_nickname || '-',
          callsign: summary?.callsign || normalizeCallsignSpacing(log.recipient_callsign || '-'),
          institution: summary?.institution || log.recipient_institution || '-',
          group: summary?.group || log.recipient_group || '-',
          room: summary?.room || log.recipient_room || '-',
          blood: summary?.blood || log.recipient_blood || '-',
          chronic: summary?.medical || log.recipient_chronic_diseases || 'ไม่มี',
          allergy: summary?.allergy || log.recipient_known_allergies || 'ไม่มี',
          vitalSigns: log.vital_signs || '-',
          symptoms: log.symptoms || '-',
          incidentDetail: log.incident_detail || '-',
          firstAid: log.first_aid_action || '-',
          medicines: log.medicines_dispensed || '-',
          dosage: log.dosage_instruction || '-',
          recorder: log.recorder_name || '-',
          dispenser: log.dispenser_name || '-',
          notes: log.medical_notes || '-',
          personUrl: personId ? buildEmrPersonUrl(personId, origin) : '',
          caseUrl: buildEmrCaseUrl(caseId, personId, origin),
          myCaseUrl: uid ? buildMyEmrCaseUrl(uid, caseId, origin) : '',
          myEmrUrl: uid ? buildUserPageUrl(uid, 'my-emr', origin) : ''
        };
      })
      .sort((a, b) => new Date(b.dispensedAtRaw || 0).getTime() - new Date(a.dispensedAtRaw || 0).getTime());

    const casesByPerson = new Map();
    allCaseRows.forEach(c => {
      const key = c.personId || c.personName;
      if (!casesByPerson.has(key)) casesByPerson.set(key, []);
      casesByPerson.get(key).push(c);
    });

    const allPersonRows = (registrations || []).map(reg => {
      const s = formatPersonSummary(reg);
      const id = s.id || reg.id || reg.user_id;
      const uid = s.userId || reg.user_id || id;
      const personCases = allCaseRows.filter(c => {
        if (c.personId && (c.personId === id || c.personId === uid)) return true;
        return matchEmrLogToPerson({ recipient_name: c.personName, recipient_id: c.personId, recipient_user_id: c.uid }, reg);
      });
      return {
        ...s,
        id,
        uid,
        caseCount: personCases.length,
        lastCase: personCases[0] || null,
        personUrl: buildEmrPersonUrl(id, origin),
        myEmrUrl: buildUserPageUrl(uid, 'my-emr', origin)
      };
    }).sort((a, b) => {
      if (b.caseCount !== a.caseCount) return b.caseCount - a.caseCount;
      return a.name.localeCompare(b.name, 'th');
    });

    const filterRow = (fields) => {
      if (!q) return true;
      return fields.some(v => String(v || '').toLowerCase().includes(q));
    };

    const personRows = allPersonRows.filter(p => filterRow([p.name, p.nickname, p.callsign, p.institution, p.medical, p.allergy, p.requestedEquipment, p.lastCase?.medicines, p.lastCase?.symptoms]));
    const caseRows = allCaseRows.filter(c => filterRow([c.caseId, c.personName, c.nickname, c.callsign, c.symptoms, c.incidentDetail, c.firstAid, c.medicines, c.recorder, c.dispenser, c.notes]));

    return { personRows, caseRows, allPersonRows, allCaseRows };
  }, [emrLogs, registrations, emrSearch]);

  // Handler: Print Current Document Cleanly
  const handlePrintDocument = () => {
    const styleId = 'jre-dynamic-print-page';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    const pageStyle = document.createElement('style');
    pageStyle.id = styleId;
    pageStyle.textContent = `@media print { @page { size: A4 ${resolvedPrintOrientation}; margin: 10mm 8mm !important; } }`;
    document.head.appendChild(pageStyle);

    document.body.classList.add('document-print-active');
    const cleanup = () => {
      document.body.classList.remove('document-print-active');
      const el = document.getElementById(styleId);
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 45000);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handler: Export PNG
  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const nameMap = {
        attendance: '1_ใบเซ็นชื่อ_การเข้าร่วมอบรม',
        'id-cards': '2_ใบเซ็นชื่อ_รับบัตรประจำตัว_IDCard',
        shirts: '3_ใบเซ็นชื่อ_รับมอบเสื้อ32ตัว',
        rooms: '4_ใบเซ็นชื่อ_เข้าห้องพักกุดรัง_ปิดข้อมูลสุขภาพ',
        'qr-master': '5_เอกสารรวม_QRCode_ทุกคน_ใบเดียว',
        'rooms-staff': '6_ใบตรวจห้อง_โรคประจำตัว_ยา_ของใช้_Staff',
        'admin-master': '7_ทะเบียนข้อมูลละเอียดครบทุกมิติ_Admin',
        'medical-supplies': '8_เอกสารขอยา_จัดเตรียมยา_เวชภัณฑ์',
        'emr-records': '9_เอกสารเวชระเบียน_รายคน_รายเคส'
      };
      const filename = `${nameMap[activeDoc] || 'document'}_JRE2027.png`;
      await exportElementToPng('printable-document-sheet', filename);
      if (triggerToast) triggerToast('🖼️ บันทึกเป็นรูปภาพ PNG ความละเอียดสูงเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('❌ เกิดข้อผิดพลาดในการบันทึกภาพ: ' + err.message, 'error');
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
      } else if (activeDoc === 'id-cards') {
        await exportIdCardRosterToExcel(idCardData);
      } else if (activeDoc === 'shirts') {
        await exportShirtRosterToExcel(shirtData);
      } else if (activeDoc === 'rooms') {
        const orderedRooms = [...(roomData.maleRooms || []), ...(roomData.femaleRooms || [])];
        await exportDormitoryRosterToExcel(orderedRooms.length ? orderedRooms : roomData.rooms, roomData.msuList);
      } else if (activeDoc === 'qr-master') {
        await exportAllQrMasterToExcel(qrMasterData);
      } else if (activeDoc === 'rooms-staff') {
        const orderedRooms = [...(roomData.maleRooms || []), ...(roomData.femaleRooms || [])];
        await exportDormitoryStaffMedicalExcel(orderedRooms.length ? orderedRooms : roomData.rooms, roomData.msuList);
      } else if (activeDoc === 'medical-supplies') {
        await exportMedicalSuppliesPrepToExcel(medicalSuppliesPrep.prepRows, medicalSuppliesPrep.summaryItems);
      } else if (activeDoc === 'emr-records') {
        await exportEmrRecordsToExcel(emrDocData.caseRows, emrDocData.personRows);
      } else {
        await exportAdminMasterRosterExcel(displayedAdminMasterData);
      }
      if (triggerToast) triggerToast('📊 บันทึกไฟล์ Excel (.xlsx) เรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('❌ เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ' + err.message, 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handler: Export Master 9-in-1 Excel
  const handleExportMasterExcel = async () => {
    setIsExportingExcel(true);
    try {
      const orderedRooms = [...(roomData.maleRooms || []), ...(roomData.femaleRooms || [])];
      await exportAllRostersToMasterExcel({
        attendanceRecords: attendanceData,
        idCardRecords: idCardData,
        shirtRecords: shirtData,
        roomList: orderedRooms.length ? orderedRooms : roomData.rooms,
        msuList: roomData.msuList,
        adminMasterRecords: adminMasterData,
        qrMasterRecords: qrMasterData,
        medicalPrepRows: medicalSuppliesPrep.prepRows,
        medicalSupplySummary: medicalSuppliesPrep.summaryItems,
        emrCaseRecords: emrDocData.allCaseRows,
        emrPersonRecords: emrDocData.allPersonRows
      });
      if (triggerToast) triggerToast('⚡ ดาวน์โหลดชุดเอกสารครบทั้ง 9 ใบ (Master 9-in-1 Excel) สำเร็จ');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('❌ เกิดข้อผิดพลาดในการสร้าง Master Excel: ' + err.message, 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    const csvCell = (val) => `"${String(val ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`;
    const makeRow = (cols) => cols.map(csvCell).join(',') + '\n';
    let csv = '';
    let filename = '';

    if (activeDoc === 'attendance') {
      csv = makeRow(['ลำดับ', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'มหาวิทยาลัย/สังกัด', 'บทบาท', 'เบอร์โทรศัพท์', 'ลายมือชื่อ', 'หมายเหตุ']);
      attendanceData.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.name, r.nickname, r.callsign, r.institution, r.role, r.phone, '', r.notes]);
      });
      filename = '1_ใบเซ็นชื่อ_เข้าร่วมอบรม_JRE2027.csv';
    } else if (activeDoc === 'id-cards') {
      csv = makeRow(['ลำดับ', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'สังกัด', 'บทบาท', 'สถานะบัตรในระบบ', 'ลายมือชื่อผู้รับบัตร', 'วันที่รับ']);
      idCardData.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.name, r.nickname, r.callsign, r.institution, r.role, r.idCardStatus, '', r.idCardReceivedAt]);
      });
      filename = '2_ใบเซ็นชื่อ_รับบัตรประจำตัว_IDCard_JRE2027.csv';
    } else if (activeDoc === 'shirts') {
      csv = makeRow(['ลำดับ', 'ชื่อ - นามสกุล ผู้รับมอบ', 'นามเรียกขาน', 'สังกัด', 'ข้อความอกขวา', 'ขนาดไซส์', 'จำนวน', 'สถานะค่าเสื้อ/รับเสื้อ', 'รหัส QR สแกนรับเสื้อ', 'ลายมือชื่อผู้รับมอบ', 'วันที่รับมอบ']);
      shirtData.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.name, r.callsign, r.uni, r.chest, r.size, 1, `${r.payment} • ${r.pickupStatusLabel}`, r.qrPayload || '-', '', '13 ก.พ. 70']);
      });
      filename = '3_ใบเซ็นชื่อ_รับมอบเสื้อฝึก32ตัว_JRE2027.csv';
    } else if (activeDoc === 'rooms') {
      csv = makeRow(['เลขห้อง', 'โซน/เพศ', 'เตียง', 'ชื่อ - นามสกุล ผู้เข้าพัก', 'ชื่อเล่น', 'นามเรียกขาน', 'เบอร์โทร', 'สถานะเข้าพัก', 'สถานะกุญแจห้อง', 'ลายมือชื่อรับกุญแจ', 'ลายมือชื่อคืนกุญแจ']);
      const orderedRooms = [...(roomData.maleRooms || []), ...(roomData.femaleRooms || [])];
      (orderedRooms.length ? orderedRooms : roomData.rooms).forEach(rm => {
        const isMale = rm.gender === 'ชาย';
        for (let b = 0; b < 2; b++) {
          const p = rm.occupants[b];
          csv += makeRow([rm.room, isMale ? 'ชาย' : 'หญิง', b + 1, p ? p.name : '(ว่าง)', p ? p.nickname : '-', p ? p.callsign : '-', p ? p.phone : '-', p ? p.stayStatusLabel : '-', p ? p.keyStatusLabel : '-', '', '']);
        }
      });
      filename = '4_ใบเซ็นชื่อ_เข้าห้องพัก_ปิดข้อมูลสุขภาพ_JRE2027.csv';
    } else if (activeDoc === 'qr-master') {
      csv = makeRow(['ลำดับ', 'รหัสบัตร ID', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'สังกัด', 'บทบาท', 'กลุ่มฝึก', 'ห้องพัก', 'QR Payload URL']);
      qrMasterData.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.cardCode, r.name, r.nickname, r.callsign, r.institution, r.role, r.groupAssigned || 'รอจัดกลุ่ม', r.roomNote, r.qrPayload]);
      });
      filename = '5_เอกสารรวม_QRCode_ทุกคน_ใบเดียว_JRE2027.csv';
    } else if (activeDoc === 'rooms-staff') {
      csv = makeRow(['เลขห้อง', 'โซน/เพศ', 'ลำดับ/เตียง', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'เบอร์โทร', 'สถานะเข้าพัก', 'สถานะกุญแจห้อง', 'โรคประจำตัว', 'แพ้อาหาร/ยา', 'หมู่เลือด', 'ยาที่ต้องการ/เวชภัณฑ์', 'ของที่ต้องใช้/ดูแลพิเศษ', 'เปิดเผยสุขภาพ (ผู้กด)', 'ติดต่อฉุกเฉิน', 'เช็คเตรียม (Staff)']);
      const orderedRooms = [...(roomData.maleRooms || []), ...(roomData.femaleRooms || [])];
      (orderedRooms.length ? orderedRooms : roomData.rooms).forEach(rm => {
        const isMale = rm.gender === 'ชาย';
        for (let b = 0; b < 2; b++) {
          const p = rm.occupants[b];
          const hasPrep = Boolean(p && (p.needsBuddyCare || p.medicalEquipmentNeeded || p.specialItemsNeeded || p.isSpecialCare));
          const consentLabel = p ? `${p.healthConsent?.statusLabel || (p.isHealthShared ? 'ยินยอม' : 'ไม่ยินยอม')} (${p.healthConsent?.actorLabel || '-'})` : '-';
          const emer = p && p.emergencyName !== '-'
            ? `${p.emergencyName}${p.emergencyPhone && p.emergencyPhone !== '-' ? ` (${p.emergencyPhone})` : ''}`
            : (p && p.emergencyPhone && p.emergencyPhone !== '-' ? p.emergencyPhone : '-');
          csv += makeRow([rm.room, isMale ? 'ชาย' : 'หญิง', b + 1, p ? p.name : '(ว่าง)', p ? p.nickname : '-', p ? p.callsign : '-', p ? p.phone : '-', p ? p.stayStatusLabel : '-', p ? p.keyStatusLabel : '-', p ? p.medicalHistory : '-', p ? p.foodAllergy : '-', p ? p.bloodGroup : '-', p?.medicalEquipmentNeeded || '-', p?.specialItemsNeeded || (p?.isSpecialCare ? 'ดูแลพิเศษ' : '-'), consentLabel, emer, p ? (hasPrep ? 'มีต้องเตรียม • [ ] เตรียมแล้ว' : 'ไม่มีต้องเตรียม') : '-']);
        }
      });
      filename = '6_ใบตรวจห้อง_โรค_ยา_ของใช้_Staff_JRE2027.csv';
    } else if (activeDoc === 'medical-supplies') {
      csv = makeRow(['ลำดับ', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'สังกัด', 'ห้องพัก', 'เบอร์โทร', 'ติดต่อฉุกเฉิน', 'โรค/แพ้/หมู่เลือด', 'ยา/เวชภัณฑ์ที่ขอเตรียม', 'ของที่ต้องใช้/ดูแลพิเศษ', 'ความยินยอมสุขภาพ', 'เช็คเตรียม (Staff)', 'URL คำขอยารายคน']);
      medicalSuppliesPrep.prepRows.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.name, r.nickname, r.callsign, r.institution, r.roomLabel, r.phone, r.emergencyContact, `${r.medicalSummary} • เลือด ${r.bloodGroup}`, r.medEquipment || '-', r.specialItems || (r.isSpecialCare ? 'ดูแลพิเศษ' : '-'), r.consentLabel, (r.hasCare || r.medEquipment || r.specialItems) ? 'มีต้องเตรียม • [ ] เตรียมแล้ว' : 'ไม่มีต้องเตรียม', r.requestUrl]);
      });
      filename = '8_เอกสารขอยา_จัดเตรียมยา_เวชภัณฑ์_JRE2027.csv';
    } else if (activeDoc === 'emr-records') {
      csv = makeRow(['ประเภท', 'รหัสเคส', 'วันเวลา', 'ชื่อ-สกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'สังกัด/กลุ่ม/ห้อง', 'หมู่เลือด', 'โรค/แพ้', 'สัญญาณชีพ (V/S)', 'อาการสำคัญ', 'เหตุการณ์', 'การปฐมพยาบาล', 'ยาที่จ่าย', 'ขนาดและเวลา', 'ผู้กรอก', 'ผู้จ่ายยา', 'หมายเหตุ', 'URL รายคน (Admin)', 'URL รายเคส (Admin)', 'URL หน้าเจ้าตัว (รายคน)', 'URL เคสในหน้าเจ้าตัว']);
      emrDocData.personRows.forEach(p => {
        csv += makeRow(['สรุปรายคน', `รวม ${p.caseCount} เคส`, p.lastCase?.timeLabel || '-', p.name, p.nickname, p.callsign, `${p.institution} / ${p.group} / ${p.room}`, p.blood, `โรค: ${p.medical} | แพ้: ${p.allergy}`, '-', p.lastCase?.symptoms || '-', '-', '-', p.lastCase?.medicines || p.requestedEquipment || '-', '-', '-', '-', '-', p.personUrl, '-', p.myEmrUrl, '-']);
      });
      emrDocData.caseRows.forEach(c => {
        csv += makeRow(['รายเคส', c.caseId, c.timeLabel, c.personName, c.nickname, c.callsign, `${c.institution} / ${c.group} / ${c.room}`, c.blood, `โรค: ${c.chronic} | แพ้: ${c.allergy}`, c.vitalSigns, c.symptoms, c.incidentDetail, c.firstAid, c.medicines, c.dosage, c.recorder, c.dispenser, c.notes, c.personUrl, c.caseUrl, c.myEmrUrl, c.myCaseUrl]);
      });
      filename = '9_เอกสารเวชระเบียน_รายคน_รายเคส_JRE2027.csv';
    } else {
      csv = makeRow(['ลำดับ', 'ชื่อ-สกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'สังกัด', 'ประเภทสมาชิก', 'บทบาท & ฝ่าย', 'เพศ', 'อายุ', 'หมู่เลือด', 'เบอร์โทร', 'อีเมล', 'RSVP', 'กลุ่มฝึก', 'ห้องพัก & กุญแจ', 'เสื้อ', 'บัตร ID', 'สถานะการเงิน', 'ยอดเงิน', 'หมายเหตุการเงิน', 'โรค/แพ้', 'ยา/ของใช้', 'เปิดเผยสุขภาพ (ผู้กด)', 'ติดต่อฉุกเฉิน']);
      displayedAdminMasterData.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.name, r.nickname, r.callsign, r.institution, r.memberTypeLabel, `${r.roleWithDuty}${r.isNoAccount ? ' [Admin เพิ่ม • ไม่มีบัญชี]' : ''}`, r.gender, r.ageLabel, r.bloodGroup, r.phone, r.email, r.rsvpSummary, r.groupAssigned, r.dormAndKeySummary, r.shirtSummary, r.idCardSummary, r.paymentStatusLabel, r.paymentAmountsLabel, r.paymentNotesLabel, r.medicalSummary, r.suppliesSummary, r.healthConsentSummary, r.emergencyContact]);
      });
      filename = '7_ทะเบียนข้อมูลละเอียดครบทุกมิติ_Admin_JRE2027.csv';
    }

    downloadCsv(csv, filename);
    if (triggerToast) triggerToast('📁 ดาวน์โหลดไฟล์ CSV (UTF-8 BOM) เรียบร้อยแล้ว');
  };

  const docBadgeLabel = {
    attendance: '1. ใบเซ็นชื่อเข้าร่วมอบรม',
    'id-cards': '2. ใบเซ็นชื่อรับบัตรประจำตัว ID Card',
    shirts: `3. ใบเซ็นชื่อรับเสื้อ (${shirtData.length} ตัว)`,
    rooms: '4. ใบเซ็นชื่อเข้าห้องพัก & กุญแจ (ปิดข้อมูลสุขภาพ)',
    'qr-master': `5. เอกสารรวม QR Code ทุกคนในใบเดียว (${qrMasterData.length} คน)`,
    'rooms-staff': '6. ใบตรวจห้อง & โรค/ยา/ของใช้ (Staff ไม่ต้องเซ็น)',
    'admin-master': '7. ทะเบียนข้อมูลละเอียดครบทุกมิติ (Admin)',
    'medical-supplies': `8. ขอยา / จัดเตรียมยา & เวชภัณฑ์ (${medicalSuppliesPrep.prepRows.length} ท่าน)`,
    'emr-records': `9. เวชระเบียนรายคน / รายเคส (${emrDocData.caseRows.length} เคส)`
  }[activeDoc];

  const isInternalAdminDoc = ['rooms-staff', 'admin-master', 'medical-supplies', 'emr-records'].includes(activeDoc);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/30 p-6 sm:p-8 shadow-2xl no-print">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5 shadow-sm">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>ศูนย์รวมใบรายชื่อ QR Code ฝ่ายพยาบาล และเอกสารครบชุด (9 เอกสาร)</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                URL: /admin/documents
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>📄 ศูนย์จัดทำเอกสาร JRE 2027 (PDPA 4 ใบ + รวม QR ทุกคน + ฝ่ายพยาบาล/เวชระเบียน/Admin 4 ใบ)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ครบทุกเอกสารทั้ง <strong>ชุดลงลายมือชื่อ (PDPA ปิดข้อมูลสุขภาพ)</strong>, <strong>แผ่นรวม QR Code ทุกคนทุกชื่อในใบเดียว</strong>, <strong>เอกสารขอยา-จัดเตรียมยา/เวชภัณฑ์</strong> และ <strong>เวชระเบียนรายคน / รายเคสพร้อม URL แยก</strong> รองรับ Excel (.xlsx), CSV, PDF A4 และ PNG
            </p>
          </div>

          {/* Master 9-in-1 Quick Export Action */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportMasterExcel}
              disabled={isExportingExcel}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>⚡ ดาวน์โหลดครบชุด (Master 9-in-1 Excel)</span>
            </button>
          </div>
        </div>

        {/* GROUP A: 4 SIGNING DOCUMENTS + 1 QR MASTER (PDPA-SAFE) */}
        <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-teal-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>หมวด ก. เอกสารลงลายมือชื่อหน้างาน &amp; รวม QR ทุกคน (5 ใบ • ปิดข้อมูลสุขภาพ PDPA)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setActiveDoc('attendance')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'attendance'
                  ? 'bg-teal-900/90 border-teal-400 text-white ring-2 ring-teal-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>1. ใบเซ็นชื่อเข้าร่วมอบรม</span>
                <Users className="w-4 h-4 text-teal-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">ลงทะเบียนอบรม ({attendanceData.length} คน)</div>
              <span className="text-[11px] font-medium text-teal-200">มีช่องลงลายมือชื่อ + หมายเหตุ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('id-cards')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'id-cards'
                  ? 'bg-indigo-900/90 border-indigo-400 text-white ring-2 ring-indigo-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>2. ใบเซ็นชื่อรับบัตร ID Card</span>
                <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">รับบัตรประจำตัว ({idCardData.length} ใบ)</div>
              <span className="text-[11px] font-medium text-indigo-200">สถานะรูปบัตร + ลายมือชื่อรับบัตร</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('shirts')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'shirts'
                  ? 'bg-purple-900/90 border-purple-400 text-white ring-2 ring-purple-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>3. ใบเซ็นชื่อรับมอบเสื้อ</span>
                <Shirt className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">เสื้อฝึกปฏิบัติการ ({shirtData.length} ตัว)</div>
              <span className="text-[11px] font-medium text-purple-200">TSIKKU / RCPMSU + ช่องเซ็นรับ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('rooms')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'rooms'
                  ? 'bg-sky-900/90 border-sky-400 text-white ring-2 ring-sky-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>4. ใบเซ็นชื่อเข้าห้องพัก</span>
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">เข้าพัก &amp; รับ-คืนกุญแจ (PDPA)</div>
              <span className="text-[11px] font-medium text-sky-200">เชื่อมสถานะไม่พักหอ/กุญแจ • ไม่โชว์โรค</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('qr-master')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'qr-master'
                  ? 'bg-cyan-900/90 border-cyan-400 text-white ring-2 ring-cyan-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>5. รวม QR Code ทุกคน</span>
                <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">QR ทุกชื่อในใบเดียว ({qrMasterData.length} คน)</div>
              <span className="text-[11px] font-medium text-cyan-200">สแกนเช็คชื่อ/บัตร/เสื้อ/EMR ได้เลย</span>
            </button>
          </div>

          {/* GROUP B: 4 INTERNAL ADMIN/STAFF/MEDICAL DETAILED DOCUMENTS */}
          <div className="flex items-center gap-2 pt-2 text-xs font-black uppercase tracking-wider text-rose-200">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>หมวด ข. เอกสารข้อมูลละเอียดสำหรับ Admin / Staff / ฝ่ายพยาบาล (4 ใบ • ไม่ต้องให้ผู้เข้าร่วมเซ็น)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setActiveDoc('rooms-staff')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'rooms-staff'
                  ? 'bg-rose-900/90 border-rose-400 text-white ring-2 ring-rose-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>6. ใบตรวจห้อง &amp; โรค / ยา / ของใช้</span>
                <Stethoscope className="w-4 h-4 text-rose-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">Staff พยาบาล &amp; หอพัก ({roomData.activeFloorSummary || 'ชั้น 3'} + มมส)</div>
              <span className="text-[11px] font-medium text-rose-200">มีต้องเตรียม / ไม่มีต้องเตรียม • ช่องติ๊กเตรียมแล้ว</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('admin-master')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'admin-master'
                  ? 'bg-amber-900/90 border-amber-400 text-white ring-2 ring-amber-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>7. ทะเบียนละเอียดครบทุกมิติ</span>
                <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">Admin Master ({adminMasterData.length} คน)</div>
              <span className="text-[11px] font-medium text-amber-200">RSVP • ห้อง/กุญแจ • เสื้อ/บัตร • การเงิน • สุขภาพ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('medical-supplies')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'medical-supplies'
                  ? 'bg-emerald-900/90 border-emerald-400 text-white ring-2 ring-emerald-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>8. ขอยา &amp; จัดเตรียมยา/เวชภัณฑ์</span>
                <Pill className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">สรุปยอดยา ({medicalSuppliesPrep.summaryItems.length} รายการ • {medicalSuppliesPrep.prepRows.length} คน)</div>
              <span className="text-[11px] font-medium text-emerald-200">สรุปจัดเตรียม + รายชื่อขอยา/เวชภัณฑ์ + URL รายคน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('emr-records')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'emr-records'
                  ? 'bg-pink-900/90 border-pink-400 text-white ring-2 ring-pink-400/40 shadow-lg'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>9. เวชระเบียนรายคน / รายเคส</span>
                <FileHeart className="w-4 h-4 text-pink-400 shrink-0" />
              </div>
              <div className="text-sm font-black text-white">Field EMR ({emrDocData.allCaseRows.length} เคส • {emrDocData.allPersonRows.length} คน)</div>
              <span className="text-[11px] font-medium text-pink-200">ระบุอาการ ยา สัญญาณชีพ + URL แยกรายคน / รายเคส</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXPORT CONTROL TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            ส่งออกเอกสารที่เลือก:
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-teal-300 font-mono text-xs font-bold border border-slate-700">
            {docBadgeLabel}
          </span>
          {activeDoc === 'qr-master' && (
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setQrLayout('grid')}
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${qrLayout === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                การ์ด QR ทุกคนในใบเดียว
              </button>
              <button
                type="button"
                onClick={() => setQrLayout('table')}
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${qrLayout === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                ตารางรายชื่อ + QR + เซ็น
              </button>
            </div>
          )}
          {activeDoc === 'rooms-staff' && (
            <button
              type="button"
              onClick={() => setStaffOnlyAlerts(v => !v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                staffOnlyAlerts
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {staffOnlyAlerts ? '✓ แสดงเฉพาะห้องที่ต้องเตรียมยา/เฝ้าระวัง' : `แสดงทุกห้อง (${roomData.rooms.length} ห้อง)`}
            </button>
          )}
          {activeDoc === 'admin-master' && (
            <div className="flex flex-wrap items-center gap-2 ml-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={adminMasterSearch}
                  onChange={e => setAdminMasterSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ/เรียกขาน/โรค/การเงิน..."
                  className="pl-8 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <select
                value={adminMasterFilter}
                onChange={e => setAdminMasterFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-200 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="all">ทั้งหมด ({adminMasterData.length})</option>
                <option value="alerts">เฉพาะมีโรค/แพ้/ดูแลพิเศษ</option>
                <option value="unpaid">เฉพาะค้างจ่าย / รอตรวจสลิป</option>
                <option value="msu">เฉพาะ มมส</option>
                <option value="kku">เฉพาะ มข</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportSingleExcel}
            disabled={isExportingExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isExportingExcel ? 'กำลังสร้าง Excel...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV (UTF-8 BOM)</span>
          </button>

          <select
            value={printOrientation}
            onChange={e => setPrintOrientation(e.target.value)}
            title="เลือกแนวกระดาษ A4 สำหรับพิมพ์/PDF"
            className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="auto">กระดาษ A4: อัตโนมัติ ({resolvedPrintOrientation === 'landscape' ? 'แนวนอน' : 'แนวตั้ง'})</option>
            <option value="landscape">กระดาษ A4: แนวนอน (ตารางกว้าง)</option>
            <option value="portrait">กระดาษ A4: แนวตั้ง</option>
          </select>

          <button
            type="button"
            onClick={handlePrintDocument}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>พิมพ์ / PDF ({resolvedPrintOrientation === 'landscape' ? 'A4 แนวนอน' : 'A4 แนวตั้ง'})</span>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isExportingPng ? 'กำลังสร้างรูป...' : 'รูปภาพ PNG'}</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (PRINTABLE OFFICIAL SHEET) */}
      <div className="overflow-x-auto pb-4">
        <div 
          id="printable-document-sheet"
          data-landscape={resolvedPrintOrientation === 'landscape' ? 'true' : 'false'}
          className={`official-doc-sheet mx-auto bg-white text-black p-8 sm:p-10 rounded-none shadow-2xl border-2 border-slate-950 ${
            activeDoc === 'admin-master' ? 'min-w-[1240px] max-w-[1440px]' : 'min-w-[980px] max-w-[1180px]'
          } text-xs print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none`}
        >
          {/* OFFICIAL THAI GOVERNMENT-STYLE HEADER SECTION */}
          <div className="pb-4 border-b-4 border-double border-slate-950 mb-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-900 text-[11px] font-bold text-slate-900">
              <span>
                แบบฟอร์มราชการ / เอกสารโครงการฝึกซ้อมร่วมประจำปี (JRE 2027)
              </span>
              <span className="font-mono">
                รหัสเอกสาร: จป-2570-{String({
                  attendance: '01',
                  'id-cards': '02',
                  shirts: '03',
                  rooms: '04',
                  'qr-master': '05',
                  'rooms-staff': '06',
                  'admin-master': '07',
                  'medical-supplies': '08',
                  'emr-records': '09'
                }[activeDoc] || '00')} • {isInternalAdminDoc ? 'ชั้นเอกสาร: เอกสารภายใน (คณะทำงาน / ฝ่ายแพทย์)' : 'ชั้นเอกสาร: ฉบับเผยแพร่ (PDPA-Safe)'}
              </span>
            </div>

            <div className="text-center pt-1 space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                {activeDoc === 'attendance' && 'บัญชีลงเวลาและลงลายมือชื่อเข้าร่วมการฝึกอบรม'}
                {activeDoc === 'id-cards' && 'บัญชีลงลายมือชื่อรับบัตรประจำตัวผู้เข้าร่วมและคณะทำงาน (ID Card)'}
                {activeDoc === 'shirts' && 'บัญชีลงลายมือชื่อรับมอบเสื้อฝึกปฏิบัติการ โครงการ JRE 2027'}
                {activeDoc === 'rooms' && 'บัญชีลงลายมือชื่อเข้าห้องพักและรับ-คืนกุญแจ หอพักกุดรัง (ฉบับปิดข้อมูลสุขภาพ)'}
                {activeDoc === 'qr-master' && 'ทะเบียนรวมรหัสคิวอาร์ (QR Code) ประจำตัวผู้เข้าร่วมทุกคนในแผ่นเดียว'}
                {activeDoc === 'rooms-staff' && 'บัญชีตรวจสอบห้องพัก ข้อมูลสุขภาพ ยาที่ต้องการ และอุปกรณ์เฉพาะบุคคล (สำหรับเจ้าหน้าที่)'}
                {activeDoc === 'admin-master' && 'ทะเบียนคุมข้อมูลผู้ลงทะเบียนฉบับสมบูรณ์ทุกมิติ (สำหรับคณะกรรมการดำเนินงาน)'}
                {activeDoc === 'medical-supplies' && 'บัญชีรายการขอยา เวชภัณฑ์ และแผนการจัดเตรียมเวชภัณฑ์ภาคสนาม'}
                {activeDoc === 'emr-records' && 'ทะเบียนเวชระเบียนสนามรายบุคคลและรายเคส (Field EMR Records)'}
              </h2>

              <p className="text-sm font-bold text-slate-900">
                โครงการฝึกซ้อมร่วมประจำปี Joint Response Exercise (JRE 2027) ระหว่าง มหาวิทยาลัยขอนแก่น และ มหาวิทยาลัยมหาสารคาม
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-400 text-[11px] text-slate-900">
              <div>
                <span className="font-bold">กำหนดการฝึกอบรม:</span> 13 - 15 กุมภาพันธ์ พ.ศ. 2570
              </div>
              <div className="sm:text-center">
                <span className="font-bold">สถานที่:</span> ศูนย์ฝึกอบรมและปฏิบัติการกู้ภัย มหาวิทยาลัยมหาสารคาม
              </div>
              <div className="sm:text-right font-bold">
                {activeDoc === 'attendance' && `จำนวนผู้ลงทะเบียนรวม ${attendanceData.length} คน`}
                {activeDoc === 'id-cards' && `จำนวนบัตรประจำตัว ${idCardData.length} ใบ (ปิดข้อมูลสุขภาพ)`}
                {activeDoc === 'shirts' && `ยอดผลิตรวม ${shirtData.length} ตัว`}
                {activeDoc === 'rooms' && `${roomData.activeFloorSummary || 'ชั้น 3 ห้อง 307 - 333'} • ปิดข้อมูลสุขภาพ`}
                {activeDoc === 'qr-master' && `รวมผู้เข้าร่วม ${qrMasterData.length} คน (PDPA-Safe)`}
                {activeDoc === 'rooms-staff' && 'เอกสารฝ่ายพยาบาล / สวัสดิการ (ไม่ต้องลงลายมือชื่อ)'}
                {activeDoc === 'admin-master' && `จำนวน ${displayedAdminMasterData.length} / ${adminMasterData.length} ท่าน (เอกสารภายใน)`}
                {activeDoc === 'medical-supplies' && `${medicalSuppliesPrep.summaryItems.length} รายการยา/เวชภัณฑ์ • ${medicalSuppliesPrep.prepRows.length} ท่าน`}
                {activeDoc === 'emr-records' && `${emrDocData.personRows.length} ท่าน • ${emrDocData.caseRows.length} เคส`}
              </div>
            </div>
          </div>

          {/* TABLE CONTENT 1: ATTENDANCE ROSTER */}
          {activeDoc === 'attendance' && (
            <div className="space-y-6">
              <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>แบ่งรายชื่อตามเพศ (ชาย / หญิง) และเรียงตามลำดับ: Staff ➔ RCP ➔ TSI ➔ นิสิตอาสา</span>
                <span className="font-mono font-bold">
                  ชาย {attendanceData.filter(p => p.gender === 'ชาย').length} คน • หญิง {attendanceData.filter(p => p.gender === 'หญิง').length} คน • รวม {attendanceData.length} คน
                </span>
              </div>
              <AttendanceGenderTable
                title="1. บัญชีลงชื่อผู้เข้าร่วม — ชาย"
                rows={attendanceData.filter(p => p.gender === 'ชาย')}
              />
              <AttendanceGenderTable
                title="2. บัญชีลงชื่อผู้เข้าร่วม — หญิง"
                rows={attendanceData.filter(p => p.gender === 'หญิง')}
              />
              <AttendanceGenderTable
                title="3. บัญชีลงชื่อผู้เข้าร่วม — ไม่ระบุเพศ"
                rows={attendanceData.filter(p => p.gender !== 'ชาย' && p.gender !== 'หญิง')}
              />
            </div>
          )}

          {/* TABLE CONTENT 2: ID CARD SIGN-IN ROSTER (PDPA-SAFE) */}
          {activeDoc === 'id-cards' && (
            <div className="space-y-6">
              <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>ใบเซ็นชื่อรับบัตรประจำตัวผู้เข้าร่วม / Staff (PDPA-Safe • แยกชาย/หญิง เรียง Staff ➔ RCP ➔ TSI ➔ นิสิตอาสา)</span>
                <span className="font-mono font-bold">
                  พร้อมจ่าย {idCardData.filter(d => d.hasPhoto).length}/{idCardData.length} • รับบัตรแล้ว {idCardData.filter(d => d.isReceived).length} ใบ
                </span>
              </div>
              <IdCardGenderTable
                title="1. บัญชีเซ็นรับบัตร ID Card — ชาย"
                rows={idCardData.filter(c => c.gender === 'ชาย')}
              />
              <IdCardGenderTable
                title="2. บัญชีเซ็นรับบัตร ID Card — หญิง"
                rows={idCardData.filter(c => c.gender === 'หญิง')}
              />
              <IdCardGenderTable
                title="3. บัญชีเซ็นรับบัตร ID Card — ไม่ระบุเพศ"
                rows={idCardData.filter(c => c.gender !== 'ชาย' && c.gender !== 'หญิง')}
              />
            </div>
          )}

          {/* TABLE CONTENT 3: SHIRT DISTRIBUTION ROSTER (32 PRODUCTION SHIRTS) */}
          {activeDoc === 'shirts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-none border-[1.5px] border-slate-900">
                <span>มข. (อกขวา TSIKKU): {shirtStatsSummary.kkuTotal} ตัว ({shirtStatsSummary.kkuBreakdown})</span>
                <span>มมส. (อกขวา RCPMSU): {shirtStatsSummary.msuTotal} ตัว ({shirtStatsSummary.msuBreakdown})</span>
                <span className="font-black text-black">
                  รวมผลิต: {shirtData.length} ตัว • รับแล้ว {shirtData.filter(s => s.isShirtReceived).length}/{shirtData.length}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-900 rounded-none text-[11px] text-slate-900 font-semibold flex flex-wrap items-center justify-between gap-2 no-print">
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>มี QR Code สแกนรับเสื้อท้ายรายชื่อทุกท่าน — ใช้ปุ่ม &quot;สแกน QR อเนกประสงค์&quot; ด้านบนเพื่อสแกนจากกระดาษหรือหน้าจอ และกดบันทึกรับเสื้อแล้วได้ทันที</span>
                </span>
                <span className="font-mono text-[10px] text-slate-700">พร้อมสแกน (Print/PNG/Excel)</span>
              </div>

              <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-bold text-center">
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-10">ลำดับ</th>
                    <th className="py-2.5 px-3 border-[1.5px] border-slate-950 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล ผู้รับมอบ</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-24 whitespace-nowrap">นามเรียกขาน</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-14 whitespace-nowrap">สังกัด</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20 whitespace-nowrap">อกขวา</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-16 whitespace-nowrap">ไซส์เสื้อ</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-12">จำนวน</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-32">สถานะค่าเสื้อ / รับมอบ</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20 whitespace-nowrap">QR รับเสื้อ</th>
                    <th className="py-2.5 px-3 border-[1.5px] border-slate-950 w-32">ลายมือชื่อผู้รับมอบ</th>
                    <th className="py-2.5 px-2 border-[1.5px] border-slate-950 w-20 whitespace-nowrap">วันที่รับ</th>
                  </tr>
                </thead>
                <tbody>
                  {shirtData.map((s, idx) => (
                    <tr key={s.id} className={s.isShirtReceived ? 'bg-emerald-50/40' : (idx % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-1.5 px-3 border border-slate-700 font-bold text-slate-950 whitespace-nowrap">{s.name}</td>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-mono font-semibold whitespace-nowrap">{s.callsign}</td>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-bold whitespace-nowrap">{s.uni}</td>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-mono font-black whitespace-nowrap">{s.chest}</td>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-mono font-black text-sm bg-slate-100 whitespace-nowrap">{s.size}</td>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-mono">1</td>
                      <td className="py-1.5 px-2 border border-slate-700 text-[10px] text-center">
                        <div>{s.payment}</div>
                        <div className={`mt-0.5 font-bold ${s.isShirtReceived ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {s.isShirtReceived ? 'รับเสื้อแล้ว' : 'รอรับเสื้อ'}
                        </div>
                      </td>
                      <td className="py-1 px-1.5 border border-slate-700 text-center bg-white">
                        {shirtQrMap[s.id] ? (
                          <div className="flex flex-col items-center justify-center">
                            <img
                              src={shirtQrMap[s.id]}
                              alt={`QR ${s.name}`}
                              className="w-12 h-12 block bg-white p-0.5 border border-slate-800"
                            />
                            <span className="text-[8px] font-mono text-slate-700 mt-0.5 leading-none">สแกนรับ</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-500">กำลังสร้าง QR...</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-700 text-center">
                        <span className="block border-b border-dotted border-slate-700 h-5 w-full"></span>
                      </td>
                      <td className="py-1.5 px-2 border border-slate-700 text-center font-mono text-[11px] whitespace-nowrap">13 ก.พ. 70</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 rounded-none border border-slate-900 text-[11px] text-slate-800">
                หมายเหตุ: บุคลากร/Staff มมส ที่ถือบัตร Staff อย่างเดียว (0 บาท ไม่รับเสื้อ) จะไม่ปรากฏในยอดผลิตข้างต้น
              </div>
            </div>
          )}

          {/* TABLE CONTENT 3: DORMITORY SIGN-IN ROSTER (PDPA-SAFE: NO HEALTH INFO) */}
          {activeDoc === 'rooms' && (
            <div className="space-y-6">
              <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>ใบเซ็นชื่อเข้าห้องพักฉบับนี้ปิดข้อมูลสุขภาพ/โรคประจำตัวทั้งหมด เพื่อคุ้มครองข้อมูลส่วนบุคคล (PDPA) ณ จุดลงทะเบียน</span>
                <span className="font-mono font-bold">เรียงลำดับตามโซน ชาย ({roomData.maleRooms.map(r => r.room).join(', ')}) • หญิง ({roomData.femaleRooms.map(r => r.room).join(', ')})</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-900 rounded-none text-[11px] text-slate-900 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>
                  สถานะห้องพัก: เข้าพักหอ <strong>{roomData.totalStaying}</strong> คน •
                  ไม่ประสงค์พักหอ <strong className="text-amber-900">{roomData.totalOptedOut}</strong> คน •
                  ไป-กลับ มมส <strong>{roomData.msuList.length}</strong> คน •
                  จ่ายกุญแจแล้ว <strong>{roomData.totalKeysIssued}</strong> ดอก •
                  คืนกุญแจแล้ว <strong>{roomData.totalKeysReturned}/{roomData.totalKeysIssued}</strong> ดอก
                </span>
                <span className="font-mono text-slate-900">ข้อมูลห้องพักล่าสุด</span>
              </div>

              <DormSignInZoneTable
                title={`1. ห้องพักชาย (${roomData.maleRooms.length} ห้อง — หอพักกุดรัง ${roomData.activeFloorSummary || 'ชั้น 3'})`}
                subtitle="ห้องละ 2 คน • เตียงเดี่ยวคู่ • เครื่องปรับอากาศ • เครื่องทำน้ำอุ่น"
                rooms={roomData.maleRooms}
                altBgClass="bg-slate-50/70"
                zoneLabel="ชาย"
              />

              <div className="pt-2">
                <DormSignInZoneTable
                  title={`2. ห้องพักหญิง (${roomData.femaleRooms.length} ห้อง — หอพักกุดรัง ${roomData.activeFloorSummary || 'ชั้น 3'})`}
                  subtitle="ห้องละ 2 คน • เตียงเดี่ยวคู่ • เครื่องปรับอากาศ • เครื่องทำน้ำอุ่น"
                  rooms={roomData.femaleRooms}
                  altBgClass="bg-slate-50/70"
                  zoneLabel="หญิง"
                />
              </div>

              {roomData.optedOutPeople.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-none border border-slate-900 text-[11px] text-slate-950">
                  <span className="font-bold">รายชื่อผู้แจ้งไม่ประสงค์เข้าพักหอพักที่จัดเตรียมให้ ({roomData.optedOutPeople.length} ท่าน):</span>{' '}
                  {roomData.optedOutPeople.map(o => `${o.name}${o.roomNumber ? ` (เดิมห้อง ${o.roomNumber})` : ''}`).join(', ')}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-none border border-slate-900 text-[11px] text-slate-900">
                <span className="font-bold">นิสิต / คณะกรรมการ มมส ({roomData.msuList.length} ท่าน) — ไม่พักหอพัก (ไป-กลับเอง):</span>{' '}
                {roomData.msuList.map(m => m.name).join(', ')}
              </div>
            </div>
          )}

          {/* TABLE CONTENT 4: STAFF MEDICAL & SUPPLIES ROOM CHECKLIST (NO SIGNATURE COLUMN) */}
          {activeDoc === 'rooms-staff' && (
            <div className="space-y-6">
              <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>
                  เอกสารภายในเจ้าหน้าที่ (ไม่ต้องลงลายมือชื่อ): ห้องพัก, สถานะเข้าพัก/ไม่พัก, กุญแจ, โรค/แพ้, ยา, ของที่ต้องใช้, ผู้ติดต่อฉุกเฉิน และความยินยอมเปิดเผยสุขภาพ ({roomData.totalStaying} พักหอ / {roomData.totalOptedOut} ไม่ประสงค์พักหอ / {roomData.msuList.length} ไป-กลับ มมส • กุญแจจ่าย {roomData.totalKeysIssued} / คืน {roomData.totalKeysReturned})
                </span>
                <span className="font-mono font-bold">เฉพาะ Staff</span>
              </div>

              <StaffMedicalZoneTable
                title={`1. โซนห้องพักชาย (${displayedStaffMaleRooms.length} ห้อง)`}
                rooms={displayedStaffMaleRooms}
                zoneLabel="ชาย"
              />

              <StaffMedicalZoneTable
                title={`2. โซนห้องพักหญิง (${displayedStaffFemaleRooms.length} ห้อง)`}
                rooms={displayedStaffFemaleRooms}
                zoneLabel="หญิง"
              />

              {roomData.msuNeedsCare.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-black text-slate-950 mb-2">
                    3. ข้อมูลโรคประจำตัว / ยา / ของที่ต้องใช้ ของผู้เข้าร่วม มมส (ไป-กลับ ไม่พักหอ — {roomData.msuNeedsCare.length} ท่าน)
                  </h3>
                  <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
                    <thead>
                      <tr className="bg-slate-200 text-slate-950 font-bold text-center">
                        <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">ประเภท</th>
                        <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล / ติดต่อ</th>
                        <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left">โรคประจำตัว / อาการแพ้ / หมู่เลือด</th>
                        <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left">ยาที่ต้องการ / เวชภัณฑ์</th>
                        <th className="py-2 px-2.5 border-[1.5px] border-slate-950 text-left">ของที่ต้องใช้ / ดูแลพิเศษ</th>
                        <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">เช็คเตรียม (Staff)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomData.msuNeedsCare.map((p, idx) => (
                        <tr key={p.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="py-2 px-2 border border-slate-700 text-center font-bold text-slate-900">ไป-กลับ มมส</td>
                          <td className="py-2 px-2.5 border border-slate-700">
                            <div className="font-bold text-slate-950 whitespace-nowrap">{p.name}</div>
                            <div className="text-[10px] text-slate-700 font-mono">{p.callsign} • โทร: {p.phone}</div>
                            {p.emergencyName && p.emergencyName !== '-' && (
                              <div className="text-[9.5px] text-rose-900 font-semibold">
                                ฉุกเฉิน: {p.emergencyName} ({p.emergencyPhone})
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border border-slate-700 text-[11px]">
                            {p.hasMedicalHistory && <div className="font-bold text-rose-900">โรค: {formatMedicalLabel(p.medicalHistory)}</div>}
                            {p.hasFoodAllergy && <div className="font-bold text-amber-900">แพ้: {formatAllergyLabel(p.foodAllergy)}</div>}
                            {!p.hasMedicalHistory && !p.hasFoodAllergy && <span className="text-emerald-800">ปกติ</span>}
                            {p.bloodGroup && p.bloodGroup !== '-' && (
                              <div className="text-[10px] font-mono text-slate-800">หมู่เลือด: {p.bloodGroup}</div>
                            )}
                            <div className="text-[9.5px] text-slate-700 mt-0.5">
                              {p.healthConsent?.fullLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 border border-slate-700 text-[11px] font-semibold text-emerald-950">
                            {p.medicalEquipmentNeeded || '-'}
                          </td>
                          <td className="py-2 px-2.5 border border-slate-700 text-[11px] font-semibold text-indigo-950">
                            {p.specialItemsNeeded || (p.isSpecialCare ? 'ต้องดูแลเป็นพิเศษ' : '-')}
                          </td>
                          <td className="py-2 px-2 border border-slate-700 text-center text-[11px]">
                            <div className="space-y-0.5">
                              <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-800 text-[9.5px] font-black">
                                มีต้องเตรียม
                              </span>
                              <span className="flex items-center justify-center gap-1 font-bold text-slate-900 text-[10.5px]">
                                <span className="inline-block w-3.5 h-3.5 border-[1.5px] border-slate-900 bg-white shrink-0"></span>
                                <span>เตรียมแล้ว</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TABLE CONTENT 6: COMPREHENSIVE ADMIN MASTER ROSTER (INTERNAL ADMIN ONLY) */}
          {activeDoc === 'admin-master' && (
            <div className="space-y-4">
              <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>
                  ทะเบียนข้อมูลละเอียดครบทุกมิติสำหรับ Admin ({displayedAdminMasterData.length}/{adminMasterData.length} ท่าน) — การเงิน ห้องพัก/ไม่พัก/กุญแจ เสื้อ บัตร ID โรคประจำตัว ยา ของใช้ ผู้กดยินยอมสุขภาพ และติดต่อฉุกเฉิน
                </span>
                <span className="font-mono font-bold text-rose-900">เอกสารภายในคณะกรรมการ</span>
              </div>

              <table className="official-table w-full text-left text-[11px] border-collapse border-2 border-slate-950">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-bold text-center">
                    <th className="py-2 px-1.5 border-[1.5px] border-slate-950 w-8">ที่</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 text-left min-w-[215px] whitespace-nowrap">ชื่อ-สกุล / นามเรียกขาน</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">สังกัด / บทบาท</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">RSVP / กลุ่ม</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-32">ห้องพัก &amp; กุญแจ</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">เสื้อ &amp; บัตร ID</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-44 text-left">การเงิน &amp; หมายเหตุ</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-44 text-left">โรค/แพ้/ยา/ของใช้</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 w-32">เปิดเผยสุขภาพ</th>
                    <th className="py-2 px-2 border-[1.5px] border-slate-950 text-left w-36">ติดต่อฉุกเฉิน</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAdminMasterData.map((r, idx) => {
                    const metaItems = [
                      r.gender !== '-' ? r.gender : null,
                      r.ageLabel !== '-' ? r.ageLabel : null,
                      r.bloodGroup !== '-' ? `เลือด ${r.bloodGroup}` : null,
                      r.phone !== '-' ? r.phone : 'ไม่มีเบอร์โทร'
                    ].filter(Boolean).join(' • ');
                    return (
                    <tr key={r.id} className={r.hasHealthAlert ? 'bg-rose-50/70' : (idx % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                      <td className="py-2 px-1.5 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-2 border border-slate-700">
                        <div className="font-bold text-slate-950 whitespace-nowrap">{r.name}</div>
                        <div className="text-[10px] text-slate-700 font-mono">
                          ({r.nickname}) • {r.callsign}
                        </div>
                        <div className="text-[9.5px] text-slate-700 font-mono">
                          {metaItems}
                        </div>
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-center">
                        <div className="font-bold text-slate-950">{r.institution}</div>
                        <div className="text-[9.5px] text-slate-700">{r.memberTypeLabel}</div>
                        <div className="text-[9.5px] text-indigo-900 font-semibold">{r.roleWithDuty}</div>
                        {r.isNoAccount && (
                          <div className="mt-1 inline-block px-1.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-700 text-[8.5px] font-bold">
                            Admin เพิ่ม (ไม่มีบัญชี)
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-center">
                        <div className="font-semibold text-slate-900 text-[10px]">{r.rsvpSummary}</div>
                        <div className="text-[9.5px] text-slate-700 font-mono mt-0.5">{r.groupAssigned}</div>
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-[10px]">
                        <div className="font-semibold text-slate-900">{r.dormAndKeySummary}</div>
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-center text-[10px]">
                        <div className="font-semibold text-slate-900">เสื้อ: {r.shirtSummary}</div>
                        <div className="text-slate-900 mt-0.5">บัตร: {r.idCardSummary}</div>
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-[10px]">
                        <div className="font-bold text-slate-950">{r.paymentStatusLabel}</div>
                        <div className="text-[9.5px] text-slate-800 font-mono">{r.paymentAmountsLabel}</div>
                        {r.paymentNotesLabel !== '-' && (
                          <div className="text-[9.5px] text-amber-900 font-semibold">{r.paymentNotesLabel}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-[10px]">
                        <div className={r.hasHealthAlert ? 'font-bold text-rose-900' : 'text-emerald-800'}>
                          {r.medicalSummary}
                        </div>
                        {r.suppliesSummary !== '-' && (
                          <div className="text-[9.5px] text-indigo-950 font-semibold mt-0.5">
                            ของใช้/ยา: {r.suppliesSummary}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-center text-[9.5px] font-semibold text-slate-800">
                        {r.healthConsentSummary}
                      </td>
                      <td className="py-2 px-2 border border-slate-700 text-[10px] text-rose-950 font-semibold">
                        {r.emergencyContact}
                      </td>
                    </tr>
                    );
                  })}
                  {displayedAdminMasterData.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 border border-slate-700 text-center text-slate-600">
                        ไม่พบข้อมูลที่ตรงกับตัวกรอง
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE CONTENT 5: ALL PARTICIPANTS QR MASTER IN ONE SHEET */}
          {activeDoc === 'qr-master' && (
            <QrMasterSheet records={qrMasterData} qrMap={qrMasterMap} layout={qrLayout} />
          )}

          {/* TABLE CONTENT 8: MEDICINE & MEDICAL SUPPLIES PREPARATION SHEET */}
          {activeDoc === 'medical-supplies' && (
            <MedicalSuppliesSheet
              prepRows={medicalSuppliesPrep.prepRows}
              summaryItems={medicalSuppliesPrep.summaryItems}
              requestUrlFor={(r) => r.requestUrl}
              triggerToast={triggerToast}
            />
          )}

          {/* TABLE CONTENT 9: FIELD EMR PER-PERSON & PER-CASE WITH SEPARATE URLS */}
          {activeDoc === 'emr-records' && (
            <EmrRecordsSheet
              personRows={emrDocData.personRows}
              caseRows={emrDocData.caseRows}
              isLoading={isLoadingEmr}
              search={emrSearch}
              onSearchChange={setEmrSearch}
              onReload={() => setEmrReloadKey(k => k + 1)}
              onOpenPerson={onOpenEmrPerson}
              onOpenCase={onOpenEmrCase}
              triggerToast={triggerToast}
            />
          )}

          {/* OFFICIAL THAI GOVERNMENT SIGNATURE FOOTER */}
          {isInternalAdminDoc ? (
            <div className="pt-5 mt-6 border-t-2 border-slate-950 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-900" style={{ breakInside: 'avoid' }}>
              <span>หมายเหตุ: เอกสารข้อมูลภายในสำหรับคณะทำงาน / Staff / ฝ่ายแพทย์สนามเท่านั้น (ข้อมูลเชื่อมตรงกับระบบแบบ Real-time)</span>
              <span className="font-bold">ลงชื่อผู้ตรวจสอบ (Staff/แพทย์): .................................................... วันที่ ........ / ............ / 2570</span>
            </div>
          ) : (
            <div className="pt-8 mt-8 border-t-2 border-slate-950 grid grid-cols-2 gap-8 text-center text-xs text-slate-950" style={{ breakInside: 'avoid' }}>
              <div className="space-y-1.5">
                <p className="mb-7">ลงชื่อ ..................................................................... เจ้าหน้าที่ฝ่ายทะเบียน / ผู้ตรวจสอบ</p>
                <p className="font-bold">( ..................................................................... )</p>
                <p className="text-[11px]">ตำแหน่ง เจ้าหน้าที่ฝ่ายทะเบียนและประเมินผล โครงการ JRE 2027</p>
                <p className="text-[11px]">วันที่ ............ / ........................ / พ.ศ. 2570</p>
              </div>

              <div className="space-y-1.5">
                <p className="mb-7">ลงชื่อ ..................................................................... ประธาน / ผู้รับผิดชอบโครงการ</p>
                <p className="font-bold">( ..................................................................... )</p>
                <p className="text-[11px]">ตำแหน่ง ประธานคณะกรรมการดำเนินงาน โครงการ JRE 2027</p>
                <p className="text-[11px]">วันที่ ............ / ........................ / พ.ศ. 2570</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
