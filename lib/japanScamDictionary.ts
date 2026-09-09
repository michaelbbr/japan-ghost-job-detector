export interface ScamHit {
  category: 'minashi_zangyo' | 'ses_decoy' | 'black_company' | 'yami_baito' | 'platform_trap';
  categoryLabel: string;
  pattern: string;
  matchedText: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  explanation: string;
  legalRisk?: string;
}

export interface MinashiZangyoAnalysis {
  found: boolean;
  hours?: number;
  isExcessive: boolean; // >= 45h
  details?: string;
  legalWarning?: string;
}

// 1. みなし残業（固定残業代）正規表達式與分析
export function analyzeMinashiZangyo(text: string): MinashiZangyoAnalysis {
  if (!text) return { found: false, isExcessive: false };

  // 尋找包含固定殘業或みなし殘業的時數
  const patterns = [
    /(?:固定残業(?:代|手当)?|みなし残業(?:代|手当)?)[^\d]{0,20}(\d{1,2})\s*時間/i,
    /(\d{1,2})\s*時間(?:分)?の(?:固定残業|みなし残業)/i,
    /残業代(?:として|は)?\s*(\d{1,2})\s*時間/i,
    /みなし労働時間[^\d]{0,10}(\d{1,2})\s*時間/i,
  ];

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const hours = parseInt(match[1], 10);
      if (hours > 0 && hours <= 100) {
        const isExcessive = hours >= 45;
        let legalWarning = '';
        if (hours >= 45) {
          legalWarning = `根據日本《勞動基準法》第36條協定（36協定），一般月加班上限為45小時。此職缺包含 ${hours} 小時固定加班，已達或超過法定上限，極可能存在高壓長工時（過勞死基準線）與黑心工時風險！`;
        } else if (hours >= 30) {
          legalWarning = `含 ${hours} 小時固定加班。請特別注意基本底薪是否被過度壓縮，並確認超過 ${hours} 小時後公司是否依法足額給付超時津貼。`;
        }

        return {
          found: true,
          hours,
          isExcessive,
          details: `檢測到包含固定殘業代 ${hours} 小時`,
          legalWarning,
        };
      }
    }
  }

  // 檢測有固定殘業但未明寫時數的違法嫌疑
  if (
    /(?:固定残業代を含む|みなし残業あり|給与に残業手当を含む)/.test(text) &&
    !/\d{1,2}時間/.test(text)
  ) {
    return {
      found: true,
      isExcessive: true,
      details: '提及包含固定加班費，但未依法載明精確「相當時間數」',
      legalWarning: '日本厚生勞動省明文規定：採用固定殘業代制度時，必須在求人票上明確記載包含之時數與金額。未寫明時數者違反《職業安定法》之勞動條件明示義務！',
    };
  }

  return { found: false, isExcessive: false };
}

export interface PatternItem {
  regex: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  explanation: string;
  legalRisk?: string;
}

// 2. SES (客先常駐) / 釣魚職缺特徵庫
export const SES_PATTERNS: PatternItem[] = [
  {
    regex: /(?:客先常駐|クライアント先|プロジェクト先|常駐先)(?:での勤務|勤務)?/,
    severity: 'HIGH',
    title: '客先常駐 (SES派遣型)',
    explanation: '工作地點非雇主公司，而是被派遣至客戶端現場（常駐）。技術積累易中斷，經常面臨多重轉包。',
    legalRisk: '需警惕「偽裝請負（假外包真派遣）」違反日本《勞動者派遣法》。'
  },
  {
    regex: /(?:自社内開発\s*[\(（]?(?:案件による|将来的には|プロジェクトによる)[\)）]?)/,
    severity: 'HIGH',
    title: '偽裝自社開發 (おとり求人)',
    explanation: '標題或宣傳宣稱「自社開發」，但在備註卻寫「視專案而定/未來轉入」，實際 90% 以上是外派 SES 的常見話術。',
    legalRisk: '涉嫌廣告不實（誇大招募廣告）。'
  },
  {
    regex: /(?:未経験から(?:IT|WEB|システム)?エンジニア|研修期間中(?:は|も)給与支給|未経験歓迎.{0,20}月給\s*(?:3[0-9]|4[0-9]|5[0-9])万)/,
    severity: 'HIGH',
    title: '未經驗高薪工程師釣魚',
    explanation: '開出未經驗即可享高薪的誘餌，入社後通常先要求從事客服家電行外包或無技術門檻的打雜常駐，無法獲得預期技術經驗。'
  },
  {
    regex: /(?:還元率\s*(?:70|75|80|85|90)[\%％]|高還元SES|案件選択制)/,
    severity: 'MEDIUM',
    title: '高還元率 SES 特徵',
    explanation: '強調工程師分潤比例高與案件自選，雖比傳統 SES 透明，但本質仍為單兵外派，公司通常不提供職涯輔導與培育。'
  },
  {
    regex: /(?:案件多数|取引先\s*\d{2,}社|待機期間も給与全額)/,
    severity: 'MEDIUM',
    title: '典型派遣池 (Talent Pool) 話術',
    explanation: '強調案件數量龐大或空窗期全薪，代表公司依賴快速配對賺取人月差價。'
  }
];

