'use client';

import { useEffect, useState } from 'react'; //[cite: 2]
import { supabase } from '@/utils/supabase'; //[cite: 2]
import Link from 'next/link'; //[cite: 2]
import { useRouter } from 'next/navigation'; // 검색 라우팅을 위해 추가

export default function CEODailyBrief() {
  const router = useRouter();
  const [headlines, setHeadlines] = useState<any>({ MAIN_HERO: null, SUB_1: null, SUB_2: null }); //[cite: 2]
  const [briefingArticles, setBriefingArticles] = useState<any[]>([]); //[cite: 2]
  const [isLoading, setIsLoading] = useState(true); //[cite: 2]
  
  // 검색어 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  // 이메일 구독 상태 관리
  const [email, setEmail] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', { //[cite: 2]
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' //[cite: 2]
  }).toUpperCase(); //[cite: 2]

  const formatTime = (dateString: string) => { //[cite: 2]
    return new Date(dateString).toLocaleDateString('en-US', { //[cite: 2]
      year: 'numeric', month: 'short', day: 'numeric' //[cite: 2]
    }).toUpperCase(); //[cite: 2]
  }; //[cite: 2]

  useEffect(() => { //[cite: 2]
    const fetchNews = async () => { //[cite: 2]
      const { data: headlineMap } = await supabase.from('headlines').select('*'); //[cite: 2]
      const { data: articles } = await supabase //[cite: 2]
        .from('articles') //[cite: 2]
        .select('*') //[cite: 2]
        .eq('is_published', true) //[cite: 2]
        .order('created_at', { ascending: false }); //[cite: 2]

      if (articles && headlineMap) { //[cite: 2]
        const newHeadlines = { MAIN_HERO: null, SUB_1: null, SUB_2: null }; //[cite: 2]
        const usedArticleIds = new Set(); //[cite: 2]
        
        headlineMap.forEach(h => { //[cite: 2]
          const matchedArticle = articles.find(a => a.id === h.article_id); //[cite: 2]
          if (matchedArticle) { //[cite: 2]
            newHeadlines[h.position as keyof typeof newHeadlines] = matchedArticle; //[cite: 2]
            usedArticleIds.add(matchedArticle.id); //[cite: 2]
          } //[cite: 2]
        }); //[cite: 2]
        setHeadlines(newHeadlines); //[cite: 2]

        const remainingArticles = articles.filter(a => !usedArticleIds.has(a.id)).slice(0, 7); //[cite: 2]
        setBriefingArticles(remainingArticles); //[cite: 2]
      } //[cite: 2]
      setIsLoading(false); //[cite: 2]
    }; //[cite: 2]

    fetchNews(); //[cite: 2]
  }, []); //[cite: 2]

  const categories = [ //[cite: 2]
    "Politics & Policy", "Economy & Markets", "Chaebol & Industry",  //[cite: 2]
    "Tech & Innovation", "K-Culture & Society", "K-Beauty" //[cite: 2]
  ]; //[cite: 2]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/news?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // TODO: Supabase의 'subscribers' 테이블에 이메일 저장 로직 추가
    alert(`${email} 구독이 완료되었습니다!`);
    setEmail('');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading CEO Daily Brief...</div>; //[cite: 2]

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2">
          <span>{currentDate}</span>
          
          {/* 검색창 및 All News 버튼 영역 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Search news..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-l-md text-black focus:outline-none focus:border-black w-full sm:w-48"
              />
              <button type="submit" className="bg-black text-white px-3 py-1.5 rounded-r-md hover:bg-gray-800 transition-colors">
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

        <nav className="border-y border-gray-300 py-3 mt-6">
          <ul className="flex flex-col sm:flex-row justify-start sm:justify-center items-start sm:items-center gap-3 sm:gap-6 md:gap-8 text-[11px] sm:text-sm md:text-[15px] font-bold tracking-widest uppercase px-2 sm:px-0">
            {categories.map(cat => ( //[cite: 2]
              <li key={cat} className="w-full sm:w-auto text-left">
                <Link href={`/news?category=${encodeURIComponent(cat)}`} className="hover:text-red-800 cursor-pointer transition-colors block w-full">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* 메인 뉴스 영역은 기존과 동일하게 유지 */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 border-b border-gray-300 pb-8 sm:pb-12">
          
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            {headlines.MAIN_HERO ? ( //[cite: 2]
              <Link href={`/article?id=${headlines.MAIN_HERO.id}`}>
                <article className="group cursor-pointer">
                  {headlines.MAIN_HERO.image_url && ( //[cite: 2]
                    <div className="w-full bg-gray-100 mb-4 sm:mb-6 overflow-hidden rounded">
                      <img 
                        src={headlines.MAIN_HERO.image_url}  //[cite: 2]
                        alt="Lead story" //[cite: 2]
                        className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[20%]" //[cite: 2]
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
            ) : ( //[cite: 2]
              <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-serif italic text-xl">
                No Lead Story Published Yet. 
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-0">
              {[headlines.SUB_1, headlines.SUB_2].map((subArticle, idx) => ( //[cite: 2]
                subArticle ? ( //[cite: 2]
                  <Link key={idx} href={`/article?id=${subArticle.id}`}>
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && ( //[cite: 2]
                        <div className="w-full bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded">
                          <img 
                            src={subArticle.image_url}  //[cite: 2]
                            alt={subArticle.title} //[cite: 2]
                            className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]" //[cite: 2]
                          />
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">
                        {subArticle.title} 
                      </h3>
                    </article>
                  </Link>
                ) : null //[cite: 2]
              ))}
            </div>
          </div>

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
              
              {briefingArticles.length > 0 ? ( //[cite: 2]
                <ul className="flex flex-col gap-4 sm:gap-6">
                  {briefingArticles.map((article) => ( //[cite: 2]
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
              ) : ( //[cite: 2]
                <p className="text-sm font-serif italic text-gray-500">
                  Awaiting breaking news updates. (새 기사를 작성하면 이곳에 표시됩니다) 
                </p>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* 푸터 영역에 뉴스레터 구독 UI 추가 */}
      <footer className="bg-gray-50 text-gray-400 py-10 border-t border-gray-200">
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
              <button type="submit" className="bg-black text-white px-6 py-2 rounded font-bold uppercase text-xs tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
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
