import { detectAtsFromUrl, AtsDetectionResult } from './japanAtsDetector';
import { scanJapanJobScams, analyzeMinashiZangyo, ScamHit } from './japanScamDictionary';

export interface JobInput {
  id?: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  postedDate?: string;
  applyUrl?: string;
  sourcePlatform?: string;
  description?: string;
}

export interface DuplicateInfo {
  isDuplicate: boolean;
  duplicateCount?: number;
  duplicateIndices?: number[];
  isRepost: boolean;
  repostCount?: number;
  repostInstances?: { index: number; date: string; title: string }[];
}

export interface BatchSummary {
  total: number;
  highRisk: number;
  suspicious: number;
  lowRisk: number;
  likelyReal: number;
  avgScore: number;
  duplicates: number;
  reposts: number;
  scamFlags: number;
  minashiZangyoCount: number;
}

export function buildBatchSummary(results: GhostAnalysisResult[]): BatchSummary {
  const scores = results.map((r) => r.ghostScore);
  const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  return {
    total: results.length,
    highRisk: results.filter((r) => r.ghostScore >= 70).length,
    suspicious: results.filter((r) => r.ghostScore >= 45 && r.ghostScore < 70).length,
    lowRisk: results.filter((r) => r.ghostScore >= 20 && r.ghostScore < 45).length,
    likelyReal: results.filter((r) => r.ghostScore < 20).length,
    avgScore: avg,
    duplicates: results.filter((r) => r.duplicateInfo?.isDuplicate).length,
    reposts: results.filter((r) => r.duplicateInfo?.isRepost).length,
    scamFlags: results.filter((r) => r.scamHits && r.scamHits.length > 0).length,
    minashiZangyoCount: results.filter((r) =>
      r.scamHits?.some((h) => h.category === 'minashi_zangyo')
    ).length,
  };
}

export interface SignalDetail {
  id: string;
  name: string;
  label: string;
  pts: number;
  maxPts: number;
  triggered: boolean;
  explanation: string;
}

export interface GhostAnalysisResult extends JobInput {
  id: string;
  ghostScore: number;
  verdict: 'HIGH RISK' | 'SUSPICIOUS' | 'LOW RISK' | 'LIKELY REAL';
  verdictLabel: string;
  verdictColor: 'red' | 'orange' | 'yellow' | 'green';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceNote: string;
  atsResult: AtsDetectionResult;
  scamHits: ScamHit[];
  signals: SignalDetail[];
  reasons: string[];
  evidence: string[];
  caveats: string[];
  recommendations: string[];
  openWorkUrl: string;
  duplicateInfo?: DuplicateInfo;
  analyzedAt: string;
}

// 模糊比對相似度 (0 - 100)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[\s\-_/\\()（）]/g, '');
  const s2 = str2.toLowerCase().replace(/[\s\-_/\\()（）]/g, '');
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  // 簡單 Levenshtein 距離計算
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

// 批次重複與重貼檢測 (Duplicate & Repost Detection)
export function detectBatchDuplicatesAndReposts(jobs: JobInput[]): Record<number, DuplicateInfo> {
  const result: Record<number, DuplicateInfo> = {};

  jobs.forEach((_, i) => {
    result[i] = { isDuplicate: false, isRepost: false };
  });

  // 1. 完全重複 (Exact normalized match)
  const fpMap = new Map<string, number[]>();
  jobs.forEach((job, i) => {
    const norm = `${job.company || ''}|${job.title || ''}|${job.location || ''}`.toLowerCase().replace(/\s+/g, '');
    if (!fpMap.has(norm)) fpMap.set(norm, []);
    fpMap.get(norm)!.push(i);
  });

  fpMap.forEach((indices) => {
    if (indices.length > 1) {
      indices.forEach((idx) => {
        result[idx].isDuplicate = true;
        result[idx].duplicateCount = indices.length;
        result[idx].duplicateIndices = indices.filter((x) => x !== idx);
      });
    }
  });

  // 2. 歷史重新刊登 (Same company, high title similarity, different date)
  const companyMap = new Map<string, { idx: number; title: string; date: string }[]>();
  jobs.forEach((job, i) => {
    const compKey = (job.company || '').toLowerCase().replace(/[\s株式会社有限会社]/g, '');
    if (compKey) {
      if (!companyMap.has(compKey)) companyMap.set(compKey, []);
      companyMap.get(compKey)!.push({ idx: i, title: job.title || '', date: job.postedDate || '' });
    }
  });

  companyMap.forEach((entries) => {
    if (entries.length > 1) {
      for (let a = 0; a < entries.length; a++) {
        const itemA = entries[a];
        const reposts: { index: number; date: string; title: string }[] = [];
        for (let b = 0; b < entries.length; b++) {
          if (a === b) continue;
          const itemB = entries[b];
          if (calculateSimilarity(itemA.title, itemB.title) >= 80) {
            if (itemA.date && itemB.date && itemA.date !== itemB.date) {
              reposts.push({ index: itemB.idx, date: itemB.date, title: itemB.title });
            }
          }
        }
        if (reposts.length > 0) {
          result[itemA.idx].isRepost = true;
          result[itemA.idx].repostCount = reposts.length;
          result[itemA.idx].repostInstances = reposts;
        }
      }
    }
  });

  return result;
}

