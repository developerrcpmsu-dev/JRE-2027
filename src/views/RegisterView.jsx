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
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateAgeDetailed } from '../utils/ageCalculator';

export default function RegisterView({ 
  user, 
  myRegistration, 
  onSaveRegistration, 
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Load existing data if registered
  useEffect(() => {
    if (myRegistration) {
      setFirstName(myRegistration.first_name || '');
      setLastName(myRegistration.last_name || '');
      setBloodGroup(myRegistration.blood_group || 'O');
      setPhone(myRegistration.phone || '');
      setInstitution(myRegistration.institution || 'มหาวิทยาลัยมหาสารคาม (มมส)');
      setEmergencyName(myRegistration.emergency_name || '');
      setEmergencyPhone(myRegistration.emergency_phone || '');
      
      // Parse DOB
      if (myRegistration.dob) {
        const parts = myRegistration.dob.split('-');
        if (parts.length === 3) {
          setBirthYearBE(parts[0]);
          setBirthMonth(parseInt(parts[1], 10).toString());
          setBirthDay(parseInt(parts[2], 10).toString());
        }
      }
    }
  }, [myRegistration]);

  // Compute calculated age dynamically in real-time
  const ageResult = calculateAgeDetailed(birthYearBE, birthMonth, birthDay);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenGoogleLogin();
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
      group_assigned: myRegistration?.group_assigned || '',
      room_assigned: myRegistration?.room_assigned || '',
      status: 'confirmed'
    };

    try {
      await onSaveRegistration(payload);
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'บันทึกข้อมูลการสมัครเรียบร้อยแล้ว!' });
      
      // Trigger celebration confetti
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

  // If user is not logged in with Google yet
  if (!user && !myRegistration) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-rescue-500/10 border border-rescue-500/30 rounded-3xl mx-auto flex items-center justify-center text-rescue-500 mb-6 shadow-lg">
            <User className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-white mb-3">
            เข้าสู่ระบบเพื่อสมัครเข้าร่วม JRE 2027
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อกรอกใบสมัคร ตรวจสอบสถานะการจัดสรรกลุ่ม และห้องพักประจำโครงการ
          </p>

          <button
            onClick={onOpenGoogleLogin}
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl shadow-xl transition-all inline-flex items-center justify-center gap-3 text-sm active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            เข้าสู่ระบบด้วย Google ทันที
          </button>
        </div>
      </div>
    );
  }

  // APPLICANT DASHBOARD (View existing application & Admin allocations)
  if (myRegistration && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <img
                src={myRegistration.user_avatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-rescue-500 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">
                    {myRegistration.first_name} {myRegistration.last_name}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    ลงทะเบียนแล้ว
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  สังกัด: <span className="text-slate-200">{myRegistration.institution}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  อีเมล: {myRegistration.user_email} • รหัสอ้างอิง: JRE27-{myRegistration.id?.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              แก้ไขข้อมูลส่วนตัว
            </button>
          </div>

          {/* ADMIN ALLOCATIONS: Group & Room (User requirement highlighted) */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-rescue-500" />
              <h2 className="text-lg font-black text-white">
                ผลการจัดสรรจากผู้ดูแลระบบ (Admin Assignment)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group Assigned */}
              <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-800/60 p-5 rounded-2xl relative overflow-hidden">
                <p className="text-xs uppercase font-bold text-indigo-300 tracking-wider">
                  กลุ่มฝึกปฏิบัติการ (Assigned Group)
                </p>
                <div className="mt-2">
                  {myRegistration.group_assigned ? (
                    <div>
                      <p className="text-2xl font-black text-white flex items-center gap-2">
                        <span>🎯 {myRegistration.group_assigned}</span>
                      </p>
                      <p className="text-[11px] text-indigo-300 mt-1">
                        เข้ารายงานตัว ณ จุดรวมพลของกลุ่มตามเวลากำหนดการ
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 py-1">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      <span className="text-sm font-semibold">กำลังรอ Admin จัดสรรกลุ่มฝึก...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Assigned */}
              <div className="bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-800/60 p-5 rounded-2xl relative overflow-hidden">
                <p className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                  ห้องนอน / ที่พักค้างแรม (Assigned Room)
                </p>
                <div className="mt-2">
                  {myRegistration.room_assigned ? (
                    <div>
                      <p className="text-2xl font-black text-white flex items-center gap-2">
                        <span>🛏️ {myRegistration.room_assigned}</span>
                      </p>
                      <p className="text-[11px] text-amber-300 mt-1">
                        เข้าพักตามห้องนอนที่ระบุ ณ เรือนนอนหอพักนิสิต มมส
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 py-1">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      <span className="text-sm font-semibold">กำลังรอ Admin จัดสรรห้องพัก...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information & Age Detail Box */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
              ข้อมูลส่วนตัวที่ลงทะเบียน
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">อายุที่คำนวณได้:</span>
                <span className="font-bold text-rescue-400 text-sm">
                  {myRegistration.age_years} ปี {myRegistration.age_months} เดือน {myRegistration.age_days} วัน
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  เกิดวันที่: {myRegistration.dob} (พ.ศ.)
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">กรุ๊ปเลือด & เบอร์ติดต่อ:</span>
                <span className="font-bold text-emergency-400 text-sm">
                  กรุ๊ป {myRegistration.blood_group}
                </span>
                <span className="text-slate-300 block mt-0.5 font-mono">
                  โทร: {myRegistration.phone}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">ผู้ติดต่อกรณีฉุกเฉิน:</span>
                <span className="font-bold text-white text-sm truncate block">
                  {myRegistration.emergency_name}
                </span>
                <span className="text-emerald-400 block mt-0.5 font-mono">
                  โทร: {myRegistration.emergency_phone}
                </span>
              </div>
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

      </div>
    );
  }

  // REGISTRATION / EDIT FORM
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          ระบบรับสมัครเข้าร่วมโครงการ
        </div>
        <h1 className="text-3xl font-black text-white">
          ใบสมัครโครงการฝึกอบรมเชิงปฏิบัติการ JRE 2027
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          กรอกข้อมูลตามความเป็นจริงเพื่อใช้ในการทำประกันอุบัติเหตุ จัดสรรกลุ่ม และจัดห้องนอน
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

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Section 1: ชื่อและสังกัด */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-rescue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <User className="w-4 h-4" />
            1. ข้อมูลประจำตัวผู้สมัคร
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ชื่อจริง *
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                นามสกุล *
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              สังกัด / มหาวิทยาลัย / ชมรมกู้ภัย *
            </label>
            <input
              type="text"
              required
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="เช่น ชมรมกู้ภัยราชพฤกษ์ มมส, กู้ภัย มข, หรือ อื่นๆ"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500 text-sm"
            />
          </div>
        </div>

        {/* Section 2: วันเดือนปี พ.ศ. เกิด และการคำนวณอายุ อัตโนมัติ (User Requirement) */}
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

        {/* Section 3: บุคคลที่ติดต่อได้กรณีฉุกเฉิน (User Requirement) */}
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

        {/* Submit Actions */}
        <div className="pt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-rescue-600 via-orange-500 to-amber-500 hover:from-rescue-500 hover:to-orange-400 text-white font-bold rounded-2xl shadow-xl shadow-rescue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 text-base flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>ยืนยันและบันทึกใบสมัคร JRE 2027</span>
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
    </div>
  );
}
