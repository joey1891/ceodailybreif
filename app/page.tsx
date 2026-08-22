'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CEODailyBrief() {
  const router = useRouter();
  
  const [headlines, setHeadlines] = useState<any>({ MAIN_HERO: null, SUB_1: null, SUB_2: null, SUB_3: null, SUB_4: null, SUB_5: null, SUB_6: null });
  const [briefingArticles, setBriefingArticles] = useState<any[]>([]);
  const [bestArticles, setBestArticles] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<{id: number, name: string}[]>([]);
  
  const [ads, setAds] = useState<any>({ mid: null, bottom: null, article_bottom: null, footer_top: null });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');

  const [videoModal, setVideoModal] = useState<{ 
    isOpen: boolean; 
    youtubeId: string; 
    linkUrl?: string; 
    description?: string; 
    fileUrl?: string; 
  }>({ 
    isOpen: false, youtubeId: '', linkUrl: '', description: '', fileUrl: ''
  });

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).toUpperCase();
  const formatTime = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
  const getDisplayText = (field: any) => typeof field === 'string' ? field : field?.en || field?.ko || Object.values(field || {})[0] || '';

  const getYoutubeSrc = (id: string, autoplay: boolean) => {
    if (!autoplay) return `https://www.youtube.com/embed/${id}?rel=0`;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${id}&iv_load_policy=3&disablekb=1&cc_load_policy=0`;
  };

  const getCoverIframeStyle = (autoplay: boolean, scale: number = 1.0) => {
    if (!autoplay) return { width: '100%', height: '100%' };
    return {
      position: 'absolute' as 'absolute',
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as 'none',
    };
  };

  useEffect(() => {
    const fetchNews = async () => {
      const [
        { data: headlineMap }, { data: articles }, { data: topArticles }, { data: categoryData }, { data: adData } 
      ] = await Promise.all([
        supabase.from('headlines').select('*'),
        supabase.from('articles').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('articles').select('*').eq('is_published', true).order('view_count', { ascending: false }).limit(6),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('ads').select('*') 
      ]);

      if (categoryData) setDbCategories(categoryData);

      if (adData) {
        const adMap: any = { mid: null, bottom: null, article_bottom: null, footer_top: null };
        adData.forEach(ad => {
          if (ad.position === 'mid') adMap.mid = ad;
          if (ad.position === 'bottom') adMap.bottom = ad;
          if (ad.position === 'article_bottom') adMap.article_bottom = ad;
          if (ad.position === 'footer_top') adMap.footer_top = ad;
        });
        setAds(adMap);
      }

      if (articles && headlineMap) {
        const newHeadlines: any = { MAIN_HERO: null, SUB_1: null, SUB_2: null, SUB_3: null, SUB_4: null, SUB_5: null, SUB_6: null };
        const usedArticleIds = new Set();
        headlineMap.forEach(h => {
          const matchedArticle = articles.find(a => a.id === h.article_id);
          if (matchedArticle) { newHeadlines[h.position] = matchedArticle; usedArticleIds.add(matchedArticle.id); }
        });
        setHeadlines(newHeadlines);

        const remainingArticles = articles.filter(a => !usedArticleIds.has(a.id));
        let finalBriefingArticles = remainingArticles.length >= 8 ? remainingArticles.slice(0, 8) : [...remainingArticles, ...articles.filter(a => usedArticleIds.has(a.id)).slice(0, 8 - remainingArticles.length)];
        setBriefingArticles(finalBriefingArticles);
      }

      if (topArticles) setBestArticles(topArticles);
      setIsLoading(false);
    };
    fetchNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/news?search=${encodeURIComponent(searchQuery)}`); };
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const { error } = await supabase.from('subscribers').insert([{ email: email }]);
      if (error) alert(error.code === '23505' ? 'This email is already subscribed.' : 'Error: ' + error.message);
      else { alert(`Successfully subscribed with ${email}!`); setEmail(''); }
    } catch (err) { alert('An unexpected error occurred. Please try again.'); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading CEO Daily Brief...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2">
          <span>{currentDate}</span>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
              <input type="text" placeholder="Search news..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 py-1.5 border rounded-l-md text-black focus:outline-none w-full sm:w-48"/>
              <button type="submit" className="bg-blue-950 text-white px-3 py-1.5 rounded-r-md hover:bg-blue-800">Search</button>
            </form>
            <Link href="/news" className="bg-blue-950 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 w-full sm:w-auto text-center">All News</Link>
          </div>
        </div>
        
        <div className="text-center py-6 sm:py-8">
          <Link href="/"><h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-tighter uppercase break-words hover:text-gray-800" style={{ letterSpacing: '-0.05em' }}>CEO Daily Brief</h1></Link>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-lg font-serif italic text-gray-600 px-2">The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence</p>
        </div>

        <nav className="border-y border-gray-300 py-3 sm:py-4 mt-6">
          <ul className="flex flex-wrap justify-start items-center gap-x-6 sm:gap-x-10 md:gap-x-12 gap-y-3 sm:gap-y-4 w-full text-[11px] sm:text-[13px] md:text-[15px] font-bold tracking-widest uppercase">
            {dbCategories.map(cat => (
              <li key={cat.id} className="whitespace-nowrap"><Link href={`/news?category=${encodeURIComponent(cat.name)}`} className="hover:text-red-800 block">{cat.name}</Link></li>
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
                      <img src={headlines.MAIN_HERO.image_url} alt="Lead story" className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]"/>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-red-800 font-bold text-xs sm:text-sm tracking-widest uppercase">{headlines.MAIN_HERO.category}</span>
                    <span className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase">{formatTime(headlines.MAIN_HERO.created_at)}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black font-serif leading-[1.15] mb-3 sm:mb-5 group-hover:text-red-800 break-words">{getDisplayText(headlines.MAIN_HERO.title)}</h2>          
                </article>
              </Link>
            ) : <div className="h-64 flex items-center justify-center bg-gray-50 border text-gray-400 font-serif italic text-xl">No Lead Story Published Yet.</div>}

            {/* 🎥 [배너 3] 메인 기사 하단 */}
            {ads.article_bottom?.is_visible && (
              ads.article_bottom.is_youtube && ads.article_bottom.youtube_id ? (
                <div className="relative w-full aspect-video bg-black rounded overflow-hidden shadow-md my-2 sm:my-0">
                  <iframe 
                    style={getCoverIframeStyle(ads.article_bottom.autoplay, ads.article_bottom.youtube_scale)}
                    src={getYoutubeSrc(ads.article_bottom.youtube_id, ads.article_bottom.autoplay)} 
                    title={ads.article_bottom.alt_text} 
                    allow="autoplay; encrypted-media" 
                    allowFullScreen={!ads.article_bottom.autoplay}
                  ></iframe>
                  {ads.article_bottom.autoplay && (
                    <div 
                      onClick={() => setVideoModal({ isOpen: true, youtubeId: ads.article_bottom.youtube_id, linkUrl: ads.article_bottom.link_url, description: ads.article_bottom.description, fileUrl: ads.article_bottom.file_url })}
                      className="absolute inset-0 z-10 block cursor-pointer"
                    ></div>
                  )}
                </div>
              ) : ads.article_bottom.image_url ? (
                <div className="w-full my-2 sm:my-0">
                  <a href={ads.article_bottom.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <img src={ads.article_bottom.image_url} alt={ads.article_bottom.alt_text} className="w-full h-auto object-cover rounded shadow-md border border-gray-200" />
                  </a>
                </div>
              ) : null
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-2">
              {[headlines.SUB_1, headlines.SUB_2, headlines.SUB_3, headlines.SUB_4, headlines.SUB_5, headlines.SUB_6].map((subArticle, idx) => (
                subArticle ? (
                  <Link key={idx} href={`/article?id=${subArticle.id}`}>
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && (
                        <div className="relative w-full aspect-[4/3] bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded">
                          <img src={subArticle.image_url} alt={getDisplayText(subArticle.title)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]"/>
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
                      <h3 className="text-xl sm:text-lg font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">{getDisplayText(subArticle.title)}</h3>
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
                  <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">EXECUTIVE BRIEFING</h3>
                  <Link href="/news" className="text-[10px] sm:text-xs font-bold text-gray-500 hover:text-black uppercase">View All &rarr;</Link>
                </div>
                {briefingArticles.length > 0 ? (
                  <ul className="flex flex-col gap-4 sm:gap-6">
                    {briefingArticles.map((article, index) => (
                      <li key={`${article.id}-${index}`} className="relative pl-3 sm:pl-4 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                        <span className="absolute left-0 top-1.5 sm:top-2 w-1.5 h-1.5 bg-red-800 rounded-full group-hover:scale-150 transition-transform"></span>
                        <Link href={`/article?id=${article.id}`}>
                          <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                          <p className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 text-gray-800">{getDisplayText(article.title)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm font-serif italic text-gray-500">Awaiting breaking news updates.</p>}
              </div>

              {/* 📸 [기존 배너 1] 우측 사이드바 중앙 (mid) */}
              {ads.mid?.is_visible && (
                <div className="flex justify-center w-full">
                  {ads.mid.is_youtube && ads.mid.youtube_id ? (
                    <div className="w-[300px] h-[250px] bg-black relative overflow-hidden rounded">
                      <iframe 
                        style={getCoverIframeStyle(ads.mid.autoplay, ads.mid.youtube_scale)}
                        src={getYoutubeSrc(ads.mid.youtube_id, ads.mid.autoplay)} 
                        allow="autoplay; encrypted-media" 
                        allowFullScreen={!ads.mid.autoplay}
                      ></iframe>
                      {ads.mid.autoplay && (
                        <div 
                          onClick={() => setVideoModal({ isOpen: true, youtubeId: ads.mid.youtube_id, linkUrl: ads.mid.link_url, description: ads.mid.description, fileUrl: ads.mid.file_url })}
                          className="absolute inset-0 z-10 block cursor-pointer"
                        ></div>
                      )}
                    </div>
                  ) : ads.mid.image_url ? (
                    <a href={ads.mid.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-[300px] h-[250px] relative">
                      <img src={ads.mid.image_url} alt={ads.mid.alt_text} className="absolute inset-0 w-full h-full object-cover border border-gray-200 rounded" />
                    </a>
                  ) : null}
                </div>
              )}

              <div>
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                  <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">MOST VIEWED</h3>
                </div>
                {bestArticles.length > 0 ? (
                  <ul className="flex flex-col gap-4 sm:gap-6">
                    {bestArticles.map((article, index) => (
                      <li key={article.id} className="relative pl-7 sm:pl-8 group cursor-pointer border-b border-gray-100 pb-4 last:border-0">
                        <span className="absolute left-0 top-0 text-red-800 font-black text-xl italic font-serif">{index + 1}</span>
                        <Link href={`/article?id=${article.id}`}>
                          <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                          <p className="text-sm sm:text-[16px] font-bold font-serif leading-snug group-hover:text-red-800 text-gray-800">{getDisplayText(article.title)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm font-serif italic text-gray-500">No popular articles yet.</p>}
              </div>

              {/* 📸 [기존 배너 2] 우측 하단 배너 */}
              {ads.bottom?.is_visible && (
                <div className="flex-1 w-full relative pb-8 min-h-[600px]">
                  {ads.bottom.is_youtube && ads.bottom.youtube_id ? (
                    <div className="absolute inset-0 bottom-8 w-full bg-black relative overflow-hidden rounded">
                      <iframe 
                        style={getCoverIframeStyle(ads.bottom.autoplay, ads.bottom.youtube_scale)}
                        src={getYoutubeSrc(ads.bottom.youtube_id, ads.bottom.autoplay)} 
                        allow="autoplay; encrypted-media" 
                        allowFullScreen={!ads.bottom.autoplay}
                      ></iframe>
                      {ads.bottom.autoplay && (
                        <div 
                          onClick={() => setVideoModal({ isOpen: true, youtubeId: ads.bottom.youtube_id, linkUrl: ads.bottom.link_url, description: ads.bottom.description, fileUrl: ads.bottom.file_url })}
                          className="absolute inset-0 z-10 block cursor-pointer"
                        ></div>
                      )}
                    </div>
                  ) : ads.bottom.image_url ? (
                    <a href={ads.bottom.link_url || '#'} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bottom-8 block w-full">
                      <img src={ads.bottom.image_url} alt={ads.bottom.alt_text} className="w-full h-full object-cover border border-gray-200 rounded" />
                    </a>
                  ) : null}
                </div>
              )}
              
            </div>
          </div>
        </div>
      </main>

      {/* 🎥 [추가된 배너 4] 푸터 바로 위 전체 너비 (footer_top) */}
      {ads.footer_top?.is_visible && (
        <div className="max-w-7xl mx-auto px-4 mb-16">
          {ads.footer_top.is_youtube && ads.footer_top.youtube_id ? (
            <div className="relative w-full aspect-video sm:aspect-[21/9] md:aspect-[24/9] bg-black rounded overflow-hidden shadow-lg border border-gray-200">
              <iframe 
                style={getCoverIframeStyle(ads.footer_top.autoplay, ads.footer_top.youtube_scale)}
                src={getYoutubeSrc(ads.footer_top.youtube_id, ads.footer_top.autoplay)} 
                title={ads.footer_top.alt_text} 
                allow="autoplay; encrypted-media" 
                allowFullScreen={!ads.footer_top.autoplay}
              ></iframe>
              {ads.footer_top.autoplay && (
                <div 
                  onClick={() => setVideoModal({ isOpen: true, youtubeId: ads.footer_top.youtube_id, linkUrl: ads.footer_top.link_url, description: ads.footer_top.description, fileUrl: ads.footer_top.file_url })}
                  className="absolute inset-0 z-10 block cursor-pointer"
                ></div>
              )}
            </div>
          ) : ads.footer_top.image_url ? (
            <a href={ads.footer_top.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full">
              <img src={ads.footer_top.image_url} alt={ads.footer_top.alt_text} className="w-full h-auto object-cover rounded shadow-lg border border-gray-200" />
            </a>
          ) : null}
        </div>
      )}

      <footer className="bg-gray-50 text-gray-400 py-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="w-full lg:w-1/3">
            <h3 className="text-black font-bold uppercase tracking-widest mb-3">Newsletter</h3>
            <p className="text-sm mb-4">Get the latest intelligence delivered directly to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input type="email" placeholder="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded text-black focus:outline-none"/>
              <button type="submit" className="bg-blue-950 text-white px-6 py-2 rounded font-bold uppercase text-xs">Subscribe</button>
            </form>
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row justify-between gap-8 lg:gap-16">
            <div>
              <h2 className="text-base font-serif font-black text-gray-800 uppercase tracking-tighter">CEO Daily Brief</h2>
              <p className="text-xs font-serif italic mt-1">The Global Executive's Guide to South Korea.</p>
            </div>
            <div className="shrink-0"><Link href="/admin" className="inline-block bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-[10px] font-bold uppercase">Admin Login</Link></div>
          </div>
        </div>
      </footer>

      {/* 🎬 팝업 모달 UI (블랙 배경, 짙은 빨강 링크 버튼, 가짜 언어코드로 자막 끄기) */}
      {videoModal.isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" 
          onClick={() => setVideoModal({ isOpen: false, youtubeId: '' })}
        >
          <div className="relative w-full max-w-5xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setVideoModal({ isOpen: false, youtubeId: '' })}
              className="absolute -top-12 right-0 text-white font-bold text-3xl hover:text-gray-300 transition-colors"
              title="Close"
            >
              ✕
            </button>
            
            <div className="w-full aspect-video bg-black rounded-t-lg shadow-2xl overflow-hidden border border-gray-700">
              {/* 💡 cc_lang_pref=zz 트릭을 통해 존재하지 않는 자막을 호출하여 자막을 원천 차단 */}
              <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoModal.youtubeId}?autoplay=1&controls=1&rel=0&cc_load_policy=0&cc_lang_pref=zz`} 
                allow="autoplay; encrypted-media; fullscreen" 
                allowFullScreen
              ></iframe>
            </div>

            {(videoModal.description || videoModal.linkUrl || videoModal.fileUrl) && (
              <div className="bg-[#111] p-6 rounded-b-lg shadow-lg flex flex-col gap-4 border border-t-0 border-gray-700">
                {videoModal.description && (
                  <p className="text-white whitespace-pre-wrap leading-relaxed">{videoModal.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 mt-2">
                  {videoModal.linkUrl && (
                    <a 
                      href={videoModal.linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-red-800 text-white px-6 py-2.5 rounded-full font-bold hover:bg-red-900 transition shadow-sm text-sm"
                    >
                      웹페이지 링크 이동
                    </a>
                  )}
                  {videoModal.fileUrl && (
                    <a 
                      href={videoModal.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-gray-700 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-600 transition shadow-sm text-sm"
                    >
                      파일 다운로드 (Download)
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
