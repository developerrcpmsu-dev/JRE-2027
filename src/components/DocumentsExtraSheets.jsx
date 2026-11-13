import React from 'react';
import { Copy, ExternalLink, FileHeart, Link2 } from 'lucide-react';

/**
 * เอกสารเพิ่มเติมในศูนย์เอกสาร /admin/documents
 *  - QrMasterSheet       : เอกสารรวม QR Code ของทุกคนในใบเดียว (PDPA-Safe)
 *  - MedicalSuppliesSheet: เอกสารขอยา / จัดเตรียมยา / ขอเวชภัณฑ์ / จัดเตรียมเวชภัณฑ์
 *  - EmrRecordsSheet     : เอกสารเวชระเบียนรายคน + รายเคส พร้อม URL แยกรายคน / รายเคส
 */

const copyText = async (text, triggerToast, label = 'URL') => {
  try {
    await navigator.clipboard.writeText(text);
    if (triggerToast) triggerToast(`📋 คัดลอก ${label} แล้ว`);
  } catch {
    if (triggerToast) triggerToast(`คัดลอกไม่สำเร็จ: ${text}`, 'error');
  }
};

function UrlActions({ url, label, onOpen, triggerToast }) {
  if (!url) return <span className="text-slate-400">-</span>;
  return (
    <div className="space-y-1">
      <a
        href={url}
        onClick={(e) => {
          if (onOpen) {
            e.preventDefault();
            onOpen();
          }
        }}
        className="block font-mono text-[9px] text-sky-800 underline break-all leading-tight"
      >
        {url.replace(/^https?:\/\//, '')}
      </a>
      <div className="flex items-center gap-1 no-print">
        <button
          type="button"
          onClick={() => copyText(url, triggerToast, label)}
          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[9px] font-bold text-slate-700 inline-flex items-center gap-0.5 cursor-pointer"
        >
          <Copy className="w-2.5 h-2.5" /> คัดลอก
        </button>
        <button
          type="button"
          onClick={() => (onOpen ? onOpen() : window.open(url, '_blank', 'noopener'))}
          className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 border border-sky-300 text-[9px] font-bold text-sky-800 inline-flex items-center gap-0.5 cursor-pointer"
        >
          <ExternalLink className="w-2.5 h-2.5" /> เปิด
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. QR MASTER — ทุกคนทุกชื่อในใบเดียว                                */
/* ------------------------------------------------------------------ */
export function QrMasterSheet({ records = [], qrMap = {}, layout = 'grid' }) {
  if (layout === 'table') {
    return (
      <div className="space-y-4">
        <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
          <span>QR Code ประจำตัวทุกคน ({records.length} คน) — สแกนได้ทุกจุด: เช็คชื่อ • รับบัตร • รับเสื้อ • เปิดเวชระเบียน (PDPA-Safe ไม่แสดงข้อมูลสุขภาพ)</span>
          <span className="font-mono font-bold">ทะเบียนรวมทุกคน</span>
        </div>
        <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
          <thead>
            <tr className="bg-slate-200 text-slate-950 font-bold text-center">
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-10">ที่</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-20">QR Code</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">รหัสบัตร</th>
              <th className="py-2 px-3 border-[1.5px] border-slate-950 text-left min-w-[200px]">ชื่อ - นามสกุล</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-20">ชื่อเล่น</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">นามเรียกขาน</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-14">สังกัด</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-32">บทบาท</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-32">กลุ่ม / ห้องพัก</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">ลายมือชื่อ</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={r.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} style={{ breakInside: 'avoid' }}>
                <td className="py-1 px-2 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
                <td className="py-1 px-1 border border-slate-700 text-center">
                  {qrMap[r.id] ? (
                    <img src={qrMap[r.id]} alt={`QR ${r.name}`} className="w-14 h-14 mx-auto block border border-slate-800 p-0.5 bg-white" />
                  ) : (
                    <span className="text-[9px] text-slate-500">กำลังสร้าง...</span>
                  )}
                </td>
                <td className="py-1 px-2 border border-slate-700 text-center font-mono font-bold text-[10px]">{r.cardCode}</td>
                <td className="py-1 px-3 border border-slate-700 font-bold text-slate-950 whitespace-nowrap">{r.name}</td>
                <td className="py-1 px-2 border border-slate-700 text-center">{r.nickname}</td>
                <td className="py-1 px-2 border border-slate-700 text-center font-mono font-semibold">{r.callsign}</td>
                <td className="py-1 px-2 border border-slate-700 text-center font-bold">{r.institution}</td>
                <td className="py-1 px-2 border border-slate-700 text-[10px]">{r.role}</td>
                <td className="py-1 px-2 border border-slate-700 text-[10px] text-center">
                  <div>{r.groupAssigned || 'รอจัดกลุ่ม'}</div>
                  <div className="text-slate-700">{r.roomNote}</div>
                </td>
                <td className="py-1 px-2 border border-slate-700"><span className="block border-b border-dotted border-slate-700 h-5 w-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // GRID: การ์ด QR ทุกคนในหน้าเดียว (ตัดแจก/ติดบอร์ดได้)
  return (
    <div className="space-y-4">
      <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
        <span>QR Code ประจำตัวทุกคนทุกชื่อในแผ่นเดียว ({records.length} คน) — สแกนด้วยกล้องมือถือหรือระบบสแกน QR ได้ทันที</span>
        <span className="font-mono font-bold">PDPA-Safe • ปิดข้อมูลสุขภาพ</span>
      </div>
      <div className="grid grid-cols-6 gap-0 border-t-[1.5px] border-l-[1.5px] border-slate-950">
        {records.map((r, idx) => (
          <div
            key={r.id || idx}
            className="border-r-[1.5px] border-b-[1.5px] border-slate-950 p-2 text-center bg-white"
            style={{ breakInside: 'avoid' }}
          >
            <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-800 pb-1 mb-1 border-b border-slate-400">
              <span className="font-bold">#{idx + 1}</span>
              <span className="font-black text-slate-950">{r.institution}</span>
            </div>
            {qrMap[r.id] ? (
              <img src={qrMap[r.id]} alt={`QR ${r.name}`} className="w-24 h-24 mx-auto block border border-slate-400 p-0.5 bg-white" />
            ) : (
              <div className="w-24 h-24 mx-auto flex items-center justify-center text-[9px] text-slate-500 border border-slate-300">กำลังสร้าง...</div>
            )}
            <div className="text-[10px] font-black text-slate-950 leading-tight mt-1">{r.name}</div>
            <div className="text-[9px] text-slate-800 font-mono leading-tight">
              {r.nickname !== '-' ? `(${r.nickname}) ` : ''}{r.callsign}
            </div>
            <div className="text-[8px] font-mono font-bold text-slate-900 mt-0.5 pt-0.5 border-t border-slate-300">{r.cardCode}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. MEDICAL SUPPLIES — ขอยา / จัดเตรียมยา / ขอ-จัดเตรียมเวชภัณฑ์       */
/* ------------------------------------------------------------------ */
export function MedicalSuppliesSheet({ prepRows = [], summaryItems = [], requestUrlFor, triggerToast }) {
  const requestedCount = prepRows.filter(r => r.medEquipment).length;
  const careCount = prepRows.filter(r => r.hasCare).length;
  return (
    <div className="space-y-6">
      <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
        <span>
          เอกสารขอยา / จัดเตรียมยา / ขอเวชภัณฑ์ / จัดเตรียมเวชภัณฑ์ — ผู้แจ้งขอยา {requestedCount} ท่าน • มีโรค/แพ้/ดูแลพิเศษ {careCount} ท่าน • รายการหลัก {summaryItems.length} รายการ
        </span>
        <span className="font-mono font-bold">เฉพาะฝ่ายพยาบาล / สวัสดิการ</span>
      </div>

      {/* PART 1: SUMMARY */}
      <div>
        <h3 className="text-sm font-black text-slate-950 mb-2">ส่วนที่ 1: สรุปยอดรายการยา / เวชภัณฑ์ที่ต้องจัดเตรียม</h3>
        <table className="official-table w-full text-left text-xs border-collapse border-2 border-slate-950">
          <thead>
            <tr className="bg-slate-200 text-slate-950 font-bold text-center">
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-10">ที่</th>
              <th className="py-2 px-3 border-[1.5px] border-slate-950 text-left">รายการยา / เวชภัณฑ์ / อุปกรณ์</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-20">จำนวนผู้ขอ</th>
              <th className="py-2 px-3 border-[1.5px] border-slate-950 text-left">รายชื่อผู้ขอ (นามเรียกขาน)</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">จำนวนที่เตรียม</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">เช็คจัดเตรียม</th>
            </tr>
          </thead>
          <tbody>
            {summaryItems.length === 0 ? (
              <tr><td colSpan={6} className="py-6 border border-slate-700 text-center text-slate-600">ยังไม่มีผู้แจ้งคำขอเตรียมยา / เวชภัณฑ์</td></tr>
            ) : summaryItems.map((it, idx) => (
              <tr key={it.item} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="py-1.5 px-2 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
                <td className="py-1.5 px-3 border border-slate-700 font-bold text-slate-950">{it.item}</td>
                <td className="py-1.5 px-2 border border-slate-700 text-center font-black text-slate-950">{it.count}</td>
                <td className="py-1.5 px-3 border border-slate-700 text-[10px]">{it.requesters.join(', ')}</td>
                <td className="py-1.5 px-2 border border-slate-700 text-center"><span className="block border-b border-dotted border-slate-700 h-5 w-full" /></td>
                <td className="py-1.5 px-2 border border-slate-700 text-center text-[10.5px]">
                  <div className="space-y-0.5">
                    <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-800 text-[9px] font-black">
                      มีต้องเตรียม
                    </span>
                    <div className="font-bold text-slate-900">☐ เตรียมแล้ว</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PART 2: PER PERSON */}
      <div>
        <h3 className="text-sm font-black text-slate-950 mb-2">ส่วนที่ 2: รายชื่อผู้ขอยา / เวชภัณฑ์ และผู้มีโรคประจำตัว / แพ้ยา ({prepRows.length} ท่าน)</h3>
        <table className="official-table w-full text-left text-[11px] border-collapse border-2 border-slate-950">
          <thead>
            <tr className="bg-slate-200 text-slate-950 font-bold text-center">
              <th className="py-2 px-1.5 border-[1.5px] border-slate-950 w-8">ที่</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 text-left min-w-[190px]">ชื่อ - สกุล / นามเรียกขาน</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">สังกัด / ห้องพัก</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-32 text-left">ติดต่อ / ฉุกเฉิน</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-40 text-left">โรค / แพ้ / หมู่เลือด</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-40 text-left">ยา / เวชภัณฑ์ที่ขอ</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-32 text-left">ของใช้ / ดูแลพิเศษ</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">ความยินยอม</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-40 no-print">URL คำขอรายคน</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-28">เช็คเตรียม (Staff)</th>
            </tr>
          </thead>
          <tbody>
            {prepRows.length === 0 ? (
              <tr><td colSpan={10} className="py-6 border border-slate-700 text-center text-slate-600">ไม่มีผู้ขอยาหรือผู้มีโรคประจำตัว</td></tr>
            ) : prepRows.map((r, idx) => {
              const url = requestUrlFor ? requestUrlFor(r) : '';
              return (
                <tr key={r.id || idx} className={r.hasCare ? 'bg-rose-50/60' : (idx % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                  <td className="py-1.5 px-1.5 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
                  <td className="py-1.5 px-2 border border-slate-700">
                    <div className="font-bold text-slate-950 whitespace-nowrap">{r.name}</div>
                    <div className="text-[10px] text-slate-700 font-mono">({r.nickname}) • {r.callsign}</div>
                  </td>
                  <td className="py-1.5 px-2 border border-slate-700 text-center text-[10px]">
                    <div className="font-bold">{r.institution}</div>
                    <div className="text-slate-700">{r.roomLabel}</div>
                  </td>
                  <td className="py-1.5 px-2 border border-slate-700 text-[10px]">
                    <div className="font-mono">โทร: {r.phone}</div>
                    <div className="text-rose-900 font-semibold">ฉุกเฉิน: {r.emergencyContact}</div>
                  </td>
                  <td className="py-1.5 px-2 border border-slate-700 text-[10px]">
                    <div className={r.hasCare ? 'font-bold text-rose-900' : 'text-emerald-800'}>{r.medicalSummary}</div>
                    {r.bloodGroup && r.bloodGroup !== '-' && <div className="font-mono text-slate-800">หมู่เลือด: {r.bloodGroup}</div>}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-700 text-[10px] font-semibold text-emerald-950">{r.medEquipment || '-'}</td>
                  <td className="py-1.5 px-2 border border-slate-700 text-[10px] font-semibold text-indigo-950">
                    {r.specialItems || (r.isSpecialCare ? 'ต้องดูแลเป็นพิเศษ' : '-')}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-700 text-center text-[9.5px]">{r.consentLabel}</td>
                  <td className="py-1.5 px-2 border border-slate-700 no-print">
                    <UrlActions url={url} label="URL คำขอยา" triggerToast={triggerToast} />
                  </td>
                  <td className="py-1.5 px-2 border border-slate-700 text-center text-[10px]">
                    {r.hasCare || r.medEquipment || r.specialItems ? (
                      <div className="space-y-0.5">
                        <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-800 text-[9px] font-black">
                          มีต้องเตรียม
                        </span>
                        <div className="font-bold text-slate-900">☐ เตรียมแล้ว</div>
                        <div className="text-slate-700 text-[9px]">ผู้เตรียม: ...........</div>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-700">ไม่มีต้องเตรียม</span>
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

/* ------------------------------------------------------------------ */
/* 9. EMR — เวชระเบียนรายคน / รายเคส + URL แยก                         */
/* ------------------------------------------------------------------ */
export function EmrRecordsSheet({
  personRows = [],
  caseRows = [],
  isLoading = false,
  search = '',
  onSearchChange,
  onReload,
  onOpenPerson,
  onOpenCase,
  triggerToast
}) {
  return (
    <div className="space-y-6">
      <div className="p-2.5 bg-slate-50 border-[1.5px] border-slate-900 rounded-none text-[11px] text-slate-950 font-semibold flex flex-wrap items-center justify-between gap-2">
        <span>
          เอกสารเวชระเบียนสนาม (Field EMR) — รายคน {personRows.length} ท่าน • รายเคส {caseRows.length} เคส • ทุกคน/ทุกเคสมี URL แยกสำหรับเปิดดูและแก้ไข
        </span>
        <span className="font-mono font-bold text-rose-900">ข้อมูลลับทางการแพทย์ • เฉพาะ Admin / ทีมแพทย์</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 no-print">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่อ / เรียกขาน / อาการ / ยา / ผู้จ่ายยา / รหัสเคส..."
          className="flex-1 min-w-[240px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-rose-400"
        />
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
          >
            {isLoading ? 'กำลังโหลด...' : 'โหลดเวชระเบียนล่าสุด'}
          </button>
        )}
      </div>

      {/* PART 1: PER PERSON */}
      <div>
        <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center gap-1.5">
          <FileHeart className="w-4 h-4 text-slate-900" /> ส่วนที่ 1: เวชระเบียนรายคน (ทุกคน • URL แยกรายคน)
        </h3>
        <table className="official-table w-full text-left text-[11px] border-collapse border-2 border-slate-950">
          <thead>
            <tr className="bg-slate-200 text-slate-950 font-bold text-center">
              <th className="py-2 px-1.5 border-[1.5px] border-slate-950 w-8">ที่</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 text-left min-w-[190px]">ชื่อ - สกุล / นามเรียกขาน</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-24">สังกัด / กลุ่ม / ห้อง</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-40 text-left">โรค / แพ้ / หมู่เลือด</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-36 text-left">ยาที่ขอเตรียม</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-16">จำนวนเคส</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-40 text-left">เคสล่าสุด</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-44">URL รายคน (Admin)</th>
              <th className="py-2 px-2 border-[1.5px] border-slate-950 w-44">URL หน้าเวชระเบียนของเจ้าตัว</th>
            </tr>
          </thead>
          <tbody>
            {personRows.length === 0 ? (
              <tr><td colSpan={9} className="py-6 border border-slate-700 text-center text-slate-600">ไม่พบข้อมูล</td></tr>
            ) : personRows.map((p, idx) => (
              <tr key={p.id || idx} className={p.caseCount > 0 ? 'bg-rose-50/60' : (idx % 2 === 1 ? 'bg-slate-50' : 'bg-white')}>
                <td className="py-1.5 px-1.5 border border-slate-700 text-center font-mono font-bold">{idx + 1}</td>
                <td className="py-1.5 px-2 border border-slate-700">
                  <div className="font-bold text-slate-950 whitespace-nowrap">{p.name}</div>
                  <div className="text-[10px] text-slate-700 font-mono">({p.nickname}) • {p.callsign} • โทร: {p.phone}</div>
                </td>
                <td className="py-1.5 px-2 border border-slate-700 text-center text-[10px]">
                  <div className="font-bold">{p.institution}</div>
                  <div className="text-slate-700">{p.group}</div>
                  <div className="text-slate-700">{p.room}</div>
                </td>
                <td className="py-1.5 px-2 border border-slate-700 text-[10px]">
                  <div className={p.hasMed ? 'font-bold text-rose-900' : 'text-slate-800'}>โรค: {p.medical}</div>
                  <div className={p.hasAlg ? 'font-bold text-amber-900' : 'text-slate-800'}>แพ้: {p.allergy}</div>
                  <div className="font-mono text-slate-700">หมู่เลือด: {p.blood}</div>
                </td>
                <td className="py-1.5 px-2 border border-slate-700 text-[10px] text-emerald-950 font-semibold">{p.requestedEquipment || '-'}</td>
                <td className="py-1.5 px-2 border border-slate-700 text-center font-black text-base text-rose-900">{p.caseCount}</td>
                <td className="py-1.5 px-2 border border-slate-700 text-[10px]">
                  {p.lastCase ? (
                    <>
                      <div className="font-mono text-slate-700">{p.lastCase.timeLabel}</div>
                      <div className="font-semibold text-slate-950">{p.lastCase.symptoms || '-'}</div>
                      <div className="text-emerald-900">{p.lastCase.medicines || '-'}</div>
                    </>
                  ) : <span className="text-slate-500">ยังไม่มีเคส</span>}
                </td>
                <td className="py-1.5 px-2 border border-slate-700">
                  <UrlActions
                    url={p.personUrl}
                    label="URL เวชระเบียนรายคน"
                    triggerToast={triggerToast}
                    onOpen={onOpenPerson ? () => onOpenPerson(p.id) : null}
                  />
                </td>
                <td className="py-1.5 px-2 border border-slate-700">
                  <UrlActions url={p.myEmrUrl} label="URL หน้าเจ้าตัว" triggerToast={triggerToast} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PART 2: PER CASE */}
      <div>
        <h3 className="text-sm font-black text-slate-950 mb-2 flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-slate-900" /> ส่วนที่ 2: เวชระเบียนรายเคส (ทุกเคส • URL แยกรายเคส)
        </h3>
        {caseRows.length === 0 ? (
          <div className="p-6 text-center text-slate-600 border-[1.5px] border-dashed border-slate-900 rounded-none">
            {isLoading ? 'กำลังโหลดเวชระเบียน...' : 'ยังไม่มีบันทึกเวชระเบียน / การจ่ายยา ณ จุดปฐมพยาบาลสนาม'}
          </div>
        ) : (
          <div className="space-y-3">
            {caseRows.map((c, idx) => (
              <div key={c.caseId || idx} className="border-2 border-slate-950 rounded-none overflow-hidden bg-white" style={{ breakInside: 'avoid' }}>
                <div className="bg-slate-200 text-slate-950 border-b-[1.5px] border-slate-950 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-black">
                    เคสที่ {idx + 1} • {c.personName}{c.nickname && c.nickname !== '-' ? ` (${c.nickname})` : ''} • {c.callsign}
                  </span>
                  <span className="font-mono font-bold">รหัสเคส: {c.caseId} • {c.timeLabel}</span>
                </div>
                <div className="grid grid-cols-4 text-[10.5px] official-case-grid">
                  <div className="p-2 border-r border-b border-slate-700">
                    <div className="text-slate-700 font-bold">สังกัด / กลุ่ม / ห้อง</div>
                    <div>{c.institution} • {c.group}</div>
                    <div>{c.room}</div>
                  </div>
                  <div className="p-2 border-r border-b border-slate-700">
                    <div className="text-slate-700 font-bold">โรค / แพ้ / หมู่เลือด</div>
                    <div className="text-rose-900 font-semibold">โรค: {c.chronic || 'ไม่มี'}</div>
                    <div className="text-amber-900 font-semibold">แพ้: {c.allergy || 'ไม่มี'}</div>
                    <div className="font-mono">หมู่เลือด: {c.blood || '-'}</div>
                  </div>
                  <div className="p-2 border-r border-b border-slate-700">
                    <div className="text-slate-700 font-bold">สัญญาณชีพ (V/S)</div>
                    <div className="font-mono">{c.vitalSigns || '-'}</div>
                  </div>
                  <div className="p-2 border-b border-slate-700">
                    <div className="text-slate-700 font-bold">ผู้กรอก / ผู้จ่ายยา</div>
                    <div>ผู้กรอก: {c.recorder || '-'}</div>
                    <div>ผู้จ่ายยา: {c.dispenser || '-'}</div>
                  </div>
                  <div className="p-2 border-r border-b border-slate-700">
                    <div className="text-slate-700 font-bold">อาการสำคัญ</div>
                    <div className="font-bold text-slate-950">{c.symptoms || '-'}</div>
                  </div>
                  <div className="p-2 border-r border-b border-slate-700">
                    <div className="text-slate-700 font-bold">เหตุการณ์ / เป็นเมื่อไหร่อย่างไร</div>
                    <div>{c.incidentDetail || '-'}</div>
                  </div>
                  <div className="p-2 border-r border-b border-slate-700">
                    <div className="text-slate-700 font-bold">การปฐมพยาบาล / หัตถการ</div>
                    <div>{c.firstAid || '-'}</div>
                  </div>
                  <div className="p-2 border-b border-slate-700">
                    <div className="text-slate-700 font-bold">ยาที่จ่าย / ขนาดและเวลา</div>
                    <div className="font-bold text-emerald-950">{c.medicines || '-'}</div>
                    <div>{c.dosage || '-'}</div>
                  </div>
                  <div className="p-2 border-r border-slate-700 col-span-2">
                    <div className="text-slate-700 font-bold">หมายเหตุ / ติดตามอาการ</div>
                    <div>{c.notes || '-'}</div>
                  </div>
                  <div className="p-2 border-r border-slate-700">
                    <div className="text-slate-700 font-bold mb-0.5">URL รายเคส (Admin)</div>
                    <UrlActions
                      url={c.caseUrl}
                      label="URL รายเคส"
                      triggerToast={triggerToast}
                      onOpen={onOpenCase ? () => onOpenCase(c.caseId, c.personId) : null}
                    />
                  </div>
                  <div className="p-2">
                    <div className="text-slate-700 font-bold mb-0.5">URL เคสนี้ในหน้าเจ้าตัว</div>
                    <UrlActions url={c.myCaseUrl} label="URL เคส (เจ้าตัว)" triggerToast={triggerToast} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
