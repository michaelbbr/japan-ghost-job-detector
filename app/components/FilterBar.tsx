'use client';

import React from 'react';

export type FilterCategory = 'ALL' | 'HIGH_RISK' | 'SUSPICIOUS' | 'SAFE' | 'MINASHI' | 'SCAM_BLACK' | 'DUPLICATES';
export type SortOption = 'SCORE_DESC' | 'SCORE_ASC' | 'DATE_DESC' | 'DATE_ASC';

interface FilterBarProps {
  currentFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  currentSort,
  onSortChange,
  totalFilteredCount,
}) => {
  const filterButtons: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'ALL', label: '全部顯示', icon: '📋' },
    { id: 'HIGH_RISK', label: '高風險/釣魚', icon: '🚨' },
    { id: 'SUSPICIOUS', label: '存疑待查', icon: '⚠️' },
    { id: 'SAFE', label: '正規安全', icon: '✅' },
    { id: 'MINASHI', label: '含みなし残業', icon: '⏱️' },
    { id: 'SCAM_BLACK', label: '黑心/精神論/SES', icon: '🚩' },
    { id: 'DUPLICATES', label: '重複洗版/重貼', icon: '🔄' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-6 space-y-4">
      {/* Top row: search & sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="搜尋職缺名稱、企業名稱、工作地點或關鍵字 (如: メルカリ, SES, 未経験, 残業)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">排序：</span>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="SCORE_DESC">幽靈風險：由高至低 ⬇</option>
            <option value="SCORE_ASC">幽靈風險：由低至高 ⬆</option>
            <option value="DATE_DESC">刊登日期：最新發布 ⬇</option>
            <option value="DATE_ASC">刊登日期：滯留最久 ⬆</option>
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {filterButtons.map((btn) => {
          const isActive = currentFilter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          );
        })}
        <div className="ml-auto text-xs text-slate-400 pl-2 whitespace-nowrap">
          顯示 <span className="font-bold text-slate-700">{totalFilteredCount}</span> 筆
        </div>
      </div>
    </div>
  );
};
