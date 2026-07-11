'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// 지원할 언어 목록 설정 (영어를 기본 원문으로 변경 및 요청하신 6개국어 추가)
const LANGUAGES = [
  { code: 'en', name: '🇺🇸 English (Original)' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'zh', name: '🇨🇳 中文' },
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'mn', name: '🇲🇳 Монгол' },
  { code: 'vi', name: '🇻🇳 Tiếng Việt' }
];

function ArticleContent() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 번역 관련 상태(State) - 영어를 기본값으로 설정
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
          // 처음 불러올 때 원본(영어) 텍스트 세팅
          setDisplayTitle(data.title);
          setDisplayContent(data.content);
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [articleId]);

  // 언어 변경 핸들러
  const handleLanguageChange = async (langCode: string) => {
    setCurrentLang(langCode);
    
    // 영어(Original)를 선택하면 원래 데이터로 복원
    if (langCode === 'en') {
      setDisplayTitle(article.title);
      setDisplayContent(article.content);
      return;
    }

    // 다른 언어를 선택했을 때 (번역 로직)
    setIsTranslating(true);
    try {
      // TODO: 실제 서비스 시 여기에 DeepL 또는 Google Translate API 호출 코드 작성
      alert(`선택하신 언어(${langCode})로 번역하기 위해서는 번역 API 연동이 필요합니다.\n현재는 테스트를 위해 원본 텍스트가 임시로 유지됩니다.`);
      
      setDisplayTitle(`[${langCode} 번역본] ${article.title}`);
      setDisplayContent(`<p className="p-4 bg-gray-100 text-sm border-l-4 border-red-800 mb-6 font-sans"><em>이 부분에 <b>${langCode}</b> 언어로 번역된 내용이 노출됩니다. (API 연동 필요)</em></p> ${article.content}`);
    } catch (error) {
      console.error("번역 중 오류 발생:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // 공유하기 핸들러
  const handleShare = async () => {
    const shareData = {
      title: displayTitle || article?.title,
      text: 'CEO Daily Brief에서 이 기사를 확인해보세요.',
      url: window.location.href,
    };

    // 모바일 기기 등 Web Share API를 지원하는 브라우저인 경우
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('공유하기 취소 또는 에러:', err);
      }
    } else {
      // Web Share API를 지원하지 않는 PC 브라우저 등의 경우 (클립보드 복사로 대체)
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('기사 링크가 클립보드에 복사되었습니다. 원하는 곳에 붙여넣기(Ctrl+V) 하세요.');
      } catch (err) {
        alert('링크 복사에 실패했습니다. URL 창의 주소를 직접 복사해주세요.');
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading article...</div>;
  if (!article) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black"><h1 className="text-2xl mb-4">기사를 찾을 수 없습니다.</h1><Link href="/" className="text-blue-600 underline">홈으로 돌아가기</Link></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      {/* 상단 미니 헤더 */}
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center">
        <Link href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </Link>
        <Link href={`/news?category=${encodeURIComponent(article.category)}`} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black">
          {article.category}
        </Link>
      </header>

      {/* 기사 본문 영역 */}
      <article className="max-w-3xl mx-auto px-4" style={{ display: 'block', textAlign: 'left' }}>
        
        {/* 카테고리 및 다국어 번역 / 공유 툴바 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase">
            {article.category}
          </span>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* 번역 드롭다운 */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <span className="text-xs text-gray-500 font-bold hidden sm:inline">Lang:</span>
              <select 
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isTranslating}
                className="bg-white border border-gray-300 text-xs font-bold py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black cursor-pointer disabled:opacity-50 flex-1"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            
            {/* 공유하기 버튼 */}
            <button 
              onClick={handleShare}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-bold py-1.5 px-4 rounded-md transition-colors flex items-center gap-1 shrink-0"
              title="이 기사 공유하기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share
            </button>
          </div>
        </div>

        {isTranslating && <div className="text-xs text-red-600 animate-pulse mb-4 font-bold">Translating article... Please wait.</div>}

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

        {/* 본문 콘텐츠 */}
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
