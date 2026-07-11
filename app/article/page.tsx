'use client';

import { useEffect, useState, Suspense } from 'react';
// Next.js 및 Supabase 등 외부 모듈 에러를 피하기 위해 가상 환경용 임시 import 설정
// 실제 코드에서는 원래 경로를 사용해야 합니다.
// import { supabase } from '@/utils/supabase';
// import Link from 'next/link';
// import { useSearchParams } from 'next/navigation';

// 가상 환경용 대체 컴포넌트 및 모듈 (미리보기 화면용)
const Link = ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>;
const useSearchParams = () => ({ get: () => 'test-id' });
const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({
          data: {
            id: 'test-id',
            title: 'Samsung Unveils Next-Gen AI Chips for Data Centers',
            content: '<p>Samsung Electronics today announced its latest generation of AI-optimized semiconductors...</p><p>This marks a significant milestone in the competitive landscape of AI hardware.</p>',
            category: 'Tech & Innovation',
            author_name: 'Editor-in-Chief',
            image_url: 'https://via.placeholder.com/800x400.png?text=Article+Image',
            created_at: new Date().toISOString()
          }
        })
      })
    })
  })
};

// 지원 언어 목록
const LANGUAGES = [
  { code: 'en', name: '🇺🇸 English (Original)' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'zh-CN', name: '🇨🇳 中文' }, // 구글 번역 API 중국어 코드 (zh-CN)
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'mn', name: '🇲🇳 Монгол' },
  { code: 'vi', name: '🇻🇳 Tiếng Việt' }
];

function ArticleContent() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentLang, setCurrentLang] = useState('en');
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        // 원래 코드: const { data } = (await supabase.from('articles').select('*').eq('id', articleId).single()) as any;
        const { data } = (await supabase.from('articles').select('*').eq('id', articleId).single()) as any;
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
      // 1) 제목 번역 (GET 방식)
      const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(article.title)}`;
      const titleRes = await fetch(titleUrl);
      const titleData = await titleRes.json();
      const translatedTitle = titleData[0].map((item: any) => item[0]).join('');

      // 2) 긴 본문 번역 (HTML 태그 포함, POST 방식으로 우회)
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

      // 불필요한 안내 문구 없이 즉시 업데이트
      setDisplayTitle(translatedTitle);
      setDisplayContent(translatedContent);
      
    } catch (error) {
      console.error("Translation Error:", error);
      alert('번역 서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = async () => {
    let currentUrl = window.location.href;
    
    if (currentUrl.startsWith('blob:')) {
      currentUrl = `https://ceodailybrief.com/article?id=${article?.id}`;
    }

    const shareData = {
      title: displayTitle || article?.title,
      url: currentUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Not supported');
      }
    } catch (err) {
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
              Share
            </button>
          </div>
        </div>

        {isTranslating && <div className="text-[10px] text-red-600 mb-4 font-bold uppercase tracking-widest animate-pulse text-center">Translating...</div>}

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
