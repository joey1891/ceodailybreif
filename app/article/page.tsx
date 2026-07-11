'use client';

import React, { useEffect, useState, Suspense } from 'react';

// --- MOCK SUPABASE ---
// 미리보기 환경을 위해 Supabase DB 호출을 가짜(Mock) 데이터로 대체합니다.
// 실제 Vercel 환경에서는 이 부분을 제거하고 기존 import를 사용하셔야 합니다.
const MOCK_ARTICLE = {
  id: 'mock-123',
  category: 'Politics & Policy',
  title: 'Global Summit Concludes with New Climate Accords',
  author_name: 'Editor-in-Chief',
  created_at: new Date().toISOString(),
  image_url: 'https://images.unsplash.com/photo-1541872579768-f215fc4b0a41?auto=format&fit=crop&w=800&q=80',
  content: '<p>The international summit has wrapped up today...</p><p>Leaders have agreed on significant measures to combat climate change, pledging to reduce carbon emissions by 40% over the next decade.</p>'
};

const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: MOCK_ARTICLE }), 500);
          });
        }
      })
    })
  })
};
// ----------------------

// --- MOCK NEXT.JS ROUTER & LINK ---
// 미리보기 환경을 위해 Next.js의 Link와 useSearchParams를 가짜(Mock)로 대체합니다.
const Link = ({ href, children, className }: any) => (
  <a href={href} className={className} onClick={(e) => e.preventDefault()}>{children}</a>
);

const useSearchParams = () => ({
  get: (key: string) => (key === 'id' ? 'mock-123' : null),
});
// ----------------------

// 지원 언어 목록 (영어가 원문)
const LANGUAGES = [
  { code: 'en', name: '🇺🇸 English (Original)' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'zh-CN', name: '🇨🇳 中文' }, // 구글 번역 API 중국어 코드 수정 (zh -> zh-CN)
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'mn', name: '🇲🇳 Монгол' },
  { code: 'vi', name: '🇻🇳 Tiếng Việt' }
];

function ArticleContent() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 번역 렌더링용 상태 관리
  const [currentLang, setCurrentLang] = useState('en');
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const { data } = await supabase.from('articles').select('*').eq('id', articleId).single();
        if (data) {
          setArticle(data);
          setDisplayTitle(data.title);
          setDisplayContent(data.content);
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [articleId]);

  // 구글 무료 번역 API (GTX) 실제 연동 로직
  const handleLanguageChange = async (langCode: string) => {
    setCurrentLang(langCode);
    
    // 원문(영어) 선택 시 즉시 복구
    if (langCode === 'en' && article) {
      setDisplayTitle(article.title);
      setDisplayContent(article.content);
      return;
    }

    if (!article) return;

    setIsTranslating(true);
    try {
      // 1) 제목 번역 (GET 방식)
      const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(article.title)}`;
      const titleRes = await fetch(titleUrl);
      const titleData = await titleRes.json();
      const translatedTitle = titleData[0].map((item: any) => item[0]).join('');

      // 2) 긴 본문 번역 (HTML 태그 포함, POST 방식으로 우회)
      // 본문이 길 경우 GET URL 길이 제한에 걸릴 수 있으므로 POST 방식 사용
      const contentRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          q: article.content,
        }),
      });
      const contentData = await contentRes.json();
      const translatedContent = contentData[0].map((item: any) => item[0]).join('');

      // 불필요한 문구 없이 화면 즉시 업데이트
      setDisplayTitle(translatedTitle);
      setDisplayContent(translatedContent);
      
    } catch (error) {
      console.error("Translation Error:", error);
      alert('번역 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsTranslating(false);
    }
  };

  // 공유하기 기능
  const handleShare = async () => {
    let currentUrl = window.location.href;
    
    // 미리보기 환경(blob URL 등)에서 Share API가 Invalid URL 에러를 내는 것을 방지
    if (currentUrl.startsWith('blob:')) {
      currentUrl = `https://ceodailybrief.com/article?id=${article?.id || '123'}`;
    }

    const shareData = {
      title: displayTitle || article?.title,
      url: currentUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      console.error('Share failed or cancelled:', err);
      // 공유 기능이 실패하거나 지원하지 않는 경우 클립보드 복사로 자동 대체
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert('기사 링크가 클립보드에 복사되었습니다.');
      } catch (clipboardErr) {
        alert('링크 복사에 실패했습니다.');
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading article...</div>;
  if (!article) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black"><h1 className="text-2xl mb-4">기사를 찾을 수 없습니다.</h1><Link href="/" className="text-blue-600 underline">홈으로 돌아가기</Link></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center">
        <Link href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </Link>
        <Link href={`/news?category=${encodeURIComponent(article.category)}`} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black">
          {article.category}
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-4" style={{ display: 'block', textAlign: 'left' }}>
        
        {/* 툴바: 언어 선택 및 공유 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase">
            {article.category}
          </span>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isTranslating}
              className="bg-white border border-gray-300 text-xs font-bold py-1.5 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer disabled:opacity-50"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            
            <button 
              onClick={handleShare}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-4 rounded-md transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share
            </button>
          </div>
        </div>

        {isTranslating && <div className="text-[10px] text-red-600 mb-4 font-bold uppercase tracking-widest animate-pulse text-center">Translating...</div>}

        {/* 타이틀 및 메타 정보 */}
        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words" style={{ textAlign: 'left', width: '100%' }}>
            {displayTitle}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3 w-full" style={{ justifyContent: 'flex-start' }}>
            <span className="font-bold text-black font-sans uppercase not-italic">By {article.author_name}</span>
            <span>|</span>
            <span>Published: {new Date(article.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
          </div>
        </div>

        {article.image_url && (
          <div className="mb-12 w-full">
            <img src={article.image_url} alt="Article main" className="w-full h-auto object-cover rounded-sm grayscale-[10%]" />
          </div>
        )}

        {/* 본문 */}
        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-loose prose-p:mb-6 prose-img:rounded-sm prose-a:text-red-700 hover:prose-a:text-red-900"
          style={{ textAlign: 'left' }}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </article>
    </div>
  );
}

export default function ArticleReadPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-black">Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
