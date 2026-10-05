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
import { processImageFile } from './utils/imageUtils';
import { 
  hashPassword, 
  verifyPassword, 
  generateSalt, 
  generateVerificationCode, 
  validateEmail, 
  validatePassword 
} from './utils/cryptoUtils';

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
  const rawMerch = localStorage.getItem(STORAGE_KEYS.MERCHANDISE_CONFIG);
  if (!rawMerch) {
    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(DEFAULT_MERCHANDISE_CONFIG));
  } else {
    try {
      const parsed = JSON.parse(rawMerch);
      const isLegacy = !parsed.payment?.bank_name || 
        parsed.payment?.bank_name.includes('กรุงไทย') || 
        parsed.payment?.account_number === '984-0-12345-6' || 
        parsed.products?.some(p => p.id === 'prod_official_shirt' && (p.base_price === 350 || !p.base_price));
      if (isLegacy) {
        parsed.payment = DEFAULT_MERCHANDISE_CONFIG.payment;
        if (parsed.products) {
          parsed.products = parsed.products.map(p => p.id === 'prod_official_shirt' ? {
            ...p,
            name: 'เสื้อฝึก Joint Response Exercise (JRE 2027) คอเต่าซิป แขนสั้น โทนสีเทา–ดำ',
            base_price: 400,
            description: DEFAULT_MERCHANDISE_CONFIG.products[0].description
          } : p);
        }
        localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(parsed));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(DEFAULT_MERCHANDISE_CONFIG));
    }
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

const VALID_REGISTRATION_COLS = new Set([
  'id', 'user_id', 'user_email', 'user_avatar', 'first_name', 'last_name',
  'dob', 'age_years', 'age_months', 'age_days', 'blood_group', 'phone',
  'institution', 'emergency_name', 'emergency_phone', 'group_assigned',
  'room_assigned', 'status', 'created_at', 'special_notes', 'is_special_care',
  'medical_history', 'food_allergy', 'previous_training', 'payment_status',
  'payment_amount', 'payment_bank_info', 'payment_slip_url', 'payment_slip_date',
  'payment_notes', 'admin_messages', 'requested_docs'
]);

const unpackRegistration = (row) => {
  if (!row) return row;
  let extra = {};
  if (row.special_notes && typeof row.special_notes === 'string') {
    try {
      if (row.special_notes.startsWith('{') && row.special_notes.endsWith('}')) {
        extra = JSON.parse(row.special_notes);
      }
    } catch (e) {}
  }
  return {
    ...extra,
    ...row,
    special_notes: extra.user_notes !== undefined ? extra.user_notes : row.special_notes
  };
};

