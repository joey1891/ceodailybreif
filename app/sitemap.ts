import { MetadataRoute } from 'next';
import { supabase } from '@/utils/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.ceodailybrief.com'; // 실제 운영하시는 도메인으로 변경하세요

  // 1. 고정된 정적 페이지
  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
  ];

  // 2. DB에서 발행된 기사 목록 가져오기
  const { data: articles } = await supabase
    .from('articles')
    .select('id, updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // 3. 기사별 URL 생성
  const articleRoutes = (articles || []).map((article) => ({
    url: `${baseUrl}/article?id=${article.id}`,
    lastModified: new Date(article.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
