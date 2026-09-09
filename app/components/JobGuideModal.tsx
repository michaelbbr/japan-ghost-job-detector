'use client';

import React, { useState } from 'react';
import { JAPAN_JOB_PLATFORMS, JapanPlatformInfo } from '@/lib/japanJobPlatforms';

interface JobGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobGuideModal: React.FC<JobGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'platforms' | 'market_rules'>('platforms');

  if (!isOpen) return null;

  const filteredPlatforms =
    selectedCategory === 'all'
      ? JAPAN_JOB_PLATFORMS
      : JAPAN_JOB_PLATFORMS.filter((p) => p.category === selectedCategory);

  const getRiskBadge = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (level) {
      case 'HIGH':
        return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">高風險 🚨</span>;
      case 'MEDIUM':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">中度風險 ⚠️</span>;
      case 'LOW':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold">低風險 ✅</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🗾</span>
              <h2 className="text-lg sm:text-xl font-black">
                日本求職全生態導覽與防坑指南 (Japan Job Market Guide)
              </h2>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              深入剖析「日本都啥求職」、主流求職管道生態、幽靈職缺風險與避雷守則
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 pt-3 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('platforms')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'platforms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📱</span>
            <span>各主流求職平台評析 (Indeed, LinkedIn, Green, doda...)</span>
          </button>
          <button
            onClick={() => setActiveTab('market_rules')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'market_rules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>⚖️</span>
            <span>日本求職市場體制與三大幽靈陷阱</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'platforms' ? (
            <>
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: 'all', label: '全部平台' },
                  { id: 'aggregator', label: '聚合搜尋 (Indeed等)' },
                  { id: 'global_highclass', label: '外商高階 (LinkedIn/BizReach)' },
                  { id: 'it_tech', label: 'IT科技新創 (Green/Wantedly/Findy)' },
                  { id: 'mid_career', label: '中途轉職 (doda/リクナビNEXT)' },
                  { id: 'public', label: '公營 (Hello Work)' },
                  { id: 'review_site', label: '員工評價 (OpenWork)' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      selectedCategory === c.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Platform cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="rounded-2xl border border-slate-200/80 p-5 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                            {platform.categoryLabel}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: platform.color }}
                            ></span>
                            {platform.name}
                          </h3>
                          <div className="text-xs text-slate-400">{platform.japaneseName}</div>
                        </div>
                        <div>{getRiskBadge(platform.ghostJobRiskLevel)}</div>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                        {platform.description}
                      </p>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                        <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          <div className="font-bold text-emerald-800 mb-1">👍 主要優勢：</div>
                          <ul className="space-y-0.5 text-slate-700">
                            {platform.pros.slice(0, 2).map((p, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-emerald-500">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                          <div className="font-bold text-rose-800 mb-1">⚠️ 缺點與風險：</div>
                          <ul className="space-y-0.5 text-slate-700">
                            {platform.cons.slice(0, 2).map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-rose-500">•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Ghost Patterns */}
                      <div className="mt-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 text-[11px]">
                        <div className="font-bold text-amber-900 mb-1">👻 常見幽靈/釣魚模式：</div>
                        <ul className="space-y-0.5 text-amber-950">
                          {platform.typicalGhostPatterns.map((pat, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-amber-500">▸</span>
                              <span>{pat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-slate-500 font-medium">
                        💡 <strong>避坑秘訣：</strong>
                        {platform.tipsForSeekers[0]}
                      </div>
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition ml-2 whitespace-nowrap"
                      >
                        前往官網 ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Market Rules & Traps */
            <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* Section 1: 日本特有僱用制度 */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span>🏢</span>
                  <span>1. 日本獨特的求職型態（新卒一括 vs 中途轉職 vs 雇用形態）</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-600">
                  <p>
                    日本的職場制度與歐美不同，傳統上偏好「<strong>新卒一括採用</strong>（應屆畢業統招生）」，視員工為「成員型雇用（Membership-type）」，重視忠誠度與培訓；而外國人與轉職者主要走「<strong>中途採用（Mid-career）</strong>」，重視即戰力與職位規格（Job-type）。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] pt-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">正社員 (Seishain)</div>
                      <p className="text-slate-500">無固定合約期限，受日本嚴格的《勞動契約法》保障，企業極難解雇，享有年終獎金與退職金制度。</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">契約社員 (Keiyaku)</div>
                      <p className="text-slate-500">通常簽訂 6 個月至 1 年定期契約。需特別注意「試用期是否被惡意降為契約社員」。</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">SES・客先常駐</div>
                      <p className="text-slate-500">名義上是 IT 公司的員工，但被派去外部客戶公司（銀行、電信等現場）常駐開發，技術難累積。</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">業務委託 (Freelance)</div>
                      <p className="text-slate-500">屬於個人事業主承攬關係，非勞工身分，無勞保與加班費，不適用勞基法最低工資保護。</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: 三大幽靈與黑心陷阱 */}
              <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200 text-amber-950">
                <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>🚨</span>
                  <span>2. 日本求職市場三大「幽靈與黑心陷阱」剖析</span>
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Trap A: Kara Kyujin */}
                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm mb-1">
                      ① カラ求人 (Kara Kyujin / 空頭假職缺)
                    </h4>
                    <p className="text-slate-700">
                      <strong>為什麼存在？</strong> 在公營 Hello Work 尤為嚴重。日本政府針對僱用身心障礙者、高齡者或受不景氣影響的企業提供高額「助成金（補助金）」，但申請條件通常包括「維持招募與僱用窗口」。許多黑心企業為了拿到數百萬日圓補助款，常年掛著假職缺，面試時卻以各種理由刷掉所有人。在商業網站上，企業也常透過掛缺營造公司「業務蓬勃擴張」以吸引投資人。
                    </p>
                  </div>

                  {/* Trap B: Otori Kyujin */}
                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm mb-1">
                      ② おとり求人 (Otori Kyujin / 誘餌釣魚職缺)
                    </h4>
                    <p className="text-slate-700">
                      <strong>常見套路：</strong> 人力仲介或派遣公司在 Indeed 或各大求職網發布「年薪500萬・全遠端・未經驗自社開發」，吸引大量求職者投遞簡歷。求職者應徵後，仲介立刻回覆「太可惜了，該名額今天早上剛滿，不過我們手上有其他極度適合您的客先常駐（SES）現場…」，藉此偷天換日將求職者賣給下游客戶抽成。
                    </p>
                  </div>

                  {/* Trap C: Minashi Zangyo */}
                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm mb-1">
                      ③ みなし残業（固定残業代）的數字障眼法
                    </h4>
                    <p className="text-slate-700">
                      <strong>法規陷阱：</strong> 標榜「月給35万円」，但小字標註「含固定加班費45小時（95,000円）」。實際底薪只有 25.5 萬日圓。除以月工時 160 小時，真實時薪甚至逼近最低工資！而且如果加班超過 45 小時，黑心企業通常會以「你的效率太差」為由拒發超額加班費，形成嚴重的過勞死黑洞。
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: 避坑四大法寶 */}
              <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 text-indigo-950">
                <h3 className="text-base font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>3. 求職者自保的「四大防護法寶」</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <div className="font-bold text-indigo-900 mb-1">① 必查 OpenWork (Vorkers)</div>
                    <p className="text-slate-600">
                      在投遞履歷或面試前，務必輸入公司名查詢真實員工評價。重點查看「月平均殘業時間」是否超過 40 小時、以及「待遇の納得感」。
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <div className="font-bold text-indigo-900 mb-1">② 索取《労働条件通知書》</div>
                    <p className="text-slate-600">
                      日本《勞動基準法》第15條明定，雇主有義務交付書面勞動條件。內定時務必逐字核對「契約期間」、「勤務場所（是否客先常駐）」與「固定加班時間」。
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <div className="font-bold text-indigo-900 mb-1">③ 查詢國稅廳法人番號</div>
                    <p className="text-slate-600">
                      若公司名聽起來模糊或社名非公開，可至日本國稅廳「法人番号公表サイト」查詢其註冊地址是否為共享辦公室（Virtual Office）或民宅。
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <div className="font-bold text-indigo-900 mb-1">④ 善用本檢測工具</div>
                    <p className="text-slate-600">
                      將職缺資訊貼入本系統，自動掃描 ATS 認證、黑心精神論詞彙、SES 關鍵字與みなし残業合規性，為您的職涯把關！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-3xl">
          <span className="text-xs text-slate-400">
            資料更新：2026 年日本勞動市場基準
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            我瞭解了，關閉指南
          </button>
        </div>
      </div>
    </div>
  );
};
