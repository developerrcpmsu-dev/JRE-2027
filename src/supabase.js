import { createClient } from '@supabase/supabase-js';
import { 
  DEFAULT_ANNOUNCEMENTS, 
  DEFAULT_FORMS_CONFIG, 
  DEFAULT_TEAM_MEMBERS, 
  DEFAULT_SPEAKERS,
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_MERCHANDISE_CONFIG,
  DEFAULT_MERCHANDISE_ORDERS
} from './data/defaultData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '292467898061-a10ff6et3k1up950hfvstelqh7hu5f6d.apps.googleusercontent.com';

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
  PAYMENT_CONFIG: 'jre2027_payment_config',
  MERCHANDISE_CONFIG: 'jre2027_merchandise_config',
  MERCHANDISE_ORDERS: 'jre2027_merchandise_orders',
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
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIG)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(DEFAULT_PAYMENT_CONFIG));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MERCHANDISE_CONFIG)) {
    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(DEFAULT_MERCHANDISE_CONFIG));
  }
  // Start with empty real merchandise orders & purge any legacy mock orders
  const existingOrders = localStorage.getItem(STORAGE_KEYS.MERCHANDISE_ORDERS);
  if (existingOrders) {
    try {
      const parsed = JSON.parse(existingOrders);
      if (Array.isArray(parsed)) {
        const filteredReal = parsed.filter(o => o.id !== 'order_jre_01' && o.id !== 'order_jre_02');
        localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify(filteredReal));
      } else {
        localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify([]));
      }
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify([]));
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify([]));
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

  async updateRegistrationAllocations(userId, fields) {
    return this.updateRegistrationDetails(userId, fields);
  },

  async updateRegistrationDetails(userId, fields) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('registrations')
          .update(fields)
          .eq('user_id', userId);
        if (!error) return true;
        console.warn('Supabase update details returned error:', error);
      } catch (e) {
        console.warn('Supabase update details failed, fallback to local', e);
      }
    }
    const regs = await this.getRegistrations();
    const updated = regs.map(r => r.user_id === userId ? { ...r, ...fields, updated_at: new Date().toISOString() } : r);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    return true;
  },

  // Submit Payment Slip
  async submitPaymentSlip(userId, slipUrl) {
    return this.updateRegistrationDetails(userId, {
      payment_slip_url: slipUrl,
      payment_slip_date: new Date().toISOString(),
      payment_status: 'pending_review'
    });
  },

  // User submits an installment payment slip (Round 1 or Round 2)
  async submitInstallmentSlip(userId, round, slipUrl) {
    const update = {
      payment_plan: 'installment',
      [`installment_${round}_slip_url`]: slipUrl,
      [`installment_${round}_slip_date`]: new Date().toISOString(),
      [`installment_${round}_status`]: 'pending_review'
    };
    return this.updateRegistrationDetails(userId, update);
  },

  // Send Admin Message to User
  async sendAdminMessage(userId, messageText, extraData = {}) {
    const regs = await this.getRegistrations();
    const target = regs.find(r => r.user_id === userId);
    const existingMessages = Array.isArray(target?.admin_messages) ? target.admin_messages : [];
    
    const newMsg = {
      id: 'msg-' + Date.now(),
      text: messageText,
      created_at: new Date().toISOString(),
      ...extraData
    };

    const updatedMessages = [newMsg, ...existingMessages];
    const updatePayload = { admin_messages: updatedMessages };

    if (extraData.payment_amount !== undefined) {
      updatePayload.payment_amount = extraData.payment_amount;
    }
    if (extraData.payment_bank_info) {
      updatePayload.payment_bank_info = extraData.payment_bank_info;
    }
    if (extraData.payment_status) {
      updatePayload.payment_status = extraData.payment_status;
    }

    return this.updateRegistrationDetails(userId, updatePayload);
  },

  // Request or update documents checklist
  async updateRequestedDocs(userId, docsList) {
    return this.updateRegistrationDetails(userId, { requested_docs: docsList });
  },

  // User submits a document
  async submitUserDoc(userId, docId, fileUrl, fileName) {
    const regs = await this.getRegistrations();
    const target = regs.find(r => r.user_id === userId);
    const docs = Array.isArray(target?.requested_docs) ? [...target.requested_docs] : [];
    
    const docIdx = docs.findIndex(d => d.id === docId);
    if (docIdx >= 0) {
      docs[docIdx] = {
        ...docs[docIdx],
        file_url: fileUrl,
        file_name: fileName,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      };
    } else {
      docs.push({
        id: docId,
        title: fileName,
        file_url: fileUrl,
        file_name: fileName,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      });
    }

    return this.updateRegistrationDetails(userId, { requested_docs: docs });
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
    const annToSave = {
      ...announcement,
      images: Array.isArray(announcement.images) ? announcement.images : [],
      pdf_url: announcement.pdf_url || '',
      pdf_name: announcement.pdf_name || ''
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .upsert(annToSave)
          .select();
        if (!error && data && data.length > 0) return data[0];
        if (error) console.warn('Supabase announcement save error details:', error);
      } catch (e) {
        console.warn('Supabase announcement save error', e);
      }
    }
    const items = await this.getAnnouncements();
    let updated;
    if (annToSave.id) {
      const idx = items.findIndex(i => i.id === annToSave.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...annToSave };
        updated = items[idx];
      } else {
        items.unshift(annToSave);
        updated = annToSave;
      }
    } else {
      updated = {
        id: 'ann-' + Date.now(),
        ...annToSave,
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

  // FILE UPLOAD SERVICE (Supports Supabase Storage bucket 'announcements' with Base64 fallback)
  async uploadFile(file, folder = 'images') {
    if (!file) throw new Error('No file provided');

    // 1. Try Supabase Storage
    if (isSupabaseConfigured && supabase) {
      try {
        const cleanName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
        
        const { data, error } = await supabase.storage
          .from('announcements')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from('announcements')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            return {
              url: urlData.publicUrl,
              name: file.name,
              size: file.size,
              type: file.type
            };
          }
        } else {
          console.warn('Supabase storage upload failed:', error?.message);
        }
      } catch (err) {
        console.warn('Supabase storage upload exception:', err);
      }
    }

    // 2. Fallback to FileReader Base64 Data URL so uploads never fail
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  // FORMS CONFIG (Pre-test, Post-test, Evaluation)
  async getFormsConfig() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'forms_config')
          .maybeSingle();
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

  // PAYMENT & INSTALLMENT CONFIG
  async getPaymentConfig() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'payment_config')
          .maybeSingle();
        if (!error && data?.value) {
          localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(data.value));
          return data.value;
        }
      } catch (e) {
        console.warn('Supabase payment_config query error, fallback', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_PAYMENT_CONFIG;
  },

  async savePaymentConfig(config) {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ key: 'payment_config', value: config, updated_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Supabase payment_config save error', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(config));
    return config;
  },

  // MERCHANDISE CONFIG & STORE SETTINGS
  async getMerchandiseConfig() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'merchandise_config')
          .maybeSingle();
        if (!error && data?.value) {
          localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(data.value));
          return data.value;
        }
      } catch (e) {
        console.warn('Supabase merchandise_config query error, fallback', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.MERCHANDISE_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_MERCHANDISE_CONFIG;
  },

  async saveMerchandiseConfig(config) {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ key: 'merchandise_config', value: config, updated_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Supabase merchandise_config save error', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(config));
    return config;
  },

  // MERCHANDISE ORDERS (Synced via project_settings with zero mock data)
  async getMerchandiseOrders() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'merchandise_orders')
          .maybeSingle();
        if (!error && data?.value && Array.isArray(data.value)) {
          const realOrders = data.value.filter(o => o.id !== 'order_jre_01' && o.id !== 'order_jre_02');
          localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify(realOrders));
          return realOrders;
        }
      } catch (e) {
        console.warn('Supabase merchandise_orders query notice, fallback to local', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.MERCHANDISE_ORDERS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(o => o.id !== 'order_jre_01' && o.id !== 'order_jre_02') : [];
    } catch (e) {
      return [];
    }
  },

  async saveMerchandiseOrder(orderData) {
    const orders = await this.getMerchandiseOrders();
    const newOrder = {
      ...orderData,
      id: orderData.id || `order_${Date.now()}`,
      order_number: orderData.order_number || `JRE-SHIRT-${Math.floor(10000 + Math.random() * 90000)}`,
      created_at: orderData.created_at || new Date().toISOString()
    };

    const idx = orders.findIndex(o => o.id === newOrder.id || o.order_number === newOrder.order_number);
    let updated;
    if (idx >= 0) {
      updated = [...orders];
      updated[idx] = newOrder;
    } else {
      updated = [newOrder, ...orders];
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ 
            key: 'merchandise_orders', 
            value: updated, 
            updated_at: new Date().toISOString() 
          });
      } catch (e) {
        console.warn('Supabase saveMerchandiseOrder notice, fallback to local', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify(updated));
    return newOrder;
  },

  async updateMerchandiseOrder(orderId, patch) {
    const orders = await this.getMerchandiseOrders();
    const idx = orders.findIndex(o => o.id === orderId || o.order_number === orderId);
    if (idx === -1) return null;

    const updatedOrder = { ...orders[idx], ...patch, updated_at: new Date().toISOString() };
    const updated = [...orders];
    updated[idx] = updatedOrder;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ 
            key: 'merchandise_orders', 
            value: updated, 
            updated_at: new Date().toISOString() 
          });
      } catch (e) {
        console.warn('Supabase updateMerchandiseOrder notice, fallback to local', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_ORDERS, JSON.stringify(updated));
    return updatedOrder;
  },

  async verifyOrderPayment(orderId, isApproved, adminNotes = '') {
    return this.updateMerchandiseOrder(orderId, {
      payment_status: isApproved ? 'paid_verified' : 'rejected',
      slip_admin_notes: adminNotes,
      pickup_status: isApproved ? 'ready' : 'pending'
    });
  },

  async markOrderReceived(orderId, adminName = 'Admin JRE 2027') {
    return this.updateMerchandiseOrder(orderId, {
      pickup_status: 'received',
      pickup_at: new Date().toISOString(),
      pickup_by_admin: adminName
    });
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
  },

  // USER ACCOUNTS & REAL AUTHENTICATION
  async getUserAccounts() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase user_accounts query error, fallback', e);
      }
    }
    const raw = localStorage.getItem('jre2027_user_accounts');
    return raw ? JSON.parse(raw) : [];
  },

  async syncUserAccount(userObj) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_accounts')
          .upsert({
            id: userObj.id,
            name: userObj.name,
            email: userObj.email,
            avatar: userObj.avatar || '',
            role: userObj.role || 'applicant',
            provider: userObj.provider || 'email',
            last_login_at: new Date().toISOString()
          }, { onConflict: 'email' })
          .select();
        if (!error && data && data[0]) return data[0];
      } catch (err) {
        console.warn('Sync user account error:', err);
      }
    }
    const raw = localStorage.getItem('jre2027_user_accounts');
    const accounts = raw ? JSON.parse(raw) : [];
    const idx = accounts.findIndex(a => a.email === userObj.email);
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...userObj, last_login_at: new Date().toISOString() };
    } else {
      accounts.unshift({ ...userObj, created_at: new Date().toISOString(), last_login_at: new Date().toISOString() });
    }
    localStorage.setItem('jre2027_user_accounts', JSON.stringify(accounts));
    return userObj;
  },

  async signUpUser({ name, email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    let userId = 'usr_' + Date.now();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            avatar_url: avatar
          }
        }
      });
      if (error) throw error;
      if (data?.user?.id) {
        userId = data.user.id;
      }
    }

    const userObj = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      avatar: avatar,
      provider: 'email',
      role: 'applicant',
      verified: true
    };

    await this.syncUserAccount(userObj);
    return userObj;
  },

  async signInUser({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });
      if (error) throw error;
      
      const user = data.user;
      const userObj = {
        id: user.id,
        name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
        email: user.email,
        avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
        provider: 'email',
        role: 'applicant',
        verified: true
      };

      await this.syncUserAccount(userObj);
      return userObj;
    }

    throw new Error('ระบบ Supabase ไม่ได้เชื่อมต่อ');
  },

  async loginWithGoogleProfile({ name, email, avatar }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const avatarUrl = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const userId = 'google_' + btoa(cleanEmail).replace(/=/g, '').toLowerCase().slice(0, 16);

    const userObj = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      avatar: avatarUrl,
      provider: 'google',
      role: 'applicant',
      verified: true
    };

    await this.syncUserAccount(userObj);
    return userObj;
  },

  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse Google JWT credential:', e);
      return null;
    }
  },

  async handleGoogleCredential(credentialResponse) {
    if (!credentialResponse?.credential) throw new Error('No credential received from Google');
    const payload = this.parseJwt(credentialResponse.credential);
    if (!payload || !payload.email) throw new Error('Invalid Google credential payload');

    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name || cleanEmail.split('@')[0];
    const avatar = payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const userId = payload.sub ? `google_${payload.sub}` : `usr_${Date.now()}`;

    const userObj = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      avatar: avatar,
      provider: 'google',
      role: 'applicant',
      verified: true
    };

    // Try Supabase auth signInWithIdToken if Supabase project has Google enabled
    if (isSupabaseConfigured && supabase?.auth?.signInWithIdToken) {
      try {
        await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credentialResponse.credential
        });
      } catch (e) {
        console.warn('Supabase signInWithIdToken note:', e?.message);
      }
    }

    await this.syncUserAccount(userObj);
    return userObj;
  },

  async signInWithGoogleOAuth() {
    // If Supabase OAuth is attempted but Google is not enabled on Supabase, catch gracefully
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });
        if (error) {
          console.warn('Supabase signInWithOAuth note (using client token flow instead):', error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.warn('Supabase OAuth notice:', err?.message);
        return null;
      }
    }
    return null;
  }
};
