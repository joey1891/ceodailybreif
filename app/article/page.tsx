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
  const searchParams = useSearchParams() as any;
  const articleId = searchParams?.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentLang, setCurrentLang] = useState('en');
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const { data } = (await supabase.from('articles').select('*').eq('id', articleId).single()) as any;
        if (data) {
          setArticle(data);
          setDisplayTitle(data.title);
          setDisplayContent(data.content);
        }
        setIsLoading(false);
      };
      fetchArticle();
    } else {
      setIsLoading(false);
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
      // 1) 제목 번역
      const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(article.title)}`;
      const titleRes = await fetch(titleUrl);
      const titleData = await titleRes.json();
      const translatedTitle = titleData[0].map((item: any) => item[0]).join('');

      // 2) 본문 번역 (강화된 V2 HTML 쉴드 알고리즘)
      let textToTranslate = article.content;
      
      const blocks: string[] = [];
      const tags: string[] = [];

      // 구글 번역기가 절대 건드리지 못하는 특수 알파벳 마커 사용 (특수기호 완전 배제)
      const BLK_MKR = "XZBLKZX";
      const TAG_MKR = "XZTAGZX";

      // A. <style> 과 <script> 통째로 숨기기
      textToTranslate = textToTranslate.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, (match: string) => {
        blocks.push(match);
        return ` ${BLK_MKR}${blocks.length - 1}${BLK_MKR} `;
      });

      // B. 나머지 모든 HTML 태그 숨기기
      textToTranslate = textToTranslate.replace(/<[^>]+>/g, (match: string) => {
        tags.push(match);
        return ` ${TAG_MKR}${tags.length - 1}${TAG_MKR} `;
      });

      // C. 구글 번역 서버로 전송
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

      // D. 전각 숫자(일본어, 중국어 등) 해독 및 HTML 복구
      let finalHtml = translatedText;

      // 일본어/중국어 번역기가 만든 전각 숫자(１, ２)를 일반 숫자(1, 2)로 고쳐주는 마법의 함수
      const parseIndex = (str: string) => {
        const normalized = str.replace(/[０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
        return Number(normalized);
      };

      // 마커 사이에 있는 숫자(반각/전각 모두 포함)를 찾아내어 원래 HTML로 치환
      const tagRegex = new RegExp(`${TAG_MKR}\\s*([\\d０-９]+)\\s*${TAG_MKR}`, 'gi');
      const blockRegex = new RegExp(`${BLK_MKR}\\s*([\\d０-９]+)\\s*${BLK_MKR}`, 'gi');

      finalHtml = finalHtml.replace(tagRegex, (match: string, p1: string) => tags[parseIndex(p1)] || '');
      finalHtml = finalHtml.replace(blockRegex, (match: string, p1: string) => blocks[parseIndex(p1)] || '');

      // 혹시라도 남아있는 잔여 마커 클리닝
      finalHtml = finalHtml.replace(new RegExp(`${TAG_MKR}|${BLK_MKR}`, 'gi'), '');

      setDisplayTitle(translatedTitle);
      setDisplayContent(finalHtml);
      
    } catch (error) {
      console.error("Translation Error:", error);
      alert('번역 서버와의 통신에 실패했습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    let currentUrl = window.location.href;
    if (currentUrl.startsWith('blob:')) {
      currentUrl = `https://ceodailybrief.com/article?id=${article?.id}`;
    }

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
