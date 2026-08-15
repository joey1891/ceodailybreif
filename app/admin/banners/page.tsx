'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function AdminBanners() {
  const [ads, setAds] = useState({ mid: { image_url: '', link_url: '' }, bottom: { image_url: '', link_url: '' } });

  // 배너 정보 불러오기
  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('ads').select('*');
      if (data) {
        const adData = { mid: { image_url: '', link_url: '' }, bottom: { image_url: '', link_url: '' } };
        data.forEach(ad => {
          if (ad.position === 'mid') adData.mid = ad;
          if (ad.position === 'bottom') adData.bottom = ad;
        });
        setAds(adData);
      }
    }
    fetchAds();
  }, []);

  // 이미지 업로드 및 DB 저장
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: 'mid' | 'bottom') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${position}-${Date.now()}.${fileExt}`;
    
    // 1. Storage에 업로드 (버킷 이름: 'banners')
    const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, file);
    if (uploadError) return alert('이미지 업로드 실패');

    // 2. Public URL 가져오기
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);

    // 3. DB 업데이트 (upsert)
    const { error: dbError } = await supabase.from('ads').upsert({
      id: position === 'mid' ? 1 : 2, // 고정 ID 부여
      position: position,
      image_url: publicUrl,
      link_url: ads[position].link_url
    });

    if (!dbError) {
      setAds(prev => ({ ...prev, [position]: { ...prev[position], image_url: publicUrl } }));
      alert(`${position} 배너가 업데이트 되었습니다.`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">배너 관리</h1>
      
      {['mid', 'bottom'].map((pos) => (
        <div key={pos} className="mb-8 border p-6 rounded bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 uppercase">{pos === 'mid' ? '중앙 배너 (EXECUTIVE 밑)' : '하단 배너 (MOST VIEWED 밑)'}</h2>
          
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-sm mb-2">이미지 업로드</label>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, pos as 'mid' | 'bottom')} className="mb-4 block" />
              
              <label className="block text-sm mb-2">연결할 링크 (URL)</label>
              <input 
                type="text" 
                value={ads[pos as 'mid' | 'bottom'].link_url}
                onChange={(e) => setAds(prev => ({ ...prev, [pos]: { ...prev[pos as 'mid' | 'bottom'], link_url: e.target.value } }))}
                className="w-full border p-2 rounded"
                placeholder="https://..."
              />
              <button 
                onClick={async () => {
                   await supabase.from('ads').update({ link_url: ads[pos as 'mid' | 'bottom'].link_url }).eq('position', pos);
                   alert('링크가 저장되었습니다.');
                }}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                링크 저장
              </button>
            </div>

            <div className="w-64 h-auto bg-gray-100 border flex items-center justify-center">
              {ads[pos as 'mid' | 'bottom'].image_url ? (
                <img src={ads[pos as 'mid' | 'bottom'].image_url} alt="Banner Preview" className="max-w-full h-auto object-contain" />
              ) : (
                <span className="text-gray-400 text-sm">미리보기</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
