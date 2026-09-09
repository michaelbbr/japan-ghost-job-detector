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
import { parseJapaneseJobText } from '@/lib/jobTextParser';

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
    sourcePlatform: ['platform', 'source', '媒体', '掲載媒體', '求人媒體', 'サイト'],
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

  // 使用者自訂職缺與範例職缺管理
  const [userJobs, setUserJobs] = useState<JobInput[]>([]);
  const [isDemoExpanded, setIsDemoExpanded] = useState<boolean>(false);
  const [spotlightJob, setSpotlightJob] = useState<GhostAnalysisResult | null>(null);

  // 分析結果與統計
  const [results, setResults] = useState<GhostAnalysisResult[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hero Dual Mode & Input State
  const [heroTab, setHeroTab] = useState<'paste' | 'url'>('paste');
  const [heroPasteText, setHeroPasteText] = useState<string>('');
  const [isHeroPasteAnalyzing, setIsHeroPasteAnalyzing] = useState<boolean>(false);
  const [antiBotNotice, setAntiBotNotice] = useState<string | null>(null);
  const heroPasteTextareaRef = useRef<HTMLTextAreaElement>(null);

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
  const spotlightRef = useRef<HTMLDivElement>(null);

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

  // 當前清單職缺（若使用者有輸入則顯示使用者職缺；若展開範例則合併或顯示範例）
  const activeJobs = useMemo<JobInput[]>(() => {
    if (userJobs.length > 0) {
      return isDemoExpanded ? [...userJobs, ...SAMPLE_JAPANESE_JOBS] : userJobs;
    }
    return isDemoExpanded ? SAMPLE_JAPANESE_JOBS : [];
  }, [userJobs, isDemoExpanded]);

  // 分析職缺清單
  // 分析職缺清單
  useEffect(() => {
    if (activeJobs.length === 0) {
      setResults([]);
      setSummary(null);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const dupeMap = detectBatchDuplicatesAndReposts(activeJobs);
      const analyzed = activeJobs.map((job, idx) => analyzeSingleJob(job, dupeMap[idx], lang));
      const sum = buildBatchSummary(analyzed);

      setResults(analyzed);
      setSummary(sum);

      // 同步以當前語言重新渲染 Spotlight 職缺
      setSpotlightJob((prev) => {
        if (!prev) return null;
        const matchingJob = activeJobs.find(
          (j) => (j.id && j.id === prev.id) || (j.title === prev.title && j.company === prev.company)
        );
        if (matchingJob) {
          const matchingIdx = activeJobs.indexOf(matchingJob);
          return analyzeSingleJob(matchingJob, dupeMap[matchingIdx], lang);
        }
        return analyzeSingleJob(prev, undefined, lang);
      });

      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [activeJobs, lang]);

  // 檔案上傳處理 (CSV)
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
        setUserJobs((prev) => [...parsed, ...prev]);
        const firstAnalyzed = analyzeSingleJob(parsed[0], undefined, lang);
        setSpotlightJob(firstAnalyzed);
        setIsDemoExpanded(false);
        setTimeout(() => spotlightRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // 新增單筆職缺（手動填寫或智慧貼上）
  const handleAddSingleJob = (newJob: JobInput) => {
    const analyzed = analyzeSingleJob(newJob, undefined, lang);
    setUserJobs((prev) => [newJob, ...prev]);
    setSpotlightJob(analyzed);
    setIsDemoExpanded(false);
    setTimeout(() => {
      spotlightRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Hero 職缺文字即時解析
  const handleHeroPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroPasteText.trim()) return;

    setIsHeroPasteAnalyzing(true);
    setUrlError(null);
    setAntiBotNotice(null);

    try {
      const parsedJob = parseJapaneseJobText(heroPasteText);
      const analyzed = analyzeSingleJob(parsedJob, undefined, lang);
      setUserJobs((prev) => [parsedJob, ...prev]);
      setSpotlightJob(analyzed);
      setIsDemoExpanded(false);
      setUrlSuccess(
        lang === 'ja'
          ? `「${parsedJob.title}（${parsedJob.company}）」の解析に成功しました！（ゴースト指数: ${analyzed.ghostScore}点）`
          : `成功分析「${parsedJob.title}（${parsedJob.company}）」！（幽靈風險評分: ${analyzed.ghostScore}分）`
      );
      setTimeout(() => {
        spotlightRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      setUrlError(
        err.message || (lang === 'ja' ? '解析処理中にエラーが発生しました。' : '分析時發生未知錯誤。')
      );
    } finally {
      setIsHeroPasteAnalyzing(false);
    }
  };

  const handleFillSampleText = () => {
    const sample = `スイーツ・洋菓子店での接客・販売スタッフ/週3日〜/1日4h〜/扶養内OK
株式会社プレジィール
東京都中央区銀座
時給 1,300円〜1,500円
【仕事内容】
店頭でのスイーツ・焼き菓子の接客販売、包装、レジ業務などをお任せします。
未経験歓迎！先輩スタッフが丁寧にフォローします。
アットホームな職場で働きませんか？固定残業なし、交通費全額支給。`;
    setHeroPasteText(sample);
    if (urlError) setUrlError(null);
    if (antiBotNotice) setAntiBotNotice(null);
  };

  // URL 一鍵抓取與分析
  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUrlAnalyzing(true);
    setUrlError(null);
    setUrlSuccess(null);
    setAntiBotNotice(null);

    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), lang }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.isAntiBotBlocked) {
          setAntiBotNotice(
            lang === 'ja'
              ? json.suggestion || 'Indeed/LinkedIn等はCloudflare防護のためサーバー取得できません。下のボタンからテキストを貼り付けてください。'
              : json.suggestion || '目標網站設有 Cloudflare 反爬蟲保護。請點擊下方按鈕直接貼上文字解析！'
          );
          setUrlError(
            lang === 'ja'
              ? `${json.platform || '対象サイト'}は防スクレイピング制限が有効です。`
              : `${json.platform || '目標平台'}設有反爬蟲安全保護，伺服器無法直接抓取。`
          );
          return;
        }
        throw new Error(
          json.error ||
            (lang === 'ja'
              ? 'URLの取得または解析に失敗しました。URLが正しいかご確認ください。'
              : '網址抓取或解析失敗，請確認該網址能公開訪問或格式正確。')
        );
      }

      const fetchedJob: JobInput = json.data?.job || json.job || json.result;
      const analyzedJob: GhostAnalysisResult = json.data?.analysis || json.analysis || json.result;

      if (!fetchedJob) {
        throw new Error(lang === 'ja' ? '求人データの抽出に失敗しました。' : '未能解析出職缺資訊。');
      }

      setUserJobs((prev) => [fetchedJob, ...prev]);
      setSpotlightJob(analyzedJob);
      setIsDemoExpanded(false);

      setUrlSuccess(
        lang === 'ja'
          ? `「${fetchedJob.title}（${fetchedJob.company}）」の自動取得・解析に成功しました！（ゴースト指数: ${analyzedJob.ghostScore}点）`
          : `成功抓取並分析「${fetchedJob.title}（${fetchedJob.company}）」！（幽靈風險評分: ${analyzedJob.ghostScore}分）`
      );
      setUrlInput('');

      setTimeout(() => {
        spotlightRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
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

            {/* Hero Dual Mode Switcher */}
            <div className="mt-6 flex border-b border-white/20 text-xs font-bold gap-2">
              <button
                type="button"
                onClick={() => {
                  setHeroTab('paste');
                  setUrlError(null);
                  setUrlSuccess(null);
                  setAntiBotNotice(null);
                }}
                className={`py-2 px-3 sm:px-4 rounded-t-xl transition flex items-center gap-1.5 ${
                  heroTab === 'paste'
                    ? 'bg-white/20 text-white border-t border-x border-white/30 backdrop-blur-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📝</span>
                <span>{t.heroTabPaste}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeroTab('url');
                  setUrlError(null);
                  setUrlSuccess(null);
                  setAntiBotNotice(null);
                }}
                className={`py-2 px-3 sm:px-4 rounded-t-xl transition flex items-center gap-1.5 ${
                  heroTab === 'url'
                    ? 'bg-white/20 text-white border-t border-x border-white/30 backdrop-blur-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔗</span>
                <span>{t.heroTabUrl}</span>
              </button>
            </div>

            {/* Tab 1: Direct Job Text Paste (100% reliable for Indeed / LinkedIn / etc.) */}
            {heroTab === 'paste' && (
              <div className="p-3 sm:p-4 rounded-b-2xl rounded-tr-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner animate-fadeIn">
                <form onSubmit={handleHeroPasteSubmit}>
                  <textarea
                    ref={heroPasteTextareaRef}
                    rows={5}
                    required
                    value={heroPasteText}
                    onChange={(e) => {
                      setHeroPasteText(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    placeholder={t.pasteInputPlaceholder}
                    className="w-full p-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 border border-transparent shadow-sm font-mono leading-relaxed"
                  />
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleFillSampleText}
                      className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-indigo-200 text-xs font-semibold border border-white/10 transition flex items-center gap-1"
                    >
                      <span>{t.pasteSampleFillBtn}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isHeroPasteAnalyzing || !heroPasteText.trim()}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {isHeroPasteAnalyzing ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>{t.urlAnalyzing}</span>
                        </>
                      ) : (
                        <span>{t.pasteAnalyzeBtn}</span>
                      )}
                    </button>
                  </div>
                </form>
                {urlError && (
                  <div className="mt-2.5 text-xs text-rose-300 flex items-center gap-1.5 px-1">
                    <span>⚠️</span>
                    <span>{urlError}</span>
                  </div>
                )}
                {urlSuccess && (
                  <div className="mt-2.5 text-xs text-emerald-300 flex items-center gap-1.5 px-1">
                    <span>✅</span>
                    <span>{urlSuccess}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: URL Instant Evaluation */}
            {heroTab === 'url' && (
              <div className="p-3 sm:p-4 rounded-b-2xl rounded-tr-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner animate-fadeIn">
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
                        if (antiBotNotice) setAntiBotNotice(null);
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

                {antiBotNotice && (
                  <div className="mt-3 p-3.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 animate-fadeIn">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <span>⚠️</span>
                      <span>{t.antiBotWarningTitle}</span>
                    </div>
                    <p className="mt-1 text-slate-200 leading-relaxed">{antiBotNotice}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroTab('paste');
                        setTimeout(() => heroPasteTextareaRef.current?.focus(), 100);
                      }}
                      className="mt-2.5 px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                      <span>📝</span>
                      <span>{t.switchToPasteBtn}</span>
                    </button>
                  </div>
                )}

                {urlError && !antiBotNotice && (
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
            )}

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

        {/* 🎯 SPOTLIGHT CARD: 即時診斷重點結果 (直覺置頂於最上方) */}
        {spotlightJob && (
          <div ref={spotlightRef} className="mb-10 scroll-mt-20 animate-fadeIn">
            <div className="rounded-3xl border-2 border-indigo-500/50 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden ring-4 ring-indigo-500/10">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                      <span>{t.spotlightTitle}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.spotlightSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSpotlightJob(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold transition"
                >
                  ✕ {t.spotlightClose}
                </button>
              </div>

              {/* Body: Left details + Right score */}
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 columns: job info & signals */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                      {spotlightJob.sourcePlatform || '日本職缺'}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                      {spotlightJob.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                      <span className="font-bold text-slate-900 text-sm">🏢 {spotlightJob.company}</span>
                      {spotlightJob.location && <span>📍 {spotlightJob.location}</span>}
                      {spotlightJob.salary && (
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          💴 {spotlightJob.salary}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🚨 偵測到的具體黑心／誘餌特徵明細 (Exact Detected Scam/Risk Items) */}
                  {spotlightJob.scamHits && spotlightJob.scamHits.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border-2 border-rose-200/90 text-xs animate-fadeIn shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-rose-200/80 mb-3">
                        <div className="font-black text-rose-950 text-sm flex items-center gap-2">
                          <span className="text-base">🚨</span>
                          <span>
                            {lang === 'ja'
                              ? `検出された具体的なリスク特徴・危険話術（計 ${spotlightJob.scamHits.length} 項目）`
                              : `偵測到的具體黑心／誘餌特徵明細（共 ${spotlightJob.scamHits.length} 項）`}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-200/60 px-2.5 py-0.5 rounded-full">
                          {lang === 'ja' ? '求人文との照合結果' : '職缺原文精確命中'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {spotlightJob.scamHits.map((hit, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white border border-rose-200/70 shadow-xs space-y-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  hit.severity === 'CRITICAL'
                                    ? 'bg-red-600 text-white'
                                    : hit.severity === 'HIGH'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-amber-500 text-slate-950'
                                }`}
                              >
                                {hit.severity}
                              </span>
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-100/80 text-rose-800">
                                {hit.categoryLabel}
                              </span>
                              <span className="font-black text-slate-900 text-xs sm:text-sm">
                                {hit.title}
                              </span>
                            </div>

                            {hit.matchedText && (
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-rose-900 bg-rose-50/80 px-3 py-1.5 rounded-lg border border-rose-200/80">
                                <span className="font-bold shrink-0">🎯 {lang === 'ja' ? '該当箇所（原文）：' : '命中職缺原文：'}</span>
                                <code className="font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 break-all">
                                  「{hit.matchedText}」
                                </code>
                              </div>
                            )}

                            <p className="text-slate-700 leading-relaxed text-[11px]">
                              {hit.explanation}
                            </p>

                            {hit.legalRisk && (
                              <div className="text-[11px] font-medium text-amber-900 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200/80 flex items-start gap-1.5">
                                <span className="mt-0.5 shrink-0">⚠️</span>
                                <span className="leading-relaxed">{hit.legalRisk}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4 Signals Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {spotlightJob.signals.map((sig) => (
                      <div
                        key={sig.id}
                        className={`p-3.5 rounded-2xl border ${
                          sig.triggered
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>{sig.name}</span>
                          <span className={sig.triggered ? 'text-amber-800 font-black' : 'text-emerald-800'}>
                            {sig.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{sig.explanation}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actionable Recommendations Checklist (展開式直覺呈現) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs">
                    <div className="font-black text-indigo-950 mb-2.5 flex items-center gap-2 text-sm">
                      <span>🛡️</span>
                      <span>{t.spotlightChecklist}</span>
                    </div>
                    <ul className="space-y-2">
                      {spotlightJob.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-indigo-950 font-medium">
                          <span className="text-indigo-600 mt-0.5 font-bold text-sm">☑</span>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right column: Score summary & direct research buttons */}
                <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col justify-between shadow-md">
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      {t.ghostScoreLabel}
                    </div>
                    <div className="text-5xl font-black mt-1">
                      {spotlightJob.ghostScore}{' '}
                      <span className="text-sm font-normal text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                          spotlightJob.ghostScore >= 70
                            ? 'bg-red-500 text-white'
                            : spotlightJob.ghostScore >= 45
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {spotlightJob.verdictText || spotlightJob.verdict}
                      </span>
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700"
                        title={spotlightJob.confidenceNote}
                      >
                        {t.confidenceLabel}: {spotlightJob.confidenceText || spotlightJob.confidence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {spotlightJob.verdictLabel}
                    </p>
                  </div>

                  {/* Direct Action Links */}
                  <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400">
                      {lang === 'ja' ? '💡 応募前セーフティ確認リンク：' : '💡 投遞前必查官方與口碑來源：'}
                    </div>
                    {spotlightJob.openWorkUrl ? (
                      <a
                        href={spotlightJob.openWorkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                      >
                        <span>🏢</span>
                        <span>
                          {lang === 'ja'
                            ? `OpenWorkで「${spotlightJob.company}」の口コミ・残業を見る`
                            : `在 OpenWork 查詢「${spotlightJob.company}」真實評價`}
                        </span>
                      </a>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300/90 leading-relaxed">
                        ℹ️ {lang === 'ja'
                          ? '法人名が特定できなかったため、OpenWork検索リンクは生成されませんでした。'
                          : '未能識別出具體日本法人名稱，故未生成 OpenWork 搜尋連結。'}
                      </div>
                    )}
                    {spotlightJob.googleReviewUrl && (
                      <a
                        href={spotlightJob.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700"
                      >
                        <span>🔍</span>
                        <span>
                          {lang === 'ja'
                            ? `Googleで「${spotlightJob.company}」の退職理由・評判検索`
                            : `在 Google 搜尋「${spotlightJob.company}」評價口碑`}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📚 開闔式範例庫切換列 (Collapsible Demo Section) */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>📚</span>
              <span>{isDemoExpanded ? t.demoToggleCollapse : t.demoToggleExpand}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.demoDescription}
            </p>
          </div>
          <button
            onClick={() => setIsDemoExpanded(!isDemoExpanded)}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition whitespace-nowrap border border-indigo-200"
          >
            {isDemoExpanded
              ? lang === 'ja'
                ? 'サンプルを閉じる ▴'
                : '收合範例 ▴'
              : lang === 'ja'
              ? 'サンプルを開く ▾'
              : '展開範例 ▾'}
          </button>
        </div>

        {/* Summary Statistics (有職缺時才顯示統計數據) */}
        {summary && activeJobs.length > 0 && (
          <SummaryStats
            summary={summary}
            onFilterClick={(cat) => setFilter(cat as FilterCategory)}
            lang={lang}
          />
        )}

        {/* Filter and Search Bar (有職缺時顯示篩選器) */}
        {activeJobs.length > 0 && (
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
        )}

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
        ) : activeJobs.length === 0 ? (
          /* Empty State when no jobs loaded */
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center text-slate-500 shadow-sm max-w-2xl mx-auto">
            <span className="text-5xl block mb-3">🗾</span>
            <h3 className="font-bold text-slate-800 text-lg">
              {lang === 'ja' ? '求人を貼り付けて即時診断を開始' : '貼上日本職缺網址或文字開始診斷'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {lang === 'ja'
                ? '上部のURL入力欄に求人URLを貼り付けるか、「求人テキスト直接診断」から求人票を貼り付けてください。日本の労働基準法と最新の求人実態に即して瞬時にゴースト度を判定します。'
                : '請在上方輸入框貼入 Indeed / LinkedIn / Green / doda / 企業招募網址，或點擊「貼上職缺文字」直接貼上求人票。系統將依據日本勞基法與招募市場實態瞬時給出客觀評估。'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsSingleJobModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition shadow-sm"
              >
                {t.pasteTextBtn}
              </button>
              <button
                onClick={() => setIsDemoExpanded(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
              >
                {t.demoToggleExpand}
              </button>
            </div>
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
