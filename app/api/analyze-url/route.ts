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

    let jobData;
    try {
      // 嘗試遠端讀取頁面並解析
      jobData = await scrapeJobUrl(url);
    } catch (scrapeErr: unknown) {
      // 若受防爬蟲限制（如 403 或反爬機制），以網址特徵建立基礎診斷模型，不阻斷使用者評分
      const platform = detectPlatformFromUrl(url);
      const urlObj = new URL(url);
      jobData = {
        id: `url_${Date.now()}`,
        title: `求職頁面分析 (${platform})`,
        company: urlObj.hostname.replace('www.', ''),
        applyUrl: url,
        sourcePlatform: platform,
        description: `從網址自動載入：${url}。\n由於目標平台 (${platform}) 設有反爬機制，系統依據網址特徵與採用系統 (ATS) 進行結構分析。`,
        postedDate: new Date().toISOString().split('T')[0],
      };
    }

    const analyzedResult: GhostAnalysisResult = analyzeSingleJob(jobData);

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
