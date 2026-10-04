import React from 'react';
import { ExternalLink, Sparkles, GraduationCap, Award, CheckCircle2 } from 'lucide-react';

export default function FormsBanner({ formsConfig, user }) {
  // Hide completely when user is logged out
  if (!user) return null;
  if (!formsConfig) return null;

  const activeForms = Object.entries(formsConfig).filter(([_, config]) => config.enabled && config.url);
  if (activeForms.length === 0) return null;

  return (
    <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-1">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-700/70 hover:border-slate-600/80 p-3.5 sm:p-5 shadow-2xl shadow-orange-500/5 backdrop-blur-xl transition-all duration-300">
        
        {/* Ambient Subtle Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left Title & Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/25 via-rescue-500/25 to-amber-400/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10 group">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-black text-white text-sm sm:text-base tracking-tight">
                  แบบทดสอบและประเมินผลโครงการ JRE 2027
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>เปิดระบบแล้ว</span>
                </span>
              </div>
              <p className="text-xs text-slate-300/90 mt-0.5 font-medium leading-relaxed">
                ผู้เข้าร่วมโครงการโปรดทำแบบทดสอบหรือประเมินผลตามลำดับขั้นตอนด้านล่างนี้
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {formsConfig.pretest?.enabled && formsConfig.pretest?.url && (
              <a
                href={formsConfig.pretest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-500/45 border border-blue-400/30 hover:border-blue-300/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer whitespace-nowrap"
              >
                <GraduationCap className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                <span>{formsConfig.pretest.title || 'ทำแบบทดสอบก่อนเรียน (Pre-Test)'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}

            {formsConfig.posttest?.enabled && formsConfig.posttest?.url && (
              <a
                href={formsConfig.posttest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rescue-600 via-orange-600 to-amber-600 hover:from-rescue-500 hover:to-amber-500 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-lg shadow-orange-600/25 hover:shadow-orange-500/45 border border-orange-400/30 hover:border-orange-300/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer whitespace-nowrap"
              >
                <Award className="w-4 h-4 text-orange-200 group-hover:scale-110 transition-transform" />
                <span>{formsConfig.posttest.title || 'ทำแบบทดสอบหลังเรียน (Post-Test)'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-orange-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}

            {formsConfig.evaluation?.enabled && formsConfig.evaluation?.url && (
              <a
                href={formsConfig.evaluation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/45 border border-emerald-400/30 hover:border-emerald-300/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>{formsConfig.evaluation.title || 'แบบประเมินความพึงพอใจ'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
