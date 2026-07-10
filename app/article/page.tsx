'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ArticleContent() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const { data } = await supabase.from('articles').select('*').eq('id', articleId).single();
        if (data) setArticle(data);
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [articleId]);

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
      {/* 강제 block 처리 및 텍스트 좌측 정렬 */}
      <article className="max-w-3xl mx-auto px-4" style={{ display: 'block', textAlign: 'left' }}>
        
        {/* 타이틀 및 메타 정보 (인라인 스타일로 강제 좌측 정렬) */}
        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase mb-4 block" style={{ textAlign: 'left' }}>
            {article.category}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.15] mb-6 break-words" style={{ textAlign: 'left', width: '100%' }}>
            {article.title}
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

        {/* 
          본문 콘텐츠 
        */}
        <div 
          className="prose prose-lg max-w-none font-serif text-gray-800 leading-loose prose-p:mb-6 prose-img:rounded-sm prose-a:text-red-700 hover:prose-a:text-red-900"
          style={{ textAlign: 'left' }}
          dangerouslySetInnerHTML={{ __html: article.content }}
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
