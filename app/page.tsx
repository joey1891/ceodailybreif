'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CEODailyBrief() {
  const router = useRouter();
  
  const [headlines, setHeadlines] = useState<any>({ 
    MAIN_HERO: null, 
    SUB_1: null, 
    SUB_2: null, 
    SUB_3: null, 
    SUB_4: null, 
    SUB_5: null, 
    SUB_6: null 
  });
  
  const [briefingArticles, setBriefingArticles] = useState<any[]>([]);
  const [bestArticles, setBestArticles] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<{id: number, name: string}[]>([]);
  
  const [ads, setAds] = useState<any>({ mid: null, bottom: null });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).toUpperCase();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).toUpperCase();
  };

  const getDisplayText = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field; 
    return field.en || field.ko || Object.values(field)[0] || '';
  };

  useEffect(() => {
    const fetchNews = async () => {
      const [
        { data: headlineMap },
        { data: articles },
        { data: topArticles },
        { data: categoryData },
        { data: adData } 
      ] = await Promise.all([
        supabase.from('headlines').select('*'),
        supabase.from('articles').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('articles').select('*').eq('is_published', true).order('view_count', { ascending: false }).limit(6),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('ads').select('*') 
      ]);

      if (categoryData) {
        setDbCategories(categoryData);
      }

      if (adData) {
        const adMap: any = { mid: null, bottom: null };
        adData.forEach(ad => {
          if (ad.position === 'mid') adMap.mid = ad;
          if (ad.position === 'bottom') adMap.bottom = ad;
        });
        setAds(adMap);
      }

      if (articles && headlineMap) {
        const newHeadlines: any = { 
          MAIN_HERO: null, 
          SUB_1: null, 
          SUB_2: null, 
          SUB_3: null, 
          SUB_4: null, 
          SUB_5: null, 
          SUB_6: null 
        };
        const usedArticleIds = new Set();
        
        headlineMap.forEach(h => {
          const matchedArticle = articles.find(a => a.id === h.article_id);
          if (matchedArticle) {
            newHeadlines[h.position] = matchedArticle;
            usedArticleIds.add(matchedArticle.id);
          }
        });
        setHeadlines(newHeadlines);

        const remainingArticles = articles.filter(a => !usedArticleIds.has(a.id));
        let finalBriefingArticles = [];

        if (remainingArticles.length >= 8) {
          finalBriefingArticles = remainingArticles.slice(0, 8);
        } else {
          const headlineArticles = articles.filter(a => usedArticleIds.has(a.id));
          finalBriefingArticles = [...remainingArticles];
          const needed = 8 - finalBriefingArticles.length;
          finalBriefingArticles = [...finalBriefingArticles, ...headlineArticles.slice(0, needed)];
        }

        setBriefingArticles(finalBriefingArticles);
      }

      if (topArticles) {
        setBestArticles(topArticles);
      }

      setIsLoading(false);
    };

    fetchNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/news?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: email }]);

      if (error) {
        if (error.code === '23505') { 
          alert('This email is already subscribed.');
        } else {
          console.error('Supabase Insert Error:', error);
          alert('An error occurred during subscription: ' + error.message);
        }
      } else {
        alert(`Successfully subscribed with ${email}!`);
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading CEO Daily Brief...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2">
          <span>{currentDate}</span>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Search news..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-l-md text-black focus:outline-none focus:border-black w-full sm:w-48"
              />
              <button type="submit" className="bg-blue-950 text-white px-3 py-1.5 rounded-r-md hover:bg-blue-800 transition-colors">
                Search
              </button>
            </form>
            <Link 
              href="/news" 
              className="bg-blue-950 text-white px-4 py-1.5 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-center w-full sm:w-auto"
            >
              All News
            </Link>
          </div>
        </div>
        
        <div className="text-center py-6 sm:py-8 cursor-pointer border-none">
          <Link href="/">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-serif tracking-tighter uppercase leading-none break-words hover:text-gray-800 transition-colors" style={{ letterSpacing: '-0.05em' }}>
              CEO Daily Brief
            </h1>
          </Link>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-lg font-serif italic text-gray-600 px-2">
            The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence
          </p>
        </div>

        {/* 
          자연스럽게 Wrap(줄바꿈) 되는 좌측 정렬 네비게이션 
          justify-start: 왼쪽 정렬
          flex-wrap: 공간이 부족하면 자동으로 다음 줄로 이동
        */}
        <nav className="border-y border-gray-300 py-3 sm:py-4 mt-6">
          <ul className="flex flex-wrap justify-start items-center gap-x-6 sm:gap-x-10 md:gap-x-12 gap-y-3 sm:gap-y-4 w-full text-[11px] sm:text-[13px] md:text-[15px] font-bold tracking-widest uppercase">
            {dbCategories.map(cat => (
              <li key={cat.id} className="whitespace-nowrap">
                <Link href={`/news?category=${encodeURIComponent(cat.name)}`} className="hover:text-red-800 cursor-pointer transition-colors block">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 sm:pb-12">
          
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
                    {getDisplayText(headlines.MAIN_HERO.title)}
                  </h2>          
                </article>
              </Link>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-serif italic text-xl">
                No Lead Story Published Yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-0">
              {[
                headlines.SUB_1, 
                headlines.SUB_2, 
                headlines.SUB_3, 
                headlines.SUB_4, 
                headlines.SUB_5, 
                headlines.SUB_6
              ].map((subArticle, idx) => (
                subArticle ? (
                  <Link key={idx} href={`/article?id=${subArticle.id}`}>
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && (
                        <div className="relative w-full aspect-[4/3] bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded">
                          <img 
                            src={subArticle.image_url} 
                            alt={getDisplayText(subArticle.title)} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]"
                          />
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
                      <h3 className="text-xl sm:text-lg font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">
                        {getDisplayText(subArticle.title)}
                      </h3>
                    </article>
                  </Link>
                ) : null
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 h-full relative">
            <div className="px-2 sm:px-0 flex flex-col gap-10 h-full">
              
              <div>
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
                    {briefingArticles.map((article, index) => (
                      <li key={`${article.id}-${index}`} className="relative pl-3 sm:pl-4 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                        <span className="absolute left-0 top-1.5 sm:top-2 w-1.5 h-1.5 bg-red-800 rounded-full group-hover:scale-150 transition-transform"></span>
                        <Link href={`/article?id=${article.id}`}>
                          <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                          <p className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 transition-colors text-gray-800">
                            {getDisplayText(article.title)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-serif italic text-gray-500">
                    Awaiting breaking news updates.
                  </p>
                )}
              </div>

              <div className="flex justify-center w-full">
                {ads.mid?.image_url ? (
                  <a href={ads.mid.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-[300px] h-[250px] relative">
                    <img src={ads.mid.image_url} alt="Advertisement" className="absolute inset-0 w-full h-full object-cover border border-gray-200" />
                  </a>
                ) : (
                  <div className="relative flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-400 font-sans w-[300px] h-[250px] overflow-hidden">
                    <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider text-gray-400">Advertisement</span>
                    <div className="text-center">
                      <p className="text-sm font-bold tracking-widest mb-1">MID AD SPACE</p>
                      <p className="text-xs">300 x 250</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                  <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">
                    MOST VIEWED
                  </h3>
                </div>
                
                {bestArticles.length > 0 ? (
                  <ul className="flex flex-col gap-4 sm:gap-6">
                    {bestArticles.map((article, index) => (
                      <li key={article.id} className="relative pl-7 sm:pl-8 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                        <span className="absolute left-0 top-0 text-red-800 font-black text-xl italic font-serif">
                          {index + 1}
                        </span>
                        <Link href={`/article?id=${article.id}`}>
                          <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                          <p className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 transition-colors text-gray-800">
                            {getDisplayText(article.title)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-serif italic text-gray-500">
                    No popular articles yet.
                  </p>
                )}
              </div>

              <div className="mt-auto sticky top-10 pb-8 flex justify-center w-full">
                {ads.bottom?.image_url ? (
                  <a href={ads.bottom.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-[300px] h-[600px] relative">
                    <img src={ads.bottom.image_url} alt="Advertisement" className="absolute inset-0 w-full h-full object-cover border border-gray-200" />
                  </a>
                ) : (
                  <div className="relative flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-400 font-sans w-[300px] h-[600px] overflow-hidden">
                    <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider text-gray-400">Advertisement</span>
                    <div className="text-center">
                      <p className="text-sm font-bold tracking-widest mb-1">BOTTOM STICKY AD</p>
                      <p className="text-xs">300 x 600</p>
                      <p className="text-[10px] mt-2 italic text-gray-500">Scroll down to see the effect</p>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-gray-50 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="w-full lg:w-1/3">
            <h3 className="text-black font-bold uppercase tracking-widest mb-3">Newsletter</h3>
            <p className="text-sm mb-4">Get the latest intelligence delivered directly to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:border-black"
              />
              <button type="submit" className="bg-blue-950 text-white px-6 py-2 rounded font-bold uppercase text-xs tracking-wider hover:bg-blue-800 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
            
            <div className="mt-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('https://ceodailybreif.vercel.app/subscribe');
                  alert('Subscribe link copied to clipboard! Share it with your network.');
                }}
                className="text-xs text-blue-900 hover:text-black font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                🔗 Share Subscribe Link
              </button>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row justify-between gap-8 lg:gap-16">
            <div>
              <h2 className="text-base font-serif font-black text-gray-800 uppercase tracking-tighter">CEO Daily Brief</h2>
              <p className="text-xs font-serif italic mt-1">The Global Executive's Guide to South Korea.</p>
            </div>
            
            <div className="shrink-0">
              <Link href="/admin" className="inline-block bg-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-300 px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
