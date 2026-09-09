import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '日本幽靈・釣魚職缺偵測器 (Japan Ghost Job & Black Kyujin Radar)',
  description: '針對 Indeed、LinkedIn、Green、Wantedly、doda 與 Hello Work 的日本專用幽靈職缺與黑心企業檢測系統。結合 ATS 官網認證、みなし残業與 SES 誘餌分析。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
