import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  Search,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertCircle,
  User,
  Phone,
  Tag,
  QrCode,
  ShieldCheck,
  Eye,
  RefreshCw,
  Loader2,
  Flashlight,
  Upload,
  Printer,
  ChevronRight,
  MessageSquare,
  FileText,
  Send,
  HeartPulse,
  Layers,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import IDCardPreview from './IDCardPreview';
import DocumentPreviewModal from './DocumentPreviewModal';
import { DataService } from '../supabase';
import { findRegistrationByIdCard, getRegistrationCardData, getIdCardCode } from '../utils/idCard';

/**
 * Web Audio API synthesizer for crisp scan confirmation chime
 */
function playAudioChime(success = true) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (err) {
    // Ignore autoplay restriction errors
  }
}

/**
 * Trigger device haptic vibration if supported
 */
function triggerHaptic(success = true) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (success) {
        navigator.vibrate([60, 40, 60]);
      } else {
        navigator.vibrate([150, 60, 150]);
      }
    }
  } catch (e) {
    // ignore
  }
}

const normalizeDigits = (val) => String(val || '').replace(/\D/g, '');
const cleanStr = (val) => String(val || '').trim();

export default function UniversalScannerModal({
  orders = [],
  registrations = [],
  onClose,
  onMarkOrderReceived,
  onMarkRegistrationShirtReceived,
  onVerifyPayment,
  onRefreshRegistrations,
  onUpdateAllocation
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [previewSlip, setPreviewSlip] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Match result: { participant: regObj, order: orderObj, linkedOrders: [], linkedReg: null }
  const [matchResult, setMatchResult] = useState(null);
  const [multipleMatches, setMultipleMatches] = useState([]);
  const [selectedResultType, setSelectedResultType] = useState('participant'); // 'participant' | 'order'

  // ID Card preview modal state
  const [previewingIdCard, setPreviewingIdCard] = useState(false);

  // Notification & Admin Note state for trainee
  const [internalNote, setInternalNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageKind, setMessageKind] = useState('alert');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);

  // Camera settings
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [recentScans, setRecentScans] = useState([]);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrRegionId = 'universal-qr-reader-region';

  // Synchronize internal note when matched participant changes
  useEffect(() => {
    if (matchResult?.participant) {
      setInternalNote(matchResult.participant.admin_private_notes || '');
      setShowMessageForm(false);
      setMessageText('');
    }
  }, [matchResult?.participant]);

  // Auto-dismiss feedback banners
  useEffect(() => {
    if (!actionSuccessMsg) return;
    const timer = setTimeout(() => setActionSuccessMsg(''), 4500);
    return () => clearTimeout(timer);
  }, [actionSuccessMsg]);

  useEffect(() => {
    if (!scanError) return;
    const timer = setTimeout(() => setScanError(''), 7000);
    return () => clearTimeout(timer);
  }, [scanError]);

  /**
   * Universal Match Resolver
   * Intelligently classifies payloads into participant and/or merchandise order
   */
  const resolveMatch = (rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') return null;
    const raw = cleanStr(rawInput);
    if (!raw) return null;

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // not JSON
    }

    const regList = Array.isArray(registrations) ? registrations : [];
    const orderList = Array.isArray(orders) ? orders : [];

    let matchedParticipant = null;
    let matchedOrder = null;

    // 1. JSON Payload Evaluation
    if (parsed && typeof parsed === 'object') {
      // A) Participant ID Card JSON
      if (parsed.type === 'JRE27_ID_CARD' || parsed.card_code || parsed.record_id) {
        matchedParticipant = findRegistrationByIdCard(regList, raw);
        if (!matchedParticipant) {
          const recId = cleanStr(parsed.record_id || parsed.id || parsed.user_id).toLowerCase();
          const cCode = cleanStr(parsed.card_code || parsed.card || parsed.code).toLowerCase();
          matchedParticipant = regList.find(r => {
            const rId = cleanStr(r.id || r.user_id || r.user_email).toLowerCase();
            const rCode = getIdCardCode(r).toLowerCase();
            return (recId && rId === recId) || (cCode && rCode === cCode);
          });
        }
      }

      // B) Merchandise Digital Pickup Pass JSON
      if (parsed.app === 'JRE2027_MERCHANDISE' || parsed.order_number) {
        const orderNum = cleanStr(parsed.order_number).toLowerCase();
        matchedOrder = orderList.find(o => cleanStr(o.order_number).toLowerCase() === orderNum);
      }

      // C) Generic ID / user_id in JSON
      if (!matchedParticipant && !matchedOrder && (parsed.id || parsed.user_id)) {
        const genId = cleanStr(parsed.id || parsed.user_id).toLowerCase();
        matchedParticipant = regList.find(r => cleanStr(r.id || r.user_id).toLowerCase() === genId);
        matchedOrder = orderList.find(o => cleanStr(o.id || o.user_id || o.order_number).toLowerCase() === genId);
      }
    }

    // 2. Raw Text / String Evaluation
    const qLower = raw.toLowerCase();
    const qDigits = normalizeDigits(raw);

    // Try finding in registrations
    if (!matchedParticipant) {
      // Check using specialized idCard helper first
      matchedParticipant = findRegistrationByIdCard(regList, raw);

      // Deep string search across participant fields
      if (!matchedParticipant) {
        matchedParticipant = regList.find(r => {
          const rId = cleanStr(r.id).toLowerCase();
          const rUserId = cleanStr(r.user_id).toLowerCase();
          const rEmail = cleanStr(r.user_email).toLowerCase();
          const rCard = getIdCardCode(r).toLowerCase();
          const rPhone = normalizeDigits(r.phone);
          const rShirtOrder = `jre27-shirt-${cleanStr(r.id || r.user_id).slice(0, 6)}`.toLowerCase();

          if (rCard === qLower || rCard.includes(qLower)) return true;
          if (rId === qLower || rUserId === qLower || rShirtOrder === qLower) return true;
          if (qDigits && qDigits.length >= 8 && rPhone && rPhone.includes(qDigits)) return true;

          const textFields = [
            r.first_name,
            r.last_name,
            r.first_name_th,
            r.last_name_th,
            r.first_name_en,
            r.last_name_en,
            r.nickname,
            r.nickname_th,
            r.nickname_en,
            r.callsign,
            r.call_sign,
            r.unit,
            r.unit_name,
            r.institution,
            r.affiliation,
            r.full_name_affiliation
          ].map(f => cleanStr(f).toLowerCase());

          return textFields.some(f => f && f.includes(qLower));
        });
      }
    }

    // Try finding in merchandise orders
    if (!matchedOrder) {
      matchedOrder = orderList.find(o => {
        const oNum = cleanStr(o.order_number).toLowerCase();
        const oId = cleanStr(o.id).toLowerCase();
        const oPhone = normalizeDigits(o.customer_phone);
        const oName = cleanStr(o.customer_name).toLowerCase();
        const oEmail = cleanStr(o.user_email).toLowerCase();

        if (oNum === qLower || oNum.includes(qLower)) return true;
        if (oId === qLower) return true;
        if (qDigits && qDigits.length >= 8 && oPhone && oPhone.includes(qDigits)) return true;
        if (oName && oName.includes(qLower)) return true;
        if (oEmail && oEmail.includes(qLower)) return true;
        return false;
      });
    }

    // 3. Multi-matches check for search query (if query has >= 2 characters)
    let candidateMatches = [];
    if (raw.length >= 2) {
      const pMatches = regList.filter(r => {
        const text = [
          r.first_name, r.last_name, r.first_name_th, r.last_name_th,
          r.nickname, r.nickname_th, r.nickname_en, r.callsign, r.phone
        ].map(cleanStr).join(' ').toLowerCase();
        return text.includes(qLower);
      }).map(r => ({ type: 'participant', item: r }));

      const oMatches = orderList.filter(o => {
        const text = [o.order_number, o.customer_name, o.customer_phone].map(cleanStr).join(' ').toLowerCase();
        return text.includes(qLower);
      }).map(o => ({ type: 'order', item: o }));

      candidateMatches = [...pMatches, ...oMatches];
    }

    // Cross-link orders for participant
    let linkedOrders = [];
    if (matchedParticipant) {
      const pUserId = cleanStr(matchedParticipant.user_id || matchedParticipant.id);
      const pPhone = normalizeDigits(matchedParticipant.phone);
      linkedOrders = orderList.filter(o => {
        const oUserId = cleanStr(o.user_id);
        const oPhone = normalizeDigits(o.customer_phone);
        return (pUserId && oUserId && pUserId === oUserId) || (pPhone && oPhone && pPhone === oPhone);
      });
    }

    // Cross-link participant for order
    let linkedParticipant = null;
    if (matchedOrder && !matchedParticipant) {
      const oUserId = cleanStr(matchedOrder.user_id);
      const oPhone = normalizeDigits(matchedOrder.customer_phone);
      linkedParticipant = regList.find(r => {
        const rUserId = cleanStr(r.user_id || r.id);
        const rPhone = normalizeDigits(r.phone);
        return (oUserId && rUserId && oUserId === rUserId) || (oPhone && rPhone && oPhone === rPhone);
      });
    }

    return {
      participant: matchedParticipant,
      order: matchedOrder,
      linkedOrders,
      linkedParticipant,
      candidateMatches: candidateMatches.length > 1 ? candidateMatches : []
    };
  };

  /**
   * Handle decoded string from Camera, File, or Manual input
   */
  const handleDecodedPayload = async (decodedText) => {
    const raw = cleanStr(decodedText);
    if (!raw) return;

    const result = resolveMatch(raw);

    if (result && (result.participant || result.order || result.candidateMatches.length > 0)) {
      playAudioChime(true);
      triggerHaptic(true);

      setMatchResult(result);
      setMultipleMatches(result.candidateMatches);
      setScanError('');

      // Auto-select tab
      if (result.participant) {
        setSelectedResultType('participant');
      } else if (result.order) {
        setSelectedResultType('order');
      }

      // Add to recent scans strip
      const label = result.participant
        ? `${result.participant.first_name_th || result.participant.first_name || 'ผู้สมัคร'} (${result.participant.callsign || 'JRE27'})`
        : `ออเดอร์: ${result.order?.order_number || raw}`;

      setRecentScans(prev => [
        {
          id: Date.now(),
          text: label,
          type: result.participant ? 'participant' : 'order',
          time: new Date().toLocaleTimeString('th-TH')
        },
        ...prev.slice(0, 4)
      ]);

      // Pause live camera to save resources and freeze view
      stopScanner();
    } else {
      playAudioChime(false);
      triggerHaptic(false);
      setScanError(`ไม่พบข้อมูลในระบบ: “${raw}” (กรุณาตรวจสอบว่าผู้ใช้ได้ลงทะเบียนหรือมีรหัสคำสั่งซื้อจริง)`);
    }
  };

  /**
   * Initialize Camera Scanner
   */
  const startScanner = async (cameraId = null) => {
    try {
      setScanError('');
      setIsScanning(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      // Get available cameras
      let currentId = cameraId || selectedCameraId;
      try {
        const cameras = await Html5Qrcode.getCameras();
        setCameraDevices(cameras);
        if (!currentId && cameras.length > 0) {
          // Prefer back/environment camera
          const rearCam = cameras.find(c => /back|rear|environment|หลัง/i.test(c.label || ''));
          currentId = rearCam ? rearCam.id : cameras[0].id;
          setSelectedCameraId(currentId);
        }
      } catch (camErr) {
        console.warn('Camera device listing error, fallback to facingMode:', camErr);
      }

      const cameraConfig = currentId ? { deviceId: { exact: currentId } } : { facingMode: 'environment' };

      // Dynamic adaptive qrbox calculation
      const dynamicQrbox = (viewfinderWidth, viewfinderHeight) => {
        const edge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(220, Math.min(Math.floor(edge * 0.76), 380));
        return { width: size, height: size };
      };

      await scannerRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: dynamicQrbox,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        (decodedText) => {
          handleDecodedPayload(decodedText);
        },
        (frameError) => {
          // Silent frame scanning
        }
      );

      // Check torch support
      try {
        const track = scannerRef.current.getRunningTrackCameraCapabilities?.();
        setHasTorch(Boolean(track?.torchFeature?.()?.isSupported?.()));
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err) {
      console.warn('Universal scanner start error:', err);
      setIsScanning(false);
      setScanError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตสิทธิ์เข้าถึงกล้องในเบราว์เซอร์ หรือใช้วิธีอัปโหลดรูปภาพ / พิมพ์ค้นหา');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Flip / switch camera
  const handleSwitchCamera = async () => {
    if (cameraDevices.length <= 1) return;
    const currentIndex = cameraDevices.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextCamera = cameraDevices[nextIndex];
    setSelectedCameraId(nextCamera.id);

    await stopScanner();
    await startScanner(nextCamera.id);
  };

  // Toggle flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchEnabled(nextTorch);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // Handle image file upload scan
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsActionLoading(true);
      setScanError('');
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      // If scanner is actively scanning from camera, stop first
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }

      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText) {
        handleDecodedPayload(decodedText);
      } else {
        setScanError('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาตรวจสอบว่ารูปภาพมีความคมชัดและมี QR Code อยู่ในภาพ');
      }
    } catch (err) {
      console.warn('Scan file error:', err);
      setScanError('ไม่สามารถอ่าน QR Code จากรูปนี้ได้ กรุณาลองใช้รูปที่มีความสว่างและชัดเจนขึ้น');
    } finally {
      setIsActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Start scanner on mount
  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  // Handle Manual Search
  const handleManualSearchSubmit = (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    handleDecodedPayload(manualQuery.trim());
  };

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  // 1. Mark Trainee Training Shirt Received
  const handleToggleTraineeShirt = async (participant) => {
    if (!participant || isActionLoading) return;
    const userId = participant.user_id || participant.id;
    const currentlyReceived = participant.shirt_pickup_status === 'received' || participant.shirt_received === true;
    const nextReceived = !currentlyReceived;

    setIsActionLoading(true);
    try {
      if (onMarkRegistrationShirtReceived) {
        await onMarkRegistrationShirtReceived(userId, nextReceived);
      } else if (onUpdateAllocation) {
        await onUpdateAllocation(userId, {
          shirt_pickup_status: nextReceived ? 'received' : 'pending',
          shirt_received: nextReceived,
          shirt_received_date: nextReceived ? new Date().toISOString() : null
        });
      }

      // Optimistically update local participant object
      const updatedParticipant = {
        ...participant,
        shirt_pickup_status: nextReceived ? 'received' : 'pending',
        shirt_received: nextReceived,
        shirt_received_date: nextReceived ? new Date().toISOString() : null
      };

      setMatchResult(prev => prev ? { ...prev, participant: updatedParticipant } : prev);
      playAudioChime(true);
      triggerHaptic(true);
      setActionSuccessMsg(
        nextReceived
          ? `✓ บันทึกเช็คชื่อรับเสื้อฝึกโครงการ ({size: ${participant.shirt_size || 'L'}}) สำเร็จแล้ว!`
          : 'ยกเลิกสถานะรับเสื้อฝึกเรียบร้อยแล้ว'
      );
    } catch (err) {
      console.error('Toggle shirt received error:', err);
      setScanError('บันทึกสถานะเสื้อฝึกไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Mark Merchandise Order Received
  const handleToggleOrderReceived = async (order) => {
    if (!order || isActionLoading) return;
    const currentlyReceived = order.pickup_status === 'received';
    const nextReceived = !currentlyReceived;

    setIsActionLoading(true);
    try {
      if (onMarkOrderReceived) {
        await onMarkOrderReceived(order.id, nextReceived);
      }

      const updatedOrder = {
        ...order,
        pickup_status: nextReceived ? 'received' : 'pending',
        pickup_at: nextReceived ? new Date().toISOString() : null
      };

      setMatchResult(prev => prev ? { ...prev, order: updatedOrder } : prev);
      playAudioChime(true);
      triggerHaptic(true);
      setActionSuccessMsg(
        nextReceived
          ? `✓ บันทึกการส่งมอบสินค้า (${order.order_number}) เรียบร้อยแล้ว!`
          : `ยกเลิกสถานะส่งมอบสินค้า (${order.order_number}) เรียบร้อยแล้ว`
      );
    } catch (err) {
      console.error('Toggle order received error:', err);
      setScanError('บันทึกสถานะคำสั่งซื้อไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Verify Merchandise Order Payment
  const handleVerifyOrderPayment = async (order) => {
    if (!order || isActionLoading) return;
    setIsActionLoading(true);
    try {
      if (onVerifyPayment) {
        await onVerifyPayment(order.id);
      }
      const updatedOrder = { ...order, payment_status: 'paid_verified' };
      setMatchResult(prev => prev ? { ...prev, order: updatedOrder } : prev);
      playAudioChime(true);
      setActionSuccessMsg(`✓ ยืนยันยอดเงินคำสั่งซื้อ (${order.order_number}) สำเร็จแล้ว!`);
    } catch (err) {
      console.error('Verify payment error:', err);
      setScanError('ยืนยันยอดเงินไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Save Private Admin Note for Trainee
  const handleSaveInternalNote = async () => {
    if (!matchResult?.participant || isSavingNote) return;
    setIsSavingNote(true);
    try {
      const regId = matchResult.participant.id || matchResult.participant.user_id;
      await DataService.updateRegistration(regId, {
        admin_private_notes: internalNote.trim()
      });
      matchResult.participant.admin_private_notes = internalNote.trim();
      setActionSuccessMsg('✓ บันทึกโน้ตภายในสำหรับผู้ดูแลระบบเรียบร้อยแล้ว');
      if (onRefreshRegistrations) onRefreshRegistrations();
    } catch (err) {
      console.error('Save internal note error:', err);
      setScanError('บันทึกโน้ตไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  // 5. Send In-App Notification to Trainee
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!matchResult?.participant || !messageText.trim() || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      const targetUserId = matchResult.participant.user_id || matchResult.participant.id;
      await DataService.createNotification({
        user_id: targetUserId,
        title: messageKind === 'alert' ? 'แจ้งเตือนด่วนจากกองอำนวยการ JRE 2027' : 'ข้อความจากเจ้าหน้าที่ JRE 2027',
        message: messageText.trim(),
        type: messageKind,
        created_at: new Date().toISOString()
      });
      setMessageText('');
      setShowMessageForm(false);
      setActionSuccessMsg('✓ ส่งข้อความแจ้งเตือนถึงผู้สมัครเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Send notification error:', err);
      setScanError('ส่งข้อความไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Reset and resume scanning for next person in queue
  const handleScanNext = () => {
    setMatchResult(null);
    setMultipleMatches([]);
    setScanError('');
    setActionSuccessMsg('');
    setManualQuery('');
    setPreviewingIdCard(false);
    startScanner();
  };

  // Derived card presentation data
  const participantCardData = useMemo(() => {
    if (!matchResult?.participant) return null;
    return getRegistrationCardData(matchResult.participant);
  }, [matchResult?.participant]);

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 backdrop-blur-md sm:p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative my-auto flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/40 bg-orange-500/20 text-orange-400">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white sm:text-base">
                    ระบบสแกน QR อัจฉริยะ (Universal Scanner)
                  </h2>
                  <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                    จุดเดียวสแกนได้ทุกอย่าง
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ตรวจบัตรประจำตัว ID • เช็คชื่อรับเสื้อฝึก • ส่งมอบสินค้า & ออเดอร์
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="ปิดหน้าต่างสแกน"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* TOP CONTROLS: Camera / Manual Search / File Upload Tabs */}
          <div className="shrink-0 border-b border-slate-800/80 bg-slate-950/60 px-4 py-2.5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Mode toggles */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    if (!matchResult && !isScanning) startScanner();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === 'camera'
                      ? 'bg-orange-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  เปิดกล้องสแกน
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === 'manual'
                      ? 'bg-orange-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  ค้นหาด้วยข้อความ/รหัส
                </button>
              </div>

              {/* Action utilities: Flashlight, Switch Camera, Upload Photo */}
              <div className="flex items-center gap-1.5">
                {activeTab === 'camera' && (
                  <>
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                          torchEnabled
                            ? 'border-amber-400/80 bg-amber-500/20 text-amber-300'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="เปิด/ปิด ไฟฉาย"
                      >
                        <Flashlight className="h-3.5 w-3.5 inline mr-1" />
                        {torchEnabled ? 'เปิดไฟอยู่' : 'ไฟฉาย'}
                      </button>
                    )}

                    {cameraDevices.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
                        title="สลับกล้องหน้า / หลัง"
                      >
                        <RefreshCw className="h-3.5 w-3.5 inline mr-1" />
                        สลับกล้อง
                      </button>
                    )}
                  </>
                )}

                {/* Upload Image Fallback */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-xs font-bold text-sky-300 transition-all hover:bg-sky-500/20"
                  title="เลือกไฟล์ภาพ QR Code จากเครื่อง"
                >
                  <Upload className="h-3.5 w-3.5 inline mr-1" />
                  อัปโหลดภาพ QR
                </button>
              </div>
            </div>

            {/* Quick Search Bar always accessible */}
            <form onSubmit={handleManualSearchSubmit} className="mt-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหา: ชื่อ-สกุล, นามเรียกขาน, ชื่อเล่น, เบอร์โทร, JRE27-ID, เลขที่ออเดอร์..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                {manualQuery && (
                  <button
                    type="button"
                    onClick={() => setManualQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-orange-400 active:scale-95"
              >
                ค้นหาทันที
              </button>
            </form>
          </div>

          {/* NOTIFICATION FEEDBACK BANNERS */}
          {actionSuccessMsg && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/70 p-3 text-xs font-semibold text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {scanError && (
            <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/70 p-3 text-xs text-rose-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{scanError}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanError('')}
                className="text-rose-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* MAIN SCROLLABLE CONTENT AREA */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 space-y-4">
            {/* 1. CAMERA VIEWFINDER (Shown when in camera mode and no match has paused it, or toggled) */}
            {activeTab === 'camera' && !matchResult && (
              <div className="space-y-2">
                <div className="relative mx-auto max-w-sm aspect-square overflow-hidden rounded-2xl border-2 border-orange-500/40 bg-black shadow-inner">
                  <div id={qrRegionId} className="h-full w-full" />
                  
                  {/* Viewfinder Target Graphic Overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-64 w-64 rounded-2xl border-2 border-dashed border-orange-400/60">
                      <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-orange-400" />
                      <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-orange-400" />
                      <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-orange-400" />
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-orange-400" />
                      
                      {/* Scanning laser animation */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse" style={{ top: '50%' }} />
                    </div>
                  </div>

                  {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4 text-center">
                      <Camera className="h-8 w-8 text-orange-400 mb-2" />
                      <p className="text-xs font-bold text-white">กล้องพักการทำงานชั่วคราว</p>
                      <button
                        type="button"
                        onClick={() => startScanner()}
                        className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-slate-950"
                      >
                        เปิดกล้องอีกครั้ง
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-center text-[11px] text-slate-400">
                  ส่องกล้องไปที่ QR Code บนบัตรประจำตัว ID หรือบัตรรับเสื้อ/สินค้า ระบบจะอ่านและดึงข้อมูลอัตโนมัติ
                </p>
              </div>
            )}

            {/* 2. CANDIDATE SELECTION LIST (If query returned multiple items) */}
            {multipleMatches.length > 1 && !matchResult && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 space-y-3">
                <p className="text-xs font-bold text-orange-300">
                  พบข้อมูลที่ตรงกับคำค้นหา {multipleMatches.length} รายการ (แตะเพื่อเลือกดูข้อมูล):
                </p>
                <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                  {multipleMatches.map((match, idx) => {
                    const isParticipant = match.type === 'participant';
                    const item = match.item;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isParticipant) {
                            setMatchResult({
                              participant: item,
                              order: null,
                              linkedOrders: orders.filter(o => o.user_id === item.user_id),
                              candidateMatches: []
                            });
                            setSelectedResultType('participant');
                          } else {
                            setMatchResult({
                              participant: null,
                              order: item,
                              linkedOrders: [],
                              linkedParticipant: registrations.find(r => r.user_id === item.user_id),
                              candidateMatches: []
                            });
                            setSelectedResultType('order');
                          }
                          setMultipleMatches([]);
                        }}
                        className="w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-slate-800/60 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isParticipant ? 'bg-orange-500/20 text-orange-300' : 'bg-purple-500/20 text-purple-300'}`}>
                            {isParticipant ? 'ผู้เข้าอบรม' : 'คำสั่งซื้อ'}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">
                              {isParticipant ? (item.full_name_affiliation || `${item.first_name || ''} ${item.last_name || ''}`) : item.order_number}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {isParticipant ? `นามเรียกขาน: ${item.callsign || '-'} • เบอร์: ${item.phone || '-'}` : `ผู้รับ: ${item.customer_name || '-'} • ยอด ${item.total_amount || 0} บ.`}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SCANNED RESULT PRESENTATION CARD */}
            {matchResult && (
              <div className="space-y-4">
                {/* Result header bar with fast 'Scan Next' button */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-300">
                      ตรวจพบข้อมูลในระบบเรียบร้อย
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If both participant and order match, allow switching tabs */}
                    {matchResult.participant && matchResult.order && (
                      <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedResultType('participant')}
                          className={`px-2.5 py-1 rounded-md font-bold ${selectedResultType === 'participant' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'}`}
                        >
                          ข้อมูลบัตร ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedResultType('order')}
                          className={`px-2.5 py-1 rounded-md font-bold ${selectedResultType === 'order' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'}`}
                        >
                          คำสั่งซื้อสินค้า
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleScanNext}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-md transition-transform hover:bg-orange-400 active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      สแกนคนต่อไป (Scan Next)
                    </button>
                  </div>
                </div>

                {/* 3A. PARTICIPANT VIEW */}
                {selectedResultType === 'participant' && matchResult.participant && (
                  <div className="space-y-4">
                    {/* Participant Profile Banner */}
                    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-orange-950/20 p-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Photo */}
                        <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl border-2 border-orange-400/60 bg-slate-950 shadow-md">
                          <img
                            src={participantCardData?.photo || '/images/logo/jre_logo_square.png'}
                            alt={participantCardData?.thaiName || 'รูปผู้สมัคร'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/images/logo/jre_logo_square.png';
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-0.5 text-center text-[7px] font-black text-orange-300">
                            PARTICIPANT
                          </div>
                        </div>

                        {/* Name & Call Sign */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[10px] font-mono font-black text-orange-300">
                              {participantCardData?.cardCode || 'JRE27-ID'}
                            </span>
                            <span className="rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-200">
                              📡 {participantCardData?.callsign || '-'}
                            </span>
                            <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                              ชื่อเล่น: {participantCardData?.nickname || '-'}
                            </span>
                            <span className="rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[10px] font-black text-rose-300">
                              กรุ๊ปเลือด: {participantCardData?.bloodGroup || '-'}
                            </span>
                          </div>

                          <h3 className="mt-1.5 text-lg font-black text-white leading-snug">
                            {participantCardData?.thaiName}
                          </h3>
                          <p className="text-xs text-orange-300/90 font-medium">
                            {participantCardData?.englishName}
                          </p>

                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">หน่วย / สังกัด</span>
                              <span className="font-bold text-slate-200 truncate block">
                                {participantCardData?.unit || '-'} ({participantCardData?.affiliation || '-'})
                              </span>
                            </div>
                            <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">ห้องพัก & กลุ่มฝึก</span>
                              <span className="font-bold text-slate-200 block">
                                {matchResult.participant.room_assigned || 'ยังไม่จัดห้อง'} • กลุ่ม: {matchResult.participant.group_assigned || 'ยังไม่จัด'}
                              </span>
                            </div>
                            <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800 col-span-2 sm:col-span-1">
                              <span className="text-[10px] text-slate-400 block">เบอร์ติดต่อ</span>
                              <a
                                href={`tel:${matchResult.participant.phone}`}
                                className="font-bold text-orange-400 hover:underline block"
                              >
                                {matchResult.participant.phone || '-'}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Medical alert banner if has health conditions */}
                      {(matchResult.participant.chronic_disease ||
                        matchResult.participant.drug_allergy ||
                        matchResult.participant.food_allergy ||
                        matchResult.participant.special_care_note) && (
                        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-200 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-400">
                            <HeartPulse className="h-4 w-4" />
                            <span>ข้อมูลสุขภาพและการดูแลพิเศษ (Medical & Special Alert)</span>
                          </div>
                          {matchResult.participant.chronic_disease && (
                            <p className="text-[11px]">🏥 โรคประจำตัว: {matchResult.participant.chronic_disease}</p>
                          )}
                          {matchResult.participant.drug_allergy && (
                            <p className="text-[11px]">💊 แพ้ยา: {matchResult.participant.drug_allergy}</p>
                          )}
                          {matchResult.participant.food_allergy && (
                            <p className="text-[11px]">🍽️ แพ้อาหาร: {matchResult.participant.food_allergy}</p>
                          )}
                          {matchResult.participant.special_care_note && (
                            <p className="text-[11px]">⚠️ ข้อควรระวัง: {matchResult.participant.special_care_note}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 1-CLICK ACTION 1: TRAINING SHIRT PICKUP (เช็คชื่อรับเสื้อฝึกโครงการ) */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">
                              เสื้อฝึก Joint Response Exercise (JRE 2027)
                            </h4>
                            <span className="rounded-md border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-xs font-black text-orange-300">
                              ไซส์ {matchResult.participant.shirt_size || 'L'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            คอเต่าซิป แขนสั้น โทนสีเทา–ดำ • สำหรับสวมใส่ในการฝึกภาคปฏิบัติ
                          </p>
                        </div>

                        {/* Status chip */}
                        {matchResult.participant.shirt_pickup_status === 'received' || matchResult.participant.shirt_received === true ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            รับเสื้อฝึกแล้ว
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300">
                            <Clock className="h-4 w-4" />
                            ยังไม่ได้รับเสื้อฝึก
                          </div>
                        )}
                      </div>

                      {/* Primary Shirt Toggle Action Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleTraineeShirt(matchResult.participant)}
                        disabled={isActionLoading}
                        className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                          matchResult.participant.shirt_pickup_status === 'received' || matchResult.participant.shirt_received === true
                            ? 'bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700'
                            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/40'
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : matchResult.participant.shirt_pickup_status === 'received' || matchResult.participant.shirt_received === true ? (
                          <>
                            <X className="h-4 w-4" />
                            <span>ยกเลิกสถานะรับเสื้อ (กรณีแตะผิด)</span>
                          </>
                        ) : (
                          <>
                            <PackageCheck className="h-4 w-4" />
                            <span>✓ เช็คชื่อส่งมอบเสื้อฝึก (ไซส์ {matchResult.participant.shirt_size || 'L'}) เรียบร้อย</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* ACTION 2: LINKED MERCHANDISE ORDERS (If participant bought store items) */}
                    {matchResult.linkedOrders && matchResult.linkedOrders.length > 0 && (
                      <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-purple-400" />
                            <h4 className="text-xs font-bold text-purple-200">
                              คำสั่งซื้อสินค้าเพิ่มเติมในระบบ ({matchResult.linkedOrders.length} รายการ)
                            </h4>
                          </div>
                          <span className="text-[10px] text-purple-300">
                            ส่งมอบพร้อมกันที่โต๊ะนี้ได้ทันที
                          </span>
                        </div>

                        <div className="space-y-2">
                          {matchResult.linkedOrders.map((ord) => {
                            const ordReceived = ord.pickup_status === 'received';
                            return (
                              <div
                                key={ord.id}
                                className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-wrap items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-white">
                                      {ord.order_number}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ordReceived ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                      {ordReceived ? 'รับแล้ว' : 'ยังไม่ได้รับ'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    ยอด {ord.total_amount || 0} บ. • {ord.items?.length || 1} รายการสินค้า
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleOrderReceived(ord)}
                                    disabled={isActionLoading}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      ordReceived
                                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                                    }`}
                                  >
                                    {ordReceived ? 'ยกเลิก' : '✓ มอบสินค้าชิ้นนี้'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ACTION 3: DIGITAL ID CARD VIEW & PRINT */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-400" />
                        <span className="text-xs font-bold text-white">
                          ดูตัวอย่างบัตรประจำตัว Digital ID Card / สั่งพิมพ์ PDF
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewingIdCard(!previewingIdCard)}
                        className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 transition-colors hover:bg-orange-500/20"
                      >
                        {previewingIdCard ? 'ซ่อนบัตร' : '🪪 แสดงบัตร ID Card'}
                      </button>
                    </div>

                    {previewingIdCard && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 animate-in fade-in">
                        <IDCardPreview
                          registration={matchResult.participant}
                          showActions={true}
                        />
                      </div>
                    )}

                    {/* ACTION 4: ADMIN NOTES & IN-APP ALERT MESSAGE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Internal Note */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                        <span className="block text-xs font-bold text-slate-300">
                          📝 บันทึกเฉพาะผู้ดูแลระบบ (Admin Private Note)
                        </span>
                        <textarea
                          rows={2}
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          placeholder="บันทึกข้อสังเกต หรือหมายเหตุเฉพาะเจ้าหน้าที่..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveInternalNote}
                          disabled={isSavingNote}
                          className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                        >
                          {isSavingNote ? 'กำลังบันทึก…' : 'บันทึกโน้ต'}
                        </button>
                      </div>

                      {/* In-App Notification Sender */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">
                            💬 ส่งข้อความแจ้งเตือนถึงผู้สมัคร
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMessageForm(!showMessageForm)}
                            className="text-[11px] text-orange-400 hover:underline"
                          >
                            {showMessageForm ? 'ยกเลิก' : '+ เขียนข้อความ'}
                          </button>
                        </div>

                        {showMessageForm ? (
                          <form onSubmit={handleSendNotification} className="space-y-2">
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="พิมพ์ข้อความแจ้งเตือนด่วน..."
                              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <select
                                value={messageKind}
                                onChange={(e) => setMessageKind(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-[11px] text-slate-300"
                              >
                                <option value="alert">🚨 แจ้งเตือนด่วน</option>
                                <option value="info">ℹ️ ข้อมูลทั่วไป</option>
                              </select>
                              <button
                                type="submit"
                                disabled={isSendingMessage || !messageText.trim()}
                                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-orange-400"
                              >
                                {isSendingMessage ? 'กำลังส่ง…' : 'ส่งทันที'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            ส่งแจ้งเตือนในระบบไปยังหน้าผู้ใช้งานของผู้สมัครท่านนี้ได้โดยตรง
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3B. MERCHANDISE ORDER VIEW */}
                {selectedResultType === 'order' && matchResult.order && (
                  <div className="space-y-4">
                    {/* Order summary card */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-black text-white">
                              {matchResult.order.order_number}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              matchResult.order.payment_status === 'paid_verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {matchResult.order.payment_status === 'paid_verified' ? 'ชำระเงินแล้ว' : 'รอตรวจสอบยอด'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            ผู้สั่งซื้อ: <strong className="text-white">{matchResult.order.customer_name}</strong> • โทร: {matchResult.order.customer_phone}
                          </p>
                        </div>

                        {/* Pickup status badge */}
                        {matchResult.order.pickup_status === 'received' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-3 py-1 text-xs font-black text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            รับสินค้าแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 px-3 py-1 text-xs font-black text-amber-300">
                            <Clock className="h-4 w-4" />
                            ยังไม่ได้รับสินค้า
                          </span>
                        )}
                      </div>

                      {/* Items table */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          รายการสินค้าที่สั่งซื้อ:
                        </span>
                        <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-xs">
                          {matchResult.order.items?.map((it, idx) => (
                            <div key={idx} className="py-1.5 flex items-center justify-between text-white">
                              <div>
                                <span className="font-bold">{it.product_name}</span>
                                <span className="text-orange-400 font-bold ml-2">[{it.size}]</span>
                              </div>
                              <div className="font-mono">
                                x{it.quantity} = {it.quantity * it.unit_price} บ.
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs font-bold">
                          <span className="text-slate-400">ยอดรวมทั้งสิ้น:</span>
                          <span className="text-base font-black text-orange-400 font-mono">
                            {matchResult.order.total_amount} บาท
                          </span>
                        </div>
                      </div>

                      {/* Slip preview button */}
                      {matchResult.order.slip_url && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setPreviewSlip(matchResult.order.slip_url)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            ดูรูปสลิปโอนเงินแนบจริง
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleOrderReceived(matchResult.order)}
                          disabled={isActionLoading}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg ${
                            matchResult.order.pickup_status === 'received'
                              ? 'bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700'
                              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                          }`}
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : matchResult.order.pickup_status === 'received' ? (
                            <>
                              <X className="h-4 w-4" />
                              <span>ยกเลิกสถานะส่งมอบ</span>
                            </>
                          ) : (
                            <>
                              <PackageCheck className="h-4 w-4" />
                              <span>✓ บันทึกการส่งมอบสินค้าเรียบร้อย</span>
                            </>
                          )}
                        </button>

                        {matchResult.order.payment_status !== 'paid_verified' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyOrderPayment(matchResult.order)}
                            disabled={isActionLoading}
                            className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span>ยืนยันยอดเงิน</span>
                          </button>
                        )}
                      </div>

                      {/* Linked participant profile if found */}
                      {matchResult.linkedParticipant && (
                        <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-950/20 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-orange-400" />
                            <div className="text-xs">
                              <p className="font-bold text-white">
                                ผู้สั่งซื้อท่านนี้คือผู้เข้ารับการฝึกอบรม: {matchResult.linkedParticipant.first_name_th || matchResult.linkedParticipant.first_name}
                              </p>
                              <p className="text-[10px] text-orange-300/80">
                                นามเรียกขาน: {matchResult.linkedParticipant.callsign || '-'} • หน่วย: {matchResult.linkedParticipant.unit || '-'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMatchResult(prev => ({
                                ...prev,
                                participant: matchResult.linkedParticipant
                              }));
                              setSelectedResultType('participant');
                            }}
                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-orange-400"
                          >
                            ดูบัตรประจำตัว
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. RECENT SCANS HISTORY STRIP */}
            {recentScans.length > 0 && (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  ประวัติที่เพิ่งสแกนล่าสุด (Recent Queue):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentScans.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700/60 px-2 py-1 text-[11px] text-slate-300"
                    >
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>{item.text}</span>
                      <span className="text-[9px] text-slate-500 font-mono">({item.time})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-4 py-3 sm:px-6 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              💡 มาตรฐานระบบสแกนร่วม JRE 2027 • สแกนได้ทั้งบัตร ID, เสื้อฝึก และสินค้า
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL FOR PAYMENT SLIPS */}
      {previewSlip && (
        <DocumentPreviewModal
          isOpen={Boolean(previewSlip)}
          onClose={() => setPreviewSlip(null)}
          title="สลิปโอนเงินคำสั่งซื้อ"
          imageUrl={previewSlip}
        />
      )}
    </ModalPortal>
  );
}
