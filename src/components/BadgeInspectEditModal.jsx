import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Save,
  Scissors,
  Download,
  Printer,
  ShieldCheck,
  Award,
  Users,
  RotateCw,
  QrCode,
  Droplet,
  Radio,
  Star,
  ExternalLink,
  Edit3
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import IDCardPreview, {
  renderNativeIdCardCanvas,
  renderNativeIdCardBackCanvas
} from './IDCardPreview';
import { getRegistrationCardData } from '../utils/idCard';
import { isStaffRegistration } from '../data/defaultData';

export default function BadgeInspectEditModal({
  isOpen,
  person,
  onClose,
  onSave,
  onOpenCropper
}) {
  const reg = person?.reg || person;

  // Form states
  const [formData, setFormData] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    englishName: '',
    callsign: '',
    nickname: '',
    affiliation: '',
    unit: '',
    bloodGroup: 'O',
    badgeRole: 'PARTICIPANT', // 'DEV' | 'STAFF' | 'PARTICIPANT'
    isDev: false,
    isStaff: false,
    idCardPhoto: ''
  });

  const [activeSide, setActiveSide] = useState('front');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && reg) {
      const cardData = getRegistrationCardData(reg);
      const badgeRole = cardData.badgeRole || resolveBadgeRole(reg);
      const isDev = badgeRole === 'DEV';
      const isStaff = isDev || badgeRole === 'STAFF';

      setFormData({
        prefix: reg.prefix || cardData.prefix || '',
        firstName: reg.first_name || cardData.firstName || '',
        lastName: reg.last_name || cardData.lastName || '',
        englishName: cardData.englishName || reg.name_en || '',
        callsign: reg.callsign || cardData.callsign || '',
        nickname: reg.nickname || cardData.nickname || '',
        affiliation: reg.affiliation || reg.institution || cardData.affiliation || '',
        unit: reg.unit || cardData.unit || '',
        bloodGroup: reg.blood_group || cardData.bloodGroup || 'O',
        badgeRole,
        isDev,
        isStaff,
        idCardPhoto: reg.id_card_photo || cardData.photo || ''
      });
      setActiveSide('front');
    }
  }, [isOpen, reg]);

  if (!isOpen || !reg) return null;

  // Construct synthetic registration object for live reactive preview
  const liveRegistration = {
    ...reg,
    prefix: formData.prefix,
    first_name: formData.firstName,
    last_name: formData.lastName,
    name_en: formData.englishName,
    callsign: formData.callsign,
    nickname: formData.nickname,
    affiliation: formData.affiliation,
    institution: formData.affiliation,
    unit: formData.unit,
    blood_group: formData.bloodGroup,
    badge_role: formData.badgeRole,
    is_dev: formData.badgeRole === 'DEV',
    is_staff: formData.badgeRole === 'DEV' || formData.badgeRole === 'STAFF',
    admin_staff_override: formData.badgeRole === 'DEV' || formData.badgeRole === 'STAFF',
    registration_type: formData.badgeRole === 'DEV' ? 'dev' : formData.badgeRole === 'STAFF' ? 'staff' : 'participant',
    staff_role: formData.badgeRole === 'DEV' ? 'BestCyniX Dev / System Admin' : (reg.staff_role || 'Staff คณะทำงาน'),
    id_card_photo: formData.idCardPhoto
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      const updates = {
        prefix: formData.prefix.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        name_en: formData.englishName.trim(),
        callsign: formData.callsign.trim(),
        nickname: formData.nickname.trim(),
        affiliation: formData.affiliation.trim(),
        institution: formData.affiliation.trim(),
        unit: formData.unit.trim(),
        blood_group: formData.bloodGroup,
        badge_role: formData.badgeRole,
        is_dev: formData.badgeRole === 'DEV',
        is_staff: formData.badgeRole === 'DEV' || formData.badgeRole === 'STAFF',
        admin_staff_override: formData.badgeRole === 'DEV' || formData.badgeRole === 'STAFF',
        registration_type: formData.badgeRole === 'DEV' ? 'dev' : formData.badgeRole === 'STAFF' ? 'staff' : 'participant',
        staff_role: formData.badgeRole === 'DEV' ? 'BestCyniX Dev / System Admin' : (formData.badgeRole === 'STAFF' ? (reg.staff_role || 'Staff คณะทำงาน') : ''),
        id_card_photo: formData.idCardPhoto
      };

      await onSave(reg.user_id || reg.id, updates);
      onClose();
    } catch (err) {
      console.error('Save badge error:', err);
      alert('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPNG = async () => {
    setIsDownloading(true);
    try {
      const cardData = getRegistrationCardData(liveRegistration);
      let canvas;
      let filename;

      if (activeSide === 'back') {
        canvas = await renderNativeIdCardBackCanvas();
        filename = `JRE2027_Badge_Back_${cardData.cardCode}.png`;
      } else {
        canvas = await renderNativeIdCardCanvas({
          photo: formData.idCardPhoto || cardData.photo,
          cardData,
          orientation: 'portrait'
        });
        filename = `JRE2027_Badge_Front_${cardData.cardCode}_${cardData.thaiName || 'card'}.png`;
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    ตรวจสอบ & แก้ไขข้อมูลบัตรประจำตัว (CR100)
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    formData.badgeRole === 'DEV'
                      ? 'border-purple-400/80 bg-purple-500/20 text-purple-300'
                      : formData.badgeRole === 'STAFF'
                      ? 'border-yellow-400/80 bg-yellow-500/20 text-yellow-300' 
                      : 'border-sky-400/80 bg-sky-500/20 text-sky-300'
                  }`}>
                    {formData.badgeRole === 'DEV' ? '💻 DEVRCPMSU' : formData.badgeRole === 'STAFF' ? '⭐ ORGANIZING STAFF' : '🎓 PARTICIPANT'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  รหัสบัตร: <span className="font-mono text-orange-300">{reg.id || reg.user_id}</span> • ปรับเปลี่ยนข้อมูลแล้วการ์ดตัวอย่างจะอัปเดตแบบเรียลไทม์ทันที
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body: Two Columns (Left: Live Reactive Card Preview, Right: Edit Form) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#071324]">
            {/* Left Column: Live Card Preview (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  ตัวอย่างบัตรสด (LIVE PREVIEW)
                </span>
                <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveSide('front')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeSide === 'front' ? 'bg-orange-500 text-slate-950 font-black' : 'text-slate-300'
                    }`}
                  >
                    ด้านหน้า
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSide('back')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeSide === 'back' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-300'
                    }`}
                  >
                    ด้านหลัง
                  </button>
                </div>
              </div>

              {/* Scaled ID Card Preview Container */}
              <div className="relative w-full flex justify-center py-2">
                <div style={{ width: '310px', height: '388px' }} className="relative shrink-0 shadow-2xl rounded-[18px] overflow-hidden border border-slate-700">
                  <div style={{ transform: 'scale(0.6458)', transformOrigin: 'top left', width: '480px', height: '600px' }}>
                    <IDCardPreview
                      registration={liveRegistration}
                      showActions={false}
                      defaultOrientation="portrait"
                      allowOrientationToggle={false}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions under Preview */}
              <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenCropper(liveRegistration)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/50 bg-orange-500/15 px-3 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/25 transition-colors cursor-pointer"
                >
                  <Scissors className="h-3.5 w-3.5" />
                  <span>✂️ ครอป / จัดรูปถ่าย</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>โหลด PNG 1200×1500</span>
                </button>
              </div>
            </div>

            {/* Right Column: Editable Form Fields (7 Cols) */}
            <form onSubmit={handleSave} className="lg:col-span-7 space-y-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-5">
              {/* Role Toggle Banner */}
              <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    ประเภทบทบาทในโครงการ (Badge Role)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    * มีผลต่อสีและตราสัญลักษณ์บนบัตรทันที
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* DEV Button */}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, badgeRole: 'DEV', isDev: true, isStaff: true }))}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-black transition-all cursor-pointer border ${
                      formData.badgeRole === 'DEV'
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white border-cyan-300 shadow-md ring-2 ring-purple-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>💻 DEVRCPMSU</span>
                  </button>

                  {/* STAFF Button */}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, badgeRole: 'STAFF', isDev: false, isStaff: true }))}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-black transition-all cursor-pointer border ${
                      formData.badgeRole === 'STAFF'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-yellow-300 shadow-md ring-2 ring-yellow-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Award className="h-4 w-4 shrink-0" />
                    <span>⭐ ORGANIZING STAFF</span>
                  </button>

                  {/* PARTICIPANT Button */}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, badgeRole: 'PARTICIPANT', isDev: false, isStaff: false }))}
                    className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-black transition-all cursor-pointer border ${
                      formData.badgeRole === 'PARTICIPANT'
                        ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border-sky-300 shadow-md ring-2 ring-sky-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>🎓 PARTICIPANT</span>
                  </button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    คำนำหน้า
                  </label>
                  <input
                    type="text"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="นาย / นางสาว"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ชื่อจริง (ไทย)
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    นามสกุล (ไทย)
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* English Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ชื่อ–สกุล ภาษาอังกฤษ (Full English Name)
                </label>
                <input
                  type="text"
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  placeholder="Mr. Pongporn Thongsiri"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none font-sans"
                />
              </div>

              {/* Callsign & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-sky-400 mb-1 flex items-center gap-1">
                    <Radio className="h-3.5 w-3.5" />
                    <span>นามเรียกขาน ว. (Callsign)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.callsign}
                    onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                    placeholder="เช่น 16-37, RESCUE-01"
                    className="w-full rounded-xl border border-sky-500/40 bg-slate-950 px-3 py-2 text-xs font-mono font-black text-sky-200 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    <span>ชื่อเล่น (Nickname)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="เช่น เบส / Best"
                    className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3 py-2 text-xs font-bold text-amber-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Affiliation & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    สังกัดสถาบัน / มหาวิทยาลัย
                  </label>
                  <input
                    type="text"
                    value={formData.affiliation}
                    onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                    placeholder="มหาวิทยาลัยมหาสารคาม (มมส)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    หน่วย / ชมรมกู้ชีพกู้ภัย
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="ชมรมกู้ภัยราชพฤกษ์"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Blood Group & Photo Quick Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-rose-400 mb-1 flex items-center gap-1">
                    <Droplet className="h-3.5 w-3.5 fill-rose-500" />
                    <span>หมู่เลือด (Blood Group)</span>
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-rose-500/40 bg-slate-950 px-3 py-2 text-xs font-mono font-black text-rose-200 focus:border-rose-400 focus:outline-none cursor-pointer"
                  >
                    <option value="A">หมู่ A</option>
                    <option value="B">หมู่ B</option>
                    <option value="O">หมู่ O</option>
                    <option value="AB">หมู่ AB</option>
                    <option value="A+">หมู่ A (Rh+)</option>
                    <option value="B+">หมู่ B (Rh+)</option>
                    <option value="O+">หมู่ O (Rh+)</option>
                    <option value="AB+">หมู่ AB (Rh+)</option>
                    <option value="A-">หมู่ A (Rh-)</option>
                    <option value="B-">หมู่ B (Rh-)</option>
                    <option value="O-">หมู่ O (Rh-)</option>
                    <option value="AB-">หมู่ AB (Rh-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    รูปถ่ายบัตรปัจจุบัน
                  </label>
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.idCardPhoto || '/images/logo/jre_logo_square.png'}
                      alt="Thumbnail"
                      className="h-10 w-9 rounded-lg object-cover border border-slate-700 bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenCropper(liveRegistration)}
                      className="flex-1 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/20 transition-colors cursor-pointer"
                    >
                      ✂️ ครอปรูปใหม่
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูลและอัปเดตบัตร'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
