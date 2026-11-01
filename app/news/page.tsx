// 뉴스 목록 / 카테고리 / 검색 — 서버 컴포넌트
//  /news                     전체 기사 (페이지 나눔: ?page=2 …)
//  /news?category=Economy    카테고리별
//  /news?search=키워드        검색 결과 (검색 결과 페이지는 noindex — 구글 권장)

import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import {
  SITE_NAME, SITE_URL, type Article,
  getDisplayText, articlePath, articleUrl, jsonLd,
} from '@/lib/seo';

const PAGE_SIZE = 30;
const LIST_COLUMNS = 'id, article_no, title, category, image_url, created_at, updated_at, author_name';

type SearchParams = Promise<{ category?: string; search?: string; page?: string }>;

function readParams(sp: { category?: string; search?: string; page?: string }) {
  const category = typeof sp.category === 'string' && sp.category.trim() ? sp.category.trim() : null;
  const search = typeof sp.search === 'string' && sp.search.trim() ? sp.search.trim() : null;
  const page = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1);
  return { category, search, page };
}

function listHref(category: string | null, page: number) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/news?${qs}` : '/news';
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { category, search, page } = readParams(await searchParams);

  if (search) {
    return {
      title: `Search: ${search} | ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const baseTitle = category ? `${category} News` : 'All News';
  const title = `${baseTitle}${page > 1 ? ` — Page ${page}` : ''} | ${SITE_NAME}`;
  const description = category
    ? `Latest ${category} news and analysis on South Korea's markets, policy and industry from ${SITE_NAME}.`
    : `Every story from ${SITE_NAME}: South Korea's markets, policy and industry intelligence for executives.`;

  return {
    title,
    description,
    alternates: { canonical: listHref(category, page) },
    openGraph: { title, description, url: SITE_URL + listHref(category, page), siteName: SITE_NAME, type: 'website' },
  };
}

async function getArticles(category: string | null, search: string | null, page: number) {
  if (search) {
    const { data } = await supabase.rpc('search_articles', { search_term: search });
    // 혹시 함수가 임시저장 기사까지 돌려주더라도 화면에는 발행 기사만 표시
    const rows = ((data || []) as (Article & { is_published?: boolean })[]).filter((a) => a.is_published !== false);
    return { articles: rows as Article[], total: rows.length };
  }

  let query = supabase
    .from('articles')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (category) query = query.eq('category', category);

  const { data, count } = await query;
  return { articles: (data || []) as Article[], total: count ?? 0 };
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, search, page } = readParams(await searchParams);
  const { articles, total } = await getArticles(category, search, page);
  const totalPages = search ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));

  const heading = search ? `Search Results for "${search}"` : category ? category : 'All News Archive';

  const structuredData = search
    ? null
    : [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: heading,
          url: SITE_URL + listHref(category, page),
          isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: articles.map((a, i) => ({
              '@type': 'ListItem',
              position: (page - 1) * PAGE_SIZE + i + 1,
              url: articleUrl(a),
              name: getDisplayText(a.title),
            })),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'News', item: `${SITE_URL}/news` },
            ...(category
              ? [{ '@type': 'ListItem', position: 3, name: category, item: SITE_URL + listHref(category, 1) }]
              : []),
          ],
        },
      ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans">
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />}

      <header className="max-w-5xl mx-auto px-4 py-8 border-b-2 border-black text-center">
        <Link href="/" className="text-gray-500 text-sm hover:text-black font-bold uppercase tracking-widest mb-4 inline-block">
          Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black font-serif uppercase tracking-tighter">{heading}</h1>
        {search && <p className="mt-4 text-gray-500 font-bold">Total {articles.length} articles found</p>}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-serif italic text-xl">
            {search ? `"${search}"에 대한 검색 결과가 없습니다.` : '해당 조건에 등록된 기사가 없습니다.'}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {articles.map((article) => {
              const title = getDisplayText(article.title);
              return (
                <Link key={article.id} href={articlePath(article)}>
                  <article className="flex flex-col md:flex-row gap-6 group cursor-pointer border-b border-gray-200 pb-10">
                    {article.image_url && (
                      <div className="w-full md:w-1/3 h-48 bg-gray-200 overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={article.image_url} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[20%]" />
                      </div>
                    )}
                    <div className="flex flex-col justify-center">
                      <span className="text-red-800 font-bold text-xs tracking-widest uppercase mb-2">{article.category}</span>
                      <h2 className="text-2xl md:text-3xl font-bold font-serif leading-snug group-hover:text-red-800 transition-colors mb-3">{title}</h2>
                      <div className="text-xs font-bold text-gray-400 mt-4 uppercase">
                        <time dateTime={article.created_at}>
                          {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Seoul' })}
                        </time>
                        {' '}| By {article.author_name || 'Editor-in-Chief'}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {/* 페이지 이동 — 일반 <a> 링크라 크롤러가 오래된 기사까지 따라갈 수 있음 */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex justify-between items-center mt-12 text-sm font-bold uppercase tracking-widest">
            {page > 1 ? (
              <Link href={listHref(category, page - 1)} className="text-gray-600 hover:text-black">← Newer</Link>
            ) : <span />}
            <span className="text-gray-400">Page {page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={listHref(category, page + 1)} className="text-gray-600 hover:text-black">Older →</Link>
            ) : <span />}
          </nav>
        )}
      </main>
    </div>
  );
}











