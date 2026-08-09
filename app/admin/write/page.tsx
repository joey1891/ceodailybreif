'use client';

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
  },
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center bg-gray-50 text-gray-500">에디터 로딩중...</div> }
);

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
  
  const [category, setCategory] = useState('Politics & Policy');
  const [authorName, setAuthorName] = useState('Editor-in-Chief');
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

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
    if (editId) {
      const fetchArticle = async () => {
        const { data, error } = await supabase.from('articles').select('*').eq('id', editId).single();
        if (data) {
          const newTitle = { ...initialTextState };
          const newContent = { ...initialTextState };
          const newHashtags = { ...initialTagsState };

          newTitle['en'] = safeExtractString(data.title);
          newContent['en'] = safeExtractString(data.content);
          
          try {
            const parsedTags = data.hashtags ? JSON.parse(data.hashtags) : [];
            if (Array.isArray(parsedTags)) {
              newHashtags['en'] = parsedTags;
            } else if (typeof parsedTags === 'object') {
              const tags = parsedTags.en || parsedTags.ko || Object.values(parsedTags)[0];
              newHashtags['en'] = Array.isArray(tags) ? tags : [];
            } else {
              newHashtags['en'] = [];
            }
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

          setTitle(newTitle);
          setContent(newContent);
          setHashtags(newHashtags);
          setCategory(data.category || 'Politics & Policy');
          setImageUrl(data.image_url || '');
          setAuthorName(data.author_name || 'Editor-in-Chief');
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [editId]);

  useEffect(() => {
    if (thumbnailFile) {
      const objectUrl = URL.createObjectURL(thumbnailFile);
      setThumbnailPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'align': [] }],
      ['image', 'video'],
      ['clean']
    ],
  }), []);

  // 💡 방어 코드 적용: 콜백 형태로 업데이트하여 기존 데이터 덮어쓰기 방지
  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = hashtagInput.trim();
      if (val) {
        setHashtags(prev => {
          const currentTags = prev[currentLang] || [];
          if (!currentTags.includes(val)) {
            return { ...prev, [currentLang]: [...currentTags, val] };
          }
          return prev;
        });
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(prev => ({
      ...prev,
      [currentLang]: (prev[currentLang] || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePasteImage = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setThumbnailFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setThumbnailFile(file);
      } else {
        alert('이미지 파일만 업로드 가능합니다.');
      }
    }
  };

  const handleClearThumbnail = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setThumbnailFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent, isPublished: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalImageUrl = imageUrl;

    if (thumbnailFile) {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('article_images') 
        .upload(fileName, thumbnailFile);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('article_images').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      } else {
        console.error("Supabase 업로드 에러:", uploadError);
        alert(`이미지 업로드 실패: ${uploadError.message}\n(권한 설정을 확인하세요)`);
        setIsSubmitting(false);
        return; 
      }
    }

    const translationsData: any = {};
    LANGUAGES.forEach((lang) => {
      if (lang.code !== 'en') {
        const tTitle = title[lang.code];
        const tContent = content[lang.code];
        const tHashtags = hashtags[lang.code] || [];
        
        if (tTitle || tContent || tHashtags.length > 0) {
          translationsData[lang.code] = {
            title: tTitle,
            content: tContent,
            hashtags: tHashtags
          };
        }
      }
    });

    const articleData = {
      title: title['en'], 
      content: content['en'], 
      hashtags: JSON.stringify(hashtags['en'] || []), 
      category, 
      image_url: finalImageUrl, 
      author_name: authorName, 
      is_published: isPublished,
      translations: translationsData, 
      updated_at: new Date().toISOString()
    };

    let error;
    if (editId) {
      const { error: updateError } = await supabase.from('articles').update(articleData).eq('id', editId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('articles').insert([articleData]);
      error = insertError;
    }

    setIsSubmitting(false);

    if (error) {
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert(editId ? '수정되었습니다.' : (isPublished ? '기사가 발행되었습니다.' : '임시저장 되었습니다.'));
      router.push('/admin/articles');
    }
  };

  if (isLoading) return <div className="text-center py-20 font-bold text-black">데이터 로딩중...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 p-8 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-black">새 기사 작성</h1>
          <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-black">
            목록으로 돌아가기
          </Link>
        </div>
        
        <form className="space-y-6 text-black">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black">
                <option value="Politics & Policy">Politics & Policy</option>
                <option value="Economy & Markets">Economy & Markets</option>
                <option value="Chaebol & Industry">Chaebol & Industry</option>
                <option value="Tech & Innovation">Tech & Innovation</option>
                <option value="K-Beauty">K-Beauty</option>
                <option value="K-Culture & Society">K-Culture & Society</option>
                <option value="Editorial">Editorial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">작성자 (Author)</label>
              <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black" />
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <label className="block text-sm font-bold text-blue-600 mb-2">입력 언어 선택 (Title, Tags, Content)</label>
            <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setCurrentLang(lang.code)}
                  className={`
                    py-2 px-4 border rounded-t-md font-medium text-sm transition-colors whitespace-nowrap
                    ${currentLang === lang.code 
                      ? 'border-gray-300 border-b-transparent bg-white text-black font-bold -mb-px z-10' 
                      : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }
                  `}
                >
                  {lang.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="border border-gray-300 rounded-b-md rounded-tr-md p-6 bg-white space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">제목 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label>
              {/* 💡 방어 코드 적용: 콜백(prev) 패턴으로 기존 데이터 보호 */}
              <input 
                type="text" 
                value={title[currentLang] || ''} 
                onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))} 
                placeholder="기사 제목을 입력하세요" 
                className="w-full border border-gray-300 rounded p-3 text-lg focus:outline-none focus:border-black" 
                required={currentLang === 'en'}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">해시태그 <span className="text-blue-500 font-normal">[{currentLang.toUpperCase()}]</span></label>
              <div className="w-full border border-gray-300 rounded p-2 flex flex-wrap gap-2 items-center bg-white focus-within:border-black">
                {(hashtags[currentLang] || []).map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1 border border-gray-200">
                    {tag}
                    <button type="button" onClick={() => removeHashtag(tag)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                  </span>
                ))}
                <input 
                  type="text" 
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  placeholder="해시태그 입력 후 Enter (예: KBeauty, Tech)" 
                  className="flex-grow outline-none p-1 text-sm min-w-[200px]" 
                />
              </div>
            </div>

            <div className="border border-gray-300 rounded">
              <div className="flex bg-gray-50 border-b border-gray-300 overflow-x-auto">
                <button type="button" onClick={() => setEditorMode('general')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'general' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>일반 글쓰기</button>
                <button type="button" onClick={() => setEditorMode('html')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'html' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>HTML 에디터</button>
                <button type="button" onClick={() => setEditorMode('preview')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${editorMode === 'preview' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>미리보기</button>
              </div>
              
              <div className="bg-white min-h-[400px]">
                {editorMode === 'general' && (
                  <ReactQuill 
                    theme="snow" 
                    value={content[currentLang] || ''} 
                    {/* 💡 방어 코드 적용: 콜백(prev) 패턴으로 에디터 상태 덮어쓰기 완전 차단 */}
                    onChange={(val: string) => setContent(prev => ({ ...prev, [currentLang]: val }))} 
                    className="h-96" 
                    modules={modules} 
                  />
                )}
                
                {editorMode === 'html' && (
                  <textarea 
                    value={content[currentLang] || ''}
                    {/* 💡 방어 코드 적용 */}
                    onChange={(e) => setContent(prev => ({ ...prev, [currentLang]: e.target.value }))}
                    className="w-full h-96 p-4 border-none focus:outline-none font-mono text-sm bg-gray-50 text-gray-800"
                    placeholder="HTML 코드를 직접 입력하세요..."
                  />
                )}

                {editorMode === 'preview' && (
                  <div 
                    className="w-full h-96 p-4 overflow-y-auto prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: content[currentLang] || '<p className="text-gray-400">미리볼 내용이 없습니다.</p>' }}
                  />
                )}
              </div>
            </div>

          </div>

          <div className="mt-8 border-t pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">썸네일 이미지</label>
            
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-gray-500 mb-1">방법 1: 파일 직접 업로드 (드래그 앤 드롭 또는 Ctrl+V)</span>
                
                <div 
                  className={`relative w-full border-2 border-dashed rounded-lg p-6 transition-colors focus:outline-none cursor-pointer flex flex-col items-center justify-center min-h-[120px]
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                  `}
                  onPaste={handlePasteImage}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  tabIndex={0}
                >
                  <input 
                    type="file" 
                    accept=".jpg, .jpeg, .png, .webp"
                    ref={fileInputRef}
                    onChange={(e) => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden" 
                    id="thumbnail-upload"
                  />
                  
                  {thumbnailPreview ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailPreview} alt="Thumbnail Preview" className="max-h-48 object-contain rounded border border-gray-200 shadow-sm" />
                      <button 
                        type="button" 
                        onClick={handleClearThumbnail} 
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 transition-colors z-10"
                        title="이미지 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="thumbnail-upload" className="cursor-pointer flex flex-col items-center w-full">
                      <svg className={`w-10 h-10 mb-2 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
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
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://..." 
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-black">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={isSubmitting} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition text-sm">
              임시 저장
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting} className="px-6 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 transition text-sm">
              발행하기
            </button>
          </div>
        </form>
      </div>
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
