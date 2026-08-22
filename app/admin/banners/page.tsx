'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import Cropper from 'react-easy-crop';

// --- 수동 크롭 처리 함수 ---
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

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve(newFile);
        } else {
          reject('Blob conversion failed');
        }
      }, 'image/jpeg', 0.95);
    };
    image.onerror = reject;
  });
};

// 유튜브 링크에서 ID 추출하는 헬퍼 함수
const extractYoutubeId = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : url;
};

export default function AdminBanners() {
  const [ads, setAds] = useState<any>({ 
    mid: { image_url: '', link_url: '', alt_text: '', is_youtube: false, youtube_id: '', autoplay: false }, 
    bottom: { image_url: '', link_url: '', alt_text: '', is_youtube: false, youtube_id: '', autoplay: false } 
  });
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({ mid: false, bottom: false });

  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; position: 'mid' | 'bottom' | null }>({
    isOpen: false,
    imageSrc: '',
    position: null
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [pasteTarget, setPasteTarget] = useState<'mid' | 'bottom'>('mid');

  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('ads').select('*');
      if (data) {
        const adData: any = { 
          mid: { image_url: '', link_url: '', alt_text: '', is_youtube: false, youtube_id: '', autoplay: false }, 
          bottom: { image_url: '', link_url: '', alt_text: '', is_youtube: false, youtube_id: '', autoplay: false } 
        };
        data.forEach(ad => {
          if (ad.position === 'mid') adData.mid = { ...adData.mid, ...ad };
          if (ad.position === 'bottom') adData.bottom = { ...adData.bottom, ...ad };
        });
        setAds(adData);
      }
    }
    fetchAds();
  }, []);

  const handleFileSelect = (file: File, position: 'mid' | 'bottom') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropModal({
        isOpen: true,
        imageSrc: e.target?.result as string,
        position: position
      });
      setCrop({ x: 0, y: 0 }); 
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (cropModal.isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file, pasteTarget);
            e.preventDefault(); 
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [pasteTarget, cropModal.isOpen]);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    const position = cropModal.position;
    if (!position || !croppedAreaPixels) return;

    const targetWidth = position === 'mid' ? 300 : 1200; // bottom을 와이드로 가정 시 넓게 크롭
    const targetHeight = position === 'mid' ? 250 : 350;

    setIsUploading(prev => ({ ...prev, [position]: true }));
    setCropModal({ isOpen: false, imageSrc: '', position: null }); 

    try {
      const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, targetWidth, targetHeight);
      const fileName = `${position}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, croppedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('ads').upsert({
        id: position === 'mid' ? 1 : 2,
        position: position,
        image_url: publicUrl,
        link_url: ads[position].link_url,
        alt_text: ads[position].alt_text
      });
      
      if (dbError) throw dbError;

      setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], image_url: publicUrl } }));
      alert(`배너 이미지가 성공적으로 업로드되었습니다!`);

    } catch (error: any) {
      console.error('Upload Error:', error);
      alert('업로드 실패: ' + (error.message || '오류 발생'));
    } finally {
      setIsUploading(prev => ({ ...prev, [position]: false }));
    }
  };

  const saveData = async (position: 'mid' | 'bottom') => {
    const { error } = await supabase
      .from('ads')
      .update({ 
        link_url: ads[position].link_url,
        alt_text: ads[position].alt_text,
        is_youtube: ads[position].is_youtube,
        youtube_id: ads[position].youtube_id,
        autoplay: ads[position].autoplay
      })
      .eq('position', position);
      
    if (error) alert('저장 실패: ' + error.message);
    else alert('설정이 성공적으로 저장되었습니다.');
  };

  const renderBannerEditor = (position: 'mid' | 'bottom', title: string) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const isActiveTarget = pasteTarget === position;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0], position);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) handleFileSelect(file, position);
        else alert('이미지 파일만 업로드 가능합니다.');
      }
    };

    return (
      <div 
        onMouseDownCapture={() => setPasteTarget(position)}
        className={`mb-8 border p-6 rounded-xl shadow-sm transition-all ${isActiveTarget ? 'border-blue-500 bg-blue-50/20' : 'bg-white border-gray-200'}`}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 flex-wrap">
          {title} 
          {isActiveTarget && (
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold shadow-sm">
              ✨ 현재 Ctrl+V 대상
            </span>
          )}
        </h2>

        {/* 배너 타입 선택 */}
        <div className="flex gap-4 mb-6 pb-4 border-b border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
            <input 
              type="radio" 
              checked={!ads[position].is_youtube} 
              onChange={() => setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], is_youtube: false } }))} 
              className="w-4 h-4 text-blue-600"
            />
            일반 이미지 배너
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-red-600">
            <input 
              type="radio" 
              checked={ads[position].is_youtube} 
              onChange={() => setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], is_youtube: true } }))} 
              className="w-4 h-4 text-red-600"
            />
            유튜브 영상 배너
          </label>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            
            {/* 유튜브 설정 섹션 */}
            {ads[position].is_youtube && (
              <div className="bg-red-50 p-4 rounded border border-red-200 space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-red-800 mb-2">유튜브 영상 링크 (또는 ID)</label>
                  <input 
                    type="text" 
                    value={ads[position].youtube_id}
                    onChange={(e) => setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], youtube_id: extractYoutubeId(e.target.value) } }))}
                    className="w-full border border-red-300 p-2 rounded focus:outline-none focus:border-red-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-800">
                  <input 
                    type="checkbox" 
                    checked={ads[position].autoplay}
                    onChange={(e) => setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], autoplay: e.target.checked } }))}
                    className="w-4 h-4"
                  />
                  썸네일 이미지 없이 즉시 자동재생 (Mute 기본 적용)
                </label>
                <p className="text-xs text-gray-500">자동재생을 끄시면 아래 업로드한 이미지가 썸네일로 노출되며, 클릭 시 영상을 볼 수 있습니다.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {ads[position].is_youtube && ads[position].autoplay ? '대체 이미지 (선택사항)' : '배너 썸네일 이미지 업로드'}
              </label>
              <div 
                tabIndex={0}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); setPasteTarget(position); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => { fileInputRef.current?.click(); setPasteTarget(position); }}
                className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDragOver ? 'border-blue-500 bg-blue-50' : isActiveTarget ? 'border-blue-300 hover:border-blue-400 bg-white' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              >
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <div className="text-gray-500">
                  <p className="font-bold mb-1 text-black">클릭하여 이미지 업로드</p>
                  <p className="text-sm p-1 bg-gray-100 rounded inline-block mt-1">화면 어디서나 <span className="font-bold text-blue-600">Ctrl + V</span> 로 캡처본 붙여넣기 가능</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {!ads[position].is_youtube && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">연결할 링크 (URL)</label>
                  <input 
                    type="text" 
                    value={ads[position].link_url || ''}
                    onChange={(e) => setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], link_url: e.target.value } }))}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SEO 해시태그 / 설명 <span className="text-xs font-normal text-gray-500 ml-1">(검색 엔진 노출용)</span>
                </label>
                <input 
                  type="text" 
                  value={ads[position].alt_text || ''}
                  onChange={(e) => setAds((prev: any) => ({ ...prev, [position]: { ...prev[position], alt_text: e.target.value } }))}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                  placeholder="예: #한국경제 #CEO뉴스레터"
                />
              </div>
              
              <button 
                onClick={() => saveData(position)}
                className="w-full bg-black text-white px-4 py-3 rounded text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                배너 설정 전체 저장하기
              </button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center">
            <label className="block text-sm font-bold text-gray-700 mb-2 self-start">실제 화면 미리보기</label>
            <div 
              className="bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden relative shadow-inner"
              style={{ width: '300px', height: position === 'mid' ? '250px' : '600px' }}
            >
              {isUploading[position] ? (
                <span className="text-black font-bold animate-pulse">업로드 중...</span>
              ) : ads[position].is_youtube && ads[position].autoplay && ads[position].youtube_id ? (
                <iframe 
                  className="w-full h-full pointer-events-none" 
                  src={`https://www.youtube.com/embed/${ads[position].youtube_id}?autoplay=1&mute=1&controls=0&loop=1`} 
                  title="YouTube Preview" 
                  frameBorder="0">
                </iframe>
              ) : ads[position].image_url ? (
                <img src={ads[position].image_url} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm font-bold tracking-widest uppercase">No Content</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-8 max-w-5xl mx-auto font-sans text-black relative">
      <h1 className="text-3xl font-black font-serif mb-2">광고 배너 관리</h1>
      <p className="text-gray-500 font-bold mb-8">이미지 배너 또는 유튜브 동영상 배너를 유연하게 설정할 수 있습니다.</p>
      
      {renderBannerEditor('mid', '중앙 섹션 배너')}
      {renderBannerEditor('bottom', '하단 전체너비 배너')}

      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold">마우스로 드래그하여 영역 맞추기</h3>
            </div>
            
            <div className="relative w-full h-[50vh] min-h-[300px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Cropper
                image={cropModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropModal.position === 'mid' ? 300 / 250 : 21 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCropModal({ isOpen: false, imageSrc: '', position: null })} className="px-6 py-2.5 border rounded font-bold">취소</button>
              <button onClick={handleCropSave} className="px-6 py-2.5 bg-blue-700 text-white rounded font-bold">적용 및 업로드</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
