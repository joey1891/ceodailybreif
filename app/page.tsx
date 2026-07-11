'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function CEODailyBrief() {
  const [headlines, setHeadlines] = useState<any>({ MAIN_HERO: null, SUB_1: null, SUB_2: null });
  const [briefingArticles, setBriefingArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).toUpperCase();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).toUpperCase();
  };

  useEffect(() => {
    const fetchNews = async () => {
      const { data: headlineMap } = await supabase.from('headlines').select('*');
      const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (articles && headlineMap) {
        const newHeadlines = { MAIN_HERO: null, SUB_1: null, SUB_2: null };
        const usedArticleIds = new Set();
        
        headlineMap.forEach(h => {
          const matchedArticle = articles.find(a => a.id === h.article_id);
          if (matchedArticle) {
            newHeadlines[h.position as keyof typeof newHeadlines] = matchedArticle;
            usedArticleIds.add(matchedArticle.id);
          }
        });
        setHeadlines(newHeadlines);

        const remainingArticles = articles.filter(a => !usedArticleIds.has(a.id)).slice(0, 7);
        setBriefingArticles(remainingArticles);
      }
      setIsLoading(false);
    };

    fetchNews();
  }, []);

  const categories = [
    "Politics & Policy", "Economy & Markets", "Chaebol & Industry", 
    "Tech & Innovation", "K-Beauty", "K-Culture & Society"
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading CEO Daily Brief...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
          <span>{currentDate}</span>
          <Link href="/news" className="hover:text-black transition-colors">All News</Link>
        </div>
        
        {/* 타이틀 크기 2배 확대 및 밑선(Border) 완벽 제거 */}
        <div className="text-center py-6 sm:py-10 cursor-pointer border-none">
          <Link href="/">
            <h1 className="text-[55px] sm:text-[90px] md:text-[130px] lg:text-[170px] font-black font-serif tracking-tighter uppercase leading-none break-words hover:text-gray-800 transition-colors" style={{ letterSpacing: '-0.06em' }}>
              CEO Daily Brief
            </h1>
          </Link>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-lg font-serif italic text-gray-600 px-2">
            The Executive&apos;s Window into South Korea&apos;s Markets, Policy, and Industry Intelligence
          </p>
        </div>

        {/* 네비게이션: 테두리 선 삭제 및 깔끔한 간격 유지 */}
        <nav className="py-4 sm:py-6 mt-2">
          <ul className="flex flex-wrap justify-center gap-4 sm:gap-8 lg:gap-12 text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase">
            {categories.map(cat => (
              <li key={cat}>
                <Link href={`/news?category=${encodeURIComponent(cat)}`} className="hover:text-red-800 cursor-pointer transition-colors block text-center">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 border-b border-gray-200 pb-12 sm:pb-16">
          
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-12">
            {headlines.MAIN_HERO ? (
              <Link href={`/article?id=${headlines.MAIN_HERO.id}`}>
                <article className="group cursor-pointer">
                  {headlines.MAIN_HERO.image_url && (
                    <div className="w-full bg-gray-100 mb-5 sm:mb-8 overflow-hidden rounded-sm shadow-sm">
                      <img 
                        src={headlines.MAIN_HERO.image_url} 
                        alt="Lead story" 
                        className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[15%]"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className="text-red-800 font-bold text-xs sm:text-sm tracking-widest uppercase">{headlines.MAIN_HERO.category}</span>
                    <span className="text-gray-300 text-xs hidden sm:inline">|</span>
                    <span className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase">{formatTime(headlines.MAIN_HERO.created_at)}</span>
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black font-serif leading-[1.1] mb-2 group-hover:text-red-800 transition-colors break-words">
                    {headlines.MAIN_HERO.title}
                  </h2>
                  {/* 요청하신 대로 본문 3줄 미리보기 영역을 완전히 삭제했습니다. (Z폴드 겹침 현상 원천 해결) */}
                </article>
              </Link>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-400 font-serif italic text-xl">
                No Lead Story Published Yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 mt-4 border-t border-gray-100 pt-8">
              {[headlines.SUB_1, headlines.SUB_2].map((subArticle, idx) => (
                subArticle ? (
                  <Link key={idx} href={`/article?id=${subArticle.id}`}>
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && (
                        <div className="w-full bg-gray-100 mb-4 overflow-hidden rounded-sm">
                          <img 
                            src={subArticle.image_url} 
                            alt={subArticle.title} 
                            className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 grayscale-[15%]"
                          />
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
                      <h3 className="text-2xl sm:text-3xl font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">
                        {subArticle.title}
                      </h3>
                    </article>
                  </Link>
                ) : null
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col">
            <div className="px-1 sm:px-0 bg-gray-50/50 p-6 sm:p-8 rounded-lg border border-gray-100 h-full">
              <div className="flex justify-between items-end border-b-2 border-black pb-3 mb-6">
                <h3 className="text-lg sm:text-xl font-black tracking-widest uppercase">
                  EXECUTIVE BRIEFING
                </h3>
                <Link href="/news" className="text-[10px] sm:text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-wider">
                  View All &rarr;
                </Link>
              </div>
              
              {briefingArticles.length > 0 ? (
                <ul className="flex flex-col gap-5 sm:gap-6">
                  {briefingArticles.map((article) => (
                    <li key={article.id} className="relative group cursor-pointer border-b border-gray-200/60 pb-5 last:border-0 last:pb-0">
                      <Link href={`/article?id=${article.id}`} className="block">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1.5 h-1.5 bg-red-800 rounded-full group-hover:scale-150 transition-transform"></span>
                          <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{article.category}</div>
                        </div>
                        <p className="text-base sm:text-lg font-bold font-serif leading-snug group-hover:text-red-800 transition-colors text-gray-900 pl-3.5">
                          {article.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-serif italic text-gray-500 text-center py-10">
                  Awaiting breaking news updates.
                </p>
              )}
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-gray-900 text-gray-500 py-12 sm:py-16 mt-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-white uppercase tracking-tighter mb-1">CEO Daily Brief</h2>
            <p className="text-xs sm:text-sm font-serif italic">The Global Executive&apos;s Guide to South Korea.</p>
          </div>
          
          <div>
            <Link href="/admin" className="text-[10px] sm:text-xs font-bold hover:text-white uppercase tracking-widest transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
