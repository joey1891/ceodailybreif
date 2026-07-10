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
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2">
          <span>{currentDate}</span>
          <span className="flex space-x-4">
            <Link href="/news" className="hover:text-black transition-colors">All News</Link>
          </span>
        </div>
        
        <div className="text-center py-4 sm:py-6 cursor-pointer">
          <Link href="/">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-serif tracking-tighter uppercase leading-none break-words hover:text-gray-800 transition-colors" style={{ letterSpacing: '-0.05em' }}>
              CEO Daily Brief
            </h1>
          </Link>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base font-serif italic text-gray-600 px-2">
            The Executive&apos;s Window into South Korea&apos;s Markets, Policy, and Industry Intelligence
          </p>
        </div>

        <nav className="border-t-2 border-b border-black py-2 sm:py-3 mt-2 sm:mt-4">
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-10 text-xs sm:text-sm md:text-[15px] font-bold tracking-wider uppercase">
            {categories.map(cat => (
              <li key={cat}>
                <Link href={`/news?category=${encodeURIComponent(cat)}`} className="hover:text-red-800 cursor-pointer transition-colors">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

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
                  <div 
                    className="text-base sm:text-lg text-gray-700 leading-relaxed md:w-11/12 font-serif line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: headlines.MAIN_HERO.content }}
                  />
                </