// 3. 黑心企業 (ブラック企業) / 精神論 / やりがい搾取 語錄特徵庫
export const BLACK_COMPANY_PATTERNS: PatternItem[] = [
  {
    regex: /(?:アットホームな(?:職場|会社|環境)|アットホームで家族のような)/,
    severity: 'HIGH' as const,
    title: 'アットホームな職場 (家庭式溫馨陷阱)',
    explanation: '日本求職界著名的「黑心警示詞第一名」。表面是人際關係親近，實質上經常意味著缺乏公私界線、無償加班、情緒勒索與缺乏正規人資制度。'
  },
  {
    regex: /(?:やりがい搾取|夢を叶える|感動を共有|情熱を持って|熱い想い)/,
    severity: 'HIGH' as const,
    title: 'やりがい搾取 (熱情搾取・精神論)',
    explanation: '以「自我成長、感動、夢想」包裝低工資與長工時，忽略客觀勞動報酬與勞工福利。'
  },
  {
    regex: /(?:若手が活躍|平均年齢\s*(?:2[0-5])歳|若手中心)/,
    severity: 'MEDIUM' as const,
    title: '員工平均年齡過低 (異常流動率)',
    explanation: '若非剛成立的新創，員工平均年齡僅 20 代前半且主管皆年輕，通常意味著 30 歲以上的資深員工全數離職，公司流動率極高（免洗筷企業）。'
  },
  {
    regex: /(?:裁量労働制.{0,30}(?:残業代なし|定時なし|未経験))/,
    severity: 'HIGH' as const,
    title: '濫用裁量勞動制',
    explanation: '將原本僅適用於高度專業研發人員的「專門業務型裁量勞動制」套用在一般或未經驗職缺上，以規避超時加班費發放。'
  },
  {
    regex: /(?:面接1回のみ|即日内定|即日採用|履歴書不要|書類選考なし)/,
    severity: 'HIGH' as const,
    title: '極度缺乏篩選門檻 (免洗即戰力)',
    explanation: '無須書面審查、面試僅 1 次甚至當天內定，代表職位人員缺口極度危急或離職率極端驚人，來者不拒。'
  },
  {
    regex: /(?:幹部候補.{0,15}未経験|未経験から即月給\s*(?:35|40|50)万)/,
    severity: 'HIGH' as const,
    title: '未經驗幹部候補 (高離職率業務坑)',
    explanation: '多見於不動產電話推銷、連鎖餐飲或保險直銷，以光鮮亮麗的「幹部」頭銜掩飾高壓淘汰制。'
  },
  {
    regex: /(?:試用期間中は(?:契約社員|業務委託|アルバイト)|試用期間中の給与半減)/,
    severity: 'CRITICAL' as const,
    title: '試用期契約降級違法風險',
    explanation: '宣稱正社員採用，但試用期間偷偷降為契約社員或無社會保險的業務委託，極易在試用期滿被隨意解雇。'
  }
];

// 4. 闇バイト (黑工・詐騙・違法副業) 特徵庫
export const YAMI_BAITO_PATTERNS: PatternItem[] = [
  {
    regex: /(?:闇バイト|裏バイト|ホワイト案件|高額バイト.{0,15}即日現金)/,
    severity: 'CRITICAL',
    title: '闇バイト (黑工/犯罪募集嫌疑)',
    explanation: '利用「ホワイト案件（宣稱合法無風險）」等反常字眼招募從事強盜、提款車手或詐騙活動。'
  },
  {
    regex: /(?:荷物(?:の)?(?:受取|受け取り|転送)|荷物転送業務|届いた荷物を)/,
    severity: 'CRITICAL',
    title: '轉送詐騙 / 洗錢代收包裹',
    explanation: '要求應徵者在家接收包裹並轉寄至指定地址，實際為使用被盜刷信用卡購買之贓物或違禁品洗錢。'
  },
  {
    regex: /(?:口座(?:開設|売買|提供)|名義貸し|SIMカード(?:契約|送付))/,
    severity: 'CRITICAL',
    title: '買賣人頭帳戶 / 名義借出',
    explanation: '要求開設或提供銀行帳戶、門號 SIM 卡，在日本為觸犯《犯罪收益轉移防止法》之嚴重刑事罪行！'
  },
  {
    regex: /(?:スマホ1台で|コピペするだけ|誰でも月収\s*(?:50|100)万|初期費用|マニュアル購入)/,
    severity: 'HIGH',
    title: '情報商材 / 虛假副業詐欺',
    explanation: '宣稱無門檻躺賺，應徵後要求購買高額教材或繳納加盟系統費用的詐欺套路。'
  },
  {
    regex: /(?:Signal|Telegram|テレグラム|シグナル)(?:でのやり取り|で連絡)/,
    severity: 'CRITICAL',
    title: '導流高隱私通訊軟體',
    explanation: '不使用正規公司郵件，要求使用具自動銷毀訊息功能的 Telegram / Signal 聯繫，是犯罪集團標準手法。'
  }
];

