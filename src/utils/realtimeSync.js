import { supabase, isSupabaseConfigured } from '../supabase';

/**
 * JRE 2027 Multi-Tier Realtime Synchronization System
 * Tier 1: Local Intra-Window Dispatch (0ms, CustomEvent & in-memory subscribers)
 * Tier 2: Cross-Tab / Cross-Window Sync (0ms, BroadcastChannel & storage event fallback)
 * Tier 3: Cross-Device / Cloud Realtime (Sub-100ms, Supabase Realtime WebSockets & Postgres Changes)
 */

const LOCAL_CHANNEL_NAME = 'jre2027_sync_channel';
const SUPABASE_CHANNEL_NAME = 'jre2027_realtime_stream';

let localBroadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel(LOCAL_CHANNEL_NAME);
  } catch (e) {
    console.warn('[Realtime] BroadcastChannel initialization notice:', e);
  }
}

const subscribers = new Set();
let supabaseRealtimeChannel = null;
let isRealtimeInitialized = false;

/**
 * Register a listener for realtime data mutations
 * @param {Function} callback function(payload)
 * @returns {Function} unsubscribe function
 */
export function subscribeToRealtimeChanges(callback) {
  subscribers.add(callback);
  if (!isRealtimeInitialized && typeof window !== 'undefined') {
    initRealtimeService();
  }
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Internal helper to notify all subscribers in the current window
 */
export function notifyLocalSubscribers(payload) {
  subscribers.forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      console.error('[Realtime] Subscriber error:', err);
    }
  });
}

/**
 * Broadcast an entity mutation across all tiers (same window, other tabs, other devices)
 * @param {string} type Entity type ('registrations', 'announcements', 'payment_config', 'forms_config', 'merchandise_config', 'merchandise_orders', 'team_members', 'speakers_config', 'user_accounts')
 * @param {object} detail Additional metadata (e.g. action, id, userId)
 */
export function broadcastRealtimeChange(type, detail = {}) {
  const payload = {
    type,
    ...detail,
    timestamp: Date.now(),
    sourceId: typeof window !== 'undefined' ? window.__jre_window_id : 'server'
  };

  // 1. Tier 1: Local intra-window notification (0ms)
  notifyLocalSubscribers(payload);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jre2027_data_change', { detail: payload }));
  }

  // 2. Tier 2: Cross-tab / cross-window broadcast (0ms)
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage(payload);
    } catch (e) {
      console.warn('[Realtime] BroadcastChannel postMessage error:', e);
    }
  }

  // 3. Tier 3: Cloud WebSocket broadcast across all devices (< 100ms)
  if (supabaseRealtimeChannel) {
    try {
      supabaseRealtimeChannel.send({
        type: 'broadcast',
        event: 'data_changed',
        payload
      });
    } catch (e) {
      console.warn('[Realtime] Supabase Realtime broadcast note:', e);
    }
  }
}

/**
 * Initialize Realtime Service listeners (called once on startup)
 */
export function initRealtimeService() {
  if (typeof window === 'undefined' || isRealtimeInitialized) return;
  isRealtimeInitialized = true;

  if (!window.__jre_window_id) {
    window.__jre_window_id = 'win_' + Math.random().toString(36).slice(2, 9);
  }

  // Tier 2: Cross-tab BroadcastChannel listener
  if (localBroadcastChannel) {
    localBroadcastChannel.onmessage = (event) => {
      const data = event?.data;
      if (data && data.sourceId !== window.__jre_window_id) {
        notifyLocalSubscribers(data);
      }
    };
  }

  // Cross-tab LocalStorage fallback listener
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('jre2027_')) {
      const type = event.key.replace('jre2027_', '');
      notifyLocalSubscribers({ type, source: 'storage', timestamp: Date.now() });
    }
  });

  // Tier 3: Supabase Realtime WebSocket Connection
  if (isSupabaseConfigured && supabase) {
    try {
      supabaseRealtimeChannel = supabase.channel(SUPABASE_CHANNEL_NAME, {
        config: { broadcast: { self: false } }
      });

      supabaseRealtimeChannel
        .on('broadcast', { event: 'data_changed' }, (msg) => {
          const payload = msg?.payload || msg;
          if (payload && payload.sourceId !== window.__jre_window_id) {
            notifyLocalSubscribers(payload);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, (p) => {
          notifyLocalSubscribers({ type: 'registrations', source: 'postgres', eventType: p.eventType, timestamp: Date.now() });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (p) => {
          notifyLocalSubscribers({ type: 'announcements', source: 'postgres', eventType: p.eventType, timestamp: Date.now() });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'project_settings' }, (p) => {
          const key = p.new?.key || p.old?.key || 'settings';
          notifyLocalSubscribers({ type: key, source: 'postgres', eventType: p.eventType, timestamp: Date.now() });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[JRE Realtime] ✅ Connected to Supabase Realtime Stream');
          }
        });
    } catch (e) {
      console.warn('[Realtime] Supabase Realtime setup note:', e);
    }
  }
}
