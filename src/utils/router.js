// Centralized Clean URL Routing Manager for JRE 2027
// Replaces ?tab=... with modern semantic RESTful paths:
// / -> หน้าแรก (Home)
// /schedule -> กำหนดการ (Schedule & Timeline)
// /register -> รับสมัครเข้าร่วมโครงการ (Registration)
// /dashboard -> แดชบอร์ดผู้สมัคร (Applicant Dashboard)
// /chat -> แชทกลุ่มผู้เข้าร่วม (Registered Group Chat)
// /announcements -> ประกาศทั้งหมด (All Announcements)
// /announcements/pr -> ข่าวประชาสัมพันธ์รับสมัคร (Public PR)
// /announcements/orders -> คำสั่งสำหรับสมาชิก (Member Directives)
// /merchandise -> สั่งซื้อเสื้อ/กางเกง (Merchandise Catalog)
// /merchandise/orders -> ตรวจสอบคำสั่งซื้อเสื้อ (Order Tracking)
// /admin -> ระบบผู้ดูแลระบบ (Admin Dashboard)
// /admin/:section -> ส่วนงานผู้ดูแลระบบ

export function parseCurrentRoute() {
  if (typeof window === 'undefined') {
    return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
  }

  const url = new URL(window.location.href);
  const pathname = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const tabParam = url.searchParams.get('tab')?.toLowerCase();
  const hash = window.location.hash.replace('#', '').toLowerCase();

  // 1. Detect legacy query parameters (?tab=...) or hash (#...) and translate
  const queryOrHash = tabParam || hash;
  if (queryOrHash) {
    if (queryOrHash === 'home') return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
    if (queryOrHash === 'schedule') return { mainTab: 'schedule', subRoute: null, canonicalPath: '/schedule' };
    if (queryOrHash === 'register' || queryOrHash === 'profile') return { mainTab: 'register', subRoute: null, canonicalPath: '/register' };
    if (queryOrHash === 'dashboard') return { mainTab: 'register', subRoute: 'dashboard', canonicalPath: '/dashboard' };
    if (queryOrHash === 'chat') return { mainTab: 'chat', subRoute: null, canonicalPath: '/chat' };
    if (queryOrHash === 'id-card' || queryOrHash === 'badge') return { mainTab: 'id-card', subRoute: null, canonicalPath: '/id-card' };
    if (queryOrHash === 'pr') return { mainTab: 'announcements', subRoute: 'public', canonicalPath: '/announcements/pr' };
    if (queryOrHash === 'orders') return { mainTab: 'announcements', subRoute: 'members', canonicalPath: '/announcements/orders' };
    if (queryOrHash === 'announcements') return { mainTab: 'announcements', subRoute: 'all', canonicalPath: '/announcements' };
    if (queryOrHash === 'merchandise' || queryOrHash === 'shop' || queryOrHash === 'store') {
      return { mainTab: 'merchandise', subRoute: 'catalog', canonicalPath: '/merchandise' };
    }
    if (queryOrHash === 'admin') {
      const section = url.searchParams.get('section')?.toLowerCase() || 'applicants';
      const sub = (section === 'shirts' || section === 'merchandise') ? 'shirts' : (section === 'payment' || section === 'finance') ? 'payment' : section;
      return { mainTab: 'admin', subRoute: sub, canonicalPath: sub === 'applicants' ? '/admin' : `/admin/${sub}` };
    }
    if (queryOrHash === 'presentation' || queryOrHash === 'research' || queryOrHash === 'ai-security') {
      return { mainTab: 'security', subRoute: 'presentation', canonicalPath: '/presentation' };
    }
    if (queryOrHash === 'security' || queryOrHash === 'security-audit' || queryOrHash === 'audit') {
      return { mainTab: 'security', subRoute: 'audit', canonicalPath: '/security' };
    }
  }

  // 2. Parse modern path segments (/main/sub)
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === 'home') {
    return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
  }

  const first = segments[0];
  const second = segments[1];

  // Incident route block: JRE 2027 does not host rescue incident reports
  if (first === 'incidents' || first === 'incident') {
    return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
  }

  // Schedule
  if (first === 'schedule' || first === 'timeline') {
    return { mainTab: 'schedule', subRoute: null, canonicalPath: '/schedule' };
  }

  // Registration & Dashboard
  if (first === 'chat' || first === 'group-chat') {
    return { mainTab: 'chat', subRoute: null, canonicalPath: '/chat' };
  }

  if (first === 'verify' || first === 'qr-verify' || first === 'check-badge') {
    const badge = url.searchParams.get('badge') || url.searchParams.get('code') || segments[1] || '';
    const recId = url.searchParams.get('id') || url.searchParams.get('uid') || '';
    return {
      mainTab: 'home',
      subRoute: 'verify',
      verifyBadge: badge,
      verifyId: recId,
      canonicalPath: '/'
    };
  }

  if (first === 'id-cards' || first === 'idcards' || first === 'badges' || first === 'all-badges' || (first === 'id-card' && (second === 'all' || second === 'directory' || second === 'admin'))) {
    return { mainTab: 'admin', subRoute: 'id-cards', canonicalPath: '/admin/id-cards' };
  }

  if (first === 'id-card' || first === 'badge' || first === 'badge-card') {
    return { mainTab: 'id-card', subRoute: null, canonicalPath: '/id-card' };
  }
  if (first === 'register' || first === 'signup' || first === 'apply') {
    return { mainTab: 'register', subRoute: 'form', canonicalPath: '/register' };
  }
  if (first === 'dashboard' || first === 'profile' || first === 'account') {
    return { mainTab: 'register', subRoute: 'dashboard', canonicalPath: '/dashboard' };
  }

  // Standalone shortcuts for Catering & Health Hub
  if (first === 'catering' || first === 'catering-health' || first === 'health' || first === 'welfare') {
    return { mainTab: 'admin', subRoute: 'catering', canonicalPath: '/admin/catering' };
  }

  // Standalone shortcut for Shirt Roster & Signature Print Document
  if (first === 'shirt-roster' || first === 'shirt-print' || first === 'print-shirts') {
    return { mainTab: 'admin', subRoute: 'shirt-roster', canonicalPath: '/admin/shirt-roster' };
  }

  // Standalone shortcuts for Staff Accommodation & Payment Filter Pages
  if (first === 'staff-accommodation' || first === 'staff-hotel' || first === 'staff-refund') {
    return { mainTab: 'admin', subRoute: 'staff-accommodation', canonicalPath: '/admin/staff-accommodation' };
  }
  if (first === 'full-payment' || first === 'full-plan') {
    return { mainTab: 'admin', subRoute: 'full-payment', canonicalPath: '/admin/full-payment' };
  }
  if (first === 'round1-paid' || first === 'partial-paid' || first === 'installment-round1') {
    return { mainTab: 'admin', subRoute: 'round1-paid', canonicalPath: '/admin/round1-paid' };
  }
  if (first === 'unpaid' || first === 'outstanding') {
    return { mainTab: 'admin', subRoute: 'unpaid', canonicalPath: '/admin/unpaid' };
  }

  // Standalone shortcuts for announcements
  if (first === 'pr') {
    const queryId = url.searchParams.get('id') || url.searchParams.get('annId') || segments[1] || null;
    return { mainTab: 'announcements', subRoute: 'public', postId: queryId, canonicalPath: queryId ? `/announcements/pr?id=${queryId}` : '/announcements/pr' };
  }
  if (first === 'orders') {
    const queryId = url.searchParams.get('id') || url.searchParams.get('annId') || segments[1] || null;
    return { mainTab: 'announcements', subRoute: 'members', postId: queryId, canonicalPath: queryId ? `/announcements/orders?id=${queryId}` : '/announcements/orders' };
  }

  // Announcements main & sub-pages
  if (first === 'announcements' || first === 'news' || first === 'posts') {
    const queryId = url.searchParams.get('id') || url.searchParams.get('annId');
    if (second === 'pr' || second === 'public') {
      const third = segments[2] || queryId || null;
      return { mainTab: 'announcements', subRoute: 'public', postId: third, canonicalPath: third ? `/announcements/pr?id=${third}` : '/announcements/pr' };
    }
    if (second === 'orders' || second === 'members') {
      const third = segments[2] || queryId || null;
      return { mainTab: 'announcements', subRoute: 'members', postId: third, canonicalPath: third ? `/announcements/orders?id=${third}` : '/announcements/orders' };
    }
    if (second && second !== 'all') {
      return { mainTab: 'announcements', subRoute: 'all', postId: second, canonicalPath: `/announcements?id=${second}` };
    }
    return { mainTab: 'announcements', subRoute: 'all', postId: queryId || null, canonicalPath: queryId ? `/announcements?id=${queryId}` : '/announcements' };
  }

  // Merchandise & Sub-pages
  if (first === 'merchandise' || first === 'shop' || first === 'store' || first === 'shirt' || first === 'shirts') {
    if (second === 'orders' || second === 'tracking' || second === 'my-orders' || second === 'cart') {
      return { mainTab: 'merchandise', subRoute: 'my_orders', canonicalPath: '/merchandise/orders' };
    }
    return { mainTab: 'merchandise', subRoute: 'catalog', canonicalPath: '/merchandise' };
  }

  // Admin & Sub-pages
  if (first === 'admin') {
    const adminMap = {
      '': 'applicants',
      'overview': 'applicants',
      'applicants': 'applicants',
      'registrations': 'applicants',
      'members': 'applicants',
      'trainees': 'applicants',

      'shirts': 'shirts',
      'shirt': 'shirts',
      'merchandise': 'shirts',
      'merch': 'shirts',
      'orders': 'shirts',

      'shirt-roster': 'shirt-roster',
      'shirt-print': 'shirt-roster',
      'print-shirts': 'shirt-roster',
      'roster': 'shirt-roster',

      'payment': 'payment',
      'payments': 'payment',
      'payment_settings': 'payment',
      'finance': 'payment',

      'forms': 'forms',
      'tests': 'forms',
      'evaluations': 'forms',

      'announcements': 'announcements',
      'news': 'announcements',
      'posts': 'announcements',

      'speakers': 'speakers',
      'speaker': 'speakers',
      'president': 'president',
      'presidents': 'president',
      'advisors': 'advisors',
      'advisor': 'advisors',

      'team': 'team',
      'staff': 'team',

      'users': 'users',
      'accounts': 'users',

      'catering': 'catering',
      'health': 'catering',
      'catering-health': 'catering',
      'food': 'catering',
      'welfare': 'catering',

      'staff-accommodation': 'staff-accommodation',
      'staff_accommodation': 'staff-accommodation',
      'staff-hotel': 'staff-accommodation',
      'staff-refund': 'staff-accommodation',

      'full-payment': 'full-payment',
      'full-plan': 'full-payment',
      'full_plan': 'full-payment',

      'round1-paid': 'round1-paid',
      'partial-paid': 'round1-paid',
      'partial_paid': 'round1-paid',
      'installment-round1': 'round1-paid',

      'unpaid': 'unpaid',
      'outstanding': 'unpaid',

      'installment-plan': 'installment-plan',
      'installment_plan': 'installment-plan',
      'fully-paid': 'fully-paid',
      'fully_paid': 'fully-paid',

      'scanner': 'scanner',
      'qr': 'scanner',

      'id-cards': 'id-cards',
      'id-card': 'id-cards',
      'idcards': 'id-cards',
      'badges': 'id-cards',
      'badge': 'id-cards',
      'cards': 'id-cards'
    };

    const targetSub = second ? (adminMap[second] || 'applicants') : 'applicants';
    
    let canonicalPath = '/admin';
    if (targetSub === 'shirts') canonicalPath = '/admin/shirts';
    else if (targetSub === 'shirt-roster') canonicalPath = '/admin/shirt-roster';
    else if (targetSub === 'id-cards') canonicalPath = '/admin/id-cards';
    else if (targetSub === 'payment') canonicalPath = '/admin/payment';
    else if (targetSub === 'forms') canonicalPath = '/admin/forms';
    else if (targetSub === 'announcements') canonicalPath = '/admin/announcements';
    else if (targetSub === 'speakers') canonicalPath = '/admin/speakers';
    else if (targetSub === 'president') canonicalPath = '/admin/president';
    else if (targetSub === 'advisors') canonicalPath = '/admin/advisors';
    else if (targetSub === 'team') canonicalPath = '/admin/team';
    else if (targetSub === 'users') canonicalPath = '/admin/users';
    else if (targetSub === 'catering') canonicalPath = '/admin/catering';
    else if (targetSub === 'staff-accommodation') canonicalPath = '/admin/staff-accommodation';
    else if (targetSub === 'full-payment') canonicalPath = '/admin/full-payment';
    else if (targetSub === 'round1-paid') canonicalPath = '/admin/round1-paid';
    else if (targetSub === 'unpaid') canonicalPath = '/admin/unpaid';
    else if (targetSub === 'installment-plan') canonicalPath = '/admin/installment-plan';
    else if (targetSub === 'fully-paid') canonicalPath = '/admin/fully-paid';
    else if (targetSub === 'scanner') canonicalPath = '/admin/scanner';
    else if (second === 'applicants' || second === 'registrations') canonicalPath = '/admin/applicants';
    else canonicalPath = '/admin';

    return { 
      mainTab: 'admin', 
      subRoute: targetSub, 
      canonicalPath 
    };
  }

  // User Profiles & Digital ID Badge (/users/:uid or /user/:uid)
  if (first === 'users' || first === 'user') {
    const uid = second || null;
    return {
      mainTab: 'users',
      subRoute: uid,
      canonicalPath: uid ? `/users/${uid}` : '/users'
    };
  }

  // Academic Presentation (/presentation, /ai-security, /research)
  if (first === 'presentation' || first === 'ai-security' || first === 'research') {
    return {
      mainTab: 'security',
      subRoute: 'presentation',
      canonicalPath: '/presentation'
    };
  }

  // Security Audit Report (/security or /security-audit or /audit)
  if (first === 'security' || first === 'security-audit' || first === 'audit' || first === 'vulnerabilities') {
    if (second === 'presentation' || second === 'ai' || second === 'research') {
      return {
        mainTab: 'security',
        subRoute: 'presentation',
        canonicalPath: '/presentation'
      };
    }
    return {
      mainTab: 'security',
      subRoute: 'audit',
      canonicalPath: '/security'
    };
  }

  return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
}

