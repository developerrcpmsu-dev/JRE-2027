// Centralized Google Identity Services (GIS) & OAuth Manager
// Solves:
// 1. Completely suppresses duplicate google.accounts.id.initialize() calls
// 2. Auto-select lock-in (enables selecting any account)
// 3. Centralized popup and token handling

export function decodeJwtResponse(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode Google JWT token:', e);
    return null;
  }
}

let activeTokenClient = null;

// Suppress [GSI_LOGGER] duplicate initialization warnings and popup blocker notices globally in console
if (typeof window !== 'undefined' && !window.__jreGsiLoggerFiltered) {
  window.__jreGsiLoggerFiltered = true;
  const isNoise = (args) => {
    if (!args || !args[0]) return false;
    const msg = typeof args[0] === 'string' ? args[0] : '';
    return msg.includes('[GSI_LOGGER]') ||
           msg.includes('initialize() is called multiple times') ||
           msg.includes('Failed to open popup window') ||
           msg.includes('Maybe blocked by the browser') ||
           msg.includes('Cross-Origin-Opener-Policy');
  };
  ['warn', 'info', 'log', 'debug', 'error'].forEach((method) => {
    const original = console[method];
    console[method] = function (...args) {
      if (isNoise(args)) return;
      return original.apply(console, args);
    };
  });
}

export function initGoogleIdentityServices(clientId, onCredential) {
  if (typeof window === 'undefined' || !window.google?.accounts?.id || !clientId) {
    return false;
  }

  // Update the global active credential callback
  if (onCredential) {
    window.__jreGoogleCredentialCallback = onCredential;
  }

  // If already initialized once, just return true
  if (window.__jreGsiInitialized) {
    return true;
  }

  // Protect against multiple initialize calls by wrapping initialize method
  if (!window.__jreGsiHooked) {
    const originalInit = window.google.accounts.id.initialize;
    window.google.accounts.id.initialize = function (config) {
      if (window.__jreGsiActuallyInitialized) {
        // Silently ignore subsequent calls so Google's logger never prints duplicate warning
        return;
      }
      window.__jreGsiActuallyInitialized = true;
      return originalInit.call(this, config);
    };
    window.__jreGsiHooked = true;
  }

  // Always disable auto select so Google lets user choose any account
  try {
    if (window.google.accounts.id.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch (e) {}

  // Initialize GIS safely
  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential && window.__jreGoogleCredentialCallback) {
          window.__jreGoogleCredentialCallback(response);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin'
    });
    window.__jreGsiInitialized = true;
  } catch (e) {
    console.warn('Google Identity Services initialization notice:', e);
  }

  return true;
}

export function renderGoogleButton(containerElement, options = {}) {
  if (!containerElement || !window.google?.accounts?.id) return false;

  try {
    containerElement.innerHTML = '';
    const renderConfig = {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with', // Renders "ลงชื่อเข้าใช้ด้วย Google" (Universal, not locked)
      shape: 'rectangular', // 'rectangular' (4px radius) prevents the right-edge vertical clipping bug of 'pill' with Thai text
      logo_alignment: 'left',
      locale: 'th',
      ...options
    };
    window.google.accounts.id.renderButton(containerElement, renderConfig);
    return true;
  } catch (e) {
    console.warn('Google renderButton notice:', e);
    return false;
  }
}

export function getGoogleTokenClient(clientId, onTokenResponse, onError) {
  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2 || !clientId) {
    return null;
  }

  window.__jreGoogleTokenCallback = onTokenResponse;
  window.__jreGoogleTokenError = onError;

  if (!activeTokenClient) {
    try {
      activeTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        error_callback: (err) => {
          if (window.__jreGoogleTokenError) {
            window.__jreGoogleTokenError(err);
          }
        },
        callback: (tokenResponse) => {
          if (window.__jreGoogleTokenCallback) {
            window.__jreGoogleTokenCallback(tokenResponse);
          }
        }
      });
    } catch (e) {
      console.warn('Google initTokenClient notice:', e);
    }
  }

  return activeTokenClient;
}

export function getDirectGoogleAuthUrl(clientId = '292467898061-a10ff6et3k1up950hfvstelqh7hu5f6d.apps.googleusercontent.com') {
  if (typeof window === 'undefined') return '#';
  const redirectUri = window.location.origin;
  const nonce = Math.random().toString(36).substring(2, 12);
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&prompt=select_account&nonce=${nonce}`;
}
