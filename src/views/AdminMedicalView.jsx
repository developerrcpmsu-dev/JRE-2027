import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Stethoscope,
  Search,
  QrCode,
  AlertTriangle,
  HeartPulse,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Activity,
  X,
  ChevronRight,
  ClipboardList,
  Save,
  RotateCcw,
  Edit3,
  BarChart3,
  Users,
  Link2,
  Filter,
  ArrowLeft,
  Pill,
  FileHeart
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { Html5Qrcode } from 'html5-qrcode';
import {
  getParticipantPhoto,
  resolvePersonFullNameWithTitle,
  normalizeCallsignSpacing,
  resolveUniversityInfo,
  getApplicantMedical,
  getApplicantAllergy,
  getMedicalEquipmentNeeded,
  hasMedicalCondition,
  hasFoodOrDrugAllergy
} from '../data/defaultData';
import { DataService } from '../supabase';
import { downloadCsv } from '../utils/documentExporters';
import { confirmWithModal } from '../utils/confirmHelper';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import PaginationBar from '../components/PaginationBar';
import {
  PRESET_SYMPTOMS,
  PRESET_FIRST_AID,
  PRESET_MEDICINES,
  getDefaultOperatorName,
  toLocalDateTimeInput,
  formatPersonSummary,
  matchEmrLogToPerson,
  findPersonForEmrLog,
  buildEmrPayload
} from '../utils/emrUtils';

