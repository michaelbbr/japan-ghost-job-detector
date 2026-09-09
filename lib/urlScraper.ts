import * as cheerio from 'cheerio';
import { JobInput } from './ghostScoreEngine';

// 清理企業名稱以利於在 OpenWork 或搜尋引擎檢索（去除括號備註、掲載元等）
export function cleanCompanyName(rawCompany: string): string {
  if (!rawCompany) return '';
  return rawCompany
    .replace(/（[^）]*掲載元[^）]*）|\([^)]*掲載元[^)]*\)/g, '')
    .replace(/（[^）]*社名非公開[^）]*）|\([^)]*社名非公開[^)]*\)/g, '')
    .replace(/（[^）]*派遣[^）]*）|\([^)]*派遣[^)]*\)/g, '')
    .replace(/（[^）]*紹介[^）]*）|\([^)]*紹介[^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 產生 OpenWork 搜尋網址
export function buildOpenWorkUrl(companyName: string): string {
  const cleaned = cleanCompanyName(companyName) || companyName;
  return `https://www.openwork.jp/company_list?field=&pref=&src_str=${encodeURIComponent(cleaned)}&sort=1`;
}

// 產生 Google 公司評價備用搜尋網址
export function buildGoogleReviewUrl(companyName: string): string {
  const cleaned = cleanCompanyName(companyName) || companyName;
  return `https://www.google.com/search?q=${encodeURIComponent(cleaned + ' OpenWork 評判 口コミ')}`;
}

// 辨識網址對應之平台名稱
export function detectPlatformFromUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('indeed.')) return 'Indeed Japan';
  if (u.includes('linkedin.')) return 'LinkedIn Japan';
  if (u.includes('green-japan.com')) return 'Green';
  if (u.includes('wantedly.com')) return 'Wantedly';
  if (u.includes('doda.jp')) return 'doda';
  if (u.includes('rikunabi.com')) return 'リクナビNEXT';
  if (u.includes('mynavi.jp')) return 'マイナビ転職';
  if (u.includes('bizreach.jp')) return 'ビズリーチ';
  if (u.includes('hellowork.mhlw.go.jp')) return 'ハローワーク';
  if (u.includes('findy-code.io')) return 'Findy';
  if (u.includes('herp.careers')) return 'HERP Hire (企業公式)';
  if (u.includes('smarthr.co.jp')) return 'SmartHR (企業公式)';
  if (u.includes('talentio.com')) return 'Talentio (企業公式)';
  if (u.includes('workday.com') || u.includes('myworkdayjobs.com')) return 'Workday (企業公式)';
  if (u.includes('greenhouse.io')) return 'Greenhouse (企業公式)';
  return '企業官方/一般網頁';
}

// 從 HTML 提取 Schema.org JobPosting 或 Meta 標籤
export function parseJobFromHtml(html: string, pageUrl: string): JobInput {
  const $ = cheerio.load(html);
  const platform = detectPlatformFromUrl(pageUrl);

  let title = '';
  let company = '';
  let location = '';
  let salary = '';
  let postedDate = '';
  let description = '';

  // 1. 優先嘗試解析 Schema.org JobPosting (JSON-LD)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (!content) return;
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item['@type'] === 'JobPosting') {
          if (item.title && !title) title = String(item.title).trim();
          if (item.hiringOrganization && typeof item.hiringOrganization === 'object') {
            const org = item.hiringOrganization.name || item.hiringOrganization.legalName;
            if (org && !company) company = String(org).trim();
          }
          if (item.datePosted && !postedDate) postedDate = String(item.datePosted).split('T')[0];
          if (item.description && !description) {
            const cleanDesc = cheerio.load(item.description).text();
            description = cleanDesc.trim();
          }
          if (item.baseSalary) {
            if (typeof item.baseSalary === 'string') {
              salary = item.baseSalary;
            } else if (item.baseSalary.value) {
              const val = item.baseSalary.value;
              const unit = item.baseSalary.value.unitText || '月';
              const min = val.minValue || val.value;
              const max = val.maxValue;
              salary = max ? `${min}〜${max}円/${unit}` : `${min}円/${unit}`;
            }
          }
          if (item.jobLocation) {
            if (typeof item.jobLocation === 'string') {
              location = item.jobLocation;
            } else if (item.jobLocation.address) {
              const addr = item.jobLocation.address;
              location = [addr.addressRegion, addr.addressLocality, addr.streetAddress]
                .filter(Boolean)
                .join(' ');
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors in individual tags
    }
  });

  // 2. 如果沒有取得完整資料，透過 OpenGraph / Twitter meta 標籤回補
  if (!title) {
    title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      '';
    // 移除常見後綴如 " | Indeed"、" - Wantedly"
    title = title.replace(/\s*[-|–]\s*(Indeed|Wantedly|Green|doda|リクナビ|マイナビ).*$/i, '').trim();
  }

  if (!company) {
    company =
      $('meta[property="og:site_name"]').attr('content') ||
      $('[class*="company"]').first().text().trim() ||
      $('[class*="employer"]').first().text().trim() ||
      '';
  }

  if (!description) {
    description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('article').text().trim() ||
      $('main').text().trim() ||
      $('body').text().slice(0, 1500).trim();
  }

  return {
    id: `scraped_${Date.now()}`,
    title: title || '日本職缺分析',
    company: company || '檢測之企業',
    location: location || '',
    salary: salary || '',
    postedDate: postedDate || new Date().toISOString().split('T')[0],
    applyUrl: pageUrl,
    sourcePlatform: platform,
    description: description.slice(0, 3000),
  };
}

// 伺服器端抓取網址
export async function scrapeJobUrl(url: string): Promise<JobInput> {
  if (!url || !url.startsWith('http')) {
    throw new Error('請提供有效的 http 或 https 網址！');
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,zh-TW;q=0.7',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const response = await fetch(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(8000), // 8 秒超時
  });

  if (!response.ok) {
    throw new Error(`無法連線至目標頁面 (HTTP ${response.status})。該網站可能需登入或有防爬機制。`);
  }

  const html = await response.text();
  return parseJobFromHtml(html, url);
}
