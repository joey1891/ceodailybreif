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
  
  // 💡 카테고리 상태 및 동적 로딩을 위한 상태 추가
  const [category, setCategory] = useState('Politics & Policy');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState('Editor-in-Chief');
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 기본적으로 로딩 상태로 시작

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
    // 💡 DB에서 고유 카테고리 목록을 동적으로 가져오는 함수
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('articles').select('category');
      if (data && !error) {
        // DB에 있는 모든 카테고리를 가져와 중복 제거
        const uniqueCategories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));
        
        // 만약 DB가 비어있다면 기본값 세팅
        if (uniqueCategories.length === 0) {
            uniqueCategories.push('Politics & Policy', 'Economy & Markets', 'Chaebol & Industry', 'Tech & Innovation', 'K-BEAUTY TRENDS', 'K-Culture & Society');
        }
        setAvailableCategories(uniqueCategories as string[]);
        
        // editId가 없다면(새 글 작성) 첫 번째 카테고리를 기본값으로 설정
        if (!editId && uniqueCategories.length > 0) {
            setCategory(uniqueCategories[0]);
        }
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
    };

    // 로딩 처리 통합
    Promise.all([fetchCategories(), fetchArticle()]).finally(() => setIsLoading(false));

  }, [editId]);

  // ... (이후 썸네일, 해시태그 핸들러 등은 기존 코드와 동일하여 생략, 아래 렌더링 부분만 변경) ...

  // return () 내부 카테고리 렌더링 영역 수정
  if (isLoading) return <div className="text-center py-20 font-bold text-black">데이터 로딩중...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 p-8 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-black">새 기사 작성</h1>
          <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-black">목록으로 돌아가기</Link>
        </div>
        
        <form className="space-y-6 text-black">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
              {/* 💡 하드코딩된 옵션을 제거하고 상태(availableCategories) 기반으로 동적 렌더링 */}
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
              >
                {availableCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {/* ... 기존 코드 계속 ... */}
