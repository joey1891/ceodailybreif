'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function ManageHeadlinesPage() {
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [headlines, setHeadlines] = useState({
    MAIN_HERO: '',
    SUB_1: '',
    SUB_2: '',
    SUB_3: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // 발행된 기사 목록과 현재 설정된 헤드라인 불러오기
  useEffect(() => {
    const fetchData = async () => {
      // 1. 발행된 기사만 가져오기
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, category')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (articles) setPublishedArticles(articles);

      // 2. 현재 헤드라인 설정 가져오기
      const { data: currentHeadlines } = await supabase.from('headlines').select('*');
      
      if (currentHeadlines) {
        const newHeadlines = { MAIN_HERO: '', SUB_1: '', SUB_2: '', SUB_3: '' };
        currentHeadlines.forEach(h => {
          if (h.position in newHeadlines) {
            newHeadlines[h.position as keyof typeof newHeadlines] = h.article_id;
          }
        });
        setHeadlines(newHeadlines);
      }
    };

    fetchData();
  }, []);

  const handleSelectChange = (position: string, articleId: string) => {
    setHeadlines(prev => ({ ...prev, [position]: articleId }));
  };

  const saveHeadlines = async () => {
    setIsSaving(true);
    
    // 빈 값이 아닌 것만 필터링하여 저장할 배열 만들기
    const upsertData = Object.entries(headlines)
      .filter(([_, article_id]) => article_id !== '')
      .map(([position, article_id]) => ({ position, article_id }));

    if (upsertData.length > 0) {
      // onConflict를 사용하여 기존 위치의 기사를 덮어쓰기 (Upsert)
      const { error } = await supabase
        .from('headlines')
        .upsert(upsertData, { onConflict: 'position' });

      if (error) {
        alert('헤드라인 저장 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('메인 화면 헤드라인이 성공적으로 업데이트되었습니다!');
      }
    } else {
      alert('배치할 기사를 하나 이상 선택해 주세요.');
    }
    
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow border border-gray-200 max-w-4xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold font-serif mb-2">헤드라인 편집</h1>
        <p className="text-gray-600 font-sans">메인 홈페이지 1면에 노출될 기사를 배치합니다. (발행 완료된 기사만 선택 가능합니다)</p>
      </div>

      <div className="space-y-8 font-sans">
        {/* 메인 히어로 (가장 큰 1면 기사) */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <label className="block text-xl font-bold text-red-700 mb-2">⭐ 메인 톱기사 (MAIN_HERO)</label>
          <p className="text-sm text-gray-500 mb-4">홈페이지 중앙에 가장 크게 들어가는 메인 기사입니다.</p>
          <select 
            value={headlines.MAIN_HERO} 
            onChange={(e) => handleSelectChange('MAIN_HERO', e.target.value)}
            className="w-full border border-gray-300 rounded p-3 text-lg font-bold focus:ring-black focus:border-black"
          >
            <option value="">-- 기사를 선택하세요 --</option>
            {publishedArticles.map(article => (
              <option key={article.id} value={article.id}>[{article.category}] {article.title}</option>
            ))}
          </select>
        </div>

        {/* 서브 기사들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-800 mb-2">서브 기사 1 (SUB_1)</label>
            <select 
              value={headlines.SUB_1} 
              onChange={(e) => handleSelectChange('SUB_1', e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black"
            >
              <option value="">-- 선택 --</option>
              {publishedArticles.map(article => (
                <option key={article.id} value={article.id}>[{article.category}] {article.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-800 mb-2">서브 기사 2 (SUB_2)</label>
            <select 
              value={headlines.SUB_2} 
              onChange={(e) => handleSelectChange('SUB_2', e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black"
            >
              <option value="">-- 선택 --</option>
              {publishedArticles.map(article => (
                <option key={article.id} value={article.id}>[{article.category}] {article.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button 
            onClick={saveHeadlines}
            disabled={isSaving}
            className="bg-black text-white px-8 py-3 rounded text-lg font-bold hover:bg-red-700 transition"
          >
            {isSaving ? '저장 중...' : '헤드라인 레이아웃 저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}