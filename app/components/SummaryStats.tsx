'use client';

import React from 'react';
import { BatchSummary } from '@/lib/ghostScoreEngine';

interface SummaryStatsProps {
  summary: BatchSummary | null;
  onFilterClick?: (filterType: string) => void;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ summary, onFilterClick }) => {
  if (!summary) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-500 bg-red-50 border-red-200';
    if (score >= 45) return 'text-amber-500 bg-amber-50 border-amber-200';
    if (score >= 20) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            批次分析統計數據總覽 (Analysis Summary)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            共檢測 {summary.total} 筆日本職缺，採多維度企業招募與勞動法規交叉驗證
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">平均幽靈風險指數</div>
            <div className="text-2xl font-black text-slate-800">
              {summary.avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <div className={`px-3 py-2 rounded-xl border font-bold text-xs ${getScoreColor(summary.avgScore)}`}>
            {summary.avgScore >= 70 ? '整體偏高' : summary.avgScore >= 45 ? '中度警戒' : '多數正規'}
          </div>
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* High Risk */}
        <button
          onClick={() => onFilterClick?.('HIGH_RISK')}
          className="text-left p-3.5 rounded-xl bg-red-50/70 border border-red-100 hover:bg-red-100/60 transition group"
        >
          <div className="text-xs font-medium text-red-600 flex items-center justify-between">
            <span>🚨 高風險/釣魚</span>
            <span className="text-[10px] bg-red-200/60 px-1.5 py-0.5 rounded text-red-700">70+分</span>
          </div>
          <div className="text-2xl font-black text-red-700 mt-1.5 group-hover:scale-105 transition-transform">
            {summary.highRisk}
          </div>
          <div className="text-[11px] text-red-600/80 mt-1">需審慎避開之職缺</div>
        </button>

        {/* Suspicious */}
        <button
          onClick={() => onFilterClick?.('SUSPICIOUS')}
          className="text-left p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 hover:bg-amber-100/60 transition group"
        >
          <div className="text-xs font-medium text-amber-700 flex items-center justify-between">
            <span>⚠️ 存疑待查</span>
            <span className="text-[10px] bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-800">45-69分</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1.5 group-hover:scale-105 transition-transform">
            {summary.suspicious}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1">存在單項或多項疑點</div>
        </button>

        {/* Likely Real */}
        <button
          onClick={() => onFilterClick?.('SAFE')}
          className="text-left p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/60 transition group"
        >
          <div className="text-xs font-medium text-emerald-700 flex items-center justify-between">
            <span>✅ 高度真實</span>
            <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-800">&lt;45分</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 group-hover:scale-105 transition-transform">
            {summary.likelyReal + summary.lowRisk}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">官方直招/正規條款</div>
        </button>

        {/* みなし残業 */}
        <button
          onClick={() => onFilterClick?.('MINASHI')}
          className="text-left p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 hover:bg-purple-100/60 transition group"
        >
          <div className="text-xs font-medium text-purple-700 flex items-center justify-between">
            <span>⏱️ 固定加班</span>
            <span className="text-[10px] bg-purple-200/60 px-1.5 py-0.5 rounded text-purple-800">みなし</span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1.5 group-hover:scale-105 transition-transform">
            {summary.minashiZangyoCount}
          </div>
          <div className="text-[11px] text-purple-600/80 mt-1">含超時加班費條款</div>
        </button>

        {/* 黑心/詐騙特徵 */}
        <button
          onClick={() => onFilterClick?.('SCAM_BLACK')}
          className="text-left p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-100/60 transition group"
        >
          <div className="text-xs font-medium text-rose-700 flex items-center justify-between">
            <span>🚩 精神論/誘餌</span>
            <span className="text-[10px] bg-rose-200/60 px-1.5 py-0.5 rounded text-rose-800">ブラック</span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1.5 group-hover:scale-105 transition-transform">
            {summary.scamFlags}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">觸發家庭溫馨/SES等</div>
        </button>

        {/* 重複/定時重貼 */}
        <button
          onClick={() => onFilterClick?.('DUPLICATES')}
          className="text-left p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 hover:bg-blue-100/60 transition group"
        >
          <div className="text-xs font-medium text-blue-700 flex items-center justify-between">
            <span>🔄 洗版/重貼</span>
            <span className="text-[10px] bg-blue-200/60 px-1.5 py-0.5 rounded text-blue-800">洗版</span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1.5 group-hover:scale-105 transition-transform">
            {summary.duplicates + summary.reposts}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-1">同職缺重複洗版重貼</div>
        </button>
      </div>
    </div>
  );
};
