/**
 * Age Calculator Utility for JRE-2027
 * Calculates exact age in years, months, and days from Date of Birth
 * Supports both Buddhist Era (พ.ศ.) and Christian Era (ค.ศ.)
 */

export function calculateAgeDetailed(birthYear, birthMonth, birthDay) {
  // Support passing a single date string ("DD/MM/YYYY" or "YYYY-MM-DD")
  if (typeof birthYear === 'string' && !birthMonth && !birthDay) {
    const raw = birthYear.trim();
    if (raw.includes('/')) {
      const parts = raw.split('/').map((p) => parseInt(p.trim(), 10));
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        // Check if format is DD/MM/YYYY or YYYY/MM/DD
        if (parts[0] > 31) {
          return calculateAgeDetailed(parts[0], parts[1], parts[2]);
        }
        return calculateAgeDetailed(parts[2], parts[1], parts[0]);
      }
    } else if (raw.includes('-')) {
      const parts = raw.split('-').map((p) => parseInt(p.trim(), 10));
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        if (parts[0] > 31) {
          return calculateAgeDetailed(parts[0], parts[1], parts[2]);
        }
        return calculateAgeDetailed(parts[2], parts[1], parts[0]);
      }
    }
  }

  if (!birthYear || !birthMonth || !birthDay) {
    return { years: 0, months: 0, days: 0, formatted: '-' };
  }

  let year = parseInt(birthYear, 10);
  const month = parseInt(birthMonth, 10) - 1; // 0-indexed in JS Date
  const day = parseInt(birthDay, 10);

  // If year is in Buddhist Era (e.g. 2548 > 2400), convert to Christian Era
  if (year > 2400) {
    year = year - 543;
  }

  const birthDate = new Date(year, month, day);
  const today = new Date();

  if (isNaN(birthDate.getTime()) || birthDate > today) {
    return { years: 0, months: 0, days: 0, formatted: 'วันที่เกิดไม่ถูกต้อง' };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    // Get last day of previous month
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    days,
    formatted: `${years} ปี ${months} เดือน ${days} วัน`
  };
}

/**
 * Resolve full age (years, months, days) from a registration record.
 * Computes live from `dob` when available so months & days are always accurate,
 * and falls back to stored `age_years`, `age_months`, `age_days`.
 */
export function resolveFullAgeDetail(reg = {}) {
  if (!reg || typeof reg !== 'object') {
    return { years: 0, months: 0, days: 0, formatted: '0 ปี 0 เดือน 0 วัน' };
  }

  if (reg.dob && typeof reg.dob === 'string' && reg.dob.trim() && reg.dob.trim() !== '-') {
    const fromDob = calculateAgeDetailed(reg.dob.trim());
    if (fromDob && fromDob.years > 0) {
      // If stored age_months or age_days were explicitly provided and non-zero, or if they were 0/missing, fromDob gives exact years/months/days
      return fromDob;
    }
  }

  const years = Number(reg.age_years) || 0;
  const months = Number(reg.age_months) || 0;
  const days = Number(reg.age_days) || 0;

  return {
    years,
    months,
    days,
    formatted: `${years} ปี ${months} เดือน ${days} วัน`
  };
}

/**
 * Helper to parse a standard YYYY-MM-DD string
 */
export function calculateAgeFromIsoString(isoString) {
  if (!isoString) return { years: 0, months: 0, days: 0, formatted: '-' };
  const [y, m, d] = isoString.split('-').map(Number);
  return calculateAgeDetailed(y, m, d);
}
