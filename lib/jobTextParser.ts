import { JobInput } from './ghostScoreEngine';

const HEADER_KEYWORDS = new Set([
  '勤務地', '就業場所', '所在地', '場所', 'アクセス',
  '給与', '給与・報酬', '月給', '年収', '時給', '日給', '賃金',
  '雇用形態', '契約形態', '仕事内容', '業務内容', '職務内容',
  '募集要項', '募集概要', '勤務時間', '労働時間', '残業',
  '待遇・福利厚生', '福利厚生', '休日・休暇', '休日', '休暇',
  '応募資格', '求める人物像', '応募要件', '必要スキル',
  '会社概要', '企業情報', '会社名', '企業名', '社名', '掲載日',
  '応募方法', '選考フロー', 'アピールポイント', '特長'
]);

export function parseJapaneseJobText(rawText: string): JobInput {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = '';
  let company = '';
  let location = '';
  let salary = '';

  // 1. 正則表達式標籤比對 (Explicit Label Extraction)
  const titleMatch = rawText.match(/(?:【\s*(?:職種|募集職種|募集ポジション|求人タイトル|職種名)\s*】|(?:職種|募集職種|募集ポジション|求人タイトル|職種名)\s*[:：])\s*([^\r\n]+)/i);
  if (titleMatch && titleMatch[1].trim()) {
    title = titleMatch[1].trim();
  }

  const companyMatch = rawText.match(/(?:【\s*(?:会社名|企業名|社名|雇用元|雇用者)\s*】|(?:会社名|企業名|社名|雇用元)\s*[:：])\s*([^\r\n]+)/i);
  if (companyMatch && companyMatch[1].trim()) {
    company = companyMatch[1].trim();
  }

  const locationMatch = rawText.match(/(?:【\s*(?:勤務地|就業場所|所在地)\s*】|(?:勤務地|就業場所|所在地)\s*[:：])\s*([^\r\n]+)/i);
  if (locationMatch && locationMatch[1].trim()) {
    location = locationMatch[1].trim();
  }

  const salaryMatch = rawText.match(/(?:【\s*(?:給与|給料|月給|年収|時給|日給|賃金)\s*】|(?:給与|給料|月給|年収|時給|日給|賃金)\s*[:：])\s*([^\r\n]+)/i);
  if (salaryMatch && salaryMatch[1].trim()) {
    salary = salaryMatch[1].trim();
  }

  // 2. 如果沒有顯式公司標籤，在全文中搜尋日本法人特徵詞
  if (!company) {
    const corporateMatch = rawText.match(/(?:株式|有限|合同|合資)会社[^\s\r\n,，、。]+/);
    if (corporateMatch) {
      company = corporateMatch[0].trim();
    } else {
      const orgMatch = rawText.match(/(?:一般社団法人|社会福祉法人|医療法人|学校法人)[^\s\r\n,，、。]+/);
      if (orgMatch) {
        company = orgMatch[0].trim();
      }
    }
  }

  // 3. 如果沒有顯式地點標籤，尋找郵遞區號或日本都道府縣
  if (!location) {
    const postalMatch = rawText.match(/〒\s*\d{3}-\d{4}[^\r\n]*/);
    if (postalMatch) {
      location = postalMatch[0].trim();
    } else {
      const prefMatch = rawText.match(/(?:東京都|北海道|(?:京都|大阪)府|.{2,3}県)[^\r\n,，。]+/);
      if (prefMatch) {
        location = prefMatch[0].slice(0, 40).trim();
      }
    }
  }

  // 4. 如果沒有顯式薪資標籤，尋找薪資語句
  if (!salary) {
    const salLineMatch = rawText.match(/(?:月給|年収|時給|日給)\s*[:：]?\s*[\d,万千~～-]+\s*円?[^\r\n]*/i);
    if (salLineMatch) {
      salary = salLineMatch[0].slice(0, 40).trim();
    }
  }

  // 5. 標題智慧解析（避開欄位標題與郵遞區號/地址）
  if (!title) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 略過純欄位關鍵字
      if (HEADER_KEYWORDS.has(line.replace(/[:：]/g, ''))) continue;
      // 略過郵遞區號與地址行
      if (line.startsWith('〒') || /^\d{3}-\d{4}/.test(line)) continue;
      // 略過薪資行
      if (/^(?:月給|時給|年収|日給)/.test(line)) continue;
      // 略過網址
      if (line.startsWith('http')) continue;
      // 略過公司名行（若已識別）
      if (company && line.includes(company)) continue;

      // 若包含常見職種名稱關鍵字
      if (/(?:エンジニア|プログラマ|開発|デザイナー|ディレクター|営業|事務|企画|総合職|管理|サポート|アシスタント|コンサル|看護|医療|施工|作業|ドライバー|スタッフ|急募|募集|担当)/i.test(line)) {
        title = line;
        break;
      }
    }

    // 若仍未找到，取第一個非標籤的有效文字行
    if (!title) {
      for (const line of lines) {
        if (
          !HEADER_KEYWORDS.has(line.replace(/[:：]/g, '')) &&
          !line.startsWith('〒') &&
          !/^(?:月給|時給|年収|日給)/.test(line) &&
          line.length > 2 &&
          line.length <= 60
        ) {
          title = line;
          break;
        }
      }
    }
  }

  // 6. 最終備用預設值
  const cleanedTitle = title.trim() || '日本求職職缺檢測';
  const cleanedCompany = company.trim() || (location ? `${location.split(' ')[0]} 徵才企業` : '日本採用企業 (社名未指定)');

  return {
    id: `paste_${Date.now()}`,
    title: cleanedTitle,
    company: cleanedCompany,
    location: location.trim(),
    salary: salary.trim(),
    postedDate: new Date().toISOString().split('T')[0],
    sourcePlatform: '文字直接貼上',
    description: rawText.trim(),
  };
}
