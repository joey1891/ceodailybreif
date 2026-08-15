import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.ceodailybrief.com';

  return [
    {
      url: `${baseUrl}`, // 메인 홈
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/news`, // 뉴스 페이지
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 나중에 /article 등 새로운 주요 메뉴가 생기면 아래에 양식을 복사해서 추가하시면 됩니다.
  ];
}
