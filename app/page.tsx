'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  JobInput,
  GhostAnalysisResult,
  analyzeSingleJob,
  detectBatchDuplicatesAndReposts,
  buildBatchSummary,
  BatchSummary,
} from '@/lib/ghostScoreEngine';
import { SAMPLE_JAPANESE_JOBS } from '@/lib/sampleJapaneseJobs';
import { SummaryStats } from '@/app/components/SummaryStats';
import { FilterBar, FilterCategory, SortOption } from '@/app/components/FilterBar';
import { JobCard } from '@/app/components/JobCard';
import { JobGuideModal } from '@/app/components/JobGuideModal';
import { SingleJobModal } from '@/app/components/SingleJobModal';

// 日文 CSV 標題自動映射解析器
function parseJapaneseCsv(text: string): JobInput[] {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // 解析第一行 header
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  const ALIASES: Record<keyof JobInput, string[]> = {
    title: ['title', 'job title', '職種', '求人タイトル', '求人名', '職種名', '募集職種', 'position'],
    company: ['company', 'company name', '企業名', '会社名', '企業', '会社', '雇用元', 'employer'],
    location: ['location', '勤務地', '場所', '所在地', '就業場所', 'city'],
    salary: ['salary', '給与', '年収', '月給', '賃金', '給料', 'pay', 'compensation'],
    postedDate: ['posted_date', 'posted date', 'date', '掲載日', '更新日', '日付', 'date posted'],
    applyUrl: ['apply_link', 'apply url', 'link', 'url', '求人url', '応募url', 'リンク', 'apply link'],
    sourcePlatform: ['platform', 'source', '媒体', '掲載媒体', '求人媒体', 'サイト'],
    description: ['description', '詳細', '業務内容', '仕事内容', '募集要項', '求人詳細', '概要'],
    id: ['id', 'job_id', '求人id', '管理番号'],
  };

  const headerIndexMap: Partial<Record<keyof JobInput, number>> = {};
  for (const [key, aliases] of Object.entries(ALIASES) as [keyof JobInput, string[]][]) {
    for (let i = 0; i < headers.length; i++) {
      if (aliases.some((alias) => headers[i].includes(alias))) {
        headerIndexMap[key] = i;
        break;
      }
    }
  }

  // 處理資料行
  const parsedJobs: JobInput[] = [];

  for (let r = 1; r < lines.length; r++) {
    // 簡易處理含逗號之 CSV 列
    const row = lines[r];
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cells.push(currentCell.trim().replace(/^"|"$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, ''));

    const getVal = (key: keyof JobInput): string => {
      const idx = headerIndexMap[key];
      return idx !== undefined && cells[idx] ? cells[idx].trim() : '';
    };

    const title = getVal('title');
    const company = getVal('company');

    if (title && company) {
      parsedJobs.push({
        id: getVal('id') || `csv_job_${r}`,
        title,
        company,
        location: getVal('location'),
        salary: getVal('salary'),
        postedDate: getVal('postedDate'),
        applyUrl: getVal('applyUrl'),
        sourcePlatform: getVal('sourcePlatform') || 'CSV 批次匯入',
        description: getVal('description'),
      });
    }
  }

  return parsedJobs;
}

