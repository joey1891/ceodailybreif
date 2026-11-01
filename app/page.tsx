// 메인(1면) — 서버 컴포넌트
// 서버에서 기사·헤드라인·배너를 모두 가져와 완성된 HTML로 보내므로
// 구글이 첫 방문에서 모든 기사 제목·링크·이미지·배너를 읽을 수 있습니다.

import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import AdSlot from '@/components/AdSlot';
import { SearchForm, NewsletterForm } from '@/components/HomeForms';
import {
  SITE_URL, SITE_NAME, SITE_DESCRIPTION, LOGO_URL,
  type Article, type Ad,
  getDisplayText, articlePath, articleUrl, jsonLd,
} from '@/lib/seo';

// 60초마다 새로 생성 (ISR). 기사 발행 후 최대 1분 안에 메인에 반영됩니다.
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const LIST_COLUMNS = 'id, article_no, title, category, image_url, created_at, updated_at, author_name';
type Position = 'MAIN_HERO' | 'SUB_1' | 'SUB_2' | 'SUB_3' | 'SUB_4' | 'SUB_5' | 'SUB_6';

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Seoul' }).toUpperCase();

async function getHomeData() {
  const [headlineRes, articleRes, topRes, categoryRes, adRes] = await Promise.all([
    supabase.from('headlines').select('position, article_id'),
    supabase.from('articles').select(LIST_COLUMNS).eq('is_published', true).order('created_at', { ascending: false }).limit(60),
    supabase.from('articles').select(LIST_COLUMNS).eq('is_published', true).order('view_count', { ascending: false }).limit(6),
    supabase.from('categories').select('id, name').order('sort_order', { ascending: true }),
    supabase.from('ads').select('*'),
  ]);

  const articles = (articleRes.data || []) as Article[];
  const headlineRows = (headlineRes.data || []) as { position: Position; article_id: string | null }[];

  // 헤드라인 기사가 최근 60개 밖에 있을 수도 있으므로 따로 조회
  const headlineIds = headlineRows.map((h) => h.article_id).filter((id): id is string => !!id);
  const missingIds = headlineIds.filter((id) => !articles.some((a) => a.id === id));
  let extra: Article[] = [];
  if (missingIds.length) {
    const { data } = await supabase.from('articles').select(LIST_COLUMNS).eq('is_published', true).in('id', missingIds);
    extra = (data || []) as Article[];
  }
  const pool = [...articles, ...extra];

  const headlines: Partial<Record<Position, Article>> = {};
  const used = new Set<string>();
  for (const h of headlineRows) {
    const found = pool.find((a) => a.id === h.article_id);
    if (found) { headlines[h.position] = found; used.add(found.id); }
  }

  const remaining = articles.filter((a) => !used.has(a.id));
  const briefing = remaining.length >= 8
    ? remaining.slice(0, 8)
    : [...remaining, ...articles.filter((a) => used.has(a.id)).slice(0, 8 - remaining.length)];

  const ads: Record<string, Ad | null> = { mid: null, bottom: null, article_bottom: null, footer_top: null };
  for (const ad of (adRes.data || []) as Ad[]) {
    if (ad.position in ads) ads[ad.position] = ad;
  }

  return {
    headlines,
    briefing,
    best: (topRes.data || []) as Article[],
    categories: (categoryRes.data || []) as { id: number; name: string }[],
    ads,
    allListed: pool,
  };
}

