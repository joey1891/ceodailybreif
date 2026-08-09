'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function ManageHeadlinesPage() {
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  
  // 💡 수정됨: 상태(State)에 SUB_4, SUB_5, SUB_6 추가
  const [headlines, setHeadlines] = useState({
    MAIN_HERO: '',
    SUB_1: '',
    SUB_2: '',
    SUB_3: '',
    SUB_4: '',
    SUB_5: '',
    SUB_6: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // 💡 추가됨: 다국어 JSON 객체로 저장된 제목에서 깔끔한 텍스트만 추출하는 헬퍼 함수
  const getDisplayText = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') {
      if (field.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(field);
          return parsed.en || parsed.ko || Object.values(parsed)[0] || '';
        } catch { return field; }
      }
      return field; // 예전 텍스트 데이터 호환
    }
    if (typeof field === 'object') {
      return field.en || field.ko || Object.values(field)[0] || '';
    }
    return String(field);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, category')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (articles) setPublishedArticles(articles);

      const { data: currentHeadlines } = await supabase.from('headlines').select('*');
      
      if (currentHeadlines) {
        // 💡 수정됨: SUB_6까지 초기화 객체 확장
        const newHeadlines = { 
          MAIN_HERO: '', 
          SUB_1: '', 
          SUB_2: '', 
          SUB_3: '', 
          SUB_4: '', 
          SUB_5: '', 
          SUB_6: '' 
        };
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
    
    const upsertData = Object.entries(headlines)
      .filter(([_, article_id]) => article_id !== '')
      .map(([position, article_id]) => ({ position, article_id }));

    if (upsertData.length > 0) {
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
    <div className="bg-white p-8 rounded-lg shadow border border-gray-200 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold font-serif mb-2">헤드라인 편집</h1>
        <p className="text-gray-600 font-sans">메인 홈페이지 1면에 노출될 기사를 배치합니다. (발행 완료된 기사만 선택 가능합니다)</p>
      </div>

      <div className="space-y-8 font-sans">
        {/* 메인 히어로 */}
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
              // 💡 추가됨: getDisplayText 적용
              <option key={article.id} value={article.id}>[{article.category}] {getDisplayText(article.title)}</option>
            ))}
          </select>
        </div>

        {/* 💡 수정됨: 서브 기사 1~6 반복 렌더링 (그리드를 3열로 확장) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const positionKey = `SUB_${num}` as keyof typeof headlines;
            
            return (
              <div key={positionKey} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">서브 기사 {num} ({positionKey})</label>
                <select 
                  value={headlines[positionKey]} 
                  onChange={(e) => handleSelectChange(positionKey, e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-black focus:border-black"
                >
                  <option value="">-- 선택 --</option>
                  {publishedArticles.map(article => (
                    // 💡 추가됨: getDisplayText 적용
                    <option key={article.id} value={article.id}>[{article.category}] {getDisplayText(article.title)}</option>
                  ))}
                </select>
              </div>
            );
          })}
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
