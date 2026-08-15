import React, { useEffect, useState } from 'react';

// 브라우저 환경(현재 편집기)에서 돌아가도록 수정
// 1. Supabase 모킹 (실제 연결 제외, 더미 데이터 제공)
// 2. Next.js Link/useRouter 대신 기본 <a> 태그 및 단순 이벤트 처리로 변경

export default function CEODailyBrief() {
  const [headlines, setHeadlines] = useState({ 
    MAIN_HERO: null, 
    SUB_1: null, 
    SUB_2: null, 
    SUB_3: null, 
    SUB_4: null, 
    SUB_5: null, 
    SUB_6: null 
  });
  
  const [briefingArticles, setBriefingArticles] = useState([]);
  const [bestArticles, setBestArticles] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).toUpperCase();

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).toUpperCase();
  };

  const getDisplayText = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field; 
    return field.en || field.ko || Object.values(field)[0] || '';
  };

  useEffect(() => {
    // 💡 에러 수정을 위해 더미 데이터로 대체합니다 (Supabase 대체)
    const fetchNewsMock = () => {
      setTimeout(() => {
        const dummyCategories = [
          {id: 1, name: 'POLITICS & POLICY'},
          {id: 2, name: 'ECONOMY & MARKETS'},
          {id: 3, name: 'CHAEBOL & INDUSTRY'},
          {id: 4, name: 'TECH & INNOVATION'},
          {id: 5, name: 'K-CULTURE & SOCIETY'},
          {id: 6, name: 'K-BEAUTY TRENDS'}
        ];
        
        const dummyMainArticle = {
          id: 1,
          category: 'K-CULTURE & SOCIETY',
          title: '[Editorial] The Weight of Decision: A CEO Is Built to Decide',
          image_url: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // 대체 이미지
          created_at: '2026-08-15T00:00:00Z'
        };

        const dummySubArticles = [
          { id: 2, category: 'POLITICS & POLICY', title: '[Editorial] Unification, the Forgotten Zeitgeist and the 5,000-Year Territorial Destiny', image_url: 'https://images.unsplash.com/photo-1541872526868-ed7331584b42?w=500&q=80', created_at: '2026-08-14' },
          { id: 3, category: 'K-BEAUTY TRENDS', title: 'The Paradigm Shift from Topical Cosmetics to Medical Aesthetics: Skin Boosters Lead the Way', image_url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71c9?w=500&q=80', created_at: '2026-08-14' },
          { id: 4, category: 'CHAEBOL & INDUSTRY', title: 'The New Beauty Hegemony: How South Korea is Challenging France\'s Global Empire', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80', created_at: '2026-08-13' },
          { id: 5, category: 'ECONOMY & MARKETS', title: '[Editorial] The Unvarnished Truth of the Korean Economy', image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80', created_at: '2026-08-13' },
          { id: 6, category: 'POLITICS & POLICY', title: '[Op-Ed] Why the South Korean Government Has No Choice But to Rely on Samsung and SK for Semiconductor Investments', image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80', created_at: '2026-08-12' },
          { id: 7, category: 'K-CULTURE & SOCIETY', title: '[Editorial] The Archetype of "Great Leadership" Koreans Crave', image_url: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?w=500&q=80', created_at: '2026-08-12' }
        ];

        const dummyBriefings = [
          { id: 8, category: 'TECH & INNOVATION', title: 'A Natural Guided Missile of Beneficial Bacteria Found in Infant Oral Cavities' },
          ...dummySubArticles.slice(0, 5)
        ];

        const dummyTop = [
          { id: 7, category: 'K-CULTURE & SOCIETY', title: '[Editorial] The Archetype of "Great Leadership" Koreans Crave' },
          { id: 5, category: 'ECONOMY & MARKETS', title: '[Editorial] The Unvarnished Truth of the Korean Economy' },
          { id: 6, category: 'POLITICS & POLICY', title: '[Op-Ed] Why the South Korean Government Has No Choice But to Rely on Samsung and SK for Semiconductor Investments' },
          { id: 4, category: 'CHAEBOL & INDUSTRY', title: 'The New Beauty Hegemony: How South Korea is Challenging France\'s Global Empire' },
          { id: 3, category: 'K-BEAUTY TRENDS', title: 'The Paradigm Shift from Topical Cosmetics to Medical Aesthetics: Skin Boosters Lead the Way' },
          { id: 8, category: 'TECH & INNOVATION', title: 'A Natural Guided Missile of Beneficial Bacteria Found in Infant Oral Cavities' }
        ];

        setDbCategories(dummyCategories);
        setHeadlines({
          MAIN_HERO: dummyMainArticle,
          SUB_1: dummySubArticles[0],
          SUB_2: dummySubArticles[1],
          SUB_3: dummySubArticles[2],
          SUB_4: dummySubArticles[3],
          SUB_5: dummySubArticles[4],
          SUB_6: dummySubArticles[5]
        });
        setBriefingArticles(dummyBriefings);
        setBestArticles(dummyTop);
        setIsLoading(false);

      }, 500); // 약간의 로딩 지연 에뮬레이션
    };

    fetchNewsMock();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Search for: ${searchQuery}`);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    alert(`${email} 구독이 완료되었습니다!`);
    setEmail('');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black font-serif italic text-xl">Loading CEO Daily Brief...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      {}
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
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="bg-blue-950 text-white px-4 py-1.5 rounded-md shadow-sm hover:bg-blue-800 transition-colors text-center w-full sm:w-auto"
            >
              All News
            </a>
          </div>
        </div>
        
        <div className="text-center py-6 sm:py-8 cursor-pointer border-none">
          <a href="#" onClick={(e) => e.preventDefault()}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-serif tracking-tighter uppercase leading-none break-words hover:text-gray-800 transition-colors" style={{ letterSpacing: '-0.05em' }}>
              CEO Daily Brief
            </h1>
          </a>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-lg font-serif italic text-gray-600 px-2">
            The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence
          </p>
        </div>

        <nav className="border-y border-gray-300 py-3 mt-6">
          <ul className="flex flex-col sm:flex-row justify-start sm:justify-center items-start sm:items-center gap-3 sm:gap-6 md:gap-8 text-[11px] sm:text-sm md:text-[15px] font-bold tracking-widest uppercase px-2 sm:px-0">
            {dbCategories.map(cat => (
              <li key={cat.id} className="w-full sm:w-auto text-left">
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-red-800 cursor-pointer transition-colors block w-full">
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 sm:pb-12 items-start">
          
          {}
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            {headlines.MAIN_HERO ? (
              <a href="#" onClick={(e) => e.preventDefault()} className="block">
                <article className="group cursor-pointer">
                  {headlines.MAIN_HERO.image_url && (
                    <div className="w-full bg-gray-100 mb-4 sm:mb-6 overflow-hidden rounded">
                      <img 
                        src={headlines.MAIN_HERO.image_url} 
                        alt="Lead story" 
                        // 세로 이미지가 너무 길게 차지하지 않도록 max-height 설정. 원본 비율 유지
                        className="w-full max-h-[800px] object-cover object-top group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[20%]"
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
              </a>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-serif italic text-xl">
                No Lead Story Published Yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-0">
              {[
                headlines.SUB_1, headlines.SUB_2, headlines.SUB_3, 
                headlines.SUB_4, headlines.SUB_5, headlines.SUB_6
              ].map((subArticle, idx) => (
                subArticle ? (
                  <a key={idx} href="#" onClick={(e) => e.preventDefault()} className="block">
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && (
                        <div className="w-full bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded aspect-[3/2]">
                          <img 
                            src={subArticle.image_url} 
                            alt={getDisplayText(subArticle.title)} 
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]"
                          />
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
                      <h3 className="text-xl sm:text-lg font-bold font-serif leading-snug group-hover:text-red-800 transition-colors">
                        {getDisplayText(subArticle.title)}
                      </h3>
                    </article>
                  </a>
                ) : null
              ))}
            </div>
          </div>

          {}
          {/* 💡 flex-1, h-full 등을 제거하고 items-start로 변경하여 공간이 불필요하게 늘어나지 않게 함 */}
          <div className="lg:col-span-4 flex flex-col gap-8 sm:gap-12">
            
            {/* 1. EXECUTIVE BRIEFING */}
            <div className="px-2 sm:px-0">
              <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">
                  EXECUTIVE BRIEFING
                </h3>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-[10px] sm:text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase">
                  View All &rarr;
                </a>
              </div>
              
              {briefingArticles.length > 0 ? (
                <ul className="flex flex-col gap-4 sm:gap-5">
                  {briefingArticles.map((article, index) => (
                    <li key={`${article.id}-${index}`} className="relative pl-3 sm:pl-4 group cursor-pointer border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <span className="absolute left-0 top-1.5 sm:top-2 w-1.5 h-1.5 bg-red-800 rounded-full group-hover:scale-150 transition-transform"></span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="block">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                        <p className="text-sm sm:text-[15px] font-bold font-serif leading-snug group-hover:text-red-800 transition-colors text-gray-800">
                          {getDisplayText(article.title)}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-serif italic text-gray-500">
                  Awaiting breaking news updates.
                </p>
              )}
            </div>

            {/* 2. ADVERTISEMENT BANNER */}
            {/* 💡 요청하신 광고 배너 영역. 모바일에서는 300x250, 데스크탑에서는 300x600 사이즈로 자연스럽게 늘어남 */}
            <div className="px-2 sm:px-0 flex justify-center w-full my-4">
              <div className="w-full max-w-[300px] h-[250px] lg:h-[600px] bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer relative overflow-hidden group">
                <span className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase text-gray-400">Ad</span>
                <span className="text-[11px] font-bold tracking-widest uppercase mb-1">Advertisement</span>
                <span className="font-serif text-sm lg:text-base mb-1">300 × 250</span>
                <span className="font-serif text-xs lg:text-sm hidden lg:block text-gray-500">Half Page Banner (300 × 600)</span>
                {/* 💡 실제 광고 이미지가 들어갈 경우 이 아래에 <img> 태그 사용 */}
              </div>
            </div>

            {/* 3. MOST VIEWED */}
            <div className="px-2 sm:px-0">
              <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">
                  MOST VIEWED
                </h3>
              </div>
              
              {bestArticles.length > 0 ? (
                <ul className="flex flex-col gap-4 sm:gap-5">
                  {bestArticles.map((article, index) => (
                    <li key={article.id} className="relative pl-7 sm:pl-8 group cursor-pointer border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <span className="absolute left-0 top-0 text-gray-300 group-hover:text-red-800 transition-colors font-black text-2xl italic font-serif leading-none">
                        {index + 1}
                      </span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="block">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 tracking-wider">{article.category}</div>
                        <p className="text-sm sm:text-[15px] font-bold font-serif leading-snug group-hover:text-red-800 transition-colors text-gray-800">
                          {getDisplayText(article.title)}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-serif italic text-gray-500">
                  No popular articles yet.
                </p>
              )}
            </div>
            
          </div>

        </div>
      </main>

      {}
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
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row justify-between gap-8 lg:gap-16">
            <div>
              <h2 className="text-base font-serif font-black text-gray-800 uppercase tracking-tighter">CEO Daily Brief</h2>
              <p className="text-xs font-serif italic mt-1">The Global Executive's Guide to South Korea.</p>
            </div>
            
            <div className="shrink-0">
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-block bg-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-300 px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap">
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
