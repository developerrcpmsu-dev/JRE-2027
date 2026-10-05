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
  Calendar,
  AlertCircle,
  Copy,
  Check
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
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700/80 max-w-md w-full rounded-3xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Header */}
        <div className="text-center pb-4 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rescue-500/10 text-rescue-400 border border-rescue-500/30 mb-2">
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Pickup Pass • JRE 2027</span>
          </div>
          <h3 className="text-xl font-black text-white">
            บัตรรับสินค้า / เสื้อ-กางเกง
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            แสดง QR Code หรือรหัสออเดอร์นี้แก่เจ้าหน้าที่ ณ จุดรับสินค้า
          </p>
        </div>

        {/* Status Banner */}
        <div className="mt-4">
          {isReceived ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 flex items-center gap-3 text-emerald-300">
              <PackageCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-200">รับสินค้าเรียบร้อยแล้ว</p>
                <p className="text-[11px] text-emerald-300/80">
                  {order.pickup_at ? `เมื่อ ${new Date(order.pickup_at).toLocaleString('th-TH')}` : 'บันทึกการรับสินค้าเรียบร้อย'}
                </p>
              </div>
            </div>
          ) : isVerified ? (
            <div className="bg-blue-950/60 border border-blue-500/40 rounded-2xl p-3 flex items-center gap-3 text-blue-300">
              <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-blue-200">ยอดเงินถูกต้องแล้ว • พร้อมรับสินค้า</p>
                <p className="text-[11px] text-blue-300/80">
                  สามารถยื่น QR Code นี้ให้แอดมินสแกนรับของได้ทันที
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/60 border border-amber-500/40 rounded-2xl p-3 flex items-center gap-3 text-amber-300">
              <Clock className="w-6 h-6 text-amber-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-amber-200">กำลังรอเจ้าหน้าที่ตรวจสอบสลิป</p>
                <p className="text-[11px] text-amber-300/80">
                  เมื่อฝ่ายการเงินอนุมัติสลิปแล้ว จะสามารถสแกนรับสินค้าได้ทันที
                </p>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="mt-5 flex flex-col items-center">
          <div className="p-3 bg-white rounded-3xl shadow-xl border-4 border-rescue-500/30">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt={`QR ${order.order_number}`} 
                className="w-56 h-56 rounded-xl object-contain"
              />
            ) : (
              <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>

          {/* Order Number Pill */}
          <div className="mt-4 flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">รหัสคำสั่งซื้อ:</span>
            <span className="text-sm font-black text-rescue-400 font-mono tracking-wider">
              {order.order_number}
            </span>
            <button
              onClick={handleCopyOrderNumber}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="คัดลอกรหัสออเดอร์"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Order Details List */}
        <div className="mt-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5" /> ผู้สั่งซื้อ:
            </span>
            <span className="font-bold text-white">{order.customer_name}</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์:
            </span>
            <span className="font-semibold text-white">{order.customer_phone}</span>
          </div>

          <div className="border-t border-slate-800 pt-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                  <div className="text-right">
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

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-rescue-400" />
            <span>บันทึกรูป QR Code</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-6 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-rescue-600/20"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  </ModalPortal>
);
}
