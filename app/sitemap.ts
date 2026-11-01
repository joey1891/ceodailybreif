sitemap.xml — 모든 기사(+이미지·배너 이미지·번역본), 카테고리, 메인 배너를 구글에 알립니다.

import type { MetadataRoute } from 'next';
import { supabase } from '@/utils/supabase';
import {
  SITE_URL, type Article, type Ad,
  articleUrl, storedLanguages, xmlSafe, isVideoFile, youtubeThumb,
} from '@/lib/seo';

export const revalidate = 3600; // 1시간마다 갱신

const ARTICLE_COLUMNS =
  'id, title, created_at, updated_at, image_url, author_image_url, translations, ' +
  'profile_banner_url, profile_banner_visible, subscribe_banner_url, subscribe_banner_visible';

// 구글 사이트맵 한도(5만 URL)를 넘지 않도록 1,000개씩 끝까지 가져오기
async function getAllPublishedArticles(): Promise<Article[]> {
  const all: Article[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_COLUMNS)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    all.push(...(data as unknown as Article[]));
    if (data.length < 1000 || all.length >= 45000) break;
  }
  return all;
}

const safeImages = (urls: (string | null | undefined)[]) =>
  [...new Set(urls.filter((u): u is string => !!u && /^https?:\/\//.test(u) && !isVideoFile(u)))].map(xmlSafe);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, { data: categories }, { data: ads }] = await Promise.all([
    getAllPublishedArticles(),
    supabase.from('categories').select('name').order('sort_order', { ascending: true }),
    supabase.from('ads').select('*'),
  ]);

  const latest = articles[0]?.updated_at || articles[0]?.created_at || new Date().toISOString();
  const visibleAds = ((ads || []) as Ad[]).filter((a) => a.is_visible);

  // 메인 화면 배너: 이미지 배너는 image, 유튜브 배너는 video 로 등록
  const home: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    lastModified: new Date(latest),
    changeFrequency: 'hourly',
    priority: 1.0,
    images: safeImages(visibleAds.filter((a) => !a.is_youtube).map((a) => a.image_url)),
    videos: visibleAds
      .filter((a) => a.is_youtube && a.youtube_id)
      .map((a) => ({
        title: xmlSafe(a.alt_text || a.description || 'CEO Daily Brief video'),
        description: xmlSafe((a.description || a.alt_text || 'CEO Daily Brief featured video').slice(0, 2000)),
        thumbnail_loc: xmlSafe(youtubeThumb(a.youtube_id!)),
        player_loc: xmlSafe(`https://www.youtube.com/embed/${a.youtube_id}`),
      })),
  };

  const staticRoutes: MetadataRoute.Sitemap = [
    home,
    { url: `${SITE_URL}/news`, lastModified: new Date(latest), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/subscribe`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = ((categories || []) as { name: string }[]).map((c) => ({
    url: xmlSafe(`${SITE_URL}/news?category=${encodeURIComponent(c.name)}`),
    lastModified: new Date(latest),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => {
    const langs = storedLanguages(a);
    const entry: MetadataRoute.Sitemap[number] = {
      url: articleUrl(a.id),
      lastModified: new Date(a.updated_at || a.created_at),
      changeFrequency: 'weekly',
      priority: 0.9,
      images: safeImages([
        a.image_url,
        a.author_image_url,
        a.profile_banner_visible !== false ? a.profile_banner_url : null,
        a.subscribe_banner_visible !== false ? a.subscribe_banner_url : null,
      ]),
    };
    if (langs.length > 1) {
      const languages: Record<string, string> = {};
      for (const code of langs) languages[code] = xmlSafe(articleUrl(a.id, code));
      languages['x-default'] = articleUrl(a.id);
      entry.alternates = { languages };
    }
    return entry;
  });

  // 번역본이 저장된 언어 주소도 각각 등록
  const translatedRoutes: MetadataRoute.Sitemap = articles.flatMap((a) =>
    storedLanguages(a)
      .filter((code) => code !== 'en')
      .map((code) => ({
        url: xmlSafe(articleUrl(a.id, code)),
        lastModified: new Date(a.updated_at || a.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
  );

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes, ...translatedRoutes];
}







