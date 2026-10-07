import { OFFICIAL_NETWORK_INSTITUTIONS } from '../data/defaultData';

export const ID_CARD_PAYLOAD_TYPE = 'JRE27_ID_CARD';

const clean = (value) => String(value ?? '').trim();

const THAI_TITLES_WITHOUT_SPACE = new Set([
  'นาย',
  'นาง',
  'นางสาว'
]);

const ENGLISH_ABBR_BY_THAI = {
  'มมส': 'MSU',
  'มข': 'KKU',
  'มทส': 'SUT',
  'มช': 'CMU',
  'มกส': 'KSU',
  'มรภ.อุดรธานี': 'UDRU',
  'มวล.': 'WU',
  'มก.ฉกส': 'KU-CSC'
};

function parseLegacyFullName(value) {
  const raw = clean(value);
  if (!raw) return {};

  const [thaiRaw = '', englishRaw = ''] = raw.split('/').map(part => part.trim());
  const result = {};

  const thaiAbbr = thaiRaw.match(/\(([^)]+)\)\s*$/);
  const thaiName = thaiAbbr ? thaiRaw.replace(/\(([^)]+)\)\s*$/, '').trim() : thaiRaw;
  if (thaiAbbr) result.institutionAbbrTh = thaiAbbr[1].trim();

  const thaiTitleMatch = thaiName.match(/^(ว่าที่ร้อยตรีหญิง|ว่าที่ร้อยตรี|นางสาว|นาย|นาง)\s*/);
  const thaiTitle = thaiTitleMatch?.[1] || '';
  const thaiBody = thaiTitle ? thaiName.slice(thaiTitleMatch[0].length).trim() : thaiName;
  const thaiParts = thaiBody.split(/\s+/).filter(Boolean);
  if (thaiTitle) result.titleTh = thaiTitle;
  if (thaiParts.length > 0) result.firstNameTh = thaiParts[0];
  if (thaiParts.length > 1) result.lastNameTh = thaiParts.slice(1).join(' ');

  const englishAbbr = englishRaw.match(/\(([^)]+)\)\s*$/);
  const englishName = englishAbbr ? englishRaw.replace(/\(([^)]+)\)\s*$/, '').trim() : englishRaw;
  if (englishAbbr) result.institutionAbbrEn = englishAbbr[1].trim();

  const englishTitleMatch = englishName.match(/^(Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Prof\.?)\s+/i);
  const englishTitle = englishTitleMatch?.[1] || '';
  const englishBody = englishTitle ? englishName.slice(englishTitleMatch[0].length).trim() : englishName;
  const englishParts = englishBody.split(/\s+/).filter(Boolean);
  if (englishTitle) result.titleEn = englishTitle;
  if (englishParts.length > 0) result.firstNameEn = englishParts[0];
  if (englishParts.length > 1) result.lastNameEn = englishParts.slice(1).join(' ');

  return result;
}

function splitOrganizationFields(registration) {
  const explicitUnit = clean(registration?.unit || registration?.unit_name);
  const rawAffiliation = clean(registration?.affiliation || registration?.institution);

  const officialInstitution = OFFICIAL_NETWORK_INSTITUTIONS.find(
    institution => institution.fullName === rawAffiliation
  );
  if (!explicitUnit && officialInstitution) {
    return {
      unit: clean(officialInstitution.club),
      affiliation: clean(officialInstitution.university)
    };
  }

  if (!rawAffiliation) {
    return {
      unit: explicitUnit,
      affiliation: clean(registration?.institution_abbr_th)
    };
  }

  // Older records stored the rescue unit and university together in `institution`.
  // Split at the university/institution marker so those records render consistently
  // with new registrations that store Unit and Affiliation separately.
  const universityMarker = rawAffiliation.search(/มหาวิทยาลัย|วิทยาลัย|สถาบัน/);
  const inferredUnit = !explicitUnit && universityMarker > 0
    ? rawAffiliation.slice(0, universityMarker).trim()
    : explicitUnit;
  let affiliation = rawAffiliation;

  if (inferredUnit && affiliation.startsWith(inferredUnit)) {
    affiliation = affiliation.slice(inferredUnit.length).trim();
  }

  return {
    unit: inferredUnit,
    affiliation: affiliation || rawAffiliation
  };
}

function formatThaiFullName(title, firstName, lastName, abbreviation) {
  const titlePart = title
    ? (THAI_TITLES_WITHOUT_SPACE.has(title) ? title : `${title} `)
    : '';
  const name = `${titlePart}${[firstName, lastName].filter(Boolean).join(' ')}`.trim();
  return `${name}${abbreviation ? ` (${abbreviation})` : ''}`.trim();
}

function formatEnglishFullName(title, firstName, lastName, abbreviation) {
  const name = [title, firstName, lastName].filter(Boolean).join(' ').trim();
  return `${name}${abbreviation ? ` (${abbreviation})` : ''}`.trim();
}

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
  const legacyName = parseLegacyFullName(r.full_name_affiliation);
  const titleTh = clean(r.title_th === 'อื่นๆ' ? r.title_other_th : r.title_th) || legacyName.titleTh || '';
  const titleEn = clean(r.title_en === 'อื่นๆ' ? r.title_other_en : r.title_en) || legacyName.titleEn || '';
  const firstNameTh = clean(r.first_name_th || r.first_name || legacyName.firstNameTh);
  const lastNameTh = clean(r.last_name_th || r.last_name || legacyName.lastNameTh);
  const firstNameEn = clean(r.first_name_en || legacyName.firstNameEn);
  const lastNameEn = clean(r.last_name_en || legacyName.lastNameEn);
  const organization = splitOrganizationFields(r);
  const affiliationAbbrTh = clean(r.institution_abbr_th || legacyName.institutionAbbrTh);
  const affiliationAbbrEn = clean(r.institution_abbr_en || legacyName.institutionAbbrEn || ENGLISH_ABBR_BY_THAI[affiliationAbbrTh]);
  const thaiName = formatThaiFullName(titleTh, firstNameTh, lastNameTh, affiliationAbbrTh);
  const englishName = formatEnglishFullName(titleEn, firstNameEn, lastNameEn, affiliationAbbrEn);

  return {
    prefix: [titleTh, titleEn].filter(Boolean).join(' / ') || '-',
    firstName: [firstNameTh, firstNameEn].filter(Boolean).join(' / ') || '-',
    lastName: [lastNameTh, lastNameEn].filter(Boolean).join(' / ') || '-',
    thaiName: thaiName || [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || 'ผู้เข้าร่วม JRE 2027',
    englishName: englishName || '-',
    callsign: r.callsign || r.call_sign || '-',
    nickname: r.nickname || '-',
    unit: organization.unit || r.group_assigned || '-',
    affiliation: organization.affiliation || affiliationAbbrTh || '-',
    affiliationAbbrTh: affiliationAbbrTh || '-',
    affiliationAbbrEn: affiliationAbbrEn || '-',
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
