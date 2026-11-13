import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationBar({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemLabel = 'รายการ'
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = totalItems === 0 ? 0 : Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = totalItems === 0 ? 0 : Math.min(totalItems, safePage * pageSize);

  const getVisiblePages = () => {
    if (totalItems === 0) return [0];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, safePage - 1, safePage, safePage + 1]);
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
      <div className="text-slate-400 font-medium">
        {totalItems === 0 ? (
          <span>แสดง 0 {itemLabel}</span>
        ) : (
          <span>
            แสดงลำดับที่ <strong className="text-white font-mono">{startIdx}–{endIdx}</strong> จากทั้งหมด{' '}
            <strong className="text-sky-300 font-mono">{totalItems}</strong> {itemLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => safePage > 1 && onPageChange(safePage - 1)}
          disabled={totalItems === 0 || safePage <= 1}
          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold transition-colors cursor-pointer"
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </button>

        {visiblePages.map((p, idx) => {
          const prev = visiblePages[idx - 1];
          const showDots = prev && p - prev > 1;
          const isActive = p === safePage;
          return (
            <React.Fragment key={p}>
              {showDots && <span className="px-1.5 text-slate-500 font-mono">…</span>}
              <button
                type="button"
                disabled={p === 0}
                onClick={() => p > 0 && onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-xl font-mono font-bold text-xs border transition-all ${
                  isActive
                    ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer'
                } ${p === 0 ? 'cursor-default opacity-70' : ''}`}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

        <span className="px-2 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400">
          {totalItems === 0 ? '0 / 0' : `${safePage} / ${totalPages}`}
        </span>

        <button
          type="button"
          onClick={() => safePage < totalPages && onPageChange(safePage + 1)}
          disabled={totalItems === 0 || safePage >= totalPages}
          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold transition-colors cursor-pointer"
          title="หน้าถัดไป"
        >
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
