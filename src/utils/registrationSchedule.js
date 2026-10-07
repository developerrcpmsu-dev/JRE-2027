import { DEFAULT_PAYMENT_CONFIG } from '../data/defaultData';

/**
 * Format Date object or ISO string to standard Thai Date and Time
 * Example: "15 ตุลาคม 2569 เวลา 08:30 น."
 */
export function formatThaiDateTime(dt) {
  if (!dt) return '-';
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d.getTime())) return '-';

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
}

/**
 * Format Date object or ISO string into datetime-local input string: "YYYY-MM-DDTHH:mm"
 */
export function formatDateTimeLocalInput(dt) {
  if (!dt) return '';
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Calculate remaining time breakdown down to seconds between now and targetDate
 */
export function calculateCountdown(targetDate) {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (isNaN(diffMs) || diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    isPast: false
  };
}

/**
 * Evaluates registration schedule status:
 * Returns status: 'upcoming' | 'open' | 'closed'
 */
export function getRegistrationScheduleStatus(paymentConfig) {
  const cfg = paymentConfig || DEFAULT_PAYMENT_CONFIG;
  const override = cfg?.reg_status_override || 'auto';
  const now = new Date();

  const openTime = cfg?.reg_open_datetime ? new Date(cfg.reg_open_datetime) : null;
  const closeTime = cfg?.reg_close_datetime ? new Date(cfg.reg_close_datetime) : null;

  const validOpen = openTime && !isNaN(openTime.getTime()) ? openTime : null;
  const validClose = closeTime && !isNaN(closeTime.getTime()) ? closeTime : null;

  // 1. Force Open Override
  if (override === 'force_open') {
    return {
      status: 'open',
      isOverridden: true,
      overrideType: 'force_open',
      label: 'เปิดรับสมัคร (เปิดทันทีโดยผู้ดูแลระบบ)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      openTime: validOpen,
      closeTime: validClose,
      openTimeFormatted: formatThaiDateTime(validOpen),
      closeTimeFormatted: formatThaiDateTime(validClose),
      targetDate: validClose,
      isUpcoming: false,
      isOpen: true,
      isClosed: false,
      message: 'ระบบเปิดรับสมัครผู้เข้าร่วมการฝึกอบรม JRE 2027 อยู่ในขณะนี้'
    };
  }

  // 2. Force Closed Override
  if (override === 'force_closed') {
    return {
      status: 'closed',
      isOverridden: true,
      overrideType: 'force_closed',
      label: 'ปิดรับสมัครแล้ว (ปิดทันทีโดยผู้ดูแลระบบ)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      openTime: validOpen,
      closeTime: validClose,
      openTimeFormatted: formatThaiDateTime(validOpen),
      closeTimeFormatted: formatThaiDateTime(validClose),
      targetDate: null,
      isUpcoming: false,
      isOpen: false,
      isClosed: true,
      message: cfg?.reg_closed_message || 'โครงการ JRE 2027 ได้ปิดรับสมัครผู้เข้าร่วมการฝึกอบรมแล้ว'
    };
  }

  // 3. Auto Mode (Check dates)
  if (validOpen && now < validOpen) {
    return {
      status: 'upcoming',
      isOverridden: false,
      overrideType: 'auto',
      label: 'รอนับเวลาเปิดรับสมัคร',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      openTime: validOpen,
      closeTime: validClose,
      openTimeFormatted: formatThaiDateTime(validOpen),
      closeTimeFormatted: formatThaiDateTime(validClose),
      targetDate: validOpen,
      isUpcoming: true,
      isOpen: false,
      isClosed: false,
      message: `ระบบจะเปิดรับสมัครอย่างเป็นทางการในวันที่ ${formatThaiDateTime(validOpen)}`
    };
  }

  if (validClose && now > validClose) {
    return {
      status: 'closed',
      isOverridden: false,
      overrideType: 'auto',
      label: 'ปิดรับสมัครแล้วอย่างเป็นทางการ',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      openTime: validOpen,
      closeTime: validClose,
      openTimeFormatted: formatThaiDateTime(validOpen),
      closeTimeFormatted: formatThaiDateTime(validClose),
      targetDate: null,
      isUpcoming: false,
      isOpen: false,
      isClosed: true,
      message: cfg?.reg_closed_message || 'สิ้นสุดระยะเวลาการเปิดรับสมัครเข้าร่วมโครงการ JRE 2027 แล้วอย่างเป็นทางการ'
    };
  }

  return {
    status: 'open',
    isOverridden: false,
    overrideType: 'auto',
    label: 'เปิดรับสมัครอยู่ในขณะนี้',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    openTime: validOpen,
    closeTime: validClose,
    openTimeFormatted: formatThaiDateTime(validOpen),
    closeTimeFormatted: formatThaiDateTime(validClose),
    targetDate: validClose,
    isUpcoming: false,
    isOpen: true,
    isClosed: false,
    message: validClose ? `เปิดรับสมัครจนถึงวันที่ ${formatThaiDateTime(validClose)}` : 'เปิดรับสมัครอยู่ในขณะนี้'
  };
}
