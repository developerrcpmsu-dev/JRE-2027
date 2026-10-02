/**
 * Age Calculator Utility for JRE-2027
 * Calculates exact age in years, months, and days from Date of Birth
 * Supports both Buddhist Era (พ.ศ.) and Christian Era (ค.ศ.)
 */

export function calculateAgeDetailed(birthYear, birthMonth, birthDay) {
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
 * Helper to parse a standard YYYY-MM-DD string
 */
export function calculateAgeFromIsoString(isoString) {
  if (!isoString) return { years: 0, months: 0, days: 0, formatted: '-' };
  const [y, m, d] = isoString.split('-').map(Number);
  return calculateAgeDetailed(y, m, d);
}
