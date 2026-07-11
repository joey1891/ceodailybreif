'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// 지원할 언어 목록 설정
const LANGUAGES = [
  { code: 'ko', name: '🇰🇷 한국어 (원본)' },
  { code: 'en', name: '🇺🇸 English' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'zh', name: '🇨🇳 中文' }
];

function ArticleContent() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 번역 관련 상태(State) 추가
  const [currentLang, setCurrentLang] = useState('ko');
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const { data } = await supabase.from('articles').select('*').eq('id', articleId).single();
        if (data) {
          setArticle(data);
          // 처음 불러올 때 원본 텍스트 세팅
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
    
    // 한국어(원본)를 선택하면 원래 데이터로 복원
    if (langCode === 'ko') {
      setDisplayTitle(article.title);
      setDisplayContent(article.content);
      return;
    }

    // 다른 언어를 선택했을 때 (번역 로직)
    setIsTranslating(true);
    try {
      /* 
       * 💡 실제 서비스에서는 여기에 DeepL이나 Google Cloud Translation API를 호출하는 코드가 들어갑니다.
       * 예시: const response = await fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: article.content, targetLang: langCode }) });
       * 지금은 API가 연결되어 있지 않으므로 알림창만 띄웁니다.
       */
      alert(`선택하신 언어(${langCode})로 번역하기 위해서는 번역 API 연동이 필요합니다.\n현재는 테스트를 위해 원본 텍스트가 유지됩니다.`);
      
      // 번역 완료 후 임시로 원본 유지 (나중에 API 응답값으로 교체)
      setDisplayTitle(`[${langCode}] ${article.title}`);
      setDisplayContent(`<p><em>이 문서는 <b>${langCode}</b> 언어로 번역된 결과물이 나타날 자리입니다. API를 연결해 주세요.</em></p> ${article.content}`);
    } catch (error) {
      console.error("번역 중 오류 발생:", error);
    } finally {
      setIsTranslating(false);
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
        
        {/* 카테고리 및 다국어 번역 툴바 */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase">
            {article.category}
          </span>
          
          {/* 번역 드롭다운 메뉴 추가 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold hidden sm:inline">Translate:</span>
            <select 
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isTranslating}
              className="bg-gray-100 border border-gray-200 text-xs font-bold py-1.5 px-3 rounded focus:outline-none focus:ring-1 focus:ring-black cursor-pointer disabled:opacity-50"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            {isTranslating && <span className="text-xs text-red-600 animate-pulse">번역 중...</span>}
          </div>
        </div>

        {/* 타이틀 및 메타 정보 */}
        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words" style={{ textAlign: 'left', width: '100%' }}>
            {displayTitle} {/* 원본 article.title 대신 displayTitle 사용 */}
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
          dangerouslySetInnerHTML={{ __html: displayContent }} // 원본 article.content 대신 displayContent 사용
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
