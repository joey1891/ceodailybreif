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

function WriteArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Politics & Policy'); // 기본값 변경
  const [imageUrl, setImageUrl] = useState('');
  const [authorName, setAuthorName] = useState('편집국');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      const fetchArticle = async () => {
        const { data, error } = await supabase.from('articles').select('*').eq('id', editId).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
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
      title, content, category, image_url: imageUrl, author_name: authorName, is_published: isPublished,
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
              {/* === 수정된 카테고리 목록 === */}
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
          <label className="block text-sm font-bold text-gray-700 mb-2">기사 제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="기사 제목을 입력하세요" className="w-full border border-gray-300 rounded p-3 text-lg font-bold font-serif focus:ring-black focus:border-black" required />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">메인 이미지 URL (썸네일)</label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans" />
        </div>

        <div className="mb-12">
          <label className="block text-sm font-bold text-gray-700 mb-2">본문 내용 (에디터)</label>
          <div className="bg-white">
            <ReactQuill theme="snow" value={content} onChange={setContent} className="h-96 mb-12 font-sans" modules={modules} />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={isSubmitting} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition">
            임시 저장
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting} className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-red-700 transition">
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