import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Loader2,
  MessageSquare,
  Phone,
  QrCode,
  Search,
  Send,
  ShieldAlert,
  Stethoscope,
  User,
  X
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import IDCardPreview from './IDCardPreview';
import { DataService } from '../supabase';
import { findRegistrationByIdCard, getRegistrationCardData } from '../utils/idCard';

function DetailItem({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950/70 p-3 ${className}`}>
      <span className="block text-[10px] font-semibold text-slate-500">{label}</span>
      <span className="mt-1 block whitespace-pre-line break-words text-xs font-bold text-white">{value || '-'}</span>
    </div>
  );
}

export default function AdminIDScannerModal({
  registrations = [],
  onClose,
  onRefreshRegistrations
}) {
  const [manualQuery, setManualQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [messageKind, setMessageKind] = useState('alert');
  const [messageText, setMessageText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const scannerRef = useRef(null);
  const qrRegionId = 'admin-jre-id-card-reader';

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 4500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!selectedRegistration) return;
    setInternalNote(selectedRegistration.admin_private_notes || '');
  }, [selectedRegistration]);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsScanning(false);
      return;
    }

    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch (error) {
      console.warn('Stopping JRE ID scanner failed:', error);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => () => {
    stopScanner();
  }, []);

  const selectFromLookup = (value) => {
    const found = findRegistrationByIdCard(registrations, value);
    if (!found) {
      setSelectedRegistration(null);
      setScanError(`ไม่พบข้อมูลบัตรหรือผู้สมัครที่ตรงกับ “${value}”`);
      return null;
    }

    setSelectedRegistration(found);
    setManualQuery('');
    setScanError('');
    setSuccessMessage('');
    return found;
  };

  const handleManualSearch = (event) => {
    event.preventDefault();
    if (!manualQuery.trim()) return;
    selectFromLookup(manualQuery.trim());
  };

  const startScanner = async () => {
    try {
      setScanError('');
      setSuccessMessage('');
      setIsScanning(true);
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode(qrRegionId);

      // Prefer the rear camera on phones. Falling back to facingMode keeps the
      // scanner usable on browsers that do not expose camera labels yet.
      let cameraConfig = { facingMode: 'environment' };
      try {
        const cameras = await Html5Qrcode.getCameras();
        const rearCamera = cameras.find(camera => /back|rear|environment|หลัง/i.test(camera.label || ''));
        if (rearCamera?.id) cameraConfig = rearCamera.id;
        else if (cameras[0]?.id) cameraConfig = cameras[0].id;
      } catch (cameraListError) {
        console.info('JRE camera list unavailable; using facingMode fallback:', cameraListError);
      }

      await scannerRef.current.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          selectFromLookup(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.warn('JRE ID scanner start failed:', error);
      await stopScanner();
      setIsScanning(false);
      const errorName = error?.name || '';
      const errorMessage = errorName === 'NotAllowedError'
        ? 'เบราว์เซอร์ไม่อนุญาตให้ใช้กล้อง กรุณากดไอคอนแม่กุญแจข้าง URL แล้วตั้งค่า Camera เป็น Allow จากนั้นรีเฟรชหน้าเว็บ'
        : errorName === 'NotFoundError'
          ? 'ไม่พบกล้องในอุปกรณ์นี้ กรุณาค้นหาด้วยรหัสบัตร/ชื่อ/Call sign แทน'
          : 'เปิดกล้องไม่สำเร็จ กรุณาอนุญาตสิทธิ์กล้องและใช้หน้าเว็บผ่าน HTTPS หรือ localhost แล้วลองใหม่';
      setScanError(errorMessage);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedRegistration || !messageText.trim() || isSendingMessage) return;

    const targetId = selectedRegistration.user_id || selectedRegistration.id;
    setIsSendingMessage(true);
    try {
      await DataService.sendAdminMessage(targetId, messageText.trim(), {
        title: messageKind === 'alert' ? 'แจ้งเตือนจาก Admin JRE 2027' : 'หมายเหตุจากทีม JRE 2027',
        message_type: messageKind,
        priority: messageKind === 'alert' ? 'high' : 'normal',
        sent_via: 'id_card_scanner'
      });

      const refreshed = onRefreshRegistrations ? await onRefreshRegistrations() : null;
      const updated = Array.isArray(refreshed)
        ? refreshed.find(r => (r.user_id || r.id) === targetId || r.id === selectedRegistration.id)
        : null;
      if (updated) setSelectedRegistration(updated);
      setMessageText('');
      setSuccessMessage(messageKind === 'alert' ? 'ส่งการแจ้งเตือนถึงผู้สมัครแล้ว' : 'บันทึกและส่งหมายเหตุถึงผู้สมัครแล้ว');
    } catch (error) {
      console.error('Admin ID card message error:', error);
      setScanError('ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSaveInternalNote = async (event) => {
    event.preventDefault();
    if (!selectedRegistration || isSavingNote) return;
    const targetId = selectedRegistration.user_id || selectedRegistration.id;
    setIsSavingNote(true);
    try {
      await DataService.updateRegistrationDetails(targetId, {
        admin_private_notes: internalNote.trim()
      });
      setSelectedRegistration(prev => prev ? { ...prev, admin_private_notes: internalNote.trim() } : prev);
      setSuccessMessage('บันทึกหมายเหตุภายใน Admin แล้ว');
      if (onRefreshRegistrations) await onRefreshRegistrations();
    } catch (error) {
      console.error('Admin ID card internal note error:', error);
      setScanError('บันทึกหมายเหตุภายในไม่สำเร็จ');
    } finally {
      setIsSavingNote(false);
    }
  };

  const cardData = selectedRegistration ? getRegistrationCardData(selectedRegistration) : null;
  const adminMessages = Array.isArray(selectedRegistration?.admin_messages) ? selectedRegistration.admin_messages : [];
  const requestedDocs = Array.isArray(selectedRegistration?.requested_docs) ? selectedRegistration.requested_docs : [];

  return (
    <ModalPortal isOpen={true} onClose={async () => { await stopScanner(); onClose?.(); }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 backdrop-blur-md sm:p-4"
        onClick={async () => { await stopScanner(); onClose?.(); }}
      >
        <div
          className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#0b1f3a] to-slate-900 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/15 text-orange-300">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white sm:text-base">Admin ID Card Scanner</h2>
                <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">สแกนบัตร JRE 2027 เพื่อดูประวัติและส่งข้อความเฉพาะบุคคล</p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => { await stopScanner(); onClose?.(); }}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              title="ปิดหน้าต่าง"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
              <section className="space-y-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
                  <form onSubmit={handleManualSearch} className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        value={manualQuery}
                        onChange={(event) => setManualQuery(event.target.value)}
                        placeholder="รหัสบัตร / ชื่อ / Call sign / เบอร์โทร"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-white outline-none transition-colors placeholder:text-slate-600 focus:border-orange-400"
                      />
                    </div>
                    <button type="submit" className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700">ค้นหา</button>
                  </form>
                  <button
                    type="button"
                    onClick={isScanning ? stopScanner : startScanner}
                    className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${isScanning ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20 hover:bg-orange-400'}`}
                  >
                    {isScanning ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    {isScanning ? 'ปิดกล้องสแกน' : 'เปิดกล้องสแกน Barcode / QR'}
                  </button>
                  <div id={qrRegionId} className={`mt-3 w-full overflow-hidden rounded-xl bg-black transition-all ${isScanning ? 'h-64 border border-orange-500/40' : 'h-0'}`} />
                </div>

                {scanError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{scanError}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {!selectedRegistration && (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-7 text-center">
                    <QrCode className="mx-auto h-10 w-10 text-slate-700" />
                    <p className="mt-3 text-sm font-bold text-slate-300">พร้อมค้นหาบัตรผู้เข้าร่วม</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">ข้อมูลผู้สมัครจะแสดงหลังจากสแกนสำเร็จหรือค้นหาด้วยรหัสบัตร</p>
                  </div>
                )}

                {selectedRegistration && cardData && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.06] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <User className="h-4 w-4 shrink-0 text-orange-400" />
                          <span className="truncate text-xs font-black text-white">{cardData.thaiName}</span>
                        </div>
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-300">MATCHED</span>
                      </div>
                      <p className="mt-1 text-[10px] font-mono text-orange-300">{cardData.cardCode}</p>
                    </div>
                    <IDCardPreview registration={selectedRegistration} compact={true} showActions={false} />
                  </div>
                )}
              </section>

              <section className="min-w-0">
                {selectedRegistration && cardData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <DetailItem label="สถานะใบสมัคร" value={selectedRegistration.status || 'confirmed'} />
                      <DetailItem label="กรุ๊ปเลือด" value={cardData.bloodGroup} className="border-rose-500/20" />
                      <DetailItem label="กลุ่มฝึก" value={selectedRegistration.group_assigned || 'รอจัดกลุ่ม'} className="border-indigo-500/20" />
                      <DetailItem label="ห้องพัก" value={selectedRegistration.room_assigned || 'รอจัดห้อง'} className="border-sky-500/20" />
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
                        <User className="h-4 w-4 text-orange-400" />
                        <h3 className="text-sm font-black text-white">ประวัติส่วนตัว / Identity</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <DetailItem label="ชื่อภาษาไทย" value={cardData.thaiName} />
                        <DetailItem label="ชื่อภาษาอังกฤษ" value={cardData.englishName} />
                        <DetailItem label="คำนำหน้า / Prefix" value={cardData.prefix} />
                        <DetailItem label="ชื่อเล่น / Nickname" value={cardData.nickname} />
                        <DetailItem label="Call sign" value={cardData.callsign} />
                        <DetailItem label="หน่วย / Unit" value={cardData.unit} />
                        <DetailItem label="สังกัด / Affiliation" value={cardData.affiliation} className="sm:col-span-2" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Phone className="h-4 w-4 text-sky-400" />
                        <h3 className="text-sm font-black text-white">การติดต่อและการเข้าร่วม / Operations</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <DetailItem label="โทรศัพท์" value={selectedRegistration.phone} />
                        <DetailItem label="อีเมล" value={selectedRegistration.user_email} />
                        <DetailItem label="ผู้ติดต่อฉุกเฉิน" value={selectedRegistration.emergency_name} />
                        <DetailItem label="เบอร์ฉุกเฉิน" value={selectedRegistration.emergency_phone} />
                        <DetailItem label="วันที่สมัคร" value={selectedRegistration.created_at ? new Date(selectedRegistration.created_at).toLocaleString('th-TH') : '-'} />
                        <DetailItem label="เอกสารที่ร้องขอ" value={`${requestedDocs.length} รายการ`} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-rose-500/20 bg-rose-950/[0.12] p-4">
                      <div className="mb-3 flex items-center gap-2 border-b border-rose-500/20 pb-3">
                        <HeartPulse className="h-4 w-4 text-rose-400" />
                        <h3 className="text-sm font-black text-white">สุขภาพและความปลอดภัย / Safety</h3>
                        {selectedRegistration.is_special_care && <span className="ml-auto rounded-full bg-rose-500/20 px-2 py-1 text-[9px] font-black text-rose-300">⭐ SPECIAL CARE</span>}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <DetailItem label="โรคประจำตัว / ข้อจำกัด" value={selectedRegistration.medical_history || 'ไม่มีข้อมูล'} />
                        <DetailItem label="แพ้อาหาร / แพ้ยา" value={selectedRegistration.food_allergy || 'ไม่มีข้อมูล'} />
                        <DetailItem label="ประวัติการฝึกอบรม" value={selectedRegistration.previous_training || 'ไม่มีข้อมูล'} className="sm:col-span-2" />
                        <DetailItem label="หมายเหตุที่เกี่ยวข้องกับการดูแล" value={selectedRegistration.special_notes || 'ไม่มีหมายเหตุ'} className="sm:col-span-2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <form onSubmit={handleSendMessage} className="rounded-2xl border border-amber-500/30 bg-amber-950/[0.14] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          {messageKind === 'alert' ? <Bell className="h-4 w-4 text-amber-400" /> : <MessageSquare className="h-4 w-4 text-sky-400" />}
                          <h3 className="text-sm font-black text-white">ส่งแจ้งเตือน / หมายเหตุ</h3>
                        </div>
                        <div className="mb-2 flex gap-1.5 rounded-xl bg-slate-950 p-1">
                          <button type="button" onClick={() => setMessageKind('alert')} className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${messageKind === 'alert' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>แจ้งเตือนผู้สมัคร</button>
                          <button type="button" onClick={() => setMessageKind('note')} className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${messageKind === 'note' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>หมายเหตุถึงผู้สมัคร</button>
                        </div>
                        <textarea
                          rows={4}
                          value={messageText}
                          onChange={(event) => setMessageText(event.target.value)}
                          placeholder={messageKind === 'alert' ? 'เช่น กรุณาพกยาประจำตัวในวันฝึก...' : 'เขียนข้อความหรือหมายเหตุถึงผู้สมัคร...'}
                          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-400"
                        />
                        <button type="submit" disabled={!messageText.trim() || isSendingMessage} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                          {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          ส่งข้อความและบันทึกประวัติ
                        </button>
                        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">ผู้สมัครจะเห็นข้อความนี้ในกล่องแจ้งเตือนของตนเอง</p>
                      </form>

                      <form onSubmit={handleSaveInternalNote} className="rounded-2xl border border-purple-500/30 bg-purple-950/[0.14] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-purple-300" />
                          <h3 className="text-sm font-black text-white">หมายเหตุภายใน Admin</h3>
                        </div>
                        <textarea
                          rows={4}
                          value={internalNote}
                          onChange={(event) => setInternalNote(event.target.value)}
                          placeholder="บันทึกสำหรับทีมประสานงาน/ทีมแพทย์ ไม่ส่งเป็นแจ้งเตือน"
                          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
                        />
                        <button type="submit" disabled={isSavingNote} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/20 px-4 py-2.5 text-xs font-black text-purple-100 transition-colors hover:bg-purple-500/30 disabled:opacity-50">
                          {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                          บันทึกหมายเหตุภายใน
                        </button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <h3 className="text-sm font-black text-white">ประวัติข้อความ ({adminMessages.length})</h3>
                        </div>
                        <span className="text-[10px] text-slate-500">ส่งจาก Admin ID Scanner</span>
                      </div>
                      {adminMessages.length > 0 ? (
                        <div className="space-y-2">
                          {adminMessages.slice(0, 6).map((message, index) => (
                            <div key={message.id || index} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                                <span className={message.message_type === 'alert' ? 'font-bold text-amber-300' : 'font-bold text-sky-300'}>{message.title || (message.message_type === 'alert' ? 'แจ้งเตือน' : 'หมายเหตุ')}</span>
                                <span>{message.created_at ? new Date(message.created_at).toLocaleString('th-TH') : '-'}</span>
                              </div>
                              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-200">{message.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-500">ยังไม่มีข้อความที่ส่งถึงผู้สมัคร</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center">
                    <div>
                      <Stethoscope className="mx-auto h-9 w-9 text-slate-700" />
                      <p className="mt-3 text-sm font-bold text-slate-400">รายละเอียดจะแสดงเมื่อพบบัตร</p>
                      <p className="mt-1 text-[11px] text-slate-600">ระบบจำกัดการดูข้อมูลละเอียดไว้ในหน้าผู้ดูแลระบบ</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
