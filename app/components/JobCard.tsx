'use client';

import React, { useState } from 'react';
import { GhostAnalysisResult } from '@/lib/ghostScoreEngine';
import { Language, I18N } from '@/lib/i18n';

interface JobCardProps {
  job: GhostAnalysisResult;
  lang?: Language;
}

export const JobCard: React.FC<JobCardProps> = ({ job, lang = 'zh' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const t = I18N[lang];

  // Score color badge
  const getBadgeStyle = (score: number) => {
    if (score >= 70) {
      return {
        bg: 'bg-red-500',
        lightBg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        title: lang === 'ja' ? '高リスク・おとり求人' : '高風險 / 疑點眾多',
      };
    }
    if (score >= 45) {
      return {
        bg: 'bg-amber-500',
        lightBg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        title: lang === 'ja' ? '存疑・要確認' : '存疑 / 需進一步核實',
      };
    }
    if (score >= 20) {
      return {
        bg: 'bg-yellow-500',
        lightBg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        title: lang === 'ja' ? '低リスク・通常求人' : '低風險 / 常態職缺',
      };
    }
    return {
      bg: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      title: lang === 'ja' ? '正規採用・高信頼性' : '正規企業 / 高真實度',
    };
  };

  const style = getBadgeStyle(job.ghostScore);

  return (
    <div
      className={`rounded-2xl bg-white border transition-all duration-200 p-5 sm:p-6 shadow-sm hover:shadow-md ${
        job.ghostScore >= 70
          ? 'border-red-200 hover:border-red-300'
          : job.ghostScore >= 45
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top row: Title, Company, Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {job.sourcePlatform && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                {job.sourcePlatform}
              </span>
            )}
            {job.atsResult.detected && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  job.atsResult.isDirectEmployer
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {job.atsResult.label}
              </span>
            )}
            {job.postedDate && (
              <span className="text-[11px] text-slate-400">
                {t.postedOn(job.postedDate)}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-snug break-words">
            {job.title}
          </h3>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 mt-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              🏢 {job.company}
            </span>
            {job.location && (
              <span className="text-slate-500 flex items-center gap-1">
                📍 {job.location}
              </span>
            )}
            {job.salary && (
              <span className="font-medium text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-100">
                💴 {job.salary}
              </span>
            )}
          </div>
        </div>

        {/* Ghost Score Badge */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-end self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center gap-2 sm:text-right">
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                {t.ghostScoreLabel}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {job.ghostScore}{' '}
                <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
            </div>
            <div
              className={`w-3 h-10 rounded-full hidden sm:block ${style.bg}`}
              title={style.title}
            ></div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${style.lightBg} ${style.border} ${style.text}`}
            >
              {job.verdict}
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
              title={job.confidenceNote}
            >
              {t.confidenceLabel}: {job.confidence}
            </span>
          </div>
        </div>
      </div>

      {/* Warning Tags and Signals */}
      {job.scamHits.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.scamHits.map((hit, idx) => {
            let color = 'bg-amber-50 text-amber-800 border-amber-200';
            if (hit.severity === 'CRITICAL') {
              color = 'bg-red-50 text-red-800 border-red-200 font-bold';
            } else if (hit.severity === 'HIGH') {
              color = 'bg-rose-50 text-rose-800 border-rose-200';
            }
            return (
              <div
                key={idx}
                className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${color}`}
                title={hit.explanation}
              >
                <span>⚠️</span>
                <span className="font-semibold">{hit.title}</span>
                {hit.matchedText && hit.matchedText !== hit.title && (
                  <span className="text-[11px] opacity-75">「{hit.matchedText}」</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Duplicate / Repost Warning */}
      {job.duplicateInfo?.isDuplicate && (
        <div className="mt-3 text-xs bg-blue-50 text-blue-800 border border-blue-200 p-2.5 rounded-xl flex items-center gap-2">
          <span>🔄</span>
          <span>{t.batchDuplicateWarning(job.duplicateInfo.duplicateCount || 2)}</span>
        </div>
      )}
      {job.duplicateInfo?.isRepost && (
        <div className="mt-3 text-xs bg-blue-50 text-blue-800 border border-blue-200 p-2.5 rounded-xl flex items-center gap-2">
          <span>📅</span>
          <span>{t.repostWarning(job.duplicateInfo.repostCount || 1)}</span>
        </div>
      )}

      {/* Quick Summary Reasons */}
      {job.reasons.length > 0 && (
        <div className="mt-4 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <span>{t.keyIndicators}</span>
          </div>
          <ul className="space-y-1">
            {job.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons: OpenWork, Google Review, Apply Link */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
        >
          <span>{showDetails ? t.collapseDetails : t.expandDetails}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {job.openWorkUrl && (
            <a
              href={job.openWorkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition font-medium flex items-center gap-1"
              title="在日本最大員工評價網 OpenWork 查看該公司真實加班與年薪"
            >
              <span>🏢</span>
              <span>{t.openWorkBtn}</span>
            </a>
          )}
          {job.googleReviewUrl && (
            <a
              href={job.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium flex items-center gap-1 border border-slate-200"
              title="在 Google 搜尋該公司的口碑評價與退職爆料"
            >
              <span>🔍</span>
              <span>{t.googleReviewBtn}</span>
            </a>
          )}
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition font-medium flex items-center gap-1"
            >
              <span>🔗</span>
              <span>{t.originalJobBtn}</span>
            </a>
          )}
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-xs animate-fadeIn">
          {/* Evidence */}
          <div>
            <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
              <span>{t.evidenceTitle}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1">
              {job.evidence.length > 0 ? (
                job.evidence.map((ev, i) => (
                  <div key={i} className="text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{ev}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">{t.noEvidence}</div>
              )}
            </div>
          </div>

          {/* Caveats */}
          {job.caveats.length > 0 && (
            <div>
              <div className="font-bold text-amber-800 mb-1.5 flex items-center gap-1">
                <span>{t.caveatsTitle}</span>
              </div>
              <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200 text-amber-900 space-y-1">
                {job.caveats.map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">i</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations for job seeker */}
          <div>
            <div className="font-bold text-indigo-900 mb-1.5 flex items-center gap-1">
              <span>{t.recommendationsTitle}</span>
            </div>
            <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 text-indigo-950 space-y-1.5">
              {job.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">👉</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Job description excerpt */}
          {job.description && (
            <div>
              <div className="font-bold text-slate-700 mb-1">{t.jobDescTitle}</div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {job.description}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
