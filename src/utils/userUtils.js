/**
 * User & Contact Resolution Utilities
 * Resolves phone numbers, student IDs, affiliations, and registration data
 * for user accounts across the JRE 2027 platform.
 */

export function resolveUserExtraDetails(acc = {}, registrations = []) {
  if (!acc || typeof acc !== 'object') {
    return {
      phone: '',
      formattedPhone: '',
      studentId: '',
      affiliation: '',
      callsign: '',
      isRegistered: false,
      registrationStatus: 'ยังไม่ได้สมัคร',
      paymentStatus: '-',
      reg: null
    };
  }

  const email = (acc.email || '').trim().toLowerCase();
  const id = acc.id || '';
  
  // 1. Try to find matched registration from registrations list
  const reg = (registrations || []).find(r => 
    (r.user_id && (r.user_id === id || r.user_id === acc.id)) ||
    (r.id && (r.id === id || r.id === acc.id)) ||
    (r.user_email && r.user_email.trim().toLowerCase() === email)
  );

  let phone = acc.phone || (reg && reg.phone) || '';
  let studentId = acc.student_id || '';
  let affiliation = acc.affiliation || (reg && reg.institution) || '';
  let callsign = acc.callsign || (reg && reg.callsign) || '';
  const isRegistered = Boolean(reg);
  const registrationStatus = reg ? (reg.status || 'registered') : 'ยังไม่ได้สมัคร';
  const paymentStatus = reg ? (reg.payment_status || 'unpaid') : '-';

  // 2. Extract phone if contained in email (e.g. phatsakon0934173296@gamil.com, f0968617707@gmail.com)
  if (!phone) {
    const phoneMatch = email.match(/(0[689]\d{8})/);
    if (phoneMatch) {
      phone = phoneMatch[1];
    }
  }

  // 3. Extract student ID if MSU email (e.g. 68010310452@msu.ac.th)
  if (email.endsWith('@msu.ac.th')) {
    const msuMatch = email.match(/^(\d{11})@msu\.ac\.th$/);
    if (msuMatch) {
      studentId = msuMatch[1];
      if (!affiliation) affiliation = 'มหาวิทยาลัยมหาสารคาม (มมส)';
    }
  }

  // 4. Default admin / developer affiliations & phone
  if (email === 'bestasic22@gmail.com') {
    if (!phone) phone = '098-329-6762';
    if (!affiliation) affiliation = 'ผู้ดูแลระบบเว็บไซต์ · JRE DEV (BestCyniX)';
  } else if (email === 'developer.rcpmsu@gmail.com') {
    if (!affiliation) affiliation = 'ทีมพัฒนาและเทคโนโลยีระบบ JRE DEV';
  } else if (email === '68011211206@msu.ac.th') {
    if (!phone) phone = '098-329-6762';
    if (!affiliation) affiliation = 'ชมรมกู้ภัยราชพฤกษ์ มมส';
  } else if (email === 'f0968617707@gmail.com') {
    if (!phone) phone = '080-278-3786';
    if (!affiliation) affiliation = 'มหาวิทยาลัยมหาสารคาม (มมส) / ชมรมกู้ภัยราชพฤกษ์';
  }

  // Format phone number nicely (e.g. 080-278-3786)
  const digits = String(phone || '').replace(/\D/g, '');
  const formattedPhone = digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    : phone;

  return {
    phone,
    formattedPhone,
    studentId,
    affiliation,
    callsign,
    isRegistered,
    registrationStatus,
    paymentStatus,
    reg
  };
}
