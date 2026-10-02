import React from 'react';
import { ExternalLink, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function FormsBanner({ formsConfig }) {
  if (!formsConfig) return null;

  const activeForms = Object.entries(formsConfig).filter(([_, config]) => config.enabled && config.url);

  if (activeForms.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-rescue-950/80 via-slate-900 to-amber-950/80 border-y border-rescue-500/30 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rescue-500/20 text-rescue-400 border border-rescue-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              แบบทดสอบและประเมินผลโครงการ JRE 2027
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
                เปิดระบบแล้ว
              </span>
            </h4>
            <p className="text-xs text-slate-300">
              ผู้เข้าร่วมอบรมโปรดทำแบบทดสอบหรือแบบประเมินตามรายการที่เปิดให้ด้านล่างนี้
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formsConfig.pretest?.enabled && formsConfig.pretest?.url && (
            <a
              href={formsConfig.pretest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <span>ทำแบบทดสอบก่อนเรียน (Pre-Test)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {formsConfig.posttest?.enabled && formsConfig.posttest?.url && (
            <a
              href={formsConfig.posttest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <span>ทำแบบทดสอบหลังเรียน (Post-Test)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {formsConfig.evaluation?.enabled && formsConfig.evaluation?.url && (
            <a
              href={formsConfig.evaluation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <span>แบบประเมินความพึงพอใจ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
