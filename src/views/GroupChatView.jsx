import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Bell, CheckCheck, ImagePlus, LoaderCircle, MessageCircle, Pencil, Reply, Send, Shield, Trash2, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

const CHAT_BUCKET = 'jre-group-chat';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const fullNameFor = (registration, user) => {
  const fromRegistration = [registration?.title_th || registration?.title_en, registration?.first_name, registration?.last_name].filter(Boolean).join(' ').trim();
  return fromRegistration || user?.name || user?.email?.split('@')[0] || 'สมาชิก JRE';
};

const formatMessageTime = (value) => new Date(value).toLocaleString('th-TH', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
});

export default function GroupChatView({ user, myRegistration, onOpenGoogleLogin }) {
  const [messages, setMessages] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [signedImages, setSignedImages] = useState({});
  const [draft, setDraft] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [memberAccess, setMemberAccess] = useState(false);
  const [chatAdminAccess, setChatAdminAccess] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [connectingAuth, setConnectingAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [readByMessageId, setReadByMessageId] = useState(null);
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const mountedRef = useRef(true);
  const currentUserId = authUser?.id || null;
  const authorName = fullNameFor(myRegistration, user);

  useEffect(() => {
    let cancelled = false;
    const expectedEmail = user?.email?.toLowerCase().trim();
    const bridgeKey = expectedEmail ? `jre_chat_auth_bridge:${expectedEmail}` : null;
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email?.toLowerCase().trim() === expectedEmail) {
        if (bridgeKey) sessionStorage.removeItem(bridgeKey);
        setAuthUser(session.user);
        setConnectingAuth(false);
        setError('');
      }
    }) || { data: { subscription: null } };
    const verifyChatSession = async () => {
      if (!supabase || !user?.email) {
        setAuthUser(null);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionEmail = session?.user?.email?.toLowerCase().trim();
        if (!cancelled && session && sessionEmail === expectedEmail) {
          sessionStorage.removeItem(bridgeKey);
          setConnectingAuth(false);
          setAuthUser(session.user);
        } else if (!cancelled && !session && user?.email) {
          // Bridge existing JRE Google sessions into Supabase Auth so the
          // database can apply chat RLS without asking for credentials again.
          const previousAttempt = Number(sessionStorage.getItem(bridgeKey) || 0);
          if (previousAttempt && Date.now() - previousAttempt < 60_000) {
            setConnectingAuth(false);
            setError('เชื่อมบัญชี Google กับระบบแชทไม่สำเร็จ กรุณากดเข้าสู่ระบบ Google เพื่อยืนยันบัญชีอีกครั้ง');
            setLoading(false);
            return;
          }
          sessionStorage.setItem(bridgeKey, String(Date.now()));
          setConnectingAuth(true);
          const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              // Use the canonical production callback. Embedded browsers can
              // expose a localhost origin even while displaying the Vercel URL.
              redirectTo: 'https://jre-2027.vercel.app/chat',
              queryParams: { prompt: 'none', login_hint: expectedEmail }
            }
          });
          if (!cancelled && (oauthError || !data?.url)) {
            sessionStorage.removeItem(bridgeKey);
            setConnectingAuth(false);
            setError(oauthError?.message || 'เชื่อมบัญชี Google กับแชทไม่สำเร็จ');
          }
        } else if (!cancelled) {
          setAuthUser(null);
          setError('บัญชี Google ที่เข้าสู่ระบบไม่ตรงกับบัญชีที่ใช้งานใน JRE กรุณาเลือกบัญชีเดียวกัน');
          setLoading(false);
        }
      } catch (sessionError) {
        if (!cancelled) {
          setAuthUser(null);
          setError(sessionError.message || 'ยืนยันบัญชีสำหรับแชทไม่สำเร็จ');
          setLoading(false);
        }
      }
    };
    verifyChatSession();
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [user?.email]);

  const loadChat = useCallback(async ({ markRead = false } = {}) => {
    if (!supabase || !currentUserId) return;
    const { data: memberResult, error: memberError } = await supabase.rpc('jre_chat_is_member');
    if (memberError) throw memberError;
    const { data: adminResult } = await supabase.rpc('jre_chat_is_admin');
    if (!mountedRef.current) return;
    setMemberAccess(Boolean(memberResult));
    setChatAdminAccess(Boolean(adminResult));
    if (!memberResult) {
      setMessages([]);
      setReceipts([]);
      setLoading(false);
      return;
    }

    const { data: messageRows, error: messageError } = await supabase
      .from('group_chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (messageError) throw messageError;
    const chronological = (messageRows || []).reverse();
    const messageIds = chronological.map(message => message.id);
    let receiptRows = [];
    if (messageIds.length) {
      const { data, error: receiptError } = await supabase
        .from('group_chat_read_receipts')
        .select('message_id,user_id,reader_name,read_at')
        .in('message_id', messageIds);
      if (receiptError) throw receiptError;
      receiptRows = data || [];
    }

    if (!mountedRef.current) return;
    setMessages(chronological);
    setReceipts(receiptRows);

    const paths = [...new Set(chronological.map(message => message.image_path).filter(Boolean))];
    if (paths.length) {
      const { data: signedData, error: signedError } = await supabase.storage.from(CHAT_BUCKET).createSignedUrls(paths, 60 * 60);
      if (!signedError && mountedRef.current) {
        setSignedImages(previous => ({
          ...previous,
          ...Object.fromEntries((signedData || []).filter(item => item.signedUrl).map(item => [item.path, item.signedUrl]))
        }));
      }
    }

    if (markRead && messageIds.length) {
      const incomingUnread = chronological.filter(message => message.author_user_id !== currentUserId && !receiptRows.some(receipt => receipt.message_id === message.id && receipt.user_id === currentUserId));
      if (incomingUnread.length) {
        const readRows = incomingUnread.map(message => ({ message_id: message.id, user_id: currentUserId, reader_name: authorName }));
        const { error: readError } = await supabase.from('group_chat_read_receipts').upsert(readRows, { onConflict: 'message_id,user_id' });
        if (readError) throw readError;
        const { data: refreshedReceipts } = await supabase
          .from('group_chat_read_receipts')
          .select('message_id,user_id,reader_name,read_at')
          .in('message_id', messageIds);
        if (mountedRef.current && refreshedReceipts) setReceipts(refreshedReceipts);
      }
    }
    setLoading(false);
  }, [authorName, currentUserId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!isSupabaseConfigured || !supabase) {
      setError('ระบบแชทยังไม่ได้เชื่อมต่อฐานข้อมูล');
      setLoading(false);
      return () => { mountedRef.current = false; };
    }
    if (!currentUserId) {
      setError('กรุณาเข้าสู่ระบบ Google ด้วยบัญชีที่ใช้สมัครเข้าร่วมโครงการ');
      setLoading(false);
      return () => { mountedRef.current = false; };
    }
    setLoading(true);
    setError('');
    loadChat({ markRead: true }).catch(err => {
      console.error('Group chat load error:', err);
      if (mountedRef.current) {
        setError(err.message || 'โหลดห้องแชทไม่สำเร็จ');
        setLoading(false);
      }
    });

    const channel = supabase.channel(`jre-group-chat-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_chat_messages' }, payload => {
        if (payload.eventType === 'INSERT' && payload.new?.author_user_id !== currentUserId && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(payload.new.author_name || 'สมาชิก JRE', {
            body: payload.new.message_text || 'ส่งรูปภาพในแชทกลุ่ม',
            icon: user?.avatar || '/images/logo/jre_logo.png',
            tag: `jre-chat-${payload.new.id}`,
            data: { url: `${window.location.origin}/chat` }
          });
        }
        loadChat({ markRead: document.visibilityState === 'visible' }).catch(err => console.error('Group chat refresh error:', err));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_chat_read_receipts' }, () => {
        loadChat().catch(err => console.error('Group chat receipt refresh error:', err));
      })
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadChat({ markRead: true }).catch(() => {});
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadChat, user?.avatar]);

  useEffect(() => {
    if (isAtBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => () => {
    if (imageFile?.previewUrl) URL.revokeObjectURL(imageFile.previewUrl);
  }, [imageFile]);

  const handleScroll = () => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 120;
    isAtBottomRef.current = atBottom;
    setShowJumpToLatest(!atBottom);
    if (atBottom) loadChat({ markRead: true }).catch(() => {});
  };

  const chooseImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('เลือกได้เฉพาะไฟล์รูปภาพ');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('รูปภาพต้องมีขนาดไม่เกิน 8 MB');
      return;
    }
    setError('');
    setImageFile({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!currentUserId || (!draft.trim() && !imageFile) || sending) return;
    setSending(true);
    setError('');
    let uploadedPath = null;
    try {
      let imagePath = null;
      if (imageFile) {
        const extension = imageFile.file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
        uploadedPath = `${currentUserId}/${Date.now()}-${window.crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from(CHAT_BUCKET).upload(uploadedPath, imageFile.file, {
          cacheControl: '3600', upsert: false, contentType: imageFile.file.type
        });
        if (uploadError) throw uploadError;
        imagePath = uploadedPath;
      }

      const { error: insertError } = await supabase.from('group_chat_messages').insert({
        author_user_id: currentUserId,
        author_name: authorName,
        author_avatar: user?.avatar || null,
        message_text: draft.trim(),
        image_path: imagePath,
        reply_to_id: replyTo?.id || null
      });
      if (insertError) throw insertError;
      if (imageFile?.previewUrl) URL.revokeObjectURL(imageFile.previewUrl);
      setDraft('');
      setImageFile(null);
      setReplyTo(null);
      isAtBottomRef.current = true;
      await loadChat({ markRead: true });
    } catch (err) {
      console.error('Group chat send error:', err);
      if (uploadedPath) await supabase.storage.from(CHAT_BUCKET).remove([uploadedPath]).catch(() => {});
      setError(err.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (message) => {
    if (!editDraft.trim()) return;
    const { error: updateError } = await supabase.from('group_chat_messages').update({ message_text: editDraft.trim(), edited_at: new Date().toISOString() }).eq('id', message.id);
    if (updateError) {
      setError(updateError.message || 'แก้ไขข้อความไม่สำเร็จ');
      return;
    }
    setEditingId(null);
    setEditDraft('');
    await loadChat();
  };

  const handleDelete = async (message) => {
    if (!window.confirm('ยกเลิกข้อความนี้ในห้องแชทใช่ไหม?')) return;
    const { error: updateError } = await supabase.from('group_chat_messages').update({ message_text: '', image_path: null, deleted_at: new Date().toISOString() }).eq('id', message.id);
    if (updateError) {
      setError(updateError.message || 'ยกเลิกข้อความไม่สำเร็จ');
      return;
    }
    if (message.image_path) await supabase.storage.from(CHAT_BUCKET).remove([message.image_path]).catch(() => {});
    await loadChat();
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setNotice('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    setNotice(permission === 'granted' ? 'เปิดการแจ้งเตือนแชทแล้ว' : 'ยังไม่ได้รับอนุญาตให้แจ้งเตือน');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const receiptsFor = (messageId) => receipts.filter(receipt => receipt.message_id === messageId);
  const messageById = (messageId) => messages.find(message => message.id === messageId);

  if (!currentUserId) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-indigo-300" />
        <h1 className="text-2xl font-black text-white">แชทกลุ่มผู้เข้าร่วม JRE 2027</h1>
        <p className="my-3 text-slate-400">{connectingAuth ? 'กำลังเชื่อมบัญชี Google ที่เข้าสู่ระบบอยู่กับห้องแชท…' : error || (user ? 'กำลังเชื่อมบัญชี Google ที่ใช้งานอยู่กับระบบแชท' : 'เข้าสู่ระบบด้วยบัญชี Google ที่ใช้สมัคร เพื่อยืนยันสิทธิ์เข้าห้องแชท')}</p>
        {!connectingAuth && <button onClick={onOpenGoogleLogin} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">เข้าสู่ระบบ Google</button>}
      </div>
    );
  }

  if (!loading && !memberAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <Shield className="w-12 h-12 mx-auto mb-4 text-amber-300" />
        <h1 className="text-2xl font-black text-white">ห้องแชทสำหรับผู้สมัครที่ลงทะเบียนแล้ว</h1>
        <p className="mt-3 text-slate-400">บัญชีนี้ยังไม่พบรายการสมัครที่ยืนยันสิทธิ์เข้าห้องแชท</p>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto h-[calc(100dvh-180px)] min-h-[520px] max-h-[900px] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg"><MessageCircle className="w-5 h-5 text-white" /></div>
          <div className="min-w-0"><h1 className="font-black text-white text-base sm:text-lg truncate">แชทกลุ่มผู้เข้าร่วม JRE 2027</h1><p className="text-[11px] text-emerald-300">สมาชิกที่ลงทะเบียนแล้ว • อัปเดตข้อความแบบเรียลไทม์</p></div>
        </div>
        <div className="flex items-center gap-2">
          {chatAdminAccess && <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-200"><Shield className="w-3 h-3" /> Admin</span>}
          <button onClick={enableNotifications} title="เปิดการแจ้งเตือนข้อความใหม่" className={`p-2.5 rounded-xl border ${notificationsEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'}`}><Bell className="w-4 h-4" /></button>
        </div>
      </header>

      <div ref={scrollAreaRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-900 to-slate-950">
        {loading && <div className="flex justify-center py-10 text-indigo-200"><LoaderCircle className="w-5 h-5 animate-spin mr-2" />กำลังโหลดบทสนทนา</div>}
        {!loading && messages.length === 0 && <div className="h-full min-h-48 flex flex-col items-center justify-center text-center text-slate-500"><MessageCircle className="w-10 h-10 mb-3 text-slate-700" /><p className="font-bold text-slate-300">เริ่มต้นพูดคุยกันได้เลย</p><p className="text-xs mt-1">ข้อความและรูปภาพจะเห็นได้เฉพาะสมาชิกที่ลงทะเบียน</p></div>}
        {messages.map(message => {
          const mine = message.author_user_id === currentUserId;
          const deleted = Boolean(message.deleted_at);
          const canManage = !deleted && (mine || chatAdminAccess);
          const readBy = receiptsFor(message.id);
          const quoted = message.reply_to_id ? messageById(message.reply_to_id) : null;
          const editing = editingId === message.id;
          return (
            <article id={`chat-msg-${message.id}`} key={message.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
              {message.author_avatar ? <img src={message.author_avatar} alt="" className="w-8 h-8 mt-1 rounded-full object-cover border border-slate-700 shrink-0" /> : <div className="w-8 h-8 mt-1 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-200 shrink-0">{(message.author_name || 'J').slice(0, 1)}</div>}
              <div className={`max-w-[88%] sm:max-w-[76%] min-w-0 ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-baseline gap-2 mb-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}><span className="text-[11px] font-bold text-slate-300">{mine ? 'คุณ' : message.author_name}</span><time className="text-[10px] text-slate-500">{formatMessageTime(message.created_at)}{message.edited_at && !deleted ? ' · แก้ไขแล้ว' : ''}</time></div>
                <div className={`rounded-2xl px-3.5 py-2.5 shadow-md ${mine ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm border border-slate-700 bg-slate-800 text-slate-100'}`}>
                  {quoted && <button onClick={() => document.getElementById(`chat-msg-${quoted.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="block w-full mb-2 text-left rounded-lg border-l-2 border-indigo-300/70 bg-black/15 px-2.5 py-1.5 text-[10px] opacity-80 hover:opacity-100"><span className="font-bold">{quoted.author_name}</span><span className="block truncate">{quoted.deleted_at ? 'ข้อความถูกยกเลิก' : quoted.message_text || '🖼️ รูปภาพ'}</span></button>}
                  {deleted ? <p className="italic text-sm opacity-60">ยกเลิกข้อความแล้ว</p> : editing ? <div className="space-y-2"><textarea autoFocus value={editDraft} onChange={e => setEditDraft(e.target.value)} maxLength={4000} rows={3} className="w-full min-w-56 rounded-lg bg-slate-950/40 p-2 text-sm text-white outline-none" /><div className="flex justify-end gap-2"><button onClick={() => setEditingId(null)} className="text-xs opacity-70">ยกเลิก</button><button onClick={() => handleEdit(message)} className="text-xs font-bold">บันทึก</button></div></div> : <>
                    {message.message_text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message_text}</p>}
                    {message.image_path && signedImages[message.image_path] && <a href={signedImages[message.image_path]} target="_blank" rel="noreferrer"><img src={signedImages[message.image_path]} alt="รูปภาพในแชท" className="mt-2 max-h-80 max-w-full rounded-xl object-contain" loading="lazy" /></a>}
                  </>}
                </div>
                {!deleted && <div className={`flex items-center gap-2 mt-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
                  <button onClick={() => setReplyTo(message)} className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-300"><Reply className="w-3 h-3" />ตอบกลับ</button>
                  {canManage && !editing && <>
                    <button onClick={() => { setEditingId(message.id); setEditDraft(message.message_text || ''); }} className="text-slate-500 hover:text-amber-300" title="แก้ไข"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(message)} className="text-slate-500 hover:text-rose-300" title="ยกเลิกข้อความ"><Trash2 className="w-3 h-3" /></button>
                  </>}
                  {mine && <div className="relative"><button type="button" onClick={() => setReadByMessageId(previous => previous === message.id ? null : message.id)} className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-sky-300"><CheckCheck className="w-3.5 h-3.5 text-sky-300" />อ่านแล้ว {readBy.length}</button>{readByMessageId === message.id && <div className="absolute bottom-full right-0 z-20 mb-2 min-w-40 max-w-64 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-left text-[10px] text-slate-200 shadow-xl">{readBy.length ? readBy.map(receipt => <span key={receipt.user_id} className="block py-0.5">{receipt.reader_name} · {formatMessageTime(receipt.read_at)}</span>) : 'ยังไม่มีใครอ่าน'}</div>}</div>}
                </div>}
              </div>
            </article>
          );
        })}
        <div ref={bottomRef} />
        {showJumpToLatest && <button onClick={() => { isAtBottomRef.current = true; bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="sticky bottom-2 left-full flex items-center gap-1 rounded-full border border-indigo-400/40 bg-slate-950/90 px-3 py-2 text-xs font-bold text-indigo-200 shadow-xl"><ArrowDown className="w-3.5 h-3.5" />ข้อความล่าสุด</button>}
      </div>

      {(error || notice) && <div className={`px-4 py-2 text-xs ${error ? 'bg-rose-950/70 text-rose-200' : 'bg-emerald-950/70 text-emerald-200'}`}>{error || notice}<button onClick={() => { setError(''); setNotice(''); }} className="float-right"><X className="w-3.5 h-3.5" /></button></div>}

      <form onSubmit={handleSend} className="border-t border-slate-800 bg-slate-950/80 p-3 sm:p-4">
        {replyTo && <div className="mb-2 flex items-center justify-between rounded-xl border-l-2 border-indigo-400 bg-slate-900 px-3 py-2"><div className="min-w-0"><p className="text-[10px] font-bold text-indigo-200">ตอบกลับ {replyTo.author_name}</p><p className="truncate text-xs text-slate-400">{replyTo.message_text || '🖼️ รูปภาพ'}</p></div><button type="button" onClick={() => setReplyTo(null)} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button></div>}
        {imageFile && <div className="relative mb-2 inline-flex"><img src={imageFile.previewUrl} alt="ตัวอย่างรูป" className="max-h-28 rounded-xl border border-slate-700" /><button type="button" onClick={() => { URL.revokeObjectURL(imageFile.previewUrl); setImageFile(null); }} className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white"><X className="w-3.5 h-3.5" /></button></div>}
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => { chooseImage(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} title="แนบรูปภาพ" className="mb-0.5 rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-300 hover:border-indigo-400 hover:text-indigo-200"><ImagePlus className="w-5 h-5" /></button>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={4000} placeholder="พิมพ์ข้อความ... (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)" className="max-h-32 min-h-11 flex-1 resize-y rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          <button type="submit" disabled={sending || (!draft.trim() && !imageFile)} title="ส่งข้อความ" className="mb-0.5 rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500">{sending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}</button>
        </div>
        <p className="mt-2 text-center text-[9px] text-slate-600">แชทนี้สำหรับสมาชิกที่ลงทะเบียน • หลีกเลี่ยงการโพสต์ข้อมูลส่วนตัวหรือข้อมูลสุขภาพ</p>
      </form>
    </section>
  );
}
