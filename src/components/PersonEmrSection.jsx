import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Clock,
  ShieldCheck,
  FileHeart
} from 'lucide-react';
import { DataService } from '../supabase';
import { confirmWithModal } from '../utils/confirmHelper';
import {
  PRESET_SYMPTOMS,
  PRESET_FIRST_AID,
  PRESET_MEDICINES,
  getDefaultOperatorName,
  toLocalDateTimeInput,
  formatPersonSummary,
  matchEmrLogToPerson,
  buildEmrPayload
} from '../utils/emrUtils';

export default function PersonEmrSection({
  person = null,
  currentUser = null,
  isDevOperator = false,
  externalLogs = null,
  onLogsUpdated = null,
  onOpenFullEmrPage = null,
  triggerToast = null,
  askConfirm = null
}) {
  const [logs, setLogs] = useState(Array.isArray(externalLogs) ? externalLogs : []);
  const [isLoading, setIsLoading] = useState(!Array.isArray(externalLogs));
  const [showForm, setShowForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [symptoms, setSymptoms] = useState('');
  const [incidentDetail, setIncidentDetail] = useState('');
  const [firstAidAction, setFirstAidAction] = useState('');
  const [vitalSigns, setVitalSigns] = useState('');
  const [medicines, setMedicines] = useState('');
  const [dosageInstruction, setDosageInstruction] = useState('');
  const [recorderName, setRecorderName] = useState(() => getDefaultOperatorName(currentUser));
  const [dispenserName, setDispenserName] = useState(() => getDefaultOperatorName(currentUser));
  const [dispensedAt, setDispensedAt] = useState(() => toLocalDateTimeInput(new Date().toISOString()));
  const [medicalNotes, setMedicalNotes] = useState('');
  const [statusFeedback, setStatusFeedback] = useState('');

  const summary = useMemo(() => formatPersonSummary(person), [person]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await DataService.getMedicalDispenseLogs();
      const arr = Array.isArray(data) ? data : [];
      setLogs(arr);
      if (onLogsUpdated) onLogsUpdated(arr);
    } catch (e) {
      console.error('Failed to load person EMR logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(externalLogs)) {
      setLogs(externalLogs);
      setIsLoading(false);
    } else {
      loadLogs();
    }
  }, [externalLogs]);

  useEffect(() => {
    setRecorderName(getDefaultOperatorName(currentUser));
    setDispenserName(getDefaultOperatorName(currentUser));
  }, [currentUser]);

  const personLogs = useMemo(() => {
    if (!person) return [];
    return logs
      .filter(l => matchEmrLogToPerson(l, person))
      .sort((a, b) => new Date(b.dispensed_at || b.created_at) - new Date(a.dispensed_at || a.created_at));
  }, [logs, person]);

  const openAddForm = () => {
    setEditingLogId(null);
    setSymptoms('');
    setIncidentDetail('');
    setFirstAidAction('');
    setVitalSigns('');
    setMedicines('');
    setDosageInstruction('');
    setRecorderName(getDefaultOperatorName(currentUser));
    setDispenserName(getDefaultOperatorName(currentUser));
    setDispensedAt(toLocalDateTimeInput(new Date().toISOString()));
    setMedicalNotes('');
    setStatusFeedback('');
    setShowForm(true);
  };

  const openEditForm = (log) => {
    setEditingLogId(log.id);
    setSymptoms(log.symptoms || '');
    setIncidentDetail(log.incident_detail || '');
    setFirstAidAction(log.first_aid_action || '');
    setVitalSigns(log.vital_signs || '');
    setMedicines(log.medicines_dispensed || '');
    setDosageInstruction(log.dosage_instruction || '');
    setRecorderName(log.recorder_name || getDefaultOperatorName(currentUser));
    setDispenserName(log.dispenser_name || getDefaultOperatorName(currentUser));
    setDispensedAt(toLocalDateTimeInput(log.dispensed_at || log.created_at));
    setMedicalNotes(log.medical_notes || '');
    setStatusFeedback('');
    setShowForm(true);
  };

  const appendChip = (setter, value, sep = ', ') => {
    setter(prev => {
      if (!prev.trim()) return value;
      if (prev.includes(value)) return prev;
      return `${prev}${sep}${value}`;
    });
  };

  const handleSelectMedicine = (medObj) => {
    setMedicines(prev => {
      if (!prev.trim()) return medObj.name;
      if (prev.includes(medObj.name)) return prev;
      return `${prev} + ${medObj.name}`;
    });
    setDosageInstruction(prev => {
      if (!prev.trim()) return medObj.defaultDose;
      if (prev.includes(medObj.defaultDose)) return prev;
      return `${prev} | ${medObj.defaultDose}`;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person || isSaving) return;
    if (!symptoms.trim()) {
      setStatusFeedback('⚠️ กรุณาระบุอาการ หรือเหตุผลที่เข้ารับการดูแล');
      return;
    }
    if (!medicines.trim() && !firstAidAction.trim()) {
      setStatusFeedback('⚠️ กรุณาระบุรายการยา หรือวิธีการปฐมพยาบาลอย่างน้อย 1 อย่าง');
      return;
    }

    setIsSaving(true);
    setStatusFeedback('');
    try {
      const payload = buildEmrPayload(
        person,
        {
          symptoms,
          incident_detail: incidentDetail,
          first_aid_action: firstAidAction,
          vital_signs: vitalSigns,
          medicines_dispensed: medicines || 'ปฐมพยาบาล (ไม่ใช้ยา)',
          dosage_instruction: dosageInstruction,
          recorder_name: recorderName,
          dispenser_name: dispenserName,
          medical_notes: medicalNotes,
          dispensed_at: dispensedAt || undefined
        },
        currentUser
      );

      if (editingLogId) {
        await DataService.updateMedicalDispenseLog(editingLogId, payload);
        if (triggerToast) triggerToast(`✓ แก้ไขเวชระเบียนของ ${summary?.name} เรียบร้อยแล้ว`, 'success');
        setStatusFeedback('✓ บันทึกการแก้ไขเวชระเบียนเรียบร้อยแล้ว');
      } else {
        await DataService.saveMedicalDispenseLog(payload);
        if (triggerToast) triggerToast(`✓ บันทึกเวชระเบียนของ ${summary?.name} เรียบร้อยแล้ว`, 'success');
        setStatusFeedback('✓ บันทึกเวชระเบียนใหม่เรียบร้อยแล้ว');
      }

      await loadLogs();
      setShowForm(false);
      setEditingLogId(null);
    } catch (err) {
      console.error(err);
      setStatusFeedback(`⚠️ ${err?.message || 'บันทึกเวชระเบียนไม่สำเร็จ'}`);
      if (triggerToast) triggerToast(err?.message || 'บันทึกเวชระเบียนไม่สำเร็จ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (log) => {
    if (!log?.id) return;
    const confirmed = await confirmWithModal(askConfirm, {
      title: '🗑️ ยืนยันการลบประวัติเวชระเบียน',
      message: `ต้องการลบบันทึกเวชระเบียน "${log.symptoms}" ของ ${log.recipient_name || summary?.name} ใช่หรือไม่?`,
      confirmText: '🗑️ ยืนยันลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await DataService.deleteMedicalDispenseLog(log.id);
      await loadLogs();
      if (editingLogId === log.id) setShowForm(false);
      if (triggerToast) triggerToast('ลบบันทึกเวชระเบียนเรียบร้อยแล้ว', 'info');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast(err?.message || 'ไม่สามารถลบบันทึกได้', 'error');
    }
  };

  if (!person || !summary) return null;

  return (
    <div className="rounded-2xl border-2 border-rose-500/40 bg-slate-950/90 p-4 space-y-3.5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-rose-300 flex items-center gap-1.5">
            <FileHeart className="h-4 w-4 text-rose-400" />
            <span>🩺 เวชระเบียน ปฐมพยาบาล & จ่ายยาของคนนี้ ({personLogs.length} ครั้ง)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            ตรวจสอบประวัติเจ็บป่วย การปฐมพยาบาล กินยาอะไรเมื่อไหร่ ใครกรอก ใครจ่าย หรือบันทึกเพิ่มเติมได้ทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {onOpenFullEmrPage && (
            <button
              type="button"
              onClick={() => onOpenFullEmrPage(summary.id || summary.userId)}
              className="px-2.5 py-1.5 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 text-sky-200 border border-sky-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>หน้าเวชระเบียนเต็ม</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadLogs}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="รีเฟรชเวชระเบียน"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openAddForm())}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow ${
              showForm
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white'
            }`}
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showForm ? 'ปิดฟอร์ม' : '+ บันทึกเวชระเบียน / จ่ายยา'}</span>
          </button>
        </div>
      </div>

      {/* Patient Medical Safety Warning */}
      {(summary.hasAlg || summary.hasMed || summary.requestedEquipment) && (
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-[11px] space-y-1">
          <div className="font-bold text-rose-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>ข้อมูลความปลอดภัยก่อนจ่ายยา / ปฐมพยาบาล:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-slate-200">
            {summary.hasAlg && <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-200">⚠️ แพ้: <strong>{summary.allergy}</strong></span>}
            {summary.hasMed && <span className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-rose-200">🩺 โรคประจำตัว: <strong>{summary.medical}</strong></span>}
            {summary.requestedEquipment && <span className="px-2 py-0.5 rounded bg-purple-950/70 border border-purple-500/40 text-purple-200">💡 ขออุปกรณ์/ยา: {summary.requestedEquipment}</span>}
          </div>
        </div>
      )}

      {statusFeedback && (
        <div className={`px-3 py-2 rounded-xl text-xs font-bold border ${statusFeedback.startsWith('✓') ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/50 border-rose-500/40 text-rose-300'}`}>
          {statusFeedback}
        </div>
      )}

      {/* Inline Add / Edit EMR Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-3.5 rounded-2xl bg-slate-900 border border-rose-500/40 space-y-3 text-xs">
          <div className="font-black text-white flex items-center justify-between border-b border-slate-800 pb-2">
            <span>{editingLogId ? '✏️ แก้ไขบันทึกเวชระเบียนนี้' : '🩺 บันทึกเวชระเบียน / ปฐมพยาบาล / จ่ายยาใหม่'}</span>
            {isDevOperator && <span className="text-[10px] text-amber-300 font-mono">DEV MODE</span>}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">1. เป็นอะไร / อาการ (Symptoms): <span className="text-rose-400">*</span></label>
            <div className="flex flex-wrap gap-1 pb-1">
              {PRESET_SYMPTOMS.slice(0, 6).map(sym => (
                <button key={sym} type="button" onClick={() => appendChip(setSymptoms, sym)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer">
                  + {sym.split(' / ')[0]}
                </button>
              ))}
            </div>
            <input type="text" required value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="เช่น หน้ามืด วิงเวียน / แผลถลอกเข่าขวา / มีไข้..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-rose-400 focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-200 block">2. เป็นเมื่อไหร่ / เหตุการณ์อย่างไร:</label>
              <input type="text" value={incidentDetail} onChange={e => setIncidentDetail(e.target.value)} placeholder="เช่น ลื่นล้มระหว่างฝึกฐาน 2 เวลา 10:30 น..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-rose-400 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-200 block">3. สัญญาณชีพ (BP / PR / T / SpO2):</label>
              <input type="text" value={vitalSigns} onChange={e => setVitalSigns(e.target.value)} placeholder="เช่น BP 115/75, PR 82, T 37.2°C, SpO2 99%" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-rose-400 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">4. วิธีการปฐมพยาบาล (First Aid):</label>
            <div className="flex flex-wrap gap-1 pb-1">
              {PRESET_FIRST_AID.slice(0, 6).map(act => (
                <button key={act} type="button" onClick={() => appendChip(setFirstAidAction, act)} className="px-2 py-0.5 rounded bg-pink-950/40 hover:bg-pink-900/60 text-[10px] text-pink-200 border border-pink-500/30 cursor-pointer">
                  + {act}
                </button>
              ))}
            </div>
            <input type="text" value={firstAidAction} onChange={e => setFirstAidAction(e.target.value)} placeholder="เช่น ล้างแผลด้วยน้ำเกลือ + เบตาดีน / นอนพักยกขาสูง..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-pink-400 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">5. กินยาอะไร / ยาที่จ่าย (Medicines):</label>
            <div className="flex flex-wrap gap-1 pb-1">
              {PRESET_MEDICINES.slice(0, 6).map(med => (
                <button key={med.name} type="button" onClick={() => handleSelectMedicine(med)} className="px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-[10px] text-emerald-200 border border-emerald-500/30 cursor-pointer">
                  + {med.name.split(' (')[0]}
                </button>
              ))}
            </div>
            <input type="text" value={medicines} onChange={e => setMedicines(e.target.value)} placeholder="เช่น พาราเซตามอล 500mg 2 เม็ด, เกลือแร่ ORS..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">6. กินเมื่อไหร่ / ขนาดและวิธีใช้ยา:</label>
            <input type="text" value={dosageInstruction} onChange={e => setDosageInstruction(e.target.value)} placeholder="เช่น กินเวลา 10:45 น. / ครั้งละ 1 เม็ด ทุก 4-6 ชม." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-200 block">7. ใครกรอกข้อมูล (Recorder): <span className="text-rose-400">*</span></label>
              <input type="text" required value={recorderName} onChange={e => setRecorderName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-sky-400 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-200 block">8. ใครจ่ายยา/ดูแล (Dispenser): <span className="text-rose-400">*</span></label>
              <input type="text" required value={dispenserName} onChange={e => setDispenserName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-purple-400 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-200 block">9. วันเวลา:</label>
              <input type="datetime-local" value={dispensedAt} onChange={e => setDispensedAt(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-rose-400 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">10. หมายเหตุ / การติดตามอาการ:</label>
            <input type="text" value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} placeholder="เช่น พัก 20 นาที อาการปกติ กลับเข้าฝึกต่อได้..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-rose-400 focus:outline-none" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">
              ยกเลิก
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'กำลังบันทึก...' : editingLogId ? 'บันทึกการแก้ไข' : 'บันทึกเวชระเบียน'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Individual EMR History Timeline */}
      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400">กำลังโหลดข้อมูลเวชระเบียน...</div>
      ) : personLogs.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800/80">
          ยังไม่มีประวัติเวชระเบียน / การปฐมพยาบาล / การจ่ายยาของคนนี้
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {personLogs.map((log, idx) => (
            <div key={log.id || idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/30 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                    #{personLogs.length - idx}
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.dispensed_at || log.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {log.vital_signs && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                      ❤️ {log.vital_signs}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => openEditForm(log)} className="px-2 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" />
                    <span>แก้ไข</span>
                  </button>
                  <button type="button" onClick={() => handleDelete(log)} className="px-2 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-400">🤒 อาการ:</span> <strong className="text-amber-200">{log.symptoms}</strong></div>
                {log.incident_detail && <div><span className="text-slate-400">📌 เหตุการณ์:</span> <span className="text-slate-200">{log.incident_detail}</span></div>}
                {log.first_aid_action && <div><span className="text-slate-400">🩹 ปฐมพยาบาล:</span> <strong className="text-pink-200">{log.first_aid_action}</strong></div>}
                <div><span className="text-slate-400">💊 ยา:</span> <strong className="text-emerald-300">{log.medicines_dispensed}</strong></div>
                {log.dosage_instruction && <div><span className="text-slate-400">⏰ กินเมื่อไหร่/วิธีใช้:</span> <span className="text-slate-300">{log.dosage_instruction}</span></div>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 text-[10px]">
                  <span className="text-sky-300">✍️ ผู้กรอก: <strong>{log.recorder_name || log.dispenser_name || '-'}</strong></span>
                  <span className="text-purple-300 inline-flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> ผู้จ่าย: <strong>{log.dispenser_name || '-'}</strong></span>
                </div>
                {log.medical_notes && <div className="text-slate-400 italic">📝 {log.medical_notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
