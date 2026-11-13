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
    if (queryOrHash === 'staff-register' || queryOrHash === 'staff-signup' || queryOrHash === 'staff-id-card') {
      return { mainTab: 'register', subRoute: 'staff', canonicalPath: '/staff-register' };
    }
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
  const rawSegments = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === 'home') {
    return { mainTab: 'home', subRoute: null, canonicalPath: '/' };
  }

  const first = segments[0];
  const second = segments[1];
  const third = segments[2];
  const rawSecond = rawSegments[1];
  const rawThird = rawSegments[2];

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

  if (first === 'my-room' || first === 'room-status' || first === 'dorm-status' || first === 'my-group' || first === 'assignment') {
    return { mainTab: 'my-room', subRoute: null, canonicalPath: '/my-room' };
  }
  if (
    first === 'staff-register' ||
    first === 'staff-signup' ||
    first === 'staff-id-card' ||
    first === 'staff-badge' ||
    (first === 'register' && second === 'staff') ||
    (first === 'staff' && (second === 'register' || second === 'signup' || second === 'id-card' || !second))
  ) {
    return { mainTab: 'register', subRoute: 'staff', canonicalPath: '/staff-register' };
  }
  if (first === 'register' || first === 'signup' || first === 'apply') {
    if (url.searchParams.get('role')?.toLowerCase() === 'staff' || url.searchParams.get('staff') === '1') {
      return { mainTab: 'register', subRoute: 'staff', canonicalPath: '/staff-register' };
    }
    return { mainTab: 'register', subRoute: 'form', canonicalPath: '/register' };
  }
  if (first === 'dashboard' || first === 'profile' || first === 'account' || first === 'confirm' || first === 'rsvp') {
    return { mainTab: 'register', subRoute: 'dashboard', canonicalPath: '/dashboard' };
  }

  // Standalone shortcuts for Admin Executive Summary & Attendance Confirmation
  if (first === 'summary' || first === 'executive-summary' || first === 'attendance' || first === 'admin-summary') {
    return { mainTab: 'admin', subRoute: 'summary', canonicalPath: '/admin/summary' };
  }

  // Standalone shortcuts for Catering & Health Hub
  if (first === 'catering' || first === 'catering-health' || first === 'health' || first === 'welfare') {
    return { mainTab: 'admin', subRoute: 'catering', canonicalPath: '/admin/catering' };
  }

  // Standalone shortcut for Shirt Roster & Signature Print Document
  if (first === 'shirt-roster' || first === 'shirt-print' || first === 'print-shirts') {
    return { mainTab: 'admin', subRoute: 'shirt-roster', canonicalPath: '/admin/shirt-roster' };
  }

  // Standalone shortcuts for Rooms & Accommodation Lookup (หอพักกุดรัง ชั้น 1 ห้อง 101 - 110)
  if (first === 'rooms' || first === 'room' || first === 'accommodation' || first === 'dorm' || first === 'dormitory') {
    return { mainTab: 'admin', subRoute: 'rooms', canonicalPath: '/admin/rooms' };
  }

  // Standalone shortcuts for Official Signing Documents & Rosters (/documents, /rosters, /admin/documents)
  if (first === 'documents' || first === 'document' || first === 'rosters' || first === 'roster' || first === 'sign' || first === 'signing') {
    return { mainTab: 'admin', subRoute: 'documents', canonicalPath: '/admin/documents' };
  }

  // Standalone shortcuts for Medical Dispensary & EMR Records (/medical, /all-emr, /medical-records, /medical/person/:id, /admin/medical)
  if (first === 'medical' || first === 'dispensary' || first === 'clinic' || first === 'emr' || first === 'all-emr' || first === 'medical-records' || first === 'health-records' || first === 'firstaid' || first === 'first-aid' || first === 'pharmacy') {
    const queryPerson = url.searchParams.get('person') || '';
    const pathPerson = (second === 'person' || second === 'p' || second === 'member') && rawThird ? decodeURIComponent(rawThird) : ((second && second !== 'all' && second !== 'summary') ? decodeURIComponent(rawSecond) : '');
    const personId = pathPerson || queryPerson;
    return {
      mainTab: 'admin',
      subRoute: 'medical',
      personId: personId || null,
      canonicalPath: personId ? `/admin/medical?person=${encodeURIComponent(personId)}` : '/admin/medical'
    };
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
      'summary': 'summary',
      'overview': 'summary',
      'attendance': 'summary',
      'rsvp': 'summary',
      'confirm': 'summary',
      'total': 'summary',
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
      'staff-accounts': 'staff-accounts',
      'staff_accounts': 'staff-accounts',
      'staff-account': 'staff-accounts',

      'users': 'users',
      'accounts': 'users',

      'catering': 'catering',
      'health': 'catering',
      'catering-health': 'catering',
      'food': 'catering',
      'welfare': 'catering',

      'medical': 'medical',
      'medical-records': 'medical',
      'health-records': 'medical',
      'all-emr': 'medical',
      'dispensary': 'medical',
      'clinic': 'medical',
      'emr': 'medical',
      'pharmacy': 'medical',
      'firstaid': 'medical',
      'first-aid': 'medical',

      'rooms': 'rooms',
      'room': 'rooms',
      'accommodation': 'rooms',
      'dorm': 'rooms',
      'dormitory': 'rooms',

      'documents': 'documents',
      'document': 'documents',
      'rosters': 'documents',
      'roster': 'documents',
      'signing': 'documents',

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
    if (targetSub === 'summary') canonicalPath = '/admin/summary';
    else if (targetSub === 'shirts') canonicalPath = '/admin/shirts';
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
    else if (targetSub === 'medical') canonicalPath = '/admin/medical';
    else if (targetSub === 'rooms') canonicalPath = '/admin/rooms';
    else if (targetSub === 'staff-accounts') canonicalPath = '/admin/staff-accounts';
    else if (targetSub === 'documents') canonicalPath = '/admin/documents';
    else if (second === 'applicants' || second === 'registrations') canonicalPath = '/admin/applicants';
    else canonicalPath = '/admin';

    const medicalPersonId = targetSub === 'medical'
      ? (
          ((third === 'person' || third === 'p' || third === 'member') && rawSegments[3] ? decodeURIComponent(rawSegments[3]) : '') ||
          (third && third !== 'all' && third !== 'summary' ? decodeURIComponent(rawThird) : '') ||
          url.searchParams.get('person') ||
          ''
        )
      : '';

    if (targetSub === 'medical' && medicalPersonId) {
      canonicalPath = `/admin/medical?person=${encodeURIComponent(medicalPersonId)}`;
    }

    return { 
      mainTab: 'admin', 
      subRoute: targetSub, 
      personId: medicalPersonId || null,
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
      if (subRoute === 'dashboard') return '/dashboard';
      if (subRoute === 'staff') return '/staff-register';
      return '/register';
    case 'staff-register':
      return '/staff-register';
    case 'dashboard':
      return '/dashboard';
    case 'chat':
    case 'group-chat':
      return '/chat';
    case 'id-card':
    case 'badge':
      return '/id-card';
    case 'my-room':
    case 'room-status':
    case 'dorm-status':
    case 'my-group':
    case 'assignment':
      return '/my-room';
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
      if (subRoute === 'summary' || subRoute === 'overview' || subRoute === 'attendance' || subRoute === 'rsvp') return '/admin/summary';
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
      if (subRoute === 'rooms' || subRoute === 'room' || subRoute === 'accommodation' || subRoute === 'dorm' || subRoute === 'dormitory') return '/admin/rooms';
      if (subRoute === 'documents' || subRoute === 'rosters' || subRoute === 'document' || subRoute === 'roster' || subRoute === 'signing') return '/admin/documents';
      if (subRoute === 'medical' || subRoute === 'dispensary' || subRoute === 'clinic' || subRoute === 'emr' || subRoute === 'pharmacy') return '/admin/medical';
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

  // Handle medical ?person= param
  if (!(mainTab === 'admin' && subRoute === 'medical') && !options.keepPerson) {
    currentParams.delete('person');
  }
  if (options.clearPerson) {
    currentParams.delete('person');
  } else if (options.personId) {
    currentParams.set('person', options.personId);
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

