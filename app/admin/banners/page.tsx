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
      canvas.width = targetWidth; 
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas error');

      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        } else reject('Blob conversion failed');
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

const DEFAULT_AD = { image_url: '', link_url: '', alt_text: '', is_youtube: false, youtube_id: '', autoplay: false };
type BannerPosition = 'mid' | 'bottom' | 'article_bottom' | 'footer_top';

export default function AdminBanners() {
  const [ads, setAds] = useState<Record<BannerPosition, any>>({ 
    mid: { ...DEFAULT_AD }, bottom: { ...DEFAULT_AD }, article_bottom: { ...DEFAULT_AD }, footer_top: { ...DEFAULT_AD }
  });
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; position: BannerPosition | null }>({ isOpen: false, imageSrc: '', position: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  // 💡 TypeScript 에러 해결: <any> 타입 추가
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [pasteTarget, setPasteTarget] = useState<BannerPosition>('mid');

  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('ads').select('*');
      if (data) {
        const adData: any = { mid: { ...DEFAULT_AD }, bottom: { ...DEFAULT_AD }, article_bottom: { ...DEFAULT_AD }, footer_top: { ...DEFAULT_AD } };
        data.forEach(ad => {
          if (adData[ad.position]) adData[ad.position] = { ...adData[ad.position], ...ad };
        });
        setAds(adData);
      }
    }
    fetchAds();
  }, []);

  const handleFileSelect = (file: File, position: BannerPosition) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropModal({ isOpen: true, imageSrc: e.target?.result as string, position });
      setCrop({ x: 0, y: 0 }); setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || cropModal.isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) { handleFileSelect(file, pasteTarget); e.preventDefault(); return; }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [pasteTarget, cropModal.isOpen]);

  const handleCropSave = async () => {
    const position = cropModal.position;
    if (!position || !croppedAreaPixels) return;

    let targetWidth = 300, targetHeight = 250;
    if (position === 'bottom') { targetWidth = 300; targetHeight = 600; }
    if (position === 'article_bottom') { targetWidth = 800; targetHeight = 450; } 
    if (position === 'footer_top') { targetWidth = 1200; targetHeight = 400; } 

    setIsUploading(prev => ({ ...prev, [position]: true }));
    setCropModal({ isOpen: false, imageSrc: '', position: null }); 

    try {
      const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, targetWidth, targetHeight);
      const fileName = `${position}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, croppedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      
      let dbId = 1;
      if (position === 'bottom') dbId = 2;
      if (position === 'article_bottom') dbId = 3;
      if (position === 'footer_top') dbId = 4;

      const { error: dbError } = await supabase.from('ads').upsert({
        id: dbId, position, image_url: publicUrl, link_url: ads[position].link_url, alt_text: ads[position].alt_text
      });
      if (dbError) throw dbError;

      setAds((prev) => ({ ...prev, [position]: { ...prev[position], image_url: publicUrl } }));
      alert(`배너 이미지가 업로드되었습니다!`);
    } catch (error: any) { alert('업로드 실패: ' + (error.message || '오류 발생')); } 
    finally { setIsUploading(prev => ({ ...prev, [position]: false })); }
  };

  const saveData = async (position: BannerPosition) => {
    const { error } = await supabase.from('ads').update({ 
      link_url: ads[position].link_url, alt_text: ads[position].alt_text, is_youtube: ads[position].is_youtube, youtube_id: ads[position].youtube_id, autoplay: ads[position].autoplay
    }).eq('position', position);
    if (error) alert('저장 실패: ' + error.message); else alert('설정이 저장되었습니다.');
  };

  const renderBannerEditor = (position: BannerPosition, title: string, previewWidth: string, previewHeight: string) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const isActiveTarget = pasteTarget === position;

    return (
      <div onMouseDownCapture={() => setPasteTarget(position)} className={`mb-8 border p-6 rounded-xl shadow-sm transition-all ${isActiveTarget ? 'border-blue-500 bg-blue-50/20' : 'bg-white border-gray-200'}`}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 flex-wrap">
          {title} {isActiveTarget && <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">✨ 현재 Ctrl+V 대상</span>}
        </h2>
        <div className="flex gap-4 mb-6 pb-4 border-b border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
            <input type="radio" checked={!ads[position].is_youtube} onChange={() => setAds((prev) => ({ ...prev, [position]: { ...prev[position], is_youtube: false } }))} className="w-4 h-4 text-blue-600"/> 일반 이미지
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-red-600">
            <input type="radio" checked={ads[position].is_youtube} onChange={() => setAds((prev) => ({ ...prev, [position]: { ...prev[position], is_youtube: true } }))} className="w-4 h-4 text-red-600"/> 유튜브 영상
          </label>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            {ads[position].is_youtube && (
              <div className="bg-red-50 p-4 rounded border border-red-200 space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-red-800 mb-2">유튜브 영상 링크 (또는 ID)</label>
                  <input type="text" value={ads[position].youtube_id} onChange={(e) => setAds((prev) => ({ ...prev, [position]: { ...prev[position], youtube_id: extractYoutubeId(e.target.value) } }))} className="w-full border p-2 rounded" placeholder="https://youtube.com/watch?v=..."/>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                  <input type="checkbox" checked={ads[position].autoplay} onChange={(e) => setAds((prev) => ({ ...prev, [position]: { ...prev[position], autoplay: e.target.checked } }))} className="w-4 h-4"/>
                  썸네일 없이 자동재생 (음소거 필수)
                </label>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold mb-2">{ads[position].is_youtube && ads[position].autoplay ? '대체 이미지 (선택)' : '이미지 업로드'}</label>
              <div tabIndex={0} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); setPasteTarget(position); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0], position); }} onClick={() => fileInputRef.current?.click()} className={`w-full border-2 border-dashed rounded p-8 text-center cursor-pointer ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], position); }} />
                <p className="font-bold text-black">클릭하여 이미지 업로드 (또는 Ctrl+V)</p>
              </div>
            </div>
            <div className="space-y-4">
              {!ads[position].is_youtube && (
                <div>
                  <label className="block text-sm font-bold mb-2">연결 링크</label>
                  <input type="text" value={ads[position].link_url || ''} onChange={(e) => setAds((prev) => ({ ...prev, [position]: { ...prev[position], link_url: e.target.value } }))} className="w-full border p-2 rounded"/>
                </div>
              )}
              <button onClick={() => saveData(position)} className="w-full bg-black text-white px-4 py-3 rounded font-bold">배너 설정 저장</button>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <label className="block text-sm font-bold mb-2 self-start">미리보기</label>
            <div className="bg-gray-100 border flex items-center justify-center overflow-hidden" style={{ width: previewWidth, height: previewHeight }}>
              {isUploading[position] ? <span>업로드 중...</span> : ads[position].is_youtube && ads[position].autoplay && ads[position].youtube_id ? (
                <iframe className="w-full h-full pointer-events-none" src={`https://www.youtube.com/embed/${ads[position].youtube_id}?autoplay=1&mute=1&controls=0&loop=1`} frameBorder="0"></iframe>
              ) : ads[position].image_url ? (
                <img src={ads[position].image_url} alt="Preview" className="w-full h-full object-cover" />
              ) : <span>No Content</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-8 max-w-5xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-black mb-8">광고 배너 관리</h1>
      {renderBannerEditor('mid', '1. 우측 사이드 중앙 배너', '300px', '250px')}
      {renderBannerEditor('bottom', '2. 우측 사이드 하단(스크롤 고정) 배너', '300px', '600px')}
      {renderBannerEditor('article_bottom', '3. 메인 기사 바로 아래 배너 (유튜브 권장)', '320px', '180px')}
      {renderBannerEditor('footer_top', '4. 푸터 위 전체너비 배너 (유튜브 권장)', '400px', '133px')}

      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded p-6 w-full max-w-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold">이미지 크롭</h3>
            <div className="relative w-full h-[50vh] bg-gray-100 rounded">
              <Cropper
                image={cropModal.imageSrc} crop={crop} zoom={zoom}
                aspect={cropModal.position === 'mid' ? 300/250 : cropModal.position === 'bottom' ? 300/600 : cropModal.position === 'article_bottom' ? 16/9 : 24/9}
                onCropChange={setCrop} onCropComplete={(a, px) => setCroppedAreaPixels(px)} onZoomChange={setZoom}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCropModal({ isOpen: false, imageSrc: '', position: null })} className="px-6 py-2 border rounded font-bold">취소</button>
              <button onClick={handleCropSave} className="px-6 py-2 bg-blue-700 text-white rounded font-bold">적용</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
