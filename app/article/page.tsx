'use client';

import { useEffect, useState, Suspense } from 'react';
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
    const fetchArticle = async () => {
      if (!articleId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', articleId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setArticle(data);
          setDisplayTitle(data.title);
          setDisplayContent(data.content);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
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
      const titleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(article.title)}`;
      const titleRes = await fetch(titleUrl);
      const titleData = await titleRes.json();
      const translatedTitle = titleData[0].map((item: any) => item[0]).join('');

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
      alert('번역 서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = async () => {
    let currentUrl = window.location.href;

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
        alert('링크가 클립보드에 복사되었습니다.');
      } catch (clipboardErr) {
        alert('링크 복사에 실패했습니다.');
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black font-bold">Loading...</div>;
  
  if (!article) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black">
      <h1 className="text-2xl mb-4 font-bold">기사를 찾을 수 없습니다.</h1>
      <Link href="/" className="text-blue-600 underline font-bold">메인으로 돌아가기</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans pb-20">
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center">
        <Link href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </Link>
        <Link href={`/news?category=${encodeURIComponent(article.category)}`} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black">
          {article.category}
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-4">
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

        <div className="mb-10 text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words text-left">
            {displayTitle}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3 w-full justify-start">
            <span className="font-bold text-black font-sans uppercase not-italic">By {article.author_name}</span>
            <span>|</span>
            <span>{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
          </div>
        </div>

        {article.image_url && (
          <div className="mb-12 w-full">
            <img src={article.image_url} alt="Main" className="w-full h-auto object-cover rounded-sm" />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-loose text-left"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      </article>
    </div>
  );
}

export default function ArticleReadPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-black font-bold">Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