export function getPathForRoute(mainTab, subRoute) {
  switch (mainTab) {
    case 'home':
      return '/';
    case 'schedule':
      return '/schedule';
    case 'register':
      return subRoute === 'dashboard' ? '/dashboard' : '/register';
    case 'dashboard':
      return '/dashboard';
    case 'chat':
    case 'group-chat':
      return '/chat';
    case 'id-card':
    case 'badge':
      return '/id-card';
    case 'pr':
      return '/announcements/pr';
    case 'orders':
      return '/announcements/orders';
    case 'announcements':
      if (subRoute === 'public' || subRoute === 'pr') return '/announcements/pr';
      if (subRoute === 'members' || subRoute === 'orders') return '/announcements/orders';
      return '/announcements';
    case 'merchandise':
    case 'shop':
    case 'store':
      if (subRoute === 'my_orders' || subRoute === 'orders' || subRoute === 'cart') return '/merchandise/orders';
      return '/merchandise';
    case 'admin':
      if (subRoute === 'id-cards' || subRoute === 'idcard' || subRoute === 'idcards' || subRoute === 'badges' || subRoute === 'badge') return '/admin/id-cards';
      if (subRoute === 'payment' || subRoute === 'payment_settings' || subRoute === 'finance') return '/admin/payment';
      if (subRoute === 'shirt-roster' || subRoute === 'shirt-print' || subRoute === 'print-shirts' || subRoute === 'roster') return '/admin/shirt-roster';
      if (subRoute === 'shirts' || subRoute === 'merchandise' || subRoute === 'shirt' || subRoute === 'merch') return '/admin/shirts';
      if (subRoute === 'forms' || subRoute === 'tests' || subRoute === 'evaluations') return '/admin/forms';
      if (subRoute === 'announcements' || subRoute === 'news' || subRoute === 'posts') return '/admin/announcements';
      if (subRoute === 'speakers') return '/admin/speakers';
      if (subRoute === 'president') return '/admin/president';
      if (subRoute === 'advisors' || subRoute === 'advisor') return '/admin/advisors';
      if (subRoute === 'team' || subRoute === 'staff') return '/admin/team';
      if (subRoute === 'users' || subRoute === 'accounts') return '/admin/users';
      if (subRoute === 'catering' || subRoute === 'health' || subRoute === 'catering-health' || subRoute === 'food' || subRoute === 'welfare') return '/admin/catering';
      if (subRoute === 'staff-accommodation' || subRoute === 'staff_accommodation' || subRoute === 'staff-hotel' || subRoute === 'staff-refund') return '/admin/staff-accommodation';
      if (subRoute === 'full-payment' || subRoute === 'full_plan' || subRoute === 'full-plan') return '/admin/full-payment';
      if (subRoute === 'round1-paid' || subRoute === 'partial_paid' || subRoute === 'partial-paid' || subRoute === 'installment-round1') return '/admin/round1-paid';
      if (subRoute === 'unpaid' || subRoute === 'outstanding') return '/admin/unpaid';
      if (subRoute === 'installment-plan' || subRoute === 'installment_plan') return '/admin/installment-plan';
      if (subRoute === 'fully-paid' || subRoute === 'fully_paid') return '/admin/fully-paid';
      if (subRoute === 'scanner' || subRoute === 'qr') return '/admin/scanner';
      if (subRoute === 'applicants' || subRoute === 'registrations') return '/admin/applicants';
      if (subRoute && subRoute !== 'applicants') return `/admin/${subRoute}`;
      return '/admin';
    case 'users':
    case 'user':
      return subRoute ? `/users/${subRoute}` : '/users';
    case 'presentation':
    case 'research':
    case 'ai-security':
      return '/presentation';
    case 'security':
    case 'security-audit':
    case 'audit':
      if (subRoute === 'presentation' || subRoute === 'research' || subRoute === 'ai') return '/presentation';
      return '/security';
    default:
      return '/';
  }
}

export function syncUrlToRoute(mainTab, subRoute, replace = false, options = {}) {
  if (typeof window === 'undefined') return;

  const targetPath = getPathForRoute(mainTab, subRoute);
  const currentUrl = new URL(window.location.href);

  // Preserve non-tab query params like ?id=... or search parameters
  const currentParams = new URLSearchParams(currentUrl.search);
  currentParams.delete('tab');
  currentParams.delete('type');
  currentParams.delete('view');

  // If navigating away from announcements or clearing postId
  if (mainTab !== 'announcements' || options.clearPostId) {
    currentParams.delete('id');
    currentParams.delete('annId');
  }

  if (options.postId) {
    currentParams.set('id', options.postId);
  }

  const queryString = currentParams.toString();
  const fullTarget = queryString ? `${targetPath}?${queryString}` : targetPath;

  if (currentUrl.pathname + currentUrl.search !== fullTarget) {
    if (replace) {
      window.history.replaceState({ mainTab, subRoute }, '', fullTarget);
    } else {
      window.history.pushState({ mainTab, subRoute }, '', fullTarget);
    }
  }
}

