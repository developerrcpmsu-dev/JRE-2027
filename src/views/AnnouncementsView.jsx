import React, { useState } from 'react';
import { 
  Bell, 
  Pin, 
  CreditCard, 
  MessageCircle, 
  AlertCircle, 
  Calendar, 
  ExternalLink, 
  Search,
  Filter
} from 'lucide-react';

export default function AnnouncementsView({ announcements }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'payment', label: '💰 ชำระค่าสมัคร' },
    { id: 'line_group', label: '💬 เข้ากลุ่มไลน์' },
    { id: 'order', label: '📋 คำสั่งโครงการ' },
    { id: 'change', label: '⚡ การเปลี่ยนแปลง' },
    { id: 'general', label: '📌 ทั่วไป' },
  ];

  const filtered = announcements.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'payment':
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">ค่าลงทะเบียน</span>;
      case 'line_group':
        return <span className="px-2.5 py-0.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-[10px] font-bold">กลุ่ม Line</span>;
      case 'order':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">คำสั่ง / ข้อปฏิบัติ</span>;
      case 'change':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold">แจ้งเปลี่ยนแปลง</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">ประกาศทั่วไป</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rescue-500/20 text-rescue-400 border border-rescue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          <Bell className="w-4 h-4 animate-bounce" />
          กระดานข่าวสารทางการ
        </div>
        <h1 className="text-3xl font-black text-white">
          ประกาศข่าวสารโครงการ JRE 2027
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          ติดตามประกาศคำสั่ง กำหนดการชำระเงิน ลิงก์เข้ากลุ่ม และข้อมูลอัปเดตจากคณะกรรมการฝึกอบรม
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาข้อความประกาศ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rescue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'bg-rescue-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ไม่พบประกาศในหมวดหมู่ที่เลือก</p>
          </div>
        ) : (
          filtered.map(item => (
            <article
              key={item.id}
              className={`bg-slate-900 border rounded-3xl p-6 sm:p-7 transition-all shadow-xl ${
                item.pinned 
                  ? 'border-rescue-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {item.pinned && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full shadow">
                      <Pin className="w-3 h-3 fill-slate-950" /> ปักหมุด
                    </span>
                  )}
                  {getCategoryBadge(item.category)}
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'เพิ่งประกาศ'}
                  </span>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug">
                {item.title}
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 whitespace-pre-line">
                {item.content}
              </p>

              {item.action_url && (
                <div className="pt-2">
                  <a
                    href={item.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rescue-600 hover:bg-rescue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <span>{item.action_label || 'เปิดดูรายละเอียด'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </article>
          ))
        )}
      </div>

    </div>
  );
}
