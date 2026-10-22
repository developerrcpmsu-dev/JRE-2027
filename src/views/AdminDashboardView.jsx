import React, { useState } from 'react';
import { 
  Users, 
  Settings, 
  Bell, 
  Award, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  Building, 
  Sparkles, 
  X,
  HeartPulse,
  Stethoscope,
  UtensilsCrossed,
  ShieldAlert,
  Eye,
  FileText,
  Image as ImageIcon,
  Upload,
  Loader2,
  Calendar,
  Phone,
  Droplet,
  UserCheck,
  CreditCard,
  MessageSquare,
  FileCheck,
  CheckCircle,
  XCircle,
  Send,
  FileDown,
  Maximize2,
  Clock,
  RotateCcw,
  Shirt,
  QrCode,
  PackageCheck,
  Camera,
  Star,
  Check,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Lock,
  Key,
  Shield,
  EyeOff,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Tag,
  ShoppingBag,
  Copy,
  Filter,
  Globe,
  User,
  Mail,
  Printer,
  LogOut,
  Crown,
  MapPin
} from 'lucide-react';
import { DataService, mergeAndDeduplicateAccounts, ensureHostedUrl } from '../supabase';
import { exportRegistrationsToExcel, exportMerchandiseOrdersToExcel, resolveFirstAndLastName } from '../utils/excelExporter';
import { 
  DEFAULT_PAYMENT_CONFIG, 
  DEFAULT_MERCHANDISE_CONFIG,
  DEFAULT_SPEAKERS,
  DEFAULT_TEAM_MEMBERS,
  STAFF_SHIRT_FEE,
  OFFICIAL_NETWORK_INSTITUTIONS,
  isMsuInstitution,
  isStaffRegistration,
  resolveGender,
  resolveUniversityInfo,
  normalizeShirtSize,
  getRegistrationFeeDetails,
  getSpeakerCategory,
  SPEAKER_CATEGORIES,
  getApplicantMedical,
  getApplicantAllergy,
  hasHealthCondition,
  hasMedicalCondition,
  hasFoodOrDrugAllergy,
  getCateringCategory,
  ADMIN_MESSAGE_SENDERS,
  STANDARD_REQUESTABLE_DOCS,
  resolveMessageSenderInfo
} from '../data/defaultData';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import UniversalScannerModal from '../components/UniversalScannerModal';
import CateringHealthModal from '../components/CateringHealthModal';
import CateringHealthView from './CateringHealthView';
import { getRegistrationCardData } from '../utils/idCard';
import ModalPortal from '../components/ModalPortal';
import ConfirmModal, { useConfirmModal } from '../components/ConfirmModal';
import ShirtOrderPrintModal from '../components/ShirtOrderPrintModal';
import RegistrationCountdown from '../components/RegistrationCountdown';
import { 
  formatDateTimeLocalInput, 
  formatThaiDateTime, 
  getRegistrationScheduleStatus 
} from '../utils/registrationSchedule';
import * as XLSX from 'xlsx';
import { resolveUserExtraDetails } from '../utils/userUtils';

export default function AdminDashboardView({
  initialTab = 'applicants',
  onTabChange,
  registrations,
  onUpdateAllocation,
  onDeleteRegistration,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  formsConfig,
  onSaveFormsConfig,
  paymentConfig,
  onSavePaymentConfig,
  teamMembers,
  onSaveTeam,
  speakers,
  onSaveSpeakers,
  merchandiseConfig,
  onSaveMerchandiseConfig,
  merchandiseOrders = [],
  onUpdateMerchandiseOrder,
  onVerifyOrderPayment,
  onMarkOrderReceived,
  userAccounts: propUserAccounts = [],
  onRefreshUserAccounts,
  onRefreshRegistrations,
  onAdminLogout
}) {
  const resolveInitialTab = (tab) => {
    if (tab === 'payment' || tab === 'payment_settings' || tab === 'finance') return 'payment_settings';
    if (tab === 'shirts' || tab === 'shirt' || tab === 'merchandise' || tab === 'merch' || tab === 'orders') return 'merchandise';
    if (tab === 'users' || tab === 'accounts') return 'users';
    if (tab === 'forms' || tab === 'tests' || tab === 'evaluations') return 'forms';
    if (tab === 'announcements' || tab === 'news' || tab === 'posts') return 'announcements';
    if (tab === 'speakers' || tab === 'speaker' || tab === 'president' || tab === 'presidents' || tab === 'advisor' || tab === 'advisors') return 'speakers';
    if (tab === 'team' || tab === 'staff') return 'team';
    if (tab === 'scanner' || tab === 'qr') return 'merchandise';
    if (tab === 'catering' || tab === 'health' || tab === 'catering-health' || tab === 'food' || tab === 'welfare') return 'catering';
    return tab || 'applicants';
  };

  const [activeTab, setActiveTab] = useState(() => resolveInitialTab(initialTab));

  React.useEffect(() => {
    if (initialTab) {
      const resolved = resolveInitialTab(initialTab);
      if (resolved !== activeTab) {
        setActiveTab(resolved);
      }
      if (initialTab === 'president' || initialTab === 'presidents') {
        setSpeakerCategoryFilter('president');
      } else if (initialTab === 'advisor' || initialTab === 'advisors') {
        setSpeakerCategoryFilter('advisor');
      } else if (initialTab === 'speakers' || initialTab === 'speaker') {
        // default to 'all' or keep
      }
      if (initialTab === 'scanner' || initialTab === 'qr') {
        setShowUniversalScanner(true);
      }
    }
  }, [initialTab]);

  // In-app Popup Modal for Confirmations, Alerts & Prompts
  const { confirmModalProps, askConfirm, askAlert, askPrompt } = useConfirmModal();

  // Edit Safeguard States (Locked / View-Only by default to prevent accidental edits)
  const [isEditingProfileModal, setIsEditingProfileModal] = useState(false);
  const [isEditingPaymentSettings, setIsEditingPaymentSettings] = useState(false);
  const [isEditingForms, setIsEditingForms] = useState(false);
  const [isEditingMerchConfig, setIsEditingMerchConfig] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const getUrlSub = (t) => {
    if (t === 'payment_settings') return 'payment';
    if (t === 'merchandise') return 'shirts';
    if (t === 'catering') return 'catering';
    return t;
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;

    if (isEditingPaymentSettings || isEditingForms || isEditingMerchConfig) {
      askConfirm({
        title: '⚠️ มีการแก้ไขที่ยังไม่ได้บันทึก',
        message: 'ท่านกำลังอยู่ในโหมดแก้ไขข้อมูลและยังไม่ได้กดบันทึก ต้องการยกเลิกการแก้ไขและสลับแท็บใช่หรือไม่? (การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะถูกยกเลิก)',
        confirmText: 'ละทิ้งการแก้ไขและสลับแท็บ',
        cancelText: 'อยู่หน้านี้ต่อ',
        variant: 'warning',
        onConfirm: () => {
          if (isEditingPaymentSettings) {
            setLocalPayment(paymentConfig || DEFAULT_PAYMENT_CONFIG);
            setIsEditingPaymentSettings(false);
          }
          if (isEditingForms) {
            setLocalForms(formsConfig || {
              pretest: { title: 'แบบทดสอบก่อนเรียน (Pre-Test) 2027', url: '', enabled: false },
              posttest: { title: 'แบบทดสอบหลังเรียน (Post-Test)', url: '', enabled: false },
              evaluation: { title: 'แบบประเมินความพึงพอใจ (JRE 2027)', url: '', enabled: false }
            });
            setIsEditingForms(false);
          }
          if (isEditingMerchConfig) {
            setLocalMerchConfig(sanitizeAdminMerchConfig(merchandiseConfig, paymentConfig));
            setIsEditingMerchConfig(false);
          }
          setActiveTab(tab);
          if (onTabChange) {
            onTabChange(getUrlSub(tab));
          }
          if (tab === 'users') {
            loadUserAccounts();
          }
        }
      });
      return;
    }

    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(getUrlSub(tab));
    }
    if (tab === 'users') {
      loadUserAccounts();
    }
  };

  // Helper to ensure Merchandise Config always uses the central project bank account and official shirt spec
  const sanitizeAdminMerchConfig = (cfg, payCfg) => {
    const base = cfg || DEFAULT_MERCHANDISE_CONFIG;
    const payment = base.payment || {};
    const isLegacyBank = !payment.bank_name || 
      payment.bank_name.includes('กรุงไทย') || 
      payment.account_number === '984-0-12345-6' || 
      payment.promptpay === '098-765-4321';

    const cleanPayment = isLegacyBank ? {
      bank_name: payCfg?.bank_name || DEFAULT_MERCHANDISE_CONFIG.payment.bank_name,
      account_number: payCfg?.bank_account_number || DEFAULT_MERCHANDISE_CONFIG.payment.account_number,
      account_name: payCfg?.bank_account_name || DEFAULT_MERCHANDISE_CONFIG.payment.account_name,
      promptpay: payCfg?.bank_promptpay || DEFAULT_MERCHANDISE_CONFIG.payment.promptpay,
      contact_phone: payCfg?.contact_phone || DEFAULT_MERCHANDISE_CONFIG.payment.contact_phone,
      note: payment.note || DEFAULT_MERCHANDISE_CONFIG.payment.note
    } : payment;

    const products = (base.products || []).map(p => {
      if (p.id === 'prod_official_shirt') {
        return {
          ...p,
          name: 'เสื้อฝึก Joint Response Exercise (JRE 2027) คอเต่าซิป แขนสั้น โทนสีเทา–ดำ',
          base_price: (p.base_price === 350 || !p.base_price) ? 400 : p.base_price,
          description: (p.description?.includes('350') || p.description?.includes('เสื้อโปโลปฏิบัติการ'))
            ? DEFAULT_MERCHANDISE_CONFIG.products[0].description
            : p.description
        };
      }
      return p;
    });

    return {
      ...base,
      payment: cleanPayment,
      products: products.length > 0 ? products : DEFAULT_MERCHANDISE_CONFIG.products,
      pickup: {
        ...DEFAULT_MERCHANDISE_CONFIG.pickup,
        ...(base.pickup || {})
      }
    };
  };

  // Merchandise State
  const [localMerchConfig, setLocalMerchConfig] = useState(() => {
    return sanitizeAdminMerchConfig(merchandiseConfig, paymentConfig);
  });
  const [isSavingMerch, setIsSavingMerch] = useState(false);
  const [showUniversalScanner, setShowUniversalScanner] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showIDCardScanner, setShowIDCardScanner] = useState(false);
  const [showShirtPrintModal, setShowShirtPrintModal] = useState(false);
  const [merchSearchQuery, setMerchSearchQuery] = useState('');
  const [merchStatusFilter, setMerchStatusFilter] = useState('all');
  const [merchSourceFilter, setMerchSourceFilter] = useState('all'); // 'all', 'registration', 'merchandise'
  const [merchSizeFilter, setMerchSizeFilter] = useState('all'); // 'all', 'SS', 'S', 'M', 'L', 'XL', '2XL', etc.
  const [merchPaymentFilter, setMerchPaymentFilter] = useState('all'); // 'all', 'paid', 'pending', 'unpaid'
  const [merchDeliveryFilter, setMerchDeliveryFilter] = useState('all'); // 'all', 'pending', 'received'
  const [merchUniFilter, setMerchUniFilter] = useState('all'); // 'all' or university shortTag
  const [merchRoleFilter, setMerchRoleFilter] = useState('all'); // 'all', 'participant', 'staff'
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeMeasurement, setNewSizeMeasurement] = useState('');
  const [newSizeExtra, setNewSizeExtra] = useState(0);
  const [previewMerchSlip, setPreviewMerchSlip] = useState(null);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);
  const [previewProductImageModal, setPreviewProductImageModal] = useState(null);

  // Normalize shirt size helper
  const normalizeSize = (rawSize) => {
    if (!rawSize) return 'L';
    const clean = String(rawSize).trim().toUpperCase();
    if (clean === 'XXL' || clean === '2XL') return '2XL';
    if (clean === '3XL' || clean === 'XXXL') return '3XL';
    if (clean === '4XL' || clean === 'XXXXL') return '4XL';
    if (clean === '5XL') return '5XL';
    if (clean === 'SS' || clean === 'XS') return 'SS';
    if (clean === 'S') return 'S';
    if (clean === 'M') return 'M';
    if (clean === 'L') return 'L';
    if (clean === 'XL') return 'XL';
    return clean || 'L';
  };

  const SIZE_MEASUREMENTS = {
    'SS': 'อก 34" / ยาว 25"',
    'S': 'อก 36" / ยาว 26"',
    'M': 'อก 38" / ยาว 27"',
    'L': 'อก 40" / ยาว 28"',
    'XL': 'อก 42" / ยาว 29"',
    '2XL': 'อก 44" / ยาว 30"',
    '3XL': 'อก 46" / ยาว 31"',
    '4XL': 'อก 48" / ยาว 32"',
    '5XL': 'อก 50" / ยาว 32"',
    'อื่นๆ': 'ขนาดสั่งตัดพิเศษ'
  };

  // Trainee registrations unified as official training shirt records
  const traineeShirtRecords = React.useMemo(() => {
    return (registrations || []).map((r) => {
      const { firstName, lastName } = resolveFirstAndLastName(r);
      const isStaff = isStaffRegistration(r);
      const gender = resolveGender(r);
      const uniInfo = resolveUniversityInfo(r);
      const isRound1Paid = r.installment_1_status === 'paid' || r.payment_status === 'paid' || r.payment_status === 'full';
      const isR2Paid = r.installment_2_status === 'paid' && Boolean(r.installment_2_slip_url);
      const isFullyPaid = isStaff
        ? (r.payment_status === 'paid' || r.payment_status === 'full' || r.installment_1_status === 'paid')
        : (r.payment_status === 'paid' || r.payment_status === 'full' || (r.installment_1_status === 'paid' && isR2Paid));
      const isReceived = r.shirt_pickup_status === 'received' || r.shirt_received === true;
      const rawSize = (r.shirt_size || 'L').trim();
      const normSize = normalizeSize(rawSize);
      const orderNumber = `JRE27-SHIRT-${(r.id || r.user_id || 'REG').slice(0, 6).toUpperCase()}`;
      const expectedTotal = isStaff ? STAFF_SHIRT_FEE : (r.payment_amount || (uniInfo.isMsu ? 650 : 850));

      return {
        id: `reg_shirt_${r.id || r.user_id}`,
        user_id: r.user_id || r.id,
        reg_id: r.id || r.user_id,
        source: 'registration',
        source_label: isStaff ? '🛠️ เสื้อ Staff คณะทำงาน (280 บ.)' : '📋 เสื้อฝึกผู้สมัคร (รวมในค่าสมัคร)',
        is_staff: isStaff,
        gender,
        uni_short: uniInfo.shortTag,
        uni_name: uniInfo.university,
        uni_club: uniInfo.club,
        order_number: orderNumber,
        first_name: firstName,
        last_name: lastName,
        customer_name: r.full_name_affiliation || `${firstName} ${lastName}`.trim() || r.user_email || 'ผู้สมัคร JRE 2027',
        nickname: r.nickname || '-',
        callsign: r.callsign || '-',
        institution: r.institution || '-',
        phone: r.phone || '-',
        user_email: r.user_email || '',
        group_assigned: r.group_assigned || '-',
        room_assigned: r.room_assigned || '-',
        size: rawSize,
        normalized_size: normSize,
        quantity: 1,
        product_name: 'เสื้อฝึก JRE 2027 คอเต่าซิป แขนสั้น โทนสีเทา–ดำ',
        color: 'สีเทาตัดดำ (Official Tactical Gray-Black)',
        total_amount: expectedTotal,
        payment_status: isFullyPaid ? 'paid_verified' : isRound1Paid ? 'paid_verified' : (r.payment_slip_url || r.installment_1_slip_url) ? 'pending_verification' : 'unpaid',
        payment_badge: isStaff
          ? (isFullyPaid ? 'ชำระแล้ว (Staff 280 บ.)' : (r.payment_slip_url || r.installment_1_slip_url) ? 'รอตรวจสลิป Staff (280 บ.)' : 'ยังไม่ชำระ (Staff 280 บ.)')
          : (isFullyPaid ? 'ชำระเต็มจำนวน' : isRound1Paid ? 'ชำระงวดที่ 1 (ค่าเสื้อ)' : (r.payment_slip_url || r.installment_1_slip_url) ? 'รอตรวจสลิป' : 'ยังไม่ชำระ'),
        pickup_status: isReceived ? 'received' : 'pending',
        pickup_at: r.shirt_received_date || null,
        slip_url: r.payment_slip_url || r.installment_1_slip_url || r.slip_url || null,
        slip_uploaded_at: r.payment_slip_date || r.installment_1_slip_date || null,
        created_at: r.created_at || new Date().toISOString(),
        rawRegistration: r
      };
    });
  }, [registrations]);

  // Merchandise store orders records
  const merchandiseStoreRecords = React.useMemo(() => {
    return (merchandiseOrders || []).map((ord) => {
      const { firstName, lastName } = resolveFirstAndLastName(ord);
      const isVerified = ord.payment_status === 'paid_verified';
      const isReceived = ord.pickup_status === 'received';
      const totalQty = (ord.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
      const primarySize = ord.items?.[0]?.size ? String(ord.items[0].size).toUpperCase() : 'L';
      const normSize = normalizeSize(primarySize);

      return {
        id: ord.id,
        user_id: ord.user_id,
        source: 'merchandise',
        source_label: '🛍️ สั่งซื้อเพิ่ม (หน้าร้าน JRE)',
        is_staff: false,
        gender: '-',
        uni_short: 'สั่งซื้อหน้าร้าน',
        uni_name: 'สั่งซื้อเพิ่ม (หน้าร้าน JRE)',
        uni_club: '-',
        order_number: ord.order_number,
        first_name: firstName,
        last_name: lastName,
        customer_name: ord.customer_name || 'ลูกค้าหน้าร้าน',
        nickname: '-',
        callsign: '-',
        institution: '-',
        phone: ord.customer_phone || '-',
        user_email: ord.user_email || '',
        group_assigned: '-',
        room_assigned: '-',
        size: primarySize,
        normalized_size: normSize,
        quantity: totalQty,
        product_name: ord.items?.map(it => `${it.product_name} (${it.size} x${it.quantity})`).join(', ') || 'สินค้า JRE 2027',
        color: ord.items?.[0]?.color || '-',
        items: ord.items || [],
        shipping_address: ord.shipping_address || null,
        pickup_method: ord.pickup_method || 'pickup',
        total_amount: ord.total_amount || 0,
        payment_status: ord.payment_status || 'pending_verification',
        payment_badge: isVerified ? 'ชำระแล้ว (อนุมัติสลิป)' : ord.payment_status === 'pending_verification' ? 'รอตรวจสลิป' : 'ยังไม่ชำระ',
        pickup_status: isReceived ? 'received' : 'pending',
        pickup_at: ord.pickup_at || null,
        slip_url: ord.slip_url || null,
        slip_uploaded_at: ord.slip_uploaded_at || null,
        created_at: ord.created_at || new Date().toISOString(),
        rawOrder: ord
      };
    });
  }, [merchandiseOrders]);

  // Combined statistics for sizes
  const sizeStats = React.useMemo(() => {
    const STANDARD_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'];
    const counts = {};
    const receivedCounts = {};
    const pendingCounts = {};
    const sizePeople = {};

    STANDARD_SIZES.forEach(s => {
      counts[s] = 0;
      receivedCounts[s] = 0;
      pendingCounts[s] = 0;
      sizePeople[s] = [];
    });

    let totalShirts = 0;
    let totalReceivedShirts = 0;
    let totalPendingShirts = 0;

    // 1. Process Trainee Registrations
    traineeShirtRecords.forEach(rec => {
      const s = STANDARD_SIZES.includes(rec.normalized_size) ? rec.normalized_size : 'อื่นๆ';
      counts[s] = (counts[s] || 0) + 1;
      totalShirts += 1;
      if (rec.pickup_status === 'received') {
        receivedCounts[s] = (receivedCounts[s] || 0) + 1;
        totalReceivedShirts += 1;
      } else {
        pendingCounts[s] = (pendingCounts[s] || 0) + 1;
        totalPendingShirts += 1;
      }
      sizePeople[s].push(rec);
    });

    // 2. Process Store Orders
    merchandiseStoreRecords.forEach(rec => {
      (rec.items || []).forEach(it => {
        const norm = normalizeSize(it.size);
        const s = STANDARD_SIZES.includes(norm) ? norm : 'อื่นๆ';
        const qty = it.quantity || 1;
        counts[s] = (counts[s] || 0) + qty;
        totalShirts += qty;
        if (rec.pickup_status === 'received') {
          receivedCounts[s] = (receivedCounts[s] || 0) + qty;
          totalReceivedShirts += qty;
        } else {
          pendingCounts[s] = (pendingCounts[s] || 0) + qty;
          totalPendingShirts += qty;
        }
        sizePeople[s].push({
          ...rec,
          itemSize: it.size,
          itemQty: qty
        });
      });
    });

    return {
      STANDARD_SIZES,
      counts,
      receivedCounts,
      pendingCounts,
      sizePeople,
      totalShirts,
      totalReceivedShirts,
      totalPendingShirts,
      allShirtItems: [...traineeShirtRecords, ...merchandiseStoreRecords]
    };
  }, [traineeShirtRecords, merchandiseStoreRecords]);

  // Comprehensive University Breakdown: Gender (Male/Female for Room Allocation), Shirt Sizes (SS..5XL), Staff (280 THB) & Finances
  const universitySummary = React.useMemo(() => {
    const STANDARD_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'];
    const uniMap = {};

    const ensureUniBucket = (uniInfo) => {
      const key = uniInfo.shortTag || 'อื่นๆ';
      if (!uniMap[key]) {
        const sizesObj = {};
        STANDARD_SIZES.forEach(sz => { sizesObj[sz] = 0; });
        uniMap[key] = {
          key,
          shortTag: key,
          label: uniInfo.university || key,
          university: uniInfo.university || key,
          club: uniInfo.club || '-',
          isMsu: Boolean(uniInfo.isMsu),
          totalPeople: 0,
          male: 0,
          female: 0,
          staff: 0,
          maleCount: 0,
          femaleCount: 0,
          unknownGenderCount: 0,
          maleRoomAssigned: 0,
          maleRoomPending: 0,
          femaleRoomAssigned: 0,
          femaleRoomPending: 0,
          participantCount: 0,
          staffCount: 0,
          staffPaidCount: 0,
          totalShirts: 0,
          shirtSizes: sizesObj,
          shirtCounts: sizesObj,
          expectedAmount: 0,
          collectedAmount: 0,
          outstandingAmount: 0,
          fullyPaidCount: 0,
          partialPaidCount: 0,
          pendingReviewCount: 0,
          unpaidCount: 0,
          people: []
        };
      }
      return uniMap[key];
    };

    // Pre-initialize all 8 official network universities in order so they always appear clearly
    OFFICIAL_NETWORK_INSTITUTIONS.forEach(inst => {
      ensureUniBucket(inst);
    });

    (registrations || []).forEach(reg => {
      const uniInfo = resolveUniversityInfo(reg);
      const bucket = ensureUniBucket(uniInfo);
      const isStaff = isStaffRegistration(reg);
      const gender = resolveGender(reg);
      const normSize = normalizeSize(reg.shirt_size || 'L');
      const sizeKey = STANDARD_SIZES.includes(normSize) ? normSize : 'อื่นๆ';
      const hasRoom = Boolean(reg.room_assigned && String(reg.room_assigned).trim() !== '');

      bucket.totalPeople += 1;
      bucket.totalShirts += 1;
      bucket.shirtSizes[sizeKey] = (bucket.shirtSizes[sizeKey] || 0) + 1;

      if (gender === 'ชาย') {
        bucket.maleCount += 1;
        bucket.male = bucket.maleCount;
        if (hasRoom) bucket.maleRoomAssigned += 1;
        else bucket.maleRoomPending += 1;
      } else if (gender === 'หญิง') {
        bucket.femaleCount += 1;
        bucket.female = bucket.femaleCount;
        if (hasRoom) bucket.femaleRoomAssigned += 1;
        else bucket.femaleRoomPending += 1;
      } else {
        bucket.unknownGenderCount += 1;
      }

      if (isStaff) {
        bucket.staffCount += 1;
        bucket.staff = bucket.staffCount;
      } else {
        bucket.participantCount += 1;
      }

      // Financial calculation per person (Staff = 280 single payment, never installment)
      const isMsu = uniInfo.isMsu;
      const totalFee = isStaff
        ? STAFF_SHIRT_FEE
        : (isMsu
            ? (paymentConfig?.fee_total_msu || 650)
            : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850));
      const round1Fee = isMsu
        ? (paymentConfig?.installment_round1_amount_msu || 400)
        : (paymentConfig?.installment_round1_amount_external || paymentConfig?.installment_round1_amount || 400);
      const round2Fee = isMsu
        ? (paymentConfig?.installment_round2_amount_msu || 250)
        : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);

      const isInstallment = !isStaff && (reg.payment_plan === 'installment' || Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url));
      bucket.expectedAmount += totalFee;

      if (isInstallment) {
        const isR1Paid = reg.installment_1_status === 'paid';
        const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url);
        const hasPending = reg.installment_1_status === 'pending_review' || reg.installment_2_status === 'pending_review';
        if (isR1Paid && isR2Paid) {
          bucket.fullyPaidCount += 1;
          bucket.collectedAmount += totalFee;
        } else if (hasPending) {
          bucket.pendingReviewCount += 1;
          if (isR1Paid) {
            bucket.collectedAmount += round1Fee;
            bucket.outstandingAmount += round2Fee;
          } else {
            bucket.outstandingAmount += totalFee;
          }
        } else if (isR1Paid) {
          bucket.partialPaidCount += 1;
          bucket.collectedAmount += round1Fee;
          bucket.outstandingAmount += round2Fee;
        } else {
          bucket.unpaidCount += 1;
          bucket.outstandingAmount += totalFee;
        }
      } else {
        const isPaid = reg.payment_status === 'paid' || (isStaff && reg.installment_1_status === 'paid');
        const isPending = reg.payment_status === 'pending_review' || (isStaff && reg.installment_1_status === 'pending_review');
        if (isPaid) {
          bucket.fullyPaidCount += 1;
          if (isStaff) bucket.staffPaidCount += 1;
          bucket.collectedAmount += totalFee;
        } else if (isPending) {
          bucket.pendingReviewCount += 1;
          bucket.outstandingAmount += totalFee;
        } else {
          bucket.unpaidCount += 1;
          bucket.outstandingAmount += totalFee;
        }
      }

      bucket.people.push(reg);
    });

    const list = Object.values(uniMap);
    // Keep official institutions in order, followed by any custom institutions with > 0 people
    const officialTags = new Set(OFFICIAL_NETWORK_INSTITUTIONS.map(i => i.shortTag));
    const orderedList = [
      ...OFFICIAL_NETWORK_INSTITUTIONS.map(i => uniMap[i.shortTag]),
      ...list.filter(u => !officialTags.has(u.shortTag) && u.totalPeople > 0)
    ].filter(Boolean);

    const totals = {
      totalPeople: orderedList.reduce((acc, u) => acc + u.totalPeople, 0),
      male: orderedList.reduce((acc, u) => acc + u.maleCount, 0),
      female: orderedList.reduce((acc, u) => acc + u.femaleCount, 0),
      staff: orderedList.reduce((acc, u) => acc + u.staffCount, 0),
      totalShirts: orderedList.reduce((acc, u) => acc + u.totalShirts, 0),
      shirtCounts: STANDARD_SIZES.reduce((acc, sz) => {
        acc[sz] = orderedList.reduce((sum, u) => sum + (u.shirtSizes[sz] || 0), 0);
        return acc;
      }, {})
    };

    return {
      STANDARD_SIZES,
      list: orderedList,
      activeList: orderedList.filter(u => u.totalPeople > 0),
      byTag: uniMap,
      totals
    };
  }, [registrations, paymentConfig]);

  // Unified items filtered for search and inspector
  const filteredShirtItems = React.useMemo(() => {
    return [...traineeShirtRecords, ...merchandiseStoreRecords].filter(item => {
      // 1. Source filter
      if (merchSourceFilter !== 'all' && item.source !== merchSourceFilter) {
        return false;
      }

      // 1b. University filter
      if (merchUniFilter !== 'all' && item.uni_short !== merchUniFilter) {
        return false;
      }

      // 1c. Role filter (participant vs staff)
      if (merchRoleFilter === 'staff' && !item.is_staff) {
        return false;
      }
      if (merchRoleFilter === 'participant' && (item.is_staff || item.source !== 'registration')) {
        return false;
      }

      // 2. Size filter
      if (merchSizeFilter !== 'all') {
        if (item.source === 'registration') {
          if (item.normalized_size !== merchSizeFilter) return false;
        } else {
          const hasSize = (item.items || []).some(it => normalizeSize(it.size) === merchSizeFilter);
          if (!hasSize && item.normalized_size !== merchSizeFilter) return false;
        }
      }

      // 3. Delivery status filter
      if (merchDeliveryFilter !== 'all' && item.pickup_status !== merchDeliveryFilter) {
        return false;
      }

      // 4. Payment status filter
      if (merchPaymentFilter !== 'all') {
        if (merchPaymentFilter === 'paid' && item.payment_status !== 'paid_verified') return false;
        if (merchPaymentFilter === 'pending' && item.payment_status !== 'pending_verification') return false;
        if (merchPaymentFilter === 'unpaid' && item.payment_status !== 'unpaid') return false;
      }

      // 5. Legacy status filter
      if (merchStatusFilter !== 'all') {
        if (merchStatusFilter === 'received' && item.pickup_status !== 'received') return false;
        if (merchStatusFilter === 'pending_verification' && item.payment_status !== 'pending_verification') return false;
        if (merchStatusFilter === 'paid_verified' && (item.payment_status !== 'paid_verified' || item.pickup_status === 'received')) return false;
      }

      // 6. Search Query
      if (merchSearchQuery.trim()) {
        const q = merchSearchQuery.toLowerCase().trim();
        const matchesName = item.customer_name?.toLowerCase().includes(q);
        const matchesCallsign = item.callsign?.toLowerCase().includes(q);
        const matchesNickname = item.nickname?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.includes(q);
        const matchesEmail = item.user_email?.toLowerCase().includes(q);
        const matchesOrder = item.order_number?.toLowerCase().includes(q);
        const matchesInst = item.institution?.toLowerCase().includes(q) || item.uni_short?.toLowerCase().includes(q);
        const matchesSize = item.size?.toLowerCase().includes(q);
        return matchesName || matchesCallsign || matchesNickname || matchesPhone || matchesEmail || matchesOrder || matchesInst || matchesSize;
      }

      return true;
    });
  }, [traineeShirtRecords, merchandiseStoreRecords, merchSourceFilter, merchUniFilter, merchRoleFilter, merchSizeFilter, merchDeliveryFilter, merchPaymentFilter, merchStatusFilter, merchSearchQuery]);

  React.useEffect(() => {
    if (merchandiseConfig) {
      setLocalMerchConfig(sanitizeAdminMerchConfig(merchandiseConfig, paymentConfig));
    }
  }, [merchandiseConfig, paymentConfig]);

  const handleSyncBankFromPaymentConfig = () => {
    const bankName = localPayment?.bank_name || 'ธนาคารไทยพาณิชย์';
    const accNumber = localPayment?.bank_account_number || '594-264865-5';
    const accName = localPayment?.bank_account_name || 'นางสาวมัญชุพร ยังเหล็ก';
    const promptpay = localPayment?.bank_promptpay || '';
    const phone = localPayment?.contact_phone || '098-329-6762';
    
    setLocalMerchConfig(prev => ({
      ...prev,
      payment: {
        ...(prev.payment || {}),
        bank_name: bankName,
        account_number: accNumber,
        account_name: accName,
        promptpay: promptpay,
        contact_phone: phone,
        note: prev.payment?.note || 'กรุณาโอนเงินตามยอดที่ระบุและแนบหลักฐานสลิปโอนเงินทุกครั้ง'
      }
    }));
    triggerToast('ซิงค์ข้อมูลบัญชีธนาคารกลาง (SCB 594-264865-5) เรียบร้อยแล้ว');
  };

  // Search & Filter for Applicants
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'special_care', 'unpaid', 'pending_review', 'paid', 'no_group', 'has_group', 'staff'
  const [bloodFilter, setBloodFilter] = useState('all');
  const [uniFilter, setUniFilter] = useState('all'); // 'all' or university shortTag
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'ชาย', 'หญิง'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'participant', 'staff'

  // Inline Quick Edit Allocation State
  const [editingUserId, setEditingUserId] = useState(null);
  const [allocGroup, setAllocGroup] = useState('');
  const [allocRoom, setAllocRoom] = useState('');
  const [allocShirtSize, setAllocShirtSize] = useState('L');
  const [customSizeDrafts, setCustomSizeDrafts] = useState({});
  const [updatingSizeId, setUpdatingSizeId] = useState(null);

  // Full Profile & Remarks Modal State
  const [profileModalReg, setProfileModalReg] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('info'); // 'info', 'payment', 'messages', 'docs'
  
  // Modal Fields
  const [modalGroup, setModalGroup] = useState('');
  const [modalRoom, setModalRoom] = useState('');
  const [modalShirtSize, setModalShirtSize] = useState('L');
  const [modalSpecialCare, setModalSpecialCare] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalInstitution, setModalInstitution] = useState('');
  const [modalMedical, setModalMedical] = useState('');
  const [modalAllergy, setModalAllergy] = useState('');
  const [modalTraining, setModalTraining] = useState('');
  const [modalIsStaff, setModalIsStaff] = useState(false);
  const [modalGender, setModalGender] = useState('ชาย');
  const [showCateringModal, setShowCateringModal] = useState(false);
  
  // Payment Modal Fields
  const [modalPaymentPlan, setModalPaymentPlan] = useState('full');
  const [modalPaymentStatus, setModalPaymentStatus] = useState('unpaid');
  const [modalPaymentAmount, setModalPaymentAmount] = useState(650);
  const [modalPaymentBank, setModalPaymentBank] = useState('');
  const [modalPaymentNotes, setModalPaymentNotes] = useState('');

  // Admin Direct Message State
  const [newMsgText, setNewMsgText] = useState('');
  const [msgSenderKey, setMsgSenderKey] = useState('admin_central');
  const [msgCustomSenderName, setMsgCustomSenderName] = useState('');
  const [msgCustomSystemName, setMsgCustomSystemName] = useState('');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgAttachmentUrl, setMsgAttachmentUrl] = useState('');
  const [msgAttachmentName, setMsgAttachmentName] = useState('');
  const [isUploadingMsgAttachment, setIsUploadingMsgAttachment] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Document Request State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocRequired, setNewDocRequired] = useState(true);
  const [newDocNote, setNewDocNote] = useState('');
  const [docRequesterKey, setDocRequesterKey] = useState('registration_docs');
  const [notifyUserOnDocAction, setNotifyUserOnDocAction] = useState(true);
  const [uploadingAdminDocId, setUploadingAdminDocId] = useState(null);

  // Preview Slip Modal
  const [previewSlipUrl, setPreviewSlipUrl] = useState(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [handoverLoadingId, setHandoverLoadingId] = useState(null);

  // Announcement Form Modal State
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState('general');
  const [annUrl, setAnnUrl] = useState('');
  const [annLabel, setAnnLabel] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [annImages, setAnnImages] = useState([]); // Array of string URLs
  const [annPdfUrl, setAnnPdfUrl] = useState('');
  const [annPdfName, setAnnPdfName] = useState('');
  const [annSlug, setAnnSlug] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const handleCloseAnnModal = () => {
    if (annTitle.trim() || annContent.trim()) {
      askConfirm({
        title: 'ยกเลิกการแก้ไขประกาศ',
        message: 'คุณกำลังกรอกหรือแก้ไขประกาศและยังไม่ได้บันทึก ต้องการยกเลิกและปิดหน้าต่างใช่หรือไม่? การเปลี่ยนแปลงจะถูกละทิ้ง',
        confirmText: 'ปิดหน้าต่าง (ละทิ้งข้อมูล)',
        cancelText: 'แก้ไขต่อ',
        variant: 'warning',
        onConfirm: () => {
          setShowAnnModal(false);
        }
      });
      return;
    }
    setShowAnnModal(false);
  };

  // Forms Config State
  const [localForms, setLocalForms] = useState(formsConfig || {
    pretest: { title: 'แบบทดสอบก่อนเรียน (Pre-Test) 2027', url: '', enabled: false },
    posttest: { title: 'แบบทดสอบหลังเรียน (Post-Test)', url: '', enabled: false },
    evaluation: { title: 'แบบประเมินความพึงพอใจ (JRE 2027)', url: '', enabled: false }
  });
  const [formsSavedMsg, setFormsSavedMsg] = useState(false);

  React.useEffect(() => {
    if (formsConfig) {
      setLocalForms(formsConfig);
    }
  }, [formsConfig]);

  // Payment Settings Config State
  const [localPayment, setLocalPayment] = useState(() => {
    return { ...DEFAULT_PAYMENT_CONFIG, ...(paymentConfig || {}) };
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  React.useEffect(() => {
    if (paymentConfig) {
      setLocalPayment({ ...DEFAULT_PAYMENT_CONFIG, ...paymentConfig });
    }
  }, [paymentConfig]);

  const handleSavePaymentSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSavingPayment(true);
    try {
      if (onSavePaymentConfig) {
        await onSavePaymentConfig(localPayment);
      } else {
        await DataService.savePaymentConfig(localPayment);
      }

      // Auto-sync central bank account to Merchandise config as well
      const updatedMerch = {
        ...localMerchConfig,
        payment: {
          ...(localMerchConfig.payment || {}),
          bank_name: localPayment.bank_name || 'ธนาคารไทยพาณิชย์',
          account_number: localPayment.bank_account_number || '594-264865-5',
          account_name: localPayment.bank_account_name || 'นางสาวมัญชุพร ยังเหล็ก',
          promptpay: localPayment.bank_promptpay || '',
          contact_phone: localPayment.contact_phone || '098-329-6762',
          note: localMerchConfig.payment?.note || 'กรุณาโอนเงินตามยอดที่ระบุและแนบหลักฐานสลิปโอนเงินทุกครั้ง'
        }
      };
      setLocalMerchConfig(updatedMerch);
      if (onSaveMerchandiseConfig) {
        await onSaveMerchandiseConfig(updatedMerch);
      } else {
        await DataService.saveMerchandiseConfig(updatedMerch);
      }

      setIsEditingPaymentSettings(false);
      triggerToast('บันทึกการตั้งค่าค่าสมัครและซิงค์บัญชีธนาคารกลางเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่าค่าสมัคร');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleCancelPaymentSettings = () => {
    askConfirm({
      title: 'ยกเลิกการแก้ไขข้อมูลการชำระเงิน',
      message: 'ต้องการยกเลิกการแก้ไขและคืนค่าข้อมูลบัญชีธนาคารเดิมใช่หรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะถูกละทิ้ง',
      confirmText: 'ยืนยันยกเลิก (คืนค่าเดิม)',
      cancelText: 'แก้ไขต่อ',
      variant: 'warning',
      onConfirm: () => {
        setLocalPayment(paymentConfig || DEFAULT_PAYMENT_CONFIG);
        setIsEditingPaymentSettings(false);
        triggerToast('ยกเลิกการแก้ไขและคืนค่าการตั้งค่าชำระเงินเดิม');
      }
    });
  };

  const handleCancelForms = () => {
    askConfirm({
      title: 'ยกเลิกการแก้ไขลิงก์แบบฟอร์ม',
      message: 'ต้องการยกเลิกการแก้ไขและคืนค่าลิงก์แบบฟอร์มเดิมใช่หรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะถูกละทิ้ง',
      confirmText: 'ยืนยันยกเลิก (คืนค่าเดิม)',
      cancelText: 'แก้ไขต่อ',
      variant: 'warning',
      onConfirm: () => {
        setLocalForms(formsConfig || {
          pretest: { title: 'แบบทดสอบก่อนเรียน (Pre-Test) 2027', url: '', enabled: false },
          posttest: { title: 'แบบทดสอบหลังเรียน (Post-Test)', url: '', enabled: false },
          evaluation: { title: 'แบบประเมินความพึงพอใจ (JRE 2027)', url: '', enabled: false }
        });
        setIsEditingForms(false);
        triggerToast('ยกเลิกการแก้ไขและคืนค่าลิงก์แบบฟอร์มเดิม');
      }
    });
  };

  const handleCancelMerchConfig = () => {
    askConfirm({
      title: 'ยกเลิกการแก้ไขข้อมูลสินค้า',
      message: 'ต้องการยกเลิกการแก้ไขและคืนค่าข้อมูลสินค้าเดิมใช่หรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะถูกละทิ้ง',
      confirmText: 'ยืนยันยกเลิก (คืนค่าเดิม)',
      cancelText: 'แก้ไขต่อ',
      variant: 'warning',
      onConfirm: () => {
        setLocalMerchConfig(sanitizeAdminMerchConfig(merchandiseConfig, paymentConfig));
        setIsEditingMerchConfig(false);
        triggerToast('ยกเลิกการแก้ไขและคืนค่าข้อมูลสินค้าเดิม');
      }
    });
  };

  // Window BeforeUnload Safeguard for Unsaved Admin Changes
  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (
        isEditingProfileModal ||
        isEditingPaymentSettings ||
        isEditingForms ||
        isEditingMerchConfig ||
        editingUserId
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    isEditingProfileModal,
    isEditingPaymentSettings,
    isEditingForms,
    isEditingMerchConfig,
    editingUserId
  ]);

  // In-App Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  // Notification Toast
  const [alertToast, setAlertToast] = useState(null);
  const triggerToast = (msg) => {
    setAlertToast(msg);
    setTimeout(() => setAlertToast(null), 3500);
  };

  // Excel Export Progress State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [isExportingMerchExcel, setIsExportingMerchExcel] = useState(false);
  const [exportMerchProgress, setExportMerchProgress] = useState({ current: 0, total: 0 });

  // User Accounts Management State
  const [userAccounts, setUserAccounts] = useState(() => (propUserAccounts && propUserAccounts.length > 0) ? propUserAccounts : []);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userProviderFilter, setUserProviderFilter] = useState('all'); // all, email, google, both

  React.useEffect(() => {
    if (propUserAccounts && propUserAccounts.length > 0) {
      setUserAccounts(propUserAccounts);
    }
  }, [propUserAccounts]);

  // Modal states for user account management
  const [editingUserAccount, setEditingUserAccount] = useState(null); // edit user
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserStudentId, setEditUserStudentId] = useState('');
  const [editUserAffiliation, setEditUserAffiliation] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [editUserVerified, setEditUserVerified] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [resetPassUser, setResetPassUser] = useState(null); // reset password
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [isResettingUserPass, setIsResettingUserPass] = useState(false);

  const [deletingUserAccount, setDeletingUserAccount] = useState(null); // delete user
  const [isDeletingUserAccount, setIsDeletingUserAccount] = useState(false);

  // Full User Details Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [selectedUserDetailReg, setSelectedUserDetailReg] = useState(null);
  const [isLoadingUserDetailReg, setIsLoadingUserDetailReg] = useState(false);

  React.useEffect(() => {
    if (!selectedUserDetail) {
      setSelectedUserDetailReg(null);
      return;
    }
    const details = resolveUserExtraDetails(selectedUserDetail, registrations);
    if (details.reg) {
      setSelectedUserDetailReg(details.reg);
    } else {
      setIsLoadingUserDetailReg(true);
      DataService.getRegistrationByUserId(selectedUserDetail.id, selectedUserDetail.email)
        .then(r => {
          setSelectedUserDetailReg(r || null);
        })
        .catch(err => {
          console.warn('Failed to load user reg:', err);
        })
        .finally(() => {
          setIsLoadingUserDetailReg(false);
        });
    }
  }, [selectedUserDetail, registrations]);

  const loadUserAccounts = async () => {
    setIsLoadingUsers(true);
    try {
      if (onRefreshUserAccounts) {
        await onRefreshUserAccounts();
      }
      const accs = await DataService.getUserAccounts({ admin: true });
      const deduped = mergeAndDeduplicateAccounts ? mergeAndDeduplicateAccounts(accs || []) : (accs || []);
      setUserAccounts(deduped);
    } catch (err) {
      console.error('Error loading user accounts:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    if (!propUserAccounts || propUserAccounts.length === 0) {
      loadUserAccounts();
    }
    if (typeof onRefreshRegistrations === 'function') {
      onRefreshRegistrations();
    }
  }, []);

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUserAccount) return;
    setIsSavingUser(true);
    try {
      await DataService.adminUpdateUser(editingUserAccount.id, {
        name: editUserName.trim(),
        email: editUserEmail.trim().toLowerCase(),
        phone: editUserPhone.trim(),
        student_id: editUserStudentId.trim(),
        affiliation: editUserAffiliation.trim(),
        role: editUserRole,
        verified: editUserVerified,
        email_verified: editUserVerified
      });
      triggerToast('อัปเดตข้อมูลบัญชีผู้ใช้สำเร็จ');
      setEditingUserAccount(null);
      await loadUserAccounts();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลบัญชี');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleCloseEditUserModal = () => {
    if (editingUserAccount && (editUserName !== (editingUserAccount.name || '') || editUserRole !== (editingUserAccount.role || 'user'))) {
      askConfirm({
        title: 'ยกเลิกการแก้ไขบัญชีผู้ใช้',
        message: 'คุณกำลังแก้ไขข้อมูลบัญชีผู้ใช้และยังไม่ได้บันทึก ต้องการยกเลิกและปิดหน้าต่างใช่หรือไม่? การเปลี่ยนแปลงจะถูกละทิ้ง',
        confirmText: 'ปิดหน้าต่าง (ละทิ้งข้อมูล)',
        cancelText: 'แก้ไขต่อ',
        variant: 'warning',
        onConfirm: () => {
          setEditingUserAccount(null);
        }
      });
      return;
    }
    setEditingUserAccount(null);
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassUser || !adminNewPassword) return;
    if (adminNewPassword.length < 6) {
      triggerToast('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setIsResettingUserPass(true);
    try {
      await DataService.adminResetUserPassword(resetPassUser.id, adminNewPassword);
      triggerToast(`รีเซ็ตรหัสผ่านสำหรับ ${resetPassUser.email} สำเร็จ — ค่า credential ไม่แสดงใน UI; การย้ายไป server-side KDF ยังเป็นงานค้าง`);
      setResetPassUser(null);
      setAdminNewPassword('');
      await loadUserAccounts();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setIsResettingUserPass(false);
    }
  };

  const handleDeleteUserAccount = async () => {
    if (!deletingUserAccount) return;
    setIsDeletingUserAccount(true);
    try {
      await DataService.adminDeleteUser(deletingUserAccount.id);
      triggerToast(`ลบบัญชีผู้ใช้ ${deletingUserAccount.email} เรียบร้อยแล้ว`);
      setDeletingUserAccount(null);
      await loadUserAccounts();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setIsDeletingUserAccount(false);
    }
  };

  const handleExportUsersExcel = () => {
    if (!userAccounts || userAccounts.length === 0) {
      triggerToast('ยังไม่มีข้อมูลบัญชีผู้ใช้ในระบบ');
      return;
    }
    const headers = [
      'ลำดับ',
      'รหัสผู้ใช้ (UID)',
      'ชื่อ-นามสกุล (Name)',
      'อีเมล (Email)',
      'เบอร์โทรศัพท์ (Phone)',
      'รหัสนิสิต (Student ID)',
      'สถาบัน/สังกัด (Affiliation)',
      'นามเรียกขาน (Call Sign)',
      'สถานะการสมัครเข้าร่วมโครงการ',
      'สถานะการยืนยันตัวตน',
      'ผู้ให้บริการเข้าสู่ระบบ (Auth Provider)',
      'ข้อมูล credential (ไม่ส่งออก secret)',
      'สถานะการจัดเก็บ credential (ไม่ส่งออก hash/salt)',
      'บทบาทในระบบ (Role)',
      'วันที่สร้างบัญชี (Created At)',
      'อัปเดตล่าสุด (Updated At)'
    ];

    const getVerificationStatusText = (u) => {
      const email = (u.email || '').trim().toLowerCase();
      if (u.provider === 'both') return 'ยืนยันแล้ว (Google + รหัสผ่าน)';
      if (u.provider === 'google' || (typeof u.id === 'string' && u.id.startsWith('google_')) || email.endsWith('@gmail.com')) {
        return 'ยืนยันด้วย Google OAuth แล้ว';
      }
      if (u.email_verified || u.verified) return 'ลงทะเบียนด้วยรหัสผ่านแล้ว';
      return 'รอยืนยันบัญชี';
    };

    const dataRows = userAccounts.map((u, idx) => {
      const details = resolveUserExtraDetails(u, registrations);
      return [
        idx + 1,
        u.id || '-',
        u.name || '-',
        u.email || '-',
        details.phone || u.phone || '-',
        details.studentId || u.student_id || '-',
        details.affiliation || u.affiliation || '-',
        details.callsign || '-',
        details.isRegistered ? `สมัครแล้ว (${details.registrationStatus})` : 'ยังไม่ได้สมัคร',
        getVerificationStatusText(u),
        u.provider === 'both' ? 'Google OAuth + Email & Password' : u.provider === 'email' ? 'Email & Password' : 'Google OAuth',
        'ไม่แสดง/ไม่ส่งออกเพื่อป้องกันข้อมูลลับ',
        u.provider === 'email' || u.provider === 'both' ? 'มี credential — รายละเอียดไม่แสดง' : 'จัดการโดย Google OAuth',
        u.role || 'user',
        u.created_at ? new Date(u.created_at).toLocaleString('th-TH') : '-',
        u.updated_at ? new Date(u.updated_at).toLocaleString('th-TH') : '-'
      ];
    });

    const sanitizeCell = (val) => {
      if (val === null || val === undefined) return '-';
      if (typeof val === 'number') return val;
      let s = String(val);
      return s.length > 32000 ? s.slice(0, 32000) + '...' : s;
    };

    const sanitizedRows = dataRows.map(row => row.map(sanitizeCell));
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sanitizedRows]);
    worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 2, 16) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'บัญชีผู้ใช้งาน');
    const fileName = `JRE2027_บัญชีผู้ใช้งานระบบ_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    triggerToast(`ส่งออกรายชื่อผู้ใช้เป็น Excel สำเร็จ: ${fileName}`);
  };

  // Speakers, Advisors & Presidents Management State
  const [localSpeakers, setLocalSpeakers] = useState(() => {
    return (speakers && speakers.length > 0) ? speakers : DEFAULT_SPEAKERS;
  });
  const [speakerCategoryFilter, setSpeakerCategoryFilter] = useState('all'); // 'all' | 'president' | 'advisor' | 'speaker'
  const [isSavingSpeakers, setIsSavingSpeakers] = useState(false);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [speakerFormCategory, setSpeakerFormCategory] = useState('speaker');
  const [speakerFormNum, setSpeakerFormNum] = useState(1);
  const [speakerFormName, setSpeakerFormName] = useState('');
  const [speakerFormTitle, setSpeakerFormTitle] = useState('');
  const [speakerFormOrg, setSpeakerFormOrg] = useState('');
  const [speakerFormTopic, setSpeakerFormTopic] = useState('');
  const [speakerFormPhoto, setSpeakerFormPhoto] = useState('');
  const [isUploadingSpeakerPhoto, setIsUploadingSpeakerPhoto] = useState(false);

  // Derived category statistics for speakers, advisors & presidents
  const speakerStats = React.useMemo(() => {
    let presidents = 0;
    let advisors = 0;
    let speakersCount = 0;
    (localSpeakers || []).forEach(s => {
      const cat = getSpeakerCategory(s);
      if (cat === 'president') presidents++;
      else if (cat === 'advisor') advisors++;
      else speakersCount++;
    });
    return {
      total: (localSpeakers || []).length,
      presidents,
      advisors,
      speakersCount
    };
  }, [localSpeakers]);

  React.useEffect(() => {
    if (speakers && speakers.length > 0) {
      setLocalSpeakers(speakers);
    }
  }, [speakers]);

  // Team & Committee Management State
  const [localTeam, setLocalTeam] = useState(() => {
    return (teamMembers && teamMembers.length > 0) ? teamMembers : DEFAULT_TEAM_MEMBERS;
  });
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormRole, setTeamFormRole] = useState('');
  const [teamFormUniversity, setTeamFormUniversity] = useState('มหาวิทยาลัยมหาสารคาม (มมส)');
  const [teamFormInstitution, setTeamFormInstitution] = useState('');
  const [teamFormTag, setTeamFormTag] = useState('');
  const [teamFormPhoto, setTeamFormPhoto] = useState('');
  const [isUploadingTeamPhoto, setIsUploadingTeamPhoto] = useState(false);
  const [teamFilterUni, setTeamFilterUni] = useState('all');

  React.useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      setLocalTeam(teamMembers);
    }
  }, [teamMembers]);

  const handleCloseSpeakerModal = () => {
    if (speakerFormName.trim()) {
      askConfirm({
        title: 'ยกเลิกการแก้ไขวิทยากร',
        message: 'คุณกำลังแก้ไขข้อมูลวิทยากรและยังไม่ได้บันทึก ต้องการยกเลิกและปิดหน้าต่างใช่หรือไม่? การเปลี่ยนแปลงจะถูกละทิ้ง',
        confirmText: 'ปิดหน้าต่าง (ละทิ้งข้อมูล)',
        cancelText: 'แก้ไขต่อ',
        variant: 'warning',
        onConfirm: () => {
          setShowSpeakerModal(false);
        }
      });
      return;
    }
    setShowSpeakerModal(false);
  };

  const handleCloseTeamModal = () => {
    if (teamFormName.trim()) {
      askConfirm({
        title: 'ยกเลิกการแก้ไขคณะดำเนินงาน',
        message: 'คุณกำลังแก้ไขข้อมูลคณะดำเนินงานและยังไม่ได้บันทึก ต้องการยกเลิกและปิดหน้าต่างใช่หรือไม่? การเปลี่ยนแปลงจะถูกละทิ้ง',
        confirmText: 'ปิดหน้าต่าง (ละทิ้งข้อมูล)',
        cancelText: 'แก้ไขต่อ',
        variant: 'warning',
        onConfirm: () => {
          setShowTeamModal(false);
        }
      });
      return;
    }
    setShowTeamModal(false);
  };

  // --- Speakers & Dignitaries Handlers ---
  const handleMoveSpeakerUp = async (spkId) => {
    const currentList = speakerCategoryFilter === 'all'
      ? localSpeakers
      : localSpeakers.filter(s => getSpeakerCategory(s) === speakerCategoryFilter);
    const index = currentList.findIndex(s => s.id === spkId);
    if (index <= 0) return;

    const prevItem = currentList[index - 1];
    const currItem = currentList[index];

    const prevNum = prevItem.num || index;
    const currNum = currItem.num || (index + 1);

    const updated = localSpeakers.map(s => {
      if (s.id === currItem.id) return { ...s, num: prevNum };
      if (s.id === prevItem.id) return { ...s, num: currNum };
      return s;
    });

    updated.sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0));
    setLocalSpeakers(updated);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(updated);
      triggerToast('จัดลำดับเลื่อนขึ้นเรียบร้อย');
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกลำดับ');
    }
  };

  const handleMoveSpeakerDown = async (spkId) => {
    const currentList = speakerCategoryFilter === 'all'
      ? localSpeakers
      : localSpeakers.filter(s => getSpeakerCategory(s) === speakerCategoryFilter);
    const index = currentList.findIndex(s => s.id === spkId);
    if (index < 0 || index >= currentList.length - 1) return;

    const nextItem = currentList[index + 1];
    const currItem = currentList[index];

    const nextNum = nextItem.num || (index + 2);
    const currNum = currItem.num || (index + 1);

    const updated = localSpeakers.map(s => {
      if (s.id === currItem.id) return { ...s, num: nextNum };
      if (s.id === nextItem.id) return { ...s, num: currNum };
      return s;
    });

    updated.sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0));
    setLocalSpeakers(updated);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(updated);
      triggerToast('จัดลำดับเลื่อนลงเรียบร้อย');
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกลำดับ');
    }
  };

  const handleChangeSpeakerCategory = async (spkId, newCategory) => {
    const target = localSpeakers.find(s => s.id === spkId);
    if (!target) return;
    const catItems = localSpeakers.filter(s => s.id !== spkId && getSpeakerCategory(s) === newCategory);
    const nextNum = catItems.length + 1;
    const updated = localSpeakers.map(s => {
      if (s.id === spkId) {
        return { ...s, category: newCategory, num: nextNum };
      }
      return s;
    });
    setLocalSpeakers(updated);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(updated);
      const catLabel = newCategory === 'president' ? 'ประธานในพิธี' : newCategory === 'advisor' ? 'ที่ปรึกษาโครงการ' : 'วิทยากรประจำโครงการ';
      triggerToast(`เปลี่ยนบทบาทเป็น "${catLabel}" เรียบร้อย`);
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการเปลี่ยนบทบาท');
    }
  };

  const handleOpenAddSpeaker = (categoryHint = null) => {
    const chosenCat = categoryHint || (speakerCategoryFilter !== 'all' ? speakerCategoryFilter : 'speaker');
    setEditingSpeaker(null);
    const countInCat = localSpeakers.filter(s => getSpeakerCategory(s) === chosenCat).length;
    setSpeakerFormNum(countInCat + 1);
    setSpeakerFormCategory(chosenCat);
    setSpeakerFormName('');
    setSpeakerFormTitle('');
    setSpeakerFormOrg('');
    setSpeakerFormTopic('');
    setSpeakerFormPhoto('');
    setShowSpeakerModal(true);
  };

  const handleOpenEditSpeaker = (spk) => {
    setEditingSpeaker(spk);
    setSpeakerFormNum(spk.num || 1);
    setSpeakerFormCategory(getSpeakerCategory(spk));
    setSpeakerFormName(spk.name || '');
    setSpeakerFormTitle(spk.title || '');
    setSpeakerFormOrg(spk.org || '');
    setSpeakerFormTopic(spk.topic || '');
    setSpeakerFormPhoto(spk.photo || '');
    setShowSpeakerModal(true);
  };

  const handleSpeakerPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSpeakerPhoto(true);
    try {
      const result = await DataService.uploadFile(file, 'speakers');
      if (result?.url) {
        setSpeakerFormPhoto(result.url);
        triggerToast('อัปโหลดรูปภาพสำเร็จ');
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploadingSpeakerPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveSpeakerModal = async (e) => {
    if (e) e.preventDefault();
    if (!speakerFormName.trim()) {
      triggerToast('กรุณากรอกชื่อ-สกุล');
      return;
    }
    const defaultPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(speakerFormName.trim())}`;
    const payload = {
      id: editingSpeaker?.id || 'spk-' + Date.now(),
      num: Number(speakerFormNum) || (editingSpeaker?.num || 1),
      category: speakerFormCategory || 'speaker',
      name: speakerFormName.trim(),
      title: speakerFormTitle.trim(),
      org: speakerFormOrg.trim(),
      topic: speakerFormTopic.trim(),
      photo: speakerFormPhoto.trim() || defaultPhoto
    };

    let updated;
    if (editingSpeaker) {
      updated = localSpeakers.map(s => s.id === editingSpeaker.id ? payload : s);
    } else {
      updated = [...localSpeakers, payload];
    }
    updated.sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0));
    setLocalSpeakers(updated);
    setShowSpeakerModal(false);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(updated);
      triggerToast(editingSpeaker ? 'แก้ไขข้อมูลเรียบร้อย' : 'เพิ่มข้อมูลใหม่เรียบร้อย');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteSpeaker = async (id) => {
    const spkToDelete = localSpeakers.find(s => s.id === id);
    const ok = await askConfirm({
      title: 'ยืนยันการลบข้อมูล',
      message: `คุณต้องการลบข้อมูล "${spkToDelete?.name || ''}" ออกจากระบบใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;
    const filtered = localSpeakers.filter(s => s.id !== id).map((s, idx) => ({ ...s, num: idx + 1 }));
    setLocalSpeakers(filtered);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(filtered);
      triggerToast('ลบข้อมูลเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleSaveAllSpeakers = async () => {
    setIsSavingSpeakers(true);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(localSpeakers);
      triggerToast('บันทึกข้อมูลประธาน ที่ปรึกษา และวิทยากรทั้งหมดเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingSpeakers(false);
    }
  };

  const handleLoadOfficialDignitaries = async () => {
    const ok = await askConfirm({
      title: 'โหลดรายชื่อทางการ JRE 2027',
      message: 'ต้องการโหลดรายชื่อประธานในพิธี คณะที่ปรึกษา และวิทยากรทางการตามกำหนดการจริงของโครงการ JRE 2027 ใช่หรือไม่? (จะแทนที่รายการปัจจุบันด้วยรายชื่อทางการ 9 ท่าน)',
      confirmText: 'ยืนยันโหลดข้อมูลทางการ',
      cancelText: 'ยกเลิก',
      variant: 'warning'
    });
    if (!ok) return;
    setLocalSpeakers(DEFAULT_SPEAKERS);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(DEFAULT_SPEAKERS);
      triggerToast('โหลดรายชื่อประธาน ที่ปรึกษา และวิทยากรทางการเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // --- Team & Committee Handlers ---
  const handleMoveTeamUp = async (index) => {
    if (index <= 0) return;
    const updated = [...localTeam];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setLocalTeam(updated);
    try {
      if (onSaveTeam) await onSaveTeam(updated);
      triggerToast('จัดลำดับทีมงานเลื่อนขึ้นเรียบร้อย');
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกลำดับ');
    }
  };

  const handleMoveTeamDown = async (index) => {
    if (index >= localTeam.length - 1) return;
    const updated = [...localTeam];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setLocalTeam(updated);
    try {
      if (onSaveTeam) await onSaveTeam(updated);
      triggerToast('จัดลำดับทีมงานเลื่อนลงเรียบร้อย');
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกลำดับ');
    }
  };

  const handleOpenAddTeamMember = () => {
    setEditingTeamMember(null);
    setTeamFormName('');
    setTeamFormRole('');
    setTeamFormUniversity('มหาวิทยาลัยมหาสารคาม (มมส)');
    setTeamFormInstitution('ชมรมกู้ภัยราชพฤกษ์ มมส');
    setTeamFormTag('');
    setTeamFormPhoto('');
    setShowTeamModal(true);
  };

  const handleOpenEditTeamMember = (member) => {
    setEditingTeamMember(member);
    setTeamFormName(member.name || '');
    setTeamFormRole(member.role || '');
    const uni = member.university || (member.tag?.includes('มมส') || member.institution?.includes('มมส') ? 'มหาวิทยาลัยมหาสารคาม (มมส)' : member.tag?.includes('มข') || member.institution?.includes('มข') ? 'มหาวิทยาลัยขอนแก่น (มข)' : member.institution || '');
    setTeamFormUniversity(uni);
    setTeamFormInstitution(member.institution || '');
    setTeamFormTag(member.tag || '');
    setTeamFormPhoto(member.photo || '');
    setShowTeamModal(true);
  };

  const handleTeamPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTeamPhoto(true);
    try {
      const result = await DataService.uploadFile(file, 'team');
      if (result?.url) {
        setTeamFormPhoto(result.url);
        triggerToast('อัปโหลดรูปภาพทีมงานสำเร็จ');
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploadingTeamPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveTeamModal = async (e) => {
    if (e) e.preventDefault();
    if (!teamFormName.trim()) {
      triggerToast('กรุณากรอกชื่อ-สกุลของคณะทำงาน');
      return;
    }
    const defaultPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(teamFormName.trim())}`;
    const payload = {
      id: editingTeamMember?.id || 'team-' + Date.now(),
      name: teamFormName.trim(),
      role: teamFormRole.trim(),
      university: teamFormUniversity.trim() || 'เครือข่ายสถาบันร่วมฝึกอบรม',
      institution: teamFormInstitution.trim(),
      tag: teamFormTag.trim(),
      photo: teamFormPhoto.trim() || defaultPhoto
    };

    let updated;
    if (editingTeamMember) {
      updated = localTeam.map(m => m.id === editingTeamMember.id ? payload : m);
    } else {
      updated = [...localTeam, payload];
    }
    setLocalTeam(updated);
    setShowTeamModal(false);
    try {
      if (onSaveTeam) await onSaveTeam(updated);
      triggerToast(editingTeamMember ? 'แก้ไขข้อมูลคณะดำเนินงานเรียบร้อย' : 'เพิ่มคณะดำเนินงานใหม่เรียบร้อย');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteTeamMember = async (id) => {
    const memberToDelete = localTeam.find(m => m.id === id);
    const ok = await askConfirm({
      title: 'ยืนยันการลบคณะดำเนินงาน',
      message: `คุณต้องการลบข้อมูล "${memberToDelete?.name || ''}" ออกจากระบบใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;
    const filtered = localTeam.filter(m => m.id !== id);
    setLocalTeam(filtered);
    try {
      if (onSaveTeam) await onSaveTeam(filtered);
      triggerToast('ลบสมาชิกคณะดำเนินงานเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleSaveAllTeam = async () => {
    setIsSavingTeam(true);
    try {
      if (onSaveTeam) await onSaveTeam(localTeam);
      triggerToast('บันทึกข้อมูลคณะดำเนินงานทั้งหมดลงฐานข้อมูลเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingTeam(false);
    }
  };

  // --- Handlers for Applicants ---
  const handleStartEditAllocation = (reg) => {
    setEditingUserId(reg.user_id);
    setAllocGroup(reg.group_assigned || '');
    setAllocRoom(reg.room_assigned || '');
    setAllocShirtSize(normalizeSize(reg.shirt_size || 'L'));
  };

  const handleSaveAllocation = async (userId) => {
    await onUpdateAllocation(userId, {
      group_assigned: allocGroup.trim(),
      room_assigned: allocRoom.trim(),
      shirt_size: allocShirtSize.trim() || 'L'
    });
    setEditingUserId(null);
    triggerToast(`บันทึกการจัดสรรกลุ่ม ห้องพัก และไซส์เสื้อ (${allocShirtSize}) เรียบร้อย`);
  };

  // Direct handler for Admin to specify/update a person's shirt size (especially when converting from 'อื่นๆ' after contacting them)
  const handleAssignPersonShirtSize = async (itemOrReg, newSizeRaw) => {
    const cleanNewSize = String(newSizeRaw || '').trim().toUpperCase();
    if (!cleanNewSize) {
      triggerToast('กรุณาเลือกหรือระบุไซส์เสื้อที่ต้องการบันทึก', 'warning');
      return;
    }

    const recordId = itemOrReg.id || itemOrReg.user_id;
    setUpdatingSizeId(recordId);
    try {
      const isMerchStoreOrder = itemOrReg.source === 'merchandise' && itemOrReg.rawOrder;
      if (isMerchStoreOrder) {
        const rawOrd = itemOrReg.rawOrder;
        const updatedItems = Array.isArray(rawOrd.items) && rawOrd.items.length > 0
          ? rawOrd.items.map((it, idx) => idx === 0 ? { ...it, size: cleanNewSize } : it)
          : [{ product_name: 'เสื้อปฏิบัติการกู้ภัย JRE 2027', size: cleanNewSize, quantity: 1 }];
        await DataService.saveMerchandiseOrder({
          ...rawOrd,
          items: updatedItems
        });
        if (typeof onRefreshRegistrations === 'function') await onRefreshRegistrations();
        triggerToast(`อัปเดตไซส์เสื้อออเดอร์ ${rawOrd.order_number} เป็นไซส์ "${cleanNewSize}" เรียบร้อยแล้ว`);
      } else {
        const targetUserId = itemOrReg.rawRegistration?.user_id || itemOrReg.user_id || itemOrReg.reg_id || String(itemOrReg.id || '').replace('reg_shirt_', '');
        const personName = itemOrReg.customer_name || `${itemOrReg.first_name || ''} ${itemOrReg.last_name || ''}`.trim() || 'ผู้สมัคร';
        if (onUpdateAllocation && targetUserId) {
          await onUpdateAllocation(targetUserId, {
            shirt_size: cleanNewSize
          });
          if (profileModalReg && (profileModalReg.user_id === targetUserId || profileModalReg.id === targetUserId)) {
            setProfileModalReg(prev => prev ? { ...prev, shirt_size: cleanNewSize } : prev);
            setModalShirtSize(cleanNewSize);
          }
          triggerToast(`อัปเดตไซส์เสื้อของคุณ ${personName} เป็นไซส์ "${cleanNewSize}" ในระบบเรียบร้อยแล้ว`);
        }
      }
    } catch (err) {
      console.error('Failed to assign shirt size:', err);
      triggerToast('เกิดข้อผิดพลาดในการอัปเดตไซส์เสื้อ', 'error');
    } finally {
      setUpdatingSizeId(null);
    }
  };

  // Open Full Profile & Remarks Modal (Locked / View-only by default)
  const handleOpenProfileModal = (reg, initialTab = 'info') => {
    setProfileModalReg(reg);
    setIsEditingProfileModal(false);
    setProfileModalTab(initialTab);
    setModalGroup(reg.group_assigned || '');
    setModalRoom(reg.room_assigned || '');
    setModalShirtSize(reg.shirt_size || 'L');
    setModalSpecialCare(Boolean(reg.is_special_care));
    setModalNotes(reg.special_notes || '');
    setModalPhone(reg.phone || '');
    setModalInstitution(reg.institution || '');
    setModalMedical(getApplicantMedical(reg));
    setModalAllergy(getApplicantAllergy(reg));
    setModalTraining(reg.previous_training || '');

    const isStaff = isStaffRegistration(reg);
    const resolvedGen = resolveGender(reg);
    setModalIsStaff(isStaff);
    setModalGender(resolvedGen === 'หญิง' ? 'หญิง' : 'ชาย');

    const isMsu = isMsuInstitution(reg.institution);
    const totalFee = isStaff
      ? STAFF_SHIRT_FEE
      : (isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850));
    const round2Fee = isMsu ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
    // Staff never has 2-round installment payment
    const isInstallment = !isStaff && (reg.payment_plan 
      ? (reg.payment_plan === 'installment') 
      : Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url));
    const isR1Paid = reg.installment_1_status === 'paid';
    const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url);
    const isBothPaid = isInstallment ? (isR1Paid && isR2Paid) : (reg.payment_status === 'paid' || (isStaff && isR1Paid));

    let effStatus = reg.payment_status || 'unpaid';
    let effAmount = reg.payment_amount;

    if (isInstallment) {
      if (isBothPaid) {
        effStatus = 'paid';
        effAmount = 0;
      } else if (isR1Paid) {
        effStatus = reg.installment_2_status === 'pending_review' ? 'pending_review' : 'unpaid';
        effAmount = round2Fee;
      } else {
        effStatus = reg.installment_1_status === 'pending_review' ? 'pending_review' : 'unpaid';
        effAmount = totalFee;
      }
    } else {
      if (isStaff && isR1Paid) effStatus = 'paid';
      else if (isStaff && reg.installment_1_status === 'pending_review') effStatus = 'pending_review';
      effAmount = (effStatus === 'paid') ? 0 : (isStaff ? STAFF_SHIRT_FEE : (reg.payment_amount !== undefined && reg.payment_amount !== null ? reg.payment_amount : totalFee));
    }

    setModalPaymentPlan(isInstallment ? 'installment' : 'full');
    setModalPaymentStatus(effStatus);
    setModalPaymentAmount(effAmount);
    setModalPaymentBank(reg.payment_bank_info || 'ธนาคารไทยพาณิชย์ (SCB) เลขที่ 594-264865-5 ชื่อบัญชี นางสาวมัญชุพร ยังเหล็ก');
    setModalPaymentNotes(reg.payment_notes || '');
    setNewMsgText('');
  };

  const handleCancelProfileModal = () => {
    if (!profileModalReg) return;
    askConfirm({
      title: 'ยกเลิกการแก้ไขข้อมูลผู้สมัคร',
      message: 'ต้องการยกเลิกการแก้ไขและคืนค่าข้อมูลผู้สมัครเดิมใช่หรือไม่? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะถูกละทิ้ง',
      confirmText: 'ยืนยันยกเลิก (คืนค่าเดิม)',
      cancelText: 'แก้ไขต่อ',
      variant: 'warning',
      onConfirm: () => {
        setModalGroup(profileModalReg.group_assigned || '');
        setModalRoom(profileModalReg.room_assigned || '');
        setModalShirtSize(profileModalReg.shirt_size || 'L');
        setModalSpecialCare(Boolean(profileModalReg.is_special_care));
        setModalNotes(profileModalReg.special_notes || '');
        setModalPhone(profileModalReg.phone || '');
        setModalInstitution(profileModalReg.institution || '');
        setModalMedical(getApplicantMedical(profileModalReg));
        setModalAllergy(getApplicantAllergy(profileModalReg));
        setModalTraining(profileModalReg.previous_training || '');

        const isStaff = isStaffRegistration(profileModalReg);
        const resolvedGen = resolveGender(profileModalReg);
        setModalIsStaff(isStaff);
        setModalGender(resolvedGen === 'หญิง' ? 'หญิง' : 'ชาย');
        
        const isMsu = isMsuInstitution(profileModalReg.institution);
        const totalFee = isStaff
          ? STAFF_SHIRT_FEE
          : (isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850));
        const round2Fee = isMsu ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
        const isInstallment = !isStaff && (profileModalReg.payment_plan 
          ? (profileModalReg.payment_plan === 'installment') 
          : Boolean(profileModalReg.installment_1_slip_url || profileModalReg.installment_2_slip_url));
        const isR1Paid = profileModalReg.installment_1_status === 'paid';
        const isR2Paid = profileModalReg.installment_2_status === 'paid' && Boolean(profileModalReg.installment_2_slip_url);
        const isBothPaid = isInstallment ? (isR1Paid && isR2Paid) : (profileModalReg.payment_status === 'paid' || (isStaff && isR1Paid));

        let effStatus = profileModalReg.payment_status || 'unpaid';
        let effAmount = profileModalReg.payment_amount;

        if (isInstallment) {
          if (isBothPaid) {
            effStatus = 'paid';
            effAmount = 0;
          } else if (isR1Paid) {
            effStatus = profileModalReg.installment_2_status === 'pending_review' ? 'pending_review' : 'unpaid';
            effAmount = round2Fee;
          } else {
            effStatus = profileModalReg.installment_1_status === 'pending_review' ? 'pending_review' : 'unpaid';
            effAmount = totalFee;
          }
        } else {
          if (isStaff && isR1Paid) effStatus = 'paid';
          else if (isStaff && profileModalReg.installment_1_status === 'pending_review') effStatus = 'pending_review';
          effAmount = (effStatus === 'paid') ? 0 : (isStaff ? STAFF_SHIRT_FEE : (profileModalReg.payment_amount !== undefined && profileModalReg.payment_amount !== null ? profileModalReg.payment_amount : totalFee));
        }

        setModalPaymentPlan(isInstallment ? 'installment' : 'full');
        setModalPaymentStatus(effStatus);
        setModalPaymentAmount(effAmount);
        setModalPaymentBank(profileModalReg.payment_bank_info || 'ธนาคารไทยพาณิชย์ (SCB) เลขที่ 594-264865-5 ชื่อบัญชี นางสาวมัญชุพร ยังเหล็ก');
        setModalPaymentNotes(profileModalReg.payment_notes || '');
        setIsEditingProfileModal(false);
        triggerToast('ยกเลิกการแก้ไขและคืนค่าเดิมของข้อมูลผู้สมัคร');
      }
    });
  };

  const handleCloseProfileModal = () => {
    if (isEditingProfileModal) {
      askConfirm({
        title: 'กำลังอยู่ในโหมดแก้ไขข้อมูล',
        message: 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลและยังไม่ได้บันทึก ต้องการยกเลิกและปิดหน้าต่างใช่หรือไม่? การเปลี่ยนแปลงจะถูกละทิ้ง',
        confirmText: 'ปิดหน้าต่าง (คืนค่าเดิม)',
        cancelText: 'แก้ไขต่อ',
        variant: 'warning',
        onConfirm: () => {
          setIsEditingProfileModal(false);
          setProfileModalReg(null);
        }
      });
      return;
    }
    setIsEditingProfileModal(false);
    setProfileModalReg(null);
  };

  // Save Full Profile & Special Care Remarks
  const handleSaveProfileModal = async (e) => {
    if (e) e.preventDefault();
    if (!profileModalReg) return;

    setIsSavingProfile(true);
    try {
      const effectivePlan = modalIsStaff ? 'full' : modalPaymentPlan;
      const defaultFee = modalIsStaff
        ? STAFF_SHIRT_FEE
        : (isMsuInstitution(modalInstitution || profileModalReg.institution) ? 650 : 850);
      const effectiveAmount = modalIsStaff
        ? (modalPaymentStatus === 'paid' ? STAFF_SHIRT_FEE : (Number(modalPaymentAmount) > 0 ? Number(modalPaymentAmount) : STAFF_SHIRT_FEE))
        : (Number(modalPaymentAmount) >= 0 ? Number(modalPaymentAmount) : defaultFee);

      const updates = {
        group_assigned: modalGroup.trim(),
        room_assigned: modalRoom.trim(),
        shirt_size: (modalShirtSize || 'L').trim().toUpperCase(),
        is_special_care: modalSpecialCare,
        special_notes: modalNotes.trim(),
        phone: modalPhone.trim(),
        institution: modalInstitution.trim(),
        medical_history: modalMedical.trim(),
        food_allergy: modalAllergy.trim(),
        previous_training: modalTraining.trim(),
        is_staff: Boolean(modalIsStaff),
        registration_type: modalIsStaff ? 'staff' : 'participant',
        gender: modalGender,
        payment_plan: effectivePlan,
        payment_status: modalPaymentStatus,
        payment_amount: effectiveAmount,
        payment_bank_info: modalPaymentBank.trim(),
        payment_notes: modalPaymentNotes.trim()
      };

      await onUpdateAllocation(profileModalReg.user_id, updates);
      
      // Update local modal state copy
      setProfileModalReg(prev => ({ ...prev, ...updates }));
      setIsEditingProfileModal(false);
      triggerToast(`บันทึกข้อมูลของ ${profileModalReg.first_name} เรียบร้อยแล้ว`);
    } catch (err) {
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Upload Attachment for Outgoing Admin Message
  const handleUploadMsgAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMsgAttachment(true);
    try {
      const uploaded = await DataService.uploadFile(file, 'docs');
      if (uploaded?.url) {
        setMsgAttachmentUrl(uploaded.url);
        setMsgAttachmentName(file.name);
        triggerToast(`แนบไฟล์ "${file.name}" กับข้อความเรียบร้อยแล้ว`);
      }
    } catch (err) {
      console.error('Upload message attachment error:', err);
      triggerToast('อัปโหลดไฟล์แนบไม่สำเร็จ', 'error');
    } finally {
      setIsUploadingMsgAttachment(false);
      e.target.value = '';
    }
  };

  // Send Direct Message to Participant (Separates by Admin / Department / System)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsgText.trim() || !profileModalReg) return;

    const chosenSender = ADMIN_MESSAGE_SENDERS.find(s => s.key === msgSenderKey) || ADMIN_MESSAGE_SENDERS[0];
    const finalSenderName = msgSenderKey === 'custom'
      ? (msgCustomSenderName.trim() || 'ผู้ดูแลระบบ (Admin JRE 2027)')
      : chosenSender.senderName;
    const finalSystemName = msgSenderKey === 'custom'
      ? (msgCustomSystemName.trim() || 'ระบบแจ้งเตือนโครงการ JRE 2027')
      : chosenSender.systemName;
    const finalTitle = msgTitle.trim() || chosenSender.defaultTitle;

    setIsSendingMsg(true);
    try {
      await DataService.sendAdminMessage(profileModalReg.user_id, newMsgText.trim(), {
        sender_key: chosenSender.key,
        sender_name: finalSenderName,
        sender_role: chosenSender.roleBadge,
        system_name: finalSystemName,
        color_theme: chosenSender.colorTheme,
        title: finalTitle,
        attachment_url: msgAttachmentUrl || '',
        attachment_name: msgAttachmentName || '',
        payment_amount: Number(modalPaymentAmount) || (isStaffRegistration(profileModalReg) ? STAFF_SHIRT_FEE : (isMsuInstitution(profileModalReg.institution) ? 650 : 850)),
        payment_bank_info: modalPaymentBank.trim(),
        payment_status: modalPaymentStatus
      });

      const updatedRegs = await DataService.getRegistrations({ admin: true });
      const updatedTarget = updatedRegs.find(r => r.user_id === profileModalReg.user_id);
      if (updatedTarget) {
        setProfileModalReg(updatedTarget);
      }
      if (typeof onRefreshRegistrations === 'function') {
        await onRefreshRegistrations();
      }

      setNewMsgText('');
      setMsgTitle('');
      setMsgAttachmentUrl('');
      setMsgAttachmentName('');
      triggerToast(`ส่งข้อความแจ้งเตือนในนาม "${finalSenderName}" ถึง ${profileModalReg.first_name} สำเร็จ`);
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Delete Direct Message (Admin Side)
  const handleDeleteAdminMsgFromAdmin = async (msgId) => {
    if (!profileModalReg) return;
    const ok = await askConfirm({
      title: 'ยืนยันการลบข้อความ',
      message: 'คุณต้องการลบข้อความนี้ออกจากประวัติใช่หรือไม่? (ข้อความจะถูกลบออกจากฝั่งผู้สมัครด้วย)',
      confirmText: 'ลบข้อความ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await DataService.deleteAdminMessage(profileModalReg.user_id, msgId);
      const updatedRegs = await DataService.getRegistrations({ admin: true });
      const updatedTarget = updatedRegs.find(r => r.user_id === profileModalReg.user_id);
      if (updatedTarget) {
        setProfileModalReg(updatedTarget);
      }
      if (typeof onRefreshRegistrations === 'function') {
        await onRefreshRegistrations();
      }
      triggerToast('ลบข้อความแจ้งเตือนสำเร็จ');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการลบข้อความ');
    }
  };

  // Clear All Direct Messages for Applicant (Advanced Mode)
  const handleClearAllAdminMessagesFromAdmin = async () => {
    if (!profileModalReg) return;
    if (!isAdvancedMode) {
      triggerToast('🔒 กรุณาเปิด "โหมดขั้นสูง" ก่อนล้างประวัติข้อความทั้งหมด', 'warning');
      return;
    }
    const ok = await askConfirm({
      title: '⚠️ ยืนยันล้างข้อความแจ้งเตือนทั้งหมด (โหมดขั้นสูง)',
      message: `คุณต้องการลบข้อความแจ้งเตือนทั้งหมดของ "${profileModalReg.first_name}" ออกจากระบบถาวรใช่หรือไม่?`,
      confirmText: 'ยืนยันลบข้อความทั้งหมด',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await DataService.deleteAdminMessage(profileModalReg.user_id, 'all');
      const updatedRegs = await DataService.getRegistrations({ admin: true });
      const updatedTarget = updatedRegs.find(r => r.user_id === profileModalReg.user_id);
      if (updatedTarget) {
        setProfileModalReg(updatedTarget);
      }
      if (typeof onRefreshRegistrations === 'function') {
        await onRefreshRegistrations();
      }
      triggerToast('ล้างประวัติข้อความแจ้งเตือนทั้งหมดเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการล้างข้อความ');
    }
  };

  // Add Document Request
  const handleAddDocRequest = async (e, customTitle = null) => {
    if (e) e.preventDefault();
    const titleToUse = (customTitle !== null ? customTitle : newDocTitle).trim();
    if (!titleToUse || !profileModalReg) return;

    const chosenRequester = ADMIN_MESSAGE_SENDERS.find(s => s.key === docRequesterKey) || ADMIN_MESSAGE_SENDERS[2] || ADMIN_MESSAGE_SENDERS[0];
    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];

    // Check if there is an existing cancelled request with the same title — if so, re-open it
    const existingIdx = currentDocs.findIndex(d => d.title === titleToUse);
    let updatedDocs;
    let actionDoc;

    if (existingIdx >= 0 && currentDocs[existingIdx].status === 'cancelled') {
      actionDoc = {
        ...currentDocs[existingIdx],
        status: currentDocs[existingIdx].file_url ? 'submitted' : 'pending',
        required: newDocRequired,
        requested_by: chosenRequester.senderName,
        requested_by_key: chosenRequester.key,
        requested_at: new Date().toISOString(),
        note: newDocNote.trim() || ''
      };
      updatedDocs = [...currentDocs];
      updatedDocs[existingIdx] = actionDoc;
    } else {
      actionDoc = {
        id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        title: titleToUse,
        required: newDocRequired,
        status: 'pending',
        requested_by: chosenRequester.senderName,
        requested_by_key: chosenRequester.key,
        requested_at: new Date().toISOString(),
        note: newDocNote.trim() || '',
        file_url: '',
        file_name: '',
        submitted_at: ''
      };
      updatedDocs = [...currentDocs, actionDoc];
    }

    await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
    await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
    setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));

    if (notifyUserOnDocAction) {
      try {
        await DataService.sendAdminMessage(
          profileModalReg.user_id,
          `โปรดอัปโหลดเอกสารเพิ่มเติม: "${titleToUse}" ${newDocNote.trim() ? `(หมายเหตุ: ${newDocNote.trim()})` : ''} ผ่านเมนูเอกสารที่ต้องนำส่งในหน้าแดชบอร์ดผู้สมัคร`,
          {
            sender_key: chosenRequester.key,
            sender_name: chosenRequester.senderName,
            sender_role: chosenRequester.roleBadge,
            system_name: chosenRequester.systemName,
            color_theme: chosenRequester.colorTheme,
            title: `ขอเอกสารเพิ่มเติม: ${titleToUse}`,
            sent_via: 'doc_request'
          }
        );
        const refreshed = await DataService.getRegistrations({ admin: true });
        const target = refreshed.find(r => r.user_id === profileModalReg.user_id);
        if (target) setProfileModalReg(target);
      } catch (notifyErr) {
        console.warn('Auto notify doc request warning:', notifyErr);
      }
    }

    if (customTitle === null) {
      setNewDocTitle('');
      setNewDocNote('');
    }
    triggerToast(`ส่งคำขอเอกสาร "${titleToUse}" เรียบร้อยแล้ว`);
  };

  // Cancel or Re-open Document Request (กดยกเลิกการขอเอกสาร / กดขออีกครั้ง)
  const handleCancelDocRequest = async (doc, removeFromList = false) => {
    if (!profileModalReg || !doc) return;
    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
    const chosenRequester = ADMIN_MESSAGE_SENDERS.find(s => s.key === docRequesterKey) || ADMIN_MESSAGE_SENDERS[2] || ADMIN_MESSAGE_SENDERS[0];

    // If it is already cancelled and not removing, re-request it
    if (doc.status === 'cancelled' && !removeFromList) {
      const updatedDocs = currentDocs.map(d =>
        d.id === doc.id
          ? {
              ...d,
              status: d.file_url ? 'submitted' : 'pending',
              requested_at: new Date().toISOString(),
              note: d.note === 'ยกเลิกการขอเอกสารโดยผู้ดูแลระบบ' ? '' : (d.note || '')
            }
          : d
      );
      await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
      await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
      setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));
      triggerToast(`เปิดขอเอกสาร "${doc.title}" อีกครั้งเรียบร้อยแล้ว`);
      return;
    }

    // If user hasn't uploaded a file yet, or removeFromList is true, remove or mark cancelled
    let updatedDocs;
    if (removeFromList || !doc.file_url) {
      updatedDocs = currentDocs.filter(d => d.id !== doc.id);
    } else {
      updatedDocs = currentDocs.map(d =>
        d.id === doc.id
          ? {
              ...d,
              status: 'cancelled',
              required: false,
              note: 'ยกเลิกการขอเอกสารโดยผู้ดูแลระบบ'
            }
          : d
      );
    }

    await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
    await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
    setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));

    if (notifyUserOnDocAction) {
      try {
        await DataService.sendAdminMessage(
          profileModalReg.user_id,
          `ยกเลิกการขอเอกสาร "${doc.title}" เรียบร้อยแล้ว ท่านไม่จำเป็นต้องนำส่งเอกสารรายการนี้อีกต่อไป`,
          {
            sender_key: chosenRequester.key,
            sender_name: chosenRequester.senderName,
            sender_role: chosenRequester.roleBadge,
            system_name: chosenRequester.systemName,
            color_theme: chosenRequester.colorTheme,
            title: `ยกเลิกการขอเอกสาร: ${doc.title}`,
            sent_via: 'doc_request'
          }
        );
        const refreshed = await DataService.getRegistrations({ admin: true });
        const target = refreshed.find(r => r.user_id === profileModalReg.user_id);
        if (target) setProfileModalReg(target);
      } catch (notifyErr) {}
    }

    triggerToast(`ยกเลิกการขอเอกสาร "${doc.title}" เรียบร้อยแล้ว`);
  };

  // Toggle 1-Click Standard Document Request / Cancel Request
  const handleQuickToggleDocRequest = async (stdDoc) => {
    if (!profileModalReg) return;
    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? profileModalReg.requested_docs : [];
    const activeDoc = currentDocs.find(d => d.title === stdDoc.title && d.status !== 'cancelled');
    if (activeDoc) {
      await handleCancelDocRequest(activeDoc, !activeDoc.file_url);
    } else {
      await handleAddDocRequest(null, stdDoc.title);
    }
  };

  // Toggle Required / Optional on a Requested Document
  const handleToggleDocRequired = async (docId) => {
    if (!profileModalReg) return;
    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
    const updatedDocs = currentDocs.map(d => d.id === docId ? { ...d, required: !d.required } : d);
    await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
    await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
    setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));
    triggerToast('อัปเดตสถานะความจำเป็นของเอกสารแล้ว');
  };

  // Admin uploads/attaches document file on behalf of applicant
  const handleAdminUploadDocForUser = async (e, docId) => {
    const file = e.target.files?.[0];
    if (!file || !profileModalReg) return;
    setUploadingAdminDocId(docId);
    try {
      const uploadResult = await DataService.uploadFile(file, 'docs');
      if (uploadResult?.url) {
        const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
        const updatedDocs = currentDocs.map(d =>
          d.id === docId
            ? {
                ...d,
                file_url: uploadResult.url,
                file_name: file.name,
                submitted_at: new Date().toISOString(),
                status: 'approved',
                note: 'แนบไฟล์และอนุมัติโดยผู้ดูแลระบบ (Admin)'
              }
            : d
        );
        await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
        await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
        setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));
        triggerToast(`อัปโหลดไฟล์ "${file.name}" และอนุมัติให้ผู้สมัครเรียบร้อยแล้ว`);
      }
    } catch (err) {
      console.error('Admin upload doc error:', err);
      triggerToast('อัปโหลดเอกสารไม่สำเร็จ', 'error');
    } finally {
      setUploadingAdminDocId(null);
      e.target.value = '';
    }
  };

  // Advanced Mode Delete Document Item or Clear Uploaded File
  const handleAdvancedDeleteDoc = async (doc, mode = 'delete_item') => {
    if (!profileModalReg || !doc) return;
    if (!isAdvancedMode && (doc.file_url || doc.status === 'approved')) {
      triggerToast('🔒 เอกสารนี้มีไฟล์แนบหรืออนุมัติแล้ว กรุณาเปิด "โหมดขั้นสูง" ก่อนทำการลบถาวร', 'warning');
      return;
    }

    const isClearFileOnly = mode === 'clear_file';
    const ok = await askConfirm({
      title: isClearFileOnly ? '⚠️ ยืนยันล้างไฟล์เอกสารที่แนบมา (โหมดขั้นสูง)' : '⚠️ ยืนยันลบรายการขอเอกสารและไฟล์แนบถาวร (โหมดขั้นสูง)',
      message: isClearFileOnly
        ? `ต้องการลบเฉพาะไฟล์แนบ "${doc.file_name || doc.title}" ออก แล้วรีเซ็ตให้ผู้สมัครส่งใหม่ใช่หรือไม่?`
        : `ต้องการลบรายการเอกสาร "${doc.title}" (รวมถึงไฟล์แนบถ้ามี) ออกจากผู้สมัครท่านนี้ถาวรใช่หรือไม่?`,
      confirmText: isClearFileOnly ? 'ล้างไฟล์แนบ' : 'ลบถาวร',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;

    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
    const updatedDocs = isClearFileOnly
      ? currentDocs.map(d =>
          d.id === doc.id
            ? { ...d, file_url: '', file_name: '', submitted_at: '', status: 'pending', note: 'ผู้ดูแลระบบล้างไฟล์เดิมเพื่อให้แนบใหม่' }
            : d
        )
      : currentDocs.filter(d => d.id !== doc.id);

    await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
    await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
    setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));
    triggerToast(isClearFileOnly ? `ล้างไฟล์แนบของ "${doc.title}" เรียบร้อยแล้ว` : `ลบรายการเอกสาร "${doc.title}" ถาวรเรียบร้อยแล้ว`);
  };

  // Clear All Requested Documents for Applicant (Advanced Mode)
  const handleClearAllRequestedDocs = async () => {
    if (!profileModalReg) return;
    if (!isAdvancedMode) {
      triggerToast('🔒 กรุณาเปิด "โหมดขั้นสูง" ก่อนลบรายการเอกสารทั้งหมด', 'warning');
      return;
    }
    const ok = await askConfirm({
      title: '⚠️ ยืนยันลบรายการขอเอกสารทั้งหมด (โหมดขั้นสูง)',
      message: `คุณต้องการล้างรายการขอเอกสารและไฟล์แนบทั้งหมดของ "${profileModalReg.first_name}" ออกจากระบบถาวรใช่หรือไม่?`,
      confirmText: 'ยืนยันลบเอกสารทั้งหมด',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;

    await DataService.updateRequestedDocs(profileModalReg.user_id, []);
    await onUpdateAllocation(profileModalReg.user_id, { requested_docs: [] });
    setProfileModalReg(prev => ({ ...prev, requested_docs: [] }));
    triggerToast('ล้างรายการขอเอกสารทั้งหมดของผู้สมัครเรียบร้อยแล้ว');
  };

  // Verify Document (Approve / Reject)
  const handleVerifyDoc = async (docId, status, note = '') => {
    if (!profileModalReg) return;
    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
    const idx = currentDocs.findIndex(d => d.id === docId);
    if (idx >= 0) {
      const targetDoc = currentDocs[idx];
      currentDocs[idx] = {
        ...targetDoc,
        status,
        note
      };
      await DataService.updateRequestedDocs(profileModalReg.user_id, currentDocs);
      await onUpdateAllocation(profileModalReg.user_id, { requested_docs: currentDocs });
      setProfileModalReg(prev => ({ ...prev, requested_docs: currentDocs }));

      if (notifyUserOnDocAction) {
        const chosenRequester = ADMIN_MESSAGE_SENDERS.find(s => s.key === (targetDoc.requested_by_key || docRequesterKey)) || ADMIN_MESSAGE_SENDERS[2] || ADMIN_MESSAGE_SENDERS[0];
        try {
          await DataService.sendAdminMessage(
            profileModalReg.user_id,
            status === 'approved'
              ? `เอกสาร "${targetDoc.title}" ของท่านได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้ว`
              : `เอกสาร "${targetDoc.title}" ไม่ผ่านการตรวจสอบ (${note || 'โปรดตรวจสอบความชัดเจน'}) กรุณาอัปโหลดไฟล์ใหม่ผ่านหน้าแดชบอร์ด`,
            {
              sender_key: chosenRequester.key,
              sender_name: chosenRequester.senderName,
              sender_role: chosenRequester.roleBadge,
              system_name: chosenRequester.systemName,
              color_theme: chosenRequester.colorTheme,
              title: status === 'approved' ? `อนุมัติเอกสาร: ${targetDoc.title}` : `แจ้งแก้ไขเอกสาร: ${targetDoc.title}`,
              sent_via: 'doc_request'
            }
          );
          const refreshed = await DataService.getRegistrations({ admin: true });
          const target = refreshed.find(r => r.user_id === profileModalReg.user_id);
          if (target) setProfileModalReg(target);
        } catch (notifyErr) {}
      }

      triggerToast(status === 'approved' ? 'อนุมัติเอกสารเรียบร้อย' : 'ส่งคำขอแก้ไขเอกสารแล้ว');
    }
  };

  const handleDeleteReg = async (userId, name, reg) => {
    const hasTransferred = reg && Boolean(
      reg.payment_status === 'paid' ||
      reg.payment_status === 'verified' ||
      reg.installment_1_status === 'paid' ||
      reg.installment_2_status === 'paid' ||
      reg.payment_slip_url ||
      reg.installment_1_slip_url ||
      reg.installment_2_slip_url ||
      reg.slip_url ||
      (reg.payment_status && reg.payment_status !== 'unpaid') ||
      (reg.installment_1_status && reg.installment_1_status !== 'unpaid') ||
      (reg.installment_2_status && reg.installment_2_status !== 'unpaid')
    );

    if (hasTransferred && !isAdvancedMode) {
      triggerToast('🔒 ผู้สมัครท่านนี้มีประวัติการโอนเงิน/ส่งสลิปแล้ว การลบข้อมูลจำเป็นต้องเปิด "โหมดแก้ไขขั้นสูง" ก่อน เพื่อความปลอดภัยทางบัญชี', 'error');
      return;
    }

    const ok = await askConfirm({
      title: hasTransferred ? '⚠️ ยืนยันการลบข้อมูล (โหมดขั้นสูง - มีประวัติโอนเงิน)' : 'ยืนยันการลบข้อมูลผู้สมัคร',
      message: hasTransferred 
        ? `คำเตือนระดับสูง: ผู้สมัคร "${name}" มีประวัติการชำระเงิน/แนบสลิปในระบบ การลบข้อมูลจะทำให้ข้อมูลบัญชีและสลิปถูกลบถาวร ต้องการยืนยันการลบจริงหรือไม่?`
        : `คุณต้องการลบข้อมูลผู้สมัคร "${name}" ออกจากระบบใช่หรือไม่? ข้อมูลทั้งหมดจะถูกลบถาวร`,
      confirmText: 'ยืนยันลบข้อมูลผู้สมัคร',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (ok) {
      await onDeleteRegistration(userId);
      triggerToast('ลบข้อมูลผู้สมัครเรียบร้อยแล้ว');
    }
  };

  // Calculate comprehensive registration payment, gender & Staff 280 THB metrics
  const regMetrics = (() => {
    let fullPlanCount = 0;
    let fullPlanPaidCount = 0;
    let installmentPlanCount = 0;
    let installmentBothPaidCount = 0;
    let fullyPaidCount = 0;
    let partialPaidCount = 0;
    let pendingReviewCount = 0;
    let unpaidTotalCount = 0;
    let totalCollectedAmount = 0;
    let totalOutstandingBalance = 0;
    let expectedTotalAmount = 0;

    let staffCount = 0;
    let staffPaidCount = 0;
    let staffPendingCount = 0;
    let staffUnpaidCount = 0;
    let staffCollectedAmount = 0;
    let participantCount = 0;
    let msuParticipantCount = 0;
    let externalParticipantCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let unknownGenderCount = 0;

    (registrations || []).forEach(reg => {
      const isStaff = isStaffRegistration(reg);
      const gender = resolveGender(reg);
      const isMsu = isMsuInstitution(reg.institution);

      if (gender === 'ชาย') maleCount++;
      else if (gender === 'หญิง') femaleCount++;
      else unknownGenderCount++;

      if (isStaff) {
        staffCount++;
      } else {
        participantCount++;
        if (isMsu) msuParticipantCount++;
        else externalParticipantCount++;
      }

      const totalFee = isStaff
        ? STAFF_SHIRT_FEE
        : (isMsu
            ? (paymentConfig?.fee_total_msu || 650)
            : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850));
      const round1Fee = isMsu
        ? (paymentConfig?.installment_round1_amount_msu || 400)
        : (paymentConfig?.installment_round1_amount_external || paymentConfig?.installment_round1_amount || 400);
      const round2Fee = isMsu
        ? (paymentConfig?.installment_round2_amount_msu || 250)
        : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);

      expectedTotalAmount += totalFee;

      // Staff never has 2-round installment payment (จ่ายแค่ค่าเสื้อ 280 บาท ครั้งเดียว)
      const isInstallment = !isStaff && (reg.payment_plan === 'installment' || Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url));

      if (isInstallment) {
        installmentPlanCount++;
        const isR1Paid = reg.installment_1_status === 'paid';
        const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url);
        const hasPending = reg.installment_1_status === 'pending_review' || reg.installment_2_status === 'pending_review';

        if (isR1Paid && isR2Paid) {
          installmentBothPaidCount++;
          fullyPaidCount++;
          totalCollectedAmount += totalFee;
        } else if (hasPending) {
          pendingReviewCount++;
          if (isR1Paid) {
            totalCollectedAmount += round1Fee;
            totalOutstandingBalance += round2Fee;
          } else {
            totalOutstandingBalance += totalFee;
          }
        } else if (isR1Paid) {
          // Paid round 1, round 2 unpaid
          partialPaidCount++;
          totalCollectedAmount += round1Fee;
          totalOutstandingBalance += round2Fee;
        } else {
          // Neither round paid
          unpaidTotalCount++;
          totalOutstandingBalance += totalFee;
        }
      } else {
        fullPlanCount++;
        const isPaid = reg.payment_status === 'paid' || (isStaff && reg.installment_1_status === 'paid');
        const isPending = reg.payment_status === 'pending_review' || (isStaff && reg.installment_1_status === 'pending_review');
        if (isPaid) {
          fullPlanPaidCount++;
          fullyPaidCount++;
          const paidAmt = isStaff ? STAFF_SHIRT_FEE : (reg.payment_amount !== undefined && reg.payment_amount !== null && Number(reg.payment_amount) > 0 ? Number(reg.payment_amount) : totalFee);
          totalCollectedAmount += paidAmt;
          if (isStaff) {
            staffPaidCount++;
            staffCollectedAmount += STAFF_SHIRT_FEE;
          }
        } else if (isPending) {
          pendingReviewCount++;
          totalOutstandingBalance += totalFee;
          if (isStaff) staffPendingCount++;
        } else {
          unpaidTotalCount++;
          totalOutstandingBalance += totalFee;
          if (isStaff) staffUnpaidCount++;
        }
      }
    });

    const all = registrations || [];
    const allergyCount = all.filter(r => hasFoodOrDrugAllergy(r)).length;
    const medicalCount = all.filter(r => hasMedicalCondition(r)).length;
    const specialCareCount = all.filter(r => Boolean(r.is_special_care)).length;

    return {
      total: all.length,
      participantCount,
      msuParticipantCount,
      externalParticipantCount,
      staffCount,
      staffPaidCount,
      staffPendingCount,
      staffUnpaidCount,
      staffCollectedAmount,
      maleCount,
      femaleCount,
      unknownGenderCount,
      fullPlanCount,
      fullPlanPaidCount,
      installmentPlanCount,
      installmentBothPaidCount,
      fullyPaidCount,
      partialPaidCount,
      pendingReviewCount,
      unpaidTotalCount,
      totalOutstandingCount: partialPaidCount + unpaidTotalCount,
      expectedTotalAmount,
      totalCollectedAmount,
      totalOutstandingBalance,
      allergyCount,
      medicalCount,
      specialCareCount
    };
  })();

  // Filtered registrations
  const filteredRegs = registrations.filter(reg => {
    const isStaff = isStaffRegistration(reg);
    const gender = resolveGender(reg);
    const uniInfo = resolveUniversityInfo(reg);
    const medText = getApplicantMedical(reg);
    const allergyText = getApplicantAllergy(reg);
    const textTarget = (
      (reg.first_name || '') + ' ' + 
      (reg.last_name || '') + ' ' + 
      (reg.full_name_affiliation || '') + ' ' +
      (reg.nickname || '') + ' ' +
      (reg.nickname_th || '') + ' ' +
      (reg.nickname_en || '') + ' ' +
      (reg.callsign || '') + ' ' +
      (reg.shirt_size || '') + ' ' +
      (reg.phone || '') + ' ' + 
      (reg.institution || '') + ' ' +
      (uniInfo.shortTag || '') + ' ' +
      (gender || '') + ' ' +
      (isStaff ? 'staff สตาฟ คณะทำงาน 280' : 'ผู้เข้าอบรม') + ' ' +
      (reg.user_email || '') + ' ' +
      (reg.group_assigned || '') + ' ' +
      (reg.room_assigned || '') + ' ' +
      (reg.special_notes || '') + ' ' +
      medText + ' ' +
      allergyText
    ).toLowerCase();

    const matchSearch = textTarget.includes(searchTerm.toLowerCase());
    const matchBlood = bloodFilter === 'all' || reg.blood_group === bloodFilter;
    const matchUni = uniFilter === 'all' || uniInfo.shortTag === uniFilter;
    const matchGender = genderFilter === 'all' || gender === genderFilter;
    const matchRole = roleFilter === 'all' || (roleFilter === 'staff' ? isStaff : !isStaff);
    
    let matchFilter = true;
    const isInstallment = !isStaff && (reg.payment_plan === 'installment' || Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url));
    const isR1Paid = reg.installment_1_status === 'paid';
    const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url);
    const isBothPaid = isInstallment ? (isR1Paid && isR2Paid) : (reg.payment_status === 'paid' || (isStaff && isR1Paid));
    const isPartialPaid = isInstallment && isR1Paid && !isR2Paid;
    const hasPendingReview = isInstallment 
      ? (reg.installment_1_status === 'pending_review' || reg.installment_2_status === 'pending_review') 
      : (reg.payment_status === 'pending_review' || (isStaff && reg.installment_1_status === 'pending_review'));
    const isUnpaid = isInstallment 
      ? (!isR1Paid && !isR2Paid && !hasPendingReview) 
      : (!isBothPaid && !hasPendingReview);
    const hasOutstanding = isPartialPaid || isUnpaid;

    if (filterType === 'special_care') matchFilter = Boolean(reg.is_special_care);
    else if (filterType === 'staff') matchFilter = isStaff;
    else if (filterType === 'participant_only') matchFilter = !isStaff;
    else if (filterType === 'has_allergy') matchFilter = hasFoodOrDrugAllergy(reg);
    else if (filterType === 'has_medical') matchFilter = hasMedicalCondition(reg);
    else if (filterType === 'full_plan') matchFilter = !isInstallment;
    else if (filterType === 'installment_plan') matchFilter = isInstallment;
    else if (filterType === 'fully_paid') matchFilter = isBothPaid;
    else if (filterType === 'paid') matchFilter = isBothPaid;
    else if (filterType === 'partial_paid') matchFilter = isPartialPaid;
    else if (filterType === 'pending_review') matchFilter = hasPendingReview;
    else if (filterType === 'unpaid') matchFilter = hasOutstanding;
    else if (filterType === 'unpaid_pure') matchFilter = isUnpaid;
    else if (filterType === 'no_group') matchFilter = !reg.group_assigned;
    else if (filterType === 'has_group') matchFilter = Boolean(reg.group_assigned);
    else if (filterType === 'no_room') matchFilter = !reg.room_assigned;
    else if (filterType === 'has_room') matchFilter = Boolean(reg.room_assigned);

    return matchSearch && matchBlood && matchUni && matchGender && matchRole && matchFilter;
  });

  // Export Excel (.xlsx) with all fields, dates, statuses, slips, photos, and remarks (Embeds actual visible images into cells)
  const handleExportExcel = async () => {
    if (!registrations || registrations.length === 0) {
      triggerToast('ยังไม่มีข้อมูลผู้สมัครในระบบ');
      return;
    }

    setIsExportingExcel(true);
    setExportProgress({ current: 0, total: registrations.length });
    try {
      const fileName = await exportRegistrationsToExcel(registrations, paymentConfig, (cur, total) => {
        setExportProgress({ current: cur, total });
      });
      triggerToast(`ส่งออกไฟล์ Excel สำเร็จ: ${fileName}`);
    } catch (err) {
      console.error('Export Excel error:', err);
      triggerToast('เกิดข้อผิดพลาดในการส่งออก Excel: ' + (err.message || ''));
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export CSV with Summary Tables at top (University x Gender Room Allocation, University x Shirt Sizes, Financial & Staff 280 Summary) + Sorted Detail Rows
  const handleExportCSV = async () => {
    if (!registrations || registrations.length === 0) {
      triggerToast('ยังไม่มีข้อมูลผู้สมัครในระบบ');
      return;
    }

    const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    // 1. Build Top Summary Sections so opening the CSV immediately shows clear University, Gender, Shirt & Financial breakdowns
    const summaryLines = [];
    summaryLines.push([esc('=== รายงานสรุปข้อมูลผู้สมัครและสตาฟ โครงการ JRE 2027 (แยกตามมหาวิทยาลัย / ชาย-หญิงจัดห้องพัก / ไซส์เสื้อ / ยอดการเงิน) ===')].join(','));
    summaryLines.push([
      esc('รวมผู้ลงทะเบียนทั้งหมด'), esc(`${regMetrics.total} คน`),
      esc('ผู้เข้าอบรมปกติ'), esc(`${regMetrics.participantCount} คน (มมส ${regMetrics.msuParticipantCount} / ต่างสถาบัน ${regMetrics.externalParticipantCount})`),
      esc('Staff คณะทำงาน (ชำระค่าเสื้อ 280 บ.)'), esc(`${regMetrics.staffCount} คน (ชำระแล้ว ${regMetrics.staffPaidCount} คน)`),
      esc('แยกเพศรวม'), esc(`ชาย ${regMetrics.maleCount} คน / หญิง ${regMetrics.femaleCount} คน${regMetrics.unknownGenderCount > 0 ? ` / ไม่ระบุ ${regMetrics.unknownGenderCount} คน` : ''}`),
      esc('ยอดรับเงินจริงรวม'), esc(`${regMetrics.totalCollectedAmount.toLocaleString()} บาท`),
      esc('ยอดค้างชำระรวม'), esc(`${regMetrics.totalOutstandingBalance.toLocaleString()} บาท`)
    ].join(','));
    summaryLines.push('');

    // Section A: University x Gender (Room Allocation) & Shirt Sizes Matrix
    summaryLines.push([esc('=== ตารางที่ 1: สรุปจำนวนคน แยกชาย-หญิง (สำหรับจัดห้องพัก) แยกประเภท Staff และแยกไซส์เสื้อแต่ละมหาวิทยาลัย ===')].join(','));
    summaryLines.push([
      esc('มหาวิทยาลัย (ตัวย่อ)'),
      esc('ชื่อสถาบันเต็ม'),
      esc('องค์กร/ชมรมกู้ภัย'),
      esc('รวมทั้งหมด (คน)'),
      esc('ชาย (คน)'),
      esc('หญิง (คน)'),
      esc('ชาย จัดห้องแล้ว/รอจัด'),
      esc('หญิง จัดห้องแล้ว/รอจัด'),
      esc('ผู้เข้าอบรม (คน)'),
      esc('Staff 280 บ. (คน)'),
      esc('รวมเสื้อ (ตัว)'),
      ...universitySummary.STANDARD_SIZES.map(sz => esc(`ไซส์ ${sz}`)),
      esc('สรุปรายการไซส์เสื้อของมหาลัยนี้'),
      esc('ยอดเงินที่ต้องรับรวม (บาท)'),
      esc('ยอดรับจริงแล้ว (บาท)'),
      esc('ยอดค้างชำระ (บาท)')
    ].join(','));

    universitySummary.list.forEach(u => {
      const sizeTextSummary = universitySummary.STANDARD_SIZES
        .filter(sz => (u.shirtSizes[sz] || 0) > 0)
        .map(sz => `${sz}=${u.shirtSizes[sz]} ตัว`)
        .join(' | ') || 'ยังไม่มีรายการ';
      summaryLines.push([
        esc(u.shortTag),
        esc(u.university),
        esc(u.club),
        esc(u.totalPeople),
        esc(u.maleCount),
        esc(u.femaleCount),
        esc(`จัดแล้ว ${u.maleRoomAssigned} / รอจัด ${u.maleRoomPending}`),
        esc(`จัดแล้ว ${u.femaleRoomAssigned} / รอจัด ${u.femaleRoomPending}`),
        esc(u.participantCount),
        esc(u.staffCount),
        esc(u.totalShirts),
        ...universitySummary.STANDARD_SIZES.map(sz => esc(u.shirtSizes[sz] || 0)),
        esc(sizeTextSummary),
        esc(u.expectedAmount),
        esc(u.collectedAmount),
        esc(u.outstandingAmount)
      ].join(','));
    });

    // Total Row for Table 1
    summaryLines.push([
      esc('รวมทั้งสิ้น'),
      esc('ทุกมหาวิทยาลัยรวมกัน'),
      esc('-'),
      esc(regMetrics.total),
      esc(regMetrics.maleCount),
      esc(regMetrics.femaleCount),
      esc('-'),
      esc('-'),
      esc(regMetrics.participantCount),
      esc(regMetrics.staffCount),
      esc(regMetrics.total),
      ...universitySummary.STANDARD_SIZES.map(sz => esc(universitySummary.list.reduce((acc, u) => acc + (u.shirtSizes[sz] || 0), 0))),
      esc(
        universitySummary.STANDARD_SIZES
          .map(sz => ({ sz, cnt: universitySummary.list.reduce((acc, u) => acc + (u.shirtSizes[sz] || 0), 0) }))
          .filter(x => x.cnt > 0)
          .map(x => `${x.sz}=${x.cnt} ตัว`)
          .join(' | ')
      ),
      esc(regMetrics.expectedTotalAmount),
      esc(regMetrics.totalCollectedAmount),
      esc(regMetrics.totalOutstandingBalance)
    ].join(','));
    summaryLines.push('');
    summaryLines.push([esc('=== ตารางที่ 2: รายชื่อผู้สมัครและ Staff รายบุคคล (เรียงตามมหาวิทยาลัย -> ประเภทผู้สมัคร/Staff -> เพศ ชาย/หญิง เพื่อจัดห้องพักง่าย) ===')].join(','));

    const headers = [
      'ลำดับ',
      'มหาวิทยาลัย (ตัวย่อ)',
      'เพศ (ชาย/หญิง)',
      'ประเภทผู้สมัคร (ผู้เข้าอบรม / Staff 280 บ.)',
      'ไซส์เสื้อฝึก JRE 2027',
      'ห้องนอนที่จัดสรร',
      'กลุ่มฝึกที่จัดสรร',
      'คำนำหน้า',
      'ชื่อ',
      'สกุล',
      'ชื่อเล่น',
      'รหัสนามเรียกขาน',
      'เบอร์โทร',
      'หน่วยงาน / มหาวิทยาลัยเต็ม',
      'สถานะการชำระเงิน',
      'ยอดค่าสมัครรวม (บาท)',
      'ยอดที่ชำระแล้ว (บาท)',
      'ยอดค้างชำระ (บาท)',
      'มียอดค้างชำระไหม',
      'จ่ายครั้งแรกวันที่',
      'จำนวนเงินงวดที่ 1 / เต็มจำนวน',
      'ครั้งที่ 2 วันที่',
      'จำนวนเงินงวดที่ 2',
      'ชื่อสกุลผู้ที่ติดต่อได้',
      'เบอร์โทรผู้ที่ติดต่อได้',
      'ความสัมพันธ์ผู้ติดต่อฉุกเฉิน',
      'โรคประจำตัว / ข้อจำกัดทางกาย',
      'ประวัติการแพ้ยา / แพ้อาหาร',
      'ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา',
      'รูปทำบัตร ID Card (สูตรแสดงภาพ =IMAGE)',
      'รูปทำบัตร ID Card (URL ลิงก์ตรง)',
      'อีเมล Google',
      'วันเกิด',
      'อายุ',
      'กรุ๊ปเลือด',
      'สถานะงวด 1',
      'สลิปงวด 1 (สูตร =IMAGE)',
      'สลิปงวด 1 (URL ลิงก์ตรง)',
      'สถานะงวด 2',
      'สลิปงวด 2 (สูตร =IMAGE)',
      'สลิปงวด 2 (URL ลิงก์ตรง)',
      'สลิปเต็มจำนวน (สูตร =IMAGE)',
      'สลิปเต็มจำนวน (URL ลิงก์ตรง)',
      'ดูแลพิเศษ',
      'หมายเหตุพิเศษ'
    ];

    // Sort registrations by University order -> Role (Participant first, then Staff) -> Gender (ชาย first, then หญิง) -> Name
    const uniOrderMap = {};
    OFFICIAL_NETWORK_INSTITUTIONS.forEach((inst, i) => { uniOrderMap[inst.shortTag] = i; });
    const sortedRegistrations = [...registrations].sort((a, b) => {
      const ua = resolveUniversityInfo(a).shortTag;
      const ub = resolveUniversityInfo(b).shortTag;
      const oa = uniOrderMap[ua] ?? 99;
      const ob = uniOrderMap[ub] ?? 99;
      if (oa !== ob) return oa - ob;
      if (ua !== ub) return ua.localeCompare(ub, 'th');
      const sa = isStaffRegistration(a) ? 1 : 0;
      const sb = isStaffRegistration(b) ? 1 : 0;
      if (sa !== sb) return sa - sb;
      const ga = resolveGender(a);
      const gb = resolveGender(b);
      if (ga !== gb) return ga === 'ชาย' ? -1 : 1;
      return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th');
    });

    const rows = await Promise.all(sortedRegistrations.map(async (r, idx) => {
      const { firstName, lastName } = resolveFirstAndLastName(r);
      const isStaff = isStaffRegistration(r);
      const gender = resolveGender(r);
      const uniInfo = resolveUniversityInfo(r);
      const isMsu = uniInfo.isMsu;
      const totalFee = isStaff ? STAFF_SHIRT_FEE : (isMsu ? 650 : 850);
      const round1Amount = isStaff ? STAFF_SHIRT_FEE : 400;
      const round2Amount = isStaff ? 0 : (isMsu ? 250 : 450);
      const isInstallment = !isStaff && (r.payment_plan === 'installment' || Boolean(r.installment_1_slip_url || r.installment_2_slip_url));

      let paidAmount = 0;
      const isR1Paid = r.installment_1_status === 'paid';
      const isR2Paid = r.installment_2_status === 'paid' && Boolean(r.installment_2_slip_url);
      if (isInstallment) {
        if (isR1Paid) paidAmount += round1Amount;
        if (isR2Paid) paidAmount += round2Amount;
      } else {
        if (r.payment_status === 'paid' || (isStaff && isR1Paid)) paidAmount = totalFee;
      }
      const remainingAmount = Math.max(0, totalFee - paidAmount);

      let paymentStatusDesc = '';
      if (isStaff) {
        if (r.payment_status === 'paid' || isR1Paid) {
          paymentStatusDesc = 'Staff (ชำระค่าเสื้อ 280 บาทครบแล้ว)';
        } else if (r.payment_status === 'pending_review' || r.installment_1_status === 'pending_review') {
          paymentStatusDesc = 'Staff 280 บาท (รอตรวจสอบสลิป)';
        } else {
          paymentStatusDesc = 'Staff 280 บาท (ยังไม่ชำระ)';
        }
      } else if (isInstallment) {
        if (isR1Paid && isR2Paid) {
          paymentStatusDesc = 'ผ่อนชำระ (จ่ายครบ 2 งวดแล้ว)';
        } else if (isR1Paid) {
          paymentStatusDesc = 'ผ่อนชำระ (ชำระงวดที่ 1 แล้ว)';
        } else if (r.installment_1_status === 'pending_review' || r.installment_2_status === 'pending_review') {
          paymentStatusDesc = 'ผ่อนชำระ (รอตรวจสอบสลิป)';
        } else {
          paymentStatusDesc = 'ผ่อนชำระ (ยังไม่ชำระ)';
        }
      } else {
        if (r.payment_status === 'paid') {
          paymentStatusDesc = 'จ่ายครบ (ชำระเต็มจำนวน)';
        } else if (r.payment_status === 'pending_review') {
          paymentStatusDesc = 'จ่ายครบ (รอตรวจสอบสลิป)';
        } else {
          paymentStatusDesc = 'ชำระเต็มจำนวน (ยังไม่ชำระ)';
        }
      }

      let paidRound1Date = '-';
      if (isInstallment) {
        if (r.installment_1_slip_date) {
          paidRound1Date = new Date(r.installment_1_slip_date).toLocaleString('th-TH');
        } else if (r.installment_1_status === 'paid') {
          paidRound1Date = 'ชำระแล้ว';
        } else {
          paidRound1Date = 'ยังไม่ชำระ';
        }
      } else {
        const dt = r.payment_slip_date || r.installment_1_slip_date;
        if (dt) {
          paidRound1Date = new Date(dt).toLocaleString('th-TH');
        } else if (r.payment_status === 'paid' || (isStaff && isR1Paid)) {
          paidRound1Date = 'ชำระแล้ว';
        } else {
          paidRound1Date = 'ยังไม่ชำระ';
        }
      }

      let paidRound1Amount = '';
      if (isStaff) {
        if (r.payment_status === 'paid' || isR1Paid) {
          paidRound1Amount = '280 บาท (ค่าเสื้อ Staff จ่ายครบ)';
        } else if (r.payment_status === 'pending_review' || r.installment_1_status === 'pending_review') {
          paidRound1Amount = '280 บาท (Staff รอตรวจสอบ)';
        } else {
          paidRound1Amount = '280 บาท (Staff ยังไม่ชำระ)';
        }
      } else if (isInstallment) {
        if (r.installment_1_status === 'paid') {
          paidRound1Amount = '400 บาท';
        } else if (r.installment_1_status === 'pending_review') {
          paidRound1Amount = '400 บาท (รอตรวจสอบ)';
        } else {
          paidRound1Amount = '400 บาท (ยังไม่ชำระ)';
        }
      } else {
        if (r.payment_status === 'paid') {
          paidRound1Amount = `${totalFee} บาท (จ่ายครบเต็มจำนวน)`;
        } else if (r.payment_status === 'pending_review') {
          paidRound1Amount = `${totalFee} บาท (รอตรวจสอบ)`;
        } else {
          paidRound1Amount = `${totalFee} บาท (ยังไม่ชำระ)`;
        }
      }

      let paidRound2Date = '-';
      if (isInstallment) {
        if (r.installment_2_slip_date) {
          paidRound2Date = new Date(r.installment_2_slip_date).toLocaleString('th-TH');
        } else if (isR2Paid) {
          paidRound2Date = 'ชำระแล้ว';
        } else {
          paidRound2Date = 'ยังไม่ชำระ';
        }
      } else {
        paidRound2Date = isStaff ? 'ไม่มีแบ่งจ่าย 2 งวด (Staff)' : '-';
      }

      let paidRound2Amount = '-';
      if (isInstallment) {
        if (isR2Paid) {
          paidRound2Amount = `${round2Amount} บาท`;
        } else if (r.installment_2_status === 'pending_review' && r.installment_2_slip_url) {
          paidRound2Amount = `${round2Amount} บาท (รอตรวจสอบ)`;
        } else {
          paidRound2Amount = `${round2Amount} บาท (ยังไม่ชำระ)`;
        }
      } else {
        paidRound2Amount = isStaff ? 'ไม่มี (โครงการออกให้)' : '-';
      }

      const remainingBalanceStatus = remainingAmount === 0 
        ? 'ไม่มี (ชำระครบถ้วนแล้ว)' 
        : `มียอดค้างชำระ ${remainingAmount} บาท`;

      const s1 = r.installment_1_slip_url ? await ensureHostedUrl(r.installment_1_slip_url, 'slip-round1.jpg') : '';
      const s2 = r.installment_2_slip_url ? await ensureHostedUrl(r.installment_2_slip_url, 'slip-round2.jpg') : '';
      const sFull = r.payment_slip_url ? await ensureHostedUrl(r.payment_slip_url, 'slip-full.jpg') : '';
      const idPhoto = r.id_card_photo ? await ensureHostedUrl(r.id_card_photo, 'id-card.jpg') : '';

      const roleLabel = isStaff
        ? 'Staff คณะทำงาน (ค่าเสื้อ 280 บาท)'
        : (isMsu ? 'ผู้เข้าอบรม มมส (650 บาท)' : 'ผู้เข้าอบรม ต่างสถาบัน (850 บาท)');

      return [
        idx + 1,
        esc(uniInfo.shortTag),
        esc(gender),
        esc(roleLabel),
        esc(normalizeSize(r.shirt_size || 'L')),
        esc(r.room_assigned || 'ยังไม่จัดสรร'),
        esc(r.group_assigned || 'ยังไม่จัดสรร'),
        esc(r.title || '-'),
        esc(firstName),
        esc(lastName),
        esc(r.nickname || '-'),
        esc(r.callsign || '-'),
        esc(r.phone || '-'),
        esc(r.institution || '-'),
        esc(paymentStatusDesc),
        esc(totalFee),
        esc(paidAmount),
        esc(remainingAmount),
        esc(remainingBalanceStatus),
        esc(paidRound1Date),
        esc(paidRound1Amount),
        esc(paidRound2Date),
        esc(paidRound2Amount),
        esc(r.emergency_name || '-'),
        esc(r.emergency_phone || '-'),
        esc(r.emergency_relation || '-'),
        esc(getApplicantMedical(r) || 'ไม่มี'),
        esc(getApplicantAllergy(r) || 'ไม่มี'),
        esc(r.previous_training && r.previous_training.trim() !== '' ? r.previous_training.trim() : 'ไม่มี'),
        esc(idPhoto ? `=IMAGE("${idPhoto}")` : 'ยังไม่แนบ'),
        esc(idPhoto || 'ยังไม่แนบ'),
        esc(r.user_email || '-'),
        esc(r.dob || '-'),
        esc(`${r.age_years || 0} ปี ${r.age_months || 0} เดือน`),
        esc(r.blood_group || '-'),
        esc(r.installment_1_status || '-'),
        esc(s1 ? `=IMAGE("${s1}")` : 'ยังไม่แนบ'),
        esc(s1 || 'ยังไม่แนบ'),
        esc(r.installment_2_status || '-'),
        esc(s2 ? `=IMAGE("${s2}")` : 'ยังไม่แนบ'),
        esc(s2 || 'ยังไม่แนบ'),
        esc(sFull ? `=IMAGE("${sFull}")` : 'ยังไม่แนบ'),
        esc(sFull || 'ยังไม่แนบ'),
        esc(r.is_special_care ? 'ใช่ (ดูแลพิเศษ)' : 'ปกติ'),
        esc(r.special_notes || '')
      ];
    }));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [
      ...summaryLines,
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRE2027_สรุปแยกมหาลัย_ชายหญิง_ไซส์เสื้อ_และรายชื่อทุกคน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("ส่งออกไฟล์ CSV สำเร็จ (พร้อมตารางสรุปแยกมหาลัย ชาย/หญิง ไซส์เสื้อ และ Staff 280 บ.)");
  };

  // Export Merchandise Shirt Orders to Excel (.xlsx)
  const handleExportMerchandiseExcel = async () => {
    if (!filteredShirtItems || filteredShirtItems.length === 0) {
      triggerToast('ไม่พบรายการเสื้อสำหรับส่งออก');
      return;
    }
    setIsExportingMerchExcel(true);
    setExportMerchProgress({ current: 0, total: filteredShirtItems.length });
    try {
      const fileName = await exportMerchandiseOrdersToExcel(filteredShirtItems, (cur, total) => {
        setExportMerchProgress({ current: cur, total });
      });
      triggerToast(`ส่งออกรายการเสื้อเป็น Excel สำเร็จ: ${fileName}`);
    } catch (err) {
      console.error('Export shirt orders Excel error:', err);
      triggerToast('เกิดข้อผิดพลาดในการส่งออก Excel: ' + (err.message || ''));
    } finally {
      setIsExportingMerchExcel(false);
    }
  };

  // Export Merchandise Shirt Orders to CSV with University x Shirt Size Breakdown at the top
  const handleExportMerchandiseCSV = async () => {
    if (!filteredShirtItems || filteredShirtItems.length === 0) {
      triggerToast('ไม่พบรายการเสื้อสำหรับส่งออก');
      return;
    }

    const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const summaryLines = [];
    summaryLines.push([esc('=== สรุปยอดเสื้อปฏิบัติการกู้ภัย JRE 2027 แยกตามมหาวิทยาลัยและไซส์เสื้อ (SS ถึง 5XL) ===')].join(','));
    summaryLines.push([
      esc('มหาวิทยาลัย (ตัวย่อ)'),
      esc('ชื่อสถาบันเต็ม'),
      esc('รวมเสื้อทั้งหมด (ตัว)'),
      esc('ชาย (คน)'),
      esc('หญิง (คน)'),
      esc('ผู้เข้าอบรม (ตัว)'),
      esc('Staff 280 บ. (ตัว)'),
      ...universitySummary.STANDARD_SIZES.map(sz => esc(`ไซส์ ${sz}`)),
      esc('สรุปรายการไซส์เสื้อของมหาลัยนี้')
    ].join(','));

    universitySummary.list.forEach(u => {
      const sizeText = universitySummary.STANDARD_SIZES
        .filter(sz => (u.shirtSizes[sz] || 0) > 0)
        .map(sz => `${sz}=${u.shirtSizes[sz]} ตัว`)
        .join(' | ') || 'ไม่มีรายการ';
      summaryLines.push([
        esc(u.shortTag),
        esc(u.university),
        esc(u.totalShirts),
        esc(u.maleCount),
        esc(u.femaleCount),
        esc(u.participantCount),
        esc(u.staffCount),
        ...universitySummary.STANDARD_SIZES.map(sz => esc(u.shirtSizes[sz] || 0)),
        esc(sizeText)
      ].join(','));
    });

    summaryLines.push([
      esc('รวมเสื้อทั้งหมด (ทุกสังกัด + หน้าร้าน)'),
      esc('-'),
      esc(sizeStats.totalShirts),
      esc(regMetrics.maleCount),
      esc(regMetrics.femaleCount),
      esc(regMetrics.participantCount),
      esc(regMetrics.staffCount),
      ...sizeStats.STANDARD_SIZES.map(sz => esc(sizeStats.counts[sz] || 0)),
      esc(
        sizeStats.STANDARD_SIZES
          .filter(sz => (sizeStats.counts[sz] || 0) > 0)
          .map(sz => `${sz}=${sizeStats.counts[sz]} ตัว`)
          .join(' | ')
      )
    ].join(','));
    summaryLines.push('');
    summaryLines.push([esc('=== รายการส่งมอบเสื้อรายบุคคล (เรียงตามมหาวิทยาลัย -> ประเภท -> เพศ -> ไซส์เสื้อ) ===')].join(','));

    const headers = [
      'ลำดับ',
      'มหาวิทยาลัย (ตัวย่อ)',
      'เพศ (ชาย/หญิง)',
      'ประเภทผู้รับเสื้อ',
      'ไซต์เสื้อ',
      'จำนวน (ตัว)',
      'ชื่อ',
      'สกุล',
      'ชื่อเล่น',
      'รหัสนามเรียกขาน',
      'เบอร์โทร',
      'หน่วยงานเต็ม',
      'ห้องนอน',
      'กลุ่มฝึก',
      'รหัสออเดอร์',
      'รายละเอียดสินค้า',
      'ยอดรวม (บาท)',
      'สถานะการชำระเงิน',
      'รูปสลิป (สูตรแสดงภาพ =IMAGE)',
      'สลิปโอนเงิน (URL ลิงก์ตรง)',
      'สถานะการส่งมอบ',
      'วันเวลาที่ส่งมอบ',
      'อีเมล'
    ];

    const uniOrderMap = {};
    OFFICIAL_NETWORK_INSTITUTIONS.forEach((inst, i) => { uniOrderMap[inst.shortTag] = i; });
    const sortedItems = [...filteredShirtItems].sort((a, b) => {
      const ua = a.uni_short || 'อื่นๆ';
      const ub = b.uni_short || 'อื่นๆ';
      const oa = uniOrderMap[ua] ?? 99;
      const ob = uniOrderMap[ub] ?? 99;
      if (oa !== ob) return oa - ob;
      if (ua !== ub) return ua.localeCompare(ub, 'th');
      if (Boolean(a.is_staff) !== Boolean(b.is_staff)) return a.is_staff ? 1 : -1;
      if ((a.gender || '') !== (b.gender || '')) return a.gender === 'ชาย' ? -1 : 1;
      return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th');
    });

    const rows = await Promise.all(sortedItems.map(async (it, idx) => {
      const { firstName, lastName } = resolveFirstAndLastName(it);
      const isReg = it.source === 'registration' || it.itemType === 'registration';
      const isReceived = it.pickup_status === 'received';
      const isPaid = it.payment_status === 'paid_verified' || it.payment_status === 'paid';
      const slipUrl = it.slip_url ? await ensureHostedUrl(it.slip_url, `slip-${it.order_number || 'shirt'}.jpg`) : '';

      const itemsSummary = Array.isArray(it.items) && it.items.length > 0
        ? it.items.map(p => `${p.product_name || 'เสื้อ'} (${p.size || it.shirt_size || it.size}) x${p.quantity || 1}`).join('; ')
        : `เสื้อปฏิบัติการกู้ภัย JRE 2027 (${it.shirt_size || it.size || 'L'}) x1`;

      const typeLabel = isReg
        ? (it.is_staff ? 'Staff คณะทำงาน (ค่าเสื้อ 280 บ.)' : 'ผู้เข้าอบรม (รวมในใบสมัคร)')
        : 'สั่งซื้อเพิ่มหน้าร้าน';

      return [
        idx + 1,
        esc(it.uni_short || resolveUniversityInfo(it).shortTag),
        esc(it.gender || resolveGender(it)),
        esc(typeLabel),
        esc(it.normalized_size || it.shirt_size || it.size || 'L'),
        esc(it.quantity || 1),
        esc(firstName),
        esc(lastName),
        esc(it.nickname || ''),
        esc(it.callsign || ''),
        esc(it.customer_phone || it.phone || '-'),
        esc(it.institution || '-'),
        esc(it.room_assigned || 'ยังไม่จัดสรร'),
        esc(it.group_assigned || 'ยังไม่จัดสรร'),
        esc(it.order_number || `ORD-${(it.id || '').slice(0, 8)}`),
        esc(itemsSummary),
        esc(it.total_amount || 0),
        esc(it.payment_badge || (isPaid ? 'ชำระแล้ว (อนุมัติ)' : (it.payment_status === 'pending_verification' ? 'รอตรวจสลิป' : 'ค้างชำระ'))),
        esc(slipUrl ? `=IMAGE("${slipUrl}")` : 'ไม่มีสลิป'),
        esc(slipUrl || 'ไม่มีสลิป'),
        esc(isReceived ? 'ส่งมอบแล้ว' : 'รอรับ'),
        esc(it.pickup_at ? new Date(it.pickup_at).toLocaleString('th-TH') : '-'),
        esc(it.user_email || '')
      ];
    }));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [
      ...summaryLines,
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRE2027_สรุปเสื้อแยกมหาลัย_และรายการส่งมอบทุกคน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("ส่งออกไฟล์ CSV รายการเสื้อสำเร็จ (พร้อมตารางสรุปเสื้อแยกมหาลัยและไซส์)");
  };

  // --- Handlers for Forms Config ---
  const handleSaveForms = async (e) => {
    if (e) e.preventDefault();
    await onSaveFormsConfig(localForms);
    setFormsSavedMsg(true);
    setIsEditingForms(false);
    triggerToast('บันทึกการตั้งค่า Google Form และสถานะเปิด/ปิดแล้ว');
    setTimeout(() => setFormsSavedMsg(false), 3000);
  };

  const handleToggleForm = (key) => {
    setLocalForms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key]?.enabled
      }
    }));
  };

  // --- Handlers for Merchandise & Orders ---
  const handleSaveMerchandiseConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingMerch(true);
    try {
      if (onSaveMerchandiseConfig) {
        await onSaveMerchandiseConfig(localMerchConfig);
      } else {
        await DataService.saveMerchandiseConfig(localMerchConfig);
      }
      setIsEditingMerchConfig(false);

      // Also sync central bank account to registration paymentConfig
      if (localMerchConfig.payment?.bank_name) {
        const updatedPayment = {
          ...localPayment,
          bank_name: localMerchConfig.payment.bank_name || localPayment.bank_name,
          bank_account_number: localMerchConfig.payment.account_number || localPayment.bank_account_number,
          bank_account_name: localMerchConfig.payment.account_name || localPayment.bank_account_name,
          bank_promptpay: localMerchConfig.payment.promptpay || localPayment.bank_promptpay,
          contact_phone: localMerchConfig.payment.contact_phone || localPayment.contact_phone
        };
        setLocalPayment(updatedPayment);
        if (onSavePaymentConfig) {
          await onSavePaymentConfig(updatedPayment);
        } else {
          await DataService.savePaymentConfig(updatedPayment);
        }
      }

      triggerToast('บันทึกการตั้งค่าสินค้า ไซต์ ราคา และซิงค์บัญชีธนาคารกลางเรียบร้อยแล้ว');
    } catch (err) {
      triggerToast('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    } finally {
      setIsSavingMerch(false);
    }
  };

  const handleAddSizeToProduct = () => {
    if (!newSizeName.trim()) {
      triggerToast('กรุณาระบุชื่อไซส์ เช่น 2XL, 3XL', 'warning');
      return;
    }
    const updatedProducts = [...(localMerchConfig.products || [])];
    const targetProduct = { ...updatedProducts[selectedProductIndex] };
    const sizes = [...(targetProduct.sizes || [])];
    
    sizes.push({
      name: newSizeName.trim(),
      chest: targetProduct.category === 'shirt' ? newSizeMeasurement.trim() : undefined,
      waist: targetProduct.category === 'pants' ? newSizeMeasurement.trim() : undefined,
      extra_price: Number(newSizeExtra) || 0,
      is_special: Number(newSizeExtra) > 0
    });

    targetProduct.sizes = sizes;
    updatedProducts[selectedProductIndex] = targetProduct;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    setNewSizeName('');
    setNewSizeMeasurement('');
    setNewSizeExtra(0);
    triggerToast(`เพิ่มไซส์ ${newSizeName.trim()} แล้ว (อย่าลืมกดปุ่มบันทึก)`);
  };

  const handleRemoveSizeFromProduct = (sizeIdx) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    const targetProduct = { ...updatedProducts[selectedProductIndex] };
    const sizes = [...(targetProduct.sizes || [])];
    sizes.splice(sizeIdx, 1);
    targetProduct.sizes = sizes;
    updatedProducts[selectedProductIndex] = targetProduct;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
  };

  const handleUpdateSizeExtraPrice = (sizeIdx, extraVal) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    const targetProduct = { ...updatedProducts[selectedProductIndex] };
    const sizes = [...(targetProduct.sizes || [])];
    sizes[sizeIdx] = {
      ...sizes[sizeIdx],
      extra_price: Number(extraVal) || 0,
      is_special: Number(extraVal) > 0
    };
    targetProduct.sizes = sizes;
    updatedProducts[selectedProductIndex] = targetProduct;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
  };

  const handleUpdateProductBasePrice = (newPrice) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    updatedProducts[selectedProductIndex] = {
      ...updatedProducts[selectedProductIndex],
      base_price: Number(newPrice) || 0
    };
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
  };

  const handleToggleProductEnabled = (prodIdx) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    const cur = { ...updatedProducts[prodIdx] };
    cur.enabled = cur.enabled === false ? true : false;
    updatedProducts[prodIdx] = cur;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    triggerToast(`${cur.enabled ? 'เปิดการแสดงผล' : 'ปิดการแสดงผล'} "${cur.name}" แล้ว (อย่าลืมกดบันทึก)`);
  };

  const handleToggleProductAllowOrder = (prodIdx) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    const cur = { ...updatedProducts[prodIdx] };
    cur.allow_order = cur.allow_order === false ? true : false;
    updatedProducts[prodIdx] = cur;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    triggerToast(`${cur.allow_order ? 'เปิดรับคำสั่งซื้อ' : 'ปิดรับสั่งซื้อชั่วคราว'} "${cur.name}" แล้ว (อย่าลืมกดบันทึก)`);
  };

  const handleBatchToggleCategory = (category, field, value) => {
    const updatedProducts = (localMerchConfig.products || []).map(p => {
      if (p.category === category) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    const catName = category === 'shirt' ? 'เสื้อ' : 'กางเกง';
    const fieldName = field === 'enabled' 
      ? (value ? 'เปิดแสดงผล' : 'ปิดการแสดงผล') 
      : (value ? 'เปิดรับคำสั่งซื้อ' : 'ปิดรับคำสั่งซื้อ');
    triggerToast(`ปรับสถานะหมวด${catName}: ${fieldName} ทั้งหมดแล้ว (อย่าลืมกดบันทึก)`);
  };

  const handleUpdateProductField = (prodIdx, field, value) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    updatedProducts[prodIdx] = {
      ...updatedProducts[prodIdx],
      [field]: value
    };
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
  };

  const handleAddProductImageUrl = (prodIdx) => {
    if (!newProductImageUrl.trim()) {
      triggerToast('กรุณากรอกลิงก์ URL รูปภาพสินค้า', 'warning');
      return;
    }
    const updatedProducts = [...(localMerchConfig.products || [])];
    const cur = { ...updatedProducts[prodIdx] };
    const images = Array.isArray(cur.images) ? [...cur.images] : (cur.image ? [cur.image] : []);
    images.push(newProductImageUrl.trim());
    cur.images = images;
    if (!cur.image) {
      cur.image = newProductImageUrl.trim();
    }
    updatedProducts[prodIdx] = cur;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    setNewProductImageUrl('');
    triggerToast('เพิ่มรูปภาพตัวอย่างสินค้าแล้ว (อย่าลืมกดบันทึกการตั้งค่า)');
  };

  const handleUploadProductImageFile = async (e, prodIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProductImg(true);
    try {
      const res = await DataService.uploadFile(file, 'merchandise');
      if (res && res.url) {
        const updatedProducts = [...(localMerchConfig.products || [])];
        const cur = { ...updatedProducts[prodIdx] };
        const images = Array.isArray(cur.images) ? [...cur.images] : (cur.image ? [cur.image] : []);
        images.push(res.url);
        cur.images = images;
        if (!cur.image) {
          cur.image = res.url;
        }
        updatedProducts[prodIdx] = cur;
        setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
        triggerToast('อัปโหลดรูปภาพสินค้าสำเร็จ');
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploadingProductImg(false);
      e.target.value = '';
    }
  };

  const handleRemoveProductImage = (prodIdx, imgIdx) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    const cur = { ...updatedProducts[prodIdx] };
    const images = Array.isArray(cur.images) ? [...cur.images] : [];
    const removedUrl = images[imgIdx];
    images.splice(imgIdx, 1);
    cur.images = images;
    if (cur.image === removedUrl) {
      cur.image = images[0] || '';
    }
    updatedProducts[prodIdx] = cur;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    triggerToast('ลบรูปภาพแล้ว');
  };

  const handleSetCoverProductImage = (prodIdx, imgUrl) => {
    const updatedProducts = [...(localMerchConfig.products || [])];
    const cur = { ...updatedProducts[prodIdx] };
    cur.image = imgUrl;
    updatedProducts[prodIdx] = cur;
    setLocalMerchConfig({ ...localMerchConfig, products: updatedProducts });
    triggerToast('ตั้งเป็นรูปภาพหน้าปกสินค้าแล้ว');
  };

  const handleUpdateMerchPaymentField = (field, value) => {
    setLocalMerchConfig(prev => ({
      ...prev,
      payment: {
        ...(prev.payment || {}),
        [field]: value
      }
    }));
  };

  // --- Handlers for Announcements ---
  const handleOpenAnnModal = (item = null) => {
    if (item) {
      setEditingAnn(item);
      setAnnTitle(item.title || '');
      setAnnContent(item.content || '');
      setAnnCategory(item.category || 'general');
      setAnnSlug(item.slug || '');
      setAnnUrl(item.action_url || '');
      setAnnLabel(item.action_label || '');
      setAnnPinned(Boolean(item.pinned));
      setAnnImages(Array.isArray(item.images) ? [...item.images] : []);
      setAnnPdfUrl(item.pdf_url || '');
      setAnnPdfName(item.pdf_name || '');
    } else {
      setEditingAnn(null);
      setAnnTitle('');
      setAnnContent('');
      setAnnCategory('general');
      setAnnSlug('');
      setAnnUrl('');
      setAnnLabel('');
      setAnnPinned(false);
      setAnnImages([]);
      setAnnPdfUrl('');
      setAnnPdfName('');
    }
    setShowAnnModal(true);
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const availableSlots = 10 - annImages.length;
    if (availableSlots <= 0) {
      triggerToast('แนบรูปภาพได้สูงสุด 10 รูปเท่านั้น');
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    setIsUploadingImage(true);

    try {
      const uploadedUrls = [];
      for (const file of filesToUpload) {
        const result = await DataService.uploadFile(file, 'images');
        if (result?.url) {
          uploadedUrls.push(result.url);
        }
      }
      setAnnImages(prev => [...prev, ...uploadedUrls]);
      triggerToast(`อัปโหลดสำเร็จ ${uploadedUrls.length} รูป`);
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setAnnImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      triggerToast('กรุณาเลือกไฟล์เอกสารนามสกุล .pdf เท่านั้น');
      return;
    }

    setIsUploadingPdf(true);
    try {
      const result = await DataService.uploadFile(file, 'pdfs');
      if (result?.url) {
        setAnnPdfUrl(result.url);
        setAnnPdfName(file.name);
        triggerToast(`อัปโหลดไฟล์ PDF สำเร็จ: ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PDF');
    } finally {
      setIsUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleRemovePdf = () => {
    setAnnPdfUrl('');
    setAnnPdfName('');
  };

  const handleSaveAnn = async (e) => {
    e.preventDefault();
    const cleanSlug = annSlug.trim().toLowerCase().replace(/[\s/]+/g, '-');
    const payload = {
      ...(editingAnn?.id ? { id: editingAnn.id } : {}),
      title: annTitle.trim(),
      content: annContent.trim(),
      category: annCategory,
      slug: cleanSlug,
      action_url: annUrl.trim(),
      action_label: annLabel.trim(),
      pinned: annPinned,
      images: annImages,
      pdf_url: annPdfUrl,
      pdf_name: annPdfName,
      created_at: editingAnn?.created_at || new Date().toISOString()
    };
    await onSaveAnnouncement(payload);
    setShowAnnModal(false);
    triggerToast('บันทึกประกาศข่าวสารและเอกสารแนบเรียบร้อย');
  };

  const handleDeleteAnn = async (id) => {
    const ok = await askConfirm({
      title: 'ยืนยันการลบประกาศ',
      message: 'คุณต้องการลบประกาศนี้ออกจากระบบใช่หรือไม่? ข้อมูลประกาศและเอกสารแนบจะถูกลบถาวร',
      confirmText: 'ยืนยันลบประกาศ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (ok) {
      await onDeleteAnnouncement(id);
      triggerToast('ลบประกาศเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {alertToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{alertToast}</span>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              JRE 2027 Admin Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              ระบบควบคุมและจัดการโครงการ (Admin)
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              ตรวจสอบสลิปการโอนเงิน, ส่งข้อความแจ้งเตือนผู้สมัคร, ขอเอกสารสำคัญ, ดูแลพิเศษ และจัดกลุ่ม/ห้องพัก
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowUniversalScanner(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-orange-950/40 border border-orange-300/50 transition-all active:scale-95 cursor-pointer"
              title="สแกน QR Code อัจฉริยะ (ตรวจบัตร ID, เช็คชื่อรับเสื้อฝึก, ส่งมอบสินค้า/ออเดอร์ ที่เดียวครบ)"
            >
              <QrCode className="w-4 h-4" />
              <span>📷 สแกน QR อัจฉริยะ (Universal Scanner)</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className={`px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all active:scale-95 cursor-pointer ${isExportingExcel ? 'opacity-80 cursor-wait' : ''}`}
              title="ส่งออกข้อมูลผู้สมัครทุกคน พร้อมฝังรูปถ่ายสลิปจริงลงในตาราง Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-200 animate-spin" />
                  <span>กำลังฝังรูปภาพลง Excel ({exportProgress.current}/{exportProgress.total})...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-100" />
                  <span>ส่งออกข้อมูลทุกคนเป็น Excel (.xlsx)</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ดาวน์โหลดไฟล์ CSV สำรอง"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>ดาวน์โหลด CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('catering')}
              className={`px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md border transition-all cursor-pointer active:scale-95 ${
                activeTab === 'catering'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-300 ring-2 ring-amber-400/40 shadow-amber-500/30'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold border-amber-400/30'
              }`}
              title="เปิดศูนย์ข้อมูลจัดเตรียมอาหาร & สุขภาวะ สำหรับฝ่ายจัดเลี้ยงและสวัสดิการ (URL: /admin/catering)"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-200" />
              <span>เตรียมอาหาร & สุขภาวะ ({regMetrics.allergyCount + regMetrics.medicalCount})</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setIsRefreshingData(true);
                try {
                  if (typeof onRefreshRegistrations === 'function') await onRefreshRegistrations();
                  if (typeof onRefreshUserAccounts === 'function') await onRefreshUserAccounts();
                } finally {
                  setTimeout(() => setIsRefreshingData(false), 500);
                }
              }}
              disabled={isRefreshingData}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="รีเฟรชดึงข้อมูลผู้สมัครและบัญชีล่าสุดทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshingData ? 'animate-spin' : ''}`} />
              <span>{isRefreshingData ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</span>
            </button>

            {onAdminLogout && (
              <button
                onClick={onAdminLogout}
                className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80 hover:border-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="ออกจากระบบผู้ดูแลระบบ (Admin Logout)"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>ออกจากระบบ Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metrics - Complete Payment Plans & Financial Overview */}
        <div className="mt-6 space-y-3">
          {/* Section Title */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                สรุปแผนการชำระเงิน & สถานะการเงินจริง (Real-time Financial Overview)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                🛠️ Staff (280 บ.): {regMetrics.staffCount} คน (จ่ายแล้ว {regMetrics.staffPaidCount})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
                👨 ชาย {regMetrics.maleCount} • 👩 หญิง {regMetrics.femaleCount}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                รับเงินจริงแล้ว: ฿{regMetrics.totalCollectedAmount.toLocaleString()} / ฿{regMetrics.expectedTotalAmount.toLocaleString()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold">
                ยอดค้างรับ: ฿{regMetrics.totalOutstandingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {/* 1. ผู้สมัครทั้งหมด */}
            <button
              type="button"
              onClick={() => { setFilterType('all'); setRoleFilter('all'); }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'all' && roleFilter === 'all'
                  ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold">ทั้งหมดในระบบ</span>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">{regMetrics.total} <span className="text-xs font-normal text-slate-400">คน</span></p>
              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">ชาย {regMetrics.maleCount} • หญิง {regMetrics.femaleCount}</div>
            </button>

            {/* 1b. Staff คณะทำงาน (280 บ.) */}
            <button
              type="button"
              onClick={() => { setFilterType('staff'); setRoleFilter('staff'); }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'staff' || roleFilter === 'staff'
                  ? 'bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-slate-950/70 border-purple-900/40 hover:border-purple-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-purple-300 font-bold">🛠️ Staff (280 บ.)</span>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-300 mt-1">{regMetrics.staffCount} <span className="text-xs font-normal text-purple-200">คน</span></p>
              <div className="text-[10px] text-purple-300/80 mt-0.5">จ่ายแล้ว {regMetrics.staffPaidCount} • รับ ฿{regMetrics.staffCollectedAmount.toLocaleString()}</div>
            </button>

            {/* 2. แผนจ่ายครบ (1 รอบ) */}
            <button
              type="button"
              onClick={() => setFilterType('full_plan')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'full_plan'
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-950/70 border-blue-900/40 hover:border-blue-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-400 font-bold">แผนจ่ายครบ 1 รอบ</span>
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1">{regMetrics.fullPlanCount} <span className="text-xs font-normal text-blue-300">คน</span></p>
              <div className="text-[10px] text-slate-400 mt-0.5">ชำระครบ {regMetrics.fullPlanPaidCount} คน</div>
            </button>

            {/* 3. แผนแบ่งจ่าย 2 งวด */}
            <button
              type="button"
              onClick={() => setFilterType('installment_plan')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'installment_plan'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/70 border-indigo-900/40 hover:border-indigo-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-indigo-400 font-bold">แผนแบ่งจ่าย 2 งวด</span>
                <PackageCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">{regMetrics.installmentPlanCount} <span className="text-xs font-normal text-indigo-300">คน</span></p>
              <div className="text-[10px] text-slate-400 mt-0.5">งวด 1 แล้ว {regMetrics.partialPaidCount} · ครบ {regMetrics.installmentBothPaidCount}</div>
            </button>

            {/* 4. ชำระเงินครบแล้ว (100%) */}
            <button
              type="button"
              onClick={() => setFilterType('fully_paid')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'fully_paid'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/70 border-emerald-900/40 hover:border-emerald-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-bold">ชำระเงินครบแล้ว</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{regMetrics.fullyPaidCount} <span className="text-xs font-normal text-emerald-300">คน</span></p>
              <div className="text-[10px] text-slate-400 mt-0.5">ครบถ้วน 100%</div>
            </button>

            {/* 5. ชำระงวด 1 แล้ว (ค้างงวด 2) */}
            <button
              type="button"
              onClick={() => setFilterType('partial_paid')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'partial_paid'
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                  : 'bg-slate-950/70 border-amber-900/40 hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-400 font-bold">ชำระงวด 1 (ค้างงวด 2)</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{regMetrics.partialPaidCount} <span className="text-xs font-normal text-amber-300">คน</span></p>
              <div className="text-[10px] text-amber-400/80 mt-0.5">รอชำระงวดที่ 2</div>
            </button>

            {/* 6. ค้างชำระ / มียอดค้าง */}
            <button
              type="button"
              onClick={() => setFilterType('unpaid')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterType === 'unpaid'
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                  : 'bg-slate-950/70 border-rose-900/40 hover:border-rose-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-rose-400 font-bold">ค้างชำระ</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{regMetrics.totalOutstandingCount} <span className="text-xs font-normal text-rose-300">คน</span></p>
              <div className="text-[10px] text-rose-400/80 mt-0.5">
                {regMetrics.partialPaidCount > 0 ? `ค้างงวด 2: ${regMetrics.partialPaidCount} คน` : 'ยังไม่ชำระ'}
              </div>
            </button>
          </div>

          {/* Sub Row: รอตรวจสลิป, แพ้อาหาร/ยา, มีโรคประจำตัว, ดูแลพิเศษ, จัดกลุ่ม, จัดห้องนอน */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setFilterType('pending_review')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterType === 'pending_review'
                  ? 'bg-yellow-950/40 border-yellow-500 ring-2 ring-yellow-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-yellow-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">รอตรวจสลิป:</span>
              </div>
              <span className="text-xs font-black text-yellow-400 ml-1">{regMetrics.pendingReviewCount} คน</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('has_allergy')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterType === 'has_allergy'
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">แพ้อาหาร/ยา:</span>
              </div>
              <span className="text-xs font-black text-amber-400 ml-1">{regMetrics.allergyCount} คน</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('has_medical')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterType === 'has_medical'
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-rose-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">มีโรคประจำตัว:</span>
              </div>
              <span className="text-xs font-black text-rose-400 ml-1">{regMetrics.medicalCount} คน</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('special_care')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterType === 'special_care'
                  ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-purple-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Star className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">ดูแลพิเศษ:</span>
              </div>
              <span className="text-xs font-black text-purple-400 ml-1">{regMetrics.specialCareCount} คน</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('has_group')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterType === 'has_group'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-indigo-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">จัดกลุ่มแล้ว:</span>
              </div>
              <span className="text-xs font-black text-indigo-400 ml-1">
                {registrations.filter(r => r.group_assigned).length}/{registrations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('has_room')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filterType === 'has_room'
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-300 truncate">จัดห้องแล้ว:</span>
              </div>
              <span className="text-xs font-black text-amber-400 ml-1">
                {registrations.filter(r => r.room_assigned).length}/{registrations.length}
              </span>
            </button>
          </div>

          {/* Dedicated Catering & Dietary Notice Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    🍽️ สรุปเตรียมอาหาร & สุขภาวะ (Catering & Health Hub)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    พบข้อจำกัด {regMetrics.allergyCount + regMetrics.medicalCount} รายการ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  สำหรับฝ่ายจัดเลี้ยง/สวัสดิการ และฝ่ายพยาบาล ตรวจสอบและคัดลอกรายชื่อส่งกลุ่ม LINE งานฝึกได้ทันที
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('catering')}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95 shrink-0"
              title="เปิดศูนย์ข้อมูลจัดเตรียมอาหาร & สุขภาวะ (URL: /admin/catering)"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>เปิดศูนย์จัดเตรียมอาหาร & สุขภาวะ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tabs - Multi-Platform Responsive (Mobile, Tablet, Desktop) */}
      <div className="space-y-2">
        {/* Mobile Dropdown Selector (< 768px) */}
        <div className="block md:hidden">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
            เลือกส่วนงานผู้ดูแลระบบ (Admin Section):
          </label>
          <div className="relative">
            <select
              value={activeTab === 'speakers' ? `speakers_${speakerCategoryFilter}` : activeTab}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'speakers_president') {
                  handleTabChange('speakers');
                  setSpeakerCategoryFilter('president');
                } else if (val === 'speakers_advisor') {
                  handleTabChange('speakers');
                  setSpeakerCategoryFilter('advisor');
                } else if (val === 'speakers_speaker' || val === 'speakers_all') {
                  handleTabChange('speakers');
                  setSpeakerCategoryFilter('speaker');
                } else {
                  handleTabChange(val);
                }
              }}
              className="w-full px-4 py-3 bg-slate-900 border-2 border-purple-500/60 rounded-2xl text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 shadow-xl shadow-purple-950/40 cursor-pointer"
            >
              <option value="applicants">📋 จัดการผู้สมัคร & ตรวจสอบสลิป ({registrations.length} คน)</option>
              <option value="catering">🍽️ ศูนย์ข้อมูลอาหาร & สุขภาวะ ({regMetrics.allergyCount + regMetrics.medicalCount} คน)</option>
              <option value="merchandise">👕 จัดการเสื้อ/กางเกง & สแกน QR ({sizeStats.totalShirts} ตัว)</option>
              <option value="payment_settings">⏱️ วันเวลาเปิด-ปิดรับสมัคร & ค่าลงทะเบียน 2 งวด</option>
              <option value="forms">📝 แบบทดสอบ & ประเมิน Google Forms</option>
              <option value="announcements">📢 ระบบประกาศ & สื่อประชาสัมพันธ์ ({announcements.length})</option>
              <option value="speakers_president">👑 ประธานในพิธี ({speakerStats.presidents} ท่าน)</option>
              <option value="speakers_advisor">👔 คณะที่ปรึกษาโครงการ ({speakerStats.advisors} ท่าน)</option>
              <option value="speakers_speaker">🎖️ วิทยากรประจำโครงการ ({speakerStats.speakersCount} ท่าน)</option>
              <option value="team">👥 คณะดำเนินงาน & ทีมงาน ({localTeam.length} คน)</option>
              <option value="users">👤 จัดการบัญชีผู้ใช้ ({userAccounts.length} บัญชี)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Pills Bar for Mobile, Tablet & Desktop Navigation */}
        <div className="flex border-b border-slate-800 gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleTabChange('applicants')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'applicants'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>จัดการผู้สมัคร ({registrations.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('catering')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'catering'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40 font-black'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
            <span>อาหาร & สุขภาวะ ({regMetrics.allergyCount + regMetrics.medicalCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('merchandise')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'merchandise'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Shirt className="w-4 h-4 text-rescue-400 shrink-0" />
            <span>จัดการเสื้อ & QR ({sizeStats.totalShirts} ตัว)</span>
          </button>

          <button
            onClick={() => handleTabChange('payment_settings')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'payment_settings'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>เปิด-ปิดรับสมัคร & ค่าธรรมเนียม</span>
          </button>

          <button
            onClick={() => handleTabChange('forms')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'forms'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>แบบทดสอบ & ประเมิน</span>
          </button>

          <button
            onClick={() => handleTabChange('announcements')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>ระบบประกาศ ({announcements.length})</span>
          </button>

          {/* Separated Pill for President */}
          <button
            onClick={() => { handleTabChange('speakers'); setSpeakerCategoryFilter('president'); }}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'speakers' && speakerCategoryFilter === 'president'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40 font-black'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>ประธานในพิธี ({speakerStats.presidents})</span>
          </button>

          {/* Separated Pill for Advisors */}
          <button
            onClick={() => { handleTabChange('speakers'); setSpeakerCategoryFilter('advisor'); }}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'speakers' && speakerCategoryFilter === 'advisor'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>ที่ปรึกษา ({speakerStats.advisors})</span>
          </button>

          {/* Separated Pill for Instructors */}
          <button
            onClick={() => { handleTabChange('speakers'); setSpeakerCategoryFilter(speakerCategoryFilter === 'president' || speakerCategoryFilter === 'advisor' ? 'speaker' : speakerCategoryFilter); }}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'speakers' && (speakerCategoryFilter === 'speaker' || speakerCategoryFilter === 'all')
                ? 'bg-emergency-600 text-white shadow-lg shadow-emergency-600/30 ring-2 ring-emergency-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Award className="w-4 h-4 text-orange-400 shrink-0" />
            <span>วิทยากร ({speakerStats.speakersCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('team')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'team'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <span>ทีมงาน ({localTeam.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('users')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>บัญชีผู้ใช้ ({userAccounts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: APPLICANTS & ALLOCATION & PROFILE VIEWER */}
      {activeTab === 'applicants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

          {/* COMPREHENSIVE SUMMARY HUB: UNIVERSITY x GENDER (ROOM ALLOCATION) x SHIRT SIZES x STAFF 280 */}
          <div className="bg-slate-950/85 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-inner">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-black mb-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>ตารางสรุปแยกแต่ละมหาวิทยาลัย • แยกชาย-หญิง (จัดห้องพักง่าย) • แยกไซส์เสื้อ • แยก Staff 280 บ.</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  สรุปยอดผู้สมัคร เสื้อฝึก และการเงิน แยกตามมหาวิทยาลัยเครือข่าย JRE 2027
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  คลิกที่ <strong className="text-amber-300">ชื่อมหาวิทยาลัย</strong>, <strong className="text-sky-300">ชาย/หญิง</strong> หรือ <strong className="text-purple-300">Staff (280 บ.)</strong> ในตารางเพื่อกรองดูรายชื่อและจัดห้องพักด้านล่างได้ทันที
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowShirtPrintModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ใบสรุปยอดเสื้อแยกมหาลัย</span>
                </button>
                {(uniFilter !== 'all' || genderFilter !== 'all' || roleFilter !== 'all' || filterType !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setUniFilter('all');
                      setGenderFilter('all');
                      setRoleFilter('all');
                      setFilterType('all');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>ล้างตัวกรองทั้งหมด</span>
                  </button>
                )}
              </div>
            </div>

            {/* Financial & Role Highlight Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>🏫 ผู้เข้าอบรม มมส (650 บ.)</span>
                  <span className="font-mono font-black">{regMetrics.msuParticipantCount} คน</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  แบ่งจ่าย 2 งวดได้ (400 + 250 บ.) หรือจ่ายเต็ม 650 บ.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-1">
                <div className="flex items-center justify-between text-blue-300 font-bold">
                  <span>🏢 ผู้เข้าอบรม ต่างสถาบัน (850 บ.)</span>
                  <span className="font-mono font-black">{regMetrics.externalParticipantCount} คน</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  รวมค่าหอพัก • แบ่งจ่าย 2 งวดได้ (400 + 450 บ.) หรือจ่ายเต็ม 850 บ.
                </p>
              </div>

              <div
                onClick={() => {
                  const next = roleFilter === 'staff' ? 'all' : 'staff';
                  setRoleFilter(next);
                  setFilterType(next === 'staff' ? 'staff' : 'all');
                }}
                className={`p-3.5 rounded-2xl border space-y-1 cursor-pointer transition-all ${
                  roleFilter === 'staff'
                    ? 'bg-purple-950/60 border-purple-400 ring-2 ring-purple-500/30'
                    : 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>🛠️ Staff คณะทำงาน (ค่าเสื้อ 280 บ.)</span>
                  <span className="font-mono font-black">{regMetrics.staffCount} คน</span>
                </div>
                <p className="text-[11px] text-purple-200/80">
                  ชำระแล้ว <strong className="text-emerald-400">{regMetrics.staffPaidCount}</strong> คน (฿{regMetrics.staffCollectedAmount.toLocaleString()}) • <span className="underline">ไม่มีแบ่งจ่าย 2 งวด</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>💰 สรุปยอดเงินรับจริงรวม</span>
                  <span className="font-mono font-black text-sm">฿{regMetrics.totalCollectedAmount.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  จากยอดรวม ฿{regMetrics.expectedTotalAmount.toLocaleString()} • ค้างชำระ <strong className="text-rose-400">฿{regMetrics.totalOutstandingBalance.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            {/* University x Gender (Room Allocation) & Shirt Size Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full min-w-[980px] text-left text-xs text-slate-200">
                <thead className="bg-slate-900 text-slate-300 text-[11px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">มหาวิทยาลัย / สังกัด</th>
                    <th className="py-3 px-2.5 text-center bg-slate-950/60">รวม (คน)</th>
                    <th className="py-3 px-2.5 text-center bg-sky-950/30 text-sky-300">👨 ชาย (จัดห้อง)</th>
                    <th className="py-3 px-2.5 text-center bg-pink-950/30 text-pink-300">👩 หญิง (จัดห้อง)</th>
                    <th className="py-3 px-2.5 text-center bg-purple-950/30 text-purple-300">🛠️ Staff (280 บ.)</th>
                    <th className="py-3 px-2.5 text-center bg-amber-950/30 text-amber-300">👕 รวมเสื้อ</th>
                    {universitySummary.STANDARD_SIZES.map(sz => (
                      <th key={sz} className="py-3 px-1.5 text-center font-mono text-[10px] text-amber-200 bg-slate-950/40">
                        {sz}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right bg-emerald-950/20 text-emerald-300">รับเงินแล้ว / ค้างรับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {universitySummary.list.map((u) => {
                    const isUniSelected = uniFilter === u.shortTag;
                    return (
                      <tr
                        key={u.shortTag}
                        onClick={() => setUniFilter(isUniSelected ? 'all' : u.shortTag)}
                        className={`transition-colors cursor-pointer ${
                          isUniSelected
                            ? 'bg-purple-950/40 hover:bg-purple-950/60'
                            : u.totalPeople > 0
                            ? 'bg-slate-950/40 hover:bg-slate-900/70'
                            : 'bg-slate-950/10 opacity-50 hover:opacity-80'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-black text-[11px] shrink-0 ${
                              u.isMsu
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}>
                              {u.shortTag}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate max-w-[210px]" title={u.university}>
                                {u.university}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[210px]">
                                {u.club}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2.5 text-center font-mono font-black text-sm text-white bg-slate-950/40">
                          {u.totalPeople}
                        </td>

                        {/* Male Count & Room Allocation */}
                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            setUniFilter(u.shortTag);
                            setGenderFilter(genderFilter === 'ชาย' && uniFilter === u.shortTag ? 'all' : 'ชาย');
                          }}
                          className="py-2.5 px-2.5 text-center bg-sky-950/15 hover:bg-sky-900/30 transition-colors"
                          title={`คลิกดูเฉพาะผู้ชายของ ${u.shortTag} เพื่อจัดห้องพัก`}
                        >
                          <div className="font-mono font-black text-sky-300 text-xs">
                            {u.maleCount} <span className="text-[10px] font-normal">คน</span>
                          </div>
                          {u.maleCount > 0 && (
                            <div className="text-[9px] text-slate-400">
                              ห้อง: <span className="text-emerald-400 font-bold">{u.maleRoomAssigned}</span>/<span className="text-amber-300">{u.maleCount}</span>
                            </div>
                          )}
                        </td>

                        {/* Female Count & Room Allocation */}
                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            setUniFilter(u.shortTag);
                            setGenderFilter(genderFilter === 'หญิง' && uniFilter === u.shortTag ? 'all' : 'หญิง');
                          }}
                          className="py-2.5 px-2.5 text-center bg-pink-950/15 hover:bg-pink-900/30 transition-colors"
                          title={`คลิกดูเฉพาะผู้หญิงของ ${u.shortTag} เพื่อจัดห้องพัก`}
                        >
                          <div className="font-mono font-black text-pink-300 text-xs">
                            {u.femaleCount} <span className="text-[10px] font-normal">คน</span>
                          </div>
                          {u.femaleCount > 0 && (
                            <div className="text-[9px] text-slate-400">
                              ห้อง: <span className="text-emerald-400 font-bold">{u.femaleRoomAssigned}</span>/<span className="text-amber-300">{u.femaleCount}</span>
                            </div>
                          )}
                        </td>

                        {/* Staff 280 Count */}
                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            setUniFilter(u.shortTag);
                            setRoleFilter(roleFilter === 'staff' && uniFilter === u.shortTag ? 'all' : 'staff');
                          }}
                          className="py-2.5 px-2.5 text-center bg-purple-950/15 hover:bg-purple-900/30 transition-colors"
                          title={`คลิกดูเฉพาะ Staff (280 บ.) ของ ${u.shortTag}`}
                        >
                          {u.staffCount > 0 ? (
                            <div>
                              <span className="font-mono font-black text-purple-300 text-xs">{u.staffCount} คน</span>
                              <span className="block text-[9px] text-slate-400">ผู้เข้าอบรม {u.participantCount}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Total Shirts */}
                        <td className="py-2.5 px-2.5 text-center font-mono font-black text-amber-300 bg-amber-950/15">
                          {u.totalShirts} <span className="text-[10px] font-normal">ตัว</span>
                        </td>

                        {/* Shirt Sizes Breakdown SS..5XL */}
                        {universitySummary.STANDARD_SIZES.map(sz => {
                          const cnt = u.shirtSizes[sz] || 0;
                          return (
                            <td key={sz} className="py-2.5 px-1.5 text-center font-mono">
                              {cnt > 0 ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[11px]">
                                  {cnt}
                                </span>
                              ) : (
                                <span className="text-slate-700 text-[10px]">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Financial Summary per University */}
                        <td className="py-2.5 px-3 text-right font-mono bg-emerald-950/10">
                          <div className="text-emerald-400 font-bold text-xs">
                            ฿{u.collectedAmount.toLocaleString()}
                          </div>
                          {u.outstandingAmount > 0 ? (
                            <div className="text-[10px] text-rose-400">
                              ค้าง ฿{u.outstandingAmount.toLocaleString()}
                            </div>
                          ) : u.totalPeople > 0 ? (
                            <div className="text-[10px] text-emerald-500">ครบ 100%</div>
                          ) : (
                            <div className="text-[10px] text-slate-600">-</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold text-xs text-white">
                  <tr>
                    <td className="py-3 px-3">รวมทั้งหมดทุกมหาวิทยาลัย</td>
                    <td className="py-3 px-2.5 text-center font-mono text-sm text-white">{regMetrics.total} คน</td>
                    <td className="py-3 px-2.5 text-center font-mono text-sky-300">👨 {regMetrics.maleCount} คน</td>
                    <td className="py-3 px-2.5 text-center font-mono text-pink-300">👩 {regMetrics.femaleCount} คน</td>
                    <td className="py-3 px-2.5 text-center font-mono text-purple-300">🛠️ {regMetrics.staffCount} คน</td>
                    <td className="py-3 px-2.5 text-center font-mono text-amber-300">{regMetrics.total} ตัว</td>
                    {universitySummary.STANDARD_SIZES.map(sz => {
                      const totalSz = universitySummary.list.reduce((acc, u) => acc + (u.shirtSizes[sz] || 0), 0);
                      return (
                        <td key={sz} className="py-3 px-1.5 text-center font-mono text-amber-300">
                          {totalSz > 0 ? totalSz : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="text-emerald-400">฿{regMetrics.totalCollectedAmount.toLocaleString()}</span>
                      {regMetrics.totalOutstandingBalance > 0 && (
                        <span className="block text-[10px] text-rose-400">ค้าง ฿{regMetrics.totalOutstandingBalance.toLocaleString()}</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, มหาลัย, เพศ, Staff, เบอร์โทร, ไซส์เสื้อ..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!isAdvancedMode) {
                    askConfirm({
                      title: '🛡️ เปิดโหมดแก้ไขขั้นสูง (Advanced Mode)',
                      message: 'โหมดนี้อนุญาตให้ผู้ดูแลระบบสามารถลบข้อมูลผู้สมัครที่มีประวัติการโอนเงิน/ส่งสลิปได้ โปรดใช้ด้วยความระมัดระวังเพื่อป้องกันความผิดพลาดทางบัญชี',
                      confirmText: 'เปิดใช้งานโหมดขั้นสูง',
                      cancelText: 'ยกเลิก',
                      variant: 'warning',
                      onConfirm: () => {
                        setIsAdvancedMode(true);
                        triggerToast('🛡️ เปิดใช้งานโหมดแก้ไขขั้นสูงแล้ว (สามารถลบ/จัดการข้อมูลที่มีประวัติการโอนเงินได้)', 'warning');
                      }
                    });
                  } else {
                    setIsAdvancedMode(false);
                    triggerToast('ปิดโหมดแก้ไขขั้นสูงแล้ว');
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAdvancedMode
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-2 ring-rose-400 animate-pulse'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600'
                }`}
                title="โหมดแก้ไขและลบข้อมูลขั้นสูง (Master Override สำหรับผู้ดูแลระบบ)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isAdvancedMode ? '🛡️ โหมดขั้นสูง (เปิดอยู่)' : '🛡️ โหมดแก้ไขขั้นสูง'}</span>
              </button>

              {/* University Filter */}
              <select
                value={uniFilter}
                onChange={e => setUniFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-purple-500/50 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              >
                <option value="all">🏛️ ทุกมหาวิทยาลัย ({regMetrics.total} คน)</option>
                {universitySummary.list.map(u => (
                  <option key={u.shortTag} value={u.shortTag}>
                    {u.shortTag} - {u.university} ({u.totalPeople} คน | ชาย {u.maleCount} หญิง {u.femaleCount})
                  </option>
                ))}
              </select>

              {/* Gender Filter for Room Allocation */}
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-sky-500/50 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
              >
                <option value="all">🚻 ทุกเพศ (ชาย {regMetrics.maleCount} / หญิง {regMetrics.femaleCount})</option>
                <option value="ชาย">👨 เฉพาะผู้ชาย ({regMetrics.maleCount} คน)</option>
                <option value="หญิง">👩 เฉพาะผู้หญิง ({regMetrics.femaleCount} คน)</option>
              </select>

              {/* Role Filter (Participant vs Staff 280) */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="all">👥 ทุกประเภท (ผู้เข้าอบรม + Staff)</option>
                <option value="participant">🎓 เฉพาะผู้เข้าอบรม ({regMetrics.participantCount} คน)</option>
                <option value="staff">🛠️ เฉพาะ Staff ค่าเสื้อ 280 บ. ({regMetrics.staffCount} คน)</option>
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="all">สถานะทั้งหมด ({regMetrics.total} คน)</option>
                <option value="staff">🛠️ เฉพาะ Staff 280 บ. ({regMetrics.staffCount} คน)</option>
                <option value="full_plan">💳 แผนจ่ายครบ ({regMetrics.fullPlanCount} คน)</option>
                <option value="installment_plan">📦 แผนแบ่งจ่าย 2 งวด ({regMetrics.installmentPlanCount} คน)</option>
                <option value="fully_paid">🟢 ชำระครบถ้วนแล้ว ({regMetrics.fullyPaidCount} คน)</option>
                <option value="partial_paid">🟡 ชำระงวด 1 (ค้างงวด 2) ({regMetrics.partialPaidCount} คน)</option>
                <option value="unpaid">🔴 ค้างชำระ ({regMetrics.totalOutstandingCount} คน)</option>
                <option value="pending_review">⏳ รอตรวจสลิป ({regMetrics.pendingReviewCount} คน)</option>
                <option value="has_allergy">🍽️ แพ้อาหาร / ยา ({regMetrics.allergyCount} คน)</option>
                <option value="has_medical">🩺 มีโรคประจำตัว ({regMetrics.medicalCount} คน)</option>
                <option value="special_care">⭐ ดูแลเป็นพิเศษ ({regMetrics.specialCareCount} คน)</option>
                <option value="no_group">ยังไม่จัดกลุ่ม ({registrations.filter(r => !r.group_assigned).length} คน)</option>
                <option value="has_group">จัดกลุ่มแล้ว ({registrations.filter(r => r.group_assigned).length} คน)</option>
                <option value="no_room">ยังไม่จัดห้องนอน ({registrations.filter(r => !r.room_assigned).length} คน)</option>
                <option value="has_room">จัดห้องนอนแล้ว ({registrations.filter(r => r.room_assigned).length} คน)</option>
              </select>

              <select
                value={bloodFilter}
                onChange={e => setBloodFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">ทุกกรุ๊ปเลือด</option>
                <option value="A">กรุ๊ป A</option>
                <option value="B">กรุ๊ป B</option>
                <option value="O">กรุ๊ป O</option>
                <option value="AB">กรุ๊ป AB</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 scrollbar-none">
            <table className="w-full min-w-[800px] text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4">ผู้สมัคร & สังกัด</th>
                  <th className="py-4 px-3">สถานะชำระเงิน / สลิป</th>
                  <th className="py-4 px-3">เอกสารแนบ</th>
                  <th className="py-4 px-3 min-w-[210px]">สุขภาพ / อาหาร / หมายเหตุ</th>
                  <th className="py-4 px-4 bg-indigo-950/40 text-indigo-300">
                    กลุ่มฝึก (Group)
                  </th>
                  <th className="py-4 px-4 bg-amber-950/40 text-amber-300">
                    ห้องนอน (Room)
                  </th>
                  <th className="py-4 px-3 text-center">ดูประวัติ / จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRegs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      ไม่พบข้อมูลผู้สมัครที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredRegs.map(reg => {
                    const isEditingThis = editingUserId === reg.user_id;
                    const paymentStatus = reg.payment_status || 'unpaid';
                    const allDocs = Array.isArray(reg.requested_docs) ? reg.requested_docs : [];
                    const docs = allDocs.filter(d => d.status !== 'cancelled');
                    const submittedDocsCount = docs.filter(d => d.file_url).length;
                    const msgs = Array.isArray(reg.admin_messages) ? reg.admin_messages : [];
                    const cardData = getRegistrationCardData(reg);
                    const isStaff = isStaffRegistration(reg);
                    const gender = resolveGender(reg);
                    const uniInfo = resolveUniversityInfo(reg);

                    return (
                      <tr 
                        key={reg.user_id || reg.id} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          reg.is_special_care ? 'bg-rose-950/10' : isStaff ? 'bg-purple-950/10' : ''
                        }`}
                      >
                        
                        {/* Name, Org, Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-3">
                            {reg.id_card_photo ? (
                              <div
                                onClick={() => handleOpenProfileModal(reg, 'info')}
                                className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 cursor-pointer hover:border-purple-400 transition-colors shadow"
                                title="คลิกดูประวัติและรูป ID Card"
                              >
                                <img src={reg.id_card_photo} alt="ID Card" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-slate-400 font-bold text-xs">
                                {reg.first_name ? reg.first_name.slice(0, 1) : 'U'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-white text-sm">
                                  {reg.first_name} {reg.last_name}
                                </span>
                                {reg.nickname && (
                                  <span className="text-amber-300 font-bold text-xs">
                                    ({reg.nickname})
                                  </span>
                                )}
                                {/* University Badge */}
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${
                                  uniInfo.isMsu
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                }`}>
                                  🏛️ {uniInfo.shortTag}
                                </span>
                                {/* Gender Badge for Room Allocation */}
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                  gender === 'ชาย'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                    : gender === 'หญิง'
                                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {gender === 'ชาย' ? '👨 ชาย' : gender === 'หญิง' ? '👩 หญิง' : 'ไม่ระบุเพศ'}
                                </span>
                                {reg.callsign && (
                                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-mono font-bold">
                                    📡 {reg.callsign}
                                  </span>
                                )}
                                <select
                                  value={['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(reg.shirt_size)) ? normalizeSize(reg.shirt_size) : 'อื่นๆ'}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleAssignPersonShirtSize(reg, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={updatingSizeId === (reg.user_id || reg.id)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer focus:outline-none transition-all ${
                                    !['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(reg.shirt_size))
                                      ? 'bg-rose-500/25 text-rose-200 border-rose-400/70 ring-1 ring-rose-400/40 animate-pulse'
                                      : 'bg-purple-500/20 text-purple-200 border-purple-500/40 hover:border-purple-400'
                                  }`}
                                  title="คลิกเพื่อระบุหรือเปลี่ยนไซส์เสื้อจริงรายคน (ขึ้นในระบบตามไซส์ทันที)"
                                >
                                  {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map(sz => (
                                    <option key={sz} value={sz} className="bg-slate-900 text-white">
                                      👕 ไซส์ {sz}
                                    </option>
                                  ))}
                                  <option value="อื่นๆ" className="bg-slate-900 text-amber-300">
                                    👕 {!['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(reg.shirt_size)) && reg.shirt_size && reg.shirt_size !== 'อื่นๆ'
                                      ? `อื่นๆ (${reg.shirt_size} - รอระบุไซส์)`
                                      : 'อื่นๆ (รอติดต่อระบุไซส์จริง)'}
                                  </option>
                                </select>
                                {isStaff ? (
                                  <span className="px-2 py-0.5 bg-purple-500/25 text-purple-200 border border-purple-400/50 rounded-full text-[10px] font-black">
                                    🛠️ Staff (ค่าเสื้อ 280 บ.)
                                  </span>
                                ) : isMsuInstitution(reg.institution) ? (
                                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-semibold">
                                    มมส (650 บ.)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-semibold">
                                    ต่างสถาบัน (850 บ.)
                                  </span>
                                )}
                                {reg.is_special_care && (
                                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1">
                                    ⭐ ดูแลพิเศษ
                                  </span>
                                )}
                                {hasFoodOrDrugAllergy(reg) && (
                                  <span 
                                    onClick={(e) => { e.stopPropagation(); handleOpenProfileModal(reg, 'info'); }}
                                    className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold cursor-pointer hover:bg-amber-500/30 flex items-center gap-1"
                                    title={`แพ้อาหาร/ยา: ${getApplicantAllergy(reg)}`}
                                  >
                                    🍽️ {getApplicantAllergy(reg)}
                                  </span>
                                )}
                                {hasMedicalCondition(reg) && (
                                  <span 
                                    onClick={(e) => { e.stopPropagation(); handleOpenProfileModal(reg, 'info'); }}
                                    className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold cursor-pointer hover:bg-rose-500/30 flex items-center gap-1"
                                    title={`โรคประจำตัว: ${getApplicantMedical(reg)}`}
                                  >
                                    🩺 {getApplicantMedical(reg)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                หน่วย: {cardData.unit} • สังกัด: {cardData.affiliation}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {reg.phone} • {reg.user_email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Payment Status & Slip */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          {isStaff ? (() => {
                            const isStaffPaid = paymentStatus === 'paid' || reg.installment_1_status === 'paid';
                            const isStaffPending = paymentStatus === 'pending_review' || reg.installment_1_status === 'pending_review';
                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenProfileModal(reg, 'payment')}
                                className="text-left group cursor-pointer block hover:opacity-90"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="px-1.5 py-0.5 bg-purple-500/25 text-purple-200 border border-purple-400/40 rounded text-[9px] font-black">
                                    🛠️ Staff 280 บ. (ครั้งเดียว)
                                  </span>
                                  {isStaffPaid ? (
                                    <span className="text-[10px] text-emerald-400 font-bold">✓ ชำระแล้ว</span>
                                  ) : isStaffPending ? (
                                    <span className="text-[10px] text-amber-300 font-bold animate-pulse">⏳ รอตรวจสลิป</span>
                                  ) : (
                                    <span className="text-[10px] text-rose-400 font-bold">🔴 ค้างชำระ</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-purple-300/90 font-mono">
                                  เฉพาะค่าเสื้อ: 280 บ. (ไม่มีแบ่ง 2 งวด)
                                </div>
                              </button>
                            );
                          })() : (reg.payment_plan ? reg.payment_plan === 'installment' : Boolean(reg.installment_1_slip_url || reg.installment_2_slip_url)) ? (() => {
                            const isMsu = isMsuInstitution(reg.institution);
                            const round2Amount = isMsu 
                              ? (paymentConfig?.installment_round2_amount_msu || 250) 
                              : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                            const isR1Paid = reg.installment_1_status === 'paid';
                            const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url);
                            const isBothPaid = isR1Paid && isR2Paid;

                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenProfileModal(reg, 'payment')}
                                className="text-left group cursor-pointer block hover:opacity-90"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-bold">
                                    แบ่งจ่าย 2 งวด
                                  </span>
                                  {isBothPaid ? (
                                    <span className="text-[10px] text-emerald-400 font-bold">✓ ครบ 2 งวด</span>
                                  ) : isR1Paid ? (
                                    <span className="text-[10px] text-amber-300 font-bold">ชำระงวด 1 แล้ว (ค้าง {round2Amount} บ.)</span>
                                  ) : (reg.installment_1_status === 'pending_review' || reg.installment_2_status === 'pending_review') ? (
                                    <span className="text-[10px] text-amber-300 font-medium">⏳ รอตรวจสลิป</span>
                                  ) : (
                                    <span className="text-[10px] text-rose-400 font-medium">🔴 ค้างชำระ</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className={isR1Paid ? 'text-emerald-400 font-bold' : reg.installment_1_status === 'pending_review' ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                                    งวด 1: {isR1Paid ? '✓ ชำระแล้ว' : reg.installment_1_status === 'pending_review' ? '🟡 รอตรวจ' : '🔴 ค้าง'}
                                  </span>
                                  <span className="text-slate-600">|</span>
                                  <span className={isR2Paid ? 'text-emerald-400 font-bold' : reg.installment_2_status === 'pending_review' ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                                    งวด 2: {isR2Paid ? '✓ ชำระแล้ว' : reg.installment_2_status === 'pending_review' ? '🟡 รอตรวจ' : !reg.installment_2_slip_url ? '⚪ ยังไม่ส่งสลิป' : '🔴 ค้าง'}
                                  </span>
                                </div>
                              </button>
                            );
                          })() : (() => {
                            const isMsu = isMsuInstitution(reg.institution);
                            const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenProfileModal(reg, 'payment')}
                                className="text-left group cursor-pointer block hover:opacity-90"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
                                    จ่ายครบ 1 รอบ
                                  </span>
                                  {paymentStatus === 'paid' ? (
                                    <span className="text-[10px] text-emerald-400 font-bold">✓ ชำระแล้ว</span>
                                  ) : paymentStatus === 'pending_review' ? (
                                    <span className="text-[10px] text-amber-300 font-bold animate-pulse">⏳ รอตรวจสลิป</span>
                                  ) : (
                                    <span className="text-[10px] text-rose-400 font-bold">🔴 ค้างชำระ</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ยอดเต็ม: {reg.payment_amount !== undefined && reg.payment_amount !== null ? reg.payment_amount : totalFee} บ.
                                </div>
                              </button>
                            );
                          })()}
                        </td>

                        {/* Documents Status & Quick Message Trigger */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          <div className="space-y-1.5">
                            {docs.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleOpenProfileModal(reg, 'docs')}
                                className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                                  submittedDocsCount === docs.length
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                                    : 'bg-blue-950/40 text-blue-300 border-blue-500/40 hover:bg-blue-900/50'
                                }`}
                                title="คลิกเพื่อตรวจเอกสาร / ยกเลิกการขอ / ลบขั้นสูง"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>ส่ง {submittedDocsCount}/{docs.length} รายการ</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenProfileModal(reg, 'docs')}
                                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white font-semibold cursor-pointer transition-colors"
                              >
                                + ขอ/จัดการเอกสาร
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenProfileModal(reg, 'messages')}
                              className="px-2 py-0.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-[10px] text-purple-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="ส่งข้อความแจ้งเตือนแยกตามฝ่าย/ระบบ"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>แจ้งเตือน ({msgs.length})</span>
                            </button>
                          </div>
                        </td>

                        {/* Health, Dietary & Special Notes */}
                        <td className="py-4 px-3 min-w-[210px] max-w-[280px]">
                          {(() => {
                            const medText = getApplicantMedical(reg);
                            const allergyText = getApplicantAllergy(reg);
                            const hasMed = hasMedicalCondition(reg);
                            const hasAllergy = hasFoodOrDrugAllergy(reg);
                            const hasSpecial = Boolean(reg.is_special_care || (reg.special_notes && reg.special_notes.trim() !== ''));

                            if (!hasMed && !hasAllergy && !hasSpecial) {
                              return (
                                <span className="inline-flex items-center gap-1.5 text-slate-500 text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                                  ปกติ (ไม่มีข้อจำกัด)
                                </span>
                              );
                            }

                            return (
                              <div className="space-y-1.5 text-xs">
                                {hasAllergy && (
                                  <div 
                                    onClick={() => handleOpenProfileModal(reg, 'info')}
                                    className="flex items-start gap-1.5 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] px-2 py-1 rounded-lg font-medium cursor-pointer hover:bg-amber-950/60 transition-colors shadow-sm"
                                    title={`ประวัติแพ้อาหาร / ยา / มังสวิรัติ: ${allergyText}`}
                                  >
                                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="leading-tight">
                                      <span className="font-bold text-amber-300">แพ้อาหาร/ยา:</span> {allergyText}
                                    </div>
                                  </div>
                                )}

                                {hasMed && (
                                  <div 
                                    onClick={() => handleOpenProfileModal(reg, 'info')}
                                    className="flex items-start gap-1.5 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[11px] px-2 py-1 rounded-lg font-medium cursor-pointer hover:bg-rose-950/60 transition-colors shadow-sm"
                                    title={`โรคประจำตัว / ข้อจำกัดทางกาย: ${medText}`}
                                  >
                                    <Stethoscope className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                    <div className="leading-tight">
                                      <span className="font-bold text-rose-300">โรคประจำตัว:</span> {medText}
                                    </div>
                                  </div>
                                )}

                                {hasSpecial && (
                                  <div 
                                    onClick={() => handleOpenProfileModal(reg, 'info')}
                                    className="flex items-start gap-1.5 bg-purple-950/40 border border-purple-500/40 text-purple-200 text-[11px] px-2 py-1 rounded-lg font-medium cursor-pointer hover:bg-purple-950/60 transition-colors shadow-sm"
                                    title={`ดูแลพิเศษ: ${reg.special_notes || 'จำเป็นต้องได้รับการดูแลพิเศษ'}`}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                    <div className="leading-tight">
                                      <span className="font-bold text-purple-300">ดูแลพิเศษ:</span> {reg.special_notes || 'ต้องดูแลพิเศษ'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Group Allocation */}
                        <td className="py-4 px-4 bg-indigo-950/20">
                          {isEditingThis ? (
                            <input
                              type="text"
                              value={allocGroup}
                              onChange={e => setAllocGroup(e.target.value)}
                              placeholder="เช่น Alpha-1"
                              className="w-32 px-2.5 py-1.5 bg-slate-950 border border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span className={reg.group_assigned ? 'font-bold text-indigo-300' : 'text-slate-500 italic'}>
                              {reg.group_assigned || 'ยังไม่จัดกลุ่ม'}
                            </span>
                          )}
                        </td>

                        {/* Room Allocation */}
                        <td className="py-4 px-4 bg-amber-950/20">
                          {isEditingThis ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={allocRoom}
                                onChange={e => setAllocRoom(e.target.value)}
                                placeholder="เช่น หอนอน 1 ห้อง 204"
                                className="w-36 px-2.5 py-1.5 bg-slate-950 border border-amber-500 rounded-lg text-xs text-white focus:outline-none block"
                              />
                              <select
                                value={['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(allocShirtSize)) ? normalizeSize(allocShirtSize) : 'อื่นๆ'}
                                onChange={e => setAllocShirtSize(e.target.value)}
                                className="w-36 px-2 py-1 bg-slate-950 border border-purple-500 rounded-lg text-[11px] text-purple-200 font-bold focus:outline-none block"
                              >
                                {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => (
                                  <option key={sz} value={sz}>👕 ไซส์ {sz}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className={reg.room_assigned ? 'font-bold text-amber-300' : 'text-slate-500 italic'}>
                              {reg.room_assigned || 'ยังไม่จัดห้อง'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-3 text-center">
                          {isEditingThis ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveAllocation(reg.user_id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                title="บันทึก"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                title="ยกเลิก"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Open Profile Modal */}
                              <button
                                onClick={() => handleOpenProfileModal(reg, 'info')}
                                className="px-2.5 py-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                                title="ดูประวัติเต็ม, สลิป, และส่งข้อความ"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-300" />
                                <span>ดูประวัติ</span>
                              </button>

                              <button
                                onClick={() => handleStartEditAllocation(reg)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                                title="จัดกลุ่ม & ห้องนอนด่วน"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {(() => {
                                const hasTransferredThis = Boolean(
                                  reg.payment_status === 'paid' ||
                                  reg.payment_status === 'verified' ||
                                  reg.installment_1_status === 'paid' ||
                                  reg.installment_2_status === 'paid' ||
                                  reg.payment_slip_url ||
                                  reg.installment_1_slip_url ||
                                  reg.installment_2_slip_url ||
                                  reg.slip_url ||
                                  (reg.payment_status && reg.payment_status !== 'unpaid') ||
                                  (reg.installment_1_status && reg.installment_1_status !== 'unpaid') ||
                                  (reg.installment_2_status && reg.installment_2_status !== 'unpaid')
                                );
                                const isDeleteBlocked = hasTransferredThis && !isAdvancedMode;

                                return (
                                  <button
                                    onClick={() => handleDeleteReg(reg.user_id, `${reg.first_name} ${reg.last_name}`, reg)}
                                    className={`p-1.5 rounded-xl transition-colors ${
                                      isDeleteBlocked
                                        ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'
                                        : 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 cursor-pointer'
                                    }`}
                                    title={
                                      isDeleteBlocked
                                        ? 'ผู้สมัครมีประวัติโอนเงิน/สลิป (ต้องเปิด "โหมดแก้ไขขั้นสูง" ก่อนจึงจะลบได้)'
                                        : 'ลบข้อมูล'
                                    }
                                  >
                                    {isDeleteBlocked ? (
                                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODAL: VIEW FULL PARTICIPANT PROFILE & REMARKS */}
      {profileModalReg && (
        <ModalPortal isOpen={Boolean(profileModalReg)} onClose={handleCloseProfileModal}>
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseProfileModal}
          >
            <div 
              className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
            
            <button
              onClick={handleCloseProfileModal}
              className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="relative group shrink-0">
                <img
                  src={profileModalReg.id_card_photo || profileModalReg.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-rescue-500 shadow-md"
                />
                {profileModalReg.id_card_photo && (
                  <button
                    type="button"
                    onClick={() => setPreviewDoc({ title: 'รูปถ่าย ID Card - ' + profileModalReg.first_name, file_url: profileModalReg.id_card_photo, file_name: 'id-card-photo.jpg' })}
                    className="absolute -bottom-1 -right-1 p-1 bg-slate-950/90 hover:bg-slate-900 text-rescue-400 border border-slate-700 rounded-lg text-[10px] font-bold shadow flex items-center gap-0.5"
                    title="คลิกดูรูปขนาดเต็ม"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {profileModalReg.first_name} {profileModalReg.last_name}
                  </h3>
                  {profileModalReg.nickname && (
                    <span className="text-amber-300 font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      ({profileModalReg.nickname})
                    </span>
                  )}
                  {profileModalReg.callsign && (
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full text-xs font-mono font-bold">
                      📡 {profileModalReg.callsign}
                    </span>
                  )}
                  {profileModalReg.shirt_size && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      !['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(profileModalReg.shirt_size))
                        ? 'bg-rose-500/25 text-rose-200 border-rose-400/50 animate-pulse'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}>
                      👕 ไซส์ {profileModalReg.shirt_size}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
                    🏛️ {resolveUniversityInfo(profileModalReg).shortTag}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    modalGender === 'ชาย'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : modalGender === 'หญิง'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {modalGender === 'ชาย' ? '👨 ชาย' : modalGender === 'หญิง' ? '👩 หญิง' : 'ไม่ระบุเพศ'}
                  </span>
                  {modalIsStaff ? (
                    <span className="px-2.5 py-0.5 bg-purple-500/25 text-purple-200 border border-purple-400/50 rounded-full text-xs font-black">
                      🛠️ Staff (ชำระค่าเสื้อ 280 บ. ครั้งเดียว)
                    </span>
                  ) : isMsuInstitution(profileModalReg.institution) ? (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
                      🏫 มมส (650 บ.)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
                      🏢 ต่างสถาบัน (850 บ. รวมหอพัก)
                    </span>
                  )}
                  {modalSpecialCare && (
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black animate-pulse flex items-center gap-1">
                      ⭐ ผู้เข้าร่วมดูแลเป็นพิเศษ
                    </span>
                  )}
                  {(() => {
                    const isInstallment = modalIsStaff
                      ? false
                      : (profileModalReg.payment_plan 
                          ? (profileModalReg.payment_plan === 'installment') 
                          : Boolean(profileModalReg.installment_1_slip_url || profileModalReg.installment_2_slip_url));
                    const isR1Paid = profileModalReg.installment_1_status === 'paid';
                    const isR2Paid = profileModalReg.installment_2_status === 'paid' && Boolean(profileModalReg.installment_2_slip_url);
                    const isBothPaid = isR1Paid && isR2Paid;
                    const isMsu = isMsuInstitution(profileModalReg.institution);
                    const round2Amount = isMsu 
                      ? (paymentConfig?.installment_round2_amount_msu || 250) 
                      : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);

                    let statusBadge = null;
                    if (isInstallment) {
                      if (isBothPaid || modalPaymentStatus === 'paid') {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                            ✓ ชำระครบ 2 งวดแล้ว
                          </span>
                        );
                      } else if (isR1Paid) {
                        if (profileModalReg.installment_2_status === 'pending_review') {
                          statusBadge = (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                              ⏳ รอตรวจสลิปงวดที่ 2 (ชำระงวด 1 แล้ว)
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold">
                              🟡 ชำระงวด 1 แล้ว (ค้างงวด 2: {round2Amount} บ.)
                            </span>
                          );
                        }
                      } else if (profileModalReg.installment_1_status === 'pending_review') {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                            ⏳ รอตรวจสลิปงวดที่ 1
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold">
                            🔴 ค้างชำระ ({modalPaymentAmount} บ.)
                          </span>
                        );
                      }
                    } else {
                      if (modalPaymentStatus === 'paid') {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                            ✓ ชำระเงินแล้ว
                          </span>
                        );
                      } else if (modalPaymentStatus === 'pending_review') {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                            ⏳ รอตรวจสลิป
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold">
                            🔴 ค้างชำระ ({modalPaymentAmount} บ.)
                          </span>
                        );
                      }
                    }

                    return (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isInstallment 
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {isInstallment ? '💳 แผนแบ่งจ่าย 2 งวด' : '🌟 แผนจ่ายครบ 1 รอบ'}
                        </span>
                        {statusBadge}
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  let thFullName = '';
                  let enFullName = '';

                  if (profileModalReg.full_name_affiliation) {
                    const parts = profileModalReg.full_name_affiliation.split('/');
                    if (parts.length >= 2) {
                      thFullName = parts[0].trim();
                      enFullName = parts.slice(1).join('/').trim();
                    } else {
                      thFullName = profileModalReg.full_name_affiliation.trim();
                    }
                  }

                  if (!thFullName) {
                    thFullName = `${profileModalReg.title || ''}${profileModalReg.first_name || ''} ${profileModalReg.last_name || ''}`.trim();
                  }
                  if (!enFullName && (profileModalReg.first_name_en || profileModalReg.last_name_en)) {
                    enFullName = `${profileModalReg.title_en ? profileModalReg.title_en + ' ' : ''}${profileModalReg.first_name_en || ''} ${profileModalReg.last_name_en || ''}`.trim();
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
                          {thFullName || `${profileModalReg.first_name || ''} ${profileModalReg.last_name || ''}`}
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
                          {getRegistrationCardData(profileModalReg).unit || '-'}
                        </span>
                      </div>

                      {/* บรรทัด 4: มหาวิทยาลัย/สถาบัน */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>สังกัด / Affiliation:</span>
                        </span>
                        <span className="text-slate-200 font-semibold">
                          {getRegistrationCardData(profileModalReg).affiliation || '-'}
                        </span>
                      </div>

                      {/* บรรทัด 4: เบอร์โทรศัพท์ (ถ้ามี) */}
                      {profileModalReg.phone && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>เบอร์โทรศัพท์:</span>
                          </span>
                          <span className="text-emerald-300 font-mono font-bold tracking-wider">
                            {profileModalReg.phone}
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
                          {profileModalReg.user_email || '-'}
                        </span>
                      </div>

                      {/* บรรทัด 6: รหัสอ้างอิงใบสมัคร */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>รหัสอ้างอิง:</span>
                        </span>
                        <span className="text-amber-400 font-mono font-black tracking-wider bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md inline-block w-fit">
                          JRE27-{(profileModalReg.id || profileModalReg.user_id || '').slice(0, 6).toUpperCase()}
                        </span>
                      </div>

                      {/* บรรทัด 7: วันเวลาที่สมัคร */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-slate-400 font-medium shrink-0 min-w-[130px] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>วันเวลาที่สมัคร:</span>
                        </span>
                        <span className="text-emerald-400 font-semibold font-mono">
                          {profileModalReg.created_at ? new Date(profileModalReg.created_at).toLocaleString('th-TH') : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Internal Navigation Tabs & Edit Safeguard Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 gap-3 mt-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setProfileModalTab('info')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    profileModalTab === 'info'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>ประวัติ & ดูแลพิเศษ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileModalTab('payment')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    profileModalTab === 'payment'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>การเงิน & สลิปโอนเงิน</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileModalTab('messages')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    profileModalTab === 'messages'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>ส่งข้อความแจ้งเตือน ({Array.isArray(profileModalReg.admin_messages) ? profileModalReg.admin_messages.length : 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileModalTab('docs')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    profileModalTab === 'docs'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>ขอ & ตรวจเอกสาร ({Array.isArray(profileModalReg.requested_docs) ? profileModalReg.requested_docs.length : 0})</span>
                </button>
              </div>

              {/* Edit Mode Safeguard Toggle & Advanced Mode Toggle */}
              <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isAdvancedMode;
                    setIsAdvancedMode(next);
                    triggerToast(next ? '🔓 เปิดโหมดขั้นสูงแล้ว (สามารถกดลบเอกสาร/ข้อความถาวรได้)' : '🔒 ปิดโหมดขั้นสูงแล้ว');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isAdvancedMode
                      ? 'bg-rose-600/25 hover:bg-rose-600/35 text-rose-200 border-rose-500/60 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="เปิดโหมดขั้นสูงเพื่อแสดงปุ่มลบเอกสารแนบและล้างประวัติถาวร"
                >
                  {isAdvancedMode ? <Unlock className="w-3.5 h-3.5 text-rose-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isAdvancedMode ? 'โหมดขั้นสูง: เปิดอยู่' : 'โหมดขั้นสูง (ลบถาวร)'}</span>
                </button>

                {(profileModalTab === 'info' || profileModalTab === 'payment') && (
                  isEditingProfileModal ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelProfileModal}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ยกเลิก (คืนค่าเดิม)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfileModal}
                        disabled={isSavingProfile}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>บันทึกข้อมูล</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfileModal(true)}
                      className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ปลดล็อกเพื่อแก้ไข</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* TAB 1: INFO & SPECIAL CARE & ALLOCATIONS */}
            {profileModalTab === 'info' && (
              <form onSubmit={handleSaveProfileModal} className="mt-5 space-y-6">
                {/* Edit Mode Warning Banner */}
                {isEditingProfileModal && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>⚠️ กำลังอยู่ในโหมดแก้ไขข้อมูล — อย่าลืมกด "บันทึกข้อมูล" หรือกด "ยกเลิก" เพื่อคืนค่าเดิม</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCancelProfileModal}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        บันทึก
                      </button>
                    </div>
                  </div>
                )}

                {/* Health & Dietary Notice Alert Box */}
                {(hasFoodOrDrugAllergy(profileModalReg) || hasMedicalCondition(profileModalReg) || profileModalReg.is_special_care) && (
                  <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/40 rounded-2xl space-y-2.5 text-xs shadow-md">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                      <span>ข้อควรระวังพิเศษสำหรับฝ่ายจัดเลี้ยงและพยาบาล (Dietary & Health Alerts)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {hasFoodOrDrugAllergy(profileModalReg) && (
                        <div className="bg-amber-950/50 border border-amber-500/40 p-2.5 rounded-xl">
                          <span className="text-amber-400 font-bold block text-[11px] mb-0.5">🍽️ ประวัติแพ้อาหาร / ยา / มังสวิรัติ:</span>
                          <span className="text-amber-100 font-semibold">{getApplicantAllergy(profileModalReg)}</span>
                        </div>
                      )}
                      {hasMedicalCondition(profileModalReg) && (
                        <div className="bg-rose-950/50 border border-rose-500/40 p-2.5 rounded-xl">
                          <span className="text-rose-400 font-bold block text-[11px] mb-0.5">🩺 โรคประจำตัว / ข้อจำกัดทางกาย:</span>
                          <span className="text-rose-100 font-semibold">{getApplicantMedical(profileModalReg)}</span>
                        </div>
                      )}
                    </div>
                    {profileModalReg.is_special_care && profileModalReg.special_notes && (
                      <div className="bg-purple-950/50 border border-purple-500/40 p-2.5 rounded-xl">
                        <span className="text-purple-300 font-bold block text-[11px] mb-0.5">⚠️ บันทึกการดูแลพิเศษ:</span>
                        <span className="text-purple-100">{profileModalReg.special_notes}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">อายุที่คำนวณได้</span>
                    <span className="font-bold text-rescue-400">
                      {profileModalReg.age_years || 0} ปี {profileModalReg.age_months || 0} เดือน
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      เกิด: {profileModalReg.dob || '-'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">กรุ๊ปเลือด</span>
                    <span className="font-bold text-red-400 text-sm">
                      {profileModalReg.blood_group}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 col-span-2">
                    <span className="text-slate-400 block text-[10px]">ผู้ติดต่อฉุกเฉิน</span>
                    <span className="font-bold text-white block truncate">
                      {profileModalReg.emergency_name || '-'}
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      โทร: {profileModalReg.emergency_phone || '-'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                        <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                        โรคประจำตัว / ข้อจำกัดทางกาย
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfileModal}
                        value={modalMedical}
                        onChange={e => setModalMedical(e.target.value)}
                        placeholder="เช่น ไม่มี หรือ โรคหอบหืด"
                        className={`w-full px-3 py-2 rounded-xl text-xs text-white transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                        ประวัติการแพ้ยา / แพ้อาหาร
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfileModal}
                        value={modalAllergy}
                        onChange={e => setModalAllergy(e.target.value)}
                        placeholder="เช่น ไม่มี หรือ แพ้ยาเพนนิซิลิน"
                        className={`w-full px-3 py-2 rounded-xl text-xs text-white transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา
                    </label>
                    <textarea
                      rows="2"
                      disabled={!isEditingProfileModal}
                      value={modalTraining}
                      onChange={e => setModalTraining(e.target.value)}
                      placeholder="ประวัติการฝึกอบรมกู้ภัย เช่น BLS, CPR, เชือกกู้ภัย"
                      className={`w-full px-3 py-2 rounded-xl text-xs text-white transition-all ${
                        !isEditingProfileModal 
                          ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                          : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-rose-950/30 via-slate-950 to-amber-950/20 border border-rose-500/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                      <h4 className="font-bold text-white text-sm">
                        การบันทึกดูแลพิเศษและการจัดสรร (Admin Remarks)
                      </h4>
                    </div>
                    
                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-600/40 transition-colors ${
                      !isEditingProfileModal ? 'bg-rose-950/30 cursor-not-allowed opacity-80' : 'bg-rose-950/60 hover:bg-rose-900/40 cursor-pointer'
                    }`}>
                      <input
                        type="checkbox"
                        disabled={!isEditingProfileModal}
                        checked={modalSpecialCare}
                        onChange={e => setModalSpecialCare(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-rose-400 disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-rose-300">
                        ⭐ กำหนดเป็นบุคคลดูแลพิเศษ (Special Care)
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rose-300 mb-1">
                      หมายเหตุจากแอดมิน / ข้อควรระวังพิเศษสำหรับทีมครูฝึกและทีมแพทย์:
                    </label>
                    <textarea
                      rows="3"
                      disabled={!isEditingProfileModal}
                      value={modalNotes}
                      onChange={e => setModalNotes(e.target.value)}
                      placeholder="ระบุข้อควรระวัง เช่น มีโรคประจำตัวหอบหืด ต้องพกยาพ่นติดตัวตลอดเวลา, ทานอาหารฮาลาล/มังสวิรัติ ฯลฯ"
                      className={`w-full px-3 py-2 rounded-xl text-xs text-white outline-none transition-all ${
                        !isEditingProfileModal 
                          ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                          : 'bg-slate-900 border border-rose-800/60 focus:ring-2 focus:ring-rose-500'
                      }`}
                    />
                  </div>

                  {/* Staff Role, Gender (Room Allocation) & Per-Person Shirt Size Assignment */}
                  <div className="p-3.5 bg-slate-950/90 border border-purple-500/40 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-black text-purple-200 flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-purple-400" />
                          การระบุประเภท Staff (280 บ.) • เพศ (แยกจัดห้องพัก) • ไซส์เสื้อรายคน
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          กรณีผู้สมัครเลือกไซส์ <strong className="text-rose-300">"อื่นๆ (ขนาดสั่งตัดพิเศษ)"</strong> แล้วแอดมินติดต่อสอบถามแล้ว สามารถคลิกเลือกไซส์จริงด้านล่างเพื่ออัปเดตเข้าระบบตามไซส์ได้ทันที
                        </span>
                      </div>

                      {/* Staff 280 THB Checkbox */}
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${
                        modalIsStaff
                          ? 'bg-purple-600/25 border-purple-400 text-purple-100 shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      } ${!isEditingProfileModal ? 'cursor-not-allowed opacity-85' : 'cursor-pointer hover:border-purple-400'}`}>
                        <input
                          type="checkbox"
                          disabled={!isEditingProfileModal}
                          checked={modalIsStaff}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setModalIsStaff(checked);
                            if (checked) {
                              setModalPaymentPlan('full');
                              if (modalPaymentStatus !== 'paid') {
                                setModalPaymentAmount(STAFF_SHIRT_FEE);
                              }
                            } else {
                              const isMsu = isMsuInstitution(profileModalReg.institution);
                              const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                              if (modalPaymentStatus !== 'paid') {
                                setModalPaymentAmount(totalFee);
                              }
                            }
                          }}
                          className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-purple-400"
                        />
                        <div>
                          <span className="text-xs font-black block">
                            🛠️ เป็น Staff (ชำระเฉพาะค่าเสื้อ 280 บ.)
                          </span>
                          <span className="text-[10px] text-purple-300 block">
                            จ่ายครั้งเดียว 280 บ. (ไม่มีแบ่งจ่าย 2 งวด ทั้ง มมส และ มข)
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Gender Selector for Room Allocation */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-sky-300 mb-1">
                          เพศ (สำหรับแยกชาย-หญิง จัดห้องพัก):
                        </label>
                        <select
                          disabled={!isEditingProfileModal}
                          value={modalGender}
                          onChange={e => setModalGender(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                            !isEditingProfileModal
                              ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                              : 'bg-slate-900 border border-sky-500/50 focus:ring-2 focus:ring-sky-500'
                          }`}
                        >
                          <option value="ชาย">👨 ชาย (จัดห้องพักชาย)</option>
                          <option value="หญิง">👩 หญิง (จัดห้องพักหญิง)</option>
                          <option value="ไม่ระบุ">⚪ ไม่ระบุ</option>
                        </select>
                      </div>

                      {/* Direct Per-Person Shirt Size Selector */}
                      <div className="sm:col-span-8 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-amber-300">
                            👕 ระบุไซส์เสื้อจริงรายคน (คลิกปุ่มไซส์เพื่ออัปเดตเข้าระบบตามไซส์ทันที):
                          </label>
                          <span className="text-[10px] text-slate-400">
                            ปัจจุบัน: <strong className="text-white font-mono">{modalShirtSize || profileModalReg.shirt_size || '-'}</strong>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map((sz) => {
                            const isSelectedSize = normalizeSize(modalShirtSize) === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                disabled={updatingSizeId === (profileModalReg.user_id || profileModalReg.id)}
                                onClick={async () => {
                                  setModalShirtSize(sz);
                                  await handleAssignPersonShirtSize(profileModalReg, sz);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer ${
                                  isSelectedSize
                                    ? sz === 'อื่นๆ'
                                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                                      : 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-white'
                                }`}
                                title={`คลิกเพื่อกำหนดไซส์ ${sz} ให้ ${profileModalReg.first_name} ทันที`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-indigo-300 mb-1">
                        กลุ่มฝึกปฏิบัติการ (Assigned Group):
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfileModal}
                        value={modalGroup}
                        onChange={e => setModalGroup(e.target.value)}
                        placeholder="เช่น Alpha-1"
                        className={`w-full px-3 py-2 rounded-xl text-xs text-white outline-none transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-indigo-700/60 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-1">
                        ห้องนอน / ที่พักค้างแรม (Assigned Room):
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfileModal}
                        value={modalRoom}
                        onChange={e => setModalRoom(e.target.value)}
                        placeholder="เช่น หอพักกุดรัง ห้อง 204"
                        className={`w-full px-3 py-2 rounded-xl text-xs text-white outline-none transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-amber-700/60 focus:ring-2 focus:ring-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {!isEditingProfileModal ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfileModal(true)}
                      className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>ปลดล็อกเพื่อแก้ไขข้อมูลและหมายเหตุ</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelProfileModal}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>ยกเลิก (คืนค่าเดิม)</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>บันทึกข้อมูลและหมายเหตุ</span>
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}

            {/* TAB 2: PAYMENT & SLIP VERIFICATION */}
            {profileModalTab === 'payment' && (
              <div className="mt-5 space-y-6 text-xs">
                {/* Edit Mode Warning Banner */}
                {isEditingProfileModal && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>⚠️ กำลังอยู่ในโหมดแก้ไขข้อมูลการเงิน — อย่าลืมกด "บันทึก" หรือกด "ยกเลิก" เพื่อคืนค่าเดิม</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCancelProfileModal}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfileModal}
                        disabled={isSavingProfile}
                        className="px-3.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        บันทึก
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      การจัดการยอดชำระเงินและตรวจสอบสลิป
                    </h4>

                    {/* Staff 280 THB Checkbox in Payment Tab */}
                    <label className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${
                      modalIsStaff
                        ? 'bg-purple-600/25 border-purple-400 text-purple-100 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    } ${!isEditingProfileModal ? 'cursor-not-allowed opacity-85' : 'cursor-pointer hover:border-purple-400'}`}>
                      <input
                        type="checkbox"
                        disabled={!isEditingProfileModal}
                        checked={modalIsStaff}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setModalIsStaff(checked);
                          if (checked) {
                            setModalPaymentPlan('full');
                            if (modalPaymentStatus !== 'paid') {
                              setModalPaymentAmount(STAFF_SHIRT_FEE);
                            }
                            if (!modalPaymentNotes) {
                              setModalPaymentNotes('Staff โครงการ - ชำระเฉพาะค่าเสื้อ 280 บาท (จ่ายครั้งเดียว)');
                            }
                          } else {
                            const isMsu = isMsuInstitution(profileModalReg.institution);
                            const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                            if (modalPaymentStatus !== 'paid') {
                              setModalPaymentAmount(totalFee);
                            }
                          }
                        }}
                        className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-purple-400"
                      />
                      <div>
                        <span className="text-xs font-black block">
                          🛠️ เป็น Staff โครงการ (โอนเฉพาะค่าเสื้อ 280 บ. ครั้งเดียว)
                        </span>
                        <span className="text-[10px] text-purple-300 block">
                          ค่าใช้จ่ายที่เหลือโครงการออกให้ • ไม่มีแบ่งจ่าย 2 งวด ทั้ง มมส และ มข
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">แผนการชำระเงิน:</label>
                      <select
                        disabled={!isEditingProfileModal || modalIsStaff}
                        value={modalIsStaff ? 'full' : modalPaymentPlan}
                        onChange={e => {
                          if (modalIsStaff) {
                            setModalPaymentPlan('full');
                            return;
                          }
                          const newPlan = e.target.value;
                          setModalPaymentPlan(newPlan);
                          const isMsu = isMsuInstitution(profileModalReg.institution);
                          const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                          const round2Fee = isMsu ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                          if (newPlan === 'installment') {
                            const isR1Paid = profileModalReg.installment_1_status === 'paid';
                            if (isR1Paid) {
                              setModalPaymentAmount(round2Fee);
                            } else {
                              setModalPaymentAmount(totalFee);
                            }
                          } else {
                            if (modalPaymentStatus === 'paid') {
                              setModalPaymentAmount(0);
                            } else {
                              setModalPaymentAmount(totalFee);
                            }
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-white font-bold transition-all ${
                          !isEditingProfileModal || modalIsStaff
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-slate-700'
                        }`}
                      >
                        <option value="full">
                          {modalIsStaff ? '🛠️ Staff จ่ายครั้งเดียว (280 บ.)' : '🌟 จ่ายครบ 1 รอบ'}
                        </option>
                        {!modalIsStaff && (
                          <option value="installment">💳 แบ่งจ่าย 2 งวด</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">สถานะการชำระเงิน:</label>
                      <select
                        disabled={!isEditingProfileModal}
                        value={modalPaymentStatus}
                        onChange={e => setModalPaymentStatus(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-white font-bold transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-slate-700'
                        }`}
                      >
                        <option value="unpaid">🔴 ค้างชำระ (Unpaid)</option>
                        <option value="pending_review">🟡 รอตรวจสอบสลิป (Pending Review)</option>
                        <option value="paid">🟢 ชำระเงินแล้ว (Paid)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">จำนวนเงินที่ต้องชำระ (บาท):</label>
                      <input
                        type="number"
                        disabled={!isEditingProfileModal}
                        value={modalPaymentAmount}
                        onChange={e => setModalPaymentAmount(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-white font-mono transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">หมายเหตุเรื่องเงิน:</label>
                      <input
                        type="text"
                        disabled={!isEditingProfileModal}
                        value={modalPaymentNotes}
                        onChange={e => setModalPaymentNotes(e.target.value)}
                        placeholder="เช่น ชำระครบถ้วน, โอนผ่าน SCB / พร้อมเพย์"
                        className={`w-full px-3 py-2 rounded-xl text-white transition-all ${
                          !isEditingProfileModal 
                            ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                            : 'bg-slate-900 border border-slate-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">ข้อมูลบัญชีรับโอนเงิน:</label>
                    <input
                      type="text"
                      disabled={!isEditingProfileModal}
                      value={modalPaymentBank}
                      onChange={e => setModalPaymentBank(e.target.value)}
                      placeholder="ธนาคารไทยพาณิชย์ (SCB) เลขที่ 594-264865-5 ชื่อบัญชี นางสาวมัญชุพร ยังเหล็ก"
                      className={`w-full px-3 py-2 rounded-xl text-white transition-all ${
                        !isEditingProfileModal 
                          ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80' 
                          : 'bg-slate-900 border border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    {!isEditingProfileModal ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfileModal(true)}
                        className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>ปลดล็อกเพื่อแก้ไขข้อมูลการเงิน</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleCancelProfileModal}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>ยกเลิก (คืนค่าเดิม)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProfileModal}
                          disabled={isSavingProfile}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>บันทึกสถานะการชำระเงิน</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 2-Round Installments Review if participant opted for installments */}
                {(profileModalReg.payment_plan ? profileModalReg.payment_plan === 'installment' : Boolean(profileModalReg.installment_1_slip_url || profileModalReg.installment_2_slip_url)) ? (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-white text-sm">หลักฐานการชำระแบบแบ่งจ่าย 2 งวด</h4>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                        แผนผ่อนชำระ 2 งวด
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ROUND 1 */}
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300 text-xs">งวดที่ 1: {paymentConfig?.installment_round1_amount || 400} บาท</span>
                          {profileModalReg.installment_1_status === 'paid' ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
                              ✓ อนุมัติแล้ว
                            </span>
                          ) : profileModalReg.installment_1_slip_url ? (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded">
                              ⏳ รอตรวจสอบ
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded">
                              ยังไม่ส่งสลิป
                            </span>
                          )}
                        </div>

                        {profileModalReg.installment_1_slip_url ? (
                          <div className="space-y-2">
                            <div
                              onClick={() => setPreviewDoc({ title: 'สลิปงวดที่ 1 - ' + profileModalReg.first_name, file_url: profileModalReg.installment_1_slip_url, file_name: 'installment-1-slip.jpg' })}
                              className="cursor-pointer group relative w-full h-44 rounded-xl overflow-hidden border border-slate-700 bg-slate-950"
                            >
                              <img
                                src={profileModalReg.installment_1_slip_url}
                                alt="สลิปงวด 1"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                                <Eye className="w-4 h-4" /> คลิกเพื่อขยาย
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                              <span>ส่งเมื่อ: {profileModalReg.installment_1_slip_date ? new Date(profileModalReg.installment_1_slip_date).toLocaleString('th-TH') : '-'}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const hosted = await ensureHostedUrl(profileModalReg.installment_1_slip_url, 'slip-round1.jpg');
                                    await navigator.clipboard.writeText(hosted);
                                    triggerToast('คัดลอกลิงก์สลิปงวด 1 แล้ว');
                                  }}
                                  className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                  title="คัดลอก URL ลิงก์สลิป"
                                >
                                  <Copy className="w-3 h-3 text-cyan-400" />
                                  <span>ก๊อปลิ้งค์</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ title: 'สลิปงวดที่ 1 - ' + profileModalReg.first_name, file_url: profileModalReg.installment_1_slip_url, file_name: 'installment-1-slip.jpg' })}
                                  className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                  title="เปิดดูสลิป"
                                >
                                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                                  <span>เปิดดู</span>
                                </button>
                              </div>
                            </div>

                            {profileModalReg.installment_1_notes && (
                              <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                                หมายเหตุ: {profileModalReg.installment_1_notes}
                              </p>
                            )}

                            {profileModalReg.slip_ocr_round1 && (
                              <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                                profileModalReg.slip_ocr_round1.isFullyVerified 
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                                  : profileModalReg.slip_ocr_round1.isDuplicate
                                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                              }`}>
                                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                                  <span className="font-bold flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    ผลตรวจ OCR (งวด 1):
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    profileModalReg.slip_ocr_round1.isFullyVerified 
                                      ? 'bg-emerald-500/20 text-emerald-300' 
                                      : profileModalReg.slip_ocr_round1.isDuplicate
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {profileModalReg.slip_ocr_round1.isFullyVerified ? '✓ ยอดตรง & สลิปใหม่' : profileModalReg.slip_ocr_round1.isDuplicate ? '🚨 สลิปซ้ำ' : '⚠️ ยอดไม่ตรง/รอตรวจ'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                                  <div>ยอดเงินในสลิป: <span className="font-bold text-white">{profileModalReg.slip_ocr_round1.amountFormatted || '-'}</span></div>
                                  <div>วันเวลาโอน: <span className="font-bold text-white">{profileModalReg.slip_ocr_round1.transferDateTimeStr || '-'}</span></div>
                                  <div>ธนาคาร: <span className="text-sky-300">{profileModalReg.slip_ocr_round1.bankDetected || '-'}</span></div>
                                  <div className="truncate">TransRef: <span className="font-mono text-amber-300">{profileModalReg.slip_ocr_round1.transRef || '-'}</span></div>
                                </div>
                              </div>
                            )}

                            {profileModalReg.installment_1_status === 'paid' ? (
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 py-1.5 px-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>✓ อนุมัติงวด 1 แล้ว</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = await askPrompt({
                                      title: 'ยกเลิกการอนุมัติและระบุเหตุผลที่ปฏิเสธสลิปงวด 1',
                                      message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบและโอนเงินส่งสลิปใหม่:',
                                      defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่',
                                      placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                      variant: 'danger',
                                      confirmText: 'ตกลง',
                                      cancelText: 'ยกเลิก'
                                    });
                                    if (reason) {
                                      const isMsu = isMsuInstitution(profileModalReg.institution);
                                      const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                                      const updates = {
                                        installment_1_status: 'unpaid',
                                        installment_1_notes: reason,
                                        payment_status: 'unpaid',
                                        payment_amount: totalFee,
                                        payment_notes: `สลิปงวดที่ 1 ไม่ถูกต้อง: ${reason}`
                                      };
                                      setModalPaymentStatus('unpaid');
                                      setModalPaymentAmount(totalFee);
                                      setModalPaymentNotes(`สลิปงวดที่ 1 ไม่ถูกต้อง: ${reason}`);
                                      await onUpdateAllocation(profileModalReg.user_id, updates);
                                      setProfileModalReg(prev => ({ ...prev, ...updates }));
                                      triggerToast('ยกเลิกการอนุมัติสลิปงวด 1 และปรับให้ส่งใหม่แล้ว');
                                    }
                                  }}
                                  className="py-1.5 px-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1 active:scale-95"
                                  title="ยกเลิกการอนุมัติและแจ้งให้ส่งสลิปใหม่"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>✕ ให้ส่งใหม่</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const isMsu = isMsuInstitution(profileModalReg.institution);
                                    const round2Fee = isMsu 
                                      ? (paymentConfig?.installment_round2_amount_msu || 250) 
                                      : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                                    const isR2Paid = profileModalReg.installment_2_status === 'paid' && Boolean(profileModalReg.installment_2_slip_url);
                                    
                                    const updates = {
                                      installment_1_status: 'paid',
                                      installment_1_notes: 'ตรวจสอบและอนุมัติยอดงวดที่ 1 เรียบร้อย'
                                    };

                                    if (isR2Paid) {
                                      updates.payment_status = 'paid';
                                      updates.payment_amount = 0;
                                      updates.payment_notes = 'ชำระครบทั้ง 2 งวดเรียบร้อยแล้ว';
                                      setModalPaymentStatus('paid');
                                      setModalPaymentAmount(0);
                                      setModalPaymentNotes('ชำระครบทั้ง 2 งวดเรียบร้อยแล้ว');
                                    } else {
                                      const nextStatus = profileModalReg.installment_2_status === 'pending_review' ? 'pending_review' : 'unpaid';
                                      const nextNotes = `ชำระงวดที่ 1 แล้ว (ค้างชำระงวดที่ 2: ${round2Fee} บ.)`;
                                      updates.payment_status = nextStatus;
                                      updates.payment_amount = round2Fee;
                                      updates.payment_notes = nextNotes;
                                      setModalPaymentStatus(nextStatus);
                                      setModalPaymentAmount(round2Fee);
                                      setModalPaymentNotes(nextNotes);
                                    }

                                    await onUpdateAllocation(profileModalReg.user_id, updates);
                                    setProfileModalReg(prev => ({ ...prev, ...updates }));
                                    triggerToast('อนุมัติสลิปงวดที่ 1 เรียบร้อยแล้ว');
                                  }}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ✓ อนุมัติงวด 1
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = await askPrompt({
                                      title: 'ระบุเหตุผลที่ปฏิเสธสลิปงวด 1',
                                      message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบและโอนเงินส่งสลิปใหม่:',
                                      defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่',
                                      placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                      variant: 'danger',
                                      confirmText: 'ตกลง',
                                      cancelText: 'ยกเลิก'
                                    });
                                    if (reason) {
                                      const isMsu = isMsuInstitution(profileModalReg.institution);
                                      const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                                      const updates = {
                                        installment_1_status: 'unpaid',
                                        installment_1_notes: reason,
                                        payment_status: 'unpaid',
                                        payment_amount: totalFee,
                                        payment_notes: `สลิปงวดที่ 1 ไม่ถูกต้อง: ${reason}`
                                      };
                                      setModalPaymentStatus('unpaid');
                                      setModalPaymentAmount(totalFee);
                                      setModalPaymentNotes(`สลิปงวดที่ 1 ไม่ถูกต้อง: ${reason}`);
                                      await onUpdateAllocation(profileModalReg.user_id, updates);
                                      setProfileModalReg(prev => ({ ...prev, ...updates }));
                                      triggerToast('ปฏิเสธสลิปงวด 1 เรียบร้อย');
                                    }
                                  }}
                                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ✕ ให้ส่งใหม่
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-44 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                            <Clock className="w-6 h-6 mb-2 opacity-50" />
                            <span>ยังไม่มีการส่งสลิปงวดที่ 1</span>
                          </div>
                        )}
                      </div>

                      {/* ROUND 2 */}
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-300 text-xs">
                            งวดที่ 2: {isMsuInstitution(profileModalReg?.institution) ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450)} บาท ({isMsuInstitution(profileModalReg?.institution) ? 'นิสิต มมส' : 'ต่างสถาบัน'})
                          </span>
                          {profileModalReg.installment_2_slip_url && profileModalReg.installment_2_status === 'paid' ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
                              ✓ อนุมัติแล้ว
                            </span>
                          ) : profileModalReg.installment_2_slip_url ? (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800 px-2 py-0.5 rounded">
                              ⏳ รอตรวจสอบ
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded">
                              ยังไม่ส่งสลิป
                            </span>
                          )}
                        </div>

                        {profileModalReg.installment_2_slip_url ? (
                          <div className="space-y-2">
                            <div
                              onClick={() => setPreviewDoc({ title: 'สลิปงวดที่ 2 - ' + profileModalReg.first_name, file_url: profileModalReg.installment_2_slip_url, file_name: 'installment-2-slip.jpg' })}
                              className="cursor-pointer group relative w-full h-44 rounded-xl overflow-hidden border border-slate-700 bg-slate-950"
                            >
                              <img
                                src={profileModalReg.installment_2_slip_url}
                                alt="สลิปงวด 2"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                                <Eye className="w-4 h-4" /> คลิกเพื่อขยาย
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                              <span>ส่งเมื่อ: {profileModalReg.installment_2_slip_date ? new Date(profileModalReg.installment_2_slip_date).toLocaleString('th-TH') : '-'}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const hosted = await ensureHostedUrl(profileModalReg.installment_2_slip_url, 'slip-round2.jpg');
                                    await navigator.clipboard.writeText(hosted);
                                    triggerToast('คัดลอกลิงก์สลิปงวด 2 แล้ว');
                                  }}
                                  className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                  title="คัดลอก URL ลิงก์สลิป"
                                >
                                  <Copy className="w-3 h-3 text-cyan-400" />
                                  <span>ก๊อปลิ้งค์</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ title: 'สลิปงวดที่ 2 - ' + profileModalReg.first_name, file_url: profileModalReg.installment_2_slip_url, file_name: 'installment-2-slip.jpg' })}
                                  className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                  title="เปิดดูสลิป"
                                >
                                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                                  <span>เปิดดู</span>
                                </button>
                              </div>
                            </div>

                            {profileModalReg.installment_2_notes && (
                              <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                                หมายเหตุ: {profileModalReg.installment_2_notes}
                              </p>
                            )}

                            {profileModalReg.slip_ocr_round2 && (
                              <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                                profileModalReg.slip_ocr_round2.isFullyVerified 
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                                  : profileModalReg.slip_ocr_round2.isDuplicate
                                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                              }`}>
                                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                                  <span className="font-bold flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    ผลตรวจ OCR (งวด 2):
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    profileModalReg.slip_ocr_round2.isFullyVerified 
                                      ? 'bg-emerald-500/20 text-emerald-300' 
                                      : profileModalReg.slip_ocr_round2.isDuplicate
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {profileModalReg.slip_ocr_round2.isFullyVerified ? '✓ ยอดตรง & สลิปใหม่' : profileModalReg.slip_ocr_round2.isDuplicate ? '🚨 สลิปซ้ำ' : '⚠️ ยอดไม่ตรง/รอตรวจ'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                                  <div>ยอดเงินในสลิป: <span className="font-bold text-white">{profileModalReg.slip_ocr_round2.amountFormatted || '-'}</span></div>
                                  <div>วันเวลาโอน: <span className="font-bold text-white">{profileModalReg.slip_ocr_round2.transferDateTimeStr || '-'}</span></div>
                                  <div>ธนาคาร: <span className="text-sky-300">{profileModalReg.slip_ocr_round2.bankDetected || '-'}</span></div>
                                  <div className="truncate">TransRef: <span className="font-mono text-amber-300">{profileModalReg.slip_ocr_round2.transRef || '-'}</span></div>
                                </div>
                              </div>
                            )}

                            {profileModalReg.installment_2_status === 'paid' && profileModalReg.installment_2_slip_url ? (
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 py-1.5 px-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>✓ อนุมัติงวด 2 แล้ว</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = await askPrompt({
                                      title: 'ยกเลิกการอนุมัติและระบุเหตุผลที่ปฏิเสธสลิปงวด 2',
                                      message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบและโอนเงินส่งสลิปใหม่:',
                                      defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่',
                                      placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                      variant: 'danger',
                                      confirmText: 'ตกลง',
                                      cancelText: 'ยกเลิก'
                                    });
                                    if (reason) {
                                      const isMsu = isMsuInstitution(profileModalReg.institution);
                                      const round2Fee = isMsu 
                                        ? (paymentConfig?.installment_round2_amount_msu || 250) 
                                        : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                                      const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                                      const isR1Paid = profileModalReg.installment_1_status === 'paid';

                                      const updates = {
                                        installment_2_status: 'unpaid',
                                        installment_2_notes: reason,
                                        payment_status: 'unpaid',
                                        payment_amount: isR1Paid ? round2Fee : totalFee,
                                        payment_notes: isR1Paid ? `ชำระงวดที่ 1 แล้ว (สลิปงวดที่ 2 ไม่ถูกต้อง: ${reason})` : `ปฏิเสธสลิป: ${reason}`
                                      };
                                      setModalPaymentStatus('unpaid');
                                      setModalPaymentAmount(isR1Paid ? round2Fee : totalFee);
                                      setModalPaymentNotes(updates.payment_notes);
                                      await onUpdateAllocation(profileModalReg.user_id, updates);
                                      setProfileModalReg(prev => ({ ...prev, ...updates }));
                                      triggerToast('ยกเลิกการอนุมัติสลิปงวด 2 และปรับให้ส่งใหม่แล้ว');
                                    }
                                  }}
                                  className="py-1.5 px-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1 active:scale-95"
                                  title="ยกเลิกการอนุมัติและแจ้งให้ส่งสลิปใหม่"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>✕ ให้ส่งใหม่</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const isMsu = isMsuInstitution(profileModalReg.institution);
                                    const round1Fee = paymentConfig?.installment_round1_amount || 400;
                                    const isR1Paid = profileModalReg.installment_1_status === 'paid';
                                    
                                    const updates = {
                                      installment_2_status: 'paid',
                                      installment_2_notes: 'ตรวจสอบและอนุมัติยอดงวดที่ 2 เรียบร้อย'
                                    };

                                    if (isR1Paid) {
                                      updates.payment_status = 'paid';
                                      updates.payment_amount = 0;
                                      updates.payment_notes = 'ชำระครบทั้ง 2 งวดเรียบร้อยแล้ว';
                                      setModalPaymentStatus('paid');
                                      setModalPaymentAmount(0);
                                      setModalPaymentNotes('ชำระครบทั้ง 2 งวดเรียบร้อยแล้ว');
                                    } else {
                                      const nextStatus = profileModalReg.installment_1_status === 'pending_review' ? 'pending_review' : 'unpaid';
                                      const nextNotes = `ชำระงวดที่ 2 เรียบร้อย (ค้างงวดที่ 1: ${round1Fee} บ.)`;
                                      updates.payment_status = nextStatus;
                                      updates.payment_amount = round1Fee;
                                      updates.payment_notes = nextNotes;
                                      setModalPaymentStatus(nextStatus);
                                      setModalPaymentAmount(round1Fee);
                                      setModalPaymentNotes(nextNotes);
                                    }

                                    await onUpdateAllocation(profileModalReg.user_id, updates);
                                    setProfileModalReg(prev => ({ ...prev, ...updates }));
                                    triggerToast(isR1Paid ? 'อนุมัติสลิปงวดที่ 2 และชำระครบ 2 งวดแล้ว' : 'อนุมัติสลิปงวดที่ 2 เรียบร้อยแล้ว');
                                  }}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ✓ อนุมัติงวด 2
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = await askPrompt({
                                      title: 'ระบุเหตุผลที่ปฏิเสธสลิปงวด 2',
                                      message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบและโอนเงินส่งสลิปใหม่:',
                                      defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่',
                                      placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                      variant: 'danger',
                                      confirmText: 'ตกลง',
                                      cancelText: 'ยกเลิก'
                                    });
                                    if (reason) {
                                      const isMsu = isMsuInstitution(profileModalReg.institution);
                                      const round2Fee = isMsu 
                                        ? (paymentConfig?.installment_round2_amount_msu || 250) 
                                        : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                                      const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                                      const isR1Paid = profileModalReg.installment_1_status === 'paid';

                                      const updates = {
                                        installment_2_status: 'unpaid',
                                        installment_2_notes: reason,
                                        payment_status: 'unpaid',
                                        payment_amount: isR1Paid ? round2Fee : totalFee,
                                        payment_notes: isR1Paid ? `ชำระงวดที่ 1 แล้ว (สลิปงวดที่ 2 ไม่ถูกต้อง: ${reason})` : `ปฏิเสธสลิป: ${reason}`
                                      };
                                      setModalPaymentStatus('unpaid');
                                      setModalPaymentAmount(isR1Paid ? round2Fee : totalFee);
                                      setModalPaymentNotes(updates.payment_notes);
                                      await onUpdateAllocation(profileModalReg.user_id, updates);
                                      setProfileModalReg(prev => ({ ...prev, ...updates }));
                                      triggerToast('ปฏิเสธสลิปงวด 2 เรียบร้อย');
                                    }
                                  }}
                                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ✕ ให้ส่งใหม่
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-44 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                            <Clock className="w-6 h-6 mb-2 opacity-50" />
                            <span>ยังไม่มีการส่งสลิปงวดที่ 2</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Uploaded Slip Card (Standard Full Payment or additional slip) */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">
                    {(profileModalReg.payment_plan ? profileModalReg.payment_plan === 'installment' : Boolean(profileModalReg.installment_1_slip_url || profileModalReg.installment_2_slip_url))
                      ? 'หลักฐานสลิปการโอนเงินเพิ่มเติม / ทั่วไป'
                      : 'หลักฐานสลิปการโอนเงิน (ชำระเต็มจำนวน 1 รอบ)'}
                  </h4>
                  
                  {profileModalReg.payment_slip_url ? (
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div 
                        onClick={() => setPreviewDoc({ title: 'สลิปการโอนเงิน - ' + profileModalReg.first_name, file_url: profileModalReg.payment_slip_url, file_name: 'payment-slip.jpg' })}
                        className="cursor-pointer group relative w-40 h-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0"
                      >
                        <img 
                          src={profileModalReg.payment_slip_url} 
                          alt="สลิปโอนเงิน" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                          <Eye className="w-4 h-4" /> ดูสลิป
                        </div>
                      </div>

                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-400 text-xs">วันที่ส่งสลิป:</p>
                            <p className="text-white font-semibold text-xs mt-0.5">
                              {profileModalReg.payment_slip_date ? new Date(profileModalReg.payment_slip_date).toLocaleString('th-TH') : '-'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const hosted = await ensureHostedUrl(profileModalReg.payment_slip_url, 'slip-full.jpg');
                                await navigator.clipboard.writeText(hosted);
                                triggerToast('คัดลอกลิงก์สลิปเรียบร้อยแล้ว');
                              }}
                              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                              title="คัดลอก URL ลิงก์สลิป"
                            >
                              <Copy className="w-3.5 h-3.5 text-cyan-400" />
                              <span>ก๊อปลิ้งค์สลิป</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ title: 'สลิปการโอนเงิน - ' + profileModalReg.first_name, file_url: profileModalReg.payment_slip_url, file_name: 'payment-slip.jpg' })}
                              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                              title="เปิดดูสลิป"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                              <span>เปิดดู</span>
                            </button>
                          </div>
                        </div>

                        {profileModalReg.slip_ocr_full && (
                          <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                            profileModalReg.slip_ocr_full.isFullyVerified 
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                              : profileModalReg.slip_ocr_full.isDuplicate
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          }`}>
                            <div className="flex items-center justify-between pb-1 border-b border-white/10">
                              <span className="font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                ผลตรวจ OCR (เต็มจำนวน):
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                profileModalReg.slip_ocr_full.isFullyVerified 
                                  ? 'bg-emerald-500/20 text-emerald-300' 
                                  : profileModalReg.slip_ocr_full.isDuplicate
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {profileModalReg.slip_ocr_full.isFullyVerified ? '✓ ยอดตรง & สลิปใหม่' : profileModalReg.slip_ocr_full.isDuplicate ? '🚨 สลิปซ้ำ' : '⚠️ ยอดไม่ตรง/รอตรวจ'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                              <div>ยอดเงินในสลิป: <span className="font-bold text-white">{profileModalReg.slip_ocr_full.amountFormatted || '-'}</span></div>
                              <div>วันเวลาโอน: <span className="font-bold text-white">{profileModalReg.slip_ocr_full.transferDateTimeStr || '-'}</span></div>
                              <div>ธนาคาร: <span className="text-sky-300">{profileModalReg.slip_ocr_full.bankDetected || '-'}</span></div>
                              <div className="truncate">TransRef: <span className="font-mono text-amber-300">{profileModalReg.slip_ocr_full.transRef || '-'}</span></div>
                            </div>
                          </div>
                        )}

                        {profileModalReg.payment_status === 'paid' ? (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ อนุมัติสลิปแล้ว (ชำระแล้ว)</span>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const reason = await askPrompt({
                                  title: 'ยกเลิกการอนุมัติและระบุเหตุผลที่ปฏิเสธสลิป',
                                  message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบ (เช่น ยอดเงินไม่ตรง หรือสลิปไม่ชัดเจน):',
                                  defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่',
                                  placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                  variant: 'danger',
                                  confirmText: 'ตกลง',
                                  cancelText: 'ยกเลิก'
                                });
                                if (reason) {
                                  const isMsu = isMsuInstitution(profileModalReg.institution);
                                  const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                                  const isInstallment = profileModalReg.payment_plan === 'installment';
                                  const round2Fee = isMsu 
                                    ? (paymentConfig?.installment_round2_amount_msu || 250) 
                                    : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                                  const isR1Paid = profileModalReg.installment_1_status === 'paid';
                                  const remaining = (isInstallment && isR1Paid) ? round2Fee : totalFee;

                                  setModalPaymentStatus('unpaid');
                                  setModalPaymentAmount(remaining);
                                  setModalPaymentNotes(reason);
                                  const rejectUpdates = {
                                    payment_status: 'unpaid',
                                    payment_amount: remaining,
                                    payment_notes: reason
                                  };
                                  await onUpdateAllocation(profileModalReg.user_id, rejectUpdates);
                                  setProfileModalReg(prev => ({ ...prev, ...rejectUpdates }));
                                  triggerToast('ยกเลิกการอนุมัติสลิปและปรับเป็นค้างชำระแล้ว');
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                              title="ยกเลิกการอนุมัติและแจ้งให้ส่งสลิปใหม่"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>ปฏิเสธสลิป / ให้ส่งใหม่</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const isInstallment = profileModalReg.payment_plan === 'installment';
                                const fullApprovalUpdates = {
                                  payment_status: 'paid',
                                  payment_amount: 0,
                                  payment_notes: 'ตรวจสอบยอดเงินถูกต้องแล้ว'
                                };
                                if (isInstallment) {
                                  fullApprovalUpdates.installment_1_status = 'paid';
                                  fullApprovalUpdates.installment_2_status = 'paid';
                                }
                                setModalPaymentStatus('paid');
                                setModalPaymentAmount(0);
                                setModalPaymentNotes('ตรวจสอบยอดเงินถูกต้องแล้ว');
                                await onUpdateAllocation(profileModalReg.user_id, fullApprovalUpdates);
                                setProfileModalReg(prev => ({ ...prev, ...fullApprovalUpdates }));
                                triggerToast('อนุมัติการชำระเงินเรียบร้อยแล้ว');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>อนุมัติสลิป (ชำระแล้ว)</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const reason = await askPrompt({
                                  title: 'ระบุเหตุผลที่ปฏิเสธสลิป',
                                  message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบ (เช่น ยอดเงินไม่ตรง หรือสลิปไม่ชัดเจน):',
                                  defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่',
                                  placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                  variant: 'danger',
                                  confirmText: 'ตกลง',
                                  cancelText: 'ยกเลิก'
                                });
                                if (reason) {
                                  const isMsu = isMsuInstitution(profileModalReg.institution);
                                  const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
                                  const isInstallment = profileModalReg.payment_plan === 'installment';
                                  const round2Fee = isMsu 
                                    ? (paymentConfig?.installment_round2_amount_msu || 250) 
                                    : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
                                  const isR1Paid = profileModalReg.installment_1_status === 'paid';
                                  const remaining = (isInstallment && isR1Paid) ? round2Fee : totalFee;

                                  setModalPaymentStatus('unpaid');
                                  setModalPaymentAmount(remaining);
                                  setModalPaymentNotes(reason);
                                  const rejectUpdates = {
                                    payment_status: 'unpaid',
                                    payment_amount: remaining,
                                    payment_notes: reason
                                  };
                                  await onUpdateAllocation(profileModalReg.user_id, rejectUpdates);
                                  setProfileModalReg(prev => ({ ...prev, ...rejectUpdates }));
                                  triggerToast('ปฏิเสธสลิปและปรับเป็นค้างชำระแล้ว');
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>ปฏิเสธสลิป / ให้ส่งใหม่</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic py-2">
                      {(profileModalReg.payment_plan ? profileModalReg.payment_plan === 'installment' : Boolean(profileModalReg.installment_1_slip_url || profileModalReg.installment_2_slip_url))
                        ? 'ผู้สมัครเลือกแผนแบ่งจ่าย 2 งวด (ดูสลิปด้านบน)'
                        : 'ผู้สมัครยังไม่ได้อัปโหลดสลิปการโอนเงิน (ชำระเต็มจำนวน 1 รอบ)'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ADMIN MESSAGING (Separates by Admin / Department / System & Supports File Attachment) */}
            {profileModalTab === 'messages' && (
              <div className="mt-5 space-y-5 text-xs">
                <form onSubmit={handleSendMessage} className="p-4 sm:p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Send className="w-4 h-4 text-purple-400" />
                        ส่งข้อความหรือการแจ้งเตือนไปยัง {profileModalReg.first_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        เลือกผู้ส่ง/ฝ่าย/ระบบที่ต้องการได้อิสระ (แยกแต่ละฝ่าย แต่ละระบบ และแต่ละข้อความ พร้อมแนบเอกสารได้)
                      </p>
                    </div>
                  </div>

                  {/* Select Sender / Department / System */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300">
                      1. เลือกผู้ส่ง / ฝ่าย / ระบบที่แจ้งเตือน:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ADMIN_MESSAGE_SENDERS.map((s) => {
                        const isSelected = msgSenderKey === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setMsgSenderKey(s.key)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/40'
                                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="font-bold text-xs flex items-center justify-between gap-1">
                              <span>{s.shortLabel}</span>
                              {isSelected && <span className="text-[10px] text-purple-300 font-black">✓ เลือกอยู่</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.senderName}</div>
                            <div className="text-[9px] text-purple-300/80 truncate">ระบบ: {s.systemName}</div>
                          </button>
                        );
                      })}
                    </div>

                    {msgSenderKey === 'custom' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 bg-slate-900/80 p-3 rounded-xl border border-purple-500/30">
                        <div>
                          <label className="block text-[10px] font-bold text-purple-300 mb-1">ระบุชื่อผู้ส่ง / ฝ่าย (กำหนดเอง):</label>
                          <input
                            type="text"
                            value={msgCustomSenderName}
                            onChange={e => setMsgCustomSenderName(e.target.value)}
                            placeholder="เช่น ผู้ดูแลระบบ JRE 2027 / ฝ่ายสถานที่ / อาจารย์ที่ปรึกษา"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-purple-300 mb-1">ระบุชื่อระบบงาน (กำหนดเอง):</label>
                          <input
                            type="text"
                            value={msgCustomSystemName}
                            onChange={e => setMsgCustomSystemName(e.target.value)}
                            placeholder="เช่น ระบบประสานงานทั่วไป / ระบบลงทะเบียนหน้างาน"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Title & Attachment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        2. หัวข้อข้อความ (เว้นว่างให้ตั้งตามฝ่ายอัตโนมัติได้):
                      </label>
                      <input
                        type="text"
                        value={msgTitle}
                        onChange={e => setMsgTitle(e.target.value)}
                        placeholder={(ADMIN_MESSAGE_SENDERS.find(s => s.key === msgSenderKey) || ADMIN_MESSAGE_SENDERS[0]).defaultTitle}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        แนบไฟล์เอกสาร / รูปภาพไปกับข้อความ (ถ้ามี):
                      </label>
                      <div className="flex items-center gap-2">
                        <label className={`px-3 py-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${isUploadingMsgAttachment ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingMsgAttachment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>{msgAttachmentUrl ? 'เปลี่ยนไฟล์แนบ' : '+ แนบไฟล์/รูปภาพ'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleUploadMsgAttachment}
                            className="hidden"
                          />
                        </label>
                        {msgAttachmentUrl && (
                          <div className="flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-[11px] text-indigo-200 min-w-0">
                            <span className="truncate max-w-[140px]">{msgAttachmentName || 'ไฟล์แนบ'}</span>
                            <button
                              type="button"
                              onClick={() => { setMsgAttachmentUrl(''); setMsgAttachmentName(''); }}
                              className="text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer"
                              title="เอาไฟล์แนบออก"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      3. รายละเอียดข้อความแจ้งเตือน:
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={newMsgText}
                      onChange={e => setNewMsgText(e.target.value)}
                      placeholder="พิมพ์ข้อความที่ต้องการแจ้งผู้สมัคร..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  {/* Quick message template buttons (Automatically selects matching sender/system!) */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-slate-500 text-[10px] self-center mr-1">ข้อความด่วนแยกตามระบบ:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSenderKey('admin_central');
                        setMsgTitle('แจ้งเตือนจากผู้ดูแลระบบกลาง (Admin JRE 2027)');
                        setNewMsgText('ผู้ดูแลระบบตรวจสอบข้อมูลใบสมัครของท่านเรียบร้อยแล้ว กรุณาตรวจสอบสถานะและข้อมูลประจำตัวในหน้าแดชบอร์ด');
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-purple-300 rounded-lg border border-slate-800 cursor-pointer"
                    >
                      🛡️ Admin: ตรวจสอบข้อมูลแล้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSenderKey('finance_coord');
                        setMsgTitle('แจ้งเตือนค้างชำระค่าลงทะเบียน');
                        setNewMsgText(`ขอแจ้งเตือนค้างชำระค่าลงทะเบียนโครงการ JRE 2027 จำนวน ${modalPaymentAmount} บาท โปรดโอนเข้าบัญชี ${modalPaymentBank} ภายในกำหนด พร้อมแนบสลิปผ่านเว็บไซต์นี้`);
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-amber-300 rounded-lg border border-slate-800 cursor-pointer"
                    >
                      💳 การเงิน: แจ้งค้างชำระ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSenderKey('finance_coord');
                        setMsgTitle('ยืนยันการชำระเงินสำเร็จ');
                        setNewMsgText('ฝ่ายการเงินได้ตรวจสอบและยืนยันสลิปการชำระเงินโครงการ JRE 2027 ของท่านเรียบร้อยแล้ว ขอบคุณครับ');
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-emerald-300 rounded-lg border border-slate-800 cursor-pointer"
                    >
                      💳 การเงิน: ยืนยันสลิปผ่าน
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSenderKey('registration_docs');
                        setMsgTitle('แจ้งขอเอกสารประกอบการสมัครเพิ่มเติม');
                        setNewMsgText('โปรดจัดส่งเอกสารสำคัญ (สำเนาบัตรประชาชน / เอกสารเพิ่มเติม) ผ่านระบบอัปโหลดเอกสารแนบบนหน้าแดชบอร์ดเว็บไซต์');
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-teal-300 rounded-lg border border-slate-800 cursor-pointer"
                    >
                      📄 ทะเบียนเอกสาร: แจ้งส่งเอกสาร
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSenderKey('accommodation_shirt');
                        setMsgTitle('แจ้งจัดกลุ่มฝึก ห้องพัก และไซส์เสื้อ');
                        setNewMsgText(`แจ้งอัปเดตข้อมูลสวัสดิการ: กลุ่มฝึก "${modalGroup || 'รอจัดกลุ่ม'}" | ห้องพัก "${modalRoom || 'รอจัดห้อง'}" | ไซส์เสื้อฝึก "${modalShirtSize || 'L'}"`);
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-sky-300 rounded-lg border border-slate-800 cursor-pointer"
                    >
                      🏢 ห้องพัก/เสื้อ: แจ้งห้องพัก & ไซส์เสื้อ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMsgSenderKey('medical_safety');
                        setMsgTitle('คำแนะนำด้านสุขภาพและความปลอดภัย');
                        setNewMsgText('ฝ่ายการแพทย์และความปลอดภัยรับทราบข้อมูลสุขภาพ/แพ้อาหารของท่านแล้ว โปรดเตรียมยาประจำตัวติดตัวมาในวันฝึกอบรม');
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-300 rounded-lg border border-slate-800 cursor-pointer"
                    >
                      🩺 การแพทย์: แจ้งเตรียมยา/ดูแลพิเศษ
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSendingMsg}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      {isSendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>ส่งข้อความแจ้งเตือนถึงผู้สมัคร</span>
                    </button>
                  </div>
                </form>

                {/* History of messages sent */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-bold text-slate-300 text-xs">
                      ประวัติข้อความที่ส่งหาผู้สมัครคนนี้ ({Array.isArray(profileModalReg.admin_messages) ? profileModalReg.admin_messages.length : 0} ข้อความ):
                    </h5>
                    {Array.isArray(profileModalReg.admin_messages) && profileModalReg.admin_messages.length > 0 && (
                      isAdvancedMode ? (
                        <button
                          type="button"
                          onClick={handleClearAllAdminMessagesFromAdmin}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ล้างประวัติข้อความทั้งหมด (ขั้นสูง)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAdvancedMode(true)}
                          className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          เปิดโหมดขั้นสูงเพื่อล้างข้อความทั้งหมด
                        </button>
                      )
                    )}
                  </div>

                  {Array.isArray(profileModalReg.admin_messages) && profileModalReg.admin_messages.length > 0 ? (
                    profileModalReg.admin_messages.map((m, idx) => {
                      const sInfo = resolveMessageSenderInfo(m);
                      return (
                        <div key={m.id || idx} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2 text-[10px] text-slate-500">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-purple-300 text-xs">{sInfo.senderName}</span>
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9px] font-bold">
                                  {sInfo.roleBadge}
                                </span>
                                <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded text-[9px] font-semibold">
                                  ระบบ: {sInfo.systemName}
                                </span>
                                {m.read ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                                    ✓ ผู้สมัครเปิดอ่านแล้ว
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold">
                                    ⏳ ผู้สมัครยังไม่อ่าน
                                  </span>
                                )}
                              </div>
                              {m.title && (
                                <div className="text-[11px] font-bold text-slate-300">
                                  เรื่อง: {m.title}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{m.created_at ? new Date(m.created_at).toLocaleString('th-TH') : ''}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminMsgFromAdmin(m.id || idx)}
                                className="px-2 py-1 text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
                                title="ลบข้อความนี้"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-200 whitespace-pre-line text-xs bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80">{m.text}</p>
                          {m.attachment_url && (
                            <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg text-[11px] text-indigo-200">
                              <span>📎 ไฟล์แนบ: {m.attachment_name || 'เอกสารแนบ'}</span>
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({ title: m.title || 'ไฟล์แนบข้อความ', file_name: m.attachment_name, file_url: m.attachment_url })}
                                className="text-indigo-300 hover:text-white font-bold underline cursor-pointer"
                              >
                                เปิดดูไฟล์
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 italic">ยังไม่มีประวัติการส่งข้อความ</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: REQUESTED DOCUMENTS (กดขอ / กดยกเลิกการขอ / แนบไฟล์แทน / โหมดขั้นสูงลบถาวร) */}
            {profileModalTab === 'docs' && (
              <div className="mt-5 space-y-5 text-xs">
                {/* Top Control Bar: Requester Department & Auto-Notify & Advanced Mode */}
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        ระบบจัดการเอกสารแนบ (กดขอ / กดยกเลิกการขอ / ตรวจอนุมัติ / ลบขั้นสูง)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        กดปุ่มด้านล่างเพื่อขอเอกสารหรือกดยกเลิกการขอได้ทันที และเปิดโหมดขั้นสูงเพื่อลบรายการหรือไฟล์แนบถาวรได้
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-[11px] text-purple-200 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1.5 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyUserOnDocAction}
                          onChange={e => setNotifyUserOnDocAction(e.target.checked)}
                          className="rounded"
                        />
                        <span>แจ้งเตือนเข้ากล่องข้อความผู้สมัครอัตโนมัติ</span>
                      </label>
                    </div>
                  </div>

                  {/* Select which Admin / System is requesting */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-300 shrink-0">ขอเอกสารในนามฝ่าย/ระบบ:</span>
                    <select
                      value={docRequesterKey}
                      onChange={e => setDocRequesterKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold"
                    >
                      {ADMIN_MESSAGE_SENDERS.filter(s => s.key !== 'custom').map(s => (
                        <option key={s.key} value={s.key}>
                          {s.shortLabel} — {s.senderName} ({s.systemName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1-Click Standard Document Request / Cancel Grid */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-300 block">
                      ⚡ กดขอเอกสาร / กดยกเลิกการขอ (คลิกเดียวสลับสถานะได้ทันที):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {STANDARD_REQUESTABLE_DOCS.map((stdDoc) => {
                        const currentDocs = Array.isArray(profileModalReg.requested_docs) ? profileModalReg.requested_docs : [];
                        const existingActive = currentDocs.find(d => d.title === stdDoc.title && d.status !== 'cancelled');
                        const isRequested = Boolean(existingActive);
                        const hasFile = Boolean(existingActive?.file_url);

                        return (
                          <div
                            key={stdDoc.code}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              isRequested
                                ? 'bg-emerald-950/25 border-emerald-500/40'
                                : 'bg-slate-900/80 border-slate-800'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate">{stdDoc.title}</div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {isRequested
                                  ? (hasFile ? '📎 ผู้สมัครแนบไฟล์มาแล้ว' : '⏳ กำลังขอเอกสารนี้ (รอผู้สมัครส่ง)')
                                  : stdDoc.desc}
                              </div>
                            </div>

                            {isRequested ? (
                              <button
                                type="button"
                                onClick={() => handleQuickToggleDocRequest(stdDoc)}
                                className="px-2.5 py-1.5 bg-amber-600/25 hover:bg-rose-600 text-amber-200 hover:text-white border border-amber-500/40 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                                title="กดเพื่อยกเลิกการขอเอกสารรายการนี้"
                              >
                                ✕ ยกเลิกการขอ
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickToggleDocRequest(stdDoc)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-colors shadow-sm"
                                title="กดเพื่อขอเอกสารรายการนี้ทันที"
                              >
                                + กดขอเอกสาร
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Custom Form to Request Any Other Doc */}
                <form onSubmit={handleAddDocRequest} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    ขอเอกสารอื่นๆ เพิ่มเติม (พิมพ์ชื่อเอกสารและหมายเหตุได้เอง)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newDocTitle}
                      onChange={e => setNewDocTitle(e.target.value)}
                      placeholder="ระบุชื่อเอกสารที่ต้องการขอ เช่น ใบรับรองสังกัด..."
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newDocNote}
                      onChange={e => setNewDocNote(e.target.value)}
                      placeholder="หมายเหตุถึงผู้สมัคร (ถ้ามี) เช่น ขอภาพสีชัดเจนพร้อมเซ็นสำเนาถูกต้อง"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-slate-300 shrink-0 px-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newDocRequired}
                        onChange={e => setNewDocRequired(e.target.checked)}
                        className="rounded"
                      />
                      <span>ระบุเป็นเอกสาร "จำเป็นต้องส่ง"</span>
                    </label>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow"
                    >
                      + เพิ่มคำขอเอกสารนี้
                    </button>
                  </div>
                </form>

                {/* List of Requested Docs & Full Admin Controls */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-bold text-slate-300 text-xs">
                      รายการเอกสารแนบของผู้สมัครคนนี้ ({Array.isArray(profileModalReg.requested_docs) ? profileModalReg.requested_docs.length : 0} รายการ):
                    </h5>

                    <div className="flex items-center gap-2">
                      {!isAdvancedMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdvancedMode(true);
                            triggerToast('🔓 เปิดโหมดขั้นสูงแล้ว สามารถลบไฟล์แนบและลบรายการขอเอกสารได้');
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          <span>กดเปิดโหมดขั้นสูงเพื่อลบถาวร</span>
                        </button>
                      ) : (
                        Array.isArray(profileModalReg.requested_docs) && profileModalReg.requested_docs.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllRequestedDocs}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>ล้างรายการเอกสารทั้งหมด (ขั้นสูง)</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {Array.isArray(profileModalReg.requested_docs) && profileModalReg.requested_docs.length > 0 ? (
                    profileModalReg.requested_docs.map((doc, idx) => {
                      const isCancelled = doc.status === 'cancelled';
                      const isUploadingThisAdmin = uploadingAdminDocId === doc.id;

                      return (
                        <div
                          key={doc.id || idx}
                          className={`p-4 rounded-2xl border space-y-3 transition-all ${
                            isCancelled
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold text-sm ${isCancelled ? 'line-through text-slate-400' : 'text-white'}`}>
                                  {doc.title}
                                </span>
                                {!isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDocRequired(doc.id)}
                                    className={`px-2 py-0.5 text-[10px] rounded font-bold border cursor-pointer ${
                                      doc.required
                                        ? 'bg-red-950 text-red-300 border-red-800'
                                        : 'bg-slate-900 text-slate-400 border-slate-700'
                                    }`}
                                    title="คลิกเพื่อสลับ จำเป็น / ไม่บังคับ"
                                  >
                                    {doc.required ? 'จำเป็นต้องส่ง' : 'ไม่บังคับ'}
                                  </button>
                                )}

                                {isCancelled ? (
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-bold">
                                    ✕ ยกเลิกการขอแล้ว
                                  </span>
                                ) : doc.status === 'approved' ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                                    ✓ อนุมัติแล้ว
                                  </span>
                                ) : doc.status === 'rejected' ? (
                                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold">
                                    ⚠️ แจ้งให้ส่งใหม่
                                  </span>
                                ) : doc.file_url ? (
                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                                    ⏳ ส่งแล้ว รอตรวจ
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-bold">
                                    ผู้สมัครยังไม่ส่งไฟล์
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap">
                                <span>ขอโดย: <strong className="text-purple-300">{doc.requested_by || 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027'}</strong></span>
                                {doc.requested_at && (
                                  <span>• ขอเมื่อ: {new Date(doc.requested_at).toLocaleString('th-TH')}</span>
                                )}
                                {doc.submitted_at && (
                                  <span>• ส่งเมื่อ: {new Date(doc.submitted_at).toLocaleString('th-TH')}</span>
                                )}
                              </div>

                              {doc.note && (
                                <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                                  หมายเหตุ: {doc.note}
                                </p>
                              )}

                              {doc.file_url && (
                                <div className="text-[11px] text-slate-300 pt-1 flex items-center gap-2 flex-wrap">
                                  <span>📎 ไฟล์แนบ: <strong>{doc.file_name || 'เอกสารแนบ'}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(doc)}
                                    className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> เปิดดูไฟล์แนบ
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons for Admin */}
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              {/* Approve / Reject when file exists */}
                              {doc.file_url && !isCancelled && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyDoc(doc.id, 'approved', 'ตรวจสอบและอนุมัติเอกสารเรียบร้อยแล้ว')}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                  >
                                    ✓ อนุมัติ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const reason = await askPrompt({
                                        title: 'ระบุเหตุผลที่ให้ส่งเอกสารใหม่',
                                        message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบและแนบเอกสารใหม่:',
                                        defaultValue: 'เอกสารไม่ชัดเจน กรุณาถ่ายหรือสแกนส่งใหม่อีกครั้ง',
                                        placeholder: 'ระบุเหตุผล...',
                                        variant: 'warning',
                                        confirmText: 'ส่งแจ้งเตือนให้แนบใหม่',
                                        cancelText: 'ยกเลิก'
                                      });
                                      if (reason) handleVerifyDoc(doc.id, 'rejected', reason);
                                    }}
                                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                  >
                                    ↻ ให้ส่งใหม่
                                  </button>
                                </>
                              )}

                              {/* Admin Upload File on behalf of user */}
                              {!isCancelled && (
                                <label className={`px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${isUploadingThisAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
                                  {isUploadingThisAdmin ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                  <span>{doc.file_url ? 'แนบไฟล์แทนใหม่' : 'Admin แนบไฟล์ให้'}</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => handleAdminUploadDocForUser(e, doc.id)}
                                    className="hidden"
                                  />
                                </label>
                              )}

                              {/* Cancel Request / Re-open Request Button */}
                              {isCancelled ? (
                                <button
                                  type="button"
                                  onClick={() => handleCancelDocRequest(doc, false)}
                                  className="px-2.5 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                >
                                  + กดขออีกครั้ง
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCancelDocRequest(doc, !doc.file_url)}
                                  className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                  title="ยกเลิกการขอเอกสารรายการนี้"
                                >
                                  ✕ ยกเลิกการขอ
                                </button>
                              )}

                              {/* Advanced Mode Delete Controls */}
                              {isAdvancedMode && (
                                <>
                                  {doc.file_url && (
                                    <button
                                      type="button"
                                      onClick={() => handleAdvancedDeleteDoc(doc, 'clear_file')}
                                      className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                      title="ลบเฉพาะไฟล์แนบออก"
                                    >
                                      🧹 ล้างไฟล์แนบ
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleAdvancedDeleteDoc(doc, 'delete_item')}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
                                    title="ลบรายการขอเอกสารนี้ถาวร (โหมดขั้นสูง)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>ลบถาวร</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 italic">ยังไม่มีการขอเอกสารเพิ่มเติมจากผู้สมัครท่านนี้ (สามารถกดปุ่ม "+ กดขอเอกสาร" ด้านบนได้เลย)</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </ModalPortal>
    )}

      {/* Catering & Health Logistics Hub Modal */}
      <CateringHealthModal
        isOpen={showCateringModal}
        onClose={() => setShowCateringModal(false)}
        registrations={registrations}
        onSelectApplicant={(reg) => handleOpenProfileModal(reg, 'info')}
      />

      {/* TAB: PAYMENT SETTINGS & INSTALLMENTS CONFIG */}
      {activeTab === 'payment_settings' && (
        <form onSubmit={handleSavePaymentSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">
                  ตั้งค่าค่าธรรมเนียมการลงทะเบียน & ระบบแบ่งชำระ 2 งวด
                </h3>
                {isEditingPaymentSettings ? (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                    ✏️ โหมดแก้ไข
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> ล็อกข้อมูล (View Only)
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                กำหนดค่าลงทะเบียนรวม บัญชีธนาคารสำหรับรับโอนเงิน และเปิด/ปิดระบบแบ่งจ่าย 2 งวด พร้อมกำหนดจำนวนเงินและวันครบกำหนด
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              {!isEditingPaymentSettings ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPaymentSettings(true)}
                  className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ปลดล็อกเพื่อแก้ไขการตั้งค่า</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelPaymentSettings}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>ยกเลิก (คืนค่าเดิม)</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>บันทึกการตั้งค่าทั้งหมด</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Warning Banner when Editing */}
          {isEditingPaymentSettings && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold text-sm text-amber-300 block">⚠️ ท่านกำลังอยู่ในโหมดแก้ไขการตั้งค่าระบบการเงิน</span>
                  <span className="text-xs text-amber-200/80">ระบบเปิดให้แก้ไขยอดเงินและข้อมูลบัญชีแล้ว เมื่อแก้ไขเสร็จอย่าลืมกด "บันทึกการตั้งค่าทั้งหมด" หรือกด "ยกเลิก" เพื่อคืนค่าเดิม</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleCancelPaymentSettings}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  บันทึกทันที
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* CARD 0: REGISTRATION SCHEDULE & DUAL COUNTDOWN SETTINGS */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h4>กำหนดวันเวลาเปิด-ปิดรับสมัครโครงการ & ระบบนับเวลาถอยหลัง (Registration Schedule & Countdown)</h4>
                </div>
                <span className="text-xs text-slate-400">ควบคุมการเปิด/ปิดรับสมัครอัตโนมัติหรือบังคับด้วยตนเอง</span>
              </div>

              {/* Realtime Live Admin Preview of Current Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ตัวอย่างสถานะที่ผู้สมัครเห็นในขณะนี้ (Live Realtime Status Preview):
                </label>
                <RegistrationCountdown paymentConfig={localPayment} variant="admin" />
              </div>

              {/* Status Override / Mode Select */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  onClick={() => isEditingPaymentSettings && setLocalPayment(prev => ({ ...prev, reg_status_override: 'auto' }))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    (localPayment.reg_status_override || 'auto') === 'auto'
                      ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  } ${!isEditingPaymentSettings ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input 
                      type="radio" 
                      name="reg_status_override" 
                      disabled={!isEditingPaymentSettings}
                      checked={(localPayment.reg_status_override || 'auto') === 'auto'}
                      onChange={() => setLocalPayment(prev => ({ ...prev, reg_status_override: 'auto' }))}
                      className="text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-300">⏱️ อัตโนมัติ (Auto)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    เปิดและปิดรับสมัครตามวันเวลาจริงที่กำหนดด้านล่าง (รอนับเวลาเปิด / นับถอยหลังปิด)
                  </p>
                </div>

                <div 
                  onClick={() => isEditingPaymentSettings && setLocalPayment(prev => ({ ...prev, reg_status_override: 'force_open' }))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    localPayment.reg_status_override === 'force_open'
                      ? 'bg-emerald-500/10 border-emerald-500/60 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  } ${!isEditingPaymentSettings ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input 
                      type="radio" 
                      name="reg_status_override" 
                      disabled={!isEditingPaymentSettings}
                      checked={localPayment.reg_status_override === 'force_open'}
                      onChange={() => setLocalPayment(prev => ({ ...prev, reg_status_override: 'force_open' }))}
                      className="text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-300">🟢 บังคับเปิดทันที (Force Open)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    บังคับเปิดรับสมัครทันที โดยข้ามการตรวจสอบวันเวลา (เปิดให้กรอกใบสมัครได้ทันที)
                  </p>
                </div>

                <div 
                  onClick={() => isEditingPaymentSettings && setLocalPayment(prev => ({ ...prev, reg_status_override: 'force_closed' }))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    localPayment.reg_status_override === 'force_closed'
                      ? 'bg-rose-500/10 border-rose-500/60 ring-2 ring-rose-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  } ${!isEditingPaymentSettings ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input 
                      type="radio" 
                      name="reg_status_override" 
                      disabled={!isEditingPaymentSettings}
                      checked={localPayment.reg_status_override === 'force_closed'}
                      onChange={() => setLocalPayment(prev => ({ ...prev, reg_status_override: 'force_closed' }))}
                      className="text-rose-500 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-rose-300">🔴 บังคับปิดทันที (Force Closed)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    บังคับปิดรับสมัครทันที ยุติการส่งใบสมัครใหม่ (ผู้สมัครผ่อนชำระยังจ่ายงวด 2 ได้)
                  </p>
                </div>
              </div>

              {/* Datetime Pickers (Open & Close) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-300">
                      📅 วันและเวลาเปิดรับสมัคร (Open Date & Time):
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      เริ่มแสดงนับเวลารอ
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={formatDateTimeLocalInput(localPayment.reg_open_datetime || '2026-10-15T08:30:00')}
                    onChange={e => setLocalPayment(prev => ({ ...prev, reg_open_datetime: e.target.value ? `${e.target.value}:00` : '' }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-950 border border-slate-700 focus:ring-2 focus:ring-amber-500'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400">
                    แสดงเป็นภาษาไทย: <strong className="text-white">{formatThaiDateTime(localPayment.reg_open_datetime)}</strong>
                  </p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-rose-300">
                      📅 วันและเวลาปิดรับสมัคร (Close Date & Time):
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      สิ้นสุดนับเวลาถอยหลัง
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={formatDateTimeLocalInput(localPayment.reg_close_datetime || '2026-10-20T23:59:59')}
                    onChange={e => setLocalPayment(prev => ({ ...prev, reg_close_datetime: e.target.value ? `${e.target.value}:00` : '' }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-950 border border-slate-700 focus:ring-2 focus:ring-rose-500'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400">
                    แสดงเป็นภาษาไทย: <strong className="text-white">{formatThaiDateTime(localPayment.reg_close_datetime)}</strong>
                  </p>
                </div>
              </div>

              {/* Message displayed when closed */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ข้อความชี้แจงสำหรับผู้สมัครเมื่อระบบปิดรับสมัคร (Closed Notice Message):
                </label>
                <textarea
                  rows="2"
                  disabled={!isEditingPaymentSettings}
                  value={localPayment.reg_closed_message ?? ''}
                  onChange={e => setLocalPayment(prev => ({ ...prev, reg_closed_message: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl text-white text-xs leading-relaxed outline-none transition-all ${
                    !isEditingPaymentSettings
                      ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                      : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                  }`}
                  placeholder="โครงการ JRE 2027 ได้ปิดรับสมัครผู้เข้าร่วมการฝึกอบรมอย่างเป็นทางการแล้ว..."
                />
              </div>

              {/* Installment Applicant Exception Clarification */}
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-xl flex items-start gap-3 text-xs text-indigo-200">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">
                    🛡️ สิทธิ์ของผู้สมัครที่เลือกแบ่งจ่าย 2 งวด เมื่อระบบปิดรับสมัครทั่วไป:
                  </span>
                  <p className="text-indigo-200/90 leading-relaxed text-[11px]">
                    ผู้สมัครที่เลือกแผนแบ่งชำระ 2 งวด และชำระงวดที่ 1 แล้ว <strong>ถือเป็นผู้สมัครที่ลงทะเบียนสำเร็จแล้ว</strong> และจะไม่ถูกบล็อกจากระบบเมื่อปิดรับสมัคร ผู้สมัครยังคงสามารถเข้าสู่ระบบเพื่อตรวจสอบสถานะและส่งสลิปชำระเงินงวดที่ 2 (250 / 450 บาท) ตามกำหนดการได้อย่างอิสระ
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 1: GENERAL FEE & BANK INFO */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-5">
              <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
                <Building className="w-5 h-5 text-indigo-400" />
                <h4>1. ข้อมูลบัญชีธนาคารรับโอน & ค่าลงทะเบียนหลัก</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ยอดค่าลงทะเบียนสถาบันภายนอก (บาท):
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={localPayment.fee_total ?? 850}
                    onChange={e => setLocalPayment(prev => ({ ...prev, fee_total: Number(e.target.value) || 0 }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="850"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">อัตราสำหรับสถาบันภายนอก/ต่างมหาวิทยาลัย (รวมค่าที่พักหอพักกุดรัง มมส และอาหาร)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ยอดค่าลงทะเบียนนิสิต มมส (บาท):
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={localPayment.fee_total_msu ?? 650}
                    onChange={e => setLocalPayment(prev => ({ ...prev, fee_total_msu: Number(e.target.value) || 0 }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="650"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">อัตราสำหรับนิสิตมหาวิทยาลัยมหาสารคาม (ไม่มีค่าที่พัก)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชื่อธนาคาร:
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={localPayment.bank_name ?? 'ธนาคารไทยพาณิชย์'}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_name: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="เช่น ธนาคารไทยพาณิชย์"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    เลขที่บัญชีธนาคาร:
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={localPayment.bank_account_number ?? '594-264865-5'}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white font-mono text-sm outline-none tracking-wider transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="594-264865-5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชื่อบัญชี:
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditingPaymentSettings}
                    value={localPayment.bank_account_name ?? 'นางสาวมัญชุพร ยังเหล็ก'}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_account_name: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="นางสาวมัญชุพร ยังเหล็ก"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>เบอร์โทรสอบถามรายละเอียดเพิ่มเติม:</span>
                    <span className="text-rose-400 font-normal text-[11px]">(ไม่มีระบบพร้อมเพย์)</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingPaymentSettings}
                    value={localPayment.contact_phone ?? '098-329-6762'}
                    onChange={e => setLocalPayment(prev => ({ ...prev, contact_phone: e.target.value, bank_promptpay: '' }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                      !isEditingPaymentSettings
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="098-329-6762"
                  />
                  <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>รับโอนเฉพาะบัญชี ธ.ไทยพาณิชย์ 594-264865-5 เท่านั้น • ไม่มีระบบพร้อมเพย์ (PromptPay)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: 2-ROUND INSTALLMENT SYSTEM */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h4>2. ระบบแบ่งจ่าย 2 งวด (2-Round Installments)</h4>
                </div>

                <label className={`inline-flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 transition-colors ${
                  !isEditingPaymentSettings ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-purple-500'
                }`}>
                  <input
                    type="checkbox"
                    disabled={!isEditingPaymentSettings}
                    checked={Boolean(localPayment.allow_installments)}
                    onChange={e => setLocalPayment(prev => ({ ...prev, allow_installments: e.target.checked }))}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-600 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-white">
                    {localPayment.allow_installments ? 'เปิดใช้งานระบบแบ่งจ่าย 2 งวด' : 'ปิดระบบแบ่งจ่าย (ให้จ่ายเต็มจำนวนเท่านั้น)'}
                  </span>
                </label>
              </div>

              {localPayment.allow_installments ? (
                <div className="space-y-4">
                  <p className="text-xs text-amber-300 bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>ผู้สมัครสามารถเลือก "ขอทำเรื่องแบ่งจ่าย 2 งวด" ได้ในหน้าลงทะเบียน โดยส่งสลิปแยกทีละงวดตามกำหนดวัน</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Round 1 */}
                    <div className="p-4 bg-slate-900 border border-indigo-900/50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-lg border border-indigo-500/30">
                          งวดที่ 1 (รอบแรก)
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">15 ต.ค. 2569</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          จำนวนเงินงวดที่ 1 (บาท):
                        </label>
                        <input
                          type="number"
                          required
                          disabled={!isEditingPaymentSettings}
                          value={localPayment.installment_round1_amount ?? 400}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round1_amount: Number(e.target.value) || 0 }))}
                          className={`w-full px-3.5 py-2 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                            !isEditingPaymentSettings
                              ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                              : 'bg-slate-950 border border-slate-700 focus:ring-2 focus:ring-indigo-500'
                          }`}
                          placeholder="400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          กำหนดชำระงวดที่ 1:
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isEditingPaymentSettings}
                          value={localPayment.installment_round1_due ?? ''}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round1_due: e.target.value }))}
                          className={`w-full px-3.5 py-2 rounded-xl text-white text-xs outline-none transition-all ${
                            !isEditingPaymentSettings
                              ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                              : 'bg-slate-950 border border-slate-700 focus:ring-2 focus:ring-indigo-500'
                          }`}
                          placeholder="เช่น 15 ตุลาคม 2569 (วันเปิดรับสมัคร)"
                        />
                      </div>
                    </div>

                    {/* Round 2 */}
                    <div className="p-4 bg-slate-900 border border-purple-900/50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-lg border border-purple-500/30">
                          งวดที่ 2 (รอบสอง)
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">5 พ.ย. 2569</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          จำนวนเงินงวดที่ 2 (บาท):
                        </label>
                        <input
                          type="number"
                          required
                          disabled={!isEditingPaymentSettings}
                          value={localPayment.installment_round2_amount ?? 450}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round2_amount: Number(e.target.value) || 0 }))}
                          className={`w-full px-3.5 py-2 rounded-xl text-white font-mono text-sm outline-none transition-all ${
                            !isEditingPaymentSettings
                              ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                              : 'bg-slate-950 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                          }`}
                          placeholder="450"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          กำหนดชำระงวดที่ 2:
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isEditingPaymentSettings}
                          value={localPayment.installment_round2_due ?? ''}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round2_due: e.target.value }))}
                          className={`w-full px-3.5 py-2 rounded-xl text-white text-xs outline-none transition-all ${
                            !isEditingPaymentSettings
                              ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                              : 'bg-slate-950 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                          }`}
                          placeholder="เช่น 5 พฤศจิกายน 2569"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Installment sum validation badge */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">สรุปยอดรวม 2 งวด:</span>
                    <span className="font-mono font-bold text-white">
                      {Number(localPayment.installment_round1_amount || 0)} + {Number(localPayment.installment_round2_amount || 0)} = {(Number(localPayment.installment_round1_amount || 0) + Number(localPayment.installment_round2_amount || 0)).toLocaleString()} บาท
                      {(Number(localPayment.installment_round1_amount || 0) + Number(localPayment.installment_round2_amount || 0)) === Number(localPayment.fee_total || 0) ? (
                        <span className="ml-2 text-emerald-400 font-semibold">(✓ ยอดตรงกับยอดรวม {localPayment.fee_total} บ.)</span>
                      ) : (
                        <span className="ml-2 text-rose-400 font-semibold">(⚠️ ไม่ตรงกับยอดเต็มจำนวน {localPayment.fee_total} บ.)</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                  ระบบแบ่งจ่าย 2 งวดปิดอยู่ ผู้สมัครทุกคนจะถูกกำหนดให้ชำระเต็มจำนวน {localPayment.fee_total} บาท
                </div>
              )}
            </div>

            {/* CARD 3: NOTES & GUIDELINES */}
            <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h4>3. ข้อความแจ้งเตือน / คำแนะนำเรื่องการชำระเงิน</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  คำชี้แจงสำหรับผู้สมัคร (แสดงในการ์ดชำระเงิน):
                </label>
                <textarea
                  rows="3"
                  disabled={!isEditingPaymentSettings}
                  value={localPayment.notes ?? ''}
                  onChange={e => setLocalPayment(prev => ({ ...prev, notes: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl text-white text-xs leading-relaxed outline-none transition-all ${
                    !isEditingPaymentSettings
                      ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                      : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                  }`}
                  placeholder="เช่น สามารถเลือกชำระเต็มจำนวน หรือแบ่งจ่าย 2 งวดตามกำหนดการข้างต้น..."
                />
              </div>
            </div>

            {/* Save / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!isEditingPaymentSettings ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPaymentSettings(true)}
                  className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ปลดล็อกเพื่อแก้ไขการตั้งค่าระบบการเงิน</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelPaymentSettings}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-sm border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>ยกเลิก (คืนค่าเดิม)</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-rescue-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>บันทึกการตั้งค่าระบบการเงิน</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: GOOGLE FORMS MANAGER */}
      {activeTab === 'forms' && (
        <form onSubmit={handleSaveForms} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">
                  จัดการ URL แบบทดสอบก่อน-หลัง และแบบประเมิน (Google Forms)
                </h3>
                {isEditingForms ? (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                    ✏️ โหมดแก้ไข
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> ล็อกข้อมูล (View Only)
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Admin สามารถใส่ URL ของ Google Form แต่ละรายการ และเปิด/ปิดการแสดงผลให้ผู้เข้าอบรมเห็นได้ตลอดเวลา
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              {!isEditingForms ? (
                <button
                  type="button"
                  onClick={() => setIsEditingForms(true)}
                  className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>ปลดล็อกเพื่อแก้ไขลิงก์แบบฟอร์ม</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelForms}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>ยกเลิก (คืนค่าเดิม)</span>
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าลิงก์</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Warning Banner when Editing */}
          {isEditingForms && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold text-sm text-amber-300 block">⚠️ ท่านกำลังอยู่ในโหมดแก้ไขลิงก์และสถานะ Google Forms</span>
                  <span className="text-xs text-amber-200/80">ระบบเปิดให้แก้ไข URL และสถานะแล้ว เมื่อเสร็จอย่าลืมกด "บันทึกการตั้งค่าลิงก์" หรือกด "ยกเลิก" เพื่อคืนค่าเดิม</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleCancelForms}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  บันทึกทันที
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            
            {/* 1. Pre-Test Form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    1. แบบทดสอบก่อนเรียน (Pre-Test)
                  </h4>
                </div>
                <button
                  type="button"
                  disabled={!isEditingForms}
                  onClick={() => handleToggleForm('pretest')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !isEditingForms 
                      ? 'opacity-80 cursor-not-allowed bg-slate-900 text-slate-400' 
                      : localForms.pretest?.enabled
                        ? 'bg-emerald-600 text-white shadow-md cursor-pointer'
                        : 'bg-slate-800 text-slate-400 cursor-pointer'
                  }`}
                >
                  {localForms.pretest?.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{localForms.pretest?.enabled ? 'เปิดให้ทำข้อสอบ (Active)' : 'ปิดระบบ (Disabled)'}</span>
                </button>
              </div>

              {/* Banner Preview */}
              <div className="rounded-xl overflow-hidden border border-blue-500/30 bg-slate-900 relative group">
                <img
                  src={localForms.pretest?.banner || '/images/banner/banner_pretest.png'}
                  alt="Pre-Test Banner Preview"
                  className="w-full h-24 sm:h-28 object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-[10px] text-blue-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>ป้ายหัวข้อ Pre-Test (Official Banner)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ชื่อหัวข้อแบบทดสอบ:</label>
                  <input
                    type="text"
                    disabled={!isEditingForms}
                    value={localForms.pretest?.title || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      pretest: { ...localForms.pretest, title: e.target.value }
                    })}
                    placeholder="แบบทดสอบก่อนเรียน (Pre-Test) 2027"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">คำอธิบายย่อ:</label>
                  <input
                    type="text"
                    disabled={!isEditingForms}
                    value={localForms.pretest?.description || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      pretest: { ...localForms.pretest, description: e.target.value }
                    })}
                    placeholder="คำอธิบายแบบทดสอบ..."
                    className={`w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Google Form URL (Pre-test):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    disabled={!isEditingForms}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.pretest?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      pretest: { ...localForms.pretest, url: e.target.value }
                    })}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs text-white font-mono outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                  {localForms.pretest?.url && (
                    <a
                      href={localForms.pretest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเปิด</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Post-Test Form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    2. แบบทดสอบหลังเรียน (Post-Test)
                  </h4>
                </div>
                <button
                  type="button"
                  disabled={!isEditingForms}
                  onClick={() => handleToggleForm('posttest')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !isEditingForms 
                      ? 'opacity-80 cursor-not-allowed bg-slate-900 text-slate-400' 
                      : localForms.posttest?.enabled
                        ? 'bg-emerald-600 text-white shadow-md cursor-pointer'
                        : 'bg-slate-800 text-slate-400 cursor-pointer'
                  }`}
                >
                  {localForms.posttest?.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{localForms.posttest?.enabled ? 'เปิดให้ทำข้อสอบ (Active)' : 'ปิดระบบ (Disabled)'}</span>
                </button>
              </div>

              {/* Banner Preview */}
              <div className="rounded-xl overflow-hidden border border-orange-500/30 bg-slate-900 relative group">
                <img
                  src={localForms.posttest?.banner || '/images/banner/banner_posttest.png'}
                  alt="Post-Test Banner Preview"
                  className="w-full h-24 sm:h-28 object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-[10px] text-orange-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  <span>ป้ายหัวข้อ Post-Test (Official Banner)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ชื่อหัวข้อแบบทดสอบ:</label>
                  <input
                    type="text"
                    disabled={!isEditingForms}
                    value={localForms.posttest?.title || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      posttest: { ...localForms.posttest, title: e.target.value }
                    })}
                    placeholder="แบบทดสอบหลังเรียน (Post-Test)"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">คำอธิบายย่อ:</label>
                  <input
                    type="text"
                    disabled={!isEditingForms}
                    value={localForms.posttest?.description || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      posttest: { ...localForms.posttest, description: e.target.value }
                    })}
                    placeholder="คำอธิบายแบบทดสอบหลังเรียน..."
                    className={`w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Google Form URL (Post-test):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    disabled={!isEditingForms}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.posttest?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      posttest: { ...localForms.posttest, url: e.target.value }
                    })}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs text-white font-mono outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                  {localForms.posttest?.url && (
                    <a
                      href={localForms.posttest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเปิด</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Evaluation Form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    3. แบบประเมินความพึงพอใจโครงการ (Evaluation Form)
                  </h4>
                </div>
                <button
                  type="button"
                  disabled={!isEditingForms}
                  onClick={() => handleToggleForm('evaluation')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !isEditingForms 
                      ? 'opacity-80 cursor-not-allowed bg-slate-900 text-slate-400' 
                      : localForms.evaluation?.enabled
                        ? 'bg-emerald-600 text-white shadow-md cursor-pointer'
                        : 'bg-slate-800 text-slate-400 cursor-pointer'
                  }`}
                >
                  {localForms.evaluation?.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{localForms.evaluation?.enabled ? 'เปิดให้ประเมิน (Active)' : 'ปิดระบบ (Disabled)'}</span>
                </button>
              </div>

              {/* Banner Preview */}
              <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900 relative group">
                <img
                  src={localForms.evaluation?.banner || '/images/banner/banner_evaluation.png'}
                  alt="Evaluation Banner Preview"
                  className="w-full h-24 sm:h-28 object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-[10px] text-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>ป้ายหัวข้อแบบประเมินความพึงพอใจ (Official Banner)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ชื่อหัวข้อแบบประเมิน:</label>
                  <input
                    type="text"
                    disabled={!isEditingForms}
                    value={localForms.evaluation?.title || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      evaluation: { ...localForms.evaluation, title: e.target.value }
                    })}
                    placeholder="แบบประเมินความพึงพอใจ (JRE 2027)"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">คำอธิบายย่อ:</label>
                  <input
                    type="text"
                    disabled={!isEditingForms}
                    value={localForms.evaluation?.description || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      evaluation: { ...localForms.evaluation, description: e.target.value }
                    })}
                    placeholder="คำอธิบายแบบประเมิน..."
                    className={`w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Google Form URL (Evaluation):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    disabled={!isEditingForms}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.evaluation?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      evaluation: { ...localForms.evaluation, url: e.target.value }
                    })}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs text-white font-mono outline-none transition-all ${
                      !isEditingForms
                        ? 'bg-slate-950/70 border border-slate-800 cursor-not-allowed opacity-80'
                        : 'bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                  {localForms.evaluation?.url && (
                    <a
                      href={localForms.evaluation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเปิด</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 flex items-center gap-3">
            {!isEditingForms ? (
              <button
                type="button"
                onClick={() => setIsEditingForms(true)}
                className="px-6 py-3.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>ปลดล็อกเพื่อแก้ไขลิงก์แบบฟอร์ม</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelForms}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>ยกเลิก (คืนค่าเดิม)</span>
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/30 text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าลิงก์และสถานะเปิด/ปิด</span>
                </button>
              </>
            )}
            {formsSavedMsg && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                บันทึกการตั้งค่าเรียบร้อยแล้ว
              </span>
            )}
          </div>

        </form>
      )}

      {/* TAB 3: ANNOUNCEMENTS MANAGER */}
      {activeTab === 'announcements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                ระบบจัดการประกาศข่าวสาร & เอกสารแนบ (Announcements)
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                สร้างประกาศคำสั่ง, กำหนดการชำระเงิน, แนบภาพกิจกรรมไม่เกิน 10 รูป, และแนบเอกสาร PDF
              </p>
            </div>

            <button
              onClick={() => handleOpenAnnModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างประกาศใหม่</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((ann, idx) => {
              const shortSlug = ann.slug || ann.short_id || (`n${idx + 1}`);
              return (
              <div
                key={ann.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {ann.pinned && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md">
                        ปักหมุด
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md border border-slate-700">
                      หมวด: {ann.category}
                    </span>
                    <span className="px-2 py-0.5 bg-rescue-500/15 text-rescue-400 border border-rescue-500/30 text-[10px] font-mono font-bold rounded-md">
                      URL: ?id={shortSlug}
                    </span>
                    {Array.isArray(ann.images) && ann.images.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 text-[10px] font-semibold rounded-md border border-blue-700/50 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {ann.images.length} รูป
                      </span>
                    )}
                    {ann.pdf_url && (
                      <span className="px-2 py-0.5 bg-red-900/60 text-red-300 text-[10px] font-semibold rounded-md border border-red-700/50 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        มี PDF
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-white text-base">{ann.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{ann.content}</p>

                  {ann.action_url && (
                    <p className="text-[11px] text-rescue-400 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      ลิงก์: {ann.action_url}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/announcements/${ann.category === 'pr' ? 'pr' : 'orders'}?id=${shortSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-rescue-400 rounded-xl transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="เปิดดูหน้าเฉพาะของประกาศนี้ในแท็บใหม่"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>เปิดดู</span>
                  </a>
                  <button
                    onClick={() => handleOpenAnnModal(ann)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAnn(ann.id)}
                    className="p-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl transition-colors text-xs flex items-center gap-1"
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
      )}

      {/* ANNOUNCEMENT CREATE / EDIT MODAL */}
      {showAnnModal && (
        <ModalPortal isOpen={Boolean(showAnnModal)} onClose={handleCloseAnnModal}>
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseAnnModal}
          >
            <div 
              className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
            
            <button
              onClick={handleCloseAnnModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingAnn ? 'แก้ไขประกาศข่าวสาร' : 'สร้างประกาศข่าวสารใหม่'}
            </h3>

            <form onSubmit={handleSaveAnn} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">หัวข้อประกาศ *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="เช่น 📢 ประกาศชำระเงินค่าสมัคร JRE 2027"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">หมวดหมู่ประกาศ</label>
                <select
                  value={annCategory}
                  onChange={e => setAnnCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="general">ทั่วไป (General)</option>
                  <option value="payment">ชำระเงิน / ค่าสมัคร (Payment)</option>
                  <option value="line_group">เข้ากลุ่ม Line / OpenChat</option>
                  <option value="order">คำสั่ง / ข้อปฏิบัติ (Order)</option>
                  <option value="change">แจ้งเปลี่ยนแปลง (Update)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    ชื่อ URL สั้น / ตัวระบุเฉพาะ (Custom Slug / Short ID)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (เช่น payment, curriculum, n1, n2 - เว้นว่างได้)
                  </span>
                </div>
                <input
                  type="text"
                  value={annSlug}
                  onChange={e => setAnnSlug(e.target.value)}
                  placeholder="เช่น payment, schedule, rules, n1 (ถ้าไม่กรอก ระบบจะใช้ n1, n2 อัตโนมัติ)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder:font-sans"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  URL เฉพาะของโพสต์นี้: <span className="text-rescue-400 font-mono">/announcements/{annCategory === 'pr' ? 'pr' : 'orders'}?id={annSlug.trim() || `n${editingAnn ? (announcements.findIndex(a => a.id === editingAnn.id) + 1 || 1) : (announcements.length + 1)}`}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">เนื้อหาประกาศ *</label>
                <textarea
                  rows="4"
                  required
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  placeholder="พิมพ์ข้อความรายละเอียดประกาศ..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs leading-relaxed"
                />
              </div>

              {/* ATTACH IMAGES (UP TO 10 PHOTOS) */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rescue-400" />
                    <span className="text-xs font-bold text-white">
                      รูปภาพประกอบ (ไม่เกิน 10 รูป)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    แนบแล้ว: {annImages.length} / 10 รูป
                  </span>
                </div>

                {annImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                    {annImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group">
                        <img src={imgUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {annImages.length < 10 && (
                  <div>
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rescue-400" />
                          <span>กำลังอัปโหลดรูปภาพ...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-rescue-400" />
                          <span>+ เพิ่มรูปภาพ (เลือกได้หลายรูป)</span>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/*,.heic,.heif"
                        onChange={handleImagesUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* ATTACH PDF DOCUMENT */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-white">เอกสารแนบ PDF ทางการ</span>
                  </div>
                </div>

                {annPdfUrl ? (
                  <div className="flex items-center justify-between p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-5 h-5 text-red-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{annPdfName || 'เอกสารทางการ.pdf'}</p>
                        <a href={annPdfUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                          <Eye className="w-3 h-3" /> เปิดดูตัวอย่าง
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors ml-2 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors ${isUploadingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          <span>กำลังอัปโหลดเอกสาร PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-red-400" />
                          <span>อัปโหลดเอกสารทางการ (.pdf)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ลิงก์ปุ่มกด (URL ไม่บังคับ)</label>
                  <input
                    type="url"
                    value={annUrl}
                    onChange={e => setAnnUrl(e.target.value)}
                    placeholder="https://line.me/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ข้อความบนปุ่ม</label>
                  <input
                    type="text"
                    value={annLabel}
                    onChange={e => setAnnLabel(e.target.value)}
                    placeholder="เช่น กดเพื่อเข้ากลุ่มไลน์"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={annPinned}
                  onChange={e => setAnnPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300 font-medium">
                  ปักหมุดประกาศนี้ไว้ด้านบนสุด (Pinned Announcement)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAnnModal}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  บันทึกประกาศ
                </button>
              </div>
            </form>

          </div>
        </div>
      </ModalPortal>
    )}

      {/* TAB 5: MERCHANDISE, SIZES, AND QR PICKUP MANAGEMENT */}
      {activeTab === 'merchandise' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-200">
          
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rescue-500/10 text-rescue-400 border border-rescue-500/30 mb-2">
                <Shirt className="w-3.5 h-3.5" />
                <span>ระบบจัดการเสื้อ & กางเกงกู้ภัย JRE 2027</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                จัดการคำสั่งซื้อ, สแกน QR รับของ & ตั้งค่าราคาไซต์พิเศษ
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ตรวจสอบสลิป, สแกน QR Code ส่งมอบสินค้าหน้างาน, และกำหนดราคาบวกเพิ่มสำหรับไซต์พิเศษ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowUniversalScanner(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
                title="สแกน QR Code เพื่อส่งมอบสินค้า/เสื้อ หรือตรวจบัตรผู้สมัคร (Universal Scanner)"
              >
                <Camera className="w-4 h-4" />
                <span>📷 สแกน QR อัจฉริยะ (ส่งมอบสินค้า & ตรวจบัตร)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShirtPrintModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40 border border-blue-400/40 transition-all active:scale-95 cursor-pointer"
                title="พิมพ์รายงานสรุปยอดสั่งเสื้อฝึก และส่งออกเป็นเอกสาร PDF A4"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>พิมพ์รายงาน PDF / พริ้นท์หน้านี้</span>
              </button>

              <button
                type="button"
                onClick={handleExportMerchandiseExcel}
                disabled={isExportingMerchExcel}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="ส่งออกรายการส่งมอบเสื้อทุกคนพร้อมรูปสลิปเป็น Excel (.xlsx)"
              >
                {isExportingMerchExcel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>กำลังฝังรูปภาพลง Excel ({exportMerchProgress.current}/{exportMerchProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 text-emerald-100" />
                    <span>ส่งออกรายการเสื้อเป็น Excel (.xlsx)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportMerchandiseCSV}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                title="ดาวน์โหลดไฟล์ CSV สำหรับเปิดใน Google Sheets พร้อมสูตรแสดงภาพสลิป"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>ดาวน์โหลด CSV</span>
              </button>

              <a
                href="#merchandise-settings"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-rescue-400" />
                <span>ไปที่ตั้งค่าไซต์ & ราคา</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>รวมเสื้อทั้งหมด</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rescue-500/10 text-rescue-400 border border-rescue-500/30">
                  Live Unified
                </span>
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {sizeStats.totalShirts} <span className="text-xs font-normal text-slate-400">ตัว</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                ผู้สมัคร <strong className="text-amber-300">{traineeShirtRecords.length}</strong> ตัว • สั่งซื้อเพิ่ม <strong className="text-purple-300">{sizeStats.totalShirts - traineeShirtRecords.length}</strong> ตัว
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>ส่งมอบเสื้อแล้ว</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {sizeStats.totalShirts > 0 ? Math.round((sizeStats.totalReceivedShirts / sizeStats.totalShirts) * 100) : 0}%
                </span>
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                {sizeStats.totalReceivedShirts} <span className="text-xs font-normal text-slate-400">ตัว</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                ส่งมอบแล้ว <strong className="text-emerald-300">{sizeStats.totalReceivedShirts}</strong> จากทั้งหมด {sizeStats.totalShirts} ตัว
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>รอส่งมอบหน้างาน</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {sizeStats.totalShirts > 0 ? Math.round((sizeStats.totalPendingShirts / sizeStats.totalShirts) * 100) : 0}%
                </span>
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">
                {sizeStats.totalPendingShirts} <span className="text-xs font-normal text-slate-400">ตัว</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 leading-snug">
                รอรับ ณ {localMerchConfig?.pickup?.short_location || DEFAULT_MERCHANDISE_CONFIG.pickup.short_location} ({localMerchConfig?.pickup?.schedule || DEFAULT_MERCHANDISE_CONFIG.pickup.schedule})
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                ยอดสั่งซื้อเพิ่มหน้าร้าน
              </span>
              <p className="text-2xl sm:text-3xl font-black text-purple-400">
                {merchandiseOrders
                  .filter(o => o.payment_status === 'paid_verified')
                  .reduce((sum, o) => sum + (o.total_amount || 0), 0)
                  .toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">บาท</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                รอตรวจสลิปหน้าร้าน: <strong className="text-amber-300">{merchandiseOrders.filter(o => o.payment_status === 'pending_verification').length}</strong> รายการ
              </p>
            </div>
          </div>

          {/* SECTION: UNIVERSITY × SHIRT SIZE & GENDER MATRIX + CUSTOM "อื่นๆ" PER-PERSON SIZE ASSIGNMENT */}
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>สรุปยอดเสื้อแยกตามมหาวิทยาลัย × ไซส์เสื้อ (SS - 5XL) & แยกชาย-หญิง / Staff 280 บ.</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  ตารางแยกไซส์เสื้อแต่ละมหาวิทยาลัย (คลิกที่มหาวิทยาลัยหรือตัวเลขไซส์เพื่อกรองดูรายชื่อด้านล่าง)
                </h3>
              </div>

              {(merchUniFilter !== 'all' || merchRoleFilter !== 'all' || merchSizeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setMerchUniFilter('all');
                    setMerchRoleFilter('all');
                    setMerchSizeFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 self-start lg:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรองมหาลัย/ไซส์ ({merchUniFilter !== 'all' ? merchUniFilter : 'ทั้งหมด'})</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 text-[11px]">
                    <th className="py-2.5 px-3 font-bold">มหาวิทยาลัย / สถาบัน</th>
                    <th className="py-2.5 px-2 text-center font-bold text-sky-300 bg-sky-950/20">👨 ชาย</th>
                    <th className="py-2.5 px-2 text-center font-bold text-pink-300 bg-pink-950/20">👩 หญิง</th>
                    <th className="py-2.5 px-2 text-center font-bold text-purple-300 bg-purple-950/20">🛠️ Staff (280 บ.)</th>
                    <th className="py-2.5 px-2.5 text-center font-black text-amber-300 bg-amber-950/20 border-x border-slate-800">รวมเสื้อ</th>
                    {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => (
                      <th
                        key={sz}
                        onClick={() => setMerchSizeFilter(merchSizeFilter === sz ? 'all' : sz)}
                        className={`py-2.5 px-2 text-center font-mono font-bold cursor-pointer transition-colors ${
                          merchSizeFilter === sz
                            ? 'bg-amber-500 text-slate-950'
                            : sz === 'อื่นๆ'
                            ? 'text-rose-300 hover:bg-rose-950/40'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title={`คลิกเพื่อกรองเฉพาะไซส์ ${sz}`}
                      >
                        {sz}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {universitySummary.list.map(u => {
                    const isSelectedUni = merchUniFilter === u.key;
                    return (
                      <tr
                        key={u.key}
                        onClick={() => setMerchUniFilter(isSelectedUni ? 'all' : u.key)}
                        className={`cursor-pointer transition-colors ${
                          isSelectedUni ? 'bg-indigo-950/50 ring-1 ring-indigo-500/50' : 'hover:bg-slate-900/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] mr-1.5 font-black ${
                            u.isMsu
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {u.shortTag}
                          </span>
                          <span className="text-slate-400 text-[11px] hidden xl:inline">{u.label}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-300 bg-sky-950/10">
                          {u.male > 0 ? u.male : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-pink-300 bg-pink-950/10">
                          {u.female > 0 ? u.female : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-300 bg-purple-950/10">
                          {u.staff > 0 ? u.staff : '-'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-black text-amber-300 bg-amber-950/15 border-x border-slate-800/80">
                          {u.totalShirts} ตัว
                        </td>
                        {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => {
                          const c = u.shirtCounts[sz] || 0;
                          return (
                            <td
                              key={sz}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMerchUniFilter(u.key);
                                setMerchSizeFilter(sz);
                              }}
                              className={`py-2.5 px-2 text-center font-mono ${
                                c > 0
                                  ? sz === 'อื่นๆ'
                                    ? 'font-black text-rose-300 bg-rose-950/30 hover:bg-rose-900/50'
                                    : 'font-black text-white bg-slate-900/90 hover:bg-amber-500/20'
                                  : 'text-slate-600'
                              }`}
                              title={`คลิกดู ${u.shortTag} ไซส์ ${sz}`}
                            >
                              {c > 0 ? c : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900/95 border-t-2 border-slate-700 font-black text-white text-xs">
                    <td className="py-2.5 px-3 text-amber-300">รวมทั้งหมด ({universitySummary.list.length} สถาบัน)</td>
                    <td className="py-2.5 px-2 text-center font-mono text-sky-300">{universitySummary.totals.male}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-pink-300">{universitySummary.totals.female}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-purple-300">{universitySummary.totals.staff}</td>
                    <td className="py-2.5 px-2.5 text-center font-mono text-amber-300 border-x border-slate-800">{universitySummary.totals.totalShirts} ตัว</td>
                    {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'อื่นๆ'].map(sz => (
                      <td key={sz} className={`py-2.5 px-2 text-center font-mono ${sz === 'อื่นๆ' ? 'text-rose-300' : 'text-amber-300'}`}>
                        {universitySummary.totals.shirtCounts[sz] || 0}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PER-PERSON CUSTOM SIZE ("อื่นๆ") MANAGEMENT PANEL */}
            {(() => {
              const customSizeItems = sizeStats.allShirtItems.filter(
                it => !['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(it.size))
              );
              return (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  customSizeItems.length > 0
                    ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border-rose-500/50 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 ${
                        customSizeItems.length > 0
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {customSizeItems.length > 0 ? `⚠️ รอระบุไซส์จริง ${customSizeItems.length} คน` : '✓ ระบุไซส์ครบทุกคนแล้ว'}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          จัดการผู้เลือกไซส์ &ldquo;อื่นๆ (ขนาดสั่งตัดพิเศษ)&rdquo; — ให้ Admin ระบุไซส์จริงรายคนหลังติดต่อแล้ว
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          เมื่อแอดมินติดต่อไปคุยกับผู้สมัครที่เลือก &ldquo;อื่นๆ&rdquo; แล้วว่าตกลงใช้ไซส์อะไร ให้กดเลือกปุ่มไซส์จริงรายคนด้านล่าง ระบบจะย้ายคนนั้นไปขึ้นตามไซส์จริงในระบบทันที
                        </p>
                      </div>
                    </div>
                  </div>

                  {customSizeItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {customSizeItems.map((cItem) => {
                        const isUpdating = updatingSizeId === cItem.id || updatingSizeId === cItem.user_id;
                        return (
                          <div
                            key={cItem.id}
                            className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/40 flex flex-col justify-between gap-2.5 shadow"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-white text-xs sm:text-sm">
                                    {cItem.customer_name}
                                  </span>
                                  {cItem.nickname && cItem.nickname !== '-' && (
                                    <span className="text-amber-300 text-xs font-bold">({cItem.nickname})</span>
                                  )}
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                    🏛️ {cItem.uni_short || resolveUniversityInfo(cItem).shortTag}
                                  </span>
                                  {cItem.is_staff && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-400/40 text-[10px] font-bold">
                                      🛠️ Staff 280 บ.
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                  <span>📞 โทรติดต่อ: <a href={`tel:${cItem.phone}`} className="text-emerald-400 font-mono font-bold hover:underline">{cItem.phone || '-'}</a></span>
                                  <span>• ที่เลือกไว้: <strong className="text-rose-300 font-mono">{cItem.size}</strong></span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold shrink-0">
                                {cItem.source === 'registration' ? 'ผู้สมัคร' : 'สั่งซื้อเพิ่ม'}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-amber-300 block">
                                👉 คลิกระบุไซส์จริงที่ได้คุยตกลงกับ {cItem.customer_name} (อัปเดตขึ้นตามไซส์ในระบบทันที):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map((targetSz) => (
                                  <button
                                    key={targetSz}
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleAssignPersonShirtSize(cItem, targetSz)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-xs font-mono font-black transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                    title={`ตั้งค่าไซส์ของ ${cItem.customer_name} เป็น ${targetSz}`}
                                  >
                                    {targetSz}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ขณะนี้ไม่มีผู้ค้างอยู่ในหมวด &ldquo;อื่นๆ&rdquo; — หากต้องการเปลี่ยนไซส์ให้คนไหนเพิ่มเติม สามารถเลือกเปลี่ยนได้จากปุ่ม <strong>&ldquo;ระบุ/เปลี่ยนไซส์จริง&rdquo;</strong> ในการ์ดรายชื่อแต่ละคนด้านล่างได้เลย</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* SECTION: VISUAL CHART & SIZE BREAKDOWN ANALYTICS */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>สรุปยอดแจกแจงตามขนาดไซส์ (Size Breakdown Analytics)</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  แผนภูมิสัดส่วนไซส์เสื้อ & ยอดผลิตสำหรับแจกจ่ายหน้างาน
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  คลิกที่ปุ่มไซส์เพื่อกรองดู <strong className="text-amber-300">"ใครบ้าง กี่ตัว"</strong> ในตารางด้านล่างได้ทันที
                </p>
              </div>

              {merchSizeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setMerchSizeFilter('all')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto border border-slate-700 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>ล้างการกรองไซส์ (แสดงทั้งหมด)</span>
                </button>
              )}
            </div>

            {/* Visual Distribution Horizontal Bars */}
            <div className="space-y-3">
              {sizeStats.STANDARD_SIZES.map((sizeKey) => {
                const count = sizeStats.counts[sizeKey] || 0;
                const recCount = sizeStats.receivedCounts[sizeKey] || 0;
                const pendCount = sizeStats.pendingCounts[sizeKey] || 0;
                const pct = sizeStats.totalShirts > 0 ? ((count / sizeStats.totalShirts) * 100).toFixed(1) : 0;
                const isSelected = merchSizeFilter === sizeKey;
                const measurement = SIZE_MEASUREMENTS[sizeKey] || '';

                return (
                  <div 
                    key={sizeKey}
                    onClick={() => setMerchSizeFilter(isSelected ? 'all' : sizeKey)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-300 border border-slate-700'
                        }`}>
                          {sizeKey}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white">
                            ไซส์ {sizeKey}
                          </span>
                          {measurement && (
                            <span className="text-[11px] text-slate-400 ml-2 font-mono">
                              ({measurement})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">
                          ส่งมอบแล้ว <strong className="text-emerald-400">{recCount}</strong> / รอรับ <strong className="text-amber-400">{pendCount}</strong>
                        </span>
                        <div className="text-right min-w-[70px]">
                          <span className="font-black text-sm text-white font-mono">{count}</span>{' '}
                          <span className="text-[11px] text-slate-400">ตัว ({pct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar with Delivered vs Pending Split */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/60">
                      {count > 0 ? (
                        <>
                          <div 
                            style={{ width: `${sizeStats.totalShirts > 0 ? (recCount / sizeStats.totalShirts) * 100 : 0}%` }}
                            className="bg-emerald-500 h-full transition-all duration-500 hover:opacity-90"
                            title={`ส่งมอบแล้ว: ${recCount} ตัว`}
                          />
                          <div 
                            style={{ width: `${sizeStats.totalShirts > 0 ? (pendCount / sizeStats.totalShirts) * 100 : 0}%` }}
                            className="bg-amber-500 h-full transition-all duration-500 hover:opacity-90"
                            title={`รอรับ: ${pendCount} ตัว`}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-900/50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Interactive Size Badges Grid */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                คลิกเลือกขนาดไซส์เพื่อดูรายชื่อผู้รับทันที (Quick Size Filter):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setMerchSizeFilter('all')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    merchSizeFilter === 'all'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">ทั้งหมด</span>
                    <span className="text-xs font-mono font-bold">{sizeStats.totalShirts}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">รวมทุกขนาดไซส์</span>
                </button>

                {sizeStats.STANDARD_SIZES.map((s) => {
                  const count = sizeStats.counts[s] || 0;
                  const isSelected = merchSizeFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMerchSizeFilter(isSelected ? 'all' : s)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 text-white shadow-md'
                          : count > 0
                          ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black font-mono">👕 {s}</span>
                        <span className={`text-xs font-mono font-black ${count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                          {count} ตัว
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span className="text-emerald-400">✓ {sizeStats.receivedCounts[s] || 0}</span>
                        <span className="text-amber-400">⏳ {sizeStats.pendingCounts[s] || 0}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION: ORDERS & TRAINEE SHIRTS LIST ("ใครบ้าง กี่ตัว") */}
          <div className="space-y-4">
            
            {/* Source Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMerchSourceFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    merchSourceFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ทั้งหมด ({filteredShirtItems.length} รายการ)
                </button>

                <button
                  type="button"
                  onClick={() => setMerchSourceFilter('registration')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    merchSourceFilter === 'registration'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>📋 เสื้อฝึกผู้สมัคร</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                    {traineeShirtRecords.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMerchSourceFilter('merchandise')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    merchSourceFilter === 'merchandise'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>🛍️ สั่งซื้อเพิ่ม (หน้าร้าน)</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                    {merchandiseStoreRecords.length}
                  </span>
                </button>
              </div>

              {/* Active size indicator if filtered */}
              {merchSizeFilter !== 'all' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold">
                  <span>กำลังแสดงเฉพาะ: ไซส์ {merchSizeFilter}</span>
                  <button 
                    type="button" 
                    onClick={() => setMerchSizeFilter('all')}
                    className="p-0.5 hover:bg-amber-500/30 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Search and Dropdown Filter Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={merchSearchQuery}
                  onChange={(e) => setMerchSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, นามเรียกขาน, ชื่อเล่น, เบอร์โทร, สังกัด, รหัส..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={merchUniFilter}
                  onChange={(e) => setMerchUniFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 font-bold focus:outline-none"
                >
                  <option value="all">🏛️ ทุกมหาวิทยาลัย</option>
                  {universitySummary.list.map(u => (
                    <option key={u.key} value={u.key}>
                      {u.shortTag} ({u.totalShirts} ตัว)
                    </option>
                  ))}
                </select>

                <select
                  value={merchRoleFilter}
                  onChange={(e) => setMerchRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-purple-500/40 rounded-xl text-xs text-purple-200 font-bold focus:outline-none"
                >
                  <option value="all">👥 ทุกประเภท (ผู้สมัคร + Staff)</option>
                  <option value="staff">🛠️ เฉพาะ Staff (280 บ.)</option>
                  <option value="participant">🎓 เฉพาะผู้เข้าอบรมปกติ</option>
                </select>

                <select
                  value={merchSizeFilter}
                  onChange={(e) => setMerchSizeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">ไซส์ทั้งหมด</option>
                  {sizeStats.STANDARD_SIZES.map(s => (
                    <option key={s} value={s}>ไซส์ {s} ({sizeStats.counts[s] || 0} ตัว)</option>
                  ))}
                </select>

                <select
                  value={merchDeliveryFilter}
                  onChange={(e) => setMerchDeliveryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">การส่งมอบทั้งหมด</option>
                  <option value="pending">⏳ ยังไม่ส่งมอบ (รอรับ)</option>
                  <option value="received">✓ ส่งมอบแล้ว</option>
                </select>

                <select
                  value={merchPaymentFilter}
                  onChange={(e) => setMerchPaymentFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">การชำระเงินทั้งหมด</option>
                  <option value="paid">✓ ชำระแล้ว</option>
                  <option value="pending">⏳ รอตรวจสลิป</option>
                  <option value="unpaid">ยังไม่ชำระ</option>
                </select>

                {(merchSearchQuery || merchUniFilter !== 'all' || merchRoleFilter !== 'all' || merchSizeFilter !== 'all' || merchDeliveryFilter !== 'all' || merchPaymentFilter !== 'all' || merchSourceFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMerchSearchQuery('');
                      setMerchUniFilter('all');
                      setMerchRoleFilter('all');
                      setMerchSizeFilter('all');
                      setMerchDeliveryFilter('all');
                      setMerchPaymentFilter('all');
                      setMerchSourceFilter('all');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                    title="ล้างตัวกรองทั้งหมด"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* LIST OF FILTERED ITEMS */}
            {filteredShirtItems.length === 0 ? (
              <div className="p-12 text-center bg-slate-950/70 border border-slate-800 rounded-3xl space-y-3">
                <Shirt className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">ไม่พบรายการเสื้อหรือคำสั่งซื้อตามเงื่อนไขที่เลือก</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ลองล้างคำค้นหาหรือเปลี่ยนขนาดไซส์ที่ต้องการกรอง
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShirtItems.map((item, index) => {
                  const isReceived = item.pickup_status === 'received';
                  const isPaid = item.payment_status === 'paid_verified';
                  const isReg = item.source === 'registration';

                  return (
                    <div
                      key={item.id || index}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-lg space-y-3 ${
                        isReceived 
                          ? 'bg-slate-950/95 border-emerald-500/30' 
                          : 'bg-slate-950/95 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isReg 
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}>
                            {item.source_label}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {item.order_number}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString('th-TH')} • {new Date(item.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-bold">
                            {item.pickup_method === 'shipping' ? 'จัดส่งพัสดุ' : 'รับหน้างาน 13 ก.พ. 2570'}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          {isReceived ? (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs rounded-full font-bold flex items-center gap-1 shadow">
                              <PackageCheck className="w-3.5 h-3.5" /> ส่งมอบเสื้อแล้ว
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs rounded-full font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> รอส่งมอบหน้างาน
                            </span>
                          )}

                          {isPaid ? (
                            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] rounded-full font-bold">
                              ✓ {item.payment_badge}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 text-[11px] rounded-full font-bold">
                              {item.payment_badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body (3-Column Layout) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* Col 1: Person Info (5 cols) */}
                        <div className="md:col-span-5 space-y-1">
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                            <span>{item.customer_name}</span>
                            {item.nickname && item.nickname !== '-' && (
                              <span className="text-amber-300 text-xs font-bold">({item.nickname})</span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
                              🏛️ {item.uni_short || resolveUniversityInfo(item).shortTag}
                            </span>
                            {item.gender && item.gender !== 'ไม่ระบุ' && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                item.gender === 'ชาย'
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                  : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                              }`}>
                                {item.gender === 'ชาย' ? '👨 ชาย' : '👩 หญิง'}
                              </span>
                            )}
                            {item.is_staff && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/50 text-[10px] font-black">
                                🛠️ Staff (ค่าเสื้อ 280 บ.)
                              </span>
                            )}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                            {item.callsign && item.callsign !== '-' && (
                              <span className="text-sky-300 font-mono font-bold">
                                📡 {item.callsign}
                              </span>
                            )}
                            {item.institution && item.institution !== '-' && (
                              <span className="truncate max-w-[260px]" title={item.institution}>
                                🏫 {item.institution}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <a href={`tel:${item.phone}`} className="text-indigo-400 hover:underline">{item.phone}</a>
                            </p>
                            {item.group_assigned && item.group_assigned !== '-' && (
                              <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800 text-[10px]">
                                กลุ่ม: {item.group_assigned}
                              </span>
                            )}
                            {item.room_assigned && item.room_assigned !== '-' && (
                              <span className="px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-800 text-[10px]">
                                ห้อง: {item.room_assigned}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Shirt Size & Items (4 cols) */}
                        <div className="md:col-span-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 font-bold uppercase">ไซส์เสื้อ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-sm border ${
                                !['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(item.size))
                                  ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 animate-pulse'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                👕 ไซส์ {item.size}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono font-bold text-xs">
                                x{item.quantity} ตัว
                              </span>
                            </div>
                          </div>

                          {/* Direct Admin Size Selector per Person */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                            <span className="text-[10px] text-amber-300/90 font-semibold">
                              ระบุ/เปลี่ยนไซส์จริงรายคน:
                            </span>
                            <select
                              value={['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(normalizeSize(item.size)) ? normalizeSize(item.size) : 'อื่นๆ'}
                              disabled={updatingSizeId === item.id || updatingSizeId === item.user_id}
                              onChange={(e) => handleAssignPersonShirtSize(item, e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-amber-500/40 hover:border-amber-400 rounded-lg text-xs font-mono font-bold text-white cursor-pointer focus:outline-none"
                            >
                              {['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map(sz => (
                                <option key={sz} value={sz}>ไซส์ {sz}</option>
                              ))}
                              <option value="อื่นๆ">อื่นๆ (รอติดต่อระบุไซส์)</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400 truncate max-w-[160px]" title={item.product_name}>
                              {item.product_name}
                            </span>
                            <span className="font-black text-amber-400 font-mono shrink-0">
                              {item.total_amount ? `${item.total_amount.toLocaleString()} บาท` : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Col 3: Slip & Admin Handover Actions (3 cols) */}
                        <div className="md:col-span-3 space-y-2">
                          {/* Slip Preview if present */}
                          {item.slip_url ? (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.slip_url}
                                  alt="สลิป"
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                                />
                                <span className="text-[11px] text-slate-300 font-bold">สลิปโอนเงิน</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({
                                  fileUrl: item.slip_url,
                                  fileName: `slip-${item.order_number || item.id || 'shirt'}.jpg`,
                                  title: `หลักฐานสลิปโอนเงิน - ${item.customer_name} (${item.order_number || item.shirt_size})`
                                })}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span>ดูสลิป</span>
                              </button>
                            </div>
                          ) : null}

                          {/* Handover Buttons */}
                          <div>
                            {!isReceived ? (
                              <button
                                type="button"
                                disabled={handoverLoadingId === item.id}
                                onClick={async () => {
                                  setHandoverLoadingId(item.id);
                                  try {
                                    if (isReg) {
                                      const targetUserId = item.user_id || item.rawRegistration?.user_id || item.rawRegistration?.id || item.id?.replace('reg_shirt_', '');
                                      if (onUpdateAllocation) {
                                        await onUpdateAllocation(targetUserId, {
                                          shirt_pickup_status: 'received',
                                          shirt_received: true,
                                          shirt_received_date: new Date().toISOString()
                                        });
                                        triggerToast(`บันทึกส่งมอบเสื้อฝึก (ไซส์ ${item.size}) แก่คุณ ${item.customer_name} เรียบร้อยแล้ว`);
                                      }
                                    } else {
                                      await onMarkOrderReceived(item.id, 'Admin JRE 2027');
                                      triggerToast(`บันทึกส่งมอบออเดอร์ ${item.order_number} เรียบร้อยแล้ว`);
                                    }
                                  } catch (err) {
                                    console.error('Error confirming handover:', err);
                                    triggerToast('เกิดข้อผิดพลาดในการบันทึกส่งมอบเสื้อ', 'error');
                                  } finally {
                                    setHandoverLoadingId(null);
                                  }
                                }}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                              >
                                {handoverLoadingId === item.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังบันทึกส่งมอบ...</span>
                                  </>
                                ) : (
                                  <>
                                    <PackageCheck className="w-4 h-4" />
                                    <span>บันทึกส่งมอบเสื้อแล้ว</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-center py-1 text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1 bg-emerald-950/40 rounded-lg border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>ส่งมอบแล้ว {item.pickup_at ? `(${new Date(item.pickup_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
                                </div>
                                <button
                                  type="button"
                                  disabled={handoverLoadingId === item.id}
                                  onClick={async () => {
                                    setHandoverLoadingId(item.id);
                                    try {
                                      if (isReg) {
                                        const targetUserId = item.user_id || item.rawRegistration?.user_id || item.rawRegistration?.id || item.id?.replace('reg_shirt_', '');
                                        if (onUpdateAllocation) {
                                          await onUpdateAllocation(targetUserId, {
                                            shirt_pickup_status: 'pending',
                                            shirt_received: false,
                                            shirt_received_date: null
                                          });
                                          triggerToast(`ยกเลิกสถานะส่งมอบเสื้อคุณ ${item.customer_name} แล้ว`);
                                        }
                                      } else {
                                        await onMarkOrderReceived(item.id, null, 'pending');
                                        triggerToast(`ยกเลิกสถานะส่งมอบออเดอร์ ${item.order_number} แล้ว`);
                                      }
                                    } catch (err) {
                                      console.error('Error canceling handover:', err);
                                      triggerToast('เกิดข้อผิดพลาดในการยกเลิกสถานะส่งมอบ', 'error');
                                    } finally {
                                      setHandoverLoadingId(null);
                                    }
                                  }}
                                  className="w-full text-center py-0.5 text-[10px] text-slate-500 hover:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  {handoverLoadingId === item.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                      <span>กำลังยกเลิก...</span>
                                    </>
                                  ) : (
                                    <span>ยกเลิก (เปลี่ยนเป็นรอรับ)</span>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Store order slip verify buttons */}
                            {!isReg && !isPaid && (
                              <div className="flex gap-1.5 pt-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onVerifyOrderPayment(item.id, true, 'อนุมัติโดย Admin');
                                    triggerToast(`อนุมัติสลิปออเดอร์ ${item.order_number} แล้ว`);
                                  }}
                                  className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                                >
                                  ✓ อนุมัติสลิป
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const note = await askPrompt({
                                      title: 'ระบุเหตุผลที่ปฏิเสธสลิปสั่งซื้อเสื้อ',
                                      message: 'แจ้งเหตุผลเพื่อให้ลูกค้าทราบและแนบสลิปใหม่:',
                                      defaultValue: 'ยอดเงินไม่ถูกต้อง กรุณาแนบสลิปใหม่',
                                      placeholder: 'ระบุเหตุผลที่ปฏิเสธสลิป...',
                                      variant: 'danger',
                                      confirmText: 'ตกลง',
                                      cancelText: 'ยกเลิก'
                                    });
                                    if (note !== null) {
                                      await onVerifyOrderPayment(item.id, false, note);
                                      triggerToast(`ปฏิเสธสลิปออเดอร์ ${item.order_number}`);
                                    }
                                  }}
                                  className="py-1 px-2 bg-slate-800 hover:bg-rose-900/60 text-rose-300 rounded-lg text-[11px] cursor-pointer"
                                >
                                  ปฏิเสธ
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* SETTINGS SECTION: PRODUCTS, SIZES, PRICES & BACKUP GOOGLE FORM */}
          <div id="merchandise-settings" className="pt-8 border-t border-slate-800 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rescue-500" />
                    <span>ตั้งค่าสินค้า, ไซต์, ราคาบวกเพิ่ม & Google Form สำรอง</span>
                  </h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    isEditingMerchConfig 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isEditingMerchConfig ? '✏️ โหมดแก้ไข' : '🔒 ล็อกข้อมูล (View Only)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ปรับราคาฐาน, เพิ่ม/ลดขนาดไซต์, กำหนดราคาไซต์พิเศษบวกเพิ่มกี่บาท และจัดการระบบสั่งซื้อสำรอง
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isEditingMerchConfig ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingMerchConfig(true)}
                    className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>ปลดล็อกเพื่อแก้ไขสินค้า & ไซต์</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelMerchConfig}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                      <span>ยกเลิก (คืนค่าเดิม)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMerchandiseConfig}
                      disabled={isSavingMerch}
                      className="px-5 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rescue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingMerch ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Warning Banner when Editing */}
            {isEditingMerchConfig && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-300 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>คุณกำลังอยู่ใน <strong>โหมดแก้ไขการตั้งค่าสินค้าและขนาดไซต์</strong> ข้อมูลที่ปรับแก้จะไม่ถูกบันทึกจริงจนกว่าจะกดปุ่ม "บันทึกการตั้งค่าทั้งหมด"</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelMerchConfig}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMerchandiseConfig}
                    disabled={isSavingMerch}
                    className="px-3 py-1 bg-rescue-600 hover:bg-rescue-500 text-white rounded-lg font-bold shadow cursor-pointer"
                  >
                    {isSavingMerch ? 'กำลังบันทึก...' : 'บันทึกตอนนี้'}
                  </button>
                </div>
              </div>
            )}

            {/* 1. CENTRAL BANK ACCOUNT REFERENCE (Uses Settings from Payment Tab) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">
                      ข้อมูลบัญชีธนาคารกลางรับโอนเงิน (Central Project Bank Account)
                    </h4>
                    <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                      ✓ เชื่อมโยงกับระบบลงทะเบียนหลักแล้ว
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">{localPayment?.bank_name || 'ธนาคารไทยพาณิชย์'}</strong> • เลขที่บัญชี: <span className="font-mono font-bold text-amber-300">{localPayment?.bank_account_number || '594-264865-5'}</span> • ชื่อบัญชี: <strong className="text-white">{localPayment?.bank_account_name || 'นางสาวมัญชุพร ยังเหล็ก'}</strong> • ☎️ สอบถามเพิ่มเติม: <span className="font-mono text-amber-300">{localPayment?.contact_phone || '098-329-6762'} (ไม่มีพร้อมเพย์)</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ระบบคำสั่งซื้อเสื้อและกางเกงโครงการ JRE 2027 ใช้บัญชีธนาคารกลางร่วมกับระบบค่าลงทะเบียนหลักโดยอัตโนมัติ (แก้ไขข้อมูลบัญชีได้ที่เมนู "ตั้งค่าค่าสมัคร & ผ่อนชำระ")
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('payment_settings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 self-start md:self-auto"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>ไปที่ตั้งค่าบัญชีธนาคารหลัก</span>
              </button>
            </div>

            {/* 2. Google Form Backup Configuration */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>ระบบสั่งซื้อผ่าน Google Form (ช่องทางสำรอง)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    เปิดให้มีปุ่มสั่งซื้อผ่าน Google Form สำหรับผู้ที่ไม่สะดวกสั่งผ่านเว็บ
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isEditingMerchConfig}
                  onClick={() => {
                    const currentEnabled = localMerchConfig.google_form?.enabled;
                    setLocalMerchConfig({
                      ...localMerchConfig,
                      google_form: {
                        ...localMerchConfig.google_form,
                        enabled: !currentEnabled
                      }
                    });
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                    !isEditingMerchConfig ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                  }${
                    localMerchConfig.google_form?.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {localMerchConfig.google_form?.enabled ? '✓ เปิดใช้งานแล้ว' : 'ปิดการใช้งาน'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400">ลิงก์ Google Form URL:</label>
                  <input
                    type="url"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.google_form?.url || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        google_form: {
                          ...localMerchConfig.google_form,
                          url: e.target.value
                        }
                      });
                    }}
                    placeholder="https://docs.google.com/forms/d/e/..."
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400">ข้อความบนปุ่ม:</label>
                  <input
                    type="text"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.google_form?.title || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        google_form: {
                          ...localMerchConfig.google_form,
                          title: e.target.value
                        }
                      });
                    }}
                    placeholder="สั่งซื้อเสื้อ/กางเกงโครงการผ่าน Google Form (ช่องทางสำรอง)"
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* 2.5 Pickup Location & Schedule Settings (สถานที่รับของ & กำหนดการส่งมอบ) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>ตั้งค่าสถานที่รับของ & วันเวลากำหนดรับเสื้อ (Pickup Logistics & Schedule Settings)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    กำหนดจุดรับสินค้า วันเวลารายงานตัวรับเสื้อ และคำแนะนำที่จะแสดงบนบัตรดิจิทัลและ QR Code ของผู้สมัครทุกคน
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    isEditingMerchConfig 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isEditingMerchConfig ? '✏️ กำลังอยู่ในโหมดแก้ไข' : '🔒 โหมดดูข้อมูล (กดแก้ไขเพื่อปรับค่า)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. จุดรับสินค้า (แบบเต็ม) */}
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>จุดรับสินค้า / สถานที่รับของ (ชื่อเต็ม แสดงใน QR Modal & รายละเอียด):</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.pickup?.location || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        pickup: {
                          ...(localMerchConfig.pickup || DEFAULT_MERCHANDISE_CONFIG.pickup),
                          location: e.target.value
                        }
                      });
                    }}
                    placeholder="อาคารพลศึกษา มหาวิทยาลัยมหาสารคาม (มมส)"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ตัวอย่าง: อาคารพลศึกษา มหาวิทยาลัยมหาสารคาม (มมส)
                  </span>
                </div>

                {/* 2. ชื่อสถานที่แบบย่อ */}
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>ชื่อสถานที่แบบย่อ (สำหรับบัตร & แท็กสรุป):</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.pickup?.short_location || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        pickup: {
                          ...(localMerchConfig.pickup || DEFAULT_MERCHANDISE_CONFIG.pickup),
                          short_location: e.target.value
                        }
                      });
                    }}
                    placeholder="อาคารพลศึกษา มมส"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ตัวอย่าง: อาคารพลศึกษา มมส
                  </span>
                </div>

                {/* 3. วันเวลากำหนดรับของ */}
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>วันเวลาที่รับของ / กำหนดการส่งมอบเสื้อ:</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.pickup?.schedule || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        pickup: {
                          ...(localMerchConfig.pickup || DEFAULT_MERCHANDISE_CONFIG.pickup),
                          schedule: e.target.value
                        }
                      });
                    }}
                    placeholder="วันรายงานตัวเปิดโครงการ วันที่ 13 ก.พ. 2570 (เวลา 08:30 - 16:30 น.)"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ตัวอย่าง: วันรายงานตัวเปิดโครงการ วันที่ 13 ก.พ. 2570 (เวลา 08:30 - 16:30 น.)
                  </span>
                </div>

                {/* 4. เบอร์โทรประสานงานจุดรับของ */}
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>เบอร์โทรประสานงานจุดรับเสื้อ / ผู้ประสานงาน:</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.pickup?.contact_phone || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        pickup: {
                          ...(localMerchConfig.pickup || DEFAULT_MERCHANDISE_CONFIG.pickup),
                          contact_phone: e.target.value
                        }
                      });
                    }}
                    placeholder="098-329-6762"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    เบอร์โทรติดต่อเจ้าหน้าที่ฝ่ายพัสดุและจัดเตรียมเสื้อผ้า
                  </span>
                </div>

                {/* 5. หมายเหตุ / คำแนะนำ */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>คำแนะนำ ณ จุดรับของ (แสดงใต้บัตรรับเสื้อ & ป็อปอัป QR):</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingMerchConfig}
                    value={localMerchConfig.pickup?.note || ''}
                    onChange={(e) => {
                      setLocalMerchConfig({
                        ...localMerchConfig,
                        pickup: {
                          ...(localMerchConfig.pickup || DEFAULT_MERCHANDISE_CONFIG.pickup),
                          note: e.target.value
                        }
                      });
                    }}
                    placeholder="แสดงบัตรนี้หรือบัตรประจำตัวประชาชนต่อเจ้าหน้าที่ ณ จุดลงทะเบียนรับเสื้อ"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-950"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    คำแนะนำระบุเอกสารหรือขั้นตอนที่ผู้มารับของต้องเตรียมพร้อม
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Products & Sizes Configuration (Toggle Visibility, Edit Title, Photos Gallery & Sizes) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-rescue-500" />
                    <span>จัดการสินค้า (เปิด/ปิดแสดงผล, แก้ไขชื่อ, จัดการรูปตัวอย่าง & ไซต์)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    เลือกสินค้าด้านล่างเพื่อเปิด/ปิดจำหน่าย แก้ไขชื่อและรายละเอียด จัดการคลังรูปภาพ และตั้งราคาไซต์
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  สินค้าทั้งหมด: <span className="text-white">{(localMerchConfig.products || []).length}</span> รายการ
                </div>
              </div>

              {/* Quick Category Master Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
                {/* หมวดเสื้อ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rescue-500/20 text-rescue-400 flex items-center justify-center shrink-0">
                      <Shirt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">หมวดหมู่เสื้อ (Shirts)</span>
                      <p className="text-[10px] text-slate-400">ควบคุมเปิด/ปิดแสดงผล และการสั่งซื้อเสื้อทั้งหมด</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('shirt', 'enabled', true)}
                      className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      👁️ เปิดแสดง
                    </button>
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('shirt', 'enabled', false)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ซ่อน
                    </button>
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('shirt', 'allow_order', true)}
                      className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🛒 เปิดสั่ง
                    </button>
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('shirt', 'allow_order', false)}
                      className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🔒 ปิดสั่ง
                    </button>
                  </div>
                </div>

                {/* หมวดกางเกง */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">หมวดหมู่กางเกง (Pants)</span>
                      <p className="text-[10px] text-slate-400">ควบคุมเปิด/ปิดแสดงผล และการสั่งซื้อกางเกงทั้งหมด</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('pants', 'enabled', true)}
                      className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      👁️ เปิดแสดง
                    </button>
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('pants', 'enabled', false)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ซ่อน
                    </button>
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('pants', 'allow_order', true)}
                      className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🛒 เปิดสั่ง
                    </button>
                    <button
                      type="button"
                      disabled={!isEditingMerchConfig}
                      onClick={() => handleBatchToggleCategory('pants', 'allow_order', false)}
                      className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🔒 ปิดสั่ง
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Selector Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(localMerchConfig.products || []).map((prod, idx) => {
                  const isEnabled = prod.enabled !== false;
                  const isAllowOrder = prod.allow_order !== false;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => setSelectedProductIndex(idx)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        selectedProductIndex === idx
                          ? 'bg-rescue-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                      <span className="max-w-[180px] truncate">{prod.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isEnabled ? '👁️ แสดง' : 'ซ่อน'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isAllowOrder ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isAllowOrder ? '🛒 เปิดสั่ง' : '🔒 ปิดสั่ง'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Product Editor */}
              {localMerchConfig.products?.[selectedProductIndex] && (() => {
                const curProd = localMerchConfig.products[selectedProductIndex];
                const isEnabled = curProd.enabled !== false;
                const isAllowOrder = curProd.allow_order !== false;
                const imagesList = Array.isArray(curProd.images) && curProd.images.length > 0
                  ? curProd.images
                  : (curProd.image ? [curProd.image] : []);

                return (
                  <div className="space-y-6 pt-2">
                    
                    {/* DUAL STATUS & CONTROL BANNERS (Visibility + Ordering) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      {/* 1. Visibility Control (เปิด/ปิด แสดงผลหน้าร้าน) */}
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-400">รหัส: {curProd.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                              isEnabled 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {isEnabled ? '✓ กำลังเปิดแสดงหน้าร้าน' : '✕ ปิดการแสดงผล (ซ่อน)'}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span>1. การแสดงผลในร้านค้า (Visibility)</span>
                          </h5>
                          <p className="text-xs text-slate-400 mt-1">
                            {isEnabled 
                              ? 'สินค้านี้ปรากฏอยู่ในหน้าเลือกซื้อ สมาชิกทุกคนสามารถมองเห็นได้' 
                              : 'สินค้านี้ถูกซ่อนจากหน้าร้าน สมาชิกทั่วไปจะไม่เห็นสินค้านี้'}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={!isEditingMerchConfig}
                          onClick={() => handleToggleProductEnabled(selectedProductIndex)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                            !isEditingMerchConfig ? 'opacity-40 cursor-not-allowed ' : 'cursor-pointer active:scale-95 '
                          }${
                            isEnabled
                              ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-emerald-600/30'
                          }`}
                        >
                          {isEnabled ? (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>คลิกเพื่อซ่อนจากหน้าร้าน</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>คลิกเพื่อเปิดแสดงหน้าร้าน</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 2. Order Acceptance Control (เปิด/ปิด รับคำสั่งซื้อ) */}
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">หมวด: {curProd.category === 'shirt' ? 'เสื้อ' : 'กางเกง'}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                              isAllowOrder 
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {isAllowOrder ? '✓ เปิดรับคำสั่งซื้อ' : '🔒 ปิดรับสั่งซื้อชั่วคราว'}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4 text-blue-400" />
                            <span>2. การรับคำสั่งซื้อ (Allow Orders)</span>
                          </h5>
                          <p className="text-xs text-slate-400 mt-1">
                            {isAllowOrder 
                              ? 'สมาชิกสามารถเลือกไซส์ หยิบใส่ตะกร้า และสั่งซื้อได้ตามปกติ' 
                              : 'สมาชิกสามารถดูแบบเสื้อและตารางไซส์ได้ แต่ปุ่มสั่งซื้อจะถูกล็อค'}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={!isEditingMerchConfig}
                          onClick={() => handleToggleProductAllowOrder(selectedProductIndex)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                            !isEditingMerchConfig ? 'opacity-40 cursor-not-allowed ' : 'cursor-pointer active:scale-95 '
                          }${
                            isAllowOrder
                              ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-blue-600/30'
                          }`}
                        >
                          {isAllowOrder ? (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>คลิกเพื่อปิดรับสั่งซื้อชั่วคราว</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>คลิกเพื่อเปิดรับคำสั่งซื้อ</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                    {/* Product Basic Info Editor (Name, Category, Base Price, Description) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-900/70 rounded-2xl border border-slate-800">
                      <div className="md:col-span-6">
                        <label className="text-xs font-bold text-slate-300">ชื่อสินค้า (Product Name):</label>
                        <input
                          type="text"
                          disabled={!isEditingMerchConfig}
                          value={curProd.name || ''}
                          onChange={(e) => handleUpdateProductField(selectedProductIndex, 'name', e.target.value)}
                          placeholder="ระบุชื่อสินค้า..."
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-xs font-bold text-slate-300">หมวดหมู่สินค้า:</label>
                        <select
                          disabled={!isEditingMerchConfig}
                          value={curProd.category || 'shirt'}
                          onChange={(e) => handleUpdateProductField(selectedProductIndex, 'category', e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                        >
                          <option value="shirt">เสื้อ (Shirt / Polo)</option>
                          <option value="pants">กางเกง (Pants / Shorts)</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-xs font-bold text-slate-300">ราคาฐานเริ่มต้น (Base Price):</label>
                        <div className="relative mt-1.5">
                          <input
                            type="number"
                            min={0}
                            disabled={!isEditingMerchConfig}
                            value={curProd.base_price || 0}
                            onChange={(e) => handleUpdateProductBasePrice(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-black text-rescue-400 focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-400">บาท</span>
                        </div>
                      </div>

                      <div className="md:col-span-12">
                        <label className="text-xs font-bold text-slate-300">คำอธิบายรายละเอียดสินค้า (Description):</label>
                        <textarea
                          rows={2}
                          disabled={!isEditingMerchConfig}
                          value={curProd.description || ''}
                          onChange={(e) => handleUpdateProductField(selectedProductIndex, 'description', e.target.value)}
                          placeholder="รายละเอียดเนื้อผ้า คุณสมบัติ และประโยชน์การใช้งาน..."
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* PREVIEW IMAGES GALLERY MANAGER (Add, Upload, Delete, Set Cover) */}
                    <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-rescue-400" />
                            <span>จัดการรูปภาพตัวอย่างสินค้า ({imagesList.length} รูป)</span>
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            สามารถเพิ่มรูปจาก URL หรืออัปโหลดจากเครื่อง ตั้งรูปหน้าปกหลัก และลบรูปที่ไม่ต้องการได้
                          </p>
                        </div>
                      </div>

                      {/* Image Thumbnails Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {imagesList.map((imgUrl, imgIdx) => {
                          const isCover = curProd.image === imgUrl || (!curProd.image && imgIdx === 0);

                          return (
                            <div
                              key={imgIdx}
                              className={`relative group rounded-2xl overflow-hidden border-2 bg-slate-950 transition-all ${
                                isCover ? 'border-rescue-500 ring-2 ring-rescue-500/20' : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="aspect-square w-full overflow-hidden bg-slate-950">
                                <img
                                  src={imgUrl}
                                  alt={`Product ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>

                              {/* Badges & Actions Overlay */}
                              {isCover && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-rescue-600/90 text-white text-[10px] font-black rounded-md flex items-center gap-1 shadow">
                                  <Star className="w-3 h-3 fill-white" />
                                  <span>รูปหน้าปก</span>
                                </div>
                              )}

                                <div className="p-2 bg-slate-900 border-t border-slate-800 space-y-1.5">
                                {!isCover && (
                                  <button
                                    type="button"
                                    disabled={!isEditingMerchConfig}
                                    onClick={() => handleSetCoverProductImage(selectedProductIndex, imgUrl)}
                                    className="w-full py-1 text-[11px] font-bold bg-slate-800 hover:bg-rescue-600/20 hover:text-rescue-400 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Star className="w-3 h-3" />
                                    <span>ตั้งเป็นหน้าปก</span>
                                  </button>
                                )}

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewProductImageModal(imgUrl)}
                                    className="flex-1 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="ดูรูปขยาย"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>ดูรูป</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!isEditingMerchConfig}
                                    onClick={() => handleRemoveProductImage(selectedProductIndex, imgIdx)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="ลบรูปนี้"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Image Inputs: URL & File Upload */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80">
                        {/* Add from URL */}
                        <div className="sm:col-span-7 flex gap-2">
                          <input
                            type="url"
                            disabled={!isEditingMerchConfig}
                            value={newProductImageUrl}
                            onChange={(e) => setNewProductImageUrl(e.target.value)}
                            placeholder="วางลิงก์ URL รูปภาพ เช่น https://..."
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                          />
                          <button
                            type="button"
                            disabled={!isEditingMerchConfig}
                            onClick={() => handleAddProductImageUrl(selectedProductIndex)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            + เพิ่มจาก URL
                          </button>
                        </div>

                        {/* Upload from Device */}
                        <div className="sm:col-span-5">
                          <input
                            type="file"
                            id="upload-product-img-input"
                            accept="image/*,.heic,.heif"
                            disabled={!isEditingMerchConfig || isUploadingProductImg}
                            onChange={(e) => handleUploadProductImageFile(e, selectedProductIndex)}
                            className="hidden"
                          />
                          <label
                            htmlFor={isEditingMerchConfig ? "upload-product-img-input" : undefined}
                            className={`w-full py-1.5 px-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                              !isEditingMerchConfig || isUploadingProductImg ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
                            }`}
                          >
                            {isUploadingProductImg ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>กำลังอัปโหลด...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>📁 อัปโหลดรูปจากเครื่อง</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* SIZES TABLE & SURCHARGES */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">
                          รายการขนาดไซส์ และราคาบวกเพิ่มสำหรับไซต์พิเศษ:
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {curProd.sizes?.length || 0} ไซส์ที่เปิดรับ
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <th className="p-2.5 font-bold">ชื่อไซส์</th>
                              <th className="p-2.5 font-bold">{curProd.category === 'shirt' ? 'รอบอก / ความยาว' : 'รอบเอว / ความยาว'}</th>
                              <th className="p-2.5 font-bold">ราคาบวกพิเศษ (+บาท)</th>
                              <th className="p-2.5 font-bold">ราคาสุทธิของไซส์นี้</th>
                              <th className="p-2.5 font-bold text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {curProd.sizes?.map((sz, szIdx) => {
                              const sizeTotal = (curProd.base_price || 0) + (sz.extra_price || 0);

                              return (
                                <tr key={szIdx} className="hover:bg-slate-900/50">
                                  <td className="p-2.5 font-black text-white">{sz.name}</td>
                                  <td className="p-2.5 text-slate-300">
                                    {curProd.category === 'shirt'
                                      ? `${sz.chest || '-'} • ${sz.length || '-'}`
                                      : `${sz.waist || '-'} • ${sz.length || '-'}`}
                                  </td>
                                  <td className="p-2.5">
                                    <div className="flex items-center gap-1.5 w-28">
                                      <span className="text-amber-400 font-bold">+</span>
                                      <input
                                        type="number"
                                        min={0}
                                        disabled={!isEditingMerchConfig}
                                        value={sz.extra_price || 0}
                                        onChange={(e) => handleUpdateSizeExtraPrice(szIdx, e.target.value)}
                                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:bg-slate-950"
                                      />
                                      <span className="text-slate-400 text-[10px]">บ.</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 font-black text-rescue-400">
                                    {sizeTotal} บาท
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      type="button"
                                      disabled={!isEditingMerchConfig}
                                      onClick={() => handleRemoveSizeFromProduct(szIdx)}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="ลบไซส์นี้"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ADD NEW SIZE FORM */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 shrink-0">
                          + เพิ่มไซส์ใหม่:
                        </span>
                        
                        <input
                          type="text"
                          disabled={!isEditingMerchConfig}
                          value={newSizeName}
                          onChange={(e) => setNewSizeName(e.target.value)}
                          placeholder="ชื่อไซส์ (เช่น 6XL)"
                          className="w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                        />

                        <input
                          type="text"
                          disabled={!isEditingMerchConfig}
                          value={newSizeMeasurement}
                          onChange={(e) => setNewSizeMeasurement(e.target.value)}
                          placeholder={curProd.category === 'shirt' ? 'รอบอก เช่น 56 นิ้ว' : 'รอบเอว เช่น 50-52 นิ้ว'}
                          className="flex-1 min-w-[150px] px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rescue-500 disabled:opacity-50 disabled:bg-slate-900"
                        />

                        <div className="flex items-center gap-1 w-28">
                          <span className="text-amber-400 text-xs font-bold">+</span>
                          <input
                            type="number"
                            min={0}
                            disabled={!isEditingMerchConfig}
                            value={newSizeExtra}
                            onChange={(e) => setNewSizeExtra(e.target.value)}
                            placeholder="บวกเพิ่ม บ."
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:bg-slate-900"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={!isEditingMerchConfig}
                          onClick={handleAddSizeToProduct}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          + เพิ่มไซส์
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Bottom Safeguard Controls */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rescue-500"></span>
                <span>
                  {isEditingMerchConfig 
                    ? '⚠️ ข้อมูลสินค้ากำลังอยู่ในโหมดแก้ไข โปรดตรวจสอบความถูกต้องก่อนกดบันทึก' 
                    : '🔒 ข้อมูลสินค้าถูกล็อกอยู่ในโหมดอ่านอย่างเดียว คลิก "ปลดล็อกเพื่อแก้ไข" เมื่อต้องการปรับเปลี่ยน'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {!isEditingMerchConfig ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingMerchConfig(true)}
                    className="px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>ปลดล็อกเพื่อแก้ไขสินค้าและขนาดไซต์</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelMerchConfig}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                      <span>ยกเลิก (คืนค่าเดิม)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMerchandiseConfig}
                      disabled={isSavingMerch}
                      className="px-6 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl shadow-rescue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingMerch ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าทั้งหมด (Save Changes)'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 6: SPEAKERS, ADVISORS & PRESIDENTS MANAGEMENT */}
      {activeTab === 'speakers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                {speakerCategoryFilter === 'president' ? (
                  <Crown className="w-4 h-4 text-amber-400" />
                ) : speakerCategoryFilter === 'advisor' ? (
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Award className="w-4 h-4 text-orange-400" />
                )}
                <span>
                  {speakerCategoryFilter === 'president' 
                    ? 'Ceremony President & Guest of Honor' 
                    : speakerCategoryFilter === 'advisor' 
                    ? 'Project Advisors & Mentors' 
                    : speakerCategoryFilter === 'speaker'
                    ? 'Keynote Instructors & Trainers'
                    : 'JRE 2027 Dignitaries & Instructors'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {speakerCategoryFilter === 'president' 
                  ? `👑 ข้อมูลประธานในพิธี (${speakerStats.presidents} ท่าน)`
                  : speakerCategoryFilter === 'advisor' 
                  ? `👔 ข้อมูลคณะที่ปรึกษาโครงการ (${speakerStats.advisors} ท่าน)`
                  : speakerCategoryFilter === 'speaker'
                  ? `🎖️ ข้อมูลวิทยากรประจำโครงการ (${speakerStats.speakersCount} ท่าน)`
                  : `ประธาน, ที่ปรึกษา และวิทยากรประจำโครงการ (${localSpeakers.length} ท่าน)`}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                จัดการแยกหมวดหมู่เพื่อความถูกต้องตามระเบียบพิธีการและการแสดงผลบนเว็บไซต์ (เพิ่ม ลบ แก้ไข ย้ายบทบาท และจัดลำดับ)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleLoadOfficialDignitaries}
                title="โหลดรายชื่อประธาน ที่ปรึกษา และวิทยากรตามกำหนดการจริง JRE 2027"
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>โหลดรายชื่อทางการ JRE 2027</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddSpeaker(speakerCategoryFilter !== 'all' ? speakerCategoryFilter : 'speaker')}
                className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                  speakerCategoryFilter === 'president'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                    : speakerCategoryFilter === 'advisor'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-indigo-500/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {speakerCategoryFilter === 'president'
                    ? 'เพิ่มประธานในพิธี'
                    : speakerCategoryFilter === 'advisor'
                    ? 'เพิ่มที่ปรึกษาโครงการ'
                    : speakerCategoryFilter === 'speaker'
                    ? 'เพิ่มวิทยากรประจำโครงการ'
                    : 'เพิ่มบุคคลใหม่'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllSpeakers}
                disabled={isSavingSpeakers}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSpeakers ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด (Save)'}</span>
              </button>
            </div>
          </div>

          {/* Subtabs / Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSpeakerCategoryFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                speakerCategoryFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🌟 แสดงทั้งหมด ({localSpeakers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSpeakerCategoryFilter('president')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                speakerCategoryFilter === 'president'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>👑 ประธานในพิธี ({speakerStats.presidents})</span>
            </button>

            <button
              type="button"
              onClick={() => setSpeakerCategoryFilter('advisor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                speakerCategoryFilter === 'advisor'
                  ? 'bg-indigo-600 text-white shadow-md font-black shadow-indigo-600/20'
                  : 'text-indigo-400/90 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>👔 ที่ปรึกษาโครงการ ({speakerStats.advisors})</span>
            </button>

            <button
              type="button"
              onClick={() => setSpeakerCategoryFilter('speaker')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                speakerCategoryFilter === 'speaker'
                  ? 'bg-emergency-600 text-white shadow-md font-black shadow-emergency-600/20'
                  : 'text-emergency-400/90 hover:text-emergency-300 hover:bg-emergency-500/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>🎖️ วิทยากรประจำโครงการ ({speakerStats.speakersCount})</span>
            </button>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
            <span className="text-base">💡</span>
            <span>
              <strong>คำแนะนำ:</strong> สามารถกดปุ่ม <span className="underline font-bold">⬆️ เลื่อนขึ้น</span> / <span className="underline font-bold">⬇️ เลื่อนลง</span> เพื่อสลับลำดับ หรือใช้ดรอปดาวน์ <span className="underline font-bold">"บทบาท"</span> บนการ์ดเพื่อย้ายหมวดหมู่ระหว่างประธาน, ที่ปรึกษา และวิทยากรได้ทันที
            </span>
          </div>

          {/* Render Cards Grid */}
          {(() => {
            const filteredList = speakerCategoryFilter === 'all'
              ? localSpeakers
              : localSpeakers.filter(s => getSpeakerCategory(s) === speakerCategoryFilter);

            if (filteredList.length === 0) {
              return (
                <div className="text-center py-12 px-4 bg-slate-950/60 rounded-3xl border border-slate-800/80 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    {speakerCategoryFilter === 'president' ? (
                      <Crown className="w-6 h-6 text-amber-500/50" />
                    ) : speakerCategoryFilter === 'advisor' ? (
                      <ShieldCheck className="w-6 h-6 text-indigo-500/50" />
                    ) : (
                      <Award className="w-6 h-6 text-orange-500/50" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">
                    ยังไม่มีรายชื่อในหมวดหมู่ {speakerCategoryFilter === 'president' ? 'ประธานในพิธี' : speakerCategoryFilter === 'advisor' ? 'คณะที่ปรึกษา' : 'วิทยากร'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    คลิกปุ่มด้านล่างเพื่อเพิ่มรายชื่อบุคคลในหมวดนี้ หรือโหลดรายชื่อทางการของโครงการ JRE 2027
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenAddSpeaker(speakerCategoryFilter !== 'all' ? speakerCategoryFilter : 'speaker')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      + เพิ่มรายชื่อในหมวดนี้
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadOfficialDignitaries}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      ✨ โหลดรายชื่อทางการ
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredList.map((spk, idx) => {
                  const cat = getSpeakerCategory(spk);
                  const displayNum = spk.num || idx + 1;
                  const isPresident = cat === 'president';
                  const isAdvisor = cat === 'advisor';

                  return (
                    <div
                      key={spk.id || idx}
                      className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between transition-all group relative ${
                        isPresident 
                          ? 'border-amber-500/40 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10'
                          : isAdvisor
                          ? 'border-indigo-500/40 hover:border-indigo-400/70 hover:shadow-lg hover:shadow-indigo-500/10'
                          : 'border-slate-800 hover:border-emergency-500/40 hover:shadow-lg hover:shadow-emergency-500/10'
                      }`}
                    >
                      <div>
                        {/* Header: Badge & Reorder */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shadow ${
                              isPresident
                                ? 'bg-amber-500 text-slate-950'
                                : isAdvisor
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emergency-600 text-white'
                            }`}>
                              {isPresident ? '👑' : displayNum}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              isPresident
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : isAdvisor
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-emergency-500/20 text-emergency-300 border-emergency-500/40'
                            }`}>
                              {isPresident ? 'ประธานในพิธี' : isAdvisor ? 'ที่ปรึกษาโครงการ' : `วิทยากรลำดับที่ ${displayNum}`}
                            </span>
                          </div>

                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleMoveSpeakerUp(spk.id)}
                              disabled={idx === 0}
                              title="เลื่อนขึ้น"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSpeakerDown(spk.id)}
                              disabled={idx === filteredList.length - 1}
                              title="เลื่อนลง"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Role Switcher */}
                        <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 mb-3.5">
                          <span className="text-[10px] text-slate-400 font-bold pl-1.5">บทบาท:</span>
                          <select
                            value={cat}
                            onChange={(e) => handleChangeSpeakerCategory(spk.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-[11px] text-white rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="president">👑 ประธานในพิธี</option>
                            <option value="advisor">👔 ที่ปรึกษาโครงการ</option>
                            <option value="speaker">🎖️ วิทยากรประจำโครงการ</option>
                          </select>
                        </div>

                        {/* Photo & Basic Info */}
                        <div className="flex items-start gap-3.5 mb-3.5">
                          <div className="relative shrink-0">
                            <img
                              src={spk.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(spk.name)}`}
                              alt={spk.name}
                              className={`w-16 h-16 rounded-xl object-cover border bg-slate-900 ${
                                isPresident
                                  ? 'border-amber-500/50'
                                  : isAdvisor
                                  ? 'border-indigo-500/50'
                                  : 'border-slate-700'
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(spk.name)}`;
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white text-sm leading-tight group-hover:text-amber-300 transition-colors">
                              {spk.name}
                            </h4>
                            <p className="text-[11px] text-slate-300 font-medium mt-1 line-clamp-2">
                              {spk.title}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs pt-3 border-t border-slate-900">
                          <div>
                            <span className="text-[10px] text-slate-500 block">สังกัด / หน่วยงาน:</span>
                            <span className="text-slate-300 font-medium text-[11px]">{spk.org || '-'}</span>
                          </div>
                          <div className={`p-2.5 rounded-xl border mt-2 ${
                            isPresident
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : isAdvisor
                              ? 'bg-indigo-500/10 border-indigo-500/20'
                              : 'bg-slate-900/80 border-slate-800/80'
                          }`}>
                            <span className={`text-[10px] font-bold block mb-0.5 ${
                              isPresident
                                ? 'text-amber-400'
                                : isAdvisor
                                ? 'text-indigo-400'
                                : 'text-orange-400'
                            }`}>
                              {isPresident ? 'บทบาทในพิธีการ:' : isAdvisor ? 'บทบาท / ด้านที่ปรึกษา:' : 'หัวข้อฝึกอบรม:'}
                            </span>
                            <span className="text-slate-300 text-[11px] line-clamp-2">{spk.topic || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions: Edit & Delete */}
                      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSpeaker(spk)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpeaker(spk.id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 7: TEAM & COMMITTEE MANAGEMENT */}
      {activeTab === 'team' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" />
                Organizing Committee & Staff
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                คณะดำเนินงาน & ทีมงานผู้ดำเนินการฝึกอบรม ({localTeam.length} ท่าน)
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                แก้ไข เพิ่ม ลบ จัดลำดับโครงสร้างทีม ปรับเปลี่ยนมหาวิทยาลัย (มมส, มข, หรือ ม.อื่นๆ ได้ตามต้องการ) และจัดการรูปภาพ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddTeamMember}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มคณะทำงาน</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllTeam}
                disabled={isSavingTeam}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingTeam ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด (Save)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Filter by University */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300">กรองตามสังกัด/มหาวิทยาลัย:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTeamFilterUni('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  teamFilterUni === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({localTeam.length})
              </button>
              {Array.from(new Set(localTeam.map(m => m.university || (m.tag?.includes('มมส') ? 'มหาวิทยาลัยมหาสารคาม (มมส)' : m.tag?.includes('มข') ? 'มหาวิทยาลัยขอนแก่น (มข)' : m.institution || 'ทั่วไป')))).map(uni => {
                const count = localTeam.filter(m => (m.university || (m.tag?.includes('มมส') ? 'มหาวิทยาลัยมหาสารคาม (มมส)' : m.tag?.includes('มข') ? 'มหาวิทยาลัยขอนแก่น (มข)' : m.institution || 'ทั่วไป')) === uni).length;
                return (
                  <button
                    key={uni}
                    type="button"
                    onClick={() => setTeamFilterUni(uni)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      teamFilterUni === uni
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {uni.replace(/มหาวิทยาลัย/g, 'ม.').slice(0, 18)} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {localTeam
              .map((member, originalIdx) => ({ member, originalIdx }))
              .filter(({ member }) => {
                if (teamFilterUni === 'all') return true;
                const memberUni = member.university || (member.tag?.includes('มมส') ? 'มหาวิทยาลัยมหาสารคาม (มมส)' : member.tag?.includes('มข') ? 'มหาวิทยาลัยขอนแก่น (มข)' : member.institution || 'ทั่วไป');
                return memberUni === teamFilterUni;
              })
              .map(({ member, originalIdx }) => {
                return (
                  <div
                    key={member.id || originalIdx}
                    className="bg-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Top Bar: Tag & Reorder */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black rounded-full">
                          {member.tag || `ลำดับที่ ${originalIdx + 1}`}
                        </span>

                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveTeamUp(originalIdx)}
                            disabled={originalIdx === 0}
                            title="เลื่อนขึ้น"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTeamDown(originalIdx)}
                            disabled={originalIdx === localTeam.length - 1}
                            title="เลื่อนลง"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Photo & Name */}
                      <div className="text-center mb-3">
                        <img
                          src={member.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.name)}`}
                          alt={member.name}
                          className="w-18 h-18 rounded-2xl object-cover border-2 border-slate-800 group-hover:border-blue-500/50 mx-auto transition-colors shadow-md bg-slate-900"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.name)}`;
                          }}
                        />
                        <h4 className="font-bold text-white text-sm mt-2.5 truncate group-hover:text-blue-300 transition-colors">
                          {member.name}
                        </h4>
                        <p className="text-xs font-semibold text-rescue-400 mt-0.5 line-clamp-1">
                          {member.role}
                        </p>
                      </div>

                      {/* Institution & University */}
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                        <div className="truncate text-slate-300">
                          <span className="text-slate-500 mr-1">สถาบัน:</span>
                          <span className="font-semibold text-white">{member.university || 'มหาวิทยาลัยมหาสารคาม (มมส)'}</span>
                        </div>
                        <div className="truncate text-slate-400">
                          <span className="text-slate-500 mr-1">สังกัด:</span>
                          <span>{member.institution || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTeamMember(member)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-blue-400" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 8: USER ACCOUNTS & AUTHENTICATION MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Authentication & User Accounts Management</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                จัดการบัญชีผู้ใช้งานระบบ ({userAccounts.length} บัญชี)
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                ตรวจสอบรายชื่อผู้ใช้งาน, บทบาท และช่องทางยืนยันตัวตน โดยไม่แสดงหรือส่งออก password hash หรือ salt
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={loadUserAccounts}
                disabled={isLoadingUsers}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="โหลดข้อมูลบัญชีผู้ใช้ใหม่"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-emerald-400' : ''}`} />
                <span>รีเฟรช</span>
              </button>

              <button
                type="button"
                onClick={handleExportUsersExcel}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all active:scale-95 cursor-pointer"
                title="ส่งออกรายชื่อผู้ใช้โดยไม่ส่งออก hash หรือ salt"
              >
                <FileDown className="w-4 h-4 text-emerald-100" />
                <span>ส่งออกรายชื่อผู้ใช้แบบไม่ติด secret (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Academic Criteria & Security Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">ผู้ใช้ทั้งหมดในระบบ</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{userAccounts.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">Total registered accounts</p>
            </div>

            <div className="p-4 bg-slate-950 border border-emerald-900/40 rounded-2xl">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-bold">Credential status (redacted)</span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300">
                {userAccounts.filter(u => u.provider === 'email' || u.provider === 'both').length}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">🔒 มี credential แต่ไม่แสดงค่า secret</p>
            </div>

            <div className="p-4 bg-slate-950 border border-indigo-900/40 rounded-2xl">
              <div className="flex items-center justify-between text-indigo-400 mb-2">
                <span className="text-xs font-bold">Google OAuth Users</span>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-300">
                {userAccounts.filter(u => u.provider === 'google' || u.provider === 'both').length}
              </div>
              <p className="text-[11px] text-indigo-400/80 mt-1">🌐 Dual-Bypass Authentication</p>
            </div>

            <div className="p-4 bg-slate-950 border border-purple-900/40 rounded-2xl">
              <div className="flex items-center justify-between text-purple-400 mb-2">
                <span className="text-xs font-bold">บัญชีพร้อมใช้งาน / ยืนยันแล้ว</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300">
                {userAccounts.filter(u => Boolean(u.email_verified || u.verified || u.provider === 'google' || u.provider === 'both' || (typeof u.id === 'string' && u.id.startsWith('google_')))).length}
              </div>
              <p className="text-[11px] text-purple-400/80 mt-1">✓ Google OAuth & บัญชีรหัสผ่านพร้อมใช้งาน</p>
            </div>
          </div>

          {/* Search & Provider Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือ User ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0 font-semibold">ผู้ให้บริการ:</span>
              <select
                value={userProviderFilter}
                onChange={e => setUserProviderFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="all">ทั้งหมด (All Providers)</option>
                <option value="email">Email & Password (redacted)</option>
                <option value="google">Google OAuth</option>
                <option value="both">Both (Google + Password)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 scrollbar-none">
            <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">ผู้ใช้งาน (User Info)</th>
                  <th className="py-3 px-4">เบอร์โทรศัพท์ (Phone)</th>
                  <th className="py-3 px-4">อีเมล & สถานะ (Email)</th>
                  <th className="py-3 px-4">สถาบัน / สังกัด & สถานะสมัคร</th>
                  <th className="py-3 px-4">ช่องทางยืนยันตัวตน</th>
                  <th className="py-3 px-4">Credential status (ไม่แสดง hash/salt)</th>
                  <th className="py-3 px-4">บทบาท (Role)</th>
                  <th className="py-3 px-4">วันที่สมัคร</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {userAccounts
                  .filter(u => {
                    if (userProviderFilter !== 'all') {
                      if (userProviderFilter === 'email' && u.provider !== 'email') return false;
                      if (userProviderFilter === 'google' && u.provider !== 'google') return false;
                      if (userProviderFilter === 'both' && u.provider !== 'both') return false;
                    }
                    if (userSearchQuery.trim()) {
                      const q = userSearchQuery.toLowerCase();
                      const matchName = (u.name || '').toLowerCase().includes(q);
                      const matchEmail = (u.email || '').toLowerCase().includes(q);
                      const matchId = (u.id || '').toLowerCase().includes(q);
                      const matchPhone = (u.phone || '').toLowerCase().includes(q);
                      const matchStudentId = (u.student_id || '').toLowerCase().includes(q);
                      const matchAffiliation = (u.affiliation || '').toLowerCase().includes(q);
                      return matchName || matchEmail || matchId || matchPhone || matchStudentId || matchAffiliation;
                    }
                    return true;
                  })
                  .map((acc, index) => {
                    const hasPassword = acc.provider === 'email' || acc.provider === 'both';
                    const details = resolveUserExtraDetails(acc, registrations);
                    const displayPhone = details.formattedPhone || acc.phone || '';
                    const displayStudentId = details.studentId || acc.student_id || '';
                    const displayAffiliation = details.affiliation || acc.affiliation || '';

                    return (
                      <tr key={acc.id || acc.email || index} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">
                          {index + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={acc.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acc.email || 'user')}`}
                              alt="Avatar"
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{acc.name || 'ไม่ระบุชื่อ'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded font-bold tracking-wide">
                                  UID: {acc.id || '-'}
                                </span>
                                {displayStudentId && (
                                  <span className="font-mono text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded font-bold tracking-wide flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                                    <span>{displayStudentId}</span>
                                  </span>
                                )}
                                {details.callsign && (
                                  <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold tracking-wide">
                                    {details.callsign}
                                  </span>
                                )}
                                {acc.id && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const profileUrl = `${window.location.origin}/users/${acc.id}`;
                                        navigator.clipboard.writeText(profileUrl);
                                        triggerToast(`คัดลอก URL หน้าโปรไฟล์สำเร็จ!\n${profileUrl}`, 'success');
                                      }}
                                      className="p-1 hover:bg-slate-700/60 text-slate-400 hover:text-cyan-300 rounded transition-colors cursor-pointer"
                                      title="คัดลอก URL โปรไฟล์ (https://jre-2027.vercel.app/users/...)"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <a
                                      href={`/users/${acc.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-slate-700/60 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                                      title="เปิดดูหน้าโปรไฟล์และดิจิทัลไอดีผู้ใช้"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </>
                                )}
                              </div>

                              {/* Prominent View Full Details Modal Button (No Horizontal Scroll Needed) */}
                              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserDetail(acc)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-purple-950/40 transition-all active:scale-95 cursor-pointer border border-purple-400/40"
                                  title="เปิดดูข้อมูลเพิ่มเติมแบบละเอียดครบทุกมิติ (ไม่ต้องเลื่อนซ้ายขวา)"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>ดูข้อมูลเพิ่มเติมแบบละเอียด</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phone Column */}
                        <td className="py-3.5 px-4">
                          {displayPhone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-300 font-bold text-xs bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{displayPhone}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const raw = details.phone || acc.phone || displayPhone;
                                  navigator.clipboard.writeText(raw);
                                  triggerToast(`คัดลอกเบอร์โทร ${raw} สำเร็จ!`, 'success');
                                }}
                                className="p-1 hover:bg-slate-700/60 text-slate-400 hover:text-emerald-300 rounded transition-colors cursor-pointer"
                                title="คัดลอกเบอร์โทรศัพท์"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-200 font-medium">
                            {acc.email}
                          </div>
                          <div className="mt-1">
                            {acc.provider === 'both' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>✓ ยืนยันแล้ว (Google + รหัสผ่าน)</span>
                              </span>
                            ) : (acc.provider === 'google' || (typeof acc.id === 'string' && acc.id.startsWith('google_')) || (acc.email && acc.email.toLowerCase().endsWith('@gmail.com'))) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-full text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-sky-400" />
                                <span>✓ ยืนยันด้วยการเข้าสู่ระบบด้วย Google</span>
                              </span>
                            ) : (acc.email_verified || acc.verified) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>✓ ลงทะเบียนด้วยรหัสผ่านแล้ว</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>รอยืนยันบัญชี</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Affiliation & Registration Column */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200 text-[11px] max-w-[210px] truncate" title={displayAffiliation || '-'}>
                            {displayAffiliation || '-'}
                          </div>
                          <div className="mt-1 flex items-center gap-1 flex-wrap">
                            {details.isRegistered ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded text-[9px] font-bold">
                                  ✓ สมัครโครงการแล้ว
                                </span>
                                {details.paymentStatus === 'verified' ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
                                    ชำระแล้ว
                                  </span>
                                ) : details.paymentStatus === 'pending' ? (
                                  <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold">
                                    รอตรวจสลิป
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[9px]">
                                    ยังไม่ชำระ
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 border border-slate-700/60 rounded text-[9px]">
                                ยังไม่ส่งใบสมัครโครงการ
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {acc.provider === 'both' ? (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                              🌐 Google + 🔑 รหัสผ่าน
                            </span>
                          ) : acc.provider === 'email' ? (
                            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                              🔑 Email & Password
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                              🌐 Google OAuth
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {hasPassword ? (
                            <div className="p-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-300 max-w-[220px]">
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                <Lock className="w-3 h-3" />
                                <span>มี credential · ค่าไม่แสดง</span>
                              </div>
                              <div className="text-[9px] text-slate-500">Hash/salt ไม่ถูก render หรือ export</div>
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-xl text-[10px] text-slate-500 max-w-[200px]">
                              <span>Google OAuth Token (Managed by Google)</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            acc.role === 'admin' 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {acc.role || 'user'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {acc.created_at ? new Date(acc.created_at).toLocaleDateString('th-TH') : '-'}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedUserDetail(acc)}
                              className="p-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-purple-500/40"
                              title="ดูข้อมูลเพิ่มเติมแบบละเอียดครบทุกมิติ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {acc.id && (
                              <a
                                href={`/users/${acc.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                                title={`เปิดดูหน้าโปรไฟล์สาธารณะ & ดิจิทัลไอดี (/users/${acc.id})`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserAccount(acc);
                                setEditUserName(acc.name || '');
                                setEditUserEmail(acc.email || '');
                                setEditUserPhone(acc.phone || details.phone || '');
                                setEditUserStudentId(acc.student_id || details.studentId || '');
                                setEditUserAffiliation(acc.affiliation || details.affiliation || '');
                                setEditUserRole(acc.role || 'user');
                                setEditUserVerified(Boolean(acc.email_verified || acc.verified || acc.provider === 'google' || acc.provider === 'both' || (typeof acc.id === 'string' && acc.id.startsWith('google_'))));
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลผู้ใช้ (Update)"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setResetPassUser(acc);
                                setAdminNewPassword('');
                              }}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors cursor-pointer"
                              title="รีเซ็ตรหัสผ่าน (ค่า credential จะไม่แสดง)"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingUserAccount(acc)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="ลบบัญชีผู้ใช้ (Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CATERING & HEALTH HUB (DEDICATED FULL-PAGE VIEW WITH INDEPENDENT URL /admin/catering) */}
      {activeTab === 'catering' && (
        <CateringHealthView
          registrations={registrations}
          onSelectApplicant={(reg) => handleOpenProfileModal(reg, 'info')}
          onRefresh={onRefreshRegistrations}
        />
      )}

      {/* FULL USER DETAILS & REGISTRATION MODAL (POPUP DIALOG - NO HORIZONTAL SCROLL REQUIRED) */}
      {selectedUserDetail && (
        <ModalPortal isOpen={Boolean(selectedUserDetail)} onClose={() => setSelectedUserDetail(null)}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedUserDetail(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-700 max-w-3xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto text-left"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>

              {(() => {
                const acc = selectedUserDetail;
                const details = resolveUserExtraDetails(acc, registrations);
                const reg = selectedUserDetailReg || details.reg;
                const displayPhone = details.formattedPhone || acc.phone || (reg && reg.phone) || '';
                const displayStudentId = details.studentId || acc.student_id || (reg && reg.student_id) || '';
                const displayAffiliation = details.affiliation || acc.affiliation || (reg && reg.institution) || '';
                const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/users/${acc.id}` : `/users/${acc.id}`;
                const hasPassword = acc.provider === 'email' || acc.provider === 'both';
                
                // Matched orders
                const userOrders = merchandiseOrders.filter(o => 
                  (acc.email && o.user_email && o.user_email.toLowerCase().trim() === acc.email.toLowerCase().trim()) ||
                  (acc.id && (o.user_id === acc.id || o.id === acc.id))
                );

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-slate-800 pb-5">
                      <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>ข้อมูลผู้ใช้งานแบบละเอียด · JRE 2027 Admin Console</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img
                          src={acc.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acc.email || 'user')}`}
                          alt="Avatar"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-black text-white">
                              {acc.name || 'ไม่ระบุชื่อ'}
                            </h3>
                            {reg?.nickname && (
                              <span className="text-sm font-bold text-orange-300 bg-orange-950/60 border border-orange-500/30 px-2.5 py-0.5 rounded-lg">
                                ({reg.nickname})
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              acc.role === 'admin' 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            }`}>
                              {acc.role || 'user'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="font-mono text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md font-bold">
                              UID: {acc.id || '-'}
                            </span>
                            {details.callsign && (
                              <span className="text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                                {details.callsign}
                              </span>
                            )}
                            {displayStudentId && (
                              <span className="font-mono text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{displayStudentId}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Buttons Toolbar */}
                      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(acc.id);
                            triggerToast(`คัดลอก UID: ${acc.id} สำเร็จ!`, 'success');
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>คัดลอก UID</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(profileUrl);
                            triggerToast(`คัดลอก URL หน้าโปรไฟล์:\n${profileUrl}`, 'success');
                          }}
                          className="px-2.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>คัดลอก URL โปรไฟล์</span>
                        </button>

                        <a
                          href={`/users/${acc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                          <span>เปิดดูหน้าโปรไฟล์สาธารณะ</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const target = acc;
                            setSelectedUserDetail(null);
                            setEditingUserAccount(target);
                            setEditUserName(target.name || '');
                            setEditUserEmail(target.email || '');
                            setEditUserPhone(target.phone || details.phone || '');
                            setEditUserStudentId(target.student_id || details.studentId || '');
                            setEditUserAffiliation(target.affiliation || details.affiliation || '');
                            setEditUserRole(target.role || 'user');
                            setEditUserVerified(Boolean(target.email_verified || target.verified || target.provider === 'google' || target.provider === 'both' || (typeof target.id === 'string' && target.id.startsWith('google_'))));
                          }}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          <span>แก้ไขข้อมูลผู้ใช้</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const target = acc;
                            setSelectedUserDetail(null);
                            setResetPassUser(target);
                            setAdminNewPassword('');
                          }}
                          className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>รีเซ็ตรหัสผ่าน</span>
                        </button>

                        {reg && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserDetail(null);
                              handleTabChange('applicants');
                              setSearchQuery(acc.email || acc.name || '');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ไปยังตารางผู้สมัคร</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Section 1: Contact & Affiliation Details */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>ข้อมูลติดต่อ & ข้อมูลสถานศึกษา/สังกัด</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-slate-400 font-semibold">อีเมลติดต่อ:</span>
                          <div className="font-mono text-white font-medium break-all flex items-center justify-between gap-2">
                            <span>{acc.email}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(acc.email);
                                triggerToast(`คัดลอกอีเมล ${acc.email} สำเร็จ!`, 'success');
                              }}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
                              title="คัดลอกอีเมล"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-slate-400 font-semibold">เบอร์โทรศัพท์:</span>
                          <div className="font-mono text-white font-medium flex items-center justify-between gap-2">
                            {displayPhone ? (
                              <>
                                <a href={`tel:${displayPhone.replace(/\D/g, '')}`} className="text-emerald-400 hover:underline font-bold">
                                  {displayPhone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const raw = displayPhone.replace(/\D/g, '');
                                    navigator.clipboard.writeText(raw);
                                    triggerToast(`คัดลอกเบอร์โทร ${raw} สำเร็จ!`, 'success');
                                  }}
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded cursor-pointer"
                                  title="คัดลอกเบอร์โทรศัพท์"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-slate-400 font-semibold">รหัสนิสิต (Student ID):</span>
                          <div className="font-mono text-white font-medium flex items-center justify-between gap-2">
                            {displayStudentId ? (
                              <>
                                <span className="text-emerald-300 font-bold">{displayStudentId}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(displayStudentId);
                                    triggerToast(`คัดลอกรหัสนิสิต ${displayStudentId} สำเร็จ!`, 'success');
                                  }}
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded cursor-pointer"
                                  title="คัดลอกรหัสนิสิต"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-slate-400 font-semibold">สังกัด / คณะ / หน่วยงาน:</span>
                          <div className="text-white font-medium">
                            {displayAffiliation || '-'}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-slate-400 font-semibold">วันที่สร้างบัญชี (Registered On):</span>
                          <div className="text-slate-200">
                            {acc.created_at ? new Date(acc.created_at).toLocaleString('th-TH') : '-'}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-slate-400 font-semibold">เข้าสู่ระบบล่าสุด (Last Active):</span>
                          <div className="text-slate-200">
                            {acc.last_login_at ? new Date(acc.last_login_at).toLocaleString('th-TH') : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Registration & Payment Status */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                          <CreditCard className="w-4 h-4 text-purple-400" />
                          <span>สถานะการสมัครเข้าร่วมโครงการ JRE 2027 & การชำระเงิน</span>
                        </div>
                        {reg && (
                          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                            ✓ สมัครโครงการแล้ว
                          </span>
                        )}
                      </div>

                      {isLoadingUserDetailReg ? (
                        <div className="py-6 text-center space-y-2">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
                          <p className="text-xs text-slate-400">กำลังตรวจสอบข้อมูลใบสมัครในฐานข้อมูล...</p>
                        </div>
                      ) : reg ? (
                        <div className="space-y-4">
                          {/* Trainee Details Bar */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-slate-400 text-[10px] block">กลุ่มที่จัดไว้</span>
                              <span className="font-bold text-white text-sm">{reg.assigned_group || 'ยังไม่จัดกลุ่ม'}</span>
                            </div>
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-slate-400 text-[10px] block">ห้องพัก</span>
                              <span className="font-bold text-white text-sm">{reg.assigned_room || 'ยังไม่จัดห้อง'}</span>
                            </div>
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-slate-400 text-[10px] block">ไซส์เสื้อ</span>
                              <span className="font-bold text-purple-300 text-sm">{reg.shirt_size || '-'}</span>
                            </div>
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-slate-400 text-[10px] block">กรุ๊ปเลือด</span>
                              <span className="font-bold text-rose-300 text-sm">{reg.blood_group || '-'}</span>
                            </div>
                          </div>

                          {/* Emergency & Health Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                              <span className="text-slate-400 text-[10px] block font-semibold">ผู้ติดต่อฉุกเฉิน:</span>
                              <span className="font-medium text-white">{reg.emergency_contact || '-'}</span>
                              {reg.emergency_phone && (
                                <span className="font-mono text-emerald-400 block mt-0.5">{reg.emergency_phone}</span>
                              )}
                            </div>
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                              <span className="text-slate-400 text-[10px] block font-semibold">โรคประจำตัว & แพ้อาหาร/ยา:</span>
                              <div className="text-xs space-y-0.5">
                                {hasMedicalCondition(reg) ? (
                                  <span className="text-rose-300 font-bold block">🩺 โรคประจำตัว: {getApplicantMedical(reg)}</span>
                                ) : (
                                  <span className="text-slate-400 block">🩺 ไม่มีโรคประจำตัว</span>
                                )}
                                {hasFoodOrDrugAllergy(reg) ? (
                                  <span className="text-amber-300 font-bold block">🍽️ แพ้อาหาร/ยา: {getApplicantAllergy(reg)}</span>
                                ) : (
                                  <span className="text-slate-400 block">🍽️ ไม่มีประวัติแพ้อาหาร/ยา</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Payment Plan & Installments */}
                          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                              <div>
                                <span className="text-xs text-slate-400">แผนการชำระเงินที่เลือก:</span>
                                <div className="text-sm font-black text-white">
                                  {reg.payment_plan === 'installment' ? '⚡ แผนแบ่งจ่าย 2 งวด' : '💎 ชำระครบเต็มจำนวน (Full Payment)'}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400">สถานะรวม:</span>
                                <div>
                                  {reg.payment_status === 'paid' || reg.payment_status === 'verified' ? (
                                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                                      ชำระครบแล้ว
                                    </span>
                                  ) : reg.payment_status === 'partial_paid' ? (
                                    <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full text-xs font-bold">
                                      ชำระงวดที่ 1 แล้ว (ค้างงวดที่ 2)
                                    </span>
                                  ) : reg.payment_status === 'pending_review' ? (
                                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold">
                                      รอตรวจสลิป
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold">
                                      ยังไม่ชำระ
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Round 1 and Round 2 Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {/* Round 1 */}
                              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">งวดที่ 1 (มัดจำเสื้อ)</span>
                                  <span className="text-xs font-black text-purple-300">400 บ.</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">สถานะ:</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    reg.installment_1_status === 'paid' || reg.payment_status === 'paid' || reg.payment_status === 'partial_paid'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : reg.installment_1_status === 'pending_review'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {reg.installment_1_status === 'paid' || reg.payment_status === 'paid' || reg.payment_status === 'partial_paid'
                                      ? 'ชำระแล้ว'
                                      : reg.installment_1_status === 'pending_review'
                                      ? 'รอตรวจสอบ'
                                      : 'ค้างชำระ'}
                                  </span>
                                </div>
                                {(reg.installment_1_slip_url || reg.payment_slip_url) && (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewSlipUrl(reg.installment_1_slip_url || reg.payment_slip_url)}
                                      className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                                      <span>ดูสลิปงวดที่ 1</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Round 2 */}
                              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">งวดที่ 2 (ส่วนที่เหลือ)</span>
                                  <span className="text-xs font-black text-purple-300">
                                    {displayStudentId ? '250 บ. (มมส)' : '450 บ. (บุคคลภายนอก)'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">สถานะ:</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    reg.installment_2_status === 'paid' || (reg.payment_plan !== 'installment' && reg.payment_status === 'paid')
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : reg.installment_2_status === 'pending_review'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {reg.installment_2_status === 'paid' || (reg.payment_plan !== 'installment' && reg.payment_status === 'paid')
                                      ? 'ชำระแล้ว'
                                      : reg.installment_2_status === 'pending_review'
                                      ? 'รอตรวจสอบ'
                                      : 'ค้างชำระ'}
                                  </span>
                                </div>
                                {reg.installment_2_slip_url && (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewSlipUrl(reg.installment_2_slip_url)}
                                      className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                                      <span>ดูสลิปงวดที่ 2</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
                          <p className="text-xs text-slate-400 font-medium">
                            ผู้ใช้งานรายนี้ยังไม่ได้ส่งแบบฟอร์มใบสมัครเข้าร่วมโครงการ JRE 2027 (มีเฉพาะบัญชีผู้ใช้ในระบบ)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            สามารถติดต่อผู้ใช้ผ่านเบอร์โทรหรืออีเมลเพื่อเชิญชวนให้ส่งใบสมัครเข้าร่วมโครงการได้
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Merchandise Orders (If any) */}
                    {userOrders.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                          <Shirt className="w-4 h-4 text-emerald-400" />
                          <span>คำสั่งซื้อเสื้อ/กางเกงที่เกี่ยวข้อง ({userOrders.length} รายการ)</span>
                        </div>
                        <div className="space-y-2">
                          {userOrders.map((ord, idx) => (
                            <div key={ord.id || idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="font-bold text-white block">
                                  คำสั่งซื้อ #{ord.id ? String(ord.id).slice(0, 8) : idx + 1}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  ยอดรวม: <span className="text-emerald-400 font-bold">{ord.total_price || ord.total || 0} บาท</span> • {ord.items?.length || 1} ชิ้น
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ord.payment_status === 'verified' || ord.status === 'verified'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {ord.payment_status === 'verified' || ord.status === 'verified' ? 'ชำระแล้ว' : 'รอตรวจสอบ'}
                                </span>
                                {ord.payment_slip_url && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewSlipUrl(ord.payment_slip_url)}
                                    className="p-1 hover:bg-slate-800 text-purple-400 rounded cursor-pointer"
                                    title="ดูสลิปคำสั่งซื้อเสื้อ"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 4: Security Metadata Card */}
                    <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-300">ความปลอดภัยของข้อมูลบัญชี (OWASP & PDPA Compliant)</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {hasPassword 
                              ? '🔒 บัญชีมีรหัสผ่านป้องกันด้วย Salted SHA-256 Hash ซึ่งจะไม่ถูกแสดงหรือส่งออกไปยังฝั่งผู้ใช้'
                              : '🌐 ยืนยันตัวตนผ่าน Google OAuth Token (Managed by Google Identity)'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] font-bold text-slate-400 shrink-0">
                        {acc.provider || 'google'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* EDIT USER ACCOUNT MODAL */}
      {editingUserAccount && (
        <ModalPortal isOpen={Boolean(editingUserAccount)} onClose={handleCloseEditUserModal}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleCloseEditUserModal}
          >
            <div 
              className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-3xl p-6 shadow-2xl relative space-y-4"
              onClick={e => e.stopPropagation()}
            >
            <button
              type="button"
              onClick={handleCloseEditUserModal}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  แก้ไขข้อมูลบัญชีผู้ใช้
                </h3>
                <p className="text-xs text-slate-400">
                  UID: {editingUserAccount.id.slice(0, 14)}...
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={e => setEditUserName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={e => setEditUserEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  เบอร์โทรศัพท์ติดต่อ (Phone)
                </label>
                <input
                  type="tel"
                  value={editUserPhone}
                  onChange={e => setEditUserPhone(e.target.value)}
                  placeholder="เช่น 098-329-6762 หรือ 080-278-3786"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  รหัสนิสิต / นักศึกษา (Student ID)
                </label>
                <input
                  type="text"
                  value={editUserStudentId}
                  onChange={e => setEditUserStudentId(e.target.value)}
                  placeholder="เช่น 68010310452"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  มหาวิทยาลัย / หน่วยงานสังกัด (Affiliation)
                </label>
                <input
                  type="text"
                  value={editUserAffiliation}
                  onChange={e => setEditUserAffiliation(e.target.value)}
                  placeholder="เช่น มหาวิทยาลัยมหาสารคาม (มมส) / ชมรมกู้ภัยราชพฤกษ์"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  บทบาท (Role)
                </label>
                <select
                  value={editUserRole}
                  onChange={e => setEditUserRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="user">User (ผู้ใช้ทั่วไป)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={editUserVerified}
                  onChange={e => setEditUserVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300 font-semibold text-xs">
                  สถานะบัญชีพร้อมใช้งาน (Account Active / Verified)
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseEditUserModal}
                  disabled={isSavingUser}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30 cursor-pointer disabled:opacity-50"
                >
                  {isSavingUser ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* ADMIN RESET PASSWORD MODAL */}
      {resetPassUser && (
        <ModalPortal isOpen={Boolean(resetPassUser)} onClose={() => setResetPassUser(null)}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setResetPassUser(null)}
          >
            <div 
              className="bg-slate-900 border-2 border-amber-500/50 max-w-md w-full rounded-3xl p-6 shadow-2xl relative space-y-4"
              onClick={e => e.stopPropagation()}
            >
            <button
              type="button"
              onClick={() => setResetPassUser(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  รีเซ็ตรหัสผ่านผู้ใช้
                </h3>
                <p className="text-xs text-amber-400">
                  {resetPassUser.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  รหัสผ่านใหม่ (กำหนดใหม่อย่างน้อย 6 ตัวอักษร)
                </label>
                <div className="relative">
                  <input
                    type={showAdminNewPass ? 'text' : 'password'}
                    value={adminNewPassword}
                    onChange={e => setAdminNewPassword(e.target.value)}
                    required
                    placeholder="รหัสผ่านใหม่"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showAdminNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 leading-relaxed">
                <span>🔒 ระบบไม่แสดงหรือ export hash/salt; ควรย้าย password verification ไป Supabase Auth/server-side KDF ก่อนใช้งานจริง</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  disabled={isResettingUserPass}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isResettingUserPass}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/40 cursor-pointer disabled:opacity-50"
                >
                  {isResettingUserPass ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* DELETE USER ACCOUNT MODAL */}
      {deletingUserAccount && (
        <ModalPortal isOpen={Boolean(deletingUserAccount)} onClose={() => setDeletingUserAccount(null)}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setDeletingUserAccount(null)}
          >
            <div 
              className="bg-slate-900 border-2 border-rose-600/50 max-w-md w-full rounded-3xl p-6 shadow-2xl relative space-y-4"
              onClick={e => e.stopPropagation()}
            >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">
                ยืนยันลบบัญชีผู้ใช้?
              </h3>
              <p className="text-xs text-rose-300 font-semibold">
                {deletingUserAccount.email}
              </p>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-[11px] text-rose-200 leading-relaxed">
              <span>⚠️ การลบบัญชีผู้ใช้นี้จะลบสิทธิ์การเข้าสู่ระบบ และข้อมูลใบสมัครที่ผูกไว้กับบัญชีนี้อย่างถาวร</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserAccount(null)}
                disabled={isDeletingUserAccount}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteUserAccount}
                disabled={isDeletingUserAccount}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingUserAccount ? 'กำลังลบ...' : 'ยืนยันลบบัญชี'}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* SPEAKER MODAL */}
      {showSpeakerModal && (
        <ModalPortal isOpen={Boolean(showSpeakerModal)} onClose={handleCloseSpeakerModal}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={handleCloseSpeakerModal}
          >
            <div 
              className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8"
              onClick={e => e.stopPropagation()}
            >
            <button
              type="button"
              onClick={handleCloseSpeakerModal}
              className="absolute top-5 right-5 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                speakerFormCategory === 'president'
                  ? 'bg-amber-500/20 text-amber-400'
                  : speakerFormCategory === 'advisor'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-emergency-500/20 text-emergency-400'
              }`}>
                {speakerFormCategory === 'president' ? (
                  <Crown className="w-5 h-5 text-amber-400" />
                ) : speakerFormCategory === 'advisor' ? (
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Award className="w-5 h-5 text-orange-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingSpeaker 
                    ? `แก้ไขข้อมูล: ${speakerFormCategory === 'president' ? '👑 ประธานในพิธี' : speakerFormCategory === 'advisor' ? '👔 ที่ปรึกษาโครงการ' : '🎖️ วิทยากรประจำโครงการ'}`
                    : `เพิ่มข้อมูลใหม่: ${speakerFormCategory === 'president' ? '👑 ประธานในพิธี' : speakerFormCategory === 'advisor' ? '👔 ที่ปรึกษาโครงการ' : '🎖️ วิทยากรประจำโครงการ'}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ระบุรายละเอียดของบุคคล หมวดหมู่บทบาท ข้อมูลรูปถ่าย และหัวข้อภารกิจ
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSpeakerModal} className="space-y-4">
              {/* Category / Role Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  ประเภทบทบาท / หมวดหมู่ <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeakerFormCategory('president')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      speakerFormCategory === 'president'
                        ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300 mb-1">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>👑 ประธานในพิธี</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      ประธานเปิด/ปิด มอบวุฒิบัตร
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpeakerFormCategory('advisor')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      speakerFormCategory === 'advisor'
                        ? 'bg-indigo-500/20 border-indigo-400 text-white ring-2 ring-indigo-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-300 mb-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>👔 ที่ปรึกษาโครงการ</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      อาจารย์ที่ปรึกษา/ผู้ทรงคุณวุฒิ
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpeakerFormCategory('speaker')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      speakerFormCategory === 'speaker'
                        ? 'bg-emergency-500/20 border-emergency-400 text-white ring-2 ring-emergency-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-orange-300 mb-1">
                      <Award className="w-4 h-4 text-orange-400" />
                      <span>🎖️ วิทยากร</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      บรรยายทฤษฎี/ฝึกปฏิบัติ
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ลำดับที่
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={speakerFormNum}
                    onChange={e => setSpeakerFormNum(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-400 font-black focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ชื่อ-สกุล (พร้อมคำนำหน้า/ยศ) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={speakerFormName}
                    onChange={e => setSpeakerFormName(e.target.value)}
                    placeholder="เช่น รองศาสตราจารย์ ดร.นิตยา วรรณกิตร์"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ตำแหน่ง / ความเชี่ยวชาญ
                </label>
                <input
                  type="text"
                  value={speakerFormTitle}
                  onChange={e => setSpeakerFormTitle(e.target.value)}
                  placeholder="เช่น รองอธิการบดีฝ่ายพัฒนานิสิตและภาพลักษณ์องค์กร"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  สังกัด / หน่วยงาน / สถาบัน
                </label>
                <input
                  type="text"
                  value={speakerFormOrg}
                  onChange={e => setSpeakerFormOrg(e.target.value)}
                  placeholder="เช่น มหาวิทยาลัยมหาสารคาม (มมส) / โรงพยาบาลศูนย์"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {speakerFormCategory === 'president'
                    ? 'บทบาทหน้าที่ในพิธีการ (Ceremony Role)'
                    : speakerFormCategory === 'advisor'
                    ? 'บทบาทและด้านที่ให้คำปรึกษา (Advisory Role)'
                    : 'หัวข้อฝึกอบรม / บรรยาย (Lecture & Training Topic)'}
                </label>
                <textarea
                  rows="2"
                  value={speakerFormTopic}
                  onChange={e => setSpeakerFormTopic(e.target.value)}
                  placeholder={
                    speakerFormCategory === 'president'
                      ? 'เช่น ประธานในพิธีเปิดโครงการ JRE 2027 และพิธีมอบเกียรติบัตรวุฒิบัตรปิดการฝึกอบรม'
                      : speakerFormCategory === 'advisor'
                      ? 'เช่น ที่ปรึกษาด้านการฝึกอบรมและประสานงานภาคีเครือข่ายนักศึกษาทั่วประเทศ'
                      : 'เช่น อบรมความรู้การกู้ภัยเบื้องต้นและความปลอดภัยในการปฏิบัติงาน'
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-[11px] font-bold text-slate-300">
                  รูปถ่าย (Photo)
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {speakerFormPhoto ? (
                      <img
                        src={speakerFormPhoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=fallback`;
                        }}
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isUploadingSpeakerPhoto ? 'กำลังอัปโหลด...' : 'เลือกไฟล์ภาพจากเครื่อง'}</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          onChange={handleSpeakerPhotoUpload}
                          disabled={isUploadingSpeakerPhoto}
                          className="hidden"
                        />
                      </label>
                      {speakerFormPhoto && (
                        <button
                          type="button"
                          onClick={() => setSpeakerFormPhoto('')}
                          className="px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={speakerFormPhoto}
                      onChange={e => setSpeakerFormPhoto(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseSpeakerModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    speakerFormCategory === 'president'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
                      : speakerFormCategory === 'advisor'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    บันทึกข้อมูล{speakerFormCategory === 'president' ? 'ประธานในพิธี' : speakerFormCategory === 'advisor' ? 'ที่ปรึกษา' : 'วิทยากร'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* TEAM MEMBER MODAL */}
      {showTeamModal && (
        <ModalPortal isOpen={Boolean(showTeamModal)} onClose={handleCloseTeamModal}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={handleCloseTeamModal}
          >
            <div 
              className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8"
              onClick={e => e.stopPropagation()}
            >
            <button
              type="button"
              onClick={handleCloseTeamModal}
              className="absolute top-5 right-5 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingTeamMember ? 'แก้ไขข้อมูลคณะดำเนินงาน' : 'เพิ่มคณะดำเนินงาน / ทีมงานใหม่'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  กำหนดชื่อ บทบาทหน้าที่ มหาวิทยาลัย/สถาบัน (มมส, มข, หรือสถาบันอื่นๆ) และรูปถ่าย
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTeamModal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ชื่อ-สกุล <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={teamFormName}
                  onChange={e => setTeamFormName(e.target.value)}
                  placeholder="เช่น นาย สมชาย รัตนวิชัย"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  บทบาท / หน้าที่ในโครงการ
                </label>
                <input
                  type="text"
                  value={teamFormRole}
                  onChange={e => setTeamFormRole(e.target.value)}
                  placeholder="เช่น ประธานโครงการและผู้อำนวยการฝึก / หัวหน้าฝ่ายสื่อสาร"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* University / Main Institution with Quick Tags */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  มหาวิทยาลัย / สถาบันหลัก (กำหนดได้อิสระ)
                </label>
                <input
                  type="text"
                  value={teamFormUniversity}
                  onChange={e => setTeamFormUniversity(e.target.value)}
                  placeholder="เช่น มหาวิทยาลัยมหาสารคาม (มมส), มหาวิทยาลัยขอนแก่น (มข) หรือ ม. อื่นๆ"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 self-center mr-1">เลือกด่วน:</span>
                  {[
                    'มหาวิทยาลัยมหาสารคาม (มมส)',
                    'มหาวิทยาลัยขอนแก่น (มข)',
                    'มหาวิทยาลัยเทคโนโลยีสุรนารี (มทส)',
                    'มหาวิทยาลัยเชียงใหม่ (มช)',
                    'มหาวิทยาลัยกาฬสินธุ์ (มกส)',
                    'มหาวิทยาลัยราชภัฏอุดรธานี (มรภ.อุดรธานี)',
                    'มหาวิทยาลัยวลัยลักษณ์ (มวล.)',
                    'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ สกลนคร (มก.ฉกส)'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTeamFormUniversity(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        teamFormUniversity === preset
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.replace(/มหาวิทยาลัย/g, 'ม.')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ชมรม / หน่วยงานย่อย
                  </label>
                  <input
                    type="text"
                    value={teamFormInstitution}
                    onChange={e => setTeamFormInstitution(e.target.value)}
                    placeholder="เช่น ชมรมกู้ภัยราชพฤกษ์ มมส"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    แท็กย่อ (Tag เช่น มมส 1, มข 4)
                  </label>
                  <input
                    type="text"
                    value={teamFormTag}
                    onChange={e => setTeamFormTag(e.target.value)}
                    placeholder="เช่น มมส 1, มข 4, มช 1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-[11px] font-bold text-slate-300">
                  รูปถ่ายประจำตัว (Photo)
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {teamFormPhoto ? (
                      <img
                        src={teamFormPhoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=fallback`;
                        }}
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isUploadingTeamPhoto ? 'กำลังอัปโหลด...' : 'เลือกไฟล์ภาพจากเครื่อง'}</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          onChange={handleTeamPhotoUpload}
                          disabled={isUploadingTeamPhoto}
                          className="hidden"
                        />
                      </label>
                      {teamFormPhoto && (
                        <button
                          type="button"
                          onClick={() => setTeamFormPhoto('')}
                          className="px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={teamFormPhoto}
                      onChange={e => setTeamFormPhoto(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ (https://...)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseTeamModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูลคณะทำงาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* UNIVERSAL QR & BARCODE SCANNER MODAL (STANDARDIZED ALL-IN-ONE SCANNER) */}
      {(showUniversalScanner || showQRScanner || showIDCardScanner) && (
        <UniversalScannerModal
          orders={merchandiseOrders}
          registrations={registrations}
          onClose={() => {
            setShowUniversalScanner(false);
            setShowQRScanner(false);
            setShowIDCardScanner(false);
          }}
          onMarkOrderReceived={onMarkOrderReceived}
          onMarkRegistrationShirtReceived={async (userId, received) => {
            if (onUpdateAllocation) {
              await onUpdateAllocation(userId, {
                shirt_pickup_status: received ? 'received' : 'pending',
                shirt_received: received,
                shirt_received_date: received ? new Date().toISOString() : null
              });
              triggerToast(received ? 'บันทึกการส่งมอบเสื้อฝึกเรียบร้อยแล้ว' : 'ยกเลิกสถานะส่งมอบเสื้อฝึกเรียบร้อยแล้ว');
            }
          }}
          onVerifyPayment={onVerifyOrderPayment}
          onRefreshRegistrations={onRefreshRegistrations}
          onUpdateAllocation={onUpdateAllocation}
        />
      )}

      {/* SHIRT ORDER & SIZE SUMMARY PRINT / PDF MODAL */}
      {showShirtPrintModal && (
        <ShirtOrderPrintModal
          isOpen={showShirtPrintModal}
          onClose={() => setShowShirtPrintModal(false)}
          sizeStats={sizeStats}
          universitySummary={universitySummary}
          sizeMeasurements={SIZE_MEASUREMENTS}
          allItems={[...traineeShirtRecords, ...merchandiseStoreRecords]}
          filteredItems={filteredShirtItems}
          currentFilterLabel={
            merchUniFilter !== 'all'
              ? `มหาวิทยาลัย ${merchUniFilter}`
              : merchSizeFilter !== 'all'
              ? `ไซส์ ${merchSizeFilter}`
              : merchSourceFilter !== 'all'
              ? (merchSourceFilter === 'registration' ? 'เสื้อฝึกผู้สมัคร' : 'สั่งซื้อเพิ่มหน้าร้าน')
              : merchSearchQuery
              ? `ค้นหา "${merchSearchQuery}"`
              : 'ทั้งหมด'
          }
          merchandiseConfig={localMerchConfig}
        />
      )}

      {/* MERCHANDISE SLIP PREVIEW MODAL */}
      {previewMerchSlip && (
        <ModalPortal isOpen={Boolean(previewMerchSlip)} onClose={() => setPreviewMerchSlip(null)}>
          <div 
            onClick={() => setPreviewMerchSlip(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          >
            <div className="relative max-w-lg max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewMerchSlip}
                alt="Merchandise Slip"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-slate-700 shadow-2xl"
              />
              <button
                onClick={() => setPreviewMerchSlip(null)}
                className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MERCHANDISE PRODUCT IMAGE PREVIEW MODAL */}
      {previewProductImageModal && (
        <ModalPortal isOpen={Boolean(previewProductImageModal)} onClose={() => setPreviewProductImageModal(null)}>
          <div 
            onClick={() => setPreviewProductImageModal(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          >
            <div className="relative max-w-2xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewProductImageModal}
                alt="Product Preview"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-slate-700 shadow-2xl"
              />
              <button
                onClick={() => setPreviewProductImageModal(null)}
                className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* PREVIEW SLIP MODAL FOR ADMIN */}
      {previewSlipUrl && (
        <ModalPortal isOpen={Boolean(previewSlipUrl)} onClose={() => setPreviewSlipUrl(null)}>
          <div 
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewSlipUrl(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-5 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewSlipUrl(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <h4 className="font-bold text-white text-sm mb-3">ภาพสลิปการโอนเงินของผู้สมัคร</h4>
              <img src={previewSlipUrl} alt="สลิป" className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800" />
            </div>
          </div>
        </ModalPortal>
      )}

      {/* IN-APP DOCUMENT & SLIP PREVIEW MODAL */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />

      {/* IN-APP SYSTEM POPUP DIALOG FOR CONFIRMATIONS & ALERTS */}
      <ConfirmModal {...confirmModalProps} />

    </div>
  );
}
