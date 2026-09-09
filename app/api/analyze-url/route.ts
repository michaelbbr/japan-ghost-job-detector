import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobUrl, detectPlatformFromUrl } from '@/lib/urlScraper';
import { analyzeSingleJob, GhostAnalysisResult } from '@/lib/ghostScoreEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = (body.url || '').trim();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: '請輸入有效的網址 (以 http:// 或 https:// 開頭)' },
        { status: 400 }
      );
    }

    const platform = detectPlatformFromUrl(url);
    const lowerUrl = url.toLowerCase();
    const isAntiBotPlatform = lowerUrl.includes('indeed.') || lowerUrl.includes('linkedin.');

    // Indeed 與 LinkedIn 在伺服器端請求時一律受 Cloudflare Turnstile / 登入驗證阻擋
    if (isAntiBotPlatform) {
      return NextResponse.json({
        success: false,
        isAntiBotBlocked: true,
        platform,
        url,
        error: `${platform} 設有 Cloudflare 反爬蟲保護或動態渲染，伺服器無法直接抓取頁面內容。`,
        suggestion: '請直接在求職網頁上複製該職缺文字（Ctrl+C），貼入「貼上職缺文字」輸入框，系統 1 秒即可為您精準提取公司名、薪資並進行避雷分析！',
      });
    }

    let jobData;
    try {
      jobData = await scrapeJobUrl(url);
    } catch (scrapeErr: unknown) {
      const errMsg = scrapeErr instanceof Error ? scrapeErr.message : String(scrapeErr);
      return NextResponse.json({
        success: false,
        isAntiBotBlocked: true,
        platform,
        url,
        error: errMsg,
        suggestion: '該網頁無法直接公開抓取。請直接複製職缺文字貼入「貼上職缺文字」進行診斷！',
      });
    }

    const lang = body.lang === 'ja' ? 'ja' : 'zh';
    const analyzedResult: GhostAnalysisResult = analyzeSingleJob(jobData, undefined, lang);

    return NextResponse.json({
      success: true,
      data: {
        job: jobData,
        analysis: analyzedResult,
      },
      job: jobData,
      analysis: analyzedResult,
      result: analyzedResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: '網址診斷失敗', details: message },
      { status: 500 }
    );
  }
}
