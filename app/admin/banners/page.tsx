'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';

// --- 이미지 리사이즈 및 크롭 헬퍼 함수 ---
// 브라우저의 Canvas를 이용하여 지정된 크기(300x250 등)에 맞게 꽉 차도록 자릅니다.
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

        // 비율을 계산하여 여백 없이 꽉 차게(object-cover) 잘라냅니다.
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
            // 변환된 Blob을 다시 File 객체로 만듭니다.
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
    mid: { image_url: '', link_url: '' }, 
    bottom: { image_url: '', link_url: '' } 
  });
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({ mid: false, bottom: false });

  // DB에서 기존 배너 데이터 불러오기
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

  // 실제 업로드 로직 (리사이즈 -> 스토리지 업로드 -> DB 업데이트)
  const processAndUpload = async (file: File, position: 'mid' | 'bottom') => {
    setIsUploading(prev => ({ ...prev, [position]: true }));
    try {
      // 1. 크기 지정 (중앙: 300x250, 하단: 300x600)
      const targetWidth = 300;
      const targetHeight = position === 'mid' ? 250 : 600;

      // 2. 이미지 리사이즈 및 크롭 실행
      const resizedFile = await resizeAndCropImage(file, targetWidth, targetHeight);

      // 3. 고유 파일명 생성 및 Supabase Storage 업로드
      const fileExt = resizedFile.name.split('.').pop() || 'png';
      const fileName = `${position}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, resizedFile);
      if (uploadError) throw uploadError;

      // 4. Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);

      // 5. DB 업데이트
      const { error: dbError } = await supabase.from('ads').upsert({
        id: position === 'mid' ? 1 : 2,
        position: position,
        image_url: publicUrl,
        link_url: ads[position].link_url
      });
      if (dbError) throw dbError;

      // 화면 상태 업데이트
      setAds(prev => ({ ...prev, [position]: { ...prev[position], image_url: publicUrl } }));
      alert(`${position === 'mid' ? '중앙' : '하단'} 배너가 성공적으로 업로드되었습니다.\n(사이즈 ${targetWidth}x${targetHeight} 자동 맞춤 완료)`);

    } catch (error: any) {
      console.error(error);
      alert('업로드 실패: ' + (error.message || error));
    } finally {
      setIsUploading(prev => ({ ...prev, [position]: false }));
    }
  };

  // 링크 저장 함수
  const saveLink = async (position: 'mid' | 'bottom') => {
    const { error } = await supabase.from('ads').update({ link_url: ads[position].link_url }).eq('position', position);
    if (error) alert('링크 저장 실패');
    else alert('링크가 저장되었습니다.');
  };

  // --- UI 컴포넌트 렌더링 ---
  const renderBannerEditor = (position: 'mid' | 'bottom', title: string, reqSize: string) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // 1. 파일 선택 버튼 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processAndUpload(e.target.files[0], position);
      }
    };

    // 2. 드래그 앤 드롭 핸들러
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) processAndUpload(file, position);
        else alert('이미지 파일만 업로드 가능합니다.');
      }
    };

    // 3. Ctrl+V (붙여넣기) 핸들러
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
          {/* 입력 폼 영역 */}
          <div className="flex-1 space-y-6">
            
            {/* 드래그 앤 드롭 / 붙여넣기 박스 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">이미지 업로드</label>
              <div 
                tabIndex={0}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                  ${isDragOver ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
                <div className="text-gray-500">
                  <p className="font-bold mb-1 text-black">클릭하여 이미지 업로드</p>
                  <p className="text-sm">또는 이미지를 이곳으로 <span className="font-bold">드래그</span> 하세요</p>
                  <p className="text-sm mt-2 p-1 bg-gray-100 rounded inline-block">이 박스를 클릭한 후 <span className="font-bold text-red-600">Ctrl + V</span> 로 캡처본 붙여넣기 가능</p>
                </div>
              </div>
            </div>
            
            {/* 링크 입력 영역 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">연결할 링크 (URL)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={ads[position].link_url}
                  onChange={(e) => setAds(prev => ({ ...prev, [position]: { ...prev[position], link_url: e.target.value } }))}
                  className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                  placeholder="https://example.com"
                />
                <button 
                  onClick={() => saveLink(position)}
                  className="bg-black text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  링크 저장
                </button>
              </div>
            </div>
          </div>

          {/* 미리보기 영역 */}
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
      <p className="text-gray-500 font-bold mb-8">사이트 우측에 노출되는 배너 이미지를 설정합니다. 이미지는 최적의 크기로 자동 리사이징됩니다.</p>
      
      {renderBannerEditor('mid', '중앙 배너 (EXECUTIVE BRIEFING 하단)', '300 x 250')}
      {renderBannerEditor('bottom', '하단 배너 (MOST VIEWED 하단 스크롤 고정)', '300 x 600')}
    </div>
  );
}
