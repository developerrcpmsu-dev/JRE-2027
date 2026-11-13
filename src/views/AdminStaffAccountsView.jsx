import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Copy,
  Users,
  Building,
  Key,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { INITIAL_STAFF_ADMIN_ACCOUNTS } from '../data/defaultData';
import { DataService } from '../supabase';
import { confirmWithModal } from '../utils/confirmHelper';

export default function AdminStaffAccountsView({ 
  user = null, 
  triggerToast = null,
  onRefreshUserAccounts = null,
  askConfirm = null
}) {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('staff');
  const [formRoleLabel, setFormRoleLabel] = useState('');
  const [formInstitution, setFormInstitution] = useState('มมส');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load staff admin accounts
  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await DataService.getStaffAdminAccounts();
      setAccounts(Array.isArray(data) && data.length > 0 ? data : INITIAL_STAFF_ADMIN_ACCOUNTS);
    } catch (e) {
      console.error(e);
      setAccounts(INITIAL_STAFF_ADMIN_ACCOUNTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Save changes to backend strictly (update UI only after persistence succeeds)
  const persistAccounts = async (newList) => {
    const previousList = accounts;
    try {
      await DataService.saveStaffAdminAccounts(newList);
      setAccounts(newList);
      if (typeof onRefreshUserAccounts === 'function') {
        onRefreshUserAccounts();
      }
    } catch (err) {
      setAccounts(previousList);
      console.error('Error saving staff accounts:', err);
      if (triggerToast) triggerToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล', 'error');
      throw err;
    }
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormEmail('');
    setFormName('');
    setFormRole('staff');
    setFormRoleLabel('');
    setFormInstitution('มมส');
    setFormActive(true);
    setModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (acc, idx) => {
    setEditingIndex(idx);
    setFormEmail(acc.email || '');
    setFormName(acc.name || '');
    setFormRole(acc.role || 'staff');
    setFormRoleLabel(acc.role_label || '');
    setFormInstitution(acc.institution || 'มมส');
    setFormActive(acc.active !== false);
    setModalOpen(true);
  };

  // Submit Add/Edit form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formEmail.trim()) {
      if (triggerToast) triggerToast('กรุณากรอกอีเมล Google ให้ครบถ้วน', 'warning');
      return;
    }
    const cleanEmail = formEmail.trim().toLowerCase();
    const isEdit = editingIndex !== null;
    if (!isEdit && accounts.some(a => (a.email || '').toLowerCase() === cleanEmail)) {
      if (triggerToast) triggerToast(`อีเมล ${cleanEmail} มีอยู่ในระบบแล้ว`, 'warning');
      return;
    }

    const confirmed = await confirmWithModal(askConfirm, {
      title: isEdit ? 'ยืนยันการแก้ไขสิทธิ์บัญชี Staff/Admin' : 'ยืนยันการเพิ่มบัญชี Staff/Admin ใหม่',
      message: isEdit
        ? `ต้องการบันทึกการแก้ไขสิทธิ์ของ "${cleanEmail}" (${formRole.toUpperCase()}) ใช่หรือไม่?`
        : `ต้องการเพิ่มสิทธิ์ "${cleanEmail}" (${formRole.toUpperCase()}) เข้าสู่ระบบ Staff/Admin ใช่หรือไม่?`,
      confirmText: isEdit ? '💾 ยืนยันบันทึกการแก้ไข' : '✓ ยืนยันเพิ่มบัญชี',
      cancelText: 'ยกเลิก',
      variant: 'info'
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      let nextList = [...accounts];
      const entry = {
        email: cleanEmail,
        name: formName.trim() || cleanEmail.split('@')[0],
        role: formRole,
        role_label: formRoleLabel.trim() || (formRole === 'dev' ? '💻 System Developer' : formRole === 'admin' ? '🎖️ Executive Admin' : '🛠️ Operation Staff'),
        institution: formInstitution,
        active: formActive,
        updated_at: new Date().toISOString()
      };

      if (isEdit) {
        nextList[editingIndex] = { ...nextList[editingIndex], ...entry };
      } else {
        entry.created_at = new Date().toISOString();
        nextList.unshift(entry);
      }

      await persistAccounts(nextList);
      setModalOpen(false);
      if (triggerToast) {
        triggerToast(
          isEdit
            ? `✓ แก้ไขสิทธิ์บัญชี ${cleanEmail} เรียบร้อยแล้ว`
            : `✓ เพิ่มบัญชี Staff/Admin ${cleanEmail} สำเร็จ! เข้าสู่ระบบด้วย Google ได้ทันที`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (idx) => {
    if (isSubmitting) return;
    const target = accounts[idx];
    if (!target) return;
    const nextActive = target.active === false;
    const confirmed = await confirmWithModal(askConfirm, {
      title: nextActive ? 'ยืนยันการเปิดใช้งานบัญชี' : 'ยืนยันการระงับสิทธิ์บัญชี',
      message: nextActive
        ? `ต้องการเปิดใช้งานสิทธิ์ Staff/Admin ของ "${target.email}" ใช่หรือไม่?`
        : `ต้องการระงับสิทธิ์การใช้งานของ "${target.email}" ชั่วคราวใช่หรือไม่?`,
      confirmText: nextActive ? '✓ เปิดใช้งานบัญชี' : '🚫 ยืนยันระงับสิทธิ์',
      cancelText: 'ยกเลิก',
      variant: nextActive ? 'info' : 'warning'
    });
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      const nextList = accounts.map((acc, i) =>
        i === idx ? { ...acc, active: nextActive, updated_at: new Date().toISOString() } : acc
      );
      await persistAccounts(nextList);
      if (triggerToast) {
        triggerToast(`${nextActive ? '✓ เปิดใช้งาน' : '🚫 ระงับสิทธิ์'} บัญชี ${target.email} เรียบร้อยแล้ว`, nextActive ? 'success' : 'info');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete account
  const handleDelete = async (idx) => {
    if (isSubmitting) return;
    const target = accounts[idx];
    if (!target) return;
    if (target.email === 'developer.rcpmsu@gmail.com') {
      if (triggerToast) triggerToast('ไม่อนุญาตให้ลบบัญชีหลักของ Dev สูงสุด', 'error');
      return;
    }
    const confirmed = await confirmWithModal(askConfirm, {
      title: '🗑️ ยืนยันการลบบัญชีออกจากสิทธิ์ Staff/Admin',
      message: `ยืนยันการลบบัญชี "${target.name || target.email}" (${target.email}) ออกจากสิทธิ์ Staff/Admin หรือไม่?`,
      confirmText: '🗑️ ยืนยันลบบัญชี',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      const nextList = accounts.filter((_, i) => i !== idx);
      await persistAccounts(nextList);
      if (triggerToast) triggerToast(`✓ ลบบัญชี ${target.email} ออกจากสิทธิ์เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to default seed
  const handleResetToDefault = async () => {
    if (isSubmitting) return;
    const confirmed = await confirmWithModal(askConfirm, {
      title: 'ยืนยันการรีเซ็ตรายชื่อ Staff & Admin',
      message: 'ท่านต้องการรีเซ็ตรายชื่อ Staff & Admin กลับเป็นค่ามาตรฐาน 12 ท่านแรกเริ่มหรือไม่? (บัญชีที่เพิ่มเองจะถูกแทนที่)',
      confirmText: '↩️ ยืนยันรีเซ็ตค่ามาตรฐาน',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      await persistAccounts(INITIAL_STAFF_ADMIN_ACCOUNTS);
      if (triggerToast) triggerToast('✓ รีเซ็ตรายชื่อ Staff & Admin กลับสู่ค่ามาตรฐานเรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter(acc => {
    if (roleFilter !== 'all') {
      if (roleFilter === 'inactive' && acc.active !== false) return false;
      if (roleFilter !== 'inactive' && acc.role !== roleFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (acc.name || '').toLowerCase().includes(q);
      const matchEmail = (acc.email || '').toLowerCase().includes(q);
      const matchRole = (acc.role || '').toLowerCase().includes(q);
      const matchLabel = (acc.role_label || '').toLowerCase().includes(q);
      const matchUni = (acc.institution || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchRole || matchLabel || matchUni;
    }
    return true;
  });

  const devCount = accounts.filter(a => a.role === 'dev' && a.active !== false).length;
  const adminCount = accounts.filter(a => a.role === 'admin' && a.active !== false).length;
  const staffCount = accounts.filter(a => a.role === 'staff' && a.active !== false).length;
  const inactiveCount = accounts.filter(a => a.active === false).length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Single Sign-On (SSO) Role-Based Access Control</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                URL: /admin/staff-accounts
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🛡️ ศูนย์จัดการบัญชี & สิทธิ์ Staff / Admin (Google OAuth)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ผู้ใช้สามารถเข้าสู่ระบบด้วย Google ได้ทันที หากอีเมลตรงกับรายชื่อในตารางนี้ ระบบจะอนุมัติสิทธิ์เข้าใช้งาน <strong>Admin Console</strong> ให้โดยอัตโนมัติ โดยไม่ต้องจำรหัสผ่านแยก
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>➕ เพิ่มบัญชี Staff / Admin ใหม่</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="รีเซ็ตกลับสู่รายชื่อมาตรฐาน 12 ท่าน"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">รีเซ็ตเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-purple-500/20">
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-purple-500/30">
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold">
              <span>💻 ผู้พัฒนาระบบ (Dev)</span>
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{devCount} คน</div>
            <p className="text-[10px] text-purple-300/70 mt-0.5">สิทธิ์สูงสุด จัดการระบบ & สิทธิ์ทุกคน</p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-indigo-500/30">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-bold">
              <span>🎖️ ผู้ดูแลระบบ (Admin)</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{adminCount} คน</div>
            <p className="text-[10px] text-indigo-300/70 mt-0.5">ฝ่ายอำนวยการ ควบคุมการฝึก & จัดสรร</p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-sky-500/30">
            <div className="flex items-center justify-between text-sky-300 text-xs font-bold">
              <span>🛠️ สตาฟปฏิบัติการ (Staff)</span>
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{staffCount} คน</div>
            <p className="text-[10px] text-sky-300/70 mt-0.5">สแกน QR, เช็คชื่อ, จัดการเสื้อ & ห้องพัก</p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>👥 รวมผู้มีสิทธิ์ทั้งหมด</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{accounts.filter(a => a.active !== false).length} คน</div>
            <p className="text-[10px] text-slate-500 mt-0.5">ระงับสิทธิ์ชั่วคราว: {inactiveCount} คน</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ, อีเมล Google, สถาบัน หรือตำแหน่งหน้าที่..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ทั้งหมด ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('dev')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'dev'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            💻 Dev ({devCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'admin'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🎖️ Admin ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('staff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'staff'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🛠️ Staff ({staffCount})
          </button>
          {inactiveCount > 0 && (
            <button
              type="button"
              onClick={() => setRoleFilter('inactive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'inactive'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🚫 ระงับสิทธิ์ ({inactiveCount})
            </button>
          )}
        </div>
      </div>

      {/* ACCOUNTS TABLE */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-12">#</th>
              <th className="py-3 px-4">ชื่อ-สกุล / ข้อมูลผู้ใช้</th>
              <th className="py-3 px-4">อีเมล Google (Login Identifier)</th>
              <th className="py-3 px-3 text-center">สิทธิ์ (Role)</th>
              <th className="py-3 px-4">หน้าที่รับผิดชอบในโครงการ</th>
              <th className="py-3 px-3 text-center">สถาบัน</th>
              <th className="py-3 px-3 text-center">สถานะสิทธิ์</th>
              <th className="py-3 px-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Shield className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p>ไม่พบบัญชี Staff / Admin ที่ตรงกับเงื่อนไขการค้นหา</p>
                </td>
              </tr>
            ) : (
              filteredAccounts.map((acc, index) => {
                const originalIdx = accounts.findIndex(a => a.email === acc.email);
                const isActive = acc.active !== false;

                return (
                  <tr key={acc.email} className={`hover:bg-slate-800/40 transition-colors ${!isActive ? 'opacity-50 bg-slate-950/40' : ''}`}>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-bold">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs sm:text-sm">
                        {acc.name || 'ไม่ระบุชื่อ'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {acc.institution} • {acc.role === 'dev' ? 'System Developer' : acc.role === 'admin' ? 'Executive Committee' : 'Operation Staff'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-purple-200 font-bold text-xs bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-xl w-fit">
                        <span>{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(acc.email);
                            if (triggerToast) triggerToast(`คัดลอกอีเมล ${acc.email} แล้ว`, 'success');
                          }}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="คัดลอกอีเมล"
                        >
                          <Copy className="w-3 h-3 text-purple-400" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {acc.role === 'dev' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-200 border border-purple-400/50 shadow-sm inline-flex items-center gap-1">
                          💻 DEV
                        </span>
                      ) : acc.role === 'admin' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/50 shadow-sm inline-flex items-center gap-1">
                          🎖️ ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-200 border border-sky-400/50 shadow-sm inline-flex items-center gap-1">
                          🛠️ STAFF
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="max-w-xs truncate" title={acc.role_label}>
                        {acc.role_label || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        acc.institution === 'มมส'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}>
                        {acc.institution || 'มมส'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(originalIdx)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                        title="คลิกเพื่อเปิด/ระงับสิทธิ์"
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>ใช้งานได้</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>ระงับสิทธิ์</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(acc, originalIdx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลสิทธิ์"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(originalIdx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition-colors cursor-pointer"
                          title="ลบสิทธิ์"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingIndex !== null ? '✏️ แก้ไขสิทธิ์ Staff / Admin' : '➕ เพิ่มบัญชี Staff / Admin ใหม่'}
                </h3>
                <p className="text-xs text-slate-400">
                  กำหนดอีเมล Google ที่ได้รับอนุญาตให้เข้าสู่ระบบ Admin Console
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  อีเมล Google (Email Identifier) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="เช่น someone@gmail.com หรือ 67011312130@msu.ac.th"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  เมื่อผู้ใช้กด "เข้าสู่ระบบด้วย Google" ด้วยอีเมลนี้ จะได้รับสิทธิ์เข้า Admin ทันที
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ชื่อ-นามสกุล / นามเรียกขาน <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น นายเศรษฐบุตร อากานิส (โฟกัส)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ระดับสิทธิ์ (Role)
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="dev">💻 Dev (ผู้พัฒนาระบบ - สิทธิ์สูงสุด)</option>
                    <option value="admin">🎖️ Admin (ผู้ดูแลระบบหลัก / อำนวยการ)</option>
                    <option value="staff">🛠️ Staff (สตาฟฝ่ายปฏิบัติการ / เช็คชื่อ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    สถาบัน
                  </label>
                  <select
                    value={formInstitution}
                    onChange={(e) => setFormInstitution(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="มมส">มมส (มหาวิทยาลัยมหาสารคาม)</option>
                    <option value="มข">มข (มหาวิทยาลัยขอนแก่น)</option>
                    <option value="มทส">มทส (มหาวิทยาลัยเทคโนโลยีสุรนารี)</option>
                    <option value="มช">มช (มหาวิทยาลัยเชียงใหม่)</option>
                    <option value="มก">มก (มหาวิทยาลัยเกษตรศาสตร์)</option>
                    <option value="มพ">มพ (มหาวิทยาลัยพะเยา)</option>
                    <option value="มชร">มชร (มหาวิทยาลัยราชภัฏเชียงราย)</option>
                    <option value="มขก">มขก (มหาวิทยาลัยกาฬสินธุ์)</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  หน้าที่รับผิดชอบ / ตำแหน่งในโครงการ (Role Label)
                </label>
                <input
                  type="text"
                  value={formRoleLabel}
                  onChange={(e) => setFormRoleLabel(e.target.value)}
                  placeholder="เช่น ฝ่ายอำนวยการและควบคุมการฝึก (RCP 15-05)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="formActive" className="text-xs font-bold text-slate-300 cursor-pointer">
                  เปิดใช้งานสิทธิ์ทันที (Active Account)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : '💾 บันทึกสิทธิ์'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
