'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import Cropper from 'react-easy-crop';

const getCroppedImg = (imageSrc: string, pixelCrop: any, targetWidth: number, targetHeight: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth; canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas error');
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        else reject('Blob conversion failed');
      }, 'image/jpeg', 0.95);
    };
    image.onerror = reject;
  });
};

const extractYoutubeId = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : url;
};

// 미디어 다운로드 헬퍼 함수
const handleDownload = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    alert('다운로드 중 오류가 발생했습니다.');
  }
};

const DEFAULT_AD = { image_url: '', link_url: '', alt_text: '', is_youtube: false, youtube_id: '', autoplay: false, is_visible: true, youtube_scale: 1.0, description: '', file_url: '', history: [] };
type BannerPosition = 'mid' | 'bottom' | 'article_bottom' | 'footer_top';

export default function AdminBanners() {
  const [ads, setAds] = useState<Record<BannerPosition, any>>({ mid: { ...DEFAULT_AD }, bottom: { ...DEFAULT_AD }, article_bottom: { ...DEFAULT_AD }, footer_top: { ...DEFAULT_AD } });
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; position: BannerPosition | null; originalFile: File | null }>({ isOpen: false, imageSrc: '', position: null, originalFile: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('ads').select('*');
      if (data) {
        const adData: any = { mid: { ...DEFAULT_AD }, bottom: { ...DEFAULT_AD }, article_bottom: { ...DEFAULT_AD }, footer_top: { ...DEFAULT_AD } };
        data.forEach(ad => { if (adData[ad.position]) adData[ad.position] = { ...adData[ad.position], ...ad, history: ad.history || [] }; });
        setAds(adData);
      }
    }
    fetchAds();
  }, []);

  // 💡 GIF나 비디오는 크롭을 건너뛰고 바로 업로드 처리
  const handleFileSelect = async (file: File, position: BannerPosition) => {
    if (file.size > 50 * 1024 * 1024) {
      alert('파일 용량은 50MB 이하만 가능합니다.'); return;
    }
    if (file.type === 'image/gif' || file.type.startsWith('video/')) {
      await directUpload(file, position);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropModal({ isOpen: true, imageSrc: e.target?.result as string, position, originalFile: file });
        setCrop({ x: 0, y: 0 }); setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateHistoryAndSave = async (position: BannerPosition, newData: any, newHistoryItem: any) => {
    const currentHistory = ads[position].history || [];
    // 동일한 URL이 히스토리에 있다면 중복 추가 방지
    const filteredHistory = currentHistory.filter((h: any) => h.url !== newHistoryItem.url && h.youtube_id !== newHistoryItem.youtube_id);
    const updatedHistory = [newHistoryItem, ...filteredHistory].slice(0, 3); // 최대 3개 유지

    const updatedAd = { ...ads[position], ...newData, history: updatedHistory };
    setAds(prev => ({ ...prev, [position]: updatedAd }));

    let dbId = 1; if (position === 'bottom') dbId = 2; if (position === 'article_bottom') dbId = 3; if (position === 'footer_top') dbId = 4;
    await supabase.from('ads').upsert({ id: dbId, position, ...newData, history: updatedHistory });
  };

  const directUpload = async (file: File, position: BannerPosition) => {
    setIsUploading(prev => ({ ...prev, [position]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${position}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      const isVideo = file.type.startsWith('video/');
      
      await updateHistoryAndSave(position, { image_url: publicUrl, is_youtube: false }, { type: isVideo ? 'video' : 'image', url: publicUrl, created_at: Date.now() });
      alert(`업로드 완료!`);
    } catch (error: any) { alert('업로드 실패'); } finally { setIsUploading(prev => ({ ...prev, [position]: false })); }
  };

  const handleCropSave = async () => {
    const position = cropModal.position;
    if (!position || !croppedAreaPixels) return;
    let targetWidth = 300, targetHeight = 250;
    if (position === 'bottom') { targetWidth = 300; targetHeight = 600; }
    if (position === 'article_bottom') { targetWidth = 800; targetHeight = 450; } 
    if (position === 'footer_top') { targetWidth = 1200; targetHeight = 400; } 

    setIsUploading(prev => ({ ...prev, [position]: true }));
    setCropModal({ isOpen: false, imageSrc: '', position: null, originalFile: null }); 

    try {
      const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, targetWidth, targetHeight);
      const fileName = `${position}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, croppedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      await updateHistoryAndSave(position, { image_url: publicUrl, is_youtube: false }, { type: 'image', url: publicUrl, created_at: Date.now() });
      alert(`배너 이미지가 업로드되었습니다!`);
    } catch (error: any) { alert('업로드 실패'); } finally { setIsUploading(prev => ({ ...prev, [position]: false })); }
  };

  const handleYoutubeAdd = async (position: BannerPosition, rawUrl: string) => {
    const yId = extractYoutubeId(rawUrl);
    if (!yId) return;
    await updateHistoryAndSave(position, { youtube_id: yId, is_youtube: true }, { type: 'youtube', youtube_id: yId, url: rawUrl, created_at: Date.now() });
  };

  const selectFromHistory = async (position: BannerPosition, item: any) => {
    if (item.type === 'youtube') {
      await updateHistoryAndSave(position, { is_youtube: true, youtube_id: item.youtube_id }, item);
    } else {
      await updateHistoryAndSave(position, { is_youtube: false, image_url: item.url }, item);
    }
  };

  const saveData = async (position: BannerPosition) => {
    const { error } = await supabase.from('ads').update({ 
      link_url: ads[position].link_url, alt_text: ads[position].alt_text, is_youtube: ads[position].is_youtube, youtube_id: ads[position].youtube_id, autoplay: ads[position].autoplay,
      is_visible: ads[position].is_visible, youtube_scale: ads[position].youtube_scale, description: ads[position].description, file_url: ads[position].file_url
    }).eq('position', position);
    if (error) alert('저장 실패: ' + error.message); else alert('텍스트 설정이 저장되었습니다.');
  };

  const renderBannerEditor = (position: BannerPosition, title: string) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
      <div className={`mb-8 border p-6 rounded-xl shadow-sm bg-white ${!ads[position].is_visible ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-4 py-2 rounded-full shadow-sm">
            <span className={`text-sm font-bold ${ads[position].is_visible ? 'text-green-600' : 'text-gray-400'}`}>{ads[position].is_visible ? '배너 ON' : '배너 OFF'}</span>
            <input type="checkbox" checked={ads[position].is_visible} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], is_visible: e.target.checked } }))} className="w-4 h-4"/>
          </label>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-bold"><input type="radio" checked={!ads[position].is_youtube} onChange={() => setAds(prev => ({ ...prev, [position]: { ...prev[position], is_youtube: false } }))} className="w-4 h-4 text-blue-600"/> 파일(이미지/GIF/영상) 사용</label>
              <label className="flex items-center gap-2 text-sm font-bold text-red-600"><input type="radio" checked={ads[position].is_youtube} onChange={() => setAds(prev => ({ ...prev, [position]: { ...prev[position], is_youtube: true } }))} className="w-4 h-4 text-red-600"/> 유튜브 사용</label>
            </div>

            {ads[position].is_youtube ? (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <label className="block text-sm font-bold text-red-800 mb-2">유튜브 링크 등록</label>
                <div className="flex gap-2">
                  <input type="text" id={`yt-${position}`} className="flex-1 border p-2 rounded" placeholder="https://youtube.com/watch?v=..." />
                  <button onClick={() => { const el = document.getElementById(`yt-${position}`) as HTMLInputElement; handleYoutubeAdd(position, el.value); el.value=''; }} className="bg-red-600 text-white px-4 rounded font-bold">적용</button>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={ads[position].autoplay} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], autoplay: e.target.checked } }))} className="w-4 h-4"/> 썸네일 없이 자동재생 (음소거)</label>
                  {ads[position].autoplay && (
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-xs font-bold">확대 비율(Scale): {ads[position].youtube_scale}</span>
                      <input type="range" min="1.0" max="2.0" step="0.05" value={ads[position].youtube_scale || 1.0} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], youtube_scale: parseFloat(e.target.value) } }))} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold mb-2">파일 업로드 (JPG, PNG, GIF, MP4)</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed rounded p-6 text-center cursor-pointer hover:bg-gray-50 transition">
                  <input type="file" accept="image/*, video/mp4, video/webm" className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], position); }} />
                  <p className="font-bold">클릭하여 파일 선택 (50MB 이하)</p>
                </div>
              </div>
            )}

            {/* 💡 히스토리 영역 (최근 3개) */}
            {ads[position].history?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded border">
                <h4 className="text-xs font-bold mb-3 text-gray-500 uppercase tracking-widest">최근 사용 기록 (클릭하여 복구)</h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {ads[position].history.map((item: any, idx: number) => {
                    const isActive = ads[position].is_youtube ? item.youtube_id === ads[position].youtube_id : item.url === ads[position].image_url;
                    return (
                      <div key={idx} onClick={() => selectFromHistory(position, item)} className={`relative shrink-0 w-24 h-24 rounded border-2 cursor-pointer overflow-hidden ${isActive ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'}`}>
                        {item.type === 'youtube' ? (
                          <img src={`https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`} className="w-full h-full object-cover" />
                        ) : item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.url} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold text-center py-0.5 uppercase">{item.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <input type="text" value={ads[position].link_url || ''} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], link_url: e.target.value } }))} className="w-full border p-2 rounded text-sm" placeholder="연결 링크 (https://...)" />
              <textarea value={ads[position].description || ''} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], description: e.target.value } }))} className="w-full border p-2 rounded text-sm" rows={2} placeholder="모달 팝업용 설명" />
              <input type="text" value={ads[position].file_url || ''} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], file_url: e.target.value } }))} className="w-full border p-2 rounded text-sm" placeholder="파일 다운로드 링크 URL (선택)" />
              <input type="text" value={ads[position].alt_text || ''} onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], alt_text: e.target.value } }))} className="w-full border p-2 rounded text-sm" placeholder="SEO 키워드" />
              <button onClick={() => saveData(position)} className="w-full bg-black text-white px-4 py-3 rounded font-bold hover:bg-gray-800">설정 저장</button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center w-[300px]">
            <div className="flex justify-between w-full mb-2">
              <label className="text-sm font-bold">현재 화면</label>
              {!ads[position].is_youtube && ads[position].image_url && (
                <button onClick={() => handleDownload(ads[position].image_url, `banner-${position}`)} className="text-xs text-blue-600 hover:underline font-bold">⬇ 파일 다운로드</button>
              )}
            </div>
            <div className="bg-gray-100 border w-full aspect-video flex items-center justify-center overflow-hidden relative rounded">
              {isUploading[position] ? <span>업로드 중...</span> : ads[position].is_youtube && ads[position].autoplay && ads[position].youtube_id ? (
                <iframe className="absolute w-full h-full pointer-events-none" style={{ transform: `scale(${ads[position].youtube_scale || 1.0})` }} src={`https://www.youtube.com/embed/${ads[position].youtube_id}?autoplay=1&mute=1&controls=0&loop=1`} frameBorder="0"></iframe>
              ) : ads[position].image_url ? (
                ads[position].image_url.includes('.mp4') || ads[position].image_url.includes('.webm') ? (
                  <video src={ads[position].image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : <img src={ads[position].image_url} className="w-full h-full object-cover" />
              ) : <span className="text-xs text-gray-400">No Content</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-8 max-w-5xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-black mb-8">광고 배너 관리</h1>
      {renderBannerEditor('mid', '1. 우측 사이드 중앙 배너')}
      {renderBannerEditor('bottom', '2. 우측 사이드 하단 배너')}
      {renderBannerEditor('article_bottom', '3. 메인 기사 바로 아래 배너')}
      {renderBannerEditor('footer_top', '4. 푸터 위 전체너비 배너')}

      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded p-6 w-full max-w-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold">이미지 크롭</h3>
            <div className="relative w-full h-[50vh] bg-gray-100 rounded">
              <Cropper image={cropModal.imageSrc} crop={crop} zoom={zoom} aspect={cropModal.position === 'mid' ? 300/250 : cropModal.position === 'bottom' ? 300/600 : cropModal.position === 'article_bottom' ? 16/9 : 24/9} onCropChange={setCrop} onCropComplete={(a, px) => setCroppedAreaPixels(px)} onZoomChange={setZoom} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCropModal({ isOpen: false, imageSrc: '', position: null, originalFile: null })} className="px-6 py-2 border rounded font-bold">취소</button>
              <button onClick={handleCropSave} className="px-6 py-2 bg-blue-700 text-white rounded font-bold">적용</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
