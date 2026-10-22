import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Shirt, 
  CheckCircle2, 
  Clock, 
  Sliders,
  Check,
  Building,
  QrCode,
  Camera,
  Copy,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import ModalPortal from './ModalPortal';
import {
  DEFAULT_MERCHANDISE_CONFIG,
  OFFICIAL_NETWORK_INSTITUTIONS,
  resolveUniversityInfo,
  resolveGender,
  isStaffRegistration,
  resolvePersonFullNameWithTitle
} from '../data/defaultData';

export default function ShirtOrderPrintModal({
  isOpen,
  onClose,
  sizeStats,
  universitySummary = null,
  sizeMeasurements = {},
  allItems = [],
  filteredItems = [],
  currentFilterLabel = 'ทั้งหมด',
  merchandiseConfig = null,
  onOpenScanner = null,
  onTogglePickupStatus = null
}) {
  const [pageOrientation, setPageOrientation] = useState('landscape'); // 'landscape' (default for 12-col table) or 'portrait'
  const [printScope, setPrintScope] = useState('filtered'); // 'all' or 'filtered'
  const [groupByInstitution, setGroupByInstitution] = useState(true);
  const [includeRoomCol, setIncludeRoomCol] = useState(true);
  const [includeSummaryTable, setIncludeSummaryTable] = useState(true);
  const [includeUniversityTable, setIncludeUniversityTable] = useState(true);
  const [includeQrCol, setIncludeQrCol] = useState(true);
  const [includeSignatureCol, setIncludeSignatureCol] = useState(true);
  const [includeFinancialSummary, setIncludeFinancialSummary] = useState(true);
  const [qrMap, setQrMap] = useState({});
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Add body class so @media print hides #root completely and avoids blank leading pages
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    document.body.classList.add('shirt-print-modal-active');
    return () => {
      document.body.classList.remove('shirt-print-modal-active');
    };
  }, [isOpen]);

  const targetItems = useMemo(() => {
    return printScope === 'all' ? allItems : filteredItems;
  }, [printScope, allItems, filteredItems]);

  const isFilteredScope = printScope === 'filtered';

  // Sort helper: Male ('ชาย') first -> Female ('หญิง') -> Unspecified, then Participant -> Staff, then Room -> Name
  const sortItemsMaleToFemale = (list) => {
    const rankGender = (g) => (g === 'ชาย' ? 1 : g === 'หญิง' ? 2 : 3);
    return [...list].sort((a, b) => {
      const gA = a.gender || resolveGender(a.rawRegistration || a);
      const gB = b.gender || resolveGender(b.rawRegistration || b);
      if (rankGender(gA) !== rankGender(gB)) {
        return rankGender(gA) - rankGender(gB);
      }
      const sA = Boolean(a.is_staff !== undefined ? a.is_staff : isStaffRegistration(a.rawRegistration || a));
      const sB = Boolean(b.is_staff !== undefined ? b.is_staff : isStaffRegistration(b.rawRegistration || b));
      if (sA !== sB) return sA ? 1 : -1;
      const rA = (a.room_assigned && a.room_assigned !== '-') ? a.room_assigned : (a.rawRegistration?.room_assigned && a.rawRegistration?.room_assigned !== '-' ? a.rawRegistration.room_assigned : '');
      const rB = (b.room_assigned && b.room_assigned !== '-') ? b.room_assigned : (b.rawRegistration?.room_assigned && b.rawRegistration?.room_assigned !== '-' ? b.rawRegistration.room_assigned : '');
      if (rA !== rB) {
        if (rA && !rB) return -1;
        if (!rA && rB) return 1;
        return String(rA).localeCompare(String(rB), 'th', { numeric: true });
      }
      const nameA = resolvePersonFullNameWithTitle(a).fullName;
      const nameB = resolvePersonFullNameWithTitle(b).fullName;
      return nameA.localeCompare(nameB, 'th');
    });
  };

  // Generate per-person QR codes for scanning shirt handover
  useEffect(() => {
    if (!isOpen || !includeQrCol || targetItems.length === 0) return;
    let isCancelled = false;

    const generateAllQrs = async () => {
      const nextMap = {};
      for (const item of targetItems) {
        const key = item.id || item.order_number || item.user_id;
        if (!key) continue;
        const qrPayload = item.order_number || `JRE27-SHIRT-${String(item.user_id || item.id || '').slice(0, 8).toUpperCase()}`;
        try {
          const dataUrl = await QRCode.toDataURL(qrPayload, {
            width: 112,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          nextMap[key] = { dataUrl, payload: qrPayload };
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }
      if (!isCancelled) {
        setQrMap(nextMap);
      }
    };

    generateAllQrs();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, includeQrCol, targetItems]);

  // Group items by Institution / University with 1, 2, 3, 4... numbering inside each institution
  const institutionGroups = useMemo(() => {
    const groupsByTag = {};
    const officialOrder = OFFICIAL_NETWORK_INSTITUTIONS.map(inst => inst.shortTag);

    targetItems.forEach((item) => {
      const uniInfo = resolveUniversityInfo(item.rawRegistration || item);
      const shortTag = item.uni_short || uniInfo.shortTag || 'อื่นๆ';
      const fullName = item.uni_name || uniInfo.university || item.institution || shortTag;
      const clubName = item.uni_club || uniInfo.club || '';

      if (!groupsByTag[shortTag]) {
        groupsByTag[shortTag] = {
          shortTag,
          fullName,
          clubName,
          items: [],
          maleCount: 0,
          femaleCount: 0,
          staffCount: 0,
          receivedCount: 0,
          pendingCount: 0
        };
      }

      const grp = groupsByTag[shortTag];
      grp.items.push(item);

      const genderLabel = item.gender || resolveGender(item.rawRegistration || item);
      if (genderLabel === 'ชาย') grp.maleCount += 1;
      else if (genderLabel === 'หญิง') grp.femaleCount += 1;

      const isStaff = item.is_staff !== undefined ? item.is_staff : isStaffRegistration(item.rawRegistration || item);
      if (isStaff) grp.staffCount += 1;

      if (item.pickup_status === 'received') grp.receivedCount += 1;
      else grp.pendingCount += 1;
    });

    // Sort groups by official institution order first, then any remaining
    const allTags = Object.keys(groupsByTag);
    const sortedTags = [
      ...officialOrder.filter(tag => groupsByTag[tag]),
      ...allTags.filter(tag => !officialOrder.includes(tag))
    ];

    return sortedTags.map((tag, groupIdx) => ({
      ...groupsByTag[tag],
      items: sortItemsMaleToFemale(groupsByTag[tag].items),
      institutionIndex: groupIdx + 1
    }));
  }, [targetItems]);

  const sortedFlatItems = useMemo(() => {
    return sortItemsMaleToFemale(targetItems);
  }, [targetItems]);

  if (!isOpen) return null;

  const handleTriggerPrint = () => {
    window.print();
  };

  const dedicatedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/admin/shirt-roster`
    : '/admin/shirt-roster';

  const handleCopyDedicatedUrl = async () => {
    try {
      await navigator.clipboard.writeText(dedicatedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {}
  };

  const currentDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const currentTimeStr = new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const reportDocNumber = `JRE2027-SHIRT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  const targetReceivedCount = targetItems.filter(it => it.pickup_status === 'received').length;
  const targetPendingCount = targetItems.length - targetReceivedCount;

  const renderRosterTable = (itemsList, showUniCol = false) => {
    const totalCols = 8 + (showUniCol ? 1 : 0) + (includeRoomCol ? 1 : 0) + (includeQrCol ? 1 : 0) + (includeSignatureCol ? 1 : 0);

    return (
      <table className="w-full border-collapse border border-slate-400 text-[10px] table-auto">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
            <th className="border border-slate-300 py-1.5 px-1 text-center w-7">ลำดับ</th>
            {showUniCol && (
              <th className="border border-slate-300 py-1.5 px-1.5 text-left w-14">สถาบัน</th>
            )}
            <th className="border border-slate-300 py-1.5 px-2 text-left min-w-[175px]">คำนำหน้า ชื่อ - นามสกุล (ชื่อเล่น)</th>
            <th className="border border-slate-300 py-1.5 px-1 text-center w-10">เพศ</th>
            {includeRoomCol && (
              <th className="border border-slate-300 py-1.5 px-1.5 text-center w-20 bg-amber-50/70">
                ห้องพัก / กลุ่มฝึก
              </th>
            )}
            <th className="border border-slate-300 py-1.5 px-1 text-center w-16">ประเภท</th>
            <th className="border border-slate-300 py-1.5 px-1.5 text-center w-20 font-mono">เบอร์โทรศัพท์</th>
            <th className="border border-slate-300 py-1.5 px-1.5 text-center w-16">ไซส์เสื้อ</th>
            <th className="border border-slate-300 py-1.5 px-1 text-center w-16">การชำระ</th>
            {includeQrCol && (
              <th className="border border-slate-300 py-1.5 px-1 text-center w-16 bg-indigo-50/60">
                QR สแกนรับเสื้อ
              </th>
            )}
            <th className="border border-slate-300 py-1.5 px-1 text-center w-18">
              สถานะรับเสื้อ
            </th>
            {includeSignatureCol && (
              <th className="border border-slate-300 py-1.5 px-2 text-center w-24 bg-slate-50">
                ลายมือชื่อผู้รับเสื้อ
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {itemsList.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="py-6 text-center text-slate-500">
                ไม่พบรายการข้อมูลเสื้อตามเงื่อนไขที่เลือก
              </td>
            </tr>
          ) : (
            itemsList.map((item, idx) => {
              const nameData = resolvePersonFullNameWithTitle(item);
              const isReceived = item.pickup_status === 'received';
              const isPaid = item.payment_status === 'paid_verified';
              const uniShort = item.uni_short || resolveUniversityInfo(item.rawRegistration || item).shortTag;
              const genderLabel = item.gender || resolveGender(item.rawRegistration || item);
              const isStaff = item.is_staff !== undefined ? item.is_staff : isStaffRegistration(item.rawRegistration || item);
              const customNote = item.custom_shirt_note || item.rawRegistration?.custom_shirt_note || '';
              const rawRoom = (item.room_assigned && item.room_assigned !== '-')
                ? item.room_assigned
                : (item.rawRegistration?.room_assigned && item.rawRegistration?.room_assigned !== '-' ? item.rawRegistration.room_assigned : '');
              const rawGroup = (item.group_assigned && item.group_assigned !== '-')
                ? item.group_assigned
                : (item.rawRegistration?.group_assigned && item.rawRegistration?.group_assigned !== '-' ? item.rawRegistration.group_assigned : '');
              const itemKey = item.id || item.order_number || item.user_id || idx;
              const qrEntry = qrMap[itemKey];
              const qrCodeText = item.order_number || `JRE27-SHIRT-${String(item.user_id || item.id || '').slice(0, 8).toUpperCase()}`;

              return (
                <tr
                  key={itemKey}
                  className={`hover:bg-slate-50 print-avoid-break ${isReceived ? 'bg-emerald-50/30' : ''}`}
                >
                  {/* Sequential index */}
                  <td className="border border-slate-300 py-1.5 px-1 text-center font-mono font-black text-slate-900">
                    {idx + 1}
                  </td>

                  {showUniCol && (
                    <td className="border border-slate-300 py-1.5 px-1.5 font-bold text-slate-900">
                      {uniShort}
                    </td>
                  )}

                  {/* Full Name & Nickname & Callsign - Clean single-line name with title */}
                  <td className="border border-slate-300 py-1.5 px-2 text-slate-900 min-w-[175px]">
                    <div className="font-bold text-xs sm:text-[11px] text-slate-950 whitespace-nowrap leading-tight">
                      {nameData.fullName}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {item.nickname && item.nickname !== '-' && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[8.5px] font-semibold border border-slate-200">
                          ({item.nickname})
                        </span>
                      )}
                      {item.callsign && item.callsign !== '-' && (
                        <span className="text-[8.5px] text-slate-500 font-mono">
                          รหัส: {item.callsign}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Gender (Sorted Male -> Female) */}
                  <td className="border border-slate-300 py-1.5 px-1 text-center font-bold">
                    {genderLabel === 'ชาย' ? (
                      <span className="text-sky-800">ชาย</span>
                    ) : genderLabel === 'หญิง' ? (
                      <span className="text-pink-800">หญิง</span>
                    ) : (
                      <span className="text-slate-600">{genderLabel || '-'}</span>
                    )}
                  </td>

                  {/* Room & Group Assigned */}
                  {includeRoomCol && (
                    <td className="border border-slate-300 py-1.5 px-1.5 text-center bg-amber-50/30">
                      {rawRoom ? (
                        <span className="font-black font-mono text-[10.5px] text-slate-950 block leading-tight">
                          {rawRoom.startsWith('ห้อง') ? rawRoom : `ห้อง ${rawRoom}`}
                        </span>
                      ) : uniShort === 'มมส' ? (
                        <span className="text-[9px] text-slate-500 block leading-tight font-medium">
                          มมส (ไม่พักหอ)
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 block leading-tight">
                          รอจัดห้อง
                        </span>
                      )}
                      {rawGroup && (
                        <span className="text-[8.5px] text-indigo-800 font-bold block leading-tight mt-0.5">
                          กลุ่ม: {rawGroup}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Role / Type */}
                  <td className="border border-slate-300 py-1.5 px-1 text-center text-[9px] font-bold">
                    {isStaff ? (
                      <span className="px-1 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 inline-block">
                        Staff (280฿)
                      </span>
                    ) : (
                      <span className="text-slate-800">
                        {item.source === 'registration' ? 'ผู้เข้าอบรม' : 'สั่งซื้อเพิ่ม'}
                      </span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="border border-slate-300 py-1.5 px-1 text-center font-mono text-slate-800">
                    {item.phone || '-'}
                  </td>

                  {/* Shirt Size + Custom Note + Quantity */}
                  <td className="border border-slate-300 py-1.5 px-1.5 text-center bg-slate-50">
                    {(() => {
                      const rawSz = String(item.size || item.normalized_size || '').trim();
                      const qtySuffix = (item.quantity && item.quantity > 1) ? ` (x${item.quantity})` : '';
                      const isOther = !['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(rawSz.toUpperCase());
                      if (isOther) {
                        if (customNote) {
                          return (
                            <>
                              <span className="font-black font-mono text-[10.5px] text-slate-950 block">
                                {customNote}{qtySuffix}
                              </span>
                              <span className="text-[8px] text-slate-600 block leading-tight">
                                (ไซส์ที่ระบุ)
                              </span>
                            </>
                          );
                        }
                        if (rawSz && rawSz !== 'อื่นๆ' && rawSz.toUpperCase() !== 'OTHER') {
                          return (
                            <span className="font-black font-mono text-[10.5px] text-slate-950 block">
                              {rawSz}{qtySuffix}
                            </span>
                          );
                        }
                        return (
                          <span className="font-black font-mono text-[10px] text-rose-700 block">
                            อื่นๆ (รอระบุ){qtySuffix}
                          </span>
                        );
                      }
                      return (
                        <>
                          <span className="font-black font-mono text-xs text-slate-950 block">
                            {rawSz.toUpperCase()}{qtySuffix}
                          </span>
                          {customNote && (
                            <span className="text-[8.5px] text-slate-600 font-semibold block leading-tight mt-0.5">
                              ({customNote})
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </td>

                  {/* Payment Status */}
                  <td className="border border-slate-300 py-1.5 px-1 text-center font-medium">
                    {isPaid ? (
                      <span className="text-emerald-800 font-bold text-[9.5px]">✓ ชำระแล้ว</span>
                    ) : (
                      <span className="text-amber-800 text-[9px]">{item.payment_badge || 'รอตรวจ'}</span>
                    )}
                  </td>

                  {/* Per-Person QR Code for Admin Scan-to-Receive */}
                  {includeQrCol && (
                    <td className="border border-slate-300 py-1 px-1 text-center bg-white">
                      <div className="flex flex-col items-center justify-center">
                        {qrEntry?.dataUrl ? (
                          <img
                            src={qrEntry.dataUrl}
                            alt={`QR ${qrCodeText}`}
                            className="w-12 h-12 object-contain mx-auto"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center border border-slate-200 text-[8px] text-slate-400">
                            QR
                          </div>
                        )}
                        <span className="text-[7.5px] font-mono text-slate-600 leading-none mt-0.5">
                          {qrCodeText}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Pickup Status & Interactive Admin Check-off */}
                  <td className="border border-slate-300 py-1.5 px-1 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {isReceived ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[9px]">
                          ☑ รับเสื้อแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[9px]">
                          ☐ รอรับเสื้อ
                        </span>
                      )}

                      {onTogglePickupStatus && (
                        <button
                          type="button"
                          onClick={() => onTogglePickupStatus(item, !isReceived)}
                          className={`no-print px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                            isReceived
                              ? 'bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 shadow-sm'
                          }`}
                          title={isReceived ? 'คลิกเพื่อยกเลิกสถานะรับเสื้อ' : 'คลิกเพื่อติ๊กว่าผู้สมัครรับเสื้อแล้ว'}
                        >
                          {isReceived ? 'ยกเลิกรับ' : '✓ ติ๊กรับเสื้อ'}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Handwritten Signature Column */}
                  {includeSignatureCol && (
                    <td className="border border-slate-300 py-1.5 px-2 text-center align-bottom bg-slate-50/40">
                      {isReceived ? (
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-emerald-800 font-bold block">
                            ✓ รับเสื้อแล้ว
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono block">
                            {item.pickup_at ? new Date(item.pickup_at).toLocaleDateString('th-TH') : ''}
                          </span>
                          <div className="h-3 border-b border-dotted border-slate-400 mx-1" />
                        </div>
                      ) : (
                        <div className="pt-5 pb-0.5">
                          <div className="border-b border-dotted border-slate-500 mx-1" />
                          <span className="text-[8px] text-slate-400 block mt-0.5">
                            ลงชื่อผู้รับเสื้อ
                          </span>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="print-modal-root fixed inset-0 z-[9999] flex flex-col bg-slate-950/95 backdrop-blur-md overflow-hidden">
        <style>{`
          @page {
            size: ${pageOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: 6mm 6mm 6mm 6mm;
          }
        `}</style>
        
        {/* Top Control Toolbar (Hidden in print) */}
        <header className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rescue-500/20 border border-rescue-500/40 flex items-center justify-center text-rescue-400">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
                <span>พิมพ์ใบเซ็นชื่อรับเสื้อแยกตามสถาบัน & ระบบสแกน QR รายคน</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  A4 Print / Save as PDF
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  URL: /admin/shirt-roster
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                เรียงรายชื่อแยกตามสถาบัน (ชาย ➔ หญิง) พร้อมข้อมูลห้องพัก, QR Code สแกนรับเสื้อ และช่องลงลายมือชื่อครบถ้วน
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyDedicatedUrl}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
              title="คัดลอกลิงก์ URL หน้าเอกสารใบเซ็นชื่อรับเสื้อแยกออกมาโดยเฉพาะ (/admin/shirt-roster)"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? '✓ คัดลอก URL แล้ว' : '🔗 คัดลอก URL เอกสาร'}</span>
            </button>

            <a
              href="/admin/shirt-roster"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-sky-500/30 transition-all cursor-pointer"
              title="เปิดหน้าเอกสารนี้แยกออกมาในแท็บใหม่ (/admin/shirt-roster)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดหน้าแยก (แท็บใหม่)</span>
            </a>

            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                title="เปิดกล้องสแกน QR Code บนใบรายชื่อหรือบัตรผู้สมัครเพื่อติ๊กรับเสื้อทันที"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>📷 สแกน QR ติ๊กรับเสื้อ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              title="เปิดหน้าต่างสั่งพิมพ์ของระบบ / บันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>สั่งพิมพ์ / บันทึกเป็น PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">ปิดหน้าต่าง</span>
            </button>
          </div>
        </header>

        {/* Secondary Options Bar (Hidden in print) */}
        <div className="no-print bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              ตัวเลือกการพิมพ์:
            </span>

            {/* Scope Toggle */}
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setPrintScope('filtered')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  printScope === 'filtered' 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                รายการที่กรองอยู่ ({filteredItems.length} คน)
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  printScope === 'all' 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({allItems.length} คน)
              </button>
            </div>

            {/* Orientation Toggle */}
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800" title="เลือกรูปแบบการจัดพิมพ์ A4">
              <button
                type="button"
                onClick={() => setPageOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  pageOrientation === 'landscape' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="พิมพ์แนวนอน (A4 Landscape) — แนะนำสำหรับตารางรายชื่อ 12 คอลัมน์ ตัวหนังสือชัดเจน ไม่บีบ"
              >
                📄 แนวนอน (แนะนำ)
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  pageOrientation === 'portrait' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="พิมพ์แนวตั้ง (A4 Portrait)"
              >
                📄 แนวตั้ง
              </button>
            </div>

            {/* Grouping Mode Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-amber-200 font-bold select-none">
              <input
                type="checkbox"
                checked={groupByInstitution}
                onChange={e => setGroupByInstitution(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>เรียงแยกตามสถาบัน (ชาย ➔ หญิง)</span>
            </label>

            {/* Toggles */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeRoomCol}
                onChange={e => setIncludeRoomCol(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>แสดงห้องพัก</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeQrCol}
                onChange={e => setIncludeQrCol(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>QR สแกนรายคน</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeSignatureCol}
                onChange={e => setIncludeSignatureCol(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>ช่องเซ็นชื่อผู้รับ</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeSummaryTable}
                onChange={e => setIncludeSummaryTable(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>ตารางสรุปไซส์</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeUniversityTable}
                onChange={e => setIncludeUniversityTable(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>ตารางสรุปมหาลัย</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400 hidden xl:block">
            💡 เคล็ดลับ: ในหน้าต่างสั่งพิมพ์ ให้เลือกเครื่องพิมพ์เป็น <strong>&ldquo;Save as PDF&rdquo;</strong> เพื่อบันทึกเป็นไฟล์ PDF
          </div>
        </div>

        {/* Scrollable Preview Area — Uses block + mx-auto h-fit so white paper background NEVER clips when scrolling */}
        <div className="print-scroll-wrapper flex-1 overflow-y-auto p-4 sm:p-8 block bg-slate-950/80">
          
          {/* Printable Document Container */}
          <div 
            id="printable-shirt-report"
            className={`w-full ${pageOrientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'} mx-auto h-fit bg-white text-slate-900 p-6 sm:p-10 rounded-xl shadow-2xl space-y-6 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none text-xs`}
            style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', 'TH Sarabun New', Tahoma, sans-serif" }}
          >
            
            {/* DOCUMENT HEADER */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-wider">
                      JRE 2027 OFFICIAL ROSTER & QR HANDOVER
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono">
                      เลขที่เอกสาร: {reportDocNumber}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    โครงการฝึกอบรมเชิงปฏิบัติการ Joint Response Exercise 2027 (JRE 2027)
                  </h1>
                  <p className="text-xs text-slate-700 font-semibold">
                    มหาวิทยาลัยมหาสารคาม ร่วมกับ เครือข่ายการแพทย์ฉุกเฉินและหน่วยกู้ชีพกู้ภัย 2027
                  </p>
                  <h2 className="text-sm font-black text-indigo-900 pt-1">
                    บัญชีรายชื่อผู้รับเสื้อฝึกปฏิบัติการเรียงตามสถาบัน (พร้อม QR Code สแกนรับเสื้อ & ช่องลายมือชื่อ)
                  </h2>
                </div>

                <div className="text-right text-[10px] text-slate-600 space-y-0.5 shrink-0">
                  <p><strong>วันที่พิมพ์:</strong> {currentDateStr}</p>
                  <p><strong>เวลา:</strong> {currentTimeStr} น.</p>
                  <p><strong>ผู้จัดทำ:</strong> ฝ่ายพัสดุและทะเบียน JRE 2027</p>
                  <p className="text-emerald-700 font-bold">
                    จุดส่งมอบ: {merchandiseConfig?.pickup?.short_location || DEFAULT_MERCHANDISE_CONFIG.pickup.short_location}
                  </p>
                </div>
              </div>
            </div>

            {/* KEY METRICS SUMMARY STRIP */}
            {includeFinancialSummary && sizeStats && (
              <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-lg p-3 text-center print-avoid-break">
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[10px] text-slate-600 block">จำนวนผู้รับในรายงานนี้</span>
                  <span className="text-lg font-black text-indigo-900 font-mono">
                    {targetItems.length} <span className="text-xs font-normal">คน</span>
                  </span>
                </div>
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[10px] text-slate-600 block">ส่งมอบแล้ว (สแกน/ติ๊กแล้ว)</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {targetReceivedCount} <span className="text-xs font-normal">คน</span>
                  </span>
                </div>
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[10px] text-slate-600 block">คงเหลือรอรับหน้างาน</span>
                  <span className="text-lg font-black text-amber-700 font-mono">
                    {targetPendingCount} <span className="text-xs font-normal">คน</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 block">จำนวนสถาบันที่แสดง</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {institutionGroups.length} <span className="text-xs font-normal">สถาบัน</span>
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 1: SIZE BREAKDOWN SUMMARY TABLE */}
            {includeSummaryTable && sizeStats && (
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>ตารางที่ 1: สรุปยอดผลิตแจกแจงตามขนาดไซส์ (Size Breakdown Summary)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    หน่วยนับ: ตัว
                  </span>
                </div>

                <table className="w-full border-collapse border border-slate-400 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                      <th className="border border-slate-300 py-1 px-2 text-center w-14">ขนาดไซส์</th>
                      <th className="border border-slate-300 py-1 px-2 text-center w-28">ขนาดรอบอก</th>
                      <th className="border border-slate-300 py-1 px-2 text-center">ยอดรวมสั่งผลิต</th>
                      <th className="border border-slate-300 py-1 px-2 text-center">ส่งมอบแล้ว</th>
                      <th className="border border-slate-300 py-1 px-2 text-center">คงเหลือรอรับ</th>
                      <th className="border border-slate-300 py-1 px-2 text-center w-16">สัดส่วน %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeStats.STANDARD_SIZES.map(s => {
                      const count = sizeStats.counts[s] || 0;
                      const recCount = sizeStats.receivedCounts[s] || 0;
                      const pendCount = sizeStats.pendingCounts[s] || 0;
                      const pct = sizeStats.totalShirts > 0 ? ((count / sizeStats.totalShirts) * 100).toFixed(1) : 0;
                      const measurement = sizeMeasurements[s] || '-';

                      return (
                        <tr key={s} className="hover:bg-slate-50">
                          <td className="border border-slate-300 py-1 px-2 text-center font-bold font-mono">
                            {s}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-center text-slate-600">
                            {s === 'อื่นๆ' && count > 0
                              ? (sizeStats.otherSpecifiedLabels?.length > 0 && (sizeStats.otherUnspecifiedCount || 0) === 0
                                  ? `ระบุแล้ว: ${sizeStats.otherSpecifiedLabels.join(', ')}`
                                  : (sizeStats.otherSpecifiedLabels?.length || 0) === 0 && (sizeStats.otherUnspecifiedCount || 0) > 0
                                  ? `รอระบุ (${sizeStats.otherUnspecifiedCount} คน)`
                                  : `ระบุ: ${sizeStats.otherSpecifiedLabels.join(', ')} / รอระบุ ${sizeStats.otherUnspecifiedCount}`)
                              : measurement}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-black font-mono">
                            {count}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-center text-emerald-800 font-bold font-mono">
                            {recCount}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-center text-amber-800 font-bold font-mono">
                            {pendCount}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-center text-slate-600 font-mono">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-600">
                      <td colSpan="2" className="border border-slate-400 py-1 px-3 text-center">
                        รวมทั้งสิ้นทุกขนาดไซส์
                      </td>
                      <td className="border border-slate-400 py-1 px-2 text-center font-mono">
                        {sizeStats.totalShirts} ตัว
                      </td>
                      <td className="border border-slate-400 py-1 px-2 text-center font-mono text-emerald-900">
                        {sizeStats.totalReceivedShirts} ตัว
                      </td>
                      <td className="border border-slate-400 py-1 px-2 text-center font-mono text-amber-900">
                        {sizeStats.totalPendingShirts} ตัว
                      </td>
                      <td className="border border-slate-400 py-1 px-2 text-center font-mono">
                        100.0%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 1.5: UNIVERSITY × SHIRT SIZE & GENDER BREAKDOWN TABLE */}
            {includeUniversityTable && universitySummary && universitySummary.list && universitySummary.list.length > 0 && (
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>ตารางที่ 2: สรุปยอดเสื้อแยกตามสถาบัน × เพศ (ชาย/หญิง) × ไซส์เสื้อ (SS - 5XL)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    แยกตามสถาบันเครือข่าย
                  </span>
                </div>

                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                      <th className="border border-slate-300 py-1 px-2 text-left">มหาวิทยาลัย / สถาบัน</th>
                      <th className="border border-slate-300 py-1 px-1.5 text-center">ชาย</th>
                      <th className="border border-slate-300 py-1 px-1.5 text-center">หญิง</th>
                      <th className="border border-slate-300 py-1 px-1.5 text-center">Staff (280฿)</th>
                      <th className="border border-slate-300 py-1 px-1.5 text-center bg-slate-200 font-black">รวมเสื้อ</th>
                      {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => (
                        <th key={sz} className="border border-slate-300 py-1 px-1 text-center font-mono">{sz}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {universitySummary.list.map(u => (
                      <tr key={u.key} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900">
                          {u.shortTag} <span className="font-normal text-slate-600 text-[9px]">({u.totalPeople} คน)</span>
                        </td>
                        <td className="border border-slate-300 py-1 px-1 text-center font-mono">{u.male || '-'}</td>
                        <td className="border border-slate-300 py-1 px-1 text-center font-mono">{u.female || '-'}</td>
                        <td className="border border-slate-300 py-1 px-1 text-center font-mono">{u.staff || '-'}</td>
                        <td className="border border-slate-300 py-1 px-1.5 text-center font-black font-mono bg-slate-50">{u.totalShirts}</td>
                        {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => {
                          const cnt = u.shirtCounts[sz] || 0;
                          if (sz === 'อื่นๆ' && cnt > 0) {
                            const hasSpec = u.otherSpecifiedLabels && u.otherSpecifiedLabels.length > 0;
                            const hasUnspec = (u.otherUnspecifiedCount || 0) > 0;
                            const otherTxt = hasSpec && !hasUnspec
                              ? `${cnt} (${u.otherSpecifiedLabels.join(', ')})`
                              : !hasSpec && hasUnspec
                              ? `${cnt} (รอระบุ)`
                              : `${cnt} (${u.otherSpecifiedLabels.join(', ')}/รอระบุ ${u.otherUnspecifiedCount})`;
                            return (
                              <td key={sz} className="border border-slate-300 py-1 px-1 text-center font-mono text-[9px]">
                                <strong>{otherTxt}</strong>
                              </td>
                            );
                          }
                          return (
                            <td key={sz} className="border border-slate-300 py-1 px-1 text-center font-mono">
                              {cnt > 0 ? <strong>{cnt}</strong> : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-600">
                      <td className="border border-slate-400 py-1 px-2">รวมทั้งหมด ({universitySummary.list.length} สถาบัน)</td>
                      <td className="border border-slate-400 py-1 px-1 text-center font-mono">{universitySummary.totals.male}</td>
                      <td className="border border-slate-400 py-1 px-1 text-center font-mono">{universitySummary.totals.female}</td>
                      <td className="border border-slate-400 py-1 px-1 text-center font-mono">{universitySummary.totals.staff}</td>
                      <td className="border border-slate-400 py-1 px-1.5 text-center font-mono">{universitySummary.totals.totalShirts}</td>
                      {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => {
                        const totCnt = universitySummary.totals.shirtCounts[sz] || 0;
                        if (sz === 'อื่นๆ' && totCnt > 0) {
                          const totSpec = universitySummary.totals.otherSpecifiedLabels || [];
                          const totUnspec = universitySummary.totals.otherUnspecifiedCount || 0;
                          const totOtherTxt = totSpec.length > 0 && totUnspec === 0
                            ? `${totCnt} (${totSpec.join(', ')})`
                            : totSpec.length === 0 && totUnspec > 0
                            ? `${totCnt} (รอระบุ)`
                            : `${totCnt} (${totSpec.join(', ')}/รอระบุ ${totUnspec})`;
                          return (
                            <td key={sz} className="border border-slate-400 py-1 px-1 text-center font-mono text-[9px]">
                              {totOtherTxt}
                            </td>
                          );
                        }
                        return (
                          <td key={sz} className="border border-slate-400 py-1 px-1 text-center font-mono">
                            {totCnt}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 2: PARTICIPANTS ORDER, QR SCAN & SIGNATURE ROSTER GROUPED BY INSTITUTION */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  บัญชีรายชื่อผู้รับเสื้อฝึกและการลงลายมือชื่อรับเสื้อ ({groupByInstitution ? 'แยกตามสถาบัน • เรียงชาย ➔ หญิง' : 'เรียงรวมทั้งหมด • ชาย ➔ หญิง'}) — รวม {targetItems.length} คน
                </h3>
                <span className="text-[10px] text-slate-600 font-semibold">
                  {isFilteredScope ? `ตัวกรอง: ${currentFilterLabel}` : 'แสดงผู้สั่งเสื้อทั้งหมด'}
                </span>
              </div>

              {groupByInstitution ? (
                institutionGroups.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 border border-slate-300 rounded-lg">
                    ไม่พบรายการข้อมูลเสื้อตามเงื่อนไขที่เลือก
                  </div>
                ) : (
                  institutionGroups.map((grp) => (
                    <div key={grp.shortTag} className="space-y-1.5 pt-1">
                      {/* Institution Header Banner */}
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-t-lg flex flex-wrap items-center justify-between gap-2 print-avoid-break">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[11px] font-mono">
                            สถาบันที่ {grp.institutionIndex}
                          </span>
                          <span className="font-black text-xs sm:text-sm">
                            {grp.shortTag} — {grp.fullName}
                          </span>
                          {grp.clubName && grp.clubName !== '-' && (
                            <span className="text-[10px] text-slate-300">
                              ({grp.clubName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                            รวม {grp.items.length} คน
                          </span>
                          <span className="text-sky-300">ชาย {grp.maleCount}</span>
                          <span className="text-pink-300">หญิง {grp.femaleCount}</span>
                          {grp.staffCount > 0 && (
                            <span className="text-purple-300">Staff {grp.staffCount}</span>
                          )}
                          <span className="text-emerald-300 font-bold">✓ รับแล้ว {grp.receivedCount}</span>
                          <span className="text-amber-300 font-bold">⏳ รอรับ {grp.pendingCount}</span>
                        </div>
                      </div>

                      {renderRosterTable(grp.items, false)}
                    </div>
                  ))
                )
              ) : (
                renderRosterTable(sortedFlatItems, true)
              )}
            </div>

            {/* DOCUMENT FOOTER & OFFICIAL SIGN-OFF */}
            <div className="pt-6 border-t border-slate-300 print-avoid-break">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-8 overflow-hidden px-2">
                  <p className="font-semibold text-slate-700">ผู้จัดพิมพ์และสรุปรายงานข้อมูล</p>
                  <div className="space-y-1.5">
                    <div className="w-48 max-w-[80%] mx-auto border-b border-dotted border-slate-500 h-4" />
                    <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                      <span>(</span>
                      <span className="inline-block w-44 max-w-[75%] border-b border-dotted border-slate-500 h-3.5" />
                      <span>)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 pt-0.5">ฝ่ายธุรการและพัสดุ JRE 2027</p>
                    <p className="text-[10px] text-slate-500">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>

                <div className="space-y-8 overflow-hidden px-2">
                  <p className="font-semibold text-slate-700">ผู้ตรวจสอบและรับรองยอดส่งมอบ</p>
                  <div className="space-y-1.5">
                    <div className="w-48 max-w-[80%] mx-auto border-b border-dotted border-slate-500 h-4" />
                    <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                      <span>(</span>
                      <span className="inline-block w-44 max-w-[75%] border-b border-dotted border-slate-500 h-3.5" />
                      <span>)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 pt-0.5">หัวหน้าฝ่ายอำนวยการ / ประธานโครงการ</p>
                    <p className="text-[10px] text-slate-500">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-dotted border-slate-300 pt-2">
                เอกสารนี้สร้างขึ้นโดยระบบควบคุมและจัดการโครงการ JRE 2027 (Joint Response Exercise) • มหาวิทยาลัยมหาสารคาม
              </div>
            </div>

          </div>
        </div>

      </div>
    </ModalPortal>
  );
}
