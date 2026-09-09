import { detectAtsFromUrl, AtsDetectionResult } from './japanAtsDetector';
import { scanJapanJobScams, analyzeMinashiZangyo, ScamHit } from './japanScamDictionary';
import { buildOpenWorkUrl, buildGoogleReviewUrl } from './urlScraper';

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
  verdictText: string;
  verdictLabel: string;
  verdictColor: 'red' | 'orange' | 'yellow' | 'green';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceText: string;
  confidenceNote: string;
  atsResult: AtsDetectionResult;
  scamHits: ScamHit[];
  signals: SignalDetail[];
  reasons: string[];
  evidence: string[];
  caveats: string[];
  recommendations: string[];
  openWorkUrl: string;
  googleReviewUrl: string;
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
export function analyzeSingleJob(
  job: JobInput,
  dupeInfo?: DuplicateInfo,
  lang: 'zh' | 'ja' = 'zh'
): GhostAnalysisResult {
  const isJa = lang === 'ja';
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
  const atsResult = detectAtsFromUrl(applyUrl, lang);
  if (atsResult.isDirectEmployer) {
    signals.push({
      id: 'ats_official',
      name: isJa ? '採用システム / 公式検証' : '採用系統 / 官網驗證',
      label: atsResult.label,
      pts: 0,
      maxPts: 25,
      triggered: false,
      explanation: atsResult.notes,
    });
    evidence.push(isJa ? `公式採用システム検定を通過：${atsResult.label}` : `通過官方招募系統檢驗：${atsResult.label}`);
  } else if (applyUrl) {
    score += 15;
    signals.push({
      id: 'ats_official',
      name: isJa ? '採用システム / 公式検証' : '採用系統 / 官網驗證',
      label: atsResult.label,
      pts: 15,
      maxPts: 25,
      triggered: true,
      explanation: isJa
        ? `応募先が求人アグリゲーターまたは非自社ATS（${atsResult.label}）のため、企業の直接雇用状態を直ちに確認できません。`
        : `連結指向求職聚合平台或非自建 ATS (${atsResult.label})，無法直接佐證企業當前實際招募狀態。`,
    });
    reasons.push(isJa ? `応募先が自社直営ATSではありません：${atsResult.label}` : `應徵連結非企業直營 ATS：${atsResult.label}`);
    caveats.push(
      isJa
        ? '知名の中小企業でも求人ポータルを活用することが一般的であり、直営ATS以外が直ちに架空求人とは限りません。'
        : '許多知名中小型企業或日企習慣使用求職網站代收履歷，非正規 ATS 不代表一定是假職缺。'
    );
  } else {
    score += 25;
    signals.push({
      id: 'ats_official',
      name: isJa ? '採用システム / 公式検証' : '採用系統 / 官網驗證',
      label: isJa ? '応募先URL・公式サイトなし' : '無應徵 / 官網連結',
      pts: 25,
      maxPts: 25,
      triggered: true,
      explanation: isJa
        ? '求人票に公式サイトや応募URLの記載がなく、実在性の確認が困難です。'
        : '職缺未提供任何官方應徵網址，真實性存疑。',
    });
    reasons.push(isJa ? '検証可能な応募URLまたは企業サイトが未記載' : '未提供可查證之應徵連結或企業官網');
  }

  // 2. 檢測黑心關鍵詞與詐騙模式
  const scamHits = scanJapanJobScams(title, description, salary, lang);
  const minashiAnalysis = analyzeMinashiZangyo(`${title} ${description} ${salary}`);

  let scamPts = 0;
  scamHits.forEach((hit) => {
    if (hit.severity === 'CRITICAL') scamPts += 25;
    else if (hit.severity === 'HIGH') scamPts += 15;
    else if (hit.severity === 'MEDIUM') scamPts += 8;
    else scamPts += 3;
    reasons.push(
      isJa
        ? `【${hit.categoryLabel}】${hit.title}（該当：「${hit.matchedText}」）`
        : `【${hit.categoryLabel}】${hit.title}（命中：「${hit.matchedText}」）`
    );
    evidence.push(
      isJa
        ? `リスク特徵を検出：${hit.title} (${hit.matchedText})`
        : `觸發風險特徵：${hit.title} (${hit.matchedText})`
    );
  });

  scamPts = Math.min(scamPts, 35);
  if (scamPts > 0) {
    score += scamPts;
    const riskTitles = scamHits.map((h) => h.title).join('、');
    const detailedSummary = scamHits
      .map((h) =>
        isJa
          ? `【${h.title}】（該当文字：「${h.matchedText}」）${h.explanation}`
          : `【${h.title}】（命中原文：「${h.matchedText}」）${h.explanation}`
      )
      .join('；');

    signals.push({
      id: 'scam_keywords',
      name: isJa ? 'ブラック求人・おとり話術' : '黑心・誘餌與詐騙話術',
      label: isJa
        ? (scamHits.length === 1 ? `検出: ${scamHits[0].title}` : `${scamHits.length}項目のリスク特徵（${riskTitles}）`)
        : (scamHits.length === 1 ? `偵測到：${scamHits[0].title}` : `偵測到 ${scamHits.length} 項風險特徵（${riskTitles}）`),
      pts: scamPts,
      maxPts: 35,
      triggered: true,
      explanation: detailedSummary,
    });
  } else {
    signals.push({
      id: 'scam_keywords',
      name: isJa ? 'ブラック求人・おとり話術' : '黑心・誘餌與詐騙話術',
      label: isJa ? '明らかな危険表現は未検出' : '未檢出明顯黑心語法',
      pts: 0,
      maxPts: 35,
      triggered: false,
      explanation: isJa
        ? '求人票の表現は概ね適切で、過度な精神論やおとり文言は見当たりません。'
        : '職缺描述措辭規範，未出現典型精神論、客先常駐釣魚或詐騙用語。',
    });
    evidence.push(isJa ? '一般的なブラック企業・おとり文言は未検出' : '未檢出常見黑心企業與誘餌語錄');
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
    evidence.push(isJa ? `掲載から ${daysOld} 日経過` : `已刊登 ${daysOld} 天`);
    if (daysOld > 120) {
      score += 20;
      signals.push({
        id: 'posting_age',
        name: isJa ? '掲載日数・鮮度分析' : '刊登天數分析',
        label: isJa ? `超長期滞留 (${daysOld} 日経過)` : `超長期滯留 (${daysOld} 天)`,
        pts: 20,
        maxPts: 20,
        triggered: true,
        explanation: isJa
          ? `掲載から ${daysOld} 日が経過しています。通常の中途採用は30〜60日程度で充足するため、放置されたゴースト求人または母集団形成用の疑いがあります。`
          : `已刊登超過 120 天。常態正職員工招聘通常在 30~60 天內結案，此缺極可能為人才庫儲備 (Talent Pipeline) 或忘記下架的幽靈缺。`,
      });
      reasons.push(isJa ? `求人掲載が ${daysOld} 日以上経過し、流動性が停滞` : `職缺刊登已超過 ${daysOld} 天，流動停滯`);
      caveats.push(
        isJa
          ? '役員・CTOなどのエグゼクティブ採用や特殊専門職は採用期間が半年以上におよぶ場合もあります。'
          : '高階職位（如 CTO / 專任役員）或特殊技術崗位招聘期可能長達半年以上，不能僅憑刊登時間判定。'
      );
    } else if (daysOld > 60) {
      score += 10;
      signals.push({
        id: 'posting_age',
        name: isJa ? '掲載日数・鮮度分析' : '刊登天數分析',
        label: isJa ? `掲載やや長期 (${daysOld} 日経過)` : `刊登較久 (${daysOld} 天)`,
        pts: 10,
        maxPts: 20,
        triggered: true,
        explanation: isJa
          ? `掲載後60日を超過しており、平均的な充足期間よりも長引いています。`
          : `刊登超過 60 天，高於一般平均結案週期。`,
      });
      reasons.push(isJa ? `掲載が ${daysOld} 日に達しており、常設掲載の可能性` : `刊登已達 ${daysOld} 天，可能為常態性掛牌`);
    } else {
      signals.push({
        id: 'posting_age',
        name: isJa ? '掲載日数・鮮度分析' : '刊登天數分析',
        label: isJa ? `直近の更新 (${daysOld} 日以内)` : `近期更新 (${daysOld} 天內)`,
        pts: 0,
        maxPts: 20,
        triggered: false,
        explanation: isJa
          ? `掲載から ${daysOld} 日以内で、通常の募集期間内です。`
          : `刊登時間在 ${daysOld} 天內，屬於正常招聘有效週期。`,
      });
    }
  } else {
    score += 8;
    signals.push({
      id: 'posting_age',
      name: isJa ? '掲載日数・鮮度分析' : '刊登天數分析',
      label: isJa ? '掲載日・更新日の記載なし' : '未提供刊登日期',
      pts: 8,
      maxPts: 20,
      triggered: true,
      explanation: isJa
        ? '掲載開始日や更新日の明記がなく、募集の鮮度を確認できません。'
        : '缺少明確刊登或更新日期，無法確認職缺新鮮度。',
    });
    reasons.push(isJa ? '求人票に掲載日または更新日の記載なし' : '求人票未明確標註刊登日或更新日');
  }

  // 4. 重複與歷史重貼 (Duplicates / Reposts)
  if (dupeInfo?.isDuplicate) {
    const count = dupeInfo.duplicateCount || 2;
    score += 12;
    signals.push({
      id: 'duplicate_check',
      name: isJa ? '重複・再掲載チェック' : '批次重複檢測',
      label: isJa ? `同リスト内で ${count} 件の重複` : `同批重複出現 ${count} 次`,
      pts: 12,
      maxPts: 15,
      triggered: true,
      explanation: isJa
        ? `この求人はリスト内で ${count} 回重複しています。複数仲介会社による同一案件の横流しや重複掲載の可能性があります。`
        : `此職缺在您的清單中重複出現 ${count} 次，常見於不同仲介公司或不同分部代理同一個專案洗版。`,
    });
    reasons.push(isJa ? `リスト内で同一または極めて類似の求人が ${count} 回検出` : `清單中重複出現 ${count} 次`);
  } else if (dupeInfo?.isRepost) {
    const count = dupeInfo.repostCount || 1;
    score += 10;
    signals.push({
      id: 'duplicate_check',
      name: isJa ? '重複・再掲載チェック' : '批次重複檢測',
      label: isJa ? `定期的な再投稿 ${count} 回` : `歷史定時重貼 ${count} 次`,
      pts: 10,
      maxPts: 15,
      triggered: true,
      explanation: isJa
        ? `同企業が異なる日付で同一内容の求人を繰り返し再投稿しています。離職率の高さや上位表示狙いの特徴です。`
        : `檢測到同一公司使用不同日期重複刊登同職務，為求職網站刷熱度或高離職率職缺典型特徵。`,
    });
    reasons.push(isJa ? `同一求人が異なる日付で ${count} 回再投稿されています` : `同職缺在不同日期被重複重貼 ${count} 次`);
  } else {
    signals.push({
      id: 'duplicate_check',
      name: isJa ? '重複・再掲載チェック' : '批次重複檢測',
      label: isJa ? '重複・再投稿なし' : '無重複或重貼',
      pts: 0,
      maxPts: 15,
      triggered: false,
      explanation: isJa ? '重複掲載や使い回しの兆候は見つかりませんでした。' : '未檢測到洗版或重複複製刊登跡象。',
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
      name: isJa ? '職種定義の明確さ' : '職缺定位明確性',
      label: isJa ? '職種・業務範囲が曖昧' : '職稱/工作範圍模糊',
      pts: 5,
      maxPts: 5,
      triggered: true,
      explanation: isJa
        ? 'オープンポジションや未経験総合職など、具体的な業務定義が曖昧で母集団形成目的の疑いがあります。'
        : '職位名稱過於廣泛（如オープンポジション、幹部候補），通常無特定職能編制。',
    });
    reasons.push(isJa ? 'ポジション定義が曖昧で、一般的なタレントプール目的の可能性' : '職位設定模糊，可能為通用性人才庫收件');
  } else {
    signals.push({
      id: 'vague_title',
      name: isJa ? '職種定義の明確さ' : '職缺定位明確性',
      label: isJa ? '専門性が明確' : '職稱專業明確',
      pts: 0,
      maxPts: 5,
      triggered: false,
      explanation: isJa ? '職種や担当業務領域が明確に定義されています。' : '職稱具有明確的業務專業劃分。',
    });
  }

  // 分數限制在 0 - 100
  score = Math.min(Math.max(score, 0), 100);

  // 判定等級 (Verdict)
  let verdict: 'HIGH RISK' | 'SUSPICIOUS' | 'LOW RISK' | 'LIKELY REAL';
  let verdictText: string;
  let verdictLabel: string;
  let verdictColor: 'red' | 'orange' | 'yellow' | 'green';

  if (score >= 70) {
    verdict = 'HIGH RISK';
    verdictText = isJa ? '高リスク・おとり' : '高風險 / 釣魚疑慮';
    verdictLabel = isJa ? '高リスク（おとり求人・ブラック企業の懸念大）' : '高風險 (高機率幽靈/陷阱/黑心職缺)';
    verdictColor = 'red';
  } else if (score >= 45) {
    verdict = 'SUSPICIOUS';
    verdictText = isJa ? '要確認・注意' : '存疑 / 需查證';
    verdictLabel = isJa ? '要確認（懸念事項あり、応募前に詳細調査を推奨）' : '存疑 (疑點顯著，投遞前需嚴謹查證)';
    verdictColor = 'orange';
  } else if (score >= 20) {
    verdict = 'LOW RISK';
    verdictText = isJa ? '低リスク・通常' : '低風險 / 條款留心';
    verdictLabel = isJa ? '低リスク（概ね適正、契約条件を要確認）' : '低風險 (大致正規，留意個別條款)';
    verdictColor = 'yellow';
  } else {
    verdict = 'LIKELY REAL';
    verdictText = isJa ? '高信頼度・正規' : '真實正規 / 官方直聘';
    verdictLabel = isJa ? '極めて高い実在性（公式直募・労働条件明瞭）' : '高度真實 (官方直招/條件明確)';
    verdictColor = 'green';
  }

  // 信心層級 (Confidence)
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  let confidenceText: string;
  let confidenceNote: string;

  if (evidence.length >= 3 && applyUrl && description.length > 80) {
    confidence = 'HIGH';
    confidenceText = isJa ? '高（情報十分）' : '高 (資訊充分)';
    confidenceNote = isJa
      ? '十分な求人情報が提供されており、ATS・給与体系・職務内容の多角分析により高い精度を確保しています。'
      : '資料完整充足，比對維度涵蓋採用系統、薪資條款與描述特徵，分析結論具高度參考性。';
  } else if (evidence.length >= 1 && (applyUrl || description.length > 30)) {
    confidence = 'MEDIUM';
    confidenceText = isJa ? '中（一部推定）' : '中 (部分推估)';
    confidenceNote = isJa
      ? '一定のデータを取得しましたが、公式ATS接続や給与内訳の詳細が不足しているため、企業の公式確認を推奨します。'
      : '獲得部分佐證數據，但缺少官方ATS直接連線或薪資細節，建議結合官網進一步確認。';
  } else {
    confidence = 'LOW';
    confidenceText = isJa ? '低（参考程度）' : '低 (資料有限)';
    confidenceNote = isJa
      ? '提供された情報（URLや詳細テキスト）が限定的なため、推測要素を含みます。'
      : '提供的職缺資訊有限（缺少網址或詳細描述），推估成分較大，僅供初步參考。';
  }

  // 生成避雷行動指南 (Recommendations)
  recommendations.push(
    isJa
      ? `日本最大級の社員口コミサイト「OpenWork」で「${company}」の平均残業時間や退職理由を確認`
      : `於日本最大員工評價網 OpenWork 查看「${company}」真實加班工時與評價`
  );
  if (minashiAnalysis.found) {
    recommendations.push(
      isJa
        ? '固定残業代制の確認：規定時間を超過した分が労働基準法に基づき満額支給されるかを事前に確認'
        : '面試前要求確認：超過固定加班時數後的加班費是否依法足額支給'
    );
  }
  if (scamHits.some((h) => h.category === 'ses_decoy')) {
    recommendations.push(
      isJa
        ? '客先常駐の有無：入社初年度の勤務場所（客先常駐か自社開発か）、案件選択権の有無を確認'
        : '務必確認：入社後第 1 年是否為客先常駐 (SES)？能否自主選擇專案？'
    );
  }
  recommendations.push(
    isJa
      ? '内定前に正式な「労働条件通知書」の提示を求め、求人票の記載内容と相違ないか照合'
      : '向企業索取正式《労働条件通知書》(勞動條件通知書)，比對是否與求人票一致'
  );

  const openWorkUrl = buildOpenWorkUrl(company);
  const googleReviewUrl = buildGoogleReviewUrl(company);

  return {
    ...job,
    id: job.id || `job_${Math.random().toString(36).substring(2, 9)}`,
    ghostScore: score,
    verdict,
    verdictText,
    verdictLabel,
    verdictColor,
    confidence,
    confidenceText,
    confidenceNote,
    atsResult,
    scamHits,
    signals,
    reasons,
    evidence,
    caveats,
    recommendations,
    openWorkUrl,
    googleReviewUrl,
    duplicateInfo: dupeInfo,
    analyzedAt: new Date().toISOString(),
  };
}
