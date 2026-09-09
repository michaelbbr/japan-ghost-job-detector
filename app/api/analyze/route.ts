import { NextRequest, NextResponse } from 'next/server';
import {
  JobInput,
  analyzeSingleJob,
  detectBatchDuplicatesAndReposts,
  GhostAnalysisResult,
  buildBatchSummary,
} from '@/lib/ghostScoreEngine';
import { SAMPLE_JAPANESE_JOBS } from '@/lib/sampleJapaneseJobs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let jobsToAnalyze: JobInput[] = [];

    if (Array.isArray(body.jobs) && body.jobs.length > 0) {
      jobsToAnalyze = body.jobs;
    } else if (body.job && typeof body.job === 'object') {
      jobsToAnalyze = [body.job];
    } else if (body.text && typeof body.text === 'string') {
      // 貼上文字簡易解析
      const lines = body.text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      jobsToAnalyze = [
        {
          title: lines[0] || '貼上職缺分析',
          company: lines[1] || '未指定公司',
          description: body.text,
          sourcePlatform: '手動貼上輸入',
        },
      ];
    } else {
      return NextResponse.json({ error: '請提供有效的職缺資料 (jobs, job, 或 text)' }, { status: 400 });
    }

    const dupeMap = detectBatchDuplicatesAndReposts(jobsToAnalyze);
    const results: GhostAnalysisResult[] = jobsToAnalyze.map((job, idx) =>
      analyzeSingleJob(job, dupeMap[idx])
    );

    const summary = buildBatchSummary(results);

    return NextResponse.json({
      success: true,
      results,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: '分析過程發生錯誤', details: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isDemo = searchParams.get('demo') === 'true';

  if (isDemo) {
    const dupeMap = detectBatchDuplicatesAndReposts(SAMPLE_JAPANESE_JOBS);
    const results = SAMPLE_JAPANESE_JOBS.map((job, idx) => analyzeSingleJob(job, dupeMap[idx]));
    const summary = buildBatchSummary(results);
    return NextResponse.json({
      success: true,
      results,
      summary,
      isDemo: true,
    });
  }

  return NextResponse.json({
    name: 'Japan Ghost Job Radar API',
    version: '2.0.0',
    description: '日本版 幽靈・釣魚職缺檢測與黑心企業防禦系統 API',
    endpoints: {
      'POST /api/analyze': '分析單筆或批次職缺 (支援 CSV 解析後 JSON)',
      'GET /api/analyze?demo=true': '取得預設 10 筆真實情境日本測試職缺',
    },
  });
}
