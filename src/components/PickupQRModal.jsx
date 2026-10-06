import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  Download, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function PickupQRModal({ order, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order) return;
    // Generate QR Code containing the order number and verification payload
    const qrPayload = JSON.stringify({
      order_number: order.order_number,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      app: 'JRE2027_MERCHANDISE'
    });

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [order]);

  if (!order) return null;

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `PickupPass-${order.order_number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isVerified = order.payment_status === 'paid_verified';
  const isReceived = order.pickup_status === 'received';

  return (
    <ModalPortal isOpen={Boolean(order)} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700/80 max-w-md w-full rounded-3xl shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        
          {/* 1. FIXED HEADER (Never scrolled away) */}
          <div className="shrink-0 px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rescue-500/20 text-rescue-400 border border-rescue-500/40 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                  บัตรรับสินค้า / เสื้อ-กางเกง
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  Digital Pickup Pass • โครงการ JRE 2027
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors active:scale-90"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* 2. SCROLLABLE CONTENT BODY (Fits all screens without overflowing) */}
          <div className="overflow-y-auto overscroll-contain flex-1 px-4 sm:px-5 py-4 space-y-4">
            
            {/* Status Banner - Explicit "รับแล้ว" vs "ยังไม่ได้รับ" */}
            <div>
              {isReceived ? (
                <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/30 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-3.5 flex items-start gap-3 text-emerald-300 shadow-lg shadow-emerald-950/40">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 mt-0.5">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-sm text-emerald-200 flex items-center gap-1.5">
                      <span>🟢 รับสินค้าแล้ว (ส่งมอบเรียบร้อย)</span>
                    </p>
                    <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                      {order.pickup_at 
                        ? `ผู้รับได้รับสินค้าแล้ว เมื่อ ${new Date(order.pickup_at).toLocaleString('th-TH')}` 
                        : 'ผู้รับได้รับสินค้า/เสื้อโครงการเรียบร้อยแล้ว'}
                      {order.pickup_by_admin ? ` • จนท: ${order.pickup_by_admin}` : ''}
                    </p>
                  </div>
                </div>
              ) : isVerified ? (
                <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-amber-950/40 border-2 border-blue-500/50 rounded-2xl p-3.5 flex items-start gap-3 text-blue-300 shadow-lg shadow-blue-950/30">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/40 mt-0.5">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-sm text-blue-200 flex items-center gap-1.5">
                      <span>🟡 ยังไม่ได้รับสินค้า (รอรับของหน้างาน)</span>
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      ชำระเงินเรียบร้อยแล้ว • ยื่น QR Code นี้ต่อเจ้าหน้าที่ ณ จุดรับของ อาคารพลศึกษา มมส
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/30 border-2 border-amber-500/50 rounded-2xl p-3.5 flex items-start gap-3 text-amber-300 shadow-lg shadow-amber-950/30">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-sm text-amber-200 flex items-center gap-1.5">
                      <span>🔴 ยังไม่ได้รับสินค้า (รอตรวจสอบสลิป)</span>
                    </p>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      กำลังรอเจ้าหน้าที่ยืนยันยอดเงิน เมื่อตรวจสอบผ่านแล้วจะสามารถสแกนรับสินค้าได้ทันที
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center">
              <div className="relative p-2.5 sm:p-3 bg-white rounded-3xl shadow-xl border-4 border-rescue-500/30">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt={`QR ${order.order_number}`} 
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-48 sm:h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    กำลังสร้าง QR Code...
                  </div>
                )}

                {/* Received Overlay Watermark */}
                {isReceived && (
                  <div className="absolute inset-0 m-2.5 sm:m-3 bg-slate-950/85 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-3 text-center border-2 border-emerald-500 shadow-2xl animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mb-1">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <p className="font-black text-xs sm:text-sm text-emerald-300">
                      ✓ รับสินค้าเรียบร้อยแล้ว
                    </p>
                    <span className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                      DELIVERED
                    </span>
                  </div>
                )}
              </div>

              {/* Order Number Pill */}
              <div className="mt-3 flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">รหัสออเดอร์:</span>
                <span className="text-xs sm:text-sm font-black text-rescue-400 font-mono tracking-wider">
                  {order.order_number}
                </span>
                <button
                  onClick={handleCopyOrderNumber}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors active:scale-95 cursor-pointer"
                  title="คัดลอกรหัสออเดอร์"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Order Details List with Explicit Delivery Status */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 text-xs space-y-2.5">
              
              {/* Pickup Status Row */}
              <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-800/80">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <PackageCheck className="w-3.5 h-3.5 text-rescue-400" /> สถานะการรับของ:
                </span>
                {isReceived ? (
                  <span className="px-2.5 py-0.5 rounded-full font-black text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> รับสินค้าแล้ว (ส่งมอบแล้ว)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full font-black text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> ยังไม่ได้รับสินค้า (รอรับของ)
                  </span>
                )}
              </div>

              {/* Payment Status Row */}
              <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-800/80">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> สถานะชำระเงิน:
                </span>
                {isVerified ? (
                  <span className="font-bold text-emerald-400">
                    ✓ ชำระแล้ว (อนุมัติแล้ว)
                  </span>
                ) : (
                  <span className="font-bold text-amber-400">
                    ⏳ รอตรวจสอบสลิป
                  </span>
                )}
              </div>

              {/* Customer Info */}
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <User className="w-3.5 h-3.5" /> ผู้สั่งซื้อ:
                </span>
                <span className="font-bold text-white truncate max-w-[200px] text-right">{order.customer_name}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Phone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์:
                </span>
                <span className="font-semibold text-white font-mono">{order.customer_phone || '-'}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" /> จุดรับสินค้า:
                </span>
                <span className="text-slate-300 text-[11px] text-right truncate max-w-[200px]">
                  {order.pickup_location || 'อาคารพลศึกษา มมส (13 ก.พ. 2570)'}
                </span>
              </div>

              {/* Items List */}
              <div className="border-t border-slate-800 pt-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  รายการสินค้า ({order.items?.length || 0} รายการ):
                </p>
                <div className="space-y-1.5">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px] bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                      <div>
                        <p className="font-bold text-slate-200">{item.product_name}</p>
                        <p className="text-slate-400 text-[10px]">
                          ไซต์: <span className="text-rescue-400 font-bold">{item.size}</span>
                          {item.extra_price > 0 && <span className="text-amber-400 ml-1">(+{item.extra_price} บ.)</span>}
                          {item.color && <span> • {item.color}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-white">x{item.quantity}</p>
                        <p className="text-rescue-400 font-bold">{item.unit_price * item.quantity} บ.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-sm">
                <span className="text-slate-300">ยอดชำระสุทธิ:</span>
                <span className="text-rescue-400 text-base font-black">{order.total_amount} บาท</span>
              </div>
            </div>

          </div>

          {/* 3. FIXED FOOTER (Never pushed off screen) */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex gap-2.5">
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="flex-1 py-2.5 sm:py-3 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-rescue-400" />
              <span>บันทึกรูป QR Code</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 sm:py-3 px-5 sm:px-6 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-rescue-600/20 cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
