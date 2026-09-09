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

export interface PatternItem {
  regex: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  titleJa: string;
  explanation: string;
  explanationJa: string;
  legalRisk?: string;
  legalRiskJa?: string;
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

// 2. SES (客先常駐) / 釣魚職缺特徵庫
export const SES_PATTERNS: PatternItem[] = [
  {
    regex: /(?:客先常駐|クライアント先|プロジェクト先|常駐先)(?:での勤務|勤務)?/,
    severity: 'HIGH',
    title: '客先常駐 (SES派遣型)',
    titleJa: '客先常駐 (SES派遣・常駐型)',
    explanation: '工作地點非雇主公司，而是被派遣至客戶端現場（常駐）。技術積累易中斷，經常面臨多重轉包。',
    explanationJa: '勤務先が自社ではなく顧客先現場（客先常駐）です。スキル蓄積が分断されやすく、多重下請け構造のリスクがあります。',
    legalRisk: '需警惕「偽裝請負（假外包真派遣）」違反日本《勞動者派遣法》。',
    legalRiskJa: '実質的な労働者派遣法違反（偽装請負）に注意が必要です。',
  },
  {
    regex: /(?:自社内開発\s*[\(（]?(?:案件による|将来的には|プロジェクトによる)[\)）]?)/,
    severity: 'HIGH',
    title: '偽裝自社開發 (おとり求人)',
    titleJa: '偽装自社開発（おとり求人の疑い）',
    explanation: '標題或宣傳宣稱「自社開發」，但在備註卻寫「視專案而定/未來轉入」，實際 90% 以上是外派 SES 的常見話術。',
    explanationJa: '自社開発を謳いながら備考に「プロジェクトによる」「案件次第」と記載されており、実態は客先常駐SESの常套文句です。',
    legalRisk: '涉嫌廣告不實（誇大招募廣告）。',
    legalRiskJa: '優良誤認表示（誇大求人広告）の疑いがあります。',
  },
  {
    regex: /(?:未経験から(?:IT|WEB|システム)?エンジニア|研修期間中(?:は|も)給与支給|未経験歓迎.{0,20}月給\s*(?:3[0-9]|4[0-9]|5[0-9])万)/,
    severity: 'HIGH',
    title: '未經驗高薪工程師釣魚',
    titleJa: '未経験・高給エンジニア（おとり誘導）',
    explanation: '開出未經驗即可享高薪的誘餌，入社後通常先要求從事客服家電行外包或無技術門檻的打雜常駐，無法獲得預期技術經驗。',
    explanationJa: '未経験から高月給を謳い集客し、実際は家電量販店やコールセンター等の非IT現場に常駐させるリスクがあります。',
  },
  {
    regex: /(?:還元率\s*(?:70|75|80|85|90)[\%％]|高還元SES|案件選択制)/,
    severity: 'MEDIUM',
    title: '高還元率 SES 特徵',
    titleJa: '高還元SES特有の訴求',
    explanation: '強調工程師分潤比例高與案件自選，雖比傳統 SES 透明，但本質仍為單兵外派，公司通常不提供職涯輔導與培育。',
    explanationJa: '還元率や案件選択制をアピールしていますが、単価連動型のため待機時の減給や自己責任リスクが伴います。',
  },
  {
    regex: /(?:案件多数|取引先\s*\d{2,}社|待機期間も給与全額)/,
    severity: 'MEDIUM',
    title: '典型派遣池 (Talent Pool) 話術',
    titleJa: '案件多数・アサインプール型',
    explanation: '強調案件數量龐大或空窗期全薪，代表公司依賴快速配對賺取人月差價。',
    explanationJa: '「案件多数」で集客し、決まり次第案件に流す人月マッチングの典型文句です。',
  },
];

// 3. 黑心企業 (ブラック企業) / 精神論 / やりがい搾取 語錄特徵庫
export const BLACK_COMPANY_PATTERNS: PatternItem[] = [
  {
    regex: /(?:アットホームな(?:職場|会社|環境)|アットホームで家族のような)/,
    severity: 'HIGH',
    title: 'アットホームな職場 (家庭式溫馨陷阱)',
    titleJa: 'アットホームな職場（家族的経営・労務境界の曖昧化）',
    explanation: '日本求職界著名的「黑心警示詞第一名」。表面是人際關係親近，實質上經常意味著缺乏公私界線、無償加班、情緒勒索與缺乏正規人資制度。',
    explanationJa: '日本で最も警戒される求人ワード。「家族的」「アットホーム」は労務管理の甘さ、サービス残業、情による拘束の隠れ蓑になりがちです。',
    legalRisk: '常伴隨無償加班、情緒勒索與缺乏正規出勤考勤紀錄。',
    legalRiskJa: 'サービス残業や勤怠管理の不徹底につながりやすいです。',
  },
  {
    regex: /(?:やりがい搾取|夢を叶える|感動を共有|情熱を持って|熱い想い)/,
    severity: 'HIGH',
    title: 'やりがい搾取 (熱情搾取・精神論)',
    titleJa: 'やりがい搾取（感動・夢・精神論）',
    explanation: '以「自我成長、感動、夢想」包裝低工資與長工時，忽略客觀勞動報酬與勞工福利。',
    explanationJa: '「成長」「感動」「夢」などの抽象的ワードで低賃金や過重労働を正当化する精神論的アプローチです。',
  },
  {
    regex: /(?:若手が活躍|平均年齢\s*(?:2[0-5])歳|若手中心)/,
    severity: 'MEDIUM',
    title: '員工平均年齡過低 (異常流動率)',
    titleJa: '若手中心・平均年齢が極端に低い（使い捨ての疑い）',
    explanation: '若非剛成立的新創，員工平均年齡僅 20 代前半且主管皆年輕，通常意味著 30 歲以上的資深員工全數離職，公司流動率極高（免洗筷企業）。',
    explanationJa: '平均年齢20代前半や若手中心は、30歳前後のベテランが定着できず早期離職が常態化している典型例です。',
  },
  {
    regex: /(?:裁量労働制.{0,30}(?:残業代なし|定時なし|未経験))/,
    severity: 'HIGH',
    title: '濫用裁量勞動制',
    titleJa: '裁量労働制の不適正適用',
    explanation: '將原本僅適用於高度專業研發人員的「專門業務型裁量勞動制」套用在一般或未經驗職缺上，以規避超時加班費發放。',
    explanationJa: '高度な専門業務以外に裁量労働制を適用し、時間外労働手当を免れようとする違法リスクがあります。',
    legalRisk: '涉嫌違反日本《勞動基準法》第38條之3。',
    legalRiskJa: '労基法違反（固定残業・裁量労働の脱法適用）の疑い。',
  },
  {
    regex: /(?:面接1回のみ|即日内定|即日採用|履歴書不要|書類選考なし)/,
    severity: 'HIGH',
    title: '極度缺乏篩選門檻 (免洗即戰力)',
    titleJa: '面接1回・即日採用（大量離職・採用急迫）',
    explanation: '無須書面審查、面試僅 1 次甚至當天內定，代表職位人員缺口極度危急或離職率極端驚人，來者不拒。',
    explanationJa: '書類選考なし、面接1回即決は深刻な人手不足や高離職率による使い捨て採用の可能性があります。',
  },
  {
    regex: /(?:幹部候補.{0,15}未経験|未経験から即月給\s*(?:35|40|50)万)/,
    severity: 'HIGH',
    title: '未經驗幹部候補 (高離職率業務坑)',
    titleJa: '未経験から幹部候補（使い捨て営業）',
    explanation: '多見於不動產電話推銷、連鎖餐飲或保險直銷，以光鮮亮麗的「幹部」頭銜掩飾高壓淘汰制。',
    explanationJa: '不動産テレアポや外食等で、肩書で釣って過酷なノルマを課す高離職率職種によく見られます。',
  },
  {
    regex: /(?:試用期間中は(?:契約社員|業務委託|アルバイト)|試用期間中の給与半減)/,
    severity: 'CRITICAL',
    title: '試用期契約降級違法風險',
    titleJa: '試用期間中の契約社員降格リスク',
    explanation: '宣稱正社員採用，但試用期間偷偷降為契約社員或無社會保險的業務委託，極易在試用期滿被隨意解雇。',
    explanationJa: '正社員募集でありながら試用期間中は契約社員や業務委託とする、労働条件の不利益変更・不当解雇リスクです。',
    legalRisk: '違反日本《職業安定法》第5條之3（勞動條件明示義務）。',
    legalRiskJa: '職業安定法第5条の3（労働条件明示義務違反）。',
  },
];

// 4. 闇バイト (黑工・詐騙・違法副業) 特徵庫
export const YAMI_BAITO_PATTERNS: PatternItem[] = [
  {
    regex: /(?:闇バイト|裏バイト|ホワイト案件|高額バイト.{0,15}即日現金)/,
    severity: 'CRITICAL',
    title: '闇バイト (黑工/犯罪募集嫌疑)',
    titleJa: '闇バイト・犯罪実行者募集の疑い',
    explanation: '利用「ホワイト案件（宣稱合法無風險）」等反常字眼招募從事強盜、提款車手或詐騙活動。',
    explanationJa: '「ホワイト案件」「即日現金」等の文句で強盗や受け子などの犯罪行為に加担させる極めて危険な募集です。',
    legalRisk: '涉及刑事重大犯罪，絕不可投遞！',
    legalRiskJa: '重大犯罪に問われ、逮捕・実刑となる絶対回避案件。',
  },
  {
    regex: /(?:荷物(?:の)?(?:受取|受け取り|転送)|荷物転送業務|届いた荷物を)/,
    severity: 'CRITICAL',
    title: '轉送詐騙 / 洗錢代收包裹',
    titleJa: '荷物受取・転送詐欺（不正送金・マネロン関与）',
    explanation: '要求應徵者在家接收包裹並轉寄至指定地址，實際為使用被盜刷信用卡購買之贓物或違禁品洗錢。',
    explanationJa: '自宅に届いた荷物を転送するだけで報酬を得る手口。不正入手商品の換金に利用される犯罪です。',
  },
  {
    regex: /(?:口座(?:開設|売買|提供)|名義貸し|SIMカード(?:契約|送付))/,
    severity: 'CRITICAL',
    title: '買賣人頭帳戶 / 名義借出',
    titleJa: '銀行口座売買・名義貸し（犯罪収益移転防止法違反）',
    explanation: '要求開設或提供銀行帳戶、門號 SIM 卡，在日本為觸犯《犯罪收益轉移防止法》之嚴重刑事罪行！',
    explanationJa: '口座やSIMカードの提供を求める違法行為。法的処罰の対象となります。',
  },
  {
    regex: /(?:スマホ1台で|コピペするだけ|誰でも月収\s*(?:50|100)万|初期費用|マニュアル購入)/,
    severity: 'HIGH',
    title: '情報商材 / 虛假副業詐欺',
    titleJa: '情報商材・初期費用請求型の副業詐欺',
    explanation: '宣稱無門檻躺賺，應徵後要求購買高額教材或繳納加盟系統費用的詐欺套路。',
    explanationJa: '「誰でも月収〇〇万」と謳い、応募後に高額マニュアルやツール購入を強制する詐欺手口です。',
  },
  {
    regex: /(?:Signal|Telegram|テレグラム|シグナル)(?:でのやり取り|で連絡)/,
    severity: 'CRITICAL',
    title: '導流高隱私通訊軟體',
    titleJa: 'Telegram/Signal等への誘導',
    explanation: '不使用正規公司郵件，要求使用具自動銷毀訊息功能的 Telegram / Signal 聯繫，是犯罪集團標準手法。',
    explanationJa: '証拠隠滅が容易なメッセージアプリへ誘導し、違法指示を行う犯罪グループの手口です。',
  },
];

// 5. Indeed & LinkedIn 專屬風險特徵
export const PLATFORM_SPECIFIC_PATTERNS: PatternItem[] = [
  {
    regex: /(?:急募！?|至急募集|今すぐ働ける)/,
    severity: 'INFO',
    title: 'Indeed 常見「急募」標籤',
    titleJa: '急募タグ・露出狙い',
    explanation: '在 Indeed 上常被用作爭取搜尋曝光的長設標籤。若發布已久仍寫急募，需警惕為常態幽靈缺。',
    explanationJa: 'Indeed等の検索順位を上げるための常設急募タグ。長期放置求人の可能性があります。',
  },
  {
    regex: /(?:掲載元[：:]\s*(?:派遣|紹介|エージェント)|求人広告主[：:]\s*株式会社)/,
    severity: 'MEDIUM',
    title: '非企業直接招募 (仲介/派遣轉載)',
    titleJa: '掲載元が派遣・紹介会社（代理投稿）',
    explanation: '職缺由外部代理公司代貼，可能存在誘餌職缺 (おとり求人) 或不同仲介重複洗版。',
    explanationJa: '派遣・エージェントによる案件使い回しやおとり求人のリスクがあります。',
  },
  {
    regex: /(?:社名非公開|Confidential|大手外資系企業\s*[\(（]社名非公開[\)）]?)/,
    severity: 'MEDIUM',
    title: 'LinkedIn / 獵頭「社名非公開」職缺',
    titleJa: '社名非公開求人（コンフィデンシャル）',
    explanation: '獵頭為保護職缺專屬性或釣取履歷而不公開真實企業名。投遞前無法在 OpenWork 進行任何背景調查。',
    explanationJa: '企業名が伏せられており、応募前にOpenWorkや公式情報の事前調査が不可能です。',
  },
  {
    regex: /(?:通年採用|通年募集|オープンポジション|ポジションオープン)/,
    severity: 'INFO',
    title: '通年招募 (常態人才庫)',
    titleJa: '通年採用・オープンポジション（タレントプール）',
    explanation: '企業為長期收集履歷而開設的通用職位，通常沒有明確招募人數與到職期限，錄取標準漂浮。',
    explanationJa: '明確な採用枠がなく、将来の候補者プールとして常設されているため、選考が形骸化しやすいです。',
  },
];

// 執行文字全維度黑心與詐騙掃描
export function scanJapanJobScams(
  title: string,
  description: string,
  salaryText: string = '',
  lang: 'zh' | 'ja' = 'zh'
): ScamHit[] {
  const fullText = `${title} ${description} ${salaryText}`.trim();
  const hits: ScamHit[] = [];
  const isJa = lang === 'ja';

  // 1. みなし残業
  const zangyo = analyzeMinashiZangyo(fullText);
  if (zangyo.found) {
    hits.push({
      category: 'minashi_zangyo',
      categoryLabel: isJa ? '固定残業代（みなし残業）' : '固定加班 (みなし残業)',
      pattern: zangyo.details || '',
      matchedText: zangyo.details || '',
      severity: zangyo.isExcessive ? 'HIGH' : 'MEDIUM',
      title: isJa
        ? (zangyo.isExcessive ? '固定残業代が過大 (月45H以上・過労死ライン)' : '固定残業代制あり (実労働時間要確認)')
        : (zangyo.isExcessive ? 'みなし残業超標警告 (>=45H)' : '含固定加班費 (需核對工時)'),
      explanation: isJa
        ? (zangyo.legalWarning || '給与に一定時間の定額残業手当が含まれています。超過分の追加支給があるか確認が必要です。')
        : (zangyo.legalWarning || '薪資中已包含固定超時津貼，請換算實際扣除後底薪。'),
      legalRisk: zangyo.legalWarning,
    });
  }

  // Helper
  const checkPatterns = (
    patterns: PatternItem[],
    category: ScamHit['category'],
    categoryLabelZh: string,
    categoryLabelJa: string
  ) => {
    for (const item of patterns) {
      const match = fullText.match(item.regex);
      if (match) {
        hits.push({
          category,
          categoryLabel: isJa ? categoryLabelJa : categoryLabelZh,
          pattern: item.regex.source,
          matchedText: match[0],
          severity: item.severity,
          title: isJa ? item.titleJa : item.title,
          explanation: isJa ? item.explanationJa : item.explanation,
          legalRisk: isJa ? item.legalRiskJa : item.legalRisk,
        });
      }
    }
  };

  checkPatterns(SES_PATTERNS, 'ses_decoy', 'SES 客先常駐 / 釣魚疑慮', 'SES客先常駐・おとり');
  checkPatterns(BLACK_COMPANY_PATTERNS, 'black_company', '黑心特徵 / 精神論', 'ブラック企業・精神論');
  checkPatterns(YAMI_BAITO_PATTERNS, 'yami_baito', '詐騙 / 闇バイト違法風險', '闇バイト・違法副業');
  checkPatterns(PLATFORM_SPECIFIC_PATTERNS, 'platform_trap', '求職網站特有標記', '媒体特有タグ・急募');

  return hits;
}
