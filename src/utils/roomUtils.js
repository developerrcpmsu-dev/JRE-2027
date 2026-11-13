import {
  resolveUniversityInfo,
  resolveGender,
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing,
  isHealthSharedWithRoommate,
  getHealthConsentInfo,
  getCleanSpecialNotes,
  getParticipantPhoto,
  getMedicalEquipmentNeeded,
  getApplicantMedical,
  getApplicantAllergy,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  hasSpecialCareCondition,
  isCommitteeDutyNote
} from '../data/defaultData.js';

export const DORMITORY_ROOM_CONFIGS = [
  { room: '101', roomLabel: 'ห้อง 101', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '102', roomLabel: 'ห้อง 102', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '103', roomLabel: 'ห้อง 103', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '104', roomLabel: 'ห้อง 104', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '105', roomLabel: 'ห้อง 105', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '106', roomLabel: 'ห้อง 106', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '107', roomLabel: 'ห้อง 107', gender: 'ชาย', floor: 1, capacity: 2 },
  { room: '108', roomLabel: 'ห้อง 108', gender: 'หญิง', floor: 1, capacity: 2 },
  { room: '109', roomLabel: 'ห้อง 109', gender: 'หญิง', floor: 1, capacity: 2 },
  { room: '110', roomLabel: 'ห้อง 110', gender: 'หญิง', floor: 1, capacity: 2 }
];

/**
 * Safely parse JSON metadata stored inside special_notes.
 */