// 5. Indeed & LinkedIn 專屬風險特徵
export const PLATFORM_SPECIFIC_PATTERNS: PatternItem[] = [
  {
    regex: /(?:急募！?|至急募集|今すぐ働ける)/,
    severity: 'INFO',
    title: 'Indeed 常見「急募」標籤',
    explanation: '在 Indeed 上常被用作爭取搜尋曝光的長設標籤。若發布已久仍寫急募，需警惕為常態幽靈缺。'
  },
  {
    regex: /(?:掲載元[：:]\s*(?:派遣|紹介|エージェント)|求人広告主[：:]\s*株式会社)/,
    severity: 'MEDIUM',
    title: '非企業直接招募 (仲介/派遣轉載)',
    explanation: '職缺由外部代理公司代貼，可能存在誘餌職缺 (おとり求人) 或不同仲介重複洗版。'
  },
  {
    regex: /(?:社名非公開|Confidential|大手外資系企業\s*[\(（]社名非公開[\)）]?)/,
    severity: 'MEDIUM',
    title: 'LinkedIn / 獵頭「社名非公開」職缺',
    explanation: '獵頭為保護職缺專屬性或釣取履歷而不公開真實企業名。投遞前無法在 OpenWork 進行任何背景調查。'
  },
  {
    regex: /(?:通年採用|通年募集|オープンポジション|ポジションオープン)/,
    severity: 'INFO',
    title: '通年招募 (常態人才庫)',
    explanation: '企業為長期收集履歷而開設的通用職位，通常沒有明確招募人數與到職期限，錄取標準漂浮。'
  }
];

// 執行文字全維度黑心與詐騙掃描
export function scanJapanJobScams(title: string, description: string, salaryText: string = ''): ScamHit[] {
  const fullText = `${title} ${description} ${salaryText}`.trim();
  const hits: ScamHit[] = [];

  // 1. みなし残業
  const zangyo = analyzeMinashiZangyo(fullText);
  if (zangyo.found) {
    hits.push({
      category: 'minashi_zangyo',
      categoryLabel: '固定加班 (みなし残業)',
      pattern: zangyo.details || '',
      matchedText: zangyo.details || '',
      severity: zangyo.isExcessive ? 'HIGH' : 'MEDIUM',
      title: zangyo.isExcessive ? 'みなし残業超標警告 (>=45H)' : '含固定加班費 (需核對工時)',
      explanation: zangyo.legalWarning || '薪資中已包含固定超時津貼，請換算實際扣除後底薪。',
      legalRisk: zangyo.legalWarning,
    });
  }

  // 2. SES
  for (const item of SES_PATTERNS) {
    const match = fullText.match(item.regex);
    if (match) {
      hits.push({
        category: 'ses_decoy',
        categoryLabel: 'SES 客先常駐 / 釣魚疑慮',
        pattern: item.regex.source,
        matchedText: match[0],
        severity: item.severity,
        title: item.title,
        explanation: item.explanation,
        legalRisk: item.legalRisk,
      });
    }
  }

  // 3. Black Company
  for (const item of BLACK_COMPANY_PATTERNS) {
    const match = fullText.match(item.regex);
    if (match) {
      hits.push({
        category: 'black_company',
        categoryLabel: '黑心特徵 / 精神論',
        pattern: item.regex.source,
        matchedText: match[0],
        severity: item.severity,
        title: item.title,
        explanation: item.explanation,
        legalRisk: item.legalRisk,
      });
    }
  }

  // 4. Yami Baito / Scam
  for (const item of YAMI_BAITO_PATTERNS) {
    const match = fullText.match(item.regex);
    if (match) {
      hits.push({
        category: 'yami_baito',
        categoryLabel: '詐騙 / 闇バイト違法風險',
        pattern: item.regex.source,
        matchedText: match[0],
        severity: item.severity,
        title: item.title,
        explanation: item.explanation,
        legalRisk: item.legalRisk,
      });
    }
  }

  // 5. Platform specific (Indeed / LinkedIn)
  for (const item of PLATFORM_SPECIFIC_PATTERNS) {
    const match = fullText.match(item.regex);
    if (match) {
      hits.push({
        category: 'platform_trap',
        categoryLabel: '平台特有標記',
        pattern: item.regex.source,
        matchedText: match[0],
        severity: item.severity,
        title: item.title,
        explanation: item.explanation,
      });
    }
  }

  return hits;
}
