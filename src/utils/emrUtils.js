import {
  getParticipantPhoto,
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing,
  resolveUniversityInfo,
  getApplicantMedical,
  getApplicantAllergy,
  getMedicalEquipmentNeeded,
  hasMedicalCondition,
  hasFoodOrDrugAllergy
} from '../data/defaultData';

export const PRESET_SYMPTOMS = [
  'ปวดศีรษะ / ไมเกรน',
  'มีไข้ / ตัวร้อน / หนาวสั่น',
  'วิงเวียนศีรษะ / หน้ามืด / เป็นลม',
  'ปวดท้อง / จุกแน่น / กรดไหลย้อน',
  'ท้องเสีย / ถ่ายเหลว / อาเจียน',
  'บาดแผลถลอก / แผลสด / เลือดออก',
  'ปวดเมื่อยกล้ามเนื้อ / ตะคริว / เคล็ดขัดยอก',
  'แมลงสัตว์กัดต่อย / ผื่นแพ้ / ลมพิษ',
  'เจ็บคอ / ไอ / มีน้ำมูก',
  'แน่นหน้าอก / หอบเหนื่อย / หายใจไม่สะดวก'
];

export const PRESET_FIRST_AID = [
  'วัดสัญญาณชีพและสังเกตอาการใกล้ชิด',
  'ล้างแผลด้วยน้ำเกลือ + ใส่เบตาดีน + ปิดก๊อซ',
  'ประคบเย็นลดบวม 15-20 นาที',
  'ให้นอนพักในที่อากาศถ่ายเท ยกปลายเท้าสูง',
  'เช็ดตัวลดไข้และดื่มน้ำสะอาด',
  'จิบผงเกลือแร่ (ORS) ทดแทนน้ำและเกลือแร่',
  'ใช้ยาพ่นประจำตัวและเฝ้าสังเกตการณ์หายใจ',
  'ปฐมพยาบาลเบื้องต้นและส่งต่อแพทย์/โรงพยาบาล'
];

export const PRESET_MEDICINES = [
  { name: 'พาราเซตามอล (Paracetamol 500 mg)', defaultDose: 'รับประทานครั้งละ 1-2 เม็ด ทุก 4-6 ชม. เมื่อมีอาการ' },
  { name: 'ผงเกลือแร่ (ORS)', defaultDose: '1 ซอง ละลายน้ำสะอาด 250 มล. ค่อยๆ จิบต่อเนื่อง' },
  { name: 'คลอร์เฟนิรามีน (CPM 4 mg)', defaultDose: '1 เม็ด หลังอาหาร เช้า-เย็น (อาจทำให้ง่วงซึม)' },
  { name: 'เซทิริซีน (Cetirizine 10 mg)', defaultDose: '1 เม็ด วันละ 1 ครั้ง (แก้แพ้ไม่ง่วง)' },
  { name: 'ยาธาตุน้ำขาว / ยาลดกรด', defaultDose: '1 ช้อนโต๊ะ ก่อนหรือหลังอาหาร เมื่อจุกเสียดท้อง' },
  { name: 'บัสโคพาน (Buscopan 10 mg)', defaultDose: '1 เม็ด เมื่อมีอาการปวดบิดเกร็งช่องท้อง' },
  { name: 'คาลาไมน์โลชั่น / ยาทาแก้คัน', defaultDose: 'ทาบางๆ บริเวณผื่นคัน วันละ 3-4 ครั้ง' },
  { name: 'ชุดทำแผลสด (NSS + เบตาดีน + พลาสเตอร์/ก๊อซ)', defaultDose: 'ล้างทำความสะอาดแผลและปิดแผลกันเชื้อโรค' },
  { name: 'ยาหม่อง / เจลคลายกล้ามเนื้อ / Cold Pack', defaultDose: 'ทาถูหรือประคบบริเวณที่ปวดตึง/เคล็ดขัดยอก' },
  { name: 'ไม่จ่ายยา (ปฐมพยาบาล/เฝ้าสังเกตอาการอย่างเดียว)', defaultDose: 'ดูแลปฐมพยาบาลและติดตามอาการต่อเนื่อง' }
];

export function getDefaultOperatorName(currentUser) {
  if (!currentUser) return 'เจ้าหน้าที่ / อาสาพยาบาล (JRE 2027)';
  return (
    currentUser.display_name ||
    currentUser.name ||
    currentUser.full_name ||
    currentUser.nickname ||
    currentUser.email ||
    'เจ้าหน้าที่ / อาสาพยาบาล (JRE 2027)'
  );
}

