'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// 지원 언어 목록
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
  // Vercel 타입 에러 (Expected 0 arguments) 방지
  const searchParams = useSearchParams() as any;
  const articleId = searchParams?.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 번역 상태 관리
  const [currentLang, setCurrentLang] = useState('en');
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // 1. 실제 Supabase 데이터 연동 (가짜 데이터 없음)
  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          // Vercel 타입 에러 (unknown) 방지
          const { data } = (await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single()) as any;

          if (data) {
            setArticle(data);
            setDisplayTitle(data.title);
            setDisplayContent(data.content);
          }
        } catch (error) {
          console.error("Fetch Error:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArticle();
    } else {
      setIsLoading(false);
    }
  }, [articleId]);

  // 2. 구글 무료 번역 API (GTX) 연동
  const handleLanguageChange = async (langCode: string) => {
    setCurrentLang(langCode);
    
    if (langCode === 'en' && article) {
      setDisplayTitle(article.title);
      setDisplayContent(article.content);
      return;
    }
    
    if (!article) return;

    setIsTranslating(true);
    try {
      // 제목 번역 (GET)
      const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(article.title)}`;
      const titleRes = await fetch(titleUrl);
      const titleData = await titleRes.json();
      const translatedTitle = titleData[0].map((item: any) => item[0]).join('');

      // 본문 번역 (POST)
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

      setDisplayTitle(translatedTitle);
      setDisplayContent(translatedContent);
    } catch (error) {
      console.error("Translation Error:", error);
      alert('번역 서버와의 통신에 실패했습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. 공유하기 기능 (Vercel window is not defined 에러 완벽 차단)
  const handleShare = async () => {
    // SSR 빌드 시 window 객체 접근 원천 차단
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    const shareData = {
      title: displayTitle || article?.title,
      url: currentUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(currentUrl);
          alert('기사 링크가 클립보드에 복사되었습니다.');
        }
      } catch (clipboardErr) {
        alert('링크 복사에 실패했습니다.');
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black text-xs font-bold uppercase tracking-widest">Loading Intelligence...</div>;
  if (!article) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black px-4"><h1 className="text-xl font-bold mb-4 font-serif">Briefing Not Found</h1><Link href="/" className="text-red-800 text-sm font-bold uppercase tracking-widest hover:underline">&larr; Return to HQ</Link></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center bg-white sticky top-0 z-50">
        <Link href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </Link>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
          {article.category}
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4" style={{ display: 'block', textAlign: 'left' }}>
        
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

        {isTranslating && (
          <div className="text-[10px] text-red-600 mb-6 font-bold uppercase tracking-widest animate-pulse text-center">
            Translating for Global Compliance...
          </div>
        )}

        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words tracking-tight text-gray-900" style={{ textAlign: 'left', width: '100%' }}>
            {displayTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3 w-full" style={{ justifyContent: 'flex-start' }}>
            <span className="font-bold text-black font-sans uppercase not-italic">By {article.author_name || "Editor-in-Chief"}</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span>Published: {new Date(article.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
          </div>
        </div>

        {article.image_url && (
          <div className="mb-12 w-full">
            <img src={article.image_url} alt="Briefing Visual" className="w-full h-auto object-cover rounded-sm grayscale-[10%] shadow-sm" />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-[1.8] prose-p:mb-6 prose-headings:font-black prose-a:text-red-700 hover:prose-a:text-red-900 transition-colors"
          style={{ textAlign: 'left' }}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        
        <div className="mt-20 pt-10 border-t border-gray-200 text-center">
          <Link href="/" className="text-sm font-bold uppercase tracking-widest hover:text-red-800 transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>
      </article>
    </div>
  );
}

// Next.js 빌드 에러 방지를 위해 Suspense 필수 적용
export default function ArticleReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black text-xs font-bold uppercase tracking-widest">Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
