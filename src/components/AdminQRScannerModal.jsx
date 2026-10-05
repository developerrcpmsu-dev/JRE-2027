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
  RefreshCw
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function AdminQRScannerModal({ 
  orders = [], 
  onMarkReceived, 
  onClose,
  onVerifyPayment
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [scannedOrder, setScannedOrder] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [previewSlip, setPreviewSlip] = useState(null);

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
      setScanError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้อง หรือใช้การค้นหาด้วยรหัสคำสั่งซื้อ');
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

    let targetOrderNumber = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.order_number) {
        targetOrderNumber = parsed.order_number;
      }
    } catch (e) {
      // plain text order number
    }

    const matched = orders.find(
      o => o.order_number?.toLowerCase() === targetOrderNumber?.toLowerCase() ||
           o.id === targetOrderNumber
    );

    if (matched) {
      setScannedOrder(matched);
      setActionSuccessMsg('');
    } else {
      setScanError(`ไม่พบข้อมูลออเดอร์จาก QR: ${targetOrderNumber}`);
    }
  };

  // Manual Search
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    const q = manualQuery.trim().toLowerCase();
    const matched = orders.find(
      o => o.order_number?.toLowerCase().includes(q) ||
           o.customer_phone?.includes(q) ||
           o.customer_name?.toLowerCase().includes(q)
    );

    if (matched) {
      setScannedOrder(matched);
      setScanError('');
      setActionSuccessMsg('');
    } else {
      setScannedOrder(null);
      setScanError(`ไม่พบคำสั่งซื้อที่ตรงกับ "${manualQuery}"`);
    }
  };

  const handleConfirmReceived = async () => {
    if (!scannedOrder) return;
    try {
      await onMarkReceived(scannedOrder.id, 'Admin JRE 2027');
      setActionSuccessMsg('บันทึกการส่งมอบสินค้าเรียบร้อยแล้ว!');
      // Update local view
      setScannedOrder({
        ...scannedOrder,
        pickup_status: 'received',
        pickup_at: new Date().toISOString()
      });
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกสถานะ');
    }
  };

  const handleQuickApprovePayment = async () => {
    if (!scannedOrder) return;
    try {
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
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-black text-purple-400">
                  {scannedOrder.order_number}
                </span>
                <h4 className="text-base font-black text-white mt-0.5">
                  {scannedOrder.customer_name}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{scannedOrder.customer_phone}</span>
                  {scannedOrder.user_email && <span>• {scannedOrder.user_email}</span>}
                </p>
              </div>

              {/* Status Badges */}
              <div className="text-right space-y-1">
                {scannedOrder.pickup_status === 'received' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] rounded-full font-bold">
                    <PackageCheck className="w-3 h-3" /> รับของแล้ว
                  </span>
                ) : scannedOrder.payment_status === 'paid_verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว • รอส่งมอบ
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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                รายการสินค้าที่ต้องส่งมอบ:
              </p>
              <div className="space-y-1.5 divide-y divide-slate-800/60">
                {scannedOrder.items?.map((it, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{it.product_name}</p>
                      <p className="text-[11px] text-slate-400">
                        ไซต์: <span className="text-purple-400 font-bold">{it.size}</span>
                        {it.extra_price > 0 && <span className="text-amber-400 ml-1">(+{it.extra_price} บ.)</span>}
                        {it.color && <span> • {it.color}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-black text-xs">
                        x{it.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">ยอดชำระสุทธิ:</span>
                <span className="text-sm font-black text-purple-400 font-mono">
                  {scannedOrder.total_amount} บาท
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
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูสลิป</span>
                  </button>

                  {scannedOrder.payment_status !== 'paid_verified' && (
                    <button
                      type="button"
                      onClick={handleQuickApprovePayment}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
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
                <div className="w-full py-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                  <PackageCheck className="w-4 h-4" />
                  <span>สินค้ารายการนี้ถูกส่งมอบเรียบร้อยแล้ว</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmReceived}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>ยืนยันการส่งมอบสินค้าเรียบร้อย (Mark as Received)</span>
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

      {/* Slip Modal */}
      {previewSlip && (
        <ModalPortal isOpen={Boolean(previewSlip)} onClose={() => setPreviewSlip(null)}>
          <div 
            onClick={() => setPreviewSlip(null)}
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          >
            <div className="relative max-w-lg max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <img src={previewSlip} alt="Slip Full" className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-slate-700 shadow-2xl" />
              <button
                type="button"
                onClick={() => setPreviewSlip(null)}
                className="absolute top-3 right-3 p-2 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </ModalPortal>
  );
}
