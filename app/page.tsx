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
import { Language, I18N } from '@/lib/i18n';

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
  const [lang, setLang] = useState<Language>('zh');
  const [jobs, setJobs] = useState<JobInput[]>([]);
  const [results, setResults] = useState<GhostAnalysisResult[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // URL Instant Evaluation State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isUrlAnalyzing, setIsUrlAnalyzing] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlSuccess, setUrlSuccess] = useState<string | null>(null);

  // Filter & Search states
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [sort, setSort] = useState<SortOption>('SCORE_DESC');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSingleJobModalOpen, setIsSingleJobModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 讀取語言偏好
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('ghost_radar_lang') as Language | null;
      if (savedLang === 'zh' || savedLang === 'ja') {
        setLang(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'zh' ? 'ja' : 'zh';
    setLang(nextLang);
    try {
      localStorage.setItem('ghost_radar_lang', nextLang);
    } catch {
      // ignore
    }
  };

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
          alert(
            lang === 'ja'
              ? 'CSVファイルから有効な求人データを取得できませんでした。「職種 / 企業名」または「title / company」が含まれているかご確認ください。'
              : '未能從 CSV 檔案中識別出有效職缺。請確認包含「職種 / 企業名」或「title / company」等欄位標題！'
          );
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

  // URL 一鍵抓取與分析
  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUrlAnalyzing(true);
    setUrlError(null);
    setUrlSuccess(null);

    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            (lang === 'ja'
              ? 'URLの取得または解析に失敗しました。URLが正しいかご確認ください。'
              : '網址抓取或解析失敗，請確認該網址能公開訪問或格式正確。')
        );
      }

      const fetchedJob: JobInput = json.data.job;
      const updated = [fetchedJob, ...jobs];
      processJobs(updated);

      setUrlSuccess(
        lang === 'ja'
          ? `「${fetchedJob.title}（${fetchedJob.company}）」の自動取得・解析に成功しました！（ゴースト指数: ${json.data.analysis.ghostScore}点）`
          : `成功抓取並分析「${fetchedJob.title}（${fetchedJob.company}）」！（幽靈風險評分: ${json.data.analysis.ghostScore}分）`
      );
      setUrlInput('');
    } catch (err: any) {
      setUrlError(
        err.message ||
          (lang === 'ja' ? '解析処理中にエラーが発生しました。' : '分析時發生未知錯誤。')
      );
    } finally {
      setIsUrlAnalyzing(false);
    }
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

  const t = I18N[lang];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      {/* Top Banner / Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👻</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                  <span>{t.appTitle}</span>
                  <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                    {t.versionBadge}
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/40 transition flex items-center gap-1.5 shadow-sm"
              title={lang === 'zh' ? '切換為日本語' : '繁體中文に切り替える'}
            >
              <span>🌐</span>
              <span>{lang === 'zh' ? '日本語' : '繁體中文'}</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🗾</span>
              <span className="hidden sm:inline">{t.guideBtn}</span>
            </button>

            <button
              onClick={() => setIsSingleJobModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>➕</span>
              <span className="hidden sm:inline">{t.singleBtn}</span>
            </button>

            <button
              onClick={() => processJobs(SAMPLE_JAPANESE_JOBS)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition hidden md:flex items-center gap-1"
              title="載入 10 筆真實情境日本測試職缺"
            >
              <span>🔄</span>
              <span>{t.demoBtn}</span>
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
              <span>{t.heroTag}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {t.heroTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
              {t.heroDesc}
            </p>

            {/* URL Instant Evaluation Bar */}
            <div className="mt-6 p-2 sm:p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <form onSubmit={handleAnalyzeUrl} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔗</span>
                  <input
                    type="url"
                    required
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    placeholder={t.urlInputPlaceholder}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 border border-transparent shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUrlAnalyzing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isUrlAnalyzing ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{t.urlAnalyzing}</span>
                    </>
                  ) : (
                    <span>{t.urlAnalyzeBtn}</span>
                  )}
                </button>
              </form>
              {urlError && (
                <div className="mt-2 text-xs text-rose-300 flex items-center gap-1.5 px-2">
                  <span>⚠️</span>
                  <span>{urlError}</span>
                </div>
              )}
              {urlSuccess && (
                <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1.5 px-2">
                  <span>✅</span>
                  <span>{urlSuccess}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition shadow-sm flex items-center gap-2"
              >
                <span>📂</span>
                <span>{t.uploadCsvBtn}</span>
              </button>

              <button
                onClick={() => setIsSingleJobModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
              >
                <span>📝</span>
                <span>{t.pasteTextBtn}</span>
              </button>

              <a
                href="/sample_japan_jobs.csv"
                download="sample_japan_jobs.csv"
                className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
              >
                <span>💾</span>
                <span>{t.downloadSampleBtn}</span>
              </a>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold border border-indigo-800/80 transition flex items-center gap-2 ml-auto"
              >
                <span>📖</span>
                <span>{t.viewGuideBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <SummaryStats
          summary={summary}
          onFilterClick={(cat) => setFilter(cat as FilterCategory)}
          lang={lang}
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
          lang={lang}
        />

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-3 font-semibold">
              {lang === 'ja'
                ? 'ATS認証、固定残業代、精神論ワードベースを照合中...'
                : '正在交叉核對日本 ATS、みなし残業與黑心特徵庫...'}
            </p>
          </div>
        ) : filteredAndSortedResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="font-bold text-slate-700 text-base">
              {lang === 'ja' ? '条件に一致する求人が見つかりませんでした' : '未找到符合條件的職缺'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ja'
                ? 'フィルター条件を変更するか、検索キーワードをクリアしてください。'
                : '請嘗試切換其他篩選標籤，或清除搜尋關鍵字。'}
            </p>
            <button
              onClick={() => {
                setFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              {lang === 'ja' ? 'フィルターをリセット' : '重設篩選條件'}
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="space-y-4">
            {filteredAndSortedResults.map((job) => (
              <JobCard key={job.id} job={job} lang={lang} />
            ))}
          </div>
        )}

        {/* Educational Panel: Why Japanese companies post ghost jobs */}
        <div className="mt-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📚</span>
            <h3 className="text-lg font-black text-slate-900">
              {t.eduTitle}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            {t.eduSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🎯</span>
                <span>{t.eduCard1Title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{t.eduCard1Desc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🎣</span>
                <span>{t.eduCard2Title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{t.eduCard2Desc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>💰</span>
                <span>{t.eduCard3Title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{t.eduCard3Desc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>📈</span>
                <span>{t.eduCard4Title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{t.eduCard4Desc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>{t.eduCard5Title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{t.eduCard5Desc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <span>🔄</span>
                <span>{t.eduCard6Title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{t.eduCard6Desc}</p>
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
              {t.footerDisclaimer}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              {t.guideBtn}
            </button>
            <a
              href="https://www.openwork.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              OpenWork
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
      <JobGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} lang={lang} />
      <SingleJobModal
        isOpen={isSingleJobModalOpen}
        onClose={() => setIsSingleJobModalOpen(false)}
        onSubmitJob={handleAddSingleJob}
        lang={lang}
      />
    </div>
  );
}
