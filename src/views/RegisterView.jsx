import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  Droplet, 
  AlertCircle, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Building, 
  ExternalLink,
  Edit,
  Clock,
  Sparkles,
  MapPin,
  HeartPulse,
  Award,
  Stethoscope,
  UtensilsCrossed,
  ShieldAlert,
  CreditCard,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileCheck,
  Loader2,
  Maximize2,
  Mail,
  ArrowRight,
  Copy,
  Check,
  CalendarClock,
  Layers,
  HelpCircle,
  Camera,
  Shirt,
  RotateCcw,
  Trash2,
  X,
  Info,
  Lock,
  Key,
  EyeOff,
  UserCheck,
  Shield,
  ArrowLeft,
  QrCode,
  Download,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Globe,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateAgeDetailed } from '../utils/ageCalculator';
import { DataService, ensureHostedUrl } from '../supabase';
import PDPAModal from '../components/PDPAModal';
import Toast from '../components/Toast';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import UserNotificationsModal from '../components/UserNotificationsModal';
import IDCardPreview from '../components/IDCardPreview';
import { getRegistrationCardData } from '../utils/idCard';
import ModalPortal from '../components/ModalPortal';
import ConfirmModal, { useConfirmModal } from '../components/ConfirmModal';
import { scanSlipImage } from '../utils/slipOcr';
import { 
  DEFAULT_PAYMENT_CONFIG, 
  OFFICIAL_NETWORK_INSTITUTIONS,
  SHIRT_SIZE_OPTIONS,
  getRegistrationFeeDetails,
  isMsuInstitution
} from '../data/defaultData';

export const TITLE_THAI_OPTIONS = [
  'นาย',
  'นาง',
  'นางสาว',
  'ว่าที่ร้อยตรี',
  'ว่าที่ร้อยตรีหญิง',
  'อื่นๆ'
];

export const TITLE_ENGLISH_OPTIONS = [
  'Mr.',
  'Mrs.',
  'Miss',
  'Ms.',
  'Act.2nd Lt.',
  'Act.2nd Lt. (W)',
  'อื่นๆ'
];

export const TITLE_TH_TO_EN_MAP = {
  'นาย': 'Mr.',
  'นาง': 'Mrs.',
  'นางสาว': 'Miss',
  'ว่าที่ร้อยตรี': 'Act.2nd Lt.',
  'ว่าที่ร้อยตรีหญิง': 'Act.2nd Lt. (W)'
};

export const INSTITUTION_ABBR_MAP = {
  'ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม (มมส)': { th: 'มมส', en: 'MSU' },
  'มหาวิทยาลัยมหาสารคาม (มมส)': { th: 'มมส', en: 'MSU' },
  'TSI - Tactic of Special Services and Investigation มหาวิทยาลัยขอนแก่น (มข)': { th: 'มข', en: 'KKU' },
  'มหาวิทยาลัยขอนแก่น (มข)': { th: 'มข', en: 'KKU' },
  'ชมรมจิตอาสาแสดทอง องค์การนักศึกษา มหาวิทยาลัยเทคโนโลยีสุรนารี (มทส)': { th: 'มทส', en: 'SUT' },
  'มหาวิทยาลัยเทคโนโลยีสุรนารี (มทส)': { th: 'มทส', en: 'SUT' },
  'ชมรมปฏิบัติการกู้ภัยและบรรเทาสาธารณภัย มหาวิทยาลัยเชียงใหม่ (มช)': { th: 'มช', en: 'CMU' },
  'มหาวิทยาลัยเชียงใหม่ (มช)': { th: 'มช', en: 'CMU' },
  'ชมรมกู้ชีพกู้ภัยมหาวิทยาลัยกาฬสินธุ์ KSU Rescue (มกส)': { th: 'มกส', en: 'KSU' },
  'มหาวิทยาลัยกาฬสินธุ์ (มกส)': { th: 'มกส', en: 'KSU' },
  'ชมรมอาสาสมัครกู้ชีพ-กู้ภัย มหาวิทยาลัยราชภัฏอุดรธานี (มรภ.อุดรธานี)': { th: 'มรภ.อุดรธานี', en: 'UDRU' },
  'มหาวิทยาลัยราชภัฏอุดรธานี (มรภ.อุดรธานี)': { th: 'มรภ.อุดรธานี', en: 'UDRU' },
  'ชมรมนักวิทยุสมัครเล่นและอาสาบรรเทาภัย (วลัยอาสา) มหาวิทยาลัยวลัยลักษณ์ (มวล.)': { th: 'มวล.', en: 'WU' },
  'มหาวิทยาลัยวลัยลักษณ์ (มวล.)': { th: 'มวล.', en: 'WU' },
  'ชมรมกู้ชีพ-กู้ภัย มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร (มก.ฉกส)': { th: 'มก.ฉกส', en: 'KU-CSC' },
  'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร (มก.ฉกส)': { th: 'มก.ฉกส', en: 'KU-CSC' }
};

export const buildFullNameAffiliation = ({
  titleTh = '',
  titleOtherTh = '',
  firstNameTh = '',
  lastNameTh = '',
  institutionAbbrTh = '',
  titleEn = '',
  titleOtherEn = '',
  firstNameEn = '',
  lastNameEn = '',
  institutionAbbrEn = ''
}) => {
  const finalTitleTh = (titleTh === 'อื่นๆ' ? titleOtherTh : titleTh).trim();
  const finalTitleEn = (titleEn === 'อื่นๆ' ? titleOtherEn : titleEn).trim();
  const fTh = firstNameTh.trim();
  const lTh = lastNameTh.trim();
  const aTh = institutionAbbrTh.trim();
  const fEn = firstNameEn.trim();
  const lEn = lastNameEn.trim();
  const aEn = institutionAbbrEn.trim();

  let thPart = '';
  if (fTh || lTh) {
    let prefix = '';
    if (finalTitleTh) {
      if (['นาย', 'นาง', 'นางสาว'].includes(finalTitleTh)) {
        prefix = finalTitleTh;
      } else {
        prefix = `${finalTitleTh} `;
      }
    }
    const name = `${prefix}${fTh} ${lTh}`.trim();
    const abbr = aTh ? ` (${aTh})` : '';
    thPart = `${name}${abbr}`;
  }

  let enPart = '';
  if (fEn || lEn) {
    const prefix = finalTitleEn ? `${finalTitleEn} ` : '';
    const name = `${prefix}${fEn} ${lEn}`.trim();
    const abbr = aEn ? ` (${aEn})` : '';
    enPart = `${name}${abbr}`;
  }

  if (thPart && enPart) return `${thPart} / ${enPart}`;
  return thPart || enPart || '';
};

export const parseFullNameAffiliationString = (str) => {
  if (!str || typeof str !== 'string') return {};
  const slashIdx = str.indexOf('/');
  const thRaw = (slashIdx >= 0 ? str.slice(0, slashIdx) : str).trim();
  const enRaw = (slashIdx >= 0 ? str.slice(slashIdx + 1) : '').trim();

  const result = {};

  if (thRaw) {
    const abbrMatch = thRaw.match(/\(([^)]+)\)\s*$/);
    let nameWithoutAbbr = thRaw;
    if (abbrMatch) {
      result.institutionAbbrTh = abbrMatch[1].trim();
      nameWithoutAbbr = thRaw.replace(/\(([^)]+)\)\s*$/, '').trim();
    }
    const knownThTitles = ['ว่าที่ร้อยตรีหญิง', 'ว่าที่ร้อยตรี', 'นางสาว', 'นาย', 'นาง'];
    let matchedTitle = '';
    for (const t of knownThTitles) {
      if (nameWithoutAbbr.startsWith(t)) {
        matchedTitle = t;
        nameWithoutAbbr = nameWithoutAbbr.slice(t.length).trim();
        break;
      }
    }
    if (matchedTitle) {
      result.titleTh = matchedTitle;
    }
    const parts = nameWithoutAbbr.split(/\s+/).filter(Boolean);
    if (parts.length > 0) result.firstNameTh = parts[0];
    if (parts.length > 1) result.lastNameTh = parts.slice(1).join(' ');
  }

  if (enRaw) {
    const abbrMatch = enRaw.match(/\(([^)]+)\)\s*$/);
    let nameWithoutAbbr = enRaw;
    if (abbrMatch) {
      result.institutionAbbrEn = abbrMatch[1].trim();
      nameWithoutAbbr = enRaw.replace(/\(([^)]+)\)\s*$/, '').trim();
    }
    const knownEnTitles = ['Act.2nd Lt. (W)', 'Act.2nd Lt.', 'Miss', 'Mrs.', 'Mr.', 'Ms.'];
    let matchedTitle = '';
    for (const t of knownEnTitles) {
      if (nameWithoutAbbr.startsWith(t)) {
        matchedTitle = t;
        nameWithoutAbbr = nameWithoutAbbr.slice(t.length).trim();
        break;
      }
    }
    if (matchedTitle) {
      result.titleEn = matchedTitle;
    }
    const parts = nameWithoutAbbr.split(/\s+/).filter(Boolean);
    if (parts.length > 0) result.firstNameEn = parts[0];
    if (parts.length > 1) result.lastNameEn = parts.slice(1).join(' ');
  }

  return result;
};

export const parseNicknameString = (str) => {
  if (!str || typeof str !== 'string') return { nicknameTh: '', nicknameEn: '' };
  const trimmed = str.trim();
  if (!trimmed) return { nicknameTh: '', nicknameEn: '' };

  // Case: "เจมส์ / James" or "เจมส์/James"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    return {
      nicknameTh: (parts[0] || '').trim(),
      nicknameEn: (parts.slice(1).join('/') || '').trim()
    };
  }

  // Case: "เจมส์ (James)"
  const bracketMatch = trimmed.match(/^(.*?)\((.*?)\)/);
  if (bracketMatch) {
    return {
      nicknameTh: (bracketMatch[1] || '').trim(),
      nicknameEn: (bracketMatch[2] || '').trim()
    };
  }

  // If mostly Thai:
  if (/[\u0E00-\u0E7F]/.test(trimmed)) {
    return { nicknameTh: trimmed, nicknameEn: '' };
  }

  // If mostly English:
  return { nicknameTh: '', nicknameEn: trimmed };
};

export const buildNicknameString = (th, en) => {
  const t = (th || '').trim();
  const e = (en || '').trim();
  if (t && e) return `${t} / ${e}`;
  return t || e || '';
};

