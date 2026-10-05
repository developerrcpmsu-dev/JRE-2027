import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, 
  Camera, 
  Search, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  AlertCircle, 
  User, 
  Phone, 
  Tag, 
  QrCode,
  ShieldCheck,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function AdminQRScannerModal({ 
  orders = [], 
  registrations = [],
  onMarkReceived, 
  onMarkRegistrationShirtReceived,
  onClose,
  onVerifyPayment
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [scannedOrder, setScannedOrder] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [previewSlip, setPreviewSlip] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Auto-dismiss success message and scan errors
  useEffect(() => {
    if (!actionSuccessMsg) return;
    const timer = setTimeout(() => setActionSuccessMsg(''), 4500);
    return () => clearTimeout(timer);
  }, [actionSuccessMsg]);

  useEffect(() => {
    if (!scanError) return;
    const timer = setTimeout(() => setScanError(''), 6000);
    return () => clearTimeout(timer);
  }, [scanError]);

  const scannerRef = useRef(null);
  const qrRegionId = 'admin-qr-reader-region';

  // Find matching item across merchandise orders and trainee registrations
  const findMatchingItem = (rawText) => {
    if (!rawText || typeof rawText !== 'string') return null;
    let target = rawText.trim();
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.order_number) target = parsed.order_number;
      else if (parsed.user_id) target = parsed.user_id;
      else if (parsed.id) target = parsed.id;
    } catch (e) {}

    const q = target.toLowerCase();

    // 1. Check in Merchandise Orders
    const matchedOrder = orders.find(
      o => o.order_number?.toLowerCase() === q ||
           o.order_number?.toLowerCase().includes(q) ||
           o.id === target ||
           o.customer_phone?.includes(target) ||
           o.customer_name?.toLowerCase().includes(q) ||
           o.user_email?.toLowerCase().includes(q)
    );
    if (matchedOrder) {
      return { ...matchedOrder, itemType: 'merchandise' };
    }

    // 2. Check in Trainee Registrations
    let cleanCode = target;
    if (target.toUpperCase().startsWith('JRE27-SHIRT-')) {
      cleanCode = target.toUpperCase().replace('JRE27-SHIRT-', '');
    }

    const matchedReg = registrations.find(r => {
      const regId = (r.id || '').toLowerCase();
      const userId = (r.user_id || '').toLowerCase();
      const regOrderNum = `JRE27-SHIRT-${(r.id || r.user_id || 'REG').slice(0, 6).toUpperCase()}`.toLowerCase();
      const codeMatches = cleanCode.length >= 3 && (regId.includes(cleanCode.toLowerCase()) || userId.includes(cleanCode.toLowerCase()));

      return (
        regOrderNum === q ||
        regId === q ||
        userId === q ||
        codeMatches ||
        (r.callsign && r.callsign.toLowerCase().includes(q)) ||
        (r.nickname && r.nickname.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(target)) ||
        (r.user_email && r.user_email.toLowerCase().includes(q)) ||
        (r.first_name && r.first_name.toLowerCase().includes(q)) ||
        (r.last_name && r.last_name.toLowerCase().includes(q)) ||
        (r.full_name_affiliation && r.full_name_affiliation.toLowerCase().includes(q))
      );
    });

    if (matchedReg) {
      const isRound1Paid = matchedReg.installment_1_status === 'paid' || matchedReg.payment_status === 'paid' || matchedReg.payment_status === 'full';
      const isFullyPaid = matchedReg.payment_status === 'paid' || matchedReg.payment_status === 'full' || (matchedReg.installment_1_status === 'paid' && matchedReg.installment_2_status === 'paid');
      const isReceived = matchedReg.shirt_pickup_status === 'received' || matchedReg.shirt_received === true;
      const orderNumber = `JRE27-SHIRT-${(matchedReg.id || matchedReg.user_id || 'REG').slice(0, 6).toUpperCase()}`;

      return {
        id: `reg_shirt_${matchedReg.id || matchedReg.user_id}`,
        user_id: matchedReg.user_id || matchedReg.id,
        itemType: 'registration',
        order_number: orderNumber,
        customer_name: matchedReg.full_name_affiliation || `${matchedReg.first_name || ''} ${matchedReg.last_name || ''}`.trim() || matchedReg.user_email || 'ผู้เข้ารับการฝึกอบรม',
        nickname: matchedReg.nickname || '-',
        callsign: matchedReg.callsign || '-',
        institution: matchedReg.institution || '-',
        group_assigned: matchedReg.group_assigned || '-',
        room_assigned: matchedReg.room_assigned || '-',
        customer_phone: matchedReg.phone || '-',
        user_email: matchedReg.user_email || '',
        shirt_size: matchedReg.shirt_size || 'L',
        pickup_method: 'pickup',
        pickup_location: 'อาคารพลศึกษา มหาวิทยาลัยมหาสารคาม (13 ก.พ. 2570)',
        pickup_status: isReceived ? 'received' : 'pending',
        pickup_at: matchedReg.shirt_received_date || null,
        payment_status: isFullyPaid ? 'paid_verified' : (isRound1Paid ? 'paid_verified' : 'pending_verification'),
        isFullyPaid,
        isRound1Paid,
        total_amount: matchedReg.payment_amount || (matchedReg.institution?.includes('มหาสารคาม') || matchedReg.institution?.includes('มมส') ? 650 : 850),
        slip_url: matchedReg.payment_slip_url || matchedReg.installment_1_slip_url || matchedReg.slip_url || null,
        items: [
          {
            product_name: 'เสื้อฝึก Joint Response Exercise (JRE 2027) คอเต่าซิป แขนสั้น โทนสีเทา–ดำ',
            size: matchedReg.shirt_size || 'L',
            color: 'สีเทาตัดดำ (Official Tactical Gray-Black)',
            quantity: 1,
            unit_price: 400
          }
        ],
        rawRegistration: matchedReg
      };
    }

    return null;
  };

  // Start Scanner
  const startScanner = async () => {
    try {
      setScanError('');
      setIsScanning(true);
      setScannedOrder(null);

      // Create instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleQrDecoded(decodedText);
        },
        (errorMessage) => {
          // ignore frame errors
        }
      );
    } catch (err) {
      console.warn('QR Scanner start failed:', err);
      setScanError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้อง หรือใช้การค้นหาด้วยรหัสคำสั่งซื้อ/เบอร์โทร/นามเรียกขาน');
      setIsScanning(false);
    }
  };

  // Stop Scanner
  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Parse QR content
  const handleQrDecoded = (decodedText) => {
    stopScanner();
    const matched = findMatchingItem(decodedText);

    if (matched) {
      setScannedOrder(matched);
      setActionSuccessMsg('');
    } else {
      setScanError(`ไม่พบข้อมูลออเดอร์หรือผู้สมัครจาก QR: ${decodedText}`);
    }
  };

  // Manual Search
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    const matched = findMatchingItem(manualQuery);

    if (matched) {
      setScannedOrder(matched);
      setScanError('');
      setActionSuccessMsg('');
    } else {
      setScannedOrder(null);
      setScanError(`ไม่พบข้อมูลที่ตรงกับ "${manualQuery}"`);
    }
  };

  const handleConfirmReceived = async () => {
    if (!scannedOrder || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const targetUserId = scannedOrder.user_id || scannedOrder.id?.replace('reg_shirt_', '');
      if (scannedOrder.itemType === 'registration') {
        if (onMarkRegistrationShirtReceived) {
          await onMarkRegistrationShirtReceived(targetUserId, true);
        }
        setActionSuccessMsg(`✓ บันทึกส่งมอบเสื้อฝึก (ไซส์ ${scannedOrder.shirt_size}) ให้แก่คุณ ${scannedOrder.customer_name} เรียบร้อยแล้ว!`);
      } else {
        await onMarkReceived(scannedOrder.id, 'Admin JRE 2027');
        setActionSuccessMsg(`✓ บันทึกส่งมอบสินค้าออเดอร์ ${scannedOrder.order_number} เรียบร้อยแล้ว!`);
      }
      setScannedOrder(prev => ({
        ...prev,
        pickup_status: 'received',
        pickup_at: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Error confirming handover:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกสถานะ');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUndoReceived = async () => {
    if (!scannedOrder || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const targetUserId = scannedOrder.user_id || scannedOrder.id?.replace('reg_shirt_', '');
      if (scannedOrder.itemType === 'registration') {
        if (onMarkRegistrationShirtReceived) {
          await onMarkRegistrationShirtReceived(targetUserId, false);
        }
        setActionSuccessMsg(`ยกเลิกการส่งมอบเสื้อฝึกคุณ ${scannedOrder.customer_name} เรียบร้อยแล้ว`);
      } else {
        if (onMarkReceived) {
          await onMarkReceived(scannedOrder.id, null, 'pending');
        }
        setActionSuccessMsg(`ยกเลิกการส่งมอบออเดอร์ ${scannedOrder.order_number} เรียบร้อยแล้ว`);
      }
      setScannedOrder(prev => ({
        ...prev,
        pickup_status: 'pending',
        pickup_at: null
      }));
    } catch (err) {
      console.error('Error undoing handover:', err);
      alert('เกิดข้อผิดพลาดในการยกเลิกสถานะ');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleQuickApprovePayment = async () => {
    if (!scannedOrder) return;
    try {
      if (scannedOrder.itemType === 'registration') {
        alert('กรุณาตรวจสอบยอดค่าสมัครของผู้สมัครที่เมนู "จัดการผู้สมัคร"');
        return;
      }
      await onVerifyPayment(scannedOrder.id, true, 'อนุมัติสลิปหน้างานโดย Admin');
      setScannedOrder({
        ...scannedOrder,
        payment_status: 'paid_verified',
        pickup_status: 'ready'
      });
      setActionSuccessMsg('อนุมัติยอดเงินเรียบร้อยแล้ว!');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอนุมัติสลิป');
    }
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700/80 max-w-xl w-full rounded-3xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                สแกน QR Code & ตรวจสอบรับเสื้อ/กางเกง
              </h3>
              <p className="text-xs text-slate-400">
                ระบบสแกนบัตรรับสินค้าดิจิทัลสำหรับเจ้าหน้าที่ JRE 2027
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Camera Controls */}
        <div className="mt-5 space-y-3">
          
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="กรอกรหัสออเดอร์ (เช่น JRE-ORDER-12345) หรือเบอร์โทร..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              ค้นหา
            </button>
          </form>

          {/* Camera Scan Button */}
          <div className="flex gap-2">
            {!isScanning ? (
              <button
                type="button"
                onClick={startScanner}
                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องสแกน QR Code</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>ปิดกล้องสแกน</span>
              </button>
            )}
          </div>

          {/* Camera Viewer Region */}
          <div 
            id={qrRegionId} 
            className={`w-full overflow-hidden rounded-2xl bg-black border border-slate-800 transition-all ${
              isScanning ? 'h-64 mt-2' : 'h-0'
            }`}
          />

          {scanError && (
            <div className="p-3 bg-rose-950/40 border border-rose-600/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Scanned Order Details Card */}
        {scannedOrder && (
          <div className="mt-5 p-4 bg-slate-950 border border-purple-500/40 rounded-2xl space-y-3.5 shadow-xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    scannedOrder.itemType === 'registration'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  }`}>
                    {scannedOrder.itemType === 'registration' ? '📋 เสื้อฝึกผู้สมัคร (ในค่าสมัคร)' : '🛍️ สั่งซื้อเพิ่ม (ร้านค้า)'}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-300">
                    {scannedOrder.order_number}
                  </span>
                </div>

                <h4 className="text-base font-black text-white">
                  {scannedOrder.customer_name}
                  {scannedOrder.nickname && scannedOrder.nickname !== '-' && (
                    <span className="text-amber-300 ml-1.5 font-bold text-sm">({scannedOrder.nickname})</span>
                  )}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                  {scannedOrder.callsign && scannedOrder.callsign !== '-' && (
                    <span className="text-sky-300 font-mono font-bold">
                      📡 {scannedOrder.callsign}
                    </span>
                  )}
                  {scannedOrder.institution && scannedOrder.institution !== '-' && (
                    <span>🏛️ {scannedOrder.institution}</span>
                  )}
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <a href={`tel:${scannedOrder.customer_phone}`} className="text-indigo-400 hover:underline">{scannedOrder.customer_phone}</a>
                  </p>
                </div>

                {( (scannedOrder.group_assigned && scannedOrder.group_assigned !== '-') || (scannedOrder.room_assigned && scannedOrder.room_assigned !== '-') ) && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                    {scannedOrder.group_assigned && scannedOrder.group_assigned !== '-' && (
                      <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800">
                        กลุ่ม: {scannedOrder.group_assigned}
                      </span>
                    )}
                    {scannedOrder.room_assigned && scannedOrder.room_assigned !== '-' && (
                      <span className="px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-800">
                        ห้องพัก: {scannedOrder.room_assigned}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="text-left sm:text-right space-y-1">
                {scannedOrder.pickup_status === 'received' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] rounded-full font-bold">
                    <PackageCheck className="w-3 h-3" /> รับเสื้อแล้ว
                  </span>
                ) : scannedOrder.payment_status === 'paid_verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว • รอรับเสื้อ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] rounded-full font-bold">
                    <Clock className="w-3 h-3" /> รอตรวจสลิป
                  </span>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  รายการเสื้อที่ต้องส่งมอบ:
                </p>
                <div className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-black">
                  👕 ไซส์ {scannedOrder.shirt_size}
                </div>
              </div>
              <div className="space-y-1.5 divide-y divide-slate-800/60">
                {scannedOrder.items?.map((it, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{it.product_name}</p>
                      <p className="text-[11px] text-slate-400">
                        ไซต์: <span className="text-amber-300 font-bold text-sm">ไซส์ {it.size}</span>
                        {it.extra_price > 0 && <span className="text-amber-400 ml-1">(+{it.extra_price} บ.)</span>}
                        {it.color && <span> • {it.color}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-slate-800 text-white rounded-lg font-black text-xs">
                        x{it.quantity} ตัว
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">ยอดชำระ:</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {scannedOrder.itemType === 'registration' 
                    ? `${scannedOrder.total_amount} บาท (ค่าสมัครรวมเสื้อ)` 
                    : `${scannedOrder.total_amount} บาท`}
                </span>
              </div>
            </div>

            {/* Slip Preview if present */}
            {scannedOrder.slip_url && (
              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={scannedOrder.slip_url}
                    alt="Slip"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                  />
                  <div>
                    <p className="font-bold text-slate-300">สลิปโอนเงิน</p>
                    <p className="text-[10px] text-slate-500">
                      {scannedOrder.payment_status === 'paid_verified' ? 'ตรวจสอบแล้ว' : 'รอการอนุมัติ'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewSlip(scannedOrder.slip_url)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูสลิป</span>
                  </button>

                  {scannedOrder.itemType !== 'registration' && scannedOrder.payment_status !== 'paid_verified' && (
                    <button
                      type="button"
                      onClick={handleQuickApprovePayment}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      อนุมัติยอดเงิน
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Admin Action: Mark as Received */}
            <div className="pt-2">
              {scannedOrder.pickup_status === 'received' ? (
                <div className="space-y-2">
                  <div className="w-full py-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                    <PackageCheck className="w-4 h-4" />
                    <span>ส่งมอบเสื้อไซส์ {scannedOrder.shirt_size} เรียบร้อยแล้ว {scannedOrder.pickup_at ? `(${new Date(scannedOrder.pickup_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUndoReceived}
                    disabled={isActionLoading}
                    className="w-full py-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-50 text-[11px] font-semibold transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>ยกเลิกสถานะส่งมอบ (เปลี่ยนกลับเป็นยังไม่ได้รับ)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmReceived}
                  disabled={isActionLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>กำลังบันทึกส่งมอบ...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-5 h-5" />
                      <span>ยืนยันส่งมอบเสื้อ ไซส์ {scannedOrder.shirt_size} ให้ผู้รับเรียบร้อย</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

        {/* Modal footer */}
        <div className="mt-5 text-right">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        </div>
      </div>

      {/* Full Document & Slip Preview Modal with Direct Link Copy */}
      <DocumentPreviewModal
        isOpen={Boolean(previewSlip)}
        onClose={() => setPreviewSlip(null)}
        doc={previewSlip ? {
          fileUrl: previewSlip,
          fileName: `slip-${scannedOrder?.order_number || 'scan'}.jpg`,
          title: `สลิปโอนเงิน - ${scannedOrder?.customer_name || 'ผู้รับสินค้า'}`
        } : null}
      />
    </ModalPortal>
  );
}
