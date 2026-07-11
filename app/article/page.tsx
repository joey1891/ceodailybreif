'use client';

import { useEffect, useState, Suspense } from 'react';

// Mock dependencies for the preview environment
const Link = ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>;
const useSearchParams = () => new URLSearchParams(window.location.search);

// Mock Supabase data
const mockArticle = {
  id: 'b6d907db-c209-495f-b4c8-111111111111',
  title: 'South Korea Aims to Become Global Hub for AI Innovation by 2027',
  content: '<p>Seoul has announced an ambitious multi-billion dollar investment plan...</p>',
  category: 'Tech & Innovation',
  author_name: 'Editor-in-Chief',
  created_at: '2026-07-11T00:00:00Z',
  image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop'
};

const supabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          // Return mock data after a short delay to simulate network request
          await new Promise(resolve => setTimeout(resolve, 500));
          return { data: mockArticle, error: null };
        }
      })
    })
  })
};

// 지원 언어 목록 (영어가 원문, 6개국어 번역 지원)
const LANGUAGES = [
  { code: 'en', name: '🇺🇸 English (Original)' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'zh-CN', name: '🇨🇳 中文' },
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'mn', name: '🇲🇳 Монгол' },
  { code: 'vi', name: '🇻🇳 Tiếng Việt' }
];

function ArticleContent() {
  // Vercel 타입 에러 해결을 위해 as any 적용 (Expected 0 arguments 에러 방지)
  const searchParams = useSearchParams() as any;
  const articleId = searchParams?.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 번역 상태 관리
  const [currentLang, setCurrentLang] = useState('en');
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // 1. URL의 ID를 사용하여 실제 Supabase DB에서 기사를 실시간으로 가져오는 로직
  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          // Vercel 타입 에러 해결을 위해 as any 부여
          const { data, error } = (await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single()) as any;

          if (data) {
            setArticle(data);
            setDisplayTitle(data.title);
            setDisplayContent(data.content);
          } else if (error) {
            console.error("Supabase Error:", error);
          }
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArticle();
    } else {
      setIsLoading(false);
    }
  }, [articleId]);

  // 2. 구글 무료 번역 API 연동 (실제 DB 내용을 기반으로 번역)
  const handleLanguageChange = async (langCode: string) => {
    if (!article) return;
    setCurrentLang(langCode);
    
    // 원문(영어) 선택 시 DB 원본 데이터로 복구
    if (langCode === 'en') {
      setDisplayTitle(article.title);
      setDisplayContent(article.content);
      return;
    }
    
    setIsTranslating(true);
    try {
      // 제목 번역
      const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(article.title)}`;
      const titleRes = await fetch(titleUrl);
      const titleData = await titleRes.json();
      const translatedTitle = titleData[0].map((item: any) => item[0]).join('');

      // 본문 번역 (HTML 태그 대응 POST 방식)
      const contentRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ q: article.content }),
      });
      const contentData = await contentRes.json();
      const translatedContent = contentData[0].map((item: any) => item[0]).join('');

      setDisplayTitle(translatedTitle);
      setDisplayContent(translatedContent);
    } catch (error) {
      console.error("Translation Error:", error);
      alert('Translation failed. Please try again later.');
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. 공유하기 기능
  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: displayTitle || article?.title, url: currentUrl });
      } else {
        await navigator.clipboard.writeText(currentUrl);
        alert('Article link copied to clipboard.');
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading article...</div>;
  if (!article) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black"><h1 className="text-xl font-bold">Article not found.</h1><Link href="/" className="text-red-800 underline mt-4">Return Home</Link></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans pb-20">
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center bg-white sticky top-0 z-50">
        <Link href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </Link>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:inline">
          South Korea&apos;s Business Intelligence
        </span>
      </header>

      <article className="max-w-3xl mx-auto px-4 text-left">
        {/* 상단 카테고리 및 도구 모음 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase">
            {article.category}
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isTranslating}
              className="bg-white border border-gray-300 text-xs font-bold py-1.5 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button onClick={handleShare} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-4 rounded-md transition-colors flex items-center gap-1">
              Share
            </button>
          </div>
        </div>

        {/* 번역 중 표시 */}
        {isTranslating && (
          <div className="text-[10px] text-red-600 mb-4 font-bold uppercase tracking-widest animate-pulse text-center">
            Translating Content...
          </div>
        )}

        {/* 기사 헤더 */}
        <div className="mb-10 text-left">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 tracking-tight">
            {displayTitle}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3">
            <span className="font-bold text-black font-sans uppercase not-italic">By {article.author_name || "Editor-in-Chief"}</span>
            <span>|</span>
            <span>{new Date(article.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
          </div>
        </div>

        {/* 기사 이미지 */}
        {article.image_url && (
          <div className="mb-12 w-full">
            <img 
              src={article.image_url} 
              alt={displayTitle} 
              className="w-full h-auto object-cover rounded-sm grayscale-[10%]" 
            />
          </div>
        )}

        {/* 기사 본문 (HTML 렌더링) */}
        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-loose prose-p:mb-6 prose-headings:font-black prose-img:rounded"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        
        <div className="mt-20 pt-10 border-t border-gray-200 text-center">
          <Link href="/" className="text-sm font-bold uppercase tracking-widest hover:text-red-800 transition-colors">
            &larr; Back to Briefing
          </Link>
        </div>
      </article>
    </div>
  );
}

// Next.js 클라이언트 컴포넌트에서 useSearchParams 사용을 위해 Suspense로 감쌈
export default function ArticleReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black uppercase tracking-widest text-xs font-bold">Initializing Reader...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