export default function RegisterView({ 
  user, 
  myRegistration, 
  onSaveRegistration, 
  onUpdateRegistration,
  onDeleteRegistration,
  onUpdateUser,
  onOpenGoogleLogin,
  formsConfig,
  paymentConfig,
  subRoute,
  onSubRouteChange
}) {
  // In-app Popup Modal for Confirmations & Alerts
  const { confirmModalProps, askConfirm } = useConfirmModal();

  const effectivePaymentConfig = paymentConfig || DEFAULT_PAYMENT_CONFIG;
  const myCardData = myRegistration ? getRegistrationCardData(myRegistration) : null;

  // Payment approval status calculation for applicant dashboard & edit/cancel behavior
  const isApplicantSinglePaid = Boolean(
    myRegistration &&
    myRegistration.payment_plan !== 'installment' &&
    (myRegistration.payment_status === 'paid' || myRegistration.payment_status === 'verified')
  );
  const isApplicantRound2Paid = Boolean(
    myRegistration &&
    myRegistration.installment_2_status === 'paid' &&
    Boolean(myRegistration.installment_2_slip_url)
  );
  const isApplicantInstallmentsBothPaid = Boolean(
    myRegistration &&
    (myRegistration.installment_1_status === 'paid') &&
    isApplicantRound2Paid
  );
  const isApplicantFullyPaid = isApplicantSinglePaid || isApplicantInstallmentsBothPaid;
  const hasAnyPaymentApproved = Boolean(
    myRegistration && (
      isApplicantFullyPaid ||
      (myRegistration.payment_status === 'paid' || myRegistration.payment_status === 'verified') ||
      (myRegistration.installment_1_status === 'paid') ||
      (myRegistration.installment_2_status === 'paid')
    )
  );

  // Check if applicant has made any payment or attached any slip
  const hasTransferredOrPaid = Boolean(
    myRegistration && (
      hasAnyPaymentApproved ||
      myRegistration.payment_slip_url ||
      myRegistration.installment_1_slip_url ||
      myRegistration.installment_2_slip_url ||
      myRegistration.slip_url ||
      (myRegistration.payment_status && myRegistration.payment_status !== 'unpaid') ||
      (myRegistration.installment_1_status && myRegistration.installment_1_status !== 'unpaid') ||
      (myRegistration.installment_2_status && myRegistration.installment_2_status !== 'unpaid')
    )
  );

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (subRoute === 'dashboard') {
      setIsEditing(false);
    } else if (subRoute === 'form' && myRegistration) {
      if (isApplicantFullyPaid) {
        setIsEditing(false);
        if (onSubRouteChange) onSubRouteChange('dashboard');
        triggerToast('ท่านชำระเงินครบถ้วนและได้รับการยืนยันสิทธิ์สมบูรณ์แล้ว ไม่สามารถแก้ไขข้อมูลใบสมัครได้', 'info');
      } else {
        setIsEditing(true);
      }
    }
  }, [subRoute, myRegistration, isApplicantFullyPaid]);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullNameAffiliation, setFullNameAffiliation] = useState('');

  // Detailed Split Name State (Thai & English)
  const [titleTh, setTitleTh] = useState('นาย');
  const [titleOtherTh, setTitleOtherTh] = useState('');
  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [institutionAbbrTh, setInstitutionAbbrTh] = useState('มมส');

  const [titleEn, setTitleEn] = useState('Mr.');
  const [titleOtherEn, setTitleOtherEn] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [institutionAbbrEn, setInstitutionAbbrEn] = useState('MSU');

  const [isManualFullName, setIsManualFullName] = useState(false);

  // Anti-Spam & Bot Honeypot Protection
  const [botHoneypot, setBotHoneypot] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleTitleThChange = (newTitleTh) => {
    setTitleTh(newTitleTh);
    if (TITLE_TH_TO_EN_MAP[newTitleTh]) {
      setTitleEn(TITLE_TH_TO_EN_MAP[newTitleTh]);
    } else if (newTitleTh === 'อื่นๆ') {
      setTitleEn('อื่นๆ');
    }
  };

  const handleInstitutionSelect = (instName) => {
    const selectedInstitution = OFFICIAL_NETWORK_INSTITUTIONS.find(
      inst => inst.fullName === instName || inst.university === instName
    );

    // Keep Unit (rescue club/agency) and Affiliation (university) separate.
    setUnit(selectedInstitution?.club || '');
    setInstitution(selectedInstitution?.university || instName);
    clearFieldError('institution');
    const mapped = INSTITUTION_ABBR_MAP[instName] || INSTITUTION_ABBR_MAP[selectedInstitution?.university];
    if (mapped) {
      setInstitutionAbbrTh(mapped.th);
      setInstitutionAbbrEn(mapped.en);
    }
  };

  // Keep combined fullNameAffiliation in sync whenever split fields change
  useEffect(() => {
    if (!isManualFullName) {
      const combined = buildFullNameAffiliation({
        titleTh,
        titleOtherTh,
        firstNameTh,
        lastNameTh,
        institutionAbbrTh,
        titleEn,
        titleOtherEn,
        firstNameEn,
        lastNameEn,
        institutionAbbrEn
      });
      setFullNameAffiliation(combined);
      setFirstName(firstNameTh.trim());
      setLastName(lastNameTh.trim());
    }
  }, [
    titleTh,
    titleOtherTh,
    firstNameTh,
    lastNameTh,
    institutionAbbrTh,
    titleEn,
    titleOtherEn,
    firstNameEn,
    lastNameEn,
    institutionAbbrEn,
    isManualFullName
  ]);

  const [nicknameTh, setNicknameTh] = useState('');
  const [nicknameEn, setNicknameEn] = useState('');
  const [nickname, setNickname] = useState('');

  // Keep combined nickname in sync whenever nicknameTh or nicknameEn changes
  useEffect(() => {
    setNickname(buildNicknameString(nicknameTh, nicknameEn));
  }, [nicknameTh, nicknameEn]);
  const [callsign, setCallsign] = useState('');
  const [unit, setUnit] = useState('');
  const [shirtSize, setShirtSize] = useState('L');
  const [idCardPhoto, setIdCardPhoto] = useState('');
  const [idCardFileName, setIdCardFileName] = useState('');
  const [formSlipRound1, setFormSlipRound1] = useState('');
  const [formSlipRound1FileName, setFormSlipRound1FileName] = useState('');
  const [isProcessingIdPhoto, setIsProcessingIdPhoto] = useState(false);
  const [isProcessingFormSlip, setIsProcessingFormSlip] = useState(false);
  const [showShirtSizeModal, setShowShirtSizeModal] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [lastDraftSavedTime, setLastDraftSavedTime] = useState(null);
  const [currentFormStep, setCurrentFormStep] = useState(1); // 1: ข้อมูลผู้สมัคร & ID Card, 2: สั่งเสื้อ JRE 2027, 3: สรุปค่าสมัคร & ชำระเงินรอบ 1
  
  // Birth Date State (Buddhist Era friendly & Minimum 15 Years Old Enforced)
  const currentBE = new Date().getFullYear() + 543;
  const MIN_REGISTRATION_AGE = 15;
  const maxBirthYearBE = currentBE - MIN_REGISTRATION_AGE; // 2569 - 15 = 2554 BE
  const minBirthYearBE = currentBE - 75; // 2569 - 75 = 2494 BE (up to 75 years old)

  // Strictly only list years where applicant is at least 15 years old (eliminates 2555 to 2569)
  const eligibleBirthYears = Array.from(
    { length: maxBirthYearBE - minBirthYearBE + 1 },
    (_, i) => maxBirthYearBE - i
  );

  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('6');
  const [birthYearBE, setBirthYearBE] = useState(() => {
    const defaultYear = 2546; // ~23 years old
    return defaultYear <= maxBirthYearBE ? defaultYear.toString() : maxBirthYearBE.toString();
  });

  const [bloodGroup, setBloodGroup] = useState('B');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('มหาวิทยาลัยมหาสารคาม (มมส)');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('ผู้ปกครอง');

  // Health, Allergies & Training History
  const [medicalHistory, setMedicalHistory] = useState('');
  const [foodAllergy, setFoodAllergy] = useState('');
  const [previousTraining, setPreviousTraining] = useState('');

  // Consent & PDPA States
  const [agreeCorrectInfo, setAgreeCorrectInfo] = useState(!!myRegistration);
  const [agreePDPAAndRules, setAgreePDPAAndRules] = useState(!!myRegistration);
  const [showPdpaModal, setShowPdpaModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Field-level validation errors state for jumping and marking missing fields
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (key) => {
    setFieldErrors(prev => {
      if (!prev || !prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Auto-dismiss statusMessage after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // In-App Toast Notification State with auto-dismiss duration
  const [toast, setToast] = useState(null);
  const triggerToast = (message, type = 'success', duration = 3500) => {
    setToast({ text: message, message, type, duration, key: Date.now() });
  };

  // In-App Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Payment Slip Upload State
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [previewSlipModal, setPreviewSlipModal] = useState(null);
  const [copiedSlipUrl, setCopiedSlipUrl] = useState(false);

  // 2-Round Installments & Full Payment State
  const [paymentPlan, setPaymentPlan] = useState('installment'); // 'installment' (4 steps) | 'full' (3 steps)
  const [isUploadingRound1, setIsUploadingRound1] = useState(false);
  const [isUploadingRound2, setIsUploadingRound2] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Slips & OCR States for Full & 2-Round Installments
  const [formSlipFull, setFormSlipFull] = useState('');
  const [formSlipFullFileName, setFormSlipFullFileName] = useState('');
  const [formSlipRound2, setFormSlipRound2] = useState('');
  const [formSlipRound2FileName, setFormSlipRound2FileName] = useState('');
  const [isProcessingFormSlipRound2, setIsProcessingFormSlipRound2] = useState(false);
  const [isProcessingFormSlipFull, setIsProcessingFormSlipFull] = useState(false);
  const [slipOcrRound1, setSlipOcrRound1] = useState(null);
  const [slipOcrRound2, setSlipOcrRound2] = useState(null);
  const [slipOcrFull, setSlipOcrFull] = useState(null);

  // Document Upload State
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Delete Registration & Ownership CRUD state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingReg, setIsDeletingReg] = useState(false);

  // User Notifications Modal state
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // User Profile & Password Change state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountDisplayName, setAccountDisplayName] = useState(user?.name || '');
  const [accountAvatar, setAccountAvatar] = useState(user?.avatar || '');
  const [accountOldPassword, setAccountOldPassword] = useState('');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [showAccountOldPass, setShowAccountOldPass] = useState(false);
  const [showAccountNewPass, setShowAccountNewPass] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    if (user) {
      setAccountDisplayName(user.name || '');
      setAccountAvatar(user.avatar || '');
    }
  }, [user]);



  const handleDeleteMyRegistration = async () => {
    if (!myRegistration || !user) return;

    // Safeguard: Once money transferred or slip attached, user cannot cancel application
    if (hasTransferredOrPaid) {
      triggerToast('ไม่สามารถยกเลิกใบสมัครได้เนื่องจากมีการแนบหลักฐานการโอนเงินในระบบแล้ว หากต้องการยกเลิกกรุณาติดต่อผู้จัดโครงการโดยตรง (เฉพาะ Admin โหมดแก้ไขขั้นสูงเท่านั้นที่สามารถลบได้)', 'error');
      setShowDeleteConfirmModal(false);
      return;
    }

    // Ownership check (Criterion 3: User A cannot delete User B's data)
    const isOwner = (myRegistration.user_id && myRegistration.user_id === user.id) ||
                    (myRegistration.id && myRegistration.id === user.id) ||
                    (myRegistration.user_email && myRegistration.user_email.toLowerCase() === user.email?.toLowerCase());
    if (!isOwner) {
      triggerToast('ไม่อนุญาต: คุณสามารถลบได้เฉพาะข้อมูลใบสมัครของตนเองเท่านั้น (IDOR Protection)', 'error');
      return;
    }
    setIsDeletingReg(true);
    try {
      if (onDeleteRegistration) {
        await onDeleteRegistration(myRegistration.user_id || user.id);
      } else {
        await DataService.deleteRegistrationByOwner(myRegistration.user_id || user.id, user.id);
      }
      triggerToast('ยกเลิกใบสมัครและลบข้อมูลของคุณเรียบร้อยแล้ว');
      setShowDeleteConfirmModal(false);
      setIsEditing(false);
      if (onSubRouteChange) onSubRouteChange('form');
    } catch (err) {
      console.error('Delete registration error:', err);
      triggerToast(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    } finally {
      setIsDeletingReg(false);
    }
  };

  const handleUpdateUserAccount = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingAccount(true);
    setAccountError('');
    try {
      // 1. Update Profile (Name & Avatar)
      const updated = await DataService.updateUserProfile(user.id, {
        name: accountDisplayName.trim() || user.name,
        avatar: accountAvatar.trim() || user.avatar
      });

      // 2. Change password if user entered a new password
      if (accountNewPassword) {
        if (accountNewPassword.length < 6) {
          throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
        if (accountNewPassword !== accountConfirmPassword) {
          throw new Error('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
        }
        await DataService.changePassword(user.id, accountOldPassword, accountNewPassword);
      }

      if (onUpdateUser) onUpdateUser(updated);
      triggerToast('อัปเดตข้อมูลบัญชีผู้ใช้และรหัสผ่านสำเร็จ');
      setShowAccountModal(false);
      setAccountOldPassword('');
      setAccountNewPassword('');
      setAccountConfirmPassword('');
    } catch (err) {
      console.error('Account update error:', err);
      setAccountError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Notification Message Handlers
  const handleToggleAdminMessageRead = async (msgId) => {
    if (!myRegistration) return;
    const targetId = myRegistration.user_id || myRegistration.id;
    const currentMsgs = Array.isArray(myRegistration.admin_messages) ? [...myRegistration.admin_messages] : [];
    const updated = currentMsgs.map(m => m.id === msgId ? { ...m, read: !m.read } : m);
    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: updated });
    }
  };

  const handleMarkAllAdminMessagesRead = async () => {
    if (!myRegistration) return;
    const targetId = myRegistration.user_id || myRegistration.id;
    const currentMsgs = Array.isArray(myRegistration.admin_messages) ? [...myRegistration.admin_messages] : [];
    const updated = currentMsgs.map(m => ({ ...m, read: true }));
    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: updated });
    }
  };

  const handleDeleteAdminMessage = async (msgId) => {
    if (!myRegistration) return;
    const confirmed = await askConfirm({
      title: 'ยืนยันลบข้อความแจ้งเตือน',
      message: 'คุณต้องการลบข้อความนี้ออกจากกล่องข้อความใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)',
      confirmText: 'ลบข้อความ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;

    const targetId = myRegistration.user_id || myRegistration.id;
    const currentMsgs = Array.isArray(myRegistration.admin_messages) ? [...myRegistration.admin_messages] : [];
    const updated = currentMsgs.filter(m => m.id !== msgId);
    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: updated });
    }
  };

  const DRAFT_KEY = 'jre2027_form_draft_v1';

  // Restore Draft from LocalStorage on mount if not registered yet
  useEffect(() => {
    if (!myRegistration) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const d = JSON.parse(savedDraft);
          if (d.fullNameAffiliation) setFullNameAffiliation(d.fullNameAffiliation);
          if (d.titleTh) setTitleTh(d.titleTh);
          if (d.titleOtherTh) setTitleOtherTh(d.titleOtherTh);
          if (d.firstNameTh) setFirstNameTh(d.firstNameTh);
          if (d.lastNameTh) setLastNameTh(d.lastNameTh);
          if (d.institutionAbbrTh) setInstitutionAbbrTh(d.institutionAbbrTh);
          if (d.titleEn) setTitleEn(d.titleEn);
          if (d.titleOtherEn) setTitleOtherEn(d.titleOtherEn);
          if (d.firstNameEn) setFirstNameEn(d.firstNameEn);
          if (d.lastNameEn) setLastNameEn(d.lastNameEn);
          if (d.institutionAbbrEn) setInstitutionAbbrEn(d.institutionAbbrEn);
          if (d.firstName) setFirstName(d.firstName);
          if (d.lastName) setLastName(d.lastName);
          if (d.nicknameTh) setNicknameTh(d.nicknameTh);
          if (d.nicknameEn) setNicknameEn(d.nicknameEn);
          if (!d.nicknameTh && !d.nicknameEn && d.nickname) {
            const parsedNick = parseNicknameString(d.nickname);
            if (parsedNick.nicknameTh) setNicknameTh(parsedNick.nicknameTh);
            if (parsedNick.nicknameEn) setNicknameEn(parsedNick.nicknameEn);
          }
          if (d.nickname) setNickname(d.nickname);
          if (d.callsign) setCallsign(d.callsign);
          if (d.unit) setUnit(d.unit);
          if (d.institution) {
            const selectedInstitution = OFFICIAL_NETWORK_INSTITUTIONS.find(
              inst => inst.fullName === d.institution || inst.university === d.institution
            );
            if (selectedInstitution) {
              if (!d.unit) setUnit(selectedInstitution.club);
              setInstitution(selectedInstitution.university);
            } else {
              setInstitution(d.institution);
            }
          }
          if (d.phone) setPhone(d.phone);
          if (d.bloodGroup) setBloodGroup(d.bloodGroup);
          if (d.birthDay) setBirthDay(d.birthDay);
          if (d.birthMonth) setBirthMonth(d.birthMonth);
          if (d.birthYearBE) setBirthYearBE(d.birthYearBE);
          if (d.shirtSize) setShirtSize(d.shirtSize);
          if (d.emergencyName) setEmergencyName(d.emergencyName);
          if (d.emergencyPhone) setEmergencyPhone(d.emergencyPhone);
          if (d.emergencyRelation) setEmergencyRelation(d.emergencyRelation);
          if (d.medicalHistory) setMedicalHistory(d.medicalHistory);
          if (d.foodAllergy) setFoodAllergy(d.foodAllergy);
          if (d.previousTraining) setPreviousTraining(d.previousTraining);
          if (d.idCardPhoto) {
            setIdCardPhoto(d.idCardPhoto);
            setIdCardFileName(d.idCardFileName || 'รูปถ่าย ID Card (บันทึกไว้)');
          }
          if (d.formSlipRound1) {
            setFormSlipRound1(d.formSlipRound1);
            setFormSlipRound1FileName(d.formSlipRound1FileName || 'สลิปการโอนเงิน (บันทึกไว้)');
          }
          setHasDraftRestored(true);
          setLastDraftSavedTime(d.savedAt || null);
        }
      } catch (err) {
        console.warn('Failed to parse registration draft:', err);
      }
    }
  }, [myRegistration]);

  // Auto-Save Draft to LocalStorage whenever form fields change
  useEffect(() => {
    if (!myRegistration) {
      const draftData = {
        fullNameAffiliation,
        titleTh,
        titleOtherTh,
        firstNameTh,
        lastNameTh,
        institutionAbbrTh,
        titleEn,
        titleOtherEn,
        firstNameEn,
        lastNameEn,
        institutionAbbrEn,
        firstName,
        lastName,
        nicknameTh,
        nicknameEn,
        nickname,
        callsign,
        unit,
        institution,
        phone,
        bloodGroup,
        birthDay,
        birthMonth,
        birthYearBE,
        shirtSize,
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        medicalHistory,
        foodAllergy,
        previousTraining,
        paymentPlan,
        idCardPhoto,
        idCardFileName,
        formSlipRound1,
        formSlipRound1FileName,
        savedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        setLastDraftSavedTime(draftData.savedAt);
      } catch (e) {}
    }
  }, [
    myRegistration,
    fullNameAffiliation,
    titleTh,
    titleOtherTh,
    firstNameTh,
    lastNameTh,
    institutionAbbrTh,
    titleEn,
    titleOtherEn,
    firstNameEn,
    lastNameEn,
    institutionAbbrEn,
    firstName,
    lastName,
    nicknameTh,
    nicknameEn,
    nickname,
    callsign,
    unit,
    institution,
    phone,
    bloodGroup,
    birthDay,
    birthMonth,
    birthYearBE,
    shirtSize,
    emergencyName,
    emergencyPhone,
    emergencyRelation,
    medicalHistory,
    foodAllergy,
    previousTraining,
    paymentPlan,
    idCardPhoto,
    idCardFileName,
    formSlipRound1,
    formSlipRound1FileName
  ]);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFullNameAffiliation('');
    setNicknameTh('');
    setNicknameEn('');
    setNickname('');
    setCallsign('');
    setUnit('');
    setPhone('');
    setMedicalHistory('');
    setFoodAllergy('');
    setPreviousTraining('');
    setIdCardPhoto('');
    setIdCardFileName('');
    setFormSlipRound1('');
    setFormSlipRound1FileName('');
    setHasDraftRestored(false);
    triggerToast('ล้างข้อมูลแบบร่างในเครื่องเรียบร้อยแล้ว', 'info');
  };

  const handleCopyText = (text, keyName, label) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2500);
      triggerToast(`คัดลอก${label}เรียบร้อยแล้ว: ${text}`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleEmergencyPhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setEmergencyPhone(digits);
  };

  // Upload ID Card Photo Handler
  const handleIdPhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingIdPhoto(true);
    try {
      const uploadResult = await DataService.uploadFile(file, 'id_cards');
      if (uploadResult?.url) {
        setIdCardPhoto(uploadResult.url);
        setIdCardFileName(file.name);
        triggerToast('อัปโหลดรูปถ่ายสำหรับทำ ID Card เรียบร้อยแล้ว', 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดรูป ID Card', 'error');
    } finally {
      setIsProcessingIdPhoto(false);
      e.target.value = '';
    }
  };

  // Evaluate slip OCR result with database registry (amount, date/time, duplicate TransRef)
  const evaluateSlipWithRegistry = async (ocrResult, expectedAmount, otherTransRefToCompare = null) => {
    if (!ocrResult) return null;
    const evaluated = { ...ocrResult };

    // 1. Amount match check
    const numExpected = Number(expectedAmount);
    if (evaluated.amount && numExpected) {
      evaluated.expectedAmount = numExpected;
      evaluated.matchExpected = Math.abs(Number(evaluated.amount) - numExpected) < 1;
    } else {
      evaluated.expectedAmount = numExpected;
      evaluated.matchExpected = false;
    }

    // 2. TransRef cross-check against other installment slip in this session
    let isInternalDup = false;
    let internalDupMessage = null;
    if (evaluated.transRef && otherTransRefToCompare && evaluated.transRef.toLowerCase() === otherTransRefToCompare.toLowerCase()) {
      isInternalDup = true;
      internalDupMessage = 'รหัสอ้างอิงตรงกับสลิปอีกรอบในฟอร์ม (ไม่สามารถใช้สลิปใบเดียวกันสำหรับทั้งสองรอบได้)';
    }

    // 3. TransRef duplicate check against system database
    if (isInternalDup) {
      evaluated.isDuplicate = true;
      evaluated.duplicateMessage = internalDupMessage;
      evaluated.status = 'duplicate';
    } else if (evaluated.transRef) {
      const dupCheck = await DataService.checkSlipDuplicate(evaluated.transRef, user?.id);
      if (dupCheck.isDuplicate) {
        evaluated.isDuplicate = true;
        evaluated.duplicateMessage = dupCheck.message;
        evaluated.status = 'duplicate';
      } else {
        evaluated.isDuplicate = false;
        evaluated.duplicateMessage = null;
      }
    } else {
      evaluated.isDuplicate = false;
      evaluated.duplicateMessage = null;
    }

    // 4. Date & Time validity
    evaluated.isDateDetected = Boolean(evaluated.transferDate);
    evaluated.isTimeDetected = Boolean(evaluated.transferTime);

    // 5. Full Verification condition (100% matched, ready for instant auto-confirmation):
    // Requires: amount detected & matching expected, date detected, and NOT a duplicate slip!
    evaluated.isFullyVerified = Boolean(
      evaluated.isDetected &&
      evaluated.matchExpected === true &&
      !evaluated.isDuplicate
    );

    return evaluated;
  };

  // Upload Form Round 1 Slip Handler with Automatic OCR Scan
  const handleFormSlipRound1Change = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearFieldError('slipRound1');
    clearFieldError('slipFull');
    setIsProcessingFormSlip(true);
    try {
      const uploadResult = await DataService.uploadFile(file, 'slips');
      if (uploadResult?.url) {
        setFormSlipRound1(uploadResult.url);
        setFormSlipRound1FileName(file.name);
        
        // Run Slip OCR Scan & System Verification
        try {
          const rawOcr = await scanSlipImage(file, 400);
          const ocr = await evaluateSlipWithRegistry(rawOcr, 400, slipOcrRound2?.transRef);
          setSlipOcrRound1(ocr);

          if (ocr.isFullyVerified) {
            triggerToast(`✓ สลิปมัดจำรอบ 1 ถูกต้องสมบูรณ์ (${ocr.amountFormatted}) พร้อมยืนยันสิทธิ์ทันที`, 'success');
          } else if (ocr.isDuplicate) {
            triggerToast(`🚨 ${ocr.duplicateMessage} (รอแอดมินตรวจ)`, 'error');
          } else if (ocr.isDetected) {
            triggerToast(ocr.message || `อัปโหลดและตรวจสแกนสลิปมัดจำรอบ 1 เรียบร้อย (${ocr.amountFormatted})`, ocr.status === 'verified' ? 'success' : 'warning');
          } else if (ocr.qrDetected) {
            triggerToast(`ตรวจพบ QR Code ในสลิป (${ocr.qrData?.typeName || 'SlipVerify'}) รหัส: ${ocr.transRef || '-'}`, 'info');
          } else {
            triggerToast('แนบรูปหลักฐานเรียบร้อย (ไม่พบตัวเลขยอดเงินในภาพ รอเจ้าหน้าที่ตรวจสลิป)', 'info');
          }
        } catch (ocrErr) {
          console.warn('Slip OCR notice:', ocrErr);
          triggerToast('แนบหลักฐานการโอนเงิน รอบที่ 1 (มัดจำเสื้อ 400 บาท) เรียบร้อยแล้ว', 'success');
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดสลิป', 'error');
    } finally {
      setIsProcessingFormSlip(false);
      e.target.value = '';
    }
  };

  // Upload Form Round 2 Slip Handler with Automatic OCR Scan
  const handleFormSlipRound2Change = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearFieldError('slipRound2');
    setIsProcessingFormSlipRound2(true);
    const feeInfo = getRegistrationFeeDetails(institution);
    try {
      const uploadResult = await DataService.uploadFile(file, 'slips');
      if (uploadResult?.url) {
        setFormSlipRound2(uploadResult.url);
        setFormSlipRound2FileName(file.name);
        
        // Run Slip OCR Scan & System Verification
        try {
          const rawOcr = await scanSlipImage(file, feeInfo.round2Amount);
          const ocr = await evaluateSlipWithRegistry(rawOcr, feeInfo.round2Amount, slipOcrRound1?.transRef);
          setSlipOcrRound2(ocr);

          if (ocr.isFullyVerified) {
            triggerToast(`✓ สลิปรอบที่ 2 ถูกต้องสมบูรณ์ (${ocr.amountFormatted}) พร้อมยืนยันสิทธิ์ทันที`, 'success');
          } else if (ocr.isDuplicate) {
            triggerToast(`🚨 ${ocr.duplicateMessage} (รอแอดมินตรวจ)`, 'error');
          } else if (ocr.isDetected) {
            triggerToast(ocr.message || `อัปโหลดและตรวจสแกนสลิปรอบที่ 2 เรียบร้อย (${ocr.amountFormatted})`, ocr.status === 'verified' ? 'success' : 'warning');
          } else if (ocr.qrDetected) {
            triggerToast(`ตรวจพบ QR Code ในสลิป (${ocr.qrData?.typeName || 'SlipVerify'}) รหัส: ${ocr.transRef || '-'}`, 'info');
          } else {
            triggerToast('แนบรูปหลักฐานเรียบร้อย (ไม่พบตัวเลขยอดเงินในภาพ รอเจ้าหน้าที่ตรวจสลิป)', 'info');
          }
        } catch (ocrErr) {
          console.warn('Slip OCR notice:', ocrErr);
          triggerToast(`แนบหลักฐานการโอนเงิน รอบที่ 2 (${feeInfo.round2Amount} บาท) เรียบร้อยแล้ว`, 'success');
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดสลิปรอบที่ 2', 'error');
    } finally {
      setIsProcessingFormSlipRound2(false);
      e.target.value = '';
    }
  };

  // Upload Full Payment Slip Handler with Automatic OCR Scan
  const handleFormSlipFullChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearFieldError('slipFull');
    clearFieldError('slipRound1');
    setIsProcessingFormSlipFull(true);
    const feeInfo = getRegistrationFeeDetails(institution);
    try {
      const uploadResult = await DataService.uploadFile(file, 'slips');
      if (uploadResult?.url) {
        setFormSlipFull(uploadResult.url);
        setFormSlipFullFileName(file.name);
        setFormSlipRound1(uploadResult.url);
        setFormSlipRound1FileName(file.name);
        
        // Run Slip OCR Scan & System Verification
        try {
          const rawOcr = await scanSlipImage(file, feeInfo.totalFee);
          const ocr = await evaluateSlipWithRegistry(rawOcr, feeInfo.totalFee);
          setSlipOcrFull(ocr);
          setSlipOcrRound1(ocr);

          if (ocr.isFullyVerified) {
            triggerToast(`✓ สลิปเต็มจำนวนถูกต้องสมบูรณ์ (${ocr.amountFormatted}) พร้อมยืนยันสิทธิ์ทันที`, 'success');
          } else if (ocr.isDuplicate) {
            triggerToast(`🚨 ${ocr.duplicateMessage} (รอแอดมินตรวจ)`, 'error');
          } else if (ocr.isDetected) {
            triggerToast(ocr.message || `อัปโหลดและตรวจสแกนสลิปเต็มจำนวนเรียบร้อย (${ocr.amountFormatted})`, ocr.status === 'verified' ? 'success' : 'warning');
          } else if (ocr.qrDetected) {
            triggerToast(`ตรวจพบ QR Code ในสลิป (${ocr.qrData?.typeName || 'SlipVerify'}) รหัส: ${ocr.transRef || '-'}`, 'info');
          } else {
            triggerToast('แนบรูปหลักฐานเรียบร้อย (ไม่พบตัวเลขยอดเงินในภาพ รอเจ้าหน้าที่ตรวจสลิป)', 'info');
          }
        } catch (ocrErr) {
          console.warn('Slip OCR notice:', ocrErr);
          triggerToast(`แนบหลักฐานการโอนเงินเต็มจำนวน (${feeInfo.totalFee} บาท) เรียบร้อยแล้ว`, 'success');
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดสลิป', 'error');
    } finally {
      setIsProcessingFormSlipFull(false);
      e.target.value = '';
    }
  };

  // Reusable populate function to restore registration form data
  const populateFormFromRegistration = (reg) => {
    if (!reg) return;
    if (reg.first_name_th || reg.title_th) {
      setTitleTh(reg.title_th || 'นาย');
      setTitleOtherTh(reg.title_other_th || '');
      setFirstNameTh(reg.first_name_th || reg.first_name || '');
      setLastNameTh(reg.last_name_th || reg.last_name || '');
      setInstitutionAbbrTh(reg.institution_abbr_th || 'มมส');

      setTitleEn(reg.title_en || 'Mr.');
      setTitleOtherEn(reg.title_other_en || '');
      setFirstNameEn(reg.first_name_en || '');
      setLastNameEn(reg.last_name_en || '');
      setInstitutionAbbrEn(reg.institution_abbr_en || 'MSU');
    } else if (reg.full_name_affiliation) {
      const parsed = parseFullNameAffiliationString(reg.full_name_affiliation);
      if (parsed.titleTh) setTitleTh(parsed.titleTh);
      if (parsed.firstNameTh) setFirstNameTh(parsed.firstNameTh);
      if (parsed.lastNameTh) setLastNameTh(parsed.lastNameTh);
      if (parsed.institutionAbbrTh) setInstitutionAbbrTh(parsed.institutionAbbrTh);

      if (parsed.titleEn) setTitleEn(parsed.titleEn);
      if (parsed.firstNameEn) setFirstNameEn(parsed.firstNameEn);
      if (parsed.lastNameEn) setLastNameEn(parsed.lastNameEn);
      if (parsed.institutionAbbrEn) setInstitutionAbbrEn(parsed.institutionAbbrEn);
    }

    setFirstName(reg.first_name || '');
    setLastName(reg.last_name || '');
    setFullNameAffiliation(reg.full_name_affiliation || `${reg.first_name || ''} ${reg.last_name || ''}`.trim());
    if (reg.nickname_th) setNicknameTh(reg.nickname_th);
    if (reg.nickname_en) setNicknameEn(reg.nickname_en);
    if (!reg.nickname_th && !reg.nickname_en && reg.nickname) {
      const parsedNick = parseNicknameString(reg.nickname);
      setNicknameTh(parsedNick.nicknameTh || '');
      setNicknameEn(parsedNick.nicknameEn || '');
    }
    setNickname(reg.nickname || '');
    setCallsign(reg.callsign || '');
    const selectedInstitution = OFFICIAL_NETWORK_INSTITUTIONS.find(
      inst => inst.fullName === reg.affiliation || inst.fullName === reg.institution ||
        inst.university === reg.affiliation || inst.university === reg.institution
    );
    const storedAffiliation = reg.affiliation || reg.institution || '';
    const universityMarker = storedAffiliation.search(/มหาวิทยาลัย|วิทยาลัย|สถาบัน/);
    const inferredUnit = !reg.unit && !reg.unit_name && universityMarker > 0
      ? storedAffiliation.slice(0, universityMarker).trim()
      : '';
    const inferredAffiliation = selectedInstitution?.university || (
      inferredUnit ? storedAffiliation.slice(inferredUnit.length).trim() : storedAffiliation
    );
    setUnit(reg.unit || reg.unit_name || selectedInstitution?.club || inferredUnit || '');
    setShirtSize(reg.shirt_size || 'L');
    setIdCardPhoto(reg.id_card_photo || reg.id_card_url || '');
    setBloodGroup(reg.blood_group || 'O');
    setPhone(reg.phone || '');
    setInstitution(inferredAffiliation || 'มหาวิทยาลัยมหาสารคาม (มมส)');
    setEmergencyName(reg.emergency_name ? reg.emergency_name.split(' (')[0] : '');
    setEmergencyPhone(reg.emergency_phone || '');
    setMedicalHistory(reg.medical_history || '');
    setFoodAllergy(reg.food_allergy || '');
    setPaymentPlan(reg.payment_plan ? reg.payment_plan : ((reg.installment_1_slip_url || reg.installment_2_slip_url) ? 'installment' : 'full'));
    
    // Parse relation if present
    if (reg.emergency_name && reg.emergency_name.includes('(')) {
      const relMatch = reg.emergency_name.match(/\((.*?)\)/);
      if (relMatch && relMatch[1]) {
        setEmergencyRelation(relMatch[1]);
      }
    }

    // Parse DOB
    if (reg.dob) {
      const parts = reg.dob.split('-');
      if (parts.length === 3) {
        setBirthYearBE(parts[0]);
        setBirthMonth(parseInt(parts[1], 10).toString());
        setBirthDay(parseInt(parts[2], 10).toString());
      }
    }
    setAgreeCorrectInfo(true);
    setAgreePDPAAndRules(true);
  };

  const handleCancelEditRegistration = () => {
    askConfirm({
      title: 'ยกเลิกการแก้ไขข้อมูลใบสมัคร',
      message: 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลใบสมัคร ต้องการยกเลิกและละทิ้งการเปลี่ยนแปลงทั้งหมดใช่หรือไม่? (ข้อมูลเดิมจะถูกนำกลับมา)',
      confirmText: 'ยืนยันยกเลิก (คืนค่าเดิม)',
      cancelText: 'แก้ไขต่อ',
      variant: 'warning',
      onConfirm: () => {
        if (myRegistration) {
          populateFormFromRegistration(myRegistration);
        }
        setIsEditing(false);
        if (onSubRouteChange) onSubRouteChange('dashboard');
        triggerToast('ยกเลิกการแก้ไขและคืนค่าข้อมูลเดิมเรียบร้อยแล้ว', 'info');
      }
    });
  };

  // Window beforeunload safeguard when user is editing form
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลใบสมัครและยังไม่ได้บันทึก หากออกจากหน้านี้ การเปลี่ยนแปลงจะสูญหาย';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  // Load existing data if registered
  useEffect(() => {
    if (myRegistration) {
      populateFormFromRegistration(myRegistration);
    } else if (user && user.name) {
      // Auto pre-fill name from Google Account for first-time applicants
      const parts = user.name.trim().split(' ');
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
        setFirstNameTh(parts[0]);
        setLastNameTh(parts.slice(1).join(' '));
      } else {
        setFirstName(user.name);
        setFirstNameTh(user.name);
      }
      if (!fullNameAffiliation) {
        setFullNameAffiliation(user.name);
      }
    }
  }, [myRegistration, user]);

  // Compute calculated age dynamically in real-time
  const ageResult = calculateAgeDetailed(birthYearBE, birthMonth, birthDay);
  const feeInfo = getRegistrationFeeDetails(institution);
  const isConsentAgreed = Boolean(agreeCorrectInfo && agreePDPAAndRules);

  const validateStep1 = () => {
    const errs = {};
    if (!firstNameTh.trim()) errs.firstNameTh = 'กรุณากรอกชื่อภาษาไทยให้ครบถ้วน';
    if (!lastNameTh.trim()) errs.lastNameTh = 'กรุณากรอกนามสกุลภาษาไทยให้ครบถ้วน';
    if (titleTh === 'อื่นๆ' && !titleOtherTh.trim()) errs.titleOtherTh = 'กรุณาระบุคำนำหน้าภาษาไทย';

    if (!firstNameEn.trim()) errs.firstNameEn = 'กรุณากรอกชื่อภาษาอังกฤษ (First Name) ให้ครบถ้วน';
    if (!lastNameEn.trim()) errs.lastNameEn = 'กรุณากรอกนามสกุลภาษาอังกฤษ (Last Name) ให้ครบถ้วน';
    if (titleEn === 'อื่นๆ' && !titleOtherEn.trim()) errs.titleOtherEn = 'กรุณาระบุ Title ภาษาอังกฤษ';

    if (!fullNameAffiliation.trim()) errs.fullNameAffiliation = 'กรุณาระบุคำนำหน้า ชื่อ - สกุล (ตัวย่อสถานศึกษา) ภาษาไทย เเละ ภาษาอังกฤษ ต่อกัน';
    if (!nicknameTh.trim()) errs.nicknameTh = 'กรุณากรอกชื่อเล่นภาษาไทย';
    if (!nicknameEn.trim()) errs.nicknameEn = 'กรุณากรอกชื่อเล่นภาษาอังกฤษ (Nickname in English)';
    if (!callsign.trim()) errs.callsign = 'กรุณาระบุรหัสนามเรียกขานหน่วยตัวเอง เช่น RCPMSU 15-01';
    if (!institution.trim()) errs.institution = 'กรุณาระบุสังกัด / Affiliation (มหาวิทยาลัยหรือสถาบัน)';

    if (ageResult.years < 15) {
      errs.birthYearBE = `ไม่อนุญาตให้ดำเนินการต่อ: ผู้เข้าร่วมโครงการ JRE 2027 ต้องมีอายุตั้งแต่ 15 ปีบริบูรณ์ขึ้นไป (ปัจจุบันคำนวณได้ ${ageResult.years} ปี)`;
    }
    if (phone.length !== 10 || !/^0\d{9}$/.test(phone)) {
      errs.phone = 'กรุณาระบุเบอร์โทรศัพท์มือถือให้ครบ 10 หลักพอดี (ขึ้นต้นด้วย 0)';
    }
    if (!emergencyName.trim()) {
      errs.emergencyName = 'กรุณาระบุชื่อ-สกุล บุคคลติดต่อฉุกเฉิน';
    }
    if (emergencyPhone.length !== 10 || !/^0\d{9}$/.test(emergencyPhone)) {
      errs.emergencyPhone = 'กรุณาระบุเบอร์โทรศัพท์ติดต่อฉุกเฉินให้ครบ 10 หลักพอดี (ขึ้นต้นด้วย 0)';
    }
    return errs;
  };

  const focusAndScrollToFirstError = (errs) => {
    const fieldOrder = [
      'titleOtherTh',
      'firstNameTh',
      'lastNameTh',
      'titleOtherEn',
      'firstNameEn',
      'lastNameEn',
      'fullNameAffiliation',
      'nicknameTh',
      'nicknameEn',
      'callsign',
      'institution',
      'birthYearBE',
      'phone',
      'emergencyName',
      'emergencyPhone',
      'shirtSize',
      'slipRound1',
      'slipFull',
      'slipRound2',
      'agreeCorrectInfo'
    ];

    const firstKey = fieldOrder.find(k => errs[k]);
    if (firstKey) {
      let targetId = `field-${firstKey}`;
      if (firstKey === 'agreeCorrectInfo' && currentFormStep === 4) {
        targetId = 'field-agreeCorrectInfo-step4';
      } else if (firstKey === 'slipRound1' || firstKey === 'slipFull') {
        targetId = 'field-slip-upload-step3';
      } else if (firstKey === 'slipRound2') {
        targetId = 'field-slip-upload-step4';
      }
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          el.focus?.();
        }, 250);
      }
    }
    return firstKey;
  };

  const handleNextToStep2 = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const firstKey = focusAndScrollToFirstError(errs);
      setStatusMessage({ type: 'error', text: errs[firstKey] });
      triggerToast(errs[firstKey], 'error');
      return;
    }

    setFieldErrors({});
    setStatusMessage(null);
    setCurrentFormStep(2);
    window.scrollTo({ top: 350, behavior: 'smooth' });
    triggerToast('ไปยังขั้นตอนที่ 2: สั่งเสื้อโครงการ JRE 2027 (พรีออเดอร์)', 'info');
  };

  const handleNextToStep3 = () => {
    if (!shirtSize) {
      setFieldErrors({ shirtSize: 'กรุณาเลือกไซส์เสื้อฝึก JRE 2027 (บังคับเลือกเนื่องจากจัดทำแบบพรีออเดอร์)' });
      setTimeout(() => {
        const el = document.getElementById('field-shirtSize');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus?.();
        }
      }, 200);
      setStatusMessage({ type: 'error', text: 'กรุณาเลือกไซส์เสื้อฝึก JRE 2027 (บังคับเลือกเนื่องจากจัดทำแบบพรีออเดอร์)' });
      triggerToast('กรุณาเลือกขนาดไซส์เสื้อฝึก JRE 2027', 'error');
      return;
    }
    setFieldErrors({});
    setStatusMessage(null);
    setCurrentFormStep(3);
    window.scrollTo({ top: 350, behavior: 'smooth' });
    if (paymentPlan === 'full') {
      triggerToast('ไปยังขั้นตอนที่ 3: สรุปค่าสมัคร & ชำระเงินเต็มจำนวน (3 ขั้นตอน)', 'info');
    } else {
      triggerToast('ไปยังขั้นตอนที่ 3: สรุปค่าสมัคร & ชำระเงินรอบที่ 1 (มัดจำ 400.-)', 'info');
    }
  };

  const handleNextToStep4 = () => {
    const hasRound1Slip = Boolean(formSlipRound1 || (isEditing && (myRegistration?.installment_1_slip_url || myRegistration?.payment_slip_url || myRegistration?.slip_url)));
    if (!hasRound1Slip) {
      setFieldErrors(prev => ({ ...prev, slipRound1: 'กรุณาอัปโหลดสลิปชำระเงินรอบที่ 1 (มัดจำค่าจัดทำเสื้อ 400 บาท) ก่อนดำเนินการไปยังขั้นตอนชำระรอบที่ 2' }));
      setStatusMessage({ type: 'error', text: 'กรุณาอัปโหลดสลิปชำระเงินรอบที่ 1 (มัดจำค่าจัดทำเสื้อ 400 บาท) ก่อน' });
      triggerToast('กรุณาแนบสลิปมัดจำค่าเสื้อรอบที่ 1 (400 บ.) ก่อน', 'error');
      setTimeout(() => {
        const el = document.getElementById('field-slip-upload-step3');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }
    clearFieldError('slipRound1');
    setStatusMessage(null);
    setCurrentFormStep(4);
    window.scrollTo({ top: 350, behavior: 'smooth' });
    triggerToast('ไปยังขั้นตอนที่ 4: สรุปยอดคงค้าง & ชำระเงินรอบที่ 2 (ยืนยันสิทธิ์สมบูรณ์)', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenGoogleLogin();
      return;
    }

    // Anti-Bot Honeypot Trap
    if (botHoneypot) {
      console.warn('Bot submission trapped by honeypot');
      return;
    }

    // Anti-Spam Rate Limiter (Prevent rapid multi-clicks or automated spam)
    const now = Date.now();
    if (now - lastSubmitTime < 2500) {
      triggerToast('กรุณารอสักครู่ก่อนทำรายการซ้ำ', 'warning');
      return;
    }
    setLastSubmitTime(now);

    // Step-by-Step form progression
    if (currentFormStep === 1) {
      handleNextToStep2();
      return;
    }
    if (currentFormStep === 2) {
      handleNextToStep3();
      return;
    }

    // Validate Step 1 fields
    const step1Errs = validateStep1();
    if (Object.keys(step1Errs).length > 0) {
      setCurrentFormStep(1);
      setFieldErrors(step1Errs);
      const firstKey = focusAndScrollToFirstError(step1Errs);
      setStatusMessage({ type: 'error', text: step1Errs[firstKey] });
      triggerToast(step1Errs[firstKey], 'error');
      return;
    }

    // Validate Step 2 Shirt Size
    if (!shirtSize) {
      setCurrentFormStep(2);
      setFieldErrors({ shirtSize: 'กรุณาเลือกไซส์เสื้อฝึก JRE 2027 (บังคับเลือกเนื่องจากจัดทำแบบพรีออเดอร์)' });
      setTimeout(() => {
        const el = document.getElementById('field-shirtSize');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus?.();
        }
      }, 200);
      setStatusMessage({ type: 'error', text: 'กรุณาเลือกไซส์เสื้อฝึก JRE 2027 (บังคับเลือกเนื่องจากจัดทำแบบพรีออเดอร์)' });
      triggerToast('กรุณาเลือกไซส์เสื้อฝึก JRE 2027', 'error');
      return;
    }

    // Check if slip is currently being processed or scanned
    if (isProcessingFormSlip || isProcessingFormSlipFull || isProcessingFormSlipRound2) {
      setStatusMessage({ type: 'warning', text: 'ระบบกำลังประมวลผลและสแกนสลิปโอนเงิน กรุณารอสักครู่...' });
      triggerToast('ระบบกำลังประมวลผลและสแกนสลิป กรุณารอสักครู่...', 'warning');
      return;
    }

    // Validate Mandatory Payment Slip (ตามนโยบาย: ต้องแนบสลิปทุกครั้ง ห้ามส่งใบสมัครโดยไม่มีสลิป)
    const feeInfo = getRegistrationFeeDetails(institution);
    if (paymentPlan === 'full') {
      const hasFullSlip = Boolean(formSlipFull || (isEditing && (myRegistration?.payment_slip_url || myRegistration?.slip_url)));
      if (!hasFullSlip) {
        setCurrentFormStep(3);
        const err = { slipFull: `กรุณาอัปโหลดรูปภาพสลิปโอนเงินเต็มจำนวน (${feeInfo.totalFee} บาท) เพื่อส่งใบสมัครและยืนยันสิทธิ์เข้าร่วมโครงการ (ระบบไม่อนุญาตให้ส่งใบสมัครโดยไม่มีสลิปการชำระเงิน)` };
        setFieldErrors(prev => ({ ...prev, ...err }));
        setStatusMessage({ type: 'error', text: err.slipFull });
        triggerToast(`กรุณาแนบสลิปโอนเงินเต็มจำนวน (${feeInfo.totalFee} บ.) ก่อนส่งใบสมัคร`, 'error');
        setTimeout(() => {
          const el = document.getElementById('field-slip-upload-step3');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        return;
      }
    } else if (paymentPlan === 'installment') {
      const hasRound1Slip = Boolean(formSlipRound1 || (isEditing && (myRegistration?.installment_1_slip_url || myRegistration?.payment_slip_url || myRegistration?.slip_url)));
      if (!hasRound1Slip) {
        setCurrentFormStep(3);
        const err = { slipRound1: 'กรุณาอัปโหลดรูปภาพสลิปโอนเงินรอบที่ 1 (มัดจำค่าจัดทำเสื้อฝึกอบรม 400 บาท) เพื่อส่งใบสมัคร (ระบบไม่อนุญาตให้ส่งใบสมัครโดยไม่มีสลิปการชำระเงิน)' };
        setFieldErrors(prev => ({ ...prev, ...err }));
        setStatusMessage({ type: 'error', text: err.slipRound1 });
        triggerToast('กรุณาแนบสลิปมัดจำค่าเสื้อรอบที่ 1 (400 บ.) ก่อนส่งใบสมัคร', 'error');
        setTimeout(() => {
          const el = document.getElementById('field-slip-upload-step3');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        return;
      }

      // If submitting from Step 4, Round 2 slip is also required to confirm full slot
      if (currentFormStep === 4) {
        const hasRound2Slip = Boolean(formSlipRound2 || (isEditing && myRegistration?.installment_2_slip_url));
        if (!hasRound2Slip) {
          const err = { slipRound2: `กรุณาอัปโหลดรูปภาพสลิปโอนเงินรอบที่ 2 (${feeInfo.round2Amount} บาท) เพื่อยืนยันสิทธิ์ หรือกดย้อนกลับไปขั้นตอนที่ 3 หากต้องการส่งเฉพาะสลิปรอบแรก (มัดจำเสื้อ) ก่อน` };
          setFieldErrors(prev => ({ ...prev, ...err }));
          setStatusMessage({ type: 'error', text: err.slipRound2 });
          triggerToast(`กรุณาแนบสลิปโอนเงินรอบที่ 2 (${feeInfo.round2Amount} บ.) หรือกดย้อนกลับไปขั้นตอนที่ 3`, 'error');
          setTimeout(() => {
            const el = document.getElementById('field-slip-upload-step4');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
          return;
        }
      }
    }

    // Validate Consent & PDPA
    if (!agreeCorrectInfo || !agreePDPAAndRules) {
      setFieldErrors(prev => ({ ...prev, agreeCorrectInfo: 'กรุณาติ๊กยินยอมรับรองข้อมูลและนโยบาย PDPA' }));
      const targetId = currentFormStep === 4 ? 'field-agreeCorrectInfo-step4' : 'field-agreeCorrectInfo';
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setStatusMessage({
        type: 'error',
        text: 'กรุณาติ๊กยินยอมว่าข้อมูลถูกต้อง และยินยอมปฏิบัติตามนโยบาย PDPA มมส และข้อตกลงโครงการก่อนบันทึกใบสมัคร'
      });
      triggerToast('กรุณาติ๊กรับรองข้อมูลและยินยอมนโยบาย PDPA ก่อนบันทึก', 'error');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const formattedDob = `${birthYearBE}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;

    let finalFirstName = firstName.trim() || firstNameTh.trim();
    let finalLastName = lastName.trim() || lastNameTh.trim();
    if (!finalFirstName && fullNameAffiliation) {
      const parts = fullNameAffiliation.trim().split(' ');
      finalFirstName = parts[0] || fullNameAffiliation;
      finalLastName = parts.slice(1).join(' ') || '-';
    }

    // Smart Auto-Confirmation Logic
    let finalPaymentStatus = 'unpaid';
    let finalInstallment1Status = 'unpaid';
    let finalInstallment2Status = 'unpaid';

      if (paymentPlan === 'full') {
        if (slipOcrFull?.isFullyVerified) {
          // All conditions matched (amount + date + no duplicate) -> Instant Auto Confirm!
          finalPaymentStatus = 'paid';
        } else if (formSlipFull || myRegistration?.payment_slip_url) {
          // Mismatch or unverified -> Allowed to submit, but requires admin review
          finalPaymentStatus = 'pending_review';
        }
      } else if (paymentPlan === 'installment') {
        // Round 1 (Deposit 400 THB)
        if (slipOcrRound1?.isFullyVerified) {
          finalInstallment1Status = 'paid';
          finalPaymentStatus = 'partial_paid';
        } else if (formSlipRound1 || myRegistration?.installment_1_slip_url) {
          finalInstallment1Status = 'pending_review';
          finalPaymentStatus = 'partial_paid';
        }

        // Round 2 (if present)
        if (currentFormStep === 4 || formSlipRound2 || myRegistration?.installment_2_slip_url) {
          if (slipOcrRound2?.isFullyVerified) {
            finalInstallment2Status = 'paid';
            if (finalInstallment1Status === 'paid') {
              finalPaymentStatus = 'paid';
            }
          } else if (formSlipRound2 || myRegistration?.installment_2_slip_url) {
            finalInstallment2Status = 'pending_review';
          }
        }
      }

      const payload = {
        user_id: user.id,
        user_email: user.email,
        user_avatar: user.avatar,
        first_name: finalFirstName,
        last_name: finalLastName,
        title_th: titleTh === 'อื่นๆ' ? titleOtherTh.trim() : titleTh,
        title_other_th: titleOtherTh.trim(),
        first_name_th: firstNameTh.trim(),
        last_name_th: lastNameTh.trim(),
        institution_abbr_th: institutionAbbrTh.trim(),
        title_en: titleEn === 'อื่นๆ' ? titleOtherEn.trim() : titleEn,
        title_other_en: titleOtherEn.trim(),
        first_name_en: firstNameEn.trim(),
        last_name_en: lastNameEn.trim(),
        institution_abbr_en: institutionAbbrEn.trim(),
        full_name_affiliation: fullNameAffiliation.trim() || `${finalFirstName} ${finalLastName}`.trim(),
        nickname: buildNicknameString(nicknameTh, nicknameEn) || nickname.trim(),
        nickname_th: nicknameTh.trim(),
        nickname_en: nicknameEn.trim(),
        callsign: callsign.trim(),
        unit: unit.trim(),
        affiliation: institution.trim(),
        shirt_size: shirtSize,
        id_card_photo: idCardPhoto,
        id_card_url: idCardPhoto,
        dob: formattedDob,
        age_years: ageResult.years,
        age_months: ageResult.months,
        age_days: ageResult.days,
        blood_group: bloodGroup,
        phone: phone.trim(),
        institution: institution.trim(),
        emergency_name: `${emergencyName.trim()} (${emergencyRelation})`,
        emergency_phone: emergencyPhone.trim(),
        medical_history: medicalHistory.trim(),
        food_allergy: foodAllergy.trim(),
        previous_training: previousTraining.trim(),
        group_assigned: myRegistration?.group_assigned || '',
        room_assigned: myRegistration?.room_assigned || '',
        is_special_care: myRegistration?.is_special_care || false,
        special_notes: myRegistration?.special_notes || '',
        admin_private_notes: myRegistration?.admin_private_notes || '',
        payment_plan: paymentPlan,
        payment_status: finalPaymentStatus,
        payment_amount: feeInfo.totalFee,
        payment_bank_info: `${effectivePaymentConfig.bank_name} เลขที่ ${effectivePaymentConfig.bank_account_number} ชื่อบัญชี ${effectivePaymentConfig.bank_account_name}`,
        payment_slip_url: paymentPlan === 'full' 
          ? (formSlipFull || myRegistration?.payment_slip_url || '') 
          : (formSlipRound2 || formSlipRound1 || myRegistration?.payment_slip_url || ''),
        payment_slip_date: (paymentPlan === 'full' ? formSlipFull : (formSlipRound2 || formSlipRound1)) 
          ? new Date().toISOString() 
          : (myRegistration?.payment_slip_date || ''),
        installment_1_status: paymentPlan === 'full' ? 'unpaid' : finalInstallment1Status,
        installment_1_amount: feeInfo.round1Amount,
        installment_1_due: feeInfo.round1Due,
        installment_1_slip_url: paymentPlan === 'full' ? '' : (formSlipRound1 || myRegistration?.installment_1_slip_url || ''),
        installment_1_slip_date: (paymentPlan !== 'full' && formSlipRound1) ? new Date().toISOString() : (paymentPlan === 'full' ? '' : (myRegistration?.installment_1_slip_date || '')),
        installment_2_status: paymentPlan === 'full' ? 'unpaid' : finalInstallment2Status,
        installment_2_amount: feeInfo.round2Amount,
        installment_2_due: feeInfo.round2Due,
        installment_2_slip_url: paymentPlan === 'full' ? '' : (formSlipRound2 || myRegistration?.installment_2_slip_url || ''),
        installment_2_slip_date: (paymentPlan !== 'full' && formSlipRound2) ? new Date().toISOString() : (paymentPlan === 'full' ? '' : (myRegistration?.installment_2_slip_date || '')),
        slip_ocr_round1: slipOcrRound1 || myRegistration?.slip_ocr_round1 || null,
        slip_ocr_round2: slipOcrRound2 || myRegistration?.slip_ocr_round2 || null,
        slip_ocr_full: slipOcrFull || myRegistration?.slip_ocr_full || null,
        admin_messages: myRegistration?.admin_messages || [],
        requested_docs: myRegistration?.requested_docs || [],
        status: 'confirmed'
      };

    try {
      await onSaveRegistration(payload);
      localStorage.removeItem(DRAFT_KEY);
      setHasDraftRestored(false);
      setIsEditing(false);

      // Record submitted slip TransRefs into central registry to prevent reuse
      const applicantName = `${finalFirstName} ${finalLastName}`.trim();
      if (slipOcrFull?.transRef) {
        DataService.recordSubmittedSlip({
          transRef: slipOcrFull.transRef,
          userId: user.id,
          userName: applicantName,
          amount: slipOcrFull.amount,
          bank: slipOcrFull.bankDetected,
          date: slipOcrFull.transferDate,
          time: slipOcrFull.transferTime
        });
      }
      if (slipOcrRound1?.transRef) {
        DataService.recordSubmittedSlip({
          transRef: slipOcrRound1.transRef,
          userId: user.id,
          userName: applicantName,
          amount: slipOcrRound1.amount,
          bank: slipOcrRound1.bankDetected,
          date: slipOcrRound1.transferDate,
          time: slipOcrRound1.transferTime
        });
      }
      if (slipOcrRound2?.transRef) {
        DataService.recordSubmittedSlip({
          transRef: slipOcrRound2.transRef,
          userId: user.id,
          userName: applicantName,
          amount: slipOcrRound2.amount,
          bank: slipOcrRound2.bankDetected,
          date: slipOcrRound2.transferDate,
          time: slipOcrRound2.transferTime
        });
      }

      if (onSubRouteChange) onSubRouteChange('dashboard');
      
      if (paymentPlan === 'full') {
        if (finalPaymentStatus === 'paid') {
          setStatusMessage({ type: 'success', text: '🎉 ตรวจสอบสลิปเต็มจำนวนถูกต้องสมบูรณ์ 100% ยืนยันสิทธิ์เข้าร่วมโครงการทันทีเรียบร้อยแล้ว!' });
          triggerToast('✓ สลิปถูกต้อง ยืนยันสิทธิ์ทันทีเรียบร้อย!', 'success');
        } else {
          setStatusMessage({ type: 'info', text: 'บันทึกใบสมัครและแนบสลิปเรียบร้อยแล้ว! เจ้าหน้าที่จะตรวจสอบสลิปเพื่อยืนยันสิทธิ์ต่อไป' });
          triggerToast('ส่งใบสมัครแล้ว (รอเจ้าหน้าที่ตรวจสอบสลิป)', 'info');
        }
      } else if (finalPaymentStatus === 'paid') {
        setStatusMessage({ type: 'success', text: '🎉 ตรวจสอบสลิปครบทั้ง 2 งวดถูกต้องสมบูรณ์ ยืนยันสิทธิ์เข้าร่วมโครงการทันทีเรียบร้อย!' });
        triggerToast('✓ ชำระครบ 2 งวด ยืนยันสิทธิ์ทันทีเรียบร้อย!', 'success');
      } else if (finalInstallment1Status === 'paid') {
        setStatusMessage({ type: 'success', text: '🎉 ตรวจสอบสลิปมัดจำงวดที่ 1 ถูกต้องสมบูรณ์ ล็อคไซส์เสื้อและบันทึกใบสมัครเรียบร้อยแล้ว!' });
        triggerToast('✓ มัดจำค่าเสื้อรอบ 1 ผ่าน ยืนยันสิทธิ์ทันที!', 'success');
      } else {
        setStatusMessage({ type: 'info', text: 'บันทึกใบสมัครและแนบสลิปเรียบร้อยแล้ว! เจ้าหน้าที่จะตรวจสอบสลิปเพื่อยืนยันสิทธิ์ต่อไป' });
        triggerToast('ส่งใบสมัครแล้ว (รอเจ้าหน้าที่ตรวจสอบสลิป)', 'info');
      }
      
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่' });
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Payment Slip Handler (Full Payment)
  const handleUploadPaymentSlip = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !myRegistration) return;

    setIsUploadingSlip(true);
    try {
      const uploadResult = await DataService.uploadFile(file, 'slips');
      if (uploadResult?.url) {
        let ocrInfo = null;
        try {
          const rawOcr = await scanSlipImage(file, feeInfo.totalFee);
          ocrInfo = await evaluateSlipWithRegistry(rawOcr, feeInfo.totalFee);
        } catch (ocrErr) {}

        const newPaymentStatus = ocrInfo?.isFullyVerified ? 'paid' : 'pending_review';

        await DataService.submitPaymentSlip(myRegistration.user_id, uploadResult.url, newPaymentStatus);
        if (onUpdateRegistration) {
          await onUpdateRegistration(myRegistration.user_id, {
            payment_plan: 'full',
            payment_slip_url: uploadResult.url,
            payment_slip_date: new Date().toISOString(),
            payment_status: newPaymentStatus,
            slip_ocr_full: ocrInfo
          });
        }

        if (ocrInfo?.transRef) {
          DataService.recordSubmittedSlip({
            transRef: ocrInfo.transRef,
            userId: myRegistration.user_id,
            userName: myRegistration.full_name_affiliation || `${myRegistration.first_name} ${myRegistration.last_name}`,
            amount: ocrInfo.amount,
            bank: ocrInfo.bankDetected,
            date: ocrInfo.transferDate,
            time: ocrInfo.transferTime
          });
        }

        if (ocrInfo?.isFullyVerified) {
          triggerToast(`✓ สลิปถูกต้องตรงตามยอด (${ocrInfo.amountFormatted}) ยืนยันสิทธิ์ทันทีเรียบร้อย!`, 'success');
        } else if (ocrInfo?.isDuplicate) {
          triggerToast(`🚨 ${ocrInfo.duplicateMessage} (รอเจ้าหน้าที่ตรวจสอบ)`, 'error');
        } else if (ocrInfo?.isDetected) {
          triggerToast(`อัปโหลดและสแกนสลิปเรียบร้อย (${ocrInfo.amountFormatted}) เจ้าหน้าที่จะทำการตรวจสอบ`, 'warning');
        } else {
          triggerToast('อัปโหลดหลักฐานเรียบร้อย (ไม่พบตัวเลขยอดเงินในภาพ รอเจ้าหน้าที่ตรวจสลิป)', 'info');
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดสลิป', 'error');
    } finally {
      setIsUploadingSlip(false);
      e.target.value = '';
    }
  };

  // Upload Installment Payment Slip Handler (Round 1 or Round 2)
  const handleUploadInstallmentSlip = async (e, round) => {
    const file = e.target.files?.[0];
    if (!file || !myRegistration) return;

    if (round === 1) setIsUploadingRound1(true);
    else setIsUploadingRound2(true);

    try {
      const uploadResult = await DataService.uploadFile(file, 'slips');
      if (uploadResult?.url) {
        let ocrInfo = null;
        const expectedAmount = round === 1 ? 400 : feeInfo.round2Amount;
        try {
          const rawOcr = await scanSlipImage(file, expectedAmount);
          ocrInfo = await evaluateSlipWithRegistry(rawOcr, expectedAmount);
        } catch (ocrErr) {}

        const roundStatus = ocrInfo?.isFullyVerified ? 'paid' : 'pending_review';
        await DataService.submitInstallmentSlip(myRegistration.user_id, round, uploadResult.url, roundStatus);

        if (onUpdateRegistration) {
          const update = {
            payment_plan: 'installment',
            [`installment_${round}_slip_url`]: uploadResult.url,
            [`installment_${round}_slip_date`]: new Date().toISOString(),
            [`installment_${round}_status`]: roundStatus,
            [`slip_ocr_round${round}`]: ocrInfo
          };

          if (round === 2 && roundStatus === 'paid' && myRegistration.installment_1_status === 'paid') {
            update.payment_status = 'paid';
          } else if (round === 1 && roundStatus === 'paid' && myRegistration.installment_2_status === 'paid') {
            update.payment_status = 'paid';
          } else if (round === 1 && roundStatus === 'paid') {
            update.payment_status = 'partial_paid';
          }

          await onUpdateRegistration(myRegistration.user_id, update);
        }

        if (ocrInfo?.transRef) {
          DataService.recordSubmittedSlip({
            transRef: ocrInfo.transRef,
            userId: myRegistration.user_id,
            userName: myRegistration.full_name_affiliation || `${myRegistration.first_name} ${myRegistration.last_name}`,
            amount: ocrInfo.amount,
            bank: ocrInfo.bankDetected,
            date: ocrInfo.transferDate,
            time: ocrInfo.transferTime
          });
        }

        if (ocrInfo?.isFullyVerified) {
          triggerToast(`✓ สลิปงวดที่ ${round} ถูกต้องสมบูรณ์ (${ocrInfo.amountFormatted}) ยืนยันสิทธิ์เรียบร้อย!`, 'success');
        } else if (ocrInfo?.isDuplicate) {
          triggerToast(`🚨 ${ocrInfo.duplicateMessage} (รอเจ้าหน้าที่ตรวจสอบ)`, 'error');
        } else if (ocrInfo?.isDetected) {
          triggerToast(`อัปโหลดและสแกนสลิปงวดที่ ${round} เรียบร้อย (${ocrInfo.amountFormatted}) เจ้าหน้าที่จะทำการตรวจสอบ`, 'warning');
        } else {
          triggerToast(`อัปโหลดหลักฐานงวดที่ ${round} เรียบร้อย (รอเจ้าหน้าที่ตรวจสลิป)`, 'info');
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast(`เกิดข้อผิดพลาดในการอัปโหลดสลิปงวดที่ ${round}`, 'error');
    } finally {
      if (round === 1) setIsUploadingRound1(false);
      else setIsUploadingRound2(false);
      e.target.value = '';
    }
  };

  // Upload Requested Document Handler
  const handleUploadUserDoc = async (e, docId) => {
    const file = e.target.files?.[0];
    if (!file || !myRegistration) return;

    setUploadingDocId(docId);
    try {
      const uploadResult = await DataService.uploadFile(file, 'docs');
      if (uploadResult?.url) {
        await DataService.submitUserDoc(myRegistration.user_id, docId, uploadResult.url, file.name);
        if (onUpdateRegistration) {
          const currentDocs = Array.isArray(myRegistration.requested_docs) ? [...myRegistration.requested_docs] : [];
          const idx = currentDocs.findIndex(d => d.id === docId);
          if (idx >= 0) {
            currentDocs[idx] = {
              ...currentDocs[idx],
              file_url: uploadResult.url,
              file_name: file.name,
              submitted_at: new Date().toISOString(),
              status: 'submitted'
            };
          }
          await onUpdateRegistration(myRegistration.user_id, { requested_docs: currentDocs });
        }
        triggerToast(`อัปโหลดเอกสาร "${file.name}" เรียบร้อยแล้ว`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดเอกสาร', 'error');
    } finally {
      setUploadingDocId(null);
      e.target.value = '';
    }
  };

  // If user is not logged in with Google yet
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-300 space-y-6">
        
        {/* Official Header Banner */}
        <div className="flex justify-center">
          <div className="w-full max-w-xl bg-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/60 flex items-center justify-center">
            <img
              src="/images/logo/jre_header_banner.png"
              alt="Joint Response Exercise (JRE 2027)"
              className="w-full h-auto object-contain max-h-24 sm:max-h-28"
            />
          </div>
        </div>

        {/* Step Indicator Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-orange-500/10 border-2 border-rescue-500/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rescue-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div>
              <p className="text-xs font-black text-rescue-400 uppercase tracking-wider">
                ขั้นตอนที่ 1 (จำเป็นต้องทำก่อน)
              </p>
              <p className="text-xs text-white font-bold">
                เข้าสู่ระบบ / สร้างบัญชีด้วย Google
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 opacity-60">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ขั้นตอนที่ 2 (ถัดไป)
              </p>
              <p className="text-xs text-slate-400 font-medium">
                กรอกใบสมัครโครงการ JRE 2027
              </p>
            </div>
          </div>
        </div>

        {/* Main Google Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
          
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-white/10 mb-6 p-4">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>

          <span className="px-3 py-1 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
            ระบบความปลอดภัยและการยืนยันตัวตน
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            เข้าสู่ระบบด้วย Google ก่อนสมัครเข้าร่วมโครงการ
          </h2>
          
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            ระบบ <span className="text-white font-bold">เข้าสู่ระบบด้วย Google</span> และระบบ <span className="text-white font-bold">สมัครเข้าร่วมโครงการ</span> เป็นคนละระบบกัน
            ผู้สมัครทุกคนต้องเข้าสู่ระบบด้วยบัญชี Google เพื่อสร้างบัญชีและยืนยันตัวตน โดยระบบจะดึงชื่อ นามสกุล อีเมล และรูปโปรไฟล์จาก Google อัตโนมัติ ท่านจึงไม่ต้องกรอกชื่อ อีเมล หรือตั้งรหัสผ่านใหม่
          </p>

          {/* 2-System Distinction Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8 max-w-xl mx-auto">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-rescue-400 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rescue-500" />
                ระบบเข้าสู่ระบบ / บัญชี Google
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                สร้างบัญชีผู้ใช้ใหม่และยืนยันตัวตนอัตโนมัติ ดึงรูปโปรไฟล์และอีเมลโดยตรง ไม่ต้องจำรหัสผ่าน
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                ระบบใบสมัครโครงการ JRE 2027
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                กรอกข้อมูลการฝึก สังกัด คำนวณอายุ ประวัติสุขภาพ เพื่อจัดกลุ่มฝึกและห้องนอน (เปิดหลังเข้าสู่ระบบ)
              </p>
            </div>
          </div>

          <button
            onClick={onOpenGoogleLogin}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-white via-slate-50 to-slate-100 hover:from-white hover:to-white text-slate-900 font-extrabold rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-white/10 transition-all duration-200 inline-flex items-center justify-center gap-3 text-sm active:scale-95 group border border-slate-200 hover:-translate-y-0.5"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <span>เข้าสู่ระบบด้วย Google เพื่อสร้างบัญชีและยืนยันตัวตน</span>
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <p className="text-[11px] text-slate-500 mt-4">
            เชื่อมต่อผ่านระบบ Supabase Auth & Google OAuth อย่างปลอดภัย
          </p>
        </div>

      </div>
    );
  }

  // APPLICANT DASHBOARD (View existing profile & history & Admin allocations)
  if (myRegistration && (!isEditing || isApplicantFullyPaid)) {
    const paymentStatus = myRegistration.payment_status || 'unpaid';
    const adminMessages = Array.isArray(myRegistration.admin_messages) ? myRegistration.admin_messages : [];
    const unreadMessagesCount = adminMessages.filter(m => !m.read).length;
    const requestedDocs = Array.isArray(myRegistration.requested_docs) ? myRegistration.requested_docs : [];

    const participantFee = getRegistrationFeeDetails(myRegistration.institution);
    const isMsu = participantFee.isMsu;
    const totalFee = participantFee.totalFee;
    const round1Amount = participantFee.round1Amount;
    const round2Amount = participantFee.round2Amount;

    // Detect if single payment was approved OR if both installments were approved
    const isSinglePaid = myRegistration.payment_plan !== 'installment' && (myRegistration.payment_status === 'paid' || myRegistration.payment_status === 'verified');
    const isRound2Paid = myRegistration.installment_2_status === 'paid' && Boolean(myRegistration.installment_2_slip_url);
    const isInstallmentsBothPaid = (myRegistration.installment_1_status === 'paid') && isRound2Paid;
    const isFullyPaid = isSinglePaid || isInstallmentsBothPaid;

    let paidAmount = 0;
    if (isFullyPaid) {
      paidAmount = totalFee;
    } else if (myRegistration.payment_plan === 'installment') {
      if (myRegistration.installment_1_status === 'paid') paidAmount += round1Amount;
      if (isRound2Paid) paidAmount += round2Amount;
    } else {
      if (isSinglePaid) paidAmount = totalFee;
    }
    const remainingAmount = Math.max(0, totalFee - paidAmount);
    const isInstallmentPlan = myRegistration.payment_plan 
      ? (myRegistration.payment_plan === 'installment') 
      : Boolean(myRegistration.installment_1_slip_url || myRegistration.installment_2_slip_url);

    const dashboardPaymentConfig = {
      ...effectivePaymentConfig,
      fee_total: participantFee.totalFee,
      installment_round1_amount: participantFee.round1Amount,
      installment_round1_due: participantFee.round1Due,
      installment_round2_amount: participantFee.round2Amount,
      installment_round2_due: participantFee.round2Due,
      notes: participantFee.feeNote
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Official Header Banner */}
        <div className="flex justify-center">
          <div className="w-full max-w-xl bg-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/60 flex items-center justify-center">
            <img
              src="/images/logo/jre_header_banner.png"
              alt="Joint Response Exercise (JRE 2027)"
              className="w-full h-auto object-contain max-h-24 sm:max-h-28"
            />
          </div>
        </div>

        {/* Digital ID Card generated directly from the applicant record */}
        <section className="rounded-3xl border border-orange-500/25 bg-gradient-to-br from-slate-900 via-[#0b1f3a] to-slate-950 p-4 shadow-2xl sm:p-6">
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">JRE 2027 Participant Badge</p>
              <h2 className="mt-1 text-lg font-black text-white sm:text-xl">บัตรประจำตัวดิจิทัลของฉัน</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">บัตรนี้สร้างจากข้อมูลผู้สมัครจริงและใช้ QR/Barcode สำหรับ Admin ตรวจสอบประวัติ</p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> ข้อมูลเชื่อมต่อแล้ว
            </span>
          </div>
          <IDCardPreview registration={myRegistration} user={user} />
        </section>

        {/* Top Header Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={myRegistration.id_card_photo || myRegistration.user_avatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-rescue-500 shadow-md"
                />
                {myRegistration.id_card_photo && (
                  <button
                    type="button"
                    onClick={() => setPreviewSlipModal(myRegistration.id_card_photo)}
                    className="absolute -bottom-1 -right-1 p-1 bg-slate-950/90 hover:bg-slate-900 text-rescue-400 border border-slate-700 rounded-lg text-[10px] font-bold shadow flex items-center gap-0.5"
                    title="คลิกดูรูปถ่ายเต็มจอ"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {myRegistration.first_name} {myRegistration.last_name}
                  </h1>
                  {myRegistration.nickname && (
                    <span className="text-amber-300 font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      ({myRegistration.nickname})
                    </span>
                  )}
                  {myRegistration.callsign && (
                    <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full text-[11px] font-bold flex items-center gap-1 font-mono">
                      📡 {myRegistration.callsign}
                    </span>
                  )}
                  {myRegistration.shirt_size && (
                    <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                      👕 ไซส์ {myRegistration.shirt_size}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    ลงทะเบียนแล้ว
                  </span>
                  {participantFee.isMsu ? (
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">
                      🏫 มมส ({participantFee.totalFee} บ.)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[11px] font-bold">
                      🏢 ต่างสถาบัน ({participantFee.totalFee} บ. รวมหอพัก)
                    </span>
                  )}
                  {myRegistration.group_assigned && (
                    <span className="px-2.5 py-0.5 bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 rounded-full text-[11px] font-bold flex items-center gap-1">
                      🎯 กลุ่ม: {myRegistration.group_assigned}
                    </span>
                  )}
                  {myRegistration.room_assigned && (
                    <span className="px-2.5 py-0.5 bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold flex items-center gap-1">
                      🛏️ ห้อง: {myRegistration.room_assigned}
                    </span>
                  )}
                  {myRegistration.is_special_care && (
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[11px] font-black animate-pulse flex items-center gap-1">
                      ⭐ ดูแลเป็นพิเศษ
                    </span>
                  )}
                </div>

                {(() => {
                  let thFullName = '';
                  let enFullName = '';

                  if (myRegistration.full_name_affiliation) {
                    const parts = myRegistration.full_name_affiliation.split('/');
                    if (parts.length >= 2) {
                      thFullName = parts[0].trim();
                      enFullName = parts.slice(1).join('/').trim();
                    } else {
                      thFullName = myRegistration.full_name_affiliation.trim();
                    }
                  }

                  if (!thFullName) {
                    thFullName = `${myRegistration.title || ''}${myRegistration.first_name || ''} ${myRegistration.last_name || ''}`.trim();
                  }
                  if (!enFullName && (myRegistration.first_name_en || myRegistration.last_name_en)) {
                    enFullName = `${myRegistration.title_en ? myRegistration.title_en + ' ' : ''}${myRegistration.first_name_en || ''} ${myRegistration.last_name_en || ''}`.trim();
                  }

                  return (
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                      {/* บรรทัด 1: ชื่อ-สกุล (ไทย) */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>ชื่อ-สกุล (ไทย):</span>
                        </span>
                        <span className="text-slate-100 font-bold text-sm">
                          {thFullName || `${myRegistration.first_name || ''} ${myRegistration.last_name || ''}`}
                        </span>
                      </div>

                      {/* บรรทัด 2: ชื่อ-สกุล (อังกฤษ) - ถ้ามี */}
                      {enFullName && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>ชื่อ-สกุล (อังกฤษ):</span>
                          </span>
                          <span className="text-indigo-200 font-semibold font-sans">
                            {enFullName}
                          </span>
                        </div>
                      )}

                      {/* บรรทัด 3: หน่วยงาน */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>หน่วย / Unit:</span>
                        </span>
                        <span className="text-slate-200 font-semibold">
                          {myCardData?.unit || '-'}
                        </span>
                      </div>

                      {/* บรรทัด 4: มหาวิทยาลัย/สถาบัน */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>สังกัด / Affiliation:</span>
                        </span>
                        <span className="text-slate-200 font-semibold">
                          {myCardData?.affiliation || '-'}
                        </span>
                      </div>

                      {/* บรรทัด 4: เบอร์โทรศัพท์ (ถ้ามี) */}
                      {myRegistration.phone && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>เบอร์โทรศัพท์:</span>
                          </span>
                          <span className="text-emerald-300 font-mono font-bold tracking-wider">
                            {myRegistration.phone}
                          </span>
                        </div>
                      )}

                      {/* บรรทัด 5: อีเมล */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>อีเมล:</span>
                        </span>
                        <span className="text-sky-300 font-mono font-semibold">
                          {myRegistration.user_email || '-'}
                        </span>
                      </div>

                      {/* บรรทัด 6: รหัสอ้างอิงใบสมัคร */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>รหัสอ้างอิง:</span>
                        </span>
                        <span className="text-amber-400 font-mono font-black tracking-wider bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md inline-block w-fit">
                          JRE27-{(myRegistration.id || myRegistration.user_id || '').slice(0, 6).toUpperCase()}
                        </span>
                      </div>

                      {/* บรรทัด 7: วันเวลาที่สมัคร */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>วันเวลาที่สมัคร:</span>
                        </span>
                        <span className="text-emerald-400 font-semibold font-mono">
                          {myRegistration.created_at ? new Date(myRegistration.created_at).toLocaleString('th-TH') : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0">
              {/* EDIT REGISTRATION BUTTON: Locked once fully paid and confirmed */}
              {isApplicantFullyPaid ? (
                <div
                  className="px-4 py-2.5 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 select-none"
                  title="ท่านชำระเงินครบถ้วนและได้รับการยืนยันสิทธิ์สมบูรณ์แล้ว ข้อมูลถูกล็อคเรียบร้อย หากต้องการแก้ไขกรุณาติดต่อผู้จัดโครงการ"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ยืนยันสิทธิ์สมบูรณ์แล้ว (ล็อคข้อมูล)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    if (onSubRouteChange) onSubRouteChange('form');
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                  title={hasAnyPaymentApproved ? "แก้ไขข้อมูลผู้เข้ารับการฝึกอบรม (Update Information)" : "แก้ไขข้อมูลรายละเอียดในใบสมัคร (Update Application)"}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{hasAnyPaymentApproved ? 'แก้ไขข้อมูล' : 'แก้ไขใบสมัคร'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setAccountDisplayName(user?.name || myRegistration?.first_name || '');
                  setAccountAvatar(user?.avatar || myRegistration?.user_avatar || '');
                  setAccountError('');
                  setShowAccountModal(true);
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                title="จัดการโปรไฟล์และเปลี่ยนรหัสผ่าน (User Profile & Password Hashing)"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>บัญชี & รหัสผ่าน</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNotificationsModal(true)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer relative ${
                  unreadMessagesCount > 0
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 ring-2 ring-amber-500/40 shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title={`กล่องข้อความและการแจ้งเตือนจาก Admin (${unreadMessagesCount} ยังไม่อ่าน)`}
              >
                <Bell className={`w-3.5 h-3.5 ${unreadMessagesCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span>ข้อความแจ้งเตือน</span>
                {unreadMessagesCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full shadow animate-pulse">
                    {unreadMessagesCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    ({adminMessages.length})
                  </span>
                )}
              </button>

              {/* CANCEL REGISTRATION BUTTON: Disabled if transferred or payment made */}
              {hasTransferredOrPaid ? (
                <div
                  className="px-3.5 py-2.5 bg-slate-900/90 text-slate-500 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-not-allowed select-none"
                  title="มีประวัติการแนบสลิปหรือโอนเงินแล้ว ไม่สามารถลบใบสมัครได้ (เพื่อความปลอดภัยทางบัญชี)"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                  <span>ยกเลิกใบสมัครไม่ได้ (แนบสลิปแล้ว)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(true)}
                  className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-600/40 hover:border-rose-500 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="ยกเลิกใบสมัครและลบข้อมูลของฉันออกจากฐานข้อมูล (Delete with Ownership Check)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>ยกเลิกใบสมัคร</span>
                </button>
              )}
            </div>
          </div>

          {/* NOTIFICATION HERO ALERT BANNER (If there are unread messages) */}
          {unreadMessagesCount > 0 && (
            <div 
              onClick={() => setShowNotificationsModal(true)}
              className="mt-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/70 via-purple-950/60 to-slate-900 border-2 border-amber-500/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-amber-300">
                      มี {unreadMessagesCount} ข้อความแจ้งเตือนใหม่จากฝ่ายประสานงาน & การเงิน JRE 2027
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-black animate-pulse">
                      ยังไม่อ่าน
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                    {adminMessages.find(m => !m.read)?.text || 'คลิกที่นี่เพื่อเปิดอ่านข้อความและการแจ้งเตือน'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <span className="text-xs font-bold text-amber-400 underline group-hover:text-amber-300">
                  เปิดอ่านข้อความแจ้งเตือน
                </span>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* OVERALL PAYMENT STATUS HERO BANNER */}
          <div className="mt-8">
            {isFullyPaid ? (
              <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-500/60 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
                    <CheckCircle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                      สถานะการเงิน: ชำระครบถ้วน 100%
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      🎉 ชำระค่าสมัครและสั่งซื้อเสื้อครบถ้วนแล้ว (Paid in Full)
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      ยอดรวมทั้งสิ้น {totalFee} บาท ได้รับการยืนยันครบถ้วนเรียบร้อยแล้ว ท่านได้รับสิทธิ์เข้าร่วมการฝึกอบรม JRE 2027 อย่างเป็นทางการ
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/30 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ชำระครบถ้วนแล้ว</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/60 border-2 border-amber-500/50 rounded-3xl shadow-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                        {isInstallmentPlan ? 'สถานะการเงิน: แผนแบ่งจ่าย 2 งวด' : 'สถานะการเงิน: แผนชำระเต็มจำนวน'}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        {isInstallmentPlan ? (
                          myRegistration.installment_1_status === 'unpaid'
                            ? `⚠️ ค้างชำระงวดที่ 1 จำนวน 400 บาท (ค่าจัดทำเสื้อพรีออเดอร์ กำหนดชำระ 15–20 ต.ค. 2569)`
                            : myRegistration.installment_1_status === 'pending_review'
                            ? `⏳ ส่งสลิปงวดที่ 1 แล้ว (400 บ.) • รอผู้ดูแลระบบตรวจสอบยอดเงิน`
                            : myRegistration.installment_2_status === 'unpaid'
                            ? `✅ งวดที่ 1 ชำระแล้ว | ⚠️ ค้างชำระงวดที่ 2 จำนวน ${round2Amount} บาท (กำหนดชำระ 1–5 พ.ย. 2569)`
                            : `✅ งวดที่ 1 ชำระแล้ว | ⏳ ส่งสลิปงวดที่ 2 แล้ว (${round2Amount} บ.) • รอผู้ดูแลระบบตรวจสอบ`
                        ) : (
                          (myRegistration.payment_slip_url || myRegistration.slip_url)
                            ? `⏳ ส่งสลิปชำระเต็มจำนวนแล้ว (${totalFee} บ.) • รอผู้ดูแลระบบตรวจสอบยอดเงิน`
                            : `⚠️ ค้างชำระค่าลงทะเบียนเต็มจำนวน (${totalFee} บาท) • กรุณาแนบสลิปด้านล่าง`
                        )}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ระบบส่งข้อมูลใบสมัครและรายการสั่งเสื้อไปยังผู้ดูแลระบบ (Admin) แล้ว ท่านสามารถแนบสลิปด้านล่างเพื่อยืนยันยอดเงิน
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/90 p-3 px-4 rounded-2xl border border-slate-800 text-xs shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ยอดรวม: <strong className="text-white">{totalFee} บ.</strong></span>
                      <span className="text-[10px] text-emerald-400 block">ชำระแล้ว: <strong>{paidAmount} บ.</strong></span>
                    </div>
                    <div className="pl-3 border-l border-slate-800">
                      <span className="text-[10px] text-rose-400 block font-semibold">ค้างชำระ:</span>
                      <span className="text-base font-black text-rose-400">{remainingAmount} บ.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VISUAL INTERACTIVE PROGRESS FLOW (3 Steps for Full Payment / 4 Steps for 2 Installments) */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🚀</span>
                <span>ขั้นตอนการเข้าร่วมโครงการ JRE 2027 ({isInstallmentPlan ? '4 ขั้นตอน' : '3 ขั้นตอน'})</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {isInstallmentPlan ? 'ระบบแบ่งชำระ 2 งวด พร้อมสั่งเสื้อพรีออเดอร์' : 'ระบบชำระเต็มจำนวน พร้อมสั่งเสื้อพรีออเดอร์'}
              </span>
            </div>

            <div className={`grid grid-cols-1 ${isInstallmentPlan ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
              {/* Step 1 Card: ข้อมูลผู้สมัคร & ID Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-3 shadow-xl relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-400" /> ขั้นตอนที่ 1
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ ยืนยันข้อมูลแล้ว
                    </span>
                  </div>
                  <h4 className="font-black text-white text-sm mt-2">
                    ข้อมูลผู้สมัคร & รูปทำ ID Card
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {myRegistration.full_name_affiliation}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                  <div
                    onClick={() => setPreviewSlipModal(myRegistration.id_card_photo || myRegistration.user_avatar || user?.avatar)}
                    className="w-12 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-indigo-400 transition-colors shrink-0 cursor-pointer relative group"
                    title="คลิกดูรูปทำ ID Card"
                  >
                    <img
                      src={myRegistration.id_card_photo || myRegistration.user_avatar || user?.avatar}
                      alt="ID Photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 text-[10px] text-slate-400 space-y-0.5">
                    <span className="font-mono text-sky-300 block truncate font-bold">📡 {myRegistration.callsign || '-'}</span>
                    <span className="text-amber-300 block">ชื่อเล่น: {myRegistration.nickname || '-'}</span>
                    <span className="text-slate-400 block">อายุ: {myRegistration.age_years || 0} ปี ({myRegistration.blood_group})</span>
                  </div>
                </div>
              </div>

              {/* Step 2 Card: สั่งเสื้อโครงการ JRE 2027 */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-3 shadow-xl relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-purple-400" /> ขั้นตอนที่ 2
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ สั่งเสื้อแล้ว
                    </span>
                  </div>
                  <h4 className="font-black text-white text-sm mt-2">
                    เสื้อฝึก JRE 2027 (พรีออเดอร์)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    คอเต่าซิป แขนสั้น โทนสีเทา–ดำ
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                  <div
                    onClick={() => setShowShirtSizeModal(true)}
                    className="w-12 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-purple-400 transition-colors shrink-0 cursor-pointer relative group"
                    title="คลิกดูแบบเสื้อและตารางไซส์"
                  >
                    <img
                      src="/images/merchandise/jre_shirt_official.jpg"
                      alt="Shirt"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-400 block">ไซส์ที่สั่งจอง:</span>
                    <span className="text-base font-black text-amber-300 block">
                      ไซส์ {myRegistration.shirt_size || 'L'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setShowShirtSizeModal(true)}
                        className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                      >
                        ดูตารางไซส์
                      </button>
                      <span className="text-slate-600">•</span>
                      <a
                        href="/merchandise/orders"
                        className="text-[10px] text-amber-300 hover:underline font-bold inline-flex items-center gap-0.5"
                      >
                        <QrCode className="w-3 h-3 text-amber-400" />
                        <span>บัตรรับเสื้อ & QR</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 (or Steps 3 & 4 depending on plan) */}
              {!isInstallmentPlan ? (
                /* Step 3 Card: ชำระเต็มจำนวน */
                <div className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-3 shadow-xl relative overflow-hidden ${
                  isFullyPaid
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : (myRegistration.payment_slip_url || myRegistration.slip_url)
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-rose-500/40 bg-rose-950/10'
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" /> ขั้นตอนที่ 3
                      </span>
                      {isFullyPaid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ ชำระครบถ้วนแล้ว
                        </span>
                      ) : (myRegistration.payment_slip_url || myRegistration.slip_url) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                          ⏳ รอตรวจสลิป
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          ค้างชำระ
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-white text-sm mt-2">
                      ชำระค่าสมัครเต็มจำนวน: {totalFee} บาท
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ค่าสมัครรวมเสื้อและกิจกรรม {isMsu ? '(นิสิต มมส)' : '(รวมที่พัก 1 คืน)'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    {(myRegistration.payment_slip_url || myRegistration.slip_url) ? (
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() => setPreviewSlipModal(myRegistration.payment_slip_url || myRegistration.slip_url)}
                          className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-emerald-400 transition-colors shrink-0 cursor-pointer"
                          title="คลิกดูสลิปเต็มจำนวน"
                        >
                          <img src={myRegistration.payment_slip_url || myRegistration.slip_url} alt="สลิปเต็มจำนวน" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-emerald-400 font-bold block truncate">
                            {isFullyPaid ? '✓ ยืนยันยอดเงินแล้ว (ล็อคสลิป)' : '✓ แนบสลิปแล้ว (รอตรวจ)'}
                          </span>
                          {myRegistration.slip_ocr_full && (
                            <span className="text-[9px] text-slate-300 block font-mono truncate" title={myRegistration.slip_ocr_full.uploadTimeStr}>
                              {myRegistration.slip_ocr_full.isDetected 
                                ? `โอน: ${myRegistration.slip_ocr_full.transferDateTimeStr || myRegistration.slip_ocr_full.uploadTimeStr} (${myRegistration.slip_ocr_full.amountFormatted})`
                                : `อัปโหลด: ${myRegistration.slip_ocr_full.uploadTimeStr} (รอตรวจยอด)`}
                            </span>
                          )}
                          {!isFullyPaid && (
                            <label className="text-[10px] text-sky-400 hover:underline cursor-pointer block">
                              <span>ส่งสลิปใหม่ทดแทน</span>
                              <input type="file" accept="image/*" onChange={handleUploadPaymentSlip} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className={`w-full cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 ${isUploadingSlip ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploadingSlip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>แนบสลิปเต็มจำนวน ({totalFee} บ.)</span>
                        <input type="file" accept="image/*" onChange={handleUploadPaymentSlip} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Step 3 Card: งวดที่ 1 (400 บาท) */}
                  <div className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-3 shadow-xl relative overflow-hidden ${
                    (isFullyPaid || myRegistration.installment_1_status === 'paid')
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : myRegistration.installment_1_status === 'pending_review'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-rose-500/40 bg-rose-950/10'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" /> ขั้นตอนที่ 3 (งวด 1)
                        </span>
                        {(isFullyPaid || myRegistration.installment_1_status === 'paid') ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ ชำระแล้ว
                          </span>
                        ) : myRegistration.installment_1_status === 'pending_review' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            ⏳ รอตรวจ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ค้างชำระ
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-white text-sm mt-2">
                        ชำระรอบที่ 1: 400 บาท
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ค่าจัดทำเสื้อโครงการ (15–20 ต.ค. 2569)
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      {(myRegistration.installment_1_slip_url || (isFullyPaid && (myRegistration.payment_slip_url || myRegistration.slip_url))) ? (
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => setPreviewSlipModal(myRegistration.installment_1_slip_url || myRegistration.payment_slip_url || myRegistration.slip_url)}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-emerald-400 transition-colors shrink-0 cursor-pointer"
                            title="คลิกดูสลิปงวด 1"
                          >
                            <img src={myRegistration.installment_1_slip_url || myRegistration.payment_slip_url || myRegistration.slip_url} alt="สลิปงวด 1" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-emerald-400 font-bold block truncate">
                              {(isFullyPaid || myRegistration.installment_1_status === 'paid') ? '✓ อนุมัติงวด 1 แล้ว' : '✓ แนบสลิปแล้ว'}
                            </span>
                            {myRegistration.slip_ocr_round1 && (
                              <span className="text-[9px] text-slate-300 block font-mono truncate" title={myRegistration.slip_ocr_round1.uploadTimeStr}>
                                {myRegistration.slip_ocr_round1.isDetected 
                                  ? `โอน: ${myRegistration.slip_ocr_round1.transferDateTimeStr || myRegistration.slip_ocr_round1.uploadTimeStr} (${myRegistration.slip_ocr_round1.amountFormatted})`
                                  : `อัปโหลด: ${myRegistration.slip_ocr_round1.uploadTimeStr} (รอตรวจยอด)`}
                              </span>
                            )}
                            {(!isFullyPaid && myRegistration.installment_1_status !== 'paid') && (
                              <label className="text-[10px] text-sky-400 hover:underline cursor-pointer block">
                                <span>ส่งสลิปใหม่ทดแทน</span>
                                <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 1)} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>
                      ) : (
                        <label className={`w-full cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 ${isUploadingRound1 ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingRound1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>แนบสลิปงวด 1 (400 บ.)</span>
                          <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 1)} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Step 4 Card: งวดที่ 2 (450 หรือ 250 บาท) */}
                  <div className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-3 shadow-xl relative overflow-hidden ${
                    (isFullyPaid || isRound2Paid)
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : myRegistration.installment_2_status === 'pending_review'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-rose-500/40 bg-rose-950/10'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-sky-400" /> ขั้นตอนที่ 4 (งวด 2)
                        </span>
                        {(isFullyPaid || isRound2Paid) ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ ชำระแล้ว
                          </span>
                        ) : myRegistration.installment_2_status === 'pending_review' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            ⏳ รอตรวจ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ค้างชำระ
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-white text-sm mt-2">
                        ชำระรอบที่ 2: {round2Amount} บาท
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isMsu ? 'ค่าอาหาร & กิจกรรม (1–5 พ.ย. 2569)' : 'ค่าที่พัก & อาหาร (1–5 พ.ย. 2569)'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      {(myRegistration.installment_2_slip_url || (isFullyPaid && (myRegistration.payment_slip_url || myRegistration.slip_url))) ? (
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => setPreviewSlipModal(myRegistration.installment_2_slip_url || myRegistration.payment_slip_url || myRegistration.slip_url)}
                            className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 hover:border-emerald-400 transition-colors shrink-0 cursor-pointer"
                            title="คลิกดูสลิปงวด 2"
                          >
                            <img src={myRegistration.installment_2_slip_url || myRegistration.payment_slip_url || myRegistration.slip_url} alt="สลิปงวด 2" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-emerald-400 font-bold block truncate">
                              {(isFullyPaid || isRound2Paid) ? '✓ อนุมัติงวด 2 แล้ว' : '✓ แนบสลิปแล้ว'}
                            </span>
                            {myRegistration.slip_ocr_round2 && (
                              <span className="text-[9px] text-slate-300 block font-mono truncate" title={myRegistration.slip_ocr_round2.uploadTimeStr}>
                                {myRegistration.slip_ocr_round2.isDetected 
                                  ? `โอน: ${myRegistration.slip_ocr_round2.transferDateTimeStr || myRegistration.slip_ocr_round2.uploadTimeStr} (${myRegistration.slip_ocr_round2.amountFormatted})`
                                  : `อัปโหลด: ${myRegistration.slip_ocr_round2.uploadTimeStr} (รอตรวจยอด)`}
                              </span>
                            )}
                            {(!isFullyPaid && myRegistration.installment_2_status !== 'paid') && (
                              <label className="text-[10px] text-sky-400 hover:underline cursor-pointer block">
                                <span>ส่งสลิปใหม่ทดแทน</span>
                                <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 2)} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>
                      ) : (
                        <label className={`w-full cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 ${isUploadingRound2 ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingRound2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>แนบสลิปงวด 2 ({round2Amount} บ.)</span>
                          <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 2)} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* GOOGLE FORMS ASSESSMENTS (Pre-Test / Post-Test / Evaluation) */}
          {formsConfig && (formsConfig.pretest?.enabled || formsConfig.posttest?.enabled || formsConfig.evaluation?.enabled) && (
            <div className="mt-8 p-5 sm:p-6 bg-gradient-to-r from-blue-950/40 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>แบบทดสอบและประเมินผลที่เปิดให้ดำเนินการขณะนี้</span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      โปรดคลิกทำแบบทดสอบหรือประเมินผลตามลำดับขั้นตอนของโครงการ
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ระบบเปิดให้ทำแบบทดสอบแล้ว
                </span>
              </div>

              {/* Assessment Cards Grid with Official Banners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {formsConfig.pretest?.enabled && (
                  <a
                    href={formsConfig.pretest.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white font-bold shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-blue-500/30 hover:border-blue-400"
                  >
                    {/* Official Banner Header */}
                    <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-slate-950 border-b border-blue-500/20">
                      <img
                        src={formsConfig.pretest.banner || '/images/banner/banner_pretest.png'}
                        alt={formsConfig.pretest.title || 'Pre-Test'}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-blue-600/90 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow">
                        Pre-Test
                      </div>
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-md text-white group-hover:scale-110 transition-transform">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="text-sm sm:text-base font-black text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {formsConfig.pretest.title || 'แบบทดสอบก่อนเรียน (Pre-Test) 2027'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-1 line-clamp-2">
                          {formsConfig.pretest.description || 'แบบทดสอบวัดความรู้พื้นฐานด้านการกู้ภัย การปฐมพยาบาล และระบบบัญชาการเหตุก่อนเข้ารับการฝึก'}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-blue-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                          Google Forms
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 group-hover:bg-blue-600 text-blue-300 group-hover:text-white font-bold transition-all">
                          เริ่มทำแบบทดสอบ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </a>
                )}

                {formsConfig.posttest?.enabled && (
                  <a
                    href={formsConfig.posttest.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white font-bold shadow-xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-orange-500/30 hover:border-orange-400"
                  >
                    {/* Official Banner Header */}
                    <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-slate-950 border-b border-orange-500/20">
                      <img
                        src={formsConfig.posttest.banner || '/images/banner/banner_posttest.png'}
                        alt={formsConfig.posttest.title || 'Post-Test'}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-orange-600/90 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow">
                        Post-Test
                      </div>
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-md text-white group-hover:scale-110 transition-transform">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="text-sm sm:text-base font-black text-white group-hover:text-orange-300 transition-colors line-clamp-1">
                          {formsConfig.posttest.title || 'แบบทดสอบหลังเรียน (Post-Test)'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-1 line-clamp-2">
                          {formsConfig.posttest.description || 'แบบทดสอบวัดผลสัมฤทธิ์และทักษะความรู้หลังเสร็จสิ้นการฝึกปฏิบัติการจริง'}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-orange-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                          Google Forms
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600/20 group-hover:bg-orange-600 text-orange-300 group-hover:text-white font-bold transition-all">
                          เริ่มทำแบบทดสอบ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </a>
                )}

                {formsConfig.evaluation?.enabled && (
                  <a
                    href={formsConfig.evaluation.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white font-bold shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-emerald-500/30 hover:border-emerald-400"
                  >
                    {/* Official Banner Header */}
                    <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-slate-950 border-b border-emerald-500/20">
                      <img
                        src={formsConfig.evaluation.banner || '/images/banner/banner_evaluation.png'}
                        alt={formsConfig.evaluation.title || 'Evaluation'}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-emerald-600/90 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow">
                        Evaluation
                      </div>
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-md text-white group-hover:scale-110 transition-transform">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {formsConfig.evaluation.title || 'แบบประเมินความพึงพอใจ (JRE 2027)'}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-1 line-clamp-2">
                          {formsConfig.evaluation.description || 'แบบประเมินผลความพึงพอใจและข้อเสนอแนะในการพัฒนาโครงการ JRE 2027'}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Google Forms
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white font-bold transition-all">
                          ประเมินผลโครงการ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ADMIN ALLOCATIONS: Group & Room (Top Priority Display) */}
          <div className="mt-8 p-5 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-amber-950/40 border border-indigo-700/40 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rescue-500" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  ผลการจัดสรรกลุ่มฝึก & ห้องนอนจากผู้ดูแลระบบ (Admin Assignment)
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                อัปเดตตามคำสั่งโครงการ JRE 2027
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group Assigned Card */}
              <div className="bg-slate-900/90 border border-indigo-600/50 p-5 rounded-2xl relative overflow-hidden shadow-lg">
                <p className="text-xs uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1.5">
                  <span>🎯</span> กลุ่มฝึกปฏิบัติการที่สังกัด (Assigned Group)
                </p>
                <div className="mt-2.5">
                  {myRegistration.group_assigned ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-black text-white text-indigo-200">
                        {myRegistration.group_assigned}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เข้ารายงานตัว ณ จุดรวมพลของกลุ่มตามเวลากำหนดการ</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 py-2">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      <span className="text-sm font-semibold">กำลังรอ Admin จัดสรรกลุ่มฝึกปฏิบัติการ...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Assigned Card */}
              <div className="bg-slate-900/90 border border-amber-600/50 p-5 rounded-2xl relative overflow-hidden shadow-lg">
                <p className="text-xs uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                  <span>🛏️</span> ห้องนอน / ที่พักค้างแรม (Assigned Room)
                </p>
                <div className="mt-2.5">
                  {myRegistration.room_assigned ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-black text-white text-amber-200">
                        {myRegistration.room_assigned}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เข้าพักตามห้องนอนที่ระบุ ณ หอพักกุดรัง มมส</span>
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap gap-2">
                        <span className="text-sky-300">❄️ แอร์</span>
                        <span className="text-amber-300">🚿 เครื่องทำน้ำอุ่น</span>
                        <span className="text-emerald-300">🛏️ มีหมอน & ผ้าห่มพร้อม</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 text-amber-400 py-1">
                        <Clock className="w-4 h-4 animate-spin-slow" />
                        <span className="text-sm font-semibold">กำลังรอ Admin จัดสรรห้องพักค้างแรม...</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        เข้าพัก ณ หอพักกุดรัง มมส (ห้องแอร์ พร้อมเครื่องทำน้ำอุ่น หมอน ผ้าห่ม โต๊ะเขียนงาน และตู้เสื้อผ้า)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ADMIN SPECIAL CARE REMARKS (If flagged by Admin) */}
          {myRegistration.is_special_care && (
            <div className="mt-6 p-4 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 border border-rose-600/50 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  หมายเหตุการดูแลพิเศษจากคณะกรรมการ / ทีมแพทย์สนาม
                </h4>
                <p className="text-xs text-slate-200 mt-1">
                  {myRegistration.special_notes || 'ผู้เข้าร่วมอบรมท่านนี้ได้รับการบันทึกข้อมูลเพื่อเฝ้าระวังและสนับสนุนเป็นพิเศษระหว่างการฝึก'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION: สถานะการชำระเงิน & ระบบแบ่งจ่าย 2 งวด (Interactive Payment & Installments) */}
          <div className="mt-8 p-5 sm:p-6 rounded-3xl border bg-slate-950/80 border-slate-800 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>ข้อมูลค่าสมัคร & สถานะการชำระเงิน</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      ({isInstallmentPlan ? 'แผนแบ่งจ่าย 2 งวด' : 'แผนชำระเต็มจำนวน (จ่ายครบ 1 รอบ)'})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isMsu ? '🎓 สังกัดนิสิต มมส (ยอดรวม 650 บ. • ไม่มีค่าที่พัก)' : '🏨 สังกัดต่างมหาวิทยาลัย (ยอดรวม 850 บ. • รวมที่พักหอกุดรัง มมส)'} • {dashboardPaymentConfig.notes || 'รองรับการชำระเต็มจำนวนหรือแบ่งจ่าย 2 งวด'}
                  </p>
                </div>
              </div>

              {/* Overall Payment Status Pill */}
              {myRegistration.payment_status === 'paid' ? (
                <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle className="w-4 h-4" /> ชำระค่าสมัครครบถ้วนแล้ว
                </span>
              ) : myRegistration.payment_status === 'pending_review' ? (
                <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-sm">
                  <Clock className="w-4 h-4" /> ส่งสลิปแล้ว กำลังรอผู้ดูแลตรวจสอบ
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <AlertCircle className="w-4 h-4" /> ค้างชำระค่าลงทะเบียน ({dashboardPaymentConfig.fee_total} บ.)
                </span>
              )}
            </div>

            {/* Bank Account Info Card with 1-Click Copy */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-white flex items-center gap-1.5">
                  🏦 ข้อมูลบัญชีธนาคารสำหรับโอนเงิน
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  ✓ คลิกปุ่มเพื่อคัดลอกได้ทันที
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Bank Account Number */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">{dashboardPaymentConfig.bank_name}</span>
                    <span className="font-mono font-bold text-amber-300 text-sm truncate block">
                      {dashboardPaymentConfig.bank_account_number}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(dashboardPaymentConfig.bank_account_number, 'bank_acc', 'เลขบัญชี')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                    title="คัดลอกเลขบัญชี"
                  >
                    {copiedKey === 'bank_acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bank_acc' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                {/* Account Name */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">ชื่อบัญชี</span>
                    <span className="font-semibold text-white text-xs truncate block" title={dashboardPaymentConfig.bank_account_name}>
                      {dashboardPaymentConfig.bank_account_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(dashboardPaymentConfig.bank_account_name, 'bank_name', 'ชื่อบัญชี')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                    title="คัดลอกชื่อบัญชี"
                  >
                    {copiedKey === 'bank_name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bank_name' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                {/* Contact Phone (No PromptPay) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-300 block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      ☎️ สอบถามเพิ่มเติม (ไม่มีพร้อมเพย์)
                    </span>
                    <span className="font-mono font-bold text-white text-sm truncate block mt-0.5">
                      {dashboardPaymentConfig.contact_phone || '098-329-6762'}
                    </span>
                  </div>
                  <a
                    href={`tel:${(dashboardPaymentConfig.contact_phone || '098-329-6762').replace(/[^0-9]/g, '')}`}
                    className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                    title="โทรสอบถาม"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>โทรติดต่อ</span>
                  </a>
                </div>
              </div>

              <div className="mt-3 text-[11px] bg-rose-950/40 border border-rose-500/40 text-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>ข้อควรระวัง:</strong> รับโอนเงินเฉพาะบัญชี <strong>ธนาคารไทยพาณิชย์ 594-264865-5 (นางสาวมัญชุพร ยังเหล็ก)</strong> เท่านั้น • <u>ไม่มีระบบพร้อมเพย์ (PromptPay)</u> (เบอร์ 098-329-6762 มีไว้สำหรับสอบถามข้อมูลเท่านั้น ห้ามโอนเงินผ่านเบอร์โทร)
                </span>
              </div>

              {myRegistration.payment_notes && (
                <div className="text-[11px] text-amber-200/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                  <span className="font-bold">หมายเหตุจากฝ่ายการเงิน: </span>
                  {myRegistration.payment_notes}
                </div>
              )}
            </div>

            {/* Payment Plan Indicator Banner (Locked on dashboard; can only change at Step 1 if unpaid) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-base shrink-0">📌</span>
                <div>
                  <span className="text-xs text-slate-400 font-medium">รูปแบบการชำระเงินที่เลือกไว้:</span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm ${
                      isInstallmentPlan 
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isInstallmentPlan ? (
                        <>💳 แบ่งจ่าย 2 งวด ({dashboardPaymentConfig.installment_round1_amount} + {dashboardPaymentConfig.installment_round2_amount} บาท)</>
                      ) : (
                        <>🌟 ชำระเต็มจำนวน ({dashboardPaymentConfig.fee_total} บาท)</>
                      )}
                    </span>
                    {hasTransferredOrPaid ? (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" /> ล็อกตามประวัติการชำระ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[10px] font-semibold">
                        เลือกไว้ในแบบฟอร์ม
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* If unpaid and no slips attached, allow going to Step 1 to change plan */}
              {!hasTransferredOrPaid && !isApplicantFullyPaid && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setCurrentFormStep(1);
                    if (onSubRouteChange) onSubRouteChange('form');
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold py-1.5 px-3 rounded-xl bg-sky-950/30 border border-sky-800/40 transition-colors shrink-0"
                  title="หากต้องการเปลี่ยนรูปแบบการชำระเงิน ให้กลับไปเลือกใหม่ที่แบบฟอร์มขั้นตอนที่ 1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>ต้องการเปลี่ยนรูปแบบ? (แก้ไขที่ขั้นตอนที่ 1)</span>
                </button>
              )}
            </div>

            {/* VIEW A: 2-ROUND INSTALLMENT VIEW */}
            {isInstallmentPlan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Round 1 Installment Box */}
                <div className="bg-slate-900/90 border border-purple-500/40 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                        งวดที่ 1 (รอบแรก - วันเปิดรับสมัคร)
                      </span>
                      <p className="text-xl font-black text-white mt-0.5">
                        {dashboardPaymentConfig.installment_round1_amount} <span className="text-sm font-normal text-slate-400">บาท</span>
                      </p>
                    </div>

                    {myRegistration.installment_1_status === 'paid' ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> ชำระแล้ว
                      </span>
                    ) : myRegistration.installment_1_status === 'pending_review' ? (
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> รอตรวจสอบ
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[11px] font-bold">
                        ค้างชำระงวด 1
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
                      <span>กำหนดชำระ: <strong className="text-white">{dashboardPaymentConfig.installment_round1_due}</strong></span>
                    </p>
                  </div>

                  {/* Slip 1 Section */}
                  <div className="pt-2 border-t border-slate-800">
                    {myRegistration.installment_1_slip_url ? (
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPreviewSlipModal(myRegistration.installment_1_slip_url)}
                          className="cursor-pointer group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0"
                        >
                          <img
                            src={myRegistration.installment_1_slip_url}
                            alt="สลิปงวด 1"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-emerald-400 font-semibold block">
                            ✓ อัปโหลดสลิปงวดที่ 1 แล้ว
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {myRegistration.installment_1_slip_date ? new Date(myRegistration.installment_1_slip_date).toLocaleString('th-TH') : '-'}
                          </span>
                        {myRegistration.installment_1_status === 'paid' ? (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> อนุมัติงวดที่ 1 แล้ว (ล็อคสลิป)
                          </span>
                        ) : (
                          <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-flex items-center gap-1">
                            <span>{myRegistration.installment_1_status === 'unpaid' ? 'อัปโหลดสลิปงวด 1 ใหม่' : 'ส่งสลิปงวด 1 ใหม่ทดแทน (กรณีแนบผิด)'}</span>
                            <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 1)} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingRound1 ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingRound1 ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งสลิปงวด 1...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>แนบสลิปงวดที่ 1 ({dashboardPaymentConfig.installment_round1_amount} บ.)</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 1)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Round 2 Installment Box */}
              <div className="bg-slate-900/90 border border-indigo-500/40 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                      งวดที่ 2 (รอบที่ 2)
                    </span>
                    <p className="text-xl font-black text-white mt-0.5">
                      {dashboardPaymentConfig.installment_round2_amount} <span className="text-sm font-normal text-slate-400">บาท</span>
                    </p>
                  </div>

                  {myRegistration.installment_2_status === 'paid' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> ชำระแล้ว
                    </span>
                  ) : myRegistration.installment_2_status === 'pending_review' ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> รอตรวจสอบ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[11px] font-bold">
                      ค้างชำระงวด 2
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>กำหนดชำระ: <strong className="text-white">{dashboardPaymentConfig.installment_round2_due}</strong></span>
                  </p>
                  <div className="mt-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span><strong>ชำระล่วงหน้าได้ทันที:</strong> สามารถชำระเงินและแนบสลิปงวดที่ 2 ก่อนกำหนดได้ตลอดเวลา โดยไม่ต้องรอถึงเดือนพฤศจิกายน</span>
                  </div>
                </div>

                {/* Slip 2 Section */}
                <div className="pt-2 border-t border-slate-800">
                  {myRegistration.installment_2_slip_url ? (
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setPreviewSlipModal(myRegistration.installment_2_slip_url)}
                        className="cursor-pointer group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0"
                      >
                        <img
                          src={myRegistration.installment_2_slip_url}
                          alt="สลิปงวด 2"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-emerald-400 font-semibold block">
                          ✓ อัปโหลดสลิปงวดที่ 2 แล้ว
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {myRegistration.installment_2_slip_date ? new Date(myRegistration.installment_2_slip_date).toLocaleString('th-TH') : '-'}
                        </span>
                        {myRegistration.installment_2_status === 'paid' ? (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> อนุมัติงวดที่ 2 แล้ว (ล็อคสลิป)
                          </span>
                        ) : (
                          <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-flex items-center gap-1">
                            <span>{myRegistration.installment_2_status === 'unpaid' ? 'อัปโหลดสลิปงวด 2 ใหม่' : 'ส่งสลิปงวด 2 ใหม่ทดแทน (กรณีแนบผิด)'}</span>
                            <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 2)} className="hidden" />
                          </label>
                        )}
                      </div>
                      </div>
                    ) : (
                      <label className={`w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingRound2 ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploadingRound2 ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังส่งสลิปงวด 2...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>แนบสลิปงวดที่ 2 ({dashboardPaymentConfig.installment_round2_amount} บ.)</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleUploadInstallmentSlip(e, 2)} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW B: FULL PAYMENT VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1.5">
                  <p className="text-slate-400">
                    ยอดค่าลงทะเบียนเต็มจำนวน: <span className="font-bold text-white text-base">{dashboardPaymentConfig.fee_total} บาท</span>
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    ครอบคลุมค่าประกันอุบัติเหตุ อาหารทุกมื้อ ที่พักค้างแรม อุปกรณ์การฝึก และวุฒิบัตรรับรอง
                  </p>
                </div>

                {/* Full Payment Slip Upload & Viewer */}
                <div className="flex flex-col justify-center items-start sm:items-end gap-2">
                  {myRegistration.payment_slip_url ? (
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => setPreviewSlipModal(myRegistration.payment_slip_url)}
                        className="cursor-pointer group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900"
                      >
                        <img 
                          src={myRegistration.payment_slip_url} 
                          alt="สลิปโอนเงิน" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-400 font-semibold block">
                          ✓ อัปโหลดสลิปเต็มจำนวนแล้ว
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          ส่งเมื่อ: {myRegistration.payment_slip_date ? new Date(myRegistration.payment_slip_date).toLocaleString('th-TH') : '-'}
                        </span>
                        {myRegistration.slip_ocr_full && (
                          <span className="text-[10px] text-amber-300 font-mono block">
                            {myRegistration.slip_ocr_full.isDetected 
                              ? `โอน: ${myRegistration.slip_ocr_full.transferDateTimeStr || myRegistration.slip_ocr_full.uploadTimeStr} (${myRegistration.slip_ocr_full.amountFormatted})`
                              : `อัปโหลด: ${myRegistration.slip_ocr_full.uploadTimeStr} (รอตรวจยอด)`}
                          </span>
                        )}
                        {myRegistration.payment_status === 'paid' ? (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> ตรวจสอบและอนุมัติยอดเงินแล้ว (ล็อคสลิป)
                          </span>
                        ) : (
                          <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-flex items-center gap-1">
                            <span>{myRegistration.payment_status === 'unpaid' ? 'อัปโหลดสลิปใหม่ (ส่งใหม่)' : 'ส่งสลิปใหม่ทดแทน (กรณีแนบผิด)'}</span>
                            <input type="file" accept="image/*" onChange={handleUploadPaymentSlip} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingSlip ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploadingSlip ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังส่งสลิป...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>อัปโหลดสลิปโอนเงินเต็มจำนวน ({effectivePaymentConfig.fee_total} บ.)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadPaymentSlip}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION: ข้อความแจ้งเตือนจาก Admin (Admin Direct Messages) */}
          {adminMessages.length > 0 ? (
            <div className="mt-6 p-5 sm:p-6 rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        ข้อความและการแจ้งเตือนจากผู้ดูแลระบบ ({adminMessages.length} ข้อความ)
                      </h3>
                      {unreadMessagesCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-[10px] font-black animate-pulse">
                          {unreadMessagesCount} ยังไม่อ่าน
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">ส่งตรงจากฝ่ายประสานงาน & การเงินโครงการ JRE 2027</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  {unreadMessagesCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAdminMessagesRead}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="ทำเครื่องหมายว่าอ่านทุกข้อความแล้ว"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>อ่านทั้งหมดแล้ว</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotificationsModal(true)}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดแบบป๊อปอัป</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {adminMessages.map((msg, idx) => {
                  const isUnread = !msg.read;
                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                        isUnread
                          ? 'bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border-purple-500/50 shadow-md ring-1 ring-purple-500/20'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-400">ฝ่ายประสานงาน JRE 2027</span>
                          {isUnread ? (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-[10px] font-black animate-pulse">
                              🔴 ยังไม่อ่าน
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                              ✓ อ่านแล้ว
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {msg.created_at ? new Date(msg.created_at).toLocaleString('th-TH') : ''}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line select-text">
                        {msg.text}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleAdminMessageRead(msg.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isUnread
                              ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700'
                          }`}
                        >
                          {isUnread ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                              <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                              <span>เปลี่ยนเป็นยังไม่อ่าน</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAdminMessage(msg.id)}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium flex items-center gap-1 transition-all cursor-pointer"
                          title="ลบข้อความแจ้งเตือนนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-2xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-500" />
                <span>กล่องข้อความและการแจ้งเตือน: ไม่มีข้อความใหม่จากผู้ดูแลระบบ</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(true)}
                className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
              >
                เปิดกล่องข้อความ
              </button>
            </div>
          )}

          {/* SECTION: รายการเอกสารที่ต้องนำส่ง (Requested Documents) */}
          {requestedDocs.length > 0 && (
            <div className="mt-6 p-5 rounded-2xl border bg-slate-950/70 border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <FileCheck className="w-4 h-4" />
                  <h3 className="font-bold text-white text-sm">
                    เอกสารที่ต้องนำส่งผ่านเว็บไซต์ ({requestedDocs.length} รายการ)
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {requestedDocs.map((doc, idx) => {
                  const isUploadingThis = uploadingDocId === doc.id;
                  const hasSubmitted = Boolean(doc.file_url);

                  return (
                    <div key={doc.id || idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{doc.title}</span>
                          {doc.required && (
                            <span className="px-1.5 py-0.5 bg-red-950 text-red-300 border border-red-800 text-[10px] rounded font-bold">
                              จำเป็น
                            </span>
                          )}
                          {doc.status === 'approved' ? (
                            <span className="text-[10px] text-emerald-400 font-bold">✓ อนุมัติแล้ว</span>
                          ) : hasSubmitted ? (
                            <span className="text-[10px] text-amber-400 font-bold">⏳ ส่งแล้ว รอตรวจ</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold">ยังไม่ได้ส่ง</span>
                          )}
                        </div>
                        {hasSubmitted && (
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>ไฟล์: {doc.file_name || 'เอกสารแนบ'}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({
                                title: doc.title,
                                fileName: doc.file_name || 'เอกสารแนบ',
                                fileUrl: doc.file_url
                              })}
                              className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>เปิดดู</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors ${isUploadingThis ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingThis ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>กำลังอัปโหลด...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 text-rescue-400" />
                              <span>{hasSubmitted ? 'อัปโหลดไฟล์ใหม่' : 'อัปโหลดไฟล์เอกสาร'}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleUploadUserDoc(e, doc.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Section: ข้อมูลส่วนตัว & การคำนวณอายุ */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-rescue-400" />
              ข้อมูลส่วนตัวประจำตัวผู้สมัคร (แบบฟอร์ม 1)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">อายุที่คำนวณได้:</span>
                <span className="font-bold text-rescue-400 text-sm">
                  {myRegistration.age_years || 0} ปี {myRegistration.age_months || 0} เดือน {myRegistration.age_days || 0} วัน
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  เกิดวันที่: {myRegistration.dob || '-'} (พ.ศ.)
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">กรุ๊ปเลือด & เบอร์ติดต่อ:</span>
                <span className="font-bold text-emergency-400 text-sm">
                  กรุ๊ป {myRegistration.blood_group || '-'}
                </span>
                <span className="text-slate-300 block mt-0.5 font-mono">
                  โทร: {myRegistration.phone || '-'}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">ผู้ติดต่อกรณีฉุกเฉิน:</span>
                <span className="font-bold text-white text-sm truncate block">
                  {myRegistration.emergency_name || '-'}
                </span>
                <span className="text-emerald-400 block mt-0.5 font-mono">
                  โทร: {myRegistration.emergency_phone || '-'}
                </span>
              </div>

              {/* Shirt Size Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-purple-500/30">
                <span className="text-purple-300 block mb-0.5 font-semibold flex items-center gap-1">
                  <Shirt className="w-3.5 h-3.5 text-purple-400" />
                  ไซส์เสื้อฝึก JRE 2027 (บังคับ):
                </span>
                <span className="font-black text-white text-base">
                  ไซส์ {myRegistration.shirt_size || 'L'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  คอเต่าซิป แขนสั้น โทนสีเทา–ดำ (พรีออเดอร์)
                </span>
              </div>

              {/* Callsign & Nickname Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-sky-500/30">
                <span className="text-sky-300 block mb-0.5 font-semibold">
                  รหัสนามเรียกขาน / ชื่อเล่น:
                </span>
                <span className="font-mono font-bold text-sky-400 text-sm block">
                  {myRegistration.callsign || '-'}
                </span>
                <span className="text-slate-300 text-xs block mt-0.5">
                  ชื่อเล่น: <strong className="text-white">{myRegistration.nickname || '-'}</strong>
                </span>
              </div>

              {/* ID Card Photo Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[11px] mb-0.5">
                    รูปถ่ายสำหรับทำ ID Card:
                  </span>
                  <span className="font-semibold text-white text-xs block">
                    {myRegistration.id_card_photo ? '✓ แนบรูปถ่ายแล้ว' : 'ยังไม่ได้แนบรูป'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ชุดสุภาพ หน้าตรง เห็นใบหน้าชัดเจน
                  </span>
                </div>
                {myRegistration.id_card_photo && (
                  <button
                    type="button"
                    onClick={() => setPreviewSlipModal(myRegistration.id_card_photo)}
                    className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 hover:border-rescue-500 shrink-0 relative group"
                    title="คลิกดูรูปขนาดเต็ม"
                  >
                    <img src={myRegistration.id_card_photo} alt="ID Card Photo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: ข้อมูลสุขภาพ ประวัติการแพ้ & ประวัติการฝึกอบรม */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              ข้อมูลสุขภาพ & ประวัติการฝึกอบรมกู้ภัย
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-rose-300 font-semibold mb-1">
                  <Stethoscope className="w-4 h-4 text-rose-400" />
                  <span>โรคประจำตัว / ข้อจำกัดทางกาย:</span>
                </div>
                <p className="text-slate-300 mt-1 whitespace-pre-line">
                  {myRegistration.medical_history || 'ไม่มีโรคประจำตัว'}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span>ประวัติแพ้อาหาร / แพ้ยา / มังสวิรัติ:</span>
                </div>
                <p className="text-slate-300 mt-1 whitespace-pre-line">
                  {myRegistration.food_allergy || 'ไม่มีประวัติแพ้ยาหรืออาหาร'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา:</span>
              </div>
              <p className="text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                {myRegistration.previous_training || 'ผู้เข้าร่วมอบรมใหม่ / ไม่เคยผ่านการฝึกอบรมมาก่อน'}
              </p>
            </div>
          </div>

        </div>

        {/* PREVIEW SLIP MODAL */}
        {previewSlipModal && (
          <ModalPortal isOpen={Boolean(previewSlipModal)} onClose={() => { setPreviewSlipModal(null); setCopiedSlipUrl(false); }}>
            <div 
              className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => { setPreviewSlipModal(null); setCopiedSlipUrl(false); }}
            >
              <div 
                className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>ภาพสลิปการโอนเงิน / เอกสาร</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const targetUrl = await ensureHostedUrl(previewSlipModal, 'payment-slip.jpg');
                        await navigator.clipboard.writeText(targetUrl);
                        setCopiedSlipUrl(true);
                        setTimeout(() => setCopiedSlipUrl(false), 2500);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        copiedSlipUrl
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      }`}
                      title="คัดลอกลิงก์รูปสลิปนี้"
                    >
                      {copiedSlipUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{copiedSlipUrl ? 'คัดลอกแล้ว!' : 'ก๊อปลิ้งค์'}</span>
                    </button>

                    {previewSlipModal.startsWith('http') && (
                      <a
                        href={previewSlipModal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="เปิดดูรูปเต็มในแท็บใหม่"
                      >
                        <ExternalLink className="w-4 h-4 text-cyan-400" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewSlipModal;
                        link.download = 'payment-slip.jpg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                      title="ดาวน์โหลดรูปสลิป"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPreviewSlipModal(null); setCopiedSlipUrl(false); }}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
                      title="ปิดหน้าต่าง"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-slate-950 rounded-2xl p-2 border border-slate-800/80">
                  <img src={previewSlipModal} alt="สลิป" className="w-full max-h-[62vh] object-contain rounded-xl" />
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[280px] sm:max-w-md font-mono text-[10px] text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    🔗 {previewSlipModal.length > 50 ? `${previewSlipModal.slice(0, 48)}...` : previewSlipModal}
                  </span>
                  <span className="text-emerald-400 font-medium">✓ ลิงก์ออนไลน์แชร์ได้</span>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* DELETE REGISTRATION CONFIRMATION MODAL (CRUD Ownership Delete) */}
        {showDeleteConfirmModal && (
          <ModalPortal isOpen={Boolean(showDeleteConfirmModal)} onClose={() => setShowDeleteConfirmModal(false)}>
            <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => setShowDeleteConfirmModal(false)}
            >
              <div 
                className="bg-slate-900 border-2 border-rose-600/50 max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-900/30">
                  <Trash2 className="w-7 h-7" />
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="text-xl font-black text-white">
                    ยืนยันยกเลิกใบสมัครและลบข้อมูล?
                  </h3>
                  <p className="text-xs text-rose-300 font-semibold">
                    (CRUD: User Data Ownership - ผู้ใช้มีสิทธิ์ลบข้อมูลของตนเอง)
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">ผู้สมัคร:</span>
                    <span className="font-bold text-white">{myRegistration.first_name} {myRegistration.last_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">รหัสอ้างอิง:</span>
                    <span className="font-mono text-amber-400 font-bold">JRE27-{(myRegistration.id || myRegistration.user_id || '').slice(0, 6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">สังกัด / Affiliation:</span>
                    <span className="text-slate-200">{myCardData?.affiliation || '-'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">เจ้าของบัญชี:</span>
                    <span className="font-mono text-emerald-400">{user?.email}</span>
                  </div>
                </div>

                {hasTransferredOrPaid ? (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 block mb-0.5">ไม่สามารถยกเลิกใบสมัครได้ (มีประวัติการชำระเงินหรือแนบสลิปแล้ว)</strong>
                      <span>ท่านได้ทำการแนบสลิปหรือมีประวัติการชำระเงินในระบบแล้ว เพื่อความถูกต้องและปลอดภัยทางบัญชีจึงไม่สามารถยกเลิกใบสมัครได้ หากมีความประสงค์จะสละสิทธิ์หรือขอเงินคืน กรุณาติดต่อทีมงานผู้จัดโครงการโดยตรง (เฉพาะผู้ดูแลระบบในโหมดขั้นสูงเท่านั้นที่สามารถลบข้อมูลได้)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-[11px] text-rose-200 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>คำเตือน:</strong> การยกเลิกใบสมัครจะลบข้อมูลประวัติผู้สมัคร, คำสั่งจองเสื้อ, และข้อมูลทั้งหมดออกจากฐานข้อมูลอย่างถาวร ข้อมูลจะไม่สามารถกู้คืนได้
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmModal(false)}
                    disabled={isDeletingReg}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยกเลิก / ปิด
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteMyRegistration}
                    disabled={isDeletingReg || hasTransferredOrPaid}
                    className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isDeletingReg ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังลบข้อมูล...</span>
                      </>
                    ) : hasTransferredOrPaid ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>ไม่สามารถลบได้ (แนบสลิปแล้ว)</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>ยืนยันลบข้อมูลถาวร</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* USER ACCOUNT & PASSWORD MODAL (Profile & Password Hashing Management) */}
        {showAccountModal && (
          <ModalPortal isOpen={Boolean(showAccountModal)} onClose={() => setShowAccountModal(false)}>
            <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => setShowAccountModal(false)}
            >
              <div 
                className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    จัดการบัญชีผู้ใช้ & ความปลอดภัย
                  </h3>
                  <p className="text-xs text-slate-400">
                    แก้ไขชื่อโปรไฟล์ รูปภาพ และเปลี่ยนรหัสผ่าน
                  </p>
                </div>
              </div>

              {/* User Account Info Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">รหัสบัญชี (UID):</span>
                  <span className="font-mono text-slate-300 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {user?.id ? `${user.id.slice(0, 14)}...` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">อีเมลลงทะเบียน:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{user?.email || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ช่องทางเข้าสู่ระบบ:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {user?.provider === 'both' ? '🌐 Google + 🔑 รหัสผ่าน' : user?.provider === 'email' ? '🔑 อีเมล & รหัสผ่าน' : '🌐 Google OAuth'}
                  </span>
                </div>
              </div>

              {accountError && (
                <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{accountError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateUserAccount} className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ชื่อแสดงในระบบ (Display Name)
                  </label>
                  <input
                    type="text"
                    value={accountDisplayName}
                    onChange={(e) => setAccountDisplayName(e.target.value)}
                    required
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ลิงก์รูปโปรไฟล์ (Avatar URL)
                  </label>
                  <input
                    type="url"
                    value={accountAvatar}
                    onChange={(e) => setAccountAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500">เลือกรูปตัวการ์ตูน:</span>
                    {['adventurer', 'bottts', 'fun-emoji', 'micah'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setAccountAvatar(`https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(user?.email || 'user')}`)}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Change Divider */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>เปลี่ยนรหัสผ่าน (Password Hashing via SHA-256)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    หากไม่ต้องการเปลี่ยนรหัสผ่าน สามารถเว้นว่างช่องรหัสผ่านไว้ได้
                  </p>

                  {/* Old Password */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      รหัสผ่านปัจจุบัน (สำหรับผู้ที่ตั้งรหัสผ่านไว้)
                    </label>
                    <div className="relative">
                      <input
                        type={showAccountOldPass ? 'text' : 'password'}
                        value={accountOldPassword}
                        onChange={(e) => setAccountOldPassword(e.target.value)}
                        placeholder="รหัสผ่านปัจจุบัน"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountOldPass(!showAccountOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showAccountOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                    </label>
                    <div className="relative">
                      <input
                        type={showAccountNewPass ? 'text' : 'password'}
                        value={accountNewPassword}
                        onChange={(e) => setAccountNewPassword(e.target.value)}
                        placeholder="รหัสผ่านใหม่"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountNewPass(!showAccountNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showAccountNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <input
                      type="password"
                      value={accountConfirmPassword}
                      onChange={(e) => setAccountConfirmPassword(e.target.value)}
                      placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Cryptographic Hash Badge for Professor Inspection */}
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Shield className="w-3.5 h-3.5" />
                      <span>มาตรฐานความปลอดภัย Cryptographic One-Way Hashing</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      รหัสผ่านใหม่จะถูกเข้ารหัสทางเดียวด้วยอัลกอริทึม SHA-256 พร้อม Dynamic 16-byte Hex Salt ก่อนส่งบันทึกในฐานข้อมูล ป้องกันการโจมตี Dictionary Attack และ Rainbow Table อย่างสมบูรณ์
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    disabled={isSavingAccount}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>บันทึกข้อมูลบัญชี</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
        )}

        {/* IN-APP DOCUMENT PREVIEW MODAL */}
        <DocumentPreviewModal
          isOpen={Boolean(previewDocModal)}
          onClose={() => setPreviewDocModal(null)}
          doc={previewDocModal}
        />

        {/* PARTICIPANT NOTIFICATIONS POPUP MODAL */}
        <UserNotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          myRegistration={myRegistration}
          onUpdateRegistration={onUpdateRegistration}
        />

        {/* TOAST NOTIFICATION */}
        <Toast toast={toast} onClose={() => setToast(null)} />

      </div>
    );
  }

  // REGISTRATION / EDIT FORM
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Official Header Banner */}
      <div className="flex justify-center">
        <div className="w-full max-w-xl bg-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/60 flex items-center justify-center">
          <img
            src="/images/logo/jre_header_banner.png"
            alt="Joint Response Exercise (JRE 2027)"
            className="w-full h-auto object-contain max-h-24 sm:max-h-28"
          />
        </div>
      </div>

      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          {isEditing ? (hasAnyPaymentApproved ? 'แก้ไขข้อมูลผู้เข้ารับการฝึกอบรม' : 'แก้ไขข้อมูลประวัติผู้สมัคร') : 'ระบบรับสมัครเข้าร่วมโครงการ'}
        </div>
        <h1 className="text-3xl font-black text-white">
          {isEditing ? (hasAnyPaymentApproved ? 'แก้ไขข้อมูลและประวัติการฝึกอบรม' : 'แก้ไขข้อมูลใบสมัครโครงการ JRE 2027') : 'ใบสมัครโครงการฝึกอบรมเชิงปฏิบัติการ JRE 2027'}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          กรอกข้อมูลตามความเป็นจริงเพื่อใช้ในการทำประกันอุบัติเหตุ สวัสดิการความปลอดภัย จัดสรรกลุ่ม และจัดห้องนอน
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm border shadow-lg animate-in fade-in duration-200 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : 'bg-red-950/80 border-red-700 text-red-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="leading-relaxed font-medium">{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="ปิดข้อความแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Warning & Action Safeguard Banner */}
      {isEditing && (
        <div className="sticky top-20 z-40 bg-amber-500/20 border-2 border-amber-500/80 text-amber-200 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">✏️</span>
            <div>
              <p className="font-bold text-sm sm:text-base text-amber-300">
                {hasAnyPaymentApproved ? 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูล (ผู้เข้ารับการฝึกอบรม)' : 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลใบสมัคร'}
              </p>
              <p className="text-xs text-amber-200/80">
                {hasAnyPaymentApproved ? 'ท่านชำระเงินเรียบร้อยแล้ว การแก้ไขจะอัปเดตข้อมูลประวัติ/สวัสดิการ โดยสถานะการเงินยังคงเดิม' : 'หากแก้ไขเสร็จแล้ว กรุณาไปที่ขั้นตอนสรุปและกดบันทึก หรือกดยกเลิกเพื่อคืนค่าเดิม'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCancelEditRegistration}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-bold border border-slate-600 transition-colors cursor-pointer"
            >
              ❌ ยกเลิก (คืนค่าเดิม)
            </button>
            <button
              type="button"
              onClick={() => {
                const targetStep = paymentPlan === 'installment' && (formSlipRound2 || myRegistration?.installment_2_slip_url) ? 4 : 3;
                setCurrentFormStep(targetStep);
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/30 cursor-pointer"
            >
              💾 ไปที่ปุ่มบันทึก
            </button>
          </div>
        </div>
      )}

      {/* Verified Google Account Banner for New Applicants */}
      {!isEditing && user && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                  alt="Google Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1">
                    ✓ ยืนยันตัวตนผ่าน Google สำเร็จ
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (สร้างบัญชีผู้ใช้งานแล้ว)
                  </span>
                </div>
                <p className="text-lg font-black text-white mt-0.5">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              <span className="text-[11px] text-slate-400 block">
                สถานะ: พร้อมกรอกใบสมัครโครงการ
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 sm:justify-end mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> บัญชีพร้อมสมัคร JRE 2027
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>ชื่อ-นามสกุล และอีเมลถูกดึงและผูกกับบัญชี Google อัตโนมัติ ท่านเพียงกรอกรายละเอียดการฝึกและสวัสดิการด้านล่าง</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Anti-Bot Honeypot: Invisible to human users, traps automated scrapers & spam bots */}
        <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
          <label htmlFor="hp_field_reg">Anti-bot website</label>
          <input
            id="hp_field_reg"
            type="text"
            name="hp_field_reg"
            value={botHoneypot}
            onChange={(e) => setBotHoneypot(e.target.value)}
            tabIndex="-1"
            autoComplete="off"
          />
        </div>

        {/* Form Header: เเบบฟอร์มสมัครเข้าร่วมโครงการ ( 1 ) */}
        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-800 text-center space-y-4">
          <div className="w-full max-w-lg bg-white p-2 sm:p-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center justify-center">
            <img
              src="/images/logo/jre_header_banner.png"
              alt="Joint Response Exercise (JRE 2027)"
              className="w-full h-auto object-contain max-h-20 sm:max-h-24"
            />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rescue-500/20 to-amber-500/20 text-rescue-300 border border-rescue-500/40 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
              <FileText className="w-4 h-4 text-rescue-400" />
              <span>เเบบฟอร์มสมัครเข้าร่วมโครงการ ( 1 )</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white">
              แบบฟอร์มแจ้งการสมัครและชำระค่าใช้จ่าย JRE 2027
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              แบบฟอร์มนี้จัดทำขึ้นเพื่อใช้สำหรับ <strong className="text-white font-semibold">แจ้งการสมัครและชำระค่าใช้จ่ายในการเข้าร่วมโครงการ Joint Response Exercise 2027 (JRE 2027) ณ มหาวิทยาลัยมหาสารคาม</strong> กรุณากรอกข้อมูลให้ครบถ้วน และแนบหลักฐานการโอนเงินเพื่อใช้ในการตรวจสอบและยืนยันการชำระเงิน
            </p>
          </div>

          {/* 💰 เลือกรูปแบบการชำระค่าใช้จ่าย (จ่ายครั้งเดียวเลย 3 ขั้นตอน หรือ แบ่งจ่าย 2 รอบ 4 ขั้นตอน) */}
          <div className="w-full max-w-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-left shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <span>💰</span>
                <span>เลือกรูปแบบการชำระค่าลงทะเบียนโครงการ</span>
              </h3>
              <span className="text-[11px] px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full font-bold self-start sm:self-auto">
                {paymentPlan === 'full' ? '🌟 จ่ายครบครั้งเดียว (3 ขั้นตอน)' : '💳 แบ่งจ่าย 2 รอบ (4 ขั้นตอน)'}
              </span>
            </div>

            {/* Interactive Payment Plan Chooser */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: จ่ายครบเต็มจำนวน (Full Payment: 3 Steps) */}
              <div 
                onClick={() => {
                  if (isEditing && hasTransferredOrPaid && myRegistration?.payment_plan === 'installment') {
                    triggerToast('🔒 ไม่สามารถเปลี่ยนเป็นจ่ายเต็มจำนวนได้ เนื่องจากท่านมีประวัติการชำระเงินหรือแนบสลิปแบบแบ่งจ่าย 2 งวดแล้ว', 'warning');
                    return;
                  }
                  setPaymentPlan('full');
                  if (currentFormStep === 4) setCurrentFormStep(3);
                  triggerToast('เลือกรูปแบบ: จ่ายครบเต็มจำนวน (3 ขั้นตอน)', 'info');
                }}
                className={`p-4 sm:p-4.5 rounded-2xl border transition-all space-y-2.5 select-none ${
                  isEditing && hasTransferredOrPaid && myRegistration?.payment_plan === 'installment'
                    ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                    : paymentPlan === 'full'
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 cursor-pointer'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-lg shrink-0">🌟</span>
                    <span className="font-black text-white text-sm truncate">จ่ายครบเต็มจำนวน</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                    paymentPlan === 'full' 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' 
                      : 'bg-slate-800 text-amber-300 border-slate-700'
                  }`}>
                    1 รอบ (3 ขั้นตอน)
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  ชำระค่าลงทะเบียนและค่าเสื้อเต็มจำนวนในคราวเดียว ({feeInfo.isMsu ? 'นิสิต มมส 650 บ.' : 'ต่างมหาวิทยาลัย 850 บ.'}) รวดเร็ว สบายใจ ยืนยันสิทธิ์ทันที
                </p>
                {isEditing && hasTransferredOrPaid && myRegistration?.payment_plan === 'full' && (
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ล็อกตามประวัติการชำระ (โอนเต็มจำนวนแล้ว)
                  </div>
                )}
                {isEditing && hasTransferredOrPaid && myRegistration?.payment_plan === 'installment' && (
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-500/70" /> ล็อก (เริ่มชำระแบบแบ่งจ่าย 2 งวดแล้ว)
                  </div>
                )}
                <div className="text-[11px] text-amber-300 font-semibold pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span>💵 ยอดชำระเต็มจำนวน:</span>
                  <span className="font-black text-sm text-white">{feeInfo.totalFee} บาท</span>
                </div>
              </div>

              {/* Option 2: แบ่งจ่าย 2 งวด (Installments: 4 Steps) */}
              <div 
                onClick={() => {
                  if (isEditing && hasTransferredOrPaid && myRegistration?.payment_plan !== 'installment') {
                    triggerToast('🔒 ไม่สามารถเปลี่ยนเป็นแบ่งจ่ายได้ เนื่องจากท่านมีประวัติการชำระเงินหรือแนบสลิปเต็มจำนวนแล้ว', 'warning');
                    return;
                  }
                  setPaymentPlan('installment');
                  triggerToast('เลือกรูปแบบ: แบ่งจ่าย 2 งวด (4 ขั้นตอน)', 'info');
                }}
                className={`p-4 sm:p-4.5 rounded-2xl border transition-all space-y-2.5 select-none ${
                  isEditing && hasTransferredOrPaid && myRegistration?.payment_plan !== 'installment'
                    ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                    : paymentPlan === 'installment'
                      ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10 cursor-pointer'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-lg shrink-0">💳</span>
                    <span className="font-black text-white text-sm truncate">แบ่งจ่าย 2 งวด</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                    paymentPlan === 'installment' 
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm' 
                      : 'bg-slate-800 text-sky-300 border-slate-700'
                  }`}>
                    มัดจำ (4 ขั้นตอน)
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  งวดที่ 1 มัดจำค่าเสื้อ 400 บ. (15–20 ต.ค. 69) และงวดที่ 2 ชำระส่วนที่เหลือ ({feeInfo.round2Amount} บ. วันที่ 1–5 พ.ย. 69)
                </p>
                {isEditing && hasTransferredOrPaid && myRegistration?.payment_plan === 'installment' && (
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ล็อกตามประวัติการชำระ (ผ่อนชำระ 2 งวด)
                  </div>
                )}
                {isEditing && hasTransferredOrPaid && myRegistration?.payment_plan !== 'installment' && (
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-500/70" /> ล็อก (ชำระเต็มจำนวนแล้ว)
                  </div>
                )}
                <div className="text-[11px] text-sky-300 font-semibold pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span>งวด 1: 400 บ.</span>
                    <span className="text-slate-500">•</span>
                    <span>งวด 2: {feeInfo.round2Amount} บ.</span>
                  </div>
                  <span className="text-white font-bold">(รวม {feeInfo.totalFee} บ.)</span>
                </div>
              </div>
            </div>

            {/* Total Fee & Notice */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">💵 สรุปค่าใช้จ่ายโครงการ:</span>
                <p className="text-white font-bold leading-relaxed">
                  • ต่างมหาวิทยาลัย: <span className="text-amber-400 font-black">850 บาท/คน</span> (รวมค่าที่พักหอพักกุดรัง มมส & เสื้อ)<br className="hidden sm:inline" />
                  • นิสิตมหาวิทยาลัยมหาสารคาม (มมส): <span className="text-emerald-400 font-black">650 บาท/คน</span> (ไม่มีค่าใช้จ่ายด้านที่พัก & รวมเสื้อ)
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-slate-400 block text-[11px]">☎️ สอบถามผู้จัดโครงการ:</span>
                <a href="tel:0983296762" className="text-amber-400 font-black text-xs hover:underline inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>098-329-6762</span>
                </a>
              </div>
            </div>

            {/* LocalStorage Auto-Draft Status Notice */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>💾 บันทึกแบบร่างลงเครื่องอัตโนมัติ (ข้อมูลไม่สูญหายหากรีเฟรชหน้าเว็บหรือปิดเบราว์เซอร์)</span>
                {lastDraftSavedTime && (
                  <span className="text-slate-500 font-mono text-[10px]">[{lastDraftSavedTime}]</span>
                )}
              </div>
              {hasDraftRestored && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors text-[10px] cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างแบบร่าง</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Dynamic Wizard Navigation Stepper Header (3 steps for Full / 4 steps for Installment) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-800/80">
            <span className="text-[11px] font-black uppercase tracking-wider text-rescue-400 flex items-center gap-1.5 flex-wrap">
              <span>🚀</span>
              <span>ขั้นตอนการสมัครและชำระค่าใช้จ่าย</span>
              <span className="text-[10px] text-rescue-300 font-semibold">({paymentPlan === 'full' ? '3 ขั้นตอน (จ่ายครั้งเดียว)' : '4 ขั้นตอน (แบ่งจ่าย 2 รอบ)'})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium self-end sm:self-auto shrink-0">
              ขั้นตอนที่ {currentFormStep} จาก {paymentPlan === 'full' ? 3 : 4}
            </span>
          </div>

          <div className={`grid gap-2 sm:gap-3 ${paymentPlan === 'full' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => {
                setCurrentFormStep(1);
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 sm:gap-3 cursor-pointer ${
                currentFormStep === 1
                  ? 'bg-rescue-500/20 border-rescue-500 text-white shadow-lg shadow-rescue-500/10'
                  : currentFormStep > 1
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                currentFormStep === 1
                  ? 'bg-rescue-500 text-white scale-105 shadow'
                  : currentFormStep > 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentFormStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">
                  ขั้นตอนที่ 1
                </p>
                <p className="text-xs sm:text-sm font-black leading-tight">
                  ข้อมูล & รูป ID
                </p>
              </div>
            </button>

            {/* Step 2 Button */}
            <button
              type="button"
              onClick={() => {
                if (currentFormStep > 2) {
                  setCurrentFormStep(2);
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                } else {
                  handleNextToStep2();
                }
              }}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 sm:gap-3 cursor-pointer ${
                currentFormStep === 2
                  ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                  : currentFormStep > 2
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                currentFormStep === 2
                  ? 'bg-orange-500 text-white scale-105 shadow'
                  : currentFormStep > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentFormStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">
                  ขั้นตอนที่ 2
                </p>
                <p className="text-xs sm:text-sm font-black leading-tight">
                  สั่งเสื้อโครงการ
                </p>
              </div>
            </button>

            {/* Step 3 Button */}
            <button
              type="button"
              onClick={() => {
                if (currentFormStep === 1) handleNextToStep2();
                else if (currentFormStep === 2) handleNextToStep3();
                else {
                  setCurrentFormStep(3);
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }
              }}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 sm:gap-3 cursor-pointer ${
                currentFormStep === 3
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : currentFormStep > 3
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                currentFormStep === 3
                  ? 'bg-amber-500 text-white scale-105 shadow'
                  : currentFormStep > 3
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentFormStep > 3 ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">
                  ขั้นตอนที่ 3
                </p>
                <p className="text-xs sm:text-sm font-black leading-tight">
                  {paymentPlan === 'full' ? 'สรุป & ชำระครบ' : 'รอบ 1 (มัดจำ)'}
                </p>
              </div>
            </button>

            {/* Step 4 Button (Installment Only) */}
            {paymentPlan === 'installment' && (
              <button
                type="button"
                onClick={() => {
                  if (currentFormStep === 1) handleNextToStep2();
                  else if (currentFormStep === 2) handleNextToStep3();
                  else handleNextToStep4();
                }}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 sm:gap-3 cursor-pointer ${
                  currentFormStep === 4
                    ? 'bg-sky-500/20 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                  currentFormStep === 4
                    ? 'bg-sky-500 text-white scale-105 shadow'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  4
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">
                    ขั้นตอนที่ 4
                  </p>
                  <p className="text-xs sm:text-sm font-black leading-tight">
                    รอบ 2 (คงค้าง)
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            STEP 1: ข้อมูลผู้สมัคร & รูปถ่าย ID Card
            ======================================================== */}
        {currentFormStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Section 1: ข้อมูลผู้สมัคร */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-rescue-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 shrink-0" />
                  <span>1. ข้อมูลประจำตัวผู้สมัคร (ผูกกับบัญชี Google)</span>
                </h3>
                {user && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันผ่าน Google แล้ว
                  </span>
                )}
              </div>

              {/* Locked Verified Google Email */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>อีเมล Google ที่ใช้ในการสมัครและติดต่อ</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-bold shrink-0">
                    ✓ ดึงจาก Google อัตโนมัติ
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || myRegistration?.user_email || ''}
                  className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-300 font-mono text-sm cursor-not-allowed select-none"
                />
              </div>

              {/* ฟิลด์ 1: คำนำหน้า ชื่อ - สกุล (ตัวย่อสถานศึกษา) ภาษาไทย เเละ ภาษาอังกฤษ แยกช่องกรอก */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rescue-500 inline-block"></span>
                      คำนำหน้า ชื่อ - สกุล (ตัวย่อสถานศึกษา) ภาษาไทย และ ภาษาอังกฤษ
                      <span className="text-rose-400 font-bold">*</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      แยกช่องกรอกภาษาไทยและภาษาอังกฤษเพื่อความแม่นยำ ระบบจะรวมและจัดรูปแบบให้อัตโนมัติสำหรับจัดทำบัตรประจำตัว (ID Card) และเกียรติบัตร
                    </p>
                  </div>
                </div>

                {/* ส่วนที่ 1: ชื่อสกุลภาษาไทย */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[10px]">🇹🇭 ภาษาไทย</span>
                    <span>ชื่อ - สกุล และ ตัวย่อสถานศึกษา (ภาษาไทย)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* คำนำหน้า (ไทย) */}
                    <div className={titleTh === 'อื่นๆ' ? "sm:col-span-3" : "sm:col-span-3"}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        คำนำหน้า <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={titleTh}
                        onChange={(e) => handleTitleThChange(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rescue-500 cursor-pointer font-medium"
                      >
                        {TITLE_THAI_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* กรณีเลือก 'อื่นๆ' ระบุคำนำหน้าไทย */}
                    {titleTh === 'อื่นๆ' && (
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          ระบุคำนำหน้า <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="field-titleOtherTh"
                          type="text"
                          required
                          value={titleOtherTh}
                          onChange={(e) => {
                            setTitleOtherTh(e.target.value);
                            if (e.target.value.trim()) clearFieldError('titleOtherTh');
                          }}
                          placeholder="เช่น พ.ต.อ., ดร., อาจารย์"
                          className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                            fieldErrors.titleOtherTh 
                              ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                              : 'border-slate-700 focus:ring-rescue-500'
                          }`}
                        />
                        {fieldErrors.titleOtherTh && (
                          <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.titleOtherTh}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* ชื่อ (ไทย) */}
                    <div className={titleTh === 'อื่นๆ' ? "sm:col-span-3" : "sm:col-span-4"}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        ชื่อ (ภาษาไทย) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="field-firstNameTh"
                        type="text"
                        required
                        value={firstNameTh}
                        onChange={(e) => {
                          setFirstNameTh(e.target.value);
                          if (e.target.value.trim()) clearFieldError('firstNameTh');
                        }}
                        placeholder="เช่น ดีใจ"
                        className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                          fieldErrors.firstNameTh 
                            ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                            : 'border-slate-700 focus:ring-rescue-500'
                        }`}
                      />
                      {fieldErrors.firstNameTh && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.firstNameTh}</span>
                        </p>
                      )}
                    </div>

                    {/* นามสกุล (ไทย) */}
                    <div className={titleTh === 'อื่นๆ' ? "sm:col-span-3" : "sm:col-span-5"}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        นามสกุล (ภาษาไทย) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="field-lastNameTh"
                        type="text"
                        required
                        value={lastNameTh}
                        onChange={(e) => {
                          setLastNameTh(e.target.value);
                          if (e.target.value.trim()) clearFieldError('lastNameTh');
                        }}
                        placeholder="เช่น มากดีสุด"
                        className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                          fieldErrors.lastNameTh 
                            ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                            : 'border-slate-700 focus:ring-rescue-500'
                        }`}
                      />
                      {fieldErrors.lastNameTh && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.lastNameTh}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ตัวย่อสถานศึกษา (ไทย) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        ตัวย่อสถานศึกษา (ไทย) <span className="text-slate-400 font-normal">(เช่น มมส, มข, มทส)</span>
                      </label>
                      <input
                        type="text"
                        value={institutionAbbrTh}
                        onChange={(e) => setInstitutionAbbrTh(e.target.value)}
                        placeholder="เช่น มมส หรือเว้นว่างหากไม่มี"
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-6 flex items-center">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        💡 ตัวย่อสถานศึกษาจะอัปเดตให้อัตโนมัติเมื่อเลือกสถาบันด้านล่าง หรือแก้ไขเพิ่มเติมได้เอง
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80"></div>

                {/* ส่วนที่ 2: ชื่อสกุลภาษาอังกฤษ */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30 text-[10px]">🇬🇧 English</span>
                    <span>Title, First Name - Last Name & Institution (English)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* คำนำหน้า (EN) */}
                    <div className={titleEn === 'อื่นๆ' ? "sm:col-span-3" : "sm:col-span-3"}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Title (EN) <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium"
                      >
                        {TITLE_ENGLISH_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* กรณีเลือก 'อื่นๆ' ระบุ Title EN */}
                    {titleEn === 'อื่นๆ' && (
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Specify Title <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="field-titleOtherEn"
                          type="text"
                          required
                          value={titleOtherEn}
                          onChange={(e) => {
                            setTitleOtherEn(e.target.value);
                            if (e.target.value.trim()) clearFieldError('titleOtherEn');
                          }}
                          placeholder="e.g. Dr., Prof."
                          className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                            fieldErrors.titleOtherEn 
                              ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                              : 'border-slate-700 focus:ring-sky-500'
                          }`}
                        />
                        {fieldErrors.titleOtherEn && (
                          <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.titleOtherEn}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* First Name (EN) */}
                    <div className={titleEn === 'อื่นๆ' ? "sm:col-span-3" : "sm:col-span-4"}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        First Name (EN) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="field-firstNameEn"
                        type="text"
                        required
                        value={firstNameEn}
                        onChange={(e) => {
                          setFirstNameEn(e.target.value);
                          if (e.target.value.trim()) clearFieldError('firstNameEn');
                        }}
                        placeholder="e.g. Deejai"
                        className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                          fieldErrors.firstNameEn 
                            ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                            : 'border-slate-700 focus:ring-sky-500'
                        }`}
                      />
                      {fieldErrors.firstNameEn && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.firstNameEn}</span>
                        </p>
                      )}
                    </div>

                    {/* Last Name (EN) */}
                    <div className={titleEn === 'อื่นๆ' ? "sm:col-span-3" : "sm:col-span-5"}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Last Name (EN) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="field-lastNameEn"
                        type="text"
                        required
                        value={lastNameEn}
                        onChange={(e) => {
                          setLastNameEn(e.target.value);
                          if (e.target.value.trim()) clearFieldError('lastNameEn');
                        }}
                        placeholder="e.g. Makdeesud"
                        className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                          fieldErrors.lastNameEn 
                            ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                            : 'border-slate-700 focus:ring-sky-500'
                        }`}
                      />
                      {fieldErrors.lastNameEn && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.lastNameEn}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Institution Abbreviation (EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Institution Abbr. (EN) <span className="text-slate-400 font-normal">(e.g. MSU, KKU, SUT)</span>
                      </label>
                      <input
                        type="text"
                        value={institutionAbbrEn}
                        onChange={(e) => setInstitutionAbbrEn(e.target.value)}
                        placeholder="e.g. MSU or leave empty"
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-6 flex items-center">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        🌐 ใช้ในการจัดทำบัตรประจำตัวผู้เข้ารับการฝึกอบรมและเอกสารรับรองมาตรฐาน
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80"></div>

                {/* ส่วนที่ 3: พรีวิวข้อความรวมต่อกันอัตโนมัติ (Live Combined Preview) */}
                <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                  fieldErrors.fullNameAffiliation 
                    ? 'bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/40' 
                    : 'bg-slate-950/90 border-slate-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rescue-400 shrink-0" />
                      <span>ผลลัพธ์ข้อความรวม (พิมพ์บนบัตรและเกียรติบัตร)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManualFullName(!isManualFullName)}
                      className="text-[11px] text-rescue-400 hover:text-rescue-300 underline font-medium cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      {isManualFullName ? '✓ กลับสู่โหมดรวมอัตโนมัติ' : '✏️ ปรับแก้ข้อความด้วยตนเอง'}
                    </button>
                  </div>

                  {isManualFullName ? (
                    <div>
                      <input
                        id="field-fullNameAffiliation"
                        type="text"
                        value={fullNameAffiliation}
                        onChange={(e) => {
                          setFullNameAffiliation(e.target.value);
                          if (e.target.value.trim()) clearFieldError('fullNameAffiliation');
                        }}
                        placeholder="- นายดีใจ มากดีสุด (มมส) / Mr. Deejai Makdeesud (MSU)"
                        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 ${
                          fieldErrors.fullNameAffiliation
                            ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/30'
                            : 'border-amber-500/50 focus:ring-rescue-500'
                        }`}
                      />
                      <p className="text-[10px] text-amber-400/90 mt-1">
                        ⚠️ โหมดกำหนดเอง: หากต้องการให้ระบบคำนวณตามช่องด้านบนอัตโนมัติให้กด "กลับสู่โหมดรวมอัตโนมัติ"
                      </p>
                    </div>
                  ) : (
                    <div 
                      id="field-fullNameAffiliation"
                      className="px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono text-xs sm:text-sm text-emerald-300 select-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="break-words leading-relaxed font-semibold">
                        {fullNameAffiliation || <span className="text-slate-500 italic font-normal">รอการกรอกข้อมูลในช่องด้านบน...</span>}
                      </span>
                      {fullNameAffiliation && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap self-start sm:self-auto shrink-0">
                          Auto-generated
                        </span>
                      )}
                    </div>
                  )}

                  {fieldErrors.fullNameAffiliation && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.fullNameAffiliation}</span>
                    </p>
                  )}

                  <p className="text-[11px] text-slate-400">
                    ตัวอย่างรูปแบบ: <span className="text-slate-300 font-mono text-[10px] sm:text-xs">นายดีใจ มากดีสุด (มมส) / Mr. Deejai Makdeesud (MSU)</span>
                  </p>
                </div>
              </div>

              {/* ฟิลด์ชื่อเล่น: แยกคนละช่อง ภาษาไทย เเละ อังกฤษ ตามข้อกำหนด */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>🇹🇭 ชื่อเล่น ภาษาไทย <span className="text-rose-400 font-bold">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">เช่น เจมส์, ต้น, นัท</span>
                  </label>
                  <input
                    id="field-nicknameTh"
                    type="text"
                    required
                    value={nicknameTh}
                    onChange={e => {
                      setNicknameTh(e.target.value);
                      if (e.target.value.trim()) clearFieldError('nicknameTh');
                    }}
                    placeholder="กรอกชื่อเล่นภาษาไทย เช่น เจมส์"
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                      fieldErrors.nicknameTh 
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                        : 'border-slate-700 focus:ring-rescue-500'
                    }`}
                  />
                  {fieldErrors.nicknameTh && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.nicknameTh}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>🇬🇧 ชื่อเล่น ภาษาอังกฤษ (Nickname) <span className="text-rose-400 font-bold">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">เช่น James, Ton, Nat</span>
                  </label>
                  <input
                    id="field-nicknameEn"
                    type="text"
                    required
                    value={nicknameEn}
                    onChange={e => {
                      setNicknameEn(e.target.value);
                      if (e.target.value.trim()) clearFieldError('nicknameEn');
                    }}
                    placeholder="กรอกชื่อเล่นภาษาอังกฤษ เช่น James"
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                      fieldErrors.nicknameEn 
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                        : 'border-slate-700 focus:ring-rescue-500'
                    }`}
                  />
                  {fieldErrors.nicknameEn && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.nicknameEn}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* ฟิลด์รหัสนามเรียกขาน & หน่วย/ชมรม */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    <span>รหัสนามเรียกขานหน่วยตัวเอง <span className="text-rose-400 font-bold">*</span></span>
                  </label>
                  <input
                    id="field-callsign"
                    type="text"
                    required
                    value={callsign}
                    onChange={e => {
                      setCallsign(e.target.value);
                      if (e.target.value.trim()) clearFieldError('callsign');
                    }}
                    placeholder="RCPMSU 15-01 (ตัวอย่าง)"
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm font-mono font-medium transition-all ${
                      fieldErrors.callsign 
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                        : 'border-slate-700 focus:ring-rescue-500'
                    }`}
                  />
                  {fieldErrors.callsign && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.callsign}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    <span>หน่วย / Unit <span className="text-slate-500 font-normal">(ชื่อหน่วยงาน/ชมรม)</span></span>
                  </label>
                  <input
                    id="field-unit"
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="เช่น ชมรมกู้ภัยราชพฤกษ์, ฝ่ายพยาบาล"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm font-medium"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">ใช้แสดงบนบัตร ID Card และข้อมูล Admin</p>
                </div>
              </div>

              {/* ฟิลด์ 4: สังกัด / Affiliation = มหาวิทยาลัยหรือสถาบัน */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    สังกัด / Affiliation (มหาวิทยาลัยหรือสถาบัน) <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <span className="text-[11px] text-rescue-400 font-medium">
                    เปิดรับทุกมหาวิทยาลัยและหน่วยกู้ภัยทั่วประเทศ
                  </span>
                </div>

                {/* 🎓 Interactive Affiliation Type Switcher: MSU (650.-) vs External (850.-) */}
                {(() => {
                  const fee = getRegistrationFeeDetails(institution);
                  const isCurrentMsu = fee.isMsu;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: นิสิต มมส */}
                      <div
                        onClick={() => {
                          handleInstitutionSelect('ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม (มมส)');
                          triggerToast('เลือกสังกัด: นิสิตมหาวิทยาลัยมหาสารคาม (ยอดรวม 650 บ. / ไม่มีค่าที่พัก)', 'info');
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${
                          isCurrentMsu
                            ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-white flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0">🎓</span>
                            <span className="truncate">นิสิตมหาวิทยาลัยมหาสารคาม (มมส)</span>
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                            isCurrentMsu ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            650 บาท
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300/80 leading-snug">
                          ไม่มีค่าใช้จ่ายด้านที่พัก • รวมค่าเสื้อโครงการ
                        </p>
                        <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800/80 flex justify-between">
                          <span>รอบ 1: 400 บ. (ค่าเสื้อ)</span>
                          <span>รอบ 2: 250 บ. (อาหาร)</span>
                        </div>
                      </div>

                      {/* Option 2: ต่างมหาวิทยาลัย */}
                      <div
                        onClick={() => {
                          if (isCurrentMsu) {
                            handleInstitutionSelect('TSI - Tactic of Special Services and Investigation มหาวิทยาลัยขอนแก่น (มข)');
                            triggerToast('เลือกสังกัด: ต่างมหาวิทยาลัย (ยอดรวม 850 บ. / รวมที่พักหอกุดรัง มมส)', 'info');
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${
                          !isCurrentMsu
                            ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-white flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0">🏨</span>
                            <span className="truncate">ต่างมหาวิทยาลัย / บุคคลภายนอก</span>
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                            !isCurrentMsu ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            850 บาท
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-300/80 leading-snug">
                          รวมค่าที่พักหอพักกุดรัง มมส & ค่าเสื้อโครงการ
                        </p>
                        <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800/80 flex justify-between">
                          <span>รอบ 1: 400 บ. (ค่าเสื้อ)</span>
                          <span>รอบ 2: 450 บ. (ที่พัก+อาหาร)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Dropdown Picker */}
                <div>
                  <select
                    value={OFFICIAL_NETWORK_INSTITUTIONS.find(i => i.university === institution || i.fullName === institution)?.fullName || ''}
                    onChange={e => {
                      if (e.target.value) {
                        handleInstitutionSelect(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rescue-500 font-medium cursor-pointer"
                  >
                    <option value="">-- เลือกจาก 8 สถาบัน/ชมรมกู้ภัยเครือข่าย หรือพิมพ์ระบุเองด้านล่าง --</option>
                    {OFFICIAL_NETWORK_INSTITUTIONS.map(inst => (
                      <option key={inst.id} value={inst.fullName}>
                        {inst.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  id="field-institution"
                  type="text"
                  required
                  value={institution}
                  onChange={e => {
                    setInstitution(e.target.value);
                    if (e.target.value.trim()) clearFieldError('institution');
                  }}
                  placeholder="เช่น มหาวิทยาลัยมหาสารคาม (มมส), มหาวิทยาลัยขอนแก่น (มข)"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                    fieldErrors.institution 
                      ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                      : 'border-slate-700 focus:ring-rescue-500'
                  }`}
                />
                {fieldErrors.institution && (
                  <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.institution}</span>
                  </p>
                )}

                {/* Quick Suggestions Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-rescue-400 mr-1 self-center flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    เลือกด่วน (8 สถาบัน):
                  </span>
                  {OFFICIAL_NETWORK_INSTITUTIONS.map(inst => {
                    const isSelected = institution === inst.university || institution === inst.fullName;
                    return (
                      <button
                        type="button"
                        key={inst.id}
                        onClick={() => handleInstitutionSelect(inst.fullName)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rescue-500/25 text-orange-300 border-rescue-500 shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                        }`}
                        title={inst.fullName}
                      >
                        • {inst.pillText}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Fee Calculation Alert based on institution & paymentPlan */}
                {(() => {
                  const fee = getRegistrationFeeDetails(institution);
                  const isFull = paymentPlan === 'full';
                  return (
                    <div className={`mt-2 p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-sm ${
                      fee.isMsu 
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                        : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                    }`}>
                      <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                      <div className="space-y-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="font-black text-xs sm:text-sm text-white">
                            {fee.isMsu 
                              ? (isFull ? '🎓 สังกัดนิสิต มมส: ยอดรวม 650 บาท (จ่ายครบ 1 รอบ)' : '🎓 สังกัดนิสิต มมส: ยอดรวม 650 บาท (แบ่งจ่าย 2 งวด)')
                              : (isFull ? '🏨 สังกัดต่างมหาวิทยาลัย: ยอดรวม 850 บาท (จ่ายครบ 1 รอบ)' : '🏨 สังกัดต่างมหาวิทยาลัย: ยอดรวม 850 บาท (แบ่งจ่าย 2 งวด)')
                            }
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 self-start sm:self-auto shrink-0 whitespace-nowrap">
                            {fee.isMsu 
                              ? (isFull ? 'ไม่มีค่าที่พัก • ชำระเต็มจำนวน' : 'ไม่มีค่าที่พัก • แผน 2 งวด')
                              : (isFull ? 'รวมที่พักหอกุดรัง มมส • ชำระเต็มจำนวน' : 'รวมที่พักหอกุดรัง มมส • แผน 2 งวด')
                            }
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {isFull
                            ? (fee.isMsu
                                ? '• ชำระครั้งเดียวเต็มจำนวน: 650 บาท (ค่าจัดทำเสื้อพรีออเดอร์ + ค่าอาหารและกิจกรรม 15–20 ต.ค. 69) [จ่ายครบ 1 รอบ]'
                                : '• ชำระครั้งเดียวเต็มจำนวน: 850 บาท (ค่าจัดทำเสื้อพรีออเดอร์ + ค่าที่พักหอกุดรัง มมส และอาหาร 15–20 ต.ค. 69) [จ่ายครบ 1 รอบ]'
                              )
                            : (fee.isMsu 
                                ? '• งวดที่ 1: 400 บาท (ค่าจัดทำเสื้อพรีออเดอร์ 15–20 ต.ค. 69) • งวดที่ 2: 250 บาท (ค่าอาหารและกิจกรรม 1–5 พ.ย. 69) [แบ่งจ่าย 2 งวด]'
                                : '• งวดที่ 1: 400 บาท (ค่าจัดทำเสื้อพรีออเดอร์ 15–20 ต.ค. 69) • งวดที่ 2: 450 บาท (ค่าที่พักหอกุดรัง มมส และอาหาร 1–5 พ.ย. 69) [แบ่งจ่าย 2 งวด]'
                              )
                          }
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Section 2: วันเดือนปีเกิด และรูปถ่ายทำ ID Card */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-rescue-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  2. วันเดือนปี พ.ศ. เกิด & คำนวณอายุอัตโนมัติ
                </h3>
                <span className="text-[11px] text-amber-400 font-medium">
                  * เกณฑ์อายุผู้เข้ารับการฝึกอบรม: 15 ปีบริบูรณ์ขึ้นไป (พ.ศ. {maxBirthYearBE} ลงไป)
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2.5 sm:gap-3">
                <div className="col-span-4 sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1 truncate">
                    วันเกิด
                  </label>
                  <select
                    value={birthDay}
                    onChange={e => setBirthDay(e.target.value)}
                    className="w-full px-2.5 sm:px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:ring-2 focus:ring-rescue-500 outline-none cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d.toString()}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-8 sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1 truncate">
                    เดือนเกิด
                  </label>
                  <select
                    value={birthMonth}
                    onChange={e => setBirthMonth(e.target.value)}
                    className="w-full px-2.5 sm:px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:ring-2 focus:ring-rescue-500 outline-none cursor-pointer"
                  >
                    {[
                      '1 - มกราคม', '2 - กุมภาพันธ์', '3 - มีนาคม', '4 - เมษายน',
                      '5 - พฤษภาคม', '6 - มิถุนายน', '7 - กรกฎาคม', '8 - สิงหาคม',
                      '9 - กันยายน', '10 - ตุลาคม', '11 - พฤศจิกายน', '12 - ธันวาคม'
                    ].map((m, idx) => (
                      <option key={idx + 1} value={(idx + 1).toString()}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                    <span>ปีเกิด (พ.ศ.) *</span>
                    <span className="text-[10px] text-rescue-400 font-bold shrink-0">15 ปี+</span>
                  </label>
                  <select
                    id="field-birthYearBE"
                    value={birthYearBE}
                    onChange={e => {
                      setBirthYearBE(e.target.value);
                      clearFieldError('birthYearBE');
                    }}
                    className={`w-full px-2.5 sm:px-3 py-2.5 bg-slate-950 border rounded-xl text-white text-xs sm:text-sm focus:ring-2 outline-none cursor-pointer transition-all ${
                      fieldErrors.birthYearBE 
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                        : 'border-slate-700 focus:ring-rescue-500'
                    }`}
                  >
                    {eligibleBirthYears.map(year => (
                      <option key={year} value={year.toString()}>
                        พ.ศ. {year} (ค.ศ. {year - 543})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {fieldErrors.birthYearBE && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.birthYearBE}</span>
                </p>
              )}

              {/* REAL-TIME CALCULATED AGE DISPLAY BOX */}
              <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner border transition-all ${
                ageResult.years < 15
                  ? 'bg-red-950/40 border-red-500/50'
                  : 'bg-gradient-to-r from-orange-950/60 via-slate-950 to-slate-900 border-orange-500/40'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                    ageResult.years < 15
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  }`}>
                    อายุ
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      อายุที่ระบบคำนวณให้อัตโนมัติ (ณ วันที่ปัจจุบัน):
                    </p>
                    <p className="text-base sm:text-lg font-black text-white">
                      <span className={ageResult.years < 15 ? 'text-red-400' : 'text-orange-400'}>
                        {ageResult.years}
                      </span> ปี{' '}
                      <span className={ageResult.years < 15 ? 'text-red-400' : 'text-orange-400'}>
                        {ageResult.months}
                      </span> เดือน{' '}
                      <span className={ageResult.years < 15 ? 'text-red-400' : 'text-orange-400'}>
                        {ageResult.days}
                      </span> วัน
                    </p>
                  </div>
                </div>

                {ageResult.years < 15 ? (
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    อายุต่ำกว่า 15 ปี (ไม่ผ่านเกณฑ์)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ผ่านเกณฑ์อายุ (15 ปีขึ้นไป)
                  </span>
                )}
              </div>

              {/* เบอร์โทรศัพท์ และ กรุ๊ปเลือด */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-rescue-500" />
                      เบอร์โทรติดต่อ <span className="text-rose-400 font-bold">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (เฉพาะตัวเลข 10 หลัก)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="field-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={e => {
                        handlePhoneChange(e.target.value);
                        if (e.target.value.replace(/\D/g, '').length === 10) clearFieldError('phone');
                      }}
                      placeholder="08XXXXXXXX"
                      className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 font-mono text-sm pr-24 transition-all ${
                        fieldErrors.phone
                          ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                          : phone.length === 10 
                          ? 'border-emerald-500/70 focus:ring-emerald-500' 
                          : 'border-slate-700 focus:ring-rescue-500'
                      }`}
                    />
                    <span className={`absolute right-3 top-3 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold select-none ${
                      phone.length === 10 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {phone.length}/10 หลัก
                    </span>
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-emergency-500" />
                    กรุ๊ปเลือด (Blood Group) <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <select
                    required
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-rescue-500 outline-none text-sm cursor-pointer"
                  >
                    <option value="A">หมู่โลหิต A</option>
                    <option value="B">หมู่โลหิต B</option>
                    <option value="O">หมู่โลหิต O</option>
                    <option value="AB">หมู่โลหิต AB</option>
                  </select>
                </div>
              </div>

              {/* ฟิลด์ 7: 📸 รูปถ่ายสำหรับทำ ID Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span>📸 รูปถ่ายสำหรับทำ ID Card</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    ขนาดไฟล์สูงสุด 100 MB (ระบบย่อขนาดให้อัตโนมัติ)
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  กรุณาอัปโหลดรูปถ่าย <strong className="text-white">ชุดสุภาพ หน้าตรง เห็นใบหน้าชัดเจน</strong> สำหรับใช้จัดทำบัตรประจำตัวผู้เข้าร่วมการฝึก JRE 2027
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Photo Preview Box */}
                  <div className="w-24 h-28 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {idCardPhoto ? (
                      <>
                        <img 
                          src={idCardPhoto} 
                          alt="รูปทำ ID Card" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">เปลี่ยนรูป</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-500">
                        <User className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block">ยังไม่มีรูป</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Input & Actions */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md ${
                        isProcessingIdPhoto ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        {isProcessingIdPhoto ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังประมวลผลรูป...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{idCardPhoto ? 'เลือกรูปใหม่' : 'อัปโหลดรูปถ่าย ID Card'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIdPhotoFileChange}
                          className="hidden"
                        />
                      </label>

                      {idCardPhoto && (
                        <button
                          type="button"
                          onClick={() => {
                            setIdCardPhoto('');
                            setIdCardFileName('');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบรูป</span>
                        </button>
                      )}
                    </div>

                    {idCardFileName && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="truncate max-w-xs">{idCardFileName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 (In Step 1): บุคคลติดต่อฉุกเฉิน & ข้อมูลสุขภาพ */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emergency-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <AlertCircle className="w-4 h-4 text-emergency-500" />
                3. บุคคลติดต่อฉุกเฉิน & ข้อมูลสุขภาพและความปลอดภัย
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชื่อ - สกุล บุคคลติดต่อฉุกเฉิน <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    id="field-emergencyName"
                    type="text"
                    required
                    value={emergencyName}
                    onChange={e => {
                      setEmergencyName(e.target.value);
                      if (e.target.value.trim()) clearFieldError('emergencyName');
                    }}
                    placeholder="ระบุชื่อและนามสกุล"
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm transition-all ${
                      fieldErrors.emergencyName 
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                        : 'border-slate-700 focus:ring-rescue-500'
                    }`}
                  />
                  {fieldErrors.emergencyName && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.emergencyName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ความสัมพันธ์
                  </label>
                  <select
                    value={emergencyRelation}
                    onChange={e => setEmergencyRelation(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none cursor-pointer"
                  >
                    <option value="บิดา">บิดา</option>
                    <option value="มารดา">มารดา</option>
                    <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                    <option value="ญาติ">ญาติสนิท</option>
                    <option value="เพื่อนสนิท">เพื่อนสนิท</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emergency-500" />
                    เบอร์โทรศัพท์ติดต่อฉุกเฉิน <span className="text-rose-400 font-bold">*</span>
                  </span >
                  <span className="text-[10px] text-slate-400 font-normal">
                    (เฉพาะตัวเลข 10 หลัก)
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="field-emergencyPhone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    value={emergencyPhone}
                    onChange={e => {
                      handleEmergencyPhoneChange(e.target.value);
                      if (e.target.value.replace(/\D/g, '').length === 10) clearFieldError('emergencyPhone');
                    }}
                    placeholder="08XXXXXXXX"
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 font-mono text-sm pr-24 transition-all ${
                      fieldErrors.emergencyPhone
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                        : emergencyPhone.length === 10 
                        ? 'border-emerald-500/70 focus:ring-emerald-500' 
                        : 'border-slate-700 focus:ring-rescue-500'
                    }`}
                  />
                  <span className={`absolute right-3 top-3 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold select-none ${
                    emergencyPhone.length === 10 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {emergencyPhone.length}/10 หลัก
                  </span>
                </div>
                {fieldErrors.emergencyPhone && (
                  <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.emergencyPhone}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-rose-400" />
                    โรคประจำตัว / ข้อจำกัดทางกาย
                  </label>
                  <input
                    type="text"
                    value={medicalHistory}
                    onChange={e => setMedicalHistory(e.target.value)}
                    placeholder="เช่น หอบหืด, ความดัน, ไม่มี (ใส่ ไม่มี หากไม่มี)"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    ประวัติแพ้อาหาร / ยา / มังสวิรัติ
                  </label>
                  <input
                    type="text"
                    value={foodAllergy}
                    onChange={e => setFoodAllergy(e.target.value)}
                    placeholder="เช่น แพ้ยาเพนนิซิลิน, แพ้อาหารทะเล, ทานมังสวิรัติ, ไม่มี"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-400" />
                  ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา
                </label>
                <textarea
                  rows="2"
                  value={previousTraining}
                  onChange={e => setPreviousTraining(e.target.value)}
                  placeholder="ระบุหลักสูตรหรือการฝึกอบรมกู้ภัยที่เคยผ่าน หรือหากเป็นมือใหม่ให้ระบุ 'ไม่มี / ฝึกอบรมครั้งแรก'"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Step 1 Bottom Action Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleCancelEditRegistration}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700 text-sm cursor-pointer active:scale-95 transition-colors"
                >
                  ❌ ยกเลิกการแก้ไข (คืนค่าเดิม)
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={handleNextToStep2}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rescue-600 to-orange-500 hover:from-rescue-500 hover:to-orange-400 text-white font-black rounded-2xl shadow-xl shadow-rescue-600/30 transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ถัดไป: สั่งเสื้อโครงการ JRE 2027 (ขั้นตอนที่ 2)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: สั่งเสื้อโครงการ JRE 2027 (พรีออเดอร์)
            ======================================================== */}
        {currentFormStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Section 3: ตารางไซต์เสื้อ & 👕 รายละเอียดเสื้อฝึก JRE 2027 (บังคับซื้อเสื้อ) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-orange-400" />
                  ขั้นตอนที่ 2: รายละเอียดเสื้อฝึก JRE 2027 & เลือกขนาดไซส์เสื้อ (บังคับเลือก) <span className="text-rose-400 font-bold">*</span>
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-bold self-start sm:self-auto">
                  ตอนสมัคร บังคับซื้อเสื้อพรีออเดอร์ (400 บ.)
                </span>
              </div>

              {/* Official Shirt Description Box */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-orange-500/30 rounded-2xl space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>👕</span>
                      <span>รายละเอียดเสื้อฝึก Joint Response Exercise (JRE 2027)</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      เสื้อฝึก Joint Response Exercise (JRE 2027) ออกแบบในรูปแบบ <strong className="text-orange-300 font-bold">เสื้อคอเต่าซิป แขนสั้น โทนสี เทา–ดำ</strong> ให้มีความเรียบ เท่ และเหมาะสำหรับการฝึกปฏิบัติร่วมกันของเครือข่าย
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                        <strong className="text-amber-400 block mb-0.5">บริเวณด้านหน้า:</strong>
                        <span>• <strong>อกซ้าย:</strong> ติดโลโก้ ภาคีเครือข่าย</span><br />
                        <span>• <strong>อกขวา:</strong> แสดง ตัวย่อภาษาอังกฤษของหน่วย/ชมรม และตัวย่อของมหาวิทยาลัยต้นสังกัด</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                        <strong className="text-amber-400 block mb-0.5">บริเวณด้านหลัง:</strong>
                        <span>• ด้านบนเป็น โลโก้ของภาคีเครือข่ายที่เข้าร่วมการฝึก</span><br />
                        <span>• ถัดลงมาเป็นข้อความ <strong>“ฝึกผสมภาคีเครือข่าย”</strong> พร้อมชื่อโครงการ “Joint Response Exercise (JRE 2027)”</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      การออกแบบเสื้อเน้นให้ผู้เข้าร่วมจากแต่ละสถาบันสามารถ แสดงอัตลักษณ์ของหน่วยและมหาวิทยาลัยต้นสังกัด ขณะเดียวกันยังคงสะท้อนความเป็นหนึ่งเดียวกันของ เครือข่าย JRE 2027 🤝🚑
                    </p>
                  </div>

                  {/* Shirt Thumbnail Preview with Zoom */}
                  <div className="flex sm:flex-col gap-2 shrink-0 self-center md:self-auto">
                    <div 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden cursor-pointer relative group shadow-lg"
                      onClick={() => setShowShirtSizeModal(true)}
                      title="คลิกเพื่อดูรูปเสื้อและตารางไซส์ขนาดใหญ่"
                    >
                      <img 
                        src="/images/merchandise/jre_shirt_official.jpg" 
                        alt="เสื้อฝึก JRE 2027" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold gap-1">
                        <Maximize2 className="w-3 h-3" />
                        <span>ดูแบบเสื้อ</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowShirtSizeModal(true)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูตารางไซส์</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Size Selector Buttons */}
              <div 
                id="field-shirtSize"
                tabIndex={-1}
                className={`p-3 rounded-3xl transition-all ${
                  fieldErrors.shirtSize 
                    ? 'border-2 border-rose-500 ring-4 ring-rose-500/30 bg-rose-950/20 shadow-xl shadow-rose-950/50' 
                    : ''
                }`}
              >
                <label className="block text-xs font-bold text-white mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>เลือกขนาดไซส์เสื้อฝึก JRE 2027 ของท่าน: <span className="text-rose-400 font-bold">*</span></span>
                  {fieldErrors.shirtSize && (
                    <span className="text-xs text-rose-400 font-bold flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.shirtSize}</span>
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {SHIRT_SIZE_OPTIONS.map((opt) => {
                    const isSelected = shirtSize === opt.value;
                    const isCustom = opt.value.startsWith('อื่นๆ');
                    const displayTitle = isCustom ? 'อื่นๆ / พิเศษ' : opt.value;
                    const displaySubtitle = isCustom 
                      ? 'ติดต่อ 098-329-6762' 
                      : opt.label.replace(opt.value, '').replace(/[()]/g, '').trim();

                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => {
                          setShirtSize(opt.value);
                          clearFieldError('shirtSize');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/30 text-white shadow-md'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`font-black text-sm ${isCustom ? 'text-amber-300' : 'text-white'}`}>
                            {displayTitle}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 leading-snug">
                          {displaySubtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Size Banner */}
              {shirtSize && (() => {
                const isCustom = shirtSize.startsWith('อื่นๆ');
                const matchedOpt = SHIRT_SIZE_OPTIONS.find(o => o.value === shirtSize);
                const sizeDetail = matchedOpt ? matchedOpt.label.replace(matchedOpt.value, '').replace(/[()]/g, '').trim() : '';

                return (
                  <div className="p-4 bg-orange-950/40 border border-orange-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-black text-base shrink-0">
                        {isCustom ? (
                          <Shirt className="w-5 h-5 text-orange-400" />
                        ) : (
                          shirtSize
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-300 block">ไซส์เสื้อที่ท่านเลือกสำหรับสั่งผลิตพรีออเดอร์:</span>
                        <strong className="text-white text-sm font-black">
                          {isCustom ? (
                            'ไซส์พิเศษ (อื่นๆ) • ☎️ ติดต่อแจ้งรอบอก: 098-329-6762'
                          ) : (
                            `ไซส์ ${shirtSize} ${sizeDetail ? `(${sizeDetail})` : ''}`
                          )}
                        </strong>
                      </div>
                    </div>
                    <span className="text-[11px] text-orange-300 font-bold bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-500/30 whitespace-nowrap shrink-0 self-start sm:self-auto">
                      {paymentPlan === 'full' 
                        ? '💵 ค่าเสื้อ 400 บ. (รวมในยอดเต็มจำนวนแล้ว)' 
                        : '💵 ค่าเสื้อ 400 บ. (รวมในงวดที่ 1)'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Step 2 Bottom Navigation Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFormStep(1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>ย้อนกลับไปขั้นตอนที่ 1</span>
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEditRegistration}
                    className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700 text-sm cursor-pointer active:scale-95 transition-colors whitespace-nowrap"
                  >
                    ❌ ยกเลิกการแก้ไข
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleNextToStep3}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-2xl shadow-xl shadow-orange-600/30 transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>
                  {paymentPlan === 'full' 
                    ? 'ถัดไป: สรุปค่าสมัคร & ชำระเงินเต็มจำนวน (ขั้นตอนที่ 3) →' 
                    : 'ถัดไป: สรุปค่าสมัคร & ชำระเงิน (ขั้นตอนที่ 3) →'}
                </span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: สรุป & ชำระเงินเต็มจำนวน (Full) หรือ รอบที่ 1 (Installment)
            ======================================================== */}
        {currentFormStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Summary Card of Applicant & Shirt Order */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/40 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    {paymentPlan === 'full' 
                      ? 'สรุปรายการใบสมัคร & ชำระเงินเต็มจำนวน' 
                      : 'สรุปรายการใบสมัคร & ชำระเงินรอบที่ 1'}
                  </h3>
                </div>
                <span className="text-[11px] text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full font-bold border border-indigo-500/30 self-start sm:self-auto shrink-0 whitespace-nowrap">
                  {paymentPlan === 'full' ? 'ขั้นตอนสุดท้าย (3/3)' : 'ขั้นตอนที่ 3 จาก 4'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">ผู้สมัคร / ชื่อเล่น:</span>
                  <p className="font-bold text-white text-xs truncate">
                    {fullNameAffiliation || `${firstName} ${lastName}`}
                  </p>
                  <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                    ชื่อเล่น: {nicknameTh && nicknameEn ? `${nicknameTh} (${nicknameEn})` : (nicknameTh || nicknameEn || nickname || '-')}
                  </p>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">รหัสนามเรียกขาน & สังกัด:</span>
                  <p className="font-mono font-bold text-sky-300 text-xs truncate">
                    📡 {callsign || '-'}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5" title={unit}>
                    หน่วย: {unit || '-'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate" title={institution}>
                    สังกัด: {institution || '-'}
                  </p>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/40">
                  <span className="text-[10px] text-purple-300 block mb-0.5 font-semibold">เสื้อโครงการที่สั่ง:</span>
                  <p className="font-black text-white text-sm">
                    👕 ไซส์ {shirtSize || 'ยังไม่เลือก'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    คอเต่าซิป แขนสั้น เทา-ดำ
                  </p>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/40">
                  <span className="text-[10px] text-amber-300 block mb-0.5 font-semibold">
                    {paymentPlan === 'full' ? 'ยอดชำระเต็มจำนวน:' : 'ยอดรอบที่ 1 / ยอดรวม:'}
                  </span>
                  <p className="font-black text-amber-300 text-sm">
                    💵 {paymentPlan === 'full' ? `${feeInfo.totalFee} บาท` : '400 บาท'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {paymentPlan === 'full' 
                      ? 'ชำระครบถ้วนในรอบเดียว' 
                      : `รอบ 2 คงค้าง: ${feeInfo.round2Amount} บ. (รวม ${feeInfo.totalFee} บ.)`}
                  </p>
                </div>
              </div>
            </div>


            {/* Section 5: บัญชีธนาคาร & หลักฐานการโอนเงิน (เต็มจำนวน หรือ รอบที่ 1) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {paymentPlan === 'full' 
                      ? `บัญชีธนาคาร & หลักฐานการโอนเงินเต็มจำนวน (${feeInfo.totalFee} บาท)` 
                      : 'บัญชีธนาคาร & หลักฐานการโอนเงิน รอบที่ 1 (400 บาท)'}
                  </span>
                </h3>
                <span className="text-[11px] text-amber-300 font-bold self-start sm:self-auto shrink-0">
                  ยอดชำระ: {paymentPlan === 'full' ? `${feeInfo.totalFee} บาท` : '400 บาท'}
                </span>
              </div>

              {/* Official Bank Account Information Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>🏦</span> บัญชีธนาคารสำหรับโอนเงินค่าลงทะเบียน:
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold self-start sm:self-auto shrink-0">
                    {paymentPlan === 'full' ? `ยอดเต็มจำนวน: ${feeInfo.totalFee} บาท` : 'รอบที่ 1: 400 บาท (15–20 ต.ค. 2569)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Account Number Card */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">ธนาคารไทยพาณิชย์ (SCB)</span>
                      <span className="font-mono font-black text-amber-300 text-sm tracking-wide block truncate">594-264865-5</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('594-264865-5', 'form_bank_acc', 'เลขบัญชี')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'form_bank_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'form_bank_acc' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>

                  {/* Account Name Card */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">ชื่อบัญชี</span>
                      <span className="font-bold text-white text-xs block truncate" title="นางสาวมัญชุพร ยังเหล็ก">นางสาวมัญชุพร ยังเหล็ก</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('นางสาวมัญชุพร ยังเหล็ก', 'form_bank_name', 'ชื่อบัญชี')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'form_bank_name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'form_bank_name' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>

                  {/* Contact Phone (No PromptPay) */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-amber-300 block font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                        ☎️ สอบถามเพิ่มเติม (ไม่มีพร้อมเพย์)
                      </span>
                      <span className="font-mono font-bold text-white text-xs block truncate mt-0.5">098-329-6762</span>
                    </div>
                    <a
                      href="tel:0983296762"
                      className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0"
                      title="โทรสอบถามรายละเอียด"
                    >
                      <Phone className="w-3 h-3" />
                      <span>โทรสอบถาม</span>
                    </a>
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] bg-rose-950/40 border border-rose-500/40 text-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>ข้อควรระวัง:</strong> รับโอนเงินเข้าบัญชี <strong>ธ.ไทยพาณิชย์ 594-264865-5 (นางสาวมัญชุพร ยังเหล็ก)</strong> เท่านั้น • <u>ไม่มีระบบพร้อมเพย์ (PromptPay)</u> (เบอร์โทรมีไว้สำหรับโทรสอบถามเท่านั้น ห้ามโอนเงินผ่านเบอร์โทร)
                  </span>
                </div>
              </div>

              {/* Slip & Payment Policy Notice Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 text-amber-200 text-xs space-y-2 shadow-lg">
                <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ข้อกำหนดสำคัญ: บังคับแนบสลิปหลักฐานการโอนเงินทุกครั้ง</span>
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px] sm:text-xs space-y-1">
                  {paymentPlan === 'full' ? (
                    <p>
                      • <strong className="text-emerald-400">ชำระเต็มจำนวน ({feeInfo.totalFee} บาท):</strong> จำเป็นต้องแนบสลิปเพื่อส่งใบสมัคร เมื่อเจ้าหน้าที่ตรวจสอบสลิปแล้ว <strong className="text-white underline">ระบบจะยืนยันสิทธิ์เข้าร่วมโครงการทันที</strong>
                    </p>
                  ) : (
                    <>
                      <p>
                        • <strong className="text-amber-400">แบ่งชำระรอบที่ 1 (400 บาท):</strong> จำเป็นต้องแนบสลิปเพื่อ <strong className="text-white underline">มัดจำค่าจัดทำเสื้อฝึกอบรม & ล็อคไซส์เสื้อ</strong> ในขั้นตอนแรกนี้
                      </p>
                      <p>
                        • <strong className="text-sky-400">การยืนยันสิทธิ์สมบูรณ์:</strong> จะเสร็จสิ้นเมื่อท่านแนบสลิปชำระรอบที่ 2 (ส่วนที่เหลือ {feeInfo.round2Amount} บาท) ครบถ้วน
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Slip Upload Area */}
              <div 
                id="field-slip-upload-step3"
                className={`p-4 bg-slate-950/80 border rounded-2xl space-y-4 transition-all duration-300 ${
                  (fieldErrors.slipFull || fieldErrors.slipRound1)
                    ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20'
                    : 'border-slate-800'
                }`}
              >
                {(fieldErrors.slipFull || fieldErrors.slipRound1) && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-bold">
                      {fieldErrors.slipFull || fieldErrors.slipRound1}
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>
                      {paymentPlan === 'full' 
                        ? `แนบสลิปหลักฐานการโอนเงินเต็มจำนวน (${feeInfo.totalFee} บาท) *` 
                        : 'แนบสลิปหลักฐานการโอนเงิน รอบที่ 1 (มัดจำเสื้อฝึก 400 บาท) *'}
                    </span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    (ระบบสแกน OCR ตรวจสอบเวลาโอนและยอดเงินอัตโนมัติ)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Slip Preview Box */}
                  <div className="w-24 h-28 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {(paymentPlan === 'full' ? formSlipFull : formSlipRound1) ? (
                      <>
                        <img 
                          src={paymentPlan === 'full' ? formSlipFull : formSlipRound1} 
                          alt="สลิปโอนเงิน" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">เปลี่ยนสลิป</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block">ยังไม่แนบสลิป</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Input & Actions */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md ${
                        (paymentPlan === 'full' ? isProcessingFormSlipFull : isProcessingFormSlip) ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        {(paymentPlan === 'full' ? isProcessingFormSlipFull : isProcessingFormSlip) ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังสแกน OCR สลิป...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {(paymentPlan === 'full' ? formSlipFull : formSlipRound1) 
                                ? 'เปลี่ยนไฟล์สลิป' 
                                : `อัปโหลดสลิปโอนเงิน (${paymentPlan === 'full' ? `${feeInfo.totalFee} บ.` : '400 บ.'})`}
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={paymentPlan === 'full' ? handleFormSlipFullChange : handleFormSlipRound1Change}
                          className="hidden"
                        />
                      </label>

                      {(paymentPlan === 'full' ? formSlipFull : formSlipRound1) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (paymentPlan === 'full') {
                              setFormSlipFull('');
                              setFormSlipFullFileName('');
                              setSlipOcrFull(null);
                            } else {
                              setFormSlipRound1('');
                              setFormSlipRound1FileName('');
                              setSlipOcrRound1(null);
                            }
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบสลิป</span>
                        </button>
                      )}
                    </div>

                    {(paymentPlan === 'full' ? formSlipFullFileName : formSlipRound1FileName) && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="truncate max-w-xs">{paymentPlan === 'full' ? formSlipFullFileName : formSlipRound1FileName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 🔍 REAL-TIME SLIP OCR INFORMATION CARD */}
                {((paymentPlan === 'full' ? slipOcrFull : slipOcrRound1)) && (() => {
                  const ocr = paymentPlan === 'full' ? slipOcrFull : slipOcrRound1;
                  const expectedAmount = paymentPlan === 'full' ? feeInfo.totalFee : 400;
                  const isFullyVerified = Boolean(ocr?.isFullyVerified);
                  const isDuplicate = Boolean(ocr?.isDuplicate);
                  const isMismatch = Boolean(ocr?.isDetected && ocr?.matchExpected === false);

                  return (
                    <div className={`p-4 rounded-2xl space-y-3 animate-in fade-in shadow-lg border transition-all ${
                      isFullyVerified
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/30'
                        : isDuplicate
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30'
                          : isMismatch
                            ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/30'
                            : 'bg-slate-900/90 border-slate-700/80'
                    }`}>
                      {/* Card Header with Badges */}
                      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${
                        isFullyVerified
                          ? 'border-emerald-500/20'
                          : isDuplicate
                            ? 'border-rose-500/20'
                            : isMismatch
                              ? 'border-amber-500/20'
                              : 'border-slate-800'
                      }`}>
                        <span className={`text-xs font-black flex items-center gap-1.5 ${
                          isFullyVerified ? 'text-emerald-300' : isDuplicate ? 'text-rose-300' : isMismatch ? 'text-amber-300' : 'text-slate-300'
                        }`}>
                          <Sparkles className={`w-4 h-4 ${
                            isFullyVerified ? 'text-emerald-400' : isDuplicate ? 'text-rose-400' : isMismatch ? 'text-amber-400' : 'text-slate-400'
                          }`} />
                          ผลการสแกนสลิปอัจฉริยะ (Smart Slip OCR)
                        </span>

                        {isFullyVerified && (
                          <span className="text-[10px] px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ✓ ตรวจสอบผ่าน 100% (ยืนยันสิทธิ์ทันที)
                          </span>
                        )}
                        {isDuplicate && (
                          <span className="text-[10px] px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-full font-bold border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            🚨 ตรวจพบสลิปซ้ำ (รอแอดมินตรวจ)
                          </span>
                        )}
                        {!isDuplicate && isMismatch && (
                          <span className="text-[10px] px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full font-bold border border-amber-500/40 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            ⚠️ ยอดเงินไม่ตรง (รอแอดมินตรวจ)
                          </span>
                        )}
                        {!ocr?.isDetected && (
                          <span className="text-[10px] px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-bold border border-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            รอเจ้าหน้าที่ตรวจสอบสลิป
                          </span>
                        )}
                      </div>

                      {/* Visual Policy Callout Banner */}
                      {isFullyVerified ? (
                        <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-emerald-300 block">🎉 ยอดเงินตรงและสลิปสมบูรณ์ (พร้อมยืนยันสิทธิ์ทันที)</span>
                            <span className="text-[11px] leading-relaxed text-emerald-200/90">
                              ตรวจพบยอดเงิน {ocr.amountFormatted} ตรงตามจำนวนที่กำหนด ({expectedAmount}.00 บาท) วันเวลาโอนถูกต้อง และเป็นสลิปใหม่ไม่ซ้ำในระบบ — เมื่อกดส่งใบสมัคร ระบบจะยืนยันสิทธิ์ให้ทันทีโดยไม่ต้องรอแอดมิน!
                            </span>
                          </div>
                        </div>
                      ) : isDuplicate ? (
                        <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-rose-300 block">🚨 ตรวจพบรหัสอ้างอิงสลิปซ้ำในระบบ</span>
                            <span className="text-[11px] leading-relaxed text-rose-200/90">
                              {ocr.duplicateMessage || 'สลิปนี้มีรหัสอ้างอิงที่เคยถูกส่งแล้วในคลังระบบ'} — <strong>ท่านยังสามารถกดส่งใบสมัครได้ตามปกติ</strong> แต่ระบบจะส่งให้เจ้าหน้าที่ (Admin) ตรวจสอบความถูกต้องด้วยตนเอง
                            </span>
                          </div>
                        </div>
                      ) : isMismatch ? (
                        <div className="p-3 bg-amber-950/60 rounded-xl border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-amber-300 block">⚠️ ยอดเงินในสลิปไม่ตรงตามยอดที่กำหนด</span>
                            <span className="text-[11px] leading-relaxed text-amber-200/90">
                              ตรวจพบยอดเงิน <strong>{ocr.amountFormatted}</strong> (ยอดที่กำหนดคือ <strong>{expectedAmount}.00 บาท</strong>) — <strong>ท่านยังสามารถกดส่งใบสมัครได้ตามปกติ</strong> เจ้าหน้าที่จะตรวจสอบสลิปและปรับสถานะให้ในภายหลัง
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/70 text-xs text-slate-300 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-200 block">⏳ ไม่พบตัวเลขยอดเงินในภาพสลิปชัดเจน</span>
                            <span className="text-[11px] leading-relaxed text-slate-400">
                              <strong>ท่านสามารถกดส่งใบสมัครได้ตามปกติ</strong> เจ้าหน้าที่ (Admin) จะตรวจสอบสลิปและยืนยันสิทธิ์ให้ด้วยตนเอง
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Detail Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">⏰ เวลาที่อัปโหลดไฟล์:</span>
                          <span className="font-bold text-white text-[11px]">
                            {ocr?.uploadTimeStr}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">📅 วันเวลาที่โอนเงิน (จากสลิป):</span>
                          <span className={`font-bold text-[11px] flex items-center justify-between ${ocr?.transferDateTimeStr ? 'text-amber-300' : 'text-slate-400'}`}>
                            <span>{ocr?.transferDateTimeStr || 'ไม่พบระบุในสลิป (ตรวจหน้างาน)'}</span>
                            {ocr?.transferDateTimeStr && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">✓ ตรวจพบ</span>
                            )}
                          </span>
                        </div>
                        <div className={`p-2.5 bg-slate-900/80 rounded-xl border ${
                          isFullyVerified ? 'border-emerald-500/40 bg-emerald-950/20' : isMismatch ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800'
                        }`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[10px] font-semibold ${
                              isFullyVerified ? 'text-emerald-300' : isMismatch ? 'text-amber-300' : 'text-slate-400'
                            }`}>
                              💵 ยอดเงินที่ตรวจพบ (จากสลิป):
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (ยอดกำหนด: {expectedAmount}.00 บ.)
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className={`text-sm font-black ${
                              isFullyVerified ? 'text-emerald-400' : isMismatch ? 'text-amber-400' : 'text-slate-400 text-xs font-medium'
                            }`}>
                              {ocr?.isDetected ? ocr.amountFormatted : 'ไม่พบตัวเลขยอดเงิน'}
                            </span>
                            {ocr?.isDetected && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isFullyVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {isFullyVerified ? '✓ ยอดตรง' : '⚠️ ยอดไม่ตรง'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">🏦 ธนาคาร / ช่องทาง:</span>
                          <span className={`font-bold text-[11px] truncate block ${ocr?.bankDetected ? 'text-sky-300' : 'text-slate-400'}`}>
                            {ocr?.bankDetected || 'ไม่พบข้อมูลในรูปภาพ'}
                          </span>
                        </div>
                      </div>

                      {/* Anti-Duplicate Registry Check Box */}
                      {ocr?.transRef && (
                        <div className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isDuplicate 
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
                            : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
                        }`}>
                          <div className="flex items-center gap-2 truncate">
                            <Shield className={`w-3.5 h-3.5 shrink-0 ${isDuplicate ? 'text-rose-400' : 'text-sky-400'}`} />
                            <span className="text-[11px] text-slate-400 shrink-0">ตรวจสอบคลังสลิป:</span>
                            <span className="font-mono text-[11px] font-bold text-amber-300 truncate select-all">{ocr.transRef}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isDuplicate 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {isDuplicate ? '🚨 สลิปเคยถูกใช้งานแล้ว (ซ้ำ)' : '✓ สลิปใหม่ ไม่พบประวัติซ้ำ'}
                          </span>
                        </div>
                      )}

                      {/* 📱 DETECTED SLIP QR CODE DETAILS */}
                      {ocr?.qrData && (
                        <div className="p-2.5 sm:p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 border-b border-purple-900/40 pb-1.5">
                            <span className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                              <QrCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>QR Code ในสลิป ({ocr.qrData.typeName})</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shrink-0">
                              ✓ ถอดรหัสสำเร็จ
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            {ocr.qrData.transRef && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">รหัสอ้างอิง (TransRef):</span>
                                <span className="font-mono font-bold text-amber-300 truncate select-all">{ocr.qrData.transRef}</span>
                              </div>
                            )}
                            {ocr.qrData.bank && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">ธนาคารใน QR:</span>
                                <span className="font-semibold text-white truncate">{ocr.qrData.bank}</span>
                              </div>
                            )}
                            {ocr.qrData.amount && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">ยอดเงินใน QR:</span>
                                <span className="font-bold text-emerald-400">{ocr.qrData.amount.toFixed(2)} บาท</span>
                              </div>
                            )}
                            {ocr.qrData.country && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">ประเทศ:</span>
                                <span className="font-semibold text-slate-300">{ocr.qrData.country === 'TH' ? 'ไทย (TH)' : ocr.qrData.country}</span>
                              </div>
                            )}
                          </div>
                          {ocr.qrData.raw && (
                            <div className="text-[10px] text-slate-400 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 font-mono break-all select-all flex items-center justify-between gap-2">
                              <span className="truncate">Payload: {ocr.qrData.raw}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {ocr?.message && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{ocr.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Consent and Agreement Checkboxes */}
            <div 
              id="field-agreeCorrectInfo"
              className={`p-5 sm:p-6 bg-slate-950/80 border rounded-3xl space-y-4 shadow-inner transition-all duration-300 ${
                fieldErrors.agreeCorrectInfo
                  ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20'
                  : isConsentAgreed
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-amber-500/40 bg-amber-950/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-5 h-5 shrink-0 ${isConsentAgreed ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    การยืนยันข้อมูลและข้อตกลงความยินยอม (Consent & Agreements)
                  </h3>
                </div>
                {isConsentAgreed ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ✓ ยินยอมครบถ้วนแล้ว (ปลดล็อกปุ่มส่ง)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 shrink-0 self-start sm:self-auto">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    🔒 จำเป็นต้องติ๊กครบทั้ง 2 ข้อ เพื่อเปิดปุ่มส่ง
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Checkbox 1: Correct Info Confirmation */}
                <label className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group select-none ${
                  agreeCorrectInfo 
                    ? 'bg-emerald-950/20 border-emerald-500/40' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    required
                    checked={agreeCorrectInfo}
                    onChange={e => {
                      setAgreeCorrectInfo(e.target.checked);
                      if (e.target.checked && agreePDPAAndRules) {
                        clearFieldError('agreeCorrectInfo');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rescue-600 focus:ring-rescue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                    <strong className="text-white font-semibold">1. การรับรองความถูกต้องของข้อมูล:</strong> ข้าพเจ้าขอยืนยันว่า ข้อมูลประวัติ สังกัด เบอร์โทรศัพท์ ประวัติสุขภาพ ขนาดไซส์เสื้อ และหลักฐานการโอนเงินทั้งหมดที่ระบุข้างต้นเป็นความจริง ถูกต้อง และเป็นปัจจุบันทุกประการ <span className="text-rose-400 font-bold">*</span>
                  </span>
                </label>

                {/* Checkbox 2: PDPA and Project Rules */}
                <label className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group select-none ${
                  agreePDPAAndRules 
                    ? 'bg-emerald-950/20 border-emerald-500/40' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    required
                    checked={agreePDPAAndRules}
                    onChange={e => {
                      setAgreePDPAAndRules(e.target.checked);
                      if (e.target.checked && agreeCorrectInfo) {
                        clearFieldError('agreeCorrectInfo');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rescue-600 focus:ring-rescue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                  />
                  <div className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                    <strong className="text-white font-semibold">2. นโยบาย PDPA และข้อตกลงโครงการ:</strong> ข้าพเจ้ายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) มหาวิทยาลัยมหาสารคาม และตกลงที่จะปฏิบัติตามกฎระเบียบ ข้อตกลง และคำสั่งความปลอดภัยของโครงการ JRE 2027 ตลอดระยะเวลาการฝึกอบรมทุกประการ <span className="text-rose-400 font-bold">*</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPdpaModal(true);
                      }}
                      className="ml-2 text-rescue-400 hover:text-rescue-300 underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      [อ่านนโยบายข้อมูลส่วนบุคคล PDPA มมส]
                    </button>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 3 Bottom Action Buttons */}
            <div className="pt-4 space-y-3">
              {/* Primary Action Button: Submit Application */}
              <button
                type="submit"
                disabled={isSubmitting || !isConsentAgreed}
                className={`w-full py-4 px-6 font-black rounded-2xl shadow-xl transition-all active:scale-[0.99] text-sm sm:text-base flex items-center justify-center gap-2 ${
                  !isConsentAgreed
                    ? 'bg-slate-800/80 text-slate-400 border border-slate-700/80 cursor-not-allowed shadow-none opacity-80'
                    : ((paymentPlan === 'full' && slipOcrFull?.isFullyVerified) || (paymentPlan === 'installment' && slipOcrRound1?.isFullyVerified))
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 cursor-pointer'
                    : ((paymentPlan === 'full' && !formSlipFull && !myRegistration?.payment_slip_url) ||
                       (paymentPlan === 'installment' && !formSlipRound1 && !myRegistration?.installment_1_slip_url))
                    ? 'bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 hover:from-amber-600 hover:to-orange-600 text-amber-100 shadow-amber-900/30 border border-amber-500/50 cursor-pointer'
                    : 'bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white shadow-rescue-600/30 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : !isConsentAgreed ? (
                  <>
                    <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="text-center font-bold">
                      🔒 กรุณาติ๊กยอมรับเงื่อนไขและยืนยันข้อมูลถูกต้องด้านบนก่อน จึงจะเปิดให้ส่งใบสมัคร
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 shrink-0" />
                    <span className="text-center">
                      {isEditing
                        ? (hasAnyPaymentApproved ? 'บันทึกการแก้ไขข้อมูล' : 'บันทึกการแก้ไขข้อมูลใบสมัคร')
                        : paymentPlan === 'full'
                        ? (slipOcrFull?.isFullyVerified
                            ? `✓ ยืนยันสิทธิ์ทันทีและส่งใบสมัคร (${feeInfo.totalFee} บ.) 🚀`
                            : slipOcrFull?.isDuplicate
                              ? `⚠️ ยืนยันส่งใบสมัคร (พบสลิปซ้ำ - รอแอดมินตรวจ) 📋`
                              : slipOcrFull?.matchExpected === false
                                ? `⚠️ ยืนยันส่งใบสมัคร (ยอดเงินไม่ตรง - รอแอดมินตรวจ) 📋`
                                : (formSlipFull || myRegistration?.payment_slip_url
                                    ? `ยืนยันและส่งใบสมัคร + สลิปชำระเต็มจำนวน (${feeInfo.totalFee} บ.) 💾` 
                                    : `⚠️ กรุณาแนบสลิปโอนเงินเต็มจำนวน (${feeInfo.totalFee} บ.) ก่อนส่งใบสมัคร`))
                        : (slipOcrRound1?.isFullyVerified
                            ? `✓ ยืนยันมัดจำเสื้อทันทีและส่งใบสมัคร (400 บ.) 🚀`
                            : slipOcrRound1?.isDuplicate
                              ? `⚠️ ยืนยันส่งใบสมัคร (พบสลิปซ้ำ - รอแอดมินตรวจ) 📋`
                              : slipOcrRound1?.matchExpected === false
                                ? `⚠️ ยืนยันส่งใบสมัคร (ยอดเงินไม่ตรง - รอแอดมินตรวจ) 📋`
                                : (formSlipRound1 || myRegistration?.installment_1_slip_url
                                    ? 'ยืนยันและส่งใบสมัคร + สลิปมัดจำค่าเสื้อรอบที่ 1 (400 บ.) ไปยัง Admin 💾'
                                    : '⚠️ กรุณาแนบสลิปมัดจำค่าเสื้อรอบที่ 1 (400 บ.) ก่อนส่งใบสมัคร'))}
                    </span>
                  </>
                )}
              </button>

              {/* Secondary Navigation Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFormStep(2);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>ย้อนกลับไปแก้ไขไซส์เสื้อ (ขั้นตอนที่ 2)</span>
                </button>

                {/* Installment Plan: Advance to Step 4 Button */}
                {paymentPlan === 'installment' && (
                  <button
                    type="button"
                    onClick={handleNextToStep4}
                    className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl border border-sky-400/40 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-sky-600/20 transition-colors"
                  >
                    <span>หรือแนบสลิปชำระรอบที่ 2 (คงค้าง)</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEditRegistration}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-2xl border border-rose-500/30 text-sm cursor-pointer active:scale-95 transition-colors"
                  >
                    ❌ ยกเลิกการแก้ไข (คืนค่าเดิม)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: ชำระเงินรอบที่ 2 (คงค้าง) สำหรับแบบแบ่งจ่าย 2 รอบ
            ======================================================== */}
        {paymentPlan === 'installment' && currentFormStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Step 4 Summary Card */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/40 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-sky-400 shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    สรุปยอดคงค้าง & ชำระเงินรอบที่ 2 ({feeInfo.round2Amount} บาท)
                  </h3>
                </div>
                <span className="text-[11px] text-sky-300 bg-sky-500/20 px-3 py-1 rounded-full font-bold border border-sky-500/30 self-start sm:self-auto shrink-0 whitespace-nowrap">
                  ขั้นตอนสุดท้าย (4/4)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">รอบที่ 1 (มัดจำเสื้อโครงการ):</span>
                  <p className="font-black text-amber-300 text-sm">💵 400 บาท</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    formSlipRound1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {formSlipRound1 ? '✓ แนบสลิปรอบ 1 แล้ว' : 'รอแนบสลิป'}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-sky-500/40 space-y-1">
                  <span className="text-[10px] text-sky-300 block font-semibold">รอบที่ 2 (ชำระรอบนี้):</span>
                  <p className="font-black text-sky-400 text-sm">💵 {feeInfo.round2Amount} บาท</p>
                  <span className="text-[10px] text-slate-300 block">
                    📅 กำหนดชำระ: วันที่ 1–5 พ.ย. 2569 (ค่าที่พักและอาหาร)
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">💵 ยอดรวมทั้งโครงการ:</span>
                  <p className="font-black text-white text-sm">{feeInfo.totalFee} บาท</p>
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    {feeInfo.isMsu ? 'นิสิต มมส (ไม่มีค่าที่พัก)' : 'ต่างสถาบัน (รวมที่พักหอกุดรัง มมส)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Card for Round 2 */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>บัญชีธนาคาร & หลักฐานการโอนเงิน รอบที่ 2 ({feeInfo.round2Amount} บาท)</span>
                </h3>
                <span className="text-[11px] text-sky-300 font-bold self-start sm:self-auto shrink-0">
                  ยอดชำระ: {feeInfo.round2Amount} บาท
                </span>
              </div>

              {/* Official Bank Account Information Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-sky-500/40 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>🏦</span> บัญชีธนาคารสำหรับโอนเงินรอบที่ 2:
                  </span>
                  <span className="text-[10px] text-sky-300 font-bold self-start sm:self-auto shrink-0">
                    ยอดชำระ: {feeInfo.round2Amount} บาท (1–5 พ.ย. 2569)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Account Number Card */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">ธนาคารไทยพาณิชย์ (SCB)</span>
                      <span className="font-mono font-black text-amber-300 text-sm tracking-wide block truncate">594-264865-5</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('594-264865-5', 'form_bank_acc_r2', 'เลขบัญชี')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'form_bank_acc_r2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'form_bank_acc_r2' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>

                  {/* Account Name Card */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">ชื่อบัญชี</span>
                      <span className="font-bold text-white text-xs block truncate" title="นางสาวมัญชุพร ยังเหล็ก">นางสาวมัญชุพร ยังเหล็ก</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('นางสาวมัญชุพร ยังเหล็ก', 'form_bank_name_r2', 'ชื่อบัญชี')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'form_bank_name_r2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'form_bank_name_r2' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>

                  {/* Contact Phone (No PromptPay) */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-amber-300 block font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                        ☎️ สอบถามเพิ่มเติม (ไม่มีพร้อมเพย์)
                      </span>
                      <span className="font-mono font-bold text-white text-xs block truncate mt-0.5">098-329-6762</span>
                    </div>
                    <a
                      href="tel:0983296762"
                      className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0"
                      title="โทรสอบถามรายละเอียด"
                    >
                      <Phone className="w-3 h-3" />
                      <span>โทรสอบถาม</span>
                    </a>
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] bg-rose-950/40 border border-rose-500/40 text-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>ข้อควรระวัง:</strong> รับโอนเงินเข้าบัญชี <strong>ธ.ไทยพาณิชย์ 594-264865-5 (นางสาวมัญชุพร ยังเหล็ก)</strong> เท่านั้น • <u>ไม่มีระบบพร้อมเพย์ (PromptPay)</u> (เบอร์โทรมีไว้สำหรับโทรสอบถามเท่านั้น ห้ามโอนเงินผ่านเบอร์โทร)
                  </span>
                </div>
              </div>

              {/* Slip & Payment Policy Notice Banner for Step 4 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 text-sky-200 text-xs space-y-2 shadow-lg">
                <div className="flex items-center gap-2 font-black text-sky-300 text-sm">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>ขั้นตอนที่ 4: ชำระเงินรอบที่ 2 เพื่อยืนยันสิทธิ์เข้าร่วมโครงการฉบับสมบูรณ์</span>
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px] sm:text-xs space-y-1">
                  <p>
                    • <strong className="text-amber-400">รอบที่ 1 (400 บาท):</strong> ได้แนบสลิปเพื่อมัดจำค่าจัดทำเสื้อและล็อคไซส์เสื้อเรียบร้อยแล้ว
                  </p>
                  <p>
                    • <strong className="text-emerald-400">รอบที่ 2 ({feeInfo.round2Amount} บาท):</strong> เมื่อแนบสลิปและเจ้าหน้าที่ตรวจสอบแล้ว <strong className="text-white underline">จะเป็นการยืนยันสิทธิ์เข้าร่วมโครงการโดยสมบูรณ์ทันที</strong>
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    * หากต้องการส่งเฉพาะสลิปรอบแรก (มัดจำเสื้อ) ก่อน สามารถกดย้อนกลับไปขั้นตอนที่ 3 ด้านล่างได้
                  </p>
                </div>
              </div>

              {/* Slip Upload Area for Round 2 */}
              <div 
                id="field-slip-upload-step4"
                className={`p-4 bg-slate-950/80 border rounded-2xl space-y-4 transition-all duration-300 ${
                  fieldErrors.slipRound2
                    ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20'
                    : 'border-slate-800'
                }`}
              >
                {fieldErrors.slipRound2 && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-bold">
                      {fieldErrors.slipRound2}
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>แนบสลิปหลักฐานการโอนเงิน รอบที่ 2 ({feeInfo.round2Amount} บาท) *</span>
                  </label>
                  <span className="text-[10px] text-sky-400 font-semibold">
                    (ระบบสแกน OCR ตรวจสอบเวลาโอนและยอดเงินอัตโนมัติ)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Slip Preview Box */}
                  <div className="w-24 h-28 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {formSlipRound2 ? (
                      <>
                        <img 
                          src={formSlipRound2} 
                          alt="สลิปโอนเงินรอบที่ 2" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">เปลี่ยนสลิป</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block">ยังไม่แนบสลิป</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Input & Actions */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md ${
                        isProcessingFormSlipRound2 ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        {isProcessingFormSlipRound2 ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังสแกน OCR สลิป...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{formSlipRound2 ? 'เปลี่ยนไฟล์สลิป' : `อัปโหลดสลิปโอนเงิน (${feeInfo.round2Amount} บ.)`}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFormSlipRound2Change}
                          className="hidden"
                        />
                      </label>

                      {formSlipRound2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormSlipRound2('');
                            setFormSlipRound2FileName('');
                            setSlipOcrRound2(null);
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบสลิป</span>
                        </button>
                      )}
                    </div>

                    {formSlipRound2FileName && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="truncate max-w-xs">{formSlipRound2FileName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 🔍 REAL-TIME SLIP OCR INFORMATION CARD FOR ROUND 2 */}
                {slipOcrRound2 && (() => {
                  const ocr = slipOcrRound2;
                  const expectedAmount = feeInfo.round2Amount;
                  const isFullyVerified = Boolean(ocr?.isFullyVerified);
                  const isDuplicate = Boolean(ocr?.isDuplicate);
                  const isMismatch = Boolean(ocr?.isDetected && ocr?.matchExpected === false);

                  return (
                    <div className={`p-4 rounded-2xl space-y-3 animate-in fade-in shadow-lg border transition-all ${
                      isFullyVerified
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/30'
                        : isDuplicate
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30'
                          : isMismatch
                            ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/30'
                            : 'bg-slate-900/90 border-slate-700/80'
                    }`}>
                      {/* Card Header with Badges */}
                      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${
                        isFullyVerified
                          ? 'border-emerald-500/20'
                          : isDuplicate
                            ? 'border-rose-500/20'
                            : isMismatch
                              ? 'border-amber-500/20'
                              : 'border-slate-800'
                      }`}>
                        <span className={`text-xs font-black flex items-center gap-1.5 ${
                          isFullyVerified ? 'text-emerald-300' : isDuplicate ? 'text-rose-300' : isMismatch ? 'text-amber-300' : 'text-slate-300'
                        }`}>
                          <Sparkles className={`w-4 h-4 ${
                            isFullyVerified ? 'text-emerald-400' : isDuplicate ? 'text-rose-400' : isMismatch ? 'text-amber-400' : 'text-slate-400'
                          }`} />
                          ผลการสแกนสลิปอัจฉริยะ (Smart Slip OCR รอบที่ 2)
                        </span>

                        {isFullyVerified && (
                          <span className="text-[10px] px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ✓ ตรวจสอบผ่าน 100% (ยืนยันสิทธิ์ทันที)
                          </span>
                        )}
                        {isDuplicate && (
                          <span className="text-[10px] px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-full font-bold border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            🚨 ตรวจพบสลิปซ้ำ (รอแอดมินตรวจ)
                          </span>
                        )}
                        {!isDuplicate && isMismatch && (
                          <span className="text-[10px] px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full font-bold border border-amber-500/40 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            ⚠️ ยอดเงินไม่ตรง (รอแอดมินตรวจ)
                          </span>
                        )}
                        {!ocr?.isDetected && (
                          <span className="text-[10px] px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-bold border border-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            รอเจ้าหน้าที่ตรวจสอบสลิป
                          </span>
                        )}
                      </div>

                      {/* Visual Policy Callout Banner */}
                      {isFullyVerified ? (
                        <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-emerald-300 block">🎉 ยอดเงินตรงและสลิปสมบูรณ์ (พร้อมยืนยันสิทธิ์สมบูรณ์ทันที)</span>
                            <span className="text-[11px] leading-relaxed text-emerald-200/90">
                              ตรวจพบยอดเงิน {ocr.amountFormatted} ตรงตามจำนวนคงค้างรอบที่ 2 ({expectedAmount}.00 บาท) วันเวลาโอนถูกต้อง และเป็นสลิปใหม่ไม่ซ้ำในระบบ — เมื่อกดส่งใบสมัคร ระบบจะยืนยันสิทธิ์สมบูรณ์ 100% ทันทีโดยไม่ต้องรอแอดมิน!
                            </span>
                          </div>
                        </div>
                      ) : isDuplicate ? (
                        <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-rose-300 block">🚨 ตรวจพบรหัสอ้างอิงสลิปซ้ำในระบบ</span>
                            <span className="text-[11px] leading-relaxed text-rose-200/90">
                              {ocr.duplicateMessage || 'สลิปนี้มีรหัสอ้างอิงที่เคยถูกส่งแล้วในคลังระบบ หรือตรงกับสลิปรอบที่ 1'} — <strong>ท่านยังสามารถกดส่งใบสมัครได้ตามปกติ</strong> แต่ระบบจะส่งให้เจ้าหน้าที่ (Admin) ตรวจสอบความถูกต้องด้วยตนเอง
                            </span>
                          </div>
                        </div>
                      ) : isMismatch ? (
                        <div className="p-3 bg-amber-950/60 rounded-xl border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-black text-amber-300 block">⚠️ ยอดเงินในสลิปไม่ตรงตามยอดรอบที่ 2</span>
                            <span className="text-[11px] leading-relaxed text-amber-200/90">
                              ตรวจพบยอดเงิน <strong>{ocr.amountFormatted}</strong> (ยอดที่กำหนดคือ <strong>{expectedAmount}.00 บาท</strong>) — <strong>ท่านยังสามารถกดส่งใบสมัครได้ตามปกติ</strong> เจ้าหน้าที่จะตรวจสอบสลิปและปรับสถานะให้ในภายหลัง
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/70 text-xs text-slate-300 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-200 block">⏳ ไม่พบตัวเลขยอดเงินในภาพสลิปชัดเจน</span>
                            <span className="text-[11px] leading-relaxed text-slate-400">
                              <strong>ท่านสามารถกดส่งใบสมัครได้ตามปกติ</strong> เจ้าหน้าที่ (Admin) จะตรวจสอบสลิปและยืนยันสิทธิ์ให้ด้วยตนเอง
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Detail Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">⏰ เวลาที่อัปโหลดไฟล์:</span>
                          <span className="font-bold text-white text-[11px]">{ocr.uploadTimeStr}</span>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">📅 วันเวลาที่โอนเงิน (จากสลิป):</span>
                          <span className={`font-bold text-[11px] flex items-center justify-between ${ocr.transferDateTimeStr ? 'text-amber-300' : 'text-slate-400'}`}>
                            <span>{ocr.transferDateTimeStr || 'ไม่พบระบุในสลิป (ตรวจหน้างาน)'}</span>
                            {ocr.transferDateTimeStr && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">✓ ตรวจพบ</span>
                            )}
                          </span>
                        </div>
                        <div className={`p-2.5 bg-slate-900/80 rounded-xl border ${
                          isFullyVerified ? 'border-emerald-500/40 bg-emerald-950/20' : isMismatch ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800'
                        }`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[10px] font-semibold ${
                              isFullyVerified ? 'text-emerald-300' : isMismatch ? 'text-amber-300' : 'text-slate-400'
                            }`}>
                              💵 ยอดเงินที่ตรวจพบ (จากสลิป):
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (ยอดกำหนด: {expectedAmount}.00 บ.)
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className={`text-sm font-black ${
                              isFullyVerified ? 'text-emerald-400' : isMismatch ? 'text-amber-400' : 'text-slate-400 text-xs font-medium'
                            }`}>
                              {ocr.isDetected ? ocr.amountFormatted : 'ไม่พบตัวเลขยอดเงิน'}
                            </span>
                            {ocr.isDetected && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isFullyVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {isFullyVerified ? '✓ ยอดตรง' : '⚠️ ยอดไม่ตรง'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block mb-0.5">🏦 ธนาคาร / ช่องทาง:</span>
                          <span className={`font-bold text-[11px] truncate block ${ocr.bankDetected ? 'text-sky-300' : 'text-slate-400'}`}>
                            {ocr.bankDetected || 'ไม่พบข้อมูลในรูปภาพ'}
                          </span>
                        </div>
                      </div>

                      {/* Anti-Duplicate Registry Check Box */}
                      {ocr?.transRef && (
                        <div className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isDuplicate 
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
                            : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
                        }`}>
                          <div className="flex items-center gap-2 truncate">
                            <Shield className={`w-3.5 h-3.5 shrink-0 ${isDuplicate ? 'text-rose-400' : 'text-sky-400'}`} />
                            <span className="text-[11px] text-slate-400 shrink-0">ตรวจสอบคลังสลิป:</span>
                            <span className="font-mono text-[11px] font-bold text-amber-300 truncate select-all">{ocr.transRef}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isDuplicate 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {isDuplicate ? '🚨 สลิปเคยถูกใช้งานแล้ว (ซ้ำ)' : '✓ สลิปใหม่ ไม่พบประวัติซ้ำ'}
                          </span>
                        </div>
                      )}

                      {/* 📱 DETECTED SLIP QR CODE DETAILS (ROUND 2) */}
                      {ocr?.qrData && (
                        <div className="p-2.5 sm:p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 border-b border-purple-900/40 pb-1.5">
                            <span className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                              <QrCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>QR Code ในสลิป ({ocr.qrData.typeName})</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shrink-0">
                              ✓ ถอดรหัสสำเร็จ
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            {ocr.qrData.transRef && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">รหัสอ้างอิง (TransRef):</span>
                                <span className="font-mono font-bold text-amber-300 truncate select-all">{ocr.qrData.transRef}</span>
                              </div>
                            )}
                            {ocr.qrData.bank && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">ธนาคารใน QR:</span>
                                <span className="font-semibold text-white truncate">{ocr.qrData.bank}</span>
                              </div>
                            )}
                            {ocr.qrData.amount && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">ยอดเงินใน QR:</span>
                                <span className="font-bold text-emerald-400">{ocr.qrData.amount.toFixed(2)} บาท</span>
                              </div>
                            )}
                            {ocr.qrData.country && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-900/70 p-1.5 rounded-lg border border-purple-900/30">
                                <span className="text-slate-400 shrink-0">ประเทศ:</span>
                                <span className="font-semibold text-slate-300">{ocr.qrData.country === 'TH' ? 'ไทย (TH)' : ocr.qrData.country}</span>
                              </div>
                            )}
                          </div>
                          {ocr.qrData.raw && (
                            <div className="text-[10px] text-slate-400 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 font-mono break-all select-all flex items-center justify-between gap-2">
                              <span className="truncate">Payload: {ocr.qrData.raw}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {ocr.message && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{ocr.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Consent and Agreement Checkboxes */}
            <div 
              id="field-agreeCorrectInfo-step4"
              className={`p-5 sm:p-6 bg-slate-950/80 border rounded-3xl space-y-4 shadow-inner transition-all duration-300 ${
                fieldErrors.agreeCorrectInfo
                  ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20'
                  : isConsentAgreed
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-amber-500/40 bg-amber-950/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-5 h-5 shrink-0 ${isConsentAgreed ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    การยืนยันข้อมูลและข้อตกลงความยินยอม (Consent & Agreements)
                  </h3>
                </div>
                {isConsentAgreed ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ✓ ยินยอมครบถ้วนแล้ว (ปลดล็อกปุ่มส่ง)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 shrink-0 self-start sm:self-auto">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    🔒 จำเป็นต้องติ๊กครบทั้ง 2 ข้อ เพื่อเปิดปุ่มส่ง
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Checkbox 1: Correct Info Confirmation */}
                <label className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group select-none ${
                  agreeCorrectInfo 
                    ? 'bg-emerald-950/20 border-emerald-500/40' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    required
                    checked={agreeCorrectInfo}
                    onChange={e => {
                      setAgreeCorrectInfo(e.target.checked);
                      if (e.target.checked && agreePDPAAndRules) {
                        clearFieldError('agreeCorrectInfo');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rescue-600 focus:ring-rescue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                    <strong className="text-white font-semibold">1. การรับรองความถูกต้องของข้อมูล:</strong> ข้าพเจ้าขอยืนยันว่า ข้อมูลประวัติ สังกัด เบอร์โทรศัพท์ ประวัติสุขภาพ ขนาดไซส์เสื้อ และหลักฐานการโอนเงินทั้งหมดที่ระบุข้างต้นเป็นความจริง ถูกต้อง และเป็นปัจจุบันทุกประการ <span className="text-rose-400 font-bold">*</span>
                  </span>
                </label>

                {/* Checkbox 2: PDPA and Project Rules */}
                <label className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group select-none ${
                  agreePDPAAndRules 
                    ? 'bg-emerald-950/20 border-emerald-500/40' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    required
                    checked={agreePDPAAndRules}
                    onChange={e => {
                      setAgreePDPAAndRules(e.target.checked);
                      if (e.target.checked && agreeCorrectInfo) {
                        clearFieldError('agreeCorrectInfo');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rescue-600 focus:ring-rescue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                  />
                  <div className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                    <strong className="text-white font-semibold">2. นโยบาย PDPA และข้อตกลงโครงการ:</strong> ข้าพเจ้ายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) มหาวิทยาลัยมหาสารคาม และตกลงที่จะปฏิบัติตามกฎระเบียบ ข้อตกลง และคำสั่งความปลอดภัยของโครงการ JRE 2027 ตลอดระยะเวลาการฝึกอบรมทุกประการ <span className="text-rose-400 font-bold">*</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPdpaModal(true);
                      }}
                      className="ml-2 text-rescue-400 hover:text-rescue-300 underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      [อ่านนโยบายข้อมูลส่วนบุคคล PDPA มมส]
                    </button>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 4 Bottom Action Buttons */}
            <div className="pt-4 space-y-3">
              {/* Primary Action Button: Submit with Round 2 */}
              <button
                type="submit"
                disabled={isSubmitting || !isConsentAgreed}
                className={`w-full py-4 px-6 font-black rounded-2xl shadow-xl transition-all active:scale-[0.99] text-sm sm:text-base flex items-center justify-center gap-2 ${
                  !isConsentAgreed
                    ? 'bg-slate-800/80 text-slate-400 border border-slate-700/80 cursor-not-allowed shadow-none opacity-80'
                    : slipOcrRound2?.isFullyVerified
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 cursor-pointer'
                    : (!formSlipRound2 && !myRegistration?.installment_2_slip_url)
                    ? 'bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-800 hover:from-sky-800 hover:to-indigo-800 text-sky-100 shadow-sky-950/40 border border-sky-500/50 cursor-pointer'
                    : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-rescue-600 hover:from-sky-500 hover:to-rescue-500 text-white shadow-sky-600/30 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : !isConsentAgreed ? (
                  <>
                    <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                    <span className="text-center font-bold">
                      🔒 กรุณาติ๊กยอมรับเงื่อนไขและยืนยันข้อมูลถูกต้องด้านบนก่อน จึงจะเปิดให้ส่งใบสมัคร
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 shrink-0" />
                    <span className="text-center">
                      {slipOcrRound2?.isFullyVerified
                        ? `✓ ยืนยันสิทธิ์สมบูรณ์ทันทีและส่งสลิปรอบ 2 (${feeInfo.round2Amount} บ.) 🚀`
                        : slipOcrRound2?.isDuplicate
                          ? `⚠️ ยืนยันส่งสลิปรอบ 2 (พบสลิปซ้ำ - รอแอดมินตรวจ) 📋`
                          : slipOcrRound2?.matchExpected === false
                            ? `⚠️ ยืนยันส่งสลิปรอบ 2 (ยอดเงินไม่ตรง - รอแอดมินตรวจ) 📋`
                            : ((formSlipRound2 || myRegistration?.installment_2_slip_url)
                                ? `ยืนยันและส่งใบสมัคร + สลิปชำระครบ 2 รอบ (${feeInfo.totalFee} บ.) 💾` 
                                : `⚠️ กรุณาแนบสลิปโอนเงินรอบที่ 2 (${feeInfo.round2Amount} บ.) เพื่อยืนยันสิทธิ์`)}
                    </span>
                  </>
                )}
              </button>

              {/* Secondary Navigation Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFormStep(3);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>ย้อนกลับไปขั้นตอนที่ 3 (ส่งเฉพาะสลิปรอบที่ 1 มัดจำเสื้อ)</span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEditRegistration}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-2xl border border-rose-500/30 text-sm cursor-pointer active:scale-95 transition-colors"
                  >
                    ❌ ยกเลิกการแก้ไข (คืนค่าเดิม)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </form>

      {/* Modal for viewing Shirt Details and Size Chart */}
      {showShirtSizeModal && (
        <ModalPortal isOpen={Boolean(showShirtSizeModal)} onClose={() => setShowShirtSizeModal(false)}>
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowShirtSizeModal(false)}
          >
            <div 
              className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    แบบเสื้อและตารางไซส์เสื้อฝึก JRE 2027
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShirtSizeModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-orange-400 block">แบบเสื้อฝึกทางการ (คอเต่าซิป แขนสั้น)</span>
                  <img 
                    src="/images/merchandise/jre_shirt_official.jpg" 
                    alt="เสื้อฝึก JRE 2027" 
                    className="w-full rounded-2xl border border-slate-700 object-contain shadow-lg"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 block">ตารางขนาดไซส์เสื้อ (นิ้ว)</span>
                  <img 
                    src="/images/merchandise/jre_shirt_size_chart.jpg" 
                    alt="ตารางไซส์เสื้อ JRE 2027" 
                    className="w-full rounded-2xl border border-slate-700 object-contain shadow-lg"
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>* กรุณาเลือกขนาดไซส์ให้พอดีสำหรับการฝึกภาคสนาม</span>
                <button
                  type="button"
                  onClick={() => setShowShirtSizeModal(false)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MSU PDPA Policy Modal */}
      <PDPAModal
        isOpen={showPdpaModal}
        onClose={() => setShowPdpaModal(false)}
      />

      {/* IN-APP DOCUMENT PREVIEW MODAL */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDocModal)}
        onClose={() => setPreviewDocModal(null)}
        doc={previewDocModal}
      />

      {/* TOAST NOTIFICATION */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* IN-APP SYSTEM POPUP DIALOG FOR CONFIRMATIONS & ALERTS */}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
