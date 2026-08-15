'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

// 💡 카테고리 매핑 테이블 (대시보드와 동일한 스타일 적용)
const categoryMap: Record<string, { label: string, color: string }> = {
  'Politics & Policy': { label: '정치/정책', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Economy & Markets': { label: '경제/시장', color: 'bg-green-100 text-green-800 border-green-200' },
  'Chaebol & Industry': { label: '재벌/산업', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'Tech & Innovation': { label: '테크/혁신', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'K-BEAUTY TRENDS': { label: 'K-뷰티', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  'K-Culture & Society': { label: '문화/사회', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'Editorial': { label: '사설', color: 'bg-gray-800 text-white border-gray-900' }
};

// 💡 카테고리 배지 렌더링 함수
const getCategoryBadge = (categoryStr: string) => {
  const mapped = categoryMap[categoryStr];
  if (mapped) {
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${mapped.color}`}>
        {mapped.label}
      </span>
    );
  }
  // 기본 배지 (알 수 없는 카테고리)
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-gray-100 text-gray-700 border-gray-200">
      {categoryStr}
    </span>
  );
};

export default function ManageArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 기사 목록 불러오기
  const fetchArticles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setArticles(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // 기사 삭제
  const deleteArticle = async (id: string) => {
    if (!window.confirm('정말 이 기사를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) {
      alert('삭제되었습니다.');
      fetchArticles();
    }
  };

  // 기사 즉시 발행
  const publishArticle = async (id: string) => {
    if (!window.confirm('이 기사를 즉시 발행하시겠습니까?')) return;
    const { error } = await supabase.from('articles').update({ is_published: true }).eq('id', id);
    if (!error) {
      alert('성공적으로 발행되었습니다!');
      fetchArticles();
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold font-serif text-black">기사 관리</h1>
        <Link href="/admin/write" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-sans font-bold">
          + 새 기사 작성
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">기사 목록을 불러오는 중입니다...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] text-black">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-4 font-bold text-gray-700">카테고리</th>
                <th className="p-4 font-bold text-gray-700 w-1/2">제목</th>
                <th className="p-4 font-bold text-gray-700 text-center">상태</th>
                <th className="p-4 font-bold text-gray-700">저장 일시</th>
                <th className="p-4 font-bold text-gray-700 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">작성된 기사가 없습니다.</td></tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="p-4">
                      {/* 💡 기존 단순 텍스트 대신 getCategoryBadge 함수 사용 */}
                      {getCategoryBadge(article.category)}
                    </td>
                    <td className="p-4 font-serif font-bold text-lg truncate max-w-[400px]">{article.title}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${article.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {article.is_published ? '발행됨' : '임시저장'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-sans tracking-tight">
                      {/* 날짜와 시간 표시 */}
                      {new Date(article.created_at).toLocaleString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/write?id=${article.id}`} className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold hover:bg-gray-200">
                          수정
                        </Link>
                        {!article.is_published && (
                          <button onClick={() => publishArticle(article.id)} className="px-2 py-1 bg-green-50 text-green-700 border border-green-300 rounded text-xs font-bold hover:bg-green-100">
                            발행
                          </button>
                        )}
                        <button onClick={() => deleteArticle(article.id)} className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-bold hover:bg-red-100">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
