// robots.txt — 관리자/API 는 크롤링 제외, 사이트맵 위치 안내
// ⚠️ public/robots.txt 파일은 반드시 삭제하세요 (두 파일이 있으면 빌드 오류)

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
