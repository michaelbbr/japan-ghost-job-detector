'use client';

import React, { useState } from 'react';
import { JobInput } from '@/lib/ghostScoreEngine';

interface SingleJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitJob: (job: JobInput) => void;
}

export const SingleJobModal: React.FC<SingleJobModalProps> = ({
  isOpen,
  onClose,
  onSubmitJob,
}) => {
  const [mode, setMode] = useState<'form' | 'paste'>('form');

  // Form fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('Indeed Japan');
  const [description, setDescription] = useState('');

  // Raw text paste
  const [rawText, setRawText] = useState('');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      alert('請至少填寫職缺名稱與企業名稱！');
      return;
    }

    onSubmitJob({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      salary: salary.trim(),
      postedDate: postedDate.trim() || new Date().toISOString().split('T')[0],
      applyUrl: applyUrl.trim(),
      sourcePlatform,
      description: description.trim(),
    });
    onClose();
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      alert('請貼上職缺文字內容！');
      return;
    }

    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedTitle = lines[0] || '貼上職缺檢測';
    const parsedCompany = lines[1] || '未指定企業名';

    onSubmitJob({
      title: parsedTitle,
      company: parsedCompany,
      description: rawText,
      sourcePlatform: '文字直接貼上',
      postedDate: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🔍</span>
              <span>單筆日本職缺即時診斷</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              手動輸入或直接貼上日本求職網站 (Indeed / LinkedIn / Green 等) 職缺進行幽靈指數診斷
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 text-xs font-bold">
          <button
            onClick={() => setMode('form')}
            className={`py-3 px-4 border-b-2 transition ${
              mode === 'form'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            標準欄位填寫
          </button>
          <button
            onClick={() => setMode('paste')}
            className={`py-3 px-4 border-b-2 transition ${
              mode === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            直接貼上職缺全文 (快速)
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {mode === 'form' ? (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    職缺標題 / 職種 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 【急募】Webエンジニア（未経験可）"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    企業名稱 (公司名) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 株式会社〇〇"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    勤務地 (工作地點)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 東京都港区 / 常駐先"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    給與 / 年薪 (含殘業說明)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 月給35万 (固定残業40H含)"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    求職平台來源
                  </label>
                  <select
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Indeed Japan">Indeed Japan</option>
                    <option value="LinkedIn Japan">LinkedIn Japan</option>
                    <option value="Green">Green (IT・Web)</option>
                    <option value="Wantedly">Wantedly</option>
                    <option value="doda">doda</option>
                    <option value="リクナビNEXT">リクナビNEXT</option>
                    <option value="ビズリーチ">ビズリーチ (BizReach)</option>
                    <option value="ハローワーク">ハローワーク (Hello Work)</option>
                    <option value="企業官網直投">企業官方網站 (Direct)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    應徵網址 (Apply URL / ATS Link)
                  </label>
                  <input
                    type="url"
                    placeholder="例如: https://herp.careers/v1/..."
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    刊登日期 (Posted Date)
                  </label>
                  <input
                    type="date"
                    value={postedDate}
                    onChange={(e) => setPostedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  職務內容與特徵描述 (Job Description)
                </label>
                <textarea
                  rows={5}
                  placeholder="貼上職缺詳細描述（例如業務內容、応募要件、労働条件、是否包含アットホーム、夢、客先常駐等語句）..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm transition"
                >
                  開始偵測分析 🚀
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  請將在日本網站複製的職缺內文直接貼在下方：
                </label>
                <textarea
                  rows={10}
                  required
                  placeholder={`【職種】自社内開発Webエンジニア
【会社名】株式会社〇〇
【給与】月給35万円（固定残業手当40時間分含む）
【勤務地】東京都新宿区（プロジェクト先）
【業務内容】客先常駐にてWebシステム開発を担当。未経験歓迎、アットホームな職場です！面接1回即決。`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                系統將自動提取第 1 行為標題、第 2 行為公司名，並對全文進行固定加班代、客先常駐與黑心精神論掃描。
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm transition"
                >
                  立即解析此職缺 🚀
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
