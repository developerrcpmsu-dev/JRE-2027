import React, { useState, useEffect } from 'react';
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
  Plus, 
  Minus, 
  Trash2, 
  Upload, 
  Eye, 
  Copy, 
  Check, 
  AlertCircle, 
  Phone, 
  User, 
  Mail, 
  MapPin, 
  Truck, 
  Search,
  Maximize2,
  X,
  CreditCard,
  ShieldCheck,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PickupQRModal from '../components/PickupQRModal';

export default function MerchandiseView({
  user,
  merchandiseConfig,
  orders = [],
  onSaveOrder,
  onOpenGoogleLogin,
  onNavigateRegister,
  initialTab = 'catalog',
  onTabChange
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'catalog'); // 'catalog' | 'cart' | 'my_orders'

  // Sync activeTab when initialTab changes from URL
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'shirt' | 'pants'
  const [cart, setCart] = useState([]);
  const [activePickupOrder, setActivePickupOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [sizeChartModal, setSizeChartModal] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedPromptpay, setCopiedPromptpay] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [pickupMethod, setPickupMethod] = useState('pickup'); // 'pickup' | 'shipping'
  const [shippingAddress, setShippingAddress] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  // Search in my orders
  const [orderSearchQuery, setOrderSearchQuery] = useState(user?.email || '');

  // Keep customer name/email updated if user logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
      if (!orderSearchQuery) setOrderSearchQuery(user.email || '');
    }
  }, [user]);

  const products = merchandiseConfig?.products || [];
  const googleForm = merchandiseConfig?.google_form;
  const payment = merchandiseConfig?.payment || {
    bank_name: 'ธนาคารกรุงไทย',
    account_number: '984-0-12345-6',
    account_name: 'ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม',
    promptpay: '098-765-4321'
  };

  // Filter products by visibility (enabled !== false) and category
  const enabledProducts = products.filter(p => p.enabled !== false);
  const enabledShirts = products.filter(p => p.enabled !== false && p.category === 'shirt');
  const enabledPants = products.filter(p => p.enabled !== false && p.category === 'pants');

  const filteredProducts = products.filter(p => {
    if (p.enabled === false) return false;
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  // Handle Phone input with 10 digits restriction
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setCustomerPhone(val);
      if (val.length === 10) {
        setPhoneError('');
      } else if (val.length > 0) {
        setPhoneError('เบอร์โทรศัพท์ต้องมี 10 หลัก (ปัจจุบัน ' + val.length + ' หลัก)');
      } else {
        setPhoneError('');
      }
    }
  };

  // Add Item to Cart
  const handleAddToCart = (product, sizeObj, color) => {
    if (product.allow_order === false) {
      alert('ขออภัย รายการสินค้านี้ปิดรับการสั่งซื้อชั่วคราวตามประกาศของผู้ดูแลระบบ');
      return;
    }
    const unitPrice = product.base_price + (sizeObj.extra_price || 0);
    const existingIndex = cart.findIndex(
      item => item.product_id === product.id && item.size === sizeObj.name && item.color === color
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          image: product.image,
          size: sizeObj.name,
          extra_price: sizeObj.extra_price || 0,
          unit_price: unitPrice,
          color: color || product.colors?.[0] || 'มาตรฐาน',
          quantity: 1
        }
      ]);
    }
  };

  // Buy Now (Add to cart & jump to checkout tab)
  const handleBuyNow = (product, sizeObj, color) => {
    handleAddToCart(product, sizeObj, color);
    handleTabChange('cart');
  };

  const handleUpdateQuantity = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCart(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculate totals
  const itemsSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const shippingFee = pickupMethod === 'shipping' ? 50 : 0;
  const grandTotal = itemsSubtotal + shippingFee;

  // Handle Slip Upload
  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์สลิปมีขนาดใหญ่เกิน 5MB กรุณาเลือกรูปภาพขนาดเล็กลง');
        return;
      }
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy helpers
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedPromptpay(true);
      setTimeout(() => setCopiedPromptpay(false), 2000);
    }
  };

  // Submit Order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('กรุณาเลือกสินค้าลงตะกร้าอย่างน้อย 1 รายการ');
      return;
    }
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล ผู้สั่งซื้อ');
      return;
    }
    if (customerPhone.length !== 10) {
      setPhoneError('เบอร์โทรศัพท์ต้องมี 10 หลัก (ห้ามขาดห้ามเกิน)');
      alert('กรุณาระบุเบอร์โทรศัพท์มือถือให้ครบ 10 หลัก');
      return;
    }
    if (pickupMethod === 'shipping' && !shippingAddress.trim()) {
      alert('กรุณาระบุที่อยู่สำหรับจัดส่งพัสดุ');
      return;
    }
    if (!slipPreview) {
      alert('กรุณาแนบภาพสลิปหลักฐานการโอนเงิน');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `JRE-ORDER-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder = {
        id: `order_${Date.now()}`,
        order_number: orderNumber,
        user_email: customerEmail || user?.email || '',
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_method: pickupMethod,
        shipping_address: pickupMethod === 'shipping' ? shippingAddress : '',
        items: cart,
        total_amount: grandTotal,
        payment_status: 'pending_verification',
        slip_url: slipPreview,
        slip_uploaded_at: new Date().toISOString(),
        slip_admin_notes: '',
        pickup_status: 'pending',
        pickup_at: null,
        pickup_by_admin: null,
        created_at: new Date().toISOString()
      };

      await onSaveOrder(newOrder);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setOrderSuccess(newOrder);
      setCart([]);
      setSlipFile(null);
      setSlipPreview(null);
      setActivePickupOrder(newOrder);
    } catch (err) {
      console.error('Order submission failed:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter My Orders
  const myOrders = orders.filter(o => {
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
              สั่งซื้อเสื้อ & กางเกงกู้ภัย JRE 2027
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              เครื่องแบบและเสื้อที่ระลึกโครงการฝึกอบรมกู้ภัยราชพฤกษ์ มมส เนื้อผ้าเกรดพรีเมียม ระบายอากาศยอดเยี่ยม พร้อมระบบออกบัตรรับสินค้าดิจิทัล (Digital Pickup Pass QR Code)
            </p>
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => handleTabChange('cart')}
              className="relative px-4 py-2.5 bg-rescue-600 hover:bg-rescue-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rescue-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ตะกร้าสินค้า</span>
              {cart.length > 0 && (
                <span className="w-5 h-5 bg-white text-rescue-600 rounded-full text-[11px] font-black flex items-center justify-center shadow">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('my_orders')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-rescue-400" />
              <span>ออเดอร์ & QR รับของ</span>
            </button>
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
                  {googleForm.title || 'สั่งซื้อเสื้อ/กางเกงโครงการผ่าน Google Form (ช่องทางสำรอง)'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-bold">
                  เปิดระบบสำรอง
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {googleForm.description || 'กรณีไม่สะดวกสั่งผ่านเว็บไซต์ สามารถกรอกข้อมูลผ่านแบบฟอร์ม Google Form สำรองได้ทันที'}
              </p>
            </div>
          </div>

          <a
            href={googleForm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>เปิดสั่งซื้อผ่าน Google Forms</span>
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
              👕 เสื้อฝึก Joint Response Exercise 2027 (คอเต่าซิป แขนสั้น เทา-ดำ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              การสั่งซื้อเสื้อรุ่นทางการนี้ <strong className="text-amber-300 font-bold">รวมอยู่ในขั้นตอนการสมัครเข้าร่วมโครงการ JRE 2027</strong> โดยจัดทำแบบพรีออเดอร์ ชำระค่าเสื้อจำนวน <strong className="text-white font-bold">400 บาท ในการชำระรอบที่ 1 พร้อมการสมัคร</strong> (ระบบให้เลือกไซส์ S–5XL ในขั้นตอนที่ 2 ของใบสมัคร)
            </p>
          </div>

          <button
            onClick={() => onNavigateRegister && onNavigateRegister()}
            className="px-6 py-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-amber-400 text-white font-black rounded-2xl shadow-xl shadow-rescue-600/30 text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shrink-0 cursor-pointer border border-amber-400/40"
          >
            <Shirt className="w-5 h-5" />
            <span>สั่งซื้อเสื้อพร้อมสมัครเข้าร่วมโครงการ (ไปที่หน้าสมัคร)</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
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
          <span>รายการเสื้อ & กางเกง</span>
        </button>

        <button
          onClick={() => handleTabChange('cart')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all relative cursor-pointer ${
            activeTab === 'cart'
              ? 'border-rescue-500 text-rescue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ตะกร้าและชำระเงิน</span>
          {cart.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rescue-500 text-white text-[10px] rounded-full font-black">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('my_orders')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'my_orders'
              ? 'border-rescue-500 text-rescue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>คำสั่งซื้อของฉัน & QR รับของ</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
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
                <span>เสื้อโครงการ & โปโล ({enabledShirts.length})</span>
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
                <span>กางเกงฝึกยุทธวิธี & ขาสั้น ({enabledPants.length})</span>
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

          {/* Products Grid or Empty Category State */}
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
                  {selectedCategory === 'pants'
                    ? 'ทางคณะทำงานโครงการ JRE 2027 อยู่ระหว่างเตรียมความพร้อมของเครื่องแบบกางเกงฝึกยุทธวิธี โดยขณะนี้เปิดจำหน่ายเสื้อปฏิบัติการกู้ภัยเป็นหลัก'
                    : 'ระบบกำลังปรับปรุงข้อมูลสินค้า กรุณาลองใหม่อีกครั้งในภายหลัง'}
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
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onPreviewImage={setPreviewImage}
                  onOpenSizeChart={() => setSizeChartModal(product)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CART & CHECKOUT */}
      {activeTab === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rescue-500" />
                  <span>รายการสินค้าในตะกร้า ({cart.length})</span>
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    ล้างตะกร้า
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-slate-500">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">ยังไม่มีสินค้าในตะกร้า</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    กรุณาเลือกเสื้อหรือกางเกงที่คุณต้องการสั่งซื้อจากหน้ารายการสินค้า
                  </p>
                  <button
                    onClick={() => handleTabChange('catalog')}
                    className="px-5 py-2.5 bg-rescue-600 hover:bg-rescue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    ไปเลือกดูสินค้า
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 mt-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="py-4 flex items-center gap-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.product_name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-800 text-rescue-400 rounded-md font-bold">
                            ไซต์ {item.size}
                          </span>
                          {item.extra_price > 0 && (
                            <span className="text-amber-400 text-[11px] font-semibold">
                              (+{item.extra_price} บ. ไซต์พิเศษ)
                            </span>
                          )}
                          <span>• {item.color}</span>
                        </div>
                        <p className="text-xs font-black text-rescue-400 mt-1">
                          {item.unit_price} บาท / ตัว
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 ml-2 transition-colors"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size & Ordering Notes */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <p className="font-bold text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>คำแนะนำการรับสินค้าและการสั่งซื้อ</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>สามารถเลือกรับด้วยตนเองฟรี ณ โต๊ะอำนวยการในวันเปิดค่าย JRE 2027 หรือให้จัดส่งพัสดุ</li>
                <li>เมื่อสั่งซื้อแล้ว ระบบจะสร้าง <strong>Digital Pickup Pass (QR Code)</strong> เพื่อให้คุณบันทึกไว้แสดงต่อเจ้าหน้าที่</li>
                <li>ไซต์ 2XL ขึ้นไปจะมีค่าดำเนินการบวกเพิ่มตามที่ระบุในรายการ</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Checkout Form & Payment (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleSubmitOrder} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <CreditCard className="w-5 h-5 text-rescue-500" />
                <span>ข้อมูลผู้สั่งซื้อ & ชำระเงิน</span>
              </h2>

              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>ชื่อ-นามสกุล ผู้สั่งซื้อ *</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น นายกิตติศักดิ์ พลอยประเสริฐ"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                />
              </div>

              {/* Customer Phone (Strict 10 digits) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>เบอร์โทรศัพท์มือถือ (10 หลัก) *</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{customerPhone.length}/10</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  placeholder="เช่น 0812345678 (เฉพาะตัวเลข 10 หลัก)"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none ${
                    phoneError ? 'border-rose-500' : 'border-slate-700 focus:border-rescue-500'
                  }`}
                />
                {phoneError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              {/* Customer Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>อีเมล (สำหรับค้นหาประวัติออเดอร์)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="เช่น example@msu.ac.th"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                />
              </div>

              {/* Pickup Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>วิธีการรับสินค้า *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupMethod('pickup')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pickupMethod === 'pickup'
                        ? 'bg-rescue-950/40 border-rescue-500 text-white ring-1 ring-rescue-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">รับหน้างานวันเข้าค่าย</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">ฟรี ไม่มีค่าจัดส่ง</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickupMethod('shipping')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pickupMethod === 'shipping'
                        ? 'bg-rescue-950/40 border-rescue-500 text-white ring-1 ring-rescue-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">จัดส่งพัสดุถึงบ้าน</p>
                    <p className="text-[10px] text-amber-400 mt-0.5">+50 บาท (Flash/Kerry)</p>
                  </button>
                </div>
              </div>

              {/* Shipping Address (if shipping selected) */}
              {pickupMethod === 'shipping' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>ที่อยู่จัดส่งพัสดุโดยละเอียด *</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="บ้านเลขที่, หมู่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                  />
                </div>
              )}

              {/* BANK PAYMENT DETAILS */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>ช่องทางโอนชำระเงิน</span>
                  <span className="text-rescue-400 font-bold">{payment.bank_name}</span>
                </p>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">เลขที่บัญชีธนาคารกรุงไทย:</p>
                    <p className="text-sm font-black text-white font-mono tracking-wider">
                      {payment.account_number}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {payment.account_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(payment.account_number.replace(/\D/g, ''), 'bank')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">พร้อมเพย์ (PromptPay):</p>
                    <p className="text-sm font-black text-white font-mono tracking-wider">
                      {payment.promptpay}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(payment.promptpay.replace(/\D/g, ''), 'pp')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedPromptpay ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPromptpay ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              {/* SLIP UPLOAD */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>แนบหลักฐานสลิปโอนเงิน *</span>
                  </span>
                  {slipPreview && (
                    <span className="text-emerald-400 text-[11px] font-bold">✓ แนบสลิปแล้ว</span>
                  )}
                </label>

                {slipPreview ? (
                  <div className="relative bg-slate-950 p-2.5 rounded-2xl border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={slipPreview}
                        alt="Slip Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-800"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-200">สลิปโอนเงิน</p>
                        <p className="text-[10px] text-slate-400">พร้อมส่งตรวจสอบ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(slipPreview)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                        title="ดูรูปขยายใหญ่"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSlipFile(null);
                          setSlipPreview(null);
                        }}
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 rounded-lg text-xs"
                        title="ลบสลิป"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-rescue-500/60 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-300">คลิกเพื่ออัปโหลดสลิป</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG หรือ WebP ขนาดไม่เกิน 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Order Total Breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>ราคาสินค้าในตะกร้า:</span>
                  <span>{itemsSubtotal} บาท</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ค่าจัดส่ง:</span>
                  <span>{shippingFee === 0 ? 'ฟรี (รับหน้างาน)' : `${shippingFee} บาท`}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                  <span className="text-white">ยอดชำระสุทธิ:</span>
                  <span className="text-xl text-rescue-400 font-mono">{grandTotal} บาท</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-rescue-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึกคำสั่งซื้อ...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ยืนยันการสั่งซื้อ & ส่งสลิป (ออกบัตร QR รับของ)</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: MY ORDERS & DIGITAL PASS */}
      {activeTab === 'my_orders' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-rescue-500" />
                  <span>ค้นหาประวัติคำสั่งซื้อ & บัตรรับสินค้าดิจิทัล</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  กรอกอีเมล, เบอร์โทรศัพท์ หรือรหัสออเดอร์เพื่อดูสถานะและบัตร QR สำหรับรับสินค้า
                </p>
              </div>

              {/* Search Bar */}
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

            {/* Orders List */}
            {myOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">ไม่พบคำสั่งซื้อที่ตรงกับคำค้นหา</p>
                <p className="text-xs text-slate-500">
                  {orderSearchQuery ? 'โปรดตรวจสอบอีเมลหรือเบอร์โทรศัพท์อีกครั้ง' : 'ยังไม่มีคำสั่งซื้อ กรุณาสั่งซื้อสินค้าก่อน'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {myOrders.map((ord) => {
                  const isVerified = ord.payment_status === 'paid_verified';
                  const isReceived = ord.pickup_status === 'received';

                  return (
                    <div
                      key={ord.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-3.5 transition-all"
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

                        {/* Status Badge */}
                        {isReceived ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] rounded-full font-bold flex items-center gap-1">
                            <PackageCheck className="w-3 h-3" /> รับสินค้าแล้ว
                          </span>
                        ) : isVerified ? (
                          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว • รอรับของ
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] rounded-full font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> รอตรวจสลิป
                          </span>
                        )}
                      </div>

                      {/* Items summary */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
                        {ord.items?.map((it, i) => (
                          <div key={i} className="flex justify-between text-slate-300 text-[11px]">
                            <span className="truncate pr-2">
                              • {it.product_name} ({it.size})
                            </span>
                            <span className="font-bold text-white shrink-0">x{it.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-xs text-white">
                          <span>ยอดรวมสุทธิ:</span>
                          <span className="text-rescue-400">{ord.total_amount} บาท</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setActivePickupOrder(ord)}
                          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>แสดงบัตร QR รับสินค้า</span>
                        </button>

                        {ord.slip_url && (
                          <button
                            onClick={() => setPreviewImage(ord.slip_url)}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                            title="ดูสลิปที่แนบ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT CARD COMPONENT (Internal) */}
      {/* SIZE CHART MODAL */}
      {sizeChartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
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
                      <th className="py-1 px-1.5 text-right">ราคา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {[
                      { s: 'S', c: '36"', l: '26"', p: 'ปกติ (350.-)' },
                      { s: 'M', c: '38"', l: '27"', p: 'ปกติ (350.-)' },
                      { s: 'L', c: '40"', l: '28"', p: 'ปกติ (350.-)' },
                      { s: 'XL', c: '42"', l: '29"', p: 'ปกติ (350.-)' },
                      { s: '2XL', c: '44"', l: '30"', p: 'ปกติ (350.-)' },
                      { s: '3XL', c: '46"', l: '31"', p: '+30.- (380.-)' },
                      { s: '4XL', c: '48"', l: '32"', p: '+50.- (400.-)' },
                      { s: '5XL', c: '50"', l: '33"', p: '+70.- (420.-)' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-1.5 px-1.5 font-black text-white">{row.s}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono">{row.c}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono">{row.l}</td>
                        <td className={`py-1.5 px-1.5 text-right font-bold text-[11px] ${
                          row.p.includes('+') ? 'text-amber-400' : 'text-slate-400'
                        }`}>
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
                      <th className="py-1 px-1.5 text-right">ราคา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {[
                      { s: '6XL', c: '52"', l: '34"', p: '+100.- (450.-)' },
                      { s: '7XL', c: '54"', l: '35"', p: '+120.- (470.-)' },
                      { s: '8XL', c: '56"', l: '36"', p: '+140.- (490.-)' },
                      { s: '9XL', c: '58"', l: '37"', p: '+160.- (510.-)' },
                      { s: '10XL', c: '60"', l: '38"', p: '+180.- (530.-)' },
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

                {/* Info Note inside special sizes */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 space-y-0.5 mt-2">
                  <p className="font-bold flex items-center gap-1">
                    <span>📢 ไซส์พิเศษ 3XL ขึ้นไป</span>
                  </p>
                  <p className="text-slate-400">ราคาบวกเพิ่มตามขนาดรอบอกและเนื้อผ้าพิเศษ</p>
                </div>
              </div>

            </div>

            {/* Measuring Advice Callout */}
            <div className="mt-3.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>เช็กก่อนสั่งซื้อ! คำแนะนำการวัดไซส์:</span>
              </span>
              <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                <li>หน่วยวัดเป็น <span className="text-white font-bold">“นิ้ว” (Inches)</span></li>
                <li>ขนาดอาจคลาดเคลื่อนเล็กน้อย (±1 นิ้ว) จากขั้นตอนการตัดเย็บ</li>
                <li>แนะนำวัดรอบอกจริงของตัวเอง และเปรียบเทียบกับตารางก่อนกดยืนยันการสั่งซื้อ</li>
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
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// PRODUCT CARD SUB-COMPONENT
function ProductCard({ product, onAddToCart, onBuyNow, onPreviewImage, onOpenSizeChart }) {
  const sizes = product.sizes || [];
  const colors = product.colors || ['สีกรมท่ามาตรฐาน'];
  const isOrderAllowed = product.allow_order !== false;

  const [selectedSize, setSelectedSize] = useState(sizes[0] || { name: 'M', extra_price: 0 });
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [activePhoto, setActivePhoto] = useState(product.image);

  React.useEffect(() => {
    setActivePhoto(product.image);
  }, [product.image]);

  const currentPrice = product.base_price + (selectedSize.extra_price || 0);

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
          
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-3 py-1 bg-slate-900/85 backdrop-blur-sm rounded-full border border-slate-700/80 text-[11px] font-black text-rescue-400">
              {product.category === 'shirt' ? 'เสื้อปฏิบัติการกู้ภัย' : 'กางเกงกู้ภัย'}
            </span>
            {!isOrderAllowed && (
              <span className="px-2.5 py-1 bg-amber-950/80 backdrop-blur-sm rounded-full border border-amber-500/40 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow">
                <span>🔒 ปิดรับสั่ง</span>
              </span>
            )}
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
                {currentPrice} <span className="text-xs font-normal text-slate-400">บาท</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Notice when order is paused/closed */}
        {!isOrderAllowed && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <div className="text-[11px] leading-tight">
              <p className="font-bold">🔒 ปิดรับการสั่งซื้อชั่วคราว</p>
              <p className="text-slate-400 text-[10px] mt-0.5">
                ผู้ดูแลระบบปิดรับคำสั่งซื้อสินค้านี้ชั่วคราว สมาชิกสามารถตรวจสอบแบบเสื้อและตารางไซส์เพื่อเตรียมความพร้อมได้
              </p>
            </div>
          </div>
        )}

        {/* Color Options if available */}
        {colors.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">เลือกสี:</label>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedColor === c
                      ? 'bg-rescue-600/30 border-rescue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selection Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400">
              เลือกขนาดไซส์ (Size):
            </label>
            <button
              type="button"
              onClick={onOpenSizeChart}
              className="text-[11px] font-bold text-rescue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>📐 ดูตารางขนาด (S-10XL)</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
            {sizes.map((sz, i) => {
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
                  <p className="text-[10px] mt-0.5">
                    {sz.extra_price > 0 ? (
                      <span className="text-amber-400 font-bold">+{sz.extra_price} บ.</span>
                    ) : (
                      <span className="text-slate-500">ปกติ</span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      {isOrderAllowed ? (
        <div className="flex gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onAddToCart(product, selectedSize, selectedColor)}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มลงตะกร้า</span>
          </button>

          <button
            type="button"
            onClick={() => onBuyNow(product, selectedSize, selectedColor)}
            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-rescue-600/20 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>สั่งซื้อทันที</span>
          </button>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-3 bg-slate-950/80 text-slate-500 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <span>🔒 ปิดรับการสั่งซื้อชั่วคราว</span>
          </button>
        </div>
      )}

    </div>
  );
}