// 核心單筆職缺分析器
export function analyzeSingleJob(job: JobInput, dupeInfo?: DuplicateInfo): GhostAnalysisResult {
  const title = (job.title || '').trim();
  const company = (job.company || '').trim();
  const location = (job.location || '').trim();
  const salary = (job.salary || '').trim();
  const postedDate = (job.postedDate || '').trim();
  const applyUrl = (job.applyUrl || '').trim();
  const description = (job.description || '').trim();

  let score = 0;
  const signals: SignalDetail[] = [];
  const reasons: string[] = [];
  const evidence: string[] = [];
  const caveats: string[] = [];
  const recommendations: string[] = [];

  // 1. 檢測 ATS 與官網
  const atsResult = detectAtsFromUrl(applyUrl);
  if (atsResult.isDirectEmployer) {
    signals.push({
      id: 'ats_official',
      name: '採用系統 / 官網驗證',
      label: atsResult.label,
      pts: 0,
      maxPts: 25,
      triggered: false,
      explanation: atsResult.notes,
    });
    evidence.push(`通過官方招募系統檢驗：${atsResult.label}`);
  } else if (applyUrl) {
    score += 15;
    signals.push({
      id: 'ats_official',
      name: '採用系統 / 官網驗證',
      label: atsResult.label,
      pts: 15,
      maxPts: 25,
      triggered: true,
      explanation: `連結指向求職聚合平台或非自建 ATS (${atsResult.label})，無法直接佐證企業當前實際招募狀態。`,
    });
    reasons.push(`應徵連結非企業直營 ATS：${atsResult.label}`);
    caveats.push('許多知名中小型企業或日企習慣使用求職網站代收履歷，非正規 ATS 不代表一定是假職缺。');
  } else {
    score += 25;
    signals.push({
      id: 'ats_official',
      name: '採用系統 / 官網驗證',
      label: '無應徵 / 官網連結',
      pts: 25,
      maxPts: 25,
      triggered: true,
      explanation: '職缺未提供任何官方應徵網址，真實性存疑。',
    });
    reasons.push('未提供可查證之應徵連結或企業官網');
  }

  // 2. 檢測黑心關鍵詞與詐騙模式
  const scamHits = scanJapanJobScams(title, description, salary);
  const minashiAnalysis = analyzeMinashiZangyo(`${title} ${description} ${salary}`);

  let scamPts = 0;
  scamHits.forEach((hit) => {
    if (hit.severity === 'CRITICAL') scamPts += 25;
    else if (hit.severity === 'HIGH') scamPts += 15;
    else if (hit.severity === 'MEDIUM') scamPts += 8;
    else scamPts += 3;
    reasons.push(`【${hit.categoryLabel}】${hit.title}：${hit.matchedText}`);
    evidence.push(`觸發風險特徵：${hit.title} (${hit.matchedText})`);
  });

  scamPts = Math.min(scamPts, 35);
  if (scamPts > 0) {
    score += scamPts;
    signals.push({
      id: 'scam_keywords',
      name: '黑心・誘餌與詐騙話術',
      label: `偵測到 ${scamHits.length} 項風險特徵`,
      pts: scamPts,
      maxPts: 35,
      triggered: true,
      explanation: `命中日本常見求職陷阱特徵（如：みなし残業、客先常駐、家庭式溫馨、闇バイト話術等）。`,
    });
  } else {
    signals.push({
      id: 'scam_keywords',
      name: '黑心・誘餌與詐騙話術',
      label: '未檢出明顯黑心語法',
      pts: 0,
      maxPts: 35,
      triggered: false,
      explanation: '職缺描述措辭規範，未出現典型精神論、客先常駐釣魚或詐騙用語。',
    });
    evidence.push('未檢出常見黑心企業與誘餌語錄');
  }

  // 3. 刊登時間與陳舊度 (Stale Age)
  let daysOld: number | null = null;
  if (postedDate) {
    const parsed = Date.parse(postedDate);
    if (!isNaN(parsed)) {
      daysOld = Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24));
    }
  }

  if (daysOld !== null && daysOld >= 0) {
    evidence.push(`已刊登 ${daysOld} 天`);
    if (daysOld > 120) {
      score += 20;
      signals.push({
        id: 'posting_age',
        name: '刊登天數分析',
        label: `超長期滯留 (${daysOld} 天)`,
        pts: 20,
        maxPts: 20,
        triggered: true,
        explanation: `已刊登超過 120 天。常態正職員工招聘通常在 30~60 天內結案，此缺極可能為人才庫儲備 (Talent Pipeline) 或忘記下架的幽靈缺。`,
      });
      reasons.push(`職缺刊登已超過 ${daysOld} 天，流動停滯`);
      caveats.push('高階職位（如 CTO / 專任役員）或特殊技術崗位招聘期可能長達半年以上，不能僅憑刊登時間判定。');
    } else if (daysOld > 60) {
      score += 10;
      signals.push({
        id: 'posting_age',
        name: '刊登天數分析',
        label: `刊登較久 (${daysOld} 天)`,
        pts: 10,
        maxPts: 20,
        triggered: true,
        explanation: `刊登超過 60 天，高於一般平均結案週期。`,
      });
      reasons.push(`刊登已達 ${daysOld} 天，可能為常態性掛牌`);
    } else {
      signals.push({
        id: 'posting_age',
        name: '刊登天數分析',
        label: `近期更新 (${daysOld} 天內)`,
        pts: 0,
        maxPts: 20,
        triggered: false,
        explanation: `刊登時間在 ${daysOld} 天內，屬於正常招聘有效週期。`,
      });
    }
  } else {
    score += 8;
    signals.push({
      id: 'posting_age',
      name: '刊登天數分析',
      label: '未提供刊登日期',
      pts: 8,
      maxPts: 20,
      triggered: true,
      explanation: '缺少明確刊登或更新日期，無法確認職缺新鮮度。',
    });
    reasons.push('求人票未明確標註刊登日或更新日');
  }

  // 4. 重複與歷史重貼 (Duplicates / Reposts)
  if (dupeInfo?.isDuplicate) {
    const count = dupeInfo.duplicateCount || 2;
    score += 12;
    signals.push({
      id: 'duplicate_check',
      name: '批次重複檢測',
      label: `同批重複出現 ${count} 次`,
      pts: 12,
      maxPts: 15,
      triggered: true,
      explanation: `此職缺在您的清單中重複出現 ${count} 次，常見於不同仲介公司或不同分部代理同一個專案洗版。`,
    });
    reasons.push(`清單中重複出現 ${count} 次`);
  } else if (dupeInfo?.isRepost) {
    const count = dupeInfo.repostCount || 1;
    score += 10;
    signals.push({
      id: 'duplicate_check',
      name: '批次重複檢測',
      label: `歷史定時重貼 ${count} 次`,
      pts: 10,
      maxPts: 15,
      triggered: true,
      explanation: `檢測到同一公司使用不同日期重複刊登同職務，為求職網站刷熱度或高離職率職缺典型特徵。`,
    });
    reasons.push(`同職缺在不同日期被重複重貼 ${count} 次`);
  } else {
    signals.push({
      id: 'duplicate_check',
      name: '批次重複檢測',
      label: '無重複或重貼',
      pts: 0,
      maxPts: 15,
      triggered: false,
      explanation: '未檢測到洗版或重複複製刊登跡象。',
    });
  }

  // 5. 職缺標題模糊度 (Vague Title)
  const vaguePatterns = [
    /オープンポジション/,
    /総合職.*未経験/,
    /幹部候補.*未経験/,
    /何でも相談/,
    /適性に応じて/,
    /案件多数/,
    /複数名募集/,
  ];
  if (vaguePatterns.some((p) => p.test(title))) {
    score += 5;
    signals.push({
      id: 'vague_title',
      name: '職缺定位明確性',
      label: '職稱/工作範圍模糊',
      pts: 5,
      maxPts: 5,
      triggered: true,
      explanation: '職位名稱過於廣泛（如オープンポジション、幹部候補），通常無特定職能編制。',
    });
    reasons.push('職位設定模糊，可能為通用性人才庫收件');
  } else {
    signals.push({
      id: 'vague_title',
      name: '職缺定位明確性',
      label: '職稱專業明確',
      pts: 0,
      maxPts: 5,
      triggered: false,
      explanation: '職稱具有明確的業務專業劃分。',
    });
  }

  // 分數限制在 0 - 100
  score = Math.min(Math.max(score, 0), 100);

  // 判定等級 (Verdict)
  let verdict: 'HIGH RISK' | 'SUSPICIOUS' | 'LOW RISK' | 'LIKELY REAL';
  let verdictLabel: string;
  let verdictColor: 'red' | 'orange' | 'yellow' | 'green';

  if (score >= 70) {
    verdict = 'HIGH RISK';
    verdictLabel = '高風險 (高機率幽靈/陷阱/黑心職缺)';
    verdictColor = 'red';
  } else if (score >= 45) {
    verdict = 'SUSPICIOUS';
    verdictLabel = '存疑 (疑點顯著，投遞前需嚴謹查證)';
    verdictColor = 'orange';
  } else if (score >= 20) {
    verdict = 'LOW RISK';
    verdictLabel = '低風險 (大致正規，留意個別條款)';
    verdictColor = 'yellow';
  } else {
    verdict = 'LIKELY REAL';
    verdictLabel = '高度真實 (官方直招/條件明確)';
    verdictColor = 'green';
  }

  // 信心層級 (Confidence) - 借鑑 fansia 與 Farhan
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  let confidenceNote: string;

  if (evidence.length >= 3 && applyUrl && description.length > 80) {
    confidence = 'HIGH';
    confidenceNote = '資料完整充足，比對維度涵蓋採用系統、薪資條款與描述特徵，分析結論具高度參考性。';
  } else if (evidence.length >= 1 && (applyUrl || description.length > 30)) {
    confidence = 'MEDIUM';
    confidenceNote = '獲得部分佐證數據，但缺少官方ATS直接連線或薪資細節，建議結合官網進一步確認。';
  } else {
    confidence = 'LOW';
    confidenceNote = '提供的職缺資訊有限（缺少網址或詳細描述），推估成分較大，僅供初步參考。';
  }

  // 生成避雷行動指南 (Recommendations)
  recommendations.push(`於日本最大員工評價網 OpenWork 查看「${company}」真實加班工時與評價`);
  if (minashiAnalysis.found) {
    recommendations.push('面試前要求確認：超過固定加班時數後的加班費是否依法足額支給');
  }
  if (scamHits.some((h) => h.category === 'ses_decoy')) {
    recommendations.push('務必確認：入社後第 1 年是否為客先常駐 (SES)？能否自主選擇專案？');
  }
  recommendations.push('向企業索取正式《労働条件通知書》(勞動條件通知書)，比對是否與求人票一致');

  const openWorkUrl = `https://www.openwork.jp/search/?q=${encodeURIComponent(company)}`;

  return {
    ...job,
    id: job.id || `job_${Math.random().toString(36).substring(2, 9)}`,
    ghostScore: score,
    verdict,
    verdictLabel,
    verdictColor,
    confidence,
    confidenceNote,
    atsResult,
    scamHits,
    signals,
    reasons,
    evidence,
    caveats,
    recommendations,
    openWorkUrl,
    duplicateInfo: dupeInfo,
    analyzedAt: new Date().toISOString(),
  };
}
