'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
  },
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center bg-gray-50 text-black">에디터 로딩중...</div> }
);

// 지원할 다국어 목록
const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English (영어)' },
  { code: 'zh', label: '中文 (중국어)' },
  { code: 'ja', label: '日本語 (일본어)' },
  { code: 'vi', label: 'Tiếng Việt (베트남어)' },
  { code: 'ru', label: 'Русский (러시아어)' },
] as const;

type LangCode = typeof LANGUAGES[number]['code'];
type MultiLangState = Record<LangCode, string>;

const initialTextState: MultiLangState = { ko: '', en: '', zh: '', ja: '', vi: '', ru: '' };

function WriteArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // 현재 선택된 언어 탭 상태
  const [currentLang, setCurrentLang] = useState<LangCode>('ko');

  // 다국어 상태 관리 (객체 형태)
  const [title, setTitle] = useState<MultiLangState>(initialTextState);
  const [content, setContent] = useState<MultiLangState>(initialTextState);
  
  const [category, setCategory] = useState('Politics & Policy');
  const [imageUrl, setImageUrl] = useState('');
  const [authorName, setAuthorName] = useState('편집국');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      const fetchArticle = async () => {
        const { data, error } = await supabase.from('articles').select('*').eq('id', editId).single();
        if (data) {
          // 기존 데이터가 문자열일 경우(마이그레이션 전) 한국어에 할당, 객체일 경우 전체 덮어쓰기
          setTitle(typeof data.title === 'string' ? { ...initialTextState, ko: data.title } : { ...initialTextState, ...(data.title || {}) });
          setContent(typeof data.content === 'string' ? { ...initialTextState, ko: data.content } : { ...initialTextState, ...(data.content || {}) });
          setCategory(data.category);
          setImageUrl(data.image_url || '');
          setAuthorName(data.author_name);
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [editId]);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  }), []);

  const handleSubmit = async (e: React.FormEvent, isPublished: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);

    const articleData = {
      title, // 이제 객체가 저장됨 { ko: "...", en: "..." }
      content, // 이제 객체가 저장됨 { ko: "...", en: "..." }
      category, 
      image_url: imageUrl, 
      author_name: authorName, 
      is_published: isPublished,
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
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-200">
      <h1 className="text-3xl font-bold mb-8 font-serif border-b pb-4 text-black">
        {editId ? '📝 기사 수정하기' : '새 기사 작성'}
      </h1>
      
      <form className="space-y-6 text-black">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans">
              <option value="Politics & Policy">정치 & 정책 (Politics & Policy)</option>
              <option value="Economy & Markets">경제 & 시장 (Economy & Markets)</option>
              <option value="Chaebol & Industry">재벌 & 산업 (Chaebol & Industry)</option>
              <option value="Tech & Innovation">기술 & 혁신 (Tech & Innovation)</option>
              <option value="K-Beauty">K-뷰티 (K-Beauty)</option>
              <option value="K-Culture & Society">K-컬쳐 & 사회 (K-Culture & Society)</option>
              <option value="Editorial">사설 (Editorial)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">작성자 / 기자 이름</label>
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="예: 편집국" className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">메인 이미지 URL (썸네일)</label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans" />
        </div>

        {/* === 언어 선택 탭 UI === */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setCurrentLang(lang.code)}
                className={`
                  whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                  ${currentLang === lang.code 
                    ? 'border-black text-black font-bold' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {lang.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 언어별 제목 입력 */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            기사 제목 <span className="text-blue-600">[{LANGUAGES.find(l => l.code === currentLang)?.label}]</span>
          </label>
          <input 
            type="text" 
            value={title[currentLang]} 
            onChange={(e) => setTitle({ ...title, [currentLang]: e.target.value })} 
            placeholder={`${LANGUAGES.find(l => l.code === currentLang)?.label} 제목을 입력하세요`} 
            className="w-full border border-gray-300 rounded p-3 text-lg font-bold font-serif focus:ring-black focus:border-black bg-white" 
            required={currentLang === 'ko'} // 한국어는 필수
          />
        </div>

        {/* 언어별 본문 입력 */}
        <div className="mb-12 bg-gray-50 p-4 rounded-md border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            본문 내용 <span className="text-blue-600">[{LANGUAGES.find(l => l.code === currentLang)?.label}]</span>
          </label>
          <div className="bg-white">
            <ReactQuill 
              theme="snow" 
              value={content[currentLang]} 
              onChange={(val) => setContent({ ...content, [currentLang]: val })} 
              className="h-96 mb-12 font-sans" 
              modules={modules} 
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={isSubmitting} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition">
            임시 저장
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting} className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition">
            {editId ? '수정/발행' : '기사 발행'}
          </button>
        </div>
      </form>
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
