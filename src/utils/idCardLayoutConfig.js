import { supabase } from '../supabase';

export const MASTER_LAYOUT_STORAGE_KEY = 'jre2027_master_id_card_layout_v2';
export const MASTER_LAYOUT_EVENT = 'jre-idcard-layout-updated';

/**
 * Default Master Layout Configuration for Portrait ID Card (Base 480 x 600 px -> 1200 x 1500 px)
 * Every coordinate is in the 480 x 600 base space.
 */
export const DEFAULT_MASTER_CARD_LAYOUT = {
  version: 2,
  // 1. Top Header Banner
  headerBanner: {
    x: 0,
    y: 0,
    width: 480,
    height: 74,
    fit: 'fill' // 'fill' | 'cover' | 'contain'
  },
  // 2. Optional Floating Role Pill (Default hidden so header university logos are 100% clear)
  rolePill: {
    visible: false,
    x: 332,
    y: 82,
    width: 132,
    height: 22,
    fontSize: 8.5
  },
  // 3. Portrait Photo Frame (Centered at x = (480 - 138) / 2 = 171)
  photoFrame: {
    x: 171,
    y: 84,
    width: 138,
    height: 168,
    borderRadius: 16,
    borderWidth: 3,
    centerHorizontally: true
  },
  // 4. Callsign Badge Pill
  callsignPill: {
    offsetX: 0,
    y: 260,
    minWidth: 156,
    height: 28,
    fontSize: 13,
    borderRadius: 8
  },
  // 5. Hero Name Banner
  heroBox: {
    x: 24,
    y: 296,
    width: 432,
    heightWithNick: 74,
    heightNoNick: 58,
    borderRadius: 12,
    enFontSize: 16,
    thFontSize: 12.5,
    nickFontSize: 12
  },
  // 6. Affiliation Box
  affiliationBox: {
    x: 24,
    y: 378,
    width: 432,
    height: 40,
    borderRadius: 10,
    labelFontSize: 8,
    valueFontSize: 13
  },
  // 7. Unit & Badge ID Row
  unitBadgeRow: {
    x: 24,
    y: 424,
    width: 432,
    height: 40,
    gap: 8,
    borderRadius: 10,
    labelFontSize: 8,
    valueFontSize: 12
  },
  // 8. Bottom Verification Row (QR + Blood Type + Verified)
  bottomRow: {
    x: 24,
    y: 472,
    width: 432,
    height: 106,
    gap: 8,
    borderRadius: 12,
    qrBoxWidth: 104,
    qrSize: 74,
    qrTopOffset: 6,
    qrLabelOffset: 94,
    qrLabelFontSize: 7.5,
    bloodBoxWidth: 104,
    bloodValueFontSize: 34,
    verifiedIconSize: 22,
    verifiedTitleFontSize: 13,
    verifiedSubFontSize: 8.5
  }
};

/**
 * Deep-merge helper so partial saved configs always have all required fields
 */
export function mergeMasterCardLayout(custom = null) {
  if (!custom || typeof custom !== 'object') {
    return structuredClone
      ? structuredClone(DEFAULT_MASTER_CARD_LAYOUT)
      : JSON.parse(JSON.stringify(DEFAULT_MASTER_CARD_LAYOUT));
  }

  return {
    version: 2,
    headerBanner: { ...DEFAULT_MASTER_CARD_LAYOUT.headerBanner, ...(custom.headerBanner || {}) },
    rolePill: { ...DEFAULT_MASTER_CARD_LAYOUT.rolePill, ...(custom.rolePill || {}) },
    photoFrame: { ...DEFAULT_MASTER_CARD_LAYOUT.photoFrame, ...(custom.photoFrame || {}) },
    callsignPill: { ...DEFAULT_MASTER_CARD_LAYOUT.callsignPill, ...(custom.callsignPill || {}) },
    heroBox: { ...DEFAULT_MASTER_CARD_LAYOUT.heroBox, ...(custom.heroBox || {}) },
    affiliationBox: { ...DEFAULT_MASTER_CARD_LAYOUT.affiliationBox, ...(custom.affiliationBox || {}) },
    unitBadgeRow: { ...DEFAULT_MASTER_CARD_LAYOUT.unitBadgeRow, ...(custom.unitBadgeRow || {}) },
    bottomRow: { ...DEFAULT_MASTER_CARD_LAYOUT.bottomRow, ...(custom.bottomRow || {}) }
  };
}

/**
 * Read current Master Card Layout synchronously from localStorage
 */
export function getMasterCardLayout() {
  if (typeof window === 'undefined') {
    return mergeMasterCardLayout(null);
  }
  try {
    const raw = window.localStorage.getItem(MASTER_LAYOUT_STORAGE_KEY);
    if (!raw) return mergeMasterCardLayout(null);
    const parsed = JSON.parse(raw);
    return mergeMasterCardLayout(parsed);
  } catch (err) {
    console.warn('Failed to parse saved master card layout, using default:', err);
    return mergeMasterCardLayout(null);
  }
}

/**
 * Save Master Card Layout to localStorage + broadcast update event + optional Supabase sync
 */
export async function saveMasterCardLayout(layoutConfig, syncRemote = true) {
  const merged = mergeMasterCardLayout(layoutConfig);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(MASTER_LAYOUT_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(MASTER_LAYOUT_EVENT, { detail: merged }));
    } catch (err) {
      console.warn('Failed to save master card layout to localStorage:', err);
    }
  }

  if (syncRemote && supabase) {
    try {
      await supabase
        .from('app_settings')
        .upsert(
          {
            key: 'master_id_card_layout_v2',
            value: merged,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );
    } catch {
      // Ignore if app_settings table does not exist in this project
    }
  }

  return merged;
}

/**
 * Reset Master Card Layout back to factory default
 */
export async function resetMasterCardLayout() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(MASTER_LAYOUT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  const defaults = mergeMasterCardLayout(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MASTER_LAYOUT_EVENT, { detail: defaults }));
  }
  return defaults;
}
