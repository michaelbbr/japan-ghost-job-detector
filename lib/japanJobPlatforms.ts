export interface JapanPlatformInfo {
  id: string;
  name: string;
  japaneseName: string;
  category: 'aggregator' | 'global_highclass' | 'it_tech' | 'mid_career' | 'new_grad' | 'public' | 'review_site';
  categoryLabel: string;
  url: string;
  domain: string;
  description: string;
  pros: string[];
  cons: string[];
  ghostJobRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  ghostJobRiskReason: string;
  typicalGhostPatterns: string[];
  tipsForSeekers: string[];
  color: string;
}

export const JAPAN_JOB_PLATFORMS: JapanPlatformInfo[] = [
  {
    id: 'indeed_jp',
    name: 'Indeed Japan',
    japaneseName: 'インディード 日本',
    category: 'aggregator',
    categoryLabel: '聚合搜尋引擎 (流量龍頭)',
    url: 'https://jp.indeed.com',
    domain: 'indeed.com',
    description: '由日本瑞可利集團 (Recruit Holdings) 營運，是日本流量最大、涵蓋最廣的求職搜尋引擎。自動爬取全日本官方徵才頁面與各家人力仲介網，亦支援企業直接刊登。',
    pros: [
      '職缺數量全日本第一，從兼職、派遣到外商工程師一應俱全',
      '直接搜尋全日本企業官網，無須逐一註冊各家人力銀行',
      '薪資透明度篩選器與使用者評論功能'
    ],
    cons: [
      '搜尋引擎爬蟲常收錄過期、已關閉的無效死鏈',
      '派遣公司與仲介大量「洗版複製貼上」同一職缺',
      '審核門檻低，充斥「急募」但一年365天都不關閉的幽靈缺'
    ],
    ghostJobRiskLevel: 'HIGH',
    ghostJobRiskReason: '全網爬蟲自動彙整，加上大量人力仲介業者用誘餌缺洗版，使 Indeed 成為幽靈與重複職缺好發率最高的平台。',
    typicalGhostPatterns: [
      '「急募」標籤長達數月至一年從未下架',
      '同一職缺被 5~10 家不同的派遣/仲介公司換皮重複刊登',
      '點擊應徵後跳轉到第三方外部已關閉頁面 (HTTP 404/職缺結束)'
    ],
    tipsForSeekers: [
      '務必過濾「掲載元：企業直接」而非「人材紹介/派遣会社」',
      '看到感興趣的職缺，複製公司名與職稱到該公司官網 (採用サイト) 確認是否真有開缺',
      '注意刊登日期，超過 30 天以上且帶「急募」字樣多半是常年掛牌'
    ],
    color: '#003A9B'
  },
  {
    id: 'linkedin_jp',
    name: 'LinkedIn Japan',
    japaneseName: 'リンクトイン 日本',
    category: 'global_highclass',
    categoryLabel: '外商 / 雙語 / 全球高階',
    url: 'https://www.linkedin.com/jobs',
    domain: 'linkedin.com',
    description: '在日外商 (GAFAM、外資顧問、金融機構) 與日本國際化頂尖科技公司 (Mercari, 樂天, LINEヤフー, Sony 等) 的求職轉職核心陣地。主要由企業 Recruiter 與獵頭主動搜尋人選。',
    pros: [
      '在日外商與海外直聘職缺集中度最高，全英語/雙語環境多',
      '可直接查看招聘人資 (Hiring Manager / Recruiter) 的個人檔案並發訊息',
      '透明展示應徵人數與求職者學經歷分佈'
    ],
    cons: [
      '大企業常年掛付費推廣職缺 (Promoted) 作為雇主品牌行銷',
      '很多職缺顯示「Over 100 applicants」但每個月定時自動 Repost，屬於常態人才池',
      '外部獵頭經常刊登「Confidential (公司名稱保密)」的假缺以釣求職者履歷'
    ],
    ghostJobRiskLevel: 'MEDIUM',
    ghostJobRiskReason: '外商與大企業常用於維護 Talent Pipeline (儲備人才庫) 與品牌形象，並非每個刊登中的職缺都有立即 Headcount。',
    typicalGhostPatterns: [
      '「Promoted / 贊助」職缺顯示數百人應徵，卻連續 6 個月不斷 Repost',
      '獵頭發布「大手外資系IT企業・年収1500万」但完全不透露公司名，投遞後被推銷其他缺',
      '跳轉至 Workday / Greenhouse ATS 官網時發現職缺代碼已過期失效'
    ],
    tipsForSeekers: [
      '若有 Easy Apply，優先尋找有附帶招聘主管 (Posted by) 的職缺並主動 InMail 寒暄',
      '檢查跳轉的官方 ATS (Greenhouse, Workday, Lever) 是否真實開放',
      '對「Confidential」且要求先繳履歷的獵頭職缺保持警覺'
    ],
    color: '#0A66C2'
  },
  {
    id: 'green',
    name: 'Green (グリーン)',
    japaneseName: 'Green (IT・Web業界の転職)',
    category: 'it_tech',
    categoryLabel: 'IT / Web / 新創科技 (日本工程師首選)',
    url: 'https://www.green-japan.com',
    domain: 'green-japan.com',
    description: '由 Atrae 營運，在日本 IT、Web、SaaS、新創圈知名度極高。採用「成功報酬型」收費模式，企業刊登成本低，因此新創與中小型科技公司的職缺極其豐富。',
    pros: [
      '日本 Web 新創與自社開發產品公司聚集度最高',
      '支援「気になる (感興趣)」互通心意再面試，配對效率高',
      '職缺頁面直接展示辦公室照片、團隊成員背景與技術棧'
    ],
    cons: [
      '大量 SES (客先常駐派遣) 公司偽裝成「自社開發」或「受託開發」混雜其中',
      '企業刊登免費或門檻低，常有公司掛著缺收集履歷卻極少回覆',
      '未標註精確固定加班時數 (みなし残業) 的情況偶有發生'
    ],
    ghostJobRiskLevel: 'MEDIUM',
    ghostJobRiskReason: '刊登成本低導致部分企業掛牌收集履歷；且 SES 釣魚（おとり求人）常偽裝自社開發。',
    typicalGhostPatterns: [
      '標榜「自社內開發 100%」，面試時卻改口「入社前幾年先去客戶端常駐歷練」',
      '職缺長達一年以上每週自動更新時間戳，實際上從不發面試邀約',
      '開出「未經驗年薪500萬」的工程師職缺作為吸引人選的誘餌'
    ],
    tipsForSeekers: [
      '仔細檢查「勤務地」是否寫「本社または東京都内のプロジェクト先」(後者 99% 是客先常駐)',
      '看公司的員工數 vs 資本額 vs 辦公室大小，比對是否為 SES 仲介公司',
      '投遞前先在 OpenWork 查詢該公司的真實工作型態'
    ],
    color: '#00B06B'
  },
  {
    id: 'wantedly',
    name: 'Wantedly',
    japaneseName: 'ウォンテッドリー',
    category: 'it_tech',
    categoryLabel: '理念共感 / 新創社交招聘',
    url: 'https://www.wantedly.com',
    domain: 'wantedly.com',
    description: '強調「シゴトでココロオドル人をふやす (讓工作讓人心潮澎湃)」，主打「理念共感」與「カジュアル面談 (輕鬆聊聊)」。平台規定不得在職缺首頁直接標註薪資與福利。',
    pros: [
      '新創、自社開發、設計師、產品經理的最愛',
      '無須準備傳統繁瑣的「職務經歷書」，先以輕鬆喝咖啡聊聊起步',
      '可深入了解創辦人理念、企業文化與團隊活躍度'
    ],
    cons: [
      '許多公司將 Wantedly 當作公關宣傳 (PR) 工具，常年掛著職缺展現活躍度但無 Headcount',
      '法規禁止標薪資，導致求職者聊到最後才發現薪資遠低於市場行情',
      '「やりがい搾取 (熱情搾取)」與「アットホーム」等黑心語氣重災區'
    ],
    ghostJobRiskLevel: 'HIGH',
    ghostJobRiskReason: '官方設計就是「輕量交流」，大量企業在此常設「通年募集 / オープンポジション」僅為建立人才庫或做企業宣傳，幽靈率極高。',
    typicalGhostPatterns: [
      '「まずは気軽にオフィスに遊びに来てください」掛了兩年，點擊後已讀不回',
      '聊完相談甚歡後，人資表示「目前暫無正式空缺，未來有合適專案會再聯絡」',
      '充滿熱血激昂夢想辭藻，卻完全迴避勞動合約型態與具體責任'
    ],
    tipsForSeekers: [
      '抱持「擴展業界人脈 / 做企業調研」的心態使用，不要將其當作急迫求職主力',
      '在カジュアル面談的第二階段務必主動問清楚雇用形態 (正社員 vs 業務委託) 與薪資區間',
      '觀察公司在 Wantedly 的「Story (記事)」更新頻率，若半年沒更新代表帳號已荒廢'
    ],
    color: '#00A4DE'
  },
  {
    id: 'doda',
    name: 'doda (デューダ)',
    japaneseName: 'doda (パーソルキャリア)',
    category: 'mid_career',
    categoryLabel: '中途轉職綜合龍頭 (求人網 + 獵頭代理)',
    url: 'https://doda.jp',
    domain: 'doda.jp',
    description: '日本第二大人力資源巨頭 PERSOL 旗下核心轉職品牌。擁有龐大的企業資料庫，整合「求職者直接應徵」與「專屬職涯顧問 (Agent) 推薦」雙軌制。',
    pros: [
      '全行業中途職缺極為齊全，傳統大企業、上市企業、外商均有覆蓋',
      '專業顧問提供免費修改日文履歷 (履歴書・職務経歴書) 與模擬面試服務',
      '求人票格式非常嚴謹，法律規定的勞動條件與固定加班費註記詳細'
    ],
    cons: [
      '仲介業務為了業績，常推銷容易成交但流動率高的職缺',
      '存在「おとり求人」現象：仲介拿優質空缺吸引求職者註冊面談，見面後推銷其他難招職缺',
      '信箱會收到大量系統自動發送的「求人紹介」垃圾郵件'
    ],
    ghostJobRiskLevel: 'MEDIUM',
    ghostJobRiskReason: '職缺多經過審查，純粹的假職缺較少；但仲介持有的「非公開求人」中常有已招滿未即時清理的殘留職缺。',
    typicalGhostPatterns: [
      '投遞後仲介來電告知「該缺剛剛結束招募，不過依您的資歷，我們推薦這幾間公司…」',
      '求人票備註「本職缺為派遣/紹介預定職缺」，實際雇主並非標題所寫企業',
      '常年刊登的營業職與施工管理職，離職率極高導致常年掛缺'
    ],
    tipsForSeekers: [
      '確認是「直接応募 (自己投遞企業)」還是「エージェントサービス (仲介代投)」',
      '如果仲介強烈說服你去某間公司，務必堅持先查閱該公司在 OpenWork 的真實評價',
      '詳細看求人票底部的「固定残業手当の時間数」，超過 45 小時須高度謹慎'
    ],
    color: '#006DB8'
  },
  {
    id: 'rikunabi_next',
    name: 'Rikunabi NEXT',
    japaneseName: 'リクナビNEXT (リクルート)',
    category: 'mid_career',
    categoryLabel: '日本最大中途採用網 (Recruit 旗下)',
    url: 'https://next.rikunabi.com',
    domain: 'rikunabi.com',
    description: '日本最大人力集團 Recruit 旗下的中途轉職網站。在日本求職者中知名度與註冊數常年位居榜首，中小型企業到大型跨國企業皆會刊登。',
    pros: [
      '職缺數與產業跨度極廣，地方都市與傳統製造業職缺豐富',
      '強大的「スカウト (企業主動選才)」功能與 AI 診斷推薦',
      '求人票規格標準化，各項保險與退休金制度標示清楚'
    ],
    cons: [
      '大量「急募」實為高流動率免洗職缺 (不動產仲介、保險業務、飲食連鎖)',
      '中小企業刊登費用包月，常有一期兩週不斷續約重貼的長期幽靈缺',
      '獵頭發送大量罐頭信件，難以區分真偽'
    ],
    ghostJobRiskLevel: 'MEDIUM',
    ghostJobRiskReason: '商業付費刊登，純假職缺違約成本高；但大量企業長期包月續約掛缺，人資僅作消極審查。',
    typicalGhostPatterns: [
      '標記「未経験から月給35万円」「アットホームな職場で急成長！」',
      '同一公司同一職位連續在排行榜前列停留超過一年',
      '企業信箱收到履歷後長期放置，超過一個月無任何通知'
    ],
    tipsForSeekers: [
      '利用「新着求人 (最新刊登)」篩選最近 1~2 週內首次刊登的職缺',
      '對「大量採用 (10名以上募集)」且條件極寬鬆的職缺保持懷疑態度',
      '檢查面試流程是否寫「面接1回のみ・即決」，通常代表急需即戰力免洗人力'
    ],
    color: '#E60012'
  },
  {
    id: 'bizreach',
    name: 'BizReach (ビズリーチ)',
    japaneseName: 'ビズリーチ (Visional)',
    category: 'global_highclass',
    categoryLabel: '高端轉職 / 獵頭與企業直接 Scout',
    url: 'https://www.bizreach.jp',
    domain: 'bizreach.jp',
    description: '日本會員制高階轉職平台的開創者。主打年薪 600 萬至 2,000 萬日圓以上的管理職、專家職與外商高管職缺。求職者需通過審查，企業與獵頭需付費購買發信點數。',
    pros: [
      '高年薪、高職位、真實度極高，極少低劣垃圾職缺',
      '可收到來自頂尖企業人資主管直接發送的「プラチナスカウト (白金邀請)」',
      '能接觸到市場上完全不公開的機密重組、新事業部招聘'
    ],
    cons: [
      '求職者端進階功能需要月費訂閱 (付費會員制)',
      '外部獵頭為衝業績發送範本獵頭信，將一般職缺包裝成高級職缺',
      '有些職缺屬於長期物色適合接班人選的「長期探索型」，非即時入職'
    ],
    ghostJobRiskLevel: 'LOW',
    ghostJobRiskReason: '發信與刊登成本極高，幾乎沒有廉價詐騙或一般幽靈缺；但獵頭存在收集高級人才儲備池現象。',
    typicalGhostPatterns: [
      '獵頭寄出白金信稱「某上市集團役員候補」，面談後發現該缺早在半年前就已確定人選',
      '企業為了向市場展現「我們正在招募頂級 AI 科學家」而長期高薪掛牌'
    ],
    tipsForSeekers: [
      '認清發信者是「企業直接人事 (Direct)」還是「ヘッドハンター (外部獵頭)」',
      '查詢該獵頭在 BizReach 上的等級 (評分 S / A 級獵頭通常品質較高)',
      '面談時第一時間詢問該職缺設立的背景 (擴張/離職補充/新業務)'
    ],
    color: '#A00000'
  },
  {
    id: 'findy',
    name: 'Findy (ファインディ)',
    japaneseName: 'Findy (エンジニア特化スカウト)',
    category: 'it_tech',
    categoryLabel: '工程師專屬 / GitHub 程式碼解析直接媒合',
    url: 'https://findy-code.io',
    domain: 'findy-code.io',
    description: '專為軟體工程師打造的轉職平台。透過演算法分析求職者的 GitHub 儲存庫輸出「技術偏差值」，企業以此為主動發送「いいね」或面試邀請。',
    pros: [
      '技術取向強烈，企業素質高，鮮少傳統黑心傳產或未經驗誘餌',
      '薪資區間與技術棧 (TypeScript, Go, Rust, AWS 等) 標記清晰透明',
      '省去傳統職務經歷書的八股修辭，以程式碼與技術成果說話'
    ],
    cons: [
      '對沒有公開 GitHub 開源貢獻或作品集的工程師較吃虧',
      '主要集中在東京的 Web / SaaS / 新創領域，傳統大型日企較少',
      '部分熱門企業收到過多配對，回覆速度較慢'
    ],
    ghostJobRiskLevel: 'LOW',
    ghostJobRiskReason: '企業使用費昂貴且專注技術人才，極少假職缺。',
    typicalGhostPatterns: [
      '企業工程主管給了「いいね」後，求職者回覆卻因專案時程延宕未即時安排面談'
    ],
    tipsForSeekers: [
      '將個人 GitHub Profile、使用語言與近期 commit 整理乾淨',
      '注意職缺中說明的「リモート体制 (全遠端 / 混合辦公)」與「副業可否」',
      '可與 Green、LinkedIn 互相搭配使用'
    ],
    color: '#3B82F6'
  },
  {
    id: 'hellowork',
    name: 'Hello Work (ハローワーク)',
    japaneseName: 'ハローワーク (公共職業安定所)',
    category: 'public',
    categoryLabel: '公營就業服務機構 (厚生勞動省)',
    url: 'https://www.hellowork.mhlw.go.jp',
    domain: 'mhlw.go.jp',
    description: '日本政府厚生勞動省運營的公共職業安定所。日本全國皆有據點，為國民提供免費求職介紹與失業給付服務。任何日本合法註冊企業皆可免費刊登。',
    pros: [
      '覆蓋全日本各鄉鎮市區的中小企業與在地工廠',
      '提供失業給付 (雇用保険の基本手当) 資格認定的求職活動證明',
      '公信力強，勞動合約爭議有就業輔導員可諮詢'
    ],
    cons: [
      '免費刊登且審核極度寬鬆，是全日本「カラ求人 (假職缺)」最大重災區',
      '許多企業刊登是為了「申請政府補助款 (如雇用調整助成金)」或符合法規名額，完全無意僱用',
      '求人票上的待遇與實際面試承諾經常出現巨大落差 (如正社員變成契約社員)'
    ],
    ghostJobRiskLevel: 'HIGH',
    ghostJobRiskReason: '企業刊登 0 成本，為取得政府各項助成金必須長年維持刊登紀錄，造成大量純粹的人頭假職缺 (カラ求人)。',
    typicalGhostPatterns: [
      '企業掛缺常年不撤，求職者應徵後以各種極度牽強理由拒絕，只為維持「有在招募」紀錄',
      '求人票寫「月給25萬」，到場試算加上みなし残業後底薪甚至低於東京都最低時薪',
      '「試用期間中は業務委託またはアルバイト扱い (試用期無社保)」等違法條件'
    ],
    tipsForSeekers: [
      '如果不是為了領取失業保險的求職印章，一般轉職請儘量避開 Hello Work',
      '在櫃檯應徵前，務必向輔導員調閱該職缺的「直近の応募者数と採用人数 (應徵與錄取比率)」',
      '如發現錄取數長期為 0 但應徵人數數十人，該缺 100% 為カラ求人！'
    ],
    color: '#10B981'
  },
  {
    id: 'openwork',
    name: 'OpenWork (オープンワーク)',
    japaneseName: 'OpenWork (旧 Vorkers)',
    category: 'review_site',
    categoryLabel: '企業真實評價與避雷 (求職必備工具)',
    url: 'https://www.openwork.jp',
    domain: 'openwork.jp',
    description: '日本最大且公信力最高的企業現職員工/前員工匿名評價網站 (相當於日本版 Glassdoor)。評分涵蓋真實加班時數、實際年薪分佈、升遷風氣與黑心程度。',
    pros: [
      '打破企業求人票的美化謊言，揭露真實「月間平均残業時間」與「有給消化率」',
      '不同年齡層、職種的真實年薪與獎金 (賞与) 一覽無遺',
      '嚴格的審查機制，防止企業人資洗好評'
    ],
    cons: [
      '需撰寫現職心得或付費才能解鎖完整評價閱讀權限',
      '部分離職員工可能帶有個人主觀情緒偏差 (需理性綜合分析)',
      '創業初期未滿 10 人的極小型新創可能缺乏足夠評論樣本'
    ],
    ghostJobRiskLevel: 'LOW',
    ghostJobRiskReason: '本身非求職刊登網站，而是所有求職者在投遞前後必查的驗毒平台。',
    typicalGhostPatterns: [
      '若求人票寫「殘業月 10 小時」，但 OpenWork 顯示「月均殘業 65 小時」，代表求人票極不可信'
    ],
    tipsForSeekers: [
      '投遞任何職缺前，一律先在 OpenWork 搜尋公司名，重點看「20代成長環境」與「待遇の納得感」',
      '若評分低於 3.0 (滿分 5.0)，且殘業時間高於 40h，請做好心理準備或直接放棄',
      '留意評論中是否有提到「求人票の条件と入社後の実態が違った (貨不對板)」'
    ],
    color: '#FF6B00'
  }
];
