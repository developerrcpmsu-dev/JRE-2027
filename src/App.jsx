import React, { useState, useEffect, useRef } from 'react';
import { Award, Lock } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FormsBanner from './components/FormsBanner';
import GoogleLoginModal from './components/GoogleLoginModal';
import AdminLoginModal from './components/AdminLoginModal';
import UserNotificationsModal from './components/UserNotificationsModal';
import UniversalScannerModal from './components/UniversalScannerModal';
import HomeView from './views/HomeView';
import ScheduleView from './views/ScheduleView';
import RegisterView from './views/RegisterView';
import AnnouncementsView from './views/AnnouncementsView';
import AdminDashboardView from './views/AdminDashboardView';
import MerchandiseView from './views/MerchandiseView';
import AuthPortalView from './views/AuthPortalView';
import UserProfileView from './views/UserProfileView';
import IDCardView from './views/IDCardView';
import MyRoomView from './views/MyRoomView';
import SecurityAuditView from './views/SecurityAuditView';
import GroupChatView from './views/GroupChatView';
import { DataService, supabase, isSupabaseConfigured, subscribeToRealtimeChanges, broadcastRealtimeChange } from './supabase';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { parseCurrentRoute, getPathForRoute, syncUrlToRoute } from './utils/router';
import { decodeJwtResponse } from './utils/googleAuth';
import { forceUnlockAll } from './utils/scrollLock';
import { getRegistrationScheduleStatus } from './utils/registrationSchedule';
import { isAuthorizedStaffOrAdminEmail, INITIAL_STAFF_ADMIN_ACCOUNTS, KNOWN_EMAIL_ALIASES } from './data/defaultData';

