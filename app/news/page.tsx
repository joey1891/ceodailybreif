'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function NewsListContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category'); // URL에서 카테고리 읽기[cite: 3]
  const searchQuery = searchParams.get('search'); // URL에서 검색어 읽기 추가

  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      
      if (searchQuery) {
        // 검색어가 있을 때: 이전에 DB에 생성한 search_articles 함수(RPC) 호출
        const { data, error } = await supabase
          .rpc('search_articles', { search_term: searchQuery });
          
        if (!error && data) {
          setArticles(data);
        }
      } else {
        // 검색어가 없을 때: 기존의 전체 목록 또는 카테고리 필터링 로직 실행[cite: 3]
        let query = supabase.from('articles').select('*').eq('is_published', true).order('created_at', { ascending: false });
        
        // 카테고리가 있으면 필터링[cite: 3]
        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query;
        if (!error && data) {
          setArticles(data);
        }
      }
      
      setIsLoading(false);
    };

    fetchArticles();
  }, [categoryFilter, searchQuery]); // 의존성 배열에 searchQuery 추가

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans">
      <header className="max-w-5xl mx-auto px-4 py-8 border-b-2 border-black text-center">
        <Link href="/" className="text-gray-500 text-sm hover:text-black font-bold uppercase tracking-widest mb-4 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black font-serif uppercase tracking-tighter">
          {searchQuery 
            ? `Search Results for "${searchQuery}"` 
            : categoryFilter 
              ? categoryFilter 
              : 'All News Archive'}
        </h1>
        {/* 검색 결과 건수 표시 */}
        {searchQuery && !isLoading && (
          <p className="mt-4 text-gray-500 font-bold">Total {articles.length} articles found</p>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-serif italic text-xl">
            {searchQuery 
              ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` 
              : '해당 조건에 등록된 기사가 없습니다.'}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {articles.map((article) => (
              <Link key={article.id} href={`/article?id=${article.id}`}>
                <article className="flex flex-col md:flex-row gap-6 group cursor-pointer border-b border-gray-200 pb-10">
                  {article.image_url && (
                    <div className="w-full md:w-1/3 h-48 bg-gray-200 overflow-hidden flex-shrink-0">
                      <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[20%]" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <span className="text-red-800 font-bold text-xs tracking-widest uppercase mb-2">{article.category}</span>
                    <h2 className="text-2xl md:text-3xl font-bold font-serif leading-snug group-hover:text-red-800 transition-colors mb-3">
                      {article.title}
                    </h2>
                    <p className="text-gray-600 font-serif line-clamp-2">
                      {article.content.replace(/<[^>]*>?/gm, '') /* HTML 태그 제거하고 텍스트만 미리보기 */}
                    </p>
                    <div className="text-xs font-bold text-gray-400 mt-4 uppercase">
                      {new Date(article.created_at).toLocaleDateString()} | By {article.author_name}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-black">Loading...</div>}>
      <NewsListContent />
    </Suspense>
  );
}