export default async function HomePage() {
  const { headlines, briefing, best, categories, ads, allListed } = await getHomeData();
  const currentDate = new Date()
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' })
    .toUpperCase();

  const hero = headlines.MAIN_HERO;
  const subs = (['SUB_1', 'SUB_2', 'SUB_3', 'SUB_4', 'SUB_5', 'SUB_6'] as const).map((p) => headlines[p]).filter(Boolean) as Article[];

  // 구조화 데이터: 언론사 정보 + 1면 기사 목록
  const featured = [hero, ...subs, ...briefing].filter(Boolean) as Article[];
  const uniqueFeatured = featured.filter((a, i) => featured.findIndex((b) => b.id === a.id) === i).slice(0, 20);
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
      description: SITE_DESCRIPTION,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${SITE_NAME} — Top Stories`,
      itemListElement: uniqueFeatured.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: articleUrl(a),
        name: getDisplayText(a.title),
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2">
          <span>{currentDate}</span>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <SearchForm />
            <Link href="/news" className="bg-blue-950 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 w-full sm:w-auto text-center">All News</Link>
          </div>
        </div>
        <div className="text-center py-6 sm:py-8">
          <Link href="/"><h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-tighter uppercase break-words hover:text-gray-800" style={{ letterSpacing: '-0.05em' }}>CEO Daily Brief</h1></Link>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-lg font-serif italic text-gray-600 px-2">{SITE_DESCRIPTION}</p>
        </div>
        <nav className="border-y border-gray-300 py-3 sm:py-4 mt-6" aria-label="Main Navigation">
          <ul className="flex flex-wrap justify-start items-center gap-x-6 sm:gap-x-10 md:gap-x-12 gap-y-3 sm:gap-y-4 w-full text-[11px] sm:text-[13px] md:text-[15px] font-bold tracking-widest uppercase">
            {categories.map((cat) => (
              <li key={cat.id} className="whitespace-nowrap">
                <Link href={`/news?category=${encodeURIComponent(cat.name)}`} className="hover:text-red-800 block" title={`${cat.name} News Category`}>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 sm:pb-12">
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            {hero ? (
              <Link href={articlePath(hero)}>
                <article className="group cursor-pointer">
                  {hero.image_url && (
                    <div className="w-full bg-gray-100 mb-4 sm:mb-6 overflow-hidden rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={hero.image_url} alt={getDisplayText(hero.title)} fetchPriority="high" className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-red-800 font-bold text-xs sm:text-sm tracking-widest uppercase">{hero.category}</span>
                    <time dateTime={hero.created_at} className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase">{formatDate(hero.created_at)}</time>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black font-serif leading-[1.15] mb-3 sm:mb-5 group-hover:text-red-800 break-words">{getDisplayText(hero.title)}</h2>
                </article>
              </Link>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 border text-gray-400 font-serif italic text-xl">No Lead Story Published Yet.</div>
            )}

            <AdSlot ad={ads.article_bottom} variant="wide" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-2">
              {subs.map((sub) => (
                <Link key={sub.id} href={articlePath(sub)}>
                  <article className="group cursor-pointer flex flex-col h-full">
                    {sub.image_url && (
                      <div className="relative w-full aspect-[4/3] bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={sub.image_url} alt={getDisplayText(sub.title)} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]" />
                      </div>
                    )}
                    <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{sub.category}</span>
                    <h3 className="text-xl sm:text-lg font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">{getDisplayText(sub.title)}</h3>
                  </article>
                </Link>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4 h-full relative">
            <div className="px-2 sm:px-0 flex flex-col gap-10 h-full">
              <section>
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                  <h2 className="text-base sm:text-lg font-bold tracking-widest uppercase">EXECUTIVE BRIEFING</h2>
                </div>
                <ul className="flex flex-col gap-4 sm:gap-6">
                  {briefing.map((article, index) => (
                    <li key={`${article.id}-${index}`} className="relative pl-3 sm:pl-4 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                      <span className="absolute left-0 top-1.5 sm:top-2 w-1.5 h-1.5 bg-red-800 rounded-full group-hover:scale-150 transition-transform"></span>
                      <Link href={articlePath(article)}>
                        <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                        <h3 className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 text-gray-800">{getDisplayText(article.title)}</h3>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <AdSlot ad={ads.mid} variant="box" />

              <section>
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                  <h2 className="text-base sm:text-lg font-bold tracking-widest uppercase">MOST VIEWED</h2>
                </div>
                <ol className="flex flex-col gap-4 sm:gap-6">
                  {best.map((article, index) => (
                    <li key={article.id} className="relative pl-7 sm:pl-8 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                      <span className="absolute left-0 top-0 text-red-800 font-black text-xl italic font-serif">{index + 1}</span>
                      <Link href={articlePath(article)}>
                        <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                        <h3 className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 text-gray-800">{getDisplayText(article.title)}</h3>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>

              <AdSlot ad={ads.bottom} variant="tall" />
            </div>
          </aside>
        </div>

        {/* 최근 기사 전체 링크 — 크롤러가 1면에서 모든 최근 기사로 이동할 수 있게 함 */}
        {allListed.length > 0 && (
          <section className="border-t border-gray-200 pt-8 pb-4" aria-label="Latest stories">
            <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-5">
              <h2 className="text-base sm:text-lg font-bold tracking-widest uppercase">LATEST</h2>
              <Link href="/news" className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-widest">View all →</Link>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {allListed.slice(0, 30).map((a) => (
                <li key={a.id} className="border-b border-gray-100 pb-3">
                  <Link href={articlePath(a)} className="group block">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mr-2">{a.category}</span>
                    <span className="text-sm font-bold font-serif text-gray-800 group-hover:text-red-800">{getDisplayText(a.title)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <AdSlot ad={ads.footer_top} variant="banner" />

      {/* --- FOOTER --- */}
      <footer className="bg-gray-50 text-gray-400 py-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="w-full lg:w-1/3">
            <h2 className="text-black font-bold uppercase tracking-widest mb-3">Newsletter</h2>
            <p className="text-sm mb-4">Get the latest intelligence delivered directly to your inbox.</p>
            <NewsletterForm />
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row justify-between gap-8 lg:gap-16">
            <div>
              <p className="text-base font-serif font-black text-gray-800 uppercase tracking-tighter">CEO Daily Brief</p>
              <p className="text-xs font-serif italic mt-1">The Global Executive&apos;s Guide to South Korea.</p>
            </div>
            <div className="shrink-0">
              <Link href="/admin" rel="nofollow" className="inline-block bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-[10px] font-bold uppercase">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}











