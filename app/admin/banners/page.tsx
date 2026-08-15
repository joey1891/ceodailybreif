'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import Cropper from 'react-easy-crop';

// --- 수동 크롭 처리 함수 (선택한 영역을 Canvas로 잘라내어 File로 반환) ---
const getCroppedImg = (imageSrc: string, pixelCrop: any, targetWidth: number, targetHeight: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth; // 지정된 배너 사이즈 (300x250 또는 300x600)
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
      }, 'image/jpeg', 0.95); // 고화질 JPEG로 압축
    };
    image.onerror = reject;
  });
};


export default function AdminBanners() {
  const [ads, setAds] = useState({ 
    mid: { image_url: '', link_url: '', alt_text: '' }, 
    bottom: { image_url: '', link_url: '', alt_text: '' } 
  });
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({ mid: false, bottom: false });

  // 💡 크롭 모달 상태 관리
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; position: 'mid' | 'bottom' | null }>({
    isOpen: false,
    imageSrc: '',
    position: null
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

  // 💡 파일이 선택되면 바로 업로드하지 않고 크롭 팝업(모달)을 띄움
  const handleFileSelect = (file: File, position: 'mid' | 'bottom') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropModal({
        isOpen: true,
        imageSrc: e.target?.result as string,
        position: position
      });
      setCrop({ x: 0, y: 0 }); // 초기화
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // 💡 크롭 팝업에서 '영역 자르기 및 업로드' 버튼 클릭 시 실행
  const handleCropSave = async () => {
    const position = cropModal.position;
    if (!position || !croppedAreaPixels) return;

    const targetWidth = 300;
    const targetHeight = position === 'mid' ? 250 : 600;

    setIsUploading(prev => ({ ...prev, [position]: true }));
    setCropModal({ isOpen: false, imageSrc: '', position: null }); // 팝업 닫기

    try {
      // 1. 유저가 선택한 영역대로 이미지 자르기
      const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, targetWidth, targetHeight);

      // 2. Storage에 업로드
      const fileName = `${position}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, croppedFile);
      if (uploadError) throw uploadError;

      // 3. DB 업데이트
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
      alert(`${position === 'mid' ? '중앙' : '하단'} 배너가 지정하신 영역대로 업로드되었습니다!`);

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
      if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0], position);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 같은 파일 재선택 가능하게 초기화
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

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleFileSelect(file, position);
          break;
        }
      }
    };

    return (
      <div className="mb-8 border p-6 rounded-xl bg-white shadow-sm transition-all">
        <h2 className="text-xl font-bold mb-4">{title} <span className="text-sm font-normal text-gray-500 ml-2">권장 크기: {reqSize}</span></h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
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
    <div className="p-2 md:p-8 max-w-5xl mx-auto font-sans text-black relative">
      <h1 className="text-3xl font-black font-serif mb-2">광고 배너 관리</h1>
      <p className="text-gray-500 font-bold mb-8">사이트 우측에 노출되는 배너 이미지와 검색엔진(SEO) 최적화를 위한 해시태그를 설정합니다.</p>
      
      {renderBannerEditor('mid', '중앙 배너 (EXECUTIVE BRIEFING 하단)', '300 x 250')}
      {renderBannerEditor('bottom', '하단 배너 (MOST VIEWED 하단 스크롤 고정)', '300 x 600')}

      {/* 💡 이미지 크롭 모달 팝업 */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold">마우스로 드래그하여 영역 맞추기</h3>
              <p className="text-sm text-gray-500 mt-1">배너에 노출될 부분을 지정해주세요. (마우스 휠로 확대/축소 가능)</p>
            </div>
            
            <div className="relative w-full h-[50vh] min-h-[300px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Cropper
                image={cropModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropModal.position === 'mid' ? 300 / 250 : 300 / 600} // 배너 비율에 맞춰 크롭 박스 강제 고정
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setCropModal({ isOpen: false, imageSrc: '', position: null })} 
                className="px-6 py-2.5 border border-gray-300 rounded font-bold hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleCropSave} 
                className="px-6 py-2.5 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 transition-colors"
              >
                적용 및 업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
