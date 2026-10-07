import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Flame,
  Hourglass
} from 'lucide-react';
import { 
  getRegistrationScheduleStatus, 
  calculateCountdown, 
  formatThaiDateTime 
} from '../utils/registrationSchedule';

/**
 * Dual Live Countdown Timer Component for Registration Schedule:
 * - When Upcoming: Displays "นับเวลารอ" (Opening Countdown)
 * - When Open: Displays "นับเวลาถอยหลัง" (Closing Countdown)
 * - When Closed: Displays "ปิดรับสมัครแล้วอย่างเป็นทางการ"
 */
export default function RegistrationCountdown({
  paymentConfig,
  variant = 'card', // 'card' | 'banner' | 'admin' | 'badge'
  onStatusChange,
  className = ''
}) {
  const [schedule, setSchedule] = useState(() => getRegistrationScheduleStatus(paymentConfig));
  const [countdown, setCountdown] = useState(() => calculateCountdown(schedule.targetDate));

  useEffect(() => {
    // Initial evaluation
    const initialSchedule = getRegistrationScheduleStatus(paymentConfig);
    setSchedule(initialSchedule);
    setCountdown(calculateCountdown(initialSchedule.targetDate));

    // Live 1-second interval
    const interval = setInterval(() => {
      const currentSchedule = getRegistrationScheduleStatus(paymentConfig);
      
      // Notify parent if status flipped (e.g. from upcoming to open, or open to closed)
      if (currentSchedule.status !== schedule.status && onStatusChange) {
        onStatusChange(currentSchedule.status);
      }
      
      setSchedule(currentSchedule);
      setCountdown(calculateCountdown(currentSchedule.targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentConfig, schedule.status, onStatusChange]);

  const { status, label, badgeClass, openTimeFormatted, closeTimeFormatted, isOverridden, overrideType } = schedule;
  const { days, hours, minutes, seconds } = countdown;

  // 1. COMPACT BADGE VARIANT
  if (variant === 'badge') {
    if (status === 'upcoming') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badgeClass} ${className}`}>
          <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>รอนับเวลาเปิด ({days}ว {hours}ชม {minutes}น {seconds}วิ)</span>
        </span>
      );
    }
    if (status === 'open') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badgeClass} ${className}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>เปิดรับสมัครอยู่ (เหลือ {days}ว {hours}ชม {minutes}น {seconds}วิ)</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badgeClass} ${className}`}>
        <Lock className="w-3.5 h-3.5 text-rose-400" />
        <span>ปิดรับสมัครแล้ว</span>
      </span>
    );
  }

  // 2. BANNER VARIANT (Used at top of Registration form or Step indicators)
  if (variant === 'banner') {
    if (status === 'upcoming') {
      return (
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Hourglass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">ระบบนับเวลารอเปิดรับสมัคร</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Upcoming</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                เปิดรับสมัครอย่างเป็นทางการ: <strong className="text-white">{openTimeFormatted}</strong>
              </p>
            </div>
          </div>

          {/* Countdown digits */}
          <div className="flex items-center gap-2 font-mono text-center shrink-0">
            <div className="bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-amber-400">{String(days).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">วัน</div>
            </div>
            <span className="text-amber-400/60 font-black text-lg">:</span>
            <div className="bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-amber-400">{String(hours).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">ชม.</div>
            </div>
            <span className="text-amber-400/60 font-black text-lg">:</span>
            <div className="bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-amber-400">{String(minutes).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">นาที</div>
            </div>
            <span className="text-amber-400/60 font-black text-lg">:</span>
            <div className="bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-amber-300 animate-pulse">{String(seconds).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">วินาที</div>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'open') {
      return (
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/60 border border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">เปิดรับสมัครอยู่ในขณะนี้</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                กำหนดปิดรับสมัคร: <strong className="text-white">{closeTimeFormatted}</strong>
              </p>
            </div>
          </div>

          {/* Countdown digits */}
          <div className="flex items-center gap-2 font-mono text-center shrink-0">
            <div className="bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-emerald-400">{String(days).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">วัน</div>
            </div>
            <span className="text-emerald-400/60 font-black text-lg">:</span>
            <div className="bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-emerald-400">{String(hours).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">ชม.</div>
            </div>
            <span className="text-emerald-400/60 font-black text-lg">:</span>
            <div className="bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-emerald-400">{String(minutes).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">นาที</div>
            </div>
            <span className="text-emerald-400/60 font-black text-lg">:</span>
            <div className="bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <div className="text-lg font-black text-emerald-300 animate-pulse">{String(seconds).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 font-sans uppercase">วินาที</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 border border-rose-500/40 shadow-xl flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
            <Lock className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-rose-400 tracking-wider">ปิดรับสมัครแล้วอย่างเป็นทางการ</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">Closed</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              สิ้นสุดระยะเวลารับสมัครเมื่อ: <strong className="text-white">{closeTimeFormatted}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. ADMIN PREVIEW VARIANT
  if (variant === 'admin') {
    return (
      <div className={`p-5 rounded-2xl border transition-all ${
        status === 'open' 
          ? 'bg-emerald-950/20 border-emerald-500/40' 
          : status === 'upcoming' 
            ? 'bg-amber-950/20 border-amber-500/40' 
            : 'bg-rose-950/20 border-rose-500/40'
      } ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              status === 'open' ? 'bg-emerald-400 animate-ping' : status === 'upcoming' ? 'bg-amber-400 animate-bounce' : 'bg-rose-500'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  {status === 'open' && '🟢 สถานะ: กำลังเปิดรับสมัคร (Open)'}
                  {status === 'upcoming' && '🟡 สถานะ: รอนับเวลาเปิดรับสมัคร (Upcoming Waiting)'}
                  {status === 'closed' && '🔴 สถานะ: ปิดรับสมัครแล้ว (Closed)'}
                </h4>
                {isOverridden && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    ⚡ แอดมินบังคับ ({overrideType === 'force_open' ? 'เปิดทันที' : 'ปิดทันที'})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {status === 'open' && `เปิดถึง ${closeTimeFormatted}`}
                {status === 'upcoming' && `จะเริ่มเปิด ${openTimeFormatted}`}
                {status === 'closed' && `ปิดเมื่อ ${closeTimeFormatted}`}
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
            {label}
          </span>
        </div>

        {/* Live Admin Countdown ticker */}
        {status !== 'closed' ? (
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-medium">
              {status === 'upcoming' ? '⏳ นับเวลาถอยหลังรอเปิด:' : '⚡ นับเวลาถอยหลังก่อนปิด:'}
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white">
                {days} <span className="text-[10px] text-slate-400 font-sans">วัน</span>
              </span>
              <span className="text-slate-500">:</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white">
                {String(hours).padStart(2, '0')} <span className="text-[10px] text-slate-400 font-sans">ชม.</span>
              </span>
              <span className="text-slate-500">:</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white">
                {String(minutes).padStart(2, '0')} <span className="text-[10px] text-slate-400 font-sans">นาที</span>
              </span>
              <span className="text-slate-500">:</span>
              <span className={`px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg ${
                status === 'open' ? 'text-emerald-300' : 'text-amber-300'
              } animate-pulse`}>
                {String(seconds).padStart(2, '0')} <span className="text-[10px] text-slate-400 font-sans">วิ</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>ระบบปิดรับสมัครแล้ว ผู้สมัครใหม่ไม่สามารถส่งใบสมัครได้ (ผู้ที่เลือกผ่อนชำระสามารถส่งสลิปงวด 2 ได้ตามปกติ)</span>
          </div>
        )}
      </div>
    );
  }

  // 4. FULL CARD VARIANT (Default for Waiting Screen / Closed Screen / Hero)
  if (status === 'upcoming') {
    return (
      <div className={`bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6 ${className}`}>
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/20 border-2 border-amber-500/40 rounded-3xl mx-auto flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 mb-4">
            <Hourglass className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>ระบบนับเวลารอเปิดรับสมัคร (Waiting Countdown)</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ระบบรับสมัคร JRE 2027 จะเปิดอย่างเป็นทางการในอีก
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
            กำหนดเริ่มเปิดรับสมัคร: <strong className="text-amber-300">{openTimeFormatted}</strong>
          </p>
        </div>

        {/* Large 4 Digit Blocks */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto relative font-mono">
          <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-400 drop-shadow">
              {String(days).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
              วัน (Days)
            </div>
          </div>

          <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-400 drop-shadow">
              {String(hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
              ชม. (Hours)
            </div>
          </div>

          <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-400 drop-shadow">
              {String(minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
              นาที (Mins)
            </div>
          </div>

          <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
            <div className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-300 drop-shadow animate-pulse">
              {String(seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
              วินาที (Secs)
            </div>
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 max-w-xl mx-auto space-y-2 text-left">
          <div className="flex items-center gap-2 font-bold text-white text-sm border-b border-slate-800 pb-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>คำแนะนำการเตรียมตัวก่อนระบบเปิดรับสมัคร:</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • ผู้สมัครสามารถเข้าสู่ระบบด้วยบัญชี Google ไว้ล่วงหน้า เพื่อสร้างโปรไฟล์และบันทึกข้อมูลส่วนตัว<br />
            • เตรียมภาพถ่ายบัตรประชาชน/นิสิต และข้อมูลการสังกัดชมรมให้พร้อม<br />
            • โครงการรองรับทั้งการชำระเต็มจำนวน และการแบ่งชำระ 2 งวด (งวดที่ 1 400 บาท)
          </p>
        </div>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <div className={`bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6 ${className}`}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500/20 border-2 border-rose-500/40 rounded-3xl mx-auto flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10 mb-4">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <span>ปิดรับสมัครแล้วอย่างเป็นทางการ (Registration Closed)</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          ปิดรับสมัครเข้าร่วมโครงการ JRE 2027 แล้ว
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          {paymentConfig?.reg_closed_message || 'โครงการ JRE 2027 ได้ปิดรับสมัครผู้เข้าร่วมการฝึกอบรมอย่างเป็นทางการแล้ว'}
        </p>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-xl mx-auto text-xs text-slate-300 text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>สำหรับผู้สมัครที่ลงทะเบียนสำเร็จแล้ว:</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            • <strong>ผู้ที่เลือกแบ่งชำระ 2 งวด:</strong> ท่านถือเป็นผู้เข้าร่วมโครงการแล้ว และยังคงสามารถเข้าสู่ระบบเพื่อตรวจสอบสถานะห้องนอน กลุ่มฝึก และแนบสลิปชำระเงินงวดที่ 2 (กำหนดชำระ 1-5 พ.ย. 2569 หรือชำระล่วงหน้าได้ตลอดเวลา)<br />
            • <strong>ผู้ที่ชำระเต็มจำนวน:</strong> ข้อมูลของท่านได้รับการบันทึกและคุ้มครองในระบบอย่างสมบูรณ์แล้ว
          </p>
        </div>
      </div>
    );
  }

  // Open Status Full Card
  return (
    <div className={`bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6 ${className}`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-3xl mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 mb-4">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-pulse" />
      </div>

      <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>เปิดรับสมัครอยู่ในขณะนี้ (Registration Active)</span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
        เหลือเวลาอีกก่อนปิดรับสมัคร
      </h3>
      <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
        กำหนดปิดรับสมัครอย่างเป็นทางการ: <strong className="text-emerald-300">{closeTimeFormatted}</strong>
      </p>

      {/* Large 4 Digit Blocks */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto relative font-mono">
        <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
          <div className="text-2xl sm:text-4xl md:text-5xl font-black text-emerald-400 drop-shadow">
            {String(days).padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
            วัน (Days)
          </div>
        </div>

        <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
          <div className="text-2xl sm:text-4xl md:text-5xl font-black text-emerald-400 drop-shadow">
            {String(hours).padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
            ชม. (Hours)
          </div>
        </div>

        <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
          <div className="text-2xl sm:text-4xl md:text-5xl font-black text-emerald-400 drop-shadow">
            {String(minutes).padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
            นาที (Mins)
          </div>
        </div>

        <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl text-center transform hover:scale-105 transition-transform">
          <div className="text-2xl sm:text-4xl md:text-5xl font-black text-emerald-300 drop-shadow animate-pulse">
            {String(seconds).padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs font-sans font-bold text-slate-400 uppercase mt-1">
            วินาที (Secs)
          </div>
        </div>
      </div>
    </div>
  );
}
