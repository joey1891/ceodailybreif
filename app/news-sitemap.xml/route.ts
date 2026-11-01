// Google News 사이트맵 — 최근 48시간 안에 발행된 기사 (구글 뉴스 규격)
// https://www.ceodailybrief.com/news-sitemap.xml

import { supabase } from '@/utils/supabase';
import { SITE_NAME, articleUrl, getDisplayText, xmlSafe } from '@/lib/seo';

export const revalidate = 600; // 10분마다 갱신

export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('articles')
    .select('id, title, created_at, hashtags')
    .eq('is_published', true)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000);

  const items = (data || [])
    .map((a) => `  <url>
    <loc>${xmlSafe(articleUrl(a.id))}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlSafe(SITE_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.created_at).toISOString()}</news:publication_date>
      <news:title>${xmlSafe(getDisplayText(a.title))}</news:title>
    </news:news>
  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
