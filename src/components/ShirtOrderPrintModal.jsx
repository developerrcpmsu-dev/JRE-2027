import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Shirt, 
  CheckCircle2, 
  Clock, 
  FileText,
  Sliders,
  Check,
  Building,
  Phone,
  Sparkles
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function ShirtOrderPrintModal({
  isOpen,
  onClose,
  sizeStats,
  sizeMeasurements = {},
  allItems = [],
  filteredItems = [],
  currentFilterLabel = 'ทั้งหมด',
  merchandiseConfig = null
}) {
  const [printScope, setPrintScope] = useState('filtered'); // 'all' or 'filtered'
  const [includeSummaryTable, setIncludeSummaryTable] = useState(true);
  const [includeSignatureCol, setIncludeSignatureCol] = useState(true);
  const [includeFinancialSummary, setIncludeFinancialSummary] = useState(true);

  if (!isOpen) return null;

  const targetItems = printScope === 'all' ? allItems : filteredItems;
  const isFilteredScope = printScope === 'filtered';

  const handleTriggerPrint = () => {
    window.print();
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

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/90 backdrop-blur-md overflow-hidden">
        
        {/* Top Control Toolbar (Hidden in print) */}
        <header className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rescue-500/20 border border-rescue-500/40 flex items-center justify-center text-rescue-400">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>พิมพ์รายงานสรุปยอดสั่งเสื้อ JRE 2027 (Print & PDF)</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  A4 Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                รองรับการสั่งพิมพ์ลงกระดาษจริง และบันทึกเป็นไฟล์ PDF (Save as PDF) ผ่านเบราว์เซอร์
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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

            {/* Toggles */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeSummaryTable}
                onChange={e => setIncludeSummaryTable(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>ตารางสรุปยอดแยกไซส์</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeSignatureCol}
                onChange={e => setIncludeSignatureCol(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>ช่องเซ็นชื่อผู้รับของ</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:block">
            💡 เคล็ดลับ: ในหน้าต่างสั่งพิมพ์ ให้เลือกเครื่องพิมพ์เป็น <strong>"Save as PDF"</strong> เพื่อบันทึกเป็นไฟล์ PDF
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/60">
          
          {/* Printable Document Container */}
          <div 
            id="printable-shirt-report"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl space-y-6 print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none text-xs"
            style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', 'TH Sarabun New', Tahoma, sans-serif" }}
          >
            
            {/* DOCUMENT HEADER */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-wider">
                      JRE 2027 OFFICIAL REPORT
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
                    รายงานสรุปยอดสั่งเสื้อฝึก และบัญชีรายชื่อการแจกจ่ายตามขนาดไซส์เสื้อ
                  </h2>
                </div>

                <div className="text-right text-[10px] text-slate-600 space-y-0.5 shrink-0">
                  <p><strong>วันที่พิมพ์:</strong> {currentDateStr}</p>
                  <p><strong>เวลา:</strong> {currentTimeStr} น.</p>
                  <p><strong>ผู้จัดทำ:</strong> ฝ่ายพัสดุและสถานที่ JRE 2027</p>
                  <p className="text-emerald-700 font-bold">จุดส่งมอบ: อาคารพลศึกษา มมส (13 ก.พ. 2570)</p>
                </div>
              </div>
            </div>

            {/* KEY METRICS SUMMARY STRIP */}
            {includeFinancialSummary && sizeStats && (
              <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-lg p-3 text-center print-avoid-break">
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[10px] text-slate-600 block">ยอดรวมเสื้อทั้งหมด</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {sizeStats.totalShirts} <span className="text-xs font-normal">ตัว</span>
                  </span>
                </div>
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[10px] text-slate-600 block">ส่งมอบแล้ว</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {sizeStats.totalReceivedShirts} <span className="text-xs font-normal">ตัว</span>
                  </span>
                </div>
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[10px] text-slate-600 block">คงเหลือรอรับหน้างาน</span>
                  <span className="text-lg font-black text-amber-700 font-mono">
                    {sizeStats.totalPendingShirts} <span className="text-xs font-normal">ตัว</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 block">จำนวนผู้รับในรายงานนี้</span>
                  <span className="text-lg font-black text-indigo-900 font-mono">
                    {targetItems.length} <span className="text-xs font-normal">คน</span>
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

                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                      <th className="border border-slate-300 py-1.5 px-2 text-center w-14">ขนาดไซส์</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center w-24">ขนาดรอบอก</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">ยอดรวมสั่งผลิต</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">ส่งมอบแล้ว</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center">คงเหลือรอรับ</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-center w-16">สัดส่วน %</th>
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
                            {measurement}
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
                    {/* Total Row */}
                    <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-600">
                      <td colSpan="2" className="border border-slate-400 py-1.5 px-3 text-center">
                        รวมทั้งสิ้นทุกขนาดไซส์
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-center font-mono text-sm">
                        {sizeStats.totalShirts} ตัว
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-center font-mono text-emerald-900">
                        {sizeStats.totalReceivedShirts} ตัว
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-center font-mono text-amber-900">
                        {sizeStats.totalPendingShirts} ตัว
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-center font-mono">
                        100.0%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 2: PARTICIPANTS ORDER & SIGNATURE ROSTER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  ตารางที่ 2: บัญชีรายชื่อผู้รับเสื้อฝึก และการส่งมอบ ({targetItems.length} รายการ)
                </h3>
                <span className="text-[10px] text-slate-500">
                  {isFilteredScope ? `* แสดงเฉพาะข้อมูลที่กรอง: ${currentFilterLabel}` : '* แสดงข้อมูลผู้สั่งเสื้อทั้งหมด'}
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                    <th className="border border-slate-300 py-1.5 px-1.5 text-center w-8">#</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left w-24">เลขที่คำสั่งซื้อ/รหัส</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">ชื่อ - นามสกุล</th>
                    <th className="border border-slate-300 py-1.5 px-2 text-left">หน่วยงาน / สังกัด</th>
                    <th className="border border-slate-300 py-1.5 px-1.5 text-center w-20">เบอร์โทรศัพท์</th>
                    <th className="border border-slate-300 py-1.5 px-1 text-center w-12">ไซส์</th>
                    <th className="border border-slate-300 py-1.5 px-1 text-center w-8">จน.</th>
                    <th className="border border-slate-300 py-1.5 px-1.5 text-center w-16">สถานะชำระ</th>
                    <th className="border border-slate-300 py-1.5 px-1.5 text-center w-16">การส่งมอบ</th>
                    {includeSignatureCol && (
                      <th className="border border-slate-300 py-1.5 px-2 text-center w-28 bg-slate-50">
                        ลายมือชื่อผู้รับของ
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {targetItems.length === 0 ? (
                    <tr>
                      <td colSpan={includeSignatureCol ? 10 : 9} className="py-6 text-center text-slate-500">
                        ไม่พบรายการข้อมูลเสื้อตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    targetItems.map((item, index) => {
                      const isReceived = item.pickup_status === 'received';
                      const isPaid = item.payment_status === 'paid_verified';

                      return (
                        <tr 
                          key={item.id || item.order_number || index} 
                          className="hover:bg-slate-50 print-avoid-break"
                        >
                          <td className="border border-slate-300 py-1 px-1 text-center font-mono text-slate-600">
                            {index + 1}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 font-mono font-bold text-slate-800">
                            {item.order_number || '-'}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900">
                            {item.customer_name || '-'}
                            {item.nickname && item.nickname !== '-' && (
                              <span className="text-slate-600 font-normal ml-1">({item.nickname})</span>
                            )}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 text-slate-700">
                            {item.institution && item.institution !== '-' ? item.institution : (item.source_label || '-')}
                          </td>
                          <td className="border border-slate-300 py-1 px-1.5 text-center font-mono text-slate-700">
                            {item.phone || '-'}
                          </td>
                          <td className="border border-slate-300 py-1 px-1 text-center font-black font-mono bg-slate-50">
                            {item.size || item.normalized_size || '-'}
                          </td>
                          <td className="border border-slate-300 py-1 px-1 text-center font-mono font-bold">
                            {item.quantity || 1}
                          </td>
                          <td className="border border-slate-300 py-1 px-1.5 text-center font-medium">
                            {isPaid ? (
                              <span className="text-emerald-800 font-bold">✓ ชำระแล้ว</span>
                            ) : (
                              <span className="text-slate-600">{item.payment_badge || 'รอตรวจ'}</span>
                            )}
                          </td>
                          <td className="border border-slate-300 py-1 px-1.5 text-center font-medium">
                            {isReceived ? (
                              <span className="text-emerald-800 font-bold">✓ ส่งมอบแล้ว</span>
                            ) : (
                              <span className="text-amber-800">รอรับหน้างาน</span>
                            )}
                          </td>
                          {includeSignatureCol && (
                            <td className="border border-slate-300 py-1 px-2 text-center text-slate-400 bg-slate-50/50">
                              {isReceived ? (
                                <span className="text-[9px] text-emerald-800 font-semibold font-mono">
                                  รับแล้ว ({item.pickup_at ? new Date(item.pickup_at).toLocaleDateString('th-TH') : '✓'})
                                </span>
                              ) : (
                                <div className="h-4 border-b border-dotted border-slate-400 mx-1" />
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* DOCUMENT FOOTER & OFFICIAL SIGN-OFF */}
            <div className="pt-6 border-t border-slate-300 print-avoid-break">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-10">
                  <p className="font-semibold text-slate-700">ผู้จัดพิมพ์และสรุปรายงานข้อมูล</p>
                  <div>
                    <p className="text-slate-400 font-mono">...........................................................................</p>
                    <p className="font-bold text-slate-900 mt-1">( ........................................................................... )</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">ฝ่ายธุรการและพัสดุ JRE 2027</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <p className="font-semibold text-slate-700">ผู้ตรวจสอบและรับรองยอดส่งมอบ</p>
                  <div>
                    <p className="text-slate-400 font-mono">...........................................................................</p>
                    <p className="font-bold text-slate-900 mt-1">( ........................................................................... )</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">หัวหน้าฝ่ายอำนวยการ / ประธานโครงการ</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">วันที่ ........ / ........ / .............</p>
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
