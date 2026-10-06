// Centralized Clean URL Routing Manager for JRE 2027
// Replaces ?tab=... with modern semantic RESTful paths:
// / -> หน้าแรก (Home)
// /schedule -> กำหนดการ (Schedule & Timeline)
// /register -> รับสมัครเข้าร่วมโครงการ (Registration)
// /dashboard -> แดชบอร์ดผู้สมัคร (Applicant Dashboard)
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
    if (queryOrHash === 'pr') return { mainTab: 'announcements', subRoute: 'public', canonicalPath: '/announcements/pr' };
    if (queryOrHash === 'orders') return { mainTab: 'announcements', subRoute: 'members', canonicalPath: '/announcements/orders' };
    if (queryOrHash === 'announcements') return { mainTab: 'announcements', subRoute: 'all', canonicalPath: '/announcements' };
    if (queryOrHash === 'merchandise' || queryOrHash === 'shop' || queryOrHash === 'store') {
      return { mainTab: 'merchandise', subRoute: 'catalog', canonicalPath: '/merchandise' };
    }
    if (queryOrHash === 'admin') return { mainTab: 'admin', subRoute: 'applicants', canonicalPath: '/admin' };
  }

  // 2. Parse modern path segments (/main/sub)
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === 'home') {
    return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
  }

  const first = segments[0];
  const second = segments[1];

  // Schedule
  if (first === 'schedule' || first === 'timeline') {
    return { mainTab: 'schedule', subRoute: null, canonicalPath: '/schedule' };
  }

  // Registration & Dashboard
  if (first === 'register' || first === 'signup' || first === 'apply') {
    return { mainTab: 'register', subRoute: 'form', canonicalPath: '/register' };
  }
  if (first === 'dashboard' || first === 'profile' || first === 'account') {
    return { mainTab: 'register', subRoute: 'dashboard', canonicalPath: '/dashboard' };
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
    const validSections = ['applicants', 'announcements', 'merchandise', 'payment', 'payment_settings', 'speakers', 'team', 'forms', 'settings', 'users'];
    const rawSection = validSections.includes(second) ? second : 'applicants';
    const subRoute = (rawSection === 'payment' || rawSection === 'payment_settings') ? 'payment_settings' : rawSection;
    const canonicalPath = subRoute === 'applicants' ? '/admin' : subRoute === 'payment_settings' ? '/admin/payment' : `/admin/${subRoute}`;
    return { 
      mainTab: 'admin', 
      subRoute, 
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
      if (subRoute === 'payment' || subRoute === 'payment_settings') return '/admin/payment';
      if (subRoute && subRoute !== 'applicants') return `/admin/${subRoute}`;
      return '/admin';
    case 'users':
    case 'user':
      return subRoute ? `/users/${subRoute}` : '/users';
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

