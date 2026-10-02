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
  UserCheck
} from 'lucide-react';
import { DataService } from '../supabase';

export default function AdminDashboardView({
  registrations,
  onUpdateAllocation,
  onDeleteRegistration,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  formsConfig,
  onSaveFormsConfig,
  teamMembers,
  onSaveTeam,
  speakers,
  onSaveSpeakers
}) {
  const [activeTab, setActiveTab] = useState('applicants'); // 'applicants', 'forms', 'announcements'

  // Search & Filter for Applicants
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'special_care', 'no_group', 'has_group', 'no_room', 'has_room'
  const [bloodFilter, setBloodFilter] = useState('all');

  // Inline Quick Edit Allocation State
  const [editingUserId, setEditingUserId] = useState(null);
  const [allocGroup, setAllocGroup] = useState('');
  const [allocRoom, setAllocRoom] = useState('');

  // Full Profile & Remarks Modal State
  const [profileModalReg, setProfileModalReg] = useState(null);
  const [modalGroup, setModalGroup] = useState('');
  const [modalRoom, setModalRoom] = useState('');
  const [modalSpecialCare, setModalSpecialCare] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalInstitution, setModalInstitution] = useState('');
  const [modalMedical, setModalMedical] = useState('');
  const [modalAllergy, setModalAllergy] = useState('');
  const [modalTraining, setModalTraining] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Forms Config State
  const [localForms, setLocalForms] = useState(formsConfig || {
    pretest: { title: 'แบบทดสอบก่อนการฝึกอบรม (Pre-Test)', url: '', enabled: false },
    posttest: { title: 'แบบทดสอบหลังการฝึกอบรม (Post-Test)', url: '', enabled: false },
    evaluation: { title: 'แบบประเมินความพึงพอใจโครงการ (Evaluation)', url: '', enabled: false }
  });
  const [formsSavedMsg, setFormsSavedMsg] = useState(false);

  // Notification Toast
  const [alertToast, setAlertToast] = useState(null);
  const triggerToast = (msg) => {
    setAlertToast(msg);
    setTimeout(() => setAlertToast(null), 3500);
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

  // Open Full Profile & Remarks Modal
  const handleOpenProfileModal = (reg) => {
    setProfileModalReg(reg);
    setModalGroup(reg.group_assigned || '');
    setModalRoom(reg.room_assigned || '');
    setModalSpecialCare(Boolean(reg.is_special_care));
    setModalNotes(reg.special_notes || '');
    setModalPhone(reg.phone || '');
    setModalInstitution(reg.institution || '');
    setModalMedical(reg.medical_history || '');
    setModalAllergy(reg.food_allergy || '');
    setModalTraining(reg.previous_training || '');
  };

  // Save Full Profile & Special Care Remarks
  const handleSaveProfileModal = async (e) => {
    e.preventDefault();
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
        previous_training: modalTraining.trim()
      };

      await onUpdateAllocation(profileModalReg.user_id, updates);
      triggerToast(`บันทึกประวัติและหมายเหตุพิเศษของ ${profileModalReg.first_name} เรียบร้อยแล้ว`);
      setProfileModalReg(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteReg = async (userId, name) => {
    if (window.confirm(`ยืนยันการลบข้อมูลผู้สมัคร: ${name} หรือไม่?`)) {
      await onDeleteRegistration(userId);
      triggerToast('ลบข้อมูลผู้สมัครเรียบร้อยแล้ว');
    }
  };

  // Filtered registrations
  const filteredRegs = registrations.filter(reg => {
    const textTarget = (
      (reg.first_name || '') + ' ' + 
      (reg.last_name || '') + ' ' + 
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
    else if (filterType === 'no_group') matchFilter = !reg.group_assigned;
    else if (filterType === 'has_group') matchFilter = Boolean(reg.group_assigned);
    else if (filterType === 'no_room') matchFilter = !reg.room_assigned;
    else if (filterType === 'has_room') matchFilter = Boolean(reg.room_assigned);

    return matchSearch && matchBlood && matchFilter;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ชื่อ-สกุล', 'วันเกิด', 'อายุ', 'กรุ๊ปเลือด', 'เบอร์โทร', 'สังกัด', 
      'ติดต่อฉุกเฉิน', 'เบอร์ฉุกเฉิน', 'กลุ่มฝึก', 'ห้องนอน', 'ดูแลพิเศษ', 'หมายเหตุพิเศษ', 'โรคประจำตัว', 'แพ้อาหารยา', 'ประวัติฝึกอบรม'
    ];
    const rows = registrations.map(r => [
      `"${r.first_name || ''} ${r.last_name || ''}"`,
      `"${r.dob || ''}"`,
      `"${r.age_years || 0} ปี ${r.age_months || 0} เดือน"`,
      `"${r.blood_group || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.institution || ''}"`,
      `"${r.emergency_name || ''}"`,
      `"${r.emergency_phone || ''}"`,
      `"${r.group_assigned || 'ยังไม่จัดสรร'}"`,
      `"${r.room_assigned || 'ยังไม่จัดสรร'}"`,
      `"${r.is_special_care ? 'ใช่ (ดูแลพิเศษ)' : 'ปกติ'}"`,
      `"${(r.special_notes || '').replace(/"/g, '""')}"`,
      `"${(r.medical_history || '').replace(/"/g, '""')}"`,
      `"${(r.food_allergy || '').replace(/"/g, '""')}"`,
      `"${(r.previous_training || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JRE2027_applicants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Handlers for Forms Config ---
  const handleSaveForms = async (e) => {
    e.preventDefault();
    await onSaveFormsConfig(localForms);
    setFormsSavedMsg(true);
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

  // --- Handlers for Announcements ---
  const handleOpenAnnModal = (item = null) => {
    if (item) {
      setEditingAnn(item);
      setAnnTitle(item.title || '');
      setAnnContent(item.content || '');
      setAnnCategory(item.category || 'general');
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
      setAnnUrl('');
      setAnnLabel('');
      setAnnPinned(false);
      setAnnImages([]);
      setAnnPdfUrl('');
      setAnnPdfName('');
    }
    setShowAnnModal(true);
  };

  // Multiple Images Upload (Up to 10 photos)
  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const availableSlots = 10 - annImages.length;
    if (availableSlots <= 0) {
      alert('แนบรูปภาพได้สูงสุด 10 รูปเท่านั้น');
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
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setAnnImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // PDF Document Upload
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('กรุณาเลือกไฟล์เอกสารนามสกุล .pdf เท่านั้น');
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
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PDF');
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
    const payload = {
      ...(editingAnn?.id ? { id: editingAnn.id } : {}),
      title: annTitle.trim(),
      content: annContent.trim(),
      category: annCategory,
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
    if (window.confirm('ยืนยันการลบประกาศนี้?')) {
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
              ค้นหาประวัติผู้สมัคร ดูแลพิเศษ จัดกลุ่มและห้องนอน จัดการ Google Forms และประกาศพร้อมแนบรูป/PDF
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              ดาวน์โหลด CSV รายชื่อทั้งหมด
            </button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">ผู้สมัครทั้งหมด</span>
            <p className="text-2xl font-black text-white mt-1">{registrations.length} คน</p>
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
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">จัดห้องนอนแล้ว</span>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {registrations.filter(r => r.room_assigned).length} คน
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('applicants')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'applicants'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการผู้สมัคร & ดูประวัติละเอียด ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'forms'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>แบบทดสอบ & ประเมิน Google Forms</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>ระบบประกาศ & อัปโหลดรูป/PDF ({announcements.length})</span>
        </button>
      </div>

      {/* TAB 1: APPLICANTS & ALLOCATION & PROFILE VIEWER */}
      {activeTab === 'applicants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, เบอร์โทร, สังกัด, ประวัติ, หรือหมายเหตุ..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter Pills / Selects */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="special_care">⭐ ดูแลเป็นพิเศษ ({registrations.filter(r => r.is_special_care).length})</option>
                <option value="no_group">ยังไม่จัดกลุ่ม ({registrations.filter(r => !r.group_assigned).length})</option>
                <option value="has_group">จัดกลุ่มแล้ว ({registrations.filter(r => r.group_assigned).length})</option>
                <option value="no_room">ยังไม่จัดห้อง ({registrations.filter(r => !r.room_assigned).length})</option>
                <option value="has_room">จัดห้องแล้ว ({registrations.filter(r => r.room_assigned).length})</option>
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
                  <th className="py-4 px-3">อายุ / วันเกิด</th>
                  <th className="py-4 px-3">กรุ๊ปเลือด / เบอร์โทร</th>
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

                    return (
                      <tr 
                        key={reg.user_id || reg.id} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          reg.is_special_care ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        
                        {/* Name, Org, Email & Special Care Badge */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {reg.first_name} {reg.last_name}
                            </span>
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
                            {reg.user_email}
                          </div>
                        </td>

                        {/* Age & DOB */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          <span className="font-semibold text-rescue-400">
                            {reg.age_years || 0} ปี {reg.age_months || 0} ด.
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            เกิด: {reg.dob || '-'}
                          </span>
                        </td>

                        {/* Blood & Phone */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800/70 rounded-md font-bold text-[10px]">
                            {reg.blood_group}
                          </span>
                          <span className="block text-slate-300 font-mono mt-1 text-[11px]">
                            {reg.phone}
                          </span>
                        </td>

                        {/* Health & Special Notes */}
                        <td className="py-4 px-3 max-w-[180px]">
                          {reg.is_special_care && reg.special_notes ? (
                            <div className="text-rose-300 text-[11px] font-medium line-clamp-2 bg-rose-950/30 p-1.5 rounded-lg border border-rose-900/40">
                              ⚠️ {reg.special_notes}
                            </div>
                          ) : reg.medical_history && reg.medical_history !== 'ไม่มี' ? (
                            <div className="text-amber-300 text-[11px] truncate">
                              🩺 {reg.medical_history}
                            </div>
                          ) : reg.food_allergy && reg.food_allergy !== 'ไม่มี' ? (
                            <div className="text-yellow-300 text-[11px] truncate">
                              🍽️ {reg.food_allergy}
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
                                onClick={() => handleOpenProfileModal(reg)}
                                className="px-2.5 py-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                                title="ดูประวัติเต็ม & บันทึกข้อควรระวังพิเศษ"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setProfileModalReg(null)}
              className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <img
                src={profileModalReg.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-rescue-500 shadow-md"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {profileModalReg.first_name} {profileModalReg.last_name}
                  </h3>
                  {modalSpecialCare && (
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-black animate-pulse flex items-center gap-1">
                      ⭐ ผู้เข้าร่วมดูแลเป็นพิเศษ
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  สังกัด: <span className="text-white font-medium">{profileModalReg.institution}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  อีเมล: {profileModalReg.user_email} • รหัสอ้างอิง: JRE27-{profileModalReg.id?.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfileModal} className="mt-6 space-y-6">
              
              {/* Detailed Readonly / Summary Stats */}
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

              {/* Health & Training Details */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                      <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                      โรคประจำตัว / ข้อจำกัดทางกาย
                    </label>
                    <input
                      type="text"
                      value={modalMedical}
                      onChange={e => setModalMedical(e.target.value)}
                      placeholder="เช่น ไม่มี หรือ โรคหอบหืด"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                      ประวัติการแพ้ยา / แพ้อาหาร
                    </label>
                    <input
                      type="text"
                      value={modalAllergy}
                      onChange={e => setModalAllergy(e.target.value)}
                      placeholder="เช่น ไม่มี หรือ แพ้ยาเพนนิซิลิน"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
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
                    value={modalTraining}
                    onChange={e => setModalTraining(e.target.value)}
                    placeholder="ประวัติการฝึกอบรมกู้ภัย เช่น BLS, CPR, เชือกกู้ภัย"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              {/* Admin Special Care & Remarks Section (Key User Requirement) */}
              <div className="p-4 bg-gradient-to-r from-rose-950/30 via-slate-950 to-amber-950/20 border border-rose-500/40 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <h4 className="font-bold text-white text-sm">
                      การบันทึกดูแลพิเศษและการจัดสรร (Admin Remarks)
                    </h4>
                  </div>
                  
                  {/* Special Care Checkbox Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-600/40 hover:bg-rose-900/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={modalSpecialCare}
                      onChange={e => setModalSpecialCare(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-rose-400"
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
                    value={modalNotes}
                    onChange={e => setModalNotes(e.target.value)}
                    placeholder="ระบุข้อควรระวัง เช่น มีโรคประจำตัวหอบหืด ต้องพกยาพ่นติดตัวตลอดเวลา, ทานอาหารฮาลาล/มังสวิรัติ, หรือเฝ้าระวังอาการแพ้แดดจัด ฯลฯ"
                    className="w-full px-3 py-2 bg-slate-900 border border-rose-800/60 rounded-xl text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                {/* Group & Room Allocation in Modal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 mb-1">
                      กลุ่มฝึกปฏิบัติการ (Assigned Group):
                    </label>
                    <input
                      type="text"
                      value={modalGroup}
                      onChange={e => setModalGroup(e.target.value)}
                      placeholder="เช่น Alpha-1 หรือ ฐานปฏิบัติการ 2"
                      className="w-full px-3 py-2 bg-slate-900 border border-indigo-700/60 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      ห้องนอน / ที่พักค้างแรม (Assigned Room):
                    </label>
                    <input
                      type="text"
                      value={modalRoom}
                      onChange={e => setModalRoom(e.target.value)}
                      placeholder="เช่น เรือนนอน 1 ห้อง 204"
                      className="w-full px-3 py-2 bg-slate-900 border border-amber-700/60 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileModalReg(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  ปิดหน้าต่าง
                </button>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>บันทึกการจัดสรรและหมายเหตุพิเศษ</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE FORMS MANAGER */}
      {activeTab === 'forms' && (
        <form onSubmit={handleSaveForms} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              จัดการ URL แบบทดสอบก่อน-หลัง และแบบประเมิน (Google Forms)
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Admin สามารถใส่ URL ของ Google Form แต่ละรายการ และเปิด/ปิดการแสดงผลให้ผู้เข้าอบรมเห็นได้ตลอดเวลา (ใช้งานได้จริงและบันทึกสู่ Supabase)
            </p>
          </div>

          <div className="space-y-6">
            
            {/* 1. Pre-Test Form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    1. แบบทดสอบก่อนการฝึกอบรม (Pre-Test)
                  </h4>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleForm('pretest')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    localForms.pretest?.enabled
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {localForms.pretest?.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{localForms.pretest?.enabled ? 'เปิดให้ทำข้อสอบ (Active)' : 'ปิดระบบ (Disabled)'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Google Form URL (Pre-test):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.pretest?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      pretest: { ...localForms.pretest, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  {localForms.pretest?.url && (
                    <a
                      href={localForms.pretest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเปิด</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Post-Test Form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    2. แบบทดสอบหลังการฝึกอบรม (Post-Test)
                  </h4>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleForm('posttest')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    localForms.posttest?.enabled
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {localForms.posttest?.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{localForms.posttest?.enabled ? 'เปิดให้ทำข้อสอบ (Active)' : 'ปิดระบบ (Disabled)'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Google Form URL (Post-test):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.posttest?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      posttest: { ...localForms.posttest, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  {localForms.posttest?.url && (
                    <a
                      href={localForms.posttest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเปิด</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Evaluation Form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    3. แบบประเมินความพึงพอใจโครงการ (Evaluation Form)
                  </h4>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleForm('evaluation')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    localForms.evaluation?.enabled
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {localForms.evaluation?.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{localForms.evaluation?.enabled ? 'เปิดให้ประเมิน (Active)' : 'ปิดระบบ (Disabled)'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Google Form URL (Evaluation):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.evaluation?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      evaluation: { ...localForms.evaluation, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  {localForms.evaluation?.url && (
                    <a
                      href={localForms.evaluation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเปิด</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/30 text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าลิงก์และสถานะเปิด/ปิด</span>
            </button>
            {formsSavedMsg && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                บันทึกการตั้งค่าเรียบร้อยแล้ว
              </span>
            )}
          </div>

        </form>
      )}

      {/* TAB 3: ANNOUNCEMENTS MANAGER WITH IMAGE & PDF UPLOAD */}
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
            {announcements.map(ann => (
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

                  <h4 className="font-bold text-white text-base">
                    {ann.title}
                  </h4>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>

                  {ann.action_url && (
                    <p className="text-[11px] text-rescue-400 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      ลิงก์: {ann.action_url}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenAnnModal(ann)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-xs flex items-center gap-1"
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
            ))}
          </div>

        </div>
      )}

      {/* ANNOUNCEMENT CREATE / EDIT MODAL */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowAnnModal(false)}
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

                {/* Previews Grid */}
                {annImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                    {annImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group">
                        <img src={imgUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors shadow"
                          title="ลบรูปภาพนี้"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Upload Button */}
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
                        accept="image/*"
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
                    <span className="text-xs font-bold text-white">
                      เอกสารแนบ PDF ทางการ
                    </span>
                  </div>
                </div>

                {annPdfUrl ? (
                  <div className="flex items-center justify-between p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-5 h-5 text-red-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">
                          {annPdfName || 'เอกสารทางการ.pdf'}
                        </p>
                        <a
                          href={annPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Eye className="w-3 h-3" /> เปิดดูตัวอย่าง
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors ml-2 shrink-0"
                      title="ลบไฟล์ PDF นี้"
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
                  onClick={() => setShowAnnModal(false)}
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
      )}

    </div>
  );
}
