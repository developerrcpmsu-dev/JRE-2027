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
  Filter
} from 'lucide-react';
import { DataService, mergeAndDeduplicateAccounts, ensureHostedUrl } from '../supabase';
import { exportRegistrationsToExcel, exportMerchandiseOrdersToExcel, resolveFirstAndLastName } from '../utils/excelExporter';
import { 
  DEFAULT_PAYMENT_CONFIG, 
  DEFAULT_MERCHANDISE_CONFIG,
  DEFAULT_SPEAKERS,
  DEFAULT_TEAM_MEMBERS,
  isMsuInstitution,
  getRegistrationFeeDetails
} from '../data/defaultData';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import AdminQRScannerModal from '../components/AdminQRScannerModal';
import ModalPortal from '../components/ModalPortal';
import ConfirmModal, { useConfirmModal } from '../components/ConfirmModal';
import * as XLSX from 'xlsx';

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
  onMarkOrderReceived
}) {
  const resolveInitialTab = (tab) => {
    if (tab === 'payment') return 'payment_settings';
    if (tab === 'users') return 'users';
    return tab || 'applicants';
  };

  const [activeTab, setActiveTab] = useState(() => resolveInitialTab(initialTab));

  React.useEffect(() => {
    if (initialTab) {
      const resolved = resolveInitialTab(initialTab);
      if (resolved !== activeTab) {
        setActiveTab(resolved);
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
            onTabChange(tab === 'payment_settings' ? 'payment' : tab);
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
      onTabChange(tab === 'payment_settings' ? 'payment' : tab);
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
      products: products.length > 0 ? products : DEFAULT_MERCHANDISE_CONFIG.products
    };
  };

  // Merchandise State
  const [localMerchConfig, setLocalMerchConfig] = useState(() => {
    return sanitizeAdminMerchConfig(merchandiseConfig, paymentConfig);
  });
  const [isSavingMerch, setIsSavingMerch] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [merchSearchQuery, setMerchSearchQuery] = useState('');
  const [merchStatusFilter, setMerchStatusFilter] = useState('all');
  const [merchSourceFilter, setMerchSourceFilter] = useState('all'); // 'all', 'registration', 'merchandise'
  const [merchSizeFilter, setMerchSizeFilter] = useState('all'); // 'all', 'SS', 'S', 'M', 'L', 'XL', '2XL', etc.
  const [merchPaymentFilter, setMerchPaymentFilter] = useState('all'); // 'all', 'paid', 'pending', 'unpaid'
  const [merchDeliveryFilter, setMerchDeliveryFilter] = useState('all'); // 'all', 'pending', 'received'
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
      const isRound1Paid = r.installment_1_status === 'paid' || r.payment_status === 'paid' || r.payment_status === 'full';
      const isR2Paid = r.installment_2_status === 'paid' && Boolean(r.installment_2_slip_url);
      const isFullyPaid = r.payment_status === 'paid' || r.payment_status === 'full' || (r.installment_1_status === 'paid' && isR2Paid);
      const isReceived = r.shirt_pickup_status === 'received' || r.shirt_received === true;
      const rawSize = (r.shirt_size || 'L').trim();
      const normSize = normalizeSize(rawSize);
      const orderNumber = `JRE27-SHIRT-${(r.id || r.user_id || 'REG').slice(0, 6).toUpperCase()}`;

      return {
        id: `reg_shirt_${r.id || r.user_id}`,
        user_id: r.user_id || r.id,
        reg_id: r.id || r.user_id,
        source: 'registration',
        source_label: '📋 เสื้อฝึกผู้สมัคร (รวมในค่าสมัคร)',
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
        total_amount: r.payment_amount || (r.institution && (r.institution.includes('มหาสารคาม') || r.institution.includes('มมส')) ? 650 : 850),
        payment_status: isFullyPaid ? 'paid_verified' : isRound1Paid ? 'paid_verified' : (r.payment_slip_url || r.installment_1_slip_url) ? 'pending_verification' : 'unpaid',
        payment_badge: isFullyPaid ? 'ชำระเต็มจำนวน' : isRound1Paid ? 'ชำระงวดที่ 1 (ค่าเสื้อ)' : (r.payment_slip_url || r.installment_1_slip_url) ? 'รอตรวจสลิป' : 'ยังไม่ชำระ',
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
      totalPendingShirts
    };
  }, [traineeShirtRecords, merchandiseStoreRecords]);

  // Unified items filtered for search and inspector
  const filteredShirtItems = React.useMemo(() => {
    return [...traineeShirtRecords, ...merchandiseStoreRecords].filter(item => {
      // 1. Source filter
      if (merchSourceFilter !== 'all' && item.source !== merchSourceFilter) {
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
        const matchesInst = item.institution?.toLowerCase().includes(q);
        const matchesSize = item.size?.toLowerCase().includes(q);
        return matchesName || matchesCallsign || matchesNickname || matchesPhone || matchesEmail || matchesOrder || matchesInst || matchesSize;
      }

      return true;
    });
  }, [traineeShirtRecords, merchandiseStoreRecords, merchSourceFilter, merchSizeFilter, merchDeliveryFilter, merchPaymentFilter, merchStatusFilter, merchSearchQuery]);

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
  const [filterType, setFilterType] = useState('all'); // 'all', 'special_care', 'unpaid', 'pending_review', 'paid', 'no_group', 'has_group'
  const [bloodFilter, setBloodFilter] = useState('all');

  // Inline Quick Edit Allocation State
  const [editingUserId, setEditingUserId] = useState(null);
  const [allocGroup, setAllocGroup] = useState('');
  const [allocRoom, setAllocRoom] = useState('');

  // Full Profile & Remarks Modal State
  const [profileModalReg, setProfileModalReg] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('info'); // 'info', 'payment', 'messages', 'docs'
  
  // Modal Fields
  const [modalGroup, setModalGroup] = useState('');
  const [modalRoom, setModalRoom] = useState('');
  const [modalSpecialCare, setModalSpecialCare] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalInstitution, setModalInstitution] = useState('');
  const [modalMedical, setModalMedical] = useState('');
  const [modalAllergy, setModalAllergy] = useState('');
  const [modalTraining, setModalTraining] = useState('');
  
  // Payment Modal Fields
  const [modalPaymentStatus, setModalPaymentStatus] = useState('unpaid');
  const [modalPaymentAmount, setModalPaymentAmount] = useState(650);
  const [modalPaymentBank, setModalPaymentBank] = useState('');
  const [modalPaymentNotes, setModalPaymentNotes] = useState('');

  // Admin Direct Message State
  const [newMsgText, setNewMsgText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Document Request State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocRequired, setNewDocRequired] = useState(true);

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
    return paymentConfig || DEFAULT_PAYMENT_CONFIG;
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  React.useEffect(() => {
    if (paymentConfig) {
      setLocalPayment(paymentConfig);
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
  const [userAccounts, setUserAccounts] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userProviderFilter, setUserProviderFilter] = useState('all'); // all, email, google, both

  // Modal states for user account management
  const [selectedHashUser, setSelectedHashUser] = useState(null); // inspect password hash & salt
  const [editingUserAccount, setEditingUserAccount] = useState(null); // edit user
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [editUserVerified, setEditUserVerified] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [resetPassUser, setResetPassUser] = useState(null); // reset password
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [isResettingUserPass, setIsResettingUserPass] = useState(false);

  const [deletingUserAccount, setDeletingUserAccount] = useState(null); // delete user
  const [isDeletingUserAccount, setIsDeletingUserAccount] = useState(false);

  const loadUserAccounts = async () => {
    setIsLoadingUsers(true);
    try {
      const accs = await DataService.getUserAccounts();
      const deduped = mergeAndDeduplicateAccounts ? mergeAndDeduplicateAccounts(accs || []) : (accs || []);
      setUserAccounts(deduped);
    } catch (err) {
      console.error('Error loading user accounts:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    loadUserAccounts();
  }, []);

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUserAccount) return;
    setIsSavingUser(true);
    try {
      await DataService.adminUpdateUser(editingUserAccount.id, {
        name: editUserName.trim(),
        email: editUserEmail.trim().toLowerCase(),
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
      triggerToast(`รีเซ็ตรหัสผ่านสำหรับ ${resetPassUser.email} สำเร็จ (เข้ารหัส SHA-256 + Salt เรียบร้อย)`);
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
      'ยืนยันอีเมลแล้ว (Email Verified)',
      'ผู้ให้บริการเข้าสู่ระบบ (Auth Provider)',
      'เกลือสุ่ม 16-byte (Dynamic Salt Hex)',
      'รหัสผ่านแฮช (Password Hash SHA-256)',
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
      if (u.email_verified || u.verified) return 'ยืนยันผ่าน OTP แล้ว';
      return 'รอ OTP ยืนยัน';
    };

    const dataRows = userAccounts.map((u, idx) => [
      idx + 1,
      u.id || '-',
      u.name || '-',
      u.email || '-',
      getVerificationStatusText(u),
      u.provider === 'both' ? 'Google OAuth + Email & Password' : u.provider === 'email' ? 'Email & Password' : 'Google OAuth',
      u.salt || 'N/A (Google OAuth)',
      u.password_hash || 'N/A (Google OAuth)',
      u.role || 'user',
      u.created_at ? new Date(u.created_at).toLocaleString('th-TH') : '-',
      u.updated_at ? new Date(u.updated_at).toLocaleString('th-TH') : '-'
    ]);

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

  // Speakers Management State
  const [localSpeakers, setLocalSpeakers] = useState(() => {
    return (speakers && speakers.length > 0) ? speakers : DEFAULT_SPEAKERS;
  });
  const [isSavingSpeakers, setIsSavingSpeakers] = useState(false);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [speakerFormNum, setSpeakerFormNum] = useState(1);
  const [speakerFormName, setSpeakerFormName] = useState('');
  const [speakerFormTitle, setSpeakerFormTitle] = useState('');
  const [speakerFormOrg, setSpeakerFormOrg] = useState('');
  const [speakerFormTopic, setSpeakerFormTopic] = useState('');
  const [speakerFormPhoto, setSpeakerFormPhoto] = useState('');
  const [isUploadingSpeakerPhoto, setIsUploadingSpeakerPhoto] = useState(false);

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

  // --- Speakers Handlers ---
  const handleMoveSpeakerUp = async (index) => {
    if (index <= 0) return;
    const updated = [...localSpeakers];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    const renumbered = updated.map((s, idx) => ({ ...s, num: idx + 1 }));
    setLocalSpeakers(renumbered);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(renumbered);
      triggerToast('จัดลำดับวิทยากรเลื่อนขึ้นเรียบร้อย');
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกลำดับ');
    }
  };

  const handleMoveSpeakerDown = async (index) => {
    if (index >= localSpeakers.length - 1) return;
    const updated = [...localSpeakers];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    const renumbered = updated.map((s, idx) => ({ ...s, num: idx + 1 }));
    setLocalSpeakers(renumbered);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(renumbered);
      triggerToast('จัดลำดับวิทยากรเลื่อนลงเรียบร้อย');
    } catch (e) {
      console.error(e);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกลำดับ');
    }
  };

  const handleOpenAddSpeaker = () => {
    setEditingSpeaker(null);
    setSpeakerFormNum(localSpeakers.length + 1);
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
        triggerToast('อัปโหลดรูปภาพวิทยากรสำเร็จ');
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
      triggerToast('กรุณากรอกชื่อ-สกุลของวิทยากร');
      return;
    }
    const defaultPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(speakerFormName.trim())}`;
    const payload = {
      id: editingSpeaker?.id || 'spk-' + Date.now(),
      num: Number(speakerFormNum) || (editingSpeaker?.num || localSpeakers.length + 1),
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
      triggerToast(editingSpeaker ? 'แก้ไขข้อมูลวิทยากรเรียบร้อย' : 'เพิ่มวิทยากรใหม่เรียบร้อย');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteSpeaker = async (id) => {
    const spkToDelete = localSpeakers.find(s => s.id === id);
    const ok = await askConfirm({
      title: 'ยืนยันการลบวิทยากร',
      message: `คุณต้องการลบข้อมูลวิทยากร "${spkToDelete?.name || ''}" ออกจากระบบใช่หรือไม่?`,
      confirmText: 'ยืนยันลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!ok) return;
    const filtered = localSpeakers.filter(s => s.id !== id).map((s, idx) => ({ ...s, num: idx + 1 }));
    setLocalSpeakers(filtered);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(filtered);
      triggerToast('ลบข้อมูลวิทยากรเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleSaveAllSpeakers = async () => {
    setIsSavingSpeakers(true);
    try {
      if (onSaveSpeakers) await onSaveSpeakers(localSpeakers);
      triggerToast('บันทึกข้อมูลวิทยากรทั้งหมดลงฐานข้อมูลเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลวิทยากร');
    } finally {
      setIsSavingSpeakers(false);
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
  };

  const handleSaveAllocation = async (userId) => {
    await onUpdateAllocation(userId, {
      group_assigned: allocGroup.trim(),
      room_assigned: allocRoom.trim()
    });
    setEditingUserId(null);
    triggerToast('บันทึกการจัดสรรกลุ่มและห้องพักเรียบร้อย');
  };

  // Open Full Profile & Remarks Modal (Locked / View-only by default)
  const handleOpenProfileModal = (reg, initialTab = 'info') => {
    setProfileModalReg(reg);
    setIsEditingProfileModal(false);
    setProfileModalTab(initialTab);
    setModalGroup(reg.group_assigned || '');
    setModalRoom(reg.room_assigned || '');
    setModalSpecialCare(Boolean(reg.is_special_care));
    setModalNotes(reg.special_notes || '');
    setModalPhone(reg.phone || '');
    setModalInstitution(reg.institution || '');
    setModalMedical(reg.medical_history || '');
    setModalAllergy(reg.food_allergy || '');
    setModalTraining(reg.previous_training || '');
    const isMsu = isMsuInstitution(reg.institution);
    const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
    const round2Fee = isMsu ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
    const isInstallment = reg.payment_plan === 'installment' || Boolean(reg.installment_1_slip_url) || Boolean(reg.installment_2_slip_url);
    const isR1Paid = reg.installment_1_status === 'paid';
    const isR2Paid = reg.installment_2_status === 'paid' && Boolean(reg.installment_2_slip_url);
    const isBothPaid = isInstallment ? (isR1Paid && isR2Paid) : (reg.payment_status === 'paid');

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
      effAmount = reg.payment_amount || totalFee;
    }

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
        setModalSpecialCare(Boolean(profileModalReg.is_special_care));
        setModalNotes(profileModalReg.special_notes || '');
        setModalPhone(profileModalReg.phone || '');
        setModalInstitution(profileModalReg.institution || '');
        setModalMedical(profileModalReg.medical_history || '');
        setModalAllergy(profileModalReg.food_allergy || '');
        setModalTraining(profileModalReg.previous_training || '');
        
        const isMsu = isMsuInstitution(profileModalReg.institution);
        const totalFee = isMsu ? (paymentConfig?.fee_total_msu || 650) : (paymentConfig?.fee_total_external || paymentConfig?.fee_total || 850);
        const round2Fee = isMsu ? (paymentConfig?.installment_round2_amount_msu || 250) : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);
        const isInstallment = profileModalReg.payment_plan === 'installment' || Boolean(profileModalReg.installment_1_slip_url) || Boolean(profileModalReg.installment_2_slip_url);
        const isR1Paid = profileModalReg.installment_1_status === 'paid';
        const isR2Paid = profileModalReg.installment_2_status === 'paid' && Boolean(profileModalReg.installment_2_slip_url);
        const isBothPaid = isInstallment ? (isR1Paid && isR2Paid) : (profileModalReg.payment_status === 'paid');

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
          effAmount = profileModalReg.payment_amount || totalFee;
        }

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
      const updates = {
        group_assigned: modalGroup.trim(),
        room_assigned: modalRoom.trim(),
        is_special_care: modalSpecialCare,
        special_notes: modalNotes.trim(),
        phone: modalPhone.trim(),
        institution: modalInstitution.trim(),
        medical_history: modalMedical.trim(),
        food_allergy: modalAllergy.trim(),
        previous_training: modalTraining.trim(),
        payment_status: modalPaymentStatus,
        payment_amount: Number(modalPaymentAmount) || (isMsuInstitution(profileModalReg.institution) ? 650 : 850),
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

  // Send Direct Message to Participant
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsgText.trim() || !profileModalReg) return;

    setIsSendingMsg(true);
    try {
      await DataService.sendAdminMessage(profileModalReg.user_id, newMsgText.trim(), {
        payment_amount: Number(modalPaymentAmount) || (isMsuInstitution(profileModalReg.institution) ? 650 : 850),
        payment_bank_info: modalPaymentBank.trim(),
        payment_status: modalPaymentStatus
      });

      const updatedRegs = await DataService.getRegistrations();
      const updatedTarget = updatedRegs.find(r => r.user_id === profileModalReg.user_id);
      if (updatedTarget) {
        setProfileModalReg(updatedTarget);
      }

      setNewMsgText('');
      triggerToast(`ส่งข้อความแจ้งเตือนถึง ${profileModalReg.first_name} สำเร็จ`);
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
      const updatedRegs = await DataService.getRegistrations();
      const updatedTarget = updatedRegs.find(r => r.user_id === profileModalReg.user_id);
      if (updatedTarget) {
        setProfileModalReg(updatedTarget);
      }
      triggerToast('ลบข้อความแจ้งเตือนสำเร็จ');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการลบข้อความ');
    }
  };

  // Add Document Request
  const handleAddDocRequest = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !profileModalReg) return;

    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
    const newDoc = {
      id: 'doc-' + Date.now(),
      title: newDocTitle.trim(),
      required: newDocRequired,
      status: 'pending',
      file_url: '',
      file_name: '',
      submitted_at: ''
    };

    const updatedDocs = [...currentDocs, newDoc];
    await DataService.updateRequestedDocs(profileModalReg.user_id, updatedDocs);
    await onUpdateAllocation(profileModalReg.user_id, { requested_docs: updatedDocs });
    setProfileModalReg(prev => ({ ...prev, requested_docs: updatedDocs }));
    setNewDocTitle('');
    triggerToast(`เพิ่มคำขอเอกสาร "${newDoc.title}" เรียบร้อยแล้ว`);
  };

  // Verify Document (Approve / Reject)
  const handleVerifyDoc = async (docId, status, note = '') => {
    if (!profileModalReg) return;
    const currentDocs = Array.isArray(profileModalReg.requested_docs) ? [...profileModalReg.requested_docs] : [];
    const idx = currentDocs.findIndex(d => d.id === docId);
    if (idx >= 0) {
      currentDocs[idx] = {
        ...currentDocs[idx],
        status,
        note
      };
      await DataService.updateRequestedDocs(profileModalReg.user_id, currentDocs);
      await onUpdateAllocation(profileModalReg.user_id, { requested_docs: currentDocs });
      setProfileModalReg(prev => ({ ...prev, requested_docs: currentDocs }));
      triggerToast(status === 'approved' ? 'อนุมัติเอกสารเรียบร้อย' : 'ส่งคำขอแก้ไขเอกสารแล้ว');
    }
  };

  const handleDeleteReg = async (userId, name) => {
    const ok = await askConfirm({
      title: 'ยืนยันการลบข้อมูลผู้สมัคร',
      message: `คุณต้องการลบข้อมูลผู้สมัคร "${name}" ออกจากระบบใช่หรือไม่? ข้อมูลและประวัติการชำระเงินทั้งหมดจะถูกลบถาวร`,
      confirmText: 'ยืนยันลบข้อมูลผู้สมัคร',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (ok) {
      await onDeleteRegistration(userId);
      triggerToast('ลบข้อมูลผู้สมัครเรียบร้อยแล้ว');
    }
  };

  // Filtered registrations
  const filteredRegs = registrations.filter(reg => {
    const textTarget = (
      (reg.first_name || '') + ' ' + 
      (reg.last_name || '') + ' ' + 
      (reg.full_name_affiliation || '') + ' ' +
      (reg.nickname || '') + ' ' +
      (reg.callsign || '') + ' ' +
      (reg.shirt_size || '') + ' ' +
      (reg.phone || '') + ' ' + 
      (reg.institution || '') + ' ' +
      (reg.user_email || '') + ' ' +
      (reg.group_assigned || '') + ' ' +
      (reg.room_assigned || '') + ' ' +
      (reg.special_notes || '') + ' ' +
      (reg.medical_history || '')
    ).toLowerCase();

    const matchSearch = textTarget.includes(searchTerm.toLowerCase());
    const matchBlood = bloodFilter === 'all' || reg.blood_group === bloodFilter;
    
    let matchFilter = true;
    if (filterType === 'special_care') matchFilter = Boolean(reg.is_special_care);
    else if (filterType === 'unpaid') matchFilter = reg.payment_status === 'unpaid' || !reg.payment_status;
    else if (filterType === 'pending_review') matchFilter = reg.payment_status === 'pending_review';
    else if (filterType === 'paid') matchFilter = reg.payment_status === 'paid';
    else if (filterType === 'no_group') matchFilter = !reg.group_assigned;
    else if (filterType === 'has_group') matchFilter = Boolean(reg.group_assigned);
    else if (filterType === 'no_room') matchFilter = !reg.room_assigned;
    else if (filterType === 'has_room') matchFilter = Boolean(reg.room_assigned);

    return matchSearch && matchBlood && matchFilter;
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

  // Export CSV with both =IMAGE() formula (renders image in sheets) and pure URL link
  const handleExportCSV = async () => {
    if (!registrations || registrations.length === 0) {
      triggerToast('ยังไม่มีข้อมูลผู้สมัครในระบบ');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ',
      'สกุล',
      'หน่วยงาน',
      'รหัสนามเรียกขาน',
      'เบอร์โทร',
      'ชื่อสกุลผู้ที่ติดต่อได้',
      'เบอร์โทรผู้ที่ติดต่อได้',
      'โรคประจำตัว / ข้อจำกัดทางกาย',
      'ประวัติการแพ้ยา / แพ้อาหาร',
      'ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา',
      'สถานะการชำระเงิน',
      'จ่ายครั้งแรกวันที่',
      'จำนวนเงินงวดที่ 1',
      'ครั้งที่ 2 วันที่',
      'จำนวนเงินงวดที่ 2',
      'มียอดค้างชำระไหม',
      'รูปทำบัตร ID Card (สูตรแสดงภาพ =IMAGE)',
      'รูปทำบัตร ID Card (URL ลิงก์ตรง)',
      'ไซส์เสื้อฝึก JRE 2027',
      'กลุ่มฝึกที่จัดสรร',
      'ห้องนอนที่จัดสรร',
      'ชื่อเล่น',
      'อีเมล Google',
      'วันเกิด',
      'อายุ',
      'กรุ๊ปเลือด',
      'ความสัมพันธ์ผู้ติดต่อฉุกเฉิน',
      'ประเภทสถาบัน',
      'ยอดค่าสมัครรวม (บาท)',
      'ยอดที่ชำระแล้ว (บาท)',
      'ยอดค้างชำระ (บาท)',
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

    const rows = await Promise.all(registrations.map(async (r, idx) => {
      const { firstName, lastName } = resolveFirstAndLastName(r);
      const isMsu = isMsuInstitution(r.institution);
      const totalFee = isMsu ? 650 : 850;
      const round1Amount = 400;
      const round2Amount = isMsu ? 250 : 450;

      let paidAmount = 0;
      const isR1Paid = r.installment_1_status === 'paid';
      const isR2Paid = r.installment_2_status === 'paid' && Boolean(r.installment_2_slip_url);
      if (r.payment_plan === 'installment') {
        if (isR1Paid) paidAmount += round1Amount;
        if (isR2Paid) paidAmount += round2Amount;
      } else {
        if (r.payment_status === 'paid') paidAmount = totalFee;
      }
      const remainingAmount = Math.max(0, totalFee - paidAmount);

      let paymentStatusDesc = '';
      if (r.payment_plan === 'installment') {
        if (isR1Paid && isR2Paid) {
          paymentStatusDesc = 'ผ่อนชำระ (จ่ายครบแล้ว)';
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
      if (r.payment_plan === 'installment') {
        if (r.installment_1_slip_date) {
          paidRound1Date = new Date(r.installment_1_slip_date).toLocaleString('th-TH');
        } else if (r.installment_1_status === 'paid') {
          paidRound1Date = 'ชำระแล้ว';
        } else {
          paidRound1Date = 'ยังไม่ชำระ';
        }
      } else {
        if (r.payment_slip_date) {
          paidRound1Date = new Date(r.payment_slip_date).toLocaleString('th-TH');
        } else if (r.payment_status === 'paid') {
          paidRound1Date = 'ชำระแล้ว';
        } else {
          paidRound1Date = 'ยังไม่ชำระ';
        }
      }

      let paidRound1Amount = '';
      if (r.payment_plan === 'installment') {
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
      if (r.payment_plan === 'installment') {
        if (r.installment_2_slip_date) {
          paidRound2Date = new Date(r.installment_2_slip_date).toLocaleString('th-TH');
        } else if (isR2Paid) {
          paidRound2Date = 'ชำระแล้ว';
        } else {
          paidRound2Date = 'ยังไม่ชำระ';
        }
      } else {
        paidRound2Date = '-';
      }

      let paidRound2Amount = '-';
      if (r.payment_plan === 'installment') {
        if (isR2Paid) {
          paidRound2Amount = `${round2Amount} บาท`;
        } else if (r.installment_2_status === 'pending_review' && r.installment_2_slip_url) {
          paidRound2Amount = `${round2Amount} บาท (รอตรวจสอบ)`;
        } else {
          paidRound2Amount = `${round2Amount} บาท (ยังไม่ชำระ)`;
        }
      } else {
        paidRound2Amount = '-';
      }

      const remainingBalanceStatus = remainingAmount === 0 
        ? 'ไม่มี (ชำระครบถ้วนแล้ว)' 
        : `มียอดค้างชำระ ${remainingAmount} บาท`;

      const s1 = r.installment_1_slip_url ? await ensureHostedUrl(r.installment_1_slip_url, 'slip-round1.jpg') : '';
      const s2 = r.installment_2_slip_url ? await ensureHostedUrl(r.installment_2_slip_url, 'slip-round2.jpg') : '';
      const sFull = r.payment_slip_url ? await ensureHostedUrl(r.payment_slip_url, 'slip-full.jpg') : '';
      const idPhoto = r.id_card_photo ? await ensureHostedUrl(r.id_card_photo, 'id-card.jpg') : '';

      return [
        idx + 1,
        `"${firstName.replace(/"/g, '""')}"`,
        `"${lastName.replace(/"/g, '""')}"`,
        `"${(r.institution || '-').replace(/"/g, '""')}"`,
        `"${r.callsign || '-'}"`,
        `"${r.phone || '-'}"`,
        `"${(r.emergency_name || '-').replace(/"/g, '""')}"`,
        `"${r.emergency_phone || '-'}"`,
        `"${(r.medical_history && r.medical_history.trim() !== '' ? r.medical_history.trim() : 'ไม่มี').replace(/"/g, '""')}"`,
        `"${(r.food_allergy && r.food_allergy.trim() !== '' ? r.food_allergy.trim() : 'ไม่มี').replace(/"/g, '""')}"`,
        `"${(r.previous_training && r.previous_training.trim() !== '' ? r.previous_training.trim() : 'ไม่มี').replace(/"/g, '""')}"`,
        `"${paymentStatusDesc}"`,
        `"${paidRound1Date}"`,
        `"${paidRound1Amount}"`,
        `"${paidRound2Date}"`,
        `"${paidRound2Amount}"`,
        `"${remainingBalanceStatus}"`,
        `"${idPhoto ? `=IMAGE(""${idPhoto}"")` : 'ยังไม่แนบ'}"`,
        `"${idPhoto || 'ยังไม่แนบ'}"`,
        `"${r.shirt_size || 'L'}"`,
        `"${r.group_assigned || 'ยังไม่จัดสรร'}"`,
        `"${r.room_assigned || 'ยังไม่จัดสรร'}"`,
        `"${r.nickname || '-'}"`,
        `"${r.user_email || '-'}"`,
        `"${r.dob || '-'}"`,
        `"${r.age_years || 0} ปี ${r.age_months || 0} เดือน"`,
        `"${r.blood_group || '-'}"`,
        `"${r.emergency_relation || '-'}"`,
        `"${isMsu ? 'นิสิต มมส (650 บาท)' : 'สถาบันภายนอก (850 บาท)'}"`,
        `"${totalFee}"`,
        `"${paidAmount}"`,
        `"${remainingAmount}"`,
        `"${r.installment_1_status || '-'}"`,
        `"${s1 ? `=IMAGE(""${s1}"")` : 'ยังไม่แนบ'}"`,
        `"${s1 || 'ยังไม่แนบ'}"`,
        `"${r.installment_2_status || '-'}"`,
        `"${s2 ? `=IMAGE(""${s2}"")` : 'ยังไม่แนบ'}"`,
        `"${s2 || 'ยังไม่แนบ'}"`,
        `"${sFull ? `=IMAGE(""${sFull}"")` : 'ยังไม่แนบ'}"`,
        `"${sFull || 'ยังไม่แนบ'}"`,
        `"${r.is_special_care ? 'ใช่ (ดูแลพิเศษ)' : 'ปกติ'}"`,
        `"${(r.special_notes || '').replace(/"/g, '""')}"`
      ];
    }));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRE2027_รายชื่อผู้สมัครทุกคน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("ส่งออกไฟล์ CSV สำเร็จ (พร้อมสูตรแสดงภาพสลิป =IMAGE และลิงก์ตรง)");
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

  // Export Merchandise Shirt Orders to CSV
  const handleExportMerchandiseCSV = async () => {
    if (!filteredShirtItems || filteredShirtItems.length === 0) {
      triggerToast('ไม่พบรายการเสื้อสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ',
      'สกุล',
      'เบอร์โทร',
      'หน่วยงาน',
      'ไซต์เสื้อ',
      'รหัสนามเรียกขาน',
      'ชื่อเล่น',
      'ประเภทรายการ',
      'รหัสออเดอร์',
      'รายละเอียดสินค้า',
      'ยอดรวม (บาท)',
      'สถานะการชำระเงิน',
      'รูปสลิป (สูตรแสดงภาพ =IMAGE)',
      'สลิปโอนเงิน (URL ลิงก์ตรง)',
      'สถานะการส่งมอบ',
      'วันเวลาที่ส่งมอบ',
      'กลุ่มฝึก',
      'ห้องนอน',
      'อีเมล'
    ];

    const rows = await Promise.all(filteredShirtItems.map(async (it, idx) => {
      const { firstName, lastName } = resolveFirstAndLastName(it);
      const isReg = it.source === 'registration' || it.itemType === 'registration';
      const isReceived = it.pickup_status === 'received';
      const isPaid = it.payment_status === 'paid_verified' || it.payment_status === 'paid';
      const slipUrl = it.slip_url ? await ensureHostedUrl(it.slip_url, `slip-${it.order_number || 'shirt'}.jpg`) : '';

      const itemsSummary = Array.isArray(it.items) && it.items.length > 0
        ? it.items.map(p => `${p.product_name || 'เสื้อ'} (${p.size || it.shirt_size || it.size}) x${p.quantity || 1}`).join('; ')
        : `เสื้อปฏิบัติการกู้ภัย JRE 2027 (${it.shirt_size || it.size || 'L'}) x1`;

      return [
        idx + 1,
        `"${firstName.replace(/"/g, '""')}"`,
        `"${lastName.replace(/"/g, '""')}"`,
        `"${(it.customer_phone || it.phone || '-').replace(/"/g, '""')}"`,
        `"${(it.institution || '-').replace(/"/g, '""')}"`,
        `"${it.shirt_size || it.size || 'L'}"`,
        `"${it.callsign || ''}"`,
        `"${it.nickname || ''}"`,
        `"${isReg ? 'เสื้อฝึกในใบสมัคร' : 'สั่งซื้อหน้าร้าน'}"`,
        `"${it.order_number || `ORD-${(it.id || '').slice(0, 8)}`}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${it.total_amount || 0}"`,
        `"${isPaid ? 'ชำระแล้ว (อนุมัติ)' : (it.payment_status === 'pending_verification' ? 'รอตรวจสลิป' : 'ค้างชำระ')}"`,
        `"${slipUrl ? `=IMAGE(""${slipUrl}"")` : 'ไม่มีสลิป'}"`,
        `"${slipUrl || 'ไม่มีสลิป'}"`,
        `"${isReceived ? 'ส่งมอบแล้ว' : 'รอรับ'}"`,
        `"${it.pickup_at ? new Date(it.pickup_at).toLocaleString('th-TH') : '-'}"`,
        `"${it.group_assigned || 'ยังไม่จัดสรร'}"`,
        `"${it.room_assigned || 'ยังไม่จัดสรร'}"`,
        `"${it.user_email || ''}"`
      ];
    }));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRE2027_รายการส่งมอบเสื้อทุกคน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("ส่งออกไฟล์ CSV รายการเสื้อสำเร็จ (พร้อมสูตรแสดงภาพสลิป =IMAGE และลิงก์ตรง)");
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
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">ผู้สมัครทั้งหมด</span>
            <p className="text-2xl font-black text-white mt-1">{registrations.length} คน</p>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-amber-900/40">
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> รอตรวจสลิป
            </span>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {registrations.filter(r => r.payment_status === 'pending_review').length} คน
            </p>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-900/40">
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> ชำระเงินแล้ว
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {registrations.filter(r => r.payment_status === 'paid').length} คน
            </p>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-rose-900/40">
            <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
              ⭐ ดูแลเป็นพิเศษ
            </span>
            <p className="text-2xl font-black text-rose-400 mt-1">
              {registrations.filter(r => r.is_special_care).length} คน
            </p>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">จัดกลุ่มแล้ว</span>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {registrations.filter(r => r.group_assigned).length} คน
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('applicants')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'applicants'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการผู้สมัคร & ตรวจสอบสลิป/เอกสาร ({registrations.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('payment_settings')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payment_settings'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>ตั้งค่าค่าสมัคร & ระบบแบ่งจ่าย 2 งวด</span>
        </button>

        <button
          onClick={() => handleTabChange('forms')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>แบบทดสอบ & ประเมิน Google Forms</span>
        </button>

        <button
          onClick={() => handleTabChange('announcements')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>ระบบประกาศ & อัปโหลดรูป/PDF ({announcements.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('merchandise')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'merchandise'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shirt className="w-4 h-4 text-rescue-400" />
          <span>จัดการเสื้อ/กางเกง & สแกน QR ({sizeStats.totalShirts} ตัว)</span>
        </button>

        <button
          onClick={() => handleTabChange('speakers')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'speakers'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>วิทยากรประจำโครงการ ({localSpeakers.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('team')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'team'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>คณะดำเนินงาน & ทีมงาน ({localTeam.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>จัดการบัญชีผู้ใช้ ({userAccounts.length})</span>
        </button>
      </div>

      {/* TAB 1: APPLICANTS & ALLOCATION & PROFILE VIEWER */}
      {activeTab === 'applicants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, เบอร์โทร, สังกัด, หมายเหตุ..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending_review">🟡 รอตรวจสลิป ({registrations.filter(r => r.payment_status === 'pending_review').length})</option>
                <option value="unpaid">🔴 ค้างชำระ ({registrations.filter(r => r.payment_status === 'unpaid' || !r.payment_status).length})</option>
                <option value="paid">🟢 ชำระแล้ว ({registrations.filter(r => r.payment_status === 'paid').length})</option>
                <option value="special_care">⭐ ดูแลเป็นพิเศษ ({registrations.filter(r => r.is_special_care).length})</option>
                <option value="no_group">ยังไม่จัดกลุ่ม ({registrations.filter(r => !r.group_assigned).length})</option>
                <option value="has_group">จัดกลุ่มแล้ว ({registrations.filter(r => r.group_assigned).length})</option>
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
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4">ผู้สมัคร & สังกัด</th>
                  <th className="py-4 px-3">สถานะชำระเงิน / สลิป</th>
                  <th className="py-4 px-3">เอกสารแนบ</th>
                  <th className="py-4 px-3">สุขภาพ / หมายเหตุ</th>
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
                    const docs = Array.isArray(reg.requested_docs) ? reg.requested_docs : [];
                    const submittedDocsCount = docs.filter(d => d.file_url).length;

                    return (
                      <tr 
                        key={reg.user_id || reg.id} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          reg.is_special_care ? 'bg-rose-950/10' : ''
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
                                {reg.callsign && (
                                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-mono font-bold">
                                    📡 {reg.callsign}
                                  </span>
                                )}
                                {reg.shirt_size && (
                                  <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-bold">
                                    👕 {reg.shirt_size}
                                  </span>
                                )}
                                {isMsuInstitution(reg.institution) ? (
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
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {reg.institution}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {reg.phone} • {reg.user_email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Payment Status & Slip */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          {reg.payment_plan === 'installment' || reg.installment_1_slip_url || reg.installment_2_slip_url ? (() => {
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
                          })() : paymentStatus === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProfileModal(reg, 'payment')}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> ชำระแล้ว ({reg.payment_amount || (isMsuInstitution(reg.institution) ? 650 : 850)} บ.)
                            </button>
                          ) : paymentStatus === 'pending_review' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProfileModal(reg, 'payment')}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors animate-pulse cursor-pointer"
                            >
                              <Clock className="w-3 h-3" /> รอตรวจสลิป (คลิก)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenProfileModal(reg, 'payment')}
                              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <AlertCircle className="w-3 h-3" /> ค้างชำระ ({reg.payment_amount || (isMsuInstitution(reg.institution) ? 650 : 850)} บ.)
                            </button>
                          )}
                        </td>

                        {/* Documents Status */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          {docs.length > 0 ? (
                            <button
                              onClick={() => handleOpenProfileModal(reg, 'docs')}
                              className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>ส่ง {submittedDocsCount}/{docs.length} รายการ</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenProfileModal(reg, 'docs')}
                              className="text-[10px] text-slate-500 hover:text-slate-300"
                            >
                              + ขอเอกสาร
                            </button>
                          )}
                        </td>

                        {/* Health & Special Notes */}
                        <td className="py-4 px-3 max-w-[170px]">
                          {reg.is_special_care && reg.special_notes ? (
                            <div className="text-rose-300 text-[11px] font-medium line-clamp-2 bg-rose-950/30 p-1.5 rounded-lg border border-rose-900/40">
                              ⚠️ {reg.special_notes}
                            </div>
                          ) : reg.medical_history && reg.medical_history !== 'ไม่มี' ? (
                            <div className="text-amber-300 text-[11px] truncate">
                              🩺 {reg.medical_history}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">ปกติ</span>
                          )}
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
                            <input
                              type="text"
                              value={allocRoom}
                              onChange={e => setAllocRoom(e.target.value)}
                              placeholder="เช่น หอนอน 1 ห้อง 204"
                              className="w-36 px-2.5 py-1.5 bg-slate-950 border border-amber-500 rounded-lg text-xs text-white focus:outline-none"
                            />
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

                              <button
                                onClick={() => handleDeleteReg(reg.user_id, `${reg.first_name} ${reg.last_name}`)}
                                className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 rounded-xl transition-colors"
                                title="ลบข้อมูล"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">
                      👕 ไซส์ {profileModalReg.shirt_size}
                    </span>
                  )}
                  {isMsuInstitution(profileModalReg.institution) ? (
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
                    const isInstallment = profileModalReg.payment_plan === 'installment' || Boolean(profileModalReg.installment_1_slip_url) || Boolean(profileModalReg.installment_2_slip_url);
                    const isR1Paid = profileModalReg.installment_1_status === 'paid';
                    const isR2Paid = profileModalReg.installment_2_status === 'paid' && Boolean(profileModalReg.installment_2_slip_url);
                    const isBothPaid = isR1Paid && isR2Paid;
                    const isMsu = isMsuInstitution(profileModalReg.institution);
                    const round2Amount = isMsu 
                      ? (paymentConfig?.installment_round2_amount_msu || 250) 
                      : (paymentConfig?.installment_round2_amount_external || paymentConfig?.installment_round2_amount || 450);

                    if (isInstallment) {
                      if (isBothPaid || modalPaymentStatus === 'paid') {
                        return (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                            ✓ ชำระครบ 2 งวดแล้ว
                          </span>
                        );
                      }
                      if (isR1Paid) {
                        if (profileModalReg.installment_2_status === 'pending_review') {
                          return (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                              ⏳ รอตรวจสลิปงวดที่ 2 (ชำระงวด 1 แล้ว)
                            </span>
                          );
                        }
                        return (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold">
                            🟡 ชำระงวด 1 แล้ว (ค้างงวด 2: {round2Amount} บ.)
                          </span>
                        );
                      }
                      if (profileModalReg.installment_1_status === 'pending_review') {
                        return (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                            ⏳ รอตรวจสลิปงวดที่ 1
                          </span>
                        );
                      }
                      return (
                        <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold">
                          🔴 ค้างชำระ ({modalPaymentAmount} บ.)
                        </span>
                      );
                    }

                    if (modalPaymentStatus === 'paid') {
                      return (
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                          ✓ ชำระเงินแล้ว
                        </span>
                      );
                    }
                    if (modalPaymentStatus === 'pending_review') {
                      return (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                          ⏳ รอตรวจสลิป
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold">
                        🔴 ค้างชำระ ({modalPaymentAmount} บ.)
                      </span>
                    );
                  })()}
                </div>

                {profileModalReg.full_name_affiliation && (
                  <p className="text-xs text-indigo-300 mt-1 font-semibold">
                    ชื่อ-สกุล (สถาบัน) ไทย/อังกฤษ: <span className="text-slate-200">{profileModalReg.full_name_affiliation}</span>
                  </p>
                )}

                <p className="text-xs text-slate-300 mt-0.5">
                  สังกัด: <span className="text-white font-medium">{profileModalReg.institution}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  อีเมล: {profileModalReg.user_email} • รหัสอ้างอิง: JRE27-{profileModalReg.id?.slice(0, 6).toUpperCase()}
                </p>
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

              {/* Edit Mode Safeguard Toggle */}
              <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
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
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    การจัดการยอดชำระเงินและตรวจสอบสลิป
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                {/* 2-Round Installments Review if participant opted for installments or uploaded installment slips */}
                {(profileModalReg.payment_plan === 'installment' || profileModalReg.installment_1_slip_url || profileModalReg.installment_2_slip_url) ? (
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
                  <h4 className="font-bold text-white text-sm">หลักฐานสลิปการโอนเงิน (ชำระเต็มจำนวน / ทั่วไป)</h4>
                  
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
                      {profileModalReg.payment_plan === 'installment' ? 'ผู้สมัครเลือกแผนแบ่งจ่าย 2 งวด (ดูสลิปด้านบน)' : 'ผู้สมัครยังไม่ได้อัปโหลดสลิปการโอนเงิน'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ADMIN MESSAGING */}
            {profileModalTab === 'messages' && (
              <div className="mt-5 space-y-5 text-xs">
                <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Send className="w-4 h-4 text-purple-400" />
                    ส่งข้อความหรือหมายเหตุตรงไปยัง {profileModalReg.first_name}
                  </h4>

                  <textarea
                    rows="3"
                    required
                    value={newMsgText}
                    onChange={e => setNewMsgText(e.target.value)}
                    placeholder="พิมพ์ข้อความที่ต้องการแจ้ง เช่น ขอแจ้งค้างชำระค่างวดที่ 1 จำนวน 400 บาท หรือค่างวดที่ 2 โปรดโอนเข้าบัญชี SCB 594-264865-5 ... หรือ เอกสารไม่สมบูรณ์..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
                  />

                  {/* Quick message template buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-slate-500 text-[10px] self-center mr-1">ข้อความด่วน:</span>
                    <button
                      type="button"
                      onClick={() => setNewMsgText(`ขอแจ้งเตือนค้างชำระค่าลงทะเบียนโครงการ JRE 2027 จำนวน ${modalPaymentAmount} บาท โปรดโอนเข้าบัญชี ${modalPaymentBank} ภายในวันที่ 31 ต.ค. 2569 พร้อมแนบสลิปผ่านเว็บไซต์นี้`)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-amber-300 rounded-lg border border-slate-800"
                    >
                      + แจ้งค้างชำระค่าสมัคร
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMsgText('ได้รับสลิปการโอนเงินเรียบร้อยแล้ว อยู่ระหว่างการตรวจสอบยอดเงินจากฝ่ายการเงิน')}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-indigo-300 rounded-lg border border-slate-800"
                    >
                      + ได้รับสลิปแล้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMsgText('ฝ่ายการเงินได้ตรวจสอบและยืนยันการชำระเงินค่าลงทะเบียน JRE 2027 เรียบร้อยแล้ว ขอบคุณครับ')}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-emerald-300 rounded-lg border border-slate-800"
                    >
                      + ยืนยันชำระเงินสำเร็จ
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMsgText('โปรดจัดส่งเอกสารสำคัญ (สำเนาบัตรประชาชน / ใบยินยอม) ผ่านระบบอัปโหลดเอกสารบนเว็บไซต์')}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-300 rounded-lg border border-slate-800"
                    >
                      + แจ้งเตือนส่งเอกสาร
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSendingMsg}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      {isSendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>ส่งข้อความถึงผู้สมัคร</span>
                    </button>
                  </div>
                </form>

                  {/* History of messages sent */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-slate-300 text-xs">ประวัติข้อความที่ส่งหาผู้สมัครคนนี้ ({Array.isArray(profileModalReg.admin_messages) ? profileModalReg.admin_messages.length : 0} ข้อความ):</h5>
                    {Array.isArray(profileModalReg.admin_messages) && profileModalReg.admin_messages.length > 0 ? (
                      profileModalReg.admin_messages.map((m, idx) => (
                        <div key={m.id || idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-purple-400">ผู้ดูแลระบบ JRE 2027</span>
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
                            <div className="flex items-center gap-2">
                              <span>{m.created_at ? new Date(m.created_at).toLocaleString('th-TH') : ''}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminMsgFromAdmin(m.id || idx)}
                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="ลบข้อความนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-200 whitespace-pre-line text-xs">{m.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">ยังไม่มีประวัติการส่งข้อความ</p>
                    )}
                  </div>
              </div>
            )}

            {/* TAB 4: REQUESTED DOCUMENTS */}
            {profileModalTab === 'docs' && (
              <div className="mt-5 space-y-6 text-xs">
                {/* Form to Request New Doc */}
                <form onSubmit={handleAddDocRequest} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    ขอเอกสารเพิ่มเติมจาก {profileModalReg.first_name}
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={newDocTitle}
                      onChange={e => setNewDocTitle(e.target.value)}
                      placeholder="ระบุชื่อเอกสาร เช่น สำเนาบัตรประชาชน หรือ สำเนาทะเบียนบ้าน"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />

                    <label className="flex items-center gap-1.5 text-slate-300 shrink-0 px-2">
                      <input
                        type="checkbox"
                        checked={newDocRequired}
                        onChange={e => setNewDocRequired(e.target.checked)}
                        className="rounded"
                      />
                      <span>จำเป็นต้องส่ง</span>
                    </label>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shrink-0"
                    >
                      + ขอเอกสาร
                    </button>
                  </div>

                  {/* Quick Doc suggestions */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-slate-500 text-[10px] self-center mr-1">เอกสารที่พบบ่อย:</span>
                    {['สำเนาบัตรประจำตัวประชาชน', 'สำเนาทะเบียนบ้าน', 'ใบรับรองแพทย์ / ประวัติการรักษา', 'หนังสือยินยอมจากผู้ปกครอง', 'รูปถ่ายขนาด 1 นิ้ว'].map((docName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewDocTitle(docName)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded-lg border border-slate-800"
                      >
                        + {docName}
                      </button>
                    ))}
                  </div>
                </form>

                {/* List of Requested Docs */}
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-300 text-xs">รายการเอกสารที่ร้องขอและสถานะ:</h5>
                  {Array.isArray(profileModalReg.requested_docs) && profileModalReg.requested_docs.length > 0 ? (
                    profileModalReg.requested_docs.map((doc, idx) => (
                      <div key={doc.id || idx} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                            ) : doc.file_url ? (
                              <span className="text-[10px] text-amber-400 font-bold">⏳ ส่งแล้ว รอตรวจ</span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold">ยังไม่ส่ง</span>
                            )}
                          </div>

                          {doc.file_url && (
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                              <span>ไฟล์: {doc.file_name || 'เอกสารแนบ'}</span>
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> เปิดดู
                              </button>
                            </div>
                          )}
                        </div>

                        {doc.file_url && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleVerifyDoc(doc.id, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              ✓ อนุมัติ
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const reason = await askPrompt({
                                  title: 'ระบุเหตุผลที่ให้ส่งเอกสารใหม่',
                                  message: 'แจ้งเหตุผลเพื่อให้ผู้สมัครทราบและแนบเอกสารใหม่:',
                                  defaultValue: 'เอกสารไม่ชัดเจน',
                                  placeholder: 'ระบุเหตุผล...',
                                  variant: 'warning',
                                  confirmText: 'ตกลง',
                                  cancelText: 'ยกเลิก'
                                });
                                if (reason) handleVerifyDoc(doc.id, 'rejected', reason);
                              }}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              ✕ ให้ส่งใหม่
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                              title="เปิดดูเอกสาร"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">ยังไม่มีการขอเอกสารเพิ่มเติมจากผู้สมัครท่านนี้</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </ModalPortal>
    )}

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
                onClick={() => setShowQRScanner(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องสแกน QR รับสินค้า</span>
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
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 truncate">
                รอรับ ณ อาคารพลศึกษา มมส (13 ก.พ. 2570)
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

                {(merchSearchQuery || merchSizeFilter !== 'all' || merchDeliveryFilter !== 'all' || merchPaymentFilter !== 'all' || merchSourceFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMerchSearchQuery('');
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
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                            {item.callsign && item.callsign !== '-' && (
                              <span className="text-sky-300 font-mono font-bold">
                                📡 {item.callsign}
                              </span>
                            )}
                            {item.institution && item.institution !== '-' && (
                              <span className="truncate max-w-[220px]" title={item.institution}>
                                🏛️ {item.institution}
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
                        <div className="md:col-span-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold uppercase">ไซส์เสื้อ:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black text-sm">
                                👕 ไซส์ {item.size}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono font-bold text-xs">
                                x{item.quantity} ตัว
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 truncate" title={item.product_name}>
                            {item.product_name}
                          </p>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400">ยอดเงิน:</span>
                            <span className="font-black text-amber-400 font-mono">
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

      {/* TAB 6: SPEAKERS MANAGEMENT */}
      {activeTab === 'speakers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" />
                Keynote Instructors & Doctors
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                ข้อมูลวิทยากรประจำโครงการ ({localSpeakers.length} ท่าน)
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                แก้ไข เพิ่ม ลบ จัดลำดับ (เลื่อนขึ้น/เลื่อนลง) และอัปโหลดรูปภาพวิทยากรสำหรับการแสดงผลบนหน้าหลัก
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddSpeaker}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มวิทยากรใหม่</span>
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

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
            <span className="text-base">💡</span>
            <span>
              <strong>คำแนะนำ:</strong> สามารถกดปุ่ม <span className="underline font-bold">⬆️ เลื่อนขึ้น</span> หรือ <span className="underline font-bold">⬇️ เลื่อนลง</span> บนการ์ดวิทยากรเพื่อสลับลำดับการแสดงผลในหน้าแรกได้อย่างอิสระ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {localSpeakers.map((spk, idx) => {
              const displayNum = spk.num || idx + 1;
              return (
                <div
                  key={spk.id || idx}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group relative"
                >
                  <div>
                    {/* Header: Number & Reorder buttons */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emergency-600 text-white text-xs font-black flex items-center justify-center shadow">
                          {displayNum}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          วิทยากรลำดับที่ {displayNum}
                        </span>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleMoveSpeakerUp(idx)}
                          disabled={idx === 0}
                          title="เลื่อนขึ้น"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSpeakerDown(idx)}
                          disabled={idx === localSpeakers.length - 1}
                          title="เลื่อนลง"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Photo & Basic Info */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={spk.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(spk.name)}`}
                          alt={spk.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-900"
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
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 mt-2">
                        <span className="text-[10px] text-amber-400 font-bold block mb-0.5">หัวข้อฝึกอบรม:</span>
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
                ตรวจสอบรายชื่อผู้ใช้งานทั้งหมด, บทบาทผู้ใช้ (Role-Based Access), วิธีการยืนยันตัวตน, และการตรวจสอบค่าเข้ารหัสรหัสผ่าน One-Way Cryptographic Hash (SHA-256 + Dynamic Salt 16-byte) ในฐานข้อมูล
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
                title="ส่งออกรายชื่อผู้ใช้และค่าแฮชเป็นไฟล์ Excel (.xlsx)"
              >
                <FileDown className="w-4 h-4 text-emerald-100" />
                <span>ส่งออกรายชื่อผู้ใช้เป็น Excel (.xlsx)</span>
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
                <span className="text-xs font-bold">เกณฑ์ 1: Password Hashed</span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300">
                {userAccounts.filter(u => u.password_hash).length}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">🔒 SHA-256 + 16-byte Dynamic Salt</p>
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
                <span className="text-xs font-bold">อีเมลที่ยืนยันแล้ว</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300">
                {userAccounts.filter(u => Boolean(u.email_verified || u.verified || u.provider === 'google' || u.provider === 'both' || (typeof u.id === 'string' && u.id.startsWith('google_')))).length}
              </div>
              <p className="text-[11px] text-purple-400/80 mt-1">✓ Google OAuth & OTP Verification</p>
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
                <option value="email">Email & Password (มี Password Hash)</option>
                <option value="google">Google OAuth</option>
                <option value="both">Both (Google + Password)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">ผู้ใช้งาน (User Info)</th>
                  <th className="py-3 px-4">อีเมล & สถานะ (Email)</th>
                  <th className="py-3 px-4">ช่องทางยืนยันตัวตน</th>
                  <th className="py-3 px-4">Cryptographic Hash (SHA-256 + Salt)</th>
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
                      return matchName || matchEmail || matchId;
                    }
                    return true;
                  })
                  .map((acc, index) => {
                    const hasPassword = Boolean(acc.password_hash);
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
                            </div>
                          </div>
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
                                <span>✓ ยืนยันอีเมลแล้ว (OTP)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>รอ OTP ยืนยัน</span>
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
                            <button
                              type="button"
                              onClick={() => setSelectedHashUser(acc)}
                              className="group text-left p-2 bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/70 rounded-xl transition-all cursor-pointer block max-w-[220px]"
                              title="คลิกเพื่อตรวจสอบค่า Salt และ Password Hash ตัวเต็ม (เกณฑ์ 1: Password Hashing)"
                            >
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] mb-1">
                                <Lock className="w-3 h-3" />
                                <span>SHA-256 + Salt (16-byte)</span>
                              </div>
                              <div className="font-mono text-[10px] text-slate-400 truncate group-hover:text-emerald-300">
                                Hash: {acc.password_hash.slice(0, 16)}...
                              </div>
                              <div className="font-mono text-[9px] text-slate-500 truncate mt-0.5">
                                Salt: {acc.salt ? `${acc.salt.slice(0, 10)}...` : '-'}
                              </div>
                            </button>
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
                              title="รีเซ็ตรหัสผ่าน (Reset Password with SHA-256 Hashing)"
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

      {/* PASSWORD HASH INSPECTOR MODAL (FOR PROFESSOR INSPECTION) */}
      {selectedHashUser && (
        <ModalPortal isOpen={Boolean(selectedHashUser)} onClose={() => setSelectedHashUser(null)}>
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedHashUser(null)}
          >
            <div 
              className="bg-slate-900 border-2 border-emerald-500/50 max-w-lg w-full rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-4"
              onClick={e => e.stopPropagation()}
            >
            <button
              type="button"
              onClick={() => setSelectedHashUser(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  ตรวจสอบค่า Password Hashing ในฐานข้อมูล
                </h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  (เกณฑ์ที่ 1: การเก็บรหัสผ่านด้วย Password Hashing ตามมาตรฐานสากล)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">บัญชีผู้ใช้:</span>
                <span className="font-mono text-white font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 block">
                  {selectedHashUser.email} (UID: {selectedHashUser.id})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">อัลกอริทึม (Cryptographic Algorithm):</span>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono font-bold inline-block">
                  SHA-256 + 16-byte Dynamic Hex Salt (Web Crypto API)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Dynamic Salt (สุ่มค่าเฉพาะแต่ละบัญชี 16 Bytes Hex):</span>
                <div className="font-mono text-[11px] text-amber-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all select-all">
                  {selectedHashUser.salt || 'N/A'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Stored Password Hash (ผลลัพธ์ Digest ที่จัดเก็บใน Database):</span>
                <div className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30 break-all select-all">
                  {selectedHashUser.password_hash || 'N/A'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedHashUser(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
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
                  ยืนยันอีเมลแล้ว (Email Verified)
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
                <span>🔒 รหัสผ่านใหม่จะถูกนำไปสุ่ม 16-byte Salt และคำนวณ SHA-256 Digest ใหม่ทันทีเมื่อบันทึก</span>
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
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingSpeaker ? 'แก้ไขข้อมูลวิทยากรประจำโครงการ' : 'เพิ่มวิทยากรประจำโครงการใหม่'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ระบุรายละเอียดของวิทยากร ข้อมูลรูปถ่าย และหัวข้อบรรยาย
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSpeakerModal} className="space-y-4">
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
                    placeholder="เช่น รศ.ดร. นพดล เชี่ยวชาญ"
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
                  placeholder="เช่น แพทย์เฉพาะทางเวชศาสตร์ฉุกเฉิน (Emergency Medicine)"
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
                  placeholder="เช่น โรงพยาบาลศูนย์ และอาจารย์แพทย์ / สพฉ."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  หัวข้อฝึกอบรม / บรรยาย
                </label>
                <textarea
                  rows="2"
                  value={speakerFormTopic}
                  onChange={e => setSpeakerFormTopic(e.target.value)}
                  placeholder="เช่น ระบบการแพทย์ฉุกเฉินและการคัดแยกผู้บาดเจ็บหมู่ (Triage)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-[11px] font-bold text-slate-300">
                  รูปถ่ายวิทยากร (Photo)
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูลวิทยากร</span>
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

      {/* ADMIN QR SCANNER MODAL */}
      {showQRScanner && (
        <AdminQRScannerModal
          orders={merchandiseOrders}
          registrations={registrations}
          onClose={() => setShowQRScanner(false)}
          onMarkReceived={onMarkOrderReceived}
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
