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
  QrCode
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
  hasSpecialCareCondition,
  getMedicalEquipmentNeeded,
  getHealthConsentInfo,
  isCommitteeDutyNote
} from '../data/defaultData';
import { 
  buildDormitoryRoomData,
  parseSpecialNotesExtra,
  getSpecialItemsNeeded,
  parseRoomInfo
} from '../utils/roomUtils';
import { getAttendanceConfirmationInfo } from '../supabase';
import { 
  exportAttendanceRosterToExcel,
  exportIdCardRosterToExcel,
  exportShirtRosterToExcel,
  exportDormitoryRosterToExcel,
  exportDormitoryStaffMedicalExcel,
  exportAdminMasterRosterExcel,
  exportAllRostersToMasterExcel,
  downloadCsv,
  exportElementToPng
} from '../utils/documentExporters';

const VALID_DOC_TABS = new Set(['attendance', 'id-cards', 'shirts', 'rooms', 'rooms-staff', 'admin-master']);

function getInitialDocTab() {
  if (typeof window === 'undefined') return 'attendance';
  const param = new URLSearchParams(window.location.search).get('tab')?.toLowerCase();
  if (param && VALID_DOC_TABS.has(param)) return param;
  return 'attendance';
}

function DormSignInZoneTable({ title, subtitle, rooms, altBgClass, zoneLabel }) {
  return (
    <div>
      <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-600">{subtitle}</span>
      </h3>

      <table className="w-full text-left text-xs border-collapse border border-slate-900">
        <thead>
          <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 text-center">
            <th className="py-2.5 px-2 border-r border-slate-900 w-20">ห้อง</th>
            <th className="py-2.5 px-2 border-r border-slate-900 w-16">เตียง</th>
            <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px] whitespace-nowrap">ชื่อ - นามสกุล ผู้เข้าพัก</th>
            <th className="py-2.5 px-2 border-r border-slate-900 w-20 whitespace-nowrap">ชื่อเล่น</th>
            <th className="py-2.5 px-2 border-r border-slate-900 w-28 whitespace-nowrap">นามเรียกขาน</th>
            <th className="py-2.5 px-2 border-r border-slate-900 w-24 whitespace-nowrap">เบอร์โทร</th>
            <th className="py-2.5 px-2 border-r border-slate-900 w-28">เข้าพัก & กุญแจ</th>
            <th className="py-2.5 px-4 border-r border-slate-900 w-28">ลายมือชื่อรับกุญแจ</th>
            <th className="py-2.5 px-4 w-28">ลายมือชื่อคืนกุญแจ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-400">
          {rooms.map((rm) => (
            <React.Fragment key={rm.room}>
              {[0, 1].map((b) => {
                const p = rm.occupants[b];
                const isOptOut = Boolean(p?.dormOptOut);
                return (
                  <tr
                    key={`${rm.room}-${b}`}
                    className={`${b === 1 ? 'border-b-2 border-slate-900 ' : ''}${isOptOut ? 'bg-amber-50/70' : (b === 1 ? altBgClass : 'bg-white')}`}
                  >
                    {b === 0 && (
                      <td rowSpan={2} className="py-2 px-2 border-r border-slate-900 text-center font-mono font-black text-sm bg-slate-100 align-middle">
                        {rm.roomLabel}
                        <span className="block text-[10px] font-normal text-slate-500">
                          {rm.floorLabel ? `${rm.floorLabel} (${zoneLabel.includes('ชาย') ? 'ชาย' : 'หญิง'})` : zoneLabel}
                        </span>
                        <span className="block text-[9px] font-sans font-bold text-sky-800 mt-0.5">
                          🔑 {rm.keySummaryLabel}
                        </span>
                      </td>
                    )}
                    <td className="py-2 px-2 border-r border-slate-400 text-center font-mono text-[11px]">เตียง {b + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950 whitespace-nowrap">
                      {p ? (
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="whitespace-nowrap">{p.name}</span>
                          {isOptOut && (
                            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded text-[9px] font-black whitespace-nowrap">
                              ไม่พักหอ
                            </span>
                          )}
                        </div>
                      ) : '(ว่าง)'}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-400 text-center whitespace-nowrap">{p ? p.nickname : '-'}</td>
                    <td className="py-2 px-2 border-r border-slate-400 text-center font-mono whitespace-nowrap">{p ? p.callsign : '-'}</td>
                    <td className="py-2 px-2 border-r border-slate-400 text-center font-mono whitespace-nowrap">{p ? p.phone : '-'}</td>
                    <td className="py-2 px-2 border-r border-slate-400 text-center text-[10px]">
                      <div className="font-mono font-bold text-slate-700">K-{rm.room}</div>
                      {p ? (
                        isOptOut ? (
                          <span className="text-amber-800 font-bold">🚫 ไม่พักหอ</span>
                        ) : p.roomKeyReturned ? (
                          <span className="text-emerald-800 font-bold">✅ คืนกุญแจแล้ว</span>
                        ) : p.roomKeyHeld ? (
                          <span className="text-sky-800 font-bold">🔑 ถือกุญแจ ✓</span>
                        ) : (
                          <span className="text-slate-500">☐ รอรับกุญแจ</span>
                        )
                      ) : '-'}
                    </td>
                    <td className="py-2 px-4 border-r border-slate-400 text-center">
                      {isOptOut ? (
                        <span className="text-[10px] font-bold text-amber-800">(ไม่เข้าพัก)</span>
                      ) : (
                        <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {isOptOut ? (
                        <span className="text-[10px] font-bold text-amber-800">(ไม่เข้าพัก)</span>
                      ) : (
                        <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
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
        <span className="text-[11px] font-semibold text-slate-600">ลำดับในห้อง: คนที่ 1 มีโรคประจำตัว/แพ้ • คนที่ 2 ปกติ (ช่วยดูแล)</span>
      </h3>

      <table className="w-full text-left text-xs border-collapse border border-slate-900">
        <thead>
          <tr className="bg-rose-950 text-white font-bold border-b border-slate-900 text-center">
            <th className="py-2 px-2 border-r border-slate-700 w-20">ห้อง</th>
            <th className="py-2 px-1.5 border-r border-slate-700 w-14">ลำดับ</th>
            <th className="py-2 px-2.5 border-r border-slate-700 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล / ติดต่อ</th>
            <th className="py-2 px-2.5 border-r border-slate-700 text-left">โรคประจำตัว / อาการแพ้ / หมู่เลือด</th>
            <th className="py-2 px-2.5 border-r border-slate-700 text-left">ยาที่ต้องการ / เวชภัณฑ์</th>
            <th className="py-2 px-2.5 border-r border-slate-700 text-left">ของที่ต้องใช้ / ดูแลพิเศษ</th>
            <th className="py-2 px-2 w-28">เช็คเตรียม (Staff)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-400">
          {rooms.map((rm) => {
            const roomHasAlert = rm.occupants.some(o => o.needsBuddyCare || o.medicalEquipmentNeeded || o.specialItemsNeeded);
            return (
              <React.Fragment key={rm.room}>
                {[0, 1].map((b) => {
                  const p = rm.occupants[b];
                  const hasCare = Boolean(p && (p.needsBuddyCare || p.medicalEquipmentNeeded || p.specialItemsNeeded || p.isSpecialCare));
                  return (
                    <tr
                      key={`${rm.room}-${b}`}
                      className={`${b === 1 ? 'border-b-2 border-slate-900 ' : ''}${hasCare ? 'bg-rose-50/70' : 'bg-white'}`}
                    >
                      {b === 0 && (
                        <td
                          rowSpan={2}
                          className={`py-2 px-2 border-r border-slate-900 text-center font-mono font-black text-sm align-middle ${
                            roomHasAlert ? 'bg-rose-100 text-rose-950' : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          {rm.roomLabel}
                          <span className="block text-[10px] font-normal text-slate-600">
                            {rm.floorLabel ? `${rm.floorLabel} (${zoneLabel.includes('ชาย') ? 'ชาย' : 'หญิง'})` : zoneLabel}
                          </span>
                          <span className="block text-[9px] font-sans font-bold text-sky-900 mt-0.5">
                            🔑 {rm.keySummaryLabel}
                          </span>
                          {roomHasAlert && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-sans font-bold">
                              เฝ้าระวัง
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-2 px-1.5 border-r border-slate-400 text-center font-mono text-[11px] font-bold">
                        {b + 1}
                        <span className="block text-[9px] font-normal text-slate-500">เตียง {b + 1}</span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-400">
                        {p ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-950 whitespace-nowrap">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {p.nickname !== '-' && <span className="font-semibold text-slate-700">({p.nickname}) • </span>}
                              <span className="font-mono">{p.callsign} • โทร: {p.phone}</span>
                            </div>
                            <div className="text-[9.5px] font-bold flex flex-wrap gap-1">
                              <span className={p.dormOptOut ? 'text-amber-800' : 'text-emerald-800'}>
                                {p.dormOptOut ? '🚫 ไม่ประสงค์พักหอ' : '🛏️ พักหอ'}
                              </span>
                              <span>•</span>
                              <span className="text-sky-900">🔑 {p.keyStatusLabel}</span>
                            </div>
                            {p.emergencyName && p.emergencyName !== '-' && (
                              <div className="text-[9.5px] text-rose-800 font-semibold">
                                🚨 ฉุกเฉิน: {p.emergencyName} ({p.emergencyPhone})
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">(ว่าง)</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-400">
                        {p ? (
                          p.hasMedicalHistory || p.hasFoodAllergy ? (
                            <div className="space-y-0.5 text-[11px]">
                              {p.hasMedicalHistory && (
                                <div className="font-bold text-rose-800">🩺 โรค: {p.medicalHistory}</div>
                              )}
                              {p.hasFoodAllergy && (
                                <div className="font-bold text-amber-800">⚠️ แพ้: {p.foodAllergy}</div>
                              )}
                              <div className="text-[10px] font-mono text-slate-700">
                                🩸 หมู่เลือด: {p.bloodGroup}
                              </div>
                              <div className={`text-[10px] font-bold ${p.isHealthShared ? 'text-emerald-800' : 'text-amber-900'}`}>
                                {p.healthConsent?.fullLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[11px] text-emerald-700 font-semibold block">
                                ✓ ปกติ (ไม่มีโรค/ไม่แพ้){p.bloodGroup && p.bloodGroup !== '-' ? ` • เลือด ${p.bloodGroup}` : ''}
                              </span>
                              <span className="text-[9.5px] text-slate-600 block">
                                {p.healthConsent?.fullLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')}
                              </span>
                            </div>
                          )
                        ) : '-'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-400 text-[11px]">
                        {p?.medicalEquipmentNeeded ? (
                          <span className="font-bold text-emerald-900">{p.medicalEquipmentNeeded}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-400 text-[11px]">
                        {p?.specialItemsNeeded ? (
                          <span className="font-semibold text-indigo-900">{p.specialItemsNeeded}</span>
                        ) : p?.isSpecialCare ? (
                          <span className="font-semibold text-indigo-900">ต้องดูแลเป็นพิเศษ</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-[11px]">
                        {p ? (
                          hasCare ? (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                              <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-sm"></span>
                              <span>เตรียมแล้ว</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">ผู้ช่วยดูแล</span>
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
  triggerToast
}) {
  const [activeDoc, setActiveDoc] = useState(getInitialDocTab); // 'attendance' | 'id-cards' | 'shirts' | 'rooms' | 'rooms-staff' | 'admin-master'
  const [staffOnlyAlerts, setStaffOnlyAlerts] = useState(false);
  const [adminMasterSearch, setAdminMasterSearch] = useState('');
  const [adminMasterFilter, setAdminMasterFilter] = useState('all'); // 'all' | 'alerts' | 'unpaid' | 'msu' | 'kku'
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [shirtQrMap, setShirtQrMap] = useState({});

  // 1. Prepare Attendance Data (36 Persons)
  const attendanceData = useMemo(() => {
    const list = (registrations || []).map(reg => {
      const nameData = resolvePersonFullNameWithTitle(reg);
      const uniInfo = resolveUniversityInfo(reg);
      const gender = resolveGender(reg);
      const extra = parseSpecialNotesExtra(reg);
      const attInfo = getAttendanceConfirmationInfo(reg);

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
      const notes = `${roomNote}${rsvpShort}`;

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
        groupAssigned: reg.group_assigned || '',
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

  // 2. Prepare ID Card Pickup Roster (36 Persons — PDPA-Safe)
  const idCardData = useMemo(() => {
    const byId = new Map((registrations || []).map(r => [r.id || r.user_id, r]));
    return attendanceData.map(item => {
      const reg = byId.get(item.id) || {};
      const extra = parseSpecialNotesExtra(reg);
      const isReceived = Boolean(reg.id_card_received || extra.id_card_received);
      const hasPhoto = Boolean(reg.id_card_photo || extra.id_card_photo);
      let idCardStatus = 'รอรับบัตร ID';
      if (isReceived) idCardStatus = '✓ รับบัตรแล้ว';
      else if (hasPhoto) idCardStatus = 'พร้อมจ่าย (มีรูปบัตร)';
      else idCardStatus = 'รอส่งรูป / รอรับบัตร';

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

  // 4. Prepare Dormitory Rooms Data (Rooms 101 - 110, sorted #1 care, #2 healthy)
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
      const consent = getHealthConsentInfo(reg);
      const roomPerson = roomPersonById.get(id);

      const nickname = extra.nickname || reg.nickname || '-';
      const rawCallsign = extra.callsign || reg.callsign || '-';
      const callsign = normalizeCallsignSpacing(rawCallsign);
      const isStaff = Boolean(extra.is_staff || reg.is_staff || rawCallsign.includes('STAFF'));
      const isCommittee = Boolean(extra.staff_role_type === 'committee' || isStaff);

      const dutyNote = typeof reg.special_notes === 'string' && isCommitteeDutyNote(reg.special_notes)
        ? reg.special_notes.trim()
        : (extra.committee_duty || '');
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
          : `${matchedRoom ? `${parsedRoom.floorLabel || roomPerson?.roomFloorLabel || 'ชั้น 1'} ห้อง ${matchedRoom}` : 'รอจัดห้อง'} • ${roomPerson?.keyStatusLabel || 'ยังไม่ได้จ่ายกุญแจ'}`;

      // Shirt & ID Card
      const isCardOnly = Boolean(extra.staff_id_card_only || reg.staff_id_card_only);
      const shirtSize = normalizeShirtSize(extra.shirt_size || reg.shirt_size || '-');
      const isShirtReceived = Boolean(reg.shirt_received || reg.shirt_pickup_status === 'received' || extra.shirt_received);
      const shirtSummary = isCardOnly || shirtSize === '-' || shirtSize === 'ไม่มี'
        ? 'ไม่รับเสื้อ (บัตร ID)'
        : `${shirtSize} • ${isShirtReceived ? '✓ รับแล้ว' : 'รอรับ'}`;

      const isIdCardReceived = Boolean(reg.id_card_received || extra.id_card_received);
      const hasIdPhoto = Boolean(reg.id_card_photo || extra.id_card_photo);
      const idCardSummary = isIdCardReceived
        ? '✓ รับบัตรแล้ว'
        : hasIdPhoto
          ? 'มีรูปบัตร • รอรับ'
          : 'รอส่งรูปบัตร';

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
      if (hasMed && med) medParts.push(`โรค: ${med}`);
      if (hasAlg && alg) medParts.push(`แพ้: ${alg}`);
      const medicalSummary = medParts.length > 0 ? medParts.join(' | ') : 'ปกติ';
      const medEquip = getMedicalEquipmentNeeded(reg);
      const specialItems = getSpecialItemsNeeded(reg, extra);
      const suppliesParts = [];
      if (medEquip) suppliesParts.push(`ยา: ${medEquip}`);
      if (specialItems) suppliesParts.push(`ของใช้: ${specialItems}`);
      const suppliesSummary = suppliesParts.length > 0 ? suppliesParts.join(' | ') : (hasSpecialCareCondition(reg) ? 'ต้องดูแลเป็นพิเศษ' : '-');
      const hasHealthAlert = Boolean(hasMed || hasAlg || medEquip || specialItems || hasSpecialCareCondition(reg));

      const emergencyName = reg.emergency_name || extra.emergency_name || '-';
      const emergencyPhone = reg.emergency_phone || extra.emergency_phone || '-';
      const emergencyContact = emergencyName !== '-' ? `${emergencyName} (${emergencyPhone})` : '-';

      const ageLabel = reg.age_years ? `${reg.age_years} ปี` : '-';

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
        memberTypeLabel: memberTypeInfo?.shortLabel || (memberTypeInfo?.isClubMember ? 'สมาชิกชมรม' : 'อาสา'),
        role,
        roleWithDuty,
        gender,
        ageLabel,
        bloodGroup: reg.blood_group || '-',
        phone: reg.phone || extra.phone || '-',
        email: reg.user_email || '-',
        rsvpSummary: `${attInfo.statusLabel}${attInfo.reason ? ` (${attInfo.reason})` : ''}`,
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

    return list.sort((a, b) => {
      if (a.isCommittee && !b.isCommittee) return -1;
      if (!a.isCommittee && b.isCommittee) return 1;
      if (a.isMsu && !b.isMsu) return -1;
      if (!a.isMsu && b.isMsu) return 1;
      return a.name.localeCompare(b.name, 'th');
    });
  }, [registrations, paymentConfig, roomData]);

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

  // Handler: Print Current Document Cleanly
  const handlePrintDocument = () => {
    document.body.classList.add('document-print-active');
    const cleanup = () => {
      document.body.classList.remove('document-print-active');
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
        'rooms-staff': '5_ใบตรวจห้อง_โรคประจำตัว_ยา_ของใช้_Staff',
        'admin-master': '6_ทะเบียนข้อมูลละเอียดครบทุกมิติ_Admin'
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
        await exportDormitoryRosterToExcel(roomData.rooms, roomData.msuList);
      } else if (activeDoc === 'rooms-staff') {
        await exportDormitoryStaffMedicalExcel(roomData.rooms, roomData.msuList);
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

  // Handler: Export Master 6-in-1 Excel
  const handleExportMasterExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportAllRostersToMasterExcel({
        attendanceRecords: attendanceData,
        idCardRecords: idCardData,
        shirtRecords: shirtData,
        roomList: roomData.rooms,
        msuList: roomData.msuList,
        adminMasterRecords: adminMasterData
      });
      if (triggerToast) triggerToast('⚡ ดาวน์โหลดชุดเอกสารครบทั้ง 6 ใบ (Master 6-in-1 Excel) สำเร็จ');
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
      roomData.rooms.forEach(rm => {
        const isMale = rm.gender === 'ชาย';
        for (let b = 0; b < 2; b++) {
          const p = rm.occupants[b];
          csv += makeRow([rm.room, isMale ? 'ชาย' : 'หญิง', b + 1, p ? p.name : '(ว่าง)', p ? p.nickname : '-', p ? p.callsign : '-', p ? p.phone : '-', p ? p.stayStatusLabel : '-', p ? p.keyStatusLabel : '-', '', '']);
        }
      });
      filename = '4_ใบเซ็นชื่อ_เข้าห้องพัก_ปิดข้อมูลสุขภาพ_JRE2027.csv';
    } else if (activeDoc === 'rooms-staff') {
      csv = makeRow(['เลขห้อง', 'โซน/เพศ', 'ลำดับ/เตียง', 'ชื่อ - นามสกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'เบอร์โทร', 'สถานะเข้าพัก', 'สถานะกุญแจห้อง', 'โรคประจำตัว', 'แพ้อาหาร/ยา', 'หมู่เลือด', 'ยาที่ต้องการ/เวชภัณฑ์', 'ของที่ต้องใช้/ดูแลพิเศษ', 'เปิดเผยสุขภาพ (ผู้กด)', 'ติดต่อฉุกเฉิน']);
      roomData.rooms.forEach(rm => {
        const isMale = rm.gender === 'ชาย';
        for (let b = 0; b < 2; b++) {
          const p = rm.occupants[b];
          const consentLabel = p ? `${p.healthConsent?.statusLabel || (p.isHealthShared ? 'ยินยอม' : 'ไม่ยินยอม')} (${p.healthConsent?.actorLabel || '-'})` : '-';
          const emer = p && p.emergencyName !== '-' ? `${p.emergencyName} (${p.emergencyPhone})` : '-';
          csv += makeRow([rm.room, isMale ? 'ชาย' : 'หญิง', b + 1, p ? p.name : '(ว่าง)', p ? p.nickname : '-', p ? p.callsign : '-', p ? p.phone : '-', p ? p.stayStatusLabel : '-', p ? p.keyStatusLabel : '-', p ? p.medicalHistory : '-', p ? p.foodAllergy : '-', p ? p.bloodGroup : '-', p?.medicalEquipmentNeeded || '-', p?.specialItemsNeeded || (p?.isSpecialCare ? 'ดูแลพิเศษ' : '-'), consentLabel, emer]);
        }
      });
      filename = '5_ใบตรวจห้อง_โรค_ยา_ของใช้_Staff_JRE2027.csv';
    } else {
      csv = makeRow(['ลำดับ', 'ชื่อ-สกุล', 'ชื่อเล่น', 'นามเรียกขาน', 'สังกัด', 'ประเภทสมาชิก', 'บทบาท & ฝ่าย', 'เพศ', 'อายุ', 'หมู่เลือด', 'เบอร์โทร', 'อีเมล', 'RSVP', 'กลุ่มฝึก', 'ห้องพัก & กุญแจ', 'เสื้อ', 'บัตร ID', 'สถานะการเงิน', 'ยอดเงิน', 'หมายเหตุการเงิน', 'โรค/แพ้', 'ยา/ของใช้', 'เปิดเผยสุขภาพ (ผู้กด)', 'ติดต่อฉุกเฉิน']);
      displayedAdminMasterData.forEach((r, idx) => {
        csv += makeRow([idx + 1, r.name, r.nickname, r.callsign, r.institution, r.memberTypeLabel, r.roleWithDuty, r.gender, r.ageLabel, r.bloodGroup, r.phone, r.email, r.rsvpSummary, r.groupAssigned, r.dormAndKeySummary, r.shirtSummary, r.idCardSummary, r.paymentStatusLabel, r.paymentAmountsLabel, r.paymentNotesLabel, r.medicalSummary, r.suppliesSummary, r.healthConsentSummary, r.emergencyContact]);
      });
      filename = '6_ทะเบียนข้อมูลละเอียดครบทุกมิติ_Admin_JRE2027.csv';
    }

    downloadCsv(csv, filename);
    if (triggerToast) triggerToast('📁 ดาวน์โหลดไฟล์ CSV (UTF-8 BOM) เรียบร้อยแล้ว');
  };

  const docBadgeLabel = {
    attendance: '1. ใบเซ็นชื่อเข้าร่วมอบรม',
    'id-cards': '2. ใบเซ็นชื่อรับบัตรประจำตัว ID Card',
    shirts: '3. ใบเซ็นชื่อรับเสื้อ 32 ตัว',
    rooms: '4. ใบเซ็นชื่อเข้าห้องพัก & กุญแจ (ปิดข้อมูลสุขภาพ)',
    'rooms-staff': '5. ใบตรวจห้อง & โรค/ยา/ของใช้ (Staff ไม่ต้องเซ็น)',
    'admin-master': '6. ทะเบียนข้อมูลละเอียดครบทุกมิติ (Admin)'
  }[activeDoc];

  const isInternalAdminDoc = activeDoc === 'rooms-staff' || activeDoc === 'admin-master';

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
                <span>ศูนย์รวมใบรายชื่อและเอกสารลงลายมือชื่อครบชุด (6 เอกสาร)</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                URL: /admin/documents
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>📄 ศูนย์จัดทำเอกสาร JRE 2027 (แยกใบเซ็นชื่อ PDPA 4 ใบ + เอกสารละเอียด Admin/Staff 2 ใบ)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ครบทุกเอกสารทั้ง <strong>ชุดลงลายมือชื่อ (PDPA ปิดข้อมูลสุขภาพ)</strong> และ <strong>ชุดข้อมูลละเอียดสำหรับ Admin / Staff</strong> (ห้องพัก/ไม่พัก/กุญแจ, การเงินครบงวด/ค้าง/หลังงาน, โรค/ยา/ของใช้/ผู้กดยินยอม, ติดต่อฉุกเฉิน) รองรับ Excel (.xlsx), CSV, PDF A4 และ PNG
            </p>
          </div>

          {/* Master 6-in-1 Quick Export Action */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportMasterExcel}
              disabled={isExportingExcel}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>⚡ ดาวน์โหลดครบชุด (Master 6-in-1 Excel)</span>
            </button>
          </div>
        </div>

        {/* GROUP A: 4 SIGNING DOCUMENTS (PDPA-SAFE) */}
        <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-teal-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>หมวด ก. เอกสารลงลายมือชื่อหน้างาน (4 ใบ • ปิดข้อมูลสุขภาพ PDPA)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                <span>1. ใบเซ็นชื่อเข้าร่วมอบรม</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-sm font-black text-white">ลงทะเบียนอบรม ({attendanceData.length} คน)</div>
              <span className="text-[10px] text-teal-300">มีช่องลงลายมือชื่อ + หมายเหตุ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('id-cards')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'id-cards'
                  ? 'bg-indigo-950/80 border-indigo-400 text-white ring-2 ring-indigo-400/30 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>2. ใบเซ็นชื่อรับบัตร ID Card</span>
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-sm font-black text-white">รับบัตรประจำตัว ({idCardData.length} ใบ)</div>
              <span className="text-[10px] text-indigo-300">สถานะรูปบัตร + ลายมือชื่อรับบัตร</span>
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
                <span>3. ใบเซ็นชื่อรับมอบเสื้อ</span>
                <Shirt className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm font-black text-white">เสื้อฝึกปฏิบัติการ ({shirtData.length} ตัว)</div>
              <span className="text-[10px] text-purple-300">TSIKKU / RCPMSU + ช่องเซ็นรับ</span>
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
                <span>4. ใบเซ็นชื่อเข้าห้องพัก</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-sm font-black text-white">เข้าพัก & รับ-คืนกุญแจ (PDPA)</div>
              <span className="text-[10px] text-sky-300">เชื่อมสถานะไม่พักหอ/กุญแจ • ไม่โชว์โรค</span>
            </button>
          </div>

          {/* GROUP B: 2 INTERNAL ADMIN/STAFF DETAILED DOCUMENTS */}
          <div className="flex items-center gap-2 pt-2 text-[11px] font-black uppercase tracking-wider text-rose-300">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>หมวด ข. เอกสารข้อมูลละเอียดสำหรับ Admin / Staff (2 ใบ • ไม่ต้องให้ผู้เข้าร่วมเซ็น)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveDoc('rooms-staff')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'rooms-staff'
                  ? 'bg-rose-950/80 border-rose-400 text-white ring-2 ring-rose-400/30 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>5. ใบตรวจห้อง & โรคประจำตัว / ยา / ของใช้</span>
                <Stethoscope className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-sm font-black text-white">สำหรับ Staff พยาบาล & หอพัก (ชั้น 1 ห้อง 101-110 + มมส)</div>
              <span className="text-[10px] text-rose-300">ระบุห้องพัก/ไม่พัก, กุญแจ, โรค, แพ้, ยา, ของที่ต้องใช้, ผู้ติดต่อฉุกเฉิน, ความยินยอม</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('admin-master')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeDoc === 'admin-master'
                  ? 'bg-amber-950/80 border-amber-400 text-white ring-2 ring-amber-400/30 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>6. ทะเบียนข้อมูลละเอียดครบทุกมิติ (Admin Master)</span>
                <ClipboardList className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-black text-white">สรุปครบทั้ง {adminMasterData.length} คน ในใบเดียว</div>
              <span className="text-[10px] text-amber-300">RSVP • ห้องพัก/กุญแจ • เสื้อ/บัตร • การเงินครบ/ค้าง/หลังงาน • สุขภาพ & ผู้กดยินยอม</span>
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
              {staffOnlyAlerts ? '✓ แสดงเฉพาะห้องที่ต้องเตรียมยา/เฝ้าระวัง' : 'แสดงทุกห้อง (10 ห้อง)'}
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

          <button
            type="button"
            onClick={handlePrintDocument}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>พิมพ์ / PDF (หน้ากระดาษ A4)</span>
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

      {/* DOCUMENT PREVIEW CONTAINER (PRINTABLE SHEET) */}
      <div className="overflow-x-auto pb-4">
        <div 
          id="printable-document-sheet"
          className={`mx-auto bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-300 ${
            activeDoc === 'admin-master' ? 'min-w-[1240px] max-w-[1440px]' : 'min-w-[980px] max-w-[1180px]'
          } text-xs font-sans print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none`}
        >
          {/* OFFICIAL HEADER SECTION */}
          <div className="text-center pb-5 border-b-2 border-slate-900 mb-6 space-y-1">
            <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] mb-1 uppercase tracking-wider border border-slate-300">
              {isInternalAdminDoc
                ? 'Joint Response Exercise (JRE 2027) • Admin & Staff Internal Detailed Report'
                : 'Joint Response Exercise (JRE 2027) • Official PDPA-Safe Signing Document'}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {activeDoc === 'attendance' && 'บัญชีลงเวลาและลงลายมือชื่อเข้าร่วมการฝึกอบรม'}
              {activeDoc === 'id-cards' && 'บัญชีลงลายมือชื่อรับบัตรประจำตัวผู้เข้าร่วม / Staff (ID Card)'}
              {activeDoc === 'shirts' && 'บัญชีลงลายมือชื่อรับมอบเสื้อฝึกปฏิบัติการ JRE 2027'}
              {activeDoc === 'rooms' && 'บัญชีลงลายมือชื่อเข้าห้องพักและรับ-คืนกุญแจ หอพักกุดรัง (ฉบับปิดข้อมูลสุขภาพ)'}
              {activeDoc === 'rooms-staff' && 'ใบตรวจสอบห้องพัก โรคประจำตัว ยาที่ต้องการ และของที่ต้องใช้ (สำหรับ Staff)'}
              {activeDoc === 'admin-master' && 'ทะเบียนข้อมูลผู้ลงทะเบียนละเอียดครบทุกมิติ (สำหรับ Admin / คณะกรรมการ)'}
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
                {activeDoc === 'attendance' && `ยอดรวม ${attendanceData.length} คน`}
                {activeDoc === 'id-cards' && `บัตรทั้งหมด ${idCardData.length} ใบ (คุ้มครองข้อมูลสุขภาพ PDPA)`}
                {activeDoc === 'shirts' && `ยอดผลิตรวม ${shirtData.length} ตัว`}
                {activeDoc === 'rooms' && 'ชั้น 1 ห้อง 101 - 110 • คุ้มครองข้อมูลสุขภาพ (PDPA)'}
                {activeDoc === 'rooms-staff' && 'ไม่ต้องลงลายมือชื่อ • สำหรับฝ่ายพยาบาล/สวัสดิการเตรียมความพร้อม'}
                {activeDoc === 'admin-master' && `แสดงผล ${displayedAdminMasterData.length} / ${adminMasterData.length} ท่าน (ข้อมูลภายใน Admin)`}
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
                    <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-20 whitespace-nowrap">ชื่อเล่น</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-28 whitespace-nowrap">นามเรียกขาน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-16 whitespace-nowrap">สถาบัน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-36">ประเภท / บทบาท</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-24 whitespace-nowrap">เบอร์โทร</th>
                    <th className="py-2.5 px-4 border-r border-slate-900 w-36">ลายมือชื่อผู้เข้าร่วม</th>
                    <th className="py-2.5 px-2 w-28">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {attendanceData.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950 whitespace-nowrap">{p.name}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center whitespace-nowrap">{p.nickname}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-semibold whitespace-nowrap">{p.callsign}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-bold whitespace-nowrap">{p.institution}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[11px]">{p.role}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono whitespace-nowrap">{p.phone}</td>
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

          {/* TABLE CONTENT 2: ID CARD SIGN-IN ROSTER (PDPA-SAFE) */}
          {activeDoc === 'id-cards' && (
            <div className="space-y-4">
              <div className="p-2.5 bg-indigo-50 border border-indigo-300 rounded-lg text-[11px] text-indigo-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>🪪 ใบเซ็นชื่อรับบัตรประจำตัวผู้เข้าร่วม / Staff (PDPA-Safe: ไม่แสดงข้อมูลสุขภาพ)</span>
                <span className="font-mono font-bold">
                  พร้อมจ่าย {idCardData.filter(d => d.hasPhoto).length}/{idCardData.length} • รับบัตรแล้ว {idCardData.filter(d => d.isReceived).length} ใบ
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-indigo-900 text-white font-bold border-b border-slate-900 text-center">
                    <th className="py-2.5 px-2 border-r border-indigo-700 w-10">ลำดับ</th>
                    <th className="py-2.5 px-3 border-r border-indigo-700 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-2 border-r border-indigo-700 w-20 whitespace-nowrap">ชื่อเล่น</th>
                    <th className="py-2.5 px-2 border-r border-indigo-700 w-28 whitespace-nowrap">นามเรียกขาน</th>
                    <th className="py-2.5 px-2 border-r border-indigo-700 w-14 whitespace-nowrap">สังกัด</th>
                    <th className="py-2.5 px-2 border-r border-indigo-700 w-36">ประเภทบัตร / บทบาท</th>
                    <th className="py-2.5 px-2 border-r border-indigo-700 w-32">สถานะบัตร</th>
                    <th className="py-2.5 px-4 border-r border-indigo-700 w-36">ลายมือชื่อผู้รับบัตร</th>
                    <th className="py-2.5 px-2 w-20">วันที่รับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {idCardData.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 1 ? 'bg-indigo-50/40' : 'bg-white'}>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-950 whitespace-nowrap">{c.name}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center whitespace-nowrap">{c.nickname}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-mono font-semibold whitespace-nowrap">{c.callsign}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center font-bold whitespace-nowrap">{c.institution}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[11px]">{c.role}</td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center text-[10px] font-semibold">
                        <span className={c.isReceived ? 'text-emerald-700 font-bold' : (c.hasPhoto ? 'text-indigo-800' : 'text-amber-700')}>
                          {c.idCardStatus}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-r border-slate-400 text-center">
                        <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px]">{c.idCardReceivedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE CONTENT 3: SHIRT DISTRIBUTION ROSTER (32 PRODUCTION SHIRTS) */}
          {activeDoc === 'shirts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                <span>🏛️ มข (อกขวา TSIKKU): 19 ตัว (S:3, M:4, L:4, XL:2, 2XL:2, 4XL:3, 5XL:1)</span>
                <span>🏛️ มมส (อกขวา RCPMSU): 13 ตัว (S:2, M:1, L:1, XL:6, 2XL:1, 4XL:1, 6XL:1)</span>
                <span className="font-black text-slate-950">
                  รวมผลิต: {shirtData.length} ตัว • รับแล้ว {shirtData.filter(s => s.isShirtReceived).length}/{shirtData.length}
                </span>
              </div>

              <div className="p-2.5 bg-purple-50 border border-purple-300 rounded-lg text-[11px] text-purple-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>มี QR Code สแกนรับเสื้อท้ายรายชื่อทุกท่าน — ใช้ปุ่ม &quot;📷 สแกน QR อเนกประสงค์&quot; ด้านบนเพื่อสแกนจากกระดาษหรือหน้าจอ และกดบันทึกรับเสื้อแล้วได้ทันที</span>
                </span>
                <span className="font-mono text-[10px] text-purple-800">พร้อมสแกน (JPEG/Print/PNG/Excel)</span>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 text-center">
                    <th className="py-2.5 px-2 border-r border-slate-900 w-10">ลำดับ</th>
                    <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล ผู้รับมอบ</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-24 whitespace-nowrap">นามเรียกขาน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-14 whitespace-nowrap">สังกัด</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-20 whitespace-nowrap">อกขวา</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-16 whitespace-nowrap">ไซส์เสื้อ</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-12">จำนวน</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-32">สถานะค่าเสื้อ / รับมอบ</th>
                    <th className="py-2.5 px-2 border-r border-slate-900 w-20 whitespace-nowrap bg-purple-100">QR รับเสื้อ</th>
                    <th className="py-2.5 px-3 border-r border-slate-900 w-32">ลายมือชื่อผู้รับมอบ</th>
                    <th className="py-2.5 px-2 w-20 whitespace-nowrap">วันที่รับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {shirtData.map((s, idx) => (
                    <tr key={s.id} className={s.isShirtReceived ? 'bg-emerald-50/40' : (idx % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-1.5 px-3 border-r border-slate-400 font-bold text-slate-950 whitespace-nowrap">{s.name}</td>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono font-semibold whitespace-nowrap">{s.callsign}</td>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold whitespace-nowrap">{s.uni}</td>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono font-black whitespace-nowrap">{s.chest}</td>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono font-black text-sm bg-purple-50 whitespace-nowrap">{s.size}</td>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-center font-mono">1</td>
                      <td className="py-1.5 px-2 border-r border-slate-400 text-[10px] text-center">
                        <div>{s.payment}</div>
                        <div className={`mt-0.5 font-bold ${s.isShirtReceived ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {s.isShirtReceived ? '✓ รับเสื้อแล้ว' : '⏳ รอรับเสื้อ'}
                        </div>
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-400 text-center bg-purple-50/30">
                        {shirtQrMap[s.id] ? (
                          <div className="flex flex-col items-center justify-center">
                            <img
                              src={shirtQrMap[s.id]}
                              alt={`QR ${s.name}`}
                              className="w-12 h-12 block bg-white p-0.5 rounded border border-slate-300"
                            />
                            <span className="text-[8px] font-mono text-slate-600 mt-0.5 leading-none">สแกนรับ</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400">กำลังสร้าง QR...</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-400 text-center">
                        <span className="block border-b border-dashed border-slate-400 h-5 w-full"></span>
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-[11px] whitespace-nowrap">13 ก.พ. 70</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 text-[11px] text-slate-600">
                * บุคลากร/Staff มมส ที่ถือบัตร Staff อย่างเดียว (0 บาท ไม่รับเสื้อ เช่น นายณัฐพล เชื้อคนแข็ง) จะไม่ปรากฏในยอดผลิตข้างต้น
              </div>
            </div>
          )}

          {/* TABLE CONTENT 3: DORMITORY SIGN-IN ROSTER (PDPA-SAFE: NO HEALTH INFO) */}
          {activeDoc === 'rooms' && (
            <div className="space-y-6">
              <div className="p-2.5 bg-sky-50 border border-sky-300 rounded-lg text-[11px] text-sky-900 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>🔒 ใบเซ็นชื่อเข้าห้องพักฉบับนี้ปิดข้อมูลสุขภาพ/โรคประจำตัวทั้งหมด เพื่อคุ้มครองข้อมูลส่วนบุคคล (PDPA) ณ จุดลงทะเบียน</span>
                <span className="font-mono font-bold">เรียงลำดับตามห้อง 101 - 110</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-800 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>
                  🛏️ สถานะห้องพักจริง: เข้าพักหอ <strong>{roomData.totalStaying}</strong> คน •
                  ไม่ประสงค์พักหอ <strong className="text-amber-800">{roomData.totalOptedOut}</strong> คน •
                  จ่ายกุญแจแล้ว <strong>{roomData.totalKeysIssued}</strong> ดอก •
                  คืนกุญแจแล้ว <strong>{roomData.totalKeysReturned}/{roomData.totalKeysIssued}</strong> ดอก
                </span>
                <span className="font-mono text-sky-900">เชื่อมต่อข้อมูลห้องพักอัตโนมัติ</span>
              </div>

              <DormSignInZoneTable
                title={`🚪 1. ห้องพักชาย (${roomData.maleRooms.length} ห้อง — หอพักกุดรัง ${roomData.activeFloorSummary || 'ชั้น 1'})`}
                subtitle="ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น"
                rooms={roomData.maleRooms}
                altBgClass="bg-blue-50/40"
                zoneLabel="ชาย"
              />

              <div className="pt-2">
                <DormSignInZoneTable
                  title={`🚪 2. ห้องพักหญิง (${roomData.femaleRooms.length} ห้อง — หอพักกุดรัง ${roomData.activeFloorSummary || 'ชั้น 1'})`}
                  subtitle="ห้องละ 2 คน • เตียงเดี่ยวคู่ ❄️ แอร์ 🚿 น้ำอุ่น"
                  rooms={roomData.femaleRooms}
                  altBgClass="bg-pink-50/40"
                  zoneLabel="หญิง"
                />
              </div>

              {roomData.optedOutPeople.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-[11px] text-amber-950">
                  <span className="font-bold">🚫 รายชื่อผู้แจ้งไม่ประสงค์เข้าพักหอพักที่มหาลัยจัดเตรียมให้ ({roomData.optedOutPeople.length} ท่าน):</span>{' '}
                  {roomData.optedOutPeople.map(o => `${o.name}${o.roomNumber ? ` (เดิมห้อง ${o.roomNumber})` : ''}`).join(', ')}
                </div>
              )}

              <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-[11px] text-slate-700">
                <span className="font-bold">🏠 นิสิต / คณะกรรมการ มมส ({roomData.msuList.length} ท่าน) — ไม่พักหอพัก (ไป-กลับเอง):</span>{' '}
                {roomData.msuList.map(m => m.name).join(', ')}
              </div>
            </div>
          )}

          {/* TABLE CONTENT 4: STAFF MEDICAL & SUPPLIES ROOM CHECKLIST (NO SIGNATURE COLUMN) */}
          {activeDoc === 'rooms-staff' && (
            <div className="space-y-6">
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-[11px] text-rose-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>
                  🩺 เอกสาร Staff (ไม่ต้องเซ็น): แสดงห้องพัก, สถานะเข้าพัก/ไม่พัก, กุญแจ, โรค/แพ้, ยา, ของที่ต้องใช้, ผู้ติดต่อฉุกเฉิน และความยินยอมเปิดเผยสุขภาพ ({roomData.totalStaying} พักหอ / {roomData.totalOptedOut} ไม่พักหอ • กุญแจจ่าย {roomData.totalKeysIssued} / คืน {roomData.totalKeysReturned})
                </span>
                <span className="font-mono font-bold">เฉพาะ Staff</span>
              </div>

              <StaffMedicalZoneTable
                title={`🚪 1. โซนห้องพักชาย (${displayedStaffMaleRooms.length} ห้อง)`}
                rooms={displayedStaffMaleRooms}
                zoneLabel="ชาย"
              />

              <StaffMedicalZoneTable
                title={`🚪 2. โซนห้องพักหญิง (${displayedStaffFemaleRooms.length} ห้อง)`}
                rooms={displayedStaffFemaleRooms}
                zoneLabel="หญิง"
              />

              {roomData.msuNeedsCare.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-black text-slate-950 mb-2">
                    🏠 3. ข้อมูลโรคประจำตัว / ยา / ของที่ต้องใช้ ของผู้เข้าร่วม มมส (ไป-กลับ ไม่พักหอ — {roomData.msuNeedsCare.length} ท่าน)
                  </h3>
                  <table className="w-full text-left text-xs border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-amber-900 text-white font-bold border-b border-slate-900 text-center">
                        <th className="py-2 px-2 border-r border-amber-700 w-24">ประเภท</th>
                        <th className="py-2 px-2.5 border-r border-amber-700 text-left min-w-[205px] whitespace-nowrap">ชื่อ - นามสกุล / ติดต่อ</th>
                        <th className="py-2 px-2.5 border-r border-amber-700 text-left">โรคประจำตัว / อาการแพ้ / หมู่เลือด</th>
                        <th className="py-2 px-2.5 border-r border-amber-700 text-left">ยาที่ต้องการ / เวชภัณฑ์</th>
                        <th className="py-2 px-2.5 border-r border-amber-700 text-left">ของที่ต้องใช้ / ดูแลพิเศษ</th>
                        <th className="py-2 px-2 w-28">เช็คเตรียม (Staff)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {roomData.msuNeedsCare.map((p, idx) => (
                        <tr key={p.id || idx} className="bg-amber-50/50">
                          <td className="py-2 px-2 border-r border-slate-400 text-center font-bold text-amber-900">ไป-กลับ มมส</td>
                          <td className="py-2 px-2.5 border-r border-slate-400">
                            <div className="font-bold text-slate-950 whitespace-nowrap">{p.name}</div>
                            <div className="text-[10px] text-slate-600 font-mono">{p.callsign} • โทร: {p.phone}</div>
                            {p.emergencyName && p.emergencyName !== '-' && (
                              <div className="text-[9.5px] text-rose-800 font-semibold">
                                🚨 ฉุกเฉิน: {p.emergencyName} ({p.emergencyPhone})
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-400 text-[11px]">
                            {p.hasMedicalHistory && <div className="font-bold text-rose-800">🩺 โรค: {p.medicalHistory}</div>}
                            {p.hasFoodAllergy && <div className="font-bold text-amber-800">⚠️ แพ้: {p.foodAllergy}</div>}
                            {!p.hasMedicalHistory && !p.hasFoodAllergy && <span className="text-emerald-700">✓ ปกติ</span>}
                            <div className="text-[9.5px] text-slate-600 mt-0.5">
                              {p.healthConsent?.fullLabel || (p.isHealthShared ? 'ยินยอมเปิดเผย' : 'ไม่ยินยอมเปิดเผย')}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-400 text-[11px] font-semibold text-emerald-900">
                            {p.medicalEquipmentNeeded || '-'}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-400 text-[11px] font-semibold text-indigo-900">
                            {p.specialItemsNeeded || (p.isSpecialCare ? 'ต้องดูแลเป็นพิเศษ' : '-')}
                          </td>
                          <td className="py-2 px-2 text-center text-[11px]">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                              <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-sm"></span>
                              <span>เตรียมแล้ว</span>
                            </span>
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
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-950 font-semibold flex flex-wrap items-center justify-between gap-2">
                <span>
                  📋 ทะเบียนข้อมูลละเอียดครบทุกมิติสำหรับ Admin ({displayedAdminMasterData.length}/{adminMasterData.length} ท่าน) — แสดงข้อมูลการเงิน ห้องพัก/ไม่พัก/กุญแจ เสื้อ บัตร ID โรคประจำตัว ยา ของใช้ ผู้กดยินยอมสุขภาพ และติดต่อฉุกเฉิน
                </span>
                <span className="font-mono font-bold text-rose-800">เอกสารลับเฉพาะ Admin/คณะกรรมการ</span>
              </div>

              <table className="w-full text-left text-[11px] border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900 text-center">
                    <th className="py-2 px-1.5 border-r border-slate-700 w-8">ที่</th>
                    <th className="py-2 px-2 border-r border-slate-700 text-left min-w-[215px] whitespace-nowrap">ชื่อ-สกุล / นามเรียกขาน</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-24">สังกัด / บทบาท</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-24">RSVP / กลุ่ม</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-32">ห้องพัก & กุญแจ</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-24">เสื้อ & บัตร ID</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-44 text-left">การเงิน & หมายเหตุ</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-44 text-left">โรค/แพ้/ยา/ของใช้</th>
                    <th className="py-2 px-2 border-r border-slate-700 w-32">เปิดเผยสุขภาพ</th>
                    <th className="py-2 px-2 text-left w-36">ติดต่อฉุกเฉิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {displayedAdminMasterData.map((r, idx) => (
                    <tr key={r.id} className={r.hasHealthAlert ? 'bg-rose-50/70' : (idx % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                      <td className="py-2 px-1.5 border-r border-slate-400 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-2 border-r border-slate-400">
                        <div className="font-bold text-slate-950 whitespace-nowrap">{r.name}</div>
                        <div className="text-[10px] text-slate-600 font-mono">
                          ({r.nickname}) • {r.callsign}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-mono">
                          {r.gender} • {r.ageLabel} • เลือด {r.bloodGroup} • {r.phone}
                        </div>
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center">
                        <div className="font-bold text-slate-900">{r.institution}</div>
                        <div className="text-[9.5px] text-slate-600">{r.memberTypeLabel}</div>
                        <div className="text-[9.5px] text-indigo-800 font-semibold">{r.roleWithDuty}</div>
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center">
                        <div className="font-semibold text-slate-800 text-[10px]">{r.rsvpSummary}</div>
                        <div className="text-[9.5px] text-slate-600 font-mono mt-0.5">{r.groupAssigned}</div>
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[10px]">
                        <div className="font-semibold text-slate-800">{r.dormAndKeySummary}</div>
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center text-[10px]">
                        <div className="font-semibold text-purple-900">👕 {r.shirtSummary}</div>
                        <div className="text-indigo-900 mt-0.5">🪪 {r.idCardSummary}</div>
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[10px]">
                        <div className="font-bold text-slate-900">{r.paymentStatusLabel}</div>
                        <div className="text-[9.5px] text-slate-700 font-mono">{r.paymentAmountsLabel}</div>
                        {r.paymentNotesLabel !== '-' && (
                          <div className="text-[9.5px] text-amber-800 font-semibold">{r.paymentNotesLabel}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-[10px]">
                        <div className={r.hasHealthAlert ? 'font-bold text-rose-800' : 'text-emerald-700'}>
                          {r.medicalSummary}
                        </div>
                        {r.suppliesSummary !== '-' && (
                          <div className="text-[9.5px] text-indigo-900 font-semibold mt-0.5">
                            📦 {r.suppliesSummary}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-400 text-center text-[9.5px] font-semibold text-slate-700">
                        {r.healthConsentSummary}
                      </td>
                      <td className="py-2 px-2 text-[10px] text-rose-900 font-semibold">
                        {r.emergencyContact}
                      </td>
                    </tr>
                  ))}
                  {displayedAdminMasterData.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        ไม่พบข้อมูลที่ตรงกับตัวกรอง
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* OFFICIAL SIGNATURE FOOTER (For signing documents only; Staff/Admin internal docs show prep note) */}
          {isInternalAdminDoc ? (
            <div className="pt-6 mt-6 border-t border-slate-400 flex items-center justify-between text-[11px] text-slate-600">
              <span>* เอกสารข้อมูลภายในสำหรับ Admin / Staff เท่านั้น (ไม่ต้องลงลายมือชื่อผู้เข้าอบรม) • ข้อมูลเชื่อมตรงกับฐานข้อมูลระบบแบบ Real-time</span>
              <span className="font-mono font-bold text-slate-800">ผู้ตรวจสอบ (Admin/Staff): ................................................</span>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
