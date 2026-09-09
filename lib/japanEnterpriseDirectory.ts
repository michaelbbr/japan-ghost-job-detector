export interface MajorEnterpriseInfo {
  id: string;
  shortName: string;
  formalName: string;
  category: 'apparel' | 'it_tech' | 'retail' | 'conglomerate' | 'manufacturing' | 'services';
  stockTicker?: string;
  officialDomain?: string;
  descriptionZh: string;
  descriptionJa: string;
  keywords: string[];
}

export const JAPAN_MAJOR_ENTERPRISES: MajorEnterpriseInfo[] = [
  {
    id: 'tsi_holdings',
    shortName: 'TSI Group',
    formalName: '株式会社TSIホールディングス',
    category: 'apparel',
    stockTicker: '東証プライム: 3608',
    officialDomain: 'tsi-holdings.com',
    descriptionZh: '日本大型上市服裝集團（旗下擁有 Dice&Dice、nano・universe、JILL STUART、PEARLY GATES、MARGARET HOWELL 等 30+ 知名時尚品牌，資本額逾百億日圓）。',
    descriptionJa: '東証プライム上場（3608）の総合アパレル大手。Dice&Dice、nano・universe、JILL STUARTなど多数の有力ブランドを展開する正規大企業グループです。',
    keywords: [
      'tsiホールディングス',
      'tsiホールディング',
      '株式会社tsi',
      'tsiグループ',
      'dice&dice',
      'dice & dice',
      'ダイスアンドダイス',
      'nano・universe',
      'nano universe',
      'ナノ・ユニバース',
      'jillstuart',
      'jill stuart',
      'ジル・スチュアート',
      'pearly gates',
      'パーリーゲイツ',
      'margaret howell',
      'マーガレット・ハウエル',
      'rose bud',
      'ローズバッド',
      'avirex',
      'アヴィレックス',
    ],
  },
  {
    id: 'fast_retailing',
    shortName: 'Fast Retailing',
    formalName: '株式会社ファーストリテイリング',
    category: 'apparel',
    stockTicker: '東証プライム: 9983',
    officialDomain: 'fastretailing.com',
    descriptionZh: '日本最大平價服飾跨國巨擘（旗下品牌：UNIQLO 優衣庫、GU、Theory 等）。',
    descriptionJa: '世界有数のアパレルコングロマリット（ユニクロ、GU、Theory等を展開）。',
    keywords: ['ファーストリテイリング', 'ユニクロ', 'uniqlo', 'ジーユー', 'fast retailing', 'theory', 'セオリー'],
  },
  {
    id: 'adastria',
    shortName: 'Adastria',
    formalName: '株式会社アダストリア',
    category: 'apparel',
    stockTicker: '東証プライム: 2685',
    officialDomain: 'adastria.co.jp',
    descriptionZh: '日本主流休閒時尚服飾上市公司（GLOBAL WORK、niko and...、LOWRYS FARM 等）。',
    descriptionJa: '東証プライム上場の大手カジュアルファッション企業。',
    keywords: ['アダストリア', 'adastria', 'グローバルワーク', 'global work', 'ローリーズファーム', 'lowrys farm', 'niko and', 'ニコアンド'],
  },
  {
    id: 'united_arrows',
    shortName: 'United Arrows',
    formalName: '株式会社ユナイテッドアローズ',
    category: 'apparel',
    stockTicker: '東証プライム: 7606',
    officialDomain: 'united-arrows.co.jp',
    descriptionZh: '日本高端選品時裝上市公司（UNITED ARROWS、BEAUTY&YOUTH 等）。',
    descriptionJa: '東証プライム上場のセレクトショップ大手。',
    keywords: ['ユナイテッドアローズ', 'united arrows', 'beauty&youth', 'ビューティ&ユース'],
  },
  {
    id: 'baycrews',
    shortName: "Baycrew's",
    formalName: '株式会社ベイクルーズ',
    category: 'apparel',
    officialDomain: 'baycrews.co.jp',
    descriptionZh: '日本知名時裝與餐飲集團（JOURNAL STANDARD、IÉNA、EDIFICE、Spick & Span 等）。',
    descriptionJa: 'JOURNAL STANDARD、IENAなどを展開するファッション・ライフスタイル大手。',
    keywords: ['ベイクルーズ', 'baycrew', 'journal standard', 'ジャーナルスタンダード', 'spick & span', 'edifice', 'エディフィス', 'iena', 'イエナ'],
  },
  {
    id: 'zozo',
    shortName: 'ZOZO',
    formalName: '株式会社ZOZO',
    category: 'retail',
    stockTicker: '東証プライム: 3092',
    officialDomain: 'zozo.com',
    descriptionZh: '日本最大時尚電商平台 ZOZOTOWN 營運商（隸屬 LINEヤフー 集團）。',
    descriptionJa: '日本最大級のファッション通販サイトZOZOTOWNを運営する東証プライム上場企業。',
    keywords: ['zozo', 'zozotown', 'ゾゾタウン', 'スタートトゥデイ'],
  },
  {
    id: 'mercari',
    shortName: 'Mercari',
    formalName: '株式会社メルカリ',
    category: 'it_tech',
    stockTicker: '東証プライム: 4385',
    officialDomain: 'about.mercari.com',
    descriptionZh: '日本最大二手交易平台與行動支付 Merpay 營運商。',
    descriptionJa: 'フリマアプリ最大手「メルカリ」を展開する東証プライム上場テック企業。',
    keywords: ['メルカリ', 'mercari', 'merpay', 'メルペイ', 'mercoin', 'メルコイン'],
  },
  {
    id: 'recruit',
    shortName: 'Recruit',
    formalName: '株式会社リクルートホールディングス',
    category: 'services',
    stockTicker: '東証プライム: 6098',
    officialDomain: 'recruit.co.jp',
    descriptionZh: '日本最大人力資源、求職與媒體巨擘（Indeed、リクナビ、SUUMO、HotPepper 營運商）。',
    descriptionJa: 'Indeed、リクナビ、SUUMO等を運営する人材・情報サービスのメガコングロマリット。',
    keywords: ['リクルート', 'recruit', 'リクルートホールディングス'],
  },
  {
    id: 'line_yahoo',
    shortName: 'LINE Yahoo',
    formalName: 'LINEヤフー株式会社',
    category: 'it_tech',
    stockTicker: '東証プライム: 4689',
    officialDomain: 'lycorp.co.jp',
    descriptionZh: '日本最大通訊軟體與入口入口網站（隸屬軟體銀行集團 SoftBank）。',
    descriptionJa: 'LINE、Yahoo! JAPAN、PayPayを傘下に持つ国内最大のITプラットフォーマー。',
    keywords: ['lineヤフー', 'line yahoo', 'ヤフー株式会社', 'yahoo! japan', 'ソフトバンク', 'softbank'],
  },
  {
    id: 'sony',
    shortName: 'Sony',
    formalName: 'ソニーグループ株式会社',
    category: 'manufacturing',
    stockTicker: '東証プライム: 6758',
    officialDomain: 'sony.com',
    descriptionZh: '世界知名跨國綜合娛樂、電子、PlayStation 遊戲與金融科技集團。',
    descriptionJa: 'エレクトロニクス、ゲーム、映画、音楽、金融を統括するグローバル企業。',
    keywords: ['ソニー', 'sony', 'ソニーグループ', 'ソニーインタラクティブ', 'sie'],
  },
  {
    id: 'toyota',
    shortName: 'Toyota',
    formalName: 'トヨタ自動車株式会社',
    category: 'manufacturing',
    stockTicker: '東証プライム: 7203',
    officialDomain: 'toyota.co.jp',
    descriptionZh: '世界銷量第一的日本汽車製造龍頭企業。',
    descriptionJa: '世界トップクラスの自動車メーカー・モビリティカンパニー。',
    keywords: ['トヨタ', 'toyota', 'トヨタ自動車', 'デンソー', 'アイシン'],
  },
  {
    id: 'nintendo',
    shortName: 'Nintendo',
    formalName: '任天堂株式会社',
    category: 'it_tech',
    stockTicker: '東証プライム: 7974',
    officialDomain: 'nintendo.co.jp',
    descriptionZh: '世界知名電子遊戲機與娛樂軟體龍頭企業（Mario、Pokemon、Switch 等）。',
    descriptionJa: '世界に誇るゲーム＆エンターテインメントのリーディングカンパニー。',
    keywords: ['任天堂', 'nintendo'],
  },
  {
    id: 'rakuten',
    shortName: 'Rakuten',
    formalName: '楽天グループ株式会社',
    category: 'it_tech',
    stockTicker: '東証プライム: 4755',
    officialDomain: 'corp.rakuten.co.jp',
    descriptionZh: '日本大型電商、金融、電信與網路生態系統集團（楽天市場、楽天銀行、楽天モバイル）。',
    descriptionJa: '楽天市場、楽天カード、楽天モバイル等を展開する総合インターネットサービス企業。',
    keywords: ['楽天', 'rakuten', '楽天グループ', '楽天市場', '楽天カード'],
  },
  {
    id: 'cyberagent',
    shortName: 'CyberAgent',
    formalName: '株式会社サイバーエージェント',
    category: 'it_tech',
    stockTicker: '東証プライム: 4751',
    officialDomain: 'cyberagent.co.jp',
    descriptionZh: '日本網路廣告代理、網路媒體 ABEMA 與著名手遊開發集團（Cygames 母公司）。',
    descriptionJa: 'ABEMA、Cygames、ネット広告事業を展開するメガベンチャー。',
    keywords: ['サイバーエージェント', 'cyberagent', 'abema', 'cygames', 'サイゲームス'],
  },
  {
    id: 'nitori',
    shortName: 'Nitori',
    formalName: '株式会社ニトリホールディングス',
    category: 'retail',
    stockTicker: '東証プライム: 9843',
    officialDomain: 'nitori.co.jp',
    descriptionZh: '日本最大連鎖家居零售家具企業。',
    descriptionJa: 'インテリア・家具小売業国内首位の東証プライム上場大手。',
    keywords: ['ニトリ', 'nitori', 'ニトリホールディングス'],
  },
  {
    id: 'muji',
    shortName: 'MUJI / 良品計画',
    formalName: '株式会社良品計画',
    category: 'retail',
    stockTicker: '東証プライム: 7453',
    officialDomain: 'ryohin-keikaku.jp',
    descriptionZh: '世界知名生活雜貨品牌「無印良品 (MUJI)」母公司。',
    descriptionJa: '無印良品（MUJI）を展開するグローバル小売チェーン。',
    keywords: ['良品計画', '無印良品', 'muji'],
  },
];

/**
 * 智慧比對是否為日本知名大型或上場企業關聯職缺
 */
export function matchMajorEnterprise(text: string): MajorEnterpriseInfo | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const corp of JAPAN_MAJOR_ENTERPRISES) {
    for (const kw of corp.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return corp;
      }
    }
  }

  return null;
}