export default function AdminMedicalView({
  registrations = [],
  currentUser = null,
  isDevOperator = false,
  initialPersonId = null,
  onPersonChange = null,
  onSelectApplicant,
  onUpdateAllocation,
  triggerToast,
  askConfirm = null
}) {
  // Medical dispense & EMR logs state
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Active sub-tab: 'logs' | 'roster' | 'person'
  const [activeSubView, setActiveSubView] = useState(initialPersonId ? 'person' : 'logs');
  const [inspectedPersonId, setInspectedPersonId] = useState(initialPersonId || '');

  // Form states (Create or Edit)
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [incidentDetail, setIncidentDetail] = useState('');
  const [firstAidAction, setFirstAidAction] = useState('');
  const [medicineText, setMedicineText] = useState('');
  const [dosageText, setDosageText] = useState('');
  const [vitalSigns, setVitalSigns] = useState('');
  const [recorderName, setRecorderName] = useState(() => getDefaultOperatorName(currentUser));
  const [dispenserName, setDispenserName] = useState(() => getDefaultOperatorName(currentUser));
  const [medicalNotes, setMedicalNotes] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // QR Scanner mode
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const qrScannerRef = useRef(null);
  const formRef = useRef(null);

  // Filters & Search for Logs tab
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logUniFilter, setLogUniFilter] = useState('all');
  const [logRiskFilter, setLogRiskFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logOperatorFilter, setLogOperatorFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('all');
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PAGE_SIZE = 10;

  // Filters & Search for All-Participants Health Roster tab
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');
  const [rosterUniFilter, setRosterUniFilter] = useState('all');
  const [rosterRiskFilter, setRosterRiskFilter] = useState('all');
  const [rosterVisitFilter, setRosterVisitFilter] = useState('all');
  const [rosterPage, setRosterPage] = useState(1);
  const ROSTER_PAGE_SIZE = 12;

  // Statistics toggle
  const [showStatsPanel, setShowStatsPanel] = useState(true);

  // Image lightbox popup
  const [previewDoc, setPreviewDoc] = useState(null);

  // Sync URL ?person=<id> when initialPersonId changes externally (including Back button clearing)
  useEffect(() => {
    if (initialPersonId) {
      setInspectedPersonId(initialPersonId);
      setActiveSubView('person');
    } else {
      setInspectedPersonId('');
      setActiveSubView(prev => (prev === 'person' ? 'logs' : prev));
    }
  }, [initialPersonId]);

  useEffect(() => {
    const defaultOp = getDefaultOperatorName(currentUser);
    setRecorderName(prev => (prev && prev !== 'เจ้าหน้าที่ / อาสาพยาบาล (JRE 2027)' ? prev : defaultOp));
    setDispenserName(prev => (prev && prev !== 'เจ้าหน้าที่ / อาสาพยาบาล (JRE 2027)' ? prev : defaultOp));
  }, [currentUser]);

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const data = await DataService.getMedicalDispenseLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching medical logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Resolve inspected individual participant
  const inspectedPerson = useMemo(() => {
    if (!inspectedPersonId) return null;
    return (
      registrations.find(
        r =>
          String(r.id) === String(inspectedPersonId) ||
          String(r.user_id) === String(inspectedPersonId)
      ) || null
    );
  }, [registrations, inspectedPersonId]);

  const inspectedPersonSummary = useMemo(
    () => (inspectedPerson ? formatPersonSummary(inspectedPerson) : null),
    [inspectedPerson]
  );

  // Switch person inspection and update URL
  const openPersonEmrPage = (personOrId) => {
    const targetId =
      typeof personOrId === 'string'
        ? personOrId
        : (personOrId?.id || personOrId?.user_id || '');
    if (!targetId) return;
    setInspectedPersonId(targetId);
    setActiveSubView('person');
    if (onPersonChange) {
      onPersonChange(targetId);
    } else if (typeof window !== 'undefined') {
      const nextUrl = `/admin/medical?person=${encodeURIComponent(targetId)}`;
      window.history.pushState({ mainTab: 'admin', subRoute: 'medical' }, '', nextUrl);
    }
  };

  const clearPersonEmrPage = (targetTab = 'logs') => {
    setInspectedPersonId('');
    setActiveSubView(targetTab);
    if (onPersonChange) {
      onPersonChange('');
    } else if (typeof window !== 'undefined') {
      window.history.pushState({ mainTab: 'admin', subRoute: 'medical' }, '', '/admin/medical');
    }
  };

  const handleCopyPersonUrl = () => {
    if (!inspectedPersonId || typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/admin/medical?person=${encodeURIComponent(inspectedPersonId)}`;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      if (triggerToast) triggerToast('✓ คัดลอกลิงก์เวชระเบียนรายบุคคลแล้ว', 'success');
    }).catch(() => {});
  };

  // Filtered participants list for form autocomplete
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return registrations
      .filter(r => {
        const name = `${r.first_name || ''} ${r.last_name || ''} ${r.nickname || ''} ${r.callsign || ''}`.toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const room = (r.room_assigned || '').toLowerCase();
        const idStr = `${r.id || ''} ${r.user_id || ''}`.toLowerCase();
        return name.includes(q) || phone.includes(q) || room.includes(q) || idStr.includes(q);
      })
      .slice(0, 8);
  }, [registrations, searchQuery]);

  const handleSelectRecipient = (reg) => {
    const summary = formatPersonSummary(reg);
    if (!summary) return;
    setSelectedRecipient(summary);
    setSearchQuery('');
  };

  const resetForm = (keepOpen = false) => {
    setEditingLogId(null);
    setSymptomText('');
    setIncidentDetail('');
    setFirstAidAction('');
    setMedicineText('');
    setDosageText('');
    setVitalSigns('');
    setMedicalNotes('');
    setCustomDateTime(toLocalDateTimeInput(new Date().toISOString()));
    setRecorderName(getDefaultOperatorName(currentUser));
    setDispenserName(getDefaultOperatorName(currentUser));
    setSelectedRecipient(null);
    setSearchQuery('');
    setShowRecordForm(keepOpen);
  };

  const openNewRecordForPerson = (reg = null) => {
    resetForm(true);
    if (reg) {
      handleSelectRecipient(reg);
    }
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const openEditLogForm = (log) => {
    const matchedReg = findPersonForEmrLog(log, registrations);
    const recipientSummary = matchedReg
      ? formatPersonSummary(matchedReg)
      : {
          raw: null,
          id: log.recipient_id || '',
          userId: log.recipient_user_id || log.recipient_id || '',
          email: log.recipient_email || '',
          name: log.recipient_name || 'ไม่ระบุชื่อ',
          nickname: log.recipient_nickname || '-',
          callsign: log.recipient_callsign || '-',
          phone: log.recipient_phone || '-',
          institution: log.recipient_institution || '-',
          room: log.recipient_room || '-',
          blood: log.recipient_blood || '-',
          medical: log.recipient_chronic_diseases || 'ไม่มี',
          hasMed: Boolean(log.recipient_chronic_diseases && log.recipient_chronic_diseases !== 'ไม่มี'),
          allergy: log.recipient_known_allergies || 'ไม่มี',
          hasAlg: Boolean(log.recipient_known_allergies && log.recipient_known_allergies !== 'ไม่มี'),
          requestedEquipment: log.recipient_requested_equipment || '',
          photo: log.recipient_photo || ''
        };

    setEditingLogId(log.id);
    setSelectedRecipient(recipientSummary);
    setSymptomText(log.symptoms || '');
    setIncidentDetail(log.incident_detail || '');
    setFirstAidAction(log.first_aid_action || '');
    setMedicineText(log.medicines_dispensed || '');
    setDosageText(log.dosage_instruction || '');
    setVitalSigns(log.vital_signs || '');
    setRecorderName(log.recorder_name || getDefaultOperatorName(currentUser));
    setDispenserName(log.dispenser_name || getDefaultOperatorName(currentUser));
    setMedicalNotes(log.medical_notes || '');
    setCustomDateTime(toLocalDateTimeInput(log.dispensed_at || log.created_at));
    setShowRecordForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // QR Code Scanner Handlers
  const startScanner = async () => {
    setShowRecordForm(true);
    setIsScanning(true);
    setScannerError('');
    setTimeout(async () => {
      try {
        const qr = new Html5Qrcode('medical-qr-reader-region');
        qrScannerRef.current = qr;
        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleQrSuccess(decodedText);
            stopScanner();
          },
          () => {}
        );
      } catch (err) {
        console.warn('QR scanner start error:', err);
        setScannerError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้องในเบราว์เซอร์');
        setIsScanning(false);
      }
    }, 200);
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          qrScannerRef.current = null;
          setIsScanning(false);
        });
    } else {
      setIsScanning(false);
    }
  };

  const handleQrSuccess = (text) => {
    const clean = text.trim();
    const matched = registrations.find(
      r =>
        r.id === clean ||
        r.user_id === clean ||
        (r.id && clean.includes(r.id)) ||
        (r.user_id && clean.includes(r.user_id)) ||
        (r.phone && clean.includes(r.phone)) ||
        (r.callsign && clean.toLowerCase().includes(r.callsign.toLowerCase())) ||
        (r.first_name && clean.includes(r.first_name))
    );

    if (matched) {
      handleSelectRecipient(matched);
      if (triggerToast) {
        triggerToast(`✓ สแกน QR สำเร็จ: พบข้อมูล ${matched.first_name} ${matched.last_name || ''}`, 'success');
      }
    } else {
      if (triggerToast) triggerToast('⚠️ ไม่พบรายชื่อผู้เข้าร่วมที่ตรงกับ QR Code นี้ในฐานข้อมูล', 'warning');
    }
  };

  // Preset helper handlers
  const appendUniqueChip = (currentVal, setVal, textToAdd, separator = ', ') => {
    if (!currentVal.trim()) {
      setVal(textToAdd);
    } else if (!currentVal.includes(textToAdd)) {
      setVal(prev => `${prev}${separator}${textToAdd}`);
    }
  };

  const handleAddMedicine = (medObj) => {
    if (!medicineText.trim()) {
      setMedicineText(medObj.name);
      setDosageText(medObj.defaultDose);
    } else if (!medicineText.includes(medObj.name)) {
      setMedicineText(prev => `${prev} + ${medObj.name}`);
      setDosageText(prev => (prev.trim() ? `${prev} | ${medObj.defaultDose}` : medObj.defaultDose));
    }
  };

  // Submit Create or Edit EMR
  const handleSaveDispense = async (e) => {
    e?.preventDefault();
    if (!selectedRecipient) {
      if (triggerToast) triggerToast('กรุณาเลือกผู้ป่วย / ผู้รับยาก่อนทำการบันทึก', 'warning');
      return;
    }
    if (!symptomText.trim()) {
      if (triggerToast) triggerToast('กรุณาระบุอาการ หรือสาเหตุที่เข้ารับการดูแล', 'warning');
      return;
    }
    if (!medicineText.trim() && !firstAidAction.trim()) {
      if (triggerToast) triggerToast('กรุณาระบุยาที่จ่าย หรือวิธีการปฐมพยาบาลอย่างน้อย 1 อย่าง', 'warning');
      return;
    }
    if (!dispenserName.trim() || !recorderName.trim()) {
      if (triggerToast) triggerToast('กรุณาระบุชื่อผู้กรอกข้อมูล และผู้จ่ายยา/ผู้ปฐมพยาบาล', 'warning');
      return;
    }
    if (isSaving) return;

    const actionVerb = editingLogId ? 'แก้ไขข้อมูลเวชระเบียน' : 'บันทึกเวชระเบียน / ปฐมพยาบาล / จ่ายยา';
    const confirmed = await confirmWithModal(askConfirm, {
      title: editingLogId ? '✏️ ยืนยันการแก้ไขเวชระเบียน' : '🩺 ยืนยันการบันทึกเวชระเบียน',
      message: `ต้องการ${actionVerb}ของ "${selectedRecipient.name}" ใช่หรือไม่?`,
      confirmText: editingLogId ? '✓ บันทึกการแก้ไข' : '✓ ยืนยันบันทึกเวชระเบียน',
      cancelText: 'ยกเลิก',
      variant: 'info'
    });
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const targetReg = selectedRecipient.raw || {
        id: selectedRecipient.id,
        user_id: selectedRecipient.userId,
        user_email: selectedRecipient.email,
        first_name: selectedRecipient.name,
        nickname: selectedRecipient.nickname,
        callsign: selectedRecipient.callsign,
        phone: selectedRecipient.phone,
        institution: selectedRecipient.institution,
        room_assigned: selectedRecipient.room,
        blood_group: selectedRecipient.blood,
        allergies: selectedRecipient.allergy,
        medical_condition: selectedRecipient.medical
      };

      const payload = buildEmrPayload(
        targetReg,
        {
          recipient_name: selectedRecipient.name,
          symptoms: symptomText,
          incident_detail: incidentDetail,
          first_aid_action: firstAidAction,
          medicines_dispensed: medicineText || 'ปฐมพยาบาล (ไม่ใช้ยา)',
          dosage_instruction: dosageText,
          vital_signs: vitalSigns,
          recorder_name: recorderName,
          dispenser_name: dispenserName,
          medical_notes: medicalNotes,
          dispensed_at: customDateTime || undefined
        },
        currentUser
      );

      if (editingLogId) {
        await DataService.updateMedicalDispenseLog(editingLogId, payload);
        if (triggerToast) triggerToast(`✓ แก้ไขเวชระเบียนของ ${selectedRecipient.name} เรียบร้อยแล้ว`, 'success');
      } else {
        await DataService.saveMedicalDispenseLog(payload);
        if (triggerToast) triggerToast(`✓ บันทึกเวชระเบียนของ ${selectedRecipient.name} เรียบร้อยแล้ว`, 'success');
      }

      await fetchLogs();
      resetForm(false);
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึกเวชระเบียน', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (id, name) => {
    const confirmed = await confirmWithModal(askConfirm, {
      title: '🗑️ ยืนยันการลบประวัติเวชระเบียน',
      message: `ต้องการลบบันทึกเวชระเบียนของ "${name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้`,
      confirmText: '🗑️ ยืนยันลบบันทึก',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await DataService.deleteMedicalDispenseLog(id);
      await fetchLogs();
      if (editingLogId === id) {
        resetForm(false);
      }
      if (triggerToast) triggerToast('ลบบันทึกเวชระเบียนเรียบร้อยแล้ว', 'info');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast(err?.message || 'เกิดข้อผิดพลาดในการลบบันทึก', 'error');
    }
  };

  // Distinct operators & dates for filter dropdowns
  const operatorOptions = useMemo(() => {
    const set = new Set();
    logs.forEach(l => {
      if (l.dispenser_name) set.add(l.dispenser_name.trim());
      if (l.recorder_name) set.add(l.recorder_name.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [logs]);

  const dateOptions = useMemo(() => {
    const set = new Set();
    logs.forEach(l => {
      const dt = new Date(l.dispensed_at || l.created_at);
      if (!Number.isNaN(dt.getTime())) {
        set.add(dt.toISOString().slice(0, 10));
      }
    });
    return Array.from(set).sort().reverse();
  }, [logs]);

  // Comprehensive Statistics & Summaries
  const emrStats = useMemo(() => {
    const symptomCounts = {};
    const medCounts = {};
    const firstAidCounts = {};
    const uniCounts = {};
    let firstAidCases = 0;

    logs.forEach(l => {
      if (l.first_aid_action && l.first_aid_action.trim()) {
        firstAidCases += 1;
        l.first_aid_action
          .split(/[,+/|]+/)
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(item => {
            firstAidCounts[item] = (firstAidCounts[item] || 0) + 1;
          });
      }

      if (l.symptoms) {
        l.symptoms
          .split(/[,|]+/)
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(sym => {
            symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
          });
      }

      if (l.medicines_dispensed) {
        l.medicines_dispensed
          .split(/[+|]+/)
          .map(s => s.trim())
          .filter(s => s && !s.includes('ไม่จ่ายยา'))
          .forEach(med => {
            const cleanMed = med.split(' (')[0].trim();
            medCounts[cleanMed] = (medCounts[cleanMed] || 0) + 1;
          });
      }

      const inst = l.recipient_institution || 'อื่นๆ';
      uniCounts[inst] = (uniCounts[inst] || 0) + 1;
    });

    const sortTop = (obj, limit = 6) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

    return {
      totalVisits: logs.length,
      uniquePeople: new Set(logs.map(l => l.recipient_id || l.recipient_user_id || l.recipient_name)).size,
      firstAidCases,
      allergyPeopleCount: registrations.filter(r => hasFoodOrDrugAllergy(r)).length,
      chronicPeopleCount: registrations.filter(r => hasMedicalCondition(r)).length,
      equipmentReqCount: registrations.filter(r => Boolean(getMedicalEquipmentNeeded(r))).length,
      topSymptoms: sortTop(symptomCounts, 6),
      topMedicines: sortTop(medCounts, 6),
      topFirstAid: sortTop(firstAidCounts, 6),
      byUniversity: Object.entries(uniCounts).sort((a, b) => b[1] - a[1])
    };
  }, [logs, registrations]);

  // Enriched All-Participants directory with EMR visit counts
  const rosterEntries = useMemo(() => {
    return registrations.map(reg => {
      const summary = formatPersonSummary(reg);
      const personLogs = logs.filter(l => matchEmrLogToPerson(l, reg));
      personLogs.sort(
        (a, b) => new Date(b.dispensed_at || b.created_at) - new Date(a.dispensed_at || a.created_at)
      );
      return {
        reg,
        summary,
        logs: personLogs,
        visitCount: personLogs.length,
        latestLog: personLogs[0] || null
      };
    });
  }, [registrations, logs]);

  const filteredRoster = useMemo(() => {
    const q = rosterSearchQuery.toLowerCase().trim();
    return rosterEntries.filter(item => {
      const { reg, summary, visitCount } = item;
      if (rosterUniFilter === 'kku' && summary.institution !== 'มข.') return false;
      if (rosterUniFilter === 'msu' && summary.institution !== 'มมส') return false;
      if (rosterUniFilter === 'other' && (summary.institution === 'มข.' || summary.institution === 'มมส')) return false;

      if (rosterRiskFilter === 'allergy' && !summary.hasAlg) return false;
      if (rosterRiskFilter === 'chronic' && !summary.hasMed) return false;
      if (rosterRiskFilter === 'equipment' && !summary.requestedEquipment) return false;
      if (rosterRiskFilter === 'any_risk' && !summary.hasAlg && !summary.hasMed && !summary.requestedEquipment) return false;

      if (rosterVisitFilter === 'visited' && visitCount === 0) return false;
      if (rosterVisitFilter === 'never' && visitCount > 0) return false;

      if (!q) return true;
      const haystack = [
        summary.name,
        summary.nickname,
        summary.callsign,
        summary.phone,
        summary.institution,
        summary.room,
        summary.group,
        summary.blood,
        summary.allergy,
        summary.medical,
        summary.requestedEquipment,
        reg.user_email || ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rosterEntries, rosterSearchQuery, rosterUniFilter, rosterRiskFilter, rosterVisitFilter]);

  const paginatedRoster = useMemo(() => {
    const start = (rosterPage - 1) * ROSTER_PAGE_SIZE;
    return filteredRoster.slice(start, start + ROSTER_PAGE_SIZE);
  }, [filteredRoster, rosterPage]);

  useEffect(() => {
    setRosterPage(1);
  }, [rosterSearchQuery, rosterUniFilter, rosterRiskFilter, rosterVisitFilter]);

  // Filtered Logs (EMR Logs Tab)
  const filteredLogs = useMemo(() => {
    const q = logSearchQuery.toLowerCase().trim();
    const sorted = [...logs].sort(
      (a, b) => new Date(b.dispensed_at || b.created_at) - new Date(a.dispensed_at || a.created_at)
    );

    return sorted.filter(l => {
      if (logUniFilter !== 'all') {
        const inst = (l.recipient_institution || '').toLowerCase();
        if (logUniFilter === 'kku' && !inst.includes('มข') && !inst.includes('kku')) return false;
        if (logUniFilter === 'msu' && !inst.includes('มมส') && !inst.includes('msu')) return false;
      }

      if (logRiskFilter === 'allergy' && (!l.recipient_known_allergies || l.recipient_known_allergies === 'ไม่มี')) return false;
      if (logRiskFilter === 'chronic' && (!l.recipient_chronic_diseases || l.recipient_chronic_diseases === 'ไม่มี')) return false;

      if (logTypeFilter === 'first_aid' && !(l.first_aid_action && l.first_aid_action.trim())) return false;
      if (logTypeFilter === 'meds' && !(l.medicines_dispensed && !l.medicines_dispensed.includes('ไม่จ่ายยา'))) return false;

      if (
        logOperatorFilter !== 'all' &&
        l.dispenser_name?.trim() !== logOperatorFilter &&
        l.recorder_name?.trim() !== logOperatorFilter
      ) {
        return false;
      }

      if (logDateFilter !== 'all') {
        const dt = new Date(l.dispensed_at || l.created_at);
        const dayStr = !Number.isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : '';
        if (dayStr !== logDateFilter) return false;
      }

      if (!q) return true;
      const searchable = [
        l.recipient_name,
        l.recipient_nickname,
        l.recipient_callsign,
        l.recipient_institution,
        l.recipient_room,
        l.symptoms,
        l.incident_detail,
        l.first_aid_action,
        l.medicines_dispensed,
        l.dosage_instruction,
        l.vital_signs,
        l.recorder_name,
        l.dispenser_name,
        l.medical_notes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [logs, logSearchQuery, logUniFilter, logRiskFilter, logTypeFilter, logOperatorFilter, logDateFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (logsPage - 1) * LOGS_PAGE_SIZE;
    return filteredLogs.slice(start, start + LOGS_PAGE_SIZE);
  }, [filteredLogs, logsPage]);

  useEffect(() => {
    setLogsPage(1);
  }, [logSearchQuery, logUniFilter, logRiskFilter, logTypeFilter, logOperatorFilter, logDateFilter]);

  // Individual Person Logs
  const inspectedPersonLogs = useMemo(() => {
    if (!inspectedPerson) return [];
    return logs
      .filter(l => matchEmrLogToPerson(l, inspectedPerson))
      .sort((a, b) => new Date(b.dispensed_at || b.created_at) - new Date(a.dispensed_at || a.created_at));
  }, [logs, inspectedPerson]);

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    const targetLogs = activeSubView === 'person' && inspectedPerson ? inspectedPersonLogs : filteredLogs;
    if (targetLogs.length === 0) {
      if (triggerToast) triggerToast('ยังไม่มีข้อมูลเวชระเบียนสำหรับส่งออก', 'warning');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ฝ่ายพยาบาลและเวชระเบียน JRE 2027';
      const sheet = workbook.addWorksheet('เวชระเบียน_JRE2027');

      sheet.addRow(['บัญชีเวชระเบียน ปฐมพยาบาล และเบิกจ่ายยา โครงการ Joint Response Exercise (JRE 2027)']);
      sheet.addRow([
        `ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')} • รวมทั้งสิ้น ${targetLogs.length} รายการ`
      ]);
      sheet.addRow([]);

      sheet.addRow([
        'ลำดับ',
        'วันเวลาเกิดเหตุ/จ่ายยา',
        'ชื่อ - สกุล',
        'ชื่อเล่น',
        'นามเรียกขาน',
        'สถาบัน',
        'ห้องพัก',
        'กรุ๊ปเลือด',
        'โรคประจำตัว',
        'ประวัติแพ้ยา/อาหาร',
        'อาการ / เป็นอะไร',
        'เหตุการณ์ / เป็นเมื่อไหร่อย่างไร',
        'วิธีการปฐมพยาบาล',
        'สัญญาณชีพ (Vital Signs)',
        'ยาและเวชภัณฑ์ที่กิน/จ่าย',
        'ขนาดและเวลาที่รับประทาน',
        'ผู้กรอกข้อมูล (Recorder)',
        'ผู้จ่ายยา/ผู้ปฐมพยาบาล (Dispenser)',
        'หมายเหตุ / ติดตามอาการ'
      ]);

      targetLogs.forEach((l, idx) => {
        sheet.addRow([
          idx + 1,
          new Date(l.dispensed_at || l.created_at).toLocaleString('th-TH'),
          l.recipient_name || '-',
          l.recipient_nickname || '-',
          l.recipient_callsign || '-',
          l.recipient_institution || '-',
          l.recipient_room || '-',
          l.recipient_blood || '-',
          l.recipient_chronic_diseases || 'ไม่มี',
          l.recipient_known_allergies || 'ไม่มี',
          l.symptoms || '-',
          l.incident_detail || '-',
          l.first_aid_action || '-',
          l.vital_signs || '-',
          l.medicines_dispensed || '-',
          l.dosage_instruction || '-',
          l.recorder_name || l.dispenser_name || '-',
          l.dispenser_name || '-',
          l.medical_notes || '-'
        ]);
      });

      sheet.getRow(4).font = { bold: true };
      sheet.columns.forEach(col => {
        col.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix =
        activeSubView === 'person' && inspectedPersonSummary
          ? `_${inspectedPersonSummary.name}`
          : '_รวมทุกคน';
      a.download = `เวชระเบียน_JRE2027${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      if (triggerToast) triggerToast('✓ ส่งออกไฟล์ Excel เวชระเบียนเรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const targetLogs = activeSubView === 'person' && inspectedPerson ? inspectedPersonLogs : filteredLogs;
    if (targetLogs.length === 0) {
      if (triggerToast) triggerToast('ยังไม่มีข้อมูลเวชระเบียนสำหรับส่งออก', 'warning');
      return;
    }

    let csv =
      '\uFEFFลำดับ,วันเวลา,ชื่อ-สกุล,ชื่อเล่น,นามเรียกขาน,สถาบัน,ห้อง,กรุ๊ปเลือด,โรคประจำตัว,แพ้,อาการ,เหตุการณ์เมื่อไหร่อย่างไร,ปฐมพยาบาล,สัญญาณชีพ,ยาที่กิน/จ่าย,วิธีใช้/เวลา,ผู้กรอกข้อมูล,ผู้จ่ายยา/ดูแล,หมายเหตุ\n';
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

    targetLogs.forEach((l, idx) => {
      csv += [
        idx + 1,
        esc(new Date(l.dispensed_at || l.created_at).toLocaleString('th-TH')),
        esc(l.recipient_name),
        esc(l.recipient_nickname),
        esc(l.recipient_callsign),
        esc(l.recipient_institution),
        esc(l.recipient_room),
        esc(l.recipient_blood),
        esc(l.recipient_chronic_diseases || 'ไม่มี'),
        esc(l.recipient_known_allergies || 'ไม่มี'),
        esc(l.symptoms),
        esc(l.incident_detail || '-'),
        esc(l.first_aid_action || '-'),
        esc(l.vital_signs || '-'),
        esc(l.medicines_dispensed),
        esc(l.dosage_instruction || '-'),
        esc(l.recorder_name || l.dispenser_name || '-'),
        esc(l.dispenser_name || '-'),
        esc(l.medical_notes || '-')
      ].join(',') + '\n';
    });

    downloadCsv(csv, `เวชระเบียน_JRE2027_${new Date().toISOString().slice(0, 10)}.csv`);
    if (triggerToast) triggerToast('✓ ส่งออกไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
                <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
                <span>ศูนย์เวชระเบียนรวม & พยาบาลสนาม • JRE 2027</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                /admin/medical
              </span>
              {isDevOperator && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEV FULL EMR ACCESS
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🩺 เวชระเบียนรวมทุกคน • ปฐมพยาบาล & จ่ายยา</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              รวบรวมข้อมูลสุขภาพและเวชระเบียนผู้เข้าร่วมทุกคน พร้อมสถิติสรุปอาการ ยา การปฐมพยาบาล บันทึกเหตุการณ์
              ผู้กรอก ผู้จ่ายยา เปิดดูเวชระเบียนรายบุคคลได้ทันที และแก้ไข/ลบได้ครบถ้วน
            </p>
          </div>

          {/* Action Export & Quick Record Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openNewRecordForPerson(activeSubView === 'person' ? inspectedPerson : null)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกเวชระเบียนใหม่</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={fetchLogs}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>บันทึกเวชระเบียนรวม</span>
              <Activity className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">{emrStats.totalVisits} ครั้ง</div>
            <span className="text-[10px] text-slate-400">รักษา / จ่ายยาทั้งหมด</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้รับบริการ (คน)</span>
              <User className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-black text-sky-300 font-mono">{emrStats.uniquePeople} คน</div>
            <span className="text-[10px] text-sky-400 font-bold">จาก {registrations.length} คน</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>เคสปฐมพยาบาล</span>
              <HeartPulse className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-xl font-black text-pink-300 font-mono">{emrStats.firstAidCases} ครั้ง</div>
            <span className="text-[10px] text-pink-400">บันทึกการปฐมพยาบาล</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้แพ้ยา / แพ้อาหาร</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">{emrStats.allergyPeopleCount} คน</div>
            <span className="text-[10px] text-amber-400">เฝ้าระวังการแพ้ยา</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ผู้มีโรคประจำตัว</span>
              <Stethoscope className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono">{emrStats.chronicPeopleCount} คน</div>
            <span className="text-[10px] text-emerald-400">ติดตามต่อเนื่อง</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>ขออุปกรณ์/ยาพิเศษ</span>
              <Pill className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 font-mono">{emrStats.equipmentReqCount} คน</div>
            <span className="text-[10px] text-purple-400">ตามใบสมัคร</span>
          </div>
        </div>
      </div>

      {/* STATISTICS & VISUAL SUMMARY DASHBOARD */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm sm:text-base font-black text-white">
              สถิติสรุปเวชระเบียน การเจ็บป่วย ปฐมพยาบาล และการใช้ยา
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowStatsPanel(prev => !prev)}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
          >
            {showStatsPanel ? 'ซ่อนสถิติ' : 'แสดงสถิติ'}
          </button>
        </div>

        {showStatsPanel && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* Top Symptoms */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="font-black text-amber-300 flex items-center justify-between">
                <span>🤒 อาการที่พบมากที่สุด (คลิกเพื่อกรอง)</span>
                <span className="text-[10px] font-mono text-slate-500">Top {emrStats.topSymptoms.length}</span>
              </div>
              {emrStats.topSymptoms.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">ยังไม่มีข้อมูลบันทึกอาการ</p>
              ) : (
                emrStats.topSymptoms.map(([sym, count]) => {
                  const pct = Math.min(100, Math.round((count / Math.max(1, emrStats.totalVisits)) * 100));
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        clearPersonEmrPage('logs');
                        setLogSearchQuery(sym);
                      }}
                      className="w-full text-left space-y-1 hover:bg-slate-900/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="truncate pr-2">{sym}</span>
                        <span className="font-mono font-bold text-amber-300 shrink-0">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Top Medicines & First Aid */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="font-black text-emerald-300 flex items-center justify-between">
                <span>💊 ยาและเวชภัณฑ์ที่จ่ายบ่อย</span>
                <span className="text-[10px] font-mono text-slate-500">Top {emrStats.topMedicines.length}</span>
              </div>
              {emrStats.topMedicines.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">ยังไม่มีข้อมูลการจ่ายยา</p>
              ) : (
                emrStats.topMedicines.map(([med, count]) => {
                  const pct = Math.min(100, Math.round((count / Math.max(1, emrStats.totalVisits)) * 100));
                  return (
                    <button
                      key={med}
                      type="button"
                      onClick={() => {
                        clearPersonEmrPage('logs');
                        setLogSearchQuery(med);
                      }}
                      className="w-full text-left space-y-1 hover:bg-slate-900/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="truncate pr-2">{med}</span>
                        <span className="font-mono font-bold text-emerald-300 shrink-0">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Top First Aid & Institution Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="font-black text-pink-300 flex items-center justify-between">
                <span>🩹 สรุปปฐมพยาบาล & แยกสถาบัน</span>
              </div>
              {emrStats.topFirstAid.length > 0 ? (
                <div className="space-y-1.5">
                  {emrStats.topFirstAid.slice(0, 4).map(([act, count]) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => {
                        clearPersonEmrPage('logs');
                        setLogSearchQuery(act);
                      }}
                      className="w-full flex items-center justify-between text-[11px] bg-pink-950/20 hover:bg-pink-950/40 border border-pink-500/20 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      <span className="truncate text-pink-100 pr-2">{act}</span>
                      <span className="font-mono font-bold text-pink-300">{count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">ยังไม่มีบันทึกหัตถการปฐมพยาบาล</p>
              )}

              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 font-bold mb-1.5">แยกตามสถาบัน (จำนวนครั้ง):</div>
                <div className="flex flex-wrap gap-1.5">
                  {emrStats.byUniversity.length === 0 ? (
                    <span className="text-[11px] text-slate-500">ไม่มีข้อมูล</span>
                  ) : (
                    emrStats.byUniversity.map(([uni, count]) => (
                      <span
                        key={uni}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-sky-300"
                      >
                        {uni}: <span className="text-white font-mono">{count}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT EMR RECORD FORM (COLLAPSIBLE / EXPANDABLE) */}
      <div ref={formRef}>
        {showRecordForm && (
          <div className="rounded-3xl bg-slate-900 border-2 border-rose-500/40 p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {editingLogId ? <Edit3 className="w-5 h-5 text-amber-300" /> : <Stethoscope className="w-5 h-5 text-rose-400" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {editingLogId
                      ? '✏️ แก้ไขบันทึกเวชระเบียน / การปฐมพยาบาล / การจ่ายยา'
                      : '🩺 บันทึกเวชระเบียนใหม่ (เป็นอะไร เมื่อไหร่ ปฐมพยาบาลยังไง กินยาอะไร ใครกรอก ใครจ่าย)'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    สแกน QR หรือค้นหารายชื่อ เพื่อบันทึกหรือแก้ไขข้อมูลสุขภาพและการปฐมพยาบาลได้ครบทุกช่อง
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>ปิดฟอร์ม</span>
              </button>
            </div>

            {!selectedRecipient ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="🔍 พิมพ์ชื่อ, ชื่อเล่น, นามเรียกขาน (เช่น TSI 2114), ห้องพัก หรือเบอร์โทร..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={isScanning ? stopScanner : startScanner}
                    className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isScanning ? 'bg-rose-700 hover:bg-rose-600 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isScanning ? '⏹️ ปิดกล้องสแกน' : '📷 สแกน QR บัตร'}</span>
                  </button>
                </div>

                {isScanning && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
                    <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
                      <span>📸 นำบัตร ID Card ของผู้เข้าอบรมมาส่องที่หน้ากล้อง...</span>
                      <button type="button" onClick={stopScanner} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div id="medical-qr-reader-region" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-indigo-500/50 bg-black min-h-[240px]" />
                    {scannerError && <p className="text-xs text-rose-400 text-center font-bold">{scannerError}</p>}
                  </div>
                )}

                {filteredParticipants.length > 0 && (
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-2xl">
                    <div className="px-4 py-2 bg-slate-900/80 text-[11px] font-bold text-slate-400">
                      พบรายชื่อ {filteredParticipants.length} ท่าน (คลิกเพื่อเลือก):
                    </div>
                    {filteredParticipants.map(reg => {
                      const summary = formatPersonSummary(reg);
                      return (
                        <div
                          key={reg.id || reg.user_id}
                          onClick={() => handleSelectRecipient(reg)}
                          className="p-3 hover:bg-rose-950/20 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                              {summary.photo ? (
                                <img src={summary.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                                  {summary.name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>{summary.name}</span>
                                {summary.nickname !== '-' && <span className="text-amber-300">({summary.nickname})</span>}
                              </div>
                              <div className="text-[11px] text-sky-300 font-mono">
                                {summary.callsign} • {summary.institution} • ห้อง: {summary.room}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {summary.hasAlg && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                แพ้: {summary.allergy}
                              </span>
                            )}
                            {summary.hasMed && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                โรค: {summary.medical}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-sky-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div
                      onClick={() => {
                        if (selectedRecipient.photo) {
                          setPreviewDoc({ fileUrl: selectedRecipient.photo, title: selectedRecipient.name });
                        }
                      }}
                      className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-400/50 shrink-0 cursor-pointer"
                    >
                      {selectedRecipient.photo ? (
                        <img src={selectedRecipient.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-lg">
                          {selectedRecipient.name[0]}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {selectedRecipient.institution}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-sky-300 bg-sky-950 border border-sky-500/30">
                          ห้อง: {selectedRecipient.room}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-rose-300 bg-rose-950 border border-rose-500/30">
                          🩸 {selectedRecipient.blood}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        {selectedRecipient.name}{' '}
                        {selectedRecipient.nickname !== '-' && <span className="text-amber-300">({selectedRecipient.nickname})</span>}
                      </h3>
                      <p className="text-xs text-sky-300 font-mono">
                        นามเรียกขาน: <strong>{selectedRecipient.callsign}</strong> • โทร: {selectedRecipient.phone}
                      </p>
                    </div>
                  </div>

                  {!editingLogId && (
                    <button
                      type="button"
                      onClick={() => setSelectedRecipient(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1 self-end sm:self-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>เปลี่ยนบุคคล</span>
                    </button>
                  )}
                </div>

                {/* Allergy / Chronic / Requested Equipment Alerts */}
                {(selectedRecipient.hasAlg || selectedRecipient.hasMed || selectedRecipient.requestedEquipment) && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border-2 border-rose-500/60 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-black">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>⚠️ ข้อควรระวังทางการแพทย์ของผู้ป่วยรายนี้:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rose-100">
                      {selectedRecipient.hasAlg && (
                        <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40">
                          <span className="font-bold text-amber-300">แพ้ยา/อาหาร:</span> <strong>{selectedRecipient.allergy}</strong>
                        </div>
                      )}
                      {selectedRecipient.hasMed && (
                        <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40">
                          <span className="font-bold text-rose-300">โรคประจำตัว:</span> <strong>{selectedRecipient.medical}</strong>
                        </div>
                      )}
                    </div>
                    {selectedRecipient.requestedEquipment && (
                      <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-200">
                        <span className="font-bold text-purple-300">สิ่งที่ระบุขอเตรียมไว้ล่วงหน้า:</span> {selectedRecipient.requestedEquipment}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSaveDispense} className="space-y-4">
                  {/* 1. Symptoms */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200">
                      1. อาการ / เป็นอะไร (Symptoms / Chief Complaint): <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {PRESET_SYMPTOMS.map(sym => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => appendUniqueChip(symptomText, setSymptomText, sym)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          + {sym}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={symptomText}
                      onChange={e => setSymptomText(e.target.value)}
                      placeholder="เช่น มีไข้ 38.2°C ปวดศีรษะ แผลถลอกข้อศอก..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                    />
                  </div>

                  {/* 2. Incident detail & Vital Signs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-200">
                        2. เป็นเมื่อไหร่ / เหตุการณ์เป็นอย่างไร (Incident & Onset):
                      </label>
                      <input
                        type="text"
                        value={incidentDetail}
                        onChange={e => setIncidentDetail(e.target.value)}
                        placeholder="เช่น หกล้มระหว่างซ้อมฐานเวลา 14:20 น. / เริ่มปวดหัวตั้งแต่เช้า..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-200">
                        3. สัญญาณชีพ (Vital Signs: BP / HR / Temp / SpO2):
                      </label>
                      <input
                        type="text"
                        value={vitalSigns}
                        onChange={e => setVitalSigns(e.target.value)}
                        placeholder="เช่น BP 118/76 mmHg, PR 84/min, T 37.8°C, SpO2 99%"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 4. First-Aid Action */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200">
                      4. วิธีการปฐมพยาบาล / หัตถการที่ดำเนินการ (First Aid Action):
                    </label>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {PRESET_FIRST_AID.map(act => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => appendUniqueChip(firstAidAction, setFirstAidAction, act)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-pink-950/40 hover:bg-pink-900/60 text-pink-200 border border-pink-500/40 cursor-pointer"
                        >
                          + {act}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={firstAidAction}
                      onChange={e => setFirstAidAction(e.target.value)}
                      placeholder="เช่น ล้างแผลด้วยน้ำเกลือ NSS + ใส่เบตาดีน + ปิดผ้าก๊อซ / ให้นอนพักคลายเสื้อผ้า..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-pink-400 focus:outline-none"
                    />
                  </div>

                  {/* 5. Medicines & Dosage */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200">
                      5. ยาที่กิน / เวชภัณฑ์ที่จ่าย (Medicines & Supplies):
                    </label>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {PRESET_MEDICINES.map(med => (
                        <button
                          key={med.name}
                          type="button"
                          onClick={() => handleAddMedicine(med)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 cursor-pointer"
                        >
                          + {med.name.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={medicineText}
                      onChange={e => setMedicineText(e.target.value)}
                      placeholder="เช่น พาราเซตามอล 500mg 2 เม็ด, ผงเกลือแร่ ORS 1 ซอง..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200">
                      6. กินเมื่อไหร่ / ขนาดและวิธีใช้ยา (Dosage & Timing):
                    </label>
                    <input
                      type="text"
                      value={dosageText}
                      onChange={e => setDosageText(e.target.value)}
                      placeholder="เช่น กินไปแล้ว 1 เม็ด เวลา 14:30 น. / รับประทานทุก 4-6 ชม. หลังอาหาร..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  {/* 7. Recorder, Dispenser & DateTime */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-200">
                        7. ผู้กรอกข้อมูล (Recorder): <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={recorderName}
                        onChange={e => setRecorderName(e.target.value)}
                        placeholder="ชื่อผู้บันทึกเวชระเบียน..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-200">
                        8. ผู้จ่ายยา / ผู้ปฐมพยาบาล (Dispenser): <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={dispenserName}
                        onChange={e => setDispenserName(e.target.value)}
                        placeholder="ชื่อ-นามเรียกขานผู้จ่ายยา..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-200">
                        9. วันเวลาเกิดเหตุ / จ่ายยา:
                      </label>
                      <input
                        type="datetime-local"
                        value={customDateTime}
                        onChange={e => setCustomDateTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 10. Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200">
                      10. บันทึกติดตามอาการ / หมายเหตุเพิ่มเติม (Follow-up Notes):
                    </label>
                    <textarea
                      rows={2}
                      value={medicalNotes}
                      onChange={e => setMedicalNotes(e.target.value)}
                      placeholder="เช่น พักสังเกตอาการ 30 นาที อาการดีขึ้น / นัดตรวจซ้ำเวลา 18:00 น...."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-rose-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => resetForm(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'กำลังบันทึก...' : editingLogId ? '💾 บันทึกการแก้ไขเวชระเบียน' : '💾 บันทึกเวชระเบียน'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUB-VIEW TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => clearPersonEmrPage('logs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'logs'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>เวชระเบียนรวมทุกคน ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => clearPersonEmrPage('roster')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'roster'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ทะเบียนสุขภาพทุกคนในระบบ ({registrations.length})</span>
        </button>

        {inspectedPersonSummary && (
          <button
            type="button"
            onClick={() => setActiveSubView('person')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSubView === 'person'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileHeart className="w-4 h-4" />
            <span>เวชระเบียนรายบุคคล: {inspectedPersonSummary.name} ({inspectedPersonLogs.length})</span>
          </button>
        )}
      </div>

      {/* ======================================================================== */}
      {/* TAB 1: ALL-PARTICIPANTS UNIFIED EMR LOGS WITH MULTI-FILTER & < 0 > PAGING */}
      {/* ======================================================================== */}
      {activeSubView === 'logs' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-sky-400" />
                <span>ประวัติเวชระเบียน การปฐมพยาบาล และการจ่ายยารวม ({filteredLogs.length} รายการ)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ค้นหาได้ทั้งชื่อผู้ป่วย อาการ เหตุการณ์ การปฐมพยาบาล ชื่อยา ผู้กรอก และผู้จ่ายยา พร้อมแบ่งหน้า
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={e => setLogSearchQuery(e.target.value)}
                placeholder="🔍 ค้นหาชื่อ, อาการ, ปฐมพยาบาล, ยา, ผู้กรอก..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Multi-filters bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              ตัวกรอง:
            </span>

            <select
              value={logUniFilter}
              onChange={e => setLogUniFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกสถาบัน</option>
              <option value="kku">มข. (KKU)</option>
              <option value="msu">มมส (MSU)</option>
            </select>

            <select
              value={logTypeFilter}
              onChange={e => setLogTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกประเภทการรักษา</option>
              <option value="first_aid">มีการปฐมพยาบาล</option>
              <option value="meds">มีการจ่ายยา</option>
            </select>

            <select
              value={logRiskFilter}
              onChange={e => setLogRiskFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกประวัติสุขภาพ</option>
              <option value="allergy">มีประวัติแพ้ยา/อาหาร</option>
              <option value="chronic">มีโรคประจำตัว</option>
            </select>

            <select
              value={logOperatorFilter}
              onChange={e => setLogOperatorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none max-w-[180px]"
            >
              <option value="all">ผู้กรอก/ผู้จ่ายยาทั้งหมด</option>
              {operatorOptions.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <select
              value={logDateFilter}
              onChange={e => setLogDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกวัน</option>
              {dateOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {(logSearchQuery ||
              logUniFilter !== 'all' ||
              logRiskFilter !== 'all' ||
              logTypeFilter !== 'all' ||
              logOperatorFilter !== 'all' ||
              logDateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setLogSearchQuery('');
                  setLogUniFilter('all');
                  setLogRiskFilter('all');
                  setLogTypeFilter('all');
                  setLogOperatorFilter('all');
                  setLogDateFilter('all');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 font-bold cursor-pointer"
              >
                ✕ ล้างตัวกรอง
              </button>
            )}
          </div>

          {isLoadingLogs ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
              <span>กำลังโหลดข้อมูลเวชระเบียน...</span>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="space-y-4">
              <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-2xl border border-slate-800/80">
                ยังไม่มีประวัติเวชระเบียนในระบบ หรือไม่พบข้อมูลตามตัวกรองที่เลือก
              </div>
              <PaginationBar
                currentPage={0}
                totalItems={0}
                pageSize={LOGS_PAGE_SIZE}
                onPageChange={setLogsPage}
                itemLabel="รายการ"
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-3 w-36">วันเวลา</th>
                      <th className="py-3 px-3 w-52">ผู้รับบริการ (คลิกดูรายคน)</th>
                      <th className="py-3 px-3 w-56">อาการ / เหตุการณ์ / สัญญาณชีพ</th>
                      <th className="py-3 px-3">การปฐมพยาบาล & ยาที่กิน/จ่าย</th>
                      <th className="py-3 px-3 w-44">ผู้กรอก / ผู้จ่ายยา</th>
                      <th className="py-3 px-2 w-28 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paginatedLogs.map((log, index) => {
                      const rowNo = (logsPage - 1) * LOGS_PAGE_SIZE + index + 1;
                      const matchedPerson = findPersonForEmrLog(log, registrations);
                      const personTargetId = matchedPerson?.id || matchedPerson?.user_id || log.recipient_id || log.recipient_user_id;

                      return (
                        <tr key={log.id || rowNo} className="hover:bg-slate-800/40 transition-colors align-top">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">{rowNo}</td>

                          <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                            <div>
                              {new Date(log.dispensed_at || log.created_at).toLocaleString('th-TH', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {log.updated_at && log.updated_at !== log.created_at && (
                              <div className="text-[10px] text-amber-400/80 mt-0.5">แก้ไขแล้ว</div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {log.recipient_photo && (
                                <div
                                  onClick={() => setPreviewDoc({ fileUrl: log.recipient_photo, title: log.recipient_name })}
                                  className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 cursor-pointer"
                                >
                                  <img src={log.recipient_photo} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => personTargetId && openPersonEmrPage(personTargetId)}
                                  className="font-bold text-white hover:text-sky-300 text-xs text-left cursor-pointer underline decoration-dotted underline-offset-2"
                                  title="เปิดหน้าเวชระเบียนของคนนี้"
                                >
                                  {log.recipient_name}{' '}
                                  {log.recipient_nickname && log.recipient_nickname !== '-' && (
                                    <span className="text-amber-300 font-normal">({log.recipient_nickname})</span>
                                  )}
                                </button>
                                <div className="text-[10px] text-sky-300 font-mono">
                                  {log.recipient_callsign || '-'} • {log.recipient_institution || '-'} • ห้อง {log.recipient_room || '-'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 space-y-1">
                            <div className="font-bold text-amber-200">{log.symptoms}</div>
                            {log.incident_detail && (
                              <div className="text-[11px] text-slate-300">📌 เหตุการณ์: {log.incident_detail}</div>
                            )}
                            {log.vital_signs && (
                              <div className="text-[10px] font-mono text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded inline-block">
                                ❤️ V/S: {log.vital_signs}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 space-y-1">
                            {log.first_aid_action && (
                              <div className="text-pink-200 font-semibold">🩹 ปฐมพยาบาล: {log.first_aid_action}</div>
                            )}
                            <div className="font-bold text-emerald-300">💊 ยา: {log.medicines_dispensed}</div>
                            {log.dosage_instruction && (
                              <div className="text-[11px] text-slate-300 italic">วิธีใช้/เวลา: {log.dosage_instruction}</div>
                            )}
                            {log.medical_notes && (
                              <div className="text-[10px] text-slate-400">หมายเหตุ: {log.medical_notes}</div>
                            )}
                          </td>

                          <td className="py-3 px-3 space-y-1">
                            <div className="text-[11px] text-sky-200">
                              <span className="text-slate-400">กรอก:</span> {log.recorder_name || log.dispenser_name || '-'}
                            </div>
                            <div className="font-bold text-purple-300 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>จ่าย: {log.dispenser_name || '-'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {personTargetId && (
                                <button
                                  type="button"
                                  onClick={() => openPersonEmrPage(personTargetId)}
                                  className="p-1.5 rounded-lg text-sky-300 hover:bg-sky-950/50 cursor-pointer"
                                  title="ดูเวชระเบียนรายบุคคล"
                                >
                                  <FileHeart className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditLogForm(log)}
                                className="p-1.5 rounded-lg text-amber-300 hover:bg-amber-950/50 cursor-pointer"
                                title="แก้ไขบันทึกเวชระเบียนนี้"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log.id, log.recipient_name)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                title="ลบบันทึกนี้"
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

              <PaginationBar
                currentPage={logsPage}
                totalItems={filteredLogs.length}
                pageSize={LOGS_PAGE_SIZE}
                onPageChange={setLogsPage}
                itemLabel="รายการเวชระเบียน"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 2: ALL-PARTICIPANTS HEALTH ROSTER WITH SEARCH, FILTERS & < 0 > PAGING */}
      {/* ======================================================================== */}
      {activeSubView === 'roster' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span>ทะเบียนสุขภาพ & เวชระเบียนประจำตัวทุกคน ({filteredRoster.length} คน)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ตรวจสอบข้อมูลพื้นฐานสุขภาพ กรุ๊ปเลือด โรคประจำตัว ประวัติแพ้ และเปิดดู/บันทึกเวชระเบียนของแต่ละคนได้ทันที
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={rosterSearchQuery}
                onChange={e => setRosterSearchQuery(e.target.value)}
                placeholder="🔍 ค้นหาชื่อ, นามเรียกขาน, โรคประจำตัว, แพ้, ห้อง..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              ตัวกรอง:
            </span>
            <select
              value={rosterUniFilter}
              onChange={e => setRosterUniFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกสถาบัน</option>
              <option value="kku">มข. (KKU)</option>
              <option value="msu">มมส (MSU)</option>
              <option value="other">สถาบันอื่นๆ</option>
            </select>

            <select
              value={rosterRiskFilter}
              onChange={e => setRosterRiskFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกสถานะสุขภาพ</option>
              <option value="any_risk">มีโรค/แพ้/ขออุปกรณ์พิเศษ</option>
              <option value="allergy">เฉพาะมีประวัติแพ้ยา/อาหาร</option>
              <option value="chronic">เฉพาะมีโรคประจำตัว</option>
              <option value="equipment">เฉพาะขออุปกรณ์/ยาพิเศษ</option>
            </select>

            <select
              value={rosterVisitFilter}
              onChange={e => setRosterVisitFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="all">ประวัติเข้ารับการรักษาทั้งหมด</option>
              <option value="visited">เคยมีบันทึกเวชระเบียนแล้ว</option>
              <option value="never">ยังไม่เคยบันทึกเวชระเบียน</option>
            </select>
          </div>

          {paginatedRoster.length === 0 ? (
            <div className="space-y-4">
              <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-2xl border border-slate-800/80">
                ไม่พบรายชื่อผู้เข้าร่วมตามเงื่อนไขที่ค้นหา
              </div>
              <PaginationBar
                currentPage={0}
                totalItems={0}
                pageSize={ROSTER_PAGE_SIZE}
                onPageChange={setRosterPage}
                itemLabel="คน"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedRoster.map(({ reg, summary, visitCount, latestLog }) => (
                  <div
                    key={reg.id || reg.user_id}
                    className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => summary.photo && setPreviewDoc({ fileUrl: summary.photo, title: summary.name })}
                            className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 cursor-pointer"
                          >
                            {summary.photo ? (
                              <img src={summary.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                {summary.name[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-white text-xs sm:text-sm truncate">
                              {summary.name}{' '}
                              {summary.nickname !== '-' && <span className="text-amber-300 font-bold">({summary.nickname})</span>}
                            </div>
                            <div className="text-[11px] font-mono text-sky-300 truncate">
                              {summary.callsign} • {summary.institution} • ห้อง {summary.room}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30 shrink-0">
                          🩸 {summary.blood}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        {summary.hasAlg ? (
                          <div className="px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-200">
                            <strong>แพ้:</strong> {summary.allergy}
                          </div>
                        ) : (
                          <div className="text-slate-500">• แพ้ยา/อาหาร: ไม่มี</div>
                        )}

                        {summary.hasMed ? (
                          <div className="px-2 py-1 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-200">
                            <strong>โรคประจำตัว:</strong> {summary.medical}
                          </div>
                        ) : (
                          <div className="text-slate-500">• โรคประจำตัว: ไม่มี</div>
                        )}

                        {summary.requestedEquipment && (
                          <div className="px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-200">
                            <strong>ขอเตรียมยา/อุปกรณ์:</strong> {summary.requestedEquipment}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                        {visitCount > 0 ? (
                          <div className="text-emerald-300 space-y-0.5">
                            <div className="font-bold">✓ มีบันทึกเวชระเบียน {visitCount} ครั้ง</div>
                            {latestLog && (
                              <div className="text-slate-400 truncate">
                                ล่าสุด: {latestLog.symptoms} ({latestLog.medicines_dispensed})
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500">ยังไม่มีประวัติเข้ารับบริการพยาบาล</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openPersonEmrPage(reg)}
                        className="flex-1 px-3 py-2 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 text-sky-200 border border-sky-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileHeart className="w-3.5 h-3.5" />
                        <span>เปิดหน้าเวชระเบียน</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openNewRecordForPerson(reg)}
                        className="px-3 py-2 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="บันทึกเวชระเบียน / จ่ายยาให้คนนี้"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>บันทึก</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <PaginationBar
                currentPage={rosterPage}
                totalItems={filteredRoster.length}
                pageSize={ROSTER_PAGE_SIZE}
                onPageChange={setRosterPage}
                itemLabel="คน"
              />
            </>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 3: INDIVIDUAL PATIENT MEDICAL RECORD PAGE (/admin/medical?person=ID) */}
      {/* ======================================================================== */}
      {activeSubView === 'person' && (
        <div className="rounded-3xl bg-slate-900 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl space-y-5">
          {!inspectedPersonSummary ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-rose-300 font-bold">
                ไม่พบข้อมูลบุคคลสำหรับรหัส: {inspectedPersonId || '-'}
              </p>
              <button
                type="button"
                onClick={() => clearPersonEmrPage('roster')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                ← กลับไปหน้ารายชื่อทุกคน
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => clearPersonEmrPage('roster')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>กลับหน้ารวมเวชระเบียน</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPersonUrl}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>คัดลอก URL คนนี้</span>
                  </button>

                  {onSelectApplicant && (
                    <button
                      type="button"
                      onClick={() => onSelectApplicant(inspectedPerson)}
                      className="px-3 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-bold cursor-pointer"
                    >
                      เปิดโปรไฟล์ Admin
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openNewRecordForPerson(inspectedPerson)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>บันทึกอาการ / ปฐมพยาบาล / จ่ายยาให้คนนี้</span>
                  </button>
                </div>
              </div>

              {/* Full Individual Identity & Health Profile Card */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div
                    onClick={() =>
                      inspectedPersonSummary.photo &&
                      setPreviewDoc({ fileUrl: inspectedPersonSummary.photo, title: inspectedPersonSummary.name })
                    }
                    className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-400/50 shrink-0 cursor-pointer"
                  >
                    {inspectedPersonSummary.photo ? (
                      <img src={inspectedPersonSummary.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-300">
                        {inspectedPersonSummary.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {inspectedPersonSummary.institutionFull}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        🩸 กรุ๊ปเลือด: {inspectedPersonSummary.blood}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-sky-300 bg-sky-950 border border-sky-500/30">
                        กลุ่ม: {inspectedPersonSummary.group} • ห้อง: {inspectedPersonSummary.room}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-white">
                      {inspectedPersonSummary.name}{' '}
                      {inspectedPersonSummary.nickname !== '-' && (
                        <span className="text-amber-300">({inspectedPersonSummary.nickname})</span>
                      )}
                    </h2>
                    <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                      <span>นามเรียกขาน: {inspectedPersonSummary.callsign}</span>
                      <span>โทร: {inspectedPersonSummary.phone}</span>
                      <span>อีเมล: {inspectedPerson.user_email || '-'}</span>
                      <span>วันเกิด: {inspectedPerson.dob || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Health & Emergency Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                    <div className="font-bold text-amber-300 mb-0.5">⚠️ ประวัติแพ้ยา / แพ้อาหาร</div>
                    <div className="text-white font-semibold">{inspectedPersonSummary.allergy}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                    <div className="font-bold text-rose-300 mb-0.5">🩺 โรคประจำตัว / ข้อจำกัด</div>
                    <div className="text-white font-semibold">{inspectedPersonSummary.medical}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
                    <div className="font-bold text-purple-300 mb-0.5">💊 ยา/อุปกรณ์ที่ขอเตรียม</div>
                    <div className="text-white font-semibold">{inspectedPersonSummary.requestedEquipment || 'ไม่มี'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30">
                    <div className="font-bold text-sky-300 mb-0.5">📞 ผู้ติดต่อฉุกเฉิน</div>
                    <div className="text-white font-semibold">
                      {inspectedPerson.emergency_contact_name || inspectedPerson.emergency_contact || '-'}{' '}
                      {inspectedPerson.emergency_contact_phone ? `(${inspectedPerson.emergency_contact_phone})` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronological Individual EMR Timeline */}
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>ประวัติเวชระเบียนและการปฐมพยาบาลทั้งหมดของ {inspectedPersonSummary.name} ({inspectedPersonLogs.length} ครั้ง)</span>
                </h3>

                {inspectedPersonLogs.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400">
                    ยังไม่มีบันทึกการรักษา ปฐมพยาบาล หรือจ่ายยาของบุคคลนี้
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspectedPersonLogs.map((log, i) => (
                      <div
                        key={log.id || i}
                        className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                              ครั้งที่ #{inspectedPersonLogs.length - i}
                            </span>
                            <span className="font-mono text-slate-300 font-bold">
                              🕒{' '}
                              {new Date(log.dispensed_at || log.created_at).toLocaleString('th-TH', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </span>
                            {log.vital_signs && (
                              <span className="px-2 py-0.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-500/30 font-mono">
                                ❤️ {log.vital_signs}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditLogForm(log)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id, log.recipient_name)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div>
                              <span className="text-slate-400">🤒 อาการ/เป็นอะไร:</span>{' '}
                              <strong className="text-amber-200">{log.symptoms}</strong>
                            </div>
                            {log.incident_detail && (
                              <div>
                                <span className="text-slate-400">📌 เป็นเมื่อไหร่/เหตุการณ์:</span>{' '}
                                <span className="text-slate-200">{log.incident_detail}</span>
                              </div>
                            )}
                            {log.first_aid_action && (
                              <div>
                                <span className="text-slate-400">🩹 การปฐมพยาบาล:</span>{' '}
                                <strong className="text-pink-200">{log.first_aid_action}</strong>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div>
                              <span className="text-slate-400">💊 ยาที่กิน/จ่าย:</span>{' '}
                              <strong className="text-emerald-300">{log.medicines_dispensed}</strong>
                            </div>
                            {log.dosage_instruction && (
                              <div>
                                <span className="text-slate-400">⏰ กินเมื่อไหร่/วิธีใช้:</span>{' '}
                                <span className="text-slate-200">{log.dosage_instruction}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1">
                              <span className="text-sky-300">
                                ✍️ ผู้กรอก: <strong>{log.recorder_name || log.dispenser_name || '-'}</strong>
                              </span>
                              <span className="text-purple-300">
                                🩺 ผู้จ่ายยา/ดูแล: <strong>{log.dispenser_name || '-'}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {log.medical_notes && (
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                            📝 บันทึกติดตาม/หมายเหตุ: {log.medical_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* DOCUMENT & PHOTO LIGHTBOX POPUP MODAL */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          doc={previewDoc}
        />
      )}
    </div>
  );
}