export function parseSpecialNotesExtra(reg) {
  if (!reg?.special_notes) return {};
  if (typeof reg.special_notes === 'object') return reg.special_notes;
  if (typeof reg.special_notes === 'string' && reg.special_notes.trim().startsWith('{')) {
    try {
      return JSON.parse(reg.special_notes);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Extract requested items / supplies / special care notes beyond medicines.
 */
export function getSpecialItemsNeeded(reg, extra = {}) {
  const cleanSpecial = getCleanSpecialNotes(reg);
  const directItems = [
    reg?.required_items,
    reg?.items_needed,
    reg?.equipment_needed,
    extra?.required_items,
    extra?.items_needed,
    extra?.equipment_needed
  ]
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(v => v && !['-', 'ไม่มี', 'ปกติ', 'none'].includes(v.toLowerCase()));

  const parts = [];
  if (cleanSpecial && (reg?.is_special_care === true || !isCommitteeDutyNote(cleanSpecial))) {
    parts.push(cleanSpecial);
  }
  directItems.forEach(item => {
    if (!parts.includes(item)) parts.push(item);
  });
  return parts.join(' • ');
}

/**
 * Normalize a registration record into a dormitory person view model.
 */
export function normalizeDormPerson(reg) {
  const uniInfo = resolveUniversityInfo(reg);
  const isMsu = Boolean(uniInfo?.isMsu);
  const gender = resolveGender(reg);
  const nameData = resolvePersonFullNameWithTitle(reg);
  const rawRoom = String(reg.room_assigned || '').trim();
  const extra = parseSpecialNotesExtra(reg);

  const rawMedical = getApplicantMedical(reg) || String(extra.medical_history || '').trim();
  const rawAllergy = getApplicantAllergy(reg) || String(extra.food_allergy || '').trim();
  const mergedForHealth = {
    ...reg,
    medical_history: rawMedical,
    food_allergy: rawAllergy
  };

  const hasMedicalHistory = hasMedicalCondition(mergedForHealth);
  const hasFoodAllergy = hasFoodOrDrugAllergy(mergedForHealth);
  const isSpecialCare = hasSpecialCareCondition(reg);
  const medicalEquipmentNeeded = getMedicalEquipmentNeeded(reg);
  const specialItemsNeeded = getSpecialItemsNeeded(reg, extra);

  const medicalHistory = hasMedicalHistory ? rawMedical : 'ไม่มี';
  const foodAllergy = hasFoodAllergy ? rawAllergy : 'ไม่มี';

  // Priority tier for room ordering and buddy pairing:
  // 3: chronic medical condition or special care
  // 2: food/drug allergy
  // 1: requested medicine/supplies only
  // 0: healthy (no chronic disease, no allergy, no special care)
  let healthPriorityTier = 0;
  if (hasMedicalHistory || isSpecialCare) {
    healthPriorityTier = 3;
  } else if (hasFoodAllergy) {
    healthPriorityTier = 2;
  } else if (medicalEquipmentNeeded || specialItemsNeeded) {
    healthPriorityTier = 1;
  }

  const roomMatch = rawRoom.match(/(\d{3})/);
  const healthConsent = getHealthConsentInfo(reg);
  const dormOptOut = Boolean(reg.dorm_opt_out ?? extra.dorm_opt_out ?? false);
  const dormOptOutBy = reg.dorm_opt_out_by || extra.dorm_opt_out_by || '';
  const dormOptOutAt = reg.dorm_opt_out_at || extra.dorm_opt_out_at || '';
  const dormOptOutNote = reg.dorm_opt_out_note || extra.dorm_opt_out_note || '';
  const roomKeyHeld = Boolean(reg.room_key_held ?? extra.room_key_held ?? false);
  const roomKeyLabel = reg.room_key_label || extra.room_key_label || '';
  const roomKeyIssuedAt = reg.room_key_issued_at || extra.room_key_issued_at || '';
  const roomKeyIssuedBy = reg.room_key_issued_by || extra.room_key_issued_by || '';
  const roomKeyReturned = Boolean(reg.room_key_returned ?? extra.room_key_returned ?? false);
  const roomKeyReturnedAt = reg.room_key_returned_at || extra.room_key_returned_at || '';
  const roomKeyReturnedBy = reg.room_key_returned_by || extra.room_key_returned_by || '';
  const roomKeyNote = reg.room_key_note || extra.room_key_note || '';

  let keyStatusLabel = dormOptOut ? 'ไม่ต้องใช้กุญแจ (ไม่พัก)' : 'ยังไม่ได้รับกุญแจ';
  if (roomKeyReturned) {
    keyStatusLabel = 'คืนกุญแจแล้ว';
  } else if (roomKeyHeld) {
    keyStatusLabel = 'ได้รับกุญแจแล้ว';
  }

  return {
    raw: reg,
    id: reg.id || reg.user_id,
    user_id: reg.user_id,
    targetUpdateId: reg.user_id || reg.id,
    name: nameData.fullName,
    title: nameData.title,
    firstName: nameData.firstName,
    lastName: nameData.lastName,
    nickname: extra.nickname || reg.nickname || '-',
    callsign: normalizeCallsignSpacing(extra.callsign || reg.callsign || '-'),
    gender,
    phone: reg.phone || extra.phone || '-',
    email: reg.user_email || '',
    avatar: getParticipantPhoto(reg) || reg.user_avatar || '',
    medicalEquipmentNeeded,
    specialItemsNeeded,
    isSpecialCare,
    institution: reg.institution || '-',
    uniShort: uniInfo.shortTag,
    uni: uniInfo.shortTag,
    uniName: uniInfo.fullName,
    shirtSize: extra.shirt_size || reg.shirt_size || 'L',
    bloodGroup: reg.blood_group || extra.blood_group || '-',
    foodAllergy,
    medicalHistory,
    allergy: foodAllergy,
    medical: medicalHistory,
    hasFoodAllergy,
    hasMedicalHistory,
    hasAlg: hasFoodAllergy,
    hasMed: hasMedicalHistory,
    needsBuddyCare: healthPriorityTier >= 2,
    hasAnyHealthAlert: healthPriorityTier >= 2,
    healthPriorityTier,
    emergencyName: reg.emergency_name || extra.emergency_name || '-',
    emergencyPhone: reg.emergency_phone || extra.emergency_phone || '-',
    isMsu,
    isHealthShared: healthConsent.isShared,
    healthConsent,
    dormOptOut,
    dormOptOutBy,
    dormOptOutAt,
    dormOptOutNote,
    stayStatusLabel: isMsu ? 'มมส (ไป-กลับเอง)' : (dormOptOut ? 'ไม่ประสงค์พักหอพัก' : 'เข้าพักหอพัก'),
    roomKeyHeld,
    roomKeyLabel,
    roomKeyIssuedAt,
    roomKeyIssuedBy,
    roomKeyReturned,
    roomKeyReturnedAt,
    roomKeyReturnedBy,
    roomKeyNote,
    keyStatusLabel,
    rawRoom,
    roomNumber: roomMatch ? roomMatch[1] : null
  };
}

/**
 * Order occupants inside a single room:
 * #1 = person with chronic disease / allergy / special care (higher tier first)
 * #2 = healthy person (without chronic disease)
 */
export function compareRoomOccupants(a, b) {
  if (b.healthPriorityTier !== a.healthPriorityTier) {
    return b.healthPriorityTier - a.healthPriorityTier;
  }
  return (a.name || '').localeCompare(b.name || '', 'th');
}

/**
 * Build room map (101-110), sorted occupants (#1 condition, #2 healthy),
 * plus diagnostics on whether rooms need rebalancing.
 */
export function buildDormitoryRoomData(registrations = []) {
  const map = {};
  DORMITORY_ROOM_CONFIGS.forEach(c => {
    map[c.room] = {
      ...c,
      occupants: []
    };
  });

  const unassignedExternal = [];
  const optedOutPeople = [];
  const localMsu = [];

  (registrations || []).forEach(reg => {
    const person = normalizeDormPerson(reg);
    if (person.dormOptOut) {
      optedOutPeople.push(person);
    }
    if (person.isMsu) {
      localMsu.push(person);
      return;
    }

    if (person.roomNumber && map[person.roomNumber]) {
      map[person.roomNumber].occupants.push(person);
    } else if (!person.dormOptOut) {
      unassignedExternal.push(person);
    }
  });

  // Sort occupants in every room so #1 = medical/allergy, #2 = healthy, opted-out last, and compute key summaries
  Object.values(map).forEach(room => {
    room.occupants.sort((a, b) => {
      if (a.dormOptOut !== b.dormOptOut) return a.dormOptOut ? 1 : -1;
      return compareRoomOccupants(a, b);
    });
    const stayingOccupants = room.occupants.filter(o => !o.dormOptOut);
    const optedOutOccupants = room.occupants.filter(o => o.dormOptOut);
    const keyHolders = room.occupants.filter(o => o.roomKeyHeld);
    const activeKeyHolders = keyHolders.filter(o => !o.roomKeyReturned);
    const returnedKeys = room.occupants.filter(o => o.roomKeyReturned);

    room.stayingCount = stayingOccupants.length;
    room.optedOutCount = optedOutOccupants.length;
    room.keyHolders = keyHolders;
    room.activeKeyHolders = activeKeyHolders;
    room.keysIssuedCount = keyHolders.length;
    room.keysReturnedCount = returnedKeys.length;
    room.allKeysReturned = keyHolders.length > 0 && keyHolders.every(o => o.roomKeyReturned);

    if (stayingOccupants.length === 0 && optedOutOccupants.length > 0) {
      room.keySummaryLabel = 'ไม่ประสงค์เข้าพักทั้งห้อง';
    } else if (keyHolders.length === 0) {
      room.keySummaryLabel = 'ยังไม่จ่ายกุญแจ';
    } else if (room.allKeysReturned) {
      room.keySummaryLabel = `คืนกุญแจครบแล้ว (${returnedKeys.length}/${keyHolders.length})`;
    } else if (activeKeyHolders.length >= 2) {
      room.keySummaryLabel = `อยู่ที่ทั้ง 2 คน (${activeKeyHolders.map(o => o.nickname && o.nickname !== '-' ? o.nickname : o.firstName).join(', ')})`;
    } else if (activeKeyHolders.length === 1) {
      const h = activeKeyHolders[0];
      room.keySummaryLabel = `อยู่ที่: ${h.nickname && h.nickname !== '-' ? h.nickname : h.firstName}${returnedKeys.length > 0 ? ` (อีก ${returnedKeys.length} คืนแล้ว)` : ''}`;
    } else {
      room.keySummaryLabel = `คืนแล้ว ${returnedKeys.length}/${keyHolders.length}`;
    }
  });

  const rooms = Object.values(map);
  const maleRooms = rooms.filter(r => r.gender === 'ชาย');
  const femaleRooms = rooms.filter(r => r.gender === 'หญิง');

  const analyzeZone = (zoneRooms) => {
    const doubleCareRooms = [];
    const misplacedCareRooms = [];
    let seenHealthyOnlyRoom = false;

    zoneRooms.forEach(r => {
      const careCount = r.occupants.filter(o => o.needsBuddyCare).length;
      if (careCount >= 2) {
        doubleCareRooms.push(r.room);
      }
      if (r.occupants.length > 0 && careCount === 0) {
        seenHealthyOnlyRoom = true;
      } else if (careCount > 0 && seenHealthyOnlyRoom) {
        misplacedCareRooms.push(r.room);
      }
    });

    return { doubleCareRooms, misplacedCareRooms };
  };

  const maleDiag = analyzeZone(maleRooms);
  const femaleDiag = analyzeZone(femaleRooms);

  const doubleCareRooms = [...maleDiag.doubleCareRooms, ...femaleDiag.doubleCareRooms];
  const misplacedCareRooms = [...maleDiag.misplacedCareRooms, ...femaleDiag.misplacedCareRooms];

  const allRoomOccupants = rooms.flatMap(r => r.occupants);
  const totalStaying = allRoomOccupants.filter(o => !o.dormOptOut).length;
  const totalOptedOut = optedOutPeople.length;
  const totalKeysIssued = allRoomOccupants.filter(o => o.roomKeyHeld).length;
  const totalKeysReturned = allRoomOccupants.filter(o => o.roomKeyReturned).length;
  const totalKeysUnreturned = allRoomOccupants.filter(o => o.roomKeyHeld && !o.roomKeyReturned).length;

  return {
    rooms,
    maleRooms,
    femaleRooms,
    unassignedExternal,
    optedOutPeople,
    localMsu,
    totalStaying,
    totalOptedOut,
    totalKeysIssued,
    totalKeysReturned,
    totalKeysUnreturned,
    diagnostics: {
      doubleCareRooms,
      misplacedCareRooms,
      needsRebalance: doubleCareRooms.length > 0 || misplacedCareRooms.length > 0 || unassignedExternal.length > 0
    }
  };
}

/**
 * Compute optimal room assignments per gender:
 * 1. Pair each person who has a chronic disease / allergy with a healthy roommate (1:1).
 * 2. Place care rooms at the front of each gender block (101.. for male, 108.. for female).
 * 3. Order occupants in every room: #1 = condition holder, #2 = healthy roommate.
 * 4. Preserve existing healthy-only pairs and existing care+healthy pairs where possible.
 */
export function computeSmartRoomPlan(registrations = []) {
  const current = buildDormitoryRoomData(registrations);

  const planZone = (zoneRooms) => {
    const allPeople = [
      ...zoneRooms.flatMap(r => r.occupants),
      ...current.unassignedExternal.filter(p => p.gender === zoneRooms[0]?.gender)
    ];

    // Group by current room to discover existing pairs
    const byCurrentRoom = new Map();
    allPeople.forEach(p => {
      if (p.roomNumber) {
        if (!byCurrentRoom.has(p.roomNumber)) byCurrentRoom.set(p.roomNumber, []);
        byCurrentRoom.get(p.roomNumber).push(p);
      }
    });

    const carePeople = allPeople
      .filter(p => p.needsBuddyCare)
      .sort((a, b) => {
        if (b.healthPriorityTier !== a.healthPriorityTier) {
          return b.healthPriorityTier - a.healthPriorityTier;
        }
        const rA = Number(a.roomNumber || 999);
        const rB = Number(b.roomNumber || 999);
        if (rA !== rB) return rA - rB;
        return (a.name || '').localeCompare(b.name || '', 'th');
      });

    const healthyPool = allPeople
      .filter(p => !p.needsBuddyCare)
      .sort((a, b) => {
        const rA = Number(a.roomNumber || 999);
        const rB = Number(b.roomNumber || 999);
        if (rA !== rB) return rA - rB;
        return (a.name || '').localeCompare(b.name || '', 'th');
      });

    const usedIds = new Set();
    const careRoomSet = new Set(carePeople.map(c => c.roomNumber).filter(Boolean));
    const takeHealthyMate = (preferredRoomNumber) => {
      // First preference: healthy person who was already roomed with this care person
      if (preferredRoomNumber) {
        const existingIdx = healthyPool.findIndex(
          h => !usedIds.has(h.id) && h.roomNumber === preferredRoomNumber
        );
        if (existingIdx !== -1) {
          const mate = healthyPool[existingIdx];
          usedIds.add(mate.id);
          return mate;
        }
      }
      // Second preference: healthy person not currently paired with another care person
      const unattachedIdx = healthyPool.findIndex(
        h => !usedIds.has(h.id) && !careRoomSet.has(h.roomNumber)
      );
      if (unattachedIdx !== -1) {
        const mate = healthyPool[unattachedIdx];
        usedIds.add(mate.id);
        return mate;
      }
      // Fallback: any available healthy person
      const idx = healthyPool.findIndex(h => !usedIds.has(h.id));
      if (idx !== -1) {
        const mate = healthyPool[idx];
        usedIds.add(mate.id);
        return mate;
      }
      return null;
    };

    const pairedRooms = [];

    // 1. Assign every care person into front rooms paired with 1 healthy roommate
    const remainingCare = [...carePeople];
    while (remainingCare.length > 0) {
      const primary = remainingCare.shift();
      if (usedIds.has(primary.id)) continue;
      usedIds.add(primary.id);

      let partner = takeHealthyMate(primary.roomNumber);
      // Fallback only if there are strictly more care people than healthy people
      if (!partner && remainingCare.length > 0) {
        partner = remainingCare.shift();
        usedIds.add(partner.id);
      }

      const occupants = partner ? [primary, partner].sort(compareRoomOccupants) : [primary];
      pairedRooms.push(occupants);
    }

    // 2. Pair remaining healthy people, preserving existing intact healthy pairs first
    const remainingHealthy = healthyPool.filter(h => !usedIds.has(h.id));
    const healthyUsed = new Set();

    byCurrentRoom.forEach((members) => {
      const intact = members.filter(m => !m.needsBuddyCare && !usedIds.has(m.id) && !healthyUsed.has(m.id));
      if (intact.length === 2) {
        intact.forEach(m => healthyUsed.add(m.id));
        pairedRooms.push(intact.sort(compareRoomOccupants));
      }
    });

    const leftoverHealthy = remainingHealthy.filter(h => !healthyUsed.has(h.id));
    for (let i = 0; i < leftoverHealthy.length; i += 2) {
      const pair = leftoverHealthy.slice(i, i + 2).sort(compareRoomOccupants);
      pairedRooms.push(pair);
    }

    return zoneRooms.map((roomCfg, idx) => ({
      ...roomCfg,
      occupants: pairedRooms[idx] || []
    }));
  };

  const plannedMaleRooms = planZone(current.maleRooms);
  const plannedFemaleRooms = planZone(current.femaleRooms);
  const plannedRooms = [...plannedMaleRooms, ...plannedFemaleRooms];

  const changes = [];
  plannedRooms.forEach(rm => {
    rm.occupants.forEach((person, idx) => {
      const oldRoom = person.roomNumber || 'ยังไม่จัดห้อง';
      if (oldRoom !== rm.room) {
        changes.push({
          person,
          oldRoom,
          newRoom: rm.room,
          newRoomValue: `ห้อง ${rm.room}`,
          bedNumber: idx + 1,
          reason: person.needsBuddyCare
            ? 'จัดคนมีโรคประจำตัว/แพ้ไว้ห้องต้นๆ คู่คนปกติ'
            : 'จัดคู่ดูแลผู้มีโรคประจำตัว/ขยับห้องตามลำดับ'
        });
      }
    });
  });

  return {
    current,
    plannedRooms,
    plannedMaleRooms,
    plannedFemaleRooms,
    changes
  };
}
