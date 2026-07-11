'use client'; // Vercel 배포 시 Client Component 인식을 위해 최상단에 필수입니다.

import React, { useEffect, useState, Suspense } from 'react';

// =====================================================================
// 🚀 Vercel 배포 시 필수 작업 🚀
// 실제 DB 연동과 Next.js 라우팅을 위해 아래 3줄의 주석(//)을 반드시 해제해 주세요.
// (현재는 미리보기 환경의 모듈 컴파일 오류 방지를 위해 주석 처리되어 있습니다.)
// =====================================================================
// import { supabase } from '@/utils/supabase';
// import Link from 'next/link';
// import { useSearchParams } from 'next/navigation';

// --- 오류 방지를 위한 안전한 폴백(Fallback) 선언 ---
const FallbackLink = (props: any) => <a href={props.href} className={props.className}>{props.children}</a>;
const fallbackUseSearchParams = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '?id=1');
const fallbackSupabase: any = null;

// 모듈이 활성화되었는지 확인하여 자동으로 연결합니다. (TS 오류 무시)
// @ts-ignore
const AppLink = typeof Link !== 'undefined' ? Link : FallbackLink;
// @ts-ignore
const appUseSearchParams = typeof useSearchParams !== 'undefined' ? useSearchParams : fallbackUseSearchParams;
// @ts-ignore
const appSupabase = typeof supabase !== 'undefined' ? supabase : fallbackSupabase;

function ArticleContent() {
  const searchParams = appUseSearchParams();
  const articleId = searchParams.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          // Supabase 모듈이 연결되어 있을 경우 (Vercel 환경)
          if (appSupabase) {
            const { data, error } = await appSupabase.from('articles').select('*').eq('id', articleId).single();
            if (error) throw error;
            if (data) setArticle(data);
          } else {
            // Supabase 모듈이 없을 경우 (미리보기 환경용 가짜 데이터)
            await new Promise(resolve => setTimeout(resolve, 500));
            setArticle({
              id: '1',
              category: 'Technology',
              title: 'The Future of Web Development: Trends to Watch in 2026',
              author_name: 'Jane Doe',
              created_at: new Date().toISOString(),
              image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80',
              content: `
                <p>The landscape of web development is constantly evolving, driven by rapid advancements in technology and shifting user expectations.</p>
                <h2>AI-Driven Development</h2>
                <p>Artificial Intelligence is no longer just a buzzword; it's becoming an integral part of the development workflow. From intelligent code completion to automated testing and debugging, AI tools are significantly boosting developer productivity.</p>
              `
            });
          }
        } catch (error) {
          console.error("기사를 불러오는 중 오류 발생:", error);
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
    if (typeof window === 'undefined') return;

    (window as any).googleTranslateElementInit = () => {
      const translateDiv = document.getElementById('google_translate_element');
      if (translateDiv) translateDiv.innerHTML = '';

      if ((window as any).google && (window as any).google.translate) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'ko,zh-CN,zh-TW,ja,ru,vi',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const addScript = document.createElement('script');
      addScript.id = 'google-translate-script';
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      addScript.async = true;
      document.body.appendChild(addScript);
    } else {
      if ((window as any).google && (window as any).google.translate) {
        setTimeout((window as any).googleTranslateElementInit, 100);
      }
    }
  }, []);

  const showToast = (message: string) => {
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

    const copyToClipboardFallback = async () => {
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 클립보드에 복사되었습니다.');
      } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('링크가 클립보드에 복사되었습니다.');
        } catch (e) {
          showToast('링크 복사에 실패했습니다.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          await copyToClipboardFallback();
        }
      }
    } else {
      await copyToClipboardFallback();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading article...</div>;
  }
  
  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black">
        <h1 className="text-2xl mb-4">기사를 찾을 수 없습니다.</h1>
        <AppLink href="/" className="text-blue-600 underline">홈으로 돌아가기</AppLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-20 relative">
      <style dangerouslySetInnerHTML={{
        __html: `
          .goog-te-banner-frame.skiptranslate { display: none !important; }
          body { top: 0px !important; }
          .goog-tooltip { display: none !important; }
          .goog-tooltip:hover { display: none !important; }
          .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
          .goog-te-gadget { color: transparent !important; font-size: 0px !important; }
          .goog-te-gadget img { display: none !important; }
          #google_translate_element select {
            appearance: none;
            background-color: transparent;
            border: 1px solid #d1d5db;
            padding: 0.35rem 2rem 0.35rem 0.75rem;
            border-radius: 9999px;
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
          #google_translate_element select:hover { border-color: #9ca3af; background-color: #f3f4f6; }
        `
      }} />

      {toast.show && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {toast.message}
        </div>
      )}

      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center bg-[#fcfcfc]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <AppLink href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
            CEO Daily Brief
          </AppLink>
          <AppLink href={`/news?category=${encodeURIComponent(article.category)}`} className="hidden md:block text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black">
            {article.category}
          </AppLink>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hidden sm:block">
              <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <div id="google_translate_element" className="inline-block notranslate"></div>
          </div>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          <button 
            onClick={handleShare}
            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600 hover:text-black"
            title="기사 공유하기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 block text-left">
        <div className="mb-10 flex flex-col items-start w-full text-left">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase mb-4 block text-left">
            {article.category}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words w-full text-left">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3 w-full justify-start">
            <span className="font-bold text-black font-sans uppercase not-italic">By {article.author_name}</span>
            <span className="hidden sm:inline">|</span>
            <span>Published: {new Date(article.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
          </div>
        </div>

        {article.image_url && (
          <div className="mb-12 w-full">
            <img src={article.image_url} alt="Article main" className="w-full h-auto object-cover rounded-sm grayscale-[10%]" />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-loose prose-p:mb-6 prose-img:rounded-sm prose-a:text-red-700 hover:prose-a:text-red-900 text-left"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}

export default function ArticleReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-black">Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
