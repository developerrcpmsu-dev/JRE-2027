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
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateAgeDetailed } from '../utils/ageCalculator';
import { DataService } from '../supabase';
import PDPAModal from '../components/PDPAModal';

export default function RegisterView({ 
  user, 
  myRegistration, 
  onSaveRegistration, 
  onUpdateRegistration,
  onOpenGoogleLogin,
  formsConfig 
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Birth Date State (Buddhist Era friendly)
  const currentBE = new Date().getFullYear() + 543;
  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('6');
  const [birthYearBE, setBirthYearBE] = useState('2546'); // พ.ศ. 2546 (~20-21 years old)

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

  // Payment Slip Upload State
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [previewSlipModal, setPreviewSlipModal] = useState(null);

  // Document Upload State
  const [uploadingDocId, setUploadingDocId] = useState(null);

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

    if (!agreeCorrectInfo || !agreePDPAAndRules) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาติ๊กยินยอมว่าข้อมูลถูกต้อง และยินยอมปฏิบัติตามนโยบาย PDPA มมส และข้อตกลงโครงการก่อนบันทึกใบสมัคร'
      });
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
      payment_status: myRegistration?.payment_status || 'unpaid',
      payment_amount: myRegistration?.payment_amount || 350,
      payment_bank_info: myRegistration?.payment_bank_info || 'ธนาคารกรุงไทย เลขที่ 984-0-XXXXX-X ชื่อบัญชี ชมรมกู้ภัยราชพฤกษ์ มมส',
      payment_slip_url: myRegistration?.payment_slip_url || '',
      payment_slip_date: myRegistration?.payment_slip_date || '',
      admin_messages: myRegistration?.admin_messages || [],
      requested_docs: myRegistration?.requested_docs || [],
      status: 'confirmed'
    };

    try {
      await onSaveRegistration(payload);
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'บันทึกข้อมูลประวัติผู้สมัครเรียบร้อยแล้ว!' });
      
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Payment Slip Handler
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
        alert('อัปโหลดสลิปการโอนเงินเรียบร้อยแล้ว เจ้าหน้าที่จะทำการตรวจสอบยอดเงิน');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดสลิป');
    } finally {
      setIsUploadingSlip(false);
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
        alert(`อัปโหลดเอกสาร "${file.name}" เรียบร้อยแล้ว`);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดเอกสาร');
    } finally {
      setUploadingDocId(null);
      e.target.value = '';
    }
  };

  // If user is not logged in with Google yet
  if (!user && !myRegistration) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-300 space-y-6">
        
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
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl shadow-xl transition-all inline-flex items-center justify-center gap-3 text-sm active:scale-95 group"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>เข้าสู่ระบบด้วย Google เพื่อสร้างบัญชีและยืนยันตัวตน</span>
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
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
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูลประวัติของฉัน</span>
            </button>
          </div>

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
                        <span>เข้าพักตามห้องนอนที่ระบุ ณ เรือนนอนหอพักนิสิต มมส</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 py-2">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      <span className="text-sm font-semibold">กำลังรอ Admin จัดสรรห้องพักค้างแรม...</span>
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

          {/* SECTION: สถานะการชำระเงิน & ส่งสลิปโอนเงิน (Real Payment System) */}
          <div className="mt-8 p-5 rounded-2xl border bg-slate-950/70 border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  สถานะการชำระค่าลงทะเบียน & การส่งสลิป
                </h3>
              </div>

              {paymentStatus === 'paid' ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> ชำระเงินเรียบร้อยแล้ว
                </span>
              ) : paymentStatus === 'pending_review' ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-4 h-4" /> ส่งสลิปแล้ว กำลังรอผู้ดูแลตรวจสอบ
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> ค้างชำระค่าลงทะเบียน ({paymentAmount} บาท)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="text-slate-400">
                  ยอดค่าลงทะเบียน: <span className="font-bold text-white text-sm">{paymentAmount} บาท</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  บัญชีรับโอน: <span className="text-amber-300 font-semibold">{myRegistration.payment_bank_info || 'ธนาคารกรุงไทย เลขที่ 984-0-XXXXX-X ชื่อบัญชี ชมรมกู้ภัยราชพฤกษ์ มมส'}</span>
                </p>
                {myRegistration.payment_notes && (
                  <p className="text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px]">
                    หมายเหตุจากฝ่ายการเงิน: {myRegistration.payment_notes}
                  </p>
                )}
              </div>

              {/* Slip Upload & Viewer */}
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
                        ✓ อัปโหลดสลิปแล้ว
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ส่งเมื่อ: {myRegistration.payment_slip_date ? new Date(myRegistration.payment_slip_date).toLocaleString('th-TH') : '-'}
                      </span>
                      <label className="text-[10px] text-blue-400 hover:underline cursor-pointer mt-1 inline-block">
                        ส่งสลิปใหม่ทดแทน
                        <input type="file" accept="image/*" onChange={handleUploadPaymentSlip} className="hidden" />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${isUploadingSlip ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploadingSlip ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งสลิป...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>อัปโหลดสลิปโอนเงิน ({paymentAmount} บ.)</span>
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
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                              <Eye className="w-3 h-3" /> เปิดดู
                            </a>
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

          {/* Quick links to Google forms if active */}
          {formsConfig && (formsConfig.pretest?.enabled || formsConfig.posttest?.enabled || formsConfig.evaluation?.enabled) && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                แบบทดสอบและประเมินผลที่เปิดให้ดำเนินการขณะนี้
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {formsConfig.pretest?.enabled && formsConfig.pretest?.url && (
                  <a
                    href={formsConfig.pretest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <span>ทำ Pre-Test JRE 2027</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {formsConfig.posttest?.enabled && formsConfig.posttest?.url && (
                  <a
                    href={formsConfig.posttest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <span>ทำ Post-Test JRE 2027</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {formsConfig.evaluation?.enabled && formsConfig.evaluation?.url && (
                  <a
                    href={formsConfig.evaluation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <span>ทำแบบประเมินโครงการ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

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

      </div>
    );
  }

  // REGISTRATION / EDIT FORM
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      
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
              <span className="text-[11px] text-rescue-400">
                เปิดรับทุกมหาวิทยาลัยทั่วประเทศ
              </span>
            </div>
            <input
              type="text"
              required
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="เช่น ชมรมกู้ภัยราชพฤกษ์ มมส, อาสาสมัครกู้ภัย มข, ชุดเคลื่อนที่เร็ว มก, จุฬาฯ, มธ, มช, มอ ฯลฯ"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm"
            />
            {/* Quick Suggestions Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 mr-1 self-center">เลือกด่วน:</span>
              {[
                'ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม (มมส)',
                'อาสาสมัครกู้ภัย มหาวิทยาลัยขอนแก่น (มข)',
                'ชุดเคลื่อนที่เร็ว มหาวิทยาลัยเกษตรศาสตร์ (มก)',
                'เครือข่ายกู้ภัย มหาวิทยาลัยเชียงใหม่ (มช)',
                'เครือข่ายกู้ภัย มหาวิทยาลัยสงขลานครินทร์ (มอ)',
                'เครือข่ายกู้ภัย มหาวิทยาลัยบูรพา (มบ)'
              ].map((uni, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setInstitution(uni)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
                >
                  + {uni.split(' ')[0]} {uni.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: วันเดือนปี พ.ศ. เกิด และการคำนวณอายุ อัตโนมัติ */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-rescue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Calendar className="w-4 h-4" />
            2. วันเดือนปี พ.ศ. เกิด & คำนวณอายุอัตโนมัติ
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                วันเกิด
              </label>
              <select
                value={birthDay}
                onChange={e => setBirthDay(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none"
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
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none"
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
              <label className="block text-xs font-medium text-slate-400 mb-1">
                ปีเกิด (พ.ศ.)
              </label>
              <select
                value={birthYearBE}
                onChange={e => setBirthYearBE(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rescue-500 outline-none"
              >
                {Array.from({ length: 50 }, (_, i) => currentBE - i).map(year => (
                  <option key={year} value={year.toString()}>
                    พ.ศ. {year} (ค.ศ. {year - 543})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* REAL-TIME CALCULATED AGE DISPLAY BOX */}
          <div className="bg-gradient-to-r from-orange-950/60 via-slate-950 to-slate-900 border border-orange-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-500/30">
                อายุ
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  อายุที่ระบบคำนวณให้อัตโนมัติ (ณ วันที่ปัจจุบัน):
                </p>
                <p className="text-base sm:text-lg font-black text-white">
                  <span className="text-orange-400">{ageResult.years}</span> ปี{' '}
                  <span className="text-orange-400">{ageResult.months}</span> เดือน{' '}
                  <span className="text-orange-400">{ageResult.days}</span> วัน
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-semibold">
              ✓ คำนวณเรียลไทม์
            </span>
          </div>

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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rescue-500" />
                เบอร์โทรศัพท์มือถือ *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="เช่น 089-123-4567"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm font-mono"
              />
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              เบอร์โทรศัพท์ติดต่อฉุกเฉิน *
            </label>
            <input
              type="tel"
              required
              value={emergencyPhone}
              onChange={e => setEmergencyPhone(e.target.value)}
              placeholder="เช่น 081-999-8877"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm font-mono"
            />
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
              onClick={() => setIsEditing(false)}
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 text-sm"
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
    </div>
  );
}
