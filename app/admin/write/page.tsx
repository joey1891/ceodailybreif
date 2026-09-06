'use client';

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
  },
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center bg-gray-50 text-gray-500">에디터 로딩중...</div> }
);

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

// 💡 마우스 드래그 앤 드롭으로 텍스트 위치를 잡는 미리보기 컴포넌트 추가
function DraggablePreview({ bgUrl, textHtml, aspect, x, y, onPosChange }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let px = e.clientX - rect.left - offset.x;
      let py = e.clientY - rect.top - offset.y;
      
      // X, Y 좌표를 % (0~100) 비율로 변환
      let newX = (px / rect.width) * 100;
      let newY = (py / rect.height) * 100;
      onPosChange(Math.max(0, Math.min(100, newX)), Math.max(0, Math.min(100, newY)));
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset, onPosChange]);

  return (
    <div ref={containerRef} className="relative w-full border border-gray-300 rounded overflow-hidden shadow-sm bg-gray-100" style={{ aspectRatio: aspect }}>
      {bgUrl ? (
        <img src={bgUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">배너 이미지를 먼저 등록하세요</div>
      )}
      {textHtml && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute cursor-move p-2 border-2 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-dashed border-gray-400 hover:border-blue-500 hover:bg-blue-50/50'}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div dangerouslySetInnerHTML={{ __html: textHtml }} className="prose-p:m-0 pointer-events-none" />
        </div>
      )}
    </div>
  );
}

const LANGUAGES = [
  { code: 'en', label: '🇺🇸 English (Original)' },
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'zh-CN', label: '🇨🇳 中文' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'mn', label: '🇲🇳 Монгол' },
  { code: 'vi', label: '🇻🇳 Tiếng Việt' }
] as const;

type MultiLangState = Record<string, string>;
type MultiLangTagsState = Record<string, string[]>;

const initialTextState: MultiLangState = LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: '' }), {});
const initialTagsState: MultiLangTagsState = LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: [] }), {});

function WriteArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [currentLang, setCurrentLang] = useState<string>('en');
  const [editorMode, setEditorMode] = useState<'general' | 'html' | 'preview'>('general');

  const [title, setTitle] = useState<MultiLangState>(initialTextState);
  const [content, setContent] = useState<MultiLangState>(initialTextState);
  const [hashtags, setHashtags] = useState<MultiLangTagsState>(initialTagsState);
  const [hashtagInput, setHashtagInput] = useState('');
  
  const [category, setCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [allowComments, setAllowComments] = useState(true);

  const [authorName, setAuthorName] = useState<MultiLangState>(initialTextState);
  const [authorBio, setAuthorBio] = useState<MultiLangState>(initialTextState);
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(null);
  const [authorImageUrl, setAuthorImageUrl] = useState('');
  const authorFileInputRef = useRef<HTMLInputElement>(null);
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기사 개별 프로필 배너 상태
  const [profileBannerFile, setProfileBannerFile] = useState<File | null>(null);
  const [profileBannerPreview, setProfileBannerPreview] = useState<string | null>(null);
  const [profileBannerUrl, setProfileBannerUrl] = useState('');
  const [profileBannerLink, setProfileBannerLink] = useState('');
  const [profileBannerAlt, setProfileBannerAlt] = useState('');
  const [profileBannerText, setProfileBannerText] = useState('');
  const [profileBannerTextX, setProfileBannerTextX] = useState(10); // 💡 X 좌표
  const [profileBannerTextY, setProfileBannerTextY] = useState(10); // 💡 Y 좌표
  const [profileBannerVisible, setProfileBannerVisible] = useState(true);
  const profileBannerFileInputRef = useRef<HTMLInputElement>(null);

  // 기사 개별 구독 배너 상태
  const [subscribeBannerFile, setSubscribeBannerFile] = useState<File | null>(null);
  const [subscribeBannerPreview, setSubscribeBannerPreview] = useState<string | null>(null);
  const [subscribeBannerUrl, setSubscribeBannerUrl] = useState('');
  const [subscribeBannerLink, setSubscribeBannerLink] = useState('');
  const [subscribeBannerAlt, setSubscribeBannerAlt] = useState('');
  const [subscribeBannerText, setSubscribeBannerText] = useState('');
  const [subscribeBannerTextX, setSubscribeBannerTextX] = useState(10); // 💡 X 좌표
  const [subscribeBannerTextY, setSubscribeBannerTextY] = useState(10); // 💡 Y 좌표
  const [subscribeBannerVisible, setSubscribeBannerVisible] = useState(true);
  const subscribeBannerFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  type PasteTarget = 'thumbnail' | 'author' | 'profile_banner' | 'subscribe_banner';
  const [pasteTarget, setPasteTarget] = useState<PasteTarget>('thumbnail');
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; target: PasteTarget | null }>({ isOpen: false, imageSrc: '', target: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const safeExtractString = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (val.trim().startsWith('{')) {
        try { const parsed = JSON.parse(val); return parsed.en || parsed.ko || Object.values(parsed)[0] || ''; } catch { return val; }
      }
      return val;
    }
    if (typeof val === 'object') return val.en || val.ko || Object.values(val)[0] || '';
    return String(val);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('name').order('sort_order', { ascending: true });
      if (data && !error) {
        const uniqueCategories = data.map(item => item.name).filter(Boolean);
        if (uniqueCategories.length === 0) uniqueCategories.push('POLITICS', 'ECONOMY', 'INDUSTRY', 'K-TECH', 'K-CULTURE', 'K-BEAUTY', 'K-MEDICAL', 'K-PHARMA', 'K-ATTRACTIONS');
        setAvailableCategories(uniqueCategories as string[]);
        if (!editId && uniqueCategories.length > 0) setCategory(uniqueCategories[0]);
      }
    };

    const fetchArticle = async () => {
      if (!editId) return;
      const { data, error } = await supabase.from('articles').select('*').eq('id', editId).single();
      if (data) {
        const newTitle = { ...initialTextState }; const newContent = { ...initialTextState }; const newHashtags = { ...initialTagsState };
        const newAuthorName = { ...initialTextState }; const newAuthorBio = { ...initialTextState };

        newTitle['en'] = safeExtractString(data.title); 
        newContent['en'] = safeExtractString(data.content);
        newAuthorName['en'] = safeExtractString(data.author_name) || 'Editor-in-Chief';
        newAuthorBio['en'] = safeExtractString(data.author_bio);

        try {
          const parsedTags = data.hashtags ? JSON.parse(data.hashtags) : [];
          if (Array.isArray(parsedTags)) newHashtags['en'] = parsedTags;
          else if (typeof parsedTags === 'object') { const tags = parsedTags.en || parsedTags.ko || Object.values(parsedTags)[0]; newHashtags['en'] = Array.isArray(tags) ? tags : []; }
          else newHashtags['en'] = [];
        } catch(e) { newHashtags['en'] = typeof data.hashtags === 'string' ? [data.hashtags] : []; }

        if (data.translations) {
          Object.keys(data.translations).forEach(lang => {
            if (LANGUAGES.some(l => l.code === lang)) {
              newTitle[lang] = data.translations[lang].title || ''; 
              newContent[lang] = data.translations[lang].content || ''; 
              newHashtags[lang] = data.translations[lang].hashtags || [];
              newAuthorName[lang] = data.translations[lang].author_name || ''; 
              newAuthorBio[lang] = data.translations[lang].author_bio || '';
            }
          });
        }
        setTitle(newTitle); setContent(newContent); setHashtags(newHashtags); 
        setAuthorName(newAuthorName); setAuthorBio(newAuthorBio);
        
        setCategory(data.category || 'POLITICS'); 
        setImageUrl(data.image_url || '');
        setAuthorImageUrl(data.author_image_url || '');
        
        // 배너 데이터 로드 및 좌표 연결
        setProfileBannerUrl(data.profile_banner_url || '');
        setProfileBannerLink(data.profile_banner_link || '');
        setProfileBannerAlt(data.profile_banner_alt || ''); 
        setProfileBannerText(data.profile_banner_text || '');
        setProfileBannerTextX(data.profile_banner_text_x ?? 10);
        setProfileBannerTextY(data.profile_banner_text_y ?? 10);
        if (data.profile_banner_visible !== undefined) setProfileBannerVisible(data.profile_banner_visible);

        setSubscribeBannerUrl(data.subscribe_banner_url || '');
        setSubscribeBannerLink(data.subscribe_banner_link || '');
        setSubscribeBannerAlt(data.subscribe_banner_alt || ''); 
        setSubscribeBannerText(data.subscribe_banner_text || '');
        setSubscribeBannerTextX(data.subscribe_banner_text_x ?? 10);
        setSubscribeBannerTextY(data.subscribe_banner_text_y ?? 10);
        if (data.subscribe_banner_visible !== undefined) setSubscribeBannerVisible(data.subscribe_banner_visible);
        
        if (data.allow_comments !== undefined) setAllowComments(data.allow_comments);
      }
    };

    Promise.all([fetchCategories(), fetchArticle()]).finally(() => setIsLoading(false));
  }, [editId]);

  useEffect(() => {
    if (thumbnailFile) { const objectUrl = URL.createObjectURL(thumbnailFile); setThumbnailPreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); } else setThumbnailPreview(null);
  }, [thumbnailFile]);

  useEffect(() => {
    if (authorImageFile) { const objectUrl = URL.createObjectURL(authorImageFile); setAuthorImagePreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); } else setAuthorImagePreview(null);
  }, [authorImageFile]);

  useEffect(() => {
    if (profileBannerFile) { const objectUrl = URL.createObjectURL(profileBannerFile); setProfileBannerPreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); } else setProfileBannerPreview(null);
  }, [profileBannerFile]);

  useEffect(() => {
    if (subscribeBannerFile) { const objectUrl = URL.createObjectURL(subscribeBannerFile); setSubscribeBannerPreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); } else setSubscribeBannerPreview(null);
  }, [subscribeBannerFile]);

  const handleFileSelect = (file: File, target: PasteTarget) => {
    if (!file.type.startsWith('image/')) { alert('이미지 파일만 업로드 가능합니다.'); return; }
    if (target === 'thumbnail') { 
      setThumbnailFile(file); 
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { setCropModal({ isOpen: true, imageSrc: e.target?.result as string, target }); setCrop({ x: 0, y: 0 }); setZoom(1); };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !cropModal.target) return;
    try {
      if (cropModal.target === 'author') {
        const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, 300, 400); 
        setAuthorImageFile(croppedFile); 
      } else if (cropModal.target === 'profile_banner') {
        const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, 800, 200); 
        setProfileBannerFile(croppedFile);
      } else if (cropModal.target === 'subscribe_banner') {
        const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, 800, 800); 
        setSubscribeBannerFile(croppedFile);
      }
      setCropModal({ isOpen: false, imageSrc: '', target: null });
    } catch (e) { alert('이미지 편집 중 오류가 발생했습니다.'); }
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }], ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image', 'video'], ['clean']
    ],
  }), []);

  const miniModules = useMemo(() => ({
    toolbar: [
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  }), []);

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); const val = hashtagInput.trim();
      if (val) {
        const newTags = val.split('#').map(tag => tag.trim()).filter(tag => tag.length > 0);
        setHashtags(prev => {
          const currentTags = prev[currentLang] || []; const tagsToAdd = newTags.filter(tag => !currentTags.includes(tag));
          if (tagsToAdd.length > 0) return { ...prev, [currentLang]: [...currentTags, ...tagsToAdd] }; return prev;
        });
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => { setHashtags(prev => ({ ...prev, [currentLang]: (prev[currentLang] || []).filter(tag => tag !== tagToRemove) })); };
  const handleClearThumbnail = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setThumbnailFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleClearAuthorImage = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setAuthorImageFile(null); setAuthorImageUrl(''); if (authorFileInputRef.current) authorFileInputRef.current.value = ''; };
  const handleClearProfileBanner = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setProfileBannerFile(null); setProfileBannerUrl(''); if (profileBannerFileInputRef.current) profileBannerFileInputRef.current.value = ''; };
  const handleClearSubscribeBanner = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setSubscribeBannerFile(null); setSubscribeBannerUrl(''); if (subscribeBannerFileInputRef.current) subscribeBannerFileInputRef.current.value = ''; };

  const handleSubmit = async (e: React.FormEvent, isPublished: boolean) => {
    e.preventDefault(); setIsSubmitting(true);
    let finalImageUrl = imageUrl; 
    let finalAuthorImageUrl = authorImageUrl; 
    let finalProfileBannerUrl = profileBannerUrl;
    let finalSubscribeBannerUrl = subscribeBannerUrl;

    const uploadImage = async (file: File) => {
      const fileExt = file.name.split('.').pop(); const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('article_images').upload(fileName, file);
      if (!uploadError) { const { data } = supabase.storage.from('article_images').getPublicUrl(fileName); return data.publicUrl; } 
      throw uploadError;
    };

    try {
      if (thumbnailFile) finalImageUrl = await uploadImage(thumbnailFile);
      if (authorImageFile) finalAuthorImageUrl = await uploadImage(authorImageFile);
      if (profileBannerFile) finalProfileBannerUrl = await uploadImage(profileBannerFile);
      if (subscribeBannerFile) finalSubscribeBannerUrl = await uploadImage(subscribeBannerFile);
    } catch (err: any) { alert(`업로드 실패: ${err.message}`); setIsSubmitting(false); return; }

    const translationsData: any = {};
    LANGUAGES.forEach((lang) => {
      if (lang.code !== 'en') {
        const tTitle = title[lang.code]; const tContent = content[lang.code]; const tHashtags = hashtags[lang.code] || [];
        const tAuthorName = authorName[lang.code]; const tAuthorBio = authorBio[lang.code];
        if (tTitle || tContent || tHashtags.length > 0 || tAuthorName || tAuthorBio) {
          translationsData[lang.code] = { title: tTitle, content: tContent, hashtags: tHashtags, author_name: tAuthorName, author_bio: tAuthorBio };
        }
      }
    });

    const articleData = {
      title: title['en'], content: content['en'], hashtags: JSON.stringify(hashtags['en'] || []), category, 
      image_url: finalImageUrl, 
      author_name: authorName['en'] || 'Editor-in-Chief', author_bio: authorBio['en'], author_image_url: finalAuthorImageUrl, 
      allow_comments: allowComments,
      profile_banner_url: finalProfileBannerUrl, 
      profile_banner_link: profileBannerLink, 
      profile_banner_alt: profileBannerAlt,
      profile_banner_text: profileBannerText,
      profile_banner_text_x: profileBannerTextX, // 💡 X 좌표 저장
      profile_banner_text_y: profileBannerTextY, // 💡 Y 좌표 저장
      profile_banner_visible: profileBannerVisible,
      subscribe_banner_url: finalSubscribeBannerUrl, 
      subscribe_banner_link: subscribeBannerLink, 
      subscribe_banner_alt: subscribeBannerAlt,
      subscribe_banner_text: subscribeBannerText,
      subscribe_banner_text_x: subscribeBannerTextX, // 💡 X 좌표 저장
      subscribe_banner_text_y: subscribeBannerTextY, // 💡 Y 좌표 저장
      subscribe_banner_visible: subscribeBannerVisible,
      is_published: isPublished, translations: translationsData, updated_at: new Date().toISOString()
    };

    let error;
    if (editId) { const { error: updateError } = await supabase.from('articles').update(articleData).eq('id', editId); error = updateError; } 
    else { const { error: insertError } = await supabase.from('articles').insert([articleData]); error = insertError; }

    setIsSubmitting(false);
    if (error) alert('저장 중 오류가 발생했습니다: ' + error.message); 
    else { alert(editId ? '수정되었습니다.' : (isPublished ? '기사가 발행되었습니다.' : '임시저장 되었습니다.')); router.push('/admin/articles'); }
  };

  if (isLoading) return <div className="text-center py-20 font-bold text-black">데이터 로딩중...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 p-8 min-h-screen relative">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-black">새 기사 작성</h1>
          <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-black">목록으로 돌아가기</Link>
        </div>
        
        <form className="space-y-6 text-black">
          {/* 상단 폼 유지 */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black">
                {availableCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">기사 하단 댓글 활성화</label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 border border-gray-300 px-4 py-2 rounded shadow-sm w-max">
                <span className={`text-sm font-bold ${allowComments ? 'text-green-600' : 'text-gray-400'}`}>{allowComments ? '댓글 허용됨 (ON)' : '댓글 차단됨 (OFF)'}</span>
                <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} className="w-4 h-4"/>
              </label>
            </div>
          </div>

          {/* 작성자 이미지 영역 */}
          <div className="bg-gray-50 p-6 rounded border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              작성자 프로필 사진 (공통)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 flex flex-col items-center">
                <div onMouseDownCapture={() => setPasteTarget('author')} onDragOver={(e) => { e.preventDefault(); setPasteTarget('author'); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0], 'author'); }} onClick={() => { authorFileInputRef.current?.click(); setPasteTarget('author'); }} className={`w-32 h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-colors ${pasteTarget === 'author' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                  <input type="file" accept="image/*" ref={authorFileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], 'author'); }} className="hidden" />
                  {authorImagePreview || authorImageUrl ? (
                    <><img src={authorImagePreview || authorImageUrl} alt="Author" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-bold">변경</div></>
                  ) : <span className="text-xs text-gray-400 text-center px-2 leading-relaxed">클릭 또는 <span className="text-blue-600 font-bold">Ctrl+V</span></span>}
                </div>
                {(authorImagePreview || authorImageUrl) && <button type="button" onClick={handleClearAuthorImage} className="mt-2 text-xs text-red-500 font-bold hover:underline">사진 삭제</button>}
              </div>
              <div className="md:col-span-9 flex flex-col justify-center">
                <p className="text-sm text-gray-600 bg-white p-4 border border-gray-200 rounded-md shadow-sm">💡 <strong>작성자의 이름과 이력/소개(Bio)는 하단의 <span className="text-blue-600">[언어 선택 탭]</span>에서 언어별로 각각 입력할 수 있습니다.</strong></p>
              </div>
            </div>
          </div>

          {/* 에디터 탭 및 언어 설정 */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <label className="block text-sm font-bold text-blue-600 mb-2">입력 언어 선택 (Author, Title, Tags, Content)</label>
            <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
              {LANGUAGES.map((lang) => (<button key={lang.code} type="button" onClick={() => setCurrentLang(lang.code)} className={`py-2 px-4 border rounded-t-md font-medium text-sm transition-colors whitespace-nowrap ${currentLang === lang.code ? 'border-gray-300 border-b-transparent bg-white text-black font-bold -mb-px z-10' : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{lang.label}</button>))}
            </nav>
          </div>

          <div className="border border-gray-300 rounded-b-md rounded-tr-md p-6 bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">작성자 이름 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label><input type="text" value={authorName[currentLang] || ''} onChange={(e) => setAuthorName(prev => ({ ...prev, [currentLang]: e.target.value }))} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">작성자 소개 (Bio) <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label><textarea value={authorBio[currentLang] || ''} onChange={(e) => setAuthorBio(prev => ({ ...prev, [currentLang]: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black resize-none" /></div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">기사 제목 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label><input type="text" value={title[currentLang] || ''} onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))} className="w-full border border-gray-300 rounded p-3 text-lg focus:outline-none focus:border-black" required={currentLang === 'en'} /></div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">해시태그 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label>
              <div className="w-full border border-gray-300 rounded p-2 flex flex-wrap gap-2 items-center bg-white focus-within:border-black">
                {(hashtags[currentLang] || []).map((tag, idx) => (<span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1 border border-gray-200">{tag} <button type="button" onClick={() => removeHashtag(tag)} className="text-gray-400 hover:text-red-500 text-xs">✕</button></span>))}
                <input type="text" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={handleHashtagKeyDown} className="flex-grow outline-none p-1 text-sm min-w-[300px]" />
              </div>
            </div>
            <div className="border border-gray-300 rounded">
              <div className="flex bg-gray-50 border-b border-gray-300 overflow-x-auto">
                <button type="button" onClick={() => setEditorMode('general')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'general' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>일반 글쓰기</button>
                <button type="button" onClick={() => setEditorMode('html')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'html' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>HTML 에디터</button>
                <button type="button" onClick={() => setEditorMode('preview')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'preview' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>미리보기</button>
              </div>
              <div className="bg-white min-h-[400px]">
                {LANGUAGES.map(lang => (<div key={`editor-${lang.code}`} style={{ display: editorMode === 'general' && currentLang === lang.code ? 'block' : 'none' }}><ReactQuill theme="snow" defaultValue={content[lang.code] || ''} onChange={(val: string, delta: any, source: string) => { if (source === 'user') setContent(prev => ({ ...prev, [lang.code]: val })); }} className="h-96" modules={modules} /></div>))}
                <div style={{ display: editorMode === 'html' ? 'block' : 'none' }}><textarea value={content[currentLang] || ''} onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))} className="w-full h-96 p-4 border-none focus:outline-none font-mono text-sm bg-gray-50 text-gray-800" /></div>
                <div style={{ display: editorMode === 'preview' ? 'block' : 'none' }}><div className="w-full h-96 p-4 overflow-y-auto prose max-w-none" dangerouslySetInnerHTML={{ __html: content[currentLang] || '<p className="text-gray-400">미리볼 내용이 없습니다.</p>' }} /></div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 space-y-8">
            {/* 썸네일 영역 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">메인 썸네일 이미지</label>
              <div className="space-y-4">
                <div onMouseDownCapture={() => setPasteTarget('thumbnail')} onDragOver={(e) => { e.preventDefault(); setPasteTarget('thumbnail'); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0], 'thumbnail'); }} tabIndex={0} className={`relative w-full max-w-md border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[120px] ${pasteTarget === 'thumbnail' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="file" accept=".jpg, .jpeg, .png, .webp" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], 'thumbnail'); }} className="hidden" />
                  {thumbnailPreview ? (<div className="relative inline-block"><img src={thumbnailPreview} className="max-h-48 object-contain rounded border border-gray-200 shadow-sm" /><button type="button" onClick={handleClearThumbnail} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 font-bold shadow-md">✕</button></div>) : (<label onClick={() => fileInputRef.current?.click()} className="cursor-pointer flex flex-col items-center w-full"><span className="block font-bold text-gray-700 text-base">클릭 또는 <span className="text-blue-600">Ctrl+V</span></span></label>)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
              {/* 프로필 하단 배너 (4:1) */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-800">프로필 하단 배너 <span className="text-xs text-blue-600">(4:1 비율)</span></h3>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
                    <span className={`text-xs font-bold ${profileBannerVisible ? 'text-green-600' : 'text-gray-400'}`}>{profileBannerVisible ? 'ON' : 'OFF'}</span>
                    <input type="checkbox" checked={profileBannerVisible} onChange={(e) => setProfileBannerVisible(e.target.checked)} className="w-3 h-3"/>
                  </label>
                </div>
                <div className="flex flex-col gap-4">
                  <div onMouseDownCapture={() => setPasteTarget('profile_banner')} onDragOver={(e) => { e.preventDefault(); setPasteTarget('profile_banner'); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0], 'profile_banner'); }} onClick={() => profileBannerFileInputRef.current?.click()} className={`w-full aspect-[4/1] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${pasteTarget === 'profile_banner' ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                    <input type="file" accept="image/*" ref={profileBannerFileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], 'profile_banner'); }} className="hidden" />
                    {profileBannerPreview || profileBannerUrl ? (
                      <img src={profileBannerPreview || profileBannerUrl} className="w-full h-full object-cover" />
                    ) : <span className="text-xs text-gray-400 text-center px-2">클릭 또는 <span className="text-blue-600 font-bold">Ctrl+V</span></span>}
                  </div>
                  {(profileBannerPreview || profileBannerUrl) && <button type="button" onClick={handleClearProfileBanner} className="text-xs text-red-500 font-bold text-right w-full">삭제</button>}
                  
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">광고 이동 URL</label>
                      <input type="text" value={profileBannerLink} onChange={(e) => setProfileBannerLink(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">SEO 대체 텍스트 (Alt)</label>
                      <input type="text" value={profileBannerAlt} onChange={(e) => setProfileBannerAlt(e.target.value)} placeholder="예: 여드름 치료 Q&A 확인하기" className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black" />
                    </div>
                    {/* 💡 텍스트 오버레이 편집 + 드래그 미리보기 영역 */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">배너 텍스트 입력 및 위치 조정</label>
                      <div className="bg-white rounded border border-gray-300 h-24 mb-2">
                        <ReactQuill theme="snow" value={profileBannerText} onChange={setProfileBannerText} modules={miniModules} className="h-full" />
                      </div>
                      <DraggablePreview 
                        bgUrl={profileBannerPreview || profileBannerUrl} 
                        textHtml={profileBannerText} 
                        aspect={4/1} 
                        x={profileBannerTextX} 
                        y={profileBannerTextY} 
                        onPosChange={(nx: number, ny: number) => { setProfileBannerTextX(nx); setProfileBannerTextY(ny); }} 
                      />
                      <p className="text-[10px] text-gray-500 mt-1">이미지 내의 텍스트 박스를 드래그하여 위치를 조정하세요.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 구독 박스 하단 배너 (1:1) */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-800">구독 하단 배너 <span className="text-xs text-red-500">(1:1 비율)</span></h3>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
                    <span className={`text-xs font-bold ${subscribeBannerVisible ? 'text-green-600' : 'text-gray-400'}`}>{subscribeBannerVisible ? 'ON' : 'OFF'}</span>
                    <input type="checkbox" checked={subscribeBannerVisible} onChange={(e) => setSubscribeBannerVisible(e.target.checked)} className="w-3 h-3"/>
                  </label>
                </div>
                <div className="flex flex-col xl:flex-row gap-4">
                  <div className="shrink-0 w-32">
                    <div onMouseDownCapture={() => setPasteTarget('subscribe_banner')} onDragOver={(e) => { e.preventDefault(); setPasteTarget('subscribe_banner'); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0], 'subscribe_banner'); }} onClick={() => subscribeBannerFileInputRef.current?.click()} className={`w-32 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${pasteTarget === 'subscribe_banner' ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                      <input type="file" accept="image/*" ref={subscribeBannerFileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], 'subscribe_banner'); }} className="hidden" />
                      {subscribeBannerPreview || subscribeBannerUrl ? (
                        <img src={subscribeBannerPreview || subscribeBannerUrl} className="w-full h-full object-cover" />
                      ) : <span className="text-xs text-gray-400 text-center px-2">클릭 또는 <span className="text-blue-600 font-bold">Ctrl+V</span></span>}
                    </div>
                    {(subscribeBannerPreview || subscribeBannerUrl) && <button type="button" onClick={handleClearSubscribeBanner} className="text-xs text-red-500 font-bold text-center w-full mt-2">삭제</button>}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">광고 이동 URL</label>
                      <input type="text" value={subscribeBannerLink} onChange={(e) => setSubscribeBannerLink(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">SEO 대체 텍스트 (Alt)</label>
                      <input type="text" value={subscribeBannerAlt} onChange={(e) => setSubscribeBannerAlt(e.target.value)} placeholder="문장형 제품 설명 및 키워드" className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black" />
                    </div>
                    {/* 💡 텍스트 오버레이 편집 + 드래그 미리보기 영역 */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">배너 텍스트 입력 및 위치 조정</label>
                      <div className="bg-white rounded border border-gray-300 h-24 mb-2">
                        <ReactQuill theme="snow" value={subscribeBannerText} onChange={setSubscribeBannerText} modules={miniModules} className="h-full" />
                      </div>
                      <DraggablePreview 
                        bgUrl={subscribeBannerPreview || subscribeBannerUrl} 
                        textHtml={subscribeBannerText} 
                        aspect={1/1} 
                        x={subscribeBannerTextX} 
                        y={subscribeBannerTextY} 
                        onPosChange={(nx: number, ny: number) => { setSubscribeBannerTextX(nx); setSubscribeBannerTextY(ny); }} 
                      />
                      <p className="text-[10px] text-gray-500 mt-1">이미지 내의 텍스트 박스를 드래그하여 위치를 조정하세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-black">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition text-sm">임시 저장</button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting} className="px-6 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 transition text-sm">발행하기</button>
          </div>
        </form>
      </div>

      {cropModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg flex flex-col gap-4 shadow-2xl">
            <div><h3 className="text-xl font-bold text-black">이미지 자르기</h3></div>
            <div className="relative w-full h-[50vh] min-h-[300px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Cropper 
                image={cropModal.imageSrc} 
                crop={crop} zoom={zoom} 
                aspect={
                  cropModal.target === 'profile_banner' ? 4 / 1 :
                  cropModal.target === 'subscribe_banner' ? 1 / 1 : 
                  3 / 4
                } 
                onCropChange={setCrop} onCropComplete={(_, px) => setCroppedAreaPixels(px)} onZoomChange={setZoom} 
              />
            </div>
            <div className="flex justify-end gap-3 mt-4"><button onClick={() => setCropModal({ isOpen: false, imageSrc: '', target: null })} className="px-6 py-2.5 border rounded font-bold">취소</button><button onClick={handleCropSave} className="px-6 py-2.5 bg-blue-700 text-white rounded font-bold">적용하기</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WriteArticlePage() {
  return <Suspense fallback={<div className="text-center p-10">로딩 중...</div>}><WriteArticleForm /></Suspense>;
}
