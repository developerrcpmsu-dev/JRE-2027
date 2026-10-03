import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FormsBanner from './components/FormsBanner';
import GoogleLoginModal from './components/GoogleLoginModal';
import AdminLoginModal from './components/AdminLoginModal';
import HomeView from './views/HomeView';
import ScheduleView from './views/ScheduleView';
import RegisterView from './views/RegisterView';
import AnnouncementsView from './views/AnnouncementsView';
import AdminDashboardView from './views/AdminDashboardView';
import MerchandiseView from './views/MerchandiseView';
import AuthPortalView from './views/AuthPortalView';
import { DataService, supabase, isSupabaseConfigured } from './supabase';

import { parseCurrentRoute, getPathForRoute, syncUrlToRoute } from './utils/router';

export default function App() {
  const [route, setRoute] = useState(parseCurrentRoute);

  const currentTab = route.mainTab;
  const currentSubRoute = route.subRoute;

  const setCurrentTab = (newTab, newSubRoute = null) => {
    let main = newTab;
    let sub = newSubRoute;

    if (newTab === 'pr') {
      main = 'announcements';
      sub = 'public';
    } else if (newTab === 'orders') {
      main = 'announcements';
      sub = 'members';
    } else if (newTab === 'dashboard') {
      main = 'register';
      sub = 'dashboard';
    } else if (newTab === 'shop' || newTab === 'store') {
      main = 'merchandise';
      sub = 'catalog';
    }

    syncUrlToRoute(main, sub);
    setRoute({ mainTab: main, subRoute: sub, canonicalPath: getPathForRoute(main, sub) });
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

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

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
        const [regs, anns, forms, payCfg, merchCfg, merchOrds, team, spks] = await Promise.all([
          DataService.getRegistrations(),
          DataService.getAnnouncements(),
          DataService.getFormsConfig(),
          DataService.getPaymentConfig(),
          DataService.getMerchandiseConfig(),
          DataService.getMerchandiseOrders(),
          DataService.getTeam(),
          DataService.getSpeakers()
        ]);
        setRegistrations(regs);
        setAnnouncements(anns);
        setFormsConfig(forms);
        setPaymentConfig(payCfg);
        setMerchandiseConfig(merchCfg);
        setMerchandiseOrders(merchOrds);
        setTeamMembers(team);
        setSpeakers(spks);

        // Check for Google OAuth Direct Redirect Hash Callback (#access_token=...)
        if (window.location.hash && window.location.hash.includes('access_token=')) {
          try {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            if (accessToken) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              const profile = await res.json();
              if (profile?.email) {
                const cleanEmail = profile.email.trim().toLowerCase();
                const cleanName = profile.name || cleanEmail.split('@')[0];
                const avatar = profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;
                const userObj = await DataService.loginWithGoogleProfile({
                  name: cleanName,
                  email: cleanEmail,
                  avatar: avatar
                });
                localStorage.setItem('jre2027_auth_user', JSON.stringify(userObj));
                setUser(userObj);
                const found = matchRegistration(userObj, regs);
                if (found) setMyRegistration(found);
              }
            }
          } catch (oauthErr) {
            console.warn('OAuth redirect hash parse error:', oauthErr);
          }
        }

        // Check stored auth
        const storedUser = localStorage.getItem('jre2027_auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          const found = matchRegistration(parsed, regs);
          if (found) setMyRegistration(found);
        }

        const storedAdmin = localStorage.getItem('jre2027_is_admin');
        if (storedAdmin === 'true') {
          setIsAdmin(true);
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
            if (found) setMyRegistration(found);
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
    } else {
      setMyRegistration(null);
    }
  }, [user, registrations]);

  // Auth Handlers
  const handleGoogleLoginSuccess = (userObj) => {
    setUser(userObj);
    setIsAdmin(false);
    localStorage.removeItem('jre2027_is_admin');
    const found = matchRegistration(userObj, registrations);
    if (found) setMyRegistration(found);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('jre2027_is_admin', 'true');
    setCurrentTab('admin');
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
    setMyRegistration(null);
    setCurrentTab('home');
  };

  // Data Mutation Handlers
  const handleSaveRegistration = async (payload) => {
    const saved = await DataService.saveRegistration(payload);
    const updated = await DataService.getRegistrations();
    setRegistrations(updated);
    setMyRegistration(saved);
    return saved;
  };

  const handleUpdateAllocation = async (userId, allocations) => {
    await DataService.updateRegistrationAllocations(userId, allocations);
    const updated = await DataService.getRegistrations();
    setRegistrations(updated);
    if (user && (user.id === userId || user.email === updated.find(r => r.user_id === userId)?.user_email)) {
      setMyRegistration(updated.find(r => r.user_id === userId));
    }
  };

  const handleUpdateRegistration = async (userId, updates) => {
    await DataService.updateRegistrationDetails(userId, updates);
    const updated = await DataService.getRegistrations();
    setRegistrations(updated);
    if (user && (user.id === userId || user.email === updated.find(r => r.user_id === userId)?.user_email)) {
      setMyRegistration(updated.find(r => r.user_id === userId));
    }
  };

  const handleDeleteRegistration = async (userId) => {
    await DataService.deleteRegistration(userId);
    const updated = await DataService.getRegistrations();
    setRegistrations(updated);
    if (user && user.id === userId) {
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
    await DataService.verifyOrderPayment(orderId, isApproved, adminNotes);
    const updated = await DataService.getMerchandiseOrders();
    setMerchandiseOrders(updated);
  };

  const handleMarkOrderReceived = async (orderId, adminName) => {
    await DataService.markOrderReceived(orderId, adminName);
    const updated = await DataService.getMerchandiseOrders();
    setMerchandiseOrders(updated);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rescue-500 selection:text-white">
      
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
        myRegistration={myRegistration}
        formsConfig={formsConfig}
      />

      {/* Forms Banner (Shows ONLY when user is logged in AND Admin activates Pre-test, Post-test, or Eval) */}
      {user && <FormsBanner formsConfig={formsConfig} user={user} />}

      {/* Main Content Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
            onScopeChange={(scope) => {
              if (scope === 'public') setCurrentTab('announcements', 'public');
              else if (scope === 'members') setCurrentTab('announcements', 'members');
              else setCurrentTab('announcements', 'all');
            }}
          />
        )}

        {(currentTab === 'merchandise' || currentTab === 'shop' || currentTab === 'store') && (
          <MerchandiseView
            user={user}
            merchandiseConfig={merchandiseConfig}
            orders={merchandiseOrders}
            onSaveOrder={handleSaveMerchandiseOrder}
            onOpenGoogleLogin={() => setGoogleModalOpen(true)}
            initialTab={currentSubRoute === 'my_orders' ? 'my_orders' : currentSubRoute === 'cart' ? 'cart' : 'catalog'}
            onTabChange={(tab) => {
              if (tab === 'my_orders') setCurrentTab('merchandise', 'my_orders');
              else if (tab === 'cart') setCurrentTab('merchandise', 'cart');
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
            onSaveTeam={DataService.saveTeam}
            speakers={speakers}
            onSaveSpeakers={DataService.saveSpeakers}
            merchandiseConfig={merchandiseConfig}
            onSaveMerchandiseConfig={handleSaveMerchandiseConfig}
            merchandiseOrders={merchandiseOrders}
            onUpdateMerchandiseOrder={handleUpdateMerchandiseOrder}
            onVerifyOrderPayment={handleVerifyOrderPayment}
            onMarkOrderReceived={handleMarkOrderReceived}
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

    </div>
  );
}