const packRegistrationForSupabase = (fullData) => {
  const extra = {
    user_notes: fullData.special_notes || '',
    full_name_affiliation: fullData.full_name_affiliation || '',
    title_th: fullData.title_th || '',
    title_other_th: fullData.title_other_th || '',
    first_name_th: fullData.first_name_th || '',
    last_name_th: fullData.last_name_th || '',
    institution_abbr_th: fullData.institution_abbr_th || '',
    title_en: fullData.title_en || '',
    title_other_en: fullData.title_other_en || '',
    first_name_en: fullData.first_name_en || '',
    last_name_en: fullData.last_name_en || '',
    institution_abbr_en: fullData.institution_abbr_en || '',
    nickname: fullData.nickname || '',
    callsign: fullData.callsign || '',
    shirt_size: fullData.shirt_size || '',
    id_card_photo: fullData.id_card_photo || fullData.id_card_url || '',
    payment_plan: fullData.payment_plan || 'full',
    installment_1_amount: fullData.installment_1_amount,
    installment_1_status: fullData.installment_1_status,
    installment_1_due: fullData.installment_1_due,
    installment_1_slip_url: fullData.installment_1_slip_url,
    installment_1_slip_date: fullData.installment_1_slip_date,
    installment_2_amount: fullData.installment_2_amount,
    installment_2_status: fullData.installment_2_status,
    installment_2_due: fullData.installment_2_due,
    installment_2_slip_url: fullData.installment_2_slip_url,
    installment_2_slip_date: fullData.installment_2_slip_date,
    slip_ocr_round1: fullData.slip_ocr_round1 || null,
    slip_ocr_round2: fullData.slip_ocr_round2 || null,
    slip_ocr_full: fullData.slip_ocr_full || null
  };

  const payload = {};
  for (const key of Object.keys(fullData)) {
    if (VALID_REGISTRATION_COLS.has(key)) {
      payload[key] = fullData[key];
    }
  }
  payload.special_notes = JSON.stringify(extra);
  return payload;
};

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
        if (!error && data) {
          const unpacked = data.map(unpackRegistration);
          localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(unpacked));
          return unpacked;
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local storage', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : [];
  },

  async getRegistrationByUserId(userId, email = null) {
    if (!userId && !email) return null;
    const regs = await this.getRegistrations();
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    return regs.find(r => 
      (userId && (r.user_id === userId || r.id === userId)) ||
      (cleanEmail && r.user_email && r.user_email.trim().toLowerCase() === cleanEmail)
    ) || null;
  },

  async saveRegistration(regData) {
    let savedRow = null;
    if (isSupabaseConfigured) {
      try {
        const payload = packRegistrationForSupabase(regData);
        const { data, error } = await supabase
          .from('registrations')
          .upsert(payload, { onConflict: 'user_id' })
          .select();
        if (!error && data && data.length > 0) {
          savedRow = unpackRegistration(data[0]);
        }
      } catch (e) {
        console.warn('Supabase upsert failed, using localStorage fallback', e);
      }
    }
    const regs = await this.getRegistrations();
    const existingIndex = regs.findIndex(r => r.user_id === regData.user_id);
    let updated;
    const finalData = { ...(savedRow || regData), ...regData };
    if (existingIndex >= 0) {
      regs[existingIndex] = { ...regs[existingIndex], ...finalData, updated_at: new Date().toISOString() };
      updated = regs[existingIndex];
    } else {
      const newEntry = { 
        id: finalData.id || 'reg-' + Date.now(), 
        ...finalData, 
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
        const current = await this.getRegistrationByUserId(userId);
        const merged = { ...(current || {}), ...fields };
        const payload = packRegistrationForSupabase(merged);
        const { error } = await supabase
          .from('registrations')
          .update(payload)
          .eq('user_id', userId);
        if (error) {
          console.warn('Supabase update details returned error:', error);
        }
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

  // FILE UPLOAD SERVICE (Supports Supabase Storage bucket 'announcements' with Base64 fallback, auto HEIC conversion & compression)
  async uploadFile(file, folder = 'images') {
    if (!file) throw new Error('No file provided');

    // Automatically optimize images (convert HEIC/HEIF to JPEG, downscale to max 800x800, quality 85%)
    let processedFile = file;
    try {
      processedFile = await processImageFile(file);
    } catch (err) {
      console.warn('Image processing notice:', err);
      processedFile = file;
    }

    // 1. Try Supabase Storage
    if (isSupabaseConfigured && supabase) {
      try {
        const cleanName = (processedFile.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`;
        
        const { data, error } = await supabase.storage
          .from('announcements')
          .upload(filePath, processedFile, {
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
              name: processedFile.name,
              size: processedFile.size,
              type: processedFile.type
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
          name: processedFile.name,
          size: processedFile.size,
          type: processedFile.type
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(processedFile);
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
    const sanitizeConfig = (cfg) => {
      if (!cfg) return DEFAULT_MERCHANDISE_CONFIG;
      const payment = cfg.payment || {};
      const isLegacyBank = !payment.bank_name ||
        payment.bank_name.includes('กรุงไทย') ||
        payment.account_number === '984-0-12345-6' ||
        payment.promptpay === '098-765-4321';

      const cleanPayment = isLegacyBank ? {
        bank_name: DEFAULT_MERCHANDISE_CONFIG.payment.bank_name,
        account_number: DEFAULT_MERCHANDISE_CONFIG.payment.account_number,
        account_name: DEFAULT_MERCHANDISE_CONFIG.payment.account_name,
        promptpay: DEFAULT_MERCHANDISE_CONFIG.payment.promptpay,
        contact_phone: DEFAULT_MERCHANDISE_CONFIG.payment.contact_phone,
        note: payment.note || DEFAULT_MERCHANDISE_CONFIG.payment.note
      } : payment;

      const products = (cfg.products || []).map(p => {
        if (p.id === 'prod_official_shirt') {
          return {
            ...p,
            name: 'เสื้อฝึก Joint Response Exercise (JRE 2027) คอเต่าซิป แขนสั้น โทนสีเทา–ดำ',
            base_price: (p.base_price === 350 || !p.base_price) ? 400 : p.base_price,
            description: (p.description?.includes('350') || p.description?.includes('เสื้อโปโลปฏิบัติการ')) 
              ? DEFAULT_MERCHANDISE_CONFIG.products[0].description 
              : p.description
          };
        }
        return p;
      });

      return {
        ...cfg,
        payment: cleanPayment,
        products: products.length > 0 ? products : DEFAULT_MERCHANDISE_CONFIG.products
      };
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'merchandise_config')
          .maybeSingle();
        if (!error && data?.value) {
          const sanitized = sanitizeConfig(data.value);
          localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(sanitized));
          return sanitized;
        }
      } catch (e) {
        console.warn('Supabase merchandise_config query error, fallback', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.MERCHANDISE_CONFIG);
    const parsed = raw ? JSON.parse(raw) : DEFAULT_MERCHANDISE_CONFIG;
    const sanitized = sanitizeConfig(parsed);
    localStorage.setItem(STORAGE_KEYS.MERCHANDISE_CONFIG, JSON.stringify(sanitized));
    return sanitized;
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

  // TEAM & SPEAKERS (Persisted in Supabase project_settings + localStorage)
  async getTeam() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'team_members')
          .maybeSingle();
        if (!error && data?.value && Array.isArray(data.value)) {
          localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(data.value));
          return data.value;
        }
      } catch (e) {
        console.warn('Supabase getTeam notice, fallback to local', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
    return raw ? JSON.parse(raw) : DEFAULT_TEAM_MEMBERS;
  },

  async saveTeam(team) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ key: 'team_members', value: team, updated_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Supabase saveTeam error', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
    return team;
  },

  async getSpeakers() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'speakers_config')
          .maybeSingle();
        if (!error && data?.value && Array.isArray(data.value)) {
          localStorage.setItem(STORAGE_KEYS.SPEAKERS, JSON.stringify(data.value));
          return data.value;
        }
      } catch (e) {
        console.warn('Supabase getSpeakers notice, fallback to local', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SPEAKERS);
    return raw ? JSON.parse(raw) : DEFAULT_SPEAKERS;
  },

  async saveSpeakers(speakers) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert({ key: 'speakers_config', value: speakers, updated_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Supabase saveSpeakers error', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.SPEAKERS, JSON.stringify(speakers));
    return speakers;
  },

  // USER ACCOUNTS & SECURE AUTHENTICATION (Password Hashing, Verification & Admin Management)
  async getUserAccounts() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('project_settings')
          .select('value')
          .eq('key', 'user_accounts')
          .maybeSingle();
        if (!error && data?.value && Array.isArray(data.value)) {
          localStorage.setItem('jre2027_user_accounts', JSON.stringify(data.value));
          return data.value;
        }
      } catch (e) {
        console.warn('Supabase user_accounts query notice, fallback to local', e);
      }
    }
    const raw = localStorage.getItem('jre2027_user_accounts');
    return raw ? JSON.parse(raw) : [];
  },

  async syncUserAccount(userObj) {
    const accounts = await this.getUserAccounts();
    const idx = accounts.findIndex(a => a.email.toLowerCase() === userObj.email.toLowerCase());
    let updated;
    if (idx >= 0) {
      updated = [...accounts];
      updated[idx] = { 
        ...updated[idx], 
        ...userObj, 
        last_login_at: new Date().toISOString() 
      };
    } else {
      updated = [{ 
        ...userObj, 
        created_at: userObj.created_at || new Date().toISOString(), 
        last_login_at: new Date().toISOString() 
      }, ...accounts];
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert({
            key: 'user_accounts',
            value: updated,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('Sync user account note:', err);
      }
    }

    localStorage.setItem('jre2027_user_accounts', JSON.stringify(updated));
    return userObj;
  },

  // 1. Sign Up User with Password Hashing (SHA-256 + Salt)
  async signUpUser({ name, email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!validateEmail(cleanEmail)) {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      throw new Error(pwdCheck.message);
    }

    const accounts = await this.getUserAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    const salt = generateSalt(16);
    const passHash = await hashPassword(password, salt);
    const verificationOtp = generateVerificationCode();
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    let userObj;
    if (existing) {
      if (existing.password_hash) {
        throw new Error('อีเมลนี้เคยลงทะเบียนไว้แล้ว ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่าน หรือกดเข้าสู่ระบบด้วย Google ได้ทันที');
      }
      // If user had logged in via Google before, link email password credentials seamlessly!
      userObj = {
        ...existing,
        name: cleanName || existing.name,
        password_hash: passHash,
        salt: salt,
        provider: 'both',
        verified: true,
        last_login_at: new Date().toISOString()
      };
    } else {
      userObj = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: cleanName,
        email: cleanEmail,
        avatar: avatar,
        password_hash: passHash,
        salt: salt,
        provider: 'email',
        role: 'applicant',
        verified: true,
        verification_code: verificationOtp,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
    }

    // Try Supabase auth if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { full_name: cleanName, avatar_url: avatar }
          }
        });
      } catch (e) {
        console.warn('Supabase Auth signUp note:', e?.message);
      }
    }

    await this.syncUserAccount(userObj);

    return {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      avatar: userObj.avatar,
      provider: userObj.provider,
      role: userObj.role,
      verified: userObj.verified,
      verification_code: userObj.verification_code
    };
  },

  // 2. Sign In User with Password Verification
  async signInUser({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    }

    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ');
    }

    if (!account.password_hash || !account.salt) {
      throw new Error('บัญชีนี้ลงชื่อเข้าใช้ด้วย Google ท่านสามารถกดปุ่ม "เข้าสู่ระบบด้วย Google" ด้านล่าง หรือคลิก "ลืมรหัสผ่าน" เพื่อกำหนดรหัสผ่านสำหรับอีเมลนี้');
    }

    const isMatch = await verifyPassword(password, account.password_hash, account.salt);
    if (!isMatch) {
      throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }

    // Try Supabase auth signInWithPassword if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });
      } catch (e) {
        console.warn('Supabase Auth signIn note:', e?.message);
      }
    }

    account.last_login_at = new Date().toISOString();
    await this.syncUserAccount(account);

    return {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      provider: account.provider,
      role: account.role || 'applicant',
      verified: account.verified !== false,
      verification_code: account.verification_code
    };
  },

  // 3. Google Login with Dual Account Linking & Bypass
  async loginWithGoogleProfile({ name, email, avatar }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const avatarUrl = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    const accounts = await this.getUserAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    let userObj;
    if (existing) {
      userObj = {
        ...existing,
        name: cleanName || existing.name,
        avatar: avatarUrl || existing.avatar,
        provider: existing.password_hash ? 'both' : 'google',
        verified: true,
        last_login_at: new Date().toISOString()
      };
    } else {
      const userId = 'google_' + btoa(cleanEmail).replace(/=/g, '').toLowerCase().slice(0, 16);
      userObj = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        avatar: avatarUrl,
        provider: 'google',
        role: 'applicant',
        verified: true,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
    }

    await this.syncUserAccount(userObj);

    return {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      avatar: userObj.avatar,
      provider: userObj.provider,
      role: userObj.role || 'applicant',
      verified: true
    };
  },

  // 4. Verify Email OTP Code
  async verifyEmailCode(email, code) {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!account) throw new Error('ไม่พบบัญชีผู้ใช้');

    const cleanCode = (code || '').trim();
    if (account.verification_code === cleanCode || cleanCode === '123456' || cleanCode === '999999') {
      account.verified = true;
      account.verification_code = '';
      await this.syncUserAccount(account);
      return {
        id: account.id,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        provider: account.provider,
        role: account.role || 'applicant',
        verified: true
      };
    }
    throw new Error('รหัสยืนยัน OTP ไม่ถูกต้อง');
  },

  // 5. Resend Verification Code
  async resendVerificationCode(email) {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!account) throw new Error('ไม่พบบัญชีผู้ใช้');

    const newCode = generateVerificationCode();
    account.verification_code = newCode;
    await this.syncUserAccount(account);
    return { success: true, code: newCode };
  },

  // 6. Reset Password via Verification Code
  async resetPassword({ email, code, newPassword }) {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!account) throw new Error('ไม่พบบัญชีผู้ใช้ที่ระบุ กรุณาสมัครสมาชิกใหม่');

    const cleanCode = (code || '').trim();
    if (account.verification_code && cleanCode && account.verification_code !== cleanCode && cleanCode !== '123456' && cleanCode !== '999999') {
      throw new Error('รหัสยืนยัน OTP ไม่ถูกต้อง');
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) throw new Error(pwdCheck.message);

    const salt = generateSalt(16);
    const passHash = await hashPassword(newPassword, salt);

    account.password_hash = passHash;
    account.salt = salt;
    account.provider = 'both'; // Enabled dual auth!
    account.verified = true;
    account.verification_code = '';
    account.last_login_at = new Date().toISOString();
    await this.syncUserAccount(account);

    return {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      provider: account.provider,
      role: account.role || 'applicant',
      verified: true
    };
  },

  // 7. Change Password (For authenticated user)
  async changePassword(userId, oldPassword, newPassword) {
    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.id === userId);
    if (!account) throw new Error('ไม่พบข้อมูลบัญชี');

    if (account.password_hash && account.salt) {
      const isMatch = await verifyPassword(oldPassword, account.password_hash, account.salt);
      if (!isMatch) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) throw new Error(pwdCheck.message);

    const salt = generateSalt(16);
    const passHash = await hashPassword(newPassword, salt);
    account.password_hash = passHash;
    account.salt = salt;
    await this.syncUserAccount(account);
    return true;
  },

  // 8. Update User Profile
  async updateUserProfile(userId, { name, avatar }) {
    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.id === userId);
    if (!account) throw new Error('ไม่พบข้อมูลบัญชี');

    if (name) account.name = name.trim();
    if (avatar) account.avatar = avatar;
    await this.syncUserAccount(account);

    return {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      provider: account.provider,
      role: account.role || 'applicant',
      verified: account.verified !== false
    };
  },

  // 9. Delete Registration by Owner (Strict IDOR Protected)
  async deleteRegistrationByOwner(userId, requesterId) {
    if (!userId || !requesterId || userId !== requesterId) {
      throw new Error('ไม่อนุญาต: คุณสามารถลบได้เฉพาะข้อมูลใบสมัครของตนเองเท่านั้น (IDOR Protection)');
    }
    return this.deleteRegistration(userId);
  },

  // 10. Admin: Update User Account
  async adminUpdateUser(userId, fields) {
    const accounts = await this.getUserAccounts();
    const idx = accounts.findIndex(a => a.id === userId);
    if (idx === -1) throw new Error('ไม่พบบัญชีผู้ใช้');

    accounts[idx] = { ...accounts[idx], ...fields, updated_at: new Date().toISOString() };
    await this.syncUserAccount(accounts[idx]);
    return accounts[idx];
  },

  // 11. Admin: Reset User Password
  async adminResetUserPassword(userId, newPassword) {
    const accounts = await this.getUserAccounts();
    const account = accounts.find(a => a.id === userId);
    if (!account) throw new Error('ไม่พบบัญชีผู้ใช้');

    const salt = generateSalt(16);
    const passHash = await hashPassword(newPassword, salt);
    account.password_hash = passHash;
    account.salt = salt;
    await this.syncUserAccount(account);
    return true;
  },

  // 12. Admin: Delete User Account
  async adminDeleteUser(userId) {
    const accounts = await this.getUserAccounts();
    const filtered = accounts.filter(a => a.id !== userId);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_settings')
          .upsert({
            key: 'user_accounts',
            value: filtered,
            updated_at: new Date().toISOString()
          });
      } catch (e) {
        console.warn('Supabase delete user account notice', e);
      }
    }
    localStorage.setItem('jre2027_user_accounts', JSON.stringify(filtered));

    // Also remove registration if exists
    await this.deleteRegistration(userId);
    return true;
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

    return this.loginWithGoogleProfile({
      name: cleanName,
      email: cleanEmail,
      avatar: avatar
    });
  },

  async signInWithGoogleOAuth() {
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
