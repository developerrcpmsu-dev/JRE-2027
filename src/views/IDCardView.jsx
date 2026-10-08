import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import IDCardPreview from '../components/IDCardPreview';

export default function IDCardView({
  user,
  registration,
  onNavigateDashboard,
  onNavigateRegister
}) {
  if (!registration) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-2xl">
          🪪
        </div>
        <h1 className="mt-4 text-xl font-black text-white">ยังไม่มีบัตร ID Card</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
          กรุณาเข้าสู่ระบบและกรอกใบสมัคร JRE 2027 ให้ครบก่อน ระบบจึงจะสร้างบัตรประจำตัวจากข้อมูลผู้สมัครจริงของท่าน
        </p>
        <button
          type="button"
          onClick={onNavigateRegister}
          className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/20 transition-transform hover:from-orange-400 hover:to-amber-400 active:scale-95"
        >
          ไปกรอกใบสมัคร JRE 2027
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
              JRE 2027 • Digital Badge
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> เชื่อมข้อมูลใบสมัครแล้ว
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">บัตรประจำตัวผู้เข้าร่วมโครงการ</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
            ใช้รูปถ่ายและข้อมูลจากใบสมัครจริง • พิมพ์เป็นบัตรแนวนอนขนาดมาตรฐานได้ • QR Code สำหรับเจ้าหน้าที่ Admin สแกนตรวจสอบ (Universal Scanner)
          </p>
        </div>

        {onNavigateDashboard && (
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:border-orange-400/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับแดชบอร์ด
          </button>
        )}
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl sm:p-7">
        <IDCardPreview registration={registration} user={user} />
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Data source</p>
          <p className="mt-1 text-xs font-bold text-white">ข้อมูลผู้สมัคร JRE 2027</p>
          <p className="mt-1 text-[11px] text-slate-500">แก้ไขที่ใบสมัครแล้วบัตรจะอัปเดตตามข้อมูลจริง</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Admin lookup</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-white"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> สแกนดูประวัติละเอียด</p>
          <p className="mt-1 text-[11px] text-slate-500">รหัสใน QR ไม่มีชื่อหรือข้อมูลสุขภาพฝังอยู่</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">On-site use</p>
          <p className="mt-1 text-xs font-bold text-white">แสดงบัตรต่อเจ้าหน้าที่</p>
          <p className="mt-1 text-[11px] text-slate-500">ใช้ภาพหน้าจอหรือพิมพ์เป็นบัตรจริงได้</p>
        </div>
      </div>
    </div>
  );
}
