import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  X,
  MessageSquare,
  ShieldAlert,
  Clock,
  Sparkles,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import ModalPortal from './ModalPortal';

/**
 * UserNotificationsModal
 * Interactive popup modal for participants to view direct messages from Admin,
 * mark messages as read / unread, and delete unwanted messages.
 */
export default function UserNotificationsModal({
  isOpen = false,
  onClose,
  myRegistration,
  onUpdateRegistration
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [deletingId, setDeletingId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const messages = Array.isArray(myRegistration?.admin_messages) ? myRegistration.admin_messages : [];
  const unreadCount = messages.filter(m => !m.read).length;

  const displayedMessages = filter === 'unread' 
    ? messages.filter(m => !m.read)
    : messages;

  const handleToggleRead = async (msgId) => {
    if (!myRegistration) return;
    const targetId = myRegistration.user_id || myRegistration.id;
    const updated = messages.map(m => {
      if (m.id === msgId) {
        return { ...m, read: !m.read };
      }
      return m;
    });

    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: updated });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!myRegistration || unreadCount === 0) return;
    const targetId = myRegistration.user_id || myRegistration.id;
    const updated = messages.map(m => ({ ...m, read: true }));

    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: updated });
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!myRegistration) return;
    const targetId = myRegistration.user_id || myRegistration.id;
    const updated = messages.filter(m => m.id !== msgId);

    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: updated });
    }
    setDeletingId(null);
  };

  const handleClearAll = async () => {
    if (!myRegistration || messages.length === 0) return;
    const targetId = myRegistration.user_id || myRegistration.id;
    
    if (onUpdateRegistration) {
      await onUpdateRegistration(targetId, { admin_messages: [] });
    }
    setConfirmClearAll(false);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    กล่องข้อความและการแจ้งเตือน
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-xs font-bold animate-pulse">
                      {unreadCount} ยังไม่อ่าน
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                      อ่านครบแล้ว
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ข้อความส่งตรงจากฝ่ายประสานงาน & การเงินโครงการ JRE 2027
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all cursor-pointer shrink-0"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ACTION & FILTER TOOLBAR */}
          <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ยังไม่อ่าน ({unreadCount})
              </button>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="ทำเครื่องหมายว่าอ่านทุกข้อความแล้ว"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>อ่านทั้งหมดแล้ว</span>
                </button>
              )}

              {messages.length > 0 && (
                confirmClearAll ? (
                  <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800/80 p-1 rounded-xl">
                    <span className="text-[11px] text-red-300 font-bold px-1.5">แน่ใจหรือไม่?</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      ลบทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(true)}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-medium flex items-center gap-1 transition-all cursor-pointer"
                    title="ลบข้อความแจ้งเตือนทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างทั้งหมด</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* MESSAGES LIST (SCROLLABLE BODY) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 max-h-[60vh]">
            {displayedMessages.length > 0 ? (
              displayedMessages.map((msg, idx) => {
                const isUnread = !msg.read;
                const isConfirmingDelete = deletingId === (msg.id || idx);

                return (
                  <div
                    key={msg.id || idx}
                    className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                      isUnread
                        ? 'bg-gradient-to-br from-slate-900 via-purple-950/25 to-slate-900 border-purple-500/60 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30'
                        : 'bg-slate-950/60 border-slate-800/90 text-slate-300 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Message Header Meta */}
                    <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isUnread ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs">
                            ฝ่ายประสานงาน & การเงิน JRE 2027
                          </span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            (Admin)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnread ? (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse">
                            🔴 ยังไม่อ่าน
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> อ่านแล้ว
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {msg.created_at ? new Date(msg.created_at).toLocaleString('th-TH') : ''}
                        </span>
                      </div>
                    </div>

                    {/* Message Body Content */}
                    <div className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-xl text-slate-100 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line select-text">
                      {msg.text}
                    </div>

                    {/* Action Buttons for this Message */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      {/* Mark Read / Unread Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleRead(msg.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isUnread
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700'
                        }`}
                        title={isUnread ? 'กดเพื่อทำเครื่องหมายว่าอ่านแล้ว' : 'กดเพื่อเปลี่ยนกลับเป็นยังไม่อ่าน'}
                      >
                        {isUnread ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 text-slate-400" />
                            <span>เปลี่ยนเป็นยังไม่อ่าน</span>
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-800 p-1 rounded-xl">
                          <span className="text-[11px] text-red-300 font-bold px-1.5">ลบข้อความนี้?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id || idx)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            ยืนยันลบ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(msg.id || idx)}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-medium flex items-center gap-1 transition-all cursor-pointer"
                          title="ลบข้อความนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* EMPTY STATE */
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                  {filter === 'unread' ? <CheckCheck className="w-7 h-7 text-emerald-400" /> : <BellOff className="w-7 h-7" />}
                </div>
                <h4 className="text-base font-bold text-white">
                  {filter === 'unread' ? 'อ่านข้อความทั้งหมดครบแล้ว' : 'ไม่มีข้อความแจ้งเตือน'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {filter === 'unread'
                    ? 'ไม่มีข้อความใหม่ที่ยังไม่ได้เปิดอ่าน คุณสามารถสลับไปดูข้อความ "ทั้งหมด" ได้'
                    : 'เมื่อฝ่ายประสานงานหรือผู้ดูแลระบบส่งข้อความแจ้งเตือนเกี่ยวกับสลิป ยอดโอน หรือเอกสาร จะปรากฏที่นี่ทันที'}
                </p>
                {filter === 'unread' && messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>ดูประวัติข้อความทั้งหมด ({messages.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">
              รวมทั้งหมด {messages.length} ข้อความ ({unreadCount} ยังไม่อ่าน)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