export function toLocalDateTimeInput(isoValue) {
  if (!isoValue) return '';
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatPersonSummary(reg) {
  if (!reg) return null;
  const nameData = resolvePersonFullNameWithTitle(reg);
  const uni = resolveUniversityInfo(reg.institution);
  const photo = getParticipantPhoto(reg);
  const medical = getApplicantMedical(reg);
  const allergy = getApplicantAllergy(reg);
  const requestedEquipment = getMedicalEquipmentNeeded(reg);

  return {
    raw: reg,
    id: reg.id || reg.user_id || '',
    userId: reg.user_id || reg.id || '',
    email: reg.user_email || '',
    name: nameData.fullName,
    nickname: reg.nickname || '-',
    callsign: normalizeCallsignSpacing(reg.callsign || '-'),
    phone: reg.phone || '-',
    institution: uni.shortTag,
    institutionFull: uni.fullLabel,
    unit: reg.unit || reg.department || reg.faculty || '-',
    group: reg.group_assigned || 'ยังไม่จัดกลุ่ม',
    room: reg.room_opt_out ? 'ไม่ประสงค์พักหอ' : (reg.room_assigned || (uni.isLocal ? 'ไม่พักหอ (ไป-กลับ มมส)' : 'รอจัดห้อง')),
    blood: reg.blood_group || '-',
    medical: medical || 'ไม่มี',
    hasMed: hasMedicalCondition(reg),
    allergy: allergy || 'ไม่มี',
    hasAlg: hasFoodOrDrugAllergy(reg),
    requestedEquipment,
    photo
  };
}

export function matchEmrLogToPerson(log, person) {
  if (!log || !person) return false;
  const pid = person.id ? String(person.id).trim() : '';
  const uid = person.user_id ? String(person.user_id).trim() : '';
  const email = person.user_email ? String(person.user_email).trim().toLowerCase() : '';

  const logRid = log.recipient_id ? String(log.recipient_id).trim() : '';
  const logUid = log.recipient_user_id ? String(log.recipient_user_id).trim() : '';
  const logEmail = log.recipient_email ? String(log.recipient_email).trim().toLowerCase() : '';

  if (pid && (logRid === pid || logUid === pid)) return true;
  if (uid && (logRid === uid || logUid === uid)) return true;
  if (email && logEmail && logEmail === email) return true;

  // Fallback by normalized full name if IDs were absent in older logs
  const personName = resolvePersonFullNameWithTitle(person).fullName.trim().toLowerCase();
  const logName = (log.recipient_name || '').trim().toLowerCase();
  if (personName && logName && personName === logName) return true;
  return false;
}

export function findPersonForEmrLog(log, registrations = []) {
  if (!log || !Array.isArray(registrations) || registrations.length === 0) return null;
  return registrations.find(reg => matchEmrLogToPerson(log, reg)) || null;
}

export function buildEmrPayload(personReg, form = {}, currentUser = null) {
  const summary = formatPersonSummary(personReg) || {};
  const dispensedAtIso = form.dispensed_at
    ? (String(form.dispensed_at).includes('T') && String(form.dispensed_at).length <= 16
        ? new Date(form.dispensed_at).toISOString()
        : form.dispensed_at)
    : new Date().toISOString();

  return {
    recipient_id: summary.id || personReg?.id || personReg?.user_id || '',
    recipient_user_id: summary.userId || personReg?.user_id || personReg?.id || '',
    recipient_email: summary.email || '',
    recipient_name: summary.name || form.recipient_name || 'ไม่ระบุชื่อ',
    recipient_nickname: summary.nickname || '',
    recipient_callsign: summary.callsign || '-',
    recipient_phone: summary.phone || '-',
    recipient_institution: summary.institution || '-',
    recipient_group: summary.group || '-',
    recipient_room: summary.room || '-',
    recipient_blood: summary.blood || '-',
    recipient_known_allergies: summary.allergy || 'ไม่มี',
    recipient_chronic_diseases: summary.medical || 'ไม่มี',
    recipient_requested_equipment: summary.requestedEquipment || '',
    recipient_photo: summary.photo || '',
    symptoms: (form.symptoms || '').trim(),
    incident_detail: (form.incident_detail || '').trim(),
    first_aid_action: (form.first_aid_action || '').trim(),
    medicines_dispensed: (form.medicines_dispensed || '').trim(),
    dosage_instruction: (form.dosage_instruction || '').trim(),
    vital_signs: (form.vital_signs || '').trim(),
    recorder_name: (form.recorder_name || getDefaultOperatorName(currentUser)).trim(),
    dispenser_name: (form.dispenser_name || getDefaultOperatorName(currentUser)).trim(),
    medical_notes: (form.medical_notes || '').trim(),
    dispensed_at: dispensedAtIso,
    updated_by: currentUser?.email || getDefaultOperatorName(currentUser)
  };
}
