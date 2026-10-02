import { createClient } from '@supabase/supabase-js';
import { 
  DEFAULT_ANNOUNCEMENTS, 
  DEFAULT_FORMS_CONFIG, 
  DEFAULT_TEAM_MEMBERS, 
  DEFAULT_SPEAKERS 
} from './data/defaultData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// LocalStorage Keys for persistent fallback
const STORAGE_KEYS = {
  REGISTRATIONS: 'jre2027_registrations',
  ANNOUNCEMENTS: 'jre2027_announcements',
  FORMS_CONFIG: 'jre2027_forms_config',
  AUTH_USER: 'jre2027_auth_user',
  ADMIN_AUTH: 'jre2027_is_admin',
  TEAM: 'jre2027_team',
  SPEAKERS: 'jre2027_speakers'
};

// Initialize LocalStorage defaults if empty
function initializeLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FORMS_CONFIG)) {
    localStorage.setItem(STORAGE_KEYS.FORMS_CONFIG, JSON.stringify(DEFAULT_FORMS_CONFIG));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
    // Start with empty real registrations
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEAM)) {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(DEFAULT_TEAM_MEMBERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SPEAKERS)) {
    localStorage.setItem(STORAGE_KEYS.SPEAKERS, JSON.stringify(DEFAULT_SPEAKERS));
  }
}

// Run init
if (typeof window !== 'undefined') {
  initializeLocalStorage();
}

/**
 * Data Service API - bridges Supabase and LocalStorage smoothly
 */
export const DataService = {
  // REGISTRATIONS
  async getRegistrations() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local storage', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : [];
  },

  async getRegistrationByUserId(userId) {
    if (!userId) return null;
    const regs = await this.getRegistrations();
    return regs.find(r => r.user_id === userId) || null;
  },

  async saveRegistration(regData) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .upsert(regData, { onConflict: 'user_id' })
          .select();
        if (!error && data) return data[0];
      } catch (e) {
        console.warn('Supabase upsert failed, using localStorage fallback', e);
      }
    }
    const regs = await this.getRegistrations();
    const existingIndex = regs.findIndex(r => r.user_id === regData.user_id);
    let updated;
    if (existingIndex >= 0) {
      regs[existingIndex] = { ...regs[existingIndex], ...regData, updated_at: new Date().toISOString() };
      updated = regs[existingIndex];
    } else {
      const newEntry = { 
        id: 'reg-' + Date.now(), 
        ...regData, 
        created_at: new Date().toISOString() 
      };
      regs.unshift(newEntry);
      updated = newEntry;
    }
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
    return updated;
  },

  async updateRegistrationAllocations(userId, { group_assigned, room_assigned }) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('registrations')
          .update({ group_assigned, room_assigned })
          .eq('user_id', userId);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase update failed, fallback to local', e);
      }
    }
    const regs = await this.getRegistrations();
    const updated = regs.map(r => r.user_id === userId ? { ...r, group_assigned, room_assigned } : r);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    return true;
  },

  async deleteRegistration(userId) {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('registrations').delete().eq('user_id', userId);
      } catch (e) {
        console.warn('Supabase delete error', e);
      }
    }
    const regs = await this.getRegistrations();
    const filtered = regs.filter(r => r.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(filtered));
    return true;
  },

  // ANNOUNCEMENTS
  async getAnnouncements() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase announcements query error, fallback', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : DEFAULT_ANNOUNCEMENTS;
  },

  async saveAnnouncement(announcement) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .upsert(announcement)
          .select();
        if (!error && data) return data[0];
      } catch (e) {
        console.warn('Supabase announcement save error', e);
      }
    }
    const items = await this.getAnnouncements();
    let updated;
    if (announcement.id) {
      const idx = items.findIndex(i => i.id === announcement.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...announcement };
        updated = items[idx];
      } else {
        items.unshift(announcement);
        updated = announcement;
      }
    } else {
      updated = {
        id: 'ann-' + Date.now(),
        ...announcement,
        created_at: new Date().toISOString()
      };
      items.unshift(updated);
    }
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(items));
    return updated;
  },

  async deleteAnnouncement(id) {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase announcement delete error', e);
      }
    }
    const items = await this.getAnnouncements();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));
    return true;
  },

  // FORMS CONFIG (Pre-test, Post-test, Evaluation)
  async getFormsConfig() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'forms_config')
          .single();
        if (!error && data?.value) return data.value;
      } catch (e) {
        console.warn('Supabase forms_config query error, fallback', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.FORMS_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_FORMS_CONFIG;
  },

  async saveFormsConfig(config) {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ key: 'forms_config', value: config, updated_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Supabase forms_config save error', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.FORMS_CONFIG, JSON.stringify(config));
    return config;
  },

  // TEAM & SPEAKERS
  getTeam() {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
    return raw ? JSON.parse(raw) : DEFAULT_TEAM_MEMBERS;
  },

  saveTeam(team) {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
    return team;
  },

  getSpeakers() {
    const raw = localStorage.getItem(STORAGE_KEYS.SPEAKERS);
    return raw ? JSON.parse(raw) : DEFAULT_SPEAKERS;
  },

  saveSpeakers(speakers) {
    localStorage.setItem(STORAGE_KEYS.SPEAKERS, JSON.stringify(speakers));
    return speakers;
  }
};
