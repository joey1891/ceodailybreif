'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // WYSIWYG 에디터 스타일 불러오기

// Next.js 환경에서 에디터의 SSR(서버사이드렌더링) 충돌 방지를 위해 동적 임포트 적용
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function WriteArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('NEWS');
  const [imageUrl, setImageUrl] = useState('');
  const [authorName, setAuthorName] = useState('편집국');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, isPublished: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('articles').insert([{
      title,
      content,
      category,
      image_url: imageUrl,
      author_name: authorName,
      is_published: isPublished
    }]);

    setIsSubmitting(false);

    if (error) {
      alert('기사 저장 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert(isPublished ? '기사가 성공적으로 발행되었습니다.' : '임시저장 되었습니다.');
      router.push('/admin/articles');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-200">
      <h1 className="text-3xl font-bold mb-8 font-serif border-b pb-4">새 기사 작성</h1>
      
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans"
            >
              <option value="NEWS">뉴스 (News)</option>
              <option value="EDITORIAL">사설 (Editorial)</option>
              <option value="PHOTO">사진 (Photo)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">작성자 / 기자 이름</label>
            <input 
              type="text" 
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="예: 편집국, 김철수 기자"
              className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">기사 제목</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="기사 제목을 입력하세요"
            className="w-full border border-gray-300 rounded p-3 text-lg font-bold font-serif focus:ring-black focus:border-black"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">메인 이미지 URL (썸네일)</label>
          <input 
            type="url" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded p-2 focus:ring-black focus:border-black font-sans"
          />
        </div>

        <div className="mb-12">
          <label className="block text-sm font-bold text-gray-700 mb-2">본문 내용 (에디터)</label>
          <div className="bg-white">
            <ReactQuill 
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="기사 본문을 작성하세요... (이미지, 동영상 링크, 글씨 굵기 등 자유롭게 편집 가능합니다.)"
              className="h-96 mb-12 font-sans"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }], // 헤딩(제목) 크기 조절
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'], // 글씨 스타일 및 인용구
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }], // 리스트
                  ['link', 'image', 'video'], // 외부 링크, 이미지, 유튜브/비디오 삽입
                  ['clean'] // 서식 지우기
                ],
              }}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button 
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition font-sans"
          >
            임시 저장
          </button>
          <button 
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting}
            className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-red-700 transition font-sans"
          >
            기사 발행
          </button>
        </div>
      </form>
    </div>
  );
}