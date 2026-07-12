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
    "Tech & Innovation", "K-Culture & Society", "K-Beauty"
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading CEO Daily Brief...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      {}
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2">
  			<span>{currentDate}</span>
  			<span className="flex">
    			<Link 
      			href="/news" 
      			className="bg-blue-950 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-800 transition-colors"
    				>
      		All News
    		</Link>
  			</span>
				</div>
        
       <div className="text-center py-6 sm:py-8 cursor-pointer border-none">
  <Link href="/">
    {/* 글씨 크기를 세련된 수준으로 축소 (md:text-6xl lg:text-7xl) */}
    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-serif tracking-tighter uppercase leading-none break-words hover:text-gray-800 transition-colors" style={{ letterSpacing: '-0.05em' }}>
  CEO Daily Brief
</h1>
  </Link>
  <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-lg font-serif italic text-gray-600 px-2">
    The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence
  </p>
</div>

        {/* 네비게이션: 모바일 세로 정렬 유지, PC 가로 정렬 */}
        <nav className="border-y border-gray-300 py-3 mt-6">
          <ul className="flex flex-col sm:flex-row justify-start sm:justify-center items-start sm:items-center gap-3 sm:gap-6 md:gap-8 text-[11px] sm:text-sm md:text-[15px] font-bold tracking-widest uppercase px-2 sm:px-0">
            {categories.map(cat => (
              <li key={cat} className="w-full sm:w-auto text-left">
                <Link href={`/news?category=${encodeURIComponent(cat)}`} className="hover:text-red-800 cursor-pointer transition-colors block w-full">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 border-b border-gray-300 pb-8 sm:pb-12">
          
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            {headlines.MAIN_HERO ? (
              <Link href={`/article?id=${headlines.MAIN_HERO.id}`}>
                <article className="group cursor-pointer">
                  {headlines.MAIN_HERO.image_url && (
                    <div className="w-full bg-gray-100 mb-4 sm:mb-6 overflow-hidden rounded">
                      <img 
                        src={headlines.MAIN_HERO.image_url} 
                        alt="Lead story" 
                        className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[20%]"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-red-800 font-bold text-xs sm:text-sm tracking-widest uppercase">{headlines.MAIN_HERO.category}</span>
                    <span className="text-gray-400 text-xs hidden sm:inline">|</span>
                    <span className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase">{formatTime(headlines.MAIN_HERO.created_at)}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black font-serif leading-[1.15] mb-3 sm:mb-5 group-hover:text-red-800 transition-colors break-words">
                    {headlines.MAIN_HERO.title}
                  </h2>          
                </article>
              </Link>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-serif italic text-xl">
                No Lead Story Published Yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-0">
              {[headlines.SUB_1, headlines.SUB_2].map((subArticle, idx) => (
                subArticle ? (
                  <Link key={idx} href={`/article?id=${subArticle.id}`}>
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && (
                        <div className="w-full bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded">
                          <img 
                            src={subArticle.image_url} 
                            alt={subArticle.title} 
                            className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]"
                          />
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">
                        {subArticle.title}
                      </h3>
                    </article>
                  </Link>
                ) : null
              ))}
            </div>
          </div>

          {}
          <div className="lg:col-span-4 flex flex-col">
            <div className="px-2 sm:px-0">
              <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">
                  EXECUTIVE BRIEFING
                </h3>
                <Link href="/news" className="text-[10px] sm:text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase">
                  View All &rarr;
                </Link>
              </div>
              
              {briefingArticles.length > 0 ? (
                <ul className="flex flex-col gap-4 sm:gap-6">
                  {briefingArticles.map((article) => (
                    <li key={article.id} className="relative pl-3 sm:pl-4 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                      <span className="absolute left-0 top-1.5 sm:top-2 w-1.5 h-1.5 bg-red-800 rounded-full group-hover:scale-150 transition-transform"></span>
                      <Link href={`/article?id=${article.id}`}>
                        <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                        <p className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 transition-colors text-gray-800">
                          {article.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-serif italic text-gray-500">
                  Awaiting breaking news updates. (새 기사를 작성하면 이곳에 표시됩니다)
                </p>
              )}
            </div>
          </div>

        </div>
      </main>

      {}
      <footer className="bg-gray-50 text-gray-400 py-6 sm:py-8 mt-8 sm:mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm sm:text-base font-serif font-black text-gray-800 uppercase tracking-tighter">CEO Daily Brief</h2>
            <p className="text-[10px] sm:text-xs font-serif italic mt-0.5">The Global Executive&apos;s Guide to South Korea.</p>
          </div>
          
          <div>
            <Link href="/admin" className="text-[10px] font-bold text-gray-400 hover:text-gray-800 uppercase tracking-widest transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