export default function HomePage() {
  const [jobs, setJobs] = useState<JobInput[]>([]);
  const [results, setResults] = useState<GhostAnalysisResult[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter & Search states
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [sort, setSort] = useState<SortOption>('SCORE_DESC');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSingleJobModalOpen, setIsSingleJobModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分析批次職缺
  const processJobs = (inputJobs: JobInput[]) => {
    setIsLoading(true);
    setTimeout(() => {
      const dupeMap = detectBatchDuplicatesAndReposts(inputJobs);
      const analyzed = inputJobs.map((job, idx) => analyzeSingleJob(job, dupeMap[idx]));
      const sum = buildBatchSummary(analyzed);

      setJobs(inputJobs);
      setResults(analyzed);
      setSummary(sum);
      setIsLoading(false);
    }, 150);
  };

  // 預設載入 Demo 資料
  useEffect(() => {
    processJobs(SAMPLE_JAPANESE_JOBS);
  }, []);

  // 檔案上傳處理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseJapaneseCsv(content);
        if (parsed.length === 0) {
          alert('未能從 CSV 檔案中識別出有效職缺。請確認包含「職種 / 企業名」或「title / company」等欄位標題！');
          return;
        }
        processJobs(parsed);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // 新增單筆職缺
  const handleAddSingleJob = (newJob: JobInput) => {
    const updated = [newJob, ...jobs];
    processJobs(updated);
  };

  // 篩選與排序後的職缺列表
  const filteredAndSortedResults = useMemo(() => {
    return results
      .filter((item) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCompany = item.company.toLowerCase().includes(q);
          const matchLocation = (item.location || '').toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          const matchPlatform = (item.sourcePlatform || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCompany && !matchLocation && !matchDesc && !matchPlatform) {
            return false;
          }
        }

        // 2. Category Filter
        switch (filter) {
          case 'HIGH_RISK':
            return item.ghostScore >= 70;
          case 'SUSPICIOUS':
            return item.ghostScore >= 45 && item.ghostScore < 70;
          case 'SAFE':
            return item.ghostScore < 45;
          case 'MINASHI':
            return item.scamHits.some((h) => h.category === 'minashi_zangyo');
          case 'SCAM_BLACK':
            return item.scamHits.some(
              (h) => h.category === 'black_company' || h.category === 'ses_decoy' || h.category === 'yami_baito'
            );
          case 'DUPLICATES':
            return item.duplicateInfo?.isDuplicate || item.duplicateInfo?.isRepost;
          case 'ALL':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        switch (sort) {
          case 'SCORE_DESC':
            return b.ghostScore - a.ghostScore;
          case 'SCORE_ASC':
            return a.ghostScore - b.ghostScore;
          case 'DATE_DESC':
            return (b.postedDate || '').localeCompare(a.postedDate || '');
          case 'DATE_ASC':
            return (a.postedDate || '').localeCompare(b.postedDate || '');
          default:
            return 0;
        }
      });
  }, [results, filter, sort, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Banner / Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👻</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                  <span>Ghost Job Radar</span>
                  <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                    日本版 v2.0
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                日本求職防坑雷達・專治 Indeed/LinkedIn/Green/Hello Work 幽靈與釣魚職缺
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🗾</span>
              <span>日本求職指南</span>
            </button>

            <button
              onClick={() => setIsSingleJobModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>單筆診斷</span>
            </button>

            <button
              onClick={() => processJobs(SAMPLE_JAPANESE_JOBS)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition hidden md:flex items-center gap-1"
              title="載入 10 筆真實情境日本測試職缺"
            >
              <span>🔄</span>
              <span>重新載入 Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-3">
              <span>🛡️ 日本專用求職避雷演算法</span>
              <span>•</span>
              <span>參考 Farhan89082 與 fansia 核心架構</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              在投出履歷前，看清日本求職網上的「幽靈與誘餌職缺」
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
              全面支援 <strong>Indeed Japan、LinkedIn、Green、Wantedly、doda、Hello Work</strong>。
              深度檢驗<strong>日本企業正規 ATS 採用系統</strong>、自動破解<strong>みなし残業（固定殘業）數字障眼法</strong>、
              識別<strong>SES 客先常駐偽裝</strong>與<strong>アットホーム黑心精神論</strong>。
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition shadow-sm flex items-center gap-2"
              >
                <span>📂</span>
                <span>上傳日文 CSV 批次檢測</span>
              </button>

              <button
                onClick={() => setIsSingleJobModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
              >
                <span>📝</span>
                <span>貼上職缺文字即時診斷</span>
              </button>

              <a
                href="/sample_japan_jobs.csv"
                download="sample_japan_jobs.csv"
                className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
              >
                <span>💾</span>
                <span>下載範例 CSV</span>
              </a>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold border border-indigo-800/80 transition flex items-center gap-2 ml-auto"
              >
                <span>📖</span>
                <span>看日本都啥求職 (完整導覽)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <SummaryStats
          summary={summary}
          onFilterClick={(cat) => setFilter(cat as FilterCategory)}
        />

        {/* Filter and Search Bar */}
        <FilterBar
          currentFilter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentSort={sort}
          onSortChange={setSort}
          totalFilteredCount={filteredAndSortedResults.length}
        />

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-3 font-semibold">
              正在交叉核對日本 ATS、みなし残業與黑心特徵庫...
            </p>
          </div>
        ) : filteredAndSortedResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="font-bold text-slate-700 text-base">未找到符合條件的職缺</h3>
            <p className="text-xs text-slate-400 mt-1">
              請嘗試切換其他篩選標籤，或清除搜尋關鍵字。
            </p>
            <button
              onClick={() => {
                setFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              重設篩選條件
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="space-y-4">
            {filteredAndSortedResults.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Educational Panel: Why Japanese companies post ghost jobs */}
        <div className="mt-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📚</span>
            <h3 className="text-lg font-black text-slate-900">
              為什麼日本企業會刊登幽靈與釣魚職缺？ (なぜ企業はカラ求人を出すのか？)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            根據日本厚生勞動省勞動市場調查與各大轉職獵頭實務，幽靈職缺背後通常有以下六大動機：
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🎯</span>
                <span>儲備人才庫 (Talent Pipeline)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                即使當前部門暫無正式 Headcount，大企業仍會長設通年招募（Open Position），將求職者履歷放入儲備庫中。一旦未來有離職或新專案，隨時有人選可撈取，但當前應徵者往往面臨已讀不回。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🎣</span>
                <span>SES 人月仲介釣魚 (おとり求人)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                派遣公司或 SES 在求職網打出「未經驗・月給35萬・自社開發」的好缺。求職者投遞後，仲介便以「該缺剛好額滿」為由，順理成章向求職者推銷客戶端常駐（客先常駐）等高流動率外包缺。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>💰</span>
                <span>申請政府補助金 (助成金維持)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                在公營 Hello Work 尤為普遍。部分中小企業為了申請日本政府的僱用助成金或符合法定進用比例，必須常年在 Hello Work 登記開缺，即使完全沒有用人預算與計畫也絕不下架。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>📈</span>
                <span>向投資人展示成長性 (PR効果)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                新創公司與上市企業常在 LinkedIn 或官方網站掛滿各類高階管理與工程職位，向競爭對手、股東與客戶營造「本公司正處於爆炸性擴張階段」的假象，實質上審核門檻設得極高或根本不安排面試。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>みなし残業隱匿超長工時</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                表面上開出看似體面的月薪，但其中包了 45~60 小時的固定殘業代。黑心企業以此在求職列表脫穎而出，實際上壓低基礎時薪，並透過精神論壓榨年輕員工。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🔄</span>
                <span>求職搜尋引擎洗版演算法</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Indeed、求人ボックス等聚合搜尋引擎的排序偏好「近期有更新動作」的職缺。許多人資與仲介每兩週設定自動點擊刷新日期，營造「全新急募」假象，實為長年陳舊缺。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-slate-800">
              🇯🇵 Japan Ghost Job & Black Kyujin Radar
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              本工具提供的幽靈風險指數為基於公開規則之特徵推估，非 100% 絕對定論。投遞前請務必至 OpenWork 與企業官網綜合驗證。
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              日本求職平台指南
            </button>
            <a
              href="https://www.openwork.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              OpenWork 官網
            </a>
            <a
              href="https://jp.indeed.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Indeed Japan
            </a>
            <a
              href="https://www.linkedin.com/jobs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              LinkedIn Jobs
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <JobGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <SingleJobModal
        isOpen={isSingleJobModalOpen}
        onClose={() => setIsSingleJobModalOpen(false)}
        onSubmitJob={handleAddSingleJob}
      />
    </div>
  );
}
