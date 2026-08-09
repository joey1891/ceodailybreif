'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams() as any;
  const articleId = searchParams?.get('id');
  const initialLang = searchParams?.get('lang') || 'en'; 

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentLang, setCurrentLang] = useState(initialLang);
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // 💡 폰트 최적화 로직: 아시아권 언어는 고딕체(sans), 나머지는 명조체(serif) 적용
  const isAsianLang = ['ko', 'ja', 'zh-CN', 'mn', 'vi'].includes(currentLang);
  const titleFontClass = isAsianLang ? 'font-sans font-black tracking-tight' : 'font-serif font-black';
  const bodyFontClass = isAsianLang 
    ? 'prose-p:font-sans prose-p:font-medium prose-p:tracking-wide prose-p:leading-relaxed' 
    : 'font-serif leading-loose';

  const getAvailableText = (articleData: any, fieldName: 'title' | 'content', targetLang: string) => {
    if (!articleData) return { text: '', hasExactLang: false };

    if (targetLang === 'en') {
      return { text: articleData[fieldName] || '', hasExactLang: true };
    }

    if (
      articleData.translations &&
      articleData.translations[targetLang] &&
      articleData.translations[targetLang][fieldName] &&
      articleData.translations[targetLang][fieldName].trim() !== ''
    ) {
      return { text: articleData.translations[targetLang][fieldName], hasExactLang: true };
    }

    return { text: articleData[fieldName] || '', hasExactLang: false };
  };

  const applyLanguage = async (articleData: any, langCode: string) => {
    setCurrentLang(langCode);
    
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('lang', langCode);
      window.history.replaceState({}, '', newUrl.toString());
    }

    const titleInfo = getAvailableText(articleData, 'title', langCode);
    const contentInfo = getAvailableText(articleData, 'content', langCode);

    if (titleInfo.hasExactLang && contentInfo.hasExactLang) {
      setDisplayTitle(titleInfo.text);
      setDisplayContent(contentInfo.text);
      return;
    }

    setIsTranslating(true);
    try {
      let translatedTitle = titleInfo.text;
      if (!titleInfo.hasExactLang && titleInfo.text) {
        const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(titleInfo.text)}`;
        const titleRes = await fetch(titleUrl);
        const titleData = await titleRes.json();
        translatedTitle = titleData[0].map((item: any) => item[0]).join('');
      }

      let finalHtml = contentInfo.text;
      if (!contentInfo.hasExactLang && contentInfo.text) {
        let textToTranslate = contentInfo.text;
        const blocks: string[] = [];
        const tags: string[] = [];

        textToTranslate = textToTranslate.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, (match: string) => {
          blocks.push(match);
          return ` __B${blocks.length - 1}__ `;
        });

        textToTranslate = textToTranslate.replace(/<[^>]+>/g, (match: string) => {
          tags.push(match);
          return ` __T${tags.length - 1}__ `;
        });

        const contentRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            q: textToTranslate,
          }),
        });
        const contentData = await contentRes.json();
        let translatedText = contentData[0].map((item: any) => item[0]).join('');

        const parseIndex = (str: string) => {
          const normalized = str.replace(/[０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
          return Number(normalized);
        };

        finalHtml = translatedText.replace(/__\s*T\s*([\d０-９]+)\s*__/gi, (match: string, p1: string) => tags[parseIndex(p1)] || '');
        finalHtml = finalHtml.replace(/__\s*B\s*([\d０-９]+)\s*__/gi, (match: string, p1: string) => blocks[parseIndex(p1)] || '');
        finalHtml = finalHtml.replace(/__\s*[TB]\s*[\d０-９]+\s*__/gi, '');
      }

      setDisplayTitle(translatedTitle);
      setDisplayContent(finalHtml);
      
    } catch (error) {
      console.error("Translation Error:", error);
      alert('번역 서버와의 통신에 실패했습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const { data } = (await supabase.from('articles').select('*').eq('id', articleId).single()) as any;
        if (data) {
          setArticle(data);
          applyLanguage(data, initialLang);
        }
        setIsLoading(false);
      };
      fetchArticle();
    } else {
      setIsLoading(false);
    }
  }, [articleId]);

  const handleLanguageChange = (langCode: string) => {
    if (!article) return;
    applyLanguage(article, langCode);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    const shareUrl = `https://ceodailybrief.com/article?id=${article?.id}&lang=${currentLang}`;

    const shareData = {
      title: displayTitle || article?.title,
      url: shareUrl,
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
          await navigator.clipboard.writeText(shareUrl);
          alert('기사 링크가 클립보드에 복사되었습니다.');
        }
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
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share
            </button>
          </div>
        </div>

        {isTranslating && <div className="text-[10px] text-red-600 mb-4 font-bold uppercase tracking-widest animate-pulse text-center">Translating...</div>}

        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          {/* 💡 폰트 클래스 동적 적용 */}
          <h1 className={`text-4xl md:text-5xl lg:text-6xl leading-[1.15] mb-6 break-words ${titleFontClass}`} style={{ textAlign: 'left', width: '100%' }}>
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

        {/* 💡 본문 폰트 클래스 동적 적용 */}
        <div 
          className={`prose prose-lg max-w-none text-gray-800 prose-img:rounded-sm prose-a:text-red-700 hover:prose-a:text-red-900 ${bodyFontClass}`}
          style={{ textAlign: 'left' }}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </article>
    </div>
  );
}

export default function ArticleClient() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-black">Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
