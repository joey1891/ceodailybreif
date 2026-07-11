import React, { useEffect, useState, Suspense } from 'react';
import { Share2, Globe, Check } from 'lucide-react';

// Mock data to replace Supabase fetch in this standalone environment
const mockArticle = {
  id: '1',
  category: 'Technology',
  title: 'The Future of Web Development: Trends to Watch in 2026',
  author_name: 'Jane Doe',
  created_at: new Date().toISOString(),
  image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80',
  content: `
    <p>The landscape of web development is constantly evolving, driven by rapid advancements in technology and shifting user expectations. As we look towards the future, several key trends are poised to shape the way we build and interact with web applications.</p>
    <h2>AI-Driven Development</h2>
    <p>Artificial Intelligence is no longer just a buzzword; it's becoming an integral part of the development workflow. From intelligent code completion to automated testing and debugging, AI tools are significantly boosting developer productivity. Furthermore, AI-powered features within web applications, such as personalized content recommendations and conversational interfaces, are enhancing user experiences.</p>
    <h2>The Rise of WebAssembly</h2>
    <p>WebAssembly (Wasm) is breaking down performance barriers on the web, enabling developers to run computationally intensive applications, like video editing tools and complex games, directly in the browser at near-native speeds. This opens up a whole new realm of possibilities for web-based software.</p>
    <p>In conclusion, the future of web development is bright and full of exciting possibilities. By staying abreast of these emerging trends, developers can create more powerful, engaging, and accessible web experiences for users worldwide.</p>
  `
};

function ArticleContent() {
  // Using a mock ID instead of useSearchParams for this standalone version
  const articleId = '1';

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    // Simulating fetching data
    if (articleId) {
      const fetchArticle = async () => {
        try {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));
          setArticle(mockArticle);
        } catch (err) {
          console.error("Error fetching article:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArticle();
    } else {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    // 구글 번역 스크립트 중복 추가 방지 및 초기화 설정
    if (typeof window !== 'undefined' && !document.getElementById('google-translate-script')) {
      const addScript = document.createElement('script');
      addScript.id = 'google-translate-script';
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      addScript.async = true;
      document.body.appendChild(addScript);

      // 전역 콜백 함수 설정
      window.googleTranslateElementInit = () => {
        const translateDiv = document.getElementById('google_translate_element');
        if (translateDiv) translateDiv.innerHTML = ''; // React Strict 모드에서 중복 렌더링 방지

        if (window.google && window.google.translate) {
            new window.google.translate.TranslateElement(
            {
                pageLanguage: 'ko', // 기본 언어
                includedLanguages: 'ko,en,ja,zh-CN,es,fr,de,ru,ar', // 지원 언어 목록
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
            },
            'google_translate_element'
            );
        }
      };
    }
  }, []);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: article?.title || 'CEO Daily Brief Article',
      text: article?.title,
      url: url,
    };

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        // 네이티브 공유창이 떴으므로 토스트는 생략하거나 가볍게 표시
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      // 데스크탑 환경 또는 Share API 미지원 브라우저: 클립보드 복사
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 클립보드에 복사되었습니다.');
      } catch (err) {
        showToast('링크 복사에 실패했습니다.');
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading article...</div>;
  }
  
  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black">
        <h1 className="text-2xl mb-4">기사를 찾을 수 없습니다.</h1>
        <a href="#" className="text-blue-600 underline">홈으로 돌아가기</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-20 relative">
      
      {/* 구글 번역기 커스텀 스타일 주입 (디자인 최적화) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* 상단 구글 배너 숨기기 */
          .goog-te-banner-frame.skiptranslate { display: none !important; }
          body { top: 0px !important; }
          /* 번역 시 툴팁 및 하이라이트 효과 제거 */
          .goog-tooltip { display: none !important; }
          .goog-tooltip:hover { display: none !important; }
          .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
          
          /* 번역 셀렉트박스 커스텀 스타일링 */
          .goog-te-gadget { color: transparent !important; font-size: 0px !important; }
          .goog-te-gadget img { display: none !important; }
          #google_translate_element select {
            appearance: none;
            background-color: transparent;
            border: 1px solid #d1d5db;
            padding: 0.35rem 2rem 0.35rem 0.75rem;
            border-radius: 9999px; /* rounded-full */
            font-size: 0.75rem;
            font-weight: 600;
            color: #374151;
            cursor: pointer;
            outline: none;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23374151%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E');
            background-repeat: no-repeat;
            background-position: right 0.5rem top 50%;
            background-size: 0.8rem auto;
            transition: all 0.2s ease-in-out;
          }
          #google_translate_element select:hover {
            border-color: #9ca3af;
            background-color: #f3f4f6;
          }
        `
      }} />

      {/* 커스텀 토스트 알림 */}
      {toast.show && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300">
          <Check size={16} className="text-green-400" />
          {toast.message}
        </div>
      )}

      {/* 상단 미니 헤더 */}
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center bg-[#fcfcfc]/80 backdrop-blur-md sticky top-0 z-40">
        <a href="#" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </a>
        
        {/* 우측 유틸리티 액션 영역 (번역 & 공유) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 relative group">
            <Globe size={16} className="text-gray-500 hidden sm:block" />
            <div id="google_translate_element" className="inline-block notranslate"></div>
          </div>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          <button 
            onClick={handleShare}
            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600 hover:text-black"
            title="기사 공유하기"
            aria-label="기사 공유하기"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* 기사 본문 영역 */}
      <article className="max-w-3xl mx-auto px-4" style={{ display: 'block', textAlign: 'left' }}>
        
        {/* 타이틀 및 메타 정보 */}
        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          <a href="#">
            <span className="text-red-800 font-bold text-sm tracking-widest uppercase mb-4 block hover:text-red-900 transition-colors cursor-pointer" style={{ textAlign: 'left' }}>
              {article.category}
            </span>
          </a>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words" style={{ textAlign: 'left', width: '100%' }}>
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3 w-full" style={{ justifyContent: 'flex-start' }}>
            <span className="font-bold text-black font-sans uppercase not-italic tracking-wide">By {article.author_name}</span>
            <span className="hidden sm:inline">|</span>
            <span>Published: {new Date(article.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
          </div>
        </div>

        {article.image_url && (
          <div className="mb-12 w-full">
            <img src={article.image_url} alt="Article main" className="w-full h-auto object-cover rounded-sm grayscale-[10%] shadow-sm" />
          </div>
        )}

        {/* 본문 콘텐츠 */}
        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-loose prose-p:mb-6 prose-img:rounded-sm prose-a:text-red-700 hover:prose-a:text-red-900 prose-headings:font-sans prose-headings:font-bold"
          style={{ textAlign: 'left' }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-black font-sans">Loading page...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
