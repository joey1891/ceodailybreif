'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
// 주석 처리되었던 진짜 라이브러리들을 다시 불러옵니다.
import { supabase } from '@/utils/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 메인 폼 컴포넌트
function WriteArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams?.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('News');
  const [author, setAuthor] = useState('Editor-in-Chief');
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 입력 초기화를 위한 참조
  useEffect(() => {
    if (articleId) {
      fetchArticle(articleId);
    }
  }, [articleId]);

  const fetchArticle = async (id: string) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      setTitle(data.title || '');
      const fetchedContent = data.content || '';
      setContent(fetchedContent);
      setCategory(data.category || 'News');
      setAuthor(data.author_name || 'Editor-in-Chief'); 
      setThumbnailUrl(data.image_url || ''); 
      
      if (editorRef.current && editorMode === 'visual') {
        editorRef.current.innerHTML = fetchedContent;
      }
    }
  };

  useEffect(() => {
    if (editorMode === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [editorMode, content]);

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    setIsUploading(true);

    const { error: uploadError } = await supabase.storage
      .from('article_images')
      .upload(filePath, file);

    if (uploadError) {
      alert('이미지 업로드에 실패했습니다: ' + uploadError.message);
      setIsUploading(false);
      return null;
    }

    const { data } = supabase.storage.from('article_images').getPublicUrl(filePath);
    setIsUploading(false);
    return data.publicUrl;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      // setThumbnailUrl(URL.createObjectURL(file)); // URL 입력창과 분리하기 위해 제거
    }
  };

  const clearThumbnailFile = () => {
    setThumbnailFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleVisualInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
  };

  const saveArticle = async (isPublished: boolean) => {
    if (!title) {
      alert('제목을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    let finalThumbnailUrl = thumbnailUrl;

    if (thumbnailFile) {
      const uploadedUrl = await handleImageUpload(thumbnailFile);
      if (uploadedUrl) {
        finalThumbnailUrl = uploadedUrl;
      }
    }

    const articleData = {
      title,
      content,
      category,
      author_name: author,
      image_url: finalThumbnailUrl,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (articleId) {
      result = await supabase.from('articles').update(articleData).eq('id', articleId);
    } else {
      result = await supabase.from('articles').insert([articleData]);
    }

    setIsLoading(false);

    if (result.error) {
      alert('저장 중 오류가 발생했습니다: ' + result.error.message);
    } else {
      alert(isPublished ? '기사가 발행되었습니다!' : '임시 저장되었습니다.');
      router.push('/admin/articles'); // 수정: 저장 후 기사 관리 페이지로 이동
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold font-serif text-black">
          {articleId ? '기사 수정' : '새 기사 작성'}
        </h1>
        <Link href="/admin/articles" className="text-gray-500 hover:text-black transition">
          목록으로 돌아가기
        </Link>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">카테고리</label>
            <input 
              type="text" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-black"
              placeholder="예: Op-Ed, News, Tech..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">작성자 (Author)</label>
            <input 
              type="text" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-black"
              placeholder="작성자 이름"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">제목</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded text-lg font-serif focus:outline-none focus:ring-2 focus:ring-black text-black"
            placeholder="기사 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">썸네일 이미지</label>
          <div className="flex items-start space-x-6">
            <div className="flex-1 space-y-4">
              {/* 1. 파일 업로드 방식 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">방법 1: 파일 직접 업로드</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleThumbnailChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none text-black"
                  />
                  {thumbnailFile && (
                    <button 
                      type="button" 
                      onClick={clearThumbnailFile} 
                      className="px-3 py-2 bg-red-50 text-red-600 rounded text-sm font-bold shrink-0 border border-red-200 hover:bg-red-100"
                    >
                      취소
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">jpg, png, webp 형식의 이미지를 업로드해주세요.</p>
              </div>

              {/* 2. URL 입력 방식 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">방법 2: 이미지 URL 입력 (파일 업로드 시 무시됨)</label>
                <input 
                  type="url" 
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={!!thumbnailFile}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-black disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>
            
            {/* 썸네일 미리보기 */}
            {(thumbnailFile || thumbnailUrl) && (
              <div className="w-48 h-32 relative border border-gray-200 rounded overflow-hidden shadow-sm shrink-0 bg-gray-50 flex items-center justify-center">
                <img 
                  src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : thumbnailUrl} 
                  alt="Thumbnail Preview" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-300 rounded shadow-sm overflow-hidden text-black">
          <div className="bg-gray-50 flex items-center p-2 border-b border-gray-300 gap-2">
            <button 
              onClick={() => setEditorMode('visual')}
              className={`px-4 py-2 text-sm font-bold rounded transition ${editorMode === 'visual' ? 'bg-black text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
            >
              일반 글쓰기
            </button>
            <button 
              onClick={() => setEditorMode('html')}
              className={`px-4 py-2 text-sm font-bold rounded transition ${editorMode === 'html' ? 'bg-black text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
            >
              HTML 에디터
            </button>
            <button 
              onClick={() => setEditorMode('preview')}
              className={`px-4 py-2 text-sm font-bold rounded transition ${editorMode === 'preview' ? 'bg-black text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
            >
              미리보기
            </button>
          </div>

          {editorMode === 'visual' && (
            <div className="bg-white border-b border-gray-200 p-2 flex gap-2 text-gray-700 flex-wrap">
              <button onClick={() => executeCommand('formatBlock', 'H1')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold text-sm">H1</button>
              <button onClick={() => executeCommand('formatBlock', 'H2')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold text-sm">H2</button>
              <button onClick={() => executeCommand('formatBlock', 'P')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold text-sm">본문(P)</button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={() => executeCommand('bold')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 font-bold text-sm">B</button>
              <button onClick={() => executeCommand('italic')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 italic font-serif text-sm">I</button>
              <button onClick={() => executeCommand('underline')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 underline text-sm">U</button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={() => executeCommand('justifyLeft')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">좌측 정렬</button>
              <button onClick={() => executeCommand('justifyCenter')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">중앙 정렬</button>
            </div>
          )}
          
          <div className="bg-white min-h-[500px]">
            {editorMode === 'visual' && (
              <div 
                ref={editorRef}
                contentEditable
                onInput={handleVisualInput}
                className="w-full min-h-[500px] p-6 font-serif text-gray-800 text-lg focus:outline-none prose max-w-none"
                style={{ outline: 'none' }}
              />
            )}
            
            {editorMode === 'html' && (
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[500px] p-6 font-mono text-sm bg-gray-50 border-none focus:outline-none resize-y text-black"
                placeholder="<p>여기에 HTML 코드를 직접 입력하세요.</p>"
              />
            )}

            {editorMode === 'preview' && (
              <div 
                className="prose max-w-none font-serif text-gray-800 p-6 min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">내용이 없습니다.</p>' }}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button 
            onClick={() => saveArticle(false)}
            disabled={isLoading || isUploading}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition disabled:opacity-50"
          >
            임시 저장
          </button>
          <button 
            onClick={() => saveArticle(true)}
            disabled={isLoading || isUploading}
            className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '발행하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Next.js 빌드 오류 방지를 위해 Suspense로 감싸기
export default function WriteArticlePage() {
  return (
    <Suspense fallback={<div className="text-center p-10 text-black">에디터 로딩 중...</div>}>
      <WriteArticleForm />
    </Suspense>
  );
}