const DEV_ADMIN_EMAIL = 'developer.rcpmsu@gmail.com';
const isGoogleDevIdentity = (identity, whitelist = INITIAL_STAFF_ADMIN_ACCOUNTS) => {
  if (!identity) return false;
  const role = identity?.role || identity?.user_metadata?.role;
  if (['dev', 'admin', 'staff'].includes(role)) return true;
  const email = String(identity?.email || identity?.user_metadata?.email || '').trim().toLowerCase();
  if (email === DEV_ADMIN_EMAIL || email === 'admin@admin.com') return true;
  const authAccount = isAuthorizedStaffOrAdminEmail(email, whitelist);
  if (authAccount && ['dev', 'admin', 'staff'].includes(authAccount.role)) return true;
  return false;
};

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
    } else if (newTab === 'my-room' || newTab === 'room-status' || newTab === 'dorm-status' || newTab === 'my-group' || newTab === 'assignment') {
      main = 'my-room';
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
    } else if (newTab === 'catering' || newTab === 'health' || newTab === 'catering-health' || newTab === 'welfare') {
      main = 'admin';
      sub = 'catering';
    } else if (newTab === 'security' || newTab === 'security-audit' || newTab === 'audit') {
      main = 'security';
      sub = newSubRoute || 'audit';
    }

    syncUrlToRoute(main, sub, false, options);
    setRoute(parseCurrentRoute());
  };

  // Sync browser back/forward buttons and hash navigation
  useEffect(() => {
    // If user arrived with incident route, redirect immediately to clean home path
    if (window.location.pathname.toLowerCase().startsWith('/incident')) {
      window.history.replaceState({ mainTab: 'home', subRoute: null }, '', '/');
    }

    // Do NOT wipe or normalize URL if Google OAuth tokens or callback parameters are present
    const hasOAuthParams = typeof window !== 'undefined' && (
      (window.location.hash && (
        window.location.hash.includes('access_token=') || 
        window.location.hash.includes('id_token=') || 
        window.location.hash.includes('error=')
      )) ||
      (window.location.search && (
        window.location.search.includes('access_token=') || 
        window.location.search.includes('id_token=') || 
        window.location.search.includes('code=') ||
        window.location.search.includes('error=')
      ))
    );

    // If user arrived with legacy ?tab= or hash, normalize immediately to clean path
    const initial = parseCurrentRoute();
    if (!hasOAuthParams && (window.location.search.includes('tab=') || window.location.hash)) {
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

  const [publicScannerOpen, setPublicScannerOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname.toLowerCase();
    const s = new URLSearchParams(window.location.search);
    return p.startsWith('/verify') || p.startsWith('/qr-verify') || p.startsWith('/check-badge') || Boolean(s.get('badge'));
  });

  const [publicScannerInitialQuery, setPublicScannerInitialQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    const p = window.location.pathname.toLowerCase();
    const s = new URLSearchParams(window.location.search);
    if (p.startsWith('/verify') || p.startsWith('/qr-verify') || p.startsWith('/check-badge') || s.get('badge')) {
      return window.location.href;
    }
    return '';
  });

  const [user, setUser] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_auth_user');
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {}
    return null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem('jre2027_admin_logged_out') === 'true') return false;
        const token = sessionStorage.getItem('jre2027_admin_token');
        const expires = Number(sessionStorage.getItem('jre2027_admin_expires') || 0);
        if (token && expires && Date.now() < expires) return true;
      }
    } catch (e) {}
    return false;
  });
  const [devGoogleSignedIn, setDevGoogleSignedIn] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem('jre2027_admin_logged_out') === 'true') return false;
        const token = sessionStorage.getItem('jre2027_admin_token');
        const expires = Number(sessionStorage.getItem('jre2027_admin_expires') || 0);
        if (token && expires && Date.now() < expires) return true;
      }
    } catch (e) {}
    return false;
  });
  const [staffAdminWhitelist, setStaffAdminWhitelist] = useState(INITIAL_STAFF_ADMIN_ACCOUNTS);
  const [devAdminLoading, setDevAdminLoading] = useState(false);
  const [devAdminError, setDevAdminError] = useState('');

  // Modals
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [userNotificationsOpen, setUserNotificationsOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Data (Instant cache hydration to eliminate delay / (0) flash)
  const [registrations, setRegistrations] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && typeof localStorage !== 'undefined') {
        const token = sessionStorage.getItem('jre2027_admin_token');
        const expires = Number(sessionStorage.getItem('jre2027_admin_expires') || 0);
        const rawUser = localStorage.getItem('jre2027_auth_user');
        const usr = rawUser ? JSON.parse(rawUser) : null;
        const hasAdmin = Boolean((token && expires && Date.now() < expires) || isGoogleDevIdentity(usr));
        const raw = localStorage.getItem('jre2027_registrations');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (hasAdmin) return parsed;
          if (usr) {
            const uid = usr.id;
            const uemail = usr.email?.toLowerCase().trim();
            return parsed.filter(r => (uid && (r.user_id === uid || r.id === uid)) || (uemail && r.user_email?.toLowerCase().trim() === uemail));
          }
        }
      }
    } catch (e) {}
    return [];
  });
  const [myRegistration, setMyRegistration] = useState(null);
  const [announcements, setAnnouncements] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_announcements');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [formsConfig, setFormsConfig] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_forms_config');
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {}
    return null;
  });
  const [paymentConfig, setPaymentConfig] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_payment_config');
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {}
    return null;
  });
  const [merchandiseConfig, setMerchandiseConfig] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_merchandise_config');
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {}
    return null;
  });
  const [merchandiseOrders, setMerchandiseOrders] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_merchandise_orders');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_team');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [speakers, setSpeakers] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('jre2027_speakers');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [userAccounts, setUserAccounts] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && typeof localStorage !== 'undefined') {
        const token = sessionStorage.getItem('jre2027_admin_token');
        const expires = Number(sessionStorage.getItem('jre2027_admin_expires') || 0);
        const rawUser = localStorage.getItem('jre2027_auth_user');
        const usr = rawUser ? JSON.parse(rawUser) : null;
        if ((token && expires && Date.now() < expires) || isGoogleDevIdentity(usr)) {
          const raw = localStorage.getItem('jre2027_user_accounts');
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(true);

  // Helper to normalize Thai/English names for robust user-to-registration matching
  const normalizePersonName = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/^(นาย|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.|นาง)/g, '')
      .replace(/^(mr\.|mrs\.|ms\.)/gi, '')
      .replace(/\s+/g, '')
      .toLowerCase()
      .trim();
  };

  // Helper to match registration robustly (by user_id, case-insensitive email, known aliases, normalized name, committee key, or phone)
  const matchRegistration = (userTarget, regList) => {
    if (!userTarget || !Array.isArray(regList) || regList.length === 0) return null;
    const targetEmail = userTarget.email?.toLowerCase().trim();
    const targetId = userTarget.id;
    const targetNameNorm = normalizePersonName(userTarget.name || userTarget.user_metadata?.full_name);
    const targetPhone = userTarget.phone ? String(userTarget.phone).replace(/[^0-9]/g, '') : '';

    // 1. Direct match by user_id or registration id
    let matched = regList.find(r => targetId && (r.user_id === targetId || r.id === targetId));

    // 2. Direct case-insensitive email match
    if (!matched && targetEmail) {
      matched = regList.find(r => r.user_email?.toLowerCase().trim() === targetEmail);
    }

    // 3. Known dual-email & alias cross-mapping match
    if (!matched && targetEmail && KNOWN_EMAIL_ALIASES[targetEmail]) {
      const aliases = KNOWN_EMAIL_ALIASES[targetEmail];
      matched = regList.find(r => {
        const rEmail = (r.user_email || '').toLowerCase().trim();
        const rKey = r.committee_member_key || '';
        return (rEmail && aliases.includes(rEmail)) || (rKey && aliases.includes(rKey)) || aliases.includes(r.id);
      });
    }

    // 4. Normalized Full Name Matching (e.g. Google full name matching registration Thai name)
    if (!matched && targetNameNorm && targetNameNorm.length >= 4) {
      matched = regList.find(r => {
        const rFullName = `${r.first_name || ''}${r.last_name || ''}` || r.full_name || '';
        const rNameNorm = normalizePersonName(rFullName);
        return rNameNorm && (rNameNorm === targetNameNorm || rNameNorm.includes(targetNameNorm) || targetNameNorm.includes(rNameNorm));
      });
    }

    // 5. Phone number matching (if available)
    if (!matched && targetPhone && targetPhone.length >= 9) {
      matched = regList.find(r => {
        const rPhone = (r.phone || '').replace(/[^0-9]/g, '');
        return rPhone && rPhone === targetPhone;
      });
    }

    // Auto-sync email into registration in background if registration was missing email
    if (matched && targetEmail && (!matched.user_email || matched.user_email.toLowerCase().trim() !== targetEmail)) {
      if (!matched.user_email || matched.user_email === '') {
        matched.user_email = targetEmail;
        DataService.updateRegistrationDetails(matched.id, { user_email: targetEmail }).catch(() => {});
      }
    }

    return matched || null;
  };

  // Load Initial Data & Sessions
  useEffect(() => {
    async function loadData() {
      try {
        const adminLoggedOut = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jre2027_admin_logged_out') === 'true';
        const adminToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_token') : null;
        const adminExpires = Number(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_expires') || 0 : 0);
        let hasValidAdminSession = !adminLoggedOut && Boolean(adminToken && adminExpires && Date.now() < adminExpires);

        const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('jre2027_auth_user') : null;
        let initialUser = null;
        if (storedUser) {
          try {
            initialUser = JSON.parse(storedUser);
          } catch (e) {}
        }

        if (hasValidAdminSession) {
          setIsAdmin(true);
          setDevGoogleSignedIn(true);
        } else {
          setIsAdmin(false);
          setDevGoogleSignedIn(false);
        }

        // =====================================================================
        // STEP 1: Process Google OAuth Direct Redirect Callback (#access_token=... or #id_token=... or ?access_token=...)
        // Must run FIRST so the newly authenticated identity is established before any data fetching
        // =====================================================================
        let authenticatedUser = initialUser;

        if (typeof window !== 'undefined') {
          const rawHash = window.location.hash ? window.location.hash.substring(1) : '';
          const rawSearch = window.location.search ? window.location.search.substring(1) : '';
          const hashParams = new URLSearchParams(rawHash);
          const searchParams = new URLSearchParams(rawSearch);

          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const idToken = hashParams.get('id_token') || searchParams.get('id_token');
          const oauthState = hashParams.get('state') || searchParams.get('state');

          if (accessToken || idToken) {
            try {
              let cleanEmail = null;
              let cleanName = null;
              let avatar = null;

              if (idToken) {
                const payload = decodeJwtResponse(idToken);
                if (payload?.email) {
                  cleanEmail = payload.email.trim().toLowerCase();
                  cleanName = payload.name || cleanEmail.split('@')[0];
                  avatar = payload.picture || (`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`);
                }
              }

              if (!cleanEmail && accessToken) {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const profile = await res.json();
                if (profile?.email) {
                  cleanEmail = profile.email.trim().toLowerCase();
                  cleanName = profile.name || cleanEmail.split('@')[0];
                  avatar = profile.picture || (`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`);
                }
              }

              if (cleanEmail) {
                const userObj = await DataService.loginWithGoogleProfile({
                  name: cleanName,
                  email: cleanEmail,
                  avatar: avatar,
                  googleIdToken: idToken || null,
                  googleAccessToken: accessToken || null
                });
                authenticatedUser = userObj;
                localStorage.setItem('jre2027_auth_user', JSON.stringify(userObj));
                setUser(userObj);

                // Restore saved route if any
                const sessionReturn = sessionStorage.getItem('jre2027_auth_return_url');
                sessionStorage.removeItem('jre2027_auth_return_url');
                const targetReturn = sessionReturn || (oauthState ? decodeURIComponent(oauthState) : null);

                if (targetReturn && targetReturn !== '/' && targetReturn.startsWith('/')) {
                  window.history.replaceState(null, '', targetReturn);
                  setRoute(parseCurrentRoute());
                } else {
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }
            } catch (oauthErr) {
              console.warn('OAuth redirect hash parse error:', oauthErr);
            }
          }
        }

        if (authenticatedUser) {
          setUser(authenticatedUser);
          if (isGoogleDevIdentity(authenticatedUser)) {
            hasValidAdminSession = true;
            setDevGoogleSignedIn(true);
            setIsAdmin(true);
          }
        }

        // =====================================================================
        // STEP 2: Load Central Data (Scoped to Authenticated User)
        // =====================================================================
        const [regs, anns, forms, payCfg, merchCfg, merchOrds, team, spks, accs, staffAccounts] = await Promise.all([
          hasValidAdminSession
            ? DataService.getRegistrations({ admin: true })
            : (authenticatedUser ? DataService.getRegistrations({ userId: authenticatedUser.id, email: authenticatedUser.email }) : DataService.getRegistrations()),
          DataService.getAnnouncements(),
          DataService.getFormsConfig(),
          DataService.getPaymentConfig(),
          DataService.getMerchandiseConfig(),
          DataService.getMerchandiseOrders(),
          DataService.getTeam(),
          DataService.getSpeakers(),
          hasValidAdminSession ? DataService.getUserAccounts({ admin: true }) : Promise.resolve([]),
          DataService.getStaffAdminAccounts()
        ]);

        if (Array.isArray(regs)) setRegistrations(regs);
        if (Array.isArray(anns)) setAnnouncements(anns);
        if (forms) setFormsConfig(forms);
        if (payCfg) setPaymentConfig(payCfg);
        if (merchCfg) setMerchandiseConfig(merchCfg);
        if (Array.isArray(merchOrds)) setMerchandiseOrders(merchOrds);
        if (Array.isArray(team)) setTeamMembers(team);
        if (Array.isArray(spks)) setSpeakers(spks);
        if (Array.isArray(accs)) setUserAccounts(accs || []);
        if (Array.isArray(staffAccounts) && staffAccounts.length > 0) setStaffAdminWhitelist(staffAccounts);

        // =====================================================================
        // STEP 3: Match & Link User Registration
        // =====================================================================
        localStorage.removeItem('jre2027_is_admin');

        const activeUserToMatch = authenticatedUser;
        if (activeUserToMatch) {
          const found = matchRegistration(activeUserToMatch, regs);
          if (found) {
            setMyRegistration(found);
          } else {
            const ownRegistration = await DataService.getRegistrationByUserId(activeUserToMatch.id, activeUserToMatch.email);
            if (ownRegistration) {
              setMyRegistration(ownRegistration);
              setRegistrations(prev => {
                const exists = prev.some(r => r.id === ownRegistration.id);
                return exists ? prev : [ownRegistration, ...prev];
              });
            }
          }
        }

        // 3. Strict Admin Session Verification:
        // Admin access is verified via active session tokens (respects explicit user logout)
        const isExplicitlyLoggedOut = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jre2027_admin_logged_out') === 'true';
        if (!isExplicitlyLoggedOut && hasValidAdminSession && adminToken) {
          setIsAdmin(true);
          setDevGoogleSignedIn(true);
        } else {
          setIsAdmin(false);
          setDevGoogleSignedIn(false);
        }

        // Supabase Auth listener if configured
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: verifiedIdentity } = await supabase.auth.getUser();
            const isDev = isGoogleDevIdentity(verifiedIdentity?.user || session.user);
            setDevGoogleSignedIn(isDev);
            if (isDev) {
              setIsAdmin(true);
            }
            const u = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              email: session.user.email,
              avatar: session.user.user_metadata?.avatar_url,
              provider: 'google',
              role: isDev ? 'admin' : 'applicant'
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
              const isDev = isGoogleDevIdentity(session.user);
              setDevGoogleSignedIn(isDev);
              if (isDev) {
                setIsAdmin(true);
              }
              const u = {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                email: session.user.email,
                avatar: session.user.user_metadata?.avatar_url,
                provider: 'google',
                role: isDev ? 'admin' : 'applicant'
              };
              setUser(u);
              localStorage.setItem('jre2027_auth_user', JSON.stringify(u));
              DataService.getRegistrationByUserId(u.id, u.email).then((ownRegistration) => {
                if (ownRegistration) setMyRegistration(ownRegistration);
              });
            } else if (!storedUser) {
              setDevGoogleSignedIn(false);
              setUser(null);
            } else {
              setDevGoogleSignedIn(isGoogleDevIdentity(initialUser));
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

  // Keep the group-chat badge current without loading chat content into registrations.
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured || !supabase) {
      setChatUnreadCount(0);
      return undefined;
    }
    let cancelled = false;
    let channel = null;
    const initializeUnreadNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUserId = session?.user?.id;
        if (!authUserId || session?.user?.email?.toLowerCase().trim() !== user?.email?.toLowerCase().trim()) {
          if (!cancelled) setChatUnreadCount(0);
          return;
        }

        const refreshUnreadCount = async () => {
          try {
        const { data: isMember, error: memberError } = await supabase.rpc('jre_chat_is_member');
        if (memberError || !isMember) {
          if (!cancelled) setChatUnreadCount(0);
          return;
        }
        const { data: unreadCandidates, error: messagesError } = await supabase
          .from('group_chat_messages')
          .select('id,author_user_id')
          .neq('author_user_id', authUserId)
          .order('created_at', { ascending: false })
          .limit(100);
        if (messagesError) throw messagesError;
        const ids = (unreadCandidates || []).map(message => message.id);
        if (!ids.length) {
          if (!cancelled) setChatUnreadCount(0);
          return;
        }
        const { data: readRows, error: receiptsError } = await supabase
          .from('group_chat_read_receipts')
          .select('message_id')
          .eq('user_id', authUserId)
          .in('message_id', ids);
        if (receiptsError) throw receiptsError;
        if (!cancelled) setChatUnreadCount(Math.max(0, ids.length - new Set((readRows || []).map(row => row.message_id)).size));
          } catch (error) {
            console.warn('Group chat unread count unavailable:', error.message || error);
          }
        };

        await refreshUnreadCount();
        if (cancelled) return;
        channel = supabase.channel(`jre-chat-notifications-${authUserId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'group_chat_messages' }, payload => {
            refreshUnreadCount();
            if (payload.eventType === 'INSERT' && payload.new?.author_user_id !== authUserId && currentTab !== 'chat' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(payload.new.author_name || 'สมาชิก JRE', {
                body: payload.new.message_text || 'ส่งรูปภาพในแชทกลุ่ม',
                icon: user.avatar || '/images/logo/jre_logo.png',
                tag: `jre-chat-${payload.new.id}`,
                data: { url: `${window.location.origin}/chat` }
              });
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'group_chat_read_receipts', filter: `user_id=eq.${authUserId}` }, refreshUnreadCount)
          .subscribe();
      } catch (error) {
        console.warn('Group chat notifications unavailable:', error.message || error);
      }
    };

    initializeUnreadNotifications();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email, user?.avatar, currentTab]);

  // Realtime Data Synchronization Engine
  const isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

  const refreshRegistrations = async () => {
    try {
      const adminToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_token') : null;
      const adminExpires = Number(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_expires') || 0 : 0);
      const hasAdmin = isAdmin || isGoogleDevIdentity(user) || Boolean(adminToken && adminExpires && Date.now() < adminExpires);

      const updated = hasAdmin
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

  const realtimeDebounceTimers = useRef({});

  const refreshUserAccounts = async () => {
    try {
      const adminToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_token') : null;
      const adminExpires = Number(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_expires') || 0 : 0);
      const hasAdmin = isAdmin || isGoogleDevIdentity(user) || Boolean(adminToken && adminExpires && Date.now() < adminExpires);

      // Only query accounts if admin or logged-in user to save bandwidth and prevent unneeded queries
      if (!hasAdmin && !user) {
        return [];
      }

      const updated = await DataService.getUserAccounts({ 
        admin: hasAdmin,
        userId: hasAdmin ? null : user?.id,
        email: hasAdmin ? null : user?.email
      });
      if (Array.isArray(updated)) {
        setUserAccounts(prev => isDifferent(prev, updated) ? updated : prev);
        return updated;
      }
    } catch (e) {}
    return [];
  };

  const refreshCoreData = async () => {
    const tasks = [
      refreshRegistrations(),
      refreshAnnouncements(),
      refreshMerchandiseOrders()
    ];
    if (isAdmin || isGoogleDevIdentity(user)) {
      tasks.push(refreshUserAccounts());
    }
    await Promise.allSettled(tasks);
  };

  const refreshAllData = async () => {
    const adminToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_token') : null;
    const adminExpires = Number(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('jre2027_admin_expires') || 0 : 0);
    const hasAdmin = isAdmin || isGoogleDevIdentity(user) || Boolean(adminToken && adminExpires && Date.now() < adminExpires);

    const tasks = [
      refreshRegistrations(),
      refreshAnnouncements(),
      refreshMerchandiseOrders(),
      refreshPaymentConfig(),
      refreshFormsConfig(),
      refreshMerchandiseConfig(),
      refreshTeam(),
      refreshSpeakers()
    ];
    if (hasAdmin) {
      tasks.push(refreshUserAccounts());
    }
    await Promise.allSettled(tasks);
  };

  const handleRealtimeChange = (detail) => {
    const type = detail?.type || 'all';

    // Debounce realtime refreshes by 800ms per entity type to prevent event storming and ping-pong loops
    if (realtimeDebounceTimers.current[type]) {
      clearTimeout(realtimeDebounceTimers.current[type]);
    }

    realtimeDebounceTimers.current[type] = setTimeout(() => {
      delete realtimeDebounceTimers.current[type];
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
    }, 800);
  };

  // Realtime listeners & background heartbeat polling
  useEffect(() => {
    // 1. Subscribe to instant realtime broadcasts (local tabs + cloud websocket)
    const unsubscribe = subscribeToRealtimeChanges((payload) => {
      handleRealtimeChange(payload);
    });

    let isPolling = false;
    let lastPollTime = Date.now();

    const pollSafe = async (force = false) => {
      const now = Date.now();
      // Debounce polling by at least 15 seconds to avoid network hammering
      if (!force && now - lastPollTime < 15000) return;
      if (isPolling) return;
      isPolling = true;
      lastPollTime = now;
      try {
        await refreshCoreData();
      } finally {
        isPolling = false;
      }
    };

    // 2. Check on visibilitychange & window focus (debounced)
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

    // 3. Heartbeat convergence timer (every 45s active, 120s in background)
    const activeTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollSafe(true);
      }
    }, 45000);

    const bgTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        pollSafe(true);
      }
    }, 120000);

    return () => {
      unsubscribe();
      clearInterval(activeTimer);
      clearInterval(bgTimer);
      window.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('focus', handleFocus);
      Object.values(realtimeDebounceTimers.current).forEach(clearTimeout);
    };
  }, [user?.id, isAdmin]);

  // When admin session is active or when switching to admin tab, refresh registrations & user accounts immediately
  useEffect(() => {
    if (isAdmin || isGoogleDevIdentity(user) || currentTab === 'admin') {
      refreshRegistrations();
      refreshUserAccounts();
    }
  }, [isAdmin, user?.email, currentTab]);

  // Auth Handlers
  const handleGoogleLoginSuccess = async (userObj) => {
    setUser(userObj);
    const isDev = isGoogleDevIdentity(userObj);
    if (isDev) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('jre2027_admin_logged_out');
        sessionStorage.setItem('jre2027_admin_active', 'true');
        sessionStorage.setItem('jre2027_admin_token', `admin_pass_${Date.now()}`);
        sessionStorage.setItem('jre2027_admin_expires', String(Date.now() + 24 * 3600 * 1000));
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jre2027_is_admin', 'true');
      }
      setDevGoogleSignedIn(true);
      setIsAdmin(true);
      const [adminRegistrations, adminAccounts] = await Promise.all([
        DataService.getRegistrations({ admin: true }),
        DataService.getUserAccounts({ admin: true })
      ]);
      setRegistrations(adminRegistrations);
      setUserAccounts(adminAccounts);
    } else if (isSupabaseConfigured && supabase) {
      try {
        const { data: verifiedIdentity } = await supabase.auth.getUser();
        const verifiedDev = isGoogleDevIdentity(verifiedIdentity?.user);
        setDevGoogleSignedIn(verifiedDev);
        if (verifiedDev) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('jre2027_admin_logged_out');
          }
          setIsAdmin(true);
        }
      } catch {
        setDevGoogleSignedIn(false);
      }
    }
    const found = matchRegistration(userObj, registrations);
    if (found) {
      setMyRegistration(found);
    } else {
      const ownRegistration = await DataService.getRegistrationByUserId(userObj.id, userObj.email);
      if (ownRegistration) setMyRegistration(ownRegistration);
    }
  };

  const handleAdminLoginSuccess = async () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('jre2027_admin_logged_out');
      sessionStorage.setItem('jre2027_admin_active', 'true');
      sessionStorage.setItem('jre2027_admin_token', `sso_google_${Date.now()}`);
      sessionStorage.setItem('jre2027_admin_expires', String(Date.now() + 24 * 3600 * 1000));
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('jre2027_is_admin', 'true');
    }
    setIsAdmin(true);
    setDevGoogleSignedIn(true);
    const [adminRegistrations, adminAccounts] = await Promise.all([
      DataService.getRegistrations({ admin: true }),
      DataService.getUserAccounts({ admin: true })
    ]);
    setRegistrations(adminRegistrations);
    setUserAccounts(adminAccounts);
    setCurrentTab('admin', currentSubRoute || 'applicants');
  };

  const handleDevAdminLogin = async () => {
    if (devAdminLoading) return;
    setDevAdminLoading(true);
    setDevAdminError('');
    try {
      let supabaseAccessToken = null;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          supabaseAccessToken = sessionData?.session?.access_token || null;
        } catch (e) {}
      }

      if (supabaseAccessToken) {
        const response = await fetch('/api/admin-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'dev_google_login',
            supabaseAccessToken
          })
        }).catch(() => null);
        const result = response ? await response.json().catch(() => ({})) : {};
        if (response?.ok && result.success && result.token) {
          sessionStorage.setItem('jre2027_admin_token', result.token);
          sessionStorage.setItem('jre2027_admin_expires', String(result.expiresAt));
        }
      }

      if (isGoogleDevIdentity(user) || devGoogleSignedIn) {
        await handleAdminLoginSuccess();
        return;
      }

      throw new Error('กรุณาเข้าสู่ระบบด้วย Google บัญชี developer.rcpmsu@gmail.com ก่อน');
    } catch (error) {
      setDevAdminError(error.message || 'เข้า Admin ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setDevAdminLoading(false);
    }
  };

  const handleAdminEntry = () => {
    if (isAdmin) {
      setCurrentTab('admin', 'applicants');
      return;
    }
    if (!user) {
      setGoogleModalOpen(true);
      return;
    }
    setAdminModalOpen(true);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    setIsAdmin(false);
    setDevGoogleSignedIn(false);
    localStorage.removeItem('jre2027_auth_user');
    localStorage.removeItem('jre2027_is_admin');
    sessionStorage.removeItem('jre2027_admin_token');
    sessionStorage.removeItem('jre2027_admin_expires');
    sessionStorage.removeItem('jre2027_admin_active');
    sessionStorage.removeItem('jre2027_admin_logged_out');
    setMyRegistration(null);
    setCurrentTab('home');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setDevGoogleSignedIn(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('jre2027_admin_logged_out', 'true');
      sessionStorage.removeItem('jre2027_admin_token');
      sessionStorage.removeItem('jre2027_admin_expires');
      sessionStorage.removeItem('jre2027_admin_active');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('jre2027_is_admin');
    }
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
  };

  // Auto-prompt Google login / Admin modal when user accesses /admin route while unauthenticated
  useEffect(() => {
    if (currentTab === 'admin' && !isAdmin && !loading) {
      if (!user) {
        setGoogleModalOpen(true);
      } else if (isGoogleDevIdentity(user, staffAdminWhitelist)) {
        setAdminModalOpen(true);
      } else {
        setCurrentTab('home');
      }
    }
  }, [currentTab, isAdmin, user?.email, loading, staffAdminWhitelist]);

  // Data Mutation Handlers with Strict Access Controls
  const handleSaveRegistration = async (payload) => {
    const hasAdminPrivilege = Boolean(isAdmin || isGoogleDevIdentity(user) || devGoogleSignedIn);
    // SECURITY GUARD: Registration open/close status enforcement
    if (!hasAdminPrivilege && !myRegistration) {
      const schedule = getRegistrationScheduleStatus(paymentConfig);
      if (schedule.isClosed) {
        throw new Error('ขออภัย โครงการ JRE 2027 ได้ปิดรับสมัครแล้วอย่างเป็นทางการ ไม่สามารถส่งใบสมัครใหม่ได้');
      }
      if (schedule.isUpcoming) {
        throw new Error('ขออภัย ระบบรับสมัคร JRE 2027 ยังไม่เปิดให้บริการในขณะนี้');
      }
    }
    // SECURITY GUARD: Ensure applicant cannot spoof another user's identity!
    if (!hasAdminPrivilege && user) {
      payload.user_id = user.id;
      payload.user_email = user.email;
    }
    const saved = await DataService.saveRegistration(payload);
    const updated = hasAdminPrivilege
      ? await DataService.getRegistrations({ admin: true })
      : await DataService.getRegistrations({ userId: payload.user_id, email: payload.user_email });
    setRegistrations(updated);
    if (!user || payload.user_id === user.id || (user.email && payload.user_email === user.email)) {
      setMyRegistration(saved);
    }
    return saved;
  };

  const handleUpdateAllocation = async (userId, allocations) => {
    const hasAdminPrivilege = Boolean(isAdmin || isGoogleDevIdentity(user, staffAdminWhitelist) || devGoogleSignedIn);
    // SECURITY GUARD: Group and room allocations are RESTRICTED to verified Admin!
    if (!hasAdminPrivilege) {
      console.warn('Unauthorized allocation update attempt rejected');
      throw new Error('ไม่มีสิทธิ์ผู้ดูแลระบบหรือเซสชัน Admin หมดอายุ กรุณาเข้าสู่ระบบ Admin ใหม่อีกครั้ง');
    }
    const prevRegistrations = registrations;
    const prevMyRegistration = myRegistration;
    setRegistrations(prev => prev.map(r => 
      (r.user_id === userId || r.id === userId || (r.user_email && r.user_email === userId))
        ? { ...r, ...allocations, updated_at: new Date().toISOString() }
        : r
    ));
    if (user && (user.id === userId || myRegistration?.user_id === userId || myRegistration?.id === userId)) {
      setMyRegistration(prev => prev ? { ...prev, ...allocations } : prev);
    }
    try {
      const saved = await DataService.updateRegistrationAllocations(userId, allocations);
      if (saved === false) {
        throw new Error('ไม่พบรหัสผู้สมัครสำหรับการบันทึกข้อมูล');
      }
      return true;
    } catch (err) {
      setRegistrations(prevRegistrations);
      setMyRegistration(prevMyRegistration);
      throw err;
    }
  };

  const handleUpdateRegistration = async (userId, updates) => {
    const hasAdminPrivilege = Boolean(isAdmin || isGoogleDevIdentity(user, staffAdminWhitelist) || devGoogleSignedIn);
    // SECURITY GUARD: Prevent editing other people's registration records!
    if (!hasAdminPrivilege) {
      if (!user) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนทำการแก้ไขข้อมูล');
      }
      const isOwner = (myRegistration && (myRegistration.user_id === userId || myRegistration.id === userId)) ||
                      (user && (user.id === userId || user.email?.toLowerCase() === String(userId).toLowerCase()));
      if (!isOwner) {
        throw new Error('การเข้าถึงถูกปฏิเสธ: ท่านไม่มีสิทธิ์แก้ไขข้อมูลของผู้สมัครท่านอื่น');
      }
      // If registration has already paid or partial paid, protect institution & fee config,
      // but still allow slip upload payloads to update payment_status -> pending_review / paid!
      if (myRegistration?.payment_status === 'full' || myRegistration?.payment_status === 'installment_1_paid') {
        const isSlipUploadUpdate = Boolean(
          updates.payment_slip_url ||
          updates.installment_1_slip_url ||
          updates.installment_2_slip_url
        );
        if (!isSlipUploadUpdate) {
          delete updates.payment_status;
        }
        delete updates.institution;
        delete updates.fee_total;
        delete updates.payment_type;
      }
    }

    const prevRegistrations = registrations;
    const prevMyRegistration = myRegistration;
    setRegistrations(prev => prev.map(r => 
      (r.user_id === userId || r.id === userId || (r.user_email && r.user_email === userId))
        ? { ...r, ...updates, updated_at: new Date().toISOString() }
        : r
    ));
    if (user && (user.id === userId || myRegistration?.user_id === userId || myRegistration?.id === userId)) {
      setMyRegistration(prev => prev ? { ...prev, ...updates } : prev);
    }
    try {
      const saved = await DataService.updateRegistrationDetails(userId, updates);
      if (saved === false) {
        throw new Error('ไม่สามารถบันทึกการแก้ไขข้อมูลได้');
      }
      return true;
    } catch (err) {
      setRegistrations(prevRegistrations);
      setMyRegistration(prevMyRegistration);
      throw err;
    }
  };

  const handleDeleteRegistration = async (userId) => {
    const hasAdminPrivilege = Boolean(isAdmin || isGoogleDevIdentity(user) || devGoogleSignedIn);
    // SECURITY GUARD: Prevent deleting other people's registrations!
    if (!hasAdminPrivilege) {
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
    const updated = hasAdminPrivilege
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
    const prevOrders = merchandiseOrders;
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
    // 2. Persist and rollback if failed
    try {
      await DataService.verifyOrderPayment(orderId, isApproved, adminNotes);
    } catch (err) {
      setMerchandiseOrders(prevOrders);
      throw err;
    }
  };

  const handleMarkOrderReceived = async (orderId, adminName, status = 'received') => {
    const prevOrders = merchandiseOrders;
    // 1. Instant optimistic update in React state (0ms)
    const now = status === 'received' ? new Date().toISOString() : null;
    const admin = status === 'received' ? (adminName || 'Admin JRE 2027') : null;
    setMerchandiseOrders(prev => prev.map(o => 
      (o.id === orderId || o.order_number === orderId)
        ? { ...o, pickup_status: status, pickup_at: now, pickup_by_admin: admin, updated_at: new Date().toISOString() }
        : o
    ));
    // 2. Persist and rollback if failed
    try {
      await DataService.markOrderReceived(orderId, adminName, status);
    } catch (err) {
      setMerchandiseOrders(prevOrders);
      throw err;
    }
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
        hasStaffPrivilege={Boolean(isGoogleDevIdentity(user, staffAdminWhitelist))}
        onOpenGoogleLogin={() => setGoogleModalOpen(true)}
        onOpenAdminLogin={handleAdminEntry}
        onLogout={handleLogout}
        onAdminLogout={handleAdminLogout}
        myRegistration={myRegistration}
        formsConfig={formsConfig}
        onOpenNotifications={() => setUserNotificationsOpen(true)}
        chatUnreadCount={chatUnreadCount}
      />

      {/* Forms Banner (Shows ONLY when user is logged in AND Admin activates Pre-test, Post-test, or Eval, and not on register/dashboard view where cards are already prominent) */}
      {user && currentTab !== 'register' && <FormsBanner formsConfig={formsConfig} user={user} />}

      {/* Main Content Pages - Full Screen Width on Admin Dashboard & User Dashboard */}
      <main className={`flex-1 w-full mx-auto py-2.5 sm:py-4 lg:py-5 2xl:py-6 transition-all ${
        currentTab === 'admin'
          ? 'w-full max-w-none px-2 sm:px-4 lg:px-6 2xl:px-8'
          : ((currentTab === 'register' && (currentSubRoute === 'dashboard' || Boolean(myRegistration))) || currentTab === 'my-room')
            ? 'w-full max-w-[1680px] px-3 sm:px-5 lg:px-8 2xl:px-10 overflow-x-hidden'
            : 'max-w-7xl px-3 sm:px-6 lg:px-8 overflow-x-hidden'
      }`}>
        {currentTab === 'home' && (
          <HomeView
            teamMembers={teamMembers}
            speakers={speakers}
            onNavigateRegister={() => setCurrentTab(myRegistration ? 'dashboard' : 'register')}
            onNavigateSchedule={() => setCurrentTab('schedule')}
            onNavigateMerchandise={() => setCurrentTab('merchandise')}
            onOpenScanner={() => {
              setPublicScannerInitialQuery('');
              setPublicScannerOpen(true);
            }}
            myRegistration={myRegistration}
            registrations={registrations}
            onUpdateRegistration={handleUpdateRegistration}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
            paymentConfig={paymentConfig}
          />
        )}

        {currentTab === 'schedule' && (
          <ScheduleView />
        )}

        {currentTab === 'chat' && (
          <GroupChatView
            user={user}
            myRegistration={myRegistration}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
          />
        )}

        {currentTab === 'register' && (
          <RegisterView
            user={user}
            isAdmin={isAdmin}
            myRegistration={myRegistration}
            allRegistrations={registrations}
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
            onNavigateMyRoom={() => setCurrentTab('my-room')}
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
            user={user}
            isAdmin={isAdmin}
            initialTab={currentSubRoute || 'applicants'}
            initialMedicalPersonId={route?.personId || null}
            onTabChange={(tab, opts = {}) => {
              setCurrentTab('admin', tab, opts);
            }}
            registrations={registrations}
            onSaveRegistration={handleSaveRegistration}
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
            staffAdminWhitelist={staffAdminWhitelist}
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
            {devGoogleSignedIn ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Award className="w-4 h-4" /> ยืนยันบัญชี Google DEV แล้ว
                </div>
                <button
                  onClick={handleDevAdminLogin}
                  disabled={devAdminLoading}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold rounded-2xl text-sm shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {devAdminLoading ? 'กำลังตรวจสอบสิทธิ์ DEV…' : 'เข้า Admin สำหรับ DEV'}
                </button>
                {devAdminError && <p className="text-rose-300 text-xs">{devAdminError}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setAdminModalOpen(true)}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>เข้าสู่ระบบ Admin (Admin Login)</span>
                </button>
              </div>
            )}
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
            onOpenAdminLogin={handleAdminEntry}
            onNavigateHome={() => setCurrentTab('home')}
            onNavigateAdmin={() => setCurrentTab('admin', 'users')}
            onNavigateRegister={() => setCurrentTab('register')}
            onUpdateRegistration={handleUpdateRegistration}
            triggerToast={triggerToast}
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

        {currentTab === 'my-room' && (
          <MyRoomView
            user={user}
            myRegistration={myRegistration}
            allRegistrations={registrations}
            onUpdateRegistration={handleUpdateRegistration}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
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
      <Footer onOpenAdminLogin={handleAdminEntry} />

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
        user={user}
        staffAdminWhitelist={staffAdminWhitelist}
        onOpenGoogleLogin={() => setGoogleModalOpen(true)}
      />

      {/* Participant Notification Inbox Modal */}
      <UserNotificationsModal
        isOpen={userNotificationsOpen}
        onClose={() => setUserNotificationsOpen(false)}
        myRegistration={myRegistration}
        onUpdateRegistration={handleUpdateRegistration}
      />

      {/* Public & Universal QR Verification / Check-In Scanner Modal (Home Page Button & Direct /verify QR Scan) */}
      {publicScannerOpen && (
        <UniversalScannerModal
          isAdmin={Boolean(isAdmin || isGoogleDevIdentity(user))}
          currentUser={user}
          isDevOperator={isGoogleDevIdentity(user)}
          initialQuery={publicScannerInitialQuery}
          orders={merchandiseOrders}
          registrations={registrations}
          onOpenMedicalPerson={(personId) => {
            if (!(isAdmin || isGoogleDevIdentity(user))) return;
            setPublicScannerOpen(false);
            setCurrentTab('admin', 'medical', { personId });
            if (typeof window !== 'undefined' && personId) {
              window.history.pushState({ mainTab: 'admin', subRoute: 'medical' }, '', `/admin/medical?person=${encodeURIComponent(personId)}`);
              setRoute(parseCurrentRoute());
            }
          }}
          onClose={() => {
            setPublicScannerOpen(false);
            setPublicScannerInitialQuery('');
            if (typeof window !== 'undefined') {
              const p = window.location.pathname.toLowerCase();
              const s = new URLSearchParams(window.location.search);
              if (p.startsWith('/verify') || p.startsWith('/qr-verify') || p.startsWith('/check-badge') || s.get('badge')) {
                window.history.replaceState({ mainTab: 'home', subRoute: null }, '', '/');
                setRoute(parseCurrentRoute());
              }
            }
          }}
          onMarkOrderReceived={handleMarkOrderReceived}
          onMarkRegistrationShirtReceived={async (userId, received) => {
            await handleUpdateAllocation(userId, {
              shirt_pickup_status: received ? 'received' : 'pending',
              shirt_received: received,
              shirt_received_date: received ? new Date().toISOString() : null
            });
          }}
          onVerifyPayment={handleVerifyOrderPayment}
          onRefreshRegistrations={refreshRegistrations}
          onUpdateAllocation={handleUpdateAllocation}
          onOpenAdminLogin={() => {
            setPublicScannerOpen(false);
            handleAdminEntry();
          }}
        />
      )}

      {/* Vercel Web Analytics & Speed Insights */}
      <Analytics />
      <SpeedInsights />

    </div>
  );
}
