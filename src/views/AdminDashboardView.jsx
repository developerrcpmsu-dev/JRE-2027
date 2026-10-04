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
  GraduationCap
} from 'lucide-react';
import { DataService } from '../supabase';
import { 
  DEFAULT_PAYMENT_CONFIG, 
  DEFAULT_MERCHANDISE_CONFIG,
  DEFAULT_SPEAKERS,
  DEFAULT_TEAM_MEMBERS
} from '../data/defaultData';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import AdminQRScannerModal from '../components/AdminQRScannerModal';

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab === 'payment_settings' ? 'payment' : tab);
    }
  };

  // Merchandise State
  const [localMerchConfig, setLocalMerchConfig] = useState(() => {
    return merchandiseConfig || DEFAULT_MERCHANDISE_CONFIG;
  });
  const [isSavingMerch, setIsSavingMerch] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [merchSearchQuery, setMerchSearchQuery] = useState('');
  const [merchStatusFilter, setMerchStatusFilter] = useState('all');
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeMeasurement, setNewSizeMeasurement] = useState('');
  const [newSizeExtra, setNewSizeExtra] = useState(0);
  const [previewMerchSlip, setPreviewMerchSlip] = useState(null);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);
  const [previewProductImageModal, setPreviewProductImageModal] = useState(null);

  React.useEffect(() => {
    if (merchandiseConfig) {
      setLocalMerchConfig(merchandiseConfig);
    }
  }, [merchandiseConfig]);

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
  const [modalPaymentAmount, setModalPaymentAmount] = useState(350);
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
      triggerToast('บันทึกการตั้งค่าค่าสมัครและระบบแบ่งจ่าย 2 งวดเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่าค่าสมัคร');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // In-App Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  // Notification Toast
  const [alertToast, setAlertToast] = useState(null);
  const triggerToast = (msg) => {
    setAlertToast(msg);
    setTimeout(() => setAlertToast(null), 3500);
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
    if (!window.confirm(`ยืนยันการลบวิทยากร "${spkToDelete?.name || ''}" หรือไม่?`)) return;
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
    if (!window.confirm(`ยืนยันการลบ "${memberToDelete?.name || ''}" หรือไม่?`)) return;
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

  // Open Full Profile & Remarks Modal
  const handleOpenProfileModal = (reg, initialTab = 'info') => {
    setProfileModalReg(reg);
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
    setModalPaymentStatus(reg.payment_status || 'unpaid');
    setModalPaymentAmount(reg.payment_amount || 350);
    setModalPaymentBank(reg.payment_bank_info || 'ธนาคารกรุงไทย เลขที่ 984-0-XXXXX-X ชื่อบัญชี ชมรมกู้ภัยราชพฤกษ์ มมส');
    setModalPaymentNotes(reg.payment_notes || '');
    setNewMsgText('');
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
        payment_amount: Number(modalPaymentAmount) || 350,
        payment_bank_info: modalPaymentBank.trim(),
        payment_notes: modalPaymentNotes.trim()
      };

      await onUpdateAllocation(profileModalReg.user_id, updates);
      
      // Update local modal state copy
      setProfileModalReg(prev => ({ ...prev, ...updates }));
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
        payment_amount: Number(modalPaymentAmount) || 350,
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
    else if (filterType === 'unpaid') matchFilter = reg.payment_status === 'unpaid' || !reg.payment_status;
    else if (filterType === 'pending_review') matchFilter = reg.payment_status === 'pending_review';
    else if (filterType === 'paid') matchFilter = reg.payment_status === 'paid';
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
      'ติดต่อฉุกเฉิน', 'เบอร์ฉุกเฉิน', 'กลุ่มฝึก', 'ห้องนอน', 'สถานะการชำระเงิน', 'ยอดเงิน', 'สลิปโอนเงิน', 'ดูแลพิเศษ', 'หมายเหตุพิเศษ'
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
      `"${r.payment_status === 'paid' ? 'ชำระแล้ว' : r.payment_status === 'pending_review' ? 'รอตรวจสลิป' : 'ค้างชำระ'}"`,
      `"${r.payment_amount || 350}"`,
      `"${r.payment_slip_url || ''}"`,
      `"${r.is_special_care ? 'ใช่ (ดูแลพิเศษ)' : 'ปกติ'}"`,
      `"${(r.special_notes || '').replace(/"/g, '""')}"`
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

  // --- Handlers for Merchandise & Orders ---
  const handleSaveMerchandiseConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingMerch(true);
    try {
      await onSaveMerchandiseConfig(localMerchConfig);
      triggerToast('บันทึกการตั้งค่าสินค้า ไซต์ ราคา และ Google Form สำรองเรียบร้อยแล้ว');
    } catch (err) {
      triggerToast('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    } finally {
      setIsSavingMerch(false);
    }
  };

  const handleAddSizeToProduct = () => {
    if (!newSizeName.trim()) {
      alert('กรุณาระบุชื่อไซส์ เช่น 2XL, 3XL');
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
      alert('กรุณากรอกลิงก์ URL รูปภาพสินค้า');
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
              ตรวจสอบสลิปการโอนเงิน, ส่งข้อความแจ้งเตือนผู้สมัคร, ขอเอกสารสำคัญ, ดูแลพิเศษ และจัดกลุ่ม/ห้องพัก
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
          <span>จัดการเสื้อ/กางเกง & สแกน QR ({merchandiseOrders.length})</span>
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
                            {reg.phone} • {reg.user_email}
                          </div>
                        </td>

                        {/* Payment Status & Slip */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          {reg.payment_plan === 'installment' || reg.installment_1_slip_url || reg.installment_2_slip_url ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProfileModal(reg, 'payment')}
                              className="text-left group cursor-pointer block hover:opacity-90"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-bold">
                                  แบ่งจ่าย 2 งวด
                                </span>
                                {paymentStatus === 'paid' ? (
                                  <span className="text-[10px] text-emerald-400 font-bold">✓ ครบ 2 งวด</span>
                                ) : (
                                  <span className="text-[10px] text-amber-300 font-medium">(คลิกตรวจ)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className={reg.installment_1_status === 'paid' ? 'text-emerald-400 font-bold' : reg.installment_1_status === 'pending_review' ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                                  งวด 1: {reg.installment_1_status === 'paid' ? '✓ ชำระแล้ว' : reg.installment_1_status === 'pending_review' ? '🟡 รอตรวจ' : '🔴 ค้าง'}
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className={reg.installment_2_status === 'paid' ? 'text-emerald-400 font-bold' : reg.installment_2_status === 'pending_review' ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                                  งวด 2: {reg.installment_2_status === 'paid' ? '✓ ชำระแล้ว' : reg.installment_2_status === 'pending_review' ? '🟡 รอตรวจ' : '🔴 ค้าง'}
                                </span>
                              </div>
                            </button>
                          ) : paymentStatus === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProfileModal(reg, 'payment')}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> ชำระแล้ว ({reg.payment_amount || localPayment.fee_total || 650} บ.)
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
                              <AlertCircle className="w-3 h-3" /> ค้างชำระ ({reg.payment_amount || localPayment.fee_total || 650} บ.)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            
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
                  {modalPaymentStatus === 'paid' ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                      ✓ ชำระเงินแล้ว
                    </span>
                  ) : modalPaymentStatus === 'pending_review' ? (
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse">
                      ⏳ รอตรวจสลิป
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold">
                      🔴 ค้างชำระ ({modalPaymentAmount} บ.)
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

            {/* Modal Internal Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 mt-4 pb-2">
              <button
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

            {/* TAB 1: INFO & SPECIAL CARE & ALLOCATIONS */}
            {profileModalTab === 'info' && (
              <form onSubmit={handleSaveProfileModal} className="mt-5 space-y-6">
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

                <div className="p-4 bg-gradient-to-r from-rose-950/30 via-slate-950 to-amber-950/20 border border-rose-500/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                      <h4 className="font-bold text-white text-sm">
                        การบันทึกดูแลพิเศษและการจัดสรร (Admin Remarks)
                      </h4>
                    </div>
                    
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
                      placeholder="ระบุข้อควรระวัง เช่น มีโรคประจำตัวหอบหืด ต้องพกยาพ่นติดตัวตลอดเวลา, ทานอาหารฮาลาล/มังสวิรัติ ฯลฯ"
                      className="w-full px-3 py-2 bg-slate-900 border border-rose-800/60 rounded-xl text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-indigo-300 mb-1">
                        กลุ่มฝึกปฏิบัติการ (Assigned Group):
                      </label>
                      <input
                        type="text"
                        value={modalGroup}
                        onChange={e => setModalGroup(e.target.value)}
                        placeholder="เช่น Alpha-1"
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

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>บันทึกข้อมูลและหมายเหตุ</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PAYMENT & SLIP VERIFICATION */}
            {profileModalTab === 'payment' && (
              <div className="mt-5 space-y-6 text-xs">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    การจัดการยอดชำระเงินและตรวจสอบสลิป
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">สถานะการชำระเงิน:</label>
                      <select
                        value={modalPaymentStatus}
                        onChange={e => setModalPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
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
                        value={modalPaymentAmount}
                        onChange={e => setModalPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">หมายเหตุเรื่องเงิน:</label>
                      <input
                        type="text"
                        value={modalPaymentNotes}
                        onChange={e => setModalPaymentNotes(e.target.value)}
                        placeholder="เช่น ชำระครบถ้วน, โอนผ่าน KTB"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">ข้อมูลบัญชีรับโอนเงิน:</label>
                    <input
                      type="text"
                      value={modalPaymentBank}
                      onChange={e => setModalPaymentBank(e.target.value)}
                      placeholder="ธนาคารกรุงไทย เลขที่ 984-0-XXXXX-X ชื่อบัญชี ชมรมกู้ภัยราชพฤกษ์ มมส"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveProfileModal}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกสถานะการชำระเงิน</span>
                    </button>
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
                          <span className="font-bold text-indigo-300 text-xs">งวดที่ 1: {paymentConfig?.installment_round1_amount || 350} บาท</span>
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

                            <p className="text-[11px] text-slate-400">
                              ส่งเมื่อ: {profileModalReg.installment_1_slip_date ? new Date(profileModalReg.installment_1_slip_date).toLocaleString('th-TH') : '-'}
                            </p>

                            {profileModalReg.installment_1_notes && (
                              <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                                หมายเหตุ: {profileModalReg.installment_1_notes}
                              </p>
                            )}

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  const isBothPaid = profileModalReg.installment_2_status === 'paid';
                                  const updates = {
                                    installment_1_status: 'paid',
                                    installment_1_notes: 'ตรวจสอบและอนุมัติยอดงวดที่ 1 เรียบร้อย',
                                    ...(isBothPaid ? { payment_status: 'paid' } : {})
                                  };
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
                                  const reason = prompt('ระบุเหตุผลที่ปฏิเสธสลิปงวด 1:', 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่');
                                  if (reason) {
                                    const updates = {
                                      installment_1_status: 'unpaid',
                                      installment_1_notes: reason,
                                      payment_status: 'unpaid'
                                    };
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
                          <span className="font-bold text-purple-300 text-xs">งวดที่ 2: {paymentConfig?.installment_round2_amount || 300} บาท</span>
                          {profileModalReg.installment_2_status === 'paid' ? (
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

                            <p className="text-[11px] text-slate-400">
                              ส่งเมื่อ: {profileModalReg.installment_2_slip_date ? new Date(profileModalReg.installment_2_slip_date).toLocaleString('th-TH') : '-'}
                            </p>

                            {profileModalReg.installment_2_notes && (
                              <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                                หมายเหตุ: {profileModalReg.installment_2_notes}
                              </p>
                            )}

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  const isBothPaid = profileModalReg.installment_1_status === 'paid';
                                  const updates = {
                                    installment_2_status: 'paid',
                                    installment_2_notes: 'ตรวจสอบและอนุมัติยอดงวดที่ 2 เรียบร้อย',
                                    ...(isBothPaid ? { payment_status: 'paid' } : {})
                                  };
                                  await onUpdateAllocation(profileModalReg.user_id, updates);
                                  setProfileModalReg(prev => ({ ...prev, ...updates }));
                                  triggerToast('อนุมัติสลิปงวดที่ 2 เรียบร้อยแล้ว');
                                }}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                ✓ อนุมัติงวด 2
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const reason = prompt('ระบุเหตุผลที่ปฏิเสธสลิปงวด 2:', 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่');
                                  if (reason) {
                                    const updates = {
                                      installment_2_status: 'unpaid',
                                      installment_2_notes: reason
                                    };
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
                        <div>
                          <p className="text-slate-400">วันที่ส่งสลิป:</p>
                          <p className="text-white font-semibold">
                            {profileModalReg.payment_slip_date ? new Date(profileModalReg.payment_slip_date).toLocaleString('th-TH') : '-'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            type="button"
                            onClick={async () => {
                              setModalPaymentStatus('paid');
                              setModalPaymentNotes('ตรวจสอบยอดเงินถูกต้องแล้ว');
                              await onUpdateAllocation(profileModalReg.user_id, {
                                payment_status: 'paid',
                                payment_notes: 'ตรวจสอบยอดเงินถูกต้องแล้ว'
                              });
                              setProfileModalReg(prev => ({ ...prev, payment_status: 'paid', payment_notes: 'ตรวจสอบยอดเงินถูกต้องแล้ว' }));
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
                              const reason = prompt('ระบุเหตุผลที่ปฏิเสธสลิป (เช่น ยอดเงินไม่ตรง หรือสลิปไม่ชัดเจน):', 'ยอดเงินไม่ถูกต้อง กรุณาโอนใหม่');
                              if (reason) {
                                setModalPaymentStatus('unpaid');
                                setModalPaymentNotes(reason);
                                await onUpdateAllocation(profileModalReg.user_id, {
                                  payment_status: 'unpaid',
                                  payment_notes: reason
                                });
                                setProfileModalReg(prev => ({ ...prev, payment_status: 'unpaid', payment_notes: reason }));
                                triggerToast('ปฏิเสธสลิปและปรับเป็นค้างชำระแล้ว');
                              }
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>ปฏิเสธสลิป / ให้ส่งใหม่</span>
                          </button>
                        </div>
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
                    placeholder="พิมพ์ข้อความที่ต้องการแจ้ง เช่น ขอแจ้งค้างชำระค่าลงทะเบียนจำนวน 350 บาท โปรดโอนเข้าบัญชี ... หรือ เอกสารไม่สมบูรณ์..."
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
                  <h5 className="font-bold text-slate-300 text-xs">ประวัติข้อความที่ส่งหาผู้สมัครคนนี้:</h5>
                  {Array.isArray(profileModalReg.admin_messages) && profileModalReg.admin_messages.length > 0 ? (
                    profileModalReg.admin_messages.map((m, idx) => (
                      <div key={m.id || idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-semibold text-purple-400">ผู้ดูแลระบบ JRE 2027</span>
                          <span>{m.created_at ? new Date(m.created_at).toLocaleString('th-TH') : ''}</span>
                        </div>
                        <p className="text-slate-200 whitespace-pre-line">{m.text}</p>
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
                              onClick={() => {
                                const reason = prompt('ระบุเหตุผลที่ให้ส่งเอกสารใหม่:', 'เอกสารไม่ชัดเจน');
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
      )}

      {/* TAB: PAYMENT SETTINGS & INSTALLMENTS CONFIG */}
      {activeTab === 'payment_settings' && (
        <form onSubmit={handleSavePaymentSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                ตั้งค่าค่าธรรมเนียมการลงทะเบียน & ระบบแบ่งชำระ 2 งวด
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                กำหนดค่าลงทะเบียนรวม บัญชีธนาคารสำหรับรับโอนเงิน และเปิด/ปิดระบบแบ่งจ่าย 2 งวด พร้อมกำหนดจำนวนเงินและวันครบกำหนด
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingPayment}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>บันทึกการตั้งค่าทั้งหมด</span>
            </button>
          </div>

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
                    ยอดค่าลงทะเบียนรวมเต็มจำนวน (บาท):
                  </label>
                  <input
                    type="number"
                    required
                    value={localPayment.fee_total ?? 650}
                    onChange={e => setLocalPayment(prev => ({ ...prev, fee_total: Number(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="เช่น 650"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">ยอดรวมทั้งหมดสำหรับผู้ที่ชำระครั้งเดียวเต็มจำนวน</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชื่อธนาคาร:
                  </label>
                  <input
                    type="text"
                    required
                    value={localPayment.bank_name ?? ''}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="เช่น ธนาคารกรุงไทย"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    เลขที่บัญชีธนาคาร:
                  </label>
                  <input
                    type="text"
                    required
                    value={localPayment.bank_account_number ?? ''}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none tracking-wider"
                    placeholder="เช่น 984-0-12345-6"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชื่อบัญชี:
                  </label>
                  <input
                    type="text"
                    required
                    value={localPayment.bank_account_name ?? ''}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_account_name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="เช่น ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    หมายเลขพร้อมเพย์ (PromptPay) (ถ้ามี):
                  </label>
                  <input
                    type="text"
                    value={localPayment.bank_promptpay ?? ''}
                    onChange={e => setLocalPayment(prev => ({ ...prev, bank_promptpay: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="เช่น 098-765-4321 หรือ เลขประจำตัวผู้เสียภาษี"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">ผู้สมัครจะมีปุ่มกดคัดลอกเลขพร้อมเพย์ได้ทันที</p>
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

                <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 hover:border-purple-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(localPayment.allow_installments)}
                    onChange={e => setLocalPayment(prev => ({ ...prev, allow_installments: e.target.checked }))}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-600 focus:ring-purple-500"
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
                        <span className="text-[11px] text-slate-400 font-mono">วันเปิดรับสมัคร</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          จำนวนเงินงวดที่ 1 (บาท):
                        </label>
                        <input
                          type="number"
                          required
                          value={localPayment.installment_round1_amount ?? 350}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round1_amount: Number(e.target.value) || 0 }))}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="350"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          กำหนดชำระงวดที่ 1:
                        </label>
                        <input
                          type="text"
                          required
                          value={localPayment.installment_round1_due ?? ''}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round1_due: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
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
                        <span className="text-[11px] text-slate-400 font-mono">1 หรือ 5 พ.ย.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          จำนวนเงินงวดที่ 2 (บาท):
                        </label>
                        <input
                          type="number"
                          required
                          value={localPayment.installment_round2_amount ?? 300}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round2_amount: Number(e.target.value) || 0 }))}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          กำหนดชำระงวดที่ 2:
                        </label>
                        <input
                          type="text"
                          required
                          value={localPayment.installment_round2_due ?? ''}
                          onChange={e => setLocalPayment(prev => ({ ...prev, installment_round2_due: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="เช่น 1 หรือ 5 พฤศจิกายน 2569"
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
                  value={localPayment.notes ?? ''}
                  onChange={e => setLocalPayment(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="เช่น สามารถเลือกชำระเต็มจำนวน หรือแบ่งจ่าย 2 งวดตามกำหนดการข้างต้น..."
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPayment}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-rescue-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>บันทึกการตั้งค่าระบบการเงิน</span>
              </button>
            </div>
          </div>
        </form>
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
              Admin สามารถใส่ URL ของ Google Form แต่ละรายการ และเปิด/ปิดการแสดงผลให้ผู้เข้าอบรมเห็นได้ตลอดเวลา
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
                <label className="block text-xs text-slate-400 mb-1">Google Form URL (Pre-test):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.pretest?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      pretest: { ...localForms.pretest, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
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
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    2. แบบทดสอบหลังการฝึกอบรม (Post-Test)
                  </h4>
                </div>
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
                <label className="block text-xs text-slate-400 mb-1">Google Form URL (Post-test):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.posttest?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      posttest: { ...localForms.posttest, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
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
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <h4 className="font-bold text-white text-sm">
                    3. แบบประเมินความพึงพอใจโครงการ (Evaluation Form)
                  </h4>
                </div>
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
                <label className="block text-xs text-slate-400 mb-1">Google Form URL (Evaluation):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    value={localForms.evaluation?.url || ''}
                    onChange={e => setLocalForms({
                      ...localForms,
                      evaluation: { ...localForms.evaluation, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
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
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องสแกน QR รับสินค้า</span>
              </button>

              <a
                href="#merchandise-settings"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all"
              >
                <Settings className="w-4 h-4 text-rescue-400" />
                <span>ไปที่ตั้งค่าไซต์ & ราคา</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">ออเดอร์ทั้งหมด</span>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                {merchandiseOrders.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">ยอดชำระแล้วสุทธิ</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                {merchandiseOrders
                  .filter(o => o.payment_status === 'paid_verified')
                  .reduce((sum, o) => sum + (o.total_amount || 0), 0)
                  .toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">บาท</span>
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">รอตรวจสอบสลิป</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {merchandiseOrders.filter(o => o.payment_status === 'pending_verification').length}{' '}
                <span className="text-xs font-normal text-slate-400">รายการ</span>
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">ส่งมอบสินค้าแล้ว</span>
              <p className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">
                {merchandiseOrders.filter(o => o.pickup_status === 'received').length}{' '}
                <span className="text-xs font-normal text-slate-400">รายการ</span>
              </p>
            </div>
          </div>

          {/* ORDERS LIST SECTION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-rescue-500" />
                <span>รายการคำสั่งซื้อของสมาชิก & ผู้เข้าร่วมโครงการ</span>
              </h3>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={merchSearchQuery}
                    onChange={(e) => setMerchSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, เบอร์, รหัสออเดอร์..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={merchStatusFilter}
                  onChange={(e) => setMerchStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending_verification">รอตรวจสอบสลิป</option>
                  <option value="paid_verified">ชำระแล้ว (รอส่งมอบ)</option>
                  <option value="received">ส่งมอบแล้ว</option>
                </select>
              </div>
            </div>

            {/* Orders Cards / Table */}
            {(() => {
              const filteredOrders = merchandiseOrders.filter(o => {
                if (merchStatusFilter !== 'all') {
                  if (merchStatusFilter === 'received' && o.pickup_status !== 'received') return false;
                  if (merchStatusFilter === 'pending_verification' && o.payment_status !== 'pending_verification') return false;
                  if (merchStatusFilter === 'paid_verified' && (o.payment_status !== 'paid_verified' || o.pickup_status === 'received')) return false;
                }
                if (!merchSearchQuery.trim()) return true;
                const q = merchSearchQuery.toLowerCase().trim();
                return (
                  o.order_number?.toLowerCase().includes(q) ||
                  o.customer_name?.toLowerCase().includes(q) ||
                  o.customer_phone?.includes(q) ||
                  o.user_email?.toLowerCase().includes(q)
                );
              });

              if (filteredOrders.length === 0) {
                if (merchandiseOrders.length === 0) {
                  return (
                    <div className="p-10 sm:p-14 text-center bg-slate-950/70 border border-slate-800 rounded-3xl space-y-4">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-700/80 rounded-2xl mx-auto flex items-center justify-center text-slate-400 shadow-inner">
                        <PackageCheck className="w-8 h-8 text-rescue-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-bold text-white">ยังไม่มีรายการคำสั่งซื้อจากสมาชิกหรือผู้เข้าร่วมโครงการในระบบ</h4>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                          ระบบเชื่อมต่อฐานข้อมูลคำสั่งซื้อจริง (Real Database) โดยไม่มีข้อมูลจำลอง (Mock Data) เมื่อมีสมาชิกสั่งซื้อเสื้อหรือกางเกงผ่านระบบ รายการคำสั่งซื้อ สลิปโอนเงิน และรหัส QR รับของจะแสดงขึ้นที่นี่ทันที
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        เชื่อมต่อฐานข้อมูลคำสั่งซื้อจริงเรียบร้อยแล้ว (Live System)
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                    <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">ไม่พบรายการสั่งซื้อตามเงื่อนไขที่ค้นหา</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredOrders.map((ord) => {
                    const isVerified = ord.payment_status === 'paid_verified';
                    const isReceived = ord.pickup_status === 'received';

                    return (
                      <div
                        key={ord.id}
                        className="p-4 sm:p-5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg space-y-3 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-rescue-400 bg-rescue-500/10 px-2 py-0.5 rounded border border-rescue-500/30">
                                {ord.order_number}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(ord.created_at).toLocaleDateString('th-TH')} • {new Date(ord.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-bold">
                                {ord.pickup_method === 'shipping' ? 'จัดส่งพัสดุ' : 'รับหน้างาน'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1">
                              {ord.customer_name} • เบอร์โทร: <a href={`tel:${ord.customer_phone}`} className="text-indigo-400 hover:underline">{ord.customer_phone}</a>
                              {ord.user_email && <span className="text-slate-400 font-normal ml-1">({ord.user_email})</span>}
                            </h4>
                            {ord.shipping_address && (
                              <p className="text-xs text-amber-300/90 mt-0.5">
                                ที่อยู่จัดส่ง: {ord.shipping_address}
                              </p>
                            )}
                          </div>

                          {/* Status badges */}
                          <div className="flex items-center gap-2">
                            {isReceived ? (
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs rounded-full font-bold flex items-center gap-1">
                                <PackageCheck className="w-3.5 h-3.5" /> ส่งมอบสินค้าแล้ว
                              </span>
                            ) : isVerified ? (
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs rounded-full font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ยอดเงินถูกต้อง • รอส่งมอบ
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs rounded-full font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> รอตรวจสลิป
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items breakdown & Slip */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Items Column (7 cols) */}
                          <div className="md:col-span-7 space-y-1.5">
                            {ord.items?.map((it, idx) => (
                              <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-white">{it.product_name}</p>
                                  <p className="text-[11px] text-slate-400">
                                    ไซต์: <span className="text-rescue-400 font-black">{it.size}</span>
                                    {it.extra_price > 0 && <span className="text-amber-400 ml-1 font-bold">(+{it.extra_price} บ. ไซต์พิเศษ)</span>}
                                    {it.color && <span> • {it.color}</span>}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="font-black text-white px-2 py-0.5 bg-slate-800 rounded text-xs mr-2">x{it.quantity}</span>
                                  <span className="font-black text-rescue-400">{it.unit_price * it.quantity} บ.</span>
                                </div>
                              </div>
                            ))}
                            <div className="text-right pt-1 text-xs">
                              <span className="text-slate-400 mr-2">ยอดรวมทั้งสิ้น:</span>
                              <span className="text-sm font-black text-rescue-400 font-mono">{ord.total_amount} บาท</span>
                            </div>
                          </div>

                          {/* Slip Preview & Admin Actions (5 cols) */}
                          <div className="md:col-span-5 bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                            {ord.slip_url ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={ord.slip_url}
                                    alt="Slip"
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-slate-300">สลิปโอนเงิน</p>
                                    <p className="text-[10px] text-slate-400">
                                      {ord.slip_uploaded_at ? new Date(ord.slip_uploaded_at).toLocaleString('th-TH') : 'แนบแล้ว'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPreviewMerchSlip(ord.slip_url)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>ตรวจสลิป</span>
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>ยังไม่มีสลิป</span>
                              </p>
                            )}

                            {/* Action Buttons for Admin */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                              {!isVerified && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onVerifyOrderPayment(ord.id, true, 'อนุมัติโดย Admin');
                                    triggerToast(`อนุมัติสลิปออเดอร์ ${ord.order_number} แล้ว`);
                                  }}
                                  className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                                >
                                  ✓ อนุมัติสลิป
                                </button>
                              )}

                              {!isVerified && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const note = prompt('ระบุเหตุผลที่ปฏิเสธสลิป:', 'ยอดเงินไม่ถูกต้อง กรุณาแนบสลิปใหม่');
                                    if (note !== null) {
                                      await onVerifyOrderPayment(ord.id, false, note);
                                      triggerToast(`ปฏิเสธสลิปออเดอร์ ${ord.order_number}`);
                                    }
                                  }}
                                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold transition-all"
                                >
                                  ปฏิเสธ
                                </button>
                              )}

                              {!isReceived ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onMarkOrderReceived(ord.id, 'Admin JRE 2027');
                                    triggerToast(`บันทึกส่งมอบออเดอร์ ${ord.order_number} เรียบร้อยแล้ว`);
                                  }}
                                  className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>กดยืนยันรับสินค้าแล้ว</span>
                                </button>
                              ) : (
                                <div className="w-full text-center py-1 text-[11px] text-emerald-400 font-bold">
                                  ✓ ส่งมอบแล้ว {ord.pickup_at ? `(${new Date(ord.pickup_at).toLocaleDateString('th-TH')})` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* SETTINGS SECTION: PRODUCTS, SIZES, PRICES & BACKUP GOOGLE FORM */}
          <div id="merchandise-settings" className="pt-8 border-t border-slate-800 space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-rescue-500" />
                  <span>ตั้งค่าสินค้า, ไซต์, ราคาบวกเพิ่ม & Google Form สำรอง</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ปรับราคาฐาน, เพิ่ม/ลดขนาดไซต์, กำหนดราคาไซต์พิเศษบวกเพิ่มกี่บาท และจัดการระบบสั่งซื้อสำรอง
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveMerchandiseConfig}
                disabled={isSavingMerch}
                className="px-5 py-2.5 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-rescue-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingMerch ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}</span>
              </button>
            </div>

            {/* 1. BANK ACCOUNT & PAYMENT CONFIGURATION */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rescue-400" />
                    <span>ข้อมูลธนาคาร & ช่องทางรับโอนเงินค่าสินค้า (Bank & Payment Settings)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    กำหนดชื่อธนาคาร เลขที่บัญชี ชื่อบัญชี และพร้อมเพย์สำหรับให้ผู้สั่งซื้อโอนเงินในหน้าสั่งซื้อสินค้า
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full font-bold self-start sm:self-auto">
                  แสดงผลอัตโนมัติในหน้าสั่งซื้อ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300">ชื่อธนาคาร (Bank Name):</label>
                  <input
                    type="text"
                    value={localMerchConfig.payment?.bank_name || ''}
                    onChange={(e) => handleUpdateMerchPaymentField('bank_name', e.target.value)}
                    placeholder="เช่น ธนาคารกรุงไทย"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">เลขที่บัญชีธนาคาร (Account Number):</label>
                  <input
                    type="text"
                    value={localMerchConfig.payment?.account_number || ''}
                    onChange={(e) => handleUpdateMerchPaymentField('account_number', e.target.value)}
                    placeholder="เช่น 984-0-12345-6"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-rescue-400 focus:outline-none focus:border-rescue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">ชื่อบัญชีรับโอนเงิน (Account Name):</label>
                  <input
                    type="text"
                    value={localMerchConfig.payment?.account_name || ''}
                    onChange={(e) => handleUpdateMerchPaymentField('account_name', e.target.value)}
                    placeholder="เช่น ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">เบอร์พร้อมเพย์ (PromptPay):</label>
                  <input
                    type="text"
                    value={localMerchConfig.payment?.promptpay || ''}
                    onChange={(e) => handleUpdateMerchPaymentField('promptpay', e.target.value)}
                    placeholder="เช่น 098-765-4321 หรือเลขประจำตัวผู้เสียภาษี"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-rescue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-300">คำแนะนำ / หมายเหตุการโอนเงิน (Payment Note):</label>
                  <input
                    type="text"
                    value={localMerchConfig.payment?.note || ''}
                    onChange={(e) => handleUpdateMerchPaymentField('note', e.target.value)}
                    placeholder="เช่น กรุณาโอนเงินตามยอดที่ระบุและแนบหลักฐานสลิปโอนเงินทุกครั้ง"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rescue-500"
                  />
                </div>
              </div>
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
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400">ข้อความบนปุ่ม:</label>
                  <input
                    type="text"
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
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
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
                      onClick={() => handleBatchToggleCategory('shirt', 'enabled', true)}
                      className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      👁️ เปิดแสดง
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleCategory('shirt', 'enabled', false)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ซ่อน
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleCategory('shirt', 'allow_order', true)}
                      className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🛒 เปิดสั่ง
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleCategory('shirt', 'allow_order', false)}
                      className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
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
                      onClick={() => handleBatchToggleCategory('pants', 'enabled', true)}
                      className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      👁️ เปิดแสดง
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleCategory('pants', 'enabled', false)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ซ่อน
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleCategory('pants', 'allow_order', true)}
                      className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🛒 เปิดสั่ง
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleCategory('pants', 'allow_order', false)}
                      className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
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
                          onClick={() => handleToggleProductEnabled(selectedProductIndex)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 ${
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
                          onClick={() => handleToggleProductAllowOrder(selectedProductIndex)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 ${
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
                          value={curProd.name || ''}
                          onChange={(e) => handleUpdateProductField(selectedProductIndex, 'name', e.target.value)}
                          placeholder="ระบุชื่อสินค้า..."
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rescue-500"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-xs font-bold text-slate-300">หมวดหมู่สินค้า:</label>
                        <select
                          value={curProd.category || 'shirt'}
                          onChange={(e) => handleUpdateProductField(selectedProductIndex, 'category', e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
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
                            value={curProd.base_price || 0}
                            onChange={(e) => handleUpdateProductBasePrice(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-black text-rescue-400 focus:outline-none focus:border-rescue-500"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-400">บาท</span>
                        </div>
                      </div>

                      <div className="md:col-span-12">
                        <label className="text-xs font-bold text-slate-300">คำอธิบายรายละเอียดสินค้า (Description):</label>
                        <textarea
                          rows={2}
                          value={curProd.description || ''}
                          onChange={(e) => handleUpdateProductField(selectedProductIndex, 'description', e.target.value)}
                          placeholder="รายละเอียดเนื้อผ้า คุณสมบัติ และประโยชน์การใช้งาน..."
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rescue-500"
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
                                    onClick={() => handleSetCoverProductImage(selectedProductIndex, imgUrl)}
                                    className="w-full py-1 text-[11px] font-bold bg-slate-800 hover:bg-rescue-600/20 hover:text-rescue-400 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
                                    onClick={() => handleRemoveProductImage(selectedProductIndex, imgIdx)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
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
                            value={newProductImageUrl}
                            onChange={(e) => setNewProductImageUrl(e.target.value)}
                            placeholder="วางลิงก์ URL รูปภาพ เช่น https://..."
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rescue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddProductImageUrl(selectedProductIndex)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
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
                            disabled={isUploadingProductImg}
                            onChange={(e) => handleUploadProductImageFile(e, selectedProductIndex)}
                            className="hidden"
                          />
                          <label
                            htmlFor="upload-product-img-input"
                            className={`w-full py-1.5 px-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isUploadingProductImg ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
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
                                        value={sz.extra_price || 0}
                                        onChange={(e) => handleUpdateSizeExtraPrice(szIdx, e.target.value)}
                                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
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
                                      onClick={() => handleRemoveSizeFromProduct(szIdx)}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
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
                          value={newSizeName}
                          onChange={(e) => setNewSizeName(e.target.value)}
                          placeholder="ชื่อไซส์ (เช่น 6XL)"
                          className="w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rescue-500"
                        />

                        <input
                          type="text"
                          value={newSizeMeasurement}
                          onChange={(e) => setNewSizeMeasurement(e.target.value)}
                          placeholder={curProd.category === 'shirt' ? 'รอบอก เช่น 56 นิ้ว' : 'รอบเอว เช่น 50-52 นิ้ว'}
                          className="flex-1 min-w-[150px] px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rescue-500"
                        />

                        <div className="flex items-center gap-1 w-28">
                          <span className="text-amber-400 text-xs font-bold">+</span>
                          <input
                            type="number"
                            min={0}
                            value={newSizeExtra}
                            onChange={(e) => setNewSizeExtra(e.target.value)}
                            placeholder="บวกเพิ่ม บ."
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddSizeToProduct}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 active:scale-95 cursor-pointer"
                        >
                          + เพิ่มไซส์
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Bottom Save Button */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleSaveMerchandiseConfig}
                disabled={isSavingMerch}
                className="px-6 py-3 bg-gradient-to-r from-rescue-600 to-orange-600 hover:from-rescue-500 hover:to-orange-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl shadow-rescue-600/30 transition-all active:scale-95 ml-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingMerch ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าทั้งหมด (Save Changes)'}</span>
              </button>
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

      {/* SPEAKER MODAL */}
      {showSpeakerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setShowSpeakerModal(false)}
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
                  onClick={() => setShowSpeakerModal(false)}
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
      )}

      {/* TEAM MEMBER MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setShowTeamModal(false)}
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
                    'จุฬาลงกรณ์มหาวิทยาลัย',
                    'มหาวิทยาลัยเชียงใหม่',
                    'มหาวิทยาลัยธรรมศาสตร์',
                    'มหาวิทยาลัยเกษตรศาสตร์',
                    'มหาวิทยาลัยสงขลานครินทร์'
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
                  onClick={() => setShowTeamModal(false)}
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
      )}

      {/* ADMIN QR SCANNER MODAL */}
      {showQRScanner && (
        <AdminQRScannerModal
          orders={merchandiseOrders}
          onClose={() => setShowQRScanner(false)}
          onMarkReceived={onMarkOrderReceived}
          onVerifyPayment={onVerifyOrderPayment}
        />
      )}

      {/* MERCHANDISE SLIP PREVIEW MODAL */}
      {previewMerchSlip && (
        <div 
          onClick={() => setPreviewMerchSlip(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg max-h-[85vh]">
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
      )}

      {/* MERCHANDISE PRODUCT IMAGE PREVIEW MODAL */}
      {previewProductImageModal && (
        <div 
          onClick={() => setPreviewProductImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
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
      )}

      {/* PREVIEW SLIP MODAL FOR ADMIN */}
      {previewSlipUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-5 shadow-2xl relative">
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
      )}

      {/* IN-APP DOCUMENT & SLIP PREVIEW MODAL */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />

    </div>
  );
}
