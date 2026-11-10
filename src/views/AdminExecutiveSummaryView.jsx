import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  UtensilsCrossed,
  Building,
  CreditCard,
  Shirt,
  Search,
  RotateCcw,
  Bell,
  Copy,
  Check,
  Phone,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  BedDouble,
  Home,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Save,
  UserPlus,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import {
  DataService,
  getAttendanceConfirmationInfo
} from '../supabase';
import {
  resolveUniversityInfo,
  resolveGender,
  isStaffRegistration,
  isMsuInstitution,
  getStaffPaymentSummary,
  STAFF_SHIRT_FEE,
  OFFICIAL_NETWORK_INSTITUTIONS,
  OFFICIAL_8_COMMITTEE_ROSTER,
  STAFF_ROLE_OPTIONS,
  resolveStaffRoleType,
  findMatchingCommitteeMemberSpec,
  findExistingRegForCommitteeSpec,
  resolveCommitteeDutyNote,
  formatStaffCallsign,
  normalizeCallsignSpacing,
  compareRosterItems,
  getRosterSortTier
} from '../data/defaultData';

const DELETED_COMMITTEE_STORAGE_KEY = 'jre2027_deleted_committee_keys';

function getDeletedCommitteeKeys() {
  try {
    const raw = localStorage.getItem(DELETED_COMMITTEE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function setDeletedCommitteeKeys(keys) {
  try {
    localStorage.setItem(DELETED_COMMITTEE_STORAGE_KEY, JSON.stringify(Array.from(new Set(keys))));
  } catch (e) {
    // ignore storage errors
  }
}

const STANDARD_SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'];

function normalizeShirtSizeKey(rawSize) {
  if (!rawSize) return 'ไม่ระบุ';
  const clean = String(rawSize).trim().toUpperCase();
  if (['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(clean)) return clean;
  for (const sz of ['5XL', '4XL', '3XL', '2XL', 'XL', 'SS', 'S', 'M', 'L']) {
    if (clean.startsWith(sz + ' ') || clean.startsWith(sz + '(')) return sz;
  }
  return 'อื่นๆ';
}

function classifyFoodPreference(rawAllergy, rawNotes) {
  const combined = `${rawAllergy || ''} ${rawNotes || ''}`.trim().toLowerCase();
  const isNone = !rawAllergy || ['-', 'ไม่มี', 'ไม่แพ้', 'ไม่มีครับ', 'ไม่มีค่ะ', 'ทานได้ทุกอย่าง', 'ปกติ', 'none', 'no', 'n/a'].includes(String(rawAllergy).trim().toLowerCase());

  if (isNone) {
    return { type: 'normal', label: '🍱 อาหารปกติ', isSpecial: false, detail: '' };
  }
  if (/ฮาลาล|อิสลาม|มุสลิม|ไม่ทานหมู|ไม่กินหมู|halal|muslim|pork/.test(combined)) {
    return { type: 'halal', label: '🕌 ฮาลาล / งดหมู', isSpecial: true, detail: rawAllergy };
  }
  if (/มังสวิรัติ|เจ|วีแกน|ไม่ทานเนื้อสัตว์|vegan|vegetarian/.test(combined)) {
    return { type: 'vegan', label: '🥗 มังสวิรัติ / เจ', isSpecial: true, detail: rawAllergy };
  }
  if (/กุ้ง|ปู|หมึก|หอย|ทะเล|ซีฟู้ด|seafood|shrimp|crab|shellfish|ปลา/.test(combined)) {
    return { type: 'seafood', label: '🦐 แพ้อาหารทะเล/กุ้ง/ปู', isSpecial: true, detail: rawAllergy };
  }
  if (/ไม่ทานเนื้อ|ไม่กินเนื้อ|งดเนื้อ|แพ้เนื้อวัว|beef/.test(combined)) {
    return { type: 'nobeef', label: '🥩 งดเนื้อวัว', isSpecial: true, detail: rawAllergy };
  }
  return { type: 'other_allergy', label: '⚠️ แพ้อาหาร/งดอื่นๆ', isSpecial: true, detail: rawAllergy };
}

function computeApplicantFinance(reg, paymentConfig) {
  const isStaff = isStaffRegistration(reg);
  const isMsu = isMsuInstitution(reg.institution || reg.affiliation || reg);
  const staffSum = isStaff ? getStaffPaymentSummary(reg) : null;

  const totalFee = isStaff
    ? staffSum.totalStaffFee
    : (isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850));
  const round1Fee = isMsu ? (paymentConfig?.installment_round1_amount_msu || 400) : (paymentConfig?.installment_round1_amount_external || paymentConfig?.installment_round1_amount || 400);
  const round2Fee = isMsu ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);

  let collected = 0;
  let isFullyPaid = false;

  if (isStaff) {
    if (staffSum.totalStaffFee === 0) {
      collected = 0;
      isFullyPaid = true;
    } else if (staffSum.isMsu) {
      const paid = reg.payment_status === 'paid' || reg.installment_1_status === 'paid' || staffSum.r1SlipAmount >= STAFF_SHIRT_FEE;
      collected = paid ? STAFF_SHIRT_FEE : 0;
      isFullyPaid = paid;
    } else {
      const shirtPaid = (reg.installment_1_status === 'paid' || reg.payment_status === 'paid' || staffSum.r1SlipAmount >= STAFF_SHIRT_FEE) ? STAFF_SHIRT_FEE : 0;
      collected = Math.min(totalFee, shirtPaid + staffSum.accommodationPaidTotal);
      isFullyPaid = shirtPaid >= STAFF_SHIRT_FEE && staffSum.isAccommodationPaid;
    }
  } else {
    const isInstallment = reg.payment_plan === 'installment' || Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url);
    const r1Paid = reg.installment_1_status === 'paid' || reg.payment_status === 'paid';
    const r2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url || reg.admin_manual_override);
    if (!isInstallment && (reg.payment_status === 'paid' || reg.payment_status === 'verified')) {
      collected = totalFee;
      isFullyPaid = true;
    } else if (isInstallment) {
      if (r1Paid) collected += round1Fee;
      if (r2Paid) collected += round2Fee;
      if (r1Paid && r2Paid) {
        collected = totalFee;
        isFullyPaid = true;
      }
    }
  }

  const outstanding = Math.max(0, totalFee - collected);
  const overpaidRefund = isStaff ? (staffSum?.overpaidAmount || 0) : 0;

  return {
    totalFee,
    collected,
    outstanding,
    isFullyPaid,
    overpaidRefund
  };
}

export default function AdminExecutiveSummaryView({
  registrations = [],
  merchandiseOrders = [],
  paymentConfig = {},
  onUpdateAllocation,
  onDeleteRegistration,
  onSelectApplicant,
  onOpenProfileModal,
  onNavigateTab,
  onNavigateSubpage,
  onRefresh,
  triggerToast,
  askConfirm
}) {
  const effectiveOpenProfile = onOpenProfileModal || onSelectApplicant;

  // Cascading Filter States
  const [uniFilter, setUniFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'participant' | 'staff'
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'ชาย' | 'หญิง'
  const [confirmFilter, setConfirmFilter] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'declined' | 'need_accom' | 'no_accom' | 'special_food'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isSyncingCommittee, setIsSyncingCommittee] = useState(false);
  const [showCommitteeRosterPanel, setShowCommitteeRosterPanel] = useState(true);
  // Protection switch: Admin must unlock Edit Mode before changing data, to prevent accidental clicks
  const [isEditMode, setIsEditMode] = useState(false);

  // Inline Duty / Note Drafts per row
  const [dutyNoteDrafts, setDutyNoteDrafts] = useState({});

  // Add New Person Modal State (for Dev / Admin to add Committee / Staff / Participant directly to table)
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonTitle, setNewPersonTitle] = useState('นาย');
  const [newPersonFirstName, setNewPersonFirstName] = useState('');
  const [newPersonLastName, setNewPersonLastName] = useState('');
  const [newPersonNickname, setNewPersonNickname] = useState('');
  const [newPersonGender, setNewPersonGender] = useState('ชาย');
  const [newPersonUniShort, setNewPersonUniShort] = useState('มมส');
  const [newPersonCustomUni, setNewPersonCustomUni] = useState('');
  const [newPersonRoleType, setNewPersonRoleType] = useState('committee'); // 'committee' | 'mc' | 'photographer' | 'dev' | 'staff' | 'participant'
  const [newPersonCallsign, setNewPersonCallsign] = useState('(STAFF)');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonConfirmStatus, setNewPersonConfirmStatus] = useState('confirmed'); // 'confirmed' | 'pending' | 'declined'
  const [newPersonNeedAccom, setNewPersonNeedAccom] = useState(false);
  const [newPersonDutyNote, setNewPersonDutyNote] = useState('คณะกรรมการดำเนินงาน');
  const [newPersonOrderShirt, setNewPersonOrderShirt] = useState(false);
  const [newPersonShirtSize, setNewPersonShirtSize] = useState('L');
  const [isSavingNewPerson, setIsSavingNewPerson] = useState(false);

  const hasAutoSyncedRef = useRef(false);

  // Helper to build registration payload from one of the 8 official committee specs
  const buildCommitteeRegistrationPayload = (spec) => {
    const uniObj = OFFICIAL_NETWORK_INSTITUTIONS.find(u => u.shortTag === spec.university_short) || OFFICIAL_NETWORK_INSTITUTIONS[0];
    return {
      user_id: `staff_${spec.key}`,
      committee_member_key: spec.key,
      title_th: spec.title_th || '',
      first_name: spec.first_name,
      last_name: spec.last_name || '',
      first_name_th: spec.first_name,
      last_name_th: spec.last_name || '',
      nickname: spec.nickname || '',
      gender: spec.gender || 'ชาย',
      callsign: spec.callsign || '(STAFF)',
      phone: '0812345678',
      dob: '2004-01-01',
      age_years: 22,
      age_months: 0,
      age_days: 0,
      blood_group: 'B',
      emergency_name: 'ชมรมกู้ภัยราชพฤกษ์',
      emergency_phone: '0812345678',
      food_allergy: 'ไม่มี',
      medical_history: 'ไม่มี',
      previous_training: 'ผ่านการฝึกอบรมกู้ชีพกู้ภัย',
      institution: spec.institution || uniObj.label,
      affiliation: spec.affiliation || uniObj.shortTag,
      institution_abbr_th: spec.university_short || uniObj.shortTag,
      unit: spec.unit || 'ชมรมกู้ภัยราชพฤกษ์',
      full_name_affiliation: `${spec.title_th || ''}${spec.first_name}${spec.last_name ? ' ' + spec.last_name : ''} (${spec.university_short || 'มมส'})`.trim(),
      is_staff: true,
      admin_staff_override: true,
      staff_role_type: spec.staff_role_type || 'committee',
      registration_type: 'staff',
      staff_id_card_only: true,
      committee_duty_note: spec.committee_duty_note || 'คณะกรรมการดำเนินงาน',
      special_notes: spec.committee_duty_note || 'คณะกรรมการดำเนินงาน',
      id_card_photo: spec.photo || '',
      shirt_size: '-',
      payment_plan: 'full',
      payment_status: 'paid',
      installment_1_status: 'paid',
      payment_amount: 0,
      installment_1_amount: 0,
      installment_2_amount: 0,
      attendance_confirmed_status: 'confirmed',
      attendance_confirmed_at: new Date().toISOString(),
      attendance_confirmed_by: 'admin',
      attendance_need_accommodation: false,
      attendance_meal_confirmed: true,
      status: 'approved'
    };
  };

  // Sync the 8 official committee members into registrations (Smart Deduplication: never duplicates existing people!)
  const handleSyncOfficial8Committee = async (forceRestoreDeleted = false, silent = false) => {
    if (isSyncingCommittee) return;
    setIsSyncingCommittee(true);
    try {
      let deletedKeys = getDeletedCommitteeKeys();
      if (forceRestoreDeleted) {
        deletedKeys = [];
        setDeletedCommitteeKeys([]);
      }

      let matchedExistingCount = 0;
      let newlyAddedCount = 0;
      let enrichedExistingCount = 0;

      for (const spec of OFFICIAL_8_COMMITTEE_ROSTER) {
        if (!forceRestoreDeleted && deletedKeys.includes(spec.key)) {
          continue;
        }
        const existing = findExistingRegForCommitteeSpec(registrations, spec);
        if (existing) {
          matchedExistingCount++;
          // If existing record doesn't have committee_duty_note or is_staff set yet, enrich it gently without touching their payment/shirt data
          const needsEnrich =
            !existing.committee_duty_note ||
            !existing.committee_member_key ||
            (!isStaffRegistration(existing) && existing.admin_staff_override !== false);
          if (needsEnrich && onUpdateAllocation) {
            const targetId = existing.user_id || existing.id;
            const patch = {
              committee_member_key: spec.key,
              committee_duty_note: existing.committee_duty_note || spec.committee_duty_note
            };
            if (existing.admin_staff_override !== false) {
              patch.is_staff = true;
              patch.admin_staff_override = true;
              patch.staff_role_type = existing.staff_role_type && existing.staff_role_type !== 'participant'
                ? existing.staff_role_type
                : spec.staff_role_type;
              patch.registration_type = 'staff';
            }
            await onUpdateAllocation(targetId, patch);
            enrichedExistingCount++;
          }
        } else {
          // Not in registrations yet -> create record
          const payload = buildCommitteeRegistrationPayload(spec);
          await DataService.saveRegistration(payload);
          newlyAddedCount++;
        }
      }

      if ((newlyAddedCount > 0 || enrichedExistingCount > 0) && typeof onRefresh === 'function') {
        await onRefresh();
      }

      if (!silent && triggerToast) {
        triggerToast(
          `✅ ตรวจสอบคณะกรรมการและฝ่ายอำนวยการ ${OFFICIAL_8_COMMITTEE_ROSTER.length} ท่านเรียบร้อย: พบชื่อเดิมในระบบ ${matchedExistingCount} ท่าน (ไม่สร้างซ้ำ) • เพิ่มรายชื่อที่ยังไม่มีเข้าตาราง ${newlyAddedCount} ท่าน`
        );
      }
    } catch (err) {
      console.error('Sync committee roster error:', err);
      if (!silent && triggerToast) {
        triggerToast('เกิดข้อผิดพลาดในการซิงค์รายชื่อคณะกรรมการ', 'error');
      }
    } finally {
      setIsSyncingCommittee(false);
    }
  };

  // Auto-check on initial mount once registrations are loaded
  useEffect(() => {
    if (!registrations || registrations.length === 0 || hasAutoSyncedRef.current) return;
    const deletedKeys = getDeletedCommitteeKeys();
    const missingAny = OFFICIAL_8_COMMITTEE_ROSTER.some((spec) => {
      if (deletedKeys.includes(spec.key)) return false;
      return !findExistingRegForCommitteeSpec(registrations, spec);
    });
    hasAutoSyncedRef.current = true;
    if (missingAny) {
      handleSyncOfficial8Committee(false, true);
    }
  }, [registrations]);

  // Enrich registrations with resolved metadata once
  const enrichedRegs = useMemo(() => {
    return (registrations || []).map((reg) => {
      const uniInfo = resolveUniversityInfo(reg);
      const gender = resolveGender(reg);
      const isStaff = isStaffRegistration(reg);
      const staffRoleType = isStaff ? resolveStaffRoleType(reg) : 'participant';
      const committeeSpec = findMatchingCommitteeMemberSpec(reg);
      const dutyNote = resolveCommitteeDutyNote(reg);
      const confirmInfo = getAttendanceConfirmationInfo(reg);
      const foodInfo = classifyFoodPreference(reg.food_allergy, reg.special_notes);
      const finInfo = computeApplicantFinance(reg, paymentConfig);
      const hasMedical = Boolean(
        reg.medical_history &&
        !['-', 'ไม่มี', 'ไม่มีครับ', 'ไม่มีค่ะ', 'ปกติ', 'none', 'no'].includes(String(reg.medical_history).trim().toLowerCase())
      );
      const shirtKey = normalizeShirtSizeKey(reg.shirt_size);
      const fullName = `${reg.title_th || reg.title || ''}${reg.first_name || ''} ${reg.last_name || ''}`.trim();

      return {
        reg,
        id: reg.user_id || reg.id,
        fullName,
        uniInfo,
        gender,
        isStaff,
        staffRoleType,
        committeeSpec,
        dutyNote,
        confirmInfo,
        foodInfo,
        finInfo,
        hasMedical,
        shirtKey
      };
    });
  }, [registrations, paymentConfig]);

  // Map the 8 official committee members to their live registration item in the table
  const committee8StatusList = useMemo(() => {
    return OFFICIAL_8_COMMITTEE_ROSTER.map((spec) => {
      const matchedReg = findExistingRegForCommitteeSpec(registrations, spec);
      const matchedItem = matchedReg
        ? enrichedRegs.find((it) => (it.reg.user_id || it.reg.id) === (matchedReg.user_id || matchedReg.id))
        : null;
      const isPreExistingAccount = Boolean(
        matchedReg &&
        !String(matchedReg.user_id || '').startsWith('staff_committee_') &&
        !matchedReg.staff_id_card_only
      );
      return {
        spec,
        matchedReg,
        matchedItem,
        isPresent: Boolean(matchedItem),
        isPreExistingAccount
      };
    });
  }, [registrations, enrichedRegs]);

  // Search filter helper
  const matchesSearch = (item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const { reg, fullName, uniInfo, dutyNote } = item;
    return (
      fullName.toLowerCase().includes(q) ||
      String(reg.nickname || '').toLowerCase().includes(q) ||
      String(reg.callsign || '').toLowerCase().includes(q) ||
      String(reg.phone || '').toLowerCase().includes(q) ||
      String(uniInfo.shortTag || '').toLowerCase().includes(q) ||
      String(uniInfo.label || '').toLowerCase().includes(q) ||
      String(reg.room_assigned || '').toLowerCase().includes(q) ||
      String(reg.group_assigned || '').toLowerCase().includes(q) ||
      String(dutyNote || '').toLowerCase().includes(q)
    );
  };

  const matchesConfirmFilter = (item, fVal) => {
    if (fVal === 'all') return true;
    if (fVal === 'confirmed') return item.confirmInfo.isConfirmed;
    if (fVal === 'pending') return item.confirmInfo.isPending;
    if (fVal === 'declined') return item.confirmInfo.isDeclined;
    if (fVal === 'need_accom') return !item.confirmInfo.isDeclined && item.confirmInfo.needAccommodation;
    if (fVal === 'confirmed_accom') return item.confirmInfo.isConfirmed && item.confirmInfo.needAccommodation;
    if (fVal === 'no_accom') return !item.confirmInfo.isDeclined && !item.confirmInfo.needAccommodation;
    if (fVal === 'special_food') return !item.confirmInfo.isDeclined && item.foodInfo.isSpecial;
    return true;
  };

  // ============================================================================
  // CASCADING / FACETED FILTER SETS
  // Each dropdown computes its option counts from the items matching all
  // preceding filters so selecting a university in Box 1 updates Box 2, 3, 4!
  // ============================================================================
  const searchScoped = useMemo(() => enrichedRegs.filter(matchesSearch), [enrichedRegs, searchQuery]);

  // Level 1: University options (scoped by search)
  const uniOptions = useMemo(() => {
    const map = new Map();
    searchScoped.forEach((item) => {
      const k = item.uniInfo.key;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          shortTag: item.uniInfo.shortTag,
          label: item.uniInfo.label,
          isMsu: item.uniInfo.isMsu,
          count: 0
        });
      }
      map.get(k).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.isMsu && !b.isMsu) return -1;
      if (!a.isMsu && b.isMsu) return 1;
      return b.count - a.count;
    });
  }, [searchScoped]);

  // After University Filter
  const afterUniScoped = useMemo(() => {
    if (uniFilter === 'all') return searchScoped;
    return searchScoped.filter((item) => item.uniInfo.key === uniFilter);
  }, [searchScoped, uniFilter]);

  // Level 2: Role options (scoped by search + uniFilter)
  const roleFacetCounts = useMemo(() => {
    let participant = 0;
    let staff = 0;
    afterUniScoped.forEach((item) => {
      if (item.isStaff) staff++;
      else participant++;
    });
    return { all: afterUniScoped.length, participant, staff };
  }, [afterUniScoped]);

  // After Role Filter
  const afterRoleScoped = useMemo(() => {
    if (roleFilter === 'all') return afterUniScoped;
    if (roleFilter === 'staff') return afterUniScoped.filter((item) => item.isStaff);
    return afterUniScoped.filter((item) => !item.isStaff);
  }, [afterUniScoped, roleFilter]);

  // Level 3: Gender options (scoped by search + uniFilter + roleFilter)
  const genderFacetCounts = useMemo(() => {
    let male = 0;
    let female = 0;
    afterRoleScoped.forEach((item) => {
      if (item.gender === 'หญิง') female++;
      else male++;
    });
    return { all: afterRoleScoped.length, male, female };
  }, [afterRoleScoped]);

  // After Gender Filter
  const afterGenderScoped = useMemo(() => {
    if (genderFilter === 'all') return afterRoleScoped;
    return afterRoleScoped.filter((item) => item.gender === genderFilter);
  }, [afterRoleScoped, genderFilter]);

  // Level 4: Confirmation & Logistics options (scoped by search + uniFilter + roleFilter + genderFilter)
  const confirmFacetCounts = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let declined = 0;
    let needAccom = 0;
    let confirmedAccom = 0;
    let noAccom = 0;
    let specialFood = 0;

    afterGenderScoped.forEach((item) => {
      if (item.confirmInfo.isConfirmed) confirmed++;
      else if (item.confirmInfo.isDeclined) declined++;
      else pending++;

      if (!item.confirmInfo.isDeclined) {
        if (item.confirmInfo.needAccommodation) {
          needAccom++;
          if (item.confirmInfo.isConfirmed) confirmedAccom++;
        } else {
          noAccom++;
        }
        if (item.foodInfo.isSpecial) specialFood++;
      }
    });

    return {
      all: afterGenderScoped.length,
      confirmed,
      pending,
      declined,
      needAccom,
      confirmedAccom,
      noAccom,
      specialFood
    };
  }, [afterGenderScoped]);

  // Final filtered list for the table AND scoped summary metrics (Sorted: Committee MSU -> Committee KKU -> RCP -> TSI -> KKU Volunteers, Male -> Female)
  const filteredItems = useMemo(() => {
    return afterGenderScoped
      .filter((item) => matchesConfirmFilter(item, confirmFilter))
      .sort(compareRosterItems);
  }, [afterGenderScoped, confirmFilter]);

  // ============================================================================
  // COMPREHENSIVE METRICS COMPUTATION (Works on any subset: filtered or global)
  // ============================================================================
  const computeSummaryStats = (itemsSubset) => {
    const stats = {
      total: itemsSubset.length,
      participants: 0,
      staff: 0,
      msuTotal: 0,
      externalTotal: 0,
      male: 0,
      female: 0,
      // Attendance Confirmation
      confirmed: 0,
      confirmedParticipants: 0,
      confirmedStaff: 0,
      pending: 0,
      pendingParticipants: 0,
      pendingStaff: 0,
      declined: 0,
      declinedParticipants: 0,
      declinedStaff: 0,
      activeExpected: 0, // confirmed + pending (excluding declined)
      activeExpectedParticipants: 0,
      activeExpectedStaff: 0,
      confirmedMale: 0,
      confirmedFemale: 0,
      // Accommodation (Dormitory Rooms)
      confirmedNeedAccom: 0,
      confirmedNeedAccomMale: 0,
      confirmedNeedAccomFemale: 0,
      expectedNeedAccom: 0, // confirmed + pending who need accommodation
      expectedNeedAccomMale: 0,
      expectedNeedAccomFemale: 0,
      noAccomCount: 0,
      roomAssignedCount: 0,
      roomUnassignedNeedAccom: 0,
      // Catering & Meals
      confirmedMealsTotal: 0,
      confirmedMealsNormal: 0,
      confirmedMealsHalal: 0,
      confirmedMealsVegan: 0,
      confirmedMealsSeafood: 0,
      confirmedMealsNoBeef: 0,
      confirmedMealsOtherAllergy: 0,
      expectedMealsTotal: 0,
      expectedMealsNormal: 0,
      expectedMealsHalal: 0,
      expectedMealsVegan: 0,
      expectedMealsSeafood: 0,
      expectedMealsNoBeef: 0,
      expectedMealsOtherAllergy: 0,
      specialFoodList: [],
      medicalCount: 0,
      // Finance
      expectedFeeTotal: 0,
      collectedFeeTotal: 0,
      outstandingFeeTotal: 0,
      fullyPaidCount: 0,
      overpaidRefundTotal: 0,
      // Shirts
      shirtCounts: { SS: 0, S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0, '5XL': 0, 'อื่นๆ': 0 },
      totalRegShirts: 0,
      receivedRegShirts: 0
    };

    itemsSubset.forEach((item) => {
      const { reg, uniInfo, gender, isStaff, confirmInfo, foodInfo, finInfo, hasMedical, shirtKey } = item;

      if (isStaff) stats.staff++;
      else stats.participants++;

      if (uniInfo.isMsu) stats.msuTotal++;
      else stats.externalTotal++;

      if (gender === 'หญิง') stats.female++;
      else stats.male++;

      if (hasMedical) stats.medicalCount++;

      // Finance
      stats.expectedFeeTotal += finInfo.totalFee;
      stats.collectedFeeTotal += finInfo.collected;
      stats.outstandingFeeTotal += finInfo.outstanding;
      if (finInfo.isFullyPaid) stats.fullyPaidCount++;
      stats.overpaidRefundTotal += finInfo.overpaidRefund;

      // Shirts
      if (reg.shirt_size && reg.shirt_size !== '-') {
        stats.totalRegShirts++;
        if (stats.shirtCounts[shirtKey] !== undefined) {
          stats.shirtCounts[shirtKey]++;
        } else {
          stats.shirtCounts['อื่นๆ']++;
        }
        if (reg.shirt_received || reg.shirt_pickup_status === 'received') {
          stats.receivedRegShirts++;
        }
      }

      if (reg.room_assigned && String(reg.room_assigned).trim()) {
        stats.roomAssignedCount++;
      }

      // Attendance Confirmation & Logistics
      if (confirmInfo.isConfirmed) {
        stats.confirmed++;
        if (isStaff) stats.confirmedStaff++;
        else stats.confirmedParticipants++;
        stats.activeExpected++;
        if (isStaff) stats.activeExpectedStaff++;
        else stats.activeExpectedParticipants++;
        if (gender === 'หญิง') stats.confirmedFemale++;
        else stats.confirmedMale++;
      } else if (confirmInfo.isDeclined) {
        stats.declined++;
        if (isStaff) stats.declinedStaff++;
        else stats.declinedParticipants++;
      } else {
        stats.pending++;
        if (isStaff) stats.pendingStaff++;
        else stats.pendingParticipants++;
        stats.activeExpected++;
        if (isStaff) stats.activeExpectedStaff++;
        else stats.activeExpectedParticipants++;
      }

      // Accommodation calculations (only for non-declined)
      if (!confirmInfo.isDeclined) {
        if (confirmInfo.needAccommodation) {
          stats.expectedNeedAccom++;
          if (gender === 'หญิง') stats.expectedNeedAccomFemale++;
          else stats.expectedNeedAccomMale++;

          if (!reg.room_assigned || !String(reg.room_assigned).trim()) {
            stats.roomUnassignedNeedAccom++;
          }

          if (confirmInfo.isConfirmed) {
            stats.confirmedNeedAccom++;
            if (gender === 'หญิง') stats.confirmedNeedAccomFemale++;
            else stats.confirmedNeedAccomMale++;
          }
        } else {
          stats.noAccomCount++;
        }

        // Meal calculations (only for non-declined who take meals)
        if (confirmInfo.needMeals) {
          stats.expectedMealsTotal++;
          if (foodInfo.type === 'normal') stats.expectedMealsNormal++;
          else if (foodInfo.type === 'halal') stats.expectedMealsHalal++;
          else if (foodInfo.type === 'vegan') stats.expectedMealsVegan++;
          else if (foodInfo.type === 'seafood') stats.expectedMealsSeafood++;
          else if (foodInfo.type === 'nobeef') stats.expectedMealsNoBeef++;
          else stats.expectedMealsOtherAllergy++;

          if (foodInfo.isSpecial) {
            stats.specialFoodList.push(item);
          }

          if (confirmInfo.isConfirmed) {
            stats.confirmedMealsTotal++;
            if (foodInfo.type === 'normal') stats.confirmedMealsNormal++;
            else if (foodInfo.type === 'halal') stats.confirmedMealsHalal++;
            else if (foodInfo.type === 'vegan') stats.confirmedMealsVegan++;
            else if (foodInfo.type === 'seafood') stats.confirmedMealsSeafood++;
            else if (foodInfo.type === 'nobeef') stats.confirmedMealsNoBeef++;
            else stats.confirmedMealsOtherAllergy++;
          }
        }
      }
    });

    return stats;
  };

  // Scoped stats (reflects active university / role / gender / confirmation filters!)
  const activeStats = useMemo(() => computeSummaryStats(filteredItems), [filteredItems]);
  // Global stats (for reference comparison when filtered)
  const globalStats = useMemo(() => computeSummaryStats(enrichedRegs), [enrichedRegs]);

  // University Matrix Breakdown (respecting search, role, gender, confirmFilter so clicking filters updates the matrix too)
  const universityMatrix = useMemo(() => {
    const map = new Map();
    enrichedRegs.forEach((item) => {
      const k = item.uniInfo.key;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          shortTag: item.uniInfo.shortTag,
          label: item.uniInfo.label,
          isMsu: item.uniInfo.isMsu,
          items: []
        });
      }
      map.get(k).items.push(item);
    });

    return Array.from(map.values())
      .map((u) => ({
        ...u,
        stats: computeSummaryStats(u.items)
      }))
      .sort((a, b) => {
        if (a.isMsu && !b.isMsu) return -1;
        if (!a.isMsu && b.isMsu) return 1;
        return b.stats.total - a.stats.total;
      });
  }, [enrichedRegs]);

  const isAnyFilterActive =
    uniFilter !== 'all' ||
    roleFilter !== 'all' ||
    genderFilter !== 'all' ||
    confirmFilter !== 'all' ||
    Boolean(searchQuery.trim());

  // Handlers for 1-click Attendance Confirmation & Accommodation Toggle
  const handleQuickUpdateConfirmation = async (item, nextStatus) => {
    if (!onUpdateAllocation) return;
    setUpdatingId(item.id);
    try {
      const now = new Date().toISOString();
      const defaultAccom = !item.uniInfo.isMsu || Boolean(item.reg.room_assigned);
      const patch = {
        attendance_confirmed_status: nextStatus,
        attendance_confirmed_at: nextStatus === 'pending' ? '' : now,
        attendance_confirmed_by: 'admin',
        attendance_need_accommodation:
          nextStatus === 'declined'
            ? false
            : typeof item.reg.attendance_need_accommodation === 'boolean'
            ? item.reg.attendance_need_accommodation
            : defaultAccom,
        attendance_meal_confirmed:
          nextStatus === 'declined'
            ? false
            : typeof item.reg.attendance_meal_confirmed === 'boolean'
            ? item.reg.attendance_meal_confirmed
            : true
      };
      await onUpdateAllocation(item.id, patch);
      const statusLabel =
        nextStatus === 'confirmed'
          ? '✅ ยืนยันมาแน่นอน'
          : nextStatus === 'declined'
          ? '❌ ไม่สะดวกเข้าร่วม'
          : '⏳ รอยืนยัน';
      if (triggerToast) {
        triggerToast(`อัปเดตสถานะคุณ ${item.fullName} เป็น "${statusLabel}" เรียบร้อยแล้ว`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickToggleAccommodation = async (item) => {
    if (!onUpdateAllocation) return;
    setUpdatingId(item.id);
    try {
      const nextNeed = !item.confirmInfo.needAccommodation;
      await onUpdateAllocation(item.id, {
        attendance_need_accommodation: nextNeed
      });
      if (triggerToast) {
        triggerToast(
          `อัปเดตที่พักของคุณ ${item.fullName}: ${nextNeed ? '🏨 ต้องการพักหอพักโครงการ' : '🏠 ไม่เข้าพักหอพัก (ไป-กลับเอง)'}`
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Inline University Dropdown change handler (for any person in the table or committee roster)
  const handleChangePersonUniversity = async (item, nextUniShort) => {
    if (!onUpdateAllocation || !item) return;
    setUpdatingId(item.id);
    try {
      const uniObj = OFFICIAL_NETWORK_INSTITUTIONS.find((u) => u.shortTag === nextUniShort);
      const nextInstitution = uniObj ? uniObj.label : nextUniShort;
      const nextAbbrTh = uniObj ? uniObj.shortTag : nextUniShort;
      const cleanName = `${item.reg.title_th || ''}${item.reg.first_name || ''}${item.reg.last_name ? ' ' + item.reg.last_name : ''}`.trim();
      const nextFullNameAff = `${cleanName} (${nextAbbrTh})`.trim();

      await onUpdateAllocation(item.id, {
        institution: nextInstitution,
        affiliation: nextAbbrTh,
        institution_abbr_th: nextAbbrTh,
        full_name_affiliation: nextFullNameAff
      });
      if (triggerToast) {
        triggerToast(`🏛️ เปลี่ยนมหาวิทยาลัยของ "${item.fullName}" เป็น "${nextAbbrTh}" เรียบร้อยแล้ว`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Inline Role Type change handler (Participant vs Committee / MC / Photographer / Dev / Staff)
  const handleChangePersonRoleType = async (item, nextRoleType) => {
    if (!onUpdateAllocation || !item) return;
    setUpdatingId(item.id);
    try {
      const isNextStaff = nextRoleType !== 'participant';
      const nextCallsign = formatStaffCallsign(item.reg.callsign || '', isNextStaff);
      const patch = {
        is_staff: isNextStaff,
        admin_staff_override: isNextStaff,
        staff_role_type: nextRoleType,
        registration_type: isNextStaff ? 'staff' : 'participant',
        callsign: nextCallsign
      };
      if (isNextStaff && (!item.reg.shirt_size || item.reg.shirt_size === '-') && !item.reg.payment_slip_url && !item.reg.installment_1_slip_url) {
        patch.staff_id_card_only = true;
      }
      await onUpdateAllocation(item.id, patch);
      if (triggerToast) {
        const opt = STAFF_ROLE_OPTIONS.find((o) => o.value === nextRoleType);
        triggerToast(`🛠️ เปลี่ยนบทบาทของ "${item.fullName}" เป็น "${opt ? opt.badge || opt.label : nextRoleType}" เรียบร้อยแล้ว`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Inline Save Duty / Role Note ("คือใคร ทำอะไร")
  const handleSaveDutyNote = async (item, customNoteText) => {
    if (!onUpdateAllocation || !item) return;
    const finalNote = (customNoteText !== undefined ? customNoteText : (dutyNoteDrafts[item.id] ?? item.dutyNote ?? '')).trim();
    setUpdatingId(item.id);
    try {
      await onUpdateAllocation(item.id, {
        committee_duty_note: finalNote,
        attendance_confirm_note: finalNote
      });
      setDutyNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      if (triggerToast) {
        triggerToast(`📝 บันทึกหมายเหตุหน้าที่ของ "${item.fullName}" เรียบร้อยแล้ว`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete person from table (Dev / Admin)
  const handleDeletePersonFromRoster = async (item) => {
    if (!item) return;
    const confirmMsg = `ต้องการลบรายชื่อ "${item.fullName}" (${item.uniInfo.shortTag}) ออกจากตารางใช่หรือไม่?`;
    if (askConfirm) {
      const ok = await askConfirm({
        title: `🗑️ ยืนยันการลบรายชื่อออกจากตาราง`,
        message: confirmMsg,
        confirmText: '🗑️ ยืนยันลบรายชื่อ',
        cancelText: 'ยกเลิก',
        variant: 'danger'
      });
      if (!ok) return;
    } else if (!window.confirm(confirmMsg)) {
      return;
    }

    setUpdatingId(item.id);
    try {
      // If this person matches one of the 8 default committee members, record in deleted keys so auto-sync doesn't re-add them automatically
      const matchedSpec = item.committeeSpec || findMatchingCommitteeMemberSpec(item.reg);
      if (matchedSpec) {
        const curDeleted = getDeletedCommitteeKeys();
        setDeletedCommitteeKeys([...curDeleted, matchedSpec.key]);
      }

      if (onDeleteRegistration) {
        await onDeleteRegistration(item.id);
      } else {
        await DataService.deleteRegistration(item.id);
        if (typeof onRefresh === 'function') await onRefresh();
      }

      if (triggerToast) {
        triggerToast(`🗑️ ลบรายชื่อ "${item.fullName}" ออกจากตารางเรียบร้อยแล้ว`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Re-add a single committee member from the 8-member checklist
  const handleReAddSingleCommitteeMember = async (spec) => {
    if (!spec) return;
    setIsSyncingCommittee(true);
    try {
      const curDeleted = getDeletedCommitteeKeys().filter((k) => k !== spec.key);
      setDeletedCommitteeKeys(curDeleted);
      const existing = findExistingRegForCommitteeSpec(registrations, spec);
      if (!existing) {
        const payload = buildCommitteeRegistrationPayload(spec);
        await DataService.saveRegistration(payload);
        if (typeof onRefresh === 'function') await onRefresh();
      }
      if (triggerToast) {
        triggerToast(`✅ เพิ่ม "${spec.display_name}" เข้าสู่ตารางเรียบร้อยแล้ว`);
      }
    } finally {
      setIsSyncingCommittee(false);
    }
  };

  // Add New Person Modal Submit Handler (Dev / Admin can add anyone to the table)
  const handleAddPersonSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanFirst = newPersonFirstName.trim();
    const cleanLast = newPersonLastName.trim();
    if (!cleanFirst) {
      if (triggerToast) triggerToast('กรุณาระบุชื่อ (หรือชื่อเรียก เช่น น้องฟิล์ม)', 'warning');
      return;
    }

    // Check duplicate by name before adding
    const targetFullName = `${cleanFirst} ${cleanLast}`.trim().toLowerCase();
    const duplicate = (registrations || []).find((r) => {
      const rName = `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase();
      return rName && rName === targetFullName;
    });

    if (duplicate) {
      const dupMsg = `พบรายชื่อ "${cleanFirst} ${cleanLast}" มีอยู่ในระบบแล้ว (${resolveUniversityInfo(duplicate).shortTag}) ต้องการอัปเดตข้อมูลคนเดิมแทนการสร้างซ้ำหรือไม่?`;
      const proceedUpdate = askConfirm
        ? await askConfirm({
            title: '⚠️ พบรายชื่อนี้มีอยู่ในระบบแล้ว (ป้องกันข้อมูลซ้ำ)',
            message: dupMsg,
            confirmText: '✓ อัปเดตคนเดิม (ไม่สร้างซ้ำ)',
            cancelText: 'ยกเลิก',
            variant: 'warning'
          })
        : window.confirm(dupMsg);
      if (!proceedUpdate) return;
    }

    setIsSavingNewPerson(true);
    try {
      const uniObj = OFFICIAL_NETWORK_INSTITUTIONS.find((u) => u.shortTag === newPersonUniShort);
      const finalAbbrTh = newPersonUniShort === 'อื่นๆ' ? (newPersonCustomUni.trim() || 'อื่นๆ') : (uniObj?.shortTag || newPersonUniShort);
      const finalInstitution = newPersonUniShort === 'อื่นๆ' ? (newPersonCustomUni.trim() || 'หน่วยงานภายนอก') : (uniObj?.label || newPersonUniShort);
      const isStaffRole = newPersonRoleType !== 'participant';
      const cleanTitle = newPersonTitle === 'ไม่ระบุ' ? '' : newPersonTitle;
      const finalCallsign = isStaffRole
        ? formatStaffCallsign(newPersonCallsign.trim() || '(STAFF)', true)
        : newPersonCallsign.trim();

      const targetUserId = duplicate
        ? (duplicate.user_id || duplicate.id)
        : `manual_${isStaffRole ? 'staff' : 'reg'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const payload = {
        ...(duplicate || {}),
        user_id: targetUserId,
        title_th: cleanTitle,
        first_name: cleanFirst,
        last_name: cleanLast,
        first_name_th: cleanFirst,
        last_name_th: cleanLast,
        nickname: newPersonNickname.trim(),
        gender: newPersonGender,
        callsign: finalCallsign,
        phone: newPersonPhone.trim() || duplicate?.phone || '',
        institution: finalInstitution,
        affiliation: finalAbbrTh,
        institution_abbr_th: finalAbbrTh,
        unit: duplicate?.unit || (finalAbbrTh === 'มมส' ? 'ชมรมกู้ภัยราชพฤกษ์' : finalInstitution),
        full_name_affiliation: `${cleanTitle}${cleanFirst}${cleanLast ? ' ' + cleanLast : ''} (${finalAbbrTh})`.trim(),
        is_staff: isStaffRole,
        admin_staff_override: isStaffRole,
        staff_role_type: newPersonRoleType,
        registration_type: isStaffRole ? 'staff' : 'participant',
        staff_id_card_only: isStaffRole ? !newPersonOrderShirt : false,
        shirt_size: newPersonOrderShirt ? newPersonShirtSize : (duplicate?.shirt_size || '-'),
        committee_duty_note: newPersonDutyNote.trim(),
        special_notes: newPersonDutyNote.trim() || duplicate?.special_notes || '',
        attendance_confirmed_status: newPersonConfirmStatus,
        attendance_confirmed_at: newPersonConfirmStatus === 'pending' ? '' : new Date().toISOString(),
        attendance_confirmed_by: 'admin',
        attendance_need_accommodation: newPersonConfirmStatus === 'declined' ? false : Boolean(newPersonNeedAccom),
        attendance_meal_confirmed: newPersonConfirmStatus !== 'declined',
        payment_plan: duplicate?.payment_plan || 'full',
        payment_status: duplicate?.payment_status || (isStaffRole && !newPersonOrderShirt ? 'paid' : 'unpaid'),
        installment_1_status: duplicate?.installment_1_status || (isStaffRole && !newPersonOrderShirt ? 'paid' : 'unpaid'),
        payment_amount: duplicate?.payment_amount ?? (isStaffRole && !newPersonOrderShirt ? 0 : (isStaffRole ? STAFF_SHIRT_FEE : (finalAbbrTh === 'มมส' ? 650 : 850))),
        status: 'approved'
      };

      await DataService.saveRegistration(payload);
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
      setShowAddPersonModal(false);
      setNewPersonFirstName('');
      setNewPersonLastName('');
      setNewPersonNickname('');
      setNewPersonPhone('');
      if (triggerToast) {
        triggerToast(
          duplicate
            ? `✅ อัปเดตข้อมูลของ "${cleanTitle}${cleanFirst} ${cleanLast}" (${finalAbbrTh}) เรียบร้อยแล้ว (ไม่สร้างซ้ำ)`
            : `➕ เพิ่ม "${cleanTitle}${cleanFirst} ${cleanLast}" (${finalAbbrTh}) เข้าสู่ตารางและคำนวณยอดรวมเรียบร้อยแล้ว!`
        );
      }
    } catch (err) {
      console.error('Add person error:', err);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการบันทึกรายชื่อ', 'error');
    } finally {
      setIsSavingNewPerson(false);
    }
  };

  // Bulk confirm all currently filtered pending applicants
  const handleBulkConfirmFiltered = async () => {
    const targets = filteredItems.filter((it) => !it.confirmInfo.isConfirmed);
    if (targets.length === 0) {
      if (triggerToast) triggerToast('ทุกคนในรายการที่กรองอยู่ได้รับการยืนยันมาแน่เรียบร้อยแล้ว');
      return;
    }

    const scopeLabel = uniFilter !== 'all' ? `สังกัด ${uniFilter}` : 'ตามตัวกรองปัจจุบัน';
    if (askConfirm) {
      const ok = await askConfirm({
        title: `ยืนยันการเข้าร่วมทั้งหมด (${targets.length} คน)`,
        message: `ต้องการบันทึกสถานะ "✅ ยืนยันเข้าร่วมแน่นอน" ให้กับผู้สมัคร ${scopeLabel} จำนวน ${targets.length} คน พร้อมคำนวณยอดอาหารและห้องพักทันทีใช่หรือไม่?`,
        confirmText: `✅ ยืนยันมาแน่ทั้ง ${targets.length} คน`,
        cancelText: 'ยกเลิก',
        variant: 'info'
      });
      if (!ok) return;
    }

    setIsBulkUpdating(true);
    try {
      const now = new Date().toISOString();
      for (const item of targets) {
        const defaultAccom = !item.uniInfo.isMsu || Boolean(item.reg.room_assigned);
        await onUpdateAllocation(item.id, {
          attendance_confirmed_status: 'confirmed',
          attendance_confirmed_at: now,
          attendance_confirmed_by: 'admin',
          attendance_need_accommodation:
            typeof item.reg.attendance_need_accommodation === 'boolean'
              ? item.reg.attendance_need_accommodation
              : defaultAccom,
          attendance_meal_confirmed: true
        });
      }
      if (triggerToast) {
        triggerToast(`✅ บันทึกยืนยันการเข้าร่วมให้ผู้สมัคร ${targets.length} คน เรียบร้อยแล้ว!`);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Broadcast notification to all pending applicants asking them to confirm attendance
  const handleBroadcastAttendanceSurvey = async () => {
    const pendingList = filteredItems.filter((it) => it.confirmInfo.isPending);
    if (pendingList.length === 0) {
      if (triggerToast) triggerToast('ไม่มีผู้ที่อยู่ในสถานะรอยืนยันในกลุ่มที่เลือก');
      return;
    }

    const scopeLabel = uniFilter !== 'all' ? `เฉพาะ ${uniFilter}` : 'ทุกคนที่ยังไม่กดยืนยัน';
    if (askConfirm) {
      const ok = await askConfirm({
        title: `ส่งแจ้งเตือนสำรวจการมาจริง (${pendingList.length} คน)`,
        message: `ต้องการส่งข้อความแจ้งเตือนด่วนถึงผู้สมัคร ${scopeLabel} จำนวน ${pendingList.length} คน เพื่อให้กดยืนยันการเข้าร่วมกิจกรรมจริง (สำหรับจัดเตรียมอาหารและห้องพักให้พอดีกับจำนวนคน) ใช่หรือไม่?`,
        confirmText: `🔔 ส่งแจ้งเตือน ${pendingList.length} คน`,
        cancelText: 'ยกเลิก',
        variant: 'warning'
      });
      if (!ok) return;
    }

    setIsBulkUpdating(true);
    try {
      const now = new Date().toISOString();
      for (const item of pendingList) {
        const currentMessages = Array.isArray(item.reg.admin_messages) ? [...item.reg.admin_messages] : [];
        const newMsg = {
          id: `msg_rsvp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: '📋 ด่วน! ขอความร่วมมือยืนยันการเข้าร่วมกิจกรรม JRE 2027 (เพื่อจัดเตรียมอาหารและห้องพัก)',
          text: `เรียนคุณ ${item.fullName} (${item.uniInfo.shortTag})\nขอความร่วมมือเข้าสู่ระบบที่หน้าแดชบอร์ด (/dashboard) เพื่อกดปุ่ม "✅ ยืนยันการเข้าร่วมกิจกรรมจริง" และตรวจสอบความต้องการห้องพักหอพัก รวมถึงข้อมูลอาหาร/แพ้อาหาร เพื่อให้ฝ่ายสวัสดิการและสถานที่จัดเตรียมอาหารและห้องพักไว้รองรับท่านได้อย่างเพียงพอและพอดีกับจำนวนผู้เดินทางมาจริงครับ`,
          sender_key: 'welfare',
          sender_name: 'ฝ่ายทะเบียนและสวัสดิการอาหาร/ที่พัก',
          system_name: 'ระบบสำรวจยอดผู้เข้าร่วมจริง JRE 2027',
          created_at: now,
          read: false
        };
        await onUpdateAllocation(item.id, {
          admin_messages: [newMsg, ...currentMessages]
        });
      }
      if (triggerToast) {
        triggerToast(`🔔 ส่งข้อความแจ้งเตือนสำรวจการเข้าร่วมกิจกรรมให้ ${pendingList.length} คน เรียบร้อยแล้ว!`);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Copy formatted executive summary for LINE / Coordination
  const handleCopyExecutiveReport = () => {
    const s = activeStats;
    const scopeTitle = uniFilter !== 'all' ? `เฉพาะสถาบัน: ${uniFilter}` : 'รวมทุกสถาบันทั้งโครงการ';
    const lines = [
      `📊 สรุปยอดรวมทั้งหมด & ยอดจัดเตรียมอาหาร-ห้องพัก JRE 2027 (${scopeTitle})`,
      `อัปเดตเมื่อ: ${new Date().toLocaleString('th-TH')}`,
      `────────────────────`,
      `👥 1. ยอดผู้ลงทะเบียนทั้งหมด: ${s.total} คน`,
      `• ผู้เข้าอบรมปกติ: ${s.participants} คน | Staff คณะทำงาน: ${s.staff} คน`,
      `• เพศชาย: ${s.male} คน | เพศหญิง: ${s.female} คน`,
      `• มมส: ${s.msuTotal} คน | ต่างมหาวิทยาลัย: ${s.externalTotal} คน`,
      `────────────────────`,
      `✅ 2. สถานะการยืนยันเข้าร่วมกิจกรรมจริง (RSVP):`,
      `• ยืนยันมาแน่นอนแล้ว: ${s.confirmed} คน (ชาย ${s.confirmedMale} / หญิง ${s.confirmedFemale})`,
      `• รอกดยืนยัน: ${s.pending} คน`,
      `• แจ้งไม่สะดวกเข้าร่วม/สละสิทธิ์: ${s.declined} คน`,
      `• ยอดคาดการณ์ผู้เข้าร่วมสุทธิ (ไม่รวมสละสิทธิ์): ${s.activeExpected} คน`,
      `────────────────────`,
      `🍱 3. ยอดจัดเตรียมอาหาร (Catering Plan):`,
      `• ยอดตามผู้ยืนยันมาแน่แล้ว: ${s.confirmedMealsTotal} ที่/มื้อ`,
      `  (อาหารปกติ ${s.confirmedMealsNormal} | ฮาลาล/งดหมู ${s.confirmedMealsHalal} | มังสวิรัติ ${s.confirmedMealsVegan} | แพ้อาหารทะเล ${s.confirmedMealsSeafood} | งดเนื้อวัว ${s.confirmedMealsNoBeef} | แพ้อื่นๆ ${s.confirmedMealsOtherAllergy})`,
      `• ยอดเตรียมเผื่อสูงสุด (รวมรอยืนยัน): ${s.expectedMealsTotal} ที่/มื้อ`,
      `  (อาหารปกติ ${s.expectedMealsNormal} | ฮาลาล/งดหมู ${s.expectedMealsHalal} | มังสวิรัติ ${s.expectedMealsVegan} | แพ้อาหารทะเล ${s.expectedMealsSeafood} | งดเนื้อวัว ${s.expectedMealsNoBeef} | แพ้อื่นๆ ${s.expectedMealsOtherAllergy})`,
      `────────────────────`,
      `🏨 4. ยอดจัดเตรียมห้องพักหอพัก (Accommodation Plan):`,
      `• ยืนยันมาแน่และต้องการห้องพัก: ${s.confirmedNeedAccom} คน (ชาย ${s.confirmedNeedAccomMale} / หญิง ${s.confirmedNeedAccomFemale})`,
      `• ยอดต้องการห้องพักรวมคนที่รอยืนยัน: ${s.expectedNeedAccom} คน (ชาย ${s.expectedNeedAccomMale} / หญิง ${s.expectedNeedAccomFemale})`,
      `• ไม่เข้าพักหอพัก (มมส / ไป-กลับเอง): ${s.noAccomCount} คน`,
      `• จัดเลขห้องพักแล้ว: ${s.roomAssignedCount} คน (รอจัดห้อง ${s.roomUnassignedNeedAccom} คน)`,
      `────────────────────`,
      `👕 5. ยอดเสื้อฝึกผู้สมัครรวม: ${s.totalRegShirts} ตัว`,
      `• ${STANDARD_SHIRT_SIZES.map((sz) => `${sz}:${s.shirtCounts[sz] || 0}`).join(' | ')}`,
      `────────────────────`,
      `💰 6. สรุปยอดการเงิน:`,
      `• รับเงินจริงแล้ว: ฿${s.collectedFeeTotal.toLocaleString()} / ฿${s.expectedFeeTotal.toLocaleString()}`,
      `• ยอดค้างชำระ: ฿${s.outstandingFeeTotal.toLocaleString()}`,
      `────────────────────`,
      `🏛️ แยกตามมหาวิทยาลัย:`
    ];

    universityMatrix.forEach((u) => {
      if (uniFilter !== 'all' && u.key !== uniFilter) return;
      lines.push(
        `• ${u.shortTag}: รวม ${u.stats.total} คน (มาแน่ ${u.stats.confirmed} | รอยืนยัน ${u.stats.pending} | ไม่มา ${u.stats.declined}) • พักหอ ${u.stats.expectedNeedAccom} คน (ช.${u.stats.expectedNeedAccomMale}/ญ.${u.stats.expectedNeedAccomFemale})`
      );
    });

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
    if (triggerToast) {
      triggerToast('📋 คัดลอกรายงานสรุปยอดทั้งหมด + ยอดอาหารและห้องพักสำหรับส่ง LINE เรียบร้อยแล้ว!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HERO HEADER */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-indigo-950/70 border-2 border-emerald-500/50 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Summary & Attendance RSVP Hub</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                /admin/summary
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              📊 สรุปยอดทั้งหมดของโครงการ & ระบบยืนยันการเข้าร่วมกิจกรรมจริง
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
              ศูนย์รวมข้อมูลสรุปยอดผู้สมัครทุกมหาวิทยาลัย • สำรวจยืนยันผู้เดินทางมาเข้าร่วมจริง (มาชัวร์ / รอยืนยัน / สละสิทธิ์) • เพื่อคำนวณ <strong>จำนวนอาหารแต่ละมื้อ (แยกปกติ/ฮาลาล/แพ้อาหาร)</strong> และ <strong>จำนวนห้องพักหอพัก (แยกชาย-หญิง)</strong> ให้พอดีกับจำนวนคนจริง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Add Person Modal Button (Dev / Admin) */}
            <button
              type="button"
              onClick={() => setShowAddPersonModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer transition-all active:scale-95"
              title="Dev / Admin สามารถเพิ่มรายชื่อคนเข้าตารางได้โดยตรง พร้อมเลือกมหาวิทยาลัยและบทบาทหน้าที่"
            >
              <UserPlus className="w-4 h-4" />
              <span>➕ เพิ่มคนเข้าตาราง (Dev/Admin)</span>
            </button>

            {/* Toggle Committee 8 Panel */}
            <button
              type="button"
              onClick={() => setShowCommitteeRosterPanel(!showCommitteeRosterPanel)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                showCommitteeRosterPanel
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400/50'
              }`}
              title={`ดูรายชื่อคณะกรรมการดำเนินงานและฝ่ายอำนวยการ ${OFFICIAL_8_COMMITTEE_ROSTER.length} ท่าน และสถานะการอยู่ในตาราง`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>คณะกรรมการ ({committee8StatusList.filter(c => c.isPresent).length}/{OFFICIAL_8_COMMITTEE_ROSTER.length})</span>
            </button>

            <button
              type="button"
              onClick={handleCopyExecutiveReport}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
            >
              {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSummary ? 'คัดลอกสรุปยอดแล้ว!' : '📋 คัดลอกสรุปยอดทั้งหมดส่ง LINE'}</span>
            </button>

            <button
              type="button"
              onClick={handleBroadcastAttendanceSurvey}
              disabled={isBulkUpdating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="ส่งแจ้งเตือนเข้ากล่องข้อความของผู้สมัครที่ยังไม่กดยืนยัน เพื่อให้เข้ามากดยืนยันว่ามาแน่นอน"
            >
              <Bell className="w-4 h-4" />
              <span>🔔 แจ้งเตือนคนรอยืนยัน ({activeStats.pending} คน)</span>
            </button>

            {onNavigateSubpage && (
              <button
                type="button"
                onClick={() => onNavigateSubpage('applicants')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ตารางจัดการผู้สมัครหลัก</span>
              </button>
            )}
          </div>
        </div>

        {/* COMMITTEE 8 MEMBERS PANEL (Collapsible) */}
        {showCommitteeRosterPanel && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border-2 border-amber-500/40 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    👥 คณะกรรมการและฝ่ายอำนวยการโครงการ ({OFFICIAL_8_COMMITTEE_ROSTER.length} ท่าน)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                    อยู่ในตาราง {committee8StatusList.filter(c => c.isPresent).length} / {OFFICIAL_8_COMMITTEE_ROSTER.length} คน
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  🛡️ <strong>ป้องกันข้อมูลซ้ำซ้อน (Deduplication):</strong> หากบุคคลใดมีใบสมัครอยู่ในระบบแล้ว จะเชื่อมโยงข้อมูลเดิมอัตโนมัติ ไม่สร้างรายชื่อซ้ำ • Dev / Admin สามารถปรับสถานะ (มาแน่ / รอ / ไม่มา), เปลี่ยนมหาวิทยาลัย, แก้หมายเหตุหน้าที่ หรือลบ/เพิ่มคนได้อิสระ
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 ${
                    isEditMode
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isEditMode ? 'คลิกเพื่อล็อคโหมดปลอดภัย' : 'คลิกเพื่อเปิดโหมดแก้ไขข้อมูล'}
                >
                  {isEditMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isEditMode ? '🔓 โหมดแก้ไขเปิดอยู่' : '🔒 เปิดโหมดแก้ไข'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncOfficial8Committee}
                  disabled={isSyncingCommittee}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  title={`ตรวจสอบรายชื่อทั้ง ${OFFICIAL_8_COMMITTEE_ROSTER.length} ท่าน และเพิ่มท่านที่ยังไม่อยู่ในตารางให้ครบ`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCommittee ? 'animate-spin' : ''}`} />
                  <span>🔄 ซิงค์/ตรวจเช็คครบ {OFFICIAL_8_COMMITTEE_ROSTER.length} ท่าน</span>
                </button>
              </div>
            </div>

            {/* Grid of the committee and leadership members */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {committee8StatusList.map(({ spec, matchedReg, matchedItem, isPresent, isPreExistingAccount }) => {
                const item = matchedItem;
                const isBusy = item && updatingId === item.id;
                const dutyText = item ? (item.dutyNote || spec.committee_duty_note) : spec.committee_duty_note;

                // Candidate photo resolution: prioritize real registered photo or ID photo, then spec.photo, then dynamic initials
                const candidatePhoto =
                  (matchedReg?.user_avatar && !matchedReg.user_avatar.includes('bottts') && matchedReg.user_avatar) ||
                  (matchedReg?.id_card_photo && !matchedReg.id_card_photo.startsWith('data:') && matchedReg.id_card_photo) ||
                  spec.photo ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(spec.display_name)}`;

                return (
                  <div
                    key={spec.key}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isPresent
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-amber-500/50'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={candidatePhoto}
                            alt={spec.display_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow shrink-0 bg-slate-800"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(spec.display_name)}&backgroundColor=0284c7,d97706,4f46e5,059669`;
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] text-amber-400 font-bold shrink-0">#{spec.order}</span>
                              <h4 className="font-black text-white text-xs sm:text-sm leading-snug break-words">
                                {spec.display_name}
                              </h4>
                            </div>
                            {spec.nickname && (
                              <p className="text-[11px] text-amber-300 font-bold truncate">({spec.nickname})</p>
                            )}
                          </div>
                        </div>

                        {isPresent ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">
                            ✓ ในตาราง
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold shrink-0">
                            ยังไม่มีในตาราง
                          </span>
                        )}
                      </div>

                      {/* Role & Duty note */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 text-[10px] font-bold">
                            {spec.role_label || 'คณะกรรมการดำเนินงาน'}
                          </span>
                          {isPreExistingAccount && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-bold" title="บัญชีผู้สมัครจริงที่มีประวัติชำระเงินในระบบ">
                              🔗 เชื่อมโยงบัญชีเดิม
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-xl border border-slate-800 leading-relaxed">
                          📌 <span className="font-semibold">{dutyText}</span>
                        </div>
                      </div>

                      {/* University selector & Attendance for this committee member */}
                      {item ? (
                        <div className="space-y-2 pt-1">
                          {isEditMode ? (
                            <>
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <span className="text-slate-400 font-bold text-[10px]">สถาบัน:</span>
                                <select
                                  value={item.uniInfo.shortTag}
                                  disabled={isBusy}
                                  onChange={(e) => handleChangePersonUniversity(item, e.target.value)}
                                  className="px-2 py-1 bg-slate-950 border border-indigo-500/40 rounded-lg text-[11px] text-indigo-200 font-bold focus:outline-none cursor-pointer"
                                >
                                  {OFFICIAL_NETWORK_INSTITUTIONS.map((u) => (
                                    <option key={u.shortTag} value={u.shortTag}>
                                      {u.shortTag} - {u.label.replace(/^[-–\s]+/, '')}
                                    </option>
                                  ))}
                                  {item.uniInfo.shortTag === 'อื่นๆ' && (
                                    <option value="อื่นๆ">อื่นๆ</option>
                                  )}
                                </select>
                              </div>

                              {/* Attendance Status buttons (Active in Edit Mode) */}
                              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleQuickUpdateConfirmation(item, 'confirmed')}
                                  className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                    item.confirmInfo.isConfirmed
                                      ? 'bg-emerald-500 text-slate-950 shadow'
                                      : 'text-slate-400 hover:text-emerald-300'
                                  }`}
                                >
                                  ✅ มาแน่
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleQuickUpdateConfirmation(item, 'pending')}
                                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    item.confirmInfo.isPending
                                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                                      : 'text-slate-400 hover:text-amber-300'
                                  }`}
                                >
                                  ⏳ รอ
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleQuickUpdateConfirmation(item, 'declined')}
                                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    item.confirmInfo.isDeclined
                                      ? 'bg-rose-600 text-white shadow font-black'
                                      : 'text-slate-400 hover:text-rose-300'
                                  }`}
                                >
                                  ❌ ไม่มา
                                </button>
                              </div>
                            </>
                          ) : (
                            /* Safe view: read-only badges */
                            <div className="flex items-center justify-between gap-1.5 pt-0.5">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                                🏛️ {item.uniInfo.shortTag}
                              </span>
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                                item.confirmInfo.isConfirmed
                                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                                  : item.confirmInfo.isPending
                                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                                  : 'bg-rose-500/25 text-rose-300 border-rose-500/50'
                              }`}>
                                {item.confirmInfo.isConfirmed
                                  ? '✅ มาแน่นอน 100%'
                                  : item.confirmInfo.isPending
                                  ? '⏳ รอยืนยัน'
                                  : '❌ ไม่สะดวกเข้าร่วม'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleReAddSingleCommitteeMember(spec)}
                            disabled={isSyncingCommittee}
                            className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่มคนนี้เข้าตาราง</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer action for present items */}
                    {item && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-300 font-medium">
                          {item.confirmInfo.needAccommodation ? '🏨 พักหอโครงการ' : '🏠 ไม่พักหอ (ไป-กลับ)'}
                        </span>
                        {isEditMode ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePersonFromRoster(item)}
                            disabled={isBusy}
                            className="px-2 py-0.5 rounded text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                            title="ลบออกจากตาราง (โหมดแก้ไขเปิดอยู่)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700/80 text-[10px]">
                            🔒 โหมดปลอดภัย (ล็อค)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CASCADING / FACETED FILTER BAR (Solves the University Cross-Filter Count Issue) */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span>ระบบกรองข้อมูลแบบเชื่อมโยงตามลำดับ (Cascading Filters — เลือกมหาวิทยาลัยแล้ว ช่องถัดไปจะนับเฉพาะมหาวิทยาลัยที่เลือกทันที)</span>
            </div>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setUniFilter('all');
                  setRoleFilter('all');
                  setGenderFilter('all');
                  setConfirmFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างตัวกรองทั้งหมด (กลับไปดูยอดรวมทุกสถาบัน)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Box 1: University */}
            <div>
              <label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">
                🏛️ 1. สถาบัน / มหาวิทยาลัย
              </label>
              <select
                value={uniFilter}
                onChange={(e) => setUniFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-indigo-500/50 rounded-xl text-xs text-indigo-100 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="all">ทุกมหาวิทยาลัย ({searchScoped.length} คน)</option>
                {uniOptions.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.shortTag} - {u.label.replace(/^[-–\s]+/, '')} ({u.count} คน)
                  </option>
                ))}
              </select>
            </div>

            {/* Box 2: Role */}
            <div>
              <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">
                👥 2. ประเภทผู้เข้าร่วม {uniFilter !== 'all' ? `(${uniFilter})` : ''}
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-purple-500/50 rounded-xl text-xs text-purple-100 font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="all">ทุกประเภท ({roleFacetCounts.all} คน)</option>
                <option value="participant">ผู้เข้าอบรมปกติ ({roleFacetCounts.participant} คน)</option>
                <option value="staff">Staff คณะทำงาน ({roleFacetCounts.staff} คน)</option>
              </select>
            </div>

            {/* Box 3: Gender */}
            <div>
              <label className="block text-[10px] font-bold text-sky-300 uppercase mb-1">
                🚻 3. เพศ (จัดห้องพัก) {uniFilter !== 'all' ? `(${uniFilter})` : ''}
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-sky-500/50 rounded-xl text-xs text-sky-100 font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
              >
                <option value="all">ทุกเพศ ({genderFacetCounts.all} คน)</option>
                <option value="ชาย">เพศชาย ({genderFacetCounts.male} คน)</option>
                <option value="หญิง">เพศหญิง ({genderFacetCounts.female} คน)</option>
              </select>
            </div>

            {/* Box 4: Confirmation & Accommodation Status */}
            <div>
              <label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">
                📋 4. ยืนยันมาจริง / ที่พัก / อาหาร
              </label>
              <select
                value={confirmFilter}
                onChange={(e) => setConfirmFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-xs text-emerald-100 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="all">ทุกสถานะ ({confirmFacetCounts.all} คน)</option>
                <option value="confirmed">ยืนยันมาแน่นอนแล้ว ({confirmFacetCounts.confirmed} คน)</option>
                <option value="pending">รอกดยืนยัน ({confirmFacetCounts.pending} คน)</option>
                <option value="declined">ไม่สะดวกเข้าร่วม / สละสิทธิ์ ({confirmFacetCounts.declined} คน)</option>
                <option value="need_accom">ต้องการพักหอพักโครงการ ({confirmFacetCounts.needAccom} คน)</option>
                <option value="confirmed_accom">ยืนยันมาแน่ + พักหอพัก ({confirmFacetCounts.confirmedAccom} คน)</option>
                <option value="no_accom">ไม่พักหอพัก / ไป-กลับเอง ({confirmFacetCounts.noAccom} คน)</option>
                <option value="special_food">อาหารพิเศษ (แพ้อาหาร / ฮาลาล) ({confirmFacetCounts.specialFood} คน)</option>
              </select>
            </div>

            {/* Box 5: Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                5. ค้นหาชื่อ / นามเรียกขาน / เบอร์โทร
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, ชื่อเล่น, ห้องพัก..."
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {isAnyFilterActive && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black">
                  🎯 กำลังแสดงข้อมูลเฉพาะที่กรอง: {filteredItems.length} คน (จากทั้งหมด {globalStats.total} คน)
                </span>
                {uniFilter !== 'all' && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-bold">
                    🏛️ สถาบัน: {uniFilter}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleBulkConfirmFiltered}
                disabled={isBulkUpdating}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✅ กดยืนยัน &ldquo;มาแน่นอน&rdquo; ทั้งกลุ่มที่กรองนี้ ({filteredItems.filter(i => !i.confirmInfo.isConfirmed).length} คน)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================
          SECTION 1: 4 MASTER EXECUTIVE CARDS (ATTENDANCE, CATERING, ROOMS, FINANCE)
          ======================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: ยอดผู้เข้าร่วม & สถานะยืนยันการมาจริง */}
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-black">
                1. สำรวจยืนยันการมาจริง (RSVP)
              </span>
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <p className="text-xs text-slate-400 font-bold">ยืนยันมาแน่นอนแล้ว</p>
                <p className="text-3xl font-black text-emerald-400 font-mono">
                  {activeStats.confirmed}{' '}
                  <span className="text-sm font-normal text-slate-300">/ {activeStats.total} คน</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-sky-300 block">👨 ชาย {activeStats.confirmedMale}</span>
                <span className="text-xs font-bold text-pink-300 block">👩 หญิง {activeStats.confirmedFemale}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${activeStats.total > 0 ? (activeStats.confirmed / activeStats.total) * 100 : 0}%` }}
                className="bg-emerald-500 h-full"
                title={`ยืนยันมาแน่: ${activeStats.confirmed} คน`}
              />
              <div
                style={{ width: `${activeStats.total > 0 ? (activeStats.pending / activeStats.total) * 100 : 0}%` }}
                className="bg-amber-500 h-full"
                title={`รอยืนยัน: ${activeStats.pending} คน`}
              />
              <div
                style={{ width: `${activeStats.total > 0 ? (activeStats.declined / activeStats.total) * 100 : 0}%` }}
                className="bg-rose-500 h-full"
                title={`ไม่สะดวกมา: ${activeStats.declined} คน`}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[11px]">
              <button
                type="button"
                onClick={() => setConfirmFilter(confirmFilter === 'confirmed' ? 'all' : 'confirmed')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  confirmFilter === 'confirmed'
                    ? 'bg-emerald-500/25 border-emerald-400 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-emerald-300 hover:border-emerald-500/40'
                }`}
              >
                <span className="block font-black text-sm font-mono">{activeStats.confirmed}</span>
                <span>✅ มาแน่</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmFilter(confirmFilter === 'pending' ? 'all' : 'pending')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  confirmFilter === 'pending'
                    ? 'bg-amber-500/25 border-amber-400 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-amber-300 hover:border-amber-500/40'
                }`}
              >
                <span className="block font-black text-sm font-mono">{activeStats.pending}</span>
                <span>⏳ รอยืนยัน</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmFilter(confirmFilter === 'declined' ? 'all' : 'declined')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  confirmFilter === 'declined'
                    ? 'bg-rose-500/25 border-rose-400 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-rose-300 hover:border-rose-500/40'
                }`}
              >
                <span className="block font-black text-sm font-mono">{activeStats.declined}</span>
                <span>❌ ไม่มา</span>
              </button>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>ผู้เข้าอบรม {activeStats.participants} • Staff {activeStats.staff}</span>
            <span className="text-emerald-300 font-bold">คาดการณ์สุทธิ: {activeStats.activeExpected} คน</span>
          </div>
        </div>

        {/* Card 2: สรุปยอดจัดเตรียมอาหารตามจำนวนจริง (Exact Catering Plan) */}
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-black">
                2. ยอดจัดเตรียมอาหาร (ต่อมื้อ)
              </span>
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 font-bold block">เฉพาะคนยืนยันมาแน่</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{activeStats.confirmedMealsTotal}</span>
                <span className="text-[11px] text-slate-300 ml-1">กล่อง/มื้อ</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/40">
                <span className="text-[10px] text-amber-300 font-bold block">รวมรอยืนยัน (เผื่อสูงสุด)</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{activeStats.expectedMealsTotal}</span>
                <span className="text-[11px] text-slate-300 ml-1">กล่อง/มื้อ</span>
              </div>
            </div>

            <div className="space-y-1 text-xs pt-1">
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-slate-300">🍱 อาหารปกติ (ทานได้ทุกอย่าง):</span>
                <span className="font-mono font-bold text-white">
                  มาแน่ <strong className="text-emerald-400">{activeStats.confirmedMealsNormal}</strong> (รวม {activeStats.expectedMealsNormal})
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-emerald-300">🕌 ฮาลาล / อิสลาม / งดหมู:</span>
                <span className="font-mono font-bold text-emerald-300">
                  มาแน่ <strong>{activeStats.confirmedMealsHalal}</strong> (รวม {activeStats.expectedMealsHalal})
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-amber-300">🦐 แพ้อาหารทะเล / กุ้ง / ปู:</span>
                <span className="font-mono font-bold text-amber-300">
                  มาแน่ <strong>{activeStats.confirmedMealsSeafood}</strong> (รวม {activeStats.expectedMealsSeafood})
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-rose-300">🥗 มังสวิรัติ / งดเนื้อ / แพ้อื่นๆ:</span>
                <span className="font-mono font-bold text-rose-300">
                  มาแน่ <strong>{activeStats.confirmedMealsVegan + activeStats.confirmedMealsNoBeef + activeStats.confirmedMealsOtherAllergy}</strong> (รวม {activeStats.expectedMealsVegan + activeStats.expectedMealsNoBeef + activeStats.expectedMealsOtherAllergy})
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">โรคประจำตัว: <strong className="text-rose-400">{activeStats.medicalCount} คน</strong></span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('catering')}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center gap-0.5"
              >
                <span>เปิดศูนย์อาหาร & สุขภาวะ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 3: สรุปยอดจัดเตรียมห้องพักหอพัก (Exact Accommodation Plan) */}
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-sky-500/40 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-black">
                3. ยอดจัดเตรียมห้องพักหอพัก
              </span>
              <BedDouble className="w-5 h-5 text-sky-400" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 font-bold block">มาแน่ + พักหอพัก</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{activeStats.confirmedNeedAccom}</span>
                <span className="text-[11px] text-slate-300 ml-1">คน</span>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  ช. <strong className="text-sky-300">{activeStats.confirmedNeedAccomMale}</strong> • ญ. <strong className="text-pink-300">{activeStats.confirmedNeedAccomFemale}</strong>
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-sky-950/30 border border-sky-500/40">
                <span className="text-[10px] text-sky-300 font-bold block">รวมรอยืนยันที่พักหอ</span>
                <span className="text-2xl font-black text-sky-300 font-mono">{activeStats.expectedNeedAccom}</span>
                <span className="text-[11px] text-slate-300 ml-1">คน</span>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  ช. <strong className="text-sky-300">{activeStats.expectedNeedAccomMale}</strong> • ญ. <strong className="text-pink-300">{activeStats.expectedNeedAccomFemale}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs pt-1">
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-sky-300">🛏️ ประมาณการห้องพักชาย (4 คน/ห้อง):</span>
                <span className="font-mono font-bold text-white">
                  ~{Math.ceil(activeStats.confirmedNeedAccomMale / 4)} - {Math.ceil(activeStats.expectedNeedAccomMale / 4)} ห้อง
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-pink-300">🛏️ ประมาณการห้องพักหญิง (4 คน/ห้อง):</span>
                <span className="font-mono font-bold text-white">
                  ~{Math.ceil(activeStats.confirmedNeedAccomFemale / 4)} - {Math.ceil(activeStats.expectedNeedAccomFemale / 4)} ห้อง
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-950/80">
                <span className="text-slate-400">🏠 ไม่เข้าพักหอพัก (มมส / ไป-กลับเอง):</span>
                <span className="font-mono font-bold text-slate-300">{activeStats.noAccomCount} คน</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold">จัดเลขห้องแล้ว: {activeStats.roomAssignedCount} คน</span>
            <span className="text-amber-300 font-bold">รอจัดห้อง: {activeStats.roomUnassignedNeedAccom} คน</span>
          </div>
        </div>

        {/* Card 4: สรุปยอดการเงิน & เสื้อฝึก */}
        <div className="p-5 rounded-3xl bg-slate-900 border-2 border-purple-500/40 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-black">
                4. สรุปยอดการเงิน & เสื้อฝึก
              </span>
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>

            <div className="pt-1">
              <p className="text-xs text-slate-400 font-bold">ยอดเงินรับจริงแล้ว (ผู้สมัคร + Staff)</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ฿{activeStats.collectedFeeTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                จากยอดเต็ม ฿{activeStats.expectedFeeTotal.toLocaleString()} • ค้างรับ{' '}
                <strong className="text-rose-400">฿{activeStats.outstandingFeeTotal.toLocaleString()}</strong>
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Shirt className="w-3.5 h-3.5" /> เสื้อผู้สมัคร/Staff:
                </span>
                <span className="font-mono font-black text-white">{activeStats.totalRegShirts} ตัว</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {STANDARD_SHIRT_SIZES.map((sz) => {
                  const c = activeStats.shirtCounts[sz] || 0;
                  if (c === 0) return null;
                  return (
                    <span
                      key={sz}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-200 font-bold"
                    >
                      {sz}:{c}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300 font-bold">ชำระครบ 100%: {activeStats.fullyPaidCount} คน</span>
            {activeStats.overpaidRefundTotal > 0 && (
              <span className="text-amber-300 font-bold">โอนคืน Staff: ฿{activeStats.overpaidRefundTotal.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================
          SECTION 2: UNIVERSITY-BY-UNIVERSITY COMPLETE LOGISTICS & RSVP MATRIX
          ======================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              <span>ตารางสรุปยอดแยกตามมหาวิทยาลัยครบทุกมิติ (คลิกที่แถวมหาวิทยาลัยเพื่อกรองดูเฉพาะสถาบันนั้น)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดงยอดรวม • ยอดยืนยันมาจริง • ยอดจัดเตรียมอาหาร (ปกติ/พิเศษ) • ยอดจัดห้องพักหอพัก (ชาย/หญิง) • และยอดการเงินของแต่ละสถาบัน
            </p>
          </div>
          {uniFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setUniFilter('all')}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-bold cursor-pointer self-start sm:self-auto"
            >
              แสดงทุกมหาวิทยาลัย ({universityMatrix.length} สถาบัน)
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 text-[11px] font-bold">
                <th className="py-3 px-3">มหาวิทยาลัย / สถาบัน</th>
                <th className="py-3 px-2 text-center bg-slate-900/80">รวมทั้งหมด</th>
                <th className="py-3 px-2 text-center bg-emerald-950/30 text-emerald-300">✅ มาแน่</th>
                <th className="py-3 px-2 text-center bg-amber-950/30 text-amber-300">⏳ รอยืนยัน</th>
                <th className="py-3 px-2 text-center bg-rose-950/30 text-rose-300">❌ ไม่มา</th>
                <th className="py-3 px-2.5 text-center bg-amber-950/20 text-amber-200 border-x border-slate-800">
                  🍱 เตรียมอาหาร (ปกติ / พิเศษ)
                </th>
                <th className="py-3 px-2.5 text-center bg-sky-950/20 text-sky-200 border-r border-slate-800">
                  🏨 พักหอพัก (👨 ชาย / 👩 หญิง)
                </th>
                <th className="py-3 px-2 text-center">ผู้เข้าอบรม / Staff</th>
                <th className="py-3 px-2 text-center text-amber-300">👕 เสื้อ</th>
                <th className="py-3 px-3 text-right text-emerald-300">💰 รับแล้ว / ค้างชำระ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {universityMatrix.map((u) => {
                const s = u.stats;
                const isSelected = uniFilter === u.key;
                const specialMeals = s.expectedMealsTotal - s.expectedMealsNormal;
                return (
                  <tr
                    key={u.key}
                    onClick={() => setUniFilter(isSelected ? 'all' : u.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/50 ring-1 ring-indigo-500/60'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] mr-2 font-black ${
                          u.isMsu
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {u.shortTag}
                      </span>
                      <span className="text-slate-300 text-[11px]">{u.label}</span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-white bg-slate-900/40">
                      {s.total} คน
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-emerald-400 bg-emerald-950/15">
                      {s.confirmed}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-amber-300 bg-amber-950/15">
                      {s.pending}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-rose-400 bg-rose-950/15">
                      {s.declined > 0 ? s.declined : '-'}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono border-x border-slate-800/80 bg-amber-950/10">
                      <span className="font-black text-white">{s.expectedMealsTotal} ที่</span>{' '}
                      <span className="text-[11px] text-slate-400">
                        (ปกติ {s.expectedMealsNormal}
                        {specialMeals > 0 ? ` • พิเศษ/แพ้ ${specialMeals}` : ''})
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono border-r border-slate-800/80 bg-sky-950/10">
                      {s.expectedNeedAccom > 0 ? (
                        <div>
                          <span className="font-black text-sky-300">{s.expectedNeedAccom} คน</span>{' '}
                          <span className="text-[11px] text-slate-300">
                            (ช.{s.expectedNeedAccomMale} / ญ.{s.expectedNeedAccomFemale})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">🏠 ไม่พักหอ ({s.noAccomCount} คน)</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-300">
                      อบรม {s.participants} • Staff {s.staff}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-amber-300">
                      {s.totalRegShirts} ตัว
                    </td>
                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">฿{s.collectedFeeTotal.toLocaleString()}</span>
                      {s.outstandingFeeTotal > 0 && (
                        <span className="text-rose-400 text-[11px] ml-1.5">
                          (ค้าง ฿{s.outstandingFeeTotal.toLocaleString()})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700 font-black text-white text-xs">
                <td className="py-3 px-3 text-amber-300">
                  รวมทั้งสิ้น ({universityMatrix.length} สถาบัน)
                </td>
                <td className="py-3 px-2 text-center font-mono text-white">{globalStats.total} คน</td>
                <td className="py-3 px-2 text-center font-mono text-emerald-400">{globalStats.confirmed}</td>
                <td className="py-3 px-2 text-center font-mono text-amber-300">{globalStats.pending}</td>
                <td className="py-3 px-2 text-center font-mono text-rose-400">{globalStats.declined}</td>
                <td className="py-3 px-2.5 text-center font-mono text-amber-300 border-x border-slate-800">
                  {globalStats.expectedMealsTotal} ที่ (มาแน่ {globalStats.confirmedMealsTotal})
                </td>
                <td className="py-3 px-2.5 text-center font-mono text-sky-300 border-r border-slate-800">
                  พักหอ {globalStats.expectedNeedAccom} คน (ช.{globalStats.expectedNeedAccomMale} / ญ.{globalStats.expectedNeedAccomFemale})
                </td>
                <td className="py-3 px-2 text-center font-mono text-slate-300">
                  อบรม {globalStats.participants} • Staff {globalStats.staff}
                </td>
                <td className="py-3 px-2 text-center font-mono text-amber-300">{globalStats.totalRegShirts} ตัว</td>
                <td className="py-3 px-3 text-right font-mono">
                  <span className="text-emerald-400">฿{globalStats.collectedFeeTotal.toLocaleString()}</span>
                  {globalStats.outstandingFeeTotal > 0 && (
                    <span className="text-rose-400 text-[11px] ml-1.5">
                      (ค้าง ฿{globalStats.outstandingFeeTotal.toLocaleString()})
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================
          SECTION 3: INDIVIDUAL ATTENDANCE CONFIRMATION & LOGISTICS ROSTER
          ======================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>
                รายชื่อสำรวจการเข้าร่วมจริง & จัดเตรียมอาหาร/ห้องพัก ({filteredItems.length} คน)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              แอดมินสามารถกดปุ่ม <strong>&ldquo;✅ มาแน่&rdquo;</strong> / <strong>&ldquo;⏳ รอยืนยัน&rdquo;</strong> / <strong>&ldquo;❌ ไม่มา&rdquo;</strong> และสลับ <strong>&ldquo;🏨 พักหอพัก / 🏠 ไม่พัก&rdquo;</strong> รายบุคคลได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditMode((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 ${
                isEditMode
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isEditMode ? 'คลิกเพื่อล็อคโหมดปลอดภัย' : 'คลิกเพื่อเปิดโหมดแก้ไขข้อมูล'}
            >
              {isEditMode ? <Unlock className="w-4 h-4 text-slate-950" /> : <Lock className="w-4 h-4 text-amber-400" />}
              <span>{isEditMode ? '🔓 โหมดแก้ไข: เปิดอยู่' : '🔒 เปิดโหมดแก้ไข (Edit Mode)'}</span>
            </button>
            <button
              type="button"
              onClick={handleBulkConfirmFiltered}
              disabled={isBulkUpdating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>✅ ยืนยันมาแน่ทั้งกลุ่มที่แสดง ({filteredItems.filter(i => !i.confirmInfo.isConfirmed).length} คน)</span>
            </button>
          </div>
        </div>

        {/* Safety Mode Banner */}
        {isEditMode ? (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>🔓 กำลังอยู่ในโหมดแก้ไขข้อมูล:</strong> คุณสามารถปรับเปลี่ยนสถานะ (มาแน่ / รอ / ไม่มา), เปลี่ยนมหาวิทยาลัย, บันทึกหมายเหตุหน้าที่ หรือลบคนได้ เมื่อเสร็จสิ้นกรุณากดล็อคเพื่อความปลอดภัย
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow"
            >
              🔒 ล็อคโหมดปลอดภัย
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-400 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                🛡️ <strong>โหมดปลอดภัย (Safe Read-Only):</strong> ล็อคการแก้ไขเพื่อป้องกันการกดโดนโดยไม่ตั้งใจ หากต้องการปรับสถานะหรือเปลี่ยนสถาบัน กรุณากดปุ่ม <strong>&ldquo;🔒 เปิดโหมดแก้ไข&rdquo;</strong> ด้านบน
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[1150px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 text-[11px] font-bold">
                <th className="py-3 px-2.5 text-center w-10">#</th>
                <th className="py-3 px-3 min-w-[180px]">ชื่อ-สกุล / นามเรียกขาน</th>
                <th className="py-3 px-2 min-w-[140px] text-indigo-300">🏛️ สถาบัน (ดรอปดาวน์เลือกได้)</th>
                <th className="py-3 px-2 min-w-[125px] text-purple-300">👥 ประเภท / บทบาท</th>
                <th className="py-3 px-2.5 min-w-[170px] text-amber-300">📌 หมายเหตุหน้าที่ (คือใคร ทำอะไร)</th>
                <th className="py-3 px-2 text-center w-14">เพศ</th>
                <th className="py-3 px-3 text-center bg-emerald-950/20 text-emerald-300 min-w-[150px]">
                  สถานะยืนยันมาจริง (คลิกเปลี่ยนได้)
                </th>
                <th className="py-3 px-3 text-center bg-sky-950/20 text-sky-300 min-w-[140px]">
                  หอพัก & เลขห้อง
                </th>
                <th className="py-3 px-3 min-w-[130px]">อาหาร / โรคประจำตัว</th>
                <th className="py-3 px-2 text-center w-24">การเงิน</th>
                <th className="py-3 px-2 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-sm">ไม่พบรายชื่อตามเงื่อนไขตัวกรองที่เลือก</p>
                    <button
                      type="button"
                      onClick={() => {
                        setUniFilter('all');
                        setRoleFilter('all');
                        setGenderFilter('all');
                        setConfirmFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const { reg, fullName, uniInfo, gender, isStaff, confirmInfo, foodInfo, finInfo, hasMedical, dutyNote } = item;
                  const isBusy = updatingId === item.id;
                  const isCommitteeSpec = Boolean(item.committeeSpec);
                  const isDraftModified = dutyNoteDrafts[item.id] !== undefined && dutyNoteDrafts[item.id] !== (dutyNote || '');

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{fullName}</span>
                          {reg.nickname && (
                            <span className="text-amber-300 font-bold">({reg.nickname})</span>
                          )}
                          {isCommitteeSpec && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black">
                              🎖️ กรรมการ
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {reg.callsign && (
                            <span className="text-sky-300 font-mono font-bold">📡 {normalizeCallsignSpacing(reg.callsign)}</span>
                          )}
                          {reg.phone && (
                            <a href={`tel:${reg.phone}`} className="text-emerald-400 font-mono hover:underline">
                              📞 {reg.phone}
                            </a>
                          )}
                        </div>
                        {(confirmInfo.arrivalDate || confirmInfo.note) && (
                          <div className="mt-1 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-[10px] text-indigo-200">
                            📝 {confirmInfo.arrivalDate ? `${confirmInfo.arrivalDate} ` : ''}
                            {confirmInfo.note ? `• ${confirmInfo.note}` : ''}
                          </div>
                        )}
                      </td>

                      {/* University: Dropdown in Edit Mode, Badge in Safe Mode */}
                      <td className="py-3 px-2">
                        {isEditMode ? (
                          <select
                            value={uniInfo.shortTag}
                            disabled={isBusy}
                            onChange={(e) => handleChangePersonUniversity(item, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-indigo-500/40 rounded-lg text-xs text-indigo-200 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
                            title="ดรอปดาวน์เปลี่ยนมหาวิทยาลัยของบุคคลนี้ได้ทันที"
                          >
                            {OFFICIAL_NETWORK_INSTITUTIONS.map((u) => (
                              <option key={u.shortTag} value={u.shortTag}>
                                {u.shortTag} - {u.label.replace(/^[-–\s]+/, '')}
                              </option>
                            ))}
                            {uniInfo.shortTag === 'อื่นๆ' && (
                              <option value="อื่นๆ">อื่นๆ</option>
                            )}
                          </select>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                            🏛️ {uniInfo.shortTag}
                          </span>
                        )}
                      </td>

                      {/* Role: Dropdown in Edit Mode, Badge in Safe Mode */}
                      <td className="py-3 px-2">
                        {isEditMode ? (
                          <select
                            value={item.staffRoleType || (isStaff ? 'staff' : 'participant')}
                            disabled={isBusy}
                            onChange={(e) => handleChangePersonRoleType(item, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-purple-500/40 rounded-lg text-[11px] text-purple-200 font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
                            title="เปลี่ยนบทบาท/ประเภทผู้เข้าร่วม"
                          >
                            <option value="participant">🎓 ผู้เข้าอบรม</option>
                            <option value="committee">🎖️ คณะกรรมการ</option>
                            <option value="mc">🎤 พิธีกร MC</option>
                            <option value="photographer">📷 ช่างภาพ</option>
                            <option value="dev">💻 Developer</option>
                            <option value="staff">🛠️ Staff</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                            item.staffRoleType === 'committee' || isCommitteeSpec
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isStaff
                              ? 'bg-purple-500/20 text-purple-200 border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {item.staffRoleType === 'committee' || isCommitteeSpec
                              ? '🎖️ กรรมการ'
                              : item.staffRoleType === 'mc'
                              ? '🎤 พิธีกร MC'
                              : item.staffRoleType === 'photographer'
                              ? '📷 ช่างภาพ'
                              : item.staffRoleType === 'dev'
                              ? '💻 Dev'
                              : isStaff
                              ? '🛠️ Staff'
                              : '🎓 ผู้เข้าอบรม'}
                          </span>
                        )}
                      </td>

                      {/* Duty / Note: Editable in Edit Mode, Plain view in Safe Mode */}
                      <td className="py-3 px-2.5">
                        {isEditMode ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              disabled={isBusy}
                              value={dutyNoteDrafts[item.id] !== undefined ? dutyNoteDrafts[item.id] : (dutyNote || '')}
                              placeholder="ระบุหน้าที่ (เช่น คณะกรรมการ, MC)"
                              onChange={(e) => setDutyNoteDrafts({ ...dutyNoteDrafts, [item.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveDutyNote(item);
                                }
                              }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                              title="พิมพ์หมายเหตุหน้าที่ แล้วกด Enter หรือคลิกปุ่มบันทึก"
                            />
                            {isDraftModified && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSaveDutyNote(item)}
                                className="p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer transition-colors shrink-0 shadow"
                                title="บันทึกหมายเหตุหน้าที่"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300 font-medium">
                            {dutyNote ? (
                              <span className="bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 inline-block line-clamp-2" title={dutyNote}>
                                📌 {dutyNote}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gender === 'หญิง'
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {gender === 'หญิง' ? '👩 หญิง' : '👨 ชาย'}
                        </span>
                      </td>

                      {/* Attendance Confirmation: Interactive in Edit Mode, Clean Badge in Safe Mode */}
                      <td className="py-3 px-3 text-center bg-emerald-950/10">
                        {isEditMode ? (
                          <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQuickUpdateConfirmation(item, 'confirmed')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                confirmInfo.isConfirmed
                                  ? 'bg-emerald-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-emerald-300'
                              }`}
                              title="ยืนยันเข้าร่วมกิจกรรมแน่นอน"
                            >
                              ✅ มาแน่
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQuickUpdateConfirmation(item, 'pending')}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                confirmInfo.isPending
                                  ? 'bg-amber-500 text-slate-950 shadow font-black'
                                  : 'text-slate-400 hover:text-amber-300'
                              }`}
                              title="อยู่ในสถานะรอยืนยัน"
                            >
                              ⏳ รอ
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQuickUpdateConfirmation(item, 'declined')}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                confirmInfo.isDeclined
                                  ? 'bg-rose-600 text-white shadow font-black'
                                  : 'text-slate-400 hover:text-rose-300'
                              }`}
                              title="ไม่สะดวกเข้าร่วม / สละสิทธิ์"
                            >
                              ❌ ไม่มา
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                              confirmInfo.isConfirmed
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow'
                                : confirmInfo.isPending
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              {confirmInfo.isConfirmed ? '✅ มาแน่ (100%)' : confirmInfo.isPending ? '⏳ รอยืนยัน' : '❌ ไม่มา'}
                            </span>
                          </div>
                        )}
                        {confirmInfo.confirmedAt && (
                          <div className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">
                            {confirmInfo.confirmedBy === 'self' ? 'เจ้าตัวยืนยันเอง' : confirmInfo.confirmedBy === 'qr' ? 'เช็คอิน QR' : 'แอดมินบันทึก'}
                          </div>
                        )}
                      </td>

                      {/* Accommodation: Toggle in Edit Mode, Badge in Safe Mode */}
                      <td className="py-3 px-3 text-center bg-sky-950/10 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {isEditMode ? (
                            <button
                              type="button"
                              disabled={isBusy || confirmInfo.isDeclined}
                              onClick={() => handleQuickToggleAccommodation(item)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                confirmInfo.isDeclined
                                  ? 'bg-slate-900 text-slate-600 border-slate-800'
                                  : confirmInfo.needAccommodation
                                  ? 'bg-sky-500/20 text-sky-200 border-sky-400/50 hover:bg-sky-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              {confirmInfo.isDeclined
                                ? 'สละสิทธิ์'
                                : confirmInfo.needAccommodation
                                ? '🏨 พักหอพักโครงการ'
                                : '🏠 ไม่พักหอพัก'}
                            </button>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                              confirmInfo.isDeclined
                                ? 'bg-slate-900 text-slate-600 border-slate-800'
                                : confirmInfo.needAccommodation
                                ? 'bg-sky-500/20 text-sky-200 border-sky-400/50'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}>
                              {confirmInfo.isDeclined
                                ? 'สละสิทธิ์'
                                : confirmInfo.needAccommodation
                                ? '🏨 พักหอพักโครงการ'
                                : '🏠 ไม่พักหอพัก (มมส)'}
                            </span>
                          )}
                          {reg.room_assigned ? (
                            <span className="text-[10px] font-mono font-bold text-amber-300">
                              🛏️ ห้อง: {reg.room_assigned}
                            </span>
                          ) : confirmInfo.needAccommodation ? (
                            <span className="text-[10px] text-slate-500">ยังไม่ระบุเลขห้อง</span>
                          ) : null}
                        </div>
                      </td>

                      {/* Food & Medical */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              foodInfo.isSpecial
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {foodInfo.label}
                          </span>
                          {foodInfo.detail && (
                            <div className="text-[11px] text-amber-300 font-bold">
                              🍽️ {foodInfo.detail}
                            </div>
                          )}
                          {hasMedical && (
                            <div className="text-[11px] text-rose-300 font-bold">
                              🏥 โรคประจำตัว: {reg.medical_history}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Finance */}
                      <td className="py-3 px-2 text-center font-mono whitespace-nowrap">
                        {finInfo.isFullyPaid ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            ✓ ครบ ฿{finInfo.collected}
                          </span>
                        ) : (
                          <div>
                            <span className="text-amber-300 font-bold text-[11px]">รับ ฿{finInfo.collected}</span>
                            <span className="block text-[10px] text-rose-400">ค้าง ฿{finInfo.outstanding}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions: View Profile & Delete (Delete hidden in Safe Mode) */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {effectiveOpenProfile && (
                            <button
                              type="button"
                              onClick={() => effectiveOpenProfile(reg)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-[11px] font-bold cursor-pointer"
                              title="ดูรายละเอียด / แก้ไขข้อมูลเต็ม"
                            >
                              ดู/แก้
                            </button>
                          )}
                          {isEditMode && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeletePersonFromRoster(item)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                              title="ลบรายชื่อนี้ออกจากตาราง (โหมดแก้ไขเปิดอยู่)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================
          ADD NEW PERSON MODAL (DEV / ADMIN CONTROL)
          ======================================================================== */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border-2 border-indigo-500/50 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    ➕ เพิ่มรายชื่อบุคคลเข้าสู่ตาราง (Dev / Admin Control)
                  </h3>
                  <p className="text-xs text-slate-400">
                    เพิ่มคณะกรรมการ, Staff, พิธีกร, หรือผู้เข้าอบรม พร้อมระบุมหาวิทยาลัย หน้าที่ และสถานะการมาจริง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPersonModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPersonSubmit} className="space-y-4 text-xs">
              {/* Row 1: Title, First Name, Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">คำนำหน้า</label>
                  <select
                    value={newPersonTitle}
                    onChange={(e) => setNewPersonTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-400"
                  >
                    <option value="นาย">นาย</option>
                    <option value="น.ส.">น.ส.</option>
                    <option value="นาง">นาง</option>
                    <option value="น้อง">น้อง</option>
                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ชื่อจริง <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPersonFirstName}
                    onChange={(e) => setNewPersonFirstName(e.target.value)}
                    placeholder="เช่น พีรณัฐ, ฟิล์ม, น้ำหวาน"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-bold"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={newPersonLastName}
                    onChange={(e) => setNewPersonLastName(e.target.value)}
                    placeholder="เช่น พาลึก (ถ้ามี)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Nickname, Gender, Callsign */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    value={newPersonNickname}
                    onChange={(e) => setNewPersonNickname(e.target.value)}
                    placeholder="เช่น ปลื้ม, ฟิล์ม"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">เพศ (สำหรับจัดห้อง)</label>
                  <select
                    value={newPersonGender}
                    onChange={(e) => setNewPersonGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-400"
                  >
                    <option value="ชาย">👨 ชาย</option>
                    <option value="หญิง">👩 หญิง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">นามเรียกขาน (Callsign)</label>
                  <input
                    type="text"
                    value={newPersonCallsign}
                    onChange={(e) => setNewPersonCallsign(e.target.value)}
                    placeholder="เช่น (STAFF), (MC)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sky-300 placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
              </div>

              {/* Row 3: University Dropdown & Role Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    🏛️ มหาวิทยาลัย / สถาบัน
                  </label>
                  <select
                    value={newPersonUniShort}
                    onChange={(e) => setNewPersonUniShort(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/50 rounded-xl text-indigo-100 font-bold focus:outline-none focus:border-indigo-400"
                  >
                    {OFFICIAL_NETWORK_INSTITUTIONS.map((u) => (
                      <option key={u.shortTag} value={u.shortTag}>
                        {u.shortTag} - {u.label}
                      </option>
                    ))}
                    <option value="อื่นๆ">อื่นๆ (ระบุเอง)</option>
                  </select>
                  {newPersonUniShort === 'อื่นๆ' && (
                    <input
                      type="text"
                      value={newPersonCustomUni}
                      onChange={(e) => setNewPersonCustomUni(e.target.value)}
                      placeholder="ระบุชื่อสถาบัน..."
                      className="w-full mt-1.5 px-3 py-1.5 bg-slate-950 border border-indigo-500/40 rounded-xl text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    👥 ประเภท / บทบาทในโครงการ
                  </label>
                  <select
                    value={newPersonRoleType}
                    onChange={(e) => {
                      const r = e.target.value;
                      setNewPersonRoleType(r);
                      if (r === 'committee') {
                        setNewPersonDutyNote('คณะกรรมการดำเนินงาน');
                        setNewPersonCallsign('(STAFF)');
                      } else if (r === 'mc') {
                        setNewPersonDutyNote('พิธีกรดำเนินรายการ (MC)');
                        setNewPersonCallsign('(MC)');
                      } else if (r === 'photographer') {
                        setNewPersonDutyNote('ฝ่ายสื่อและบันทึกภาพ');
                        setNewPersonCallsign('(MEDIA)');
                      } else if (r === 'dev') {
                        setNewPersonDutyNote('ระบบสารสนเทศ & Web Dev');
                        setNewPersonCallsign('(DEV)');
                      } else if (r === 'staff') {
                        setNewPersonDutyNote('Staff คณะทำงาน');
                        setNewPersonCallsign('(STAFF)');
                      } else {
                        setNewPersonDutyNote('');
                        setNewPersonCallsign('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-purple-500/50 rounded-xl text-purple-100 font-bold focus:outline-none focus:border-purple-400"
                  >
                    <option value="committee">🎖️ คณะกรรมการดำเนินงาน (STAFF)</option>
                    <option value="mc">🎤 พิธีกรดำเนินรายการ (MC)</option>
                    <option value="photographer">📷 ฝ่ายภาพและสื่อ (Media)</option>
                    <option value="dev">💻 ผู้พัฒนาระบบ (Dev)</option>
                    <option value="staff">🛠️ Staff คณะทำงานทั่วไป</option>
                    <option value="participant">🎓 ผู้เข้าอบรมปกติ</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Duty Note (คือใคร ทำอะไร) & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">
                    📌 หมายเหตุหน้าที่รับผิดชอบ (คือใคร ทำอะไร)
                  </label>
                  <input
                    type="text"
                    value={newPersonDutyNote}
                    onChange={(e) => setNewPersonDutyNote(e.target.value)}
                    placeholder="เช่น คณะกรรมการดำเนินงาน, พิธีกรหลัก"
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={newPersonPhone}
                    onChange={(e) => setNewPersonPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Attendance RSVP Status & Accommodation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                    ✅ สถานะยืนยันการมาจริง (RSVP)
                  </label>
                  <select
                    value={newPersonConfirmStatus}
                    onChange={(e) => setNewPersonConfirmStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-xl text-emerald-100 font-bold focus:outline-none focus:border-emerald-400"
                  >
                    <option value="confirmed">✅ ยืนยันมาแน่นอน (นับเตรียมอาหารและห้องพัก)</option>
                    <option value="pending">⏳ รอยืนยัน</option>
                    <option value="declined">❌ ไม่สะดวกเข้าร่วม / สละสิทธิ์</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={newPersonNeedAccom}
                      onChange={(e) => setNewPersonNeedAccom(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                    />
                    <span className="font-bold">🏨 ต้องการพักหอพักโครงการ (MSU Dorm)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={newPersonOrderShirt}
                      onChange={(e) => setNewPersonOrderShirt(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                    />
                    <span className="font-bold">👕 สั่งซื้อเสื้อโครงการ (300 บาท)</span>
                  </label>
                </div>
              </div>

              {newPersonOrderShirt && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                  <span className="text-amber-200 font-bold">เลือกไซส์เสื้อ:</span>
                  <select
                    value={newPersonShirtSize}
                    onChange={(e) => setNewPersonShirtSize(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg text-amber-100 font-mono font-bold"
                  >
                    {STANDARD_SHIRT_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewPerson}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSavingNewPerson ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSavingNewPerson ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกข้อมูลเข้าตารางทันที'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
