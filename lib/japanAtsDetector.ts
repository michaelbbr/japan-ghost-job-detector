export interface AtsDetectionResult {
  detected: boolean;
  atsName?: string;
  atsType: 'japanese_ats' | 'global_ats' | 'job_board' | 'official_site' | 'unknown';
  label: string;
  isDirectEmployer: boolean;
  notes: string;
}

export const JAPAN_ATS_REGISTRY: Record<string, { name: string; type: 'japanese_ats' | 'global_ats' | 'job_board'; domains: string[]; isDirect: boolean }> = {
  // Japanese ATS
  herp: {
    name: 'HERP Hire',
    type: 'japanese_ats',
    domains: ['herp.careers', 'jobs.herp.careers'],
    isDirect: true,
  },
  talentio: {
    name: 'Talentio',
    type: 'japanese_ats',
    domains: ['talentio.com', 'open.talentio.com'],
    isDirect: true,
  },
  hrmos: {
    name: 'HRMOS (ビズリーチ系)',
    type: 'japanese_ats',
    domains: ['hrmos.co'],
    isDirect: true,
  },
  smarthr: {
    name: 'SmartHR 採用管理',
    type: 'japanese_ats',
    domains: ['smarthr.co.jp', 'jobs.smarthr.co.jp'],
    isDirect: true,
  },
  jobsuite: {
    name: 'JobSuite',
    type: 'japanese_ats',
    domains: ['jobsuite.net', 'entry.jobsuite.net'],
    isDirect: true,
  },
  sonar: {
    name: 'SONAR ATS',
    type: 'japanese_ats',
    domains: ['sonar-ats.jp', 'ignite-sonar.com'],
    isDirect: true,
  },
  iweb: {
    name: 'i-web (ヒューマネージ)',
    type: 'japanese_ats',
    domains: ['i-web.jpn.com'],
    isDirect: true,
  },

  // Global ATS in Japan
  greenhouse: {
    name: 'Greenhouse',
    type: 'global_ats',
    domains: ['greenhouse.io', 'boards.greenhouse.io'],
    isDirect: true,
  },
  workday: {
    name: 'Workday',
    type: 'global_ats',
    domains: ['myworkdayjobs.com', 'workday.com'],
    isDirect: true,
  },
  lever: {
    name: 'Lever',
    type: 'global_ats',
    domains: ['lever.co', 'jobs.lever.co'],
    isDirect: true,
  },
  ashby: {
    name: 'Ashby',
    type: 'global_ats',
    domains: ['ashbyhq.com', 'jobs.ashbyhq.com'],
    isDirect: true,
  },
  smartrecruiters: {
    name: 'SmartRecruiters',
    type: 'global_ats',
    domains: ['smartrecruiters.com'],
    isDirect: true,
  },

  // Major Job Boards
  indeed: {
    name: 'Indeed Japan',
    type: 'job_board',
    domains: ['jp.indeed.com', 'indeed.com', 'indeed.co.jp'],
    isDirect: false, // Could be agency or direct aggregator
  },
  linkedin: {
    name: 'LinkedIn Jobs',
    type: 'job_board',
    domains: ['linkedin.com/jobs', 'linkedin.com'],
    isDirect: false,
  },
  green_japan: {
    name: 'Green (IT転職)',
    type: 'job_board',
    domains: ['green-japan.com'],
    isDirect: false,
  },
  wantedly: {
    name: 'Wantedly',
    type: 'job_board',
    domains: ['wantedly.com'],
    isDirect: false,
  },
  doda: {
    name: 'doda',
    type: 'job_board',
    domains: ['doda.jp'],
    isDirect: false,
  },
  rikunabi: {
    name: 'リクナビNEXT',
    type: 'job_board',
    domains: ['next.rikunabi.com', 'rikunabi.com'],
    isDirect: false,
  },
  hellowork: {
    name: 'ハローワーク (Hello Work)',
    type: 'job_board',
    domains: ['hellowork.mhlw.go.jp'],
    isDirect: false,
  },
  bizreach: {
    name: 'ビズリーチ (BizReach)',
    type: 'job_board',
    domains: ['bizreach.jp'],
    isDirect: false,
  },
};

export function detectAtsFromUrl(url: string): AtsDetectionResult {
  if (!url || typeof url !== 'string') {
    return {
      detected: false,
      atsType: 'unknown',
      label: '無應徵連結',
      isDirectEmployer: false,
      notes: '未提供申請網址或官網連結',
    };
  }

  const cleanUrl = url.toLowerCase().trim();

  for (const [key, ats] of Object.entries(JAPAN_ATS_REGISTRY)) {
    for (const domain of ats.domains) {
      if (cleanUrl.includes(domain)) {
        if (ats.type === 'japanese_ats') {
          return {
            detected: true,
            atsName: ats.name,
            atsType: 'japanese_ats',
            label: `日本企業正規 ATS (${ats.name})`,
            isDirectEmployer: true,
            notes: `檢測到日本主流正規招募系統 ${ats.name}，通常為企業官方直聘，真實度較高。`,
          };
        } else if (ats.type === 'global_ats') {
          return {
            detected: true,
            atsName: ats.name,
            atsType: 'global_ats',
            label: `跨國外商正規 ATS (${ats.name})`,
            isDirectEmployer: true,
            notes: `檢測到外商/跨國企業主流系統 ${ats.name}，為企業直接管理之後台。`,
          };
        } else {
          return {
            detected: true,
            atsName: ats.name,
            atsType: 'job_board',
            label: `求職平台轉址 (${ats.name})`,
            isDirectEmployer: false,
            notes: `此為 ${ats.name} 刊登頁面，需進一步確認刊登者為企業直招或派遣/人力仲介。`,
          };
        }
      }
    }
  }

  // Check if it looks like an official company career site
  if (
    cleanUrl.includes('/careers') ||
    cleanUrl.includes('/jobs') ||
    cleanUrl.includes('/recruit') ||
    cleanUrl.includes('/saiyo') ||
    cleanUrl.includes('careers.') ||
    cleanUrl.includes('recruit.')
  ) {
    return {
      detected: true,
      atsType: 'official_site',
      label: '企業官方招募頁面 (採用ページ)',
      isDirectEmployer: true,
      notes: '連結指向企業官方網站之專屬招募專頁 (Recruit / Careers)。',
    };
  }

  return {
    detected: false,
    atsType: 'unknown',
    label: '一般網址 / 未知系統',
    isDirectEmployer: false,
    notes: '無法從網址特徵判斷是否為正規企業 ATS 或官方職缺。',
  };
}
