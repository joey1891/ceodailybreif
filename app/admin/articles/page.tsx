'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

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
                    <td className="p-4 text-sm font-bold text-red-700">{article.category}</td>
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
