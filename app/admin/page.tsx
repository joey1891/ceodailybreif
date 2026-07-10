'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
  });
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      // 1. 전체 기사 통계 가져오기
      const { data: allArticles, error } = await supabase
        .from('articles')
        .select('id, is_published, title, category, created_at')
        .order('created_at', { ascending: false });

      if (allArticles && !error) {
        const publishedCount = allArticles.filter(a => a.is_published).length;
        
        setStats({
          total: allArticles.length,
          published: publishedCount,
          drafts: allArticles.length - publishedCount,
        });

        // 2. 최근 작성된 기사 5개만 추출
        setRecentArticles(allArticles.slice(0, 5));
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500 font-bold">대시보드 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      
      {/* 1. 환영 메시지 */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-black font-serif text-black mb-2 tracking-tight">Welcome, Editor-in-Chief!</h1>
        <p className="text-gray-500 font-bold">CEO Daily Brief 관리자 시스템에 오신 것을 환영합니다. 오늘의 주요 뉴스를 확인하고 배치하세요.</p>
      </div>

      {/* 2. 빠른 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center">
          <span className="text-gray-500 font-bold text-sm mb-2 uppercase tracking-widest">총 작성된 기사</span>
          <span className="text-4xl font-black text-black">{stats.total}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-black flex flex-col justify-center items-center">
          <span className="text-gray-500 font-bold text-sm mb-2 uppercase tracking-widest">발행 완료 (Public)</span>
          <span className="text-4xl font-black text-black">{stats.published}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-red-600 flex flex-col justify-center items-center">
          <span className="text-red-800 font-bold text-sm mb-2 uppercase tracking-widest">임시 저장 (Drafts)</span>
          <span className="text-4xl font-black text-red-600">{stats.drafts}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 3. 빠른 액션 메뉴 */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-black mb-6 border-b pb-4">바로가기 (Quick Actions)</h2>
          <div className="space-y-4">
            <Link href="/admin/write" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-black hover:text-white transition-colors group border border-gray-200">
              <span className="font-bold">📝 새 기사 작성하기</span>
              <span className="text-gray-400 group-hover:text-white">→</span>
            </Link>
            <Link href="/admin/headlines" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-black hover:text-white transition-colors group border border-gray-200">
              <span className="font-bold">⭐ 1면 메인 헤드라인 편집</span>
              <span className="text-gray-400 group-hover:text-white">→</span>
            </Link>
            <Link href="/admin/articles" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-black hover:text-white transition-colors group border border-gray-200">
              <span className="font-bold">📚 전체 기사 목록 관리</span>
              <span className="text-gray-400 group-hover:text-white">→</span>
            </Link>
          </div>
        </div>

        {/* 4. 최근 활동 (최신 기사 5개) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-black">최근 작업한 기사</h2>
            <Link href="/admin/articles" className="text-sm font-bold text-gray-500 hover:text-black">전체보기</Link>
          </div>
          
          {recentArticles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">아직 작성된 기사가 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {recentArticles.map(article => (
                <li key={article.id} className="flex justify-between items-start gap-4">
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-black truncate">{article.title}</p>
                    <p className="text-xs text-gray-500 mt-1 font-bold">
                      <span className="text-red-700 uppercase">{article.category}</span> • {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold ${article.is_published ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {article.is_published ? '발행됨' : '임시저장'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
