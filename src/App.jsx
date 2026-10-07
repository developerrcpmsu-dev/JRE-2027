import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FormsBanner from './components/FormsBanner';
import GoogleLoginModal from './components/GoogleLoginModal';
import AdminLoginModal from './components/AdminLoginModal';
import UserNotificationsModal from './components/UserNotificationsModal';
import HomeView from './views/HomeView';
import ScheduleView from './views/ScheduleView';
import RegisterView from './views/RegisterView';
import AnnouncementsView from './views/AnnouncementsView';
import AdminDashboardView from './views/AdminDashboardView';
import MerchandiseView from './views/MerchandiseView';
import AuthPortalView from './views/AuthPortalView';
import UserProfileView from './views/UserProfileView';
import IDCardView from './views/IDCardView';
import SecurityAuditView from './views/SecurityAuditView';
import { DataService, supabase, isSupabaseConfigured, subscribeToRealtimeChanges, broadcastRealtimeChange } from './supabase';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { parseCurrentRoute, getPathForRoute, syncUrlToRoute } from './utils/router';
import { decodeJwtResponse } from './utils/googleAuth';
import { forceUnlockAll } from './utils/scrollLock';

export default function App() {
  const [route, setRoute] = useState(parseCurrentRoute);

  const currentTab = route.mainTab;
  const currentSubRoute = route.subRoute;

  const setCurrentTab = (newTab, newSubRoute = null, options = {}) => {
    let main = newTab;
    let sub = newSubRoute;

    if (newTab === 'pr') {
      main = 'announcements';
      sub = 'public';
    } else if (newTab === 'orders') {
      main = 'announcements';
      sub = 'members';
    } else if (newTab === 'id-card' || newTab === 'badge') {
      main = 'id-card';
      sub = null;
    } else if (newTab === 'dashboard') {
      main = 'register';
      sub = 'dashboard';
    } else if (newTab === 'shop' || newTab === 'store') {
      main = 'merchandise';
      sub = 'catalog';
    } else if (newTab === 'users' || newTab === 'user') {
      main = 'users';
      sub = newSubRoute;
    } else if (newTab === 'presentation' || newTab === 'research' || newTab === 'ai-security') {
      main = 'security';
      sub = 'presentation';
    } else if (newTab === 'security' || newTab === 'security-audit' || newTab === 'audit') {
      main = 'security';
      sub = newSubRoute || 'audit';
    }

    syncUrlToRoute(main, sub, false, options);
    setRoute(parseCurrentRoute());
  };

  // Sync browser back/forward buttons and hash navigation
  useEffect(() => {
    // If user arrived with legacy ?tab= or hash, normalize immediately to clean path
    const initial = parseCurrentRoute();
    if (window.location.search.includes('tab=') || window.location.hash) {
      syncUrlToRoute(initial.mainTab, initial.subRoute, true);
    }

    const handleLocationChange = () => {
      const parsed = parseCurrentRoute();
      setRoute(parsed);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Ensure body scrolling is always unlocked when route changes
  useEffect(() => {
    forceUnlockAll();
  }, [route.mainTab, route.subRoute]);

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [userNotificationsOpen, setUserNotificationsOpen] = useState(false);

  // Data
  const [registrations, setRegistrations] = useState([]);
  const [myRegistration, setMyRegistration] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [formsConfig, setFormsConfig] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [merchandiseConfig, setMerchandiseConfig] = useState(null);
  const [merchandiseOrders, setMerchandiseOrders] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to match registration robustly (by user_id or case-insensitive email)
  const matchRegistration = (userTarget, regList) => {
    if (!userTarget || !Array.isArray(regList) || regList.length === 0) return null;
    const targetEmail = userTarget.email?.toLowerCase().trim();
    const targetId = userTarget.id;
    return regList.find(r => 
      (targetId && (r.user_id === targetId || r.id === targetId)) ||
      (targetEmail && r.user_email?.toLowerCase().trim() === targetEmail)
    ) || null;
  };

  // Load Initial Data & Sessions
  useEffect(() => {
    async function loadData() {
      try {
        const [regs, anns, forms, payCfg, merchCfg, merchOrds, team, spks, accs] = await Promise.all([
          DataService.getRegistrations(),
          DataService.getAnnouncements(),
          DataService.getFormsConfig(),
          DataService.getPaymentConfig(),
          DataService.getMerchandiseConfig(),
          DataService.getMerchandiseOrders(),
          DataService.getTeam(),
          DataService.getSpeakers(),
          DataService.getUserAccounts({ admin: true })
        ]);
        setRegistrations(regs);
        setAnnouncements(anns);
        setFormsConfig(forms);
        setPaymentConfig(payCfg);
        setMerchandiseConfig(merchCfg);
        setMerchandiseOrders(merchOrds);
        setTeamMembers(team);
        setSpeakers(spks);
        setUserAccounts(accs || []);

        // Check for Google OAuth Direct Redirect Hash Callback (#access_token=... or #id_token=...)
        if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))) {
          try {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const idToken = params.get('id_token');
            window.history.replaceState(null, '', window.location.pathname + window.location.search);

            let cleanEmail = null;
            let cleanName = null;
            let avatar = null;

            if (idToken) {
              const payload = decodeJwtResponse(idToken);
              if (payload?.email) {
                cleanEmail = payload.email.trim().toLowerCase();
                cleanName = payload.name || cleanEmail.split('@')[0];
                avatar = payload.picture || ("https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(cleanEmail));
              }
            }

            if (!cleanEmail && accessToken) {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: "Bearer " + accessToken }
              });
              const profile = await res.json();
              if (profile?.email) {
                cleanEmail = profile.email.trim().toLowerCase();
                cleanName = profile.name || cleanEmail.split('@')[0];
                avatar = profile.picture || ("https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(cleanEmail));
              }
            }

            if (cleanEmail) {
              const userObj = await DataService.loginWithGoogleProfile({
                name: cleanName,
                email: cleanEmail,
                avatar: avatar
              });
              localStorage.setItem('jre2027_auth_user', JSON.stringify(userObj));
              setUser(userObj);
              const found = matchRegistration(userObj, regs);
              if (found) {
                setMyRegistration(found);
              } else {
                const ownRegistration = await DataService.getRegistrationByUserId(userObj.id, userObj.email);
                if (ownRegistration) setMyRegistration(ownRegistration);
              }
            }
          } catch (oauthErr) {
            console.warn('OAuth redirect hash parse error:', oauthErr);
          }
        }

        // 1. Wipe any legacy insecure admin flags stored in localStorage
        localStorage.removeItem('jre2027_is_admin');

        // 2. Check stored regular user auth (Participant profile)
        const storedUser = localStorage.getItem('jre2027_auth_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            const found = matchRegistration(parsed, regs);
            if (found) {
              setMyRegistration(found);
            } else {
              const ownRegistration = await DataService.getRegistrationByUserId(parsed.id, parsed.email);
              if (ownRegistration) setMyRegistration(ownRegistration);
            }
          } catch (e) {
            localStorage.removeItem('jre2027_auth_user');
          }
        }

        // 3. Strict Admin Session Verification:
        // Admin access is strictly separated from Google login and REQUIRES active session tokens
        const adminToken = sessionStorage.getItem('jre2027_admin_token');
        const adminExpires = Number(sessionStorage.getItem('jre2027_admin_expires') || 0);

        if (adminToken && adminExpires && Date.now() < adminExpires) {
          setIsAdmin(true);
          // Verify token validity with server in background
          fetch('/api/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', token: adminToken })
          })
          .then(res => res.json())
          .then(data => {
            if (!data?.valid) {
              sessionStorage.removeItem('jre2027_admin_token');
              sessionStorage.removeItem('jre2027_admin_expires');
              setIsAdmin(false);
            }
          })
          .catch(() => {});
        } else {
          sessionStorage.removeItem('jre2027_admin_token');
          sessionStorage.removeItem('jre2027_admin_expires');
          setIsAdmin(false);
        }

        // Supabase Auth listener if configured
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              email: session.user.email,
              avatar: session.user.user_metadata?.avatar_url,
              provider: 'google'
            };
            setUser(u);
            const found = matchRegistration(u, regs);
            if (found) {
              setMyRegistration(found);
            } else {
              const ownRegistration = await DataService.getRegistrationByUserId(u.id, u.email);
              if (ownRegistration) setMyRegistration(ownRegistration);
            }
          }

          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const u = {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                email: session.user.email,
                avatar: session.user.user_metadata?.avatar_url,
                provider: 'google'
              };
              setUser(u);
              localStorage.setItem('jre2027_auth_user', JSON.stringify(u));
              DataService.getRegistrationByUserId(u.id, u.email).then((ownRegistration) => {
                if (ownRegistration) setMyRegistration(ownRegistration);
              });
            } else if (!storedUser) {
              setUser(null);
            }
          });
        }
      } catch (err) {
        console.error('Failed to load JRE 2027 initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Update myRegistration when registrations or user changes
  useEffect(() => {
    if (user && registrations.length > 0) {
      const found = matchRegistration(user, registrations);
      setMyRegistration(found || null);
    } else if (!user) {
      setMyRegistration(null);
    }
  }, [user, registrations]);

  // Realtime Data Synchronization Engine
  const isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

  const refreshRegistrations = async () => {
    try {
      const updated = isAdmin
        ? await DataService.getRegistrations({ admin: true })
        : (user ? await DataService.getRegistrations({ userId: user.id, email: user.email }) : await DataService.getRegistrations());
      if (Array.isArray(updated)) {
        setRegistrations(prev => isDifferent(prev, updated) ? updated : prev);
        return updated;
      }
    } catch (e) {}
    return [];
  };

  const refreshAnnouncements = async () => {
    try {
      const updated = await DataService.getAnnouncements();
      if (Array.isArray(updated)) {
        setAnnouncements(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshMerchandiseOrders = async () => {
    try {
      const updated = await DataService.getMerchandiseOrders();
      if (Array.isArray(updated)) {
        setMerchandiseOrders(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshPaymentConfig = async () => {
    try {
      const updated = await DataService.getPaymentConfig();
      if (updated) {
        setPaymentConfig(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshFormsConfig = async () => {
    try {
      const updated = await DataService.getFormsConfig();
      if (updated) {
        setFormsConfig(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshMerchandiseConfig = async () => {
    try {
      const updated = await DataService.getMerchandiseConfig();
      if (updated) {
        setMerchandiseConfig(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshTeam = async () => {
    try {
      const updated = await DataService.getTeam();
      if (Array.isArray(updated)) {
        setTeamMembers(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshSpeakers = async () => {
    try {
      const updated = await DataService.getSpeakers();
      if (Array.isArray(updated)) {
        setSpeakers(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshUserAccounts = async () => {
    try {
      const updated = await DataService.getUserAccounts({ admin: true });
      if (Array.isArray(updated)) {
        setUserAccounts(prev => isDifferent(prev, updated) ? updated : prev);
      }
    } catch (e) {}
  };

  const refreshAllData = async () => {
    await Promise.allSettled([
      refreshRegistrations(),
      refreshAnnouncements(),
      refreshMerchandiseOrders(),
      refreshPaymentConfig(),
      refreshFormsConfig(),
      refreshMerchandiseConfig(),
      refreshTeam(),
      refreshSpeakers(),
      refreshUserAccounts()
    ]);
  };

  const handleRealtimeChange = (detail) => {
    const type = detail?.type;
    if (!type || type === 'all') {
      refreshAllData();
      return;
    }
    if (type === 'registrations' || type === 'applicants') {
      refreshRegistrations();
    } else if (type === 'announcements') {
      refreshAnnouncements();
    } else if (type === 'merchandise_orders' || type === 'orders') {
      refreshMerchandiseOrders();
    } else if (type === 'payment_config' || type === 'payment') {
      refreshPaymentConfig();
    } else if (type === 'forms_config' || type === 'forms') {
      refreshFormsConfig();
    } else if (type === 'merchandise_config' || type === 'merchandise') {
      refreshMerchandiseConfig();
    } else if (type === 'team_members' || type === 'team') {
      refreshTeam();
    } else if (type === 'speakers_config' || type === 'speakers') {
      refreshSpeakers();
    } else if (type === 'user_accounts' || type === 'users') {
      refreshUserAccounts();
    } else {
      refreshAllData();
    }
  };

  // Realtime listeners & background heartbeat polling
  useEffect(() => {
    // 1. Subscribe to instant realtime broadcasts (local tabs + cloud websocket)
    const unsubscribe = subscribeToRealtimeChanges((payload) => {
      handleRealtimeChange(payload);
    });

    let isPolling = false;
    const pollSafe = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await refreshAllData();
      } finally {
        isPolling = false;
      }
    };

    // 2. Immediate check on visibilitychange & window focus
    const handleVis = () => {
      if (document.visibilityState === 'visible') {
        pollSafe();
      }
    };
    const handleFocus = () => {
      pollSafe();
    };

    window.addEventListener('visibilitychange', handleVis);
    window.addEventListener('focus', handleFocus);

    // 3. Heartbeat convergence timer (every 4s active, 15s in background)
    const activeTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollSafe();
      }
    }, 4000);

    const bgTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        pollSafe();
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(activeTimer);
      clearInterval(bgTimer);
      window.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, isAdmin]);

  // Auth Handlers
  const handleGoogleLoginSuccess = async (userObj) => {
    setUser(userObj);
    // Security notice: Google login authenticates participant identity only.
    // It strictly does NOT grant access to the Admin Dashboard without dedicated admin credentials.
    const found = matchRegistration(userObj, registrations);
    if (found) {
      setMyRegistration(found);
    } else {
      const ownRegistration = await DataService.getRegistrationByUserId(userObj.id, userObj.email);
      if (ownRegistration) setMyRegistration(ownRegistration);
    }
  };

  const handleAdminLoginSuccess = async () => {
    setIsAdmin(true);
    const [adminRegistrations, adminAccounts] = await Promise.all([
      DataService.getRegistrations({ admin: true }),
      DataService.getUserAccounts({ admin: true })
    ]);
    setRegistrations(adminRegistrations);
    setUserAccounts(adminAccounts);
    setCurrentTab('admin', currentSubRoute || 'applicants');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('jre2027_auth_user');
    localStorage.removeItem('jre2027_is_admin');
    sessionStorage.removeItem('jre2027_admin_token');
    sessionStorage.removeItem('jre2027_admin_expires');
    setMyRegistration(null);
    setCurrentTab('home');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('jre2027_is_admin');
    sessionStorage.removeItem('jre2027_admin_token');
    sessionStorage.removeItem('jre2027_admin_expires');
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
  };

  // Auto-prompt Admin Login modal when user accesses /admin route while unauthenticated
  useEffect(() => {
    if (currentTab === 'admin' && !isAdmin && !loading) {
      setAdminModalOpen(true);
    }
  }, [currentTab, isAdmin, loading]);

  // Data Mutation Handlers with Strict Access Controls
  const handleSaveRegistration = async (payload) => {
    // SECURITY GUARD: Ensure applicant cannot spoof another user's identity!
    if (!isAdmin && user) {
      payload.user_id = user.id;
      payload.user_email = user.email;
    }
    const saved = await DataService.saveRegistration(payload);
    const updated = isAdmin
      ? await DataService.getRegistrations({ admin: true })
      : await DataService.getRegistrations({ userId: payload.user_id, email: payload.user_email });
    setRegistrations(updated);
    setMyRegistration(saved);
    return saved;
  };

  const handleUpdateAllocation = async (userId, allocations) => {
    // SECURITY GUARD: Group and room allocations are RESTRICTED to verified Admin!
    if (!isAdmin) {
      console.warn('Unauthorized allocation update attempt rejected');
      return;
    }
    setRegistrations(prev => prev.map(r => 
      (r.user_id === userId || r.id === userId || (r.user_email && r.user_email === userId))
        ? { ...r, ...allocations, updated_at: new Date().toISOString() }
        : r
    ));
    if (user && (user.id === userId || myRegistration?.user_id === userId || myRegistration?.id === userId)) {
      setMyRegistration(prev => prev ? { ...prev, ...allocations } : prev);
    }
    await DataService.updateRegistrationAllocations(userId, allocations);
  };

  const handleUpdateRegistration = async (userId, updates) => {
    // SECURITY GUARD: Prevent editing other people's registration records!
    if (!isAdmin) {
      if (!user) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนทำการแก้ไขข้อมูล');
      }
      const isOwner = (myRegistration && (myRegistration.user_id === userId || myRegistration.id === userId)) ||
                      (user && (user.id === userId || user.email?.toLowerCase() === String(userId).toLowerCase()));
      if (!isOwner) {
        throw new Error('การเข้าถึงถูกปฏิเสธ: ท่านไม่มีสิทธิ์แก้ไขข้อมูลของผู้สมัครท่านอื่น');
      }
      // If registration has already paid or partial paid, protect financial & institution fields!
      if (myRegistration?.payment_status === 'full' || myRegistration?.payment_status === 'installment_1_paid') {
        delete updates.payment_status;
        delete updates.institution;
        delete updates.fee_total;
        delete updates.payment_type;
      }
    }

    setRegistrations(prev => prev.map(r => 
      (r.user_id === userId || r.id === userId || (r.user_email && r.user_email === userId))
        ? { ...r, ...updates, updated_at: new Date().toISOString() }
        : r
    ));
    if (user && (user.id === userId || myRegistration?.user_id === userId || myRegistration?.id === userId)) {
      setMyRegistration(prev => prev ? { ...prev, ...updates } : prev);
    }
    await DataService.updateRegistrationDetails(userId, updates);
  };

  const handleDeleteRegistration = async (userId) => {
    // SECURITY GUARD: Prevent deleting other people's registrations!
    if (!isAdmin) {
      if (!user) {
        throw new Error('ไม่อนุญาตให้ดำเนินการ');
      }
      const isOwner = (myRegistration && (myRegistration.user_id === userId || myRegistration.id === userId));
      if (!isOwner) {
        throw new Error('การเข้าถึงถูกปฏิเสธ: ท่านไม่มีสิทธิ์ยกเลิกใบสมัครของผู้อื่น');
      }
      if (myRegistration?.payment_status === 'full' || myRegistration?.payment_status === 'installment_1_paid') {
        throw new Error('ใบสมัครที่ชำระเงินแล้วไม่สามารถยกเลิกได้ กรุณาติดต่อแอดมิน');
      }
    }
    await DataService.deleteRegistration(userId);
    const updated = isAdmin
      ? await DataService.getRegistrations({ admin: true })
      : await DataService.getRegistrations({ userId: user?.id, email: user?.email });
    setRegistrations(updated);
    if (user && (user.id === userId || myRegistration?.user_id === userId)) {
      setMyRegistration(null);
    }
  };

  const handleSaveAnnouncement = async (ann) => {
    await DataService.saveAnnouncement(ann);
    const updated = await DataService.getAnnouncements();
    setAnnouncements(updated);
  };

  const handleDeleteAnnouncement = async (id) => {
    await DataService.deleteAnnouncement(id);
    const updated = await DataService.getAnnouncements();
    setAnnouncements(updated);
  };

  const handleSaveFormsConfig = async (cfg) => {
    await DataService.saveFormsConfig(cfg);
    setFormsConfig(cfg);
  };

  const handleSavePaymentConfig = async (cfg) => {
    await DataService.savePaymentConfig(cfg);
    setPaymentConfig(cfg);
  };

  const handleSaveTeam = async (team) => {
    await DataService.saveTeam(team);
    setTeamMembers(team);
  };

  const handleSaveSpeakers = async (spks) => {
    await DataService.saveSpeakers(spks);
    setSpeakers(spks);
  };

  const handleSaveMerchandiseConfig = async (cfg) => {
    await DataService.saveMerchandiseConfig(cfg);
    setMerchandiseConfig(cfg);
  };

  const handleSaveMerchandiseOrder = async (order) => {
    const saved = await DataService.saveMerchandiseOrder(order);
    const updated = await DataService.getMerchandiseOrders();
    setMerchandiseOrders(updated);
    return saved;
  };

  const handleUpdateMerchandiseOrder = async (orderId, patch) => {
    await DataService.updateMerchandiseOrder(orderId, patch);
    const updated = await DataService.getMerchandiseOrders();
    setMerchandiseOrders(updated);
  };

  const handleVerifyOrderPayment = async (orderId, isApproved, adminNotes) => {
    // 1. Instant optimistic update in React state (0ms)
    setMerchandiseOrders(prev => prev.map(o => 
      (o.id === orderId || o.order_number === orderId)
        ? { 
            ...o, 
            payment_status: isApproved ? 'paid_verified' : 'rejected', 
            slip_admin_notes: adminNotes, 
            pickup_status: isApproved ? 'ready' : 'pending', 
            updated_at: new Date().toISOString() 
          }
        : o
    ));
    // 2. Persist in background
    await DataService.verifyOrderPayment(orderId, isApproved, adminNotes);
  };

  const handleMarkOrderReceived = async (orderId, adminName, status = 'received') => {
    // 1. Instant optimistic update in React state (0ms)
    const now = status === 'received' ? new Date().toISOString() : null;
    const admin = status === 'received' ? (adminName || 'Admin JRE 2027') : null;
    setMerchandiseOrders(prev => prev.map(o => 
      (o.id === orderId || o.order_number === orderId)
        ? { ...o, pickup_status: status, pickup_at: now, pickup_by_admin: admin, updated_at: new Date().toISOString() }
        : o
    ));
    // 2. Persist in background
    await DataService.markOrderReceived(orderId, adminName, status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-rescue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wider text-slate-300">
          กำลังเตรียมระบบ JRE 2027 มหาวิทยาลัยมหาสารคาม...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rescue-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        currentSubRoute={currentSubRoute}
        setCurrentTab={setCurrentTab}
        user={user}
        isAdmin={isAdmin}
        onOpenGoogleLogin={() => setGoogleModalOpen(true)}
        onOpenAdminLogin={() => setAdminModalOpen(true)}
        onLogout={handleLogout}
        onAdminLogout={handleAdminLogout}
        myRegistration={myRegistration}
        formsConfig={formsConfig}
        onOpenNotifications={() => setUserNotificationsOpen(true)}
      />

      {/* Forms Banner (Shows ONLY when user is logged in AND Admin activates Pre-test, Post-test, or Eval, and not on register/dashboard view where cards are already prominent) */}
      {user && currentTab !== 'register' && <FormsBanner formsConfig={formsConfig} user={user} />}

      {/* Main Content Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 overflow-x-hidden">
        {currentTab === 'home' && (
          <HomeView
            teamMembers={teamMembers}
            speakers={speakers}
            onNavigateRegister={() => setCurrentTab(myRegistration ? 'dashboard' : 'register')}
            onNavigateSchedule={() => setCurrentTab('schedule')}
            onNavigateMerchandise={() => setCurrentTab('merchandise')}
            myRegistration={myRegistration}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
          />
        )}

        {currentTab === 'schedule' && (
          <ScheduleView />
        )}

        {currentTab === 'register' && (
          <RegisterView
            user={user}
            myRegistration={myRegistration}
            onSaveRegistration={handleSaveRegistration}
            onUpdateRegistration={handleUpdateRegistration}
            onDeleteRegistration={handleDeleteRegistration}
            onUpdateUser={setUser}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
            formsConfig={formsConfig}
            paymentConfig={paymentConfig}
            subRoute={currentSubRoute}
            onSubRouteChange={(sub) => {
              setCurrentTab('register', sub);
            }}
          />
        )}

        {(currentTab === 'announcements' || currentTab === 'pr' || currentTab === 'orders') && (
          <AnnouncementsView 
            announcements={announcements} 
            user={user}
            myRegistration={myRegistration}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
            onNavigateRegister={() => setCurrentTab(myRegistration ? 'dashboard' : 'register')}
            initialScope={currentSubRoute === 'public' || currentTab === 'pr' ? 'public' : currentSubRoute === 'members' || currentTab === 'orders' ? 'members' : 'all'}
            initialPostId={route.postId || null}
            onScopeChange={(scope) => {
              if (scope === 'public') setCurrentTab('announcements', 'public', { clearPostId: true });
              else if (scope === 'members') setCurrentTab('announcements', 'members', { clearPostId: true });
              else setCurrentTab('announcements', 'all', { clearPostId: true });
            }}
          />
        )}

        {(currentTab === 'merchandise' || currentTab === 'shop' || currentTab === 'store') && (
          <MerchandiseView
            user={user}
            myRegistration={myRegistration}
            merchandiseConfig={merchandiseConfig}
            orders={merchandiseOrders}
            onSaveOrder={handleSaveMerchandiseOrder}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
            onNavigateRegister={() => setCurrentTab(myRegistration ? 'dashboard' : 'register')}
            initialTab={currentSubRoute === 'my_orders' || currentSubRoute === 'cart' ? 'my_orders' : 'catalog'}
            onTabChange={(tab) => {
              if (tab === 'my_orders' || tab === 'orders' || tab === 'cart') setCurrentTab('merchandise', 'my_orders');
              else setCurrentTab('merchandise', 'catalog');
            }}
          />
        )}

        {currentTab === 'admin' && isAdmin && (
          <AdminDashboardView
            initialTab={currentSubRoute || 'applicants'}
            onTabChange={(tab) => {
              setCurrentTab('admin', tab);
            }}
            registrations={registrations}
            onUpdateAllocation={handleUpdateAllocation}
            onDeleteRegistration={handleDeleteRegistration}
            announcements={announcements}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            formsConfig={formsConfig}
            onSaveFormsConfig={handleSaveFormsConfig}
            paymentConfig={paymentConfig}
            onSavePaymentConfig={handleSavePaymentConfig}
            teamMembers={teamMembers}
            onSaveTeam={handleSaveTeam}
            speakers={speakers}
            onSaveSpeakers={handleSaveSpeakers}
            merchandiseConfig={merchandiseConfig}
            onSaveMerchandiseConfig={handleSaveMerchandiseConfig}
            merchandiseOrders={merchandiseOrders}
            onUpdateMerchandiseOrder={handleUpdateMerchandiseOrder}
            onVerifyOrderPayment={handleVerifyOrderPayment}
            onMarkOrderReceived={handleMarkOrderReceived}
            userAccounts={userAccounts}
            onRefreshUserAccounts={refreshUserAccounts}
            onRefreshRegistrations={refreshRegistrations}
            onAdminLogout={handleAdminLogout}
          />
        )}

        {currentTab === 'admin' && !isAdmin && (
          <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
            <div className="w-16 h-16 bg-purple-600/20 border border-purple-500/40 rounded-3xl mx-auto flex items-center justify-center text-purple-400 shadow-xl shadow-purple-600/20">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">ระบบควบคุมสำหรับผู้ดูแลระบบ (Admin)</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                หน้านี้สงวนสิทธิ์เฉพาะคณะกรรมการและผู้ดูแลระบบโครงการ JRE 2027 เท่านั้น
              </p>
            </div>
            <button
              onClick={() => setAdminModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition-all cursor-pointer"
            >
              เข้าสู่ระบบ Admin (Admin Login)
            </button>
          </div>
        )}

        {currentTab === 'users' && (
          <UserProfileView
            userUid={currentSubRoute}
            currentUser={user}
            isAdmin={isAdmin}
            registrations={registrations}
            merchandiseOrders={merchandiseOrders}
            userAccounts={userAccounts}
            onOpenAdminLogin={() => setAdminModalOpen(true)}
            onNavigateHome={() => setCurrentTab('home')}
            onNavigateAdmin={() => setCurrentTab('admin', 'users')}
            onNavigateRegister={() => setCurrentTab('register')}
          />
        )}

        {currentTab === 'id-card' && (
          <IDCardView
            user={user}
            registration={myRegistration}
            onNavigateDashboard={() => setCurrentTab('dashboard')}
            onNavigateRegister={() => setCurrentTab('register')}
          />
        )}

        {currentTab === 'security' && (
          <SecurityAuditView
            subRoute={currentSubRoute}
            onSwitchSubRoute={(sub) => setCurrentTab('security', sub)}
            onNavigateHome={() => setCurrentTab('home')}
            onNavigateAdmin={() => setCurrentTab('admin')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenAdminLogin={() => setAdminModalOpen(true)} />

      {/* Modals */}
      <GoogleLoginModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onLoginSuccess={handleGoogleLoginSuccess}
      />

      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Participant Notification Inbox Modal */}
      <UserNotificationsModal
        isOpen={userNotificationsOpen}
        onClose={() => setUserNotificationsOpen(false)}
        myRegistration={myRegistration}
        onUpdateRegistration={handleUpdateRegistration}
      />

      {/* Vercel Web Analytics & Speed Insights */}
      <Analytics />
      <SpeedInsights />

    </div>
  );
}
