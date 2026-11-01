// 예전 주소 /article?id=xxx  →  새 주소 /article/번호/영문-제목 으로 영구 이동(308)
// 이미 구글에 등록된 예전 링크·공유 링크의 검색 순위를 새 주소로 넘겨줍니다.

import { permanentRedirect, notFound } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { UUID_RE, articlePath } from '@/lib/seo';

export default async function LegacyArticleRedirect(
  { searchParams }: { searchParams: Promise<{ id?: string; lang?: string }> }
) {
  const { id, lang } = await searchParams;
  if (!id || !UUID_RE.test(id)) notFound();
  const { data } = await supabase
    .from('articles')
    .select('id, article_no, title')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) notFound();
  permanentRedirect(articlePath(data, lang));
}











