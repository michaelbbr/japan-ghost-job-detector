import { JobInput } from './ghostScoreEngine';

const HEADER_KEYWORDS = new Set([
  '勤務地', '就業場所', '所在地', '場所', 'アクセス', '勤務場所',
  '給与', '給与・報酬', '月給', '年収', '時給', '日給', '賃金', '給料', '想定年収',
  '雇用形態', '契約形態', '仕事内容', '業務内容', '職務内容',
  '募集要項', '募集概要', '勤務時間', '労働時間', '残業', '労働条件',
  '待遇・福利厚生', '福利厚生', '休日・休暇', '休日', '休暇', '年間休日',
  '応募資格', '求める人物像', '応募要件', '必要スキル', '必須要件', '歓迎要件',
  '会社概要', '企業情報', '会社名', '企業名', '社名', '店舗名', '掲載日', '更新日',
  '応募方法', '選考フロー', 'アピールポイント', '特長', '応募について', '選考について',
  '採用予定人数', '待遇', '社会保険', '契約期間', '受動喫煙対策', '求人詳細', '応募情報'
]);

export function parseJapaneseJobText(rawText: string): JobInput {
  // 清理無關的雜訊字串（例如 Indeed 介面按鈕字樣）
  const cleanedRaw = rawText
    .replace(/(?:ログイン|アカウント作成|求人を保存|応募画面へ進む|履歴書を登録|簡単応募|Indeed で求人を見る)/g, '')
    .trim();

  const lines = cleanedRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = '';
  let company = '';
  let location = '';
  let salary = '';

  // 1. 正則表達式標籤比對 (Explicit Label Extraction)
  const titleMatch = cleanedRaw.match(/(?:【\s*(?:職種|募集職種|募集ポジション|求人タイトル|職種名|ポジション)\s*】|(?:職種|募集職種|募集ポジション|求人タイトル|職種名|ポジション)\s*[:：])\s*([^\r\n]+)/i);
  if (titleMatch && titleMatch[1].trim()) {
    title = titleMatch[1].trim();
  }

  const companyMatch = cleanedRaw.match(/(?:【\s*(?:会社名|企業名|社名|店舗名|雇用元|雇用者)\s*】|(?:会社名|企業名|社名|店舗名|雇用元)\s*[:：])\s*([^\r\n]+)/i);
  if (companyMatch && companyMatch[1].trim()) {
    company = companyMatch[1].trim();
  }

  const locationMatch = cleanedRaw.match(/(?:【\s*(?:勤務地|就業場所|所在地|勤務場所)\s*】|(?:勤務地|就業場所|所在地|勤務場所)\s*[:：])\s*([^\r\n]+)/i);
  if (locationMatch && locationMatch[1].trim()) {
    location = locationMatch[1].trim();
  }

  const salaryMatch = cleanedRaw.match(/(?:【\s*(?:給与|給与・報酬|給料|月給|年収|時給|日給|賃金)\s*】|(?:給与|給与・報酬|給料|月給|年収|時給|日給|賃金)\s*[:：])\s*([^\r\n]+)/i);
  if (salaryMatch && salaryMatch[1].trim()) {
    salary = salaryMatch[1].trim();
  }

  // 2. 如果沒有顯式公司標籤，在全文中搜尋日本法人特徵詞 (株式/有限/合同/合資会社、一般社団法人等)
  if (!company) {
    const corporateMatch = cleanedRaw.match(/(?:株式|有限|合同|合資)会社[^\s\r\n,，、。]+/);
    if (corporateMatch) {
      company = corporateMatch[0].trim();
    } else {
      const orgMatch = cleanedRaw.match(/(?:一般社団法人|社会福祉法人|医療法人|学校法人)[^\s\r\n,，、。]+/);
      if (orgMatch) {
        company = orgMatch[0].trim();
      }
    }
  }

  // 3. 如果沒有顯式地點標籤，尋找郵遞區號或日本都道府縣
  if (!location) {
    const postalMatch = cleanedRaw.match(/〒\s*\d{3}-\d{4}[^\r\n]*/);
    if (postalMatch) {
      location = postalMatch[0].trim();
    } else {
      const prefMatch = cleanedRaw.match(/(?:東京都|北海道|(?:京都|大阪)府|.{2,3}県)[^\r\n,，。]+/);
      if (prefMatch) {
        location = prefMatch[0].slice(0, 40).trim();
      }
    }
  }

  // 4. 如果沒有顯式薪資標籤，尋找薪資語句 (月給、時給、年収)
  if (!salary) {
    const salLineMatch = cleanedRaw.match(/(?:月給|年収|時給|日給)\s*[:：]?\s*[\d,万千~～\-–\s]+(?:円|万円)?[^\r\n]*/i);
    if (salLineMatch) {
      salary = salLineMatch[0].slice(0, 40).trim();
    }
  }

  // 5. 標題智慧解析（避開欄位標題與郵遞區號/地址/薪資行）
  let titleLineIdx = -1;
  if (!title) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (HEADER_KEYWORDS.has(line.replace(/[:：]/g, ''))) continue;
      if (line.startsWith('〒') || /^\d{3}-\d{4}/.test(line)) continue;
      if (/^(?:月給|時給|年収|日給)/.test(line)) continue;
      if (line.startsWith('http')) continue;
      if (company && line.includes(company)) continue;

      // 若包含常見日本求職職種關鍵字
      if (/(?:エンジニア|プログラマ|開発|デザイナー|ディレクター|営業|事務|企画|総合職|管理|サポート|アシスタント|コンサル|看護|医療|施工|作業|ドライバー|スタッフ|急募|募集|担当|接客|販売|店長|調理|ホール|キッチン)/i.test(line)) {
        title = line;
        titleLineIdx = i;
        break;
      }
    }

    // 若仍未找到，取第一個非標籤、長度適中的文字行
    if (!title) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          !HEADER_KEYWORDS.has(line.replace(/[:：]/g, '')) &&
          !line.startsWith('〒') &&
          !/^(?:月給|時給|年収|日給)/.test(line) &&
          !line.startsWith('http') &&
          line.length >= 3 &&
          line.length <= 70
        ) {
          title = line;
          titleLineIdx = i;
          break;
        }
      }
    }
  } else {
    titleLineIdx = lines.findIndex((l) => l.includes(title));
  }

  // 6. 若公司名仍未找到，運用求職網排版慣性 (Indeed/LinkedIn 多將公司名緊隨職種名稱下一行)
  if (!company && titleLineIdx >= 0) {
    for (let offset = 1; offset <= 3; offset++) {
      const candidateIdx = titleLineIdx + offset;
      if (candidateIdx < lines.length) {
        const cand = lines[candidateIdx];
        const cleanCand = cand.replace(/[:：【】]/g, '').trim();
        if (
          !HEADER_KEYWORDS.has(cleanCand) &&
          !cand.startsWith('〒') &&
          !/^\d{3}-\d{4}/.test(cand) &&
          !/(?:東京都|北海道|(?:京都|大阪)府|.{2,3}県)/.test(cand) &&
          !/(?:月給|時給|年収|日給|万円|円)/.test(cand) &&
          !cand.startsWith('http') &&
          cand.length >= 2 &&
          cand.length <= 50
        ) {
          company = cand;
          break;
        }
      }
    }
  }

  // 7. 提取網址（若貼上文字中有附帶連結）
  let applyUrl = '';
  const urlMatch = cleanedRaw.match(/https?:\/\/[^\s\r\n"'>\)]+/i);
  if (urlMatch) {
    applyUrl = urlMatch[0];
  }

  // 8. 智慧提取刊登或更新日期（若文字有包含）
  let postedDate = '';
  const datePatterns = [
    /(?:掲載日|更新日|募集開始日|投稿日|公表日)\s*[:：]?\s*(\d{4}[年/.-]\d{1,2}[月/.-]\d{1,2}日?)/i,
    /(\d{4}[年/.-]\d{1,2}[月/.-]\d{1,2}日?)\s*(?:掲載|更新)/i,
  ];
  for (const dp of datePatterns) {
    const m = cleanedRaw.match(dp);
    if (m && m[1]) {
      postedDate = m[1].replace(/[年月]/g, '-').replace(/日/g, '').trim();
      break;
    }
  }
  if (!postedDate) {
    const relativeMatch = cleanedRaw.match(/(\d{1,2})\s*日前/);
    if (relativeMatch) {
      const daysAgo = parseInt(relativeMatch[1], 10);
      const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      postedDate = d.toISOString().split('T')[0];
    }
  }

  // 9. 最終防護清洗與合理預設值
  let cleanedTitle = (title.trim() || '日本求職職缺檢測')
    .replace(/\s*[-–|/]\s*(?:job\s*post|Indeed|インディード|求人ボックス|マイナビ|リクナビ|doda).*$/i, '')
    .trim();
  if (!cleanedTitle) cleanedTitle = '日本求職職缺檢測';

  let cleanedCompany = company.trim() || (location ? `${location.split(' ')[0]} 徵才企業` : '日本採用企業 (社名未指定)');
  cleanedCompany = cleanedCompany.replace(/\s*[\(（][^)）]*$/, '').trim();

  return {
    id: `paste_${Date.now()}`,
    title: cleanedTitle,
    company: cleanedCompany,
    location: location.trim(),
    salary: salary.trim(),
    postedDate, // 僅在文字中確實檢測到日期時才設定，未提供時保持空字串
    applyUrl,
    sourcePlatform: '職缺文字直接貼上',
    description: cleanedRaw.slice(0, 4000),
  };
}
