import React from 'react';

const TONE_STYLE = {
  cyan: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/45',
  indigo: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/45',
  emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/45',
  slate: 'bg-slate-800/90 text-slate-300 border-slate-700'
};

/**
 * แสดงป้ายกำกับว่าใครเป็นผู้อัปโหลดสลิป (Dev / Admin / เจ้าตัว / สลิปเดิม)
 */
export default function SlipUploaderBadge({
  uploader,
  size = 'xs',
  showActorName = false,
  className = ''
}) {
  if (!uploader) return null;
  const toneClass = TONE_STYLE[uploader.tone] || TONE_STYLE.slate;
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  const actorTitleParts = [
    uploader.label,
    uploader.actorName ? `โดย: ${uploader.actorName}` : '',
    uploader.actorEmail ? `(${uploader.actorEmail})` : ''
  ].filter(Boolean);

  return (
    <span
      title={actorTitleParts.join(' ')}
      className={`inline-flex items-center gap-1 rounded-md border font-bold leading-tight ${sizeClass} ${toneClass} ${className}`}
    >
      <span>{uploader.label}</span>
      {showActorName && uploader.actorName && uploader.type !== 'legacy' && (
        <span className="opacity-80 font-medium truncate max-w-[140px]">
          ({uploader.actorName})
        </span>
      )}
    </span>
  );
}
