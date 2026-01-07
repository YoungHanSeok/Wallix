/**
 * SEO 메타 태그 관리 컴포넌트
 */

import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function SEOHead({
  title = '🎨 배경화면 갤러리',
  description = '고화질 배경화면을 무료로 다운로드하세요. 다양한 테마의 아름다운 바탕화면을 제공합니다.',
  keywords = '배경화면, 바탕화면, 고화질, 무료다운로드, 데스크톱, 모바일, 테마',
  image = '/og-image.jpg',
  url = window.location.href,
  type = 'website'
}: SEOHeadProps) {
  const fullTitle = title === '🎨 배경화면 갤러리' ? title : `${title} | 🎨 배경화면 갤러리`;

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="🎨 배경화면 갤러리" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph 태그 (페이스북, 카카오톡 등) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="🎨 배경화면 갤러리" />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter 카드 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* 모바일 최적화 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3b82f6" />

      {/* 구조화된 데이터 (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "🎨 배경화면 갤러리",
          "description": description,
          "url": url,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
}