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
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateAgeDetailed } from '../utils/ageCalculator';
import { DataService } from '../supabase';
import PDPAModal from '../components/PDPAModal';
import Toast from '../components/Toast';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import { DEFAULT_PAYMENT_CONFIG, OFFICIAL_NETWORK_INSTITUTIONS } from '../data/defaultData';

export default function RegisterView({ 
  user, 
  myRegistration, 
  onSaveRegistration, 
  onUpdateRegistration,
  onOpenGoogleLogin,
  formsConfig,
  paymentConfig,
  subRoute,
  onSubRouteChange
}) {
  const effectivePaymentConfig = paymentConfig || DEFAULT_PAYMENT_CONFIG;
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (subRoute === 'dashboard') {
      setIsEditing(false);
    } else if (subRoute === 'form' && myRegistration) {
      setIsEditing(true);
    }
  }, [subRoute, myRegistration]);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
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
  const [institution, setInstitution] = useState('ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม (มมส)');
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

  // In-App Toast Notification State
  const [toast, setToast] = useState(null);
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // In-App Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Payment Slip Upload State
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [previewSlipModal, setPreviewSlipModal] = useState(null);

  // 2-Round Installments State
  const [paymentPlan, setPaymentPlan] = useState('full'); // 'full' or 'installment'
  const [isUploadingRound1, setIsUploadingRound1] = useState(false);
  const [isUploadingRound2, setIsUploadingRound2] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Document Upload State
  const [uploadingDocId, setUploadingDocId] = useState(null);

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

  // Load existing data if registered
  useEffect(() => {
    if (myRegistration) {
      setFirstName(myRegistration.first_name || '');
      setLastName(myRegistration.last_name || '');
      setBloodGroup(myRegistration.blood_group || 'O');
      setPhone(myRegistration.phone || '');
      setInstitution(myRegistration.institution || 'มหาวิทยาลัยมหาสารคาม (มมส)');
      setEmergencyName(myRegistration.emergency_name ? myRegistration.emergency_name.split(' (')[0] : '');
      setEmergencyPhone(myRegistration.emergency_phone || '');
      setMedicalHistory(myRegistration.medical_history || '');
      setFoodAllergy(myRegistration.food_allergy || '');
      setPreviousTraining(myRegistration.previous_training || '');
      setPaymentPlan(myRegistration.payment_plan || 'full');
      
      // Parse relation if present
      if (myRegistration.emergency_name && myRegistration.emergency_name.includes('(')) {
        const relMatch = myRegistration.emergency_name.match(/\((.*?)\)/);
        if (relMatch && relMatch[1]) {
          setEmergencyRelation(relMatch[1]);
        }
      }

      // Parse DOB
      if (myRegistration.dob) {
        const parts = myRegistration.dob.split('-');
        if (parts.length === 3) {
          setBirthYearBE(parts[0]);
          setBirthMonth(parseInt(parts[1], 10).toString());
          setBirthDay(parseInt(parts[2], 10).toString());
        }
      }
      setAgreeCorrectInfo(true);
      setAgreePDPAAndRules(true);
    } else if (user && user.name) {
      // Auto pre-fill name from Google Account for first-time applicants
      const parts = user.name.trim().split(' ');
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setFirstName(user.name);
      }
    }
  }, [myRegistration, user]);

  // Compute calculated age dynamically in real-time
  const ageResult = calculateAgeDetailed(birthYearBE, birthMonth, birthDay);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenGoogleLogin();
      return;
    }

    // Minimum 15 Years Old Enforcement
    if (ageResult.years < 15) {
      setStatusMessage({
        type: 'error',
        text: `ไม่อนุญาตให้ส่งใบสมัคร: ผู้เข้าร่วมโครงการฝึกอบรมเชิงปฏิบัติการกู้ภัย JRE 2027 ต้องมีอายุตั้งแต่ 15 ปีบริบูรณ์ขึ้นไป (ปัจจุบันคำนวณได้ ${ageResult.years} ปี ${ageResult.months} เดือน ยังไม่ถึงเกณฑ์ขั้นต่ำ)`
      });
      triggerToast('ผู้สมัครต้องมีอายุตั้งแต่ 15 ปีบริบูรณ์ขึ้นไปเท่านั้น', 'error');
      return;
    }

    // Strict 10-Digit Mobile Phone Enforcement
    if (phone.length !== 10 || !/^0\d{9}$/.test(phone)) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาระบุเบอร์โทรศัพท์มือถือให้ครบ 10 หลักพอดี (ขึ้นต้นด้วย 0 และต้องมีตัวเลข 10 ตัวพอดี ห้ามขาดหรือเกิน)'
      });
      triggerToast('เบอร์โทรศัพท์มือถือต้องมีครบ 10 หลักพอดี (ห้ามขาดหรือเกิน)', 'error');
      return;
    }

    if (emergencyPhone.length !== 10 || !/^0\d{9}$/.test(emergencyPhone)) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาระบุเบอร์โทรศัพท์ติดต่อฉุกเฉินให้ครบ 10 หลักพอดี (ขึ้นต้นด้วย 0 และต้องมีตัวเลข 10 ตัวพอดี ห้ามขาดหรือเกิน)'
      });
      triggerToast('เบอร์โทรศัพท์ติดต่อฉุกเฉินต้องมีครบ 10 หลักพอดี (ห้ามขาดหรือเกิน)', 'error');
      return;
    }

    if (!agreeCorrectInfo || !agreePDPAAndRules) {
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

    const payload = {
      user_id: user.id,
      user_email: user.email,
      user_avatar: user.avatar,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
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
      payment_plan: myRegistration?.payment_plan || paymentPlan,
      payment_status: myRegistration?.payment_status || 'unpaid',
      payment_amount: myRegistration?.payment_amount || effectivePaymentConfig.fee_total,
      payment_bank_info: myRegistration?.payment_bank_info || `${effectivePaymentConfig.bank_name} เลขที่ ${effectivePaymentConfig.bank_account_number} ชื่อบัญชี ${effectivePaymentConfig.bank_account_name}`,
      payment_slip_url: myRegistration?.payment_slip_url || '',
      payment_slip_date: myRegistration?.payment_slip_date || '',
      installment_1_status: myRegistration?.installment_1_status || 'unpaid',
      installment_1_amount: myRegistration?.installment_1_amount || effectivePaymentConfig.installment_round1_amount,
      installment_1_due: myRegistration?.installment_1_due || effectivePaymentConfig.installment_round1_due,
      installment_1_slip_url: myRegistration?.installment_1_slip_url || '',
      installment_1_slip_date: myRegistration?.installment_1_slip_date || '',
      installment_2_status: myRegistration?.installment_2_status || 'unpaid',
      installment_2_amount: myRegistration?.installment_2_amount || effectivePaymentConfig.installment_round2_amount,
      installment_2_due: myRegistration?.installment_2_due || effectivePaymentConfig.installment_round2_due,
      installment_2_slip_url: myRegistration?.installment_2_slip_url || '',
      installment_2_slip_date: myRegistration?.installment_2_slip_date || '',
      admin_messages: myRegistration?.admin_messages || [],
      requested_docs: myRegistration?.requested_docs || [],
      status: 'confirmed'
    };

    try {
      await onSaveRegistration(payload);
      setIsEditing(false);
      if (onSubRouteChange) onSubRouteChange('dashboard');
      setStatusMessage({ type: 'success', text: 'บันทึกข้อมูลประวัติผู้สมัครเรียบร้อยแล้ว!' });
      triggerToast('บันทึกข้อมูลใบสมัคร JRE 2027 เรียบร้อยแล้ว', 'success');
      
      try {
        confetti({
          particleCount: 80,
          spread: 70,
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
        await DataService.submitPaymentSlip(myRegistration.user_id, uploadResult.url);
        if (onUpdateRegistration) {
          await onUpdateRegistration(myRegistration.user_id, {
            payment_slip_url: uploadResult.url,
            payment_slip_date: new Date().toISOString(),
            payment_status: 'pending_review'
          });
        }
        triggerToast('อัปโหลดสลิปการโอนเงินเรียบร้อยแล้ว เจ้าหน้าที่จะทำการตรวจสอบยอดเงิน', 'success');
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
        await DataService.submitInstallmentSlip(myRegistration.user_id, round, uploadResult.url);
        if (onUpdateRegistration) {
          const update = {
            payment_plan: 'installment',
            [`installment_${round}_slip_url`]: uploadResult.url,
            [`installment_${round}_slip_date`]: new Date().toISOString(),
            [`installment_${round}_status`]: 'pending_review'
          };
          if (round === 1 && myRegistration.installment_2_status !== 'paid') {
            update.payment_status = 'pending_review';
          }
          await onUpdateRegistration(myRegistration.user_id, update);
        }
        triggerToast(`อัปโหลดสลิปงวดที่ ${round} เรียบร้อยแล้ว เจ้าหน้าที่จะตรวจสอบยอดเงิน`, 'success');
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
  if (myRegistration && !isEditing) {
    const paymentStatus = myRegistration.payment_status || 'unpaid';
    const paymentAmount = myRegistration.payment_amount || 350;
    const adminMessages = Array.isArray(myRegistration.admin_messages) ? myRegistration.admin_messages : [];
    const requestedDocs = Array.isArray(myRegistration.requested_docs) ? myRegistration.requested_docs : [];

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

        {/* Top Header Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <img
                src={myRegistration.user_avatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-rescue-500 shadow-md"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-white">
                    {myRegistration.first_name} {myRegistration.last_name}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    ลงทะเบียนแล้ว
                  </span>
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
                <p className="text-xs text-slate-400 mt-1">
                  สังกัด: <span className="text-slate-200 font-semibold">{myRegistration.institution}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  อีเมล: {myRegistration.user_email} • รหัสอ้างอิง: JRE27-{myRegistration.id?.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEditing(true);
                if (onSubRouteChange) onSubRouteChange('form');
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูลประวัติของฉัน</span>
            </button>
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
                      ({myRegistration.payment_plan === 'installment' ? 'แผนแบ่งจ่าย 2 งวด' : 'แผนชำระเต็มจำนวน'})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ค่าสมัครรวม {effectivePaymentConfig.fee_total} บาท • {effectivePaymentConfig.notes || 'รองรับการชำระเต็มจำนวนหรือแบ่งจ่าย 2 งวด'}
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
                  <AlertCircle className="w-4 h-4" /> ค้างชำระค่าลงทะเบียน ({effectivePaymentConfig.fee_total} บ.)
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
                    <span className="text-[10px] text-slate-400 block">{effectivePaymentConfig.bank_name}</span>
                    <span className="font-mono font-bold text-amber-300 text-sm truncate block">
                      {effectivePaymentConfig.bank_account_number}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(effectivePaymentConfig.bank_account_number, 'bank_acc', 'เลขบัญชี')}
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
                    <span className="font-semibold text-white text-xs truncate block" title={effectivePaymentConfig.bank_account_name}>
                      {effectivePaymentConfig.bank_account_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(effectivePaymentConfig.bank_account_name, 'bank_name', 'ชื่อบัญชี')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                    title="คัดลอกชื่อบัญชี"
                  >
                    {copiedKey === 'bank_name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bank_name' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                {/* PromptPay */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">พร้อมเพย์ (PromptPay)</span>
                    <span className="font-mono font-bold text-sky-300 text-sm truncate block">
                      {effectivePaymentConfig.bank_promptpay || '-'}
                    </span>
                  </div>
                  {effectivePaymentConfig.bank_promptpay && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(effectivePaymentConfig.bank_promptpay, 'bank_prompt', 'พร้อมเพย์')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                      title="คัดลอกพร้อมเพย์"
                    >
                      {copiedKey === 'bank_prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'bank_prompt' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  )}
                </div>
              </div>

              {myRegistration.payment_notes && (
                <div className="text-[11px] text-amber-200/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                  <span className="font-bold">หมายเหตุจากฝ่ายการเงิน: </span>
                  {myRegistration.payment_notes}
                </div>
              )}
            </div>

            {/* Plan Switcher Pills (If allow_installments is true) */}
            {effectivePaymentConfig.allow_installments && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 px-2 font-medium">
                  เลือกรูปแบบการชำระเงิน:
                </span>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={async () => {
                      if (onUpdateRegistration) {
                        await onUpdateRegistration(myRegistration.user_id, { payment_plan: 'full' });
                        triggerToast('เปลี่ยนเป็นแผนชำระเต็มจำนวนแล้ว', 'info');
                      }
                    }}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      myRegistration.payment_plan !== 'installment'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    ชำระเต็มจำนวน ({effectivePaymentConfig.fee_total} บ.)
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (onUpdateRegistration) {
                        await onUpdateRegistration(myRegistration.user_id, { payment_plan: 'installment' });
                        triggerToast('เปลี่ยนเป็นแผนแบ่งจ่าย 2 งวดแล้ว', 'info');
                      }
                    }}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      myRegistration.payment_plan === 'installment'
                        ? 'bg-purple-600 text-white shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    แบ่งจ่าย 2 งวด ({effectivePaymentConfig.installment_round1_amount} + {effectivePaymentConfig.installment_round2_amount} บ.)
                  </button>
                </div>
              </div>
            )}

            {/* VIEW A: 2-ROUND INSTALLMENT VIEW */}
            {myRegistration.payment_plan === 'installment' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Round 1 Installment Box */}
                <div className="bg-slate-900/90 border border-purple-500/40 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                        งวดที่ 1 (รอบแรก - วันเปิดรับสมัคร)
                      </span>
                      <p className="text-xl font-black text-white mt-0.5">
                        {effectivePaymentConfig.installment_round1_amount} <span className="text-sm font-normal text-slate-400">บาท</span>
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
                      <span>กำหนดชำระ: <strong className="text-white">{effectivePaymentConfig.installment_round1_due}</strong></span>
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
                          <span>แนบสลิปงวดที่ 1 ({effectivePaymentConfig.installment_round1_amount} บ.)</span>
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
                      {effectivePaymentConfig.installment_round2_amount} <span className="text-sm font-normal text-slate-400">บาท</span>
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
                    <span>กำหนดชำระ: <strong className="text-white">{effectivePaymentConfig.installment_round2_due}</strong></span>
                  </p>
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
                            <span>แนบสลิปงวดที่ 2 ({effectivePaymentConfig.installment_round2_amount} บ.)</span>
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
                    ยอดค่าลงทะเบียนเต็มจำนวน: <span className="font-bold text-white text-base">{effectivePaymentConfig.fee_total} บาท</span>
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
          {adminMessages.length > 0 && (
            <div className="mt-6 p-5 rounded-2xl border bg-slate-950/70 border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <MessageSquare className="w-4 h-4" />
                <h3 className="font-bold text-white text-sm">
                  ข้อความและการแจ้งเตือนจากผู้ดูแลระบบ ({adminMessages.length} ข้อความ)
                </h3>
              </div>

              <div className="space-y-2">
                {adminMessages.map((msg, idx) => (
                  <div key={msg.id || idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-purple-400">ฝ่ายประสานงาน JRE 2027</span>
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleString('th-TH') : ''}</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
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
              ข้อมูลส่วนตัวประจำตัวผู้สมัคร
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
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-5 shadow-2xl relative">
              <button
                onClick={() => setPreviewSlipModal(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <h4 className="font-bold text-white text-sm mb-3">ภาพสลิปการโอนเงิน</h4>
              <img src={previewSlipModal} alt="สลิป" className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800" />
            </div>
          </div>
        )}

        {/* IN-APP DOCUMENT PREVIEW MODAL */}
        <DocumentPreviewModal
          isOpen={Boolean(previewDocModal)}
          onClose={() => setPreviewDocModal(null)}
          doc={previewDocModal}
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
          {isEditing ? 'แก้ไขข้อมูลประวัติผู้สมัคร' : 'ระบบรับสมัครเข้าร่วมโครงการ'}
        </div>
        <h1 className="text-3xl font-black text-white">
          {isEditing ? 'แก้ไขข้อมูลและประวัติการฝึกอบรม' : 'ใบสมัครโครงการฝึกอบรมเชิงปฏิบัติการ JRE 2027'}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          กรอกข้อมูลตามความเป็นจริงเพื่อใช้ในการทำประกันอุบัติเหตุ สวัสดิการความปลอดภัย จัดสรรกลุ่ม และจัดห้องนอน
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : 'bg-red-950/80 border-red-700 text-red-200'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage.text}</span>
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
        
        {/* Form Header Official Emblem Banner */}
        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-800 text-center space-y-3">
          <div className="w-full max-w-lg bg-white p-2 sm:p-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center justify-center">
            <img
              src="/images/logo/jre_header_banner.png"
              alt="Joint Response Exercise (JRE 2027)"
              className="w-full h-auto object-contain max-h-20 sm:max-h-24"
            />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rescue-500/10 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-black uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>ใบสมัครเข้าร่วมโครงการอย่างเป็นทางการ (Official Registration Form)</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              โครงการฝึกผสมภาคีเครือข่าย Joint Response Exercise (JRE 2027)
            </h2>
            <p className="text-xs text-slate-400">
              วันที่ 14 – 15 พฤศจิกายน 2569 • ณ มหาวิทยาลัยมหาสารคาม
            </p>
          </div>
        </div>

        {/* Section 1: ชื่อและสังกัด */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-rescue-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              1. ข้อมูลประจำตัวผู้สมัคร (ผูกกับบัญชี Google)
            </h3>
            {user && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันผ่าน Google แล้ว
              </span>
            )}
          </div>

          {/* Locked Verified Google Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                อีเมล Google ที่ใช้ในการสมัครและติดต่อ
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-bold">
                ✓ ดึงจาก Google อัตโนมัติ (ไม่ต้องกรอก)
              </span>
            </label>
            <input
              type="email"
              disabled
              value={user?.email || myRegistration?.user_email || ''}
              className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-300 font-mono text-sm cursor-not-allowed select-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>ชื่อจริง *</span>
                <span className="text-[10px] text-slate-500">(ดึงจาก Google อัตโนมัติ)</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="ระบุชื่อจริง"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>นามสกุล *</span>
                <span className="text-[10px] text-slate-500">(ดึงจาก Google อัตโนมัติ)</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="ระบุนามสกุล"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                สังกัด / มหาวิทยาลัย / ชมรมกู้ภัยทั่วประเทศ (ทุกภูมิภาค) *
              </label>
              <span className="text-[11px] text-rescue-400 font-medium">
                เปิดรับทุกมหาวิทยาลัยทั่วประเทศ
              </span>
            </div>

            {/* Quick Dropdown Picker from 8 Official Network Institutions */}
            <div className="mb-2">
              <select
                value={OFFICIAL_NETWORK_INSTITUTIONS.find(i => i.fullName === institution)?.fullName || ''}
                onChange={e => {
                  if (e.target.value) {
                    setInstitution(e.target.value);
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
              type="text"
              required
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="ระบุสังกัด / มหาวิทยาลัย / ชมรมกู้ภัย เช่น ชมรมกู้ภัยราชพฤกษ์ มมส, อาสาสมัครกู้ภัย มข ฯลฯ"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm font-medium"
            />

            {/* Quick Suggestions Pills (All 8 Official Network Institutions) */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[11px] font-bold text-rescue-400 mr-1 self-center flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                เลือกด่วน (8 สถาบันเครือข่าย):
              </span>
              {OFFICIAL_NETWORK_INSTITUTIONS.map(inst => {
                const isSelected = institution === inst.fullName;
                return (
                  <button
                    type="button"
                    key={inst.id}
                    onClick={() => setInstitution(inst.fullName)}
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
          </div>
        </div>

        {/* Section 2: วันเดือนปี พ.ศ. เกิด และการคำนวณอายุ อัตโนมัติ (เกณฑ์ 15 ปีขึ้นไป) */}
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                วันเกิด
              </label>
              <select
                value={birthDay}
                onChange={e => setBirthDay(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d.toString()}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                เดือนเกิด
              </label>
              <select
                value={birthMonth}
                onChange={e => setBirthMonth(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none cursor-pointer"
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

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>ปีเกิด (พ.ศ.) *</span>
                <span className="text-[10px] text-rescue-400 font-bold">15 ปี+</span>
              </label>
              <select
                value={birthYearBE}
                onChange={e => setBirthYearBE(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none cursor-pointer"
              >
                {eligibleBirthYears.map(year => (
                  <option key={year} value={year.toString()}>
                    พ.ศ. {year} (ค.ศ. {year - 543})
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          {/* Underage Error Alert if calculated age is strictly < 15 */}
          {ageResult.years < 15 && (
            <div className="p-3 bg-red-950/70 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>แจ้งเตือน:</strong> ผู้สมัครต้องมีอายุอย่างน้อย 15 ปีบริบูรณ์ขึ้นไปเท่านั้น จึงจะสามารถเข้าร่วมการฝึกอบรมปฏิบัติการกู้ภัยได้
              </span>
            </div>
          )}

          {/* กรุ๊ปเลือด และ เบอร์โทร */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-emergency-500" />
                กรุ๊ปเลือด (Blood Group) *
              </label>
              <select
                required
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-rescue-500 outline-none text-sm"
              >
                <option value="A">หมู่โลหิต A</option>
                <option value="B">หมู่โลหิต B</option>
                <option value="O">หมู่โลหิต O</option>
                <option value="AB">หมู่โลหิต AB</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rescue-500" />
                  เบอร์โทรศัพท์มือถือ *
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (เฉพาะตัวเลข 10 หลัก)
                </span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="08XXXXXXXX"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 font-mono text-sm pr-24 ${
                    phone.length === 10 ? 'border-emerald-500/70 focus:ring-emerald-500' : 'border-slate-700 focus:ring-rescue-500'
                  }`}
                />
                <span className={`absolute right-3 top-3 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold select-none ${
                  phone.length === 10 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {phone.length}/10 หลัก
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: บุคคลที่ติดต่อได้กรณีฉุกเฉิน */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-emergency-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <AlertCircle className="w-4 h-4 text-emergency-500" />
            3. ข้อมูลบุคคลที่ติดต่อได้กรณีฉุกเฉิน
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ชื่อ - สกุล บุคคลติดต่อฉุกเฉิน *
              </label>
              <input
                type="text"
                required
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                placeholder="ระบุชื่อและนามสกุล"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ความสัมพันธ์
              </label>
              <select
                value={emergencyRelation}
                onChange={e => setEmergencyRelation(e.target.value)}
                className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none"
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
                เบอร์โทรศัพท์ติดต่อฉุกเฉิน *
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                (เฉพาะตัวเลข 10 หลัก)
              </span>
            </label>
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                value={emergencyPhone}
                onChange={e => handleEmergencyPhoneChange(e.target.value)}
                placeholder="08XXXXXXXX"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 font-mono text-sm pr-24 ${
                  emergencyPhone.length === 10 ? 'border-emerald-500/70 focus:ring-emerald-500' : 'border-slate-700 focus:ring-rescue-500'
                }`}
              />
              <span className={`absolute right-3 top-3 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold select-none ${
                emergencyPhone.length === 10 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {emergencyPhone.length}/10 หลัก
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: ข้อมูลสุขภาพ ประวัติการแพ้ & ประวัติการฝึกอบรม */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            4. ข้อมูลสุขภาพและความปลอดภัย & ประวัติการฝึกอบรม
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
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
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
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
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              ประวัติและประสบการณ์การฝึกอบรมกู้ภัยที่ผ่านมา
            </label>
            <textarea
              rows="3"
              value={previousTraining}
              onChange={e => setPreviousTraining(e.target.value)}
              placeholder="ระบุหลักสูตรหรือการฝึกอบรมกู้ภัยที่เคยผ่าน เช่น เคยอบรม First Aid & CPR, BLS, การใช้เชือกกู้ภัย, กู้ชีพทางน้ำ, ดับเพลิง หรือ หากเป็นมือใหม่ให้ระบุ 'ไม่มี / ฝึกอบรมครั้งแรก'"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Section 5: รูปแบบการชำระเงิน & ข้อมูลบัญชีโอนเงิน */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              5. ค่าสมัคร & รูปแบบการชำระเงิน
            </h3>
            <span className="text-[11px] text-slate-400">
              ค่าสมัครรวม {effectivePaymentConfig.fee_total} บาท
            </span>
          </div>

          {/* Payment Plan Selection Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              onClick={() => setPaymentPlan('full')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentPlan === 'full'
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  ชำระเต็มจำนวน
                </span>
                <span className="text-sm font-black text-amber-400">
                  {effectivePaymentConfig.fee_total} บาท
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ชำระครั้งเดียวครบถ้วน {effectivePaymentConfig.fee_total} บาท พร้อมรับสิทธิ์เข้าร่วมฝึกทันทีหลังตรวจสอบ
              </p>
            </div>

            {effectivePaymentConfig.allow_installments && (
              <div
                onClick={() => setPaymentPlan('installment')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentPlan === 'installment'
                    ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    ขอแบ่งจ่าย 2 งวด
                  </span>
                  <span className="text-sm font-black text-purple-400">
                    {effectivePaymentConfig.installment_round1_amount} + {effectivePaymentConfig.installment_round2_amount} บาท
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  งวดที่ 1: {effectivePaymentConfig.installment_round1_amount} บ. ({effectivePaymentConfig.installment_round1_due}) • งวดที่ 2: {effectivePaymentConfig.installment_round2_amount} บ. ({effectivePaymentConfig.installment_round2_due})
                </p>
              </div>
            )}
          </div>

          {/* Bank Info Card with 1-Click Copy */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                ข้อมูลบัญชีธนาคารสำหรับโอนเงิน:
              </span>
              <span className="text-[10px] text-emerald-400">
                (โอนและส่งสลิปผ่านระบบหลังบันทึกใบสมัคร)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">{effectivePaymentConfig.bank_name}</span>
                  <span className="font-mono font-bold text-amber-300 text-xs truncate block">{effectivePaymentConfig.bank_account_number}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(effectivePaymentConfig.bank_account_number, 'form_bank_acc', 'เลขบัญชี')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedKey === 'form_bank_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'form_bank_acc' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">ชื่อบัญชี</span>
                  <span className="font-medium text-white text-[11px] truncate block" title={effectivePaymentConfig.bank_account_name}>{effectivePaymentConfig.bank_account_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(effectivePaymentConfig.bank_account_name, 'form_bank_name', 'ชื่อบัญชี')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedKey === 'form_bank_name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'form_bank_name' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">พร้อมเพย์</span>
                  <span className="font-mono font-bold text-sky-300 text-xs truncate block">{effectivePaymentConfig.bank_promptpay || '-'}</span>
                </div>
                {effectivePaymentConfig.bank_promptpay && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(effectivePaymentConfig.bank_promptpay, 'form_prompt', 'พร้อมเพย์')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0"
                  >
                    {copiedKey === 'form_prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'form_prompt' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consent and Agreement Checkboxes (Required by Project & MSU PDPA) */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4 shadow-inner">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-rescue-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              การยืนยันข้อมูลและข้อตกลงความยินยอม (Consent & Agreements)
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Checkbox 1: Correct Info Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                required
                checked={agreeCorrectInfo}
                onChange={e => setAgreeCorrectInfo(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rescue-600 focus:ring-rescue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                <strong className="text-white font-semibold">การรับรองความถูกต้องของข้อมูล:</strong> ข้าพเจ้าขอยืนยันว่า ข้อมูลประวัติ สังกัด เบอร์โทรศัพท์ ประวัติสุขภาพ และข้อมูลติดต่อฉุกเฉินทั้งหมดที่ระบุข้างต้นเป็นความจริง ถูกต้อง และเป็นปัจจุบันทุกประการ <span className="text-rose-400 font-bold">*</span>
              </span>
            </label>

            {/* Checkbox 2: PDPA and Project Rules */}
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                required
                checked={agreePDPAAndRules}
                onChange={e => setAgreePDPAAndRules(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-rescue-600 focus:ring-rescue-500 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
              />
              <div className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                <strong className="text-white font-semibold">นโยบาย PDPA และข้อตกลงโครงการ:</strong> ข้าพเจ้ายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) มหาวิทยาลัยมหาสารคาม และตกลงที่จะปฏิบัติตามกฎระเบียบ ข้อตกลง และคำสั่งความปลอดภัยของโครงการ JRE 2027 ตลอดระยะเวลาการฝึกอบรมทุกประการ <span className="text-rose-400 font-bold">*</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPdpaModal(true);
                  }}
                  className="ml-2 text-rescue-400 hover:text-rescue-300 underline font-semibold inline-flex items-center gap-1"
                >
                  [อ่านนโยบายข้อมูลส่วนบุคคล PDPA มมส]
                </button>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !agreeCorrectInfo || !agreePDPAAndRules}
            className="flex-1 py-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl shadow-xl shadow-rescue-600/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEditing ? 'บันทึกการแก้ไขข้อมูลประวัติ' : 'ยืนยันและบันทึกใบสมัคร JRE 2027'}</span>
              </>
            )}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (onSubRouteChange) onSubRouteChange('dashboard');
              }}
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 text-sm cursor-pointer active:scale-95"
            >
              ยกเลิก
            </button>
          )}
        </div>

      </form>

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
    </div>
  );
}
