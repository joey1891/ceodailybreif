'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';

const resizeAndCropImage = (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas error');

        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          drawWidth = img.height * targetRatio;
          offsetX = (img.width - drawWidth) / 2;
          ctx.drawImage(img, offsetX, 0, drawWidth, img.height, 0, 0, targetWidth, targetHeight);
        } else {
          drawHeight = img.width / targetRatio;
          offsetY = (img.height - drawHeight) / 2;
          ctx.drawImage(img, 0, offsetY, img.width, drawHeight, 0, 0, targetWidth, targetHeight);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, { type: file.type });
            resolve(newFile);
          } else {
            reject('Blob conversion failed');
          }
        }, file.type, 0.9);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function AdminBanners() {
  const [ads, setAds] = useState({ 
    mid: { image_url: '', link_url: '', alt_text: '' }, 
    bottom: { image_url: '', link_url: '', alt_text: '' } 
  });
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({ mid: false, bottom: false });

  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('ads').select('*');
      if (data) {
        const adData = { mid: { image_url: '', link_url: '', alt_text: '' }, bottom: { image_url: '', link_url: '', alt_text: '' } };
        data.forEach(ad => {
          if (ad.position === 'mid') adData.mid = ad;
          if (ad.position === 'bottom') adData.bottom = ad;
        });
        setAds(adData);
      }
    }
    fetchAds();
  }, []);

  const processAndUpload = async (file: File, position: 'mid' | 'bottom') => {
    setIsUploading(prev => ({ ...prev, [position]: true }));
    try {
      const targetWidth = 300;
      const targetHeight = position === 'mid' ? 250 : 600;

      const resizedFile = await resizeAndCropImage(file, targetWidth, targetHeight);

      const fileExt = resizedFile.name.split('.').pop() || 'png';
      const fileName = `${position}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, resizedFile);
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

      setAds(prev => ({ ...prev, [position]: { ...prev[position], image_url: publicUrl } }));
      alert(`${position === 'mid' ? '중앙' : '하단'} 배너 업로드 성공!`);

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
        alt_text: ads[position].alt_text 
      })
      .eq('position', position);
      
    if (error) alert('저장 실패');
    else alert('링크와 SEO 키워드가 성공적으로 저장되었습니다.');
  };

  const renderBannerEditor = (position: 'mid' | 'bottom', title: string, reqSize: string) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) processAndUpload(e.target.files[0], position);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) processAndUpload(file, position);
        else alert('이미지 파일만 업로드 가능합니다.');
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) processAndUpload(file, position);
          break;
        }
      }
    };

    return (
      <div className="mb-8 border p-6 rounded-xl bg-white shadow-sm transition-all">
        <h2 className="text-xl font-bold mb-4">{title} <span className="text-sm font-normal text-gray-500 ml-2">권장 크기: {reqSize} (자동 리사이즈 됨)</span></h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            
            {/* 드래그 & 드롭 & Paste 컨테이너 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">이미지 업로드</label>
              <div 
                tabIndex={0}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-black
                  ${isDragOver ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              >
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <div className="text-gray-500">
                  <p className="font-bold mb-1 text-black">클릭하여 이미지 업로드</p>
                  <p className="text-sm">또는 이미지를 이곳으로 <span className="font-bold">드래그</span> 하세요</p>
                  <p className="text-sm mt-2 p-1 bg-gray-100 rounded inline-block">이 박스를 클릭한 후 <span className="font-bold text-red-600">Ctrl + V</span> 로 캡처본 붙여넣기 가능</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">연결할 링크 (URL)</label>
                <input 
                  type="text" 
                  value={ads[position].link_url}
                  onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], link_url: e.target.value } }))}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  SEO 키워드 / 해시태그 <span className="text-xs font-normal text-gray-500 ml-1">(검색 엔진 노출용 대체 텍스트)</span>
                </label>
                <input 
                  type="text" 
                  value={ads[position].alt_text || ''}
                  onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], alt_text: e.target.value } }))}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                  placeholder="예: #한국경제 #CEO뉴스레터 #비즈니스트렌드"
                />
              </div>
              
              <button 
                onClick={() => saveData(position)}
                className="w-full bg-black text-white px-4 py-3 rounded text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                정보 및 키워드 저장
              </button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center">
            <label className="block text-sm font-bold text-gray-700 mb-2 self-start">업로드된 배너 미리보기</label>
            <div 
              className="bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden relative shadow-inner"
              style={{ width: '300px', height: position === 'mid' ? '250px' : '600px' }}
            >
              {isUploading[position] ? (
                <span className="text-black font-bold animate-pulse">업로드 중...</span>
              ) : ads[position].image_url ? (
                <img src={ads[position].image_url} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm font-bold tracking-widest uppercase">No Image</span>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-8 max-w-5xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-black font-serif mb-2">광고 배너 관리</h1>
      <p className="text-gray-500 font-bold mb-8">사이트 우측에 노출되는 배너 이미지와 검색엔진(SEO) 최적화를 위한 해시태그를 설정합니다.</p>
      
      {renderBannerEditor('mid', '중앙 배너 (EXECUTIVE BRIEFING 하단)', '300 x 250')}
      {renderBannerEditor('bottom', '하단 배너 (MOST VIEWED 하단 스크롤 고정)', '300 x 600')}
    </div>
  );
}
