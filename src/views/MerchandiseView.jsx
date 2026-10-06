import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shirt, 
  ShoppingBag, 
  Tag, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  ExternalLink, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  Copy, 
  Check, 
  AlertCircle, 
  Phone, 
  User, 
  Mail, 
  MapPin, 
  Search,
  Maximize2,
  X,
  CreditCard,
  ShieldCheck,
  Award,
  ArrowRight,
  HelpCircle,
  Building,
  Calendar,
  Layers,
  CheckCircle
} from 'lucide-react';
import PickupQRModal from '../components/PickupQRModal';
import ModalPortal from '../components/ModalPortal';
import { 
  getRegistrationFeeDetails, 
  isMsuInstitution,
  SHIRT_SIZE_OPTIONS 
} from '../data/defaultData';

export default function MerchandiseView({
  user,
  myRegistration,
  merchandiseConfig,
  orders = [],
  onSaveOrder,
  onOpenGoogleLogin,
  onNavigateRegister,
  initialTab = 'catalog',
  onTabChange
}) {
  const isRegistered = Boolean(myRegistration);

  // Active Tab state: strictly 2 tabs ('catalog' | 'my_orders')
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === 'my_orders' || initialTab === 'cart' || initialTab === 'orders') {
      return 'my_orders';
    }
    return 'catalog';
  });

  // Sync activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab === 'my_orders' || initialTab === 'cart' || initialTab === 'orders') {
      setActiveTab('my_orders');
    } else if (initialTab === 'catalog') {
      setActiveTab('catalog');
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    const validTab = (tab === 'my_orders' || tab === 'cart' || tab === 'orders') ? 'my_orders' : 'catalog';
    setActiveTab(validTab);
    if (onTabChange) {
      onTabChange(validTab);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'shirt' | 'pants'
  const [activePickupOrder, setActivePickupOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [sizeChartModal, setSizeChartModal] = useState(null);
  const [feeExplainerTab, setFeeExplainerTab] = useState('all'); // 'all' | 'msu' | 'external'

  // Search in my orders
  const [orderSearchQuery, setOrderSearchQuery] = useState(user?.email || '');

  // Keep search query updated if user logs in
  useEffect(() => {
    if (user && !orderSearchQuery) {
      setOrderSearchQuery(user.email || '');
    }
  }, [user]);

  const products = merchandiseConfig?.products || [];
  const googleForm = merchandiseConfig?.google_form;

  // Filter products by visibility
  const enabledProducts = products.filter(p => p.enabled !== false);
  const enabledShirts = products.filter(p => p.enabled !== false && p.category === 'shirt');
  const enabledPants = products.filter(p => p.enabled !== false && p.category === 'pants');

  const filteredProducts = products.filter(p => {
    if (p.enabled === false) return false;
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  // Fee details for current registered applicant
  const applicantFeeInfo = useMemo(() => {
    if (!myRegistration) return null;
    return getRegistrationFeeDetails(myRegistration.institution);
  }, [myRegistration]);

  const msuFeeDetails = useMemo(() => getRegistrationFeeDetails('มหาวิทยาลัยมหาสารคาม (มมส)'), []);
  const externalFeeDetails = useMemo(() => getRegistrationFeeDetails('ต่างมหาวิทยาลัย'), []);

  // Construct Digital Pickup Pass for applicant's official shirt
  const applicantShirtOrder = useMemo(() => {
    if (!myRegistration) return null;
    const fee = applicantFeeInfo || msuFeeDetails;
    const isMsu = fee.isMsu;
    const isRound1Paid = myRegistration.installment_1_status === 'paid' || myRegistration.payment_status === 'paid';
    const isRound2Paid = myRegistration.installment_2_status === 'paid' || myRegistration.payment_status === 'paid';
    const isFullyPaid = (myRegistration.payment_plan === 'installment' && isRound1Paid && isRound2Paid) ||
                        (myRegistration.payment_plan !== 'installment' && myRegistration.payment_status === 'paid');

    const orderNumber = `JRE27-SHIRT-${(myRegistration.id || myRegistration.user_id || 'REG').slice(0, 6).toUpperCase()}`;

    return {
      id: `reg_shirt_${myRegistration.id || myRegistration.user_id}`,
      order_number: orderNumber,
      user_email: myRegistration.user_email || user?.email || '',
      customer_name: myRegistration.full_name_affiliation || `${myRegistration.first_name || ''} ${myRegistration.last_name || ''}`.trim(),
      customer_phone: myRegistration.phone || '',
      pickup_method: 'pickup',
      pickup_location: 'อาคารพลศึกษา มหาวิทยาลัยมหาสารคาม (13 ก.พ. 2570)',
      payment_status: isFullyPaid ? 'paid_verified' : (isRound1Paid ? 'paid_verified' : 'pending_verification'),
      pickup_status: myRegistration.shirt_pickup_status || 'pending',
      total_amount: fee.totalFee,
      is_msu: isMsu,
      shirt_size: myRegistration.shirt_size || 'L',
      callsign: myRegistration.callsign || '-',
      nickname: myRegistration.nickname || '-',
      institution: myRegistration.institution || '-',
      payment_plan: myRegistration.payment_plan || 'installment',
      installment_1_status: myRegistration.installment_1_status || 'unpaid',
      installment_2_status: myRegistration.installment_2_status || 'unpaid',
      isFullyPaid,
      items: [
        {
          product_name: 'เสื้อปฏิบัติการกู้ภัย JRE 2027 (คอเต่าซิป แขนสั้น เทา-ดำ)',
          size: myRegistration.shirt_size || 'L',
          color: 'สีเทาตัดดำ (Official Tactical Gray-Black)',
          quantity: 1,
          unit_price: 400
        }
      ],
      created_at: myRegistration.created_at || new Date().toISOString()
    };
  }, [myRegistration, applicantFeeInfo, msuFeeDetails, user]);

  // Filter external / past merchandise orders
  const searchedOrders = orders.filter(o => {
    if (!orderSearchQuery.trim()) return false;
    const q = orderSearchQuery.trim().toLowerCase();
    return (
      (o.user_email && o.user_email.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.includes(q)) ||
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-rescue-950/40 to-slate-900 border border-rescue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rescue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-rescue-500/20 text-rescue-400 border border-rescue-500/40">
              <Shirt className="w-3.5 h-3.5" />
              <span>OFFICIAL APPAREL & MERCHANDISE • JRE 2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              เสื้อปฏิบัติการกู้ภัย JRE 2027
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              เครื่องแบบเสื้อฝึกทางการโครงการ Joint Response Exercise 2027 มหาวิทยาลัยมหาสารคาม 
              (สั่งซื้อรวมในขั้นตอนการสมัคร • จัดทำแบบพรีออเดอร์ • พร้อมระบบออกบัตรรับเสื้อดิจิทัล QR Code)
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {isRegistered ? (
              <button
                onClick={() => handleTabChange('my_orders')}
                className="px-4 py-3 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl shadow-rescue-600/30 transition-all active:scale-95 cursor-pointer border border-rescue-400/40"
              >
                <QrCode className="w-4 h-4" />
                <span>คำสั่งซื้อของฉัน & QR รับของ</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateRegister && onNavigateRegister()}
                className="px-5 py-3 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rescue-600/30 transition-all active:scale-95 cursor-pointer border border-amber-400/40"
              >
                <Shirt className="w-4 h-4" />
                <span>สมัครเข้าร่วมโครงการ & สั่งเสื้อ (ขั้นตอนที่ 2)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BACKUP GOOGLE FORM BANNER (If enabled by Admin) */}
      {googleForm?.enabled && googleForm?.url && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/60 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {googleForm.title || 'แบบฟอร์มสำรอง Google Form (JRE 2027)'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-bold">
                  เปิดระบบสำรอง
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {googleForm.description || 'กรณีไม่สะดวกกรอกผ่านเว็บไซต์ สามารถใช้แบบฟอร์ม Google Form สำรองได้'}
              </p>
            </div>
          </div>

          <a
            href={googleForm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>เปิด Google Forms สำรอง</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* UNIFIED INTEGRATION NOTICE: Shirt Order is part of Project Registration */}
      <div className="bg-gradient-to-r from-orange-950/80 via-slate-900 to-amber-950/80 border-2 border-orange-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>ระบบสั่งซื้อเสื้อและระบบสมัครเป็นระบบเดียวกัน</span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">
              👕 สั่งซื้อเสื้อฝึก JRE 2027 พร้อมการสมัครเข้าร่วมโครงการ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              การจัดทำเสื้อโครงการทางการนี้จัดทำแบบ <strong className="text-amber-300 font-bold">พรีออเดอร์ (Pre-Order) ตามขนาดไซส์จริงที่ผู้สมัครเลือกในขั้นตอนที่ 2</strong> 
              โดยค่าจัดทำเสื้อจำนวน <strong className="text-white font-bold">400 บาท ถูกรวมอยู่ในการชำระค่าสมัครรอบที่ 1</strong> (15–20 ต.ค. 2569) 
              ไม่มีการเปิดสั่งซื้อแยกหรือชำระเงินแยกต่างหาก
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {isRegistered ? (
              <button
                onClick={() => handleTabChange('my_orders')}
                className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
              >
                <QrCode className="w-4 h-4" />
                <span>ดูบัตรรับเสื้อ & QR Code ของท่าน</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateRegister && onNavigateRegister()}
                className="px-6 py-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-amber-400 text-white font-black rounded-2xl shadow-xl shadow-rescue-600/30 text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer border border-amber-400/40"
              >
                <Shirt className="w-5 h-5" />
                <span>ไปกรอกใบสมัคร & เลือกไซส์เสื้อ (ขั้นตอนที่ 2)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS: STRICTLY 2 TABS */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-rescue-500 text-rescue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>ตัวอย่างรูปเสื้อ & ตารางไซส์เสื้อ (S–5XL)</span>
        </button>

        <button
          onClick={() => handleTabChange('my_orders')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
            activeTab === 'my_orders'
              ? 'border-rescue-500 text-rescue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>คำสั่งซื้อของฉัน & QR รับของ</span>
          {isRegistered && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CATALOG (ตัวอย่างรูปเสื้อ & ตารางไซส์เสื้อ S-5XL + ตารางค่าใช้จ่าย มมส vs นอก)
          ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">

          {/* 🌟 INTERACTIVE FEE BREAKDOWN WIDGET: MSU vs NON-MSU */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1">
                  <span>💰 ข้อมูลค่าสมัคร & ค่าเสื้อโครงการ</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>โครงสร้างค่าใช้จ่าย: นิสิต มมส กับ ต่างมหาวิทยาลัย</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ระบบแบ่งค่าใช้จ่ายชัดเจน ค่าเสื้อ 400 บาท รวมในงวดที่ 1 สำหรับทุกสถาบัน
                </p>
              </div>

              {/* Toggle Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFeeExplainerTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    feeExplainerTab === 'all'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  เปรียบเทียบทั้ง 2 สถาบัน
                </button>
                <button
                  type="button"
                  onClick={() => setFeeExplainerTab('msu')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    feeExplainerTab === 'msu'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <span>🎓 นิสิต มมส (650.-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeeExplainerTab('external')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    feeExplainerTab === 'external'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-indigo-300'
                  }`}
                >
                  <span>🏨 ต่างสถาบัน (850.-)</span>
                </button>
              </div>
            </div>

            {/* Fee Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CARD 1: นิสิตมหาวิทยาลัยมหาสารคาม (มมส) */}
              {(feeExplainerTab === 'all' || feeExplainerTab === 'msu') && (
                <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  myRegistration && isMsuInstitution(myRegistration.institution)
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-lg'
                    : 'bg-slate-950/70 border-emerald-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <span>🎓</span> สำหรับนิสิต มมส เท่านั้น
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                        นิสิตมหาวิทยาลัยมหาสารคาม (มมส)
                      </h4>
                      <p className="text-[11px] text-emerald-300/80 mt-0.5">
                        ไม่มีค่าใช้จ่ายด้านที่พัก • รวมค่าเสื้อโครงการ
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                        650 <span className="text-xs font-normal text-slate-400">บาท</span>
                      </span>
                      <span className="block text-[10px] text-slate-400">ยอดรวมทั้งโครงการ</span>
                    </div>
                  </div>

                  {/* 2-Round Breakdown for MSU */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px]">งวดที่ 1 (รอบสมัคร)</span>
                        <span className="font-mono font-black text-amber-300 text-sm">400.-</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        ค่าจัดทำเสื้อโครงการแบบพรีออเดอร์ (15–20 ต.ค. 69)
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 text-[11px]">งวดที่ 2 (รอบสอง)</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">250.-</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        ค่าอาหารและกิจกรรมตลอดโครงการ (1–5 พ.ย. 69)
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>💡 หากเลือกจ่ายครั้งเดียว:</span>
                    <strong className="text-white">650 บาท (จ่ายครบในขั้นตอนที่ 3)</strong>
                  </div>
                </div>
              )}

              {/* CARD 2: ต่างมหาวิทยาลัย / บุคคลภายนอก */}
              {(feeExplainerTab === 'all' || feeExplainerTab === 'external') && (
                <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  myRegistration && !isMsuInstitution(myRegistration.institution)
                    ? 'bg-indigo-950/30 border-indigo-500/60 ring-2 ring-indigo-500/20 shadow-lg'
                    : 'bg-slate-950/70 border-indigo-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                        <span>🏨</span> ผู้เข้าร่วมจากสถาบันอื่น
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                        ต่างมหาวิทยาลัย / บุคคลภายนอก
                      </h4>
                      <p className="text-[11px] text-indigo-300/80 mt-0.5">
                        รวมค่าที่พักหอพักกุดรัง มมส & ค่าเสื้อโครงการ
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">
                        850 <span className="text-xs font-normal text-slate-400">บาท</span>
                      </span>
                      <span className="block text-[10px] text-slate-400">ยอดรวมทั้งโครงการ</span>
                    </div>
                  </div>

                  {/* 2-Round Breakdown for External */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px]">งวดที่ 1 (รอบสมัคร)</span>
                        <span className="font-mono font-black text-amber-300 text-sm">400.-</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        ค่าจัดทำเสื้อโครงการแบบพรีออเดอร์ (15–20 ต.ค. 69)
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 text-[11px]">งวดที่ 2 (รอบสอง)</span>
                        <span className="font-mono font-black text-indigo-400 text-sm">450.-</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        รวมค่าที่พักหอกุดรัง มมส และค่าอาหาร (1–5 พ.ย. 69)
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>💡 หากเลือกจ่ายครั้งเดียว:</span>
                    <strong className="text-white">850 บาท (จ่ายครบในขั้นตอนที่ 3)</strong>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Category Filter Pills & Size Chart Quick Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-rescue-600 text-white shadow-md shadow-rescue-600/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                ทั้งหมด ({enabledProducts.length})
              </button>
              <button
                onClick={() => setSelectedCategory('shirt')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'shirt'
                    ? 'bg-rescue-600 text-white shadow-md shadow-rescue-600/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>เสื้อปฏิบัติการกู้ภัย ({enabledShirts.length})</span>
              </button>
              <button
                onClick={() => setSelectedCategory('pants')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'pants'
                    ? 'bg-rescue-600 text-white shadow-md shadow-rescue-600/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>กางเกงฝึกยุทธวิธี ({enabledPants.length})</span>
                {enabledPants.length === 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded-full font-bold">
                    เร็วๆ นี้
                  </span>
                )}
              </button>
            </div>

            {/* Direct Official Size Chart Button */}
            <button
              onClick={() => setSizeChartModal(products[0] || true)}
              className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rescue-950/60 hover:to-slate-900 text-rescue-400 hover:text-rescue-300 border border-rescue-500/40 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <span>📐 ตารางไซส์เสื้อ (Size Chart S-10XL)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Registered Applicant Badge Notification */}
          {isRegistered && myRegistration && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Shirt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black">
                      ✓ มีรายการสั่งเสื้อในใบสมัครแล้ว
                    </span>
                    <span className="text-xs text-white font-black">
                      ไซส์ {myRegistration.shirt_size || 'L'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ผู้สั่ง: <strong className="text-white">{myRegistration.full_name_affiliation || `${myRegistration.first_name} ${myRegistration.last_name}`}</strong> 
                    ({myRegistration.institution}) • รวมในค่าสมัครรอบที่ 1 เรียบร้อย
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTabChange('my_orders')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>ดูบัตรรับเสื้อ & QR Code</span>
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-amber-400 border border-slate-700/80 flex items-center justify-center mx-auto shadow-inner">
                {selectedCategory === 'pants' ? <Tag className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black inline-block">
                  🔒 สินค้าหมวดนี้ยังไม่เปิดจำหน่าย
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedCategory === 'pants' 
                    ? 'สินค้าหมวดกางเกงยังไม่เปิดจำหน่ายในรอบนี้' 
                    : 'ไม่พบรายการสินค้าในหมวดหมู่นี้'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ทางคณะทำงานโครงการ JRE 2027 เปิดรับเฉพาะเสื้อปฏิบัติการกู้ภัยทางการเป็นหลัก โดยรวมอยู่ในขั้นตอนการสมัครเข้าร่วมโครงการ
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory('shirt')}
                className="px-5 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <Shirt className="w-4 h-4" />
                <span>ไปเลือกดูเสื้อปฏิบัติการกู้ภัย</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => (
                <ProductCardShowcase
                  key={product.id}
                  product={product}
                  isRegistered={isRegistered}
                  myRegistration={myRegistration}
                  onNavigateRegister={onNavigateRegister}
                  onViewOrders={() => handleTabChange('my_orders')}
                  onPreviewImage={setPreviewImage}
                  onOpenSizeChart={() => setSizeChartModal(product)}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 2: MY ORDERS & QR PICKUP (คำสั่งซื้อของฉัน & QR รับของ)
          ========================================================================= */}
      {activeTab === 'my_orders' && (
        <div className="space-y-6">

          {/* 1. PRIMARY: REGISTERED APPLICANT'S OFFICIAL SHIRT ORDER PASS */}
          {applicantShirtOrder ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rescue-950/40 border-2 border-rescue-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rescue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-rescue-500/20 text-rescue-400 border border-rescue-500/40 rounded-full text-xs font-black">
                      📦 คำสั่งซื้อเสื้อในใบสมัครโครงการ JRE 2027
                    </span>
                    <span className="font-mono text-xs font-black text-amber-300">
                      {applicantShirtOrder.order_number}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    บัตรรับเสื้อโครงการ & ดิจิทัล QR Code
                  </h3>
                  <p className="text-xs text-slate-300">
                    แสดงบัตรนี้ต่อเจ้าหน้าที่ ณ วันรายงานตัวเปิดโครงการ วันที่ 13 ก.พ. 2570
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
                  {applicantShirtOrder.isFullyPaid ? (
                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow">
                      <CheckCircle2 className="w-4 h-4" /> ชำระครบถ้วน 2 งวดแล้ว
                    </span>
                  ) : applicantShirtOrder.installment_1_status === 'paid' ? (
                    <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow">
                      <CheckCircle2 className="w-4 h-4" /> งวด 1 ชำระแล้ว (รอชำระงวด 2)
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow animate-pulse">
                      <Clock className="w-4 h-4" /> รอตรวจสอบการชำระเงิน
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {applicantShirtOrder.is_msu ? '🎓 สังกัดนิสิต มมส (650 บ.)' : '🏨 ต่างมหาวิทยาลัย (850 บ.)'}
                  </span>
                </div>
              </div>

              {/* Order Card Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Shirt Image Thumbnail & Zoom */}
                <div className="md:col-span-4 flex flex-col items-center space-y-3">
                  <div 
                    onClick={() => setPreviewImage('/images/merchandise/jre_shirt_official.jpg')}
                    className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 cursor-pointer group shadow-xl"
                  >
                    <img
                      src="/images/merchandise/jre_shirt_official.jpg"
                      alt="เสื้อฝึก JRE 2027"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>คลิกดูภาพขยาย</span>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/90 rounded-lg text-[11px] font-bold text-rescue-400 border border-slate-700">
                      คอเต่าซิป แขนสั้น เทา-ดำ
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ขนาดไซส์เสื้อ:</span>
                      <strong className="text-base text-amber-300 font-black">
                        ไซส์ {applicantShirtOrder.shirt_size}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">รหัสนามเรียกขาน:</span>
                      <strong className="text-xs text-sky-300 font-mono font-bold block truncate">
                        {applicantShirtOrder.callsign}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ผู้สั่งจอง:</span>
                      <strong className="text-xs text-white font-bold block truncate">
                        {applicantShirtOrder.customer_name}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-0.5">สถานที่รับของ:</span>
                      <strong className="text-xs text-slate-200 block truncate" title="อาคารพลศึกษา มหาวิทยาลัยมหาสารคาม">
                        อาคารพลศึกษา มมส
                      </strong>
                    </div>
                  </div>

                  {/* Fee status & 2-round check */}
                  <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-rescue-400" />
                        <span>การชำระเงินค่าสมัครและเสื้อ (2 งวด):</span>
                      </span>
                      <span className="text-amber-400 font-mono">
                        {applicantShirtOrder.total_amount} บาท (รวมทั้งสิ้น)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">งวดที่ 1 (ค่าเสื้อ): 400 บ.</span>
                        {applicantShirtOrder.installment_1_status === 'paid' ? (
                          <span className="text-emerald-400 font-bold">✓ ชำระแล้ว</span>
                        ) : (
                          <span className="text-amber-400 font-bold">⏳ รอตรวจ/ค้าง</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">
                          งวดที่ 2 ({applicantShirtOrder.is_msu ? 'มมส' : 'ต่างสถาบัน'}): {applicantShirtOrder.is_msu ? '250' : '450'} บ.
                        </span>
                        {applicantShirtOrder.installment_2_status === 'paid' ? (
                          <span className="text-emerald-400 font-bold">✓ ชำระแล้ว</span>
                        ) : (
                          <span className="text-amber-400 font-bold">⏳ รอตรวจ/ค้าง</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button: Open QR Pickup Pass Modal */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePickupOrder(applicantShirtOrder)}
                      className="flex-1 py-3.5 px-5 bg-gradient-to-r from-rescue-600 via-orange-600 to-amber-600 hover:from-rescue-500 hover:to-amber-500 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-rescue-600/30 transition-all active:scale-95 cursor-pointer"
                    >
                      <QrCode className="w-5 h-5" />
                      <span>เปิดบัตร Digital Pickup Pass (QR Code) รับเสื้อ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateRegister && onNavigateRegister()}
                      className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer active:scale-95"
                    >
                      <User className="w-4 h-4" />
                      <span>ดูรายละเอียดในใบสมัคร</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl text-rescue-400 flex items-center justify-center mx-auto border border-slate-700">
                <Shirt className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-black text-white">
                  ยังไม่พบข้อมูลการสั่งจองเสื้อของท่าน
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  เนื่องจากระบบสั่งซื้อเสื้อรวมอยู่ในขั้นตอนการสมัครเข้าร่วมโครงการ JRE 2027 หากท่านยังไม่ได้สมัคร กรุณาสมัครเพื่อเลือกไซส์เสื้อได้ทันที
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateRegister && onNavigateRegister()}
                className="px-6 py-3 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white font-black rounded-xl text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
              >
                <Shirt className="w-4 h-4" />
                <span>ไปกรอกใบสมัคร & สั่งเสื้อ (ขั้นตอนที่ 2)</span>
              </button>
            </div>
          )}

          {/* 2. SECONDARY: SEARCH OTHER / LEGACY ORDERS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-rescue-400" />
                  <span>ค้นหาออเดอร์ด้วยอีเมล หรือ เบอร์โทรศัพท์</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ค้นหาประวัติออเดอร์สินค้าอื่นหรือรหัสออเดอร์ในระบบ
                </p>
              </div>

              {/* Search input */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="พิมพ์อีเมล หรือ เบอร์โทร..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                />
              </div>
            </div>

            {/* List of matched legacy orders */}
            {searchedOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchedOrders.map((ord) => {
                  const isVerified = ord.payment_status === 'paid_verified';
                  const isReceived = ord.pickup_status === 'received';

                  return (
                    <div
                      key={ord.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg space-y-3 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-rescue-400">
                              {ord.order_number}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(ord.created_at).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {ord.customer_name} ({ord.customer_phone})
                          </h4>
                        </div>

                        {isReceived ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] rounded-full font-bold flex items-center gap-1">
                            <PackageCheck className="w-3 h-3" /> รับสินค้าแล้ว
                          </span>
                        ) : isVerified ? (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] rounded-full font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> รอตรวจสลิป
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
                        {ord.items?.map((it, i) => (
                          <div key={i} className="flex justify-between text-slate-300 text-[11px]">
                            <span className="truncate pr-2">• {it.product_name} ({it.size})</span>
                            <span className="font-bold text-white shrink-0">x{it.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-xs text-white">
                          <span>ยอดรวม:</span>
                          <span className="text-rescue-400">{ord.total_amount} บาท</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActivePickupOrder(ord)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>แสดง QR Code รับของ</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : orderSearchQuery ? (
              <p className="text-xs text-slate-500 text-center py-4">
                ไม่พบคำสั่งซื้ออื่นที่ตรงกับ '{orderSearchQuery}'
              </p>
            ) : null}
          </div>

        </div>
      )}

      {/* SIZE CHART MODAL */}
      {sizeChartModal && (
        <ModalPortal isOpen={Boolean(sizeChartModal)} onClose={() => setSizeChartModal(null)}>
          <div 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSizeChartModal(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSizeChartModal(null)}
                className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rescue-500/20 text-rescue-400 border border-rescue-500/40">
                <Shirt className="w-3 h-3" />
                <span>OFFICIAL SIZE CHART • JRE 2027</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                <span>ตารางไซส์เสื้อ Joint Response Exercise (JRE 2027)</span>
              </h3>
              <p className="text-xs text-slate-400">
                “ใส่สบาย เคลื่อนไหวคล่องตัว พร้อมลุยทุกภารกิจ” • ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม
              </p>
            </div>

            {/* Image Preview Banner */}
            <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group">
              <img
                src="/images/merchandise/jre_shirt_size_chart.jpg"
                alt="ตารางไซส์เสื้อ JRE 2027"
                className="w-full h-auto object-contain max-h-64 sm:max-h-80 mx-auto group-hover:scale-[1.02] transition-transform duration-300"
              />
              <button
                type="button"
                onClick={() => setPreviewImage('/images/merchandise/jre_shirt_size_chart.jpg')}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-rescue-600 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>คลิกดูภาพขยายใหญ่</span>
              </button>
            </div>

            {/* Structured Tables (Standard S-5XL & Special 6XL-10XL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
              
              {/* Table 1: Standard S - 5XL */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-black text-rescue-400 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rescue-500"></span>
                    <span>ไซส์มาตรฐาน (S - 5XL)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">หน่วย: นิ้ว</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/80 text-[11px]">
                      <th className="py-1 px-1.5">ไซส์</th>
                      <th className="py-1 px-1.5 text-center">รอบอก</th>
                      <th className="py-1 px-1.5 text-center">ยาว</th>
                      <th className="py-1 px-1.5 text-right">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {[
                      { s: 'S', c: '36"', l: '26"', p: 'รอบ 1 (400.-)' },
                      { s: 'M', c: '38"', l: '27"', p: 'รอบ 1 (400.-)' },
                      { s: 'L', c: '40"', l: '28"', p: 'รอบ 1 (400.-)' },
                      { s: 'XL', c: '42"', l: '29"', p: 'รอบ 1 (400.-)' },
                      { s: '2XL', c: '44"', l: '30"', p: 'รอบ 1 (400.-)' },
                      { s: '3XL', c: '46"', l: '31"', p: 'รอบ 1 (400.-)' },
                      { s: '4XL', c: '48"', l: '32"', p: 'รอบ 1 (400.-)' },
                      { s: '5XL', c: '50"', l: '33"', p: 'รอบ 1 (400.-)' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-1.5 px-1.5 font-black text-white">{row.s}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono">{row.c}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono">{row.l}</td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-[11px] text-slate-400">
                          {row.p}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table 2: Special Sizes 6XL - 10XL */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-black text-amber-400 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>ไซส์พิเศษ (6XL - 10XL)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">หน่วย: นิ้ว</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/80 text-[11px]">
                      <th className="py-1 px-1.5">ไซส์</th>
                      <th className="py-1 px-1.5 text-center">รอบอก</th>
                      <th className="py-1 px-1.5 text-center">ยาว</th>
                      <th className="py-1 px-1.5 text-right">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {[
                      { s: '6XL', c: '52"', l: '34"', p: 'สั่งตัดพิเศษ' },
                      { s: '7XL', c: '54"', l: '35"', p: 'สั่งตัดพิเศษ' },
                      { s: '8XL', c: '56"', l: '36"', p: 'สั่งตัดพิเศษ' },
                      { s: '9XL', c: '58"', l: '37"', p: 'สั่งตัดพิเศษ' },
                      { s: '10XL', c: '60"', l: '38"', p: 'สั่งตัดพิเศษ' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-1.5 px-1.5 font-black text-amber-300">{row.s}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono">{row.c}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono">{row.l}</td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-amber-400 text-[11px]">
                          {row.p}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 space-y-0.5 mt-2">
                  <p className="font-bold">📢 ติดต่อผู้จัดโครงการสำหรับไซส์พิเศษ</p>
                  <p className="text-slate-400">โทร 098-329-6762 เพื่อระบุขนาดเพิ่มเติม</p>
                </div>
              </div>

            </div>

            {/* Measuring Advice Callout */}
            <div className="mt-3.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>คำแนะนำการวัดไซส์:</span>
              </span>
              <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                <li>หน่วยวัดเป็น <span className="text-white font-bold">“นิ้ว” (Inches)</span></li>
                <li>ขนาดอาจคลาดเคลื่อนเล็กน้อย (±1 นิ้ว) จากขั้นตอนการตัดเย็บ</li>
                <li>แนะนำวัดรอบอกจริงของตนเองก่อนระบุในขั้นตอนที่ 2 ของใบสมัคร</li>
              </ul>
            </div>

            {/* Footer Buttons */}
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                “ร่วมเป็นส่วนหนึ่งของภารกิจเพื่อช่วยเหลือสังคม • JRE 2027”
              </span>
              <button
                type="button"
                onClick={() => setSizeChartModal(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all ml-auto cursor-pointer active:scale-95"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
          </div>
        </ModalPortal>
      )}

      {/* DIGITAL PICKUP PASS MODAL */}
      {activePickupOrder && (
        <PickupQRModal
          order={activePickupOrder}
          onClose={() => setActivePickupOrder(null)}
        />
      )}

      {/* FULL PHOTO PREVIEW MODAL */}
      {previewImage && (
        <ModalPortal isOpen={Boolean(previewImage)} onClose={() => setPreviewImage(null)}>
          <div 
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          >
            <div className="relative max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}

// PRODUCT CARD SHOWCASE SUB-COMPONENT (NO ADD-TO-CART, NO BUY-NOW)
function ProductCardShowcase({ 
  product, 
  isRegistered,
  myRegistration,
  onNavigateRegister, 
  onViewOrders,
  onPreviewImage, 
  onOpenSizeChart 
}) {
  const sizes = product.sizes || [];
  const colors = product.colors || ['สีเทาตัดดำ (Official Tactical Gray-Black)'];
  const [selectedSize, setSelectedSize] = useState(sizes[0] || { name: 'M', chest: '38 นิ้ว', length: '27 นิ้ว' });
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [activePhoto, setActivePhoto] = useState(product.image);

  React.useEffect(() => {
    setActivePhoto(product.image);
  }, [product.image]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
      
      {/* Top: Image & Info */}
      <div className="space-y-3.5">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-slate-800 group">
          <img
            src={activePhoto || product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={() => onPreviewImage(activePhoto || product.image)}
            className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur-sm transition-colors shadow cursor-pointer"
            title="ดูรูปขยายใหญ่"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap drop-shadow-md">
            <span className="px-3 py-1.5 bg-slate-950/95 backdrop-blur-md rounded-full border border-slate-700/80 text-xs font-black text-white shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50 shrink-0"></span>
              <span>{product.category === 'shirt' ? 'เสื้อปฏิบัติการกู้ภัยทางการ' : 'กางเกงกู้ภัย'}</span>
            </span>
            <span className="px-3 py-1.5 bg-amber-400 text-slate-950 shadow-lg rounded-full border border-amber-300 text-xs font-black flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>สั่งพรีออเดอร์พร้อมสมัคร</span>
            </span>
          </div>
        </div>

        {/* Thumbnail gallery if multiple images */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhoto(img)}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activePhoto === img ? 'border-rescue-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-black text-white">{product.name}</h3>
            <div className="text-right shrink-0">
              <span className="text-lg sm:text-xl font-black text-rescue-400">
                400 <span className="text-xs font-normal text-slate-400">บาท (รวมในรอบ 1)</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Size Selection Grid to explore measurements */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400">
              ตัวอย่างขนาดไซส์ (S-5XL):
            </label>
            <button
              type="button"
              onClick={onOpenSizeChart}
              className="text-[11px] font-bold text-rescue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>📐 ตารางขนาดแบบเต็ม (S-10XL)</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
            {sizes.slice(0, 8).map((sz, i) => {
              const isSelected = selectedSize.name === sz.name;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rescue-950/50 border-rescue-500 text-white ring-1 ring-rescue-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-black">{sz.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    อก {sz.chest?.replace(' นิ้ว', '') || '-'}"
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action: Linked strictly to Registration */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        {isRegistered ? (
          <div className="space-y-2">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-white">
                  ท่านสั่งจอง: <strong className="text-amber-300 font-bold">ไซส์ {myRegistration?.shirt_size || 'L'}</strong> ในใบสมัครแล้ว
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">รวมในค่าสมัครแล้ว</span>
            </div>

            <button
              type="button"
              onClick={onViewOrders}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>ดูบัตรรับเสื้อ & ดิจิทัล QR Code รับของ</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigateRegister && onNavigateRegister()}
              className="w-full py-3 px-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-amber-400 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rescue-600/25 transition-all active:scale-95 cursor-pointer border border-amber-400/30"
            >
              <Shirt className="w-4 h-4" />
              <span>สั่งซื้อเสื้อในขั้นตอนที่ 2 ของการสมัคร (ไปที่หน้าสมัคร)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              🔒 เสื้อฝึกจัดทำแบบพรีออเดอร์ ชำระค่าเสื้อ 400 บาท รวมในค่าสมัครรอบที่ 1
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
