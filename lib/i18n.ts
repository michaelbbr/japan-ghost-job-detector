export type Language = 'zh' | 'ja';

export const I18N = {
  zh: {
    appTitle: 'Ghost Job Radar',
    versionBadge: '日本版 v2.0',
    appSubtitle: '日本求職防坑雷達・專治 Indeed/LinkedIn/Green/doda/Hello Work 幽靈與釣魚職缺',
    guideBtn: '日本求職指南',
    singleBtn: '單筆文字診斷',
    demoBtn: '重載 Demo 範例',
    heroTag: '🛡️ 日本專用求職避雷演算法 • 參考 Farhan89082 與 fansia 架構',
    heroTitle: '在投出履歷前，看清日本求職網上的「幽靈與釣魚職缺」',
    heroDesc:
      '全面支援 Indeed Japan、LinkedIn、Green、Wantedly、doda、Hello Work。深度檢驗日本企業正規 ATS 採用系統、自動破解みなし残業（固定加班）數字障眼法、識別 SES 客先常駐偽裝與アットホーム黑心精神論。',
    urlInputPlaceholder: '貼上日本職缺網址 (例如 Indeed, LinkedIn, Green, doda, Wantedly 或企業採用頁面)...',
    urlAnalyzeBtn: '一鍵抓取並評估 🚀',
    urlAnalyzing: '正在抓取分析中...',
    uploadCsvBtn: '上傳日文 CSV 批次檢測',
    pasteTextBtn: '貼上職缺文字診斷',
    downloadSampleBtn: '下載範例 CSV',
    viewGuideBtn: '看日本都啥求職 (完整導覽)',

    // Spotlight & Demo Toggles
    spotlightTitle: '🎯 您剛診斷的日本職缺即時分析報告',
    spotlightSubtitle: '已為您自動拆解薪資條款、固定加班、客先常駐與採用系統驗證',
    spotlightChecklist: '🛡️ 建議求職者立即採取的防坑行動：',
    spotlightClose: '關閉此報告',
    demoToggleExpand: '📂 展開日本求職市場常見陷阱對比範例 (10筆) ▾',
    demoToggleCollapse: '📁 收合參考範例 (專注檢視您的職缺) ▴',
    demoDescription: '系統內建 10 筆日本真實市場對比案例（涵蓋 Mercari 官方直招、Indeed 派遣洗版、45H+固定殘業黑心企業、Hello Work 假缺等）',

    // Summary stats
    summaryTitle: '批次分析統計數據總覽',
    summarySubtitle: (count: number) => `共檢測 ${count} 筆日本職缺，採多維度企業招募與勞動法規交叉驗證`,
    avgScoreLabel: '平均幽靈風險指數',
    overallHigh: '整體偏高',
    overallMed: '中度警戒',
    overallLow: '多數正規',
    statHighRisk: '高風險/釣魚',
    statHighRiskDesc: '需審慎避開之職缺',
    statSuspicious: '存疑待查',
    statSuspiciousDesc: '存在單項或多項疑點',
    statSafe: '正規真實',
    statSafeDesc: '官方直招/正規條款',
    statMinashi: '固定加班',
    statMinashiDesc: '含超時加班費條款',
    statScam: '精神論/誘餌',
    statScamDesc: '觸發家庭溫馨/SES等',
    statDuplicates: '洗版/重貼',
    statDuplicatesDesc: '同職缺重複洗版重貼',

    // Filter bar
    searchPlaceholder: '搜尋職缺名稱、企業名稱、工作地點或關鍵字 (如: メルカリ, SES, 未経験, 残業)...',
    sortLabel: '排序：',
    sortScoreDesc: '幽靈風險：由高至低 ⬇',
    sortScoreAsc: '幽靈風險：由低至高 ⬆',
    sortDateDesc: '刊登日期：最新發布 ⬇',
    sortDateAsc: '刊登日期：滯留最久 ⬆',
    filterAll: '全部顯示',
    filterHigh: '高風險/釣魚',
    filterSuspicious: '存疑待查',
    filterSafe: '正規安全',
    filterMinashi: '含みなし残業',
    filterBlack: '黑心/精神論/SES',
    filterDupe: '重複洗版/重貼',
    showingCount: (count: number) => `顯示 ${count} 筆`,

    // Job card
    postedOn: (date: string) => `📅 刊登：${date}`,
    ghostScoreLabel: '幽靈風險評分',
    confidenceLabel: '信心度',
    batchDuplicateWarning: (count: number) =>
      `批次洗版注意：本職缺在您的分析清單中完全重複出現 ${count} 次。常見於不同派遣仲介公司代貼同一案源。`,
    repostWarning: (count: number) =>
      `常年重貼警示：檢測到同公司以不同刊登日期發布過此職缺（共重貼 ${count} 次）。可能為定期刷點閱之常設人才庫。`,
    keyIndicators: '🔎 核心判定指標：',
    expandDetails: '展開證據抽屜與避雷檢查清單 ▾',
    collapseDetails: '收起詳細分析與證據抽屜 ▴',
    openWorkBtn: 'OpenWork 查評價',
    googleReviewBtn: 'Google 查口碑',
    originalJobBtn: '原職缺/搜尋',
    evidenceTitle: '📋 檢核證據清單 (Evidence Collected)',
    caveatsTitle: '⚠️ 客觀免責說明 (Legitimate Caveats)',
    recommendationsTitle: '🛡️ 日本求職避坑建議行動 (Actionable Checklist)',
    noEvidence: '未取得足夠客觀佐證資料。',
    jobDescTitle: '職缺原始內容摘要：',

    // Educational section
    eduTitle: '為什麼日本企業會刊登幽靈與釣魚職缺？ (なぜ企業はカラ求人を出すのか？)',
    eduSubtitle: '根據日本厚生勞動省勞動市場調查與各大轉職獵頭實務，幽靈職缺背後通常有以下六大動機：',
    eduCard1Title: '儲備人才庫 (Talent Pipeline)',
    eduCard1Desc:
      '即使當前部門暫無正式 Headcount，大企業仍會長設通年招募（Open Position），將求職者履歷放入儲備庫中。一旦未來有離職或新專案隨時有人選，但當前應徵者往往面臨已讀不回。',
    eduCard2Title: 'SES 人月仲介釣魚 (おとり求人)',
    eduCard2Desc:
      '派遣公司或 SES 在求職網打出「未經驗・月給35萬・自社開發」的好缺。求職者投遞後，仲介便以「該缺剛好額滿」為由，順理成章向求職者推銷客戶端常駐（客先常駐）等高流動率外包缺。',
    eduCard3Title: '申請政府補助金 (助成金維持)',
    eduCard3Desc:
      '在公營 Hello Work 尤為普遍。部分中小企業為了申請日本政府的僱用助成金或符合法定進用比例，必須常年在 Hello Work 登記開缺，即使完全沒有用人預算與計畫也絕不下架。',
    eduCard4Title: '向投資人展示成長性 (PR効果)',
    eduCard4Desc:
      '新創公司與上市企業常在 LinkedIn 或官方網站掛滿各類高階管理與工程職位，向競爭對手、股東與客戶營造「本公司正處於爆炸性擴張階段」的假象，實質上審核門檻設得極高或根本不安排面試。',
    eduCard5Title: 'みなし残業隱匿超長工時',
    eduCard5Desc:
      '表面上開出看似體面的月薪，但其中包了 45~60 小時的固定殘業代。黑心企業以此在求職列表脫穎而出，實際上壓低基礎時薪，並透過精神論壓榨年輕員工。',
    eduCard6Title: '求職搜尋引擎洗版演算法',
    eduCard6Desc:
      'Indeed、求人ボックス等聚合搜尋引擎的排序偏好「近期有更新動作」的職缺。許多人資與仲介每兩週設定自動點擊刷新日期，營造「全新急募」假象，實為長年陳舊缺。',

    // Footer
    footerDisclaimer:
      '本工具提供的幽靈風險指數為基於公開規則之特徵推估，非 100% 絕對定論。投遞前請務必至 OpenWork 與企業官網綜合驗證。',
  },

  ja: {
    appTitle: 'Ghost Job Radar',
    versionBadge: '日本版 v2.0',
    appSubtitle: 'Indeed/LinkedIn/Green/doda/ハローワーク対応・おとり＆カラ求人検知レーダー',
    guideBtn: '日本の転職市場ガイド',
    singleBtn: '求人文を直接診断',
    demoBtn: 'デモ求人を再読込',
    heroTag: '🛡️ 日本特化型 求人リスク検知アルゴリズム • Farhan89082 & fansia 準拠',
    heroTitle: '応募する前に見抜く。日本の「おとり求人・カラ求人・ブラック企業」',
    heroDesc:
      'Indeed Japan、LinkedIn、Green、Wantedly、doda、ハローワークに完全対応。正規採用システム (ATS) 検証、固定残業代（みなし残業）の過重労働リスク判定、SES偽装自社開発、アットホーム精神論を即座に可視化します。',
    urlInputPlaceholder: '求人ページのURLを貼り付け (Indeed, LinkedIn, Green, doda, Wantedly, 企業採用ページ等)...',
    urlAnalyzeBtn: 'URLから自動取得して判定 🚀',
    urlAnalyzing: '取得・解析中...',
    uploadCsvBtn: 'CSV一括インポート',
    pasteTextBtn: '求人テキスト直接診断',
    downloadSampleBtn: 'サンプルCSVダウンロード',
    viewGuideBtn: '日本の求人媒体・仕組みガイド',

    // Spotlight & Demo Toggles
    spotlightTitle: '🎯 直近の求人診断・即時リスク判定レポート',
    spotlightSubtitle: '給与体系、固定残業代、SES客先常駐、ATS正規認証を多角的に解析しました',
    spotlightChecklist: '🛡️ 応募前に確認すべきセーフティアクション：',
    spotlightClose: 'この診断レポートを閉じる',
    demoToggleExpand: '📂 日本の求人リスク参考サンプルを展開 (10件) ▾',
    demoToggleCollapse: '📁 サンプル求人を閉じる (自分の求人に集中) ▴',
    demoDescription: 'Mercari公式採用、Indeed派遣使い回し、固定残業60Hブラック企業、ハローワーク助成金カラ求人等の実例10件',

    // Summary stats
    summaryTitle: '求人分析サマリー・統計ダッシュボード',
    summarySubtitle: (count: number) => `現在 ${count} 件の求人を多角的に判定中（労働基準法・採用実態基準）`,
    avgScoreLabel: '平均ゴーストリスク指数',
    overallHigh: 'リスク高め',
    overallMed: '要注意',
    overallLow: '概ね正規',
    statHighRisk: '高リスク・おとり',
    statHighRiskDesc: '警戒すべき求人',
    statSuspicious: '要確認・疑義あり',
    statSuspiciousDesc: '複数懸念あり',
    statSafe: '正規・実在性高',
    statSafeDesc: '公式直募・明確な条件',
    statMinashi: '固定残業あり',
    statMinashiDesc: 'みなし残業代含む',
    statScam: '精神論・SES誘餌',
    statScamDesc: 'アットホーム等',
    statDuplicates: '多重掲載・再投稿',
    statDuplicatesDesc: '同一案件の使い回し',

    // Filter bar
    searchPlaceholder: '職種、企業名、勤務地、キーワードで検索 (例: メルカリ, SES, 未経験, 残業)...',
    sortLabel: '並び替え：',
    sortScoreDesc: 'ゴースト指数：高い順 ⬇',
    sortScoreAsc: 'ゴースト指数：低い順 ⬆',
    sortDateDesc: '掲載日：新しい順 ⬇',
    sortDateAsc: '掲載日：古い順 ⬆',
    filterAll: 'すべて表示',
    filterHigh: '高リスク・おとり',
    filterSuspicious: '要確認・疑義',
    filterSafe: '正規・安全',
    filterMinashi: 'みなし残業含む',
    filterBlack: 'ブラック・精神論・SES',
    filterDupe: '重複・再掲載',
    showingCount: (count: number) => `${count} 件表示中`,

    // Job card
    postedOn: (date: string) => `📅 掲載日: ${date}`,
    ghostScoreLabel: 'ゴースト指数',
    confidenceLabel: '確信度',
    batchDuplicateWarning: (count: number) =>
      `一括重複検知：この求人はリスト内で ${count} 回重複しています。複数派遣会社による同一案件の使い回し（スパム）の可能性があります。`,
    repostWarning: (count: number) =>
      `再掲載検知：同一企業により掲載日を更新して繰り返し投稿されています（計 ${count} 回）。常時プール枠の可能性があります。`,
    keyIndicators: '🔎 判定根拠・検出シグナル：',
    expandDetails: '証拠ドロワーと確認チェックリストを展開 ▾',
    collapseDetails: '詳細情報を閉じる ▴',
    openWorkBtn: 'OpenWorkで口コミを見る',
    googleReviewBtn: 'Googleで評判検索',
    originalJobBtn: '求人元リンク/検索',
    evidenceTitle: '📋 収集された客観的証拠 (Evidence)',
    caveatsTitle: '⚠️ 正当な例外・免責事項 (Caveats)',
    recommendationsTitle: '🛡️ 応募前セーフティアクション (Checklist)',
    noEvidence: '十分な客観的証拠が得られませんでした。',
    jobDescTitle: '求人本文抜粋：',

    // Educational section
    eduTitle: 'なぜ企業は「カラ求人」や「おとり求人」を出すのか？',
    eduSubtitle: '厚生労働省の調査および転職市場の実態に基づく、虚偽・幽霊求人の主な6大動機：',
    eduCard1Title: 'タレントプールの確保 (Talent Pipeline)',
    eduCard1Desc:
      '現時点で採用枠がなくても、将来の欠員や新規案件に備えて「通年採用枠（オープンポジション）」を常設し、レジュメを蓄積。応募者は長期放置されがちです。',
    eduCard2Title: 'SESの人月マッチング・おとり求人',
    eduCard2Desc:
      '「未経験歓迎・自社内開発・月給35万」と魅力的な条件で集客し、応募後に「その枠は埋まりました」と偽って客先常駐案件に流す常套手段です。',
    eduCard3Title: '助成金要件の維持 (ハローワーク)',
    eduCard3Desc:
      '雇用関係助成金の申請要件を満たすため、あるいは障害者雇用などの法定基準維持のため、実際には採用する意図がないのに求人を出し続けるケースです。',
    eduCard4Title: '投資家・取引先への成長アピール (PR)',
    eduCard4Desc:
      '求人を出していること自体が「事業が急成長している」という対外的なアピールになるため、採用予定がない役職や多数のポジションを並べる企業があります。',
    eduCard5Title: '固定残業代による長時間労働の隠蔽',
    eduCard5Desc:
      '月給を高く見せつつ45時間〜60時間分の固定残業代を含め、基本給を低く抑える手口。残業代の未払いや過重労働温床になりやすい特徴があります。',
    eduCard6Title: '求人アグリゲーターのアルゴリズム対策',
    eduCard6Desc:
      'Indeed等で上位表示を維持するため、内容を変えずに定期的に更新ボタンを押して「新規急募」に見せかける行為です。',

    // Footer
    footerDisclaimer:
      '本ツールが算出するゴースト指数は公開情報および労働法規に基づく推計値であり、特定の企業の実態を100%断定するものではありません。応募前にOpenWorkや公式採用窓口でご確認ください。',
  },
};
