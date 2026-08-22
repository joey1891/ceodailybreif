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

// 💡 크롭 처리 헬퍼 함수
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
        if (blob) resolve(new File([blob], `author-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        else reject('Blob conversion failed');
      }, 'image/jpeg', 0.95);
    };
    image.onerror = reject;
  });
};

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
  
  const [authorName, setAuthorName] = useState('Editor-in-Chief');
  const [authorBio, setAuthorBio] = useState('');
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(null);
  const [authorImageUrl, setAuthorImageUrl] = useState('');
  const authorFileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthorDragging, setIsAuthorDragging] = useState(false);
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 복사 붙여넣기(Ctrl+V) 시 어떤 요소에 사진을 넣을지 추적
  const [pasteTarget, setPasteTarget] = useState<'thumbnail' | 'author'>('thumbnail');

  // 💡 크롭(사진 자르기/위치조정) 모달 관련 State
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; target: 'thumbnail' | 'author' | null }>({ isOpen: false, imageSrc: '', target: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const safeExtractString = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (val.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(val);
          return parsed.en || parsed.ko || Object.values(parsed)[0] || '';
        } catch { return val; }
      }
      return val;
    }
    if (typeof val === 'object') {
      return val.en || val.ko || Object.values(val)[0] || '';
    }
    return String(val);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('name').order('sort_order', { ascending: true });
      if (data && !error) {
        const uniqueCategories = data.map(item => item.name).filter(Boolean);
        if (uniqueCategories.length === 0) {
            uniqueCategories.push('POLITICS', 'ECONOMY', 'INDUSTRY', 'K-TECH', 'K-CULTURE', 'K-BEAUTY', 'K-MEDICAL', 'K-PHARMA', 'K-ATTRACTIONS');
        }
        setAvailableCategories(uniqueCategories as string[]);
        if (!editId && uniqueCategories.length > 0) setCategory(uniqueCategories[0]);
      }
    };

    const fetchArticle = async () => {
      if (!editId) return;
      const { data, error } = await supabase.from('articles').select('*').eq('id', editId).single();
      if (data) {
        const newTitle = { ...initialTextState };
        const newContent = { ...initialTextState };
        const newHashtags = { ...initialTagsState };

        newTitle['en'] = safeExtractString(data.title);
        newContent['en'] = safeExtractString(data.content);
        
        try {
          const parsedTags = data.hashtags ? JSON.parse(data.hashtags) : [];
          if (Array.isArray(parsedTags)) { newHashtags['en'] = parsedTags; } 
          else if (typeof parsedTags === 'object') { const tags = parsedTags.en || parsedTags.ko || Object.values(parsedTags)[0]; newHashtags['en'] = Array.isArray(tags) ? tags : []; } 
          else { newHashtags['en'] = []; }
        } catch(e) {
          newHashtags['en'] = typeof data.hashtags === 'string' ? [data.hashtags] : [];
        }

        if (data.translations) {
          Object.keys(data.translations).forEach(lang => {
            if (LANGUAGES.some(l => l.code === lang)) {
              newTitle[lang] = data.translations[lang].title || '';
              newContent[lang] = data.translations[lang].content || '';
              newHashtags[lang] = data.translations[lang].hashtags || [];
            }
          });
        }

        setTitle(newTitle); setContent(newContent); setHashtags(newHashtags);
        setCategory(data.category || 'POLITICS'); setImageUrl(data.image_url || '');
        setAuthorName(data.author_name || 'Editor-in-Chief'); setAuthorBio(data.author_bio || ''); setAuthorImageUrl(data.author_image_url || '');
      }
    };

    Promise.all([fetchCategories(), fetchArticle()]).finally(() => setIsLoading(false));
  }, [editId]);

  useEffect(() => {
    if (thumbnailFile) { const objectUrl = URL.createObjectURL(thumbnailFile); setThumbnailPreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); } 
    else { setThumbnailPreview(null); }
  }, [thumbnailFile]);

  useEffect(() => {
    if (authorImageFile) { const objectUrl = URL.createObjectURL(authorImageFile); setAuthorImagePreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); } 
    else { setAuthorImagePreview(null); }
  }, [authorImageFile]);

  // 💡 공통 파일 처리 함수 (작성자 사진은 모달 호출, 썸네일은 바로 세팅)
  const handleFileSelect = (file: File, target: 'thumbnail' | 'author') => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.'); return;
    }
    if (target === 'author') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropModal({ isOpen: true, imageSrc: e.target?.result as string, target: 'author' });
        setCrop({ x: 0, y: 0 }); setZoom(1);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(file);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputOrEditor = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.ql-editor');
      if (isInputOrEditor || cropModal.isOpen) return;

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

  const handleCropSave = async () => {
    if (!croppedAreaPixels || cropModal.target !== 'author') return;
    try {
      const croppedFile = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels, 300, 400); // 💡 직사각형(3:4 비율)에 맞춤
      setAuthorImageFile(croppedFile);
      setCropModal({ isOpen: false, imageSrc: '', target: null });
    } catch (e) {
      console.error(e);
      alert('이미지 편집 중 오류가 발생했습니다.');
    }
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image', 'video'], 
      ['clean']
    ],
  }), []);

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = hashtagInput.trim();
      if (val) {
        const newTags = val.split('#').map(tag => tag.trim()).filter(tag => tag.length > 0);
        setHashtags(prev => {
          const currentTags = prev[currentLang] || [];
          const tagsToAdd = newTags.filter(tag => !currentTags.includes(tag));
          if (tagsToAdd.length > 0) { return { ...prev, [currentLang]: [...currentTags, ...tagsToAdd] }; }
          return prev;
        });
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(prev => ({ ...prev, [currentLang]: (prev[currentLang] || []).filter(tag => tag !== tagToRemove) }));
  };

  const handleClearThumbnail = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setThumbnailFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleClearAuthorImage = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setAuthorImageFile(null); setAuthorImageUrl(''); if (authorFileInputRef.current) authorFileInputRef.current.value = ''; };

  const handleSubmit = async (e: React.FormEvent, isPublished: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalImageUrl = imageUrl;
    let finalAuthorImageUrl = authorImageUrl;

    if (thumbnailFile) {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('article_images').upload(fileName, thumbnailFile);
      if (!uploadError) { const { data: publicUrlData } = supabase.storage.from('article_images').getPublicUrl(fileName); finalImageUrl = publicUrlData.publicUrl; } 
      else { alert(`썸네일 업로드 실패: ${uploadError.message}`); setIsSubmitting(false); return; }
    }

    if (authorImageFile) {
      const fileExt = authorImageFile.name.split('.').pop();
      const fileName = `author-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('article_images').upload(fileName, authorImageFile);
      if (!uploadError) { const { data: publicUrlData } = supabase.storage.from('article_images').getPublicUrl(fileName); finalAuthorImageUrl = publicUrlData.publicUrl; } 
      else { alert(`작성자 사진 업로드 실패: ${uploadError.message}`); setIsSubmitting(false); return; }
    }

    const translationsData: any = {};
    LANGUAGES.forEach((lang) => {
      if (lang.code !== 'en') {
        const tTitle = title[lang.code]; const tContent = content[lang.code]; const tHashtags = hashtags[lang.code] || [];
        if (tTitle || tContent || tHashtags.length > 0) { translationsData[lang.code] = { title: tTitle, content: tContent, hashtags: tHashtags }; }
      }
    });

    const articleData = {
      title: title['en'], content: content['en'], hashtags: JSON.stringify(hashtags['en'] || []), category, image_url: finalImageUrl, 
      author_name: authorName, author_bio: authorBio, author_image_url: finalAuthorImageUrl, is_published: isPublished, translations: translationsData, updated_at: new Date().toISOString()
    };

    let error;
    if (editId) { const { error: updateError } = await supabase.from('articles').update(articleData).eq('id', editId); error = updateError; } 
    else { const { error: insertError } = await supabase.from('articles').insert([articleData]); error = insertError; }

    setIsSubmitting(false);

    if (error) { alert('저장 중 오류가 발생했습니다: ' + error.message); } 
    else { alert(editId ? '수정되었습니다.' : (isPublished ? '기사가 발행되었습니다.' : '임시저장 되었습니다.')); router.push('/admin/articles'); }
  };

  if (isLoading) return <div className="text-center py-20 font-bold text-black">데이터 로딩중...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 p-8 min-h-screen relative">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-black">새 기사 작성</h1>
          <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-black">
            목록으로 돌아가기
          </Link>
        </div>
        
        <form className="space-y-6 text-black">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full md:w-1/2 border border-gray-300 rounded p-2 focus:outline-none focus:border-black">
              {availableCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-6 rounded border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              작성자 정보 (Author Profile)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* 💡 작성자 사진: 직사각형(3:4비율), 드래그 앤 드롭 및 붙여넣기(Ctrl+V) 지원 */}
              <div className="md:col-span-3 flex flex-col items-center">
                <label className="block text-sm font-bold text-gray-700 mb-2 self-start flex items-center gap-2">
                  프로필 사진
                  {pasteTarget === 'author' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shadow-sm">Ctrl+V 대상</span>}
                </label>
                
                <div 
                  onMouseDownCapture={() => setPasteTarget('author')}
                  onDragOver={(e) => { e.preventDefault(); setIsAuthorDragging(true); setPasteTarget('author'); }}
                  onDragLeave={() => setIsAuthorDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsAuthorDragging(false); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0], 'author'); }}
                  onClick={() => { authorFileInputRef.current?.click(); setPasteTarget('author'); }}
                  className={`w-32 h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-colors 
                    ${pasteTarget === 'author' ? 'border-blue-500 bg-blue-50' : isAuthorDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}
                  `}
                >
                  <input 
                    type="file" accept="image/*" ref={authorFileInputRef} 
                    onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], 'author'); }} 
                    className="hidden" 
                  />
                  {authorImagePreview || authorImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={authorImagePreview || authorImageUrl} alt="Author" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-bold">변경</div>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 text-center px-2 leading-relaxed">
                      클릭, 드래그 <br/>또는 <span className="text-blue-600 font-bold">Ctrl+V</span>
                    </span>
                  )}
                </div>
                {(authorImagePreview || authorImageUrl) && (
                  <button type="button" onClick={handleClearAuthorImage} className="mt-2 text-xs text-red-500 font-bold hover:underline">사진 삭제</button>
                )}
              </div>

              <div className="md:col-span-9 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">작성자 (Name / Title)</label>
                  <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="예: John Doe, Editor-in-Chief" className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">간단한 이력/소개 (Bio)</label>
                  <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} rows={3} placeholder="작성자의 전문성, 경력, 소개 등을 짧게 입력하세요." className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <label className="block text-sm font-bold text-blue-600 mb-2">입력 언어 선택 (Title, Tags, Content)</label>
            <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code} type="button" onClick={() => setCurrentLang(lang.code)}
                  className={`py-2 px-4 border rounded-t-md font-medium text-sm transition-colors whitespace-nowrap
                    ${currentLang === lang.code ? 'border-gray-300 border-b-transparent bg-white text-black font-bold -mb-px z-10' : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {lang.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="border border-gray-300 rounded-b-md rounded-tr-md p-6 bg-white space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">제목 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label>
              <input type="text" value={title[currentLang] || ''} onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))} placeholder="기사 제목을 입력하세요" className="w-full border border-gray-300 rounded p-3 text-lg focus:outline-none focus:border-black" required={currentLang === 'en'} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">해시태그 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label>
              <div className="w-full border border-gray-300 rounded p-2 flex flex-wrap gap-2 items-center bg-white focus-within:border-black">
                {(hashtags[currentLang] || []).map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1 border border-gray-200">
                    {tag} <button type="button" onClick={() => removeHashtag(tag)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                  </span>
                ))}
                <input type="text" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={handleHashtagKeyDown} placeholder="해시태그 띄어쓰기 또는 # 기호로 구분 후 Enter" className="flex-grow outline-none p-1 text-sm min-w-[300px]" />
              </div>
            </div>

            <div className="border border-gray-300 rounded">
              <div className="flex bg-gray-50 border-b border-gray-300 overflow-x-auto">
                <button type="button" onClick={() => setEditorMode('general')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'general' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>일반 글쓰기</button>
                <button type="button" onClick={() => setEditorMode('html')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'html' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>HTML 에디터</button>
                <button type="button" onClick={() => setEditorMode('preview')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'preview' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>미리보기</button>
              </div>
              
              <div className="bg-white min-h-[400px]">
                {LANGUAGES.map(lang => (
                  <div key={`editor-${lang.code}`} style={{ display: editorMode === 'general' && currentLang === lang.code ? 'block' : 'none' }}>
                    <ReactQuill theme="snow" defaultValue={content[lang.code] || ''} onChange={(val: string, delta: any, source: string) => { if (source === 'user') { setContent(prev => ({ ...prev, [lang.code]: val })); } }} className="h-96" modules={modules} />
                  </div>
                ))}
                <div style={{ display: editorMode === 'html' ? 'block' : 'none' }}>
                  <textarea value={content[currentLang] || ''} onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))} className="w-full h-96 p-4 border-none focus:outline-none font-mono text-sm bg-gray-50 text-gray-800" placeholder="HTML 코드를 직접 입력하세요..." />
                </div>
                <div style={{ display: editorMode === 'preview' ? 'block' : 'none' }}>
                  <div className="w-full h-96 p-4 overflow-y-auto prose max-w-none" dangerouslySetInnerHTML={{ __html: content[currentLang] || '<p className="text-gray-400">미리볼 내용이 없습니다.</p>' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              메인 썸네일 이미지
              {pasteTarget === 'thumbnail' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shadow-sm">Ctrl+V 대상</span>}
            </label>
            
            <div className="space-y-4">
              <div>
                <div 
                  onMouseDownCapture={() => setPasteTarget('thumbnail')}
                  onDragOver={(e) => { e.preventDefault(); setIsThumbnailDragging(true); setPasteTarget('thumbnail'); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsThumbnailDragging(false); }}
                  onDrop={(e) => { e.preventDefault(); setIsThumbnailDragging(false); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0], 'thumbnail'); }}
                  tabIndex={0}
                  className={`relative w-full border-2 border-dashed rounded-lg p-6 transition-colors focus:outline-none cursor-pointer flex flex-col items-center justify-center min-h-[120px]
                    ${pasteTarget === 'thumbnail' ? 'border-blue-500 bg-blue-50' : isThumbnailDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                  `}
                >
                  <input type="file" accept=".jpg, .jpeg, .png, .webp" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0], 'thumbnail'); }} className="hidden" id="thumbnail-upload" />
                  
                  {thumbnailPreview ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailPreview} alt="Thumbnail Preview" className="max-h-48 object-contain rounded border border-gray-200 shadow-sm" />
                      <button type="button" onClick={handleClearThumbnail} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 transition-colors z-10" title="이미지 삭제">✕</button>
                    </div>
                  ) : (
                    <label htmlFor="thumbnail-upload" className="cursor-pointer flex flex-col items-center w-full">
                      <svg className={`w-10 h-10 mb-2 transition-colors ${pasteTarget === 'thumbnail' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      <span className="block font-bold text-gray-700 text-base text-center">
                        클릭하여 파일 선택, <span className="text-blue-600">이미지 붙여넣기 (Ctrl+V)</span> <br/>
                        또는 <span className="text-blue-600">여기로 파일 드래그 앤 드롭</span>
                      </span>
                      <span className="block text-xs text-gray-400 mt-2">jpg, png, webp 형식의 이미지를 업로드해주세요.</span>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">방법 2: 이미지 URL 입력 (파일 업로드 시 무시됨)</span>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-black">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition text-sm">임시 저장</button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting} className="px-6 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 transition text-sm">발행하기</button>
          </div>
        </form>
      </div>

      {/* 🎬 [추가됨] 작성자 사진 위치 조정(크롭) 모달 */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-black">프로필 사진 자르기</h3>
              <p className="text-sm text-gray-500 mt-1">마우스로 드래그하여 영역을 맞추세요. (마우스 휠로 확대/축소 가능)</p>
            </div>
            
            <div className="relative w-full h-[50vh] min-h-[300px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Cropper
                image={cropModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4} // 💡 3:4 직사각형 비율
                onCropChange={setCrop}
                onCropComplete={(_, px) => setCroppedAreaPixels(px)}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCropModal({ isOpen: false, imageSrc: '', target: null })} className="px-6 py-2.5 border border-gray-300 text-black rounded font-bold hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleCropSave} className="px-6 py-2.5 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 transition-colors">적용하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WriteArticlePage() {
  return (
    <Suspense fallback={<div className="text-center p-10 text-black">로딩 중...</div>}>
      <WriteArticleForm />
    </Suspense>
  );
}
