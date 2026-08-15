import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.ceodailybrief.com';

  return [
    // 1. 메인 홈 화면 (app/page.tsx)
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // 가장 중요도가 높음
    },
    // 2. 뉴스 목록 화면 (app/news/page.tsx)
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 3. 개별 기사 화면 (app/article/page.tsx)
    {
      url: `${baseUrl}/article`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
