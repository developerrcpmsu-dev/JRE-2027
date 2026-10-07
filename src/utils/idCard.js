export const ID_CARD_PAYLOAD_TYPE = 'JRE27_ID_CARD';

const clean = (value) => String(value ?? '').trim();

export function getRegistrationIdentity(registration) {
  return clean(registration?.id || registration?.user_id || registration?.user_email);
}

export function getIdCardCode(registration) {
  const identity = getRegistrationIdentity(registration);
  const compact = identity.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `JRE27-${(compact || 'REGISTRATION').slice(0, 10)}`;
}

/**
 * The QR contains only a record reference. Personal data stays in the
 * registration record and is resolved by the authenticated Admin scanner.
 */
export function getIdCardQrPayload(registration) {
  return JSON.stringify({
    type: ID_CARD_PAYLOAD_TYPE,
    version: 1,
    event: 'JRE2027',
    record_id: getRegistrationIdentity(registration),
    card_code: getIdCardCode(registration)
  });
}

export function parseIdCardPayload(rawValue) {
  const raw = clean(rawValue);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.type === ID_CARD_PAYLOAD_TYPE || parsed.card_code || parsed.record_id)) {
      return {
        recordId: clean(parsed.record_id || parsed.id || parsed.user_id),
        cardCode: clean(parsed.card_code || parsed.card || parsed.code),
        raw
      };
    }
  } catch (error) {
    // Manual lookup strings are intentionally supported below.
  }

  const prefixed = raw.match(/^JRE27[-_: ]?(?:ID|CARD)[-_: ]?(.+)$/i);
  if (prefixed) {
    return { recordId: clean(prefixed[1]), cardCode: raw.toUpperCase(), raw };
  }

  return { recordId: raw, cardCode: raw.toUpperCase(), raw };
}

export function getRegistrationCardData(registration) {
  const r = registration || {};
  const titleTh = r.title_th === 'อื่นๆ' ? r.title_other_th : r.title_th;
  const titleEn = r.title_en === 'อื่นๆ' ? r.title_other_en : r.title_en;
  const firstNameTh = r.first_name_th || r.first_name || '';
  const lastNameTh = r.last_name_th || r.last_name || '';
  const firstNameEn = r.first_name_en || '';
  const lastNameEn = r.last_name_en || '';
  const thaiName = [titleTh, firstNameTh, lastNameTh].filter(Boolean).join(' ').trim();
  const englishName = [titleEn, firstNameEn, lastNameEn].filter(Boolean).join(' ').trim();

  return {
    prefix: [titleTh, titleEn].filter(Boolean).join(' / ') || '-',
    firstName: [firstNameTh, firstNameEn].filter(Boolean).join(' / ') || '-',
    lastName: [lastNameTh, lastNameEn].filter(Boolean).join(' / ') || '-',
    thaiName: thaiName || [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || 'ผู้เข้าร่วม JRE 2027',
    englishName: englishName || '-',
    callsign: r.callsign || r.call_sign || '-',
    nickname: r.nickname || '-',
    unit: r.unit || r.unit_name || r.group_assigned || '-',
    affiliation: r.affiliation || r.institution || r.institution_abbr_th || '-',
    bloodGroup: r.blood_group || r.blood_type || '-',
    photo: r.id_card_photo || r.id_card_url || r.user_avatar || '',
    cardCode: getIdCardCode(r),
    recordId: getRegistrationIdentity(r)
  };
}

export function findRegistrationByIdCard(registrations, rawValue) {
  const list = Array.isArray(registrations) ? registrations : [];
  const parsed = parseIdCardPayload(rawValue);
  if (!parsed) return null;

  const recordId = parsed.recordId.toLowerCase();
  const cardCode = parsed.cardCode.toLowerCase();
  const query = parsed.raw.toLowerCase();

  return list.find((registration) => {
    const identity = getRegistrationIdentity(registration).toLowerCase();
    const userId = clean(registration?.user_id).toLowerCase();
    const id = clean(registration?.id).toLowerCase();
    const code = getIdCardCode(registration).toLowerCase();

    if (recordId && (identity === recordId || userId === recordId || id === recordId)) return true;
    if (cardCode && code === cardCode) return true;

    // Manual Admin lookup: code, name, call sign, phone, email, unit, or affiliation.
    if (query.length < 3) return false;
    const searchable = [
      identity,
      userId,
      id,
      code,
      registration?.user_email,
      registration?.first_name,
      registration?.last_name,
      registration?.first_name_th,
      registration?.last_name_th,
      registration?.first_name_en,
      registration?.last_name_en,
      registration?.full_name_affiliation,
      registration?.nickname,
      registration?.callsign,
      registration?.call_sign,
      registration?.phone,
      registration?.unit,
      registration?.unit_name,
      registration?.institution,
      registration?.affiliation
    ].map(value => clean(value).toLowerCase());

    return searchable.some(value => value && value.includes(query));
  }) || null;
}
